const express = require("express");
const { isAuthenticated } = require("../middlewares/auth");
const dashboardController = require("../controllers/dashboard_controller");

const router = express.Router();

router.get("/dashboard", isAuthenticated, dashboardController.stats);

module.exports = router;    