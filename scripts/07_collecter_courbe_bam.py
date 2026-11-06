"""
07_collecter_courbe_bam.py
Collecte la courbe des taux de référence des bons du Trésor (BAM, marché secondaire)
pour chaque jour ouvré, et l'enregistre dans data/raw/taux/courbe_bam_brut.csv
(le script 08 charge ensuite ce fichier dans la base).

Relançable : reprend après la DERNIÈRE COURBE EN BASE (staging.bam_courbe_taux).
Image : la base est le carnet de bord. On regarde la dernière page écrite et on collecte seulement
les jours d'après. Le fichier brut local n'est plus la mémoire : sur GitHub Actions, il n'existe pas.

    python scripts/07_collecter_courbe_bam.py          # jours manquants seulement
    python scripts/07_collecter_courbe_bam.py --tout   # recollecte depuis DATE_DEBUT (long : à éviter)

Point de départ, par ordre : 1) la base (DATABASE_URL, sinon config.py) ; 2) à défaut, le fichier brut local ;
3) à défaut, arrêt avec un message (jamais de recollecte complète par surprise).
Code de sortie 1 si 3 jours ouvrés ou plus sont interrogés et qu'aucune courbe ne revient
(site modifié ou indisponible) : le workflow le signalera.

Attention : avant le 21/03/2023 (ancienne méthode BAM), la "Date de la valeur"
est la date de la dernière transaction sur la ligne, pas la date de la courbe.
La date de la courbe est donc la date DEMANDÉE.

Voir docs/DATA.md, « Conditions de réutilisation » : une collecte par semaine au plus, avec des pauses.
"""
import sys
import time
from datetime import date, datetime
from pathlib import Path

import pandas as pd
import requests
from bs4 import BeautifulSoup

try:
    from connexion import PG          # connexion à la base (DATABASE_URL ou config.py)
except SystemExit:                    # aucune connexion configurée : on se repliera sur le fichier local
    PG = None

# ---------------- Paramètres ----------------
ESSAI = False
COMBLER_TROUS = False
DATE_DEBUT = "2022-09-01"  # un mois avant le premier fichier AMMC (30/09/2022)
PAUSE_S = 1.0              # pause entre deux requêtes (politesse envers le site)
SAUVEGARDE_TOUS_LES = 100  # sauvegarde intermédiaire tous les N jours
SEUIL_ALERTE_JOURS = 3     # au moins N jours interrogés sans aucune courbe = anomalie

URL = ("https://www.bkam.ma/Marches/Principaux-indicateurs/Marche-obligataire/"
       "Marche-des-bons-de-tresor/Marche-secondaire/Taux-de-reference-des-bons-du-tresor")
BLOCK = "e1d6b9bbf87f86f8ba53e8518e882982"
# User-Agent honnête : on dit qui on est et où trouver le projet (docs/DATA.md, mesure 2)
HEADERS = {"User-Agent": ("observatoire-marches-maroc (projet pedagogique, collecte hebdomadaire; "
                          "https://github.com/Ahmed-Badi3/observatoire-marches-maroc)")}

RACINE = Path(__file__).resolve().parents[1]
FICHIER_CSV = RACINE / "data" / "raw" / "taux" / "courbe_bam_brut.csv"
COLONNES = ["date_courbe", "date_echeance", "transaction_mmad", "taux_pct", "date_valeur"]


class AccesRefuse(Exception):
    """Le site répond 403 Forbidden : il refuse cet accès. On s'arrête, sans insister ni contourner."""


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
        except requests.HTTPError as erreur:
            if erreur.response is not None and erreur.response.status_code == 403:
                raise AccesRefuse(str(erreur))     # un « non » du serveur : on n'insiste pas
            print(f"  {jour:%d/%m/%Y} : tentative {tentative} échouée ({erreur})")
            time.sleep(5)
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


def derniere_date_en_base():
    """Dernière date de courbe dans staging.bam_courbe_taux. Renvoie (date, None) ou (None, raison)."""
    if PG is None:
        return None, "aucune connexion configurée (DATABASE_URL ou scripts/config.py)"
    try:
        import psycopg2
        with psycopg2.connect(**PG, connect_timeout=15) as conn, conn.cursor() as cur:
            cur.execute("SELECT MAX(date_courbe) FROM staging.bam_courbe_taux")
            derniere = cur.fetchone()[0]
    except Exception as erreur:
        return None, f"base injoignable : {str(erreur).strip().splitlines()[0]}"
    if derniere is None:
        return None, "la table staging.bam_courbe_taux est vide"
    return derniere, None


def point_de_depart(tout):
    """Premier jour à interroger : le lendemain de la dernière courbe connue."""
    if tout:
        return pd.Timestamp(DATE_DEBUT), "recollecte complète demandée (--tout)"

    derniere, probleme = derniere_date_en_base()
    if derniere is not None:
        return pd.Timestamp(derniere) + pd.Timedelta(days=1), f"dernière courbe en base : {derniere:%d/%m/%Y}"

    if FICHIER_CSV.exists():
        dates = pd.to_datetime(pd.read_csv(FICHIER_CSV, usecols=["date_courbe"])["date_courbe"])
        derniere = dates.max()
        return (derniere + pd.Timedelta(days=1),
                f"REPLI sur le fichier local ({probleme}) : dernière courbe le {derniere:%d/%m/%Y}")

    sys.exit(f"Aucun point de départ : {probleme}, et pas de fichier local.\n"
             "Rien n'est collecté. Pour tout recollecter depuis le début (long), lancez avec --tout.")


def main():
    tout = "--tout" in sys.argv
    existant = (pd.read_csv(FICHIER_CSV) if FICHIER_CSV.exists()
                else pd.DataFrame(columns=COLONNES))

    # 1. Jours à interroger
    if COMBLER_TROUS:
        # Réinterroge uniquement les vendredis absents du CSV
        deja = set(pd.to_datetime(existant["date_courbe"]))
        tous = pd.bdate_range(DATE_DEBUT, max(deja))
        jours = pd.DatetimeIndex([j for j in tous if j.weekday() == 4 and j not in deja])
        print(f"Comblement des trous : {len(jours)} vendredis manquants")
    else:
        debut, origine = point_de_depart(tout)
        jours = pd.bdate_range(debut, date.today())
        print(f"Reprise ({origine})")

    if ESSAI:
        jours = jours[:5]
    if len(jours) == 0:
        print("Rien à collecter : déjà à jour.")
        return 0
    print(f"{len(jours)} jours à interroger ({jours[0]:%d/%m/%Y} -> {jours[-1]:%d/%m/%Y})")

    # 3. Boucle de collecte
    session = requests.Session()
    lignes, jours_vides, nb_collectees = [], [], 0
    refus = False
    for i, jour in enumerate(jours, start=1):
        try:
            resultat = lire_courbe(jour, session)
        except AccesRefuse:
            refus = True
            print(f"  {jour:%d/%m/%Y} : 403 Forbidden, le site refuse l'accès. Arrêt immédiat, sans insister.")
            break
        if resultat:
            lignes.extend(resultat)
            nb_collectees += len(resultat)
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
        print(f"\nTerminé : {nb_collectees} lignes collectées ; fichier : {len(existant)} lignes, "
              f"{existant['date_courbe'].nunique()} courbes "
              f"({existant['date_courbe'].min()} -> {existant['date_courbe'].max()})")
    if jours_vides:
        print(f"Jours sans courbe ({len(jours_vides)}) : {', '.join(jours_vides[:20])}"
              + (" ..." if len(jours_vides) > 20 else ""))

    if refus:
        print("\nERREUR : Bank Al-Maghrib refuse l'accès (403). C'est typique des serveurs de GitHub Actions : "
              "lancez ce script depuis votre PC (voir docs/DATA.md).")
        return 1

    # Garde-fou : si le site a changé ou ne répond plus, on ne veut pas un « succès » silencieux
    if nb_collectees == 0 and len(jours) >= SEUIL_ALERTE_JOURS:
        print(f"\nERREUR : {len(jours)} jours ouvrés interrogés, aucune courbe reçue "
              "(site modifié, indisponible, ou jours fériés en série ?).")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
