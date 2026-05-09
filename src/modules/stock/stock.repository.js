const pool = require("../../config/db");

async function findAllMovimientos() {
  const sql = `
    SELECT
      ms.id_movimiento,
      ms.id_variante,
      p.nombre_producto,
      c.nombre_color,
      t.nombre_talla,
      pv.sku,
      ms.tipo_movimiento,
      ms.cantidad,
      ms.motivo,
      ms.referencia_tipo,
      ms.referencia_id,
      ms.fecha_movimiento,
      pv.stock_actual
    FROM movimientos_stock ms
    INNER JOIN producto_variantes pv ON ms.id_variante = pv.id_variante
    INNER JOIN productos p ON pv.id_producto = p.id_producto
    INNER JOIN colores c ON pv.id_color = c.id_color
    INNER JOIN tallas t ON pv.id_talla = t.id_talla
    WHERE ms.estado_visible = 1
    ORDER BY ms.id_movimiento DESC
  `;

  const [rows] = await pool.query(sql);
  return rows;
}

async function findMovimientoById(id_movimiento) {
  const sql = `
    SELECT
      ms.id_movimiento,
      ms.id_variante,
      p.nombre_producto,
      c.nombre_color,
      t.nombre_talla,
      pv.sku,
      ms.tipo_movimiento,
      ms.cantidad,
      ms.motivo,
      ms.referencia_tipo,
      ms.referencia_id,
      ms.fecha_movimiento,
      pv.stock_actual
    FROM movimientos_stock ms
    INNER JOIN producto_variantes pv ON ms.id_variante = pv.id_variante
    INNER JOIN productos p ON pv.id_producto = p.id_producto
    INNER JOIN colores c ON pv.id_color = c.id_color
    INNER JOIN tallas t ON pv.id_talla = t.id_talla
    WHERE ms.id_movimiento = ?
    AND ms.estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_movimiento]);
  return rows[0];
}

async function registrarMovimientoConStock(data) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [varianteRows] = await connection.query(
      `
      SELECT 
        id_variante,
        stock_actual
      FROM producto_variantes
      WHERE id_variante = ?
      AND estado_visible = 1
      AND estado_variante = 'activo'
      FOR UPDATE
      `,
      [data.id_variante]
    );

    if (varianteRows.length === 0) {
      const error = new Error("La variante seleccionada no existe o no está activa");
      error.status = 404;
      throw error;
    }

    const stockActual = Number(varianteRows[0].stock_actual);
    let nuevoStock = stockActual;

    if (data.tipo_movimiento === "entrada" || data.tipo_movimiento === "devolucion") {
      nuevoStock = stockActual + data.cantidad;
    }

    if (data.tipo_movimiento === "salida") {
      if (stockActual < data.cantidad) {
        const error = new Error(`Stock insuficiente. Stock actual: ${stockActual}`);
        error.status = 400;
        throw error;
      }

      nuevoStock = stockActual - data.cantidad;
    }

    if (data.tipo_movimiento === "ajuste") {
      nuevoStock = stockActual + data.cantidad;
    }

    const [movimientoResult] = await connection.query(
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
      VALUES (?, ?, ?, ?, ?, ?, 1)
      `,
      [
        data.id_variante,
        data.tipo_movimiento,
        data.cantidad,
        data.motivo,
        data.referencia_tipo,
        data.referencia_id
      ]
    );

    await connection.query(
      `
      UPDATE producto_variantes
      SET stock_actual = ?
      WHERE id_variante = ?
      `,
      [nuevoStock, data.id_variante]
    );

    await connection.commit();

    return movimientoResult.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  findAllMovimientos,
  findMovimientoById,
  registrarMovimientoConStock
};