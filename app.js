'use strict';
// Gopher Dulce · juego de combinar dulces para repasar encapsulación y manejo de errores en Go (semanas 9 y 10 de POO).
// Se juntan 3 o más dulces iguales en línea. Cuando el dulce con «?» entra en una combinación, sale una pregunta.
// Nivel 1: semana 9 (encapsulación, getters y setters, embebido) · Nivel 2: semana 10 (error como valor, defer, panic y recover).
// Las respuestas no están en la página: se guarda su huella SHA-256 y la explicación va cifrada (datos.js).

const J = window.JUEGO;
const CLAVE = 'gopher-dulce-v1';
const N = 7, TIPOS = 5, POR_NIVEL = 6;
const Q = Object.fromEntries(J.preguntas.map(q => [q.id, q]));
const TOTAL = J.preguntas.length;
const NIVEL = Object.fromEntries(J.niveles.map(n => [n.n, n]));
let E = null, G = null, ocupado = false, respondiendo = false, sel = null, idUnico = 0, reloj = null, filaPregunta = 0;

/* ---------------- estado guardado ---------------- */
// cola: preguntas que faltan en el nivel (la primera es la del dulce «?») · hechas: respondidas bien · primer: acierto al primer intento
// vistas: temas cuya mini lección ya se mostró
const nuevo = (nombre = '', apellido = '') => ({ nombre, apellido, nivel: 1, cola: [...J.orden[1]], hechas: [], primer: {}, vistas: [], puntos: 0, movs: 0, completo: false });
function cargar() {
  try { return { ...nuevo(), ...JSON.parse(localStorage.getItem(CLAVE)) }; } catch { return nuevo(); }
}
const guardar = () => localStorage.setItem(CLAVE, JSON.stringify(E));
const aciertosPrimer = () => J.preguntas.filter(q => E.primer[q.id] === true).length;
const hechasNivel = () => E.hechas.filter(id => Q[id].nivel === E.nivel).length;

/* ---------------- utilidades ---------------- */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const espera = ms => new Promise(ok => setTimeout(ok, ms));
const KW = /^(type|struct|interface|func|var|return|package|import|for|range|if|else|switch|case|default|map|nil|true|false|defer)$/;
const TIPO = /^(string|int|bool|float64|error|any)$/;
function resaltar(src) {
  return src.replace(/(\/\/[^\n]*)|("(?:[^"\\]|\\.)*")|([A-Za-z_]\w*)|(\d+(?:\.\d+)?)|([\s\S])/g, (m, c, s, w, num) => {
    if (c) return `<span class="c">${esc(c)}</span>`;
    if (s) return `<span class="s">${esc(s)}</span>`;
    if (w) return KW.test(w) ? `<span class="k">${w}</span>` : TIPO.test(w) ? `<span class="t">${w}</span>` : w;
    if (num) return `<span class="n">${num}</span>`;
    return esc(m);
  });
}
const PARTICULAS = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e']);
function nombreBonito(s) {
  return s.trim().replace(/\s+/g, ' ').toLowerCase().split(' ')
    .map((p, i) => i > 0 && PARTICULAS.has(p) ? p : p.replace(/(^|['-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()))
    .join(' ');
}
const abrirCon = async (dato, ...partes) => Cifra.abrir(await Cifra.llave(...partes), dato);
function confeti() {
  const c = document.createElement('div'); c.className = 'confeti';
  const colores = ['#EAAA00', '#FFFFFF', '#d81b7a', '#2f6fe0', '#22a85f', '#f07d1a'];
  c.innerHTML = Array.from({ length: 70 }, () => `<i style="left:${Math.random() * 100}%;background:${colores[Math.floor(Math.random() * colores.length)]};animation-duration:${2 + Math.random() * 2.5}s;animation-delay:${Math.random() * .8}s"></i>`).join('');
  document.body.appendChild(c);
  setTimeout(() => c.remove(), 5000);
}

/* ---------------- los dulces (dibujos propios: caramelo, gota, corazón, estrella y rosquilla) ---------------- */
const DULCE = [
  '<path d="M6 32 28 50 6 68ZM94 32 72 50 94 68Z" fill="#8fbaff" stroke="#1d4fb0" stroke-width="3" stroke-linejoin="round"/><ellipse cx="50" cy="50" rx="27" ry="23" fill="#2f6fe0" stroke="#1d4fb0" stroke-width="3"/><path d="M36 42c6-8 14-10 22-9" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".75"/>',
  '<path d="M50 10C62 30 78 44 78 62a28 28 0 0 1-56 0c0-18 16-32 28-52z" fill="#f5b800" stroke="#a87800" stroke-width="3"/><path d="M36 60c0-9 5-17 10-22" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>',
  '<path d="M50 84C20 64 10 46 20 31c9-13 24-11 30 2 6-13 21-15 30-2 10 15 0 33-30 53z" fill="#d81b7a" stroke="#8e0f4f" stroke-width="3" stroke-linejoin="round"/><path d="M28 37c3-6 9-8 14-5" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>',
  '<path d="M50 12 60.6 37.4 88 39.6 67.1 57.6 73.5 84.4 50 70 26.5 84.4 32.9 57.6 12 39.6 39.4 37.4Z" fill="#22a85f" stroke="#127040" stroke-width="4" stroke-linejoin="round"/><path d="M44 42l4-9" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>',
  '<path fill-rule="evenodd" d="M50 16a34 34 0 1 1 0 68a34 34 0 1 1 0-68zM50 39a11 11 0 1 0 0 22a11 11 0 1 0 0-22z" fill="#f07d1a" stroke="#a84f06" stroke-width="3"/><g stroke-width="4" stroke-linecap="round"><path d="M30 37l5-3" stroke="#fff"/><path d="M64 27l4 4" stroke="#6AD7E5"/><path d="M71 61l-4 4" stroke="#fff"/><path d="M32 63l5 2" stroke="#EAAA00"/></g>',
];
const NOMBRE_DULCE = ['caramelo azul', 'gota dorada', 'corazón', 'estrella', 'rosquilla'];
const svgDulce = t => `<svg viewBox="0 0 100 100" aria-hidden="true">${DULCE[t]}</svg>`;
const MARCA = '<svg class="gd-marca" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="#fff" stroke="#EAAA00" stroke-width="4"/><text x="20" y="29" text-anchor="middle" font-size="26" font-weight="800" font-family="Poppins, Arial, sans-serif" fill="#002C71">?</text></svg>';

/* ---------------- pantalla y diálogo ---------------- */
function pintar(html, clase = '') {
  clearTimeout(reloj);
  const quien = E && E.nombre ? `<div class="jugador"><b>${esc(E.nombre)} ${esc(E.apellido)}</b>${E.completo ? 'Juego completo' : `Nivel ${E.nivel} · ${E.hechas.length} de ${TOTAL} preguntas`}</div>` : '';
  document.body.innerHTML = `<header class="top"><div class="logo">${gopherSvg({ ojos: 'feliz', boca: 'abierta' })}<span>Gopher <b>Dulce</b></span></div><div class="der">${quien}</div></header>
    <main id="app" class="${clase}">${html}</main>
    <dialog id="dlg" aria-labelledby="dlg-titulo"><div class="dlg-cuerpo" id="dlgc"></div><div class="dlg-pie" id="dlgpie"></div></dialog>`;
  $('#dlg').addEventListener('cancel', e => e.preventDefault());   // se cierra con sus botones: el juego espera la respuesta
  window.scrollTo({ top: 0 });
}
function abrirDlg(html, pie) {
  $('#dlgc').innerHTML = html;
  $('#dlgpie').innerHTML = pie;
  const d = $('#dlg');
  if (!d.open) d.showModal();
  $('#dlgc').scrollTop = 0;
}
const cerrarDlg = () => { const d = $('#dlg'); if (d && d.open) d.close(); };

/* ---------------- inicio ---------------- */
function inicio() {
  const chips = J.niveles.map(nv => `<span class="chip oscuro">Nivel ${nv.n} · ${esc(nv.titulo)}</span>`).join('');
  const registro = E.nombre
    ? `<h2>Hola de nuevo, ${esc(E.nombre)}</h2><p class="suave">${E.completo ? 'Ya completaste los dos niveles.' : `Vas en el nivel ${E.nivel}, con ${E.hechas.length} de ${TOTAL} preguntas respondidas.`}</p>
       <div class="fila-btn"><button class="btn grande" id="seguir">${E.completo ? `${ICONO.trofeo} Ver mi certificado` : `Seguir jugando ${ICONO.sig}`}</button></div>
       <div class="fila-btn"><button class="btn sec" id="otro">Soy otra persona / empezar de nuevo</button></div>`
    : `<h2>Registro</h2><p class="suave">Escribe tu nombre y tu apellido: aparecerán en tu certificado.</p>
       <label for="nom">Nombre</label><input type="text" id="nom" autocomplete="given-name" maxlength="30">
       <label for="ape">Apellido</label><input type="text" id="ape" autocomplete="family-name" maxlength="30">
       <p class="aviso" id="aviso"></p>
       <button class="btn grande" id="empezar">Empezar ${ICONO.sig}</button>`;
  pintar(`<section class="portada">${gopherSvg({ ojos: 'arriba', boca: 'abierta', cejas: 'decidido' })}
      <h1>Gopher <b>Dulce</b></h1>
      <p>Encapsulación y manejo de errores en Go · repaso de las semanas 9 y 10</p>
      <div class="gd-fila-dulces" aria-hidden="true">${[0, 1, 2, 3, 4].map(svgDulce).join('')}</div>
      <div class="chips-niveles">${chips}</div></section>
    <div class="card">${registro}</div>
    <div class="card"><h2>${ICONO.ayuda} Cómo se juega</h2>
      <p>Toca un dulce y luego uno de al lado para cambiarlos de lugar (en el celular también puedes deslizarlo). Si quedan <b>3 o más dulces iguales</b> en fila o en columna, desaparecen y caen otros.</p>
      <p>Un dulce lleva el signo <b>?</b>. Cuando entra en una combinación, sale una <b>pregunta</b>. Cada tema empieza con una <b>mini lección</b>; luego viene una pregunta de <b>teoría</b> y un reto de <b>práctica</b>: completas un programa y <b>Go lo ejecuta de verdad</b> en la consola.</p>
      <p>Si aciertas, ganas puntos y explota una fila entera. Si fallas, verás una pista (y, en la práctica, lo que Go responde con tu código) y esa pregunta volverá más tarde.</p>
      <p>Hay <b>2 niveles</b> de ${POR_NIVEL} preguntas: el nivel 1 es la semana 9 y el nivel 2 la semana 10. Al terminar recibes tu <b>certificado</b>. Si no encuentras la jugada, usa el botón <b>Pista</b>. Tu progreso se guarda en este dispositivo.</p></div>`);
  if (E.nombre) {
    $('#seguir').onclick = E.completo ? certificado : juego;
    $('#otro').onclick = () => { if (confirm('Se borrará el progreso guardado en este dispositivo. ¿Continuar?')) { E = nuevo(); G = null; guardar(); inicio(); } };
    return;
  }
  const valido = s => /^[\p{L}][\p{L}' -]{1,29}$/u.test(s.trim());
  const empezar = () => {
    const n = $('#nom').value, a = $('#ape').value;
    if (!valido(n) || !valido(a)) { $('#aviso').textContent = 'Escribe tu nombre y tu apellido (solo letras).'; return; }
    E = nuevo(nombreBonito(n), nombreBonito(a));
    G = null;
    guardar();
    juego();
  };
  $('#empezar').onclick = empezar;
  ['#nom', '#ape'].forEach(s => $(s).addEventListener('keydown', e => { if (e.key === 'Enter') empezar(); }));
}

/* ---------------- el tablero: lógica ---------------- */
const k = (r, c) => r * N + c;
const tipoAzar = () => Math.floor(Math.random() * TIPOS);
const nuevoDulce = (t = tipoAzar()) => ({ id: ++idUnico, t, q: false });
function cambiar(a, b) { [G[a[0]][a[1]], G[b[0]][b[1]]] = [G[b[0]][b[1]], G[a[0]][a[1]]]; }
// casillas que forman 3 o más iguales en fila o en columna
function buscar() {
  const m = new Set();
  for (let r = 0; r < N; r++) for (let c = 0; c < N;) {
    let f = c; while (f + 1 < N && G[r][f + 1] && G[r][c] && G[r][f + 1].t === G[r][c].t) f++;
    if (G[r][c] && f - c >= 2) for (let x = c; x <= f; x++) m.add(k(r, x));
    c = f + 1;
  }
  for (let c = 0; c < N; c++) for (let r = 0; r < N;) {
    let f = r; while (f + 1 < N && G[f + 1][c] && G[r][c] && G[f + 1][c].t === G[r][c].t) f++;
    if (G[r][c] && f - r >= 2) for (let x = r; x <= f; x++) m.add(k(x, c));
    r = f + 1;
  }
  return m;
}
// todas las jugadas que combinan: a y b vecinos, y m las casillas que se juntarían
function jugadas() {
  const res = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) for (const [dr, dc] of [[0, 1], [1, 0]]) {
    const r2 = r + dr, c2 = c + dc;
    if (r2 >= N || c2 >= N || G[r][c].t === G[r2][c2].t) continue;
    cambiar([r, c], [r2, c2]); const m = buscar(); cambiar([r, c], [r2, c2]);
    if (m.size) res.push({ a: [r, c], b: [r2, c2], m });
  }
  return res;
}
// dulces que entran en una combinación con una sola jugada (con la jugada que lo logra)
function candidatas() {
  const out = [];
  for (const j of jugadas()) {
    if (j.m.has(k(...j.a))) out.push({ d: G[j.b[0]][j.b[1]], j });
    if (j.m.has(k(...j.b))) out.push({ d: G[j.a[0]][j.a[1]], j });
  }
  return out;
}
const dulceQ = () => G.flat().find(d => d && d.q) || null;
function jugadaQ() { const d = dulceQ(); const x = d && candidatas().find(o => o.d === d); return x ? x.j : null; }
function generar() {
  do {
    G = Array.from({ length: N }, () => Array(N).fill(null));
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      let t;
      do { t = tipoAzar(); } while ((c >= 2 && G[r][c - 1].t === t && G[r][c - 2].t === t) || (r >= 2 && G[r - 1][c].t === t && G[r - 2][c].t === t));
      G[r][c] = nuevoDulce(t);
    }
  } while (!jugadas().length);
  G.forEach((fila, r) => fila.forEach(d => { d.desde = r - N; }));   // al empezar, todo cae desde arriba
}
function barajar() {
  const ts = G.flat().map(d => d.t);
  do {
    for (let i = ts.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ts[i], ts[j]] = [ts[j], ts[i]]; }
    G.flat().forEach((d, i) => { d.t = ts[i]; });
  } while (buscar().size || !jugadas().length);
  aviso('¡A barajar!');
}
// la pregunta pendiente va en un dulce que se pueda combinar con una jugada
function ponerPregunta() {
  const viejo = dulceQ(); if (viejo) viejo.q = false;
  const cs = candidatas();
  if (cs.length) cs[Math.floor(Math.random() * cs.length)].d.q = true;
}
function asegurar() {
  if (!jugadas().length) barajar();
  if (E.cola.length && !jugadaQ()) ponerPregunta();
  pintarTablero();
}
function caer() {
  for (let c = 0; c < N; c++) {
    let w = N - 1;
    for (let r = N - 1; r >= 0; r--) if (G[r][c]) { const d = G[r][c]; G[r][c] = null; G[w][c] = d; w--; }
    const nuevos = w + 1;
    for (let r = w; r >= 0; r--) { const d = nuevoDulce(); d.desde = r - nuevos; G[r][c] = d; }
  }
}

/* ---------------- el tablero: dibujo ---------------- */
const pct = x => `${x * 100 / N}%`;
const elDe = d => $(`#gd-tablero [data-id="${d.id}"]`);
function pintarTablero() {
  const t = $('#gd-tablero'); if (!t) return;
  const vivos = new Set();
  G.forEach((fila, r) => fila.forEach((d, c) => {
    vivos.add(String(d.id));
    let el = elDe(d);
    if (!el) {
      el = document.createElement('button');
      el.type = 'button'; el.className = 'gd-dulce'; el.dataset.id = d.id; el.style.left = pct(c);
      if (d.desde !== undefined) {               // entra desde arriba del tablero
        el.style.transition = 'none'; el.style.top = pct(d.desde);
        t.appendChild(el); void el.offsetWidth; el.style.transition = '';
        delete d.desde;
      } else t.appendChild(el);
    }
    if (el.dataset.t !== String(d.t)) { el.dataset.t = d.t; el.innerHTML = svgDulce(d.t) + MARCA; }
    el.classList.toggle('gd-q', d.q);
    el.dataset.r = r; el.dataset.c = c;
    el.style.top = pct(r); el.style.left = pct(c);
    el.setAttribute('aria-label', `${d.q ? 'Dulce con pregunta, ' : ''}${NOMBRE_DULCE[d.t]}, fila ${r + 1}, columna ${c + 1}`);
  }));
  t.querySelectorAll('.gd-dulce').forEach(el => { if (!vivos.has(el.dataset.id)) el.remove(); });
  if (sel) marcarSel(sel);
}
function aviso(txt) {
  const a = $('#gd-aviso'); if (!a) return;
  a.textContent = txt; a.classList.remove('gd-ve'); void a.offsetWidth; a.classList.add('gd-ve');
}
function marcarSel(p) {
  sel = p;
  $$('.gd-dulce.gd-sel').forEach(x => x.classList.remove('gd-sel'));
  if (p) { const el = elDe(G[p[0]][p[1]]); if (el) el.classList.add('gd-sel'); }
}
function quitarPista() { $$('.gd-pista').forEach(x => x.classList.remove('gd-pista')); }
function mostrarPista() {
  if (ocupado || !G || !$('#gd-tablero')) return;
  const j = jugadaQ() || jugadas()[0];
  if (j) [j.a, j.b].forEach(([r, c]) => { const el = elDe(G[r][c]); if (el) el.classList.add('gd-pista'); });
}
function esperarPista() { clearTimeout(reloj); quitarPista(); reloj = setTimeout(mostrarPista, 8000); }

/* ---------------- jugar: cambiar dos dulces, combinar y caer ---------------- */
async function cascada(m) {
  let combo = 0, pregunta = null;
  while (m.size) {
    combo++;
    m.forEach(key => {
      const r = Math.floor(key / N), d = G[r][key % N];
      if (d.q && E.cola.length) { pregunta = E.cola[0]; filaPregunta = r; }
      const el = elDe(d); if (el) el.classList.add('gd-pop');
    });
    E.puntos += m.size * 10 * combo;
    if (combo > 1) aviso(`¡Combo x${combo}!`);
    await espera(280);
    m.forEach(key => { G[Math.floor(key / N)][key % N] = null; });
    caer(); pintarTablero(); hud();
    await espera(330);
    m = buscar();
  }
  return pregunta;
}
async function intercambiar(a, b) {
  if (ocupado) return;
  ocupado = true; marcarSel(null); quitarPista(); clearTimeout(reloj);
  cambiar(a, b); pintarTablero();
  await espera(240);
  const m = buscar();
  if (!m.size) {                               // no combina: vuelven a su lugar
    cambiar(a, b); pintarTablero();
    await espera(240);
    ocupado = false; esperarPista();
    return;
  }
  E.movs++;
  const pid = await cascada(m);
  guardar(); hud();
  if (pid) { reto(pid); return; }              // ocupado sigue en true hasta cerrar la pregunta
  asegurar(); ocupado = false; esperarPista();
}
function tocar(p) {
  esperarPista();
  if (!sel) { marcarSel(p); return; }
  const [r, c] = sel;
  if (r === p[0] && c === p[1]) { marcarSel(null); return; }
  if (Math.abs(r - p[0]) + Math.abs(c - p[1]) === 1) intercambiar(sel, p); else marcarSel(p);
}
function conectarTablero() {
  const t = $('#gd-tablero');
  let ini = null, deslizo = false;
  t.addEventListener('pointerdown', e => {
    const el = e.target.closest('.gd-dulce'); deslizo = false;
    if (!el || ocupado) return;
    ini = { r: +el.dataset.r, c: +el.dataset.c, x: e.clientX, y: e.clientY };
  });
  t.addEventListener('pointermove', e => {
    if (!ini || ocupado) return;
    const dx = e.clientX - ini.x, dy = e.clientY - ini.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < t.clientWidth / N * .35) return;
    const [dr, dc] = Math.abs(dx) > Math.abs(dy) ? [0, Math.sign(dx)] : [Math.sign(dy), 0];
    const a = [ini.r, ini.c], b = [ini.r + dr, ini.c + dc];
    ini = null; deslizo = true; setTimeout(() => { deslizo = false; }, 400);
    if (b[0] >= 0 && b[0] < N && b[1] >= 0 && b[1] < N) intercambiar(a, b);
  });
  ['pointerup', 'pointercancel'].forEach(ev => t.addEventListener(ev, () => { ini = null; }));
  t.addEventListener('click', e => {             // tocar o pulsar Enter sobre un dulce
    const el = e.target.closest('.gd-dulce');
    if (!el || deslizo || ocupado) return;
    tocar([+el.dataset.r, +el.dataset.c]);
  });
}

/* ---------------- pantalla del juego ---------------- */
function juego() {
  if (E.completo) { informe(); return; }
  const nv = NIVEL[E.nivel];
  pintar(`<div class="gd-juego">
      <div class="gd-zona"><div class="gd-tablero gd-n${nv.n}" id="gd-tablero" aria-label="Tablero de dulces de ${N} por ${N}"></div>
        <div class="gd-aviso" id="gd-aviso" aria-live="polite"></div></div>
      <aside class="card gd-lado">
        <div class="gd-mascota">${gopherSvg({ ojos: 'arriba', boca: 'abierta' })}<p>Busca el dulce con <b>?</b> y júntalo con otros 2 iguales.</p></div>
        <h2>Nivel ${nv.n} · Semana ${nv.semana}</h2>
        <p class="gd-subt">${esc(nv.titulo)}</p>
        <div class="gd-dato"><span>Preguntas</span><b id="gd-preg"></b></div>
        <div class="gd-barra"><i id="gd-barra"></i></div>
        <div class="gd-temas" id="gd-temas"></div>
        <div class="gd-cifras"><div><b id="gd-puntos"></b><span>puntos</span></div><div><b id="gd-movs"></b><span>jugadas</span></div></div>
        <div class="fila-btn"><button class="btn sec" id="gd-pistab">${ICONO.lupa} Pista</button><button class="btn sec" id="ini">Inicio</button></div>
      </aside></div>`, 'pantalla-dulce');
  ocupado = false; sel = null;
  if (!G) generar();
  asegurar();
  conectarTablero();
  hud();
  $('#gd-pistab').onclick = () => { esperarPista(); mostrarPista(); };
  $('#ini').onclick = inicio;
  esperarPista();
}
function hud() {
  if (!$('#gd-preg')) return;
  const h = hechasNivel();
  $('#gd-preg').textContent = `${h} de ${POR_NIVEL}`;
  $('#gd-barra').style.width = `${Math.round(h / POR_NIVEL * 100)}%`;
  $('#gd-puntos').textContent = E.puntos;
  $('#gd-movs').textContent = E.movs;
  $('#gd-temas').innerHTML = NIVEL[E.nivel].temas.map(t => {
    const qs = J.preguntas.filter(q => q.tema === t), listas = qs.filter(q => E.hechas.includes(q.id)).length;
    return `<span class="gd-tema${listas === qs.length ? ' gd-listo' : ''}">${listas === qs.length ? ICONO.bien : ''}${esc(t)} <small>${listas}/${qs.length}</small></span>`;
  }).join('');
  const j = $('.jugador'); if (j) j.lastChild.textContent = `Nivel ${E.nivel} · ${E.hechas.length} de ${TOTAL} preguntas`;
}

/* ---------------- mini lección, pregunta de teoría y reto de práctica ---------------- */
// la primera vez que sale un tema, antes de su pregunta se muestra la mini lección (la misma idea de la presentación)
function reto(id) {
  const q = Q[id];
  if (E.vistas.includes(q.tema)) { pregunta(id); return; }
  const L = J.lecciones[q.tema];
  abrirDlg(`<span class="chip">${ICONO.estrella} Aprende · ${esc(q.tema)}</span>
      <h3 class="pregunta" id="dlg-titulo">${esc(q.tema)}</h3>
      <div class="gd-leccion"><p>${L.idea}</p><pre class="go" translate="no">${resaltar(L.codigo)}</pre>
      <p class="gd-real"><b>En el mundo real:</b> ${L.real}</p></div>`,
    `<button class="btn grande" id="aprendi">¡Entendido! Ir a la pregunta ${ICONO.sig}</button>`);
  $('#aprendi').onclick = () => { E.vistas.push(q.tema); guardar(); pregunta(id); };
  $('#aprendi').focus();
}
const HUECO = '____';
const codigoDe = op => op === '(nada)' ? '' : op;
function pregunta(id) {
  const q = Q[id], practica = q.tipo === 'practica';
  const codigo = practica ? `<pre class="go" id="gd-codigo" translate="no">${resaltar(q.codigo).replace(HUECO, '<span class="gd-hueco" id="gd-hueco">____</span>')}</pre>` : '';
  const meta = practica ? `<p class="gd-meta"><b>Meta:</b> el programa debe imprimir</p><pre class="gd-salida-meta">${esc(q.meta)}</pre>` : '';
  abrirDlg(`<span class="chip${practica ? ' gd-chip-practica' : ''}">${practica ? 'Práctica' : 'Teoría'} · ${esc(q.tema)}</span> <span class="gd-cuantas">Nivel ${E.nivel} · pregunta ${hechasNivel() + 1} de ${POR_NIVEL}</span>
      <h3 class="pregunta" id="dlg-titulo">${q.enunciado}</h3>${codigo}${meta}
      ${practica ? '<p class="gd-meta"><b>Elige lo que va en el espacio:</b></p>' : ''}
      <div class="opciones">${q.opciones.map((o, i) => `<button class="op${practica ? ' cod' : ''}"${practica ? ' translate="no"' : ''} data-i="${i}">${esc(o)}</button>`).join('')}</div>
      <div id="retro"></div>`, '');
  $$('#dlg .op').forEach(b => { b.onclick = () => responder(q, b); });
  $$('#dlg .op')[0].focus();
}

/* ---------------- consola: el programa se ejecuta de verdad en el Go Playground (Go 1.27) ---------------- */
async function ejecutarGo(fuente) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 12000);
  try {
    const r = await fetch('https://play.golang.org/compile', { method: 'POST', signal: ctl.signal,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ version: '2', body: fuente, withVet: 'false' }).toString() });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    if (j.Errors) return { compila: false, texto: j.Errors.trim().replace(/\t/g, '    ') };
    // la ruta del servidor (/tmp/sandbox123/src/prog.go) se acorta a prog.go
    const texto = (j.Events || []).map(ev => ev.Message).join('').replace(/\n$/, '').replace(/\/tmp\/sandbox\d+\/src\//g, '').replace(/\t/g, '    ');
    return { compila: true, texto, codigoSalida: j.Status };
  } catch { return null; } finally { clearTimeout(t); }
}
async function consola(fuente, guardada) {
  const z = $('#gd-consola'); if (!z) return;
  z.innerHTML = `<div class="terminal"><div class="term-cab">${ICONO.terminal}<span>$ go run .</span></div><pre id="gd-sal">Compilando y ejecutando con Go…</pre></div>`;
  z.previousElementSibling.scrollIntoView({ block: 'start', behavior: 'smooth' });   // que se vea la consola sin bajar
  const r = await ejecutarGo(fuente), sal = $('#gd-sal');
  if (!sal) return;
  if (!r) {
    sal.textContent = guardada !== undefined ? `${guardada}\n\n(sin conexión: salida que dio Go 1.27 al preparar el juego)` : 'Sin conexión: no se pudo ejecutar con Go.';
    return;
  }
  const pie = r.compila ? `\n\nTerminó con código de salida ${r.codigoSalida} · Go 1.27 en go.dev` : '\n\nNo compila: Go muestra el error y no ejecuta el programa.';
  sal.parentNode.classList.toggle('mal', !r.compila || r.codigoSalida !== 0);
  const lineas = r.texto.split('\n');
  sal.textContent = '';
  for (const l of lineas) { sal.textContent += (sal.textContent ? '\n' : '') + l; await espera(110); }   // como una terminal
  sal.textContent += pie;
}
async function responder(q, boton) {
  if (respondiendo) return;
  respondiendo = true;
  const texto = q.opciones[+boton.dataset.i];
  const bien = (await Cifra.huella(J.sal, q.id, texto)) === q.h;
  if (!(q.id in E.primer)) E.primer[q.id] = bien;
  $$('#dlg .op').forEach(b => { b.disabled = true; });
  const practica = q.tipo === 'practica';
  if (practica) {                              // la pieza elegida entra en el espacio del código
    const h = $('#gd-hueco'); h.textContent = codigoDe(texto) || '(nada)'; h.classList.add(bien ? 'gd-ok' : 'gd-no');
  }
  // en la práctica, la consola ejecuta con Go el programa con la pieza elegida (bien o mal)
  const zonaConsola = practica ? `<p class="gd-meta"><b>${bien ? 'Tu programa en Go:' : 'Así responde Go con tu código:'}</b></p><div id="gd-consola"></div>` : '';
  if (bien) {
    const r = await abrirCon(q.x, J.sal, q.id, texto);
    boton.classList.add('ok');
    E.hechas.push(q.id); E.cola = E.cola.filter(x => x !== q.id); E.puntos += 100;
    $('#retro').innerHTML = `${zonaConsola}<div class="retro ok">${gopherSvg({ ojos: 'feliz', boca: 'abierta' })}<div><h3>¡Correcto! +100 puntos</h3><p>${r.por}</p></div></div>`;
    $('#dlgpie').innerHTML = `<button class="btn grande" id="seguir">Seguir: explota una fila ${ICONO.sig}</button>`;
    $('#seguir').onclick = () => { cerrarDlg(); premio(); };
    if (practica) consola(q.fuente.replace(HUECO, codigoDe(texto)), r.real);
  } else {
    boton.classList.add('no');
    E.cola = E.cola.filter(x => x !== q.id).concat(q.id);      // vuelve al final de la fila de preguntas
    $('#retro').innerHTML = `${zonaConsola}<div class="retro no">${gopherSvg({ ojos: 'x', boca: 'abierta' })}<div><h3>No es correcto</h3>
        <p><b>Pista:</b> ${q.pista}</p><p>Esta pregunta volverá en otro dulce con ?.</p></div></div>`;
    $('#dlgpie').innerHTML = `<button class="btn grande" id="seguir">Seguir jugando ${ICONO.sig}</button>`;
    $('#seguir').onclick = () => { cerrarDlg(); despues(); };
    if (practica) consola(q.fuente.replace(HUECO, codigoDe(texto)));
  }
  guardar(); hud();
  respondiendo = false;
  $('#seguir').focus();
}
// premio por acertar: explota la fila donde estaba el dulce «?»
async function premio() {
  aviso('¡Fila dulce!');
  await cascada(new Set(Array.from({ length: N }, (_, c) => k(filaPregunta, c))));
  despues();
}
function despues() {
  guardar(); hud();
  if (!E.cola.length) { finNivel(); return; }
  asegurar(); ocupado = false; esperarPista();
}

/* ---------------- fin de nivel y juego completo ---------------- */
function finNivel() {
  confeti();
  if (E.nivel === 1) {
    abrirDlg(`<div class="retro ok">${gopherSvg({ ojos: 'feliz', boca: 'abierta' })}<div><h3 id="dlg-titulo">¡Nivel 1 completo!</h3>
        <p>Respondiste las ${POR_NIVEL} preguntas de la semana 9: proteger los datos. Ahora sigue el nivel 2: manejo de errores.</p></div></div>`,
      `<button class="btn grande" id="nivel2">Ir al nivel 2 ${ICONO.sig}</button>`);
    $('#nivel2').onclick = () => { E.nivel = 2; E.cola = [...J.orden[2]]; guardar(); cerrarDlg(); G = null; juego(); };
    return;
  }
  E.completo = true; guardar();
  abrirDlg(`<div class="retro ok">${gopherSvg({ ojos: 'feliz', boca: 'abierta' })}<div><h3 id="dlg-titulo">¡Juego completo!</h3>
      <p>Respondiste las ${TOTAL} preguntas de los dos niveles. Acertaste ${aciertosPrimer()} de ${TOTAL} al primer intento y sumaste ${E.puntos} puntos.</p></div></div>`,
    `<button class="btn sec" id="dinf">${ICONO.informe} Ver mi informe</button><button class="btn grande" id="dcert">${ICONO.trofeo} Ver mi certificado</button>`);
  $('#dinf').onclick = () => { cerrarDlg(); informe(); };
  $('#dcert').onclick = () => { cerrarDlg(); certificado(); };
}

/* ---------------- informe ---------------- */
const nivelTema = p => p >= 80 ? 'Lo domina' : p >= 50 ? 'En proceso' : 'Debe repasarlo';
const porTipo = () => ({ teoria: J.preguntas.filter(q => q.tipo === 'teoria' && E.primer[q.id] === true).length,
  practica: J.preguntas.filter(q => q.tipo === 'practica' && E.primer[q.id] === true).length });
function porTema() {
  return J.temas.map(t => {
    const qs = J.preguntas.filter(q => q.tema === t), bien = qs.filter(q => E.primer[q.id] === true).length;
    return { tema: t, bien, total: qs.length, p: Math.round(bien / qs.length * 100) };
  });
}
function informe() {
  if (!E.completo) { juego(); return; }
  const temas = porTema(), a = aciertosPrimer(), p = Math.round(a / TOTAL * 100), tp = porTipo();
  pintar(`<div class="card"><h2>${ICONO.informe} Informe</h2>
      <p><b>${esc(E.nombre)} ${esc(E.apellido)}</b> · ${a} de ${TOTAL} preguntas acertadas al primer intento (${p} %) · ${E.puntos} puntos en ${E.movs} jugadas</p>
      <p>Al primer intento: <b>teoría ${tp.teoria} de 6</b> · <b>práctica ${tp.practica} de 6</b></p>
      <div class="temas">${temas.map(x => `<div class="tema"><b>${esc(x.tema)}</b><div class="barra"><i class="${x.p >= 80 ? '' : x.p >= 50 ? 'medio' : 'bajo'}" style="width:${x.p}%"></i></div>
        <span>${x.bien}/${x.total}</span><small>${nivelTema(x.p)}</small></div>`).join('')}</div>
      <div class="fila-btn no-imprimir"><button class="btn grande" id="cert">${ICONO.trofeo} Ver mi certificado</button></div>
      <div class="fila-btn no-imprimir"><button class="btn sec" id="copiar">${ICONO.copiar} Copiar el informe</button>
        <button class="btn sec" id="imprimir">${ICONO.imprimir} Imprimir</button><button class="btn sec" id="ini">Inicio</button></div>
      <p class="aviso" id="aviso"></p></div>`);
  $('#cert').onclick = certificado;
  $('#ini').onclick = inicio;
  $('#imprimir').onclick = () => window.print();
  $('#copiar').onclick = async () => {
    const txt = `Gopher Dulce · ${E.nombre} ${E.apellido}\n${a} de ${TOTAL} al primer intento (${p} %) · teoría ${tp.teoria}/6 · práctica ${tp.practica}/6 · ${E.puntos} puntos\n` +
      temas.map(x => `${x.tema}: ${x.bien}/${x.total} · ${nivelTema(x.p)}`).join('\n');
    try { await navigator.clipboard.writeText(txt); $('#aviso').style.color = 'var(--bien)'; $('#aviso').textContent = 'Informe copiado.'; }
    catch { $('#aviso').textContent = 'No se pudo copiar; usa «Imprimir».'; }
  };
}

/* ---------------- certificado ---------------- */
function rango(p) { return p >= 90 ? 'Guardián del código' : p >= 75 ? 'Programador experto' : p >= 50 ? 'Programador en progreso' : 'Aprendiz de Go'; }
function codigo(texto) {
  let h = 0x811c9dc5;
  for (const ch of texto) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  const s = h.toString(36).toUpperCase().padStart(8, '0').slice(-8);
  return s.slice(0, 4) + '-' + s.slice(4);
}
function caja(x, a, b, w, h, r) { x.beginPath(); if (x.roundRect) x.roundRect(a, b, w, h, r); else x.rect(a, b, w, h); }
const cargarImg = src => new Promise((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = mal; i.src = src; });
const svgUrl = (vb, w, h, cuerpo) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${w}" height="${h}">${cuerpo}</svg>`);
async function dibujarCertificado() {
  try { await Promise.all([document.fonts.load('800 60px Poppins'), document.fonts.load('600 30px Poppins'), document.fonts.load('400 28px Poppins')]); } catch { /* fuente del sistema */ }
  const W = 1600, H = 1131, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  const AZUL = '#002C71', DORADO = '#EAAA00', MAG = '#910048', GRIS = '#4a5461';
  x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#fbf7ec'; x.fillRect(60, 60, W - 120, H - 120);
  x.strokeStyle = DORADO; x.lineWidth = 16; x.strokeRect(28, 28, W - 56, H - 56);
  x.strokeStyle = AZUL; x.lineWidth = 3; x.strokeRect(60, 60, W - 120, H - 120);
  x.fillStyle = DORADO;
  [[60, 60, 1, 1], [W - 60, 60, -1, 1], [60, H - 60, 1, -1], [W - 60, H - 60, -1, -1]].forEach(([a, b, sx, sy]) => {
    x.beginPath(); x.moveTo(a, b); x.lineTo(a + 84 * sx, b); x.lineTo(a, b + 84 * sy); x.closePath(); x.fill();
  });
  x.textAlign = 'left'; x.font = '800 50px Poppins, sans-serif';
  x.fillStyle = AZUL; x.fillText('Gopher', 130, 150);
  x.fillStyle = DORADO; x.fillText('Dulce', 130, 206);
  try {   // los cinco dulces junto al título y el gopher a la derecha
    x.drawImage(await cargarImg(svgUrl('0 0 500 100', 500, 100, DULCE.map((d, i) => `<g transform="translate(${i * 100} 0)">${d}</g>`).join(''))), 300, 150, 300, 60);
    x.drawImage(await cargarImg(svgUrl('0 0 120 136', 240, 272, gopher({ ojos: 'feliz', boca: 'abierta' }))), W - 300, 80, 190, 215);
  } catch { /* sin dibujos */ }
  const centro = (txt, y, fuente, color) => { x.font = fuente; x.fillStyle = color; x.textAlign = 'center'; x.fillText(txt, W / 2, y); };
  centro('CERTIFICADO DE COMPLETADO', 320, '800 62px Poppins, sans-serif', AZUL);
  x.fillStyle = DORADO; x.fillRect(W / 2 - 160, 342, 320, 6);
  centro('Se otorga a', 410, '400 30px Poppins, sans-serif', GRIS);
  const nombre = `${E.nombre} ${E.apellido}`;
  let tam = 78; x.font = `800 ${tam}px Poppins, sans-serif`;
  while (x.measureText(nombre).width > W - 360 && tam > 40) { tam -= 4; x.font = `800 ${tam}px Poppins, sans-serif`; }
  centro(nombre, 498, `800 ${tam}px Poppins, sans-serif`, MAG);
  x.strokeStyle = DORADO; x.lineWidth = 3; x.beginPath(); x.moveTo(W / 2 - 420, 528); x.lineTo(W / 2 + 420, 528); x.stroke();
  centro('por completar los 2 niveles de Gopher Dulce: encapsulación y manejo de errores en Go', 588, '600 29px Poppins, sans-serif', AZUL);
  const tp = porTipo();
  centro(`Programación Orientada a Objetos · semanas 9 y 10 · teoría ${tp.teoria} de 6 y práctica ${tp.practica} de 6 al primer intento`, 630, '400 22px Poppins, sans-serif', GRIS);
  const a = aciertosPrimer(), p = Math.round(a / TOTAL * 100);
  [[`${a} de ${TOTAL}`, 'al primer intento'], [`${p} %`, 'de logro'], [rango(p), 'nivel alcanzado']].forEach(([v, et], i) => {
    const cxx = W / 2 + (i - 1) * 420, y = 668;
    x.fillStyle = i === 2 ? '#fdf2f7' : '#eef3fb'; x.strokeStyle = i === 2 ? MAG : AZUL; x.lineWidth = 2;
    caja(x, cxx - 190, y, 380, 104, 18); x.fill(); x.stroke();
    x.textAlign = 'center'; x.fillStyle = i === 2 ? MAG : AZUL;
    let t = 40; x.font = `800 ${t}px Poppins, sans-serif`;
    while (x.measureText(v).width > 350 && t > 22) { t -= 2; x.font = `800 ${t}px Poppins, sans-serif`; }
    x.fillText(v, cxx, y + 56);
    x.font = '400 20px Poppins, sans-serif'; x.fillStyle = GRIS; x.fillText(et, cxx, y + 88);
  });
  x.font = '600 17px Poppins, sans-serif';
  porTema().forEach((tm, i) => {
    const col = i % 3, fil = Math.floor(i / 3), px = 150 + col * 440, y = 815 + fil * 48;
    x.textAlign = 'left'; x.fillStyle = AZUL; x.fillText(tm.tema, px, y);
    x.fillStyle = '#e8edf4'; x.fillRect(px, y + 9, 330, 9);
    x.fillStyle = tm.p >= 80 ? '#1E9E5A' : tm.p >= 50 ? DORADO : '#C62839'; x.fillRect(px, y + 9, 330 * tm.p / 100, 9);
    x.fillStyle = GRIS; x.textAlign = 'right'; x.fillText(`${tm.bien}/${tm.total}`, px + 386, y + 18);
  });
  const fecha = new Date().toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' });
  x.textAlign = 'left'; x.fillStyle = GRIS; x.font = '400 22px Poppins, sans-serif';
  x.strokeStyle = DORADO; x.lineWidth = 2; x.beginPath(); x.moveTo(130, 945); x.lineTo(W - 130, 945); x.stroke();
  x.fillText(fecha.charAt(0).toUpperCase() + fecha.slice(1), 130, 990);
  x.font = '400 18px Poppins, sans-serif'; x.fillText('Fecha', 130, 1016);
  x.textAlign = 'right'; x.fillStyle = AZUL; x.font = '600 24px "JetBrains Mono", Consolas, monospace';
  x.fillText(codigo(`${nombre}|${a}|${fecha}`), W - 130, 990);
  x.fillStyle = GRIS; x.font = '400 18px Poppins, sans-serif'; x.fillText('Código de verificación', W - 130, 1016);
  return c;
}
async function certificado() {
  if (!E.completo) { juego(); return; }
  pintar(`<div class="card centro"><h2 style="justify-content:center">${ICONO.trofeo} Tu certificado</h2>
      <p class="suave" id="gen">Generando…</p><div id="certzona"></div></div>`);
  const url = (await dibujarCertificado()).toDataURL('image/png');
  const archivo = `Certificado-Gopher-Dulce-${E.nombre}-${E.apellido}.png`.replace(/\s+/g, '-');
  $('#certzona').innerHTML = `<img class="cert" src="${url}" alt="Certificado de ${esc(E.nombre)} ${esc(E.apellido)}">
    <div class="fila-btn"><a class="btn grande" id="descargar" href="${url}" download="${esc(archivo)}">${ICONO.descargar} Descargar certificado</a></div>
    <p class="suave">En el celular también puedes mantener presionada la imagen para guardarla.</p>
    <div class="fila-btn"><button class="btn sec" id="inf">${ICONO.informe} Ver mi informe</button><button class="btn sec" id="ini">Inicio</button></div>`;
  $('#gen').remove();
  $('#ini').onclick = inicio;
  $('#inf').onclick = informe;
  confeti();
}

/* ---------------- arranque ---------------- */
function arrancar() {
  E = cargar();
  if ([...E.cola, ...E.hechas].some(id => !Q[id]) || !NIVEL[E.nivel]) E = nuevo(E.nombre, E.apellido);   // datos de otra versión
  inicio();
}
Promise.all([document.fonts.load('15px "JetBrains Mono"'), document.fonts.load('700 16px Poppins'), document.fonts.load('400 15px Poppins')])
  .catch(() => null).then(arrancar);
