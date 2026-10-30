/* =========================================================================
   script.js · Interações da página
   Tema, navegação, reveal on scroll, contadores, tilt 3D, sheets de projeto,
   carrossel e efeitos ligados ao scroll. Sem dependências.
   ========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    const nav = document.getElementById('nav');
    const burger = document.getElementById('burger');
    const menu = document.getElementById('navMenu');
    const hero = document.getElementById('inicio');
    const darkZone = document.querySelector('.stats') || hero;
    const topBtn = document.getElementById('btnTop');
    const themeBtn = document.getElementById('themeToggle');
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

    /* ---------- Tema (segue o sistema até o usuário escolher) ---------- */
    let onDark = true;
    const updateChrome = () => {
        const bg = getComputedStyle(root).getPropertyValue('--bg').trim() || '#ffffff';
        if (themeMeta) themeMeta.setAttribute('content', onDark ? '#000000' : bg);
    };
    themeBtn?.addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try { localStorage.setItem('theme', next); } catch (e) { /* modo privado */ }
        updateChrome();
    });
    const systemDark = matchMedia('(prefers-color-scheme: dark)');
    systemDark.addEventListener?.('change', e => {
        let stored = null;
        try { stored = localStorage.getItem('theme'); } catch (err) { /* sem storage */ }
        if (stored) return;
        root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        updateChrome();
    });

    /* ---------- Menu mobile ---------- */
    const menuLinks = [...menu.querySelectorAll('a')];
    menuLinks.forEach((a, i) => a.style.setProperty('--i', i));
    const setMenu = open => {
        nav.classList.toggle('open', open);
        root.classList.toggle('menu-open', open);
        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    };
    burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
    menuLinks.forEach(a => a.addEventListener('click', () => setMenu(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
    matchMedia('(min-width: 981px)').addEventListener?.('change', e => { if (e.matches) setMenu(false); });

    /* ---------- Efeitos ligados ao scroll (um único rAF) ---------- */
    const sections = [...document.querySelectorAll('main section[id]')];
    const navLinks = [...document.querySelectorAll('.nav-menu ul a')];
    const depthEls = reduce ? [] : [...document.querySelectorAll('[data-depth]')];
    let ticking = false;

    function onScroll() {
        ticking = false;
        const vh = innerHeight;
        const navH = nav.offsetHeight;

        // nav escura enquanto estiver sobre o hero/destaques
        const nowDark = darkZone.getBoundingClientRect().bottom > navH;
        if (nowDark !== onDark) {
            onDark = nowDark;
            nav.classList.toggle('on-dark', onDark);
            updateChrome();
        }
        nav.classList.toggle('scrolled', scrollY > 8);

        // progresso do hero (texto sobe e some; a cena 3D lê o mesmo scroll)
        if (hero && !reduce) {
            const hp = Math.min(Math.max(scrollY / (hero.offsetHeight * 0.6), 0), 1);
            hero.style.setProperty('--hp', hp.toFixed(3));
        }

        // elementos que "assentam" em 3D ao entrar na tela
        depthEls.forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.bottom < -100 || r.top > vh + 100) return;
            const p = Math.min(Math.max((vh - r.top) / (vh * 0.55), 0), 1);
            el.style.setProperty('--p', p.toFixed(3));
        });

        topBtn?.classList.toggle('visible', scrollY > vh * 1.2);

        // link ativo
        const mark = navH + vh * 0.35;
        let current = '';
        for (const s of sections) if (s.getBoundingClientRect().top <= mark) current = s.id;
        navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + current));
    }
    const requestScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } };
    addEventListener('scroll', requestScroll, { passive: true });
    addEventListener('resize', requestScroll);
    onScroll();
    nav.classList.toggle('on-dark', onDark);
    updateChrome();

    /* ---------- Reveal on scroll (com cascata) ---------- */
    document.querySelectorAll('[data-stagger]').forEach(group => {
        [...group.querySelectorAll(':scope > .reveal')].forEach((el, i) => el.style.setProperty('--i', i % 8));
    });
    const settle = el => {
        // depois da entrada, devolve o elemento às próprias transições (hover etc.)
        const delay = parseFloat(getComputedStyle(el).transitionDelay) * 1000 || 0;
        setTimeout(() => el.classList.remove('reveal', 'is-visible'), 1100 + delay);
    };
    const reveal = el => {
        if (!el.classList.contains('reveal') || el.classList.contains('is-visible')) return;
        el.classList.add('is-visible');
        settle(el);
    };
    if ('IntersectionObserver' in window && !reduce) {
        const io = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                // no carrossel, revela o grupo inteiro de uma vez
                const group = el.parentElement?.closest('.rail');
                if (group) group.querySelectorAll(':scope > .reveal').forEach(c => { reveal(c); io.unobserve(c); });
                else { reveal(el); io.unobserve(el); }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
        document.querySelectorAll('.reveal').forEach(el => io.observe(el));
    } else {
        document.querySelectorAll('.reveal').forEach(el => el.classList.remove('reveal'));
    }

    /* ---------- Gatilhos quando entra na tela: contadores e linha do tempo ---------- */
    const once = (el, fn, threshold = 0.4) => {
        if (!el) return;
        if (!('IntersectionObserver' in window)) return fn();
        const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { fn(); io.disconnect(); } }, { threshold });
        io.observe(el);
    };

    document.querySelectorAll('[data-count]').forEach(el => {
        const to = parseInt(el.dataset.count, 10) || 0;
        if (reduce) return;
        el.textContent = '0';
        once(el, () => {
            const start = performance.now(), dur = 1300;
            (function tick(now) {
                const k = Math.min((now - start) / dur, 1);
                el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
                if (k < 1) requestAnimationFrame(tick);
            })(start);
        });
    });

    const tl = document.getElementById('eduTimeline');
    if (tl) {
        const start = new Date(tl.dataset.start).getTime();
        const end = new Date(tl.dataset.end).getTime();
        const progress = Math.min(Math.max((Date.now() - start) / (end - start), 0), 1);
        tl.style.setProperty('--progress', (progress * 100).toFixed(1) + '%');
        once(tl, () => tl.classList.add('on'), 0.6);
    }

    /* ---------- Tilt 3D nos cards (apenas mouse) ---------- */
    if (finePointer && !reduce) {
        document.querySelectorAll('.tilt').forEach(card => {
            card.addEventListener('pointerenter', () => { card.style.transition = 'transform .2s ease-out'; });
            card.addEventListener('pointermove', e => {
                const r = card.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width - 0.5;
                const py = (e.clientY - r.top) / r.height - 0.5;
                card.style.transform =
                    `perspective(1000px) rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg) translateY(-4px)`;
            });
            card.addEventListener('pointerleave', () => {
                card.style.transition = 'transform .9s cubic-bezier(.16,1,.3,1)';
                card.style.transform = '';
            });
        });
    }

    /* ---------- Sheets de detalhes dos projetos ---------- */
    document.querySelectorAll('[data-open]').forEach(btn => {
        btn.addEventListener('click', () => {
            const dlg = document.getElementById(btn.dataset.open);
            if (!dlg || typeof dlg.showModal !== 'function') return;
            dlg.showModal();
            root.classList.add('modal-open');
        });
    });
    document.querySelectorAll('dialog.sheet').forEach(dlg => {
        const close = () => {
            if (!dlg.open || dlg.classList.contains('closing')) return;
            if (reduce) { dlg.close(); return; }
            dlg.classList.add('closing');
            const done = () => { dlg.classList.remove('closing'); if (dlg.open) dlg.close(); };
            dlg.addEventListener('animationend', done, { once: true });
            setTimeout(done, 450); // garantia caso o evento não dispare
        };
        dlg.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
        dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
        dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });
        dlg.addEventListener('close', () => root.classList.remove('modal-open'));
    });

    /* ---------- Carrossel (setas) ---------- */
    document.querySelectorAll('.rail-nav').forEach(ctrl => {
        const rail = document.getElementById(ctrl.dataset.rail);
        if (!rail) return;
        const [prev, next] = ctrl.querySelectorAll('button');
        const step = () => (rail.firstElementChild?.getBoundingClientRect().width || 300) + 14;
        prev.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }));
        next.addEventListener('click', () => rail.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }));
        const update = () => {
            prev.disabled = rail.scrollLeft < 8;
            next.disabled = rail.scrollLeft + rail.clientWidth > rail.scrollWidth - 8;
        };
        rail.addEventListener('scroll', update, { passive: true });
        addEventListener('resize', update);
        update();
    });

    /* ---------- Diversos ---------- */
    const year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();

    // ilustrações SMIL (robô) param em movimento reduzido
    if (reduce) document.querySelectorAll('svg.robot').forEach(s => s.pauseAnimations?.());

    // se a cena WebGL não subir (CDN bloqueado, GPU sem suporte), mostra o chip em CSS 3D
    setTimeout(() => {
        if (!root.classList.contains('webgl-ready')) root.classList.add('no-webgl');
    }, 5000);
});
