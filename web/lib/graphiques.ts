import {
  formatMilliards,
  formatMultiple,
  formatNombre,
  formatPoints,
  formatPointsDeBase,
  formatPourcentage,
} from "@/lib/format";

// Outils communs aux graphiques. Ici on ne fait que REMETTRE EN FORME des lignes déjà lues en base
// (ranger en colonnes, convertir le texte en nombre) : aucun calcul financier.

export type Rangee = Record<string, string | number | null>;
export type Serie = { cle: string; libelle: string; couleur?: string };
// Un « jeu » = un choix proposé à l'utilisateur (ex. Nominal / Réel) : ses données et ses séries.
export type Jeu = { id: string; libelle: string; donnees: Rangee[]; series: Serie[] };

export type FormatValeur = "nombre" | "pourcentage" | "pb" | "points" | "multiple" | "milliards";

// Palette des séries (DESIGN.md), dans l'ordre.
export const PALETTE = [
  "var(--serie-1)",
  "var(--serie-2)",
  "var(--serie-3)",
  "var(--serie-4)",
  "var(--serie-5)",
  "var(--serie-6)",
  "var(--serie-7)",
  "var(--serie-8)",
];

export function couleurSerie(serie: Serie, index: number): string {
  return serie.couleur ?? PALETTE[index % PALETTE.length];
}

// Renvoie la fonction de format française adaptée (lib/format.ts).
export function formateur(
  format: FormatValeur,
  options: { decimales?: number; signe?: boolean } = {},
): (v: unknown) => string {
  return (v) => {
    const valeur = typeof v === "number" || typeof v === "string" ? v : null;
    switch (format) {
      case "pourcentage":
        return formatPourcentage(valeur, options);
      case "pb":
        return formatPointsDeBase(valeur, options);
      case "points":
        return formatPoints(valeur, options);
      case "multiple":
        return formatMultiple(valeur, { decimales: options.decimales });
      case "milliards":
        return formatMilliards(valeur, options);
      default:
        return formatNombre(valeur, options);
    }
  };
}

export function enNombre(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

// Les colonnes `numeric` arrivent en texte : les graphiques ont besoin de vrais nombres.
export function numeriser<T extends Record<string, unknown>>(lignes: T[], cles: string[]): Rangee[] {
  return lignes.map((l) => {
    const r: Rangee = {};
    for (const [k, v] of Object.entries(l)) {
      r[k] = cles.includes(k) ? enNombre(v) : (v as string | number | null);
    }
    return r;
  });
}

// « Ranger en colonnes » : des lignes (x, série, valeur) deviennent une ligne par x avec une colonne par série.
// Image : passer d'une liste « 2024, Monétaire, 3,2 » à un tableau croisé.
export function pivoter(
  lignes: Record<string, unknown>[],
  cleX: string,
  cleSerie: string,
  cleValeur: string,
): { donnees: Rangee[]; series: string[] } {
  const parX = new Map<string, Rangee>();
  const series: string[] = [];
  for (const l of lignes) {
    const x = String(l[cleX]);
    const s = String(l[cleSerie]);
    if (!series.includes(s)) series.push(s);
    const rangee = parX.get(x) ?? { [cleX]: x };
    rangee[s] = enNombre(l[cleValeur]);
    parX.set(x, rangee);
  }
  return { donnees: [...parX.values()], series };
}
