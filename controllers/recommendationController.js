const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const Cart = require("../models/Cart");
const use = require("@tensorflow-models/universal-sentence-encoder");
const tf = require("@tensorflow/tfjs");
const natural = require("natural");
const similarity = require("similarity");

let model;
use.load().then((loadedModel) => {
  model = loadedModel;
  console.log("Model loaded");
});

const calculatePriorityScore = async () => {
  const products = await Product.find();
  const orders = await Order.find();

  const productScores = products.map((product) => {
    const views = product.views;
    const ratings = product.ratings;
    const numberOfReviews = product.numberOfReviews;
    const productscore = product.score;
    const purchaseCount = orders.filter((order) =>
      order.items.some((item) => item.product_id.equals(product._id))
    ).length;
    const cancelCount = orders.filter(
      (order) =>
        order.status === "cancelled" &&
        order.items.some((item) => item.product_id.equals(product._id))
    ).length;

    const score =
      views * 0.2 +
      ratings * 0.3 +
      numberOfReviews * 0.2 +
      purchaseCount * 0.2 -
      cancelCount * 0.1 +
      productscore;

    return { product, score };
  });

  return productScores.sort((a, b) => b.score - a.score);
};

exports.getRecommendations = async (req, res) => {
  try {
    const productScores = await calculatePriorityScore();
    res.status(200).json(productScores);
  } catch (error) {
    console.error("Error in getRecommendations:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.increaseProductScore = async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { productId, increment } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Tăng điểm của sản phẩm
    product.score += increment;
    await product.save();

    res.status(200).json({ message: "Product score increased successfully" });
  } catch (error) {
    console.error("Error in increaseProductScore:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.calculateScoreIncrease = async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    const productScores = await calculatePriorityScore();
    const highestScore = productScores[0].score;

    const scoreIncreases = productScores.map((p) => {
      const currentScore = p.score;
      const scoreDifference = highestScore - currentScore; // Thêm một chút để đảm bảo lên đầu
      return {
        productId: p.product._id,
        currentScore,
        scoreDifference,
      };
    });

    res.status(200).json(scoreIncreases);
  } catch (error) {
    console.error("Error in calculateScoreIncrease:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

let cosineSim;
// Hàm để huấn luyện mô hình và tính toán độ tương đồng cosine
const trainModel = async () => {
  const products = await Product.find()
    .populate("category_id", "name")
    .populate("brand", "name");
  const tokenizedText = products.map((product) =>
    `${product.description} ${product.category_id.name} ${product.brand.name}`.split(
      " "
    )
  );

  const TfIdf = natural.TfIdf;
  const tfidf = new TfIdf();

  // Thêm văn bản sản phẩm vào tfidf
  tokenizedText.forEach((text, index) => {
    tfidf.addDocument(text.join(" "), index);
  });

  // Tính toán độ tương đồng cosine
  cosineSim = [];
  for (let i = 0; i < products.length; i++) {
    cosineSim[i] = [];
    for (let j = 0; j < products.length; j++) {
      if (i === j) {
        cosineSim[i][j] = 1;
      } else {
        const text1 = `${products[i].description} ${products[i].category_id.name} ${products[i].brand.name}`;
        const text2 = `${products[j].description} ${products[j].category_id.name} ${products[j].brand.name}`;
        cosineSim[i][j] = similarity(text1, text2);
      }
    }
  }
};

// Hàm để gợi ý sản phẩm
const getRecommendations = (index, topN = 6) => {
  const simScores = cosineSim[index].map((score, i) => [i, score]);
  simScores.sort((a, b) => b[1] - a[1]);
  const productIndices = simScores.slice(1, topN + 1).map((score) => score[0]);
  return productIndices;
};

// API để lấy danh sách sản phẩm và gợi ý sản phẩm
exports.getRecommenProduct = async (req, res) => {
  try {
    await trainModel();

    const products = await Product.find()
      .populate("category_id", "name")
      .populate("brand", "name");

    const formattedProducts = await Promise.all(
      products.map(async (product, index) => {
        const recommendations = getRecommendations(index).map(
          (i) => products[i]._id
        );

        return {
          recommendations,
        };
      })
    );
    // Chỉ lấy recommendations đầu tiên của formattedProducts
    const firstRecommendations = await Product.find({
      _id: { $in: formattedProducts[0].recommendations },
    })
      .populate("category_id", "name")
      .populate("brand", "name");
    // const firstRecommendations = formattedProducts[0].recommendations;

    res.status(200).json({
      recommendations: firstRecommendations, // Trả về danh sách ID sản phẩm được gợi ý đầu tiên
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// API để lấy danh sách sản phẩm và gợi ý sản phẩm
exports.getRecommenProductForUser = async (req, res) => {
  try {
    const userId = req.user._id;

    // Lấy danh sách sản phẩm yêu thích
    const user = await User.findById(userId).populate("favorites");
    const favoriteProducts = user ? user.favorites : [];

    // Lấy danh sách sản phẩm trong giỏ hàng
    const cart = await Cart.findOne({ user_id: userId }).populate(
      "items.product_id"
    );
    const cartProducts = cart ? cart.items.map((item) => item.product_id) : [];

    // Lấy danh sách sản phẩm đã mua với trạng thái shipped và processing
    const purchasedOrders = await Order.find({
      user_id: userId,
      status: { $in: ["shipped", "processing"] },
    }).populate("items.product_id");
    const purchasedProducts = purchasedOrders
      ? purchasedOrders.flatMap((order) =>
          order.items.map((item) => item.product_id)
        )
      : [];

    // Lấy danh sách sản phẩm hủy với trạng thái cancelled
    const cancelledOrders = await Order.find({
      user_id: userId,
      status: "cancelled",
    }).populate("items.product_id");
    const cancelledProducts = cancelledOrders
      ? cancelledOrders.flatMap((order) =>
          order.items.map((item) => item.product_id)
        )
      : [];

    // Tạo danh sách sản phẩm quan tâm
    const interestedProducts = [
      ...new Set([
        ...favoriteProducts,
        ...cartProducts,
        ...purchasedProducts,
        ...cancelledProducts,
      ]),
    ];

    await trainModel();

    const products = await Product.find()
      .populate("category_id", "name")
      .populate("brand", "name");

    // Tính điểm tương đồng cho từng sản phẩm trong cửa hàng với danh sách sản phẩm quan tâm
    const productScores = products.map((product, index) => {
      const scores = interestedProducts.map((interestedProduct) => {
        if (!interestedProduct || !interestedProduct._id) return 0;
        const interestedIndex = products.findIndex(
          (p) => p._id.toString() === interestedProduct._id.toString()
        );
        if (interestedIndex === -1) return 0; // Kiểm tra nếu không tìm thấy sản phẩm
        return cosineSim[index][interestedIndex];
      });
      const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      return { product, score: averageScore };
    });

    // Sắp xếp sản phẩm theo điểm số và lấy 10 sản phẩm phù hợp nhất
    const topProducts = productScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((item) => item.product);

    res.status(200).json({
      recommendations: topProducts, // Trả về danh sách 10 sản phẩm phù hợp nhất
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
