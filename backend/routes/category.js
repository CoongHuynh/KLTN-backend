const express = require("express");
const router = express.Router();

const {
  addCategory,
  getAllCategories,
  deleteCategoryById,
  updateCategoryById,
} = require("../controllers/categoriesControllers");

router.post("/categories", addCategory);
router.get("/categories", getAllCategories);
router.delete("/categories/:id", deleteCategoryById);
router.put("/categories/:id", updateCategoryById);

module.exports = router;
