"""Inventaire des fichiers AMMC : date de chaque fichier, doublons, trous, format."""
import re
from pathlib import Path

import pandas as pd

RACINE = Path(__file__).resolve().parent.parent
DOSSIER = RACINE / "data" / "raw" / "ammc"
SORTIE = RACINE / "data" / "processed" / "inventaire_ammc.csv"
SORTIE.parent.mkdir(parents=True, exist_ok=True)


def fabriquer_date(jour, mois, annee):
    """Transforme 3 nombres en date, ou None si ce n'est pas une date plausible."""
    jour, mois, annee = int(jour), int(mois), int(annee)
    if annee < 100:
        annee += 2000
    if not (2015 <= annee <= 2030):
        return None
    try:
        return pd.Timestamp(year=annee, month=mois, day=jour)
    except ValueError:
        return None


def date_depuis_texte(texte):
    """Cherche la date dans le titre du fichier (le plus fiable)."""
    # « ... HEBDOMADAIRES ... AU 16/10/2026 » (16.10.2026, 16-10-26 acceptés)
    m = re.search(r"HEBDOMADAIRE.{0,60}?\bAU\b\s*:?\s*(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})",
                  texte, re.IGNORECASE)
    if m:
        return fabriquer_date(*m.groups())
    # Même chose quand la date est une vraie date Excel : « AU 2026-10-16 00:00:00 »
    m = re.search(r"HEBDOMADAIRE.{0,60}?\bAU\b\s*:?\s*(\d{4})-(\d{2})-(\d{2})",
                  texte, re.IGNORECASE)
    if m:
        annee, mois, jour = m.groups()
        return fabriquer_date(jour, mois, annee)
    return None


def date_depuis_nom(nom):
    """Plan B : la date dans le nom du fichier (21.11.2022, 11112022, 141022, 07-10-2022...)."""
    m = re.search(r"(\d{2})[.\-_ ]?(\d{2})[.\-_ ]?(\d{4}|\d{2})(?!\d)", nom)
    return fabriquer_date(*m.groups()) if m else None


lignes = []
for fichier in sorted(DOSSIER.glob("*.xls*")):
    info = {"fichier": fichier.name, "date": None, "source_date": None,
            "flux": False, "indices": False, "statut": "ok"}
    try:
        feuilles = pd.read_excel(fichier, sheet_name=None, header=None)
    except Exception as e:
        info["statut"] = f"illisible : {type(e).__name__}"
        lignes.append(info)
        continue

    texte = " ".join(str(v) for df in feuilles.values()
                     for v in df.values.ravel() if pd.notna(v))

    info["date"] = date_depuis_texte(texte)
    info["source_date"] = "titre"
    if info["date"] is None:
        info["date"] = date_depuis_nom(fichier.name)
        info["source_date"] = "nom"
    if info["date"] is None:
        info["statut"] = "date introuvable"
        info["source_date"] = None

    info["flux"] = "souscriptions" in texte.lower()
    info["indices"] = "indices de performance" in texte.lower()
    lignes.append(info)

inv = pd.DataFrame(lignes)
inv["date"] = pd.to_datetime(inv["date"])
inv.to_csv(SORTIE, index=False, encoding="utf-8-sig")

# ---------- Résumé ----------
ok = inv[inv["statut"] == "ok"]
print(f"Fichiers lus : {len(inv)}")
print(inv["statut"].value_counts().to_string())
print("\nOrigine de la date :")
print(ok["source_date"].value_counts().to_string())

problemes = inv[inv["statut"] != "ok"]
if len(problemes):
    print("\nFichiers à problème :")
    print(problemes[["fichier", "statut"]].to_string(index=False))

print(f"\nPériode : {ok['date'].min():%d/%m/%Y} -> {ok['date'].max():%d/%m/%Y}")
print(f"Semaines distinctes : {ok['date'].nunique()}")

doublons = ok[ok.duplicated("date", keep=False)].sort_values("date")
print(f"\nDates en double : {doublons['date'].nunique()}")

dates = ok["date"].drop_duplicates().sort_values()
ecarts = dates.diff().dt.days
print(f"Trous de plus de 8 jours : {(ecarts > 8).sum()}")
for d, e in zip(dates[ecarts > 8], ecarts[ecarts > 8]):
    print(f"  {d:%d/%m/%Y} : {int(e)} jours depuis le précédent")

print(f"\nSans bloc souscriptions/rachats : {(~ok['flux']).sum()}")
print(f"Sans bloc indices : {(~ok['indices']).sum()}")
print(f"\nDétail enregistré dans {SORTIE}")