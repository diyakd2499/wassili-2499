const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const { isValidEmail, isValidSudanPhone, isValidPassword } = require('../utils/validation');

// ==========================================
// 1️⃣ تسجيل مستخدم جديد
// ==========================================
router.post('/register', asyncHandler(async (req, res) => {
    const { name, email, phone, password, role } = req.body;

    // التحقق من المدخلات
    if (!name || !email || !phone || !password) {
        throw new AppError('جميع الحقول مطلوبة', 400);
    }

    if (!isValidEmail(email)) {
        throw new AppError('البريد الإلكتروني غير صحيح', 400);
    }

    if (!isValidSudanPhone(phone)) {
        throw new AppError('رقم الهاتف يجب أن يكون سوداني صحيح (01 أو 09 متبوعاً بـ 8 أرقام)', 400);
    }

    if (!isValidPassword(password)) {
        throw new AppError('كلمة المرور يجب أن تكون على الأقل 6 أحرف', 400);
    }

    // التحقق من وجود المستخدم
    let user = await User.findOne({ $or: [{ email }, { phone }] });
    if (user) {
        throw new AppError('البريد الإلكتروني أو رقم الهاتف مسجل مسبقاً', 400);
    }

    // إنشاء كود تحقق عشوائي
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // إنشاء المستخدم الجديد
    user = new User({
        name,
        email,
        phone,
        password,
        role: role || 'client',
        isVerified: false,
        verificationCode,
        verificationCodeExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    await user.save();

    // إرسال الإيميل في الخلفية (بدون انتظار)
    sendEmail(email, 'كود تفعيل حساب وصل-لي', `كود التفعيل الخاص بك هو: ${verificationCode}`)
        .catch(err => console.error('خطأ في إرسال البريد:', err.message));

    res.status(201).json({
        success: true,
        message: 'تم التسجيل بنجاح! تحقق من بريدك الإلكتروني للحصول على كود التفعيل'
    });
}));

// ==========================================
// 2️⃣ تسجيل الدخول
// ==========================================
router.post('/login', asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new AppError('البريد الإلكتروني وكلمة المرور مطلوبان', 400);
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new AppError('بيانات الدخول غير صحيحة', 400);
    }

    // مقارنة الباسورد
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
        throw new AppError('بيانات الدخول غير صحيحة', 400);
    }

    if (!user.isVerified) {
        throw new AppError('الحساب غير مفعل. تحقق من بريدك الإلكتروني', 403);
    }

    if (!user.isActive) {
        throw new AppError('الحساب موقوف', 403);
    }

    // إنشاء JWT
    const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    // تحديث آخر تسجيل دخول
    user.lastSignedIn = new Date();
    await user.save();

    res.json({
        success: true,
        message: 'تم تسجيل الدخول بنجاح! 🚀',
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
}));

// ==========================================
// 3️⃣ تفعيل الحساب
// ==========================================
router.post('/verify-email', asyncHandler(async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        throw new AppError('البريد الإلكتروني والكود مطلوبان', 400);
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new AppError('المستخدم غير موجود', 400);
    }

    if (user.verificationCode !== code) {
        throw new AppError('كود التفعيل غير صحيح', 400);
    }

    if (user.verificationCodeExpires && user.verificationCodeExpires < new Date()) {
        throw new AppError('انتهت صلاحية الكود. اطلب كود جديد', 400);
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    res.json({
        success: true,
        message: 'تم تفعيل الحساب بنجاح!'
    });
}));

// ==========================================
// 4️⃣ إعادة إرسال الكود
// ==========================================
router.post('/resend-code', asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new AppError('البريد الإلكتروني مطلوب', 400);
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new AppError('المستخدم غير موجود', 400);
    }

    if (user.isVerified) {
        throw new AppError('الحساب مفعل بالفعل!', 400);
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = newCode;
    user.verificationCodeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    sendEmail(email, 'إعادة إرسال كود التفعيل', `كود التفعيل الجديد هو: ${newCode}`)
        .catch(err => console.error('خطأ في إرسال البريد:', err.message));

    res.json({
        success: true,
        message: 'تم إرسال كود جديد بنجاح'
    });
}));

// ==========================================
// 5️⃣ إعادة تعيين كلمة المرور
// ==========================================
router.post('/forgot-password', asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new AppError('البريد الإلكتروني مطلوب', 400);
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new AppError('المستخدم غير موجود', 400);
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetCode = resetCode;
    user.resetCodeExpires = new Date(Date.now() + 1 * 60 * 60 * 1000);
    await user.save();

    sendEmail(email, 'إعادة تعيين كلمة المرور', `كود إعادة التعيين الخاص بك هو: ${resetCode}`)
        .catch(err => console.error('خطأ في إرسال البريد:', err.message));

    res.json({
        success: true,
        message: 'تم إرسال كود إعادة التعيين إلى بريدك الإلكتروني'
    });
}));

// ==========================================
// 6️⃣ تحديث كلمة المرور
// ==========================================
router.post('/reset-password', asyncHandler(async (req, res) => {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
        throw new AppError('جميع الحقول مطلوبة', 400);
    }

    if (!isValidPassword(newPassword)) {
        throw new AppError('كلمة المرور يجب أن تكون على الأقل 6 أحرف', 400);
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new AppError('المستخدم غير موجود', 400);
    }

    if (user.resetCode !== code) {
        throw new AppError('كود إعادة التعيين غير صحيح', 400);
    }

    if (user.resetCodeExpires && user.resetCodeExpires < new Date()) {
        throw new AppError('انتهت صلاحية الكود', 400);
    }

    user.password = newPassword;
    user.resetCode = undefined;
    user.resetCodeExpires = undefined;
    await user.save();

    res.json({
        success: true,
        message: 'تم تحديث كلمة المرور بنجاح!'
    });
}));

module.exports = router;
