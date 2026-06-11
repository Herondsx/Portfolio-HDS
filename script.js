document.addEventListener('DOMContentLoaded', () => {
    const burger = document.getElementById('burger');
    const nav = document.getElementById('navLinks');
    const topBtn = document.getElementById('btnTop');
    const themeBtn = document.getElementById('themeToggle');
    const progress = document.getElementById('scrollProgress');
    const cursor = document.getElementById('cursorGlow');

    /* ---------- Menu mobile ---------- */
    burger?.addEventListener('click', () => {
        nav.classList.toggle('active');
        burger.classList.toggle('active');
    });

    /* ---------- Tema (dark por padrão) ---------- */
    if (themeBtn) {
        const stored = localStorage.getItem('theme');
        const current = stored
            || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
        applyTheme(current);

        themeBtn.addEventListener('click', () => {
            const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            applyTheme(next);
            localStorage.setItem('theme', next);
        });
    }
    function applyTheme(t) {
        document.documentElement.setAttribute('data-theme', t);
        if (themeBtn) themeBtn.innerHTML = t === 'dark'
            ? '<i class="fa-solid fa-sun"></i>'
            : '<i class="fa-solid fa-moon"></i>';
    }

    /* ---------- Scroll suave com offset do header ---------- */
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const id = a.getAttribute('href');
            if (id === '#') return;
            const target = document.querySelector(id);
            if (!target) return;
            e.preventDefault();
            window.scrollTo({ top: target.offsetTop - 64, behavior: 'smooth' });
            nav?.classList.remove('active');
            burger?.classList.remove('active');
        });
    });

    /* ---------- Barra de progresso + botão topo + nav ativa ---------- */
    const sections = [...document.querySelectorAll('main section[id]')];
    const navLinks = [...document.querySelectorAll('.nav-links a')];

    function onScroll() {
        const h = document.documentElement;
        const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
        if (progress) progress.style.width = (scrolled * 100) + '%';
        topBtn?.classList.toggle('visible', h.scrollTop > 500);

        const pos = h.scrollTop + 120;
        let currentId = sections[0]?.id;
        for (const sec of sections) if (sec.offsetTop <= pos) currentId = sec.id;
        navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + currentId));
    }
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---------- Cursor glow (apenas desktop) ---------- */
    if (cursor && matchMedia('(hover:hover) and (pointer:fine)').matches) {
        let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
        addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
        (function follow() {
            cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
            cursor.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`;
            requestAnimationFrame(follow);
        })();
    }

    /* ---------- Spotlight + tilt nos cards de serviço ---------- */
    document.querySelectorAll('.tilt').forEach(card => {
        card.addEventListener('pointermove', e => {
            const r = card.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width;
            const py = (e.clientY - r.top) / r.height;
            card.style.setProperty('--mx', (px * 100) + '%');
            card.style.setProperty('--my', (py * 100) + '%');
            card.style.transform = `translateY(-8px) rotateX(${(0.5 - py) * 6}deg) rotateY(${(px - 0.5) * 6}deg)`;
        });
        card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });

    /* ---------- Ripple nos botões ---------- */
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('pointerdown', ev => {
            const r = btn.getBoundingClientRect();
            const span = Object.assign(document.createElement('span'), {
                style: `position:absolute;left:${ev.clientX - r.left}px;top:${ev.clientY - r.top}px;
                width:0;height:0;border-radius:50%;background:rgba(255,255,255,.35);
                transform:translate(-50%,-50%);pointer-events:none;opacity:1;
                transition:width .5s,height .5s,opacity .6s`
            });
            btn.appendChild(span);
            requestAnimationFrame(() => {
                const s = Math.max(r.width, r.height) * 2;
                span.style.width = s + 'px'; span.style.height = s + 'px'; span.style.opacity = '0';
            });
            setTimeout(() => span.remove(), 650);
        }, { passive: true });
    });

    /* ---------- Efeito de digitação ---------- */
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
    typeOnce(document.getElementById('typeWelcome'), 'Desenvolvedor Full-Stack · Engenharia de Software');

    const headingObs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const h = entry.target, span = h.querySelector('span');
            typeOnce(span, h.getAttribute('data-text') || h.textContent.trim(), 22);
            h.classList.add('done');
            headingObs.unobserve(h);
        });
    }, { threshold: .35 });
    document.querySelectorAll('.section-title.typing').forEach(h => headingObs.observe(h));

    /* ---------- Reveal no scroll ---------- */
    const revealObs = new IntersectionObserver(entries => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                entry.target.style.transitionDelay = (i % 6) * 60 + 'ms';
                entry.target.classList.add('is-visible');
                revealObs.unobserve(entry.target);
            }
        });
    }, { threshold: .12 });
    document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

    /* ---------- Toggle "Ver mais" dos projetos ---------- */
    document.querySelectorAll('.toggle-details').forEach(btn => {
        btn.addEventListener('click', () => {
            const d = btn.nextElementSibling;
            d.classList.toggle('open');
            btn.textContent = d.classList.contains('open') ? 'Ver menos' : 'Ver mais';
        });
    });
});
