// wizard.js - المعالج الشامل والمحدث لاستمارة البحث الاجتماعي لمؤسسة الحافظ
(function() {
  window.currentStep = window.currentStep || 1;
  window.totalWizardSteps = 8;

  const DISABILITY_TYPES = [
    'إعاقة ذهنية',
    'إعاقة حركية',
    'إعاقة سمعية',
    'إعاقة بصرية'
  ];

  const SERVICE_CARD_OPTIONS = [
    'لا',
    'نعم',
    'جارٍ الاستخراج'
  ];

  const ATTACHMENT_FIELD_MAP = [
    { inputId: 'h-id-front', docKey: 'hIdFront', folder: 'husband' },
    { inputId: 'h-id-back', docKey: 'hIdBack', folder: 'husband' },
    { inputId: 'h-medical-doc', docKey: 'hMedicalDoc', folder: 'husband_medical' },
    { inputId: 'h-social-doc', docKey: 'hSocialDoc', folder: 'husband_social' },
    { inputId: 'w-id-front', docKey: 'wIdFront', folder: 'wife' },
    { inputId: 'w-id-back', docKey: 'wIdBack', folder: 'wife' },
    { inputId: 'w-medical-doc', docKey: 'wMedicalDoc', folder: 'wife_medical' },
    { inputId: 'w-social-doc', docKey: 'wSocialDoc', folder: 'wife_social' },
    { inputId: 'm-cert-doc', docKey: 'mCertDoc', folder: 'marriage' },
    { inputId: 'm-health-doc', docKey: 'mHealthDoc', folder: 'marriage' },
    { inputId: 'doc-social-research', docKey: 'socialResearch', folder: 'housing_docs' },
    { inputId: 'doc-insurance-h', docKey: 'insuranceH', folder: 'housing_docs' },
    { inputId: 'doc-insurance-w', docKey: 'insuranceW', folder: 'housing_docs' },
    { inputId: 'doc-lease', docKey: 'lease', folder: 'housing_docs' },
    { inputId: 'doc-school-enroll', docKey: 'schoolEnroll', folder: 'housing_docs' }
  ];

  window.WIZARD_ATTACHMENTS_CACHE = window.WIZARD_ATTACHMENTS_CACHE || {};

  if (typeof window.formData === 'undefined') {
    window.formData = {
      interventionType: 'كفالة أيتام شهرية',
      husband: {
        status: 'مقيم مع الأسرة',
        health: 'سليم',
        illnessType: 'مؤقت',
        disabilityType: 'إعاقة حركية',
        hasServiceCard: 'لا',
        insuranceCoverage: 'غير محدد',
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
        disabilityType: 'إعاقة حركية',
        hasServiceCard: 'لا',
        insuranceCoverage: 'غير محدد',
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
      socialProfile: {
        actualProvider: 'الزوج (رب الأسرة)',
        receivesOtherAid: 'لا',
        otherAidDetails: '',
        hasLegalDebtIssue: 'لا',
        debtCreditorType: '',
        visitDate: new Date().toISOString().slice(0, 10)
      },
      housing: {
        case: 'ملك',
        type: 'ريفي / بيت ريفي',
        roof: 'خشب',
        walls: 'طوب لبن',
        floor: 'ترابية',
        electricityMeter: 'عداد رسمي',
        waterSource: 'مياه حكومية / عمومية',
        sanitationType: 'متصلة بالصرف الصحي',
        furniture: 'رديء',
        deficiencies: [],
        opinion: 'حالة شديدة الاستحقاق وعاجلة'
      },
      documents: {}
    };
  } else {
    window.formData.socialProfile = Object.assign({
      actualProvider: 'الزوج (رب الأسرة)',
      receivesOtherAid: 'لا',
      otherAidDetails: '',
      hasLegalDebtIssue: 'لا',
      debtCreditorType: '',
      visitDate: new Date().toISOString().slice(0, 10)
    }, window.formData.socialProfile || {});

    window.formData.housing = Object.assign({
      electricityMeter: 'عداد رسمي',
      waterSource: 'مياه حكومية / عمومية',
      sanitationType: 'متصلة بالصرف الصحي'
    }, window.formData.housing || {});

    window.formData.documents = Object.assign({}, window.formData.documents || {});
  }

  function escapeSafeHtml(str) {
    if (typeof window.escapeHtml === 'function') {
      return window.escapeHtml(str);
    }
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function hasDocValue(val) {
    if (!val) return false;
    if (typeof val === 'string') return val.trim().length > 0 && val.trim() !== 'null' && val.trim() !== 'undefined';
    if (typeof val === 'object') {
      if (val.uploadError) return false;
      return Boolean(val.url || val.publicUrl || val.path || val.dataUrl || val.base64 || val.fileName || val.name);
    }
    return Boolean(val);
  }

  function getDocKeyForInput(inputEl, explicitKey = '') {
    if (explicitKey) return explicitKey;
    const id = inputEl?.id || '';
    const found = ATTACHMENT_FIELD_MAP.find(item => item.inputId === id);
    if (found) return found.docKey;
    if (inputEl?.classList?.contains('c-cert')) {
      const card = inputEl.closest('.child-item-card');
      const cards = Array.from(document.querySelectorAll('#children-list .child-item-card'));
      const idx = cards.indexOf(card);
      return idx >= 0 ? `childCert_${idx}` : 'childCert';
    }
    return id || 'attachment';
  }

  function getFolderForDocKey(docKey, inputEl) {
    const found = ATTACHMENT_FIELD_MAP.find(item => item.docKey === docKey || item.inputId === inputEl?.id);
    return found ? found.folder : 'misc_docs';
  }

  function getDraftTrackingFolder() {
    if (!window._wizardDraftFolder) {
      window._wizardDraftFolder = 'DRAFT-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
    }
    return window._wizardDraftFolder;
  }
 
  // أضف الدالة هنا مباشرة 👇
  function toSafeStorageKeyPart(rawName) {
    const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
    const normalized = String(rawName || 'file')
      .replace(/[٠-٩]/g, d => String(arabicDigits.indexOf(d)));
    const parts = normalized.split('.');
    const rawExt = parts.length > 1 ? parts.pop().toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    const ext = rawExt ? `.${rawExt}` : '';
    const base = parts
      .join('_')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
    return `${base || 'attachment'}${ext}`;
  }
  function ensureStatusBox(inputEl, statusBoxId) {
    if (!inputEl) return null;
    if (statusBoxId) {
      const byId = document.getElementById(statusBoxId);
      if (byId) return byId;
    }
    const parent = inputEl.parentElement;
    if (!parent) return null;
    let box = parent.querySelector('.hf-attach-live-box');
    if (!box) {
      box = document.createElement('div');
      box.className = 'hf-attach-live-box';
      box.style.cssText = 'display:flex; align-items:center; gap:8px; margin-top:6px; padding:6px 8px; border-radius:8px; background:#f8fafc; border:1px solid #e2e8f0; font-size:12px; flex-wrap:wrap;';
      parent.appendChild(box);
    }
    return box;
  }

  function renderAttachmentStatusBox(box, info) {
    if (!box) return;
    if (!info || !hasDocValue(info)) {
      const errMsg = info && info.uploadError ? ` — ${info.uploadError}` : '';
      box.style.borderColor = '#fecaca';
      box.style.background = '#fef2f2';
      box.innerHTML = `<span style="color:#b91c1c; font-weight:700;">❌ لم يتم رفع المرفق${escapeSafeHtml(errMsg)} — يرجى إعادة التصوير أو الرفع من جديد.</span>`;
      return;
    }

    const displayName = info.fileName || info.name || info.path || 'مرفق';
    const previewSrc = info.dataUrl || info.url || info.publicUrl || '';
    const isImage = Boolean(
      (info.mimeType && String(info.mimeType).startsWith('image/')) ||
      (typeof previewSrc === 'string' && previewSrc.startsWith('data:image/')) ||
      /\.(jpe?g|png|gif|webp|bmp)(\?|#|$)/i.test(displayName) ||
      /\.(jpe?g|png|gif|webp|bmp)(\?|#|$)/i.test(previewSrc)
    );

    const thumbHtml = isImage && previewSrc
      ? `<img src="${previewSrc}" alt="معاينة المرفق" style="width:48px; height:48px; object-fit:cover; border-radius:6px; border:1px solid #cbd5e1; flex-shrink:0;">`
      : `<span style="display:inline-flex; align-items:center; justify-content:center; width:48px; height:48px; border-radius:6px; background:#e2e8f0; color:#0f172a; font-weight:800; font-size:12px; flex-shrink:0;">📄 ملف</span>`;

    if (info.uploaded || info.path || info.url || info.publicUrl) {
      box.style.borderColor = '#bbf7d0';
      box.style.background = '#f0fdf4';
      box.innerHTML = `
        ${thumbHtml}
        <div style="display:flex; flex-direction:column; gap:2px; min-width:0;">
          <span style="color:#15803d; font-weight:800;">✅ تم رفع المرفق بنجاح</span>
          <span style="color:#334155; font-size:11px; word-break:break-all;">${escapeSafeHtml(displayName)}</span>
        </div>
      `;
    } else if (info.dataUrl) {
      box.style.borderColor = '#fde68a';
      box.style.background = '#fffbeb';
      box.innerHTML = `
        ${thumbHtml}
        <div style="display:flex; flex-direction:column; gap:2px; min-width:0;">
          <span style="color:#b45309; font-weight:800;">⚠️ تم تجهيز المعاينة محلياً — تحقق من رفع الملف أو أعد المحاولة</span>
          <span style="color:#334155; font-size:11px; word-break:break-all;">${escapeSafeHtml(displayName)}</span>
        </div>
      `;
    } else {
      box.style.borderColor = '#fecaca';
      box.style.background = '#fef2f2';
      box.innerHTML = `<span style="color:#b91c1c; font-weight:700;">❌ لم يتم رفع المرفق — يرجى إعادة التصوير أو الرفع من جديد.</span>`;
    }
  }

  window.handleImmediateAttachmentPreview = async function(inputEl, explicitDocKey = '', statusBoxId = '') {
  if (!inputEl) return null;
  const docKey = getDocKeyForInput(inputEl, explicitDocKey);
  const box = ensureStatusBox(inputEl, statusBoxId);
  const file = inputEl.files && inputEl.files[0];

  if (!file) {
    const existing = window.formData.documents?.[docKey] || window.WIZARD_ATTACHMENTS_CACHE[docKey];
    if (existing && hasDocValue(existing)) {
      renderAttachmentStatusBox(box, existing);
      return existing;
    }
    renderAttachmentStatusBox(box, null);
    return null;
  }

  if (box) {
    box.style.borderColor = '#bfdbfe';
    box.style.background = '#eff6ff';
    box.innerHTML = `<span style="color:#1d4ed8; font-weight:700;">⏳ جارٍ رفع المرفق (${escapeSafeHtml(file.name)}) والتحقق من حفظه...</span>`;
  }

  const localDataUrl = await new Promise((resolve) => {
    if (!file.type.startsWith('image/') && !/\.(jpe?g|png|gif|webp|bmp)$/i.test(file.name)) {
      return resolve('');
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result || '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });

  const attachmentRecord = {
    name: file.name,
    fileName: file.name,
    size: file.size,
    mimeType: file.type || '',
    dataUrl: localDataUrl,
    path: '',
    url: '',
    publicUrl: '',
    uploaded: false,
    uploadError: ''
  };

  if (window.supabaseClient && window.supabaseClient.storage) {
    const folder = getFolderForDocKey(docKey, inputEl);
    const draftFolder = getDraftTrackingFolder();
    const safeName = typeof toSafeStorageKeyPart === 'function'
      ? toSafeStorageKeyPart(file.name)
      : file.name.replace(/[^\w.-]/g, '_');
    const storagePath = `${draftFolder}/${folder}/${Date.now()}_${safeName}`;

    const { error: upErr } = await window.supabaseClient.storage
      .from('foundation-docs')
      .upload(storagePath, file, { upsert: true });

    if (!upErr) {
      const { data: pubData } = window.supabaseClient.storage
        .from('foundation-docs')
        .getPublicUrl(storagePath);
      attachmentRecord.path = storagePath;
      attachmentRecord.url = (pubData && pubData.publicUrl) || '';
      attachmentRecord.publicUrl = (pubData && pubData.publicUrl) || '';
      attachmentRecord.uploaded = true;
    } else {
      attachmentRecord.uploadError = upErr.message || 'تعذر الرفع إلى التخزين';
    }
  } else {
    attachmentRecord.uploadError = 'تعذر الوصول إلى خدمة التخزين السحابي';
  }

 window.WIZARD_ATTACHMENTS_CACHE[docKey] = attachmentRecord;
    window.formData.documents = Object.assign({}, window.formData.documents || {}, {
      [docKey]: attachmentRecord
    });

    renderAttachmentStatusBox(box, attachmentRecord);
    return attachmentRecord;
  };

  function hydrateAttachmentPreviewsInCurrentStep() {
    const container = document.getElementById('wizard-container');
    if (!container) return;
    const fileInputs = container.querySelectorAll('input[type="file"]');
    fileInputs.forEach((inputEl) => {
      const docKey = getDocKeyForInput(inputEl);
      if (!inputEl.dataset.hfLiveBound) {
        inputEl.dataset.hfLiveBound = '1';
        inputEl.addEventListener('change', () => {
          window.handleImmediateAttachmentPreview(inputEl, docKey);
        });
      }
      
  function isHusbandLivingWithFamily(hObj) {
    const h = hObj || {};
    const statusText = String(h.status || h.socialStatus || h.livingStatus || '').trim();
    if (!statusText) return true;
    return statusText.includes('مقيم مع الأسرة') || statusText.includes('مقيم مع الاسرة') || statusText === 'مقيم';
  }

  function computePrimaryApplicantName(hObj, wObj) {
    const h = hObj || {};
    const w = wObj || {};
    const hFull = [h.name1, h.name2, h.name3].filter(Boolean).join(' ').trim();
    const wFull = [w.name1, w.name2, w.name3].filter(Boolean).join(' ').trim();
    if (isHusbandLivingWithFamily(h)) {
      return hFull || wFull || '';
    }
    return wFull || hFull || '';
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
      const sp = window.formData.socialProfile || {};
      html += `
        <h4 style="color:var(--primary-dark); margin-top:0;">🎯 الخطوة الأولى: تحديد نوع التدخل وبيانات البحث الميداني</h4>
        <div class="grid-2" style="margin-bottom:14px;">
          <div>
            <label style="font-weight:700;">نوع المساعدة الأساسية المطلوبة للأسرة *</label>
            <select id="intervention-type" onchange="window.formData.interventionType = this.value">
              ${aidOptions}
            </select>
          </div>
          <div>
            <label style="font-weight:700;">تاريخ إجراء البحث / الزيارة الميدانية *</label>
            <input type="date" id="sp-visit-date" value="${sp.visitDate || new Date().toISOString().slice(0, 10)}" onchange="window.formData.socialProfile.visitDate = this.value">
          </div>
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

      const statusOptions = (window.HUSBAND_MARITAL_STATUSES || ['مقيم مع الأسرة', 'غائب / مسافر', 'منفصل / مطلق', 'متوفى', 'مريض / عاجز عن الكسب']).map(s => `<option value="${s}" ${window.formData.husband.status===s?'selected':''}>${s}</option>`).join('');
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
            <label>الحالة الاجتماعية للأب *</label>
            <select id="h-status" onchange="if(window.formData.husband){window.formData.husband.status=this.value;}">${statusOptions}</select>
            <small style="color:#0f766e; font-size:11px;">يُعتمد اسم الزوج في ملف البحث إذا كان (مقيم مع الأسرة)، وفي باقي الحالات يُعتمد اسم الزوجة.</small>
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
          <div><label>صورة بطاقة الزوج (وش) *</label><input type="file" id="h-id-front" accept="image/*,.pdf" onchange="window.handleImmediateAttachmentPreview(this, 'hIdFront')"></div>
          <div><label>صورة بطاقة الزوج (ظهر) *</label><input type="file" id="h-id-back" accept="image/*,.pdf" onchange="window.handleImmediateAttachmentPreview(this, 'hIdBack')"></div>
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
          <div><label>صورة بطاقة الزوجة (وش) *</label><input type="file" id="w-id-front" accept="image/*,.pdf" onchange="window.handleImmediateAttachmentPreview(this, 'wIdFront')"></div>
          <div><label>صورة بطاقة الزوجة (ظهر) *</label><input type="file" id="w-id-back" accept="image/*,.pdf" onchange="window.handleImmediateAttachmentPreview(this, 'wIdBack')"></div>
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
            const cHealth = c.health || 'سليم';
            const isSickOrDisabled = (cHealth === 'مريض' || cHealth === 'من ذوي الإعاقة');
            const cDisType = c.disabilityType || 'إعاقة حركية';
            const cCard = c.hasServiceCard || 'لا';
            const cIns = c.insuranceCoverage || 'غير محدد';
            const cCost = c.monthlyCost || '';

            return `
            <div class="child-item-card" style="background:#f8fafc; border:1px solid #cbd5e1; padding:12px; border-radius:10px; margin-bottom:10px;">
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
                <div><label style="font-size:11px;">شهادة الميلاد / المستند:</label><input type="file" class="c-cert" accept="image/*,.pdf" onchange="window.handleImmediateAttachmentPreview(this, 'childCert_${idx}')"></div>
                <div>
                  <label style="font-size:11px;">الحالة الصحية:</label>
                  <select class="c-health" onchange="window.toggleChildHealthDetails(${idx})">
                    <option value="سليم" ${cHealth==='سليم'?'selected':''}>سليم</option>
                    <option value="مريض" ${cHealth==='مريض'?'selected':''}>مريض</option>
                    <option value="من ذوي الإعاقة" ${cHealth==='من ذوي الإعاقة'?'selected':''}>من ذوي الإعاقة</option>
                  </select>
                </div>
              </div>

              <div class="c-health-details ${isSickOrDisabled ? '' : 'hidden'}" style="margin-top:8px; padding:10px; background:#fff; border:1px dashed #cbd5e1; border-radius:8px;">
                <div class="grid-3">
                  <div>
                    <label style="font-size:11px;">نوع الحالة / الإعاقة:</label>
                    <select class="c-disability-type">
                      ${DISABILITY_TYPES.map(dt => `<option value="${dt}" ${cDisType===dt?'selected':''}>${dt}</option>`).join('')}
                      <option value="مرض مزمن" ${cDisType==='مرض مزمن'?'selected':''}>مرض مزمن</option>
                      <option value="مرض مؤقت" ${cDisType==='مرض مؤقت'?'selected':''}>مرض مؤقت</option>
                    </select>
                  </div>
                  <div>
                    <label style="font-size:11px;">هل يوجد كارت خدمات متكاملة؟</label>
                    <select class="c-service-card">
                      ${SERVICE_CARD_OPTIONS.map(sc => `<option value="${sc}" ${cCard===sc?'selected':''}>${sc}</option>`).join('')}
                    </select>
                  </div>
                  <div>
                    <label style="font-size:11px;">التكلفة الشهرية إن وجدت (جنيه):</label>
                    <input type="number" min="0" class="c-monthly-cost" value="${cCost}" placeholder="0">
                  </div>
                </div>
                <div style="margin-top:6px;">
                  <label style="font-size:11px;">تغطية علاج / تأمين:</label>
                  <select class="c-insurance">
                    <option value="غير محدد" ${cIns==='غير محدد'?'selected':''}>غير محدد</option>
                    <option value="تأمين صحي" ${cIns==='تأمين صحي'?'selected':''}>تأمين صحي</option>
                    <option value="علاج على نفقة الدولة" ${cIns==='علاج على نفقة الدولة'?'selected':''}>علاج على نفقة الدولة</option>
                    <option value="تكافل وكرامة" ${cIns==='تكافل وكرامة'?'selected':''}>تكافل وكرامة</option>
                  </select>
                </div>
              </div>

              <button type="button" onclick="removeChildRow(${idx})" class="nav-btn" style="background:#b91c1c; color:#fff; margin-top:8px; font-size:11px;">حذف هذا الابن</button>
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
            <div><label>صورة قسيمة الزواج / الخطوبة *</label><input type="file" id="m-cert-doc" accept="image/*,.pdf" onchange="window.handleImmediateAttachmentPreview(this, 'mCertDoc')"></div>
            <div><label>الشهادة الصحية للعروسين (وش وظهر) *</label><input type="file" id="m-health-doc" accept="image/*,.pdf" onchange="window.handleImmediateAttachmentPreview(this, 'mHealthDoc')"></div>
          </div>
        </div>
      `;
    }
    // --- الخطوة 6: المصروفات والبيانات الاجتماعية ---
    else if (window.currentStep === 6) {
      const sp = window.formData.socialProfile || {};
      html += `
        <h4 style="color:var(--primary-dark); margin-top:0;">💸 القسم الرابع: المصروفات والوضع الاجتماعي للأسرة</h4>
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

        <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:12px; border-radius:8px; margin-top:12px;">
          <strong style="color:var(--primary-dark); display:block; margin-bottom:8px;">بيانات الإعالة والديون والمساعدات الأخرى</strong>
          <div class="grid-2">
            <div>
              <label>القائم بالإنفاق الفعلي على الأسرة *</label>
              <select id="sp-actual-provider">
                <option value="الزوج (رب الأسرة)" ${sp.actualProvider==='الزوج (رب الأسرة)'?'selected':''}>الزوج (رب الأسرة)</option>
                <option value="الزوجة (الأم)" ${sp.actualProvider==='الزوجة (الأم)'?'selected':''}>الزوجة (الأم)</option>
                <option value="أحد الأبناء" ${sp.actualProvider==='أحد الأبناء'?'selected':''}>أحد الأبناء</option>
                <option value="طرف آخر / جهة" ${sp.actualProvider==='طرف آخر / جهة'?'selected':''}>طرف آخر / جهة</option>
              </select>
            </div>
            <div>
              <label>هل تتلقى الأسرة مساعدة من جهة أخرى؟ *</label>
              <select id="sp-other-aid">
                <option value="لا" ${sp.receivesOtherAid!=='نعم'?'selected':''}>لا</option>
                <option value="نعم" ${sp.receivesOtherAid==='نعم'?'selected':''}>نعم</option>
              </select>
            </div>
          </div>
          <div class="grid-2" style="margin-top:8px;">
            <div>
              <label>تفاصيل المساعدة الأخرى (إن وجدت):</label>
              <input id="sp-other-aid-details" value="${sp.otherAidDetails || ''}" placeholder="اسم الجمعية أو نوع المساعدة">
            </div>
            <div>
              <label>جهة الدين / تعثر قضائي إن وجد:</label>
              <input id="sp-debt-creditor" value="${sp.debtCreditorType || ''}" placeholder="مثال: قرض/أقساط أو تعثر قضائي">
            </div>
          </div>
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
    // --- الخطوة 8: السكن، المرافق، الفرش والأثاث ونواقصه، المستندات، ورأي الباحث ---
    else if (window.currentStep === 8) {
      const furnList = window.FURNITURE_CONDITIONS || ["رديء جداً / معدوم", "رديء", "متوسط", "جيد", "جيد جداً / ممتاز"];
      const furnOpts = furnList.map(f => `<option value="${f}" ${window.formData.housing.furniture===f?'selected':''}>${f}</option>`).join('');
      const defList = window.FURNITURE_DEFICIENCIES || [];
      const selectedDefs = window.formData.housing.deficiencies || [];

      html += `
        <h4 style="color:var(--primary-dark); margin-top:0;">📋 القسم السادس: وصف السكن والمرافق والمستندات ورأي الباحث</h4>
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

        <div class="grid-3" style="margin-bottom:10px;">
          <div>
            <label>عداد الكهرباء *</label>
            <select id="h-elec-meter">
              <option value="عداد رسمي" ${window.formData.housing.electricityMeter==='عداد رسمي'?'selected':''}>عداد رسمي</option>
              <option value="ممارسة / مشترك" ${window.formData.housing.electricityMeter==='ممارسة / مشترك'?'selected':''}>ممارسة / مشترك</option>
              <option value="لا يوجد" ${window.formData.housing.electricityMeter==='لا يوجد'?'selected':''}>لا يوجد</option>
            </select>
          </div>
          <div>
            <label>مصدر المياه *</label>
            <select id="h-water-src">
              <option value="مياه حكومية / عمومية" ${window.formData.housing.waterSource==='مياه حكومية / عمومية'?'selected':''}>مياه حكومية / عمومية</option>
              <option value="وصلة مشتركة / جيران" ${window.formData.housing.waterSource==='وصلة مشتركة / جيران'?'selected':''}>وصلة مشتركة / جيران</option>
              <option value="لا يوجد" ${window.formData.housing.waterSource==='لا يوجد'?'selected':''}>لا يوجد</option>
            </select>
          </div>
          <div>
            <label>دورة المياه والصرف الصحي *</label>
            <select id="h-sanitation">
              <option value="متصلة بالصرف الصحي" ${window.formData.housing.sanitationType==='متصلة بالصرف الصحي'?'selected':''}>متصلة بالصرف الصحي</option>
              <option value="بيارة / ترنش" ${window.formData.housing.sanitationType==='بيارة / ترنش'?'selected':''}>بيارة / ترنش</option>
              <option value="غير صالحة / متهالكة" ${window.formData.housing.sanitationType==='غير صالحة / متهالكة'?'selected':''}>غير صالحة / متهالكة</option>
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
          <div><label>البحث الاجتماعي (مختوم) *</label><input type="file" id="doc-social-research" accept="image/*,.pdf" onchange="window.handleImmediateAttachmentPreview(this, 'socialResearch')"></div>
          <div><label>برنت تأميني للزوج</label><input type="file" id="doc-insurance-h" accept="image/*,.pdf" onchange="window.handleImmediateAttachmentPreview(this, 'insuranceH')"></div>
          <div><label>برنت تأميني للزوجة</label><input type="file" id="doc-insurance-w" accept="image/*,.pdf" onchange="window.handleImmediateAttachmentPreview(this, 'insuranceW')"></div>
          <div id="lease-doc-box" class="${window.formData.housing.case==='إيجار'?'':'hidden'}"><label>عقد الإيجار الرسمي *</label><input type="file" id="doc-lease" accept="image/*,.pdf" onchange="window.handleImmediateAttachmentPreview(this, 'lease')"></div>
          <div><label>إثبات قيد دراسي للأبناء</label><input type="file" id="doc-school-enroll" accept="image/*,.pdf" onchange="window.handleImmediateAttachmentPreview(this, 'schoolEnroll')"></div>
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

    hydrateAttachmentPreviewsInCurrentStep();
  };

  window.toggleChildHealthDetails = function(childIndex) {
    const row = document.querySelectorAll('#children-list > div')[childIndex];
    if (!row) return;
    const healthVal = row.querySelector('.c-health')?.value || 'سليم';
    const box = row.querySelector('.c-health-details');
    if (box) {
      box.classList.toggle('hidden', healthVal === 'سليم');
    }
  };

  // بناء بلوك الحالة الصحية بحيث يشمل: مريض / من ذوي الإعاقة + الإعاقات الأربع + كارت الخدمات المتكاملة + التكلفة الشهرية
  window.renderPersonHealthBlockHtml = function(prefix, labelName) {
    const pData = prefix === 'h' ? window.formData.husband : window.formData.wife;
    const currentHealth = pData.health || 'سليم';
    const currentCard = pData.hasServiceCard || 'لا';
    const currentIns = pData.insuranceCoverage || 'غير محدد';

    return `
      <div style="background:#f1f5f9; padding:12px; border-radius:8px; margin-top:10px; border:1px solid #e2e8f0;">
        <div class="grid-3">
          <div>
            <label>الحالة الصحية (${labelName}) *</label>
            <select id="${prefix}-health" onchange="renderHealthSection('${prefix}')">
              <option value="سليم" ${currentHealth==='سليم'?'selected':''}>سليم وبصحة جيدة</option>
              <option value="مريض" ${currentHealth==='مريض'?'selected':''}>مريض</option>
              <option value="من ذوي الإعاقة" ${currentHealth==='من ذوي الإعاقة'?'selected':''}>من ذوي الإعاقة</option>
            </select>
          </div>
          <div id="${prefix}-illness-type-container" class="${currentHealth==='سليم'?'hidden':''}">
            <label>نوع الحالة / المرض أو الإعاقة *</label>
            <select id="${prefix}-illness-type" onchange="renderHealthSection('${prefix}')">
              <option value="مؤقت" ${pData.illnessType==='مؤقت'?'selected':''}>مرض مؤقت</option>
              <option value="مزمن" ${pData.illnessType==='مزمن'?'selected':''}>مرض مزمن</option>
              <option value="إعاقة ذهنية" ${pData.illnessType==='إعاقة ذهنية'?'selected':''}>إعاقة ذهنية</option>
              <option value="إعاقة حركية" ${pData.illnessType==='إعاقة حركية'?'selected':''}>إعاقة حركية</option>
              <option value="إعاقة سمعية" ${pData.illnessType==='إعاقة سمعية'?'selected':''}>إعاقة سمعية</option>
              <option value="إعاقة بصرية" ${pData.illnessType==='إعاقة بصرية'?'selected':''}>إعاقة بصرية</option>
            </select>
          </div>
          <div id="${prefix}-service-card-container" class="${currentHealth==='سليم'?'hidden':''}">
            <label>هل يوجد كارت خدمات متكاملة؟ *</label>
            <select id="${prefix}-service-card" onchange="window.formData[prefix==='h'?'husband':'wife'].hasServiceCard=this.value">
              ${SERVICE_CARD_OPTIONS.map(sc => `<option value="${sc}" ${currentCard===sc?'selected':''}>${sc}</option>`).join('')}
            </select>
          </div>
        </div>

        <div id="${prefix}-health-box" class="${currentHealth==='سليم'?'hidden':''}" style="margin-top:10px; border-top:1px dashed #cbd5e1; padding-top:10px;">
          <div class="grid-3">
            <div>
              <label>تشخيص الحالة المرضية أو نوع الإعاقة *</label>
              <select id="${prefix}-illness-name"></select>
            </div>
            <div>
              <label>الإجراء الطبي المطلوب (بالتفصيل الكامل) *</label>
              <select id="${prefix}-medical-need" onchange="renderDynamicMedicalFields('${prefix}')"></select>
            </div>
            <div>
              <label>التغطية العلاجية / التأمين:</label>
              <select id="${prefix}-insurance-cov">
                <option value="غير محدد" ${currentIns==='غير محدد'?'selected':''}>غير محدد</option>
                <option value="تأمين صحي" ${currentIns==='تأمين صحي'?'selected':''}>تأمين صحي</option>
                <option value="علاج على نفقة الدولة" ${currentIns==='علاج على نفقة الدولة'?'selected':''}>علاج على نفقة الدولة</option>
                <option value="تكافل وكرامة" ${currentIns==='تكافل وكرامة'?'selected':''}>تكافل وكرامة</option>
              </select>
            </div>
          </div>

          <div id="${prefix}-dynamic-medical-fields" style="margin-top:10px;"></div>

          <div class="grid-2" style="margin-top:10px;">
            <div>
              <label>رفع التقرير الطبي (مختوم) *</label>
              <input type="file" id="${prefix}-medical-doc" accept="image/*,.pdf" onchange="window.handleImmediateAttachmentPreview(this, '${prefix}MedicalDoc')">
            </div>
            <div>
              <label>رفع البحث الاجتماعي (مختوم) *</label>
              <input type="file" id="${prefix}-social-doc" accept="image/*,.pdf" onchange="window.handleImmediateAttachmentPreview(this, '${prefix}SocialDoc')">
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
    const cardContainer = document.getElementById(type + '-service-card-container');
    const healthBox = document.getElementById(type + '-health-box');
    const illnessSelect = document.getElementById(type + '-illness-name');
    const medicalNeedSelect = document.getElementById(type + '-medical-need');

    if (!healthBox || !illnessContainer || !illnessSelect || !medicalNeedSelect) return;

    pData.health = healthStatus;

    if (healthStatus !== 'سليم') {
      illnessContainer.classList.remove('hidden');
      if (cardContainer) cardContainer.classList.remove('hidden');
      healthBox.classList.remove('hidden');
    } else {
      illnessContainer.classList.add('hidden');
      if (cardContainer) cardContainer.classList.add('hidden');
      healthBox.classList.add('hidden');
      return;
    }

    const illnessTypeEl = document.getElementById(type + '-illness-type');
    if (healthStatus === 'من ذوي الإعاقة' && illnessTypeEl && !DISABILITY_TYPES.includes(illnessTypeEl.value)) {
      illnessTypeEl.value = DISABILITY_TYPES.includes(pData.illnessType) ? pData.illnessType : 'إعاقة حركية';
    }
    const illnessType = illnessTypeEl?.value || 'مؤقت';
    pData.illnessType = illnessType;

    let illnesses = [];
    if (illnessType === 'مؤقت') {
      illnesses = window.TEMPORARY_ILLNESSES || ['إصابة / كسر مؤقت', 'التهاب حاد / عدوى', 'حالة مرضية مؤقتة أخرى'];
    } else if (illnessType === 'مزمن') {
      illnesses = window.CHRONIC_ILLNESSES || ['السكري', 'الضغط', 'أمراض القلب', 'أمراض الكلى', 'أمراض الكبد', 'الربو / الجهاز التنفسي'];
    } else {
      illnesses = [illnessType, ...DISABILITY_TYPES.filter(d => d !== illnessType), 'إعاقة متعددة'];
    }

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
      : (procedures.includes(pData.medicalNeed) ? pData.medicalNeed : "دواء وعلاج شهري مزمن");

    medicalNeedSelect.innerHTML = procedures
      .map(proc => `<option value="${proc}" ${defaultNeed===proc?'selected':''}>${proc}</option>`)
      .join('');

    window.renderDynamicMedicalFields(type);
    hydrateAttachmentPreviewsInCurrentStep();
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

  function isAttachmentReady(inputId, docKey) {
    const fileInput = document.getElementById(inputId);
    const hasFileSelected = Boolean(fileInput?.files?.length);
    const savedDoc = window.formData.documents?.[docKey] || window.WIZARD_ATTACHMENTS_CACHE[docKey];
    if (savedDoc && hasDocValue(savedDoc)) return true;
    return hasFileSelected && (!savedDoc || !savedDoc.uploadError);
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
      const idFront = isAttachmentReady('h-id-front', 'hIdFront');
      const idBack = isAttachmentReady('h-id-back', 'hIdBack');

      if (!name1 || !name2 || !name3) return 'يرجى استكمال الاسم الثلاثي والعائلة للزوج.';
      if (!window.parseEgyptianNationalId(nid).valid) return 'الرقم القومي للزوج غير صحيح (يجب أن يتكون من 14 رقماً صحيحاً).';

      if (typeof window.validateLocationHierarchy === 'function') {
        const geoCheck = window.validateLocationHierarchy(gov, center, village);
        if (!geoCheck.valid) return geoCheck.reason;
      }
      if (!street) return 'يرجى إدخال تفاصيل العنوان (الشارع / الحارة / رقم المنزل).';
      if (!isValidEgyptianPhone(phone)) return 'رقم التليفون الأساسي للزوج يجب أن يتكون من 11 رقماً يبدأ بـ 01.';
      if (whatsapp && !isValidEgyptianPhone(whatsapp)) return 'رقم الواتساب للزوج يجب أن يتكون من 11 رقماً صحيحاً.';

      if (health !== 'سليم') {
        const need = document.getElementById('h-medical-need')?.value || '';
        const medDoc = isAttachmentReady('h-medical-doc', 'hMedicalDoc');
        const socDoc = isAttachmentReady('h-social-doc', 'hSocialDoc');

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
        if (!medDoc) return 'يرجى رفع التقرير الطبي المختوم للزوج والتأكد من ظهور علامة الرفع الناجح.';
        if (!socDoc) return 'يرجى رفع البحث الاجتماعي المختوم لحالة الزوج والتأكد من ظهور علامة الرفع الناجح.';
      }

      if (!idFront || !idBack) return 'يرجى رفع صورة بطاقة الزوج (وجه وظهر) والتأكد من ظهور علامة الرفع الناجح.';
      return null;
    }

    if (step === 3) {
      const name1 = (document.getElementById('w-name1')?.value || '').trim();
      const name2 = (document.getElementById('w-name2')?.value || '').trim();
      const name3 = (document.getElementById('w-name3')?.value || '').trim();
      const nid = (document.getElementById('w-nid')?.value || '').trim();
      const phone = (document.getElementById('w-phone')?.value || '').trim();
      const health = document.getElementById('w-health')?.value || 'سليم';
      const idFront = isAttachmentReady('w-id-front', 'wIdFront');
      const idBack = isAttachmentReady('w-id-back', 'wIdBack');

      if (!name1 || !name2 || !name3) return 'يرجى استكمال الاسم الثلاثي والعائلة للزوجة.';
      if (!window.parseEgyptianNationalId(nid).valid) return 'الرقم القومي للزوجة غير صحيح (يجب أن يتكون من 14 رقماً صحيحاً).';
      if (phone && !isValidEgyptianPhone(phone)) return 'رقم هاتف الزوجة يجب أن يتكون من 11 رقماً صحيحاً.';

      if (health !== 'سليم') {
        const need = document.getElementById('w-medical-need')?.value || '';
        const medDoc = isAttachmentReady('w-medical-doc', 'wMedicalDoc');
        const socDoc = isAttachmentReady('w-social-doc', 'wSocialDoc');

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
        if (!medDoc) return 'يرجى رفع التقرير الطبي المختوم للزوجة والتأكد من ظهور علامة الرفع الناجح.';
        if (!socDoc) return 'يرجى رفع البحث الاجتماعي المختوم للزوجة والتأكد من ظهور علامة الرفع الناجح.';
      }

      if (!idFront || !idBack) return 'يرجى رفع صورة بطاقة الزوجة (وجه وظهر) والتأكد من ظهور علامة الرفع الناجح.';
      return null;
    }

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
      const mCert = isAttachmentReady('m-cert-doc', 'mCertDoc');
      const mHealth = isAttachmentReady('m-health-doc', 'mHealthDoc');

      if (!m1 || !m2 || !m3) return 'يرجى استكمال الاسم الثلاثي والعائلة للعروسة.';
      if (!window.parseEgyptianNationalId(mNid).valid) return 'الرقم القومي للعروسة غير صحيح (14 رقماً).';
      if (!isValidEgyptianPhone(mPhone)) return 'رقم هاتف العروسة أو وليها يجب أن يتكون من 11 رقماً.';
      if (!mDate) return 'يرجى تحديد موعد الزفاف المقترح.';
      if (!mAvail) return 'يرجى إدخال المتوفرات لدى العروسة.';
      if (!mCert || !mHealth) return 'يرجى رفع قسيمة الزواج/الخطوبة والشهادة الصحية للعروسين والتأكد من ظهور علامة الرفع الناجح.';
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
      const socDoc = isAttachmentReady('doc-social-research', 'socialResearch');
      const leaseDoc = isAttachmentReady('doc-lease', 'lease');

      if (['رديء', 'رديء جداً / معدوم', 'متوسط'].includes(furn)) {
        const checkedDefs = Array.from(document.querySelectorAll('.h-deficiency-item:checked'));
        if (checkedDefs.length === 0) {
          return 'يرجى اختيار بند واحد على الأقل من نواقص الفرش والأثاث.';
        }
      }

      if (!socDoc) return 'يرجى رفع البحث الاجتماعي المختوم ضمن المستندات الرسمية والتأكد من ظهور علامة الرفع الناجح.';
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
    hydrateAttachmentPreviewsInCurrentStep();
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
      health: 'سليم',
      disabilityType: 'إعاقة حركية',
      hasServiceCard: 'لا',
      monthlyCost: '',
      insuranceCoverage: 'غير محدد'
    });
    window.renderWizardStep();
  };

  window.removeChildRow = function(idx) {
    saveCurrentStepData();
    window.formData.children.splice(idx, 1);
    window.renderWizardStep();
  };

  // حساب الفائض والعجز المالي وفق القاعدة: إجمالي المصروفات - إجمالي الدخل
  window.calcTotals = function() {
    const readNum = (id) => {
      const val = parseFloat(document.getElementById(id)?.value);
      return Number.isFinite(val) ? val : 0;
    };

    const rent = readNum('exp-rent');
    const water = readNum('exp-water');
    const electric = readNum('exp-electric');
    const gas = readNum('exp-gas');
    const edu = readNum('exp-edu');
    const health = readNum('exp-health');
    const food = readNum('exp-food');
    const debts = readNum('exp-debts');

    const totalExp = rent + water + electric + gas + edu + health + food + debts;
    const expDisplay = document.getElementById('total-exp-display');
    if (expDisplay) {
      expDisplay.innerText = `${totalExp} جنيه`;
    }

    const incH = readNum('inc-husband');
    const incO = readNum('inc-others');
    const incP = readNum('inc-pension');
    const incA = readNum('inc-aid');

    const totalInc = incH + incO + incP + incA;

    // الحساب المعتمد: إجمالي المصروفات - إجمالي الدخل
    const expenseMinusIncome = totalExp - totalInc;

    let statusBadge = '';
    let balanceHtml = '';

    if (expenseMinusIncome > 0) {
      // المصروفات أكبر من الدخل => يوجد عجز
      statusBadge = `⚠️ يوجد عجز مالي شهري بقيمة: ${expenseMinusIncome} جنيه`;
      balanceHtml = `⚠️ يوجد عجز مالي شهري بقيمة: <span style="color:#b91c1c;font-weight:bold;">${expenseMinusIncome} جنيه</span>`;
    } else if (expenseMinusIncome < 0) {
      // المصروفات أقل من الدخل => يوجد فائض
      const surplusAmount = Math.abs(expenseMinusIncome);
      statusBadge = `🟢 يوجد فائض مالي شهري بقيمة: ${surplusAmount} جنيه`;
      balanceHtml = `🟢 يوجد فائض مالي شهري بقيمة: <span style="color:#065f46;font-weight:bold;">${surplusAmount} جنيه</span>`;
    } else {
      statusBadge = `⚖️ الدخل والمصاريف متعادلان (0 جنيه)`;
      balanceHtml = `⚖️ الدخل والمصاريف متعادلان (0 جنيه)`;
    }

    const incDisplay = document.getElementById('total-inc-display');
    if (incDisplay) {
      incDisplay.innerHTML = `إجمالي الدخل الشهري: <strong>${totalInc} جنيه</strong> — ${statusBadge}`;
    }

    const balDisplay = document.getElementById('balance-display');
    if (balDisplay) {
      balDisplay.innerHTML = balanceHtml;
    }
  };

  async function uploadSingleDoc(inputId, folderName, trackingCode, docKey = '') {
    const resolvedKey = getDocKeyForInput(document.getElementById(inputId), docKey);
    const fileInput = document.getElementById(inputId);
    const file = fileInput?.files?.[0];
    const existing = window.formData.documents?.[resolvedKey] || window.WIZARD_ATTACHMENTS_CACHE[resolvedKey];

    if (!file) {
      return hasDocValue(existing) ? existing : null;
    }

    if (existing && existing.uploaded && existing.path && existing.fileName === file.name && existing.size === file.size) {
      return existing;
    }

    if (!window.supabaseClient || !window.supabaseClient.storage) {
      return existing || { name: file.name, fileName: file.name, size: file.size };
    }

    const safeName = typeof toSafeStorageKeyPart === 'function'
      ? toSafeStorageKeyPart(file.name)
      : file.name.replace(/[^\w.-]/g, '_');
    const filePath = `${trackingCode}/${folderName}/${Date.now()}_${safeName}`;

    const { error } = await window.supabaseClient.storage
      .from('foundation-docs')
      .upload(filePath, file, { upsert: true });

    if (error) {
      return { name: file.name, fileName: file.name, uploadError: error.message };
    }

    const { data: pubData } = window.supabaseClient.storage
      .from('foundation-docs')
      .getPublicUrl(filePath);

    return {
      name: file.name,
      fileName: file.name,
      path: filePath,
      url: (pubData && pubData.publicUrl) || '',
      publicUrl: (pubData && pubData.publicUrl) || '',
      uploaded: true
    };
  }

  function saveCurrentStepData() {
    if (window.currentStep === 1) {
      window.formData.interventionType = document.getElementById('intervention-type')?.value || 'كفالة أيتام شهرية';
      window.formData.socialProfile = Object.assign(window.formData.socialProfile || {}, {
        visitDate: document.getElementById('sp-visit-date')?.value || new Date().toISOString().slice(0, 10)
      });
    } else if (window.currentStep === 2) {
      const nid = document.getElementById('h-nid')?.value || '';
      const parsed = window.parseEgyptianNationalId(nid);
      const healthVal = document.getElementById('h-health')?.value || 'سليم';
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
        newVillageName: document.getElementById('h-new-village-name')?.value || '',
        street: document.getElementById('h-street')?.value || '',
        phone: document.getElementById('h-phone')?.value || '',
        whatsapp: document.getElementById('h-whatsapp')?.value || '',
        job: document.getElementById('h-job')?.value || '',
        health: healthVal,
        illnessType: document.getElementById('h-illness-type')?.value || '',
        disabilityType: DISABILITY_TYPES.includes(document.getElementById('h-illness-type')?.value)
          ? document.getElementById('h-illness-type')?.value
          : (window.formData.husband?.disabilityType || ''),
        hasServiceCard: document.getElementById('h-service-card')?.value || 'لا',
        insuranceCoverage: document.getElementById('h-insurance-cov')?.value || 'غير محدد',
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
        disabilityType: DISABILITY_TYPES.includes(document.getElementById('w-illness-type')?.value)
          ? document.getElementById('w-illness-type')?.value
          : (window.formData.wife?.disabilityType || ''),
        hasServiceCard: document.getElementById('w-service-card')?.value || 'لا',
        insuranceCoverage: document.getElementById('w-insurance-cov')?.value || 'غير محدد',
        illnessName: document.getElementById('w-illness-name')?.value || '',
        medicalNeed: document.getElementById('w-medical-need')?.value || '',
        subDetail: document.getElementById('w-sub-detail')?.value || '',
        monthlyCost: document.getElementById('w-monthly-cost')?.value || ''
      };
    } else if (window.currentStep === 4) {
      const rows = document.querySelectorAll('#children-list > div');
      const updatedChildren = [];
      rows.forEach((r, idx) => {
        const nid = r.querySelector('.c-nid')?.value || '';
        const parsed = window.parseEgyptianNationalId(nid);
        const cHealth = r.querySelector('.c-health')?.value || 'سليم';
        const cDisType = r.querySelector('.c-disability-type')?.value || '';
        const certCache = window.formData.documents?.[`childCert_${idx}`] || window.WIZARD_ATTACHMENTS_CACHE[`childCert_${idx}`];
        updatedChildren.push({
          name: r.querySelector('.c-name')?.value || '',
          nid,
          gender: parsed.valid ? parsed.gender : (r.querySelector('.c-gender')?.value || ''),
          birthDate: parsed.valid ? parsed.birthDate : (r.querySelector('.c-birth-date')?.value || ''),
          socialStatus: r.querySelector('.c-social-status')?.value || '',
          edu: r.querySelector('.c-edu')?.value || '',
          health: cHealth,
          disabilityType: cHealth === 'سليم' ? '' : cDisType,
          hasServiceCard: cHealth === 'سليم' ? 'لا' : (r.querySelector('.c-service-card')?.value || 'لا'),
          monthlyCost: cHealth === 'سليم' ? '' : (r.querySelector('.c-monthly-cost')?.value || ''),
          insuranceCoverage: cHealth === 'سليم' ? 'غير محدد' : (r.querySelector('.c-insurance')?.value || 'غير محدد'),
          certificateDoc: certCache || null
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
      const otherAidVal = document.getElementById('sp-other-aid')?.value || 'لا';
      const debtCredVal = (document.getElementById('sp-debt-creditor')?.value || '').trim();
      window.formData.socialProfile = Object.assign(window.formData.socialProfile || {}, {
        actualProvider: document.getElementById('sp-actual-provider')?.value || 'الزوج (رب الأسرة)',
        receivesOtherAid: otherAidVal,
        otherAidDetails: (document.getElementById('sp-other-aid-details')?.value || '').trim(),
        hasLegalDebtIssue: debtCredVal ? 'نعم' : 'لا',
        debtCreditorType: debtCredVal
      });
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
        electricityMeter: document.getElementById('h-elec-meter')?.value || 'عداد رسمي',
        waterSource: document.getElementById('h-water-src')?.value || 'مياه حكومية / عمومية',
        sanitationType: document.getElementById('h-sanitation')?.value || 'متصلة بالصرف الصحي',
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
    const url = `https://wa.me/${intlPhone}?text=${encodeURIComponent(messageText || '')}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  window.submitFullWizardApplication = async function() {
    clearStepError();
    const err = validateStepCompletion(8);
    if (err) return showStepError(err);

    const check = document.getElementById('declaration-check');
    if (check && !check.checked) {
      return showStepError('يجب الموافقة على إقرار صحة البيانات والمسؤولية القانونية قبل الرفع النهائي.');
    }

    saveCurrentStepData();

    const husbandData = window.formData.husband || {};
    const wifeData = window.formData.wife || {};
    const socialProfile = window.formData.socialProfile || {};
    let finalVillage = husbandData.village || '';

    if (finalVillage === '__NEW__') {
      finalVillage = (document.getElementById('h-new-village-name')?.value || husbandData.newVillageName || '').trim();
      if (!finalVillage) return showStepError('يرجى كتابة اسم القرية أو التابع الجديد.');

      husbandData.village = finalVillage;
      window.formData.husband = husbandData;

      if (window.supabaseClient) {
        const locRes = await window.supabaseClient
          .from('custom_locations')
          .upsert([{
            governorate: husbandData.gov || '',
            center_city: husbandData.center || '',
            village_name: finalVillage,
            added_by: window.currentUser?.email || 'مواطن'
          }], { onConflict: 'governorate,center_city,village_name' });

        if (locRes.error) {
          console.warn('custom_locations upsert warning:', locRes.error.message);
        } else if (typeof window.loadCustomLocationsFromDB === 'function') {
          await window.loadCustomLocationsFromDB();
        }
      }
    }

    const trackingCode = 'HF-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
    const expensesObj = window.formData.expenses || {};
    const incomesObj = window.formData.incomes || {};
    const totalExp = Object.values(expensesObj).reduce((a, b) => a + (parseFloat(b) || 0), 0);
    const totalInc = Object.values(incomesObj).reduce((a, b) => a + (parseFloat(b) || 0), 0);

    const rawDocs = {
      hIdFront: await uploadSingleDoc('h-id-front', 'husband', trackingCode, 'hIdFront'),
      hIdBack: await uploadSingleDoc('h-id-back', 'husband', trackingCode, 'hIdBack'),
      hMedicalDoc: await uploadSingleDoc('h-medical-doc', 'husband_medical', trackingCode, 'hMedicalDoc'),
      hSocialDoc: await uploadSingleDoc('h-social-doc', 'husband_social', trackingCode, 'hSocialDoc'),
      wIdFront: await uploadSingleDoc('w-id-front', 'wife', trackingCode, 'wIdFront'),
      wIdBack: await uploadSingleDoc('w-id-back', 'wife', trackingCode, 'wIdBack'),
      wMedicalDoc: await uploadSingleDoc('w-medical-doc', 'wife_medical', trackingCode, 'wMedicalDoc'),
      wSocialDoc: await uploadSingleDoc('w-social-doc', 'wife_social', trackingCode, 'wSocialDoc'),
      mCertDoc: await uploadSingleDoc('m-cert-doc', 'marriage', trackingCode, 'mCertDoc'),
      mHealthDoc: await uploadSingleDoc('m-health-doc', 'marriage', trackingCode, 'mHealthDoc'),
      socialResearch: await uploadSingleDoc('doc-social-research', 'housing_docs', trackingCode, 'socialResearch'),
      insuranceH: await uploadSingleDoc('doc-insurance-h', 'housing_docs', trackingCode, 'insuranceH'),
      insuranceW: await uploadSingleDoc('doc-insurance-w', 'housing_docs', trackingCode, 'insuranceW'),
      lease: await uploadSingleDoc('doc-lease', 'housing_docs', trackingCode, 'lease'),
      schoolEnroll: await uploadSingleDoc('doc-school-enroll', 'housing_docs', trackingCode, 'schoolEnroll')
    };

    const uploadedDocs = {};
    Object.entries(rawDocs).forEach(([key, val]) => {
      if (hasDocValue(val)) {
        uploadedDocs[key] = val;
      }
    });

    if (uploadedDocs.hIdFront) uploadedDocs.husband_id_front = uploadedDocs.hIdFront;
    if (uploadedDocs.hIdBack) uploadedDocs.husband_id_back = uploadedDocs.hIdBack;
    if (uploadedDocs.wIdFront) uploadedDocs.wife_id_front = uploadedDocs.wIdFront;
    if (uploadedDocs.wIdBack) uploadedDocs.wife_id_back = uploadedDocs.wIdBack;
    if (uploadedDocs.socialResearch) uploadedDocs.social_research = uploadedDocs.socialResearch;
    if (uploadedDocs.lease) uploadedDocs.housing_lease = uploadedDocs.lease;

    window.formData.documents = uploadedDocs;

    const currentActor = window.currentUser || JSON.parse(sessionStorage.getItem('hf_current_user') || 'null');
    const safeNum = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    const primaryFileName = computePrimaryApplicantName(husbandData, wifeData);

    const payload = {
      tracking_code: trackingCode,
      applicant_name: primaryFileName,
      intervention_type: window.formData.interventionType || '',
      governorate: husbandData.gov || '',
      center_city: husbandData.center || '',
      village_hamlet: finalVillage,
      street_details: husbandData.street || '',
      husband_data: husbandData && typeof husbandData === 'object' ? husbandData : {},
      wife_data: wifeData && typeof wifeData === 'object' ? wifeData : {},
      children_data: Array.isArray(window.formData.children) ? window.formData.children : [],
      marriage_data: window.formData.marriage && typeof window.formData.marriage === 'object' ? window.formData.marriage : {},
      expenses_data: expensesObj && typeof expensesObj === 'object' ? expensesObj : {},
      incomes_data: incomesObj && typeof incomesObj === 'object' ? incomesObj : {},
      housing_data: Object.assign(
        window.formData.housing && typeof window.formData.housing === 'object' ? window.formData.housing : {},
        {
          social_profile: socialProfile,
          visit_date: socialProfile.visitDate || new Date().toISOString().slice(0, 10)
        }
      ),
      documents_data: uploadedDocs,
      total_income: safeNum(totalInc),
      total_expenses: safeNum(totalExp),
      status: 'pending',
      source_type: currentActor ? `${currentActor.name || currentActor.email} (${currentActor.role || 'عضو'})` : 'مواطن (تسجيل مباشر)',
      created_by_email: currentActor ? currentActor.email : null,
      created_by_name: currentActor ? (currentActor.name || currentActor.email) : 'مواطن (تسجيل مباشر)',
      eligibility_verdict: (window.formData.housing && window.formData.housing.opinion) || 'قيد المراجعة'
    };

    const targetPhone = husbandData.whatsapp || husbandData.phone || wifeData.phone || '01000880156';
    const officialWhatsApp = (window.FOUNDATION_CONFIG && window.FOUNDATION_CONFIG.whatsappPhone) || '01000880156';
    const waMsg =
      `مؤسسة الحافظ للتنمية والخدمات (واتساب رسمي: ${officialWhatsApp})\n` +
      `تم تسجيل طلب المساعدة بنجاح.\n` +
      `الاسم: ${primaryFileName}\n` +
      `رقم الطلب: ${trackingCode}\n` +
      `الحالة: قيد المراجعة\n` +
      `يمكنكم متابعة حالة الطلب برقم المتابعة.`;

    if (window.supabaseClient) {
      const cleanPayload = { ...payload };
      if (!cleanPayload.intervention_type && cleanPayload.aid_type) {
        cleanPayload.intervention_type = cleanPayload.aid_type;
      }
      delete cleanPayload.aid_type;

      if (!cleanPayload.created_by_email && typeof cleanPayload.created_by === 'string' && cleanPayload.created_by.includes('@')) {
        cleanPayload.created_by_email = cleanPayload.created_by;
      }
      if (!cleanPayload.created_by_name && typeof cleanPayload.created_by === 'string' && !cleanPayload.created_by.includes('@')) {
        cleanPayload.created_by_name = cleanPayload.created_by;
      }
      delete cleanPayload.created_by;

      let attemptPayload = { ...cleanPayload };
      let res = null;
      for (let i = 0; i < 6; i++) {
        res = await window.supabaseClient.from('families').insert([attemptPayload]);
        if (!res.error) break;

        const match = String(res.error.message || '').match(/Could not find the '([^']+)' column/i);
        if (match && match[1] && Object.prototype.hasOwnProperty.call(attemptPayload, match[1])) {
          delete attemptPayload[match[1]];
          continue;
        }
        break;
      }

      if (res && res.error) {
        console.error('families insert failed:', res.error, attemptPayload);
        return showStepError(
          `حدث خطأ أثناء حفظ البيانات في قاعدة البيانات: ${res.error.message}` +
          (res.error.details ? ` | التفاصيل: ${res.error.details}` : '') +
          (res.error.hint ? ` | تلميح: ${res.error.hint}` : '')
        );
      }

      const localCases = JSON.parse(localStorage.getItem('hf_local_families') || '[]');
      localCases.unshift({ ...attemptPayload, id: 'LOCAL-' + Date.now(), created_at: new Date().toISOString() });
      localStorage.setItem('hf_local_families', JSON.stringify(localCases));

      window.WIZARD_ATTACHMENTS_CACHE = {};
      window._wizardDraftFolder = null;

       window.currentStep = 1;
      if (typeof window.showSection === 'function') window.showSection('home');
      else location.reload();
    } else {
      showStepError('تعذر الاتصال بقاعدة البيانات حالياً، يرجى تحديث الصفحة والمحاولة مرة أخرى.');
    }
  }; // <-- هذا السطر الناقص لإغلاق دالة submitFullWizardApplication
})();

