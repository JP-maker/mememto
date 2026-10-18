import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { daysUntil } from '../../lesson/dates';
import { LessonStore } from '../../lesson/lesson.store';
import { METHODS } from '../../lesson/methods';

interface Card {
  id: string;
  title: string;
  meta: string;
}

/** Liste des leçons du compte : ouvrir celle sur laquelle on travaille, ou en supprimer une. */
@Component({
  selector: 'app-my-lessons-page',
  imports: [RouterLink],
  templateUrl: './my-lessons-page.html',
  styleUrl: './my-lessons-page.scss',
})
export class MyLessonsPage {
  private readonly store = inject(LessonStore);
  private readonly router = inject(Router);
  protected readonly account = inject(AuthService).account;
  /** Leçon dont on attend la confirmation de suppression. */
  protected readonly confirming = signal<string | null>(null);

  protected readonly cards = computed<Card[]>(() =>
    this.store
      .lessons()
      .filter((l) => l.id !== undefined)
      .map((l) => {
        const days = daysUntil(l.deadline);
        const method = METHODS.find((m) => m.id === l.method)?.label ?? '';
        return {
          id: l.id!,
          title: l.title,
          meta: `${method} · ${days >= 0 ? `J-${days}` : 'date passée'}`,
        };
      }),
  );

  protected open(id: string): void {
    this.store.select(id);
    this.router.navigateByUrl('/plan');
  }

  protected askRemove(id: string): void {
    this.confirming.set(id);
  }

  protected remove(id: string): void {
    this.store.remove(id);
    this.confirming.set(null);
  }
}
