import { formatPourcentage } from "@/lib/format";

// Barre empilée horizontale (Priorité 8, lot C) : la composition de chaque portefeuille type.
// Image : une tablette de chocolat coupée en morceaux de tailles différentes, un par placement.
// Chaque morceau a la largeur de son poids, lu en base (analytics.compositions_portefeuilles, déjà en %).
// Le poids est écrit dans le morceau : la couleur n'est jamais seule à porter l'information.

export type Segment = { cle: string; valeur: number | string | null; couleur: string; texte?: string };

export function BarreEmpilee({
  barres,
  legende,
  description,
}: {
  barres: { libelle: string; segments: Segment[] }[];
  legende: { cle: string; couleur: string }[];
  description: string;
}) {
  return (
    <figure className="space-y-3" aria-label={description}>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-texte-secondaire">
        {legende.map((l) => (
          <span key={l.cle} className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: l.couleur }} aria-hidden="true" />
            {l.cle}
          </span>
        ))}
      </div>
      {barres.map((b) => (
        <div key={b.libelle} className="space-y-1">
          <p className="text-sm font-medium text-texte">{b.libelle}</p>
          <div className="flex h-9 overflow-hidden rounded-[10px]">
            {b.segments.map((s) => {
              const largeur = Math.max(0, Number(s.valeur) || 0);
              return (
                <div
                  key={s.cle}
                  className="flex items-center justify-center text-xs font-semibold"
                  style={{ width: `${largeur}%`, background: s.couleur, color: s.texte ?? "white" }}
                  title={`${s.cle} : ${formatPourcentage(s.valeur, { decimales: 0, signe: false })}`}
                >
                  {formatPourcentage(s.valeur, { decimales: 0, signe: false })}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </figure>
  );
}
