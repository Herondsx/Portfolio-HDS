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

    // ===== GALÁXIA 3D (VERSÃO INTEGRADA E CORRIGIDA) =====
    const galaxyContainer = document.getElementById('galaxy3d');
    if (galaxyContainer && window.THREE) {
        initGalaxy(galaxyContainer);
    }

    function initGalaxy(rootEl) {
        const THREE_ = window.THREE;
        const isMobile = matchMedia('(max-width: 768px)').matches;

        // 1. CENA E CÂMERA
        const scene = new THREE_.Scene();
        const camera = new THREE_.PerspectiveCamera(70, rootEl.clientWidth / rootEl.clientHeight, 0.1, 100);
        camera.position.set(0, 3, isMobile ? 10 : 8); // Posição inicial da câmera
        
        // 2. RENDERIZADOR
        const renderer = new THREE_.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(rootEl.clientWidth, rootEl.clientHeight);
        rootEl.appendChild(renderer.domElement); // Adiciona o canvas ao div

        // 3. GERADOR DE GALÁXIA
        const params = {
            count: isMobile ? 40000 : 80000,
            size: 0.02,
            radius: 6,
            branches: 5,
            spin: 1.1,
            randomness: 0.3,
            randomnessPower: 3,
            insideColor: '#ffac3b',
            outsideColor: '#4268ff',
        };

        let galaxyPoints = null;

        function generateGalaxy() {
            const geometry = new THREE_.BufferGeometry();
            const positions = new Float32Array(params.count * 3);
            const colors = new Float32Array(params.count * 3);
            const colorInside = new THREE_.Color(params.insideColor);
            const colorOutside = new THREE_.Color(params.outsideColor);

            for (let i = 0; i < params.count; i++) {
                const i3 = i * 3;
                const radius = Math.random() * params.radius;
                const spinAngle = radius * params.spin;
                const branchAngle = ((i % params.branches) / params.branches) * Math.PI * 2;

                const randomX = Math.pow(Math.random(), params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * params.randomness * radius;
                const randomY = Math.pow(Math.random(), params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * params.randomness * radius * 0.5;
                const randomZ = Math.pow(Math.random(), params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * params.randomness * radius;

                positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
                positions[i3 + 1] = randomY;
                positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

                const mixedColor = colorInside.clone().lerp(colorOutside, radius / params.radius);
                colors[i3] = mixedColor.r;
                colors[i3 + 1] = mixedColor.g;
                colors[i3 + 2] = mixedColor.b;
            }

            geometry.setAttribute('position', new THREE_.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE_.BufferAttribute(colors, 3));
            
            const material = new THREE_.PointsMaterial({
                size: params.size,
                sizeAttenuation: true,
                depthWrite: false,
                blending: THREE_.AdditiveBlending,
                vertexColors: true
            });

            galaxyPoints = new THREE_.Points(geometry, material);
            scene.add(galaxyPoints);
        }
        generateGalaxy();

        // 4. CONTROLOS (Arrastar e Zoom)
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        let rotation = { x: 0.4, y: 0 }; // Rotação inicial

        // Mouse
        renderer.domElement.addEventListener('pointerdown', (e) => {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        window.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            const deltaMove = {
                x: e.clientX - previousMousePosition.x,
                y: e.clientY - previousMousePosition.y
            };
            rotation.y += deltaMove.x * 0.005;
            rotation.x += deltaMove.y * 0.005;
            rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotation.x)); // Limita a rotação vertical
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        window.addEventListener('pointerup', () => { isDragging = false; });
        renderer.domElement.addEventListener('pointerleave', () => { isDragging = false; });

        // Zoom com a roda do rato
        renderer.domElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            camera.position.z = THREE_.MathUtils.clamp(camera.position.z + e.deltaY * 0.01, 4, 15);
        }, { passive: false });
        
        // 5. RESPONSIVIDADE
        function onResize() {
            camera.aspect = rootEl.clientWidth / rootEl.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(rootEl.clientWidth, rootEl.clientHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }
        window.addEventListener('resize', onResize);

        // 6. LOOP DE ANIMAÇÃO
        const clock = new THREE_.Clock();
        function animate() {
            const elapsedTime = clock.getElapsedTime();
            
            // Rotação automática lenta
            rotation.y += 0.0001;
            
            // Aplica a rotação do utilizador e a automática
            galaxyPoints.rotation.y = rotation.y;
            galaxyPoints.rotation.x = rotation.x;

            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        }
        animate();
    }
});
```

