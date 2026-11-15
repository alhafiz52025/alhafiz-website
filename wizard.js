// wizard.js - التنقل بين الشاشات والاستمارة الذكية ورفع المستندات

// دالة مساعدة لرفع الملفات إلى Supabase Storage Bucket (documents)
async function uploadFileToSupabase(fileInput, folderName) {
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) return null;
  const client = window.supabaseClient;
  if (!client) return null;

  const file = fileInput.files[0];
  const fileExt = file.name.split('.').pop();
  const fileName = `${folderName}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

  try {
    const { error } = await client.storage
      .from('documents')
      .upload(fileName, file);

    if (error) {
      console.error('Error uploading file:', error.message);
      return null;
    }

    const { data: publicUrlData } = client.storage
      .from('documents')
      .getPublicUrl(fileName);

    return publicUrlData ? publicUrlData.publicUrl : null;
  } catch (err) {
    console.error('Storage exception:', err);
    return null;
  }
}

function showSection(sectionName) {
  const secs = [
    'home', 'about', 'apply', 'track',
    'contact', 'privacy', 'login'
  ];
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
  children: [],
  housing: { ownership: 'ملكية خاصة', roof: 'سقف مسلح', gps: '' },
  expenses: { total: 0 },
  income: { total: 0 },
  duplication_warning: null
};

function saveDraft() {
  localStorage.setItem('alhafiz_draft', JSON.stringify(formData));
  alert('💾 تم حفظ بياناتك كمسودة؛ يمكنك إكمالها في أي وقت.');
}

async function checkDuplication(nid, alertId) {
  const box = document.getElementById(alertId);
  if (!box) return;
  if (!nid || nid.length !== 14 || isNaN(nid)) {
    box.innerHTML = '<span style="color:#dc2626;">⚠️ الرقم القومي يجب أن يكون 14 رقماً.</span>';
    return;
  }
  const client = window.supabaseClient;
  if (!client) {
    box.innerHTML = '<span style="color:#047857;">✓ تم التحقق من صحة الرقم القومي.</span>';
    return;
  }
  box.innerHTML = '<span style="color:#64748b;">⏳ جاري فحص الرقم القومي...</span>';
  const res = await client.rpc('check_national_id_duplication', {
    p_national_id: nid,
    p_aid_type: formData.aid_type
  });
  if (res.error || !res.data) {
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
    const opts = (typeof AID_TYPES !== 'undefined' ? AID_TYPES : ['مساعدات نقدية', 'تجهيز عرائس', 'وصلات مياه', 'أسقف وسوتشات', 'علاج وتدخلات طبية']).map(a =>
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
    const govs = Object.keys(typeof EGYPT_LOCATIONS !== 'undefined' ? EGYPT_LOCATIONS : {'بني سويف': {'إهناسيا': ['منشأة عبدالصمد']}}).map(g =>
      `<option value="${g}" ${formData.husband.gov === g ? 'selected' : ''}>${g}</option>`
    ).join('');
    const edus = (typeof EDUCATION_LEVELS !== 'undefined' ? EDUCATION_LEVELS : [{value: 'متوسط', label: 'متوسط'}]).map(e =>
      `<option value="${e.value}">${e.label}</option>`
    ).join('');
    const jobs = (typeof EGYPT_JOBS !== 'undefined' ? EGYPT_JOBS : ['بدون عمل', 'زراعة', 'حرفي / يومية']).map(j =>
      `<option value="${j}">${j}</option>`
    ).join('');
    const meds = (typeof MEDICAL_NEEDS !== 'undefined' ? MEDICAL_NEEDS : ['أمراض مزمنة', 'عمليات جراحية']).map(m =>
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
        <select id="h-med-type">${meds}</select>
        <input type="file" id="h-med-file" accept="image/*" style="margin-top:6px;">
      </div>
      <div class="grid-2" style="background:#f8fafc; padding:12px; border-radius:10px; margin-top:10px; font-size:12px;">
        <div><strong>صورة بطاقة الزوج (أمامي):</strong><input type="file" id="h-front-file" accept="image/*" style="margin-top:4px;"></div>
        <div><strong>صورة بطاقة الزوج (ظهر):</strong><input type="file" id="h-back-file" accept="image/*" style="margin-top:4px;"></div>
      </div>
      <div style="display:flex; justify-content:space-between; margin-top:16px;">
        <button type="button" onclick="renderWizardStep(0)" class="nav-btn">→ السابق</button>
        <button type="button" onclick="saveHusbandStep()" class="action-btn">التالي: بيانات الزوجة ←</button>
      </div>`;
    updateCenters();
  } else if (step === 2) {
    const edus = (typeof EDUCATION_LEVELS !== 'undefined' ? EDUCATION_LEVELS : []).map(e => `<option value="${e.value}">${e.label}</option>`).join('');
    const jobs = (typeof EGYPT_JOBS !== 'undefined' ? EGYPT_JOBS : ['ربة منزل', 'زراعة']).map(j =>
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
        <select id="w-status">
          <option value="alive">على قيد الحياة</option>
          <option value="deceased">متوفاة</option>
          <option value="divorced">مطلقة / معيلة</option>
        </select>
      </div>
      <div id="w-dup" style="margin:8px 0; font-size:13px; font-weight:700;"></div>
      <div class="grid-2" style="margin-top:10px;">
        <select id="w-edu">${edus}</select>
        <select id="w-job">${jobs}</select>
      </div>
      <div class="grid-2" style="background:#f8fafc; padding:12px; border-radius:10px; margin-top:10px; font-size:12px;">
        <div><strong>بطاقة الزوجة (أمامي):</strong><input type="file" id="w-front-file" accept="image/*" style="margin-top:4px;"></div>
        <div><strong>بطاقة الزوجة (ظهر):</strong><input type="file" id="w-back-file" accept="image/*" style="margin-top:4px;"></div>
      </div>
      <div style="display:flex; justify-content:space-between; margin-top:16px;">
        <button type="button" onclick="renderWizardStep(1)" class="nav-btn">→ السابق</button>
        <button type="button" onclick="saveWifeStep()" class="action-btn">التالي: الأبناء والسكن ←</button>
      </div>`;
  } else if (step === 3) {
    c.innerHTML = `
      <h4 style="color:#064e3b; font-weight:800; margin-bottom:10px;">
        الخطوة 4 من 6: بيانات الأبناء ووصف السكن
      </h4>
      <div id="children-list"></div>
      <button type="button" onclick="addChildCard()" class="nav-btn btn-gold" style="margin-bottom:14px;">
        + إضافة ابن / تابع
      </button>
      <div style="background:#f8fafc; padding:12px; border-radius:10px; border:1px solid #e2e8f0; margin-bottom:14px;">
        <p style="font-size:13px; font-weight:700; margin-bottom:8px;">
          وصف السكن وتحديد الموقع الجغرافي (GPS):
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
        الخطوة 5 من 6: المصروفات والدخل الشهري *
      </h4>
      <div class="grid-2" style="margin-bottom:12px;">
        <div style="background:#fef2f2; padding:12px; border-radius:10px;">
          <p style="font
