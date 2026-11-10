// Jauge en demi-cercle pour un résultat en proportion (Priorité 8, lot B) : « 5 IPO sur 6 »,
// « 58 % du rendement du MASI ». Image : l'aiguille d'un compteur de vitesse.
// Dessin seulement : la proportion part / total sert à tracer l'arc, comme la hauteur d'une barre.
// Le chiffre lui-même est écrit à côté par la carte, déjà formaté (lib/format.ts).

const RAYON = 40;
const LONGUEUR_ARC = Math.PI * RAYON; // longueur du demi-cercle

export function Jauge({
  part,
  total,
  couleur = "currentColor",
  fond = "rgba(255, 255, 255, 0.35)",
  className,
}: {
  part: number | string | null | undefined;
  total: number | string | null | undefined;
  couleur?: string;
  fond?: string;
  className?: string;
}) {
  const p = Number(part);
  const t = Number(total);
  if (!Number.isFinite(p) || !Number.isFinite(t) || t <= 0) return null;
  const rempli = Math.max(0, Math.min(p / t, 1)) * LONGUEUR_ARC;
  const arc = `M ${50 - RAYON} 50 A ${RAYON} ${RAYON} 0 0 1 ${50 + RAYON} 50`;
  return (
    <svg viewBox="0 0 100 56" className={className} aria-hidden="true">
      <path d={arc} fill="none" stroke={fond} strokeWidth="10" strokeLinecap="round" />
      {/* Rien à remplir pour 0 : sinon le bout arrondi du trait dessinerait un point */}
      {rempli > 0 && <path
        d={arc}
        fill="none"
        stroke={couleur}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${rempli} ${LONGUEUR_ARC}`}
        className="jauge-remplissage"
      />}
    </svg>
  );
}
