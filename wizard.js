// wizard.js - المعالج الشامل والمحدث لاستمارة البحث الاجتماعي لمؤسسة الحافظ
(function() {
  window.currentStep = window.currentStep || 1;
  window.totalWizardSteps = 8;

  if (typeof window.formData === 'undefined') {
    window.formData = {
      interventionType: 'كفالة أيتام شهرية',
      husband: {
        health: 'سليم',
        illnessType: 'مؤقت',
        medicalNeed: 'إجراء عملية جراحية',
        subDetail: '',
        monthlyCost: '',
        birthDate: '',
        gender: ''
      },
      wife: {
        maritalStatus: 'متزوجة ومقيمة مع الأسرة',
        health: 'سليم',
        illnessType: 'مؤقت',
        medicalNeed: 'إجراء عملية جراحية',
        subDetail: '',
        monthlyCost: '',
        birthDate: '',
        gender: ''
      },
      children: [],
      marriage: {
        birthDate: '',
        gender: 'أنثى'
      },
      expenses: {
        rent: 0, water: 0, electric: 0, gas: 0,
        edu: 0, health: 0, food: 0, debts: 0
      },
      incomes: {
        husband: 0, others: 0, pension: 0, aid: 0
      },
      housing: {
        case: 'ملك',
        type: 'ريفي / بيت ريفي',
        roof: 'خشب',
        walls: 'طوب لبن',
        floor: 'ترابية',
        furniture: 'رديء',
        deficiencies: [],
        opinion: 'حالة شديدة الاستحقاق وعاجلة'
      },
      documents: {}
    };
  }

  window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('wizard-container')) {
      window.renderWizardStep();
    }
  });

  // استخراج تاريخ الميلاد والنوع من الرقم القومي المصري (14 رقماً)
  window.parseEgyptianNationalId = function(nid) {
    const clean = String(nid || '').replace(/\D/g, '');
    if (!/^[23]\d{13}$/.test(clean)) {
      return { valid: false, birthDate: '', gender: '', age: null };
    }

    const centuryDigit = clean[0];
    const yearTwo = parseInt(clean.slice(1, 3), 10);
    const month = parseInt(clean.slice(3, 5), 10);
    const day = parseInt(clean.slice(5, 7), 10);
    const genderDigit = parseInt(clean[12], 10);

    const fullYear = (centuryDigit === '2' ? 1900 : 2000) + yearTwo;
    const birthDateObj = new Date(fullYear, month - 1, day);

    const isRealDate =
      birthDateObj.getFullYear() === fullYear &&
      birthDateObj.getMonth() === month - 1 &&
      birthDateObj.getDate() === day &&
      month >= 1 && month <= 12 &&
      day >= 1 && day <= 31;

    if (!isRealDate) {
      return { valid: false, birthDate: '', gender: '', age: null };
    }

    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const birthDateStr = `${fullYear}-${mm}-${dd}`;
    const genderStr = genderDigit % 2 === 1 ? 'ذكر' : 'أنثى';

    const today = new Date();
    let age = today.getFullYear() - fullYear;
    const mDiff = today.getMonth() - (month - 1);
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < day)) {
      age--;
    }

    return { valid: true, birthDate: birthDateStr, gender: genderStr, age };
  };

  window.handleNidInput = function(targetType, childIndex = null) {
    let nidVal = '';
    let birthEl = null;
    let genderEl = null;

    if (targetType === 'h') {
      nidVal = document.getElementById('h-nid')?.value || '';
      birthEl = document.getElementById('h-birth-date');
      genderEl = document.getElementById('h-gender');
    } else if (targetType === 'w') {
      nidVal = document.getElementById('w-nid')?.value || '';
      birthEl = document.getElementById('w-birth-date');
      genderEl = document.getElementById('w-gender');
    } else if (targetType === 'm') {
      nidVal = document.getElementById('m-nid')?.value || '';
      birthEl = document.getElementById('m-birth-date');
      genderEl = document.getElementById('m-gender');
    } else if (targetType === 'c' && childIndex !== null) {
      const row = document.querySelectorAll('#children-list > div')[childIndex];
      nidVal = row?.querySelector('.c-nid')?.value || '';
      birthEl = row?.querySelector('.c-birth-date');
      genderEl = row?.querySelector('.c-gender');
    }

    const parsed = window.parseEgyptianNationalId(nidVal);
    if (birthEl) birthEl.value = parsed.valid ? parsed.birthDate : '';
    if (genderEl) genderEl.value = parsed.valid ? parsed.gender : '';

    if (targetType === 'h') {
      window.formData.husband.nid = nidVal;
      window.formData.husband.birthDate = parsed.birthDate;
      window.formData.husband.gender = parsed.gender;
    } else if (targetType === 'w') {
      window.formData.wife.nid = nidVal;
      window.formData.wife.birthDate = parsed.birthDate;
      window.formData.wife.gender = parsed.gender;
    } else if (targetType === 'm') {
      window.formData.marriage.nid = nidVal;
      window.formData.marriage.birthDate = parsed.birthDate;
      window.formData.marriage.gender = parsed.gender;
    } else if (targetType === 'c' && childIndex !== null && window.formData.children[childIndex]) {
      window.formData.children[childIndex].nid = nidVal;
      window.formData.children[childIndex].birthDate = parsed.birthDate;
      window.formData.children[childIndex].gender = parsed.gender;
    }
  };

  window.renderWizardStep = function() {
    const container = document.getElementById('wizard-container');
    if (!container) return;

    let html = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #cbd5e1; padding-bottom:10px;">
        <span style="font-weight:800; color:var(--primary-dark);">الخطوة ${window.currentStep} من ${window.totalWizardSteps}</span>
        <div style="display:flex; gap:4px;">
          ${Array.from({length: window.totalWizardSteps}, (_, i) => `<span style="width:24px; height:6px; border-radius:3px; background:${i + 1 === window.currentStep ? 'var(--primary)' : '#cbd5e1'}"></span>`).join('')}
        </div>
      </div>
      <div id="step-validation-alert" class="hidden" style="background:#fef2f2; border:1px solid #fecaca; color:#991b1b; padding:10px 12px; border-radius:8px; margin-bottom:14px; font-size:13px; font-weight:700;"></div>
    `;

    // --- الخطوة 1: تحديد نوع التدخل الأساسي ---
    if (window.currentStep === 1) {
      const aidOptions = (window.AID_TYPES || []).map(a => `<option value="${a}" ${window.formData.interventionType===a?'selected':''}>${a}</option>`).join('');
      html += `
        <h4 style="color:var(--primary-dark); margin-top:0;">🎯 الخطوة الأولى: تحديد نوع التدخل والمساعدات الخاصة</h4>
        <div style="margin-bottom:14px;">
          <label style="font-weight:700;">نوع المساعدة الأساسية المطلوبة للأسرة *</label>
          <select id="intervention-type" onchange="window.formData.interventionType = this.value">
            ${aidOptions}
          </select>
        </div>
        <p style="font-size:13px; color:#64748b;">يرجى استكمال كل قسم بالكامل قبل الانتقال إلى القسم التالي.</p>
      `;
    }
       // --- الخطوة 2: بيانات الزوج (رب الأسرة) ---
    else if (window.currentStep === 2) {
      const locs = window.EGYPT_LOCATIONS || {};
      const govKeys = Object.keys(locs);
      const selectedGov = window.formData.husband?.gov || '';
      const govOptions = `<option value="">-- اختر المحافظة أولاً --</option>` +
        govKeys.map(g => `<option value="${g}" ${g===selectedGov?'selected':''}>${g}</option>`).join('');

      const centers = (selectedGov && locs[selectedGov]) ? Object.keys(locs[selectedGov]) : [];
      const selectedCenter = (selectedGov && locs[selectedGov]?.[window.formData.husband?.center]) ? window.formData.husband.center : '';
      const centerOptions = `<option value="">-- اختر المركز / القسم --</option>` +
        centers.map(c => `<option value="${c}" ${c===selectedCenter?'selected':''}>${c}</option>`).join('');

      const baseVillages = (selectedGov && selectedCenter && locs[selectedGov]?.[selectedCenter]) ? locs[selectedGov][selectedCenter] : [];
      const customVills = (window.CUSTOM_LOCATIONS_CACHE?.[selectedGov]?.[selectedCenter]) || [];
      const allVillages = Array.from(new Set([...baseVillages, ...customVills]));
      const selectedVillage = window.formData.husband?.village || '';
      const villageOptions = `<option value="">-- اختر القرية أو التابع --</option>` +
        allVillages.map(v => `<option value="${v}" ${v===selectedVillage?'selected':''}>${v}</option>`).join('') +
        (selectedCenter ? `<option value="__NEW__" ${selectedVillage==='__NEW__'?'selected':''}>+ إضافة قرية / عزبة / تابع جديد غير مدرج</option>` : '');


      const statusOptions = (window.HUSBAND_MARITAL_STATUSES || []).map(s => `<option value="${s}" ${window.formData.husband.status===s?'selected':''}>${s}</option>`).join('');
      const jobOptions = (window.EGYPT_JOBS || []).map(j => `<option value="${j}" ${window.formData.husband.job===j?'selected':''}>${j}</option>`).join('');

      html += `
        <h4 style="color:var(--primary-dark); margin-top:0;">👤 القسم الأول: بيانات الزوج (رب الأسرة)</h4>
        <div class="grid-3">
          <div><label>الاسم الأول *</label><input id="h-name1" value="${window.formData.husband.name1 || ''}"></div>
          <div><label>الاسم الثاني *</label><input id="h-name2" value="${window.formData.husband.name2 || ''}"></div>
          <div><label>الاسم الثالث والعائلة *</label><input id="h-name3" value="${window.formData.husband.name3 || ''}"></div>
        </div>
        <div class="grid-3">
          <div>
            <label>الحالة الاجتماعية *</label>
            <select id="h-status">${statusOptions}</select>
          </div>
          <div>
            <label>الرقم القومي (14 رقم حصراً) *</label>
            <input id="h-nid" maxlength="14" value="${window.formData.husband.nid || ''}" oninput="window.handleNidInput('h')">
          </div>
          <div>
            <label>النوع (تلقائي من الرقم القومي)</label>
            <input id="h-gender" readonly value="${window.formData.husband.gender || ''}" style="background:#f1f5f9;">
          </div>
        </div>
        <div class="grid-2" style="margin-top:8px;">
          <div>
            <label>تاريخ الميلاد (تلقائي من الرقم القومي)</label>
            <input id="h-birth-date" readonly value="${window.formData.husband.birthDate || ''}" style="background:#f1f5f9;">
          </div>
          <div>
            <label>المستوى التعليمي *</label>
            <select id="h-edu-level">
              <option value="غير متعلم" ${window.formData.husband.eduLevel==='غير متعلم'?'selected':''}>غير متعلم (لا يقرأ ولا يكتب)</option>
              <option value="متعلم" ${window.formData.husband.eduLevel!=='غير متعلم'?'selected':''}>متعلم</option>
            </select>
          </div>
        </div>

                <div style="background:#f8fafc; padding:12px; border-radius:8px; margin:10px 0; border:1px solid #cbd5e1;">
          <label style="font-weight:700; color:var(--primary-dark);">العنوان الإداري (التسلسل الجغرافي المعتمد) *</label>
          <div class="grid-3" style="margin-top:6px;">
            <div>
              <label style="font-size:11px;">1. المحافظة:</label>
              <select id="h-gov" onchange="updateGeoCenters()">${govOptions}</select>
            </div>
            <div>
              <label style="font-size:11px;">2. المركز / القسم:</label>
              <select id="h-center" onchange="updateGeoVillages()" ${!selectedGov ? 'disabled' : ''}>${centerOptions}</select>
            </div>
            <div>
              <label style="font-size:11px;">3. القرية أو التابع:</label>
              <select id="h-village" onchange="handleVillageSelectChange()" ${!selectedCenter ? 'disabled' : ''}>${villageOptions}</select>
            </div>
          </div>
          <div id="new-village-box" class="${selectedVillage==='__NEW__'?'':'hidden'}" style="margin-top:8px;">
            <input id="h-new-village-name" placeholder="اكتب اسم القرية / العزبة / التابع الجديد بدقة ليُحفظ في النظام *" value="${window.formData.husband.newVillageName || ''}">
          </div>
          <div style="margin-top:8px;"><input id="h-street" placeholder="شارع / رقم الحارة / التفاصيل كما مدون بالبطاقة *" value="${window.formData.husband.street || ''}"></div>
        </div>


        <div class="grid-3">
          <div><label>رقم التليفون الأساسي (11 رقم) *</label><input id="h-phone" maxlength="11" value="${window.formData.husband.phone || ''}"></div>
          <div><label>رقم الواتساب (11 رقم)</label><input id="h-whatsapp" maxlength="11" value="${window.formData.husband.whatsapp || ''}"></div>
          <div><label>الوظيفة الحالية *</label><select id="h-job">${jobOptions}</select></div>
        </div>

        ${window.renderPersonHealthBlockHtml('h', 'الزوج')}

        <div class="grid-2" style="margin-top:10px;">
          <div><label>صورة بطاقة الزوج (وش) *</label><input type="file" id="h-id-front" accept="image/*,.pdf"></div>
          <div><label>صورة بطاقة الزوج (ظهر) *</label><input type="file" id="h-id-back" accept="image/*,.pdf"></div>
        </div>
      `;
    }
    // --- الخطوة 3: بيانات الزوجة ---
    else if (window.currentStep === 3) {
      const wifeStatusOptions = (window.WIFE_MARITAL_STATUSES || []).map(s => `<option value="${s}" ${window.formData.wife.maritalStatus===s?'selected':''}>${s}</option>`).join('');
      const jobOptions = (window.EGYPT_JOBS || []).map(j => `<option value="${j}" ${window.formData.wife.job===j?'selected':''}>${j}</option>`).join('');

      html += `
        <h4 style="color:var(--primary-dark); margin-top:0;">👩 القسم الثاني: بيانات الزوجة</h4>
        <div class="grid-3">
          <div><label>الاسم الأول *</label><input id="w-name1" value="${window.formData.wife.name1 || ''}"></div>
          <div><label>الاسم الثاني *</label><input id="w-name2" value="${window.formData.wife.name2 || ''}"></div>
          <div><label>الاسم الثالث والعائلة *</label><input id="w-name3" value="${window.formData.wife.name3 || ''}"></div>
        </div>
        <div class="grid-3" style="margin-top:8px;">
          <div><label>الحالة الاجتماعية للزوجة *</label><select id="w-marital-status">${wifeStatusOptions}</select></div>
          <div><label>الرقم القومي (14 رقم حصراً) *</label><input id="w-nid" maxlength="14" value="${window.formData.wife.nid || ''}" oninput="window.handleNidInput('w')"></div>
          <div><label>النوع (تلقائي من الرقم القومي)</label><input id="w-gender" readonly value="${window.formData.wife.gender || ''}" style="background:#f1f5f9;"></div>
        </div>
        <div class="grid-3" style="margin-top:8px;">
          <div><label>تاريخ الميلاد (تلقائي من الرقم القومي)</label><input id="w-birth-date" readonly value="${window.formData.wife.birthDate || ''}" style="background:#f1f5f9;"></div>
          <div><label>رقم التليفون الأساسي (11 رقم)</label><input id="w-phone" maxlength="11" value="${window.formData.wife.phone || ''}"></div>
          <div><label>الوظيفة / النشاط *</label><select id="w-job">${jobOptions}</select></div>
        </div>
        <div class="grid-2" style="margin-top:8px;">
          <div>
            <label>المستوى التعليمي *</label>
            <select id="w-edu">
              <option value="غير متعلمة" ${window.formData.wife.edu==='غير متعلمة'?'selected':''}>غير متعلمة</option>
              <option value="ابتدائية" ${window.formData.wife.edu==='ابتدائية'?'selected':''}>ابتدائية</option>
              <option value="إعدادية" ${window.formData.wife.edu==='إعدادية'?'selected':''}>إعدادية</option>
              <option value="ثانوي / دبلوم" ${window.formData.wife.edu==='ثانوي / دبلوم'?'selected':''}>ثانوي أو دبلوم فني</option>
              <option value="جامعي" ${window.formData.wife.edu==='جامعي'?'selected':''}>جامعي</option>
            </select>
          </div>
          <div></div>
        </div>

        ${window.renderPersonHealthBlockHtml('w', 'الزوجة')}

        <div class="grid-2" style="margin-top:10px;">
          <div><label>صورة بطاقة الزوجة (وش) *</label><input type="file" id="w-id-front" accept="image/*,.pdf"></div>
          <div><label>صورة بطاقة الزوجة (ظهر) *</label><input type="file" id="w-id-back" accept="image/*,.pdf"></div>
        </div>
      `;
    }
    // --- الخطوة 4: الأبناء والتابعين (اختياري عدم وجود أبناء) ---
    else if (window.currentStep === 4) {
      const childStatuses = window.CHILD_SOCIAL_STATUSES || ["طفل (أقل من سن الدراسة)", "طالب / طالبة", "أعزب / عزباء (بالغ غير متزوج)", "متزوج / متزوجة"];
      html += `
        <h4 style="color:var(--primary-dark); margin-top:0;">👶 القسم الثالث: بيانات الأبناء والتابعين</h4>
        <p style="font-size:12px; color:#475569; background:#f8fafc; padding:8px 10px; border-radius:6px; border:1px solid #e2e8f0;">
          ملاحظة: إذا لم يكن للأسرة أبناء، يمكنك الانتقال مباشرة إلى الخطوة التالية دون إضافة أبناء.
        </p>
        <div id="children-list">
          ${(window.formData.children || []).map((c, idx) => {
            const stOpts = childStatuses.map(s => `<option value="${s}" ${c.socialStatus===s?'selected':''}>${s}</option>`).join('');
            return `
            <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:12px; border-radius:10px; margin-bottom:10px;">
              <strong>الابن / الابنة رقم ${idx + 1}</strong>
              <div class="grid-3" style="margin-top:6px;">
                <input placeholder="اسم الابن ثلاثي *" class="c-name" value="${c.name || ''}">
                <input placeholder="الرقم القومي (14 رقم) *" maxlength="14" class="c-nid" value="${c.nid || ''}" oninput="window.handleNidInput('c', ${idx})">
                <select class="c-social-status">${stOpts}</select>
              </div>
              <div class="grid-3" style="margin-top:6px;">
                <div><label style="font-size:11px;">النوع (تلقائي):</label><input class="c-gender" readonly value="${c.gender || ''}" style="background:#f1f5f9;"></div>
                <div><label style="font-size:11px;">تاريخ الميلاد (تلقائي):</label><input class="c-birth-date" readonly value="${c.birthDate || ''}" style="background:#f1f5f9;"></div>
                <div>
                  <label style="font-size:11px;">المرحلة التعليمية:</label>
                  <select class="c-edu">
                    <option value="حضانة" ${c.edu==='حضانة'?'selected':''}>حضانة</option>
                    <option value="ابتدائي" ${c.edu==='ابتدائي'?'selected':''}>ابتدائي</option>
                    <option value="إعدادي" ${c.edu==='إعدادي'?'selected':''}>إعدادي</option>
                    <option value="ثانوي / فني" ${c.edu==='ثانوي / فني'?'selected':''}>ثانوي أو فني</option>
                    <option value="جامعي" ${c.edu==='جامعي'?'selected':''}>تعليم جامعي</option>
                  </select>
                </div>
              </div>
              <div class="grid-2" style="margin-top:6px;">
                <div><label style="font-size:11px;">شهادة الميلاد / المستند:</label><input type="file" class="c-cert" accept="image/*,.pdf"></div>
                <div>
                  <label style="font-size:11px;">الحالة الصحية:</label>
                  <select class="c-health">
                    <option value="سليم" ${c.health!=='مريض'?'selected':''}>سليم</option>
                    <option value="مريض" ${c.health==='مريض'?'selected':''}>مريض بمرض مزمن أو إعاقة</option>
                  </select>
                </div>
              </div>
              <button type="button" onclick="removeChildRow(${idx})" class="nav-btn" style="background:#b91c1c; color:#fff; margin-top:6px; font-size:11px;">حذف هذا الابن</button>
            </div>
          `;
          }).join('')}
        </div>
        <button type="button" onclick="addChildRow()" class="action-btn" style="background:#0f172a; margin-top:10px;">+ إضافة ابن آخر</button>
      `;
    }
    // --- الخطوة 5: قسم الزواج (يظهر فقط عند اختيار تجهيز عروسة) ---
    else if (window.currentStep === 5) {
      if (window.formData.interventionType !== 'تجهيز عروسة (أجهزة كهربائية / مفروشات)') {
        window.currentStep = 6;
        return window.renderWizardStep();
      }
      html += `
        <h4 style="color:#be185d; margin-top:0;">💍 القسم الإضافي: بيانات العروسة وتجهيز الزواج</h4>
        <div style="background:#fdf2f8; border:1px solid #fbcfe8; padding:14px; border-radius:10px;">
          <div class="grid-3">
            <div><label>اسم العروسة الأول *</label><input id="m-name1" value="${window.formData.marriage.name1 || ''}"></div>
            <div><label>اسم العروسة الثاني *</label><input id="m-name2" value="${window.formData.marriage.name2 || ''}"></div>
            <div><label>اسم العروسة الثالث والعائلة *</label><input id="m-name3" value="${window.formData.marriage.name3 || ''}"></div>
          </div>
          <div class="grid-3" style="margin-top:8px;">
            <div><label>الرقم القومي للعروسة (14 رقم) *</label><input id="m-nid" maxlength="14" value="${window.formData.marriage.nid || ''}" oninput="window.handleNidInput('m')"></div>
            <div><label>النوع (تلقائي من الرقم القومي)</label><input id="m-gender" readonly value="${window.formData.marriage.gender || 'أنثى'}" style="background:#f1f5f9;"></div>
            <div><label>تاريخ الميلاد (تلقائي من الرقم القومي)</label><input id="m-birth-date" readonly value="${window.formData.marriage.birthDate || ''}" style="background:#f1f5f9;"></div>
          </div>
          <div class="grid-3" style="margin-top:8px;">
            <div><label>رقم تليفون العروسة أو وليها *</label><input id="m-phone" maxlength="11" value="${window.formData.marriage.phone || ''}"></div>
            <div><label>موعد الزفاف المقترح *</label><input type="date" id="m-date" value="${window.formData.marriage.date || ''}"></div>
            <div><label>المتوفرات لدى العروسة *</label><input id="m-available" value="${window.formData.marriage.available || ''}"></div>
          </div>
          <div class="grid-2" style="margin-top:8px;">
            <div><label>صورة قسيمة الزواج / الخطوبة *</label><input type="file" id="m-cert-doc" accept="image/*,.pdf"></div>
            <div><label>الشهادة الصحية للعروسين (وش وظهر) *</label><input type="file" id="m-health-doc" accept="image/*,.pdf"></div>
          </div>
        </div>
      `;
    }
    // --- الخطوة 6: المصروفات ---
    else if (window.currentStep === 6) {
      html += `
        <h4 style="color:var(--primary-dark); margin-top:0;">💸 القسم الرابع: المصروفات والأعباء الشهرية</h4>
        <div class="grid-2">
          <div><label>قيمة الإيجار الشهري *</label><input type="number" min="0" id="exp-rent" value="${window.formData.expenses.rent ?? 0}" oninput="calcTotals()"></div>
          <div><label>فواتير مياه *</label><input type="number" min="0" id="exp-water" value="${window.formData.expenses.water ?? 0}" oninput="calcTotals()"></div>
          <div><label>فواتير كهرباء *</label><input type="number" min="0" id="exp-electric" value="${window.formData.expenses.electric ?? 0}" oninput="calcTotals()"></div>
          <div><label>فواتير غاز أو أنبوبة *</label><input type="number" min="0" id="exp-gas" value="${window.formData.expenses.gas ?? 0}" oninput="calcTotals()"></div>
          <div><label>مصاريف تعليم الأبناء *</label><input type="number" min="0" id="exp-edu" value="${window.formData.expenses.edu ?? 0}" oninput="calcTotals()"></div>
          <div><label>مصاريف العلاج والأدوية المزمنة *</label><input type="number" min="0" id="exp-health" value="${window.formData.expenses.health ?? 0}" oninput="calcTotals()"></div>
          <div><label>المستلزمات المعيشية الأساسية (مأكل ومسكن) *</label><input type="number" min="0" id="exp-food" value="${window.formData.expenses.food ?? 0}" oninput="calcTotals()"></div>
          <div><label>أقساط ديون والتزامات أخرى *</label><input type="number" min="0" id="exp-debts" value="${window.formData.expenses.debts ?? 0}" oninput="calcTotals()"></div>
        </div>
        <div style="background:#fee2e2; border:1px solid #fecaca; padding:12px; border-radius:8px; margin-top:12px; text-align:center;">
          <span style="font-weight:700; color:#991b1b; font-size:15px;">إجمالي المصروفات الشهرية: <strong id="total-exp-display">0</strong> جنيه</span>
        </div>
      `;
    }
    // --- الخطوة 7: الدخل والفائض أو العجز ---
    else if (window.currentStep === 7) {
      html += `
        <h4 style="color:var(--primary-dark); margin-top:0;">💵 القسم الخامس: مصادر الدخل والفائض أو العجز</h4>
        <div class="grid-2">
          <div><label>دخل الزوج من العمل / المهنة *</label><input type="number" min="0" id="inc-husband" value="${window.formData.incomes.husband ?? 0}" oninput="calcTotals()"></div>
          <div><label>دخل الزوجة أو الأبناء العاملين *</label><input type="number" min="0" id="inc-others" value="${window.formData.incomes.others ?? 0}" oninput="calcTotals()"></div>
          <div><label>معاش حكومي / تكافل وكرامة *</label><input type="number" min="0" id="inc-pension" value="${window.formData.incomes.pension ?? 0}" oninput="calcTotals()"></div>
          <div><label>مساعدات ثابتة من أهل الخير *</label><input type="number" min="0" id="inc-aid" value="${window.formData.incomes.aid ?? 0}" oninput="calcTotals()"></div>
        </div>
        <div style="background:#ecfdf5; border:1px solid #a7f3d0; padding:12px; border-radius:8px; margin-top:12px; text-align:center;">
          <p style="margin:0 0 4px; font-weight:700; color:#065f46;">إجمالي الدخل الشهري: <strong id="total-inc-display">0</strong> جنيه</p>
          <hr style="border:0; border-top:1px solid #a7f3d0; margin:6px 0;">
          <span id="balance-display" style="font-weight:800; font-size:16px;">صافي الوضع المالي: -</span>
        </div>
      `;
    }
    // --- الخطوة 8: السكن، الفرش والأثاث ونواقصه، المستندات، ورأي الباحث ---
    else if (window.currentStep === 8) {
      const furnList = window.FURNITURE_CONDITIONS || ["رديء جداً / معدوم", "رديء", "متوسط", "جيد", "جيد جداً / ممتاز"];
      const furnOpts = furnList.map(f => `<option value="${f}" ${window.formData.housing.furniture===f?'selected':''}>${f}</option>`).join('');
      const defList = window.FURNITURE_DEFICIENCIES || [];
      const selectedDefs = window.formData.housing.deficiencies || [];

      html += `
        <h4 style="color:var(--primary-dark); margin-top:0;">📋 القسم السادس: وصف السكن، المستندات الرسمية، ورأي الباحث</h4>
        <div class="grid-2" style="margin-bottom:10px;">
          <div>
            <label>حالة السكن أولاً *</label>
            <select id="h-status-case" onchange="toggleLease()">
              <option value="ملك" ${window.formData.housing.case==='ملك'?'selected':''}>ملك</option>
              <option value="إيجار" ${window.formData.housing.case==='إيجار'?'selected':''}>إيجار</option>
            </select>
          </div>
          <div>
            <label>نوع السكن ثانياً *</label>
            <select id="h-type">
              <option value="ريفي / بيت ريفي" ${window.formData.housing.type==='ريفي / بيت ريفي'?'selected':''}>ريفي / بيت ريفي</option>
              <option value="شقة سكنية" ${window.formData.housing.type==='شقة سكنية'?'selected':''}>شقة سكنية</option>
              <option value="بيت عائلي" ${window.formData.housing.type==='بيت عائلي'?'selected':''}>بيت عائلي</option>
              <option value="انتفاع" ${window.formData.housing.type==='انتفاع'?'selected':''}>انتفاع</option>
              <option value="هبة" ${window.formData.housing.type==='هبة'?'selected':''}>هبة</option>
            </select>
          </div>
        </div>
        <div class="grid-3" style="margin-bottom:10px;">
          <div>
            <label>وصف السقف *</label>
            <select id="h-roof">
              <option value="خشب" ${window.formData.housing.roof==='خشب'?'selected':''}>خشب</option>
              <option value="مسلح" ${window.formData.housing.roof==='مسلح'?'selected':''}>مسلح</option>
              <option value="جريد" ${window.formData.housing.roof==='جريد'?'selected':''}>جريد</option>
              <option value="بوص" ${window.formData.housing.roof==='بوص'?'selected':''}>بوص</option>
              <option value="عفش" ${window.formData.housing.roof==='عفش'?'selected':''}>عفش</option>
            </select>
          </div>
          <div>
            <label>وصف الحوائط *</label>
            <select id="h-walls">
              <option value="طوب لبن" ${window.formData.housing.walls==='طوب لبن'?'selected':''}>طوب لبن</option>
              <option value="طوب أحمر غير محارة" ${window.formData.housing.walls==='طوب أحمر غير محارة'?'selected':''}>طوب أحمر غير محارة</option>
              <option value="محارة وتشطيب عادي" ${window.formData.housing.walls==='محارة وتشطيب عادي'?'selected':''}>محارة وتشطيب عادي</option>
              <option value="لوكس / سوبر لوكس" ${window.formData.housing.walls==='لوكس / سوبر لوكس'?'selected':''}>لوكس / سوبر لوكس</option>
            </select>
          </div>
          <div>
            <label>وصف الأرضية *</label>
            <select id="h-floor">
              <option value="ترابية" ${window.formData.housing.floor==='ترابية'?'selected':''}>ترابية</option>
              <option value="بلاط عادي" ${window.formData.housing.floor==='بلاط عادي'?'selected':''}>بلاط عادي</option>
              <option value="سيراميك" ${window.formData.housing.floor==='سيراميك'?'selected':''}>سيراميك</option>
              <option value="رخام / جرانيت" ${window.formData.housing.floor==='رخام / جرانيت'?'selected':''}>رخام / جرانيت</option>
            </select>
          </div>
        </div>

        <div style="margin-bottom:10px;">
          <label>وصف الفرش والأثاث *</label>
          <select id="h-furniture" onchange="toggleFurnitureDeficiencies()">${furnOpts}</select>
        </div>

        <div id="furniture-deficiencies-box" class="hidden" style="background:#fff7ed; border:1px solid #fed7aa; padding:12px; border-radius:8px; margin-bottom:12px;">
          <label style="font-weight:700; color:#9a3412; display:block; margin-bottom:6px;">تحديد النواقص في الفرش والأثاث *</label>
          <div class="grid-2">
            ${defList.map(item => `
              <label style="display:flex; align-items:center; gap:6px; font-size:12px; cursor:pointer; margin:0;">
                <input type="checkbox" class="h-deficiency-item" value="${item}" ${selectedDefs.includes(item)?'checked':''} style="width:auto; margin:0;">
                <span>${item}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="grid-2" style="margin-bottom:10px;">
          <div><label>البحث الاجتماعي (مختوم) *</label><input type="file" id="doc-social-research" accept="image/*,.pdf"></div>
          <div><label>برنت تأميني للزوج</label><input type="file" id="doc-insurance-h" accept="image/*,.pdf"></div>
          <div><label>برنت تأميني للزوجة</label><input type="file" id="doc-insurance-w" accept="image/*,.pdf"></div>
          <div id="lease-doc-box" class="${window.formData.housing.case==='إيجار'?'':'hidden'}"><label>عقد الإيجار الرسمي *</label><input type="file" id="doc-lease" accept="image/*,.pdf"></div>
          <div><label>إثبات قيد دراسي للأبناء</label><input type="file" id="doc-school-enroll" accept="image/*,.pdf"></div>
        </div>

        <div style="margin-bottom:10px;">
          <label style="font-weight:700;">رأي وتوصية الباحث الميداني *</label>
          <select id="researcher-opinion">
            <option value="حالة شديدة الاستحقاق وعاجلة" ${window.formData.housing.opinion==='حالة شديدة الاستحقاق وعاجلة'?'selected':''}>حالة شديدة الاستحقاق وعاجلة</option>
            <option value="حالة مستحقة للدعم العادي" ${window.formData.housing.opinion==='حالة مستحقة للدعم العادي'?'selected':''}>حالة مستحقة للدعم العادي</option>
            <option value="حالة متوسطة الاستحقاق" ${window.formData.housing.opinion==='حالة متوسطة الاستحقاق'?'selected':''}>حالة متوسطة الاستحقاق</option>
            <option value="غير مستحق بعد المراجعة" ${window.formData.housing.opinion==='غير مستحق بعد المراجعة'?'selected':''}>غير مستحق بعد المراجعة</option>
          </select>
        </div>

        <div style="background:#fffbeb; border:1px solid #fde68a; padding:12px; border-radius:8px; margin-bottom:12px;">
          <label style="display:flex; align-items:center; gap:8px; font-weight:700; cursor:pointer; color:#92400e; font-size:13px;">
            <input type="checkbox" id="declaration-check" style="width:auto; margin:0;"> أقر أنا مقدم الطلب بأن كافة البيانات والمستندات المسجلة صحيحة تماماً وتحت مسئوليتي القانونية والمجتمعية، وأوافق على إجراء البحث الميداني.
          </label>
        </div>
      `;
    }

    const showPrev = window.currentStep > 1 && !(window.currentStep === 6 && window.formData.interventionType !== 'تجهيز عروسة (أجهزة كهربائية / مفروشات)');
    const prevTargetStep = (window.currentStep === 6 && window.formData.interventionType !== 'تجهيز عروسة (أجهزة كهربائية / مفروشات)') ? 4 : (window.currentStep - 1);

    html += `
      <div style="display:flex; justify-content:space-between; margin-top:20px;">
        ${window.currentStep > 1 ? `<button type="button" onclick="prevWizardStep(${prevTargetStep})" class="nav-btn" style="background:#334155; color:#fff;">السابق</button>` : '<div></div>'}
        ${window.currentStep < window.totalWizardSteps ? '<button type="button" onclick="nextWizardStep()" class="action-btn">التالي ➔</button>' : '<button type="button" onclick="submitFullWizardApplication()" class="action-btn" style="background:#15803d;">✅ تأكيد والرفع النهائي للحالة</button>'}
      </div>
    `;

    container.innerHTML = html;

    if (window.currentStep === 2) {
      window.handleNidInput('h');
      window.renderHealthSection('h');
    } else if (window.currentStep === 3) {
      window.handleNidInput('w');
      window.renderHealthSection('w');
    } else if (window.currentStep === 5) {
      window.handleNidInput('m');
    } else if (window.currentStep === 6 || window.currentStep === 7) {
      window.calcTotals();
    } else if (window.currentStep === 8) {
      window.toggleLease();
      window.toggleFurnitureDeficiencies();
    }
  };

  // بناء بلوك الحالة الصحية بحيث تظهر الجراحة قبل التقرير والبحث الاجتماعي
  window.renderPersonHealthBlockHtml = function(prefix, labelName) {
    const pData = prefix === 'h' ? window.formData.husband : window.formData.wife;
    return `
      <div style="background:#f1f5f9; padding:12px; border-radius:8px; margin-top:10px; border:1px solid #e2e8f0;">
        <div class="grid-2">
          <div>
            <label>الحالة الصحية (${labelName}) *</label>
            <select id="${prefix}-health" onchange="renderHealthSection('${prefix}')">
              <option value="سليم" ${pData.health!=='مريض'?'selected':''}>سليم وبصحة جيدة</option>
              <option value="مريض" ${pData.health==='مريض'?'selected':''}>مريض</option>
            </select>
          </div>
          <div id="${prefix}-illness-type-container" class="hidden">
            <label>نوع المرض *</label>
            <select id="${prefix}-illness-type" onchange="renderHealthSection('${prefix}')">
              <option value="مؤقت" ${pData.illnessType!=='مزمن'?'selected':''}>مؤقت</option>
              <option value="مزمن" ${pData.illnessType==='مزمن'?'selected':''}>مزمن</option>
            </select>
          </div>
        </div>

        <div id="${prefix}-health-box" class="hidden" style="margin-top:10px; border-top:1px dashed #cbd5e1; padding-top:10px;">
          <div class="grid-2">
            <div>
              <label>تشخيص الحالة المرضية *</label>
              <select id="${prefix}-illness-name"></select>
            </div>
            <div>
              <label>الإجراء الطبي المطلوب (بالتفصيل الكامل) *</label>
              <select id="${prefix}-medical-need" onchange="renderDynamicMedicalFields('${prefix}')"></select>
            </div>
          </div>

          <div id="${prefix}-dynamic-medical-fields" style="margin-top:10px;"></div>

          <div class="grid-2" style="margin-top:10px;">
            <div>
              <label>رفع التقرير الطبي (مختوم) *</label>
              <input type="file" id="${prefix}-medical-doc" accept="image/*,.pdf">
            </div>
            <div>
              <label>رفع البحث الاجتماعي (مختوم) *</label>
              <input type="file" id="${prefix}-social-doc" accept="image/*,.pdf">
            </div>
          </div>
        </div>
      </div>
    `;
  };

  window.renderHealthSection = function(type = 'h') {
    const pData = type === 'h' ? window.formData.husband : window.formData.wife;
    const healthStatus = document.getElementById(type + '-health')?.value || 'سليم';
    const illnessContainer = document.getElementById(type + '-illness-type-container');
    const healthBox = document.getElementById(type + '-health-box');
    const illnessSelect = document.getElementById(type + '-illness-name');
    const medicalNeedSelect = document.getElementById(type + '-medical-need');

    if (!healthBox || !illnessContainer || !illnessSelect || !medicalNeedSelect) return;

    pData.health = healthStatus;

    if (healthStatus === 'مريض') {
      illnessContainer.classList.remove('hidden');
      healthBox.classList.remove('hidden');
    } else {
      illnessContainer.classList.add('hidden');
      healthBox.classList.add('hidden');
      return;
    }

    const illnessType = document.getElementById(type + '-illness-type')?.value || 'مؤقت';
    pData.illnessType = illnessType;

    const illnesses = illnessType === 'مؤقت'
      ? (window.TEMPORARY_ILLNESSES || [])
      : (window.CHRONIC_ILLNESSES || []);

    illnessSelect.innerHTML = illnesses
      .map(ill => `<option value="${ill}" ${pData.illnessName===ill?'selected':''}>${ill}</option>`)
      .join('');

    const procedures = window.MEDICAL_PROCEDURES || [
      "إجراء عملية جراحية",
      "دواء وعلاج شهري مزمن",
      "جلسات غسيل كلوي أو علاج كيماوي",
      "أشعة وتحاليل طبية وفحوصات",
      "تركيب طرف صناعي",
      "أجهزة تعويضية",
      "جلسات علاج طبيعي أو تخاطب"
    ];

    const defaultNeed = illnessType === 'مؤقت'
      ? (procedures.includes(pData.medicalNeed) ? pData.medicalNeed : "إجراء عملية جراحية")
      : (["دواء وعلاج شهري مزمن", "جلسات غسيل كلوي أو علاج كيماوي", "أشعة وتحاليل طبية وفحوصات"].includes(pData.medicalNeed) ? pData.medicalNeed : "دواء وعلاج شهري مزمن");

    medicalNeedSelect.innerHTML = procedures
      .map(proc => `<option value="${proc}" ${defaultNeed===proc?'selected':''}>${proc}</option>`)
      .join('');

    window.renderDynamicMedicalFields(type);
  };

  window.renderDynamicMedicalFields = function(type = 'h') {
    const pData = type === 'h' ? window.formData.husband : window.formData.wife;
    const medicalNeed = document.getElementById(type + '-medical-need')?.value || '';
    const container = document.getElementById(type + '-dynamic-medical-fields');
    if (!container) return;

    pData.medicalNeed = medicalNeed;
    let html = '';

    if (medicalNeed === 'إجراء عملية جراحية') {
      const surgeries = window.SURGERY_TYPES || [];
      html = `
        <label style="font-size:12px; font-weight:700; color:#b91c1c;">اختر نوع العملية الجراحية المطلوبة *</label>
        <select id="${type}-sub-detail" style="margin-top:4px;">
          ${surgeries.map(s => `<option value="${s}" ${pData.subDetail===s?'selected':''}>${s}</option>`).join('')}
        </select>
      `;
    } else if ([
      'دواء وعلاج شهري مزمن',
      'جلسات غسيل كلوي أو علاج كيماوي',
      'أشعة وتحاليل طبية وفحوصات',
      'جلسات علاج طبيعي أو تخاطب'
    ].includes(medicalNeed)) {
      html = `
        <label style="font-size:12px; font-weight:700; color:#065f46;">التكلفة الشهرية التقديرية (جنيه) *</label>
        <input type="number" min="1" id="${type}-monthly-cost" value="${pData.monthlyCost || ''}" placeholder="أدخل التكلفة الشهرية بالجنيه" style="margin-top:4px;">
      `;
    } else if (medicalNeed === 'تركيب طرف صناعي') {
      const limbs = window.PROSTHETIC_LIMB_TYPES || [];
      html = `
        <label style="font-size:12px; font-weight:700; color:#1e3a8a;">اختر نوع الطرف الصناعي المطلوب *</label>
        <select id="${type}-sub-detail" style="margin-top:4px;">
          ${limbs.map(l => `<option value="${l}" ${pData.subDetail===l?'selected':''}>${l}</option>`).join('')}
        </select>
      `;
    } else if (medicalNeed === 'أجهزة تعويضية') {
      const devices = window.ASSISTIVE_DEVICE_TYPES || [];
      html = `
        <label style="font-size:12px; font-weight:700; color:#1e3a8a;">اختر نوع الجهاز التعويضي المطلوب *</label>
        <select id="${type}-sub-detail" style="margin-top:4px;">
          ${devices.map(d => `<option value="${d}" ${pData.subDetail===d?'selected':''}>${d}</option>`).join('')}
        </select>
      `;
    }

    container.innerHTML = html;
  };

   window.loadCustomLocationsFromDB = async function() {
    if (!window.supabaseClient) return;
    const { data } = await window.supabaseClient.from('custom_locations').select('*');
    window.CUSTOM_LOCATIONS_CACHE = {};
    (data || []).forEach(row => {
      if (!window.CUSTOM_LOCATIONS_CACHE[row.governorate]) window.CUSTOM_LOCATIONS_CACHE[row.governorate] = {};
      if (!window.CUSTOM_LOCATIONS_CACHE[row.governorate][row.center_city]) window.CUSTOM_LOCATIONS_CACHE[row.governorate][row.center_city] = [];
      window.CUSTOM_LOCATIONS_CACHE[row.governorate][row.center_city].push(row.village_name);
    });
  };
  window.loadCustomLocationsFromDB();

  window.updateGeoCenters = function() {
    const gov = document.getElementById('h-gov')?.value || '';
    const centerSelect = document.getElementById('h-center');
    const villageSelect = document.getElementById('h-village');
    const locs = window.EGYPT_LOCATIONS || {};

    if (centerSelect) {
      if (!gov || !locs[gov]) {
        centerSelect.innerHTML = '<option value="">-- اختر المحافظة أولاً --</option>';
        centerSelect.disabled = true;
      } else {
        const centers = Object.keys(locs[gov]);
        centerSelect.innerHTML = '<option value="">-- اختر المركز / القسم --</option>' +
          centers.map(c => `<option value="${c}">${c}</option>`).join('');
        centerSelect.disabled = false;
      }
    }
    if (villageSelect) {
      villageSelect.innerHTML = '<option value="">-- اختر المركز أولاً --</option>';
      villageSelect.disabled = true;
    }
    document.getElementById('new-village-box')?.classList.add('hidden');
  };

  window.updateGeoVillages = function() {
    const gov = document.getElementById('h-gov')?.value || '';
    const center = document.getElementById('h-center')?.value || '';
    const villageSelect = document.getElementById('h-village');
    const locs = window.EGYPT_LOCATIONS || {};

    if (villageSelect) {
      if (!gov || !center || !locs[gov]?.[center]) {
        villageSelect.innerHTML = '<option value="">-- اختر المركز أولاً --</option>';
        villageSelect.disabled = true;
      } else {
        const baseVills = locs[gov][center] || [];
        const customVills = window.CUSTOM_LOCATIONS_CACHE?.[gov]?.[center] || [];
        const allVills = Array.from(new Set([...baseVills, ...customVills]));
        villageSelect.innerHTML = '<option value="">-- اختر القرية أو التابع --</option>' +
          allVills.map(v => `<option value="${v}">${v}</option>`).join('') +
          '<option value="__NEW__">+ إضافة قرية / عزبة / تابع جديد غير مدرج</option>';
        villageSelect.disabled = false;
      }
    }
    document.getElementById('new-village-box')?.classList.add('hidden');
  };

  window.handleVillageSelectChange = function() {
    const val = document.getElementById('h-village')?.value || '';
    const box = document.getElementById('new-village-box');
    if (box) box.classList.toggle('hidden', val !== '__NEW__');
  };

  function showStepError(msg) {
    const alertBox = document.getElementById('step-validation-alert');
    if (alertBox) {
      alertBox.innerText = '⚠️ ' + msg;
      alertBox.classList.remove('hidden');
      alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      alert('⚠️ ' + msg);
    }
  }

  function clearStepError() {
    const alertBox = document.getElementById('step-validation-alert');
    if (alertBox) {
      alertBox.innerText = '';
      alertBox.classList.add('hidden');
    }
  }

  function isValidEgyptianPhone(phone) {
    return /^01[0125]\d{8}$/.test(String(phone || '').trim());
  }

  function validateStepCompletion(step) {
    if (step === 1) {
      const val = document.getElementById('intervention-type')?.value || '';
      if (!val.trim()) return 'يرجى اختيار نوع المساعدة الأساسية المطلوبة.';
      return null;
    }

    if (step === 2) {
      const name1 = (document.getElementById('h-name1')?.value || '').trim();
      const name2 = (document.getElementById('h-name2')?.value || '').trim();
      const name3 = (document.getElementById('h-name3')?.value || '').trim();
      const nid = (document.getElementById('h-nid')?.value || '').trim();
      const gov = document.getElementById('h-gov')?.value || '';
      const center = document.getElementById('h-center')?.value || '';
      const village = document.getElementById('h-village')?.value || '';
      const street = (document.getElementById('h-street')?.value || '').trim();
      const phone = (document.getElementById('h-phone')?.value || '').trim();
      const whatsapp = (document.getElementById('h-whatsapp')?.value || '').trim();
      const health = document.getElementById('h-health')?.value || 'سليم';
      const idFront = document.getElementById('h-id-front')?.files?.length || (window.formData.documents?.hIdFront ? 1 : 0);
      const idBack = document.getElementById('h-id-back')?.files?.length || (window.formData.documents?.hIdBack ? 1 : 0);

      if (!name1 || !name2 || !name3) return 'يرجى استكمال الاسم الثلاثي والعائلة للزوج.';
      if (!window.parseEgyptianNationalId(nid).valid) return 'الرقم القومي للزوج غير صحيح (يجب أن يتكون من 14 رقماً صحيحاً).';

      if (typeof window.validateLocationHierarchy === 'function') {
        const geoCheck = window.validateLocationHierarchy(gov, center, village);
        if (!geoCheck.valid) return geoCheck.reason;
      }
      if (!street) return 'يرجى إدخال تفاصيل العنوان (الشارع / الحارة / رقم المنزل).';
      if (!isValidEgyptianPhone(phone)) return 'رقم التليفون الأساسي للزوج يجب أن يتكون من 11 رقماً يبدأ بـ 01.';
      if (whatsapp && !isValidEgyptianPhone(whatsapp)) return 'رقم الواتساب للزوج يجب أن يتكون من 11 رقماً صحيحاً.';

      if (health === 'مريض') {
        const need = document.getElementById('h-medical-need')?.value || '';
        const medDoc = document.getElementById('h-medical-doc')?.files?.length || (window.formData.documents?.hMedicalDoc ? 1 : 0);
        const socDoc = document.getElementById('h-social-doc')?.files?.length || (window.formData.documents?.hSocialDoc ? 1 : 0);

        if (!need) return 'يرجى تحديد الإجراء الطبي المطلوب للزوج.';
        if ([
          'دواء وعلاج شهري مزمن',
          'جلسات غسيل كلوي أو علاج كيماوي',
          'أشعة وتحاليل طبية وفحوصات',
          'جلسات علاج طبيعي أو تخاطب'
        ].includes(need)) {
          const cost = parseFloat(document.getElementById('h-monthly-cost')?.value || '0');
          if (!cost || cost <= 0) return 'يرجى إدخال التكلفة الشهرية التقديرية للإجراء الطبي للزوج.';
        }
        if (!medDoc) return 'يرجى رفع التقرير الطبي المختوم للزوج.';
        if (!socDoc) return 'يرجى رفع البحث الاجتماعي المختوم لحالة الزوج.';
      }

      if (!idFront || !idBack) return 'يرجى رفع صورة بطاقة الزوج (وجه وظهر).';
      return null;
    }

    if (step === 3) {
      const name1 = (document.getElementById('w-name1')?.value || '').trim();
      const name2 = (document.getElementById('w-name2')?.value || '').trim();
      const name3 = (document.getElementById('w-name3')?.value || '').trim();
      const nid = (document.getElementById('w-nid')?.value || '').trim();
      const phone = (document.getElementById('w-phone')?.value || '').trim();
      const health = document.getElementById('w-health')?.value || 'سليم';
      const idFront = document.getElementById('w-id-front')?.files?.length || (window.formData.documents?.wIdFront ? 1 : 0);
      const idBack = document.getElementById('w-id-back')?.files?.length || (window.formData.documents?.wIdBack ? 1 : 0);

      if (!name1 || !name2 || !name3) return 'يرجى استكمال الاسم الثلاثي والعائلة للزوجة.';
      if (!window.parseEgyptianNationalId(nid).valid) return 'الرقم القومي للزوجة غير صحيح (يجب أن يتكون من 14 رقماً صحيحاً).';
      if (phone && !isValidEgyptianPhone(phone)) return 'رقم هاتف الزوجة يجب أن يتكون من 11 رقماً صحيحاً.';

      if (health === 'مريض') {
        const need = document.getElementById('w-medical-need')?.value || '';
        const medDoc = document.getElementById('w-medical-doc')?.files?.length || (window.formData.documents?.wMedicalDoc ? 1 : 0);
        const socDoc = document.getElementById('w-social-doc')?.files?.length || (window.formData.documents?.wSocialDoc ? 1 : 0);

        if (!need) return 'يرجى تحديد الإجراء الطبي المطلوب للزوجة.';
        if ([
          'دواء وعلاج شهري مزمن',
          'جلسات غسيل كلوي أو علاج كيماوي',
          'أشعة وتحاليل طبية وفحوصات',
          'جلسات علاج طبيعي أو تخاطب'
        ].includes(need)) {
          const cost = parseFloat(document.getElementById('w-monthly-cost')?.value || '0');
          if (!cost || cost <= 0) return 'يرجى إدخال التكلفة الشهرية التقديرية للإجراء الطبي للزوجة.';
        }
        if (!medDoc) return 'يرجى رفع التقرير الطبي المختوم للزوجة.';
        if (!socDoc) return 'يرجى رفع البحث الاجتماعي المختوم للزوجة.';
      }

      if (!idFront || !idBack) return 'يرجى رفع صورة بطاقة الزوجة (وجه وظهر).';
      return null;
    }

    // الخطوة 4 (الأبناء): يسمح بالاستمرار حتى لو لم يوجد أبناء؛ وإذا تم إضافة ابن يجب استكمال بياناته
    if (step === 4) {
      const rows = document.querySelectorAll('#children-list > div');
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const cName = (r.querySelector('.c-name')?.value || '').trim();
        const cNid = (r.querySelector('.c-nid')?.value || '').trim();
        if (!cName) return `يرجى إدخال اسم الابن / الابنة رقم ${i + 1}.`;
        if (!window.parseEgyptianNationalId(cNid).valid) return `الرقم القومي للابن / الابنة رقم ${i + 1} غير صحيح (14 رقماً).`;
      }
      return null;
    }

    if (step === 5 && window.formData.interventionType === 'تجهيز عروسة (أجهزة كهربائية / مفروشات)') {
      const m1 = (document.getElementById('m-name1')?.value || '').trim();
      const m2 = (document.getElementById('m-name2')?.value || '').trim();
      const m3 = (document.getElementById('m-name3')?.value || '').trim();
      const mNid = (document.getElementById('m-nid')?.value || '').trim();
      const mPhone = (document.getElementById('m-phone')?.value || '').trim();
      const mDate = document.getElementById('m-date')?.value || '';
      const mAvail = (document.getElementById('m-available')?.value || '').trim();
      const mCert = document.getElementById('m-cert-doc')?.files?.length || (window.formData.documents?.mCertDoc ? 1 : 0);
      const mHealth = document.getElementById('m-health-doc')?.files?.length || (window.formData.documents?.mHealthDoc ? 1 : 0);

      if (!m1 || !m2 || !m3) return 'يرجى استكمال الاسم الثلاثي والعائلة للعروسة.';
      if (!window.parseEgyptianNationalId(mNid).valid) return 'الرقم القومي للعروسة غير صحيح (14 رقماً).';
      if (!isValidEgyptianPhone(mPhone)) return 'رقم هاتف العروسة أو وليها يجب أن يتكون من 11 رقماً.';
      if (!mDate) return 'يرجى تحديد موعد الزفاف المقترح.';
      if (!mAvail) return 'يرجى إدخال المتوفرات لدى العروسة.';
      if (!mCert || !mHealth) return 'يرجى رفع قسيمة الزواج/الخطوبة والشهادة الصحية للعروسين.';
      return null;
    }

    if (step === 6) {
      const ids = ['exp-rent', 'exp-water', 'exp-electric', 'exp-gas', 'exp-edu', 'exp-health', 'exp-food', 'exp-debts'];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el || el.value === '' || isNaN(parseFloat(el.value)) || parseFloat(el.value) < 0) {
          return 'يرجى إدخال قيمة رقمية صحيحة (0 أو أكثر) لجميع بنود المصروفات الشهرية.';
        }
      }
      return null;
    }

    if (step === 7) {
      const ids = ['inc-husband', 'inc-others', 'inc-pension', 'inc-aid'];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el || el.value === '' || isNaN(parseFloat(el.value)) || parseFloat(el.value) < 0) {
          return 'يرجى إدخال قيمة رقمية صحيحة (0 أو أكثر) لجميع مصادر الدخل.';
        }
      }
      return null;
    }

    if (step === 8) {
      const furn = document.getElementById('h-furniture')?.value || '';
      const hCase = document.getElementById('h-status-case')?.value || 'ملك';
      const socDoc = document.getElementById('doc-social-research')?.files?.length || (window.formData.documents?.socialResearch ? 1 : 0);
      const leaseDoc = document.getElementById('doc-lease')?.files?.length || (window.formData.documents?.lease ? 1 : 0);

      if (['رديء', 'رديء جداً / معدوم', 'متوسط'].includes(furn)) {
        const checkedDefs = Array.from(document.querySelectorAll('.h-deficiency-item:checked'));
        if (checkedDefs.length === 0) {
          return 'يرجى اختيار بند واحد على الأقل من نواقص الفرش والأثاث.';
        }
      }

      if (!socDoc) return 'يرجى رفع البحث الاجتماعي المختوم ضمن المستندات الرسمية.';
      if (hCase === 'إيجار' && !leaseDoc) return 'يرجى رفع عقد الإيجار الرسمي لأن حالة السكن إيجار.';
      return null;
    }

    return null;
  }

  window.nextWizardStep = function() {
    clearStepError();
    const err = validateStepCompletion(window.currentStep);
    if (err) {
      return showStepError(err);
    }
    saveCurrentStepData();
    if (window.currentStep === 4 && window.formData.interventionType !== 'تجهيز عروسة (أجهزة كهربائية / مفروشات)') {
      window.currentStep = 6;
    } else {
      window.currentStep++;
    }
    window.renderWizardStep();
  };

  window.prevWizardStep = function(targetStep = null) {
    clearStepError();
    saveCurrentStepData();
    if (targetStep) {
      window.currentStep = targetStep;
    } else {
      window.currentStep = Math.max(1, window.currentStep - 1);
    }
    window.renderWizardStep();
  };

  window.toggleLease = function() {
    const val = document.getElementById('h-status-case')?.value;
    const box = document.getElementById('lease-doc-box');
    if (box) {
      if (val === 'إيجار') box.classList.remove('hidden');
      else box.classList.add('hidden');
    }
    if (window.formData.housing) {
      window.formData.housing.case = val || 'ملك';
    }
  };

  window.toggleFurnitureDeficiencies = function() {
    const furn = document.getElementById('h-furniture')?.value || '';
    const box = document.getElementById('furniture-deficiencies-box');
    if (!box) return;
    if (['رديء', 'رديء جداً / معدوم', 'متوسط'].includes(furn)) {
      box.classList.remove('hidden');
    } else {
      box.classList.add('hidden');
    }
  };

  window.addChildRow = function() {
    saveCurrentStepData();
    if (!window.formData.children) window.formData.children = [];
    window.formData.children.push({
      name: '',
      nid: '',
      gender: '',
      birthDate: '',
      socialStatus: 'طالب / طالبة',
      edu: 'ابتدائي',
      health: 'سليم'
    });
    window.renderWizardStep();
  };

  window.removeChildRow = function(idx) {
    saveCurrentStepData();
    window.formData.children.splice(idx, 1);
    window.renderWizardStep();
  };

  window.calcTotals = function() {
    const rent = parseFloat(document.getElementById('exp-rent')?.value) || 0;
    const water = parseFloat(document.getElementById('exp-water')?.value) || 0;
    const electric = parseFloat(document.getElementById('exp-electric')?.value) || 0;
    const gas = parseFloat(document.getElementById('exp-gas')?.value) || 0;
    const edu = parseFloat(document.getElementById('exp-edu')?.value) || 0;
    const health = parseFloat(document.getElementById('exp-health')?.value) || 0;
    const food = parseFloat(document.getElementById('exp-food')?.value) || 0;
    const debts = parseFloat(document.getElementById('exp-debts')?.value) || 0;

    const totalExp = rent + water + electric + gas + edu + health + food + debts;
    const expDisplay = document.getElementById('total-exp-display');
    if (expDisplay) expDisplay.innerText = totalExp;

    const incH = parseFloat(document.getElementById('inc-husband')?.value) || 0;
    const incO = parseFloat(document.getElementById('inc-others')?.value) || 0;
    const incP = parseFloat(document.getElementById('inc-pension')?.value) || 0;
    const incA = parseFloat(document.getElementById('inc-aid')?.value) || 0;

    const totalInc = incH + incO + incP + incA;
    const incDisplay = document.getElementById('total-inc-display');
    if (incDisplay) incDisplay.innerText = totalInc;

    const balance = totalInc - totalExp;
    const balDisplay = document.getElementById('balance-display');
    if (balDisplay) {
      if (balance < 0) {
        balDisplay.innerHTML = `⚠️ يوجد عجز مالي شهري بقيمة: <span style="color:#b91c1c;">${Math.abs(balance)} جنيه</span>`;
      } else if (balance > 0) {
        balDisplay.innerHTML = `🟢 يوجد فائض مالي شهري بقيمة: <span style="color:#065f46;">${balance} جنيه</span>`;
      } else {
        balDisplay.innerHTML = `⚖️ يوجد فائض مالي شهري بقيمة: <span style="color:#334155;">0 جنيه</span> | يوجد عجز مالي شهري بقيمة: <span style="color:#334155;">0 جنيه</span>`;
      }
    }
  };

  async function uploadSingleDoc(inputId, folderName, trackingCode) {
    const fileInput = document.getElementById(inputId);
    const file = fileInput?.files?.[0];
    if (!file) return window.formData.documents?.[inputId] || null;

    if (!window.supabaseClient || !window.supabaseClient.storage) {
      return { name: file.name, size: file.size };
    }

    const safeName = file.name.replace(/[^\w.\-]/g, '_');
    const filePath = `${trackingCode}/${folderName}/${Date.now()}_${safeName}`;
    const { error } = await window.supabaseClient.storage
      .from('foundation-docs')
      .upload(filePath, file, { upsert: true });

    if (error) {
      return { name: file.name, uploadError: error.message };
    }
    return { name: file.name, path: filePath };
  }

  function saveCurrentStepData() {
    if (window.currentStep === 1) {
      window.formData.interventionType = document.getElementById('intervention-type')?.value || 'كفالة أيتام شهرية';
    } else if (window.currentStep === 2) {
      const nid = document.getElementById('h-nid')?.value || '';
      const parsed = window.parseEgyptianNationalId(nid);
      window.formData.husband = {
        name1: document.getElementById('h-name1')?.value || '',
        name2: document.getElementById('h-name2')?.value || '',
        name3: document.getElementById('h-name3')?.value || '',
        status: document.getElementById('h-status')?.value || '',
        nid,
        gender: parsed.valid ? parsed.gender : (document.getElementById('h-gender')?.value || ''),
        birthDate: parsed.valid ? parsed.birthDate : (document.getElementById('h-birth-date')?.value || ''),
        eduLevel: document.getElementById('h-edu-level')?.value || '',
        gov: document.getElementById('h-gov')?.value || '',
        center: document.getElementById('h-center')?.value || '',
        village: document.getElementById('h-village')?.value || '',
        street: document.getElementById('h-street')?.value || '',
        phone: document.getElementById('h-phone')?.value || '',
        whatsapp: document.getElementById('h-whatsapp')?.value || '',
        job: document.getElementById('h-job')?.value || '',
        health: document.getElementById('h-health')?.value || 'سليم',
        illnessType: document.getElementById('h-illness-type')?.value || '',
        illnessName: document.getElementById('h-illness-name')?.value || '',
        medicalNeed: document.getElementById('h-medical-need')?.value || '',
        subDetail: document.getElementById('h-sub-detail')?.value || '',
        monthlyCost: document.getElementById('h-monthly-cost')?.value || ''
      };
    } else if (window.currentStep === 3) {
      const nid = document.getElementById('w-nid')?.value || '';
      const parsed = window.parseEgyptianNationalId(nid);
      window.formData.wife = {
        name1: document.getElementById('w-name1')?.value || '',
        name2: document.getElementById('w-name2')?.value || '',
        name3: document.getElementById('w-name3')?.value || '',
        maritalStatus: document.getElementById('w-marital-status')?.value || '',
        nid,
        gender: parsed.valid ? parsed.gender : (document.getElementById('w-gender')?.value || ''),
        birthDate: parsed.valid ? parsed.birthDate : (document.getElementById('w-birth-date')?.value || ''),
        phone: document.getElementById('w-phone')?.value || '',
        job: document.getElementById('w-job')?.value || '',
        edu: document.getElementById('w-edu')?.value || '',
        health: document.getElementById('w-health')?.value || 'سليم',
        illnessType: document.getElementById('w-illness-type')?.value || '',
        illnessName: document.getElementById('w-illness-name')?.value || '',
        medicalNeed: document.getElementById('w-medical-need')?.value || '',
        subDetail: document.getElementById('w-sub-detail')?.value || '',
        monthlyCost: document.getElementById('w-monthly-cost')?.value || ''
      };
    } else if (window.currentStep === 4) {
      const rows = document.querySelectorAll('#children-list > div');
      const updatedChildren = [];
      rows.forEach(r => {
        const nid = r.querySelector('.c-nid')?.value || '';
        const parsed = window.parseEgyptianNationalId(nid);
        updatedChildren.push({
          name: r.querySelector('.c-name')?.value || '',
          nid,
          gender: parsed.valid ? parsed.gender : (r.querySelector('.c-gender')?.value || ''),
          birthDate: parsed.valid ? parsed.birthDate : (r.querySelector('.c-birth-date')?.value || ''),
          socialStatus: r.querySelector('.c-social-status')?.value || '',
          edu: r.querySelector('.c-edu')?.value || '',
          health: r.querySelector('.c-health')?.value || 'سليم'
        });
      });
      window.formData.children = updatedChildren;
    } else if (window.currentStep === 5 && window.formData.interventionType === 'تجهيز عروسة (أجهزة كهربائية / مفروشات)') {
      const nid = document.getElementById('m-nid')?.value || '';
      const parsed = window.parseEgyptianNationalId(nid);
      window.formData.marriage = {
        name1: document.getElementById('m-name1')?.value || '',
        name2: document.getElementById('m-name2')?.value || '',
        name3: document.getElementById('m-name3')?.value || '',
        nid,
        gender: parsed.valid ? parsed.gender : 'أنثى',
        birthDate: parsed.valid ? parsed.birthDate : (document.getElementById('m-birth-date')?.value || ''),
        phone: document.getElementById('m-phone')?.value || '',
        date: document.getElementById('m-date')?.value || '',
        available: document.getElementById('m-available')?.value || ''
      };
    } else if (window.currentStep === 6) {
      window.formData.expenses = {
        rent: parseFloat(document.getElementById('exp-rent')?.value) || 0,
        water: parseFloat(document.getElementById('exp-water')?.value) || 0,
        electric: parseFloat(document.getElementById('exp-electric')?.value) || 0,
        gas: parseFloat(document.getElementById('exp-gas')?.value) || 0,
        edu: parseFloat(document.getElementById('exp-edu')?.value) || 0,
        health: parseFloat(document.getElementById('exp-health')?.value) || 0,
        food: parseFloat(document.getElementById('exp-food')?.value) || 0,
        debts: parseFloat(document.getElementById('exp-debts')?.value) || 0
      };
    } else if (window.currentStep === 7) {
      window.formData.incomes = {
        husband: parseFloat(document.getElementById('inc-husband')?.value) || 0,
        others: parseFloat(document.getElementById('inc-others')?.value) || 0,
        pension: parseFloat(document.getElementById('inc-pension')?.value) || 0,
        aid: parseFloat(document.getElementById('inc-aid')?.value) || 0
      };
    } else if (window.currentStep === 8) {
      const defs = Array.from(document.querySelectorAll('.h-deficiency-item:checked')).map(el => el.value);
      window.formData.housing = {
        case: document.getElementById('h-status-case')?.value || 'ملك',
        type: document.getElementById('h-type')?.value || '',
        roof: document.getElementById('h-roof')?.value || '',
        walls: document.getElementById('h-walls')?.value || '',
        floor: document.getElementById('h-floor')?.value || '',
        furniture: document.getElementById('h-furniture')?.value || '',
        deficiencies: defs,
        opinion: document.getElementById('researcher-opinion')?.value || ''
      };
    }
  }

  window.triggerInstantWhatsApp = function(rawPhone, messageText) {
    const cleanPhone = String(rawPhone || '').replace(/\D/g, '');
    if (!cleanPhone) return;
    const intlPhone = cleanPhone.startsWith('20') ? cleanPhone : ('20' + cleanPhone.replace(/^0/, ''));
    const url = `https://wa.me/${intlPhone}?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  window.submitFullWizardApplication = async function() {
    clearStepError();
    const err = validateStepCompletion(8);
    if (err) return showStepError(err);
    let finalVillage = window.formData.husband.village;
    if (finalVillage === '__NEW__') {
      finalVillage = (document.getElementById('h-new-village-name')?.value || window.formData.husband.newVillageName || '').trim();
      if (!finalVillage) return showStepError('يرجى كتابة اسم القرية أو التابع الجديد.');
      if (window.supabaseClient) {
        await window.supabaseClient.from('custom_locations').upsert([{
          governorate: window.formData.husband.gov,
          center_city: window.formData.husband.center,
          village_name: finalVillage,
          added_by: window.currentUser?.email || 'مواطن'
        }], { onConflict: 'governorate,center_city,village_name' });
        await window.loadCustomLocationsFromDB();
      }
    }

    const check = document.getElementById('declaration-check');
    if (check && !check.checked) {
      return showStepError('يجب الموافقة على إقرار صحة البيانات والمسؤولية القانونية قبل الرفع النهائي.');
    }

    saveCurrentStepData();

    const trackingCode = 'HF-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
    const totalExp = Object.values(window.formData.expenses).reduce((a, b) => a + (parseFloat(b) || 0), 0);
    const totalInc = Object.values(window.formData.incomes).reduce((a, b) => a + (parseFloat(b) || 0), 0);

    const uploadedDocs = {
      hIdFront: await uploadSingleDoc('h-id-front', 'husband', trackingCode),
      hIdBack: await uploadSingleDoc('h-id-back', 'husband', trackingCode),
      hMedicalDoc: await uploadSingleDoc('h-medical-doc', 'husband_medical', trackingCode),
      hSocialDoc: await uploadSingleDoc('h-social-doc', 'husband_social', trackingCode),
      wIdFront: await uploadSingleDoc('w-id-front', 'wife', trackingCode),
      wIdBack: await uploadSingleDoc('w-id-back', 'wife', trackingCode),
      wMedicalDoc: await uploadSingleDoc('w-medical-doc', 'wife_medical', trackingCode),
      wSocialDoc: await uploadSingleDoc('w-social-doc', 'wife_social', trackingCode),
      mCertDoc: await uploadSingleDoc('m-cert-doc', 'marriage', trackingCode),
      mHealthDoc: await uploadSingleDoc('m-health-doc', 'marriage', trackingCode),
      socialResearch: await uploadSingleDoc('doc-social-research', 'housing_docs', trackingCode),
      insuranceH: await uploadSingleDoc('doc-insurance-h', 'housing_docs', trackingCode),
      insuranceW: await uploadSingleDoc('doc-insurance-w', 'housing_docs', trackingCode),
      lease: await uploadSingleDoc('doc-lease', 'housing_docs', trackingCode),
      schoolEnroll: await uploadSingleDoc('doc-school-enroll', 'housing_docs', trackingCode)
    };
    window.formData.documents = uploadedDocs;

    const payload = {
      tracking_code: trackingCode,
      intervention_type: window.formData.interventionType,
      governorate: window.formData.husband.gov,
      center_city: window.formData.husband.center,
      village_hamlet: window.formData.husband.village,
      street_details: window.formData.husband.street,
      husband_data: window.formData.husband,
      wife_data: window.formData.wife,
      children_data: window.formData.children,
      marriage_data: window.formData.marriage,
      expenses_data: window.formData.expenses,
      incomes_data: window.formData.incomes,
      housing_data: window.formData.housing,
      documents_data: uploadedDocs,
      total_income: totalInc,
      total_expenses: totalExp,
      status: 'pending',
            source_type: window.currentUser ? `${window.currentUser.name} (${window.currentUser.role})` : 'مواطن (تسجيل مباشر)',
      created_by_email: window.currentUser ? window.currentUser.email : null,

      eligibility_verdict: window.formData.housing.opinion || 'قيد المراجعة'
    };

    const applicantName = [window.formData.husband.name1, window.formData.husband.name2, window.formData.husband.name3].filter(Boolean).join(' ');
    const targetPhone = window.formData.husband.whatsapp || window.formData.husband.phone;
    const waMsg = `مؤسسة الحافظ للتنمية والخدمات\nتم تسجيل طلب المساعدة بنجاح.\nالاسم: ${applicantName}\nرقم الطلب: ${trackingCode}\nالحالة: قيد المراجعة\nيمكنكم متابعة حالة الطلب برقم المتابعة.`;

        if (window.supabaseClient) {
      const res = await window.supabaseClient.from('families').insert([payload]);
      if (res.error) {
        return showStepError('حدث خطأ أثناء حفظ البيانات في قاعدة البيانات: ' + res.error.message);
      }
      window.triggerInstantWhatsApp(targetPhone, waMsg);
      alert(`✅ تم تسجيل الحالة وحفظها بنجاح في قاعدة البيانات!\n\nرقم الطلب: ${trackingCode}\nيرجى الاحتفاظ به للمتابعة.`);
      window.currentStep = 1;
      if (typeof window.showSection === 'function') window.showSection('home');
      else location.reload();
    } else {
      showStepError('تعذر الاتصال بقاعدة البيانات حالياً، يرجى تحديث الصفحة والمحاولة مرة أخرى.');
    }
  };
})();
