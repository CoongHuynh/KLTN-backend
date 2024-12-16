const Brand = require("../models/Brand");

// Controller để thêm brand mới
const addBrand = async (req, res) => {
  try {
    const { name, categories } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    // Tạo brand mới
    const newBrand = new Brand({
      name,
      categories,
    });

    // Lưu brand vào cơ sở dữ liệu
    const savedBrand = await newBrand.save();

    // Trả về phản hồi thành công
    res.status(201).json(savedBrand);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Controller để lấy danh sách tất cả brands
const getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find().populate({
      path: "categories",
      select: "-brands", // Loại bỏ trường brands khi populate categories
    });
    res.status(200).json(brands);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Controller để xóa brand theo ID
const deleteBrandById = async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await Brand.findByIdAndDelete(id);

    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    res.status(200).json({ message: "Brand deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Controller để cập nhật brand theo ID
const updateBrandById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, categories } = req.body;

    const brand = await Brand.findByIdAndUpdate(
      id,
      { name, categories },
      { new: true, runValidators: true }
    );

    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    res.status(200).json(brand);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Controller để lấy danh sách brands theo category
const getBrandsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const brands = await Brand.find({ categories: categoryId });
    res.status(200).json(brands);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
module.exports = {
  addBrand,
  getAllBrands,
  deleteBrandById,
  updateBrandById,
  getBrandsByCategory,
};
