/* Tarjetas metálicas: conserva códigos e identificadores para precios y carrito. */
(() => {
  const base = 'imagenes/canillas-metalicas/';
  const opciones = {
    '678': {descripcion: 'Canilla lavatorio metal', subcategoria: 'Canilla lavatorio', foto: base + 'canilla-lavatorio-678.png'},
    '700': {descripcion: 'Válvula esférica ½″', subcategoria: 'Válvulas esféricas Valforte', foto: base + 'valvulas-esfericas-valforte.png'},
    '701': {descripcion: 'Válvula esférica ¾″', subcategoria: 'Válvulas esféricas Valforte', foto: base + 'valvulas-esfericas-valforte.png'},
    '702': {descripcion: 'Válvula esférica 1″', subcategoria: 'Válvulas esféricas Valforte', foto: base + 'valvulas-esfericas-valforte.png'}
  };
  for (const producto of productos) {
    const opcion = opciones[String(producto.codigo).trim()];
    if (opcion) Object.assign(producto, opcion, {categoria: 'Canillas y válvulas metálicas', medida: '', fotos: [opcion.foto]});
  }
  renderMenu();
  renderProductos();
})();
