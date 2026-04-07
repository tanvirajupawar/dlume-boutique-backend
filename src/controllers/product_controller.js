const productModel = require("../models/product_model");




const productControler = {
    createProduct: async function (req, res) {
        try {
               const storeId = req.user.storeId;

const product = new productModel({
    ...req.body,
    storeId
});
                await product.save();

                return res.json({ success: true, data:product, message: "Product Created Successfully"});  
            
        } catch (error) {
             return res.status(500).json({
                success: false,
                message: "Server Error",
                error: error.message || error
            });
            
        }
        
    },

    fetchProducts: async function (req, res) {
        try {
const storeId = req.user.storeId;

const products = await productModel.find({ storeId });
                return res.json({ success: true, data:products});  
            
        } catch (error) {
             return res.status(500).json({
                success: false,
                message: "Server Error",
                error: error.message || error
            });
            
        }
        
    },

    fetchProduct: async function (req, res) {
        try {
            const id = req.params.id;
const storeId = req.user.storeId;

const product = await productModel.findOne({
    _id: id,
    storeId
});
            return res.json({ success: true, data:product});  
            
        } catch (error) {
             return res.status(500).json({
                success: false,
                message: "Server Error",
                error: error.message || error
            });
            
        }
        
    },

    fetchByCategory: async function (req, res) {
        try {
            const id = req.params.id;
const storeId = req.user.storeId;

const products = await productModel.find({
    category_id: id,
    storeId
});
            return res.json({ success: true, data:products});  
            
        } catch (error) {
             return res.status(500).json({
                success: false,
                message: "Server Error",
                error: error.message || error
            });
            
        }
        
    },
}

module.exports =  productControler;