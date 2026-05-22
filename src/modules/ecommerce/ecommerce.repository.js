const pool = require("../../config/db");

async function findProductosPublicos() {
  const sql = `
    SELECT
      p.id_producto,
      p.id_categoria,
      cat.nombre_categoria,
      p.nombre_producto,
      p.descripcion,
      p.precio_venta,
      p.imagen_url,
      p.estado_producto,

      pv.id_variante,
      pv.id_color,
      co.nombre_color,
      pv.id_talla,
      ta.nombre_talla,
      ta.tipo_talla,
      pv.sku,
      pv.stock_actual,
      pv.estado_variante

    FROM producto_variantes pv
    INNER JOIN productos p ON pv.id_producto = p.id_producto
    INNER JOIN categorias cat ON p.id_categoria = cat.id_categoria
    INNER JOIN colores co ON pv.id_color = co.id_color
    INNER JOIN tallas ta ON pv.id_talla = ta.id_talla
    WHERE p.estado_visible = 1
      AND p.estado_producto = 'activo'
      AND pv.estado_visible = 1
      AND pv.estado_variante = 'activo'
      AND pv.stock_actual > 0
    ORDER BY p.id_producto DESC, pv.id_variante DESC
  `;

  const [rows] = await pool.query(sql);
  return rows;
}

async function findProductoPublicoById(id_producto) {
  const productoSql = `
    SELECT
      p.id_producto,
      p.id_categoria,
      cat.nombre_categoria,
      p.nombre_producto,
      p.descripcion,
      p.precio_venta,
      p.imagen_url,
      p.estado_producto
    FROM productos p
    INNER JOIN categorias cat ON p.id_categoria = cat.id_categoria
    WHERE p.id_producto = ?
      AND p.estado_visible = 1
      AND p.estado_producto = 'activo'
    LIMIT 1
  `;

  const variantesSql = `
    SELECT
      pv.id_variante,
      pv.id_producto,
      pv.id_color,
      co.nombre_color,
      pv.id_talla,
      ta.nombre_talla,
      ta.tipo_talla,
      pv.sku,
      pv.stock_actual,
      pv.stock_minimo,
      pv.estado_variante
    FROM producto_variantes pv
    INNER JOIN colores co ON pv.id_color = co.id_color
    INNER JOIN tallas ta ON pv.id_talla = ta.id_talla
    WHERE pv.id_producto = ?
      AND pv.estado_visible = 1
      AND pv.estado_variante = 'activo'
    ORDER BY pv.id_variante DESC
  `;

  const [productoRows] = await pool.query(productoSql, [id_producto]);

  if (productoRows.length === 0) {
    return null;
  }

  const [variantesRows] = await pool.query(variantesSql, [id_producto]);

  return {
    ...productoRows[0],
    variantes: variantesRows
  };
}

async function findClienteByUsuario(id_usuario) {
  const sql = `
    SELECT
      id_cliente,
      id_usuario,
      tipo_documento,
      numero_documento,
      nombres,
      apellidos,
      razon_social,
      correo,
      telefono,
      direccion,
      estado_cliente
    FROM clientes
    WHERE id_usuario = ?
      AND estado_visible = 1
      AND estado_cliente = 'activo'
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_usuario]);
  return rows[0];
}

async function findVarianteParaCarrito(id_variante) {
  const sql = `
    SELECT
      pv.id_variante,
      pv.id_producto,
      pv.sku,
      pv.stock_actual,
      pv.estado_variante,
      p.nombre_producto,
      p.precio_venta,
      p.imagen_url,
      p.estado_producto,
      co.nombre_color,
      ta.nombre_talla
    FROM producto_variantes pv
    INNER JOIN productos p ON pv.id_producto = p.id_producto
    INNER JOIN colores co ON pv.id_color = co.id_color
    INNER JOIN tallas ta ON pv.id_talla = ta.id_talla
    WHERE pv.id_variante = ?
      AND pv.estado_visible = 1
      AND p.estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_variante]);
  return rows[0];
}

async function crearVentaEcommerce(data) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [ventaResult] = await connection.query(
      `
      INSERT INTO ventas
      (
        id_cliente,
        id_vendedor,
        id_usuario_creacion,
        origen_venta,
        metodo_pago,
        subtotal,
        igv,
        descuento_total,
        total,
        estado_venta,
        estado_visible
      )
      VALUES (?, NULL, ?, 'ecommerce', 'solicitud_online', ?, ?, 0.00, ?, 'pendiente', 1)
      `,
      [
        data.id_cliente,
        data.id_usuario_creacion || null,
        data.subtotal,
        data.igv,
        data.total
      ]
    );

    const idVenta = ventaResult.insertId;

    for (const item of data.detalles) {
      await connection.query(
        `
        INSERT INTO detalle_ventas
        (
          id_venta,
          tipo_item,
          id_variante,
          id_promocion,
          id_combo,
          descripcion_item,
          cantidad,
          precio_unitario,
          descuento,
          subtotal,
          estado_visible
        )
        VALUES (?, 'producto', ?, NULL, NULL, ?, ?, ?, 0.00, ?, 1)
        `,
        [
          idVenta,
          item.id_variante,
          item.descripcion_item,
          item.cantidad,
          item.precio_unitario,
          item.subtotal
        ]
      );
    }

    await connection.commit();
    return idVenta;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function findVentaEcommerceById(id_venta) {
  const ventaSql = `
    SELECT
      v.id_venta,
      v.id_cliente,
      v.fecha_venta,
      v.origen_venta,
      v.metodo_pago,
      v.subtotal,
      v.igv,
      v.descuento_total,
      v.total,
      v.estado_venta,
      COALESCE(c.razon_social, CONCAT(c.nombres, ' ', c.apellidos)) AS cliente_nombre
    FROM ventas v
    LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
    WHERE v.id_venta = ?
      AND v.estado_visible = 1
    LIMIT 1
  `;

  const detalleSql = `
    SELECT
      dv.id_detalle_venta,
      dv.id_variante,
      dv.descripcion_item,
      dv.cantidad,
      dv.precio_unitario,
      dv.descuento,
      dv.subtotal,
      p.nombre_producto,
      p.imagen_url,
      co.nombre_color,
      ta.nombre_talla,
      pv.sku
    FROM detalle_ventas dv
    LEFT JOIN producto_variantes pv ON dv.id_variante = pv.id_variante
    LEFT JOIN productos p ON pv.id_producto = p.id_producto
    LEFT JOIN colores co ON pv.id_color = co.id_color
    LEFT JOIN tallas ta ON pv.id_talla = ta.id_talla
    WHERE dv.id_venta = ?
      AND dv.estado_visible = 1
  `;

  const [ventaRows] = await pool.query(ventaSql, [id_venta]);

  if (ventaRows.length === 0) {
    return null;
  }

  const [detalleRows] = await pool.query(detalleSql, [id_venta]);

  return {
    ...ventaRows[0],
    detalles: detalleRows
  };
}

async function findMisCompras(id_usuario) {
  const sql = `
    SELECT
      v.id_venta,
      v.fecha_venta,
      v.origen_venta,
      v.metodo_pago,
      v.subtotal,
      v.igv,
      v.total,
      v.estado_venta
    FROM ventas v
    INNER JOIN clientes c ON v.id_cliente = c.id_cliente
    WHERE c.id_usuario = ?
      AND v.origen_venta = 'ecommerce'
      AND v.estado_visible = 1
    ORDER BY v.id_venta DESC
  `;

  const [rows] = await pool.query(sql, [id_usuario]);
  return rows;
}

async function findMisPedidos(id_usuario) {
  const sql = `
    SELECT
      p.id_pedido,
      p.id_venta,
      p.fecha_pedido,
      p.tipo_entrega,
      p.direccion_entrega,
      p.referencia_entrega,
      p.estado_pedido,
      v.total,
      v.estado_venta
    FROM pedidos p
    INNER JOIN ventas v ON p.id_venta = v.id_venta
    INNER JOIN clientes c ON p.id_cliente = c.id_cliente
    WHERE c.id_usuario = ?
      AND p.estado_visible = 1
    ORDER BY p.id_pedido DESC
  `;

  const [rows] = await pool.query(sql, [id_usuario]);
  return rows;
}
const bcrypt = require("bcrypt");

// ...

async function findUsuarioByUsernameOrCorreo(usuario, correo) {
  const sql = `
    SELECT id_usuario, usuario, correo
    FROM usuarios
    WHERE estado_visible = 1
    AND (
      usuario = ?
      OR correo = ?
    )
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [usuario, correo]);
  return rows[0];
}

async function findClienteByDocumento(numero_documento) {
  const sql = `
    SELECT id_cliente, numero_documento
    FROM clientes
    WHERE numero_documento = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [numero_documento]);
  return rows[0];
}

async function registrarClienteEcommerce(data) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const passwordHash = await bcrypt.hash(data.password, 10);

    const [usuarioResult] = await connection.query(
      `
      INSERT INTO usuarios
      (
        id_rol,
        nombres,
        apellidos,
        usuario,
        password_hash,
        correo,
        telefono,
        estado_usuario,
        estado_visible
      )
      VALUES (7, ?, ?, ?, ?, ?, ?, 'activo', 1)
      `,
      [
        data.nombres,
        data.apellidos || null,
        data.usuario,
        passwordHash,
        data.correo || null,
        data.telefono || null
      ]
    );

    const idUsuario = usuarioResult.insertId;

    const [clienteResult] = await connection.query(
      `
      INSERT INTO clientes
      (
        id_usuario,
        tipo_documento,
        numero_documento,
        nombres,
        apellidos,
        razon_social,
        correo,
        telefono,
        direccion,
        estado_cliente,
        estado_visible
      )
      VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, 'activo', 1)
      `,
      [
        idUsuario,
        data.tipo_documento || "DNI",
        data.numero_documento || null,
        data.nombres,
        data.apellidos || null,
        data.correo || null,
        data.telefono || null,
        data.direccion || null
      ]
    );

    await connection.commit();

    return {
      id_usuario: idUsuario,
      id_cliente: clienteResult.insertId
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function crearClienteDesdeUsuario(id_usuario) {
  const sql = `
    INSERT INTO clientes
    (
      id_usuario,
      tipo_documento,
      numero_documento,
      nombres,
      apellidos,
      razon_social,
      correo,
      telefono,
      direccion,
      estado_cliente,
      estado_visible
    )
    SELECT
      u.id_usuario,
      'DNI',
      NULL,
      u.nombres,
      u.apellidos,
      NULL,
      u.correo,
      u.telefono,
      NULL,
      'activo',
      1
    FROM usuarios u
    WHERE u.id_usuario = ?
      AND u.estado_visible = 1
  `;

  const [result] = await pool.query(sql, [id_usuario]);
  return result.insertId;
}

async function findClienteById(id_cliente) {
  const sql = `
    SELECT
      id_cliente,
      id_usuario,
      tipo_documento,
      numero_documento,
      nombres,
      apellidos,
      razon_social,
      correo,
      telefono,
      direccion,
      estado_cliente
    FROM clientes
    WHERE id_cliente = ?
      AND estado_visible = 1
      AND estado_cliente = 'activo'
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_cliente]);
  return rows[0];
}

async function findMiCuentaByUsuario(id_usuario) {
  const sql = `
    SELECT
      c.id_cliente,
      c.id_usuario,
      c.tipo_documento,
      c.numero_documento,
      c.nombres,
      c.apellidos,
      c.razon_social,
      c.correo,
      c.telefono,
      c.direccion,
      c.estado_cliente,
      u.usuario
    FROM clientes c
    INNER JOIN usuarios u ON c.id_usuario = u.id_usuario
    WHERE c.id_usuario = ?
      AND c.estado_visible = 1
      AND c.estado_cliente = 'activo'
      AND u.estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_usuario]);
  return rows[0];
}

async function findClienteByDocumentoExceptSelf(numero_documento, id_cliente) {
  const sql = `
    SELECT id_cliente, numero_documento
    FROM clientes
    WHERE numero_documento = ?
      AND id_cliente <> ?
      AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [numero_documento, id_cliente]);
  return rows[0];
}

async function updateMiCuentaCliente(id_cliente, data) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [clienteResult] = await connection.query(
      `
      UPDATE clientes
      SET
        tipo_documento = ?,
        numero_documento = ?,
        nombres = ?,
        apellidos = ?,
        correo = ?,
        telefono = ?,
        direccion = ?
      WHERE id_cliente = ?
        AND estado_visible = 1
        AND estado_cliente = 'activo'
      `,
      [
        data.tipo_documento,
        data.numero_documento,
        data.nombres,
        data.apellidos || null,
        data.correo,
        data.telefono || null,
        data.direccion || null,
        id_cliente
      ]
    );

    await connection.query(
      `
      UPDATE usuarios
      SET
        nombres = ?,
        apellidos = ?,
        correo = ?,
        telefono = ?
      WHERE id_usuario = ?
        AND estado_visible = 1
      `,
      [
        data.nombres,
        data.apellidos || null,
        data.correo,
        data.telefono || null,
        data.id_usuario
      ]
    );

    await connection.commit();
    return clienteResult.affectedRows;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  findProductosPublicos,
  findProductoPublicoById,
  findClienteByUsuario,
  findVarianteParaCarrito,
  crearVentaEcommerce,
  findVentaEcommerceById,
  findMisCompras,
  findMisPedidos,
  findUsuarioByUsernameOrCorreo,
  findClienteByDocumento,
  registrarClienteEcommerce,
  crearClienteDesdeUsuario,
  findClienteById,
  findMiCuentaByUsuario,
  findClienteByDocumentoExceptSelf,
  updateMiCuentaCliente
};