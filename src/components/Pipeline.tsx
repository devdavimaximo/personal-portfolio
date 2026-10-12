import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { stages } from '../content';
import { clamp } from '../lib/env';
import { onReady, PIPE_SPAN, PIPE_STAGES, signals } from '../lib/scroller';
import { scramble, useReveal } from '../lib/reveal';

const PipelineScene = lazy(() => import('../gl/PipelineScene'));

const TOTAL = stages.reduce((s, st) => s + st.ms, 0);
const TRACE_ID = '7f3a9c2e';

export default function Pipeline() {
  const root = useRef<HTMLElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const bars = useRef<(HTMLSpanElement | null)[]>([]);
  const rows = useRef<(HTMLLIElement | null)[]>([]);
  const elapsed = useRef<HTMLSpanElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const reveal = useRef<HTMLParagraphElement>(null);
  const trace = useRef<HTMLElement>(null);
  const [stage, setStage] = useState(0);
  const [active, setActive] = useState(false);
  const [seen, setSeen] = useState(false);
  useReveal(root);

  // monta o WebGL uma vez ao se aproximar; depois só pausa/retoma o loop
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => {
        setActive(e.isIntersecting);
        if (e.isIntersecting) setSeen(true);
      },
      { rootMargin: '600px 0px' },
    );
    if (root.current) io.observe(root.current);

    // monta o túnel (parado) no primeiro momento ocioso depois da abertura: criar a cena e
    // compilar shaders durante a rolagem causava um soluço ao chegar na seção
    let idle = 0;
    const off = onReady(() => {
      const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1200));
      idle = ric(() => setSeen(true), { timeout: 3000 } as IdleRequestOptions) as number;
    });
    return () => {
      io.disconnect();
      off();
      window.cancelIdleCallback?.(idle);
    };
  }, []);

  useGSAP(
    () => {
      let current = 0;
      ScrollTrigger.create({
        trigger: '.pipe__track',
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress;
          signals.pipeline = p;
          const s = p * PIPE_SPAN;
          const idx = Math.min(stages.length - 1, Math.floor(s));
          if (idx !== current) {
            current = idx;
            setStage(idx);
          }

          // waterfall do trace: cada span cresce enquanto o pacote está na sua camada
          let offset = 0;
          let ms = 0;
          stages.forEach((st, i) => {
            const f = clamp(s - i);
            const bar = bars.current[i];
            if (bar) {
              bar.style.left = `${(offset / TOTAL) * 100}%`;
              bar.style.width = `${((st.ms * f) / TOTAL) * 100}%`;
            }
            rows.current[i]?.classList.toggle('is-on', f > 0);
            rows.current[i]?.classList.toggle('is-now', i === idx);
            offset += st.ms;
            ms += st.ms * f;
          });
          if (elapsed.current) elapsed.current.textContent = ms.toFixed(1);
          if (fill.current) fill.current.style.transform = `scaleX(${p})`;
          // trecho final: painéis saem, a arquitetura inteira fica sozinha em cena
          const out = clamp((s - PIPE_STAGES - 0.02) / 0.3);
          if (panel.current) panel.current.style.opacity = String(1 - out);
          if (trace.current) trace.current.style.opacity = String(1 - out);
          if (reveal.current) reveal.current.style.opacity = String(clamp((s - PIPE_STAGES - 0.3) / 0.3));
        },
      });
    },
    { scope: root },
  );

  // troca de painel: entra de baixo, código e nome decodificam
  useGSAP(
    () => {
      const el = panel.current!;
      const parts = el.querySelectorAll('[data-in]');
      gsap.fromTo(parts, { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, ease: 'expo.out', stagger: 0.05 });
      el.querySelectorAll<HTMLElement>('[data-scr]').forEach((n) => scramble(n, n.dataset.scr ?? '', 0.7));
    },
    { scope: root, dependencies: [stage] },
  );

  const st = stages[stage];

  return (
    <section className="pipe" id="pipeline" ref={root}>
      <header className="pipe__intro">
        <p className="label">
          <span className="label__idx">(02)</span> <span data-scramble>/pipeline</span>
        </p>
        <h2 className="display" data-split>
          Anatomia de uma <em>requisição</em>
        </h2>
        <p className="pipe__sub" data-rise="0.1">
          Role e acompanhe um pacote atravessando cada camada de um backend que eu construiria para você, do Kestrel ao
          banco, e de volta.
        </p>
      </header>

      <div className="pipe__track">
        <div className="pipe__sticky">
          <div className="pipe__canvas" aria-hidden="true">
            {seen && (
              <Suspense fallback={null}>
                <PipelineScene active={active} />
              </Suspense>
            )}
          </div>
          <div className="pipe__vignette" aria-hidden="true" />

          <div className="pipe__panel" ref={panel} aria-live="polite">
            <p className="pipe__count" data-in>
              <b>{String(stage + 1).padStart(2, '0')}</b> / {String(stages.length).padStart(2, '0')}
            </p>
            <h3 className="pipe__name" data-in data-scr={st.name}>
              {st.name}
            </h3>
            <p className="pipe__title" data-in>
              {st.title}
            </p>
            <code className="pipe__code" data-in data-scr={st.code}>
              {st.code}
            </code>
            <p className="pipe__body" data-in>
              {st.body}
            </p>
            <ul className="pipe__tags" data-in>
              {st.tags.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>

          <aside className="trace" ref={trace} aria-label="Trace da requisição">
            <header className="trace__head">
              <span>trace · {TRACE_ID}</span>
              <span>
                <span ref={elapsed}>0.0</span> ms
              </span>
            </header>
            <ol className="trace__rows">
              {stages.map((s, i) => (
                <li key={s.id} ref={(n) => void (rows.current[i] = n)}>
                  <span className="trace__label">{s.name}</span>
                  <span className="trace__lane">
                    <span className="trace__bar" ref={(n) => void (bars.current[i] = n)} />
                  </span>
                  <span className="trace__ms">{s.ms}ms</span>
                </li>
              ))}
            </ol>
            <footer className="trace__foot">
              <span>status</span>
              <b>{stage === stages.length - 1 ? '200 OK' : 'em trânsito…'}</b>
            </footer>
          </aside>

          <p className="pipe__reveal" ref={reveal}>
            Vista de fora, o túnel vira o desenho da arquitetura: cada anel é uma camada, e as dependências apontam para
            dentro.
          </p>

          <div className="pipe__rail" aria-hidden="true">
            <div className="pipe__fill" ref={fill} />
            {stages.map((s, i) => (
              <span key={s.id} className={i <= stage ? 'is-on' : ''}>
                {s.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
