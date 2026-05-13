const express = require("express");
const cors = require("cors");
const path = require("path");

const routes = require("./routes/index.routes");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Backend FashionStore activo. Usa /api para acceder a las rutas."
  });
});
app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));

app.use("/api", routes);

app.use(errorMiddleware);

module.exports = app;