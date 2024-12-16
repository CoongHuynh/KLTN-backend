const express = require("express");
const router = express.Router();

const {
  addToCart,
  getCart,
  deleteCartItem,
  updateCartItem,
  clearCart,
} = require("../controllers/cartController");
const { authentication } = require("../middleware/authenUser");

router.post("/cart/add", authentication, addToCart);
router.get("/cart", authentication, getCart);
router.delete("/cart/item/:id", authentication, deleteCartItem);
router.put("/cart", authentication, updateCartItem);
router.delete("/cart", authentication, clearCart);

module.exports = router;
