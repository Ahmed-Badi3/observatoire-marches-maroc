import { formatNombre } from "@/lib/format";

// Carte de chaleur des corrélations : plus la case est foncée, plus les deux placements bougent ensemble.
// Chaque case écrit sa valeur : la couleur n'est jamais seule à porter l'information.
export type CelluleChaleur = { ligne: string; colonne: string; valeur: number | null };

function fond(v: number | null): string {
  if (v === null) return "transparent";
  const intensite = Math.min(Math.abs(v), 1);
  const base = v >= 0 ? "42, 157, 176" : "214, 69, 69"; // accent principal / négatif
  return `rgba(${base}, ${0.08 + intensite * 0.82})`;
}

export function CarteChaleur({
  etiquettes,
  cellules,
  legende,
}: {
  etiquettes: string[];
  cellules: CelluleChaleur[];
  legende: string;
}) {
  const valeur = (l: string, c: string) =>
    cellules.find((x) => x.ligne === l && x.colonne === c)?.valeur ?? null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-separate border-spacing-1 text-xs">
        <caption className="sr-only">{legende}</caption>
        <thead>
          <tr>
            <td />
            {etiquettes.map((e) => (
              <th key={e} scope="col" className="px-1 pb-1 text-center font-medium text-texte-secondaire">
                {e}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {etiquettes.map((l) => (
            <tr key={l}>
              <th scope="row" className="whitespace-nowrap pr-2 text-right font-medium text-texte-secondaire">
                {l}
              </th>
              {etiquettes.map((c) => {
                const v = valeur(l, c);
                const fort = v !== null && Math.abs(v) > 0.6;
                return (
                  <td
                    key={c}
                    className={`rounded-md py-3 text-center font-semibold tabular-nums ${fort ? "text-white" : "text-texte"}`}
                    style={{ background: fond(v) }}
                  >
                    {formatNombre(v)}
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
