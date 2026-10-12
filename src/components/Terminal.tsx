import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { run, SUGGESTIONS, type OutLine } from '../lib/shell';
import { LITE, REDUCED } from '../lib/env';
import { scrollToId } from '../lib/scroller';
import { useReveal } from '../lib/reveal';

type Entry = { id: number; cmd?: string; line?: OutLine };

let uid = 0;
const PROMPT = 'visitante@davi:~$';

export default function Terminal() {
  const root = useRef<HTMLElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [entries, setEntries] = useState<Entry[]>([
    { id: uid++, line: { kind: 'dim', text: 'Davi.Portfolio shell, conectado via HTTPS. Digite help.' } },
  ]);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const history = useRef<string[]>([]);
  const cursor = useRef(-1);
  useReveal(root);

  const submit = (raw: string) => {
    if (busy) return;
    const cmd = raw.trim();
    setValue('');
    if (!cmd) return;
    history.current.unshift(cmd);
    cursor.current = -1;
    const reply = run(cmd);
    setEntries((e) => [...e, { id: uid++, cmd }]);

    const fx = reply.effect;
    if (fx?.type === 'clear') {
      setEntries([]);
      return;
    }
    // as linhas chegam uma a uma, como um stream de resposta
    setBusy(true);
    reply.lines.forEach((line, i) => {
      window.setTimeout(
        () => setEntries((e) => [...e, { id: uid++, line }]),
        REDUCED ? 0 : 120 + i * 55,
      );
    });
    window.setTimeout(
      () => {
        setBusy(false);
        if (fx?.type === 'open-case') {
          window.dispatchEvent(new CustomEvent('open-case', { detail: fx.id }));
          scrollToId('cases');
        } else if (fx?.type === 'scroll') scrollToId(fx.id);
        else if (fx?.type === 'glitch') {
          document.documentElement.classList.add('is-glitch');
          window.setTimeout(() => document.documentElement.classList.remove('is-glitch'), 1600);
        }
      },
      REDUCED ? 0 : 140 + reply.lines.length * 55,
    );
  };

  useEffect(() => {
    const el = screen.current;
    if (el) el.scrollTop = el.scrollHeight;
    // no celular o terminal cresce com a página: se a pessoa está digitando,
    // mantém o campo à vista conforme a resposta chega
    if (LITE && document.activeElement === input.current) input.current?.scrollIntoView({ block: 'nearest' });
  }, [entries]);

  // primeira visita: o próprio terminal puxa conversa
  useEffect(() => {
    let typing: gsap.core.Tween | null = null;
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: 'top 55%',
      once: true,
      onEnter: () => {
        const text = 'oi';
        const s = { n: 0 };
        typing = gsap.to(s, {
          n: text.length,
          duration: REDUCED ? 0 : 0.5,
          delay: 0.6,
          ease: 'none',
          onUpdate: () => setValue(text.slice(0, Math.round(s.n))),
          onComplete: () => window.setTimeout(() => submit(text), 250),
        });
      },
    });
    return () => {
      st.kill();
      typing?.kill();
    };
  }, []);

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submit(value);
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      cursor.current = Math.min(history.current.length - 1, cursor.current + 1);
      setValue(history.current[cursor.current] ?? '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      cursor.current = Math.max(-1, cursor.current - 1);
      setValue(cursor.current < 0 ? '' : history.current[cursor.current]);
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setEntries([]);
    }
  };

  return (
    <section className="term-sec" id="terminal" ref={root}>
      <header className="sec-head">
        <p className="label">
          <span className="label__idx">(05)</span> <span data-scramble>/terminal</span>
        </p>
        <p className="label label--right">uma conversa, em texto puro</p>
      </header>

      <div className="term-sec__grid">
        <div className="term-sec__copy">
          <h2 className="display" data-split>
            Pergunte ao <em>servidor.</em>
          </h2>
          <p data-rise="0.1">
            Digite <code>help</code> ou escreva do seu jeito: “quais projetos?”, “o que você usa?”, “como te contrato?”.
          </p>
        </div>

        <div className="term" data-rise="0.1" onClick={() => input.current?.focus({ preventScroll: true })}>
          <div className="term__bar">
            <span className="term__dot" />
            <span>davi@portfolio · bash · 80×24</span>
            <span className="term__tls">TLS 1.3</span>
          </div>
          <div className="term__screen" ref={screen} data-lenis-prevent role="log" aria-live="polite">
            {entries.map((e) =>
              e.cmd !== undefined ? (
                <p key={e.id} className="term__cmd">
                  <span className="term__prompt">{PROMPT}</span> {e.cmd}
                </p>
              ) : e.line?.kind === 'link' ? (
                <p key={e.id} className="term__line t-link">
                  <a href={e.line.href} target={e.line.href?.startsWith('mailto') ? undefined : '_blank'} rel="noreferrer">
                    {e.line.text}
                  </a>
                </p>
              ) : (
                <p key={e.id} className={`term__line t-${e.line?.kind}`}>
                  {e.line?.text}
                </p>
              ),
            )}
            <label className="term__input">
              <span className="term__prompt">{PROMPT}</span>
              <input
                ref={input}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={onKey}
                spellCheck={false}
                autoComplete="off"
                autoCapitalize="off"
                aria-label="Comando do terminal"
                data-cursor="digite"
              />
            </label>
          </div>
          <div className="term__chips">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={(ev) => (ev.stopPropagation(), submit(s))} disabled={busy}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
