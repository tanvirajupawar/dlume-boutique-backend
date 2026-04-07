require('dotenv').config();
console.log("DB_URL:", process.env.DB_URL);

const express = require("express");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const cors  = require("cors");
const mongoose  = require("mongoose");
const userRouter = require("./routes/user_router");
const categoryRouter = require("./routes/category_router");
const productRouter = require("./routes/product_router");
const companyRouter = require("./routes/company_router");
const staffRouter = require('./routes/staff_router');
const clientRouter = require('./routes/client_router');
const serviceRouter = require('./routes/service_routes');
const orderRouter = require('./routes/order_routes');
const stockRouter = require('./routes/stock_routes');
const stockManagementRouter = require('./routes/stock_management_routes');
const invoiceRouter = require('./routes/invoice_routes.js');
const receiptRouter = require('./routes/receipt_routes.js');
const taskRouter = require('./routes/task_router.js');
const paymentRouter = require('./routes/payment_routes');
const dashboardRouter = require("./routes/dashboard_router");
const orderDetailsRouter = require("./routes/order_details_routes");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");


const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(helmet());
app.use(morgan('dev'));
app.use(cors());
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"))
);
console.log(
  "Serving uploads from:",
  path.join(__dirname, "../uploads")
);
mongoose.connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));

app.get("/", function(req, res){
    res.send("hello world");
});

// Routes

const nocache = (req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
};

app.use(
  "/api",
  nocache,
  userRouter,
  categoryRouter,
  productRouter,
  companyRouter,
  staffRouter,
  clientRouter,
  serviceRouter,
  orderRouter,
  stockRouter,
  stockManagementRouter,
  invoiceRouter,
  receiptRouter,
  taskRouter,
  paymentRouter,
  dashboardRouter
);


app.use("/api/order-details", orderDetailsRouter);

// Routes


const PORT = process.env.PORT || 9000;

// Create HTTP server
const server = http.createServer(app);

// Attach socket
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

//  Attach io to every request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Make io available globally
app.set("io", io);

io.on("connection", (socket) => {
  console.log("⚡ Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server started at port: ${PORT}`);
});

app.use((err, req, res, next) => {
  console.log("🔥 GLOBAL ERROR:", err);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File too large",
    });
  }

  res.status(500).json({
    success: false,
    message: err.message || "Server error",
  });
});