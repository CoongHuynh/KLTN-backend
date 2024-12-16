const express = require("express");
const router = express.Router();
const {
  createOrder,
  getOrderById,
  getOrdersByUserId,
  updateOrderStatus,
  updateOrderItems,
  deleteOrder,
  getAllOrders,
  updatePaymentStatus,
} = require("../controllers/orderController");
const { authentication } = require("../middleware/authenUser");

router.post("/orders", authentication, createOrder);
router.get("/orders", authentication, getAllOrders);
router.get("/orders/:id", authentication, getOrderById);
router.get("/orders/user/:user_id", authentication, getOrdersByUserId);
router.put("/orders/:id", authentication, updateOrderStatus);
router.put("/orders/:id/items", authentication, updateOrderItems);
router.delete("/orders/:id", authentication, deleteOrder);
router.post("/orders/pay", authentication, updatePaymentStatus);
router.get("/paypal", (req, res) => {
  res.send(process.env.PAYPAL_CLIENT_ID);
});
module.exports = router;
