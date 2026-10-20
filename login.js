(() => {
  const form = document.getElementById('acceso-form');
  const message = document.getElementById('acceso-mensaje');
  const button = document.getElementById('acceso-ingresar');
  const emailField = document.getElementById('acceso-correo');
  const passwordField = document.getElementById('acceso-clave');
  form.setAttribute('autocomplete', 'on');
  form.setAttribute('method', 'post');
  emailField.name = 'username';
  emailField.autocomplete = 'username';
  emailField.autocapitalize = 'none';
  emailField.spellcheck = false;
  passwordField.name = 'password';
  passwordField.autocomplete = 'current-password';
  const rememberKey = 'elTurcoDatosAcceso';
  const rememberLabel = document.createElement('label');
  rememberLabel.style.cssText = 'display:flex;align-items:center;gap:9px;cursor:pointer';
  const rememberField = document.createElement('input');
  rememberField.type = 'checkbox';
  rememberField.id = 'acceso-recordar';
  rememberField.style.cssText = 'width:18px;height:18px;margin:0;flex:none;accent-color:#e5c28a';
  rememberLabel.append(rememberField, document.createTextNode('Recordar mis datos en este dispositivo'));
  form.insertBefore(rememberLabel, button);
  try {
    const saved = JSON.parse(localStorage.getItem(rememberKey) || 'null');
    if (saved && typeof saved.correo === 'string') {
      emailField.value = saved.correo;
      rememberField.checked = true;
    }
  } catch (_) { /* Unavailable storage must not block access. */ }
  rememberField.addEventListener('change', () => {
    if (!rememberField.checked) {
      try { localStorage.removeItem(rememberKey); } catch (_) {}
    }
  });

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
    const correo = emailField.value.trim();
    const clave = passwordField.value.trim();
    button.disabled = true;
    button.textContent = 'Ingresando…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    let fase = 'conexion';
    try {
      const response = await fetch(window.EL_TURCO_LOGIN_URL, {
        method: 'POST',
        headers: {'Content-Type': 'text/plain;charset=utf-8'},
        body: JSON.stringify({accion: 'login', correo, contrasena: clave}),
        signal: controller.signal
      });
      if (!response.ok) throw new Error('http-' + response.status);
      fase = 'respuesta';
      const result = await response.json();
      if (!result.ok) { message.textContent = result.mensaje || 'No se pudo ingresar.'; return; }
      fase = 'catalogo';
      clearTimeout(timeout);
      const client = result.cliente;
      try {
        if (rememberField.checked) localStorage.setItem(rememberKey, JSON.stringify({correo}));
        else localStorage.removeItem(rememberKey);
      } catch (_) { /* Unavailable storage must not block a valid login. */ }
      // Notify supported password managers only after the server accepts the login.
      // Ask the browser to save credentials only when the client opts in.
      if (rememberField.checked && window.isSecureContext && typeof window.PasswordCredential === 'function' &&
          navigator.credentials && typeof navigator.credentials.store === 'function') {
        try {
          const credential = new window.PasswordCredential({
            id: correo, password: clave, name: client.ferreteria || correo
          });
          Promise.resolve(navigator.credentials.store(credential)).catch(() => {});
        } catch (_) { /* Unsupported or disabled manager must not block login. */ }
      }
      document.getElementById('cliente').value = client.ferreteria;
      document.getElementById('cliente').readOnly = true;
      document.getElementById('contacto').value = client.correo;
      const sellers = document.getElementById('vendedor');
      sellers.value = '';
      sellers.disabled = false;
      const restaurarCliente = () => {
        document.getElementById('cliente').value = client.ferreteria;
        document.getElementById('contacto').value = client.correo;
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
      if (typeof guardarPedido === 'function') {
        try { guardarPedido(); } catch (_) { /* Storage settings must not block a valid login. */ }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        message.textContent = 'La conexión está tardando más de lo esperado. Intentá ingresar nuevamente.';
      } else if (fase === 'catalogo') {
        message.textContent = 'Tus datos fueron aceptados, pero no pudimos abrir el catálogo. Recargá la página e intentá nuevamente.';
      } else if (fase === 'respuesta') {
        message.textContent = 'El servicio de acceso devolvió una respuesta inesperada. Intentá nuevamente en unos instantes.';
      } else {
        message.textContent = 'No pudimos conectar con el servicio de acceso. Revisá tu conexión e intentá nuevamente.';
      }
    } finally { clearTimeout(timeout); button.disabled = false; button.textContent = 'Ingresar al catálogo →'; }
  });
  document.getElementById('acceso-salir').addEventListener('click', () => location.reload());
})();
