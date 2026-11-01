import { MethodId } from './methods';

export type SessionType = 'LEARN' | 'REVIEW' | 'REST' | 'FINAL';

/** Un jour du plan, tel que renvoyé par l'API. `date` est au format AAAA-MM-JJ. */
export interface PlanDay {
  date: string;
  type: SessionType;
  minutes: number;
}

/** Phrase préparée par l'IA de l'utilisateur : le mot à cacher, trois faux choix (ou aucun) et des mots clés. */
export interface PreparedItem {
  sentence: string;
  answer: string;
  keywords: string[];
  distractors: string[];
}

/** Date de retour (ISO) de chaque carte, par identifiant d'élément. */
export type Progress = Record<number, string>;

export interface Lesson {
  /** Identifiant côté serveur ; absent tant que la leçon n'existe que sur cet appareil. */
  id?: string;
  title: string;
  text: string;
  method: MethodId;
  deadline: string;
  minutesPerDay: number;
  plan: PlanDay[];
  /** Jours du plan dont la séance est terminée (AAAA-MM-JJ). */
  done?: string[];
  progress?: Progress;
  /** Texte préparé par l'IA ; absent quand la préparation est automatique (découpage par phrases). */
  items?: PreparedItem[];
}
