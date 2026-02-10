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
});
