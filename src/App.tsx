import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';
import Lenis from 'lenis';
import { REDUCED } from './lib/env';
import { onReady, scroller } from './lib/scroller';
import Preloader from './components/Preloader';
import Hud from './components/Hud';
import Cursor from './components/Cursor';
import Hero from './components/Hero';
import Marquee from './components/Marquee';
import Manifesto from './components/Manifesto';
import Pipeline from './components/Pipeline';
import Works from './components/Works';
import Source from './components/Source';
import Terminal from './components/Terminal';
import Contact from './components/Contact';

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

export default function App() {
  useEffect(() => {
    document.documentElement.classList.add('is-loading');
    const lenis = REDUCED ? null : new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
    scroller.lenis = lenis;

    const tick = (t: number) => lenis?.raf(t * 1000);
    if (lenis) {
      lenis.stop();
      lenis.on('scroll', (l: Lenis) => {
        scroller.velocity = l.velocity;
        scroller.progress = l.progress;
        ScrollTrigger.update();
      });
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }

    const off = onReady(() => {
      document.documentElement.classList.remove('is-loading');
      lenis?.start();
      ScrollTrigger.refresh();
    });

    // fontes variáveis mudam métricas depois de carregar: recalcula os gatilhos
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      off();
      gsap.ticker.remove(tick);
      lenis?.destroy();
      scroller.lenis = null;
    };
  }, []);

  return (
    <>
      <Preloader />
      <Cursor />
      <Hud />
      <div className="grain" aria-hidden="true" />
      <main>
        <Hero />
        <Marquee />
        <Manifesto />
        <Pipeline />
        <Works />
        <Source />
        <Terminal />
        <Contact />
      </main>
    </>
  );
}
