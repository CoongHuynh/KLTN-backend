const Review = require("../models/Review");
const Product = require("../models/Product");
// Thêm review
exports.addReview = async (req, res) => {
  try {
    const { product_id, rating, comment } = req.body;
    const user_id = req.user._id;

    const newReview = new Review({
      product_id,
      user_id,
      rating,
      comment,
    });

    const savedReview = await newReview.save();
    // Tính lại điểm rating trung bình cho sản phẩm
    const reviews = await Review.find({ product_id });
    const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    // Cập nhật điểm rating cho sản phẩm
    await Product.findByIdAndUpdate(product_id, { ratings: averageRating });

    res.status(201).json(savedReview);
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Lấy tất cả review
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("user_id", "name")
      .populate("product_id", "name");
    res.status(200).json(reviews);
  } catch (error) {
    console.error("Error getting reviews:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Lấy tất cả review theo ID sản phẩm
exports.getReviewsByProductId = async (req, res) => {
  try {
    const { product_id } = req.params;

    const reviews = await Review.find({ product_id })
      .populate("user_id", "name")
      .populate("product_id", "name");
    res.status(200).json(reviews);
  } catch (error) {
    console.error("Error getting reviews by product ID:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// Xóa review theo ID
exports.deleteReviewById = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findByIdAndDelete(id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
