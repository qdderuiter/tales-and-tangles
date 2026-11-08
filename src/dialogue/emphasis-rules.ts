/* Emphasis markup: *word* in a line's text marks words to stress. Pure rules, no DOM.
   A lone * (no partner on the same line, or an empty **) is kept as an ordinary character. */
export interface Emphasised { plain: string; em: boolean[] }     // em[k] is true when the k-th character (code point) of plain is stressed

export function parseEmphasis(raw: string): Emphasised {
  let plain = '';
  const em: boolean[] = [];
  const re = /\*([^*]+)\*/g;
  let last = 0, m: RegExpExecArray | null;
  const push = (s: string, on: boolean) => { for (const _ of s) em.push(on); plain += s; };
  while ((m = re.exec(raw))) {
    push(raw.slice(last, m.index), false);
    push(m[1], true);
    last = m.index + m[0].length;
  }
  push(raw.slice(last), false);
  return { plain, em };
}

/* the text without the markers (for voice-clip scripts and typing-speed maths) */
export const stripEmphasis = (raw: string): string => parseEmphasis(raw).plain;
