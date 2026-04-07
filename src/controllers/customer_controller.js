const customerModel = require("../models/customer_model");
const mongoose = require("mongoose");
const XLSX = require("xlsx");

const getStoreObjectId = (storeId) => {
  if (!storeId) return null;

  // If already ObjectId → return as is
  if (storeId instanceof mongoose.Types.ObjectId) {
    return storeId;
  }

  // If string → convert
  if (mongoose.Types.ObjectId.isValid(storeId)) {
    return new mongoose.Types.ObjectId(storeId);
  }

  return null;
};

const customerController = {
  // Get all customers
index: async function (req, res) {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

const storeId = req.user?.storeId;

if (!storeId) {
  return res.status(401).json({
    success: false,
    message: "Unauthorized - storeId missing",
  });
}

const storeObjectId = getStoreObjectId(storeId);

if (!storeObjectId) {
  return res.status(400).json({
    success: false,
    message: "Invalid storeId format",
  });
}

const filter = {
  storeId: storeObjectId
};


if (search) {

  const regex = new RegExp(search, "i");

  filter.$or = [
    { first_name: regex },
    { last_name: regex },

    // FULL NAME SEARCH
    {
      $expr: {
        $regexMatch: {
          input: { $concat: ["$first_name", " ", "$last_name"] },
          regex: search,
          options: "i",
        },
      },
    },

    { contact_no_1: regex },
    { contact_no_2: regex },
  ];

}

    const customers = await customerModel.aggregate([
      { $match: filter },

      {
      $lookup: {
  from: "orders",
  let: { customerId: "$_id" },
  pipeline: [
    {
      $match: {
        $expr: {
          $and: [
            { $eq: ["$customer_id", "$$customerId"] },
{ $eq: ["$storeId", storeObjectId] }  ]
        }
      }
    }
  ],
  as: "orders",
},
      },

      {
        $addFields: {
          outstanding: {
            $sum: {
              $map: {
                input: "$orders",
                as: "order",
                in: {
                  $max: [
                    {
                    $subtract: [
 { $ifNull: ["$$order.total_amount", 0] },
  { $ifNull: ["$$order.paid_amount", 0] },
],
                    },
                    0,
                  ],
                },
              },
            },
          },
        },
      },

      {
$project: {
  first_name: 1,
  last_name: 1,
  email: 1,
  contact_no_1: 1,
  contact_no_2: 1,
  address_line_1: 1,
  address_line_2: 1,
  area: 1,
  city: 1,
  state: 1,
  country: 1,
  pincode: 1,
  care_of: 1,
  latest_measurements: 1,
  outstanding: 1,
  createdAt: 1   // 🔥 ADD THIS
},
      },

{ $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const total = await customerModel.countDocuments(filter);

    return res.json({
      success: true,
      data: customers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
},

  // Create a new customer
  create: async function (req, res) {
    try {
   const data = {
  ...req.body,
  storeId: req.user.storeId// 🔥 ADD THIS
};
      const customer = new customerModel(data);
      await customer.save();

      return res.json({
        success: true,
        data: customer,
        message: "Customer Created Successfully",
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

  // Get a single customer by ID
  fetch: async function (req, res) {
    try {
      const id = req.params.id;
    const customer = await customerModel.findOne({
  _id: id,
storeId: req.user.storeId
});

      if (!customer) {
        return res
          .status(404)
          .json({ success: false, message: "Customer not found" });
      }

      return res.json({ success: true, data: customer });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server Error",
        error: error.message || error,
      });
    }
  },

  // Update a customer
 // Update a customer (info + measurements)
update: async function (req, res) {
  try {
    const id = req.params.id;
    const updateData = req.body;

    // If measurements are sent separately, merge properly
    if (updateData.latest_measurements) {
      updateData.latest_measurements = {
        ...updateData.latest_measurements,
      };
    }

   const updatedCustomer = await customerModel.findOneAndUpdate(
  {
    _id: id,
    storeId: req.user.storeId
  },
  { $set: updateData },
  {
    new: true,
    runValidators: true,
  }
);

    if (!updatedCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.json({
      success: true,
      data: updatedCustomer,
      message: "Customer updated successfully",
    });

  } catch (error) {
    console.log("Update Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message || error,
    });
  }
},


  

  // Delete a customer
  delete: async function (req, res) {
    try {
      const id = req.params.id;

     const deletedCustomer = await customerModel.findOneAndDelete({
  _id: id,
  storeId: req.user.storeId
});

      if (!deletedCustomer) {
        return res
          .status(404)
          .json({ success: false, message: "Customer not found" });
      }

      return res.json({
        success: true,
        message: "Customer deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server Error",
        error: error.message || error,
      });
    }
  },

  importExcel: async function (req, res) {
    try {
       const workbook = XLSX.readFile("customer_tbl.xlsx");

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert Excel to JSON
        const data = XLSX.utils.sheet_to_json(sheet);

        const customers = data
        .filter((row) => row.cust_firstname_c && row.cust_firstname_c.trim() !== "")
        .map((row) => ({
          storeId: req.user.storeId,
          first_name: row.cust_firstname_c,
          last_name: row.cust_surname_c,
          // email: row.email,
          contact_no_1: row.cust_mobile_c,
          contact_no_2: row.cust_telephone_c,
          address_line_1: row.cust_add1_c,
          address_line_2: row.cust_add2_c,
          area: row.cust_add3_c,
          city: row.cust_city_c,
          state: row.cust_state_c,
          country: row.cust_country_c,
          pincode: row.cust_pin_c,
          // care_of: row.care_of,

latest_measurements: {
  head: row.cust_head_n?.toString() || "",

  // 🔹 Upper Body
  shoulder: (row.cust_shoulder_len_c_b ?? row.cust_shoulder_len_c)?.toString() || "",
  arm_length: (row.cust_arms_len_c_b ?? row.cust_arms_len_c)?.toString() || "",
  sleeves_length: (row.cust_sleeves_len_c_b ?? row.cust_sleeves_len_c)?.toString() || "",
  armhole: "", // no old data
  biceps: "", // no old data

  neck_size: (row.cust_neck_size_c_b ?? row.cust_neck_size_c)?.toString() || "",
  back_neck: "", // new field
  upper_chest: "", // new field

  chest: (row.cust_chest_size_c_b ?? row.cust_chest_size_c)?.toString() || "",

  waist: (row.cust_waist_size_c_b ?? row.cust_waist_size_c)?.toString() || "",
  waist_2: "", // new field

  hip: (row.cust_hip_size_c_b ?? row.cust_hip_size_c)?.toString() || "",

  top_length: (row.cust_top_len_c_b ?? row.cust_top_len_c)?.toString() || "",

  tucks: (row.cust_tucks_size_c_b ?? row.cust_tucks_size_c)?.toString() || "",

  // 🔹 Lower Body
  pant_length: (row.cust_pant_len_c_b ?? row.cust_pant_len_c)?.toString() || "",
  plazo_length: "", // new
  pyjama_length: "", // new
  salwar_length: (row.cust_salwar_len_c_b ?? row.cust_salwar_len_c)?.toString() || "",

  round_up_1: "",
  round_up_2: "",
  round_up_3: "",
  main_round_up: "",

  // 🔹 Other
  aster: (row.cust_aster_b ?? row.cust_aster)?.toString() || "",
  dupatta: (row.cust_dupatta_b ?? row.cust_dupatta)?.toString() || "",
}
        }));

        await customerModel.insertMany(customers);

        console.log("✅ Excel data imported successfully");
      
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: "Server Error",
        error: error.message || error,
      });
    }
  },
};

module.exports = customerController;
