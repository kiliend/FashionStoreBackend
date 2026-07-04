const pool = require("../../config/db");

const generarCodigo = async (prefijo, tabla, campoCodigo, connection = pool) => {
  const [rows] = await connection.query(
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

const obtenerIdUsuarioAuth = (usuarioAuth) => {
  return usuarioAuth?.id_usuario || usuarioAuth?.id || null;
};

const registrarHistorialCambio = async (data, connection = pool) => {
  await connection.query(
    `INSERT INTO gestion_cambios_historial (
      id_cambio,
      accion,
      estado_anterior,
      estado_nuevo,
      campo_modificado,
      valor_anterior,
      valor_nuevo,
      comentario,
      id_usuario
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.id_cambio,
      data.accion,
      data.estado_anterior || null,
      data.estado_nuevo || null,
      data.campo_modificado || null,
      data.valor_anterior ?? null,
      data.valor_nuevo ?? null,
      data.comentario || null,
      data.id_usuario || null
    ]
  );
};

const registrarHistorialIncidencia = async (data, connection = pool) => {
  await connection.query(
    `INSERT INTO gestion_incidencias_historial (
      id_incidencia_ti,
      accion,
      estado_anterior,
      estado_nuevo,
      campo_modificado,
      valor_anterior,
      valor_nuevo,
      comentario,
      id_usuario
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.id_incidencia_ti,
      data.accion,
      data.estado_anterior || null,
      data.estado_nuevo || null,
      data.campo_modificado || null,
      data.valor_anterior ?? null,
      data.valor_nuevo ?? null,
      data.comentario || null,
      data.id_usuario || null
    ]
  );
};

const crearChecklistBaseCambio = async (idCambio, idUsuario, connection) => {
  const items = [
    "Registrar solicitud de cambio",
    "Clasificar tipo de cambio",
    "Evaluar impacto y riesgo",
    "Validar aprobación",
    "Realizar backup si afecta base de datos",
    "Implementar cambio",
    "Realizar pruebas",
    "Registrar evidencia",
    "Actualizar documentación",
    "Cerrar cambio"
  ];

  for (const item of items) {
    await connection.query(
      `INSERT INTO gestion_cambios_checklist (
        id_cambio,
        descripcion,
        completado,
        id_usuario_creacion,
        fecha_completado,
        id_usuario_completado
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        idCambio,
        item,
        item === "Registrar solicitud de cambio" ? 1 : 0,
        idUsuario,
        item === "Registrar solicitud de cambio" ? new Date() : null,
        item === "Registrar solicitud de cambio" ? idUsuario : null
      ]
    );
  }
};


const crearChecklistBaseIncidencia = async (idIncidencia, idUsuario, connection) => {
  const items = [
    "Registrar incidencia",
    "Clasificar tipo de incidencia",
    "Evaluar impacto y prioridad",
    "Asignar responsable técnico",
    "Atender incidencia",
    "Validar solución aplicada",
    "Registrar evidencia o comentario",
    "Cerrar incidencia"
  ];

  for (const item of items) {
    await connection.query(
      `INSERT INTO gestion_incidencias_checklist (
        id_incidencia_ti,
        descripcion,
        completado,
        id_usuario_creacion,
        fecha_completado,
        id_usuario_completado
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        idIncidencia,
        item,
        item === "Registrar incidencia" ? 1 : 0,
        idUsuario,
        item === "Registrar incidencia" ? new Date() : null,
        item === "Registrar incidencia" ? idUsuario : null
      ]
    );
  }
};

const crearIncidencia = async (data, usuarioAuth) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const codigo = await generarCodigo(
      "INC",
      "gestion_incidencias",
      "codigo_incidencia",
      connection
    );

    const fechaLimite = calcularFechaSla(data.prioridad || "media", "incidencia");
    const idUsuario = obtenerIdUsuarioAuth(usuarioAuth) || data.id_usuario_reporta || null;

    const [result] = await connection.query(
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
        idUsuario,
        data.id_usuario_asignado || null,
        fechaLimite,
        data.observacion || null
      ]
    );

    await registrarHistorialIncidencia(
      {
        id_incidencia_ti: result.insertId,
        accion: "creacion",
        estado_nuevo: "registrada",
        comentario: "Incidencia registrada en el sistema.",
        id_usuario: idUsuario
      },
      connection
    );

    await crearChecklistBaseIncidencia(result.insertId, idUsuario, connection);

    await connection.commit();

    return { id_incidencia_ti: result.insertId, codigo_incidencia: codigo };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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


const listarIncidenciasTablero = async () => {
  const [rows] = await pool.query(
    `SELECT 
      gi.*,
      ur.usuario AS usuario_reporta,
      ua.usuario AS usuario_asignado,
      uc.usuario AS usuario_cierre,
      CASE 
        WHEN gi.fecha_limite_sla IS NULL THEN 'sin_sla'
        WHEN gi.fecha_cierre IS NOT NULL AND gi.fecha_cierre <= gi.fecha_limite_sla THEN 'cumplido'
        WHEN gi.fecha_resolucion IS NOT NULL AND gi.fecha_resolucion <= gi.fecha_limite_sla THEN 'cumplido'
        WHEN gi.fecha_cierre IS NULL AND gi.fecha_resolucion IS NULL AND gi.fecha_limite_sla < NOW() THEN 'vencido'
        WHEN COALESCE(gi.fecha_cierre, gi.fecha_resolucion) > gi.fecha_limite_sla THEN 'vencido'
        ELSE 'en_plazo'
      END AS sla_estado,
      CASE 
        WHEN gi.fecha_cierre IS NULL AND gi.fecha_resolucion IS NULL AND gi.fecha_limite_sla < NOW() THEN 1
        ELSE 0
      END AS sla_vencido
    FROM gestion_incidencias gi
    LEFT JOIN usuarios ur ON ur.id_usuario = gi.id_usuario_reporta
    LEFT JOIN usuarios ua ON ua.id_usuario = gi.id_usuario_asignado
    LEFT JOIN usuarios uc ON uc.id_usuario = gi.id_usuario_cierre
    WHERE gi.estado_visible = 1
      AND (
        gi.estado IN ('registrada', 'en_revision', 'en_atencion')
        OR (
          gi.estado IN ('resuelta', 'cerrada', 'rechazada')
          AND COALESCE(gi.fecha_cierre, gi.fecha_resolucion, gi.fecha_registro) >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        )
      )
    ORDER BY 
      FIELD(gi.estado, 'registrada', 'en_revision', 'en_atencion', 'resuelta', 'cerrada', 'rechazada'),
      gi.fecha_registro DESC`
  );

  return rows;
};

const obtenerIncidenciaDetalle = async (id) => {
  const [[incidencia]] = await pool.query(
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
    WHERE gi.id_incidencia_ti = ?
      AND gi.estado_visible = 1`,
    [id]
  );

  if (!incidencia) return null;

  const [historial] = await pool.query(
    `SELECT 
      h.*,
      u.usuario,
      TRIM(CONCAT(COALESCE(u.nombres, ''), ' ', COALESCE(u.apellidos, ''))) AS nombre_usuario,
      r.nombre_rol AS rol_usuario
    FROM gestion_incidencias_historial h
    LEFT JOIN usuarios u ON u.id_usuario = h.id_usuario
    LEFT JOIN roles r ON r.id_rol = u.id_rol
    WHERE h.id_incidencia_ti = ?
      AND h.estado_visible = 1
    ORDER BY h.fecha_registro DESC`,
    [id]
  );

  const [checklist] = await pool.query(
    `SELECT 
      ch.*,
      uc.usuario AS usuario_creacion,
      uco.usuario AS usuario_completado
    FROM gestion_incidencias_checklist ch
    LEFT JOIN usuarios uc ON uc.id_usuario = ch.id_usuario_creacion
    LEFT JOIN usuarios uco ON uco.id_usuario = ch.id_usuario_completado
    WHERE ch.id_incidencia_ti = ?
      AND ch.estado_visible = 1
    ORDER BY ch.id_checklist ASC`,
    [id]
  );

  return { incidencia, historial, checklist };
};

const actualizarEstadoIncidencia = async (id, data, usuarioAuth) => {
  return moverIncidencia(id, data, usuarioAuth);
};

const moverIncidencia = async (id, data, usuarioAuth) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[actual]] = await connection.query(
      `SELECT estado
       FROM gestion_incidencias
       WHERE id_incidencia_ti = ?
         AND estado_visible = 1`,
      [id]
    );

    if (!actual) {
      await connection.rollback();
      return false;
    }

    const campos = ["estado = ?", "observacion = COALESCE(?, observacion)"];
    const params = [data.estado, data.observacion || null];
    const idUsuario = obtenerIdUsuarioAuth(usuarioAuth);

    if (data.estado === "en_atencion") {
      campos.push("fecha_inicio_atencion = COALESCE(fecha_inicio_atencion, NOW())");
    }

    if (data.estado === "resuelta") {
      campos.push("fecha_resolucion = NOW()");
      campos.push("solucion_aplicada = COALESCE(?, solucion_aplicada)");
      params.push(data.solucion_aplicada || data.observacion || null);
    }

    if (data.estado === "cerrada" || data.estado === "rechazada") {
      campos.push("fecha_cierre = COALESCE(fecha_cierre, NOW())");
      campos.push("id_usuario_cierre = COALESCE(id_usuario_cierre, ?)");
      params.push(idUsuario);
    }

    if (data.evidencia_url) {
      campos.push("evidencia_url = COALESCE(?, evidencia_url)");
      params.push(data.evidencia_url);
    }

    params.push(id);

    const [result] = await connection.query(
      `UPDATE gestion_incidencias
       SET ${campos.join(", ")}
       WHERE id_incidencia_ti = ?
         AND estado_visible = 1`,
      params
    );

    await registrarHistorialIncidencia(
      {
        id_incidencia_ti: id,
        accion:
          data.estado === "resuelta"
            ? "resolucion"
            : data.estado === "cerrada"
              ? "cierre"
              : data.estado === "rechazada"
                ? "rechazo"
                : "cambio_estado",
        estado_anterior: actual.estado,
        estado_nuevo: data.estado,
        comentario: data.observacion || data.solucion_aplicada || "Movimiento de tarjeta en el tablero de incidencias.",
        id_usuario: idUsuario
      },
      connection
    );

    await connection.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const editarIncidencia = async (id, data, usuarioAuth) => {
  const camposPermitidos = [
    "titulo",
    "descripcion",
    "modulo_afectado",
    "tipo_incidencia",
    "prioridad",
    "impacto",
    "id_usuario_asignado",
    "solucion_aplicada",
    "evidencia_url",
    "observacion"
  ];

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[actual]] = await connection.query(
      `SELECT *
       FROM gestion_incidencias
       WHERE id_incidencia_ti = ?
         AND estado_visible = 1`,
      [id]
    );

    if (!actual) {
      await connection.rollback();
      return false;
    }

    const sets = [];
    const params = [];
    const idUsuario = obtenerIdUsuarioAuth(usuarioAuth);

    for (const campo of camposPermitidos) {
      if (Object.prototype.hasOwnProperty.call(data, campo)) {
        const valorNuevo = data[campo] === "" ? null : data[campo];
        const valorAnterior = actual[campo];

        if (String(valorAnterior ?? "") !== String(valorNuevo ?? "")) {
          sets.push(`${campo} = ?`);
          params.push(valorNuevo);

          await registrarHistorialIncidencia(
            {
              id_incidencia_ti: id,
              accion: "actualizacion",
              campo_modificado: campo,
              valor_anterior: valorAnterior,
              valor_nuevo: valorNuevo,
              comentario: `Campo ${campo} actualizado.`,
              id_usuario: idUsuario
            },
            connection
          );
        }
      }
    }

    if (!sets.length) {
      await connection.commit();
      return true;
    }

    params.push(id);

    const [result] = await connection.query(
      `UPDATE gestion_incidencias
       SET ${sets.join(", ")}
       WHERE id_incidencia_ti = ?
         AND estado_visible = 1`,
      params
    );

    await connection.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const agregarComentarioIncidencia = async (id, data, usuarioAuth) => {
  await registrarHistorialIncidencia({
    id_incidencia_ti: id,
    accion: data.tipo === "evidencia" ? "evidencia" : "comentario",
    comentario: data.comentario,
    valor_nuevo: data.url_evidencia || null,
    id_usuario: obtenerIdUsuarioAuth(usuarioAuth)
  });

  return true;
};

const crearChecklistIncidencia = async (id, data, usuarioAuth) => {
  const [result] = await pool.query(
    `INSERT INTO gestion_incidencias_checklist (
      id_incidencia_ti,
      descripcion,
      completado,
      id_usuario_creacion
    ) VALUES (?, ?, 0, ?)`,
    [id, data.descripcion, obtenerIdUsuarioAuth(usuarioAuth)]
  );

  await registrarHistorialIncidencia({
    id_incidencia_ti: id,
    accion: "actualizacion",
    campo_modificado: "checklist",
    valor_nuevo: data.descripcion,
    comentario: "Se agregó un nuevo ítem al checklist.",
    id_usuario: obtenerIdUsuarioAuth(usuarioAuth)
  });

  return { id_checklist: result.insertId };
};

const actualizarChecklistIncidencia = async (idChecklist, data, usuarioAuth) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[actual]] = await connection.query(
      `SELECT id_incidencia_ti, completado, descripcion
       FROM gestion_incidencias_checklist
       WHERE id_checklist = ?
         AND estado_visible = 1`,
      [idChecklist]
    );

    if (!actual) {
      await connection.rollback();
      return false;
    }

    const completado = data.completado ? 1 : 0;
    const idUsuario = obtenerIdUsuarioAuth(usuarioAuth);

    const [result] = await connection.query(
      `UPDATE gestion_incidencias_checklist
       SET completado = ?,
           id_usuario_completado = ?,
           fecha_completado = CASE WHEN ? = 1 THEN NOW() ELSE NULL END
       WHERE id_checklist = ?
         AND estado_visible = 1`,
      [completado, completado ? idUsuario : null, completado, idChecklist]
    );

    await registrarHistorialIncidencia(
      {
        id_incidencia_ti: actual.id_incidencia_ti,
        accion: "actualizacion",
        campo_modificado: "checklist",
        valor_anterior: actual.completado ? "completado" : "pendiente",
        valor_nuevo: completado ? "completado" : "pendiente",
        comentario: `Checklist: ${actual.descripcion}`,
        id_usuario: idUsuario
      },
      connection
    );

    await connection.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const crearCambio = async (data, usuarioAuth) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const codigo = await generarCodigo(
      "CC",
      "gestion_cambios",
      "codigo_cambio",
      connection
    );

    const fechaLimite = calcularFechaSla(data.prioridad || "media", "cambio");
    const idUsuario = obtenerIdUsuarioAuth(usuarioAuth) || data.id_usuario_solicita || null;

    const [result] = await connection.query(
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
        idUsuario,
        data.id_usuario_responsable || null,
        fechaLimite,
        data.observacion || null
      ]
    );

    await registrarHistorialCambio(
      {
        id_cambio: result.insertId,
        accion: "creacion",
        estado_nuevo: "solicitado",
        comentario: "Cambio registrado en el sistema.",
        id_usuario: idUsuario
      },
      connection
    );

    await crearChecklistBaseCambio(result.insertId, idUsuario, connection);

    await connection.commit();

    return { id_cambio: result.insertId, codigo_cambio: codigo };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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

const listarCambiosTablero = async () => {
  const [rows] = await pool.query(
    `SELECT 
      gc.*,
      us.usuario AS usuario_solicita,
      ur.usuario AS usuario_responsable,
      ua.usuario AS usuario_aprobador,
      CASE 
        WHEN gc.fecha_limite_sla IS NULL THEN 'sin_sla'
        WHEN gc.fecha_cierre IS NOT NULL AND gc.fecha_cierre <= gc.fecha_limite_sla THEN 'cumplido'
        WHEN gc.fecha_cierre IS NULL AND gc.fecha_limite_sla < NOW() THEN 'vencido'
        WHEN gc.fecha_cierre IS NOT NULL AND gc.fecha_cierre > gc.fecha_limite_sla THEN 'vencido'
        ELSE 'en_plazo'
      END AS sla_estado,
      CASE 
        WHEN gc.fecha_cierre IS NULL AND gc.fecha_limite_sla < NOW() THEN 1
        ELSE 0
      END AS sla_vencido
    FROM gestion_cambios gc
    LEFT JOIN usuarios us ON us.id_usuario = gc.id_usuario_solicita
    LEFT JOIN usuarios ur ON ur.id_usuario = gc.id_usuario_responsable
    LEFT JOIN usuarios ua ON ua.id_usuario = gc.id_usuario_aprobador
    WHERE gc.estado_visible = 1
      AND (
        gc.estado IN ('solicitado', 'evaluacion', 'aprobado', 'implementacion', 'pruebas', 'documentado')
        OR (
          gc.estado IN ('cerrado', 'rechazado', 'postergado')
          AND COALESCE(gc.fecha_cierre, gc.fecha_registro) >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        )
      )
    ORDER BY 
      FIELD(gc.estado, 'solicitado', 'evaluacion', 'aprobado', 'implementacion', 'pruebas', 'documentado', 'cerrado', 'rechazado', 'postergado'),
      gc.fecha_registro DESC`
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

const obtenerCambioDetalle = async (id) => {
  const [[cambio]] = await pool.query(
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
    WHERE gc.id_cambio = ?
      AND gc.estado_visible = 1`,
    [id]
  );

  if (!cambio) return null;

  const [historial] = await pool.query(
    `SELECT 
      h.*,
      u.usuario,
      TRIM(CONCAT(COALESCE(u.nombres, ''), ' ', COALESCE(u.apellidos, ''))) AS nombre_usuario,
      r.nombre_rol AS rol_usuario
    FROM gestion_cambios_historial h
    LEFT JOIN usuarios u ON u.id_usuario = h.id_usuario
    LEFT JOIN roles r ON r.id_rol = u.id_rol
    WHERE h.id_cambio = ?
      AND h.estado_visible = 1
    ORDER BY h.fecha_registro DESC`,
    [id]
  );

  const [checklist] = await pool.query(
    `SELECT 
      ch.*,
      uc.usuario AS usuario_creacion,
      uco.usuario AS usuario_completado
    FROM gestion_cambios_checklist ch
    LEFT JOIN usuarios uc ON uc.id_usuario = ch.id_usuario_creacion
    LEFT JOIN usuarios uco ON uco.id_usuario = ch.id_usuario_completado
    WHERE ch.id_cambio = ?
      AND ch.estado_visible = 1
    ORDER BY ch.id_checklist ASC`,
    [id]
  );

  return { cambio, historial, checklist };
};

const actualizarEstadoCambio = async (id, data, usuarioAuth) => {
  return moverCambio(id, data, usuarioAuth);
};

const moverCambio = async (id, data, usuarioAuth) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[actual]] = await connection.query(
      `SELECT estado
       FROM gestion_cambios
       WHERE id_cambio = ?
         AND estado_visible = 1`,
      [id]
    );

    if (!actual) {
      await connection.rollback();
      return false;
    }

    const campos = ["estado = ?", "observacion = COALESCE(?, observacion)"];
    const params = [data.estado, data.observacion || null];
    const idUsuario = obtenerIdUsuarioAuth(usuarioAuth);

    if (data.estado === "aprobado") {
      campos.push("fecha_aprobacion = NOW()");
      campos.push("id_usuario_aprobador = ?");
      params.push(idUsuario);
    }

    if (data.estado === "implementacion") {
      campos.push("fecha_inicio_implementacion = NOW()");
    }

    if (data.estado === "pruebas") {
      campos.push("fecha_pruebas = NOW()");
      campos.push("resultado_pruebas = COALESCE(?, resultado_pruebas)");
      params.push(data.resultado_pruebas || null);
    }

    if (["cerrado", "rechazado", "postergado"].includes(data.estado)) {
      campos.push("fecha_cierre = COALESCE(fecha_cierre, NOW())");
    }

    if (data.estado === "cerrado") {
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

    const [result] = await connection.query(
      `UPDATE gestion_cambios
       SET ${campos.join(", ")}
       WHERE id_cambio = ?
         AND estado_visible = 1`,
      params
    );

    await registrarHistorialCambio(
      {
        id_cambio: id,
        accion: data.estado === "aprobado" ? "aprobacion" : data.estado === "rechazado" ? "rechazo" : data.estado === "cerrado" ? "cierre" : "cambio_estado",
        estado_anterior: actual.estado,
        estado_nuevo: data.estado,
        comentario: data.observacion || "Movimiento de tarjeta en el tablero Kanban.",
        id_usuario: idUsuario
      },
      connection
    );

    await connection.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const editarCambio = async (id, data, usuarioAuth) => {
  const camposPermitidos = [
    "titulo",
    "descripcion",
    "justificacion",
    "tipo_cambio",
    "modulo_afectado",
    "impacto",
    "riesgo",
    "prioridad",
    "requiere_backup",
    "requiere_aprobacion",
    "id_usuario_responsable",
    "resultado_pruebas",
    "evidencia_url",
    "commit_github",
    "observacion"
  ];

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[actual]] = await connection.query(
      `SELECT *
       FROM gestion_cambios
       WHERE id_cambio = ?
         AND estado_visible = 1`,
      [id]
    );

    if (!actual) {
      await connection.rollback();
      return false;
    }

    const sets = [];
    const params = [];
    const idUsuario = obtenerIdUsuarioAuth(usuarioAuth);

    for (const campo of camposPermitidos) {
      if (Object.prototype.hasOwnProperty.call(data, campo)) {
        const valorNuevo = data[campo] === "" ? null : data[campo];
        const valorAnterior = actual[campo];

        if (String(valorAnterior ?? "") !== String(valorNuevo ?? "")) {
          sets.push(`${campo} = ?`);
          params.push(valorNuevo);

          await registrarHistorialCambio(
            {
              id_cambio: id,
              accion: "actualizacion",
              campo_modificado: campo,
              valor_anterior: valorAnterior,
              valor_nuevo: valorNuevo,
              comentario: `Campo ${campo} actualizado.`,
              id_usuario: idUsuario
            },
            connection
          );
        }
      }
    }

    if (!sets.length) {
      await connection.commit();
      return true;
    }

    params.push(id);

    const [result] = await connection.query(
      `UPDATE gestion_cambios
       SET ${sets.join(", ")}
       WHERE id_cambio = ?
         AND estado_visible = 1`,
      params
    );

    await connection.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const agregarComentarioCambio = async (id, data, usuarioAuth) => {
  await registrarHistorialCambio({
    id_cambio: id,
    accion: data.tipo === "evidencia" ? "evidencia" : "comentario",
    comentario: data.comentario,
    valor_nuevo: data.url_evidencia || null,
    id_usuario: obtenerIdUsuarioAuth(usuarioAuth)
  });

  return true;
};

const crearChecklistCambio = async (id, data, usuarioAuth) => {
  const [result] = await pool.query(
    `INSERT INTO gestion_cambios_checklist (
      id_cambio,
      descripcion,
      completado,
      id_usuario_creacion
    ) VALUES (?, ?, 0, ?)`,
    [id, data.descripcion, obtenerIdUsuarioAuth(usuarioAuth)]
  );

  await registrarHistorialCambio({
    id_cambio: id,
    accion: "actualizacion",
    campo_modificado: "checklist",
    valor_nuevo: data.descripcion,
    comentario: "Se agregó un nuevo ítem al checklist.",
    id_usuario: obtenerIdUsuarioAuth(usuarioAuth)
  });

  return { id_checklist: result.insertId };
};

const actualizarChecklistCambio = async (idChecklist, data, usuarioAuth) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[actual]] = await connection.query(
      `SELECT id_cambio, completado, descripcion
       FROM gestion_cambios_checklist
       WHERE id_checklist = ?
         AND estado_visible = 1`,
      [idChecklist]
    );

    if (!actual) {
      await connection.rollback();
      return false;
    }

    const completado = data.completado ? 1 : 0;
    const idUsuario = obtenerIdUsuarioAuth(usuarioAuth);

    const [result] = await connection.query(
      `UPDATE gestion_cambios_checklist
       SET completado = ?,
           id_usuario_completado = ?,
           fecha_completado = CASE WHEN ? = 1 THEN NOW() ELSE NULL END
       WHERE id_checklist = ?
         AND estado_visible = 1`,
      [completado, completado ? idUsuario : null, completado, idChecklist]
    );

    await registrarHistorialCambio(
      {
        id_cambio: actual.id_cambio,
        accion: "actualizacion",
        campo_modificado: "checklist",
        valor_anterior: actual.completado ? "completado" : "pendiente",
        valor_nuevo: completado ? "completado" : "pendiente",
        comentario: `Checklist: ${actual.descripcion}`,
        id_usuario: idUsuario
      },
      connection
    );

    await connection.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};


const obtenerBaseHistoricoSql = () => {
  return `
    SELECT
      'cambio' AS tipo_registro,
      gc.id_cambio AS id_ticket,
      gc.codigo_cambio AS codigo,
      gc.titulo,
      gc.descripcion,
      gc.modulo_afectado,
      gc.tipo_cambio AS tipo,
      gc.prioridad,
      gc.estado,
      gc.id_usuario_solicita AS id_usuario_creador,
      us.usuario AS usuario_creador,
      gc.id_usuario_responsable,
      ur.usuario AS usuario_responsable,
      gc.fecha_registro,
      gc.fecha_limite_sla,
      gc.fecha_cierre,
      gc.observacion,
      CASE 
        WHEN gc.fecha_limite_sla IS NULL THEN 'sin_sla'
        WHEN gc.fecha_cierre IS NOT NULL AND gc.fecha_cierre <= gc.fecha_limite_sla THEN 'cumplido'
        WHEN gc.fecha_cierre IS NULL AND gc.fecha_limite_sla < NOW() THEN 'vencido'
        WHEN gc.fecha_cierre IS NOT NULL AND gc.fecha_cierre > gc.fecha_limite_sla THEN 'vencido'
        ELSE 'en_plazo'
      END AS sla_estado,
      (
        SELECT COUNT(*)
        FROM gestion_cambios_historial h
        WHERE h.id_cambio = gc.id_cambio
          AND h.estado_visible = 1
      ) AS total_movimientos,
      (
        SELECT MAX(h.fecha_registro)
        FROM gestion_cambios_historial h
        WHERE h.id_cambio = gc.id_cambio
          AND h.estado_visible = 1
      ) AS fecha_ultimo_movimiento
    FROM gestion_cambios gc
    LEFT JOIN usuarios us ON us.id_usuario = gc.id_usuario_solicita
    LEFT JOIN usuarios ur ON ur.id_usuario = gc.id_usuario_responsable
    WHERE gc.estado_visible = 1

    UNION ALL

    SELECT
      'incidencia' AS tipo_registro,
      gi.id_incidencia_ti AS id_ticket,
      gi.codigo_incidencia AS codigo,
      gi.titulo,
      gi.descripcion,
      gi.modulo_afectado,
      gi.tipo_incidencia AS tipo,
      gi.prioridad,
      gi.estado,
      gi.id_usuario_reporta AS id_usuario_creador,
      urp.usuario AS usuario_creador,
      gi.id_usuario_asignado AS id_usuario_responsable,
      uas.usuario AS usuario_responsable,
      gi.fecha_registro,
      gi.fecha_limite_sla,
      COALESCE(gi.fecha_cierre, gi.fecha_resolucion) AS fecha_cierre,
      gi.observacion,
      CASE 
        WHEN gi.fecha_limite_sla IS NULL THEN 'sin_sla'
        WHEN gi.fecha_cierre IS NOT NULL AND gi.fecha_cierre <= gi.fecha_limite_sla THEN 'cumplido'
        WHEN gi.fecha_resolucion IS NOT NULL AND gi.fecha_resolucion <= gi.fecha_limite_sla THEN 'cumplido'
        WHEN gi.fecha_cierre IS NULL AND gi.fecha_resolucion IS NULL AND gi.fecha_limite_sla < NOW() THEN 'vencido'
        WHEN COALESCE(gi.fecha_cierre, gi.fecha_resolucion) > gi.fecha_limite_sla THEN 'vencido'
        ELSE 'en_plazo'
      END AS sla_estado,
      (
        SELECT COUNT(*)
        FROM gestion_incidencias_historial h
        WHERE h.id_incidencia_ti = gi.id_incidencia_ti
          AND h.estado_visible = 1
      ) AS total_movimientos,
      (
        SELECT MAX(h.fecha_registro)
        FROM gestion_incidencias_historial h
        WHERE h.id_incidencia_ti = gi.id_incidencia_ti
          AND h.estado_visible = 1
      ) AS fecha_ultimo_movimiento
    FROM gestion_incidencias gi
    LEFT JOIN usuarios urp ON urp.id_usuario = gi.id_usuario_reporta
    LEFT JOIN usuarios uas ON uas.id_usuario = gi.id_usuario_asignado
    WHERE gi.estado_visible = 1
  `;
};

const construirFiltrosHistorico = (filtros = {}) => {
  const where = ["1 = 1"];
  const params = [];

  if (filtros.tipo_registro && filtros.tipo_registro !== "todos") {
    where.push("hist.tipo_registro = ?");
    params.push(filtros.tipo_registro);
  }

  if (filtros.estado) {
    where.push("hist.estado = ?");
    params.push(filtros.estado);
  }

  if (filtros.prioridad) {
    where.push("hist.prioridad = ?");
    params.push(filtros.prioridad);
  }

  if (filtros.modulo) {
    where.push("hist.modulo_afectado LIKE ?");
    params.push(`%${filtros.modulo}%`);
  }

  if (filtros.id_usuario_responsable) {
    where.push("hist.id_usuario_responsable = ?");
    params.push(filtros.id_usuario_responsable);
  }

  if (filtros.id_usuario_creador) {
    where.push("hist.id_usuario_creador = ?");
    params.push(filtros.id_usuario_creador);
  }

  if (filtros.sla_estado) {
    where.push("hist.sla_estado = ?");
    params.push(filtros.sla_estado);
  }

  if (filtros.tipo) {
    where.push("hist.tipo = ?");
    params.push(filtros.tipo);
  }

  if (filtros.busqueda) {
    where.push("(hist.codigo LIKE ? OR hist.titulo LIKE ? OR hist.descripcion LIKE ?)");
    const busqueda = `%${filtros.busqueda}%`;
    params.push(busqueda, busqueda, busqueda);
  }

  if (filtros.desde) {
    where.push("hist.fecha_registro >= ?");
    params.push(filtros.desde);
  }

  if (filtros.hasta) {
    where.push("hist.fecha_registro < DATE_ADD(?, INTERVAL 1 DAY)");
    params.push(filtros.hasta);
  }

  return {
    whereSql: `WHERE ${where.join(" AND ")}`,
    params
  };
};

const listarHistoricoGestionTi = async (filtros = {}) => {
  const page = Math.max(Number(filtros.page || 1), 1);
  const limit = Math.min(Math.max(Number(filtros.limit || 20), 5), 100);
  const offset = (page - 1) * limit;

  const baseSql = obtenerBaseHistoricoSql();
  const { whereSql, params } = construirFiltrosHistorico(filtros);

  const [[countRow]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM (${baseSql}) hist
     ${whereSql}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT *
     FROM (${baseSql}) hist
     ${whereSql}
     ORDER BY COALESCE(hist.fecha_ultimo_movimiento, hist.fecha_registro) DESC,
              hist.fecha_registro DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const total = Number(countRow?.total || 0);

  return {
    items: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1)
    }
  };
};

const obtenerResumenHistoricoGestionTi = async (filtros = {}) => {
  const baseSql = obtenerBaseHistoricoSql();
  const { whereSql, params } = construirFiltrosHistorico(filtros);

  const [rows] = await pool.query(
    `SELECT
       hist.tipo_registro,
       COUNT(*) AS total,
       SUM(CASE WHEN hist.sla_estado = 'vencido' THEN 1 ELSE 0 END) AS vencidos,
       SUM(CASE WHEN hist.sla_estado = 'cumplido' THEN 1 ELSE 0 END) AS cumplidos,
       SUM(CASE WHEN hist.estado IN ('cerrado', 'cerrada', 'rechazado', 'rechazada', 'postergado', 'resuelta') THEN 1 ELSE 0 END) AS finalizados,
       SUM(CASE WHEN hist.estado NOT IN ('cerrado', 'cerrada', 'rechazado', 'rechazada', 'postergado', 'resuelta') THEN 1 ELSE 0 END) AS activos
     FROM (${baseSql}) hist
     ${whereSql}
     GROUP BY hist.tipo_registro`,
    params
  );

  const resumen = {
    total: 0,
    cambios: 0,
    incidencias: 0,
    vencidos: 0,
    cumplidos: 0,
    finalizados: 0,
    activos: 0
  };

  for (const row of rows) {
    const total = Number(row.total || 0);
    resumen.total += total;
    resumen.vencidos += Number(row.vencidos || 0);
    resumen.cumplidos += Number(row.cumplidos || 0);
    resumen.finalizados += Number(row.finalizados || 0);
    resumen.activos += Number(row.activos || 0);

    if (row.tipo_registro === "cambio") resumen.cambios = total;
    if (row.tipo_registro === "incidencia") resumen.incidencias = total;
  }

  return resumen;
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

const listarUsuariosAsignables = async () => {
  const [rows] = await pool.query(
    `SELECT 
      u.id_usuario,
      u.usuario,
      u.nombres,
      u.apellidos,
      r.nombre_rol AS rol
    FROM usuarios u
    INNER JOIN roles r ON r.id_rol = u.id_rol
    WHERE u.estado_visible = 1
      AND r.estado_visible = 1
      AND r.nombre_rol IN ('admin', 'desarrollador')
    ORDER BY r.nombre_rol ASC, u.usuario ASC`
  );

  return rows;
};

module.exports = {
  crearIncidencia,
  listarIncidencias,
  listarIncidenciasTablero,
  obtenerIncidenciaPorId,
  obtenerIncidenciaDetalle,
  actualizarEstadoIncidencia,
  moverIncidencia,
  editarIncidencia,
  agregarComentarioIncidencia,
  crearChecklistIncidencia,
  actualizarChecklistIncidencia,
  crearCambio,
  listarCambios,
  listarCambiosTablero,
  obtenerCambioPorId,
  obtenerCambioDetalle,
  actualizarEstadoCambio,
  moverCambio,
  editarCambio,
  agregarComentarioCambio,
  crearChecklistCambio,
  actualizarChecklistCambio,
  listarHistoricoGestionTi,
  obtenerResumenHistoricoGestionTi,
  obtenerMetricas,
  listarUsuariosAsignables
};
