const clientesService = require("./clientes.service");

async function listarClientes(req, res, next) {
  try {
    const clientes = await clientesService.listarClientes();

    res.json({
      ok: true,
      message: "Clientes obtenidos correctamente",
      data: clientes
    });
  } catch (error) {
    next(error);
  }
}

async function obtenerCliente(req, res, next) {
  try {
    const { id } = req.params;

    const cliente = await clientesService.obtenerClientePorId(id);

    res.json({
      ok: true,
      message: "Cliente obtenido correctamente",
      data: cliente
    });
  } catch (error) {
    next(error);
  }
}

async function crearCliente(req, res, next) {
  try {
    const cliente = await clientesService.crearCliente(req.body);

    res.status(201).json({
      ok: true,
      message: "Cliente creado correctamente",
      data: cliente
    });
  } catch (error) {
    next(error);
  }
}

async function actualizarCliente(req, res, next) {
  try {
    const { id } = req.params;

    const cliente = await clientesService.actualizarCliente(id, req.body);

    res.json({
      ok: true,
      message: "Cliente actualizado correctamente",
      data: cliente
    });
  } catch (error) {
    next(error);
  }
}

async function eliminarCliente(req, res, next) {
  try {
    const { id } = req.params;

    const resultado = await clientesService.eliminarCliente(id);

    res.json({
      ok: true,
      message: "Cliente eliminado lógicamente correctamente",
      data: resultado
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listarClientes,
  obtenerCliente,
  crearCliente,
  actualizarCliente,
  eliminarCliente
};