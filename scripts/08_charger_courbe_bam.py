"""Chargement de la courbe des taux BAM -> staging.bam_courbe_taux

Source : data/raw/taux/courbe_bam_brut.csv (produit par 07_collecter_courbe_bam.py)
Upsert : une ligne par (date_courbe, date_echeance) ; relancer ne crée pas de doublons.
"""
from pathlib import Path

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

from connexion import PG

FICHIER_CSV = Path(__file__).resolve().parent.parent / "data" / "raw" / "taux" / "courbe_bam_brut.csv"
COLONNES = ["date_courbe", "date_echeance", "transaction_mmad", "taux_pct", "date_valeur"]

REQUETE = """
    INSERT INTO staging.bam_courbe_taux
        (date_courbe, date_echeance, transaction_mmad, taux_pct, date_valeur)
    VALUES %s
    ON CONFLICT (date_courbe, date_echeance) DO UPDATE SET
        transaction_mmad = EXCLUDED.transaction_mmad,
        taux_pct         = EXCLUDED.taux_pct,
        date_valeur      = EXCLUDED.date_valeur,
        date_chargement  = now()
"""


def main():
    # 1. Lecture du CSV
    df = pd.read_csv(FICHIER_CSV, usecols=COLONNES)
    for col in ["date_courbe", "date_echeance", "date_valeur"]:
        df[col] = pd.to_datetime(df[col]).dt.date
    print(f"CSV lu : {len(df)} lignes, {df['date_courbe'].nunique()} courbes "
          f"({df['date_courbe'].min()} -> {df['date_courbe'].max()})")

    # 2. Les cases vides (NaN) deviennent NULL dans PostgreSQL
    df = df.astype(object).where(pd.notna(df), None)
    lignes = list(df.itertuples(index=False, name=None))

    # 3. Upsert
    with psycopg2.connect(**PG) as conn, conn.cursor() as cur:
        execute_values(cur, REQUETE, lignes, page_size=1000)
        cur.execute("SELECT COUNT(*), COUNT(DISTINCT date_courbe) FROM staging.bam_courbe_taux")
        nb_lignes, nb_courbes = cur.fetchone()
    print(f"Base : {nb_lignes} lignes, {nb_courbes} courbes dans staging.bam_courbe_taux")


if __name__ == "__main__":
    main()