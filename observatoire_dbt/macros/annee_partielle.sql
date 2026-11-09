-- Une année civile est « partielle » si les données ne la couvrent pas entièrement :
-- elles commencent après le 10 janvier ou s'arrêtent avant le 20 décembre.
-- Les marges laissent la place aux jours fériés : la 1re semaine AMMC tombe entre le 2 et le 8 janvier,
-- la dernière entre le 24 et le 31 décembre ; la 1re et la dernière séance de bourse, de même.
-- Exemples : 2022 de l'AMMC (à partir du 30/09) et l'année en cours (jusqu'à la dernière semaine) sont partielles.
-- Utilisée par le site pour écrire « 2026 (jan.–oct.) » sous une barre (Priorité 2, docs/CORRECTIONS.md).
-- Même règle, écrite à la main, dans sql/03_dw_marche_actions.sql (vue dw.v_masi_annuel).
{% macro annee_partielle(premiere_date, derniere_date, annee) -%}
    ({{ premiere_date }} > make_date({{ annee }}, 1, 10) or {{ derniere_date }} < make_date({{ annee }}, 12, 20))
{%- endmacro %}
