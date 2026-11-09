import type { Metadata } from "next";
import { ArrowDown, ArrowRight, ExternalLink } from "lucide-react";

import { CarteGraphique, Indisponible } from "@/components/observatoire/carte-graphique";
import { TableauTriable, type Colonne } from "@/components/observatoire/tableau-triable";
import { placements } from "@/lib/donnees";
import { fraicheur, indicesSynthese, rendementReel, type Ligne } from "@/lib/donnees-pages";
import { LIBELLE_FREQUENCE, formatPeriode, formatPourcentage, type Frequence, type Valeur } from "@/lib/format";
import { URL_GITHUB } from "@/lib/pages";

export const metadata: Metadata = { title: "Méthode et sources" };

// Page de texte : l'architecture, la qualité des données, les limites, les sources.
// Aucun chiffre n'est écrit ici : les dates et les rendements affichés viennent de la base
// (tableau de fraîcheur, tableau « Pourquoi le MASI a plusieurs chiffres »).

const ETAPES = [
  { titre: "Sources publiques", texte: "AMMC, Bourse de Casablanca, Bank Al-Maghrib, HCP, presse financière." },
  { titre: "Python", texte: "Collecte, nettoyage et contrôles qualité des fichiers." },
  { titre: "PostgreSQL (Supabase)", texte: "Les données publiées, rangées telles quelles, puis des vues en étoile." },
  { titre: "dbt", texte: "Les calculs (rendements, risque, corrélations), versionnés et testés à chaque construction." },
  { titre: "Ce site", texte: "Il lit les résultats en lecture seule et ne calcule rien." },
];

const OUTILS = [
  ["Collecte et nettoyage", "Python : requests, BeautifulSoup, pandas"],
  ["Stockage", "PostgreSQL sur Supabase : schémas staging, dw et analytics"],
  ["Transformation", "dbt : modèles SQL, tests automatiques, documentation"],
  ["Analyse", "SQL : fonctions de fenêtre, interpolation, régression, corrélations"],
  ["Mise à jour", "GitHub Actions chaque semaine pour l'AMMC ; procédure manuelle pour le reste"],
  ["Site", "Next.js, Tailwind CSS, Recharts, déployé sur Vercel"],
  ["Extraction des PER", "n8n et un modèle de langage, avec validation en code avant toute écriture en base (hors site)"],
];

const QUALITE = [
  {
    probleme: "Noms de fichiers AMMC incohérents, formats Excel mélangés",
    solution: "Liens lus sur chaque page, date lue dans le titre ou le nom du fichier.",
  },
  {
    probleme: "Une semaine mal saisie à la source (colonne en double)",
    solution: "Lecture de secours validée par le contrôle « somme des catégories = total ».",
  },
  {
    probleme: "Nombres à la française (16 537,91) et tirets à la place de montants",
    solution: "Conversion dédiée ; variation recalculée comparée à la variation publiée.",
  },
  {
    probleme: "Variations « mensuelles » et « annuelles » de l'AMMC : ce sont des cumuls depuis le début de la période",
    solution: "Rendements recalculés dans dbt à partir des indices.",
  },
  {
    probleme: "Courbe des taux de Bank Al-Maghrib : changement de méthode en mars 2023",
    solution: "Les analyses de sensibilité sont aussi faites depuis le changement de méthode.",
  },
  {
    probleme: "Courbe des taux : échéances différentes chaque jour",
    solution: "Interpolation linéaire à des maturités fixes dans dbt.",
  },
  {
    probleme: "Plusieurs chiffres légitimes pour une même mesure du MASI (chaque séance, chaque vendredi, fin de mois)",
    solution: "Sous chaque chiffre du MASI, le site indique sa fréquence et sa période (voir « Pourquoi le MASI a plusieurs chiffres »).",
  },
];

const LIMITES = [
  "Corrélation n'est pas causalité, et les fenêtres de quatre semaines qui se chevauchent surestiment la significativité.",
  "Le MASI sert d'approximation de la valeur des fonds Actions : les dividendes n'y sont pas comptés.",
  "L'historique gratuit du MASI est court, et la période étudiée contient deux années de forte hausse.",
  "Les PER et rendements du dividende sont des prévisions de sociétés de bourse, aux périmètres et méthodes différents.",
  "Peu de décisions de Bank Al-Maghrib dans la période : les conclusions sont fragiles.",
  "Le taux à 13 semaines dépend aussi des besoins de financement du Trésor, pas seulement des anticipations de taux.",
  "Peu d'introductions en bourse, saisies depuis la presse : aucun classement fiable.",
  "Les portefeuilles types sont des constructions théoriques à partir des indices de catégorie de l'AMMC ; ni frais d'entrée ni impôts.",
  "Le site décrit le passé : il ne prédit rien et ne constitue pas un conseil en investissement.",
];

const SOURCES = [
  { nom: "AMMC", url: "https://www.ammc.ma", detail: "statistiques hebdomadaires des OPCVM" },
  { nom: "Bourse de Casablanca", url: "https://www.casablanca-bourse.com", detail: "MASI, MASI 20, cours des IPO" },
  { nom: "Bank Al-Maghrib", url: "https://www.bkam.ma", detail: "taux directeur, courbe des taux" },
  { nom: "HCP", url: "https://www.hcp.ma", detail: "inflation, PIB, chômage" },
  { nom: "Boursenews", url: "https://boursenews.ma", detail: "études BMCE Capital Global Research et CFG Bank (PER, dividendes)" },
];

// Les quatre façons de regarder le MASI sur le site. Le texte explique POURQUOI ; la période et le
// rendement sont lus dans la base (null = pas de rendement total pour cette mesure).
type MesureMasi = {
  frequence: Frequence;
  pages: string;
  raison: string;
  debut: Valeur;
  fin: Valeur;
  rendement: Valeur;
};

function mesuresMasi(
  hebdo: { debut: string; fin: string; rdt_cumule_pct: string | null } | undefined,
  quotidien: Ligne | undefined,
  mensuel: Ligne[] | null,
): MesureMasi[] {
  const premierMois = mensuel?.[0];
  const dernierMois = mensuel?.[mensuel.length - 1];
  return [
    {
      frequence: "hebdo",
      pages: "Accueil, Synthèse, onglet Flux",
      raison: "L'AMMC ne publie la valeur des fonds qu'une fois par semaine : pour comparer le MASI aux fonds, on les regarde le même jour.",
      debut: hebdo?.debut,
      fin: hebdo?.fin,
      rendement: hebdo?.rdt_cumule_pct,
    },
    {
      frequence: "quotidien",
      pages: "OPCVM et marché actions (volatilité, baisses, MASI 20), décisions de Bank Al-Maghrib",
      raison: "Regarder chaque séance voit le vrai fond d'une chute, qu'un relevé du vendredi peut manquer : la pire baisse y est plus forte.",
      debut: quotidien?.debut,
      fin: quotidien?.fin,
      rendement: quotidien?.rendement_total_pct,
    },
    {
      frequence: "mensuel",
      pages: "Contexte économique (nominal et réel)",
      raison: "L'inflation du HCP est mensuelle : le calcul s'arrête au dernier mois d'inflation publié.",
      debut: premierMois?.date,
      fin: dernierMois?.date,
      rendement: dernierMois?.nominal_pct,
    },
    {
      frequence: "trimestriel",
      pages: "Contexte économique (MASI et PIB)",
      raison: "Le PIB est trimestriel : on compare la variation du MASI sur un an à celle du PIB, trimestre par trimestre.",
      debut: null,
      fin: null,
      rendement: null,
    },
  ];
}

const colonnesFraicheur: Colonne[] = [
  { cle: "source", libelle: "Source" },
  { cle: "jusqu_au", libelle: "Données jusqu'au", type: "date" },
];

export default async function PageMethode() {
  // L'une après l'autre : la connexion à la base est unique (lib/db.ts).
  const dates = await fraicheur();
  const masiHebdo = (await placements())?.find((l) => l.actif === "MASI");
  const masiQuotidien = (await indicesSynthese())?.find((l) => l.indice === "MASI");
  const masiMensuel = await rendementReel();
  const mesures = mesuresMasi(masiHebdo, masiQuotidien, masiMensuel);

  return (
    <div className="space-y-8">
      <p className="max-w-3xl text-base leading-relaxed text-texte">
        Ce site est une vitrine : il affiche des résultats déjà calculés et testés dans la base de données.
        Voici d&apos;où viennent les chiffres, comment ils sont contrôlés, et ce qu&apos;ils ne disent pas.
      </p>

      <CarteGraphique titre="Du fichier public au graphique : l'architecture">
        <ol className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-stretch">
          {ETAPES.map((e, i) => (
            <li key={e.titre} className="flex flex-1 flex-col items-center gap-3 lg:flex-row">
              <div className="w-full flex-1 self-stretch rounded-[10px] bg-page p-4">
                <p className="text-sm font-semibold text-accent-fonce">{e.titre}</p>
                <p className="mt-1 text-xs leading-relaxed text-texte-secondaire">{e.texte}</p>
              </div>
              {i < ETAPES.length - 1 && (
                <>
                  <ArrowDown className="size-4 shrink-0 text-texte-secondaire lg:hidden" aria-hidden="true" />
                  <ArrowRight className="hidden size-4 shrink-0 text-texte-secondaire lg:block" aria-hidden="true" />
                </>
              )}
            </li>
          ))}
        </ol>
        <dl className="mt-6 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          {OUTILS.map(([couche, outils]) => (
            <div key={couche}>
              <dt className="font-semibold text-texte">{couche}</dt>
              <dd className="text-texte-secondaire">{outils}</dd>
            </div>
          ))}
        </dl>
      </CarteGraphique>

      <CarteGraphique titre="Un site sans calcul : la règle qui protège les chiffres">
        <p className="max-w-3xl text-sm leading-relaxed text-texte-secondaire">
          Tous les calculs se font dans la base (SQL et dbt), où ils sont testés à chaque construction. Le site lit
          seulement les schémas de résultats, avec un compte en lecture seule : même en cas d&apos;erreur, il ne peut
          rien modifier. Aucun chiffre n&apos;est écrit à la main dans les pages, y compris dans les phrases.
        </p>
      </CarteGraphique>

      <CarteGraphique titre="Pourquoi le MASI a plusieurs chiffres">
        <p className="max-w-3xl text-sm leading-relaxed text-texte-secondaire">
          Un même indice donne des rendements différents selon le jour où l&apos;on commence, le jour où l&apos;on
          s&apos;arrête et la fréquence à laquelle on le regarde. Le site utilise quatre mesures, chacune choisie
          pour être comparée à autre chose (les fonds, l&apos;inflation, le PIB). Aucune n&apos;est fausse : sous
          chaque chiffre du MASI, le site indique celle qu&apos;il utilise. Dans tous les cas, le MASI est{" "}
          <strong className="font-semibold text-texte">hors dividendes</strong> : il ne compte que la variation des
          cours, alors que les fonds Actions encaissent les dividendes.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <caption className="sr-only">Les quatre mesures du MASI utilisées sur le site</caption>
            <thead>
              <tr className="text-left text-texte-secondaire">
                <th scope="col" className="border-b border-separateur py-2 pr-4 font-semibold">Fréquence et période</th>
                <th scope="col" className="border-b border-separateur py-2 pr-4 font-semibold">Rendement du MASI</th>
                <th scope="col" className="border-b border-separateur py-2 pr-4 font-semibold">Pages</th>
                <th scope="col" className="border-b border-separateur py-2 font-semibold">Pourquoi cette mesure</th>
              </tr>
            </thead>
            <tbody>
              {mesures.map((m) => (
                <tr key={m.frequence} className="align-top even:bg-page/50">
                  <td className="py-2.5 pr-4">
                    {m.debut
                      ? formatPeriode(m.debut, m.fin, m.frequence, { horsDividendes: false })
                      : `${LIBELLE_FREQUENCE[m.frequence]}, variation sur un an`}
                  </td>
                  <td className="py-2.5 pr-4 font-semibold tabular-nums">
                    {m.rendement === null ? "—" : formatPourcentage(m.rendement)}
                  </td>
                  <td className="py-2.5 pr-4 text-texte-secondaire">{m.pages}</td>
                  <td className="py-2.5 text-texte-secondaire">{m.raison}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CarteGraphique>

      <CarteGraphique titre="Qualité des données : les pièges résolus">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <caption className="sr-only">Problèmes de données rencontrés et solutions</caption>
            <thead>
              <tr className="text-left text-texte-secondaire">
                <th scope="col" className="border-b border-separateur py-2 pr-4 font-semibold">Problème</th>
                <th scope="col" className="border-b border-separateur py-2 font-semibold">Solution</th>
              </tr>
            </thead>
            <tbody>
              {QUALITE.map((q) => (
                <tr key={q.probleme} className="align-top even:bg-page/50">
                  <td className="py-2.5 pr-4">{q.probleme}</td>
                  <td className="py-2.5 text-texte-secondaire">{q.solution}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CarteGraphique>

      <CarteGraphique titre="Fraîcheur des données">
        {dates ? (
          <TableauTriable
            colonnes={colonnesFraicheur}
            lignes={dates}
            legende="Date de la dernière donnée disponible pour chaque source"
          />
        ) : (
          <Indisponible />
        )}
        <p className="mt-3 text-xs text-texte-secondaire">
          Les statistiques de l&apos;AMMC se mettent à jour chaque semaine automatiquement ; la courbe des taux, le MASI,
          les introductions en bourse, les données du HCP et les PER se mettent à jour à la main, d&apos;où ces écarts de dates.
        </p>
      </CarteGraphique>

      <CarteGraphique titre="Limites : ce que les chiffres ne disent pas">
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-texte">
          {LIMITES.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </CarteGraphique>

      <CarteGraphique titre="Sources et code">
        <ul className="space-y-2 text-sm">
          {SOURCES.map((s) => (
            <li key={s.nom}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-accent-fonce hover:underline"
              >
                {s.nom} <ExternalLink className="size-3" aria-hidden="true" />
              </a>{" "}
              <span className="text-texte-secondaire">: {s.detail}</span>
            </li>
          ))}
          <li className="pt-2">
            <a
              href={URL_GITHUB}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-accent-fonce hover:underline"
            >
              Code, requêtes SQL et modèles dbt sur GitHub <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          </li>
        </ul>
      </CarteGraphique>
    </div>
  );
}
