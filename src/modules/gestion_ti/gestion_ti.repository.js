const pool = require("../../config/db");

const generarCodigo = async (prefijo, tabla, campoCodigo) => {
  const [rows] = await pool.query(
    `SELECT ${campoCodigo} AS codigo
     FROM ${tabla}
     ORDER BY 1 DESC
     LIMIT 1`
  );

  if (!rows.length) return `${prefijo}-2026-001`;

  const ultimo = rows[0].codigo;
  const numero = Number(String(ultimo).split("-").pop()) + 1;

  return `${prefijo}-2026-${String(numero).padStart(3, "0")}`;
};

const calcularFechaSla = (prioridad, tipo = "incidencia") => {
  const horas =
    prioridad === "critica" ? 2 :
    prioridad === "alta" ? 4 :
    prioridad === "media" ? 8 :
    tipo === "cambio" ? 24 : 12;

  const fecha = new Date();
  fecha.setHours(fecha.getHours() + horas);
  return fecha;
};

const crearIncidencia = async (data, usuarioAuth) => {
  const codigo = await generarCodigo(
    "INC",
    "gestion_incidencias",
    "codigo_incidencia"
  );

  const fechaLimite = calcularFechaSla(data.prioridad || "media", "incidencia");

  const [result] = await pool.query(
    `INSERT INTO gestion_incidencias (
      codigo_incidencia,
      titulo,
      descripcion,
      modulo_afectado,
      tipo_incidencia,
      prioridad,
      impacto,
      estado,
      id_usuario_reporta,
      id_usuario_asignado,
      fecha_limite_sla,
      observacion
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'registrada', ?, ?, ?, ?)`,
    [
      codigo,
      data.titulo,
      data.descripcion,
      data.modulo_afectado,
      data.tipo_incidencia || "error_sistema",
      data.prioridad || "media",
      data.impacto || "medio",
      usuarioAuth?.id_usuario || data.id_usuario_reporta || null,
      data.id_usuario_asignado || null,
      fechaLimite,
      data.observacion || null
    ]
  );

  return { id_incidencia_ti: result.insertId, codigo_incidencia: codigo };
};

const listarIncidencias = async (filtros = {}) => {
  const params = [];
  let where = "WHERE gi.estado_visible = 1";

  if (filtros.estado) {
    where += " AND gi.estado = ?";
    params.push(filtros.estado);
  }

  if (filtros.prioridad) {
    where += " AND gi.prioridad = ?";
    params.push(filtros.prioridad);
  }

  if (filtros.modulo) {
    where += " AND gi.modulo_afectado LIKE ?";
    params.push(`%${filtros.modulo}%`);
  }

  const [rows] = await pool.query(
    `SELECT 
      gi.*,
      ur.usuario AS usuario_reporta,
      ua.usuario AS usuario_asignado,
      uc.usuario AS usuario_cierre,
      CASE 
        WHEN gi.fecha_cierre IS NULL AND gi.fecha_limite_sla < NOW() THEN 1
        ELSE 0
      END AS sla_vencido
    FROM gestion_incidencias gi
    LEFT JOIN usuarios ur ON ur.id_usuario = gi.id_usuario_reporta
    LEFT JOIN usuarios ua ON ua.id_usuario = gi.id_usuario_asignado
    LEFT JOIN usuarios uc ON uc.id_usuario = gi.id_usuario_cierre
    ${where}
    ORDER BY gi.fecha_registro DESC`,
    params
  );

  return rows;
};

const obtenerIncidenciaPorId = async (id) => {
  const [rows] = await pool.query(
    `SELECT *
     FROM gestion_incidencias
     WHERE id_incidencia_ti = ?
       AND estado_visible = 1`,
    [id]
  );

  return rows[0] || null;
};

const actualizarEstadoIncidencia = async (id, data, usuarioAuth) => {
  const campos = ["estado = ?", "observacion = COALESCE(?, observacion)"];
  const params = [data.estado, data.observacion || null];

  if (data.estado === "en_atencion") {
    campos.push("fecha_inicio_atencion = COALESCE(fecha_inicio_atencion, NOW())");
  }

  if (data.estado === "resuelta") {
    campos.push("fecha_resolucion = NOW()");
    campos.push("solucion_aplicada = ?");
    params.push(data.solucion_aplicada || null);
  }

  if (data.estado === "cerrada") {
    campos.push("fecha_cierre = NOW()");
    campos.push("id_usuario_cierre = ?");
    params.push(usuarioAuth?.id_usuario || null);
  }

  params.push(id);

  const [result] = await pool.query(
    `UPDATE gestion_incidencias
     SET ${campos.join(", ")}
     WHERE id_incidencia_ti = ?
       AND estado_visible = 1`,
    params
  );

  return result.affectedRows > 0;
};

const crearCambio = async (data, usuarioAuth) => {
  const codigo = await generarCodigo(
    "CC",
    "gestion_cambios",
    "codigo_cambio"
  );

  const fechaLimite = calcularFechaSla(data.prioridad || "media", "cambio");

  const [result] = await pool.query(
    `INSERT INTO gestion_cambios (
      codigo_cambio,
      titulo,
      descripcion,
      justificacion,
      tipo_cambio,
      modulo_afectado,
      impacto,
      riesgo,
      prioridad,
      requiere_backup,
      requiere_aprobacion,
      estado,
      id_usuario_solicita,
      id_usuario_responsable,
      fecha_limite_sla,
      observacion
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'solicitado', ?, ?, ?, ?)`,
    [
      codigo,
      data.titulo,
      data.descripcion,
      data.justificacion,
      data.tipo_cambio,
      data.modulo_afectado || null,
      data.impacto || "medio",
      data.riesgo || "medio",
      data.prioridad || "media",
      data.requiere_backup ? 1 : 0,
      data.requiere_aprobacion === false ? 0 : 1,
      usuarioAuth?.id_usuario || data.id_usuario_solicita || null,
      data.id_usuario_responsable || null,
      fechaLimite,
      data.observacion || null
    ]
  );

  return { id_cambio: result.insertId, codigo_cambio: codigo };
};

const listarCambios = async (filtros = {}) => {
  const params = [];
  let where = "WHERE gc.estado_visible = 1";

  if (filtros.estado) {
    where += " AND gc.estado = ?";
    params.push(filtros.estado);
  }

  if (filtros.tipo_cambio) {
    where += " AND gc.tipo_cambio = ?";
    params.push(filtros.tipo_cambio);
  }

  if (filtros.impacto) {
    where += " AND gc.impacto = ?";
    params.push(filtros.impacto);
  }

  const [rows] = await pool.query(
    `SELECT 
      gc.*,
      us.usuario AS usuario_solicita,
      ur.usuario AS usuario_responsable,
      ua.usuario AS usuario_aprobador,
      CASE 
        WHEN gc.fecha_cierre IS NULL AND gc.fecha_limite_sla < NOW() THEN 1
        ELSE 0
      END AS sla_vencido
    FROM gestion_cambios gc
    LEFT JOIN usuarios us ON us.id_usuario = gc.id_usuario_solicita
    LEFT JOIN usuarios ur ON ur.id_usuario = gc.id_usuario_responsable
    LEFT JOIN usuarios ua ON ua.id_usuario = gc.id_usuario_aprobador
    ${where}
    ORDER BY gc.fecha_registro DESC`,
    params
  );

  return rows;
};

const obtenerCambioPorId = async (id) => {
  const [rows] = await pool.query(
    `SELECT *
     FROM gestion_cambios
     WHERE id_cambio = ?
       AND estado_visible = 1`,
    [id]
  );

  return rows[0] || null;
};

const actualizarEstadoCambio = async (id, data, usuarioAuth) => {
  const campos = ["estado = ?", "observacion = COALESCE(?, observacion)"];
  const params = [data.estado, data.observacion || null];

  if (data.estado === "aprobado") {
    campos.push("fecha_aprobacion = NOW()");
    campos.push("id_usuario_aprobador = ?");
    params.push(usuarioAuth?.id_usuario || null);
  }

  if (data.estado === "implementacion") {
    campos.push("fecha_inicio_implementacion = NOW()");
  }

  if (data.estado === "pruebas") {
    campos.push("fecha_pruebas = NOW()");
    campos.push("resultado_pruebas = ?");
    params.push(data.resultado_pruebas || null);
  }

  if (data.estado === "cerrado") {
    campos.push("fecha_cierre = NOW()");
    campos.push("resultado_pruebas = COALESCE(?, resultado_pruebas)");
    campos.push("commit_github = COALESCE(?, commit_github)");
    campos.push("evidencia_url = COALESCE(?, evidencia_url)");
    params.push(
      data.resultado_pruebas || null,
      data.commit_github || null,
      data.evidencia_url || null
    );
  }

  params.push(id);

  const [result] = await pool.query(
    `UPDATE gestion_cambios
     SET ${campos.join(", ")}
     WHERE id_cambio = ?
       AND estado_visible = 1`,
    params
  );

  return result.affectedRows > 0;
};

const obtenerMetricas = async () => {
  const [[incidencias]] = await pool.query(
    `SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN estado IN ('registrada','en_revision','en_atencion') THEN 1 ELSE 0 END) AS abiertas,
      SUM(CASE WHEN estado IN ('resuelta','cerrada') THEN 1 ELSE 0 END) AS resueltas,
      SUM(CASE WHEN fecha_cierre IS NULL AND fecha_limite_sla < NOW() THEN 1 ELSE 0 END) AS vencidas,
      ROUND(
        SUM(CASE WHEN fecha_cierre IS NOT NULL AND fecha_cierre <= fecha_limite_sla THEN 1 ELSE 0 END)
        / NULLIF(SUM(CASE WHEN fecha_cierre IS NOT NULL THEN 1 ELSE 0 END), 0) * 100, 2
      ) AS cumplimiento_sla
    FROM gestion_incidencias
    WHERE estado_visible = 1`
  );

  const [[cambios]] = await pool.query(
    `SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN estado IN ('solicitado','evaluacion') THEN 1 ELSE 0 END) AS pendientes,
      SUM(CASE WHEN estado = 'aprobado' THEN 1 ELSE 0 END) AS aprobados,
      SUM(CASE WHEN estado = 'rechazado' THEN 1 ELSE 0 END) AS rechazados,
      SUM(CASE WHEN estado = 'cerrado' THEN 1 ELSE 0 END) AS cerrados,
      SUM(CASE WHEN fecha_cierre IS NULL AND fecha_limite_sla < NOW() THEN 1 ELSE 0 END) AS vencidos,
      ROUND(
        SUM(CASE WHEN fecha_cierre IS NOT NULL AND fecha_cierre <= fecha_limite_sla THEN 1 ELSE 0 END)
        / NULLIF(SUM(CASE WHEN fecha_cierre IS NOT NULL THEN 1 ELSE 0 END), 0) * 100, 2
      ) AS cumplimiento_sla
    FROM gestion_cambios
    WHERE estado_visible = 1`
  );

  return { incidencias, cambios };
};

module.exports = {
  crearIncidencia,
  listarIncidencias,
  obtenerIncidenciaPorId,
  actualizarEstadoIncidencia,
  crearCambio,
  listarCambios,
  obtenerCambioPorId,
  actualizarEstadoCambio,
  obtenerMetricas
};