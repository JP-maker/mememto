import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { addDays, daysUntil, toIsoDate } from '../../lesson/dates';
import { deadlineValidator } from '../../lesson/deadline.validator';
import { LessonStore } from '../../lesson/lesson.store';
import { METHODS, MethodId } from '../../lesson/methods';
import { PlanApi } from '../../lesson/plan.api';

/** Saisie de la leçon, choix de la méthode et de la date butoir. */
@Component({
  selector: 'app-lesson-page',
  imports: [ReactiveFormsModule],
  templateUrl: './lesson-page.html',
  styleUrl: './lesson-page.scss',
})
export class LessonPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(PlanApi);
  private readonly store = inject(LessonStore);
  private readonly router = inject(Router);

  protected readonly methods = METHODS;
  protected readonly minuteChoices = [10, 20, 30, 45];
  protected readonly minDate = toIsoDate(addDays(new Date(), 1));

  protected readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    text: ['', [Validators.required, Validators.minLength(40), Validators.maxLength(20000)]],
    method: ['ACTIVE_RECALL' as MethodId],
    deadline: [toIsoDate(addDays(new Date(), 14)), [Validators.required, deadlineValidator]],
    minutesPerDay: [20],
  });

  protected readonly submitted = signal(false);
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  private readonly value = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  protected readonly words = computed(() => (this.value().text?.match(/\S+/g) ?? []).length);
  protected readonly daysLeft = computed(() => {
    const deadline = this.value().deadline;
    return deadline ? daysUntil(deadline) : 0;
  });

  protected submit(): void {
    this.submitted.set(true);
    this.failed.set(false);
    if (this.form.invalid) {
      return;
    }
    const lesson = this.form.getRawValue();
    this.busy.set(true);
    this.api.compute(lesson.deadline, lesson.minutesPerDay).subscribe({
      next: (plan) => {
        this.store.save({ ...lesson, plan });
        void this.router.navigateByUrl('/plan');
      },
      error: () => {
        this.failed.set(true);
        this.busy.set(false);
      },
    });
  }
}
