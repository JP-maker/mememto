import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatDay, toIsoDate } from '../../lesson/dates';
import { LessonStore } from '../../lesson/lesson.store';
import { Grade, nextDue } from '../../lesson/schedule';
import { prepare } from '../../lesson/text-prep';
import { CardsSession } from './cards-session';
import { FeynmanSession } from './feynman-session';
import { RecallSession } from './recall-session';

/** Séance du jour : affiche l'exercice de la méthode choisie, ou explique pourquoi il n'y en a pas. */
@Component({
  selector: 'app-session-page',
  imports: [RouterLink, RecallSession, CardsSession, FeynmanSession],
  templateUrl: './session-page.html',
  styleUrl: './session-page.scss',
})
export class SessionPage {
  private readonly store = inject(LessonStore);
  protected readonly lesson = this.store.lesson;
  private readonly today = toIsoDate(new Date());
  private readonly done = signal(false);

  // Dépend du texte seul : les éléments gardent la même identité quand la progression change.
  private readonly text = computed(() => this.lesson()?.text ?? '');
  protected readonly items = computed(() => prepare(this.text()));
  private readonly day = computed(() => this.lesson()?.plan.find((d) => d.date === this.today));

  protected readonly status = computed(() => {
    if (!this.lesson()) {
      return 'empty';
    }
    if (this.done()) {
      return 'finished';
    }
    const day = this.day();
    if (!day || day.type === 'REST') {
      return 'rest';
    }
    return this.items().length === 0 ? 'short' : 'ready';
  });

  protected readonly nextDay = computed(() => {
    const next = this.lesson()?.plan.find((d) => d.date > this.today && d.type !== 'REST');
    return next ? formatDay(next.date) : null;
  });

  protected grade(event: { id: number; grade: Grade }): void {
    this.store.setDue(event.id, nextDue(event.grade));
  }

  protected finish(): void {
    this.store.markDone(this.today);
    this.done.set(true);
  }
}
