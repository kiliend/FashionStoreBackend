const express = require("express");
const router = express.Router();
const pool = require("../config/db");

const authRoutes = require("../modules/auth/auth.routes");
const usuariosRoutes = require("../modules/usuarios/usuarios.routes");
const categoriasRoutes = require("../modules/categorias/categorias.routes");
const coloresRoutes = require("../modules/colores/colores.routes");
const tallasRoutes = require("../modules/tallas/tallas.routes");
const productosRoutes = require("../modules/productos/productos.routes");
const variantesRoutes = require("../modules/variantes/variantes.routes");
const stockRoutes = require("../modules/stock/stock.routes");
const clientesRoutes = require("../modules/clientes/clientes.routes");
const ventasRoutes = require("../modules/ventas/ventas.routes");
const pedidosRoutes = require("../modules/pedidos/pedidos.routes");
const proveedoresRoutes = require("../modules/proveedores/proveedores.routes");
const comprasRoutes = require("../modules/compras/compras.routes");
const vehiculosRoutes = require("../modules/vehiculos/vehiculos.routes");
const repartosRoutes = require("../modules/repartos/repartos.routes");
const incidenciasRoutes = require("../modules/incidencias/incidencias.routes");
const devolucionesRoutes = require("../modules/devoluciones/devoluciones.routes");
const contactoRoutes = require("../modules/contacto/contacto.routes");
const tareasRoutes = require("../modules/tareas/tareas.routes");
const sunatBaseRoutes = require("../modules/sunat_base/sunat_base.routes");
const comprobantesRoutes = require("../modules/comprobantes/comprobantes.routes");
const sunatXmlRoutes = require("../modules/sunat_xml/sunat_xml.routes");
const sunatZipRoutes = require("../modules/sunat_zip/sunat_zip.routes");
const sunatFirmaRoutes = require("../modules/sunat_firma/sunat_firma.routes");
const sunatEnvioRoutes = require("../modules/sunat_envio/sunat_envio.routes");
const sunatCdrRoutes = require("../modules/sunat_cdr/sunat_cdr.routes");
const promocionesRoutes = require("../modules/promociones/promociones.routes");
const combosRoutes = require("../modules/combos/combos.routes");
const descuentosRoutes = require("../modules/descuentos/descuentos.routes");
const dashboardRoutes = require("../modules/dashboard/dashboard.routes");
const reportesRoutes = require("../modules/reportes/reportes.routes");

router.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "API FashionStore funcionando correctamente"
  });
});

router.get("/test-db", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS fecha_servidor");

    res.json({
      ok: true,
      message: "Conexión a MySQL correcta",
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
});

router.use("/auth", authRoutes);
router.use("/usuarios", usuariosRoutes);
router.use("/categorias", categoriasRoutes);
router.use("/colores", coloresRoutes);
router.use("/tallas", tallasRoutes);
router.use("/productos", productosRoutes);
router.use("/variantes", variantesRoutes);
router.use("/stock", stockRoutes);
router.use("/clientes", clientesRoutes);
router.use("/ventas", ventasRoutes);
router.use("/pedidos", pedidosRoutes);
router.use("/proveedores", proveedoresRoutes);
router.use("/compras", comprasRoutes);
router.use("/vehiculos", vehiculosRoutes);
router.use("/repartos", repartosRoutes);
router.use("/incidencias", incidenciasRoutes);
router.use("/devoluciones", devolucionesRoutes);
router.use("/contacto", contactoRoutes);
router.use("/tareas", tareasRoutes);
router.use("/sunat", sunatBaseRoutes);
router.use("/comprobantes", comprobantesRoutes);
router.use("/sunat", sunatXmlRoutes); 
router.use("/sunat", sunatZipRoutes);
router.use("/sunat", sunatFirmaRoutes);
router.use("/sunat", sunatEnvioRoutes);
router.use("/sunat", sunatCdrRoutes);
router.use("/promociones", promocionesRoutes);
router.use("/combos", combosRoutes);
router.use("/descuentos", descuentosRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/reportes", reportesRoutes);


module.exports = router;