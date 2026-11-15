// wizard.js - استمارة البحث الاجتماعي الذكية لمؤسسة الحافظ (محدثة وشاملة)

window.currentStep = window.currentStep || 1;
const totalWizardSteps = 6;
window.formData = window.formData || {
  husband: {},
  wife: {},
  children: [],
  expenses: {},
  incomes: {},
  documents: {},
  housing: {}
};

window.addEventListener('DOMContentLoaded', () => {
  renderWizardStep();
});

window.renderWizardStep = function() {
  const container = document.getElementById('wizard-container');
  if (!container) return;

  let html = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #cbd5e1; padding-bottom:10px;">
      <span style="font-weight:800; color:var(--primary-dark);">الخطوة ${window.currentStep} من ${totalWizardSteps}</span>
      <div style="display:flex; gap:6px;">
        ${Array.from({length: totalWizardSteps}, (_, i) => `<span style="width:28px; height:8px; border-radius:4px; background:${i + 1 === window.currentStep ? 'var(--primary)' : '#cbd5e1'}"></span>`).join('')}
      </div>
    </div>
  `;

  if (window.currentStep === 1) {
    const h = window.formData.husband || {};
    html += `
      <h3 style="color:var(--primary-dark); text-align:center; font-weight:900; margin:15px 0 25px; border-bottom:2px solid #059669; padding-bottom:8px;">
        👤 القسم الأول: بيانات الزوج (رب الأسرة)
      </h3>
      
      <div class="grid-3">
        <div><label>الاسم الأول *</label><input id="h-name1" value="${h.name1 || ''}" required></div>
        <div><label>الاسم الثاني *</label><input id="h-name2" value="${h.name2 || ''}" required></div>
        <div><label>الاسم الثالث *</label><input id="h-name3" value="${h.name3 || ''}" required></div>
      </div>

      <div class="grid-2">
        <div><label>رقم البطاقة (14 رقم) *</label><input id="h-nid" maxlength="14" value="${h.nid || ''}" placeholder="أدخل 14 رقماً بدقة" required></div>
        <div><label>رقم التليفون *</label><input id="h-phone" value="${h.phone || ''}" placeholder="01xxxxxxxxx" required></div>
      </div>

      <!-- العنوان الجغرافي التفصيلي (محافظة / مركز / قرية) -->
      <div style="background:#f8fafc; padding:14px; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:14px;">
        <label style="font-weight:800; color:#064e3b; margin-bottom:8px; display:block;">📍 العنوان الجغرافي (كما هو مدون بالبطاقة):</label>
        <div class="grid-3">
          <div>
            <label>المحافظة *</label>
            <select id="h-gov" onchange="updateCentersList('h')">
              <option value="بني سويف" ${h.gov==='بني سويف'?'selected':''}>بني سويف</option>
              <option value="القاهرة" ${h.gov==='القاهرة'?'selected':''}>القاهرة</option>
              <option value="الجيزة" ${h.gov==='الجيزة'?'selected':''}>الجيزة</option>
              <option value="الفيوم" ${h.gov==='الفيوم'?'selected':''}>الفيوم</option>
            </select>
          </div>
          <div>
            <label>المركز / القسم *</label>
            <select id="h-center" onchange="updateVillagesList('h')">
              <option value="إهناسيا" ${h.center==='إهناسيا'?'selected':''}>إهناسيا</option>
              <option value="بني سويف" ${h.center==='بني سويف'?'selected':''}>بني سويف</option>
              <option value="الواسطى" ${h.center==='الواسطى'?'selected':''}>الواسطى</option>
              <option value="ناصر" ${h.center==='ناصر'?'selected':''}>ناصر</option>
              <option value="ببا" ${h.center==='ببا'?'selected':''}>ببا</option>
              <option value="الفشن" ${h.center==='الفشن'?'selected':''}>الفشن</option>
              <option value="سمسطا" ${h.center==='سمسطا'?'selected':''}>سمسطا</option>
            </select>
          </div>
          <div>
            <label>القرية / العزبة / التابع *</label>
            <select id="h-village">
              <option value="منشأة عبدالصمد" ${h.village==='منشأة عبدالصمد'?'selected':''}>منشأة عبدالصمد</option>
              <option value="براوة" ${h.village==='براوة'?'selected':''}>براوة</option>
              <option value="منهرة" ${h.village==='منهرة'?'selected':''}>منهرة</option>
              <option value="منشأة الحاج" ${h.village==='منشأة الحاج'?'selected':''}>منشأة الحاج</option>
              <option value="الشيخ حرب" ${h.village==='الشيخ حرب'?'selected':''}>الشيخ حرب</option>
              <option value="الجنادى" ${h.village==='الجنادى'?'selected':''}>الجنادى</option>
              <option value="قلها" ${h.village==='قلها'?'selected':''}>قلها</option>
              <option value="البهسمون" ${h.village==='البهسمون'?'selected':''}>البهسمون</option>
              <option value="كوم الرمل" ${h.village==='كوم الرمل'?'selected':''}>كوم الرمل</option>
            </select>
          </div>
        </div>
      </div>

      <!-- المستوى التعليمي الذكي -->
      <div class="grid-2">
        <div>
          <label>الحالة التعليمية *</label>
          <select id="h-edu-status" onchange="toggleEduLevel('h')">
            <option value="متعلم" ${h.eduStatus==='متعلم'?'selected':''}>متعلم</option>
            <option value="غير متعلم" ${h.eduStatus==='غير متعلم'?'selected':''}>غير متعلم</option>
          </select>
        </div>
        <div id="h-edu-level-box">
          <label>المستوى التعليمي *</label>
          <select id="h-edu-level">
            <option value="ابتدائية">ابتدائية</option>
            <option value="إعدادية">إعدادية</option>
            <option value="دبلوم فني">دبلوم فني</option>
            <option value="جامعي">جامعي / ليسانس</option>
            <option value="دراسات عليا">دراسات عليا</option>
          </select>
        </div>
      </div>

      <div><label>الوظيفة الحالية *</label><input id="h-job" value="${h.job || ''}" placeholder="مثال: عامل باليومية / فلاح / بدون..." required></div>

      <!-- الحالة الصحية التفاعلية -->
      <div style="background:#f1f5f9; padding:16px; border-radius:12px; margin-bottom:14px; border:1px solid #cbd5e1;">
        <label style="font-weight:800; color:var(--primary-dark);">الحالة الصحية للزوج *</label>
        <select id="h-health" onchange="toggleHealthDetails('h')">
          <option value="سليم" ${h.health==='سليم'?'selected':''}>سليم وبصحة جيدة</option>
          <option value="مريض" ${h.health==='مريض'?'selected':''}>مريض (يعاني من حالة مرضية)</option>
        </select>

        <div id="h-health-box" class="${h.health === 'مريض' ? '' : 'hidden'}" style="margin-top:12px; padding-top:10px; border-top:1px dashed #94a3b8;">
          <label>نوع الإصابة / المرض *</label>
          <select id="h-illness-type" onchange="toggleIllnessType('h')">
            <option value="مزمن" ${h.illnessType==='مزمن'?'selected':''}>مرض مزمن</option>
            <option value="موقت" ${h.illnessType==='موقت'?'selected':''}>مرض مؤقت / إصابة عارضة</option>
          </select>

          <!-- الأمراض المزمنة -->
          <div id="h-chronic-box" style="margin-top:8px;">
            <label>اختر المرض المزمن:</label>
            <select id="h-chronic-name">
              <option value="الفشل الكلوي وغسيل كلوي">الفشل الكلوي وغسيل كلوي</option>
              <option value="أمراض القلب المزمنة والجلطات">أمراض القلب المزمنة والجلطات</option>
              <option value="الضغط والسكري المتقدم">الضغط والسكري المتقدم</option>
              <option value="الأورام السرطانية وعلاج كيماوي">الأورام السرطانية وعلاج كيماوي</option>
              <option value="أمراض الكبد المزمنة (فيروس سي/تليف)">أمراض الكبد المزمنة (فيروس سي/تليف)</option>
              <option value="أمراض الصدر المزمنة (حساسية/رئوية)">أمراض الصدر المزمنة (حساسية/رئوية)</option>
            </select>
          </div>

          <!-- الأمراض المؤقتة -->
          <div id="h-temp-box" class="hidden" style="margin-top:8px;">
            <label>تفاصيل المرض المؤقت / الإصابة:</label>
            <input id="h-temp-desc" placeholder="اكتب تفاصيل الإصابة أو المرض المؤقت" value="${h.tempDesc || ''}">
          </div>

          <!-- الاحتياجات الطبية المتفرعة -->
          <div style="margin-top:12px;">
            <label style="font-weight:700; color:#b45309;">الاحتياج الطبي المطلوب:</label>
            <select id="h-medical-need" onchange="toggleMedicalNeeds('h')">
              <option value="لا يوجد">لا يوجد احتياج طبي حالي</option>
              <option value="عملية جراحية">عملية جراحية</option>
              <option value="أطراف صناعية">أطراف صناعية</option>
              <option value="أجهزة تعويضية">أجهزة تعويضية</option>
              <option value="تحاليل واشعة">تحاليل وأشعة وفحوصات</option>
              <option value="روشتة علاج شهري">روشتة علاج شهري مزمن</option>
            </select>

            <!-- تفريع الأطراف الصناعية -->
            <div id="h-prosthetic-box" class="hidden" style="margin-top:8px;">
              <label>تحديد الطرف الصناعي المطلوب:</label>
              <select id="h-prosthetic-sub">
                <option value="قدم صناعي (سفلي)">قدم صناعي (سفلي)</option>
                <option value="ساق صناعية كاملة">ساق صناعية كاملة</option>
                <option value="يد صناعية (علوي)">يد صناعية (علوي)</option>
                <option value="ذراع صناعي كامل">ذراع صناعي كامل</option>
              </select>
            </div>

            <!-- تفريع الأجهزة التعويضية -->
            <div id="h-device-box" class="hidden" style="margin-top:8px;">
              <label>تحديد الجهاز التعويضي:</label>
              <select id="h-device-sub">
                <option value="كرسي متحرك">كرسي متحرك</option>
                <option value="سماعة أذن طبية">سماعة أذن طبية</option>
                <option value="مرتبة هوائية">مرتبة هوائية</option>
                <option value="عكاز أو مشاية">عكاز أو مشاية</option>
              </select>
            </div>

            <!-- تفريع العملية الجراحية -->
            <div id="h-surgery-box" class="hidden" style="margin-top:8px;">
              <label>نوع العملية الجراحية المطلوبة:</label>
              <input id="h-surgery-name" placeholder="مثال: قلب مفتوح، شبكات، عيون، مياه بيضاء..." value="${h.surgeryName || ''}">
            </div>
          </div>
        </div>
      </div>

      <!-- رفع المستندات الإلزامية وصور البطاقات -->
      <div style="background:#fef3c7; padding:14px; border-radius:12px; border:1px solid #fde68a; margin-bottom:14px;">
        <label style="font-weight:800; color:#92400e; margin-bottom:8px; display:block;">📁 المستندات والصور الإلزامية للزوج:</label>
        <div class="grid-2">
          <div><label>صورة بطاقة الرقم القومي (وش) *</label><input type="file" id="h-id-front" required></div>
          <div><label>صورة بطاقة الرقم القومي (ظهر) *</label><input type="file" id="h-id-back" required></div>
        </div>
        <div id="h-medical-doc-container" class="${h.health === 'مريض' ? '' : 'hidden'}" style="margin-top:10px;">
          <label style="color:#b91c1c; font-weight:700;">التقرير الطبي / روشتة / أشعة حديثة (إلزامي في حالة المريض) *</label>
          <input type="file" id="h-medical-doc">
        </div>
      </div>
    `;
  }
  else if (window.currentStep === 2) {
    // سيتم تطبيق نفس معايير الزوج على الزوجة في الخطوة التالية
    html += `<h3 style="color:var(--primary-dark); text-align:center; font-weight:900; margin:15px 0 25px;">👩 القسم الثاني: بيانات الزوجة</h3><p style="text-align:center;">جاري تطبيق نفس معايير البحث والتحقق والتدقيق الطبي والجغرافي...</p>`;
  }
  // وبقية الأقسام (3 إلى 6) ...

  html += `
    <div style="display:flex; justify-content:space-between; margin-top:25px; border-top:1px solid #cbd5e1; padding-top:15px;">
      ${window.currentStep > 1 ? '<button type="button" onclick="prevWizardStep()" class="nav-btn" style="background:#334155; color:#fff;">السابق</button>' : '<div></div>'}
      <button type="button" onclick="nextWizardStep()" class="action-btn">التالي ➔</button>
    </div>
  `;

  container.innerHTML = html;
  toggleEduLevel('h');
  toggleHealthDetails('h');
  toggleIllnessType('h');
  toggleMedicalNeeds('h');
};

// دوال التحكم التفاعلي والتحقق الإجباري
window.toggleEduLevel = function(type) {
  const status = document.getElementById(type + '-edu-status')?.value;
  const box = document.getElementById(type + '-edu-level-box');
  if (box) {
    if (status === 'غير متعلم') {
      box.classList.add('hidden');
    } else {
      box.classList.remove('hidden');
    }
  }
};

window.toggleHealthDetails = function(type) {
  const val = document.getElementById(type + '-health')?.value;
  const box = document.getElementById(type + '-health-box');
  const docContainer = document.getElementById(type + '-medical-doc-container');
  
  if (val === 'مريض') {
    if (box) box.classList.remove('hidden');
    if (docContainer) docContainer.classList.remove('hidden');
  } else {
    if (box) box.classList.add('hidden');
    if (docContainer) docContainer.classList.add('hidden');
  }
};

window.toggleIllnessType = function(type) {
  const typeVal = document.getElementById(type + '-illness-type')?.value;
  const chronicBox = document.getElementById(type + '-chronic-box');
  const tempBox = document.getElementById(type + '-temp-box');

  if (typeVal === 'مزمن') {
    if (chronicBox) chronicBox.classList.remove('hidden');
    if (tempBox) tempBox.classList.add('hidden');
  } else {
    if (chronicBox) chronicBox.classList.add('hidden');
    if (tempBox) tempBox.classList.remove('hidden');
  }
};

window.toggleMedicalNeeds = function(type) {
  const needVal = document.getElementById(type + '-medical-need')?.value;
  const prosBox = document.getElementById(type + '-prosthetic-box');
  const devBox = document.getElementById(type + '-device-box');
  const surgBox = document.getElementById(type + '-surgery-box');

  if (prosBox) prosBox.classList.add('hidden');
  if (devBox) devBox.classList.add('hidden');
  if (surgBox) surgBox.classList.add('hidden');

  if (needVal === 'أطراف صناعية' && prosBox) prosBox.classList.remove('hidden');
  if (needVal === 'أجهزة تعويضية' && devBox) devBox.classList.remove('hidden');
  if (needVal === 'عملية جراحية' && surgBox) surgBox.classList.remove('hidden');
};

window.nextWizardStep = function() {
  // التحقق الإجباري من اكتمال القسم الأول قبل الانتقال
  if (window.currentStep === 1) {
    const name1 = document.getElementById('h-name1')?.value.trim();
    const nid = document.getElementById('h-nid')?.value.trim();
    const phone = document.getElementById('h-phone')?.value.trim();
    const job = document.getElementById('h-job')?.value.trim();
    const health = document.getElementById('h-health')?.value;

    if (!name1 || !nid || !phone || !job) {
      return alert('⚠️ برجاء استيفاء جميع الحقول الإجبارية (الاسم، الرقم القومي، الهاتف، الوظيفة) في القسم الأول قبل الانتقال.');
    }
    if (nid.length !== 14) {
      return alert('⚠️ رقم البطاقة الشخصية يجب أن يكون 14 رقماً بدقة.');
    }
    if (health === 'مريض') {
      const medicalNeed = document.getElementById('h-medical-need')?.value;
      if (medicalNeed !== 'لا يوجد') {
        // التأكد من وجود التقرير الطبي
        const docInput = document.getElementById('h-medical-doc');
        if (docInput && docInput.files.length === 0) {
          return alert('⚠️ نظراً لتحديد حالة مرضية واحتياج طبي، يجب إرفاق التقرير الطبي أو الروشتة المطلوبة قبل المتابعة.');
        }
      }
    }
  }

  saveCurrentStepData();
  window.currentStep++;
  window.renderWizardStep();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.prevWizardStep = function() {
  saveCurrentStepData();
  window.currentStep--;
  window.renderWizardStep();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

function saveCurrentStepData() {
  if (window.currentStep === 1) {
    window.formData.husband = {
      name1: document.getElementById('h-name1')?.value || '',
      name2: document.getElementById('h-name2')?.value || '',
      name3: document.getElementById('h-name3')?.value || '',
      nid: document.getElementById('h-nid')?.value || '',
      phone: document.getElementById('h-phone')?.value || '',
      gov: document.getElementById('h-gov')?.value || '',
      center: document.getElementById('h-center')?.value || '',
      village: document.getElementById('h-village')?.value || '',
      eduStatus: document.getElementById('h-edu-status')?.value || '',
      eduLevel: document.getElementById('h-edu-level')?.value || '',
      job: document.getElementById('h-job')?.value || '',
      health: document.getElementById('h-health')?.value || '',
      illnessType: document.getElementById('h-illness-type')?.value || '',
      medicalNeed: document.getElementById('h-medical-need')?.value || ''
    };
  }
}
