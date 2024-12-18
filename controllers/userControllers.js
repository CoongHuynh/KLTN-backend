const User = require("../models/User");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const CartItem = require("../models/CartItem");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validateLength, validateEmail } = require("../helpers/validation");
const { sendEmail } = require("../helpers/sendEmail");
const { generateToken } = require("../helpers/createToken");
exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      address,
      phone,
      gender,
      isAdmin = false,
    } = req.body;

    // Validate dữ liệu
    if (!validateLength(name, 3, 50)) {
      return res
        .status(400)
        .json({ error: "Name must be between 3 and 50 characters" });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    if (!validateLength(password, 6, 100)) {
      return res
        .status(400)
        .json({ error: "Password must be between 6 and 100 characters" });
    }
    if (!validateLength(phone, 10, 15)) {
      return res
        .status(400)
        .json({ error: "Phone number must be between 10 and 15 characters" });
    }

    // Kiểm tra xem email đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo người dùng mới
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      address,
      phone,
      gender,
      isAdmin: req.user && req.user.isAdmin ? isAdmin : false, // Nếu người dùng hiện tại là quản trị viên thì tạo người dùng mới với quyền quản trị viên
    });

    // Lưu người dùng vào cơ sở dữ liệu
    await newUser.save();
    const emailVerificationToken = generateToken(
      { id: newUser._id.toString() },
      "1h"
    );
    const url = `${process.env.BASE_URL}/activate/${emailVerificationToken}`;
    // Gửi email xác nhận
    try {
      await sendEmail(newUser.email, newUser.name, url);
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      return res
        .status(500)
        .json({ error: "Error sending verification email" });
    }

    const token = generateToken({ id: newUser._id.toString() }, "7d");

    res.status(201).json({
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      address: newUser.address,
      phone: newUser.phone,
      gender: newUser.gender,
      token: token,
      verified: newUser.verified,
      message: "Register Success! Please activate your email to start",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
exports.activateAccount = async (req, res) => {
  try {
    const { token } = req.body;
    const user = jwt.verify(token, process.env.JWT_SECRET);
    const check = await User.findById(user.id);
    if (!check) {
      return res.status(400).json({ message: "User not found" });
    }
    if (check.verified) {
      return res
        .status(400)
        .json({ message: "This email is already activated" });
    } else {
      await User.findByIdAndUpdate(user.id, { verified: true });
      return res
        .status(200)
        .json({ message: "Account has been activated successfully." });
    }
  } catch (error) {
    console.error("Error in activateAccount:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kiểm tra xem người dùng có tồn tại không
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Kiểm tra tài khoản đã được kích hoạt chưa
    if (!user.verified) {
      return res.status(400).json({
        error:
          "Account is not activated. Please activate your account on the email sent to you.",
      });
    }

    // Tạo token
    const token = generateToken({ id: user._id.toString() }, "7d");

    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      address: user.address,
      phone: user.phone,
      gender: user.gender,
      token: token,
      verified: user.verified,
      isAdmin: user.isAdmin,
      message: "Login Success!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
exports.getAllUsers = async (req, res) => {
  try {
    // Kiểm tra quyền hạn của người dùng (chỉ dành cho quản trị viên)
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Lấy tất cả người dùng từ cơ sở dữ liệu
    const users = await User.find();

    res.status(200).json(users);
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    // Kiểm tra quyền hạn của người dùng (chỉ dành cho quản trị viên hoặc chính người dùng đó)
    if (
      !req.user ||
      (!req.user.isAdmin && req.user._id.toString() !== userId)
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Tìm người dùng theo ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error in getUserById:", error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.sendVerification = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy id của người dùng từ req
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verified) {
      return res.status(400).json({ message: "User already verified" });
    }

    // Tạo token xác thực
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Tạo URL xác thực
    const url = `${process.env.CLIENT_URL}/verify/${token}`;

    // Gửi email xác thực
    await sendEmail(user.email, user.name, url);

    res.status(200).json({ message: "Verification email sent" });
  } catch (error) {
    console.error("Error sending verification email:", error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.sendCodeResetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Tạo mã reset password ngẫu nhiên
    const resetCode = crypto.randomBytes(3).toString("hex").toUpperCase();

    // Lưu mã reset password vào cơ sở dữ liệu
    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 giờ
    await user.save();

    // Gửi mã reset password qua email
    await sendCode(user.email, user.name, resetCode);

    res.status(200).json({ message: "Reset password code sent" });
  } catch (error) {
    console.error("Error sending reset password code:", error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.verifyCodeResetPassword = async (req, res) => {
  try {
    const { email, code } = req.body;

    // Tìm người dùng bằng email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Kiểm tra mã reset password và thời gian hết hạn
    if (
      user.resetPasswordCode !== code ||
      user.resetPasswordExpires < Date.now()
    ) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset password code" });
    }

    // Trả về kết quả kiểm tra
    res.status(200).json({ message: "Reset password code is valid" });
  } catch (error) {
    console.error("Error verifying reset password code:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      isAdmin,
      password,
      gender,
      verified = false,
    } = req.body;

    // Validate data
    if (!validateLength(name, 3, 50)) {
      console.error(
        "Validation error: Name must be between 3 and 50 characters"
      );
      return res
        .status(400)
        .json({ error: "Name must be between 3 and 50 characters" });
    }
    if (!validateEmail(email)) {
      console.error("Validation error: Invalid email format");
      return res.status(400).json({ error: "Invalid email format" });
    }
    if (!validateLength(phone, 10, 15)) {
      console.error(
        "Validation error: Phone number must be between 10 and 15 characters"
      );
      return res
        .status(400)
        .json({ error: "Phone number must be between 10 and 15 characters" });
    }
    if (!validateLength(password, 6, 100)) {
      console.error(
        "Validation error: Password must be between 6 and 100 characters"
      );
      return res
        .status(400)
        .json({ error: "Password must be between 6 and 100 characters" });
    }
    if (!gender) {
      console.error("Validation error: Gender is required");
      return res.status(400).json({ error: "Gender is required" });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.error("Validation error: Email already exists");
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Hashed password:", hashedPassword);

    // Create a new user
    const newUser = new User({
      name,
      email,
      phone,
      address,
      password: hashedPassword,
      gender,
      verified: req.user && req.user.isAdmin ? verified : false, // Giá trị mặc định là false
      isAdmin: req.user && req.user.isAdmin ? isAdmin : false,
    });

    // Save the new user to the database
    await newUser.save();
    console.log("New user created:", newUser);

    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error in createUser:", error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Email not found" });
    }

    // Generate password reset token
    const resetToken = generateToken({ id: user._id.toString() }, "1h");
    const resetUrl = `${process.env.BASE_URL}/reset-password/${resetToken}`;

    // Send password reset email
    try {
      await sendEmail(
        user.email,
        user.name,
        resetUrl,
        "Password Reset Request"
      );
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      return res
        .status(500)
        .json({ error: "Error sending password reset email" });
    }

    res.status(200).json({ message: "Password reset email sent successfully" });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(400).json({ error: "Invalid token or user not found" });
    }

    // Validate new password
    if (!validateLength(newPassword, 6, 100)) {
      return res
        .status(400)
        .json({ error: "Password must be between 6 and 100 characters" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming you have user ID in req.user
    const {
      firstName,
      lastName,
      email,
      address,
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    // Validate data
    if (!validateLength(firstName, 3, 50)) {
      return res
        .status(400)
        .json({ error: "First name must be between 3 and 50 characters" });
    }
    if (!validateLength(lastName, 3, 50)) {
      return res
        .status(400)
        .json({ error: "Last name must be between 3 and 50 characters" });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    if (currentPassword && !validateLength(currentPassword, 6, 100)) {
      return res.status(400).json({
        error: "Current password must be between 6 and 100 characters",
      });
    }
    if (newPassword && !validateLength(newPassword, 6, 100)) {
      return res
        .status(400)
        .json({ error: "New password must be between 6 and 100 characters" });
    }
    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ error: "New password and confirm password do not match" });
    }

    // Split address string into an object
    const addressParts = address.split(", ");
    const addressObject = {
      street: addressParts[0],
      city: addressParts[1],
      country: addressParts[2],
    };

    // Validate address fields
    if (
      !addressObject.street ||
      !addressObject.city ||
      !addressObject.country
    ) {
      return res
        .status(400)
        .json({ error: "Address, city, and country are required" });
    }

    // Find user by ID and update profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, email, address: addressObject },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update password if provided
    if (currentPassword && newPassword) {
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        updatedUser.password
      );
      if (!isPasswordValid) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
      updatedUser.password = await bcrypt.hash(newPassword, 10);
      await updatedUser.save();
    }

    res
      .status(200)
      .json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error in updateProfile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Kiểm tra quyền hạn của người dùng (chỉ dành cho quản trị viên)
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }
    await Cart.deleteOne({ user_id: userId });

    await CartItem.deleteMany({ user_id: userId });

    await Order.deleteMany({ user_id: userId });

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error in deleteUser:", error);
    res.status(500).json({ message: "Server error" });
  }
};
