# Données

## Sources et mise à jour
| Source | Données | Script(s) | Fréquence | Automatique ? |
|---|---|---|---|---|
| AMMC | Statistiques hebdomadaires OPCVM (actif net, indices, flux) | 01 → 02 → 03 → 04 | Hebdomadaire | Oui, GitHub Actions (phase C). Mise à jour : 01 (nouveautés) → 11 (ajoute les semaines aux CSV) → 04 |
| Bank Al-Maghrib | Courbe des taux de référence (BDT) | 07 → 08 | Quotidienne (jours ouvrés) | **Non, depuis le PC** : BAM répond 403 aux serveurs de GitHub (voir « Courbe BAM : routine hebdomadaire ») |
| Bourse de Casablanca | MASI, MASI 20 (historique 3 ans maximum) vers `staging.bvc_indices` | 05 | Export manuel | Non |
| Bourse de Casablanca | Cours quotidiens des IPO **et du MASI** vers `staging.bvc_cours_titres` | 09 + seed `ipo_operations.csv` | Manuel | Non |
| HCP | Inflation (mensuelle), PIB et chômage (trimestriels) | 06 | Mensuelle / trimestrielle | Non |
| Bank Al-Maghrib | Taux directeur (`taux_directeur_bam.csv`) | 06 | À chaque décision | Non |
| Presse (BKGR, CFG) | PER, dividendes | n8n + Gemini (local), export dans `data/processed/valorisation_marche.csv`, puis script 10 | Ponctuelle | Non |

Conditions d'utilisation : relevées à la tâche C1, voir « Conditions de réutilisation » ci-dessous.
Les données sont publiques ; le site cite toujours ses sources.

## Conditions de réutilisation (tâche C1, relevé du 06/11/2026)
Pas un avis juridique : un constat des textes publiés, et les mesures de prudence retenues.

| Source | Ce que disent les textes | Collecte automatique |
|---|---|---|
| AMMC ([mentions légales](https://www.ammc.ma/fr/node/98)) | Reproduction des documents « seulement aux fins d'information », avec les mentions de droit d'auteur. « Adaptation, traduction, transformation, modification » et « transfert vers un autre site ou support » : « strictement interdits ». | Non mentionnée. `robots.txt` standard Drupal : ne bloque que l'administration, la recherche et les comptes. |
| Bank Al-Maghrib ([mentions légales](https://www.bkam.ma/Trouvez-l-information-concernant/Mentions-legales), [confidentialité](https://www.bkam.ma/musee/Articles/Politique-de-confidentialite)) | Droit d'auteur à la Banque, « reproduction, en totalité ou en partie, interdite ». Réutilisation des données et statistiques soumise à la « Charte de BAM sur la diffusion des données et statistiques » (texte non trouvé). La politique de confidentialité parle d'un « consentement préalable exprès écrit ». | Non mentionnée. `robots.txt` : seul `/switch/` est bloqué. |

**Constat** : ni interdiction ni autorisation explicite de la collecte automatique. Le risque porte sur
la reproduction et la transformation du contenu. Le site n'affiche pas les documents sources : il affiche
des indicateurs calculés, avec la source citée.

**Mesures retenues (les plus prudentes)**
1. **Demander une autorisation écrite** à l'AMMC et à Bank Al-Maghrib (courriers envoyés le 06/11/2026 ;
   AMMC : envoyé à contacts@ammc.ma, réponse : en attente ; BAM : envoyé à accueil@bkam.ma, adresse générale
   car aucune adresse « statistiques » n'est publiée, réponse : en attente).
2. **Rester discret** : au plus une collecte par semaine et par site, pauses entre les requêtes
   (1 s entre deux requêtes pour l'AMMC et pour BAM, 5 s entre deux tentatives en cas d'échec chez BAM), uniquement les nouvelles données, jamais de collecte en parallèle.
   Un `User-Agent` honnête qui nomme le projet et donne le lien GitHub, au lieu de `Mozilla/5.0`
   (scripts 01 et 07, fait aux tâches C2 et C3).
3. **Ne rien republier en brut** : aucun fichier AMMC ou BAM d'origine sur le site. Seuls des indicateurs
   calculés, avec « Source : AMMC » ou « Source : Bank Al-Maghrib » et un lien vers la page d'origine.
4. **Plan B** : en cas de refus ou de demande d'arrêt, la collecte s'arrête et la procédure manuelle
   (tâche C6) prend le relais. En l'absence de réponse, le site reste en collecte discrète (mesures 2 et 3).

**Constat du 06/11/2026 (première exécution du workflow C4)** : le site de Bank Al-Maghrib répond
`403 Forbidden` aux serveurs de GitHub Actions (3 jours testés, 3 tentatives chacun), alors qu'une même requête
avec le même `User-Agent` honnête, depuis un PC, répond `200` avec la courbe. Le refus vient donc de
l'adresse des serveurs, pas de notre identifiant. Un 403 est un refus : on ne le contourne pas
(pas de faux navigateur, pas de proxy). Le plan B s'applique pour BAM : la courbe est collectée depuis le PC.
Le script 07 s'arrête dès le premier 403 au lieu d'insister. L'AMMC, elle, répond normalement à GitHub.

## Courbe BAM : routine hebdomadaire (depuis le PC)
À faire chaque semaine, après la publication de la courbe de la semaine (idéalement avant le samedi 7 h,
heure du Maroc, pour que le build dbt automatique la prenne en compte). Dans un terminal, à la racine du
projet, avec `DATABASE_URL` pointant vers Supabase (URL Session pooler, saisie masquée comme en B3) :

```powershell
python scripts/07_collecter_courbe_bam.py   # collecte les jours manquants (depuis la dernière date en base)
python scripts/08_charger_courbe_bam.py     # charge dans staging.bam_courbe_taux (upsert, sans doublon)
```
Si ce n'est pas fait avant le build du samedi, ajouter ensuite `cd observatoire_dbt` puis
`dbt build --target supabase` (profil local, voir `CLAUDE.md`). Rien n'est à pousser dans Git : le fichier
brut `data/raw/taux/` n'est pas suivi.

**Le MASI vit dans deux tables.** Imagine deux carnets qui notent le même cours :
`bvc_indices` sert aux vues `dw` et aux modèles `macro`, `bvc_cours_titres` à la synthèse
et aux IPO. Une mise à jour manuelle du MASI doit donc passer par les scripts 05 **et** 09.
Dernières dates au 06/11/2026 : AMMC 16/10, `bvc_indices` 30/10, `bvc_cours_titres` 03/11.

## Procédure manuelle (tâche C6)
Ce que le robot du samedi ne fait pas : le MASI, les IPO, le HCP, le taux directeur, les PER et la
courbe BAM (voir plus haut). Chaque source se met à jour à la main depuis le PC, puis la base en ligne
se reconstruit avec dbt. Les fichiers de `data/raw/` ne sont PAS sur GitHub.

### 0. Se connecter à Supabase (une fois par fenêtre de terminal)
À la racine du projet, dans PowerShell. Le mot de passe se saisit sans s'afficher :
```powershell
$p = Read-Host "Mot de passe Supabase" -AsSecureString
$pw = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($p))
$env:DATABASE_URL = "postgresql://postgres.zljkjurzphcipfhshqce:$pw@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
Remove-Variable p, pw
```
Tous les scripts (04 à 10) chargent alors vers Supabase. Pour viser la base locale : `Remove-Item Env:DATABASE_URL`.
Pour dbt sur Supabase, il faut en plus les variables `SUPABASE_DB_*` :
```powershell
$u = [uri]$env:DATABASE_URL
$env:SUPABASE_DB_HOST = $u.Host; $env:SUPABASE_DB_PORT = $u.Port
$env:SUPABASE_DB_USER = [uri]::UnescapeDataString($u.UserInfo.Split(':')[0])
$env:SUPABASE_DB_PASSWORD = [uri]::UnescapeDataString($u.UserInfo.Substring($u.UserInfo.IndexOf(':') + 1))
$env:SUPABASE_DB_NAME = $u.AbsolutePath.TrimStart('/')
```

### 1. MASI et MASI 20 (Bourse de Casablanca), deux tables à tenir à jour
1. Exporter l'historique (CSV, séparateur `;`, colonnes `Séance;Indice;Valeur indice;Plus haut;Plus bas;Variation
   quotidienne;Variation annuelle`) dans `data/raw/masi/` (les fichiers du dossier sont tous lus et empilés).
2. `python scripts/05_charger_masi.py` : recharge `staging.bvc_indices` (MASI et MASI 20) et réécrit
   `data/processed/masi_quotidien.csv` (suivi par Git : le committer s'il a changé).
3. Exporter la série du MASI en CSV ou Excel sous `data/raw/ipo/MASI.csv` (le nom du fichier est le ticker), puis
   `python scripts/09_charger_cours_ipo.py` : recharge `staging.bvc_cours_titres` (upsert, sans doublon).
4. `cd observatoire_dbt` puis `dbt build --target supabase`.

### 2. IPO (nouvelle cotation, ex. Laprophan, tâche F3)
1. Ouvrir `observatoire_dbt/seeds/ipo_operations.csv` : la ligne de la société existe peut-être déjà
   (Laprophan : `date_premiere_cotation` vide tant qu'elle n'est pas cotée). Renseigner la date de première
   cotation, le prix, le montant, la sursouscription, le nombre de souscripteurs, et la `source` (lien).
   Sinon ajouter une ligne (une société = un ticker, en majuscules).
2. Exporter les cours quotidiens de l'action dans `data/raw/ipo/<TICKER>.csv` (ou `.xlsx`) : une colonne de
   date et une colonne de clôture (« Dernier cours » ou « Clôture »).
3. `python scripts/09_charger_cours_ipo.py` : il lit tous les fichiers du dossier et affiche, par ticker, le nombre de
   séances et un avertissement si un saut dépasse 15 % (division du nominal possible).
4. `cd observatoire_dbt` puis `dbt build --target supabase` (le seed est rechargé par le build).
5. Committer le seed modifié.

### 3. HCP (inflation, PIB, chômage) et taux directeur BAM
1. Inflation : exporter « IPC … mensuel » depuis hcp.ma. PIB et chômage trimestriels : bds.hcp.ma. Les mettre
   dans `data/raw/macro/` avec des noms qui suivent les modèles du script : `IPC*mensuel*.xlsx`,
   `*composition*PIB*.xlsx`, `*ch*mage*Trimestriel*.xlsx`.
2. Taux directeur : à chaque décision de BAM, ajouter une ligne à `data/raw/macro/taux_directeur_bam.csv`
   (colonnes `date_effet,taux_pct,source`, la date étant celle de l'entrée en vigueur).
3. `python scripts/06_extraire_macro.py` (upsert), puis `dbt build --target supabase` dans `observatoire_dbt`.

### 4. PER et dividendes (presse)
1. Le workflow n8n (local) écrit dans la base **locale** `staging.valorisation_marche`.
2. Exporter vers le CSV suivi par Git : `Remove-Item Env:DATABASE_URL` (base locale), puis
   `python scripts/10_charger_valorisation.py --exporter`. Vérifier que chaque ligne a sa `date_article`.
3. Committer et pousser `data/processed/valorisation_marche.csv`.
4. Se connecter à Supabase (étape 0), puis `python scripts/10_charger_valorisation.py` (upsert, relançable).
   La vue `dw.v_valorisation` lit la table directement : pas besoin de dbt.

### 5. Courbe BAM
Voir « Courbe BAM : routine hebdomadaire » plus haut (scripts 07 puis 08).

### Vérifier après une mise à jour
Dans Supabase (éditeur SQL), regarder la dernière date de la table concernée, par exemple
`select max(date) from staging.bvc_indices;`, et vérifier que `dbt build` termine avec `ERROR=0`.

## Comment les scripts écrivent en base (important pour l'automatisation)
- `04_charger_postgres.py` : vide (`TRUNCATE`) puis recharge les 4 tables AMMC
  depuis `data/processed/` → il faut des CSV complets.
- `05_charger_masi.py` : supprime puis recharge les indices présents dans le fichier.
- `06`, `08`, `09` : upsert (`ON CONFLICT ... DO UPDATE`) → relançables sans doublons.
- `07_collecter_courbe_bam.py` : reprend après la dernière date **en base** (`staging.bam_courbe_taux`,
  tâche C3). Repli sur le fichier local `data/raw/taux/courbe_bam_brut.csv` (PAS sur GitHub) si la base est
  injoignable ; sans base ni fichier, il s'arrête au lieu de tout recollecter (`--tout` pour le forcer).
  Code de sortie 1 si 3 jours ouvrés ou plus ne renvoient aucune courbe.
- `sql/01_staging_ammc.sql` crée les 4 tables AMMC (tâche A5) : elles doivent exister avant le script 04.
  `bvc_indices` et `bvc_cours_titres` sont créées par les scripts 05 et 09, pas par `sql/`.
- Connexion : tous les scripts passent par `scripts/connexion.py` (`DATABASE_URL` si elle existe,
  sinon `scripts/config.py`) ; `07` sera adapté à la tâche C3.
- `staging.valorisation_marche` : n8n l'écrit en local. `10_charger_valorisation.py` la recharge
  depuis `data/processed/valorisation_marche.csv` (upsert, relançable). Après un passage de n8n,
  `10_charger_valorisation.py --exporter` met le CSV à jour (21 lignes au 06/11/2026).

## Tables lues par le site
Le site lit uniquement les schémas `dw` (vues SQL) et `analytics` (modèles dbt).
Colonnes relevées à la tâche A2 dans `sql/02`, `sql/03`, `sql/04` et dans les modèles dbt
(`observatoire_dbt/models/`). Les `.yml` dbt ne décrivent presque aucune colonne : la source de vérité
est le `SELECT` final de chaque modèle. Les incertitudes sont regroupées en fin de section.

Rappel des unités : une colonne `_pct` est déjà en pourcentage, `_pb` en points de base,
`_pts` / `_pt` en points de pourcentage. Piège : certaines colonnes en pourcentage n'ont pas de suffixe
(`perf_hebdo_pct` a le suffixe, mais `masi_perf_4s_passees`, `masi_perf_4s_futures`, `flux_net_pct` sont
aussi en %), et `rendement_hebdo` (synthèse) ainsi que `rendement_jour` (dw) sont des **fractions**.

### Accueil et Synthèse quantitative
Période commune : vendredis AMMC couverts par l'historique du MASI. Valeurs de `actif` :
`MASI`, `Fonds Actions`, `Fonds Diversifiés`, `OMLT`, `OCT`, `Monétaire`, `Portefeuille prudent`,
`Portefeuille équilibré`, `Portefeuille dynamique`.

| Table | Colonnes |
|---|---|
| `analytics.synthese_classes_actifs` (1 ligne par placement ou portefeuille) | `actif`, `nb_semaines`, `debut`, `fin`, `rdt_cumule_pct`, `rdt_annualise_pct`, `volatilite_pct`, `pire_baisse_pct`, `pire_semaine_pct`, `semaines_negatives_pct`, `ratio_rendement_risque` (Sharpe), `part_rdt_masi_pct`, `part_risque_masi_pct` (rendement annualisé et volatilité en % de ceux du MASI, tâche A8) |
| `analytics.synthese_annuel` | `actif`, `annee`, `nb_semaines` (1re et dernière année partielles), `rendement_pct`, `premiere_date`, `derniere_date`, `annee_partielle` (Priorité 2 des corrections : étiquette « 2026 (janv.–oct.) ») |
| `analytics.synthese_correlations` (chaque paire une fois, `actif_1 < actif_2` par ordre alphabétique, hors portefeuilles) | `actif_1`, `actif_2`, `nb_semaines`, `correlation` (de −1 à 1, pas un %) |
| `analytics.synthese_rendements_hebdo` | `date`, `actif`, `rendement_hebdo` (**fraction**, 0,01 = 1 %) |

### OPCVM et marché actions
| Table | Colonnes |
|---|---|
| `dw.fact_opcvm_hebdo` (semaine × catégorie, sans la catégorie `Total`) | `date`, `categorie`, `nb_opcvm`, `actif_net`, `souscriptions`, `rachats`, `flux_net` (souscriptions − rachats), `indice_perf`, `perf_hebdo_pct` |
| `analytics.flux_opcvm_annuel` (tâche A8, par catégorie et par année civile, 1re et dernière année partielles) | `categorie`, `annee`, `nb_semaines`, `flux_net` (MAD), `flux_net_md` (milliards MAD), `premiere_date`, `derniere_date`, `annee_partielle` (Priorité 2 des corrections : étiquette « 2026 (janv.–oct.) ») |
| `dw.dim_categorie` | `categorie`, `ordre_risque` (1 à 6), `profil` (Prudent, Équilibré, Dynamique, Autre) |
| `dw.dim_date` (un jour par ligne, du 01/01/2022 au 31/12/2027) | `date`, `annee`, `trimestre`, `mois`, `annee_mois` (texte `AAAA-MM`), `semaine_iso`, `jour_semaine` (1 = lundi) |
| `dw.v_kpi_timing` (1 seule ligne) | `corr_passe`, `corr_futur` (corrélations flux / MASI, résultat +0,43 et −0,08), `masi_moyen_achat`, `masi_moyen_vente` (niveaux du MASI, pondérés par les flux mensuels) |
| `dw.v_actions_vs_masi` (fonds Actions, une ligne par semaine) | `date`, `flux_net`, `flux_net_pct` (en % de l'actif net de la semaine précédente), `masi`, `masi_perf_4s_passees` (%), `masi_perf_4s_futures` (%) |
| `dw.fact_masi_quotidien` | `date`, `cloture`, `plus_haut`, `plus_bas`, `var_quotidienne_pct` |
| `dw.fact_masi_hebdo` (dates AMMC, dernière clôture MASI connue) | `date`, `date_seance`, `masi`, `masi_perf_hebdo_pct` |
| `dw.v_masi_drawdown` | `date`, `cloture`, `rendement_jour` (**fraction**), `plus_haut_atteint`, `drawdown_pct` |
| `dw.v_masi_annuel` | `annee`, `nb_seances`, `cloture_fin`, `rendement_pct`, `volatilite_annualisee_pct`, `pire_drawdown_pct`, `premiere_date`, `derniere_date`, `annee_partielle` (Priorité 2 des corrections : étiquette « 2026 (janv.–oct.) ») |
| `dw.v_indices_quotidien` (par indice) | `indice`, `date`, `cloture`, `rendement_jour` (**fraction**), `base_100`, `drawdown_pct` |
| `dw.v_indices_annuel` | `indice`, `annee`, `nb_seances`, `cloture_fin`, `rendement_pct`, `volatilite_annualisee_pct`, `pire_drawdown_pct` |
| `dw.v_indices_synthese` (1 ligne par indice) | `indice`, `debut`, `fin`, `rendement_total_pct`, `volatilite_annualisee_pct`, `pire_drawdown_pct`, `drawdown_actuel_pct` |
| `dw.v_valorisation` (**à créer**, tâche B6) | Colonnes prévues, d'après `staging.valorisation_marche` : `annee`, `perimetre`, `per`, `rendement_dividende_pct`, `estimation` (booléen), `source`, `url_article`, `date_extraction`, `date_article` (date de publication de l'étude : 19,4x est daté du 15/05/2025, 18,0x du 23/10/2026) |

Valeurs de `indice` : `MASI`, `MASI 20` (la table `staging.bvc_indices` peut en contenir d'autres, à vérifier).

### Contexte économique
| Table | Colonnes |
|---|---|
| `analytics.masi_vs_macro_trimestriel` | `date_ref` (1er jour du trimestre), `annee`, `trimestre`, `masi_fin_trimestre`, `perf_masi_trimestre_pct`, `perf_masi_annuelle_pct`, `croissance_pib_pct`, `chomage_national_pct`, `derniere_seance`, `trimestre_en_cours` (dernière séance avant les 10 derniers jours du trimestre : « 2026 T4 (en cours) ») |
| `analytics.masi_rendement_reel` (fin de mois) | `mois`, `derniere_seance`, `masi`, `ipc`, `masi_nominal_base100`, `masi_reel_base100` |
| `analytics.inflation_mensuelle` | `date_ref` (1er jour du mois), `indice_general` (IPC base 2017 = 100), `inflation_annuelle_pct`, `inflation_mensuelle_pct`, `inflation_alimentaire_pct`, `inflation_non_alimentaire_pct` (glissement annuel) |
| `analytics.croissance_pib` | `date_ref`, `annee`, `trimestre`, `pib_volume`, `croissance_annuelle_pct`, `croissance_trimestrielle_pct` |
| `analytics.chomage_trimestriel` | `date_ref`, `annee`, `trimestre`, `chomage_national_pct`, `chomage_urbain_pct`, `chomage_rural_pct`, `chomage_jeunes_pct` (15-24 ans) |
| `analytics.decisions_bam` | `date_effet`, `taux_directeur_pct`, `variation_pb`, `type_decision` (`initial`, `hausse`, `baisse`, `maintien`, en minuscules) |
| `analytics.taux_directeur_quotidien` (un jour calendaire par ligne, jusqu'au jour du `dbt build`) | `date_jour`, `taux_directeur_pct`, `date_derniere_decision` |
| `analytics.masi_moyennes_decisions_bam` (tâche A8, 1 ligne par type de décision : `baisse`, `maintien`) | `type_decision`, `nb_decisions`, `rendement_anormal_5_moyen_pct`, `rendement_anormal_20_moyen_pct` |
| `analytics.masi_autour_decisions_bam` | `date_annonce` (date d'effet − 2 jours), `type_decision`, `variation_pb`, `taux_directeur_pct`, `seance_reference`, `masi_avant`, `perf_5_seances_pct`, `perf_20_seances_pct`, `reference_5_seances_pct`, `reference_20_seances_pct`, `rendement_anormal_5_pct`, `rendement_anormal_20_pct` |
| `analytics.masi_et_taux_quotidien` | `date_seance`, `masi`, `taux_directeur_pct` |

### Taux et obligations
Valeurs de `categorie` : `Monétaire`, `Obligations CT`, `Obligations MLT`.
Valeurs de `maturite` : `13 sem`, `1 an`, `2 ans`, `5 ans`, `10 ans`.

| Table | Colonnes |
|---|---|
| `analytics.courbe_taux_quotidienne` | `date_courbe`, `maturite`, `cible_ans`, `taux_pct`, `maturite_bas_ans`, `maturite_haut_ans` (les deux dernières : points réels encadrant la maturité cible, pour l'interpolation) |
| `analytics.fonds_taux_annuel` | `categorie`, `annee`, `date_debut`, `date_fin`, `rendement_pct`, `taux_10a_debut`, `taux_10a_fin`, `var_taux_10a_pb`, `premiere_date` (1re semaine qui compte, la semaine de base `date_debut` exclue), `derniere_date`, `annee_partielle` |
| `analytics.obligations_vs_taux_hebdo` | `date_semaine`, `categorie`, `indice`, `rendement_hebdo_pct`, `date_courbe`, `taux_13s`, `taux_2a`, `taux_5a`, `taux_10a`, `var_taux_10a_pb`, `var_taux_5a_pb`, `pente_10a_13s_pt` |
| `analytics.sensibilite_fonds_taux` (2 périodes × 3 catégories) | `periode` (`Toute la période` ou `Depuis le 24/03/2023 (nouvelle méthode BAM)`), `categorie`, `nb_semaines`, `sensibilite_implicite`, `correlation`, `r2` |
| `analytics.taux_autour_decisions_bam` | `date_effet`, `decision` (`Hausse`, `Baisse`, `Maintien`, avec majuscule), `taux_avant`, `taux_apres`, `date_courbe_veille`, `taux_13s_veille`, `ecart_13s_vs_directeur_pb`, `var_13s_30j_pb`, `pente_10a_13s_pt` |
| `analytics.flux_fonds_taux_annuel` | `categorie`, `annee`, `rendement_pct`, `var_taux_10a_pb`, `flux_net`, `premiere_date`, `derniere_date`, `annee_partielle` (repris de `fonds_taux_annuel`) |
| `analytics.flux_fonds_taux_timing` (1 ligne par catégorie) | `categorie`, `nb_semaines`, `corr_flux_rend_passe`, `corr_flux_rend_futur`, `corr_flux_taux_passe`, `corr_flux_taux_futur` |

### Introductions en bourse
| Table | Colonnes |
|---|---|
| `analytics.ipo_performance` (1 ligne par IPO cotée) | Identité : `ticker`, `societe`, `date_premiere_cotation`, `prix_ipo`, `montant_mdh`, `type_operation`, `sursouscription`, `nb_souscripteurs`, `taux_satisfaction_pct`. Cours : `nb_seances`, `date_dernier_cours`, `dernier_cours`. Rendement depuis le prix d'IPO (%) : `rdt_j1_pct`, `rdt_j5_pct`, `rdt_1m_pct`, `rdt_6m_pct`, `rdt_1a_pct`, `rdt_depuis_ipo_pct`. MASI : `masi_depuis_ipo_pct`. Écart avec le MASI (points) : `anormal_j1_pts`, `anormal_j5_pts`, `anormal_1m_pts`, `anormal_6m_pts`, `anormal_1a_pts`, `anormal_depuis_ipo_pts`. Gain : `gain_pour_100_dh_demandes`. Achat en bourse à la 20e séance (tâche A8) : `cours_j20`, `rdt_achat_j20_pct` |
| `analytics.ipo_operations` (seed, saisie à la main) | `ticker`, `societe`, `date_premiere_cotation` (vide = pas encore cotée), `prix_ipo`, `montant_mdh`, `type_operation`, `sursouscription`, `nb_souscripteurs`, `taux_satisfaction_pct`, `source` |

Horizons de `ipo_performance` : en **séances** de bourse (J1, J5, « 1 mois » = 20e séance, 6 mois = 120,
1 an = 250). Une colonne est vide (`NULL`) si l'IPO n'a pas encore atteint cet horizon.
Le rendement d'un achat à la 20e séance (résultat 14) est dans `rdt_achat_j20_pct` (tâche A8).

### Incertitudes relevées à la tâche A2
À confirmer avant de les utiliser dans le site :
1. **Tables AMMC** : décrites à la tâche A5 (`sql/01_staging_ammc.sql`, relevé de la base locale). Les
   montants sont en `NUMERIC(20,2)`, `indice` et les variations en `DOUBLE PRECISION`.
2. **Unité de `actif_net`, `souscriptions`, `rachats`, `flux_net`** : pas écrite dans le dépôt, mais les
   dirhams (MAD) sont confirmés indirectement : la somme annuelle des flux Actions divisée par 10⁹ redonne
   les +1,1 / +10,6 / −0,6 Md MAD du README (tâche A8).
3. **Majuscules** : `decisions_bam.type_decision` est en minuscules (`hausse`), alors que
   `taux_autour_decisions_bam.decision` a une majuscule (`Hausse`). Le site doit gérer les deux.
4. **`gain_pour_100_dh_demandes`** : formule `(dernier cours / prix IPO − 1) × taux_satisfaction_pct`.
   L'unité du résultat n'est pas documentée, et la colonne est vide pour les IPO sans taux de satisfaction
   (3 sur 6 d'après la section « Points à trancher »).
5. **`dw.v_indices_*`** : elles lisent tous les indices de `staging.bvc_indices`, pas seulement MASI et
   MASI 20. Les valeurs réellement présentes sont à vérifier avant de proposer un choix d'indice.
6. **`var_quotidienne_pct`** (`dw.fact_masi_quotidien`) vient telle quelle de la source : unité non vérifiée.
7. **`analytics.taux_directeur_quotidien`** s'étend jusqu'à `current_date` à chaque `dbt build` : le nombre
   de lignes change chaque jour, sans nouvelle donnée.
8. **Dernière semaine MASI** : réglé à la tâche A9. `dw.fact_masi_hebdo` s'arrête à la dernière séance MASI
   en base (30/10/2026 au 06/11/2026) : une semaine AMMC plus récente que le MASI n'y apparaît pas
   (donc pas non plus dans `dw.v_actions_vs_masi` ni `dw.v_kpi_timing`).
9. **Décision BAM « maintien »** : la moyenne à 20 séances est +0,35 point (9 maintiens), pas +0,7 comme
   dans le README (déjà signalé dans « Points à trancher »). Seule la valeur des baisses (+4,2) est confirmée.

## Années partielles (macro dbt `annee_partielle`)
Une année est partielle si ses données commencent après le 10 janvier ou s'arrêtent avant le 20 décembre
(macro `observatoire_dbt/macros/annee_partielle.sql`, même règle écrite dans `sql/03` pour `dw.v_masi_annuel`).
Le site écrit alors les mois couverts sous la barre : « 2026 (janv.–oct.) ». Les flux AMMC de 2022
commencent à la semaine du 30/09 (« sept.–déc. ») ; les rendements et flux des fonds de taux, eux, à la
semaine suivante, car le 30/09 sert de base au calcul (« oct.–déc. »).
La copie figée `observatoire_fige` n'a pas encore ces colonnes (elle est en lecture seule).

## Quelle source pour quel chiffre
Plusieurs méthodes valables donnent des chiffres différents. Le site suit ce tableau.

| Chiffre | Source à utiliser | À ne pas confondre avec |
|---|---|---|
| Résultat 1 : MASI +21 %, +26 %, −8 % | `analytics.synthese_annuel` (vendredis AMMC, 2026 au 16/10) | `dw.v_masi_annuel` : +22,2 %, +27,6 %, −12,2 % (dernière séance de l'année, 2026 au 30/10) |
| Résultats 2 et 3 : volatilité, pire drawdown du MASI | Données quotidiennes (`dw`) : −19,0 % | Résultat 15 : données hebdomadaires, volatilité 15,2 %, pire baisse −16,2 % |
| Résultat 9 : sensibilité MLT 4,1, R² = 0,57 | `analytics.sensibilite_fonds_taux`, ligne « Toute la période » (201 semaines) | Ligne « Depuis le 24/03/2023 » : 4,59, R² = 0,379 |
| Résultat 11 : corrélation flux 0,15 (MLT) et 0,43 (Actions) | 0,15 : flux en dirhams. 0,43 : flux en % de l'actif net | Mesures différentes : le site le signale s'il les compare |
| Résultat 15 : placements | `analytics.synthese_classes_actifs` (9 lignes, 7 dans le README). Sharpe du Monétaire : stocké `0,00`, affiché `—` | — |

## Chiffres ajoutés en dbt (tâche A8)
Ces 4 chiffres n'existaient dans aucune colonne, et le site n'a pas le droit de les calculer. Ils sont
maintenant fournis par la base, et leurs valeurs sont celles du README sur la copie figée au 03/11/2026.

| Chiffre | Table et colonne | Valeur de contrôle |
|---|---|---|
| Résultat 14 : achat d'une IPO à la 20e séance | `analytics.ipo_performance.rdt_achat_j20_pct` (cours d'achat : `cours_j20`) | SGTM −40,9 % ; Vicenne −36,9 % ; Cash Plus −32,5 % ; CMGP −28,8 % ; T2S −15,1 % ; CFG Bank +20,2 % |
| Résultat 1 : flux annuels des fonds Actions | `analytics.flux_opcvm_annuel` (`flux_net_md`, en Md MAD, par catégorie et par année) | 2024 +1,1 ; 2025 +10,6 ; 2026 −0,6 (jusqu'au 16/10) |
| Résultat 7 : moyennes après décision BAM | `analytics.masi_moyennes_decisions_bam` (`rendement_anormal_20_moyen_pct`, `rendement_anormal_5_moyen_pct`) | Baisses : +4,2 points (3 décisions) à 20 séances |
| « 58 % du rendement » (carte vedette de l'accueil) | `analytics.synthese_classes_actifs.part_rdt_masi_pct` (rendement annualisé en % de celui du MASI) ; `part_risque_masi_pct` pour « la moitié de son risque » | Portefeuille équilibré : 58,3 % du rendement (arrondi `58 %` dans le README), 49,5 % du risque |

« 58 % » compare les rendements **annualisés** (7,43 % / 12,73 %). Avec les rendements cumulés on
obtiendrait 55,5 % : le site doit utiliser la colonne `part_rdt_masi_pct`, pas recalculer.

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
