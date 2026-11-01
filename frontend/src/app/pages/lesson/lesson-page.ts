import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, map, of, switchMap } from 'rxjs';
import { AiApi, AiProvider } from '../../lesson/ai.api';
import { buildPrompt, parseReply } from '../../lesson/ai-prompt';
import { addDays, daysUntil, toIsoDate } from '../../lesson/dates';
import { deadlineValidator } from '../../lesson/deadline.validator';
import { LessonStore } from '../../lesson/lesson.store';
import { PreparedItem } from '../../lesson/lesson.model';
import { METHODS, MethodId } from '../../lesson/methods';
import { PlanApi } from '../../lesson/plan.api';

/** Messages selon le code renvoyé par /api/prepare. Jamais de détail technique ni de clé. */
function aiError(status: number): string {
  switch (status) {
    case 422:
      return 'Ta clé a été refusée par le fournisseur. Vérifie-la, ou choisis le découpage automatique.';
    case 400:
      return 'Le texte ou la clé est invalide. Vérifie les champs.';
    case 502:
      return "L'IA n'a pas pu préparer le texte (fournisseur indisponible ou réponse inutilisable). Réessaie, ou choisis le découpage automatique.";
    default:
      return 'La préparation du texte a échoué. Réessaie dans un instant.';
  }
}

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
  private readonly ai = inject(AiApi);
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
    // Ces trois champs ne font pas partie de la leçon : ils ne sont jamais enregistrés (voir submit).
    prep: ['auto' as 'auto' | 'ai' | 'manual'],
    provider: ['ANTHROPIC' as AiProvider],
    apiKey: [''],
    reply: [''], // réponse collée de l'assistant (préparation sans clé) ; jamais enregistrée non plus
  });

  protected readonly submitted = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly copied = signal<'' | 'ok' | 'fail'>('');

  private readonly value = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  protected readonly words = computed(() => (this.value().text?.match(/\S+/g) ?? []).length);
  protected readonly daysLeft = computed(() => {
    const deadline = this.value().deadline;
    return deadline ? daysUntil(deadline) : 0;
  });

  /** Prompt prêt à coller dans l'assistant de l'utilisateur. */
  protected readonly prompt = computed(() => buildPrompt(this.value().text ?? ''));

  protected async copyPrompt(): Promise<void> {
    if (this.form.controls.text.invalid) {
      this.submitted.set(true); // affiche l'erreur du texte : le prompt n'a de sens qu'avec la leçon
      return;
    }
    try {
      await navigator.clipboard.writeText(this.prompt());
      this.copied.set('ok');
    } catch {
      this.copied.set('fail'); // presse-papiers refusé : le prompt s'affiche pour être copié à la main
    }
  }

  protected submit(): void {
    this.submitted.set(true);
    this.error.set('');
    const { prep, provider, apiKey, reply, ...lesson } = this.form.getRawValue();
    const key = apiKey.trim();
    if (this.form.invalid || (prep === 'ai' && !key)) {
      return;
    }
    const pasted = prep === 'manual' ? parseReply(reply) : undefined;
    if (pasted?.length === 0) {
      this.error.set("La réponse collée n'est pas utilisable. Colle la réponse complète de ton IA, telle quelle (le JSON demandé par le prompt).");
      return;
    }
    this.busy.set(true);
    const prepared: Observable<PreparedItem[] | undefined> =
      prep === 'ai' ? this.ai.prepare(provider, key, lesson.text) : of(pasted);
    this.api
      .compute(lesson.deadline, lesson.minutesPerDay)
      .pipe(switchMap((plan) => prepared.pipe(map((items) => ({ plan, items })))))
      .subscribe({
        next: ({ plan, items }) => {
          this.form.controls.apiKey.reset(); // la clé ne reste pas dans le formulaire
          this.form.controls.reply.reset();
          this.store.save({ ...lesson, plan, ...(items ? { items } : {}) });
          void this.router.navigateByUrl('/plan');
        },
        error: (e: HttpErrorResponse) => {
          this.error.set(prep === 'ai' ? aiError(e.status) : 'Le plan n\'a pas pu être calculé. Réessaie dans un instant.');
          this.busy.set(false);
        },
      });
  }
}
