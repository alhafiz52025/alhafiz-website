window.FULL_DICTIONARY = {
  "مؤسسة الحافظ للتنمية والخدمات | إشهار 2202 لسنة 2025": "Al-Hafiz Foundation for Development & Services | Reg. 2202/2025",
  "اللغة:": "Language:",
  "حجم الخط:": "Font Size:",
  "المظهر:": "Theme:",
  "الوضع الليلي": "Dark Mode",
  "🏛️ مؤسسة الحافظ للتنمية والخدمات - إشهار رقم 2202 لسنة 2025 (بني سويف)": "🏛️ Al-Hafiz Foundation - Reg. No. 2202 of 2025 (Beni Suef)",
  "💬 واتساب: 01000880156": "💬 WhatsApp: 01000880156",
  "📘 فيسبوك": "📘 Facebook",
  "مؤسسة الحافظ": "Al-Hafiz Foundation",
  "للتنمية والخدمات - مركز إهناسيا": "Development & Services - Ihnasia",
  "الرئيسية": "Home",
  "من نحن": "About Us",
  "📢 المنح والمبادرات": "📢 Grants & Initiatives",
  "🏆 الإنجازات": "🏆 Achievements",
  "❓ الأسئلة الشائعة": "❓ FAQ",
  "+ طلب مساعدة": "+ Request Aid",
  "🔍 استعلام": "🔍 Track",
  "📞 اتصل بنا": "📞 Contact",
  "🔒 الخصوصية": "🔒 Privacy",
  "🔐 دخول": "🔐 Login",
  // ... (تضمين باقي مفاتيح القاموس وثوابت الترجمة بشكل متناسق ومغلق بقوس }; الصحيح)
  "✅ تأكيد والرفع النهائي للحالة": "✅ Confirm & Submit Case"
};

window.currentSiteLang = 'ar';

window.translateWholePage = function(lang) {
  if (lang !== 'en') return;
  const dict = window.FULL_DICTIONARY || {};
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
  let node;
  while ((node = walker.nextNode())) {
    const raw = node.nodeValue;
    const trimmed = raw.trim();
    if (trimmed && dict[trimmed]) {
      node.nodeValue = raw.replace(trimmed, dict[trimmed]);
    }
  }
  document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(el => {
    const ph = (el.getAttribute('placeholder') || '').trim();
    if (ph && dict[ph]) el.setAttribute('placeholder', dict[ph]);
  });
};

window.applyLanguageDictionary = function(lang) {
  window.currentSiteLang = lang === 'en' ? 'en' : 'ar';
  const btn = document.getElementById('lang-toggle-btn');
  if (btn) btn.textContent = window.currentSiteLang === 'en' ? 'العربية' : 'English';
  if (window.currentSiteLang === 'en') {
    window.translateWholePage('en');
  } else {
    location.reload();
  }
};
