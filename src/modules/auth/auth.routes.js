const express = require("express");
const router = express.Router();

const authController = require("./auth.controller");
const { verifyToken } = require("./auth.middleware");

router.post("/login", authController.login);
router.get("/profile", verifyToken, authController.profile);

module.exports = router;