// ============================================
// 📝 ملف التعليمات لتعديل Frontend قبل النشر
// ============================================

## خطوات تعديل Frontend للنشر على Netlify:

### الطريقة 1: تعديل script.js مباشرة (موصى بها)

1. افتح ملف `public/script.js`

2. ابحث عن السطر 4:
```javascript
const API_BASE_URL = '/api/expenses';
```

3. استبدله بـ (استخدم رابط Render الفعلي):
```javascript
const API_BASE_URL = 'https://YOUR-APP-NAME.onrender.com/api/expenses';
```

4. ابحث عن السطر 153 (تقريباً):
```javascript
const budgetRes = await fetch('/api/budgets');
```

5. استبدله بـ:
```javascript
const budgetRes = await fetch('https://YOUR-APP-NAME.onrender.com/api/budgets');
```

6. ابحث عن السطر 206 (تقريباً):
```javascript
const res = await fetch('/api/budgets', {
```

7. استبدله بـ:
```javascript
const res = await fetch('https://YOUR-APP-NAME.onrender.com/api/budgets', {
```

### الطريقة 2: استخدام البحث والاستبدال (Search & Replace)

استخدم VS Code أو محرر النصوص:

1. افتح `public/script.js`
2. اضغط `Cmd+F` (Mac) أو `Ctrl+F` (Windows)
3. فعّل "Replace All"
4. ابحث عن: `'/api/`
5. استبدل بـ: `'https://YOUR-APP-NAME.onrender.com/api/`
6. اضغط "Replace All"

### ⚠️ مهم جداً:

- **لا تنشر على Netlify قبل تعديل الروابط!**
- استخدم رابط Render الفعلي الذي حصلت عليه
- تأكد من عدم وجود `/` في نهاية الرابط قبل `/api`

### مثال:

❌ خطأ:
```javascript
'https://my-app.onrender.com//api/expenses'  // لاحظ الـ // المزدوج
```

✅ صحيح:
```javascript
'https://my-app.onrender.com/api/expenses'
```

### 🧪 اختبار بعد التعديل:

1. افتح `public/index.html` في المتصفح
2. افتح Console (F12)
3. حاول إضافة مصروف
4. إذا ظهر خطأ CORS، فهذا يعني أن Backend يعمل والتعديل صحيح
5. إذا ظهر "Network Error"، تحقق من الرابط

### 📚 للمزيد:

راجع `DEPLOYMENT_GUIDE.md` للخطوات الكاملة.
