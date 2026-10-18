/** Plus lointaine date butoir acceptée, en jours (même limite que l'API). */
export const MAX_DAYS = 365;

const DAY_MS = 86_400_000;

/** « 2026-10-31 » → date locale à minuit (évite le décalage de fuseau de `new Date('2026-10-31')`). */
export function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function toIsoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Nombre de jours entre aujourd'hui et la date donnée (négatif si elle est passée). */
export function daysUntil(iso: string, now: Date = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((parseIsoDate(iso).getTime() - today.getTime()) / DAY_MS);
}

/** « 2026-10-31 » → « sam. 31/10 ». */
export function formatDay(iso: string): string {
  return parseIsoDate(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' });
}
