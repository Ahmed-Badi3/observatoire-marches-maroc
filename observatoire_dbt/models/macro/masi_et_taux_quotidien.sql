-- MASI et taux directeur en vigueur, pour chaque séance de bourse
select
    m.date      as date_seance,
    m.cloture   as masi,
    t.taux_directeur_pct
from {{ source('staging', 'bvc_indices') }} m
join {{ ref('taux_directeur_quotidien') }} t on t.date_jour = m.date
where m.indice = 'MASI'