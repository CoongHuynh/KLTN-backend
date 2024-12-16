const express = require("express");
const router = express.Router();
const {
  addBrand,
  getAllBrands,
  deleteBrandById,
  updateBrandById,
  getBrandsByCategory,
} = require("../controllers/brandControllers");
const { authentication } = require("../middleware/authenUser");

router.post("/brands", authentication, addBrand);
router.get("/brands", authentication, getAllBrands);
router.delete("/brands/:id", authentication, deleteBrandById);
router.put("/brands/:id", authentication, updateBrandById);
router.get("/brands/category/:categoryId", getBrandsByCategory); // Thêm route mới

module.exports = router;
