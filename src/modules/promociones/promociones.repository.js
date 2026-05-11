const pool = require("../../config/db");

async function findAllPromociones() {
  const sql = `
    SELECT
      id_promocion,
      nombre_promocion,
      descripcion,
      tipo_promocion,
      valor_descuento,
      fecha_inicio,
      fecha_fin,
      estado_promocion
    FROM promociones
    WHERE estado_visible = 1
    ORDER BY id_promocion DESC
  `;

  const [rows] = await pool.query(sql);
  return rows;
}

async function findPromocionById(id_promocion) {
  const promocionSql = `
    SELECT
      id_promocion,
      nombre_promocion,
      descripcion,
      tipo_promocion,
      valor_descuento,
      fecha_inicio,
      fecha_fin,
      estado_promocion
    FROM promociones
    WHERE id_promocion = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const detalleSql = `
    SELECT
      pd.id_promocion_detalle,
      pd.id_promocion,
      pd.id_producto,
      p.nombre_producto,
      pd.id_variante,
      pv.sku,
      pd.cantidad_minima,
      pd.estado_visible
    FROM promocion_detalle pd
    LEFT JOIN productos p ON pd.id_producto = p.id_producto
    LEFT JOIN producto_variantes pv ON pd.id_variante = pv.id_variante
    WHERE pd.id_promocion = ?
    AND pd.estado_visible = 1
  `;

  const [promocionRows] = await pool.query(promocionSql, [id_promocion]);

  if (promocionRows.length === 0) {
    return null;
  }

  const [detalleRows] = await pool.query(detalleSql, [id_promocion]);

  return {
    ...promocionRows[0],
    detalles: detalleRows
  };
}

async function createPromocion(data) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `
      INSERT INTO promociones
      (
        nombre_promocion,
        descripcion,
        tipo_promocion,
        valor_descuento,
        fecha_inicio,
        fecha_fin,
        estado_promocion,
        estado_visible
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `,
      [
        data.nombre_promocion,
        data.descripcion,
        data.tipo_promocion,
        data.valor_descuento,
        data.fecha_inicio,
        data.fecha_fin,
        data.estado_promocion || "activo"
      ]
    );

    const idPromocion = result.insertId;

    for (const item of data.detalles) {
      await connection.query(
        `
        INSERT INTO promocion_detalle
        (
          id_promocion,
          id_producto,
          id_variante,
          cantidad_minima,
          estado_visible
        )
        VALUES (?, ?, ?, ?, 1)
        `,
        [
          idPromocion,
          item.id_producto || null,
          item.id_variante || null,
          item.cantidad_minima || 1
        ]
      );
    }

    await connection.commit();
    return idPromocion;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updatePromocion(id_promocion, data) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `
      UPDATE promociones
      SET
        nombre_promocion = ?,
        descripcion = ?,
        tipo_promocion = ?,
        valor_descuento = ?,
        fecha_inicio = ?,
        fecha_fin = ?,
        estado_promocion = ?
      WHERE id_promocion = ?
      AND estado_visible = 1
      `,
      [
        data.nombre_promocion,
        data.descripcion,
        data.tipo_promocion,
        data.valor_descuento,
        data.fecha_inicio,
        data.fecha_fin,
        data.estado_promocion,
        id_promocion
      ]
    );

    await connection.query(
      `
      UPDATE promocion_detalle
      SET estado_visible = 0
      WHERE id_promocion = ?
      `,
      [id_promocion]
    );

    for (const item of data.detalles) {
      await connection.query(
        `
        INSERT INTO promocion_detalle
        (
          id_promocion,
          id_producto,
          id_variante,
          cantidad_minima,
          estado_visible
        )
        VALUES (?, ?, ?, ?, 1)
        `,
        [
          id_promocion,
          item.id_producto || null,
          item.id_variante || null,
          item.cantidad_minima || 1
        ]
      );
    }

    await connection.commit();
    return result.affectedRows;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function deletePromocionLogical(id_promocion) {
  const sql = `
    UPDATE promociones
    SET estado_visible = 0
    WHERE id_promocion = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [id_promocion]);
  return result.affectedRows;
}

async function productoExists(id_producto) {
  const sql = `
    SELECT id_producto
    FROM productos
    WHERE id_producto = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_producto]);
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

module.exports = {
  findAllPromociones,
  findPromocionById,
  createPromocion,
  updatePromocion,
  deletePromocionLogical,
  productoExists,
  varianteExists
};