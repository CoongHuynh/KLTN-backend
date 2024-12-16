const express = require("express");
const {
  createShipping,
  getShippingByOrderId,
  updateShippingStatus,
  deleteShipping,
} = require("../controllers/shippingController");
const { authentication } = require("../middleware/authenUser");

const router = express.Router();

router.post("/shipping", authentication, createShipping);
router.get("/shipping/:order_id", authentication, getShippingByOrderId);
router.put("/shipping/:id", authentication, updateShippingStatus);
router.delete("/shipping/:id", authentication, deleteShipping);

module.exports = router;
