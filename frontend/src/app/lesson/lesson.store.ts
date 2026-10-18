import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Lesson } from './lesson.model';

const STORAGE_KEY = 'memento.lesson';

/**
 * Leçons de l'utilisateur.
 * - Invité : une seule leçon, gardée dans le navigateur (localStorage).
 * - Connecté : les leçons du compte, lues et enregistrées via l'API. À la connexion, la leçon
 *   d'invité éventuelle est ajoutée au compte puis retirée du navigateur.
 * `lesson` est la leçon en cours, celle que montrent le plan et la séance.
 */
@Injectable({ providedIn: 'root' })
export class LessonStore {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly all = signal<Lesson[]>(guestLessons());
  private readonly currentId = signal<string | null>(null);

  readonly lessons = this.all.asReadonly();
  readonly lesson = computed(() => this.all().find((l) => l.id === this.currentId()) ?? this.all()[0] ?? null);

  constructor() {
    // Se resynchronise à chaque connexion / déconnexion.
    effect(() => {
      const account = this.auth.account();
      untracked(() => (account ? this.loadAccount() : this.loadGuest()));
    });
  }

  /** Enregistre la leçon : crée si elle est nouvelle, met à jour sinon. Devient la leçon en cours. */
  save(lesson: Lesson): void {
    if (!this.auth.account()) {
      this.all.set([lesson]);
      writeGuest(lesson);
      return;
    }
    const known = lesson.id !== undefined;
    // Affichage immédiat ; le serveur confirme ensuite (la mise à jour d'une leçon n'attend pas sa réponse).
    this.all.update((list) => [lesson, ...list.filter((l) => l.id === undefined || l.id !== lesson.id)]);
    this.currentId.set(lesson.id ?? null);
    if (known) {
      this.http.put(`/api/lessons/${lesson.id}`, withoutId(lesson)).subscribe({ error: () => undefined });
    } else {
      this.http.post<Lesson>('/api/lessons', withoutId(lesson)).subscribe({
        next: (created) => {
          this.all.update((list) => list.map((l) => (l === lesson ? created : l)));
          this.currentId.set(created.id ?? null);
        },
        error: () => undefined,
      });
    }
  }

  select(id: string): void {
    this.currentId.set(id);
  }

  remove(id: string): void {
    this.all.update((list) => list.filter((l) => l.id !== id));
    this.http.delete(`/api/lessons/${id}`).subscribe({ error: () => undefined });
  }

  /** Marque la séance d'un jour du plan comme terminée. */
  markDone(date: string): void {
    const lesson = this.lesson();
    if (lesson && !lesson.done?.includes(date)) {
      this.save({ ...lesson, done: [...(lesson.done ?? []), date] });
    }
  }

  /** Enregistre la date de retour d'une carte. */
  setDue(id: number, due: string): void {
    const lesson = this.lesson();
    if (lesson) {
      this.save({ ...lesson, progress: { ...lesson.progress, [id]: due } });
    }
  }

  private loadGuest(): void {
    this.all.set(guestLessons());
    this.currentId.set(null);
  }

  private loadAccount(): void {
    this.http.get<Lesson[]>('/api/lessons').subscribe({
      next: (list) => {
        this.all.set(list);
        this.currentId.set(null);
        this.importGuestLesson();
      },
      error: () => undefined,
    });
  }

  /** La leçon faite en invité rejoint le compte. En cas d'échec elle reste dans le navigateur. */
  private importGuestLesson(): void {
    const guest = readGuest();
    if (!guest) {
      return;
    }
    this.http.post<Lesson>('/api/lessons', withoutId(guest)).subscribe({
      next: (created) => {
        clearGuest();
        this.all.update((list) => [created, ...list]);
        this.currentId.set(created.id ?? null);
      },
      error: () => undefined,
    });
  }
}

function withoutId(lesson: Lesson): Omit<Lesson, 'id'> {
  const body = { ...lesson };
  delete body.id;
  return body;
}

function guestLessons(): Lesson[] {
  const lesson = readGuest();
  return lesson ? [lesson] : [];
}

function readGuest(): Lesson | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? (JSON.parse(raw) as Partial<Lesson>) : null;
    // Données modifiables par l'utilisateur : on vérifie la forme avant de s'en servir.
    return data && typeof data.title === 'string' && Array.isArray(data.plan) ? (data as Lesson) : null;
  } catch {
    return null;
  }
}

function writeGuest(lesson: Lesson): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lesson));
  } catch {
    // Stockage indisponible (navigation privée, quota) : la leçon reste en mémoire pour cette session.
  }
}

function clearGuest(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // rien à faire
  }
}
