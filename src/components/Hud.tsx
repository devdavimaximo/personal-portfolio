import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { profile } from '../content';
import { scrollToId, onReady } from '../lib/scroller';

const NAV = [
  { id: 'pipeline', label: 'pipeline' },
  { id: 'cases', label: 'cases' },
  { id: 'davi-cs', label: 'davi.cs' },
  { id: 'terminal', label: 'terminal' },
  { id: 'contato', label: 'contato' },
];

const ROUTES: Record<string, string> = {
  top: '/',
  sobre: '/sobre',
  pipeline: '/pipeline',
  cases: '/cases',
  'davi-cs': '/davi.cs',
  terminal: '/terminal',
  contato: '/contato',
};

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: profile.timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(now);
}

export default function Hud() {
  const clock = useClock();
  const root = useRef<HTMLDivElement>(null);
  const req = useRef<HTMLDivElement>(null);
  const [route, setRoute] = useState('top');
  const [ms, setMs] = useState(4);

  useEffect(() => {
    const triggers = Object.keys(ROUTES).map((id) =>
      ScrollTrigger.create({
        trigger: `#${id}`,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => {
          if (!self.isActive) return;
          setRoute(id);
          setMs(3 + Math.round(Math.random() * 18));
        },
      }),
    );
    // o pill some no rodapé para não cobrir o ©
    triggers.push(
      ScrollTrigger.create({
        trigger: '.foot',
        start: 'top bottom',
        onToggle: (self) => req.current?.classList.toggle('is-away', self.isActive),
      }),
    );
    const off = onReady(() => {
      gsap.from(root.current!.querySelectorAll('[data-hud]'), {
        y: -18,
        autoAlpha: 0,
        duration: 1,
        ease: 'expo.out',
        stagger: 0.06,
        delay: 0.5,
        clearProps: 'opacity,visibility,transform',
      });
    });
    return () => {
      off();
      triggers.forEach((t) => t.kill());
    };
  }, []);

  return (
    <div className="hud" ref={root}>
      <header className="hud__top">
        <a
          href="#top"
          className="hud__mark"
          data-hud
          data-cursor="início"
          onClick={(e) => {
            e.preventDefault();
            scrollToId('top');
          }}
        >
          <span className="hud__glyph">&lt;D/&gt;</span>
          <span className="hud__name">{profile.name}</span>
        </a>
        <nav className="hud__nav" aria-label="Seções" data-hud>
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              className={route === n.id ? 'is-on' : ''}
              onClick={(e) => {
                e.preventDefault();
                scrollToId(n.id);
              }}
            >
              <span>/</span>
              {n.label}
            </a>
          ))}
        </nav>
        <div className="hud__right" data-hud>
          <span className="hud__clock" aria-label="Horário de Brasília">
            BRT {clock}
          </span>
          {profile.available && (
            <span className="hud__status">
              <i /> disponível
            </span>
          )}
        </div>
      </header>
      {/* no hero o pill fica escondido: a requisição só é "enviada" quando se rola */}
      <div className={route === 'top' ? 'hud__req is-home' : 'hud__req'} ref={req} data-hud aria-hidden="true">
        <span className="hud__verb">GET</span>
        <span className="hud__route">{ROUTES[route]}</span>
        <span className="hud__code">200</span>
        <span className="hud__ms">{ms}ms</span>
      </div>
    </div>
  );
}
