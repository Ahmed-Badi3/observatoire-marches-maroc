import { cacheLife } from "next/cache";

import { sql } from "@/lib/db";

// Lectures des pages de module. Règle du site : on LIT ce que la base a calculé (dw et analytics).
// Les seules opérations ici sont du rangement (to_char pour les dates) et, deux fois, une soustraction
// triviale écrite en SQL (base 100 → pourcentage, dirhams → milliards), signalée à chaque endroit.
//
// Chaque lecture a deux étages :
// - `lireXxx` : la requête, mise en cache 24 h (la base ne change qu'une fois par semaine) ;
// - `xxx` : la version sûre. Si la base est inaccessible, elle renvoie null et la page affiche
//   « Données indisponibles » au lieu de planter. Une erreur n'est pas mise en cache.

export type Ligne = Record<string, string | number | null>;

function plat(lignes: readonly object[]): Ligne[] {
  // Objets simples (le cache n'accepte pas les objets spéciaux de postgres.js).
  return lignes.map((l) => ({ ...(l as Ligne) }));
}

async function sur<T>(nom: string, lecture: () => Promise<T>): Promise<T | null> {
  try {
    return await lecture();
  } catch (erreur) {
    console.error(`Lecture impossible (${nom}) :`, erreur);
    return null;
  }
}

/* ---------- OPCVM et marché actions ---------- */

async function lireFluxAnnuel() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86400, expire: 604800 });
  return plat(await sql()`
    SELECT categorie, annee, nb_semaines, flux_net_md,
           to_char(premiere_date, 'YYYY-MM-DD') AS premiere_date, to_char(derniere_date, 'YYYY-MM-DD') AS derniere_date, annee_partielle
    FROM analytics.flux_opcvm_annuel ORDER BY categorie, annee`);
}
export const fluxAnnuel = () => sur("flux annuels", lireFluxAnnuel);

async function lireRendementsMasiAnnuels() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86400, expire: 604800 });
  return plat(await sql()`
    SELECT annee, nb_semaines, rendement_pct,
           to_char(premiere_date, 'YYYY-MM-DD') AS premiere_date, to_char(derniere_date, 'YYYY-MM-DD') AS derniere_date, annee_partielle
    FROM analytics.synthese_annuel WHERE actif = 'MASI' ORDER BY annee`);
}
export const rendementsMasiAnnuels = () => sur("rendements MASI annuels", lireRendementsMasiAnnuels);

async function lireKpiTiming() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86400, expire: 604800 });
  return plat(await sql()`
    SELECT corr_passe, corr_futur, masi_moyen_achat, masi_moyen_vente FROM dw.v_kpi_timing`);
}
export const kpiTiming = () => sur("timing des flux", lireKpiTiming);

async function lireMasiAnnuel() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86400, expire: 604800 });
  return plat(await sql()`
    SELECT annee, nb_seances, rendement_pct, volatilite_annualisee_pct, pire_drawdown_pct,
           to_char(premiere_date, 'YYYY-MM-DD') AS premiere_date, to_char(derniere_date, 'YYYY-MM-DD') AS derniere_date, annee_partielle
    FROM dw.v_masi_annuel ORDER BY annee`);
}
export const masiAnnuel = () => sur("MASI annuel", lireMasiAnnuel);

async function lireDrawdownMasi() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86400, expire: 604800 });
  return plat(await sql()`
    SELECT to_char(date, 'YYYY-MM-DD') AS date, drawdown_pct
    FROM dw.v_masi_drawdown ORDER BY date`);
}
export const drawdownMasi = () => sur("drawdown du MASI", lireDrawdownMasi);

async function lirePireDrawdown() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86400, expire: 604800 });
  return plat(await sql()`
    SELECT to_char(date, 'YYYY-MM-DD') AS date, drawdown_pct
    FROM dw.v_masi_drawdown ORDER BY drawdown_pct LIMIT 1`);
}
export const pireDrawdown = () => sur("pire drawdown", lirePireDrawdown);

async function lireIndices() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86400, expire: 604800 });
  // Seulement MASI et MASI 20 (DATA.md, incertitude 5 : la table peut contenir d'autres indices).
  return plat(await sql()`
    SELECT indice, to_char(date, 'YYYY-MM-DD') AS date, base_100, drawdown_pct
    FROM dw.v_indices_quotidien WHERE indice IN ('MASI', 'MASI 20') ORDER BY date, indice`);
}
export const indices = () => sur("indices", lireIndices);

async function lireIndicesSynthese() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86400, expire: 604800 });
  return plat(await sql()`
    SELECT indice, to_char(debut, 'YYYY-MM-DD') AS debut, to_char(fin, 'YYYY-MM-DD') AS fin,
           rendement_total_pct, volatilite_annualisee_pct, pire_drawdown_pct, drawdown_actuel_pct
    FROM dw.v_indices_synthese WHERE indice IN ('MASI', 'MASI 20') ORDER BY indice`);
}
export const indicesSynthese = () => sur("synthèse des indices", lireIndicesSynthese);

async function lireValorisation() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86400, expire: 604800 });
  return plat(await sql()`
    SELECT annee, perimetre, per, rendement_dividende_pct, estimation, source, url_article,
           to_char(date_article, 'YYYY-MM-DD') AS date_article
    FROM dw.v_valorisation ORDER BY date_article, perimetre, annee`);
}
export const valorisation = () => sur("valorisation", lireValorisation);

/* ---------- Contexte économique ---------- */

async function lireMacroTrimestriel() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86400, expire: 604800 });
  return plat(await sql()`
    SELECT annee, trimestre, trimestre_en_cours, perf_masi_annuelle_pct, croissance_pib_pct
    FROM analytics.masi_vs_macro_trimestriel
    WHERE perf_masi_annuelle_pct IS NOT NULL ORDER BY date_ref`);
}
export const macroTrimestriel = () => sur("MASI et PIB", lireMacroTrimestriel);

async function lireMacroPic() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86400, expire: 604800 });
  return plat(await sql()`
    SELECT annee, trimestre, trimestre_en_cours, perf_masi_annuelle_pct, croissance_pib_pct
    FROM analytics.masi_vs_macro_trimestriel
    WHERE perf_masi_annuelle_pct IS NOT NULL AND croissance_pib_pct IS NOT NULL
    ORDER BY perf_masi_annuelle_pct DESC LIMIT 1`);
}
export const macroPic = () => sur("pic MASI / PIB", lireMacroPic);

async function lireRendementReel() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86400, expire: 604800 });
  // `- 100` : la base donne un indice de base 100 ; on en tire « +50,5 % » directement en SQL.
  return plat(await sql()`
    SELECT to_char(derniere_seance, 'YYYY-MM-DD') AS date,
           masi_nominal_base100, masi_reel_base100,
           masi_nominal_base100 - 100 AS nominal_pct, masi_reel_base100 - 100 AS reel_pct
    FROM analytics.masi_rendement_reel ORDER BY mois`);
}
export const rendementReel = () => sur("rendement réel", lireRendementReel);

async function lireInflation() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86400, expire: 604800 });
  return plat(await sql()`
    SELECT to_char(date_ref, 'YYYY-MM-DD') AS date, inflation_annuelle_pct
    FROM analytics.inflation_mensuelle
    WHERE inflation_annuelle_pct IS NOT NULL
      AND date_ref >= (SELECT min(date) FROM dw.fact_opcvm_hebdo)
    ORDER BY date_ref`);
}
export const inflation = () => sur("inflation", lireInflation);

async function lireInflationPic() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86400, expire: 604800 });
  return plat(await sql()`
    SELECT to_char(date_ref, 'YYYY-MM-DD') AS date, inflation_annuelle_pct
    FROM analytics.inflation_mensuelle
    WHERE inflation_annuelle_pct IS NOT NULL
      AND date_ref >= (SELECT min(date) FROM dw.fact_opcvm_hebdo)
    ORDER BY inflation_annuelle_pct DESC LIMIT 1`);
}
export const inflationPic = () => sur("pic d'inflation", lireInflationPic);

async function lireMoyennesBam() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86400, expire: 604800 });
  return plat(await sql()`
    SELECT type_decision, nb_decisions, rendement_anormal_5_moyen_pct, rendement_anormal_20_moyen_pct
    FROM analytics.masi_moyennes_decisions_bam ORDER BY type_decision`);
}
export const moyennesBam = () => sur("moyennes après décisions BAM", lireMoyennesBam);

async function lireDecisionsBam() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86400, expire: 604800 });
  return plat(await sql()`
    SELECT to_char(date_annonce, 'YYYY-MM-DD') AS date_annonce, type_decision, variation_pb,
           taux_directeur_pct, perf_5_seances_pct, perf_20_seances_pct,
           rendement_anormal_5_pct, rendement_anormal_20_pct
    FROM analytics.masi_autour_decisions_bam ORDER BY date_annonce`);
}
export const decisionsBam = () => sur("décisions BAM", lireDecisionsBam);

// Dates des hausses du taux directeur (toutes, y compris avant le début de l'historique du MASI),
// et première séance du MASI : pour expliquer pourquoi il n'y a pas de barre « Hausse ».
async function lireHaussesBam() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86400, expire: 604800 });
  return plat(await sql()`
    SELECT to_char(date_effet, 'YYYY-MM-DD') AS date_effet,
           (SELECT to_char(min(date), 'YYYY-MM-DD') FROM dw.fact_masi_quotidien) AS debut_masi
    FROM analytics.decisions_bam WHERE type_decision = 'hausse' ORDER BY date_effet`);
}
export const haussesBam = () => sur("hausses du taux directeur", lireHaussesBam);

/* ---------- Taux et obligations ---------- */

async function lireFondsTauxAnnuel() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86400, expire: 604800 });
  return plat(await sql()`
    SELECT categorie, annee, rendement_pct, var_taux_10a_pb, taux_10a_debut,
           to_char(premiere_date, 'YYYY-MM-DD') AS premiere_date, to_char(derniere_date, 'YYYY-MM-DD') AS derniere_date, annee_partielle
    FROM analytics.fonds_taux_annuel ORDER BY annee, categorie`);
}
export const fondsTauxAnnuel = () => sur("fonds de taux par année", lireFondsTauxAnnuel);

async function lireSensibilite() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86400, expire: 604800 });
  return plat(await sql()`
    SELECT periode, categorie, nb_semaines, sensibilite_implicite, correlation, r2,
           r2 * 100 AS r2_pct -- même valeur, en % (« les taux expliquent 57 % »)
    FROM analytics.sensibilite_fonds_taux ORDER BY periode, categorie`);
}
export const sensibilite = () => sur("sensibilité", lireSensibilite);

async function lireTauxAutourDecisions() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86400, expire: 604800 });
  return plat(await sql()`
    SELECT to_char(date_effet, 'YYYY-MM-DD') AS date_effet, decision, taux_avant, taux_apres,
           taux_13s_veille, ecart_13s_vs_directeur_pb
    FROM analytics.taux_autour_decisions_bam ORDER BY date_effet`);
}
export const tauxAutourDecisions = () => sur("taux autour des décisions", lireTauxAutourDecisions);

async function lireResumeAnticipations() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86400, expire: 604800 });
  return plat(await sql()`
    SELECT decision, count(*) AS nb, min(ecart_13s_vs_directeur_pb) AS ecart_min,
           max(ecart_13s_vs_directeur_pb) AS ecart_max
    FROM analytics.taux_autour_decisions_bam GROUP BY decision ORDER BY decision`);
}
export const resumeAnticipations = () => sur("résumé des anticipations", lireResumeAnticipations);

async function lireFluxFondsTaux() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86400, expire: 604800 });
  // `/ 1e9` : les flux sont en dirhams dans la base ; on les lit en milliards (Md MAD) directement en SQL.
  return plat(await sql()`
    SELECT categorie, annee, flux_net / 1e9 AS flux_net_md,
           to_char(premiere_date, 'YYYY-MM-DD') AS premiere_date, to_char(derniere_date, 'YYYY-MM-DD') AS derniere_date, annee_partielle
    FROM analytics.flux_fonds_taux_annuel ORDER BY annee, categorie`);
}
export const fluxFondsTaux = () => sur("flux des fonds de taux", lireFluxFondsTaux);

async function lireTimingFluxTaux() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86400, expire: 604800 });
  return plat(await sql()`
    SELECT categorie, nb_semaines, corr_flux_rend_passe, corr_flux_rend_futur,
           corr_flux_pct_rend_passe, corr_flux_pct_rend_futur
    FROM analytics.flux_fonds_taux_timing ORDER BY categorie`);
}
export const timingFluxTaux = () => sur("timing des flux obligataires", lireTimingFluxTaux);

async function lireCourbesTaux() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86400, expire: 604800 });
  // Trois courbes : la dernière, celle d'il y a 1 an, celle d'il y a 2 ans (dernier jour disponible avant la date).
  return plat(await sql()`
    WITH m AS (SELECT max(date_courbe) AS d FROM analytics.courbe_taux_quotidienne),
    ds AS (
      SELECT (SELECT d FROM m) AS d, 0 AS rang
      UNION ALL SELECT (SELECT max(date_courbe) FROM analytics.courbe_taux_quotidienne
                        WHERE date_courbe <= (SELECT d FROM m) - interval '1 year'), 1
      UNION ALL SELECT (SELECT max(date_courbe) FROM analytics.courbe_taux_quotidienne
                        WHERE date_courbe <= (SELECT d FROM m) - interval '2 years'), 2
    )
    SELECT ds.rang, to_char(ds.d, 'YYYY-MM-DD') AS date_courbe, c.maturite, c.cible_ans, c.taux_pct
    FROM ds JOIN analytics.courbe_taux_quotidienne c ON c.date_courbe = ds.d
    ORDER BY ds.rang, c.cible_ans`);
}
export const courbesTaux = () => sur("courbes des taux", lireCourbesTaux);

async function lireTauxDansLeTemps() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86400, expire: 604800 });
  return plat(await sql()`
    SELECT to_char(date_courbe, 'YYYY-MM-DD') AS date, maturite, taux_pct
    FROM analytics.courbe_taux_quotidienne
    WHERE maturite IN ('13 sem', '10 ans') ORDER BY date_courbe, cible_ans`);
}
export const tauxDansLeTemps = () => sur("taux dans le temps", lireTauxDansLeTemps);

/* ---------- Introductions en bourse ---------- */

async function lireIpo() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86400, expire: 604800 });
  return plat(await sql()`
    SELECT ticker, societe, to_char(date_premiere_cotation, 'YYYY-MM-DD') AS date_premiere_cotation,
           sursouscription, rdt_j1_pct, rdt_j5_pct, rdt_1m_pct, rdt_depuis_ipo_pct,
           masi_depuis_ipo_pct, anormal_depuis_ipo_pts, rdt_achat_j20_pct,
           to_char(date_dernier_cours, 'YYYY-MM-DD') AS date_dernier_cours
    FROM analytics.ipo_performance ORDER BY date_premiere_cotation`);
}
export const ipo = () => sur("IPO", lireIpo);

async function lireIpoResume() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86400, expire: 604800 });
  return plat(await sql()`
    SELECT count(*) AS nb,
           count(*) FILTER (WHERE anormal_depuis_ipo_pts > 0) AS nb_battent,
           min(anormal_depuis_ipo_pts) FILTER (WHERE anormal_depuis_ipo_pts > 0) AS ecart_min,
           max(anormal_depuis_ipo_pts) AS ecart_max,
           min(rdt_j1_pct) AS j1_min, max(rdt_j1_pct) AS j1_max, max(rdt_j5_pct) AS j5_max,
           count(*) FILTER (WHERE rdt_achat_j20_pct > 0) AS nb_gagnent_j20,
           min(rdt_achat_j20_pct) AS j20_min,
           (SELECT societe FROM analytics.ipo_performance ORDER BY rdt_achat_j20_pct LIMIT 1) AS j20_pire
    FROM analytics.ipo_performance`);
}
export const ipoResume = () => sur("résumé des IPO", lireIpoResume);

/* ---------- Synthèse quantitative ---------- */

async function lireSyntheseAnnuel() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86400, expire: 604800 });
  return plat(await sql()`
    SELECT actif, annee, nb_semaines, rendement_pct,
           to_char(premiere_date, 'YYYY-MM-DD') AS premiere_date, to_char(derniere_date, 'YYYY-MM-DD') AS derniere_date, annee_partielle
    FROM analytics.synthese_annuel ORDER BY annee, actif`);
}
export const syntheseAnnuel = () => sur("synthèse annuelle", lireSyntheseAnnuel);

async function lireCorrelations() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86400, expire: 604800 });
  return plat(await sql()`
    SELECT actif_1, actif_2, nb_semaines, correlation
    FROM analytics.synthese_correlations ORDER BY actif_1, actif_2`);
}
export const correlations = () => sur("corrélations", lireCorrelations);

async function lireSharpeExtremes() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86400, expire: 604800 });
  // Fourchette « hors fonds de taux courts » : le Monétaire sert de taux sans risque (Sharpe 0 par
  // construction) et l'OCT, au risque très faible, a un ratio à part (CORRECTIONS.md, correction AMMC) ;
  // son Sharpe est lu à part dans synthese_classes_actifs.
  return plat(await sql()`
    SELECT min(ratio_rendement_risque) AS minimum, max(ratio_rendement_risque) AS maximum
    FROM analytics.synthese_classes_actifs WHERE actif NOT IN ('Monétaire', 'OCT')`);
}
export const sharpeExtremes = () => sur("extrêmes du Sharpe", lireSharpeExtremes);

async function lireCompositions() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86400, expire: 604800 });
  return plat(await sql()`
    SELECT portefeuille, placement, poids_pct
    FROM analytics.compositions_portefeuilles ORDER BY portefeuille, placement`);
}
export const compositions = () => sur("compositions des portefeuilles", lireCompositions);

/* ---------- Méthode et sources ---------- */

async function lireFraicheur() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 86400, expire: 604800 });
  return plat(await sql()`
    SELECT 'Statistiques hebdomadaires des OPCVM (AMMC)' AS source, to_char(max(date), 'YYYY-MM-DD') AS jusqu_au FROM dw.fact_opcvm_hebdo
    UNION ALL SELECT 'MASI et MASI 20 (Bourse de Casablanca)', to_char(max(date), 'YYYY-MM-DD') FROM dw.fact_masi_quotidien
    UNION ALL SELECT 'Courbe des taux (Bank Al-Maghrib)', to_char(max(date_courbe), 'YYYY-MM-DD') FROM analytics.courbe_taux_quotidienne
    UNION ALL SELECT 'Décisions du taux directeur (Bank Al-Maghrib)', to_char(max(date_effet), 'YYYY-MM-DD') FROM analytics.decisions_bam
    UNION ALL SELECT 'Inflation (HCP)', to_char(max(date_ref), 'YYYY-MM-DD') FROM analytics.inflation_mensuelle WHERE inflation_annuelle_pct IS NOT NULL
    UNION ALL SELECT 'Cours des introductions en bourse', to_char(max(date_dernier_cours), 'YYYY-MM-DD') FROM analytics.ipo_performance
    UNION ALL SELECT 'PER et dividendes (presse)', to_char(max(date_article), 'YYYY-MM-DD') FROM dw.v_valorisation`);
}
export const fraicheur = () => sur("fraîcheur des données", lireFraicheur);
