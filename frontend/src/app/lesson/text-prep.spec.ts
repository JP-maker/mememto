import { choicesFor, groupParts, normalize, prepare, recalled, splitSentences } from './text-prep';

const TEXT =
  "La prise de la Bastille a lieu le 14 juillet 1789. L'Assemblée vote la Déclaration des droits de l'homme. " +
  'La Première République est proclamée en 1792. Louis XVI est guillotiné le 21 janvier 1793.\nOk.';

describe('text-prep', () => {
  describe('splitSentences', () => {
    it('coupe sur la ponctuation et écarte les phrases de moins de trois mots', () => {
      expect(splitSentences(TEXT)).toHaveLength(4);
    });
  });

  describe('prepare', () => {
    const items = prepare(TEXT);

    it('garde une position stable pour chaque phrase', () => {
      expect(items.map((i) => i.id)).toEqual([0, 1, 2, 3]);
    });

    it('choisit un mot clé et le remplace par des tirets', () => {
      const bastille = items[0];
      expect(bastille.answer).toBe('1789');
      expect(bastille.cloze).toBe('La prise de la Bastille a lieu le 14 juillet _____.');
      expect(bastille.keywords).toContain('Bastille');
    });

    it('ignore les mots courants', () => {
      expect(items.flatMap((i) => i.keywords)).not.toContain('dans');
    });

    it('renvoie une liste vide quand le texte est trop court', () => {
      expect(prepare('Bonjour.')).toEqual([]);
    });
  });

  describe('choicesFor', () => {
    const items = prepare(TEXT);
    const noShuffle = () => 0.99;

    it('propose quatre choix dont la bonne réponse, sans doublon', () => {
      const choices = choicesFor(items[0], items, noShuffle)!;
      expect(choices).toHaveLength(4);
      expect(choices).toContain('1789');
      expect(new Set(choices.map(normalize)).size).toBe(4);
    });

    it('préfère des nombres comme faux choix pour une réponse numérique', () => {
      const choices = choicesFor(items[0], items, noShuffle)!;
      expect(choices.filter((c) => /^\d+$/.test(c)).length).toBeGreaterThanOrEqual(3);
    });

    it('renvoie null quand la leçon n’a pas assez de mots (carte en réponse libre)', () => {
      const small = prepare('La Bastille tombe en 1789.');
      expect(choicesFor(small[0], small)).toBeNull();
    });
  });

  describe('recalled', () => {
    const [bastille] = prepare(TEXT);

    it('reconnaît une phrase quand la moitié de ses mots clés est écrite, accents et casse ignorés', () => {
      expect(recalled(bastille, 'je me souviens de la BASTILLE et de 1789')).toBe(true);
    });

    it('ne la reconnaît pas sans ses mots clés', () => {
      expect(recalled(bastille, 'une révolution a eu lieu')).toBe(false);
    });
  });

  it('groupe les phrases par paquets de trois', () => {
    const parts = groupParts(prepare(TEXT), 3);
    expect(parts.map((p) => p.length)).toEqual([3, 1]);
  });
});
