# Décisions

Chaque choix important, sa date et sa raison. J'ajoute une ligne à chaque nouvelle décision.

| Date | Décision | Raison |
|---|---|---|
| 06/11/2026 | Site dans le même dépôt (`web/`), pas de nouveau dépôt | Le site présente les résultats de ce projet ; un seul dépôt = une seule histoire pour les recruteurs |
| 06/11/2026 | Next.js + Tailwind + shadcn/ui + Recharts plutôt que Streamlit | Dashboard interactif et moderne, design sur mesure ; Streamlit reste possible pour un prototype |
| 06/11/2026 | Supabase (PostgreSQL) comme base en ligne | Même moteur que ma base locale : SQL, vues et dbt réutilisés tels quels ; gratuit |
| 06/11/2026 | Migration par les scripts et dbt, pas par copie de la base | PostgreSQL 18 en local et la version de Supabase peuvent différer ; les scripts sont reproductibles |
| 06/11/2026 | Le site lit la base côté serveur avec un rôle en lecture seule | Aucun identifiant dans le navigateur ; pas besoin d'exposer les schémas via l'API Supabase |
| 06/11/2026 | Aucun calcul dans le site | Les calculs sont déjà testés en SQL et dbt ; un seul endroit où ils vivent |
| 06/11/2026 | Mise à jour hebdomadaire (samedi) + maintien le mercredi | Les fichiers AMMC sont hebdomadaires ; un projet Supabase gratuit se met en pause après 7 jours sans activité |
| 06/11/2026 | MASI, IPO, HCP et PER restent manuels | Pas de source automatisable fiable ou gratuite pour l'instant |
| 06/11/2026 | Couleurs reprises du thème Power BI | Identité visuelle commune entre le dashboard Power BI et le site |
| 06/11/2026 | Taille de la base locale mesurée (tâche A4) : 13 Mo (`pg_database_size`), contre 500 Mo de limite du plan gratuit Supabase | Le plus gros tableau est `staging.macro_indicateurs` (1,7 Mo) : la base tient largement dans l offre gratuite, sans compression ni tri des données |
