const pool = require("../../config/db");

async function findAllVehiculos() {
  const sql = `
    SELECT
      id_vehiculo,
      tipo_vehiculo,
      placa,
      marca,
      modelo,
      estado_vehiculo
    FROM vehiculos
    WHERE estado_visible = 1
    ORDER BY id_vehiculo DESC
  `;

  const [rows] = await pool.query(sql);
  return rows;
}

async function findVehiculoById(id_vehiculo) {
  const sql = `
    SELECT
      id_vehiculo,
      tipo_vehiculo,
      placa,
      marca,
      modelo,
      estado_vehiculo
    FROM vehiculos
    WHERE id_vehiculo = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_vehiculo]);
  return rows[0];
}

async function findVehiculoByPlaca(placa) {
  const sql = `
    SELECT id_vehiculo, placa
    FROM vehiculos
    WHERE placa = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [placa]);
  return rows[0];
}

async function createVehiculo(data) {
  const sql = `
    INSERT INTO vehiculos
    (
      tipo_vehiculo,
      placa,
      marca,
      modelo,
      estado_vehiculo,
      estado_visible
    )
    VALUES (?, ?, ?, ?, ?, 1)
  `;

  const [result] = await pool.query(sql, [
    data.tipo_vehiculo,
    data.placa,
    data.marca,
    data.modelo,
    data.estado_vehiculo || "disponible"
  ]);

  return result.insertId;
}

async function updateVehiculo(id_vehiculo, data) {
  const sql = `
    UPDATE vehiculos
    SET
      tipo_vehiculo = ?,
      placa = ?,
      marca = ?,
      modelo = ?,
      estado_vehiculo = ?
    WHERE id_vehiculo = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [
    data.tipo_vehiculo,
    data.placa,
    data.marca,
    data.modelo,
    data.estado_vehiculo,
    id_vehiculo
  ]);

  return result.affectedRows;
}

async function deleteVehiculoLogical(id_vehiculo) {
  const sql = `
    UPDATE vehiculos
    SET estado_visible = 0
    WHERE id_vehiculo = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [id_vehiculo]);
  return result.affectedRows;
}

module.exports = {
  findAllVehiculos,
  findVehiculoById,
  findVehiculoByPlaca,
  createVehiculo,
  updateVehiculo,
  deleteVehiculoLogical
};