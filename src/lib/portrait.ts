/**
 * Prepara o retrato para a GPU:
 *  1. recorta o fundo branco por flood fill a partir das bordas
 *     (um limiar simples comeria os brilhos do rosto; o flood fill só come o que encosta na borda)
 *  2. suaviza a borda do recorte
 *  3. monta um atlas de glifos ordenado pela densidade real de tinta de cada caractere
 */

export const PORTRAIT_URL = `${import.meta.env.BASE_URL}media/davi.webp`;

export type PortraitAssets = {
  image: HTMLCanvasElement;
  atlas: HTMLCanvasElement;
  glyphs: number;
  aspect: number;
};

const GLYPHS = ' .`\'-,:;_~"^=+<>!?/\\|()[]{}*1lictvsaxoe#%&$08@';

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function cutout(img: HTMLImageElement): HTMLCanvasElement {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;

  const bg = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;
  // fundo = branco OU já transparente (o arquivo pode vir recortado ou não)
  const original = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) original[i] = px[i * 4 + 3];
  const isWhite = (i: number) =>
    original[i] < 128 || (px[i * 4] > 226 && px[i * 4 + 1] > 226 && px[i * 4 + 2] > 226);
  const push = (i: number) => {
    if (bg[i] || !isWhite(i)) return;
    bg[i] = 1;
    queue[tail++] = i;
  };

  for (let x = 0; x < w; x++) {
    push(x);
    push((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    push(y * w);
    push(y * w + w - 1);
  }
  while (head < tail) {
    const i = queue[head++];
    const x = i % w;
    if (x > 0) push(i - 1);
    if (x < w - 1) push(i + 1);
    if (i >= w) push(i - w);
    if (i < w * (h - 1)) push(i + w);
  }

  // borda macia: box blur 2 passes sobre a máscara
  let a = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) a[i] = bg[i] ? 0 : 1;
  const r = 2;
  const blur = (src: Float32Array, horizontal: boolean) => {
    const out = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let s = 0;
        let n = 0;
        for (let k = -r; k <= r; k++) {
          const xx = horizontal ? x + k : x;
          const yy = horizontal ? y : y + k;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          s += src[yy * w + xx];
          n++;
        }
        out[y * w + x] = s / n;
      }
    }
    return out;
  };
  a = blur(blur(a, true), false);

  for (let i = 0; i < w * h; i++) {
    const alpha = Math.min(1, Math.max(0, (a[i] - 0.15) / 0.7));
    px[i * 4 + 3] = Math.min(alpha * 255, original[i]);
  }
  ctx.putImageData(data, 0, 0);
  return canvas;
}

function buildAtlas(): { atlas: HTMLCanvasElement; count: number } {
  const size = 64;
  const chars = Array.from(new Set(GLYPHS.split('')));
  const probe = document.createElement('canvas');
  probe.width = size;
  probe.height = size;
  const pctx = probe.getContext('2d', { willReadFrequently: true })!;
  const font = `500 ${size * 0.78}px "Geist Mono", ui-monospace, monospace`;

  const measured = chars.map((ch) => {
    pctx.clearRect(0, 0, size, size);
    pctx.fillStyle = '#fff';
    pctx.font = font;
    pctx.textAlign = 'center';
    pctx.textBaseline = 'middle';
    pctx.fillText(ch, size / 2, size / 2 + size * 0.04);
    const d = pctx.getImageData(0, 0, size, size).data;
    let ink = 0;
    for (let i = 3; i < d.length; i += 4) ink += d[i];
    return { ch, ink };
  });
  measured.sort((p, q) => p.ink - q.ink);

  const atlas = document.createElement('canvas');
  atlas.width = size * measured.length;
  atlas.height = size;
  const ctx = atlas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  measured.forEach(({ ch }, i) => ctx.fillText(ch, i * size + size / 2, size / 2 + size * 0.04));
  return { atlas, count: measured.length };
}

let pending: Promise<PortraitAssets> | null = null;

export function loadPortrait(): Promise<PortraitAssets> {
  if (pending) return pending;
  pending = (async () => {
    const [img] = await Promise.all([
      loadImage(PORTRAIT_URL),
      document.fonts?.load('500 48px "Geist Mono"').catch(() => undefined),
    ]);
    const image = cutout(img);
    const { atlas, count } = buildAtlas();
    return { image, atlas, glyphs: count, aspect: img.naturalWidth / img.naturalHeight };
  })();
  return pending;
}
