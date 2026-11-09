import { CONSIGNES, construireFiche } from "@/lib/assistant";

// Route serveur de l'assistant IA (Priorité 7). Le navigateur envoie une question ; le serveur ajoute la
// fiche de résultats et les consignes, appelle Gemini avec la clé GEMINI_API_KEY (web/.env.local et
// variables de Vercel), puis renvoie la réponse. La clé ne quitte jamais le serveur.
//
// Protections :
// - question de 500 caractères au plus ; seuls les 6 derniers messages de la conversation sont renvoyés ;
// - 10 questions par heure et par visiteur, 300 par jour pour tout le site.
//   Limite connue : ces compteurs vivent dans la mémoire du serveur. Sur Vercel, ils repartent parfois
//   de zéro (nouvelle instance). Le quota gratuit de Gemini reste de toute façon le vrai plafond : coût 0 €.

export const maxDuration = 30; // secondes : le modèle peut mettre quelques secondes à répondre

const LONGUEUR_MAX = 500;
const PAR_HEURE_PAR_VISITEUR = 10;
const PAR_JOUR_TOTAL = 300;
const MESSAGES_GARDES = 6;
const MODELE = process.env.GEMINI_MODELE ?? "gemini-3.5-flash-lite"; // même modèle que l'agent n8n

type Message = { role: "utilisateur" | "assistant"; texte: string };

const demandesParVisiteur = new Map<string, number[]>();
let jourCourant = "";
let demandesDuJour = 0;

function reponse(texte: string, statut = 200) {
  return Response.json({ reponse: texte }, { status: statut });
}

// Vrai si le visiteur (ou le site) a dépassé sa limite ; sinon, compte la demande.
function limiteAtteinte(visiteur: string): boolean {
  const maintenant = Date.now();
  const aujourdHui = new Date(maintenant).toISOString().slice(0, 10);
  if (aujourdHui !== jourCourant) {
    jourCourant = aujourdHui;
    demandesDuJour = 0;
  }
  const recentes = (demandesParVisiteur.get(visiteur) ?? []).filter((t) => maintenant - t < 3_600_000);
  if (recentes.length >= PAR_HEURE_PAR_VISITEUR || demandesDuJour >= PAR_JOUR_TOTAL) return true;
  recentes.push(maintenant);
  demandesParVisiteur.set(visiteur, recentes);
  demandesDuJour += 1;
  return false;
}

export async function POST(requete: Request) {
  const cle = process.env.GEMINI_API_KEY;
  if (!cle) return reponse("L'assistant n'est pas configuré sur ce serveur.", 503);

  let question = "";
  let historique: Message[] = [];
  try {
    const corps = (await requete.json()) as { question?: unknown; historique?: unknown };
    question = typeof corps.question === "string" ? corps.question.trim() : "";
    if (Array.isArray(corps.historique)) {
      historique = corps.historique
        .filter(
          (m): m is Message =>
            !!m &&
            (m.role === "utilisateur" || m.role === "assistant") &&
            typeof m.texte === "string",
        )
        .slice(-MESSAGES_GARDES)
        .map((m) => ({ role: m.role, texte: m.texte.slice(0, 2000) }));
    }
  } catch {
    return reponse("Requête illisible.", 400);
  }
  if (!question) return reponse("Posez une question sur les données du site.", 400);
  if (question.length > LONGUEUR_MAX) {
    return reponse(`Votre question est trop longue (${LONGUEUR_MAX} caractères au plus).`, 400);
  }

  const visiteur = requete.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "inconnu";
  if (limiteAtteinte(visiteur)) {
    return reponse("Trop de questions pour le moment : réessayez dans une heure.", 429);
  }

  let fiche: string;
  try {
    fiche = await construireFiche();
  } catch (erreur) {
    console.error("Assistant : lecture des données impossible :", erreur);
    return reponse("Les données du site sont momentanément indisponibles.", 503);
  }

  // Format de l'API Gemini (generateContent) : les consignes et la fiche dans systemInstruction,
  // la conversation dans contents. Appel HTTPS direct : aucune dépendance à installer.
  const corps = {
    systemInstruction: { parts: [{ text: `${CONSIGNES}\n\nFiche de résultats (JSON) :\n${fiche}` }] },
    contents: [
      ...historique.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.texte }] })),
      { role: "user", parts: [{ text: question }] },
    ],
    generationConfig: { temperature: 0.2, maxOutputTokens: 700 },
  };

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODELE}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": cle },
        body: JSON.stringify(corps),
        signal: AbortSignal.timeout(25_000),
      },
    );
    if (r.status === 429) {
      return reponse("L'assistant a atteint son quota gratuit : réessayez un peu plus tard.", 429);
    }
    if (!r.ok) {
      console.error("Assistant : Gemini a répondu", r.status, await r.text());
      return reponse("L'assistant ne peut pas répondre pour le moment.", 502);
    }
    const donnees = (await r.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const texte = donnees.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
    return reponse(texte || "Je ne sais pas : ce n'est pas dans les données du site.");
  } catch (erreur) {
    console.error("Assistant : appel à Gemini impossible :", erreur);
    return reponse("L'assistant ne peut pas répondre pour le moment.", 502);
  }
}
