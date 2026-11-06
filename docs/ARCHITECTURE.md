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

## Ce qui reste manuel
Export du MASI, cours des IPO, données HCP, taux directeur, PER (n8n). Procédure :
lancer le script en local avec `DATABASE_URL` pointant vers Supabase, puis
`dbt build --target supabase`.

## Sécurité
- `site_lecture` : `GRANT USAGE` et `GRANT SELECT` sur `dw` et `analytics`, rien d'autre.
- Secrets : `scripts/config.py`, `web/.env.local`, Secrets GitHub, variables Vercel.
- Dépôt public : aucun secret dans un fichier suivi par Git.

## Choix et raisons
Voir `docs/DECISIONS.md`.
