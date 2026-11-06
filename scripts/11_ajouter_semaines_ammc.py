"""Ajoute les NOUVELLES semaines AMMC aux CSV de data/processed/, sans rien réécrire.

Image : on ajoute une page à la fin du cahier, on ne recopie pas tout le cahier.

Fonctionnement :
  1. Les fichiers Excel de data/raw/ammc/ qui ne sont pas encore dans inventaire_ammc.csv sont « nouveaux »
     (sur GitHub Actions, ce dossier ne contient que ce que 01_telecharger_ammc.py vient de télécharger).
  2. Pour chacun : date, extraction des 4 tableaux (mêmes fonctions que 02 et 03), contrôles.
  3. Les lignes sont AJOUTÉES en bas des 4 CSV et de l'inventaire. Une semaine déjà présente est ignorée :
     relancer le script deux fois n'ajoute rien.

    python scripts/11_ajouter_semaines_ammc.py            # ajoute
    python scripts/11_ajouter_semaines_ammc.py --essai    # montre ce qui serait ajouté, sans écrire

Code de sortie 1 si un fichier nouveau est illisible ou incohérent (le workflow le signalera).
"""
import sys
from importlib import import_module
from pathlib import Path

import pandas as pd

inventaire_mod = import_module("02_inventaire_ammc")
extraction_mod = import_module("03_extraire_ammc")

RACINE = Path(__file__).resolve().parent.parent
DOSSIER_BRUT = RACINE / "data" / "raw" / "ammc"
PROCESSED = RACINE / "data" / "processed"
INVENTAIRE = PROCESSED / "inventaire_ammc.csv"
COLONNES_INVENTAIRE = ["fichier", "date", "source_date", "flux", "indices", "statut"]

# Ordre de extraire() : actif net, indices, actif des valeurs, flux
CSV_PAR_BLOC = ["ammc_actif_net.csv", "ammc_indices.csv", "ammc_actif_valeurs.csv", "ammc_flux.csv"]

ESSAI = "--essai" in sys.argv


def fin_de_ligne(chemin):
    """Garde la fin de ligne du fichier (Windows \\r\\n ou Linux \\n) pour ne pas mélanger les deux."""
    return "\r\n" if b"\r\n" in chemin.read_bytes()[:5000] else "\n"


def ajouter(chemin, table):
    """Ajoute des lignes en bas d'un CSV existant, dans l'ordre de ses colonnes."""
    en_tete = pd.read_csv(chemin, encoding="utf-8-sig", nrows=0).columns.tolist()
    fin = fin_de_ligne(chemin)
    contenu = chemin.read_bytes()
    if not contenu.endswith((b"\n", b"\r")):
        with open(chemin, "ab") as f:                      # fichier sans retour à la ligne final
            f.write(fin.encode())
    table[en_tete].to_csv(chemin, mode="a", header=False, index=False,
                          encoding="utf-8", lineterminator=fin)


def main():
    inv = pd.read_csv(INVENTAIRE, encoding="utf-8-sig")
    connus = set(inv["fichier"])
    nouveaux = sorted((f for f in DOSSIER_BRUT.glob("*.xls*") if f.name not in connus), reverse=True)
    if not nouveaux:
        print("Rien de nouveau : tous les fichiers sont déjà dans l'inventaire.")
        return 0

    dates_en_base = set(pd.read_csv(PROCESSED / "ammc_actif_net.csv", encoding="utf-8-sig",
                                    usecols=["date"])["date"])
    blocs_a_ajouter = [[], [], [], []]
    lignes_inventaire, erreurs, semaines = [], [], []

    # Ordre décroissant des noms : comme en 03, la version la plus récente d'une semaine passe d'abord
    for chemin in nouveaux:
        info = inventaire_mod.analyser_fichier(chemin)
        if info["statut"] != "ok":
            erreurs.append((chemin.name, info["statut"]))
            continue
        date_iso = info["date"].strftime("%Y-%m-%d")
        info["date"] = date_iso

        if date_iso in dates_en_base or date_iso in semaines:
            print(f"  = {chemin.name} : semaine {date_iso} déjà présente, ignorée (inventoriée).")
            lignes_inventaire.append(info)
            continue
        try:
            blocs = extraction_mod.extraire(chemin.name, date_iso, DOSSIER_BRUT)
            if any(len(b) == 0 for b in blocs) or "Total" not in set(blocs[0]["categorie"]):
                raise ValueError("un tableau est vide ou la ligne Total manque")
            if len(extraction_mod.semaines_incoherentes(blocs[3])):
                raise ValueError("somme des catégories ≠ Total pour les souscriptions")
        except Exception as e:
            erreurs.append((chemin.name, f"{type(e).__name__}: {e}"))
            continue

        for liste, bloc in zip(blocs_a_ajouter, blocs):
            liste.append(bloc)
        lignes_inventaire.append(info)
        semaines.append(date_iso)
        print(f"  + {chemin.name} : semaine {date_iso}, "
              + ", ".join(f"{len(b)} lignes" for b in blocs))

    if lignes_inventaire and not ESSAI:
        for nom_csv, morceaux in zip(CSV_PAR_BLOC, blocs_a_ajouter):
            if morceaux:
                ajouter(PROCESSED / nom_csv, pd.concat(morceaux, ignore_index=True))
        table_inv = pd.DataFrame(lignes_inventaire)[COLONNES_INVENTAIRE]
        ajouter(INVENTAIRE, table_inv)

    verbe = "seraient ajoutées" if ESSAI else "ajoutées"
    print(f"\nSemaines {verbe} : {len(semaines)} {sorted(semaines)}")
    if erreurs:
        print("\nERREUR, fichiers nouveaux non traités :")
        for nom, cause in erreurs:
            print(f"  - {nom} : {cause}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
