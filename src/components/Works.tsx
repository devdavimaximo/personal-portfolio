import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { caseFilters, works, type Work } from '../content';
import { previews } from '../lib/previews';
import { FINE_POINTER, REDUCED } from '../lib/env';
import { useReveal } from '../lib/reveal';

/** canvas que desenha a prévia de um caso enquanto estiver montado */
function PreviewCanvas({ kind, active = true }: { kind: Work['preview']; active?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const kindRef = useRef(kind);
  kindRef.current = kind;

  useEffect(() => {
    if (!active) return;
    const c = ref.current!;
    const ctx = c.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    const start = performance.now();
    const resize = () => {
      c.width = c.clientWidth * dpr;
      c.height = c.clientHeight * dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c);
    const loop = () => {
      const w = c.width / dpr;
      const h = c.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      // a janela flutuante troca de prévia no mesmo canvas: estado de texto/traço não pode vazar
      ctx.save();
      previews[kindRef.current](ctx, w, h, REDUCED ? 4 : (performance.now() - start) / 1000);
      ctx.restore();
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [active]);

  return <canvas ref={ref} className="preview__canvas" aria-hidden="true" />;
}

/** a janela flutuante que segue o cursor sobre a lista */
function FloatingPreview({ hovered }: { hovered: Work | null }) {
  const box = useRef<HTMLDivElement>(null);
  const last = useRef<Work | null>(null);
  if (hovered) last.current = hovered;

  useEffect(() => {
    const el = box.current!;
    const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
    const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
    const rot = gsap.quickTo(el, 'rotation', { duration: 0.8, ease: 'power3' });
    let px = 0;
    const move = (e: PointerEvent) => {
      x(e.clientX + 28);
      y(e.clientY - 140);
      rot(gsap.utils.clamp(-8, 8, (e.clientX - px) * 0.4));
      px = e.clientX;
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);

  useEffect(() => {
    gsap.to(box.current, {
      autoAlpha: hovered ? 1 : 0,
      overwrite: 'auto', // mostrar e esconder em sequência rápida: a última ordem vence
      scale: hovered ? 1 : 0.85,
      duration: hovered ? 0.5 : 0.12,
      ease: hovered ? 'expo.out' : 'power2.in',
    });
  }, [hovered]);

  const w = hovered ?? last.current ?? works[0];
  return (
    <div className="preview" ref={box} aria-hidden="true">
      <header>
        <span>{w.route}</span>
        <span>200</span>
      </header>
      <PreviewCanvas kind={w.preview} active={!!hovered} />
    </div>
  );
}

function Row({ work, open, onToggle, onHover }: { work: Work; open: boolean; onToggle: () => void; onHover: (w: Work | null) => void }) {
  const body = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useEffect(() => {
    const el = body.current!;
    if (first.current) {
      first.current = false;
      gsap.set(el, { height: 0 });
      return;
    }
    gsap.to(el, { height: open ? 'auto' : 0, duration: 0.9, ease: 'expo.inOut' });
    if (open) gsap.fromTo(el.querySelectorAll('[data-d]'), { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, delay: 0.2, stagger: 0.05, ease: 'expo.out' });
  }, [open]);

  return (
    <li className={`work ${open ? 'is-open' : ''}`} data-rise="0">
      <button
        className="work__row"
        aria-expanded={open}
        aria-controls={`work-${work.id}`}
        onClick={onToggle}
        onPointerEnter={() => onHover(work)}
        onPointerLeave={() => onHover(null)}
        data-cursor={open ? 'fechar' : 'abrir'}
      >
        <span className="work__idx">{work.index}</span>
        <span className="work__route">
          <b>GET</b> {work.route.replace('GET ', '')}
        </span>
        <span className="work__name">
          {work.name}
          <span className={work.links ? 'work__tag is-live' : 'work__tag'}>{work.links ? '↗ link' : '● privado'}</span>
        </span>
        <span className="work__kind">{work.kind}</span>
        <span className="work__year">{work.year}</span>
        <span className="work__plus" aria-hidden="true" />
      </button>

      <div className="work__body" id={`work-${work.id}`} ref={body}>
        <div className="work__grid">
          <div className="work__col">
            <p className="work__summary" data-d>
              {work.summary}
            </p>
            <ul className="work__points" data-d>
              {work.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
          <div className="work__col">
            <p className="work__status" data-d>
              <i /> {work.status}
            </p>
            {work.privacy && (
              <p className="work__privacy" data-d>
                <b>Por que não tem link?</b> {work.privacy}
              </p>
            )}
            {work.links && (
              <ul className="work__links" data-d>
                {work.links.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} target="_blank" rel="noreferrer" data-cursor="visitar" tabIndex={open ? undefined : -1}>
                      {l.label} <span aria-hidden="true">↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <pre className="work__snippet" data-d>
              <code>{work.snippet}</code>
            </pre>
            <ul className="work__stack" data-d>
              {work.stack.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            {!FINE_POINTER && open && (
              <div className="work__inline" data-d>
                <PreviewCanvas kind={work.preview} />
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

export default function Works() {
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [hovered, setHovered] = useState<Work | null>(null);
  const hoveredRef = useRef<Work | null>(null);
  hoveredRef.current = hovered;
  const [filter, setFilter] = useState<(typeof caseFilters)[number]['id']>('all');
  const list = useRef<HTMLUListElement>(null);
  useReveal(root);

  const isLinked = (w: Work) => !!w.links?.length;
  const visible = works.filter((w) => filter === 'all' || (filter === 'linked' ? isLinked(w) : !isLinked(w)));
  const count = (id: string) => (id === 'all' ? works.length : works.filter((w) => (id === 'linked') === isLinked(w)).length);
  const note = caseFilters.find((f) => f.id === filter)?.note;

  const pick = (id: typeof filter) => {
    if (id === filter) return;
    setOpen(null);
    setFilter(id);
  };

  // troca de filtro: as linhas que ficaram sobem em cascata
  useEffect(() => {
    if (!list.current) return;
    gsap.fromTo(
      list.current.querySelectorAll('.work'),
      { y: 24, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.7, ease: 'expo.out', stagger: 0.05, clearProps: 'transform,opacity,visibility' },
    );
  }, [filter]);

  // rolar move a página sob um mouse parado e o navegador não dispara pointerleave:
  // a cada scroll, confere o que realmente está sob o cursor
  useEffect(() => {
    if (!FINE_POINTER) return;
    let px = -1;
    let py = -1;
    const track = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
    };
    // a cada quadro, enquanto houver prévia: o Chrome ainda dispara pointerenter
    // sintético depois do scroll, então checar só no evento de scroll não basta
    let lastKey = '';
    const check = () => {
      if (px < 0 || !hoveredRef.current) return;
      const key = `${px},${py},${Math.round(window.scrollY)}`;
      if (key === lastKey) return;
      lastKey = key;
      const row = document.elementFromPoint(px, py)?.closest<HTMLElement>('.work__row');
      const id = row?.getAttribute('aria-controls')?.replace('work-', '');
      if (id !== hoveredRef.current.id) setHovered(id ? works.find((w) => w.id === id) ?? null : null);
    };
    window.addEventListener('pointermove', track, { passive: true });
    gsap.ticker.add(check);
    return () => {
      window.removeEventListener('pointermove', track);
      gsap.ticker.remove(check);
    };
  }, []);

  // o terminal pode abrir um caso: `open beemov`
  useEffect(() => {
    const onOpen = (e: Event) => {
      setFilter('all');
      setOpen((e as CustomEvent<string>).detail);
    };
    window.addEventListener('open-case', onOpen);
    return () => window.removeEventListener('open-case', onOpen);
  }, []);

  useGSAP(
    () => {
      gsap.from('.works__count', {
        textContent: 0,
        snap: { textContent: 1 },
        duration: 1.4,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.works__count', start: 'top 90%', once: true },
      });
    },
    { scope: root },
  );

  return (
    <section className="works" id="cases" ref={root}>
      <header className="sec-head">
        <p className="label">
          <span className="label__idx">(03)</span> <span data-scramble>/cases</span>
        </p>
        <p className="label label--right">o que já respondeu 200</p>
      </header>
      <h2 className="display works__title" data-split>
        Casos <sup className="works__count">{works.length}</sup>
      </h2>

      <div className="works__filter" role="tablist" aria-label="Filtrar casos">
        {caseFilters.map((f) => (
          <button
            key={f.id}
            role="tab"
            aria-selected={filter === f.id}
            className={filter === f.id ? 'is-on' : ''}
            onClick={() => pick(f.id)}
            data-cursor="filtrar"
          >
            {f.label} <sup>{String(count(f.id)).padStart(2, '0')}</sup>
          </button>
        ))}
      </div>
      {note && (
        <p className="works__note" key={filter}>
          {note}
        </p>
      )}

      <ul className="works__list" ref={list} onPointerLeave={() => setHovered(null)}>
        {visible.map((w) => (
          <Row
            key={w.id}
            work={w}
            open={open === w.id}
            onToggle={() => setOpen((o) => (o === w.id ? null : w.id))}
            onHover={(x) => setHovered(x && open !== x.id ? x : null)}
          />
        ))}
      </ul>

      {FINE_POINTER && <FloatingPreview hovered={hovered && hovered.id !== open ? hovered : null} />}
    </section>
  );
}
