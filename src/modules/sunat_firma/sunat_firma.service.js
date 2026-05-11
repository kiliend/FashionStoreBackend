const fs = require("fs");
const path = require("path");

const sunatFirmaRepository = require("./sunat_firma.repository");
const {
  leerCertificadoPfx,
  firmarXmlSunat,
  validarXmlFirmadoBasico
} = require("./sunat_firma.utils");

async function firmarXmlComprobante(id_comprobante) {
  const comprobante = await sunatFirmaRepository.findComprobanteConParametros(id_comprobante);

  if (!comprobante) {
    const error = new Error("Comprobante o parámetros SUNAT no encontrados");
    error.status = 404;
    throw error;
  }

  if (!comprobante.nombre_xml) {
    const error = new Error("El comprobante no tiene nombre XML");
    error.status = 400;
    throw error;
  }

  if (!comprobante.certificado_ruta || !comprobante.certificado_password) {
    const error = new Error("No hay certificado digital configurado en parámetros SUNAT");
    error.status = 400;
    throw error;
  }

  const xmlPath = path.join(
    process.cwd(),
    "storage",
    "sunat",
    "xml",
    comprobante.nombre_xml
  );

  if (!fs.existsSync(xmlPath)) {
    const error = new Error("No existe el XML. Primero debes generar el XML");
    error.status = 400;
    throw error;
  }

  const xmlOriginal = fs.readFileSync(xmlPath, "utf8");

  const { privateKeyPem, certificatePem } = leerCertificadoPfx(
    comprobante.certificado_ruta,
    comprobante.certificado_password
  );

  const xmlFirmado = firmarXmlSunat(
    xmlOriginal,
    privateKeyPem,
    certificatePem,
    comprobante.ruc
  );

  const validacion = validarXmlFirmadoBasico(xmlFirmado);

  if (!validacion.validoBasico) {
    const error = new Error("El XML fue procesado, pero no se detectó una firma XMLDSig completa");
    error.status = 400;
    throw error;
  }

  fs.writeFileSync(xmlPath, xmlFirmado, {
    encoding: "utf8"
  });

  await sunatFirmaRepository.actualizarXmlFirmado(id_comprobante, xmlPath);

  return {
    id_comprobante: comprobante.id_comprobante,
    nombre_xml: comprobante.nombre_xml,
    ruta_xml_firmado: xmlPath,
    estado_sunat: comprobante.estado_sunat,
    validacion
  };
}

module.exports = {
  firmarXmlComprobante
};