const StockManagementModel = require("../models/stock_management_model");


const stockManagementController = {
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

      const total = await StockManagementModel.countDocuments(filter);
      const stocks = await StockManagementModel
        .find(filter)
        .populate("company_id")
        .skip(skip)
        .limit(limit);

      return res.json({
        success: true,
        data: stocks,
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

  // Create stock
  create: async function (req, res) {
    try {
 const storeId = req.user.storeId;

const stock = new StockManagementModel({
  ...req.body,
  storeId
});
      await stock.save();

      return res.json({
        success: true,
        data: stock,
        message: "Stock created successfully",
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

  // Get stock by ID
  fetch: async function (req, res) {
    try {
      const id = req.params.id;
   const storeId = req.user.storeId;

const stock = await StockManagementModel.findOne({
  _id: id,
  storeId
}).populate("company_id");

      if (!stock) {
        return res
          .status(404)
          .json({ success: false, message: "Stock not found" });
      }

      return res.json({ success: true, data: stock });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server Error",
        error: error.message || error,
      });
    }
  },

  // Update stock
  update: async function (req, res) {
    try {
      const id = req.params.id;
      const updateData = req.body;

    const storeId = req.user.storeId;

const updatedStock = await StockManagementModel.findOneAndUpdate(
  { _id: id, storeId },
  updateData,
  { new: true, runValidators: true }
);

      if (!updatedStock) {
        return res
          .status(404)
          .json({ success: false, message: "Stock not found" });
      }

      return res.json({ success: true, data: updatedStock });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server Error",
        error: error.message || error,
      });
    }
  },



  fetchRate: async function (req, res) {
    try {
const storeId = req.user.storeId;

const stock = await StockManagementModel.findOne({
  service_id: req.params.service_id,
  width: req.params.width,
  storeId
});

      return res.json({
        success: true,
        data: stock,       
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server Error",
        error: error.message || error,
      });
    }
  },

  // Delete stock
  delete: async function (req, res) {
    try {
      const id = req.params.id;
const storeId = req.user.storeId;

const deletedStock = await StockManagementModel.findOneAndDelete({
  _id: id,
  storeId
});
      if (!deletedStock) {
        return res
          .status(404)
          .json({ success: false, message: "stock not found" });
      }

      return res.json({
        success: true,
        message: "stock deleted successfully",
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

module.exports = stockManagementController;
