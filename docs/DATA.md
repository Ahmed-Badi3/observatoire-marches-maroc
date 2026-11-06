# Données

## Sources et mise à jour
| Source | Données | Script(s) | Fréquence | Automatique ? |
|---|---|---|---|---|
| AMMC | Statistiques hebdomadaires OPCVM (actif net, indices, flux) | 01 → 02 → 03 → 04 | Hebdomadaire | Oui, GitHub Actions (phase C) |
| Bank Al-Maghrib | Courbe des taux de référence (BDT) | 07 → 08 | Quotidienne (jours ouvrés) | Oui, seulement les nouveaux jours (phase C) |
| Bourse de Casablanca | MASI, MASI 20 (historique 3 ans maximum) | 05 | Export manuel | Non |
| Bourse de Casablanca | Cours quotidiens des IPO | 09 + seed `ipo_operations.csv` | Manuel | Non |
| HCP | Inflation (mensuelle), PIB et chômage (trimestriels) | 06 | Mensuelle / trimestrielle | Non |
| Bank Al-Maghrib | Taux directeur (`taux_directeur_bam.csv`) | 06 | À chaque décision | Non |
| Presse (BKGR, CFG) | PER, dividendes | n8n + Gemini (local) | Ponctuelle | Non |

Conditions d'utilisation : à vérifier pour chaque site avant d'automatiser
(tâche C1). Les données sont publiques ; le site cite toujours ses sources.

## Comment les scripts écrivent en base (important pour l'automatisation)
- `04_charger_postgres.py` : vide (`TRUNCATE`) puis recharge les 4 tables AMMC
  depuis `data/processed/` → il faut des CSV complets.
- `05_charger_masi.py` : supprime puis recharge les indices présents dans le fichier.
- `06`, `08`, `09` : upsert (`ON CONFLICT ... DO UPDATE`) → relançables sans doublons.
- `07_collecter_courbe_bam.py` : reprend après la dernière date du fichier
  `data/raw/taux/courbe_bam_brut.csv`, qui n'est PAS sur GitHub → à adapter pour
  reprendre depuis la dernière date en base (tâche C3).

## Tables lues par le site
Le site lit uniquement les schémas `dw` (vues SQL) et `analytics` (modèles dbt).
Les colonnes exactes sont à compléter par Claude Code à la tâche A2, à partir de
`sql/` et des fichiers `.yml` de `observatoire_dbt/models/`.

### Accueil et Synthèse quantitative
| Table | Utilisation |
|---|---|
| `analytics.synthese_classes_actifs` | Rendement cumulé et annualisé, volatilité, pire baisse, Sharpe par placement |
| `analytics.synthese_annuel` | Rendement par année et par placement (2026 inverse le classement) |
| `analytics.synthese_correlations` | Corrélations hebdomadaires avec le MASI |
| `analytics.synthese_rendements_hebdo` | Courbes de performance cumulée par placement |

### OPCVM et marché actions
| Table | Utilisation |
|---|---|
| `dw.fact_opcvm_hebdo` | Actif net, flux et indices hebdomadaires par catégorie |
| `dw.dim_categorie`, `dw.dim_date` | Libellés et calendrier |
| `dw.v_kpi_timing` | Corrélation flux / performance passée et future |
| `dw.v_actions_vs_masi` | Flux vers les fonds actions vs MASI |
| `dw.fact_masi_quotidien`, `dw.fact_masi_hebdo` | Historique du MASI |
| `dw.v_masi_drawdown`, `dw.v_masi_annuel` | Drawdown, volatilité et rendement annuels |
| `dw.v_indices_quotidien`, `dw.v_indices_annuel`, `dw.v_indices_synthese` | MASI vs MASI 20 |
| `staging.valorisation_marche` | PER et dividendes (à exposer via une vue `dw` en lecture seule) |

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
| `analytics.ipo_operations` (seed) | Prix, sursouscription, date de cotation |

## Valeurs de contrôle (README)
Le site doit afficher exactement ces valeurs. Une valeur différente = une erreur à expliquer.

| Page | Valeur attendue |
|---|---|
| Accueil / Synthèse | MASI : +42,3 % cumulé, +12,7 % annualisé, volatilité 15,2 %, pire baisse −16,2 %, Sharpe 0,66 |
| Synthèse | Portefeuille équilibré : +23,5 % cumulé, volatilité 7,5 %, Sharpe 0,62 |
| Synthèse | Corrélation du MASI avec les fonds obligataires MLT : 0,38 ; avec les fonds CT : 0,21 |
| OPCVM | Corrélation flux / MASI des 4 semaines précédentes : +0,43 ; suivantes : −0,08 |
| OPCVM | Flux net vers les fonds actions 2025 : +10,6 Md MAD |
| Marché actions | Volatilité annualisée du MASI : 8,5 % (2024), 19,7 % (2026) ; pire drawdown −19,0 % (03/03/2026) |
| Marché actions | PER 2026 : 18,0x (octobre 2026) |
| Contexte économique | MASI +50,5 % nominal, +47,4 % réel (fin oct. 2023 → fin sept. 2026) |
| Taux | Fonds obligataires MLT : +8,2 % en 2024, −1,6 % en 2026 (au 16/10) |
| Taux | Sensibilité MLT : +1 point de taux ≈ −4,1 % (R² = 0,57) |
| IPO | CFG Bank : sursouscription 34,7x, +66,4 % depuis l'IPO (au 03/11/2026) |
| IPO | SGTM acheté au 20e jour : −40,9 % |

## Formats d'affichage
- Pourcentages : une décimale, virgule, espace avant `%` : `+42,3 %`.
- Montants : `Md MAD` pour les milliards, séparateur de milliers espace : `16 537,91`.
- Points de base : `+68 pb`.
- Dates : `03/03/2026` dans les tableaux, `mars 2026` sur les axes.
