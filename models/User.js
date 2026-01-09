const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        phone: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        
        // الأدوار المدعومة
        role: { 
            type: String, 
            enum: ['customer', 'client', 'captain', 'admin'], 
            default: 'client' 
        },

        // نوع المركبة للكابتن
        vehicleType: { 
            type: String, 
            enum: ['bicycle', 'electric', 'motorcycle'] 
        },

        // حالة الحساب
        isActive: { type: Boolean, default: true },
        isVerified: { type: Boolean, default: false },
        
        // أكواد التحقق والتفعيل
        verificationCode: { type: String },
        verificationCodeExpires: { type: Date },
        resetCode: { type: String },
        resetCodeExpires: { type: Date },
        
        // معلومات إضافية للكابتن
        rating: { type: Number, default: 5, min: 1, max: 5 },
        totalOrders: { type: Number, default: 0 },
        totalEarnings: { type: Number, default: 0 }
    },
    { timestamps: true }
);

// فهارس لتحسين الأداء
UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ isVerified: 1 });

// تشفير كلمة المرور قبل الحفظ
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// مقارنة كلمة المرور
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
