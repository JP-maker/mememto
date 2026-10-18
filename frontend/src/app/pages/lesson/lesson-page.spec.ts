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
});
