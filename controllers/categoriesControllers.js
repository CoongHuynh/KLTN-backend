const Category = require("../models/Category");

// Controller để thêm danh mục mới
const addCategory = async (req, res) => {
  try {
    const { name, description, brands } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!name || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Tạo danh mục mới
    const newCategory = new Category({
      name,
      description,
      brands: brands || [], // Nếu không có danh sách brands, đặt giá trị mặc định là mảng rỗng
    });

    // Lưu danh mục vào cơ sở dữ liệu
    const savedCategory = await newCategory.save();

    // Trả về phản hồi thành công
    res.status(201).json(savedCategory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Controller để lấy danh sách tất cả danh mục
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Controller để xóa danh mục theo ID
const deleteCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Controller để cập nhật danh mục theo ID
const updateCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, brands } = req.body;

    const category = await Category.findByIdAndUpdate(
      id,
      { name, description, brands },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
module.exports = {
  addCategory,
  getAllCategories,
  deleteCategoryById,
  updateCategoryById,
};
