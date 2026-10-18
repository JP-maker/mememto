import { isDue, nextDue } from './schedule';

describe('schedule', () => {
  const now = new Date('2026-10-18T10:00:00Z');

  it('programme le retour selon la réponse', () => {
    expect(nextDue('again', now)).toBe('2026-10-18T10:10:00.000Z');
    expect(nextDue('hard', now)).toBe('2026-10-19T10:00:00.000Z');
    expect(nextDue('good', now)).toBe('2026-10-21T10:00:00.000Z');
    expect(nextDue('easy', now)).toBe('2026-10-25T10:00:00.000Z');
  });

  it('considère une carte jamais vue comme à revoir', () => {
    expect(isDue(undefined, 0, now)).toBe(true);
    expect(isDue({}, 0, now)).toBe(true);
  });

  it('attend la date de retour', () => {
    const progress = { 0: '2026-10-19T10:00:00.000Z' };
    expect(isDue(progress, 0, now)).toBe(false);
    expect(isDue(progress, 0, new Date('2026-10-19T10:00:00Z'))).toBe(true);
  });
});
