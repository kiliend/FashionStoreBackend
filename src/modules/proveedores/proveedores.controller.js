const proveedoresService = require("./proveedores.service");

async function listarProveedores(req, res, next) {
  try {
    const proveedores = await proveedoresService.listarProveedores();

    res.json({
      ok: true,
      message: "Proveedores obtenidos correctamente",
      data: proveedores
    });
  } catch (error) {
    next(error);
  }
}

async function obtenerProveedor(req, res, next) {
  try {
    const { id } = req.params;

    const proveedor = await proveedoresService.obtenerProveedorPorId(id);

    res.json({
      ok: true,
      message: "Proveedor obtenido correctamente",
      data: proveedor
    });
  } catch (error) {
    next(error);
  }
}

async function crearProveedor(req, res, next) {
  try {
    const proveedor = await proveedoresService.crearProveedor(req.body);

    res.status(201).json({
      ok: true,
      message: "Proveedor creado correctamente",
      data: proveedor
    });
  } catch (error) {
    next(error);
  }
}

async function actualizarProveedor(req, res, next) {
  try {
    const { id } = req.params;

    const proveedor = await proveedoresService.actualizarProveedor(id, req.body);

    res.json({
      ok: true,
      message: "Proveedor actualizado correctamente",
      data: proveedor
    });
  } catch (error) {
    next(error);
  }
}

async function eliminarProveedor(req, res, next) {
  try {
    const { id } = req.params;

    const resultado = await proveedoresService.eliminarProveedor(id);

    res.json({
      ok: true,
      message: "Proveedor eliminado lógicamente correctamente",
      data: resultado
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listarProveedores,
  obtenerProveedor,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor
};