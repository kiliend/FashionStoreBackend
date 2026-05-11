const fs = require("fs");
const path = require("path");

const sunatEnvioRepository = require("./sunat_envio.repository");
const {
  construirSoapSendBill,
  enviarSoapSunat,
  extraerBase64Cdr,
  extraerFault
} = require("./sunat_envio.soap");

async function enviarComprobanteSendBill(id_comprobante) {
  const comprobante = await sunatEnvioRepository.findComprobanteParaEnvio(id_comprobante);

  if (!comprobante) {
    const error = new Error("Comprobante o parámetros SUNAT no encontrados");
    error.status = 404;
    throw error;
  }

  if (!comprobante.nombre_zip) {
    const error = new Error("El comprobante no tiene ZIP generado");
    error.status = 400;
    throw error;
  }

  if (!comprobante.endpoint_factura) {
    const error = new Error("No existe endpoint de factura configurado");
    error.status = 400;
    throw error;
  }

  if (!comprobante.usuario_sol || !comprobante.clave_sol) {
    const error = new Error("No existen credenciales SOL configuradas");
    error.status = 400;
    throw error;
  }

  if (["aceptado", "enviado"].includes(comprobante.estado_sunat)) {
    const error = new Error("El comprobante ya fue enviado o aceptado por SUNAT");
    error.status = 400;
    throw error;
  }

  const zipPath = path.join(
    process.cwd(),
    "storage",
    "sunat",
    "zip",
    comprobante.nombre_zip
  );

  if (!fs.existsSync(zipPath)) {
    const error = new Error("No existe el ZIP. Primero debes generar el ZIP");
    error.status = 400;
    throw error;
  }

  const id_envio = await sunatEnvioRepository.crearEnvio({
    id_comprobante: comprobante.id_comprobante,
    metodo_envio: "sendBill",
    nombre_archivo: comprobante.nombre_zip,
    estado_envio: "pendiente"
  });

  try {
    const zipBuffer = fs.readFileSync(zipPath);
    const zipBase64 = zipBuffer.toString("base64");

    /*
      En beta, el manual trabaja con usuario RUC + MODDATOS.
      Ejemplo: 20100066603MODDATOS
    */
    const username = `${comprobante.ruc}${comprobante.usuario_sol}`;

    const soapBody = construirSoapSendBill({
      username,
      password: comprobante.clave_sol,
      fileName: comprobante.nombre_zip,
      zipBase64
    });

    const soapResponse = await enviarSoapSunat({
      endpoint: comprobante.endpoint_factura,
      soapBody
    });

    const fault = extraerFault(soapResponse);

    if (fault) {
      await sunatEnvioRepository.actualizarEnvio(id_envio, {
        estado_envio: "error",
        mensaje_error: fault
      });

      await sunatEnvioRepository.actualizarComprobanteSunat(comprobante.id_comprobante, {
        estado_sunat: "error",
        descripcion_respuesta_sunat: fault
      });

      const error = new Error(`SUNAT respondió error: ${fault}`);
      error.status = 400;
      throw error;
    }

    const cdrBase64 = extraerBase64Cdr(soapResponse);

    if (!cdrBase64) {
      await sunatEnvioRepository.actualizarEnvio(id_envio, {
        estado_envio: "error",
        mensaje_error: "No se pudo extraer CDR de la respuesta SUNAT"
      });

      await sunatEnvioRepository.actualizarComprobanteSunat(comprobante.id_comprobante, {
        estado_sunat: "error",
        descripcion_respuesta_sunat: "No se pudo extraer CDR de la respuesta SUNAT"
      });

      const error = new Error("SUNAT respondió, pero no se pudo extraer el CDR");
      error.status = 400;
      throw error;
    }

    const cdrStoragePath = path.join(process.cwd(), "storage", "sunat", "cdr");

    if (!fs.existsSync(cdrStoragePath)) {
      fs.mkdirSync(cdrStoragePath, { recursive: true });
    }

    const nombreCdr = `R-${comprobante.nombre_zip}`;
    const rutaCdr = path.join(cdrStoragePath, nombreCdr);

    fs.writeFileSync(rutaCdr, Buffer.from(cdrBase64, "base64"));

    await sunatEnvioRepository.actualizarEnvio(id_envio, {
      estado_envio: "procesado",
      mensaje_error: null
    });

    await sunatEnvioRepository.crearCdr({
      id_envio,
      codigo_respuesta: null,
      descripcion_respuesta: "CDR recibido desde SUNAT. Pendiente de lectura detallada.",
      estado_cdr: "observado",
      nombre_cdr: nombreCdr,
      ruta_cdr: rutaCdr,
      observaciones: "CDR guardado correctamente. Falta parsear XML interno."
    });

    await sunatEnvioRepository.actualizarComprobanteSunat(comprobante.id_comprobante, {
      estado_sunat: "enviado",
      descripcion_respuesta_sunat: "Comprobante enviado. CDR recibido pendiente de lectura."
    });

    return {
      id_comprobante: comprobante.id_comprobante,
      id_envio,
      metodo_envio: "sendBill",
      nombre_zip: comprobante.nombre_zip,
      nombre_cdr: nombreCdr,
      ruta_cdr: rutaCdr,
      estado_sunat: "enviado",
      mensaje: "Comprobante enviado a SUNAT y CDR guardado"
    };
  } catch (error) {
    await sunatEnvioRepository.actualizarEnvio(id_envio, {
      estado_envio: "error",
      mensaje_error: error.message
    });

    await sunatEnvioRepository.actualizarComprobanteSunat(comprobante.id_comprobante, {
      estado_sunat: "error",
      descripcion_respuesta_sunat: error.message
    });

    throw error;
  }
}

module.exports = {
  enviarComprobanteSendBill
};