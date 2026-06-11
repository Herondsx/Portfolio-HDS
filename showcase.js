/* =========================================================================
   showcase.js · "Demo ao vivo" da seção de Serviços
   Digita um trecho de código (com syntax highlight) e, ao terminar,
   "roda" o sistema na prévia ao lado. Cicla entre Web / Desktop / API.
   Pausa fora da tela e respeita prefers-reduced-motion. Sem dependências.
   ========================================================================= */
(() => {
  const codeEl = document.getElementById('scCode');
  const gutterEl = document.getElementById('scGutter');
  const prevEl = document.getElementById('scPreview');
  const tabsEl = document.getElementById('scTabs');
  const langEl = document.getElementById('scLang');
  const buildEl = document.getElementById('scBuild');
  const posEl = document.getElementById('scPos');
  const root = document.getElementById('showcase');
  if (!codeEl || !root) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----- Demos: cada linha é um array de [texto, classeDeToken] ----- */
  // k=keyword f=função s=string c=coment n=número t=tag a=atributo p=plain
  const demos = [
    {
      lang: 'React',
      lines: [
        [['function ', 'k'], ['Dashboard', 'f'], ['() {', 'p']],
        [['  const ', 'k'], ['[stats] = ', 'p'], ['useState', 'f'], ['(metrics);', 'p']],
        [['  return (', 'p']],
        [['    <', 't'], ['Grid', 't'], ['>', 't']],
        [['      {stats.', 'p'], ['map', 'f'], ['(kpi => (', 'p']],
        [['        <', 't'], ['Card ', 't'], ['title', 'a'], ['={kpi.name} ', 'p'], ['value', 'a'], ['={kpi.v} />', 'p']],
        [['      ))}', 'p']],
        [['    </', 't'], ['Grid', 't'], ['>', 't']],
        [['  );', 'p']],
        [['}', 'p']]
      ],
      preview: `
        <div class="pv pv-saas">
          <div class="pv-load"><span class="spin"></span><small>Compilando build…</small></div>
          <div class="pv-bar"><span class="pv-dot red"></span><span class="pv-dot yel"></span><span class="pv-dot grn"></span><span class="pv-url">app.heron.dev</span></div>
          <div class="saas">
            <aside class="saas-side">
              <div class="saas-logo">◆</div>
              <span class="si active"></span><span class="si"></span><span class="si"></span><span class="si"></span><span class="si"></span>
            </aside>
            <div class="saas-main">
              <div class="saas-top"><b>Visão geral</b><span class="saas-av"></span></div>
              <div class="kpis">
                <div class="kpi"><span>Usuários</span><b class="count" data-to="1280">0</b></div>
                <div class="kpi"><span>Receita</span><b class="count" data-to="94" data-prefix="R$ " data-suffix="k">0</b></div>
                <div class="kpi"><span>Uptime</span><b class="count" data-to="99" data-suffix="%">0</b></div>
              </div>
              <div class="saas-chart">
                <svg viewBox="0 0 300 90" preserveAspectRatio="none">
                  <defs><linearGradient id="scg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color="#7df0ff" stop-opacity=".35"/><stop offset="1" stop-color="#7df0ff" stop-opacity="0"/>
                  </linearGradient></defs>
                  <path class="area" d="M0,70 L43,55 L86,60 L129,38 L172,46 L215,26 L258,33 L300,12 L300,90 L0,90 Z" fill="url(#scg)"/>
                  <path class="line" d="M0,70 L43,55 L86,60 L129,38 L172,46 L215,26 L258,33 L300,12" fill="none" stroke="#7df0ff" stroke-width="2.5" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="saas-rows">
                <div class="srow" style="--d:1"><span class="sdot grn"></span>Deploy publicado <i>agora</i></div>
                <div class="srow" style="--d:2"><span class="sdot blu"></span>Novo usuário registrado <i>2 min</i></div>
                <div class="srow" style="--d:3"><span class="sdot yel"></span>Pico de tráfego detectado <i>5 min</i></div>
              </div>
            </div>
          </div>
        </div>`
    },
    {
      lang: 'C# · WPF',
      lines: [
        [['public void ', 'k'], ['LoadRecords', 'f'], ['() {', 'p']],
        [['    var items = ', 'p'], ['Repository', 't'], ['.', 'p'], ['GetAll', 'f'], ['();', 'p']],
        [['    foreach ', 'k'], ['(var x ', 'p'], ['in ', 'k'], ['items)', 'p']],
        [['        Grid.Rows.', 'p'], ['Add', 'f'], ['(x.Id, x.Category, x.Status);', 'p']],
        [['    Status = ', 'p'], ['"Pronto"', 's'], [';', 'p']],
        [['}', 'p']]
      ],
      preview: `
        <div class="pv pv-app">
          <div class="pv-load"><span class="spin"></span><small>Compilando build…</small></div>
          <div class="app-tb"><span class="app-name"><span class="app-ico">▦</span> Sistema Desktop</span><span class="app-win">— ▢ ✕</span></div>
          <div class="app-body">
            <aside class="app-side"><span class="ai active"></span><span class="ai"></span><span class="ai"></span><span class="ai"></span></aside>
            <div class="app-content">
              <div class="app-head"><b>Registros</b><span class="app-chip">128 itens</span><span class="app-chip ok"><i class="fa-solid fa-arrow-trend-up"></i> 12%</span><span class="app-search">Buscar…</span></div>
              <div class="ag">
                <div class="ag-h"><span>Item</span><span>Categoria</span><span>Status</span></div>
                <div class="ag-r" style="--d:1"><span class="cell"><i class="rb b1">F</i>#1042</span><span>Financeiro</span><span class="pill grn">aprovado</span></div>
                <div class="ag-r" style="--d:2"><span class="cell"><i class="rb b2">O</i>#1043</span><span>Operações</span><span class="pill yel">em análise</span></div>
                <div class="ag-r" style="--d:3"><span class="cell"><i class="rb b3">C</i>#1044</span><span>Comercial</span><span class="pill grn">aprovado</span></div>
                <div class="ag-r" style="--d:4"><span class="cell"><i class="rb b4">L</i>#1045</span><span>Logística</span><span class="pill red">pendente</span></div>
                <div class="ag-r" style="--d:5"><span class="cell"><i class="rb b1">F</i>#1046</span><span>Financeiro</span><span class="pill grn">aprovado</span></div>
              </div>
            </div>
          </div>
        </div>`
    },
    {
      lang: 'Node.js',
      lines: [
        [['app.', 'p'], ['get', 'f'], ['(', 'p'], ['"/api/usuarios"', 's'], [', ', 'p'], ['async', 'k'], [' (req, res) => {', 'p']],
        [['  const data = ', 'p'], ['await', 'k'], [' db.', 'p'], ['query', 'f'], ['(SQL);', 'p']],
        [['  res.', 'p'], ['json', 'f'], ['({ ', 'p'], ['ok', 'a'], [': ', 'p'], ['true', 'k'], [', ', 'p'], ['data', 'a'], [' });', 'p']],
        [['});', 'p']]
      ],
      preview: `
        <div class="pv pv-api">
          <div class="pv-load"><span class="spin"></span><small>Iniciando servidor…</small></div>
          <div class="pv-bar"><span class="pv-dot red"></span><span class="pv-dot yel"></span><span class="pv-dot grn"></span><span class="pv-url">api.heron.dev</span></div>
          <div class="api">
            <div class="api-top"><b>Monitor de Requisições</b><span class="live"><i></i>ao vivo</span></div>
            <div class="api-list">
              <div class="api-row" style="--d:1"><b class="mb get">GET</b><span class="ep">/api/usuarios</span><span class="lat"><i style="--w:26%"></i></span><span class="st2">200</span></div>
              <div class="api-row" style="--d:2"><b class="mb post">POST</b><span class="ep">/api/usuarios</span><span class="lat"><i style="--w:48%"></i></span><span class="st2">201</span></div>
              <div class="api-row" style="--d:3"><b class="mb get">GET</b><span class="ep">/api/pedidos</span><span class="lat"><i style="--w:18%"></i></span><span class="st2">200</span></div>
              <div class="api-row" style="--d:4"><b class="mb put">PUT</b><span class="ep">/api/pedidos/42</span><span class="lat"><i style="--w:62%"></i></span><span class="st2">200</span></div>
              <div class="api-row" style="--d:5"><b class="mb get">GET</b><span class="ep">/api/status</span><span class="lat"><i style="--w:10%"></i></span><span class="st2">200</span></div>
            </div>
            <div class="api-foot"><span><b class="count" data-to="128">0</b> req/min</span><span class="api-ok"><i class="fa-solid fa-circle-check"></i> 99.9% uptime</span></div>
          </div>
        </div>`
    }
  ];

  /* ----- Controle de timers (para cancelar ao trocar de aba) ----- */
  let timers = [];
  const wait = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

  let current = -1;

  const setActiveTab = i =>
    [...tabsEl.children].forEach((b, idx) => b.classList.toggle('active', idx === i));

  function buildGutter(n) {
    gutterEl.innerHTML = '';
    for (let i = 1; i <= n; i++) {
      const s = document.createElement('span');
      s.textContent = i;
      gutterEl.appendChild(s);
    }
  }

  function finish(pv) {
    buildEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> Build succeeded';
    buildEl.classList.add('ok');
    posEl.textContent = 'Pronto';
    if (pv) { pv.classList.add('run'); runCounts(pv); }
  }

  function runCounts(scope) {
    scope.querySelectorAll('.count').forEach(el => {
      const to = parseFloat(el.dataset.to) || 0;
      const pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
      const dur = 1100, start = performance.now();
      (function tick(now) {
        const k = Math.min((now - start) / dur, 1);
        const e = 1 - Math.pow(1 - k, 3);
        el.textContent = pre + Math.round(to * e) + suf;
        if (k < 1) requestAnimationFrame(tick);
      })(start);
    });
  }

  const next = () => show((current + 1) % demos.length);

  function show(i, opts = {}) {
    clearTimers();
    current = i;
    const demo = demos[i];
    setActiveTab(i);
    langEl.textContent = demo.lang;
    buildEl.innerHTML = '<i class="fa-regular fa-circle"></i> compilando…';
    buildEl.classList.remove('ok');
    buildGutter(demo.lines.length);
    codeEl.innerHTML = '';
    prevEl.innerHTML = demo.preview;
    const pv = prevEl.firstElementChild;

    const lineEls = demo.lines.map(() => {
      const d = document.createElement('span');
      d.className = 'cl';
      codeEl.appendChild(d);
      return d;
    });

    // Estado final imediato (reduced-motion ou troca rápida de aba)
    if (reduce || opts.instant) {
      demo.lines.forEach((line, li) => line.forEach(([t, c]) => {
        const s = document.createElement('span');
        s.className = 'tok-' + (c || 'p');
        s.textContent = t;
        lineEls[li].appendChild(s);
      }));
      finish(pv);
      if (!reduce) wait(next, 4200);
      return;
    }

    // Digitação caractere a caractere
    const caret = document.createElement('span');
    caret.className = 'caret';
    lineEls[0].appendChild(caret);
    const speed = opts.fast ? 2 : 6;
    let li = 0, ti = 0, ci = 0, span = null, spanCls = null;

    (function step() {
      if (li >= demo.lines.length) {
        caret.remove();
        finish(pv);
        wait(next, 4000);
        return;
      }
      const line = demo.lines[li];
      if (ti >= line.length) {           // fim da linha
        li++; ti = 0; ci = 0; span = null; spanCls = null;
        if (li < lineEls.length) lineEls[li].appendChild(caret);
        posEl.textContent = 'Ln ' + Math.min(li + 1, demo.lines.length) + ', Col 1';
        wait(step, speed * 3);
        return;
      }
      const [text, cls] = line[ti];
      if (span === null || spanCls !== cls) {
        span = document.createElement('span');
        span.className = 'tok-' + (cls || 'p');
        lineEls[li].insertBefore(span, caret);
        spanCls = cls;
      }
      span.textContent += text[ci];
      lineEls[li].appendChild(caret);    // mantém o caret ao fim da linha
      ci++;
      if (ci >= text.length) { ti++; ci = 0; span = null; spanCls = null; }
      posEl.textContent = 'Ln ' + (li + 1) + ', Col ' + (lineEls[li].textContent.length + 1);
      wait(step, speed);
    })();
  }

  // Troca manual pelas abas
  [...tabsEl.children].forEach((b, idx) =>
    b.addEventListener('click', () => show(idx, { fast: true })));

  // Inicia quando entra na tela
  let started = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (e.isIntersecting && !started) { started = true; show(0); }
        else if (!e.isIntersecting && started && !reduce) clearTimers(); // pausa ao sair
        else if (e.isIntersecting && started && !reduce) show(current < 0 ? 0 : current);
      });
    }, { threshold: 0.25 }).observe(root);
  } else {
    show(0);
  }
})();
