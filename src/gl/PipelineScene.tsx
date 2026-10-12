import { useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { Canvas, useFrame, useThree, type ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';
import { LITE, clamp, damp, lerp, smoothstep } from '../lib/env';
import { PIPE_SPAN, PIPE_STAGES, signals } from '../lib/scroller';
import { ACCENT, BONE, INK } from './color';
import AdaptiveDpr from './AdaptiveDpr';

/** distância entre os portais (camadas) ao longo de -Z */
export const GAP = 10;
const STAGES = PIPE_STAGES;
const MID_Z = -((STAGES - 1) * GAP) / 2;

const C_BONE = new THREE.Color(BONE);
const C_GREY = new THREE.Color('#55535C');
const C_ACCENT = new THREE.Color(ACCENT);

/** estado do túnel lido por todos os componentes no mesmo frame */
const flow = { s: 0, reveal: 0, packet: new THREE.Vector3(), t: 0 };

/** trajetória do pacote: reta pelo túnel, espiral em volta do domínio, mergulho no banco */
function packetAt(s: number, out: THREE.Vector3) {
  const z = -(s - 0.5) * GAP;
  let x = Math.sin(s * 2.1) * 0.22;
  let y = Math.cos(s * 1.7) * 0.16;
  const dom = clamp(s - 4);
  if (dom > 0 && dom < 1) {
    const env = Math.sin(Math.PI * dom);
    const ang = dom * Math.PI * 4;
    x += Math.sin(ang) * 2.1 * env;
    y += Math.cos(ang) * 2.1 * env * 0.85;
  }
  const db = clamp(s - 5);
  if (db > 0 && db < 1) y -= Math.sin(Math.PI * db) * 1.45;
  return out.set(x, y, z);
}

/** liga/desliga o brilho de um portal conforme o pacote se aproxima */
function Gate({ index, children }: { index: number; children: ReactNode }) {
  const group = useRef<THREE.Group>(null!);
  const mats = useRef<{ m: THREE.Material & { color: THREE.Color; opacity: number }; base: number }[]>([]);

  useLayoutEffect(() => {
    const list: typeof mats.current = [];
    group.current.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material & { color?: THREE.Color; opacity?: number };
      if (m && m.color && typeof m.opacity === 'number' && !m.userData.fixed) list.push({ m: m as never, base: m.opacity });
    });
    mats.current = list;
  }, []);

  useFrame(() => {
    const d = Math.abs(flow.s - (index + 0.5));
    const k = 1 - smoothstep(0.1, 0.95, d);
    const lit = Math.max(k, flow.reveal);
    for (const { m, base } of mats.current) {
      m.opacity = base * (0.22 + 0.78 * lit);
      m.color.copy(C_GREY).lerp(C_BONE, lit).lerp(C_ACCENT, k * 0.85);
    }
  });

  return (
    <group ref={group} position={[0, 0, -index * GAP]}>
      {children}
    </group>
  );
}

const line = (opacity: number, additive = false) => (
  <meshBasicMaterial transparent opacity={opacity} depthWrite={false} blending={additive ? THREE.AdditiveBlending : THREE.NormalBlending} />
);

function Spin({ speed = [0, 0, 0.1], children, ...rest }: { speed?: [number, number, number]; children: ReactNode } & ThreeElements['group']) {
  const g = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    g.current.rotation.x += speed[0] * dt;
    g.current.rotation.y += speed[1] * dt;
    g.current.rotation.z += speed[2] * dt;
  });
  return (
    <group ref={g} {...rest}>
      {children}
    </group>
  );
}

/** marcas de relógio em volta de um círculo */
function Ticks({ radius, count, len = 0.18, opacity = 0.5 }: { radius: number; count: number; len?: number; opacity?: number }) {
  const geo = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const l = i % 4 === 0 ? len * 2 : len;
      pts.push(Math.cos(a) * radius, Math.sin(a) * radius, 0, Math.cos(a) * (radius + l), Math.sin(a) * (radius + l), 0);
    }
    return new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  }, [radius, count, len]);
  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial transparent opacity={opacity} depthWrite={false} />
    </lineSegments>
  );
}

function RequestGate() {
  return (
    <Gate index={0}>
      <mesh>
        <torusGeometry args={[3.2, 0.014, 8, 180]} />
        {line(0.9)}
      </mesh>
      <Spin speed={[0, 0, -0.12]}>
        <Ticks radius={3.45} count={96} />
      </Spin>
      <Spin speed={[0, 0, 0.25]}>
        <mesh>
          <torusGeometry args={[2.7, 0.006, 4, 3]} />
          {line(0.5)}
        </mesh>
      </Spin>
    </Gate>
  );
}

function MiddlewareGate() {
  return (
    <Gate index={1}>
      {[2.4, 0, -2.4].map((z, i) => (
        <Spin key={z} position={[0, 0, z]} speed={[0, 0, (i % 2 ? -1 : 1) * (0.18 + i * 0.12)]}>
          <mesh>
            <torusGeometry args={[2.5 - i * 0.18, 0.022, 6, 6]} />
            {line(0.95)}
          </mesh>
          <Ticks radius={2.75 - i * 0.18} count={6} len={0.35} opacity={0.8} />
        </Spin>
      ))}
    </Gate>
  );
}

/** membrana de pontos que ondula quando o pacote atravessa */
function Membrane({ size = 5, n = 17 }: { size?: number; n?: number }) {
  const ref = useRef<THREE.Points>(null!);
  const rest = useRef(false);
  const { geo, base } = useMemo(() => {
    const p = new Float32Array(n * n * 3);
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const k = (i * n + j) * 3;
        p[k] = (i / (n - 1) - 0.5) * size;
        p[k + 1] = (j / (n - 1) - 0.5) * size;
      }
    const g = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(p, 3));
    return { geo: g, base: p.slice() };
  }, [n, size]);

  useFrame(() => {
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    const world = new THREE.Vector3();
    ref.current.getWorldPosition(world);
    const dz = flow.packet.z - world.z;
    const hit = Math.exp(-dz * dz * 0.25);
    // longe do pacote a membrana está parada: não recalcula nem reenvia à GPU
    if (hit < 0.002 && rest.current) return;
    rest.current = hit < 0.002;
    for (let k = 0; k < arr.length; k += 3) {
      const dx = base[k] - flow.packet.x;
      const dy = base[k + 1] - flow.packet.y;
      const r = Math.sqrt(dx * dx + dy * dy);
      arr[k + 2] = Math.sin(r * 2.4 - flow.t * 7) * Math.exp(-r * 0.55) * 0.55 * hit;
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.045} sizeAttenuation transparent opacity={0.9} depthWrite={false} />
    </points>
  );
}

function EndpointGate() {
  return (
    <Gate index={2}>
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[3.3, 0.024, 4, 4]} />
        {line(0.95)}
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 4]} position={[0, 0, -0.6]}>
        <torusGeometry args={[3.45, 0.008, 4, 4]} />
        {line(0.45)}
      </mesh>
      <Membrane />
    </Gate>
  );
}

function Scanner() {
  const bar = useRef<THREE.Group>(null!);
  useFrame(() => {
    bar.current.position.y = Math.sin(flow.t * 1.8) * 2.2;
  });
  return (
    <group ref={bar}>
      <mesh>
        <boxGeometry args={[5.4, 0.018, 0.018]} />
        {line(1, true)}
      </mesh>
      <mesh position={[0, -0.18, 0]}>
        <planeGeometry args={[5.4, 0.36]} />
        {line(0.12, true)}
      </mesh>
    </group>
  );
}

function ApplicationGate() {
  const cube = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1.5, 1.5, 1.5)), []);
  return (
    <Gate index={3}>
      <mesh>
        <torusGeometry args={[3.1, 0.016, 6, 8]} />
        {line(0.95)}
      </mesh>
      <Ticks radius={3.25} count={8} len={0.4} opacity={0.9} />
      <Scanner />
      <Spin speed={[0.3, 0.45, 0]} position={[2.6, 2.1, -1.5]}>
        <lineSegments geometry={cube}>
          <lineBasicMaterial transparent opacity={0.7} depthWrite={false} />
        </lineSegments>
      </Spin>
      <Spin speed={[-0.25, 0.3, 0.1]} position={[-2.8, -1.9, 1.2]} scale={0.6}>
        <lineSegments geometry={cube}>
          <lineBasicMaterial transparent opacity={0.6} depthWrite={false} />
        </lineSegments>
      </Spin>
    </Gate>
  );
}

function DomainGate() {
  const { edges, inner } = useMemo(() => {
    const ico = new THREE.IcosahedronGeometry(1.05, 0);
    return { edges: new THREE.EdgesGeometry(ico), inner: new THREE.IcosahedronGeometry(0.55, 0) };
  }, []);
  return (
    <Gate index={4}>
      <Spin speed={[0.12, 0.3, 0]}>
        <mesh>
          <icosahedronGeometry args={[1.04, 0]} />
          <meshBasicMaterial color={INK} transparent opacity={0.92} userData={{ fixed: true }} />
        </mesh>
        <lineSegments geometry={edges}>
          <lineBasicMaterial transparent opacity={1} depthWrite={false} />
        </lineSegments>
        <mesh geometry={inner}>
          <meshBasicMaterial color={ACCENT} transparent opacity={0.55} wireframe userData={{ fixed: true }} />
        </mesh>
      </Spin>
      {[
        [Math.PI / 2, 0, 0],
        [Math.PI / 3, Math.PI / 4, 0],
        [-Math.PI / 3, Math.PI / 5, 0],
      ].map((r, i) => (
        <group key={i} rotation={r as [number, number, number]}>
          <Spin speed={[0, 0, 0.4 + i * 0.15]}>
            <mesh>
              <torusGeometry args={[2.1 + i * 0.12, 0.007, 4, 160]} />
              {line(0.7)}
            </mesh>
            <mesh position={[2.1 + i * 0.12, 0, 0]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              {line(1)}
            </mesh>
          </Spin>
        </group>
      ))}
      <mesh>
        <torusGeometry args={[3.5, 0.006, 4, 200]} />
        {line(0.5)}
      </mesh>
    </Gate>
  );
}

/** 10 "registros" em anel desenhados de uma vez (instancing): 1 draw call por anel */
function RowRing() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      ref.current.setMatrixAt(k, m.makeTranslation(Math.cos(a) * 1.2, 0, Math.sin(a) * 1.2));
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 10]} frustumCulled={false}>
      <boxGeometry args={[0.16, 0.04, 0.04]} />
      {line(0.9)}
    </instancedMesh>
  );
}

function InfrastructureGate() {
  const struts = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      pts.push(Math.cos(a) * 1.7, -0.2, Math.sin(a) * 1.7, Math.cos(a) * 1.7, -2.6, Math.sin(a) * 1.7);
    }
    return new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  }, []);
  return (
    <Gate index={5}>
      <Spin speed={[0, 0.25, 0]}>
        {[-0.2, -1.0, -1.8, -2.6].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.7, 0.016, 6, 120]} />
            {line(0.95)}
          </mesh>
        ))}
        <lineSegments geometry={struts}>
          <lineBasicMaterial transparent opacity={0.45} depthWrite={false} />
        </lineSegments>
        {[-0.6, -1.4, -2.2].map((y, i) => (
          <Spin key={y} speed={[0, (i % 2 ? -1 : 1) * 0.9, 0]} position={[0, y, 0]}>
            <RowRing />
          </Spin>
        ))}
      </Spin>
      <mesh>
        <torusGeometry args={[3.3, 0.01, 4, 4]} />
        {line(0.55)}
      </mesh>
    </Gate>
  );
}

function ResponseGate() {
  const wave = useRef<THREE.Mesh>(null!);
  const mat = useRef<THREE.MeshBasicMaterial>(null!);
  useFrame(() => {
    const t = clamp((flow.s - 6.45) / 0.45);
    wave.current.scale.setScalar(0.2 + t * 4.5);
    mat.current.opacity = t > 0 && t < 1 ? (1 - t) * 0.9 : 0;
  });
  return (
    <Gate index={6}>
      <mesh>
        <torusGeometry args={[3.2, 0.014, 8, 180]} />
        {line(0.9)}
      </mesh>
      <Spin speed={[0, 0, 0.12]}>
        <Ticks radius={3.45} count={96} />
      </Spin>
      <mesh ref={wave}>
        <torusGeometry args={[1, 0.02, 6, 120]} />
        <meshBasicMaterial ref={mat} color={ACCENT} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} userData={{ fixed: true }} />
      </mesh>
    </Gate>
  );
}

/** poeira de dados escorrendo pelas paredes do túnel */
function Stream() {
  const count = LITE ? 700 : 1600;
  const geo = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 4.5 + Math.random() * 7;
      p[i * 3] = Math.cos(a) * r;
      p[i * 3 + 1] = Math.sin(a) * r;
      p[i * 3 + 2] = 14 - Math.random() * 92;
    }
    return new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(p, 3));
  }, [count]);

  useFrame((_, dt) => {
    const arr = geo.attributes.position.array as Float32Array;
    const v = dt * 3.2;
    for (let i = 2; i < arr.length; i += 3) {
      arr[i] += v;
      if (arr[i] > 14) arr[i] -= 92;
    }
    geo.attributes.position.needsUpdate = true;
  });

  return (
    <points geometry={geo}>
      <pointsMaterial size={0.05} color="#7c7a85" sizeAttenuation transparent opacity={0.75} depthWrite={false} />
    </points>
  );
}

function Spine() {
  // <line> no JSX é o do SVG; o THREE.Line entra como primitive
  const obj = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 12), new THREE.Vector3(0, 0, -(STAGES - 1) * GAP - 12)]);
    const l = new THREE.Line(g, new THREE.LineDashedMaterial({ color: '#3d3b44', dashSize: 0.25, gapSize: 0.35, transparent: true, opacity: 0.9 }));
    l.computeLineDistances();
    return l;
  }, []);
  return <primitive object={obj} />;
}

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.18, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.12)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

const TRAIL = 70;

function Packet() {
  const core = useRef<THREE.Group>(null!);
  const glow = useRef<THREE.Sprite>(null!);
  const tex = useMemo(glowTexture, []);
  const trail = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TRAIL * 3), 3));
    const col = new Float32Array(TRAIL * 3);
    const c = new THREE.Color(ACCENT);
    for (let i = 0; i < TRAIL; i++) {
      const k = Math.pow(1 - i / TRAIL, 1.6);
      col[i * 3] = c.r * k;
      col[i * 3 + 1] = c.g * k;
      col[i * 3 + 2] = c.b * k;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const l = new THREE.Line(
      g,
      new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    l.frustumCulled = false;
    return l;
  }, []);
  const primed = useRef(false);

  useFrame(() => {
    const p = flow.packet;
    core.current.position.copy(p);
    core.current.rotation.x += 0.03;
    core.current.rotation.y += 0.05;
    glow.current.position.copy(p);
    const pulse = 1 + Math.sin(flow.t * 5) * 0.12;
    glow.current.scale.setScalar(1.5 * pulse * (1 + flow.reveal * 1.2));

    const pos = trail.geometry.attributes.position;
    const arr = pos.array as Float32Array;
    if (!primed.current) {
      for (let i = 0; i < TRAIL; i++) arr.set([p.x, p.y, p.z], i * 3);
      primed.current = true;
    }
    arr.copyWithin(3, 0, (TRAIL - 1) * 3);
    arr[0] = p.x;
    arr[1] = p.y;
    arr[2] = p.z;
    pos.needsUpdate = true;
  });

  return (
    <>
      <group ref={core}>
        <mesh>
          <octahedronGeometry args={[0.13, 0]} />
          <meshBasicMaterial color={BONE} />
        </mesh>
      </group>
      <sprite ref={glow}>
        <spriteMaterial map={tex} color={ACCENT} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <primitive object={trail} />
    </>
  );
}

const tmpLook = new THREE.Vector3();
const tmpCam = new THREE.Vector3();
const sideCam = new THREE.Vector3();
const sideLook = new THREE.Vector3();
const mouse = { x: 0, y: 0 };
if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointermove',
    (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    },
    { passive: true },
  );
}

/** compila todos os shaders da cena de uma vez, logo na montagem, fora do caminho da rolagem */
function Precompile() {
  const { gl, scene, camera, advance } = useThree();
  useLayoutEffect(() => {
    gl.compile(scene, camera);
    // desenha também um primeiro quadro agora (envio de geometria à GPU), ainda com o
    // loop pausado: assim a chegada na seção não paga esse custo
    const id = requestAnimationFrame(() => advance(performance.now()));
    return () => cancelAnimationFrame(id);
  }, [gl, scene, camera, advance]);
  return null;
}

function Rig() {
  const { camera, scene, size } = useThree();
  const look = useRef(new THREE.Vector3(0, 0, -5));
  const par = useRef({ x: 0, y: 0 });

  useLayoutEffect(() => {
    scene.fog = new THREE.Fog(INK, 4, 42);
  }, [scene]);

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05);
    flow.t = state.clock.elapsedTime;
    flow.s = damp(flow.s, signals.pipeline * PIPE_SPAN, 4.5, d);
    packetAt(Math.min(flow.s, STAGES + 0.1), flow.packet);
    const r = smoothstep(STAGES - 0.05, PIPE_SPAN - 0.15, flow.s);
    flow.reveal = r;
    const e = r * r * (3 - 2 * r);

    par.current.x = damp(par.current.x, mouse.x, 3, d);
    par.current.y = damp(par.current.y, mouse.y, 3, d);

    // câmera de perseguição
    const dom = clamp(flow.s - 4);
    const swing = Math.sin(Math.PI * dom);
    tmpCam.copy(flow.packet).add({ x: swing * 1.6 + par.current.x * 0.6, y: 0.85 - par.current.y * 0.4, z: 5.6 + swing * 1.2 } as THREE.Vector3);
    tmpLook.copy(flow.packet).add({ x: 0, y: -0.1, z: -5 } as THREE.Vector3);

    // vista final: a arquitetura inteira, de lado (desktop) ou em perspectiva (retrato)
    const aspect = size.width / size.height;
    if (aspect >= 1) {
      // enquadra os 60 u do túnel com folga; câmera um pouco acima e à frente = leve perspectiva
      const dist = 35 / (Math.tan((25 * Math.PI) / 180) * Math.min(aspect, 2.2));
      sideCam.set(dist + par.current.x * 2, dist * 0.3 - par.current.y * 2, MID_Z + dist * 0.28);
      sideLook.set(0, -1.2, MID_Z);
    } else {
      // retrato: de cima e de trás, o túnel recua em perspectiva como uma pilha de camadas
      sideCam.set(6 + par.current.x, 17, 26);
      sideLook.set(0, -3, MID_Z - 2);
    }
    camera.position.lerpVectors(tmpCam, sideCam, e);
    look.current.lerpVectors(tmpLook, sideLook, e);
    camera.lookAt(look.current);

    const fog = scene.fog as THREE.Fog;
    fog.near = lerp(4, 70, e);
    fog.far = lerp(42, 160, e);
  });

  return null;
}

export default function PipelineScene({ active }: { active: boolean }) {
  return (
    <Canvas
      dpr={[1, LITE ? 1.25 : 1.75]}
      camera={{ fov: 50, near: 0.1, far: 220, position: [0, 0.8, 10] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      frameloop={active ? 'always' : 'never'}
    >
      <color attach="background" args={[INK]} />
      <AdaptiveDpr max={LITE ? 1.25 : 1.75} />
      <Rig />
      <Precompile />
      <Spine />
      <Stream />
      <RequestGate />
      <MiddlewareGate />
      <EndpointGate />
      <ApplicationGate />
      <DomainGate />
      <InfrastructureGate />
      <ResponseGate />
      <Packet />
    </Canvas>
  );
}
