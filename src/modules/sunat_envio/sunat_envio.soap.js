const axios = require("axios");

function construirSoapSendBill({ username, password, fileName, zipBase64 }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope 
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:ser="http://service.sunat.gob.pe"
  xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
  <soapenv:Header>
    <wsse:Security>
      <wsse:UsernameToken>
        <wsse:Username>${username}</wsse:Username>
        <wsse:Password>${password}</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soapenv:Header>
  <soapenv:Body>
    <ser:sendBill>
      <fileName>${fileName}</fileName>
      <contentFile>${zipBase64}</contentFile>
    </ser:sendBill>
  </soapenv:Body>
</soapenv:Envelope>`;
}

async function enviarSoapSunat({ endpoint, soapBody }) {
  const response = await axios.post(endpoint, soapBody, {
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "SOAPAction": ""
    },
    timeout: 60000
  });

  return response.data;
}

function extraerBase64Cdr(soapResponse) {
  const posiblesEtiquetas = [
    "applicationResponse",
    "content",
    "return"
  ];

  for (const etiqueta of posiblesEtiquetas) {
    const regex = new RegExp(`<[^>]*${etiqueta}[^>]*>([\\s\\S]*?)<\\/[^>]*${etiqueta}>`, "i");
    const match = soapResponse.match(regex);

    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

function extraerFault(soapResponse) {
  const faultString = soapResponse.match(/<faultstring[^>]*>([\s\S]*?)<\/faultstring>/i);

  if (faultString && faultString[1]) {
    return faultString[1].trim();
  }

  const message = soapResponse.match(/<message[^>]*>([\s\S]*?)<\/message>/i);

  if (message && message[1]) {
    return message[1].trim();
  }

  return null;
}

module.exports = {
  construirSoapSendBill,
  enviarSoapSunat,
  extraerBase64Cdr,
  extraerFault
};