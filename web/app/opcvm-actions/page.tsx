import type { Metadata } from "next";
import { Building2, Tag, TrendingDown, Users } from "lucide-react";

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
  drawdownMasi,
  fluxAnnuel,
  indices,
  indicesSynthese,
  kpiTiming,
  masiAnnuel,
  pireDrawdown,
  rendementsMasiAnnuels,
  valorisation,
  type Ligne,
} from "@/lib/donnees-pages";
import { placements, type Placement } from "@/lib/donnees";
import {
  LIBELLE_FREQUENCE,
  formatDate,
  formatDateCourte,
  formatMultiple,
  formatNombre,
  formatPeriode,
  formatPourcentage,
} from "@/lib/format";
import { interpreterCorrelation } from "@/lib/interpretation";
import { enNombre, etiqueterAnnees, pivoter, type Jeu } from "@/lib/graphiques";

export const metadata: Metadata = { title: "OPCVM et marché actions" };

// Les noms de catégories, d'indices et de périmètres ci-dessous sont des libellés présents en base
// (docs/DATA.md), pas des chiffres.
const COULEUR_MASI = "var(--serie-2)";
const COULEUR_MASI20 = "var(--serie-1)";

/* ---------- Résultat 1 : flux vs MASI ---------- */
function ongletFlux(
  flux: Ligne[] | null,
  masiAn: Ligne[] | null,
  timing: Ligne[] | null,
  masiHebdo: Placement | undefined,
) {
  if (!flux || !timing || timing.length === 0) return <Indisponible />;
  const t = timing[0];
  // « 2026 » devient « 2026 (janv.–oct.) » quand la base déclare l'année partielle.
  const fluxEtiquetes = etiqueterAnnees(flux);
  // Le MASI de ce tableau est relevé chaque vendredi AMMC, comme les flux (analytics.synthese_annuel).
  // Ses dates de début et de fin sont celles de la synthèse : même série hebdomadaire.
  const precisionMasi = formatPeriode(masiHebdo?.debut, masiHebdo?.fin, "hebdo");

  // Un jeu par catégorie d'OPCVM ; « Actions » en premier.
  const categories = [...new Set(flux.map((l) => String(l.categorie)))].sort((a, b) =>
    a === "Actions" ? -1 : b === "Actions" ? 1 : a.localeCompare(b, "fr"),
  );
  const jeux: Jeu[] = categories.map((c) => ({
    id: c,
    libelle: c,
    series: [{ cle: "flux", libelle: `Flux net, fonds ${c}` }],
    donnees: fluxEtiquetes
      .filter((l) => l.categorie === c)
      .map((l) => ({ annee: l.annee, flux: enNombre(l.flux_net_md) })),
  }));

  // Le rapprochement flux / MASI se fait sur l'année d'origine (annee_brute), pas sur l'étiquette.
  const lignesTableau = fluxEtiquetes
    .filter((l) => l.categorie === "Actions")
    .map((l) => ({
      annee: l.annee,
      masi: masiAn?.find((m) => String(m.annee) === l.annee_brute)?.rendement_pct ?? null,
      flux: l.flux_net_md,
    }));
  const colonnes: Colonne[] = [
    { cle: "annee", libelle: "Année" },
    { cle: "masi", libelle: "MASI (chaque vendredi, hors dividendes)", type: "pourcentage", colore: true },
    { cle: "flux", libelle: "Flux net vers les fonds Actions", type: "milliards", colore: true },
  ];

  return (
    <MiseEnPageResultat
      carte={
        <CarteConstat
          teinte="fonce"
          icone={Users}
          theme="Comportement des épargnants"
          constat="Les épargnants courent après la performance."
          tuiles={[
            {
              etiquette: "Achats nets des fonds Actions ↔ MASI des 4 semaines précédentes",
              valeur: formatNombre(t.corr_passe, { signe: true }),
              interpretation: interpreterCorrelation(t.corr_passe),
            },
            {
              etiquette: "Achats nets des fonds Actions ↔ MASI des 4 semaines suivantes",
              valeur: formatNombre(t.corr_futur, { signe: true }),
              interpretation: interpreterCorrelation(t.corr_futur),
            },
          ]}
          precision={`Corrélations · ${LIBELLE_FREQUENCE.hebdo} · MASI hors dividendes`}
          conclusion="Ils achètent après la hausse, sans l'anticiper."
          details={`Corrélation entre le flux net hebdomadaire vers les fonds Actions (en % de leur actif net) et la performance du MASI. Pondéré par les flux, l'argent est entré quand le MASI valait en moyenne ${formatNombre(t.masi_moyen_achat, { decimales: 0 })} et en est ressorti à ${formatNombre(t.masi_moyen_vente, { decimales: 0 })} : acheter cher, vendre moins cher.`}
        />
      }
      graphiques={
        <CarteGraphique
          titre="L'argent est arrivé en masse après la hausse, et reparti quand le marché baissait"
          note="Flux net = souscriptions − rachats, en milliards de dirhams (Md MAD). Entre parenthèses, les mois couverts quand l'année est incomplète. Source : AMMC."
        >
          <GraphiqueBarres
            jeux={jeux}
            cleX="annee"
            format="milliards"
            colorerSigne
            decimalesInfo={1}
            labelChoix="Catégorie d'OPCVM"
            description="Flux net annuel vers les OPCVM, par catégorie, en milliards de dirhams"
          />
        </CarteGraphique>
      }
      tableau={
        <div>
          <TitreTableau>Flux vers les fonds Actions et performance du MASI, année par année</TitreTableau>
          <TableauTriable
            colonnes={colonnes}
            lignes={lignesTableau}
            legende="Rendement annuel du MASI et flux net vers les fonds Actions"
          />
          <p className="mt-2 text-xs text-texte-secondaire">
            MASI : {precisionMasi}. L&apos;année indiquée est celle des flux : la 1re année du MASI ne commence
            qu&apos;à la date ci-dessus.
          </p>
        </div>
      }
    />
  );
}

/* ---------- Résultat 2 : volatilité et drawdown ---------- */
function ongletVolatilite(
  annuel: Ligne[] | null,
  dd: Ligne[] | null,
  pire: Ligne[] | null,
  synthese: Ligne[] | null,
) {
  if (!annuel || !dd || !pire || pire.length === 0 || annuel.length === 0) return <Indisponible />;
  const derniere = annuel[annuel.length - 1];
  // Données quotidiennes : début et fin lus dans dw.v_indices_synthese (mêmes séances que dw.v_masi_drawdown).
  const masiQuotidien = synthese?.find((l) => l.indice === "MASI");
  const volatilite: Jeu = {
    id: "vol",
    libelle: "Volatilité",
    series: [{ cle: "vol", libelle: "Volatilité annualisée du MASI", couleur: COULEUR_MASI }],
    donnees: etiqueterAnnees(annuel).map((l) => ({ annee: l.annee, vol: enNombre(l.volatilite_annualisee_pct) })),
  };
  const baisse: Jeu = {
    id: "dd",
    libelle: "Baisse",
    series: [{ cle: "dd", libelle: "MASI : écart avec son plus haut", couleur: COULEUR_MASI }],
    donnees: dd.map((l) => ({ date: String(l.date), dd: enNombre(l.drawdown_pct) })),
  };
  return (
    <MiseEnPageResultat
      carte={
        <CarteConstat
          teinte="corail"
          icone={TrendingDown}
          theme="Risque"
          constat="Le risque a fortement augmenté."
          tuiles={[
            { etiquette: "Pire baisse du MASI depuis un plus haut", valeur: formatPourcentage(pire[0].drawdown_pct) },
            {
              etiquette: `Amplitude des variations du MASI en ${derniere.annee} (volatilité sur un an)`,
              valeur: formatPourcentage(derniere.volatilite_annualisee_pct, { signe: false }),
            },
          ]}
          precision={formatPeriode(masiQuotidien?.debut, masiQuotidien?.fin, "quotidien", { horsDividendes: false })}
          conclusion="Les creux du MASI se sont approfondis."
          details={`La pire baisse a été atteinte le ${formatDate(pire[0].date)}. Mesurées chaque séance, la baisse et la volatilité sont plus précises que les chiffres de l'accueil, relevés chaque vendredi.`}
        />
      }
      graphiques={
        <>
          <CarteGraphique
            titre="Le marché bouge de plus en plus d'une année à l'autre"
            note="Volatilité = amplitude des variations quotidiennes, ramenée à un an. Entre parenthèses, les mois couverts quand l'année est incomplète. Source : Bourse de Casablanca."
          >
            <GraphiqueBarres
              jeux={[volatilite]}
              cleX="annee"
              format="pourcentage"
              signeInfo={false}
              decimalesInfo={1}
              description="Volatilité annualisée du MASI, année par année"
            />
          </CarteGraphique>
          <CarteGraphique
            titre="Les creux du MASI se sont approfondis"
            note="Écart entre le MASI et son plus haut précédent. Source : Bourse de Casablanca."
          >
            <GraphiqueLignes
              jeux={[baisse]}
              format="pourcentage"
              ligneZero
              decimalesInfo={1}
              description="Écart du MASI avec son plus haut atteint, jour après jour"
            />
          </CarteGraphique>
        </>
      }
    />
  );
}

/* ---------- Résultat 3 : MASI vs MASI 20 ---------- */
function ongletIndices(quotidien: Ligne[] | null, synthese: Ligne[] | null) {
  if (!quotidien || !synthese || synthese.length === 0) return <Indisponible />;
  const couleurs: Record<string, string> = { MASI: COULEUR_MASI, "MASI 20": COULEUR_MASI20 };
  const jeu = (id: string, libelle: string, cle: string): Jeu => {
    const { donnees, series } = pivoter(quotidien, "date", "indice", cle);
    return {
      id,
      libelle,
      donnees,
      series: series.map((s) => ({ cle: s, libelle: s, couleur: couleurs[s] })),
    };
  };
  const masi = synthese.find((l) => l.indice === "MASI");
  const masi20 = synthese.find((l) => l.indice === "MASI 20");

  const colonnes: Colonne[] = [
    { cle: "indice", libelle: "Indice" },
    { cle: "debut", libelle: "Début", type: "date" },
    { cle: "fin", libelle: "Fin", type: "date" },
    { cle: "rendement_total_pct", libelle: "Rendement total", type: "pourcentage", colore: true },
    { cle: "volatilite_annualisee_pct", libelle: "Volatilité", type: "pourcentage", signe: false },
    { cle: "pire_drawdown_pct", libelle: "Pire baisse", type: "pourcentage", colore: true },
    { cle: "drawdown_actuel_pct", libelle: "Écart actuel avec le plus haut", type: "pourcentage", colore: true },
  ];

  return (
    <MiseEnPageResultat
      carte={
        <CarteConstat
          teinte="sarcelle"
          icone={Building2}
          theme="Grandes valeurs"
          constat="Les grandes valeurs font moins bien que le marché."
          tuiles={[
            { etiquette: "MASI 20 (les 20 plus grandes sociétés), rendement", valeur: formatPourcentage(masi20?.rendement_total_pct) },
            { etiquette: "MASI (tout le marché), rendement", valeur: formatPourcentage(masi?.rendement_total_pct) },
          ]}
          precision={`${formatPeriode(masi20?.debut, masi20?.fin, "quotidien", { horsDividendes: false })} · indices hors dividendes`}
          conclusion="Les 20 plus grandes valeurs ont moins rapporté, et plus baissé."
          details={`Pire baisse depuis un plus haut : ${formatPourcentage(masi20?.pire_drawdown_pct)} pour le MASI 20, contre ${formatPourcentage(masi?.pire_drawdown_pct)} pour le MASI.`}
        />
      }
      graphiques={
        <CarteGraphique
          titre="Le MASI 20 est resté derrière le MASI, et a plus baissé"
          note="Base 100 au premier jour. Les deux indices sont hors dividendes. Source : Bourse de Casablanca."
        >
          <GraphiqueLignes
            jeux={[jeu("base", "Performance (base 100)", "base_100"), jeu("baisse", "Baisse depuis le plus haut", "drawdown_pct")]}
            description="Évolution du MASI et du MASI 20, ou écart avec leur plus haut"
            labelChoix="Mesure"
            decimalesInfo={1}
          />
        </CarteGraphique>
      }
      tableau={
        <div>
          <TitreTableau>MASI et MASI 20 sur la même période</TitreTableau>
          <TableauTriable colonnes={colonnes} lignes={synthese} legende="Comparaison du MASI et du MASI 20" />
        </div>
      }
    />
  );
}

/* ---------- Résultat 4 : PER ---------- */
function ongletPer(valo: Ligne[] | null) {
  if (!valo || valo.length === 0) return <Indisponible />;
  const derniereDate = String(valo[valo.length - 1].date_article);
  const anneeCible = Number(derniereDate.slice(0, 4));
  const scope = valo.filter(
    (l) => l.perimetre === "Scope 40" && Number(l.annee) === anneeCible && l.per !== null,
  );
  const premier = scope[0];
  const dernier = scope[scope.length - 1];
  // Moyenne historique de la MÊME source et du même périmètre que le PER Scope 40 (BMCE Capital Global
  // Research) : on ne mélange plus Scope 40 et marché total sur le graphique (CORRECTIONS.md, Résultat 4).
  // La moyenne CFG (marché total) reste dans le tableau ci-dessous.
  const moyenne = valo.filter(
    (l) => String(l.perimetre).startsWith("moyenne historique") && l.source === dernier?.source && l.per !== null,
  );
  const moyenneRecente = moyenne[moyenne.length - 1];
  const libelleScope = `PER ${anneeCible} prévu (Scope 40)`;
  const { donnees } = pivoter(
    scope.map((l) => ({ date: l.date_article, serie: libelleScope, per: l.per })),
    "date",
    "serie",
    "per",
  );

  const colonnes: Colonne[] = [
    { cle: "date_article", libelle: "Publication", type: "date" },
    { cle: "perimetre", libelle: "Périmètre" },
    { cle: "annee", libelle: "Année" },
    { cle: "per", libelle: "PER", type: "multiple" },
    { cle: "rendement_dividende_pct", libelle: "Rendement du dividende", type: "pourcentage", signe: false },
    { cle: "nature", libelle: "Nature" },
    { cle: "source", libelle: "Source" },
  ];
  const lignes = valo.map((l) => ({
    ...l,
    annee: l.annee === null ? null : String(l.annee),
    nature: l.estimation ? "Estimation" : "Constaté",
  }));

  return (
    <MiseEnPageResultat
      carte={
        <CarteConstat
          teinte="ambre"
          icone={Tag}
          theme="Valorisation"
          constat="Le marché est devenu moins cher."
          tuiles={[
            {
              etiquette: `PER ${anneeCible} prévu (Scope 40), publié le ${formatDateCourte(dernier?.date_article)}`,
              valeur: formatMultiple(dernier?.per),
            },
            { etiquette: "Moyenne historique sur 10 ans", valeur: formatMultiple(moyenneRecente?.per) },
          ]}
          conclusion="On paie moins d'années de bénéfices qu'en moyenne."
          details={`PER = prix d'une action divisé par le bénéfice par action attendu : combien d'années de bénéfices on paie. Le PER prévu pour ${anneeCible} était de ${formatMultiple(premier?.per)} le ${formatDate(premier?.date_article)}.`}
        />
      }
      graphiques={
        <CarteGraphique
          titre="Le PER prévu recule et passe sous sa moyenne de long terme"
          note="PER = prix d'une action divisé par le bénéfice par action attendu : combien d'années de bénéfices on paie. Chaque point est la date de publication d'une étude ; en pointillé, la moyenne historique sur 10 ans de la même source et du même périmètre (Scope 40). Les chiffres d'autres sources sont dans le tableau."
        >
          <GraphiqueLignes
            jeux={[
              {
                id: "per",
                libelle: "PER",
                donnees,
                series: [{ cle: libelleScope, libelle: libelleScope, couleur: COULEUR_MASI20 }],
              },
            ]}
            format="multiple"
            filtrePeriode={false}
            decimalesAxe={1}
            decimalesInfo={1}
            description="PER prévu du Scope 40 selon la date de publication, avec sa moyenne historique sur 10 ans en pointillé"
            points
            reference={{
              valeur: moyenneRecente ? Number(moyenneRecente.per) : null,
              libelle: `Moyenne sur 10 ans : ${formatMultiple(moyenneRecente?.per)}`,
            }}
          />
        </CarteGraphique>
      }
      tableau={
        <div>
          <TitreTableau>Toutes les valorisations relevées</TitreTableau>
          <TableauTriable
            colonnes={colonnes}
            lignes={lignes}
            legende="PER et rendement du dividende relevés dans la presse financière"
            triInitial={{ cle: "date_article", sens: "desc" }}
            hauteurMax="26rem"
          />
        </div>
      }
    />
  );
}

export default async function PageOpcvmActions() {
  // Les lectures se font l'une après l'autre : la connexion à la base est unique (lib/db.ts).
  const flux = await fluxAnnuel();
  const masiAn = await rendementsMasiAnnuels();
  const timing = await kpiTiming();
  const annuel = await masiAnnuel();
  const dd = await drawdownMasi();
  const pire = await pireDrawdown();
  const quotidien = await indices();
  const synthese = await indicesSynthese();
  const valo = await valorisation();
  const masiHebdo = (await placements())?.find((l) => l.actif === "MASI");

  return (
    <>
      <ConclusionPage>
        Les épargnants ont investi dans les fonds Actions après la hausse du marché, juste avant que le risque
        augmente. Le marché est pourtant devenu moins cher.
      </ConclusionPage>
      <Onglets
        onglets={[
          { id: "flux", libelle: "Flux et MASI", contenu: ongletFlux(flux, masiAn, timing, masiHebdo) },
          { id: "volatilite", libelle: "Volatilité et baisses", contenu: ongletVolatilite(annuel, dd, pire, synthese) },
          { id: "indices", libelle: "MASI et MASI 20", contenu: ongletIndices(quotidien, synthese) },
          { id: "per", libelle: "PER", contenu: ongletPer(valo) },
        ]}
      />
    </>
  );
}
