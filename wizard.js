// wizard.js - التنقل والاستمارة الذكية

function showSection(sectionName) {
  const secs = ['home', 'about', 'apply', 'track', 'contact', 'privacy', 'login'];
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
  alert('✅ تم نسخ الرقم بنجاح: ' + text);
}

let formData = {
  aid_type: '',
  husband: { first: '', second: '', last: '', nid: '', phone: '', gov: 'بني سويف', center: 'إهناسيا', village: 'منشأة عبدالصمد', addr: '' },
  wife: { first: '', second: '', last: '', nid: '', phone: '' },
  housing: { gps: '' },
  expenses: { total: 0 },
  income: { total: 0 }
};

function renderWizardStep(step) {
  const c = document.getElementById('wizard-container');
  if (!c) return;

  if (step === 0) {
    const opts = (typeof AID_TYPES !== 'undefined' ? AID_TYPES : ['مساعدات نقدية']).map(a => `<option value="${a}">${a}</option>`).join('');
    c.innerHTML = `
      <h4 style="color:#064e3b; font-weight:800; margin-bottom:12px;">الخطوة 1 من 6: تحديد نوع المساعدة</h4>
      <select id="w-aid">${opts}</select>
      <button type="button" onclick="nextFromStep0()" class="action-btn" style="margin-top:14px;">التالي ←</button>`;
  } else if (step === 1) {
    c.innerHTML = `
      <h4 style="color:#064e3b; font-weight:800; margin-bottom:12px;">الخطوة 2 من 6: بيانات الزوج</h4>
      <div class="grid-3">
        <input id="h-first" placeholder="الاسم الأول">
        <input id="h-second" placeholder="الاسم الثاني">
        <input id="h-last" placeholder="اللقب">
      </div>
      <div class="grid-3" style="margin-top:10px;">
        <input id="h-nid" maxlength="14" placeholder="الرقم القومي (14 رقم)">
        <input id="h-phone" maxlength="11" placeholder="رقم الموبايل">
      </div>
      <button type="button" onclick="renderWizardStep(5)" class="action-btn" style="margin-top:14px;">التالي إلى المرفقات ←</button>`;
  } else if (step === 5) {
    c.innerHTML = `
      <h4 style="color:#064e3b; font-weight:800; margin-bottom:10px;">الخطوة 6 من 6: التأكيد النهائي</h4>
      <button type="button" id="btn-submit-final" onclick="submitFinalApp()" class="action-btn" style="background:#d97706; color:#0f172a; font-weight:800;">✅ إرسال واعتماد الطلب</button>`;
  }
}

function nextFromStep0() {
  const aid = document.getElementById('w-aid').value;
  formData.aid_type = aid;
  renderWizardStep(1);
}

async function submitFinalApp() {
  const code = 'HF-2026-' + Math.floor(1000 + Math.random() * 9000);
  const c = document.getElementById('wizard-container');
  if (c) {
    c.innerHTML = `
      <div style="text-align:center; padding:24px;">
        <div style="font-size:48px;">✅</div>
        <h3 style="color:#064e3b; margin:10px 0;">تم تسجيل طلبكم بنجاح!</h3>
        <div style="display:inline-block; background:#ecfdf5; border:2px solid #059669; font-weight:800; font-size:22px; padding:10px 24px; border-radius:12px;">
          ${code}
        </div>
      </div>`;
  }
}
