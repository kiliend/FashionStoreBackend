const pool = require("../../config/db");

async function findAllOrdenesCompra() {
  const sql = `
    SELECT
      oc.id_orden_compra,
      oc.id_proveedor,
      p.razon_social,
      p.ruc,
      oc.id_usuario_registro,
      ur.usuario AS usuario_registro,
      oc.id_usuario_pago,
      up.usuario AS usuario_pago,
      oc.fecha_orden,
      oc.total,
      oc.estado_orden,
      oc.estado_factura,
      oc.fecha_pago
    FROM ordenes_compra oc
    INNER JOIN proveedores p ON oc.id_proveedor = p.id_proveedor
    LEFT JOIN usuarios ur ON oc.id_usuario_registro = ur.id_usuario
    LEFT JOIN usuarios up ON oc.id_usuario_pago = up.id_usuario
    WHERE oc.estado_visible = 1
    ORDER BY oc.id_orden_compra DESC
  `;

  const [rows] = await pool.query(sql);
  return rows;
}

async function findOrdenCompraById(id_orden_compra) {
  const ordenSql = `
    SELECT
      oc.id_orden_compra,
      oc.id_proveedor,
      p.razon_social,
      p.ruc,
      oc.id_usuario_registro,
      ur.usuario AS usuario_registro,
      oc.id_usuario_pago,
      up.usuario AS usuario_pago,
      oc.fecha_orden,
      oc.total,
      oc.estado_orden,
      oc.estado_factura,
      oc.fecha_pago
    FROM ordenes_compra oc
    INNER JOIN proveedores p ON oc.id_proveedor = p.id_proveedor
    LEFT JOIN usuarios ur ON oc.id_usuario_registro = ur.id_usuario
    LEFT JOIN usuarios up ON oc.id_usuario_pago = up.id_usuario
    WHERE oc.id_orden_compra = ?
    AND oc.estado_visible = 1
    LIMIT 1
  `;

  const detalleSql = `
    SELECT
      cd.id_combo_detalle,
      cd.id_combo,
      cd.id_producto,
      cd.id_variante,
      p.nombre_producto,
      pv.sku,
      c.nombre_color,
      t.nombre_talla,
      cd.cantidad,
      cd.precio_referencial,
      cd.estado_visible
    FROM combo_detalle cd
    LEFT JOIN producto_variantes pv ON cd.id_variante = pv.id_variante
    LEFT JOIN productos p ON pv.id_producto = p.id_producto
    LEFT JOIN colores c ON pv.id_color = c.id_color
    LEFT JOIN tallas t ON pv.id_talla = t.id_talla
    WHERE cd.id_combo = ?
    AND cd.estado_visible = 1
  `;

  const [ordenRows] = await pool.query(ordenSql, [id_orden_compra]);

  if (ordenRows.length === 0) {
    return null;
  }

  const [detalleRows] = await pool.query(detalleSql, [id_orden_compra]);

  return {
    ...ordenRows[0],
    detalles: detalleRows
  };
}

async function proveedorExists(id_proveedor) {
  const sql = `
    SELECT id_proveedor
    FROM proveedores
    WHERE id_proveedor = ?
    AND estado_visible = 1
    AND estado_proveedor = 'activo'
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_proveedor]);
  return rows.length > 0;
}

async function varianteExists(id_variante) {
  const sql = `
    SELECT id_variante
    FROM producto_variantes
    WHERE id_variante = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_variante]);
  return rows.length > 0;
}

async function crearOrdenCompra(data) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const total = data.detalles.reduce((acc, item) => {
      return acc + (Number(item.cantidad) * Number(item.costo_unitario));
    }, 0);

    const [ordenResult] = await connection.query(
      `
      INSERT INTO ordenes_compra
      (
        id_proveedor,
        id_usuario_registro,
        total,
        estado_orden,
        estado_factura,
        estado_visible
      )
      VALUES (?, ?, ?, 'registrada', 'pendiente', 1)
      `,
      [
        data.id_proveedor,
        data.id_usuario_registro || null,
        total
      ]
    );

    const idOrdenCompra = ordenResult.insertId;

    for (const item of data.detalles) {
      const cantidad = Number(item.cantidad);
      const costoUnitario = Number(item.costo_unitario);
      const subtotal = Number((cantidad * costoUnitario).toFixed(2));

      await connection.query(
        `
        INSERT INTO detalle_orden_compra
        (
          id_orden_compra,
          id_variante,
          descripcion_producto,
          cantidad,
          costo_unitario,
          subtotal,
          estado_visible
        )
        VALUES (?, ?, ?, ?, ?, ?, 1)
        `,
        [
          idOrdenCompra,
          item.id_variante || null,
          item.descripcion_producto,
          cantidad,
          costoUnitario,
          subtotal
        ]
      );
    }

    await connection.commit();

    return idOrdenCompra;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function recibirOrdenCompra(id_orden_compra) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [ordenRows] = await connection.query(
      `
      SELECT id_orden_compra, estado_orden
      FROM ordenes_compra
      WHERE id_orden_compra = ?
      AND estado_visible = 1
      FOR UPDATE
      `,
      [id_orden_compra]
    );

    if (ordenRows.length === 0) {
      const error = new Error("Orden de compra no encontrada");
      error.status = 404;
      throw error;
    }

    if (ordenRows[0].estado_orden === "recibida") {
      const error = new Error("La orden de compra ya fue recibida");
      error.status = 400;
      throw error;
    }

    if (ordenRows[0].estado_orden === "cancelada") {
      const error = new Error("No se puede recibir una orden cancelada");
      error.status = 400;
      throw error;
    }

    const [detalles] = await connection.query(
      `
      SELECT id_variante, cantidad
      FROM detalle_orden_compra
      WHERE id_orden_compra = ?
      AND estado_visible = 1
      `,
      [id_orden_compra]
    );

    for (const item of detalles) {
      if (!item.id_variante) {
        continue;
      }

      const [varianteRows] = await connection.query(
        `
        SELECT stock_actual
        FROM producto_variantes
        WHERE id_variante = ?
        AND estado_visible = 1
        FOR UPDATE
        `,
        [item.id_variante]
      );

      if (varianteRows.length === 0) {
        const error = new Error(`La variante ${item.id_variante} no existe`);
        error.status = 400;
        throw error;
      }

      const stockActual = Number(varianteRows[0].stock_actual);
      const nuevoStock = stockActual + Number(item.cantidad);

      await connection.query(
        `
        UPDATE producto_variantes
        SET stock_actual = ?
        WHERE id_variante = ?
        `,
        [nuevoStock, item.id_variante]
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
        VALUES (?, 'entrada', ?, ?, 'orden_compra', ?, 1)
        `,
        [
          item.id_variante,
          item.cantidad,
          `Entrada por orden de compra #${id_orden_compra}`,
          id_orden_compra
        ]
      );
    }

    await connection.query(
      `
      UPDATE ordenes_compra
      SET estado_orden = 'recibida'
      WHERE id_orden_compra = ?
      `,
      [id_orden_compra]
    );

    await connection.commit();

    return id_orden_compra;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function pagarOrdenCompra(id_orden_compra, data) {
  const sql = `
    UPDATE ordenes_compra
    SET
      estado_factura = 'pagada',
      id_usuario_pago = ?,
      fecha_pago = NOW()
    WHERE id_orden_compra = ?
    AND estado_visible = 1
    AND estado_factura = 'pendiente'
  `;

  const [result] = await pool.query(sql, [
    data.id_usuario_pago || null,
    id_orden_compra
  ]);

  return result.affectedRows;
}

async function cancelarOrdenCompra(id_orden_compra) {
  const sql = `
    UPDATE ordenes_compra
    SET estado_orden = 'cancelada'
    WHERE id_orden_compra = ?
    AND estado_visible = 1
    AND estado_orden = 'registrada'
  `;

  const [result] = await pool.query(sql, [id_orden_compra]);
  return result.affectedRows;
}

module.exports = {
  findAllOrdenesCompra,
  findOrdenCompraById,
  proveedorExists,
  varianteExists,
  crearOrdenCompra,
  recibirOrdenCompra,
  pagarOrdenCompra,
  cancelarOrdenCompra
};