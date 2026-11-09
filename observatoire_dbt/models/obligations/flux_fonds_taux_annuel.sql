-- Q4 (bilan annuel) : flux nets de l'année, rendement et variation du taux 10 ans
-- premiere_date, derniere_date et annee_partielle viennent de fonds_taux_annuel (mêmes semaines).
select
    a.categorie,
    a.annee,
    a.rendement_pct,
    a.var_taux_10a_pb,
    sum(f.souscriptions - f.rachats) as flux_net,
    a.premiere_date,
    a.derniere_date,
    a.annee_partielle
from {{ ref('fonds_taux_annuel') }} a
join {{ source('staging', 'ammc_flux') }} f
    on f.categorie = a.categorie
   and f.date > a.date_debut
   and f.date <= a.date_fin
group by a.categorie, a.annee, a.rendement_pct, a.var_taux_10a_pb,
         a.premiere_date, a.derniere_date, a.annee_partielle
