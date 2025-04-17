const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  restaurantName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ownerName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  profilePicture: {
    type: DataTypes.STRING, // URL to image (e.g., stored in S3)
    allowNull: true,
  },
  upiId: {
    type: DataTypes.STRING, // e.g., merchant@upi
    allowNull: true,
  },
  googleReviewLink: {
    type: DataTypes.STRING, // URL for Google Reviews
    allowNull: true,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

module.exports = User;