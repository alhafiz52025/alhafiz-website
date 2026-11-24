// projects-and-installments.js (الجزء 1 من 5)
// تحديثات المشروعات الصغيرة، Google Drive، السماح بالتعديل العام، وأقساط الـ 20 شهراً
(function() {
  const PROJECT_INTERVENTION_LABEL = 'مشروعات صغيرة وتمكين اقتصادي (قرض حسن)';

  // 1. إضافة خيار المشروعات الصغيرة لقائمة المساعدات
  function ensureProjectAidType() {
    if (!Array.isArray(window.AID_TYPES)) window.AID_TYPES = [];
    const exists = window.AID_TYPES.some(t => String(t).includes('مشروع') || String(t).includes('تمكين اقتصادي'));
    if (!exists) window.AID_TYPES.push(PROJECT_INTERVENTION_LABEL);
  }
  ensureProjectAidType();
  window.addEventListener('DOMContentLoaded', ensureProjectAidType);

  function isSmallProjectSelected(val) {
    const s = String(val || '');
    return s.includes('مشروع') || s.includes('تمكين اقتصادي') || s.includes('قرض حسن');
  }

  // 2. دالة رفع المرفقات المضغوطة وملفات PDF إلى Google Drive (15 جيجابايت) بالمسار المطلوب
  window.uploadFileToDriveOrStorage = async function(file, meta = {}) {
    const driveUrl = window.GOOGLE_DRIVE_WEB_APP_URL;
    if (driveUrl && file) {
      try {
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || '').split(',') || '');
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });

        const payload = {
          year: meta.year || new Date().getFullYear().toString(),
          village: meta.village || 'غير_محدد',
          submissionType: meta.submissionType || 'عام',
          trackingCode: meta.trackingCode || ('TRK-' + Date.now()),
          fileName: file.name || ('doc_' + Date.now()),
          mimeType: file.type || 'application/octet-stream',
          fileBase64: base64Data
        };

        const res = await fetch(driveUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json && json.status === 'success' && json.fileUrl) {
          return {
            name: file.name,
            fileName: file.name,
            size: file.size,
            mimeType: file.type || '',
            url: json.fileUrl,
            publicUrl: json.fileUrl,
            folderUrl: json.folderUrl || '',
            fileId: json.fileId || '',
            storageProvider: 'google_drive',
            uploaded: true
          };
        }
      } catch (driveErr) {
        console.warn('Google Drive fallback to Supabase:', driveErr);
      }
    }

    // احتياطي تلقائي لـ Supabase في حال تعذر الاتصال بـ Drive
    if (window.supabaseClient && window.supabaseClient.storage && file) {
      const safeName = String(file.name || 'file').replace(/[^\w.-]/g, '_');
      const path = `${meta.trackingCode || 'DRAFT'}/${meta.folder || 'docs'}/${Date.now()}_${safeName}`;
      const { error } = await window.supabaseClient.storage.from('foundation-docs').upload(path, file, { upsert: true });
      if (!error) {
        const { data: pubData } = window.supabaseClient.storage.from('foundation-docs').getPublicUrl(path);
        return {
          name: file.name,
          fileName: file.name,
          size: file.size,
          mimeType: file.type || '',
          path,
          url: pubData?.publicUrl || '',
          publicUrl: pubData?.publicUrl || '',
          storageProvider: 'supabase',
          uploaded: true
        };
      }
    }
    return { name: file?.name || 'file', uploaded: false, uploadError: 'تعذر رفع الملف' };
  };
  // 3. تحديث الاستعلام الفوري ليدعم الرقم الأولي والنهائي للمشروعات
  const origTrackApplication = window.trackApplication;
  window.trackApplication = async function() {
    const q = (document.getElementById('track-input')?.value || '').trim().toUpperCase();
    const resBox = document.getElementById('track-result');
    if (!q || !resBox) return;

    if (q.startsWith('HF-') && window.supabaseClient) {
      resBox.innerHTML = '<p style="font-size:13px;">جاري البحث...</p>';
      const { data } = await window.supabaseClient
        .from('families')
        .select('*')
        .or(`tracking_code.eq.${q},initial_tracking_code.eq.${q}`)
        .maybeSingle();

      if (data) {
        const pData = data.project_data || {};
        const isProject = isSmallProjectSelected(data.intervention_type) || Boolean(pData.projectType);
        if (isProject && data.initial_tracking_code === q && data.tracking_code !== q) {
          if (data.is_completion_active) {
            resBox.innerHTML = `<div style="background:#fffbeb; border:1px solid #f59e0b; padding:16px; border-radius:12px;"><strong>رقم الطلب الأولي:</strong> ${window.escapeHtml(q)}<br><strong>الحالة:</strong> ✅ تمت الموافقة المبدئية — متاح الآن استكمال أوراق المشروع.<br><button type="button" onclick="showSection('apply')" class="action-btn" style="margin-top:8px; font-size:12px;">+ الانتقال لاستكمال أوراق المشروع</button></div>`;
          } else if (pData.completionSubmitted) {
            resBox.innerHTML = `<div style="background:#eff6ff; border:1px solid #bfdbfe; padding:16px; border-radius:12px;"><strong>تنبيه:</strong> تم استكمال أوراق هذا الطلب مسبقاً وأصبح الرقم الأولي غير نشط.<br><strong>رقم المتابعة الجديد:</strong> <span style="color:#1d4ed8; font-weight:800;">${window.escapeHtml(data.tracking_code)}</span></div>`;
          } else {
            resBox.innerHTML = `<div style="background:#f8fafc; border:1px solid #cbd5e1; padding:16px; border-radius:12px;"><strong>رقم الطلب الأولي:</strong> ${window.escapeHtml(q)}<br><strong>الحالة:</strong> 🔍 طلب المشروع المبدئي قيد المراجعة الإدارية.</div>`;
          }
          return;
        }
      }
    }
    if (typeof origTrackApplication === 'function') return origTrackApplication.apply(this, arguments);
  };

  // 4. تمديد الخطوة الأولى في المعالج لدعم المشروعات الصغيرة والخانة الجانبية ووضع التعديل
  const origRenderWizardStep = window.renderWizardStep;
  window.renderWizardStep = function() {
    ensureProjectAidType();
    if (typeof origRenderWizardStep === 'function') origRenderWizardStep.apply(this, arguments);

    const container = document.getElementById('wizard-container');
    if (!container) return;

    if (window.ACTIVE_EDIT_CASE && window.currentStep !== 1) {
      const banner = document.createElement('div');
      banner.style.cssText = 'background:#eff6ff; border:1px solid #3b82f6; color:#1e3a8a; padding:10px 14px; border-radius:8px; margin-bottom:12px; font-size:13px; font-weight:700;';
      banner.innerHTML = `✏️ وضع التعديل المفتوح بواسطة الإدارة — كود الحالة: <strong>${window.escapeHtml(window.ACTIVE_EDIT_CASE.tracking_code)}</strong>`;
      container.prepend(banner);
    }

    if (window.currentStep === 1) {
      const sel = document.getElementById('intervention-type');
      if (sel) {
        sel.innerHTML = (window.AID_TYPES || [])
          .map(a => `<option value="${window.escapeHtml(a)}" ${window.formData.interventionType === a ? 'selected' : ''}>${window.escapeHtml(a)}</option>`)
          .join('');
        sel.onchange = function() { window.formData.interventionType = this.value; window.renderWizardStep(); };
      }

      const isProj = isSmallProjectSelected(window.formData.interventionType);
      const projectTypesOpts = (window.SMALL_PROJECT_TYPES || [])
        .map(p => `<option value="${window.escapeHtml(p)}">${window.escapeHtml(p)}</option>`)
        .join('');

      const extraBox = document.createElement('div');
      extraBox.style.marginTop = '16px';

      if (isProj) {
        const nextBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent.includes('التالي'));
        if (nextBtn) nextBtn.style.display = 'none';

        extraBox.innerHTML = `
          <div style="display:grid; grid-template-columns: 1.3fr 1fr; gap:16px; align-items:start;">
            <div style="background:#f0fdf4; border:1px solid #86efac; padding:16px; border-radius:12px;">
              <h4 style="margin:0 0 8px; color:#065f46;">🚀 أولاً: التقديم المبدئي السريع لمشروع صغير (قرض حسن)</h4>
              <p style="font-size:12px; color:#166534; margin:0 0 10px;">نكتفي في البداية بالاسم، الهاتف، القرية، نوع المشروع، وصورة البطاقة لإصدار رقم الطلب الأولي.</p>
              <div class="grid-2">
                <div><label style="font-size:12px; font-weight:700;">الاسم ثلاثي *</label><input id="prj-init-name" placeholder="الاسم بالكامل *"></div>
                <div><label style="font-size:12px; font-weight:700;">رقم الهاتف (واتساب) *</label><input id="prj-init-phone" maxlength="11" placeholder="01xxxxxxxxx *"></div>
              </div>
              <div class="grid-2" style="margin-top:8px;">
                <div><label style="font-size:12px; font-weight:700;">القرية / العزبة *</label><input id="prj-init-village" placeholder="اسم القرية *"></div>
                <div><label style="font-size:12px; font-weight:700;">صورة البطاقة الشخصية *</label><input type="file" id="prj-init-id-card" accept="image/*,.pdf"></div>
              </div>
              <div style="margin-top:8px;">
                <label style="font-size:12px; font-weight:700;">المشروع المطلوب (من القائمة الكاملة) *</label>
                <select id="prj-init-type" onchange="document.getElementById('prj-init-custom-type').classList.toggle('hidden', this.value !== 'إضافة مشروع غير موجود في القائمة')">
                  <option value="">-- اختر نوع المشروع بالتفصيل --</option>
                  ${projectTypesOpts}
                </select>
                <input id="prj-init-custom-type" class="hidden" placeholder="اكتب اسم المشروع الجديد المطلوب بالتفصيل *" style="margin-top:6px;">
              </div>
              <button type="button" onclick="submitInitialSmallProject()" class="action-btn" style="width:100%; margin-top:12px; background:#15803d;">✅ تسجيل الطلب المبدئي وإصدار الرقم الأولي</button>
            </div>

            <div style="background:#fffbeb; border:2px solid #f59e0b; padding:16px; border-radius:12px;">
              <h4 style="margin:0 0 8px; color:#92400e;">📂 استكمال أوراق مشروع مقبول مبدئياً</h4>
              <div style="background:#fff; border:1px dashed #f59e0b; padding:10px; border-radius:8px; font-size:12px; line-height:1.7; margin-bottom:10px; color:#78350f;">
                <strong>طريقة الاستكمال:</strong> أدخل <strong>رقم الطلب الأولي</strong> المرسل إليك عند القبول لفتح باقي الأقسام ورفع الملفات. بعد الإرسال يصبح الرقم الأولي غير نشط ويصدر رقم متابعة جديد.
              </div>
              <input id="prj-completion-code-input" placeholder="مثال: HF-INIT-2026-10001" style="text-transform:uppercase;">
              <button type="button" onclick="verifyAndOpenProjectCompletion()" class="action-btn" style="width:100%; background:#b45309; margin-top:6px;">🔓 فتح استكمال بيانات وملفات المشروع</button>
            </div>
          </div>`;
      } else {
        extraBox.innerHTML = `
          <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:12px; border-radius:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <span style="font-size:12px; color:#334155;"><strong>هل فتحت لك الإدارة صلاحية التعديل لطلب مسجل؟</strong></span>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              <input id="general-edit-code-input" placeholder="أدخل كود الطلب (HF-...)" style="margin:0; width:190px; padding:5px 8px; font-size:12px;">
              <button type="button" onclick="openAllowedEditForAnyCase()" class="nav-btn btn-gold" style="padding:5px 10px; font-size:12px;">✏️ فتح التعديل</button>
            </div>
          </div>`;
      }
      container.appendChild(extraBox);
    }
  };
  // 5. حفظ التقديم المبدئي للمشروع الصغير (المرحلة الأولى)
  window.submitInitialSmallProject = async function() {
    const name = (document.getElementById('prj-init-name')?.value || '').trim();
    const phone = (document.getElementById('prj-init-phone')?.value || '').trim();
    const village = (document.getElementById('prj-init-village')?.value || '').trim();
    let projectType = (document.getElementById('prj-init-type')?.value || '').trim();
    if (projectType === 'إضافة مشروع غير موجود في القائمة') {
      projectType = (document.getElementById('prj-init-custom-type')?.value || '').trim();
    }
    const idFile = document.getElementById('prj-init-id-card')?.files?.item(0);

    if (!name || !/^01\d{8}$/.test(phone) || !village || !projectType || !idFile) {
      return alert('⚠️ يرجى إدخال الاسم، رقم الهاتف الصحيح (11 رقماً)، القرية، نوع المشروع، وإرفاق صورة البطاقة.');
    }

    const initialCode = 'HF-INIT-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
    const uploadedId = await window.uploadFileToDriveOrStorage(idFile, {
      year: new Date().getFullYear().toString(),
      village,
      submissionType: 'مشروعات_صغيرة_مبدئي',
      trackingCode: initialCode,
      folder: 'initial_id'
    });

    const payload = {
      tracking_code: initialCode,
      initial_tracking_code: initialCode,
      is_completion_active: false,
      allow_edit: false,
      applicant_name: name,
      intervention_type: PROJECT_INTERVENTION_LABEL,
      governorate: 'بني سويف',
      center_city: 'إهناسيا',
      village_hamlet: village,
      husband_data: { name1: name, phone, whatsapp: phone },
      documents_data: { initialIdCard: uploadedId, hIdFront: uploadedId },
      project_data: { stage: 'initial', projectType, initialCode },
      status: 'pending',
      eligibility_verdict: 'طلب مشروع مبدئي - قيد المراجعة'
    };

    if (!window.supabaseClient) return alert('❌ تعذر الاتصال بقاعدة البيانات.');
    const { error } = await window.supabaseClient.from('families').insert([payload]);
    if (error) return alert('❌ خطأ أثناء حفظ الطلب المبدئي: ' + error.message);

    alert(`✅ تم تسجيل طلب المشروع المبدئي بنجاح!\nرقم الطلب الأولي: ${initialCode}\nعند الموافقة ستصلك رسالة لاستكمال باقي الأوراق.`);
    if (typeof window.showSection === 'function') window.showSection('home');
  };

  // 6. التحقق من رقم الطلب الأولي وفتح نموذج الاستكمال الكامل
  window.verifyAndOpenProjectCompletion = async function() {
    const code = (document.getElementById('prj-completion-code-input')?.value || '').trim().toUpperCase();
    if (!code) return alert('⚠️ أدخل رقم الطلب الأولي المرسل إليك.');
    if (!window.supabaseClient) return;

    const { data, error } = await window.supabaseClient
      .from('families')
      .select('*')
      .or(`initial_tracking_code.eq.${code},tracking_code.eq.${code}`)
      .maybeSingle();

    if (error || !data) return alert('❌ رقم الطلب غير صحيح أو غير موجود في النظام.');

    const pData = data.project_data || {};
    if (!data.is_completion_active && !data.allow_edit) {
      if (pData.completionSubmitted) {
        return alert(`⚠️ تم استكمال أوراق هذا الطلب مسبقاً وأصبح الرقم الأولي (${code}) غير نشط.\nرقم المتابعة الجديد الخاص بك: ${data.tracking_code}\nلأي تعديل يرجى مراجعة الإدارة.`);
      }
      return alert('⏳ هذا الطلب لم يتم تفعيل استكمال الأوراق له بعد، أو هو قيد المراجعة المبدئية.');
    }

    renderProjectCompletionFullForm(data);
  };

  function renderProjectCompletionFullForm(caseRecord) {
    const container = document.getElementById('wizard-container');
    if (!container) return;
    const pData = caseRecord.project_data || {};
    const projectOpts = (window.SMALL_PROJECT_TYPES || [])
      .map(p => `<option value="${window.escapeHtml(p)}" ${pData.projectType === p ? 'selected' : ''}>${window.escapeHtml(p)}</option>`)
      .join('');

    container.innerHTML = `
      <div style="background:#fff; border:2px solid #047857; border-radius:14px; padding:18px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; border-bottom:1px solid #cbd5e1; padding-bottom:10px; margin-bottom:14px;">
          <div>
            <h4 style="margin:0; color:#065f46;">📋 استكمال البيانات الكاملة ومرفقات المشروع الصغير</h4>
            <small>المستفيد: <strong>${window.escapeHtml(caseRecord.applicant_name || '')}</strong> | الرقم الأولي: <strong>${window.escapeHtml(caseRecord.initial_tracking_code || caseRecord.tracking_code)}</strong></small>
          </div>
          <button type="button" onclick="window.renderWizardStep()" class="nav-btn">رجوع</button>
        </div>

        <div class="grid-2">
          <div>
            <label style="font-weight:700;">نوع المشروع المطلوب (القائمة الكاملة) *</label>
            <select id="cmp-project-type">${projectOpts}</select>
          </div>
          <div>
            <label style="font-weight:700;">هل يوجد مكان أم سريح *</label>
            <select id="cmp-location-type">
              <option value="مقر ثابت (محل / ورشة ملك)" ${pData.locationType === 'مقر ثابت (محل / ورشة ملك)' ? 'selected' : ''}>مقر ثابت (محل / ورشة ملك)</option>
              <option value="مقر ثابت (محل / ورشة إيجار)" ${pData.locationType === 'مقر ثابت (محل / ورشة إيجار)' ? 'selected' : ''}>مقر ثابت (محل / ورشة إيجار)</option>
              <option value="نشاط داخل المنزل" ${pData.locationType === 'نشاط داخل المنزل' ? 'selected' : ''}>نشاط داخل المنزل</option>
              <option value="سريح / عربة متجولة بدون مقر ثابت" ${pData.locationType === 'سريح / عربة متجولة بدون مقر ثابت' ? 'selected' : ''}>سريح / عربة متجولة بدون مقر ثابت</option>
            </select>
          </div>
        </div>

        <div class="grid-2" style="margin-top:8px;">
          <div>
            <label style="font-weight:700;">مشروع جديد أم قديم *</label>
            <select id="cmp-project-age">
              <option value="مشروع جديد (تأسيس من البداية)" ${pData.projectAge === 'مشروع جديد (تأسيس من البداية)' ? 'selected' : ''}>مشروع جديد (تأسيس من البداية)</option>
              <option value="مشروع قديم / قائم (تطوير وتوسعة)" ${pData.projectAge === 'مشروع قديم / قائم (تطوير وتوسعة)' ? 'selected' : ''}>مشروع قديم / قائم (تطوير وتوسعة)</option>
            </select>
          </div>
          <div>
            <label style="font-weight:700;">التكلفة الإجمالية للمشروع (جنيه) *</label>
            <input type="number" min="500" id="cmp-total-cost" value="${window.escapeHtml(pData.totalCost || '')}" placeholder="مثال: 20000">
          </div>
        </div>

        <div class="grid-3" style="margin-top:8px;">
          <div><label style="font-weight:700;">العاملين بالمشروع *</label><input type="number" min="1" id="cmp-workers-count" value="${window.escapeHtml(pData.workersCount || '1')}"></div>
          <div><label style="font-weight:700;">العائد الشهري من المشروع (جنيه) *</label><input type="number" min="0" id="cmp-expected-return" value="${window.escapeHtml(pData.expectedReturn || '')}" placeholder="مثال: 4500"></div>
          <div><label style="font-weight:700;">الرقم القومي (14 رقم) *</label><input id="cmp-nid" maxlength="14" value="${window.escapeHtml(caseRecord.husband_data?.nid || '')}" placeholder="14 رقماً"></div>
        </div>

          <label style="font-weight:700;">وصف تفصيلي للمشروع وخطة التشغيل والضمانات *</label>
          <textarea id="cmp-description" rows="2" placeholder="اشرح المعدات أو البضاعة المطلوبة...">${window.escapeHtml(pData.description || '')}</textarea>
        </div>

        <h5 style="margin:12px 0 8px; color:#065f46; border-top:1px dashed #cbd5e1; padding-top:8px;">📎 المرفقات المطلوبة (تُضغط وتُرفع تلقائياً إلى Google Drive)</h5>
        <div class="grid-2">
          <div><label style="font-weight:700;">1. دراسة الجدوى (PDF) *</label><input type="file" id="cmp-doc-feasibility" accept=".pdf,image/*"></div>
          <div><label style="font-weight:700;">2. صورة مكان المشروع / المعدات *</label><input type="file" id="cmp-doc-place-photo" accept="image/*,.pdf"></div>
          <div><label style="font-weight:700;">3. فيش جنائي (صحيفة الحالة الجنائية) *</label><input type="file" id="cmp-doc-criminal-record" accept="image/*,.pdf"></div>
          <div><label style="font-weight:700;">4. نموذج البحث الميداني *</label><input type="file" id="cmp-doc-field-research" accept="image/*,.pdf"></div>
          <div><label style="font-weight:700;">5. أوراق ضامنة أخرى (إيصال مرافق / بطاقة ضامن)</label><input type="file" id="cmp-doc-other-docs" accept="image/*,.pdf"></div>
        </div>

        <button type="button" id="cmp-submit-btn" onclick="submitProjectCompletionForm('${window.escapeHtml(caseRecord.id)}')" class="action-btn" style="width:100%; margin-top:14px; background:#15803d;">✅ اعتماد الإرسال النهائي وإصدار رقم المتابعة الجديد</button>
      </div>`;
  }
  // 7. حفظ استكمال المشروع وإغلاق الرقم الأولي وإصدار رقم متابعة جديد
  window.submitProjectCompletionForm = async function(caseId) {
    const btn = document.getElementById('cmp-submit-btn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ جارٍ رفع الملفات إلى Google Drive وإصدار رقم المتابعة...'; }

    try {
      const { data: existingCase } = await window.supabaseClient.from('families').select('*').eq('id', caseId).single();
      if (!existingCase) throw new Error('تعذر العثور على سجل الحالة');

      const projectType = document.getElementById('cmp-project-type')?.value || '';
      const locationType = document.getElementById('cmp-location-type')?.value || '';
      const projectAge = document.getElementById('cmp-project-age')?.value || '';
      const totalCost = parseFloat(document.getElementById('cmp-total-cost')?.value || '0');
      const workersCount = parseInt(document.getElementById('cmp-workers-count')?.value || '1', 10);
      const expectedReturn = parseFloat(document.getElementById('cmp-expected-return')?.value || '0');
      const nid = (document.getElementById('cmp-nid')?.value || '').trim();
      const description = (document.getElementById('cmp-description')?.value || '').trim();

      if (!totalCost || totalCost <= 0 || !/^\d{14}$/.test(nid)) {
        if (btn) { btn.disabled = false; btn.textContent = '✅ اعتماد الإرسال النهائي وإصدار رقم المتابعة الجديد'; }
        return alert('⚠️ يرجى إدخال التكلفة الإجمالية للمشروع والرقم القومي (14 رقماً).');
      }

      const isAlreadyCompleted = Boolean(existingCase.project_data?.completionSubmitted);
      const newTrackingCode = isAlreadyCompleted
        ? existingCase.tracking_code
        : ('HF-PRJ-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000));

      const uploadMetaBase = {
        year: new Date().getFullYear().toString(),
        village: existingCase.village_hamlet || 'غير_محدد',
        submissionType: 'مشروعات_صغيرة_مكتمل',
        trackingCode: newTrackingCode
      };

      const prevDocs = existingCase.documents_data || {};
      const fFeasibility = document.getElementById('cmp-doc-feasibility')?.files?.[0];
      const fPlace = document.getElementById('cmp-doc-place-photo')?.files?.[0];
      const fCriminal = document.getElementById('cmp-doc-criminal-record')?.files?.[0];
      const fResearch = document.getElementById('cmp-doc-field-research')?.files?.[0];
      const fOther = document.getElementById('cmp-doc-other-docs')?.files?.[0];


      if (!isAlreadyCompleted && (!fFeasibility || !fPlace || !fCriminal || !fResearch)) {
        if (btn) { btn.disabled = false; btn.textContent = '✅ اعتماد الإرسال النهائي وإصدار رقم المتابعة الجديد'; }
        return alert('⚠️ يرجى إرفاق الملفات الإلزامية الأربعة (دراسة الجدوى PDF، صورة مكان المشروع، الفيش الجنائي، ونموذج البحث الميداني).');
      }

      const updatedDocs = { ...prevDocs };
      if (fFeasibility) updatedDocs.feasibilityStudy = await window.uploadFileToDriveOrStorage(fFeasibility, { ...uploadMetaBase, folder: 'feasibility' });
      if (fPlace) updatedDocs.projectPlacePhoto = await window.uploadFileToDriveOrStorage(fPlace, { ...uploadMetaBase, folder: 'place_photo' });
      if (fCriminal) updatedDocs.criminalRecord = await window.uploadFileToDriveOrStorage(fCriminal, { ...uploadMetaBase, folder: 'criminal_record' });
      if (fResearch) {
        const resDoc = await window.uploadFileToDriveOrStorage(fResearch, { ...uploadMetaBase, folder: 'field_research' });
        updatedDocs.fieldResearch = resDoc;
        updatedDocs.social_research = resDoc;
      }
      if (fOther) updatedDocs.guarantorAndOtherDocs = await window.uploadFileToDriveOrStorage(fOther, { ...uploadMetaBase, folder: 'other_docs' });

      const updatedHusband = Object.assign({}, existingCase.husband_data || {}, { nid });
      const updatedProjectData = Object.assign({}, existingCase.project_data || {}, {
        stage: 'completed', completionSubmitted: true, completedAt: new Date().toISOString(),
        projectType, locationType, projectAge, totalCost, workersCount, expectedReturn, description
      });

      const { error } = await window.supabaseClient
        .from('families')
        .update({
          tracking_code: newTrackingCode,
          is_completion_active: false,
          allow_edit: false,
          husband_data: updatedHusband,
          documents_data: updatedDocs,
          project_data: updatedProjectData,
          eligibility_verdict: 'مكتمل الأوراق - قيد الاعتماد النهائي'
        })
        .eq('id', caseId);

      if (error) throw error;

      alert(`✅ تم استكمال ورفع أوراق المشروع بنجاح!\n• أصبح الرقم الأولي (${existingCase.initial_tracking_code}) غير نشط.\n• رقم المتابعة الجديد الخاص بك: ${newTrackingCode}`);
      if (typeof window.showSection === 'function') window.showSection('home');
    } catch (err) {
      if (btn) { btn.disabled = false; btn.textContent = '✅ اعتماد الإرسال النهائي وإصدار رقم المتابعة الجديد'; }
      alert('❌ حدث خطأ أثناء حفظ البيانات: ' + (err.message || err));
    }
  };

  // 8. فتح التعديل لأي حالة عامة إذا سمح الأدمن بذلك (allow_edit = true)
  window.openAllowedEditForAnyCase = async function() {
    const code = (document.getElementById('general-edit-code-input')?.value || '').trim().toUpperCase();
    if (!code) return alert('⚠️ أدخل كود الطلب أولاً.');
    if (!window.supabaseClient) return;

    const { data } = await window.supabaseClient
      .from('families')
      .select('*')
      .or(`tracking_code.eq.${code},initial_tracking_code.eq.${code}`)
      .maybeSingle();

    if (!data) return alert('❌ لم يتم العثور على طلب بهذا الكود.');
    if (!data.allow_edit) return alert('⛔ التعديل مغلق حالياً لهذه الحالة. يرجى التواصل مع الأدمن لتفعيل زر "السماح بالتعديل".');

    if (isSmallProjectSelected(data.intervention_type)) return renderProjectCompletionFullForm(data);

    window.ACTIVE_EDIT_CASE = data;
    window.formData.interventionType = data.intervention_type || window.formData.interventionType;
    window.formData.husband = Object.assign(window.formData.husband || {}, data.husband_data || {});
    window.formData.wife = Object.assign(window.formData.wife || {}, data.wife_data || {});
    window.formData.children = Array.isArray(data.children_data) ? data.children_data : [];
    window.formData.expenses = Object.assign(window.formData.expenses || {}, data.expenses_data || {});
    window.formData.incomes = Object.assign(window.formData.incomes || {}, data.incomes_data || {});
    window.formData.housing = Object.assign(window.formData.housing || {}, data.housing_data || {});
    window.formData.documents = Object.assign({}, data.documents_data || {});
    window.currentStep = 2;
    window.renderWizardStep();
  };

  // 9. حقن زر "السماح بالتعديل" العام للأدمن لكل الحالات + أزرار المشروعات والأقساط في الجدول
  const origFilterAndRenderCasesTable = window.filterAndRenderCasesTable;
  window.filterAndRenderCasesTable = function() {
    if (typeof origFilterAndRenderCasesTable === 'function') origFilterAndRenderCasesTable.apply(this, arguments);
    const wrap = document.getElementById('admin-cases-table-wrap');
    if (!wrap) return;

    wrap.querySelectorAll('tbody tr').forEach(tr => {
      const chk = tr.querySelector('.chk-case-row');
      const actionsCell = tr.querySelector('td:last-child');
      if (!chk || !actionsCell) return;
      const caseObj = (window.ALL_ADMIN_CASES || []).find(c => String(c.id) === String(chk.value));
      if (!caseObj) return;

      const isEditAllowed = Boolean(caseObj.allow_edit);
      const editToggleBtn = document.createElement('button');
      editToggleBtn.type = 'button';
      editToggleBtn.className = 'nav-btn';
      editToggleBtn.style.cssText = `background:${isEditAllowed ? '#15803d' : '#475569'}; color:#fff; padding:3px 6px; font-size:11px;`;
      editToggleBtn.textContent = isEditAllowed ? '🔓 التعديل مفتوح' : '✏️ السماح بالتعديل';
      editToggleBtn.onclick = () => window.adminToggleAllowEditCase(caseObj.id);
      actionsCell.appendChild(editToggleBtn);

      if (isSmallProjectSelected(caseObj.intervention_type)) {
        if (!caseObj.project_data?.completionSubmitted) {
          const compBtn = document.createElement('button');
          compBtn.type = 'button';
          compBtn.className = 'nav-btn';
          compBtn.style.cssText = `background:${caseObj.is_completion_active ? '#0284c7' : '#d97706'}; color:#fff; padding:3px 6px; font-size:11px;`;
          compBtn.textContent = caseObj.is_completion_active ? '✅ الاستكمال مفعل' : '📂 تفعيل استكمال المشروع';
          compBtn.onclick = () => window.adminActivateProjectCompletion(caseObj.id);
          actionsCell.appendChild(compBtn);
        }

        const instBtn = document.createElement('button');
        instBtn.type = 'button';
        instBtn.className = 'nav-btn';
        instBtn.style.cssText = 'background:#7e22ce; color:#fff; padding:3px 6px; font-size:11px;';
        instBtn.textContent = '💳 الأقساط (20 شهر)';
        instBtn.onclick = () => window.openProjectInstallmentsModal(caseObj.id);
        actionsCell.appendChild(instBtn);
      }
    });
  };
  // 10. دوال الأدمن: السماح بالتعديل العام + تفعيل استكمال المشروع المبدئي
  window.adminToggleAllowEditCase = async function(caseId) {
    const item = (window.ALL_ADMIN_CASES || []).find(c => String(c.id) === String(caseId));
    if (!item || !window.supabaseClient) return;
    const nextVal = !Boolean(item.allow_edit);

    const { error } = await window.supabaseClient.from('families').update({ allow_edit: nextVal }).eq('id', caseId);
    if (error) return alert('❌ تعذر تحديث صلاحية التعديل: ' + error.message);
    item.allow_edit = nextVal;
    window.filterAndRenderCasesTable();

    if (nextVal) {
      const phone = item.husband_data?.whatsapp || item.husband_data?.phone || item.wife_data?.phone || '';
      const code = item.initial_tracking_code || item.tracking_code;
      const msg = `مؤسسة الحافظ للتنمية والخدمات\nمرحباً أ/ ${item.applicant_name || 'المستفيد'}\nتم فتح صلاحية التعديل واستكمال المرفقات لطلبكم رقم (${code}).\nيرجى الدخول إلى الموقع وإدخال رقم الطلب لاستكمال البيانات أو تعديلها.`;
      if (phone && confirm('✅ تم فتح التعديل للحالة.\nهل تريد إرسال رسالة واتساب فورية للمستفيد لإبلاغه؟')) {
        window.triggerInstantWhatsApp(phone, msg);
      }
    }
  };

  window.adminActivateProjectCompletion = async function(caseId) {
    const item = (window.ALL_ADMIN_CASES || []).find(c => String(c.id) === String(caseId));
    if (!item || !window.supabaseClient) return;

    const { error } = await window.supabaseClient.from('families').update({ is_completion_active: true, status: 'approved' }).eq('id', caseId);
    if (error) return alert('❌ تعذر التفعيل: ' + error.message);
    item.is_completion_active = true;
    item.status = 'approved';
    window.filterAndRenderCasesTable();

    const initCode = item.initial_tracking_code || item.tracking_code;
    const phone = item.husband_data?.whatsapp || item.husband_data?.phone || '';
    const msg =
      `مؤسسة الحافظ للتنمية والخدمات\nمبروك أ/ ${item.applicant_name || 'صاحب الطلب'}، تمت الموافقة المبدئية على طلب المشروع.\n` +
      `رقم الطلب الأولي: ${initCode}\nطريقة استكمال الأوراق:\n` +
      `1. ادخل على الموقع واختر (+ طلب مساعدة) ثم (مشروعات صغيرة).\n` +
      `2. أدخل رقم الطلب (${initCode}) في الخانة الجانبية لاستكمال البيانات ورفع دراسة الجدوى PDF والفيش الجنائي وصورة المكان والبحث الميداني.`;
    if (phone) window.triggerInstantWhatsApp(phone, msg);
  };

  // 11. شاشة الأقساط المنبثقة (20 شهراً)
  window.openProjectInstallmentsModal = async function(familyId) {
    const pool = [...(window.ALL_ADMIN_CASES || []), ...(window.MEMBER_PORTAL_CASES || [])];
    const caseObj = pool.find(c => String(c.id) === String(familyId));
    if (!caseObj || !window.supabaseClient) return;

    let modal = document.getElementById('hf-installments-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'hf-installments-modal';
      modal.style.cssText = 'position:fixed; inset:0; background:rgba(15,23,42,0.75); z-index:10000; display:flex; align-items:center; justify-content:center; padding:14px;';
      document.body.appendChild(modal);
    }
    modal.classList.remove('hidden');
    modal.innerHTML = '<div style="background:#fff; padding:24px; border-radius:12px;">⏳ جاري تحميل جدول الأقساط...</div>';

    const { data: installments, error } = await window.supabaseClient
      .from('project_installments').select('*').eq('family_id', familyId).order('installment_number', { ascending: true });
    if (error) { modal.innerHTML = `<div style="background:#fff; padding:20px; border-radius:12px; color:#b91c1c;">❌ خطأ: ${window.escapeHtml(error.message)}</div>`; return; }

    const clientName = caseObj.applicant_name || caseObj.husband_data?.name1 || 'العميل';
    const clientPhone = caseObj.husband_data?.whatsapp || caseObj.husband_data?.phone || '';

    if (!installments || installments.length === 0) {
      modal.innerHTML = `
        <div style="background:#fff; color:#0f172a; max-width:520px; width:100%; border-radius:14px; padding:22px;">
          <h4 style="margin:0 0 10px; color:#064e3b;">📅 بدء جدولة أقساط القرض الحسن (20 شهراً)</h4>
          <p style="font-size:13px; color:#475569;">العميل: <strong>${window.escapeHtml(clientName)}</strong> | الكود: <strong>${window.escapeHtml(caseObj.tracking_code)}</strong><br>أدخل إجمالي القرض وتاريخ أول قسط يدوياً بعد إمضاء العقود:</p>
          <div class="grid-2">
            <div><label style="font-size:12px; font-weight:700;">إجمالي مبلغ القرض (جنيه) *</label><input type="number" id="inst-total-loan" value="${window.escapeHtml(caseObj.project_data?.totalCost || '')}"></div>
            <div><label style="font-size:12px; font-weight:700;">تاريخ استحقاق القسط الأول *</label><input type="date" id="inst-start-date" value="${new Date().toISOString().slice(0, 10)}"></div>
          </div>
          <div style="display:flex; gap:8px; margin-top:14px;">
            <button type="button" onclick="generate20Installments('${window.escapeHtml(familyId)}')" class="action-btn" style="background:#15803d;">✅ توليد 20 قسطاً</button>
            <button type="button" onclick="document.getElementById('hf-installments-modal').classList.add('hidden')" class="nav-btn">إغلاق</button>
          </div>
        </div>`;
      return;
    }
    const paidList = installments.filter(x => x.is_paid);
    const totalAmount = installments.reduce((s, x) => s + Number(x.amount || 0), 0);
    const paidAmount = paidList.reduce((s, x) => s + Number(x.amount || 0), 0);

    modal.innerHTML = `
      <div id="printable-installments-box" style="background:#fff; color:#0f172a; max-width:860px; width:100%; border-radius:14px; padding:20px; max-height:92vh; overflow-y:auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; border-bottom:2px solid #064e3b; padding-bottom:10px; margin-bottom:12px;">
          <div>
            <h3 style="margin:0; color:#064e3b;">💳 كشف أقساط القرض الحسن (20 شهراً)</h3>
            <div style="font-size:13px;"><strong>الاسم:</strong> ${window.escapeHtml(clientName)} | <strong>الكود:</strong> ${window.escapeHtml(caseObj.tracking_code)} | <strong>الهاتف:</strong> ${window.escapeHtml(clientPhone || '-')}</div>
          </div>
          <div class="no-print" style="display:flex; gap:6px;">
            <button type="button" onclick="printInstallmentsTableOnly()" class="nav-btn btn-gold">🖨️ طباعة</button>
            <button type="button" onclick="document.getElementById('hf-installments-modal').classList.add('hidden')" class="nav-btn" style="background:#dc2626; color:#fff;">✕ إغلاق</button>
          </div>
        </div>
        <div class="grid-3" style="text-align:center; margin-bottom:12px; font-size:12px;">
          <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:8px; border-radius:8px;"><strong>إجمالي القرض:</strong> ${totalAmount} ج.م</div>
          <div style="background:#ecfdf5; border:1px solid #a7f3d0; padding:8px; border-radius:8px; color:#065f46;"><strong>المسدد (${paidList.length}):</strong> ${paidAmount} ج.م</div>
          <div style="background:#fef2f2; border:1px solid #fecaca; padding:8px; border-radius:8px; color:#991b1b;"><strong>المتبقي (${20 - paidList.length}):</strong> ${totalAmount - paidAmount} ج.م</div>
        </div>
        <table>
          <thead><tr><th>القسط</th><th>الشهر والاستحقاق</th><th>المبلغ</th><th>الحالة</th><th class="no-print">الإجراء ورسالة الواتساب</th></tr></thead>
          <tbody>
            ${installments.map(inst => {
              const mLabel = new Date(inst.due_date + 'T00:00:00').toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
              const remCount = 20 - inst.installment_number;
              const waMsg = `مؤسسة الحافظ للتنمية والخدمات\nالسيد/ة: ${clientName}\nتم سداد قسط شهر (${mLabel}) — القسط رقم (${inst.installment_number} من 20) بقيمة (${inst.amount} جنيه).\nالمتبقي عليكم (${remCount} قسط) بإجمالي (${remCount * Number(inst.amount)} جنيه).`;
              return `<tr style="background:${inst.is_paid ? '#f0fdf4' : '#fff'};">
                <td><strong>${inst.installment_number} / 20</strong></td>
                <td>${window.escapeHtml(mLabel)}</td>
                <td><strong>${inst.amount} ج.م</strong></td>
                <td>${inst.is_paid ? '<span style="color:#15803d; font-weight:800;">✅ مسدد</span>' : '<span style="color:#b91c1c; font-weight:700;">⏳ غير مسدد</span>'}</td>
                <td class="no-print" style="display:flex; gap:5px; flex-wrap:wrap;">
                  <button type="button" onclick="toggleInstallmentPayment('${window.escapeHtml(inst.id)}', '${window.escapeHtml(familyId)}', ${!inst.is_paid})" class="nav-btn" style="background:${inst.is_paid ? '#64748b' : '#15803d'}; color:#fff; padding:3px 8px; font-size:11px;">${inst.is_paid ? 'تراجع' : '✔️ سداد'}</button>
                  <button type="button" onclick="window.triggerInstantWhatsApp('${window.escapeHtml(clientPhone)}', decodeURIComponent('${encodeURIComponent(waMsg)}'))" class="nav-btn" style="background:#0284c7; color:#fff; padding:3px 8px; font-size:11px;">💬 واتساب</button>
                </td></tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  };

  window.generate20Installments = async function(familyId) {
    const totalLoan = parseFloat(document.getElementById('inst-total-loan')?.value || '0');
    const startDateStr = document.getElementById('inst-start-date')?.value || '';
    if (!totalLoan || !startDateStr) return alert('⚠️ أدخل المبلغ وتاريخ البداية.');
    const monthly = Math.round((totalLoan / 20) * 100) / 100;
    const base = new Date(startDateStr + 'T00:00:00');
    const rows = Array.from({ length: 20 }, (_, i) => {
      const d = new Date(base.getFullYear(), base.getMonth() + i, base.getDate());
      return { family_id: familyId, installment_number: i + 1, due_date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, amount: monthly, is_paid: false };
    });
    const { error } = await window.supabaseClient.from('project_installments').insert(rows);
    if (error) return alert('❌ خطأ: ' + error.message);
    window.openProjectInstallmentsModal(familyId);
  };

  window.toggleInstallmentPayment = async function(instId, familyId, nextState) {
    const actor = window.currentUser?.name || window.currentUser?.email || 'الإدارة';
    const { error } = await window.supabaseClient.from('project_installments').update({ is_paid: nextState, paid_at: nextState ? new Date().toISOString() : null, collected_by: nextState ? actor : null }).eq('id', instId);
    if (error) return alert('❌ خطأ: ' + error.message);
    window.openProjectInstallmentsModal(familyId);
  };

  window.printInstallmentsTableOnly = function() {
    const box = document.getElementById('printable-installments-box');
    if (!box) return;
    const clone = box.cloneNode(true);
    clone.querySelectorAll('.no-print').forEach(el => el.remove());
    const w = window.open('', '_blank', 'width=900,height=900');
    if (w) { w.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><style>body{font-family:Tahoma;direction:rtl;padding:20px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #333;padding:6px;text-align:right;font-size:12px;}</style></head><body>${clone.innerHTML}<script>window.onload=function(){window.print();};<\/script></body></html>`); w.document.close(); }
  };

  // 12. تنبيهات الأقساط قبل الميعاد بـ 5 أيام (للأدمن والباحث المسند له)
  async function loadUpcomingInstallmentsBanner(targetId, userObj) {
    const host = document.getElementById(targetId);
    if (!host || !window.supabaseClient) return;
    const limitDate = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
    const { data: dueItems } = await window.supabaseClient.from('project_installments').select('*, families(*)').eq('is_paid', false).lte('due_date', limitDate).order('due_date', { ascending: true });
    if (!dueItems || dueItems.length === 0) return;

    const isAdmin = ['admin', 'super_admin'].includes(String(userObj?.role || '').toLowerCase());
    const email = String(userObj?.email || '').toLowerCase();
    const visible = dueItems.filter(r => r.families && (isAdmin || String(r.families.assigned_to_email || '').toLowerCase() === email));
    if (visible.length === 0) return;

    const div = document.createElement('div');
    div.className = 'no-print';
    div.style.cssText = 'background:#fef2f2; border:2px solid #ef4444; border-radius:12px; padding:12px; margin-bottom:12px;';
    div.innerHTML = `<h4 style="margin:0 0 8px; color:#991b1b;">🔔 تنبيهات أقساط مستحقة خلال 5 أيام (${visible.length})</h4>` + visible.map(r => {
      const f = r.families;
      const nm = f.applicant_name || 'مستفيد';
      const ph = f.husband_data?.whatsapp || f.husband_data?.phone || '';
      const msg = `مؤسسة الحافظ للتنمية والخدمات\nتذكير للسيد/ة: ${nm}\nموعد استحقاق القسط رقم (${r.installment_number} من 20) بقيمة (${r.amount} جنيه) يحل بتاريخ (${r.due_date}).`;
      return `<div style="background:#fff; border:1px solid #fecaca; padding:6px 10px; border-radius:6px; margin-bottom:4px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px; font-size:12px;">
        <span><strong>${window.escapeHtml(nm)}</strong> — قسط #${r.installment_number} (${r.amount} ج.م) — استحقاق: <strong style="color:#b91c1c;">${r.due_date}</strong></span>
        <div style="display:flex; gap:5px;">
          <button type="button" onclick="window.triggerInstantWhatsApp('${window.escapeHtml(ph)}', decodeURIComponent('${encodeURIComponent(msg)}'))" class="nav-btn" style="background:#16a34a; color:#fff; padding:3px 8px; font-size:11px;">💬 تذكير واتساب</button>
          <button type="button" onclick="window.openProjectInstallmentsModal('${window.escapeHtml(f.id)}')" class="nav-btn" style="background:#7e22ce; color:#fff; padding:3px 8px; font-size:11px;">💳 الأقساط</button>
        </div></div>`;
    }).join('');
    host.prepend(div);
  }

  const origAdminCases = window.renderAdminCasesSection;
  window.renderAdminCasesSection = function() { if (origAdminCases) origAdminCases.apply(this, arguments); loadUpcomingInstallmentsBanner('admin-tab-cases', window.currentUser); };

  const origMemberPortal = window.renderMemberPortal;
  window.renderMemberPortal = async function(user) {
    if (origMemberPortal) await origMemberPortal.apply(this, arguments);
    const area = document.getElementById('dashboard-area');
    if (area?.firstElementChild) { area.firstElementChild.id = area.firstElementChild.id || 'member-portal-card'; loadUpcomingInstallmentsBanner(area.firstElementChild.id, user); }
      // 13. توجيه مرفقات الاستمارات العادية إلى Google Drive + إغلاق السماح بالتعديل بعد الحفظ
    const origMemberPortal = window.renderMemberPortal;
  window.renderMemberPortal = async function(user) {
    if (origMemberPortal) await origMemberPortal.apply(this, arguments);
    const area = document.getElementById('dashboard-area');
    if (area?.firstElementChild) {
      area.firstElementChild.id = area.firstElementChild.id || 'member-portal-card';
      loadUpcomingInstallmentsBanner(area.firstElementChild.id, user);
    }
  };

  // 13. توجيه مرفقات الاستمارات العادية إلى Google Drive + إغلاق السماح بالتعديل بعد الحفظ
  const origHandlePreview = window.handleImmediateAttachmentPreview;
  window.handleImmediateAttachmentPreview = async function(inputEl, explicitDocKey = '', statusBoxId = '') {
    const rawFile = inputEl?.files?.item(0);
    if (rawFile && window.GOOGLE_DRIVE_WEB_APP_URL && typeof window.uploadFileToDriveOrStorage === 'function') {
      const village = document.getElementById('h-village')?.value || window.formData?.husband?.village || 'إهناسيا';
      const subType = window.formData?.interventionType || 'مساعدات_اجتماعية';
      const code = window.ACTIVE_EDIT_CASE?.tracking_code || ('DRAFT-' + Date.now());
      const res = await window.uploadFileToDriveOrStorage(rawFile, {
        year: new Date().getFullYear().toString(),
        village,
        submissionType: subType,
        trackingCode: code
      });
      if (res && res.uploaded) {
        const key = explicitDocKey || inputEl.id || 'doc';
        window.WIZARD_ATTACHMENTS_CACHE = window.WIZARD_ATTACHMENTS_CACHE || {};
        window.WIZARD_ATTACHMENTS_CACHE[key] = res;
        window.formData.documents = Object.assign({}, window.formData.documents || {}, { [key]: res });
      }
    }
    if (typeof origHandlePreview === 'function') {
      return origHandlePreview.apply(this, arguments);
    }
  };

  // تحديث السجل الحالي وإغلاق allow_edit تلقائياً إذا كان المستخدم يعدل حالة مفتوحة
  const origSubmitWizard = window.submitFullWizardApplication;
  window.submitFullWizardApplication = async function() {
    if (window.ACTIVE_EDIT_CASE && window.supabaseClient) {
      const editId = window.ACTIVE_EDIT_CASE.id;
      const h = window.formData.husband || {};
      const w = window.formData.wife || {};
      const { error } = await window.supabaseClient
        .from('families')
        .update({
          husband_data: h,
          wife_data: w,
          children_data: window.formData.children || [],
          expenses_data: window.formData.expenses || {},
          incomes_data: window.formData.incomes || {},
          housing_data: window.formData.housing || {},
          documents_data: Object.assign({}, window.ACTIVE_EDIT_CASE.documents_data || {}, window.formData.documents || {}),
          allow_edit: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', editId);

      if (error) return alert('❌ تعذر حفظ التعديلات: ' + error.message);
      window.ACTIVE_EDIT_CASE = null;
      alert('✅ تم حفظ التعديلات بنجاح وإغلاق صلاحية التعديل المؤقتة.');
      if (typeof window.showSection === 'function') window.showSection('home');
      return;
    }
    if (typeof origSubmitWizard === 'function') {
      return origSubmitWizard.apply(this, arguments);
    }
  };

  // 14. زر الأرشفة الطارئة لسجلات Supabase إلى Google Drive
  window.backupSupabaseFamiliesToGoogleDrive = async function() {
    if (!window.supabaseClient || !window.GOOGLE_DRIVE_WEB_APP_URL) return;
    if (!confirm('هل تريد تصدير نسخة احتياطية كاملة من سجلات الحالات (Supabase) وحفظها كملف أرشيف داخل Google Drive؟')) return;

    const { data, error } = await window.supabaseClient.from('families').select('*');
    if (error || !data) return alert('❌ تعذر جلب البيانات من Supabase.');

    const res = await fetch(window.GOOGLE_DRIVE_WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'archive_db',
        fileName: `Supabase_Families_Backup_${new Date().toISOString().slice(0, 10)}.json`,
        records: data
      })
    });
        const json = await res.json();
    if (json && json.status === 'success') {
      alert(`✅ تم حفظ نسخة الأرشيف (${data.length} حالة) بنجاح في Google Drive!\nرابط الملف:\n${json.fileUrl}`);
    } else {
      alert('❌ تعذرت الأرشفة: ' + (json?.message || 'خطأ غير معروف'));
    }
  };
})();
