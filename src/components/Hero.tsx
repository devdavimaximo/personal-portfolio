import { lazy, Suspense, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { hero, profile } from '../content';

// three.js fica fora do bundle inicial: o preloader aparece na hora e espera este chunk
const Portrait = lazy(() => import('../gl/Portrait'));
import { FINE_POINTER, REDUCED } from '../lib/env';
import { onReady, scrollToId, signals } from '../lib/scroller';
import { scramble } from '../lib/reveal';

export default function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const lines = q<HTMLElement>('.hero__line');

      gsap.set(lines, { '--w': 50, '--wg': 300, yPercent: 105 });
      gsap.set(q('[data-intro]'), { autoAlpha: 0, y: 24 });

      let armed = false;
      const off = onReady(() => {
        const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: () => void (armed = true) });
        tl.fromTo(lines, { yPercent: 105 }, { yPercent: 0, duration: REDUCED ? 0.01 : 1.4, stagger: 0.09 }, 0.15)
          .to(lines, { '--w': 100, '--wg': 820, duration: REDUCED ? 0.01 : 2.2, ease: 'power4.out', stagger: 0.09 }, 0.25)
          .to(q('[data-intro]'), { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.08 }, 0.7)
          .add(() => q<HTMLElement>('[data-scr]').forEach((el) => scramble(el, el.dataset.scr ?? '')), 0.7);
      });

      // a linha mais perto do cursor estica (eixo wdth da Anybody)
      if (FINE_POINTER && !REDUCED) {
        const setters = lines.map((el) => ({
          el,
          w: gsap.quickTo(el, '--w', { duration: 0.9, ease: 'power3' }),
          g: gsap.quickTo(el, '--wg', { duration: 0.9, ease: 'power3' }),
        }));
        // Performance: ler getBoundingClientRect logo depois de mudar a largura das letras
        // forçava layout a cada movimento do mouse, na página inteira. Agora a geometria
        // de repouso fica em cache (medida uma vez, e de novo só no resize) e o cálculo roda
        // uma vez por quadro, só com o hero visível e o mouse tendo se mexido.
        let geo: { cy: number; h: number; cx: number }[] = [];
        const measure = () => {
          geo = setters.map(({ el }) => {
            const r = el.getBoundingClientRect();
            return { cy: r.top + window.scrollY + r.height / 2, h: r.height, cx: r.left + r.width / 2 };
          });
        };
        let px = -1;
        let py = -1;
        let dirty = false;
        const move = (e: PointerEvent) => {
          px = e.clientX;
          py = e.clientY;
          dirty = true;
        };
        const tick = () => {
          if (!armed || !dirty || signals.heroOut >= 1) return;
          dirty = false;
          if (!geo.length) measure();
          const sy = window.scrollY;
          setters.forEach(({ w, g }, i) => {
            const { cy, h, cx } = geo[i];
            const k = Math.max(0, 1 - Math.abs(py - (cy - sy)) / (h * 1.6));
            const nearX = Math.max(0, 1 - Math.abs(px - cx) / (window.innerWidth * 0.7));
            w(100 + 48 * k * nearX);
            g(820 + 80 * k);
          });
        };
        // mede em repouso (largura 100), depois que a entrada terminar e a cada resize
        const offMeasure = onReady(() => gsap.delayedCall(2.6, measure));
        const onResize = () => (geo = []);
        window.addEventListener('pointermove', move, { passive: true });
        window.addEventListener('resize', onResize);
        gsap.ticker.add(tick);
        return () => {
          off();
          offMeasure();
          window.removeEventListener('pointermove', move);
          window.removeEventListener('resize', onResize);
          gsap.ticker.remove(tick);
        };
      }
      return off;
    },
    { scope: root },
  );

  // saída: o retrato recompila em blocos e o nome sobe em velocidades diferentes
  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      gsap.to(signals, {
        heroOut: 1,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      });
      // parallax na máscara, não na linha: a linha já é dona do transform da entrada
      q<HTMLElement>('.hero__mask').forEach((el, i) => {
        gsap.to(el, {
          xPercent: (i % 2 ? 1 : -1) * (8 + i * 4),
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
        });
      });
      gsap.to(q('.hero__meta, .hero__aside'), {
        y: -80,
        autoAlpha: 0,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: '45% top', scrub: true },
      });
    },
    { scope: root },
  );

  return (
    <section className="hero" id="top" ref={root}>
      <Suspense fallback={<div className="portrait" />}>
        <Portrait />
      </Suspense>

      <div className="hero__meta">
        <p className="label" data-intro>
          <span className="label__idx">(00)</span> <span data-scr={hero.kicker}>{hero.kicker}</span>
        </p>
        <p className="hero__lede" data-intro>
          {hero.lede} <em>{hero.ledeAccent}</em>
        </p>
        <p className="hero__hint hero__hint--touch" data-intro>
          <span className="hero__lens" aria-hidden="true" />
          {hero.hintTouch}
        </p>
      </div>

      <h1 className="hero__name" aria-label={profile.name}>
        {hero.lines.map((l, i) => (
          <span className="hero__mask" key={l} aria-hidden="true">
            <span className={`hero__line hero__line--${i}`}>{l}</span>
          </span>
        ))}
      </h1>

      <div className="hero__aside">
        <p className="hero__spec" data-intro>
          <span>Foco</span>
          <b>{profile.focus}</b>
          <span>Atua</span>
          <b>{profile.role.toLowerCase()}</b>
          <span>Base</span>
          <b>{profile.location} · UTC−3</b>
        </p>
        <p className="hero__hint" data-intro>
          <span className="hero__lens" aria-hidden="true" />
          {hero.hint}
        </p>
        <button className="hero__go" data-intro data-cursor="enviar" onClick={() => scrollToId('sobre')}>
          <span>role para enviar a requisição</span>
          <i aria-hidden="true">↓</i>
        </button>
      </div>
    </section>
  );
}
