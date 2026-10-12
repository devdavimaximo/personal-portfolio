import type Lenis from 'lenis';

export const scroller: { lenis: Lenis | null; velocity: number; progress: number } = {
  lenis: null,
  velocity: 0,
  progress: 0,
};

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (scroller.lenis) scroller.lenis.scrollTo(el, { duration: 2 });
  else el.scrollIntoView({ behavior: 'smooth' });
}

/**
 * extensão do túnel em "estágios": 7 camadas + um trecho final em que a câmera
 * sai de lado e mostra a arquitetura inteira
 */
export const PIPE_STAGES = 7;
export const PIPE_SPAN = 7.8;

/** estado compartilhado entre DOM (ScrollTrigger) e WebGL (useFrame) sem re-render */
export const signals = {
  heroOut: 0,
  pipeline: 0,
  introAt: -1,
};

type Listener = () => void;
const ready: { done: boolean; listeners: Listener[] } = { done: false, listeners: [] };

/** o preloader chama quando sai de cena; o hero escuta para começar o espetáculo */
export function markReady() {
  if (ready.done) return;
  ready.done = true;
  signals.introAt = performance.now();
  ready.listeners.splice(0).forEach((fn) => fn());
}

/** devolve a função que cancela a inscrição (StrictMode monta efeitos duas vezes) */
export function onReady(fn: Listener) {
  if (ready.done) {
    fn();
    return () => {};
  }
  ready.listeners.push(fn);
  return () => {
    const i = ready.listeners.indexOf(fn);
    if (i >= 0) ready.listeners.splice(i, 1);
  };
}
