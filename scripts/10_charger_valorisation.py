"""Charge data/processed/valorisation_marche.csv (PER et dividendes) dans staging.valorisation_marche.

Pourquoi ce script : n8n écrit ces chiffres dans la base locale seulement. Le CSV, lui, est sur
GitHub : c'est la copie de référence qui permet de remplir la base Supabase.

Image : on recopie un carnet de notes dans un autre. Une ligne déjà présente (même année, périmètre,
source et article) est mise à jour, pas dupliquée : le script est relançable sans risque.

Pour exporter le CSV depuis la base locale après un passage de n8n :
    python scripts/10_charger_valorisation.py --exporter
"""
import sys
from pathlib import Path

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

from connexion import PG

CSV = Path(__file__).resolve().parent.parent / "data" / "processed" / "valorisation_marche.csv"

COLONNES = ["annee", "perimetre", "per", "rendement_dividende_pct", "estimation",
            "source", "url_article", "date_article", "date_extraction"]

UPSERT = """
    INSERT INTO staging.valorisation_marche
        (annee, perimetre, per, rendement_dividende_pct, estimation,
         source, url_article, date_article, date_extraction)
    VALUES %s
    ON CONFLICT ON CONSTRAINT valorisation_unique DO UPDATE
    SET per = EXCLUDED.per,
        rendement_dividende_pct = EXCLUDED.rendement_dividende_pct,
        estimation = EXCLUDED.estimation,
        date_article = EXCLUDED.date_article,
        date_extraction = EXCLUDED.date_extraction
"""


def exporter():
    """Base -> CSV (ordre stable pour que Git ne montre que les vraies modifications)."""
    with psycopg2.connect(**PG) as conn, conn.cursor() as cur:
        cur.execute(
            f"SELECT {', '.join(COLONNES)} FROM staging.valorisation_marche "
            "ORDER BY date_article, source, url_article, annee NULLS FIRST, perimetre"
        )
        df = pd.DataFrame(cur.fetchall(), columns=COLONNES)
    df["annee"] = df["annee"].astype("Int64")
    df.to_csv(CSV, index=False, encoding="utf-8-sig")
    print(f"{len(df)} lignes exportées vers {CSV.relative_to(CSV.parents[2])}")


def charger():
    """CSV -> base."""
    df = pd.read_csv(CSV, encoding="utf-8-sig")
    manquantes = df["date_article"].isna().sum()
    if manquantes:
        sys.exit(f"{manquantes} ligne(s) sans date_article : chaque étude doit avoir sa date de publication.")

    df["annee"] = df["annee"].astype("Int64")
    # NaN -> None pour que PostgreSQL reçoive NULL
    lignes = [
        tuple(None if pd.isna(v) else (v.item() if hasattr(v, "item") else v) for v in ligne)
        for ligne in df[COLONNES].itertuples(index=False, name=None)
    ]
    with psycopg2.connect(**PG) as conn, conn.cursor() as cur:
        execute_values(cur, UPSERT, lignes)
        cur.execute("SELECT COUNT(*) FROM staging.valorisation_marche")
        total = cur.fetchone()[0]
    print(f"{len(lignes)} lignes lues dans le CSV, {total} lignes dans staging.valorisation_marche")


if __name__ == "__main__":
    exporter() if "--exporter" in sys.argv else charger()
