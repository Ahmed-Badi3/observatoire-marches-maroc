-- LOCAL SEULEMENT : droits de lecture du rôle `agent_lecture` (agent analyste n8n).
-- À exécuter sur la base locale `observatoire_maroc`, jamais sur Supabase (ce rôle n'y existe pas).
-- Pour Supabase, le rôle du site (`site_lecture`) est créé à la tâche B6.
-- Relevé des droits présents sur la base locale (tâche A5). Relançable sans effet de bord.

GRANT SELECT ON staging.ammc_actif_net       TO agent_lecture;
GRANT SELECT ON staging.ammc_actif_valeurs   TO agent_lecture;
GRANT SELECT ON staging.ammc_flux            TO agent_lecture;
GRANT SELECT ON staging.ammc_indices         TO agent_lecture;
GRANT SELECT ON staging.bam_courbe_taux      TO agent_lecture;
GRANT SELECT ON staging.bvc_cours_titres     TO agent_lecture;
GRANT SELECT ON staging.bvc_indices          TO agent_lecture;
GRANT SELECT ON staging.macro_indicateurs    TO agent_lecture;
GRANT SELECT ON staging.valorisation_marche  TO agent_lecture;
