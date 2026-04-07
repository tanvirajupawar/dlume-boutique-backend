const StaffModel = require("../models/staff_model");
const UserModel = require("../models/user_model");

const staffController = {
  // GET /staff?search=vinod&page=2&limit=10
  index: async function (req, res) {
    try {
      const { search = "", page = 1, limit = 50 } = req.query;
const storeId = req.user?.storeId;

if (!storeId) {
  return res.status(401).json({
    success: false,
    message: "Unauthorized - storeId missing",
  });
}
const query = {
  storeId,
  $or: [
    { first_name: { $regex: search, $options: "i" } },
    { last_name: { $regex: search, $options: "i" } },
  ],
};

      const staffList = await StaffModel.find(query)
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const total = await StaffModel.countDocuments(query);

      return res.json({
        success: true,
        data: staffList,
        total,
        page: parseInt(page),
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

create: async function (req, res) {
  try {
    const data = req.body;

    let user = null;

    // 🔥 Only create login IF password is provided
    if (data.password && data.password.trim() !== "") {

      // Check if user already exists
      const existingUser = await UserModel.findOne({
        email: data.contact_no_1,
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User with this mobile number already exists",
        });
      }

      // Create login
      user = new UserModel({
        fullName: `${data.first_name} ${data.last_name}`,
        email: data.contact_no_1,
        password: data.password,
        phoneNumber: data.contact_no_1,
        role: "staff",
      });

      await user.save();
    }

    // ✅ Create staff (login optional)
const storeId = req.user.storeId;

const staff = new StaffModel({
  storeId, // 🔥 ADD THIS
  first_name: data.first_name,
      last_name: data.last_name,
      email: data.email || "",
      contact_no_1: data.contact_no_1,
      contact_no_2: data.contact_no_2 || "",
      address_line_1: data.address_line_1 || "",
      address_line_2: data.address_line_2 || "",
      city: data.city || "",
      state: data.state || "",
      pincode: data.pincode || "",
      designation: data.designation || "",
user_id: data.user_id || (user ? user._id : null),    });

    await staff.save();

    return res.json({
      success: true,
      data: staff,
      message: user
        ? "Staff and login created successfully"
        : "Staff created successfully (no login)",
    });

  } catch (error) {
    console.error("Create Staff Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message || error,
    });
  }
},


  // Get staff by ID
  fetch: async function (req, res) {
    try {
      const id = req.params.id;
const storeId = req.user.storeId;

const staff = await StaffModel.findOne({
  _id: id,
  storeId
});
      return res.json({ success: true, data: staff });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server Error",
        error: error.message || error,
      });
    }
  },

  // Update staff by ID
  update: async function (req, res) {
    try {
      const id = req.params.id;
      const updateData = req.body;

  const storeId = req.user.storeId;

const updatedStaff = await StaffModel.findOneAndUpdate(
  { _id: id, storeId },
  updateData,
  { new: true, runValidators: true }
);

      if (!updatedStaff) {
        return res
          .status(404)
          .json({ success: false, message: "Staff not found" });
      }

      return res.json({ success: true, data: updatedStaff });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server Error",
        error: error.message || error,
      });
    }
  },

  // Delete staff by ID
  delete: async function (req, res) {
    try {
      const id = req.params.id;

const storeId = req.user.storeId;

const deletedStaff = await StaffModel.findOneAndDelete({
  _id: id,
  storeId
});
      if (!deletedStaff) {
        return res
          .status(404)
          .json({ success: false, message: "Staff not found" });
      }

      return res.json({
        success: true,
        message: "Staff deleted successfully",
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

module.exports = staffController;
