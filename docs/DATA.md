# Données

## Sources et mise à jour
| Source | Données | Script(s) | Fréquence | Automatique ? |
|---|---|---|---|---|
| AMMC | Statistiques hebdomadaires OPCVM (actif net, indices, flux) | 01 → 02 → 03 → 04 | Hebdomadaire | Oui, GitHub Actions (phase C) |
| Bank Al-Maghrib | Courbe des taux de référence (BDT) | 07 → 08 | Quotidienne (jours ouvrés) | Oui, seulement les nouveaux jours (phase C) |
| Bourse de Casablanca | MASI, MASI 20 (historique 3 ans maximum) vers `staging.bvc_indices` | 05 | Export manuel | Non |
| Bourse de Casablanca | Cours quotidiens des IPO **et du MASI** vers `staging.bvc_cours_titres` | 09 + seed `ipo_operations.csv` | Manuel | Non |
| HCP | Inflation (mensuelle), PIB et chômage (trimestriels) | 06 | Mensuelle / trimestrielle | Non |
| Bank Al-Maghrib | Taux directeur (`taux_directeur_bam.csv`) | 06 | À chaque décision | Non |
| Presse (BKGR, CFG) | PER, dividendes | n8n + Gemini (local), puis export CSV et chargeur (tâche A7) | Ponctuelle | Non |

Conditions d'utilisation : à vérifier pour chaque site avant d'automatiser
(tâche C1). Les données sont publiques ; le site cite toujours ses sources.

**Le MASI vit dans deux tables.** Imagine deux carnets qui notent le même cours :
`bvc_indices` sert aux vues `dw` et aux modèles `macro`, `bvc_cours_titres` à la synthèse
et aux IPO. Une mise à jour manuelle du MASI doit donc passer par les scripts 05 **et** 09.
Dernières dates au 06/11/2026 : AMMC 16/10, `bvc_indices` 30/10, `bvc_cours_titres` 03/11.

## Comment les scripts écrivent en base (important pour l'automatisation)
- `04_charger_postgres.py` : vide (`TRUNCATE`) puis recharge les 4 tables AMMC
  depuis `data/processed/` → il faut des CSV complets.
- `05_charger_masi.py` : supprime puis recharge les indices présents dans le fichier.
- `06`, `08`, `09` : upsert (`ON CONFLICT ... DO UPDATE`) → relançables sans doublons.
- `07_collecter_courbe_bam.py` : reprend après la dernière date du fichier
  `data/raw/taux/courbe_bam_brut.csv`, qui n'est PAS sur GitHub → à adapter pour
  reprendre depuis la dernière date en base (tâche C3).
- `sql/01_staging_ammc.sql` est vide : les tables AMMC n'existent que dans la base locale
  (à reconstruire, tâche A5). `bvc_indices` et `bvc_cours_titres` sont créées par les
  scripts 05 et 09, pas par `sql/`.
- `staging.valorisation_marche` n'est chargée par aucun script : n8n l'écrit en local (tâche A7).

## Tables lues par le site
Le site lit uniquement les schémas `dw` (vues SQL) et `analytics` (modèles dbt).
Les colonnes exactes sont à compléter par Claude Code à la tâche A2, à partir de
`sql/` et des fichiers `.yml` de `observatoire_dbt/models/`.

### Accueil et Synthèse quantitative
| Table | Utilisation |
|---|---|
| `analytics.synthese_classes_actifs` | Rendement cumulé et annualisé, volatilité, pire baisse, Sharpe par placement |
| `analytics.synthese_annuel` | Rendement par année et par placement (2026 inverse le classement) |
| `analytics.synthese_correlations` | Corrélations hebdomadaires entre toutes les paires de placements, hors portefeuilles (chaque paire une seule fois, sans diagonale) |
| `analytics.synthese_rendements_hebdo` | Courbes de performance cumulée par placement |

### OPCVM et marché actions
| Table | Utilisation |
|---|---|
| `dw.fact_opcvm_hebdo` | Actif net, flux et indices hebdomadaires par catégorie |
| `dw.dim_categorie`, `dw.dim_date` | Libellés et calendrier |
| `dw.v_kpi_timing` | Corrélation flux / performance passée et future |
| `dw.v_actions_vs_masi` | Flux vers les fonds actions vs MASI |
| `dw.fact_masi_quotidien`, `dw.fact_masi_hebdo` | Historique du MASI |
| `dw.v_masi_drawdown`, `dw.v_masi_annuel` | Drawdown et volatilité annuels (pour le rendement annuel du résultat 1, voir « Quelle source pour quel chiffre ») |
| `dw.v_indices_quotidien`, `dw.v_indices_annuel`, `dw.v_indices_synthese` | MASI vs MASI 20 |
| `dw.v_valorisation` (à créer, tâche B6) | PER et dividendes issus de `staging.valorisation_marche`, avec la date de publication ajoutée à la tâche A7 |

### Contexte économique
| Table | Utilisation |
|---|---|
| `analytics.masi_vs_macro_trimestriel` | MASI vs croissance du PIB |
| `analytics.masi_rendement_reel` | MASI nominal vs réel |
| `analytics.inflation_mensuelle`, `analytics.croissance_pib`, `analytics.chomage_trimestriel` | Indicateurs HCP |
| `analytics.decisions_bam`, `analytics.taux_directeur_quotidien` | Décisions et taux directeur |
| `analytics.masi_autour_decisions_bam` | MASI 20 séances après chaque décision |
| `analytics.masi_et_taux_quotidien` | MASI et taux directeur sur un même graphique |

### Taux et obligations
| Table | Utilisation |
|---|---|
| `analytics.courbe_taux_quotidienne` | Courbe interpolée (13 semaines, 1, 2, 5, 10 ans) |
| `analytics.fonds_taux_annuel` | Rendement annuel des fonds monétaires, CT, MLT |
| `analytics.obligations_vs_taux_hebdo` | Rendement hebdomadaire des fonds vs variation du taux 10 ans |
| `analytics.sensibilite_fonds_taux` | Sensibilité implicite (régression) |
| `analytics.taux_autour_decisions_bam` | Écart taux 13 semaines / taux directeur avant les décisions |
| `analytics.flux_fonds_taux_annuel`, `analytics.flux_fonds_taux_timing` | Flux des fonds de taux |

### Introductions en bourse
| Table | Utilisation |
|---|---|
| `analytics.ipo_performance` | Performance de chaque IPO à 5 séances, 1 mois, depuis l'IPO, écart avec le MASI |
| `analytics.ipo_operations` (seed) | Prix, sursouscription, date de cotation. 7 lignes dont Laprophan, sans date : le site affiche seulement les IPO cotées (6) |

## Quelle source pour quel chiffre
Plusieurs méthodes valables donnent des chiffres différents. Le site suit ce tableau.

| Chiffre | Source à utiliser | À ne pas confondre avec |
|---|---|---|
| Résultat 1 : MASI +21 %, +26 %, −8 % | `analytics.synthese_annuel` (vendredis AMMC, 2026 au 16/10) | `dw.v_masi_annuel` : +22,2 %, +27,6 %, −12,2 % (dernière séance de l'année, 2026 au 30/10) |
| Résultats 2 et 3 : volatilité, pire drawdown du MASI | Données quotidiennes (`dw`) : −19,0 % | Résultat 15 : données hebdomadaires, volatilité 15,2 %, pire baisse −16,2 % |
| Résultat 9 : sensibilité MLT 4,1, R² = 0,57 | `analytics.sensibilite_fonds_taux`, ligne « Toute la période » (201 semaines) | Ligne « Depuis le 24/03/2023 » : 4,59, R² = 0,379 |
| Résultat 11 : corrélation flux 0,15 (MLT) et 0,43 (Actions) | 0,15 : flux en dirhams. 0,43 : flux en % de l'actif net | Mesures différentes : le site le signale s'il les compare |
| Résultat 15 : placements | `analytics.synthese_classes_actifs` (9 lignes, 7 dans le README). Sharpe du Monétaire : stocké `0,00`, affiché `—` | — |

## Chiffres à fournir par la base (tâche A8)
Ces chiffres n'existent encore dans aucune colonne, et le site n'a pas le droit de les calculer :
achat d'une IPO au 20e jour (résultat 14), flux annuels des fonds actions (résultat 1), moyennes
après décision BAM (résultat 7), « 58 % du rendement » (carte vedette de l'accueil).

## Points à trancher par Ahmed
- Résultat 7 : le README indique +0,7 point après un maintien, la base donne +0,35 (9 maintiens).
- Résultat 14 : « moins de 1,10 DH » est introuvable dans le dépôt (maximum en base : 0,728, taux de
  service connu pour 3 IPO sur 6).
- Sursouscription de T2S : `43,75x` dans le README, alors que les autres IPO ont au plus une décimale.

## Valeurs de contrôle (README)
Ces valeurs sont une photo des données au **03/11/2026**. Le site en ligne, lui, continue d'évoluer
chaque semaine et affiche sa date de mise à jour. La comparaison se fait donc sur la copie figée de
la base (tâche B7) : sur cette copie, une valeur différente = une erreur à expliquer.

| Page | Valeur attendue |
|---|---|
| Accueil / Synthèse | MASI : +42,3 % cumulé, +12,7 % annualisé, volatilité 15,2 %, pire baisse −16,2 %, Sharpe 0,66 |
| Synthèse | Portefeuille équilibré : +23,5 % cumulé, volatilité 7,5 %, Sharpe 0,62 |
| Synthèse | Corrélation du MASI avec les fonds obligataires MLT : 0,38 ; avec les fonds CT : 0,21 |
| OPCVM | Corrélation flux / MASI des 4 semaines précédentes : +0,43 ; suivantes : −0,08 |
| OPCVM | Flux net vers les fonds actions 2025 : +10,6 Md MAD |
| Marché actions | Volatilité annualisée du MASI : 8,5 % (2024), 19,7 % (2026) ; pire drawdown −19,0 % (03/03/2026) |
| Marché actions | PER 2026 : 18,0x (octobre 2026) |
| Contexte économique | MASI +50,5 % nominal, +47,4 % réel (fin nov. 2023 → fin sept. 2026) |
| Taux | Fonds obligataires MLT : +8,2 % en 2024, −1,6 % en 2026 (au 16/10) |
| Taux | Sensibilité MLT : +1 point de taux ≈ −4,1 % (R² = 0,57) |
| IPO | CFG Bank : sursouscription 34,7x, +66,4 % depuis l'IPO (au 03/11/2026) |
| IPO | SGTM acheté au 20e jour : −40,9 % |

## Formats d'affichage
- Pourcentages : une décimale, virgule, espace avant `%` : `+42,3 %`. Le texte du README arrondit
  parfois à l'entier (`+21 %`) ; le site affiche une décimale (`+21,1 %`).
- Les colonnes `_pct` de la base sont déjà en pourcentage : `42.26` s'affiche `+42,3 %`, sans
  multiplier par 100. Exception : `rendement_jour` de `dw.v_masi_drawdown` et `dw.v_indices_quotidien`,
  exprimé en fraction.
- Arrondi : `37.55` doit donner `+37,6 %`, comme dans le README (test obligatoire, tâche D5).
- Montants : `Md MAD` pour les milliards, séparateur de milliers espace : `16 537,91`.
- Points de base : `+68 pb`. Points de pourcentage : `+31,2 pts`, `−1,8 pt`. Multiples : `18,0x`.
- Dates : `03/03/2026` dans les tableaux, `mars 2026` sur les axes.
