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
  courbesTaux,
  fluxFondsTaux,
  fondsTauxAnnuel,
  kpiTiming,
  resumeAnticipations,
  sensibilite,
  tauxAutourDecisions,
  tauxDansLeTemps,
  timingFluxTaux,
  type Ligne,
} from "@/lib/donnees-pages";
import {
  formatDate,
  formatDateCourte,
  formatNombre,
  formatPointsDeBase,
  formatPourcentage,
} from "@/lib/format";
import { etiqueterAnnees, numeriser, pivoter, type Jeu } from "@/lib/graphiques";

export const metadata: Metadata = { title: "Taux et obligations" };

// Libellés de catégories présents en base (docs/DATA.md).
const MLT = "Obligations MLT";
const CT = "Obligations CT";

/* ---------- Résultat 8 : fonds par année ---------- */
function ongletAnnees(fonds: Ligne[] | null) {
  if (!fonds || fonds.length === 0) return <Indisponible />;
  // « 2026 » devient « 2026 (janv.–oct.) » quand la base déclare l'année partielle.
  const fondsEtiquetes = etiqueterAnnees(fonds);
  const { donnees, series } = pivoter(fondsEtiquetes, "annee", "categorie", "rendement_pct");
  const jeu: Jeu = {
    id: "annees",
    libelle: "Rendement",
    donnees,
    series: series.map((s) => ({ cle: s, libelle: s })),
  };

  // Tableau : une ligne par année, avec la variation du taux à 10 ans (la même pour toutes les catégories).
  const lignes = donnees.map((r) => ({
    ...r,
    var_taux_10a_pb: fondsEtiquetes.find((f) => f.annee === String(r.annee))?.var_taux_10a_pb ?? null,
  }));
  const colonnes: Colonne[] = [
    { cle: "annee", libelle: "Année" },
    { cle: "var_taux_10a_pb", libelle: "Taux à 10 ans", type: "pb" },
    ...series.map((s): Colonne => ({ cle: s, libelle: s, type: "pourcentage", colore: true })),
  ];

  const derniere = fonds.filter((f) => f.categorie === MLT).at(-1);
  return (
    <MiseEnPageResultat
      carte={
        <CarteResultat
          numero={8}
          phrase="Les fonds obligataires longs suivent les taux, année après année."
          chiffre={formatPourcentage(derniere?.rendement_pct)}
          legende={`Rendement des fonds MLT en ${derniere?.annee ?? "—"} (année en cours), quand le taux à 10 ans a varié de ${formatPointsDeBase(derniere?.var_taux_10a_pb)}. Les années où les taux baissent sont les meilleures pour ces fonds, celles où ils montent les pires.`}
        />
      }
      graphiques={
        <CarteGraphique
          titre="Quand les taux baissent, les fonds longs gagnent le plus ; quand ils montent, ils perdent"
          note="Rendement des fonds par année civile. Entre parenthèses, les mois couverts quand l'année est incomplète. Sources : AMMC, Bank Al-Maghrib."
        >
          <GraphiqueBarres
            jeux={[jeu]}
            cleX="annee"
            format="pourcentage"
            decimalesInfo={1}
            description="Rendement annuel des fonds monétaires, obligataires court terme et moyen-long terme"
          />
        </CarteGraphique>
      }
      tableau={
        <div>
          <TitreTableau>Rendement des fonds et variation du taux à 10 ans, année par année</TitreTableau>
          <TableauTriable colonnes={colonnes} lignes={lignes} legende="Rendement annuel des fonds de taux" />
        </div>
      }
    />
  );
}

/* ---------- Résultat 9 : sensibilité ---------- */
function ongletSensibilite(sens: Ligne[] | null) {
  if (!sens || sens.length === 0) return <Indisponible />;
  const periodes = [...new Set(sens.map((s) => String(s.periode)))];
  const jeux: Jeu[] = periodes.map((p) => ({
    id: p,
    libelle: p,
    series: [{ cle: "sensibilite", libelle: "Perte approximative pour +1 point de taux (%)" }],
    donnees: numeriser(
      sens.filter((s) => s.periode === p).map((s) => ({ categorie: s.categorie, sensibilite: s.sensibilite_implicite })),
      ["sensibilite"],
    ),
  }));
  const toute = sens.find((s) => s.periode === periodes[0] && s.categorie === MLT);
  const recente = sens.find((s) => s.periode === periodes[1] && s.categorie === MLT);
  const ct = sens.find((s) => s.periode === periodes[0] && s.categorie === CT);

  const colonnes: Colonne[] = [
    { cle: "periode", libelle: "Période" },
    { cle: "categorie", libelle: "Catégorie" },
    { cle: "nb_semaines", libelle: "Semaines", type: "nombre", decimales: 0 },
    { cle: "sensibilite_implicite", libelle: "Sensibilité", type: "nombre" },
    { cle: "correlation", libelle: "Corrélation", type: "nombre", signe: true },
    { cle: "r2", libelle: "R²", type: "nombre" },
  ];
  return (
    <MiseEnPageResultat
      carte={
        <CarteResultat
          numero={9}
          phrase="Les fonds obligataires longs sont très sensibles aux taux."
          chiffre={formatNombre(toute?.sensibilite_implicite, { decimales: 1 })}
          legende={`Quand le taux à 10 ans monte d'un point, un fonds MLT perd environ ${formatPourcentage(toute?.sensibilite_implicite, { decimales: 1, signe: false })} (R² = ${formatNombre(toute?.r2)} sur ${formatNombre(toute?.nb_semaines, { decimales: 0 })} semaines). Depuis le changement de méthode de Bank Al-Maghrib : ${formatNombre(recente?.sensibilite_implicite, { decimales: 1 })}. Fonds CT : ${formatNombre(ct?.sensibilite_implicite, { decimales: 1 })}.`}
        />
      }
      graphiques={
        <CarteGraphique
          titre="Plus un fonds détient des obligations longues, plus il réagit aux taux"
          note="Sensibilité implicite = pente de la régression du rendement hebdomadaire sur la variation du taux à 10 ans. R² = part de la variation expliquée par les taux. Les deux périodes donnent des valeurs proches pour les fonds MLT."
        >
          <GraphiqueBarres
            jeux={jeux}
            format="nombre"
            decimalesInfo={1}
            labelChoix="Période"
            description="Sensibilité implicite aux taux des fonds monétaires, CT et MLT"
          />
        </CarteGraphique>
      }
      tableau={
        <div>
          <TitreTableau>Sensibilité de chaque catégorie de fonds</TitreTableau>
          <TableauTriable colonnes={colonnes} lignes={sens} legende="Sensibilité des fonds aux variations du taux à 10 ans" />
        </div>
      }
    />
  );
}

/* ---------- Résultat 10 : anticipations ---------- */
function ongletAnticipations(decisions: Ligne[] | null, resume: Ligne[] | null) {
  if (!decisions || decisions.length === 0) return <Indisponible />;
  const { donnees, series } = pivoter(
    decisions.map((d) => ({
      date: formatDateCourte(d.date_effet),
      decision: d.decision,
      ecart: d.ecart_13s_vs_directeur_pb,
    })),
    "date",
    "decision",
    "ecart",
  );
  const couleurs: Record<string, string> = { Hausse: "var(--serie-2)", Baisse: "var(--serie-1)", Maintien: "var(--serie-8)" };
  const jeu: Jeu = {
    id: "anticip",
    libelle: "Écart",
    donnees,
    series: series.map((s) => ({ cle: s, libelle: s, couleur: couleurs[s] })),
  };
  const hausse = resume?.find((r) => r.decision === "Hausse");
  const baisse = resume?.find((r) => r.decision === "Baisse");

  const colonnes: Colonne[] = [
    { cle: "date_effet", libelle: "Entrée en vigueur", type: "date" },
    { cle: "decision", libelle: "Décision" },
    { cle: "taux_avant", libelle: "Avant", type: "pourcentage", signe: false, decimales: 2 },
    { cle: "taux_apres", libelle: "Après", type: "pourcentage", signe: false, decimales: 2 },
    { cle: "taux_13s_veille", libelle: "Taux 13 sem. la veille", type: "pourcentage", signe: false, decimales: 2 },
    { cle: "ecart_13s_vs_directeur_pb", libelle: "Écart avec le directeur", type: "pb", colore: true },
  ];
  return (
    <MiseEnPageResultat
      carte={
        <CarteResultat
          numero={10}
          phrase="Le marché anticipait les hausses de Bank Al-Maghrib, pas les baisses."
          chiffre={formatPointsDeBase(hausse?.ecart_max)}
          legende={`À la veille des hausses, le taux à 13 semaines était déjà de ${formatPointsDeBase(hausse?.ecart_min, { signe: false })} à ${formatPointsDeBase(hausse?.ecart_max, { signe: false })} au-dessus du taux directeur. Avant les baisses, l'écart allait de ${formatPointsDeBase(baisse?.ecart_min)} à ${formatPointsDeBase(baisse?.ecart_max)}.`}
        />
      }
      graphiques={
        <CarteGraphique
          titre="Avant une hausse, les taux courts avaient déjà monté ; avant une baisse, presque pas bougé"
          note="Écart, la veille de chaque décision, entre le taux à 13 semaines du marché et le taux directeur (pb = points de base, 100 pb = 1 point). Source : Bank Al-Maghrib."
        >
          <GraphiqueBarres
            jeux={[jeu]}
            cleX="date"
            format="pb"
            empile
            decimalesInfo={0}
            hauteur={320}
            description="Écart entre le taux à 13 semaines et le taux directeur la veille de chaque décision"
          />
        </CarteGraphique>
      }
      tableau={
        <div>
          <TitreTableau>Taux autour de chaque décision</TitreTableau>
          <TableauTriable
            colonnes={colonnes}
            lignes={decisions}
            legende="Taux directeur et taux à 13 semaines autour des décisions de Bank Al-Maghrib"
            triInitial={{ cle: "date_effet", sens: "desc" }}
            hauteurMax="26rem"
          />
        </div>
      }
    />
  );
}

/* ---------- Résultat 11 : flux ---------- */
function ongletFlux(flux: Ligne[] | null, timing: Ligne[] | null, kpi: Ligne[] | null) {
  if (!flux || flux.length === 0) return <Indisponible />;
  const { donnees, series } = pivoter(etiqueterAnnees(flux), "annee", "categorie", "flux_net_md");
  const jeu: Jeu = {
    id: "flux",
    libelle: "Flux",
    donnees,
    series: series.map((s) => ({ cle: s, libelle: s })),
  };
  const mlt = timing?.find((t) => t.categorie === MLT);
  const colonnes: Colonne[] = [
    { cle: "categorie", libelle: "Catégorie" },
    { cle: "nb_semaines", libelle: "Semaines", type: "nombre", decimales: 0 },
    { cle: "corr_flux_rend_passe", libelle: "Corrélation avec la performance passée", type: "nombre", signe: true },
    { cle: "corr_flux_rend_futur", libelle: "Corrélation avec la performance future", type: "nombre", signe: true },
  ];
  return (
    <MiseEnPageResultat
      carte={
        <CarteResultat
          numero={11}
          phrase="Les épargnants obligataires suivent moins la tendance que ceux des fonds actions."
          chiffre={formatNombre(mlt?.corr_flux_rend_passe, { signe: true })}
          legende={`Corrélation des flux (en dirhams) avec la performance passée, pour les fonds MLT. Pour les fonds Actions : ${formatNombre(kpi?.[0]?.corr_passe, { signe: true })}, mais mesurée sur les flux en % de l'actif net : les deux chiffres ne se comparent pas exactement.`}
        />
      }
      graphiques={
        <CarteGraphique
          titre="Les capitaux ont quitté les fonds MLT quand les taux ont remonté"
          note="Flux net = souscriptions − rachats, en milliards de dirhams, par année civile. Entre parenthèses, les mois couverts quand l'année est incomplète. Source : AMMC."
        >
          <GraphiqueBarres
            jeux={[jeu]}
            cleX="annee"
            format="milliards"
            decimalesInfo={1}
            description="Flux nets annuels vers les fonds monétaires, obligataires CT et MLT, en milliards de dirhams"
          />
        </CarteGraphique>
      }
      tableau={
        timing && (
          <div>
            <TitreTableau>Les flux suivent-ils la performance ?</TitreTableau>
            <TableauTriable colonnes={colonnes} lignes={timing} legende="Corrélation des flux des fonds de taux avec leur performance" />
          </div>
        )
      }
    />
  );
}

/* ---------- Courbe des taux ---------- */
function ongletCourbe(courbes: Ligne[] | null, serie: Ligne[] | null) {
  if (!courbes || courbes.length === 0) return <Indisponible />;
  const rangs = [...new Set(courbes.map((c) => Number(c.rang)))];
  const { donnees } = pivoter(
    courbes.map((c) => ({ maturite: c.maturite, serie: `r${c.rang}`, taux: c.taux_pct })),
    "maturite",
    "serie",
    "taux",
  );
  const couleursRang = ["var(--serie-1)", "var(--serie-2)", "var(--serie-6)"];
  const dateDuRang = (r: number) => String(courbes.find((c) => Number(c.rang) === r)?.date_courbe);
  const jeuCourbe: Jeu = {
    id: "courbe",
    libelle: "Courbe",
    donnees,
    series: rangs.map((r) => ({
      cle: `r${r}`,
      libelle: `Courbe du ${formatDate(dateDuRang(r))}`,
      couleur: couleursRang[r] ?? "var(--serie-8)",
    })),
  };
  const derniere = courbes.filter((c) => Number(c.rang) === 0);
  const dix = derniere.find((c) => c.maturite === "10 ans");
  const treize = derniere.find((c) => c.maturite === "13 sem");

  let jeuTemps: Jeu | null = null;
  if (serie && serie.length > 0) {
    const p = pivoter(serie, "date", "maturite", "taux_pct");
    const noms: Record<string, string> = { "13 sem": "Taux à 13 semaines", "10 ans": "Taux à 10 ans" };
    jeuTemps = {
      id: "temps",
      libelle: "Taux",
      donnees: p.donnees,
      series: p.series.map((s, i) => ({
        cle: s,
        libelle: noms[s] ?? s,
        couleur: i === 0 ? "var(--serie-2)" : "var(--serie-1)",
      })),
    };
  }

  return (
    <MiseEnPageResultat
      carte={
        <CarteResultat
          etiquette="Courbe des taux"
          phrase="Les taux de référence des bons du Trésor, selon la durée."
          chiffre={formatPourcentage(dix?.taux_pct, { signe: false, decimales: 2 })}
          legende={`Taux à 10 ans au ${formatDate(dateDuRang(0))}. À 13 semaines : ${formatPourcentage(treize?.taux_pct, { signe: false, decimales: 2 })}. Une courbe qui monte avec la durée est la situation normale : on est payé pour immobiliser son argent plus longtemps.`}
        />
      }
      graphiques={
        <>
          <CarteGraphique
            titre="La forme de la courbe des taux évolue d'une année à l'autre"
            note="Taux de référence du marché secondaire des bons du Trésor, par durée restante. Source : Bank Al-Maghrib."
          >
            <GraphiqueLignes
              jeux={[jeuCourbe]}
              typeX="texte"
              cleX="maturite"
              format="pourcentage"
              decimalesAxe={1}
              decimalesInfo={2}
              filtrePeriode={false}
              description="Courbe des taux à la date la plus récente, un an et deux ans plus tôt"
              points
            />
          </CarteGraphique>
          {jeuTemps && (
            <CarteGraphique
              titre="L'écart entre taux courts et taux longs varie dans le temps"
              note="Taux à 13 semaines et à 10 ans, jour par jour. Source : Bank Al-Maghrib."
            >
              <GraphiqueLignes
                jeux={[jeuTemps]}
                format="pourcentage"
                decimalesAxe={1}
                decimalesInfo={2}
                description="Taux à 13 semaines et à 10 ans dans le temps"
              />
            </CarteGraphique>
          )}
        </>
      }
    />
  );
}

export default async function PageTauxObligations() {
  const fonds = await fondsTauxAnnuel();
  const sens = await sensibilite();
  const decisions = await tauxAutourDecisions();
  const resume = await resumeAnticipations();
  const flux = await fluxFondsTaux();
  const timing = await timingFluxTaux();
  const kpi = await kpiTiming();
  const courbes = await courbesTaux();
  const serie = await tauxDansLeTemps();

  return (
    <>
      <ConclusionPage>
        Les fonds obligataires longs gagnent quand les taux baissent et perdent quand ils montent, et le marché
        des taux devance souvent les décisions de Bank Al-Maghrib.
      </ConclusionPage>
      <Onglets
        onglets={[
          { id: "annees", libelle: "Fonds par année", contenu: ongletAnnees(fonds) },
          { id: "sensibilite", libelle: "Sensibilité aux taux", contenu: ongletSensibilite(sens) },
          { id: "anticipations", libelle: "Anticipations", contenu: ongletAnticipations(decisions, resume) },
          { id: "flux", libelle: "Flux des épargnants", contenu: ongletFlux(flux, timing, kpi) },
          { id: "courbe", libelle: "Courbe des taux", contenu: ongletCourbe(courbes, serie) },
        ]}
      />
    </>
  );
}
