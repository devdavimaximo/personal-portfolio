/** realce de sintaxe C# mínimo, o suficiente para o Davi.cs parecer um editor de verdade */

const KEYWORDS = new Set(
  'namespace public private protected internal sealed class record struct interface static readonly async await return var new if else true false null string int bool void using get set init this'.split(' '),
);

const RE = /(\/\/\/[^\n]*|\/\/[^\n]*)|("(?:[^"\\]|\\.)*"?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)|(\s+)|(.)/g;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function highlight(src: string): string {
  let out = '';
  let prev = '';
  for (const m of src.matchAll(RE)) {
    const [tok, comment, str, num, ident, ws] = m;
    if (comment) out += `<span class="c-com">${esc(tok)}</span>`;
    else if (str) out += `<span class="c-str">${esc(tok)}</span>`;
    else if (num) out += `<span class="c-num">${tok}</span>`;
    else if (ident) {
      if (KEYWORDS.has(tok)) out += `<span class="c-kw">${tok}</span>`;
      else if (/^[A-Z]/.test(tok)) out += `<span class="c-type${prev === '.' ? ' c-member' : ''}">${tok}</span>`;
      else out += `<span class="c-id">${tok}</span>`;
    } else if (ws) out += tok;
    else out += `<span class="c-pun">${esc(tok)}</span>`;
    if (!ws) prev = tok;
  }
  return out;
}
