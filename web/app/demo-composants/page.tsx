import type { Metadata } from "next";

import { CarteKpi } from "@/components/observatoire/carte-kpi";
import { CarteResultat } from "@/components/observatoire/carte-resultat";
import { CarteVedette } from "@/components/observatoire/carte-vedette";
import { Onglets } from "@/components/observatoire/onglets";
import { SqueletteBloc, SqueletteCarteKpi } from "@/components/observatoire/squelette";
import { TableauTriable, type Colonne, type Ligne } from "@/components/observatoire/tableau-triable";
import { tonDe } from "@/components/observatoire/variation";
import { formatMultiple, formatNombre, formatPoints, formatPourcentage } from "@/lib/format";

export const metadata: Metadata = { title: "Démonstration des composants" };

// Page provisoire de la tâche E1. TOUTES les valeurs ci-dessous sont fictives (elles servent
// seulement à montrer l'apparence). Les vraies pages liront la base.
const colonnes: Colonne[] = [
  { cle: "nom", libelle: "Placement" },
  { cle: "rendement", libelle: "Rendement", type: "pourcentage", colore: true },
  { cle: "risque", libelle: "Risque", type: "pourcentage", decimales: 1, signe: false },
  { cle: "ecart", libelle: "Écart", type: "points", colore: true },
  { cle: "per", libelle: "PER", type: "multiple" },
  { cle: "indice", libelle: "Indice", type: "nombre" },
  { cle: "date", libelle: "Date", type: "date" },
];

const lignes: Ligne[] = [
  { nom: "Exemple A", rendement: 12.34, risque: 9.1, ecart: 3.2, per: 14, indice: 1234.5, date: "2026-03-02" },
  { nom: "Exemple B", rendement: -5.6, risque: 15.8, ecart: -2.4, per: 21.5, indice: 8765.43, date: "2026-01-15" },
  { nom: "Exemple C", rendement: 0.4, risque: 3.2, ecart: 0, per: null, indice: 105.12, date: "2026-07-20" },
  { nom: "Exemple D", rendement: 25.01, risque: 12, ecart: 8.8, per: 18, indice: 15000, date: null },
];

const courbe = [3, 4, 3.5, 5, 6, 5.5, 7, 8, 7.5, 9];

export default function PageDemoComposants() {
  return (
    <div className="space-y-8">
      <p className="rounded-carte bg-carte p-4 text-sm text-texte-secondaire shadow-carte">
        Page de démonstration (tâche E1) : toutes les valeurs sont fictives.
      </p>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Cartes vedettes</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <CarteVedette
            variante={1}
            libelle="Exemple de chiffre clé"
            valeur={formatPourcentage(12.34)}
            pastilles={[
              { libelle: "Volatilité", valeur: formatPourcentage(9.1, { signe: false }) },
              { libelle: "Sharpe", valeur: formatNombre(0.5) },
            ]}
            href="/synthese"
          />
          <CarteVedette
            variante={2}
            libelle="Autre chiffre clé"
            valeur={formatPourcentage(58, { decimales: 0, signe: false })}
            pastilles={[{ libelle: "Écart", valeur: formatPoints(-4.5) }]}
            href="/synthese"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Cartes KPI (hausse, baisse, neutre)</h2>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <CarteKpi
            libelle="Rendement annualisé"
            valeur={formatPourcentage(12.34)}
            variation={{ texte: formatPourcentage(3.2), ton: tonDe(3.2) }}
            serie={courbe}
          />
          <CarteKpi
            libelle="Pire baisse"
            valeur={formatPourcentage(-18.9)}
            variation={{ texte: formatPourcentage(-2.4), ton: tonDe(-2.4) }}
            serie={[...courbe].reverse()}
          />
          <CarteKpi
            libelle="Volatilité"
            valeur={formatPourcentage(9.1, { signe: false })}
            variation={{ texte: formatPourcentage(0), ton: tonDe(0) }}
          />
          <CarteKpi libelle="Donnée manquante" valeur={formatPourcentage(null)} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Onglets, carte de résultat et tableau triable</h2>
        <Onglets
          onglets={[
            {
              id: "un",
              libelle: "Résultat fictif 1",
              contenu: (
                <div className="grid gap-6 lg:grid-cols-3">
                  <CarteResultat
                    numero={1}
                    phrase="Une phrase courte qui donne la conclusion."
                    chiffre={formatMultiple(18)}
                    legende="Légende de la carte."
                  />
                  <div className="rounded-carte bg-carte p-6 text-texte-secondaire shadow-carte lg:col-span-2">
                    Ici viendra le graphique (2/3 de la largeur).
                  </div>
                </div>
              ),
            },
            {
              id: "deux",
              libelle: "Résultat fictif 2",
              contenu: (
                <TableauTriable
                  colonnes={colonnes}
                  lignes={lignes}
                  legende="Placements fictifs, triables par colonne"
                  triInitial={{ cle: "rendement", sens: "desc" }}
                />
              ),
            },
            { id: "trois", libelle: "Chargement", contenu: <SqueletteBloc /> },
          ]}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Squelettes de chargement</h2>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <SqueletteCarteKpi />
          <SqueletteCarteKpi />
        </div>
      </section>
    </div>
  );
}
