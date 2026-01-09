const express = require('express');
const router = express.Router();
const PricingConfig = require('../models/PricingConfig');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const { isValidPrice, isValidDistanceType } = require('../utils/validation');

// @route   GET /api/pricing
// @desc    Get all pricing configurations
router.get('/', asyncHandler(async (req, res) => {
    const pricing = await PricingConfig.find({ isActive: true }).sort({ distanceType: 1 });

    res.json({
        success: true,
        count: pricing.length,
        pricing
    });
}));

// @route   GET /api/pricing/:distanceType
// @desc    Get pricing for a specific distance type
router.get('/:distanceType', asyncHandler(async (req, res) => {
    if (!isValidDistanceType(req.params.distanceType)) {
        throw new AppError('نوع المسافة غير صحيح', 400);
    }

    const pricing = await PricingConfig.findOne({
        distanceType: req.params.distanceType,
        isActive: true
    });

    if (!pricing) {
        throw new AppError('لم يتم العثور على تسعير لهذا النوع', 404);
    }

    res.json({
        success: true,
        pricing
    });
}));

// @route   POST /api/pricing
// @desc    Create a new pricing configuration (admin only)
router.post('/', protect, adminOnly, asyncHandler(async (req, res) => {
    const { distanceType, basePrice, description } = req.body;

    if (!distanceType || !basePrice) {
        throw new AppError('جميع الحقول مطلوبة', 400);
    }

    if (!isValidDistanceType(distanceType)) {
        throw new AppError('نوع المسافة غير صحيح', 400);
    }

    if (!isValidPrice(basePrice)) {
        throw new AppError('السعر يجب أن يكون رقم موجب', 400);
    }

    // التحقق من عدم وجود نفس النوع
    const existing = await PricingConfig.findOne({ distanceType });
    if (existing) {
        throw new AppError('هذا النوع من المسافات موجود بالفعل', 400);
    }

    const pricing = await PricingConfig.create({
        distanceType,
        basePrice,
        description: description || ''
    });

    res.status(201).json({
        success: true,
        message: 'تم إنشاء التسعير بنجاح',
        pricing
    });
}));

// @route   PUT /api/pricing/:id
// @desc    Update pricing configuration (admin only)
router.put('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
    const { basePrice, description, isActive } = req.body;

    const pricing = await PricingConfig.findById(req.params.id);
    if (!pricing) {
        throw new AppError('التسعير غير موجود', 404);
    }

    if (basePrice !== undefined) {
        if (!isValidPrice(basePrice)) {
            throw new AppError('السعر يجب أن يكون رقم موجب', 400);
        }
        pricing.basePrice = basePrice;
    }

    if (description !== undefined) {
        pricing.description = description;
    }

    if (isActive !== undefined) {
        pricing.isActive = isActive;
    }

    await pricing.save();

    res.json({
        success: true,
        message: 'تم تحديث التسعير بنجاح',
        pricing
    });
}));

// @route   DELETE /api/pricing/:id
// @desc    Delete pricing configuration (admin only)
router.delete('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
    const pricing = await PricingConfig.findByIdAndDelete(req.params.id);

    if (!pricing) {
        throw new AppError('التسعير غير موجود', 404);
    }

    res.json({
        success: true,
        message: 'تم حذف التسعير بنجاح'
    });
}));

module.exports = router;
