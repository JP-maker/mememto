import { Component, OnInit, computed, input, output, signal } from '@angular/core';
import { Progress } from '../../lesson/lesson.model';
import { GRADES, Grade, isDue } from '../../lesson/schedule';
import { Item, choicesFor } from '../../lesson/text-prep';

type Mode = 'qcm' | 'free';

/** Cartes à trous : choix multiples ou réponse libre, avec retour espacé selon les réponses. */
@Component({
  selector: 'app-cards-session',
  templateUrl: './cards-session.html',
  styleUrl: './session.shared.scss',
})
export class CardsSession implements OnInit {
  readonly items = input.required<Item[]>();
  readonly progress = input<Progress>({});
  readonly graded = output<{ id: number; grade: Grade }>();
  readonly finished = output<void>();

  protected readonly grades = GRADES;
  protected readonly mode = signal<Mode>('qcm');
  protected readonly queue = signal<Item[]>([]);
  protected readonly position = signal(0);
  protected readonly revealed = signal(false);
  protected readonly picked = signal<string | null>(null);
  private readonly retried = new Set<number>();

  protected readonly current = computed(() => this.queue()[this.position()]);
  /** Quatre choix, ou null quand la leçon ne permet pas d'en proposer : la carte passe en réponse libre. */
  protected readonly choices = computed(() => {
    const card = this.current();
    return card ? choicesFor(card, this.items()) : null;
  });
  protected readonly qcm = computed(() => this.mode() === 'qcm' && this.choices() !== null);
  protected readonly isCorrect = computed(() => this.picked() === this.current()?.answer);

  ngOnInit(): void {
    // Photo des cartes à revoir au début de la séance : elles ne disparaissent pas pendant qu'on y répond.
    this.queue.set(this.items().filter((item) => isDue(this.progress(), item.id)));
  }

  protected setMode(mode: Mode): void {
    this.mode.set(mode);
  }

  protected pick(choice: string): void {
    if (this.picked() !== null) {
      return;
    }
    this.picked.set(choice);
    this.grade(choice === this.current().answer ? 'good' : 'again');
  }

  protected reveal(): void {
    this.revealed.set(true);
  }

  /** Enregistre la réponse. En réponse libre, passe directement à la carte suivante. */
  protected grade(grade: Grade): void {
    const card = this.current();
    this.graded.emit({ id: card.id, grade });
    if (grade === 'again' && !this.retried.has(card.id)) {
      this.retried.add(card.id);
      this.queue.update((q) => [...q, card]); // la carte ratée revient une fois dans la séance
    }
    if (!this.qcm()) {
      this.next();
    }
  }

  protected next(): void {
    this.position.update((p) => p + 1);
    this.revealed.set(false);
    this.picked.set(null);
  }
}
