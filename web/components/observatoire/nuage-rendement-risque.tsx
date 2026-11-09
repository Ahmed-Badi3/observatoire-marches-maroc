"use client";

import {
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatNombre, formatPourcentage } from "@/lib/format";

// Nuage de points : chaque placement est un point. À droite = plus risqué, en haut = plus rémunérateur.
// Les valeurs arrivent brutes de la base (texte ou nombre) ; on les convertit seulement pour les placer.
export type PointNuage = {
  actif: string;
  risque: string | number | null; // volatilité (%)
  rendement: string | number | null; // rendement annualisé (%)
  sharpe: string | number | null;
};

const COULEURS = {
  masi: "var(--serie-2)",
  portefeuille: "var(--serie-3)",
  autre: "var(--serie-1)",
};

function couleurDe(actif: string): string {
  if (actif === "MASI") return COULEURS.masi;
  if (actif.startsWith("Portefeuille")) return COULEURS.portefeuille;
  return COULEURS.autre;
}

type Donnee = { actif: string; x: number; y: number; sharpe: string | number | null };

// Côté de l'étiquette par point : des points proches (ex. OCT et Monétaire) ne cachent pas leur nom.
type Cote = "haut" | "bas" | "gauche" | "droite";
const COTES: Record<string, Cote> = {
  "Portefeuille équilibré": "gauche",
  "Fonds Diversifiés": "droite",
  "Portefeuille prudent": "haut",
  OMLT: "droite",
  OCT: "haut",
  Monétaire: "bas", // tout près de l'OCT depuis la correction des indices AMMC
  "Fonds Actions": "bas",
};

function EtiquettePoint(props: object) {
  const brut = props as { x?: number | string; y?: number | string; value?: number | string };
  const x = Number(brut.x);
  const y = Number(brut.y);
  const complet = String(brut.value ?? "");
  const nom = complet.replace("Portefeuille ", ""); // « Prudent » : les points foncés sont les portefeuilles types
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const cote = COTES[complet] ?? "haut";
  const decalage = 12;
  const position = {
    haut: { x, y: y - decalage, ancre: "middle" as const },
    bas: { x, y: y + decalage + 8, ancre: "middle" as const },
    gauche: { x: x - decalage, y: y + 4, ancre: "end" as const },
    droite: { x: x + decalage, y: y + 4, ancre: "start" as const },
  }[cote];
  return (
    <text x={position.x} y={position.y} textAnchor={position.ancre} fontSize={11} fill="var(--texte)">
      {nom}
    </text>
  );
}

function InfoBulle({ active, payload }: { active?: boolean; payload?: { payload: Donnee }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg bg-carte px-3 py-2 text-xs shadow-carte">
      <p className="font-semibold text-texte">{d.actif}</p>
      <p className="text-texte-secondaire">Rendement annualisé : {formatPourcentage(d.y)}</p>
      <p className="text-texte-secondaire">Volatilité : {formatPourcentage(d.x, { signe: false })}</p>
    </div>
  );
}

export function NuageRendementRisque({ points }: { points: PointNuage[] }) {
  const donnees: Donnee[] = points
    .filter((p) => p.risque !== null && p.rendement !== null)
    .map((p) => ({ actif: p.actif, x: Number(p.risque), y: Number(p.rendement), sharpe: p.sharpe }))
    .filter((d) => Number.isFinite(d.x) && Number.isFinite(d.y));

  if (donnees.length === 0) {
    return <p className="p-6 text-sm text-texte-secondaire">Données indisponibles.</p>;
  }

  return (
    <div>
      <div className="h-[380px] w-full" role="img" aria-label="Nuage de points : rendement annualisé selon la volatilité de chaque placement">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 16, right: 56, bottom: 24, left: 8 }}>
            <CartesianGrid vertical={false} stroke="var(--separateur)" />
            <XAxis
              type="number"
              dataKey="x"
              name="Volatilité"
              tickFormatter={(v: number) => formatNombre(v, { decimales: 0 })}
              tick={{ fontSize: 12, fill: "var(--texte-secondaire)" }}
              axisLine={false}
              tickLine={false}
              label={{ value: "Risque : volatilité annualisée (%)", position: "insideBottom", offset: -12, fontSize: 12, fill: "var(--texte-secondaire)" }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Rendement"
              width={44}
              tickFormatter={(v: number) => formatNombre(v, { decimales: 0 })}
              tick={{ fontSize: 12, fill: "var(--texte-secondaire)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<InfoBulle />} cursor={{ strokeDasharray: "3 3" }} />
            <Scatter
              data={donnees}
              shape={(props: { cx?: number; cy?: number; payload?: Donnee }) => (
                <circle
                  cx={props.cx}
                  cy={props.cy}
                  r={7}
                  fill={couleurDe(props.payload?.actif ?? "")}
                  stroke="#fff"
                  strokeWidth={2}
                />
              )}
            >
              <LabelList dataKey="actif" content={EtiquettePoint} />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      {/* Légende des couleurs (CORRECTIONS.md, Accueil et Synthèse) */}
      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-texte-secondaire">
        {[
          { libelle: "MASI (indice)", couleur: COULEURS.masi },
          { libelle: "Portefeuilles types", couleur: COULEURS.portefeuille },
          { libelle: "Fonds", couleur: COULEURS.autre },
        ].map((l) => (
          <span key={l.libelle} className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: l.couleur }} aria-hidden="true" />
            {l.libelle}
          </span>
        ))}
      </p>
    </div>
  );
}
