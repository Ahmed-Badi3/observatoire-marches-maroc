-- Chaque portefeuille type doit peser exactement 100 % (seed compositions_portefeuilles).
-- Le test échoue s'il renvoie une ligne.
select portefeuille, sum(poids_pct) as total
from {{ ref('compositions_portefeuilles') }}
group by portefeuille
having sum(poids_pct) <> 100
