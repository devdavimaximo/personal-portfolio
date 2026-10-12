import { useMemo, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { principles, source } from '../content';
import { highlight } from '../lib/csharp';
import { LITE, REDUCED } from '../lib/env';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReveal } from '../lib/reveal';

export default function Source() {
  const root = useRef<HTMLElement>(null);
  const code = useRef<HTMLElement>(null);
  const pos = useRef<HTMLSpanElement>(null);
  const build = useRef<HTMLSpanElement>(null);
  const lines = useMemo(() => source.split('\n').length, []);
  useReveal(root);

  useGSAP(
    () => {
      const state = { n: REDUCED ? source.length : 0 };
      let last = -1;
      const render = () => {
        const n = Math.round(state.n);
        if (n === last) return;
        last = n;
        const typed = source.slice(0, n);
        code.current!.innerHTML = highlight(typed) + '<span class="caret"></span>';
        const rows = typed.split('\n');
        if (pos.current) pos.current.textContent = `Ln ${rows.length}, Col ${rows[rows.length - 1].length + 1}`;
        const done = n >= source.length;
        build.current?.classList.toggle('is-ok', done);
        if (build.current) build.current.textContent = done ? '✓ Build succeeded · 0 warnings' : '● compilando…';
      };
      render();
      if (REDUCED) return;
      gsap.to(state, {
        n: source.length,
        ease: 'none',
        onUpdate: render,
        scrollTrigger: { trigger: root.current, start: 'top 70%', end: 'bottom 85%', scrub: 0.6 },
      });
    },
    { scope: root },
  );

  // mobile: quando um card de princípio passa por cima do editor, o editor desfoca e
  // escurece na proporção da sobreposição, para o texto do card não brigar com o código
  useGSAP(
    () => {
      if (!LITE) return;
      const q = gsap.utils.selector(root);
      const editor = q<HTMLElement>('.editor')[0];
      const cards = q<HTMLElement>('.source__principles li');
      let covered = false;
      ScrollTrigger.create({
        trigger: root.current,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: () => {
          const e = editor.getBoundingClientRect();
          let cover = 0;
          for (const c of cards) {
            const r = c.getBoundingClientRect();
            const overlap = Math.min(e.bottom, r.bottom) - Math.max(e.top, r.top);
            if (overlap > 0) cover = Math.max(cover, Math.min(1, overlap / Math.min(e.height, 160)));
          }
          // liga/desliga com transição de CSS: mudar o blur a cada quadro de rolagem repintava o editor inteiro
          const next = cover > 0.15;
          if (next !== covered) {
            covered = next;
            editor.classList.toggle('is-covered', next);
          }
        },
      });
    },
    { scope: root },
  );

  return (
    <section className="source" id="davi-cs" ref={root}>
      <header className="sec-head">
        <p className="label">
          <span className="label__idx">(04)</span> <span data-scramble>/davi.cs</span>
        </p>
        <p className="label label--right">sobre mim, na minha língua</p>
      </header>

      <div className="source__grid">
        <div className="source__sticky">
          <div className="editor" data-rise="0">
            <div className="editor__tabs">
              <span className="is-on">Davi.cs</span>
              <span>Program.cs</span>
              <span className="editor__crumb">Brasil.Dev › Davi</span>
            </div>
            <div className="editor__body">
              <ol className="editor__gutter" aria-hidden="true">
                {Array.from({ length: lines }, (_, i) => (
                  <li key={i}>{i + 1}</li>
                ))}
              </ol>
              <pre className="editor__code" aria-label={source}>
                <code ref={code} />
              </pre>
            </div>
            <div className="editor__status">
              <span ref={build}>● compilando…</span>
              <span>
                <span ref={pos}>Ln 1, Col 1</span> · UTF-8 · C# 14
              </span>
            </div>
          </div>
        </div>

        <ol className="source__principles">
          {principles.map((p, i) => (
            <li key={p.k}>
              <span className="source__n">{String(i + 1).padStart(2, '0')}</span>
              <p data-split>
                <b>{p.k}</b> {p.v}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
