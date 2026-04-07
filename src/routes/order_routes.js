const express = require("express");
const orderController = require("../controllers/order_controller");
const orderRouter = express.Router();
const upload = require("../middlewares/upload");
const { isAuthenticated, authorizeRoles } = require("../middlewares/auth");

/* =========================
   ORDER LIST ROUTES
========================= */

// 🔥 MASTER SPECIFIC
orderRouter.get(
  "/orders/master/:staffId",
  isAuthenticated,
  authorizeRoles("admin", "master"),
  orderController.getOrdersByMaster
);

orderRouter.get(
  "/orders/next-number",
  isAuthenticated,
  authorizeRoles("admin", "master"),
  orderController.getNextOrderNumber
);

orderRouter.get(
  "/orders",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  orderController.index
);

orderRouter.get(
  "/getByCustomer/:id",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  orderController.getByCustomer
);

// ⚠️ KEEP LAST
orderRouter.get(
  "/orders/:id",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  orderController.fetch
);

/* =========================
   ORDER CREATE / UPDATE
========================= */

orderRouter.post(
  "/orders",
  isAuthenticated,
  authorizeRoles("admin", "master"),
  upload.fields([
    { name: "clothImages", maxCount: 20 },
    { name: "designImages", maxCount: 20 }
  ]),
  orderController.create
);

orderRouter.put(
  "/orders/:id",
  isAuthenticated,
  authorizeRoles("admin", "master"),
  orderController.update
);

orderRouter.delete(
  "/orders/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  orderController.delete
);

/* =========================
   PAYMENTS
========================= */

orderRouter.post(
  "/add-payment",
  isAuthenticated,
  authorizeRoles("admin", "master"),
  orderController.addPayment
);

/* =========================
   MASTER ASSIGNMENT
========================= */

orderRouter.post(
  "/assignOrderToMaster",
  isAuthenticated,
  authorizeRoles("admin", "master"),
  orderController.assignOrderToMaster
);

module.exports = orderRouter;