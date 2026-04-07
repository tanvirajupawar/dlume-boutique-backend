const StockManagementModel = require("../models/stock_management_model");
const StockModel = require("../models/stock_model");

const stockController = {
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

      const total = await StockModel.countDocuments(filter);
      const stocks = await StockModel
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

const stock = new StockModel({
  ...req.body,
  storeId
});
      const width = parseInt(stock.width) || 0;
      const height = parseInt(stock.height) || 0;
      const qty = parseInt(stock.stock) || 0;

      stock.sqft = width * height * qty;
      await stock.save();

   const existingStock = await StockManagementModel.findOne({
  service_id: stock.service_id,
  storeId,
  width: stock.width,
});

      if (existingStock) {
        const newQty = parseFloat(existingStock.in || 0) + parseFloat(stock.sqft || 0);
        const newTotal = parseFloat(existingStock.total_stock || 0) + parseFloat(stock.sqft || 0);

        existingStock.in = newQty;
        existingStock.rate = stock.rate;
        existingStock.total_stock = newTotal;
        await existingStock.save();
      } else {
        // If not exists, create new one
        const stckmanagement = new StockManagementModel({
          service_id: stock.service_id,
        storeId,
          width: stock.width,
          in: stock.sqft,
          rate: stock.rate,
          total_stock: stock.sqft,
        });
        await stckmanagement.save();
      }

    
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

const stock = await StockModel.findOne({
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

const updatedStock = await StockModel.findOneAndUpdate(
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

 

  // Delete stock
  delete: async function (req, res) {
    try {
      const id = req.params.id;
  const storeId = req.user.storeId;

const stock = await StockModel.findOne({
  _id: id,
  storeId
});
      const deletedStock = await StockModel.findOneAndDelete({
  _id: id,
  storeId
});


const StockManagement = await StockManagementModel.findOne({
  service_id: stock.service_id,
  storeId,
  width: stock.width,
});

      if (!StockManagement) return;

      StockManagement.in = parseFloat(StockManagement.in || 0) - stock.sqft;
      StockManagement.total_stock = parseFloat(StockManagement.total_stock || 0) - stock.sqft;

      // Optionally delete the whole document if stock is 0 or negative
      if (StockManagement.total_stock <= 0) {
await StockManagementModel.deleteOne({
  _id: StockManagement._id,
  storeId
});      } else {
        await StockManagement.save();
      }

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

module.exports = stockController;
