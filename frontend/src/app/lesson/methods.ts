export type MethodId = 'ACTIVE_RECALL' | 'SPACED_REPETITION' | 'FEYNMAN';

export interface Method {
  readonly id: MethodId;
  readonly label: string;
  /** Une phrase affichée sur la carte de choix. */
  readonly summary: string;
  /** Consigne proposée dans le plan selon le type de séance. */
  readonly tasks: { readonly learn: string; readonly review: string; readonly lastReview: string };
}

export const METHODS: readonly Method[] = [
  {
    id: 'ACTIVE_RECALL',
    label: 'Rappel actif',
    summary: 'Écrire de mémoire, puis comparer.',
    tasks: {
      learn: 'Lis la leçon deux fois, puis écris-la de mémoire',
      review: 'Écris de mémoire, compare, corrige',
      lastReview: 'Écris de mémoire sans relire avant',
    },
  },
  {
    id: 'SPACED_REPETITION',
    label: 'Répétition espacée',
    summary: 'Cartes qui reviennent selon tes erreurs.',
    tasks: {
      learn: 'Crée tes cartes et fais un premier tour',
      review: "Cartes dues aujourd'hui",
      lastReview: 'Cartes dues, en insistant sur les ratées',
    },
  },
  {
    id: 'FEYNMAN',
    label: 'Technique de Feynman',
    summary: 'Expliquer avec tes mots.',
    tasks: {
      learn: 'Explique chaque partie avec tes mots',
      review: 'Réexplique en repérant tes hésitations',
      lastReview: "Explique l'ensemble à voix haute, sans notes",
    },
  },
];
