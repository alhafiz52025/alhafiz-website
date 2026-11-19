// dashboards.js - لوحة التحكم الإدارية الشاملة لمؤسسة الحافظ
window.supabaseClient = window.supabaseClient || (window.supabase ? window.supabase.createClient('https://fwyacpvbhwdlivzeiper.supabase.co', 'sb_publishable_6xYRIb6tT-Na8wvnDoGMsQ_EeMfQzdz') : null);

function getEffectiveAdminCreds() {
  const saved = JSON.parse(localStorage.getItem('hf_admin_creds') || 'null');
  return {
    email: (saved && saved.email) || 'alhafiz52025@gmail.com',
    pass: (saved && saved.pass) || '22022025'
  };
}

window.triggerInstantWhatsApp = function(rawPhone, messageText) {
  const cleanPhone = String(rawPhone || '').replace(/\D/g, '');
  if (!cleanPhone) return;
  const intlPhone = cleanPhone.startsWith('20') ? cleanPhone : ('20' + cleanPhone.replace(/^0/, ''));
  const url = `https://wa.me/${intlPhone}?text=${encodeURIComponent(messageText)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

window.renderAdminDashboard = async function(userRole, userEmail) {
  const dashArea = document.getElementById('dashboard-area');
  if (!dashArea) return;

  dashArea.innerHTML = `
    <div class="card" style="border-top: 4px solid var(--primary);">
      <div class="no-print" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:20px; border-bottom:1px solid #e2e8f0; padding-bottom:12px;">
        <div>
          <h3 style="color: var(--primary-dark); margin: 0;">🛡️ غرفة العمليات ولوحة التحكم الإدارية</h3>
          <p style="font-size:13px; color:#64748b; margin:4px 0 0;">مرحباً بك (${userEmail}) - الصلاحية: <strong>${userRole}</strong></p>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button type="button" onclick="window.print()" class="nav-btn">🖨️ طباعة اللوحة</button>
          <button type="button" onclick="location.reload()" class="action-btn" style="background:#ef4444; font-size:12px; padding:6px 12px;">تسجيل الخروج</button>
        </div>
      </div>

      <!-- تبويبات التحكم -->
      <div class="no-print" style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:20px;">
        <button type="button" onclick="switchAdminTab('cases')" class="nav-btn btn-primary" id="tab-btn-cases">📂 إدارة الحالات والبحوث</button>
        <button type="button" onclick="switchAdminTab('users')" class="nav-btn" id="tab-btn-users">👥 الأعضاء والباحثون والشركاء</button>
        <button type="button" onclick="switchAdminTab('achievements')" class="nav-btn" id="tab-btn-achievements">🏆 إدارة الإنجازات والمعرض</button>
        <button type="button" onclick="switchAdminTab('grievances')" class="nav-btn" id="tab-btn-grievances">⚖️ التظلمات والرقابة</button>
        <button type="button" onclick="switchAdminTab('official')" class="nav-btn" id="tab-btn-official">📜 محاضر مجلس الأمناء والتفويضات</button>
        <button type="button" onclick="switchAdminTab('settings')" class="nav-btn" id="tab-btn-settings">⚙️ الصلاحيات والحساب</button>
      </div>

      <!-- محتوى التبويبات -->
      <div id="admin-tab-content">
        <div style="text-align:center; padding:30px; color:#64748b;">جارٍ تحميل بيانات المنظومة...</div>
      </div>
    </div>
  `;

  window.switchAdminTab('cases');
};

window.switchAdminTab = async function(tabName) {
  document.querySelectorAll('#dashboard-area .nav-btn').forEach(btn => btn.classList.remove('btn-primary'));
  const activeBtn = document.getElementById('tab-btn-' + tabName);
  if (activeBtn) activeBtn.classList.add('btn-primary');

  const contentArea = document.getElementById('admin-tab-content');
  if (!contentArea) return;

  if (tabName === 'cases') {
    contentArea.innerHTML = `<p>جارٍ جلب الحالات المسجلة من قاعدة البيانات...</p>`;
    let families = [];
    if (window.supabaseClient) {
      const { data, error } = await window.supabaseClient.from('families').select('*').order('created_at', { ascending: false });
      if (!error) families = data || [];
    }

    if (families.length === 0) {
      contentArea.innerHTML = `<div style="padding:20px; text-align:center; background:#f8fafc; border-radius:8px;">لا توجد حالات مسجلة حتى الآن.</div>`;
      return;
    }

    let html = `
      <h4 style="color:var(--primary-dark);">إدارة ومتابعة الحالات الاجتماعية (${families.length} حالة)</h4>
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th>كود المتابعة</th>
              <th>رب الأسرة / الهاتف</th>
              <th>المنطقة</th>
              <th>دخل / مصروف</th>
              <th>المصدر</th>
              <th>الباحث المسند إليه</th>
              <th>القرار الحالي</th>
              <th>إجراءات الإدارة</th>
            </tr>
          </thead>
          <tbody>
    `;

    families.forEach(f => {
      const hName = f.husband_data ? `${f.husband_data.name1 || ''} ${f.husband_data.name2 || ''}` : 'غير محدد';
      const hPhone = f.husband_data?.phone || 'غير متوفر';
      html += `
        <tr>
          <td><strong>${f.tracking_code || '---'}</strong></td>
          <td>${hName}<br><span style="font-size:11px; color:#64748b;">${hPhone}</span></td>
          <td>${f.center_city || 'إهناسيا'} - ${f.village_hamlet || ''}</td>
          <td>دخل: ${f.total_income || 0}<br>مصروف: ${f.total_expenses || 0}</td>
          <td><span style="background:#e2e8f0; color:#0f172a; padding:2px 6px; border-radius:4px; font-size:11px;">${f.source_type || 'مواطن'}</span></td>
          <td>
            <select onchange="assignCase('${f.id}', this.value)" style="padding:4px; font-size:12px; margin:0;">
              <option value="غير مسند" ${f.assigned_to === 'غير مسند' ? 'selected' : ''}>-- غير مسند --</option>
              <option value="أ. نجم الدين حسين" ${f.assigned_to === 'أ. نجم الدين حسين' ? 'selected' : ''}>أ. نجم الدين حسين</option>
              <option value="باحث ميداني 1" ${f.assigned_to === 'باحث ميداني 1' ? 'selected' : ''}>باحث ميداني 1</option>
              <option value="باحث ميداني 2" ${f.assigned_to === 'باحث ميداني 2' ? 'selected' : ''}>باحث ميداني 2</option>
            </select>
          </td>
          <td>
            <select onchange="updateCaseDecision('${f.id}', this.value)" style="padding:4px; font-size:12px; font-weight:700; margin:0;">
              <option value="قيد المراجعة والبحث" ${f.decision_by === 'قيد المراجعة والبحث' ? 'selected' : ''}>🔍 جاري البحث</option>
              <option value="معتمد ومقبول للصرف" ${f.decision_by === 'معتمد ومقبول للصرف' ? 'selected' : ''}>✅ مقبول ومعتمد</option>
              <option value="مرفوض لعدم الاستحقاق" ${f.decision_by === 'مرفوض لعدم الاستحقاق' ? 'selected' : ''}>❌ مرفوض</option>
            </select>
          </td>
          <td>
            <button type="button" onclick="alert('تفاصيل الحالة الكاملة وكشوف المستندات متاحة للمراجعة.')" class="nav-btn" style="font-size:11px; padding:4px 8px;">التفاصيل</button>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table></div>`;
    contentArea.innerHTML = html;

  } else if (tabName === 'users') {
    contentArea.innerHTML = `<p>جارٍ جلب قائمة الأعضاء والباحثين والشركاء...</p>`;
    let users = [];
    if (window.supabaseClient) {
      const resProfiles = await window.supabaseClient.from('users_profiles').select('*').order('created_at', { ascending: false });
      if (!resProfiles.error && Array.isArray(resProfiles.data) && resProfiles.data.length > 0) {
        users = resProfiles.data;
      } else {
        const resUsers = await window.supabaseClient.from('users').select('*').order('created_at', { ascending: false });
        if (!resUsers.error && Array.isArray(resUsers.data)) {
          users = resUsers.data;
        }
      }
    }

    let html = `
      <h4 style="color:var(--primary-dark);">إدارة المستخدمين، الباحثين، والمتطوعين والجهات الشريكة</h4>
      <p style="font-size:13px; color:#64748b;">الموافقة على طلبات التسجيل الجديدة وتحديد الصلاحيات والمسميات.</p>
    `;

    if (users.length === 0) {
      html += `<div style="padding:20px; text-align:center; background:#f8fafc; border-radius:8px; margin-top:10px;">لا توجد طلبات انضمام أو أعضاء مسجلين حالياً.</div>`;
    } else {
      html += `<table><thead><tr><th>الاسم الكامل</th><th>البريد الإلكتروني</th><th>الدور / الصلاحية</th><th>الحالة</th><th>الإجراءات</th></tr></thead><tbody>`;
      users.forEach(u => {
        const currentStatus = u.account_status || u.status || 'pending';
        html += `
          <tr>
            <td><strong>${u.full_name || 'بدون اسم'}</strong><br><span style="font-size:11px;">هاتف: ${u.phone || 'غير متوفر'}</span></td>
            <td>${u.email || ''}</td>
            <td>
              <select onchange="updateUserRole('${u.id}', this.value)" style="padding:4px; font-size:12px; margin:0;">
                <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>مدير النظام (Admin)</option>
                <option value="researcher" ${u.role === 'researcher' ? 'selected' : ''}>باحث ميداني</option>
                <option value="volunteer" ${u.role === 'volunteer' ? 'selected' : ''}>متطوع</option>
                <option value="partner" ${u.role === 'partner' ? 'selected' : ''}>جهة شريكة / مانحة</option>
              </select>
            </td>
            <td>
              <select onchange="updateUserStatus('${u.id}', this.value)" style="padding:4px; font-size:12px; font-weight:700; margin:0;">
                <option value="pending" ${currentStatus === 'pending' ? 'selected' : ''}>⏳ معلق (انتظار الموافقة)</option>
                <option value="active" ${currentStatus === 'active' ? 'selected' : ''}>✅ مقبول ومفعل</option>
                <option value="suspended" ${currentStatus === 'suspended' ? 'selected' : ''}>🚫 موقوف</option>
              </select>
            </td>
            <td>
              <button type="button" onclick="alert('تم حفظ تعديلات العضو بنجاح.')" class="nav-btn" style="font-size:11px; padding:4px 8px;">حفظ</button>
            </td>
          </tr>
        `;
      });
      html += `</tbody></table>`;
    }
    contentArea.innerHTML = html;

  } else if (tabName === 'achievements') {
    contentArea.innerHTML = `
      <h4 style="color:var(--primary-dark);">إدارة ونشر الإنجازات والقوافل الميدانية</h4>
      <div style="background:#f8fafc; padding:16px; border-radius:10px; border:1px solid #cbd5e1; margin-bottom:20px;">
        <h5 style="margin-top:0; color:var(--primary);">+ إضافة إنجاز أو نشاط جديد للمعرض</h5>
        <input id="ach-title" placeholder="عنوان القافلة أو الإنجاز (مثال: توزيع 100 شنطة غذائية بمنشأة عبد الصمد)" style="margin-bottom:8px;">
        <textarea id="ach-desc" rows="2" placeholder="وصف تفصيلي للنشاط والجهات المشاركة والأثر المجتمعي..." style="margin-bottom:8px;"></textarea>
        <input id="ach-img" placeholder="رابط الصورة أو مسارها (صورة توثيقية)" style="margin-bottom:8px;">
        <button type="button" onclick="addNewAchievement()" class="action-btn" style="font-size:13px;">نشر الإنجاز فوراً على الموقع</button>
      </div>
      <div id="admin-achievements-list">جارٍ تحميل الإنجازات...</div>
    `;
    loadAdminAchievementsList();

  } else if (tabName === 'grievances') {
    contentArea.innerHTML = `<p>جارٍ جلب سجل التظلمات والشكاوى والرقابة المجتمعية...</p>`;
    let grievances = JSON.parse(localStorage.getItem('hf_local_grievances') || '[]');
    if (window.supabaseClient) {
      const { data, error } = await window.supabaseClient.from('grievances').select('*').order('created_at', { ascending: false });
      if (!error && Array.isArray(data) && data.length > 0) {
        grievances = data;
      }
    }

    if (!grievances || grievances.length === 0) {
      contentArea.innerHTML = `
        <h4 style="color:var(--primary-dark);">سجل التظلمات والشكاوى والرقابة المجتمعية</h4>
        <div style="background:#fffbeb; border:1px solid #fde68a; padding:16px; border-radius:10px;">
          <p style="margin:0; font-size:14px; color:#92400e;">لا توجد تظلمات جديدة مسجلة حالياً. كافة الشكاوى ورسائل الدعم الفني تُراجع بسرية تامة وتُربط برئيس مجلس الأمناء.</p>
        </div>
      `;
      return;
    }

    contentArea.innerHTML = `
      <h4 style="color:var(--primary-dark);">سجل التظلمات والشكاوى والرقابة المجتمعية (${grievances.length})</h4>
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th>رقم التظلم</th>
              <th>الاسم / الهاتف</th>
              <th>العنوان / النوع</th>
              <th>التفاصيل</th>
            </tr>
          </thead>
          <tbody>
            ${grievances.map(g => `
              <tr>
                <td><strong>${g.tracking_code || '---'}</strong></td>
                <td>${g.full_name || 'غير محدد'}<br><span style="font-size:11px; color:#64748b;">${g.phone || ''}</span></td>
                <td>${g.grievance_type || ''}<br><span style="font-size:11px; color:#64748b;">${g.address_details || ''}</span></td>
                <td>${g.message_body || g.details || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

  } else if (tabName === 'official') {
    contentArea.innerHTML = `
      <div class="no-print" style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px;">
        <button type="button" onclick="renderOfficialForm('board_minutes')" class="action-btn">📋 نموذج محضر مجلس الأمناء</button>
        <button type="button" onclick="renderOfficialForm('delegation')" class="action-btn" style="background:#b45309;">📄 نموذج التفويض الرسمي</button>
        <button type="button" onclick="renderOfficialForm('official_letter')" class="nav-btn">✉️ مستند / خطاب رسمي بنفس الصيغة</button>
      </div>
      <div id="official-doc-editor"></div>
    `;
    window.renderOfficialForm('board_minutes');

  } else if (tabName === 'settings') {
    const creds = getEffectiveAdminCreds();
    contentArea.innerHTML = `
      <div class="grid-2">
        <div style="background:#f8fafc; padding:16px; border-radius:10px; border:1px solid #cbd5e1;">
          <h4 style="margin-top:0; color:var(--primary-dark);">🔑 تحديث بريد الدخول وكلمة السر للإدارة</h4>
          <input id="admin-new-email" type="email" value="${creds.email}" placeholder="البريد الإلكتروني للإدارة">
          <input id="admin-new-pass" type="password" value="${creds.pass}" placeholder="كلمة السر للإدارة">
          <button type="button" onclick="saveAdminCreds()" class="action-btn">حفظ بيانات الدخول</button>
        </div>
        <div style="background:#f8fafc; padding:16px; border-radius:10px; border:1px solid #cbd5e1;">
          <h4 style="margin-top:0; color:var(--primary-dark);">🛡️ الصلاحيات والأدوار المعتمدة</h4>
          <ul style="font-size:13px; padding-right:18px; margin:0; line-height:1.8;">
            <li><strong>الإدارة العليا:</strong> صلاحية كاملة لإدارة الحالات، توزيعها على الباحثين، اعتماد القرارات، إدارة الأعضاء والتظلمات، وإصدار المحاضر والتفويضات.</li>
            <li><strong>الباحث الميداني:</strong> دراسة الحالات المسندة إليه وإدخال نتائج البحث الميداني.</li>
            <li><strong>المتطوع:</strong> المشاركة في الأنشطة الميدانية وتوزيع المساعدات.</li>
            <li><strong>الجهة الشريكة / المانحة:</strong> متابعة التنسيق والتقارير والإحصاءات ضمن إطار التعاون.</li>
          </ul>
        </div>
      </div>
    `;
  }
};

window.saveAdminCreds = function() {
  const email = (document.getElementById('admin-new-email')?.value || '').trim();
  const pass = (document.getElementById('admin-new-pass')?.value || '').trim();
  if (!email || !pass) return alert('⚠️ يرجى إدخال البريد الإلكتروني وكلمة السر.');
  localStorage.setItem('hf_admin_creds', JSON.stringify({ email, pass }));
  alert('✅ تم حفظ بيانات الدخول بنجاح.');
};

// إرسال التظلمات السرية وحفظها في قاعدة البيانات + إشعار واتساب فوري
window.submitGrievance = async function() {
  const type = document.getElementById('grievance-type')?.value || 'appeal';
  const fullName = (document.getElementById('grievance-name')?.value || '').trim();
  const email = (document.getElementById('grievance-email')?.value || '').trim();
  const address = (document.getElementById('grievance-address')?.value || '').trim();
  const phone = (document.getElementById('grievance-phone')?.value || '').trim();
  const details = (document.getElementById('grievance-details')?.value || '').trim();

  if (!phone || !details) {
    alert('⚠️ يرجى إدخال رقم الهاتف وتفاصيل الرسالة أو التظلم.');
    return;
  }

  const code = 'GRV-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
  const record = {
    tracking_code: code,
    grievance_type: type,
    full_name: fullName || 'مقدم تظلم',
    email: email || null,
    address_details: address || 'غير محدد',
    phone,
    message_body: details,
    status: 'pending'
  };

  const localList = JSON.parse(localStorage.getItem('hf_local_grievances') || '[]');
  localList.unshift({ ...record, created_at: new Date().toISOString() });
  localStorage.setItem('hf_local_grievances', JSON.stringify(localList));

  if (window.supabaseClient) {
    const { error } = await window.supabaseClient.from('grievances').insert([record]);
    if (error) {
      console.warn('Grievance insert notice:', error.message);
    }
  }

  const waMsg = `مؤسسة الحافظ للتنمية والخدمات\nتم استلام رسالتكم / تظلمكم بنجاح.\nرقم الطلب: ${code}\nسيتم الفحص والرد في أقرب وقت.`;
  window.triggerInstantWhatsApp(phone, waMsg);

  alert(`✅ تم إرسال رسالتكم بسرية تامة بنجاح.\nرقم الطلب: ${code}\n\nفي حال وجود أي مشكلة، يرجى التوجه إلى مقر المؤسسة أو شاشة التظلمات، وسوف نرد على حضراتكم في أقرب وقت مع تحيات مؤسسة الحافظ.`);

  ['grievance-name', 'grievance-email', 'grievance-address', 'grievance-phone', 'grievance-details'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
};

// --- محرر محاضر مجلس الأمناء والتفويضات والمستندات الرسمية (+ إضافة سطر وطباعة المستند فقط) ---
window.addDynamicLine = function(containerId, placeholderText, numbered = true) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const count = container.querySelectorAll('.dyn-line-row').length;
  const lineNumber = numbered ? (count + 2) : (count + 1);
  const row = document.createElement('div');
  row.className = 'dyn-line-row';
  row.style.cssText = 'display:flex; align-items:center; gap:6px; margin:4px 0;';
  row.innerHTML = `
    <span class="line-num" style="font-weight:700; min-width:22px;">${lineNumber}-</span>
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
        <button type="button" onclick="printOfficialDocumentOnly()" class="action-btn">🖨️ طباعة المحضر فقط</button>
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
        <button type="button" onclick="printOfficialDocumentOnly()" class="action-btn">🖨️ طباعة التفويض فقط</button>
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
        <button type="button" onclick="printOfficialDocumentOnly()" class="action-btn">🖨️ طباعة المستند فقط</button>
      </div>
    `;
    window.addDynamicLine('let-body-lines', '........................................................................', false);
  }
};

// دوال التحكم المساعدة
window.assignCase = async function(id, assignedTo) {
  if (window.supabaseClient) {
    const { error } = await window.supabaseClient.from('families').update({ assigned_to: assignedTo }).eq('id', id);
    if (error) alert('❌ خطأ في التحديث: ' + error.message);
    else alert('✅ تم إسناد الحالة بنجاح إلى: ' + assignedTo);
  }
};

window.updateCaseDecision = async function(id, decision) {
  if (window.supabaseClient) {
    const { error } = await window.supabaseClient.from('families').update({ decision_by: decision }).eq('id', id);
    if (error) alert('❌ خطأ في تحديث القرار: ' + error.message);
    else alert('✅ تم تحديث حالة القرار واعتماده بنجاح.');
  }
};

window.updateUserRole = async function(id, role) {
  if (window.supabaseClient) {
    const r1 = await window.supabaseClient.from('users_profiles').update({ role }).eq('id', id);
    if (r1.error) {
      await window.supabaseClient.from('users').update({ role }).eq('id', id);
    }
  }
};

window.updateUserStatus = async function(id, status) {
  if (window.supabaseClient) {
    const r1 = await window.supabaseClient.from('users_profiles').update({ account_status: status }).eq('id', id);
    if (r1.error) {
      await window.supabaseClient.from('users').update({ status }).eq('id', id);
    }
    alert('✅ تم تحديث حالة العضو بنجاح.');
  }
};

window.addNewAchievement = async function() {
  const title = document.getElementById('ach-title').value.trim();
  const desc = document.getElementById('ach-desc').value.trim();
  const imgUrl = document.getElementById('ach-img').value.trim() || 'logo.jpg';

  if (!title) {
    alert('برجاء كتابة عنوان الإنجاز أو القافلة.');
    return;
  }

  if (window.supabaseClient) {
    const { error } = await window.supabaseClient.from('achievements').insert([{
      title: title,
      description: desc,
      image_url: imgUrl,
      category: 'قوافل ميدانية'
    }]);

    if (error) {
      alert('❌ خطأ أثناء النشر: ' + error.message);
    } else {
      alert('✅ تم نشر الإنجاز في المعرض بنجاح وسيظهر للمستخدمين!');
      window.switchAdminTab('achievements');
    }
  }
};

window.loadAdminAchievementsList = async function() {
  const listDiv = document.getElementById('admin-achievements-list');
  if (!listDiv) return;

  let list = [];
  if (window.supabaseClient) {
    const { data, error } = await window.supabaseClient.from('achievements').select('*').order('created_at', { ascending: false });
    if (!error) list = data || [];
  }

  if (list.length === 0) {
    listDiv.innerHTML = `<p style="color:#64748b;">لا توجد إنجازات منشورة حالياً.</p>`;
    return;
  }

  let html = `<div class="grid-2">`;
  list.forEach(item => {
    html += `
      <div style="background:#fff; border:1px solid #cbd5e1; padding:12px; border-radius:8px; color:#0f172a;">
        <h5 style="margin:0 0 6px; color:var(--primary-dark);">${item.title}</h5>
        <p style="font-size:12px; color:#64748b; margin:0 0 8px;">${item.description || ''}</p>
        <button type="button" onclick="deleteAchievement('${item.id}')" class="nav-btn" style="background:#b91c1c; color:#fff; font-size:11px; padding:4px 8px;">حذف هذا الإنجاز</button>
      </div>
    `;
  });
  html += `</div>`;
  listDiv.innerHTML = html;
};

window.deleteAchievement = async function(id) {
  if (confirm('هل أنت متأكد من حذف هذا الإنجاز؟')) {
    if (window.supabaseClient) {
      await window.supabaseClient.from('achievements').delete().eq('id', id);
      window.loadAdminAchievementsList();
    }
  }
};

window.loginUser = async function() {
  const emailEl = document.getElementById('login-email');
  const passEl = document.getElementById('login-pass');

  const email = (emailEl ? emailEl.value : '').trim();
  const pass = (passEl ? passEl.value : '').trim();

  if (!email || !pass) {
    alert('برجاء إدخال البريد الإلكتروني وكلمة المرور');
    return;
  }

  let savedCreds = null;
  try {
    savedCreds = JSON.parse(localStorage.getItem('hf_admin_creds') || 'null');
  } catch (e) {
    savedCreds = null;
  }

  const adminEmail = ((savedCreds && savedCreds.email) || 'alhafiz52025@gmail.com').trim().toLowerCase();
  const adminPass = ((savedCreds && savedCreds.pass) || '22022025').trim();

  if (email.toLowerCase() === adminEmail && pass === adminPass) {
    const loginBox = document.getElementById('login-box');
    const dashArea = document.getElementById('dashboard-area');
    if (loginBox) loginBox.classList.add('hidden');
    if (dashArea) dashArea.classList.remove('hidden');

    if (typeof window.renderAdminDashboard === 'function') {
      await window.renderAdminDashboard('admin (رئيس مجلس الأمناء)', email);
    } else {
      alert('✅ تم تسجيل الدخول بنجاح');
    }
    return;
  }

  const sb = window.supabaseClient || (
    (window.SUPABASE_URL || window.supabaseUrl) &&
    (window.SUPABASE_ANON_KEY || window.supabaseAnonKey) &&
    window.supabase
      ? window.supabase.createClient(
          window.SUPABASE_URL || window.supabaseUrl,
          window.SUPABASE_ANON_KEY || window.supabaseAnonKey
        )
      : null
  );

  if (sb) {
    try {
      const { data, error } = await sb
        .from('users_profiles')
        .select('*')
        .ilike('email', email)
        .maybeSingle();

      if (error || !data) {
        alert('❌ البريد الإلكتروني غير مسجل أو بيانات الدخول غير صحيحة.');
        return;
      }

      const st = data.account_status || data.status || 'pending';
      if (st !== 'active') {
        alert('⏳ حسابك قيد المراجعة أو تم إيقافه مؤقتاً من قبل الإدارة.');
        return;
      }

      const loginBox = document.getElementById('login-box');
      const dashArea = document.getElementById('dashboard-area');
      if (loginBox) loginBox.classList.add('hidden');
      if (dashArea) dashArea.classList.remove('hidden');

      if (typeof window.renderAdminDashboard === 'function') {
        await window.renderAdminDashboard(data.role || 'member', data.email || email);
      }
      return;
    } catch (err) {
      console.error('Login error:', err);
    }
  }

  alert('❌ البريد الإلكتروني أو كلمة المرور غير صحيحة.');
};

window.loadPublicAchievements = async function() {
  const container = document.getElementById('public-achievements-container');
  if (!container || !window.supabaseClient) return;

  const { data } = await window.supabaseClient.from('achievements').select('*').order('created_at', { ascending: false });
  if (!data || data.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#64748b;">جاري تحديث سجل الإنجازات والقوافل الميدانية...</p>';
    return;
  }

  container.innerHTML = data.map(a => `
    <div style="background:var(--bg-color); border-radius:12px; border:1px solid #cbd5e1; overflow:hidden;">
      ${a.image_url ? `<img src="${a.image_url}" style="width:100%; height:170px; object-fit:cover;" onerror="this.style.display='none'">` : ''}
      <div style="padding:14px;">
        <h4 style="color:var(--primary-dark); margin:0 0 6px;">${a.title}</h4>
        <p style="font-size:13px; color:var(--text-color); line-height:1.5; margin:0;">${a.description || ''}</p>
      </div>
    </div>
  `).join('');
};

window.trackApplication = async function() {
  const val = document.getElementById('track-input')?.value.trim();
  const box = document.getElementById('track-result');
  if (!val) return alert('⚠️ أدخل كود المتابعة أو الرقم القومي.');
  if (!window.supabaseClient) return;

  const { data } = await window.supabaseClient.from('families').select('*').eq('tracking_code', val).maybeSingle();
  if (data) {
    box.innerHTML = `
      <div style="padding:14px; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:10px; margin-top:10px; color:#0f172a;">
        <p style="margin:0 0 6px;"><strong>كود الطلب:</strong> ${data.tracking_code}</p>
        <p style="margin:0 0 6px;"><strong>حالة القرار:</strong> ${data.decision_by || 'قيد المراجعة والبحث'}</p>
        <p style="margin:0;"><strong>الباحث المسؤول:</strong> ${data.assigned_to || 'قيد الإسناد'}</p>
      </div>`;
  } else {
    box.innerHTML = '<p style="color:#b91c1c; font-weight:700; margin-top:10px;">❌ لم يتم العثور على طلب بهذا الكود.</p>';
  }
};

window.openPartnerRegister = function() {
  document.getElementById('login-box')?.classList.add('hidden');
  const box = document.getElementById('partner-register-box');
  if (!box) return;
  box.classList.remove('hidden');
  box.innerHTML = `
    <h3 style="color:var(--primary-dark); margin-top:0;">📝 طلب انضمام جديد للمنظومة</h3>
    <p style="font-size:12px; color:#64748b;">سيتم مراجعة طلبك وتفعيله من قبل إدارة المؤسسة.</p>
    <label style="font-size:12px; font-weight:700;">الصفة / الدور المطلوب:</label>
    <select id="reg-role">
      <option value="researcher">باحث ميداني</option>
      <option value="volunteer">متطوع</option>
      <option value="partner">جمعية قاعدية / جهة شريكة</option>
    </select>
    <input id="reg-name" placeholder="الاسم الكامل / اسم الجمعية *">
    <input id="reg-phone" placeholder="رقم الهاتف (واتساب) *">
    <input type="email" id="reg-email" placeholder="البريد الإلكتروني *">
    <input type="password" id="reg-pass" placeholder="كلمة المرور المقترحة *">
    <button type="button" onclick="submitNewUserRequest()" class="action-btn" style="width:100%; margin-bottom:8px;">إرسال طلب الانضمام</button>
    <button type="button" onclick="location.reload()" class="nav-btn" style="width:100%;">رجوع لشاشة الدخول</button>
  `;
};

window.submitNewUserRequest = async function() {
  const roleSelect = document.getElementById('reg-role');
  const nameInput = document.getElementById('reg-name');
  const phoneInput = document.getElementById('reg-phone');
  const emailInput = document.getElementById('reg-email');
  const passInput = document.getElementById('reg-pass');

  if (!roleSelect || !nameInput || !phoneInput || !emailInput) {
    alert('⚠️ حدث خطأ في تحميل حقول النموذج.');
    return;
  }

  const role = roleSelect.value;
  const full_name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const email = emailInput.value.trim();
  const pass = passInput ? passInput.value : '';

  if (!full_name || !email || !phone) {
    alert('⚠️ يرجى استيفاء جميع الحقول الأساسية (الاسم، البريد، والهاتف).');
    return;
  }

  if (!window.supabaseClient) {
    alert('⚠️ تعذر الاتصال بقاعدة البيانات.');
    return;
  }

  try {
    let userId = null;
    if (pass) {
      const authRes = await window.supabaseClient.auth.signUp({ email, password: pass });
      if (authRes.error) {
        console.log('Auth notice:', authRes.error.message);
      } else if (authRes.data && authRes.data.user) {
        userId = authRes.data.user.id;
      }
    }

    const payload = {
      full_name: full_name,
      email: email,
      phone: phone,
      role: role,
      account_status: 'pending'
    };

    if (userId) {
      payload.id = userId;
    }

    const { error } = await window.supabaseClient.from('users_profiles').upsert([payload], { onConflict: 'email' });

    if (error) {
      alert('❌ خطأ أثناء حفظ الملف الشخصي: ' + error.message);
    } else {
      window.triggerInstantWhatsApp(phone, `مؤسسة الحافظ للتنمية والخدمات\nتم استلام طلب انضمامكم بنجاح وهو الآن قيد المراجعة.`);
      alert('✅ تم إرسال طلب انضمامك بنجاح!\nحسابك الآن (قيد المراجعة) وسيتم تفعيله من قبل إدارة المؤسسة.');
      location.reload();
    }
  } catch (err) {
    alert('❌ حدث خطأ غير متوقع: ' + err.message);
  }
};

window.addEventListener('DOMContentLoaded', () => {
  if (typeof window.loadPublicAchievements === 'function') {
    window.loadPublicAchievements();
  }
});
