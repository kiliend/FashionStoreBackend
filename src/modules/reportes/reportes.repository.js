const pool = require("../../config/db");

function aplicarFiltro(baseSql, filtros) {
  let sql = baseSql;
  const params = [];

  if (filtros.fecha_inicio && filtros.fecha_fin) {
    sql += " AND DATE(fecha_referencia) BETWEEN ? AND ?";
    params.push(filtros.fecha_inicio, filtros.fecha_fin);
  }

  return { sql, params };
}

async function getReporteVentas(filtros) {
  let sql = `
    SELECT
      v.id_venta,
      v.fecha_venta,
      COALESCE(c.razon_social, CONCAT(c.nombres, ' ', c.apellidos), 'Cliente no registrado') AS cliente,
      v.origen_venta,
      v.metodo_pago,
      v.subtotal,
      v.igv,
      v.descuento_total,
      v.total,
      v.estado_venta,
      u.usuario AS vendedor
    FROM ventas v
    LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
    LEFT JOIN usuarios u ON v.id_vendedor = u.id_usuario
    WHERE v.estado_visible = 1
  `;

  const params = [];

  if (filtros.fecha_inicio && filtros.fecha_fin) {
    sql += " AND DATE(v.fecha_venta) BETWEEN ? AND ?";
    params.push(filtros.fecha_inicio, filtros.fecha_fin);
  }

  if (filtros.estado_venta) {
    sql += " AND v.estado_venta = ?";
    params.push(filtros.estado_venta);
  }

  if (filtros.metodo_pago) {
    sql += " AND v.metodo_pago = ?";
    params.push(filtros.metodo_pago);
  }

  if (filtros.origen_venta) {
    sql += " AND v.origen_venta = ?";
    params.push(filtros.origen_venta);
  }

  sql += " ORDER BY v.fecha_venta DESC";

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function getReporteInventario(filtros = {}) {
  let sql = `
    SELECT
      pv.id_variante,
      p.nombre_producto,
      cat.nombre_categoria,
      c.nombre_color,
      t.nombre_talla,
      pv.sku,
      pv.stock_actual,
      pv.stock_minimo,
      pv.estado_variante,
      CASE
        WHEN pv.stock_actual <= pv.stock_minimo THEN 'stock_bajo'
        ELSE 'stock_correcto'
      END AS alerta_stock
    FROM producto_variantes pv
    LEFT JOIN productos p ON pv.id_producto = p.id_producto
    LEFT JOIN categorias cat ON p.id_categoria = cat.id_categoria
    LEFT JOIN colores c ON pv.id_color = c.id_color
    LEFT JOIN tallas t ON pv.id_talla = t.id_talla
    WHERE pv.estado_visible = 1
  `;

  const params = [];

  if (filtros.alerta_stock) {
    if (filtros.alerta_stock === "stock_bajo") {
      sql += " AND pv.stock_actual <= pv.stock_minimo";
    }

    if (filtros.alerta_stock === "stock_correcto") {
      sql += " AND pv.stock_actual > pv.stock_minimo";
    }
  }

  if (filtros.estado_variante) {
    sql += " AND pv.estado_variante = ?";
    params.push(filtros.estado_variante);
  }

  if (filtros.id_categoria) {
    sql += " AND p.id_categoria = ?";
    params.push(filtros.id_categoria);
  }

  sql += " ORDER BY p.nombre_producto ASC";

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function getReporteCompras(filtros) {
  let sql = `
    SELECT
      oc.id_orden_compra,
      oc.fecha_orden,
      p.razon_social AS proveedor,
      p.ruc,
      oc.total,
      oc.estado_orden,
      oc.estado_factura,
      oc.fecha_pago,
      ur.usuario AS usuario_registro,
      up.usuario AS usuario_pago
    FROM ordenes_compra oc
    INNER JOIN proveedores p ON oc.id_proveedor = p.id_proveedor
    LEFT JOIN usuarios ur ON oc.id_usuario_registro = ur.id_usuario
    LEFT JOIN usuarios up ON oc.id_usuario_pago = up.id_usuario
    WHERE oc.estado_visible = 1
  `;

  const params = [];

  if (filtros.fecha_inicio && filtros.fecha_fin) {
    sql += " AND DATE(oc.fecha_orden) BETWEEN ? AND ?";
    params.push(filtros.fecha_inicio, filtros.fecha_fin);
  }

  if (filtros.estado_orden) {
    sql += " AND oc.estado_orden = ?";
    params.push(filtros.estado_orden);
  }

  if (filtros.estado_factura) {
    sql += " AND oc.estado_factura = ?";
    params.push(filtros.estado_factura);
  }

  sql += " ORDER BY oc.fecha_orden DESC";

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function getReporteProductosMasVendidos(filtros) {
  let sql = `
    SELECT
      p.id_producto,
      p.nombre_producto,
      cat.nombre_categoria,
      SUM(dv.cantidad) AS cantidad_vendida,
      SUM(dv.subtotal) AS total_vendido
    FROM detalle_ventas dv
    INNER JOIN ventas v ON dv.id_venta = v.id_venta
    LEFT JOIN producto_variantes pv ON dv.id_variante = pv.id_variante
    LEFT JOIN productos p ON pv.id_producto = p.id_producto
    LEFT JOIN categorias cat ON p.id_categoria = cat.id_categoria
    WHERE v.estado_venta = 'completada'
    AND v.estado_visible = 1
    AND dv.estado_visible = 1
    AND COALESCE(dv.tipo_item, 'producto') IN ('producto', 'promocion')
  `;

  const params = [];

  if (filtros.fecha_inicio && filtros.fecha_fin) {
    sql += " AND DATE(v.fecha_venta) BETWEEN ? AND ?";
    params.push(filtros.fecha_inicio, filtros.fecha_fin);
  }

  if (filtros.id_categoria) {
    sql += " AND p.id_categoria = ?";
    params.push(filtros.id_categoria);
  }

  sql += `
    GROUP BY p.id_producto, p.nombre_producto, cat.nombre_categoria
    ORDER BY cantidad_vendida DESC
  `;

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function getResumenGerencial(filtros) {
  const ventas = await getReporteVentas(filtros);
  const inventario = await getReporteInventario({});
  const compras = await getReporteCompras(filtros);
  const productosMasVendidos = await getReporteProductosMasVendidos(filtros);

  const totalVentas = ventas.reduce((acc, item) => acc + Number(item.total || 0), 0);
  const totalCompras = compras.reduce((acc, item) => acc + Number(item.total || 0), 0);
  const ventasCompletadas = ventas.filter((item) => item.estado_venta === "completada").length;
  const ventasPendientes = ventas.filter((item) => item.estado_venta === "pendiente").length;
  const productosStockBajo = inventario.filter((item) => item.alerta_stock === "stock_bajo").length;

  return {
    indicadores: {
      total_ventas: Number(totalVentas.toFixed(2)),
      total_compras: Number(totalCompras.toFixed(2)),
      utilidad_referencial: Number((totalVentas - totalCompras).toFixed(2)),
      ventas_completadas: ventasCompletadas,
      ventas_pendientes: ventasPendientes,
      productos_stock_bajo: productosStockBajo
    },
    ventas,
    compras,
    inventario,
    productos_mas_vendidos: productosMasVendidos
  };
}

module.exports = {
  getReporteVentas,
  getReporteInventario,
  getReporteCompras,
  getReporteProductosMasVendidos,
  getResumenGerencial
};