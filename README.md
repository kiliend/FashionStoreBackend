# Backend FashionStore

Backend desarrollado para el sistema **FashionStore**, orientado a la gestión de ventas, inventario, compras, pedidos, repartos, promociones, reportes e integración base con SUNAT.

El proyecto está construido con **Node.js**, **Express** y **MySQL**, usando una arquitectura modular para separar responsabilidades por cada área funcional del sistema.

---

## 1. Librerías y tecnologías utilizadas

El backend fue desarrollado con Node.js, Express y MySQL. Las principales librerías utilizadas son:

| Librería | Uso dentro del proyecto |
|---|---|
| express | Framework principal para crear la API REST |
| mysql2 | Conexión entre Node.js y MySQL |
| dotenv | Manejo de variables de entorno desde archivo `.env` |
| cors | Permite la comunicación entre frontend y backend |
| bcrypt | Encriptación de contraseñas de usuarios |
| jsonwebtoken | Generación y validación de tokens JWT |
| express-validator | Validaciones de datos en solicitudes HTTP |
| nodemon | Reinicio automático del servidor en desarrollo |
| xmlbuilder2 | Generación de XML para comprobantes electrónicos SUNAT |
| xml-crypto | Firma digital XMLDSig para documentos electrónicos |
| node-forge | Lectura de certificados digitales `.pfx` o `.p12` |
| @xmldom/xmldom | Manipulación y lectura de documentos XML |
| xpath | Búsqueda de nodos dentro de XML, usado para CDR SUNAT |
| archiver | Compresión de XML en archivos ZIP |
| adm-zip | Lectura y extracción de archivos ZIP, usado para CDR |
| axios | Envío de solicitudes HTTP/SOAP hacia servicios externos como SUNAT |
| form-data | Soporte para envío de archivos o formularios si se requiere integración externa |

---

## 2. Requisitos previos

Antes de instalar el proyecto, se debe contar con lo siguiente:

```txt
Node.js instalado
MySQL instalado o XAMPP con MySQL activo
Visual Studio Code
Postman o Thunder Client para pruebas
Git instalado
Base de datos fashionstore_db creada

## 2. Arquitectura del proyecto

El backend utiliza una arquitectura modular basada en capas:

```txt
routes
  ↓
controller
  ↓
service
  ↓
repository
  ↓
database
```

Cada módulo contiene sus propias rutas, controladores, servicios y repositorios.

---

## 3. Estructura de carpetas

```txt
backend-fashionstore/
│
├── server.js
├── package.json
├── .env
│
├── src/
│   ├── app.js
│   │
│   ├── config/
│   │   └── db.js
│   │
│   ├── middlewares/
│   │   ├── error.middleware.js
│   │   └── role.middleware.js
│   │
│   ├── routes/
│   │   └── index.routes.js
│   │
│   └── modules/
│       ├── auth/
│       ├── usuarios/
│       ├── categorias/
│       ├── colores/
│       ├── tallas/
│       ├── productos/
│       ├── variantes/
│       ├── stock/
│       ├── clientes/
│       ├── ventas/
│       ├── pedidos/
│       ├── proveedores/
│       ├── compras/
│       ├── vehiculos/
│       ├── repartos/
│       ├── incidencias/
│       ├── devoluciones/
│       ├── contacto/
│       ├── tareas/
│       ├── promociones/
│       ├── combos/
│       ├── descuentos/
│       ├── dashboard/
│       ├── reportes/
│       ├── sunat_base/
│       ├── comprobantes/
│       ├── sunat_xml/
│       ├── sunat_firma/
│       ├── sunat_zip/
│       ├── sunat_envio/
│       └── sunat_cdr/
│
└── storage/
    └── sunat/
        ├── xml/
        ├── zip/
        ├── cdr/
        └── certificados/
```

---

## 4. Instalación del proyecto

Clonar el repositorio:

```bash
git clone URL_DEL_REPOSITORIO
```

Ingresar a la carpeta del backend:

```bash
cd backend-fashionstore
```

Instalar dependencias:

```bash
npm install
```

---

## 5. Configuración del archivo `.env`

Crear un archivo `.env` en la raíz del proyecto:

```env
PORT=3000

DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=
DB_NAME=fashionstore_db
DB_PORT=3306

JWT_SECRET=fashionstore_secret_key
JWT_EXPIRES=2h
```

> Nota: no subir el archivo `.env` al repositorio.

---

## 6. Ejecución del servidor

Modo desarrollo:

```bash
npm run dev
```

Modo producción:

```bash
npm start
```

Si todo está correcto, el servidor debe ejecutarse en:

```txt
http://localhost:3000
```

Ruta de prueba:

```txt
GET http://localhost:3000/api
```

Respuesta esperada:

```json
{
  "ok": true,
  "message": "API FashionStore funcionando correctamente"
}
```

---

## 7. Prueba de conexión con la base de datos

```txt
GET http://localhost:3000/api/test-db
```

Respuesta esperada:

```json
{
  "ok": true,
  "message": "Conexión a MySQL correcta",
  "data": {
    "fecha_servidor": "2026-05-..."
  }
}
```

---

## 8. Autenticación

El sistema utiliza autenticación mediante **JWT**.

### Login

```txt
POST /api/auth/login
```

Body:

```json
{
  "usuario": "admin",
  "password": "admin123"
}
```

Respuesta esperada:

```json
{
  "ok": true,
  "message": "Inicio de sesión correcto",
  "data": {
    "token": "TOKEN_GENERADO",
    "usuario": {
      "id_usuario": 1,
      "usuario": "admin",
      "rol": "admin"
    }
  }
}
```

Para acceder a rutas protegidas se debe enviar el token en el header:

```txt
Authorization: Bearer TOKEN_GENERADO
```

---

## 9. Módulos implementados

### Seguridad y usuarios

- Auth
- Usuarios
- Roles
- JWT
- Control de acceso por roles

### Catálogo

- Categorías
- Colores
- Tallas
- Productos
- Variantes de producto
- SKU
- Stock mínimo
- Stock actual

### Inventario

- Movimientos de stock
- Entradas
- Salidas
- Ajustes
- Devoluciones
- Alertas de stock bajo

### Clientes y ventas

- Clientes
- Ventas
- Detalle de ventas
- Anulación de ventas
- Descuento automático de stock
- Devolución de stock por anulación

### Promociones y combos

- Promociones
- Combos
- Descuentos
- Aplicación comercial en ventas

### Pedidos y operaciones

- Pedidos
- Detalle de pedidos
- Asignaciones operativas
- Tareas operativas

### Compras

- Proveedores
- Órdenes de compra
- Detalle de órdenes de compra
- Recepción de mercadería
- Pago de factura
- Entrada automática a stock

### Logística

- Vehículos
- Repartos
- Asignación de repartidor
- Salida a reparto
- Entrega
- Reparto fallido

### Postventa

- Incidencias
- Reclamos
- Productos defectuosos
- Cambios
- Devoluciones

### Comunicación

- Mensajes de contacto desde landing page

### Dashboard y reportes

- Dashboard administrativo
- Ventas del día
- Productos más vendidos
- Stock bajo
- Pedidos pendientes
- Reporte de ventas
- Reporte de compras
- Reporte de inventario
- Reporte de productos más vendidos

### Integración SUNAT base

- Empresa
- Parámetros SUNAT
- Series de comprobantes
- Comprobantes electrónicos
- XML UBL básico
- Firma digital XMLDSig
- ZIP SUNAT
- Envío sendBill
- Procesamiento CDR

---

## 10. Rutas principales

### Auth

```txt
POST /api/auth/login
GET  /api/auth/profile
```

### Usuarios

```txt
GET    /api/usuarios
GET    /api/usuarios/:id
POST   /api/usuarios
PUT    /api/usuarios/:id
DELETE /api/usuarios/:id
```

### Categorías

```txt
GET    /api/categorias
GET    /api/categorias/:id
POST   /api/categorias
PUT    /api/categorias/:id
DELETE /api/categorias/:id
```

### Productos

```txt
GET    /api/productos
GET    /api/productos/:id
POST   /api/productos
PUT    /api/productos/:id
DELETE /api/productos/:id
```

### Variantes

```txt
GET    /api/variantes
GET    /api/variantes/:id
POST   /api/variantes
PUT    /api/variantes/:id
DELETE /api/variantes/:id
```

### Stock

```txt
GET  /api/stock/movimientos
GET  /api/stock/movimientos/:id
POST /api/stock/movimientos
```

### Clientes

```txt
GET    /api/clientes
GET    /api/clientes/:id
POST   /api/clientes
PUT    /api/clientes/:id
DELETE /api/clientes/:id
```

### Ventas

```txt
GET  /api/ventas
GET  /api/ventas/:id
POST /api/ventas
PUT  /api/ventas/:id/anular
```

### Pedidos

```txt
GET    /api/pedidos
GET    /api/pedidos/:id
POST   /api/pedidos
PUT    /api/pedidos/:id/estado
PUT    /api/pedidos/:id/asignar
DELETE /api/pedidos/:id
```

### Proveedores

```txt
GET    /api/proveedores
GET    /api/proveedores/:id
POST   /api/proveedores
PUT    /api/proveedores/:id
DELETE /api/proveedores/:id
```

### Compras

```txt
GET  /api/compras
GET  /api/compras/:id
POST /api/compras
PUT  /api/compras/:id/recibir
PUT  /api/compras/:id/pagar
PUT  /api/compras/:id/cancelar
```

### Vehículos

```txt
GET    /api/vehiculos
GET    /api/vehiculos/:id
POST   /api/vehiculos
PUT    /api/vehiculos/:id
DELETE /api/vehiculos/:id
```

### Repartos

```txt
GET  /api/repartos
GET  /api/repartos/:id
POST /api/repartos
PUT  /api/repartos/:id/salida
PUT  /api/repartos/:id/entregar
PUT  /api/repartos/:id/fallido
```

### Incidencias

```txt
GET  /api/incidencias
GET  /api/incidencias/:id
POST /api/incidencias
PUT  /api/incidencias/:id/estado
```

### Devoluciones

```txt
GET  /api/devoluciones
GET  /api/devoluciones/:id
POST /api/devoluciones
PUT  /api/devoluciones/:id/procesar
PUT  /api/devoluciones/:id/rechazar
```

### Contacto

```txt
GET    /api/contacto
GET    /api/contacto/:id
POST   /api/contacto
PUT    /api/contacto/:id/estado
DELETE /api/contacto/:id
```

### Promociones

```txt
GET    /api/promociones
GET    /api/promociones/:id
POST   /api/promociones
PUT    /api/promociones/:id
DELETE /api/promociones/:id
```

### Combos

```txt
GET    /api/combos
GET    /api/combos/:id
POST   /api/combos
PUT    /api/combos/:id
DELETE /api/combos/:id
```

### Descuentos

```txt
POST /api/descuentos/calcular
```

### Dashboard

```txt
GET /api/dashboard
```

### Reportes

```txt
GET /api/reportes/ventas?fecha_inicio=2026-05-01&fecha_fin=2026-05-31
GET /api/reportes/inventario
GET /api/reportes/compras?fecha_inicio=2026-05-01&fecha_fin=2026-05-31
GET /api/reportes/productos-mas-vendidos?fecha_inicio=2026-05-01&fecha_fin=2026-05-31
```

### SUNAT

```txt
GET  /api/sunat/empresa
POST /api/sunat/empresa
PUT  /api/sunat/empresa/:id

GET  /api/sunat/parametros
POST /api/sunat/parametros
PUT  /api/sunat/parametros/:id

GET  /api/sunat/series
POST /api/sunat/series
PUT  /api/sunat/series/:id

POST /api/comprobantes/generar/:id_venta
GET  /api/comprobantes
GET  /api/comprobantes/:id

POST /api/sunat/generar-xml/:id_comprobante
POST /api/sunat/firmar-xml/:id_comprobante
POST /api/sunat/generar-zip/:id_comprobante
POST /api/sunat/enviar/:id_comprobante
POST /api/sunat/procesar-cdr/:id_comprobante
```

---

## 11. Flujo principal del sistema

### Flujo de venta presencial

```txt
Login
→ Crear cliente
→ Crear producto
→ Crear variante
→ Registrar venta
→ Descontar stock
→ Registrar movimiento de stock
→ Generar comprobante
→ Consultar dashboard/reportes
```

### Flujo ecommerce

```txt
Cliente realiza compra
→ Venta pendiente
→ Pedido
→ Preparación de pedido
→ Asignación a reparto
→ Salida a ruta
→ Entrega
→ Pedido entregado
```

### Flujo de compras

```txt
Proveedor
→ Orden de compra
→ Detalle de compra
→ Recepción de mercadería
→ Entrada automática a stock
→ Pago de factura
```

### Flujo SUNAT

```txt
Venta completada
→ Comprobante electrónico
→ XML
→ Firma digital
→ ZIP
→ Envío SUNAT
→ CDR
→ Estado final SUNAT
```

---

## 12. Roles del sistema

El sistema contempla roles como:

```txt
admin
vendedor
almacen
despacho
reparto
cliente
```

Cada rol tiene permisos diferentes sobre los módulos del sistema.

---

## 13. Seguridad

El backend implementa:

- Autenticación con JWT.
- Contraseñas encriptadas con bcrypt.
- Protección de rutas privadas.
- Control de acceso por rol.
- Uso de variables de entorno.
- Eliminación lógica mediante `estado_visible`.

---

## 14. Integración SUNAT

La integración SUNAT se encuentra preparada a nivel estructural.

Incluye:

- Configuración de empresa.
- Parámetros SUNAT.
- Series de comprobantes.
- Generación de comprobantes desde ventas.
- Generación XML UBL básico.
- Firma digital XMLDSig.
- Compresión ZIP.
- Envío `sendBill`.
- Procesamiento de CDR.

Pendiente para producción:

```txt
Certificado digital real
Credenciales SOL reales
Pruebas en ambiente beta
Validación completa contra XSD
Ajuste final para producción
```

---

## 15. Base de datos

La base de datos principal del sistema es:

```txt
fashionstore_db
```

Se recomienda importar primero el script de estructura y luego el script de datos iniciales.

Tablas principales:

```txt
roles
usuarios
categorias
productos
colores
tallas
producto_variantes
movimientos_stock
clientes
ventas
detalle_ventas
pedidos
pedido_detalle
proveedores
ordenes_compra
detalle_orden_compra
vehiculos
repartos
incidencias_cliente
devoluciones
promociones
combos
mensajes_contacto
tareas_operativas
empresa
parametros_sunat
series_comprobantes
comprobantes
comprobante_detalle
sunat_envios
sunat_cdr
```

---

## 16. Scripts disponibles

```json
{
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

Ejecutar en desarrollo:

```bash
npm run dev
```

Ejecutar en producción:

```bash
npm start
```

---

## 17. Ejemplo de uso con token

Primero iniciar sesión:

```txt
POST /api/auth/login
```

Luego usar el token recibido:

```txt
Authorization: Bearer TOKEN_GENERADO
```

Ejemplo de ruta protegida:

```txt
GET /api/usuarios
```

---

## 18. Estado actual del proyecto

El backend cuenta con los módulos principales implementados a nivel estructural y funcional:

```txt
Autenticación
Usuarios
Catálogo
Inventario
Ventas
Pedidos
Compras
Logística
Postventa
Promociones
Reportes
Dashboard
SUNAT base
```

La siguiente etapa del proyecto consiste en:

```txt
Validar todos los endpoints
Crear colección Postman
Crear datos iniciales SQL
Integrar el frontend
Realizar pruebas completas del flujo
```

---

## 19. Recomendaciones

- No subir el archivo `.env` al repositorio.
- No subir certificados digitales reales.
- Usar contraseñas seguras en producción.
- Proteger las credenciales SUNAT.
- Validar XML SUNAT antes del envío real.
- Usar HTTPS en ambiente productivo.
- Mantener respaldos de la base de datos.
- Aplicar control de versiones por ramas.

---

## 20. Autor

Proyecto desarrollado como backend modular para el sistema FashionStore.

```txt
Desarrollado por: Luis Condori
Tecnología: Node.js + Express + MySQL
```
