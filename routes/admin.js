const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const Review = require('../models/Review');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { asyncHandler, AppError } = require('../utils/errorHandler');

// @route   GET /api/admin/dashboard
// @desc    Get dashboard statistics
router.get('/dashboard', protect, adminOnly, asyncHandler(async (req, res) => {
    const totalUsers = await User.countDocuments();
    const totalCaptains = await User.countDocuments({ role: 'captain' });
    const totalClients = await User.countDocuments({ role: 'client' });
    const totalOrders = await Order.countDocuments();
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

    // حساب الإيرادات الكلية
    const deliveredOrdersData = await Order.find({ status: 'delivered' });
    const totalRevenue = deliveredOrdersData.reduce((sum, order) => sum + order.price, 0);

    // أفضل الكباتن
    const topCaptains = await User.find({ role: 'captain' })
        .sort({ rating: -1, totalOrders: -1 })
        .limit(5)
        .select('name email phone rating totalOrders totalEarnings');

    // الشكاوى المعلقة
    const pendingComplaints = await Review.countDocuments({
        type: 'complaint',
        complaintStatus: 'pending'
    });

    res.json({
        success: true,
        dashboard: {
            users: {
                total: totalUsers,
                captains: totalCaptains,
                clients: totalClients
            },
            orders: {
                total: totalOrders,
                delivered: deliveredOrders,
                pending: pendingOrders,
                cancelled: cancelledOrders
            },
            revenue: {
                total: totalRevenue,
                average: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0
            },
            topCaptains,
            pendingComplaints
        }
    });
}));

// @route   GET /api/admin/users
// @desc    Get all users with pagination
router.get('/users', protect, adminOnly, asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, role, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (role) {
        query.role = role;
    }

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } }
        ];
    }

    const users = await User.find(query)
        .select('-password')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
        success: true,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / limit)
        },
        users
    });
}));

// @route   GET /api/admin/users/:id
// @desc    Get user details
router.get('/users/:id', protect, adminOnly, asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
        throw new AppError('المستخدم غير موجود', 404);
    }

    // الحصول على إحصائيات المستخدم
    let stats = {};
    if (user.role === 'captain') {
        stats = {
            totalOrders: user.totalOrders,
            totalEarnings: user.totalEarnings,
            rating: user.rating
        };
    } else if (user.role === 'client') {
        const clientOrders = await Order.countDocuments({ client: user._id });
        stats = { totalOrders: clientOrders };
    }

    res.json({
        success: true,
        user,
        stats
    });
}));

// @route   PUT /api/admin/users/:id/toggle-status
// @desc    Toggle user active status
router.put('/users/:id/toggle-status', protect, adminOnly, asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        throw new AppError('المستخدم غير موجود', 404);
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
        success: true,
        message: `تم ${user.isActive ? 'تفعيل' : 'إيقاف'} الحساب بنجاح`,
        user
    });
}));

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
router.put('/users/:id/role', protect, adminOnly, asyncHandler(async (req, res) => {
    const { role } = req.body;

    if (!['customer', 'client', 'captain', 'admin'].includes(role)) {
        throw new AppError('دور غير صحيح', 400);
    }

    const user = await User.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true }
    ).select('-password');

    if (!user) {
        throw new AppError('المستخدم غير موجود', 404);
    }

    res.json({
        success: true,
        message: 'تم تحديث الدور بنجاح',
        user
    });
}));

// @route   GET /api/admin/orders
// @desc    Get all orders with filters
router.get('/orders', protect, adminOnly, asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) {
        query.status = status;
    }

    const orders = await Order.find(query)
        .populate('client', 'name email phone')
        .populate('captain', 'name email phone')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

    const total = await Order.countDocuments(query);

    res.json({
        success: true,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / limit)
        },
        orders
    });
}));

// @route   GET /api/admin/reports
// @desc    Get system reports
router.get('/reports', protect, adminOnly, asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    let dateQuery = {};
    if (startDate && endDate) {
        dateQuery = {
            createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };
    }

    const ordersInPeriod = await Order.find(dateQuery);
    const deliveredInPeriod = ordersInPeriod.filter(o => o.status === 'delivered');
    const revenueInPeriod = deliveredInPeriod.reduce((sum, o) => sum + o.price, 0);

    const averageOrderValue = ordersInPeriod.length > 0
        ? (revenueInPeriod / ordersInPeriod.length).toFixed(2)
        : 0;

    res.json({
        success: true,
        report: {
            period: {
                startDate: startDate || 'البداية',
                endDate: endDate || 'النهاية'
            },
            orders: {
                total: ordersInPeriod.length,
                delivered: deliveredInPeriod.length,
                successRate: ordersInPeriod.length > 0
                    ? ((deliveredInPeriod.length / ordersInPeriod.length) * 100).toFixed(2) + '%'
                    : '0%'
            },
            revenue: {
                total: revenueInPeriod,
                average: averageOrderValue
            }
        }
    });
}));

module.exports = router;
