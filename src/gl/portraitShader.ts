export const quadVert = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/**
 * O retrato é desenhado como uma grade de glifos (o "código-fonte" do Davi).
 * Perto do cursor a grade se desfaz e o retrato real aparece: descompilado.
 */
export const portraitFrag = /* glsl */ `
  precision highp float;

  uniform sampler2D uImage;
  uniform sampler2D uAtlas;
  uniform float uCount;
  uniform float uCell;
  uniform vec2  uRes;
  uniform vec2  uImgSize;
  uniform vec2  uImgOffset;
  uniform vec2  uMouse;
  uniform vec2  uVel;
  uniform float uLens;
  uniform float uLensR;
  uniform float uTime;
  uniform float uIntro;
  uniform float uOut;
  uniform vec3  uBone;
  uniform vec3  uAccent;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  vec4 sampleImg(vec2 frag) {
    vec2 uv = (frag - uImgOffset) / uImgSize;
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec4(0.0);
    return texture2D(uImage, uv);
  }

  void main() {
    vec2 frag = gl_FragCoord.xy;

    // ---- lente: distância ao cursor, deformada pela velocidade (rastro líquido)
    vec2 toM = frag - uMouse;
    float stretch = 1.0 + length(uVel) * 0.004;
    vec2 dir = length(uVel) > 0.001 ? normalize(uVel) : vec2(1.0, 0.0);
    float along = dot(toM, dir);
    vec2 perp = toM - along * dir;
    float dist = length(perp + dir * along / stretch);
    float lens = (1.0 - smoothstep(uLensR * 0.35, uLensR, dist)) * uLens;

    // ---- grade de glifos (cresce e se dissolve quando o hero sai de cena)
    float cell = uCell * (1.0 + uOut * 2.6);
    vec2 id = floor(frag / cell);
    vec2 cuv = fract(frag / cell);
    vec2 center = (id + 0.5) * cell;
    vec4 src = sampleImg(center);

    float lum = dot(src.rgb, vec3(0.299, 0.587, 0.114));
    // níveis: puxa o contraste da pele, e o cabelo escuro ainda vira pontos (silhueta)
    float dens = smoothstep(0.05, 0.78, lum);
    dens = max(pow(dens, 0.8), 0.16);

    // ---- intro: compila de cima pra baixo, com uma frente de caracteres embaralhados
    float h = hash(id);
    float row = 1.0 - center.y / uRes.y;
    float front = uIntro * 1.35 - (row * 0.85 + h * 0.25);
    float appear = smoothstep(0.0, 0.06, front);
    float scrambling = 1.0 - smoothstep(0.0, 0.22, front);

    float idx = floor(dens * (uCount - 1.0) + 0.5);
    float tick = floor(uTime * 14.0);
    float rnd = floor(hash(id + tick) * uCount);
    // cintilação viva: algumas células trocam de caractere, como dado chegando
    float live = step(0.996, hash(id * 1.7 + floor(uTime * 3.0)));
    float churn = max(scrambling * appear, max(live, uOut * step(0.6, h)));
    idx = mix(idx, rnd, step(0.5, churn));

    vec2 auv = vec2((idx + cuv.x) / uCount, cuv.y);
    float g = texture2D(uAtlas, auv).r;

    vec3 tint = mix(uAccent * 0.9, uBone, smoothstep(0.12, 0.65, dens));
    vec3 glyphCol = mix(tint, src.rgb * 1.25 + 0.06, 0.28);
    glyphCol = mix(glyphCol, uAccent * 1.3, scrambling * appear * 0.9);
    float glyphA = g * src.a * appear * (1.0 - uOut * 0.85);

    // ---- retrato real dentro da lente, com aberração cromática na borda
    float edge = smoothstep(0.15, 0.95, lens) * (1.0 - smoothstep(0.95, 1.0, lens));
    vec2 push = normalize(toM + 0.0001) * edge * 9.0;
    vec4 pr = sampleImg(frag - push * 1.0);
    vec4 pg = sampleImg(frag);
    vec4 pb = sampleImg(frag + push * 1.0);
    vec3 photo = vec3(pr.r, pg.g, pb.b);
    float photoA = max(pg.a, max(pr.a, pb.a)) * appear;

    // scanlines finas sobre a foto para manter o idioma "tela"
    photo *= 0.92 + 0.08 * sin(frag.y * 1.6);

    vec3 col = mix(glyphCol, photo, lens);
    float a = mix(glyphA, photoA, lens);

    // anel da lente
    float ring = smoothstep(uLensR * 0.9, uLensR * 0.97, dist) * (1.0 - smoothstep(uLensR * 0.97, uLensR, dist));
    col = mix(col, uAccent, ring * uLens * 0.85);
    a = max(a, ring * uLens * 0.55);

    gl_FragColor = vec4(col, a);
  }
`;
