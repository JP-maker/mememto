import { addDays, daysUntil, parseIsoDate, toIsoDate } from './dates';

describe('dates', () => {
  const now = new Date(2026, 9, 17, 18, 0); // 17 octobre 2026, 18 h

  it('compte les jours restants à partir de minuit', () => {
    expect(daysUntil('2026-10-31', now)).toBe(14);
    expect(daysUntil('2026-10-17', now)).toBe(0);
    expect(daysUntil('2026-10-10', now)).toBe(-7);
  });

  it("reste exact au passage à l'heure d'hiver (25 octobre 2026)", () => {
    expect(daysUntil('2026-11-01', now)).toBe(15);
  });

  it('convertit une date en texte et inversement', () => {
    expect(toIsoDate(parseIsoDate('2026-03-05'))).toBe('2026-03-05');
    expect(toIsoDate(addDays(now, 14))).toBe('2026-10-31');
  });
});
