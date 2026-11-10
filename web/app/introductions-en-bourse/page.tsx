import type { Metadata } from "next";
import { CalendarClock, Rocket, ShoppingCart, Trophy } from "lucide-react";

import { BandeauKpi, type Kpi } from "@/components/observatoire/bandeau-kpi";
import { CarteConstat } from "@/components/observatoire/carte-constat";
import { CarteGraphique, ConclusionPage, Indisponible, TitreTableau } from "@/components/observatoire/carte-graphique";
import { GraphiqueBarres } from "@/components/observatoire/graphique-barres";
import { GraphiqueLignes } from "@/components/observatoire/graphique-lignes";
import { TableauTriable, type Colonne } from "@/components/observatoire/tableau-triable";
import { ipo, ipoResume, trajectoiresIpo } from "@/lib/donnees-pages";
import {
  formatDate,
  formatDateCourte,
  formatMoisAnnee,
  formatMultiple,
  formatNombre,
  formatPoints,
  formatPourcentage,
} from "@/lib/format";
import { numeriser, pivoter, type Jeu } from "@/lib/graphiques";

export const metadata: Metadata = { title: "Introductions en bourse" };

// Page restructurée (CORRECTIONS.md, « Structure de la page IPO ») : les onglets répétaient le même tableau
// et les mêmes chiffres. Maintenant : 3 cartes côte à côte, la trajectoire de chaque IPO après son
// introduction (un seul graphique au lieu de deux onglets), l'écart avec le MASI, l'achat après un mois
// comparé au MASI, puis le tableau une seule fois. Tous les chiffres viennent d'analytics.ipo_performance
// et analytics.ipo_trajectoires ; les seules opérations ici sont des tris, des filtres et des comptages.

const colonnes: Colonne[] = [
  { cle: "societe", libelle: "Société" },
  { cle: "date_premiere_cotation", libelle: "1re cotation", type: "date" },
  { cle: "sursouscription", libelle: "Sursouscription", type: "multiple" },
  { cle: "rdt_j5_pct", libelle: "5 séances", type: "pourcentage", colore: true },
  { cle: "rdt_1m_pct", libelle: "1 mois", type: "pourcentage", colore: true },
  { cle: "rdt_depuis_ipo_pct", libelle: "Depuis l'IPO", type: "pourcentage", colore: true },
  { cle: "anormal_depuis_ipo_pts", libelle: "Écart avec le MASI depuis l'IPO", type: "points", colore: true },
  {
    cle: "rdt_achat_j20_pct",
    libelle: "Acheté en bourse après 1 mois et gardé jusqu'à aujourd'hui",
    type: "pourcentage",
    colore: true,
  },
  { cle: "masi_depuis_j20_pct", libelle: "MASI sur la même période", type: "pourcentage", colore: true },
  { cle: "duree_detention_jours", libelle: "Durée de détention (jours)", type: "nombre", decimales: 0 },
];

// « +61,0 % » : on compare les valeurs telles qu'elles s'affichent (une décimale).
const affiche = (v: unknown) => formatPourcentage(v as string);

export default async function PageIntroductionsEnBourse() {
  const lignes = await ipo();
  const resumes = await ipoResume();
  const trajectoires = await trajectoiresIpo();

  if (!lignes || lignes.length === 0 || !resumes || resumes.length === 0) {
    return <Indisponible />;
  }
  const resume = resumes[0];
  const nb = formatNombre(resume.nb, { decimales: 0 });
  const derniere = lignes[lignes.length - 1]; // lignes triées par date de 1re cotation
  const premiere = lignes[0];
  const dateCours = lignes.map((l) => String(l.date_dernier_cours)).sort().at(-1);

  // Résultat 12 : la sursouscription réduit le gain réel du souscripteur.
  const sursouscriptions = lignes.map((l) => Number(l.sursouscription)).filter(Number.isFinite);
  const avecGain = lignes
    .filter((l) => l.gain_pour_100_dh_demandes !== null)
    .sort((a, b) => Number(b.gain_pour_100_dh_demandes) - Number(a.gain_pour_100_dh_demandes))[0];

  // Résultat 13 : IPO arrivées au meilleur gain en 5 séances (plafond quotidien 5 jours de suite),
  // et IPO dont la hausse s'arrête dès la 1re semaine (5 séances au-dessus d'un mois).
  const auPlafond = lignes.filter((l) => affiche(l.rdt_j5_pct) === affiche(resume.j5_max)).map((l) => l.societe);
  const hausseCourte = lignes
    .filter((l) => Number(l.rdt_j5_pct) > Number(l.rdt_1m_pct))
    .map((l) => l.societe);

  // Résultat 14 : achat à la 20e séance, comparé au MASI sur la même période.
  const battentMasiApresUnMois = lignes.filter((l) => Number(l.anormal_achat_j20_pts) > 0).length;
  const meilleurAchat = [...lignes].sort((a, b) => Number(b.rdt_achat_j20_pct) - Number(a.rdt_achat_j20_pct))[0];
  const durees = lignes.map((l) => Number(l.duree_detention_jours)).filter(Number.isFinite);

  // Bandeau de KPI.
  const kpis: Kpi[] = [
    {
      icone: Rocket,
      valeur: nb,
      libelle: "Introductions en bourse étudiées",
      pastille: derniere ? `Dernière : ${derniere.societe}, ${formatDateCourte(derniere.date_premiere_cotation)}` : null,
    },
    {
      icone: Trophy,
      valeur: `${formatNombre(resume.nb_battent, { decimales: 0 })} sur ${nb}`,
      libelle: "IPO qui battent le MASI depuis leur introduction",
      pastille: `Jusqu'à ${formatPoints(resume.ecart_max)}`,
      valeurPastille: resume.ecart_max,
    },
    {
      icone: CalendarClock,
      valeur: formatPourcentage(resume.j5_max),
      libelle: `Meilleur gain en 5 séances (${auPlafond.length} IPO sur ${nb})`,
      pastille: `1er jour : ${formatPourcentage(resume.j1_min)} à ${formatPourcentage(resume.j1_max)}`,
    },
    {
      icone: ShoppingCart,
      valeur: formatPourcentage(resume.j20_min),
      libelle: `Pire achat à la 20e séance : ${resume.j20_pire}`,
      pastille: `${formatNombre(resume.nb_gagnent_j20, { decimales: 0 })} sur ${nb} gagnantes`,
    },
  ];

  // Graphiques.
  const ecartMasi: Jeu = {
    id: "perf",
    libelle: "Écart",
    series: [{ cle: "ecart", libelle: "Écart avec le MASI depuis l'IPO (points)" }],
    donnees: numeriser(
      lignes.map((l) => ({ societe: l.societe, ecart: l.anormal_depuis_ipo_pts })),
      ["ecart"],
    ),
  };
  const achatVsMasi: Jeu = {
    id: "achat",
    libelle: "Achat",
    series: [
      { cle: "achat", libelle: "Action achetée à la 20e séance", couleur: "var(--serie-2)" },
      { cle: "masi", libelle: "MASI sur la même période", couleur: "var(--serie-6)" },
    ],
    donnees: numeriser(
      lignes.map((l) => ({ societe: l.societe, achat: l.rdt_achat_j20_pct, masi: l.masi_depuis_j20_pct })),
      ["achat", "masi"],
    ),
  };
  const couleursIpo = ["var(--serie-1)", "var(--serie-2)", "var(--serie-3)", "var(--serie-4)", "var(--serie-5)", "var(--serie-6)", "var(--serie-7)"];
  let trajectoire: Jeu | null = null;
  if (trajectoires && trajectoires.length > 0) {
    const p = pivoter(trajectoires, "n_seance", "societe", "base_100");
    trajectoire = {
      id: "trajectoire",
      libelle: "Base 100",
      donnees: p.donnees,
      series: p.series.map((s, i) => ({ cle: s, libelle: s, couleur: couleursIpo[i % couleursIpo.length] })),
    };
  }

  return (
    <>
      <BandeauKpi titre="Chiffres clés de la page" kpis={kpis} />
      <ConclusionPage>
        Les nouvelles cotations ont surtout profité à ceux qui ont souscrit à l&apos;IPO : acheter le titre en
        bourse un mois plus tard a presque toujours fait perdre de l&apos;argent, et toujours moins bien que le marché.
      </ConclusionPage>

      <section aria-label="Résultats" className="grid items-start gap-6 lg:grid-cols-3">
        <CarteConstat
          teinte="fonce"
          icone={Rocket}
          theme="Face au MASI"
          constat="Les IPO récentes battent le MASI, pour ceux qui les ont souscrites."
          tuiles={[
            {
              etiquette: "IPO qui font mieux que le MASI depuis leur introduction",
              valeur: `${formatNombre(resume.nb_battent, { decimales: 0 })} sur ${nb}`,
              jauge: { part: resume.nb_battent, total: resume.nb },
            },
            {
              etiquette: "Avance sur le MASI, de la plus petite à la plus grande",
              valeur: `${formatPoints(resume.ecart_min)} à ${formatPoints(resume.ecart_max)}`,
            },
          ]}
          conclusion={
            avecGain
              ? `Mais avec ${formatMultiple(Math.min(...sursouscriptions))} à ${formatMultiple(Math.max(...sursouscriptions))} de sursouscription, chaque souscripteur n'a reçu qu'une petite part des actions demandées : le gain réel reste très faible, ≈ ${formatNombre(avecGain.gain_pour_100_dh_demandes, { signe: true })} DH pour 100 DH demandés sur ${avecGain.societe}.`
              : "Souscrire au prix d'introduction a été payant."
          }
          details={`Une IPO est une première vente d'actions au public. L'écart compare le rendement de l'action depuis son prix d'introduction à celui du MASI sur la même période ; cette période est différente pour chaque IPO (de sa 1re cotation au dernier cours). Les deux rendements sont hors dividendes. ${nb} IPO, cotées entre ${formatMoisAnnee(premiere.date_premiere_cotation)} et ${formatMoisAnnee(derniere.date_premiere_cotation)} : résultat indicatif. Gain réel pour 100 DH demandés = rendement × part servie ; la part servie n'est connue que pour quelques IPO.`}
        />
        <CarteConstat
          teinte="corail"
          icone={CalendarClock}
          theme="Premiers jours"
          constat="Le premier jour est limité ; la hausse s'étale sur plusieurs séances."
          tuiles={[
            {
              etiquette: "Hausse le premier jour",
              valeur: `${formatPourcentage(resume.j1_min)} à ${formatPourcentage(resume.j1_max)}`,
            },
            {
              etiquette: `En 5 séances, pour ${auPlafond.length} IPO sur ${nb} (${auPlafond.join(", ")})`,
              valeur: formatPourcentage(resume.j5_max),
            },
          ]}
          conclusion={`${auPlafond.length} IPO ont atteint le plafond de variation quotidienne 5 séances de suite : la demande dépassait l'offre et le prix ne pouvait pas monter plus vite.`}
          details={`La Bourse de Casablanca limite la variation d'un cours sur une séance : 5 hausses de 10 % d'affilée font +61 % (1,1 × 1,1 × 1,1 × 1,1 × 1,1 ≈ 1,61).${
            hausseCourte.length > 0
              ? ` Pour ${hausseCourte.join(" et ")}, la hausse s'arrête dès la première semaine : le cours après 5 séances est au-dessus de celui après un mois.`
              : ""
          }`}
        />
        <CarteConstat
          teinte="sarcelle"
          icone={ShoppingCart}
          theme="Achat après un mois"
          constat="Racheter une IPO en bourse après le premier mois fait perdre."
          tuiles={[
            {
              etiquette: "IPO gagnantes si achetées à la 20e séance",
              valeur: `${formatNombre(resume.nb_gagnent_j20, { decimales: 0 })} sur ${nb}`,
              jauge: { part: resume.nb_gagnent_j20, total: resume.nb },
            },
            {
              etiquette: "Ces achats qui font mieux que le MASI sur la même période",
              valeur: `${battentMasiApresUnMois} sur ${nb}`,
              jauge: { part: battentMasiApresUnMois, total: resume.nb },
            },
          ]}
          conclusion="Acheter après le premier mois, c'est acheter après la hausse : même en tenant compte de la baisse du marché, ces achats font moins bien que le MASI."
          details={`Achat au cours de la 20e séance, gardé jusqu'au dernier cours (${formatDate(dateCours)}). Les durées de détention vont de ${Math.min(...durees)} à ${Math.max(...durees)} jours : les résultats ne se comparent pas directement d'une IPO à l'autre.${
            meilleurAchat && Number(meilleurAchat.rdt_achat_j20_pct) > 0
              ? ` L'exception, ${meilleurAchat.societe} (${formatPourcentage(meilleurAchat.rdt_achat_j20_pct)}), a été achetée le ${formatDate(meilleurAchat.date_achat_j20)}, au début de la hausse du marché, et gardée ${formatNombre(meilleurAchat.duree_detention_jours, { decimales: 0 })} jours ; sur la même période, le MASI a fait ${formatPourcentage(meilleurAchat.masi_depuis_j20_pct)}.`
              : ""
          }`}
        />
      </section>

      <div className="mt-6 space-y-6">
        {trajectoire && (
          <CarteGraphique
            titre="Trajectoire après l'introduction"
            note="Cours de chaque action en base 100 au prix d'introduction, séance par séance (0 = prix d'IPO). Le trait vertical marque la 20e séance (≈ 1 mois) : acheter à ce moment-là, c'est souvent acheter près du sommet. Source : Bourse de Casablanca."
          >
            <GraphiqueLignes
              jeux={[trajectoire]}
              typeX="texte"
              cleX="n_seance"
              format="nombre"
              decimalesInfo={1}
              filtrePeriode={false}
              hauteur={360}
              repereX={{ valeur: "20", libelle: "20e séance" }}
              description="Cours de chaque introduction en bourse, en base 100 au prix d'IPO, de la séance 0 à 120"
            />
          </CarteGraphique>
        )}
        <div className="grid gap-6 lg:grid-cols-2">
          <CarteGraphique
            titre="Presque toutes les IPO ont fait mieux que le marché depuis leur introduction"
            note="Écart entre le rendement de l'action depuis son prix d'IPO et celui du MASI sur la même période, en points de pourcentage. Source : Bourse de Casablanca."
          >
            <GraphiqueBarres
              jeux={[ecartMasi]}
              cleX="societe"
              format="points"
              colorerSigne
              decimalesInfo={1}
              description="Écart de rendement de chaque IPO avec le MASI depuis son introduction"
            />
          </CarteGraphique>
          <CarteGraphique
            titre="Acheter après un mois : moins bien que le marché, à chaque fois"
            note="Rendement d'un achat au cours de la 20e séance, gardé jusqu'au dernier cours, et rendement du MASI sur exactement la même période. Source : Bourse de Casablanca."
          >
            <GraphiqueBarres
              jeux={[achatVsMasi]}
              cleX="societe"
              format="pourcentage"
              decimalesInfo={1}
              description="Rendement d'un achat à la 20e séance et du MASI sur la même période, pour chaque IPO"
            />
          </CarteGraphique>
        </div>
      </div>

      <div className="mt-8">
        <TitreTableau>Les introductions en bourse, une par une</TitreTableau>
        <TableauTriable
          colonnes={colonnes}
          lignes={lignes}
          legende="Performance de chaque introduction en bourse"
          triInitial={{ cle: "date_premiere_cotation", sens: "asc" }}
        />
        <div className="mt-2 space-y-1 text-xs text-texte-secondaire">
          <p>
            Dernier cours au {formatDateCourte(dateCours)} : les écarts changent chaque jour. Rendements hors
            dividendes, comme le MASI.
          </p>
          <p>
            Sursouscription : la demande a été plusieurs fois plus grande que le nombre d&apos;actions offertes
            ({formatMultiple(premiere.sursouscription)} pour {premiere.societe} = une demande{" "}
            {formatNombre(premiere.sursouscription, { decimales: 1 })} fois plus grande que l&apos;offre).
          </p>
        </div>
      </div>
    </>
  );
}
