const { create } = require("xmlbuilder2");

function generarXmlInvoice(comprobante) {
  const fechaEmision = formatearFecha(comprobante.fecha_emision);
  const horaEmision = formatearHora(comprobante.fecha_emision);

  const numeroDocumento = `${comprobante.serie}-${comprobante.correlativo}`;
  const tipoDocumentoCliente = obtenerTipoDocumentoSunat(comprobante.cliente_tipo_documento);
  const nombreCliente = obtenerNombreCliente(comprobante);

  const valorVentaTotal = calcularValorVentaTotal(comprobante.detalles);
  const igvTotal = Number(comprobante.igv).toFixed(2);
  const total = Number(comprobante.total).toFixed(2);

  const invoice = {
    Invoice: {
      "@xmlns": "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
      "@xmlns:cac": "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
      "@xmlns:cbc": "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
      "@xmlns:ds": "http://www.w3.org/2000/09/xmldsig#",
      "@xmlns:ext": "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2",

      "ext:UBLExtensions": {
        "ext:UBLExtension": {
          "ext:ExtensionContent": {}
        }
      },

      "cbc:UBLVersionID": "2.0",
      "cbc:CustomizationID": "1.0",
      "cbc:ID": numeroDocumento,
      "cbc:IssueDate": fechaEmision,
      "cbc:IssueTime": horaEmision,
      "cbc:InvoiceTypeCode": comprobante.tipo_comprobante,
      "cbc:DocumentCurrencyCode": comprobante.moneda || "PEN",

      "cac:Signature": {
        "cbc:ID": `IDSign${comprobante.empresa_ruc}`,
        "cac:SignatoryParty": {
          "cac:PartyIdentification": {
            "cbc:ID": comprobante.empresa_ruc
          },
          "cac:PartyName": {
            "cbc:Name": comprobante.empresa_razon_social
          }
        },
        "cac:DigitalSignatureAttachment": {
          "cac:ExternalReference": {
            "cbc:URI": `#IDSign${comprobante.empresa_ruc}`
          }
        }
      },

      "cac:AccountingSupplierParty": {
        "cbc:CustomerAssignedAccountID": comprobante.empresa_ruc,
        "cbc:AdditionalAccountID": "6",
        "cac:Party": {
          "cac:PartyName": {
            "cbc:Name": comprobante.empresa_nombre_comercial || comprobante.empresa_razon_social
          },
          "cac:PostalAddress": {
            "cbc:ID": comprobante.empresa_ubigeo || "",
            "cbc:StreetName": comprobante.empresa_direccion_fiscal || "",
            "cbc:CitySubdivisionName": "",
            "cbc:CityName": comprobante.empresa_provincia || "",
            "cbc:CountrySubentity": comprobante.empresa_departamento || "",
            "cbc:District": comprobante.empresa_distrito || "",
            "cac:Country": {
              "cbc:IdentificationCode": "PE"
            }
          },
          "cac:PartyLegalEntity": {
            "cbc:RegistrationName": comprobante.empresa_razon_social
          }
        }
      },

      "cac:AccountingCustomerParty": {
        "cbc:CustomerAssignedAccountID": comprobante.cliente_numero_documento || "00000000",
        "cbc:AdditionalAccountID": tipoDocumentoCliente,
        "cac:Party": {
          "cac:PartyLegalEntity": {
            "cbc:RegistrationName": nombreCliente
          }
        }
      },

      "cac:TaxTotal": {
        "cbc:TaxAmount": {
          "@currencyID": comprobante.moneda || "PEN",
          "#": igvTotal
        },
        "cac:TaxSubtotal": {
          "cbc:TaxableAmount": {
            "@currencyID": comprobante.moneda || "PEN",
            "#": valorVentaTotal
          },
          "cbc:TaxAmount": {
            "@currencyID": comprobante.moneda || "PEN",
            "#": igvTotal
          },
          "cac:TaxCategory": {
            "cac:TaxScheme": {
              "cbc:ID": "1000",
              "cbc:Name": "IGV",
              "cbc:TaxTypeCode": "VAT"
            }
          }
        }
      },

      "cac:LegalMonetaryTotal": {
        "cbc:LineExtensionAmount": {
          "@currencyID": comprobante.moneda || "PEN",
          "#": valorVentaTotal
        },
        "cbc:TaxInclusiveAmount": {
          "@currencyID": comprobante.moneda || "PEN",
          "#": total
        },
        "cbc:AllowanceTotalAmount": {
          "@currencyID": comprobante.moneda || "PEN",
          "#": Number(comprobante.descuento_total || 0).toFixed(2)
        },
        "cbc:PayableAmount": {
          "@currencyID": comprobante.moneda || "PEN",
          "#": total
        }
      },

      "cac:InvoiceLine": comprobante.detalles.map((item, index) => {
        const valorVenta = Number(item.valor_venta).toFixed(2);
        const igvLinea = Number(item.igv).toFixed(2);
        const totalLinea = Number(item.total).toFixed(2);
        const precioUnitario = Number(item.precio_unitario).toFixed(2);

        return {
          "cbc:ID": index + 1,
          "cbc:InvoicedQuantity": {
            "@unitCode": "NIU",
            "#": Number(item.cantidad)
          },
          "cbc:LineExtensionAmount": {
            "@currencyID": comprobante.moneda || "PEN",
            "#": valorVenta
          },
          "cac:PricingReference": {
            "cac:AlternativeConditionPrice": {
              "cbc:PriceAmount": {
                "@currencyID": comprobante.moneda || "PEN",
                "#": precioUnitario
              },
              "cbc:PriceTypeCode": "01"
            }
          },
          "cac:TaxTotal": {
            "cbc:TaxAmount": {
              "@currencyID": comprobante.moneda || "PEN",
              "#": igvLinea
            },
            "cac:TaxSubtotal": {
              "cbc:TaxableAmount": {
                "@currencyID": comprobante.moneda || "PEN",
                "#": valorVenta
              },
              "cbc:TaxAmount": {
                "@currencyID": comprobante.moneda || "PEN",
                "#": igvLinea
              },
              "cac:TaxCategory": {
                "cbc:TaxExemptionReasonCode": "10",
                "cac:TaxScheme": {
                  "cbc:ID": "1000",
                  "cbc:Name": "IGV",
                  "cbc:TaxTypeCode": "VAT"
                }
              }
            }
          },
          "cac:Item": {
            "cbc:Description": item.descripcion
          },
          "cac:Price": {
            "cbc:PriceAmount": {
              "@currencyID": comprobante.moneda || "PEN",
              "#": totalLinea
            }
          }
        };
      })
    }
  };

  return create(invoice).end({
    prettyPrint: true,
    headless: false
  });
}

function calcularValorVentaTotal(detalles) {
  const total = detalles.reduce((acc, item) => {
    return acc + Number(item.valor_venta);
  }, 0);

  return total.toFixed(2);
}

function obtenerNombreCliente(comprobante) {
  if (comprobante.cliente_razon_social) {
    return comprobante.cliente_razon_social;
  }

  const nombres = comprobante.cliente_nombres || "";
  const apellidos = comprobante.cliente_apellidos || "";

  const nombreCompleto = `${nombres} ${apellidos}`.trim();

  return nombreCompleto || "CLIENTES VARIOS";
}

function obtenerTipoDocumentoSunat(tipoDocumento) {
  const mapa = {
    DNI: "1",
    RUC: "6",
    CE: "4",
    PASAPORTE: "7"
  };

  return mapa[tipoDocumento] || "0";
}

function formatearFecha(fecha) {
  const date = new Date(fecha);
  return date.toISOString().slice(0, 10);
}

function formatearHora(fecha) {
  const date = new Date(fecha);
  return date.toTimeString().slice(0, 8);
}

module.exports = {
  generarXmlInvoice
};