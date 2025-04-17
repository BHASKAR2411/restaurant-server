const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const yup = require('yup');
const User = require('../models/User');
const { generateOtp, storeOtp, verifyOtp } = require('../utils/otp');
const uploadToS3 = require('../utils/s3Upload');
const sendEmail = require('../utils/sendEmail');
require('dotenv').config();

const otpSchema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  otp: yup.string().length(6, 'OTP must be 6 digits').required('OTP is required'),
});

exports.signup = async (req, res) => {
  const { restaurantName, ownerName, email, password, confirmPassword } = req.body;
  try {
    // Validate confirmPassword
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    let user = await User.findOne({ where: { email } });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const otp = generateOtp();
    storeOtp(email, otp);
    await sendEmail(email, 'Email Verification', `Your OTP is ${otp}`);

    user = await User.create({
      restaurantName,
      ownerName,
      email,
      password: await bcrypt.hash(password, 10),
    });

    res.status(201).json({ message: 'User created, verify OTP', email });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = await otpSchema.validate(req.body);
    if (!verifyOtp(email, otp)) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({
      token,
      user: {
        id: user.id,
        restaurantName: user.restaurantName,
        ownerName: user.ownerName,
        email: user.email,
        upiId: user.upiId,
        googleReviewLink: user.googleReviewLink,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(400).json({ message: error.message || 'Invalid request' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({
      token,
      user: {
        id: user.id,
        restaurantName: user.restaurantName,
        ownerName: user.ownerName,
        email: user.email,
        upiId: user.upiId,
        googleReviewLink: user.googleReviewLink,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const otp = generateOtp();
    storeOtp(email, otp);
    await sendEmail(email, 'Password Reset', `Your OTP is ${otp}`);

    res.json({ message: 'OTP sent to email', email });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, otp, password } = req.body;
  try {
    if (!verifyOtp(email, otp)) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateAccount = async (req, res) => {
  const { restaurantName, ownerName, upiId, googleReviewLink } = req.body;
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let profilePicture = user.profilePicture;
    if (req.file) {
      profilePicture = await uploadToS3(req.file, req.user.id);
    }

    user.restaurantName = restaurantName || user.restaurantName;
    user.ownerName = ownerName || user.ownerName;
    user.upiId = upiId || user.upiId;
    user.googleReviewLink = googleReviewLink || user.googleReviewLink;
    user.profilePicture = profilePicture;
    await user.save();

    res.json({
      id: user.id,
      restaurantName: user.restaurantName,
      ownerName: user.ownerName,
      email: user.email,
      upiId: user.upiId,
      googleReviewLink: user.googleReviewLink,
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      id: user.id,
      restaurantName: user.restaurantName,
      ownerName: user.ownerName,
      email: user.email,
      upiId: user.upiId,
      googleReviewLink: user.googleReviewLink,
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};