import type { Metadata } from "next";

import { CarteResultat } from "@/components/observatoire/carte-resultat";
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
  formatMoisAnnee,
  formatPeriode,
  formatPoints,
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
        <CarteResultat
          numero={5}
          phrase="La bourse bouge beaucoup plus que l'économie."
          chiffre={formatPourcentage(p?.perf_masi_annuelle_pct)}
          precision={`${LIBELLE_FREQUENCE.trimestriel}, variation sur un an · MASI hors dividendes`}
          legende={
            p
              ? `Au trimestre ${p.periode}, le MASI gagnait ${formatPourcentage(p.perf_masi_annuelle_pct)} sur un an, pour une croissance du PIB de ${formatPourcentage(p.croissance_pib_pct, { signe: false })} : c'est le trimestre où l'écart était le plus grand. Le recul récent du MASI ne vient pas d'un ralentissement économique mais de la valorisation.`
              : undefined
          }
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

  return (
    <MiseEnPageResultat
      carte={
        <CarteResultat
          numero={6}
          phrase="L'inflation a peu pesé sur le rendement des actions."
          chiffre={formatPourcentage(dernier.reel_pct)}
          precision={formatPeriode(premier.date, dernier.date, "mensuel")}
          legende={`Rendement réel du MASI (corrigé de l'inflation) de ${formatMoisAnnee(premier.date)} à ${formatMoisAnnee(dernier.date)}, contre ${formatPourcentage(dernier.nominal_pct)} en nominal. Le calcul s'arrête au dernier mois d'inflation publié par le HCP : ce chiffre ne se compare donc pas directement au rendement de l'accueil, relevé chaque vendredi.${
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
              note="Inflation sur un an, mois par mois. Source : HCP."
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
function ongletBam(moyennes: Ligne[] | null, decisions: Ligne[] | null) {
  if (!moyennes || moyennes.length === 0) return <Indisponible />;
  const baisse = moyennes.find((m) => m.type_decision === "baisse");
  const maintien = moyennes.find((m) => m.type_decision === "maintien");
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
        <CarteResultat
          numero={7}
          phrase="Les baisses du taux directeur ont été suivies d'une hausse du MASI."
          chiffre={formatPoints(baisse?.rendement_anormal_20_moyen_pct)}
          precision={`${LIBELLE_FREQUENCE.quotidien}, 20 séances après chaque annonce · MASI hors dividendes`}
          legende={`Sur 20 séances après l'annonce, le MASI fait en moyenne ${formatPoints(baisse?.rendement_anormal_20_moyen_pct, { signe: false })} de mieux qu'en temps normal après une baisse (${baisse?.nb_decisions ?? "—"} décisions), contre ${formatPoints(maintien?.rendement_anormal_20_moyen_pct, { signe: false })} après un maintien (${maintien?.nb_decisions ?? "—"} décisions). Très peu de baisses : c'est une corrélation, pas une preuve de cause.`}
        />
      }
      graphiques={
        <CarteGraphique
          titre="Après une baisse du taux directeur, le MASI a mieux fait que d'habitude"
          note="Écart entre la performance du MASI après l'annonce et sa performance habituelle sur la même durée. Entre parenthèses : le nombre de décisions. Sources : Bank Al-Maghrib, Bourse de Casablanca."
        >
          <GraphiqueBarres
            jeux={[jeu]}
            format="points"
            decimalesInfo={1}
            description="Écart moyen du MASI après une baisse ou un maintien du taux directeur"
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

  return (
    <>
      <ConclusionPage>
        La bourse réagit bien plus vite que l&apos;économie, l&apos;inflation a peu rogné le rendement des actions,
        et les baisses du taux directeur ont plutôt été de bonnes nouvelles pour le MASI.
      </ConclusionPage>
      <Onglets
        onglets={[
          { id: "pib", libelle: "MASI et PIB", contenu: ongletPib(macro, picMacro) },
          { id: "reel", libelle: "Nominal et réel", contenu: ongletReel(reel, infl, picInfl) },
          { id: "bam", libelle: "Décisions de la banque centrale", contenu: ongletBam(moyennes, decisions) },
        ]}
      />
    </>
  );
}
