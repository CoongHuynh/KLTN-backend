const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const Product = require("../models/Product");
const Payment = require("../models/Payment");

const createOrder = async (req, res) => {
  try {
    const { shipping_address, items } = req.body;
    const user_id = req.user._id;

    // Tính tổng giá của đơn hàng
    let total_price = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product_id);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product not found: ${item.product_id}` });
      }
      const itemTotalPrice = product.price * item.quantity;
      total_price += itemTotalPrice;

      // Lưu thông tin sản phẩm vào orderItems
      orderItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        price: product.price,
      });
    }

    // Tạo đơn hàng mới
    const newOrder = new Order({
      user_id,
      total_price,
      shipping_address,
      items: orderItems,
    });

    // Lưu đơn hàng
    const savedOrder = await newOrder.save();

    // Tạo các OrderItem tương ứng
    // Tạo các OrderItem tương ứng
    for (const orderItem of orderItems) {
      const newOrderItem = new OrderItem({
        order_id: savedOrder._id,
        product_id: orderItem.product_id,
        quantity: orderItem.quantity,
        price: orderItem.price,
      });
      await newOrderItem.save();
    }

    res.status(201).json(savedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate("items.product_id");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getOrdersByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;
    const orders = await Order.find({ user_id }).populate("items.product_id");

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found for this user" });
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Tìm đơn hàng theo ID
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Cập nhật trạng thái đơn hàng
    order.status = status;
    const updatedOrder = await order.save();

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateOrderItems = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, shipping_address, payment_status } = req.body;

    // Kiểm tra quyền hạn của người dùng (chỉ admin mới được phép cập nhật)
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Tìm đơn hàng theo ID
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Cập nhật các sản phẩm trong đơn hàng nếu có
    if (items && items.length > 0) {
      let total_price = 0;
      const updatedItems = [];

      for (const item of items) {
        const product = await Product.findById(item.product_id);
        if (!product) {
          return res
            .status(404)
            .json({ message: `Product not found: ${item.product_id}` });
        }
        const itemTotalPrice = product.price * item.quantity;
        total_price += itemTotalPrice;

        updatedItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          price: product.price,
        });
      }

      order.items = updatedItems;
      order.total_price = total_price;
    }

    // Cập nhật địa chỉ giao hàng nếu có
    if (shipping_address) {
      order.shipping_address = shipping_address;
    }

    // Cập nhật trạng thái thanh toán nếu có
    if (payment_status) {
      order.payment_status = payment_status;
    }

    const updatedOrder = await order.save();

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra quyền hạn của người dùng (chỉ admin mới được phép cập nhật)
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Tìm và xóa đơn hàng theo ID
    const order = await Order.findByIdAndDelete(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllOrders = async (req, res) => {
  try {
    // Kiểm tra quyền hạn của người dùng (chỉ admin mới được phép truy cập)
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    // Lấy danh sách tất cả các đơn hàng
    const orders = await Order.find()
      .populate("items.product_id")
      .populate("user_id", "name email");

    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { order_id, status, method } = req.body;

    // Tìm đơn hàng theo ID
    const order = await Order.findById(order_id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Cập nhật trạng thái thanh toán của đơn hàng
    order.payment_status = status;
    await order.save();

    // Lưu thông tin thanh toán
    const payment = new Payment({
      order_id,
      amount: order.total_price,
      method,
      status,
    });
    await payment.save();

    res.status(200).json({ message: "Payment status updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
module.exports = {
  createOrder,
  getOrderById,
  getOrdersByUserId,
  updateOrderStatus,
  updateOrderItems,
  deleteOrder,
  getAllOrders,
  updatePaymentStatus,
};
