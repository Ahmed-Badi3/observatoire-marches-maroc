import { Landmark, Percent, Rocket, Scale, TrendingUp, Wallet } from "lucide-react";

import { CarteKpi } from "@/components/observatoire/carte-kpi";
import { CarteModule } from "@/components/observatoire/carte-module";
import { CarteVedette } from "@/components/observatoire/carte-vedette";
import { NuageRendementRisque } from "@/components/observatoire/nuage-rendement-risque";
import { TableauTriable, type Colonne } from "@/components/observatoire/tableau-triable";
import { courbesMasi, placements, type Placement } from "@/lib/donnees";
import { formatNombre, formatPeriode, formatPourcentage } from "@/lib/format";

const colonnesPlacements: Colonne[] = [
  { cle: "actif", libelle: "Placement" },
  { cle: "rdt_cumule_pct", libelle: "Rendement cumulé", type: "pourcentage", colore: true },
  { cle: "rdt_annualise_pct", libelle: "Annualisé", type: "pourcentage", colore: true },
  { cle: "volatilite_pct", libelle: "Volatilité", type: "pourcentage", signe: false },
  { cle: "pire_baisse_pct", libelle: "Pire baisse", type: "pourcentage", colore: true },
  { cle: "ratio_rendement_risque", libelle: "Sharpe", type: "nombre" },
];

// OPCVM et marché actions partagent une page : les deux cartes mènent au bon onglet (ancres lues en E4).
const MODULES = [
  { href: "/opcvm-actions#flux", titre: "OPCVM", description: "Où vont les flux des épargnants, et quand.", icone: Wallet },
  { href: "/opcvm-actions#volatilite", titre: "Marché actions", description: "MASI, volatilité, baisses et valorisation.", icone: TrendingUp },
  { href: "/contexte-economique", titre: "Contexte économique", description: "Bourse, croissance, inflation et décisions de la banque centrale.", icone: Landmark },
  { href: "/taux-obligations", titre: "Taux et obligations", description: "Courbe des taux et fonds obligataires.", icone: Percent },
  { href: "/introductions-en-bourse", titre: "Introductions en bourse", description: "Les nouvelles cotations face au MASI.", icone: Rocket },
  { href: "/synthese", titre: "Synthèse quantitative", description: "Rendement, risque, portefeuilles types et corrélations.", icone: Scale },
];

// Les libellés ci-dessous sont des noms de lignes de la base (colonne `actif`), pas des chiffres.
const MASI = "MASI";
const EQUILIBRE = "Portefeuille équilibré";
const FONDS_ACTIONS = "Fonds Actions";

function trouver(lignes: Placement[] | null, actif: string): Placement | undefined {
  return lignes?.find((l) => l.actif === actif);
}

// « 2026-10-23 » -> « 2026 » : l'année vient de la date lue en base.
function annee(date: string | undefined): string {
  return date ? date.slice(0, 4) : "…";
}

export default async function PageAccueil() {
  // L'une après l'autre : la connexion à la base est unique (max: 1 dans lib/db.ts).
  const lignes = await placements();
  const courbes = await courbesMasi();
  const masi = trouver(lignes, MASI);
  const equilibre = trouver(lignes, EQUILIBRE);
  const actions = trouver(lignes, FONDS_ACTIONS);

  const periode = `${annee(masi?.debut)}–${annee(masi?.fin)}`;
  // Tous les chiffres de cette page viennent de la synthèse : MASI relevé chaque vendredi AMMC.
  const precisionMasi = formatPeriode(masi?.debut, masi?.fin, "hebdo");
  const precisionRisque = formatPeriode(masi?.debut, masi?.fin, "hebdo", { horsDividendes: false });

  return (
    <div className="space-y-8">
      {/* 1. Bandeau : la question et la phrase clé (PRD) */}
      <section className="rounded-carte bg-carte p-6 shadow-carte sm:p-8">
        <h2 className="text-2xl font-semibold leading-snug text-texte">
          Où fallait-il placer son argent au Maroc entre {annee(masi?.debut)} et {annee(masi?.fin)} ?
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-texte">
          Sur {periode}, les actions ont rapporté le plus (
          <strong className="font-semibold">{formatPourcentage(masi?.rdt_cumule_pct)}</strong> pour le
          MASI), mais tous les placements ont un rendement par unité de risque presque identique : il
          fallait choisir son niveau de risque, diversifier avec des fonds de taux, et ne pas acheter
          après la hausse.
        </p>
        <p className="mt-3 text-xs text-texte-secondaire">
          {masi
            ? `Période analysée : ${precisionMasi.charAt(0).toLowerCase()}${precisionMasi.slice(1)}. Les autres pages regardent parfois le MASI chaque séance ou chaque fin de mois : voir « Méthode et sources ».`
            : "Les données sont momentanément indisponibles."}
        </p>
      </section>

      {/* 2. Deux cartes vedettes */}
      <section aria-label="Chiffres clés" className="grid gap-6 md:grid-cols-2">
        <CarteVedette
          variante={1}
          libelle={`MASI, rendement cumulé sur ${periode}`}
          valeur={formatPourcentage(masi?.rdt_cumule_pct)}
          precision={precisionMasi}
          pastilles={[
            { libelle: FONDS_ACTIONS, valeur: formatPourcentage(actions?.rdt_cumule_pct) },
            { libelle: EQUILIBRE, valeur: formatPourcentage(equilibre?.rdt_cumule_pct) },
          ]}
          href="/synthese"
        />
        <CarteVedette
          variante={2}
          libelle={`${EQUILIBRE} : part du rendement du MASI, pour ${formatPourcentage(
            equilibre?.part_risque_masi_pct,
            { decimales: 0, signe: false },
          )} de son risque`}
          valeur={formatPourcentage(equilibre?.part_rdt_masi_pct, { decimales: 0, signe: false })}
          pastilles={[
            { libelle: "Rendement annualisé", valeur: formatPourcentage(equilibre?.rdt_annualise_pct) },
            {
              libelle: "Volatilité",
              valeur: formatPourcentage(equilibre?.volatilite_pct, { signe: false }),
            },
          ]}
          href="/synthese"
        />
      </section>

      {/* 3. Quatre cartes KPI du MASI */}
      <section aria-label="Indicateurs du MASI" className="space-y-3">
        <h2 className="text-base font-semibold">Le MASI en quatre chiffres</h2>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <CarteKpi
            libelle="Rendement annualisé"
            valeur={formatPourcentage(masi?.rdt_annualise_pct)}
            serie={courbes?.masi}
            precision={precisionMasi}
          />
          <CarteKpi
            libelle="Volatilité"
            valeur={formatPourcentage(masi?.volatilite_pct, { signe: false })}
            precision={precisionRisque}
          />
          <CarteKpi
            libelle="Pire baisse"
            valeur={formatPourcentage(masi?.pire_baisse_pct)}
            serie={courbes?.baisse}
            precision={precisionRisque}
          />
          <CarteKpi
            libelle="Rendement par unité de risque (Sharpe)"
            valeur={formatNombre(masi?.ratio_rendement_risque)}
            precision={precisionMasi}
          />
        </div>
        <p className="text-xs text-texte-secondaire">
          Le MASI ne compte pas les dividendes ; les fonds, eux, les encaissent. Mesurés chaque séance,
          la volatilité et la pire baisse sont un peu différentes (page « OPCVM et marché actions »).
          Source : AMMC, Bourse de Casablanca.
        </p>
      </section>

      {/* 4. Nuage rendement / risque */}
      <section aria-label="Rendement et risque" className="space-y-3">
        <h2 className="text-base font-semibold">
          Plus de rendement s&apos;est payé par plus de risque
        </h2>
        <div className="rounded-carte bg-carte p-4 shadow-carte sm:p-6">
          <NuageRendementRisque
            points={(lignes ?? []).map((l) => ({
              actif: l.actif,
              risque: l.volatilite_pct,
              rendement: l.rdt_annualise_pct,
              sharpe: l.ratio_rendement_risque,
            }))}
          />
        </div>
      </section>

      {/* 5. Tableau triable des placements */}
      <section aria-label="Tableau des placements" className="space-y-3">
        <h2 className="text-base font-semibold">Tous les placements côte à côte</h2>
        {lignes ? (
          <TableauTriable
            colonnes={colonnesPlacements}
            lignes={lignes.map((l) => ({
              ...l,
              // Le Monétaire a un Sharpe stocké à 0,00 (non significatif) : on affiche « — » (docs/DATA.md).
              ratio_rendement_risque:
                l.actif === "Monétaire" ? null : l.ratio_rendement_risque,
            }))}
            legende="Rendement, risque et rendement par unité de risque de chaque placement"
            triInitial={{ cle: "rdt_cumule_pct", sens: "desc" }}
          />
        ) : (
          <p className="rounded-carte bg-carte p-6 text-sm text-texte-secondaire shadow-carte">
            Données indisponibles.
          </p>
        )}
      </section>

      {/* 6. Les 6 modules */}
      <section aria-label="Les modules" className="space-y-3">
        <h2 className="text-base font-semibold">Explorer l&apos;analyse</h2>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {MODULES.map((m) => (
            <CarteModule key={m.titre} {...m} />
          ))}
        </div>
      </section>
    </div>
  );
}
