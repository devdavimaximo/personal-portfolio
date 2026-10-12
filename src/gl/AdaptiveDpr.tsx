import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

/**
 * Resolução adaptativa: mede o tempo médio de quadro a cada segundo.
 * Abaixo de ~45fps, reduz a resolução interna do canvas em degraus de 0.25;
 * depois de 3 segundos folgados (~58fps+), devolve um degrau. Máquinas fortes
 * nunca saem do máximo; aparelhos fracos trocam nitidez por fluidez.
 */
export default function AdaptiveDpr({ min = 1, max }: { min?: number; max: number }) {
  const setDpr = useThree((s) => s.setDpr);
  const acc = useRef({ t: 0, n: 0, dpr: max, good: 0 });

  useFrame((_, delta) => {
    const a = acc.current;
    a.t += Math.min(delta, 0.1); // retomada depois de pausa não conta como quadro lento
    a.n++;
    if (a.t < 1) return;
    const avg = a.t / a.n;
    a.t = 0;
    a.n = 0;
    if (avg > 1 / 45 && a.dpr > min) {
      a.dpr = Math.max(min, a.dpr - 0.25);
      a.good = 0;
      setDpr(a.dpr);
    } else if (avg < 1 / 58 && a.dpr < max && ++a.good >= 3) {
      a.dpr = Math.min(max, a.dpr + 0.25);
      a.good = 0;
      setDpr(a.dpr);
    }
  });

  return null;
}
