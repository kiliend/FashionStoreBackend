const sunatCdrRepository = require("./sunat_cdr.repository");
const {
  extraerXmlDesdeZipCdr,
  parsearXmlCdr
} = require("./sunat_cdr.parser");

async function procesarCdrComprobante(id_comprobante) {
  const comprobante = await sunatCdrRepository.findComprobanteById(id_comprobante);

  if (!comprobante) {
    const error = new Error("Comprobante no encontrado");
    error.status = 404;
    throw error;
  }

  const envio = await sunatCdrRepository.findUltimoEnvioByComprobante(id_comprobante);

  if (!envio) {
    const error = new Error("No existe envío SUNAT asociado a este comprobante");
    error.status = 404;
    throw error;
  }

  const cdr = await sunatCdrRepository.findCdrByEnvio(envio.id_envio);

  if (!cdr) {
    const error = new Error("No existe CDR registrado para este envío");
    error.status = 404;
    throw error;
  }

  if (!cdr.ruta_cdr) {
    const error = new Error("El CDR no tiene ruta registrada");
    error.status = 400;
    throw error;
  }

  try {
    const { nombre_xml_cdr, xml_content } = extraerXmlDesdeZipCdr(cdr.ruta_cdr);
    const resultadoCdr = parsearXmlCdr(xml_content);

    await sunatCdrRepository.updateCdr(cdr.id_cdr, {
      codigo_respuesta: resultadoCdr.codigo_respuesta,
      descripcion_respuesta: resultadoCdr.descripcion_respuesta,
      estado_cdr: resultadoCdr.estado_cdr,
      observaciones: resultadoCdr.observaciones
    });

    await sunatCdrRepository.updateEnvioProcesado(envio.id_envio);

    await sunatCdrRepository.updateComprobanteSunat(id_comprobante, {
      estado_sunat: convertirEstadoCdrAEstadoSunat(resultadoCdr.estado_cdr),
      codigo_respuesta_sunat: resultadoCdr.codigo_respuesta,
      descripcion_respuesta_sunat: resultadoCdr.descripcion_respuesta
    });

    return {
      id_comprobante: comprobante.id_comprobante,
      id_envio: envio.id_envio,
      id_cdr: cdr.id_cdr,
      nombre_cdr_zip: cdr.nombre_cdr,
      nombre_xml_cdr,
      codigo_respuesta: resultadoCdr.codigo_respuesta,
      descripcion_respuesta: resultadoCdr.descripcion_respuesta,
      estado_cdr: resultadoCdr.estado_cdr,
      estado_sunat: convertirEstadoCdrAEstadoSunat(resultadoCdr.estado_cdr),
      observaciones: resultadoCdr.observaciones
    };
  } catch (error) {
    await sunatCdrRepository.updateCdr(cdr.id_cdr, {
      codigo_respuesta: null,
      descripcion_respuesta: error.message,
      estado_cdr: "error",
      observaciones: "Error al procesar el archivo CDR"
    });

    await sunatCdrRepository.updateComprobanteSunat(id_comprobante, {
      estado_sunat: "error",
      codigo_respuesta_sunat: null,
      descripcion_respuesta_sunat: error.message
    });

    throw error;
  }
}

function convertirEstadoCdrAEstadoSunat(estado_cdr) {
  const mapa = {
    aceptado: "aceptado",
    rechazado: "rechazado",
    observado: "observado",
    error: "error"
  };

  return mapa[estado_cdr] || "observado";
}

module.exports = {
  procesarCdrComprobante
};