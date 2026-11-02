"""Télécharge les statistiques hebdomadaires OPCVM depuis le site de l'AMMC."""
import re
import time
from pathlib import Path
from urllib.parse import urljoin, unquote

import requests
from bs4 import BeautifulSoup

BASE = "https://www.ammc.ma"
URL_LISTE = BASE + "/fr/publication/donnees-statistiques?page={}"
ANNEE_MIN = 2023          # on s'arrête quand on arrive avant cette année
PAGE_MAX = 80             # sécurité pour ne pas boucler à l'infini

# Dossier de destination : data/raw/ammc (à partir de la racine du projet)
DOSSIER = Path(__file__).resolve().parent.parent / "data" / "raw" / "ammc"
DOSSIER.mkdir(parents=True, exist_ok=True)

session = requests.Session()
session.headers.update({"User-Agent": "Mozilla/5.0 (projet portfolio etudiant)"})

nb_telecharges = 0

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

    for lien in liens:
        url = urljoin(BASE, lien)
        nom = unquote(url.split("/")[-1])          # %20 -> espace
        chemin = DOSSIER / nom
        if chemin.exists():
            continue                               # déjà téléchargé
        fichier = session.get(url, timeout=60)
        fichier.raise_for_status()
        chemin.write_bytes(fichier.content)
        nb_telecharges += 1
        print("  OK", nom)
        time.sleep(1)                              # on reste poli avec le serveur

    if annees and max(annees) < ANNEE_MIN:
        print(f"Page entièrement avant {ANNEE_MIN}, arrêt.")
        break

    time.sleep(1)

print(f"\nTerminé : {nb_telecharges} fichiers téléchargés dans {DOSSIER}")
