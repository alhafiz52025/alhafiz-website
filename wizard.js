// wizard.js - الاستمارة الذكية المتكاملة لمؤسسة الحافظ

// استخدام متغير آمن لتجنب التكرار والتصادم مع الملفات الأخرى
window.wizardDb = window.wizardDb || window.supabaseClient || (window.supabase ? window.supabase.createClient('https://fwyacpvbhwdlivzeiper.supabase.co', 'sb_publishable_6xYRIb6tT-Na8wvnDoGMsQ_EeMfQzdz') : null);

// تعريف دالة التنقل وإتاحتها بشكل عام عالمياً
window.showSection = function(sectionName) {
  const secs = ['home', 'about', 'achievements', 'faq', 'apply', 'track', 'contact', 'privacy', 'login'];
  secs.forEach(s => {
    const el = document.getElementById('section-' + s);
    if (el) el.classList.add('hidden');
  });
  const target = document.getElementById('section-' + sectionName);
  if (target) target.classList.remove('hidden');
  if (sectionName === 'apply') renderWizardStep(0);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function copyText(text) {
  navigator.clipboard.writeText(text);
  alert('✅ تم نسخ النص بنجاح: ' + text);
}

let draftData = localStorage.getItem('alhafiz_draft');
let formData = draftData ? JSON.parse(draftData) : {
  aid_type: '',
  husband: {
    first: '', second: '', last: '', nid: '', phone: '',
    gov: 'بني سويف', center: 'إهناسيا',
    village: 'منشأة عبدالصمد', custom_hamlet: '', addr: ''
  },
  wife: { first: '', second: '', last: '', nid: '', phone: '' },
  housing: { ownership: 'ملكية خاصة', roof: 'سقف مسلح', gps: '' },
  expenses: { total: 0 },
  income: { total: 0 },
  uploaded_docs: [],
  duplication_warning: null
};

function saveDraft() {
  localStorage.setItem('alhafiz_draft', JSON.stringify(formData));
  alert('💾 تم حفظ بياناتك كمسودة؛ يمكنك إكمالها في أي وقت.');
}

async function uploadDocFile(fileInput, docLabel) {
  if (!fileInput || !fileInput.files || !fileInput.files[0]) return null;
  const dbClient = window.wizardDb;
  if (!dbClient) return null;
  const file = fileInput.files[0];
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
  const res = await dbClient.storage.from('documents').upload(fileName, file);
  if (res.data) {
    const pub = dbClient.storage.from('documents').getPublicUrl(fileName);
    formData.uploaded_docs.push({ type: docLabel, url: pub.data.publicUrl });
    return pub.data.publicUrl;
  }
  return null;
}

function renderWizardStep(step) {
  const c = document.getElementById('wizard-container');
  if (!c) return;

  if (step === 0) {
    const opts = (typeof AID_TYPES !== 'undefined' ? AID_TYPES : ['مساعدات مالية']).map(a =>
      `<option value="${a}" ${formData.aid_type === a ? 'selected' : ''}>${a}</option>`
    ).join('');
    c.innerHTML = `
      <h4 style="color:var(--primary-dark); font-weight:800; margin-bottom:12px;">الخطوة 1 من 6: تحديد نوع المساعدة المطلوبة</h4>
      <select id="w-aid">${opts}</select>
      <button type="button" onclick="nextFromStep0()" class="action-btn" style="margin-top:14px;">التالي: بيانات العائل ←</button>`;
  } else if (step === 1) {
    c.innerHTML = `
      <h4 style="color:var(--primary-dark); font-weight:800; margin-bottom:12px;">الخطوة 2 من 6: بيانات الزوج / العائل</h4>
      <div class="grid-3">
        <input id="h-first" value="${formData.husband.first}" placeholder="الاسم الأول *">
        <input id="h-second" value="${formData.husband.second}" placeholder="الاسم الثاني *">
        <input id="h-last" value="${formData.husband.last}" placeholder="اللقب / العائلة *">
      </div>
      <div class="grid-3" style="margin-top:10px;">
        <input id="h-nid" maxlength="14" value="${formData.husband.nid}" placeholder="الرقم القومي (14 رقم) *">
        <input id="h-phone" maxlength="11" value="${formData.husband.phone}" placeholder="رقم الموبايل (11 رقم) *">
        <input id="h-addr" value="${formData.husband.addr}" placeholder="العنوان التفصيلي بالبطاقة *">
      </div>
      <div style="display:flex; justify-content:space-between; margin-top:16px;">
        <button type="button" onclick="renderWizardStep(0)" class="nav-btn">→ السابق</button>
        <button type="button" onclick="saveHusbandStep()" class="action-btn">التالي: التأكيد والإرسال ←</button>
      </div>`;
  } else if (step === 5) {
    c.innerHTML = `
      <h4 style="color:var(--primary-dark); font-weight:800; margin-bottom:10px;">الخطوة الأخيرة: التأكيد وإرسال الطلب</h4>
      <button type="button" id="btn-submit-app" onclick="submitFinalApp()" class="action-btn" style="background:#d97706; color:#0f172a; font-weight:800;">
        ✅ إرسال واعتماد الطلب
      </button>`;
  }
}

function nextFromStep0() {
  const aid = document.getElementById('w-aid').value;
  if (!aid) return alert('⚠️ يرجى اختيار نوع المساعدة.');
  formData.aid_type = aid;
  localStorage.setItem('alhafiz_draft', JSON.stringify(formData));
  renderWizardStep(1);
}

function saveHusbandStep() {
  const f = document.getElementById('h-first').value.trim();
  const s = document.getElementById('h-second').value.trim();
  const l = document.getElementById('h-last').value.trim();
  const nid = document.getElementById('h-nid').value.trim();
  const ph = document.getElementById('h-phone').value.trim();
  const addr = document.getElementById('h-addr').value.trim();

  if (!f || !s || !l) return alert('⚠️ يرجى كتابة الاسم الثلاثي.');
  if (nid.length !== 14 || isNaN(nid)) return alert('⚠️ الرقم القومي 14 رقماً.');
  if (ph.length < 11) return alert('⚠️ رقم الموبايل 11 رقماً.');
  if (!addr) return alert('⚠️ اكتب العنوان التفصيلي.');

  formData.husband = { first: f, second: s, last: l, nid, phone: ph, addr };
  localStorage.setItem('alhafiz_draft', JSON.stringify(formData));
  renderWizardStep(5);
}

async function submitFinalApp() {
  const code = 'HF-2026-' + Math.floor(1000 + Math.random() * 9000);
  const dbClient = window.wizardDb;
  
  if (dbClient) {
    await dbClient.from('families').insert([{
      tracking_code: code,
      aid_type: formData.aid_type || 'مساعدة عامة',
      source_type: 'self',
      governorate: 'بني سويف',
      center_city: 'إهناسيا',
      village_hamlet: 'منشأة عبدالصمد',
      detailed_address: formData.husband.addr || '',
      status: 'pending'
    }]);
  }

  localStorage.removeItem('alhafiz_draft');
  const c = document.getElementById('wizard-container');
  if (c) {
    c.innerHTML = `
      <div style="text-align:center; padding:24px;">
        <div style="font-size:48px;">✅</div>
        <h3 style="color:var(--primary-dark); margin:10px 0;">تم تسجيل طلبكم بنجاح!</h3>
        <div style="display:inline-block; background:#ecfdf5; border:2px solid #059669; font-weight:800; font-size:22px; padding:10px 24px; border-radius:12px; margin-bottom:16px;">
          ${code}
        </div>
        <p style="font-size:13px; color:#64748b;">احتفظ بهذا الكود للاستعلام عن حالة طلبك في أي وقت.</p>
      </div>`;
  }
}
