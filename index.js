const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path'); // 1. استدعاء مكتبة التعامل مع المسارات
const { errorHandler } = require('./utils/errorHandler');

// تحميل متغيرات البيئة
dotenv.config();

const app = express();

// ==========================================
// Middleware
// ==========================================
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ==========================================
// إعداد ملفات الموقع (Frontend)
// ==========================================
// هذا السطر يخبر السيرفر أن ملفات الموقع موجودة في مجلد public
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// اتصال قاعدة البيانات
// ==========================================
mongoose.connect(process.env.MONGO_URI , {
    // تم إزالة الخيارات القديمة لأنها لم تعد مدعومة في النسخ الجديدة
})
    .then(() => console.log('✅ تم الاتصال بقاعدة البيانات بنجاح'))
    .catch(err => console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err.message));

// ==========================================
// Routes (روابط الـ API)
// ==========================================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/pricing', require('./routes/pricing'));
app.use('/api/admin', require('./routes/admin'));

// ==========================================
// Health Check
// ==========================================
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'الخادم يعمل بشكل صحيح ✅' });
});

// ==========================================
// توجيه الصفحة الرئيسية (مهم جداً)
// ==========================================
// إذا طلب المستخدم الموقع ولم يطلب API، نعطيه ملف index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==========================================
// Error Handler (يجب أن يكون آخر middleware)
// ==========================================
app.use(errorHandler);

// ==========================================
// Start Server
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 الموقع يعمل الآن على الرابط: http://localhost:${PORT}`);
});

module.exports = app;
