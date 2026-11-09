# Observatoire des marchés financiers marocains

## Contexte
Projet d'analyse terminé : 6 modules (OPCVM, marché actions, contexte économique,
taux et obligations, introductions en bourse, synthèse quantitative), données
septembre 2022 → novembre 2026. Voir README.md.

J'ajoute maintenant un site public, interactif et moderne, dans `web/`, qui présente
ces résultats. Le site est une vitrine : il lit les données, il ne calcule rien.

Je suis ingénieur financier et j'apprends le code. Explique tes choix simplement,
avec une image concrète avant le terme technique.

@docs/PRD.md
@docs/TASKS.md

## Structure du dépôt
- `scripts/` : collecte et chargement, numérotés 01 à 09, à lancer dans l'ordre, plus
  `10_charger_valorisation.py` (PER et dividendes, depuis `data/processed/valorisation_marche.csv`)
  et `11_ajouter_semaines_ammc.py` (ajoute les nouvelles semaines AMMC aux CSV, après le 01).
  Connexion par `scripts/connexion.py` : `DATABASE_URL` si elle existe, sinon `scripts/config.py`
  (ignoré par Git, modèle : `config.example.py`).
- `sql/` : tables de `staging` et vues en étoile de `dw`, fichiers 01 à 07
  (`07_site_lecture.sql` : rôle `site_lecture` et vue `dw.v_valorisation`). `sql/local/` : fichiers pour la base
  locale seulement (droits de l'agent IA, copie figée). Les schémas se créent à part.
- `observatoire_dbt/` : projet dbt, schéma `analytics` (modules macro, obligations, ipo, synthese).
- `data/processed/` : CSV nettoyés (sur GitHub). `data/raw/` : fichiers bruts (PAS sur GitHub).
- `dashboard/` : Power BI (.pbix) + `theme_observatoire.json` (couleurs de référence).
- `n8n/` : workflows locaux (PER via Gemini, agent analyste). Hors du site.
- `web/` : site Next.js + Tailwind CSS + shadcn/ui + Recharts, déployé sur Vercel.
- `docs/` : PRD, DATA, ARCHITECTURE, DESIGN, TASKS, DECISIONS.

## Bases de données
- Locale : PostgreSQL 18, base `observatoire_maroc`.
- Locale, copie figée au 03/11/2026 : base `observatoire_fige` (lecture seule, rôle `site_lecture` local),
  pour comparer le site aux valeurs de contrôle.
- En ligne : Supabase, mêmes schémas `staging`, `dw`, `analytics`.
- Le site se connecte avec le rôle `site_lecture` (SELECT seulement sur `dw` et `analytics`).

## Commandes
- Construire les données en local : `cd observatoire_dbt && dbt build`
- Construire les données sur Supabase : `cd observatoire_dbt && dbt build --target supabase`
- Lancer le site : `cd web && npm run dev`
- Vérifier le site avant un commit : `cd web && npm run lint && npm run build`

## Règles
- Une seule tâche de `docs/TASKS.md` à la fois. Coche-la seulement quand je l'ai validée.
- Lis `docs/DATA.md` avant de toucher aux données, `docs/DESIGN.md` avant l'interface.
- Le site lit seulement `dw` et `analytics`, en lecture seule. Tout calcul reste en SQL ou dbt.
- Aucun chiffre écrit en dur dans le site, y compris dans les phrases : tout vient de la base.
- Sur la copie figée des données au 03/11/2026, chaque chiffre affiché doit être identique au README
  (valeurs de contrôle dans `docs/DATA.md`). En ligne, les chiffres évoluent et leur date est affichée.
- Nombres au format français : `16 537,91`, `+42,3 %`, `−19,0 %`, `0,66`, `+68 pb`.
- Ne modifie pas `n8n/`, `dashboard/` ni les scripts 01 à 09 sans me le demander.
  Si une tâche l'exige, explique d'abord pourquoi.
- Secrets : `scripts/config.py`, `web/.env.local` (`DATABASE_URL`, `GEMINI_API_KEY` de l'assistant IA)
  ou Secrets GitHub / variables de Vercel. Jamais dans le code.
- N'installe aucune nouvelle dépendance sans me demander.
- Quand tu modifies un fichier de configuration ou de code que je dois relire,
  montre-moi le contenu complet du fichier, pas seulement le passage modifié.
- À la fin de chaque tâche : explique en 2-3 phrases ce que tu as fait, comment je
  le vérifie, et propose un message de commit.
