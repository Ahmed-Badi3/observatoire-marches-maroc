# Tâches

Règle : une tâche = une session Claude Code. Cocher seulement après vérification.
Chaque tâche indique comment je vérifie qu'elle est terminée.

## Phase A — Préparer le dépôt
- [ ] **A1** Compléter `.gitignore` : `.env.local`, `node_modules/`, `.next/`, `logs/`.
  Retirer `logs/dbt.log` du suivi Git. *Vérif : `git status` ne montre plus ces fichiers.*
- [ ] **A2** Compléter `docs/DATA.md` : colonnes exactes de chaque table listée,
  à partir de `sql/` et des `.yml` dbt. Signaler toute incertitude. *Vérif : je relis.*
- [ ] **A3** Créer `scripts/connexion.py` : utilise `DATABASE_URL` si elle existe,
  sinon `config.py`. Faire utiliser ce module par les scripts 04, 05, 06, 08, 09.
  *Vérif : chaque script tourne toujours en local, mêmes nombres de lignes.*
- [ ] **A4** Mesurer la taille de la base locale
  (`SELECT pg_size_pretty(pg_database_size('observatoire_maroc'));`).
  *Vérif : moins de 500 Mo, noté dans DECISIONS.md.*

## Phase B — La base dans Supabase
- [ ] **B1** Créer le projet Supabase (région Europe), connecter le MCP Supabase.
  *Vérif : Claude liste les schémas du projet.*
- [ ] **B2** Créer les schémas `staging` et `dw`, exécuter `sql/01` à `sql/06`.
  *Vérif : les tables et vues existent, vides.*
- [ ] **B3** Depuis mon PC, avec `DATABASE_URL` vers Supabase, relancer les chargements
  dans l'ordre du README (04, 05, 06, 08, 09).
  *Vérif : nombre de lignes identique au local, table par table.*
- [ ] **B4** Ajouter la cible `supabase` dans `profiles.yml` (hors dépôt), lancer
  `dbt build --target supabase`. *Vérif : tous les tests dbt passent.*
- [ ] **B5** Contrôle des chiffres : requêtes sur Supabase pour 3 valeurs de contrôle
  (MASI +42,3 % et Sharpe 0,66 ; corrélation flux +0,43 ; CFG Bank +66,4 %).
  *Vérif : identiques au README.*
- [ ] **B6** Créer le rôle `site_lecture` (SELECT sur `dw` et `analytics`) et une vue
  `dw.v_valorisation` pour les PER. *Vérif : `site_lecture` lit une vue et ne peut pas écrire.*

## Phase C — La mise à jour hebdomadaire
- [ ] **C1** Vérifier les conditions d'utilisation des sites AMMC et Bank Al-Maghrib
  pour une collecte automatique hebdomadaire. *Vérif : noté dans DATA.md.*
- [ ] **C2** Adapter la collecte AMMC pour ne télécharger que les nouvelles semaines
  et mettre à jour les CSV de `data/processed/`. *Vérif : relancer deux fois n'ajoute rien.*
- [ ] **C3** Adapter `07_collecter_courbe_bam.py` pour reprendre depuis la dernière date
  en base (et plus depuis le fichier brut local). *Vérif : il ne collecte que les jours manquants.*
- [ ] **C4** Créer `.github/workflows/mise_a_jour.yml` : chaque samedi, AMMC (C2) + courbe
  (C3) + `dbt build --target supabase` ; `DATABASE_URL` dans les Secrets GitHub.
  *Vérif : lancement manuel réussi depuis l'onglet Actions.*
- [ ] **C5** Ajouter le maintien du mercredi (`SELECT 1`). *Vérif : exécution verte.*
- [ ] **C6** Écrire dans DATA.md la procédure manuelle (MASI, IPO, HCP, PER).
  *Vérif : je peux la suivre seul.*
- [ ] **C7** Laisser tourner deux samedis. *Vérif : la nouvelle semaine AMMC apparaît dans Supabase.*

## Phase D — Le squelette du site
- [ ] **D1** Créer l'app Next.js dans `web/` (TypeScript, Tailwind CSS, App Router),
  installer shadcn/ui, Recharts, lucide-react et la police Plus Jakarta Sans.
  *Vérif : `npm run dev` affiche la page par défaut.*
- [ ] **D2** Couleurs, police, rayons et ombres de DESIGN.md en variables CSS / Tailwind.
  *Vérif : une page de test montre chaque couleur.*
- [ ] **D3** Mise en page commune : barre latérale (7 pages), barre du haut, pied de page
  avec mention légale. Pages vides. *Vérif : navigation entre les 7 pages, ordinateur et téléphone.*
- [ ] **D4** Connexion à Supabase côté serveur avec `site_lecture` (`web/.env.local`),
  revalidation 24 h. *Vérif : la date de la dernière semaine AMMC s'affiche dans la barre latérale.*
- [ ] **D5** Fonctions de format français (pourcentages, montants, pb, dates) avec tests.
  *Vérif : tests verts, `0.423` → `+42,3 %`.*
- [ ] **D6** Déployer sur Vercel (dossier racine `web`, variables d'environnement).
  *Vérif : le site en ligne affiche la même date.*

## Phase E — Les pages
- [ ] **E1** Composants communs : carte KPI, carte vedette, carte de résultat, onglets,
  tableau triable, squelette de chargement. *Vérif : page de démonstration.*
- [ ] **E2** Accueil : bandeau, 2 cartes vedettes, 4 cartes KPI.
- [ ] **E3** Accueil : nuage rendement / risque + rangée des 6 modules.
- [ ] **E4** OPCVM et marché actions : résultats 1 et 2 (flux vs MASI, timing, volatilité, drawdown).
- [ ] **E5** OPCVM et marché actions : résultats 3 et 4 (MASI vs MASI 20, PER).
- [ ] **E6** Contexte économique : résultats 5 à 7, bascule nominal / réel.
- [ ] **E7** Taux et obligations : résultats 8 et 9 (fonds par année, sensibilité).
- [ ] **E8** Taux et obligations : résultats 10 et 11 (anticipations, flux) + courbe des taux.
- [ ] **E9** Introductions en bourse : résultats 12 à 14, tableau triable des 6 IPO.
- [ ] **E10** Synthèse : résultats 15 et 16, choix du portefeuille type.
- [ ] **E11** Synthèse : résultats 17 et 18, carte de chaleur des corrélations.
- [ ] **E12** Méthode et sources : architecture, qualité des données, limites, sources.

*Vérif pour chaque tâche E : capture Playwright ordinateur et téléphone, et chaque chiffre
identique à la valeur de contrôle de DATA.md.*

## Phase F — Vérification, mise en ligne, vitrine
- [ ] **F1** Revue complète : téléphone, console sans erreur, donnée manquante gérée, accessibilité clavier.
- [ ] **F2** README : lien du site en haut, captures, feuille de route mise à jour
  (« dashboard public » = le site).
- [ ] **F3** Test réel : ajouter l'IPO de Laprophan (fin novembre 2026) avec la procédure
  manuelle. *Vérif : la page IPO l'affiche après le prochain build.*
- [ ] **F4** Épingler le dépôt sur mon profil GitHub, post LinkedIn.
