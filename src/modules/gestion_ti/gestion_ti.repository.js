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
  return listarIncidencias({});
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

    if (data.estado === "cerrada") {
      campos.push("fecha_cierre = NOW()");
      campos.push("id_usuario_cierre = ?");
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
  return listarCambios({});
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
  obtenerMetricas,
  listarUsuariosAsignables
};
