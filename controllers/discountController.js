const Product = require("../models/Product");
const Coupon = require("../models/Coupon");

// Áp dụng giảm giá đồng loạt cho tất cả sản phẩm
exports.applyBulkDiscount = async (req, res) => {
  try {
    const { discount, startDate, endDate } = req.body;

    const products = await Product.find({});

    for (let product of products) {
      if (!product.discount || product.discount <= discount) {
        await Product.findByIdAndUpdate(
          product._id,
          {
            discount,
            discountStartDate: startDate,
            discountEndDate: endDate,
          },
          { new: true }
        );
      }
    }

    res.status(200).json({ message: "Bulk discount applied successfully" });
  } catch (error) {
    console.error("Error applying bulk discount:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Áp dụng giảm giá cho một sản phẩm
exports.applyDiscountToProduct = async (req, res) => {
  try {
    const { productId, discount, startDate, endDate } = req.body;

    const product = await Product.findByIdAndUpdate(
      productId,
      {
        discount,
        discountStartDate: startDate,
        discountEndDate: endDate,
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error("Error applying discount to product:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Tạo mã giảm giá
exports.createCoupon = async (req, res) => {
  try {
    const { code, discount, startDate, endDate, quantity } = req.body;

    const newCoupon = new Coupon({
      code,
      discount,
      startDate,
      endDate,
      quantity,
    });

    const savedCoupon = await newCoupon.save();
    res.status(201).json(savedCoupon);
  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Sử dụng mã giảm giá
exports.useCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user._id;

    const coupon = await Coupon.findOne({ code });

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    if (
      !coupon.isActive ||
      coupon.startDate > Date.now() ||
      coupon.endDate < Date.now()
    ) {
      return res.status(400).json({ message: "Coupon is not active" });
    }

    if (coupon.usedBy.includes(userId)) {
      return res
        .status(400)
        .json({ message: "You have already used this coupon" });
    }

    if (coupon.usedBy.length >= coupon.quantity) {
      return res.status(400).json({ message: "Coupon has been fully used" });
      return res.status(404).json({ message: "Coupon does not exist" });
    }

    coupon.usedBy.push(userId);
    await coupon.save();

    res.status(200).json({
      message: "Coupon applied successfully",
      discount: coupon.discount,
    });
  } catch (error) {
    console.error("Error using coupon:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Lấy tất cả các discount
exports.getAllDiscounts = async (req, res) => {
  try {
    const discounts = await Product.find({ discount: { $gt: 0 } });
    res.status(200).json(discounts);
  } catch (error) {
    console.error("Error getting discounts:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Lấy tất cả các coupon
exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.status(200).json(coupons);
  } catch (error) {
    console.error("Error getting coupons:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
