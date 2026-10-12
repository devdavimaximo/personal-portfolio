import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { marquee } from '../content';
import { REDUCED } from '../lib/env';
import { scroller } from '../lib/scroller';

const BASE = 125; // px/s em repouso: rápido o bastante para ter vida, lento o bastante para ler
const COPIES = 3; // o loop embrulha a cada cópia; 3 cobrem telas largas com folga

/**
 * Faixa infinita de tecnologias.
 * - rola sozinha; a rolagem da página acelera e inverte o sentido
 * - mouse em cima (ou dedo segurando): desacelera, as palavras perto do ponteiro
 *   esticam no eixo wdth e acendem
 * - arrastar (mouse ou toque): pega a faixa e arremessa, com inércia
 */
export default function Marquee() {
  const band = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const group = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bandEl = band.current!;
    const el = track.current!;
    const items = Array.from(el.querySelectorAll<HTMLElement>('.marquee__item'));
    // x e skew pelo mesmo cache do GSAP, senão um sobrescreve o outro
    const setX = gsap.quickSetter(el, 'x', 'px') as (v: number) => void;
    const setSkew = gsap.quickSetter(el, 'skewX', 'deg') as (v: number) => void;
    const widths = items.map((it) => gsap.quickTo(it, '--w', { duration: 0.5, ease: 'power3' }));

    let width = group.current!.offsetWidth;
    const ro = new ResizeObserver(() => {
      width = group.current!.offsetWidth;
      geo = [];
    });
    ro.observe(group.current!);

    let x = 0;
    let dir = -1;
    let skew = 0;
    let hot = 0; // 0 → livre, 1 → ponteiro em cima / dedo segurando
    let hotTarget = 0;
    let pointerX = -1;
    let dragging = false;
    let dragId = -1;
    let lastX = 0;
    let lastT = 0;
    let dragV = 0; // px/s
    let fling = 0; // px/s, decai depois de soltar
    let waveOn = false;

    let geo: { off: number; w: number }[] = [];
    let bandLeft = 0;
    const measureGeo = () => {
      const tr = el.getBoundingClientRect();
      bandLeft = bandEl.getBoundingClientRect().left;
      geo = items.map((it) => {
        const r = it.getBoundingClientRect();
        return { off: r.left - tr.left, w: r.width };
      });
    };

    const wave = () => {
      const reach = Math.max(window.innerWidth * 0.2, 160);
      // primeiro lê todas as posições, depois escreve: intercalar leitura e escrita
      // forçava um layout por palavra a cada quadro
      // posições derivadas do deslocamento da faixa (x), sem ler layout a cada quadro:
      // a geometria é medida uma vez quando o ponteiro chega e no resize
      if (!geo.length) measureGeo();
      items.forEach((it, i) => {
        const left = bandLeft + x + geo[i].off;
        const r = { left, right: left + geo[i].w };
        if (r.right < -200 || r.left > window.innerWidth + 200) return;
        // distância até a borda da palavra (0 com o ponteiro em cima): palavras longas também acendem
        const d = Math.max(0, r.left - pointerX, pointerX - r.right);
        const k = hotTarget ? Math.max(0, 1 - d / reach) : 0;
        widths[i](125 + 30 * k * k);
        const near = k > 0.98;
        if (it.classList.contains('is-near') !== near) it.classList.toggle('is-near', near);
      });
      waveOn = hotTarget > 0;
    };

    const tick = (_: number, dtMs: number) => {
      const dt = Math.min(dtMs, 50) / 1000;
      const v = scroller.velocity;
      if (Math.abs(v) > 0.5) dir = v > 0 ? -1 : 1;
      hot += (hotTarget - hot) * (1 - Math.exp(-6 * dt));

      if (!dragging) {
        const auto = REDUCED ? 0 : dir * (BASE + Math.min(Math.abs(v), 80) * 12) * (1 - hot * 0.92);
        x += (auto + fling) * dt;
        fling *= Math.exp(-2.6 * dt);
      }
      if (width > 0) x = gsap.utils.wrap(-width, 0, x);
      setX(x);

      const motion = dragging ? dragV / 60 : fling / 60 - v;
      skew += (gsap.utils.clamp(-12, 12, -motion * 0.35) - skew) * 0.12;
      setSkew(skew);

      if (hotTarget || waveOn) wave();
    };
    gsap.ticker.add(tick);

    const enter = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      hotTarget = 1;
      pointerX = e.clientX;
      bandEl.classList.add('is-hot');
    };
    const leave = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || dragging) return;
      hotTarget = 0;
      bandEl.classList.remove('is-hot');
    };
    const down = (e: PointerEvent) => {
      dragging = true;
      dragId = e.pointerId;
      lastX = e.clientX;
      lastT = performance.now();
      dragV = 0;
      fling = 0;
      pointerX = e.clientX;
      hotTarget = 1;
      bandEl.classList.add('is-hot', 'is-grab');
      bandEl.setPointerCapture?.(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      pointerX = e.clientX;
      if (!dragging || e.pointerId !== dragId) return;
      const now = performance.now();
      const dx = e.clientX - lastX;
      x += dx;
      dragV = dragV * 0.6 + (dx / Math.max((now - lastT) / 1000, 1 / 240)) * 0.4;
      lastX = e.clientX;
      lastT = now;
    };
    const up = (e: PointerEvent) => {
      if (!dragging || e.pointerId !== dragId) return;
      dragging = false;
      fling = gsap.utils.clamp(-4000, 4000, dragV);
      if (Math.abs(fling) > 40) dir = fling > 0 ? 1 : -1;
      bandEl.classList.remove('is-grab');
      // no toque não existe "hover": soltou, a faixa volta a correr
      if (e.pointerType !== 'mouse' || !bandEl.matches(':hover')) {
        hotTarget = 0;
        bandEl.classList.remove('is-hot');
      }
    };

    bandEl.addEventListener('pointerenter', enter);
    bandEl.addEventListener('pointerleave', leave);
    bandEl.addEventListener('pointerdown', down);
    bandEl.addEventListener('pointermove', move);
    bandEl.addEventListener('pointerup', up);
    bandEl.addEventListener('pointercancel', up);

    return () => {
      gsap.ticker.remove(tick);
      ro.disconnect();
      bandEl.removeEventListener('pointerenter', enter);
      bandEl.removeEventListener('pointerleave', leave);
      bandEl.removeEventListener('pointerdown', down);
      bandEl.removeEventListener('pointermove', move);
      bandEl.removeEventListener('pointerup', up);
      bandEl.removeEventListener('pointercancel', up);
    };
  }, []);

  return (
    <div className="marquee" ref={band} aria-label={marquee.join(', ')} data-cursor="arraste">
      <div className="marquee__track" ref={track} aria-hidden="true">
        {Array.from({ length: COPIES }, (_, c) => (
          <div className="marquee__group" key={c} ref={c === 0 ? group : undefined}>
            {marquee.map((t, i) => (
              <span key={t} className={`marquee__item${i % 2 ? ' is-outline' : ''}`}>
                <span className="marquee__word">{t}</span>
                <i>✳</i>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
