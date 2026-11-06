"""Charge les 4 CSV AMMC dans les tables staging de PostgreSQL."""
from pathlib import Path

import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

from connexion import url_sqlalchemy

SORTIE = Path(__file__).resolve().parent.parent / "data" / "processed"

# La connexion (locale ou DATABASE_URL) est choisie par scripts/connexion.py
engine = create_engine(url_sqlalchemy())

TABLES = {
    "ammc_actif_net.csv": "ammc_actif_net",
    "ammc_indices.csv": "ammc_indices",
    "ammc_actif_valeurs.csv": "ammc_actif_valeurs",
    "ammc_flux.csv": "ammc_flux",
}
COLONNES_TEXTE = {"date", "categorie", "poste"}


def en_nombre(serie):
    """'1 234,56' -> 1234.56 ; '-' -> 0 ; texte -> vide (NaN)."""
    texte = (serie.astype("string")
             .str.replace("\u00a0", "", regex=False)   # espace insécable
             .str.replace(" ", "", regex=False)
             .str.replace(",", ".", regex=False)
             .str.strip())
    texte = texte.mask(texte == "-", "0")              # un tiret seul = zéro dans les tableaux AMMC
    return pd.to_numeric(texte, errors="coerce").astype("float64")


def preparer(df, nom):
    """Met chaque colonne au bon type et signale les valeurs non convertibles."""
    df["date"] = pd.to_datetime(df["date"]).dt.date
    for col in df.columns:
        if col in COLONNES_TEXTE:
            continue
        nombres = en_nombre(df[col])
        rejets = df[col].notna() & nombres.isna()
        if rejets.any():
            print(f"  ! {nom}.{col} : {rejets.sum()} valeur(s) non numérique(s) -> vides")
            print(df.loc[rejets, ["date", col]].head(5).to_string(index=False))
        df[col] = nombres
    if "nb_opcvm" in df.columns:
        df["nb_opcvm"] = df["nb_opcvm"].round().astype("Int64")
    return df


try:
    # engine.begin() = tout ou rien : si une table échoue, rien n'est modifié
    with engine.begin() as conn:
        for fichier, table in TABLES.items():
            df = pd.read_csv(SORTIE / fichier, encoding="utf-8-sig")
            df = preparer(df, table)

            conn.execute(text(f"TRUNCATE staging.{table}"))   # on vide avant de recharger
            df.to_sql(table, conn, schema="staging", if_exists="append", index=False)

            n = conn.execute(text(f"SELECT COUNT(*) FROM staging.{table}")).scalar()
            print(f"staging.{table:<22} {n:>6} lignes chargées")
except SQLAlchemyError as e:
    # Message court au lieu de la requête SQL géante
    print("\nERREUR PostgreSQL :", getattr(e, "orig", e))
    raise SystemExit(1)

print("\nChargement terminé.")