"""Extraction des indicateurs macroéconomiques -> staging.macro_indicateurs

Sources (dossier data/raw/macro) :
  - HCP, IPC mensuel (fichiers "IPC ... mensuel ... .xlsx")
  - HCP, PIB trimestriel (bds.hcp.ma : "Décomposition du PIB ... .xlsx")
  - HCP, chômage trimestriel (bds.hcp.ma : "Taux de chômage ... Trimestriel ... .xlsx")
  - Bank Al-Maghrib, taux directeur (taux_directeur_bam.csv, saisi à la main)
"""
import re
import unicodedata
from pathlib import Path

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

from config import PG

DOSSIER = Path(__file__).resolve().parent.parent / "data" / "raw" / "macro"


def code_indicateur(libelle, prefixe):
    """('Logement, eau, gaz...', 'ipc') -> 'ipc_logement_eau_gaz...' (sans accents ni espaces)"""
    txt = unicodedata.normalize("NFKD", str(libelle)).encode("ascii", "ignore").decode().lower()
    txt = re.sub(r"[^a-z0-9]+", "_", txt).strip("_")
    return f"{prefixe}_{txt[:60]}"


# ---------------------------------------------------------------- IPC mensuel (HCP)
def lire_ipc_hcp(chemin):
    """Format hcp.ma : mois en lignes ('2026/09'), indicateurs en colonnes."""
    brut = pd.read_excel(chemin, header=None)
    ligne_entete = brut.index[brut.eq("Mois").any(axis=1)][0]   # cherche la ligne "Mois"
    df = pd.read_excel(chemin, header=ligne_entete).dropna(axis=1, how="all")

    df = df[df["Mois"].astype(str).str.fullmatch(r"\d{4}/\d{2}")]   # retire la ligne "Source"
    df["date_ref"] = pd.to_datetime(df["Mois"], format="%Y/%m").dt.date

    long = df.drop(columns="Mois").melt(id_vars="date_ref", var_name="libelle", value_name="valeur")
    long["valeur"] = pd.to_numeric(long["valeur"], errors="coerce")
    long = long.dropna(subset=["valeur"])
    long["indicateur"] = long["libelle"].map(lambda x: code_indicateur(x, "ipc"))
    long["frequence"] = "mensuelle"
    long["source"] = "HCP"
    long["fichier"] = chemin.name
    return long


# ---------------------------------------------------------------- PIB / chômage (bds.hcp.ma)
def lire_bds_hcp(chemin, prefixe):
    """Format bds.hcp.ma : périodes en colonnes ('2026T2'...), dimensions en lignes."""
    df = pd.read_excel(chemin, header=0, dtype=str)

    periodes = [c for c in df.columns if re.fullmatch(r"\d{4}T[1-4]", str(c))]
    dims = [c for c in df.columns if c not in periodes]

    df[dims] = df[dims].ffill()                  # recopie les cellules fusionnées vers le bas
    df = df.dropna(subset=periodes, how="all")   # retire les lignes de titre sans chiffres
    df["libelle"] = df[dims].apply(
        lambda ligne: " - ".join(str(v).strip() for v in ligne if pd.notna(v)), axis=1
    )

    long = df.melt(id_vars="libelle", value_vars=periodes, var_name="periode", value_name="valeur")
    # "2026T2" -> 2026-04-01 (premier jour du trimestre)
    long["date_ref"] = pd.PeriodIndex(long["periode"].str.replace("T", "Q"), freq="Q").start_time.date
    long["valeur"] = pd.to_numeric(long["valeur"].str.replace(r"\s", "", regex=True), errors="coerce")
    long = long.dropna(subset=["valeur"])
    long["indicateur"] = long["libelle"].map(lambda x: code_indicateur(x, prefixe))
    long["frequence"] = "trimestrielle"
    long["source"] = "HCP"
    long["fichier"] = chemin.name
    return long.drop(columns="periode")


# ---------------------------------------------------------------- Taux directeur (BAM)
def lire_taux_bam(chemin):
    """CSV saisi à la main depuis bkam.ma (dates d'entrée en vigueur)."""
    df = pd.read_csv(chemin)
    df["date_ref"] = pd.to_datetime(df["date_effet"]).dt.date
    df["indicateur"] = "taux_directeur"
    df["libelle"] = "Taux directeur Bank Al-Maghrib (%)"
    df["valeur"] = df["taux_pct"]
    df["frequence"] = "evenementielle"
    df["source"] = "BAM (" + df["source"] + ")"
    df["fichier"] = chemin.name
    return df


# ---------------------------------------------------------------- Programme principal
def main():
    sources = [
        ("IPC*mensuel*.xlsx", lire_ipc_hcp),
        ("*composition*PIB*.xlsx", lambda f: lire_bds_hcp(f, "pib")),
        ("*ch*mage*Trimestriel*.xlsx", lambda f: lire_bds_hcp(f, "chomage")),
        ("taux_directeur_bam.csv", lire_taux_bam),
    ]

    frames = []
    for motif, fonction in sources:
        fichiers = sorted(DOSSIER.glob(motif))
        print(f"{motif:32} -> {len(fichiers)} fichier(s)")
        frames += [fonction(f) for f in fichiers]

    if not frames:
        raise SystemExit(f"Aucun fichier trouvé dans {DOSSIER}")

    data = pd.concat(frames).drop_duplicates(subset=["date_ref", "indicateur"])

    colonnes = ["date_ref", "indicateur", "libelle", "valeur", "frequence", "source", "fichier"]
    lignes = list(data[colonnes].itertuples(index=False, name=None))

    sql = f"""
        INSERT INTO staging.macro_indicateurs ({", ".join(colonnes)})
        VALUES %s
        ON CONFLICT (date_ref, indicateur) DO UPDATE
        SET valeur = EXCLUDED.valeur, libelle = EXCLUDED.libelle,
            source = EXCLUDED.source, fichier = EXCLUDED.fichier, date_chargement = now();
    """
    with psycopg2.connect(**PG) as conn, conn.cursor() as cur:
        execute_values(cur, sql, lignes)

    print(f"{len(lignes)} lignes chargées ({data['indicateur'].nunique()} indicateurs)")
    print(data.groupby("frequence")["indicateur"].nunique().to_string())


if __name__ == "__main__":
    main()