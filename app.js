'use strict';
const S = Store.S;
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lsGet = k => { try { return JSON.parse(localStorage.getItem(k)); } catch(e) { return null; } };
const lsSet = (k,v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) {} };
const clone = o => JSON.parse(JSON.stringify(o));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);

// ================= Fechas =================
const pad = n => String(n).padStart(2,'0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parseD = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); };
const addDays = (s,n) => { const d = parseD(s); d.setDate(d.getDate()+n); return iso(d); };
const weekOf = s => { const d = parseD(s); d.setDate(d.getDate() - (d.getDay()+6)%7); return iso(d); }; // lunes
const todayISO = () => iso(new Date());
const dow = s => parseD(s).getDay();
const DAYN = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const DAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const MON = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const MONL = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const dayLabel = s => { const d = parseD(s); return `${DAYS[d.getDay()]} ${d.getDate()}`; };
const longDay = s => { const d = parseD(s); return `${DAYN[d.getDay()]} ${d.getDate()} de ${MONL[d.getMonth()]}`; };
const daysAgo = s => Math.round((parseD(todayISO()) - parseD(s)) / 864e5);
const MEALN = {c:'Comida', n:'Cena'};
const eur = n => n.toLocaleString('es-ES',{style:'currency',currency:'EUR'});
const nf = (n,d=1) => Number(n||0).toLocaleString('es-ES',{maximumFractionDigits:d});

// ================= Ajustes =================
const ACCENTS = {
  verde:{n:'Verde', l:['#2F6B3A','#D9EADB'], d:['#74C27F','#1E3524']},
  azul:{n:'Azul', l:['#24609E','#DAE6F3'], d:['#7FB3E8','#182A3D']},
  granate:{n:'Granate', l:['#9C2F45','#F3DCE1'], d:['#EC8EA0','#3A1C23']},
  naranja:{n:'Naranja', l:['#B5540F','#F8E3D2'], d:['#F2A56B','#3A2615']},
  morado:{n:'Morado', l:['#6A47A8','#E6DEF4'], d:['#B79CEA','#2A2140']},
  pizarra:{n:'Pizarra', l:['#3B5560','#DCE5E8'], d:['#9DBAC4','#1F2B30']}
};
const APP_EMOJIS = ['🥗','🍲','🥘','🍳','🥑','🍅','🫑','🧄','🌿','🏠','🦔','💪','🥦','🍽️','🧑‍🍳','🛒'];
const AV_EMOJIS = ['🌸','💪','🌿','🏃','🦔','⭐','🔥','🍀','🌞','🌙','🐱','🐶','🦊','🐻','🐼','🦁','🐸','🚴','🏋️','🧘','⚽','🎾','🎸','📚'];
const PCOLORS = ['#C2477A','#2F6FB0','#3E8A4A','#C9780A','#7A4FB5','#B0453A','#1F8A8A','#5A6A5E'];
const set0 = () => S.settings.main || {};
const appName = () => set0().appName || 'Comemos en Casa';
const appIcon = () => set0().appIcon || '🥗';
const accentKey = () => ACCENTS[set0().accent] ? set0().accent : 'verde';
const profiles = () => (set0().profiles && set0().profiles.length) ? set0().profiles : DEFAULT_PROFILES;
const prof = id => profiles().find(p => p.id === id);
const dislikes = () => set0().dislikes || DEFAULT_DISLIKES;
const habits = () => ({sundayOut: true, sundayLeft: true, big: 6, small: 3, ...(set0().habits || {})});
function saveSettings(partial) { Store.set('settings', 'main', {...set0(), ...partial}); }

let ME = lsGet('cec2_me');
const me = () => prof(ME);
let THEME = lsGet('cec2_theme') || 'auto';

function applyTheme() {
  const r = document.documentElement;
  if (THEME === 'auto') delete r.dataset.theme; else r.dataset.theme = THEME;
  const a = ACCENTS[accentKey()];
  const tok = (x, ink) => `--accent:${x[0]};--accent-soft:${x[1]};--accent-ink:${ink};`;
  $('#accentStyle').textContent = `:root{${tok(a.l,'#FFFFFF')}}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${tok(a.d,'#0B140E')}}}
:root[data-theme="dark"]{${tok(a.d,'#0B140E')}}`;
}
let brandKey = '';
function applyBranding() {
  const k = appName() + appIcon() + accentKey() + Store.mode;
  if (k === brandKey) return; brandKey = k;
  document.title = appName();
  const color = ACCENTS[accentKey()].l[0];
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.content = color);
  try {
    const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
    x.fillStyle = color; x.beginPath(); if (x.roundRect) x.roundRect(0,0,512,512,110); else x.rect(0,0,512,512); x.fill();
    x.font = '300px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(appIcon(), 256, 284);
    const url = c.toDataURL('image/png');
    const link = (rel) => { let l = document.querySelector(`link[rel="${rel}"]`); if (!l) { l = document.createElement('link'); l.rel = rel; document.head.appendChild(l); } l.href = url; };
    link('icon'); link('apple-touch-icon');
    let t = document.querySelector('meta[name="apple-mobile-web-app-title"]'); if (t) t.content = appName();
    const mf = document.querySelector('link[rel="manifest"]');
    if (mf && Store.mode === 'supabase') {
      const base = location.href.replace(/[#?].*$/, '').replace(/[^/]*$/, '');
      const man = {name: appName(), short_name: appName().slice(0, 14), start_url: base, scope: base, display: 'standalone', background_color: '#EFF3EC', theme_color: color,
        icons: [{src: url, sizes: '512x512', type: 'image/png', purpose: 'any'}, {src: base + 'icons/icon-192.png', sizes: '192x192', type: 'image/png'}]};
      mf.href = URL.createObjectURL(new Blob([JSON.stringify(man)], {type:'application/manifest+json'}));
    }
  } catch(e) {}
}

// ================= Recetas e ingredientes =================
let RC = null, RCsrc = null;
function allRecipes() {
  if (RC && RCsrc === S.recipes) return RC;
  const out = [], seen = new Set();
  for (const r of RECIPES) {
    seen.add(r.id); const o = S.recipes[r.id];
    if (o && o.del) continue;
    out.push(o ? {...r, ...o, id: r.id, edited: true, base: true} : {...r, base: true});
  }
  for (const id in S.recipes) if (!seen.has(id) && !S.recipes[id].del) out.push({...S.recipes[id], id, custom: true});
  out.forEach(r => { r.ty = r.ty || 'plato'; r.sl = r.sl ?? 'cn'; r.i = r.i || []; r.s = r.s || []; r.m = r.m || [0,0,0,0]; r.solo = r.solo || []; });
  RC = out; RCsrc = S.recipes; return out;
}
const rec = id => allRecipes().find(r => r.id === id);
function ing(id) {
  const b = ING[id], o = S.ingr[id];
  const base = b ? {id, n:b[0], sec:b[1], u:b[2], pk:b[3], pr:b[4], fl:b[5]} : {id, n:id, sec:'otr', u:'ud', pk:1, pr:0, fl:''};
  return o ? {...base, ...o, id} : base;
}
const allIngIds = () => [...new Set([...Object.keys(ING), ...Object.keys(S.ingr)])];
const hasIt = id => { const p = S.pantry[id]; if (p && typeof p.have === 'boolean') return p.have; return ing(id).fl.includes('b'); };
const isFijo = id => { const p = S.pantry[id]; if (p && typeof p.fijo === 'boolean') return p.fijo; return DEFAULT_FIJOS.includes(id); };
const RECENT_MS = 12*3600*1000;
const recentlyGot = id => { const p = S.pantry[id]; return p && p.have && p.t && (Date.now() - p.t < RECENT_MS); };
const lacNames = () => profiles().filter(p => p.lac).map(p => p.n).join(', ');
const hasLac = r => r.i.some(([id]) => ing(id).fl.includes('l'));
const disliked = r => { const d = dislikes(); return r.i.some(([id]) => d.includes(id)); };
const rates = rid => S.ratings[rid] || {};
const rateOf = (rid, pid) => rates(rid)[pid] || '';
const nNo = rid => Object.entries(rates(rid)).filter(([p, v]) => v === 'no' && prof(p)).length;
const nLove = rid => Object.entries(rates(rid)).filter(([p, v]) => v === 'love' && prof(p)).length;
const RATEN = {love:'Me encanta', ok:'Bien', no:'No me gusta'};

// ================= Menú (un documento por día) =================
const emptySlot = () => ({items: [], g: 0, done: false, alt: {}});
function getSlot(date, m) {
  const d = S.day[date]; const s = d && d[m];
  if (!s) return null;
  return {...emptySlot(), ...s, items: s.items || [], alt: s.alt || {}};
}
const slotOrEmpty = (date, m) => getSlot(date, m) || emptySlot();
function writeSlot(date, m, slot) {
  const cur = S.day[date] || {};
  const empty = !slot || (!slot.items.length && !Object.keys(slot.alt || {}).length && !slot.g);
  const next = {...cur};
  if (empty) delete next[m]; else next[m] = slot;
  if (!next.c && !next.n) { if (S.day[date]) Store.del('day', date); }
  else Store.set('day', date, next);
}
const itemKey = it => it.k + ':' + (it.id || it.of || it.t || '');
function itemRecipe(it) { if (!it) return null; if (it.k === 'r') return rec(it.id); if (it.k === 'sobras' && it.of) return rec(it.of); return null; }
function itemName(it) {
  if (it.k === 'r') { const r = rec(it.id); return r ? r.n : 'Receta borrada'; }
  if (it.k === 'fuera') return 'Fuera de casa';
  if (it.k === 'nada') return 'No come';
  if (it.k === 'sobras') { const r = it.of && rec(it.of); return r ? 'Sobras: ' + r.n : 'Sobras'; }
  if (it.k === 'txt') return it.t || 'Otra cosa';
  return '';
}
const slotText = s => s && s.items.length ? s.items.map(itemName).join(' + ') : '';
function eatsFor(date, m, pid) {
  const s = getSlot(date, m); if (!s) return [];
  if (s.alt[pid]) return s.alt[pid].items || [];
  return s.items;
}
function familyEaters(s) { return profiles().filter(p => !s.alt[p.id]).length + (s.g || 0); }

// ================= Registro personal =================
const logId = (date, pid) => date + '_' + pid;
const getLog = (date, pid) => ({meals: {}, extra: [], agua: 0, entreno: false, ...(S.log[logId(date, pid)] || {})});
function patchLog(date, pid, fn) { const l = clone(getLog(date, pid)); fn(l); Store.set('log', logId(date, pid), l); }
const mealLog = (l, m) => ({f: 1, off: [], ...(l.meals[m] || {})});
function itemKcal(it, p) {
  const r = itemRecipe(it);
  if (r) return [r.m[0] * p.f, r.m[1] * p.f];
  if (it.k === 'txt') return [Number(it.kcal) || 0, Number(it.prot) || 0];
  return [0, 0];
}
function dayTotals(date, pid) {
  const p = prof(pid); if (!p) return {k:0, pr:0};
  const l = getLog(date, pid); let k = 0, pr = 0;
  for (const m of ['c','n']) {
    const ml = mealLog(l, m);
    for (const it of eatsFor(date, m, pid)) { if (ml.off.includes(itemKey(it))) continue; const [a, b] = itemKcal(it, p); k += a * ml.f; pr += b * ml.f; }
  }
  for (const e of l.extra) { k += Number(e.kcal) || 0; pr += Number(e.prot) || 0; }
  return {k: Math.round(k), pr: Math.round(pr)};
}
const targetK = (date, pid) => { const p = prof(pid); if (!p) return 2000; return p.kcal + (getLog(date, pid).entreno ? (p.entr ?? 300) : 0); };
const hasData = (date, pid) => !!(S.log[logId(date, pid)] || getSlot(date,'c') || getSlot(date,'n'));

// ================= Generador de menú =================
const TARGETS = {leg:2, pes:3, car:3, hue:2, pas:1, ver:1, cap:1};
function catCountsRange(dates, skip) {
  const c = {};
  for (const d of dates) for (const m of ['c','n']) {
    if (skip === d+'|'+m) continue;
    const s = getSlot(d, m); if (!s) continue;
    for (const it of s.items) if (it.k === 'r') { const r = rec(it.id); if (r && r.ty === 'plato') c[r.cat] = (c[r.cat]||0) + 1; }
  }
  return c;
}
const weekDates = wk => [0,1,2,3,4,5,6].map(i => addDays(wk, i));
function eligible(r, m) {
  return r.ty === 'plato' && r.sl.includes(m) && !r.solo.length && !disliked(r) && nNo(r.id) < 2;
}
function scoreRecipe(r, m, i, counts, prevCat, lastWeek, rnd) {
  let s = Math.random() * rnd;
  const t = TARGETS[r.cat] || 1, c = counts[r.cat] || 0;
  s += (t - c) * 1.4; if (c >= t) s -= 1.8 * (c - t + 1);
  s += nLove(r.id) * 0.6 - nNo(r.id) * 1.2;
  if (r.cat === prevCat) s -= 1;
  if (lastWeek.has(r.id)) s -= 1.2;
  if (m === 'n') { if (r.lig) s += 0.6; if (r.t > 50) s -= 2; if (r.so) s -= 0.6; }
  if (m === 'c' && r.so) s += (i === 0 ? 1.6 : 0.4);
  if (m === 'c' && r.cat === 'leg') s += 0.7;
  if (r.cat === 'cap') s += ((i === 4 || i === 5) && m === 'n') ? 2.5 : -1;
  if (r.t >= 120 && i < 5) s -= 2.5;
  return s;
}
function usedIn(dates, skip) { const u = new Set(); for (const d of dates) for (const m of ['c','n']) { if (skip === d+'|'+m) continue; const s = getSlot(d, m); if (s) s.items.forEach(it => it.k === 'r' && u.add(it.id)); } return u; }
function generate(wk, fill) {
  const dates = weekDates(wk), h = habits();
  const plan = {};
  for (const d of dates) for (const m of ['c','n']) { const s = getSlot(d, m); if (fill && s && s.items.length) plan[d+'|'+m] = s; }
  const sun = dates[6];
  if (h.sundayOut && !plan[sun+'|c']) plan[sun+'|c'] = {...emptySlot(), items:[{k:'fuera'}]};
  if (h.sundayLeft && !plan[sun+'|n']) plan[sun+'|n'] = {...emptySlot(), items:[{k:'sobras'}]};
  const lw = new Set(); weekDates(addDays(wk,-7)).forEach(d => ['c','n'].forEach(m => { const s = getSlot(d, m); if (s) s.items.forEach(it => it.k === 'r' && lw.add(it.id)); }));
  const used = new Set(); Object.values(plan).forEach(s => s.items.forEach(it => it.k === 'r' && used.add(it.id)));
  let prevCat = null;
  dates.forEach((d, i) => ['c','n'].forEach(m => {
    const k = d+'|'+m;
    if (plan[k]) { const r = plan[k].items[0] && itemRecipe(plan[k].items[0]); prevCat = r ? r.cat : null; return; }
    const counts = {}; Object.values(plan).forEach(s => s.items.forEach(it => { if (it.k === 'r') { const r = rec(it.id); if (r && r.ty === 'plato') counts[r.cat] = (counts[r.cat]||0)+1; } }));
    let best = null, bs = -1e9;
    for (const r of allRecipes()) { if (!eligible(r, m) || used.has(r.id)) continue; const sc = scoreRecipe(r, m, i, counts, prevCat, lw, 1.2); if (sc > bs) { bs = sc; best = r; } }
    if (!best) return;
    const items = [{k:'r', id: best.id}]; if (best.pide && rec(best.pide)) items.push({k:'r', id: best.pide});
    const keepAlt = (getSlot(d, m) || {}).alt || {};
    plan[k] = {...emptySlot(), items, alt: fill ? keepAlt : {}}; used.add(best.id); prevCat = best.cat;
    if (best.so && m === 'c') for (let j = i+1; j <= Math.min(6, i+2); j++) { const k2 = dates[j]+'|c'; if (!plan[k2]) { plan[k2] = {...emptySlot(), items:[{k:'sobras', of: best.id}]}; break; } }
  }));
  for (const d of dates) {
    const cur = S.day[d] || {}, next = {...cur};
    let changed = false;
    for (const m of ['c','n']) { const p = plan[d+'|'+m]; if (p) { next[m] = p; changed = true; } else if (!fill && cur[m]) { delete next[m]; changed = true; } }
    if (!changed) continue;
    if (next.c || next.n) Store.set('day', d, next); else Store.del('day', d);
  }
}
function suggestions(date, m, pid, n = 8) {
  const wk = weekOf(date), dates = weekDates(wk), key = date+'|'+m;
  const counts = catCountsRange(dates, key), used = usedIn(dates, key);
  const lw = new Set();
  const i = dates.indexOf(date);
  return allRecipes().filter(r => r.ty === 'plato' && r.sl.includes(m) && !used.has(r.id) && !disliked(r) && (pid ? rateOf(r.id, pid) !== 'no' && (!r.solo.length || r.solo.includes(pid)) : (!r.solo.length && nNo(r.id) < 2)))
    .map(r => [r, scoreRecipe(r, m, i, counts, null, lw, 2) + (pid ? (rateOf(r.id, pid) === 'love' ? 2 : 0) + (r.solo.includes(pid) ? 2 : 0) : 0)])
    .sort((a,b) => b[1]-a[1]).slice(0, n).map(x => x[0]);
}

// ================= Lista de la compra =================
function nextShopDay(from) { const h = habits(); for (let i = 1; i <= 7; i++) { const d = addDays(from, i); if (dow(d) === h.big || dow(d) === h.small) return d; } return addDays(from, 7); }
function shopDates(range) {
  const t = todayISO();
  if (range === 'next') { const n = nextShopDay(t); const out = []; for (let d = t; d < n; d = addDays(d, 1)) out.push(d); return out; }
  if (range === 'nextweek') return weekDates(addDays(weekOf(t), 7));
  return [0,1,2,3,4,5,6].map(i => addDays(t, i));
}
function shopping(range) {
  const need = {};
  const add = (id, q, d, rn) => { const o = need[id] || (need[id] = {q:0, days:new Set(), recs:new Set(), fijo:false}); o.q += q; if (d) o.days.add(d); if (rn) o.recs.add(rn); };
  for (const d of shopDates(range)) for (const m of ['c','n']) {
    const s = getSlot(d, m); if (!s) continue;
    const fam = familyEaters(s);
    if (fam > 0) for (const it of s.items) if (it.k === 'r') { const r = rec(it.id); if (r) r.i.forEach(([id, q]) => add(id, (q||0) * fam / 4, d, r.n)); }
    for (const pid in s.alt) { if (!prof(pid)) continue; for (const it of (s.alt[pid].items || [])) if (it.k === 'r') { const r = rec(it.id); if (r) r.i.forEach(([id, q]) => add(id, (q||0) / 4, d, r.n)); } }
  }
  for (const id of allIngIds()) if (isFijo(id)) { add(id, 0); need[id].fijo = true; }
  const pending = [], got = [], home = [];
  for (const id in need) {
    const g = ing(id), o = need[id];
    if (g.fl.includes('b') && !o.fijo && hasIt(id)) continue;
    const packs = o.q > 0 ? Math.max(1, Math.ceil(o.q / (g.pk || 1) - 0.05)) : 1;
    const it = {id, g, q:o.q, packs, price: packs * (g.pr || 0), days:[...o.days].sort(), recs:[...o.recs], fijo:o.fijo};
    if (!hasIt(id)) pending.push(it); else if (recentlyGot(id)) got.push(it); else home.push(it);
  }
  const ex = Object.entries(S.extras).map(([id, x]) => ({id, ...x}));
  const sum = a => a.reduce((t, x) => t + x.price, 0);
  return {pending, got, home, exPending: ex.filter(x => !x.done), exGot: ex.filter(x => x.done), pendingEur: sum(pending), totalEur: sum(pending) + sum(got)};
}
const secOrder = id => SECTIONS.findIndex(s => s[0] === id);
const secName = id => (SECTIONS.find(s => s[0] === id) || [,'Otros'])[1];
function groupBySec(items) {
  const g = {}; items.forEach(it => { (g[it.g.sec] = g[it.g.sec] || []).push(it); });
  return Object.keys(g).sort((a,b) => secOrder(a) - secOrder(b)).map(s => [s, g[s].sort((x,y) => x.g.n.localeCompare(y.g.n, 'es'))]);
}
const PL = {ud:'ud', g:'g', ml:'ml', diente:'dientes', lata:'latas', rebanada:'rebanadas', bote:'botes', tarro:'tarros', bolsa:'bolsas', sobre:'sobres', pack:'packs', manojo:'manojos', tarrina:'tarrinas', hoja:'hojas', paquete:'paquetes'};
function fmtQty(q, u) {
  if (!q) return 'al gusto';
  if (u === 'g') return q >= 1000 ? nf(q/1000, 2) + ' kg' : Math.round(q) + ' g';
  if (u === 'ml') return q >= 1000 ? nf(q/1000, 2) + ' L' : Math.round(q) + ' ml';
  const n = Math.round(q*10)/10; return nf(n) + ' ' + (n === 1 ? u : (PL[u] || u + 's'));
}

// ================= Pintado =================
const ICON = {
  hoy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  menu:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4M7.5 14h4M7.5 17h7"/></svg>',
  compra:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2.2l2.3 11.2a1.8 1.8 0 0 0 1.8 1.4h8.4a1.8 1.8 0 0 0 1.8-1.4L21 8H6.2"/><circle cx="9.5" cy="20" r="1.3"/><circle cx="17.5" cy="20" r="1.3"/></svg>',
  casa:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h10v3H7z"/><path d="M6 6h12l-1 14a1.5 1.5 0 0 1-1.5 1.4h-7A1.5 1.5 0 0 1 7 20z"/><path d="M9 11h6M9 15h6"/></svg>',
  recetas:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="M9 8h7M9 11.5h5"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  star:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z"/></svg>',
  left:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  right:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'
};
const TABS = [['hoy','Hoy'],['menu','Menú'],['compra','Compra'],['casa','Casa'],['recetas','Recetas']];
const CATN = c => CATS[c] || '';
const catDot = c => `<span class="dot cat-${esc(c)}"></span>`;
const avatar = (p, cls = '') => p ? `<span class="av ${cls}" style="--pc:${esc(p.col || '#5A6A5E')}"><i class="bg"></i><span>${esc(p.av || p.n[0])}</span></span>` : '';

const UI = Object.assign({tab:'hoy', week:weekOf(todayISO()), shopRange:'7', recQ:'', recF:'all', pantryQ:'', pantryF:'all', newExtra:''}, lsGet('cec2_ui') || {});
UI.week = weekOf(todayISO()); UI.confirm = null; UI.pantryQ = ''; UI.recQ = '';
const saveUI = () => lsSet('cec2_ui', {tab:UI.tab, shopRange:UI.shopRange, recF:UI.recF, pantryF:UI.pantryF});

let rq = false;
function scheduleRender() { if (rq) return; rq = true; requestAnimationFrame(() => { rq = false; render(); }); }
function keepFocus(container, fn) {
  const a = document.activeElement, id = a && a.id && container.contains(a) ? a.id : null;
  let sel = null; try { sel = id && a.selectionStart != null ? [a.selectionStart, a.selectionEnd] : null; } catch(e) {}
  fn();
  if (id) { const el = document.getElementById(id); if (el) { el.focus({preventScroll:true}); if (sel && el.setSelectionRange) try { el.setSelectionRange(sel[0], sel[1]); } catch(e) {} } }
}
function render() {
  applyTheme(); applyBranding();
  const gate = $('#gate'), shell = $('#shell');
  if (Store.mode === 'login' || Store.mode === 'loading') { shell.hidden = true; gate.hidden = false; gate.innerHTML = Store.mode === 'login' ? loginHTML() : `<div class="logo">${esc(appIcon())}</div><p class="muted">Cargando…</p>`; return; }
  if (!me()) { shell.hidden = true; gate.hidden = false; gate.innerHTML = whoHTML(); return; }
  gate.hidden = true; shell.hidden = false;
  keepFocus($('#view'), () => { $('#view').innerHTML = (VIEWS[UI.tab] || VIEWS.hoy)(); });
  renderChrome();
  const top = SHEETS[SHEETS.length - 1];
  if (top && !top.static) {
    const b = $('#sheetBody'), st = b.scrollTop;
    keepFocus(b, () => { $('#sheetTitle').textContent = typeof top.title === 'function' ? top.title() : top.title; b.innerHTML = top.render(); });
    b.scrollTop = st;
  }
}
function syncState() {
  if (Store.mode === 'local') return ['local', 'Solo este móvil'];
  if (Store.readOnly) return ['err', 'Solo lectura'];
  if (!Store.online) return ['err', Store.pendingCount ? `Sin conexión · ${Store.pendingCount}` : 'Sin conexión'];
  if (Store.pendingCount) return ['', 'Guardando…'];
  return ['ok', 'Al día'];
}
function renderChrome() {
  $('#hName').textContent = appName(); $('#hIco').textContent = appIcon();
  $('#hSub').textContent = {hoy:'Hoy', menu:'Menú semanal', compra:'Lista de la compra', casa:'Lo que hay en casa', recetas:'Recetario'}[UI.tab];
  const [c, t] = syncState(); const sy = $('#sync'); sy.className = 'sync ' + c; sy.querySelector('span').textContent = t;
  $('#meBtn').innerHTML = avatar(me());
  const pend = shopping(UI.shopRange).pending.length + Object.values(S.extras).filter(x => !x.done).length;
  $('#tabs').innerHTML = TABS.map(([id, l]) => `<button data-act="tab" data-t="${id}" ${UI.tab === id ? 'aria-current="page"' : ''}>${ICON[id]}${l}${id === 'compra' && pend ? `<span class="badge-n num">${pend}</span>` : ''}</button>`).join('');
}

// ---------- Entrada ----------
function loginHTML() {
  return `<div class="logo">${esc(appIcon())}</div><h1>${esc(appName())}</h1>
    <form id="loginForm"><input class="search" id="pw" type="password" autocomplete="current-password" placeholder="Contraseña de la familia" required>
    <button class="btn pri" type="submit">Entrar</button>${UI.loginErr ? `<span class="err">${esc(UI.loginErr)}</span>` : ''}</form>
    <p class="small muted" style="max-width:320px">La contraseña es la misma para toda la familia. Solo hay que ponerla una vez en cada móvil.</p>`;
}
function whoHTML() {
  return `<div class="logo">${esc(appIcon())}</div><h1>¿Quién eres?</h1>
    <div class="who">${profiles().map(p => `<button data-act="pickMe" data-id="${esc(p.id)}">${avatar(p, 'lg')}${esc(p.n)}</button>`).join('')}</div>
    <p class="small muted">Se recuerda en este móvil. Puedes cambiarlo cuando quieras tocando tu icono.</p>`;
}

function recMeta(r) {
  const mine = rateOf(r.id, ME);
  return `<div class="meta">${catDot(r.cat)}<span>${esc(r.ty !== 'plato' ? TYPES[r.ty] : CATN(r.cat))}</span>${r.t ? `<span>· ${r.t} min</span>` : ''}
    ${r.so ? '<span class="tag">Sobras</span>' : ''}${r.lig ? '<span class="tag acc">Ligera</span>' : ''}${hasLac(r) ? '<span class="tag pop">Lactosa</span>' : ''}
    ${r.solo.length ? `<span class="tag">Solo ${esc(r.solo.map(id => (prof(id)||{}).n).filter(Boolean).join(', '))}</span>` : ''}
    ${r.custom ? '<span class="tag">Vuestra</span>' : ''}${disliked(r) ? '<span class="tag bad">Ingrediente que no os gusta</span>' : ''}
    ${mine === 'love' ? '<span class="heart" aria-label="Me encanta">♥</span>' : ''}${mine === 'no' ? '<span class="tag bad">No me gusta</span>' : ''}</div>`;
}
const VIEWS = {};

// ---------- HOY (personal) ----------
function ring(val, max) {
  const r = 52, c = 2 * Math.PI * r, p = Math.min(1, max ? val / max : 0);
  return `<div class="ring"><svg viewBox="0 0 120 120"><circle class="trk" cx="60" cy="60" r="${r}" fill="none" stroke-width="12"/><circle class="prg ${val > max ? 'over' : ''}" cx="60" cy="60" r="${r}" fill="none" stroke-width="12" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p)}"/></svg>
    <div class="c"><b class="num">${nf(val,0)}</b><small class="num">de ${nf(max,0)} kcal</small></div></div>`;
}
function myMealCard(date, m, p) {
  const s = getSlot(date, m), items = eatsFor(date, m, p.id), l = getLog(date, p.id), ml = mealLog(l, m);
  const isAlt = s && s.alt[p.id];
  const rows = items.map(it => {
    const off = ml.off.includes(itemKey(it)), r = itemRecipe(it), [k] = itemKcal(it, p);
    return `<div class="mi ${off ? 'skip' : ''}"><button class="check ${off ? '' : 'on'}" data-act="mealOff" data-date="${date}" data-m="${m}" data-k="${esc(itemKey(it))}" aria-label="${off ? 'Marcar como comido' : 'No lo he comido'}" aria-pressed="${!off}">${ICON.check}</button>
      <button class="grow info" ${r ? `data-act="openRec" data-id="${esc(r.id)}"` : ''} style="background:none;border:0;text-align:left;padding:0"><b>${esc(itemName(it))}</b>${r ? `<span class="isub">${esc(CATN(r.cat) || TYPES[r.ty])}</span>` : ''}</button>
      <span class="k num">${k ? nf(k * ml.f, 0) + ' kcal' : ''}</span></div>`;
  }).join('');
  return `<div class="mymeal"><div class="mymeal-h"><h3>${MEALN[m]}</h3>${isAlt ? '<span class="tag pop">Lo tuyo</span>' : ''}<button class="btn sm ghost" data-act="slot" data-date="${date}" data-m="${m}">Editar</button></div>
    ${rows || `<div class="mi"><span class="grow muted">Sin decidir todavía</span><button class="btn sm" data-act="slot" data-date="${date}" data-m="${m}">Elegir</button></div>`}
    <div class="mymeal-f"><span class="portion">${[[0.5,'½'],[1,'1'],[1.5,'1½'],[2,'2']].map(([v,t]) => `<button data-act="portion" data-date="${date}" data-m="${m}" data-v="${v}" aria-pressed="${ml.f === v}">${t}</button>`).join('')}</span>
      <button class="btn sm" data-act="altPick" data-date="${date}" data-m="${m}" data-pid="${esc(p.id)}">He comido otra cosa</button>
      ${isAlt ? `<button class="btn sm ghost" data-act="altClear" data-date="${date}" data-m="${m}" data-pid="${esc(p.id)}">Lo de la familia</button>` : ''}</div></div>`;
}
function reminders() {
  const t = todayISO(), tm = addDays(t, 1), out = [];
  for (const m of ['c','n']) {
    const s = getSlot(tm, m); if (!s) continue;
    for (const it of s.items) {
      const r = it.k === 'r' && rec(it.id); if (!r) continue;
      if (r.s.some(x => /remojo/i.test(x))) out.push(`<b>Esta noche:</b> pon en remojo lo de ${esc(r.n.toLowerCase())} (mañana, ${MEALN[m].toLowerCase()}).`);
      const meat = r.i.filter(([id]) => ['car','pes'].includes(ing(id).sec)).map(([id]) => ing(id).n.toLowerCase());
      if (meat.length) out.push(`<b>Si está congelado:</b> saca hoy ${esc(meat.slice(0,2).join(' y '))} para ${esc(r.n.toLowerCase())}.`);
    }
  }
  const old = Object.values(S.leftovers).filter(x => daysAgo(x.date) >= 3);
  old.forEach(x => out.push(`<b>En la nevera desde hace ${daysAgo(x.date)} días:</b> ${esc(x.n)}. Mejor comerlo ya o congelarlo.`));
  return out;
}
VIEWS.hoy = () => {
  const t = todayISO(), p = me(), tot = dayTotals(t, p.id), tk = targetK(t, p.id), l = getLog(t, p.id);
  const objN = {ganar:'Ganar músculo', perder:'Perder grasa', mantener:'Mantener'}[p.obj] || '';
  const pp = Math.min(100, Math.round(tot.pr / (p.prot || 1) * 100));
  const extras = l.extra.map((e, i) => `<div class="logrow"><span class="grow"><b>${esc(e.n)}</b>${e.g ? `<span class="isub">${e.g} g</span>` : ''}</span><span class="k num small muted">${nf(e.kcal,0)} kcal · ${nf(e.prot,0)} g</span><button class="btn sm ghost" data-act="logDel" data-i="${i}" aria-label="Quitar">×</button></div>`).join('');
  const rem = reminders();
  const tm = addDays(t, 1);
  const fr = Object.entries(S.leftovers).sort((a,b) => a[1].date.localeCompare(b[1].date));
  const sh = shopping(UI.shopRange);
  const others = profiles().filter(x => x.id !== p.id).map(x => { const tt = dayTotals(t, x.id); return `<div class="row" style="gap:8px">${avatar(x,'sm')}<span class="grow small"><b>${esc(x.n)}</b></span><span class="small muted num">${nf(tt.k,0)} / ${nf(targetK(t, x.id),0)} kcal</span></div>`; }).join('');
  return `
  <div class="hello">${avatar(p,'lg')}<div class="grow"><span class="eyebrow">${longDay(t)}</span><h1>Hola, ${esc(p.n)}</h1><span class="small muted">${objN}${l.entreno ? ' · Día de entreno' : ''}</span></div></div>
  <div class="card rings">${ring(tot.k, tk)}<div class="macro">
    <div><div class="kv"><span>Proteína</span><b class="num">${tot.pr} / ${p.prot} g</b></div><div class="bar"><i class="p" style="width:${pp}%"></i></div></div>
    <div class="kv"><span>Te quedan</span><b class="num">${nf(Math.max(0, tk - tot.k),0)} kcal</b></div>
    <div class="row" style="gap:6px"><button class="chip" data-act="entreno" aria-pressed="${!!l.entreno}">🏋️ Entreno hoy</button><button class="chip" data-act="yo">Mi semana</button></div></div></div>
  ${rem.length ? `<div class="stack">${rem.map(x => `<div class="remind">⏰<span>${x}</span></div>`).join('')}</div>` : ''}
  <section class="stack">${myMealCard(t, 'c', p)}${myMealCard(t, 'n', p)}</section>
  <section class="stack"><div class="sec-h"><h2>Desayuno, merienda y picoteo</h2><button class="btn sm pri" data-act="logAdd">Añadir</button></div>
    ${extras ? `<div class="list">${extras}</div>` : `<div class="empty small">¿Has desayunado o picado algo? Apúntalo y se suma a tus calorías.</div>`}
    <div class="row"><span class="small muted grow">Agua</span><div class="water">${[1,2,3,4,5,6,7,8].map(n => `<button class="${(l.agua||0) >= n ? 'on' : ''}" data-act="agua" data-n="${n}" aria-label="${n} vasos"></button>`).join('')}</div><span class="small num muted">${l.agua||0}/8</span></div></section>
  <section class="stack"><div class="sec-h"><h2>Mañana</h2><button class="btn sm ghost" data-act="tab" data-t="menu">Menú</button></div>
    <div class="card small">${['c','n'].map(m => `${MEALN[m]}: <b>${esc(slotText(getSlot(tm, m)) || 'sin decidir')}</b>`).join('<br>')}</div></section>
  ${fr.length ? `<section class="stack"><div class="sec-h"><h2>En la nevera</h2><button class="btn sm ghost" data-act="tab" data-t="casa">Casa</button></div><div class="list">${fr.map(([id, x]) => `<div class="fridge"><span class="grow"><b>${esc(x.n)}</b><span class="isub ${daysAgo(x.date) >= 3 ? 'old' : ''}">${daysAgo(x.date) === 0 ? 'De hoy' : 'Hace ' + daysAgo(x.date) + ' días'}</span></span></div>`).join('')}</div></section>` : ''}
  <section class="stack"><h2>La familia hoy</h2><div class="card stack" style="gap:8px">${others}</div></section>
  <button class="card row" data-act="tab" data-t="compra" style="text-align:left;width:100%"><span class="grow"><b class="num" style="font-family:var(--f-display);font-size:22px">${sh.pending.length + sh.exPending.length}</b> <span class="muted">cosas por comprar</span><br><span class="small muted num">Pendiente ~${eur(sh.pendingEur)}</span></span>${ICON.right}</button>
  ${Store.mode === 'local' ? `<div class="note small">Los cambios solo se guardan en este móvil.</div>` : ''}`;
};

// ---------- MENÚ ----------
function slotRow(date, m) {
  const s = getSlot(date, m);
  const alts = s ? Object.entries(s.alt).filter(([pid]) => prof(pid)).map(([pid, a]) => `<span class="altchip">${avatar(prof(pid),'sm')}${esc((a.items||[]).map(itemName).join(' + ') || '—')}</span>`).join('') : '';
  const items = s && s.items.length ? s.items.map(it => { const r = itemRecipe(it); return `<span class="it">${r ? catDot(r.cat) : ''}<span class="t">${esc(itemName(it))}</span></span>`; }).join('') : `<span class="nm empty-s">Elegir platos</span>`;
  return `<button class="slotbtn" data-act="slot" data-date="${date}" data-m="${m}"><span class="lbl">${MEALN[m]}</span>
    <span class="slot-items">${items}${alts ? `<span class="alts">${alts}</span>` : ''}</span>
    ${s && s.g ? `<span class="tag num">+${s.g}</span>` : ''}${s && s.done ? `<span class="done">${ICON.check.replace('<svg','<svg width="18" height="18"')}</span>` : ''}</button>`;
}
VIEWS.menu = () => {
  const wk = UI.week, dates = weekDates(wk), t = todayISO();
  const filled = dates.reduce((n, d) => n + ['c','n'].filter(m => (getSlot(d, m)||{items:[]}).items.length).length, 0);
  const counts = catCountsRange(dates);
  const st = parseD(wk), en = parseD(dates[6]);
  const title = st.getMonth() === en.getMonth() ? `${st.getDate()} – ${en.getDate()} ${MON[en.getMonth()]}` : `${st.getDate()} ${MON[st.getMonth()]} – ${en.getDate()} ${MON[en.getMonth()]}`;
  const h = habits();
  const bal = ['leg','pes','car','hue'].map(c => { const n = counts[c] || 0, tg = TARGETS[c]; return `<div class="bal ${n >= tg ? 'ok' : 'low'}"><div class="l">${catDot(c)}${CATN(c)}</div><div class="v num">${n}<small> / ${tg}</small></div></div>`; }).join('');
  const prevFilled = weekDates(addDays(wk, -7)).some(d => S.day[d]);
  const confirm = UI.confirm === 'regen:' + wk;
  return `
  <div class="weeknav"><button class="iconbtn" data-act="week" data-d="-7" aria-label="Semana anterior">${ICON.left}</button><h2 class="num">${title}</h2><button class="iconbtn" data-act="week" data-d="7" aria-label="Semana siguiente">${ICON.right}</button></div>
  ${wk !== weekOf(t) ? `<button class="btn sm ghost" data-act="week" data-d="0" style="align-self:center">Volver a esta semana</button>` : ''}
  <div class="balance">${bal}</div>
  ${filled === 0 ? `<div class="empty"><h3>Semana sin planificar</h3><p style="margin:0 0 12px">Propongo un menú equilibrado con vuestros platos${h.sundayOut ? ', con el domingo fuera' : ''}${h.sundayLeft ? ' y cena de sobras' : ''}.</p>
      <div class="row" style="justify-content:center"><button class="btn pri" data-act="gen" data-fill="1">Proponer menú</button>${prevFilled ? '<button class="btn" data-act="copyWeek">Copiar la semana anterior</button>' : ''}</div></div>` :
  `<div class="row">${filled < 14 ? '<button class="btn pri grow" data-act="gen" data-fill="1">Rellenar huecos</button>' : ''}
    ${confirm ? `<button class="btn danger grow" data-act="gen" data-fill="0">Sí, rehacer la semana</button><button class="btn ghost" data-act="cancelConfirm">No</button>` : `<button class="btn grow" data-act="askRegen">Proponer semana nueva</button>`}</div>`}
  <div class="stack">${dates.map(d => `<div class="day ${d === t ? 'is-today' : ''}"><div class="day-h"><h3>${DAYN[dow(d)]} ${parseD(d).getDate()}</h3>${d === t ? '<span class="tag acc">Hoy</span>' : ''}${dow(d) === h.big ? '<span class="tag">Compra grande</span>' : dow(d) === h.small ? '<span class="tag">Compra pequeña</span>' : ''}</div>${slotRow(d,'c')}${slotRow(d,'n')}</div>`).join('')}</div>
  <p class="small muted" style="margin:0">Cada comida puede tener varios platos (plato + ensalada + postre) y cada persona puede comer otra cosa. Objetivo semanal: 2 legumbres, 3 pescados, 3 carnes y 2 de huevo.</p>`;
};

// ---------- COMPRA ----------
const RANGES = [['next','Hasta la próxima compra'],['7','Próximos 7 días'],['nextweek','Semana que viene']];
VIEWS.compra = () => {
  const sh = shopping(UI.shopRange);
  const dates = shopDates(UI.shopRange);
  const itemRow = (it, got) => {
    const sub = [];
    if (it.q > 0) sub.push(fmtQty(it.q, it.g.u) + (it.packs > 1 || it.g.u === 'g' || it.g.u === 'ml' ? ` (${it.packs} paq.)` : ''));
    if (it.recs.length) sub.push(it.recs.slice(0,2).join(', ') + (it.recs.length > 2 ? '…' : '')); else if (it.fijo) sub.push('Básico de casa');
    const late = it.g.fl.includes('f') && it.days.length && daysAgo(it.days[0]) <= -4;
    return `<div class="item ${got ? 'got' : ''}"><button class="check" data-act="have" data-id="${esc(it.id)}" data-v="${got ? 0 : 1}" aria-label="${got ? 'Desmarcar' : 'Marcar como comprado'}">${ICON.check}</button>
      <button class="info" data-act="ingEdit" data-id="${esc(it.id)}"><span class="iname">${esc(it.g.n)}</span><span class="isub">${esc(sub.join(' · '))}</span></button>
      ${late && !got ? `<span class="tag">Para el ${esc(dayLabel(it.days[0]))}</span>` : ''}${it.g.fl.includes('l') && !got && lacNames() ? `<span class="tag pop">Sin lactosa: ${esc(lacNames())}</span>` : ''}
      <span class="price num">${it.price ? '~' + eur(it.price) : ''}</span></div>`;
  };
  const exRow = x => `<div class="item ${x.done ? 'got' : ''}"><button class="check" data-act="extraToggle" data-id="${esc(x.id)}" aria-label="Marcar">${ICON.check}</button><span class="grow iname">${esc(x.n)}</span><button class="btn sm ghost" data-act="extraDel" data-id="${esc(x.id)}">Quitar</button></div>`;
  const nothing = !sh.pending.length && !sh.exPending.length;
  return `
  <div class="chips">${RANGES.map(([k,l]) => `<button class="chip" data-act="shopRange" data-r="${k}" aria-pressed="${UI.shopRange === k}">${l}</button>`).join('')}</div>
  <span class="small muted">Menú del ${esc(dayLabel(dates[0]))} al ${esc(dayLabel(dates[dates.length-1]))}</span>
  <div class="sumbar"><div class="card"><span class="eyebrow">Pendiente</span><div class="big num">${eur(sh.pendingEur)}</div><span class="small muted num">${sh.pending.length + sh.exPending.length} productos</span></div>
    <div class="card"><span class="eyebrow">Estimado</span><div class="big num">${eur(sh.totalEur)}</div><span class="small muted">Precios aprox. Mercadona</span></div></div>
  <div class="addrow"><input class="search" id="newExtra" placeholder="Añadir algo a la lista…" value="${esc(UI.newExtra)}" data-in="newExtra" enterkeyhint="done"><button class="btn pri" data-act="addExtra">Añadir</button></div>
  ${nothing ? `<div class="empty"><h3>Nada pendiente</h3>Todo lo del menú está en casa o en el carro.</div>` : ''}
  ${groupBySec(sh.pending).map(([s, items]) => `<div class="group"><h3>${esc(secName(s))}</h3><div class="list">${items.map(it => itemRow(it, false)).join('')}</div></div>`).join('')}
  ${sh.exPending.length ? `<div class="group"><h3>Añadido a mano</h3><div class="list">${sh.exPending.map(exRow).join('')}</div></div>` : ''}
  ${(sh.got.length || sh.exGot.length) ? `<div class="group"><h3>En el carro</h3><div class="list">${sh.got.map(it => itemRow(it, true)).join('')}${sh.exGot.map(exRow).join('')}</div></div>` : ''}
  <div class="row"><button class="btn grow" data-act="shareList">Enviar lista por WhatsApp</button>${sh.exGot.length ? '<button class="btn ghost" data-act="clearExtras">Limpiar añadidos</button>' : ''}</div>
  ${sh.home.length ? `<details class="more"><summary>Ya hay en casa (${sh.home.length}) ›</summary><div class="list">${sh.home.map(it => `<div class="item"><button class="info" data-act="ingEdit" data-id="${esc(it.id)}"><span class="iname">${esc(it.g.n)}</span><span class="isub">${esc(it.q ? fmtQty(it.q, it.g.u) : 'Básico de casa')}</span></button><button class="toggle miss" data-act="have" data-id="${esc(it.id)}" data-v="0">Se acabó</button></div>`).join('')}</div></details>` : ''}
  <p class="small muted" style="margin:0">Las cantidades tienen en cuenta quién come en casa, los invitados y lo que cada uno come aparte. Al marcar algo como comprado pasa a "hay en casa".</p>`;
};

// ---------- CASA ----------
VIEWS.casa = () => {
  const q = UI.pantryQ.trim().toLowerCase();
  let ids = allIngIds().filter(id => !q || ing(id).n.toLowerCase().includes(q));
  if (UI.pantryF === 'miss') ids = ids.filter(id => !hasIt(id));
  if (UI.pantryF === 'have') ids = ids.filter(hasIt);
  if (UI.pantryF === 'fijo') ids = ids.filter(isFijo);
  const items = ids.map(id => ({id, g: ing(id)}));
  const fr = Object.entries(S.leftovers).sort((a,b) => a[1].date.localeCompare(b[1].date));
  return `
  <section class="stack"><div class="sec-h"><h2>Tápers en la nevera</h2><button class="btn sm" data-act="leftAdd">Añadir</button></div>
    ${fr.length ? `<div class="list">${fr.map(([id, x]) => `<div class="fridge"><span class="grow"><b>${esc(x.n)}</b><span class="isub ${daysAgo(x.date) >= 3 ? 'old' : ''}">${daysAgo(x.date) === 0 ? 'De hoy' : 'Hace ' + daysAgo(x.date) + ' días'}${x.rac ? ' · ' + x.rac + ' raciones' : ''}</span></span><button class="btn sm ghost" data-act="leftDel" data-id="${esc(id)}">Se acabó</button></div>`).join('')}</div>`
      : '<div class="empty small">Cuando hagáis un plato de los que dan sobras aparecerá aquí, con los días que lleva.</div>'}</section>
  <section class="stack"><h2>Despensa</h2>
  <input class="search" id="pantryQ" data-in="pantryQ" placeholder="Buscar producto…" value="${esc(UI.pantryQ)}" type="search">
  <div class="chips">${[['all','Todo'],['miss','Falta'],['have','Hay'],['fijo','Básicos ★']].map(([k,l]) => `<button class="chip" data-act="pantryF" data-f="${k}" aria-pressed="${UI.pantryF === k}">${l}</button>`).join('')}</div>
  <div class="row"><span class="small muted grow num">${allIngIds().filter(hasIt).length} productos en casa. La estrella marca los básicos, que entran solos en la lista cuando faltan.</span><button class="btn sm" data-act="ingEdit" data-id="">Nuevo producto</button></div>
  ${groupBySec(items).map(([s, list]) => `<div class="group"><h3>${esc(secName(s))}</h3><div class="list">${list.map(({id, g}) => { const h = hasIt(id), f = isFijo(id);
    return `<div class="item"><button class="star ${f ? 'on' : ''}" data-act="fijo" data-id="${esc(id)}" aria-label="${f ? 'Quitar de básicos' : 'Marcar como básico'}" aria-pressed="${f}">${ICON.star}</button>
      <button class="info" data-act="ingEdit" data-id="${esc(id)}"><span class="iname">${esc(g.n)}</span>${g.fl.includes('l') ? '<span class="isub">Contiene lactosa</span>' : dislikes().includes(id) ? '<span class="isub">No os gusta</span>' : ''}</button>
      <button class="toggle ${h ? 'have' : 'miss'}" data-act="have" data-id="${esc(id)}" data-v="${h ? 0 : 1}">${h ? 'Hay' : 'Falta'}</button></div>`; }).join('')}</div></div>`).join('') || '<div class="empty">No hay productos con ese filtro.</div>'}</section>`;
};

// ---------- RECETAS ----------
const REC_FILTERS = [['all','Platos'],['mine','♥ Mis favoritas'],['fam','♥ De la familia'],['leg','Legumbre'],['pes','Pescado'],['car','Carne'],['hue','Huevo'],['pas','Pasta y arroz'],['ver','Verdura'],['cap','Caprichos'],['acomp','Acompañamientos'],['postre','Postres'],['extra','Desayunos y meriendas'],['fast','≤ 20 min'],['lig','Ligeras'],['sl','Sin lactosa'],['solo','Solo para algunos'],['nueva','Nuevas'],['no','No me gustan']];
function filterRecipes(q, f) {
  q = (q || '').trim().toLowerCase();
  return allRecipes().filter(r => {
    if (q && !(r.n.toLowerCase().includes(q) || r.i.some(([id]) => ing(id).n.toLowerCase().includes(q)))) return false;
    if (f === 'extra') return ['des','mer','post'].includes(r.ty);
    if (f === 'acomp' || f === 'postre') return r.ty === f;
    if (f === 'any') return true;
    if (f === 'mine') return rateOf(r.id, ME) === 'love';
    if (f === 'no') return rateOf(r.id, ME) === 'no';
    if (r.ty !== 'plato') return false;
    if (f === 'all') return q ? true : (rateOf(r.id, ME) !== 'no');
    if (f === 'fam') return nLove(r.id) >= 2;
    if (f === 'fast') return r.t <= 20; if (f === 'lig') return r.lig; if (f === 'sl') return !hasLac(r);
    if (f === 'solo') return r.solo.length > 0; if (f === 'nueva') return r.src === 'nueva';
    if (CATS[f]) return r.cat === f;
    return true;
  }).sort((a,b) => (rateOf(b.id, ME) === 'love') - (rateOf(a.id, ME) === 'love') || a.n.localeCompare(b.n, 'es'));
}
const photoOf = rid => { const p = S.photos[rid]; return p && p.url; };
function recCard(r, act = 'openRec', extra = '') {
  const ph = photoOf(r.id);
  return `<button class="rcard cat-${r.cat}" data-act="${act}" data-id="${esc(r.id)}" ${extra}>${ph ? `<img class="thumb" src="${esc(ph)}" alt="" loading="lazy">` : '<span class="bar-c"></span>'}<span class="grow"><h3>${esc(r.n)}</h3>${recMeta(r)}</span></button>`;
}
VIEWS.recetas = () => {
  const list = filterRecipes(UI.recQ, UI.recF);
  return `
  <div class="row"><input class="search grow" id="recQ" data-in="recQ" placeholder="Buscar plato o ingrediente…" value="${esc(UI.recQ)}" type="search"><button class="btn pri" data-act="editRec" data-id="">Nueva</button></div>
  <div class="chips">${REC_FILTERS.map(([k,l]) => `<button class="chip" data-act="recFilter" data-f="${k}" aria-pressed="${UI.recF === k}">${l}</button>`).join('')}</div>
  <span class="small muted num">${list.length} recetas</span>
  <div class="rgrid">${list.map(r => recCard(r)).join('') || '<div class="empty">Ninguna receta coincide.</div>'}</div>`;
};

// ================= Hojas (pila) =================
const SHEETS = [];
function showTop() {
  const s = SHEETS[SHEETS.length - 1];
  if (!s) { $('#sheetWrap').hidden = true; document.body.style.overflow = ''; scheduleRender(); return; }
  $('#sheet').classList.toggle('full', !!s.full);
  $('#sheetBack').hidden = SHEETS.length < 2;
  $('#sheetTitle').textContent = typeof s.title === 'function' ? s.title() : s.title;
  $('#sheetBody').innerHTML = s.render(); $('#sheetBody').scrollTop = s.scroll || 0;
  $('#sheetWrap').hidden = false; document.body.style.overflow = 'hidden';
  if (s.mount) s.mount();
}
function openSheet(cfg) { const cur = SHEETS[SHEETS.length-1]; if (cur) cur.scroll = $('#sheetBody').scrollTop; SHEETS.push(cfg); showTop(); }
function closeSheet() { const s = SHEETS.pop(); if (s && s.onClose) s.onClose(); showTop(); scheduleRender(); }
function closeAll() { while (SHEETS.length) { const s = SHEETS.pop(); if (s.onClose) s.onClose(); } showTop(); }

// ---------- detalle de receta ----------
let recPeople = 4;
function recipeSheet(id) {
  recPeople = 4;
  openSheet({title: () => (rec(id) || {}).n || 'Receta', render: () => {
    const r = rec(id); if (!r) return '<div class="empty">Esta receta se ha borrado.</div>';
    const f = recPeople / 4, mine = rateOf(id, ME), ph = photoOf(id);
    const ings = r.i.map(([iid, q]) => { const g = ing(iid), h = hasIt(iid); return `<div class="ing"><span class="dot ${h ? 'h' : 'm'}" title="${h ? 'Hay en casa' : 'Falta'}"></span><span>${esc(g.n)}${dislikes().includes(iid) ? ' <span class="tag bad">No os gusta</span>' : ''}</span><span class="q num">${fmtQty(q * f, g.u)}</span></div>`; }).join('');
    const steps = r.s.map((s, i) => { const m = s.match(/\{(\d+)\}/); return `<li><div>${esc(s.replace(/\s*\{\d+\}/g, ''))}${m ? `<br><button class="tbtn" data-act="timer" data-min="${m[1]}" data-l="${esc(r.n.slice(0,28))} · paso ${i+1}">⏱ ${m[1]} min</button>` : ''}</div></li>`; }).join('');
    const others = profiles().filter(p => p.id !== ME && rateOf(id, p.id)).map(p => `<span class="rate">${avatar(p,'sm')}${esc(RATEN[rateOf(id, p.id)])}</span>`).join('');
    const pp = profiles().map(p => `<tr><td>${avatar(p,'sm')} <b>${esc(p.n)}</b></td><td class="n num">${nf(Math.round(r.m[0]*p.f),0)} kcal</td><td class="n num">${Math.round(r.m[1]*p.f)} g</td></tr>`).join('');
    return `
      ${ph ? `<img class="photo" src="${esc(ph)}" alt="Foto de ${esc(r.n)}">` : ''}
      <label class="btn sm ${ph ? 'ghost' : ''}" style="align-self:flex-start">📷 ${ph ? 'Cambiar foto' : 'Añadir foto'}<input type="file" accept="image/*" data-photo="${esc(id)}" hidden></label>
      ${recMeta(r)}
      <section class="stack" style="gap:8px"><span class="eyebrow">Tu valoración</span>
        <div class="seg">${['love','ok','no'].map(k => `<button data-act="rate" data-id="${esc(id)}" data-v="${k}" aria-pressed="${mine === k}">${RATEN[k]}</button>`).join('')}</div>
        ${others ? `<div class="rates">${others}</div>` : ''}</section>
      <div class="row">${r.ty !== 'des' && r.ty !== 'mer' && r.ty !== 'post' ? `<button class="btn pri grow" data-act="toMenu" data-id="${esc(id)}">Añadir al menú</button>` : `<button class="btn pri grow" data-act="logRecipe" data-id="${esc(id)}">Lo he tomado hoy</button>`}<button class="btn grow" data-act="cook" data-id="${esc(id)}">Cocinar paso a paso</button></div>
      ${r.so ? '<div class="note small">Cantidades para 8 raciones: comida para los 4 y otra de sobras.</div>' : ''}
      ${hasLac(r) && profiles().some(p => p.lac) ? `<div class="note small"><b>${esc(profiles().filter(p => p.lac).map(p => p.n).join(', '))}:</b> lleva lácteos con lactosa. Usad la versión sin lactosa o apartad su ración antes.</div>` : ''}
      <section class="stack"><div class="sec-h"><h2>Ingredientes</h2><div class="stepper"><button data-act="recPeople" data-d="-1" aria-label="Menos personas">−</button><span class="num">${recPeople}</span><button data-act="recPeople" data-d="1" aria-label="Más personas">+</button></div></div>
        <div class="card ings">${ings || '<span class="muted">Sin ingredientes</span>'}</div><span class="small muted">Punto verde: hay en casa. Rojo: falta.</span></section>
      ${steps ? `<section class="stack"><h2>Elaboración</h2><ol class="steps">${steps}</ol></section>` : ''}
      ${r.tip ? `<section class="stack"><h2>Trucos de cocina</h2><div class="note acc">${esc(r.tip)}</div></section>` : ''}
      ${r.no ? `<section class="stack"><h2>Notas</h2><div class="card">${esc(r.no)}</div></section>` : ''}
      <section class="stack"><h2>Por persona</h2><div class="card" style="padding:6px 12px"><table class="ptable"><tr><th>Ración</th><th class="n">Energía</th><th class="n">Prot.</th></tr>${pp}</table></div>
        <span class="small muted num">Ración estándar: ${r.m[0]} kcal · ${r.m[1]} g proteína · ${r.m[2]} g hidratos · ${r.m[3]} g grasa (aprox.)</span></section>
      <section class="stack" style="gap:8px"><span class="eyebrow">¿Para quién es?</span>
        <div class="chips" style="flex-wrap:wrap"><button class="chip" data-act="soloSet" data-id="${esc(id)}" data-p="" aria-pressed="${!r.solo.length}">Toda la familia</button>${profiles().map(p => `<button class="chip" data-act="soloSet" data-id="${esc(id)}" data-p="${esc(p.id)}" aria-pressed="${r.solo.includes(p.id)}">Solo ${esc(p.n)}</button>`).join('')}</div>
        <span class="small muted">Las recetas "solo para" no se proponen para la familia; aparecen como alternativa para esa persona.</span></section>
      <div class="row"><button class="btn grow" data-act="editRec" data-id="${esc(id)}">Editar receta</button><button class="btn grow" data-act="dupRec" data-id="${esc(id)}">Duplicar</button></div>
      ${r.edited ? `<button class="btn ghost" data-act="restoreRec" data-id="${esc(id)}">Volver a la receta original</button>` : ''}
      ${UI.confirm === 'del:' + id ? `<div class="row"><button class="btn danger grow" data-act="delRec" data-id="${esc(id)}">Sí, borrar receta</button><button class="btn ghost" data-act="cancelConfirm">Cancelar</button></div>` : `<button class="btn ghost danger" data-act="askDel" data-id="${esc(id)}">Borrar receta</button>`}`;
  }});
}
async function compressImage(file, max = 900) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
  const sc = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return await new Promise(res => c.toBlob(res, 'image/jpeg', 0.72));
}

// ---------- hueco del menú (familia) ----------
function slotSheet(date, m) {
  openSheet({title: () => `${longDay(date)} · ${MEALN[m]}`, render: () => {
    const s = slotOrEmpty(date, m);
    const dishes = s.items.map((it, i) => { const r = itemRecipe(it);
      return `<div class="dish">${r ? catDot(r.cat) : ''}<button class="grow info" style="background:none;border:0;text-align:left;padding:0" ${r ? `data-act="openRec" data-id="${esc(r.id)}"` : ''}><b>${esc(itemName(it))}</b>${r ? `<span class="isub">${esc(r.ty === 'plato' ? CATN(r.cat) : TYPES[r.ty])}${r.t ? ' · ' + r.t + ' min' : ''}</span>` : ''}</button><button class="x" data-act="itemDel" data-date="${date}" data-m="${m}" data-i="${i}" aria-label="Quitar">×</button></div>`; }).join('');
    const firstR = s.items.map(itemRecipe).find(Boolean);
    const sideHint = firstR && firstR.ty === 'plato' && !s.items.some(it => { const r = itemRecipe(it); return r && r.ty === 'acomp'; });
    const eaters = profiles().map(p => {
      const a = s.alt[p.id], noLike = s.items.some(it => it.k === 'r' && rateOf(it.id, p.id) === 'no');
      return `<div class="eater">${avatar(p)}<span class="grow"><b>${esc(p.n)}</b><small>${a ? esc((a.items||[]).map(itemName).join(' + ') || 'Otra cosa') : noLike ? 'No le gusta algún plato' : 'Come lo mismo'}</small></span>
        ${a ? `<button class="btn sm" data-act="altPick" data-date="${date}" data-m="${m}" data-pid="${esc(p.id)}">Cambiar</button><button class="btn sm ghost" data-act="altClear" data-date="${date}" data-m="${m}" data-pid="${esc(p.id)}">Lo mismo</button>`
          : `<button class="btn sm ${noLike ? 'pop' : ''}" data-act="altPick" data-date="${date}" data-m="${m}" data-pid="${esc(p.id)}">Otra cosa</button>`}</div>`;
    }).join('');
    const fridge = Object.entries(S.leftovers);
    return `
      <section class="stack"><div class="sec-h"><h2>Platos</h2>${s.done ? '<span class="tag acc">Hecho</span>' : ''}</div>
        ${dishes ? `<div class="list">${dishes}</div>` : '<div class="empty small">Todavía no hay nada. Añade uno o varios platos.</div>'}
        <button class="btn pri" data-act="addDish" data-date="${date}" data-m="${m}">Añadir plato</button>
        ${sideHint ? `<div class="row" style="gap:6px"><span class="small muted">Acompañar con:</span>${['a_ensalada','a_patatas','a_arroz','p_fruta'].filter(id => rec(id)).map(id => `<button class="chip" data-act="quickAdd" data-date="${date}" data-m="${m}" data-id="${id}">+ ${esc(rec(id).n)}</button>`).join('')}</div>` : ''}
        <div class="row" style="gap:6px"><button class="btn sm" data-act="special" data-date="${date}" data-m="${m}" data-k="fuera">Comemos fuera</button><button class="btn sm" data-act="special" data-date="${date}" data-m="${m}" data-k="sobras">Sobras</button>
          ${fridge.map(([id, x]) => `<button class="btn sm" data-act="special" data-date="${date}" data-m="${m}" data-k="sobras" data-of="${esc(x.rid || '')}">Sobras: ${esc(x.n)}</button>`).join('')}</div>
        <div class="addrow"><input class="search" id="slotTxt" placeholder="Otra cosa (ej. cumpleaños de la abuela)…" enterkeyhint="done"><button class="btn" data-act="setTxt" data-date="${date}" data-m="${m}">Poner</button></div></section>
      <section class="stack"><h2>Quién come</h2><div class="eaters">${eaters}</div>
        <div class="row"><span class="grow small">Invitados</span><div class="stepper"><button data-act="guests" data-date="${date}" data-m="${m}" data-d="-1" aria-label="Menos">−</button><span class="num">${s.g || 0}</span><button data-act="guests" data-date="${date}" data-m="${m}" data-d="1" aria-label="Más">+</button></div></div>
        <span class="small muted">La lista de la compra calcula las cantidades según quién come cada plato.</span></section>
      ${s.items.length ? `<div class="row">${s.done ? `<button class="btn grow" data-act="undone" data-date="${date}" data-m="${m}">Quitar "hecho"</button>` : `<button class="btn pri grow" data-act="cooked" data-date="${date}" data-m="${m}">Ya lo hemos hecho</button>`}
        ${UI.confirm === 'clr:' + date + m ? `<button class="btn danger" data-act="slotClear" data-date="${date}" data-m="${m}">Sí, vaciar</button>` : `<button class="btn ghost danger" data-act="askClr" data-date="${date}" data-m="${m}">Vaciar</button>`}</div>` : ''}`;
  }});
}
function updSlot(date, m, fn) { const s = clone(slotOrEmpty(date, m)); fn(s); writeSlot(date, m, s); }

// ---------- selector de platos ----------
let pickQ = '', pickF = 'sug';
function pickerSheet({date, m, pid, title, onPick}) {
  pickQ = ''; pickF = 'sug';
  const p = pid && prof(pid);
  openSheet({title: title || (p ? `${p.n}: otra cosa` : 'Añadir plato'), render: () => {
    let list;
    if (pickQ.trim()) list = filterRecipes(pickQ, 'any').slice(0, 30);
    else if (pickF === 'sug') list = suggestions(date, m, pid);
    else if (pickF === 'mine') list = allRecipes().filter(r => rateOf(r.id, pid || ME) === 'love');
    else list = filterRecipes('', pickF);
    const btn = r => `<button data-act="pickR" data-id="${esc(r.id)}">${catDot(r.cat)}<span class="grow"><b>${esc(r.n)}</b><br><span class="small muted">${esc(r.ty === 'plato' ? CATN(r.cat) : TYPES[r.ty])}${r.t ? ' · ' + r.t + ' min' : ''}${rateOf(r.id, pid || ME) === 'love' ? ' · ♥' : ''}${r.solo.length ? ' · solo ' + esc(r.solo.map(i => (prof(i)||{}).n).join(', ')) : ''}</span></span></button>`;
    return `
      ${p ? `<div class="row" style="gap:6px"><button class="btn sm" data-act="pickSpecial" data-k="fuera">Come fuera</button><button class="btn sm" data-act="pickSpecial" data-k="nada">No come</button></div>
        <div class="card stack" style="gap:8px"><span class="eyebrow">Otra cosa con calorías</span><div class="grid2"><div class="field"><label for="pkT">Qué</label><input id="pkT" placeholder="Ej. bocadillo"></div><div class="field"><label for="pkK">kcal (aprox.)</label><input id="pkK" type="number" inputmode="numeric"></div></div><button class="btn sm" data-act="pickTxt">Poner</button></div>` : ''}
      <input class="search" id="pickQ" data-in="pickQ" placeholder="Buscar plato o ingrediente…" value="${esc(pickQ)}" type="search">
      <div class="chips picker-tabs">${[['sug','Sugerencias'],['all','Platos'],['acomp','Acompañamientos'],['postre','Postres'],['mine','♥ Favoritos'],['extra','Desayunos']].map(([k,l]) => `<button class="chip" data-act="pickF" data-f="${k}" aria-pressed="${!pickQ.trim() && pickF === k}">${l}</button>`).join('')}</div>
      <div class="sugg">${list.map(btn).join('') || '<div class="empty small">Nada por aquí.</div>'}</div>`;
  }, onPick});
}
function curPicker() { const s = SHEETS[SHEETS.length-1]; return s && s.onPick ? s : null; }

// ---------- añadir al menú desde receta ----------
let pickWeek = null;
function toMenuSheet(id) {
  pickWeek = weekOf(todayISO());
  openSheet({title: 'Añadir al menú', render: () => {
    const r = rec(id), cw = weekOf(todayISO());
    const rows = weekDates(pickWeek).map(d => `<span class="d">${dayLabel(d)}</span>` + ['c','n'].map(m => { const s = getSlot(d, m); return `<button class="${s && s.items.length ? 'filled' : ''}" data-act="pickSlot" data-date="${d}" data-m="${m}" data-id="${esc(id)}"><b>${MEALN[m]}</b><br>${esc(slotText(s) || 'Libre')}</button>`; }).join('')).join('');
    return `<b>${esc(r ? r.n : '')}</b><div class="seg"><button data-act="pickWeek" data-w="${cw}" aria-pressed="${pickWeek === cw}">Esta semana</button><button data-act="pickWeek" data-w="${addDays(cw,7)}" aria-pressed="${pickWeek !== cw}">Semana que viene</button></div>
      <div class="pick">${rows}</div><span class="small muted">Se añade a lo que ya haya en esa comida.</span>`;
  }});
}

// ---------- ya cocinado ----------
function cookedSheet(date, m) {
  const s = getSlot(date, m); if (!s) return;
  const rs = [...new Set(s.items.filter(it => it.k === 'r').map(it => it.id))].map(rec).filter(Boolean);
  const ids = [...new Set(rs.flatMap(r => r.i.map(([id]) => id)))].filter(id => !ing(id).fl.includes('b'));
  const so = rs.filter(r => r.so);
  openSheet({title: '¿Qué se ha acabado?', static: true, render: () => `
    <p class="small muted" style="margin:0">Marca lo que ya no queda en casa. Pasará a la lista de la compra cuando vuelva a hacer falta.</p>
    <div class="list">${ids.map(id => `<label class="item"><input type="checkbox" class="used" value="${esc(id)}" ${ing(id).fl.includes('f') ? 'checked' : ''} style="width:22px;height:22px"><span class="grow iname">${esc(ing(id).n)}</span></label>`).join('') || '<div class="item muted">No hay ingredientes que apuntar.</div>'}</div>
    ${so.length ? `<label class="row small"><input type="checkbox" id="toFridge" checked> Guardar las sobras en la nevera (${esc(so.map(r => r.n).join(', '))})</label>` : ''}
    <button class="btn pri block" data-act="cookedSave" data-date="${date}" data-m="${m}">Guardar</button>`});
}

// ---------- modo cocinar ----------
let cook = null, wakeLock = null;
async function lockScreen() { try { if (navigator.wakeLock) wakeLock = await navigator.wakeLock.request('screen'); } catch(e) {} }
function cookSheet(id) {
  cook = {id, i: 0}; lockScreen();
  openSheet({full: true, title: () => (rec(id) || {}).n || 'Cocinar', onClose: () => { try { wakeLock && wakeLock.release(); } catch(e) {} wakeLock = null; cook = null; }, render: () => {
    const r = rec(id); if (!r || !cook) return '';
    const n = r.s.length, i = Math.min(cook.i, n);
    if (i === n) return `<div class="empty"><h3>¡Listo!</h3>Que aproveche.</div><div class="cook-nav"><button class="btn" data-act="cookNav" data-d="-1">Atrás</button><button class="btn pri" data-act="closeSheet">Terminar</button></div>`;
    const s = r.s[i], mm = s.match(/\{(\d+)\}/);
    return `<span class="eyebrow num">Paso ${i+1} de ${n}</span><div class="bar"><i style="width:${Math.round((i+1)/n*100)}%"></i></div>
      <p class="cook-step">${esc(s.replace(/\s*\{\d+\}/g, ''))}</p>
      ${mm ? `<button class="btn pop" data-act="timer" data-min="${mm[1]}" data-l="${esc(r.n.slice(0,28))} · paso ${i+1}">⏱ Temporizador ${mm[1]} min</button>` : ''}
      ${i === 0 ? `<details class="more"><summary>Ingredientes ›</summary><div class="card ings">${r.i.map(([iid,q]) => `<div class="ing"><span>${esc(ing(iid).n)}</span><span class="q num">${fmtQty(q, ing(iid).u)}</span></div>`).join('')}</div></details>` : ''}
      <span class="small muted">La pantalla se mantiene encendida mientras cocinas.</span>
      <div class="cook-nav"><button class="btn" data-act="cookNav" data-d="-1" ${i === 0 ? 'disabled' : ''}>Anterior</button><button class="btn pri" data-act="cookNav" data-d="1">${i === n-1 ? 'Terminar' : 'Siguiente'}</button></div>`;
  }});
}

// ---------- añadir a mi registro ----------
let logQ = '', offRes = null, offBusy = false, offErr = '';
function logAddSheet(date) {
  logQ = ''; offRes = null; offErr = '';
  openSheet({title: 'Añadir a mi día', render: () => {
    const p = me();
    const recs = allRecipes().filter(r => ['des','mer','post','postre'].includes(r.ty)).filter(r => !logQ || r.n.toLowerCase().includes(logQ.toLowerCase()));
    return `
      <section class="stack"><span class="eyebrow">Rápido</span><div class="qchips">${SNACKS.map((s, i) => `<button class="chip" data-act="logSnack" data-i="${i}">${esc(s[0])} <span class="muted">${s[1]}</span></button>`).join('')}</div></section>
      <section class="stack"><span class="eyebrow">Desayunos, meriendas y postres</span><div class="sugg">${recs.map(r => `<button data-act="logRecipe" data-id="${esc(r.id)}">${catDot(r.cat)}<span class="grow"><b>${esc(r.n)}</b><br><span class="small muted num">${Math.round(r.m[0]*p.f)} kcal · ${Math.round(r.m[1]*p.f)} g prot. para ti</span></span></button>`).join('')}</div></section>
      <section class="card stack"><span class="eyebrow">A mano</span>
        <div class="field"><label for="lgN">Qué</label><input id="lgN" placeholder="Ej. pincho de tortilla"></div>
        <div class="grid2"><div class="field"><label for="lgK">kcal</label><input id="lgK" type="number" inputmode="numeric"></div><div class="field"><label for="lgP">Proteína (g)</label><input id="lgP" type="number" inputmode="numeric"></div></div>
        <button class="btn" data-act="logManual">Añadir</button></section>
      <section class="card stack"><span class="eyebrow">Buscar un producto (Open Food Facts)</span>
        <div class="addrow"><input class="search" id="offQ" placeholder="Nombre o código de barras" enterkeyhint="search"><button class="btn" data-act="offSearch">${offBusy ? 'Buscando…' : 'Buscar'}</button></div>
        ${offErr ? `<span class="small" style="color:var(--bad)">${esc(offErr)}</span>` : ''}
        ${offRes ? (offRes.length ? `<div class="sugg">${offRes.map((x, i) => `<button data-act="offPick" data-i="${i}"><span class="grow"><b>${esc(x.n)}</b><br><span class="small muted num">${esc(x.b || '')} · ${nf(x.k,0)} kcal y ${nf(x.p)} g prot. por 100 g</span></span></button>`).join('')}</div>` : '<span class="small muted">Sin resultados.</span>') : '<span class="small muted">Datos abiertos de productos de supermercado, incluidos los de Mercadona.</span>'}
      </section>`;
  }, date});
}
function addLog(date, entry) { patchLog(date, ME, l => l.extra.push({id: uid(), ...entry})); }
async function offSearch(q) {
  if (!q) return; offBusy = true; offErr = ''; scheduleRender();
  try {
    const fields = 'product_name,product_name_es,brands,nutriments,code';
    const url = /^\d{8,14}$/.test(q) ? `https://world.openfoodfacts.org/api/v2/product/${q}.json?fields=${fields}` : `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=15&fields=${fields}`;
    const r = await fetch(url); if (!r.ok) throw new Error('http');
    const j = await r.json(); const prods = j.product ? [j.product] : (j.products || []);
    offRes = prods.map(x => ({n: x.product_name_es || x.product_name || 'Producto', b: x.brands, k: Number((x.nutriments||{})['energy-kcal_100g']) || 0, p: Number((x.nutriments||{}).proteins_100g) || 0})).filter(x => x.k > 0);
  } catch(e) { offErr = 'No se ha podido consultar Open Food Facts. Revisa la conexión.'; offRes = null; }
  offBusy = false; scheduleRender();
}

// ---------- editor de recetas ----------
function editRecSheet(id, dupOf) {
  const src = id ? rec(id) : dupOf ? rec(dupOf) : null;
  const r = src ? clone(src) : {n:'', cat:'car', sl:'cn', t:30, ty:'plato', i:[], s:[], m:[500,30,40,20], tip:'', no:''};
  if (dupOf) r.n += ' (variante)';
  $('#ingList').innerHTML = allIngIds().map(i => `<option value="${esc(ing(i).n)}"></option>`).join('');
  const erow = (iid, q) => { const g = iid ? ing(iid) : null; return `<div class="erow"><input class="e-n" list="ingList" value="${esc(g ? g.n : '')}" placeholder="Ingrediente" aria-label="Ingrediente"><input class="e-q" type="number" inputmode="decimal" min="0" step="any" value="${q || ''}" placeholder="0" aria-label="Cantidad"><span class="u">${esc(g ? g.u : '')}</span><button type="button" data-act="eRowDel" aria-label="Quitar">×</button></div>`; };
  window.__erow = erow;
  openSheet({title: id ? 'Editar receta' : 'Nueva receta', static: true, render: () => `
    <div class="field"><label for="eN">Nombre</label><input id="eN" value="${esc(r.n)}"></div>
    <div class="grid2"><div class="field"><label for="eTy">Tipo</label><select id="eTy">${Object.entries(TYPES).map(([k,l]) => `<option value="${k}" ${r.ty === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="field"><label for="eCat">Categoría</label><select id="eCat">${Object.entries(CATS).map(([k,l]) => `<option value="${k}" ${r.cat === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="field"><label for="eSl">Para</label><select id="eSl">${[['cn','Comida o cena'],['c','Comida'],['n','Cena']].map(([k,l]) => `<option value="${k}" ${r.sl === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="field"><label for="eT">Minutos</label><input id="eT" type="number" inputmode="numeric" value="${r.t}"></div></div>
    <label class="row small"><input type="checkbox" id="eSo" ${r.so ? 'checked' : ''}> Se hace el doble para tener sobras (8 raciones)</label>
    <label class="row small"><input type="checkbox" id="eLig" ${r.lig ? 'checked' : ''}> Plato ligero</label>
    <section class="stack"><h2>Ingredientes para 4</h2><div id="eRows" class="stack" style="gap:6px">${r.i.map(([a,b]) => erow(a,b)).join('')}${erow('',0)}</div>
      <button type="button" class="btn sm" data-act="eRowAdd">Añadir ingrediente</button><span class="small muted">Elige de la lista o escribe uno nuevo. Cantidad 0 = al gusto.</span></section>
    <div class="field"><label for="eS">Pasos (uno por línea)</label><textarea id="eS" rows="7">${esc(r.s.join('\n'))}</textarea><span class="small muted">Escribe {10} en un paso para poner un temporizador de 10 minutos.</span></div>
    <div class="field"><label for="eTip">Trucos (Thermomix, Fusioncook, freidora…)</label><textarea id="eTip" rows="3" style="min-height:70px">${esc(r.tip || '')}</textarea></div>
    <div class="field"><label for="eNo">Notas</label><textarea id="eNo" rows="3" style="min-height:70px">${esc(r.no || '')}</textarea></div>
    <section class="stack"><h2>Por ración estándar (aprox.)</h2><div class="grid2">${['kcal','Proteína (g)','Hidratos (g)','Grasa (g)'].map((l,i) => `<div class="field"><label for="eM${i}">${l}</label><input id="eM${i}" type="number" inputmode="numeric" value="${r.m[i]}"></div>`).join('')}</div></section>
    <button class="btn pri block" data-act="saveRec" data-id="${esc(id || '')}" data-solo="${esc((r.solo||[]).join(','))}">Guardar receta</button>`});
}
const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40) || 'item';
const findIngByName = n => { const k = n.trim().toLowerCase(); return allIngIds().find(id => ing(id).n.toLowerCase() === k); };
function saveRecipe(id, solo) {
  const b = $('#sheetBody'), v = sel => b.querySelector(sel).value;
  const n = v('#eN').trim(); if (!n) { toast('Ponle un nombre a la receta.'); return; }
  const items = [];
  b.querySelectorAll('.erow').forEach(row => {
    const nm = row.querySelector('.e-n').value.trim(); if (!nm) return;
    let iid = findIngByName(nm);
    if (!iid) { iid = 'c_' + slug(nm); if (!S.ingr[iid]) Store.set('ingr', iid, {n: nm, sec:'otr', u:'ud', pk:1, pr:0, fl:''}); }
    items.push([iid, Number(row.querySelector('.e-q').value) || 0]);
  });
  const ty = v('#eTy');
  const data = {n, ty, cat: v('#eCat'), sl: v('#eSl'), t: Number(v('#eT')) || 0, so: b.querySelector('#eSo').checked ? 1 : 0, lig: b.querySelector('#eLig').checked ? 1 : 0,
    i: items, s: v('#eS').split('\n').map(x => x.trim()).filter(Boolean), tip: v('#eTip').trim(), no: v('#eNo').trim(), m: [0,1,2,3].map(i => Number(v('#eM'+i)) || 0), solo: solo ? solo.split(',').filter(Boolean) : []};
  const base = id && RECIPES.find(x => x.id === id); if (base && base.src) data.src = base.src;
  const nid = id || ('u_' + uid());
  Store.set('recipes', nid, data); RC = null;
  toast('Receta guardada'); closeSheet(); if (!id) recipeSheet(nid);
}
function setRecipeField(id, partial) {
  const base = RECIPES.find(x => x.id === id), cur = S.recipes[id];
  Store.set('recipes', id, {...(cur || {}), ...partial}); RC = null;
  void base;
}

// ---------- producto ----------
function ingSheet(id) {
  const g = id ? ing(id) : {n:'', sec:'otr', u:'ud', pk:1, pr:0, fl:''};
  const used = id ? allRecipes().filter(r => r.i.some(([x]) => x === id)) : [];
  openSheet({title: id ? g.n : 'Nuevo producto', static: true, render: () => `
    ${id ? `<div class="row"><span class="grow">En casa</span><button class="toggle ${hasIt(id) ? 'have' : 'miss'}" data-act="haveSheet" data-id="${esc(id)}">${hasIt(id) ? 'Hay' : 'Falta'}</button></div>` : ''}
    <div class="field"><label for="gN">Nombre</label><input id="gN" value="${esc(g.n)}"></div>
    <div class="grid2"><div class="field"><label for="gSec">Sección</label><select id="gSec">${SECTIONS.map(([k,l]) => `<option value="${k}" ${g.sec === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="field"><label for="gU">Unidad</label><select id="gU">${Object.keys(PL).map(u => `<option ${g.u === u ? 'selected' : ''}>${u}</option>`).join('')}</select></div>
      <div class="field"><label for="gPk">Tamaño del paquete</label><input id="gPk" type="number" inputmode="decimal" step="any" value="${g.pk}"></div>
      <div class="field"><label for="gPr">Precio paquete (€)</label><input id="gPr" type="number" inputmode="decimal" step="0.01" value="${g.pr}"></div></div>
    <label class="row small"><input type="checkbox" id="gB" ${g.fl.includes('b') ? 'checked' : ''}> Básico de despensa (aceite, sal, especias…): se da por hecho que hay</label>
    <label class="row small"><input type="checkbox" id="gL" ${g.fl.includes('l') ? 'checked' : ''}> Contiene lactosa</label>
    ${id ? `<label class="row small"><input type="checkbox" id="gD" ${dislikes().includes(id) ? 'checked' : ''}> No nos gusta (no se proponen platos que lo lleven)</label>` : ''}
    <button class="btn pri block" data-act="ingSave" data-id="${esc(id || '')}">Guardar</button>
    ${used.length ? `<section class="stack"><h2>Se usa en</h2><div class="small muted">${used.map(r => esc(r.n)).join(' · ')}</div></section>` : ''}`});
}

// ---------- Yo (perfil personal) ----------
function sparkline(pts) {
  if (pts.length < 2) return '';
  const W = 320, H = 90, P = 18, xs = pts.map((_, i) => P + i * (W - 2*P) / (pts.length - 1));
  const vals = pts.map(p => p[1]), mn = Math.min(...vals) - 0.5, mx = Math.max(...vals) + 0.5;
  const y = v => H - P - (v - mn) / (mx - mn) * (H - 2*P);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${xs[i].toFixed(1)},${y(p[1]).toFixed(1)}`).join('');
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path class="ar" d="${d}L${xs[xs.length-1]},${H-P}L${xs[0]},${H-P}Z"/><path class="ln" d="${d}"/>
    <circle class="pt" cx="${xs[xs.length-1]}" cy="${y(vals[vals.length-1])}" r="4.5"/><text x="${P}" y="12">${nf(Math.max(...vals))} kg</text><text x="${P}" y="${H-3}">${nf(Math.min(...vals))} kg</text></svg>`;
}
function yoSheet() {
  openSheet({title: 'Mi semana', render: () => {
    const p = me(), t = todayISO(), wk = weekOf(t), dates = weekDates(wk);
    const data = dates.map(d => ({d, ...dayTotals(d, p.id), tg: targetK(d, p.id), has: hasData(d, p.id) && d <= t}));
    const mx = Math.max(...data.map(x => Math.max(x.k, x.tg)), 1);
    const past = data.filter(x => x.has && x.d < t);
    const avgK = past.length ? past.reduce((a, x) => a + x.k, 0) / past.length : 0, avgP = past.length ? past.reduce((a, x) => a + x.pr, 0) / past.length : 0;
    const w = (S.weight[p.id] && S.weight[p.id].pts) || {};
    const wpts = Object.entries(w).sort((a,b) => a[0].localeCompare(b[0])).slice(-30);
    const last = wpts[wpts.length-1], first = wpts[0];
    const favs = allRecipes().filter(r => rateOf(r.id, p.id) === 'love');
    return `
      <div class="hello">${avatar(p,'lg')}<div class="grow"><h1>${esc(p.n)}</h1><span class="small muted">${esc({ganar:'Ganar músculo', perder:'Perder grasa', mantener:'Mantener'}[p.obj] || '')} · ${nf(p.kcal,0)} kcal · ${p.prot} g proteína</span></div></div>
      <section class="stack"><h2>Esta semana</h2><div class="card stack"><div class="wchart"><div class="wbars">${data.map(x => `<div class="wbar"><span class="num">${x.has ? nf(x.k/1000,1) + 'k' : ''}</span><i class="${!x.has ? 'none' : x.k > x.tg * 1.08 ? 'over' : ''}" style="height:${Math.max(2, Math.round((x.has ? x.k : 0) / mx * 100))}%"></i><span>${DAYS[dow(x.d)]}</span></div>`).join('')}</div>
</div>
        <div class="kv"><span>Media días pasados</span><b class="num">${past.length ? nf(avgK,0) + ' kcal · ' + nf(avgP,0) + ' g prot.' : 'sin datos'}</b></div></div>
        <span class="small muted">Tu objetivo es ${nf(p.kcal,0)} kcal al día (más en días de entreno). Naranja: te has pasado más de un 8 %. Cifras aproximadas.</span></section>
      <section class="stack"><h2>Peso</h2><div class="card stack">
        ${wpts.length >= 2 ? sparkline(wpts) : '<span class="small muted">Apunta tu peso de vez en cuando (mejor en ayunas) y verás la evolución.</span>'}
        ${last ? `<div class="kv"><span>Último: ${esc(dayLabel(last[0]))}</span><b class="num">${nf(last[1])} kg${first && first !== last ? ` (${last[1] - first[1] >= 0 ? '+' : ''}${nf(last[1] - first[1])} kg)` : ''}</b></div>` : ''}
        <div class="addrow"><input class="search" id="wIn" type="number" inputmode="decimal" step="0.1" placeholder="Peso de hoy (kg)"><button class="btn pri" data-act="weightSave">Guardar</button></div></div></section>
      <section class="stack"><h2>Mis favoritas</h2>${favs.length ? `<div class="rgrid">${favs.map(r => recCard(r)).join('')}</div>` : '<div class="empty small">Marca recetas con "Me encanta" y aparecerán aquí.</div>'}</section>
      <div class="row"><button class="btn grow" data-act="profEdit" data-id="${esc(p.id)}">Editar mi perfil</button><button class="btn grow" data-act="switchMe">Cambiar de persona</button></div>`;
  }});
}

// ---------- editor de perfil ----------
function calcNeeds(x) {
  const w = Number(x.peso), h = Number(x.altura), a = Number(x.edad); if (!w || !h || !a) return null;
  const bmr = 10*w + 6.25*h - 5*a + (x.sexo === 'hombre' ? 5 : -161);
  const act = {baja:1.3, media:1.5, alta:1.65, muy:1.8}[x.act || 'media'];
  const goal = {perder:0.85, ganar:1.1, mantener:1}[x.obj] || 1;
  const kcal = Math.round(bmr * act * goal / 50) * 50;
  const prot = Math.round(w * ({perder:1.8, ganar:1.9, mantener:1.4}[x.obj] || 1.5) / 5) * 5;
  return {kcal, prot, f: Math.round(kcal / 2300 * 20) / 20};
}
function profSheet(pid) {
  const isNew = !pid; const p = isNew ? {id: 'p_' + uid(), n:'', av:'⭐', col: PCOLORS[profiles().length % PCOLORS.length], edad:30, sexo:'mujer', obj:'mantener', kcal:2000, prot:100, f:1, act:'media'} : clone(prof(pid));
  let pv = p;
  openSheet({title: isNew ? 'Nueva persona' : 'Perfil de ' + p.n, static: true, render: () => `
    <div class="row">${avatar(pv,'lg')}<div class="field grow"><label for="fN">Nombre</label><input id="fN" value="${esc(pv.n)}"></div></div>
    <span class="eyebrow">Icono</span><div class="emojis">${AV_EMOJIS.map(e => `<button data-act="pfAv" data-v="${e}" aria-pressed="${pv.av === e}">${e}</button>`).join('')}</div>
    <span class="eyebrow">Color</span><div class="swatches">${PCOLORS.map(c => `<button class="swatch" style="background:${c}" data-act="pfCol" data-v="${c}" aria-pressed="${pv.col === c}" aria-label="Color"></button>`).join('')}</div>
    <div class="grid2">
      <div class="field"><label for="fS">Sexo</label><select id="fS"><option value="mujer" ${pv.sexo === 'mujer' ? 'selected' : ''}>Mujer</option><option value="hombre" ${pv.sexo === 'hombre' ? 'selected' : ''}>Hombre</option></select></div>
      <div class="field"><label for="fE">Edad</label><input id="fE" type="number" inputmode="numeric" value="${pv.edad || ''}"></div>
      <div class="field"><label for="fW">Peso (kg)</label><input id="fW" type="number" inputmode="decimal" step="0.1" value="${pv.peso || ''}"></div>
      <div class="field"><label for="fH">Altura (cm)</label><input id="fH" type="number" inputmode="numeric" value="${pv.altura || ''}"></div>
      <div class="field"><label for="fA">Actividad</label><select id="fA">${[['baja','Poca'],['media','3-4 entrenos/semana'],['alta','5-6 entrenos/semana'],['muy','Muy alta']].map(([k,l]) => `<option value="${k}" ${(pv.act||'media') === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="field"><label for="fO">Objetivo</label><select id="fO">${[['mantener','Mantener'],['ganar','Ganar músculo'],['perder','Perder grasa']].map(([k,l]) => `<option value="${k}" ${pv.obj === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>
    <button class="btn" data-act="pfCalc">Calcular calorías y proteína</button>
    <div class="grid2">
      <div class="field"><label for="fK">kcal al día</label><input id="fK" type="number" inputmode="numeric" value="${pv.kcal}"></div>
      <div class="field"><label for="fP">Proteína (g/día)</label><input id="fP" type="number" inputmode="numeric" value="${pv.prot}"></div>
      <div class="field"><label for="fF">Tamaño de ración</label><input id="fF" type="number" inputmode="decimal" step="0.05" value="${pv.f}"></div>
      <div class="field"><label for="fX">kcal extra día de entreno</label><input id="fX" type="number" inputmode="numeric" value="${pv.entr ?? 300}"></div></div>
    <span class="small muted">Tamaño de ración: 1 = ración estándar de la receta; 1,3 = un 30 % más. Las cifras son orientativas, no sustituyen a un nutricionista.</span>
    <label class="row small"><input type="checkbox" id="fL" ${pv.lac ? 'checked' : ''}> Intolerancia a la lactosa</label>
    <button class="btn pri block" data-act="pfSave" data-id="${esc(p.id)}" data-new="${isNew ? 1 : 0}">Guardar</button>
    ${!isNew && profiles().length > 1 ? (UI.confirm === 'pdel:' + p.id ? `<button class="btn danger block" data-act="pfDel" data-id="${esc(p.id)}">Sí, quitar a ${esc(p.n)}</button>` : `<button class="btn ghost danger" data-act="askPDel" data-id="${esc(p.id)}">Quitar esta persona</button>`) : ''}`,
    getP: () => pv, setP: x => { pv = x; }});
}
function readProfForm(base) {
  const b = $('#sheetBody'), v = s => b.querySelector(s).value;
  return {...base, n: v('#fN').trim() || base.n || 'Sin nombre', sexo: v('#fS'), edad: Number(v('#fE')) || null, peso: Number(v('#fW')) || null, altura: Number(v('#fH')) || null, act: v('#fA'), obj: v('#fO'),
    kcal: Number(v('#fK')) || 2000, prot: Number(v('#fP')) || 100, f: Number(v('#fF')) || 1, entr: Number(v('#fX')) || 0, lac: b.querySelector('#fL').checked};
}

// ---------- ajustes ----------
function settingsSheet() {
  openSheet({title: 'Ajustes', render: () => {
    const h = habits(), dl = dislikes();
    return `
      <section class="stack"><h2>Apariencia</h2>
        <div class="seg">${[['auto','Automático'],['light','Claro'],['dark','Oscuro']].map(([k,l]) => `<button data-act="theme" data-v="${k}" aria-pressed="${THEME === k}">${l}</button>`).join('')}</div>
        <div class="field"><label for="stName">Nombre de la app</label><div class="addrow"><input id="stName" value="${esc(appName())}" class="search"><button class="btn" data-act="stName">Guardar</button></div></div>
        <span class="eyebrow">Icono</span><div class="emojis">${APP_EMOJIS.map(e => `<button data-act="stIcon" data-v="${e}" aria-pressed="${appIcon() === e}">${e}</button>`).join('')}</div>
        <span class="eyebrow">Color</span><div class="swatches">${Object.entries(ACCENTS).map(([k, a]) => `<button class="swatch" style="background:${a.l[0]}" data-act="stAccent" data-v="${k}" aria-pressed="${accentKey() === k}" aria-label="${a.n}"></button>`).join('')}</div>
        <span class="small muted">El tema se guarda en cada móvil. El nombre, el icono y el color son para toda la familia. Si ya tenéis la app en la pantalla de inicio, volved a añadirla para ver el icono nuevo.</span></section>
      <section class="stack"><h2>Familia</h2><div class="eaters">${profiles().map(p => `<div class="eater">${avatar(p)}<span class="grow"><b>${esc(p.n)}</b><small>${esc({ganar:'Ganar músculo', perder:'Perder grasa', mantener:'Mantener'}[p.obj] || '')} · ${nf(p.kcal,0)} kcal${p.lac ? ' · sin lactosa' : ''}</small></span><button class="btn sm" data-act="profEdit" data-id="${esc(p.id)}">Editar</button></div>`).join('')}</div>
        <button class="btn" data-act="profEdit" data-id="">Añadir persona</button></section>
      <section class="stack"><h2>No nos gusta</h2><div class="qchips">${dl.map(id => `<button class="chip" data-act="dislikeDel" data-id="${esc(id)}">${esc(ing(id).n)} ×</button>`).join('') || '<span class="small muted">Nada</span>'}</div>
        <div class="addrow"><input class="search" id="dlIn" list="ingList" placeholder="Añadir ingrediente…"><button class="btn" data-act="dislikeAdd">Añadir</button></div>
        <span class="small muted">No se proponen platos que lleven estos ingredientes.</span></section>
      <section class="stack"><h2>Costumbres</h2>
        <label class="row small"><input type="checkbox" data-hab="sundayOut" ${h.sundayOut ? 'checked' : ''}> Domingo: comemos fuera</label>
        <label class="row small"><input type="checkbox" data-hab="sundayLeft" ${h.sundayLeft ? 'checked' : ''}> Domingo: cena de sobras</label>
        <div class="grid2"><div class="field"><label for="hBig">Compra grande</label><select id="hBig" data-habsel="big">${DAYN.map((d,i) => `<option value="${i}" ${h.big === i ? 'selected' : ''}>${d}</option>`).join('')}</select></div>
          <div class="field"><label for="hSmall">Compra pequeña</label><select id="hSmall" data-habsel="small">${DAYN.map((d,i) => `<option value="${i}" ${h.small === i ? 'selected' : ''}>${d}</option>`).join('')}</select></div></div></section>
      ${Store.mode === 'supabase' ? `<section class="stack"><h2>Contraseña de la familia</h2><div class="addrow"><input class="search" id="newPw" type="password" autocomplete="new-password" placeholder="Nueva contraseña (mín. 8)"><button class="btn" data-act="pwSave">Cambiar</button></div>
        <span class="small muted">Al cambiarla, los demás móviles siguen dentro. Solo hará falta la nueva al entrar desde un móvil nuevo.</span>
        <button class="btn ghost danger" data-act="logout">Cerrar sesión en este móvil</button></section>` : ''}
      <section class="stack"><h2>Datos</h2><div class="row"><button class="btn grow" data-act="exportData">Exportar copia</button><label class="btn grow">Importar copia<input type="file" accept="application/json,.json" id="importFile" hidden></label></div>
        <div class="card small">Estado: <b>${esc(syncState()[1])}</b>${Store.mode === 'supabase' ? ' · Supabase' : Store.mode === 'claude' ? ' · vista previa en Claude' : ''}</div></section>
      <section class="stack"><h2>Instalar en el móvil</h2><div class="card small">iPhone: en Safari, <b>Compartir › Añadir a pantalla de inicio</b>. Android: en Chrome, <b>⋮ › Instalar aplicación</b> o <b>Añadir a pantalla de inicio</b>.</div></section>`;
  }});
}
function exportData() {
  const data = {}; COLS.forEach(c => data[c] = S[c]);
  const txt = JSON.stringify({app: 'comemos-en-casa', v: 2, at: new Date().toISOString(), data});
  try {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], {type: 'application/json'})); a.download = 'comemos-en-casa-' + todayISO() + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    if (Store.mode !== 'claude') { toast('Copia descargada'); return; }
  } catch(e) {}
  openSheet({title: 'Copia de seguridad', render: () => `<textarea id="copyTxt" class="search" rows="14" readonly>${esc(txt)}</textarea><span class="small muted">Copia este texto y guárdalo en un archivo .json.</span>`});
}
async function importData(file) {
  try {
    const j = JSON.parse(await file.text()); const d = j.data || j; const docs = [];
    for (const c of COLS) for (const id in (d[c] || {})) docs.push({col: c, id, data: d[c][id]});
    if (!docs.length) throw new Error('vacío');
    await Store.bulk(docs); RC = null; toast(`Importados ${docs.length} datos`);
  } catch(e) { toast('El archivo no es una copia válida de la app.'); }
}

// ================= Temporizadores y avisos =================
const timers = []; let audioCtx = null;
function beep() {
  try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    [0, .35, .7].forEach(t => { const o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(audioCtx.destination);
      g.gain.setValueAtTime(.0001, audioCtx.currentTime + t); g.gain.exponentialRampToValueAtTime(.3, audioCtx.currentTime + t + .02); g.gain.exponentialRampToValueAtTime(.0001, audioCtx.currentTime + t + .28); o.start(audioCtx.currentTime + t); o.stop(audioCtx.currentTime + t + .3); }); } catch(e) {}
  try { navigator.vibrate && navigator.vibrate([300,150,300,150,300]); } catch(e) {}
}
function startTimer(min, label) {
  try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); audioCtx.resume && audioCtx.resume(); } catch(e) {}
  timers.push({id: uid(), label, end: Date.now() + min * 60000, rung: false}); renderTimers(); toast(`Temporizador de ${min} min en marcha`);
}
function renderTimers() {
  const now = Date.now();
  $('#timers').innerHTML = timers.map(t => { const left = Math.max(0, Math.round((t.end - now) / 1000)), done = left === 0; if (done && !t.rung) { t.rung = true; beep(); }
    return `<div class="tpill ${done ? 'ring' : ''}"><span class="num">${done ? '¡Listo!' : `${Math.floor(left/60)}:${pad(left%60)}`}</span><span class="tl">${esc(t.label)}</span><button data-act="timerOff" data-id="${t.id}">${done ? 'OK' : 'Parar'}</button></div>`; }).join('');
}
setInterval(() => { if (timers.length) renderTimers(); }, 1000);
let toastT = null;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 3200); }

// ================= Acciones =================
const guard = () => { if (Store.readOnly) { toast('Solo lectura: no tienes permiso para cambiar cosas.'); return false; } return true; };
const ACT = {
  pickMe: d => { ME = d.id; lsSet('cec2_me', ME); closeAll(); scheduleRender(); },
  switchMe: () => { ME = null; lsSet('cec2_me', null); closeAll(); scheduleRender(); },
  yo: () => yoSheet(), settings: () => settingsSheet(),
  tab: d => { UI.tab = d.t; UI.confirm = null; saveUI(); closeAll(); window.scrollTo(0,0); scheduleRender(); },
  week: d => { UI.week = d.d === '0' ? weekOf(todayISO()) : addDays(UI.week, Number(d.d)); UI.confirm = null; scheduleRender(); },
  askRegen: () => { UI.confirm = 'regen:' + UI.week; scheduleRender(); },
  askDel: d => { UI.confirm = 'del:' + d.id; scheduleRender(); },
  askClr: d => { UI.confirm = 'clr:' + d.date + d.m; scheduleRender(); },
  askPDel: d => { UI.confirm = 'pdel:' + d.id; const s = SHEETS[SHEETS.length-1]; const pv = s.getP ? readProfForm(s.getP()) : null; if (pv) s.setP(pv); showTop(); },
  cancelConfirm: () => { UI.confirm = null; scheduleRender(); },
  gen: d => { if (!guard()) return; generate(UI.week, d.fill === '1'); UI.confirm = null; toast(d.fill === '1' ? 'Huecos rellenados' : 'Semana nueva propuesta'); },
  copyWeek: () => { if (!guard()) return; const prev = addDays(UI.week, -7); weekDates(prev).forEach((d, i) => { const src = S.day[d]; if (!src) return; const n = {}; ['c','n'].forEach(m => { if (src[m]) n[m] = {...clone(src[m]), done: false}; }); Store.set('day', addDays(UI.week, i), n); }); toast('Semana copiada'); },
  slot: d => slotSheet(d.date, d.m),
  addDish: d => pickerSheet({date: d.date, m: d.m, onPick: it => { updSlot(d.date, d.m, s => { s.items = it.k === 'r' ? s.items.filter(x => x.k !== 'fuera') : []; s.items.push(it); }); closeSheet(); }}),
  quickAdd: d => { if (!guard()) return; updSlot(d.date, d.m, s => s.items.push({k:'r', id: d.id})); },
  itemDel: d => { if (!guard()) return; updSlot(d.date, d.m, s => s.items.splice(Number(d.i), 1)); },
  special: d => { if (!guard()) return; updSlot(d.date, d.m, s => { s.items = [d.k === 'sobras' && d.of ? {k:'sobras', of: d.of} : {k: d.k}]; }); closeSheet(); },
  setTxt: d => { if (!guard()) return; const t = $('#slotTxt').value.trim(); if (!t) return; updSlot(d.date, d.m, s => { s.items = [{k:'txt', t}]; }); closeSheet(); },
  guests: d => { if (!guard()) return; updSlot(d.date, d.m, s => { s.g = Math.max(0, Math.min(20, (s.g||0) + Number(d.d))); }); },
  altPick: d => pickerSheet({date: d.date, m: d.m, pid: d.pid, onPick: it => { updSlot(d.date, d.m, s => { const cur = (s.alt[d.pid] && s.alt[d.pid].items || []).filter(x => x.k === 'r'); s.alt[d.pid] = {items: it.k === 'r' ? [...cur, it] : [it]}; }); closeSheet(); }}),
  altClear: d => { if (!guard()) return; updSlot(d.date, d.m, s => { delete s.alt[d.pid]; }); },
  pickR: d => { const pk = curPicker(); if (pk && guard()) pk.onPick({k:'r', id: d.id}); },
  pickSpecial: d => { const pk = curPicker(); if (pk && guard()) pk.onPick({k: d.k}); },
  pickTxt: () => { const pk = curPicker(); const t = $('#pkT').value.trim(); if (!t) { toast('Escribe qué ha comido.'); return; } if (pk && guard()) pk.onPick({k:'txt', t, kcal: Number($('#pkK').value) || 0}); },
  pickF: d => { pickF = d.f; pickQ = ''; scheduleRender(); },
  slotClear: d => { if (!guard()) return; writeSlot(d.date, d.m, null); UI.confirm = null; closeSheet(); },
  cooked: d => cookedSheet(d.date, d.m),
  undone: d => { if (!guard()) return; updSlot(d.date, d.m, s => { s.done = false; }); },
  cookedSave: d => { if (!guard()) return; const now = Date.now(), b = $('#sheetBody');
    b.querySelectorAll('.used:checked').forEach(c => Store.set('pantry', c.value, {...(S.pantry[c.value]||{}), have: false, t: now}));
    const s = getSlot(d.date, d.m);
    if (s) {
      if (b.querySelector('#toFridge') && b.querySelector('#toFridge').checked) s.items.forEach(it => { const r = it.k === 'r' && rec(it.id); if (r && r.so) Store.set('leftovers', 'l' + uid(), {rid: r.id, n: r.n, date: d.date, rac: 4}); });
      s.items.forEach(it => { if (it.k === 'sobras') { const e = Object.entries(S.leftovers).find(([, x]) => !it.of || x.rid === it.of); if (e) Store.del('leftovers', e[0]); } });
      updSlot(d.date, d.m, x => { x.done = true; });
    }
    closeSheet(); toast('Apuntado'); },
  leftDel: d => { if (!guard()) return; Store.del('leftovers', d.id); },
  leftAdd: () => pickerSheet({date: todayISO(), m: 'c', title: '¿Qué hay en la nevera?', onPick: it => { const r = itemRecipe(it); Store.set('leftovers', 'l' + uid(), {rid: r ? r.id : '', n: r ? r.n : itemName(it), date: todayISO(), rac: 2}); closeSheet(); }}),
  openRec: d => recipeSheet(d.id),
  rate: d => { if (!guard()) return; const cur = {...rates(d.id)}; if (cur[ME] === d.v) delete cur[ME]; else cur[ME] = d.v; if (Object.keys(cur).length) Store.set('ratings', d.id, cur); else Store.del('ratings', d.id); },
  soloSet: d => { if (!guard()) return; const r = rec(d.id); let solo = d.p ? (r.solo.includes(d.p) ? r.solo.filter(x => x !== d.p) : [...r.solo, d.p]) : []; setRecipeField(d.id, {solo}); },
  recPeople: d => { recPeople = Math.max(1, Math.min(12, recPeople + Number(d.d))); scheduleRender(); },
  toMenu: d => toMenuSheet(d.id),
  pickWeek: d => { pickWeek = d.w; scheduleRender(); },
  pickSlot: d => { if (!guard()) return; updSlot(d.date, d.m, s => { s.items = s.items.filter(x => x.k !== 'fuera'); s.items.push({k:'r', id: d.id}); }); closeSheet(); toast(`Añadido: ${dayLabel(d.date)}, ${MEALN[d.m].toLowerCase()}`); },
  cook: d => cookSheet(d.id),
  cookNav: d => { const r = rec(cook.id); cook.i = Math.max(0, Math.min(r.s.length, cook.i + Number(d.d))); scheduleRender(); $('#sheetBody').scrollTop = 0; },
  timer: d => startTimer(Number(d.min), d.l || 'Temporizador'),
  timerOff: d => { const i = timers.findIndex(t => t.id === d.id); if (i >= 0) timers.splice(i, 1); renderTimers(); },
  editRec: d => editRecSheet(d.id || null), dupRec: d => editRecSheet(null, d.id),
  eRowAdd: () => { $('#eRows').insertAdjacentHTML('beforeend', window.__erow('', 0)); const ins = $('#eRows').querySelectorAll('.e-n'); ins[ins.length-1].focus(); },
  eRowDel: (d, el) => el.closest('.erow').remove(),
  saveRec: d => { if (guard()) saveRecipe(d.id || null, d.solo); },
  restoreRec: d => { if (!guard()) return; Store.del('recipes', d.id); RC = null; toast('Receta original recuperada'); },
  delRec: d => { if (!guard()) return; if (RECIPES.some(r => r.id === d.id)) Store.set('recipes', d.id, {del: true}); else Store.del('recipes', d.id); RC = null; UI.confirm = null; closeSheet(); toast('Receta borrada'); },
  // registro personal
  mealOff: d => { if (!guard()) return; patchLog(d.date, ME, l => { const ml = mealLog(l, d.m); ml.off = ml.off.includes(d.k) ? ml.off.filter(x => x !== d.k) : [...ml.off, d.k]; l.meals[d.m] = ml; }); },
  portion: d => { if (!guard()) return; patchLog(d.date, ME, l => { const ml = mealLog(l, d.m); ml.f = Number(d.v); l.meals[d.m] = ml; }); },
  entreno: () => { if (!guard()) return; patchLog(todayISO(), ME, l => { l.entreno = !l.entreno; }); },
  agua: d => { if (!guard()) return; patchLog(todayISO(), ME, l => { const n = Number(d.n); l.agua = l.agua === n ? n - 1 : n; }); },
  logAdd: () => logAddSheet(todayISO()),
  logSnack: d => { if (!guard()) return; const s = SNACKS[Number(d.i)]; addLog(todayISO(), {n: s[0], kcal: s[1], prot: s[2]}); closeSheet(); toast('Añadido: ' + s[0]); },
  logRecipe: d => { if (!guard()) return; const r = rec(d.id), p = me(); addLog(todayISO(), {n: r.n, kcal: Math.round(r.m[0]*p.f), prot: Math.round(r.m[1]*p.f), rid: r.id}); closeAll(); toast('Añadido a tu día'); },
  logManual: () => { if (!guard()) return; const n = $('#lgN').value.trim(); if (!n) { toast('Escribe qué has tomado.'); return; } addLog(todayISO(), {n, kcal: Number($('#lgK').value) || 0, prot: Number($('#lgP').value) || 0}); closeSheet(); },
  logDel: d => { if (!guard()) return; patchLog(todayISO(), ME, l => l.extra.splice(Number(d.i), 1)); },
  offSearch: () => offSearch($('#offQ').value.trim()),
  offPick: d => { const x = offRes[Number(d.i)]; openSheet({title: x.n, static: true, render: () => `<div class="field"><label for="offG">¿Cuántos gramos?</label><input id="offG" type="number" inputmode="numeric" value="100"></div><span class="small muted num">${nf(x.k,0)} kcal y ${nf(x.p)} g de proteína por 100 g</span><button class="btn pri block" data-act="offAdd" data-i="${d.i}">Añadir a mi día</button>`}); },
  offAdd: d => { if (!guard()) return; const x = offRes[Number(d.i)], g = Number($('#offG').value) || 100; addLog(todayISO(), {n: x.n, g, kcal: Math.round(x.k * g / 100), prot: Math.round(x.p * g / 10) / 10}); closeAll(); toast('Añadido a tu día'); },
  weightSave: () => { if (!guard()) return; const v = Number(String($('#wIn').value).replace(',', '.')); if (!v || v < 25 || v > 250) { toast('Escribe un peso válido en kg.'); return; } const cur = (S.weight[ME] && S.weight[ME].pts) || {}; Store.set('weight', ME, {pts: {...cur, [todayISO()]: v}}); toast('Peso guardado'); },
  // casa y compra
  have: d => { if (!guard()) return; Store.set('pantry', d.id, {...(S.pantry[d.id]||{}), have: d.v === '1', t: Date.now()}); },
  haveSheet: (d, el) => { if (!guard()) return; const v = !hasIt(d.id); Store.set('pantry', d.id, {...(S.pantry[d.id]||{}), have: v, t: Date.now()}); el.className = 'toggle ' + (v ? 'have' : 'miss'); el.textContent = v ? 'Hay' : 'Falta'; },
  fijo: d => { if (!guard()) return; Store.set('pantry', d.id, {...(S.pantry[d.id]||{}), fijo: !isFijo(d.id)}); },
  ingEdit: d => ingSheet(d.id || null),
  ingSave: d => { if (!guard()) return; const b = $('#sheetBody'), v = s => b.querySelector(s).value;
    const n = v('#gN').trim(); if (!n) { toast('Escribe un nombre.'); return; }
    const id = d.id || ('c_' + slug(n));
    const fl = (b.querySelector('#gB').checked ? 'b' : '') + (b.querySelector('#gL').checked ? 'l' : '') + ((d.id && ing(d.id).fl.includes('f')) ? 'f' : '');
    Store.set('ingr', id, {n, sec: v('#gSec'), u: v('#gU'), pk: Number(v('#gPk')) || 1, pr: Number(v('#gPr')) || 0, fl});
    const dEl = b.querySelector('#gD'); if (dEl) { const dl = dislikes().filter(x => x !== id); if (dEl.checked) dl.push(id); saveSettings({dislikes: dl}); }
    closeSheet(); toast('Producto guardado'); },
  shopRange: d => { UI.shopRange = d.r; saveUI(); scheduleRender(); },
  addExtra: () => { if (!guard()) return; const n = UI.newExtra.trim(); if (!n) return; Store.set('extras', 'x' + uid(), {n, done: false, t: Date.now()}); UI.newExtra = ''; const el = $('#newExtra'); if (el) el.value = ''; },
  extraToggle: d => { if (!guard()) return; const x = S.extras[d.id]; if (x) Store.set('extras', d.id, {...x, done: !x.done, t: Date.now()}); },
  extraDel: d => { if (guard()) Store.del('extras', d.id); },
  clearExtras: () => { if (!guard()) return; Object.entries(S.extras).forEach(([id, x]) => { if (x.done) Store.del('extras', id); }); },
  shareList: async () => {
    const sh = shopping(UI.shopRange), lines = ['🛒 Lista de la compra'];
    groupBySec(sh.pending).forEach(([s, items]) => { lines.push('', '*' + secName(s) + '*'); items.forEach(it => lines.push('- ' + it.g.n + (it.q ? ' (' + fmtQty(it.q, it.g.u) + ')' : ''))); });
    if (sh.exPending.length) { lines.push('', '*Otros*'); sh.exPending.forEach(x => lines.push('- ' + x.n)); }
    const txt = lines.join('\n');
    if (navigator.share && Store.mode !== 'claude') { try { await navigator.share({text: txt}); return; } catch(e) { if (e && e.name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(txt); toast('Lista copiada. Pégala en WhatsApp.'); }
    catch(e) { openSheet({title: 'Copiar lista', render: () => `<textarea id="copyTxt" class="search" rows="16" readonly>${esc(txt)}</textarea><span class="small muted">Mantén pulsado para seleccionar y copiar.</span>`}); }
  },
  recFilter: d => { UI.recF = d.f; saveUI(); scheduleRender(); },
  pantryF: d => { UI.pantryF = d.f; saveUI(); scheduleRender(); },
  // perfiles y ajustes
  profEdit: d => profSheet(d.id || null),
  pfAv: d => { const s = SHEETS[SHEETS.length-1]; s.setP({...readProfForm(s.getP()), av: d.v}); showTop(); },
  pfCol: d => { const s = SHEETS[SHEETS.length-1]; s.setP({...readProfForm(s.getP()), col: d.v}); showTop(); },
  pfCalc: () => { const s = SHEETS[SHEETS.length-1]; const p = readProfForm(s.getP()); const c = calcNeeds(p); if (!c) { toast('Rellena edad, peso y altura para calcularlo.'); return; } s.setP({...p, ...c}); showTop(); toast(`Sugerido: ${c.kcal} kcal y ${c.prot} g de proteína`); },
  pfSave: d => { if (!guard()) return; const s = SHEETS[SHEETS.length-1]; const p = readProfForm(s.getP()); const list = clone(profiles()); const i = list.findIndex(x => x.id === p.id); if (i >= 0) list[i] = p; else list.push(p); saveSettings({profiles: list}); closeSheet(); toast('Perfil guardado'); },
  pfDel: d => { if (!guard()) return; saveSettings({profiles: profiles().filter(p => p.id !== d.id)}); UI.confirm = null; if (ME === d.id) { ME = null; lsSet('cec2_me', null); } closeSheet(); },
  theme: d => { THEME = d.v; lsSet('cec2_theme', THEME); applyTheme(); scheduleRender(); },
  stName: () => { if (!guard()) return; const n = $('#stName').value.trim(); if (n) { saveSettings({appName: n.slice(0, 40)}); toast('Nombre guardado'); } },
  stIcon: d => { if (guard()) saveSettings({appIcon: d.v}); },
  stAccent: d => { if (guard()) saveSettings({accent: d.v}); },
  dislikeDel: d => { if (guard()) saveSettings({dislikes: dislikes().filter(x => x !== d.id)}); },
  dislikeAdd: () => { if (!guard()) return; const id = findIngByName($('#dlIn').value); if (!id) { toast('Elige un ingrediente de la lista.'); return; } if (!dislikes().includes(id)) saveSettings({dislikes: [...dislikes(), id]}); },
  pwSave: async () => { const pw = $('#newPw').value; if (pw.length < 8) { toast('La contraseña debe tener al menos 8 caracteres.'); return; } try { await Store.changePassword(pw); $('#newPw').value = ''; toast('Contraseña cambiada'); } catch(e) { toast('No se ha podido cambiar: ' + (e.message || 'error')); } },
  logout: () => Store.logout(),
  exportData: () => exportData(),
  back: () => closeSheet(), closeSheet: () => closeSheet(), closeAll: () => closeAll()
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const fn = ACT[el.dataset.act]; if (fn) { e.preventDefault(); fn(el.dataset, el, e); }
});
$('#sheetWrap').addEventListener('click', e => { if (e.target.id === 'sheetWrap') closeAll(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && SHEETS.length) closeSheet();
  if (e.key === 'Enter' && e.target.id === 'newExtra') ACT.addExtra();
  if (e.key === 'Enter' && e.target.id === 'slotTxt') { const b = $('#sheetBody [data-act="setTxt"]'); b && b.click(); }
  if (e.key === 'Enter' && e.target.id === 'offQ') ACT.offSearch();
});
document.addEventListener('input', e => {
  const k = e.target.dataset && e.target.dataset.in; if (!k) return;
  if (k === 'pickQ') { pickQ = e.target.value; scheduleRender(); return; }
  UI[k] = e.target.value; if (k !== 'newExtra') scheduleRender();
});
document.addEventListener('change', async e => {
  const t = e.target;
  if (t.classList.contains('e-n')) { const id = findIngByName(t.value); t.closest('.erow').querySelector('.u').textContent = id ? ing(id).u : 'ud'; }
  if (t.dataset.hab) { if (guard()) saveSettings({habits: {...habits(), [t.dataset.hab]: t.checked}}); }
  if (t.dataset.habsel) { if (guard()) saveSettings({habits: {...habits(), [t.dataset.habsel]: Number(t.value)}}); }
  if (t.id === 'importFile' && t.files[0]) importData(t.files[0]);
  if (t.dataset.photo && t.files[0]) {
    if (!guard()) return;
    try { toast('Subiendo foto…'); const blob = await compressImage(t.files[0], Store.mode === 'supabase' ? 1200 : 640); const url = await Store.uploadPhoto(t.dataset.photo, blob); Store.set('photos', t.dataset.photo, {url, t: Date.now()}); toast('Foto guardada'); }
    catch(err) { toast('No se ha podido subir la foto.'); }
  }
});
document.addEventListener('submit', async e => {
  if (e.target.id !== 'loginForm') return; e.preventDefault();
  const pw = $('#pw').value; UI.loginErr = '';
  try { await Store.login(pw); } catch(err) { UI.loginErr = /invalid/i.test(err.message || '') ? 'Contraseña incorrecta.' : 'No se ha podido entrar. Revisa la conexión.'; }
  render();
});
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { if (cook) lockScreen(); scheduleRender(); } });

applyTheme();
Store.init(() => { RC = null; scheduleRender(); });
if ('serviceWorker' in navigator && location.protocol === 'https:' && window.APP_CONFIG && window.APP_CONFIG.supabaseUrl) navigator.serviceWorker.register('sw.js').catch(() => {});
