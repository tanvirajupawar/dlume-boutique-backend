const serviceModel = require("../models/service_model");

const serviceController = {
  // Get all services (paginated + search)
  index: async function (req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const search = req.query.search || "";

const storeId = req.user.storeId;

const filter = { storeId };

if (search) {
  filter.$or = [
    { name: { $regex: search, $options: "i" } },
    { category: { $regex: search, $options: "i" } },
  ];
}     

      const total = await serviceModel.countDocuments(filter);
      const services = await serviceModel
        .find(filter)
        .populate("company_id")
        .skip(skip)
        .limit(limit);

      return res.json({
        success: true,
        data: services,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server Error",
        error: error.message || error,
      });
    }
  },

  // Create service
  create: async function (req, res) {
    try {
 const storeId = req.user.storeId;

const service = new serviceModel({
  ...req.body,
  storeId
});
      await service.save();

      return res.json({
        success: true,
        data: service,
        message: "Service created successfully",
      });
    } catch (error) {
        console.log(error);
      return res.status(500).json({
        success: false,
        message: "Server Error",
        error: error.message || error,
      });
    }
  },

  // Get service by ID
  fetch: async function (req, res) {
    try {
      const id = req.params.id;
   const storeId = req.user.storeId;

const service = await serviceModel.findOne({
  _id: id,
  storeId
}).populate("company_id");

      if (!service) {
        return res
          .status(404)
          .json({ success: false, message: "Service not found" });
      }

      return res.json({ success: true, data: service });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server Error",
        error: error.message || error,
      });
    }
  },

  // Update service
  update: async function (req, res) {
    try {
      const id = req.params.id;
      const updateData = req.body;

   const storeId = req.user.storeId;

const updatedService = await serviceModel.findOneAndUpdate(
  { _id: id, storeId },
  updateData,
  { new: true, runValidators: true }
);

      if (!updatedService) {
        return res
          .status(404)
          .json({ success: false, message: "Service not found" });
      }

      return res.json({ success: true, data: updatedService });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server Error",
        error: error.message || error,
      });
    }
  },



  // Delete service
  delete: async function (req, res) {
    try {
      const id = req.params.id;
const storeId = req.user.storeId;

const deletedService = await serviceModel.findOneAndDelete({
  _id: id,
  storeId
});
      if (!deletedService) {
        return res
          .status(404)
          .json({ success: false, message: "Service not found" });
      }

      return res.json({
        success: true,
        message: "Service deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server Error",
        error: error.message || error,
      });
    }
  },
};

module.exports = serviceController;
