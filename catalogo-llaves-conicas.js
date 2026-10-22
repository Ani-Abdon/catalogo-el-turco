/* Llaves cónicas para gas — catálogo El Turco */
(() => {
  const opciones = {
    '85012': {descripcion:'Llave cónica para gas sin campana, ½″',foto:'imagenes/canillas-metalicas/llave-conica-85012.png'},
    '95012': {descripcion:'Llave cónica para gas con campana, ½″',foto:'imagenes/canillas-metalicas/llave-conica-95012.png'}
  };
  for (const producto of productos) {
    const opcion=opciones[String(producto.codigo).trim()];
    if (!opcion) continue;
    Object.assign(producto, opcion, {categoria:'Canillas y válvulas metálicas',subcategoria:'Llave cónica para gas',medida:'',fotos:[opcion.foto]});
  }
  renderMenu();
  renderProductos();
})();
