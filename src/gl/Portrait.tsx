import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { loadPortrait, type PortraitAssets } from '../lib/portrait';
import { LITE, REDUCED, damp } from '../lib/env';
import { signals } from '../lib/scroller';
import { portraitFrag, quadVert } from './portraitShader';
import { ACCENT as ACCENT_HEX, BONE as BONE_HEX, srgb } from './color';
import AdaptiveDpr from './AdaptiveDpr';

const BONE = srgb(BONE_HEX);
const ACCENT = srgb(ACCENT_HEX);

/** ponteiro em pixels de tela, compartilhado (um único listener) */
const pointer = { x: -9999, y: -9999, active: false, t: 0 };
if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointermove',
    (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = e.pointerType === 'mouse';
      pointer.t = performance.now();
    },
    { passive: true },
  );
}

function Glyphs({ assets, host }: { assets: PortraitAssets; host: HTMLElement }) {
  const { gl, size } = useThree();
  const dpr = useThree((s) => s.viewport.dpr);
  const state = useRef({ mx: -9999, my: -9999, vx: 0, vy: 0, lens: 0, intro: REDUCED ? 1 : 0 });
  const box = useRef({ ready: false, top: 0, left: 0, width: 0, height: 0 });

  const material = useMemo(() => {
    const image = new THREE.CanvasTexture(assets.image);
    image.minFilter = THREE.LinearFilter;
    image.generateMipmaps = false;
    const atlas = new THREE.CanvasTexture(assets.atlas);
    atlas.minFilter = THREE.LinearFilter;
    atlas.generateMipmaps = false;

    return new THREE.ShaderMaterial({
      vertexShader: quadVert,
      fragmentShader: portraitFrag,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uImage: { value: image },
        uAtlas: { value: atlas },
        uCount: { value: assets.glyphs },
        uCell: { value: 9 },
        uRes: { value: new THREE.Vector2() },
        uImgSize: { value: new THREE.Vector2() },
        uImgOffset: { value: new THREE.Vector2() },
        uMouse: { value: new THREE.Vector2(-9999, -9999) },
        uVel: { value: new THREE.Vector2() },
        uLens: { value: 0 },
        uLensR: { value: 160 },
        uTime: { value: 0 },
        uIntro: { value: 0 },
        uOut: { value: 0 },
        uBone: { value: BONE },
        uAccent: { value: ACCENT },
      },
    });
  }, [assets]);

  useEffect(() => () => material.dispose(), [material]);

  // ajusta grade e enquadramento quando o canvas muda de tamanho
  useEffect(() => {
    const dpr = gl.getPixelRatio();
    const w = size.width * dpr;
    const h = size.height * dpr;
    const u = material.uniforms;
    u.uRes.value.set(w, h);
    let ih = h * 0.98;
    let iw = ih * assets.aspect;
    let oy = 0;
    if (iw > w) {
      // tela estreita: ajusta pela largura e sobe o rosto para longe do nome
      iw = w;
      ih = iw / assets.aspect;
      if (LITE) oy = (h - ih) * 0.92;
    }
    u.uImgSize.value.set(iw, ih);
    u.uImgOffset.value.set((w - iw) / 2, oy);
    // a célula acompanha o tamanho do rosto: ~95 colunas no retrato inteiro
    u.uCell.value = Math.max(5 * dpr, Math.round(iw / (LITE ? 70 : 84)));
    u.uLensR.value = Math.min(w, h) * (LITE ? 0.3 : 0.22);
    box.current.ready = false; // tamanho mudou: remede a posição do canvas no próximo quadro
  }, [size, gl, dpr, material, assets]);

  useFrame((three, dt) => {
    const u = material.uniforms;
    const s = state.current;
    const dpr = gl.getPixelRatio();
    // posição em cache: ler o layout a cada quadro forçava recálculo depois que o nome muda de largura
    if (!box.current.ready) {
      const r = host.getBoundingClientRect();
      box.current = { ready: true, top: r.top + window.scrollY, left: r.left, width: r.width, height: r.height };
    }
    const sy = window.scrollY;
    const rect = {
      left: box.current.left,
      right: box.current.left + box.current.width,
      top: box.current.top - sy,
      bottom: box.current.top - sy + box.current.height,
    };
    const t = three.clock.elapsedTime;
    u.uTime.value = t;

    // intro só depois do preloader
    if (signals.introAt > 0 && !REDUCED) {
      const k = (performance.now() - signals.introAt) / 2600;
      s.intro = Math.min(1, k < 0 ? 0 : 1 - Math.pow(1 - Math.min(k, 1), 3));
    } else if (REDUCED && signals.introAt > 0) s.intro = 1;
    u.uIntro.value = s.intro;
    u.uOut.value = damp(u.uOut.value, signals.heroOut, 8, dt);

    // alvo da lente: mouse real no desktop, passeio automático no toque/ocioso
    let tx: number;
    let ty: number;
    let want = 0;
    const idle = performance.now() - pointer.t > 4000;
    if (pointer.active && !idle) {
      tx = (pointer.x - rect.left) * dpr;
      ty = (rect.bottom - pointer.y) * dpr;
      const inside = pointer.x > rect.left - 40 && pointer.x < rect.right + 40 && pointer.y > rect.top && pointer.y < rect.bottom;
      want = inside ? 1 : 0;
    } else {
      // lissajous sobre o rosto (coordenadas relativas à imagem, não ao canvas)
      const sz = u.uImgSize.value;
      const of = u.uImgOffset.value;
      tx = of.x + sz.x * (0.5 + Math.sin(t * 0.45) * 0.14);
      ty = of.y + sz.y * (0.56 + Math.sin(t * 0.7 + 1.2) * 0.1);
      want = s.intro > 0.95 ? 0.85 : 0;
    }
    if (signals.heroOut > 0.4) want = 0;

    const px = s.mx;
    const py = s.my;
    if (s.mx < -9000) {
      s.mx = tx;
      s.my = ty;
    }
    s.mx = damp(s.mx, tx, 9, dt);
    s.my = damp(s.my, ty, 9, dt);
    s.vx = damp(s.vx, (s.mx - px) / Math.max(dt, 1e-3) / 60, 6, dt);
    s.vy = damp(s.vy, (s.my - py) / Math.max(dt, 1e-3) / 60, 6, dt);
    s.lens = damp(s.lens, want, 5, dt);

    u.uMouse.value.set(s.mx, s.my);
    u.uVel.value.set(s.vx, s.vy);
    u.uLens.value = s.lens;
  });

  return (
    <mesh frustumCulled={false} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

export default function Portrait() {
  const host = useRef<HTMLDivElement>(null);
  const [assets, setAssets] = useState<PortraitAssets | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let alive = true;
    loadPortrait().then((a) => alive && setAssets(a));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '100px' });
    if (host.current) io.observe(host.current);
    return () => io.disconnect();
  }, []);

  return (
    <div className="portrait" ref={host} aria-label="Retrato de Davi Maximo Quoos desenhado em caracteres" role="img">
      {assets && host.current && (
        <Canvas
          orthographic
          dpr={[1, LITE ? 1.5 : 2]}
          gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
          frameloop={visible ? 'always' : 'never'}
        >
          <AdaptiveDpr max={LITE ? 1.5 : 2} />
          <Glyphs assets={assets} host={host.current} />
        </Canvas>
      )}
    </div>
  );
}
