"use client";

import { cn } from "@/lib/utils";

// Boutons « segmentés » : un seul choix actif à la fois (période, indice, nominal / réel...).
// Au clavier : Tab pour atteindre le groupe, Entrée ou Espace pour choisir.
export function Segments({
  options,
  valeur,
  onChange,
  label,
}: {
  options: { id: string; libelle: string }[];
  valeur: string;
  onChange: (id: string) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap rounded-[10px] bg-page p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={o.id === valeur}
          onClick={() => onChange(o.id)}
          className={cn(
            "rounded-lg px-3 py-1 text-xs transition-colors duration-150",
            o.id === valeur
              ? "bg-carte font-semibold text-accent-fonce shadow-sm"
              : "text-texte-secondaire hover:text-texte",
          )}
        >
          {o.libelle}
        </button>
      ))}
    </div>
  );
}
