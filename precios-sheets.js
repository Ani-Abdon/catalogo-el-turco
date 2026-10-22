/* Google Sheets price source — 2026-10-22 */
(() => {
  'use strict';
  const endpoint = 'https://script.google.com/macros/s/AKfycbyfsnzve4zxIZ0yLSW7ghtesj2vriH8__WsCZhMpryRRpxTzsD5XcF4B4VxBh3ozq_W/exec';
  const callback = '__elTurcoPreciosSheets';
  let pending = null;
  let lastRefresh = 0;
  function notice(message, failed) {
    let el = document.getElementById('estado-precios-sheets');
    if (!el) {
      el = document.createElement('div');
      el.id = 'estado-precios-sheets';
      el.setAttribute('role', 'status');
      el.style.cssText = 'padding:8px 14px;text-align:center;font:12px system-ui;background:#eef6f1;color:#24513b';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.style.background = failed ? '#fff2dd' : '#eef6f1';
  }
  function refresh() {
    if (pending) return pending;
    pending = new Promise(resolve => {
      let settled = false;
      const script = document.createElement('script');
      const finish = ok => {
        if (settled) return;
        settled = true; clearTimeout(timer); script.remove();
        delete window[callback]; pending = null; resolve(ok);
      };
      const timer = setTimeout(() => {
        notice('No se pudieron actualizar los precios. Se muestran los precios guardados; confirmá su vigencia con tu vendedor.', true);
        finish(false);
      }, 60000);
      window[callback] = data => {
        try {
          if (!data || data.ok !== true || !data.prices || typeof data.prices !== 'object') throw new Error('Respuesta inválida');
          const entries = Object.entries(data.prices).filter(([code, value]) => /^[A-Z0-9][A-Z0-9/".\-]*$/.test(code) && typeof value === 'number' && Number.isFinite(value) && value > 0);
          if (entries.length < 10) throw new Error('Lista incompleta');
          const validVariantKeys = new Set(Array.from({length:8},(_,i)=>['1 1/4"','1 1/2"','2"'].map(measure=>'J'+(150+i)+'|'+measure)).flat());
          const variants = Object.entries(data.variants || {}).filter(([key,value]) => validVariantKeys.has(key) && typeof value === 'number' && Number.isFinite(value) && value > 0);
          if (variants.length !== 24) throw new Error('Variantes incompletas');
          Object.keys(PRECIOS_CATALOGO).forEach(code => delete PRECIOS_CATALOGO[code]);
          Object.keys(PRECIOS_VARIANTES).forEach(key => delete PRECIOS_VARIANTES[key]);
          for (const [code, value] of entries) PRECIOS_CATALOGO[code] = Math.round(value * 100) / 100;
          for (const [key, value] of variants) PRECIOS_VARIANTES[key] = Math.round(value * 100) / 100;
          for (const product of productos) {
            const original = String(product.codigo || '').trim().toUpperCase().replace(/\s+/g,'');
            const normalized = original.replace(/\.+$/,'');
            if (original !== normalized && Object.prototype.hasOwnProperty.call(PRECIOS_CATALOGO, normalized)) PRECIOS_CATALOGO[original] = PRECIOS_CATALOGO[normalized];
          }
          lastRefresh = Date.now();
          renderProductos(); renderCarrito();
          notice('Precios sincronizados con Google Sheets. Los productos sin un importe confirmado figuran como «Consultar precio».', false);
          window.dispatchEvent(new CustomEvent('el-turco-precios-actualizados', {detail:{count:entries.length, updatedAt:data.updatedAt}}));
          finish(true);
        } catch (error) {
          notice('No se pudieron actualizar los precios. Consultá su vigencia con tu vendedor.', true);
          finish(false);
        }
      };
      script.crossOrigin = 'anonymous';
      script.onerror = () => {
        notice('No se pudieron actualizar los precios. Se muestran los precios guardados; confirmá su vigencia con tu vendedor.', true);
        finish(false);
      };
      notice('Actualizando precios desde Google Sheets…', false);
      fetch(endpoint + '?t=' + Date.now(), {credentials:'omit', cache:'no-store'})
        .then(response => { if (!response.ok) throw new Error('HTTP ' + response.status); return response.json(); })
        .then(data => { if (!settled) window[callback](data); })
        .catch(error => {
          if (settled) return;
          console.warn('Consulta de precios: se intentará el método alternativo.', error);
          script.src = endpoint + '?callback=' + callback + '&t=' + Date.now();
          document.head.appendChild(script);
        });
    });
    return pending;
  }
  refresh();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && Date.now() - lastRefresh > 60000) refresh();
  });
})();
