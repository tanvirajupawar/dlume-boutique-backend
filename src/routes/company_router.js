const companyControler = require("../controllers/company_controller");
const { isAuthenticated, authorizeRoles } = require("../middlewares/auth");

const companyRouter = require("express").Router();

companyRouter.get(
  "/company",
  isAuthenticated,
  authorizeRoles("admin"),
  companyControler.index
);

companyRouter.post(
  "/company",
  isAuthenticated,
  authorizeRoles("admin"),
  companyControler.create
);

companyRouter.get(
  "/company/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  companyControler.fetch
);

companyRouter.put(
  "/company/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  companyControler.update
);

companyRouter.delete(
  "/company/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  companyControler.delete
);

module.exports = companyRouter;