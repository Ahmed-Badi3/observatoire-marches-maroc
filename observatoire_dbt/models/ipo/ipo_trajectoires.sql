-- Trajectoire de chaque introduction en bourse après sa 1re cotation, en base 100 au prix d'introduction.
-- n_seance = 0 : le prix d'introduction (100) ; n_seance = 1 : la 1re clôture ; … jusqu'à 120 séances (≈ 6 mois).
-- Image : la courbe de vol d'un avion, mesurée à partir de son altitude de départ.
-- Sert au graphique « Trajectoire après l'introduction » du site (CORRECTIONS.md, structure de la page IPO).

with ipo as (
    select ticker, societe, date_premiere_cotation, prix_ipo
    from {{ ref('ipo_operations') }}
    where date_premiere_cotation is not null
),

titre as (
    select
        c.ticker,
        c.cloture,
        row_number() over (partition by c.ticker order by c.date_seance) as n_seance
    from {{ source('staging_ipo', 'bvc_cours_titres') }} c
    join ipo i
      on i.ticker = c.ticker
     and c.date_seance >= i.date_premiere_cotation
)

select i.ticker, i.societe, 0 as n_seance, 100.0 as base_100
from ipo i

union all

select t.ticker, i.societe, t.n_seance, round((t.cloture / i.prix_ipo * 100)::numeric, 2) as base_100
from titre t
join ipo i using (ticker)
where t.n_seance <= 120
