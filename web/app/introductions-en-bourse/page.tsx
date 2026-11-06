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
import { Onglets } from "@/components/observatoire/onglets";
import { TableauTriable, type Colonne } from "@/components/observatoire/tableau-triable";
import { ipo, ipoResume, type Ligne } from "@/lib/donnees-pages";
import { formatDate, formatNombre, formatPoints, formatPourcentage } from "@/lib/format";
import { numeriser, type Jeu } from "@/lib/graphiques";

export const metadata: Metadata = { title: "Introductions en bourse" };

const colonnes: Colonne[] = [
  { cle: "societe", libelle: "Société" },
  { cle: "date_premiere_cotation", libelle: "1re cotation", type: "date" },
  { cle: "sursouscription", libelle: "Sursouscription", type: "multiple" },
  { cle: "rdt_j5_pct", libelle: "5 séances", type: "pourcentage", colore: true },
  { cle: "rdt_1m_pct", libelle: "1 mois", type: "pourcentage", colore: true },
  { cle: "rdt_depuis_ipo_pct", libelle: "Depuis l'IPO", type: "pourcentage", colore: true },
  { cle: "anormal_depuis_ipo_pts", libelle: "Écart avec le MASI", type: "points", colore: true },
  { cle: "rdt_achat_j20_pct", libelle: "Achat à la 20e séance", type: "pourcentage", colore: true },
];

function ongletPerformance(lignes: Ligne[], resume: Ligne) {
  const jeu: Jeu = {
    id: "perf",
    libelle: "Écart",
    series: [{ cle: "ecart", libelle: "Écart avec le MASI depuis l'IPO (points)" }],
    donnees: numeriser(
      lignes.map((l) => ({ societe: l.societe, ecart: l.anormal_depuis_ipo_pts })),
      ["ecart"],
    ),
  };
  return (
    <MiseEnPageResultat
      carte={
        <CarteResultat
          numero={12}
          phrase="Les IPO récentes battent le MASI, pour ceux qui les ont souscrites."
          chiffre={`${formatNombre(resume.nb_battent, { decimales: 0 })} sur ${formatNombre(resume.nb, { decimales: 0 })}`}
          legende={`IPO qui font mieux que le MASI depuis leur introduction, de ${formatPoints(resume.ecart_min)} à ${formatPoints(resume.ecart_max)}. Une IPO est une première vente d'actions au public.`}
        />
      }
      graphiques={
        <CarteGraphique
          titre="Presque toutes les IPO ont fait mieux que le marché depuis leur introduction"
          note="Écart entre le rendement de l'action depuis son prix d'IPO et celui du MASI sur la même période, en points de pourcentage. Source : Bourse de Casablanca."
        >
          <GraphiqueBarres
            jeux={[jeu]}
            cleX="societe"
            format="points"
            colorerSigne
            decimalesInfo={1}
            description="Écart de rendement de chaque IPO avec le MASI depuis son introduction"
          />
        </CarteGraphique>
      }
    />
  );
}

function ongletPremierJour(lignes: Ligne[], resume: Ligne) {
  const jeu: Jeu = {
    id: "jour1",
    libelle: "Horizons",
    series: [
      { cle: "j1", libelle: "1er jour", couleur: "var(--serie-6)" },
      { cle: "j5", libelle: "5 séances", couleur: "var(--serie-1)" },
      { cle: "m1", libelle: "1 mois", couleur: "var(--serie-3)" },
    ],
    donnees: numeriser(
      lignes.map((l) => ({ societe: l.societe, j1: l.rdt_j1_pct, j5: l.rdt_j5_pct, m1: l.rdt_1m_pct })),
      ["j1", "j5", "m1"],
    ),
  };
  return (
    <MiseEnPageResultat
      carte={
        <CarteResultat
          numero={13}
          phrase="Le premier jour est limité, la vraie hausse vient après."
          chiffre={formatPourcentage(resume.j5_max)}
          legende={`Meilleur gain en 5 séances. Le premier jour, les titres ne montent que de ${formatPourcentage(resume.j1_min)} à ${formatPourcentage(resume.j1_max)} : la Bourse limite la variation quotidienne.`}
        />
      }
      graphiques={
        <CarteGraphique
          titre="La hausse des IPO se poursuit bien après le premier jour"
          note="Rendement depuis le prix d'IPO, après 1 séance, 5 séances et 1 mois (20 séances). Source : Bourse de Casablanca."
        >
          <GraphiqueBarres
            jeux={[jeu]}
            cleX="societe"
            format="pourcentage"
            decimalesInfo={1}
            description="Rendement de chaque IPO après le premier jour, 5 séances et 1 mois"
          />
        </CarteGraphique>
      }
    />
  );
}

function ongletAchat(lignes: Ligne[], resume: Ligne) {
  const jeu: Jeu = {
    id: "achat",
    libelle: "Achat",
    series: [{ cle: "achat", libelle: "Rendement d'un achat à la 20e séance" }],
    donnees: numeriser(
      lignes.map((l) => ({ societe: l.societe, achat: l.rdt_achat_j20_pct })),
      ["achat"],
    ),
  };
  const dateFin = lignes.map((l) => String(l.date_dernier_cours)).sort().at(-1);
  return (
    <MiseEnPageResultat
      carte={
        <CarteResultat
          numero={14}
          phrase="Racheter une IPO en bourse après le premier mois fait perdre."
          chiffre={formatPourcentage(resume.j20_min)}
          legende={`Pire cas : ${resume.j20_pire}, acheté au cours de la 20e séance et gardé jusqu'au ${formatDate(dateFin)}. Seules ${formatNombre(resume.nb_gagnent_j20, { decimales: 0 })} IPO sur ${formatNombre(resume.nb, { decimales: 0 })} gagnent avec cet achat tardif.`}
        />
      }
      graphiques={
        <CarteGraphique
          titre="Qui achète après le premier mois perd presque toujours"
          note="Rendement entre le cours de la 20e séance et le dernier cours connu. Source : Bourse de Casablanca."
        >
          <GraphiqueBarres
            jeux={[jeu]}
            cleX="societe"
            format="pourcentage"
            colorerSigne
            decimalesInfo={1}
            description="Rendement d'un achat en bourse à la 20e séance, pour chaque IPO"
          />
        </CarteGraphique>
      }
    />
  );
}

export default async function PageIntroductionsEnBourse() {
  const lignes = await ipo();
  const resumes = await ipoResume();

  if (!lignes || lignes.length === 0 || !resumes || resumes.length === 0) {
    return <Indisponible />;
  }
  const resume = resumes[0];

  return (
    <>
      <ConclusionPage>
        Les nouvelles cotations ont surtout profité à ceux qui ont souscrit à l&apos;IPO : acheter le titre en
        bourse un mois plus tard a presque toujours fait perdre de l&apos;argent.
      </ConclusionPage>
      <Onglets
        onglets={[
          { id: "performance", libelle: "Performance face au MASI", contenu: ongletPerformance(lignes, resume) },
          { id: "premier-jour", libelle: "Premier jour", contenu: ongletPremierJour(lignes, resume) },
          { id: "achat", libelle: "Achat après un mois", contenu: ongletAchat(lignes, resume) },
        ]}
      />
      <div className="mt-8">
        <TitreTableau>Les introductions en bourse, une par une</TitreTableau>
        <TableauTriable
          colonnes={colonnes}
          lignes={lignes}
          legende="Performance de chaque introduction en bourse"
          triInitial={{ cle: "date_premiere_cotation", sens: "asc" }}
        />
      </div>
    </>
  );
}
