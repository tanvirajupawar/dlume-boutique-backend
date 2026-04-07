const TaskModel = require("../models/task_model");
const OrderModel = require("../models/order_model");
const UserModel = require("../models/user_model");
const sendPush = require("../middlewares/sendPushNotification");
const mongoose  = require("mongoose");

const taskController = {
  // Create a new task
  create: async (req, res) => {
    try {
const storeId = req.user.storeId;

const task = new TaskModel({
  ...req.body,
  storeId
});      await task.save();
      return res.json({ success: true, message: "Task created", data: task });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  },

  // Get a single task by ID
  fetch: async (req, res) => {
    try {
const storeId = req.user.storeId;

const task = await TaskModel.findOne({
  _id: req.params.id,
  storeId
})        .populate("assigned_staff order_id company_id");

      if (!task) {
        return res.status(404).json({ success: false, message: "Task not found" });
      }

      return res.json({ success: true, data: task });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  },

  // List all tasks with pagination
  index: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

const storeId = req.user.storeId;

const tasks = await TaskModel.find({ storeId })
        .populate("assigned_staff order_id company_id")
        .skip(skip)
        .limit(limit);

const total = await TaskModel.countDocuments({ storeId });
      return res.json({
        success: true,
        data: tasks,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  },

  findByOrderId: async (req, res) => {
    try {
      const order_id = req.params.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const skip = (page - 1) * limit;

const storeId = req.user.storeId;

const tasks = await TaskModel.find({ order_id, storeId })
  .populate({
    path: "assigned_staff_1",
    select: "first_name last_name"
  })
  .skip(skip)
  .limit(limit);


      const total = await TaskModel.countDocuments({ order_id, storeId })

     
return res.json({
  success: true,
  data: tasks,
  total,
  page,
  totalPages: Math.ceil(total / limit)
});

    } catch (error) {
      return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  },

  findByOrder: async (req, res) => {
    try {
      const orderId = req.params.id;
      const userId = req.params.userId;
      console.log(userId);
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const skip = (page - 1) * limit;

   const storeId = req.user.storeId;

const tasks = await TaskModel.find({
  assigned_staff_1: new mongoose.Types.ObjectId(userId),
  order_id: new mongoose.Types.ObjectId(orderId),
  storeId
})
        .populate("assigned_staff_1 assigned_staff_2 assigned_staff_3")
        .skip(skip)
        .limit(limit);

    const total = await TaskModel.countDocuments({
  order_id: orderId,
  assigned_staff_1: userId,
  storeId
});


    

      return res.json({
        success: true,
        data: tasks,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  },

findtask: async (req, res) => {
  try {
    const userId = req.params.id;

 const storeId = req.user.storeId;

const tasks = await TaskModel.find({
  storeId,
  $or: [
        { assigned_staff_1: new mongoose.Types.ObjectId(userId) },
        { assigned_staff_2: new mongoose.Types.ObjectId(userId) },
        { assigned_staff_3: new mongoose.Types.ObjectId(userId) },
      ],
    }).select("order_id");

    return res.json({
      success: true,
      data: tasks,
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

assign: async (req, res) => {
  try {
    const { order_id, tasks } = req.body;

    if (!tasks || tasks.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No tasks provided",
      });
    }

    const savedTasks = [];

    for (const alloc of tasks) {
      const { task, assigned_staff_1, amount } = alloc;

      // CHECK IF TASK ALREADY EXISTS
  const storeId = req.user.storeId;

let existingTask = await TaskModel.findOne({
  order_id,
  name: task,
  garment_index: alloc.garment_index,
  storeId
});


if (existingTask) {
  existingTask.assigned_staff_1 = assigned_staff_1;
  existingTask.amount = amount;
  existingTask.garment_index = alloc.garment_index;

  // Only move to In Progress if not already finished
  if (!["Completed", "Approved"].includes(existingTask.status)) {
    existingTask.status = "In Progress";
    existingTask.start_date = new Date();
  }

  await existingTask.save();
} else {
        // CREATE only if not exists
 const newTask = await TaskModel.create({
  order_id,
  name: task,
  assigned_staff_1,
  amount,
  garment_index: alloc.garment_index,
  assigned_at: new Date(),
  status: "Pending",
  storeId
});
        savedTasks.push(newTask);
      }
    }
    const io = req.app.get("io");

if (io) {
  io.emit("taskAssigned", {
    orderId: order_id,
  });
}


    return res.json({
      success: true,
      message: "Task assigned",
      data: savedTasks,
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


startTask: async (req, res) => {
  try {
const storeId = req.user.storeId;

const task = await TaskModel.findOneAndUpdate(
  { _id: req.params.id, storeId },
  {
    status: "In Progress",
    start_date: new Date(),
  },
  { new: true }
);

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // 🔥 EMIT SOCKET EVENT
const io = req.app.get("io");

if (io) {
  io.emit("taskUpdated", {
    orderId: task.order_id.toString(),
    taskId: task._id.toString(),
    status: task.status,
  });
}

    return res.json({ success: true, message: "Task started", data: task });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
},



  endTask: async (req, res) => {
    try {
        console.log(req.params.id);
        
const storeId = req.user.storeId;

const task = await TaskModel.findOneAndUpdate(
  { _id: req.params.id, storeId },
        {
          status: "Completed",
          end_date: new Date(),
        },
        { new: true }
      );

      if (!task) {
        return res.status(404).json({ success: false, message: "Task not found" });
      }
const io = req.app.get("io");

if (io) {
  io.emit("taskUpdated", {
    orderId: task.order_id.toString(),
    taskId: task._id.toString(),
    status: task.status,
  });
}

      return res.json({ success: true, message: "Task completed", data: task });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },

  taskPaused: async (req, res) => {
    try {
      console.log(req.params.id);


     const storeId = req.user.storeId;

const task = await TaskModel.findOneAndUpdate(
  { _id: req.params.id, storeId },
        {
          status: "Paused",
          start_date: new Date(),
        },
        { new: true }
      );

      if (!task) {
        return res.status(404).json({ success: false, message: "Task not found" });
      }
const io = req.app.get("io");

if (io) {
  io.emit("taskUpdated", {
    orderId: task.order_id.toString(),
    taskId: task._id.toString(),
    status: task.status,
  });
}

      return res.json({ success: true, message: "Task Paused", data: task });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },

taskApp: async (req, res) => {
  try {
    const taskId = req.params.id;
    const storeId = req.user.storeId;

    // 🔥 Update task safely (multi-tenant)
    const task = await TaskModel.findOneAndUpdate(
      { _id: taskId, storeId },
      {
        status: "Approved",
        approved_at: new Date(),
      },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // 🔥 Check remaining tasks (store-safe)
    const remainingTasks = await TaskModel.countDocuments({
      order_id: task.order_id,
      status: { $ne: "Approved" },
      storeId
    });

    // 🔥 If all tasks approved → update order
    if (remainingTasks === 0) {
      await OrderModel.findOneAndUpdate(
        { _id: task.order_id, storeId },
        { order_status: "Approved" },
        { new: true }
      );
    }

    // 🔥 Socket emit
    const io = req.app.get("io");

    if (io) {
      io.emit("taskUpdated", {
        orderId: task.order_id.toString(),
        taskId: task._id.toString(),
        status: "Approved",
      });
    }

    return res.json({
      success: true,
      message: "Task Approved",
      data: task,
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


  taskDisapproved: async (req, res) => {
    try {
      console.log(req.params.id);


    const storeId = req.user.storeId;

const task = await TaskModel.findOneAndUpdate(
  { _id: req.params.id, storeId },
        {
          status: "Disapproved",
          start_date: new Date(),
        },
        { new: true }
      );

      if (!task) {
        return res.status(404).json({ success: false, message: "Task not found" });
      }
const io = req.app.get("io");

if (io) {
  io.emit("taskUpdated", {
    orderId: task.order_id.toString(),
    taskId: task._id.toString(),
    status: task.status,
  });
}

      return res.json({ success: true, message: "Task Disapproved", data: task });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  },


tasksByStaff: async (req, res) => {
  try {
    const { staffId } = req.params;

const storeId = req.user.storeId;


const tasks = await TaskModel.find({
  storeId,
  $or: [
        { assigned_staff_1: new mongoose.Types.ObjectId(staffId) },
        { assigned_staff_2: new mongoose.Types.ObjectId(staffId) },
        { assigned_staff_3: new mongoose.Types.ObjectId(staffId) },
      ],
    })
    .populate({
      path: "order_id",
      select: "order_no customer_name order_date total garments",
    })
    .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: tasks,
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



  // Update task by ID
  update: async (req, res) => {
    try {
    const storeId = req.user.storeId;

const updatedTask = await TaskModel.findOneAndUpdate(
  { _id: req.params.id, storeId },
  req.body,
  { new: true, runValidators: true }
);

      if (!updatedTask) {
        return res.status(404).json({ success: false, message: "Task not found" });
      }

      return res.json({ success: true, data: updatedTask });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  },

delete: async (req, res) => {
  try {
const storeId = req.user.storeId;

const deletedTask = await TaskModel.findOneAndDelete({
  _id: req.params.id,
  storeId
});
    if (!deletedTask) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }
    return res.json({ success: true, message: "Task deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
},

// 🔥 MOVE THIS INSIDE OBJECT
completeTaskInstant: async (req, res) => {
  try {
    const taskId = req.params.id;
    const { assigned_staff_1, amount } = req.body;

    if (!assigned_staff_1) {
      return res.status(400).json({
        success: false,
        message: "Staff is required",
      });
    }

    const StaffModel = require("../models/staff_model");
    const staff = await StaffModel.findById(assigned_staff_1);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    const numericAmount = amount ? Number(amount) : 0; // 🔥 DEFAULT 0

const storeId = req.user.storeId;

const task = await TaskModel.findOneAndUpdate(
  { _id: taskId, storeId },
  {
    assigned_staff_1,
    amount: numericAmount,
    status: "Completed",
    end_date: new Date(),
  },
  { new: true }
);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const io = req.app.get("io");

    if (io) {
      io.emit("taskUpdated", {
        orderId: task.order_id.toString(),
        taskId: task._id.toString(),
        status: "Completed",
      });
    }

    return res.json({
      success: true,
      message: "Task completed instantly",
      data: task,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}

}; 

module.exports = taskController;



