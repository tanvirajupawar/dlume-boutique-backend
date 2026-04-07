const UserModel = require("../models/user_model");
const StaffModel = require("../models/staff_model");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const UserController = {

  // 🔹 CREATE ACCOUNT
createAccount: async function (req, res) {
  try {
    const { email, password, ...rest } = req.body;

 const storeId = req.user?.storeId || req.body.storeId;

const existingUser = await UserModel.findOne({
  email,
  storeId
});
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    //  DO NOT HASH HERE
 const newUser = new UserModel({
  email,
  password,
  ...rest,
  storeId
});

    await newUser.save();

    return res.json({
      success: true,
      data: newUser,
      message: "User Created Successfully",
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message || err,
    });
  }
},


 
signIn: async function (req, res) {
  try {
    const { email, password } = req.body;

    // 🔥 FIND USER WITHOUT storeId
    const user = await UserModel.findOne({
      $or: [
        { email: email },
        { contact_no_1: email }
      ]
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User Not Found",
      });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password);

    if (!passwordMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect Password",
      });
    }

    // 🔥 TOKEN (contains storeId internally)
    const token = user.SignAccessToken();

    // 🔥 MASTER LOGIN
    if (user.role === "master") {
      const staff = await StaffModel.findOne({
        user_id: user._id,
        storeId: user.storeId // ✅ FIXED
      });

      if (!staff) {
        return res.status(400).json({
          success: false,
          message: "Master staff record not found",
        });
      }

      return res.json({
        success: true,
        message: "Login Successful",
        token,
        role: "master",
        staffId: staff._id,
        user: {
          _id: staff._id,
          first_name: staff.first_name,
          last_name: staff.last_name,
          email: staff.email,
          contact_no: staff.contact_no_1,
          designation: staff.designation,
          storeId: user.storeId,
        },
      });
    }

    // 🔥 ADMIN / MANAGER
    return res.json({
      success: true,
      message: "Login Successful",
      token,
      role: user.role,
      staffId: null,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        storeId: user.storeId,
      },
    });

  } catch (error) {
    console.log("❌ LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
},

  // 🔹 SAVE FCM TOKEN
  fcmToken: async function (req, res) {
    try {
      const { userId, fcmToken } = req.body;

     const storeId = req.user.storeId;

await UserModel.findOneAndUpdate(
  { _id: userId, storeId },
  { fcmToken }
);

      res.json({ success: true, message: "FCM token saved" });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
};

module.exports = UserController;
