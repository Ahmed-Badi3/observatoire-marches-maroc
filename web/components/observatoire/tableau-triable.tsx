"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  MANQUANT,
  formatDateCourte,
  formatMilliards,
  formatMultiple,
  formatNombre,
  formatPoints,
  formatPointsDeBase,
  formatPourcentage,
} from "@/lib/format";
import { interpreterCorrelation } from "@/lib/interpretation";
import { COULEUR_TEXTE_TON, tonDe } from "./variation";

// Tableau triable. Une page serveur ne peut pas envoyer de fonctions à un composant client :
// les colonnes sont donc décrites par des DONNÉES (un `type`), et c'est le tableau qui appelle
// les fonctions de format de lib/format.ts. Les lignes contiennent les valeurs brutes de la base.

export type TypeColonne =
  | "texte"
  | "nombre"
  | "pourcentage"
  | "points"
  | "pb"
  | "multiple"
  | "milliards"
  | "correlation" // chiffre + mot d'interprétation (« lien net »), trié sur le chiffre
  | "date";

export type Colonne = {
  cle: string;
  libelle: string;
  type?: TypeColonne;
  decimales?: number;
  signe?: boolean; // afficher le + (défaut : oui pour %, pts, pb, Md ; non pour un nombre). Mettre false pour un risque
  colore?: boolean; // vert si positif, rouge si négatif
};

export type Ligne = Record<string, string | number | null>;
type Tri = { cle: string; sens: "asc" | "desc" };

const NUMERIQUES: TypeColonne[] = ["nombre", "pourcentage", "points", "pb", "multiple", "milliards", "correlation"];

function formater(col: Colonne, v: string | number | null): string {
  switch (col.type ?? "texte") {
    case "nombre":
      return formatNombre(v, { decimales: col.decimales, signe: col.signe });
    case "correlation":
      return formatNombre(v, { decimales: col.decimales ?? 2, signe: col.signe ?? true });
    case "pourcentage":
      return formatPourcentage(v, { decimales: col.decimales, signe: col.signe });
    case "points":
      return formatPoints(v, { decimales: col.decimales, signe: col.signe });
    case "pb":
      return formatPointsDeBase(v, { decimales: col.decimales, signe: col.signe });
    case "multiple":
      return formatMultiple(v, { decimales: col.decimales });
    case "milliards":
      return formatMilliards(v, { decimales: col.decimales, signe: col.signe });
    case "date":
      return formatDateCourte(typeof v === "string" ? v : null);
    default:
      return v === null || v === "" ? MANQUANT : String(v);
  }
}

// Valeurs manquantes toujours en bas, quel que soit le sens du tri.
function comparer(col: Colonne, a: Ligne, b: Ligne, sens: 1 | -1): number {
  const va = a[col.cle];
  const vb = b[col.cle];
  const aVide = va === null || va === "" || va === undefined;
  const bVide = vb === null || vb === "" || vb === undefined;
  if (aVide || bVide) return aVide === bVide ? 0 : aVide ? 1 : -1;
  if (NUMERIQUES.includes(col.type ?? "texte")) return (Number(va) - Number(vb)) * sens;
  return String(va).localeCompare(String(vb), "fr") * sens; // les dates AAAA-MM-JJ se trient comme du texte
}

export function TableauTriable({
  colonnes,
  lignes,
  legende,
  triInitial,
  hauteurMax,
}: {
  colonnes: Colonne[];
  lignes: Ligne[];
  legende: string; // décrit le tableau aux lecteurs d'écran
  triInitial?: Tri;
  hauteurMax?: string; // ex. "24rem" : l'en-tête reste collé en haut pendant le défilement
}) {
  const [tri, setTri] = useState<Tri | undefined>(triInitial);

  const lignesTriees = useMemo(() => {
    if (!tri) return lignes;
    const col = colonnes.find((c) => c.cle === tri.cle);
    if (!col) return lignes;
    const sens = tri.sens === "asc" ? 1 : -1;
    return [...lignes].sort((a, b) => comparer(col, a, b, sens));
  }, [lignes, colonnes, tri]);

  function trierPar(cle: string) {
    setTri((actuel) =>
      actuel?.cle === cle
        ? { cle, sens: actuel.sens === "asc" ? "desc" : "asc" }
        : { cle, sens: "desc" },
    );
  }

  return (
    <div
      className="overflow-auto rounded-carte bg-carte shadow-carte"
      style={hauteurMax ? { maxHeight: hauteurMax } : undefined}
    >
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{legende}</caption>
        <thead>
          <tr>
            {colonnes.map((col) => {
              const numerique = NUMERIQUES.includes(col.type ?? "texte");
              const actif = tri?.cle === col.cle;
              return (
                <th
                  key={col.cle}
                  scope="col"
                  aria-sort={actif ? (tri.sens === "asc" ? "ascending" : "descending") : "none"}
                  className="sticky top-0 border-b border-separateur bg-carte px-4 py-3 font-semibold text-texte-secondaire"
                >
                  <button
                    type="button"
                    onClick={() => trierPar(col.cle)}
                    className={cn(
                      // Les intitulés longs (« Flux net ↔ rendement… ») passent sur deux lignes au lieu d'élargir le tableau
                      "inline-flex w-full items-center gap-1 transition-colors duration-150 hover:text-texte",
                      numerique ? "justify-end text-right" : "justify-start text-left",
                      col.libelle.length > 24 && "min-w-[11rem]",
                      actif && "text-accent-fonce",
                    )}
                  >
                    {col.libelle}
                    {actif ? (
                      tri.sens === "asc" ? (
                        <ArrowUp className="size-3.5" />
                      ) : (
                        <ArrowDown className="size-3.5" />
                      )
                    ) : (
                      <ChevronsUpDown className="size-3.5 opacity-40" />
                    )}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {lignesTriees.map((ligne, i) => (
            <tr key={i} className="even:bg-page/50">
              {colonnes.map((col) => {
                const numerique = NUMERIQUES.includes(col.type ?? "texte");
                const v = ligne[col.cle] ?? null;
                return (
                  <td
                    key={col.cle}
                    className={cn(
                      "whitespace-nowrap px-4 py-2.5",
                      numerique ? "text-right" : "text-left",
                      col.colore && COULEUR_TEXTE_TON[tonDe(v)],
                      col.colore && "font-medium",
                    )}
                  >
                    {formater(col, v)}
                    {col.type === "correlation" && interpreterCorrelation(v) && (
                      <span className="ml-1.5 text-xs font-normal text-texte-secondaire">
                        · {interpreterCorrelation(v)}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
