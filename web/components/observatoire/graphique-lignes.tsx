"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatMoisAnnee } from "@/lib/format";
import {
  couleurSerie,
  formateur,
  type FormatValeur,
  type Jeu,
} from "@/lib/graphiques";
import { InfoBulle, Legende } from "./graphique-commun";
import { Segments } from "./segments";

const PERIODES = [
  { id: "1an", libelle: "1 an", annees: 1 },
  { id: "3ans", libelle: "3 ans", annees: 3 },
  { id: "tout", libelle: "Tout", annees: null },
];

// « 2026-10-23 » moins N ans : pour ne garder que la fin de la série. C'est un filtre, pas un calcul financier.
function coupure(derniere: string, annees: number): string {
  const d = new Date(derniere.slice(0, 10) + "T00:00:00Z");
  d.setUTCFullYear(d.getUTCFullYear() - annees);
  return d.toISOString().slice(0, 10);
}

// Graphique en lignes (courbes dans le temps ou le long d'un axe de textes).
// - `jeux` : un ou plusieurs choix (ex. Nominal / Réel). S'il y en a plusieurs, un sélecteur apparaît.
// - `typeX: "date"` : la clé `date` (AAAA-MM-JJ) alimente l'axe et le filtre de période 1 an / 3 ans / Tout.
// - Les points sont reliés par des segments droits : une courbe arrondie inventerait des virages entre
//   deux données (image : un fil souple tendu entre des clous). `points` affiche chaque donnée,
//   pour les séries mensuelles ou à peu de points (PER, inflation, courbe des taux).
export function GraphiqueLignes({
  jeux,
  format = "nombre",
  typeX = "date",
  cleX = "date",
  filtrePeriode = true,
  escalier = false,
  points = false,
  ligneZero = false,
  decimalesAxe = 0,
  decimalesInfo,
  signeInfo,
  hauteur = 300,
  description,
  labelChoix = "Affichage",
}: {
  jeux: Jeu[];
  format?: FormatValeur;
  typeX?: "date" | "texte";
  cleX?: string;
  filtrePeriode?: boolean;
  escalier?: boolean; // marches d'escalier (ex. taux directeur)
  points?: boolean; // un point visible sur chaque donnée
  ligneZero?: boolean;
  decimalesAxe?: number;
  decimalesInfo?: number;
  signeInfo?: boolean;
  hauteur?: number;
  description: string; // décrit le graphique aux lecteurs d'écran
  labelChoix?: string;
}) {
  const [jeuId, setJeuId] = useState(jeux[0]?.id);
  const [periode, setPeriode] = useState("tout");
  const [masquees, setMasquees] = useState<Set<string>>(new Set());

  const jeu = jeux.find((j) => j.id === jeuId) ?? jeux[0];
  const avecDates = typeX === "date";

  const donnees = useMemo(() => {
    if (!jeu) return [];
    const p = PERIODES.find((x) => x.id === periode);
    if (!avecDates || !filtrePeriode || !p?.annees || jeu.donnees.length === 0) return jeu.donnees;
    const derniere = String(jeu.donnees[jeu.donnees.length - 1][cleX]);
    const debut = coupure(derniere, p.annees);
    return jeu.donnees.filter((r) => String(r[cleX]).slice(0, 10) >= debut);
  }, [jeu, periode, avecDates, filtrePeriode, cleX]);

  if (!jeu || jeu.donnees.length === 0) {
    return <p className="py-8 text-sm text-texte-secondaire">Données indisponibles.</p>;
  }

  const libelles = Object.fromEntries(jeu.series.map((s) => [s.cle, s.libelle]));
  const formatInfo = formateur(format, { decimales: decimalesInfo, signe: signeInfo });
  const formatAxe = formateur(format, { decimales: decimalesAxe, signe: false });

  function basculer(cle: string) {
    setMasquees((actuel) => {
      const suivant = new Set(actuel);
      if (suivant.has(cle)) suivant.delete(cle);
      else suivant.add(cle);
      return suivant;
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Legende series={jeu.series} masquees={masquees} onBascule={basculer} />
        <div className="flex flex-wrap items-center gap-2">
          {jeux.length > 1 && (
            <Segments
              label={labelChoix}
              options={jeux.map((j) => ({ id: j.id, libelle: j.libelle }))}
              valeur={jeu.id}
              onChange={setJeuId}
            />
          )}
          {avecDates && filtrePeriode && (
            <Segments
              label="Période"
              options={PERIODES.map((p) => ({ id: p.id, libelle: p.libelle }))}
              valeur={periode}
              onChange={setPeriode}
            />
          )}
        </div>
      </div>
      <div style={{ height: hauteur }} role="img" aria-label={description}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={donnees} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--separateur)" />
            <XAxis
              dataKey={cleX}
              tickFormatter={(v: string) => (avecDates ? formatMoisAnnee(v) : String(v))}
              tick={{ fontSize: 12, fill: "var(--texte-secondaire)" }}
              axisLine={false}
              tickLine={false}
              minTickGap={48}
            />
            <YAxis
              width={52}
              tickFormatter={formatAxe}
              tick={{ fontSize: 12, fill: "var(--texte-secondaire)" }}
              axisLine={false}
              tickLine={false}
              domain={["auto", "auto"]}
            />
            {ligneZero && <ReferenceLine y={0} stroke="var(--texte-secondaire)" strokeDasharray="4 4" />}
            <Tooltip
              content={
                <InfoBulle formatValeur={formatInfo} libelles={libelles} typeX={avecDates ? "date" : "texte"} />
              }
            />
            {jeu.series.map((s, i) => (
              <Line
                key={s.cle}
                type={escalier ? "stepAfter" : "linear"}
                dataKey={s.cle}
                name={s.libelle}
                stroke={couleurSerie(s, i)}
                strokeWidth={2}
                dot={points || donnees.length <= 12 ? { r: donnees.length > 40 ? 2 : 3 } : false}
                activeDot={{ r: 5 }}
                connectNulls
                hide={masquees.has(s.cle)}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
