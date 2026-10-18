/**
 * Préparation du texte sans IA : découpage en phrases, choix d'un mot clé par phrase,
 * trous (cartes), faux choix (QCM) et comparaison avec ce que l'utilisateur a écrit.
 * Ce sont des fonctions pures : même texte, mêmes éléments.
 */

/** Une phrase de la leçon avec ses mots clés. L'identifiant est sa position dans la leçon. */
export interface Item {
  readonly id: number;
  readonly sentence: string;
  /** Jusqu'à trois mots clés, le plus important en premier. */
  readonly keywords: readonly string[];
  /** Mot masqué dans la carte. */
  readonly answer: string;
  /** La phrase avec le mot clé remplacé par des tirets. */
  readonly cloze: string;
}

// shortcut: liste de mots courants en français uniquement, à compléter pour d'autres langues ou via l'IA.
const STOPWORDS = new Set([
  'ainsi', 'alors', 'apres', 'aussi', 'autre', 'autres', 'avant', 'avec', 'cela', 'celle', 'celui', 'cette',
  'chaque', 'comme', 'dans', 'depuis', 'donc', 'dont', 'elle', 'elles', 'encore', 'ensuite', 'entre', 'etre',
  'faire', 'leurs', 'lorsque', 'mais', 'meme', 'parce', 'pendant', 'plus', 'pour', 'puis', 'quand', 'quelque',
  'sans', 'selon', 'sont', 'sous', 'toute', 'toutes', 'tous', 'tout', 'vers', 'vous', 'nous', 'avoir', 'fait',
]);

const WORD = /[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*/gu;
const WORD_CHAR = '[\\p{L}\\p{N}]';

/** Minuscules sans accents, pour comparer des mots. */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

// shortcut: coupe sur . ! ? … et retours à la ligne ; « M. Dupont » ou « etc. » coupent à tort, à affiner ou via l'IA.
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+|\n+/u)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length >= 3);
}

function isNumber(word: string): boolean {
  return /^\d+$/.test(word);
}

function keywordsOf(sentence: string): string[] {
  const seen = new Set<string>();
  const scored: { word: string; index: number; score: number }[] = [];
  (sentence.match(WORD) ?? []).forEach((word, index) => {
    const key = normalize(word);
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    if (!isNumber(word) && (word.length < 5 || STOPWORDS.has(key))) {
      return;
    }
    const capital = index > 0 && /^\p{Lu}/u.test(word);
    scored.push({ word, index, score: (isNumber(word) ? 3 : 0) + (capital ? 2 : 0) + Math.min(word.length, 12) / 12 });
  });
  return scored
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 3)
    .map((s) => s.word);
}

function blank(sentence: string, answer: string): string {
  const escaped = answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return sentence.replace(new RegExp(`(?<!${WORD_CHAR})${escaped}(?!${WORD_CHAR})`, 'u'), '_____');
}

/** Découpe le texte en éléments utilisables. Les phrases sans mot clé sont écartées. */
export function prepare(text: string): Item[] {
  return splitSentences(text)
    .map((sentence) => ({ sentence, keywords: keywordsOf(sentence) }))
    .filter((s) => s.keywords.length > 0)
    .map((s, id) => ({
      id,
      sentence: s.sentence,
      keywords: s.keywords,
      answer: s.keywords[0],
      cloze: blank(s.sentence, s.keywords[0]),
    }));
}

function shuffle<T>(list: readonly T[], rng: () => number): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Quatre choix mélangés (la bonne réponse et trois mots clés d'autres phrases, de même nature :
 * nombre avec nombre). Renvoie null s'il n'y a pas assez de mots différents : la carte passe en réponse libre.
 */
export function choicesFor(item: Item, items: readonly Item[], rng: () => number = Math.random): string[] | null {
  const target = normalize(item.answer);
  const pool = new Map<string, string>();
  for (const other of items) {
    for (const word of other.keywords) {
      const key = normalize(word);
      if (key !== target && !pool.has(key)) {
        pool.set(key, word);
      }
    }
  }
  const words = [...pool.values()];
  const sameKind = words.filter((w) => isNumber(w) === isNumber(item.answer));
  const otherKind = words.filter((w) => isNumber(w) !== isNumber(item.answer));
  const distractors = [...shuffle(sameKind, rng), ...shuffle(otherKind, rng)].slice(0, 3);
  return distractors.length < 3 ? null : shuffle([item.answer, ...distractors], rng);
}

/** La phrase est considérée retrouvée si au moins la moitié de ses mots clés figurent dans le texte écrit. */
export function recalled(item: Item, written: string): boolean {
  const words = new Set(normalize(written).match(WORD) ?? []);
  const found = item.keywords.filter((k) => words.has(normalize(k))).length;
  return found >= Math.ceil(item.keywords.length / 2);
}

/** Regroupe les éléments par paquets (les « parties » de la méthode Feynman). */
export function groupParts(items: readonly Item[], size = 3): Item[][] {
  const parts: Item[][] = [];
  for (let i = 0; i < items.length; i += size) {
    parts.push(items.slice(i, i + size));
  }
  return parts;
}
