// dashboards.js - لوحة الإدارة الشاملة ولوحات الأعضاء والكشوف والإقرارات
(function() {
     window.triggerInstantWhatsApp = function(rawPhone, messageText) {
    const clean = String(rawPhone || '').replace(/\D/g, '');
    if (!clean) return;
    const intl = clean.startsWith('20') ? clean : ('20' + clean.replace(/^0/, ''));
    const base = 'https://' + '://whatsapp.com' + '/send';
    const waUrl = base + '?phone=' + intl + '&text=' + encodeURIComponent(messageText);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };


  window.getOfficialHeaderHtml = function(cfg) {
    return `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #064e3b; padding-bottom:10px; margin-bottom:14px; font-size:12px;">
        <div style="line-height:1.7;">
          <strong>مديرية التضامن الاجتماعي ببني سويف</strong><br>
          إدارة إهناسيا الاجتماعية<br>
          <strong>${cfg.org_name || 'مؤسسة الحافظ للتنمية والخدمات'}</strong><br>
          ${cfg.reg_no || 'مشهرة برقم 2202 لسنة 2025'}
        </div>
        <div style="text-align:left;">
          <img src="logo.jpg" alt="شعار المؤسسة" style="height:56px; width:56px; border-radius:50%; border:1px solid #b45309; object-fit:cover;" onerror="this.style.display='none'">
        </div>
      </div>`;
  };

  window.getOfficialFooterHtml = function(cfg) {
    return `
      <div style="border-top:1px solid #94a3b8; margin-top:20px; padding-top:8px; display:flex; justify-content:space-between; font-size:11px; color:#475569;">
        <span>واتساب رسمي: ${cfg.phone_whatsapp || '01000880156'} | إدارة: ${cfg.phone_admin || '01155540066'}</span>
        <span>${cfg.admin_email || 'alhafiz52025@gmail.com'} | alhafiz-eg.azurewebsites.net</span>
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
            <h3 style="margin:0; color:var(--primary-dark);">👤 بوابة العضو: ${window.escapeHtml(user.name)}</h3>
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

    await window.supabaseClient.from('users_profiles').update({
      password_hash: newPass, temp_code: null, must_change_password: false
    }).eq('id', data.id);

    window.currentUser.must_change_password = false;
    sessionStorage.setItem('hf_current_user', JSON.stringify(window.currentUser));
    alert('✅ تم تحديث كلمة المرور بنجاح.');
    window.renderMemberPortal(window.currentUser);
  };
  window.ALL_ADMIN_CASES = [];
  window.ALL_ADMIN_USERS = [];

  window.renderAdminFullDashboard = async function(user) {
    const area = document.getElementById('dashboard-area');
    let families = [], users = [], grievances = [];

    if (window.supabaseClient) {
      const fRes = await window.supabaseClient
        .from('families').select('*').order('created_at', { ascending: false });
      const uRes = await window.supabaseClient
        .from('users_profiles').select('*').order('created_at', { ascending: false });
      const gRes = await window.supabaseClient
        .from('grievances').select('*').order('created_at', { ascending: false });
      families = fRes.data || [];
      users = uRes.data || [];
      grievances = gRes.data || [];
    }
    window.ALL_ADMIN_CASES = families;
    window.ALL_ADMIN_USERS = users;

    const approved = families.filter(f => f.status === 'approved').length;
    const pending = families.filter(f => f.status === 'pending').length;

    area.innerHTML = `
      <div class="card" style="border-top:4px solid var(--primary);">
        <div class="no-print" style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; border-bottom:1px solid var(--border); padding-bottom:10px;">
          <div>
            <h3 style="margin:0; color:var(--primary-dark);">🛡️ لوحة التحكم الإدارية</h3>
            <small>المسؤول: <strong>${window.escapeHtml(user.name)}</strong></small>
          </div>
          <div style="display:flex; gap:6px;">
            <button type="button" onclick="window.print()" class="nav-btn">🖨️ طباعة</button>
            <button type="button" onclick="logoutUser()" class="nav-btn" style="background:#dc2626; color:#fff;">خروج</button>
          </div>
        </div>

        <div class="grid-4" style="margin-top:12px; text-align:center;">
          <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:8px; border-radius:8px; color:#0f172a;">
            <strong>الإجمالي</strong><div style="font-size:18px; font-weight:800;">${families.length}</div>
          </div>
          <div style="background:#ecfdf5; border:1px solid #a7f3d0; padding:8px; border-radius:8px; color:#065f46;">
            <strong>مقبولة</strong><div style="font-size:18px; font-weight:800;">${approved}</div>
          </div>
          <div style="background:#fffbeb; border:1px solid #fde68a; padding:8px; border-radius:8px; color:#92400e;">
            <strong>قيد المراجعة</strong><div style="font-size:18px; font-weight:800;">${pending}</div>
          </div>
          <div style="background:#eff6ff; border:1px solid #bfdbfe; padding:8px; border-radius:8px; color:#1e3a8a;">
            <strong>الأعضاء والتظلمات</strong><div style="font-size:18px; font-weight:800;">${users.length + grievances.length}</div>
          </div>
        </div>

        <div class="no-print" style="display:flex; gap:6px; flex-wrap:wrap; margin-top:14px; border-bottom:1px solid var(--border); padding-bottom:10px;">
          <button type="button" onclick="switchAdminTab('cases')" class="nav-btn btn-primary" id="tab-btn-cases">📁 الحالات</button>
          <button type="button" onclick="switchAdminTab('members')" class="nav-btn" id="tab-btn-members">👥 الأعضاء</button>
          <button type="button" onclick="switchAdminTab('announcements')" class="nav-btn" id="tab-btn-announcements">📢 المنح</button>
          <button type="button" onclick="switchAdminTab('achievements')" class="nav-btn" id="tab-btn-achievements">🏆 الإنجازات</button>
          <button type="button" onclick="switchAdminTab('grievances')" class="nav-btn" id="tab-btn-grievances">⚖️ التظلمات</button>
          <button type="button" onclick="switchAdminTab('official')" class="nav-btn btn-gold" id="tab-btn-official">📜 المحاضر</button>
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
    await window.supabaseClient.from('families')
      .update({ assigned_to_email: email || null, assigned_to_name: email ? name : 'غير مسند' })
      .eq('id', id);
    alert('✅ تم إسناد الحالة بنجاح.');
  };

  window.adminUpdateCaseStatus = async function(id, status) {
    if (!window.supabaseClient) return;
    await window.supabaseClient.from('families').update({ status }).eq('id', id);
    const item = (window.ALL_ADMIN_CASES || []).find(x => x.id === id);
    if (item) item.status = status;
    alert('✅ تم تحديث قرار الحالة.');
  };

  window.adminDeleteCase = async function(id) {
    if (!confirm('هل أنت متأكد من حذف هذه الحالة نهائياً؟')) return;
    if (!window.supabaseClient) return;
    await window.supabaseClient.from('families').delete().eq('id', id);
    window.ALL_ADMIN_CASES = (window.ALL_ADMIN_CASES || []).filter(x => x.id !== id);
    window.filterAndRenderCasesTable();
  };

  window.printOfficialDisbursementSheet = async function() {
    const list = window.getFilteredAdminCases();
    if (list.length === 0) return alert('⚠️ لا توجد حالات في الكشف للطباعة.');
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
    const list = window.getFilteredAdminCases();
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
  // --- إقرارات الاستلام (البند 13) بالترويسة والتذييل الرسمي والتعهد القانوني ---
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
  // --- إدارة الأعضاء وطلبات الانضمام والصلاحيات والرمز المؤقت (البند 4 و 5 و 10) ---
  window.renderAdminMembersSection = async function() {
    const box = document.getElementById('admin-tab-members');
    if (!box) return;
    let users = [];
    if (window.supabaseClient) {
      const { data } = await window.supabaseClient
        .from('users_profiles').select('*').order('created_at', { ascending: false });
      users = data || [];
      window.ALL_ADMIN_USERS = users;
    }

    box.innerHTML = `
      <div style="background:var(--bg-color); padding:12px; border-radius:8px; border:1px solid var(--border); margin-bottom:12px;">
        <h4 style="margin:0 0 8px; color:var(--primary-dark);">+ إضافة عضو جديد مباشرة (باحث / متطوع / شريك / مانح)</h4>
        <div class="grid-3">
          <input id="new-mem-name" placeholder="الاسم الكامل *" style="margin:0;">
          <input id="new-mem-phone" placeholder="رقم الهاتف (11 رقم) *" style="margin:0;">
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
    await window.supabaseClient.from('users_profiles').update(patch).eq('id', id);
    alert('✅ تم حفظ التعديل في قاعدة البيانات بنجاح.');
  };

  window.adminSendTempCodeWhatsApp = async function(id, name, phone) {
    const tempCode = String(Math.floor(100000 + Math.random() * 900000));
    if (!window.supabaseClient) return;
    await window.supabaseClient.from('users_profiles')
      .update({ temp_code: tempCode, must_change_password: true })
      .eq('id', id);

    const msg = `مؤسسة الحافظ للتنمية والخدمات (واتساب رسمي: 01000880156)\nمرحباً أ/ ${name}\nالرمز المؤقت للدخول وتعيين كلمة مرور جديدة هو: ${tempCode}\nيرجى الدخول وتغييره فوراً من صفحتك.`;
    window.triggerInstantWhatsApp(phone, msg);
    alert(`✅ تم توليد الرمز المؤقت (${tempCode}) وفتح الواتساب لإرساله للعضو.`);
  };

  window.adminDeleteMember = async function(id) {
    if (!confirm('هل أنت متأكد من حذف هذا العضو نهائياً؟')) return;
    await window.supabaseClient.from('users_profiles').delete().eq('id', id);
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

    await window.supabaseClient
      .from('announcements')
      .insert([{ title, description, category, deadline, image_url, is_active: true }]);
    alert('✅ تم نشر المبادرة بنجاح.');
    window.renderAdminAnnouncementsSection();
    if (typeof window.renderPublicAnnouncements === 'function') window.renderPublicAnnouncements();
  };

  window.adminToggleAnnouncement = async function(id, state) {
    await window.supabaseClient.from('announcements').update({ is_active: state }).eq('id', id);
    window.renderAdminAnnouncementsSection();
  };

  window.adminDeleteAnnouncement = async function(id) {
    if (!confirm('حذف هذه المبادرة؟')) return;
    await window.supabaseClient.from('announcements').delete().eq('id', id);
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
    await window.supabaseClient.from('site_settings').update(patch).eq('id', 1);
    alert('✅ تم تحديث أرقام الأثر الميداني في الصفحة الرئيسية.');
  };

  window.adminAddAchievement = async function() {
    const title = (document.getElementById('ach-title')?.value || '').trim();
    const description = (document.getElementById('ach-desc')?.value || '').trim();
    const image_url = (document.getElementById('ach-img')?.value || 'logo.jpg').trim();
    if (!title) return alert('⚠️ اكتب عنوان الإنجاز.');
    await window.supabaseClient.from('achievements').insert([{ title, description, image_url }]);
    alert('✅ تم نشر الإنجاز في قاعدة البيانات بنجاح.');
    window.renderAdminAchievementsSection();
  };

  window.adminDeleteAchievement = async function(id) {
    if (!confirm('حذف هذا الإنجاز؟')) return;
    await window.supabaseClient.from('achievements').delete().eq('id', id);
    window.renderAdminAchievementsSection();
  };

  // --- 3. التظلمات والمحاضر وطلب الانضمام ---
  window.renderAdminGrievancesSection = async function() {
    const box = document.getElementById('admin-tab-grievances');
    const { data } = await window.supabaseClient
      .from('grievances')
      .select('*')
      .order('created_at', { ascending: false });
    const list = data || [];
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

   window.addDocDynamicLine = function(containerId, placeholderText, numbered = true) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const count = container.querySelectorAll('.dyn-line-row').length;
    const lineNum = numbered ? (count + 2) : (count + 1);
    const row = document.createElement('div');
    row.className = 'dyn-line-row';
    row.style.cssText = 'display:flex; align-items:center; gap:6px; margin:4px 0;';
    row.innerHTML = `
      <span class="line-num" style="font-weight:700; min-width:22px;">${lineNum}-</span>
      <input type="text" placeholder="${placeholderText}" style="flex:1; margin:0; padding:4px 8px;">
      <button type="button" onclick="this.parentElement.remove()" class="no-print" style="background:#fee2e2; color:#991b1b; border:none; border-radius:4px; padding:4px 8px; cursor:pointer;">✕</button>
    `;
    container.appendChild(row);
  };

  window.printOfficialDocSheetOnly = function() {
    const sheet = document.getElementById('printable-official-sheet');
    if (!sheet) return;
    const clone = sheet.cloneNode(true);
    clone.querySelectorAll('.no-print').forEach(el => el.remove());
    clone.querySelectorAll('input, textarea').forEach(el => {
      const span = document.createElement('span');
      span.style.cssText = 'font-weight:700; border-bottom:1px dotted #64748b; padding:0 4px; display:inline-block; min-width:50px;';
      span.textContent = (el.value || '').trim() || (el.placeholder || '................');
      el.replaceWith(span);
    });
    const w = window.open('', '_blank', 'width=900,height=1000');
    if (!w) return alert('يرجى السماح بالنوافذ المنبثقة.');
    w.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>مستند رسمي - مؤسسة الحافظ</title>
      <style>@page{size:A4;margin:15mm;}body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;color:#0f172a;}.box{border:1px solid #cbd5e1;padding:22px;min-height:255mm;display:flex;flex-direction:column;justify-content:space-between;}</style>
      </head><body><div class="box">${clone.innerHTML}</div><script>window.onload=function(){window.print();};<\/script></body></html>`);
    w.document.close();
  };

  window.renderAdminOfficialSection = async function() {
    const box = document.getElementById('admin-tab-official');
    if (!box) return;
    box.innerHTML = `
      <div class="no-print" style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px;">
        <button type="button" onclick="renderOfficialDocTemplate('board')" class="action-btn">📋 محضر مجلس الأمناء</button>
        <button type="button" onclick="renderOfficialDocTemplate('delegation')" class="action-btn" style="background:#b45309;">📄 التفويض الرسمي</button>
        <button type="button" onclick="renderOfficialDocTemplate('letter')" class="nav-btn btn-gold">✉️ مستند / خطاب رسمي</button>
      </div>
      <div id="official-doc-editor-box"></div>`;
    window.renderOfficialDocTemplate('board');
  };
  window.renderOfficialDocTemplate = async function(type) {
    const editor = document.getElementById('official-doc-editor-box');
    if (!editor) return;
    const cfg = await window.getFoundationSettings();
    const header = window.getOfficialHeaderHtml(cfg);
    const footer = window.getOfficialFooterHtml(cfg);

    if (type === 'board') {
      editor.innerHTML = `
        <div id="printable-official-sheet" class="card" style="background:#fff; color:#0f172a;">
          <div>
            ${header}
            <h4 style="text-align:center; text-decoration:underline; margin:6px 0 14px;">
              محضر مجلس الأمناء رقم ( <input placeholder="...." style="width:70px; display:inline; padding:3px; margin:0; text-align:center;"> )
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
              الموافق <input placeholder="يوم/شهر/سنة" style="width:110px; display:inline; padding:3px; margin:0;">
              وفي تمام الساعة <input placeholder=".... ص" style="width:80px; display:inline; padding:3px; margin:0;">
              بمقر المؤسسة اجتمع أعضاء مجلس الأمناء برئاسة السيد / <input placeholder="..............." style="width:160px; display:inline; padding:3px; margin:0;"> رئيس مجلس الأمناء
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
        <button type="button" onclick="printOfficialDocSheetOnly()" class="action-btn no-print">🖨️ طباعة المحضر فقط</button>`;
      window.addDocDynamicLine('bm-agenda', '........................................', true);
      window.addDocDynamicLine('bm-att', '....................................', false);
      window.addDocDynamicLine('bm-dec', '........................................', true);
    } else if (type === 'delegation') {
      editor.innerHTML = `
        <div id="printable-official-sheet" class="card" style="background:#fff; color:#0f172a;">
          <div>
            ${header}
            <p style="font-weight:700;">السادة الأفاضل / <input placeholder="............................................." style="width:65%; display:inline; padding:4px; margin:0;"></p>
            <p style="text-align:center; font-weight:700;">تحية طيبة وبعد،،،</p>
            <p style="font-size:13px; line-height:2;">
              تتشرف مؤسسة الحافظ، المشهرة برقم (2202) لسنة 2025 ونطاق عملها جمهورية مصر العربية، بأن تتقدم لسيادتكم بوافر التقدير على دوركم الرائد في العمل الأهلي.<br>
              وفي إطار سعي المؤسسة لتوسيع دائرة التعاون مع مؤسستكم الموقرة لخدمة الفئات الأولى بالرعاية، فقد تقرر:<br>
              <strong>تفويض السيد/ه</strong> <input placeholder="............................................." style="width:60%; display:inline; padding:4px; margin:2px 0;"><br>
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
        <button type="button" onclick="printOfficialDocSheetOnly()" class="action-btn no-print">🖨️ طباعة التفويض فقط</button>`;
    } else {
      editor.innerHTML = `
        <div id="printable-official-sheet" class="card" style="background:#fff; color:#0f172a;">
          <div>
            ${header}
            <div style="font-weight:800; margin-top:8px;">السيد / <input placeholder="................................................" style="width:70%; display:inline; padding:4px; margin:0;"></div>
            <p style="text-align:center; font-weight:700;">تحية طيبة وبعد،</p>
            <div style="font-weight:700; margin-bottom:8px;">الموضوع: <input placeholder="................................................" style="width:72%; display:inline; padding:4px; margin:0;"></div>
            <div id="let-lines"></div>
            <button type="button" onclick="addDocDynamicLine('let-lines', '....................................................................', false)" class="nav-btn no-print" style="margin-top:4px; font-size:11px;">+ إضافة سطر</button>
            <p style="text-align:center; font-weight:700; margin-top:24px;">وتفضلوا بقبول وافر التحية والتقدير،</p>
            <div style="text-align:left; font-weight:700; margin-top:20px; padding-left:24px;">رئيس مجلس الأمناء</div>
          </div>
          ${footer}
        </div>
        <button type="button" onclick="printOfficialDocSheetOnly()" class="action-btn no-print">🖨️ طباعة المستند فقط</button>`;
      window.addDocDynamicLine('let-lines', '....................................................................', false);
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
