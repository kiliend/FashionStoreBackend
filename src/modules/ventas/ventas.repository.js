const pool = require("../../config/db");

async function findAllVentas() {
  const sql = `
    SELECT
      v.id_venta,
      v.id_cliente,
      CONCAT(c.nombres, ' ', c.apellidos) AS cliente_nombre,
      c.razon_social,
      v.id_vendedor,
      uv.usuario AS vendedor_usuario,
      v.id_usuario_creacion,
      uc.usuario AS usuario_creacion,
      v.fecha_venta,
      v.fecha_completada,
      v.fecha_anulacion,
      v.motivo_anulacion,
      v.origen_venta,
      v.metodo_pago,
      v.subtotal,
      v.igv,
      v.descuento_total,
      v.total,
      v.estado_venta
    FROM ventas v
    LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
    LEFT JOIN usuarios uv ON v.id_vendedor = uv.id_usuario
    LEFT JOIN usuarios uc ON v.id_usuario_creacion = uc.id_usuario
    WHERE v.estado_visible = 1
    ORDER BY v.id_venta DESC
  `;

  const [rows] = await pool.query(sql);
  return rows;
}

async function findVentaById(id_venta) {
  const ventaSql = `
    SELECT
      v.id_venta,
      v.id_cliente,
      CONCAT(c.nombres, ' ', c.apellidos) AS cliente_nombre,
      c.razon_social,
      v.id_vendedor,
      uv.usuario AS vendedor_usuario,
      v.id_usuario_creacion,
      uc.usuario AS usuario_creacion,
      v.id_usuario_anulacion,
      ua.usuario AS usuario_anulacion,
      v.fecha_venta,
      v.fecha_completada,
      v.fecha_anulacion,
      v.motivo_anulacion,
      v.origen_venta,
      v.metodo_pago,
      v.subtotal,
      v.igv,
      v.descuento_total,
      v.total,
      v.estado_venta
    FROM ventas v
    LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
    LEFT JOIN usuarios uv ON v.id_vendedor = uv.id_usuario
    LEFT JOIN usuarios uc ON v.id_usuario_creacion = uc.id_usuario
    LEFT JOIN usuarios ua ON v.id_usuario_anulacion = ua.id_usuario
    WHERE v.id_venta = ?
    AND v.estado_visible = 1
    LIMIT 1
  `;

  const detalleSql = `
    SELECT
      dv.id_detalle_venta,
      dv.tipo_item,
      dv.id_variante,
      dv.id_promocion,
      dv.id_combo,
      dv.descripcion_item,
      COALESCE(dv.descripcion_item, p.nombre_producto, cb.nombre_combo) AS nombre_item,
      p.nombre_producto,
      cb.nombre_combo,
      co.nombre_color,
      t.nombre_talla,
      pv.sku,
      dv.cantidad,
      dv.precio_unitario,
      dv.descuento,
      dv.subtotal
    FROM detalle_ventas dv
    LEFT JOIN producto_variantes pv ON dv.id_variante = pv.id_variante
    LEFT JOIN productos p ON pv.id_producto = p.id_producto
    LEFT JOIN colores co ON pv.id_color = co.id_color
    LEFT JOIN tallas t ON pv.id_talla = t.id_talla
    LEFT JOIN combos cb ON dv.id_combo = cb.id_combo
    WHERE dv.id_venta = ?
    AND dv.estado_visible = 1
  `;

  const [ventaRows] = await pool.query(ventaSql, [id_venta]);

  if (ventaRows.length === 0) {
    return null;
  }

  const [detalleRows] = await pool.query(detalleSql, [id_venta]);

  return {
    ...ventaRows[0],
    detalles: detalleRows
  };
}

async function descontarStockVariante(connection, id_variante, cantidad, idVenta) {
  const [varianteRows] = await connection.query(
    `
    SELECT id_variante, stock_actual
    FROM producto_variantes
    WHERE id_variante = ?
    AND estado_visible = 1
    AND estado_variante = 'activo'
    FOR UPDATE
    `,
    [id_variante]
  );

  if (varianteRows.length === 0) {
    const error = new Error(`La variante ${id_variante} no existe o está inactiva`);
    error.status = 400;
    throw error;
  }

  const stockActual = Number(varianteRows[0].stock_actual);

  if (stockActual < Number(cantidad)) {
    const error = new Error(
      `Stock insuficiente para la variante ${id_variante}. Stock actual: ${stockActual}`
    );
    error.status = 400;
    throw error;
  }

  await connection.query(
    `
    UPDATE producto_variantes
    SET stock_actual = stock_actual - ?
    WHERE id_variante = ?
    `,
    [cantidad, id_variante]
  );

  await connection.query(
    `
    INSERT INTO movimientos_stock
    (
      id_variante,
      tipo_movimiento,
      cantidad,
      motivo,
      referencia_tipo,
      referencia_id,
      estado_visible
    )
    VALUES (?, 'salida', ?, ?, 'venta', ?, 1)
    `,
    [
      id_variante,
      cantidad,
      `Salida por venta #${idVenta}`,
      idVenta
    ]
  );
}

async function reponerStockVariante(connection, id_variante, cantidad, idVenta) {
  const [varianteRows] = await connection.query(
    `
    SELECT id_variante, stock_actual
    FROM producto_variantes
    WHERE id_variante = ?
    AND estado_visible = 1
    FOR UPDATE
    `,
    [id_variante]
  );

  if (varianteRows.length === 0) {
    const error = new Error(`La variante ${id_variante} no existe`);
    error.status = 400;
    throw error;
  }

  await connection.query(
    `
    UPDATE producto_variantes
    SET stock_actual = stock_actual + ?
    WHERE id_variante = ?
    `,
    [cantidad, id_variante]
  );

  await connection.query(
    `
    INSERT INTO movimientos_stock
    (
      id_variante,
      tipo_movimiento,
      cantidad,
      motivo,
      referencia_tipo,
      referencia_id,
      estado_visible
    )
    VALUES (?, 'devolucion', ?, ?, 'anulacion_venta', ?, 1)
    `,
    [
      id_variante,
      cantidad,
      `Devolución de stock por anulación de venta #${idVenta}`,
      idVenta
    ]
  );
}

async function obtenerDetallesCombo(connection, id_combo) {
  const [detallesCombo] = await connection.query(
    `
    SELECT
      id_combo_detalle,
      id_combo,
      id_variante,
      cantidad
    FROM combo_detalle
    WHERE id_combo = ?
    AND estado_visible = 1
    `,
    [id_combo]
  );

  if (detallesCombo.length === 0) {
    const error = new Error(`El combo ${id_combo} no tiene productos configurados`);
    error.status = 400;
    throw error;
  }

  return detallesCombo;
}

async function descontarStockCombo(connection, id_combo, cantidadCombo, idVenta) {
  const detallesCombo = await obtenerDetallesCombo(connection, id_combo);

  for (const item of detallesCombo) {
    const cantidadADescontar = Number(item.cantidad) * Number(cantidadCombo);

    await descontarStockVariante(
      connection,
      item.id_variante,
      cantidadADescontar,
      idVenta
    );
  }
}

async function reponerStockCombo(connection, id_combo, cantidadCombo, idVenta) {
  const detallesCombo = await obtenerDetallesCombo(connection, id_combo);

  for (const item of detallesCombo) {
    const cantidadAReponer = Number(item.cantidad) * Number(cantidadCombo);

    await reponerStockVariante(
      connection,
      item.id_variante,
      cantidadAReponer,
      idVenta
    );
  }
}

async function crearVentaConDetalles(data) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const subtotal = data.detalles.reduce((acc, item) => {
      const cantidad = Number(item.cantidad);
      const precio = Number(item.precio_unitario);
      const descuento = Number(item.descuento || 0);
      return acc + ((cantidad * precio) - descuento);
    }, 0);

    const descuentoTotal = Number(data.descuento_total || 0);
    const baseImponible = subtotal - descuentoTotal;
    const igv = Number((baseImponible * 0.18).toFixed(2));
    const total = Number((baseImponible + igv).toFixed(2));

    const [ventaResult] = await connection.query(
      `
      INSERT INTO ventas
      (
        id_cliente,
        id_vendedor,
        id_usuario_creacion,
        origen_venta,
        metodo_pago,
        subtotal,
        igv,
        descuento_total,
        total,
        estado_venta,
        fecha_completada,
        estado_visible
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `,
      [
        data.id_cliente || null,
        data.id_vendedor || null,
        data.id_usuario_creacion || null,
        data.origen_venta,
        data.metodo_pago || "efectivo",
        subtotal,
        igv,
        descuentoTotal,
        total,
        data.estado_venta || "completada",
        data.estado_venta === "pendiente" ? null : new Date()
      ]
    );

    const idVenta = ventaResult.insertId;

    for (const item of data.detalles) {
      const tipoItem = item.tipo_item || "producto";
      const cantidad = Number(item.cantidad);
      const precioUnitario = Number(item.precio_unitario);
      const descuento = Number(item.descuento || 0);
      const subtotalDetalle = Number(((cantidad * precioUnitario) - descuento).toFixed(2));

      await connection.query(
        `
        INSERT INTO detalle_ventas
        (
          id_venta,
          tipo_item,
          id_variante,
          id_promocion,
          id_combo,
          descripcion_item,
          cantidad,
          precio_unitario,
          descuento,
          subtotal,
          estado_visible
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `,
        [
          idVenta,
          tipoItem,
          item.id_variante || null,
          item.id_promocion || null,
          item.id_combo || null,
          item.descripcion_item || null,
          cantidad,
          precioUnitario,
          descuento,
          subtotalDetalle
        ]
      );

      if (data.estado_venta !== "pendiente") {
        if (tipoItem === "combo") {
          await descontarStockCombo(connection, item.id_combo, cantidad, idVenta);
        } else {
          await descontarStockVariante(connection, item.id_variante, cantidad, idVenta);
        }
      }
    }

    await connection.commit();

    return idVenta;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function findVentaPendienteById(id_venta, connection = pool) {
  const sql = `
    SELECT 
      id_venta,
      estado_venta,
      estado_visible
    FROM ventas
    WHERE id_venta = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await connection.query(sql, [id_venta]);
  return rows[0];
}

async function findDetalleVenta(id_venta, connection = pool) {
  const sql = `
    SELECT
      id_detalle_venta,
      tipo_item,
      id_variante,
      id_combo,
      cantidad
    FROM detalle_ventas
    WHERE id_venta = ?
    AND estado_visible = 1
  `;

  const [rows] = await connection.query(sql, [id_venta]);
  return rows;
}

async function completarVenta(id_venta) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const venta = await findVentaPendienteById(id_venta, connection);

    if (!venta) {
      const error = new Error("Venta no encontrada");
      error.status = 404;
      throw error;
    }

    if (venta.estado_venta === "completada") {
      const error = new Error("La venta ya se encuentra completada");
      error.status = 400;
      throw error;
    }

    if (venta.estado_venta === "anulada") {
      const error = new Error("No se puede completar una venta anulada");
      error.status = 400;
      throw error;
    }

    const detalles = await findDetalleVenta(id_venta, connection);

    if (detalles.length === 0) {
      const error = new Error("La venta no tiene detalle de productos");
      error.status = 400;
      throw error;
    }

    for (const item of detalles) {
      const tipoItem = item.tipo_item || "producto";

      if (tipoItem === "combo") {
        await descontarStockCombo(connection, item.id_combo, item.cantidad, id_venta);
      } else {
        await descontarStockVariante(connection, item.id_variante, item.cantidad, id_venta);
      }
    }

    await connection.query(
      `
      UPDATE ventas
      SET 
        estado_venta = 'completada',
        fecha_completada = NOW()
      WHERE id_venta = ?
      AND estado_visible = 1
      `,
      [id_venta]
    );

    await connection.commit();

    return {
      id_venta: Number(id_venta),
      estado_venta: "completada"
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function anularVenta(id_venta, data) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [ventaRows] = await connection.query(
      `
      SELECT id_venta, estado_venta
      FROM ventas
      WHERE id_venta = ?
      AND estado_visible = 1
      FOR UPDATE
      `,
      [id_venta]
    );

    if (ventaRows.length === 0) {
      const error = new Error("Venta no encontrada");
      error.status = 404;
      throw error;
    }

    if (ventaRows[0].estado_venta === "anulada") {
      const error = new Error("La venta ya se encuentra anulada");
      error.status = 400;
      throw error;
    }

    const estadoAnterior = ventaRows[0].estado_venta;

    const [detalles] = await connection.query(
      `
      SELECT
        tipo_item,
        id_variante,
        id_combo,
        cantidad
      FROM detalle_ventas
      WHERE id_venta = ?
      AND estado_visible = 1
      `,
      [id_venta]
    );

    if (estadoAnterior === "completada") {
      for (const item of detalles) {
        const tipoItem = item.tipo_item || "producto";

        if (tipoItem === "combo") {
          await reponerStockCombo(connection, item.id_combo, item.cantidad, id_venta);
        } else {
          await reponerStockVariante(connection, item.id_variante, item.cantidad, id_venta);
        }
      }
    }

    await connection.query(
      `
      UPDATE ventas
      SET
        estado_venta = 'anulada',
        fecha_anulacion = NOW(),
        motivo_anulacion = ?,
        id_usuario_anulacion = ?
      WHERE id_venta = ?
      `,
      [
        data.motivo_anulacion,
        data.id_usuario_anulacion || null,
        id_venta
      ]
    );

    await connection.commit();

    return id_venta;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  findAllVentas,
  findVentaById,
  crearVentaConDetalles,
  anularVenta,
  completarVenta
};