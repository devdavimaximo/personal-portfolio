import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { profile } from '../content';
import { FINE_POINTER, REDUCED } from '../lib/env';
import { scrollToId } from '../lib/scroller';
import { useReveal } from '../lib/reveal';

/** 5551995204679 → (51) 99520-4679 */
const formatPhone = (n: string) => n.replace(/^55(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');

const HEAD = ['Vamos construir', 'algo que', 'não cai?'];

export default function Contact() {
  const root = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  useReveal(root);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const chars = q<HTMLElement>('.contact__ch');

      // o título é guiado só pela rolagem: as letras sobem da máscara, saem da largura
      // mínima para a normal e uma onda de peso atravessa a frase. O hover usa outras
      // variáveis (--hw/--hg), então nada interrompe a entrada.
      if (REDUCED) {
        gsap.set(chars, { yPercent: 0, '--w': 100, '--wg': 300 });
      } else {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: '.contact__head', start: 'top 88%', end: 'top 30%', scrub: 0.8 },
        });
        tl.fromTo(
          chars,
          { yPercent: 120, '--w': 50 },
          { yPercent: 0, '--w': 100, ease: 'power3.out', duration: 1, stagger: 0.025 },
          0,
        ).fromTo(
          chars,
          { '--wg': 300 },
          { '--wg': 820, ease: 'sine.inOut', duration: 0.35, yoyo: true, repeat: 1, stagger: 0.025 },
          0.25,
        );
      }

      if (FINE_POINTER && !REDUCED) {
        // onda tipográfica no hover: cada letra estica e engorda conforme a distância do cursor.
        // Mexe só em --hw/--hg (acréscimo), então não interfere na entrada por rolagem.
        const head = q<HTMLElement>('.contact__head')[0];
        const setters = chars.map((el) => ({
          el,
          w: gsap.quickTo(el, '--hw', { duration: 0.6, ease: 'power3' }),
          g: gsap.quickTo(el, '--hg', { duration: 0.6, ease: 'power3' }),
        }));
        // centros das letras medidos uma vez ao entrar com o mouse (em coordenadas do documento);
        // durante o movimento só há contas, nenhuma leitura de layout
        let centers: { x: number; y: number }[] = [];
        const measure = () => {
          const sy = window.scrollY;
          centers = setters.map(({ el }) => {
            const r = el.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + sy + r.height / 2 };
          });
        };
        const wave = (e: PointerEvent) => {
          if (!centers.length) measure();
          const sy = window.scrollY;
          setters.forEach(({ w, g }, i) => {
            const c = centers[i];
            const k = Math.max(0, 1 - Math.hypot(e.clientX - c.x, e.clientY - (c.y - sy)) / 260);
            w(45 * k);
            g(600 * k);
          });
        };
        const calm = () => {
          centers = []; // a entrada por rolagem pode mover as letras: remede na próxima visita
          setters.forEach(({ w, g }) => (w(0), g(0)));
        };
        head.addEventListener('pointermove', wave);
        head.addEventListener('pointerleave', calm);

        // botões principais magnéticos: puxam o cursor de leve
        const offs = q<HTMLElement>('[data-magnet]').map((btn) => {
          const bx = gsap.quickTo(btn, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
          const by = gsap.quickTo(btn, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
          const pull = (e: PointerEvent) => {
            const r = btn.getBoundingClientRect();
            bx((e.clientX - (r.left + r.width / 2)) * 0.25);
            by((e.clientY - (r.top + r.height / 2)) * 0.35);
          };
          const release = () => (bx(0), by(0));
          btn.addEventListener('pointermove', pull);
          btn.addEventListener('pointerleave', release);
          return () => {
            btn.removeEventListener('pointermove', pull);
            btn.removeEventListener('pointerleave', release);
          };
        });
        return () => {
          offs.forEach((off) => off());
          head.removeEventListener('pointermove', wave);
          head.removeEventListener('pointerleave', calm);
        };
      }
    },
    { scope: root },
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${profile.email}`;
    }
  };

  return (
    <section className="contact" id="contato" ref={root}>
      <header className="sec-head">
        <p className="label">
          <span className="label__idx">(06)</span> <span data-scramble>/contato</span>
        </p>
        <p className="label label--right">POST /conversa</p>
      </header>

      <h2 className="contact__head" aria-label={HEAD.join(' ')}>
        {HEAD.map((line, i) => (
          <span key={line} className={`contact__line contact__line--${i}`} aria-hidden="true">
            {line.split('').map((c, k) => (
              <span key={k} className="contact__ch">
                {c === ' ' ? ' ' : c}
              </span>
            ))}
          </span>
        ))}
      </h2>

      {/* dois caminhos com o mesmo peso: quem contrata pessoa e quem contrata projeto */}
      <div className="paths">
        <article className="path" data-rise="0">
          <header className="path__head">
            <span className="path__verb">GET</span> /davi/curriculo
            <span className="path__who">para recrutadores</span>
          </header>
          <h3 className="path__title">
            Procurando um dev <em>backend .NET?</em>
          </h3>
          <a className="path__cta path__cta--bone" href={profile.resume} download data-magnet data-cursor="baixar">
            <span>Baixar currículo</span>
            <small>PDF · 2026</small>
            <i aria-hidden="true">↓</i>
          </a>
          <ul className="path__more">
            {profile.links
              .filter((l) => l.label === 'LinkedIn' || l.label === 'GitHub')
              .sort((x) => (x.label === 'LinkedIn' ? -1 : 1))
              .map((l) => (
                <li key={l.label}>
                  <a href={l.href} target="_blank" rel="noreferrer" data-cursor="abrir">
                    <span>{l.label}</span>
                    <small>{l.href.replace(/^https?:\/\/(www\.)?/, '')}</small>
                    <i aria-hidden="true">↗</i>
                  </a>
                </li>
              ))}
          </ul>
        </article>

        <article className="path" data-rise="0.1">
          <header className="path__head">
            <span className="path__verb">POST</span> /projeto
            <span className="path__who">para clientes</span>
          </header>
          <h3 className="path__title">
            Tem um sistema para <em>tirar do papel?</em>
          </h3>
          <a
            className="path__cta path__cta--accent"
            href={`https://wa.me/${profile.whatsapp}`}
            target="_blank"
            rel="noreferrer"
            data-magnet
            data-cursor="conversar"
          >
            <span>Chamar no WhatsApp</span>
            <small>{formatPhone(profile.whatsapp)}</small>
            <i aria-hidden="true">↗</i>
          </a>
          <ul className="path__more">
            <li>
              <a href={`mailto:${profile.email}`} data-cursor="escrever">
                <span>E-mail</span>
                <small>{profile.email}</small>
                <i aria-hidden="true">↗</i>
              </a>
            </li>
            <li>
              <button type="button" onClick={copy} aria-live="polite" data-cursor="copiar">
                <span>{copied ? 'Copiado ✓' : 'Copiar e-mail'}</span>
                <small>para colar onde preferir</small>
                <i aria-hidden="true">⧉</i>
              </button>
            </li>
          </ul>
        </article>
      </div>

      <footer className="foot">
        <span>© {new Date().getFullYear()} {profile.name}</span>
        <span className="foot__mid">React · Three.js · GSAP · e C# no coração</span>
        <button onClick={() => scrollToId('top')} data-cursor="subir">
          GET / <i aria-hidden="true">↑</i>
        </button>
      </footer>
    </section>
  );
}
