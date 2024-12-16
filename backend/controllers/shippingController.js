const Shipping = require("../models/Shipping");

// Tạo shipping
exports.createShipping = async (req, res) => {
  try {
    const { order_id, tracking_number, status } = req.body;

    const newShipping = new Shipping({
      order_id,
      tracking_number,
      status,
    });

    const savedShipping = await newShipping.save();
    res.status(201).json(savedShipping);
  } catch (error) {
    console.error("Error creating shipping:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Lấy thông tin shipping theo order_id
exports.getShippingByOrderId = async (req, res) => {
  try {
    const { order_id } = req.params;

    const shipping = await Shipping.findOne({ order_id }).populate("order_id");
    if (!shipping) {
      return res.status(404).json({ message: "Shipping not found" });
    }

    res.status(200).json(shipping);
  } catch (error) {
    console.error("Error getting shipping by order ID:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Cập nhật trạng thái shipping
exports.updateShippingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const shipping = await Shipping.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!shipping) {
      return res.status(404).json({ message: "Shipping not found" });
    }

    res.status(200).json(shipping);
  } catch (error) {
    console.error("Error updating shipping status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Xóa shipping
exports.deleteShipping = async (req, res) => {
  try {
    const { id } = req.params;

    const shipping = await Shipping.findByIdAndDelete(id);
    if (!shipping) {
      return res.status(404).json({ message: "Shipping not found" });
    }

    res.status(200).json({ message: "Shipping deleted successfully" });
  } catch (error) {
    console.error("Error deleting shipping:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
