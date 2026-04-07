const taskController = require("../controllers/task_controller");
const { isAuthenticated, authorizeRoles } = require("../middlewares/auth");

const taskRouter = require("express").Router();

// 🔥 SPECIFIC ROUTES FIRST

taskRouter.get(
  "/task/staff/:staffId",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  taskController.tasksByStaff
);

taskRouter.get(
  "/orderTask/:id/:userId",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  taskController.findByOrder
);

taskRouter.get(
  "/orderTask/:id",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  taskController.findByOrderId
);

taskRouter.get(
  "/orderTasklist/:id",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  taskController.findtask
);

// 🔥 GENERAL ROUTES

taskRouter.post(
  "/task",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  taskController.create
);

taskRouter.post(
  "/taskAssign",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  taskController.assign
);

taskRouter.post(
  "/taskStarted/:id",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  taskController.startTask
);

taskRouter.post(
  "/taskEnded/:id",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  taskController.endTask
);

taskRouter.post(
  "/taskPaused/:id",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  taskController.taskPaused
);

taskRouter.post(
  "/taskApp/:id",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  taskController.taskApp
);

taskRouter.post(
  "/taskDisapproved/:id",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  taskController.taskDisapproved
);

taskRouter.post(
  "/taskComplete/:id",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  taskController.completeTaskInstant
);

// 🔥 LIST + FETCH

taskRouter.get(
  "/task",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  taskController.index
);

// ⚠️ KEEP LAST
taskRouter.get(
  "/task/:id",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  taskController.fetch
);

// UPDATE
taskRouter.put(
  "/task/:id",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  taskController.update
);

// DELETE
taskRouter.delete(
  "/task/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  taskController.delete
);

module.exports = taskRouter;