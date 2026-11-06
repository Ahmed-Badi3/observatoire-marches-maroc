// Carte de résultat : numéro du résultat (1 à 18), phrase courte, chiffre mis en avant.
// Dans les pages de module, elle occupe 1/3 de la largeur, à gauche du graphique.
export function CarteResultat({
  numero,
  phrase,
  chiffre,
  legende,
}: {
  numero: number;
  phrase: string;
  chiffre: string;
  legende?: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-carte bg-carte p-6 shadow-carte">
      <span className="inline-flex w-fit rounded-lg bg-page px-3 py-1 text-xs font-semibold text-accent-fonce">
        Résultat {numero}
      </span>
      <p className="text-base font-semibold text-texte">{phrase}</p>
      <p className="text-[32px] font-semibold leading-tight text-accent-fonce">{chiffre}</p>
      {legende && <p className="text-xs text-texte-secondaire">{legende}</p>}
    </div>
  );
}
