"use client";

import { useLayoutEffect, useRef, useState } from "react";

// Chiffre qui défile jusqu'à sa valeur quand il apparaît à l'écran (Priorité 8, lot B).
// Image : le compteur d'une pompe à essence qui monte jusqu'au montant final.
//
// Le texte reçu est DÉJÀ formaté par lib/format.ts (« +42,7 % », « 18,0x », « 5 sur 6 »).
// On anime seulement le premier nombre du texte, en gardant ses décimales, son signe et ce qui l'entoure ;
// à la fin, on affiche exactement le texte reçu : l'animation ne peut jamais changer un chiffre.
// Pas d'animation si le texte contient plusieurs nombres (une fourchette), ni si le visiteur a demandé
// de réduire les animations (réglage du système), ni sans JavaScript : le texte final s'affiche alors directement.

const NOMBRE = /([+−-]?)(\d{1,3}(?:[   ]\d{3})*|\d+)(?:,(\d+))?/;
const DUREE_MS = 900;

function decouper(texte: string) {
  const tous = texte.match(new RegExp(NOMBRE.source, "g"));
  if (!tous || tous.length !== 1) return null; // aucun nombre, ou une fourchette « +41 pb à +88 pb »
  const m = NOMBRE.exec(texte);
  if (!m) return null;
  const entier = m[2].replace(/[   ]/g, "");
  const decimales = m[3]?.length ?? 0;
  const valeur = Number(`${entier}.${m[3] ?? "0"}`);
  if (!Number.isFinite(valeur)) return null;
  return {
    avant: texte.slice(0, m.index),
    signe: m[1],
    apres: texte.slice(m.index + m[0].length),
    valeur,
    decimales,
  };
}

function ecrire(n: number, decimales: number): string {
  return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: decimales, maximumFractionDigits: decimales })
    .format(n)
    .replace(/ /g, " "); // même espace des milliers que lib/format.ts
}

export function ChiffreAnime({ texte }: { texte: string }) {
  const [affiche, setAffiche] = useState(texte);
  const ref = useRef<HTMLSpanElement>(null);

  // useLayoutEffect : s'exécute avant que l'écran soit dessiné, donc pas de clignotement du chiffre final.
  useLayoutEffect(() => {
    const parties = decouper(texte);
    const reduire = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!parties || reduire || !ref.current || !("IntersectionObserver" in window)) {
      setAffiche(texte);
      return;
    }
    setAffiche(`${parties.avant}${parties.signe}${ecrire(0, parties.decimales)}${parties.apres}`);

    let image = 0;
    const observateur = new IntersectionObserver(([entree]) => {
      if (!entree.isIntersecting) return;
      observateur.disconnect();
      const debut = performance.now();
      const pas = (maintenant: number) => {
        const t = Math.min((maintenant - debut) / DUREE_MS, 1);
        const adouci = 1 - Math.pow(1 - t, 3); // ralentit à l'arrivée
        if (t < 1) {
          setAffiche(
            `${parties.avant}${parties.signe}${ecrire(parties.valeur * adouci, parties.decimales)}${parties.apres}`,
          );
          image = requestAnimationFrame(pas);
        } else {
          setAffiche(texte); // le texte exact reçu de lib/format.ts
        }
      };
      image = requestAnimationFrame(pas);
    });
    observateur.observe(ref.current);
    return () => {
      observateur.disconnect();
      cancelAnimationFrame(image);
    };
  }, [texte]);

  // Les lecteurs d'écran lisent toujours la valeur finale, jamais les étapes du défilement.
  return (
    <span ref={ref}>
      <span className="sr-only">{texte}</span>
      <span aria-hidden="true">{affiche}</span>
    </span>
  );
}
