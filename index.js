const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
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
// اتصال قاعدة البيانات
// ==========================================
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/wassili', {

})
    .then(() => console.log('✅ تم الاتصال بقاعدة البيانات بنجاح'))
    .catch(err => console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err.message));

// ==========================================
// Routes
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
// 404 Handler
// ==========================================
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'المسار غير موجود' });
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
    console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
    console.log(`📍 الرابط: http://localhost:${PORT}`);
});

module.exports = app;
