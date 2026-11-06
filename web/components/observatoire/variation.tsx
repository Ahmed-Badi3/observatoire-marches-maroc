import { cn } from "@/lib/utils";

// Pastille de variation : vert pour une hausse, rouge pour une baisse, jaune pour neutre.
// Le signe (+ ou −) est déjà dans le texte : la couleur n'est jamais seule à porter l'information.
export type Ton = "positif" | "negatif" | "neutre";

// Choisit la couleur d'après le signe de la valeur (null ou 0 : neutre).
export function tonDe(valeur: number | string | null | undefined): Ton {
  const n = valeur === null || valeur === undefined || valeur === "" ? NaN : Number(valeur);
  if (!Number.isFinite(n) || n === 0) return "neutre";
  return n > 0 ? "positif" : "negatif";
}

export const COULEUR_TEXTE_TON: Record<Ton, string> = {
  positif: "text-positif",
  negatif: "text-negatif",
  neutre: "text-texte-secondaire",
};

export function Variation({ texte, ton }: { texte: string; ton: Ton }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold",
        ton === "positif" && "bg-positif/15 text-positif",
        ton === "negatif" && "bg-negatif/15 text-negatif",
        ton === "neutre" && "bg-neutre/25 text-texte",
      )}
    >
      {texte}
    </span>
  );
}
