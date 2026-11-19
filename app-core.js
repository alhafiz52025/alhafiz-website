// app-core.js - المحرك الأساسي للموقع ولوحة الإدارة والتظلمات والنماذج الرسمية لمؤسسة الحافظ
(function() {
  const DEFAULT_ADMIN = {
    email: 'alhafiz52025@gmail.com',
    pass: 'Alhafiz@2025',
    name: 'رئيس مجلس الأمناء',
    role: 'admin'
  };

  window.currentUser = JSON.parse(sessionStorage.getItem('hf_current_user') || 'null');
  let currentLang = 'ar';
  let currentFontScale = 100;

  // تهيئة عميل Supabase إذا كانت بياناته موجودة في supabase-config.js
  if (!window.supabaseClient && window.SUPABASE_URL && window.SUPABASE_ANON_KEY && window.supabase) {
    window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  }

  window.addEventListener('DOMContentLoaded', () => {
    renderFaqList();
    renderPublicAchievements();
    if (window.currentUser) {
      renderDashboard();
    }
  });

  window.showSection = function(sectionName) {
    const sections = document.querySelectorAll('.container > section');
    sections.forEach(sec => sec.classList.add('hidden'));
    const target = document.getElementById('section-' + sectionName);
    if (target) {
      target.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (sectionName === 'apply' && typeof window.renderWizardStep === 'function') {
      window.renderWizardStep();
    } else if (sectionName === 'login' && window.currentUser) {
      renderDashboard();
    }
  };

  window.toggleLanguage = function() {
    currentLang = currentLang === 'ar' ? 'en' : 'ar';
    const root = document.getElementById('html-root');
    if (root) {
      root.lang = currentLang;
      root.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    }
    const btn = document.getElementById('lang-toggle-btn');
    if (btn) btn.innerText = currentLang === 'ar' ? 'English' : 'العربية';

    document.querySelectorAll('[data-ar][data-en]').forEach(el => {
      const val = currentLang === 'ar' ? el.getAttribute('data-ar') : el.getAttribute('data-en');
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = val;
      } else if (el.children.length === 0) {
        el.textContent = val;
      }
    });
  };

  window.adjustFontSize = function(delta) {
    currentFontScale = Math.min(130, Math.max(85, currentFontScale + delta * 5));
    document.body.style.fontSize = currentFontScale + '%';
  };

  window.toggleDarkMode = function() {
    document.body.classList.toggle('dark-mode');
  };

  window.copyText = function(txt) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(() => alert('تم النسخ: ' + txt)).catch(() => prompt('انسخ الرقم:', txt));
    } else {
      prompt('انسخ الرقم:', txt);
    }
  };

  function renderFaqList() {
    const box = document.getElementById('faq-dynamic-list');
    if (!box) return;
    const items = window.FAQ_ITEMS || [];
    box.innerHTML = items.map((item, idx) => `
      <div style="background: var(--bg-color); padding: 14px; border-radius: 10px; border: 1px solid var(--border);">
        <h4 style="color: var(--primary); margin: 0 0 6px;">${idx + 1}. ${item.q}</h4>
        <p style="margin: 0; font-size: 14px; line-height: 1.6;">${item.a}</p>
      </div>
    `).join('');
  }

  function renderPublicAchievements() {
    const container = document.getElementById('public-achievements-container');
    if (!container) return;
    const sample = [
      { title: 'قافلة مساعدات غذائية وتنموية', loc: 'قرى مركز إهناسيا - بني سويف', desc: 'توزيع حقائب غذائية ومساندة أسر مستحقة وفق قاعدة بيانات موحدة تمنع التكرار.' },
      { title: 'مبادرة الدفء الشتوي والأغطية', loc: 'منشأة عبدالصمد ومنهرة وتوابعهما', desc: 'توفير بطاطين وأغطية شتوية للأسر الأولى بالرعاية وكبار السن.' },
      { title: 'التمكين والدعم الاجتماعي', loc: 'مراكز محافظة بني سويف', desc: 'دراسة الحالات وتقديم الدعم العيني والنقدي والطبي للمستحقين بعد البحث الميداني.' }
    ];
    container.innerHTML = sample.map(s => `
      <div style="background: var(--bg-color); border: 1px solid var(--border); border-radius: 12px; padding: 14px;">
        <strong style="color: var(--primary-dark); font-size: 15px;">${s.title}</strong>
        <p style="font-size: 12px; color: var(--accent); margin: 4px 0 8px; font-weight: 700;">${s.loc}</p>
        <p style="font-size: 13px; margin: 0;">${s.desc}</p>
      </div>
    `).join('');
  }

  window.saveDraft = function() {
    if (typeof window.saveCurrentStepData === 'function') {
      try { window.saveCurrentStepData(); } catch (e) {}
    }
    localStorage.setItem('hf_wizard_draft', JSON.stringify({
      step: window.currentStep || 1,
      data: window.formData || {}
    }));
    alert('💾 تم حفظ مسودة الاستمارة محلياً على جهازك.');
  };

  // --- إرسال التظلمات السرية وحفظها في قاعدة البيانات وإرسال واتساب فوري ---
  window.submitGrievance = async function() {
    const feedback = document.getElementById('grievance-feedback');
    const type = document.getElementById('grievance-type')?.value || 'تظلم من رفض طلب مساعدة';
    const fullName = (document.getElementById('grievance-name')?.value || '').trim();
    const email = (document.getElementById('grievance-email')?.value || '').trim();
    const address = (document.getElementById('grievance-address')?.value || '').trim();
    const phone = (document.getElementById('grievance-phone')?.value || '').trim();
    const details = (document.getElementById('grievance-details')?.value || '').trim();

    if (!fullName || !address || !phone || !details) {
      if (feedback) feedback.innerHTML = '<div style="color:#b91c1c; font-weight:700;">⚠️ يرجى استكمال الاسم كاملاً، العنوان بالتفصيل، رقم الهاتف، وتفاصيل التظلم.</div>';
      return;
    }
    if (!/^01[0125]\d{8}$/.test(phone)) {
      if (feedback) feedback.innerHTML = '<div style="color:#b91c1c; font-weight:700;">⚠️ رقم الهاتف يجب أن يتكون من 11 رقماً يبدأ بـ 01.</div>';
      return;
    }

    const code = 'GRV-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
    const row = {
      tracking_code: code,
      grievance_type: type,
      full_name: fullName,
      email: email || null,
      address_details: address,
      phone,
      message_body: details,
      status: 'pending'
    };

    const localList = JSON.parse(localStorage.getItem('hf_local_grievances') || '[]');
    localList.unshift({ ...row, created_at: new Date().toISOString() });
    localStorage.setItem('hf_local_grievances', JSON.stringify(localList));

    if (window.supabaseClient) {
      const res = await window.supabaseClient.from('grievances').insert([row]);
      if (res.error) {
        if (feedback) feedback.innerHTML = `<div style="color:#b91c1c; font-weight:700;">⚠️ تم الحفظ مؤقتاً؛ تعذر الإرسال السحابي: ${res.error.message}</div>`;
      }
    }

    const waMsg = `مؤسسة الحافظ للتنمية والخدمات\nتم استلام رسالتكم / تظلمكم بنجاح.\nرقم الطلب: ${code}\nالاسم: ${fullName}\nسيتم الفحص والرد في أقرب وقت.`;
    if (typeof window.triggerInstantWhatsApp === 'function') {
      window.triggerInstantWhatsApp(phone, waMsg);
    }

    if (feedback) {
      feedback.innerHTML = `<div style="background:#ecfdf5; border:1px solid #a7f3d0; color:#065f46; padding:12px; border-radius:8px; font-weight:700;">
        ✅ تم إرسال رسالتكم بسرية تامة بنجاح!<br>رقم الطلب الخاص بكم: <strong>${code}</strong><br>
        <span style="font-size:12px; font-weight:600;">في حال وجود أي مشكلة، يرجى التوجه إلى مقر المؤسسة أو شاشة التظلمات، وسوف نرد على حضراتكم في أقرب وقت مع تحيات مؤسسة الحافظ.</span>
      </div>`;
    }

    ['grievance-name', 'grievance-email', 'grievance-address', 'grievance-phone', 'grievance-details'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  };

  // --- الاستعلام عن طلب مساعدة أو تظلم ---
  window.trackApplication = async function() {
    const q = (document.getElementById('track-input')?.value || '').trim();
    const resBox = document.getElementById('track-result');
    if (!q || !resBox) return;
    resBox.innerHTML = '<p style="font-size:13px;">جاري البحث...</p>';

    let found = null;
    if (window.supabaseClient) {
      const { data } = await window.supabaseClient
        .from('families')
        .select('*')
        .or(`tracking_code.eq.${q},husband_data->>nid.eq.${q}`)
        .limit(1);
      if (data && data.length > 0) found = data[0];
    }

    if (!found) {
      const localGrv = JSON.parse(localStorage.getItem('hf_local_grievances') || '[]');
      const g = localGrv.find(item => item.tracking_code === q || item.phone === q);
      if (g) {
        resBox.innerHTML = `<div style="background:#f8fafc; border:1px solid #cbd5e1; padding:14px; border-radius:10px;">
          <strong>رقم التظلم:</strong> ${g.tracking_code}<br>
          <strong>النوع:</strong> ${g.grievance_type}<br>
          <strong>مقدم الطلب:</strong> ${g.full_name}<br>
          <strong>الحالة:</strong> قيد المراجعة
        </div>`;
        return;
      }
      resBox.innerHTML = '<div style="color:#b91c1c; font-weight:700;">لم يتم العثور على طلب مطابق لبيانات البحث المدخلة.</div>';
      return;
    }

    const h = found.husband_data || {};
    const fullName = [h.name1, h.name2, h.name3].filter(Boolean).join(' ') || 'غير محدد';
    resBox.innerHTML = `
      <div style="background:#ecfdf5; border:1px solid #a7f3d0; padding:16px; border-radius:12px;">
        <strong>رقم الطلب:</strong> ${found.tracking_code}<br>
        <strong>اسم رب الأسرة:</strong> ${fullName}<br>
        <strong>نوع التدخل:</strong> ${found.intervention_type}<br>
        <strong>العنوان:</strong> ${found.governorate} - ${found.center_city} - ${found.village_hamlet}<br>
        <strong>حالة الطلب:</strong> ${found.status === 'approved' ? 'مقبول / مستحق' : (found.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة')}<br>
        <strong>تقييم الاستحقاق:</strong> ${found.eligibility_verdict || 'قيد المراجعة'}
      </div>
    `;
  };

  // --- تسجيل الدخول وطلب الانضمام ---
  window.loginUser = function() {
    const email = (document.getElementById('login-email')?.value || '').trim().toLowerCase();
    const pass = (document.getElementById('login-pass')?.value || '').trim();
    const creds = JSON.parse(localStorage.getItem('hf_admin_creds') || 'null') || DEFAULT_ADMIN;

    if (email === creds.email.toLowerCase() && pass === creds.pass) {
      window.currentUser = { email: creds.email, name: creds.name, role: creds.role };
      sessionStorage.setItem('hf_current_user', JSON.stringify(window.currentUser));
      renderDashboard();
    } else {
      alert('⚠️ البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    }
  };

  window.logoutUser = function() {
    window.currentUser = null;
    sessionStorage.removeItem('hf_current_user');
    document.getElementById('dashboard-area')?.classList.add('hidden');
    document.getElementById('login-box')?.classList.remove('hidden');
  };

  window.openPartnerRegister = function() {
    document.getElementById('login-box')?.classList.add('hidden');
    const box = document.getElementById('partner-register-box');
    if (!box) return;
    box.classList.remove('hidden');
    box.innerHTML = `
      <h4 style="color:var(--primary-dark); margin-top:0;">+ طلب انضمام جديد (باحث / متطوع / جهة شريكة / مانح)</h4>
      <input id="req-name" placeholder="الاسم الكامل أو اسم الجهة *">
      <input id="req-nid" maxlength="14" placeholder="الرقم القومي (14 رقم) إن وجد">
      <input id="req-phone" maxlength="11" placeholder="رقم الهاتف (11 رقم) *">
      <input id="req-email" type="email" placeholder="البريد الإلكتروني *">
      <select id="req-role">
        <option value="researcher">باحث ميداني</option>
        <option value="volunteer">متطوع</option>
        <option value="partner">جهة شريكة / جمعية</option>
        <option value="donor">جهة مانحة</option>
      </select>
      <textarea id="req-notes" rows="3" placeholder="الخبرات أو نطاق العمل أو ملاحظات الانضمام"></textarea>
      <div style="display:flex; gap:10px; margin-top:8px;">
        <button type="button" onclick="submitMembershipRequest()" class="action-btn">إرسال طلب الانضمام</button>
        <button type="button" onclick="closePartnerRegister()" class="nav-btn">رجوع للدخول</button>
      </div>
      <div id="req-feedback" style="margin-top:10px;"></div>
    `;
  };

  window.closePartnerRegister = function() {
    document.getElementById('partner-register-box')?.classList.add('hidden');
    document.getElementById('login-box')?.classList.remove('hidden');
  };

  window.submitMembershipRequest = async function() {
    const name = (document.getElementById('req-name')?.value || '').trim();
    const nid = (document.getElementById('req-nid')?.value || '').trim();
    const phone = (document.getElementById('req-phone')?.value || '').trim();
    const email = (document.getElementById('req-email')?.value || '').trim();
    const role = document.getElementById('req-role')?.value || 'researcher';
    const notes = (document.getElementById('req-notes')?.value || '').trim();
    const fb = document.getElementById('req-feedback');

    if (!name || !phone || !email) {
      if (fb) fb.innerHTML = '<div style="color:#b91c1c; font-weight:700;">⚠️ يرجى إدخال الاسم، رقم الهاتف، والبريد الإلكتروني.</div>';
      return;
    }

    const reqCode = 'MEM-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const payload = {
      request_code: reqCode,
      full_name: name,
      national_id: nid || null,
      phone,
      email,
      requested_role: role,
      notes,
      status: 'pending'
    };

    const localMem = JSON.parse(localStorage.getItem('hf_local_memberships') || '[]');
    localMem.unshift({ ...payload, created_at: new Date().toISOString() });
    localStorage.setItem('hf_local_memberships', JSON.stringify(localMem));

    if (window.supabaseClient) {
      await window.supabaseClient.from('membership_requests').insert([payload]);
    }

    if (typeof window.triggerInstantWhatsApp === 'function') {
      window.triggerInstantWhatsApp(phone, `مؤسسة الحافظ للتنمية والخدمات\nتم استلام طلب الانضمام الخاص بكم.\nرقم الطلب: ${reqCode}\nالحالة: قيد المراجعة.`);
    }

    if (fb) {
      fb.innerHTML = `<div style="background:#ecfdf5; border:1px solid #a7f3d0; color:#065f46; padding:10px; border-radius:8px; font-weight:700;">
        ✅ تم تسجيل طلب الانضمام بنجاح برقم: <strong>${reqCode}</strong> (قيد المراجعة).
      </div>`;
    }
  };

  // --- لوحة الإدارة الاحترافية ---
  window.renderDashboard = async function() {
    document.getElementById('login-box')?.classList.add('hidden');
    document.getElementById('partner-register-box')?.classList.add('hidden');
    const area = document.getElementById('dashboard-area');
    if (!area) return;
    area.classList.remove('hidden');

    let families = [];
    let grievances = JSON.parse(localStorage.getItem('hf_local_grievances') || '[]');
    let memberships = JSON.parse(localStorage.getItem('hf_local_memberships') || '[]');

    if (window.supabaseClient) {
      const fRes = await window.supabaseClient.from('families').select('*').order('created_at', { ascending: false });
      if (!fRes.error && fRes.data) families = fRes.data;

      const gRes = await window.supabaseClient.from('grievances').select('*').order('created_at', { ascending: false });
      if (!gRes.error && gRes.data && gRes.data.length > 0) grievances = gRes.data;

      const mRes = await window.supabaseClient.from('membership_requests').select('*').order('created_at', { ascending: false });
      if (!mRes.error && mRes.data && mRes.data.length > 0) memberships = mRes.data;
    }

    const approvedCount = families.filter(f => f.status === 'approved').length;
    const rejectedCount = families.filter(f => f.status === 'rejected').length;

    area.innerHTML = `
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-bottom:1px solid var(--border); padding-bottom:12px;">
          <div>
            <h3 style="margin:0; color:var(--primary-dark);">🛡️ غرفة العمليات ولوحة التحكم الإدارية</h3>
            <small>المستخدم: <strong>${window.currentUser?.name || 'رئيس مجلس الأمناء'}</strong> (${window.currentUser?.email || ''})</small>
          </div>
          <div class="no-print" style="display:flex; gap:8px; flex-wrap:wrap;">
            <button type="button" onclick="exportCasesCsv()" class="nav-btn btn-gold">📥 تصدير CSV / Excel</button>
            <button type="button" onclick="window.print()" class="nav-btn">🖨️ طباعة اللوحة</button>
            <button type="button" onclick="logoutUser()" class="nav-btn" style="background:#dc2626; color:#fff;">تسجيل الخروج</button>
          </div>
        </div>

        <div class="grid-4" style="margin-top:16px; text-align:center;">
          <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:12px; border-radius:10px; color:#0f172a;">
            <strong>إجمالي الحالات</strong><div style="font-size:22px; font-weight:800;">${families.length}</div>
          </div>
          <div style="background:#ecfdf5; border:1px solid #a7f3d0; padding:12px; border-radius:10px; color:#065f46;">
            <strong>موافق عليها / مستحقة</strong><div style="font-size:22px; font-weight:800;">${approvedCount}</div>
          </div>
          <div style="background:#fef2f2; border:1px solid #fecaca; padding:12px; border-radius:10px; color:#991b1b;">
            <strong>مرفوضة</strong><div style="font-size:22px; font-weight:800;">${rejectedCount}</div>
          </div>
          <div style="background:#fffbeb; border:1px solid #fde68a; padding:12px; border-radius:10px; color:#92400e;">
            <strong>التظلمات وطلبات الانضمام</strong><div style="font-size:22px; font-weight:800;">${grievances.length + memberships.length}</div>
          </div>
        </div>

        <div class="no-print" style="display:flex; gap:8px; flex-wrap:wrap; margin-top:18px; border-bottom:1px solid var(--border); padding-bottom:12px;">
          <button type="button" onclick="switchAdminTab('cases')" class="nav-btn btn-primary">📁 الحالات والتقييم والتوزيع</button>
          <button type="button" onclick="switchAdminTab('grievances')" class="nav-btn">⚖️ التظلمات وطلبات الانضمام</button>
          <button type="button" onclick="switchAdminTab('roles')" class="nav-btn">👥 الصلاحيات والحسابات</button>
          <button type="button" onclick="switchAdminTab('official')" class="nav-btn btn-gold">📜 محاضر مجلس الأمناء والتفويضات والأوراق</button>
        </div>

        <div id="admin-tab-cases" style="margin-top:16px;">
          <table>
            <thead>
              <tr>
                <th>كود الطلب</th>
                <th>الاسم والعنوان</th>
                <th>نوع التدخل</th>
                <th>الدخل / المصروف / العجز</th>
                <th>الحالة والتقييم</th>
                <th>المُقيّم / الباحث</th>
                <th class="no-print">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              ${families.length === 0 ? '<tr><td colspan="7" style="text-align:center;">لا توجد حالات مسجلة في قاعدة البيانات بعد.</td></tr>' : families.map(f => {
                const h = f.husband_data || {};
                const name = [h.name1, h.name2, h.name3].filter(Boolean).join(' ') || 'بدون اسم';
                const inc = Number(f.total_income || 0);
                const exp = Number(f.total_expenses || 0);
                const diff = inc - exp;
                return `
                  <tr>
                    <td><strong>${f.tracking_code}</strong></td>
                    <td>${name}<br><small>${f.governorate || ''} - ${f.center_city || ''} - ${f.village_hamlet || ''}</small></td>
                    <td>${f.intervention_type || ''}</td>
                    <td>دخل: ${inc} | مصروف: ${exp}<br><small>${diff < 0 ? 'عجز: ' + Math.abs(diff) : 'فائض: ' + diff}</small></td>
                    <td>
                      <select onchange="updateCaseDecision('${f.id}', this.value, null)" style="margin:0; padding:4px;">
                        <option value="pending" ${f.status==='pending'?'selected':''}>قيد المراجعة</option>
                        <option value="approved" ${f.status==='approved'?'selected':''}>مقبول / مستحق</option>
                        <option value="rejected" ${f.status==='rejected'?'selected':''}>مرفوض</option>
                      </select>
                    </td>
                    <td>
                      <input value="${f.evaluated_by || ''}" placeholder="من قيّم الحالة؟" onchange="updateCaseDecision('${f.id}', null, this.value)" style="margin:0; padding:4px; font-size:12px;">
                    </td>
                    <td class="no-print">
                      <button type="button" onclick="alert('الملاحظات: ' + (${JSON.stringify(f.researcher_notes || 'لا توجد ملاحظات')}))" class="nav-btn" style="padding:4px 8px; font-size:11px;">تفاصيل</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div id="admin-tab-grievances" class="hidden" style="margin-top:16px;">
          <h4>⚖️ التظلمات السرية الواردة</h4>
          <table>
            <thead><tr><th>الكود</th><th>الاسم والهاتف</th><th>العنوان والنوع</th><th>التفاصيل</th></tr></thead>
            <tbody>
              ${grievances.length === 0 ? '<tr><td colspan="4" style="text-align:center;">لا توجد تظلمات مسجلة.</td></tr>' : grievances.map(g => `
                <tr>
                  <td><strong>${g.tracking_code}</strong></td>
                  <td>${g.full_name}<br><small>${g.phone}</small></td>
                  <td>${g.grievance_type}<br><small>${g.address_details}</small></td>
                  <td>${g.message_body}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h4 style="margin-top:20px;">👥 طلبات الانضمام (باحثون / متطوعون / شركاء / مانحون)</h4>
          <table>
            <thead><tr><th>الكود</th><th>الاسم والهاتف</th><th>الصفة المطلوبة</th><th>البريد والملاحظات</th></tr></thead>
            <tbody>
              ${memberships.length === 0 ? '<tr><td colspan="4" style="text-align:center;">لا توجد طلبات انضمام.</td></tr>' : memberships.map(m => `
                <tr>
                  <td><strong>${m.request_code}</strong></td>
                  <td>${m.full_name}<br><small>${m.phone}</small></td>
                  <td>${m.requested_role}</td>
                  <td>${m.email || ''}<br><small>${m.notes || ''}</small></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div id="admin-tab-roles" class="hidden" style="margin-top:16px;">
          <div class="grid-2">
            <div style="background:var(--bg-color); padding:14px; border-radius:10px; border:1px solid var(--border);">
              <h4 style="margin-top:0;">🔑 تغيير البريد الإلكتروني وكلمة السر للإدارة</h4>
              <input id="new-admin-email" type="email" value="${window.currentUser?.email || DEFAULT_ADMIN.email}" placeholder="البريد الإلكتروني الجديد">
              <input id="new-admin-pass" type="password" placeholder="كلمة السر الجديدة">
              <button type="button" onclick="saveAdminCredentials()" class="action-btn">حفظ بيانات الدخول</button>
            </div>
            <div style="background:var(--bg-color); padding:14px; border-radius:10px; border:1px solid var(--border);">
              <h4 style="margin-top:0;">🛡️ مصفوفة الصلاحيات حسب الدور</h4>
              <ul style="font-size:13px; padding-right:18px; margin:0;">
                <li><strong>رئيس مجلس الأمناء / الإدارة:</strong> إدارة كاملة للحالات، التوزيع، الاعتماد، الصلاحيات، التقارير، والمحاضر والتفويضات.</li>
                <li><strong>الباحث الميداني:</strong> تسجيل البحوث، إدخال التوصيات، ومتابعة الحالات المسندة إليه.</li>
                <li><strong>المتطوع:</strong> المشاركة في الأنشطة والقوافل الميدانية المسندة.</li>
                <li><strong>الجهة الشريكة / المانحة:</strong> متابعة التقارير والإحصاءات وحالات التنفيذ المتفق عليها ضمن نطاق الشراكة.</li>
              </ul>
            </div>
          </div>
        </div>

        <div id="admin-tab-official" class="hidden" style="margin-top:16px;">
          <div class="no-print" style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px;">
            <button type="button" onclick="renderOfficialForm('board_minutes')" class="action-btn">📋 نموذج محضر مجلس الأمناء</button>
            <button type="button" onclick="renderOfficialForm('delegation')" class="action-btn" style="background:#b45309;">📄 نموذج التفويض الرسمي</button>
            <button type="button" onclick="renderOfficialForm('official_letter')" class="nav-btn">✉️ مستند / خطاب رسمي بنفس الصيغة</button>
          </div>
          <div id="official-doc-editor"></div>
        </div>
      </div>
    `;

    renderOfficialForm('board_minutes');
  };

  window.switchAdminTab = function(tab) {
    ['cases', 'grievances', 'roles', 'official'].forEach(t => {
      document.getElementById('admin-tab-' + t)?.classList.toggle('hidden', t !== tab);
    });
  };

  window.updateCaseDecision = async function(id, statusVal, evaluatorVal) {
    if (!window.supabaseClient) return;
    const updateObj = {};
    if (statusVal) updateObj.status = statusVal;
    if (evaluatorVal !== null) {
      updateObj.evaluated_by = evaluatorVal;
      updateObj.evaluated_at = new Date().toISOString();
    }
    const { error } = await window.supabaseClient.from('families').update(updateObj).eq('id', id);
    if (error) alert('خطأ في التحديث: ' + error.message);
    else renderDashboard();
  };

  window.saveAdminCredentials = function() {
    const newEmail = (document.getElementById('new-admin-email')?.value || '').trim();
    const newPass = (document.getElementById('new-admin-pass')?.value || '').trim();
    if (!newEmail || !newPass) return alert('يرجى إدخال البريد الإلكتروني وكلمة السر الجديدة.');
    const prev = JSON.parse(localStorage.getItem('hf_admin_creds') || 'null') || DEFAULT_ADMIN;
    const updated = { ...prev, email: newEmail, pass: newPass };
    localStorage.setItem('hf_admin_creds', JSON.stringify(updated));
    window.currentUser.email = newEmail;
    sessionStorage.setItem('hf_current_user', JSON.stringify(window.currentUser));
    alert('✅ تم تحديث البريد الإلكتروني وكلمة السر بنجاح.');
  };

  window.exportCasesCsv = async function() {
    let rows = [];
    if (window.supabaseClient) {
      const { data } = await window.supabaseClient.from('families').select('*');
      if (data) rows = data;
    }
    const headers = ['tracking_code', 'intervention_type', 'governorate', 'center_city', 'village_hamlet', 'total_income', 'total_expenses', 'status', 'eligibility_verdict', 'evaluated_by'];
    const csvLines = [
      headers.join(','),
      ...rows.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))
    ];
    const blob = new Blob(['\uFEFF' + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alhafiz-cases-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- محرر محاضر مجلس الأمناء والتفويضات والمستندات الرسمية (مع إضافة سطر + والطباعة النظيفة A4) ---
  window.addDynamicLine = function(containerId, placeholderText, numbered = true) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const count = container.querySelectorAll('.dyn-line-row').length;
    const nextNum = count + 2;
    const row = document.createElement('div');
    row.className = 'dyn-line-row';
    row.style.cssText = 'display:flex; align-items:center; gap:6px; margin:4px 0;';
    row.innerHTML = `
      ${numbered ? `<span class="line-num" style="font-weight:700; min-width:22px;">${nextNum}-</span>` : `<span class="line-num" style="font-weight:700; min-width:22px;">${count + 1}-</span>`}
      <input type="text" class="doc-line-input" placeholder="${placeholderText}" style="flex:1; margin:0; padding:5px 8px;">
      <button type="button" onclick="removeDynamicLine(this, '${containerId}', ${numbered})" class="no-print" style="background:#fee2e2; color:#991b1b; border:1px solid #fecaca; border-radius:6px; padding:4px 8px; cursor:pointer; font-size:12px;">✕</button>
    `;
    container.appendChild(row);
  };

  window.removeDynamicLine = function(btn, containerId, numbered = true) {
    const row = btn.closest('.dyn-line-row');
    if (row) row.remove();
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('.dyn-line-row').forEach((r, idx) => {
      const numSpan = r.querySelector('.line-num');
      if (numSpan) numSpan.innerText = (numbered ? (idx + 2) : (idx + 1)) + '-';
    });
  };

  window.printOfficialDocumentOnly = function() {
    const sheet = document.getElementById('printable-official-sheet');
    if (!sheet) return;

    const clone = sheet.cloneNode(true);
    clone.querySelectorAll('.no-print').forEach(el => el.remove());

    clone.querySelectorAll('input, textarea').forEach(el => {
      const val = (el.value || '').trim();
      const span = document.createElement(el.tagName === 'TEXTAREA' ? 'div' : 'span');
      span.style.cssText = 'font-weight:700; color:#0f172a; padding:0 4px; border-bottom:1px dotted #64748b; display:inline-block; min-width:60px;';
      if (el.tagName === 'TEXTAREA') {
        span.style.cssText = 'font-weight:600; color:#0f172a; white-space:pre-wrap; line-height:1.9; margin:6px 0;';
      }
      span.textContent = val || (el.placeholder || '....................');
      el.replaceWith(span);
    });

    const printWin = window.open('', '_blank', 'width=900,height=1000');
    if (!printWin) return alert('يرجى السماح بفتح النوافذ المنبثقة للطباعة.');

    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>طباعة مستند رسمي - مؤسسة الحافظ</title>
        <style>
          @page { size: A4; margin: 16mm; }
          body {
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #0f172a;
            background: #fff;
            direction: rtl;
          }
          .sheet-wrap {
            border: 1px solid #cbd5e1;
            padding: 22px 26px;
            min-height: 255mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-sizing: border-box;
          }
        </style>
      </head>
      <body>
        <div class="sheet-wrap">${clone.innerHTML}</div>
        <script>
          window.onload = function() {
            window.focus();
            window.print();
          };
        <\/script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  window.renderOfficialForm = function(type) {
    const box = document.getElementById('official-doc-editor');
    if (!box) return;

    const headerHtml = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #064e3b; padding-bottom:10px; margin-bottom:16px; font-size:12px;">
        <div style="line-height:1.7;">
          <strong>مديرية التضامن الاجتماعي ببني سويف</strong><br>
          إدارة إهناسيا الاجتماعية<br>
          <strong>مؤسسة الحافظ للتنمية والخدمات</strong><br>
          مشهرة برقم 2202 لسنة 2025
        </div>
        <div style="text-align:left;">
          <img src="logo.jpg" alt="شعار المؤسسة" style="height:56px; width:56px; border-radius:50%; border:1px solid #b45309; object-fit:cover;" onerror="this.style.display='none'">
        </div>
      </div>
    `;

    const footerHtml = `
      <div style="border-top:1px solid #94a3b8; margin-top:24px; padding-top:8px; display:flex; justify-content:space-between; font-size:11px; color:#475569;">
        <span>01000880156 - 01155540066</span>
        <span>alhafiz52025@gmail.com | https://alhafiz-eg.azurewebsites.net</span>
      </div>
    `;

    if (type === 'board_minutes') {
      box.innerHTML = `
        <div id="printable-official-sheet" class="card" style="background:#fff; color:#0f172a;">
          <div>
            ${headerHtml}
            <h4 style="text-align:center; text-decoration:underline; margin:6px 0 16px; font-size:17px;">
              محضر مجلس الأمناء رقم ( <input id="bm-num" placeholder="...." style="width:80px; display:inline; padding:4px; margin:0; text-align:center;"> )
            </h4>

            <div style="margin-bottom:14px;">
              <strong style="text-decoration:underline; font-size:14px;">جدول الأعمال</strong>
              <div style="margin-top:6px; font-size:13px;">
                <div style="margin-bottom:4px;">1- النظر في الجلسة السابقة والتصديق عليها</div>
                <div id="bm-agenda-lines"></div>
                <button type="button" onclick="addDynamicLine('bm-agenda-lines', '................................................', true)" class="nav-btn no-print" style="margin-top:6px; font-size:12px; padding:4px 10px;">+ إضافة سطر</button>
              </div>
            </div>

            <div style="margin-bottom:12px;">
              <div style="text-align:center; font-weight:700; text-decoration:underline; margin-bottom:8px; font-size:15px;">محضر الجلسة</div>
              <p style="font-size:13px; line-height:2.1; margin:0;">
                إنه في يوم <input id="bm-day" placeholder="الأربعاء" style="width:110px; display:inline; padding:4px; margin:0;">
                الموافق <input id="bm-date" placeholder="يوم/شهر/سنة" style="width:130px; display:inline; padding:4px; margin:0;">
                وفي تمام الساعة <input id="bm-time" placeholder=".... ص" style="width:90px; display:inline; padding:4px; margin:0;">
                بمقر المؤسسة اجتمع أعضاء مجلس الأمناء برئاسة السيد /
                <input id="bm-chairman" placeholder="..............." style="width:180px; display:inline; padding:4px; margin:0;"> رئيس مجلس الأمناء
                و السيد <input id="bm-acting-name" placeholder="......................" style="width:180px; display:inline; padding:4px; margin:0;">
                بصفته <input id="bm-acting-role" placeholder="............." style="width:130px; display:inline; padding:4px; margin:0;">
                قائم بأعمال <input id="bm-acting-duty" placeholder="....................." style="width:160px; display:inline; padding:4px; margin:0;">
              </p>
            </div>

            <div style="margin-bottom:12px; font-size:13px;">
              <strong>بحضور كلا من:-</strong>
              <div id="bm-attendees-lines" style="margin-top:4px;"></div>
              <button type="button" onclick="addDynamicLine('bm-attendees-lines', '........................................', false)" class="nav-btn no-print" style="margin-top:6px; font-size:12px; padding:4px 10px;">+ إضافة سطر</button>
            </div>

            <p style="font-size:13px; line-height:2; margin:10px 0;">
              ونظراً لاكتمال النصاب القانوني لاجتماع مجلس الأمناء بحضور (
              <input id="bm-quorum" placeholder="... الأعضاء" style="width:110px; display:inline; padding:4px; margin:0; text-align:center;">
              ) تم بدء النظر في جدول الأعمال واتخاذ القرارات الآتية:
            </p>

            <div style="font-size:13px; margin-bottom:14px;">
              <div style="margin-bottom:4px;">1- تُلي محضر مجلس الجلسة السابقة والتصديق عليه</div>
              <div id="bm-decisions-lines"></div>
              <button type="button" onclick="addDynamicLine('bm-decisions-lines', '................................................', true)" class="nav-btn no-print" style="margin-top:6px; font-size:12px; padding:4px 10px;">+ إضافة سطر</button>
            </div>

            <p style="font-size:13px; margin-top:14px;">
              الانتهاء من النظر في جدول الأعمال ورُفعت الجلسة في تمام الساعة
              <input id="bm-end" placeholder=".........." style="width:100px; display:inline; padding:4px; margin:0; text-align:center;"> صباحاً
            </p>

            <div style="display:flex; justify-content:space-between; margin-top:28px; padding:0 24px; font-weight:700; font-size:14px;">
              <span>سكرتير المؤسسة</span>
              <span>رئيس مجلس الأمناء</span>
            </div>
          </div>
          ${footerHtml}
        </div>
        <div class="no-print" style="margin-top:12px; display:flex; gap:10px;">
          <button type="button" onclick="saveOfficialDoc('board_minutes')" class="action-btn">💾 حفظ المحضر</button>
          <button type="button" onclick="printOfficialDocumentOnly()" class="nav-btn btn-gold">🖨️ طباعة المحضر فقط</button>
        </div>
      `;
      window.addDynamicLine('bm-agenda-lines', '................................................', true);
      window.addDynamicLine('bm-attendees-lines', '........................................', false);
      window.addDynamicLine('bm-decisions-lines', '................................................', true);
    } else if (type === 'delegation') {
      box.innerHTML = `
        <div id="printable-official-sheet" class="card" style="background:#fff; color:#0f172a;">
          <div>
            ${headerHtml}
            <p style="font-weight:700; font-size:14px;">السادة الأفاضل / <input id="del-to" placeholder="............................................." style="width:65%; display:inline; padding:4px; margin:0;"></p>
            <p style="text-align:center; font-weight:700; font-size:15px;">تحية طيبة وبعد،،،</p>
            <p style="font-size:13px; line-height:2;">
              تتشرف مؤسسة الحافظ، المشهرة برقم (2202) لسنة 2025 ونطاق عملها جمهورية مصر العربية، بأن تتقدم لسيادتكم بوافر التقدير على دوركم الرائد في العمل الأهلي.<br>
              وفي إطار سعي المؤسسة لتوسيع دائرة التعاون مع مؤسستكم الموقرة لخدمة الفئات الأولى بالرعاية، فقد تقرر:<br>
              <strong>تفويض السيد/ه</strong> <input id="del-name" placeholder="............................................." style="width:60%; display:inline; padding:4px; margin:2px 0;"><br>
              <strong>بطاقة رقم قومي</strong> <input id="del-nid" maxlength="14" placeholder="............................................." style="width:60%; display:inline; padding:4px; margin:2px 0;"><br>
              <strong>بصفته /</strong> <input id="del-role" placeholder="............................................." style="width:65%; display:inline; padding:4px; margin:2px 0;"><br>
              وذلك للتمثيل والتنسيق والتعامل في كافة الأنشطة والخدمات والتي تشمل: مشروعات البنية التحتية، المساعدات الموسمية، الجانب الطبي، التمكين الاقتصادي، والجانب الاجتماعي، وللمفوض الحق في تقديم طلبات التعاون وتوقيع محاضر التنسيق الميداني واستلام وتسليم الكشوف والبحوث الاجتماعية الخاصة بالمستفيدين وتمثيل المؤسسة في الاجتماعات التنسيقية والمتابعة الميدانية.<br>
              هذا التفويض سارٍ من تاريخه وحتى إلغاؤه رسمياً.
            </p>
            <p style="text-align:center; font-weight:700; margin-top:12px;">وتفضلوا بقبول فائق الاحترام والتقدير،،،</p>
            <div style="margin-top:20px; font-weight:700; font-size:13px; line-height:2;">
              اعتماد رئيس مجلس الأمناء<br>
              الاسم: <input id="del-sign" placeholder="............................" style="width:220px; display:inline; padding:4px; margin:0;"><br>
              الختم:
            </div>
          </div>
          ${footerHtml}
        </div>
        <div class="no-print" style="margin-top:12px; display:flex; gap:10px;">
          <button type="button" onclick="saveOfficialDoc('delegation')" class="action-btn">💾 حفظ التفويض</button>
          <button type="button" onclick="printOfficialDocumentOnly()" class="nav-btn btn-gold">🖨️ طباعة التفويض فقط</button>
        </div>
      `;
    } else {
      box.innerHTML = `
        <div id="printable-official-sheet" class="card" style="background:#fff; color:#0f172a;">
          <div>
            ${headerHtml}
            <div style="font-size:15px; font-weight:800; margin-top:10px;">
              السيد / <input id="let-to" placeholder="................................................" style="width:72%; display:inline; padding:4px; margin:0;">
            </div>
            <p style="text-align:center; font-weight:700; font-size:15px; margin:14px 0;">تحية طيبة وبعد،</p>
            <div style="font-size:14px; font-weight:700; margin-bottom:10px;">
              الموضوع: <input id="let-subj" placeholder="................................................" style="width:75%; display:inline; padding:4px; margin:0;">
            </div>
            <div id="let-body-lines" style="margin-top:8px;"></div>
            <button type="button" onclick="addDynamicLine('let-body-lines', '........................................................................', false)" class="nav-btn no-print" style="margin-top:6px; font-size:12px; padding:4px 10px;">+ إضافة سطر</button>

            <p style="text-align:center; font-weight:700; font-size:15px; margin-top:28px;">وتفضلوا بقبول وافر التحية والتقدير،</p>
            <div style="text-align:left; font-weight:700; font-size:14px; margin-top:24px; padding-left:24px;">
              رئيس مجلس الأمناء
            </div>
          </div>
          ${footerHtml}
        </div>
        <div class="no-print" style="margin-top:12px; display:flex; gap:10px;">
          <button type="button" onclick="saveOfficialDoc('official_letter')" class="action-btn">💾 حفظ المستند</button>
          <button type="button" onclick="printOfficialDocumentOnly()" class="nav-btn btn-gold">🖨️ طباعة المستند فقط</button>
        </div>
      `;
      window.addDynamicLine('let-body-lines', '........................................................................', false);
    }
  };

  window.saveOfficialDoc = async function(docType) {
    const code = 'DOC-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const inputs = {};
    document.querySelectorAll('#official-doc-editor input, #official-doc-editor textarea').forEach(el => {
      if (el.id) inputs[el.id] = el.value;
    });
    const dynamicLines = [];
    document.querySelectorAll('#official-doc-editor .doc-line-input').forEach(inp => {
      dynamicLines.push(inp.value);
    });
    inputs.dynamicLines = dynamicLines;

    const record = {
      doc_code: code,
      doc_type: docType,
      doc_title: docType === 'board_minutes' ? 'محضر مجلس الأمناء' : (docType === 'delegation' ? 'تفويض رسمي' : 'مستند / خطاب رسمي'),
      doc_date: new Date().toISOString().slice(0, 10),
      payload: inputs,
      created_by: window.currentUser?.email || DEFAULT_ADMIN.email
    };

    const list = JSON.parse(localStorage.getItem('hf_official_docs') || '[]');
    list.unshift(record);
    localStorage.setItem('hf_official_docs', JSON.stringify(list));

    if (window.supabaseClient) {
      await window.supabaseClient.from('official_documents').insert([record]);
    }
    alert('✅ تم حفظ النموذج الرسمي بنجاح برقم: ' + code);
  };
})();
