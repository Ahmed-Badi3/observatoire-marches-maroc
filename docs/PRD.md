# PRD — Site de l'Observatoire des marchés financiers marocains

## Objectif
Montrer en quelques minutes comment a évolué le marché financier marocain entre 2023
et 2026, ce qui l'a fait bouger, et où un investisseur aurait eu intérêt à placer
son argent — dans un dashboard interactif et moderne.

## Phrase clé (affichée en haut de l'accueil)
Sur 2023–2026, les actions ont rapporté le plus (+42 % pour le MASI), mais tous les
placements ont un rendement par unité de risque presque identique : il fallait
choisir son niveau de risque, diversifier avec des fonds de taux, et ne pas acheter
après la hausse.

Le chiffre de cette phrase (+42 %) est lu dans la base, comme tous les autres.

## Public
1. **Recruteurs Data Analyst / Finance** (public principal) : comprendre le projet en
   30 secondes, voir la qualité des données et de la démarche.
2. **Investisseurs particuliers et épargnants marocains** : comprendre leurs placements
   (actions, OPCVM, fonds de taux) sans jargon.
3. **Étudiants en finance** : un exemple concret d'analyse de marché.

## Pages du MVP
| Page | Contenu | Résultats du README |
|---|---|---|
| Accueil | Phrase clé, 4 cartes KPI, tableau des placements, accès aux 6 modules | 15 |
| OPCVM et marché actions | Flux vs MASI, timing des épargnants, volatilité, drawdown, MASI vs MASI 20, PER | 1 à 4 |
| Contexte économique | MASI vs PIB, rendement réel vs inflation, MASI autour des décisions BAM | 5 à 7 |
| Taux et obligations | Courbe des taux, fonds par année, sensibilité, anticipations, flux | 8 à 11 |
| Introductions en bourse | Tableau des 6 IPO, performance vs MASI, premier jour, achat après 1 mois | 12 à 14 |
| Synthèse quantitative | Rendement / risque, portefeuilles types, année 2026, corrélations | 15 à 18 |
| Méthode et sources | Architecture, qualité des données, limites, sources, lien GitHub | — |

## Interactivité (ce qui rend le site « interactif »)
- Filtre de période sur les graphiques temporels : 1 an / 3 ans / Tout. Le MASI ayant
  3 ans d'historique, « 3 ans » et « Tout » peuvent y donner le même résultat.
- Choix de l'indice (MASI ou MASI 20) et de la catégorie d'OPCVM.
- Bascule nominal / réel sur la page Contexte économique.
- Choix du portefeuille type (prudent, équilibré, dynamique) sur la page Synthèse.
- Info-bulles au survol de chaque point de graphique, avec la date et la valeur.
- Onglets dans chaque page pour passer d'un résultat à l'autre sans recharger.
- Tableaux triables (IPO, placements).
- Date de dernière mise à jour visible sur chaque page.

## Hors périmètre (pas dans le MVP)
- Comptes utilisateurs, connexion, favoris.
- Agent IA en ligne (l'agent analyste reste dans n8n en local) : idée pour la V2.
- Conseils d'investissement ou prédictions : le site décrit le passé, il ne recommande rien.
- Données en temps réel ou intrajournalières.
- Version anglaise : idée pour la V2.
- Saisie ou modification de données depuis le site.

## Critères de réussite
- Sur la copie figée des données au 03/11/2026, chaque chiffre affiché est identique au
  README. En ligne, les chiffres évoluent avec les données et leur date est affichée.
- Les données AMMC et la courbe des taux BAM se mettent à jour chaque semaine sans intervention.
- La date de dernière mise à jour est visible.
- Le site s'affiche correctement sur téléphone.
- Un recruteur comprend le projet en 30 secondes sur la page d'accueil.
- Coût : 0 € (Supabase, Vercel Hobby, GitHub Actions sur dépôt public).

## Mention légale (pied de page)
Projet personnel à but pédagogique. Données publiques (AMMC, Bourse de Casablanca,
Bank Al-Maghrib, HCP). Ne constitue pas un conseil en investissement.
