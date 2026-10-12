const mq = (q: string) => typeof window !== 'undefined' && window.matchMedia(q).matches;

/** celular/tablet: menos pixels, menos partículas, mesmo espetáculo */
export const LITE = mq('(max-width: 899px), (pointer: coarse)');
export const FINE_POINTER = mq('(pointer: fine)');
export const REDUCED = mq('(prefers-reduced-motion: reduce)');

export const clamp = (v: number, a = 0, b = 1) => Math.min(Math.max(v, a), b);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** amortecimento independente de frame rate */
export const damp = (a: number, b: number, k: number, dt: number) => a + (b - a) * (1 - Math.exp(-k * dt));
