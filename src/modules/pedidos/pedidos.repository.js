const pool = require("../../config/db");

async function findAllPedidos() {
  const sql = `
    SELECT
      p.id_pedido,
      p.id_venta,
      p.id_cliente,
      CONCAT(c.nombres, ' ', c.apellidos) AS cliente_nombre,
      c.razon_social,
      p.fecha_pedido,
      p.tipo_entrega,
      p.direccion_entrega,
      p.referencia_entrega,
      p.estado_pedido,
      ua.usuario AS usuario_almacen,
      ud.usuario AS usuario_despacho,
      ur.usuario AS usuario_reparto
    FROM pedidos p
    LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
    LEFT JOIN usuarios ua ON p.id_usuario_almacen = ua.id_usuario
    LEFT JOIN usuarios ud ON p.id_usuario_despacho = ud.id_usuario
    LEFT JOIN usuarios ur ON p.id_usuario_reparto = ur.id_usuario
    WHERE p.estado_visible = 1
    ORDER BY p.id_pedido DESC
  `;

  const [rows] = await pool.query(sql);
  return rows;
}

async function findPedidoById(id_pedido) {
  const pedidoSql = `
    SELECT
      p.id_pedido,
      p.id_venta,
      p.id_cliente,
      CONCAT(c.nombres, ' ', c.apellidos) AS cliente_nombre,
      c.razon_social,
      p.id_usuario_almacen,
      p.id_usuario_despacho,
      p.id_usuario_reparto,
      p.fecha_pedido,
      p.tipo_entrega,
      p.direccion_entrega,
      p.referencia_entrega,
      p.estado_pedido
    FROM pedidos p
    LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
    WHERE p.id_pedido = ?
    AND p.estado_visible = 1
    LIMIT 1
  `;

  const detalleSql = `
    SELECT
      pd.id_pedido_detalle,
      pd.id_detalle_venta,
      pd.id_variante,
      pr.nombre_producto,
      co.nombre_color,
      ta.nombre_talla,
      pv.sku,
      pd.cantidad_solicitada,
      pd.cantidad_preparada,
      pd.cantidad_entregada,
      pd.estado_detalle
    FROM pedido_detalle pd
    INNER JOIN producto_variantes pv ON pd.id_variante = pv.id_variante
    INNER JOIN productos pr ON pv.id_producto = pr.id_producto
    INNER JOIN colores co ON pv.id_color = co.id_color
    INNER JOIN tallas ta ON pv.id_talla = ta.id_talla
    WHERE pd.id_pedido = ?
    AND pd.estado_visible = 1
  `;

  const asignacionesSql = `
    SELECT
      pa.id_asignacion,
      pa.id_usuario,
      u.usuario,
      pa.rol_operativo,
      pa.fecha_asignacion,
      pa.fecha_inicio,
      pa.fecha_fin,
      pa.estado_asignacion,
      pa.observacion
    FROM pedido_asignaciones pa
    INNER JOIN usuarios u ON pa.id_usuario = u.id_usuario
    WHERE pa.id_pedido = ?
    AND pa.estado_visible = 1
    ORDER BY pa.id_asignacion DESC
  `;

  const [pedidoRows] = await pool.query(pedidoSql, [id_pedido]);

  if (pedidoRows.length === 0) {
    return null;
  }

  const [detalleRows] = await pool.query(detalleSql, [id_pedido]);
  const [asignacionesRows] = await pool.query(asignacionesSql, [id_pedido]);

  return {
    ...pedidoRows[0],
    detalles: detalleRows,
    asignaciones: asignacionesRows
  };
}

async function findVentaParaPedido(id_venta) {
  const sql = `
    SELECT
      id_venta,
      id_cliente,
      estado_venta,
      origen_venta
    FROM ventas
    WHERE id_venta = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_venta]);
  return rows[0];
}

async function pedidoExistsByVenta(id_venta) {
  const sql = `
    SELECT id_pedido
    FROM pedidos
    WHERE id_venta = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_venta]);
  return rows[0];
}

async function crearPedidoDesdeVenta(data) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [pedidoResult] = await connection.query(
      `
      INSERT INTO pedidos
      (
        id_venta,
        id_cliente,
        tipo_entrega,
        direccion_entrega,
        referencia_entrega,
        estado_pedido,
        estado_visible
      )
      VALUES (?, ?, ?, ?, ?, 'pendiente', 1)
      `,
      [
        data.id_venta,
        data.id_cliente || null,
        data.tipo_entrega || "delivery",
        data.direccion_entrega || null,
        data.referencia_entrega || null
      ]
    );

    const idPedido = pedidoResult.insertId;

    const [detallesVenta] = await connection.query(
      `
      SELECT
        id_detalle_venta,
        id_variante,
        cantidad
      FROM detalle_ventas
      WHERE id_venta = ?
      AND estado_visible = 1
      `,
      [data.id_venta]
    );

    if (detallesVenta.length === 0) {
      const error = new Error("La venta no tiene detalles para generar pedido");
      error.status = 400;
      throw error;
    }

    for (const detalle of detallesVenta) {
      await connection.query(
        `
        INSERT INTO pedido_detalle
        (
          id_pedido,
          id_detalle_venta,
          id_variante,
          cantidad_solicitada,
          cantidad_preparada,
          cantidad_entregada,
          estado_detalle,
          estado_visible
        )
        VALUES (?, ?, ?, ?, 0, 0, 'pendiente', 1)
        `,
        [
          idPedido,
          detalle.id_detalle_venta,
          detalle.id_variante,
          detalle.cantidad
        ]
      );
    }

    await connection.commit();
    return idPedido;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateEstadoPedido(id_pedido, estado_pedido) {
  const sql = `
    UPDATE pedidos
    SET estado_pedido = ?
    WHERE id_pedido = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [estado_pedido, id_pedido]);
  return result.affectedRows;
}

async function asignarUsuarioPedido(id_pedido, data) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    let campoUsuario = null;

    if (data.rol_operativo === "almacen") {
      campoUsuario = "id_usuario_almacen";
    }

    if (data.rol_operativo === "despacho") {
      campoUsuario = "id_usuario_despacho";
    }

    if (data.rol_operativo === "reparto") {
      campoUsuario = "id_usuario_reparto";
    }

    await connection.query(
      `
      UPDATE pedidos
      SET ${campoUsuario} = ?
      WHERE id_pedido = ?
      AND estado_visible = 1
      `,
      [data.id_usuario, id_pedido]
    );

    await connection.query(
      `
      INSERT INTO pedido_asignaciones
      (
        id_pedido,
        id_usuario,
        rol_operativo,
        estado_asignacion,
        observacion,
        estado_visible
      )
      VALUES (?, ?, ?, 'pendiente', ?, 1)
      `,
      [
        id_pedido,
        data.id_usuario,
        data.rol_operativo,
        data.observacion || null
      ]
    );

    await connection.commit();
    return id_pedido;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function deletePedidoLogical(id_pedido) {
  const sql = `
    UPDATE pedidos
    SET estado_visible = 0
    WHERE id_pedido = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [id_pedido]);
  return result.affectedRows;
}

async function usuarioExists(id_usuario) {
  const sql = `
    SELECT id_usuario
    FROM usuarios
    WHERE id_usuario = ?
    AND estado_visible = 1
    AND estado_usuario = 'activo'
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_usuario]);
  return rows.length > 0;
}

module.exports = {
  findAllPedidos,
  findPedidoById,
  findVentaParaPedido,
  pedidoExistsByVenta,
  crearPedidoDesdeVenta,
  updateEstadoPedido,
  asignarUsuarioPedido,
  deletePedidoLogical,
  usuarioExists
};