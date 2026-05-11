const fs = require("fs");
const AdmZip = require("adm-zip");
const { DOMParser } = require("@xmldom/xmldom");
const xpath = require("xpath");

function extraerXmlDesdeZipCdr(rutaCdr) {
  if (!fs.existsSync(rutaCdr)) {
    const error = new Error("No existe el archivo CDR en la ruta registrada");
    error.status = 400;
    throw error;
  }

  const zip = new AdmZip(rutaCdr);
  const entries = zip.getEntries();

  const xmlEntry = entries.find((entry) =>
    entry.entryName.toLowerCase().endsWith(".xml")
  );

  if (!xmlEntry) {
    const error = new Error("El ZIP del CDR no contiene XML");
    error.status = 400;
    throw error;
  }

  const xmlContent = xmlEntry.getData().toString("utf8");

  return {
    nombre_xml_cdr: xmlEntry.entryName,
    xml_content: xmlContent
  };
}

function parsearXmlCdr(xmlContent) {
  const doc = new DOMParser().parseFromString(xmlContent, "text/xml");

  const select = xpath.useNamespaces({
    "ar": "urn:oasis:names:specification:ubl:schema:xsd:ApplicationResponse-2",
    "cbc": "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
    "cac": "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  });

  const codigo = obtenerTexto(select, doc, "//cbc:ResponseCode");
  const descripcion = obtenerTexto(select, doc, "//cbc:Description");

  const notas = select("//cbc:Note", doc).map((node) =>
    node.textContent.trim()
  );

  const estado_cdr = determinarEstadoCdr(codigo);

  return {
    codigo_respuesta: codigo || null,
    descripcion_respuesta: descripcion || "Sin descripción de respuesta",
    estado_cdr,
    observaciones: notas.length > 0 ? notas.join(" | ") : null
  };
}

function obtenerTexto(select, doc, expresion) {
  const nodes = select(expresion, doc);

  if (!nodes || nodes.length === 0) {
    return null;
  }

  return nodes[0].textContent.trim();
}

function determinarEstadoCdr(codigo) {
  if (codigo === "0") {
    return "aceptado";
  }

  if (!codigo) {
    return "observado";
  }

  return "rechazado";
}

module.exports = {
  extraerXmlDesdeZipCdr,
  parsearXmlCdr
};