const mongoose = require("mongoose");

const shippingSchema = new mongoose.Schema(
  {
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    tracking_number: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending_confirmation", "preparing", "in_transit", "delivered"],
      required: true,
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
  }
);

const Shipping = mongoose.model("Shipping", shippingSchema);

module.exports = Shipping;
