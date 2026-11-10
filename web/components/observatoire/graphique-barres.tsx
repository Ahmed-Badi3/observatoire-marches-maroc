"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { couleurSerie, enNombre, formateur, type FormatValeur, type Jeu } from "@/lib/graphiques";
import { InfoBulle, Legende } from "./graphique-commun";
import { Segments } from "./segments";

// Étiquette sous une barre, sur deux lignes quand elle contient une précision entre parenthèses :
// « 2026 (janv.–oct.) » devient « 2026 » puis, en dessous et plus petit, « (janv.–oct.) ».
// Image : le nom d'un produit sur une étiquette, et son grammage écrit plus petit juste en dessous.
// Sur deux lignes, cinq années tiennent côte à côte même sur un téléphone.
function EtiquetteX({ x, y, payload }: { x?: number; y?: number; payload?: { value: unknown } }) {
  const texte = String(payload?.value ?? "");
  const coupure = texte.indexOf(" (");
  const ligne1 = coupure < 0 ? texte : texte.slice(0, coupure);
  const ligne2 = coupure < 0 ? null : texte.slice(coupure + 1);
  return (
    <text x={x} y={y} textAnchor="middle" fill="var(--texte-secondaire)">
      <tspan x={x} dy={12} fontSize={12}>
        {ligne1}
      </tspan>
      {ligne2 && (
        <tspan x={x} dy={14} fontSize={10}>
          {ligne2}
        </tspan>
      )}
    </text>
  );
}

// Graphique en barres arrondies en haut. Une seule série avec `colorerSigne` : vert si positif, rouge si négatif
// (le signe + ou − reste affiché dans l'info-bulle : la couleur n'est jamais seule).
export function GraphiqueBarres({
  jeux,
  cleX = "categorie",
  format = "nombre",
  empile = false,
  colorerSigne = false,
  decimalesAxe = 0,
  decimalesInfo,
  signeInfo,
  hauteur = 300,
  description,
  labelChoix = "Affichage",
}: {
  jeux: Jeu[];
  cleX?: string;
  format?: FormatValeur;
  empile?: boolean;
  colorerSigne?: boolean;
  decimalesAxe?: number;
  decimalesInfo?: number;
  signeInfo?: boolean;
  hauteur?: number;
  description: string;
  labelChoix?: string;
}) {
  const [jeuId, setJeuId] = useState(jeux[0]?.id);
  const [masquees, setMasquees] = useState<Set<string>>(new Set());
  const jeu = jeux.find((j) => j.id === jeuId) ?? jeux[0];

  if (!jeu || jeu.donnees.length === 0) {
    return <p className="py-8 text-sm text-texte-secondaire">Données indisponibles.</p>;
  }

  // Beaucoup de catégories : on incline les noms pour qu'ils restent tous lisibles.
  const nbX = jeu.donnees.length;
  const incline = nbX > 5;
  // Étiquettes avec précision (« 2026 (janv.–oct.) ») : deux lignes, sauf si les noms sont inclinés.
  const deuxLignes = !incline && jeu.donnees.some((r) => String(r[cleX]).includes(" ("));
  const libelles = Object.fromEntries(jeu.series.map((s) => [s.cle, s.libelle]));
  const formatInfo = formateur(format, { decimales: decimalesInfo, signe: signeInfo });
  const formatAxe = formateur(format, { decimales: decimalesAxe, signe: false });

  function basculer(cle: string) {
    setMasquees((actuel) => {
      const suivant = new Set(actuel);
      if (suivant.has(cle)) suivant.delete(cle);
      else suivant.add(cle);
      return suivant;
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Legende series={jeu.series} masquees={masquees} onBascule={basculer} />
        {jeux.length > 1 && (
          <Segments
            label={labelChoix}
            options={jeux.map((j) => ({ id: j.id, libelle: j.libelle }))}
            valeur={jeu.id}
            onChange={setJeuId}
          />
        )}
      </div>
      <div style={{ height: hauteur }} role="img" aria-label={description}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={jeu.donnees} margin={{ top: jeu.etiquettesHaut ? 28 : 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--separateur)" />
            <XAxis
              dataKey={cleX}
              tickFormatter={(v: string) => String(v)}
              tick={deuxLignes ? <EtiquetteX /> : { fontSize: 12, fill: "var(--texte-secondaire)" }}
              axisLine={false}
              tickLine={false}
              interval={nbX <= 12 ? 0 : "preserveStartEnd"}
              minTickGap={8}
              angle={incline ? -30 : 0}
              textAnchor={incline ? "end" : "middle"}
              height={incline ? 80 : deuxLignes ? 44 : 30}
            />
            <YAxis
              width={52}
              tickFormatter={formatAxe}
              tick={{ fontSize: 12, fill: "var(--texte-secondaire)" }}
              axisLine={false}
              tickLine={false}
            />
            <ReferenceLine y={0} stroke="var(--texte-secondaire)" />
            <Tooltip
              cursor={{ fill: "rgba(158, 211, 222, 0.25)" }}
              content={<InfoBulle formatValeur={formatInfo} libelles={libelles} typeX="texte" />}
            />
            {jeu.series.map((s, i) => (
              <Bar
                key={s.cle}
                dataKey={s.cle}
                name={s.libelle}
                fill={couleurSerie(s, i)}
                radius={[6, 6, 0, 0]}
                stackId={empile ? "pile" : undefined}
                hide={masquees.has(s.cle)}
                isAnimationActive={false}
              >
                {i === 0 && jeu.etiquettesHaut && (
                  <LabelList
                    dataKey={cleX}
                    content={(props: object) => {
                      const p = props as { x?: number | string; y?: number | string; width?: number | string; value?: unknown };
                      const texte = jeu.etiquettesHaut?.[String(p.value)];
                      if (!texte) return null;
                      return (
                        <text
                          x={Number(p.x) + Number(p.width) / 2}
                          y={Number(p.y) - 8}
                          textAnchor="middle"
                          fontSize={11}
                          fontWeight={600}
                          fill="var(--serie-2)"
                        >
                          {texte}
                        </text>
                      );
                    }}
                  />
                )}
                {colorerSigne &&
                  jeu.donnees.map((r, k) => {
                    const n = enNombre(r[s.cle]);
                    return <Cell key={k} fill={n !== null && n < 0 ? "var(--negatif)" : "var(--positif)"} />;
                  })}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
