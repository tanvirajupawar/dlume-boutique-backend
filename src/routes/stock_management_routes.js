const express = require("express");
const stockManagementController = require("../controllers/stock_management_controller");
const { isAuthenticated, authorizeRoles } = require("../middlewares/auth");

const stockManagementRouter = express.Router();

// 🔥 SPECIFIC ROUTE FIRST
stockManagementRouter.get(
  "/stockManagement/rate/:service_id/:width",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  stockManagementController.fetchRate
);

// GET ALL
stockManagementRouter.get(
  "/stockManagement",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  stockManagementController.index
);

// CREATE
stockManagementRouter.post(
  "/stockManagement",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  stockManagementController.create
);

// GET ONE
stockManagementRouter.get(
  "/stockManagement/:id",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  stockManagementController.fetch
);

// UPDATE
stockManagementRouter.put(
  "/stockManagement/:id",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  stockManagementController.update
);

// DELETE
stockManagementRouter.delete(
  "/stockManagement/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  stockManagementController.delete
);

module.exports = stockManagementRouter;