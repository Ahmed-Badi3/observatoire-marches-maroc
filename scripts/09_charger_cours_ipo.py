"""
09_charger_cours_ipo.py
Charge les cours quotidiens des titres introduits en bourse (et du MASI)
depuis data/raw/ipo/<TICKER>.xlsx | .xls | .csv vers staging.bvc_cours_titres.

Nom du fichier = ticker : CFG, CMG, VIC, CAP, SGTM, T2S, MASI (ex. data/raw/ipo/SGTM.xlsx)

Lancer depuis la racine du projet :
    python scripts/09_charger_cours_ipo.py
"""
import sys
import unicodedata
from pathlib import Path

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

from config import PG

RACINE = Path(__file__).resolve().parent.parent
DOSSIER = RACINE / "data" / "raw" / "ipo"
EXTENSIONS = (".xlsx", ".xls", ".csv")

SQL_TABLE = """
CREATE TABLE IF NOT EXISTS staging.bvc_cours_titres (
    ticker       text        NOT NULL,
    date_seance  date        NOT NULL,
    cloture      numeric     NOT NULL,
    fichier      text,
    charge_le    timestamptz DEFAULT now(),
    PRIMARY KEY (ticker, date_seance)
);
"""

SQL_UPSERT = """
INSERT INTO staging.bvc_cours_titres (ticker, date_seance, cloture, fichier)
VALUES %s
ON CONFLICT (ticker, date_seance) DO UPDATE
SET cloture = EXCLUDED.cloture,
    fichier = EXCLUDED.fichier,
    charge_le = now();
"""


def normaliser(texte):
    """'Cours de clôture' -> 'cours de cloture' (minuscules, sans accents)."""
    texte = unicodedata.normalize("NFKD", str(texte)).encode("ascii", "ignore").decode()
    return " ".join(texte.lower().replace("_", " ").split())


def nombre(valeur):
    """Convertit '17 359,12', '1.234,56', '1,234.56' ou 120.95 en float."""
    if valeur is None:
        return None
    if isinstance(valeur, (int, float)):
        return None if pd.isna(valeur) else float(valeur)
    s = str(valeur).replace("\xa0", "").replace("\u202f", "").replace(" ", "").strip()
    if s in ("", "-", "--", "nan", "None"):
        return None
    if "," in s and "." in s:
        # le dernier séparateur est la décimale
        if s.rfind(",") > s.rfind("."):
            s = s.replace(".", "").replace(",", ".")
        else:
            s = s.replace(",", "")
    else:
        s = s.replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def lire_brut(chemin):
    if chemin.suffix.lower() in (".xlsx", ".xls"):
        return pd.read_excel(chemin, header=None)
    for encodage in ("utf-8-sig", "latin-1"):
        try:
            return pd.read_csv(chemin, sep=None, engine="python", header=None,
                               encoding=encodage, dtype=str)
        except UnicodeDecodeError:
            continue
    raise ValueError("encodage du CSV non reconnu")


def lire_fichier(chemin):
    """Trouve la ligne d'en-tête (celle qui contient 'date' ou 'seance')."""
    brut = lire_brut(chemin)
    for i in range(min(30, len(brut))):
        valeurs = [normaliser(v) for v in brut.iloc[i].tolist()]
        if any(("date" in v or "seance" in v) for v in valeurs):
            df = brut.iloc[i + 1:].copy()
            df.columns = valeurs
            return df
    raise ValueError("ligne d'en-tête introuvable (aucune colonne 'Date' ou 'Séance')")


def choisir_colonnes(colonnes):
    col_date = next((c for c in colonnes if "date" in c or "seance" in c), None)
    col_cours = None
    for mot in ("cloture", "dernier cours", "dernier", "close", "valeur", "cours"):
        col_cours = next(
            (c for c in colonnes
             if mot in c and "veille" not in c and "reference" not in c and "date" not in c),
            None,
        )
        if col_cours:
            break
    return col_date, col_cours


def preparer(chemin):
    ticker = chemin.stem.upper()
    df = lire_fichier(chemin)
    col_date, col_cours = choisir_colonnes(list(df.columns))
    if not col_date or not col_cours:
        raise ValueError(f"colonnes non trouvées. Colonnes du fichier : {list(df.columns)}")

    sortie = pd.DataFrame({
        "date_seance": pd.to_datetime(df[col_date], dayfirst=True, errors="coerce", format="mixed"),
        "cloture": df[col_cours].map(nombre),
    }).dropna()
    sortie = sortie[sortie["cloture"] > 0]
    sortie = sortie.drop_duplicates("date_seance", keep="last").sort_values("date_seance")
    sortie["date_seance"] = sortie["date_seance"].dt.date
    return ticker, col_date, col_cours, sortie


def controle_sauts(ticker, df):
    """Signale les variations de plus de 15 % en une séance (hors 10 premières séances) :
    souvent une division du nominal, qui fausserait les rendements."""
    if ticker == "MASI" or len(df) < 12:
        return
    variation = df["cloture"].pct_change()
    suspects = df[(variation.abs() > 0.15) & (pd.Series(range(len(df)), index=df.index) >= 10)]
    for _, ligne in suspects.iterrows():
        print(f"   ⚠ saut suspect le {ligne['date_seance']} (clôture {ligne['cloture']}) : "
              f"vérifier une éventuelle division du nominal")


def main():
    fichiers = sorted(p for p in DOSSIER.glob("*") if p.suffix.lower() in EXTENSIONS)
    if not fichiers:
        sys.exit(f"Aucun fichier dans {DOSSIER}")

    conn = psycopg2.connect(**PG)
    cur = conn.cursor()
    cur.execute(SQL_TABLE)
    conn.commit()

    total = 0
    for chemin in fichiers:
        try:
            ticker, col_date, col_cours, df = preparer(chemin)
        except Exception as erreur:
            print(f"✗ {chemin.name} : {erreur}")
            continue
        lignes = [(ticker, d, c, chemin.name) for d, c in zip(df["date_seance"], df["cloture"])]
        execute_values(cur, SQL_UPSERT, lignes)
        conn.commit()
        total += len(lignes)
        print(f"✓ {ticker:<10} {len(lignes):>4} séances  {df['date_seance'].min()} → "
              f"{df['date_seance'].max()}  1re clôture {df['cloture'].iloc[0]}  "
              f"(colonnes : '{col_date}', '{col_cours}')")
        controle_sauts(ticker, df)

    # droits de lecture pour l'agent analyste (n8n)
    for table in ("staging.bvc_cours_titres", "staging.bam_courbe_taux"):
        try:
            cur.execute(f"GRANT SELECT ON {table} TO agent_lecture;")
            conn.commit()
        except psycopg2.Error as erreur:
            conn.rollback()
            print(f"(GRANT ignoré sur {table} : {erreur.pgerror or erreur})")

    cur.close()
    conn.close()
    print(f"Terminé : {total} lignes chargées dans staging.bvc_cours_titres")


if __name__ == "__main__":
    main()
