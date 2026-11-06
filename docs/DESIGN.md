# Design

## Intention
Un dashboard financier **moderne, clair et vivant** : fond très clair, cartes blanches
arrondies, une ou deux cartes « vedettes » en dégradé de couleur, beaucoup d'espace,
des graphiques interactifs. Sérieux comme un outil financier, agréable comme une app.

## Références d'inspiration
On reprend la **structure et l'ambiance**, jamais les couleurs exactes, les logos,
les noms ni les images.

| Référence | Ce qu'on reprend | Ce qu'on ne reprend pas |
|---|---|---|
| « OripioFin » (@sajiburdesign) | Barre latérale, 3 cartes KPI en haut, graphique en barres avec filtre Mensuel / Annuel, tableau en bas | Couleur verte, nom, logo |
| « Moderno » (Dribbble) | Onglets soulignés d'une couleur, grandes cartes vedettes en dégradé avec pastilles de chiffres, rangée de petites cartes, badges de compteur dans le menu | Photos, personnages, avatars, thème jeux vidéo |

## Couleurs (reprises du thème Power BI `dashboard/theme_observatoire.json`)
| Rôle | Couleur |
|---|---|
| Fond de page | `#EAF6FA` |
| Fond de zone de contenu | `#DCEFF6` |
| Cartes | `#FFFFFF` |
| Texte principal | `#1F2A37` |
| Texte secondaire | `#5B6675` |
| Accent principal | `#2A9DB0` |
| Accent foncé | `#1B6F7E` |
| Accent clair | `#9ED3DE` |
| Positif | `#2E9E5B` |
| Négatif | `#D64545` |
| Neutre / avertissement | `#F2B84B` |

**Séries de graphiques, dans cet ordre :** `#2A9DB0`, `#E8836B`, `#1B6F7E`, `#2E9E5B`,
`#F2B84B`, `#7A8CA3`, `#9ED3DE`, `#C9D3DA`. Même palette que le thème Power BI, dans un ordre
différent : pour le site, c'est cet ordre qui compte.

**Dégradés des cartes vedettes :**
- Carte 1 : `#1B6F7E` → `#2A9DB0` (texte blanc)
- Carte 2 : `#E8836B` → `#F2B84B` (texte `#1F2A37`)

Deux cartes en dégradé maximum par page : le reste est blanc. L'accent attire l'œil
parce qu'il est rare.

## Typographie
- Police : **Plus Jakarta Sans** (Google Fonts, gratuite, chargée avec `next/font`).
- Chiffres : `font-variant-numeric: tabular-nums` pour que les colonnes s'alignent.
- Tailles : chiffre KPI 32 px semi-gras ; titre de page 24 px ; titre de carte 16 px ;
  texte 14 px ; légendes 12 px.

## Formes et effets
- Coins arrondis : 16 px pour les cartes, 10 px pour les boutons et pastilles.
- Ombre douce : `0 4px 20px rgba(159, 184, 200, 0.30)` (même esprit que Power BI).
- Espacements : multiples de 8 px ; 24 px entre les cartes.
- Pas de bordure épaisse ; séparateurs `#C9D3DA` en 1 px.

## Mise en page commune
- **Barre latérale gauche** (240 px, repliable sur téléphone) :
  logo texte « Observatoire » + sous-titre « Marchés financiers marocains »,
  puis les 7 pages avec une icône chacune (lucide-react), la page active surlignée
  par une barre d'accent à gauche et un fond `#EAF6FA`.
  En bas : date de dernière mise à jour et lien GitHub.
- **Barre du haut** : titre de la page, fil d'Ariane, filtre de période
  (1 an / 3 ans / Tout) quand la page en a besoin.
- **Contenu** : grille de 12 colonnes sur ordinateur, 1 colonne sur téléphone.

## Composants
| Composant | Description |
|---|---|
| Carte KPI | Libellé, grand chiffre, pastille de variation verte ou rouge, mini-courbe (sparkline) |
| Carte vedette | Dégradé, chiffre clé, 2 pastilles de chiffres secondaires, lien « Voir le détail » |
| Carte de résultat | Numéro du résultat (1 à 18), phrase courte, chiffre mis en avant |
| Onglets | Texte, soulignement de 2 px couleur accent sous l'onglet actif |
| Graphique | Carte blanche, titre qui dit la conclusion, info-bulle au survol, légende cliquable |
| Tableau | En-tête collant, lignes alternées très légères, tri par colonne, valeurs positives / négatives colorées |
| Badge | Petit compteur arrondi dans le menu (ex. nombre de résultats par page) |
| Squelette de chargement | Blocs gris animés pendant le chargement |

## Page d'accueil
1. Bandeau : titre « Où fallait-il placer son argent au Maroc entre 2023 et 2026 ? »
   et la phrase clé du PRD.
2. Deux cartes vedettes en dégradé : « MASI +42,3 % » et « Portefeuille équilibré :
   58 % du rendement pour la moitié du risque ». Ces chiffres viennent de la base
   (tâche A8), jamais écrits dans le code.
3. Rangée de 4 cartes KPI : rendement annualisé du MASI, volatilité, pire baisse, Sharpe.
4. Graphique rendement / risque (nuage de points) de tous les placements.
5. Tableau triable des placements.
6. Rangée de 6 cartes « modules » (style rangée de petites cartes de Moderno) qui
   mènent aux pages. OPCVM et marché actions partagent la même page : leurs deux
   cartes ouvrent chacune le bon onglet.

## Pages de module (même gabarit pour les 5)
1. Titre + une phrase de conclusion.
2. Onglets : un onglet par résultat du README.
3. Dans chaque onglet : carte de résultat à gauche (1/3), graphique interactif à droite (2/3).
4. Tableau détaillé en bas.

## Graphiques
- Lignes : courbes temporelles (MASI, taux, performance cumulée).
- Barres : comparaisons par année ou par catégorie, barres arrondies en haut.
- Nuage de points : rendement / risque.
- Carte de chaleur : corrélations.
- Le titre du graphique dit la conclusion (« Les épargnants achètent après la hausse »),
  pas le sujet (« Flux et MASI »).
- Axes discrets, quadrillage horizontal seulement, pas de 3D.

## Mouvement
- Transitions courtes (150 à 250 ms) sur les survols, onglets et filtres.
- Les grands chiffres KPI s'animent de 0 à leur valeur au premier affichage (une seule fois).
- Respecter `prefers-reduced-motion` : aucune animation si l'utilisateur l'a désactivée.

## Accessibilité
- Contraste suffisant (texte `#1F2A37` sur blanc) ; ne jamais coder une information
  par la couleur seule : signe `+` / `−` en plus du vert / rouge.
- Navigation au clavier sur les onglets, filtres et tableaux.

## Mode sombre
Hors MVP. Prévoir les couleurs en variables CSS pour l'ajouter plus tard.
