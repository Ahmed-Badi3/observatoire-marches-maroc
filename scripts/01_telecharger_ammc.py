"""Télécharge les statistiques hebdomadaires OPCVM depuis le site de l'AMMC.

Par défaut : mode « nouveautés ». Image : on regarde la pile de courrier depuis le dessus et on
s'arrête dès qu'on retombe sur du courrier déjà ouvert. Un fichier est « déjà connu » s'il est dans
data/processed/inventaire_ammc.csv (sur GitHub) ou déjà présent dans data/raw/ammc/. Ainsi, sur GitHub
Actions où data/raw/ est vide, on ne retélécharge pas tout l'historique.

    python scripts/01_telecharger_ammc.py          # seulement les nouveaux fichiers
    python scripts/01_telecharger_ammc.py --tout   # parcours complet jusqu'en 2023 (ancien comportement)

Voir docs/DATA.md, « Conditions de réutilisation » : une collecte par semaine au plus, avec des pauses.
"""
import csv
import re
import sys
import time
from pathlib import Path
from urllib.parse import urljoin, unquote

import requests
from bs4 import BeautifulSoup

BASE = "https://www.ammc.ma"
URL_LISTE = BASE + "/fr/publication/donnees-statistiques?page={}"
ANNEE_MIN = 2023          # mode --tout : on s'arrête quand on arrive avant cette année
PAGE_MAX = 80             # sécurité pour ne pas boucler à l'infini
PAGES_SANS_NOUVEAUTE = 2  # mode nouveautés : arrêt après 2 pages de suite sans fichier nouveau

# User-Agent honnête : on dit qui on est et où trouver le projet (docs/DATA.md, mesure 2)
USER_AGENT = ("observatoire-marches-maroc (projet pedagogique, collecte hebdomadaire; "
              "https://github.com/Ahmed-Badi3/observatoire-marches-maroc)")

RACINE = Path(__file__).resolve().parent.parent
DOSSIER = RACINE / "data" / "raw" / "ammc"          # fichiers bruts (hors GitHub)
INVENTAIRE = RACINE / "data" / "processed" / "inventaire_ammc.csv"
DOSSIER.mkdir(parents=True, exist_ok=True)

TOUT = "--tout" in sys.argv


def noms_connus():
    """Noms des fichiers déjà traités (inventaire) ou déjà téléchargés (dossier brut)."""
    connus = {f.name for f in DOSSIER.glob("*.xls*")}
    if INVENTAIRE.exists():
        with open(INVENTAIRE, encoding="utf-8-sig", newline="") as f:
            connus |= {ligne["fichier"] for ligne in csv.DictReader(f)}
    return connus


session = requests.Session()
session.headers.update({"User-Agent": USER_AGENT})

connus = noms_connus()
print(f"Mode : {'parcours complet' if TOUT else 'nouveautés seulement'} | "
      f"{len(connus)} fichiers déjà connus")

nb_telecharges = 0
pages_calmes = 0

for page in range(PAGE_MAX):
    print(f"--- Page {page} ---")
    reponse = session.get(URL_LISTE.format(page), timeout=30)
    reponse.raise_for_status()
    soup = BeautifulSoup(reponse.text, "html.parser")

    # 1) Tous les liens vers un fichier Excel (.xls ou .xlsx)
    liens = [a["href"] for a in soup.find_all("a", href=True)
             if re.search(r"\.xlsx?$", a["href"], re.IGNORECASE)]

    # 2) Les années citées dans les titres « ... OPCVM au JJ/MM/AAAA »
    annees = [int(a) for a in re.findall(r"OPCVM au \d{2}[/-]\d{2}[/-](\d{4})", soup.get_text())]

    if not liens and not annees:
        print("Plus rien à lire, arrêt.")
        break

    nouveaux_sur_la_page = 0
    for lien in liens:
        url = urljoin(BASE, lien)
        nom = unquote(url.split("/")[-1])          # %20 -> espace
        if nom in connus:
            continue                               # déjà connu : on ne le retélécharge pas
        fichier = session.get(url, timeout=60)
        fichier.raise_for_status()
        (DOSSIER / nom).write_bytes(fichier.content)
        connus.add(nom)
        nb_telecharges += 1
        nouveaux_sur_la_page += 1
        print("  OK", nom)
        time.sleep(1)                              # on reste poli avec le serveur

    if TOUT:
        if annees and max(annees) < ANNEE_MIN:
            print(f"Page entièrement avant {ANNEE_MIN}, arrêt.")
            break
    else:
        pages_calmes = 0 if nouveaux_sur_la_page else pages_calmes + 1
        if pages_calmes >= PAGES_SANS_NOUVEAUTE:
            print(f"{PAGES_SANS_NOUVEAUTE} pages de suite sans nouveauté, arrêt.")
            break

    time.sleep(1)

print(f"\nTerminé : {nb_telecharges} fichiers téléchargés dans {DOSSIER}")
