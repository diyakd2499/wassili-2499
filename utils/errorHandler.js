// فئة مخصصة للأخطاء
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

// معالج الأخطاء المركزي
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'حدث خطأ في الخادم';

    // تسجيل الخطأ (بدون معلومات حساسة)
    console.error(`[${new Date().toISOString()}] خطأ ${statusCode}: ${message}`);

    // إرسال الرد
    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        // في بيئة الإنتاج، لا نرسل تفاصيل الخطأ
        ...(process.env.NODE_ENV === 'development' && { error: err.stack })
    });
};

// wrapper لـ async functions لالتقاط الأخطاء
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    AppError,
    errorHandler,
    asyncHandler
};
