-- Flux net annuel (souscriptions − rachats) de chaque catégorie d'OPCVM, par année civile.
-- Montants en dirhams (MAD) et en milliards (flux_net_md). La 1re et la dernière année sont partielles :
-- voir nb_semaines (2022 : à partir de fin septembre ; dernière année : jusqu'à la dernière semaine AMMC).
select
    categorie,
    extract(year from date)::int                                   as annee,
    count(*)                                                       as nb_semaines,
    sum(souscriptions - rachats)                                   as flux_net,
    round((sum(souscriptions - rachats) / 1e9)::numeric, 2)        as flux_net_md
from {{ source('staging', 'ammc_flux') }}
where categorie <> 'Total'
group by categorie, extract(year from date)
