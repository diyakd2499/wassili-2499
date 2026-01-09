// التحقق من صحة البريد الإلكتروني
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// التحقق من صحة رقم الهاتف السوداني
const isValidSudanPhone = (phone) => {
    return /^(01|09)\d{8}$/.test(phone);
};

// التحقق من صحة كلمة المرور (على الأقل 6 أحرف)
const isValidPassword = (password) => {
    return password && password.length >= 6;
};

// التحقق من صحة الإحداثيات الجغرافية
const isValidCoordinates = (lat, lng) => {
    return typeof lat === 'number' && typeof lng === 'number' &&
           lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

// التحقق من صحة التقييم (1-5)
const isValidRating = (rating) => {
    return typeof rating === 'number' && rating >= 1 && rating <= 5;
};

// التحقق من صحة السعر
const isValidPrice = (price) => {
    return typeof price === 'number' && price > 0;
};

// التحقق من صحة نوع المسافة
const isValidDistanceType = (type) => {
    return ['short', 'medium', 'long'].includes(type);
};

// التحقق من صحة حالة الطلب
const isValidOrderStatus = (status) => {
    return ['pending', 'accepted', 'in_progress', 'delivered', 'cancelled'].includes(status);
};

// التحقق من صحة دور المستخدم
const isValidRole = (role) => {
    return ['customer', 'client', 'captain', 'admin'].includes(role);
};

// التحقق من صحة نوع المركبة
const isValidVehicleType = (type) => {
    return ['bicycle', 'electric', 'motorcycle'].includes(type);
};

module.exports = {
    isValidEmail,
    isValidSudanPhone,
    isValidPassword,
    isValidCoordinates,
    isValidRating,
    isValidPrice,
    isValidDistanceType,
    isValidOrderStatus,
    isValidRole,
    isValidVehicleType
};
