# 💰 Expense Tracker - تطبيق تتبع المصروفات

تطبيق ويب حديث لتتبع المصروفات الشهرية مع ميزانية قابلة للتخصيص وتقارير مفصلة.

## ✨ المميزات

- ✅ إضافة وحذف المصروفات
- 📊 تقارير شهرية مفصلة بالفئات
- 💵 تحديد ميزانية شهرية
- 📈 رسوم بيانية توضيحية (Donut Chart)
- 🎨 واجهة مستخدم عصرية وسهلة الاستخدام
- 📱 متجاوب مع جميع الأجهزة

## 🚀 التقنيات المستخدمة

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)

### Frontend
- HTML5
- CSS3
- JavaScript (Vanilla)
- Font Awesome

## 📦 التثبيت المحلي

1. استنساخ المشروع:
```bash
git clone <repository-url>
cd orbscope-main
```

2. تثبيت المكتبات:
```bash
npm install
```

3. إنشاء ملف `.env`:
```bash
cp .env.example .env
```

4. تعديل ملف `.env` وإضافة رابط MongoDB الخاص بك

5. تشغيل السيرفر:
```bash
npm start
```

6. فتح المتصفح على: `http://localhost:3000`

## 🌐 النشر على الإنترنت

### Backend - Render
1. إنشاء حساب على [Render.com](https://render.com)
2. New → Web Service
3. ربط مستودع GitHub
4. إعدادات:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**: أضف `MONGO_URI` من MongoDB Atlas

### Database - MongoDB Atlas
1. إنشاء حساب على [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. إنشاء Cluster مجاني
3. إنشاء Database User
4. السماح بالوصول من أي IP (0.0.0.0/0)
5. نسخ Connection String وإضافته في Render

### Frontend - Netlify
1. رفع مجلد `public` على [Netlify](https://netlify.com)
2. تعديل `API_BASE_URL` في `script.js` ليشير لرابط Render

## 📝 ملاحظات

- المشروع يستخدم MongoDB كقاعدة بيانات
- الميزانية الشهرية واحدة لجميع الأشهر (يمكن تحسينها لميزانية منفصلة لكل شهر)
- جميع المبالغ بالجنيه المصري (EGP)

## 👨‍💻 المطور

Asser

## 📄 الترخيص

ISC
