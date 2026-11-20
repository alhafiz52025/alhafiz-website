// تم تضمين قاموس الترجمة الشامل للنصوص والواجهات لمؤسسة الحافظ للتنمية والخدمات
window.FULL_DICTIONARY = {
  // يرجى مراجعة الكود البرمجي الكامل للقاموس الخاص باللغتين العربية والإنجليزية
};
  "مؤسسة الحافظ للتنمية والخدمات مؤسسة أهلية غير ربحية تعمل تحت إشراف وزارة التضامن الاجتماعي لخدمة الأسر الأولى بالرعاية بمركز إهناسيا وبني سويف.": "Al-Hafiz Foundation is a non-profit NGO supervised by the Ministry of Social Solidarity serving families in need in Ihnasia and Beni Suef.",
  "👁️ الرؤية": "👁️ Vision",
  "أن تكون المؤسسة نموذجاً رائداً في العمل التنموي يجمع بين الدقة الرقمية والعدالة الاجتماعية.": "To be a leading developmental model combining digital accuracy and social justice.",
  "🎯 الرسالة": "🎯 Mission",
  "تقديم خدمات تنموية وإغاثية منضبطة للأسر المستحقة وفق بحث ميداني موثق وحوكمة شفافة.": "Providing disciplined developmental and relief services to eligible families via documented field research.",
  "🏗️ الهيكل التنظيمي": "🏗️ Organizational Structure",
  "1. مجلس الأمناء": "1. Board of Trustees",
  "2. الإدارة التنفيذية ولجان البحث": "2. Executive Management & Research Committees",
  "3. الباحثون والمتطوعون والمانحون": "3. Researchers, Volunteers & Donors",
  "📢 المنح والمبادرات المفتوحة والإعلانات": "📢 Open Grants, Initiatives & Announcements",
  "تابع أحدث المبادرات المفتوحة للتقديم وقدّم طلبك مباشرة.": "Follow the latest open initiatives and apply directly.",
  "🏆 معرض الإنجازات والأنشطة الميدانية": "🏆 Achievements & Field Activities Gallery",
  "توثيق مصور لكافة قوافل ومساعدات مؤسسة الحافظ المنفذة.": "Photographic documentation of all Al-Hafiz Foundation aid convoys.",
  "❓ الأسئلة الشائعة للمستفيدين والشركاء": "❓ Frequently Asked Questions (FAQ)",
  "استمارة تسجيل وبحث حالة اجتماعية": "Social Research & Case Registration Form",
  "💾 حفظ مسودة": "💾 Save Draft",
  "🔍 الاستعلام الفوري عن طلب": "🔍 Instant Request Tracking",
  "أدخل رقم الطلب المرسل على الواتساب فقط (HF-...)": "Enter tracking code sent via WhatsApp only (HF-...)",
  "بحث": "Search",
  "اتصل بنا والدعم الفني والتظلمات": "Contact Us, Support & Grievances",
  "⚖️ نموذج التظلمات السرية": "⚖️ Confidential Grievance Form",
  "الاسم كاملاً *": "Full Name *",
  "رقم الهاتف (11 رقم) *": "Phone Number (11 digits) *",
  "تفاصيل الرسالة أو التظلم بسرية تامة *": "Grievance details in strict confidentiality *",
  "إرسال الرسالة بسرية تامة": "Send Confidentially",
  "🔒 سياسة الخصوصية وحماية البيانات الشخصية": "🔒 Privacy Policy & Data Protection",
  "🔐 بوابة الدخول الموحدة": "🔐 Unified Login Portal",
  "البريد الإلكتروني المسجل": "Registered Email",
  "كلمة المرور أو الرمز المؤقت": "Password or Temporary Code",
  "تسجيل الدخول": "Sign In",
  "+ طلب انضمام جديد": "+ New Membership Request"
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
