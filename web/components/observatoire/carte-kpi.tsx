import { Variation, type Ton } from "./variation";

// Mini-courbe (sparkline) en SVG pur : une ligne sans axes, pour voir la tendance d'un coup d'œil.
function MiniCourbe({ serie }: { serie: number[] }) {
  if (serie.length < 2) return null;
  const min = Math.min(...serie);
  const max = Math.max(...serie);
  const ecart = max - min || 1;
  const points = serie
    .map((v, i) => {
      const x = (i / (serie.length - 1)) * 100;
      const y = 30 - ((v - min) / ecart) * 28; // 1 px de marge en haut et en bas
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-10 w-full" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke="var(--accent-principal)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Carte KPI : libellé, grand chiffre, pastille de variation, mini-courbe.
// `valeur` et `variation.texte` arrivent DÉJÀ formatés (lib/format.ts) : la carte n'invente rien.
export function CarteKpi({
  libelle,
  valeur,
  variation,
  serie,
}: {
  libelle: string;
  valeur: string;
  variation?: { texte: string; ton: Ton };
  serie?: number[];
}) {
  return (
    <div className="flex flex-col gap-2 rounded-carte bg-carte p-6 shadow-carte">
      <p className="text-sm text-texte-secondaire">{libelle}</p>
      <p className="text-[32px] font-semibold leading-tight text-texte">{valeur}</p>
      {variation && (
        <div>
          <Variation texte={variation.texte} ton={variation.ton} />
        </div>
      )}
      {serie && <MiniCourbe serie={serie} />}
    </div>
  );
}
