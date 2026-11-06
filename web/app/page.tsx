// Page de test de la tâche D2 : montre chaque couleur, rayon, ombre et taille de texte.
// Provisoire : elle sera remplacée par l'accueil (tâche E2).

const couleurs = [
  { nom: "Fond de page", classe: "bg-page", hex: "#EAF6FA" },
  { nom: "Fond de zone", classe: "bg-zone", hex: "#DCEFF6" },
  { nom: "Carte", classe: "bg-carte border border-separateur", hex: "#FFFFFF" },
  { nom: "Texte principal", classe: "bg-texte", hex: "#1F2A37" },
  { nom: "Texte secondaire", classe: "bg-texte-secondaire", hex: "#5B6675" },
  { nom: "Séparateur", classe: "bg-separateur", hex: "#C9D3DA" },
  { nom: "Accent principal", classe: "bg-accent-principal", hex: "#2A9DB0" },
  { nom: "Accent foncé", classe: "bg-accent-fonce", hex: "#1B6F7E" },
  { nom: "Accent clair", classe: "bg-accent-clair", hex: "#9ED3DE" },
  { nom: "Positif", classe: "bg-positif", hex: "#2E9E5B" },
  { nom: "Négatif", classe: "bg-negatif", hex: "#D64545" },
  { nom: "Neutre", classe: "bg-neutre", hex: "#F2B84B" },
];

const series = [
  "bg-serie-1",
  "bg-serie-2",
  "bg-serie-3",
  "bg-serie-4",
  "bg-serie-5",
  "bg-serie-6",
  "bg-serie-7",
  "bg-serie-8",
];

export default function PageTest() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-8">
      <h1 className="text-2xl font-semibold">Test du design (D2)</h1>

      <section className="rounded-carte bg-carte p-6 shadow-carte">
        <h2 className="mb-4 text-base font-semibold">Couleurs</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {couleurs.map((c) => (
            <div key={c.nom}>
              <div className={`h-14 rounded-lg ${c.classe}`} />
              <p className="mt-1 text-sm font-medium">{c.nom}</p>
              <p className="text-xs text-texte-secondaire">{c.hex}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-carte bg-carte p-6 shadow-carte">
        <h2 className="mb-4 text-base font-semibold">Séries de graphiques (dans l&apos;ordre)</h2>
        <div className="flex gap-2">
          {series.map((s, i) => (
            <div key={s} className="flex-1 text-center text-xs text-texte-secondaire">
              <div className={`h-10 rounded-lg ${s}`} />
              {i + 1}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        <div
          className="rounded-carte p-6 text-white shadow-carte"
          style={{ background: "var(--degrade-1)" }}
        >
          <p className="text-sm">Carte vedette 1</p>
          <p className="text-[32px] font-semibold">12 345,67</p>
        </div>
        <div
          className="rounded-carte p-6 text-texte shadow-carte"
          style={{ background: "var(--degrade-2)" }}
        >
          <p className="text-sm">Carte vedette 2</p>
          <p className="text-[32px] font-semibold">12 345,67</p>
        </div>
      </section>

      <section className="rounded-carte bg-carte p-6 shadow-carte">
        <h2 className="mb-4 text-base font-semibold">Textes, formes et chiffres alignés</h2>
        <p className="text-[32px] font-semibold">32 px : chiffre KPI</p>
        <p className="text-2xl font-semibold">24 px : titre de page</p>
        <p className="text-base font-semibold">16 px : titre de carte</p>
        <p className="text-sm">14 px : texte courant (carte 16 px, bouton 10 px)</p>
        <p className="text-xs text-texte-secondaire">12 px : légende</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="rounded-lg bg-positif/15 px-3 py-1 font-medium text-positif">+12,3 %</span>
          <span className="rounded-lg bg-negatif/15 px-3 py-1 font-medium text-negatif">−8,0 %</span>
          <span className="rounded-lg bg-accent-principal px-4 py-2 text-white">Bouton (10 px)</span>
        </div>
        <div className="mt-4 w-40 text-right">
          <p>1 111,11</p>
          <p>8 888,88</p>
          <p>6 543,21</p>
        </div>
      </section>
    </main>
  );
}
