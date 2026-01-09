const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Order = require('../models/Order');
const { protect } = require('../middleware/authMiddleware');
const { asyncHandler, AppError } = require('../utils/errorHandler');

// @route   POST /api/messages
// @desc    Send a message
router.post('/', protect, asyncHandler(async (req, res) => {
    const { orderId, recipientId, message } = req.body;

    if (!orderId || !recipientId || !message) {
        throw new AppError('جميع الحقول مطلوبة', 400);
    }

    if (typeof message !== 'string' || !message.trim()) {
        throw new AppError('الرسالة لا يمكن أن تكون فارغة', 400);
    }

    // التحقق من وجود الطلب
    const order = await Order.findById(orderId);
    if (!order) {
        throw new AppError('الطلب غير موجود', 404);
    }

    // التحقق من أن المستخدم الحالي مرتبط بالطلب
    if (order.client.toString() !== req.user.id && order.captain?.toString() !== req.user.id) {
        throw new AppError('أنت غير مصرح بإرسال رسائل لهذا الطلب', 403);
    }

    // إنشاء الرسالة
    const newMessage = await Message.create({
        order: orderId,
        sender: req.user.id,
        recipient: recipientId,
        message: message.trim()
    });

    res.status(201).json({
        success: true,
        message: 'تم إرسال الرسالة بنجاح',
        data: newMessage
    });
}));

// @route   GET /api/messages/:orderId
// @desc    Get messages for an order
router.get('/:orderId', protect, asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    // التحقق من وجود الطلب
    const order = await Order.findById(orderId);
    if (!order) {
        throw new AppError('الطلب غير موجود', 404);
    }

    // التحقق من أن المستخدم الحالي مرتبط بالطلب
    if (order.client.toString() !== req.user.id && order.captain?.toString() !== req.user.id) {
        throw new AppError('أنت غير مصرح بعرض رسائل هذا الطلب', 403);
    }

    // الحصول على الرسائل
    const messages = await Message.find({ order: orderId })
        .populate('sender', 'name')
        .populate('recipient', 'name')
        .sort({ createdAt: 1 });

    // تحديث حالة القراءة للرسائل الموجهة للمستخدم الحالي
    await Message.updateMany(
        { order: orderId, recipient: req.user.id, isRead: false },
        { isRead: true, readAt: new Date() }
    );

    res.json({
        success: true,
        count: messages.length,
        messages
    });
}));

// @route   PUT /api/messages/:id/read
// @desc    Mark a message as read
router.put('/:id/read', protect, asyncHandler(async (req, res) => {
    const message = await Message.findById(req.params.id);

    if (!message) {
        throw new AppError('الرسالة غير موجودة', 404);
    }

    if (message.recipient.toString() !== req.user.id) {
        throw new AppError('أنت غير مصرح بتحديث هذه الرسالة', 403);
    }

    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    res.json({
        success: true,
        message: 'تم تحديث حالة الرسالة',
        data: message
    });
}));

// @route   GET /api/messages/unread/count
// @desc    Get count of unread messages
router.get('/unread/count', protect, asyncHandler(async (req, res) => {
    const count = await Message.countDocuments({
        recipient: req.user.id,
        isRead: false
    });

    res.json({
        success: true,
        unreadCount: count
    });
}));

module.exports = router;
