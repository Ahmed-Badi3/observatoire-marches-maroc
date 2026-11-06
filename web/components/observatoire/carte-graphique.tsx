// Mise en page des pages de module (DESIGN.md) : carte de résultat à gauche (1/3),
// graphiques à droite (2/3), tableau détaillé en bas.

// Carte blanche autour d'un graphique. Le titre dit la CONCLUSION, pas le sujet.
export function CarteGraphique({
  titre,
  children,
  note,
}: {
  titre: string;
  children: React.ReactNode;
  note?: string;
}) {
  return (
    <section className="rounded-carte bg-carte p-5 shadow-carte sm:p-6">
      <h3 className="mb-4 text-base font-semibold text-texte">{titre}</h3>
      {children}
      {note && <p className="mt-3 text-xs text-texte-secondaire">{note}</p>}
    </section>
  );
}

export function Indisponible({ message = "Données indisponibles pour le moment." }: { message?: string }) {
  return (
    <p className="rounded-carte bg-carte p-6 text-sm text-texte-secondaire shadow-carte">{message}</p>
  );
}

export function MiseEnPageResultat({
  carte,
  graphiques,
  tableau,
}: {
  carte: React.ReactNode;
  graphiques: React.ReactNode;
  tableau?: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="grid items-start gap-6 lg:grid-cols-3">
        {carte}
        <div className="space-y-6 lg:col-span-2">{graphiques}</div>
      </div>
      {tableau}
    </div>
  );
}

// Titre de page : une phrase de conclusion sous le titre de la barre du haut.
export function ConclusionPage({ children }: { children: React.ReactNode }) {
  return <p className="mb-6 max-w-3xl text-base leading-relaxed text-texte">{children}</p>;
}

export function TitreTableau({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 text-base font-semibold text-texte">{children}</h3>;
}
