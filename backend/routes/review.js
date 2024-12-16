const express = require("express");
const router = express.Router();

const {
  addReview,
  getAllReviews,
  deleteReviewById,
  getReviewsByProductId,
} = require("../controllers/reviewController");
const { authentication } = require("../middleware/authenUser");

router.post("/review", authentication, addReview);
router.get("/reviews/all", getAllReviews);
router.get("/reviews/:product_id", getReviewsByProductId);
router.delete("/review/:id", authentication, deleteReviewById);
module.exports = router;
