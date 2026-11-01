import { buildPrompt, parseReply } from './ai-prompt';

describe('ai-prompt', () => {
  it('place le texte de la leçon dans le prompt', () => {
    const prompt = buildPrompt('La Bastille tombe en 1789.');
    expect(prompt).toContain('<<<\nLa Bastille tombe en 1789.\n>>>');
    expect(prompt).toContain('"distractors"');
  });

  it('lit une réponse entourée de texte et de balises de code', () => {
    const reply = 'Voici :\n```json\n{"items":[{"sentence":"La Bastille tombe en 1789.","answer":"Bastille","distractors":["Louvre","Sorbonne","Versailles"],"keywords":["Bastille","1789"]}]}\n```\nBon courage !';
    expect(parseReply(reply)).toEqual([
      { sentence: 'La Bastille tombe en 1789.', answer: 'Bastille', keywords: ['1789'], distractors: ['Louvre', 'Sorbonne', 'Versailles'] },
    ]);
  });

  it('accepte les guillemets typographiques', () => {
    const reply = '{\u201citems\u201d:[{\u201csentence\u201d:\u201dL\u2019altruisme est d\u00e9sint\u00e9ress\u00e9.\u201d,\u201danswer\u201d:\u201dd\u00e9sint\u00e9ress\u00e9\u201d,\u201ddistractors\u201d:[\u201c\u00e9go\u00efste\u201d,\u201dcalcul\u00e9\u201d,\u201dint\u00e9ress\u00e9\u201d]}]}';
    const items = parseReply(reply);
    expect(items).toHaveLength(1);
    expect(items[0].distractors).toEqual(['\u00e9go\u00efste', 'calcul\u00e9', 'int\u00e9ress\u00e9']);
  });

  it('écarte les éléments dont la réponse n’est pas dans la phrase ou trop longs', () => {
    const reply = JSON.stringify({
      items: [
        { sentence: 'Une phrase.', answer: 'absent' },
        { sentence: 'x'.repeat(601), answer: 'x' },
        { sentence: 'Paris est la capitale.', answer: 'Paris' },
      ],
    });
    expect(parseReply(reply).map((i) => i.answer)).toEqual(['Paris']);
  });

  it('retombe sur la réponse comme mot clé et vide les faux choix incomplets ou en double', () => {
    const [item] = parseReply('{"items":[{"sentence":"Paris est la capitale.","answer":"Paris","keywords":[],"distractors":["Lyon","lyon","Paris"]}]}');
    expect(item.keywords).toEqual(['Paris']);
    expect(item.distractors).toEqual([]);
  });

  it('renvoie une liste vide pour une réponse inutilisable', () => {
    expect(parseReply('désolé, je ne peux pas')).toEqual([]);
    expect(parseReply('{"items": "non"}')).toEqual([]);
    expect(parseReply('{pas du json}')).toEqual([]);
  });

  it('garde 80 éléments au plus', () => {
    const items = Array.from({ length: 90 }, (_, i) => ({ sentence: `Phrase numéro ${i}.`, answer: 'Phrase' }));
    expect(parseReply(JSON.stringify({ items }))).toHaveLength(80);
  });
});
