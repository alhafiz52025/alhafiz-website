// projects-and-installments.js
(function() {
  const PROJECT_INTERVENTION_LABEL = 'مشروع تمكين اقتصادي صغير';

  window._HF_WA_MESSAGES = window._HF_WA_MESSAGES || {};

  function registerWaMessage(msgText) {
    const key = 'wa_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    window._HF_WA_MESSAGES[key] = String(msgText || '');
    return key;
  }

  window.openRegisteredWhatsApp = function(rawPhone, msgKey) {
    const cleanPhone = String(rawPhone || '').replace(/\D/g, '');
    if (!cleanPhone) {
      alert('⚠️ لا يوجد رقم هاتف/واتساب مسجل لهذه الحالة.');
      return;
    }
    const intlPhone = cleanPhone.startsWith('20') ? cleanPhone : ('20' + cleanPhone.replace(/^0+/, ''));
    const text = window._HF_WA_MESSAGES[msgKey] || '';
    const waUrl = `https://wa.me/${intlPhone}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  if (typeof window.triggerInstantWhatsApp !== 'function') {
    window.triggerInstantWhatsApp = function(rawPhone, messageText) {
      const key = registerWaMessage(messageText);
      window.openRegisteredWhatsApp(rawPhone, key);
    };
  }

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

  function quickCompressImage(file, maxW = 900, quality = 0.65) {
    return new Promise((resolve) => {
      if (!file || !file.type || !file.type.startsWith('image/')) return resolve(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width, h = img.height;
          if (w > maxW) { h = Math.round((h * maxW) / w); w = maxW; }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          canvas.toBlob((blob) => {
            if (!blob) return resolve(file);
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' }));
          }, 'image/jpeg', quality);
        };
        img.onerror = () => resolve(file);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  }

  // دوال التحقق الآمن من روابط Google Drive ومنع الروابط الوهمية مثل google.com_
  window.getSafeDriveDocumentUrl = function(doc = {}) {
    if (!doc) return '';
    if (typeof doc === 'string') {
      const s = doc.trim();
      const lower = s.toLowerCase();
      if (!s || lower.includes('google.com_') || lower.endsWith('_')) return '';
      if (lower.startsWith('https://') || lower.startsWith('http://')) return s;
      return '';
    }

    const candidates = [doc.url, doc.publicUrl, doc.fileUrl, doc.directUrl]
      .map(u => String(u || '').trim())
      .filter(Boolean);

    for (const candidate of candidates) {
      const lower = candidate.toLowerCase();
      if (lower.includes('google.com_') || lower.endsWith('_')) continue;
      if (
        lower.startsWith('https://drive.google.com/') ||
        lower.startsWith('https://lh3.googleusercontent.com/') ||
        lower.startsWith('https://docs.google.com/') ||
        lower.startsWith('https://') ||
        lower.startsWith('http://')
      ) {
        return candidate;
      }
    }

    if (doc.fileId) {
      return `https://drive.google.com/file/d/${String(doc.fileId).trim()}/view`;
    }

    return '';
  };

  window.openDriveDocumentSafely = function(doc = {}) {
    const safeUrl = window.getSafeDriveDocumentUrl(doc);
    if (!safeUrl) {
      alert('⚠️ هذا المرفق لا يملك رابط عرض صالحاً على Google Drive بعد (قد يكون مسجلاً قبل تحديث نظام الأرشفة).');
      return;
    }
    window.open(safeUrl, '_blank', 'noopener,noreferrer');
  };

  window.renderDriveDocumentsList = function(documents = []) {
    const list = Array.isArray(documents)
      ? documents
      : (documents && typeof documents === 'object' ? Object.values(documents) : []);

    if (!list.length) {
      return '<div class="text-muted small">لا توجد مرفقات مسجلة لهذه الحالة.</div>';
    }

    return list.map((doc, idx) => {
      const safeViewUrl = window.getSafeDriveDocumentUrl(doc);
      const rawDirect = doc && typeof doc === 'object' ? String(doc.directUrl || '').trim() : '';
      const previewImgUrl = rawDirect && !rawDirect.toLowerCase().includes('google.com_')
        ? rawDirect
        : safeViewUrl;
      const docName = (doc && typeof doc === 'object')
        ? (doc.label || doc.fileName || doc.name || `مرفق ${idx + 1}`)
        : `مرفق ${idx + 1}`;
      const mime = (doc && typeof doc === 'object') ? String(doc.mimeType || '') : '';
      const isImage = Boolean(
        mime.startsWith('image/') ||
        /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(String(docName + ' ' + safeViewUrl)) ||
        previewImgUrl.includes('lh3.googleusercontent.com/d/')
      );

      if (!safeViewUrl) {
        return `
          <div style="border:1px solid #e2e8f0; border-radius:8px; padding:8px 10px; margin-bottom:6px; background:#f8fafc; display:flex; justify-content:space-between; align-items:center; gap:8px;">
            <span style="font-size:12px; color:#475569;">${window.escapeHtml ? window.escapeHtml(docName) : docName}</span>
            <span style="font-size:11px; background:#fef3c7; color:#92400e; padding:2px 8px; border-radius:6px; font-weight:700;">الرابط غير متاح (سجل قديم)</span>
          </div>
        `;
      }

      return `
        <div style="border:1px solid #cbd5e1; border-radius:8px; padding:8px 10px; margin-bottom:8px; background:#fff;">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
            <span style="font-size:12px; font-weight:700; color:#0f172a;">${window.escapeHtml ? window.escapeHtml(docName) : docName}</span>
            <a href="${safeViewUrl}" target="_blank" rel="noopener noreferrer" class="nav-btn" style="background:#0284c7; color:#fff; padding:4px 10px; font-size:11px; text-decoration:none;">
              فتح / تنزيل
            </a>
          </div>
          ${isImage && previewImgUrl ? `
            <div style="margin-top:8px; text-align:center;">
              <img src="${previewImgUrl}" alt="${window.escapeHtml ? window.escapeHtml(docName) : docName}" loading="lazy"
                   style="max-height:180px; max-width:100%; object-fit:contain; border-radius:6px; border:1px solid #e2e8f0;"
                   onerror="this.style.display='none';" />
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  };

        window.uploadFileToDriveOrStorage = async function(rawFile, meta = {}) {
    if (!rawFile) {
      return { name: 'file', uploaded: false, url: '', publicUrl: '', directUrl: '' };
    }

    const driveUrl = String(window.GOOGLE_DRIVE_WEB_APP_URL || '').trim();
    if (!driveUrl || !driveUrl.includes('://google.com')) {
      throw new Error('رابط Google Apps Script غير مضبوط في ملف config.js');
    }

    const file = await quickCompressImage(rawFile, 800, 0.6);
    const base64Data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const str = String(reader.result || '');
        const idx = str.indexOf(',');
        resolve(idx >= 0 ? str.slice(idx + 1) : str);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

    const finalFileName = (meta.prefix ? meta.prefix + '_' : '') + (file.name || ('doc_' + Date.now() + '.jpg'));
    const payload = {
      year: String(meta.year || new Date().getFullYear()),
      village: String(meta.village || 'إهناسيا').trim(),
      submissionType: String(meta.submissionType || 'عام').trim(),
      trackingCode: String(meta.trackingCode || ('TRK-' + Date.now())).trim(),
      fileName: finalFileName,
      mimeType: file.type || 'image/jpeg',
      fileBase64: base64Data
    };

    const formBody = new URLSearchParams();
    formBody.append('payload', JSON.stringify(payload));

    const response = await fetch(driveUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: formBody.toString()
    });

    const rawText = await response.text();
    let result = {};
    try {
      result = JSON.parse(rawText);
    } catch (_) {
      throw new Error('استجابة غير صالحة من Google Drive');
    }

    if (!result || result.status !== 'success') {
      throw new Error(result?.message || 'فشل رفع الملف إلى Google Drive');
    }

    const fileId = String(result.fileId || '').trim();
    const viewUrl = String(
      result.fileUrl || (fileId ? 'https://google.com' + fileId + '/view' : '')
    ).trim();
    const directUrl = String(
      result.directUrl || (fileId ? 'https://googleusercontent.com' + fileId : viewUrl)
    ).trim();

    return {
      name: finalFileName,
      fileName: finalFileName,
      fileId: fileId,
      size: file.size || 0,
      mimeType: file.type || 'image/jpeg',
      url: viewUrl,
      publicUrl: viewUrl,
      directUrl: directUrl,
      folderUrl: String(result.folderUrl || '').trim(),
      storageProvider: 'google_drive',
      uploaded: true
    };
  };

  window.updateProjInitCenters = function() {
    const gov = document.getElementById('prj-init-gov')?.value || '';
    const centerSel = document.getElementById('prj-init-center');
    const villageSel = document.getElementById('prj-init-village');
    const locs = window.EGYPT_LOCATIONS || {};

    if (centerSel) {
      if (!gov || !locs[gov]) {
        centerSel.innerHTML = '<option value="">-- اختر المحافظة أولاً --</option>';
        centerSel.disabled = true;
      } else {
        centerSel.innerHTML = '<option value="">-- اختر المركز / القسم --</option>' +
          Object.keys(locs[gov]).map(c => `<option value="${window.escapeHtml(c)}">${window.escapeHtml(c)}</option>`).join('');
        centerSel.disabled = false;
      }
    }
    if (villageSel) {
      villageSel.innerHTML = '<option value="">-- اختر المركز أولاً --</option>';
      villageSel.disabled = true;
    }
    document.getElementById('prj-init-new-village-box')?.classList.add('hidden');
  };

  window.updateProjInitVillages = function() {
    const gov = document.getElementById('prj-init-gov')?.value || '';
    const center = document.getElementById('prj-init-center')?.value || '';
    const villageSel = document.getElementById('prj-init-village');
    const locs = window.EGYPT_LOCATIONS || {};

    if (villageSel) {
      if (!gov || !center || !locs[gov]?.[center]) {
        villageSel.innerHTML = '<option value="">-- اختر المركز أولاً --</option>';
        villageSel.disabled = true;
      } else {
        const baseVills = locs[gov][center] || [];
        const customVills = window.CUSTOM_LOCATIONS_CACHE?.[gov]?.[center] || [];
        const allVills = Array.from(new Set([...baseVills, ...customVills]));
        villageSel.innerHTML = '<option value="">-- اختر القرية أو التابع --</option>' +
          allVills.map(v => `<option value="${window.escapeHtml(v)}">${window.escapeHtml(v)}</option>`).join('') +
          '<option value="__NEW__">+ إضافة قرية / عزبة / تابع جديد غير مدرج</option>';
        villageSel.disabled = false;
      }
    }
    document.getElementById('prj-init-new-village-box')?.classList.add('hidden');
  };

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
            resBox.innerHTML = `<div style="background:#fffbeb; border:1px solid #f59e0b; padding:16px; border-radius:12px;">
              <strong>رقم الطلب الأولي:</strong> ${window.escapeHtml(q)}<br>
              <strong>الحالة:</strong> ✅ تمت الموافقة المبدئية — متاح الآن استكمال أوراق المشروع.<br>
              <button type="button" onclick="showSection('apply')" class="action-btn" style="margin-top:8px; font-size:12px;">+ الانتقال لاستكمال أوراق المشروع</button>
            </div>`;
          } else if (pData.completionSubmitted) {
            resBox.innerHTML = `<div style="background:#eff6ff; border:1px solid #bfdbfe; padding:16px; border-radius:12px;">
              <strong>تنبيه:</strong> تم استكمال أوراق هذا الطلب مسبقاً وأصبح الرقم الأولي غير نشط.<br>
              <strong>رقم المتابعة الجديد:</strong> <span style="color:#1d4ed8; font-weight:800;">${window.escapeHtml(data.tracking_code)}</span>
            </div>`;
          } else {
            resBox.innerHTML = `<div style="background:#f8fafc; border:1px solid #cbd5e1; padding:16px; border-radius:12px;">
              <strong>رقم الطلب الأولي:</strong> ${window.escapeHtml(q)}<br>
              <strong>الحالة:</strong> 🔍 طلب المشروع المبدئي قيد المراجعة الإدارية.
            </div>`;
          }
          return;
        }
      }
    }
    if (typeof origTrackApplication === 'function') return origTrackApplication.apply(this, arguments);
  };

  const origRenderWizardStep = window.renderWizardStep;
  window.renderWizardStep = function() {
    ensureProjectAidType();
    if (typeof origRenderWizardStep === 'function') origRenderWizardStep.apply(this, arguments);

    const container = document.getElementById('wizard-container');
    if (!container) return;

    if (window.ACTIVE_PROJECT_COMPLETION_CASE) {
      const code = window.ACTIVE_PROJECT_COMPLETION_CASE.initial_tracking_code || window.ACTIVE_PROJECT_COMPLETION_CASE.tracking_code;
      const banner = document.createElement('div');
      banner.style.cssText = 'background:#ecfdf5; border:2px solid #059669; color:#065f46; padding:10px 14px; border-radius:10px; margin-bottom:12px; font-size:13px; font-weight:700; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;';
      banner.innerHTML = `<span>📂 استكمال أوراق المشروع الصغير — الرقم الأولي: <strong>${window.escapeHtml(code)}</strong> (العنوان وبطاقتك محفوظة مسبقاً)</span>
        <button type="button" onclick="window.ACTIVE_PROJECT_COMPLETION_CASE=null; window.currentStep=1; window.renderWizardStep();" class="nav-btn" style="font-size:11px;">إلغاء الاستكمال</button>`;
      container.prepend(banner);
    } else if (window.ACTIVE_EDIT_CASE && window.currentStep !== 1) {
      const banner = document.createElement('div');
      banner.style.cssText = 'background:#eff6ff; border:1px solid #3b82f6; color:#1e3a8a; padding:10px 14px; border-radius:8px; margin-bottom:12px; font-size:13px; font-weight:700;';
      banner.innerHTML = `✏️ وضع التعديل المفتوح بواسطة الإدارة — كود الحالة: <strong>${window.escapeHtml(window.ACTIVE_EDIT_CASE.tracking_code)}</strong>`;
      container.prepend(banner);
    }

    if (window.currentStep === 1 && !window.ACTIVE_PROJECT_COMPLETION_CASE) {
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

      const govs = Object.keys(window.EGYPT_LOCATIONS || {});
      const govOpts = '<option value="">-- اختر المحافظة أولاً --</option>' +
        govs.map(g => `<option value="${window.escapeHtml(g)}">${window.escapeHtml(g)}</option>`).join('');

      const extraBox = document.createElement('div');
      extraBox.style.marginTop = '16px';

      if (isProj) {
        const nextBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent.includes('التالي'));
        if (nextBtn) nextBtn.style.display = 'none';

        extraBox.innerHTML = `
          <div style="display:grid; grid-template-columns: 1.35fr 1fr; gap:16px; align-items:start;">
            <div style="background:#f0fdf4; border:1px solid #86efac; padding:16px; border-radius:12px;">
              <h4 style="margin:0 0 8px; color:#065f46;">🚀 أولاً: التقديم المبدئي السريع لمشروع صغير (قرض حسن)</h4>
              <p style="font-size:12px; color:#166534; margin:0 0 10px;">أدخل بياناتك الأساسية والعنوان وصورة البطاقة (وجه أمامي ووجه خلفي) لإصدار رقم الطلب الأولي.</p>
              <div class="grid-2">
                <div><label style="font-size:12px; font-weight:700;">الاسم ثلاثي *</label><input id="prj-init-name" placeholder="الاسم بالكامل *"></div>
                <div><label style="font-size:12px; font-weight:700;">رقم الهاتف (واتساب) *</label><input id="prj-init-phone" maxlength="11" placeholder="01xxxxxxxxx *"></div>
              </div>

              <div style="background:#fff; padding:10px; border-radius:8px; margin:8px 0; border:1px solid #bbf7d0;">
                <label style="font-size:12px; font-weight:700; color:#065f46;">العنوان الإداري (التسلسل الجغرافي المعتمد) *</label>
                <div class="grid-3" style="margin-top:6px;">
                  <div><label style="font-size:11px;">1. المحافظة:</label><select id="prj-init-gov" onchange="updateProjInitCenters()">${govOpts}</select></div>
                  <div><label style="font-size:11px;">2. المركز / القسم:</label><select id="prj-init-center" onchange="updateProjInitVillages()" disabled><option value="">-- اختر المحافظة أولاً --</option></select></div>
                  <div><label style="font-size:11px;">3. القرية أو التابع:</label><select id="prj-init-village" onchange="document.getElementById('prj-init-new-village-box').classList.toggle('hidden', this.value !== '__NEW__')" disabled><option value="">-- اختر المركز أولاً --</option></select></div>
                </div>
                <div id="prj-init-new-village-box" class="hidden" style="margin-top:6px;">
                  <input id="prj-init-new-village" placeholder="اكتب اسم القرية / العزبة / التابع الجديد بدقة *">
                </div>
                <div style="margin-top:6px;">
                  <input id="prj-init-street" placeholder="العنوان كما مدون في البطاقة أو علامة مميزة *">
                </div>
              </div>

              <div class="grid-2" style="margin-top:8px;">
                <div><label style="font-size:12px; font-weight:700;">صورة البطاقة (وجه أمامي) *</label><input type="file" id="prj-init-id-front" accept="image/*,.pdf"></div>
                <div><label style="font-size:12px; font-weight:700;">صورة البطاقة (وجه خلفي) *</label><input type="file" id="prj-init-id-back" accept="image/*,.pdf"></div>
              </div>

              <div style="margin-top:8px;">
                <label style="font-size:12px; font-weight:700;">المشروع المطلوب (من القائمة الكاملة) *</label>
                <select id="prj-init-type" onchange="document.getElementById('prj-init-custom-type').classList.toggle('hidden', this.value !== 'إضافة مشروع غير موجود في القائمة')">
                  <option value="">-- اختر نوع المشروع بالتفصيل --</option>
                  ${projectTypesOpts}
                </select>
                <input id="prj-init-custom-type" class="hidden" placeholder="اكتب اسم المشروع الجديد المطلوب بالتفصيل *" style="margin-top:6px;">
              </div>
              <button type="button" onclick="submitInitialSmallProject(this)" class="action-btn" style="width:100%; margin-top:12px; background:#15803d;">✅ تسجيل الطلب المبدئي وإصدار الرقم الأولي</button>
            </div>

            <div style="background:#fffbeb; border:2px solid #f59e0b; padding:16px; border-radius:12px;">
              <h4 style="margin:0 0 8px; color:#92400e;">📂 استكمال أوراق مشروع مقبول مبدئياً</h4>
              <div style="background:#fff; border:1px dashed #f59e0b; padding:10px; border-radius:8px; font-size:12px; line-height:1.7; margin-bottom:10px; color:#78350f;">
                <strong>طريقة الاستكمال:</strong> أدخل <strong>رقم الطلب الأولي</strong> المرسل إليك عند القبول لفتح استمارة البيانات الكاملة ثم قسم المشروع والضامن.
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
      return;
    }

    const maritalSel = container.querySelector('#h-status, #h-marital, select[id*="status"]');
    if (maritalSel && window.currentStep === 2) {
      const hasSingle = Array.from(maritalSel.options).some(o => o.value.includes('أعزب'));
      if (!hasSingle) {
        const opt = document.createElement('option');
        opt.value = 'أعزب / عزباء';
        opt.textContent = 'أعزب / عزباء (بدون زوجة أو أبناء)';
        if (window.formData?.husband?.status === 'أعزب / عزباء') opt.selected = true;
        maritalSel.appendChild(opt);
      }
      maritalSel.addEventListener('change', function() {
        window.formData.husband = window.formData.husband || {};
        window.formData.husband.status = this.value;
      });
    }

    const currentMarital = String(maritalSel?.value || window.formData?.husband?.status || '');
    const isSingle = currentMarital.includes('أعزب') || currentMarital.includes('عزباء');
    if (isSingle && (window.currentStep === 3 || window.currentStep === 4)) {
      window.formData.wife = {};
      window.formData.children = [];
      window.currentStep = 6;
      window.renderWizardStep();
      return;
    }

    if (window.ACTIVE_PROJECT_COMPLETION_CASE && window.currentStep === 2) {
      const streetInp = document.getElementById('h-street');
      const addrBox = streetInp?.closest('div[style*="background:#f8fafc"]');
      if (addrBox) addrBox.style.display = 'none';

      ['h-id-front', 'h-id-back'].forEach(fid => {
        const el = document.getElementById(fid);
        if (el && el.parentElement) el.parentElement.style.display = 'none';
      });
    }

    if (window.ACTIVE_PROJECT_COMPLETION_CASE && window.currentStep === 8) {
      const socInp = document.getElementById('doc-social-research');
      if (socInp && socInp.parentElement) socInp.parentElement.style.display = 'none';

      const finalSubmitBtn = Array.from(container.querySelectorAll('button')).find(
        b => b.textContent.includes('تأكيد والرفع النهائي للحالة')
      );

      if (finalSubmitBtn && !document.getElementById('wizard-project-completion-section')) {
        const caseRecord = window.ACTIVE_PROJECT_COMPLETION_CASE;
        const pData = caseRecord.project_data || {};
        const projectOpts = (window.SMALL_PROJECT_TYPES || [])
          .map(p => `<option value="${window.escapeHtml(p)}" ${pData.projectType === p ? 'selected' : ''}>${window.escapeHtml(p)}</option>`)
          .join('');

        const projSection = document.createElement('div');
        projSection.id = 'wizard-project-completion-section';
        projSection.style.cssText = 'background:#f0fdf4; border:2px solid #047857; border-radius:14px; padding:16px; margin:16px 0;';
        projSection.innerHTML = `
          <h4 style="margin:0 0 10px; color:#065f46;">🚀 قسم المشروع الصغير وبيانات الضامن</h4>
          <div class="grid-2">
            <div><label style="font-weight:700;">نوع المشروع المطلوب (القائمة الكاملة) *</label><select id="cmp-project-type">${projectOpts}</select></div>
            <div><label style="font-weight:700;">هل يوجد مكان أم سريح *</label>
              <select id="cmp-location-type">
                <option value="مقر ثابت (محل / ورشة ملك)" ${pData.locationType === 'مقر ثابت (محل / ورشة ملك)' ? 'selected' : ''}>مقر ثابت (محل / ورشة ملك)</option>
                <option value="مقر ثابت (محل / ورشة إيجار)" ${pData.locationType === 'مقر ثابت (محل / ورشة إيجار)' ? 'selected' : ''}>مقر ثابت (محل / ورشة إيجار)</option>
                <option value="نشاط داخل المنزل" ${pData.locationType === 'نشاط داخل المنزل' ? 'selected' : ''}>نشاط داخل المنزل</option>
                <option value="سريح / عربة متجولة بدون مقر ثابت" ${pData.locationType === 'سريح / عربة متجولة بدون مقر ثابت' ? 'selected' : ''}>سريح / عربة متجولة بدون مقر ثابت</option>
              </select>
            </div>
          </div>
          <div class="grid-2" style="margin-top:8px;">
            <div><label style="font-weight:700;">مشروع جديد أم قديم *</label>
              <select id="cmp-project-age">
                <option value="مشروع جديد (تأسيس من البداية)" ${pData.projectAge === 'مشروع جديد (تأسيس من البداية)' ? 'selected' : ''}>مشروع جديد (تأسيس من البداية)</option>
                <option value="مشروع قديم / قائم (تطوير وتوسعة)" ${pData.projectAge === 'مشروع قديم / قائم (تطوير وتوسعة)' ? 'selected' : ''}>مشروع قديم / قائم (تطوير وتوسعة)</option>
              </select>
            </div>
            <div><label style="font-weight:700;">التكلفة الإجمالية للمشروع (جنيه) *</label><input type="number" min="500" id="cmp-total-cost" value="${window.escapeHtml(pData.totalCost || '')}" placeholder="مثال: 20000"></div>
          </div>
          <div class="grid-2" style="margin-top:8px;">
            <div><label style="font-weight:700;">عدد العاملين بالمشروع *</label><input type="number" min="1" id="cmp-workers-count" value="${window.escapeHtml(pData.workersCount || '1')}"></div>
            <div><label style="font-weight:700;">العائد الشهري المتوقع من المشروع (جنيه) *</label><input type="number" min="0" id="cmp-expected-return" value="${window.escapeHtml(pData.expectedReturn || '')}" placeholder="مثال: 4500"></div>
          </div>
          <div style="margin-top:8px;"><label style="font-weight:700;">وصف تفصيلي للمشروع وخطة التشغيل *</label><textarea id="cmp-description" rows="2" placeholder="اشرح المعدات أو البضاعة المطلوبة...">${window.escapeHtml(pData.description || '')}</textarea></div>

          <h5 style="margin:14px 0 8px; color:#92400e; border-top:1px dashed #86efac; padding-top:10px;">🛡️ بيانات الضامن وصورة بطاقته (وش وظهر)</h5>
          <div class="grid-3">
            <div><label style="font-weight:700;">اسم الضامن بالكامل *</label><input id="cmp-guarantor-name" value="${window.escapeHtml(pData.guarantorName || '')}" placeholder="الاسم رباعي للضامن *"></div>
            <div><label style="font-weight:700;">رقم تليفون الضامن *</label><input id="cmp-guarantor-phone" maxlength="11" value="${window.escapeHtml(pData.guarantorPhone || '')}" placeholder="01xxxxxxxxx *"></div>
            <div><label style="font-weight:700;">عمل / وظيفة الضامن *</label><input id="cmp-guarantor-job" value="${window.escapeHtml(pData.guarantorJob || '')}" placeholder="موظف / تاجر / عمل حر *"></div>
          </div>
          <div class="grid-2" style="margin-top:8px;">
            <div><label style="font-weight:700;">صورة بطاقة الضامن (وجه أمامي) *</label><input type="file" id="cmp-guarantor-id-front" accept="image/*,.pdf"></div>
            <div><label style="font-weight:700;">صورة بطاقة الضامن (وجه خلفي) *</label><input type="file" id="cmp-guarantor-id-back" accept="image/*,.pdf"></div>
          </div>

          <h5 style="margin:14px 0 8px; color:#065f46; border-top:1px dashed #86efac; padding-top:10px;">📎 مرفقات المشروع المطلوبة (تُضم لملفك وتُرفع تلقائياً إلى Google Drive)</h5>
          <div class="grid-2">
            <div><label style="font-weight:700;">1. صورة مكان المشروع / المعدات *</label><input type="file" id="cmp-doc-place-photo" accept="image/*,.pdf"></div>
            <div><label style="font-weight:700;">2. فيش جنائي (صحيفة الحالة الجنائية) *</label><input type="file" id="cmp-doc-criminal-record" accept="image/*,.pdf"></div>
            <div><label style="font-weight:700;">3. دراسة الجدوى (اختياري - إن وجد)</label><input type="file" id="cmp-doc-feasibility" accept=".pdf,image/*"></div>
            <div><label style="font-weight:700;">4. أوراق ضامنة أخرى / إيصال مرافق (اختياري)</label><input type="file" id="cmp-doc-other-docs" accept="image/*,.pdf"></div>
          </div>
        `;

        finalSubmitBtn.parentElement.insertBefore(projSection, finalSubmitBtn);
        finalSubmitBtn.textContent = '✅ اعتماد استكمال المشروع وإصدار رقم المتابعة الجديد';
        finalSubmitBtn.onclick = function(e) {
          e.preventDefault();
          window.submitProjectCompletionForm(caseRecord.id);
        };
      }
    }
  };

  window.submitInitialSmallProject = async function(btnEl) {
    const btn = btnEl || document.querySelector('#wizard-container button.action-btn');
    const oldText = btn ? btn.textContent : '';
    try {
      const name = (document.getElementById('prj-init-name')?.value || '').trim();
      const phone = (document.getElementById('prj-init-phone')?.value || '').replace(/\D/g, '');
      const gov = (document.getElementById('prj-init-gov')?.value || '').trim();
      const center = (document.getElementById('prj-init-center')?.value || '').trim();
      let village = (document.getElementById('prj-init-village')?.value || '').trim();
      const street = (document.getElementById('prj-init-street')?.value || '').trim();

      if (village === '__NEW__') {
        village = (document.getElementById('prj-init-new-village')?.value || '').trim();
      }

      let projectType = (document.getElementById('prj-init-type')?.value || '').trim();
      if (projectType === 'إضافة مشروع غير موجود في القائمة') {
        projectType = (document.getElementById('prj-init-custom-type')?.value || '').trim();
      }

      const idFrontFile = document.getElementById('prj-init-id-front')?.files?.item(0) || null;
      const idBackFile = document.getElementById('prj-init-id-back')?.files?.item(0) || null;

      if (!name) return alert('⚠️ يرجى إدخال الاسم ثلاثي بالكامل.');
      if (phone.length !== 11 || !phone.startsWith('01')) {
        return alert('⚠️ يرجى إدخال رقم هاتف مصري صحيح مكون من 11 رقماً يبدأ بـ 01.');
      }
      if (!gov || !center || !village) {
        return alert('⚠️ يرجى اختيار المحافظة والمركز والقرية أو التابع.');
      }
      if (!street) {
        return alert('⚠️ يرجى إدخال العنوان كما مدون في البطاقة أو علامة مميزة.');
      }
      if (!projectType) return alert('⚠️ يرجى اختيار أو كتابة نوع المشروع المطلوب.');
      if (!idFrontFile || !idBackFile) {
        return alert('⚠️ يرجى إرفاق صورة البطاقة الشخصية كاملة (الوجه الأمامي والوجه الخلفي).');
      }

      if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ جارٍ التسجيل وإصدار الرقم الأولي...';
      }

      const initialCode = 'HF-INIT-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
      const initWaMsg =
        'مؤسسة الحافظ للتنمية والخدمات (واتساب رسمي: 01000880156)\n' +
        'مرحباً أ/ ' + name + '\n' +
        'تم تسجيل طلب المشروع الصغير المبدئي بنجاح.\n' +
        '• رقم الطلب الأولي الخاص بك: ' + initialCode + '\n' +
        '• المشروع المطلوب: ' + projectType + '\n' +
        'يرجى الاحتفاظ بهذا الرقم؛ عند الموافقة المبدئية ستصلك رسالة لاستكمال البيانات وباقي الأوراق.';

      const intlPhone = '20' + phone.replace(/^0+/, '');
      const waUrl = `https://wa.me/${intlPhone}?text=${encodeURIComponent(initWaMsg)}`;

      if (document.getElementById('prj-init-village')?.value === '__NEW__' && window.supabaseClient) {
        await window.supabaseClient.from('custom_locations').upsert([{
          governorate: gov, center_city: center, village_name: village, added_by: 'مواطن'
        }], { onConflict: 'governorate,center_city,village_name' });
      }

      const uploadMeta = {
        year: new Date().getFullYear().toString(),
        village: village,
        submissionType: 'مشروعات_صغيرة_مبدئي',
        trackingCode: initialCode
      };

            const [uploadedFront, uploadedBack] = await Promise.all([
        window.uploadFileToDriveOrStorage(idFrontFile, { ...uploadMeta, prefix: 'ID_Front' }),
        window.uploadFileToDriveOrStorage(idBackFile, { ...uploadMeta, prefix: 'ID_Back' })
      ]);
      const selectedIntervention = document.getElementById('intervention-type')?.value || PROJECT_INTERVENTION_LABEL;

      const payload = {
        tracking_code: initialCode,
        initial_tracking_code: initialCode,
        is_completion_active: false,
        allow_edit: false,
        applicant_name: name,
        intervention_type: selectedIntervention,
        governorate: gov,
        center_city: center,
        village_hamlet: village,
        street_details: street,
        husband_data: { name1: name, phone: phone, whatsapp: phone, gov: gov, center: center, village: village, street: street },
        documents_data: {
          initialIdFront: uploadedFront,
          initialIdBack: uploadedBack,
          hIdFront: uploadedFront,
          hIdBack: uploadedBack
        },
        project_data: { stage: 'initial', projectType: projectType, initialCode: initialCode },
        status: 'pending',
        eligibility_verdict: 'طلب مشروع مبدئي - قيد المراجعة'
      };

      if (!window.supabaseClient) {
        if (btn) { btn.disabled = false; btn.textContent = oldText; }
        return alert('❌ تعذر الاتصال بقاعدة البيانات.');
      }

      // فتح واتساب مباشرة أثناء تفاعل المستخدم (قبل await) حتى لا يحظره المتصفح (Popup Blocker)
      const waWin = window.open(waUrl, '_blank', 'noopener,noreferrer');

      const res = await window.supabaseClient.from('families').insert(payload);
      if (res && res.error) {
        if (waWin && !waWin.closed) waWin.close();
        if (btn) { btn.disabled = false; btn.textContent = oldText; }
        return alert('❌ خطأ أثناء حفظ الطلب المبدئي: ' + res.error.message);
      }

      const container = document.getElementById('wizard-container');
      if (container) {
        container.innerHTML = `
          <div style="background:#ecfdf5; border:2px solid #059669; border-radius:14px; padding:22px; text-align:center;">
            <h3 style="color:#065f46; margin-top:0;">✅ تم تسجيل طلب المشروع المبدئي بنجاح!</h3>
            <p style="font-size:15px;">رقم الطلب الأولي الخاص بك هو:</p>
            <div style="background:#fff; border:2px dashed #059669; padding:12px; font-size:22px; font-weight:900; color:#047857; border-radius:10px; margin:10px auto; max-width:340px;">${window.escapeHtml(initialCode)}</div>
            <p style="font-size:13px; color:#334155;">يرجى الاحتفاظ بهذا الرقم لاستكمال الأوراق ودراسة الجدوى فور الموافقة المبدئية.</p>
            <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top:14px;">
              <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="action-btn" style="background:#16a34a; text-decoration:none;">💬 إرسال رقم الطلب على الواتساب</a>
              <button type="button" onclick="showSection('home')" class="nav-btn">العودة للرئيسية</button>
            </div>
          </div>`;
      }
    } catch (err) {
      if (btn) { btn.disabled = false; btn.textContent = oldText; }
      alert('❌ حدث خطأ: ' + (err && err.message ? err.message : err));
    }
  };

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

    window.ACTIVE_PROJECT_COMPLETION_CASE = data;
    window.formData = window.formData || {};
    window.formData.interventionType = data.intervention_type || PROJECT_INTERVENTION_LABEL;
    window.formData.husband = Object.assign({
      name1: data.applicant_name || '',
      gov: data.governorate || '',
      center: data.center_city || '',
      village: data.village_hamlet || '',
      street: data.street_details || ''
    }, data.husband_data || {});
    window.formData.wife = Object.assign({}, data.wife_data || {});
    window.formData.children = Array.isArray(data.children_data) ? data.children_data : [];
    window.formData.expenses = Object.assign({}, data.expenses_data || {});
    window.formData.incomes = Object.assign({}, data.incomes_data || {});
    window.formData.housing = Object.assign({}, data.housing_data || {});
    window.formData.documents = Object.assign({}, data.documents_data || {});

    window.currentStep = 2;
    window.renderWizardStep();
  };

  window.submitProjectCompletionForm = async function(caseId) {
    try {
      const { data: existingCase } = await window.supabaseClient.from('families').select('*').eq('id', caseId).single();
      if (!existingCase) throw new Error('تعذر العثور على سجل الحالة');

      const projectType = document.getElementById('cmp-project-type')?.value || '';
      const locationType = document.getElementById('cmp-location-type')?.value || '';
      const projectAge = document.getElementById('cmp-project-age')?.value || '';
      const totalCost = parseFloat(document.getElementById('cmp-total-cost')?.value || '0');
      const workersCount = parseInt(document.getElementById('cmp-workers-count')?.value || '1', 10);
      const expectedReturn = parseFloat(document.getElementById('cmp-expected-return')?.value || '0');
      const description = (document.getElementById('cmp-description')?.value || '').trim();

      const guarantorName = (document.getElementById('cmp-guarantor-name')?.value || '').trim();
      const guarantorPhone = (document.getElementById('cmp-guarantor-phone')?.value || '').replace(/\D/g, '');
      const guarantorJob = (document.getElementById('cmp-guarantor-job')?.value || '').trim();
      const fGuarantorFront = document.getElementById('cmp-guarantor-id-front')?.files?.item(0);
      const fGuarantorBack = document.getElementById('cmp-guarantor-id-back')?.files?.item(0);

      const fPlace = document.getElementById('cmp-doc-place-photo')?.files?.item(0);
      const fCriminal = document.getElementById('cmp-doc-criminal-record')?.files?.item(0);
      const fFeasibility = document.getElementById('cmp-doc-feasibility')?.files?.item(0);
      const fOther = document.getElementById('cmp-doc-other-docs')?.files?.item(0);

      if (!totalCost || totalCost <= 0) return alert('⚠️ يرجى إدخال التكلفة الإجمالية للمشروع.');
      if (!guarantorName || guarantorPhone.length !== 11 || !guarantorJob) {
        return alert('⚠️ يرجى إدخال بيانات الضامن كاملة (الاسم، رقم التليفون 11 رقماً، والعمل).');
      }

      const isAlreadyCompleted = Boolean(existingCase.project_data?.completionSubmitted);
      if (!isAlreadyCompleted && (!fGuarantorFront || !fGuarantorBack || !fPlace || !fCriminal)) {
        return alert('⚠️ يرجى إرفاق الملفات الإلزامية (بطاقة الضامن وجه أمامي وخلفي، صورة مكان المشروع، والفيش الجنائي).');
      }

      const newTrackingCode = isAlreadyCompleted
        ? existingCase.tracking_code
        : ('HF-PRJ-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000));

      const uploadMetaBase = {
        year: new Date().getFullYear().toString(),
        village: existingCase.village_hamlet || 'إهناسيا',
        submissionType: 'مشروعات_صغيرة_مكتمل',
        trackingCode: newTrackingCode
      };

      const updatedDocs = Object.assign({}, existingCase.documents_data || {}, window.formData?.documents || {});
      if (fGuarantorFront) updatedDocs.guarantorIdFront = await window.uploadFileToDriveOrStorage(fGuarantorFront, { ...uploadMetaBase, prefix: 'Guarantor_ID_Front' });
      if (fGuarantorBack) updatedDocs.guarantorIdBack = await window.uploadFileToDriveOrStorage(fGuarantorBack, { ...uploadMetaBase, prefix: 'Guarantor_ID_Back' });
      if (fPlace) updatedDocs.projectPlacePhoto = await window.uploadFileToDriveOrStorage(fPlace, { ...uploadMetaBase, prefix: 'Place_Photo' });
      if (fCriminal) updatedDocs.criminalRecord = await window.uploadFileToDriveOrStorage(fCriminal, { ...uploadMetaBase, prefix: 'Criminal_Record' });
      if (fFeasibility) updatedDocs.feasibilityStudy = await window.uploadFileToDriveOrStorage(fFeasibility, { ...uploadMetaBase, prefix: 'Feasibility_Study' });
      if (fOther) updatedDocs.guarantorAndOtherDocs = await window.uploadFileToDriveOrStorage(fOther, { ...uploadMetaBase, prefix: 'Other_Docs' });

      const updatedHusband = Object.assign({}, existingCase.husband_data || {}, window.formData?.husband || {});
      const updatedProjectData = Object.assign({}, existingCase.project_data || {}, {
        stage: 'completed', completionSubmitted: true, completedAt: new Date().toISOString(),
        projectType, locationType, projectAge, totalCost, workersCount, expectedReturn, description,
        guarantorName, guarantorPhone, guarantorJob
      });

      const { error } = await window.supabaseClient
        .from('families')
        .update({
          tracking_code: newTrackingCode,
          is_completion_active: false,
          allow_edit: false,
          applicant_name: [updatedHusband.name1, updatedHusband.name2, updatedHusband.name3].filter(Boolean).join(' ') || existingCase.applicant_name,
          husband_data: updatedHusband,
          wife_data: window.formData?.wife || existingCase.wife_data || {},
          children_data: window.formData?.children || existingCase.children_data || [],
          expenses_data: window.formData?.expenses || existingCase.expenses_data || {},
          incomes_data: window.formData?.incomes || existingCase.incomes_data || {},
          housing_data: window.formData?.housing || existingCase.housing_data || {},
          documents_data: updatedDocs,
          project_data: updatedProjectData,
          eligibility_verdict: 'مكتمل الأوراق - قيد البحث الميداني والاعتماد النهائي'
        })
        .eq('id', caseId);

      if (error) throw error;

      window.ACTIVE_PROJECT_COMPLETION_CASE = null;
      alert(`✅ تم استكمال ورفع أوراق المشروع وبيانات الضامن بنجاح!\n• أصبح الرقم الأولي (${existingCase.initial_tracking_code}) غير نشط.\n• رقم المتابعة الجديد الخاص بك: ${newTrackingCode}`);
      if (typeof window.showSection === 'function') window.showSection('home');
    } catch (err) {
      alert('❌ حدث خطأ أثناء حفظ البيانات: ' + (err.message || err));
    }
  };

  async function deleteCaseFilesFromGoogleDrive(trackingCode, initialCode) {
    const driveUrl = 'https://script.google.com/macros/s/AKfycbwefZy3JgwA9Cc4ZCxSGMEVdi-ZZAvn47Kk6I-RPDFXNpk0xLqJ65Z4qLx_WzWAiL2e/exec';
    if (!driveUrl || !driveUrl.includes('script.google.com/macros/s/')) return;

    const codes = Array.from(new Set([trackingCode, initialCode].map(c => String(c || '').trim()).filter(Boolean)));
    for (const c of codes) {
      try {
        const formBody = new URLSearchParams();
        formBody.append('payload', JSON.stringify({ action: 'delete_case_files', trackingCode: c }));
        await fetch(driveUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
          body: formBody.toString()
        });
      } catch (e) {
        console.warn('Drive delete warning:', e);
      }
    }
  }

  // اعتراض النقر على أي رابط قديم يحمل google.com_ لمنع صفحة خطأ المتصفح
  document.addEventListener('click', function(e) {
    const anchor = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!anchor) return;
    const href = String(anchor.getAttribute('href') || '').trim();
    if (href.toLowerCase().includes('google.com_') || href.endsWith('_')) {
      e.preventDefault();
      alert('⚠️ هذا المرفق يملك رابطاً قديماً غير صالح (google.com_). يرجى حذف هذه الحالة التجريبية القديمة وتسجيل حالة جديدة ليظهر رابط Google Drive الصحيح.');
    }
  }, true);

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

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'nav-btn';
      delBtn.style.cssText = 'background:#b91c1c; color:#fff; padding:3px 6px; font-size:11px;';
      delBtn.textContent = '🗑️ رفض وحذف الصور';
      delBtn.onclick = () => window.adminRejectAndPurgeCase(caseObj.id);
      actionsCell.appendChild(delBtn);
    });
  };

  window.adminRejectAndPurgeCase = async function(caseId) {
    const item = (window.ALL_ADMIN_CASES || []).find(c => String(c.id) === String(caseId));
    if (!item || !window.supabaseClient) return;
    if (!confirm(`⚠️ هل أنت متأكد من رفض وحذف طلب (${item.applicant_name || item.tracking_code}) ومسح صوره من Google Drive نهائياً؟`)) return;
    await deleteCaseFilesFromGoogleDrive(item.tracking_code, item.initial_tracking_code);
    const { error } = await window.supabaseClient.from('families').delete().eq('id', caseId);
    if (error) return alert('❌ تعذر حذف الحالة: ' + error.message);
    window.ALL_ADMIN_CASES = (window.ALL_ADMIN_CASES || []).filter(c => String(c.id) !== String(caseId));
    window.filterAndRenderCasesTable();
    alert('✅ تم رفض الحالة وحذف سجلها وصورها من Google Drive بنجاح.');
  };

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
      const msg = `مؤسسة الحافظ للتنمية والخدمات\nمرحباً أ/ ${item.applicant_name || 'المستفيد'}\nتم فتح صلاحية التعديل واستكمال المرفقات لطلبكم رقم (${code}).`;
      if (phone && confirm('✅ تم فتح التعديل للحالة.\nهل تريد إرسال رسالة واتساب للمستفيد؟')) window.triggerInstantWhatsApp(phone, msg);
    }
  };

  window.adminActivateProjectCompletion = async function(caseId) {
    const item = (window.ALL_ADMIN_CASES || []).find(c => String(c.id) === String(caseId));
    if (!item || !window.supabaseClient) return;
    const { error } = await window.supabaseClient.from('families').update({ is_completion_active: true, status: 'approved' }).eq('id', caseId);
    if (error) return alert('❌ تعذر التفعيل: ' + error.message);
    item.is_completion_active = true; item.status = 'approved';
    window.filterAndRenderCasesTable();
    const initCode = item.initial_tracking_code || item.tracking_code;
    const phone = item.husband_data?.whatsapp || item.husband_data?.phone || '';
    const msg = `مؤسسة الحافظ للتنمية والخدمات\nمبروك أ/ ${item.applicant_name || 'صاحب الطلب'}، تمت الموافقة المبدئية على طلب المشروع.\nرقم الطلب الأولي: ${initCode}\nادخل على الموقع واختر (+ طلب مساعدة) ثم (مشروع تمكين اقتصادي صغير) وأدخل الرقم (${initCode}) في الخانة الجانبية لاستكمال بيانات الأسرة والمشروع والضامن.`;
    if (phone) window.triggerInstantWhatsApp(phone, msg);
  };

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
              const msgKey = registerWaMessage(waMsg);
              return `<tr style="background:${inst.is_paid ? '#f0fdf4' : '#fff'};">
                <td><strong>${inst.installment_number} / 20</strong></td>
                <td>${window.escapeHtml(mLabel)}</td>
                <td><strong>${inst.amount} ج.م</strong></td>
                <td>${inst.is_paid ? '<span style="color:#15803d; font-weight:800;">✅ مسدد</span>' : '<span style="color:#b91c1c; font-weight:700;">⏳ غير مسدد</span>'}</td>
                <td class="no-print" style="display:flex; gap:5px; flex-wrap:wrap;">
                  <button type="button" onclick="toggleInstallmentPayment('${window.escapeHtml(inst.id)}', '${window.escapeHtml(familyId)}', ${!inst.is_paid})" class="nav-btn" style="background:${inst.is_paid ? '#64748b' : '#15803d'}; color:#fff; padding:3px 8px; font-size:11px;">${inst.is_paid ? 'تراجع' : '✔️ سداد'}</button>
                  <button type="button" onclick="window.openRegisteredWhatsApp('${window.escapeHtml(clientPhone)}', '${msgKey}')" class="nav-btn" style="background:#0284c7; color:#fff; padding:3px 8px; font-size:11px;">💬 واتساب</button>
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

  async function loadUpcomingInstallmentsBanner(targetId, userObj) {
    const host = document.getElementById(targetId);
    if (!host || !window.supabaseClient) return;
    const limitDate = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
    const { data: dueItems } = await window.supabaseClient
      .from('project_installments')
      .select('*, families(*)')
      .eq('is_paid', false)
      .lte('due_date', limitDate)
      .order('due_date', { ascending: true });

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
      const msgKey = registerWaMessage(msg);
      return `<div style="background:#fff; border:1px solid #fecaca; padding:6px 10px; border-radius:6px; margin-bottom:4px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px; font-size:12px;">
        <span><strong>${window.escapeHtml(nm)}</strong> — قسط #${r.installment_number} (${r.amount} ج.م) — استحقاق: <strong style="color:#b91c1c;">${r.due_date}</strong></span>
        <div style="display:flex; gap:5px;">
          <button type="button" onclick="window.openRegisteredWhatsApp('${window.escapeHtml(ph)}', '${msgKey}')" class="nav-btn" style="background:#16a34a; color:#fff; padding:3px 8px; font-size:11px;">💬 تذكير واتساب</button>
          <button type="button" onclick="window.openProjectInstallmentsModal('${window.escapeHtml(f.id)}')" class="nav-btn" style="background:#7e22ce; color:#fff; padding:3px 8px; font-size:11px;">💳 الأقساط</button>
        </div></div>`;
    }).join('');
    host.prepend(div);
  }

  const origAdminCases = window.renderAdminCasesSection;
  window.renderAdminCasesSection = function() {
    if (origAdminCases) origAdminCases.apply(this, arguments);
    loadUpcomingInstallmentsBanner('admin-tab-cases', window.currentUser);
  };

  const origMemberPortal = window.renderMemberPortal;
  window.renderMemberPortal = async function(user) {
    if (origMemberPortal) await origMemberPortal.apply(this, arguments);
    const area = document.getElementById('dashboard-area');
    if (area?.firstElementChild) {
      area.firstElementChild.id = area.firstElementChild.id || 'member-portal-card';
      loadUpcomingInstallmentsBanner(area.firstElementChild.id, user);
    }
  };

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

    if (isSmallProjectSelected(data.intervention_type)) {
      window.ACTIVE_PROJECT_COMPLETION_CASE = data;
    } else {
      window.ACTIVE_EDIT_CASE = data;
    }

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

  const origHandlePreview = window.handleImmediateAttachmentPreview;
  window.handleImmediateAttachmentPreview = async function(inputEl, explicitDocKey = '', statusBoxId = '') {
    const rawFile = inputEl?.files?.item(0);
    if (rawFile && window.GOOGLE_DRIVE_WEB_APP_URL && typeof window.uploadFileToDriveOrStorage === 'function') {
      const village = document.getElementById('h-village')?.value || window.formData?.husband?.village || 'إهناسيا';
      const subType = window.formData?.interventionType || 'مساعدات_اجتماعية';
      const code = window.ACTIVE_EDIT_CASE?.tracking_code || ('DRAFT-' + Date.now());
      const res = await window.uploadFileToDriveOrStorage(rawFile, {
        year: new Date().getFullYear().toString(), village, submissionType: subType, trackingCode: code
      });
      if (res && res.uploaded) {
        const key = explicitDocKey || inputEl.id || 'doc';
        window.WIZARD_ATTACHMENTS_CACHE = window.WIZARD_ATTACHMENTS_CACHE || {};
        window.WIZARD_ATTACHMENTS_CACHE[key] = res;
        window.formData.documents = Object.assign({}, window.formData.documents || {}, { [key]: res });
      }
    }
    if (typeof origHandlePreview === 'function') return origHandlePreview.apply(this, arguments);
  };

  const origSubmitWizard = window.submitFullWizardApplication;
  window.submitFullWizardApplication = async function() {
    if (window.ACTIVE_EDIT_CASE && window.supabaseClient) {
      const editId = window.ACTIVE_EDIT_CASE.id;
      const { error } = await window.supabaseClient.from('families').update({
        husband_data: window.formData.husband || {},
        wife_data: window.formData.wife || {},
        children_data: window.formData.children || [],
        expenses_data: window.formData.expenses || {},
        incomes_data: window.formData.incomes || {},
        housing_data: window.formData.housing || {},
        documents_data: Object.assign({}, window.ACTIVE_EDIT_CASE.documents_data || {}, window.formData.documents || {}),
        allow_edit: false,
        updated_at: new Date().toISOString()
      }).eq('id', editId);
      if (error) return alert('❌ تعذر حفظ التعديلات: ' + error.message);
      window.ACTIVE_EDIT_CASE = null;
      alert('✅ تم حفظ التعديلات بنجاح وإغلاق صلاحية التعديل المؤقتة.');
      if (typeof window.showSection === 'function') window.showSection('home');
      return;
    }
    if (typeof origSubmitWizard === 'function') return origSubmitWizard.apply(this, arguments);
  };

  window.backupSupabaseFamiliesToGoogleDrive = async function() {
    if (!window.supabaseClient || !window.GOOGLE_DRIVE_WEB_APP_URL) return;
    if (!confirm('هل تريد تصدير نسخة احتياطية كاملة من سجلات الحالات (Supabase) وحفظها كملف أرشيف داخل Google Drive؟')) return;
    const { data, error } = await window.supabaseClient.from('families').select('*');
    if (error || !data) return alert('❌ تعذر جلب البيانات من Supabase.');
    const formBody = new URLSearchParams();
    formBody.append('payload', JSON.stringify({
      action: 'archive_db',
      fileName: `Supabase_Families_Backup_${new Date().toISOString().slice(0, 10)}.json`,
      records: data
    }));
    await fetch(window.GOOGLE_DRIVE_WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: formBody.toString()
    });
    alert(`✅ تم إرسال نسخة الأرشيف (${data.length} حالة) بنجاح إلى مجلد Supabase_Backups داخل Google Drive!`);
  };
})();
