/* =========================================================================
   three-scene.js · Cena 3D do hero (WebGL / Three.js)
   Um chip no estilo "Apple Silicon" com as iniciais HdS, flutuando sobre
   uma placa com trilhas de circuito por onde correm pulsos de dados —
   metáfora para integração de sistemas. Materiais PBR com ambiente de
   estúdio procedural, parallax de ponteiro e câmera guiada pelo scroll.
   Totalmente procedural (sem assets externos).
   ========================================================================= */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

const canvas = document.getElementById('hero-canvas');
const hero = document.getElementById('inicio');

if (canvas && hero) init();

function init() {
  const root = document.documentElement;
  const copy = hero.querySelector('.hero-copy');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = matchMedia('(max-width: 760px)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ---- Renderer (fallback CSS se o WebGL não existir) ---------------------
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    root.classList.add('no-webgl');
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.6 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 80);
  scene.environment = studioEnvironment(renderer);

  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(4, 7, 5);
  const rim = new THREE.DirectionalLight(0x8ab4ff, 1.6);
  rim.position.set(-6, 3, -4);
  scene.add(key, rim, new THREE.AmbientLight(0xffffff, 0.15));

  // ---- Objetos -----------------------------------------------------------
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const chip = buildChip(maxAniso);
  scene.add(chip);

  const shared = { uTime: { value: 0 }, uReveal: { value: 0 } };
  const traces = buildTraces(small ? 28 : 52, shared);
  scene.add(traces);
  scene.add(buildBoard());

  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(7.5, 7.5),
    new THREE.MeshBasicMaterial({
      map: radialTexture([[0, 'rgba(70,140,255,0.55)'], [0.35, 'rgba(120,90,255,0.22)'], [1, 'rgba(0,0,0,0)']]),
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false
    })
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.003;
  scene.add(glow);

  // ---- Layout: posiciona o chip na faixa livre abaixo do texto -----------
  let baseDist = 9;
  function layout() {
    const w = hero.clientWidth || innerWidth;
    const h = hero.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;

    const copyBottom = copy ? copy.offsetTop + copy.offsetHeight : h * 0.5;
    const top = Math.min(copyBottom + 12, h * 0.8);
    const bottom = h - Math.max(40, h * 0.05);
    const band = Math.max(bottom - top, h * 0.18);
    const centerY = top + band * 0.5;

    const px = Math.min(band * 1.55, w * (small ? 0.66 : 0.5), 470);
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    baseDist = (2.4 * h) / (2 * px * tanHalf);

    camera.setViewOffset(w, h, 0, h / 2 - centerY, w, h);
    camera.updateProjectionMatrix();
  }
  layout();
  if ('ResizeObserver' in window) new ResizeObserver(layout).observe(hero);
  else addEventListener('resize', layout);
  document.fonts?.ready.then(layout);

  // ---- Interação ---------------------------------------------------------
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  if (fine) {
    addEventListener('pointermove', e => {
      pointer.tx = (e.clientX / innerWidth) * 2 - 1;
      pointer.ty = (e.clientY / innerHeight) * 2 - 1;
    }, { passive: true });
  }
  let scrollP = 0;
  const readScroll = () => {
    scrollP = Math.min(Math.max(scrollY / (hero.offsetHeight * 0.75), 0), 1);
  };
  addEventListener('scroll', readScroll, { passive: true });
  readScroll();

  // ---- Loop --------------------------------------------------------------
  const clock = new THREE.Clock();
  let elapsed = 0, intro = reduce ? 1 : 0, smoothScroll = scrollP;
  const ease = t => 1 - Math.pow(1 - t, 3);

  function render(dt) {
    elapsed += dt;
    intro = Math.min(intro + dt / 2.2, 1);
    const e = ease(intro);

    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    smoothScroll += (scrollP - smoothScroll) * 0.12;
    const s = smoothScroll;

    shared.uTime.value = elapsed;
    shared.uReveal.value = reduce ? 1.4 : Math.max(0, intro * 1.8 - 0.35) * 1.4;

    // chip pousa, flutua e gira de leve
    const float = reduce ? 0 : Math.sin(elapsed * 1.1) * 0.035;
    chip.position.y = 0.14 + (1 - e) * 1.6 + float;
    chip.rotation.y = -0.6 * (1 - e) + (reduce ? 0 : Math.sin(elapsed * 0.32) * 0.14) + pointer.x * 0.32 + s * 0.7;
    chip.rotation.x = pointer.y * 0.1;
    chip.rotation.z = -pointer.x * 0.05;

    // câmera: de 30° para quase vista superior conforme o scroll
    const el = THREE.MathUtils.lerp(0.52, 1.12, s) - pointer.y * 0.05;
    const az = pointer.x * 0.12;
    const dist = baseDist * (1 - 0.14 * s);
    camera.position.set(
      Math.sin(az) * dist * Math.cos(el),
      dist * Math.sin(el),
      Math.cos(az) * dist * Math.cos(el)
    );
    camera.lookAt(0, 0.12, 0);

    renderer.render(scene, camera);
  }

  let visible = true, running = false, first = true;
  function loop() {
    if (running) return;
    running = true;
    clock.getDelta();
    (function frame() {
      if (!visible || document.hidden) { running = false; return; }
      render(Math.min(clock.getDelta(), 0.05));
      if (first) { first = false; root.classList.add('webgl-ready'); }
      requestAnimationFrame(frame);
    })();
  }

  if (reduce) {
    render(0);
    root.classList.add('webgl-ready');
    const redraw = () => { layout(); readScroll(); smoothScroll = scrollP; render(0); };
    addEventListener('resize', redraw);
    addEventListener('scroll', () => requestAnimationFrame(redraw), { passive: true });
    return;
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) loop();
    }).observe(hero);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible) loop(); });
  loop();
}

/* ---------------------------------------------------------------------------
   Ambiente de estúdio procedural (softboxes) → reflexos realistas no metal
--------------------------------------------------------------------------- */
function studioEnvironment(renderer) {
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(
    new THREE.BoxGeometry(30, 20, 30),
    new THREE.MeshBasicMaterial({ color: 0x06070a, side: THREE.BackSide })
  ));
  const panel = (w, h, color, intensity, pos) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide })
    );
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    env.add(m);
  };
  panel(14, 5, 0xffffff, 4.0, [0, 9, 2]);      // softbox superior
  panel(5, 10, 0x9cc8ff, 3.0, [-12, 3, 3]);    // lateral fria
  panel(5, 10, 0xd6b8ff, 2.2, [12, 3, -2]);    // lateral violeta
  panel(16, 2.5, 0xffffff, 1.6, [0, 2, -13]);  // faixa de fundo
  panel(8, 2, 0x64d2ff, 1.4, [0, 1, 13]);      // faixa frontal

  const pmrem = new THREE.PMREMGenerator(renderer);
  const texture = pmrem.fromScene(env, 0.03).texture;
  pmrem.dispose();
  env.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
  return texture;
}

/* ---------------------------------------------------------------------------
   Chip: substrato + contatos dourados + moldura prateada + topo preto + rótulo
--------------------------------------------------------------------------- */
function roundedRect(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

// placa arredondada deitada no plano XZ, de y=0 até y=height
function slab(size, radius, height, bevel) {
  const geo = new THREE.ExtrudeGeometry(roundedRect(size - bevel * 2, size - bevel * 2, Math.max(radius - bevel, 0.001)), {
    depth: Math.max(height - bevel * 2, 0.001),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 5,
    curveSegments: 10
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, bevel, 0);
  return geo;
}

function buildChip(maxAniso) {
  const group = new THREE.Group();

  const SUB = 2.4, SUB_H = 0.09;
  const substrate = new THREE.Mesh(
    slab(SUB, 0.16, SUB_H, 0.012),
    new THREE.MeshPhysicalMaterial({ color: 0x0f1a16, roughness: 0.55, metalness: 0.2, clearcoat: 0.7, clearcoatRoughness: 0.4 })
  );
  group.add(substrate);

  // contatos dourados no perímetro
  const gold = new THREE.MeshStandardMaterial({ color: 0xd9ab52, metalness: 1, roughness: 0.28 });
  const perSide = 16;
  const pads = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 0.012, 0.11), gold, perSide * 4);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), sc = new THREE.Vector3(1, 1, 1);
  let n = 0;
  for (let side = 0; side < 4; side++) {
    const angle = side * Math.PI / 2;
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    for (let i = 0; i < perSide; i++) {
      const along = -0.92 + (i / (perSide - 1)) * 1.84;
      p.set(along, SUB_H + 0.004, 1.07).applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      m.compose(p, q, sc);
      pads.setMatrixAt(n++, m);
    }
  }
  group.add(pads);

  // marcador do pino 1
  const marker = new THREE.Mesh(new THREE.CircleGeometry(0.045, 24), gold);
  marker.rotation.x = -Math.PI / 2;
  marker.position.set(-1.05, SUB_H + 0.002, -1.05);
  group.add(marker);

  // moldura prateada
  const frame = new THREE.Mesh(
    slab(1.8, 0.15, 0.05, 0.012),
    new THREE.MeshPhysicalMaterial({ color: 0xdfe1e6, metalness: 1, roughness: 0.16 })
  );
  frame.position.y = SUB_H;
  group.add(frame);

  // topo preto brilhante
  const TOP_H = 0.11;
  const top = new THREE.Mesh(
    slab(1.7, 0.13, TOP_H, 0.03),
    new THREE.MeshPhysicalMaterial({ color: 0x0c0d10, metalness: 0.6, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08 })
  );
  top.position.y = SUB_H + 0.02;
  group.add(top);

  // rótulo com as iniciais
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(1.52, 1.52),
    new THREE.MeshBasicMaterial({
      map: labelTexture(maxAniso), transparent: true, depthWrite: false, toneMapped: false,
      polygonOffset: true, polygonOffsetFactor: -2
    })
  );
  label.rotation.x = -Math.PI / 2;
  label.position.y = SUB_H + 0.02 + TOP_H + 0.002;
  group.add(label);

  return group;
}

function labelTexture(maxAniso) {
  const size = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAniso;

  const family = '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, "Segoe UI", Roboto, sans-serif';
  const draw = () => {
    ctx.clearRect(0, 0, size, size);

    // contorno gravado sutil
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(70, 70, size - 140, size - 140, 70) : ctx.rect(70, 70, size - 140, size - 140);
    ctx.stroke();

    const g = ctx.createLinearGradient(230, 330, 800, 640);
    g.addColorStop(0, '#8be8ff');
    g.addColorStop(0.5, '#5a8cff');
    g.addColorStop(1, '#c48dff');
    ctx.fillStyle = g;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 290px ${family}`;
    ctx.fillText('HdS', size / 2, 470);

    ctx.fillStyle = 'rgba(235,240,255,0.62)';
    ctx.font = `600 54px ${family}`;
    const word = 'FULL-STACK';
    const spacing = 20;
    const widths = [...word].map(ch => ctx.measureText(ch).width);
    const total = widths.reduce((a, b) => a + b, 0) + spacing * (word.length - 1);
    let x = size / 2 - total / 2;
    ctx.textAlign = 'left';
    [...word].forEach((ch, i) => { ctx.fillText(ch, x, 690); x += widths[i] + spacing; });

    tex.needsUpdate = true;
  };
  draw();
  document.fonts?.ready.then(draw);
  return tex;
}

/* ---------------------------------------------------------------------------
   Trilhas de circuito em leque, com pulsos de luz animados no shader
--------------------------------------------------------------------------- */
function buildTraces(count, shared) {
  const group = new THREE.Group();
  const palette = [new THREE.Color('#64d2ff'), new THREE.Color('#0a84ff'), new THREE.Color('#7d7aff'), new THREE.Color('#bf5af2')];
  const perSide = Math.ceil(count / 4);
  const half = 1.2;
  const up = new THREE.Vector3(0, 1, 0);

  const vertexShader = /* glsl */`
    varying vec2 vUv;
    varying vec3 vWorld;
    void main(){
      vUv = uv;
      vec4 w = modelMatrix * vec4(position, 1.0);
      vWorld = w.xyz;
      gl_Position = projectionMatrix * viewMatrix * w;
    }
  `;
  const fragmentShader = /* glsl */`
    uniform float uTime;
    uniform float uReveal;
    uniform float uSeed;
    uniform float uSpeed;
    uniform vec3 uColor;
    varying vec2 vUv;
    varying vec3 vWorld;
    void main(){
      float u = vUv.x;
      float head = fract(uTime * uSpeed + uSeed) * 1.5 - 0.25;
      float d = head - u;
      float pulse = d > 0.0 ? exp(-d * 18.0) : 0.0;
      float reveal = 1.0 - smoothstep(uReveal - 0.12, uReveal, u);
      float dist = length(vWorld.xz);
      float fade = 1.0 - smoothstep(2.4, 7.0, dist);
      fade *= mix(0.2, 1.0, smoothstep(-3.6, -0.6, vWorld.z));
      vec3 col = uColor * (0.32 + pulse * 2.6) + vec3(1.0) * pow(pulse, 4.0) * 0.8;
      gl_FragColor = vec4(col, fade * reveal);
    }
  `;

  for (let side = 0; side < 4; side++) {
    const angle = side * Math.PI / 2;
    for (let k = 0; k < perSide; k++) {
      const along = -1 + ((k + 0.5) / perSide) * 2;           // -1..1 ao longo da borda
      const spread = Math.abs(along);
      const turn = Math.sign(along) || 1;                    // abre em leque
      const a = 0.12 + Math.random() * 0.22 + (1 - spread) * 0.25;
      const b = 0.15 + spread * 1.1 + Math.random() * 0.25;
      const c = 2.2 + Math.random() * 4.5;

      // monta no lado +Z e gira para os outros lados
      const p0 = new THREE.Vector3(along * (half - 0.16), 0.004, half);
      const p1 = p0.clone().add(new THREE.Vector3(0, 0, a));
      const p2 = p1.clone().add(new THREE.Vector3(turn, 0, 1).normalize().multiplyScalar(b));
      const p3 = p2.clone().add(new THREE.Vector3(0, 0, c));
      [p0, p1, p2, p3].forEach(v => v.applyAxisAngle(up, angle));

      const path = new THREE.CurvePath();
      path.add(new THREE.LineCurve3(p0, p1));
      path.add(new THREE.LineCurve3(p1, p2));
      path.add(new THREE.LineCurve3(p2, p3));

      const mesh = new THREE.Mesh(
        new THREE.TubeGeometry(path, 56, 0.0085, 4, false),
        new THREE.ShaderMaterial({
          uniforms: {
            uTime: shared.uTime,
            uReveal: shared.uReveal,
            uSeed: { value: Math.random() },
            uSpeed: { value: 0.1 + Math.random() * 0.16 },
            uColor: { value: palette[(side + k) % palette.length] }
          },
          vertexShader,
          fragmentShader,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        })
      );
      group.add(mesh);
    }
  }
  return group;
}

// grade de pontos da "placa", sumindo nas bordas
function buildBoard() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(160,190,255,0.55)';
  ctx.beginPath();
  ctx.arc(32, 32, 2.2, 0, Math.PI * 2);
  ctx.fill();
  const dots = new THREE.CanvasTexture(c);
  dots.wrapS = dots.wrapT = THREE.RepeatWrapping;
  dots.repeat.set(70, 70);
  dots.colorSpace = THREE.SRGBColorSpace;

  // alphaMap lê o canal verde: máscara em tons de cinza opacos
  const mask = radialTexture([[0, '#ffffff'], [0.35, '#737373'], [0.75, '#000000'], [1, '#000000']]);
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 22),
    new THREE.MeshBasicMaterial({ map: dots, alphaMap: mask, transparent: true, opacity: 0.38, depthWrite: false, toneMapped: false })
  );
  board.rotation.x = -Math.PI / 2;
  return board;
}

function radialTexture(stops, size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
