-- Taux BAM interpolés à maturités fixes (13 semaines, 1, 2, 5, 10 ans), par jour de courbe
-- Les points listés dans le seed exclusions_courbe_bam (cotations aberrantes d'un jour) sont écartés.
with points as (
    select
        b.date_courbe,
        (b.date_echeance - b.date_courbe) / 365.0 as maturite_ans,
        b.taux_pct
    from {{ source('staging', 'bam_courbe_taux') }} b
    left join {{ ref('exclusions_courbe_bam') }} x
        on x.date_courbe = b.date_courbe
       and x.date_echeance = b.date_echeance
    where b.date_echeance > b.date_courbe
      and x.date_courbe is null
),

cibles as (
    select * from (values
        ('13 sem', 0.25),
        ('1 an',   1.0),
        ('2 ans',  2.0),
        ('5 ans',  5.0),
        ('10 ans', 10.0)
    ) as c(maturite, cible_ans)
),

-- point juste EN DESSOUS de la maturité cible
bas as (
    select distinct on (p.date_courbe, c.maturite)
        p.date_courbe, c.maturite, c.cible_ans,
        p.maturite_ans as m1, p.taux_pct as t1
    from points p
    join cibles c on p.maturite_ans <= c.cible_ans
    order by p.date_courbe, c.maturite, p.maturite_ans desc
),

-- point juste AU DESSUS de la maturité cible
haut as (
    select distinct on (p.date_courbe, c.maturite)
        p.date_courbe, c.maturite,
        p.maturite_ans as m2, p.taux_pct as t2
    from points p
    join cibles c on p.maturite_ans >= c.cible_ans
    order by p.date_courbe, c.maturite, p.maturite_ans asc
)

select
    b.date_courbe,
    b.maturite,
    b.cible_ans,
    round(
        case
            when h.m2 = b.m1 then b.t1
            else b.t1 + (b.cible_ans - b.m1) / (h.m2 - b.m1) * (h.t2 - b.t1)
        end, 4) as taux_pct,
    round(b.m1, 2) as maturite_bas_ans,
    round(h.m2, 2) as maturite_haut_ans
from bas b
join haut h using (date_courbe, maturite)