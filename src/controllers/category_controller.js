const categoryModel = require("../models/category_model");

const categoryController = {

  // 🔥 CREATE CATEGORY
  createCategory: async function (req, res) {
    try {
      const data = {
        ...req.body,
        storeId: req.storeId // 🔥 IMPORTANT
      };

      const category = new categoryModel(data);
      await category.save();

      return res.json({
        success: true,
        data: category,
        message: "Category Created Successfully"
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server Error",
        error: error.message || error
      });
    }
  },


  // 🔥 FETCH ALL (FILTERED)
  fetchCategories: async function (req, res) {
    try {
      const categories = await categoryModel.find({
        storeId: req.storeId // 🔥 IMPORTANT
      });

      return res.json({
        success: true,
        data: categories
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server Error",
        error: error.message || error
      });
    }
  },


  // 🔥 FETCH SINGLE (SAFE)
  fetchCategory: async function (req, res) {
    try {
      const id = req.params.id;

      const category = await categoryModel.findOne({
        _id: id,
        storeId: req.storeId // 🔥 IMPORTANT
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found"
        });
      }

      return res.json({
        success: true,
        data: category
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server Error",
        error: error.message || error
      });
    }
  }

};

module.exports = categoryController;