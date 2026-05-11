const pool = require("../../config/db");

async function findAllCombos() {
  const sql = `
    SELECT
      id_combo,
      nombre_combo,
      descripcion,
      precio_combo,
      fecha_inicio,
      fecha_fin,
      estado_combo
    FROM combos
    WHERE estado_visible = 1
    ORDER BY id_combo DESC
  `;

  const [rows] = await pool.query(sql);
  return rows;
}

async function findComboById(id_combo) {
  const comboSql = `
    SELECT
      id_combo,
      nombre_combo,
      descripcion,
      precio_combo,
      fecha_inicio,
      fecha_fin,
      estado_combo
    FROM combos
    WHERE id_combo = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const detalleSql = `
    SELECT
      cd.id_combo_detalle,
      cd.id_combo,
      cd.id_variante,
      p.nombre_producto,
      co.nombre_color,
      ta.nombre_talla,
      pv.sku,
      cd.cantidad,
      cd.precio_referencial
    FROM combo_detalle cd
    INNER JOIN producto_variantes pv ON cd.id_variante = pv.id_variante
    INNER JOIN productos p ON pv.id_producto = p.id_producto
    INNER JOIN colores co ON pv.id_color = co.id_color
    INNER JOIN tallas ta ON pv.id_talla = ta.id_talla
    WHERE cd.id_combo = ?
    AND cd.estado_visible = 1
  `;

  const [comboRows] = await pool.query(comboSql, [id_combo]);

  if (comboRows.length === 0) {
    return null;
  }

  const [detalleRows] = await pool.query(detalleSql, [id_combo]);

  return {
    ...comboRows[0],
    detalles: detalleRows
  };
}

async function createCombo(data) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `
      INSERT INTO combos
      (
        nombre_combo,
        descripcion,
        precio_combo,
        fecha_inicio,
        fecha_fin,
        estado_combo,
        estado_visible
      )
      VALUES (?, ?, ?, ?, ?, ?, 1)
      `,
      [
        data.nombre_combo,
        data.descripcion,
        data.precio_combo,
        data.fecha_inicio,
        data.fecha_fin,
        data.estado_combo || "activo"
      ]
    );

    const idCombo = result.insertId;

    for (const item of data.detalles) {
      await connection.query(
        `
        INSERT INTO combo_detalle
        (
          id_combo,
          id_variante,
          cantidad,
          precio_referencial,
          estado_visible
        )
        VALUES (?, ?, ?, ?, 1)
        `,
        [
          idCombo,
          item.id_variante,
          item.cantidad,
          item.precio_referencial || 0
        ]
      );
    }

    await connection.commit();
    return idCombo;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateCombo(id_combo, data) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `
      UPDATE combos
      SET
        nombre_combo = ?,
        descripcion = ?,
        precio_combo = ?,
        fecha_inicio = ?,
        fecha_fin = ?,
        estado_combo = ?
      WHERE id_combo = ?
      AND estado_visible = 1
      `,
      [
        data.nombre_combo,
        data.descripcion,
        data.precio_combo,
        data.fecha_inicio,
        data.fecha_fin,
        data.estado_combo,
        id_combo
      ]
    );

    await connection.query(
      `
      UPDATE combo_detalle
      SET estado_visible = 0
      WHERE id_combo = ?
      `,
      [id_combo]
    );

    for (const item of data.detalles) {
      await connection.query(
        `
        INSERT INTO combo_detalle
        (
          id_combo,
          id_variante,
          cantidad,
          precio_referencial,
          estado_visible
        )
        VALUES (?, ?, ?, ?, 1)
        `,
        [
          id_combo,
          item.id_variante,
          item.cantidad,
          item.precio_referencial || 0
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

async function deleteComboLogical(id_combo) {
  const sql = `
    UPDATE combos
    SET estado_visible = 0
    WHERE id_combo = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [id_combo]);
  return result.affectedRows;
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
  findAllCombos,
  findComboById,
  createCombo,
  updateCombo,
  deleteComboLogical,
  varianteExists
};