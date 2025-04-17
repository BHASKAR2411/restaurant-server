const express = require('express');
const { signup, verifyOtp, login, forgotPassword, resetPassword, updateAccount, getUser } = require('../controllers/userController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/multer');
const yup = require('yup');

const router = express.Router();

// Validation schemas
const signupSchema = yup.object().shape({
  restaurantName: yup.string().required('Restaurant name is required'),
  ownerName: yup.string().required('Owner name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required('Confirm password is required'),
});

const loginSchema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

const forgotPasswordSchema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
});

const resetPasswordSchema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  otp: yup.string().length(6, 'OTP must be 6 digits').required('OTP is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

const updateAccountSchema = yup.object().shape({
  restaurantName: yup.string(),
  ownerName: yup.string(),
  upiId: yup.string(),
  googleReviewLink: yup.string().url('Invalid URL'),
  profilePicture: yup.string(),
});

// Routes
router.post('/signup', validate(signupSchema), signup);
router.post('/verify-otp', verifyOtp);
router.post('/login', validate(loginSchema), login);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.put('/account', auth, upload.single('profilePicture'), validate(updateAccountSchema), updateAccount);
router.get('/:id', getUser);

module.exports = router;