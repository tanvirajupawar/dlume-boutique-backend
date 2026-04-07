const OrderModel = require("../models/order_model");

const dashboardController = {
  stats: async (req, res) => {
    try {
const storeId = req.user?.storeId;

if (!storeId) {
  return res.status(401).json({
    success: false,
    message: "Unauthorized - storeId missing",
  });
}
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const orders = await OrderModel.find({ storeId });

      let todayRevenue = 0;
      let delivered = 0;
      let pending = 0;
      let monthlyRevenue = 0;
      let awaitingPickups = 0;

      orders.forEach(order => {
        const orderDate = new Date(order.order_date);
        const amount = Number(order.total_amount || 0);

        // Today revenue
        if (orderDate >= today) {
          todayRevenue += amount;
        }

        // Delivered
        if (["Delivered", "Completed"].includes(order.order_status)) {
          delivered++;

          if (orderDate >= startOfMonth) {
            monthlyRevenue += amount;
          }
        } else {
          pending++;
        }

        // Ready for pickup
        if (order.order_status === "Approved") {
          awaitingPickups++;
        }
      });

      return res.json({
        success: true,
        data: {
          todayRevenue,
          totalOrders: orders.length,
          delivered,
          pending,
          monthlyRevenue,
          awaitingPickups,
        },
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
};

module.exports = dashboardController;