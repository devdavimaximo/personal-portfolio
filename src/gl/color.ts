import * as THREE from 'three';

/** cores cruas em sRGB: os shaders escrevem direto no framebuffer, sem conversão de espaço de cor */
export const srgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

export const BONE = '#ECE8E1';
export const ACCENT = '#9D8CFF';
export const INK = '#09090B';
