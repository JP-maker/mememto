import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { addDays, toIsoDate } from '../../lesson/dates';
import { Lesson } from '../../lesson/lesson.model';
import { LessonStore } from '../../lesson/lesson.store';
import { MyLessonsPage } from './my-lessons-page';

const lesson = (title: string, id: string): Lesson => ({
  id,
  title,
  text: 'texte',
  method: 'ACTIVE_RECALL',
  deadline: toIsoDate(addDays(new Date(), 5)),
  minutesPerDay: 20,
  plan: [],
});

describe('MyLessonsPage', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [MyLessonsPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  async function renderLoggedIn() {
    TestBed.inject(LessonStore);
    TestBed.inject(AuthService).login('jp@memento.fr', 'motdepasse-solide').subscribe();
    http.expectOne('/api/auth/login').flush({ email: 'jp@memento.fr' });
    TestBed.tick();
    http.expectOne('/api/lessons').flush([lesson('Histoire', 'a'), lesson('Maths', 'b')]);
    const fixture = TestBed.createComponent(MyLessonsPage);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('invite un invité à se connecter', async () => {
    const fixture = TestBed.createComponent(MyLessonsPage);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Connecte-toi');
  });

  it('liste les leçons du compte et ouvre celle choisie', async () => {
    const { el } = await renderLoggedIn();
    const titles = Array.from(el.querySelectorAll('.card h2')).map((h) => h.textContent);
    expect(titles).toEqual(['Histoire', 'Maths']);
    expect(el.textContent).toContain('J-5');

    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    (el.querySelectorAll('.card')[1].querySelector('.btn') as HTMLButtonElement).click();
    expect(TestBed.inject(LessonStore).lesson()?.id).toBe('b');
    expect(navigate).toHaveBeenCalledWith('/plan');
  });

  it('demande confirmation avant de supprimer', async () => {
    const { fixture, el } = await renderLoggedIn();
    const first = () => el.querySelectorAll('.card')[0];

    (first().querySelector('.btn.ghost') as HTMLButtonElement).click(); // Supprimer
    await fixture.whenStable();
    http.expectNone('/api/lessons/a');
    expect(first().textContent).toContain('Confirmer la suppression');

    (first().querySelector('.danger') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(http.expectOne('/api/lessons/a').request.method).toBe('DELETE');
    expect(el.querySelectorAll('.card').length).toBe(1);
  });
});
