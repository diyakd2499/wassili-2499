const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'المستخدم غير موجود' });
            }

            if (!req.user.isActive) {
                return res.status(403).json({ message: 'الحساب موقوف' });
            }

            if (!req.user.isVerified) {
                return res.status(403).json({ message: 'الحساب غير مفعل' });
            }

            next();
        } catch (error) {
            return res.status(401).json({ message: 'غير مصرح، توكن غير صالح' });
        }
    } else {
        return res.status(401).json({ message: 'غير مصرح، لا يوجد توكن' });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ message: 'ممنوع: صلاحيات أدمن فقط' });
    }
};

const captainOnly = (req, res, next) => {
    if (req.user && req.user.role === 'captain') {
        next();
    } else {
        return res.status(403).json({ message: 'ممنوع: صلاحيات كابتن فقط' });
    }
};

const clientOnly = (req, res, next) => {
    if (req.user && (req.user.role === 'client' || req.user.role === 'customer')) {
        next();
    } else {
        return res.status(403).json({ message: 'ممنوع: صلاحيات عميل فقط' });
    }
};

module.exports = { protect, adminOnly, captainOnly, clientOnly };
