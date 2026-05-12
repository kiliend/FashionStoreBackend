const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

async function subirImagenProducto(req, res, next) {
  try {
    if (!req.file) {
      const error = new Error("Debe enviar una imagen");
      error.status = 400;
      throw error;
    }

    const outputDir = path.join(process.cwd(), "public", "uploads", "productos");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const nombreArchivo = `producto-${Date.now()}.webp`;
    const outputPath = path.join(outputDir, nombreArchivo);

    await sharp(req.file.buffer)
      .resize({
        width: 800,
        height: 800,
        fit: "inside",
        withoutEnlargement: true
      })
      .webp({
        quality: 75
      })
      .toFile(outputPath);

    const imageUrl = `/uploads/productos/${nombreArchivo}`;

    res.status(201).json({
      ok: true,
      message: "Imagen subida correctamente",
      data: {
        image_url: imageUrl,
        full_url: `http://localhost:3000${imageUrl}`
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  subirImagenProducto
};