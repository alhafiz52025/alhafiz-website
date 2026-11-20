// dashboards.js - لوحة الإدارة الشاملة ولوحات الأعضاء والكشوف والإقرارات والمستندات
(function() {
  const LOCAL_DOCS_KEY = 'hf_official_documents_v1';

  window.triggerInstantWhatsApp = function(rawPhone, messageText) {
    const cleanPhone = String(rawPhone || '').replace(/\D/g, '');
    if (!cleanPhone) return;
    const intlPhone = cleanPhone.startsWith('20') ? cleanPhone : ('20' + cleanPhone.replace(/^0/, ''));
    const url = `https://wa.me/${intlPhone}?text=${encodeURIComponent(messageText || '')}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

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

  // التوجيه الذكي حسب الصلاحية (أدمن أم عضو)
  window.routeLoggedInUser = async function(user) {
    document.getElementById('login-box')?.classList.add('hidden');
    document.getElementById('partner-register-box')?.classList.add('hidden');
    const area = document.getElementById('dashboard-area');
    if (!area) return;
    area.classList.remove('hidden');

    if (user.role === 'admin') {
      await window.renderAdminFullDashboard(user);
    } else {
      await window.renderMemberPortal(user);
    }
  };

  // --- لوحة العضو المستقلة (باحث / متطوع / شريك / مانح) ---
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
      myCases = data || [];
    }

    area.innerHTML = `
      <div class="card" style="border-top:4px solid var(--primary);">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-bottom:1px solid var(--border); padding-bottom:12px;">
          <div>
            <h3 style="margin:0; color:var(--primary-dark);">👤 بوابة العضو: ${window.escapeHtml(displayName)}</h3>
            <small>الصفة: <strong>${roleNames[user.role] || user.role}</strong> | البريد: ${window.escapeHtml(user.email)}</small>
          </div>
          <div style="display:flex; gap:8px;">
            <button type="button" onclick="showSection('apply')" class="action-btn">+ تسجيل حالة جديدة</button>
            <button type="button" onclick="logoutUser()" class="nav-btn" style="background:#dc2626; color:#fff;">تسجيل الخروج</button>
          </div>
        </div>

        ${user.must_change_password ? `
          <div style="background:#fef2f2; border:1px solid #fecaca; padding:14px; border-radius:10px; margin-top:14px; color:#991b1b;">
            <strong>⚠️ تنبيه أمني:</strong> لقد قمت بالدخول باستخدام الرمز المؤقت. يرجى تعيين كلمة مرور جديدة خاصة بك الآن.
          </div>` : ''}

        <div style="background:var(--bg-color); padding:14px; border-radius:10px; border:1px solid var(--border); margin-top:14px;">
          <h4 style="margin:0 0 8px; color:var(--primary-dark);">🔑 تغيير كلمة المرور الخاصة بك</h4>
          <div class="grid-3">
            <input id="mem-temp-or-old" placeholder="الرمز المؤقت أو كلمة السر الحالية" style="margin:0;">
            <input id="mem-new-pass" type="password" placeholder="كلمة السر الجديدة (6 أحرف فأكثر)" style="margin:0;">
            <button type="button" onclick="changeMemberOwnPassword()" class="action-btn" style="margin:0;">حفظ كلمة السر الجديدة</button>
          </div>
        </div>

        <h4 style="margin-top:20px; color:var(--primary-dark);">📁 الحالات الخاصة بك والمسندة إليك (${myCases.length})</h4>
        <div style="overflow-x:auto;">
          <table>
            <thead>
              <tr><th>كود الطلب</th><th>اسم رب الأسرة</th><th>نوع المساعدة</th><th>المنطقة</th><th>الحالة</th></tr>
            </thead>
            <tbody>
              ${myCases.length === 0 ? '<tr><td colspan="5" style="text-align:center;">لا توجد حالات مسجلة أو مسندة إليك حالياً.</td></tr>' : myCases.map(f => {
                const h = f.husband_data || {};
                const fullName = [h.name1, h.name2, h.name3].filter(Boolean).join(' ') || 'غير محدد';
                const st = f.status === 'approved' ? '✅ مقبول' : (f.status === 'rejected' ? '❌ مرفوض' : '🔍 قيد المراجعة');
                return `<tr>
                  <td><strong>${window.escapeHtml(f.tracking_code)}</strong></td>
                  <td>${window.escapeHtml(fullName)}</td>
                  <td>${window.escapeHtml(f.intervention_type)}</td>
                  <td>${window.escapeHtml(f.center_city)} - ${window.escapeHtml(f.village_hamlet)}</td>
                  <td>${st}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
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

  window.ALL_ADMIN_CASES = [];
  window.ALL_ADMIN_USERS = [];
  window.ALL_ADMIN_GRIEVANCES = [];
  window.ALL_OFFICIAL_DOCS = [];

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
    let families = [], users = [], grievances = [];
    let dbWarning = '';

    if (window.supabaseClient) {
      const [fRes, uRes, gRes] = await Promise.all([
        window.supabaseClient.from('families').select('*').order('created_at', { ascending: false }),
        window.supabaseClient.from('users_profiles').select('*').order('created_at', { ascending: false }),
        window.supabaseClient.from('grievances').select('*').order('created_at', { ascending: false })
      ]);
      if (fRes.error) dbWarning = `⚠️ تعذر قراءة جدول الحالات (families): ${fRes.error.message}`;
      families = fRes.data || [];
      users = uRes.data || [];
      grievances = gRes.data || [];
    }

    window.ALL_ADMIN_CASES = families;
    window.ALL_ADMIN_USERS = users;
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
          <div style="display:flex; gap:6px;">
            <button type="button" onclick="window.print()" class="nav-btn">🖨️ طباعة</button>
            <button type="button" onclick="logoutUser()" class="nav-btn" style="background:#dc2626; color:#fff;">خروج</button>
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

  window.renderAdminCasesSection = function() {
    const box = document.getElementById('admin-tab-cases');
    if (!box) return;
    const aidOpts = (window.AID_TYPES || [])
      .map(a => `<option value="${a}">${a}</option>`).join('');

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
        <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-top:8px;">
          <label style="display:flex; align-items:center; gap:6px; font-size:12px; font-weight:700; margin:0;">
            <input type="checkbox" id="chk-include-signature" checked style="width:auto; margin:0;"> خانة توقيع المستلم
          </label>
          <div style="display:flex; gap:6px;">
            <button type="button" onclick="printOfficialDisbursementSheet()" class="action-btn" style="background:#b45309; padding:5px 10px; font-size:12px;">🖨️ كشف صرف</button>
            <button type="button" onclick="exportFilteredCasesCsv()" class="nav-btn btn-gold" style="padding:5px 10px; font-size:12px;">📥 CSV</button>
          </div>
        </div>
      </div>
      <div id="admin-cases-table-wrap" style="overflow-x:auto;"></div>`;

    window.filterAndRenderCasesTable();
  };

  window.getFilteredAdminCases = function() {
    const aid = document.getElementById('flt-aid')?.value || '';
    const st = document.getElementById('flt-status')?.value || '';
    const q = (document.getElementById('flt-village')?.value || '').trim().toLowerCase();
    const limit = parseInt(document.getElementById('flt-limit')?.value || '0', 10);

    let list = (window.ALL_ADMIN_CASES || []).filter(f => {
      if (aid && f.intervention_type !== aid) return false;
      if (st && f.status !== st) return false;
      if (q) {
        const h = f.husband_data || {};
        const txt = `${h.name1 || ''} ${h.name2 || ''} ${h.name3 || ''} ${f.village_hamlet || ''} ${f.tracking_code || ''}`.toLowerCase();
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

  window.filterAndRenderCasesTable = function() {
    const wrap = document.getElementById('admin-cases-table-wrap');
    if (!wrap) return;
    const list = window.getFilteredAdminCases();
    const members = (window.ALL_ADMIN_USERS || []).filter(u => u.account_status === 'active');

    if (list.length === 0) {
      wrap.innerHTML = '<p style="text-align:center; padding:12px; color:#64748b;">لا توجد حالات مطابقة.</p>';
      return;
    }

    wrap.innerHTML = `
      <table>
        <thead>
          <tr><th>الكود</th><th>رب الأسرة</th><th>العنوان والنوع</th><th>إسناد</th><th>القرار</th><th class="no-print">إجراءات</th></tr>
        </thead>
        <tbody>
          ${list.map(f => {
            const h = f.husband_data || {};
            const name = [h.name1, h.name2, h.name3].filter(Boolean).join(' ') || 'غير محدد';
            const opts = `<option value="">-- غير مسند --</option>` + members.map(m =>
              `<option value="${window.escapeHtml(m.email)}" ${f.assigned_to_email===m.email?'selected':''}>${window.escapeHtml(m.full_name)}</option>`
            ).join('');
            return `<tr>
              <td><strong>${window.escapeHtml(f.tracking_code)}</strong></td>
              <td>${window.escapeHtml(name)}<br><small>${window.escapeHtml(h.phone || '')}</small></td>
              <td>${window.escapeHtml(f.village_hamlet)}<br><small>${window.escapeHtml(f.intervention_type)}</small></td>
              <td><select onchange="adminAssignCase('${f.id}', this)" style="margin:0; padding:3px; font-size:11px;">${opts}</select></td>
              <td>
                <select onchange="adminUpdateCaseStatus('${f.id}', this.value)" style="margin:0; padding:3px; font-size:11px;">
                  <option value="pending" ${f.status==='pending'?'selected':''}>🔍 مراجعة</option>
                  <option value="approved" ${f.status==='approved'?'selected':''}>✅ مقبول</option>
                  <option value="rejected" ${f.status==='rejected'?'selected':''}>❌ مرفوض</option>
                </select>
              </td>
              <td class="no-print">
                <button type="button" onclick="openReceiptDeclarationModal('${f.id}')" class="nav-btn btn-gold" style="padding:3px 6px; font-size:11px;">📄 إقرار</button>
                <button type="button" onclick="adminDeleteCase('${f.id}')" class="nav-btn" style="background:#dc2626; color:#fff; padding:3px 6px; font-size:11px;">🗑️</button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;
  };

  window.adminAssignCase = async function(id, selEl) {
    const email = selEl.value;
    const name = selEl.options[selEl.selectedIndex]?.text || 'غير مسند';
    if (!window.supabaseClient) return;
    const { error } = await window.supabaseClient.from('families')
      .update({ assigned_to_email: email || null, assigned_to_name: email ? name : 'غير مسند' })
      .eq('id', id);
    if (error) return alert('❌ تعذر إسناد الحالة: ' + error.message);
    const item = (window.ALL_ADMIN_CASES || []).find(x => x.id === id);
    if (item) {
      item.assigned_to_email = email || null;
      item.assigned_to_name = email ? name : 'غير مسند';
    }
    alert('✅ تم إسناد الحالة بنجاح.');
  };

  window.adminUpdateCaseStatus = async function(id, status) {
    if (!window.supabaseClient) return;
    const { error } = await window.supabaseClient.from('families').update({ status }).eq('id', id);
    if (error) return alert('❌ تعذر تحديث قرار الحالة: ' + error.message);
    const item = (window.ALL_ADMIN_CASES || []).find(x => x.id === id);
    if (item) item.status = status;
    window.refreshAdminSummaryCards();
    alert('✅ تم تحديث قرار الحالة.');
  };

  window.adminDeleteCase = async function(id) {
    if (!confirm('هل أنت متأكد من حذف هذه الحالة نهائياً؟')) return;
    if (!window.supabaseClient) return;
    const { error } = await window.supabaseClient.from('families').delete().eq('id', id);
    if (error) return alert('❌ تعذر حذف الحالة: ' + error.message);
    window.ALL_ADMIN_CASES = (window.ALL_ADMIN_CASES || []).filter(x => x.id !== id);
    window.refreshAdminSummaryCards();
    window.filterAndRenderCasesTable();
  };

  window.printOfficialDisbursementSheet = async function() {
    const list = window.getDisbursementCases();
    if (list.length === 0) return alert('⚠️ لا توجد حالات مقبولة أو مطابقة في الكشف للطباعة.');
    const withSig = document.getElementById('chk-include-signature')?.checked;
    const cfg = await window.getFoundationSettings();

    const rowsHtml = list.map((f, idx) => {
      const h = f.husband_data || {};
      const name = [h.name1, h.name2, h.name3].filter(Boolean).join(' ') || 'غير محدد';
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

    const w = window.open('', '_blank', 'width=950,height=1000');
    if (!w) return alert('يرجى السماح بالنوافذ المنبثقة.');
    w.document.open();
    w.document.write(`
      <!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
      <title>كشف صرف رسمي - مؤسسة الحافظ</title>
      <style>
        @page { size: A4; margin: 14mm; }
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; color: #0f172a; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
        th, td { border: 1px solid #334155; padding: 6px 8px; text-align: right; }
        th { background: #064e3b; color: #fff; }
      </style></head><body>
      ${window.getOfficialHeaderHtml(cfg)}
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
      </div>
      ${window.getOfficialFooterHtml(cfg)}
      <script>window.onload=function(){window.print();};<\/script>
      </body></html>`);
    w.document.close();
  };

  window.exportFilteredCasesCsv = function() {
    const list = window.getDisbursementCases();
    if (list.length === 0) return alert('⚠️ لا توجد حالات مقبولة أو مطابقة لتصديرها.');
    const withSig = document.getElementById('chk-include-signature')?.checked;
    const headers = ['الكود', 'الاسم', 'الرقم القومي', 'الهاتف', 'القرية', 'نوع المساعدة', 'الحالة'];
    if (withSig) headers.push('توقيع المستلم');

    const lines = [headers.join(',')];
    list.forEach(f => {
      const h = f.husband_data || {};
      const name = [h.name1, h.name2, h.name3].filter(Boolean).join(' ');
      const row = [f.tracking_code, name, h.nid || '', h.phone || '', f.village_hamlet, f.intervention_type, f.status];
      if (withSig) row.push('');
      lines.push(row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
    });

    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'alhafiz-disbursement.csv';
    a.click();
  };

  // --- إقرارات الاستلام بالترويسة والتذييل الرسمي والتعهد القانوني ---
  window.openReceiptDeclarationModal = function(caseId) {
    const f = (window.ALL_ADMIN_CASES || []).find(x => x.id === caseId);
    if (!f) return;
    const h = f.husband_data || {};
    const fullName = [h.name1, h.name2, h.name3].filter(Boolean).join(' ') || '';
    const itemsOpts = (window.GRANT_RECEIPT_ITEMS || [])
      .map(i => `<option value="${i}">${i}</option>`).join('');

    let modal = document.getElementById('hf-receipt-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'hf-receipt-modal';
      modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:9999; display:flex; align-items:center; justify-content:center; padding:14px;';
      document.body.appendChild(modal);
    }
    modal.classList.remove('hidden');
    modal.innerHTML = `
      <div style="background:#fff; color:#0f172a; max-width:520px; width:100%; border-radius:14px; padding:20px;">
        <h4 style="margin:0 0 10px; color:#064e3b;">📄 تجهيز إقرار استلام مساعدة</h4>
        <label style="font-size:12px; font-weight:700;">اسم المستلم:</label>
        <input id="rec-person-name" value="${window.escapeHtml(fullName)}">
        <label style="font-size:12px; font-weight:700;">الرقم القومي:</label>
        <input id="rec-person-nid" value="${window.escapeHtml(h.nid || '')}">
        <label style="font-size:12px; font-weight:700;">العنوان:</label>
        <input id="rec-person-addr" value="${window.escapeHtml((f.center_city || '') + ' - ' + (f.village_hamlet || ''))}">
        <label style="font-size:12px; font-weight:700;">اختر البند المُسلّم (أو اختر "أخرى" لتركه فارغاً للملء يدوياً):</label>
        <select id="rec-item-select">${itemsOpts}</select>
        <input id="rec-item-custom" placeholder="تفاصيل إضافية للبند (اختياري)">
        <div style="display:flex; gap:8px; margin-top:10px;">
          <button type="button" onclick="printReceiptDeclarationSheet()" class="action-btn">🖨️ طباعة الإقرار الرسمي</button>
          <button type="button" onclick="document.getElementById('hf-receipt-modal').classList.add('hidden')" class="nav-btn">إغلاق</button>
        </div>
      </div>`;
  };

  window.printReceiptDeclarationSheet = async function() {
    const name = document.getElementById('rec-person-name')?.value || '........................................';
    const nid = document.getElementById('rec-person-nid')?.value || '..............................';
    const addr = document.getElementById('rec-person-addr')?.value || '........................................';
    const selItem = document.getElementById('rec-item-select')?.value || '';
    const customTxt = (document.getElementById('rec-item-custom')?.value || '').trim();
    const isManualBlank = selItem.includes('أخرى');
    const itemDisplay = isManualBlank
      ? '....................................................................................................'
      : (selItem + (customTxt ? ' (' + customTxt + ')' : ''));

    const cfg = await window.getFoundationSettings();
    const w = window.open('', '_blank', 'width=900,height=1000');
    if (!w) return alert('يرجى السماح بالنوافذ المنبثقة.');

    w.document.open();
    w.document.write(`
      <!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
      <title>إقرار استلام - مؤسسة الحافظ</title>
      <style>
        @page { size: A4; margin: 16mm; }
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; color: #0f172a; }
        .wrap { border: 1px solid #cbd5e1; padding: 24px; min-height: 250mm; display: flex; flex-direction: column; justify-content: space-between; }
      </style></head><body>
      <div class="wrap">
        <div>
          ${window.getOfficialHeaderHtml(cfg)}
          <h3 style="text-align:center; text-decoration:underline; margin:12px 0 20px;">إقرار استلام مساعدة عينية / خدمية</h3>
          <p style="font-size:15px; line-height:2.2;">
            أقر أنا الموقع أدناه / <strong>${window.escapeHtml(name)}</strong><br>
            المقيم في / <strong>${window.escapeHtml(addr)}</strong><br>
            وأحمل بطاقة رقم قومي / <strong>${window.escapeHtml(nid)}</strong><br>
            بأنني قد استلمت من <strong>${window.escapeHtml(cfg.org_name)}</strong> (${window.escapeHtml(cfg.reg_no)}) المساعدة الآتي بيانها:<br>
            <strong>نوع وبيان المساعدة المستلمة:</strong><br>
            <span style="display:block; padding:10px; border:1px dashed #64748b; margin:8px 0; font-weight:700;">
              ${window.escapeHtml(itemDisplay)}
            </span>
            <strong>وأتعهد تعهداً كاملاً أمام الله وأمام إدارة المؤسسة بعدم بيع هذه المساعدة أو التصرف فيها بالبيع أو التبرع أو التنازل للغير تحت أي ظرف، وفي حالة الاستغناء عنها أو عدم الحاجة إليها ألتزم بردها وتسليمها إلى مقر مؤسسة الحافظ للتنمية والخدمات لإعادة توجيهها لأسرة أخرى مستحقة، وهذا إقرار مني بذلك.</strong>
          </p>
          <div style="display:flex; justify-content:space-between; margin-top:34px; font-weight:700; font-size:14px;">
            <div>توقيع المستلم وبصمته:<br><br>.................................</div>
            <div>شاهد أول:<br><br>.................................</div>
            <div>يعتمد / رئيس مجلس الأمناء:<br><br>.................................</div>
          </div>
        </div>
        ${window.getOfficialFooterHtml(cfg)}
      </div>
      <script>window.onload=function(){window.print();};<\/script>
      </body></html>`);
    w.document.close();
  };

  // --- إدارة الأعضاء وطلبات الانضمام والصلاحيات والرمز المؤقت ---
  window.renderAdminMembersSection = async function() {
    const box = document.getElementById('admin-tab-members');
    if (!box) return;
    let users = [];
    if (window.supabaseClient) {
      const { data } = await window.supabaseClient
        .from('users_profiles').select('*').order('created_at', { ascending: false });
      users = data || [];
      window.ALL_ADMIN_USERS = users;
      window.refreshAdminSummaryCards();
    }

    box.innerHTML = `
      <div style="background:var(--bg-color); padding:12px; border-radius:8px; border:1px solid var(--border); margin-bottom:12px;">
        <h4 style="margin:0 0 8px; color:var(--primary-dark);">+ إضافة عضو جديد مباشرة (باحث / متطوع / شريك / مانح)</h4>
        <div class="grid-3">
          <input id="new-mem-name" placeholder="الاسم الكامل *" style="margin:0;">
          <input id="new-mem-phone" maxlength="11" placeholder="رقم الهاتف (11 رقم) *" style="margin:0;">
          <input id="new-mem-email" type="email" placeholder="البريد الإلكتروني *" style="margin:0;">
          <select id="new-mem-role" style="margin:0;">
            <option value="researcher">باحث ميداني</option>
            <option value="volunteer">متطوع</option>
            <option value="partner">جهة شريكة</option>
            <option value="donor">جهة مانحة</option>
          </select>
          <input id="new-mem-pass" placeholder="كلمة السر المبدئية *" style="margin:0;">
          <button type="button" onclick="adminCreateMemberDirect()" class="action-btn" style="margin:0;">+ حفظ وتفعيل العضو</button>
        </div>
      </div>

      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr><th>العضو والهاتف</th><th>الصفة</th><th>رؤية كل الحالات</th><th>الحالة</th><th>الرمز المؤقت (واتساب)</th><th class="no-print">حذف</th></tr>
          </thead>
          <tbody>
            ${users.length === 0 ? '<tr><td colspan="6" style="text-align:center;">لا يوجد أعضاء مسجلون.</td></tr>' : users.map(u => `
              <tr>
                <td><strong>${window.escapeHtml(u.full_name)}</strong><br><small>${window.escapeHtml(u.email)} | ${window.escapeHtml(u.phone)}</small></td>
                <td>
                  <select onchange="adminUpdateMemberField('${u.id}', {role: this.value})" style="margin:0; padding:3px; font-size:11px;">
                    <option value="researcher" ${u.role==='researcher'?'selected':''}>باحث ميداني</option>
                    <option value="volunteer" ${u.role==='volunteer'?'selected':''}>متطوع</option>
                    <option value="partner" ${u.role==='partner'?'selected':''}>جهة شريكة</option>
                    <option value="donor" ${u.role==='donor'?'selected':''}>جهة مانحة</option>
                  </select>
                </td>
                <td style="text-align:center;">
                  <input type="checkbox" ${u.can_view_all_cases?'checked':''} onchange="adminUpdateMemberField('${u.id}', {can_view_all_cases: this.checked})" style="width:auto; margin:0;">
                </td>
                <td>
                  <select onchange="adminUpdateMemberField('${u.id}', {account_status: this.value})" style="margin:0; padding:3px; font-size:11px; font-weight:700;">
                    <option value="pending" ${u.account_status==='pending'?'selected':''}>⏳ معلق</option>
                    <option value="active" ${u.account_status==='active'?'selected':''}>✅ نشط ومفعل</option>
                    <option value="suspended" ${u.account_status==='suspended'?'selected':''}>⛔ موقوف</option>
                  </select>
                </td>
                <td class="no-print">
                  <button type="button" onclick="adminSendTempCodeWhatsApp('${u.id}', '${window.escapeHtml(u.full_name)}', '${window.escapeHtml(u.phone)}')" class="nav-btn btn-gold" style="padding:3px 6px; font-size:11px;">🔑 إرسال رمز مؤقت</button>
                </td>
                <td class="no-print">
                  <button type="button" onclick="adminDeleteMember('${u.id}')" class="nav-btn" style="background:#dc2626; color:#fff; padding:3px 6px; font-size:11px;">🗑️</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
  };

  window.adminCreateMemberDirect = async function() {
    const full_name = (document.getElementById('new-mem-name')?.value || '').trim();
    const phone = (document.getElementById('new-mem-phone')?.value || '').trim();
    const email = (document.getElementById('new-mem-email')?.value || '').trim().toLowerCase();
    const role = document.getElementById('new-mem-role')?.value || 'researcher';
    const password_hash = (document.getElementById('new-mem-pass')?.value || '').trim();
    if (!full_name || !phone || !email || !password_hash) return alert('⚠️ استكمل جميع بيانات العضو.');
    if (!/^01[0125]\d{8}$/.test(phone)) return alert('⚠️ رقم الهاتف يجب أن يكون 11 رقماً يبدأ بـ 01.');

    const dup = (window.ALL_ADMIN_USERS || []).some(u => (u.email || '').toLowerCase() === email || (u.phone || '') === phone);
    if (dup) return alert('⚠️ البريد الإلكتروني أو رقم الهاتف مسجل مسبقاً.');

    const member_code = 'MBR-' + Math.floor(1000 + Math.random() * 9000);
    const { error } = await window.supabaseClient.from('users_profiles').insert([{
      member_code, full_name, phone, email, password_hash, role, account_status: 'active'
    }]);
    if (error) return alert('❌ خطأ: ' + error.message);
    alert('✅ تم إضافة العضو وحفظه في قاعدة البيانات.');
    window.renderAdminMembersSection();
  };

  window.adminUpdateMemberField = async function(id, patch) {
    if (!window.supabaseClient) return;
    const { error } = await window.supabaseClient.from('users_profiles').update(patch).eq('id', id);
    if (error) return alert('❌ تعذر حفظ التعديل: ' + error.message);
    alert('✅ تم حفظ التعديل في قاعدة البيانات بنجاح.');
  };

  window.adminSendTempCodeWhatsApp = async function(id, name, phone) {
    const tempCode = String(Math.floor(100000 + Math.random() * 900000));
    if (!window.supabaseClient) return;
    const { error } = await window.supabaseClient.from('users_profiles')
      .update({ temp_code: tempCode, must_change_password: true })
      .eq('id', id);
    if (error) return alert('❌ تعذر حفظ الرمز المؤقت: ' + error.message);

    const msg = `مؤسسة الحافظ للتنمية والخدمات (واتساب رسمي: 01000880156)\nمرحباً أ/ ${name}\nالرمز المؤقت للدخول وتعيين كلمة مرور جديدة هو: ${tempCode}\nيرجى الدخول وتغييره فوراً من صفحتك.`;
    window.triggerInstantWhatsApp(phone, msg);
    alert(`✅ تم توليد الرمز المؤقت (${tempCode}) وفتح الواتساب لإرساله للعضو.`);
  };

  window.adminDeleteMember = async function(id) {
    if (!confirm('هل أنت متأكد من حذف هذا العضو نهائياً؟')) return;
    const { error } = await window.supabaseClient.from('users_profiles').delete().eq('id', id);
    if (error) return alert('❌ تعذر حذف العضو: ' + error.message);
    window.renderAdminMembersSection();
  };

  // --- 1. إدارة المنح والمبادرات المفتوحة ---
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
        <h4 style="margin:0 0 8px; color:var(--primary-dark);">📢 نشر منحة أو مبادرة جديدة</h4>
        <input id="ann-title" placeholder="عنوان المبادرة (مثال: مبادرة وصلات المياه أو الأسقف) *">
        <textarea id="ann-desc" rows="2" placeholder="شروط وتفاصيل المبادرة والأوراق المطلوبة *"></textarea>
        <div class="grid-3">
          <input id="ann-cat" placeholder="التصنيف (مثال: مبادرة مياه)" style="margin:0;">
          <input id="ann-deadline" placeholder="آخر موعد للتقديم" style="margin:0;">
          <input id="ann-img" placeholder="رابط صورة (اختياري)" style="margin:0;">
        </div>
        <button type="button" onclick="adminSaveAnnouncement()" class="action-btn" style="margin-top:8px;">+ نشر المبادرة</button>
      </div>
      <div class="grid-2">
        ${list.map(a => `
          <div style="background:#fff; color:#0f172a; border:1px solid #cbd5e1; padding:12px; border-radius:8px;">
            <strong>${window.escapeHtml(a.title)}</strong>
            <p style="font-size:12px; margin:6px 0;">${window.escapeHtml(a.description)}</p>
            <div style="display:flex; gap:6px;">
              <button type="button" onclick="adminToggleAnnouncement('${a.id}', ${!a.is_active})" class="nav-btn btn-gold" style="font-size:11px; padding:4px 8px;">
                ${a.is_active ? '⏸️ إغلاق' : '▶️ فتح'}
              </button>
              <button type="button" onclick="adminDeleteAnnouncement('${a.id}')" class="nav-btn" style="background:#dc2626; color:#fff; font-size:11px; padding:4px 8px;">🗑️ حذف</button>
            </div>
          </div>`).join('')}
      </div>`;
  };

  window.adminSaveAnnouncement = async function() {
    const title = (document.getElementById('ann-title')?.value || '').trim();
    const description = (document.getElementById('ann-desc')?.value || '').trim();
    const category = (document.getElementById('ann-cat')?.value || 'مبادرة مفتوحة').trim();
    const deadline = (document.getElementById('ann-deadline')?.value || '').trim();
    const image_url = (document.getElementById('ann-img')?.value || 'logo.jpg').trim();
    if (!title || !description) return alert('⚠️ اكتب عنوان وتفاصيل المبادرة.');

    const { error } = await window.supabaseClient
      .from('announcements')
      .insert([{ title, description, category, deadline, image_url, is_active: true }]);
    if (error) return alert('❌ تعذر نشر المبادرة: ' + error.message);

    alert('✅ تم نشر المبادرة بنجاح.');
    window.renderAdminAnnouncementsSection();
    if (typeof window.renderPublicAnnouncements === 'function') window.renderPublicAnnouncements();
  };

  window.adminToggleAnnouncement = async function(id, state) {
    const { error } = await window.supabaseClient.from('announcements').update({ is_active: state }).eq('id', id);
    if (error) return alert('❌ تعذر تحديث حالة المبادرة: ' + error.message);
    window.renderAdminAnnouncementsSection();
  };

  window.adminDeleteAnnouncement = async function(id) {
    if (!confirm('حذف هذه المبادرة؟')) return;
    const { error } = await window.supabaseClient.from('announcements').delete().eq('id', id);
    if (error) return alert('❌ تعذر حذف المبادرة: ' + error.message);
    window.renderAdminAnnouncementsSection();
  };

  // --- 2. إدارة الإنجازات وأرقام الأثر الميداني ---
  window.renderAdminAchievementsSection = async function() {
    const box = document.getElementById('admin-tab-achievements');
    if (!box) return;
    const cfg = await window.getFoundationSettings();
    const { data } = await window.supabaseClient
      .from('achievements')
      .select('*')
      .order('created_at', { ascending: false });
    const list = data || [];

    box.innerHTML = `
      <div style="background:#ecfdf5; padding:12px; border-radius:8px; border:1px solid #a7f3d0; margin-bottom:14px; color:#0f172a;">
        <h4 style="margin:0 0 8px; color:#064e3b;">📊 تعديل أرقام الأثر الميداني</h4>
        <div class="grid-4">
          <div><label style="font-size:11px;">حقائب غذائية:</label><input id="st-food" value="${window.escapeHtml(cfg.stat_food_bags)}" style="margin:0;"></div>
          <div><label style="font-size:11px;">دعم نقدي:</label><input id="st-cash" value="${window.escapeHtml(cfg.stat_cash_aid)}" style="margin:0;"></div>
          <div><label style="font-size:11px;">بطاطين:</label><input id="st-blankets" value="${window.escapeHtml(cfg.stat_blankets)}" style="margin:0;"></div>
          <div><label style="font-size:11px;">قرية وعزبة:</label><input id="st-villages" value="${window.escapeHtml(cfg.stat_villages)}" style="margin:0;"></div>
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
            <button type="button" onclick="adminDeleteAchievement('${item.id}')" class="nav-btn" style="background:#dc2626; color:#fff; font-size:11px; padding:4px 8px;">🗑️ حذف</button>
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

  // --- 3. التظلمات والمستندات الرسمية والصادر والوارد وإيصالات المخازن ---
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

    box.innerHTML = list.length === 0 ? '<p>لا توجد تظلمات مسجلة.</p>' : `
      <table>
        <thead><tr><th>الكود</th><th>الاسم والهاتف</th><th>النوع والتفاصيل</th></tr></thead>
        <tbody>
          ${list.map(g => `<tr>
            <td><strong>${window.escapeHtml(g.tracking_code)}</strong></td>
            <td>${window.escapeHtml(g.full_name)}<br><small>${window.escapeHtml(g.phone)}</small></td>
            <td><strong>${window.escapeHtml(g.grievance_type)}</strong><br>${window.escapeHtml(g.message_body)}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
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
      letter: 'LTR'
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
    const record = {
      doc_type: docType,
      doc_number: docNumber,
      doc_date: docDate || new Date().toISOString().slice(0, 10),
      title_or_party: titleOrParty || '',
      payload: payload || {},
      created_by: (window.currentUser && (window.currentUser.name || window.currentUser.full_name || window.currentUser.email)) || 'admin',
      created_at: new Date().toISOString()
    };

    const localList = readLocalOfficialDocs();
    const idx = localList.findIndex(x => x.doc_number === docNumber);
    if (idx >= 0) localList[idx] = record;
    else localList.unshift(record);
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
    return record;
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
      letter: '✉️ خطاب رسمي'
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
                <button type="button" onclick="reprintSavedOfficialDoc('${window.escapeHtml(d.doc_number)}')" class="nav-btn btn-gold" style="padding:3px 7px; font-size:11px;">🖨️ طباعة</button>
                <button type="button" onclick="deleteOfficialDocumentRecord('${window.escapeHtml(d.doc_number)}')" class="nav-btn" style="background:#dc2626; color:#fff; padding:3px 7px; font-size:11px;">🗑️</button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  };

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
        th, td { border: 1px solid #334155; padding: 6px 8px; text-align: right; }
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

  function openPrintWindowWithHtml(html) {
    const w = window.open('', '_blank', 'width=920,height=1000');
    if (!w) {
      alert('يرجى السماح بالنوافذ المنبثقة للطباعة.');
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

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
          <div>${isIssue ? 'توقيع المستلم:' : 'توقيع المودِع / المورِّد:'}<br><br>......................</div>
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
            <div><label style="font-size:11px; font-weight:700;">${isIssue ? 'اسم المستلم / الجهة *:' : 'المودِع / مصدر الإيداع *:'}</label><input id="wh-party-name" placeholder="${isIssue ? 'اسم المستلم أو القرية/المبادرة' : 'اسم المتبرع / المورِّد / الجهة'}" style="margin:0;"></div>
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
      <input id="req-phone" maxlength="11" placeholder="رقم الهاتف (11 رقم) *">
      <input id="req-email" type="email" placeholder="البريد الإلكتروني *">
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
    if (!full_name || !phone || !email || !password_hash) return alert('⚠️ استكمل جميع الحقول.');
    if (!/^01[0125]\d{8}$/.test(phone)) return alert('⚠️ رقم الهاتف يجب أن يتكون من 11 رقماً يبدأ بـ 01.');

    const member_code = 'MEM-' + Math.floor(1000 + Math.random() * 9000);
    const { error } = await window.supabaseClient.from('users_profiles').insert([{
      member_code, full_name, phone, email, password_hash, role, account_status: 'pending'
    }]);
    if (error) return alert('❌ خطأ: ' + error.message);

    const waMsg = `مؤسسة الحافظ للتنمية والخدمات (واتساب رسمي: 01000880156)\nتم استلام طلب انضمامكم بنجاح بكود (${member_code}) وهو قيد المراجعة.`;
    window.triggerInstantWhatsApp(phone, waMsg);
    alert('✅ تم إرسال طلب الانضمام وحفظه في قاعدة البيانات بنجاح.');
    location.reload();
  };
})();
