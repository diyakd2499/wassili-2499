const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
    {
        // معرف الطلب المرتبط بالرسالة
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true
        },

        // المرسل والمستقبل
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        // محتوى الرسالة
        message: { type: String, required: true },

        // حالة القراءة
        isRead: { type: Boolean, default: false },
        readAt: { type: Date }
    },
    { timestamps: true }
);

// فهارس لتحسين الأداء
MessageSchema.index({ order: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });
MessageSchema.index({ recipient: 1 });
MessageSchema.index({ isRead: 1 });

module.exports = mongoose.model('Message', MessageSchema);
