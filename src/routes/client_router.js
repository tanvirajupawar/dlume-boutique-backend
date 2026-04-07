const express = require("express");
const customerController = require("../controllers/customer_controller");
const { isAuthenticated, authorizeRoles } = require("../middlewares/auth");

const clientRouter = express.Router();

clientRouter.get(
  "/customers",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  customerController.index
);

clientRouter.post(
  "/customers",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  customerController.create
);

clientRouter.get(
  "/customers/:id",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  customerController.fetch
);

clientRouter.put(
  "/customers/:id",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  customerController.update
);

clientRouter.delete(
  "/customers/:id",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  customerController.delete
);

module.exports = clientRouter;