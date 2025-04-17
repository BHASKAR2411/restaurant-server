const { Op } = require('sequelize');
const Order = require('../models/Order');

exports.createOrder = async (req, res) => {
  const { tableNo, items, total, restaurantId } = req.body; // Add restaurantId to destructuring
  try {
    const resolvedRestaurantId = restaurantId || items[0]?.restaurantId || req.query.restaurantId;
    if (!resolvedRestaurantId || isNaN(resolvedRestaurantId) || Number(resolvedRestaurantId) <= 0) {
      return res.status(400).json({ message: 'Restaurant ID is required' });
    }

    if (!tableNo || !Number.isInteger(tableNo) || tableNo <= 0) {
      return res.status(400).json({ message: 'Invalid table number' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items must be a non-empty array' });
    }

    const errors = [];
    items.forEach((item, index) => {
      if (!item.id || !item.name || typeof item.isVeg !== 'boolean' || !item.price || !item.quantity) {
        errors.push({
          field: `items[${index}].${!item.id ? 'id' : !item.name ? 'name' : !item.price ? 'price' : !item.quantity ? 'quantity' : 'isVeg'}`,
          message: `items[${index}].${!item.id ? 'id' : !item.name ? 'name' : !item.price ? 'price' : !item.quantity ? 'quantity' : 'isVeg'} is a required field`,
        });
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    if (!total || typeof total !== 'number' || total <= 0) {
      return res.status(400).json({ message: 'Invalid total amount' });
    }

    const order = await Order.create({
      tableNo,
      items,
      total,
      userId: Number(resolvedRestaurantId),
      status: 'live',
    });
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getLiveOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id, status: 'live' },
    });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching live orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPastOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id, status: 'past' },
    });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching past orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.completeOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findOne({ where: { id, userId: req.user.id } });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = 'past';
    await order.save();
    res.json(order);
  } catch (error) {
    console.error('Error completing order:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getOrderStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const dailyOrders = await Order.count({
      where: {
        userId: req.user.id,
        createdAt: { [Op.gte]: today },
      },
    });

    const monthlyOrders = await Order.count({
      where: {
        userId: req.user.id,
        createdAt: { [Op.gte]: monthStart },
      },
    });

    res.json({ dailyOrders, monthlyOrders });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findOne({ where: { id, userId: req.user.id } });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await order.destroy();
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Server error' });
  }
};