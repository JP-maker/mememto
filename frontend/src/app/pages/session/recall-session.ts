import { Component, computed, input, output, signal } from '@angular/core';
import { Item, recalled } from '../../lesson/text-prep';

type Phase = 'read' | 'write' | 'result';

/** Rappel actif : lire, écrire de mémoire, puis comparer avec la leçon. */
@Component({
  selector: 'app-recall-session',
  templateUrl: './recall-session.html',
  styleUrl: './session.shared.scss',
})
export class RecallSession {
  readonly items = input.required<Item[]>();
  readonly text = input.required<string>();
  readonly finished = output<void>();

  protected readonly phase = signal<Phase>('read');
  private readonly written = signal('');

  protected readonly results = computed(() =>
    this.phase() === 'result' ? this.items().map((item) => ({ item, found: recalled(item, this.written()) })) : [],
  );
  protected readonly score = computed(() => this.results().filter((r) => r.found).length);

  protected write(event: Event): void {
    this.written.set((event.target as HTMLTextAreaElement).value);
  }

  protected go(phase: Phase): void {
    this.phase.set(phase);
  }
}
