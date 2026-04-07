const productController = require("../controllers/product_controller");
const { isAuthenticated, authorizeRoles } = require("../middlewares/auth");

const productRouter = require("express").Router();

// 🔥 Specific route FIRST
productRouter.get(
  "/product/category/:id",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  productController.fetchByCategory
);

// Create
productRouter.post(
  "/product",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  productController.createProduct
);

// Get all
productRouter.get(
  "/product",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  productController.fetchProducts
);

// ⚠️ Dynamic LAST
productRouter.get(
  "/product/:id",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  productController.fetchProduct
);

module.exports = productRouter;