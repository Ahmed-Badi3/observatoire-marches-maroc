// Textes de la page « Méthode et sources » partagés avec l'assistant IA (Priorité 7) :
// l'assistant doit rappeler exactement les mêmes limites que la page.

export const LIMITES = [
  "Corrélation n'est pas causalité, et les fenêtres de quatre semaines qui se chevauchent surestiment la significativité.",
  "Le MASI exclut les dividendes, que les fonds Actions encaissent : la comparaison fonds / MASI avantage les fonds, et l'écart réel de gestion est plus défavorable aux fonds que celui affiché.",
  "L'historique gratuit du MASI est court, et la période étudiée contient deux années de forte hausse.",
  "La croissance du PIB est réelle (hors inflation), la variation du MASI est nominale : l'inflation de la période étant très basse, la comparaison n'en est presque pas faussée.",
  "Les PER et rendements du dividende sont des prévisions de sociétés de bourse, aux périmètres et méthodes différents.",
  "Peu de décisions de Bank Al-Maghrib dans la période : les conclusions sont fragiles.",
  "Le taux à 13 semaines dépend aussi des besoins de financement du Trésor, pas seulement des anticipations de taux.",
  "Peu d'introductions en bourse, saisies depuis la presse : aucun classement fiable.",
  "Les portefeuilles types sont des constructions théoriques à partir des indices de catégorie de l'AMMC ; ni frais d'entrée ni impôts.",
  "Le site décrit le passé : il ne prédit rien et ne constitue pas un conseil en investissement.",
];

// Définitions des indicateurs (page Méthode, et fiche de l'assistant IA). Formules seulement :
// les poids des portefeuilles types sont lus en base (analytics.compositions_portefeuilles).
export const DEFINITIONS: [string, string][] = [
  [
    "Rendement annualisé",
    "Le rendement de la période ramené à une année, pour comparer des durées différentes.",
  ],
  [
    "Volatilité",
    "L'amplitude des variations : écart-type des rendements hebdomadaires (ou quotidiens), ramené à un an (× √52 ou × √252). Plus elle est élevée, plus le placement est risqué.",
  ],
  [
    "Pire baisse (drawdown)",
    "La plus forte chute depuis un plus haut atteint auparavant : ce qu'aurait perdu, au pire moment, quelqu'un qui avait acheté au sommet.",
  ],
  [
    "Ratio de Sharpe",
    "(rendement annualisé − rendement annualisé des fonds monétaires) ÷ volatilité : ce que rapporte chaque unité de risque prise en plus d'un placement sans risque. Le Monétaire vaut 0 par construction.",
  ],
  [
    "Corrélation",
    "De −1 à +1 : à quel point deux séries bougent ensemble. Barème du site : moins de 0,2 aucun lien, 0,2 à 0,4 lien faible, 0,4 à 0,7 lien net, 0,7 et plus lien fort.",
  ],
  [
    "Tracking error et ratio d'information",
    "Tracking error : à quel point un fonds s'écarte de son indice (volatilité de l'écart). Ratio d'information : écart moyen ÷ tracking error, ce que cet écart a rapporté (négatif : coûté).",
  ],
];

// Petit lexique pour les lecteurs non spécialistes.
export const LEXIQUE: [string, string][] = [
  ["OPCVM", "Fonds d'investissement (SICAV, FCP) : l'épargnant achète des parts, un gérant place l'argent."],
  ["Fonds monétaires", "OPCVM placés à très court terme (moins d'un an), presque sans risque."],
  ["OCT", "Fonds obligataires court terme : obligations de courte durée, peu sensibles aux taux."],
  ["OMLT", "Fonds obligataires moyen et long terme : obligations longues, sensibles aux variations de taux."],
  ["MASI, MASI 20", "Indices de la Bourse de Casablanca : toutes les sociétés cotées, ou les 20 plus grandes."],
  ["Point de base (pb)", "Un centième de point de pourcentage : +25 pb = +0,25 point."],
  ["PER", "Prix d'une action ÷ bénéfice par action : combien d'années de bénéfices on paie."],
  ["Sensibilité", "Perte approximative d'un fonds obligataire, en %, quand les taux montent d'un point."],
  ["R²", "Part des variations d'une série expliquée par une autre, de 0 à 1."],
  ["Séance", "Un jour d'ouverture de la Bourse."],
  ["Sursouscription", "Quand la demande d'actions lors d'une introduction en bourse dépasse l'offre : 34x = 34 fois plus de demande."],
];

