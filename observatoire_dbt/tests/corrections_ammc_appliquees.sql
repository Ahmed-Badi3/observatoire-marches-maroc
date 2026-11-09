-- Chaque correction du seed doit viser une semaine qui existe, et donner un indice recalculé
-- à moins de 0,5 % de la semaine précédente (une semaine normale pour un fonds monétaire ou CT).
-- Le test échoue s'il renvoie une ligne.
with c as (
    select * from {{ ref('corrections_indices_ammc') }}
),
i as (
    select
        date, categorie, indice, corrige,
        indice / lag(indice) over (partition by categorie order by date) - 1 as variation
    from {{ ref('ammc_indices_corriges') }}
)
select c.date, c.categorie, i.indice, i.variation
from c
left join i on i.date = c.date and i.categorie = c.categorie
where i.date is null or not i.corrige or abs(i.variation) > 0.005
