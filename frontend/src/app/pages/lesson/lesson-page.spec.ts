import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { LessonStore } from '../../lesson/lesson.store';
import { LessonPage } from './lesson-page';

const TEXT = 'La prise de la Bastille a lieu le 14 juillet 1789. Louis XVI est guillotiné en 1793.';

describe('LessonPage', () => {
  let fixture: ComponentFixture<LessonPage>;
  let page: HTMLElement;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LessonPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(LessonPage);
    page = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  function type(selector: string, value: string): void {
    const field = page.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
    field.value = value;
    field.dispatchEvent(new Event('input'));
  }

  async function submit(): Promise<void> {
    page.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    await fixture.whenStable();
  }

  it('propose les trois méthodes et compte les mots saisis', async () => {
    expect(page.querySelectorAll('input[name=method]').length).toBe(3);
    type('#texte', 'un deux trois');
    await fixture.whenStable();
    expect(page.querySelector('.kv b')?.textContent).toContain('3 mots');
  });

  it("refuse un texte trop court sans appeler l'API", async () => {
    type('#titre', 'Histoire');
    type('#texte', 'trop court');
    await submit();

    expect(page.textContent).toContain('Colle au moins une phrase complète');
    http.expectNone('/api/plan');
  });

  it('calcule le plan, le garde en mémoire et ouvre la page du plan', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    type('#titre', 'Histoire');
    type('#texte', TEXT);
    await submit();

    const request = http.expectOne('/api/plan');
    expect(request.request.body.minutesPerDay).toBe(20);
    request.flush([{ date: '2026-10-17', type: 'LEARN', minutes: 20 }]);

    expect(TestBed.inject(LessonStore).lesson()?.title).toBe('Histoire');
    expect(navigate).toHaveBeenCalledWith('/plan');
  });

  it("affiche une erreur quand l'API échoue", async () => {
    type('#titre', 'Histoire');
    type('#texte', TEXT);
    await submit();
    http.expectOne('/api/plan').flush('erreur', { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();

    expect(page.textContent).toContain("Le plan n'a pas pu être calculé");
  });

  describe('avec mon IA', () => {
    const ITEMS = [{ sentence: 'La Bastille tombe en 1789.', answer: 'Bastille', keywords: ['Bastille'], distractors: ['a', 'b', 'c'] }];
    const KEY = 'sk-ant-secret-1234567890';

    async function fill(key: string): Promise<void> {
      type('#titre', 'Histoire');
      type('#texte', TEXT);
      const radio = page.querySelector<HTMLInputElement>('#prep-ia')!;
      radio.click();
      await fixture.whenStable();
      if (key) {
        type('#cle', key);
      }
    }

    it('exige une clé et n’appelle rien sans elle', async () => {
      await fill('');
      await submit();
      expect(page.textContent).toContain('Colle ta clé');
      http.expectNone('/api/plan');
      http.expectNone('/api/prepare');
    });

    it('envoie la clé une fois, enregistre les éléments mais jamais la clé', async () => {
      const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
      await fill(KEY);
      await submit();
      http.expectOne('/api/plan').flush([{ date: '2026-10-17', type: 'LEARN', minutes: 20 }]);
      const prepare = http.expectOne('/api/prepare');
      expect(prepare.request.body).toEqual({ provider: 'ANTHROPIC', apiKey: KEY, text: TEXT });
      prepare.flush(ITEMS);

      const saved = TestBed.inject(LessonStore).lesson()!;
      expect(saved.items).toEqual(ITEMS);
      expect(JSON.stringify(saved)).not.toContain(KEY);
      expect(JSON.stringify(Object.entries(localStorage))).not.toContain(KEY);
      expect(navigate).toHaveBeenCalledWith('/plan');
    });

    it('explique un refus de clé sans enregistrer la leçon', async () => {
      await fill(KEY);
      await submit();
      http.expectOne('/api/plan').flush([]);
      http.expectOne('/api/prepare').flush({}, { status: 422, statusText: 'Unprocessable' });
      await fixture.whenStable();

      expect(page.textContent).toContain('Ta clé a été refusée');
      expect(page.textContent).not.toContain(KEY);
      expect(TestBed.inject(LessonStore).lesson()).toBeNull();
    });
  });
});
