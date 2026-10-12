import type { Work } from '../content';

/**
 * Mini-visualizações desenhadas em canvas 2D, uma por caso.
 * Nada de screenshot: cada prévia mostra a ideia central do projeto, viva.
 */

const BONE = '#ECE8E1';
const MUTE = 'rgba(236,232,225,0.35)';
const FAINT = 'rgba(236,232,225,0.1)';
const ACCENT = '#9D8CFF';
const MONO = '"Geist Mono", ui-monospace, monospace';

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void;

const ease = (x: number) => 1 - Math.pow(1 - Math.min(Math.max(x, 0), 1), 3);

const funnel: Draw = (ctx, w, h, t) => {
  const data = [
    ['prospects', 500],
    ['ligações', 312],
    ['conversas', 87],
    ['reuniões', 24],
    ['propostas', 11],
    ['clientes', 4],
  ] as const;
  const cycle = (t % 6) / 6;
  const pad = 22;
  const rowH = (h - pad * 2) / data.length;
  ctx.font = `10px ${MONO}`;
  ctx.textBaseline = 'middle';
  data.forEach(([label, v], i) => {
    const y = pad + i * rowH + rowH / 2;
    const k = ease(cycle * 2.4 - i * 0.12);
    const full = (Math.log(v + 1) / Math.log(501)) * (w - pad * 2 - 96);
    const bw = full * k;
    ctx.fillStyle = FAINT;
    ctx.fillRect(pad + 96, y - rowH * 0.28, w - pad * 2 - 96, rowH * 0.56);
    ctx.fillStyle = i === data.length - 1 ? ACCENT : BONE;
    ctx.globalAlpha = i === data.length - 1 ? 1 : 0.75 - i * 0.08;
    ctx.fillRect(pad + 96, y - rowH * 0.28, bw, rowH * 0.56);
    ctx.globalAlpha = 1;
    ctx.fillStyle = MUTE;
    ctx.fillText(label, pad, y);
    ctx.fillStyle = BONE;
    if (k > 0.05) ctx.fillText(String(Math.round(v * k)), pad + 102 + bw, y);
  });
};

/** Beemov: vendas caindo em tenants isolados: nada atravessa a parede */
const tenants: Draw = (ctx, w, h, t) => {
  const names = ['adega', 'distribuidora', 'conveniência'];
  const pad = 18;
  const top = 40;
  const bottom = h - 36;
  const colW = (w - pad * 2) / names.length;
  ctx.font = `10px ${MONO}`;
  ctx.textAlign = 'center';
  ctx.lineWidth = 1;
  names.forEach((name, i) => {
    const x0 = pad + colW * i + 5;
    const cx = x0 + colW / 2 - 5;
    ctx.strokeStyle = FAINT;
    ctx.strokeRect(x0, top, colW - 10, bottom - top);
    ctx.fillStyle = MUTE;
    ctx.fillText(name, cx, top - 12);
    for (let k = 0; k < 7; k++) {
      const p = (t * (0.22 + i * 0.06) + k / 7) % 1;
      ctx.globalAlpha = 1 - p * 0.75;
      ctx.fillStyle = k === 0 ? ACCENT : BONE;
      ctx.beginPath();
      ctx.arc(cx + Math.sin(k * 2.1 + i * 1.7) * colW * 0.24, top + 10 + p * (bottom - top - 20), k === 0 ? 3 : 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
  ctx.fillStyle = MUTE;
  ctx.fillText('TenantId == tenantContext.TenantId', w / 2, h - 14);
};

/** Confraria: o cupom de fechamento de caixa sendo impresso */
const receipt: Draw = (ctx, w, h, t) => {
  const lines = [
    ['abertura', '200,00'],
    ['dinheiro', '1.184,50'],
    ['pix', '2.931,90'],
    ['cartão', '3.402,10'],
    ['sangria', '−500,00'],
    ['TOTAL', '7.218,50'],
  ] as const;
  const pw = Math.min(230, w - 60);
  const x = (w - pw) / 2;
  const top = 22;
  const lh = (h - top * 2 - 34) / lines.length;
  const shown = Math.min(lines.length, Math.floor((t % 6) * 1.6));
  ctx.fillStyle = 'rgba(236,232,225,0.05)';
  ctx.fillRect(x, top, pw, h - top * 2);
  ctx.font = `10px ${MONO}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillStyle = MUTE;
  ctx.fillText('FECHAMENTO DE CAIXA', w / 2, top + 16);
  for (let i = 0; i < shown; i++) {
    const [label, value] = lines[i];
    const y = top + 34 + lh * i + lh / 2;
    const total = i === lines.length - 1;
    if (total) {
      ctx.strokeStyle = MUTE;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x + 14, y - lh / 2);
      ctx.lineTo(x + pw - 14, y - lh / 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = total ? ACCENT : BONE;
    ctx.textAlign = 'left';
    ctx.fillText(label, x + 14, y);
    ctx.textAlign = 'right';
    ctx.fillText(value, x + pw - 14, y);
  }
  // cabeça de impressão
  const headY = top + 34 + lh * Math.min(shown, lines.length - 1) + lh / 2;
  if (shown < lines.length) {
    ctx.fillStyle = ACCENT;
    ctx.fillRect(x, headY - 0.5, pw * ((t * 1.6) % 1), 1);
  }
};

/** Sementinhas: a chegada das crianças, minuto a minuto */
const attendance: Draw = (ctx, w, h, t) => {
  const cols = 10;
  const rows = 4;
  const total = cols * rows;
  const clock = (t % 8) / 8;
  const cell = Math.min((w - 60) / cols, (h - 90) / rows);
  const x0 = (w - cell * cols) / 2;
  const y0 = 28;
  let present = 0;
  for (let i = 0; i < total; i++) {
    const absent = i % 13 === 5;
    const arrival = (((i * 37) % total) / total) * 0.85;
    const here = !absent && clock > arrival;
    if (here) present++;
    const cx = x0 + (i % cols) * cell + cell / 2;
    const cy = y0 + Math.floor(i / cols) * cell + cell / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, cell * 0.28, 0, Math.PI * 2);
    if (here) {
      ctx.fillStyle = clock - arrival < 0.05 ? ACCENT : BONE;
      ctx.fill();
    } else {
      ctx.strokeStyle = FAINT;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  const minutes = Math.floor(clock * 120);
  const time = `0${7 + Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
  const base = y0 + rows * cell + 30;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.font = `500 26px ${MONO}`;
  ctx.fillStyle = BONE;
  ctx.fillText(time, x0, base);
  ctx.textAlign = 'right';
  ctx.font = `10px ${MONO}`;
  ctx.fillStyle = MUTE;
  ctx.fillText(`presentes ${present}/${total}`, x0 + cols * cell, base);
};

/** Gestão Financeira: entradas, saídas e o saldo acumulado */
const cashflow: Draw = (ctx, w, h, t) => {
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago'];
  const income = [62, 58, 71, 66, 80, 77, 88, 94];
  const expense = [55, 60, 59, 61, 64, 70, 69, 72];
  const pad = 24;
  const base = h - 34;
  const gh = base - pad - 10;
  const slot = (w - pad * 2) / months.length;
  const bw = slot * 0.26;
  const k = ease(((t % 6) / 6) * 1.6);
  ctx.font = `10px ${MONO}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  let balance = 0;
  const points: [number, number][] = [];
  months.forEach((m, i) => {
    const x = pad + slot * i + slot / 2;
    const grow = ease(k * 1.4 - i * 0.06);
    ctx.fillStyle = BONE;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(x - bw - 1, base - (income[i] / 100) * gh * grow, bw, (income[i] / 100) * gh * grow);
    ctx.globalAlpha = 1;
    ctx.fillStyle = MUTE;
    ctx.fillRect(x + 1, base - (expense[i] / 100) * gh * grow, bw, (expense[i] / 100) * gh * grow);
    ctx.fillText(m, x, base + 16);
    balance += income[i] - expense[i];
    points.push([x, base - gh * 0.55 - balance * 1.6 * grow]);
  });
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.stroke();
  const [lx, ly] = points[points.length - 1];
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.textAlign = 'left';
  ctx.fillStyle = MUTE;
  ctx.fillText('saldo acumulado', pad, pad);
};

/** Wedding Planner: o orçamento se redistribui quando um peso muda */
const budget: Draw = (ctx, w, h, t) => {
  const decor = 2 + Math.sin(t * 0.9) * 1.5;
  const fixed = [
    ['espaço', 14],
    ['buffet', 34],
    ['assessoria', 10],
  ] as const;
  const weighted = [
    ['foto', 3],
    ['decoração', decor],
    ['música', 2],
  ] as const;
  const left = 100 - fixed.reduce((s, [, v]) => s + v, 0);
  const weightSum = weighted.reduce((s, [, v]) => s + v, 0);
  const parts = [...fixed.map(([n, v]) => [n, v, false] as const), ...weighted.map(([n, v]) => [n, (v / weightSum) * left, true] as const)];
  const pad = 22;
  const barY = 52;
  const barH = 26;
  const bw = w - pad * 2;
  ctx.font = `10px ${MONO}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = MUTE;
  ctx.fillText('orçamento R$ 60.000 · 120 convidados', pad, 26);
  let x = pad;
  parts.forEach(([name, pct, isWeighted], i) => {
    const pw = (pct / 100) * bw;
    ctx.fillStyle = isWeighted ? ACCENT : BONE;
    ctx.globalAlpha = isWeighted ? 0.45 + i * 0.12 : 0.85 - i * 0.2;
    ctx.fillRect(x, barY, Math.max(pw - 2, 0), barH);
    ctx.globalAlpha = 1;
    x += pw;
    const y = barY + barH + 24 + i * 16;
    ctx.fillStyle = isWeighted ? ACCENT : MUTE;
    ctx.fillText(isWeighted ? '◆' : '■', pad, y);
    ctx.fillStyle = BONE;
    ctx.fillText(name, pad + 16, y);
    ctx.textAlign = 'right';
    ctx.fillText(`R$ ${Math.round(pct * 600).toLocaleString('pt-BR')}`, w - pad, y);
    ctx.textAlign = 'left';
  });
};

/** Xadrez Console: o cavalo pulando, com os lances possíveis destacados */
const chess: Draw = (ctx, w, h, t) => {
  const size = Math.min(w - 40, h - 40);
  const sq = size / 8;
  const x0 = (w - size) / 2;
  const y0 = (h - size) / 2;
  const path = [
    [1, 7],
    [2, 5],
    [4, 4],
    [5, 2],
    [3, 3],
    [2, 1],
  ];
  const [col, row] = path[Math.floor(t / 1.2) % path.length];
  const jumps = [
    [1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1],
  ];
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      ctx.fillStyle = (r + c) % 2 ? 'rgba(236,232,225,0.07)' : 'rgba(236,232,225,0.02)';
      ctx.fillRect(x0 + c * sq, y0 + r * sq, sq, sq);
    }
  ctx.fillStyle = ACCENT;
  for (const [dc, dr] of jumps) {
    const c = col + dc;
    const r = row + dr;
    if (c < 0 || c > 7 || r < 0 || r > 7) continue;
    ctx.globalAlpha = 0.35 + Math.sin(t * 5) * 0.15;
    ctx.beginPath();
    ctx.arc(x0 + c * sq + sq / 2, y0 + r * sq + sq / 2, sq * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.font = `600 ${Math.round(sq * 0.62)}px ${MONO}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = BONE;
  ctx.fillText('C', x0 + col * sq + sq / 2, y0 + row * sq + sq / 2 + 1);
  ctx.font = `10px ${MONO}`;
  ctx.fillStyle = MUTE;
  ctx.textAlign = 'left';
  ctx.fillText(`${'abcdefgh'[col]}${8 - row}`, x0 + size + 6, y0 + 8);
};

const lathe: Draw = (ctx, w, h, t) => {
  const cx = w / 2;
  const top = 26;
  const bottom = h - 26;
  const H = bottom - top;
  const prof = (v: number) => {
    // v: 0 base → 1 boca
    const belly = Math.sin(v * Math.PI * 0.95 + 0.15) * 0.62;
    const neck = Math.exp(-Math.pow((v - 0.86) / 0.08, 2)) * -0.22;
    const lip = v > 0.94 ? (v - 0.94) * 3 : 0;
    return Math.max(0.12, 0.2 + belly + neck + lip);
  };
  const R = Math.min(w * 0.36, H * 0.55);
  const tilt = 0.22;
  ctx.lineWidth = 1;
  // anéis horizontais
  for (let i = 0; i <= 22; i++) {
    const v = i / 22;
    const r = prof(v) * R;
    const yy = bottom - v * H;
    ctx.strokeStyle = i % 5 === 0 ? 'rgba(236,232,225,0.55)' : FAINT;
    ctx.beginPath();
    ctx.ellipse(cx, yy, r, r * tilt, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // meridianos girando
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2 + t * 0.6;
    const front = Math.sin(a);
    ctx.strokeStyle = front > 0 ? `rgba(157,140,255,${0.25 + front * 0.75})` : 'rgba(236,232,225,0.08)';
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const v = i / 40;
      const r = prof(v) * R;
      const xx = cx + Math.cos(a) * r;
      const yy = bottom - v * H + Math.sin(a) * r * tilt;
      if (i === 0) ctx.moveTo(xx, yy);
      else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  }
  ctx.font = `10px ${MONO}`;
  ctx.fillStyle = MUTE;
  ctx.fillText('LatheGeometry(profile, 128)', 18, h - 10);
};

const sonar: Draw = (ctx, w, h, t) => {
  const cx = w / 2;
  const cy = h * 0.42;
  const maxR = Math.hypot(w, h) * 0.6;
  for (let i = 0; i < 5; i++) {
    const p = ((t * 0.35 + i / 5) % 1);
    ctx.strokeStyle = `rgba(157,140,255,${(1 - p) * 0.8})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, p * maxR, 0, Math.PI * 2);
    ctx.stroke();
  }
  // bolhas subindo
  ctx.fillStyle = 'rgba(236,232,225,0.6)';
  for (let i = 0; i < 26; i++) {
    const s = (i * 97.13) % 1;
    const x = (((i * 53.7) % 1) * 0.8 + 0.1) * w + Math.sin(t * 2 + i) * 4;
    const y = h - (((t * (0.08 + s * 0.1) + s) % 1) * h);
    ctx.beginPath();
    ctx.arc(x, y, 0.8 + s * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  const depth = ((t * 3) % 42).toFixed(0);
  ctx.fillStyle = BONE;
  ctx.font = `500 34px ${MONO}`;
  ctx.textAlign = 'center';
  ctx.fillText(`−${depth} m`, cx, cy + 12);
  ctx.font = `10px ${MONO}`;
  ctx.fillStyle = MUTE;
  ctx.fillText('profundidade = scrollY', cx, h - 14);
  ctx.textAlign = 'left';
};

export const previews: Record<Work['preview'], Draw> = { tenants, funnel, receipt, attendance, cashflow, budget, chess, lathe, sonar };
