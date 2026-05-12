const express = require("express");
const multer = require("multer");

const uploadsController = require("./uploads.controller");
const { verifyToken } = require("../auth/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

const router = express.Router();

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 3 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];

    if (!tiposPermitidos.includes(file.mimetype)) {
      return cb(new Error("Solo se permiten imágenes JPG, PNG o WEBP"));
    }

    cb(null, true);
  }
});

router.post(
  "/productos",
  verifyToken,
  authorizeRoles("admin"),
  upload.single("imagen"),
  uploadsController.subirImagenProducto
);

module.exports = router;