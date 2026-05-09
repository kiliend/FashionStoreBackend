const pool = require("../../config/db");

async function findAllRepartos() {
  const sql = `
    SELECT
      r.id_reparto,
      r.id_pedido,
      r.id_repartidor,
      u.usuario AS repartidor_usuario,
      r.id_vehiculo,
      v.placa,
      v.tipo_vehiculo,
      r.fecha_asignacion,
      r.fecha_salida,
      r.fecha_entrega,
      r.estado_reparto,
      r.observacion_entrega,
      r.evidencia_entrega
    FROM repartos r
    INNER JOIN usuarios u ON r.id_repartidor = u.id_usuario
    LEFT JOIN vehiculos v ON r.id_vehiculo = v.id_vehiculo
    WHERE r.estado_visible = 1
    ORDER BY r.id_reparto DESC
  `;

  const [rows] = await pool.query(sql);
  return rows;
}

async function findRepartoById(id_reparto) {
  const sql = `
    SELECT
      r.id_reparto,
      r.id_pedido,
      r.id_repartidor,
      u.usuario AS repartidor_usuario,
      r.id_vehiculo,
      v.placa,
      v.tipo_vehiculo,
      r.fecha_asignacion,
      r.fecha_salida,
      r.fecha_entrega,
      r.estado_reparto,
      r.observacion_entrega,
      r.evidencia_entrega
    FROM repartos r
    INNER JOIN usuarios u ON r.id_repartidor = u.id_usuario
    LEFT JOIN vehiculos v ON r.id_vehiculo = v.id_vehiculo
    WHERE r.id_reparto = ?
    AND r.estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_reparto]);
  return rows[0];
}

async function pedidoExists(id_pedido) {
  const sql = `
    SELECT id_pedido, estado_pedido
    FROM pedidos
    WHERE id_pedido = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_pedido]);
  return rows[0];
}

async function repartoExistsByPedido(id_pedido) {
  const sql = `
    SELECT id_reparto
    FROM repartos
    WHERE id_pedido = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_pedido]);
  return rows[0];
}

async function usuarioRepartidorExists(id_repartidor) {
  const sql = `
    SELECT u.id_usuario, r.nombre_rol
    FROM usuarios u
    INNER JOIN roles r ON u.id_rol = r.id_rol
    WHERE u.id_usuario = ?
    AND u.estado_visible = 1
    AND u.estado_usuario = 'activo'
    AND r.nombre_rol = 'reparto'
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_repartidor]);
  return rows[0];
}

async function vehiculoDisponible(id_vehiculo) {
  const sql = `
    SELECT id_vehiculo, estado_vehiculo
    FROM vehiculos
    WHERE id_vehiculo = ?
    AND estado_visible = 1
    AND estado_vehiculo = 'disponible'
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_vehiculo]);
  return rows[0];
}

async function crearReparto(data) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `
      INSERT INTO repartos
      (
        id_pedido,
        id_repartidor,
        id_vehiculo,
        estado_reparto,
        observacion_entrega,
        evidencia_entrega,
        estado_visible
      )
      VALUES (?, ?, ?, 'asignado', NULL, NULL, 1)
      `,
      [
        data.id_pedido,
        data.id_repartidor,
        data.id_vehiculo || null
      ]
    );

    if (data.id_vehiculo) {
      await connection.query(
        `
        UPDATE vehiculos
        SET estado_vehiculo = 'en_ruta'
        WHERE id_vehiculo = ?
        `,
        [data.id_vehiculo]
      );
    }

    await connection.query(
      `
      UPDATE pedidos
      SET
        id_usuario_reparto = ?,
        estado_pedido = 'asignado_reparto'
      WHERE id_pedido = ?
      `,
      [data.id_repartidor, data.id_pedido]
    );

    await connection.commit();

    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function marcarSalida(id_reparto) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [repartoRows] = await connection.query(
      `
      SELECT id_reparto, id_pedido, estado_reparto
      FROM repartos
      WHERE id_reparto = ?
      AND estado_visible = 1
      FOR UPDATE
      `,
      [id_reparto]
    );

    if (repartoRows.length === 0) {
      const error = new Error("Reparto no encontrado");
      error.status = 404;
      throw error;
    }

    if (repartoRows[0].estado_reparto !== "asignado") {
      const error = new Error("Solo se puede marcar salida de un reparto asignado");
      error.status = 400;
      throw error;
    }

    await connection.query(
      `
      UPDATE repartos
      SET
        estado_reparto = 'en_ruta',
        fecha_salida = NOW()
      WHERE id_reparto = ?
      `,
      [id_reparto]
    );

    await connection.query(
      `
      UPDATE pedidos
      SET estado_pedido = 'en_ruta'
      WHERE id_pedido = ?
      `,
      [repartoRows[0].id_pedido]
    );

    await connection.commit();

    return id_reparto;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function entregarReparto(id_reparto, data) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [repartoRows] = await connection.query(
      `
      SELECT id_reparto, id_pedido, id_vehiculo, estado_reparto
      FROM repartos
      WHERE id_reparto = ?
      AND estado_visible = 1
      FOR UPDATE
      `,
      [id_reparto]
    );

    if (repartoRows.length === 0) {
      const error = new Error("Reparto no encontrado");
      error.status = 404;
      throw error;
    }

    if (repartoRows[0].estado_reparto !== "en_ruta") {
      const error = new Error("Solo se puede entregar un reparto en ruta");
      error.status = 400;
      throw error;
    }

    await connection.query(
      `
      UPDATE repartos
      SET
        estado_reparto = 'entregado',
        fecha_entrega = NOW(),
        observacion_entrega = ?,
        evidencia_entrega = ?
      WHERE id_reparto = ?
      `,
      [
        data.observacion_entrega || null,
        data.evidencia_entrega || null,
        id_reparto
      ]
    );

    await connection.query(
      `
      UPDATE pedidos
      SET estado_pedido = 'entregado'
      WHERE id_pedido = ?
      `,
      [repartoRows[0].id_pedido]
    );

    if (repartoRows[0].id_vehiculo) {
      await connection.query(
        `
        UPDATE vehiculos
        SET estado_vehiculo = 'disponible'
        WHERE id_vehiculo = ?
        `,
        [repartoRows[0].id_vehiculo]
      );
    }

    await connection.commit();

    return id_reparto;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function marcarFallido(id_reparto, data) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [repartoRows] = await connection.query(
      `
      SELECT id_reparto, id_pedido, id_vehiculo, estado_reparto
      FROM repartos
      WHERE id_reparto = ?
      AND estado_visible = 1
      FOR UPDATE
      `,
      [id_reparto]
    );

    if (repartoRows.length === 0) {
      const error = new Error("Reparto no encontrado");
      error.status = 404;
      throw error;
    }

    if (!["asignado", "en_ruta"].includes(repartoRows[0].estado_reparto)) {
      const error = new Error("Solo se puede marcar fallido un reparto asignado o en ruta");
      error.status = 400;
      throw error;
    }

    await connection.query(
      `
      UPDATE repartos
      SET
        estado_reparto = 'fallido',
        observacion_entrega = ?
      WHERE id_reparto = ?
      `,
      [
        data.observacion_entrega || "Entrega fallida",
        id_reparto
      ]
    );

    await connection.query(
      `
      UPDATE pedidos
      SET estado_pedido = 'rechazado'
      WHERE id_pedido = ?
      `,
      [repartoRows[0].id_pedido]
    );

    if (repartoRows[0].id_vehiculo) {
      await connection.query(
        `
        UPDATE vehiculos
        SET estado_vehiculo = 'disponible'
        WHERE id_vehiculo = ?
        `,
        [repartoRows[0].id_vehiculo]
      );
    }

    await connection.commit();

    return id_reparto;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  findAllRepartos,
  findRepartoById,
  pedidoExists,
  repartoExistsByPedido,
  usuarioRepartidorExists,
  vehiculoDisponible,
  crearReparto,
  marcarSalida,
  entregarReparto,
  marcarFallido
};