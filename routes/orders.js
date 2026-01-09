const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const { protect, captainOnly, clientOnly } = require('../middleware/authMiddleware');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const { isValidPrice, isValidDistanceType } = require('../utils/validation');

// @route   POST /api/orders
// @desc    Create a new order (with duplicate check)
router.post('/', protect, clientOnly, asyncHandler(async (req, res) => {
    const { pickup, dropoff, details, price, distanceType } = req.body;

    // التحقق من المدخلات
    if (!pickup || !dropoff || !price || !details) {
        throw new AppError('جميع الحقول مطلوبة', 400);
    }

    if (!isValidPrice(price)) {
        throw new AppError('السعر يجب أن يكون رقم موجب', 400);
    }

    if (!isValidDistanceType(distanceType)) {
        throw new AppError('نوع المسافة غير صحيح', 400);
    }

    // التحقق من بيانات الاستلام
    if (typeof pickup.address !== 'string' || !pickup.address.trim()) {
        throw new AppError('عنوان الاستلام مطلوب', 400);
    }

    if (typeof pickup.contactName !== 'string' || !pickup.contactName.trim()) {
        throw new AppError('اسم الشخص في الاستلام مطلوب', 400);
    }

    if (typeof pickup.contactPhone !== 'string' || !pickup.contactPhone.trim()) {
        throw new AppError('رقم الهاتف في الاستلام مطلوب', 400);
    }

    // التحقق من بيانات التسليم
    if (typeof dropoff.address !== 'string' || !dropoff.address.trim()) {
        throw new AppError('عنوان التسليم مطلوب', 400);
    }

    if (typeof dropoff.receiverName !== 'string' || !dropoff.receiverName.trim()) {
        throw new AppError('اسم المستلم مطلوب', 400);
    }

    if (typeof dropoff.receiverPhone !== 'string' || !dropoff.receiverPhone.trim()) {
        throw new AppError('رقم الهاتف للمستلم مطلوب', 400);
    }

    // Duplicate Check - منع الطلبات المكررة في فترة قصيرة
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const duplicateOrder = await Order.findOne({
        client: req.user.id,
        price: price,
        'pickup.address': pickup.address,
        status: 'pending',
        createdAt: { $gt: oneMinuteAgo }
    });

    if (duplicateOrder) {
        throw new AppError('لقد أرسلت هذا الطلب مؤخراً. يرجى الانتظار قبل إرسال طلب جديد', 400);
    }

    // إنشاء الطلب
    const order = await Order.create({
        client: req.user.id,
        pickup: {
            address: pickup.address.trim(),
            contactName: pickup.contactName.trim(),
            contactPhone: pickup.contactPhone.trim(),
            lat: pickup.lat,
            lng: pickup.lng
        },
        dropoff: {
            address: dropoff.address.trim(),
            receiverName: dropoff.receiverName.trim(),
            receiverPhone: dropoff.receiverPhone.trim(),
            lat: dropoff.lat,
            lng: dropoff.lng
        },
        details: details.trim(),
        distanceType,
        price,
        status: 'pending'
    });

    res.status(201).json({
        success: true,
        message: 'تم إنشاء الطلب بنجاح',
        order
    });
}));

// @route   GET /api/orders/my-orders
// @desc    Get my orders (for clients)
router.get('/my-orders', protect, clientOnly, asyncHandler(async (req, res) => {
    const orders = await Order.find({ client: req.user.id })
        .populate('captain', 'name phone rating')
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        count: orders.length,
        orders
    });
}));

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel an order by the client
router.put('/:id/cancel', protect, clientOnly, asyncHandler(async (req, res) => {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
        throw new AppError('الطلب غير موجود', 404);
    }

    if (order.client.toString() !== req.user.id) {
        throw new AppError('أنت غير مصرح بإلغاء هذا الطلب', 403);
    }

    if (order.status !== 'pending' && order.status !== 'accepted') {
        throw new AppError('لا يمكن إلغاء هذا الطلب في هذه الحالة', 400);
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelReason = reason || 'ملغي من قبل العميل';
    await order.save();

    res.json({
        success: true,
        message: 'تم إلغاء الطلب بنجاح',
        order
    });
}));

// @route   GET /api/orders
// @desc    Get available orders (for captains)
router.get('/', protect, captainOnly, asyncHandler(async (req, res) => {
    const orders = await Order.find({ status: 'pending' })
        .populate('client', 'name phone')
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        count: orders.length,
        orders
    });
}));

// @route   PUT /api/orders/:id/accept
// @desc    Accept an order (captain)
router.put('/:id/accept', protect, captainOnly, asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        throw new AppError('الطلب غير موجود', 404);
    }

    if (order.status !== 'pending') {
        throw new AppError('هذا الطلب غير متاح للقبول', 400);
    }

    order.captain = req.user.id;
    order.status = 'accepted';
    order.acceptedAt = new Date();
    await order.save();

    // تحديث إحصائيات الكابتن
    await User.findByIdAndUpdate(req.user.id, {
        $inc: { totalOrders: 1 }
    });

    res.json({
        success: true,
        message: 'تم قبول الطلب بنجاح',
        order
    });
}));

// @route   PUT /api/orders/:id/in-progress
// @desc    Mark order as in progress (captain)
router.put('/:id/in-progress', protect, captainOnly, asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        throw new AppError('الطلب غير موجود', 404);
    }

    if (order.captain.toString() !== req.user.id) {
        throw new AppError('أنت غير مصرح بتحديث هذا الطلب', 403);
    }

    if (order.status !== 'accepted') {
        throw new AppError('الطلب يجب أن يكون مقبولاً أولاً', 400);
    }

    order.status = 'in_progress';
    await order.save();

    res.json({
        success: true,
        message: 'تم تحديث حالة الطلب إلى قيد التنفيذ',
        order
    });
}));

// @route   PUT /api/orders/:id/deliver
// @desc    Mark an order as delivered (captain)
router.put('/:id/deliver', protect, captainOnly, asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        throw new AppError('الطلب غير موجود', 404);
    }

    if (order.captain.toString() !== req.user.id) {
        throw new AppError('أنت غير مصرح بتسليم هذا الطلب', 403);
    }

    if (order.status !== 'in_progress' && order.status !== 'accepted') {
        throw new AppError('الطلب يجب أن يكون مقبولاً أو قيد التنفيذ', 400);
    }

    order.status = 'delivered';
    order.deliveredAt = new Date();
    await order.save();

    // تحديث الأرباح للكابتن
    await User.findByIdAndUpdate(req.user.id, {
        $inc: { totalEarnings: order.price }
    });

    res.json({
        success: true,
        message: 'تم تسليم الطلب بنجاح',
        order
    });
}));

// @route   GET /api/orders/my-missions
// @desc    Get my missions (captain)
router.get('/my-missions', protect, captainOnly, asyncHandler(async (req, res) => {
    const orders = await Order.find({ captain: req.user.id })
        .populate('client', 'name phone')
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        count: orders.length,
        orders
    });
}));

// @route   GET /api/orders/:id
// @desc    Get order details
router.get('/:id', protect, asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('client', 'name phone email')
        .populate('captain', 'name phone rating');

    if (!order) {
        throw new AppError('الطلب غير موجود', 404);
    }

    // التحقق من الصلاحية
    if (order.client.toString() !== req.user.id && order.captain?.toString() !== req.user.id && req.user.role !== 'admin') {
        throw new AppError('أنت غير مصرح بعرض هذا الطلب', 403);
    }

    res.json({
        success: true,
        order
    });
}));

module.exports = router;
