import type { Metadata } from "next";
import { Briefcase, Layers, ListOrdered, Scale } from "lucide-react";

import { CarteChaleur, type CelluleChaleur } from "@/components/observatoire/carte-chaleur";
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
import { correlations, sharpeExtremes, syntheseAnnuel, type Ligne } from "@/lib/donnees-pages";
import { formatNombre, formatPeriode, formatPourcentage } from "@/lib/format";
import { interpreterCorrelation } from "@/lib/interpretation";
import { enNombre, etiqueterAnnees, type Jeu } from "@/lib/graphiques";

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
  const sharpe: Jeu = {
    id: "sharpe",
    libelle: "Sharpe",
    series: [{ cle: "sharpe", libelle: "Rendement par unité de risque (Sharpe)" }],
    donnees: lignesTableau.map((l) => ({ actif: l.actif, sharpe: enNombre(l.ratio_rendement_risque) })),
  };
  return (
    <MiseEnPageResultat
      carte={
        <CarteConstat
          teinte="fonce"
          icone={Scale}
          theme="Rendement et risque"
          constat="Plus de rendement, c'est autant plus de risque."
          tuiles={[
            {
              etiquette: "Rendement par unité de risque (Sharpe) de tous les placements, hors Monétaire",
              valeur: `${formatNombre(e?.minimum)} – ${formatNombre(e?.maximum)}`,
            },
          ]}
          precision={formatPeriode(masi?.debut, masi?.fin, "hebdo")}
          conclusion="Aucun placement n'est nettement meilleur qu'un autre : on choisit son niveau de risque."
          details="Les trois portefeuilles types sont construits à partir des fonds (voir « Méthode et sources »)."
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
            note="Sharpe = rendement annualisé divisé par la volatilité. Le Monétaire n'est pas affiché : son ratio n'est pas significatif."
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
        </div>
      }
    />
  );
}

/* ---------- Résultat 16 : année par année, avec choix du portefeuille ---------- */
function ongletAnnees(annuel: Ligne[] | null, masi: Placement | undefined) {
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
  const actions = etiquetes.find((l) => l.actif === FONDS_ACTIONS && l.annee === derniere);

  const colonnes: Colonne[] = [
    { cle: "annee", libelle: "Année" },
    ...[MASI, FONDS_ACTIONS, ...PORTEFEUILLES].map((a): Colonne => ({
      cle: a,
      libelle: a.replace("Portefeuille ", "Portef. "),
      type: "pourcentage",
      colore: true,
    })),
  ];
  const lignes = annees.map((a) => ({
    annee: a,
    ...Object.fromEntries([MASI, FONDS_ACTIONS, ...PORTEFEUILLES].map((x) => [x, valeur(x, a)])),
  }));

  return (
    <MiseEnPageResultat
      carte={
        <CarteConstat
          teinte="corail"
          icone={ListOrdered}
          theme="Classement des placements"
          constat="Le classement des placements change d'une année à l'autre."
          tuiles={[
            { etiquette: `Fonds Actions en ${derniere}`, valeur: formatPourcentage(actions?.rendement_pct) },
            { etiquette: "Portefeuille prudent, même période", valeur: formatPourcentage(prudent?.rendement_pct) },
          ]}
          precision={formatPeriode(masi?.debut, masi?.fin, "hebdo")}
          conclusion="Choisissez un portefeuille au-dessus du graphique pour le comparer au MASI et aux fonds Actions."
          details={`Portefeuille dynamique sur la même période : ${formatPourcentage(dynamique?.rendement_pct)}.`}
        />
      }
      graphiques={
        <CarteGraphique
          titre="Un portefeuille prudent limite les années de baisse, au prix des années de hausse"
          note="Rendement par année civile, sur les vendredis AMMC. Entre parenthèses, les mois couverts quand l'année est incomplète. Les portefeuilles types sont construits à partir des fonds (voir « Méthode et sources »)."
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
        <div>
          <TitreTableau>Rendement par année</TitreTableau>
          <TableauTriable colonnes={colonnes} lignes={lignes} legende="Rendement annuel de chaque placement et portefeuille" />
          <p className="mt-2 text-xs text-texte-secondaire">
            {formatPeriode(masi?.debut, masi?.fin, "hebdo")}.
          </p>
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
          details={`Avec les fonds obligataires CT (OCT) : ${formatNombre(corr(MASI, "OCT"))}. Plus la corrélation est proche de 0, plus deux placements bougent indépendamment.`}
        />
      }
      graphiques={
        <CarteGraphique
          titre="Le MASI ressemble aux fonds Actions, beaucoup moins aux fonds de taux"
          note="Corrélation des rendements hebdomadaires, de −1 à +1. OMLT = obligations moyen et long terme, OCT = obligations court terme. Source : AMMC, Bourse de Casablanca."
        >
          <CarteChaleur
            etiquettes={presents}
            cellules={cellules}
            legende="Corrélation des rendements hebdomadaires entre les placements"
          />
        </CarteGraphique>
      }
    />
  );
}

/* ---------- Résultat 18 : fonds Actions vs MASI ---------- */
function ongletFondsActions(lignes: Placement[]) {
  const masi = lignes.find((l) => l.actif === MASI);
  const actions = lignes.find((l) => l.actif === FONDS_ACTIONS);
  const jeu: Jeu = {
    id: "fa",
    libelle: "Comparaison",
    series: [
      { cle: "rendement", libelle: "Rendement cumulé", couleur: "var(--serie-1)" },
      { cle: "volatilite", libelle: "Volatilité annualisée", couleur: "var(--serie-6)" },
    ],
    donnees: [masi, actions]
      .filter((l): l is Placement => !!l)
      .map((l) => ({ actif: l.actif, rendement: enNombre(l.rdt_cumule_pct), volatilite: enNombre(l.volatilite_pct) })),
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
          conclusion="Les fonds rapportent un peu moins que l'indice qu'ils cherchent à suivre."
          details={`Volatilité : ${formatPourcentage(actions?.volatilite_pct, { signe: false })} pour les fonds Actions, contre ${formatPourcentage(masi?.volatilite_pct, { signe: false })} pour le MASI. Le MASI ne compte pas les dividendes : l'écart reflète les frais et les choix de gestion.`}
        />
      }
      graphiques={
        <CarteGraphique
          titre="Les fonds Actions rapportent un peu moins que l'indice qu'ils cherchent à suivre"
          note="Sur la même période, chaque vendredi AMMC. Le MASI est hors dividendes ; les fonds, eux, les encaissent. Sources : AMMC, Bourse de Casablanca."
        >
          <GraphiqueBarres
            jeux={[jeu]}
            cleX="actif"
            format="pourcentage"
            decimalesInfo={1}
            hauteur={260}
            description="Rendement cumulé et volatilité du MASI et des fonds Actions"
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
  const paires = await correlations();

  return (
    <>
      <ConclusionPage>
        Aucun placement n&apos;est nettement meilleur par unité de risque : choisir son niveau de risque et diversifier
        compte plus que chercher le « meilleur » produit.
      </ConclusionPage>
      <Onglets
        onglets={[
          {
            id: "rendement-risque",
            libelle: "Rendement et risque",
            contenu: lignes ? ongletRendementRisque(lignes, extremes) : <Indisponible />,
          },
          { id: "annees", libelle: "Année par année", contenu: ongletAnnees(annuel, lignes?.find((l) => l.actif === MASI)) },
          { id: "correlations", libelle: "Corrélations", contenu: ongletCorrelations(paires, lignes?.find((l) => l.actif === MASI)) },
          {
            id: "fonds-actions",
            libelle: "Fonds Actions et MASI",
            contenu: lignes ? ongletFondsActions(lignes) : <Indisponible />,
          },
        ]}
      />
    </>
  );
}
