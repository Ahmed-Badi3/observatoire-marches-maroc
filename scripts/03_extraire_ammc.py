"""Extrait les 4 tableaux de chaque fichier AMMC et les empile dans 4 fichiers CSV."""
import io
import re
from pathlib import Path

import pandas as pd

RACINE = Path(__file__).resolve().parent.parent
DOSSIER = RACINE / "data" / "raw" / "ammc"
SORTIE = RACINE / "data" / "processed"
INVENTAIRE = SORTIE / "inventaire_ammc.csv"


def nettoyer(texte):
    """'Actions1 ' -> 'Actions' ; 'TOTAL' -> 'Total' (les anciens fichiers l'écrivent en majuscules)."""
    texte = re.sub(r"\d+$", "", str(texte).strip()).strip()
    return "Total" if texte.upper() == "TOTAL" else texte


def lire_bloc(df, titre):
    """Retrouve un tableau grâce à son titre et le renvoie comme un petit DataFrame."""
    col_b = df[1].astype(str).str.strip().str.lower()
    debut = col_b[col_b.str.startswith(titre.lower())].index[0]
    entete = col_b[(col_b.index > debut) & (col_b == "catégorie")].index[0]

    # Noms de colonnes = ligne d'en-tête ; on ignore les colonnes sans nom
    noms = df.loc[entete]
    colonnes = [c for c in df.columns if pd.notna(noms[c]) and str(noms[c]).strip()]

    # Lignes de données : jusqu'à la première ligne vide ou la note de bas de tableau
    lignes = []
    for i in range(entete + 1, len(df)):
        valeur = df.at[i, 1]
        if pd.isna(valeur) or str(valeur).strip() == "" or str(valeur).strip()[0].isdigit():
            break
        lignes.append(i)

    bloc = df.loc[lignes, colonnes].copy()
    bloc.columns = [str(noms[c]).strip() for c in colonnes]
    bloc["Catégorie"] = bloc["Catégorie"].map(nettoyer)
    return bloc


def lire_flux(df):
    """Bloc souscriptions/rachats, redressé : une ligne par catégorie."""
    try:
        b = lire_bloc(df, "Souscriptions et rachats")       # format normal
        b = b.set_index("Catégorie")
    except IndexError:
        # Format abîmé (ex. 11/07/2025) : pas de colonne « Catégorie »,
        # en-tête juste sous le titre, puis 2 lignes (souscriptions, rachats).
        col_b = df[1].astype(str).str.strip().str.lower()
        entete = col_b[col_b.str.startswith("souscriptions et rachats")].index[0] + 1
        noms = df.loc[entete]
        colonnes = [c for c in df.columns if pd.notna(noms[c]) and str(noms[c]).strip()]
        b = df.loc[[entete + 1, entete + 2], colonnes]
        b.columns = [str(noms[c]).strip() for c in colonnes]
        b = b.loc[:, ~b.columns.duplicated()]   # colonne en double -> on garde la 1re
    b = b.T                                     # catégories en lignes
    b.columns = ["souscriptions", "rachats"]
    b = b.rename_axis("categorie").reset_index()
    b["categorie"] = b["categorie"].map(nettoyer).replace({"TOTAL": "Total"})
    return b


# 1) Liste des fichiers à lire, regroupés par date
inv = pd.read_csv(INVENTAIRE, parse_dates=["date"])
inv = inv[inv["statut"] == "ok"]


def extraire(fichier, date):
    """Lit les 4 tableaux d'un fichier. Renvoie 4 DataFrames (ou lève une erreur)."""
    contenu = (DOSSIER / fichier).read_bytes()      # force OneDrive à télécharger le fichier
    df = pd.read_excel(io.BytesIO(contenu), header=None, engine="calamine")

    # Bloc 1 : actif net par catégorie
    b1 = lire_bloc(df, "Actif net par catégorie")
    b1.columns = ["categorie", "nb_opcvm", "actif_net", "structure_pct",
                  "var_hebdo_pct", "var_mensuelle_pct", "var_annuelle_pct"]

    # Bloc 2 : indices de performance
    b2 = lire_bloc(df, "Indices de performance")
    b2.columns = ["categorie", "indice", "var_hebdo_pct",
                  "var_mensuelle_pct", "var_annuelle_pct"]

    # Bloc 3 : actif total par catégorie de valeurs
    b3 = lire_bloc(df, "Actif total par catégorie de valeurs")
    b3.columns = ["poste", "montant", "structure_pct",
                  "var_hebdo_pct", "var_mensuelle_pct", "var_annuelle_pct"]

    # Bloc 4 : souscriptions et rachats
    b4 = lire_flux(df)

    return [b.assign(date=date) for b in (b1, b2, b3, b4)]


actif_net, indices, actif_valeurs, flux, erreurs = [], [], [], [], []

for date, groupe in inv.groupby("date"):
    # S'il y a plusieurs versions pour une même semaine : on essaie la plus récente
    # d'abord, et si elle est illisible on passe à la suivante.
    candidats = sorted(groupe["fichier"], reverse=True)
    for fichier in candidats:
        try:
            b1, b2, b3, b4 = extraire(fichier, date)
        except Exception as e:
            erreurs.append((fichier, f"{type(e).__name__}: {e}"))
            continue
        actif_net.append(b1)
        indices.append(b2)
        actif_valeurs.append(b3)
        flux.append(b4)
        break                                   # une version lue = semaine terminée


# 2) Empiler et enregistrer
def enregistrer(morceaux, nom):
    table = pd.concat(morceaux, ignore_index=True)
    table = table[["date"] + [c for c in table.columns if c != "date"]]
    table.to_csv(SORTIE / nom, index=False, encoding="utf-8-sig")
    print(f"{nom:<28} {len(table):>6} lignes")
    return table


print(f"Semaines extraites : {len(actif_net)} / {inv['date'].nunique()}\n")
t_actif = enregistrer(actif_net, "ammc_actif_net.csv")
enregistrer(indices, "ammc_indices.csv")
enregistrer(actif_valeurs, "ammc_actif_valeurs.csv")
t_flux = enregistrer(flux, "ammc_flux.csv")

if erreurs:
    print("\nFichiers ignorés (illisibles) :")
    for f, e in erreurs:
        print(" ", f, "->", e)

# 3) Contrôle qualité : la somme des catégories doit égaler la ligne Total
detail = t_flux[t_flux["categorie"] != "Total"].groupby("date")["souscriptions"].sum()
total = t_flux[t_flux["categorie"] == "Total"].set_index("date")["souscriptions"]
ecart = (detail - total).abs()
print(f"\nContrôle flux : {(ecart > 1).sum()} semaine(s) où la somme ≠ Total")