import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { daysUntil, formatDay, toIsoDate } from '../../lesson/dates';
import { PlanDay, SessionType } from '../../lesson/lesson.model';
import { LessonStore } from '../../lesson/lesson.store';
import { METHODS, Method } from '../../lesson/methods';

interface Row {
  date: string;
  type: SessionType;
  today: boolean;
  label: string;
  task: string;
  pill: string;
  done: boolean;
}

/** Plan de travail jour par jour pour la leçon en cours. */
@Component({
  selector: 'app-plan-page',
  imports: [RouterLink],
  templateUrl: './plan-page.html',
  styleUrl: './plan-page.scss',
})
export class PlanPage {
  protected readonly lesson = inject(LessonStore).lesson;

  protected readonly meta = computed(() => {
    const lesson = this.lesson();
    const method = METHODS.find((m) => m.id === lesson?.method);
    return lesson && method ? `${method.label} · ${lesson.minutesPerDay} min/jour · J-${daysUntil(lesson.deadline)}` : '';
  });

  /** Vrai quand une séance est prévue aujourd'hui : affiche le bouton de démarrage. */
  protected readonly sessionToday = computed(() =>
    this.lesson()?.plan.some((d) => d.date === toIsoDate(new Date()) && d.type !== 'REST') ?? false,
  );

  protected readonly rows = computed<Row[]>(() => {
    const lesson = this.lesson();
    const method = METHODS.find((m) => m.id === lesson?.method);
    if (!lesson || !method) {
      return [];
    }
    const todayIso = toIsoDate(new Date());
    const last = lesson.plan.length - 1;
    return lesson.plan.map((day, index) => ({
      date: day.date,
      type: day.type,
      today: day.date === todayIso,
      label: day.date === todayIso ? "Aujourd'hui" : formatDay(day.date),
      task: taskFor(day, index === last - 1, method),
      pill: pillFor(day),
      done: (lesson.done ?? []).includes(day.date),
    }));
  });
}

function taskFor(day: PlanDay, dayBeforeDeadline: boolean, method: Method): string {
  switch (day.type) {
    case 'LEARN':
      return method.tasks.learn;
    case 'REVIEW':
      return dayBeforeDeadline ? method.tasks.lastReview : method.tasks.review;
    case 'FINAL':
      return 'Test final : récite toute la leçon';
    default:
      return 'Pas de séance';
  }
}

function pillFor(day: PlanDay): string {
  switch (day.type) {
    case 'REST':
      return 'repos';
    case 'FINAL':
      return 'jour J';
    default:
      return `${day.minutes} min`;
  }
}
