-- Flux net annuel (souscriptions − rachats) de chaque catégorie d'OPCVM, par année civile.
-- Montants en dirhams (MAD) et en milliards (flux_net_md). La 1re et la dernière année sont partielles :
-- voir nb_semaines (2022 : à partir de fin septembre ; dernière année : jusqu'à la dernière semaine AMMC).
-- premiere_date, derniere_date et annee_partielle servent au site à étiqueter « 2026 (jan.–oct.) ».
select
    categorie,
    extract(year from date)::int                                   as annee,
    count(*)                                                       as nb_semaines,
    sum(souscriptions - rachats)                                   as flux_net,
    round((sum(souscriptions - rachats) / 1e9)::numeric, 2)        as flux_net_md,
    min(date)                                                      as premiere_date,
    max(date)                                                      as derniere_date,
    {{ annee_partielle('min(date)', 'max(date)', 'extract(year from date)::int') }} as annee_partielle
from {{ source('staging', 'ammc_flux') }}
where categorie <> 'Total'
group by categorie, extract(year from date)
