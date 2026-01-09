const mongoose = require('mongoose');

const PricingConfigSchema = new mongoose.Schema(
    {
        // نوع المسافة
        distanceType: {
            type: String,
            enum: ['short', 'medium', 'long'],
            required: true,
            unique: true
        },

        // السعر الأساسي
        basePrice: {
            type: Number,
            required: true,
            min: 0
        },

        // الوصف
        description: { type: String },

        // هل هذا السعر نشط؟
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

// فهرس لتحسين الأداء
PricingConfigSchema.index({ distanceType: 1 });

module.exports = mongoose.model('PricingConfig', PricingConfigSchema);
