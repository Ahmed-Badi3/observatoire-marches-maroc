import type { Metadata } from "next";
import { Factory, Landmark, ShoppingBasket, Thermometer } from "lucide-react";

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
  decisionsBam,
  haussesBam,
  resumeAnticipations,
  inflation,
  inflationPic,
  macroPic,
  macroTrimestriel,
  moyennesBam,
  rendementReel,
  type Ligne,
} from "@/lib/donnees-pages";
import {
  LIBELLE_FREQUENCE,
  formatDate,
  formatDateCourte,
  formatMoisAnnee,
  formatPeriode,
  formatPoints,
  formatPointsDeBase,
  formatPourcentage,
  formatTrimestre,
} from "@/lib/format";
import { numeriser, type Jeu } from "@/lib/graphiques";

export const metadata: Metadata = { title: "Contexte économique" };

const MAJUSCULE = (t: unknown) => String(t).charAt(0).toUpperCase() + String(t).slice(1);

/* ---------- Résultat 5 : MASI vs PIB ---------- */
function ongletPib(lignesMacro: Ligne[] | null, lignesPic: Ligne[] | null) {
  if (!lignesMacro || lignesMacro.length === 0) return <Indisponible />;
  // « 2026 T4 », ou « 2026 T4 (en cours) » si la base signale le trimestre comme non terminé.
  const avecPeriode = (l: Ligne): Ligne => ({ ...l, periode: formatTrimestre(l.annee, l.trimestre, l.trimestre_en_cours) });
  const macro = lignesMacro.map(avecPeriode);
  const p = lignesPic?.[0] ? avecPeriode(lignesPic[0]) : undefined;
  const avecPib = macro.filter((m) => m.croissance_pib_pct !== null);
  const pibRecent = avecPib.at(-1);
  const nbTrimestres = avecPib.length;
  const jeu: Jeu = {
    id: "pib",
    libelle: "MASI et PIB",
    series: [
      { cle: "perf_masi_annuelle_pct", libelle: "MASI sur un an", couleur: "var(--serie-2)" },
      { cle: "croissance_pib_pct", libelle: "Croissance du PIB sur un an", couleur: "var(--serie-1)" },
    ],
    donnees: numeriser(macro, ["perf_masi_annuelle_pct", "croissance_pib_pct"]),
  };
  const colonnes: Colonne[] = [
    { cle: "periode", libelle: "Trimestre" },
    { cle: "perf_masi_annuelle_pct", libelle: "MASI sur un an", type: "pourcentage", colore: true },
    { cle: "croissance_pib_pct", libelle: "Croissance du PIB", type: "pourcentage", colore: true },
  ];
  return (
    <MiseEnPageResultat
      carte={
        <CarteConstat
          teinte="fonce"
          icone={Factory}
          theme="Économie"
          constat="La bourse bouge beaucoup plus que l'économie."
          tuiles={[
            { etiquette: `MASI sur un an, au ${p?.periode ?? "—"}`, valeur: formatPourcentage(p?.perf_masi_annuelle_pct) },
            {
              etiquette: `Croissance du PIB sur un an, au ${p?.periode ?? "—"}`,
              valeur: formatPourcentage(p?.croissance_pib_pct, { signe: false }),
            },
          ]}
          precision={`${LIBELLE_FREQUENCE.trimestriel}, variation sur un an · MASI hors dividendes`}
          conclusion="C'est le trimestre où l'écart entre la Bourse et l'économie a été le plus grand."
          details={`${
            pibRecent
              ? `Le recul du MASI en ${pibRecent.annee} ne s'explique pas par l'économie, qui croît encore de ${formatPourcentage(pibRecent.croissance_pib_pct, { signe: false })} sur un an (${pibRecent.periode}) : il suit deux années de forte hausse et la remontée des taux longs. `
              : ""
          }Avec seulement ${nbTrimestres} trimestres où les deux chiffres existent, l'idée que la Bourse anticipe l'économie reste à tester sur une période plus longue.`}
        />
      }
      graphiques={
        <CarteGraphique
          titre="Le MASI varie bien plus fort que la croissance de l'économie"
          note="Variation sur un an, trimestre par trimestre (MASI : dernière séance du trimestre, hors dividendes). Le PIB est publié avec retard : les derniers trimestres n'ont pas encore de barre. Sources : Bourse de Casablanca, HCP."
        >
          <GraphiqueBarres
            jeux={[jeu]}
            cleX="periode"
            format="pourcentage"
            decimalesInfo={1}
            description="Performance annuelle du MASI et croissance annuelle du PIB, par trimestre"
          />
        </CarteGraphique>
      }
      tableau={
        <div>
          <TitreTableau>MASI et croissance du PIB, trimestre par trimestre</TitreTableau>
          <TableauTriable
            colonnes={colonnes}
            lignes={macro}
            legende="Performance annuelle du MASI et croissance du PIB"
            hauteurMax="24rem"
          />
        </div>
      }
    />
  );
}

/* ---------- Résultat 6 : nominal / réel ---------- */
function ongletReel(reel: Ligne[] | null, infl: Ligne[] | null, pic: Ligne[] | null) {
  if (!reel || reel.length === 0) return <Indisponible />;
  const donnees = numeriser(reel, ["masi_nominal_base100", "masi_reel_base100"]);
  const nominal = { cle: "masi_nominal_base100", libelle: "MASI nominal", couleur: "var(--serie-2)" };
  const reelSerie = { cle: "masi_reel_base100", libelle: "MASI réel (après inflation)", couleur: "var(--serie-1)" };
  const jeux: Jeu[] = [
    { id: "les-deux", libelle: "Les deux", donnees, series: [nominal, reelSerie] },
    { id: "nominal", libelle: "Nominal", donnees, series: [nominal] },
    { id: "reel", libelle: "Réel", donnees, series: [reelSerie] },
  ];
  const premier = reel[0];
  const dernier = reel[reel.length - 1];
  const p = pic?.[0];
  // Mois où l'inflation sur un an est négative (déflation), lus dans la série HCP.
  const moisDeflation = (infl ?? [])
    .filter((l) => Number(l.inflation_annuelle_pct) < 0)
    .map((l) => formatMoisAnnee(l.date));

  return (
    <MiseEnPageResultat
      carte={
        <CarteConstat
          teinte="corail"
          icone={ShoppingBasket}
          theme="Inflation et pouvoir d'achat"
          constat="L'inflation a peu pesé sur le rendement des actions."
          tuiles={[
            { etiquette: "MASI en dirhams courants (nominal)", valeur: formatPourcentage(dernier.nominal_pct) },
            { etiquette: "MASI en pouvoir d'achat (réel, après inflation)", valeur: formatPourcentage(dernier.reel_pct) },
          ]}
          precision={formatPeriode(premier.date, dernier.date, "mensuel")}
          conclusion="En pouvoir d'achat, le MASI gagne presque autant : sur la période étudiée, qui commence après le pic d'inflation, celle-ci a peu pesé."
          details={`Le calcul s'arrête au dernier mois d'inflation publié par le HCP : ces chiffres ne se comparent donc pas directement au rendement de l'accueil, relevé chaque vendredi.${
            p
              ? ` L'inflation a atteint ${formatPourcentage(p.inflation_annuelle_pct)} en ${formatMoisAnnee(p.date)}, puis elle est retombée : le vrai risque de la période a été la volatilité.`
              : ""
          }`}
        />
      }
      graphiques={
        <>
          <CarteGraphique
            titre="Corrigé de l'inflation, le MASI gagne presque autant"
            note="Base 100 en fin de mois. Nominal = sans tenir compte des prix ; réel = en pouvoir d'achat. MASI hors dividendes. Sources : Bourse de Casablanca, HCP."
          >
            <GraphiqueLignes
              jeux={jeux}
              description="MASI en valeur nominale et réelle, base 100"
              points
              labelChoix="Valeur"
              decimalesInfo={1}
            />
          </CarteGraphique>
          {infl && infl.length > 0 && (
            <CarteGraphique
              titre="L'inflation est retombée après son pic"
              note={`Inflation sur un an, mois par mois. ${
                moisDeflation.length > 0
                  ? `Les prix ont même légèrement baissé sur un an (déflation) en ${moisDeflation.join(", ")}. `
                  : ""
              }Source : HCP.`}
            >
              <GraphiqueLignes
                jeux={[
                  {
                    id: "infl",
                    libelle: "Inflation",
                    donnees: numeriser(infl, ["inflation_annuelle_pct"]),
                    series: [{ cle: "inflation_annuelle_pct", libelle: "Inflation sur un an", couleur: "var(--serie-5)" }],
                  },
                ]}
                format="pourcentage"
                ligneZero
                decimalesInfo={1}
                description="Inflation annuelle au Maroc, mois par mois"
                points
              />
            </CarteGraphique>
          )}
        </>
      }
    />
  );
}

/* ---------- Résultat 7 : décisions de Bank Al-Maghrib ---------- */
function ongletBam(
  moyennes: Ligne[] | null,
  decisions: Ligne[] | null,
  hausses: Ligne[] | null,
  anticipations: Ligne[] | null,
) {
  if (!moyennes || moyennes.length === 0) return <Indisponible />;
  const baisse = moyennes.find((m) => m.type_decision === "baisse");
  const maintien = moyennes.find((m) => m.type_decision === "maintien");
  const baisses = (decisions ?? []).filter((d) => d.type_decision === "baisse");
  const datesBaisses = baisses.map((d) => formatMoisAnnee(d.date_annonce)).join(", ");
  const datesHausses = (hausses ?? []).map((h) => formatMoisAnnee(h.date_effet)).join(", ");
  const debutMasi = hausses?.[0]?.debut_masi;
  const anticipBaisse = anticipations?.find((a) => a.decision === "Baisse");
  // Chaque baisse séparément : avec si peu de cas, on regarde si elles vont toutes dans le même sens.
  const jeuBaisses: Jeu = {
    id: "baisses",
    libelle: "Chaque baisse",
    series: [
      { cle: "j5", libelle: "5 séances après", couleur: "var(--serie-1)" },
      { cle: "j20", libelle: "20 séances après", couleur: "var(--serie-3)" },
    ],
    donnees: numeriser(
      baisses.map((d) => ({
        categorie: formatMoisAnnee(d.date_annonce),
        j5: d.rendement_anormal_5_pct,
        j20: d.rendement_anormal_20_pct,
      })),
      ["j5", "j20"],
    ),
  };
  const jeu: Jeu = {
    id: "moy",
    libelle: "Moyennes",
    series: [
      { cle: "j5", libelle: "5 séances après", couleur: "var(--serie-1)" },
      { cle: "j20", libelle: "20 séances après", couleur: "var(--serie-3)" },
    ],
    donnees: numeriser(
      moyennes.map((m) => ({
        categorie: `${MAJUSCULE(m.type_decision)} (${m.nb_decisions})`,
        j5: m.rendement_anormal_5_moyen_pct,
        j20: m.rendement_anormal_20_moyen_pct,
      })),
      ["j5", "j20"],
    ),
  };
  const colonnes: Colonne[] = [
    { cle: "date_annonce", libelle: "Annonce", type: "date" },
    { cle: "type", libelle: "Décision" },
    { cle: "variation_pb", libelle: "Variation", type: "pb" },
    { cle: "taux_directeur_pct", libelle: "Taux directeur", type: "pourcentage", signe: false, decimales: 2 },
    { cle: "perf_20_seances_pct", libelle: "MASI à 20 séances", type: "pourcentage", colore: true },
    { cle: "rendement_anormal_5_pct", libelle: "Écart à 5 séances", type: "points", colore: true },
    { cle: "rendement_anormal_20_pct", libelle: "Écart à 20 séances", type: "points", colore: true },
  ];
  return (
    <MiseEnPageResultat
      carte={
        <CarteConstat
          teinte="sarcelle"
          icone={Landmark}
          theme="Banque centrale"
          constat="Les baisses du taux directeur ont été suivies d'une hausse du MASI."
          tuiles={[
            {
              etiquette: "MASI après une baisse du taux, par rapport à d'habitude",
              valeur: formatPoints(baisse?.rendement_anormal_20_moyen_pct),
              interpretation: baisse ? `${baisse.nb_decisions} décisions` : null,
            },
            {
              etiquette: "MASI après un maintien du taux, par rapport à d'habitude",
              valeur: formatPoints(maintien?.rendement_anormal_20_moyen_pct),
              interpretation: maintien ? `${maintien.nb_decisions} décisions` : null,
            },
          ]}
          precision={`${LIBELLE_FREQUENCE.quotidien}, 20 séances après chaque annonce · MASI hors dividendes`}
          conclusion="Très peu de baisses : c'est une corrélation, pas une preuve de cause."
          details={`Chaque chiffre est l'écart moyen entre la performance du MASI sur les 20 séances qui suivent l'annonce et sa performance habituelle : la performance moyenne du MASI sur 20 séances, en partant de n'importe quel jour de son historique. Limite : les baisses (${datesBaisses}) tombent toutes pendant la forte hausse de 2024–2025 ; comparé à une moyenne qui inclut la baisse récente, le MASI de ces périodes paraît « anormal » même sans effet de la décision.${
            anticipBaisse
              ? ` Les baisses étaient pourtant des surprises pour le marché des taux (la veille, écart du taux à 13 semaines avec le taux directeur de ${formatPointsDeBase(anticipBaisse.ecart_min)} à ${formatPointsDeBase(anticipBaisse.ecart_max)}, voir « Taux et obligations ») : une réaction du MASI après l'annonce est donc plausible.`
              : ""
          }`}
        />
      }
      graphiques={
        <CarteGraphique
          titre="Après une baisse du taux directeur, le MASI a mieux fait que d'habitude"
          note={`Écart entre la performance du MASI après l'annonce et sa performance habituelle sur la même durée. Entre parenthèses : le nombre de décisions, prises depuis le début de l'historique du MASI${
            debutMasi ? ` (${formatDate(debutMasi)})` : ""
          }. Pas de barre « Hausse » : les hausses (${datesHausses || "—"}) ont eu lieu avant ce début. Sources : Bank Al-Maghrib, Bourse de Casablanca.`}
        >
          <GraphiqueBarres
            jeux={[jeu, jeuBaisses]}
            format="points"
            decimalesInfo={1}
            labelChoix="Affichage"
            description="Écart du MASI après une baisse ou un maintien du taux directeur, en moyenne ou baisse par baisse"
          />
        </CarteGraphique>
      }
      tableau={
        decisions && (
          <div>
            <TitreTableau>MASI autour de chaque décision de Bank Al-Maghrib</TitreTableau>
            <TableauTriable
              colonnes={colonnes}
              lignes={decisions.map((d) => ({ ...d, type: MAJUSCULE(d.type_decision) }))}
              legende="Performance du MASI après chaque décision sur le taux directeur"
              triInitial={{ cle: "date_annonce", sens: "desc" }}
              hauteurMax="26rem"
            />
          </div>
        )
      }
    />
  );
}

export default async function PageContexteEconomique() {
  const macro = await macroTrimestriel();
  const picMacro = await macroPic();
  const reel = await rendementReel();
  const infl = await inflation();
  const picInfl = await inflationPic();
  const moyennes = await moyennesBam();
  const decisions = await decisionsBam();
  const hausses = await haussesBam();
  const anticipations = await resumeAnticipations();

  // Bandeau de KPI : les derniers chiffres de la page, et en pastille le chiffre de comparaison lu en base.
  const reelDernier = reel?.[reel.length - 1];
  const inflDerniere = infl?.[infl.length - 1];
  const pibDernier = macro?.filter((m) => m.croissance_pib_pct !== null).at(-1);
  const decisionDerniere = decisions?.[decisions.length - 1];
  const kpis: Kpi[] = [
    {
      icone: ShoppingBasket,
      valeur: formatPourcentage(reelDernier?.reel_pct),
      libelle: `MASI en pouvoir d'achat (réel), jusqu'à ${formatMoisAnnee(reelDernier?.date)}`,
      pastille: reelDernier ? `Nominal : ${formatPourcentage(reelDernier.nominal_pct)}` : null,
      valeurPastille: reelDernier?.nominal_pct,
    },
    {
      icone: Thermometer,
      valeur: formatPourcentage(inflDerniere?.inflation_annuelle_pct),
      libelle: `Inflation sur un an, ${formatMoisAnnee(inflDerniere?.date)}`,
      pastille: picInfl?.[0]
        ? `Pic : ${formatPourcentage(picInfl[0].inflation_annuelle_pct)} (${formatMoisAnnee(picInfl[0].date)})`
        : null,
    },
    {
      icone: Factory,
      valeur: formatPourcentage(pibDernier?.croissance_pib_pct),
      libelle: `Croissance du PIB sur un an, ${pibDernier ? formatTrimestre(pibDernier.annee, pibDernier.trimestre, false) : "—"}`,
      pastille: pibDernier ? `MASI sur un an : ${formatPourcentage(pibDernier.perf_masi_annuelle_pct)}` : null,
      valeurPastille: pibDernier?.perf_masi_annuelle_pct,
    },
    {
      icone: Landmark,
      valeur: formatPourcentage(decisionDerniere?.taux_directeur_pct, { signe: false, decimales: 2 }),
      libelle: "Taux directeur de Bank Al-Maghrib",
      pastille: decisionDerniere
        ? `${MAJUSCULE(decisionDerniere.type_decision)} le ${formatDateCourte(decisionDerniere.date_annonce)}`
        : null,
    },
  ];

  return (
    <>
      <BandeauKpi titre="Chiffres clés de la page" kpis={kpis} />
      <ConclusionPage>
        La bourse réagit bien plus vite que l&apos;économie, l&apos;inflation a peu rogné le rendement des actions,
        et les baisses du taux directeur ont plutôt été de bonnes nouvelles pour le MASI.
      </ConclusionPage>
      <Onglets
        onglets={[
          { id: "pib", libelle: "MASI et PIB", contenu: ongletPib(macro, picMacro) },
          { id: "reel", libelle: "Nominal et réel", contenu: ongletReel(reel, infl, picInfl) },
          { id: "bam", libelle: "Décisions de la banque centrale", contenu: ongletBam(moyennes, decisions, hausses, anticipations) },
        ]}
      />
    </>
  );
}
