const express = require("express");
const {
  applyBulkDiscount,
  createCoupon,
  applyDiscountToProduct,
  useCoupon,
  getAllCoupons,
  getAllDiscounts,
} = require("../controllers/discountController");
const { authentication } = require("../middleware/authenUser");

const router = express.Router();

router.post("/bulk-discount", authentication, applyBulkDiscount);
router.post("/create-coupon", authentication, createCoupon);
router.post("/apply-discount", authentication, applyDiscountToProduct);
router.post("/use-coupon", authentication, useCoupon);
router.get("/alldiscounts", authentication, getAllDiscounts);
router.get("/allcoupon", authentication, getAllCoupons);

module.exports = router;
