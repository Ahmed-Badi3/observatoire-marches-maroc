"use client";

import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { couleurSerie, type Serie } from "@/lib/graphiques";

// Pièces partagées par les graphiques en lignes et en barres : info-bulle et légende cliquable.

type ChargeUtile = { dataKey?: string | number; value?: number | string | null; color?: string };

// Info-bulle au survol : la date (ou la catégorie), puis une ligne par série.
export function InfoBulle({
  active,
  payload,
  label,
  formatValeur,
  libelles,
  typeX,
}: {
  active?: boolean;
  payload?: ChargeUtile[];
  label?: string | number;
  formatValeur: (v: unknown) => string;
  libelles: Record<string, string>;
  typeX: "date" | "texte";
}) {
  if (!active || !payload?.length) return null;
  const titre = typeX === "date" ? formatDate(String(label)) : String(label ?? "");
  return (
    <div className="rounded-lg bg-carte px-3 py-2 text-xs shadow-carte">
      <p className="mb-1 font-semibold text-texte">{titre}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="flex items-center gap-2 text-texte-secondaire">
          <span className="inline-block size-2 rounded-full" style={{ background: p.color }} />
          {libelles[String(p.dataKey)] ?? String(p.dataKey)} : {formatValeur(p.value)}
        </p>
      ))}
    </div>
  );
}

// Légende : cliquer sur un nom masque ou affiche la série.
export function Legende({
  series,
  masquees,
  onBascule,
}: {
  series: Serie[];
  masquees: Set<string>;
  onBascule: (cle: string) => void;
}) {
  if (series.length < 2) return null;
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Légende (cliquer pour masquer une série)">
      {series.map((s, i) => {
        const cachee = masquees.has(s.cle);
        return (
          <li key={s.cle}>
            <button
              type="button"
              onClick={() => onBascule(s.cle)}
              aria-pressed={!cachee}
              className={cn(
                "inline-flex items-center gap-1.5 text-xs transition-opacity duration-150",
                cachee ? "text-texte-secondaire line-through opacity-60" : "text-texte",
              )}
            >
              <span className="inline-block size-2.5 rounded-full" style={{ background: couleurSerie(s, i) }} />
              {s.libelle}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
