function calcularDescuento(data) {
  const { precio_unitario, cantidad, tipo_descuento, valor_descuento } = data;

  if (!precio_unitario || Number(precio_unitario) <= 0) {
    const error = new Error("El precio unitario debe ser mayor a 0");
    error.status = 400;
    throw error;
  }

  if (!cantidad || Number(cantidad) <= 0) {
    const error = new Error("La cantidad debe ser mayor a 0");
    error.status = 400;
    throw error;
  }

  if (!["porcentaje", "monto_fijo"].includes(tipo_descuento)) {
    const error = new Error("El tipo de descuento debe ser porcentaje o monto_fijo");
    error.status = 400;
    throw error;
  }

  if (!valor_descuento || Number(valor_descuento) <= 0) {
    const error = new Error("El valor del descuento debe ser mayor a 0");
    error.status = 400;
    throw error;
  }

  const subtotalBruto = Number(precio_unitario) * Number(cantidad);
  let descuento = 0;

  if (tipo_descuento === "porcentaje") {
    descuento = subtotalBruto * (Number(valor_descuento) / 100);
  }

  if (tipo_descuento === "monto_fijo") {
    descuento = Number(valor_descuento);
  }

  if (descuento > subtotalBruto) {
    descuento = subtotalBruto;
  }

  const subtotalNeto = subtotalBruto - descuento;

  return {
    precio_unitario: Number(precio_unitario),
    cantidad: Number(cantidad),
    subtotal_bruto: Number(subtotalBruto.toFixed(2)),
    tipo_descuento,
    valor_descuento: Number(valor_descuento),
    descuento: Number(descuento.toFixed(2)),
    subtotal_neto: Number(subtotalNeto.toFixed(2))
  };
}

module.exports = {
  calcularDescuento
};