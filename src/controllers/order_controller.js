const mongoose = require("mongoose");
const dayjs = require('dayjs');
const orderImport = require("../models/order_model");

console.log("ORDER IMPORT:", orderImport);
console.log("TYPE:", typeof orderImport);
console.log("HAS CREATE:", orderImport?.create);



const OrderModel = orderImport;


const InvoiceModel = require("../models/invoice_model");
const InvoiceDetailsModel = require("../models/invoice_details_model");
const StockManagementModel = require("../models/stock_management_model");
const customerModel = require("../models/customer_model");
const TaskModel = require("../models/task_model");
const ReceiptModel = require("../models/receipt_model");
const OrderDetailModel = require("../models/order_details_model");



const getStoreObjectId = (storeId) => {
  if (!storeId) return null;

  if (storeId instanceof mongoose.Types.ObjectId) {
    return storeId;
  }

  if (mongoose.Types.ObjectId.isValid(storeId)) {
    return new mongoose.Types.ObjectId(storeId);
  }

  return null;
};
// ===============================
// AUTO UPDATE ORDER STATUS
// ===============================
const updateOrderStatus = async (orderId, storeId) => {
const storeObjectId = getStoreObjectId(storeId);

if (!storeObjectId) return;

const tasks = await TaskModel.find({
  order_id: orderId,
  storeId: storeObjectId
});
  if (!tasks.length) return;

  const total = tasks.length;

  const approvedTasks = tasks.filter(
    (t) => t.status && t.status.toLowerCase() === "approved"
  ).length;

  const completedTasks = tasks.filter(
    (t) =>
      t.status &&
      ["completed", "approved"].includes(t.status.toLowerCase())
  ).length;

  let status = "Pending";

  if (approvedTasks === total) {
    status = "Approved";
  } else if (completedTasks === total) {
    status = "Completed";
  } else if (completedTasks > 0) {
    status = "In Progress";
  }

await OrderModel.updateOne(
  { _id: orderId, storeId: storeObjectId },
  { order_status: status }
);
};


const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_SECRET_KEY,
});


const uploadToCloudinary = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "orders",
    });
    return result.secure_url;
  } catch (err) {
    console.log("Cloudinary upload error:", err);
    return null;
  }
};

const saveBase64Image = (base64String, folder = "designs") => {
  try {
    const matches = base64String.match(/^data:image\/png;base64,(.+)$/);
    if (!matches) return null;

    const buffer = Buffer.from(matches[1], "base64");

    const uploadDir = path.join(__dirname, "../../uploads", folder);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `design_${Date.now()}.png`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, buffer);

    return `/uploads/${folder}/${fileName}`;
  } catch (err) {
    console.log("Base64 save error:", err);
    return null;
  }
};



const orderController = {
 

getNextOrderNumber: async (req, res) => {
  try {
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
    message: "Invalid storeId",
  });
}

const lastOrder = await OrderModel.findOne({
  storeId: storeObjectId
})
  .sort({ order_no: -1 })
  .select("order_no");
    let nextNumber = 1;

 if (lastOrder && lastOrder.order_no) {
  const num = parseInt(lastOrder.order_no.replace("O-", ""));

  if (!isNaN(num)) {
    nextNumber = num + 1;
  }
}

    const nextOrderNo = `O-${String(nextNumber).padStart(5, "0")}`;

    res.json({
      success: true,
      nextOrderNo,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
},

  
create: async (req, res) => {
const storeId = req.user?.storeId;

if (!storeId) {
  return res.status(401).json({
    success: false,
    message: "Unauthorized - storeId missing",
  });
}  try {

// ===============================
// ALWAYS PARSE GARMENTS (FormData fix)
// ===============================

if (typeof req.body.garments === "string") {
  req.body.garments = JSON.parse(req.body.garments);
}
// 🔥 FORCE FIX extraWork STRING ISSUE
if (Array.isArray(req.body.garments)) {
  req.body.garments = req.body.garments.map(g => {

    let fixedExtraWork = [];

    if (typeof g.extraWork === "string") {
      try {
        fixedExtraWork = JSON.parse(g.extraWork);
      } catch (e) {
        fixedExtraWork = [];
      }
    } else if (Array.isArray(g.extraWork)) {
      fixedExtraWork = g.extraWork;
    }

    return {
      ...g,
      extraWork: fixedExtraWork.map(w => ({
        name: w.name,
        amount: Number(w.amount || 0),
      })),
    };
  });
}







// ===============================
// HANDLE IMAGE UPLOAD (CLOUDINARY)
// ===============================

const clothImages = req.files?.clothImages || [];
const designImages = req.files?.designImages || [];

const clothIndexes = [].concat(req.body.clothImageIndexes || []).map(Number);
const designIndexes = [].concat(req.body.designImageIndexes || []).map(Number);

// ✅ Set images to null for now — upload in background after response
if (Array.isArray(req.body.garments)) {
  req.body.garments = req.body.garments.map(g => ({
    ...g,
    clothImage: null,
    designImage: null,
  }));
}
    const tasks = []; 
const storeObjectId = getStoreObjectId(storeId);

const customer = await customerModel.findOne({
  _id: req.body.customer_id,
  storeId: storeObjectId
});
if (!customer) {
  return res.status(404).json({
    success: false,
    message: "Customer not found",
  });
}
    



// ✅ Generate tasks based on order type + extra work

if (Array.isArray(req.body.garments)) {
  req.body.garments.forEach((garment, index) => {

    if (garment.orderType === "HW") {
      tasks.push({ 
        work_name: `Garment ${index + 1} - Hand Work`,
        status: "Pending",
        garment_index: index
      });
    }

    if (garment.orderType === "MW") {
      tasks.push({ 
        work_name: `Garment ${index + 1} - Machine Work`,
        status: "Pending",
        garment_index: index
      });
    }

    if (garment.orderType === "HP") {
      tasks.push({ 
        work_name: `Garment ${index + 1} - Hand Painting`,
        status: "Pending",
        garment_index: index
      });
    }

    if (garment.orderType === "Others") {
      tasks.push({ 
        work_name: `Garment ${index + 1} - Other Work`,
        status: "Pending",
        garment_index: index
      });
    }

    if (Array.isArray(garment.extraWork)) {
    garment.extraWork.forEach((work) => {
  tasks.push({
    work_name: `Garment ${index + 1} - ${work.name}`,
    status: "Pending",
    garment_index: index
  });
});
    }
  });
}






const orderData = {
  ...req.body,
 storeId: storeObjectId,
  customer_id: customer._id,
  contact_no_1: req.body.contact_no_1,
  contact_no_2: req.body.contact_no_2,
  tasks,
};

console.log("OrderModel FULL:", OrderModel);
console.log("Is Function:", typeof OrderModel);
console.log("Has create:", OrderModel && OrderModel.create);


// 🔥 Convert garment deliveryDate to proper Date
if (orderData.garments && Array.isArray(orderData.garments)) {
  orderData.garments = orderData.garments.map(g => {
    let formattedDate = null;

    if (g.deliveryDate) {
      const [day, month, year] = g.deliveryDate.split("/");
      formattedDate = new Date(`${year}-${month}-${day}`);
    }

    return {
      ...g,

      // 🔥 KEEP designImage SAFE
      designImage: g.designImage || null,

      deliveryDate: formattedDate,
      price: Number(g.price || 0),

measurements: g.measurements
  ? Object.fromEntries(
      Object.entries(g.measurements).map(([key, value]) => [
        key,
        value === null || value === "" ? "" : value.toString(),
      ])
    )
  : {}
    };
  });
}







// ✅ THEN create order
let order;

for (let i = 0; i < 3; i++) {
  try {
    order = await OrderModel.create(orderData);
    break;
  } catch (err) {
  console.log("🔥 CREATE ERROR FULL:", err);
  console.log("🔥 CREATE ERROR MESSAGE:", err.message);

  if (err.code === 11000) {

      // ✅ NO redeclaration here

      if (!storeObjectId) {
        throw new Error("Invalid storeId");
      }

      const lastOrder = await OrderModel.findOne({
        storeId: storeObjectId
      }).sort({ order_no: -1 });

  let nextNumber = 1;

if (lastOrder && lastOrder.order_no) {
  const num = parseInt(lastOrder.order_no.replace("O-", ""));

  if (!isNaN(num)) {
    nextNumber = num + 1;
  }
}

orderData.order_no = `O-${String(nextNumber).padStart(5, "0")}`;
    } else {
      throw err;
    }
  }
}
// 🔥 SAFETY CHECK (ADD THIS)
if (!order) {
  console.log("❌ Order creation failed after retries");

  return res.status(500).json({
    success: false,
    message: "Failed to create order",
  });
}

let subtotal = 0;

if (order.garments && Array.isArray(order.garments)) {
  order.garments.forEach(g => {
    const base = Number(g.price || 0);

    const extra = (g.extraWork || []).reduce(
      (sum, w) => sum + Number(w.amount || 0),
      0
    );

    subtotal += base + extra;
  });
}

const discount = Number(order.discount || 0);
const grandTotal = subtotal - discount;


// ===============================
// 🔥 HANDLE ADVANCE PAYMENT (AFTER grandTotal calculated)
// ===============================

const paidAmount = Number(req.body.received_amount || 0);
const totalAmount = grandTotal;

let status = "Unpaid";
if (paidAmount > 0) {

await ReceiptModel.create({
  storeId: storeObjectId,
    orders: [
      {
        order_id: order._id,
        applied_amount: paidAmount,
      },
    ],
    total_amount: paidAmount,
    payment_mode: req.body.payment_method || "Cash",
    receipt_date: new Date(),
  });

if (paidAmount >= totalAmount) {
  status = "Paid";
} else {
  status = "Partially Paid";
}
}

order.total = grandTotal;

order.initial_advance = paidAmount;
order.payment_status = status;
order.order_status = "Pending";

await order.save();

const invoice = await InvoiceModel.create({
storeId: storeObjectId,
  invoice_number: `INV-${Date.now()}`,
  order_id: order._id,
  client_id: order.customer_id,
  invoice_date: new Date(),

  discount,
  total_amount: grandTotal,
  paid_amount: paidAmount,

payment_status:
  paidAmount === 0
    ? "Unpaid"
    : paidAmount >= grandTotal
    ? "Paid"
    : "Partially Paid",


  garments: order.garments,
});



if (order.garments && order.garments.length > 0) {
  for (const garment of order.garments) {

    let stitching = 0;
    let work = 0;
    let lace = 0;
    let cloth = 0;

if (Array.isArray(garment.extraWork)) {
  garment.extraWork.forEach(item => {

    if (item.name === "Stitching")
      stitching += Number(item.amount || 0);

    if (item.name === "Work")
      work += Number(item.amount || 0);

    if (item.name === "Cloth")
      cloth += Number(item.amount || 0);

    if (item.name === "Lace")
      lace += Number(item.amount || 0);

  });
}

const total = stitching + work + lace + cloth;

await InvoiceDetailsModel.create({
  storeId: storeObjectId,
      invoice_id: invoice._id,
      order_id: order._id,
      description: garment.description || "Custom Garment",
      quantity: 1,
      stitching,
      work,
      cloth,
      lace,
      price: total,
      amount: total,
    });
  }
}




// ===============================
// CREATE TASK DOCUMENTS IN TASK MODEL
// ===============================
for (const t of tasks) {
  await TaskModel.create({
    order_id: order._id,
    name: t.work_name,
    status: "Pending",
    garment_index: t.garment_index, 
    assigned_staff_1: null,
    assigned_at: null,
  });
}
await updateOrderStatus(order._id, storeId);



if (req.body.measurements) {

  const m = req.body.measurements;

  if (!customer.latest_measurements) {
    customer.latest_measurements = {};
  }

customer.latest_measurements = {
  ...customer.latest_measurements,

  // 🔹 Upper Body
  shoulder: m.shoulder || customer.latest_measurements.shoulder || "",
  arm_length: m.arm_length || customer.latest_measurements.arm_length || "",
  sleeves_length: m.sleeves_length || customer.latest_measurements.sleeves_length || "",
  armhole: m.armhole || customer.latest_measurements.armhole || "",
  biceps: m.biceps || customer.latest_measurements.biceps || "",
  neck_size: m.neck_size || customer.latest_measurements.neck_size || "",
  back_neck: m.back_neck || customer.latest_measurements.back_neck || "",
  upper_chest: m.upper_chest || customer.latest_measurements.upper_chest || "",
  chest: m.chest || customer.latest_measurements.chest || "",
  waist: m.waist || customer.latest_measurements.waist || "",
  waist_2: m.waist_2 || customer.latest_measurements.waist_2 || "",
  hip: m.hip || customer.latest_measurements.hip || "",
  top_length: m.top_length || customer.latest_measurements.top_length || "",
  tucks: m.tucks || customer.latest_measurements.tucks || "",

  // 🔹 Lower Body
  pant_length: m.pant_length || customer.latest_measurements.pant_length || "",
  plazo_length: m.plazo_length || customer.latest_measurements.plazo_length || "",
  pyjama_length: m.pyjama_length || customer.latest_measurements.pyjama_length || "",
  salwar_length: m.salwar_length || customer.latest_measurements.salwar_length || "",
  round_up_1: m.round_up_1 || customer.latest_measurements.round_up_1 || "",
  round_up_2: m.round_up_2 || customer.latest_measurements.round_up_2 || "",
  round_up_3: m.round_up_3 || customer.latest_measurements.round_up_3 || "",
  main_round_up: m.main_round_up || customer.latest_measurements.main_round_up || "",

  // 🔹 Other
  aster: m.aster || customer.latest_measurements.aster || "",
  dupatta: m.dupatta || customer.latest_measurements.dupatta || "",
};

}



    // Update outstanding
 customer.outstanding =
  Number(customer.outstanding || 0) +
  (totalAmount - paidAmount);

    await customer.save();
console.log("🔥 GARMENT IMAGES:", JSON.stringify(order.garments.map(g => ({
  clothImage: g.clothImage,
  designImage: g.designImage
})), null, 2));
// ✅ Respond immediately
res.status(200).json({
  success: true,
  message: "Order created successfully",
  data: order,
});

// ✅ Upload images in background
setImmediate(async () => {
  try {
    if (!clothImages.length && !designImages.length) return;

    const updatedGarments = order.garments.map(g => ({ ...g.toObject() }));

    await Promise.all(
      updatedGarments.map(async (g, index) => {
        const clothFileIdx = clothIndexes.indexOf(index);
        const designFileIdx = designIndexes.indexOf(index);

        const clothFile = clothFileIdx !== -1 ? clothImages[clothFileIdx] : null;
        const designFile = designFileIdx !== -1 ? designImages[designFileIdx] : null;

        const [clothUrl, designUrl] = await Promise.all([
          clothFile ? uploadToCloudinary(clothFile.path).then(url => {
            try { fs.unlinkSync(clothFile.path); } catch(e) {}
            return url;
          }) : Promise.resolve(null),
          designFile ? uploadToCloudinary(designFile.path).then(url => {
            try { fs.unlinkSync(designFile.path); } catch(e) {}
            return url;
          }) : Promise.resolve(null),
        ]);

        if (clothUrl) updatedGarments[index].clothImage = clothUrl;
        if (designUrl) updatedGarments[index].designImage = designUrl;
      })
    );

await OrderModel.findByIdAndUpdate(order._id, {
      garments: updatedGarments,
    });

    // ✅ FIX: Also update Invoice with real image URLs
const relatedInvoice = await InvoiceModel.findOne({
  order_id: order._id,
  storeId: storeObjectId
});   if (relatedInvoice) {
      const invoiceGarments = relatedInvoice.garments.map((g, i) => ({
        ...g,
        clothImage: updatedGarments[i]?.clothImage || g.clothImage || null,
        designImage: updatedGarments[i]?.designImage || g.designImage || null,
      }));

      await InvoiceModel.findByIdAndUpdate(relatedInvoice._id, {
        garments: invoiceGarments,
      });

      console.log("✅ Invoice garments updated with image URLs");
    }

    console.log("✅ Background images uploaded for order:", order._id);
  } catch (err) {
    console.log("❌ Background upload error:", err.message);
  }
});



  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
},



  createOrder:  async (req, res) => {
const storeId = req.user?.storeId;

if (!storeId) {
  return res.status(401).json({
    success: false,
    message: "Unauthorized - storeId missing",
  });
}    try {
      const data = req.body;
      data.order_date = dayjs().format('YYYY-MM-DD');

      if (!data.total) {
        return res.status(422).json({
          success: false,
          message: 'Validation failed.',
          errors: { total: ['The total field is required.'] },
        });
      }

      // Save the order
const storeObjectId = getStoreObjectId(storeId);

const order = await OrderModel.create({
  ...data,
  storeId: storeObjectId
});


const orders = await OrderModel.find({
  invoice: 0,
  storeId: storeObjectId
});

      // Prepare invoice data
      const invoiceData = {
        client_id: orders[0]?.customer_id || null,
        invoice_date: dayjs().format('YYYY-MM-DD'),
        total_amount: orders.reduce((sum, order) => sum + Number(order.total), 0),
        discount: 0,
        payment_status: 'Unpaid',
      };

    const invoice = await InvoiceModel.create({
  ...invoiceData,
  storeId
});

      // Process each order for invoice details and WhatsApp messaging
      for (const order of orders) {
        console.log(order);
     // 🔥 CREATE INVOICE DETAILS PER GARMENT
if (order.garments && Array.isArray(order.garments)) {

  for (let i = 0; i < order.garments.length; i++) {
    const garment = order.garments[i];

    let stitching = 0;
    let work = 0;
    let cloth = 0;
    let lace = 0;

    if (garment.workItems && Array.isArray(garment.workItems)) {
      garment.workItems.forEach(item => {
        stitching += Number(item.stitching || 0);
        work += Number(item.work || 0);
        cloth += Number(item.cloth || 0);
        lace += Number(item.lace || 0);
      });
    }

    const garmentTotal = Number(garment.price || 0);

const storeObjectId = getStoreObjectId(storeId);

if (!storeObjectId) {
  return res.status(400).json({
    success: false,
    message: "Invalid storeId",
  });
}

await InvoiceDetailsModel.create({
storeId: storeObjectId,
  invoice_id: invoice._id,
  order_id: order._id,
  description: garment.orderType || "Custom Garment",
  quantity: 1,

  stitching,
  work,
  cloth,
  lace,

  total,         
  price: total,
  amount: total,
});

  }
}


        // Mark order as invoiced
        order.invoice = 1;
        await order.save();

      
      }

      const customer = await customerModel.findById(invoice.client_id);
req.io.emit("orderCreated");
      return res.status(200).json({
        success: true,
        message: 'Order created successfully.',
        data: orders,
        invoice,
        customer,
      });

    } catch (err) {
      console.error('Order creation error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to create Order.',
        error: err.message,
      });
    }
  },



  fetch: async (req, res) => {
const storeId = req.user?.storeId;

if (!storeId) {
  return res.status(401).json({
    success: false,
    message: "Unauthorized - storeId missing",
  });
}    try {
const storeObjectId = getStoreObjectId(storeId);

if (!storeObjectId) {
  return res.status(400).json({
    success: false,
    message: "Invalid storeId",
  });
}


const order = await OrderModel.findOne({
  _id: req.params.id,
  storeId: storeObjectId
})
        .populate("care_of customer_id");
      console.log(order);

      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }
      return res.json({ success: true, data: order });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  },

getByCustomer: async (req, res) => {
const storeId = req.user?.storeId;

if (!storeId) {
  return res.status(401).json({
    success: false,
    message: "Unauthorized - storeId missing",
  });
}  try {
const storeObjectId = getStoreObjectId(storeId);

if (!storeObjectId) {
  return res.status(400).json({
    success: false,
    message: "Invalid storeId",
  });
}

const orders = await OrderModel.find({
  customer_id: req.params.id,
  storeId: storeObjectId
}).populate("customer_id");

    return res.json({
      success: true,
      data: orders || []
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
},

index: async (req, res) => {
  try {
    const storeId = req.user?.storeId;

    if (!storeId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - storeId missing",
      });
    }
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const skip = (page - 1) * limit;
const storeObjectId = getStoreObjectId(storeId);

if (!storeObjectId) {
  return res.status(400).json({
    success: false,
    message: "Invalid storeId",
  });
}

const orders = await OrderModel.find({
  storeId: storeObjectId
})
.populate(
  "customer_id",
  "first_name last_name contact_no_1 contact_no_2"
)
.populate("assigned_master", "first_name last_name designation")
.sort({ createdAt: -1 })
.skip(skip)
.limit(limit);

const total = await OrderModel.countDocuments({
  storeId: storeObjectId
});
  return res.json({
        success: true,
        data: orders,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  },

  findByCompanyId: async (req, res) => {
const storeId = req.user?.storeId;

if (!storeId) {
  return res.status(401).json({
    success: false,
    message: "Unauthorized - storeId missing",
  });
}    try {
      const companyId = req.params.companyId;
      
      const page = parseInt(req.query.page) || 1;
      console.log("page");
      console.log(page);
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

const storeObjectId = getStoreObjectId(storeId);

if (!storeObjectId) {
  return res.status(400).json({
    success: false,
    message: "Invalid storeId",
  });
}

const orders = await OrderModel.find({
  storeId: storeObjectId
})
        .populate("client_id service_id")
        .skip(skip)
        .limit(limit);

const total = await OrderModel.countDocuments({
  storeId: storeObjectId
});
      return res.json({
        success: true,
        data: orders,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  },

update: async (req, res) => {
const storeId = req.user?.storeId;

if (!storeId) {
  return res.status(401).json({
    success: false,
    message: "Unauthorized - storeId missing",
  });
}  try {
    const orderId = req.params.id;

const storeObjectId = getStoreObjectId(storeId);

const order = await OrderModel.findOne({
  _id: orderId,
  storeId: storeObjectId
});

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // 🔥 UPDATE BASIC FIELDS
    Object.assign(order, req.body);

    // 🔥 HANDLE PAYMENT PROPERLY
    const paidAmount = Number(
  req.body.paid_amount ??
  req.body.received_amount ??
  0
);
    const totalAmount = Number(req.body.total || order.total || 0);

    let status = "Unpaid";

    if (paidAmount > 0) {
      await ReceiptModel.create({
      storeId: storeObjectId, 
        orders: [
          {
            order_id: order._id,
            applied_amount: paidAmount,
          },
        ],
        total_amount: paidAmount,
        payment_mode: req.body.payment_method || "Cash",
        receipt_date: new Date(),
      });

      if (paidAmount >= totalAmount) {
        status = "Paid";
      } else {
        status = "Partially Paid";
      }
    }

    // 🔥 CRITICAL FIX
    order.paid_amount = paidAmount;
    order.payment_status = status;
    order.balance = totalAmount - paidAmount;

 await order.save();

// 🔥 FIX: Sync invoice with updated customer
await InvoiceModel.updateMany(
  { order_id: order._id, storeId: storeObjectId },
  {
    client_id: order.customer_id,
  }
);

return res.json({
  success: true,
  data: order,
});
  } catch (error) {
    console.error("Update error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
},

delete: async (req, res) => {
const storeId = req.user?.storeId;

if (!storeId) {
  return res.status(401).json({
    success: false,
    message: "Unauthorized - storeId missing",
  });
}  try {
    console.log("Deleting Order ID:", req.params.id);

const storeObjectId = getStoreObjectId(storeId);

const deletedOrder = await OrderModel.findOneAndDelete({
  _id: req.params.id,
  storeId: storeObjectId
});

    if (!deletedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // ===============================
    // 🔥 DELETE RELATED INVOICES
    // ===============================
await InvoiceModel.deleteMany({
  order_id: deletedOrder._id,
 storeId: storeObjectId
});
await InvoiceDetailsModel.deleteMany({ order_id: deletedOrder._id, storeId: storeObjectId });

await TaskModel.deleteMany({ order_id: deletedOrder._id, storeId: storeObjectId });

await OrderDetailModel.deleteMany({ order_id: deletedOrder._id, storeId: storeObjectId });
    // ===============================
    // 🔥 DELETE RELATED RECEIPTS
    // ===============================
await ReceiptModel.updateMany(
  { "orders.order_id": deletedOrder._id, storeId: storeObjectId },
      {
        $pull: {
          orders: { order_id: deletedOrder._id },
        },
      }
    );

    // ===============================
    // 🔥 EMIT SOCKET EVENT
    // ===============================
    req.app.get("io").emit("orderDeleted");

    return res.json({
      success: true,
      message: "Order and all related data deleted successfully",
    });

  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
},

// ================= CUSTOMER PAYMENT =================
addPayment: async function (req, res) {
const storeId = req.user?.storeId;

if (!storeId) {
  return res.status(401).json({
    success: false,
    message: "Unauthorized - storeId missing",
  });
}  try {
    const { orderIds, amount, payment_mode } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order IDs are required",
      });
    }

    const numericAmount = Number(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid payment amount required",
      });
    }

    if (!payment_mode) {
      return res.status(400).json({
        success: false,
        message: "Payment mode required",
      });
    }

    let remainingAmount = numericAmount;

   const storeObjectId = getStoreObjectId(storeId);

const orders = await OrderModel.find({
  _id: { $in: orderIds },
  storeId: storeObjectId
});

    // Maintain frontend order selection order
    const orderedList = orderIds
      .map(id => orders.find(o => o._id.toString() === id.toString()))
      .filter(Boolean);

    let totalApplied = 0;
    const receiptOrders = [];

for (let order of orderedList) {
  if (remainingAmount <= 0) break;

  const total = Number(order.total || 0);
  const paid = Number(order.paid_amount || 0);
  const balance = Math.max(0, total - paid);

  if (balance <= 0) continue;

  const payAmount = Math.min(balance, remainingAmount);

  const newBalance = Math.max(0, balance - payAmount);

const storeObjectId = getStoreObjectId(storeId);

if (!storeObjectId) {
  return res.status(400).json({
    success: false,
    message: "Invalid storeId",
  });
}

await OrderModel.updateOne(
  { _id: order._id, storeId: storeObjectId },
  {
    $set: {
      balance: newBalance,
      payment_status: newBalance === 0 ? "Paid" : "Partially Paid",
    },
  }
);

  receiptOrders.push({
    order_id: order._id,
    applied_amount: payAmount,
  });

  remainingAmount -= payAmount;
  totalApplied += payAmount;
}

    if (totalApplied === 0) {
      return res.status(400).json({
        success: false,
        message: "No pending balance in selected orders",
      });
    }



    // 🔥 CREATE RECEIPT (MATCHES YOUR SCHEMA)
    const receipt = await ReceiptModel.create({
       storeId: storeObjectId,
      orders: receiptOrders,
      total_amount: totalApplied,
      payment_mode,
      receipt_date: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Payment added successfully",
      receipt,
    });

  } catch (error) {
    console.log("Add payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
},

assignOrderToMaster: async (req, res) => {
const storeId = req.user?.storeId;

if (!storeId) {
  return res.status(401).json({
    success: false,
    message: "Unauthorized - storeId missing",
  });
}  try {
    const { order_id, master_id } = req.body;

    if (!order_id || !master_id) {
      return res.status(400).json({
        success: false,
        message: "Order ID and Master ID required",
      });
    }

    // ✅ ONLY assign order
const storeObjectId = getStoreObjectId(storeId);

if (!storeObjectId) {
  return res.status(400).json({
    success: false,
    message: "Invalid storeId",
  });
}


 const order = await OrderModel.findOneAndUpdate(
{ _id: order_id, storeId: storeObjectId },
  { assigned_master: master_id },
  { new: true }
).populate("assigned_master", "first_name last_name designation");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
req.app.get("io").emit("orderAssigned", order);
    return res.json({
      success: true,
      message: "Order assigned to master successfully",
      data: order,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
},



getOrdersByMaster: async (req, res) => {
const storeId = req.user?.storeId;


if (!storeId) {
  return res.status(401).json({
    success: false,
    message: "Unauthorized - storeId missing",
  });
}  try {
    const { staffId } = req.params;

    if (!staffId) {
      return res.status(400).json({
        success: false,
        message: "Staff ID required",
      });
    }

    console.log("Requested staffId:", staffId);

    // ✅ SIMPLE & SAFE FILTER
const storeObjectId = getStoreObjectId(storeId);

if (!storeObjectId) {
  return res.status(400).json({
    success: false,
    message: "Invalid storeId",
  });
}

const orders = await OrderModel.find({
  assigned_master: staffId,
  storeId: storeObjectId
}) 
.populate(
  "customer_id",
  "first_name last_name contact_no_1 contact_no_2"
)      .populate("assigned_master", "first_name last_name designation")
      .sort({ createdAt: -1 });

    console.log("Orders found:", orders.length);

    return res.json({
      success: true,
      data: orders,
    });

  } catch (error) {
    console.error("Get master orders error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
},


};

module.exports = orderController;
