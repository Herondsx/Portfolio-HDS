document.addEventListener('DOMContentLoaded', () => {
    const burger = document.getElementById('burger');
    const nav = document.getElementById('navLinks');
    const topBtn = document.getElementById('btnTop');
    const themeBtn = document.getElementById('themeToggle');

    burger?.addEventListener('click', () => {
        nav.classList.toggle('active');
        burger.classList.toggle('active');
    });

    if (themeBtn) {
        const stored = localStorage.getItem('theme');
        if (stored) {
            document.documentElement.setAttribute('data-theme', stored);
            themeBtn.innerHTML = stored === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
        } else if (matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
        }
        themeBtn.addEventListener('click', () => {
            const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            themeBtn.innerHTML = next === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
        });
    }

    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const target = document.querySelector(a.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            window.scrollTo({ top: target.offsetTop - 60, behavior: 'smooth' });
            nav?.classList.remove('active');
            burger?.classList.remove('active');
        });
    });

    addEventListener('scroll', () => {
        topBtn?.classList.toggle('visible', scrollY > 500);
    });

    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('pointerdown', ev => {
            const r = btn.getBoundingClientRect();
            const x = ev.clientX - r.left;
            const y = ev.clientY - r.top;
            const span = Object.assign(document.createElement('span'), {
                style: `position:absolute;left:${x}px;top:${y}px;width:0;height:0;border-radius:50%;
        background:rgba(255,255,255,.35);transform:translate(-50%,-50%);
        pointer-events:none;opacity:1;transition:width .5s,height .5s,opacity .6s`
            });
            btn.style.position = 'relative';
            btn.style.overflow = 'hidden';
            btn.appendChild(span);
            requestAnimationFrame(() => {
                const s = Math.max(r.width, r.height) * 2;
                span.style.width = s + 'px';
                span.style.height = s + 'px';
                span.style.opacity = '0';
            });
            setTimeout(() => span.remove(), 650);
        }, { passive: true });
    });

    function typeOnce(el, text, speed = 28) {
        if (!el) return;
        el.textContent = '';
        let i = 0;
        (function loop() {
            el.textContent = text.slice(0, ++i);
            if (i < text.length) setTimeout(loop, speed);
            else el.classList.add('done');
        })();
    }
    typeOnce(document.getElementById('typeWelcome'), 'Bem-vindo ao meu portfólio');

    const headingObs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const h = entry.target; const span = h.querySelector('span');
            const txt = h.getAttribute('data-text') || h.textContent.trim();
            typeOnce(span, txt, 22);
            headingObs.unobserve(h);
        });
    }, { threshold: .3 });
    document.querySelectorAll('.section-title.typing').forEach(h => headingObs.observe(h));

    const revealObs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObs.unobserve(entry.target); }
        });
    }, { threshold: .12 });
    document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

    document.querySelectorAll('.toggle-details').forEach(btn => {
        btn.addEventListener('click', () => {
            const d = btn.nextElementSibling;
            d.classList.toggle('open');
            btn.textContent = d.classList.contains('open') ? 'Ver menos' : 'Ver mais';
        });
    });

    const root = document.getElementById('galaxy3d');
    if (root) startGalaxy(root);
});

function startGalaxy(root) {
    const canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    root.appendChild(canvas);

    const gl =
        canvas.getContext('webgl2', { antialias: true, alpha: true }) ||
        canvas.getContext('webgl',  { antialias: true, alpha: true }) ||
        canvas.getContext('experimental-webgl', { antialias: true, alpha: true });

    if (!gl || typeof THREE === 'undefined') {
        startGalaxy2D(root, canvas);
        return;
    }

    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const DPR = Math.min((isMobile ? 1.5 : 2), devicePixelRatio || 1);

    const renderer = new THREE.WebGLRenderer({ canvas, context: gl, antialias: true, alpha: true });
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.035);

    const camera = new THREE.PerspectiveCamera(72, 1, 0.1, 200);
    scene.add(camera);

    function resize() {
        const r = root.getBoundingClientRect();
        renderer.setPixelRatio(DPR);
        renderer.setSize(r.width, r.height, false);
        camera.aspect = r.width / r.height;
        camera.updateProjectionMatrix();
    }
    resize(); addEventListener('resize', resize);

    scene.add(new THREE.AmbientLight(0xffffff, 0.25));

    let radius = isMobile ? 10 : 11, yaw = 0.9, pitch = 0.35;
    let spinEnabled = true;

    function updateCam() {
        const minP = -Math.PI/2 + 0.01, maxP = Math.PI/2 - 0.01;
        if (pitch < minP) pitch = minP; if (pitch > maxP) pitch = maxP;
        const x = radius * Math.cos(pitch) * Math.cos(yaw);
        const y = radius * Math.sin(pitch);
        const z = radius * Math.cos(pitch) * Math.sin(yaw);
        camera.position.set(x, y, z);
        camera.lookAt(0, 0, 0);
    }
    updateCam();

    const galaxyGroup = new THREE.Group();
    scene.add(galaxyGroup);

    (function addAmbientStars(){
        const count = isMobile ? 2500 : 4000, rad = 70;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        for (let i=0;i<count;i++){
            const u = Math.random(), v = Math.random();
            const theta = 2*Math.PI*u, phi = Math.acos(2*v-1);
            pos[i*3  ] = rad * Math.sin(phi) * Math.cos(theta);
            pos[i*3+1] = rad * Math.sin(phi) * Math.sin(theta);
            pos[i*3+2] = rad * Math.cos(phi);
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({ size: 0.06, color: 0xffffff, transparent: true, opacity: 0.75 });
        const stars = new THREE.Points(geo, mat);
        scene.add(stars);
    })();

    const G = {
        count: isMobile ? 52000 : 120000,
        size:  isMobile ? 0.015 : 0.018,
        radius: 5.8,
        branches: 6,
        spin: 1.1,
        randomness: 0.26,
        randomnessPower: 2.1,
        inside: new THREE.Color('#fff7cc'),
        outside: new THREE.Color('#6aa7ff')
    };

    let galaxyPts, galaxyGeo, galaxyMat;
    function generateGalaxy(){
        if (galaxyPts) { galaxyGeo.dispose(); galaxyMat.dispose(); galaxyGroup.remove(galaxyPts); }

        galaxyGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(G.count * 3);
        const colors    = new Float32Array(G.count * 3);

        for (let i=0;i<G.count;i++){
            const i3 = i*3;
            const r  = Math.random() * G.radius;
            const sp = r * G.spin;
            const ba = ((i % G.branches) / G.branches) * Math.PI * 2;

            const rx = Math.pow(Math.random(), G.randomnessPower) * (Math.random()<0.5?1:-1) * G.randomness * r;
            const ry = Math.pow(Math.random(), G.randomnessPower) * (Math.random()<0.5?1:-1) * G.randomness * r * 0.6;
            const rz = Math.pow(Math.random(), G.randomnessPower) * (Math.random()<0.5?1:-1) * G.randomness * r;

            positions[i3  ] = Math.cos(ba + sp) * r + rx;
            positions[i3+1] = ry;
            positions[i3+2] = Math.sin(ba + sp) * r + rz;

            const c = G.inside.clone().lerp(G.outside, r / G.radius);
            colors[i3  ] = c.r; colors[i3+1] = c.g; colors[i3+2] = c.b;
        }

        galaxyGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        galaxyGeo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

        galaxyMat = new THREE.PointsMaterial({
            size: G.size, sizeAttenuation: true, depthWrite: false,
            transparent: true, blending: THREE.AdditiveBlending, vertexColors: true,
            color: 0xffffff
        });

        galaxyPts = new THREE.Points(galaxyGeo, galaxyMat);
        galaxyGroup.add(galaxyPts);
    }
    generateGalaxy();

    const shooters = [];
    function spawnShooter(){
        const r = 24;
        const theta = Math.random() * Math.PI*2;
        const phi   = Math.acos(2*Math.random()-1);
        const start = new THREE.Vector3(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
        );
        const direction = start.clone().multiplyScalar(-1)
            .addScaledVector(new THREE.Vector3(Math.random(),Math.random(),Math.random()).subScalar(0.5),4)
            .normalize();

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.05,8,8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        head.position.copy(start);

        const trailGeo = new THREE.BufferGeometry();
        const N = 20; const pos = new Float32Array(N*3);
        for (let i=0;i<N;i++){ const off = -i*0.1; pos[i*3]=start.x+direction.x*off; pos[i*3+1]=start.y+direction.y*off; pos[i*3+2]=start.z+direction.z*off; }
        trailGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const trail = new THREE.Points(trailGeo, new THREE.PointsMaterial({ size: 0.08, color: 0xffffff, transparent:true, opacity:0.7 }));

        const g = new THREE.Group(); g.add(head); g.add(trail);
        g.userData = { dir: direction, alive: true, trailGeo };
        scene.add(g); shooters.push(g);
    }

    let dragging = false, lastX = 0, lastY = 0, velX = 0, velY = 0;
    let autoDrift = isMobile ? 0.12 : 0.08;
    let lastUserMove = performance.now();
    const pointers = new Map();
    let pinchBaseDist = 0, pinchBaseRadius = radius;
    let gyroActive = false, gyroX = 0, gyroY = 0;

    function requestGyroIfPossible() {
        if (gyroActive) return;
        const D = window.DeviceOrientationEvent;
        if (!D) return;
        const handler = e => {
            const gx = (e.gamma || 0) / 90;
            const gy = (e.beta || 0) / 180;
            gyroX = gx * 0.25;
            gyroY = gy * 0.25;
        };
        try {
            if (typeof D.requestPermission === 'function') {
                D.requestPermission().then(res => {
                    if (res === 'granted') {
                        window.addEventListener('deviceorientation', handler, true);
                        gyroActive = true;
                    }
                }).catch(()=>{});
            } else {
                window.addEventListener('deviceorientation', handler, true);
                gyroActive = true;
            }
        } catch {}
    }

    function updateInertia(dt){
        if (dragging) return;
        if (Math.abs(velX) > 0.0001 || Math.abs(velY) > 0.0001){
            yaw += velX; pitch += velY; velX *= 0.94; velY *= 0.94; updateCam();
        }
    }

    function onPointerDown(e){
        canvas.setPointerCapture(e.pointerId);
        pointers.set(e.pointerId, {x:e.clientX, y:e.clientY});
        if (pointers.size === 1){
            dragging = true; lastX = e.clientX; lastY = e.clientY; velX = 0; velY = 0;
            pulses.push({ t: 0 });
            lastUserMove = performance.now();
            requestGyroIfPossible();
        } else if (pointers.size === 2){
            const it = Array.from(pointers.values());
            pinchBaseDist = Math.hypot(it[0].x - it[1].x, it[0].y - it[1].y);
            pinchBaseRadius = radius;
        }
    }
    function onPointerMove(e){
        if (!pointers.has(e.pointerId)) return;
        const prev = pointers.get(e.pointerId);
        pointers.set(e.pointerId, {x:e.clientX, y:e.clientY});
        if (pointers.size === 1 && dragging){
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            const sens = isMobile ? 0.006 : 0.005;
            yaw += dx * sens;
            pitch += dy * sens;
            velX = dx * sens * 0.6;
            velY = dy * sens * 0.6;
            updateCam();
            lastX = e.clientX; lastY = e.clientY;
            lastUserMove = performance.now();
        } else if (pointers.size === 2){
            const it = Array.from(pointers.values());
            const d = Math.hypot(it[0].x - it[1].x, it[0].y - it[1].y);
            const scale = d / Math.max(1, pinchBaseDist);
            radius = Math.min(Math.max(pinchBaseRadius / Math.max(0.5, Math.min(2, scale)), 6), 22);
            updateCam();
            lastUserMove = performance.now();
        }
    }
    function onPointerUp(e){
        pointers.delete(e.pointerId);
        if (pointers.size === 0) dragging = false;
    }

    canvas.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    canvas.addEventListener('wheel', e => {
        radius += Math.sign(e.deltaY) * 0.8; radius = Math.min(Math.max(radius, 6), 22);
        updateCam(); e.preventDefault(); lastUserMove = performance.now();
    }, { passive: false });

    const pulses = [];
    canvas.addEventListener('pointerdown', () => { pulses.push({ t: 0 }); });

    canvas.addEventListener('dblclick', () => { spinEnabled = !spinEnabled; });

    let tPrev = performance.now();
    function animate(tNow){
        const dt = Math.min(0.033, (tNow - tPrev) / 1000); tPrev = tNow;

        if (spinEnabled) galaxyGroup.rotation.y += 0.12 * dt;
        const baseScale = 1 + Math.sin(tNow * 0.0012) * 0.04;
        galaxyGroup.scale.setScalar(baseScale);

        const idle = (tNow - lastUserMove) > 2200;
        if (idle) yaw += autoDrift * dt;

        if (gyroActive) {
            yaw += gyroX * dt;
            pitch -= gyroY * dt;
        }

        const hue = (tNow * 0.00005) % 1;
        const col = new THREE.Color().setHSL(0.58 + hue * 0.1, 0.5, 0.5);
        galaxyMat.color.copy(col);

        if (Math.random() > (isMobile ? 0.99 : 0.985) && shooters.length < (isMobile ? 2 : 4)) spawnShooter();
        for (let i=shooters.length-1;i>=0;i--){
            const s = shooters[i];
            if (!s.userData.alive) { scene.remove(s); shooters.splice(i,1); continue; }
            s.position.addScaledVector(s.userData.dir, dt * 18);
            if (s.position.length() < 0.8) s.userData.alive = false;

            const attr = s.userData.trailGeo.getAttribute('position');
            const arr = attr.array;
            for (let k=arr.length-1; k>=3; k--) arr[k] = arr[k-3];
            arr[0] = s.position.x; arr[1] = s.position.y; arr[2] = s.position.z;
            attr.needsUpdate = true;
        }

        for (let i=pulses.length-1;i>=0;i--){
            pulses[i].t += dt;
            const a = Math.max(0, 1 - pulses[i].t * 2);
            galaxyMat.size = G.size * (1 + a * 0.8);
            galaxyGroup.scale.setScalar(baseScale * (1 + a * 0.1));
            if (pulses[i].t > 0.8) pulses.splice(i,1);
        }

        updateInertia(dt);
        updateCam();
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
}

function startGalaxy2D(root, canvas) {
    const ctx = canvas.getContext('2d');
    const DPR = Math.min(devicePixelRatio || 1, 2);

    function resize(){
        const r = root.getBoundingClientRect();
        canvas.width = Math.floor(r.width * DPR);
        canvas.height = Math.floor(r.height * DPR);
        canvas.style.width = r.width + 'px';
        canvas.style.height = r.height + 'px';
    }
    resize(); addEventListener('resize', resize);

    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const N = isMobile ? 4500 : 6000; const pts = [];
    for (let i=0;i<N;i++){
        const rad = Math.random()*230 + 30;
        const a = Math.random()*Math.PI*2;
        const h = (Math.random()-0.5)*90;
        pts.push({ x: Math.cos(a)*rad, y: h, z: Math.sin(a)*rad, c: Math.random() });
    }
    let yaw = 0.6, pitch = 0.15, dist = 520;
    let dragging=false, lx=0, ly=0;
    const pointers = new Map();
    let pinchBase=0, baseDist=dist;

    function project(p){
        const cy=Math.cos(yaw), sy=Math.sin(yaw), cx=Math.cos(pitch), sx=Math.sin(pitch);
        let x=p.x*cy - p.z*sy; let z=p.x*sy + p.z*cy; let y=p.y*cx - z*sx; z=p.y*sx + z*cx;
        const f = 300 / (z + dist);
        return { sx: x*f + canvas.width/2, sy: y*f + canvas.height/2, s:f };
    }

    function loop(){
        yaw += 0.0025;
        ctx.clearRect(0,0,canvas.width,canvas.height);
        const bg = ctx.createLinearGradient(0,0,0,canvas.height); bg.addColorStop(0,'#070b11'); bg.addColorStop(1,'#090c12');
        ctx.fillStyle = bg; ctx.fillRect(0,0,canvas.width,canvas.height);

        for (const p of pts){
            const pr = project(p);
            const size = Math.max(1, 2.6 * pr.s * DPR); const a = Math.min(1, 0.35 + 0.8 * pr.s);
            const hue = 210 + p.c * 120;
            ctx.fillStyle = `hsla(${hue}, 80%, ${60 - pr.s*20}%, ${a})`;
            ctx.beginPath(); ctx.arc(pr.sx, pr.sy, size, 0, Math.PI*2); ctx.fill();
        }
        requestAnimationFrame(loop);
    }

    function onPointerDown(e){
        canvas.setPointerCapture(e.pointerId);
        pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
        if (pointers.size===1){ dragging=true; lx=e.clientX; ly=e.clientY; }
        if (pointers.size===2){
            const it = Array.from(pointers.values());
            pinchBase = Math.hypot(it[0].x-it[1].x, it[0].y-it[1].y);
            baseDist = dist;
        }
    }
    function onPointerMove(e){
        if(!pointers.has(e.pointerId)) return;
        pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
        if (pointers.size===1 && dragging){
            const dx=e.clientX-lx, dy=e.clientY-ly;
            yaw += dx*0.004; pitch += dy*0.004; lx=e.clientX; ly=e.clientY;
        } else if (pointers.size===2){
            const it = Array.from(pointers.values());
            const d = Math.hypot(it[0].x-it[1].x, it[0].y-it[1].y);
            const scale = d/Math.max(1,pinchBase);
            dist = Math.min(Math.max(baseDist/Math.max(0.5,Math.min(2,scale)),260),900);
        }
    }
    function onPointerUp(e){
        pointers.delete(e.pointerId);
        if (pointers.size===0) dragging=false;
    }

    canvas.addEventListener('pointerdown', onPointerDown, {passive:true});
    window.addEventListener('pointermove', onPointerMove, {passive:true});
    window.addEventListener('pointerup', onPointerUp, {passive:true});

    loop();
}
