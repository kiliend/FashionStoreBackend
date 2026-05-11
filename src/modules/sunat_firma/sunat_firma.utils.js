const fs = require("fs");
const path = require("path");
const forge = require("node-forge");
const { DOMParser, XMLSerializer } = require("@xmldom/xmldom");
const { SignedXml } = require("xml-crypto");

function leerCertificadoPfx(certificadoRuta, certificadoPassword) {
  const rutaAbsoluta = path.isAbsolute(certificadoRuta)
    ? certificadoRuta
    : path.join(process.cwd(), certificadoRuta);

  if (!fs.existsSync(rutaAbsoluta)) {
    const error = new Error(`No existe el certificado en la ruta: ${rutaAbsoluta}`);
    error.status = 400;
    throw error;
  }

  const pfxBuffer = fs.readFileSync(rutaAbsoluta);
  const pfxAsn1 = forge.asn1.fromDer(pfxBuffer.toString("binary"));

  const p12 = forge.pkcs12.pkcs12FromAsn1(
    pfxAsn1,
    false,
    certificadoPassword || ""
  );

  let privateKeyPem = null;
  let certificatePem = null;

  const bagsKey = p12.getBags({
    bagType: forge.pki.oids.pkcs8ShroudedKeyBag
  })[forge.pki.oids.pkcs8ShroudedKeyBag];

  if (bagsKey && bagsKey.length > 0) {
    privateKeyPem = forge.pki.privateKeyToPem(bagsKey[0].key);
  }

  const bagsCert = p12.getBags({
    bagType: forge.pki.oids.certBag
  })[forge.pki.oids.certBag];

  if (bagsCert && bagsCert.length > 0) {
    certificatePem = forge.pki.certificateToPem(bagsCert[0].cert);
  }

  if (!privateKeyPem || !certificatePem) {
    const error = new Error("No se pudo leer la clave privada o el certificado del archivo PFX");
    error.status = 400;
    throw error;
  }

  return {
    privateKeyPem,
    certificatePem
  };
}

function limpiarCertificadoPem(certificatePem) {
  return certificatePem
    .replace("-----BEGIN CERTIFICATE-----", "")
    .replace("-----END CERTIFICATE-----", "")
    .replace(/\r?\n|\r/g, "");
}

function firmarXmlSunat(xmlOriginal, privateKeyPem, certificatePem, rucEmpresa) {
  const doc = new DOMParser().parseFromString(xmlOriginal, "text/xml");

  const extensionContent = doc.getElementsByTagName("ext:ExtensionContent")[0];

  if (!extensionContent) {
    const error = new Error("El XML no contiene ext:ExtensionContent para insertar la firma");
    error.status = 400;
    throw error;
  }

  const certLimpio = limpiarCertificadoPem(certificatePem);
  const idFirma = `IDSign${rucEmpresa}`;

  const sig = new SignedXml();

  /*
    SUNAT trabaja con XMLDSig.
    En este ejemplo usamos rsa-sha1 y sha1 porque el manual muestra esa estructura
    en sus ejemplos de CDR y firma XMLDSig. Para producción puede requerirse
    adecuar algoritmos según la librería y validación vigente.
  */
  sig.signatureAlgorithm = "http://www.w3.org/2000/09/xmldsig#rsa-sha1";
  sig.canonicalizationAlgorithm = "http://www.w3.org/TR/2001/REC-xml-c14n-20010315";

  sig.addReference({
    xpath: "/*",
    transforms: [
      "http://www.w3.org/2000/09/xmldsig#enveloped-signature"
    ],
    digestAlgorithm: "http://www.w3.org/2000/09/xmldsig#sha1"
  });

  sig.privateKey = privateKeyPem;

  sig.keyInfoProvider = {
    getKeyInfo() {
      return `
        <ds:KeyInfo>
          <ds:X509Data>
            <ds:X509Certificate>${certLimpio}</ds:X509Certificate>
          </ds:X509Data>
        </ds:KeyInfo>
      `;
    }
  };

  sig.computeSignature(xmlOriginal, {
    location: {
      reference: "//*[local-name(.)='ExtensionContent']",
      action: "append"
    },
    prefix: "ds",
    attrs: {
      Id: idFirma
    }
  });

  return sig.getSignedXml();
}

function validarXmlFirmadoBasico(xmlFirmado) {
  const tieneSignature = xmlFirmado.includes("<ds:Signature");
  const tieneCertificado = xmlFirmado.includes("<ds:X509Certificate>");
  const tieneDigest = xmlFirmado.includes("<ds:DigestValue>");
  const tieneSignatureValue = xmlFirmado.includes("<ds:SignatureValue>");

  return {
    tieneSignature,
    tieneCertificado,
    tieneDigest,
    tieneSignatureValue,
    validoBasico:
      tieneSignature &&
      tieneCertificado &&
      tieneDigest &&
      tieneSignatureValue
  };
}

module.exports = {
  leerCertificadoPfx,
  firmarXmlSunat,
  validarXmlFirmadoBasico
};