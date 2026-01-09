const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Order = require('../models/Order');
const User = require('../models/User');
const { protect, clientOnly, adminOnly } = require('../middleware/authMiddleware');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const { isValidRating } = require('../utils/validation');

// @route   POST /api/reviews
// @desc    Create a review or complaint
router.post('/', protect, clientOnly, asyncHandler(async (req, res) => {
    const { orderId, captainId, rating, comment, type } = req.body;

    if (!orderId || !captainId || !rating) {
        throw new AppError('جميع الحقول مطلوبة', 400);
    }

    if (!isValidRating(rating)) {
        throw new AppError('التقييم يجب أن يكون بين 1 و 5', 400);
    }

    if (type && !['review', 'complaint'].includes(type)) {
        throw new AppError('نوع المراجعة غير صحيح', 400);
    }

    // التحقق من وجود الطلب
    const order = await Order.findById(orderId);
    if (!order) {
        throw new AppError('الطلب غير موجود', 404);
    }

    if (order.client.toString() !== req.user.id) {
        throw new AppError('أنت غير مصرح بتقييم هذا الطلب', 403);
    }

    if (order.status !== 'delivered') {
        throw new AppError('يمكنك فقط تقييم الطلبات المسلمة', 400);
    }

    // التحقق من عدم وجود تقييم سابق
    const existingReview = await Review.findOne({ order: orderId, client: req.user.id });
    if (existingReview) {
        throw new AppError('لقد قيمت هذا الطلب مسبقاً', 400);
    }

    // إنشاء التقييم
    const review = await Review.create({
        order: orderId,
        client: req.user.id,
        captain: captainId,
        rating,
        comment: comment?.trim() || '',
        type: type || 'review'
    });

    // تحديث تقييم الكابتن
    const allReviews = await Review.find({ captain: captainId, type: 'review' });
    const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    
    await User.findByIdAndUpdate(captainId, {
        rating: Math.round(averageRating * 10) / 10
    });

    res.status(201).json({
        success: true,
        message: 'تم إضافة التقييم بنجاح',
        review
    });
}));

// @route   GET /api/reviews/captain/:captainId
// @desc    Get reviews for a captain
router.get('/captain/:captainId', asyncHandler(async (req, res) => {
    const reviews = await Review.find({ captain: req.params.captainId, type: 'review' })
        .populate('client', 'name')
        .sort({ createdAt: -1 });

    const complaints = await Review.find({ captain: req.params.captainId, type: 'complaint' })
        .populate('client', 'name')
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        reviews,
        complaints,
        totalReviews: reviews.length,
        totalComplaints: complaints.length
    });
}));

// @route   GET /api/reviews/my-reviews
// @desc    Get my reviews (for captains)
router.get('/my-reviews', protect, asyncHandler(async (req, res) => {
    const reviews = await Review.find({ captain: req.user.id })
        .populate('client', 'name')
        .sort({ createdAt: -1 });

    const averageRating = reviews.length > 0 
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    res.json({
        success: true,
        totalReviews: reviews.length,
        averageRating,
        reviews
    });
}));

// @route   GET /api/reviews/complaints
// @desc    Get all complaints (admin only)
router.get('/complaints', protect, adminOnly, asyncHandler(async (req, res) => {
    const complaints = await Review.find({ type: 'complaint' })
        .populate('client', 'name email')
        .populate('captain', 'name email')
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        totalComplaints: complaints.length,
        complaints
    });
}));

// @route   PUT /api/reviews/:id/resolve
// @desc    Resolve a complaint (admin only)
router.put('/:id/resolve', protect, adminOnly, asyncHandler(async (req, res) => {
    const { status } = req.body;

    if (!['resolved', 'rejected'].includes(status)) {
        throw new AppError('حالة غير صحيحة', 400);
    }

    const review = await Review.findByIdAndUpdate(
        req.params.id,
        { complaintStatus: status },
        { new: true }
    );

    if (!review) {
        throw new AppError('الشكوى غير موجودة', 404);
    }

    res.json({
        success: true,
        message: `تم ${status === 'resolved' ? 'حل' : 'رفض'} الشكوى بنجاح`,
        review
    });
}));

module.exports = router;
