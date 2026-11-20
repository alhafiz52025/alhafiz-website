// dictionary.js - نظام تعريب وترجمة شامل للموقع (العربية <-> الإنجليزية)
(function() {
  const ORIGINAL_TEXT_MAP = new WeakMap();
  const ORIGINAL_ATTR_MAP = new WeakMap();

  window.FULL_DICTIONARY = {
    // شريط المعلومات والهوية العلوية
    "مؤسسة الحافظ للتنمية والخدمات | إشهار 2202 لسنة 2025": "Al-Hafiz Foundation for Development & Services | Reg. 2202/2025",
    "اللغة:": "Language:",
    "حجم الخط:": "Font Size:",
    "المظهر:": "Theme:",
    "الوضع الليلي": "Dark Mode",
    "الوضع النهاري": "Light Mode",
    "🏛️ مؤسسة الحافظ للتنمية والخدمات - إشهار رقم 2202 لسنة 2025 (بني سويف)": "🏛️ Al-Hafiz Foundation - Reg. No. 2202 of 2025 (Beni Suef)",
    "💬 واتساب: 01000880156": "💬 WhatsApp: 01000880156",
    "📘 فيسبوك": "📘 Facebook",
    "مؤسسة الحافظ": "Al-Hafiz Foundation",
    "للتنمية والخدمات - مركز إهناسيا": "Development & Services - Ihnasia District",

    // القائمة الرئيسية والتنقل
    "الرئيسية": "Home",
    "من نحن": "About Us",
    "📢 المنح والمبادرات": "📢 Grants & Initiatives",
    "🏆 الإنجازات": "🏆 Achievements",
    "❓ الأسئلة الشائعة": "❓ FAQ",
    "+ طلب مساعدة": "+ Request Aid",
    "🔍 استعلام": "🔍 Track Request",
    "📞 اتصل بنا": "📞 Contact Us",
    "🔒 الخصوصية": "🔒 Privacy Policy",
    "🔐 دخول": "🔐 Login",

    // الصفحة الرئيسية والأثر الميداني
    "حقائب غذائية": "Food Bags",
    "دعم نقدي": "Cash Aid",
    "بطاطين": "Blankets",
    "قرية وعزبة": "Villages & Hamlets",
    "تقديم طلب مساعدة جديدة": "Submit a New Aid Request",
    "متابعة حالة طلب سابق": "Track an Existing Request",
    "أحدث المنح والمبادرات المفتوحة": "Latest Open Grants & Initiatives",
    "إنجازاتنا الميدانية": "Field Achievements",

    // نموذج طلب المساعدة والاستعلام والتواصل
    "الاسم الكامل": "Full Name",
    "رقم الهاتف (11 رقم)": "Phone Number (11 digits)",
    "الرقم القومي": "National ID",
    "المحافظة": "Governorate",
    "المركز / المدينة": "District / City",
    "القرية / العزبة": "Village / Hamlet",
    "نوع المساعدة": "Aid Type",
    "كود الطلب": "Tracking Code",
    "بحث": "Search",
    "إرسال": "Submit",
    "إرسال الرسالة": "Send Message",
    "✅ تأكيد والرفع النهائي للحالة": "✅ Confirm & Submit Case",

    // لوحة التحكم الإدارية وبوابة الأعضاء
    "🛡️ لوحة التحكم الإدارية": "🛡️ Admin Control Dashboard",
    "👤 بوابة العضو:": "👤 Member Portal:",
    "المسؤول:": "Administrator:",
    "🖨️ طباعة": "🖨️ Print",
    "خروج": "Logout",
    "تسجيل الخروج": "Sign Out",
    "الإجمالي": "Total",
    "مقبولة": "Approved",
    "قيد المراجعة": "Under Review",
    "الأعضاء والتظلمات": "Members & Grievances",
    "📁 الحالات": "📁 Cases",
    "👥 الأعضاء": "👥 Members",
    "📢 المنح": "📢 Grants",
    "🏆 الإنجازات": "🏆 Achievements",
    "⚖️ التظلمات": "⚖️ Grievances",
    "📜 المحاضر": "📜 Minutes",
    "📜 المحاضر والمستندات": "📜 Minutes & Docs",
    "-- كل الأنواع --": "-- All Types --",
    "-- كل الحالات --": "-- All Statuses --",
    "مقبول للصرف": "Approved for Disbursement",
    "مرفوض": "Rejected",
    "خانة توقيع المستلم": "Recipient Signature Column",
    "🖨️ كشف صرف": "🖨️ Disbursement Sheet",
    "📥 CSV": "📥 Export CSV",
    "لا توجد حالات مطابقة.": "No matching cases found.",
    "الكود": "Code",
    "رب الأسرة": "Head of Household",
    "العنوان والنوع": "Address & Type",
    "إسناد": "Assign",
    "القرار": "Decision",
    "إجراءات": "Actions",
    "📄 إقرار": "📄 Receipt",
    "🗑️": "🗑️",
    "بحث بالرقم أو الجهة أو الموضوع...": "Search by number, party, or subject...",
    "القرية أو الاسم...": "Village or name...",
    "العدد (50)": "Limit (50)"
  };

  window.currentSiteLang = 'ar';

  window.t = function(arText, enText) {
    if (window.currentSiteLang === 'en') {
      return enText || window.FULL_DICTIONARY[arText] || arText;
    }
    return arText;
  };

  function captureAndTranslateTextNode(node, dict, toEn) {
    if (!node || !node.nodeValue) return;
    const raw = node.nodeValue;
    const trimmed = raw.trim();
    if (!trimmed) return;

    if (!ORIGINAL_TEXT_MAP.has(node)) {
      ORIGINAL_TEXT_MAP.set(node, raw);
    }

    if (!toEn) {
      node.nodeValue = ORIGINAL_TEXT_MAP.get(node);
      return;
    }

    if (dict[trimmed]) {
      node.nodeValue = raw.replace(trimmed, dict[trimmed]);
    }
  }

  function captureAndTranslateAttributes(el, dict, toEn) {
    if (!el || !el.getAttribute) return;
    const attrs = ['placeholder', 'title', 'aria-label', 'alt'];
    if (!ORIGINAL_ATTR_MAP.has(el)) {
      const saved = {};
      attrs.forEach(a => {
        if (el.hasAttribute(a)) saved[a] = el.getAttribute(a);
      });
      ORIGINAL_ATTR_MAP.set(el, saved);
    }

    const originalAttrs = ORIGINAL_ATTR_MAP.get(el) || {};
    attrs.forEach(a => {
      if (!el.hasAttribute(a) && !(a in originalAttrs)) return;
      if (!toEn) {
        if (a in originalAttrs) el.setAttribute(a, originalAttrs[a]);
        return;
      }
      const currentVal = (originalAttrs[a] ?? el.getAttribute(a) ?? '').trim();
      if (currentVal && dict[currentVal]) {
        el.setAttribute(a, dict[currentVal]);
      }
    });
  }

  window.translateWholePage = function(lang) {
    const targetLang = lang === 'en' ? 'en' : 'ar';
    const toEn = targetLang === 'en';
    const dict = window.FULL_DICTIONARY || {};

    document.documentElement.lang = targetLang;
    document.documentElement.dir = toEn ? 'ltr' : 'rtl';
    if (document.body) {
      document.body.dir = toEn ? 'ltr' : 'rtl';
      document.body.classList.toggle('lang-en', toEn);
      document.body.classList.toggle('lang-ar', !toEn);
    }

    if (!document.body) return;

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
      const parentTag = node.parentElement ? node.parentElement.tagName : '';
      if (parentTag === 'SCRIPT' || parentTag === 'STYLE') continue;
      captureAndTranslateTextNode(node, dict, toEn);
    }

    document.querySelectorAll('input, textarea, select, button, a, label, span, div, h1, h2, h3, h4, p, small, strong, td, th, option, img').forEach(el => {
      captureAndTranslateAttributes(el, dict, toEn);
    });
  };

  window.refreshSiteLanguage = function() {
    window.translateWholePage(window.currentSiteLang);
  };

  window.applyLanguageDictionary = function(lang) {
    window.currentSiteLang = lang === 'en' ? 'en' : 'ar';
    const btn = document.getElementById('lang-toggle-btn');
    if (btn) btn.textContent = window.currentSiteLang === 'en' ? 'العربية' : 'English';
    window.translateWholePage(window.currentSiteLang);
  };

  // مراقبة التغييرات الديناميكية في الصفحة لتعريب أي محتوى يُضاف لاحقاً
  let observerTimer = null;
  const observer = new MutationObserver(() => {
    if (window.currentSiteLang !== 'en') return;
    clearTimeout(observerTimer);
    observerTimer = setTimeout(() => {
      window.translateWholePage('en');
    }, 60);
  });

  document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, { childList: true, subtree: true });
    const savedLang = sessionStorage.getItem('hf_site_lang');
    if (savedLang === 'en') {
      window.applyLanguageDictionary('en');
    }
  });

  const origApply = window.applyLanguageDictionary;
  window.applyLanguageDictionary = function(lang) {
    try {
      sessionStorage.setItem('hf_site_lang', lang === 'en' ? 'en' : 'ar');
    } catch (_) {}
    origApply(lang);
  };
})();
