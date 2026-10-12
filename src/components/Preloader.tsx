import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { loadPortrait } from '../lib/portrait';
import { REDUCED } from '../lib/env';
import { markReady } from '../lib/scroller';

type Line = { text: string; tone?: 'dim' | 'ok' | 'info' | 'cmd' };

const BOOT: Line[] = [
  { text: '$ dotnet run --project Davi.Portfolio -c Release', tone: 'cmd' },
  { text: '  Determining projects to restore...', tone: 'dim' },
  { text: '  All projects are up-to-date for restore.', tone: 'dim' },
  { text: '  Davi.Portfolio -> bin/Release/net10.0/Davi.Portfolio.dll', tone: 'dim' },
  { text: 'Build succeeded.  0 Warning(s)  0 Error(s)', tone: 'ok' },
  { text: 'info: Microsoft.Hosting.Lifetime[14]', tone: 'info' },
  { text: '      Now listening on: https://localhost:7070' },
  { text: 'info: Microsoft.Hosting.Lifetime[0]', tone: 'info' },
  { text: '      Application started. Press Ctrl+C to shut down.' },
];

export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(0);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const progress = { v: 0 };
    const assets = Promise.all([
      loadPortrait(),
      import('../gl/Portrait'),
      document.fonts?.ready,
      new Promise((r) => setTimeout(r, REDUCED ? 200 : 1900)),
    ]);

    // linhas do boot aparecem num ritmo de log real
    let i = 0;
    const iv = window.setInterval(() => {
      i = Math.min(BOOT.length, i + 1);
      setShown(i);
      if (i >= BOOT.length) window.clearInterval(iv);
    }, REDUCED ? 20 : 190);

    const draw = () => {
      if (count.current) count.current.textContent = String(Math.round(progress.v)).padStart(3, '0');
    };
    const crawl = gsap.to(progress, { v: 86, duration: 2.2, ease: 'power2.out', onUpdate: draw });

    assets
      .catch(() => undefined)
      .then(() => {
        if (cancelled) return;
        crawl.kill();
        const tl = gsap.timeline({
          onComplete: () => {
            setGone(true);
          },
        });
        tl.to(progress, { v: 100, duration: REDUCED ? 0.1 : 0.55, ease: 'power3.inOut', onUpdate: draw })
          .add(() => {
            window.clearInterval(iv);
            setShown(BOOT.length);
          })
          .to('.preloader__term', { autoAlpha: 0, y: -24, duration: 0.5, ease: 'power3.in' }, '+=0.25')
          .to('.preloader__count', { yPercent: -110, duration: 0.6, ease: 'expo.in' }, '<')
          .add(markReady, '-=0.05')
          .to('.preloader__bar', { scaleY: 0, duration: 0.9, ease: 'expo.inOut', stagger: { each: 0.05, from: 'end' } }, '<');
      });

    return () => {
      cancelled = true;
      window.clearInterval(iv);
      crawl.kill();
    };
  }, []);

  if (gone) return null;

  return (
    <div className="preloader" ref={root} aria-live="polite" aria-label="Carregando">
      <div className="preloader__bars" aria-hidden="true">
        {Array.from({ length: 6 }, (_, k) => (
          <span key={k} className="preloader__bar" />
        ))}
      </div>
      <pre className="preloader__term">
        {BOOT.slice(0, shown).map((l, k) => (
          <span key={k} className={`t-${l.tone ?? 'base'}`}>
            {l.text}
            {'\n'}
          </span>
        ))}
        <span className="caret" />
      </pre>
      <div className="preloader__count">
        <span ref={count}>000</span>
        <small>%</small>
      </div>
    </div>
  );
}
