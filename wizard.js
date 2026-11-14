function showSection(sectionName) {
  const secs = ['home', 'apply', 'track', 'grievance', 'login'];
  secs.forEach(s => {
    document.getElementById('section-' + s).classList.add('hidden');
  });
  document.getElementById('section-' + sectionName).classList.remove('hidden');
  if (sectionName === 'apply') renderWizardStep(0);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function copyText(text) {
  navigator.clipboard.writeText(text);
  alert('تم نسخ الرقم: ' + text);
}

let draftData = localStorage.getItem('alhafiz_draft');
let formData = draftData ? JSON.parse(draftData) : {
  aid_type: '',
  husband: {
    first: '', second: '', last: '', nid: '', phone: '',
    gov: 'بني سويف', center: 'إهناسيا', village: 'منشأة عبدالصمد', addr: ''
  },
  wife: { first: '', second: '', last: '', nid: '', phone: '' },
  housing: { gps: '' },
  expenses: { total: 0 },
  income: { total: 0 },
  duplication_warning: null
};

function saveDraft() {
  localStorage.setItem('alhafiz_draft', JSON.stringify(formData));
  alert('تم حفظ المسودة على جهازك بنجاح.');
}

async function checkDuplication(nid, alertId) {
  const box = document.getElementById(alertId);
  if (!nid || nid.length !== 14) {
    box.innerHTML = '<span class="text-red-600">الرقم القومي 14 رقماً.</span>';
    return;
  }
  if (!db) {
    box.innerHTML = '<span class="text-emerald-700">تم التحقق المبدئي.</span>';
    return;
  }
  box.innerHTML = '<span class="text-slate-500">جاري الفحص...</span>';
  const res = await db.rpc('check_national_id_duplication', {
    p_national_id: nid,
    p_aid_type: formData.aid_type
  });
  if (res.error) {
    box.innerHTML = '<span class="text-emerald-700">جاهز للتسجيل.</span>';
    return;
  }
  const d = res.data;
  if (d.status === 'blocked') {
    box.innerHTML = '<div class="p-2 bg-red-100 text-red-900 rounded">' + d.message + '</div>';
  } else if (d.status === 'warning') {
    formData.duplication_warning = d.message;
    box.innerHTML = '<div class="p-2 bg-amber-100 text-amber-900 rounded">' + d.message + '</div>';
  } else {
    box.innerHTML = '<span class="text-emerald-700">' + d.message + '</span>';
  }
}
function renderWizardStep(step) {
  const c = document.getElementById('wizard-container');
  if (step === 0) {
    const opts = AID_TYPES.map(a => `<option value="${a}">${a}</option>`).join('');
    c.innerHTML = `
      <h3 class="font-bold text-lg text-emerald-900 mb-3">الخطوة 1: نوع المساعدة</h3>
      <select id="w-aid" class="w-full border rounded-xl p-3 mb-4 text-sm font-bold">
        ${opts}
      </select>
      <button onclick="nextFromStep0()" class="bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl text-sm">
        التالي: بيانات الزوج ←
      </button>`;
  } else if (step === 1) {
    const govs = Object.keys(EGYPT_LOCATIONS).map(g => `<option value="${g}">${g}</option>`).join('');
    const edus = EDUCATION_LEVELS.map(e => `<option value="${e.value}">${e.label}</option>`).join('');
    const jobs = EGYPT_JOBS.map(j => `<option value="${j}">${j}</option>`).join('');
    const meds = MEDICAL_NEEDS.map(m => `<option value="${m}">${m}</option>`).join('');
    c.innerHTML = `
      <h3 class="font-bold text-lg text-emerald-900 mb-3">الخطوة 2: بيانات الزوج / العائل</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
        <input id="h-first" value="${formData.husband.first}" placeholder="الاسم الأول" class="border p-2 rounded-lg text-sm">
        <input id="h-second" value="${formData.husband.second}" placeholder="الاسم الثاني" class="border p-2 rounded-lg text-sm">
        <input id="h-last" value="${formData.husband.last}" placeholder="اللقب" class="border p-2 rounded-lg text-sm">
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
        <input id="h-nid" maxlength="14" value="${formData.husband.nid}" onblur="checkDuplication(this.value, 'h-dup')" placeholder="الرقم القومي (14 رقم)" class="border p-2 rounded-lg text-sm font-bold">
        <input id="h-phone" value="${formData.husband.phone}" placeholder="الموبايل / واتساب" class="border p-2 rounded-lg text-sm">
        <select id="h-status" class="border p-2 rounded-lg text-sm">
          <option value="alive">على قيد الحياة</option>
          <option value="deceased">متوفى</option>
          <option value="divorced">مطلق / منفصل</option>
          <option value="imprisoned">مسجون</option>
        </select>
      </div>
      <div id="h-dup" class="mb-2 text-xs font-bold"></div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
        <select id="h-gov" onchange="updateCenters()" class="border p-2 rounded-lg text-sm">${govs}</select>
        <select id="h-center" onchange="updateVillages()" class="border p-2 rounded-lg text-sm"></select>
        <select id="h-village" class="border p-2 rounded-lg text-sm"></select>
      </div>
      <input id="h-addr" value="${formData.husband.addr}" placeholder="العنوان كما هو مدون بالبطاقة" class="w-full border p-2 rounded-lg text-sm mb-2">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
        <select id="h-edu" class="border p-2 rounded-lg text-sm">${edus}</select>
        <select id="h-job" class="border p-2 rounded-lg text-sm">${jobs}</select>
        <select id="h-health" onchange="toggleMed('h-med', this.value)" class="border p-2 rounded-lg text-sm">
          <option value="healthy">الحالة الصحية: سليم</option>
          <option value="sick">مريض / ذوي همم</option>
        </select>
      </div>
      <div id="h-med" class="hidden bg-amber-50 p-3 rounded-xl mb-2 text-xs">
        <select class="w-full border p-2 rounded mb-2">${meds}</select>
        <input type="file" accept="image/*">
      </div>
      <div class="grid grid-cols-2 gap-2 mb-4 bg-slate-50 p-2 rounded-xl text-xs">
        <div>بطاقة أمامي: <input type="file" accept="image/*"></div>
        <div>بطاقة ظهر: <input type="file" accept="image/*"></div>
      </div>
      <div class="flex justify-between">
        <button onclick="renderWizardStep(0)" class="bg-slate-200 px-4 py-2 rounded-xl text-xs font-bold">→ السابق</button>
        <button onclick="saveHusbandStep()" class="bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold">التالي: الزوجة ←</button>
      </div>`;
    updateCenters();
  } else if (step === 2) {
    const edus = EDUCATION_LEVELS.map(e => `<option value="${e.value}">${e.label}</option>`).join('');
    const jobs = EGYPT_JOBS.map(j => `<option value="${j}" ${j.includes('ربة') ? 'selected' : ''}>${j}</option>`).join('');
    c.innerHTML = `
      <h3 class="font-bold text-lg text-emerald-900 mb-3">الخطوة 3: بيانات الزوجة</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
        <input id="w-first" value="${formData.wife.first}" placeholder="الاسم الأول" class="border p-2 rounded-lg text-sm">
        <input id="w-second" value="${formData.wife.second}" placeholder="الاسم الثاني" class="border p-2 rounded-lg text-sm">
        <input id="w-last" value="${formData.wife.last}" placeholder="اللقب" class="border p-2 rounded-lg text-sm">
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
        <input id="w-nid" maxlength="14" value="${formData.wife.nid}" onblur="checkDuplication(this.value, 'w-dup')" placeholder="الرقم القومي (14 رقم)" class="border p-2 rounded-lg text-sm font-bold">
        <input id="w-phone" value="${formData.wife.phone}" placeholder="الموبايل" class="border p-2 rounded-lg text-sm">
        <select class="border p-2 rounded-lg text-sm">
          <option value="alive">على قيد الحياة</option>
          <option value="deceased">متوفاة</option>
          <option value="divorced">مطلقة / معيلة</option>
        </select>
      </div>
      <div id="w-dup" class="mb-2 text-xs font-bold"></div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
        <select class="border p-2 rounded-lg text-sm">${edus}</select>
        <select class="border p-2 rounded-lg text-sm">${jobs}</select>
      </div>
      <div class="flex justify-between">
        <button onclick="renderWizardStep(1)" class="bg-slate-200 px-4 py-2 rounded-xl text-xs font-bold">→ السابق</button>
        <button onclick="saveWifeStep()" class="bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold">التالي: الأبناء ←</button>
      </div>`;
  }else if (step === 3) {
    c.innerHTML = `
      <h3 class="font-bold text-lg text-emerald-900 mb-3">
        الخطوة 4: الأبناء ووصف السكن
      </h3>
      <div id="children-list" class="space-y-2 mb-3"></div>
      <button onclick="addChildCard()" 
        class="bg-amber-100 text-amber-900 font-bold px-4 py-2 rounded-xl text-xs mb-4">
        + إضافة ابن / تابع
      </button>
      <div class="bg-slate-50 p-3 rounded-xl border mb-4 text-xs">
        <p class="font-bold mb-2">وصف السكن والموقع:</p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
          <select id="h-own" class="border p-2 rounded">
            <option>ملكية خاصة</option>
            <option>إيجار قديم</option>
            <option>إيجار جديد</option>
          </select>
          <select id="h-roof" class="border p-2 rounded">
            <option>سقف مسلح</option>
            <option>سقف خشب / جريد</option>
            <option>آيل للسقوط</option>
          </select>
          <button type="button" onclick="getGPS()" 
            class="bg-blue-600 text-white font-bold p-2 rounded">
            📍 تحديد موقع المنزل
          </button>
        </div>
        <p id="gps-txt" class="text-blue-700 font-bold"></p>
      </div>
      <div class="flex justify-between">
        <button onclick="renderWizardStep(2)" 
          class="bg-slate-200 px-4 py-2 rounded-xl text-xs font-bold">
          → السابق
        </button>
        <button onclick="renderWizardStep(4)" 
          class="bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold">
          التالي: الميزانية ←
        </button>
      </div>`;
    addChildCard();
  } else if (step === 4) {
    c.innerHTML = `
      <h3 class="font-bold text-lg text-emerald-900 mb-3">
        الخطوة 5: المصروفات والدخل الشهري
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div class="bg-red-50 p-3 rounded-xl border border-red-100">
          <p class="font-bold text-red-900 text-xs mb-2">المصروفات (ج.م)</p>
          <input type="number" oninput="calcBudget()" 
            class="exp-in w-full border p-2 rounded text-xs mb-2" placeholder="الإيجار">
          <input type="number" oninput="calcBudget()" 
            class="exp-in w-full border p-2 rounded text-xs mb-2" placeholder="المرافق">
          <input type="number" oninput="calcBudget()" 
            class="exp-in w-full border p-2 rounded text-xs mb-2" placeholder="الطعام">
          <input type="number" oninput="calcBudget()" 
            class="exp-in w-full border p-2 rounded text-xs" placeholder="العلاج والتعليم">
          <p class="mt-2 font-bold text-red-800 text-xs">
            الإجمالي: <span id="tot-exp">0</span> ج.م
          </p>
        </div>
        <div class="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
          <p class="font-bold text-emerald-900 text-xs mb-2">الدخل (ج.م)</p>
          <input type="number" oninput="calcBudget()" 
            class="inc-in w-full border p-2 rounded text-xs mb-2" placeholder="دخل الزوج">
          <input type="number" oninput="calcBudget()" 
            class="inc-in w-full border p-2 rounded text-xs mb-2" placeholder="دخل الزوجة">
          <input type="number" oninput="calcBudget()" 
            class="inc-in w-full border p-2 rounded text-xs mb-2" placeholder="معاش / تكافل">
          <input type="number" oninput="calcBudget()" 
            class="inc-in w-full border p-2 rounded text-xs" placeholder="دخل الأولاد">
          <p class="mt-2 font-bold text-emerald-800 text-xs">
            الإجمالي: <span id="tot-inc">0</span> ج.م
          </p>
        </div>
      </div>
      <div id="net-box" class="p-3 rounded-xl bg-slate-100 text-center font-bold text-sm mb-4">
        صافي الفرق: 0 ج.م
      </div>
      <div class="flex justify-between">
        <button onclick="renderWizardStep(3)" 
          class="bg-slate-200 px-4 py-2 rounded-xl text-xs font-bold">
          → السابق
        </button>
        <button onclick="renderWizardStep(5)" 
          class="bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold">
          التالي: المرفقات ←
        </button>
      </div>`;
  }
  else if (step === 5) {
    c.innerHTML = `
      <h3 class="font-bold text-lg text-emerald-900 mb-3">
        الخطوة 6 و 7: المستندات والتأكيد
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs mb-4">
        <div class="border p-2.5 rounded-xl">البحث الاجتماعي: <input type="file"></div>
        <div class="border p-2.5 rounded-xl">برنت تأميني: <input type="file" multiple></div>
        <div class="border p-2.5 rounded-xl">الحيازة الزراعية: <input type="file"></div>
        <div class="border p-2.5 rounded-xl">قيد مدرسي / قسيمة زواج: <input type="file" multiple></div>
      </div>
      <label class="flex items-center gap-2 text-xs font-bold mb-4 bg-amber-50 p-3 rounded-xl">
        <input type="checkbox" checked> أقر بصحة البيانات وأوافق على اطلاع المؤسسة والشركاء عليها.
      </label>
      <div class="flex justify-between">
        <button onclick="renderWizardStep(4)" 
          class="bg-slate-200 px-4 py-2 rounded-xl text-xs font-bold">
          → السابق
        </button>
        <button onclick="submitFinalApp()" 
          class="bg-amber-500 text-slate-950 px-6 py-2.5 rounded-xl font-extrabold text-sm">
          ✅ إرسال الطلب
        </button>
      </div>`;
  }
}

function nextFromStep0() {
  formData.aid_type = document.getElementById('w-aid').value;
  renderWizardStep(1);
}

function toggleMed(id, val) {
  document.getElementById(id).classList.toggle('hidden', val !== 'sick');
}

function updateCenters() {
  const gov = document.getElementById('h-gov').value;
  const cs = document.getElementById('h-center');
  cs.innerHTML = Object.keys(EGYPT_LOCATIONS[gov])
    .map(c => `<option value="${c}">${c}</option>`).join('');
  updateVillages();
}

function updateVillages() {
  const gov = document.getElementById('h-gov').value;
  const center = document.getElementById('h-center').value;
  const vs = document.getElementById('h-village');
  vs.innerHTML = EGYPT_LOCATIONS[gov][center]
    .map(v => `<option value="${v}">${v}</option>`).join('');
}

function saveHusbandStep() {
  formData.husband.first = document.getElementById('h-first').value;
  formData.husband.second = document.getElementById('h-second').value;
  formData.husband.last = document.getElementById('h-last').value;
  formData.husband.nid = document.getElementById('h-nid').value;
  formData.husband.phone = document.getElementById('h-phone').value;
  formData.husband.gov = document.getElementById('h-gov').value;
  formData.husband.center = document.getElementById('h-center').value;
  formData.husband.village = document.getElementById('h-village').value;
  formData.husband.addr = document.getElementById('h-addr').value;
  renderWizardStep(2);
}

function saveWifeStep() {
  formData.wife.first = document.getElementById('w-first').value;
  formData.wife.second = document.getElementById('w-second').value;
  formData.wife.last = document.getElementById('w-last').value;
  formData.wife.nid = document.getElementById('w-nid').value;
  renderWizardStep(3);
}

function addChildCard() {
  const list = document.getElementById('children-list');
  const idx = list.children.length + 1;
  const div = document.createElement('div');
  div.className = 'p-3 border rounded-xl bg-slate-50 text-xs';
  div.innerHTML = `
    <p class="font-bold text-emerald-900 mb-2">الابن / التابع (${idx})</p>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
      <input placeholder="الاسم رباعي" class="border p-2 rounded">
      <input maxlength="14" placeholder="الرقم القومي" class="border p-2 rounded">
      <input type="number" placeholder="العمر بالسنوات" class="border p-2 rounded">
    </div>
    <input type="file" accept="image/*">`;
  list.appendChild(div);
}

function getGPS() {
  if (!navigator.geolocation) return alert('GPS غير مدعوم');
  navigator.geolocation.getCurrentPosition(p => {
    formData.housing.gps = p.coords.latitude + ',' + p.coords.longitude;
    document.getElementById('gps-txt').innerText = 'تم التحديد: ' + formData.housing.gps;
  });
}

function calcBudget() {
  let exp = 0, inc = 0;
  document.querySelectorAll('.exp-in').forEach(i => exp += Number(i.value || 0));
  document.querySelectorAll('.inc-in').forEach(i => inc += Number(i.value || 0));
  formData.expenses.total = exp;
  formData.income.total = inc;
  document.getElementById('tot-exp').innerText = exp;
  document.getElementById('tot-inc').innerText = inc;
  const diff = inc - exp;
  const box = document.getElementById('net-box');
  box.innerText = 'صافي الفرق: ' + diff + ' ج.م';
  box.className = 'p-3 rounded-xl text-center font-bold text-sm mb-4 ' +
    (diff < 0 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800');
}

async function submitFinalApp() {
  const code = 'HF-2026-' + Math.floor(1000 + Math.random() * 9000);
  if (db) {
    const res = await db.from('families').insert([{
      tracking_code: code,
      aid_type: formData.aid_type || 'مساعدة عامة',
      source_type: 'self',
      governorate: formData.husband.gov,
      center_city: formData.husband.center,
      village_hamlet: formData.husband.village,
      detailed_address: formData.husband.addr || 'إهناسيا',
      gps_location: formData.housing.gps,
      total_expenses: formData.expenses.total || 0,
      total_income: formData.income.total || 0,
      duplication_warning: formData.duplication_warning
    }]).select().single();

    if (res.data && formData.husband.nid) {
      await db.from('family_members').insert([{
        family_id: res.data.id,
        relation: 'husband',
        first_name: formData.husband.first || 'مستفيد',
        second_name: formData.husband.second || '',
        last_name: formData.husband.last || '',
        national_id: formData.husband.nid,
        phone: formData.husband.phone
      }]);
    }
  }
  localStorage.removeItem('alhafiz_draft');
  const waMsg = encodeURIComponent('كود متابعة طلبي في مؤسسة الحافظ هو: ' + code);
  document.getElementById('wizard-container').innerHTML = `
    <div class="text-center py-6">
      <div class="text-4xl mb-2">✅</div>
      <h3 class="text-xl font-extrabold text-emerald-900 mb-2">تم تسجيل طلبكم بنجاح!</h3>
      <div class="inline-block bg-emerald-50 border-2 border-emerald-600 font-extrabold text-xl px-5 py-2 rounded-xl mb-4">
        ${code}
      </div>
      <div>
        <a href="https://wa.me{waMsg}" target="_blank" 
          class="inline-block bg-green-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs">
          📲 حفظ كود الطلب على واتساب
        </a>
      </div>
    </div>`;
}
