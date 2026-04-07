const express = require("express");
const serviceController = require("../controllers/service_controller");
const { isAuthenticated, authorizeRoles } = require("../middlewares/auth");

const serviceRouter = express.Router();

serviceRouter.get(
  "/services",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  serviceController.index
);

serviceRouter.post(
  "/services",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  serviceController.create
);

serviceRouter.get(
  "/services/:id",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  serviceController.fetch
);

serviceRouter.put(
  "/services/:id",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  serviceController.update
);

serviceRouter.delete(
  "/services/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  serviceController.delete
);

module.exports = serviceRouter;