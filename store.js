'use strict';
// ============================================================
// Almacenamiento: tres modos con la misma interfaz
//  - supabase: web publicada (GitHub Pages) con base de datos Supabase
//  - claude:   vista previa dentro de Claude (base de datos del artifact)
//  - local:    sin conexión, solo en este dispositivo
// Todo se guarda como documentos {col, id, data}.
// ============================================================
const COLS = ['day','pantry','extras','ratings','recipes','ingr','settings','log','weight','leftovers','photos'];
const RECENT_COLS = ['day','log']; // de estas solo se cargan los últimos días
const KEEP_DAYS = 60;

const Store = (() => {
  const S = {}; COLS.forEach(c => S[c] = {});
  let mode = 'loading', listener = () => {}, client = null, cdb = null;
  let online = true, readOnly = false, lastError = null;
  const pending = {};              // escrituras locales aún sin confirmar, por "col/id"
  const lsGet = k => { try { return JSON.parse(localStorage.getItem(k)); } catch(e) { return null; } };
  const lsSet = (k,v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) {} };
  const cfg = window.APP_CONFIG || {};
  const hasSupabase = !!(cfg.supabaseUrl && cfg.supabaseKey && window.supabase);

  let cacheT = null;
  function saveCache() {
    clearTimeout(cacheT);
    cacheT = setTimeout(() => { const c = {}; COLS.forEach(k => { if (k !== 'photos' || mode === 'supabase') c[k] = S[k]; }); lsSet('cec2_cache_' + mode, c); }, 500);
  }
  function emit() { saveCache(); listener(); }
  function applyRemote(col, id, data) {
    if (pending[col+'/'+id]) return;
    if (data == null) { if (!(id in S[col])) return; const o = {...S[col]}; delete o[id]; S[col] = o; }
    else S[col] = {...S[col], [id]: data};
    emit();
  }
  const cutoff = () => { const d = new Date(); d.setDate(d.getDate() - KEEP_DAYS); return d.toISOString().slice(0,10); };

  // ---------- cola de escrituras (reintenta si no hay conexión) ----------
  let outbox = [], flushing = false;
  function loadOutbox() { outbox = lsGet('cec2_outbox') || []; }
  function saveOutbox() { lsSet('cec2_outbox', outbox); }
  async function flush() {
    if (flushing || !outbox.length) return;
    flushing = true;
    try {
      while (outbox.length) {
        const op = outbox[0];
        try { await remoteWrite(op); online = true; lastError = null; }
        catch(e) {
          if (isFatal(e)) { lastError = e; outbox.shift(); saveOutbox(); dec(op); listener(); continue; }
          online = false; listener(); break;
        }
        outbox.shift(); saveOutbox(); dec(op);
      }
    } finally { flushing = false; listener(); }
  }
  function dec(op) { const k = op.col+'/'+op.id; pending[k] = Math.max(0, (pending[k]||1) - 1); if (!pending[k]) delete pending[k]; }
  function isFatal(e) {
    const c = e && (e.code || e.status);
    if (mode === 'claude') { if (c === 'invalid_argument') { readOnly = true; return true; } return c === 'quota_exceeded'; }
    return c === 401 || c === 403 || c === '42501' || c === 'PGRST301';
  }
  async function remoteWrite(op) {
    if (mode === 'supabase') {
      if (op.t === 'del') { const {error} = await client.from('docs').delete().eq('col', op.col).eq('id', op.id); if (error) throw error; }
      else { const {error} = await client.from('docs').upsert({col: op.col, id: op.id, data: op.data, updated_at: new Date().toISOString()}, {onConflict:'col,id'}); if (error) throw error; }
    } else if (mode === 'claude') {
      const ref = cdb.collection(op.col).doc(op.id);
      if (op.t === 'del') await ref.delete(); else await ref.set(op.data);
    }
  }
  function queue(op) {
    if (mode === 'local' || mode === 'loading') return;
    const k = op.col+'/'+op.id; pending[k] = (pending[k]||0) + 1;
    // si ya hay una escritura pendiente del mismo documento, se sustituye (solo vale la última)
    const i = outbox.findIndex((o, j) => j > 0 && o.col === op.col && o.id === op.id);
    if (i > 0) { outbox.splice(i, 1); dec(op); }
    outbox.push(op); saveOutbox(); flush();
  }

  // ---------- API ----------
  function set(col, id, data) { S[col] = {...S[col], [id]: data}; emit(); queue({t:'set', col, id, data}); if (mode === 'local') saveLocal(); }
  function del(col, id) { const o = {...S[col]}; delete o[id]; S[col] = o; emit(); queue({t:'del', col, id}); if (mode === 'local') saveLocal(); }
  function saveLocal() { lsSet('cec2_local', S); }

  async function loadSupabase() {
    const all = {}; COLS.forEach(c => all[c] = {});
    const page = async (build) => {
      for (let from = 0; ; from += 1000) {
        const {data, error} = await build().range(from, from + 999);
        if (error) throw error;
        data.forEach(r => { if (all[r.col]) all[r.col][r.id] = r.data; });
        if (data.length < 1000) break;
      }
    };
    await page(() => client.from('docs').select('col,id,data').not('col', 'in', '(' + RECENT_COLS.join(',') + ')').order('col').order('id'));
    await page(() => client.from('docs').select('col,id,data').in('col', RECENT_COLS).gte('id', cutoff()).order('col').order('id'));
    COLS.forEach(c => S[c] = all[c]);
    emit();
  }
  function subscribeSupabase() {
    client.channel('docs-all').on('postgres_changes', {event:'*', schema:'public', table:'docs'}, p => {
      const r = p.eventType === 'DELETE' ? p.old : p.new;
      if (!r || !S[r.col]) return;
      applyRemote(r.col, r.id, p.eventType === 'DELETE' ? null : r.data);
    }).subscribe();
  }
  async function startSupabase() {
    mode = 'supabase';
    const cache = lsGet('cec2_cache_supabase'); if (cache) COLS.forEach(c => { if (cache[c]) S[c] = cache[c]; });
    loadOutbox(); listener();
    try { await loadSupabase(); online = true; } catch(e) { online = false; lastError = e; listener(); }
    subscribeSupabase(); flush();
    window.addEventListener('online', () => { flush(); loadSupabase().catch(() => {}); });
    setInterval(flush, 20000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') loadSupabase().then(() => { online = true; listener(); }).catch(() => {}); });
  }

  async function init(onChange) {
    listener = onChange;
    if (hasSupabase) {
      client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {auth:{persistSession:true, autoRefreshToken:true}});
      const {data} = await client.auth.getSession();
      if (!data.session) { mode = 'login'; listener(); return; }
      await startSupabase(); return;
    }
    try { cdb = (window.claude && window.claude.use) ? await window.claude.use('db') : null; } catch(e) { cdb = null; }
    if (cdb) {
      mode = 'claude';
      const cache = lsGet('cec2_cache_claude'); if (cache) COLS.forEach(c => { if (cache[c]) S[c] = cache[c]; });
      listener();
      COLS.forEach(c => cdb.collection(c).onSnapshot(snap => {
        const o = {};
        snap.docs.forEach(d => { if (d.exists) o[d.id] = d.data(); });
        for (const k in pending) { const [pc, pid] = k.split('/'); if (pc === c && S[c][pid] !== undefined) o[pid] = S[c][pid]; }
        S[c] = o; emit();
      }, () => { online = false; listener(); }));
      try { const u = await window.claude.use('user'); if (u && u.can && (await u.can('data.write')) === false) readOnly = true; } catch(e) {}
      listener(); return;
    }
    mode = 'local';
    const loc = lsGet('cec2_local'); if (loc) COLS.forEach(c => { if (loc[c]) S[c] = loc[c]; });
    listener();
  }

  async function login(password) {
    const {error} = await client.auth.signInWithPassword({email: cfg.familyEmail, password});
    if (error) throw error;
    await startSupabase();
  }
  async function logout() { if (client) await client.auth.signOut(); try { localStorage.removeItem('cec2_cache_supabase'); } catch(e) {} location.reload(); }
  async function changePassword(pw) { const {error} = await client.auth.updateUser({password: pw}); if (error) throw error; }

  async function uploadPhoto(rid, blob) {
    if (mode === 'supabase') {
      const path = rid + '-' + Date.now() + '.jpg';
      const {error} = await client.storage.from('fotos').upload(path, blob, {contentType:'image/jpeg', upsert:true});
      if (error) throw error;
      return client.storage.from('fotos').getPublicUrl(path).data.publicUrl;
    }
    return await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); });
  }
  async function bulk(docs) {
    for (const d of docs) { if (!S[d.col]) continue; S[d.col] = {...S[d.col], [d.id]: d.data}; }
    emit();
    if (mode === 'supabase') {
      for (let i = 0; i < docs.length; i += 200) {
        const {error} = await client.from('docs').upsert(docs.slice(i, i+200).map(d => ({...d, updated_at: new Date().toISOString()})), {onConflict:'col,id'});
        if (error) throw error;
      }
    } else if (mode === 'claude') { for (const d of docs) await cdb.collection(d.col).doc(d.id).set(d.data); }
    else saveLocal();
  }

  return {
    S, init, set, del, bulk, login, logout, changePassword, uploadPhoto,
    get mode() { return mode; }, get online() { return online; }, get readOnly() { return readOnly; },
    get pendingCount() { return outbox.length; }, get lastError() { return lastError; }, get canNetwork() { return mode === 'supabase'; }
  };
})();
