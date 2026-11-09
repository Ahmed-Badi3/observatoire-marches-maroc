import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { ChiffreAnime } from "./chiffre-anime";
import { Jauge } from "./jauge";

// Carte vedette : dégradé, chiffre clé, 2 pastilles de chiffres secondaires, lien « Voir le détail ».
// Sur l'accueil, deux cartes vedettes (DESIGN.md). Le chiffre défile à l'apparition ; jauge facultative.
// Dégradé 1 : texte blanc. Dégradé 2 : texte foncé (contraste sur le jaune).
export function CarteVedette({
  variante,
  libelle,
  valeur,
  pastilles,
  href,
  precision,
  jauge,
}: {
  variante: 1 | 2;
  libelle: string;
  valeur: string;
  pastilles?: { libelle: string; valeur: string }[];
  href?: string;
  precision?: string; // période et fréquence du chiffre (lib/format.ts, formatPeriode)
  jauge?: { part: number | string | null | undefined; total: number }; // proportion en demi-cercle (ex. 58 sur 100)
}) {
  const clair = variante === 1;
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-carte p-6 shadow-carte animate-in fade-in slide-in-from-bottom-2 duration-500",
        clair ? "text-white" : "text-texte",
      )}
      style={{ background: clair ? "var(--degrade-1)" : "var(--degrade-2)" }}
    >
      <p className="text-sm font-medium opacity-90">{libelle}</p>
      <div className="flex items-end gap-4">
        <p className="text-[32px] font-semibold leading-tight">
          <ChiffreAnime texte={valeur} />
        </p>
        {jauge && (
          <Jauge
            part={jauge.part}
            total={jauge.total}
            fond={clair ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.55)"}
            className="w-20"
          />
        )}
      </div>
      {precision && <p className="-mt-3 text-xs opacity-90">{precision}</p>}
      {pastilles && pastilles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pastilles.map((p) => (
            <span
              key={p.libelle}
              className={cn(
                "rounded-lg px-3 py-1 text-xs",
                clair ? "bg-white/20" : "bg-white/50",
              )}
            >
              {p.libelle} <strong className="font-semibold">{p.valeur}</strong>
            </span>
          ))}
        </div>
      )}
      {href && (
        <Link
          href={href}
          className="mt-auto inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline"
        >
          Voir le détail <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}
