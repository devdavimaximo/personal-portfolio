import type { RefObject } from 'react';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';
import { LITE } from './env';

/**
 * [data-split] → linhas sobem por trás de uma máscara
 * [data-rise]  → bloco sobe e aparece (valor = atraso)
 * [data-words] → palavras acendem no ritmo da leitura
 * [data-scramble] → texto mono “decodifica” ao entrar na tela
 */
export function useReveal(scope: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const q = gsap.utils.selector(scope);

      q('[data-split]').forEach((el: HTMLElement) => {
        SplitText.create(el, {
          type: 'lines',
          mask: 'lines',
          linesClass: 'ln',
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 110,
              duration: 1.2,
              ease: 'expo.out',
              stagger: 0.08,
              scrollTrigger: { trigger: el, start: 'top 88%', once: true },
            }),
        });
      });

      q('[data-rise]').forEach((el: HTMLElement) => {
        gsap.from(el, {
          y: 40,
          autoAlpha: 0,
          duration: 1.1,
          ease: 'expo.out',
          delay: Number(el.dataset.rise || 0),
          scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        });
      });

      q('[data-words]').forEach((el: HTMLElement) => {
        const split = SplitText.create(el, { type: 'words', wordsClass: 'wd' });
        gsap.fromTo(
          split.words,
          LITE ? { opacity: 0.12 } : { opacity: 0.12, filter: 'blur(6px)' },
          {
            opacity: 1,
            ...(LITE ? {} : { filter: 'blur(0px)' }),
            ease: 'none',
            stagger: 0.1,
            scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 50%', scrub: true },
          },
        );
      });

      q('[data-scramble]').forEach((el: HTMLElement) => {
        const final = el.textContent ?? '';
        gsap.set(el, { opacity: 0 });
        gsap.to(el, {
          scrollTrigger: { trigger: el, start: 'top 92%', once: true },
          opacity: 1,
          duration: 0.01,
          onComplete: () => scramble(el, final),
        });
      });
    },
    { scope },
  );
}

const POOL = '{}[]<>=+-*/;:_#$%&@01ABCDEFabcdef';

/** troca cada caractere por lixo e vai fixando da esquerda pra direita */
export function scramble(el: HTMLElement, final: string, duration = 0.9) {
  const state = { p: 0 };
  return gsap.to(state, {
    p: 1,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      const fixed = Math.floor(state.p * final.length);
      let out = final.slice(0, fixed);
      for (let i = fixed; i < final.length; i++) {
        const c = final[i];
        out += c === ' ' ? ' ' : POOL[(Math.random() * POOL.length) | 0];
      }
      el.textContent = out;
    },
    onComplete: () => {
      el.textContent = final;
    },
  });
}
