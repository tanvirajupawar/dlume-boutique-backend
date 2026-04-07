const express = require("express");
const staffController = require("../controllers/staff_controller");
const { isAuthenticated, authorizeRoles } = require("../middlewares/auth");

const staffRouter = express.Router();

// GET ALL STAFF
staffRouter.get(
  "/staff",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  staffController.index
);

// CREATE
staffRouter.post(
  "/staff",
  isAuthenticated,
  authorizeRoles("admin"),
  staffController.create
);

// GET ONE
staffRouter.get(
  "/staff",
  isAuthenticated,
  authorizeRoles("admin", "master"),
  staffController.index
);

// UPDATE
staffRouter.get(
  "/staff/:id",
  isAuthenticated,
  authorizeRoles("admin", "master"),
  staffController.fetch
);

// DELETE
staffRouter.delete(
  "/staff/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  staffController.delete
);

module.exports = staffRouter;