const invoiceController = require("../controllers/invoice_controller");
const { isAuthenticated, authorizeRoles } = require("../middlewares/auth");

const invoiceRouter = require("express").Router();

// Create invoice
invoiceRouter.post(
  "/invoices",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  invoiceController.create
);

// Add payment to invoice
invoiceRouter.post(
  "/invoices/payment/:id",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  invoiceController.addPayment
);

// Save sale payment
invoiceRouter.post(
  "/sale_payments",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  invoiceController.savePayment
);

// Get invoice by ORDER ID
invoiceRouter.get(
  "/invoices/order/:orderId",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  invoiceController.fetchByOrder
);

// Get invoice by ID
invoiceRouter.get(
  "/invoices/:id",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  invoiceController.fetch
);

// Get all invoices
invoiceRouter.get(
  "/invoices",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  invoiceController.index
);

// Update invoice
invoiceRouter.put(
  "/invoices/:id",
  isAuthenticated,
  authorizeRoles("admin", "master", "manager"),
  invoiceController.update
);

// Delete invoice
invoiceRouter.delete(
  "/invoices/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  invoiceController.delete
);

module.exports = invoiceRouter;