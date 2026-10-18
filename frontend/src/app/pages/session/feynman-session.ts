import { Component, computed, input, output, signal } from '@angular/core';
import { Item, groupParts } from '../../lesson/text-prep';

type Phase = 'explain' | 'check' | 'done';

/** Technique de Feynman : expliquer chaque partie avec ses mots, puis juger soi-même ce qui est acquis. */
@Component({
  selector: 'app-feynman-session',
  templateUrl: './feynman-session.html',
  styleUrl: './session.shared.scss',
})
export class FeynmanSession {
  readonly items = input.required<Item[]>();
  readonly finished = output<void>();

  protected readonly phase = signal<Phase>('explain');
  protected readonly index = signal(0);
  protected readonly checked = signal<ReadonlySet<number>>(new Set());
  protected readonly missed = signal<Item[]>([]);

  protected readonly parts = computed(() => groupParts(this.items()));
  protected readonly part = computed(() => this.parts()[this.index()]);
  /** Quelques mots clés de la partie, pour relancer la mémoire sans donner les phrases. */
  protected readonly hints = computed(() => [...new Set(this.part().flatMap((i) => i.keywords))].slice(0, 6));

  protected check(): void {
    this.phase.set('check');
  }

  protected toggle(id: number): void {
    this.checked.update((set) => {
      const next = new Set(set);
      if (!next.delete(id)) {
        next.add(id);
      }
      return next;
    });
  }

  protected next(): void {
    const unchecked = this.part().filter((item) => !this.checked().has(item.id));
    this.missed.update((list) => [...list, ...unchecked]);
    this.checked.set(new Set());
    if (this.index() + 1 >= this.parts().length) {
      this.phase.set('done');
    } else {
      this.index.update((i) => i + 1);
      this.phase.set('explain');
    }
  }
}
