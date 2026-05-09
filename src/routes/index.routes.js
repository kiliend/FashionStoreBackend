const express = require("express");
const router = express.Router();
const pool = require("../config/db");

const authRoutes = require("../modules/auth/auth.routes");

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

module.exports = router;