/* =========================================================================
   three-scene.js · Cena 3D interativa do hero (WebGL / Three.js)
   "Crystalline Core" — núcleo cristalino deformável + campo de partículas,
   com parallax de mouse e resposta ao scroll. Inspirado em igloo.inc.
   Totalmente procedural (sem assets externos), servido via CDN ESM.
   ========================================================================= */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

(() => {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  // ---- Renderer (com fallback se o WebGL não existir) --------------------
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !isMobile,
      alpha: true,
      powerPreference: 'high-performance'
    });
  } catch (e) {
    canvas.style.display = 'none';
    document.documentElement.classList.add('no-webgl');
    return;
  }

  const sizeEl = canvas.parentElement || canvas;
  let width = sizeEl.clientWidth || window.innerWidth;
  let height = sizeEl.clientHeight || window.innerHeight;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 0, 5.4);

  // ---- GLSL: simplex noise 3D (Ashima Arts / Stefan Gustavson) -----------
  const NOISE = /* glsl */`
    vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;}
    vec4 mod289(vec4 x){return x - floor(x*(1.0/289.0))*289.0;}
    vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314*r;}
    float snoise(vec3 v){
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }
  `;

  // ---- Núcleo cristalino (icosaedro deformável + fresnel gelado) ---------
  const coreUniforms = {
    uTime:      { value: 0 },
    uAmp:       { value: 0.0 },
    uColorDeep: { value: new THREE.Color('#0b1f4d') },
    uColorRim:  { value: new THREE.Color('#9be7ff') },
    uColorGlow: { value: new THREE.Color('#4d8bff') }
  };

  const coreMaterial = new THREE.ShaderMaterial({
    uniforms: coreUniforms,
    transparent: true,
    vertexShader: /* glsl */`
      uniform float uTime;
      uniform float uAmp;
      varying float vNoise;
      varying vec3 vNormal;
      varying vec3 vView;
      ${NOISE}
      void main(){
        float n  = snoise(normal * 1.4 + uTime * 0.25);
        float n2 = snoise(normal * 3.0 - uTime * 0.18) * 0.5;
        float disp = (n + n2) * uAmp;
        vec3 newPos = position + normal * disp;
        vNoise = n;
        vec4 mv = modelViewMatrix * vec4(newPos, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3 uColorDeep;
      uniform vec3 uColorRim;
      uniform vec3 uColorGlow;
      varying float vNoise;
      varying vec3 vNormal;
      varying vec3 vView;
      void main(){
        float fres = pow(1.0 - clamp(dot(vNormal, vView), 0.0, 1.0), 2.4);
        vec3 base = mix(uColorDeep, uColorGlow, smoothstep(-0.8, 0.9, vNoise));
        vec3 color = mix(base, uColorRim, fres);
        gl_FragColor = vec4(color, 0.92);
      }
    `
  });

  const detail = isMobile ? 8 : 18;
  const coreGeo = new THREE.IcosahedronGeometry(1.25, detail);
  const core = new THREE.Mesh(coreGeo, coreMaterial);

  // Wireframe externo (casca de cristal)
  const wireMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#7fd4ff'),
    wireframe: true,
    transparent: true,
    opacity: 0.10
  });
  const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.42, isMobile ? 1 : 2), wireMat);

  const coreGroup = new THREE.Group();
  coreGroup.add(core, wire);
  scene.add(coreGroup);

  // ---- Campo de partículas (glow aditivo) --------------------------------
  function makeSprite() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(160,220,255,0.85)');
    g.addColorStop(1, 'rgba(80,140,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  const COUNT = isMobile ? 850 : 2200;
  const positions = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const r = 2.3 + Math.random() * 3.4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const pMat = new THREE.PointsMaterial({
    size: isMobile ? 0.05 : 0.045,
    map: makeSprite(),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    color: new THREE.Color('#bfe4ff'),
    opacity: 0.9
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  // ---- Interação: mouse + scroll -----------------------------------------
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  let scrollFactor = 0; // 0 (topo) → 1 (fim do hero)
  function updateScroll() {
    const h = sizeEl.getBoundingClientRect();
    const total = (h.height || window.innerHeight);
    scrollFactor = Math.min(Math.max(-h.top / total, 0), 1);
  }
  window.addEventListener('scroll', updateScroll, { passive: true });
  updateScroll();

  // ---- Resize ------------------------------------------------------------
  function onResize() {
    width = sizeEl.clientWidth || window.innerWidth;
    height = sizeEl.clientHeight || window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);

  // ---- Pausa o loop quando o hero sai da tela ----------------------------
  let visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !prefersReduced) loop();
    }, { threshold: 0 }).observe(sizeEl);
  }

  // ---- Loop --------------------------------------------------------------
  const clock = new THREE.Clock();
  let running = false;
  let targetAmp = prefersReduced ? 0.06 : 0.16;

  function render() {
    const t = clock.getElapsedTime();
    coreUniforms.uTime.value = t;
    coreUniforms.uAmp.value += (targetAmp - coreUniforms.uAmp.value) * 0.05;

    // parallax suave
    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;

    coreGroup.rotation.y = t * 0.12 + pointer.x * 0.6;
    coreGroup.rotation.x = pointer.y * 0.4 + scrollFactor * 0.5;
    const s = 1 - scrollFactor * 0.25;
    coreGroup.scale.setScalar(s);

    particles.rotation.y = t * 0.03 + pointer.x * 0.25;
    particles.rotation.x = -pointer.y * 0.15;

    camera.position.x += (pointer.x * 0.6 - camera.position.x) * 0.04;
    camera.position.y += (-pointer.y * 0.4 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  function loop() {
    if (running) return;
    running = true;
    (function frame() {
      if (!visible || prefersReduced) { running = false; return; }
      render();
      requestAnimationFrame(frame);
    })();
  }

  if (prefersReduced) {
    // movimento reduzido: um único frame estático
    targetAmp = 0.06;
    coreUniforms.uAmp.value = 0.06;
    render();
  } else {
    loop();
  }
})();
