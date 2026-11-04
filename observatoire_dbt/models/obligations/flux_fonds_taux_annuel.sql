-- Q4 (bilan annuel) : flux nets de l'année, rendement et variation du taux 10 ans
select
    a.categorie,
    a.annee,
    a.rendement_pct,
    a.var_taux_10a_pb,
    sum(f.souscriptions - f.rachats) as flux_net
from {{ ref('fonds_taux_annuel') }} a
join {{ source('staging', 'ammc_flux') }} f
    on f.categorie = a.categorie
   and f.date > a.date_debut
   and f.date <= a.date_fin
group by a.categorie, a.annee, a.rendement_pct, a.var_taux_10a_pb