# Architecture

## Vue d'ensemble
```
EXISTANT (inchangé)
Sources ──> scripts/ 01-09 ──> PostgreSQL local (staging, dw) ──> dbt (analytics) ──> Power BI

AJOUT
Mêmes scripts ──> Supabase (staging, dw, analytics) ──> site web/ (Next.js, Vercel)
                         ^
GitHub Actions ──────────┘  chaque samedi : AMMC + courbe BAM, puis dbt build
                            chaque mercredi : requête de maintien (SELECT 1)
```

## Les briques
| Brique | Rôle | Où |
|---|---|---|
| Scripts Python | Collecte, nettoyage, chargement | `scripts/` |
| SQL | Schémas `staging` et `dw` | `sql/` |
| dbt | Schéma `analytics`, tests | `observatoire_dbt/` |
| PostgreSQL local | Base de travail et Power BI | Mon PC |
| Supabase | Base en ligne lue par le site | supabase.com (gratuit) |
| GitHub Actions | Mise à jour hebdomadaire | `.github/workflows/` |
| Next.js | Site interactif | `web/` |
| Vercel | Hébergement du site | vercel.com (gratuit, non commercial) |

## Comment le site lit les données
- Les pages lisent la base **côté serveur** (composants serveur Next.js), avec le rôle
  `site_lecture` (SELECT seulement). Aucun identifiant n'est envoyé au navigateur.
- Connexion par le pooler de Supabase (mode transaction), adapté à Vercel.
- Les pages sont régénérées au plus une fois par jour (revalidation 24 h) :
  rapide pour le visiteur et peu de requêtes sur Supabase.
- Les graphiques interactifs (filtres, info-bulles) reçoivent des données déjà
  préparées et s'exécutent dans le navigateur (composants client avec Recharts).

## Connexion à la base pour les scripts
- En local : `scripts/config.py` (comme aujourd'hui).
- Dans GitHub Actions : variable d'environnement `DATABASE_URL` (Secret du dépôt).
- Règle : si `DATABASE_URL` existe, les scripts l'utilisent ; sinon, `config.py`.
- Les scripts parlent à la base par deux chemins : SQLAlchemy et psycopg (04, 05), psycopg2
  (06, 08, 09). `scripts/connexion.py` doit servir les deux.
- dbt n'utilise pas `DATABASE_URL` : son profil lit l'hôte, l'utilisateur et le mot de passe
  séparément. Dans GitHub Actions, il faut un profil sans secret dans le dépôt, qui lit ces valeurs
  dans des variables d'environnement (tâche C4).

## Ce qui reste manuel
Export du MASI, cours des IPO, données HCP, taux directeur, PER. Procédure :
lancer le script en local avec `DATABASE_URL` pointant vers Supabase, puis
`dbt build --target supabase`.
- MASI : scripts 05 **et** 09, car il alimente deux tables.
- PER : n8n écrit toujours dans la base locale. On exporte ensuite les lignes dans le CSV suivi par
  Git, puis on lance le chargeur vers Supabase (tâche A7).

## Fraîcheur des données
- AMMC et courbe BAM sont automatiques, le MASI est manuel. Les vues qui croisent AMMC et MASI
  s'arrêtent à la dernière semaine couverte par le MASI (tâche A9).
- Les valeurs de contrôle se comparent sur une copie figée de la base, pas sur le site en ligne (tâche B7).

## Sécurité
- `site_lecture` : `GRANT USAGE` et `GRANT SELECT` sur `dw` et `analytics`, rien d'autre.
  Ces droits doivent survivre à `dbt build` (à vérifier à la tâche B6).
- Secrets : `scripts/config.py`, `web/.env.local`, Secrets GitHub, variables Vercel.
- Dépôt public : aucun secret dans un fichier suivi par Git.

## Choix et raisons
Voir `docs/DECISIONS.md`.
