const express = require('express');
const { createOrder, getLiveOrders, getPastOrders, completeOrder, getOrderStats, deleteOrder } = require('../controllers/orderController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const yup = require('yup');

const router = express.Router();

const orderSchema = yup.object().shape({
  tableNo: yup.number().positive('Table number must be positive').required('Table number is required'),
  items: yup.array().of(
    yup.object().shape({
      id: yup.number().required(),
      name: yup.string().required(),
      price: yup.number().positive().required(),
      quantity: yup.number().positive().required(),
    })
  ).min(1, 'At least one item is required'),
  total: yup.number().positive('Total must be positive').required('Total is required'),
});

router.post('/', validate(orderSchema), createOrder); // Public for clients
router.get('/live', auth, getLiveOrders);
router.get('/past', auth, getPastOrders);
router.put('/:id/complete', auth, completeOrder);
router.get('/stats', auth, getOrderStats);
router.delete('/:id', auth, deleteOrder); // New route for deletion

module.exports = router;