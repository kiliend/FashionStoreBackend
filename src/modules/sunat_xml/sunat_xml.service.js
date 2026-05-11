const fs = require("fs");
const path = require("path");

const sunatXmlRepository = require("./sunat_xml.repository");
const { generarXmlInvoice } = require("./sunat_xml.builder");

async function generarXmlComprobante(id_comprobante) {
  const comprobante = await sunatXmlRepository.findComprobanteCompleto(id_comprobante);

  if (!comprobante) {
    const error = new Error("Comprobante no encontrado");
    error.status = 404;
    throw error;
  }

  if (!["01", "03"].includes(comprobante.tipo_comprobante)) {
    const error = new Error("Por ahora solo se genera XML para factura y boleta");
    error.status = 400;
    throw error;
  }

  if (!Array.isArray(comprobante.detalles) || comprobante.detalles.length === 0) {
    const error = new Error("El comprobante no tiene detalles");
    error.status = 400;
    throw error;
  }

  const xml = generarXmlInvoice(comprobante);

  const storagePath = path.join(process.cwd(), "storage", "sunat", "xml");

  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true });
  }

  const filePath = path.join(storagePath, comprobante.nombre_xml);

  fs.writeFileSync(filePath, xml, {
    encoding: "utf8"
  });

  await sunatXmlRepository.actualizarRutaXml(id_comprobante, filePath);

  return {
    id_comprobante: comprobante.id_comprobante,
    nombre_xml: comprobante.nombre_xml,
    ruta_xml: filePath,
    estado_sunat: comprobante.estado_sunat
  };
}

module.exports = {
  generarXmlComprobante
};