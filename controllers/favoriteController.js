const User = require("../models/User");
const Product = require("../models/Product");

// Thêm sản phẩm vào danh sách yêu thích
exports.addFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.favorites.includes(productId)) {
      return res.status(400).json({ message: "Product already in favorites" });
    }

    user.favorites.push(productId);
    await user.save();

    res.status(200).json({
      message: "Product added to favorites",
      favorites: user.favorites,
    });
  } catch (error) {
    console.error("Error adding favorite:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Lấy danh sách sản phẩm yêu thích
exports.getFavorites = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate("favorites");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.favorites);
  } catch (error) {
    console.error("Error getting favorites:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Xóa sản phẩm khỏi danh sách yêu thích
exports.removeFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.favorites = user.favorites.filter((id) => id.toString() !== productId);
    await user.save();

    res.status(200).json({
      message: "Product removed from favorites",
      favorites: user.favorites,
    });
  } catch (error) {
    console.error("Error removing favorite:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
