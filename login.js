(() => {
  const form = document.getElementById('acceso-form');
  const message = document.getElementById('acceso-mensaje');
  const button = document.getElementById('acceso-ingresar');
  document.getElementById('acceso-ver').addEventListener('click', () => {
    const field = document.getElementById('acceso-clave');
    field.type = field.type === 'password' ? 'text' : 'password';
    document.getElementById('acceso-ver').textContent = field.type === 'password' ? 'Ver' : 'Ocultar';
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    message.textContent = '';
    if (!window.EL_TURCO_LOGIN_URL) {
      message.textContent = 'El acceso todavía está pendiente de activación. Contactá a tu vendedor.';
      return;
    }
    button.disabled = true;
    button.textContent = 'Ingresando…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(window.EL_TURCO_LOGIN_URL, {
        method: 'POST',
        headers: {'Content-Type': 'text/plain;charset=utf-8'},
        body: JSON.stringify({accion: 'login', correo: document.getElementById('acceso-correo').value.trim(), contrasena: document.getElementById('acceso-clave').value.trim()}),
        signal: controller.signal
      });
      if (!response.ok) throw new Error('connection');
      const result = await response.json();
      if (!result.ok) { message.textContent = result.mensaje || 'No se pudo ingresar.'; return; }
      const client = result.cliente;
      document.getElementById('cliente').value = client.ferreteria;
      document.getElementById('cliente').readOnly = true;
      document.getElementById('contacto').value = client.correo;
      const normalized = client.vendedor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const sellers = document.getElementById('vendedor');
      const option = [...sellers.options].find(o => o.value && (normalized === o.value || normalized.startsWith(o.value + ' ')));
      if (option) { sellers.value = option.value; sellers.disabled = true; }
      const restaurarCliente = () => {
        document.getElementById('cliente').value = client.ferreteria;
        document.getElementById('contacto').value = client.correo;
        if (option) sellers.value = option.value;
      };
      if (typeof enviarPedido === 'function') {
        const enviarOriginal = enviarPedido;
        window.enviarPedido = function(...args) {
          restaurarCliente();
          try { return enviarOriginal.apply(this, args); }
          finally { restaurarCliente(); if (typeof guardarPedido === 'function') guardarPedido(); }
        };
      }
      document.getElementById('acceso-clave').value = '';
      document.getElementById('acceso-nombre').textContent = 'Hola, ' + client.ferreteria;
      document.getElementById('acceso-portada').hidden = true;
      document.getElementById('acceso-cuenta').hidden = false;
      document.body.classList.remove('acceso-pendiente');
      if (typeof guardarPedido === 'function') guardarPedido();
    } catch (error) {
      message.textContent = 'No pudimos conectar. Intentá nuevamente.';
    } finally { clearTimeout(timeout); button.disabled = false; button.textContent = 'Ingresar al catálogo →'; }
  });
  document.getElementById('acceso-salir').addEventListener('click', () => location.reload());
})();
