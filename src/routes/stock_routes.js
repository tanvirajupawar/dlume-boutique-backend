const express = require("express");
const stockController = require("../controllers/stock_controller");
const { isAuthenticated, authorizeRoles } = require("../middlewares/auth");

const stockRouter = express.Router();

// GET ALL
stockRouter.get(
  "/stocks",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  stockController.index
);

// CREATE
stockRouter.post(
  "/stocks",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  stockController.create
);

// GET ONE
stockRouter.get(
  "/stocks/:id",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  stockController.fetch
);

// UPDATE
stockRouter.put(
  "/stocks/:id",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  stockController.update
);

// DELETE
stockRouter.delete(
  "/stocks/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  stockController.delete
);

module.exports = stockRouter;