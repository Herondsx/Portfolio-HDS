/* =========================================================================
   script.js · Interações da página
   Tema, navegação, reveal on scroll, contadores, cartão 3D do hero,
   expansão de cards estilo App Store, vitrine com controle segmentado,
   carrossel e efeitos ligados ao scroll. Sem dependências.
   ========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    const nav = document.getElementById('nav');
    const burger = document.getElementById('burger');
    const menu = document.getElementById('navMenu');
    const hero = document.getElementById('inicio');
    const pass = document.getElementById('pass');
    const topBtn = document.getElementById('btnTop');
    const themeBtn = document.getElementById('themeToggle');
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
    const SPRING = 'cubic-bezier(.22,1.12,.36,1)';      // abre com leve "overshoot", como no iOS
    const SPRING_OUT = 'cubic-bezier(.32,.72,0,1)';      // curva de fechamento do iOS

    // no iOS o :active só funciona se houver um listener de toque
    document.addEventListener('touchstart', () => {}, { passive: true });

    /* ---------- Tema (segue o sistema até o usuário escolher) ---------- */
    const updateChrome = () => {
        const bg = getComputedStyle(root).getPropertyValue('--bg').trim() || '#ffffff';
        themeMeta?.setAttribute('content', bg);
    };
    themeBtn?.addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try { localStorage.setItem('theme', next); } catch (e) { /* modo privado */ }
        updateChrome();
    });
    matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', e => {
        let stored = null;
        try { stored = localStorage.getItem('theme'); } catch (err) { /* sem storage */ }
        if (stored) return;
        root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        updateChrome();
    });
    updateChrome();

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
        nav.classList.toggle('scrolled', scrollY > 8);

        // o cartão do hero inclina para trás conforme a página sobe
        if (pass && !reduce) {
            const sy = Math.min(Math.max(scrollY / (hero.offsetHeight * 0.9), 0), 1);
            pass.style.setProperty('--sy', sy.toFixed(3));
        }

        depthEls.forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.bottom < -100 || r.top > vh + 100) return;
            const p = Math.min(Math.max((vh - r.top) / (vh * 0.55), 0), 1);
            el.style.setProperty('--p', p.toFixed(3));
        });

        topBtn?.classList.toggle('visible', scrollY > vh * 1.2);

        const mark = nav.offsetHeight + vh * 0.35;
        let current = '';
        for (const s of sections) if (s.getBoundingClientRect().top <= mark) current = s.id;
        navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + current));
    }
    const requestScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } };
    addEventListener('scroll', requestScroll, { passive: true });
    addEventListener('resize', requestScroll);
    onScroll();

    /* ---------- Cartão do hero: inclinação 3D sutil seguindo o mouse ---------- */
    if (pass && finePointer && !reduce) {
        const clamp = (v, m) => Math.max(-m, Math.min(m, v));
        hero.addEventListener('pointermove', e => {
            const r = pass.getBoundingClientRect();
            const dx = (e.clientX - (r.left + r.width / 2)) / (r.width * 1.5);
            const dy = (e.clientY - (r.top + r.height / 2)) / (r.height * 1.5);
            pass.style.setProperty('--ry', clamp(dx * 9, 8).toFixed(2) + 'deg');
            pass.style.setProperty('--rx', clamp(-dy * 8, 7).toFixed(2) + 'deg');
            pass.style.setProperty('--px', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
            pass.style.setProperty('--py', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
        });
        hero.addEventListener('pointerleave', () => {
            pass.style.setProperty('--rx', '0deg');
            pass.style.setProperty('--ry', '0deg');
        });
    }

    /* ---------- Reveal on scroll (com cascata) ---------- */
    document.querySelectorAll('[data-stagger]').forEach(group => {
        [...group.querySelectorAll(':scope > .reveal')].forEach((el, i) => el.style.setProperty('--i', i % 8));
    });
    const reveal = el => {
        if (!el.classList.contains('reveal') || el.classList.contains('is-visible')) return;
        el.classList.add('is-visible');
        // depois da entrada, devolve o elemento às próprias transições (hover, toque etc.)
        const delay = parseFloat(getComputedStyle(el).transitionDelay) * 1000 || 0;
        setTimeout(() => el.classList.remove('reveal', 'is-visible'), 1100 + delay);
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

    /* ---------- Gatilhos quando entra na tela ---------- */
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

    /* ---------- Expansão dos projetos estilo App Store ----------
       O dialog nasce exatamente sobre o card (translate + scale uniforme +
       clip-path com o raio do card) e cresce até a posição final com mola.
       Ao fechar, faz o caminho inverso. No celular dá para arrastar para baixo. */
    let opened = null; // { dlg, card }

    const radiusOf = el => parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
    function cardGeometry(card, dlg) {
        const from = card.getBoundingClientRect();
        const to = dlg.getBoundingClientRect();
        const s = from.width / to.width;
        return {
            transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${s})`,
            clip: `inset(0px 0px ${Math.max(to.height - from.height / s, 0)}px 0px round ${radiusOf(card) / s}px)`
        };
    }
    const fullClip = r => `inset(0px 0px 0px 0px round ${r}px)`;
    const animateBackdrop = (dlg, frames, opts) => {
        try { dlg.animate({ opacity: frames }, { ...opts, pseudoElement: '::backdrop' }); } catch (e) { /* sem suporte */ }
    };

    function openProject(card, dlg) {
        if (opened) return;
        const art = card.querySelector('.project-art');
        const slot = dlg.querySelector('[data-art]');
        slot.className = 'ex-art ' + [...art.classList].filter(c => c.startsWith('art-')).join(' ');
        slot.innerHTML = art.innerHTML;
        dlg.querySelector('.ex-scroll').scrollTop = 0;

        dlg.showModal();
        root.classList.add('modal-open');
        opened = { dlg, card };
        if (reduce) return;

        const g = cardGeometry(card, dlg);
        card.classList.add('is-expanded');
        dlg.animate(
            [{ transform: g.transform, clipPath: g.clip }, { transform: 'none', clipPath: fullClip(radiusOf(dlg)) }],
            { duration: 640, easing: SPRING }
        );
        dlg.querySelector('.ex-body').animate(
            [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }],
            { duration: 460, delay: 170, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }
        );
        dlg.querySelector('.ex-close').animate(
            [{ opacity: 0, transform: 'scale(.5)' }, { opacity: 1, transform: 'none' }],
            { duration: 380, delay: 320, easing: SPRING, fill: 'backwards' }
        );
        animateBackdrop(dlg, [0, 1], { duration: 420, easing: 'ease-out' });
    }

    function closeProject(dlg, dragged) {
        if (!opened || opened.dlg !== dlg || dlg.dataset.closing) return;
        const { card } = opened;
        const finish = () => {
            dlg.getAnimations?.({ subtree: true }).forEach(a => a.cancel());
            dlg.style.transform = '';
            dlg.style.borderRadius = '';
            delete dlg.dataset.closing;
            if (dlg.open) dlg.close();
            card.classList.remove('is-expanded');
            root.classList.remove('modal-open');
            opened = null;
        };
        if (reduce) { finish(); return; }

        dlg.dataset.closing = '1';
        const start = dragged || 'none';
        const startRadius = dragged ? 28 : radiusOf(dlg);
        dlg.style.transform = '';
        dlg.style.borderRadius = '';
        const g = cardGeometry(card, dlg);
        dlg.querySelector('.ex-body').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' });
        dlg.querySelector('.ex-close').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: 'forwards' });
        const anim = dlg.animate(
            [{ transform: start, clipPath: fullClip(startRadius) }, { transform: g.transform, clipPath: g.clip }],
            { duration: 520, easing: SPRING_OUT, fill: 'forwards' }
        );
        animateBackdrop(dlg, [1, 0], { duration: 420, easing: 'ease-out', fill: 'forwards' });
        anim.onfinish = finish;
        anim.oncancel = finish;
    }

    document.querySelectorAll('[data-open]').forEach(btn => {
        btn.addEventListener('click', () => {
            const dlg = document.getElementById(btn.dataset.open);
            if (!dlg || typeof dlg.showModal !== 'function') return;
            openProject(btn.closest('.project'), dlg);
        });
    });

    document.querySelectorAll('dialog.ex').forEach(dlg => {
        dlg.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => closeProject(dlg)));
        dlg.addEventListener('click', e => { if (e.target === dlg) closeProject(dlg); });
        dlg.addEventListener('cancel', e => { e.preventDefault(); closeProject(dlg); });

        // arrastar para baixo para fechar (gesto do iOS)
        const sc = dlg.querySelector('.ex-scroll');
        let y0 = null, dy = 0;
        sc.addEventListener('touchstart', e => {
            y0 = sc.scrollTop <= 0 ? e.touches[0].clientY : null;
            dy = 0;
        }, { passive: true });
        sc.addEventListener('touchmove', e => {
            if (y0 === null || dlg.dataset.closing) return;
            dy = e.touches[0].clientY - y0;
            if (dy <= 0) { dlg.style.transform = ''; dlg.style.borderRadius = ''; return; }
            e.preventDefault();
            const k = Math.min(dy / 1000, 0.16);
            dlg.style.transform = `translateY(${(dy * 0.5).toFixed(1)}px) scale(${(1 - k).toFixed(4)})`;
            dlg.style.borderRadius = '28px';
        }, { passive: false });
        sc.addEventListener('touchend', () => {
            if (y0 === null) return;
            y0 = null;
            const t = dlg.style.transform;
            if (dy > 110) { closeProject(dlg, t); return; }
            if (!t) return;
            dlg.style.transform = '';
            dlg.style.borderRadius = '';
            if (!reduce) dlg.animate([{ transform: t, borderRadius: '28px' }, { transform: 'none', borderRadius: radiusOf(dlg) + 'px' }], { duration: 420, easing: SPRING });
        });
    });

    /* ---------- Vitrine "Do código ao produto": controle segmentado ---------- */
    const studio = document.getElementById('studio');
    if (studio) {
        const seg = studio.querySelector('.segmented');
        const tabs = [...seg.querySelectorAll('[role="tab"]')];
        const scenes = tabs.map(t => document.getElementById(t.getAttribute('aria-controls')));
        let idx = 0;

        scenes.forEach((s, i) => {
            s.hidden = false;
            s.inert = i !== 0;
            s.setAttribute('aria-hidden', String(i !== 0));
        });
        const play = s => { s.classList.remove('play'); void s.offsetWidth; s.classList.add('play'); };

        function select(i, focus) {
            i = (i + tabs.length) % tabs.length;
            if (i === idx) return;
            idx = i;
            seg.style.setProperty('--seg', i);
            tabs.forEach((t, k) => {
                t.setAttribute('aria-selected', String(k === i));
                t.tabIndex = k === i ? 0 : -1;
            });
            scenes.forEach((s, k) => {
                const on = k === i;
                s.classList.toggle('is-active', on);
                s.inert = !on;
                s.setAttribute('aria-hidden', String(!on));
                if (on) play(s);
            });
            if (focus) tabs[i].focus();
        }
        tabs.forEach((t, k) => t.addEventListener('click', () => select(k)));
        seg.addEventListener('keydown', e => {
            if (e.key === 'ArrowRight') { e.preventDefault(); select(idx + 1, true); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); select(idx - 1, true); }
        });

        // deslizar com o dedo troca de aba
        const stage = document.getElementById('stage');
        let sx = null, sy = null;
        stage.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
        stage.addEventListener('touchend', e => {
            if (sx === null) return;
            const dx = e.changedTouches[0].clientX - sx;
            const dyy = e.changedTouches[0].clientY - sy;
            sx = null;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dyy) * 1.4) select(idx + (dx < 0 ? 1 : -1));
        }, { passive: true });

        // a primeira cena só anima quando aparece na tela
        if (!reduce) {
            scenes[0].classList.remove('play');
            once(stage, () => play(scenes[0]), 0.3);
        }
    }

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
});
