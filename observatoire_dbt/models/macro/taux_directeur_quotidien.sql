-- Taux directeur en vigueur chaque jour ("escalier")
with decisions as (

    select
        date_effet,
        taux_directeur_pct,
        lead(date_effet) over (order by date_effet) as date_decision_suivante
    from {{ ref('decisions_bam') }}

),

jours as (

    select generate_series(
        (select min(date_effet) from decisions),
        current_date,
        interval '1 day'
    )::date as date_jour

)

select
    j.date_jour,
    d.taux_directeur_pct,
    d.date_effet as date_derniere_decision
from jours j
join decisions d
  on j.date_jour >= d.date_effet
 and (j.date_jour < d.date_decision_suivante or d.date_decision_suivante is null)