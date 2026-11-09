-- Indices de performance AMMC, avec les semaines manifestement fausses corrigées (seed corrections_indices_ammc).
-- Image : un relevé de compteur mal recopié ; on le reconstitue à partir de la consommation de la semaine,
-- publiée à côté. Toutes les autres semaines sont reprises telles quelles.
-- Lu par synthese_rendements_hebdo et obligations_vs_taux_hebdo à la place de staging.ammc_indices.
-- (dw.fact_opcvm_hebdo, utilisé par Power BI, lit toujours staging : non modifié.)

with indices as (
    select
        date,
        categorie,
        indice::numeric        as indice,
        var_hebdo_pct::numeric as var_hebdo_pct
    from {{ source('staging', 'ammc_indices') }}
),

voisins as (
    select
        *,
        lag(indice)         over w as indice_precedent,
        lead(indice)        over w as indice_suivant,
        lead(var_hebdo_pct) over w as var_hebdo_suivante_pct
    from indices
    window w as (partition by categorie order by date)
),

corrections as (
    select date, categorie, methode
    from {{ ref('corrections_indices_ammc') }}
)

select
    v.date,
    v.categorie,
    case c.methode
        when 'variation_publiee'          then v.indice_precedent * (1 + v.var_hebdo_pct / 100)
        when 'variation_semaine_suivante' then v.indice_suivant / (1 + v.var_hebdo_suivante_pct / 100)
        else v.indice
    end                     as indice,
    v.indice                as indice_publie,
    c.methode is not null   as corrige
from voisins v
left join corrections c
    on c.date = v.date
   and c.categorie = v.categorie
