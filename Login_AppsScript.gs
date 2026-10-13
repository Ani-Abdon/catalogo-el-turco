// Agregar al proyecto existente. Reemplazar las funciones validarCliente y probarLogin anteriores.
// No borrar las funciones de pedidos y correo.
function validarCliente(correo, contrasena) {
  const email = String(correo || '').trim().toLowerCase();
  const numero = String(contrasena || '').trim();
  const fallo = {ok: false, mensaje: 'Correo o número de cliente incorrectos.'};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !numero) return fallo;
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const hoja = SpreadsheetApp.openById('1rgxRP479lckOffaGwN8JbIVgozP50zbkRNSIdRzdcvw').getSheetByName('Clientes');
    if (!hoja || hoja.getLastRow() < 2) return fallo;
    const filas = hoja.getRange(2, 1, hoja.getLastRow() - 1, 5).getDisplayValues();
    const indices = filas.map((fila, i) => fila[0].trim() === numero ? i : -1).filter(i => i >= 0);
    if (indices.length !== 1) return fallo;
    const indice = indices[0];
    const cliente = filas[indice];
    if (!['si', 'sí'].includes(cliente[4].trim().toLowerCase())) return fallo;
    const registrado = cliente[2].trim().toLowerCase();
    if (registrado && registrado !== email) return fallo;
    if (!registrado) {
      if (filas.some((fila, i) => i !== indice && fila[2].trim().toLowerCase() === email)) {
        return {ok: false, mensaje: 'Este correo ya está asociado a otro cliente. Contactá a tu vendedor.'};
      }
      hoja.getRange(indice + 2, 3).setValue(email);
      SpreadsheetApp.flush();
    }
    return {ok: true, cliente: {numero: cliente[0].trim(), ferreteria: cliente[1], correo: email, vendedor: cliente[3]}};
  } finally { lock.releaseLock(); }
}

function doPost(e) {
  let resultado;
  try {
    const datos = JSON.parse(e.postData.contents);
    resultado = datos.accion === 'login' ? validarCliente(datos.correo, datos.contrasena) : {ok: false, mensaje: 'Solicitud no válida.'};
  } catch (error) {
    resultado = {ok: false, mensaje: 'No se pudo procesar el acceso. Intentá nuevamente.'};
  }
  return ContentService.createTextOutput(JSON.stringify(resultado)).setMimeType(ContentService.MimeType.JSON);
}

function probarLogin() {
  console.log(JSON.stringify(validarCliente('pedidos.elturco@gmail.com', 'PRUEBA')));
}
