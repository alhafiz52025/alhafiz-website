// i18n.js - نظام التعريب الشامل لمؤسسة الحافظ للتنمية والخدمات (إشهار 2202 لسنة 2025)
// يحتوي على القاموس الكامل للغة العربية والإنجليزية لمختلف أقسام الموقع (الرئيسية، من نحن، التبرعات، الاستعلام، التظلمات، وغيرها).
// يمكن الاطلاع على كود التعريب التفصيلي والأوصاف الكاملة ضمن مستودعات المشروع المتاحة.
window.HF_TRANSLATIONS = {
  ar: {
    siteTitle: "مؤسسة الحافظ للتنمية والخدمات | إشهار 2202 لسنة 2025",
    navHome: "الرئيسية",
    navAbout: "من نحن",
    navAnnouncements: "📢 المنح والمبادرات",
    navAchievements: "🏆 الإنجازات",
    navApply: "+ طلب مساعدة",
    navTrack: "🔍 استعلام",
    navContact: "📞 اتصل بنا"
  },
  en: {
    siteTitle: "Al-Hafiz Foundation for Development and Services | Reg. 2202/2025",
    navHome: "Home",
    navAbout: "About Us",
    navAnnouncements: "📢 Grants & Initiatives",
    navAchievements: "🏆 Achievements",
    navApply: "+ Request Aid",
    navTrack: "🔍 Track",
    navContact: "📞 Contact"
  }
};
window.currentSiteLang = 'ar';

window.applyLanguageDictionary = function(lang) {
  window.currentSiteLang = lang === 'en' ? 'en' : 'ar';
  const dict = window.HF_TRANSLATIONS[window.currentSiteLang] || window.HF_TRANSLATIONS.ar;

  const btn = document.getElementById('lang-toggle-btn');
  if (btn) btn.textContent = window.currentSiteLang === 'en' ? 'العربية' : 'English';

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

  if (dict.siteTitle) document.title = dict.siteTitle;
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

    document.querySelectorAll('option').forEach(opt => {
      const txt = opt.textContent.trim();
      if (txt && dict[txt]) opt.textContent = dict[txt];
    });
  };

  window.applyLanguageDictionary = function(lang) {
    window.currentSiteLang = lang === 'en' ? 'en' : 'ar';
    const dict = window.FULL_DICTIONARY || {};
    const btn = document.getElementById('lang-toggle-btn');
    if (btn) btn.textContent = window.currentSiteLang === 'en' ? 'العربية' : 'English';

    if (window.currentSiteLang === 'en') {
      document.title = dict["مؤسسة الحافظ للتنمية والخدمات | إشهار 2202 لسنة 2025"] || document.title;
      window.translateWholePage('en');
    } else {
      location.reload();
    }
  };
})();
