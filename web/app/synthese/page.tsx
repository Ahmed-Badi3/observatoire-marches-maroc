import type { Metadata } from "next";
import { Briefcase, ChartPie, Gauge, Layers, ListOrdered, Scale, TrendingUp } from "lucide-react";

import { CarteChaleur, type CelluleChaleur } from "@/components/observatoire/carte-chaleur";
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
import { NuageRendementRisque } from "@/components/observatoire/nuage-rendement-risque";
import { Onglets } from "@/components/observatoire/onglets";
import { TableauTriable, type Colonne } from "@/components/observatoire/tableau-triable";
import { placements, type Placement } from "@/lib/donnees";
import {
  base100Actions,
  compositions,
  correlations,
  fondsVsMasi,
  sharpeExtremes,
  syntheseAnnuel,
  type Ligne,
} from "@/lib/donnees-pages";
import { GraphiqueLignes } from "@/components/observatoire/graphique-lignes";
import { BarreEmpilee } from "@/components/observatoire/barre-empilee";
import { formatNombre, formatPeriode, formatPourcentage } from "@/lib/format";
import { interpreterCorrelation } from "@/lib/interpretation";
import { enNombre, etiqueterAnnees, pivoter, type Jeu } from "@/lib/graphiques";

export const metadata: Metadata = { title: "Synthèse quantitative" };

// Libellés de la colonne `actif` en base (docs/DATA.md).
const MASI = "MASI";
const FONDS_ACTIONS = "Fonds Actions";
const PORTEFEUILLES = ["Portefeuille prudent", "Portefeuille équilibré", "Portefeuille dynamique"];
// Ordre d'affichage de la carte de chaleur (hors portefeuilles).
const ORDRE_ACTIFS = [MASI, FONDS_ACTIONS, "Fonds Diversifiés", "OMLT", "OCT", "Monétaire"];

const colonnesPlacements: Colonne[] = [
  { cle: "actif", libelle: "Placement" },
  { cle: "rdt_cumule_pct", libelle: "Rendement cumulé", type: "pourcentage", colore: true },
  { cle: "rdt_annualise_pct", libelle: "Annualisé", type: "pourcentage", colore: true },
  { cle: "volatilite_pct", libelle: "Volatilité", type: "pourcentage", signe: false },
  { cle: "pire_baisse_pct", libelle: "Pire baisse", type: "pourcentage", colore: true },
  { cle: "ratio_rendement_risque", libelle: "Sharpe", type: "nombre" },
  { cle: "part_rdt_masi_pct", libelle: "% du rendement du MASI", type: "pourcentage", signe: false, decimales: 0 },
  { cle: "part_risque_masi_pct", libelle: "% du risque du MASI", type: "pourcentage", signe: false, decimales: 0 },
];

/* ---------- Résultat 15 : rendement / risque ---------- */
function ongletRendementRisque(lignes: Placement[], extremes: Ligne[] | null) {
  const e = extremes?.[0];
  const masi = lignes.find((l) => l.actif === MASI);
  // Le Sharpe du Monétaire est stocké à 0,00 (non significatif) : on affiche « — » (docs/DATA.md).
  const lignesTableau = lignes.map((l) => ({
    ...l,
    ratio_rendement_risque: l.actif === "Monétaire" ? null : l.ratio_rendement_risque,
  }));
  // Barres du Sharpe : sans le Monétaire (taux sans risque, Sharpe nul par construction), triées par Sharpe,
  // avec des noms courts (« Prudent » plutôt que « Portefeuille prudent », sinon coupés sous les barres).
  const sharpe: Jeu = {
    id: "sharpe",
    libelle: "Sharpe",
    series: [{ cle: "sharpe", libelle: "Rendement par unité de risque (Sharpe)" }],
    donnees: lignes
      .filter((l) => l.actif !== "Monétaire")
      .sort((a, b) => Number(b.ratio_rendement_risque) - Number(a.ratio_rendement_risque))
      .map((l) => {
        const court = l.actif.replace("Portefeuille ", "");
        return { actif: court.charAt(0).toUpperCase() + court.slice(1), sharpe: enNombre(l.ratio_rendement_risque) };
      }),
  };
  const oct = lignes.find((l) => l.actif === "OCT");
  const equilibre = lignes.find((l) => l.actif === PORTEFEUILLES[1]);
  const monetaire = lignes.find((l) => l.actif === "Monétaire");
  return (
    <MiseEnPageResultat
      carte={
        <CarteConstat
          teinte="fonce"
          icone={Scale}
          theme="Rendement et risque"
          constat="Plus de rendement, c'est plus de risque."
          tuiles={[
            {
              etiquette: "Rendement par unité de risque (Sharpe) des autres placements",
              valeur: `${formatNombre(e?.minimum)} – ${formatNombre(e?.maximum)}`,
            },
            {
              etiquette: "Fonds obligataires court terme (OCT)",
              valeur: formatNombre(oct?.ratio_rendement_risque),
            },
          ]}
          precision={formatPeriode(masi?.debut, masi?.fin, "hebdo")}
          conclusion="Hors fonds de taux courts, aucun placement n'est nettement meilleur : on choisit son niveau de risque."
          details={`Les écarts de Sharpe entre les autres placements sont trop faibles pour les départager sur une période aussi courte. Les fonds CT ont un ratio élevé surtout parce que leur risque est très faible : le moindre surplus de rendement sur le monétaire, divisé par une volatilité minuscule, donne un grand nombre. À retenir : ils apportent ${formatPourcentage(oct?.part_rdt_masi_pct, { decimales: 0, signe: false })} du rendement du MASI pour seulement ${formatPourcentage(oct?.part_risque_masi_pct, { decimales: 0, signe: false })} de son risque. Les trois portefeuilles types sont construits à partir des fonds (voir « Méthode et sources »).`}
        />
      }
      graphiques={
        <>
          <CarteGraphique
            titre="Le rendement augmente avec le risque : on choisit son niveau de risque"
            note="Rendement et volatilité annualisés, sur les vendredis AMMC de la période. MASI hors dividendes. Source : AMMC, Bourse de Casablanca."
          >
            <NuageRendementRisque
              points={lignes.map((l) => ({
                actif: l.actif,
                risque: l.volatilite_pct,
                rendement: l.rdt_annualise_pct,
                sharpe: l.ratio_rendement_risque,
              }))}
            />
          </CarteGraphique>
          <CarteGraphique
            titre="Par unité de risque, les placements se valent presque tous"
            note={`Sharpe = (rendement annualisé − celui des fonds monétaires, ${formatPourcentage(monetaire?.rdt_annualise_pct, { signe: false })} par an) ÷ volatilité. Le Monétaire sert de taux sans risque : son Sharpe vaut 0 par construction, il n'est donc pas affiché. Barres triées du plus élevé au plus faible.`}
          >
            <GraphiqueBarres
              jeux={[sharpe]}
              cleX="actif"
              format="nombre"
              decimalesAxe={1}
              decimalesInfo={2}
              hauteur={260}
              description="Ratio de Sharpe de chaque placement"
            />
          </CarteGraphique>
        </>
      }
      tableau={
        <div>
          <TitreTableau>Tous les placements et portefeuilles types</TitreTableau>
          <TableauTriable
            colonnes={colonnesPlacements}
            lignes={lignesTableau}
            legende="Rendement, risque et Sharpe de chaque placement"
            triInitial={{ cle: "rdt_cumule_pct", sens: "desc" }}
          />
          <p className="mt-2 text-xs text-texte-secondaire">
            « % du rendement du MASI » = rendement annualisé du placement ÷ celui du MASI (portefeuille équilibré :{" "}
            {formatPourcentage(equilibre?.rdt_annualise_pct, { signe: false })} ÷{" "}
            {formatPourcentage(masi?.rdt_annualise_pct, { signe: false })} ={" "}
            {formatPourcentage(equilibre?.part_rdt_masi_pct, { decimales: 0, signe: false })}). « % du risque du MASI » =
            volatilité du placement ÷ celle du MASI ({formatPourcentage(equilibre?.volatilite_pct, { signe: false })} ÷{" "}
            {formatPourcentage(masi?.volatilite_pct, { signe: false })} ={" "}
            {formatPourcentage(equilibre?.part_risque_masi_pct, { decimales: 0, signe: false })}).
          </p>
        </div>
      }
    />
  );
}

/* ---------- Résultat 16 : année par année, avec choix du portefeuille ---------- */
// Couleurs des placements dans la barre empilée (texte foncé sur les teintes claires, pour la lisibilité).
const COULEURS_PLACEMENTS: Record<string, { couleur: string; texte: string }> = {
  Monétaire: { couleur: "var(--serie-3)", texte: "white" },
  OMLT: { couleur: "var(--serie-1)", texte: "var(--texte)" },
  [FONDS_ACTIONS]: { couleur: "var(--serie-2)", texte: "var(--texte)" },
};

function ongletAnnees(annuel: Ligne[] | null, masi: Placement | undefined, compo: Ligne[] | null) {
  if (!annuel || annuel.length === 0) return <Indisponible />;
  // « 2026 » devient « 2026 (janv.–oct.) » quand la base déclare l'année partielle.
  const etiquetes = etiqueterAnnees(annuel);
  const annees = [...new Set(etiquetes.map((l) => l.annee))].sort();
  const valeur = (actif: string, annee: string) =>
    enNombre(etiquetes.find((l) => l.actif === actif && l.annee === annee)?.rendement_pct);
  const presents = PORTEFEUILLES.filter((p) => annuel.some((l) => l.actif === p));

  const jeux: Jeu[] = presents.map((p) => ({
    id: p,
    libelle: p.replace("Portefeuille ", ""),
    series: [
      { cle: "portefeuille", libelle: p, couleur: "var(--serie-3)" },
      { cle: "masi", libelle: MASI, couleur: "var(--serie-2)" },
      { cle: "actions", libelle: FONDS_ACTIONS, couleur: "var(--serie-1)" },
    ],
    donnees: annees.map((a) => ({
      annee: a,
      portefeuille: valeur(p, a),
      masi: valeur(MASI, a),
      actions: valeur(FONDS_ACTIONS, a),
    })),
  }));

  const derniere = annees[annees.length - 1];
  const prudent = etiquetes.find((l) => l.actif === PORTEFEUILLES[0] && l.annee === derniere);
  const dynamique = etiquetes.find((l) => l.actif === PORTEFEUILLES[2] && l.annee === derniere);

  // Classement de chaque placement, année par année (tri des valeurs lues en base, 1 = meilleur).
  const actifs = [...new Set(etiquetes.map((l) => String(l.actif)))];
  const rang = (actif: string, annee: string) => {
    const tries = etiquetes
      .filter((l) => l.annee === annee)
      .sort((a, b) => Number(b.rendement_pct) - Number(a.rendement_pct));
    return tries.findIndex((l) => l.actif === actif) + 1;
  };
  const ordinal = (n: number) => (n === 1 ? "1er" : `${n}e`);
  const anneesCompletes = annees.filter((a) =>
    etiquetes.some((l) => l.annee === a && String(l.annee_partielle) === "false"),
  );
  const meilleureAnneeActions = anneesCompletes.reduce<string | undefined>(
    (m, a) => (!m || rang(FONDS_ACTIONS, a) < rang(FONDS_ACTIONS, m) ? a : m),
    undefined,
  );
  const ligneActions = (a: string | undefined) => etiquetes.find((l) => l.actif === FONDS_ACTIONS && l.annee === a);
  const prudentComplet = anneesCompletes.map((a) => formatPourcentage(valeur(PORTEFEUILLES[0], a)));
  const actionsComplet = anneesCompletes.map((a) => formatPourcentage(valeur(FONDS_ACTIONS, a)));

  // Tableau : une ligne par placement (les 9, fonds de taux compris), une colonne par année, et le rang
  // de la dernière année : on voit le classement changer.
  const colonnes: Colonne[] = [
    { cle: "actif", libelle: "Placement" },
    ...annees.map((a): Colonne => ({ cle: a, libelle: a, type: "pourcentage", colore: true })),
    { cle: "rang", libelle: `Rang en ${derniere}`, type: "nombre", decimales: 0 },
  ];
  const lignes = actifs
    .map((x) => ({ actif: x, ...Object.fromEntries(annees.map((a) => [a, valeur(x, a)])), rang: rang(x, derniere) }))
    .sort((a, b) => a.rang - b.rang);

  return (
    <MiseEnPageResultat
      carte={
        <CarteConstat
          teinte="corail"
          icone={ListOrdered}
          theme="Classement des placements"
          constat="Le classement des placements change d'une année à l'autre."
          tuiles={[
            {
              etiquette: `Fonds Actions en ${meilleureAnneeActions ?? "—"}, sur ${actifs.length} placements`,
              valeur: meilleureAnneeActions ? ordinal(rang(FONDS_ACTIONS, meilleureAnneeActions)) : "—",
              interpretation: formatPourcentage(ligneActions(meilleureAnneeActions)?.rendement_pct),
            },
            {
              etiquette: `Fonds Actions en ${derniere}, sur ${actifs.length} placements`,
              valeur: ordinal(rang(FONDS_ACTIONS, derniere)),
              interpretation: formatPourcentage(ligneActions(derniere)?.rendement_pct),
            },
          ]}
          precision={formatPeriode(masi?.debut, masi?.fin, "hebdo")}
          conclusion="Choisissez un portefeuille au-dessus du graphique pour le comparer au MASI et aux fonds Actions."
          details={`En ${derniere}, portefeuille prudent : ${formatPourcentage(prudent?.rendement_pct)} ; portefeuille dynamique : ${formatPourcentage(dynamique?.rendement_pct)}. Le tableau sous le graphique donne le rang de chaque placement.`}
        />
      }
      graphiques={
        <CarteGraphique
          titre="Un portefeuille prudent limite les années de baisse, au prix des années de hausse"
          note={`Rendement par année civile, sur les vendredis AMMC. Entre parenthèses, les mois couverts quand l'année est incomplète. Le portefeuille prudent a limité la perte à ${formatPourcentage(prudent?.rendement_pct)} en ${derniere}, mais n'a gagné que ${prudentComplet.join(" et ")} en ${anneesCompletes.join(" et ")}, contre ${actionsComplet.join(" et ")} pour les fonds Actions.`}
        >
          <GraphiqueBarres
            jeux={jeux}
            cleX="annee"
            format="pourcentage"
            decimalesInfo={1}
            labelChoix="Portefeuille type"
            description="Rendement annuel du portefeuille type choisi, du MASI et des fonds Actions"
          />
        </CarteGraphique>
      }
      tableau={
        <div className="space-y-6">
          {compo && compo.length > 0 && (
            <CarteGraphique
              titre="De quoi sont faits les portefeuilles types"
              note="Poids de chaque placement, rééquilibrés chaque semaine. Monétaire = fonds monétaires, OMLT = fonds obligataires moyen et long terme. Source : base de l'Observatoire (table des compositions)."
            >
              <BarreEmpilee
                description="Composition des portefeuilles prudent, équilibré et dynamique"
                legende={Object.entries(COULEURS_PLACEMENTS).map(([cle, c]) => ({ cle, couleur: c.couleur }))}
                barres={PORTEFEUILLES.filter((p) => compo.some((c) => c.portefeuille === p)).map((p) => ({
                  libelle: p,
                  segments: Object.keys(COULEURS_PLACEMENTS).map((placement) => ({
                    cle: placement,
                    valeur: compo.find((c) => c.portefeuille === p && c.placement === placement)?.poids_pct ?? null,
                    ...COULEURS_PLACEMENTS[placement],
                  })),
                }))}
              />
            </CarteGraphique>
          )}
          <div>
            <TitreTableau>Rendement par année</TitreTableau>
            <TableauTriable colonnes={colonnes} lignes={lignes} legende="Rendement annuel de chaque placement et portefeuille" />
            <p className="mt-2 text-xs text-texte-secondaire">
              {formatPeriode(masi?.debut, masi?.fin, "hebdo")}.
            </p>
          </div>
        </div>
      }
    />
  );
}

/* ---------- Résultat 17 : corrélations ---------- */
function ongletCorrelations(paires: Ligne[] | null, masi: Placement | undefined) {
  if (!paires || paires.length === 0) return <Indisponible />;
  const presents = ORDRE_ACTIFS.filter((a) => paires.some((p) => p.actif_1 === a || p.actif_2 === a));
  const corr = (a: string, b: string): number | null => {
    if (a === b) return 1; // un placement est parfaitement corrélé à lui-même
    const p = paires.find((x) => (x.actif_1 === a && x.actif_2 === b) || (x.actif_1 === b && x.actif_2 === a));
    return enNombre(p?.correlation);
  };
  const cellules: CelluleChaleur[] = presents.flatMap((l) =>
    presents.map((c) => ({ ligne: l, colonne: c, valeur: corr(l, c) })),
  );
  const aucuneNegative = paires.every((p) => Number(p.correlation) >= 0);
  const diversifiesActions = corr("Fonds Diversifiés", FONDS_ACTIONS);
  return (
    <MiseEnPageResultat
      carte={
        <CarteConstat
          teinte="sarcelle"
          icone={Layers}
          theme="Diversification"
          constat="La diversification fonctionne."
          tuiles={[
            {
              etiquette: "MASI ↔ fonds obligataires MLT (OMLT)",
              valeur: formatNombre(corr(MASI, "OMLT")),
              interpretation: interpreterCorrelation(corr(MASI, "OMLT")),
            },
            {
              etiquette: "MASI ↔ fonds Actions",
              valeur: formatNombre(corr(MASI, FONDS_ACTIONS)),
              interpretation: interpreterCorrelation(corr(MASI, FONDS_ACTIONS)),
            },
          ]}
          precision={`Corrélations des rendements · ${formatPeriode(masi?.debut, masi?.fin, "hebdo", { horsDividendes: false })}`}
          conclusion="Les fonds de taux bougent bien moins avec le MASI que les fonds Actions : c'est ce qui amortit les chutes."
          details={`${aucuneNegative ? "Aucune corrélation n'est négative : les obligations amortissent les chutes des actions, sans les compenser. " : ""}MASI ↔ fonds obligataires CT (OCT) : ${formatNombre(corr(MASI, "OCT"))}, ${interpreterCorrelation(corr(MASI, "OCT")) ?? "—"}. Les fonds Diversifiés ne sont pas un mélange indépendant : corrélation de ${formatNombre(diversifiesActions)} avec les fonds Actions (${interpreterCorrelation(diversifiesActions) ?? "—"}), ils se comportent comme une « petite dose » d'actions. Plus la corrélation est proche de 0, plus deux placements bougent indépendamment.`}
        />
      }
      graphiques={
        <CarteGraphique
          titre="Le MASI ressemble aux fonds Actions, beaucoup moins aux fonds de taux"
          note="Corrélation entre les rendements hebdomadaires du placement en ligne et de celui en colonne, de −1 à +1. OMLT = obligations moyen et long terme, OCT = obligations court terme. Source : AMMC, Bourse de Casablanca."
        >
          <CarteChaleur
            etiquettes={presents}
            cellules={cellules}
            legende="Corrélation entre les rendements hebdomadaires de chaque paire de placements"
            triangle
          />
        </CarteGraphique>
      }
    />
  );
}

/* ---------- Résultat 18 : fonds Actions vs MASI ---------- */
function ongletFondsActions(lignes: Placement[], base100: Ligne[] | null, gestion: Ligne[] | null) {
  const masi = lignes.find((l) => l.actif === MASI);
  const actions = lignes.find((l) => l.actif === FONDS_ACTIONS);
  const g = gestion?.[0];
  // Deux courbes base 100 dans le temps (au lieu de deux mesures différentes sur le même axe).
  const { donnees, series } = pivoter(base100 ?? [], "date", "actif", "base_100");
  const couleurs: Record<string, string> = { [MASI]: "var(--serie-2)", [FONDS_ACTIONS]: "var(--serie-1)" };
  const jeu: Jeu = {
    id: "base100",
    libelle: "Base 100",
    donnees,
    series: series.map((s) => ({ cle: s, libelle: s, couleur: couleurs[s] })),
  };
  return (
    <MiseEnPageResultat
      carte={
        <CarteConstat
          teinte="ambre"
          icone={Briefcase}
          theme="Gestion de fonds"
          constat="Les fonds Actions ne battent pas l'indice."
          tuiles={[
            { etiquette: "Fonds Actions, rendement cumulé", valeur: formatPourcentage(actions?.rdt_cumule_pct) },
            { etiquette: "MASI, rendement cumulé", valeur: formatPourcentage(masi?.rdt_cumule_pct) },
          ]}
          precision={formatPeriode(masi?.debut, masi?.fin, "hebdo")}
          conclusion={`Les fonds rapportent un peu moins que l'indice qu'ils cherchent à suivre${
            g ? `, en s'en écartant nettement : tracking error ${formatPourcentage(g.tracking_error_pct, { signe: false })}, ratio d'information ${formatNombre(g.ratio_information, { signe: true })}` : ""
          }.`}
          details={`Volatilité : ${formatPourcentage(actions?.volatilite_pct, { signe: false })} pour les fonds Actions, contre ${formatPourcentage(masi?.volatilite_pct, { signe: false })} pour le MASI. Tracking error = à quel point le fonds s'écarte de l'indice, dans un sens ou dans l'autre (volatilité de l'écart hebdomadaire, sur un an). Ratio d'information = écart moyen ÷ tracking error : ce que cet écart a rapporté par unité d'écart pris ; négatif, il a coûté. Le MASI ne compte pas les dividendes, que les fonds encaissent : à dividendes égaux, l'écart réel de gestion est plus grand que celui affiché.`}
        />
      }
      graphiques={
        <CarteGraphique
          titre="100 DH placés dans le MASI ou dans les fonds Actions"
          note="Valeur de 100 DH placés le premier vendredi de la période, semaine après semaine (chaque vendredi AMMC). Le MASI est hors dividendes ; les fonds, eux, les encaissent. Sources : AMMC, Bourse de Casablanca."
        >
          <GraphiqueLignes
            jeux={[jeu]}
            format="nombre"
            decimalesAxe={0}
            decimalesInfo={1}
            description="Valeur en base 100 du MASI et des fonds Actions, semaine par semaine"
          />
        </CarteGraphique>
      }
    />
  );
}

export default async function PageSynthese() {
  const lignes = await placements();
  const extremes = await sharpeExtremes();
  const annuel = await syntheseAnnuel();
  const compo = await compositions();
  const paires = await correlations();
  const base100 = await base100Actions();
  const gestion = await fondsVsMasi();

  // Bandeau de KPI : chiffres de la synthèse, et en pastille le chiffre de comparaison lu en base.
  const masi = lignes?.find((l) => l.actif === MASI);
  const actions = lignes?.find((l) => l.actif === FONDS_ACTIONS);
  const equilibre = lignes?.find((l) => l.actif === PORTEFEUILLES[1]);
  const sharpe = extremes?.[0];
  const masiOmlt = paires?.find(
    (p) => (p.actif_1 === MASI && p.actif_2 === "OMLT") || (p.actif_1 === "OMLT" && p.actif_2 === MASI),
  )?.correlation;
  const kpis: Kpi[] = [
    {
      icone: TrendingUp,
      valeur: formatPourcentage(masi?.rdt_cumule_pct),
      libelle: "MASI, rendement cumulé (chaque vendredi, hors dividendes)",
      pastille: actions ? `Fonds Actions : ${formatPourcentage(actions.rdt_cumule_pct)}` : null,
      valeurPastille: actions?.rdt_cumule_pct,
    },
    {
      icone: ChartPie,
      valeur: formatPourcentage(equilibre?.rdt_cumule_pct),
      libelle: "Portefeuille équilibré, rendement cumulé",
      pastille: equilibre
        ? `${formatPourcentage(equilibre.part_rdt_masi_pct, { decimales: 0, signe: false })} du rendement du MASI`
        : null,
    },
    {
      icone: Gauge,
      valeur: `${formatNombre(sharpe?.minimum)} – ${formatNombre(sharpe?.maximum)}`,
      libelle: "Rendement par unité de risque (Sharpe), hors fonds de taux courts",
      pastille: `Fonds CT : ${formatNombre(lignes?.find((l) => l.actif === "OCT")?.ratio_rendement_risque)}`,
    },
    {
      icone: Layers,
      valeur: formatNombre(masiOmlt),
      libelle: "Corrélation MASI ↔ fonds OMLT (rendements hebdo)",
      pastille: interpreterCorrelation(masiOmlt),
    },
  ];

  return (
    <>
      <BandeauKpi titre="Chiffres clés de la page" kpis={kpis} />
      <ConclusionPage>
        Hors fonds de taux courts, aucun placement n&apos;est nettement meilleur par unité de risque : choisir son
        niveau de risque et diversifier compte plus que chercher le « meilleur » produit.
      </ConclusionPage>
      <Onglets
        onglets={[
          {
            id: "rendement-risque",
            libelle: "Rendement et risque",
            contenu: lignes ? ongletRendementRisque(lignes, extremes) : <Indisponible />,
          },
          { id: "annees", libelle: "Année par année", contenu: ongletAnnees(annuel, lignes?.find((l) => l.actif === MASI), compo) },
          { id: "correlations", libelle: "Corrélations", contenu: ongletCorrelations(paires, lignes?.find((l) => l.actif === MASI)) },
          {
            id: "fonds-actions",
            libelle: "Fonds Actions et MASI",
            contenu: lignes ? ongletFondsActions(lignes, base100, gestion) : <Indisponible />,
          },
        ]}
      />
    </>
  );
}
