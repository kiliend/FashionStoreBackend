const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

const sunatZipRepository = require("./sunat_zip.repository");

async function generarZipComprobante(id_comprobante) {
  const comprobante = await sunatZipRepository.findComprobanteById(id_comprobante);

  if (!comprobante) {
    const error = new Error("Comprobante no encontrado");
    error.status = 404;
    throw error;
  }

  if (!comprobante.nombre_xml || !comprobante.nombre_zip) {
    const error = new Error("El comprobante no tiene nombre XML o ZIP generado");
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
    const error = new Error("No existe el archivo XML. Primero debes generar el XML");
    error.status = 400;
    throw error;
  }

  const zipStoragePath = path.join(process.cwd(), "storage", "sunat", "zip");

  if (!fs.existsSync(zipStoragePath)) {
    fs.mkdirSync(zipStoragePath, { recursive: true });
  }

  const zipPath = path.join(zipStoragePath, comprobante.nombre_zip);

  await crearZipConXml({
    zipPath,
    xmlPath,
    xmlName: comprobante.nombre_xml
  });

  await sunatZipRepository.actualizarRutaZip(id_comprobante, zipPath);

  return {
    id_comprobante: comprobante.id_comprobante,
    nombre_xml: comprobante.nombre_xml,
    nombre_zip: comprobante.nombre_zip,
    ruta_xml: xmlPath,
    ruta_zip: zipPath,
    estado_sunat: comprobante.estado_sunat
  };
}

function crearZipConXml({ zipPath, xmlPath, xmlName }) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", {
      zlib: { level: 9 }
    });

    output.on("close", () => {
      resolve();
    });

    archive.on("error", (error) => {
      reject(error);
    });

    archive.pipe(output);

    /*
      SUNAT espera que dentro del ZIP esté el XML con el mismo nombre base.
      Por eso usamos xmlName como nombre interno del archivo.
    */
    archive.file(xmlPath, {
      name: xmlName
    });

    archive.finalize();
  });
}

module.exports = {
  generarZipComprobante
};