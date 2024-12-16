const express = require("express");
const {
  addFavorite,
  getFavorites,
  removeFavorite,
} = require("../controllers/favoriteController");
const { authentication } = require("../middleware/authenUser");

const router = express.Router();

router.post("/favorite/add", authentication, addFavorite);
router.get("/favorites", authentication, getFavorites);
router.post("/favorite/remove", authentication, removeFavorite);

module.exports = router;
