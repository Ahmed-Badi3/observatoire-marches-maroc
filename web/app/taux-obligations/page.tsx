import type { Metadata } from "next";
import { Activity, ArrowLeftRight, ChartLine, Landmark, Percent, Telescope, Users } from "lucide-react";

import { BandeauKpi, type Kpi } from "@/components/observatoire/bandeau-kpi";
import { CarteConstat } from "@/components/observatoire/carte-constat";
import {
  CarteGraphique,
  ConclusionPage,
  Indisponible,
  MiseEnPageResultat,
  TitreTableau,
} from "@/components/observatoire/carte-graphique";
import { GraphiqueBarres } from "@/components/observatoire/graphique-barres";
import { GraphiqueLignes } from "@/components/observatoire/graphique-lignes";
import { Onglets } from "@/components/observatoire/onglets";
import { TableauTriable, type Colonne } from "@/components/observatoire/tableau-triable";
import {
  courbesTaux,
  fluxFondsTaux,
  fondsTauxAnnuel,
  kpiTiming,
  resumeAnticipations,
  sensibilite,
  tauxAutourDecisions,
  tauxDansLeTemps,
  timingFluxTaux,
  type Ligne,
} from "@/lib/donnees-pages";
import {
  formatDate,
  formatMilliards,
  formatDateCourte,
  formatMoisAnnee,
  formatNombre,
  formatPointsDeBase,
  formatPourcentage,
} from "@/lib/format";
import { interpreterCorrelation } from "@/lib/interpretation";
import { etiqueterAnnees, numeriser, pivoter, type Jeu } from "@/lib/graphiques";

export const metadata: Metadata = { title: "Taux et obligations" };

// Libellés de catégories présents en base (docs/DATA.md).
const MLT = "Obligations MLT";
const CT = "Obligations CT";
const TOUTE_LA_PERIODE = "Toute la période";
// Date du changement de méthode de la courbe BAM (docs/DATA.md) : avant, taux de la dernière transaction
// de chaque bon ; depuis, courbe de référence calculée chaque jour. Repère méthodologique, pas un résultat.
const METHODE_BAM = "2023-03-21";

// « Toute la période » → « toute la période » au milieu d'une phrase ; « BAM » garde ses majuscules.
const minusculeInitiale = (t: unknown) => {
  const texte = String(t ?? "—");
  return texte.charAt(0).toLowerCase() + texte.slice(1);
};

/* ---------- Résultat 8 : fonds par année ---------- */
function ongletAnnees(fonds: Ligne[] | null) {
  if (!fonds || fonds.length === 0) return <Indisponible />;
  // « 2026 » devient « 2026 (janv.–oct.) » quand la base déclare l'année partielle.
  const fondsEtiquetes = etiqueterAnnees(fonds);
  const { donnees, series } = pivoter(fondsEtiquetes, "annee", "categorie", "rendement_pct");
  const jeu: Jeu = {
    id: "annees",
    libelle: "Rendement",
    donnees,
    series: series.map((s) => ({ cle: s, libelle: s })),
  };

  // Tableau : une ligne par année, avec la variation du taux à 10 ans (la même pour toutes les catégories).
  const lignes = donnees.map((r) => ({
    ...r,
    var_taux_10a_pb: fondsEtiquetes.find((f) => f.annee === String(r.annee))?.var_taux_10a_pb ?? null,
  }));
  const colonnes: Colonne[] = [
    { cle: "annee", libelle: "Année" },
    { cle: "var_taux_10a_pb", libelle: "Variation du taux à 10 ans sur l'année", type: "pb" },
    ...series.map((s): Colonne => ({ cle: s, libelle: s, type: "pourcentage", colore: true })),
  ];

  const mltAnnees = fonds.filter((f) => f.categorie === MLT);
  const derniere = mltAnnees.at(-1);
  // Deux années de hausse des taux (la première et la dernière) : même hausse, résultats différents.
  const hausses = mltAnnees.filter((f) => Number(f.var_taux_10a_pb) > 0);
  const [h1, h2] = [hausses[0], hausses.at(-1)];
  const comparaison =
    h1 && h2 && h1 !== h2
      ? `En ${h1.annee} et en ${h2.annee}, le taux à 10 ans a monté presque autant (${formatPointsDeBase(h1.var_taux_10a_pb)} et ${formatPointsDeBase(h2.var_taux_10a_pb)}), mais les fonds MLT ont fait ${formatPourcentage(h1.rendement_pct)} contre ${formatPourcentage(h2.rendement_pct)} : au 1er janvier ${h1.annee}, le taux de départ était de ${formatPourcentage(h1.taux_10a_debut, { signe: false, decimales: 2 })}, contre ${formatPourcentage(h2.taux_10a_debut, { signe: false, decimales: 2 })} au 1er janvier ${h2.annee}. Des intérêts encaissés plus élevés ont amorti la baisse du prix des obligations.`
      : undefined;
  return (
    <MiseEnPageResultat
      carte={
        <CarteConstat
          teinte="fonce"
          icone={Percent}
          theme="Taux"
          constat="Les fonds obligataires longs suivent les taux, année après année."
          tuiles={[
            {
              etiquette: `Rendement des fonds MLT en ${derniere?.annee ?? "—"} (année en cours)`,
              valeur: formatPourcentage(derniere?.rendement_pct),
            },
            {
              etiquette: "Variation du taux à 10 ans sur la même période",
              valeur: formatPointsDeBase(derniere?.var_taux_10a_pb),
            },
          ]}
          conclusion="Les années où les taux baissent sont les meilleures pour ces fonds, celles où ils montent les pires."
          details={comparaison}
        />
      }
      graphiques={
        <CarteGraphique
          titre="Quand les taux baissent, les fonds longs gagnent le plus ; quand ils montent, ils perdent"
          note="Rendement des fonds par année civile. Entre parenthèses, les mois couverts quand l'année est incomplète ; en 2022, le taux à 10 ans vient de l'ancienne méthode de Bank Al-Maghrib (avant mars 2023). Sources : AMMC, Bank Al-Maghrib."
        >
          <GraphiqueBarres
            jeux={[jeu]}
            cleX="annee"
            format="pourcentage"
            decimalesInfo={1}
            description="Rendement annuel des fonds monétaires, obligataires court terme et moyen-long terme"
          />
        </CarteGraphique>
      }
      tableau={
        <div>
          <TitreTableau>Rendement des fonds et variation du taux à 10 ans, année par année</TitreTableau>
          <TableauTriable colonnes={colonnes} lignes={lignes} legende="Rendement annuel des fonds de taux" />
          <p className="mt-2 text-xs text-texte-secondaire">
            Une hausse des taux fait baisser le prix des obligations : un « + » dans la colonne des taux est
            mauvais pour les fonds MLT. 1 pb (point de base) = 0,01 point de pourcentage.
          </p>
        </div>
      }
    />
  );
}

/* ---------- Résultat 9 : sensibilité ---------- */
function ongletSensibilite(sens: Ligne[] | null) {
  if (!sens || sens.length === 0) return <Indisponible />;
  const periodes = [...new Set(sens.map((s) => String(s.periode)))];
  const jeux: Jeu[] = periodes.map((p) => ({
    id: p,
    libelle: p,
    series: [{ cle: "sensibilite", libelle: "Perte approximative pour +1 point de taux (%)" }],
    donnees: numeriser(
      sens.filter((s) => s.periode === p).map((s) => ({ categorie: s.categorie, sensibilite: s.sensibilite_implicite })),
      ["sensibilite"],
    ),
  }));
  // Les périodes sont cherchées par leur intitulé en base (DATA.md : « Toute la période » = 4,1, R² 0,57).
  // Avant, on prenait la 1re période dans l'ordre alphabétique, qui est « Depuis le 24/03/2023 » :
  // la carte inversait donc 4,6 et 4,1 (CORRECTIONS.md, Résultat 9).
  const toute = sens.find((s) => s.periode === TOUTE_LA_PERIODE && s.categorie === MLT);
  const recente = sens.find((s) => s.periode !== TOUTE_LA_PERIODE && s.categorie === MLT);
  const ct = sens.find((s) => s.periode === TOUTE_LA_PERIODE && s.categorie === CT);

  const colonnes: Colonne[] = [
    { cle: "periode", libelle: "Période" },
    { cle: "categorie", libelle: "Catégorie" },
    { cle: "nb_semaines", libelle: "Semaines", type: "nombre", decimales: 0 },
    { cle: "sensibilite_implicite", libelle: "Sensibilité", type: "nombre" },
    { cle: "correlation", libelle: "Rendement hebdo du fonds ↔ variation du taux à 10 ans", type: "correlation" },
    { cle: "r2", libelle: "R²", type: "nombre" },
  ];
  return (
    <MiseEnPageResultat
      carte={
        <CarteConstat
          teinte="corail"
          icone={Activity}
          theme="Sensibilité aux taux"
          constat="Les fonds obligataires longs sont très sensibles aux taux."
          tuiles={[
            {
              etiquette: `Fonds MLT, ${minusculeInitiale(toute?.periode)} (${formatNombre(toute?.nb_semaines, { decimales: 0 })} semaines)`,
              valeur: formatNombre(toute?.sensibilite_implicite, { decimales: 1 }),
              interpretation: `R² = ${formatNombre(toute?.r2)}`,
            },
            {
              etiquette: `Fonds MLT, ${minusculeInitiale(recente?.periode)} (${formatNombre(recente?.nb_semaines, { decimales: 0 })} semaines)`,
              valeur: formatNombre(recente?.sensibilite_implicite, { decimales: 1 }),
              interpretation: `R² = ${formatNombre(recente?.r2)}`,
            },
          ]}
          conclusion={`Quand le taux à 10 ans monte d'un point, un fonds MLT perd environ ${formatPourcentage(toute?.sensibilite_implicite, { decimales: 1, signe: false })} : sensibilité ${formatNombre(toute?.sensibilite_implicite, { decimales: 1 })} = −${formatPourcentage(toute?.sensibilite_implicite, { decimales: 1, signe: false })} pour +1 point de taux. Les taux expliquent environ ${formatPourcentage(toute?.r2_pct, { decimales: 0, signe: false })} des variations hebdomadaires de ces fonds.`}
          details={`Taux à 10 ans = taux de marché des bons du Trésor, différent du taux directeur de Bank Al-Maghrib. Sensibilité = perte approximative du fonds, en %, pour +1 point de taux à 10 ans. R² = part des variations hebdomadaires du fonds expliquée par les taux. Fonds CT, sur toute la période : ${formatNombre(ct?.sensibilite_implicite, { decimales: 1 })}.`}
        />
      }
      graphiques={
        <CarteGraphique
          titre="Plus un fonds détient des obligations longues, plus il réagit aux taux"
          note="Sensibilité implicite = pente de la régression du rendement hebdomadaire sur la variation du taux à 10 ans. R² = part de la variation expliquée par les taux. Les deux périodes donnent des valeurs proches pour les fonds MLT."
        >
          <GraphiqueBarres
            jeux={jeux}
            format="nombre"
            decimalesInfo={1}
            labelChoix="Période"
            description="Sensibilité implicite aux taux des fonds monétaires, CT et MLT"
          />
        </CarteGraphique>
      }
      tableau={
        <div>
          <TitreTableau>Sensibilité de chaque catégorie de fonds</TitreTableau>
          <TableauTriable colonnes={colonnes} lignes={sens} legende="Sensibilité des fonds aux variations du taux à 10 ans" />
        </div>
      }
    />
  );
}

/* ---------- Résultat 10 : anticipations ---------- */
function ongletAnticipations(decisions: Ligne[] | null, resume: Ligne[] | null) {
  if (!decisions || decisions.length === 0) return <Indisponible />;
  const { donnees, series } = pivoter(
    decisions.map((d) => ({
      date: formatDateCourte(d.date_effet),
      decision: d.decision,
      ecart: d.ecart_13s_vs_directeur_pb,
    })),
    "date",
    "decision",
    "ecart",
  );
  const couleurs: Record<string, string> = { Hausse: "var(--serie-2)", Baisse: "var(--serie-1)", Maintien: "var(--serie-8)" };
  const jeu: Jeu = {
    id: "anticip",
    libelle: "Écart",
    donnees,
    series: series.map((s) => ({ cle: s, libelle: s, couleur: couleurs[s] })),
  };
  const hausse = resume?.find((r) => r.decision === "Hausse");
  const baisse = resume?.find((r) => r.decision === "Baisse");
  const nbTotal = (resume ?? []).reduce((n, r) => n + Number(r.nb), 0); // nombre de lignes, pas un calcul financier
  const datesHausses = decisions.filter((d) => d.decision === "Hausse").map((d) => formatDateCourte(d.date_effet));
  const exempleHausse = decisions.find((d) => d.decision === "Hausse");
  // Maintiens où le marché attendait une baisse : taux à 13 semaines au moins 10 pb sous le taux directeur.
  const maintiensAttendus = decisions.filter(
    (d) => d.decision === "Maintien" && Number(d.ecart_13s_vs_directeur_pb) <= -10,
  );

  const colonnes: Colonne[] = [
    { cle: "date_effet", libelle: "Entrée en vigueur", type: "date" },
    { cle: "decision", libelle: "Décision" },
    { cle: "taux_avant", libelle: "Avant", type: "pourcentage", signe: false, decimales: 2 },
    { cle: "taux_apres", libelle: "Après", type: "pourcentage", signe: false, decimales: 2 },
    { cle: "taux_13s_veille", libelle: "Taux 13 sem. la veille", type: "pourcentage", signe: false, decimales: 2 },
    { cle: "ecart_13s_vs_directeur_pb", libelle: "Écart avec le directeur", type: "pb" },
  ];
  return (
    <MiseEnPageResultat
      carte={
        <CarteConstat
          teinte="ambre"
          icone={Telescope}
          theme="Anticipations"
          constat="Le marché anticipait les hausses de Bank Al-Maghrib, pas les baisses."
          tuiles={[
            {
              etiquette: "Écart du taux à 13 semaines avec le directeur, la veille des hausses",
              valeur: `${formatPointsDeBase(hausse?.ecart_min)} à ${formatPointsDeBase(hausse?.ecart_max)}`,
            },
            {
              etiquette: "Même écart, la veille des baisses",
              valeur: `${formatPointsDeBase(baisse?.ecart_min)} à ${formatPointsDeBase(baisse?.ecart_max)}`,
            },
          ]}
          conclusion={`Avant une hausse, le taux à 13 semaines était déjà au-dessus du taux directeur. ${nbTotal} décisions, dont ${hausse?.nb ?? "—"} hausses et ${baisse?.nb ?? "—"} baisses : résultat indicatif, pas une preuve statistique.`}
          details={`Si le marché attend une hausse, personne ne prête à 3 mois au taux actuel : le taux à 13 semaines monte avant la décision.${
            exempleHausse
              ? ` Exemple : la veille de la hausse du ${formatDate(exempleHausse.date_effet)}, le taux à 13 semaines était de ${formatPourcentage(exempleHausse.taux_13s_veille, { signe: false, decimales: 2 })}, pour un nouveau taux directeur de ${formatPourcentage(exempleHausse.taux_apres, { signe: false, decimales: 2 })}.`
              : ""
          }${
            maintiensAttendus.length > 0
              ? ` Lors de certains maintiens, le marché attendait une baisse qui n'est pas venue : ${maintiensAttendus.map((d) => `${formatMoisAnnee(d.date_effet)} (${formatPointsDeBase(d.ecart_13s_vs_directeur_pb)})`).join(", ")}.`
              : ""
          } Limites : les hausses (${datesHausses.join(", ")}) tombent avant ou au moment du changement de méthode de Bank Al-Maghrib (${formatDate(METHODE_BAM)}) ; avant, le taux à 13 semaines est celui de la dernière transaction et peut dater de plusieurs semaines. La « veille » est la dernière courbe disponible avant la décision : certaines années, les courbes n'ont été collectées que le vendredi, elle peut donc dater de quelques jours.`}
        />
      }
      graphiques={
        <CarteGraphique
          titre="Avant une hausse, les taux courts avaient déjà monté ; avant une baisse, presque pas bougé"
          note="Écart, la veille de chaque décision, entre le taux à 13 semaines du marché et le taux directeur (pb = points de base, 100 pb = 1 point). Source : Bank Al-Maghrib."
        >
          <GraphiqueBarres
            jeux={[jeu]}
            cleX="date"
            format="pb"
            empile
            decimalesInfo={0}
            hauteur={320}
            description="Écart entre le taux à 13 semaines et le taux directeur la veille de chaque décision"
          />
        </CarteGraphique>
      }
      tableau={
        <div>
          <TitreTableau>Taux autour de chaque décision</TitreTableau>
          <TableauTriable
            colonnes={colonnes}
            lignes={decisions}
            legende="Taux directeur et taux à 13 semaines autour des décisions de Bank Al-Maghrib"
            triInitial={{ cle: "date_effet", sens: "desc" }}
            hauteurMax="26rem"
          />
        </div>
      }
    />
  );
}

/* ---------- Résultat 11 : flux ---------- */
function ongletFlux(flux: Ligne[] | null, timing: Ligne[] | null, kpi: Ligne[] | null, fonds: Ligne[] | null) {
  if (!flux || flux.length === 0) return <Indisponible />;
  const { donnees, series } = pivoter(etiqueterAnnees(flux), "annee", "categorie", "flux_net_md");
  const jeu: Jeu = {
    id: "flux",
    libelle: "Flux",
    donnees,
    series: series.map((s) => ({ cle: s, libelle: s })),
  };
  const mlt = timing?.find((t) => t.categorie === MLT);
  const colonnes: Colonne[] = [
    { cle: "categorie", libelle: "Catégorie" },
    { cle: "nb_semaines", libelle: "Semaines", type: "nombre", decimales: 0 },
    { cle: "corr_flux_pct_rend_passe", libelle: "Flux net hebdo (en % de l'actif net) ↔ rendement du fonds, 4 semaines précédentes", type: "correlation" },
    { cle: "corr_flux_pct_rend_futur", libelle: "Flux net hebdo (en % de l'actif net) ↔ rendement du fonds, 4 semaines suivantes", type: "correlation" },
  ];
  // Flux par catégorie et par année (lus en base), pour les phrases sous le graphique.
  const fluxDe = (categorie: string, annee: unknown) =>
    flux.find((f) => f.categorie === categorie && String(f.annee) === String(annee))?.flux_net_md;
  const anneesMlt = (fonds ?? []).filter((f) => f.categorie === MLT);
  const derniereAnnee = anneesMlt.at(-1)?.annee;
  // Une année de hausse des taux où les fonds MLT ont pourtant reçu de l'argent, et le rendement de l'année suivante.
  const achatAvantRallye = anneesMlt.find(
    (f, i) => Number(f.var_taux_10a_pb) > 0 && Number(fluxDe(MLT, f.annee)) > 0 && anneesMlt[i + 1],
  );
  const anneeSuivante = achatAvantRallye ? anneesMlt[anneesMlt.indexOf(achatAvantRallye) + 1] : undefined;
  return (
    <MiseEnPageResultat
      carte={
        <CarteConstat
          teinte="sarcelle"
          icone={Users}
          theme="Comportement des épargnants"
          constat="Les épargnants obligataires ne suivent presque pas la tendance, contrairement à ceux des fonds Actions."
          tuiles={[
            {
              etiquette: "Achats nets des fonds MLT (en % de l'actif net) ↔ leur rendement des 4 semaines précédentes",
              valeur: formatNombre(mlt?.corr_flux_pct_rend_passe, { signe: true }),
              interpretation: interpreterCorrelation(mlt?.corr_flux_pct_rend_passe),
            },
            {
              etiquette: "Achats nets des fonds Actions ↔ MASI des 4 semaines précédentes",
              valeur: formatNombre(kpi?.[0]?.corr_passe, { signe: true }),
              interpretation: interpreterCorrelation(kpi?.[0]?.corr_passe),
            },
          ]}
          conclusion="Les épargnants des fonds de taux courent beaucoup moins après la performance."
          details={`Les deux corrélations sont mesurées de la même façon (flux de la semaine en % de l'actif net du fonds) : elles se comparent. Mesurée sur les flux en dirhams, celle des fonds MLT vaut ${formatNombre(mlt?.corr_flux_rend_passe, { signe: true })}.`}
        />
      }
      graphiques={
        <CarteGraphique
          titre="Flux nets des fonds de taux, année par année"
          note={`Flux net = souscriptions − rachats, en milliards de dirhams, par année civile. Entre parenthèses, les mois couverts quand l'année est incomplète. ${
            derniereAnnee
              ? `En ${derniereAnnee}, les fonds longs (MLT) enregistrent ${formatMilliards(fluxDe(MLT, derniereAnnee))} pendant que les fonds courts reçoivent ${formatMilliards(fluxDe("Monétaire", derniereAnnee))} (monétaires) et ${formatMilliards(fluxDe(CT, derniereAnnee))} (CT). `
              : ""
          }${
            achatAvantRallye && anneeSuivante
              ? `Mais en ${achatAvantRallye.annee}, les taux avaient aussi monté (${formatPointsDeBase(achatAvantRallye.var_taux_10a_pb)}) et les fonds MLT ont reçu ${formatMilliards(fluxDe(MLT, achatAvantRallye.annee))} : acheter à taux élevés était un bon moment, avant ${formatPourcentage(anneeSuivante.rendement_pct)} en ${anneeSuivante.annee}. `
              : ""
          }Source : AMMC.`}
        >
          <GraphiqueBarres
            jeux={[jeu]}
            cleX="annee"
            format="milliards"
            decimalesInfo={1}
            description="Flux nets annuels vers les fonds monétaires, obligataires CT et MLT, en milliards de dirhams"
          />
        </CarteGraphique>
      }
      tableau={
        timing && (
          <div>
            <TitreTableau>Les flux suivent-ils la performance ?</TitreTableau>
            <TableauTriable colonnes={colonnes} lignes={timing} legende="Corrélation entre le flux net hebdomadaire de chaque fonds de taux et son rendement des 4 semaines précédentes ou suivantes" />
          </div>
        )
      }
    />
  );
}

/* ---------- Courbe des taux ---------- */
function ongletCourbe(courbes: Ligne[] | null, serie: Ligne[] | null) {
  if (!courbes || courbes.length === 0) return <Indisponible />;
  const rangs = [...new Set(courbes.map((c) => Number(c.rang)))];
  const { donnees } = pivoter(
    courbes.map((c) => ({ maturite: c.maturite, serie: `r${c.rang}`, taux: c.taux_pct })),
    "maturite",
    "serie",
    "taux",
  );
  const couleursRang = ["var(--serie-1)", "var(--serie-2)", "var(--serie-6)"];
  const dateDuRang = (r: number) => String(courbes.find((c) => Number(c.rang) === r)?.date_courbe);
  const jeuCourbe: Jeu = {
    id: "courbe",
    libelle: "Courbe",
    donnees,
    series: rangs.map((r) => ({
      cle: `r${r}`,
      libelle: `Courbe du ${formatDate(dateDuRang(r))}`,
      couleur: couleursRang[r] ?? "var(--serie-8)",
    })),
  };
  const derniere = courbes.filter((c) => Number(c.rang) === 0);
  const dix = derniere.find((c) => c.maturite === "10 ans");
  const treize = derniere.find((c) => c.maturite === "13 sem");
  // Taux d'une maturité sur une courbe (rang 0 = la plus récente, 1 = il y a un an, 2 = il y a deux ans).
  const taux = (r: number, m: string) => courbes.find((c) => Number(c.rang) === r && c.maturite === m)?.taux_pct;
  const pentification =
    rangs.includes(1)
      ? `Entre le ${formatDate(dateDuRang(1))} et le ${formatDate(dateDuRang(0))}, le taux à 13 semaines est passé de ${formatPourcentage(taux(1, "13 sem"), { signe: false, decimales: 2 })} à ${formatPourcentage(taux(0, "13 sem"), { signe: false, decimales: 2 })}, le taux à 10 ans de ${formatPourcentage(taux(1, "10 ans"), { signe: false, decimales: 2 })} à ${formatPourcentage(taux(0, "10 ans"), { signe: false, decimales: 2 })}.`
      : "";
  const touteEnBaisse =
    rangs.includes(2) &&
    ["13 sem", "1 an", "2 ans", "5 ans", "10 ans"].every((m) => Number(taux(1, m)) < Number(taux(2, m)));

  let jeuTemps: Jeu | null = null;
  if (serie && serie.length > 0) {
    const p = pivoter(serie, "date", "maturite", "taux_pct");
    const noms: Record<string, string> = { "13 sem": "Taux à 13 semaines", "10 ans": "Taux à 10 ans" };
    jeuTemps = {
      id: "temps",
      libelle: "Taux",
      donnees: p.donnees,
      series: p.series.map((s, i) => ({
        cle: s,
        libelle: noms[s] ?? s,
        // Couleurs différentes de celles du graphique des courbes (où le sarcelle = la courbe la plus récente).
        couleur: s === "13 sem" ? "var(--serie-5)" : "var(--serie-3)",
      })),
    };
  }

  return (
    <MiseEnPageResultat
      carte={
        <CarteConstat
          teinte="fonce"
          icone={ChartLine}
          theme="Courbe des taux"
          constat="Les taux de référence des bons du Trésor, selon la durée."
          tuiles={[
            { etiquette: "Taux à 10 ans", valeur: formatPourcentage(dix?.taux_pct, { signe: false, decimales: 2 }) },
            { etiquette: "Taux à 13 semaines", valeur: formatPourcentage(treize?.taux_pct, { signe: false, decimales: 2 }) },
          ]}
          precision={`Courbe du ${formatDate(dateDuRang(0))}`}
          conclusion="Une courbe qui monte avec la durée est la situation normale : on est payé pour immobiliser son argent plus longtemps."
        />
      }
      graphiques={
        <>
          <CarteGraphique
            titre="La forme de la courbe des taux évolue d'une année à l'autre"
            note={`Taux de référence du marché secondaire des bons du Trésor, par durée restante. ${pentification} Quand le taux long monte plus que le taux court, la courbe se « pentifie » : c'est ce qui fait perdre les fonds obligataires longs pendant que le monétaire gagne encore.${
              touteEnBaisse
                ? ` Entre le ${formatDate(dateDuRang(2))} et le ${formatDate(dateDuRang(1))}, toute la courbe avait baissé (baisses du taux directeur) : une bonne année pour les obligations.`
                : ""
            } Source : Bank Al-Maghrib.`}
          >
            <GraphiqueLignes
              jeux={[jeuCourbe]}
              typeX="texte"
              cleX="maturite"
              format="pourcentage"
              decimalesAxe={1}
              decimalesInfo={2}
              filtrePeriode={false}
              description="Courbe des taux à la date la plus récente, un an et deux ans plus tôt"
              points
            />
          </CarteGraphique>
          {jeuTemps && (
            <CarteGraphique
              titre="L'écart entre taux courts et taux longs varie dans le temps"
              note="Taux à 13 semaines et à 10 ans, à leur vraie date (quotidiens certaines années, hebdomadaires d'autres). En gris, la période de l'ancienne méthode de Bank Al-Maghrib : taux de la dernière transaction de chaque bon, d'où les paliers plats et les sauts. Quelques cotations aberrantes d'un seul jour sont écartées (voir « Méthode et sources »). Source : Bank Al-Maghrib."
            >
              <GraphiqueLignes
                jeux={[jeuTemps]}
                zoneGrisee={{ jusquAu: METHODE_BAM, libelle: "ancienne méthode BAM" }}
                format="pourcentage"
                decimalesAxe={1}
                decimalesInfo={2}
                description="Taux à 13 semaines et à 10 ans dans le temps"
              />
            </CarteGraphique>
          )}
        </>
      }
    />
  );
}

export default async function PageTauxObligations() {
  const fonds = await fondsTauxAnnuel();
  const sens = await sensibilite();
  const decisions = await tauxAutourDecisions();
  const resume = await resumeAnticipations();
  const flux = await fluxFondsTaux();
  const timing = await timingFluxTaux();
  const kpi = await kpiTiming();
  const courbes = await courbesTaux();
  const serie = await tauxDansLeTemps();

  // Bandeau de KPI : les derniers chiffres de la page, et en pastille le chiffre de comparaison lu en base.
  const dixAns = (rang: number) => courbes?.find((c) => Number(c.rang) === rang && c.maturite === "10 ans");
  const [dixActuel, dixIlYaUnAn] = [dixAns(0), dixAns(1)];
  const [mltPrec, mltDernier] = (fonds ? etiqueterAnnees(fonds.filter((f) => f.categorie === MLT)) : []).slice(-2);
  const [fluxPrec, fluxDernier] = (flux ? etiqueterAnnees(flux.filter((f) => f.categorie === MLT)) : []).slice(-2);
  const sensMlt = sens?.find((s) => s.periode === TOUTE_LA_PERIODE && s.categorie === MLT);
  const kpis: Kpi[] = [
    {
      icone: Landmark,
      valeur: formatPourcentage(dixActuel?.taux_pct, { signe: false, decimales: 2 }),
      libelle: `Taux à 10 ans des bons du Trésor, ${formatDateCourte(dixActuel?.date_courbe)}`,
      pastille: dixIlYaUnAn
        ? `${formatDateCourte(dixIlYaUnAn.date_courbe)} : ${formatPourcentage(dixIlYaUnAn.taux_pct, { signe: false, decimales: 2 })}`
        : null,
    },
    {
      icone: Percent,
      valeur: formatPourcentage(mltDernier?.rendement_pct),
      libelle: `Rendement des fonds obligataires MLT, ${mltDernier?.annee ?? "—"}`,
      pastille: mltPrec ? `${mltPrec.annee_brute} : ${formatPourcentage(mltPrec.rendement_pct)}` : null,
      valeurPastille: mltPrec?.rendement_pct,
    },
    {
      icone: ArrowLeftRight,
      valeur: formatMilliards(fluxDernier?.flux_net_md),
      libelle: `Flux net vers les fonds MLT, ${fluxDernier?.annee ?? "—"}`,
      pastille: fluxPrec ? `${fluxPrec.annee_brute} : ${formatMilliards(fluxPrec.flux_net_md)}` : null,
      valeurPastille: fluxPrec?.flux_net_md,
    },
    {
      icone: Activity,
      valeur: formatNombre(sensMlt?.sensibilite_implicite, { decimales: 1 }),
      libelle: "Sensibilité des fonds MLT : perte en % pour +1 point de taux",
      pastille: sensMlt ? `R² = ${formatNombre(sensMlt.r2)}` : null,
    },
  ];

  return (
    <>
      <BandeauKpi titre="Chiffres clés de la page" kpis={kpis} />
      <ConclusionPage>
        Les fonds obligataires longs gagnent quand les taux baissent et perdent quand ils montent, et le marché
        des taux devance souvent les décisions de Bank Al-Maghrib.
      </ConclusionPage>
      <Onglets
        onglets={[
          { id: "annees", libelle: "Fonds par année", contenu: ongletAnnees(fonds) },
          { id: "sensibilite", libelle: "Sensibilité aux taux", contenu: ongletSensibilite(sens) },
          { id: "anticipations", libelle: "Anticipations", contenu: ongletAnticipations(decisions, resume) },
          { id: "flux", libelle: "Flux des épargnants", contenu: ongletFlux(flux, timing, kpi, fonds) },
          { id: "courbe", libelle: "Courbe des taux", contenu: ongletCourbe(courbes, serie) },
        ]}
      />
    </>
  );
}
