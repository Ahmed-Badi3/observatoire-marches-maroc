import Link from "next/link";
import { ArrowRight, Landmark, Percent, Rocket, Scale, TrendingUp, Wallet } from "lucide-react";

import { CarteKpi } from "@/components/observatoire/carte-kpi";
import { CarteModule } from "@/components/observatoire/carte-module";
import { CarteVedette } from "@/components/observatoire/carte-vedette";
import { NuageRendementRisque } from "@/components/observatoire/nuage-rendement-risque";
import { placements, type Placement } from "@/lib/donnees";
import { compositions, pireDrawdown, sharpeExtremes } from "@/lib/donnees-pages";
import { formatDateCourte, formatNombre, formatPeriode, formatPourcentage } from "@/lib/format";

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
  const pireQuotidien = (await pireDrawdown())?.[0];
  const sharpe = (await sharpeExtremes())?.[0];
  const compo = await compositions();
  const masi = trouver(lignes, MASI);
  const monetaire = trouver(lignes, "Monétaire");
  const oct = trouver(lignes, "OCT");
  const equilibre = trouver(lignes, EQUILIBRE);
  const actions = trouver(lignes, FONDS_ACTIONS);

  const periode = `${annee(masi?.debut)}–${annee(masi?.fin)}`;
  // Tous les chiffres de cette page viennent de la synthèse : MASI relevé chaque vendredi AMMC.
  const precisionMasi = formatPeriode(masi?.debut, masi?.fin, "hebdo");
  const precisionRisque = formatPeriode(masi?.debut, masi?.fin, "hebdo", { horsDividendes: false });
  const tauxSansRisque = `${formatPourcentage(monetaire?.rdt_annualise_pct, { signe: false })} par an`;
  // « prudent 50/40/10 » : poids lus dans analytics.compositions_portefeuilles (Monétaire / OMLT / fonds Actions).
  const PLACEMENTS = ["Monétaire", "OMLT", FONDS_ACTIONS];
  const descriptionPortefeuilles = ["Portefeuille prudent", EQUILIBRE, "Portefeuille dynamique"]
    .map((p) => {
      const poids = PLACEMENTS.map((pl) =>
        formatNombre(compo?.find((c) => c.portefeuille === p && c.placement === pl)?.poids_pct, { decimales: 0 }),
      );
      return `${p.replace("Portefeuille ", "")} ${poids.join("/")}`;
    })
    .join(", ");

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
          MASI), mais, hors fonds obligataires court terme, tous les placements ont un rendement par
          unité de risque presque identique : il fallait choisir son niveau de risque, diversifier avec
          des fonds de taux, et ne pas acheter après la hausse.
        </p>
        <ol className="mt-4 grid gap-2 sm:grid-cols-3">
          {[
            ["Choisir son niveau de risque", "plus de rendement s'est toujours payé par plus de risque"],
            ["Ne pas acheter après la hausse", "les épargnants l'ont fait, en fonds Actions comme en IPO"],
            ["Surveiller les taux", "leur remontée a fait perdre les fonds obligataires longs"],
          ].map(([regle, pourquoi], i) => (
            <li key={regle} className="rounded-[12px] bg-page p-3 text-sm">
              <span className="font-semibold text-accent-fonce">
                {i + 1}. {regle}
              </span>
              <span className="block text-xs text-texte-secondaire">{pourquoi}</span>
            </li>
          ))}
        </ol>
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
          jauge={{ part: equilibre?.part_rdt_masi_pct, total: 100 }}
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
            precision={`${precisionRisque}. Mesurée chaque séance : ${formatPourcentage(pireQuotidien?.drawdown_pct)} (${formatDateCourte(pireQuotidien?.date)})`}
          />
          <CarteKpi
            libelle="Rendement par unité de risque (Sharpe)"
            valeur={formatNombre(masi?.ratio_rendement_risque)}
            precision={`Taux sans risque : fonds monétaires, ${tauxSansRisque} · ${precisionMasi}`}
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
        <p className="text-sm text-texte-secondaire">
          Les placements sont presque alignés : aucun n&apos;a offert plus de rendement sans prendre plus de risque.
        </p>
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

      {/* 5. Le tableau détaillé est sur la page Synthèse (pas de doublon) ; ici, un lien et les notes. */}
      <section aria-label="Tous les placements" className="space-y-3">
        <Link
          href="/synthese"
          className="flex items-center justify-between gap-3 rounded-carte bg-carte p-5 shadow-carte transition-colors hover:bg-page"
        >
          <span>
            <span className="block text-base font-semibold text-texte">Tous les placements côte à côte</span>
            <span className="text-sm text-texte-secondaire">
              Rendement, risque, pire baisse et Sharpe des {lignes?.length ?? "—"} placements et portefeuilles types,
              dans la Synthèse quantitative.
            </span>
          </span>
          <ArrowRight className="size-5 shrink-0 text-accent-fonce" aria-hidden="true" />
        </Link>
        <div className="space-y-1.5 text-xs leading-relaxed text-texte-secondaire">
          <p>
            Sharpe = (rendement annualisé − celui des fonds monétaires, {tauxSansRisque}) ÷ volatilité. Les
            fonds monétaires servent de taux sans risque : leur Sharpe vaut 0 par construction. Hors fonds obligataires court terme,
            les écarts de Sharpe ({formatNombre(sharpe?.minimum)} à {formatNombre(sharpe?.maximum)}) sont trop
            faibles pour départager les placements sur une période aussi courte ({precisionRisque.charAt(0).toLowerCase()}
            {precisionRisque.slice(1)}). Les fonds CT ({formatNombre(oct?.ratio_rendement_risque)}) se distinguent
            surtout par un risque très faible.
          </p>
          <p>
            Portefeuilles types, rééquilibrés chaque semaine (Monétaire / OMLT / fonds Actions, en %) :{" "}
            {descriptionPortefeuilles}.
          </p>
          <p>
            Le MASI est un indice (hors dividendes, sans frais) : on ne peut pas l&apos;acheter directement. Les fonds
            Actions, eux, encaissent les dividendes mais paient des frais.
          </p>
        </div>
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
