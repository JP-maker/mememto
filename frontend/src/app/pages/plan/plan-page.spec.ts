import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { toIsoDate, addDays } from '../../lesson/dates';
import { LessonStore } from '../../lesson/lesson.store';
import { PlanPage } from './plan-page';

describe('PlanPage', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [PlanPage], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] }).compileComponents();
  });

  async function render(): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(PlanPage);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('invite à ajouter une leçon quand il n’y en a pas', async () => {
    const page = await render();
    expect(page.textContent).toContain('Pas encore de plan');
  });

  it('affiche un jour par ligne avec la consigne de la méthode choisie', async () => {
    const today = new Date();
    TestBed.inject(LessonStore).save({
      title: 'Histoire',
      text: 'texte',
      method: 'SPACED_REPETITION',
      deadline: toIsoDate(addDays(today, 2)),
      minutesPerDay: 20,
      plan: [
        { date: toIsoDate(today), type: 'LEARN', minutes: 20 },
        { date: toIsoDate(addDays(today, 1)), type: 'REVIEW', minutes: 10 },
        { date: toIsoDate(addDays(today, 2)), type: 'FINAL', minutes: 20 },
      ],
    });
    const page = await render();

    const rows = Array.from(page.querySelectorAll('.day')).map((r) => r.textContent!.replace(/\s+/g, ' ').trim());
    expect(rows.length).toBe(3);
    expect(rows[0]).toContain("Aujourd'hui");
    expect(rows[0]).toContain('Crée tes cartes');
    expect(rows[1]).toContain('Cartes dues, en insistant sur les ratées'); // la veille de la date butoir
    expect(rows[2]).toContain('jour J');
    expect(page.querySelector('.label')?.textContent).toContain('Répétition espacée');
  });

  it('permet de relire le texte saisi', async () => {
    TestBed.inject(LessonStore).save({
      title: 'Histoire',
      text: 'Premier vers\nSecond vers',
      method: 'ACTIVE_RECALL',
      deadline: toIsoDate(addDays(new Date(), 2)),
      minutesPerDay: 20,
      plan: [{ date: toIsoDate(new Date()), type: 'LEARN', minutes: 20 }],
    });
    const page = await render();
    expect(page.querySelector('details.text summary')?.textContent).toContain('Revoir ma leçon');
    expect(page.querySelector('details.text p')?.textContent).toBe('Premier vers\nSecond vers');
  });

  it('propose de relancer la leçon à côté d’un jour fait', async () => {
    const today = toIsoDate(new Date());
    TestBed.inject(LessonStore).save({
      title: 'Histoire',
      text: 'texte',
      method: 'ACTIVE_RECALL',
      deadline: toIsoDate(addDays(new Date(), 2)),
      minutesPerDay: 20,
      plan: [{ date: today, type: 'LEARN', minutes: 20 }, { date: toIsoDate(addDays(new Date(), 1)), type: 'REVIEW', minutes: 10 }],
      done: [today],
    });
    const page = await render();
    const links = page.querySelectorAll('a.redo');
    expect(links).toHaveLength(1); // seulement sur le jour fait
    expect(links[0].getAttribute('href')).toBe('/seance?mode=libre');
  });
});
