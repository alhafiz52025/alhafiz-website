// wizard.js - الاستمارة الذكية المتكاملة لمؤسسة الحافظ
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

const wizardDb = window.supabaseClient || (window.supabase ? window.supabase.createClient('https://fwyacpvbhwdlivzeiper.supabase.co', 'sb_publishable_6xYRIb6tT-Na8wvnDoGMsQ_EeMfQzdz') : null);

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
  if (!wizardDb) return null;
  const file = fileInput.files[0];
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
  const res = await wizardDb.storage
    .from('documents')
    .upload(fileName, file);
  if (res.data) {
    const pub = wizardDb.storage.from('documents').getPublicUrl(fileName);
    formData.uploaded_docs.push({ type: docLabel, url: pub.data.publicUrl });
    return pub.data.publicUrl;
  }
  return null;
}

async function checkDuplication(nid, alertId) {
  const box = document.getElementById(alertId);
  if (!box) return;
  if (!nid || nid.length !== 14 || isNaN(nid)) {
    box.innerHTML = '<span style="color:#dc2626;">⚠️ الرقم القومي 14 رقماً.</span>';
    return;
  }
  if (!wizardDb) {
    box.innerHTML = '<span style="color:#047857;">✓ تم التحقق المبدئي.</span>';
    return;
  }
  box.innerHTML = '<span style="color:#64748b;">⏳ جاري فحص الرقم القومي...</span>';
  const res = await wizardDb.rpc('check_national_id_duplication', {
    p_national_id: nid,
    p_aid_type: formData.aid_type
  });
  if (res.error) {
    box.innerHTML = '<span style="color:#047857;">✓ جاهز للتسجيل.</span>';
    return;
  }
  const d = res.data;
  if (d.status === 'blocked') {
    box.innerHTML = '<div style="padding:10px; background:#fee2e2; color:#991b1b; border-radius:8px;">🚫 ' + d.message + '</div>';
  } else if (d.status === 'warning') {
    formData.duplication_warning = d.message;
    box.innerHTML = '<div style="padding:10px; background:#fef3c7; color:#92400e; border-radius:8px;">⚠️ ' + d.message + '</div>';
  } else {
    box.innerHTML = '<span style="color:#047857;">✅ ' + d.message + '</span>';
  }
}

function renderWizardStep(step) {
  const c = document.getElementById('wizard-container');
  if (!c) return;

  if (step === 0) {
    const opts = (typeof AID_TYPES !== 'undefined' ? AID_TYPES : ['مساعدات مالية']).map(a =>
      `<option value="${a}" ${formData.aid_type === a ? 'selected' : ''}>${a}</option>`
    ).join('');
    c.innerHTML = `
      <h4 style="color:#064e3b; font-weight:800; margin-bottom:12px;">
        الخطوة 1 من 6: تحديد نوع المساعدة المطلوبة
      </h4>
      <label style="font-size:13px; font-weight:700; display:block; margin-bottom:6px;">
        اختر نوع المساعدة بدقة:
      </label>
      <select id="w-aid">${opts}</select>
      <button type="button" onclick="nextFromStep0()" class="action-btn" style="margin-top:14px;">
        التالي: بيانات الزوج / العائل ←
      </button>`;
  } else if (step === 1) {
    const govs = Object.keys(typeof EGYPT_LOCATIONS !== 'undefined' ? EGYPT_LOCATIONS : {'بني سويف':{}}).map(g =>
      `<option value="${g}" ${formData.husband.gov === g ? 'selected' : ''}>${g}</option>`
    ).join('');
    const edus = (typeof EDUCATION_LEVELS !== 'undefined' ? EDUCATION_LEVELS : []).map(e =>
      `<option value="${e.value}">${e.label}</option>`
    ).join('');
    const jobs = (typeof EGYPT_JOBS !== 'undefined' ? EGYPT_JOBS : []).map(j =>
      `<option value="${j}">${j}</option>`
    ).join('');
    const meds = (typeof MEDICAL_NEEDS !== 'undefined' ? MEDICAL_NEEDS : []).map(m =>
      `<option value="${m}">${m}</option>`
    ).join('');

    c.innerHTML = `
      <h4 style="color:#064e3b; font-weight:800; margin-bottom:12px;">
        الخطوة 2 من 6: بيانات الزوج (رب الأسرة / العائل) *
      </h4>
      <div class="grid-3">
        <input id="h-first" value="${formData.husband.first}" placeholder="الاسم الأول *">
        <input id="h-second" value="${formData.husband.second}" placeholder="الاسم الثاني *">
        <input id="h-last" value="${formData.husband.last}" placeholder="اللقب / العائلة *">
      </div>
      <div class="grid-3" style="margin-top:10px;">
        <input id="h-nid" maxlength="14" value="${formData.husband.nid}"
          onblur="checkDuplication(this.value, 'h-dup')" placeholder="الرقم القومي (14 رقم) *">
        <input id="h-phone" maxlength="11" value="${formData.husband.phone}"
          placeholder="رقم الموبايل / واتساب (11 رقم) *">
        <select id="h-status">
          <option value="alive">الحالة: على قيد الحياة</option>
          <option value="deceased">متوفى</option>
          <option value="divorced">مطلق / منفصل</option>
          <option value="imprisoned">مسجون</option>
        </select>
      </div>
      <div id="h-dup" style="margin:8px 0; font-size:13px; font-weight:700;"></div>
      <div class="grid-3">
        <select id="h-gov" onchange="updateCenters()">${govs}</select>
        <select id="h-center" onchange="updateVillages()"></select>
        <select id="h-village" onchange="toggleCustomHamlet()"></select>
      </div>
      <input id="h-custom-hamlet" class="hidden" value="${formData.husband.custom_hamlet}"
        placeholder="اكتب اسم القرية / العزبة / النجع التابع لها *" style="margin-top:10px;">
      <input id="h-addr" value="${formData.husband.addr}"
        placeholder="العنوان التفصيلي كما هو مدون ببطاقة الرقم القومي *" style="margin-top:10px;">
      <div class="grid-3" style="margin-top:10px;">
        <select id="h-edu">${edus}</select>
        <select id="h-job">${jobs}</select>
        <select id="h-health" onchange="toggleMed('h-med', this.value)">
          <option value="healthy">الحالة الصحية: سليم</option>
          <option value="sick">مريض / ذوي همم</option>
        </select>
      </div>
      <div id="h-med" class="hidden" style="background:#fffbeb; padding:12px; border-radius:10px; margin-top:10px;">
        <label style="font-size:12px; font-weight:700; display:block; margin-bottom:4px;">نوع الاحتياج الطبي:</label>
        <select>${meds}</select>
        <input type="file" id="file-h-med" accept="image/*" style="margin-top:6px;">
      </div>
      <div class="grid-2" style="background:#f8fafc; padding:12px; border-radius:10px; margin-top:10px; font-size:12px;">
        <div><strong>صورة بطاقة الزوج (أمامي):</strong><input type="file" id="file-h-front" accept="image/*" style="margin-top:4px;"></div>
        <div><strong>صورة بطاقة الزوج (ظهر):</strong><input type="file" id="file-h-back" accept="image/*" style="margin-top:4px;"></div>
      </div>
      <div style="display:flex; justify-content:space-between; margin-top:16px;">
        <button type="button" onclick="renderWizardStep(0)" class="nav-btn">→ السابق</button>
        <button type="button" onclick="saveHusbandStep()" class="action-btn">التالي: بيانات الزوجة ←</button>
      </div>`;
    updateCenters();
  } else if (step === 2) {
    const edus = (typeof EDUCATION_LEVELS !== 'undefined' ? EDUCATION_LEVELS : []).map(e => `<option value="${e.value}">${e.label}</option>`).join('');
    const jobs = (typeof EGYPT_JOBS !== 'undefined' ? EGYPT_JOBS : []).map(j =>
      `<option value="${j}" ${j.includes('ربة') ? 'selected' : ''}>${j}</option>`
    ).join('');
    c.innerHTML = `
      <h4 style="color:#064e3b; font-weight:800; margin-bottom:12px;">
        الخطوة 3 من 6: بيانات الزوجة *
      </h4>
      <div class="grid-3">
        <input id="w-first" value="${formData.wife.first}" placeholder="الاسم الأول للزوجة *">
        <input id="w-second" value="${formData.wife.second}" placeholder="الاسم الثاني *">
        <input id="w-last" value="${formData.wife.last}" placeholder="اللقب / العائلة *">
      </div>
      <div class="grid-3" style="margin-top:10px;">
        <input id="w-nid" maxlength="14" value="${formData.wife.nid}"
          onblur="checkDuplication(this.value, 'w-dup')" placeholder="الرقم القومي للزوجة (14 رقم) *">
        <input id="w-phone" maxlength="11" value="${formData.wife.phone}" placeholder="رقم هاتف الزوجة">
        <select>
          <option value="alive">على قيد الحياة</option>
          <option value="deceased">متوفاة</option>
          <option value="divorced">مطلقة / معيلة</option>
        </select>
      </div>
      <div id="w-dup" style="margin:8px 0; font-size:13px; font-weight:700;"></div>
      <div class="grid-2" style="margin-top:10px;">
        <select>${edus}</select>
        <select>${jobs}</select>
      </div>
      <div class="grid-2" style="background:#f8fafc; padding:12px; border-radius:10px; margin-top:10px; font-size:12px;">
        <div><strong>بطاقة الزوجة (أمامي):</strong><input type="file" id="file-w-front" accept="image/*" style="margin-top:4px;"></div>
        <div><strong>بطاقة الزوجة (ظهر):</strong><input type="file" id="file-w-back" accept="image/*" style="margin-top:4px;"></div>
      </div>
      <div style="display:flex; justify-content:space-between; margin-top:16px;">
        <button type="button" onclick="renderWizardStep(1)" class="nav-btn">→ السابق</button>
        <button type="button" onclick="saveWifeStep()" class="action-btn">التالي: الأبناء والسكن ←</button>
      </div>`;
  } else if (step === 3) {
    c.innerHTML = `
      <h4 style="color:#064e3b; font-weight:800; margin-bottom:10px;">
        الخطوة 4 من 6: الأبناء ووصف السكن
      </h4>
      <div id="children-list"></div>
      <button type="button" onclick="addChildCard()" class="nav-btn btn-gold" style="margin-bottom:14px;">
        + إضافة ابن / تابع
      </button>
      <div style="background:#f8fafc; padding:12px; border-radius:10px; border:1px solid #e2e8f0; margin-bottom:14px;">
        <p style="font-size:13px; font-weight:700; margin-bottom:8px;">
          وصف السكن والموقع الجغرافي:
        </p>
        <div class="grid-3">
          <select id="h-own">
            <option>ملكية خاصة</option>
            <option>إيجار قديم</option>
            <option>إيجار جديد</option>
          </select>
          <select id="h-roof">
            <option>سقف مسلح</option>
            <option>سقف خشب / جريد</option>
            <option>آيل للسقوط</option>
          </select>
          <button type="button" onclick="getGPS()" class="action-btn" style="background:#2563eb;">
            📍 تحديد موقع المنزل
          </button>
        </div>
        <p id="gps-txt" style="font-size:12px; color:#1d4ed8; font-weight:700; margin-top:6px;"></p>
      </div>
      <div style="display:flex; justify-content:space-between;">
        <button type="button" onclick="renderWizardStep(2)" class="nav-btn">→ السابق</button>
        <button type="button" onclick="renderWizardStep(4)" class="action-btn">التالي: الميزانية ←</button>
      </div>`;
    addChildCard();
  } else if (step === 4) {
    c.innerHTML = `
      <h4 style="color:#064e3b; font-weight:800; margin-bottom:10px;">
        الخطوة 5 من 6: المصروفات والدخل *
      </h4>
      <div class="grid-2" style="margin-bottom:12px;">
        <div style="background:#fef2f2; padding:12px; border-radius:10px;">
          <p style="font-weight:800; color:#991b1b; font-size:13px; margin-bottom:8px;">المصروفات الشهرية (ج.م)</p>
          <input type="number" oninput="calcBudget()" class="exp-in" placeholder="إيجار السكن" style="margin-bottom:6px;">
          <input type="number" oninput="calcBudget()" class="exp-in" placeholder="كهرباء ومياه" style="margin-bottom:6px;">
          <input type="number" oninput="calcBudget()" class="exp-in" placeholder="مصروفات الطعام" style="margin-bottom:6px;">
          <input type="number" oninput="calcBudget()" class="exp-in" placeholder="العلاج والتعليم" style="margin-bottom:6px;">
          <p style="font-weight:800; color:#991b1b; font-size:14px; margin-top:8px;">
            الإجمالي: <span id="tot-exp">0</span> ج.م
          </p>
        </div>
        <div style="background:#ecfdf5; padding:12px; border-radius:10px;">
          <p style="font-weight:800; color:#065f46; font-size:13px; margin-bottom:8px;">الدخل الشهري (ج.م)</p>
          <input type="number" oninput="calcBudget()" class="inc-in" placeholder="دخل الزوج" style="margin-bottom:6px;">
          <input type="number" oninput="calcBudget()" class="inc-in" placeholder="دخل الزوجة" style="margin-bottom:6px;">
          <input type="number" oninput="calcBudget()" class="inc-in" placeholder="معاش / تكافل" style="margin-bottom:6px;">
          <input type="number" oninput="calcBudget()" class="inc-in" placeholder="دخل الأولاد" style="margin-bottom:6px;">
          <p style="font-weight:800; color:#065f46; font-size:14px; margin-top:8px;">
            الإجمالي: <span id="tot-inc">0</span> ج.م
          </p>
        </div>
      </div>
      <div id="net-box" style="padding:12px; border-radius:10px; background:#f1f5f9; text-align:center; font-weight:800; margin-bottom:14px;">
        صافي الفرق: 0 ج.م
      </div>
      <div style="display:flex; justify-content:space-between;">
        <button type="button" onclick="renderWizardStep(3)" class="nav-btn">→ السابق</button>
        <button type="button" onclick="saveBudgetStep()" class="action-btn">التالي: المرفقات ←</button>
      </div>`;
  } else if (step === 5) {
    c.innerHTML = `
      <h4 style="color:#064e3b; font-weight:800; margin-bottom:10px;">
        الخطوة 6 من 6: المستندات المؤيدة والتأكيد
      </h4>
      <div class="grid-2" style="font-size:12px; margin-bottom:14px; gap:10px;">
        <div style="border:1px solid #cbd5e1; padding:10px; border-radius:10px;">
          <strong>البحث الاجتماعي المختوم:</strong><input type="file" id="doc-social" style="margin-top:4px;">
        </div>
        <div style="border:1px solid #cbd5e1; padding:10px; border-radius:10px;">
          <strong>برنت تأميني (الزوج والزوجة):</strong><input type="file" id="doc-ins" style="margin-top:4px;">
        </div>
        <div style="border:1px solid #cbd5e1; padding:10px; border-radius:10px;">
          <strong>جواب الحيازة الزراعية:</strong><input type="file" id="doc-agri" style="margin-top:4px;">
        </div>
        <div style="border:1px solid #cbd5e1; padding:10px; border-radius:10px;">
          <strong>إثبات قيد / قسيمة زواج:</strong><input type="file" id="doc-extra" style="margin-top:4px;">
        </div>
      </div>
      <label style="display:flex; align-items:center; gap:8px; font-size:13px; font-weight:700; background:#fffbeb; padding:12px; border-radius:10px; margin-bottom:14px;">
        <input type="checkbox" id="legal-agree" style="width:auto; margin:0;" checked>
        أقر بصحة البيانات وأوافق على اطلاع المؤسسة والشركاء عليها.
      </label>
      <div style="display:flex; justify-content:space-between;">
        <button type="button" onclick="renderWizardStep(4)" class="nav-btn">→ السابق</button>
        <button type="button" id="btn-submit-app" onclick="submitFinalApp()" class="action-btn" style="background:#d97706; color:#0f172a; font-weight:800;">
          ✅ إرسال واعتماد الطلب
        </button>
      </div>`;
  }
}

function nextFromStep0() {
  const aid = document.getElementById('w-aid').value;
  if (!aid) return alert('⚠️ يرجى اختيار نوع المساعدة.');
  formData.aid_type = aid;
  localStorage.setItem('alhafiz_draft', JSON.stringify(formData));
  renderWizardStep(1);
}

function toggleMed(id, val) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('hidden', val !== 'sick');
}

function updateCenters() {
  const govEl = document.getElementById('h-gov');
  if (!govEl) return;
  const gov = govEl.value;
  const cs = document.getElementById('h-center');
  const locations = typeof EGYPT_LOCATIONS !== 'undefined' ? EGYPT_LOCATIONS : {};
  const centers = Object.keys(locations[gov] || {});
  if (cs) {
    cs.innerHTML = centers.map(c => `<option value="${c}">${c}</option>`).join('');
  }
  updateVillages();
}

function updateVillages() {
  const govEl = document.getElementById('h-gov');
  const centerEl = document.getElementById('h-center');
  const vs = document.getElementById('h-village');
  if (!govEl || !centerEl || !vs) return;

  const gov = govEl.value;
  const center = centerEl.value;
  const locations = typeof EGYPT_LOCATIONS !== 'undefined' ? EGYPT_LOCATIONS : {};
  const villages = (locations[gov] && locations[gov][center]) || [];
  let opts = villages.map(v => `<option value="${v}">${v}</option>`).join('');
  opts += `<option value="other">+ أخرى (عزبة / نجع غير مدرج)</option>`;
  vs.innerHTML = opts;
  toggleCustomHamlet();
}

function toggleCustomHamlet() {
  const vs = document.getElementById('h-village');
  const customInput = document.getElementById('h-custom-hamlet');
  if (vs && customInput) {
    customInput.classList.toggle('hidden', vs.value !== 'other');
  }
}

async function saveHusbandStep() {
  const f = document.getElementById('h-first').value.trim();
  const s = document.getElementById('h-second').value.trim();
  const l = document.getElementById('h-last').value.trim();
  const nid = document.getElementById('h-nid').value.trim();
  const ph = document.getElementById('h-phone').value.trim();
  const addr = document.getElementById('h-addr').value.trim();
  const vSel = document.getElementById('h-village').value;
  const cHam = document.getElementById('h-custom-hamlet').value.trim();

  if (!f || !s || !l) return alert('⚠️ يرجى كتابة الاسم الثلاثي للزوج.');
  if (nid.length !== 14 || isNaN(nid)) return alert('⚠️ الرقم القومي 14 رقماً.');
  if (ph.length < 11) return alert('⚠️ رقم الموبايل 11 رقماً.');
  if (vSel === 'other' && !cHam) return alert('⚠️ اكتب اسم العزبة أو النجع.');
  if (!addr) return alert('⚠️ اكتب العنوان التفصيلي بالبطاقة.');

  await uploadDocFile(document.getElementById('file-h-front'), 'بطاقة الزوج أمامي');
  await uploadDocFile(document.getElementById('file-h-back'), 'بطاقة الزوج ظهر');

  formData.husband = {
    first: f, second: s, last: l, nid: nid, phone: ph,
    gov: document.getElementById('h-gov').value,
    center: document.getElementById('h-center').value,
    village: vSel === 'other' ? cHam : vSel,
    custom_hamlet: cHam, addr: addr
  };
  localStorage.setItem('alhafiz_draft', JSON.stringify(formData));
  renderWizardStep(2);
}

async function saveWifeStep() {
  const f = document.getElementById('w-first').value.trim();
  const s = document.getElementById('w-second').value.trim();
  const l = document.getElementById('w-last').value.trim();
  const nid = document.getElementById('w-nid').value.trim();

  if (!f || !s || !l) return alert('⚠️ يرجى كتابة الاسم الثلاثي للزوجة.');
  if (nid.length !== 14 || isNaN(nid)) return alert('⚠️ الرقم القومي للزوجة 14 رقماً.');

  await uploadDocFile(document.getElementById('file-w-front'), 'بطاقة الزوجة أمامي');
  await uploadDocFile(document.getElementById('file-w-back'), 'بطاقة الزوجة ظهر');

  formData.wife.first = f;
  formData.wife.second = s;
  formData.wife.last = l;
  formData.wife.nid = nid;
  formData.wife.phone = document.getElementById('w-phone').value.trim();
  localStorage.setItem('alhafiz_draft', JSON.stringify(formData));
  renderWizardStep(3);
}

function addChildCard() {
  const list = document.getElementById('children-list');
  if (!list) return;
  const idx = list.children.length + 1;
  const div = document.createElement('div');
  div.style.cssText = 'padding:12px; border:1px solid #e2e8f0; border-radius:10px; background:#f8fafc; margin-bottom:10px;';
  div.innerHTML = `
    <p style="font-weight:800; font-size:12px; color:#064e3b; margin-bottom:6px;">
      الابن / التابع (${idx})
    </p>
    <div class="grid-3">
      <input placeholder="الاسم رباعي">
      <input maxlength="14" placeholder="الرقم القومي (14 رقم)">
      <input type="number" placeholder="العمر بالسنوات">
    </div>
    <input type="file" accept="image/*" style="font-size:12px; margin-top:6px;">`;
  list.appendChild(div);
}

function getGPS() {
  if (!navigator.geolocation) return alert('GPS غير مدعوم');
  navigator.geolocation.getCurrentPosition(p => {
    formData.housing.gps = p.coords.latitude + ',' + p.coords.longitude;
    const gpsTxt = document.getElementById('gps-txt');
    if (gpsTxt) gpsTxt.innerText = '✅ تم التقاط الموقع: ' + formData.housing.gps;
  });
}

function calcBudget() {
  let exp = 0, inc = 0;
  document.querySelectorAll('.exp-in').forEach(i => exp += Number(i.value || 0));
  document.querySelectorAll('.inc-in').forEach(i => inc += Number(i.value || 0));
  formData.expenses.total = exp;
  formData.income.total = inc;
  
  const totExpEl = document.getElementById('tot-exp');
  const totIncEl = document.getElementById('tot-inc');
  if (totExpEl) totExpEl.innerText = exp;
  if (totIncEl) totIncEl.innerText = inc;

  const diff = inc - exp;
  const box = document.getElementById('net-box');
  if (box) {
    box.innerText = 'صافي الفرق: ' + diff + ' ج.م';
    box.style.background = diff < 0 ? '#fee2e2' : '#d1fae5';
    box.style.color = diff < 0 ? '#991b1b' : '#065f46';
  }
}

function saveBudgetStep() {
  if (!formData.expenses.total && !formData.income.total) {
    return alert('⚠️ يرجى إدخال بنود المصروفات أو الدخل الشهري أولاً.');
  }
  localStorage.setItem('alhafiz_draft', JSON.stringify(formData));
  renderWizardStep(5);
}

async function submitFinalApp() {
  const agree = document.getElementById('legal-agree');
  if (agree && !agree.checked) return alert('⚠️ يجب الموافقة على الإقرار القانوني.');

  const btn = document.getElementById('btn-submit-app');
  if (btn) btn.innerText = '⏳ جاري رفع المستندات وحفظ الطلب...';

  await uploadDocFile(document.getElementById('doc-social'), 'البحث الاجتماعي');
  await uploadDocFile(document.getElementById('doc-ins'), 'برنت تأميني');
  await uploadDocFile(document.getElementById('doc-agri'), 'الحيازة الزراعية');
  await uploadDocFile(document.getElementById('doc-extra'), 'مستندات إضافية');

  const code = 'HF-2026-' + Math.floor(1000 + Math.random() * 9000);
  if (wizardDb) {
    const res = await wizardDb.from('families').insert([{
      tracking_code: code,
      aid_type: formData.aid_type || 'مساعدة عامة',
      source_type: 'self',
      governorate: formData.husband.gov,
      center_city: formData.husband.center,
      village_hamlet: formData.husband.village,
      detailed_address: formData.husband.addr,
      gps_location: formData.housing.gps,
      total_expenses: formData.expenses.total || 0,
      total_income: formData.income.total || 0,
      duplication_warning: formData.duplication_warning
    }]).select().single();

    if (res.data) {
      if (formData.husband.nid) {
        await wizardDb.from('family_members').insert([{
          family_id: res.data.id,
          relation: 'husband',
          first_name: formData.husband.first,
          second_name: formData.husband.second,
          last_name: formData.husband.last,
          national_id: formData.husband.nid,
          phone: formData.husband.phone
        }]);
      }
      if (formData.wife.nid) {
        await wizardDb.from('family_members').insert([{
          family_id: res.data.id,
          relation: 'wife',
          first_name: formData.wife.first,
          second_name: formData.wife.second,
          last_name: formData.wife.last,
          national_id: formData.wife.nid,
          phone: formData.wife.phone
        }]);
      }
      for (const doc of formData.uploaded_docs) {
        await wizardDb.from('family_documents').insert([{
          family_id: res.data.id,
          doc_type: doc.type,
          file_url: doc.url
        }]);
      }
    }
  }

  localStorage.removeItem('alhafiz_draft');
  const waMsg = encodeURIComponent('كود متابعة طلبي في مؤسسة الحافظ للتنمية والخدمات هو: ' + code);
  const c = document.getElementById('wizard-container');
  if (c) {
    c.innerHTML = `
      <div style="text-align:center; padding:24px;">
        <div style="font-size:48px;">✅</div>
        <h3 style="color:#064e3b; margin:10px 0;">تم تسجيل واعتماد طلبكم بنجاح!</h3>
        <div style="display:inline-block; background:#ecfdf5; border:2px solid #059669; font-weight:800; font-size:22px; padding:10px 24px; border-radius:12px; margin-bottom:16px;">
          ${code}
        </div>
        <div>
          <a href="https://wa.me/?text=${waMsg}" target="_blank" class="action-btn" style="text-decoration:none; background:#16a34a; display:inline-block;">
            📲 إرسال كود الطلب عبر واتساب المؤسسة
          </a>
        </div>
      </div>`;
  }
}
