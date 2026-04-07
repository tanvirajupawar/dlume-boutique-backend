const express = require("express");
const router = express.Router();
const controller = require("../controllers/order_details_controller");
const upload = require("../middlewares/upload");
const { isAuthenticated, authorizeRoles } = require("../middlewares/auth");

// CREATE
router.post(
  "/",
  isAuthenticated,
  authorizeRoles("admin", "master"),
  upload.fields([
    { name: "clothImage", maxCount: 1 },
    { name: "designImage", maxCount: 1 },
  ]),
  controller.create
);

// GET BY ORDER
router.get(
  "/order/:orderId",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  controller.getByOrderId
);

// DELETE
router.delete(
  "/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  controller.delete
);

module.exports = router;