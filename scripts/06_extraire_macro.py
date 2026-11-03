"""Extraction des indices IPC mensuels du HCP -> staging.macro_indicateurs"""
import re
import unicodedata
from pathlib import Path

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

from config import PG

DOSSIER = Path(__file__).resolve().parent.parent / "data" / "raw" / "macro"


def code_indicateur(libelle):
    """'Logement, eau, gaz...' -> 'ipc_logement_eau_gaz...' (sans accents ni espaces)"""
    txt = unicodedata.normalize("NFKD", libelle).encode("ascii", "ignore").decode().lower()
    txt = re.sub(r"[^a-z0-9]+", "_", txt).strip("_")
    return "ipc_" + txt[:60]


def lire_ipc_hcp(chemin):
    # 1. Trouver la ligne d'en-tête (celle qui contient "Mois") au lieu de la coder en dur
    brut = pd.read_excel(chemin, header=None)
    ligne_entete = brut.index[brut.eq("Mois").any(axis=1)][0]
    df = pd.read_excel(chemin, header=ligne_entete).dropna(axis=1, how="all")

    # 2. Garder uniquement les lignes au format AAAA/MM (élimine la ligne "Source")
    df = df[df["Mois"].astype(str).str.fullmatch(r"\d{4}/\d{2}")]
    df["date_ref"] = pd.to_datetime(df["Mois"], format="%Y/%m").dt.date

    # 3. Format large -> format long
    long = df.drop(columns="Mois").melt(id_vars="date_ref", var_name="libelle", value_name="valeur")
    long["indicateur"] = long["libelle"].map(code_indicateur)
    long["valeur"] = pd.to_numeric(long["valeur"], errors="coerce")
    long = long.dropna(subset=["valeur"])
    long["frequence"] = "mensuelle"
    long["source"] = "HCP"
    long["fichier"] = chemin.name
    return long


def main():
    fichiers = sorted(DOSSIER.glob("IPC*mensuel*.xlsx"))
    print(f"{len(fichiers)} fichier(s) trouvé(s) dans {DOSSIER}")
    if not fichiers:
        raise SystemExit("Aucun fichier IPC mensuel trouvé : vérifie le dossier data/raw/macro")
    data = pd.concat([lire_ipc_hcp(f) for f in fichiers]).drop_duplicates(subset=["date_ref", "indicateur"])

    colonnes = ["date_ref", "indicateur", "libelle", "valeur", "frequence", "source", "fichier"]
    lignes = list(data[colonnes].itertuples(index=False, name=None))

    sql = f"""
        INSERT INTO staging.macro_indicateurs ({", ".join(colonnes)})
        VALUES %s
        ON CONFLICT (date_ref, indicateur) DO UPDATE
        SET valeur = EXCLUDED.valeur, fichier = EXCLUDED.fichier, date_chargement = now();
    """
    with psycopg2.connect(**PG) as conn, conn.cursor() as cur:
        execute_values(cur, sql, lignes)
    print(f"{len(lignes)} lignes chargées ({data['indicateur'].nunique()} indicateurs)")


if __name__ == "__main__":
    main()