"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircleQuestion, Send, X } from "lucide-react";

import { cn } from "@/lib/utils";

// Panneau de l'assistant IA (Priorité 7). Un bouton rond en bas à droite de chaque page ouvre un panneau
// de discussion. Le navigateur n'envoie que la question et les derniers messages à /api/assistant :
// la clé d'API et la fiche de résultats restent sur le serveur.

type Message = { role: "utilisateur" | "assistant"; texte: string };

const SUGGESTIONS = [
  "Quel placement a le mieux résisté cette année ?",
  "Les épargnants achètent-ils au bon moment ?",
  "Pourquoi le MASI a-t-il plusieurs rendements différents ?",
  "Les introductions en bourse ont-elles été rentables ?",
];
const LONGUEUR_MAX = 500; // même limite que la route serveur

export function Assistant() {
  const [ouvert, setOuvert] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [saisie, setSaisie] = useState("");
  const [enCours, setEnCours] = useState(false);
  const champ = useRef<HTMLTextAreaElement>(null);
  const fin = useRef<HTMLDivElement>(null);

  // Échap ferme le panneau ; à l'ouverture, le curseur va dans le champ de saisie.
  useEffect(() => {
    if (!ouvert) return;
    champ.current?.focus();
    const surTouche = (e: KeyboardEvent) => e.key === "Escape" && setOuvert(false);
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [ouvert]);

  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, enCours]);

  async function envoyer(question: string) {
    const q = question.trim();
    if (!q || enCours) return;
    const historique = messages;
    setMessages([...historique, { role: "utilisateur", texte: q }]);
    setSaisie("");
    setEnCours(true);
    try {
      const r = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, historique }),
      });
      const donnees = (await r.json()) as { reponse?: string };
      setMessages((m) => [
        ...m,
        { role: "assistant", texte: donnees.reponse ?? "L'assistant ne peut pas répondre pour le moment." },
      ]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", texte: "Connexion impossible : réessayez dans un instant." }]);
    } finally {
      setEnCours(false);
    }
  }

  return (
    <>
      {!ouvert && (
        <button
          type="button"
          onClick={() => setOuvert(true)}
          className="fixed right-4 bottom-4 z-40 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-carte transition-transform hover:scale-105 sm:right-8 sm:bottom-8"
          style={{ background: "var(--menu-fond)" }}
        >
          <MessageCircleQuestion className="size-5" aria-hidden="true" />
          Poser une question
        </button>
      )}

      {ouvert && (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby="assistant-titre"
          className="fixed inset-x-2 bottom-2 z-50 flex max-h-[85vh] flex-col overflow-hidden rounded-carte bg-carte shadow-carte sm:inset-x-auto sm:right-8 sm:bottom-8 sm:w-[26rem]"
        >
          <div className="flex items-start justify-between gap-3 p-4 text-white" style={{ background: "var(--menu-fond)" }}>
            <div>
              <p id="assistant-titre" className="font-semibold">
                Questionner les données
              </p>
              <p className="text-xs text-white/90">
                Répond à partir des résultats du site seulement. Pas de conseil d&apos;investissement.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOuvert(false)}
              aria-label="Fermer l'assistant"
              className="rounded-lg p-1 hover:bg-white/15"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm" aria-live="polite">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-texte-secondaire">Quelques idées de questions :</p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => envoyer(s)}
                    className="block w-full rounded-[10px] border border-separateur px-3 py-2 text-left text-texte transition-colors hover:border-accent-principal hover:bg-page"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <p
                key={i}
                className={cn(
                  "max-w-[90%] whitespace-pre-wrap rounded-[12px] px-3 py-2 leading-relaxed",
                  m.role === "utilisateur" ? "ml-auto bg-accent-fonce text-white" : "bg-page text-texte",
                )}
              >
                {m.texte}
              </p>
            ))}
            {enCours && <p className="text-texte-secondaire">L&apos;assistant lit les données…</p>}
            <div ref={fin} />
          </div>

          <form
            className="flex items-end gap-2 border-t border-separateur p-3"
            onSubmit={(e) => {
              e.preventDefault();
              envoyer(saisie);
            }}
          >
            <label htmlFor="assistant-question" className="sr-only">
              Votre question
            </label>
            <textarea
              id="assistant-question"
              ref={champ}
              value={saisie}
              onChange={(e) => setSaisie(e.target.value.slice(0, LONGUEUR_MAX))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  envoyer(saisie);
                }
              }}
              rows={2}
              placeholder="Votre question sur les données du site…"
              className="flex-1 resize-none rounded-[10px] border border-separateur px-3 py-2 text-sm text-texte outline-none focus:border-accent-principal"
            />
            <button
              type="submit"
              disabled={enCours || !saisie.trim()}
              aria-label="Envoyer la question"
              className="rounded-[10px] bg-accent-fonce p-2.5 text-white disabled:opacity-40"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
