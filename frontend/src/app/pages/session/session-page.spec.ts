import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { addDays, toIsoDate } from '../../lesson/dates';
import { Lesson } from '../../lesson/lesson.model';
import { LessonStore } from '../../lesson/lesson.store';
import { MethodId } from '../../lesson/methods';
import { SessionPage } from './session-page';

const TEXT =
  'La photosynthèse transforme la lumière en énergie chimique. Les chloroplastes contiennent la chlorophylle verte. ' +
  'Le dioxyde de carbone entre par les stomates des feuilles. Le glucose produit nourrit toute la plante.';

function lesson(method: MethodId, type: 'LEARN' | 'REST' = 'LEARN', text = TEXT): Lesson {
  const today = new Date();
  return {
    title: 'Biologie',
    text,
    method,
    deadline: toIsoDate(addDays(today, 3)),
    minutesPerDay: 20,
    plan: [
      { date: toIsoDate(today), type, minutes: 20 },
      { date: toIsoDate(addDays(today, 1)), type: 'REVIEW', minutes: 10 },
    ],
  };
}

describe('SessionPage', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [SessionPage], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] }).compileComponents();
  });

  async function render(): Promise<{ el: HTMLElement; fixture: ReturnType<typeof TestBed.createComponent<SessionPage>> }> {
    const fixture = TestBed.createComponent(SessionPage);
    await fixture.whenStable();
    return { el: fixture.nativeElement as HTMLElement, fixture };
  }

  it('invite à ajouter une leçon quand il n’y en a pas', async () => {
    const { el } = await render();
    expect(el.textContent).toContain('Pas encore de séance');
  });

  it('annonce le repos et la prochaine séance un jour de repos', async () => {
    TestBed.inject(LessonStore).save(lesson('ACTIVE_RECALL', 'REST'));
    const { el } = await render();
    expect(el.textContent).toContain('Pas de séance');
    expect(el.textContent).toContain('Prochaine séance');
  });

  it('refuse un texte trop court pour préparer une séance', async () => {
    TestBed.inject(LessonStore).save(lesson('ACTIVE_RECALL', 'LEARN', 'Trop court'));
    const { el } = await render();
    expect(el.textContent).toContain('trop court');
  });

  it('déroule le rappel actif puis marque la journée comme faite', async () => {
    const store = TestBed.inject(LessonStore);
    store.save(lesson('ACTIVE_RECALL'));
    const { el, fixture } = await render();
    const click = async (label: string) => {
      const button = Array.from(el.querySelectorAll('button')).find((b) => b.textContent!.includes(label))!;
      button.click();
      await fixture.whenStable();
    };

    expect(el.textContent).toContain('Relis ta leçon');
    await click('Masquer');
    const area = el.querySelector('textarea')!;
    area.value = 'photosynthèse lumière énergie chimique chloroplastes chlorophylle';
    area.dispatchEvent(new Event('input'));
    await click('Comparer');
    expect(el.textContent).toContain('RETROUVÉ');
    expect(el.textContent).toContain('OUBLIÉ');

    await click('Terminer');
    expect(el.textContent).toContain('Séance terminée');
    expect(store.lesson()!.done).toContain(toIsoDate(new Date()));
  });

  it('enregistre la date de retour d’une carte après une réponse', async () => {
    const store = TestBed.inject(LessonStore);
    store.save(lesson('SPACED_REPETITION'));
    const { el, fixture } = await render();

    expect(el.querySelector('.big')?.textContent).toContain('_____');
    (Array.from(el.querySelectorAll('.q'))[0] as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(Object.keys(store.lesson()!.progress ?? {}).length).toBe(1);
    expect(el.querySelector('[role="status"]')).not.toBeNull();
  });

  it('fait passer toutes les parties en revue avec Feynman et liste les points à revoir', async () => {
    TestBed.inject(LessonStore).save(lesson('FEYNMAN'));
    const { el, fixture } = await render();
    const click = async (label: string) => {
      Array.from(el.querySelectorAll('button')).find((b) => b.textContent!.includes(label))!.click();
      await fixture.whenStable();
    };

    // Aucune case cochée : tout est à revoir. Le texte compte plusieurs parties, on les parcourt toutes.
    while (!el.textContent!.includes('Bilan')) {
      await click('Vérifier');
      await click(el.textContent!.includes('Voir le bilan') ? 'Voir le bilan' : 'Partie suivante');
    }
    expect(el.textContent).toContain('à revoir');
    expect(el.querySelectorAll('.chk li.ko').length).toBeGreaterThan(0);
  });
});
