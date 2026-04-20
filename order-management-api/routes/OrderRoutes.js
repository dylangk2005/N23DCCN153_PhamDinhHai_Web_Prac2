const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
// 1. Lay toan bo don hang (GET /api/orders)
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// 2. Lay don hang theo ID (GET /api/orders/:id)
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({
            message: 'Khong tim thay don hang'
        });
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 3. Tao don hang moi (POST /api/orders)
router.post('/', async (req, res) => {
    const order = new Order({
        customerName: req.body.customerName,
        customerEmail: req.body.customerEmail,
        items: req.body.items,
        totalAmount: req.body.totalAmount
    });
    try {
        const newOrder = await order.save();
        res.status(201).json(newOrder);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});
// 4. Cap nhat trang thai don hang (PUT /api/orders/:id)
router.put('/:id', async (req, res) => {
    try {
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedOrder) return res.status(404).json({
            message: 'Khong tim thay don hang'
        });
        res.json(updatedOrder);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});
// 5. Xoa don hang (DELETE /api/orders/:id)
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Order.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({
            message: 'Khong tim thay don hang'
        });
        res.json({ message: 'Da xoa don hang thanh cong!' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
module.exports = router;