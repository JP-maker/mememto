import { Progress } from './lesson.model';

export type Grade = 'again' | 'hard' | 'good' | 'easy';

const MINUTE_MS = 60_000;
const DAY_MIN = 24 * 60;

/** Délai avant le retour d'une carte selon la réponse. */
export const GRADES: readonly { grade: Grade; label: string; delay: string; minutes: number }[] = [
  { grade: 'again', label: 'À revoir', delay: 'dans 10 min', minutes: 10 },
  { grade: 'hard', label: 'Difficile', delay: 'demain', minutes: DAY_MIN },
  { grade: 'good', label: 'Bien', delay: 'dans 3 jours', minutes: 3 * DAY_MIN },
  { grade: 'easy', label: 'Facile', delay: 'dans 7 jours', minutes: 7 * DAY_MIN },
];

/** Date de retour de la carte (ISO), à partir de maintenant. */
export function nextDue(grade: Grade, now: Date = new Date()): string {
  const minutes = GRADES.find((g) => g.grade === grade)!.minutes;
  return new Date(now.getTime() + minutes * MINUTE_MS).toISOString();
}

/** Une carte jamais vue, ou dont la date de retour est passée, est à revoir. */
export function isDue(progress: Progress | undefined, id: number, now: Date = new Date()): boolean {
  const due = progress?.[id];
  return !due || new Date(due).getTime() <= now.getTime();
}
