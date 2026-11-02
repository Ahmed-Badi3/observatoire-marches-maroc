"""Nettoie l'historique du MASI (Bourse de Casablanca) et le charge dans PostgreSQL."""
from pathlib import Path

import pandas as pd
from sqlalchemy import URL, create_engine, text
from sqlalchemy.exc import SQLAlchemyError

from config import PG

RACINE = Path(__file__).resolve().parent.parent
DOSSIER = RACINE / "data" / "raw" / "masi"
SORTIE = RACINE / "data" / "processed" / "masi_quotidien.csv"


def en_nombre(serie):
    """'16 537,91' -> 16537.91 ; '-1,57%' -> -1.57"""
    texte = (serie.astype("string")
             .str.replace("\u00a0", "", regex=False)    # espace insécable
             .str.replace("\u202f", "", regex=False)    # espace fine insécable
             .str.replace(" ", "", regex=False)
             .str.replace("%", "", regex=False)
             .str.replace(",", ".", regex=False)
             .str.strip())
    return pd.to_numeric(texte, errors="coerce").astype("float64")


# 1) Lire et empiler tous les exports du dossier (un ou plusieurs fichiers)
morceaux = [pd.read_csv(f, sep=";", encoding="utf-8-sig", dtype=str)
            for f in sorted(DOSSIER.glob("*.csv"))]
brut = pd.concat(morceaux, ignore_index=True)
print(f"Fichiers lus : {len(morceaux)} | lignes brutes : {len(brut)}")

# 2) Nettoyer : noms de colonnes simples, dates, nombres
df = pd.DataFrame({
    "date": pd.to_datetime(brut["Séance"], format="%d/%m/%Y", errors="coerce"),
    "indice": brut["Indice"].str.strip(),
    "cloture": en_nombre(brut["Valeur indice"]),
    "plus_haut": en_nombre(brut["Plus haut"]),
    "plus_bas": en_nombre(brut["Plus bas"]),
    "var_quotidienne_pct": en_nombre(brut["Variation quotidienne"]),
    "var_annuelle_pct": en_nombre(brut["Variation annuelle"]),
})

# 3) Contrôles qualité
invalides = df["date"].isna() | df["cloture"].isna()
if invalides.any():
    print(f"  ! {invalides.sum()} ligne(s) sans date ou sans clôture -> supprimées")
df = df[~invalides]

avant = len(df)
df = df.drop_duplicates(["date", "indice"]).sort_values("date").reset_index(drop=True)
print(f"Doublons supprimés : {avant - len(df)}")

# La variation recalculée doit coller à celle publiée (à l'arrondi près)
recalc = df.groupby("indice")["cloture"].pct_change() * 100
ecart = (recalc - df["var_quotidienne_pct"]).abs()
print(f"Contrôle variation : {(ecart > 0.02).sum()} séance(s) avec un écart > 0,02 pt")

print(f"Période : {df['date'].min():%d/%m/%Y} -> {df['date'].max():%d/%m/%Y} "
      f"| {len(df)} séances")

df["date"] = df["date"].dt.date
df.to_csv(SORTIE, index=False, encoding="utf-8-sig")

# 4) Charger dans PostgreSQL
url = URL.create("postgresql+psycopg", username=PG["user"], password=PG["password"],
                 host=PG["host"], port=PG["port"], database=PG["dbname"])
engine = create_engine(url)

CREATION = """
CREATE TABLE IF NOT EXISTS staging.bvc_indices (
    date                 DATE              NOT NULL,
    indice               VARCHAR(30)       NOT NULL,
    cloture              DOUBLE PRECISION,
    plus_haut            DOUBLE PRECISION,
    plus_bas             DOUBLE PRECISION,
    var_quotidienne_pct  DOUBLE PRECISION,
    var_annuelle_pct     DOUBLE PRECISION,
    PRIMARY KEY (date, indice)
);
"""

try:
    with engine.begin() as conn:
        conn.execute(text(CREATION))
        # On remplace uniquement les indices présents dans le fichier (MASI, MASI 20...)
        for nom in df["indice"].unique():
            conn.execute(text("DELETE FROM staging.bvc_indices WHERE indice = :n"), {"n": nom})
        df.to_sql("bvc_indices", conn, schema="staging", if_exists="append", index=False)
        n = conn.execute(text("SELECT COUNT(*) FROM staging.bvc_indices")).scalar()
        print(f"\nstaging.bvc_indices : {n} lignes")
except SQLAlchemyError as e:
    print("\nERREUR PostgreSQL :", getattr(e, "orig", e))
    raise SystemExit(1)

print("Chargement terminé.")