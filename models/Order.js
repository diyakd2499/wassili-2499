const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
    {
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        captain: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        
        // تفاصيل الاستلام
        pickup: {
            address: { type: String, required: true },
            contactName: { type: String, required: true },
            contactPhone: { type: String, required: true },
            lat: { type: Number },
            lng: { type: Number }
        },

        // تفاصيل التسليم
        dropoff: {
            address: { type: String, required: true },
            receiverName: { type: String, required: true },
            receiverPhone: { type: String, required: true },
            lat: { type: Number },
            lng: { type: Number }
        },

        details: { type: String },

        // السعر والمسافة
        distanceType: { 
            type: String, 
            enum: ['short', 'medium', 'long'],
            required: true 
        },
        price: { type: Number, required: true },
        estimatedDistance: { type: Number },

        // حالة الطلب
        status: {
            type: String,
            enum: ['pending', 'accepted', 'in_progress', 'delivered', 'cancelled'],
            default: 'pending',
        },

        // أوقات مهمة
        acceptedAt: { type: Date },
        deliveredAt: { type: Date },
        cancelledAt: { type: Date },
        cancelReason: { type: String },
    },
    { timestamps: true }
);

// فهارس لتحسين الأداء
OrderSchema.index({ client: 1, createdAt: -1 });
OrderSchema.index({ captain: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ 'pickup.lat': 1, 'pickup.lng': 1 });
OrderSchema.index({ 'dropoff.lat': 1, 'dropoff.lng': 1 });

module.exports = mongoose.model('Order', OrderSchema);