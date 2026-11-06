# Tâches

Règle : une tâche = une session Claude Code. Cocher seulement après vérification.
Chaque tâche indique comment je vérifie qu'elle est terminée.

## Phase A — Préparer le dépôt
- [x] **A1** Compléter `.gitignore` : `.env.local`, `node_modules/`, `.next/`, `logs/`.
  Retirer `logs/dbt.log` du suivi Git. *Vérif : `git status` ne montre plus ces fichiers.*
- [x] **A2** Compléter `docs/DATA.md` : colonnes exactes de chaque table listée,
  à partir de `sql/` et des `.yml` dbt. Signaler toute incertitude. *Vérif : je relis.*
- [x] **A3** Créer `scripts/connexion.py` : utilise `DATABASE_URL` si elle existe,
  sinon `config.py`. Il doit servir les deux chemins existants : SQLAlchemy et psycopg (04, 05),
  psycopg2 (06, 08, 09). Le 07 l'utilisera à la tâche C3.
  *Vérif : chaque script tourne toujours en local, mêmes nombres de lignes.*
- [x] **A4** Mesurer la taille de la base locale
  (`SELECT pg_size_pretty(pg_database_size('observatoire_maroc'));`).
  *Vérif : moins de 500 Mo, noté dans DECISIONS.md.*
- [x] **A5** Écrire `sql/01_staging_ammc.sql` (vide aujourd'hui) à partir de la structure des 4 tables
  AMMC de la base locale. Dans `sql/06`, remplacer `DROP TABLE` par `CREATE TABLE IF NOT EXISTS` et
  retirer le `GRANT` à `agent_lecture` vers un fichier réservé au local.
  *Vérif : sur une base de test vide, `sql/01`, `04`, `05`, `06` s'exécutent sans erreur.*
- [x] **A6** Compléter `requirements.txt` avec `psycopg2-binary` et `dbt-postgres`, versions à valider.
  *Vérif : installation dans un environnement neuf, les scripts et `dbt --version` démarrent.*
- [x] **A7** Exporter `staging.valorisation_marche` dans un CSV suivi par Git, ajouter la date de
  publication de chaque étude et créer un script de chargement (ajouter ce script dans la structure de
  `CLAUDE.md`). `n8n/` ne change pas. *Vérif : 21 lignes rechargées, 19,4x daté de mai 2025, 18,0x
  d'octobre 2026.*
- [x] **A8** Ajouter en dbt les chiffres absents de la base : achat d'une IPO au 20e jour, flux annuels
  des fonds actions, moyennes après décision BAM, « 58 % du rendement ». *Vérif : SGTM −40,9 %,
  flux 2025 +10,6 Md, baisses +4,2, 58 %.*
- [x] **A9** Arrêter `dw.fact_masi_hebdo` à la dernière date couverte par le MASI, pour éviter de répéter
  une clôture figée sur les nouvelles semaines AMMC. *Vérif : corrélations +0,43 et −0,08 inchangées.*

## Phase B — La base dans Supabase
- [x] **B1** Créer le projet Supabase (région Europe), connecter le MCP Supabase.
  *Vérif : Claude liste les schémas du projet.*
- [x] **B2** Créer les schémas `staging` et `dw`, exécuter `sql/01`, `04`, `05` et `06`.
  Les vues de `sql/02` et `03` attendent la tâche B3, car elles lisent des tables créées par les scripts.
  *Vérif : les tables existent, vides.*
- [x] **B3** Depuis mon PC, avec `DATABASE_URL` vers Supabase, relancer les chargements
  (04, 05, 06, 08, 09 et le chargeur PER de A7), puis exécuter `sql/02` et `sql/03`.
  *Vérif : nombre de lignes identique au local, table par table, et les vues `dw` répondent.*
- [x] **B4** Ajouter la cible `supabase` dans `profiles.yml` (hors dépôt), lancer
  `dbt build --target supabase`. *Vérif : tous les tests dbt passent.*
- [x] **B5** Contrôle des chiffres : requêtes sur Supabase pour 4 valeurs de contrôle
  (MASI +42,3 % et Sharpe 0,66 ; corrélation flux +0,43 ; CFG Bank +66,4 %).
  *Vérif : identiques au README.*
- [x] **B6** Créer le rôle `site_lecture` (SELECT sur `dw` et `analytics`) et une vue
  `dw.v_valorisation` pour les PER, avec leur date de publication. Vérifier que ces droits survivent
  à `dbt build`, sinon les déclarer dans dbt. *Vérif : `site_lecture` lit une vue et ne peut pas
  écrire, y compris après un nouveau `dbt build --target supabase`.*
- [x] **B7** Créer en local une copie figée de la base (données au 03/11/2026), pour comparer le site
  aux valeurs de contrôle même quand Supabase aura évolué. Le site de vérification s'y connecte avec un
  rôle en lecture seule. *Vérif : les 12 lignes de contrôle de DATA.md s'y retrouvent.*

## Phase C — La mise à jour hebdomadaire
- [x] **C1** Vérifier les conditions d'utilisation des sites AMMC et Bank Al-Maghrib
  pour une collecte automatique hebdomadaire. *Vérif : noté dans DATA.md.*
- [x] **C2** Adapter la collecte AMMC pour ne télécharger que les nouvelles semaines
  et **ajouter** ces semaines aux CSV de `data/processed/`, sans les réécrire depuis `data/raw/`,
  absent de GitHub. *Vérif : relancer deux fois n'ajoute rien, l'historique reste complet.*
- [x] **C3** Adapter `07_collecter_courbe_bam.py` pour reprendre depuis la dernière date
  en base (et plus depuis le fichier brut local). *Vérif : il ne collecte que les jours manquants.*
- [x] **C4** Créer `.github/workflows/mise_a_jour.yml` : chaque samedi, AMMC (C2) +
  `dbt build --target supabase` (la courbe BAM de C3 reste manuelle : BAM refuse GitHub, voir DATA.md) ; `DATABASE_URL` dans les Secrets GitHub. Ajouter un profil dbt
  sans secret, qui lit ses valeurs dans les variables d'environnement, et faire committer les CSV mis
  à jour par le workflow. *Vérif : lancement manuel réussi depuis l'onglet Actions, et les CSV du
  dépôt contiennent la nouvelle semaine.*
- [ ] **C5** Ajouter le maintien du mercredi (`SELECT 1`). *Vérif : exécution verte.*
- [x] **C6** Écrire dans DATA.md la procédure manuelle (MASI par les scripts 05 et 09, IPO, HCP, PER).
  *Vérif : je peux la suivre seul.*
- [ ] **C7** Laisser tourner deux samedis. *Vérif : la nouvelle semaine AMMC apparaît dans Supabase.*

## Phase D — Le squelette du site
- [x] **D1** Créer l'app Next.js dans `web/` (TypeScript, Tailwind CSS, App Router),
  installer shadcn/ui, Recharts, lucide-react et la police Plus Jakarta Sans.
  Le client PostgreSQL (D4), l'outil de test (D5) et Playwright (tâches E) restent à me faire valider
  avant installation. *Vérif : `npm run dev` affiche la page par défaut.*
- [x] **D2** Couleurs, police, rayons et ombres de DESIGN.md en variables CSS / Tailwind.
  *Vérif : une page de test montre chaque couleur.*
- [x] **D3** Mise en page commune : barre latérale (7 pages), barre du haut, pied de page
  avec mention légale. Pages vides. *Vérif : navigation entre les 7 pages, ordinateur et téléphone.*
- [x] **D4** Connexion à Supabase côté serveur avec `site_lecture` (`web/.env.local`),
  revalidation 24 h. *Vérif : la date de la dernière semaine AMMC s'affiche dans la barre latérale.*
- [x] **D5** Fonctions de format français (pourcentages, montants, pb, pts, multiples, dates) avec tests.
  Les colonnes `_pct` sont déjà en pourcentage. *Vérif : tests verts, `42.26` → `+42,3 %`,
  `37.55` → `+37,6 %`, `17.25` → `+17,3 pts`, `18` → `18,0x`.*
- [x] **D6** Déployer sur Vercel (dossier racine `web`, variables d'environnement).
  *Vérif : le site en ligne affiche la même date.*

## Phase E — Les pages
- [ ] **E1** Composants communs : carte KPI, carte vedette, carte de résultat, onglets,
  tableau triable, squelette de chargement. *Vérif : page de démonstration.*
- [ ] **E2** Accueil : bandeau, 2 cartes vedettes, 4 cartes KPI.
- [ ] **E3** Accueil : nuage rendement / risque + tableau triable des placements + rangée des 6 modules.
- [ ] **E4** OPCVM et marché actions : résultats 1 et 2 (flux vs MASI, timing, volatilité, drawdown).
- [ ] **E5** OPCVM et marché actions : résultats 3 et 4 (MASI vs MASI 20, PER).
- [ ] **E6** Contexte économique : résultats 5 à 7, bascule nominal / réel.
- [ ] **E7** Taux et obligations : résultats 8 et 9 (fonds par année, sensibilité).
- [ ] **E8** Taux et obligations : résultats 10 et 11 (anticipations, flux) + courbe des taux.
- [ ] **E9** Introductions en bourse : résultats 12 à 14, tableau triable des 6 IPO.
- [ ] **E10** Synthèse : résultats 15 et 16, choix du portefeuille type.
- [ ] **E11** Synthèse : résultats 17 et 18, carte de chaleur des corrélations.
- [ ] **E12** Méthode et sources : architecture, qualité des données, limites, sources.

*Vérif pour chaque tâche E : capture Playwright ordinateur et téléphone, et, sur la copie figée de
la base (B7), chaque chiffre identique à la valeur de contrôle de DATA.md.*

## Phase F — Vérification, mise en ligne, vitrine
- [ ] **F1** Revue complète : téléphone, console sans erreur, donnée manquante gérée, accessibilité clavier.
- [ ] **F2** README : lien du site en haut, captures, feuille de route mise à jour
  (« dashboard public » = le site).
- [ ] **F3** Test réel : ajouter l'IPO de Laprophan (fin novembre 2026) avec la procédure
  manuelle. *Vérif : la page IPO l'affiche après le prochain build.*
- [ ] **F4** Épingler le dépôt sur mon profil GitHub, post LinkedIn.
