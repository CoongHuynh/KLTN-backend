const User = require("../models/User");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");
const mongoose = require("mongoose");
const { uploadToCloudinary } = require("../controllers/uploadImage");
const { imageType } = require("../middleware/imageType");
const natural = require("natural");
const similarity = require("similarity");
// Controller để thêm sản phẩm mới
const addProduct = async (req, res) => {
  try {
    // Sử dụng middleware imageType để kiểm tra và upload hình ảnh
    imageType(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      const {
        name,
        description,
        price,
        stock,
        category_id,
        brand,
        attributes,
      } = req.body;

      // Kiểm tra các trường bắt buộc
      if (!name || !description || !price || !stock || !category_id || !brand) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Chuyển đổi attributes từ chuỗi JSON thành đối tượng nếu cần
      let parsedAttributes = [];
      if (typeof attributes === "string") {
        try {
          parsedAttributes = JSON.parse(attributes);
        } catch (error) {
          return res.status(400).json({ message: "Invalid attributes format" });
        }
      } else {
        parsedAttributes = attributes;
      }

      // Upload hình ảnh lên Cloudinary
      const files = req.files;
      const folderPath = "products"; // Đặt tên thư mục trên Cloudinary

      const uploadResults = [];
      for (const file of files) {
        const url = await uploadToCloudinary(
          file.buffer,
          file.originalname,
          folderPath
        );
        uploadResults.push(url);
      }

      // Tạo sản phẩm mới
      const newProduct = new Product({
        name,
        description,
        price,
        stock,
        category_id,
        brand,
        attributes: parsedAttributes, // Sử dụng attributes đã được chuyển đổi
        images: uploadResults, // Lưu URL hình ảnh từ Cloudinary
      });

      // Lưu sản phẩm vào cơ sở dữ liệu
      const savedProduct = await newProduct.save();

      // Trả về phản hồi thành công
      res.status(201).json(savedProduct);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
// Controller để lấy danh sách tất cả sản phẩm
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("category_id");
    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const { increaseViews } = req.query; // Lấy tham số increaseViews từ query

    // Validate the id parameter
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(id).populate("category_id");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Tăng số lượt xem nếu increaseViews là true
    if (increaseViews === "true") {
      product.views += 1;
      await product.save();
    }

    res.status(200).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
const updateProductById = async (req, res) => {
  try {
    imageType(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      const productId = req.params.id;

      if (!Object.keys(req.body).length) {
        return res.status(400).json({
          message:
            "Request body is empty. Please provide data to update the product.",
        });
      }
      const {
        name,
        description,
        price,
        stock,
        category_id,
        brand,
        attributes,
      } = req.body;

      // Kiểm tra quyền hạn của người dùng (chỉ dành cho quản trị viên)
      if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Chuyển đổi attributes từ chuỗi JSON thành đối tượng nếu cần
      let parsedAttributes = [];
      if (typeof attributes === "string") {
        try {
          parsedAttributes = JSON.parse(attributes);
        } catch (error) {
          return res.status(400).json({ message: "Invalid attributes format" });
        }
      } else {
        parsedAttributes = attributes;
      }

      // Xử lý upload hình ảnh lên Cloudinary nếu có
      let images = req.body.images || [];
      if (req.files && req.files.length > 0) {
        images = []; // Reset url images nếu có hình ảnh mới được tải lên
        for (const file of req.files) {
          const url = await uploadToCloudinary(
            file.buffer,
            file.originalname,
            "products"
          );
          images.push(url);
        }
      }

      // Tìm sản phẩm theo ID và cập nhật thông tin
      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        {
          name,
          description,
          price,
          stock,
          category_id,
          brand,
          attributes: parsedAttributes, // Sử dụng attributes đã được chuyển đổi
          images,
        },
        { new: true, runValidators: true }
      );

      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.status(200).json(updatedProduct);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
// Controller để xóa sản phẩm theo ID
const deleteProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra quyền hạn của người dùng (chỉ dành cho quản trị viên)
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Kiểm tra xem sản phẩm có tồn tại trong giỏ hàng
    const cartWithProduct = await Cart.findOne({ "items.product_id": id });
    if (cartWithProduct) {
      return res
        .status(400)
        .json({ message: "Cannot delete product. It exists in a cart." });
    }

    // Kiểm tra xem sản phẩm có tồn tại trong đơn hàng
    const orderWithProduct = await Order.findOne({ "items.product_id": id });
    if (orderWithProduct) {
      return res
        .status(400)
        .json({ message: "Cannot delete product. It exists in an order." });
    }

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
// Controller để lấy sản phẩm với phân trang
const getFillteProducts = async (req, res) => {
  const {
    page,
    limit,
    category,
    brand,
    filter,
    minPrice,
    maxPrice,
    sortByPrice,
  } = req.query;

  // Validate price fields
  if (minPrice && isNaN(Number(minPrice))) {
    return res.status(400).json({ message: "Invalid minPrice value" });
  }
  if (maxPrice && isNaN(Number(maxPrice))) {
    return res.status(400).json({ message: "Invalid maxPrice value" });
  }

  const skip = (page - 1) * limit;
  const query = {};

  if (category) {
    query.category_id = category;
  }

  if (brand) {
    query.brand_id = brand;
  }

  if (filter) {
    query.filter = filter;
  }

  if (minPrice) {
    query.price = { ...query.price, $gte: Number(minPrice) };
  }

  if (maxPrice) {
    query.price = { ...query.price, $lte: Number(maxPrice) };
  }

  const sort = {};
  if (sortByPrice) {
    sort.price = sortByPrice === "asc" ? 1 : -1;
  }

  try {
    const products = await Product.find(query)
      .skip(skip)
      .limit(Number(limit))
      .sort(sortByPrice ? { price: sortByPrice } : {});

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    res.json({
      totalProducts,
      products,
      totalPages,
      currentPage: Number(page),
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Error fetching products" });
  }
};
const getTopProductsByViews = async (req, res) => {
  try {
    const { limit } = req.query;

    // Validate the limit parameter
    const maxLimit = 20;
    const validLimit =
      limit && !isNaN(Number(limit))
        ? Math.min(Number(limit), maxLimit)
        : maxLimit;

    const products = await Product.find()
      .sort({ views: -1 }) // Sắp xếp theo views giảm dần
      .limit(validLimit); // Giới hạn số lượng sản phẩm

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching top products by views:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllProductsFullName = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("category_id", "name")
      .populate("brand", "name");

    // Định dạng lại dữ liệu để trả về tên của category và brand
    const formattedProducts = products.map((product) => ({
      _id: product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category_id
        ? product.category_id.name
        : "Unknown Category",
      brand: product.brand ? product.brand.name : "Unknown Brand",
      ratings: product.ratings,
      numberOfReviews: product.numberOfReviews,
      views: product.views,
    }));

    res.status(200).json(formattedProducts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  addProduct,
  getAllProducts,
  getProductById,
  updateProductById,
  deleteProductById,
  getFillteProducts,
  getTopProductsByViews,
  getAllProductsFullName,
};
