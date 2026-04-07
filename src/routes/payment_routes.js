const express = require("express");
const paymentController = require("../controllers/payment_controller");
const { isAuthenticated, authorizeRoles } = require("../middlewares/auth");

const router = express.Router();

// Customer Payment (Orders)
router.post(
  "/payments/customer",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  paymentController.addPayment
);

// Staff Payment (Tasks)
router.post(
  "/payments/staff",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  paymentController.addStaffPayment
);

module.exports = router;