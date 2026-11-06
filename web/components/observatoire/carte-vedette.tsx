import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

// Carte vedette : dégradé, chiffre clé, 2 pastilles de chiffres secondaires, lien « Voir le détail ».
// Deux cartes en dégradé au maximum par page (DESIGN.md) : l'accent attire l'œil parce qu'il est rare.
// Dégradé 1 : texte blanc. Dégradé 2 : texte foncé (contraste sur le jaune).
export function CarteVedette({
  variante,
  libelle,
  valeur,
  pastilles,
  href,
}: {
  variante: 1 | 2;
  libelle: string;
  valeur: string;
  pastilles?: { libelle: string; valeur: string }[];
  href?: string;
}) {
  const clair = variante === 1;
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-carte p-6 shadow-carte",
        clair ? "text-white" : "text-texte",
      )}
      style={{ background: clair ? "var(--degrade-1)" : "var(--degrade-2)" }}
    >
      <p className="text-sm font-medium opacity-90">{libelle}</p>
      <p className="text-[32px] font-semibold leading-tight">{valeur}</p>
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
