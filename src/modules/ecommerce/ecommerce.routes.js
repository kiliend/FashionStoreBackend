const express = require("express");
const router = express.Router();

const ecommerceController = require("./ecommerce.controller");
const { verifyToken } = require("../auth/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

/*
  Rutas públicas
*/
router.get("/productos", ecommerceController.listarProductos);
router.get("/productos/:id", ecommerceController.obtenerProducto);
router.post("/validar-carrito", ecommerceController.validarCarrito);
router.post("/registro", ecommerceController.registrarCliente);

/*
  Rutas para cliente e-commerce autenticado
*/
router.post(
  "/checkout",
  verifyToken,
  authorizeRoles("cliente", "cliente_ecommerce"),
  ecommerceController.checkout
);

router.get(
  "/mis-compras",
  verifyToken,
  authorizeRoles("cliente", "cliente_ecommerce"),
  ecommerceController.misCompras
);

router.get(
  "/mis-pedidos",
  verifyToken,
  authorizeRoles("cliente", "cliente_ecommerce"),
  ecommerceController.misPedidos
);

router.get(
  "/mi-cuenta",
  verifyToken,
  authorizeRoles("cliente", "cliente_ecommerce"),
  ecommerceController.obtenerMiCuenta
);

router.put(
  "/mi-cuenta",
  verifyToken,
  authorizeRoles("cliente", "cliente_ecommerce"),
  ecommerceController.actualizarMiCuenta
);

module.exports = router;