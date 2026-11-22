// dashboards.js - لوحة الإدارة الشاملة ولوحات الأعضاء والكشوف والإقرارات والمستندات
(function() {
  const LOCAL_DOCS_KEY = 'hf_official_documents_v1';
  const LOCAL_DONOR_ASSIGNMENTS_KEY = 'hf_donor_case_assignments_v1';

  window.ALL_ADMIN_CASES = window.ALL_ADMIN_CASES || [];
  window.ALL_ADMIN_USERS = window.ALL_ADMIN_USERS || [];
  window.ALL_ADMIN_ORGANIZATIONS = window.ALL_ADMIN_ORGANIZATIONS || [];
  window.ALL_ADMIN_GRIEVANCES = window.ALL_ADMIN_GRIEVANCES || [];
  window.ALL_OFFICIAL_DOCS = window.ALL_OFFICIAL_DOCS || [];
  window.SELECTED_CASE_IDS = window.SELECTED_CASE_IDS || new Set();
  window.MEMBER_PORTAL_CASES = window.MEMBER_PORTAL_CASES || [];
  window.MEMBER_SELECTED_CASE_IDS = window.MEMBER_SELECTED_CASE_IDS || new Set();

  function isCurrentUserAdmin(userObj) {
    const u = userObj || window.currentUser || (() => {
      try { return JSON.parse(sessionStorage.getItem('hf_current_user') || 'null'); } catch (_) { return null; }
    })();
    if (!u) return false;
    const role = String(u.role || '').trim().toLowerCase();
    return ['admin', 'super_admin', 'مدير', 'أدمن'].includes(role);
  }

  function escapeAttr(val) {
    return window.escapeHtml(String(val ?? '')).replace(/"/g, '&quot;');
  }

  window.triggerInstantWhatsApp = function(rawPhone, messageText) {
    const cleanPhone = String(rawPhone || '').replace(/\D/g, '');
    if (!cleanPhone) return;
    const intlPhone = cleanPhone.startsWith('20') ? cleanPhone : ('20' + cleanPhone.replace(/^0/, ''));
    const url = `https://wa.me/${intlPhone}?text=${encodeURIComponent(messageText || '')}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  window.triggerInstantEmail = function(toEmail, subject, bodyText) {
    const cleanEmail = String(toEmail || '').trim();
    if (!cleanEmail) return;
    const mailtoUrl = `mailto:${encodeURIComponent(cleanEmail)}?subject=${encodeURIComponent(subject || 'إشعار من مؤسسة الحافظ للتنمية والخدمات')}&body=${encodeURIComponent(bodyText || '')}`;
    window.open(mailtoUrl, '_blank', 'noopener,noreferrer');
  };

  // إرسال مزدوج: واتساب + بريد إلكتروني معاً في حالة توفر البريد الإلكتروني
  async function sendDualChannelNotice({ phone, email, subject, message }) {
    const hasPhone = Boolean(String(phone || '').replace(/\D/g, ''));
    const cleanEmail = String(email || '').trim();
    const hasEmail = Boolean(cleanEmail);

    if (hasEmail && typeof window.sendSystemEmail === 'function') {
      try {
        await window.sendSystemEmail({
          to: cleanEmail,
          subject: subject || 'مؤسسة الحافظ للتنمية والخدمات',
          text: message
        });
      } catch (e) {
        console.warn('sendSystemEmail fallback:', e);
      }
    }

    if (hasPhone) {
      window.triggerInstantWhatsApp(phone, message);
    }

    if (hasEmail && typeof window.sendSystemEmail !== 'function') {
      setTimeout(() => {
        window.triggerInstantEmail(cleanEmail, subject || 'مؤسسة الحافظ للتنمية والخدمات', message);
      }, hasPhone ? 350 : 0);
    }
  }

  function getHusbandFullName(caseObj) {
    const h = (caseObj && caseObj.husband_data && typeof caseObj.husband_data === 'object') ? caseObj.husband_data : {};
    return [h.name1, h.name2, h.name3].filter(Boolean).join(' ').trim();
  }

  function getWifeFullName(caseObj) {
    const w = (caseObj && caseObj.wife_data && typeof caseObj.wife_data === 'object') ? caseObj.wife_data : {};
    return [w.name1, w.name2, w.name3].filter(Boolean).join(' ').trim();
  }

  function isHusbandLivingWithFamily(caseObj) {
    const h = (caseObj && caseObj.husband_data && typeof caseObj.husband_data === 'object') ? caseObj.husband_data : {};
    const statusText = String(h.status || h.socialStatus || h.livingStatus || '').trim();
    if (!statusText) return Boolean(getHusbandFullName(caseObj));
    return statusText.includes('مقيم مع الأسرة') || statusText.includes('مقيم مع الاسرة') || statusText === 'مقيم';
  }

  // اسم الملف: باسم الزوج إذا كان (مقيم مع الأسرة)، وفي باقي الحالات باسم الزوجة
  function getCasePrimaryDisplayName(caseObj) {
    if (!caseObj) return 'غير محدد';
    const hName = getHusbandFullName(caseObj);
    const wName = getWifeFullName(caseObj);
    if (isHusbandLivingWithFamily(caseObj)) {
      return hName || wName || caseObj.applicant_name || 'غير محدد';
    }
    return wName || hName || caseObj.applicant_name || 'غير محدد';
  }

  function getCaseApplicantPhone(caseObj) {
    if (!caseObj) return '';
    const h = caseObj.husband_data || {};
    const w = caseObj.wife_data || {};
    return String(caseObj.phone || h.whatsapp || h.phone || w.phone || '').trim();
  }

  function getCaseApplicantEmail(caseObj) {
    if (!caseObj) return '';
    const h = caseObj.husband_data || {};
    const w = caseObj.wife_data || {};
    return String(caseObj.email || caseObj.applicant_email || h.email || w.email || '').trim();
  }

  function getCaseApplicantName(caseObj) {
    return getCasePrimaryDisplayName(caseObj) || 'صاحب الطلب';
  }

  function formatCaseStatusArabic(status) {
    if (status === 'approved' || status === 'مستحق') return 'مقبول للصرف / مستحق';
    if (status === 'not_eligible' || status === 'غير مستحق') return 'غير مستحق';
    if (status === 'rejected' || status === 'مرفوض') return 'مرفوض';
    return 'قيد المراجعة';
  }

  function formatEvaluationDecisionArabic(decision) {
    if (decision === 'eligible' || decision === 'مستحق' || decision === 'approved') return 'مستحق';
    if (decision === 'not_eligible' || decision === 'غير مستحق') return 'غير مستحق';
    if (decision === 'rejected' || decision === 'مرفوض') return 'مرفوض';
    return 'قيد التقييم';
  }

  function formatPersonHealthDetailed(person, fallbackRoleLabel = '') {
    const p = person || {};
    const health = String(p.health || 'سليم').trim();
    if (health === 'سليم') {
      return fallbackRoleLabel ? `${fallbackRoleLabel}: سليم` : 'سليم';
    }
    const parts = [health];
    if (p.disabilityType) parts.push(`نوع الإعاقة/الحالة: ${p.disabilityType}`);
    if (p.illnessType && p.illnessType !== p.disabilityType) parts.push(`التصنيف: ${p.illnessType}`);
    if (p.illnessName) parts.push(`التشخيص: ${p.illnessName}`);
    if (p.medicalNeed) parts.push(`الإجراء: ${p.medicalNeed}`);
    if (p.hasServiceCard) parts.push(`كارت الخدمات المتكاملة: ${p.hasServiceCard}`);
    if (p.monthlyCost) parts.push(`تكلفة شهرية: ${p.monthlyCost} جنيه`);
    if (p.insuranceCoverage && p.insuranceCoverage !== 'غير محدد') parts.push(`تغطية: ${p.insuranceCoverage}`);
    const summary = parts.join(' | ');
    return fallbackRoleLabel ? `${fallbackRoleLabel}: ${summary}` : summary;
  }

  function caseHasDisabilityOrServiceCard(caseObj) {
    const h = caseObj?.husband_data || {};
    const w = caseObj?.wife_data || {};
    const kids = Array.isArray(caseObj?.children_data) ? caseObj.children_data : [];
    const checkPerson = (p) => {
      if (!p) return false;
      if (p.health === 'من ذوي الإعاقة') return true;
      if (['إعاقة ذهنية', 'إعاقة حركية', 'إعاقة سمعية', 'إعاقة بصرية'].includes(p.disabilityType || p.illnessType)) return true;
      if (p.hasServiceCard && p.hasServiceCard !== 'لا') return true;
      return false;
    };
    return checkPerson(h) || checkPerson(w) || kids.some(checkPerson);
  }

  function isCaseAssignedToMember(caseObj, memberUser) {
    if (!caseObj || !memberUser) return false;
    const email = String(memberUser.email || '').trim().toLowerCase();
    const fullName = String(memberUser.name || memberUser.full_name || '').trim();
    const assignedEmail = String(caseObj.assigned_to_email || '').trim().toLowerCase();
    const assignedName = String(caseObj.assigned_to_name || '').trim();
    if (email && assignedEmail === email) return true;
    if (fullName && assignedName && assignedName.includes(fullName)) return true;
    return false;
  }

  async function buildStatusChangeNotificationMessage({ recipientName, code, entityLabel, statusLabel, replyNote = '', dayText = '', timeText = '', placeText = '' }) {
    const cfg = typeof window.getFoundationSettings === 'function' ? await window.getFoundationSettings() : {};
    const orgName = cfg.org_name || 'مؤسسة الحافظ للتنمية والخدمات';
    const waPhone = cfg.phone_whatsapp || '01000880156';
    const admPhone = cfg.phone_admin || '01155540066';

    const lines = [
      `${orgName}`,
      `مرحباً أ/ ${recipientName || 'صاحب الطلب'}`,
      `نفيدكم بأنه تم تحديث حالة (${entityLabel}) رقم (${code || '-'}) إلى: ${statusLabel}.`
    ];
    if (replyNote) {
      lines.push(`الرد / الإفادة: ${replyNote}`);
    }
    if (dayText || timeText || placeText) {
      lines.push(`--- تفاصيل الموعد والمكان ---`);
      if (dayText) lines.push(`اليوم: ${dayText}`);
      if (timeText) lines.push(`الميعاد: ${timeText}`);
      if (placeText) lines.push(`المكان: ${placeText}`);
    }
    lines.push(`للتواصل والاستفسار: واتساب ${waPhone} | إدارة ${admPhone}`);
    return lines.join('\n');
  }

  async function buildDisbursementPickupMessage(caseObj, scheduleInfo) {
    const cfg = typeof window.getFoundationSettings === 'function' ? await window.getFoundationSettings() : {};
    const orgName = cfg.org_name || 'مؤسسة الحافظ للتنمية والخدمات';
    const waPhone = cfg.phone_whatsapp || '01000880156';
    const admPhone = cfg.phone_admin || '01155540066';

    const name = getCaseApplicantName(caseObj);
    const code = caseObj.tracking_code || '-';
    const aid = caseObj.intervention_type || 'المساعدة المقررة';
    const mode = scheduleInfo.mode || 'hq';
    const dayText = scheduleInfo.dayText || 'حسب الموعد المحدد';
    const timeText = scheduleInfo.timeText || 'من 10:00 ص إلى 2:00 م';
    const placeText = mode === 'call_for_location'
      ? (scheduleInfo.placeText || 'يرجى التواصل معنا لمعرفة مكان الاستلام المحدد')
      : (scheduleInfo.placeText || 'مقر مؤسسة الحافظ - عبد الصمد، مركز إهناسيا');

    const lines = [
      `${orgName}`,
      `مرحباً أ/ ${name}`,
      `تم اعتماد صرف (${aid}) لطلبكم رقم (${code}).`,
      `اليوم: ${dayText}`,
      `الميعاد: ${timeText}`,
      `المكان: ${placeText}`
    ];
    if (scheduleInfo.extraNote) {
      lines.push(`ملاحظات: ${scheduleInfo.extraNote}`);
    }
    lines.push(`نرجو الالتزام بالموعد المحدد لعدم الازدحام. للاستفسار: ${waPhone} / ${admPhone}`);
    return lines.join('\n');
  }

  function showQuickMessageSendModal({ title, phone, email = '', subject = '', defaultMessage }) {
    let modal = document.getElementById('hf-quick-msg-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'hf-quick-msg-modal';
      modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:9999; display:flex; align-items:center; justify-content:center; padding:14px;';
      document.body.appendChild(modal);
    }
    modal.classList.remove('hidden');
    const cleanPhone = String(phone || '').trim();
    const cleanEmail = String(email || '').trim();

    modal.innerHTML = `
      <div style="background:#fff; color:#0f172a; max-width:560px; width:100%; border-radius:14px; padding:20px;">
        <h4 style="margin:0 0 10px; color:#064e3b;">${window.escapeHtml(title || 'إرسال رسالة إشعار')}</h4>
        <div class="grid-2">
          <div>
            <label style="font-size:12px; font-weight:700;">رقم الهاتف (واتساب):</label>
            <input id="qmsg-phone" value="${escapeAttr(cleanPhone)}" placeholder="01xxxxxxxxx" style="margin:0;">
          </div>
          <div>
            <label style="font-size:12px; font-weight:700;">البريد الإلكتروني:</label>
            <input id="qmsg-email" value="${escapeAttr(cleanEmail)}" placeholder="example@domain.com" style="margin:0;">
          </div>
        </div>
        <label style="font-size:12px; font-weight:700; display:block; margin-top:8px;">نص الرسالة:</label>
        <textarea id="qmsg-body" rows="7" style="margin:0;">${window.escapeHtml(defaultMessage || '')}</textarea>
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:12px;">
          <button type="button" id="qmsg-both-btn" class="action-btn">📲 إرسال (واتساب + بريد إلكتروني معاً)</button>
          <button type="button" id="qmsg-wa-btn" class="nav-btn" style="background:#16a34a; color:#fff;">💬 واتساب فقط</button>
          <button type="button" id="qmsg-email-btn" class="nav-btn" style="background:#1d4ed8; color:#fff;">✉️ بريد فقط</button>
          <button type="button" id="qmsg-copy-btn" class="nav-btn btn-gold">📋 نسخ النص</button>
          <button type="button" onclick="document.getElementById('hf-quick-msg-modal').classList.add('hidden')" class="nav-btn">إغلاق</button>
        </div>
      </div>`;

    document.getElementById('qmsg-both-btn').onclick = async function() {
      const targetPhone = (document.getElementById('qmsg-phone')?.value || '').trim();
      const targetEmail = (document.getElementById('qmsg-email')?.value || '').trim();
      const body = (document.getElementById('qmsg-body')?.value || '').trim();
      if (!targetPhone && !targetEmail) return alert('⚠️ لا يوجد رقم هاتف أو بريد إلكتروني مسجل.');
      await sendDualChannelNotice({
        phone: targetPhone,
        email: targetEmail,
        subject: subject || title || 'إشعار من مؤسسة الحافظ للتنمية والخدمات',
        message: body
      });
    };

    document.getElementById('qmsg-wa-btn').onclick = function() {
      const targetPhone = (document.getElementById('qmsg-phone')?.value || '').trim();
      const body = (document.getElementById('qmsg-body')?.value || '').trim();
      if (!targetPhone) return alert('⚠️ لا يوجد رقم هاتف مسجل لهذا السجل.');
      window.triggerInstantWhatsApp(targetPhone, body);
    };

    document.getElementById('qmsg-email-btn').onclick = async function() {
      const targetEmail = (document.getElementById('qmsg-email')?.value || '').trim();
      const body = (document.getElementById('qmsg-body')?.value || '').trim();
      if (!targetEmail) return alert('⚠️ لا يوجد بريد إلكتروني مسجل لهذا السجل.');
      await sendDualChannelNotice({
        phone: '',
        email: targetEmail,
        subject: subject || title || 'إشعار من مؤسسة الحافظ للتنمية والخدمات',
        message: body
      });
    };

    document.getElementById('qmsg-copy-btn').onclick = async function() {
      const body = document.getElementById('qmsg-body')?.value || '';
      try {
        await navigator.clipboard.writeText(body);
        alert('✅ تم نسخ نص الرسالة.');
      } catch (_) {
        const ta = document.getElementById('qmsg-body');
        ta?.select();
        document.execCommand('copy');
        alert('✅ تم نسخ نص الرسالة.');
      }
    };
  }

  function buildPrintableSheetHtml(cfg, bodyContent, docTitle, includeChrome = true) {
    const headerPart = includeChrome ? window.getOfficialHeaderHtml(cfg) : '';
    const footerPart = includeChrome ? window.getOfficialFooterHtml(cfg) : '';
    return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
      <title>${window.escapeHtml(docTitle || 'مستند رسمي - مؤسسة الحافظ')}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; color: #0f172a; }
        .box { border: 1px solid #cbd5e1; padding: 22px; min-height: 255mm; display: flex; flex-direction: column; justify-content: space-between; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 12px; }
        th, td { border: 1px solid #334155; padding: 6px 8px; text-align: right; vertical-align: top; }
        th { background: #064e3b; color: #fff; }
      </style></head><body>
      <div class="box">
        <div>
          ${headerPart}
          ${bodyContent}
        </div>
        ${footerPart}
      </div>
      <script>window.onload=function(){window.print();};<\/script>
      </body></html>`;
  }

  function openPrintWindowWithHtml(htmlContent) {
    const w = window.open('', '_blank', 'width=980,height=1000');
    if (!w) return alert('يرجى السماح بالنوافذ المنبثقة.');
    w.document.open();
    w.document.write(htmlContent);
    w.document.close();
  }

  window.getOfficialHeaderHtml = function(cfg) {
    const c = cfg || {};
    return `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #064e3b; padding-bottom:10px; margin-bottom:14px; font-size:12px;">
        <div style="line-height:1.7;">
          <strong>مديرية التضامن الاجتماعي ببني سويف</strong><br>
          إدارة إهناسيا الاجتماعية<br>
          <strong>${c.org_name || 'مؤسسة الحافظ للتنمية والخدمات'}</strong><br>
          ${c.reg_no || 'مشهرة برقم 2202 لسنة 2025'}
        </div>
        <div style="text-align:left;">
          <img src="logo.jpg" alt="شعار المؤسسة" style="height:56px; width:56px; border-radius:50%; border:1px solid #b45309; object-fit:cover;" onerror="this.style.display='none'">
        </div>
      </div>`;
  };

  window.getOfficialFooterHtml = function(cfg) {
    const c = cfg || {};
    return `
      <div style="border-top:1px solid #94a3b8; margin-top:20px; padding-top:8px; display:flex; justify-content:space-between; font-size:11px; color:#475569;">
        <span>واتساب رسمي: ${c.phone_whatsapp || '01000880156'} | إدارة: ${c.phone_admin || '01155540066'}</span>
        <span>${c.admin_email || 'alhafiz52025@gmail.com'} | alhafiz-eg.azurewebsites.net</span>
      </div>`;
  };

  function readLocalDonorAssignments() {
    try {
      const raw = localStorage.getItem(LOCAL_DONOR_ASSIGNMENTS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function writeLocalDonorAssignments(mapObj) {
    try {
      localStorage.setItem(LOCAL_DONOR_ASSIGNMENTS_KEY, JSON.stringify(mapObj || {}));
    } catch (_) {}
  }

  function normalizeDonorArray(val) {
    if (Array.isArray(val)) return val.map(s => String(s || '').trim()).filter(Boolean);
    if (typeof val === 'string' && val.trim()) {
      return val.split(/[،,]/).map(s => s.trim()).filter(Boolean);
    }
    return [];
  }

  function hydrateCasesWithDonorAssignments(cases) {
    const mapObj = readLocalDonorAssignments();
    return (cases || []).map(c => {
      const key = String(c.id || c.tracking_code || '');
      const savedLocal = normalizeDonorArray(mapObj[key]);
      const dbDonors = normalizeDonorArray(c.assigned_donors);
      const legacyDonor = normalizeDonorArray(c.assigned_donor_name);
      const merged = Array.from(new Set([...dbDonors, ...legacyDonor, ...savedLocal]));
      return {
        ...c,
        assigned_donors: merged,
        assigned_donor_name: merged.join('، ')
      };
    });
  }

  function getCaseAssignedMemberDisplay(c) {
    if (!c) return '';
    if (c.assigned_to_name && c.assigned_to_name !== 'غير مسند') return c.assigned_to_name;
    if (c.assigned_to_email) {
      const u = (window.ALL_ADMIN_USERS || []).find(x => (x.email || '').toLowerCase() === String(c.assigned_to_email).toLowerCase());
      return u ? (u.full_name || u.email) : c.assigned_to_email;
    }
    return '';
  }

  function getCaseAssignedDonorsList(c) {
    if (!c) return [];
    return normalizeDonorArray(c.assigned_donors || c.assigned_donor_name);
  }

  function getCaseAttachmentsAudit(caseObj) {
    let docsObj = caseObj && caseObj.documents_data;
    if (typeof docsObj === 'string') {
      try {
        docsObj = JSON.parse(docsObj);
      } catch (_) {
        docsObj = {};
      }
    }
    if (!docsObj || typeof docsObj !== 'object') {
      docsObj = {};
    }

    const h = (caseObj && caseObj.husband_data && typeof caseObj.husband_data === 'object') ? caseObj.husband_data : {};
    const w = (caseObj && caseObj.wife_data && typeof caseObj.wife_data === 'object') ? caseObj.wife_data : {};

    const hasValidAttachment = (val) => {
      if (!val) return false;
      if (typeof val === 'string') {
        const s = val.trim();
        return s.length > 0 && s !== 'null' && s !== 'undefined';
      }
      if (Array.isArray(val)) {
        return val.some(v => hasValidAttachment(v));
      }
      if (typeof val === 'object') {
        if (val.uploadError) return false;
        const candidate =
          val.path ||
          val.url ||
          val.publicUrl ||
          val.dataUrl ||
          val.base64 ||
          val.fileName ||
          val.name;
        return Boolean(candidate && String(candidate).trim().length > 0);
      }
      return Boolean(val);
    };

    const pickFirstValid = (...candidates) => {
      for (const c of candidates) {
        if (hasValidAttachment(c)) return c;
      }
      return null;
    };

    const rawItems = [
      {
        label: 'صورة بطاقة الزوج (وجه)',
        value: pickFirstValid(docsObj.husband_id_front, docsObj.hIdFront, docsObj['h-id-front'], h.id_front, h.idFront)
      },
      {
        label: 'صورة بطاقة الزوج (ظهر)',
        value: pickFirstValid(docsObj.husband_id_back, docsObj.hIdBack, docsObj['h-id-back'], h.id_back, h.idBack)
      },
      {
        label: 'صورة بطاقة الزوجة (وجه)',
        value: pickFirstValid(docsObj.wife_id_front, docsObj.wIdFront, docsObj['w-id-front'], w.id_front, w.idFront)
      },
      {
        label: 'صورة بطاقة الزوجة (ظهر)',
        value: pickFirstValid(docsObj.wife_id_back, docsObj.wIdBack, docsObj['w-id-back'], w.id_back, w.idBack)
      },
      {
        label: 'البحث الاجتماعي المعتمد',
        value: pickFirstValid(docsObj.social_research, docsObj.socialResearch, docsObj['doc-social-research'], docsObj.hSocialDoc, docsObj.wSocialDoc, caseObj && caseObj.social_research_doc)
      },
      {
        label: 'عقد الإيجار / إثبات السكن',
        value: pickFirstValid(docsObj.lease_contract, docsObj.housing_lease, docsObj.lease, docsObj['doc-lease'], caseObj && caseObj.lease_doc)
      },
      {
        label: 'التقارير الطبية / مستندات إضافية',
        value: pickFirstValid(docsObj.medical_report, docsObj.hMedicalDoc, docsObj.wMedicalDoc, docsObj.mHealthDoc, docsObj.mCertDoc, docsObj.insuranceH, docsObj.insuranceW, docsObj.schoolEnroll, docsObj['h-medical-doc'], docsObj['w-medical-doc'], caseObj && caseObj.medical_doc)
      }
    ];

    const items = rawItems.map((it, idx) => {
      const attached = hasValidAttachment(it.value);
      return {
        index: idx + 1,
        label: it.label,
        value: it.value,
        attached,
        statusText: attached ? '✅ مرفق' : '❌ غير مرفق (لم يتم رفعه)'
      };
    });

    const attachedCount = items.filter(x => x.attached).length;
    const missingCount = items.length - attachedCount;

    return {
      items,
      totalCount: items.length,
      attachedCount,
      missingCount,
      isComplete: missingCount === 0
    };
  }

  function getAttachmentDisplayInfo(val) {
    if (!val) return { fileName: '', href: '', isImage: false };

    const supabaseUrl =
      (window.supabaseClient && window.supabaseClient.supabaseUrl) ||
      window.SUPABASE_URL ||
      'https://fwyacpvbhwdlivzeiper.supabase.co';

    const buildStoragePublicUrl = (rawPath) => {
      const cleanPath = String(rawPath || '').trim().replace(/^\/+/, '');
      if (!cleanPath) return '';
      if (/^(https?:\/\/|data:|blob:)/i.test(cleanPath)) return cleanPath;
      const normalizedKey = cleanPath.startsWith('foundation-docs/')
        ? cleanPath
        : `foundation-docs/${cleanPath}`;
      return `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/${normalizedKey}`;
    };

    let fileName = '';
    let href = '';

    if (typeof val === 'string') {
      const s = val.trim();
      if (!s || s === 'null' || s === 'undefined') return { fileName: '', href: '', isImage: false };
      const isUrlOrPath = /^(https?:\/\/|data:|blob:|[\w.\-]+\/)/i.test(s);
      href = isUrlOrPath ? buildStoragePublicUrl(s) : '';
      const parts = s.split('/').filter(Boolean);
      fileName = parts.length ? parts[parts.length - 1] : s;
    } else if (typeof val === 'object') {
      const directUrl = val.url || val.publicUrl || val.dataUrl || val.base64 || '';
      const storagePath = val.path || '';
      fileName = String(
        val.fileName ||
        val.name ||
        (storagePath ? storagePath.split('/').pop() : '') ||
        (directUrl && !directUrl.startsWith('data:') ? directUrl.split('/').pop() : '') ||
        'مستند مرفق'
      ).trim();

      href = directUrl
        ? buildStoragePublicUrl(directUrl)
        : (storagePath ? buildStoragePublicUrl(storagePath) : '');
    }

    const isImage = Boolean(
      (href && /^data:image\//i.test(href)) ||
      /\.(jpe?g|png|gif|webp|bmp|svg)(\?|#|$)/i.test(fileName || href)
    );

    return { fileName, href, isImage };
  }

  window.downloadCaseAttachment = async function(caseId, itemIndex) {
    if (!isCurrentUserAdmin()) {
      return alert('⛔ تنزيل المرفقات متاح للأدمن فقط.');
    }
    const allCases = [...(window.ALL_ADMIN_CASES || []), ...(window.MEMBER_PORTAL_CASES || [])];
    const targetCase = allCases.find(c => String(c.id) === String(caseId) || String(c.tracking_code) === String(caseId));
    if (!targetCase) return alert('⚠️ لم يتم العثور على الحالة.');
    const audit = getCaseAttachmentsAudit(targetCase);
    const item = audit.items.find(x => Number(x.index) === Number(itemIndex));
    if (!item || !item.attached) return alert('⚠️ هذا المستند غير مرفق.');

    const info = getAttachmentDisplayInfo(item.value);
    if (!info.href) return alert('⚠️ لا يوجد رابط مباشر متاح لتنزيل هذا الملف.');

    try {
      if (info.href.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = info.href;
        a.download = info.fileName || `attachment_${itemIndex}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }
      const resp = await fetch(info.href);
      if (!resp.ok) throw new Error('تعذر جلب الملف');
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = info.fileName || `attachment_${itemIndex}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 4000);
    } catch (_) {
      window.open(info.href, '_blank', 'noopener,noreferrer');
    }
  };

  window.openFullCaseDetailsModal = function(caseIdOrCode) {
    const allCases = [...(window.ALL_ADMIN_CASES || []), ...(window.MEMBER_PORTAL_CASES || [])];
    const f = allCases.find(c => String(c.id) === String(caseIdOrCode) || String(c.tracking_code) === String(caseIdOrCode));
    if (!f) return alert('⚠️ لم يتم العثور على بيانات الحالة.');

    const canDownload = isCurrentUserAdmin();
    const h = f.husband_data || {};
    const w = f.wife_data || {};
    const housing = f.housing_data || {};
    const sp = housing.social_profile || {};
    const expenses = f.expenses_data || {};
    const incomes = f.incomes_data || {};
    const children = Array.isArray(f.children_data) ? f.children_data : [];
    const audit = getCaseAttachmentsAudit(f);

    const primaryName = getCasePrimaryDisplayName(f);
    const husbandName = getHusbandFullName(f) || '-';
    const wifeName = getWifeFullName(f) || '-';
    const totalInc = Number(f.total_income ?? 0);
    const totalExp = Number(f.total_expenses ?? 0);
    const balance = totalInc - totalExp;
    const balanceText = balance < 0
      ? `عجز شهري: ${Math.abs(balance)} جنيه`
      : (balance > 0 ? `فائض شهري: ${balance} جنيه` : 'متعادل (0 جنيه)');

    let modal = document.getElementById('hf-case-detail-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'hf-case-detail-modal';
      modal.style.cssText = 'position:fixed; inset:0; background:rgba(15,23,42,0.72); z-index:9999; display:flex; align-items:center; justify-content:center; padding:14px;';
      document.body.appendChild(modal);
    }
    modal.classList.remove('hidden');

    const attachRowsHtml = audit.items.map(it => {
      const info = it.attached ? getAttachmentDisplayInfo(it.value) : { fileName: '', href: '', isImage: false };
      let actionsHtml = '<span style="color:#94a3b8; font-size:11px;">لا يوجد ملف</span>';
      if (it.attached) {
        const previewBtn = info.href
          ? `<a href="${escapeAttr(info.href)}" target="_blank" rel="noopener noreferrer" class="nav-btn" style="background:#0284c7; color:#fff; padding:3px 8px; font-size:11px; text-decoration:none;">👁️ معاينة</a>`
          : `<span style="font-size:11px; color:#475569;">مرفق مسجل</span>`;
        const downloadBtn = canDownload
          ? `<button type="button" onclick="downloadCaseAttachment('${escapeAttr(f.id)}', ${it.index})" class="nav-btn" style="background:#065f46; color:#fff; padding:3px 8px; font-size:11px;">⬇️ تنزيل</button>`
          : `<span style="font-size:11px; color:#64748b; background:#f1f5f9; padding:2px 6px; border-radius:6px;">اطلاع فقط (التنزيل للأدمن)</span>`;
        actionsHtml = `<div style="display:flex; gap:5px; flex-wrap:wrap; align-items:center;">${previewBtn}${downloadBtn}</div>`;
      }

      const imgThumb = (it.attached && info.isImage && info.href)
        ? `<div style="margin-top:6px;"><img src="${escapeAttr(info.href)}" alt="${escapeAttr(it.label)}" ${!canDownload ? 'draggable="false" oncontextmenu="return false;"' : ''} style="max-height:95px; max-width:150px; border-radius:6px; border:1px solid #cbd5e1; object-fit:cover;"></div>`
        : '';

      return `
        <tr>
          <td style="text-align:center;">${it.index}</td>
          <td><strong>${window.escapeHtml(it.label)}</strong></td>
          <td style="font-weight:700; color:${it.attached ? '#166534' : '#991b1b'};">${window.escapeHtml(it.statusText)}</td>
          <td>
            <div style="font-size:12px;">${window.escapeHtml(info.fileName || '-')}</div>
            ${imgThumb}
          </td>
          <td>${actionsHtml}</td>
        </tr>`;
    }).join('');

    const childrenHtml = children.length === 0
      ? '<p style="font-size:12px; color:#64748b; margin:4px 0;">لا يوجد أبناء مسجلون.</p>'
      : `<table style="margin-top:6px;">
          <thead><tr><th>#</th><th>الاسم</th><th>السن / النوع</th><th>الحالة الصحية والإعاقة وكارت الخدمات والتكلفة</th></tr></thead>
          <tbody>
            ${children.map((c, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${window.escapeHtml(c.name || '-')}</td>
                <td>${window.escapeHtml((c.gender || '-') + (c.birthDate ? ' | ' + c.birthDate : ''))}</td>
                <td>${window.escapeHtml(formatPersonHealthDetailed(c))}</td>
              </tr>`).join('')}
          </tbody>
        </table>`;

    modal.innerHTML = `
      <div style="background:#fff; color:#0f172a; max-width:880px; width:100%; border-radius:14px; padding:20px; max-height:92vh; overflow-y:auto;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:10px; gap:10px; flex-wrap:wrap;">
          <div>
            <h3 style="margin:0; color:#064e3b;">📂 ملف الحالة الكامل: ${window.escapeHtml(primaryName)}</h3>
            <small style="color:#475569;">كود المتابعة: <strong>${window.escapeHtml(f.tracking_code || '-')}</strong> | الحالة: <strong>${window.escapeHtml(formatCaseStatusArabic(f.status))}</strong></small>
          </div>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button type="button" onclick="printFullCaseFiles(['${escapeAttr(f.id)}'])" class="nav-btn btn-gold" style="padding:5px 10px; font-size:12px;">🖨️ طباعة تقرير الحالة</button>
            <button type="button" onclick="document.getElementById('hf-case-detail-modal').classList.add('hidden')" class="nav-btn" style="background:#dc2626; color:#fff; padding:5px 10px; font-size:12px;">إغلاق</button>
          </div>
        </div>

        <table style="margin-top:12px;">
          <tbody>
            <tr><th>الاسم الظاهر للملف</th><td><strong>${window.escapeHtml(primaryName)}</strong></td><th>نوع المساعدة</th><td>${window.escapeHtml(f.intervention_type || '-')}</td></tr>
            <tr><th>الزوج (الأب) وحالته</th><td>${window.escapeHtml(husbandName)} (${window.escapeHtml(h.status || 'غير محدد')})</td><th>الزوجة (الأم)</th><td>${window.escapeHtml(wifeName)}</td></tr>
            <tr><th>الرقم القومي للزوج</th><td>${window.escapeHtml(h.nid || '-')}</td><th>رقم الهاتف / واتساب</th><td>${window.escapeHtml(h.whatsapp || h.phone || w.phone || '-')}</td></tr>
            <tr><th>العنوان</th><td>${window.escapeHtml((f.center_city || '-') + ' - ' + (f.village_hamlet || '-') + (f.street_details ? ' - ' + f.street_details : ''))}</td><th>التقييم / القرار</th><td>${window.escapeHtml(formatEvaluationDecisionArabic(f.evaluation_decision || f.eligibility_verdict || f.status))}</td></tr>
            <tr><th>صحة الزوج</th><td colspan="3">${window.escapeHtml(formatPersonHealthDetailed(h))}</td></tr>
            <tr><th>صحة الزوجة</th><td colspan="3">${window.escapeHtml(formatPersonHealthDetailed(w))}</td></tr>
            <tr><th>القائم بالإنفاق / مساعدة أخرى</th><td>${window.escapeHtml((sp.actualProvider || '-') + ' | جهة أخرى: ' + (sp.receivesOtherAid || 'لا'))}</td><th>ديون / تاريخ الزيارة</th><td>${window.escapeHtml((sp.debtCreditorType || 'لا يوجد') + ' | زيارة: ' + (sp.visitDate || housing.visit_date || '-'))}</td></tr>
            <tr><th>إجمالي الدخل</th><td>${totalInc} جنيه (${window.escapeHtml(JSON.stringify(incomes || {}))})</td><th>إجمالي المصروفات</th><td>${totalExp} جنيه (${window.escapeHtml(balanceText)})</td></tr>
            <tr><th>بيانات السكن والمرافق</th><td colspan="3">${window.escapeHtml((housing.case || '-') + ' / ' + (housing.type || '-') + ' | كهرباء: ' + (housing.electricityMeter || '-') + ' | مياه: ' + (housing.waterSource || '-') + ' | صرف: ' + (housing.sanitationType || '-'))}</td></tr>
            <tr><th>ملاحظات الباحث</th><td colspan="3">${window.escapeHtml(f.researcher_notes || f.evaluation_notes || housing.opinion || '-')}</td></tr>
          </tbody>
        </table>

        <h4 style="margin:14px 0 6px; color:#064e3b;">👶 بيانات الأبناء (${children.length})</h4>
        ${childrenHtml}

        <h4 style="margin:14px 0 6px; color:#064e3b;">📎 المرفقات والمستندات (${audit.attachedCount}/${audit.totalCount}) — ${canDownload ? 'صلاحية الإدارة: معاينة وتنزيل' : 'صلاحية العضو/الباحث: معاينة واطلاع فقط'}</h4>
        <table>
          <thead>
            <tr><th>#</th><th>المستند</th><th>الحالة</th><th>اسم الملف / معاينة</th><th>الإجراء</th></tr>
          </thead>
          <tbody>${attachRowsHtml}</tbody>
        </table>
      </div>`;
  };

  window.routeLoggedInUser = async function(user) {
    document.getElementById('login-box')?.classList.add('hidden');
    document.getElementById('partner-register-box')?.classList.add('hidden');
    const area = document.getElementById('dashboard-area');
    if (!area) return;
    area.classList.remove('hidden');

    if (isCurrentUserAdmin(user)) {
      await window.renderAdminFullDashboard(user);
    } else {
      await window.renderMemberPortal(user);
    }
  };

  window.renderMemberPortal = async function(user) {
    const area = document.getElementById('dashboard-area');
    const roleNames = { researcher: 'باحث ميداني', volunteer: 'متطوع', partner: 'جهة شريكة', donor: 'جهة مانحة' };
    const displayName = user.name || user.full_name || 'عضو';
    let myCases = [];

    if (window.supabaseClient) {
      let query = window.supabaseClient.from('families').select('*').order('created_at', { ascending: false });
      if (!user.can_view_all_cases) {
        query = query.or(`created_by_email.eq.${user.email},assigned_to_email.eq.${user.email}`);
      }
      const { data } = await query;
      myCases = hydrateCasesWithDonorAssignments(data || []);
    }

    const donorMap = readLocalDonorAssignments();
    if (user.role === 'donor' || user.role === 'partner') {
      let allFam = myCases;
      if (window.supabaseClient && myCases.length === 0) {
        const { data: allData } = await window.supabaseClient.from('families').select('*').order('created_at', { ascending: false });
        allFam = hydrateCasesWithDonorAssignments(allData || []);
      }
      const matched = allFam.filter(f => {
        const donors = getCaseAssignedDonorsList(f);
        const key = String(f.id || f.tracking_code || '');
        const localList = normalizeDonorArray(donorMap[key]);
        const combined = [...donors, ...localList];
        return combined.some(item => item.includes(displayName) || item.includes(user.email));
      });
      const existingIds = new Set(myCases.map(x => String(x.id)));
      matched.forEach(m => {
        if (!existingIds.has(String(m.id))) myCases.push(m);
      });
    }

    window.MEMBER_PORTAL_CASES = myCases;
    const aidTypes = Array.from(new Set(myCases.map(c => c.intervention_type).filter(Boolean)));
    const villages = Array.from(new Set(myCases.map(c => c.village_hamlet).filter(Boolean)));

    area.innerHTML = `
      <div class="card" style="border-top:4px solid var(--primary);">
        <div class="no-print" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-bottom:1px solid var(--border); padding-bottom:12px;">
          <div>
            <h3 style="margin:0; color:var(--primary-dark);">👤 بوابة العضو: ${window.escapeHtml(displayName)}</h3>
            <small>الصفة: <strong>${roleNames[user.role] || user.role}</strong> | البريد: ${window.escapeHtml(user.email)} | المرفقات: <strong>معاينة واطلاع فقط</strong></small>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button type="button" onclick="showSection('apply')" class="action-btn">+ تسجيل حالة جديدة</button>
            <button type="button" onclick="logoutUser()" class="nav-btn" style="background:#dc2626; color:#fff;">تسجيل الخروج</button>
          </div>
        </div>

        ${user.must_change_password ? `
          <div class="no-print" style="background:#fef2f2; border:1px solid #fecaca; padding:14px; border-radius:10px; margin-top:14px; color:#991b1b;">
            <strong>⚠️ تنبيه أمني:</strong> لقد قمت بالدخول باستخدام الرمز المؤقت. يرجى تعيين كلمة مرور جديدة خاصة بك الآن.
          </div>` : ''}

        <div class="no-print" style="background:var(--bg-color); padding:14px; border-radius:10px; border:1px solid var(--border); margin-top:14px;">
          <h4 style="margin:0 0 8px; color:var(--primary-dark);">🔑 تغيير كلمة المرور الخاصة بك</h4>
          <div class="grid-3">
            <input id="mem-temp-or-old" placeholder="الرمز المؤقت أو كلمة السر الحالية" style="margin:0;">
            <input id="mem-new-pass" type="password" placeholder="كلمة السر الجديدة (6 أحرف فأكثر)" style="margin:0;">
            <button type="button" onclick="changeMemberOwnPassword()" class="action-btn" style="margin:0;">حفظ كلمة السر الجديدة</button>
          </div>
        </div>

        <div class="no-print" style="background:#f8fafc; padding:12px; border-radius:10px; border:1px solid #cbd5e1; margin-top:16px;">
          <h4 style="margin:0 0 10px; color:#064e3b;">🔎 فلترة وطباعة الحالات المسندة إليك (${myCases.length})</h4>
          <div class="grid-4">
            <select id="mem-flt-aid" onchange="filterAndRenderMemberCasesTable()" style="margin:0;">
              <option value="">-- كل أنواع المساعدات --</option>
              ${aidTypes.map(a => `<option value="${escapeAttr(a)}">${window.escapeHtml(a)}</option>`).join('')}
            </select>
            <select id="mem-flt-village" onchange="filterAndRenderMemberCasesTable()" style="margin:0;">
              <option value="">-- كل القرى / المناطق --</option>
              ${villages.map(v => `<option value="${escapeAttr(v)}">${window.escapeHtml(v)}</option>`).join('')}
            </select>
            <select id="mem-flt-decision" onchange="filterAndRenderMemberCasesTable()" style="margin:0;">
              <option value="">-- كل القرارات --</option>
              <option value="pending">قيد التقييم</option>
              <option value="مستحق">مستحق</option>
              <option value="غير مستحق">غير مستحق</option>
              <option value="مرفوض">مرفوض</option>
            </select>
            <select id="mem-flt-docs" onchange="filterAndRenderMemberCasesTable()" style="margin:0;">
              <option value="">-- كل حالات المستندات --</option>
              <option value="complete">مكتملة</option>
              <option value="incomplete">ناقصة</option>
            </select>
          </div>

          <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-top:10px;">
            <input id="mem-flt-search" oninput="filterAndRenderMemberCasesTable()" placeholder="بحث بالاسم أو الرقم القومي أو الكود..." style="margin:0; flex:1; min-width:200px;">
            <select id="mem-print-scope" style="margin:0; width:auto;">
              <option value="filtered">طباعة كل الحالات المفلترة</option>
              <option value="selected">طباعة الحالات المحددة فقط</option>
            </select>
            <select id="mem-print-format" style="margin:0; width:auto;">
              <option value="basic">بيانات أساسية</option>
              <option value="full">بيانات كاملة</option>
              <option value="disbursement">كشف صرف</option>
            </select>
            <button type="button" onclick="printMemberAssignedCases()" class="action-btn" style="margin:0; background:#0f766e;">🖨️ طباعة الحالات</button>
          </div>
          <div id="mem-cases-metrics" style="margin-top:8px; font-size:12px; font-weight:700; color:#334155;"></div>
        </div>

        <div id="member-cases-table-wrap" style="overflow-x:auto; margin-top:12px;"></div>
      </div>`;

    window.filterAndRenderMemberCasesTable();
  };

  window.getFilteredMemberCases = function() {
    const aid = document.getElementById('mem-flt-aid')?.value || '';
    const vil = document.getElementById('mem-flt-village')?.value || '';
    const dec = document.getElementById('mem-flt-decision')?.value || '';
    const docsMode = document.getElementById('mem-flt-docs')?.value || '';
    const q = (document.getElementById('mem-flt-search')?.value || '').trim().toLowerCase();

    return (window.MEMBER_PORTAL_CASES || []).filter(f => {
      if (aid && f.intervention_type !== aid) return false;
      if (vil && f.village_hamlet !== vil) return false;
      const currentDec = formatEvaluationDecisionArabic(f.evaluation_decision || f.eligibility_verdict || '');
      if (dec) {
        if (dec === 'pending' && currentDec !== 'قيد التقييم') return false;
        if (dec !== 'pending' && currentDec !== dec) return false;
      }
      if (docsMode) {
        const audit = getCaseAttachmentsAudit(f);
        if (docsMode === 'complete' && !audit.isComplete) return false;
        if (docsMode === 'incomplete' && audit.isComplete) return false;
      }
      if (q) {
        const h = f.husband_data || {};
        const w = f.wife_data || {};
        const primary = getCasePrimaryDisplayName(f);
        const txt = `${primary} ${h.name1 || ''} ${h.name2 || ''} ${h.name3 || ''} ${w.name1 || ''} ${w.name2 || ''} ${w.name3 || ''} ${h.nid || ''} ${f.tracking_code || ''} ${f.village_hamlet || ''}`.toLowerCase();
        if (!txt.includes(q)) return false;
      }
      return true;
    });
  };

  window.toggleMemberCaseSelection = function(caseId, checked) {
    const key = String(caseId);
    if (checked) window.MEMBER_SELECTED_CASE_IDS.add(key);
    else window.MEMBER_SELECTED_CASE_IDS.delete(key);
    const mEl = document.getElementById('mem-cases-metrics');
    if (mEl) {
      const list = window.getFilteredMemberCases();
      mEl.textContent = `المعروض: ${list.length} | المحدد للطباعة: ${window.MEMBER_SELECTED_CASE_IDS.size}`;
    }
  };

  window.toggleSelectAllMemberCases = function(checked) {
    const list = window.getFilteredMemberCases();
    if (checked) list.forEach(c => window.MEMBER_SELECTED_CASE_IDS.add(String(c.id)));
    else list.forEach(c => window.MEMBER_SELECTED_CASE_IDS.delete(String(c.id)));
    document.querySelectorAll('.chk-mem-case-row').forEach(el => { el.checked = Boolean(checked); });
    const mEl = document.getElementById('mem-cases-metrics');
    if (mEl) mEl.textContent = `المعروض: ${list.length} | المحدد للطباعة: ${window.MEMBER_SELECTED_CASE_IDS.size}`;
  };

  window.filterAndRenderMemberCasesTable = function() {
    const wrap = document.getElementById('member-cases-table-wrap');
    if (!wrap) return;
    const list = window.getFilteredMemberCases();
    const mEl = document.getElementById('mem-cases-metrics');
    if (mEl) mEl.textContent = `المعروض: ${list.length} | المحدد للطباعة: ${window.MEMBER_SELECTED_CASE_IDS.size}`;

    if (list.length === 0) {
      wrap.innerHTML = '<p style="text-align:center; padding:12px; color:#64748b;">لا توجد حالات مطابقة للفلترة الحالية.</p>';
      return;
    }

    wrap.innerHTML = `
      <table>
        <thead>
          <tr>
            <th class="no-print" style="width:36px;">
              <input type="checkbox" onchange="toggleSelectAllMemberCases(this.checked)" style="width:auto; margin:0;">
            </th>
            <th>كود الطلب</th>
            <th>اسم الحالة (حسب وضع الأب)</th>
            <th>نوع المساعدة / المنطقة</th>
            <th>المستندات</th>
            <th>تقييم الحالة (المسندة لك)</th>
            <th class="no-print">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(f => {
            const displayName = getCasePrimaryDisplayName(f);
            const audit = getCaseAttachmentsAudit(f);
            const docsText = audit.isComplete
              ? `<span style="color:#166534; font-weight:700; font-size:11px;">✅ مكتمل (${audit.attachedCount}/${audit.totalCount})</span>`
              : `<span style="color:#991b1b; font-weight:700; font-size:11px;">⚠️ ناقص (${audit.attachedCount}/${audit.totalCount})</span>`;

            const assignedToMe = isCaseAssignedToMember(f, window.currentUser);
            const currentDec = formatEvaluationDecisionArabic(f.evaluation_decision || f.eligibility_verdict || '');
            const isChecked = window.MEMBER_SELECTED_CASE_IDS.has(String(f.id));

            const evalControlHtml = assignedToMe
              ? `
                <select id="mem-eval-sel-${escapeAttr(f.id)}" style="margin:0; padding:3px 6px; font-size:11px;">
                  <option value="" ${currentDec === 'قيد التقييم' ? 'selected' : ''}>-- اختر القرار --</option>
                  <option value="مستحق" ${currentDec === 'مستحق' ? 'selected' : ''}>مستحق</option>
                  <option value="غير مستحق" ${currentDec === 'غير مستحق' ? 'selected' : ''}>غير مستحق</option>
                  <option value="مرفوض" ${currentDec === 'مرفوض' ? 'selected' : ''}>مرفوض</option>
                </select>
                <button type="button" onclick="memberEvaluateAssignedCase('${escapeAttr(f.id)}')" class="nav-btn" style="background:#1d4ed8; color:#fff; padding:3px 7px; font-size:11px; margin-top:4px;">حفظ التقييم</button>
              `
              : `<span style="font-size:11px; color:#64748b;">${window.escapeHtml(currentDec)} (اطلاع فقط)</span>`;

            return `
              <tr>
                <td class="no-print" style="text-align:center;">
                  <input type="checkbox" class="chk-mem-case-row" ${isChecked ? 'checked' : ''} onchange="toggleMemberCaseSelection('${escapeAttr(f.id)}', this.checked)" style="width:auto; margin:0;">
                </td>
                <td><strong>${window.escapeHtml(f.tracking_code || '-')}</strong></td>
                <td>
                  <strong>${window.escapeHtml(displayName)}</strong>
                  <div style="font-size:11px; color:#475569;">${isHusbandLivingWithFamily(f) ? 'رب الأسرة (مقيم مع الأسرة)' : 'الزوجة / العائل الفعلي'}</div>
                </td>
                <td>${window.escapeHtml(f.intervention_type || '-')}<br><small>${window.escapeHtml((f.center_city || '') + ' - ' + (f.village_hamlet || ''))}</small></td>
                <td>${docsText}</td>
                <td>${evalControlHtml}</td>
                <td class="no-print" style="display:flex; gap:4px; flex-wrap:wrap;">
                  <button type="button" onclick="openFullCaseDetailsModal('${escapeAttr(f.id)}')" class="nav-btn" style="background:#065f46; color:#fff; padding:4px 8px; font-size:11px;">👁️ عرض الملف</button>
                  <button type="button" onclick="printSingleMemberCase('${escapeAttr(f.id)}')" class="nav-btn btn-gold" style="padding:4px 8px; font-size:11px;">🖨️ طباعة</button>
                </td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>`;
  };

  window.memberEvaluateAssignedCase = async function(caseId) {
    const user = window.currentUser;
    if (!user) return alert('⚠️ يرجى تسجيل الدخول أولاً.');
    const item = (window.MEMBER_PORTAL_CASES || []).find(c => String(c.id) === String(caseId));
    if (!item) return alert('⚠️ الحالة غير موجودة.');
    if (!isCaseAssignedToMember(item, user)) {
      return alert('⛔ غير مسموح: يمكنك تقييم الحالات المسندة إليك فقط.');
    }

    const sel = document.getElementById(`mem-eval-sel-${caseId}`);
    const decision = (sel?.value || '').trim();
    if (!['مستحق', 'غير مستحق', 'مرفوض'].includes(decision)) {
      return alert('⚠️ اختر أحد القرارات الثلاثة: (مستحق / غير مستحق / مرفوض).');
    }

    const notes = prompt('ملاحظات الباحث أو العضو حول التقييم (اختياري):', item.evaluation_notes || item.researcher_notes || '') ?? '';
    const evaluatorName = user.name || user.full_name || user.email;

    const patch = {
      evaluation_decision: decision,
      eligibility_verdict: decision,
      evaluation_notes: notes.trim(),
      researcher_notes: notes.trim() || item.researcher_notes || '',
      evaluated_by: evaluatorName,
      evaluated_at: new Date().toISOString()
    };

    if (window.supabaseClient) {
      const { error } = await window.supabaseClient.from('families').update(patch).eq('id', caseId);
      if (error) {
        const fallback = await window.supabaseClient.from('families').update({ eligibility_verdict: decision }).eq('id', caseId);
        if (fallback.error) return alert('❌ تعذر حفظ التقييم: ' + fallback.error.message);
      }
    }

    Object.assign(item, patch);
    window.filterAndRenderMemberCasesTable();
    alert(`✅ تم حفظ قرار التقييم (${decision}) للحالة (${item.tracking_code || caseId}).`);
  };

  window.printSingleMemberCase = async function(caseId) {
    const item = (window.MEMBER_PORTAL_CASES || []).find(c => String(c.id) === String(caseId));
    if (!item) return alert('⚠️ الحالة غير موجودة.');
    const format = document.getElementById('mem-print-format')?.value || 'full';
    await renderMemberCasesPrintSheet([item], format);
  };

  window.printMemberAssignedCases = async function() {
    const scope = document.getElementById('mem-print-scope')?.value || 'filtered';
    const format = document.getElementById('mem-print-format')?.value || 'basic';
    let targets = window.getFilteredMemberCases();
    if (scope === 'selected') {
      const ids = window.MEMBER_SELECTED_CASE_IDS;
      targets = targets.filter(c => ids.has(String(c.id)));
      if (targets.length === 0) {
        targets = (window.MEMBER_PORTAL_CASES || []).filter(c => ids.has(String(c.id)));
      }
    }
    if (targets.length === 0) return alert('⚠️ لا توجد حالات متاحة للطباعة حسب التحديد الحالي.');
    await renderMemberCasesPrintSheet(targets, format);
  };

  async function renderMemberCasesPrintSheet(casesList, format) {
    const cfg = await window.getFoundationSettings();
    const user = window.currentUser || {};
    const actorName = user.name || user.full_name || user.email || 'عضو/باحث';
    const formatNames = { basic: 'بيانات أساسية', full: 'بيانات كاملة', disbursement: 'كشف صرف' };

    let bodyHtml = '';
    if (format === 'disbursement') {
      const rowsHtml = casesList.map((f, idx) => {
        const h = f.husband_data || {};
        const name = getCasePrimaryDisplayName(f);
        const dec = formatEvaluationDecisionArabic(f.evaluation_decision || f.eligibility_verdict || f.status);
        return `<tr>
          <td>${idx + 1}</td>
          <td>${window.escapeHtml(f.tracking_code || '-')}</td>
          <td>${window.escapeHtml(name)}</td>
          <td>${window.escapeHtml(h.nid || '-')}</td>
          <td>${window.escapeHtml(f.village_hamlet || '-')}</td>
          <td>${window.escapeHtml(f.intervention_type || '-')}</td>
          <td>${window.escapeHtml(dec)}</td>
          <td style="min-width:95px;"></td>
          <td style="min-width:110px;"></td>
        </tr>`;
      }).join('');

      bodyHtml = `
        <h3 style="text-align:center; text-decoration:underline; margin:8px 0;">كشف صرف — حالات مسندة (${window.escapeHtml(actorName)})</h3>
        <p style="font-size:12px;"><strong>عدد الحالات:</strong> ${casesList.length} | <strong>التاريخ:</strong> ${new Date().toLocaleDateString('ar-EG')}</p>
        <table>
          <thead>
            <tr><th>م</th><th>الكود</th><th>الاسم</th><th>الرقم القومي</th><th>القرية</th><th>نوع المساعدة</th><th>القرار</th><th>قيمة الصرف</th><th>توقيع المستلم</th></tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>`;
    } else if (format === 'basic') {
      const rowsHtml = casesList.map((f, idx) => {
        const h = f.husband_data || {};
        const name = getCasePrimaryDisplayName(f);
        const dec = formatEvaluationDecisionArabic(f.evaluation_decision || f.eligibility_verdict || f.status);
        const audit = getCaseAttachmentsAudit(f);
        return `<tr>
          <td>${idx + 1}</td>
          <td>${window.escapeHtml(f.tracking_code || '-')}</td>
          <td>${window.escapeHtml(name)}</td>
          <td>${window.escapeHtml(h.nid || '-')}</td>
          <td>${window.escapeHtml(h.phone || '-')}</td>
          <td>${window.escapeHtml((f.center_city || '') + ' - ' + (f.village_hamlet || ''))}</td>
          <td>${window.escapeHtml(f.intervention_type || '-')}</td>
          <td>${window.escapeHtml(dec)}</td>
          <td>${audit.attachedCount}/${audit.totalCount}</td>
        </tr>`;
      }).join('');

      bodyHtml = `
        <h3 style="text-align:center; text-decoration:underline; margin:8px 0;">تقرير بيانات أساسية — حالات مسندة (${window.escapeHtml(actorName)})</h3>
        <p style="font-size:12px;"><strong>عدد الحالات:</strong> ${casesList.length} | <strong>النمط:</strong> ${formatNames[format]}</p>
        <table>
          <thead>
            <tr><th>م</th><th>الكود</th><th>الاسم</th><th>الرقم القومي</th><th>الهاتف</th><th>الموقع</th><th>نوع المساعدة</th><th>القرار</th><th>المستندات</th></tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>`;
    } else {
      bodyHtml = casesList.map((f, idx) => {
        const h = f.husband_data || {};
        const w = f.wife_data || {};
        const housing = f.housing_data || {};
        const audit = getCaseAttachmentsAudit(f);
        const primaryName = getCasePrimaryDisplayName(f);
        const dec = formatEvaluationDecisionArabic(f.evaluation_decision || f.eligibility_verdict || f.status);
        return `
          <div style="page-break-after:always; margin-bottom:18px;">
            <h3 style="text-align:center; text-decoration:underline; margin:6px 0 10px;">ملف حالة (${idx + 1} من ${casesList.length}) — بيانات كاملة</h3>
            <table>
              <tbody>
                <tr><th>كود المتابعة</th><td>${window.escapeHtml(f.tracking_code || '-')}</td><th>القرار / التقييم</th><td>${window.escapeHtml(dec)}</td></tr>
                <tr><th>اسم الحالة المعتمد</th><td>${window.escapeHtml(primaryName)}</td><th>الرقم القومي للزوج</th><td>${window.escapeHtml(h.nid || '-')}</td></tr>
                <tr><th>الهاتف / واتساب</th><td>${window.escapeHtml(h.whatsapp || h.phone || w.phone || '-')}</td><th>نوع المساعدة</th><td>${window.escapeHtml(f.intervention_type || '-')}</td></tr>
                <tr><th>المركز / القرية</th><td>${window.escapeHtml((f.center_city || '-') + ' - ' + (f.village_hamlet || '-'))}</td><th>الدخل / المصروفات</th><td>${window.escapeHtml(String(f.total_income ?? 0))} / ${window.escapeHtml(String(f.total_expenses ?? 0))}</td></tr>
                <tr><th>الحالة الصحية والإعاقة</th><td colspan="3">${window.escapeHtml(formatPersonHealthDetailed(h, 'الزوج') + ' || ' + formatPersonHealthDetailed(w, 'الزوجة'))}</td></tr>
                <tr><th>بيانات السكن</th><td colspan="3">${window.escapeHtml((housing.case || housing.housing_status || '-') + ' / ' + (housing.type || housing.housing_type || '-'))}</td></tr>
                <tr><th>ملاحظات الباحث</th><td colspan="3">${window.escapeHtml(f.evaluation_notes || f.researcher_notes || '-')}</td></tr>
              </tbody>
            </table>
            <h4 style="margin:10px 0 6px;">بيان حالة الصور والمستندات المرفقة (مرفق: ${audit.attachedCount} / غير مرفق: ${audit.missingCount}):</h4>
            <table>
              <thead><tr><th>م</th><th>اسم المستند / الصورة</th><th>حالة الإرفاق</th></tr></thead>
              <tbody>${buildCaseAttachmentsAuditRows(f)}</tbody>
            </table>
          </div>`;
      }).join('');
    }

    openPrintWindowWithHtml(buildPrintableSheetHtml(cfg, bodyHtml, `طباعة حالات العضو - ${actorName}`));
  };

  window.changeMemberOwnPassword = async function() {
    const oldOrTemp = (document.getElementById('mem-temp-or-old')?.value || '').trim();
    const newPass = (document.getElementById('mem-new-pass')?.value || '').trim();
    if (!oldOrTemp || newPass.length < 6) return alert('⚠️ أدخل الرمز المؤقت/الحالي وكلمة سر جديدة لا تقل عن 6 أحرف.');
    if (!window.supabaseClient || !window.currentUser) return;

    const { data } = await window.supabaseClient.from('users_profiles').select('*').eq('email', window.currentUser.email).maybeSingle();
    if (!data || (data.password_hash !== oldOrTemp && data.temp_code !== oldOrTemp)) {
      return alert('❌ الرمز المؤقت أو كلمة المرور الحالية غير صحيحة.');
    }

    const { error } = await window.supabaseClient.from('users_profiles').update({
      password_hash: newPass, temp_code: null, must_change_password: false
    }).eq('id', data.id);
    if (error) return alert('❌ تعذر تحديث كلمة المرور: ' + error.message);

    window.currentUser.must_change_password = false;
    sessionStorage.setItem('hf_current_user', JSON.stringify(window.currentUser));
    alert('✅ تم تحديث كلمة المرور بنجاح.');
    window.renderMemberPortal(window.currentUser);
  };

  window.adminChangeOwnPassword = async function() {
    if (!isCurrentUserAdmin()) return alert('⛔ متاح للأدمن فقط.');
    const curPass = (document.getElementById('adm-cur-pass')?.value || '').trim();
    const newPass = (document.getElementById('adm-new-pass')?.value || '').trim();
    const confPass = (document.getElementById('adm-conf-pass')?.value || '').trim();

    if (!newPass || newPass.length < 6) return alert('⚠️ كلمة السر الجديدة يجب أن تكون 6 أحرف أو أكثر.');
    if (newPass !== confPass) return alert('⚠️ تأكيد كلمة السر الجديدة غير متطابق.');

    const u = window.currentUser || {};
    if (window.supabaseClient && u.email) {
      const { data, error: fetchErr } = await window.supabaseClient.from('users_profiles').select('*').eq('email', u.email).maybeSingle();
      if (!fetchErr && data && data.password_hash && curPass && data.password_hash !== curPass) {
        return alert('❌ كلمة السر الحالية غير صحيحة.');
      }
      if (data && data.id) {
        const { error } = await window.supabaseClient.from('users_profiles').update({
          password_hash: newPass,
          must_change_password: false
        }).eq('id', data.id);
        if (error) return alert('❌ تعذر تحديث كلمة السر في قاعدة البيانات: ' + error.message);
      }
    }

    if (window.currentUser) {
      window.currentUser.password_hash = newPass;
      sessionStorage.setItem('hf_current_user', JSON.stringify(window.currentUser));
    }

    document.getElementById('adm-cur-pass').value = '';
    document.getElementById('adm-new-pass').value = '';
    document.getElementById('adm-conf-pass').value = '';
    alert('✅ تم تغيير الرقم السري للأدمن بنجاح.');
  };

  window.adminIssueMemberTempCode = async function(userId, email, fullName, phone) {
    if (!isCurrentUserAdmin()) return alert('⛔ إرسال الرمز المؤقت للأعضاء متاح للأدمن فقط.');
    const tempCode = 'HF-' + Math.floor(100000 + Math.random() * 900000);

    if (window.supabaseClient) {
      const { error } = await window.supabaseClient
        .from('users_profiles')
        .update({ temp_code: tempCode, must_change_password: true })
        .eq('id', userId);
      if (error) return alert('❌ تعذر حفظ الرمز المؤقت: ' + error.message);
    }

    const msg =
      `مؤسسة الحافظ للتنمية والخدمات\n` +
      `مرحباً أ/ ${fullName || 'عضو المؤسسة'}\n` +
      `تم إصدار رمز دخول مؤقت لحسابك بواسطة الإدارة:\n` +
      `الرمز المؤقت: ${tempCode}\n` +
      `يرجى الدخول وتعيين كلمة مرور جديدة مباشرة.`;

    showQuickMessageSendModal({
      title: `إرسال الرمز المؤقت للعضو (${fullName || email})`,
      phone: phone || '',
      email: email || '',
      subject: 'الرمز المؤقت لاستعادة كلمة المرور - مؤسسة الحافظ',
      defaultMessage: msg
    });
  };

  window.refreshAdminSummaryCards = function() {
    const families = window.ALL_ADMIN_CASES || [];
    const users = window.ALL_ADMIN_USERS || [];
    const grievances = window.ALL_ADMIN_GRIEVANCES || [];

    const totalEl = document.getElementById('stat-card-total');
    const appEl = document.getElementById('stat-card-approved');
    const penEl = document.getElementById('stat-card-pending');
    const memGrievEl = document.getElementById('stat-card-mem-griev');

    if (totalEl) totalEl.textContent = families.length;
    if (appEl) appEl.textContent = families.filter(f => f.status === 'approved').length;
    if (penEl) penEl.textContent = families.filter(f => f.status === 'pending').length;
    if (memGrievEl) memGrievEl.textContent = `${users.length} عضو / ${grievances.length} تظلم`;
  };

  window.renderAdminFullDashboard = async function(user) {
    const area = document.getElementById('dashboard-area');
    const displayName = user.name || user.full_name || 'رئيس مجلس الأمناء';
    let families = [], users = [], organizations = [], grievances = [];
    let dbWarning = '';

    if (window.supabaseClient) {
      const [fRes, uRes, gRes, oRes] = await Promise.all([
        window.supabaseClient.from('families').select('*').order('created_at', { ascending: false }),
        window.supabaseClient.from('users_profiles').select('*').order('created_at', { ascending: false }),
        window.supabaseClient.from('grievances').select('*').order('created_at', { ascending: false }),
        window.supabaseClient.from('organizations').select('*').order('created_at', { ascending: false })
      ]);
      if (fRes.error) dbWarning = `⚠️ تعذر قراءة جدول الحالات (families): ${fRes.error.message}`;
      families = hydrateCasesWithDonorAssignments(fRes.data || []);
      users = uRes.data || [];
      grievances = gRes.data || [];
      organizations = (!oRes.error && Array.isArray(oRes.data)) ? oRes.data : [];
    }

    window.ALL_ADMIN_CASES = families;
    window.ALL_ADMIN_USERS = users;
    window.ALL_ADMIN_ORGANIZATIONS = organizations;
    window.ALL_ADMIN_GRIEVANCES = grievances;

    const approved = families.filter(f => f.status === 'approved').length;
    const pending = families.filter(f => f.status === 'pending').length;

    area.innerHTML = `
      <div class="card" style="border-top:4px solid var(--primary);">
        <div class="no-print" style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; border-bottom:1px solid var(--border); padding-bottom:10px;">
          <div>
            <h3 style="margin:0; color:var(--primary-dark);">🛡️ لوحة التحكم الإدارية</h3>
            <small>المسؤول: <strong>${window.escapeHtml(displayName)}</strong></small>
          </div>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button type="button" onclick="toggleAdminPasswordBox()" class="nav-btn btn-gold">🔑 تغيير الرقم السري للأدمن</button>
            <button type="button" onclick="window.print()" class="nav-btn">🖨️ طباعة</button>
            <button type="button" onclick="logoutUser()" class="nav-btn" style="background:#dc2626; color:#fff;">خروج</button>
          </div>
        </div>

        <div id="admin-password-change-box" class="no-print hidden" style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:10px; padding:12px; margin-top:10px;">
          <h4 style="margin:0 0 8px; color:#064e3b;">🔑 تغيير الرقم السري لحساب الأدمن</h4>
          <div class="grid-3">
            <input id="adm-cur-pass" type="password" placeholder="الرقم السري الحالي" style="margin:0;">
            <input id="adm-new-pass" type="password" placeholder="الرقم السري الجديد (6 أحرف+)" style="margin:0;">
            <input id="adm-conf-pass" type="password" placeholder="تأكيد الرقم السري الجديد" style="margin:0;">
          </div>
          <div style="margin-top:8px;">
            <button type="button" onclick="adminChangeOwnPassword()" class="action-btn" style="padding:6px 14px; font-size:12px;">حفظ الرقم السري الجديد</button>
          </div>
        </div>

        ${dbWarning ? `<div style="background:#fef2f2; border:1px solid #fecaca; color:#991b1b; padding:10px; border-radius:8px; margin-top:10px; font-size:12px;">${window.escapeHtml(dbWarning)}</div>` : ''}

        <div class="grid-4" style="margin-top:12px; text-align:center;">
          <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:8px; border-radius:8px; color:#0f172a;">
            <strong>الإجمالي</strong><div id="stat-card-total" style="font-size:18px; font-weight:800;">${families.length}</div>
          </div>
          <div style="background:#ecfdf5; border:1px solid #a7f3d0; padding:8px; border-radius:8px; color:#065f46;">
            <strong>مقبولة</strong><div id="stat-card-approved" style="font-size:18px; font-weight:800;">${approved}</div>
          </div>
          <div style="background:#fffbeb; border:1px solid #fde68a; padding:8px; border-radius:8px; color:#92400e;">
            <strong>قيد المراجعة</strong><div id="stat-card-pending" style="font-size:18px; font-weight:800;">${pending}</div>
          </div>
          <div style="background:#eff6ff; border:1px solid #bfdbfe; padding:8px; border-radius:8px; color:#1e3a8a;">
            <strong>الأعضاء والتظلمات</strong><div id="stat-card-mem-griev" style="font-size:14px; font-weight:800; margin-top:3px;">${users.length} عضو / ${grievances.length} تظلم</div>
          </div>
        </div>

        <div class="no-print" style="display:flex; gap:6px; flex-wrap:wrap; margin-top:14px; border-bottom:1px solid var(--border); padding-bottom:10px;">
          <button type="button" onclick="switchAdminTab('cases')" class="nav-btn btn-primary" id="tab-btn-cases">📁 الحالات</button>
          <button type="button" onclick="switchAdminTab('members')" class="nav-btn" id="tab-btn-members">👥 الأعضاء</button>
          <button type="button" onclick="switchAdminTab('announcements')" class="nav-btn" id="tab-btn-announcements">📢 المنح</button>
          <button type="button" onclick="switchAdminTab('achievements')" class="nav-btn" id="tab-btn-achievements">🏆 الإنجازات</button>
          <button type="button" onclick="switchAdminTab('grievances')" class="nav-btn" id="tab-btn-grievances">⚖️ التظلمات</button>
          <button type="button" onclick="switchAdminTab('official')" class="nav-btn btn-gold" id="tab-btn-official">📜 المحاضر والمستندات</button>
        </div>

        <div id="admin-tab-cases" style="margin-top:12px;"></div>
        <div id="admin-tab-members" class="hidden" style="margin-top:12px;"></div>
        <div id="admin-tab-announcements" class="hidden" style="margin-top:12px;"></div>
        <div id="admin-tab-achievements" class="hidden" style="margin-top:12px;"></div>
        <div id="admin-tab-grievances" class="hidden" style="margin-top:12px;"></div>
        <div id="admin-tab-official" class="hidden" style="margin-top:12px;"></div>
      </div>`;

    window.renderAdminCasesSection();
  };

  window.toggleAdminPasswordBox = function() {
    document.getElementById('admin-password-change-box')?.classList.toggle('hidden');
  };

  window.switchAdminTab = function(tab) {
    const tabs = ['cases', 'members', 'announcements', 'achievements', 'grievances', 'official'];
    tabs.forEach(t => {
      document.getElementById('admin-tab-' + t)?.classList.toggle('hidden', t !== tab);
      document.getElementById('tab-btn-' + t)?.classList.toggle('btn-primary', t === tab);
    });
    if (tab === 'cases') window.renderAdminCasesSection();
    else if (tab === 'members') window.renderAdminMembersSection();
    else if (tab === 'announcements') window.renderAdminAnnouncementsSection();
    else if (tab === 'achievements') window.renderAdminAchievementsSection();
    else if (tab === 'grievances') window.renderAdminGrievancesSection();
    else if (tab === 'official') window.renderAdminOfficialSection();
  };

  function buildDonorPartnerOptionsHtml() {
    const orgs = (window.ALL_ADMIN_ORGANIZATIONS || []).filter(o => !o.status || o.status === 'active');
    const orgLabels = orgs.map(o => `${o.name} (${o.org_type || 'جهة مانحة/شريكة'})`);

    const userDonors = (window.ALL_ADMIN_USERS || [])
      .filter(u => ['donor', 'partner'].includes(u.role))
      .map(d => `${d.full_name || d.email} (${d.role === 'donor' ? 'جهة مانحة' : 'جهة شريكة'})`);

    const combined = Array.from(new Set([...orgLabels, ...userDonors]));
    return `<option value="">-- جهة مانحة أو جمعية شريكة --</option>` +
      combined.map(label => `<option value="${escapeAttr(label)}">${window.escapeHtml(label)}</option>`).join('');
  }

  window.renderAdminCasesSection = function() {
    const box = document.getElementById('admin-tab-cases');
    if (!box) return;
    const aidOpts = (window.AID_TYPES || [])
      .map(a => `<option value="${escapeAttr(a)}">${window.escapeHtml(a)}</option>`).join('');

    const researchersAndMembers = (window.ALL_ADMIN_USERS || []).filter(u =>
      u.account_status === 'active' && !['donor', 'partner'].includes(u.role)
    );

    const memberSelectOpts = `<option value="">-- إسناد لعضو / باحث / متطوع --</option>` +
      researchersAndMembers.map(m => {
        const label = `${m.full_name || m.email} (${m.role || 'عضو'})`;
        return `<option value="${escapeAttr(m.email)}">${window.escapeHtml(label)}</option>`;
      }).join('');

    const donorSelectOpts = buildDonorPartnerOptionsHtml();

    box.innerHTML = `
      <div class="no-print" style="background:var(--bg-color); padding:10px; border-radius:8px; border:1px solid var(--border); margin-bottom:10px;">
        <div class="grid-4">
          <select id="flt-aid" onchange="filterAndRenderCasesTable()" style="margin:0;">
            <option value="">-- كل الأنواع --</option>${aidOpts}
          </select>
          <select id="flt-status" onchange="filterAndRenderCasesTable()" style="margin:0;">
            <option value="">-- كل الحالات --</option>
            <option value="pending">قيد المراجعة</option>
            <option value="approved">مقبول للصرف</option>
            <option value="rejected">مرفوض</option>
          </select>
          <input id="flt-village" oninput="filterAndRenderCasesTable()" placeholder="القرية أو الاسم..." style="margin:0;">
          <input id="flt-limit" type="number" min="1" oninput="filterAndRenderCasesTable()" placeholder="العدد (50)" style="margin:0;">
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
          <select id="flt-special-need" onchange="filterAndRenderCasesTable()" style="margin:0; padding:4px 8px; font-size:12px;">
            <option value="">-- كل الفئات الصحية والمالية --</option>
            <option value="disability_card">ذوي الإعاقة / كارت الخدمات المتكاملة</option>
            <option value="financial_deficit">حالات ذات عجز مالي شهري</option>
          </select>
        </div>
        <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-top:8px; align-items:center;">
          <label style="display:flex; align-items:center; gap:6px; font-size:12px; font-weight:700; margin:0;">
            <input type="checkbox" id="chk-include-signature" checked style="width:auto; margin:0;"> خانة توقيع المستلم
          </label>
          <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
            <select id="disbursement-print-mode" style="margin:0; padding:4px 8px; font-size:12px; font-weight:700;">
              <option value="print_only">الطباعة فقط</option>
              <option value="print_and_notify">طباعة وإرسال رسائل للاستلام</option>
            </select>
            <button type="button" onclick="printOfficialDisbursementSheet()" class="action-btn" style="background:#b45309; padding:5px 10px; font-size:12px;">🖨️ كشف صرف</button>
            <button type="button" onclick="exportFilteredCasesCsv()" class="nav-btn btn-gold" style="padding:5px 10px; font-size:12px;">📥 CSV</button>
          </div>
        </div>
      </div>

      <div class="no-print" style="background:#f8fafc; padding:10px; border-radius:8px; border:1px solid #cbd5e1; margin-bottom:10px;">
        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
          <label style="display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:700; margin:0;">
            <input type="checkbox" id="chk-select-all-cases" onchange="toggleSelectAllCases(this.checked)" style="width:auto; margin:0;"> تحديد الكل
          </label>
          <select id="flt-assignment-view" onchange="filterAndRenderCasesTable()" style="margin:0; padding:4px 8px; font-size:12px;">
            <option value="">-- عرض كل الإسنادات --</option>
            <option value="has_member">المسندة لأعضاء / باحثين</option>
            <option value="no_member">غير المسندة لأعضاء / باحثين</option>
            <option value="has_donor">المسندة لجهات مانحة / شريكة</option>
          </select>

          <select id="bulk-member-select" style="margin:0; padding:4px 8px; font-size:12px;">${memberSelectOpts}</select>
          <button type="button" onclick="assignSelectedCasesToMember()" class="nav-btn" style="background:#1d4ed8; color:#fff; padding:5px 10px; font-size:12px;">إسناد لعضو/باحث</button>

          <select id="bulk-donor-select" style="margin:0; padding:4px 8px; font-size:12px;">${donorSelectOpts}</select>
          <button type="button" onclick="assignSelectedCasesToDonor()" class="nav-btn" style="background:#0f766e; color:#fff; padding:5px 10px; font-size:12px;">إسناد لجهة مانحة/شريكة</button>
          <button type="button" onclick="unassignDonorFromSelectedCases()" class="nav-btn" style="background:#64748b; color:#fff; padding:5px 10px; font-size:12px;">إزالة إسناد الجهة</button>
          <button type="button" onclick="printDonorAssignedCasesSheet()" class="nav-btn" style="background:#334155; color:#fff; padding:5px 10px; font-size:12px;">🖨️ طباعة حالات الجهة</button>

          <button type="button" onclick="printFullCaseFiles(Array.from(window.SELECTED_CASE_IDS))" class="nav-btn btn-gold" style="padding:5px 10px; font-size:12px;">📄 طباعة ملف الحالات المحددة</button>
        </div>
        <div id="cases-selection-metrics" style="margin-top:8px; font-size:11px; color:#334155; font-weight:700;"></div>
        <div id="case-selected-member-alert" style="display:none; margin-top:8px;"></div>
      </div>

      <div id="admin-cases-table-wrap" style="overflow-x:auto;"></div>`;

    window.filterAndRenderCasesTable();
  };

  function refreshCasesSelectionMetrics(filteredList) {
    const el = document.getElementById('cases-selection-metrics');
    if (!el) return;
    const allCases = window.ALL_ADMIN_CASES || [];
    const selectedCount = (window.SELECTED_CASE_IDS || new Set()).size;
    const withMemberCount = allCases.filter(c => Boolean(getCaseAssignedMemberDisplay(c))).length;
    const withDonorCount = allCases.filter(c => getCaseAssignedDonorsList(c).length > 0).length;
    el.innerHTML = `المعروض: ${filteredList.length} | المحدد حالياً: ${selectedCount} | مسند لأعضاء/باحثين: ${withMemberCount} | مسند لجهات مانحة/شريكة: ${withDonorCount}`;
  }

  window.getFilteredAdminCases = function() {
    const aid = document.getElementById('flt-aid')?.value || '';
    const st = document.getElementById('flt-status')?.value || '';
    const q = (document.getElementById('flt-village')?.value || '').trim().toLowerCase();
    const specialNeed = document.getElementById('flt-special-need')?.value || '';
    const assignFilter = document.getElementById('flt-assignment-view')?.value || '';
    const limit = parseInt(document.getElementById('flt-limit')?.value || '0', 10);

    let list = (window.ALL_ADMIN_CASES || []).filter(f => {
      if (aid && f.intervention_type !== aid) return false;
      if (st && f.status !== st) return false;
      if (specialNeed === 'disability_card' && !caseHasDisabilityOrServiceCard(f)) return false;
      if (specialNeed === 'financial_deficit') {
        const inc = Number(f.total_income ?? 0);
        const exp = Number(f.total_expenses ?? 0);
        if ((inc - exp) >= 0) return false;
      }
      const memberAssigned = Boolean(getCaseAssignedMemberDisplay(f));
      const donorsAssigned = getCaseAssignedDonorsList(f).length > 0;
      if (assignFilter === 'has_member' && !memberAssigned) return false;
      if (assignFilter === 'no_member' && memberAssigned) return false;
      if (assignFilter === 'has_donor' && !donorsAssigned) return false;
      if (q) {
        const h = f.husband_data || {};
        const w = f.wife_data || {};
        const primary = getCasePrimaryDisplayName(f);
        const txt = `${primary} ${h.name1 || ''} ${h.name2 || ''} ${h.name3 || ''} ${w.name1 || ''} ${w.name2 || ''} ${w.name3 || ''} ${f.village_hamlet || ''} ${f.tracking_code || ''}`.toLowerCase();
        if (!txt.includes(q)) return false;
      }
      return true;
    });
    return limit > 0 ? list.slice(0, limit) : list;
  };

  window.getDisbursementCases = function() {
    const st = document.getElementById('flt-status')?.value || '';
    const list = window.getFilteredAdminCases();
    return st ? list : list.filter(f => f.status === 'approved');
  };

  function updateSelectedMemberAlertBanner() {
    const banner = document.getElementById('case-selected-member-alert');
    if (!banner) return;
    const selectedIds = Array.from(window.SELECTED_CASE_IDS || []);
    if (selectedIds.length === 0) {
      banner.style.display = 'none';
      banner.innerHTML = '';
      return;
    }

    const warnings = [];
    selectedIds.forEach(id => {
      const c = (window.ALL_ADMIN_CASES || []).find(x => String(x.id) === String(id));
      if (!c) return;
      const memberName = getCaseAssignedMemberDisplay(c);
      if (memberName) {
        warnings.push(`<li>الحالة <strong>${window.escapeHtml(c.tracking_code || c.id)}</strong> مسندة إلى العضو/الباحث: <strong>${window.escapeHtml(memberName)}</strong></li>`);
      }
    });

    if (warnings.length === 0) {
      banner.style.display = 'none';
      banner.innerHTML = '';
      return;
    }

    banner.style.display = 'block';
    banner.innerHTML = `
      <div style="background:#fef3c7; border:1px solid #f59e0b; color:#78350f; padding:8px 12px; border-radius:6px; font-size:12px;">
        <strong>⚠️ تنبيه إسناد للأعضاء/الباحثين:</strong>
        <ul style="margin:4px 0 0; padding-right:18px;">${warnings.join('')}</ul>
      </div>`;
  }

  window.toggleCaseSelection = function(caseId, checked) {
    const key = String(caseId);
    if (checked) {
      window.SELECTED_CASE_IDS.add(key);
      const c = (window.ALL_ADMIN_CASES || []).find(x => String(x.id) === key);
      const memberName = getCaseAssignedMemberDisplay(c);
      if (memberName) {
        alert(`⚠️ تنبيه: الحالة (${c.tracking_code || key}) مسندة إلى: ${memberName}`);
      }
    } else {
      window.SELECTED_CASE_IDS.delete(key);
    }
    updateSelectedMemberAlertBanner();
    refreshCasesSelectionMetrics(window.getFilteredAdminCases());
  };

  window.toggleSelectAllCases = function(checked) {
    const list = window.getFilteredAdminCases();
    if (checked) {
      list.forEach(c => window.SELECTED_CASE_IDS.add(String(c.id)));
    } else {
      list.forEach(c => window.SELECTED_CASE_IDS.delete(String(c.id)));
    }
    document.querySelectorAll('.chk-case-row').forEach(el => {
      el.checked = Boolean(checked);
    });
    updateSelectedMemberAlertBanner();
    refreshCasesSelectionMetrics(list);
  };

  window.filterAndRenderCasesTable = function() {
    const wrap = document.getElementById('admin-cases-table-wrap');
    if (!wrap) return;
    const list = window.getFilteredAdminCases();
    refreshCasesSelectionMetrics(list);

    const members = (window.ALL_ADMIN_USERS || []).filter(u =>
      u.account_status === 'active' && !['donor', 'partner'].includes(u.role)
    );

    if (list.length === 0) {
      wrap.innerHTML = '<p style="text-align:center; padding:12px; color:#64748b;">لا توجد حالات مطابقة.</p>';
      return;
    }

    wrap.innerHTML = `
      <table>
        <thead>
          <tr>
            <th class="no-print" style="width:34px;">تحديد</th>
            <th>الكود</th>
            <th>صاحب الملف</th>
            <th>العنوان والنوع</th>
            <th>مسند إلى</th>
            <th>المستندات</th>
            <th>إسناد باحث/عضو</th>
            <th>القرار</th>
            <th class="no-print">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(f => {
            const h = f.husband_data || {};
            const name = getCasePrimaryDisplayName(f);
            const opts = `<option value="">-- غير مسند --</option>` + members.map(m =>
              `<option value="${escapeAttr(m.email)}" ${f.assigned_to_email===m.email?'selected':''}>${window.escapeHtml(m.full_name)}</option>`
            ).join('');

            const assignedMember = getCaseAssignedMemberDisplay(f);
            const assignedDonors = getCaseAssignedDonorsList(f);
            const assignedSummaryHtml = `
              <div style="font-size:11px; line-height:1.5;">
                <div><strong>عضو/باحث:</strong> ${assignedMember ? `<span style="color:#1e3a8a; font-weight:700;">${window.escapeHtml(assignedMember)}</span>` : '<span style="color:#64748b;">غير مسند</span>'}</div>
                <div><strong>جهة مانحة/شريكة:</strong> ${assignedDonors.length > 0 ? `<span style="color:#0f766e; font-weight:700;">${window.escapeHtml(assignedDonors.join('، '))}</span>` : '<span style="color:#64748b;">غير مسند</span>'}</div>
              </div>`;

            const audit = getCaseAttachmentsAudit(f);
            const docsBadgeHtml = audit.isComplete
              ? `<span style="font-size:11px; font-weight:700; color:#166534;">✅ مكتمل (${audit.attachedCount}/${audit.totalCount})</span>`
              : `<span style="font-size:11px; font-weight:700; color:#991b1b;">⚠️ ناقص (${audit.attachedCount}/${audit.totalCount})</span>`;

            const evalBadge = (f.evaluation_decision || f.eligibility_verdict)
              ? `<div style="font-size:10px; color:#0f766e; font-weight:700; margin-top:2px;">تقييم: ${window.escapeHtml(formatEvaluationDecisionArabic(f.evaluation_decision || f.eligibility_verdict))}</div>`
              : '';

            const isChecked = window.SELECTED_CASE_IDS.has(String(f.id));

            return `<tr>
              <td class="no-print" style="text-align:center;">
                <input type="checkbox" class="chk-case-row" value="${escapeAttr(f.id)}" ${isChecked ? 'checked' : ''} onchange="toggleCaseSelection('${escapeAttr(f.id)}', this.checked)" style="width:auto; margin:0;">
              </td>
              <td><strong>${window.escapeHtml(f.tracking_code)}</strong></td>
              <td>${window.escapeHtml(name)}<br><small>${window.escapeHtml(h.phone || '')}</small>${evalBadge}</td>
              <td>${window.escapeHtml(f.village_hamlet)}<br><small>${window.escapeHtml(f.intervention_type)}</small></td>
              <td>${assignedSummaryHtml}</td>
              <td>${docsBadgeHtml}</td>
              <td><select onchange="adminAssignCase('${escapeAttr(f.id)}', this)" style="margin:0; padding:3px; font-size:11px;">${opts}</select></td>
              <td>
                <select onchange="adminUpdateCaseStatus('${escapeAttr(f.id)}', this.value)" style="margin:0; padding:3px; font-size:11px;">
                  <option value="pending" ${f.status==='pending'?'selected':''}>🔍 مراجعة</option>
                  <option value="approved" ${f.status==='approved'?'selected':''}>✅ مقبول</option>
                  <option value="rejected" ${f.status==='rejected'?'selected':''}>❌ مرفوض</option>
                </select>
              </td>
              <td class="no-print" style="display:flex; gap:4px; flex-wrap:wrap;">
                <button type="button" onclick="openFullCaseDetailsModal('${escapeAttr(f.id)}')" class="nav-btn" style="background:#064e3b; color:#fff; padding:3px 6px; font-size:11px;">👁️ عرض</button>
                <button type="button" onclick="printFullCaseFiles(['${escapeAttr(f.id)}'])" class="nav-btn" style="background:#0f766e; color:#fff; padding:3px 6px; font-size:11px;">🖨️ تقرير</button>
                <button type="button" onclick="openReceiptDeclarationModal('${escapeAttr(f.id)}')" class="nav-btn btn-gold" style="padding:3px 6px; font-size:11px;">📄 إقرار</button>
                <button type="button" onclick="adminDeleteCase('${escapeAttr(f.id)}')" class="nav-btn" style="background:#dc2626; color:#fff; padding:3px 6px; font-size:11px;">🗑️</button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;
    updateSelectedMemberAlertBanner();
  };

  window.adminAssignCase = async function(id, selEl) {
    const email = selEl.value;
    const name = selEl.options[selEl.selectedIndex]?.text || 'غير مسند';
    if (!window.supabaseClient) return;

    const item = (window.ALL_ADMIN_CASES || []).find(x => String(x.id) === String(id));
    if (item && getCaseAssignedMemberDisplay(item) && getCaseAssignedMemberDisplay(item) !== name) {
      const ok = confirm(`⚠️ تنبيه: هذه الحالة مسندة إلى (${getCaseAssignedMemberDisplay(item)}). هل تريد تغيير الإسناد إلى (${name})؟`);
      if (!ok) {
        window.filterAndRenderCasesTable();
        return;
      }
    }

    const { error } = await window.supabaseClient.from('families')
      .update({ assigned_to_email: email || null, assigned_to_name: email ? name : 'غير مسند' })
      .eq('id', id);
    if (error) return alert('❌ تعذر إسناد الحالة: ' + error.message);

    if (item) {
      item.assigned_to_email = email || null;
      item.assigned_to_name = email ? name : 'غير مسند';
    }
    window.filterAndRenderCasesTable();
    alert('✅ تم إسناد الحالة بنجاح.');
  };

  window.assignSelectedCasesToMember = async function() {
    const selEl = document.getElementById('bulk-member-select');
    const email = (selEl?.value || '').trim();
    const name = selEl?.options[selEl.selectedIndex]?.text || '';
    const ids = Array.from(window.SELECTED_CASE_IDS || []);
    if (!email) return alert('⚠️ اختر عضواً أو باحثاً أو متطوعاً أولاً.');
    if (ids.length === 0) return alert('⚠️ حدد حالة واحدة أو أكثر أولاً.');

    const alreadyAssigned = ids
      .map(id => (window.ALL_ADMIN_CASES || []).find(x => String(x.id) === String(id)))
      .filter(c => c && getCaseAssignedMemberDisplay(c));

    if (alreadyAssigned.length > 0) {
      const msg = alreadyAssigned
        .map(c => `- ${c.tracking_code || c.id}: مسندة إلى (${getCaseAssignedMemberDisplay(c)})`)
        .join('\n');
      const ok = confirm(`⚠️ تنبيه: الحالات التالية مسندة مسبقاً:\n${msg}\n\nهل تريد إسنادها إلى (${name})؟`);
      if (!ok) return;
    }

    if (window.supabaseClient) {
      for (const id of ids) {
        const { error } = await window.supabaseClient
          .from('families')
          .update({ assigned_to_email: email, assigned_to_name: name })
          .eq('id', id);
        if (error) return alert('❌ تعذر إسناد بعض الحالات: ' + error.message);
      }
    }

    ids.forEach(id => {
      const item = (window.ALL_ADMIN_CASES || []).find(x => String(x.id) === String(id));
      if (item) {
        item.assigned_to_email = email;
        item.assigned_to_name = name;
      }
    });

    window.filterAndRenderCasesTable();
    alert('✅ تم إسناد الحالات المحددة للعضو/الباحث بنجاح.');
  };

  async function persistCaseDonorsInDb(caseId, donorsArray) {
    if (!window.supabaseClient) return;
    const { error } = await window.supabaseClient
      .from('families')
      .update({ assigned_donors: donorsArray })
      .eq('id', caseId);
    if (error && !String(error.message || '').includes('assigned_donors')) {
      console.warn('assigned_donors sync note:', error.message);
    }
  }

  window.assignSelectedCasesToDonor = async function() {
    const selEl = document.getElementById('bulk-donor-select');
    const donorLabel = (selEl?.value || '').trim();
    const ids = Array.from(window.SELECTED_CASE_IDS || []);
    if (!donorLabel) return alert('⚠️ اختر جهة مانحة أو جمعية شريكة أولاً.');
    if (ids.length === 0) return alert('⚠️ حدد حالة واحدة أو أكثر أولاً.');

    const donorMap = readLocalDonorAssignments();
    for (const id of ids) {
      const key = String(id);
      const currentList = normalizeDonorArray(donorMap[key]);
      if (!currentList.includes(donorLabel)) currentList.push(donorLabel);
      donorMap[key] = currentList;

      const item = (window.ALL_ADMIN_CASES || []).find(x => String(x.id) === key);
      if (item) {
        const merged = Array.from(new Set([...getCaseAssignedDonorsList(item), ...currentList]));
        item.assigned_donors = merged;
        item.assigned_donor_name = merged.join('، ');
        await persistCaseDonorsInDb(item.id, merged);
      }
    }

    writeLocalDonorAssignments(donorMap);
    window.filterAndRenderCasesTable();
    alert(`✅ تم إسناد الحالات المحددة إلى (${donorLabel}) دون أي تعارض مع إسناد الأعضاء/الباحثين.`);
  };

  window.unassignDonorFromSelectedCases = async function() {
    const selEl = document.getElementById('bulk-donor-select');
    const donorLabel = (selEl?.value || '').trim();
    const ids = Array.from(window.SELECTED_CASE_IDS || []);
    if (ids.length === 0) return alert('⚠️ حدد حالة واحدة أو أكثر أولاً.');

    const donorMap = readLocalDonorAssignments();
    for (const id of ids) {
      const key = String(id);
      const item = (window.ALL_ADMIN_CASES || []).find(x => String(x.id) === key);
      const existing = item ? getCaseAssignedDonorsList(item) : normalizeDonorArray(donorMap[key]);
      const nextList = donorLabel ? existing.filter(d => d !== donorLabel) : [];
      donorMap[key] = nextList;

      if (item) {
        item.assigned_donors = nextList;
        item.assigned_donor_name = nextList.join('، ');
        await persistCaseDonorsInDb(item.id, nextList);
      }
    }

    writeLocalDonorAssignments(donorMap);
    window.filterAndRenderCasesTable();
    alert('✅ تم تحديث إسناد الجهات للحالات المحددة.');
  };

  window.printDonorAssignedCasesSheet = async function() {
    const chosenDonor = (document.getElementById('bulk-donor-select')?.value || '').trim();
    const allCases = window.ALL_ADMIN_CASES || [];
    const matched = chosenDonor
      ? allCases.filter(c => getCaseAssignedDonorsList(c).includes(chosenDonor))
      : allCases.filter(c => getCaseAssignedDonorsList(c).length > 0);

    if (matched.length === 0) {
      return alert('⚠️ لا توجد حالات مسندة للجهة المحددة لطباعتها.');
    }

    const cfg = await window.getFoundationSettings();
    const rowsHtml = matched.map((f, idx) => {
      const h = f.husband_data || {};
      const name = getCasePrimaryDisplayName(f);
      return `<tr>
        <td>${idx + 1}</td>
        <td>${window.escapeHtml(f.tracking_code || '')}</td>
        <td>${window.escapeHtml(name)}</td>
        <td>${window.escapeHtml(h.nid || '-')}</td>
        <td>${window.escapeHtml(f.village_hamlet || '')}</td>
        <td>${window.escapeHtml(f.intervention_type || '')}</td>
        <td>${window.escapeHtml(getCaseAssignedDonorsList(f).join('، '))}</td>
      </tr>`;
    }).join('');

    const bodyHtml = `
      <h3 style="text-align:center; text-decoration:underline; margin:8px 0 10px;">كشف الحالات المسندة للجهة المانحة / الشريكة</h3>
      <p style="font-size:13px; margin:4px 0 12px;">
        <strong>الجهة:</strong> ${window.escapeHtml(chosenDonor || 'جميع الجهات المسند إليها')} |
        <strong>عدد الحالات:</strong> ${matched.length}
      </p>
      <table>
        <thead>
          <tr>
            <th>م</th><th>الكود</th><th>الاسم</th><th>الرقم القومي</th>
            <th>القرية</th><th>نوع المساعدة</th><th>الجهة المسند إليها</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <div style="display:flex; justify-content:space-between; margin-top:26px; font-weight:700; font-size:13px;">
        <span>إدارة المتابعة والمشروعات</span><span>اعتماد رئيس مجلس الأمناء</span>
      </div>`;

    openPrintWindowWithHtml(buildPrintableSheetHtml(cfg, bodyHtml, 'كشف الحالات المسندة - مؤسسة الحافظ'));
  };

  function buildCaseAttachmentsAuditRows(caseObj) {
    const audit = getCaseAttachmentsAudit(caseObj);
    return audit.items.map(it => {
      const info = it.attached ? getAttachmentDisplayInfo(it.value) : { fileName: '', href: '' };
      const fileDetails = it.attached
        ? `<div style="font-size:11px; color:#334155; margin-top:2px;">الملف: ${window.escapeHtml(info.fileName || 'مرفق')}${info.href ? ` — <a href="${escapeAttr(info.href)}" target="_blank" rel="noopener noreferrer">معاينة</a>` : ''}</div>`
        : '';
      return `
        <tr>
          <td>${it.index}</td>
          <td>${window.escapeHtml(it.label)}</td>
          <td style="font-weight:700; color:${it.attached ? '#166534' : '#991b1b'};">
            ${window.escapeHtml(it.statusText)}
            ${fileDetails}
          </td>
        </tr>`;
    }).join('');
  }

  window.printFullCaseFiles = async function(caseIdsArray) {
    const ids = Array.isArray(caseIdsArray) ? caseIdsArray.map(String) : [];
    if (ids.length === 0) {
      return alert('⚠️ حدد حالة واحدة أو أكثر لطباعة ملف البيانات الكامل.');
    }

    const pool = [...(window.ALL_ADMIN_CASES || []), ...(window.MEMBER_PORTAL_CASES || [])];
    const seen = new Set();
    const targets = pool.filter(c => {
      const k = String(c.id);
      if (!ids.includes(k) || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    if (targets.length === 0) return alert('⚠️ لم يتم العثور على الحالات المحددة.');

    const cfg = await window.getFoundationSettings();
    const pagesHtml = targets.map((f, idx) => {
      const h = f.husband_data || {};
      const w = f.wife_data || {};
      const housing = f.housing_data || {};
      const sp = housing.social_profile || {};
      const children = Array.isArray(f.children_data) ? f.children_data : [];
      const fullName = getCasePrimaryDisplayName(f);
      const wifeName = getWifeFullName(f) || '-';
      const memberAssigned = getCaseAssignedMemberDisplay(f) || 'غير مسند';
      const donorsAssigned = getCaseAssignedDonorsList(f).join('، ') || 'غير مسند';
      const statusLabel = formatCaseStatusArabic(f.status);
      const audit = getCaseAttachmentsAudit(f);
      const kidsHealthText = children.length
        ? children.map((c, i) => `${i + 1}) ${c.name || '-'}: ${formatPersonHealthDetailed(c)}`).join(' — ')
        : 'لا يوجد أبناء';

      return `
        <div style="page-break-after:always; margin-bottom:20px;">
          <h3 style="text-align:center; text-decoration:underline; margin:6px 0 12px;">
            تقرير بيانات الحالة (${idx + 1} من ${targets.length})
          </h3>
          <table>
            <tbody>
              <tr><th>كود المتابعة</th><td>${window.escapeHtml(f.tracking_code || '-')}</td><th>حالة الطلب</th><td>${window.escapeHtml(statusLabel)}</td></tr>
              <tr><th>اسم صاحب الملف</th><td>${window.escapeHtml(fullName)}</td><th>الرقم القومي</th><td>${window.escapeHtml(h.nid || '-')}</td></tr>
              <tr><th>رقم الهاتف / واتساب</th><td>${window.escapeHtml(h.whatsapp || h.phone || w.phone || '-')}</td><th>نوع المساعدة</th><td>${window.escapeHtml(f.intervention_type || '-')}</td></tr>
              <tr><th>المركز / القرية</th><td>${window.escapeHtml((f.center_city || '-') + ' - ' + (f.village_hamlet || '-'))}</td><th>اسم الزوجة</th><td>${window.escapeHtml(wifeName)}</td></tr>
              <tr><th>إجمالي الدخل</th><td>${window.escapeHtml(String(f.total_income ?? 0))}</td><th>إجمالي المصروفات</th><td>${window.escapeHtml(String(f.total_expenses ?? 0))}</td></tr>
              <tr><th>المسند إليه (باحث/عضو)</th><td>${window.escapeHtml(memberAssigned)}</td><th>المسند إليه (جهة مانحة/شريكة)</th><td>${window.escapeHtml(donorsAssigned)}</td></tr>
              <tr><th>الحالة الصحية والإعاقة</th><td colspan="3">${window.escapeHtml(formatPersonHealthDetailed(h, 'الزوج') + ' || ' + formatPersonHealthDetailed(w, 'الزوجة') + ' || الأبناء: ' + kidsHealthText)}</td></tr>
              <tr><th>البيانات الاجتماعية والسكن</th><td colspan="3">${window.escapeHtml('الإنفاق الفعلي: ' + (sp.actualProvider || '-') + ' | جهة أخرى: ' + (sp.receivesOtherAid || 'لا') + ' | السكن: ' + (housing.case || '-') + '/' + (housing.type || '-') + ' | كهرباء: ' + (housing.electricityMeter || '-') + ' | مياه: ' + (housing.waterSource || '-') + ' | صرف: ' + (housing.sanitationType || '-'))}</td></tr>
              <tr><th>ملاحظات الباحث</th><td colspan="3">${window.escapeHtml(f.evaluation_notes || f.researcher_notes || housing.opinion || '-')}</td></tr>
            </tbody>
          </table>

          <h4 style="margin:12px 0 6px;">
            بيان حالة الصور والمستندات المرفقة (مرفق: ${audit.attachedCount} / غير مرفق: ${audit.missingCount}):
          </h4>
          <table>
            <thead>
              <tr><th>م</th><th>اسم المستند / الصورة</th><th>حالة الإرفاق</th></tr>
            </thead>
            <tbody>${buildCaseAttachmentsAuditRows(f)}</tbody>
          </table>
        </div>`;
    }).join('');

    openPrintWindowWithHtml(buildPrintableSheetHtml(cfg, pagesHtml, 'تقرير بيانات الحالات - مؤسسة الحافظ'));
  };

  window.adminUpdateCaseStatus = async function(id, status) {
    if (!window.supabaseClient) return;
    const { error } = await window.supabaseClient.from('families').update({ status }).eq('id', id);
    if (error) return alert('❌ تعذر تحديث قرار الحالة: ' + error.message);

    const item = (window.ALL_ADMIN_CASES || []).find(x => String(x.id) === String(id));
    if (item) item.status = status;
    window.refreshAdminSummaryCards();

    const phone = getCaseApplicantPhone(item);
    const email = getCaseApplicantEmail(item);
    const name = getCaseApplicantName(item);
    const code = item?.tracking_code || '';
    const statusAr = formatCaseStatusArabic(status);
    const msg = await buildStatusChangeNotificationMessage({
      recipientName: name,
      code,
      entityLabel: 'الطلب',
      statusLabel: statusAr
    });

    showQuickMessageSendModal({
      title: `تم تحديث حالة الطلب (${code}) إلى: ${statusAr}`,
      phone,
      email,
      subject: `تحديث حالة الطلب رقم (${code}) - مؤسسة الحافظ`,
      defaultMessage: msg
    });
  };

  window.adminDeleteCase = async function(id) {
    if (!confirm('هل أنت متأكد من حذف هذه الحالة نهائياً؟')) return;
    if (!window.supabaseClient) return;
    const { error } = await window.supabaseClient.from('families').delete().eq('id', id);
    if (error) return alert('❌ تعذر حذف الحالة: ' + error.message);
    window.ALL_ADMIN_CASES = (window.ALL_ADMIN_CASES || []).filter(x => x.id !== id);
    window.SELECTED_CASE_IDS.delete(String(id));
    window.refreshAdminSummaryCards();
    window.filterAndRenderCasesTable();
  };

  async function executePrintDisbursementSheet(list, withSig) {
    const cfg = await window.getFoundationSettings();
    const rowsHtml = list.map((f, idx) => {
      const h = f.husband_data || {};
      const name = getCasePrimaryDisplayName(f);
      return `<tr>
        <td>${idx + 1}</td>
        <td>${window.escapeHtml(f.tracking_code)}</td>
        <td>${window.escapeHtml(name)}</td>
        <td>${window.escapeHtml(h.nid || '-')}</td>
        <td>${window.escapeHtml(f.village_hamlet)}</td>
        <td>${window.escapeHtml(f.intervention_type)}</td>
        ${withSig ? '<td style="min-width:110px;"></td>' : ''}
      </tr>`;
    }).join('');

    const bodyHtml = `
      <h3 style="text-align:center; text-decoration:underline; margin:8px 0;">كشف صرف وتسليم مساعدات</h3>
      <table>
        <thead>
          <tr>
            <th>م</th><th>الكود</th><th>الاسم</th><th>الرقم القومي</th>
            <th>القرية</th><th>نوع المساعدة</th>
            ${withSig ? '<th>توقيع / بصمة المستلم</th>' : ''}
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <div style="display:flex; justify-content:space-between; margin-top:28px; font-weight:700; font-size:13px;">
        <span>لجنة الصرف والتوزيع</span><span>اعتماد رئيس مجلس الأمناء</span>
      </div>`;

    openPrintWindowWithHtml(buildPrintableSheetHtml(cfg, bodyHtml, 'كشف صرف رسمي - مؤسسة الحافظ'));
  }

  function openDisbursementScheduleAndNotifyModal(list, withSig) {
    let modal = document.getElementById('hf-disbursement-notify-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'hf-disbursement-notify-modal';
      modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:9999; display:flex; align-items:center; justify-content:center; padding:14px;';
      document.body.appendChild(modal);
    }
    modal.classList.remove('hidden');

    modal.innerHTML = `
      <div style="background:#fff; color:#0f172a; max-width:620px; width:100%; border-radius:14px; padding:20px; max-height:90vh; overflow-y:auto;">
        <h4 style="margin:0 0 10px; color:#064e3b;">🖨️ طباعة الكشف وإرسال رسائل الاستلام (${list.length} حالة)</h4>
        <div class="grid-2">
          <div>
            <label style="font-size:12px; font-weight:700;">اليوم:</label>
            <input id="dsb-day" placeholder="مثال: الاثنين 23/11/2026" style="margin:0;">
          </div>
          <div>
            <label style="font-size:12px; font-weight:700;">الميعاد:</label>
            <input id="dsb-time" placeholder="مثال: من 10:00 ص إلى 2:00 م" style="margin:0;">
          </div>
        </div>
        <div style="margin-top:8px;">
          <label style="font-size:12px; font-weight:700;">آلية تحديد مكان الاستلام:</label>
          <select id="dsb-place-mode" onchange="toggleDisbursementPlaceInput()" style="margin:0;">
            <option value="hq">الاستلام من مقر المؤسسة (عبد الصمد - مركز إهناسيا)</option>
            <option value="call_for_location">الاتصال بنا لمعرفة مكان الاستلام المحدد</option>
            <option value="custom">تحديد مكان مخصص</option>
          </select>
        </div>
        <div style="margin-top:8px;">
          <label style="font-size:12px; font-weight:700;">تفاصيل المكان / التنسيق:</label>
          <input id="dsb-place-custom" value="مقر مؤسسة الحافظ - عبد الصمد، مركز إهناسيا" style="margin:0;">
        </div>
        <div style="margin-top:8px;">
          <label style="font-size:12px; font-weight:700;">ملاحظة إضافية (اختياري):</label>
          <input id="dsb-extra-note" placeholder="مثال: إحضار بطاقة الرقم القومي" style="margin:0;">
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:14px;">
          <button type="button" id="dsb-confirm-print-notify" class="action-btn">🖨️ طباعة الكشف وتجهيز الإرسال</button>
          <button type="button" onclick="document.getElementById('hf-disbursement-notify-modal').classList.add('hidden')" class="nav-btn">إغلاق</button>
        </div>
        <div id="dsb-recipients-list" style="margin-top:12px; max-height:220px; overflow-y:auto;"></div>
      </div>`;

    document.getElementById('dsb-confirm-print-notify').onclick = async function() {
      const dayText = (document.getElementById('dsb-day')?.value || '').trim();
      const timeText = (document.getElementById('dsb-time')?.value || '').trim();
      const mode = document.getElementById('dsb-place-mode')?.value || 'hq';
      const placeText = (document.getElementById('dsb-place-custom')?.value || '').trim();
      const extraNote = (document.getElementById('dsb-extra-note')?.value || '').trim();

      await executePrintDisbursementSheet(list, withSig);

      const recBox = document.getElementById('dsb-recipients-list');
      if (recBox) {
        const cards = [];
        for (const c of list) {
          const msg = await buildDisbursementPickupMessage(c, { mode, dayText, timeText, placeText, extraNote });
          const ph = getCaseApplicantPhone(c);
          const em = getCaseApplicantEmail(c);
          const nm = getCaseApplicantName(c);
          cards.push(`
            <div style="border:1px solid #cbd5e1; border-radius:8px; padding:8px; margin-bottom:6px; background:#f8fafc; font-size:12px;">
              <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
                <strong>${window.escapeHtml(nm)} (${window.escapeHtml(c.tracking_code || '')}) — ${window.escapeHtml(ph || 'لا يوجد هاتف')}${em ? ' | ' + window.escapeHtml(em) : ''}</strong>
                <div style="display:flex; gap:5px; flex-wrap:wrap;">
                  ${em ? `<button type="button" onclick="window.triggerInstantWhatsApp('${escapeAttr(ph)}', decodeURIComponent('${encodeURIComponent(msg)}')); setTimeout(()=>window.triggerInstantEmail('${escapeAttr(em)}', 'موعد استلام المساعدة - مؤسسة الحافظ', decodeURIComponent('${encodeURIComponent(msg)}')), 350);" class="nav-btn" style="background:#0f766e; color:#fff; padding:3px 8px; font-size:11px;">📲 واتساب + بريد</button>` : ''}
                  <button type="button" onclick="window.triggerInstantWhatsApp('${escapeAttr(ph)}', decodeURIComponent('${encodeURIComponent(msg)}'))" class="nav-btn" style="background:#16a34a; color:#fff; padding:3px 8px; font-size:11px;">💬 واتساب</button>
                  ${em ? `<button type="button" onclick="window.triggerInstantEmail('${escapeAttr(em)}', 'موعد استلام المساعدة - مؤسسة الحافظ', decodeURIComponent('${encodeURIComponent(msg)}'))" class="nav-btn" style="background:#1d4ed8; color:#fff; padding:3px 8px; font-size:11px;">✉️ بريد</button>` : ''}
                </div>
              </div>
            </div>`);
        }
        recBox.innerHTML = cards.join('');
      }
    };
  }

  window.toggleDisbursementPlaceInput = function() {
    const mode = document.getElementById('dsb-place-mode')?.value;
    const inp = document.getElementById('dsb-place-custom');
    if (!inp) return;
    if (mode === 'hq') inp.value = 'مقر مؤسسة الحافظ - عبد الصمد، مركز إهناسيا';
    else if (mode === 'call_for_location') inp.value = 'يرجى التواصل معنا لتحديد مكان الاستلام';
  };

  window.printOfficialDisbursementSheet = function() {
    const list = window.getDisbursementCases();
    if (list.length === 0) return alert('⚠️ لا توجد حالات معتمدة للصرف مطابقة للفلترة.');
    const withSig = Boolean(document.getElementById('chk-include-signature')?.checked);
    const mode = document.getElementById('disbursement-print-mode')?.value || 'print_only';
    if (mode === 'print_and_notify') {
      openDisbursementScheduleAndNotifyModal(list, withSig);
    } else {
      executePrintDisbursementSheet(list, withSig);
    }
  };

  window.exportFilteredCasesCsv = function() {
    const list = window.getFilteredAdminCases();
    if (list.length === 0) return alert('⚠️ لا توجد بيانات لتصديرها.');
    const headers = ['الكود', 'الاسم', 'الرقم القومي', 'الهاتف', 'القرية', 'نوع المساعدة', 'الحالة'];
    const rows = list.map(f => {
      const h = f.husband_data || {};
      const name = getCasePrimaryDisplayName(f);
      return [
        f.tracking_code || '',
        name,
        h.nid || '',
        h.phone || '',
        f.village_hamlet || '',
        f.intervention_type || '',
        formatCaseStatusArabic(f.status)
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alhafez_cases_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  };

  window.openReceiptDeclarationModal = function(caseId) {
    const item = (window.ALL_ADMIN_CASES || []).find(c => String(c.id) === String(caseId));
    if (!item) return alert('⚠️ الحالة غير موجودة.');
    const h = item.husband_data || {};
    const name = getCasePrimaryDisplayName(item);

    let modal = document.getElementById('hf-receipt-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'hf-receipt-modal';
      modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:9999; display:flex; align-items:center; justify-content:center; padding:14px;';
      document.body.appendChild(modal);
    }
    modal.classList.remove('hidden');

    modal.innerHTML = `
      <div style="background:#fff; color:#0f172a; max-width:540px; width:100%; border-radius:14px; padding:20px;">
        <h4 style="margin:0 0 10px; color:#064e3b;">📄 تحرير إقرار استلام مساعدة</h4>
        <p style="font-size:13px; margin:4px 0;"><strong>الاسم:</strong> ${window.escapeHtml(name)} | <strong>الكود:</strong> ${window.escapeHtml(item.tracking_code || '')}</p>
        <label style="font-size:12px; font-weight:700;">بيان المساعدة / المبلغ المستلم:</label>
        <input id="rcp-aid-desc" value="${escapeAttr(item.intervention_type || '')}" style="margin:0;">
        <label style="font-size:12px; font-weight:700; display:block; margin-top:8px;">ملاحظات إضافية:</label>
        <input id="rcp-notes" placeholder="رقم إيصال أو ملاحظات..." style="margin:0;">
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:14px;">
          <button type="button" onclick="printReceiptDeclaration('${escapeAttr(item.id)}')" class="action-btn">🖨️ طباعة الإقرار</button>
          <button type="button" onclick="document.getElementById('hf-receipt-modal').classList.add('hidden')" class="nav-btn">إغلاق</button>
        </div>
      </div>`;
  };

  window.printReceiptDeclaration = async function(caseId) {
    const item = (window.ALL_ADMIN_CASES || []).find(c => String(c.id) === String(caseId));
    if (!item) return;
    const cfg = await window.getFoundationSettings();
    const h = item.husband_data || {};
    const name = getCasePrimaryDisplayName(item);
    const aidDesc = (document.getElementById('rcp-aid-desc')?.value || item.intervention_type || '').trim();
    const notes = (document.getElementById('rcp-notes')?.value || '').trim();

    const bodyHtml = `
      <h3 style="text-align:center; text-decoration:underline; margin:14px 0;">إقرار استلام مساعدة</h3>
      <p style="font-size:14px; line-height:2;">
        أقر أنا الموقع أدناه: <strong>${window.escapeHtml(name)}</strong>،
        والحامل لبطاقة رقم قومي: <strong>${window.escapeHtml(h.nid || '....................')}</strong>،
        والمقيم في: <strong>${window.escapeHtml((item.village_hamlet || '') + ' - ' + (item.center_city || ''))}</strong>،
        بأنني قد استلمت من <strong>${window.escapeHtml(cfg.org_name || 'مؤسسة الحافظ للتنمية والخدمات')}</strong>
        المساعدة المقررة وهي: <strong>${window.escapeHtml(aidDesc)}</strong>
        وذلك عن الطلب رقم: <strong>${window.escapeHtml(item.tracking_code || '')}</strong>.
      </p>
      ${notes ? `<p style="font-size:13px;"><strong>ملاحظات:</strong> ${window.escapeHtml(notes)}</p>` : ''}
      <div style="display:flex; justify-content:space-between; margin-top:36px; font-weight:700; font-size:13px;">
        <span>توقيع المستلم: ........................</span>
        <span>مسؤول الصرف: ........................</span>
        <span>اعتماد الإدارة: ........................</span>
      </div>`;

    openPrintWindowWithHtml(buildPrintableSheetHtml(cfg, bodyHtml, 'إقرار استلام مساعدة - مؤسسة الحافظ'));
  };

  window.renderAdminMembersSection = async function() {
    const box = document.getElementById('admin-tab-members');
    if (!box) return;
    const { data } = await window.supabaseClient
      .from('users_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    const users = data || [];
    window.ALL_ADMIN_USERS = users;
    window.refreshAdminSummaryCards();

    const roleNames = {
      admin: 'أدمن',
      researcher: 'باحث ميداني',
      volunteer: 'متطوع',
      partner: 'جهة شريكة',
      donor: 'جهة مانحة'
    };

    box.innerHTML = `
      <div style="background:var(--bg-color); padding:12px; border-radius:8px; border:1px solid var(--border); margin-bottom:12px;">
        <h4 style="margin:0 0 8px; color:var(--primary-dark);">➕ إضافة عضو / باحث / جهة جديدة</h4>
        <div class="grid-4">
          <input id="new-u-name" placeholder="الاسم الكامل *" style="margin:0;">
          <input id="new-u-email" placeholder="البريد الإلكتروني *" style="margin:0;">
          <input id="new-u-phone" placeholder="رقم الهاتف / واتساب" style="margin:0;">
          <select id="new-u-role" style="margin:0;">
            <option value="researcher">باحث ميداني</option>
            <option value="volunteer">متطوع</option>
            <option value="partner">جهة شريكة</option>
            <option value="donor">جهة مانحة</option>
            <option value="admin">أدمن</option>
          </select>
        </div>
        <div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
          <input id="new-u-pass" placeholder="كلمة السر (افتراضي 123456)" style="margin:0; max-width:240px;">
          <label style="display:inline-flex; align-items:center; gap:5px; font-size:12px; margin:0;">
            <input type="checkbox" id="new-u-notify" checked style="width:auto; margin:0;"> إرسال إشعار الانضمام (واتساب + بريد)
          </label>
          <button type="button" onclick="adminCreateUserAccount()" class="action-btn" style="margin:0;">+ إنشاء الحساب</button>
        </div>
      </div>

      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr><th>الاسم</th><th>البريد والهاتف</th><th>الصفة</th><th>الحالة</th><th>إجراءات</th></tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td><strong>${window.escapeHtml(u.full_name || '-')}</strong></td>
                <td>${window.escapeHtml(u.email || '-')}<br><small>${window.escapeHtml(u.phone || '')}</small></td>
                <td>${window.escapeHtml(roleNames[u.role] || u.role || 'عضو')}</td>
                <td>${u.account_status === 'active' ? '✅ نشط' : '⏳ معلق/موقوف'}</td>
                <td style="display:flex; gap:4px; flex-wrap:wrap;">
                  <button type="button" onclick="adminToggleUserStatus('${escapeAttr(u.id)}', '${u.account_status === 'active' ? 'suspended' : 'active'}')" class="nav-btn" style="background:#0f766e; color:#fff; padding:3px 7px; font-size:11px;">${u.account_status === 'active' ? 'إيقاف' : 'تفعيل'}</button>
                  <button type="button" onclick="adminIssueMemberTempCode('${escapeAttr(u.id)}', '${escapeAttr(u.email || '')}', '${escapeAttr(u.full_name || '')}', '${escapeAttr(u.phone || '')}')" class="nav-btn btn-gold" style="padding:3px 7px; font-size:11px;">🔑 رمز مؤقت</button>
                  <button type="button" onclick="adminNotifyMemberJoin('${escapeAttr(u.id)}')" class="nav-btn" style="background:#1d4ed8; color:#fff; padding:3px 7px; font-size:11px;">📩 إشعار انضمام</button>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  };

  window.adminCreateUserAccount = async function() {
    const full_name = (document.getElementById('new-u-name')?.value || '').trim();
    const email = (document.getElementById('new-u-email')?.value || '').trim().toLowerCase();
    const phone = (document.getElementById('new-u-phone')?.value || '').trim();
    const role = document.getElementById('new-u-role')?.value || 'researcher';
    const password_hash = (document.getElementById('new-u-pass')?.value || '123456').trim();
    const notify = Boolean(document.getElementById('new-u-notify')?.checked);

    if (!full_name || !email) return alert('⚠️ أدخل الاسم الكامل والبريد الإلكتروني.');
    if (!window.supabaseClient) return;

    const { error } = await window.supabaseClient.from('users_profiles').insert([{
      full_name,
      email,
      phone,
      role,
      password_hash,
      account_status: 'active'
    }]);
    if (error) return alert('❌ تعذر إنشاء الحساب: ' + error.message);

    await window.renderAdminMembersSection();
    alert('✅ تم إنشاء الحساب بنجاح.');

    if (notify) {
      const msg =
        `مؤسسة الحافظ للتنمية والخدمات\n` +
        `مرحباً أ/ ${full_name}\n` +
        `تم تفعيل حسابك في منظومة مؤسسة الحافظ.\n` +
        `البريد الإلكتروني: ${email}\n` +
        `كلمة المرور الأولية: ${password_hash}`;
      showQuickMessageSendModal({
        title: `إرسال بيانات الانضمام للعضو (${full_name})`,
        phone,
        email,
        subject: 'تفعيل حسابك في مؤسسة الحافظ للتنمية والخدمات',
        defaultMessage: msg
      });
    }
  };

  window.adminToggleUserStatus = async function(userId, nextStatus) {
    if (!window.supabaseClient) return;
    const { error } = await window.supabaseClient.from('users_profiles').update({ account_status: nextStatus }).eq('id', userId);
    if (error) return alert('❌ تعذر تحديث حالة العضو: ' + error.message);
    await window.renderAdminMembersSection();
  };

  window.adminNotifyMemberJoin = function(userId) {
    const u = (window.ALL_ADMIN_USERS || []).find(x => String(x.id) === String(userId));
    if (!u) return;
    const msg =
      `مؤسسة الحافظ للتنمية والخدمات\n` +
      `مرحباً أ/ ${u.full_name || 'عضو المؤسسة'}\n` +
      `نرحب بانضمامكم إلى فريق العمل بمؤسسة الحافظ للتنمية والخدمات.\n` +
      `البريد الإلكتروني المسجل: ${u.email || '-'}\n` +
      `حالة الحساب: ${u.account_status === 'active' ? 'نشط' : 'قيد المراجعة'}`;

    showQuickMessageSendModal({
      title: `إشعار انضمام — ${u.full_name || u.email}`,
      phone: u.phone || '',
      email: u.email || '',
      subject: 'إشعار انضمام - مؤسسة الحافظ للتنمية والخدمات',
      defaultMessage: msg
    });
  };

  window.renderAdminAnnouncementsSection = async function() {
    const box = document.getElementById('admin-tab-announcements');
    if (!box) return;
    const { data } = await window.supabaseClient
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    const list = data || [];

    box.innerHTML = `
      <div style="background:var(--bg-color); padding:12px; border-radius:8px; border:1px solid var(--border); margin-bottom:12px;">
        <h4 style="margin:0 0 8px; color:var(--primary-dark);">📢 إضافة منحة أو إعلان جديد</h4>
        <input id="ann-title" placeholder="عنوان المنحة أو الإعلان *">
        <textarea id="ann-body" rows="2" placeholder="تفاصيل المنحة وشروط التقديم *"></textarea>
        <button type="button" onclick="adminAddAnnouncement()" class="action-btn">+ نشر الإعلان</button>
      </div>
      <div class="grid-2">
        ${list.map(item => `
          <div style="background:#fff; color:#0f172a; border:1px solid #cbd5e1; padding:12px; border-radius:8px;">
            <strong>${window.escapeHtml(item.title || '')}</strong>
            <p style="font-size:12px; margin:6px 0;">${window.escapeHtml(item.body || item.description || '')}</p>
            <button type="button" onclick="adminDeleteAnnouncement('${escapeAttr(item.id)}')" class="nav-btn" style="background:#dc2626; color:#fff; font-size:11px; padding:4px 8px;">🗑️ حذف</button>
          </div>`).join('')}
      </div>`;
  };

  window.adminAddAnnouncement = async function() {
    const title = (document.getElementById('ann-title')?.value || '').trim();
    const body = (document.getElementById('ann-body')?.value || '').trim();
    if (!title) return alert('⚠️ اكتب عنوان المنحة أو الإعلان.');
    const { error } = await window.supabaseClient.from('announcements').insert([{ title, body }]);
    if (error) return alert('❌ تعذر نشر الإعلان: ' + error.message);
    alert('✅ تم نشر الإعلان بنجاح.');
    window.renderAdminAnnouncementsSection();
  };

  window.adminDeleteAnnouncement = async function(id) {
    if (!confirm('حذف هذا الإعلان؟')) return;
    const { error } = await window.supabaseClient.from('announcements').delete().eq('id', id);
    if (error) return alert('❌ تعذر حذف الإعلان: ' + error.message);
    window.renderAdminAnnouncementsSection();
  };

  window.renderAdminAchievementsSection = async function() {
    const box = document.getElementById('admin-tab-achievements');
    if (!box) return;
    const cfg = typeof window.getFoundationSettings === 'function' ? await window.getFoundationSettings() : {};
    const { data } = await window.supabaseClient
      .from('achievements')
      .select('*')
      .order('created_at', { ascending: false });
    const list = data || [];

    box.innerHTML = `
      <div style="background:#ecfdf5; padding:12px; border-radius:8px; border:1px solid #a7f3d0; margin-bottom:14px; color:#0f172a;">
        <h4 style="margin:0 0 8px; color:#064e3b;">📊 تعديل أرقام الأثر الميداني</h4>
        <div class="grid-4">
          <div><label style="font-size:11px;">حقائب غذائية:</label><input id="st-food" value="${escapeAttr(cfg.stat_food_bags || '+450')}" style="margin:0;"></div>
          <div><label style="font-size:11px;">دعم نقدي:</label><input id="st-cash" value="${escapeAttr(cfg.stat_cash_aid || '+112')}" style="margin:0;"></div>
          <div><label style="font-size:11px;">بطاطين:</label><input id="st-blankets" value="${escapeAttr(cfg.stat_blankets || '+100')}" style="margin:0;"></div>
          <div><label style="font-size:11px;">قرية وعزبة:</label><input id="st-villages" value="${escapeAttr(cfg.stat_villages || '14')}" style="margin:0;"></div>
        </div>
        <button type="button" onclick="adminSaveSiteStats()" class="action-btn" style="margin-top:8px;">💾 حفظ الأرقام</button>
      </div>

      <div style="background:var(--bg-color); padding:12px; border-radius:8px; border:1px solid var(--border); margin-bottom:12px;">
        <h4 style="margin:0 0 8px; color:var(--primary-dark);">🏆 إضافة إنجاز جديد للمعرض</h4>
        <input id="ach-title" placeholder="عنوان الإنجاز أو القافلة *">
        <textarea id="ach-desc" rows="2" placeholder="التفاصيل والقرى المستفيدة *"></textarea>
        <input id="ach-img" placeholder="رابط الصورة (اختياري)">
        <button type="button" onclick="adminAddAchievement()" class="action-btn">+ نشر الإنجاز</button>
      </div>
      <div class="grid-2">
        ${list.map(item => `
          <div style="background:#fff; color:#0f172a; border:1px solid #cbd5e1; padding:12px; border-radius:8px;">
            <strong>${window.escapeHtml(item.title)}</strong>
            <p style="font-size:12px; margin:6px 0;">${window.escapeHtml(item.description || '')}</p>
            <button type="button" onclick="adminDeleteAchievement('${escapeAttr(item.id)}')" class="nav-btn" style="background:#dc2626; color:#fff; font-size:11px; padding:4px 8px;">🗑️ حذف</button>
          </div>`).join('')}
      </div>`;
  };

  window.adminSaveSiteStats = async function() {
    const patch = {
      stat_food_bags: document.getElementById('st-food')?.value || '+450',
      stat_cash_aid: document.getElementById('st-cash')?.value || '+112',
      stat_blankets: document.getElementById('st-blankets')?.value || '+100',
      stat_villages: document.getElementById('st-villages')?.value || '14'
    };
    const { error } = await window.supabaseClient.from('site_settings').update(patch).eq('id', 1);
    if (error) return alert('❌ تعذر حفظ الأرقام: ' + error.message);
    alert('✅ تم تحديث أرقام الأثر الميداني في الصفحة الرئيسية.');
  };

  window.adminAddAchievement = async function() {
    const title = (document.getElementById('ach-title')?.value || '').trim();
    const description = (document.getElementById('ach-desc')?.value || '').trim();
    const image_url = (document.getElementById('ach-img')?.value || 'logo.jpg').trim();
    if (!title) return alert('⚠️ اكتب عنوان الإنجاز.');
    const { error } = await window.supabaseClient.from('achievements').insert([{ title, description, image_url }]);
    if (error) return alert('❌ تعذر نشر الإنجاز: ' + error.message);
    alert('✅ تم نشر الإنجاز في قاعدة البيانات بنجاح.');
    window.renderAdminAchievementsSection();
  };

  window.adminDeleteAchievement = async function(id) {
    if (!confirm('حذف هذا الإنجاز؟')) return;
    const { error } = await window.supabaseClient.from('achievements').delete().eq('id', id);
    if (error) return alert('❌ تعذر حذف الإنجاز: ' + error.message);
    window.renderAdminAchievementsSection();
  };

  window.renderAdminGrievancesSection = async function() {
    const box = document.getElementById('admin-tab-grievances');
    if (!box) return;
    const { data } = await window.supabaseClient
      .from('grievances')
      .select('*')
      .order('created_at', { ascending: false });
    const list = data || [];
    window.ALL_ADMIN_GRIEVANCES = list;
    window.refreshAdminSummaryCards();

    const assignees = (window.ALL_ADMIN_USERS || []).filter(u =>
      u.account_status === 'active' && !['donor', 'partner'].includes(u.role)
    );
    const assigneeOpts = `<option value="">-- اختر باحثاً أو عضواً --</option>` +
      assignees.map(u => {
        const label = `${u.full_name || u.email} (${u.role || 'عضو'})`;
        return `<option value="${escapeAttr(u.email)}">${window.escapeHtml(label)}</option>`;
      }).join('');

    box.innerHTML = list.length === 0 ? '<p>لا توجد تظلمات مسجلة.</p>' : `
      <table>
        <thead>
          <tr>
            <th>الكود</th>
            <th>الاسم والهاتف</th>
            <th>النوع والتفاصيل</th>
            <th>الحالة والإجراءات</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(g => {
            const st = g.status || 'جديد';
            const assignedLabel = g.assigned_to_name || g.assigned_to_email || '';
            const replyHtml = g.reply_note
              ? `<div style="margin-top:4px; font-size:11px; color:#0f766e;"><strong>الرد:</strong> ${window.escapeHtml(g.reply_note)}</div>`
              : '';
            return `<tr>
              <td><strong>${window.escapeHtml(g.tracking_code)}</strong></td>
              <td>${window.escapeHtml(g.full_name)}<br><small>${window.escapeHtml(g.phone)}</small></td>
              <td>
                <strong>${window.escapeHtml(g.grievance_type)}</strong><br>
                ${window.escapeHtml(g.message_body)}
                ${replyHtml}
              </td>
              <td>
                <div style="margin-bottom:6px; font-size:12px; font-weight:700;">
                  الحالة: <span style="color:#0f766e;">${window.escapeHtml(st)}</span>
                  ${assignedLabel ? `<div style="font-size:11px; color:#1e3a8a;">مسند إلى: ${window.escapeHtml(assignedLabel)}</div>` : ''}
                </div>
                <div style="display:flex; gap:5px; flex-wrap:wrap;">
                  <button type="button" onclick="adminSetGrievanceStatus('${escapeAttr(g.id)}', 'جار المراجعة')" class="nav-btn" style="background:#d97706; color:#fff; padding:4px 7px; font-size:11px;">جار المراجعة</button>
                  <button type="button" onclick="adminSetGrievanceStatus('${escapeAttr(g.id)}', 'تم الرد')" class="nav-btn" style="background:#15803d; color:#fff; padding:4px 7px; font-size:11px;">تم الرد</button>
                  <button type="button" onclick="toggleGrievanceAssignPanel('${escapeAttr(g.id)}')" class="nav-btn" style="background:#1d4ed8; color:#fff; padding:4px 7px; font-size:11px;">إسناد لباحث أو عضو</button>
                  <button type="button" onclick="adminDeleteGrievance('${escapeAttr(g.id)}')" class="nav-btn" style="background:#dc2626; color:#fff; padding:4px 7px; font-size:11px;">حذف</button>
                </div>
                <div id="grv-assign-panel-${escapeAttr(g.id)}" style="display:none; margin-top:6px; gap:5px; align-items:center; flex-wrap:wrap;">
                  <select id="grv-assignee-sel-${escapeAttr(g.id)}" style="margin:0; padding:3px 6px; font-size:11px;">${assigneeOpts}</select>
                  <button type="button" onclick="adminAssignGrievance('${escapeAttr(g.id)}')" class="nav-btn" style="background:#0f766e; color:#fff; padding:4px 8px; font-size:11px;">تأكيد الإسناد</button>
                </div>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;
  };

  window.toggleGrievanceAssignPanel = function(id) {
    const el = document.getElementById(`grv-assign-panel-${id}`);
    if (!el) return;
    el.style.display = el.style.display === 'none' || !el.style.display ? 'flex' : 'none';
  };

  window.adminSetGrievanceStatus = async function(id, newStatus) {
    const gItem = (window.ALL_ADMIN_GRIEVANCES || []).find(x => String(x.id) === String(id));
    let replyNote = '';
    if (newStatus === 'تم الرد') {
      const entered = prompt('اكتب نص الرد على التظلم (اختياري):', '');
      if (entered === null) return;
      replyNote = entered.trim();
    }

    const patch = { status: newStatus };
    if (replyNote) patch.reply_note = replyNote;

    const { error } = await window.supabaseClient.from('grievances').update(patch).eq('id', id);
    if (error) {
      const fallback = await window.supabaseClient.from('grievances').update({ status: newStatus }).eq('id', id);
      if (fallback.error) return alert('❌ تعذر تحديث حالة التظلم: ' + fallback.error.message);
    }

    await window.renderAdminGrievancesSection();

    const msg = await buildStatusChangeNotificationMessage({
      recipientName: gItem?.full_name || 'صاحب التظلم',
      code: gItem?.tracking_code || '',
      entityLabel: 'التظلم',
      statusLabel: newStatus,
      replyNote
    });

    showQuickMessageSendModal({
      title: `تم تحديث حالة التظلم (${gItem?.tracking_code || ''}) إلى: ${newStatus}`,
      phone: gItem?.phone || '',
      email: gItem?.email || '',
      subject: `تحديث حالة التظلم رقم (${gItem?.tracking_code || ''}) - مؤسسة الحافظ`,
      defaultMessage: msg
    });
  };

  window.adminAssignGrievance = async function(id) {
    const gItem = (window.ALL_ADMIN_GRIEVANCES || []).find(x => String(x.id) === String(id));
    const sel = document.getElementById(`grv-assignee-sel-${id}`);
    const email = (sel?.value || '').trim();
    const name = sel?.options[sel.selectedIndex]?.text || '';
    if (!email) return alert('⚠️ اختر باحثاً أو عضواً من القائمة أولاً.');

    const patch = { status: 'جار المراجعة', assigned_to_email: email, assigned_to_name: name };
    const { error } = await window.supabaseClient.from('grievances').update(patch).eq('id', id);
    if (error) {
      const fallback = await window.supabaseClient.from('grievances').update({ status: 'جار المراجعة' }).eq('id', id);
      if (fallback.error) return alert('❌ تعذر إسناد التظلم: ' + fallback.error.message);
    }

    await window.renderAdminGrievancesSection();

    const msg = await buildStatusChangeNotificationMessage({
      recipientName: gItem?.full_name || 'صاحب التظلم',
      code: gItem?.tracking_code || '',
      entityLabel: 'التظلم',
      statusLabel: `جار المراجعة (مسند إلى: ${name})`
    });

    showQuickMessageSendModal({
      title: `تم إسناد التظلم (${gItem?.tracking_code || ''}) وتحديث حالته`,
      phone: gItem?.phone || '',
      email: gItem?.email || '',
      subject: `متابعة التظلم رقم (${gItem?.tracking_code || ''}) - مؤسسة الحافظ`,
      defaultMessage: msg
    });
  };

  window.adminDeleteGrievance = async function(id) {
    if (!confirm('هل أنت متأكد من حذف هذا التظلم؟')) return;
    const { error } = await window.supabaseClient.from('grievances').delete().eq('id', id);
    if (error) return alert('❌ تعذر حذف التظلم: ' + error.message);
    window.renderAdminGrievancesSection();
  };

  function readLocalOfficialDocs() {
    try {
      const raw = localStorage.getItem(LOCAL_DOCS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function writeLocalOfficialDocs(list) {
    try {
      localStorage.setItem(LOCAL_DOCS_KEY, JSON.stringify(list || []));
    } catch (_) {}
  }

  window.loadOfficialDocumentsList = async function() {
    let dbDocs = [];
    if (window.supabaseClient) {
      const { data, error } = await window.supabaseClient
        .from('official_documents')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        dbDocs = data;
      }
    }
    const localDocs = readLocalOfficialDocs();
    const map = new Map();
    [...dbDocs, ...localDocs].forEach(d => {
      if (d && d.doc_number) map.set(d.doc_number, d);
    });
    const merged = Array.from(map.values()).sort((a, b) =>
      String(b.created_at || b.doc_number || '').localeCompare(String(a.created_at || a.doc_number || ''))
    );
    window.ALL_OFFICIAL_DOCS = merged;
    return merged;
  };

  window.generateNextOfficialDocNumber = function(docType) {
    const prefixMap = {
      outgoing: 'OUT',
      incoming: 'IN',
      warehouse_issue: 'ISS',
      warehouse_deposit: 'DEP',
      board: 'BRD',
      delegation: 'DLG',
      letter: 'LTR',
      cash_receipt: 'CSH',
      field_inspection: 'INSP',
      custody_handover: 'CST',
      stocktake: 'STK'
    };
    const prefix = prefixMap[docType] || 'DOC';
    const year = new Date().getFullYear();
    const fullPrefix = `${prefix}-${year}-`;

    let maxSeq = 0;
    (window.ALL_OFFICIAL_DOCS || []).forEach(d => {
      const num = String(d.doc_number || '');
      if (num.startsWith(fullPrefix)) {
        const tail = parseInt(num.slice(fullPrefix.length), 10);
        if (!Number.isNaN(tail) && tail > maxSeq) maxSeq = tail;
      }
    });

    const nextSeq = String(maxSeq + 1).padStart(4, '0');
    return `${fullPrefix}${nextSeq}`;
  };

  window.saveOfficialDocumentRecord = async function(docType, docNumber, docDate, titleOrParty, payload) {
    const cleanNumber = String(docNumber || '').trim() || window.generateNextOfficialDocNumber(docType);
    const cleanDate = String(docDate || '').trim() || new Date().toISOString().slice(0, 10);
    const cleanTitle = String(titleOrParty || '').trim();
    const cleanPayload = (payload && typeof payload === 'object') ? { ...payload } : {};

    const record = {
      doc_type: docType,
      doc_code: cleanNumber,
      doc_number: cleanNumber,
      doc_title: cleanTitle,
      title_or_party: cleanTitle,
      doc_date: cleanDate,
      payload: cleanPayload,
      created_by: (window.currentUser && (window.currentUser.name || window.currentUser.full_name || window.currentUser.email)) || 'admin',
      created_at: new Date().toISOString()
    };

    const localList = readLocalOfficialDocs();
    const idx = localList.findIndex(x => (x.doc_number === cleanNumber || x.doc_code === cleanNumber));
    const savedLocal = { ...record, id: idx >= 0 ? localList[idx].id : undefined };
    if (idx >= 0) localList[idx] = savedLocal;
    else localList.unshift(savedLocal);
    writeLocalOfficialDocs(localList);

    if (window.supabaseClient) {
      const { error } = await window.supabaseClient
        .from('official_documents')
        .upsert([record], { onConflict: 'doc_number' });
      if (error && !String(error.message || '').includes('does not exist')) {
        console.warn('official_documents upsert warning:', error.message);
      }
    }

    await window.loadOfficialDocumentsList();
    window.renderOfficialDocsArchiveTable();
    return savedLocal;
  };

  window.deleteOfficialDocumentRecord = async function(docNumber) {
    if (!confirm(`هل أنت متأكد من حذف المستند رقم (${docNumber}) من السجل؟`)) return;
    const filteredLocal = readLocalOfficialDocs().filter(x => x.doc_number !== docNumber);
    writeLocalOfficialDocs(filteredLocal);

    if (window.supabaseClient) {
      await window.supabaseClient.from('official_documents').delete().eq('doc_number', docNumber);
    }
    await window.loadOfficialDocumentsList();
    window.renderOfficialDocsArchiveTable();
  };

  function getDocTypeLabel(type) {
    const labels = {
      outgoing: '📤 صادر',
      incoming: '📥 وارد',
      warehouse_issue: '📦 إيصال صرف مخزني',
      warehouse_deposit: '📥 إيصال إيداع مخزني',
      board: '📋 محضر مجلس الأمناء',
      delegation: '📄 تفويض رسمي',
      letter: '✉️ خطاب رسمي',
      cash_receipt: '🧾 إيصال استلام نقدي / تبرع مالي',
      field_inspection: '📝 محضر معاينة / بحث اجتماعي ميداني',
      custody_handover: '📑 محضر تسليم واستلام عهدة / مساعدات',
      stocktake: '📊 محضر جرد مخزني / تسوية عهدة'
    };
    return labels[type] || type;
  }

  window.renderOfficialDocsArchiveTable = function() {
    const wrap = document.getElementById('official-docs-archive-wrap');
    if (!wrap) return;
    const filterType = document.getElementById('doc-archive-filter')?.value || '';
    const q = (document.getElementById('doc-archive-search')?.value || '').trim().toLowerCase();

    const list = (window.ALL_OFFICIAL_DOCS || []).filter(d => {
      if (filterType && d.doc_type !== filterType) return false;
      if (q) {
        const hay = `${d.doc_number || ''} ${d.title_or_party || ''} ${d.doc_date || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (list.length === 0) {
      wrap.innerHTML = '<p style="text-align:center; padding:10px; color:#64748b; font-size:12px;">لا توجد مستندات محفوظة مطابقة للبحث.</p>';
      return;
    }

    wrap.innerHTML = `
      <table>
        <thead>
          <tr><th>الرقم التسلسلي</th><th>النوع</th><th>التاريخ</th><th>الجهة / الموضوع</th><th class="no-print">إجراءات</th></tr>
        </thead>
        <tbody>
          ${list.map(d => `
            <tr>
              <td><strong>${window.escapeHtml(d.doc_number)}</strong></td>
              <td>${window.escapeHtml(getDocTypeLabel(d.doc_type))}</td>
              <td>${window.escapeHtml(d.doc_date || '-')}</td>
              <td>${window.escapeHtml(d.title_or_party || '-')}</td>
              <td class="no-print" style="display:flex; gap:4px; flex-wrap:wrap;">
                <button type="button" onclick="reprintSavedOfficialDoc('${escapeAttr(d.doc_number)}')" class="nav-btn btn-gold" style="padding:3px 7px; font-size:11px;">🖨️ طباعة</button>
                <button type="button" onclick="deleteOfficialDocumentRecord('${escapeAttr(d.doc_number)}')" class="nav-btn" style="background:#dc2626; color:#fff; padding:3px 7px; font-size:11px;">🗑️</button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  };

  window.reprintSavedOfficialDoc = async function(docNumber) {
    const doc = (window.ALL_OFFICIAL_DOCS || []).find(x => x.doc_number === docNumber);
    if (!doc) return alert('⚠️ لم يتم العثور على المستند.');
    const cfg = await window.getFoundationSettings();
    const p = doc.payload || {};

    let bodyHtml = '';
    if (doc.doc_type === 'outgoing') {
      bodyHtml = `
        <h3 style="text-align:center; text-decoration:underline; margin:8px 0 14px;">خطاب صادر رسمي</h3>
        <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:10px;">
          <div><strong>رقم الصادر:</strong> ${window.escapeHtml(doc.doc_number)}</div>
          <div><strong>التاريخ:</strong> ${window.escapeHtml(doc.doc_date || '')}</div>
        </div>
        <p style="font-size:13px; line-height:2;">
          <strong>الجهة المرسل إليها:</strong> ${window.escapeHtml(p.to_party || '')}<br>
          <strong>الموضوع:</strong> ${window.escapeHtml(p.subject || '')}<br>
          <strong>المرفقات:</strong> ${window.escapeHtml(p.attachments || 'لا يوجد')}
        </p>
        <p style="text-align:center; font-weight:700;">تحية طيبة وبعد،،،</p>
        <div style="font-size:14px; line-height:2.1; white-space:pre-line; border:1px dashed #cbd5e1; padding:12px; border-radius:6px;">${window.escapeHtml(p.body || '')}</div>
        <p style="text-align:center; font-weight:700; margin-top:18px;">وتفضلوا بقبول فائق الاحترام والتقدير،،،</p>
        <div style="text-align:left; font-weight:700; margin-top:20px; padding-left:24px;">رئيس مجلس الأمناء</div>`;
    } else if (doc.doc_type === 'incoming') {
      bodyHtml = `
        <h3 style="text-align:center; text-decoration:underline; margin:8px 0 14px;">إفادة قيد مستند وارد</h3>
        <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:10px;">
          <div><strong>رقم قيد الوارد:</strong> ${window.escapeHtml(doc.doc_number)}</div>
          <div><strong>تاريخ الورود:</strong> ${window.escapeHtml(doc.doc_date || '')}</div>
        </div>
        <p style="font-size:13px; line-height:2.1;">
          <strong>الجهة الوارد منها:</strong> ${window.escapeHtml(p.from_party || '')}<br>
          <strong>رقم وتاريخ خطاب الجهة:</strong> ${window.escapeHtml(p.ref_no_date || '-')}<br>
          <strong>الموضوع:</strong> ${window.escapeHtml(p.subject || '')}<br>
          <strong>المرفقات:</strong> ${window.escapeHtml(p.attachments || '-')}<br>
          <strong>التوجيه الإداري:</strong> ${window.escapeHtml(p.directive || '-')}
        </p>
        <div style="display:flex; justify-content:space-between; margin-top:30px; font-weight:700; font-size:13px;">
          <span>موظف القيد والأرشيف</span><span>اعتماد رئيس مجلس الأمناء</span>
        </div>`;
    } else if (doc.doc_type === 'warehouse_issue' || doc.doc_type === 'warehouse_deposit') {
      const isIssue = doc.doc_type === 'warehouse_issue';
      const items = Array.isArray(p.items) ? p.items : [];
      const rowsHtml = items.map((it, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${window.escapeHtml(it.name || '')}</td>
          <td>${window.escapeHtml(it.unit || 'وحدة')}</td>
          <td>${window.escapeHtml(it.qty || '')}</td>
          <td>${window.escapeHtml(it.notes || '')}</td>
        </tr>`).join('');
      bodyHtml = `
        <h3 style="text-align:center; text-decoration:underline; margin:8px 0 14px;">${isIssue ? 'إيصال / إذن صرف مخزني' : 'إيصال / إذن إيداع واستلام مخزني'}</h3>
        <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:10px;">
          <div><strong>رقم الإيصال:</strong> ${window.escapeHtml(doc.doc_number)}</div>
          <div><strong>التاريخ:</strong> ${window.escapeHtml(doc.doc_date || '')}</div>
        </div>
        <p style="font-size:13px; line-height:2;">
          <strong>${isIssue ? 'المستلم / الجهة المستفيدة:' : 'المودِع / مصدر الإيداع:'}</strong> ${window.escapeHtml(p.party_name || '')}<br>
          <strong>البيان / الغرض:</strong> ${window.escapeHtml(p.purpose || '-')}
        </p>
        <table>
          <thead><tr><th>م</th><th>الصنف / البيان</th><th>الوحدة</th><th>الكمية</th><th>ملاحظات</th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <div style="display:flex; justify-content:space-between; margin-top:28px; font-weight:700; font-size:13px;">
          <div>${isIssue ? 'توقيع المستلم:' : 'توقيع المودِع / المورِّد:'}<br><br>......................</div>
          <div>أمين المخزن:<br><br>......................</div>
          <div>يعتمد / رئيس مجلس الأمناء:<br><br>......................</div>
        </div>`;
    } else if (p.printableHtml) {
      bodyHtml = p.printableHtml;
    }

    openPrintWindowWithHtml(buildPrintableSheetHtml(cfg, bodyHtml, `${getDocTypeLabel(doc.doc_type)} - ${doc.doc_number}`));
  };

  window.reindexDocDynamicLines = function(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    let numCounter = 2;
    container.querySelectorAll('.dyn-line-row').forEach((row) => {
      const numEl = row.querySelector('.line-num');
      if (row.dataset.numbered === '1' && numEl) {
        numEl.textContent = numCounter + '-';
        numCounter++;
      }
    });
  };

  window.addDocDynamicLine = function(containerId, placeholderText, numbered = true) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const count = container.querySelectorAll('.dyn-line-row').length;
    const lineNum = numbered ? (count + 2) : (count + 1);
    const numHtml = numbered ? `<span class="line-num" style="font-weight:700; min-width:22px;">${lineNum}-</span>` : '';
    const row = document.createElement('div');
    row.className = 'dyn-line-row';
    row.dataset.numbered = numbered ? '1' : '0';
    row.style.cssText = 'display:flex; align-items:center; gap:6px; margin:4px 0;';
    row.innerHTML = `
      ${numHtml}
      <input type="text" placeholder="${placeholderText}" style="flex:1; margin:0; padding:4px 8px;">
      <button type="button" onclick="const p=this.parentElement.parentElement; this.parentElement.remove(); reindexDocDynamicLines(p.id);" class="no-print" style="background:#fee2e2; color:#991b1b; border:none; border-radius:4px; padding:4px 8px; cursor:pointer;">✕</button>
    `;
    container.appendChild(row);
  };

  window.addWarehouseItemRow = function(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    const idx = tbody.querySelectorAll('tr').length + 1;
    const tr = document.createElement('tr');
    tr.className = 'wh-item-row';
    tr.innerHTML = `
      <td class="wh-row-idx" style="text-align:center; font-weight:700;">${idx}</td>
      <td><input type="text" class="wh-name" placeholder="اسم الصنف (مثال: كرتونة مواد غذائية / بطانية)" style="margin:0; padding:4px 6px;"></td>
      <td><input type="text" class="wh-unit" value="وحدة" style="margin:0; padding:4px 6px; width:80px;"></td>
      <td><input type="number" min="0" step="any" class="wh-qty" placeholder="الكمية" style="margin:0; padding:4px 6px; width:90px;"></td>
      <td><input type="text" class="wh-notes" placeholder="ملاحظات / حالة الصنف" style="margin:0; padding:4px 6px;"></td>
      <td class="no-print"><button type="button" onclick="const tb=this.closest('tbody'); this.closest('tr').remove(); reindexWarehouseRows(tb.id);" style="background:#fee2e2; color:#991b1b; border:none; border-radius:4px; padding:4px 7px; cursor:pointer;">✕</button></td>
    `;
    tbody.appendChild(tr);
  };

  window.reindexWarehouseRows = function(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.querySelectorAll('.wh-item-row').forEach((tr, i) => {
      const cell = tr.querySelector('.wh-row-idx');
      if (cell) cell.textContent = i + 1;
    });
  };

  window.printOfficialDocSheetOnly = async function(saveType = '', docNumInputId = '', docDateInputId = '', titleInputId = '') {
    const sheet = document.getElementById('printable-official-sheet');
    if (!sheet) return;
    const clone = sheet.cloneNode(true);
    clone.querySelectorAll('.no-print').forEach(el => el.remove());
    clone.querySelectorAll('input, textarea, select').forEach(el => {
      const span = document.createElement('span');
      span.style.cssText = 'font-weight:700; border-bottom:1px dotted #64748b; padding:0 4px; display:inline-block; min-width:50px;';
      span.textContent = (el.value || '').trim() || (el.placeholder || '................');
      el.replaceWith(span);
    });

    const cfg = await window.getFoundationSettings();
    const docNum = (document.getElementById(docNumInputId)?.value || '').trim() || window.generateNextOfficialDocNumber(saveType || 'letter');
    const docDate = (document.getElementById(docDateInputId)?.value || '').trim() || new Date().toISOString().slice(0, 10);
    const titleParty = (document.getElementById(titleInputId)?.value || '').trim() || getDocTypeLabel(saveType || 'letter');

    if (saveType) {
      await window.saveOfficialDocumentRecord(saveType, docNum, docDate, titleParty, {
        printableHtml: clone.innerHTML
      });
    }

    openPrintWindowWithHtml(buildPrintableSheetHtml(cfg, clone.innerHTML, `${getDocTypeLabel(saveType || 'letter')} - ${docNum}`, false));
  };

  window.saveAndPrintOutgoingDoc = async function() {
    const docNumber = (document.getElementById('out-doc-num')?.value || '').trim() || window.generateNextOfficialDocNumber('outgoing');
    const docDate = (document.getElementById('out-doc-date')?.value || '').trim() || new Date().toISOString().slice(0, 10);
    const toParty = (document.getElementById('out-to-party')?.value || '').trim();
    const subject = (document.getElementById('out-subject')?.value || '').trim();
    const attachments = (document.getElementById('out-attachments')?.value || '').trim();
    const body = (document.getElementById('out-body')?.value || '').trim();

    if (!toParty || !subject || !body) {
      return alert('⚠️ يرجى إدخال الجهة المرسل إليها، والموضوع، ونص الخطاب الصادر.');
    }

    await window.saveOfficialDocumentRecord('outgoing', docNumber, docDate, `${toParty} — ${subject}`, {
      to_party: toParty, subject, attachments, body
    });
    await window.reprintSavedOfficialDoc(docNumber);
  };

  window.saveAndPrintIncomingDoc = async function() {
    const docNumber = (document.getElementById('in-doc-num')?.value || '').trim() || window.generateNextOfficialDocNumber('incoming');
    const docDate = (document.getElementById('in-doc-date')?.value || '').trim() || new Date().toISOString().slice(0, 10);
    const fromParty = (document.getElementById('in-from-party')?.value || '').trim();
    const refNoDate = (document.getElementById('in-ref-no-date')?.value || '').trim();
    const subject = (document.getElementById('in-subject')?.value || '').trim();
    const attachments = (document.getElementById('in-attachments')?.value || '').trim();
    const directive = (document.getElementById('in-directive')?.value || '').trim();

    if (!fromParty || !subject) {
      return alert('⚠️ يرجى إدخال الجهة الوارد منها وموضوع الوارد.');
    }

    await window.saveOfficialDocumentRecord('incoming', docNumber, docDate, `${fromParty} — ${subject}`, {
      from_party: fromParty, ref_no_date: refNoDate, subject, attachments, directive
    });
    await window.reprintSavedOfficialDoc(docNumber);
  };

  window.saveAndPrintWarehouseReceipt = async function(kind) {
    const isIssue = kind === 'warehouse_issue';
    const docNumber = (document.getElementById('wh-doc-num')?.value || '').trim() || window.generateNextOfficialDocNumber(kind);
    const docDate = (document.getElementById('wh-doc-date')?.value || '').trim() || new Date().toISOString().slice(0, 10);
    const partyName = (document.getElementById('wh-party-name')?.value || '').trim();
    const purpose = (document.getElementById('wh-purpose')?.value || '').trim();

    const items = [];
    document.querySelectorAll('#wh-items-tbody .wh-item-row').forEach(tr => {
      const name = (tr.querySelector('.wh-name')?.value || '').trim();
      const unit = (tr.querySelector('.wh-unit')?.value || 'وحدة').trim();
      const qty = (tr.querySelector('.wh-qty')?.value || '').trim();
      const notes = (tr.querySelector('.wh-notes')?.value || '').trim();
      if (name || qty) items.push({ name, unit, qty, notes });
    });

    if (!partyName || items.length === 0) {
      return alert(`⚠️ يرجى إدخال ${isIssue ? 'اسم المستلم/الجهة' : 'اسم المودِع/مصدر الإيداع'} وإضافة صنف واحد على الأقل.`);
    }

    await window.saveOfficialDocumentRecord(kind, docNumber, docDate, `${partyName} (${items.length} أصناف)`, {
      party_name: partyName, purpose, items
    });
    await window.reprintSavedOfficialDoc(docNumber);
  };

  window.renderAdminOfficialSection = async function() {
    const box = document.getElementById('admin-tab-official');
    if (!box) return;
    await window.loadOfficialDocumentsList();

    box.innerHTML = `
      <div class="no-print" style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:12px;">
        <button type="button" onclick="renderOfficialDocTemplate('board')" class="action-btn" style="padding:7px 11px; font-size:12px;">📋 محضر مجلس الأمناء</button>
        <button type="button" onclick="renderOfficialDocTemplate('delegation')" class="action-btn" style="background:#b45309; padding:7px 11px; font-size:12px;">📄 التفويض الرسمي</button>
        <button type="button" onclick="renderOfficialDocTemplate('letter')" class="nav-btn btn-gold" style="padding:7px 11px; font-size:12px;">✉️ خطاب رسمي</button>
        <button type="button" onclick="renderOfficialDocTemplate('outgoing')" class="nav-btn" style="background:#0f766e; color:#fff; padding:7px 11px; font-size:12px;">📤 الصادر</button>
        <button type="button" onclick="renderOfficialDocTemplate('incoming')" class="nav-btn" style="background:#1d4ed8; color:#fff; padding:7px 11px; font-size:12px;">📥 الوارد</button>
        <button type="button" onclick="renderOfficialDocTemplate('warehouse_issue')" class="nav-btn" style="background:#9a3412; color:#fff; padding:7px 11px; font-size:12px;">📦 إيصال صرف مخزني</button>
        <button type="button" onclick="renderOfficialDocTemplate('warehouse_deposit')" class="nav-btn" style="background:#166534; color:#fff; padding:7px 11px; font-size:12px;">📥 إيصال إيداع مخزني</button>
        <button type="button" onclick="renderOfficialDocTemplate('cash_receipt')" class="nav-btn" style="background:#047857; color:#fff; padding:7px 11px; font-size:12px;">🧾 إيصال استلام نقدي</button>
        <button type="button" onclick="renderOfficialDocTemplate('field_inspection')" class="nav-btn" style="background:#0369a1; color:#fff; padding:7px 11px; font-size:12px;">📝 محضر معاينة ميدانية</button>
        <button type="button" onclick="renderOfficialDocTemplate('custody_handover')" class="nav-btn" style="background:#7c2d12; color:#fff; padding:7px 11px; font-size:12px;">📑 محضر تسليم عهدة</button>
        <button type="button" onclick="renderOfficialDocTemplate('stocktake')" class="nav-btn" style="background:#374151; color:#fff; padding:7px 11px; font-size:12px;">📊 محضر جرد مخزني</button>
      </div>

      <div id="official-doc-editor-box"></div>

      <div class="card no-print" style="margin-top:16px; border-top:3px solid #064e3b;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
          <h4 style="margin:0; color:#064e3b;">🗂️ سجل المستندات والإيصالات المحفوظة إلكترونياً</h4>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <select id="doc-archive-filter" onchange="renderOfficialDocsArchiveTable()" style="margin:0; padding:4px 8px; font-size:12px;">
              <option value="">-- كل المستندات --</option>
              <option value="outgoing">الصادر</option>
              <option value="incoming">الوارد</option>
              <option value="warehouse_issue">إيصالات الصرف المخزني</option>
              <option value="warehouse_deposit">إيصالات الإيداع المخزني</option>
              <option value="board">محاضر مجلس الأمناء</option>
              <option value="delegation">التفويضات الرسمية</option>
              <option value="letter">الخطابات الرسمية</option>
              <option value="cash_receipt">إيصالات الاستلام النقدي</option>
              <option value="field_inspection">محاضر المعاينة الميدانية</option>
              <option value="custody_handover">محاضر تسليم العهد</option>
              <option value="stocktake">محاضر الجرد المخزني</option>
            </select>
            <input id="doc-archive-search" oninput="renderOfficialDocsArchiveTable()" placeholder="بحث بالرقم أو الجهة أو الموضوع..." style="margin:0; padding:4px 8px; font-size:12px;">
          </div>
        </div>
        <div id="official-docs-archive-wrap" style="overflow-x:auto;"></div>
      </div>`;

    window.renderOfficialDocsArchiveTable();
    window.renderOfficialDocTemplate('board');
  };

  window.renderOfficialDocTemplate = async function(type) {
    const editor = document.getElementById('official-doc-editor-box');
    if (!editor) return;
    const cfg = await window.getFoundationSettings();
    const header = window.getOfficialHeaderHtml(cfg);
    const footer = window.getOfficialFooterHtml(cfg);
    const today = new Date().toISOString().slice(0, 10);

    if (type === 'board') {
      const nextBoardNum = window.generateNextOfficialDocNumber('board');
      editor.innerHTML = `
        <div id="printable-official-sheet" class="card" style="background:#fff; color:#0f172a;">
          <div>
            ${header}
            <h4 style="text-align:center; text-decoration:underline; margin:6px 0 14px;">
              محضر مجلس الأمناء رقم ( <input id="brd-doc-num" value="${window.escapeHtml(nextBoardNum)}" style="width:145px; display:inline; padding:3px; margin:0; text-align:center; font-weight:700;"> )
            </h4>
            <strong style="text-decoration:underline;">جدول الأعمال</strong>
            <div style="margin:6px 0 12px; font-size:13px;">
              <div>1- النظر في الجلسة السابقة والتصديق عليها</div>
              <div id="bm-agenda"></div>
              <button type="button" onclick="addDocDynamicLine('bm-agenda', '........................................', true)" class="nav-btn no-print" style="margin-top:4px; font-size:11px;">+ إضافة سطر</button>
            </div>
            <div style="text-align:center; font-weight:700; text-decoration:underline; margin-bottom:6px;">محضر الجلسة</div>
            <p style="font-size:13px; line-height:2.1;">
              إنه في يوم <input placeholder="الأربعاء" style="width:90px; display:inline; padding:3px; margin:0;">
              الموافق <input id="brd-doc-date" type="date" value="${today}" style="width:140px; display:inline; padding:3px; margin:0;">
              وفي تمام الساعة <input placeholder=".... ص" style="width:80px; display:inline; padding:3px; margin:0;">
              بمقر المؤسسة اجتمع أعضاء مجلس الأمناء برئاسة السيد / <input id="brd-chairman" placeholder="..............." style="width:160px; display:inline; padding:3px; margin:0;"> رئيس مجلس الأمناء
              و السيد <input placeholder="...................." style="width:160px; display:inline; padding:3px; margin:0;">
              بصفته <input placeholder="............." style="width:110px; display:inline; padding:3px; margin:0;">
              قائم بأعمال <input placeholder="..................." style="width:140px; display:inline; padding:3px; margin:0;">
            </p>
            <div style="font-size:13px; margin-bottom:10px;">
              <strong>بحضور كلا من:-</strong>
              <div id="bm-att"></div>
              <button type="button" onclick="addDocDynamicLine('bm-att', '....................................', false)" class="nav-btn no-print" style="margin-top:4px; font-size:11px;">+ إضافة سطر</button>
            </div>
            <p style="font-size:13px; line-height:2;">
              ونظراً لاكتمال النصاب القانوني لاجتماع مجلس الأمناء بحضور ( <input placeholder="... الأعضاء" style="width:95px; display:inline; padding:3px; margin:0; text-align:center;"> ) تم بدء النظر في جدول الأعمال واتخاذ القرارات الآتية:
            </p>
            <div style="font-size:13px; margin-bottom:12px;">
              <div>1- تُلي محضر مجلس الجلسة السابقة والتصديق عليه</div>
              <div id="bm-dec"></div>
              <button type="button" onclick="addDocDynamicLine('bm-dec', '........................................', true)" class="nav-btn no-print" style="margin-top:4px; font-size:11px;">+ إضافة سطر</button>
            </div>
            <p style="font-size:13px;">الانتهاء من النظر في جدول الأعمال ورُفعت الجلسة في تمام الساعة <input placeholder="......" style="width:80px; display:inline; padding:3px; margin:0; text-align:center;"> صباحاً</p>
            <div style="display:flex; justify-content:space-between; margin-top:26px; font-weight:700;">
              <span>سكرتير المؤسسة</span><span>رئيس مجلس الأمناء</span>
            </div>
          </div>
          ${footer}
        </div>
        <button type="button" onclick="printOfficialDocSheetOnly('board', 'brd-doc-num', 'brd-doc-date', 'brd-chairman')" class="action-btn no-print">💾 حفظ وطباعة المحضر</button>`;
      window.addDocDynamicLine('bm-agenda', '........................................', true);
      window.addDocDynamicLine('bm-att', '....................................', false);
      window.addDocDynamicLine('bm-dec', '........................................', true);
    } else if (type === 'delegation') {
      const nextDlgNum = window.generateNextOfficialDocNumber('delegation');
      editor.innerHTML = `
        <div id="printable-official-sheet" class="card" style="background:#fff; color:#0f172a;">
          <div>
            ${header}
            <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:8px;">
              <span><strong>رقم التفويض:</strong> <input id="dlg-doc-num" value="${window.escapeHtml(nextDlgNum)}" style="width:140px; display:inline; padding:2px 6px; margin:0; font-weight:700;"></span>
              <span><strong>التاريخ:</strong> <input id="dlg-doc-date" type="date" value="${today}" style="width:135px; display:inline; padding:2px 6px; margin:0;"></span>
            </div>
            <p style="font-weight:700;">السادة الأفاضل / <input placeholder="............................................." style="width:65%; display:inline; padding:4px; margin:0;"></p>
            <p style="text-align:center; font-weight:700;">تحية طيبة وبعد،،،</p>
            <p style="font-size:13px; line-height:2;">
              تتشرف مؤسسة الحافظ، المشهرة برقم (2202) لسنة 2025 ونطاق عملها جمهورية مصر العربية، بأن تتقدم لسيادتكم بوافر التقدير على دوركم الرائد في العمل الأهلي.<br>
              وفي إطار سعي المؤسسة لتوسيع دائرة التعاون مع مؤسستكم الموقرة لخدمة الفئات الأولى بالرعاية، فقد تقرر:<br>
              <strong>تفويض السيد/ه</strong> <input id="dlg-person" placeholder="............................................." style="width:60%; display:inline; padding:4px; margin:2px 0;"><br>
              <strong>بطاقة رقم قومي</strong> <input maxlength="14" placeholder="............................................." style="width:60%; display:inline; padding:4px; margin:2px 0;"><br>
              <strong>بصفته /</strong> <input placeholder="............................................." style="width:65%; display:inline; padding:4px; margin:2px 0;"><br>
              وذلك للتمثيل والتنسيق والتعامل في كافة الأنشطة والخدمات والتي تشمل: مشروعات البنية التحتية، المساعدات الموسمية، الجانب الطبي، التمكين الاقتصادي، والجانب الاجتماعي، وللمفوض الحق في تقديم طلبات التعاون وتوقيع محاضر التنسيق الميداني واستلام وتسليم الكشوف والبحوث الاجتماعية الخاصة بالمستفيدين وتمثيل المؤسسة في الاجتماعات التنسيقية والمتابعة الميدانية.<br>
              هذا التفويض سارٍ من تاريخه وحتى إلغاؤه رسمياً.
            </p>
            <p style="text-align:center; font-weight:700;">وتفضلوا بقبول فائق الاحترام والتقدير،،،</p>
            <div style="margin-top:18px; font-weight:700; line-height:2;">
              اعتماد رئيس مجلس الأمناء<br>
              الاسم: <input placeholder="............................" style="width:200px; display:inline; padding:4px; margin:0;"><br>
              الختم:
            </div>
          </div>
          ${footer}
        </div>
        <button type="button" onclick="printOfficialDocSheetOnly('delegation', 'dlg-doc-num', 'dlg-doc-date', 'dlg-person')" class="action-btn no-print">💾 حفظ وطباعة التفويض</button>`;
    } else if (type === 'letter') {
      const nextLtrNum = window.generateNextOfficialDocNumber('letter');
      editor.innerHTML = `
        <div id="printable-official-sheet" class="card" style="background:#fff; color:#0f172a;">
          <div>
            ${header}
            <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:8px;">
              <span><strong>رقم الخطاب:</strong> <input id="ltr-doc-num" value="${window.escapeHtml(nextLtrNum)}" style="width:140px; display:inline; padding:2px 6px; margin:0; font-weight:700;"></span>
              <span><strong>التاريخ:</strong> <input id="ltr-doc-date" type="date" value="${today}" style="width:135px; display:inline; padding:2px 6px; margin:0;"></span>
            </div>
            <div style="font-weight:800; margin-top:8px;">السيد / <input id="ltr-to" placeholder="................................................" style="width:70%; display:inline; padding:4px; margin:0;"></div>
            <p style="text-align:center; font-weight:700;">تحية طيبة وبعد،</p>
            <div style="font-weight:700; margin-bottom:8px;">الموضوع: <input placeholder="................................................" style="width:72%; display:inline; padding:4px; margin:0;"></div>
            <div id="let-lines"></div>
            <div class="no-print" style="display:flex; gap:6px; flex-wrap:wrap; margin-top:6px;">
              <button type="button" onclick="addDocDynamicLine('let-lines', '....................................................................', false)" class="nav-btn" style="font-size:11px;">+ إضافة سطر</button>
              <button type="button" onclick="addDocDynamicLine('let-lines', '....................................................................', true)" class="nav-btn btn-gold" style="font-size:11px;">+ إضافة بند مرقم</button>
            </div>
            <p style="text-align:center; font-weight:700; margin-top:24px;">وتفضلوا بقبول وافر التحية والتقدير،</p>
            <div style="text-align:left; font-weight:700; margin-top:20px; padding-left:24px;">رئيس مجلس الأمناء</div>
          </div>
          ${footer}
        </div>
        <button type="button" onclick="printOfficialDocSheetOnly('letter', 'ltr-doc-num', 'ltr-doc-date', 'ltr-to')" class="action-btn no-print">💾 حفظ وطباعة الخطاب</button>`;
      window.addDocDynamicLine('let-lines', '....................................................................', false);
    } else if (type === 'outgoing') {
      const nextOutNum = window.generateNextOfficialDocNumber('outgoing');
      editor.innerHTML = `
        <div class="card" style="background:#fff; color:#0f172a;">
          <h4 style="margin:0 0 10px; color:#0f766e;">📤 تحرير وحفظ خطاب صادر جديد</h4>
          <div class="grid-3">
            <div><label style="font-size:11px; font-weight:700;">رقم الصادر (تلقائي):</label><input id="out-doc-num" value="${window.escapeHtml(nextOutNum)}" style="margin:0; font-weight:700;"></div>
            <div><label style="font-size:11px; font-weight:700;">تاريخ الصادر:</label><input id="out-doc-date" type="date" value="${today}" style="margin:0;"></div>
            <div><label style="font-size:11px; font-weight:700;">المرفقات (اختياري):</label><input id="out-attachments" placeholder="مثال: كشف أسماء / صورة مستند" style="margin:0;"></div>
          </div>
          <div class="grid-2" style="margin-top:8px;">
            <div><label style="font-size:11px; font-weight:700;">الجهة المرسل إليها *:</label><input id="out-to-party" placeholder="مثال: إدارة إهناسيا الاجتماعية / بنك الطعام..." style="margin:0;"></div>
            <div><label style="font-size:11px; font-weight:700;">الموضوع *:</label><input id="out-subject" placeholder="موضوع الخطاب الصادر" style="margin:0;"></div>
          </div>
          <div style="margin-top:8px;">
            <label style="font-size:11px; font-weight:700;">نص الخطاب الصادر *:</label>
            <textarea id="out-body" rows="5" placeholder="اكتب نص الخطاب الصادر بوضوح..." style="margin:0;"></textarea>
          </div>
          <div style="margin-top:10px; display:flex; gap:8px;">
            <button type="button" onclick="saveAndPrintOutgoingDoc()" class="action-btn" style="background:#0f766e;">💾 حفظ في السجل وطباعة الصادر</button>
          </div>
        </div>`;
    } else if (type === 'incoming') {
      const nextInNum = window.generateNextOfficialDocNumber('incoming');
      editor.innerHTML = `
        <div class="card" style="background:#fff; color:#0f172a;">
          <h4 style="margin:0 0 10px; color:#1d4ed8;">📥 قيد وحفظ مستند وارد جديد</h4>
          <div class="grid-3">
            <div><label style="font-size:11px; font-weight:700;">رقم قيد الوارد (تلقائي):</label><input id="in-doc-num" value="${window.escapeHtml(nextInNum)}" style="margin:0; font-weight:700;"></div>
            <div><label style="font-size:11px; font-weight:700;">تاريخ الورود:</label><input id="in-doc-date" type="date" value="${today}" style="margin:0;"></div>
            <div><label style="font-size:11px; font-weight:700;">رقم وتاريخ خطاب الجهة:</label><input id="in-ref-no-date" placeholder="مثال: 412 بتاريخ 15/11/2026" style="margin:0;"></div>
          </div>
          <div class="grid-2" style="margin-top:8px;">
            <div><label style="font-size:11px; font-weight:700;">الجهة الوارد منها *:</label><input id="in-from-party" placeholder="اسم الجهة أو المؤسسة أو الشخص" style="margin:0;"></div>
            <div><label style="font-size:11px; font-weight:700;">الموضوع *:</label><input id="in-subject" placeholder="موضوع الوارد" style="margin:0;"></div>
          </div>
          <div class="grid-2" style="margin-top:8px;">
            <div><label style="font-size:11px; font-weight:700;">المرفقات:</label><input id="in-attachments" placeholder="عدد الأوراق أو المرفقات" style="margin:0;"></div>
            <div><label style="font-size:11px; font-weight:700;">التوجيه الإداري:</label><input id="in-directive" placeholder="مثال: يُحال للبحث الميداني / يُحفظ بالملف" style="margin:0;"></div>
          </div>
          <div style="margin-top:10px;">
            <button type="button" onclick="saveAndPrintIncomingDoc()" class="action-btn" style="background:#1d4ed8;">💾 حفظ في سجل الوارد وطباعة الإفادة</button>
          </div>
        </div>`;
    } else if (type === 'warehouse_issue' || type === 'warehouse_deposit') {
      const isIssue = type === 'warehouse_issue';
      const nextWhNum = window.generateNextOfficialDocNumber(type);
      editor.innerHTML = `
        <div class="card" style="background:#fff; color:#0f172a;">
          <h4 style="margin:0 0 10px; color:${isIssue ? '#9a3412' : '#166534'};">
            ${isIssue ? '📦 تحرير إيصال / إذن صرف مخزني' : '📥 تحرير إيصال / إذن إيداع واستلام مخزني'}
          </h4>
          <div class="grid-3">
            <div><label style="font-size:11px; font-weight:700;">رقم الإيصال (تلقائي):</label><input id="wh-doc-num" value="${window.escapeHtml(nextWhNum)}" style="margin:0; font-weight:700;"></div>
            <div><label style="font-size:11px; font-weight:700;">التاريخ:</label><input id="wh-doc-date" type="date" value="${today}" style="margin:0;"></div>
            <div><label style="font-size:11px; font-weight:700;">${isIssue ? 'اسم المستلم / الجهة *:' : 'المودِع / مصدر الإيداع *:'}</label><input id="wh-party-name" placeholder="${isIssue ? 'اسم المستلم أو القرية/المبادرة' : 'اسم المتبرع / المورِّد / الجهة'}" style="margin:0;"></div>
          </div>
          <div style="margin-top:8px;">
            <label style="font-size:11px; font-weight:700;">البيان / الغرض:</label>
            <input id="wh-purpose" placeholder="${isIssue ? 'صرف مساعدات موسمية / قافلة طبية...' : 'إيداع تبرعات عينية / مشتريات مخزنية...'}" style="margin:0;">
          </div>
          <div style="overflow-x:auto; margin-top:10px;">
            <table>
              <thead>
                <tr><th style="width:45px;">م</th><th>الصنف / البيان</th><th style="width:95px;">الوحدة</th><th style="width:105px;">الكمية</th><th>ملاحظات</th><th style="width:45px;">حذف</th></tr>
              </thead>
              <tbody id="wh-items-tbody"></tbody>
            </table>
          </div>
          <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-top:10px;">
            <button type="button" onclick="addWarehouseItemRow('wh-items-tbody')" class="nav-btn btn-gold" style="font-size:12px;">+ إضافة صنف</button>
            <button type="button" onclick="saveAndPrintWarehouseReceipt('${type}')" class="action-btn" style="background:${isIssue ? '#9a3412' : '#166534'};">💾 حفظ الإيصال وطباعته</button>
          </div>
        </div>`;
      window.addWarehouseItemRow('wh-items-tbody');
    } else if (type === 'cash_receipt') {
      const nextCshNum = window.generateNextOfficialDocNumber('cash_receipt');
      editor.innerHTML = `
        <div id="printable-official-sheet" class="card" style="background:#fff; color:#0f172a;">
          <div>
            ${header}
            <h4 style="text-align:center; text-decoration:underline; margin:6px 0 14px;">
              إيصال استلام نقدي / تبرع مالي رقم ( <input id="csh-doc-num" value="${window.escapeHtml(nextCshNum)}" style="width:145px; display:inline; padding:3px; margin:0; text-align:center; font-weight:700;"> )
            </h4>
            <p style="font-size:13px; line-height:2.1;">
              التاريخ: <input id="csh-doc-date" type="date" value="${today}" style="width:140px; display:inline; padding:3px; margin:0;"><br>
              استلمنا من السيد / السادة: <input id="csh-donor" placeholder="................................................" style="width:65%; display:inline; padding:4px; margin:0;"><br>
              مبلغ وقدره: <input placeholder="..................." style="width:150px; display:inline; padding:4px; margin:0;"> جنيه مصري (فقط: <input placeholder="........................................" style="width:45%; display:inline; padding:4px; margin:0;">)<br>
              طريقة السداد: <select style="width:170px; display:inline; padding:3px; margin:0;"><option>نقدي</option><option>تحويل بنكي / إنستا باي</option><option>شيك</option></select>
              — البند / الغرض: <input placeholder="تبرع عام / زكاة / صدقة / كفالة / مشروع" style="width:45%; display:inline; padding:4px; margin:0;">
            </p>
            <div style="display:flex; justify-content:space-between; margin-top:32px; font-weight:700; font-size:13px;">
              <span>المُسلِّم / المتبرع</span><span>أمين الصندوق / المستلم</span><span>اعتماد رئيس مجلس الأمناء</span>
            </div>
          </div>
          ${footer}
        </div>
        <button type="button" onclick="printOfficialDocSheetOnly('cash_receipt', 'csh-doc-num', 'csh-doc-date', 'csh-donor')" class="action-btn no-print">💾 حفظ وطباعة الإيصال النقدي</button>`;
    } else if (type === 'field_inspection') {
      const nextInspNum = window.generateNextOfficialDocNumber('field_inspection');
      editor.innerHTML = `
        <div id="printable-official-sheet" class="card" style="background:#fff; color:#0f172a;">
          <div>
            ${header}
            <h4 style="text-align:center; text-decoration:underline; margin:6px 0 14px;">
              محضر معاينة / بحث اجتماعي ميداني رقم ( <input id="insp-doc-num" value="${window.escapeHtml(nextInspNum)}" style="width:145px; display:inline; padding:3px; margin:0; text-align:center; font-weight:700;"> )
            </h4>
            <p style="font-size:13px; line-height:2.1;">
              بتاريخ <input id="insp-doc-date" type="date" value="${today}" style="width:140px; display:inline; padding:3px; margin:0;">
              تم إجراء معاينة ميدانية للحالة / الأسرة: <input id="insp-case-name" placeholder="................................................" style="width:55%; display:inline; padding:4px; margin:0;"><br>
              العنوان / القرية: <input placeholder="................................................" style="width:65%; display:inline; padding:4px; margin:0;">
            </p>
            <div id="insp-lines"></div>
            <button type="button" onclick="addDocDynamicLine('insp-lines', '....................................................................', true)" class="nav-btn no-print" style="margin-top:6px; font-size:11px;">+ إضافة ملاحظة معاينة</button>
            <div style="display:flex; justify-content:space-between; margin-top:28px; font-weight:700; font-size:13px;">
              <span>الباحث الميداني</span><span>مراجع الحالة</span><span>رئيس مجلس الأمناء</span>
            </div>
          </div>
          ${footer}
        </div>
        <button type="button" onclick="printOfficialDocSheetOnly('field_inspection', 'insp-doc-num', 'insp-doc-date', 'insp-case-name')" class="action-btn no-print">💾 حفظ وطباعة محضر المعاينة</button>`;
      window.addDocDynamicLine('insp-lines', 'وصف حالة المسكن والأسرة والاحتياج الفعلي: ............................', true);
    } else if (type === 'custody_handover') {
      const nextCstNum = window.generateNextOfficialDocNumber('custody_handover');
      editor.innerHTML = `
        <div id="printable-official-sheet" class="card" style="background:#fff; color:#0f172a;">
          <div>
            ${header}
            <h4 style="text-align:center; text-decoration:underline; margin:6px 0 14px;">
              محضر تسليم واستلام عهدة / مساعدات رقم ( <input id="cst-doc-num" value="${window.escapeHtml(nextCstNum)}" style="width:145px; display:inline; padding:3px; margin:0; text-align:center; font-weight:700;"> )
            </h4>
            <p style="font-size:13px; line-height:2.1;">
              التاريخ: <input id="cst-doc-date" type="date" value="${today}" style="width:140px; display:inline; padding:3px; margin:0;">
              — المُسلِّم: <input placeholder="......................................" style="width:45%; display:inline; padding:4px; margin:0;"><br>
              المُستلِم / صاحب العهدة: <input id="cst-receiver" placeholder="......................................" style="width:55%; display:inline; padding:4px; margin:0;">
            </p>
            <div id="cst-lines"></div>
            <button type="button" onclick="addDocDynamicLine('cst-lines', '....................................................................', true)" class="nav-btn no-print" style="margin-top:6px; font-size:11px;">+ إضافة بند عهدة/مساعدة</button>
            <div style="display:flex; justify-content:space-between; margin-top:28px; font-weight:700; font-size:13px;">
              <span>المُسلِّم</span><span>المُستلِم</span><span>اعتماد الإدارة</span>
            </div>
          </div>
          ${footer}
        </div>
        <button type="button" onclick="printOfficialDocSheetOnly('custody_handover', 'cst-doc-num', 'cst-doc-date', 'cst-receiver')" class="action-btn no-print">💾 حفظ وطباعة محضر العهدة</button>`;
      window.addDocDynamicLine('cst-lines', '....................................................................', true);
    } else if (type === 'stocktake') {
      const nextStkNum = window.generateNextOfficialDocNumber('stocktake');
      editor.innerHTML = `
        <div id="printable-official-sheet" class="card" style="background:#fff; color:#0f172a;">
          <div>
            ${header}
            <h4 style="text-align:center; text-decoration:underline; margin:6px 0 14px;">
              محضر جرد مخزني / تسوية عهدة رقم ( <input id="stk-doc-num" value="${window.escapeHtml(nextStkNum)}" style="width:145px; display:inline; padding:3px; margin:0; text-align:center; font-weight:700;"> )
            </h4>
            <p style="font-size:13px; line-height:2.1;">
              التاريخ: <input id="stk-doc-date" type="date" value="${today}" style="width:140px; display:inline; padding:3px; margin:0;">
              — المخزن / الموقع: <input id="stk-loc" placeholder="مخزن المؤسسة الرئيسي" style="width:55%; display:inline; padding:4px; margin:0;">
            </p>
            <div id="stk-lines"></div>
            <button type="button" onclick="addDocDynamicLine('stk-lines', '....................................................................', true)" class="nav-btn no-print" style="margin-top:6px; font-size:11px;">+ إضافة صنف للجرد</button>
            <div style="display:flex; justify-content:space-between; margin-top:28px; font-weight:700; font-size:13px;">
              <span>أمين المخزن</span><span>لجنة الجرد</span><span>رئيس مجلس الأمناء</span>
            </div>
          </div>
          ${footer}
        </div>
        <button type="button" onclick="printOfficialDocSheetOnly('stocktake', 'stk-doc-num', 'stk-doc-date', 'stk-loc')" class="action-btn no-print">💾 حفظ وطباعة محضر الجرد</button>`;
      window.addDocDynamicLine('stk-lines', '....................................................................', true);
    }
  };

  window.openPartnerRegister = function() {
    document.getElementById('login-box')?.classList.add('hidden');
    const box = document.getElementById('partner-register-box');
    if (!box) return;
    box.classList.remove('hidden');
    box.innerHTML = `
      <h4 style="color:var(--primary-dark); margin-top:0;">+ طلب انضمام جديد للمنظومة</h4>
      <select id="req-role">
        <option value="researcher">باحث ميداني</option>
        <option value="volunteer">متطوع</option>
        <option value="partner">جهة شريكة / جمعية</option>
        <option value="donor">جهة مانحة</option>
      </select>
      <input id="req-name" placeholder="الاسم الكامل أو اسم الجهة *">
      <input id="req-phone" maxlength="11" placeholder="رقم الهاتف / واتساب (11 رقم) *">
      <input id="req-email" type="email" placeholder="البريد الإلكتروني (إلزامي) *">
      <input id="req-pass" type="password" placeholder="كلمة المرور المقترحة *">
      <button type="button" onclick="submitNewMembershipRequest()" class="action-btn" style="width:100%; margin-bottom:8px;">إرسال طلب الانضمام</button>
      <button type="button" onclick="location.reload()" class="nav-btn" style="width:100%;">رجوع</button>`;
  };

  window.submitNewMembershipRequest = async function() {
    const role = document.getElementById('req-role')?.value || 'researcher';
    const full_name = (document.getElementById('req-name')?.value || '').trim();
    const phone = (document.getElementById('req-phone')?.value || '').trim();
    const email = (document.getElementById('req-email')?.value || '').trim().toLowerCase();
    const password_hash = (document.getElementById('req-pass')?.value || '').trim();
    if (!full_name || !phone || !email || !password_hash) return alert('⚠️ استكمل جميع الحقول بما فيها البريد الإلكتروني ورقم الهاتف.');
    if (!/^01[0125]\d{8}$/.test(phone)) return alert('⚠️ رقم الهاتف يجب أن يتكون من 11 رقماً يبدأ بـ 01.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return alert('⚠️ يرجى إدخال بريد إلكتروني صحيح.');

    const member_code = 'MEM-' + Math.floor(1000 + Math.random() * 9000);
    const { error } = await window.supabaseClient.from('users_profiles').insert([{
      member_code, full_name, phone, email, password_hash, role, account_status: 'pending'
    }]);
    if (error) return alert('❌ خطأ: ' + error.message);

    const officialWhatsApp = (window.FOUNDATION_CONFIG && window.FOUNDATION_CONFIG.whatsappPhone) || '01000880156';
    const noticeMsg =
      `مؤسسة الحافظ للتنمية والخدمات (واتساب رسمي: ${officialWhatsApp})\n` +
      `تم استلام طلب انضمامكم بنجاح بكود (${member_code}) وهو قيد المراجعة.\n` +
      `الاسم: ${full_name}\n` +
      `البريد الإلكتروني: ${email}`;

    await sendDualChannelNotice({
      phone,
      email,
      subject: `تأكيد استلام طلب الانضمام (${member_code}) - مؤسسة الحافظ`,
      message: noticeMsg
    });

    alert('✅ تم إرسال طلب الانضمام وحفظه في قاعدة البيانات بنجاح.');
    location.reload();
  };
})();
