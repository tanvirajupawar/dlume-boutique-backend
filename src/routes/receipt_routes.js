const receiptController = require("../controllers/receipt_controller");
const { isAuthenticated, authorizeRoles } = require("../middlewares/auth");

const receiptRouter = require("express").Router();

receiptRouter.post(
  "/receipt",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  receiptController.create
);

receiptRouter.get(
  "/receipt/:id",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  receiptController.fetch
);

receiptRouter.get(
  "/receipt",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  receiptController.index
);

receiptRouter.put(
  "/receipt/:id",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  receiptController.update
);

receiptRouter.delete(
  "/receipt/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  receiptController.delete
);

module.exports = receiptRouter;