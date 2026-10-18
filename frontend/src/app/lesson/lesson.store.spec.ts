import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { Lesson } from './lesson.model';
import { LessonStore } from './lesson.store';

const lesson = (title: string, id?: string): Lesson => ({
  id,
  title,
  text: 'texte',
  method: 'FEYNMAN',
  deadline: '2026-11-01',
  minutesPerDay: 20,
  plan: [{ date: '2026-10-18', type: 'LEARN', minutes: 20 }],
});

describe('LessonStore', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  /** Simule une connexion et attend la lecture des leçons du compte. */
  async function logIn(serverLessons: Lesson[] = []): Promise<void> {
    TestBed.inject(AuthService).login('jp@memento.fr', 'motdepasse-solide').subscribe();
    http.expectOne('/api/auth/login').flush({ email: 'jp@memento.fr' });
    TestBed.tick();
    http.expectOne('/api/lessons').flush(serverLessons);
  }

  it('invité : garde une seule leçon dans le navigateur', () => {
    const store = TestBed.inject(LessonStore);
    store.save(lesson('Histoire'));

    expect(store.lesson()?.title).toBe('Histoire');
    expect(JSON.parse(localStorage.getItem('memento.lesson')!).title).toBe('Histoire');
    http.expectNone('/api/lessons');
  });

  it('connexion : charge les leçons du compte, la plus récente en cours', async () => {
    const store = TestBed.inject(LessonStore);
    TestBed.tick();
    await logIn([lesson('Récente', 'a'), lesson('Ancienne', 'b')]);

    expect(store.lessons().length).toBe(2);
    expect(store.lesson()?.title).toBe('Récente');
  });

  it('connexion : la leçon d’invité est ajoutée au compte puis retirée du navigateur', async () => {
    localStorage.setItem('memento.lesson', JSON.stringify(lesson('Faite en invité')));
    const store = TestBed.inject(LessonStore);
    TestBed.tick();
    await logIn([lesson('Déjà là', 'a')]);

    const post = http.expectOne('/api/lessons');
    expect(post.request.method).toBe('POST');
    expect(post.request.body.title).toBe('Faite en invité');
    expect(post.request.body.id).toBeUndefined();
    post.flush(lesson('Faite en invité', 'new'));

    expect(localStorage.getItem('memento.lesson')).toBeNull();
    expect(store.lessons().map((l) => l.id)).toEqual(['new', 'a']);
    expect(store.lesson()?.id).toBe('new');
  });

  it('connecté : une nouvelle leçon est créée, une leçon connue est mise à jour', async () => {
    const store = TestBed.inject(LessonStore);
    TestBed.tick();
    await logIn();

    store.save(lesson('Nouvelle'));
    expect(store.lesson()?.title).toBe('Nouvelle'); // visible sans attendre le serveur
    http.expectOne('/api/lessons').flush(lesson('Nouvelle', 'n1'));
    expect(store.lesson()?.id).toBe('n1');

    store.markDone('2026-10-18');
    const put = http.expectOne('/api/lessons/n1');
    expect(put.request.method).toBe('PUT');
    expect(put.request.body.done).toEqual(['2026-10-18']);
    expect(put.request.body.id).toBeUndefined();
    put.flush(null);
    expect(store.lessons().length).toBe(1);
  });

  it('connecté : supprimer retire la leçon puis prévient le serveur', async () => {
    const store = TestBed.inject(LessonStore);
    TestBed.tick();
    await logIn([lesson('A', 'a'), lesson('B', 'b')]);

    store.remove('a');
    expect(store.lessons().map((l) => l.id)).toEqual(['b']);
    expect(http.expectOne('/api/lessons/a').request.method).toBe('DELETE');
  });
});
