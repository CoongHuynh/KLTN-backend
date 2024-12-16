const Cart = require("../models/Cart");
const CartItem = require("../models/CartItem");
const Product = require("../models/Product");

const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user._id; // Lấy _id của người dùng từ middleware

    // Kiểm tra xem sản phẩm có tồn tại không
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Kiểm tra xem giỏ hàng của người dùng đã tồn tại chưa
    let cart = await Cart.findOne({ user_id: userId }).populate(
      "items.product_id"
    );
    if (!cart) {
      // Nếu giỏ hàng chưa tồn tại, tạo giỏ hàng mới
      cart = new Cart({ user_id: userId, items: [], total_price: 0 });
    }

    // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
    let cartItem = await CartItem.findOne({
      cart_id: cart._id,
      product_id: productId,
    });

    // Tính tổng số lượng sản phẩm trong giỏ hàng sau khi thêm hoặc cập nhật
    const newQuantity = cartItem
      ? cartItem.quantity + parseInt(quantity, 10)
      : parseInt(quantity, 10);

    // Kiểm tra nếu tổng số lượng vượt quá stock
    if (newQuantity > product.stock) {
      return res.status(400).json({ message: "Quantity exceeds stock" });
    }

    if (cartItem) {
      // Nếu sản phẩm đã có trong giỏ hàng, cập nhật số lượng
      cartItem.quantity = newQuantity;
      await cartItem.save();
    } else {
      // Nếu sản phẩm chưa có trong giỏ hàng, thêm sản phẩm mới
      cartItem = new CartItem({
        cart_id: cart._id,
        product_id: productId,
        quantity: newQuantity,
      });
      await cartItem.save();
      cart.items.push(cartItem._id);
    }

    // Tính tổng giá hiện tại của giỏ hàng
    let currentTotalPrice = 0;
    for (const item of cart.items) {
      const cartItem = await CartItem.findById(item).populate("product_id");
      currentTotalPrice += cartItem.product_id.price * cartItem.quantity;
    }

    // Cập nhật tổng giá với sản phẩm mới thêm hoặc cập nhật
    cart.total_price = currentTotalPrice;

    // Lưu giỏ hàng
    await cart.save();

    // Populate lại giỏ hàng để lấy thông tin cập nhật
    cart = await Cart.findById(cart._id).populate("items.product_id");

    res.status(200).json(cart);
  } catch (error) {
    console.error(error); // Log lỗi chi tiết ra console
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getCart = async (req, res) => {
  try {
    const userId = req.user._id; // Lấy _id của người dùng từ middleware

    // Lấy giỏ hàng của người dùng
    const cart = await Cart.findOne({ user_id: userId }).populate(
      "items.product_id"
    );

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Lấy thông tin chi tiết của các mục trong giỏ hàng
    const cartItems = await CartItem.find({ cart_id: cart._id }).populate(
      "product_id"
    );

    // Kiểm tra số lượng sản phẩm và tính lại tổng giá
    let total_price = 0;
    const items = [];

    for (const item of cartItems) {
      const product = item.product_id;
      if (item.quantity > product.stock) {
        return res.status(400).json({
          message: `Product ${product.name} is out of stock. Available stock: ${product.stock}`,
        });
      }
      total_price += product.price * item.quantity;
      items.push({
        _id: item._id,
        product: product,
        quantity: item.quantity,
      });
    }

    // Tạo phản hồi bao gồm thông tin sản phẩm và số lượng
    const cartResponse = {
      _id: cart._id,
      user_id: cart.user_id,
      items: items,
      total_price: total_price,
      total_items: items.length,
    };

    res.status(200).json(cartResponse); // Trả về thông tin giỏ hàng
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
const deleteCartItem = async (req, res) => {
  try {
    const { id } = req.params; // ObjectId của CartItem
    const userId = req.user._id; // Lấy _id của người dùng từ middleware

    // Kiểm tra xem giỏ hàng của người dùng đã tồn tại chưa
    let cart = await Cart.findOne({ user_id: userId }).populate(
      "items.product_id"
    );
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Kiểm tra xem sản phẩm có trong giỏ hàng không
    const cartItemIndex = cart.items.findIndex(
      (item) => item._id.toString() === id
    );
    if (cartItemIndex === -1) {
      return res.status(404).json({
        message: "Product not found in cart",
        cart: cart,
        cartItemIndex: cartItemIndex,
      });
    }

    // Xóa sản phẩm khỏi giỏ hàng
    const cartItem = cart.items[cartItemIndex];
    await CartItem.findByIdAndDelete(cartItem._id);
    cart.items.splice(cartItemIndex, 1);

    // Tính lại tổng giá của giỏ hàng
    let currentTotalPrice = 0;
    for (const item of cart.items) {
      const cartItem = await CartItem.findById(item).populate("product_id");
      currentTotalPrice += cartItem.product_id.price * cartItem.quantity;
    }

    // Cập nhật tổng giá
    cart.total_price = currentTotalPrice;

    // Lưu giỏ hàng
    await cart.save();

    // Populate lại giỏ hàng để lấy thông tin cập nhật
    cart = await Cart.findById(cart._id).populate("items.product_id");

    res.status(200).json(cart);
  } catch (error) {
    console.error(error); // Log lỗi chi tiết ra console
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { id, quantity } = req.body;
    console.log("Backend received id:", id, "and quantity:", quantity);

    // Tìm sản phẩm trong giỏ hàng theo ID
    const cartItem = await CartItem.findById(id);
    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    // Cập nhật số lượng sản phẩm
    cartItem.quantity = quantity;
    const updatedCartItem = await cartItem.save();

    res.status(200).json(updatedCartItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    // Xóa tất cả các sản phẩm trong giỏ hàng của người dùng
    await CartItem.deleteMany({ user: userId });

    res.status(200).json({ message: "Cart cleared successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  addToCart,
  getCart,
  deleteCartItem,
  updateCartItem,
  clearCart,
};
