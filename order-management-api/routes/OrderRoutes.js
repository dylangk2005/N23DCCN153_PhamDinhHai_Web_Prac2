const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Helper function để chuẩn hóa Response
const sendResponse = (res, status, success, message, data = null) => {
    return res.status(status).json({
        success: success,
        message: message,
        data: data
    });
};

// 1. Lấy danh sách đơn hàng (Tích hợp Lọc, Tìm kiếm, Sắp xếp)
router.get('/', async (req, res) => {
    try {
        const { status, name, sort } = req.query; // Lấy dữ liệu từ URL (?status=...&name=...)
        let query = {};

        // Yêu cầu 1: Lọc theo trạng thái đơn hàng
        if (status) {
            query.status = status;
        }

        // Yêu cầu 2: Tìm kiếm theo tên khách hàng (Dùng Regex để tìm kiếm gần đúng)
        if (name) {
            query.customerName = { $regex: name, $options: 'i' }; // 'i' là không phân biệt hoa thường
        }

        // Tạo biến để xử lý sắp xếp
        let sortQuery = { createdAt: -1 }; // Mặc định là đơn mới nhất lên đầu

        // Yêu cầu 3: Sắp xếp theo tổng tiền
        if (sort === 'asc') {
            sortQuery = { totalAmount: 1 };
        } else if (sort === 'desc') {
            sortQuery = { totalAmount: -1 };
        }

        const orders = await Order.find(query).sort(sortQuery);

        sendResponse(res, 200, true, `Tìm thấy ${orders.length} đơn hàng`, orders);
    } catch (err) {
        sendResponse(res, 500, false, err.message);
    }
});

// 2. Lấy đơn hàng theo ID (GET /api/orders/:id)
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return sendResponse(res, 404, false, 'Khong tim thay don hang');

        sendResponse(res, 200, true, "Tìm thấy đơn hàng", order);
    } catch (err) {
        sendResponse(res, 500, false, err.message);
    }
});

// 3. Tạo đơn hàng mới (POST /api/orders)
router.post('/', async (req, res) => {
    try {
        const { customerName, customerEmail, items, totalAmount } = req.body;

        // --- MỞ RỘNG: Validation nâng cao ---
        const calculatedTotal = items.reduce((sum, item) => {
            return sum + (item.quantity * item.unitPrice);
        }, 0);

        if (calculatedTotal !== totalAmount) {
            return sendResponse(res, 400, false, `Tổng tiền không khớp! Tính toán: ${calculatedTotal}, Gửi lên: ${totalAmount}`);
        }
        // ------------------------------------

        const order = new Order({
            customerName,
            customerEmail,
            items,
            totalAmount
        });

        const newOrder = await order.save();
        sendResponse(res, 201, true, "Tạo đơn hàng thành công", newOrder);
    } catch (err) {
        sendResponse(res, 400, false, err.message);
    }
});

// 4. Cập nhật trạng thái đơn hàng (PUT /api/orders/:id)
router.put('/:id', async (req, res) => {
    try {
        // Nếu trong request body có thay đổi items/totalAmount, ta cũng nên validate lại
        if (req.body.items && req.body.totalAmount) {
            const calculatedTotal = req.body.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
            if (calculatedTotal !== req.body.totalAmount) {
                return sendResponse(res, 400, false, "Cập nhật thất bại: Tổng tiền không khớp!");
            }
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedOrder) return sendResponse(res, 404, false, 'Khong tim thay don hang');

        sendResponse(res, 200, true, "Cập nhật đơn hàng thành công", updatedOrder);
    } catch (err) {
        sendResponse(res, 400, false, err.message);
    }
});

// 5. Xóa đơn hàng (DELETE /api/orders/:id)
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Order.findByIdAndDelete(req.params.id);
        if (!deleted) return sendResponse(res, 404, false, 'Khong tim thay don hang');

        sendResponse(res, 200, true, 'Da xoa don hang thanh cong!');
    } catch (err) {
        sendResponse(res, 500, false, err.message);
    }
});

module.exports = router;

