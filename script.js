document.addEventListener('DOMContentLoaded', () => {
    // ===== NAV / THEME / TOPO =====
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
            themeBtn.innerHTML = stored === 'dark'
                ? '<i class="fa-solid fa-sun"></i>'
                : '<i class="fa-solid fa-moon"></i>';
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
        }
        themeBtn.addEventListener('click', () => {
            const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            themeBtn.innerHTML = next === 'dark'
                ? '<i class="fa-solid fa-sun"></i>'
                : '<i class="fa-solid fa-moon"></i>';
        });
    }

    // Smooth scroll
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

    // Botão topo
    window.addEventListener('scroll', () => {
        topBtn?.classList.toggle('visible', window.scrollY > 500);
    });

    // ===== Ripple em botões =====
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

    // ===== TYPEWRITER =====
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

    // Títulos com digitação quando entram na tela
    const headingObs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const h = entry.target;
            const span = h.querySelector('span');
            const txt = h.getAttribute('data-text') || h.textContent.trim();
            h.classList.add('done');
            typeOnce(span, txt, 22);
            headingObs.unobserve(h);
        });
    }, { threshold: .3 });
    document.querySelectorAll('.section-title.typing').forEach(h => headingObs.observe(h));

    // Reveal on scroll
    const revealObs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealObs.unobserve(entry.target);
            }
        });
    }, { threshold: .12 });
    document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

    // Abrir/fechar detalhes de projetos
    document.querySelectorAll('.toggle-details').forEach(btn => {
        btn.addEventListener('click', () => {
            const d = btn.nextElementSibling;
            d.classList.toggle('open');
            btn.textContent = d.classList.contains('open') ? 'Ver menos' : 'Ver mais';
        });
    });

    // ===== GALÁXIA 3D (sem módulos) =====
    const root = document.getElementById('galaxy3d');
    if (root && window.THREE) initGalaxy(root);

    function initGalaxy(rootEl) {
        const THREE_ = window.THREE;
        const isMobile = matchMedia('(max-width: 768px)').matches;

        const scene = new THREE_.Scene();
        const camera = new THREE_.PerspectiveCamera(70, rootEl.clientWidth / rootEl.clientHeight, 0.1, 200);
        camera.position.set(0, 2.2, isMobile ? 9 : 8);

        const renderer = new THREE_.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        const DPR = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
        renderer.setPixelRatio(DPR);
        renderer.setSize(rootEl.clientWidth, rootEl.clientHeight);
        renderer.setClearColor(0x000000, 1);
        rootEl.appendChild(renderer.domElement);

        scene.add(new THREE_.AmbientLight(0xffffff, 0.4));

        const galaxyGroup = new THREE_.Group();
        scene.add(galaxyGroup);

        // Estrelas de fundo
        const bgCount = isMobile ? 2500 : 4000;
        const bgGeom = new THREE_.BufferGeometry();
        const bgPos = new Float32Array(bgCount * 3);
        for (let i = 0; i < bgCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 80;
            bgPos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
            bgPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
            bgPos[i*3+2] = r * Math.cos(phi);
        }
        bgGeom.setAttribute('position', new THREE_.BufferAttribute(bgPos, 3));
        const bgMat = new THREE_.PointsMaterial({ size: 0.06, sizeAttenuation: true, color: 0xffffff, opacity: 0.6, transparent: true });
        const bgStars = new THREE_.Points(bgGeom, bgMat);
        galaxyGroup.add(bgStars);

        // Parâmetros (escalonados por área e mobile)
        const area = rootEl.clientWidth * rootEl.clientHeight;
        let baseCount = Math.floor(area / 8);
        baseCount = Math.max(16000, Math.min(90000, baseCount));
        if (isMobile) baseCount = Math.floor(baseCount * 0.6);

        const params = {
            count: baseCount,
            size: isMobile ? 0.022 : 0.02,
            radius: 6.5,
            branches: 6,
            spin: 1.2,
            randomness: 0.25,
            randomnessPower: 2.6,
            insideColor: new THREE_.Color('#ffd86b'),
            outsideColor: new THREE_.Color('#5aa8ff'),
            rotationSpeed: isMobile ? 0.1 : 0.12,
            pulseSpeed: 0.5,
            pulseIntensity: 0.1
        };

        let galaxyPoints = null, galaxyGeom = null, galaxyMat = null;

        function generateGalaxy() {
            if (galaxyPoints) {
                galaxyGeom.dispose();
                galaxyMat.dispose();
                galaxyGroup.remove(galaxyPoints);
            }

            galaxyGeom = new THREE_.BufferGeometry();
            const positions = new Float32Array(params.count * 3);
            const colors = new Float32Array(params.count * 3);

            for (let i = 0; i < params.count; i++) {
                const i3 = i * 3;
                const radius = Math.random() * params.radius;
                const spinAngle = radius * params.spin;
                const branchAngle = ((i % params.branches) / params.branches) * Math.PI * 2;

                const randX = Math.pow(Math.random(), params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * params.randomness * radius;
                const randY = Math.pow(Math.random(), params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * params.randomness * radius * 0.35;
                const randZ = Math.pow(Math.random(), params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * params.randomness * radius;

                positions[i3]   = Math.cos(branchAngle + spinAngle) * radius + randX;
                positions[i3+1] = randY * 0.8;
                positions[i3+2] = Math.sin(branchAngle + spinAngle) * radius + randZ;

                const t = radius / params.radius;
                const c = params.insideColor.clone().lerp(params.outsideColor, t);
                colors[i3]   = c.r; colors[i3+1] = c.g; colors[i3+2] = c.b;
            }

            galaxyGeom.setAttribute('position', new THREE_.BufferAttribute(positions, 3));
            galaxyGeom.setAttribute('color', new THREE_.BufferAttribute(colors, 3));

            galaxyMat = new THREE_.PointsMaterial({
                size: params.size, sizeAttenuation: true, depthWrite: false,
                blending: THREE_.AdditiveBlending, vertexColors: true
            });

            galaxyPoints = new THREE_.Points(galaxyGeom, galaxyMat);
            galaxyGroup.add(galaxyPoints);
        }
        generateGalaxy();

        // Shooting stars
        const shootingStars = [];
        function spawnShootingStar() {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 18;

            const pos = new THREE_.Vector3(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            );
            const dir = pos.clone().multiplyScalar(-1).add(new THREE_.Vector3((Math.random()-0.5)*6,(Math.random()-0.5)*6,(Math.random()-0.5)*6)).normalize();

            const head = new THREE_.Mesh(
                new THREE_.SphereGeometry(0.06, 8, 8),
                new THREE_.MeshBasicMaterial({ color: 0xffffff })
            );
            head.position.copy(pos);

            const trailGeom = new THREE_.BufferGeometry();
            const trailCount = 16;
            const trailPos = new Float32Array(trailCount * 3);
            for (let i = 0; i < trailCount; i++) {
                trailPos[i*3] = pos.x - i*0.12*dir.x;
                trailPos[i*3+1] = pos.y - i*0.12*dir.y;
                trailPos[i*3+2] = pos.z - i*0.12*dir.z;
            }
            trailGeom.setAttribute('position', new THREE_.BufferAttribute(trailPos, 3));
            const trail = new THREE_.Points(trailGeom, new THREE_.PointsMaterial({
                size: 0.07, sizeAttenuation: true, color: 0xffffff, transparent: true, opacity: 0.7
            }));

            const star = new THREE_.Group();
            star.add(head); star.add(trail);
            star.userData = { dir, life: 0, maxLife: 2.5, trailGeom };
            scene.add(star);
            shootingStars.push(star);
        }

        // Controles: desktop (mouse) + mobile (toque/pinça)
        let isDragging = false;
        const rot = { x: 0.2, y: 0 };
        const vel = { x: 0, y: 0 };
        let last = { x: 0, y: 0 };

        // Mouse
        renderer.domElement.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'mouse') {
                isDragging = true; last.x = e.clientX; last.y = e.clientY;
            }
        });
        window.addEventListener('pointerup', () => { isDragging = false; });
        window.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            const dx = (e.clientX - last.x) * 0.005;
            const dy = (e.clientY - last.y) * 0.005;
            vel.y = dx; vel.x = dy;
            rot.y += dx;
            rot.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, rot.x + dy));
            last.x = e.clientX; last.y = e.clientY;
        });
        renderer.domElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            camera.position.z = THREE_.MathUtils.clamp(camera.position.z + e.deltaY * 0.0025, 3.5, 14);
        }, { passive: false });

        // Touch: arrasto + pinch
        let activeTouches = [];
        let pinchStartDist = 0;
        function getTouchPos(e, i) {
            const t = e.touches[i];
            return { x: t.clientX, y: t.clientY };
        }
        function dist(a, b) { const dx = a.x - b.x, dy = a.y - b.y; return Math.hypot(dx, dy); }

        renderer.domElement.addEventListener('touchstart', (e) => {
            activeTouches = Array.from(e.touches);
            if (activeTouches.length === 1) {
                isDragging = true;
                last.x = activeTouches[0].clientX;
                last.y = activeTouches[0].clientY;
            } else if (activeTouches.length === 2) {
                isDragging = false;
                pinchStartDist = dist(getTouchPos(e,0), getTouchPos(e,1));
            }
        }, { passive: true });

        renderer.domElement.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1) {
                // arrastar
                const t = e.touches[0];
                const dx = (t.clientX - last.x) * 0.005;
                const dy = (t.clientY - last.y) * 0.005;
                rot.y += dx;
                rot.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, rot.x + dy));
                last.x = t.clientX; last.y = t.clientY;
            } else if (e.touches.length === 2) {
                // pinch zoom
                e.preventDefault();
                const dNow = dist(getTouchPos(e,0), getTouchPos(e,1));
                const delta = (pinchStartDist - dNow) * 0.01;
                camera.position.z = THREE_.MathUtils.clamp(camera.position.z + delta, 3.5, 14);
                pinchStartDist = dNow;
            }
        }, { passive: false });

        window.addEventListener('touchend', () => { activeTouches = []; isDragging = false; }, { passive: true });

        // Resize
        function onResize() {
            camera.aspect = rootEl.clientWidth / rootEl.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(rootEl.clientWidth, rootEl.clientHeight);
        }
        window.addEventListener('resize', onResize);

        // Animação
        const clock = new THREE_.Clock();
        let spawnTimer = 0;
        function animate() {
            const dt = Math.min(clock.getDelta(), 0.033);
            requestAnimationFrame(animate);

            rot.y += params.rotationSpeed * 0.2 * dt;
            vel.x *= 0.92; vel.y *= 0.92;
            rot.x += vel.x * dt; rot.y += vel.y * dt;

            galaxyGroup.rotation.set(rot.x, rot.y, 0);

            const pulse = Math.sin(clock.elapsedTime * params.pulseSpeed) * params.pulseIntensity + 1;
            galaxyGroup.scale.setScalar(pulse);

            spawnTimer += dt;
            if (spawnTimer > (isMobile ? 1.1 : 0.9) + Math.random()*0.8) {
                spawnTimer = 0;
                if (shootingStars.length < (isMobile ? 4 : 6)) spawnShootingStar();
            }

            for (let i = shootingStars.length - 1; i >= 0; i--) {
                const s = shootingStars[i];
                s.userData.life += dt;
                const speed = isMobile ? 10 : 12;
                s.position.addScaledVector(s.userData.dir, speed * dt);

                const arr = s.userData.trailGeom.attributes.position.array;
                for (let k = arr.length - 3; k >= 3; k--) {
                    arr[k] = arr[k-3]; arr[k+1] = arr[k-2]; arr[k+2] = arr[k-1];
                }
                arr[0] = s.position.x; arr[1] = s.position.y; arr[2] = s.position.z;
                s.userData.trailGeom.attributes.position.needsUpdate = true;

                if (s.userData.life > s.userData.maxLife) {
                    scene.remove(s);
                    shootingStars.splice(i, 1);
                }
            }

            renderer.render(scene, camera);
        }
        animate();
    }
});
