#!/bin/bash

echo "🚀 تجهيز المشروع للنشر على Production..."
echo ""

# ألوان للـ terminal
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📝 التحقق من الملفات المطلوبة...${NC}"

# التحقق من وجود الملفات المهمة
files=("package.json" "app.js" ".env.example" ".gitignore" "DEPLOYMENT_GUIDE.md")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file موجود${NC}"
    else
        echo -e "❌ $file غير موجود!"
    fi
done

echo ""
echo -e "${YELLOW}📦 تثبيت Dependencies...${NC}"
npm install

echo ""
echo -e "${YELLOW}🔍 التحقق من ملف .env...${NC}"
if [ ! -f ".env" ]; then
    echo "⚠️  ملف .env غير موجود. سيتم إنشاء واحد من .env.example"
    cp .env.example .env
    echo -e "${GREEN}✅ تم إنشاء ملف .env${NC}"
    echo "📝 يرجى تعديل ملف .env وإضافة MONGO_URI الخاص بك"
else
    echo -e "${GREEN}✅ ملف .env موجود${NC}"
fi

echo ""
echo -e "${GREEN}✨ المشروع جاهز للنشر!${NC}"
echo ""
echo "الخطوات التالية:"
echo "1. عدّل ملف .env وأضف MONGO_URI من MongoDB Atlas"
echo "2. ارفع الكود على GitHub"
echo "3. انشر Backend على Render"
echo "4. عدّل API_BASE_URL في public/script.js"
echo "5. انشر Frontend على Netlify"
echo ""
echo "📚 للتفاصيل الكاملة، افتح: DEPLOYMENT_GUIDE.md"
