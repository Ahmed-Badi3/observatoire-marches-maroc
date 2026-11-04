"""
07_collecter_courbe_bam.py
Collecte la courbe des taux de référence des bons du Trésor (BAM, marché secondaire)
pour chaque jour ouvré, et l'enregistre dans data/raw/taux/courbe_bam_brut.csv.
Relançable : reprend après la dernière date déjà collectée.

Attention : avant le 21/03/2023 (ancienne méthode BAM), la "Date de la valeur"
est la date de la dernière transaction sur la ligne, pas la date de la courbe.
La date de la courbe est donc la date DEMANDÉE.
"""
import time
from datetime import date, datetime
from pathlib import Path

import pandas as pd
import requests
from bs4 import BeautifulSoup

# ---------------- Paramètres ----------------
ESSAI = False
COMBLER_TROUS = False
DATE_DEBUT = "2022-09-01"  # un mois avant le premier fichier AMMC (30/09/2022)
PAUSE_S = 1.0              # pause entre deux requêtes (politesse envers le site)
SAUVEGARDE_TOUS_LES = 100  # sauvegarde intermédiaire tous les N jours

URL = ("https://www.bkam.ma/Marches/Principaux-indicateurs/Marche-obligataire/"
       "Marche-des-bons-de-tresor/Marche-secondaire/Taux-de-reference-des-bons-du-tresor")
BLOCK = "e1d6b9bbf87f86f8ba53e8518e882982"
HEADERS = {"User-Agent": "Mozilla/5.0"}

RACINE = Path(__file__).resolve().parents[1]
FICHIER_CSV = RACINE / "data" / "raw" / "taux" / "courbe_bam_brut.csv"
COLONNES = ["date_courbe", "date_echeance", "transaction_mmad", "taux_pct", "date_valeur"]


def nombre_fr(texte):
    """'2,170%' -> 2.17 ; '1 234,56' -> 1234.56 ; '' ou '-' -> None"""
    t = texte.replace("%", "").replace("\xa0", "").replace(" ", "").replace(",", ".")
    if t in ("", "-"):
        return None
    return float(t)


def lire_courbe(jour, session):
    """Renvoie la liste des lignes de la courbe publiée pour ce jour (liste vide si rien)."""
    params = {"date": jour.strftime("%d/%m/%Y"), "block": BLOCK}

    for tentative in range(1, 4):
        try:
            reponse = session.get(URL, params=params, headers=HEADERS, timeout=30)
            reponse.raise_for_status()
            break
        except requests.RequestException as erreur:
            print(f"  {jour:%d/%m/%Y} : tentative {tentative} échouée ({erreur})")
            time.sleep(5)
    else:
        return []

    tableau = BeautifulSoup(reponse.text, "html.parser").find("table")
    if tableau is None:
        return []

    lignes = []
    for tr in tableau.find_all("tr"):
        cellules = [c.get_text(strip=True) for c in tr.find_all(["th", "td"])]
        if len(cellules) != 4:
            continue
        try:
            lignes.append({
                "date_courbe": jour.date(),   # la date DEMANDÉE
                "date_echeance": datetime.strptime(cellules[0], "%d/%m/%Y").date(),
                "transaction_mmad": nombre_fr(cellules[1]),
                "taux_pct": nombre_fr(cellules[2]),
                "date_valeur": datetime.strptime(cellules[3], "%d/%m/%Y").date(),
            })
        except ValueError:
            continue  # ligne d'en-tête ou ligne "Total"
    return lignes


def sauvegarder(existant, nouvelles_lignes):
    """Fusionne avec le CSV existant, supprime les doublons, trie et écrit."""
    nouveau = pd.DataFrame(nouvelles_lignes, columns=COLONNES)
    tout = pd.concat([existant, nouveau], ignore_index=True)
    for col in ["date_courbe", "date_echeance", "date_valeur"]:
        tout[col] = pd.to_datetime(tout[col]).dt.date
    tout = (tout.drop_duplicates(subset=["date_courbe", "date_echeance"])
                .sort_values(["date_courbe", "date_echeance"]))
    FICHIER_CSV.parent.mkdir(parents=True, exist_ok=True)
    tout.to_csv(FICHIER_CSV, index=False, encoding="utf-8")
    return tout


def main():
       # 1. Jours à interroger
    if COMBLER_TROUS:
        # Réinterroge uniquement les vendredis absents du CSV
        existant = pd.read_csv(FICHIER_CSV)
        deja = set(pd.to_datetime(existant["date_courbe"]))
        tous = pd.bdate_range(DATE_DEBUT, max(deja))
        jours = pd.DatetimeIndex([j for j in tous if j.weekday() == 4 and j not in deja])
        print(f"Comblement des trous : {len(jours)} vendredis manquants")
    elif FICHIER_CSV.exists() and not ESSAI:
        existant = pd.read_csv(FICHIER_CSV)
        derniere = pd.to_datetime(existant["date_courbe"]).max()
        jours = pd.bdate_range(derniere + pd.Timedelta(days=1), date.today())
        print(f"Reprise : {len(existant)} lignes déjà collectées, dernière courbe le {derniere:%d/%m/%Y}")
    else:
        existant = pd.DataFrame(columns=COLONNES)
        jours = pd.bdate_range(DATE_DEBUT, date.today())

    if ESSAI:
        jours = jours[:5]
    if len(jours) == 0:
        print("Rien à collecter : déjà à jour.")
        return
    print(f"{len(jours)} jours à interroger ({jours[0]:%d/%m/%Y} -> {jours[-1]:%d/%m/%Y})")

    # 3. Boucle de collecte
    session = requests.Session()
    lignes, jours_vides = [], []
    for i, jour in enumerate(jours, start=1):
        resultat = lire_courbe(jour, session)
        if resultat:
            lignes.extend(resultat)
        else:
            jours_vides.append(jour.strftime("%d/%m/%Y"))

        if i % 50 == 0:
            print(f"  {i}/{len(jours)} jours traités...")
        if not ESSAI and i % SAUVEGARDE_TOUS_LES == 0:
            existant = sauvegarder(existant, lignes)
            lignes = []
            print(f"  sauvegarde intermédiaire : {len(existant)} lignes")
        time.sleep(PAUSE_S)

    # 4. Résultat
    if ESSAI:
        essai = pd.DataFrame(lignes, columns=COLONNES)
        print(essai.to_string(index=False))
        print("\nLignes par date de courbe :")
        print(essai.groupby("date_courbe").size())
    else:
        existant = sauvegarder(existant, lignes)
        print(f"\nTerminé : {len(existant)} lignes, "
              f"{existant['date_courbe'].nunique()} courbes "
              f"({existant['date_courbe'].min()} -> {existant['date_courbe'].max()})")
    if jours_vides:
        print(f"Jours sans courbe ({len(jours_vides)}) : {', '.join(jours_vides[:20])}"
              + (" ..." if len(jours_vides) > 20 else ""))


if __name__ == "__main__":
    main()