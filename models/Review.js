const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
    {
        // معرف الطلب
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true
        },

        // العميل الذي يقيم
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        // الكابتن المقيم
        captain: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        // التقييم (1-5)
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },

        // التعليق
        comment: { type: String },

        // نوع المراجعة
        type: {
            type: String,
            enum: ['review', 'complaint'],
            default: 'review'
        },

        // حالة الشكوى (إن وجدت)
        complaintStatus: {
            type: String,
            enum: ['pending', 'resolved', 'rejected'],
            default: 'pending'
        }
    },
    { timestamps: true }
);

// فهارس لتحسين الأداء
ReviewSchema.index({ order: 1 });
ReviewSchema.index({ client: 1 });
ReviewSchema.index({ captain: 1 });
ReviewSchema.index({ type: 1 });
ReviewSchema.index({ complaintStatus: 1 });

module.exports = mongoose.model('Review', ReviewSchema);
