// i18n.js - نظام التعريب الشامل (عربي / إنجليزي) لكامل الموقع
(function() {
  window.HF_TRANSLATIONS = {
    ar: {
      siteTitle: "مؤسسة الحافظ للتنمية والخدمات | إشهار 2202 لسنة 2025",
      navHome: "الرئيسية",
      navAbout: "من نحن",
      heroTitle: "معاً.. نصنع أثراً يمتد ويبقى",
      // ... باقي النصوص العربية المتاحة في المصدر المرجعي
    },
    en: {
      siteTitle: "Al-Hafiz Foundation for Development and Services | Reg. 2202/2025",
      navHome: "Home",
      navAbout: "About Us",
      heroTitle: "Together.. We Create Lasting Impact",
      // ... باقي النصوص الإنجليزية المتاحة في المصدر المرجعي
    }
  };
  const DYNAMIC_PHRASES_EN = {
    "مؤسسة الحافظ للتنمية والخدمات": "Al-Hafiz Foundation for Development and Services",
    "مشهرة برقم 2202 لسنة 2025": "Registered No. 2202 of 2025",
    "منشأة عبد الصمد – مركز إهناسيا – محافظة بني سويف": "Manshaat Abdel Samad - Ihnasia - Beni Suef",
    "منشأة عبدالصمد – إهناسيا – بني سويف": "Manshaat Abdel Samad - Ihnasia - Beni Suef",
    "شارع ممدوح مصطفى – إهناسيا – محافظة بني سويف": "Mamdouh Mostafa St. - Ihnasia - Beni Suef",
    "شارع ممدوح مصطفى – إهناسيا – بني سويف": "Mamdouh Mostafa St. - Ihnasia - Beni Suef",
    "الاسم المشهر:": "Registered Name:",
    "رقم الإشهار:": "Registration No.:",
    "المقر الرئيسي:": "Headquarters:",
    "المكتب الفرعي:": "Branch Office:",
    "واتساب رسمي:": "Official WhatsApp:",
    "البريد الإلكتروني:": "Email:",
    "1. مجلس الأمناء": "1. Board of Trustees",
    "2. الإدارة التنفيذية ولجان البحث": "2. Executive Management & Research Committees",
    "3. الباحثون والمتطوعون والمانحون": "3. Researchers, Volunteers & Donors",
    "الخطوة 1 من 8": "Step 1 of 8",
    "الخطوة 2 من 8": "Step 2 of 8",
    "الخطوة 3 من 8": "Step 3 of 8",
    "الخطوة 4 من 8": "Step 4 of 8",
    "الخطوة 5 من 8": "Step 5 of 8",
    "الخطوة 6 من 8": "Step 6 of 8",
    "الخطوة 7 من 8": "Step 7 of 8",
    "الخطوة 8 من 8": "Step 8 of 8",
    "🎯 الخطوة الأولى: تحديد نوع التدخل والمساعدات الخاصة": "🎯 Step 1: Select Aid & Intervention Type",
    "نوع المساعدة الأساسية المطلوبة للأسرة *": "Primary Assistance Required *",
    "👤 القسم الأول: بيانات الزوج (رب الأسرة)": "👤 Section 1: Husband Details",
    "الاسم الأول *": "First Name *",
    "الاسم الثاني *": "Middle Name *",
    "الاسم الثالث والعائلة *": "Last Name *",
    "الحالة الاجتماعية *": "Marital Status *",
    "الرقم القومي (14 رقم حصراً) *": "National ID (14 Digits) *",
    "النوع (تلقائي من الرقم القومي)": "Gender (Auto)",
    "تاريخ الميلاد (تلقائي من الرقم القومي)": "Birth Date (Auto)",
    "المستوى التعليمي *": "Education Level *",
    "العنوان الإداري (التسلسل الجغرافي المعتمد) *": "Administrative Address *",
    "1. المحافظة:": "1. Governorate:",
    "2. المركز / القسم:": "2. District / Center:",
    "3. القرية أو التابع:": "3. Village or Hamlet:",
    "رقم التليفون الأساسي (11 رقم) *": "Primary Phone (11 Digits) *",
    "رقم الواتساب (11 رقم)": "WhatsApp Number (11 Digits)",
    "الوظيفة الحالية *": "Current Occupation *",
    "👩 القسم الثاني: بيانات الزوجة": "👩 Section 2: Wife Details",
    "👶 القسم الثالث: بيانات الأبناء والتابعين": "👶 Section 3: Children Details",
    "+ إضافة ابن آخر": "+ Add Child",
    "💍 القسم الإضافي: بيانات العروسة وتجهيز الزواج": "💍 Bride & Marriage Details",
    "💸 القسم الرابع: المصروفات والأعباء الشهرية": "💸 Section 4: Monthly Expenses",
    "💵 القسم الخامس: مصادر الدخل والفائض أو العجز": "💵 Section 5: Income & Balance",
    "📋 القسم السادس: وصف السكن، المستندات الرسمية، ورأي الباحث": "📋 Section 6: Housing & Documents",
    "السابق": "Previous",
    "التالي ➔": "Next ➔",
    "✅ تأكيد والرفع النهائي للحالة": "✅ Confirm & Submit",
    "🛡️ لوحة التحكم الإدارية": "🛡️ Admin Control Dashboard",
    "تسجيل الخروج": "Sign Out",
    "خروج": "Logout",
    "تسجيل الدخول": "Sign In"
  };

  window.currentSiteLang = 'ar';

  window.t = function(key, fallbackAr) {
    const lang = window.currentSiteLang || 'ar';
    const dict = (window.HF_TRANSLATIONS && window.HF_TRANSLATIONS[lang]) || {};
    return dict[key] || fallbackAr || key;
  };

  window.translateDynamicContainer = function(rootEl, lang) {
    if (!rootEl) return;
    const targetLang = lang || window.currentSiteLang || 'ar';
    if (targetLang !== 'en') return;

    const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
      const txt = node.nodeValue.trim();
      if (txt && DYNAMIC_PHRASES_EN[txt]) {
        node.nodeValue = node.nodeValue.replace(txt, DYNAMIC_PHRASES_EN[txt]);
      }
    }

    rootEl.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(inp => {
      const ph = inp.getAttribute('placeholder')?.trim();
      if (ph && DYNAMIC_PHRASES_EN[ph]) {
        inp.setAttribute('placeholder', DYNAMIC_PHRASES_EN[ph]);
      }
    });
  };

  window.applyLanguageDictionary = function(lang) {
    window.currentSiteLang = lang === 'en' ? 'en' : 'ar';
    const dict = window.HF_TRANSLATIONS[window.currentSiteLang] || window.HF_TRANSLATIONS.ar;

    const toggleBtn = document.getElementById('lang-toggle-btn');
    if (toggleBtn) toggleBtn.textContent = window.currentSiteLang === 'en' ? 'العربية' : 'English';

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key] !== undefined) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = dict[key];
        } else {
          el.textContent = dict[key];
        }
      }
    });

    if (window.currentSiteLang === 'en') {
      window.translateDynamicContainer(document.body, 'en');
    }

    if (dict.siteTitle) document.title = dict.siteTitle;
  };
})();
