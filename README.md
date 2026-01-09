# منصة وصل-لي V2 🚚

منصة توصيل ذكية وآمنة تربط بين العملاء والكباتن والإدارة بكفاءة عالية.

## ✨ الميزات الرئيسية

### 🔐 الأمان والمصادقة
- نظام مصادقة محسّن مع تشفير آمن لكلمات المرور (bcryptjs)
- توليد وتحقق من أكواس التفعيل والتحديث
- عدم تسجيل الأكواس الحساسة في السجلات
- فحص شامل لصحة المدخلات على جانب الخادم

### 📦 إدارة الطلبات
- إنشاء طلبات جديدة مع تفاصيل الاستلام والتسليم
- تتبع حالات الطلبات (معلق، مقبول، قيد التنفيذ، مسلم، ملغي)
- منع الطلبات المكررة في فترة زمنية قصيرة
- حساب المسافات والتسعير الديناميكي

### 💬 الدردشة والتواصل
- نظام دردشة مباشرة بين العميل والكابتن
- تتبع حالة قراءة الرسائل
- إشعارات بالرسائل الجديدة

### ⭐ التقييمات والشكاوى
- نظام تقييم شامل للكباتن (1-5 نجوم)
- تقديم الشكاوى والتعليقات
- إدارة الشكاوى من قبل الإدارة

### 💰 التسعير الديناميكي
- تسعير مرن حسب المسافة (قريب، متوسط، بعيد)
- إمكانية تحديث الأسعار من قبل الإدارة
- حساب الأرباح للكباتن

### 📊 لوحة التحكم الإدارية
- إحصائيات شاملة عن النظام
- إدارة المستخدمين والكباتن
- عرض وتحليل الطلبات
- إدارة الشكاوى والتقييمات
- تقارير مفصلة عن الأداء

## 🏗️ البنية التحتية

### النماذج (Models)
- **User** - معلومات المستخدمين والكباتن
- **Order** - بيانات الطلبات
- **Message** - رسائل الدردشة
- **Review** - التقييمات والشكاوى
- **PricingConfig** - إعدادات التسعير

### الراوتات (Routes)
- `/api/auth` - المصادقة والتسجيل
- `/api/orders` - إدارة الطلبات
- `/api/messages` - الدردشة
- `/api/reviews` - التقييمات والشكاوى
- `/api/pricing` - إدارة التسعير
- `/api/admin` - لوحة التحكم الإدارية

## 🚀 البدء السريع

### المتطلبات
- Node.js v14+
- MongoDB
- npm أو yarn

### التثبيت

```bash
# استنساخ المشروع
git clone <repository-url>
cd wassili-improved

# تثبيت الحزم
npm install

# إنشاء ملف .env
cp .env.example .env

# تحرير متغيرات البيئة
# MONGO_URI=mongodb://localhost:27017/wassili
# JWT_SECRET=your_secret_key
# EMAIL_USER=your_email@gmail.com
# EMAIL_PASS=your_app_password
# PORT=5000
```

### التشغيل

```bash
# وضع التطوير (مع إعادة تحميل تلقائية)
npm run dev

# وضع الإنتاج
npm start
```

الخادم سيعمل على `http://localhost:5000`

## 📚 توثيق API

### المصادقة

#### تسجيل مستخدم جديد
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "أحمد محمد",
  "email": "ahmed@example.com",
  "phone": "0123456789",
  "password": "password123",
  "role": "client"
}
```

#### تسجيل الدخول
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "ahmed@example.com",
  "password": "password123"
}
```

#### تفعيل الحساب
```
POST /api/auth/verify-email
Content-Type: application/json

{
  "email": "ahmed@example.com",
  "code": "123456"
}
```

### الطلبات

#### إنشاء طلب جديد
```
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "pickup": {
    "address": "الخرطوم، شارع النيل",
    "contactName": "محمد علي",
    "contactPhone": "0123456789",
    "lat": 15.5007,
    "lng": 32.5599
  },
  "dropoff": {
    "address": "أم درمان، شارع السوق",
    "receiverName": "فاطمة أحمد",
    "receiverPhone": "0987654321",
    "lat": 15.5527,
    "lng": 32.4916
  },
  "details": "صندوق يحتوي على كتب",
  "distanceType": "short",
  "price": 50
}
```

#### الحصول على طلباتي
```
GET /api/orders/my-orders
Authorization: Bearer <token>
```

#### قبول طلب (للكابتن)
```
PUT /api/orders/:orderId/accept
Authorization: Bearer <token>
```

#### تسليم طلب (للكابتن)
```
PUT /api/orders/:orderId/deliver
Authorization: Bearer <token>
```

### الدردشة

#### إرسال رسالة
```
POST /api/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "order_id",
  "recipientId": "user_id",
  "message": "متى ستصل؟"
}
```

#### الحصول على رسائل الطلب
```
GET /api/messages/:orderId
Authorization: Bearer <token>
```

### التقييمات

#### إضافة تقييم
```
POST /api/reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "order_id",
  "captainId": "captain_id",
  "rating": 5,
  "comment": "خدمة ممتازة جداً",
  "type": "review"
}
```

#### الحصول على تقييمات الكابتن
```
GET /api/reviews/captain/:captainId
```

### التسعير

#### الحصول على جميع الأسعار
```
GET /api/pricing
```

#### الحصول على سعر معين
```
GET /api/pricing/:distanceType
```

#### إضافة سعر جديد (أدمن فقط)
```
POST /api/pricing
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "distanceType": "short",
  "basePrice": 50,
  "description": "توصيل قريب"
}
```

### لوحة التحكم

#### الحصول على إحصائيات
```
GET /api/admin/dashboard
Authorization: Bearer <admin_token>
```

#### الحصول على قائمة المستخدمين
```
GET /api/admin/users?page=1&limit=20&role=captain
Authorization: Bearer <admin_token>
```

#### إيقاف/تفعيل حساب
```
PUT /api/admin/users/:userId/toggle-status
Authorization: Bearer <admin_token>
```

## 🔒 متغيرات البيئة

```env
# قاعدة البيانات
MONGO_URI=mongodb://localhost:27017/wassili

# الأمان
JWT_SECRET=your_super_secret_key_here

# البريد الإلكتروني
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# الخادم
PORT=5000
NODE_ENV=development

# الواجهة الأمامية
FRONTEND_URL=http://localhost:3000
```

## 📁 هيكل المشروع

```
wassili-improved/
├── models/
│   ├── User.js
│   ├── Order.js
│   ├── Message.js
│   ├── Review.js
│   └── PricingConfig.js
├── routes/
│   ├── auth.js
│   ├── orders.js
│   ├── messages.js
│   ├── reviews.js
│   ├── pricing.js
│   └── admin.js
├── middleware/
│   └── authMiddleware.js
├── utils/
│   ├── validation.js
│   ├── errorHandler.js
│   └── sendEmail.js
├── index.js
├── package.json
└── README.md
```

## 🛠️ التحسينات المطبقة

✅ إزالة تسجيل الأكواس الحساسة من السجلات
✅ التحقق الشامل من صحة المدخلات
✅ إضافة فهارس لتحسين أداء الاستعلامات
✅ معالجة الأخطاء المركزية
✅ نظام دردشة متقدم
✅ نظام تقييمات وشكاوى
✅ تسعير ديناميكي
✅ لوحة تحكم إدارية شاملة
✅ معالجة الطلبات المكررة

## 📝 الترخيص

MIT

## 👨‍💻 المساهمة

يرجى فتح issue أو pull request للمساهمة في تحسين المشروع.

## 📞 الدعم

للحصول على الدعم، يرجى التواصل عبر البريد الإلكتروني أو فتح issue في المستودع.

---

تم تطويره بـ ❤️ لتحسين خدمات التوصيل في السودان
# wassili-2499
