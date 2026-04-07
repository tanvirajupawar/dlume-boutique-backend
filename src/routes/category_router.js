const categoryController = require("../controllers/category_controller");
const { isAuthenticated, authorizeRoles } = require("../middlewares/auth");

const categoryRouter = require("express").Router();

categoryRouter.post(
  "/category",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  categoryController.createCategory
);

categoryRouter.get(
  "/category",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  categoryController.fetchCategories
);

categoryRouter.get(
  "/category/:id",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  categoryController.fetchCategory
);

module.exports = categoryRouter;