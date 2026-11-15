// dashboards.js - المنظومة الإدارية الشاملة لمؤسسة الحافظ

const supabaseClient = window.supabaseClient || (window.supabase ? window.supabase.createClient('https://fwyacpvbhwdlivzeiper.supabase.co', 'sb_publishable_6xYRIb6tT-Na8wvnDoGMsQ_EeMfQzdz') : {
  auth: {
    signInWithPassword: async () => ({ error: { message: 'Supabase client failed to load' } }),
    signOut: async () => {},
    getSession: async () => ({ data: { session: null } }),
    resetPasswordForEmail: async () => ({ error: null }),
    signUp: async () => ({ error: { message: 'Not initialized' } })
  },
  from: () => ({ select: () => ({ order: () => ({ data: [] }) }), update: () => ({ eq: () => {} }), delete: () => ({ eq: () => {} }), insert: () => {} })
});

let globalFamilies = [];
let globalUsers = [];
let globalGrievances = [];

// استعادة الجلسة تلقائياً عند فتح أو تحديث الصفحة لمنع الخروج غير المبرر
window.addEventListener('DOMContentLoaded', async () => {
  const emailEl = document.getElementById('login-email');
  const passEl = document.getElementById('login-pass');
  if (emailEl) emailEl.value = '';
  if (passEl) passEl.value = '';

  if (supabaseClient && supabaseClient.auth) {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session && session.user) {
        const profRes = await supabaseClient
          .from('users_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profRes.data && profRes.data.account_status === 'approved') {
          const loginBox = document.getElementById('login-box');
          if (loginBox) loginBox.classList.add('hidden');
          const area = document.getElementById('dashboard-area');
          if (area) {
            area.classList.remove('hidden');
            if (profRes.data.role === 'admin') {
              await renderFullAdminDashboard(area, profRes.data);
            } else {
              await renderPartnerDashboard(area, profRes.data);
            }
          }
        }
      }
    } catch (e) {
      console.error('Session restore check error:', e);
    }
  }
});

async function loginUser() {
  try {
    const emailInput = document.getElementById('login-email');
    const passInput = document.getElementById('login-pass');
    const email = emailInput ? emailInput.value.trim() : '';
    const pass = passInput ? passInput.value : '';

    if (!email || !pass) return alert('⚠️ أدخل البريد الإلكتروني وكلمة المرور.');
    if (!supabaseClient) return alert('⚠️ تعذر الاتصال بقاعدة البيانات.');

    const res = await supabaseClient.auth.signInWithPassword({ email, password: pass });
    if (res.error) return alert('❌ خطأ في الدخول: ' + res.error.message);

    if (emailInput) emailInput.value = '';
    if (passInput) passInput.value = '';

    const profRes = await supabaseClient
      .from('users_profiles')
      .select('*')
      .eq('id', res.data.user.id)
      .single();

    const prof = profRes.data;
    if (!prof || prof.account_status !== 'approved') {
      await supabaseClient.auth.signOut();
      return alert('⏳ حسابك غير نشط أو بانتظار اعتماد الإدارة.');
    }

    const loginBox = document.getElementById('login-box');
    if (loginBox) loginBox.classList.add('hidden');
    const area = document.getElementById('dashboard-area');
    if (area) area.classList.remove('hidden');

    if (prof.role === 'admin') {
      await renderFullAdminDashboard(area, prof);
    } else {
      await renderPartnerDashboard(area, prof);
    }
  } catch (err) {
    alert('❌ خطأ: ' + err.message);
  }
}

async function logoutUser() {
  if (supabaseClient && supabaseClient.auth) {
    await supabaseClient.auth.signOut();
  }
  location.reload();
}

// ==========================================
// 1. لوحة الإدارة العليا الشاملة (غرفة العمليات)
// ==========================================
async function renderFullAdminDashboard(container, profile) {
  const [famRes, usersRes, grievRes] = await Promise.all([
    supabaseClient.from('families').select('*').order('created_at', { ascending: false }),
    supabaseClient.from('users_profiles').select('*').order('created_at', { ascending: false }),
    supabaseClient.from('grievances').select('*').order('created_at', { ascending: false })
  ]);

  globalFamilies = famRes.data || [];
  globalUsers = usersRes.data || [];
  globalGrievances = grievRes.data || [];

  const pendingUsersCount = globalUsers.filter(u => u.account_status === 'pending').length;
  const activeUsersCount = globalUsers.filter(u => u.account_status === 'approved').length;

  container.innerHTML = `
    <div class="card">
      <!-- الترويسة -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-bottom:2px solid #e2e8f0; padding-bottom:14px; margin-bottom:20px;">
        <div>
          <h3 style="text-align:right; font-size:20px; margin:0; color:#064e3b;">🏛️ غرفة العمليات والإدارة العليا - مؤسسة الحافظ</h3>
          <p style="font-size:13px; color:#047857; font-weight:700; margin:4px 0 0;">مرحباً: ${profile.full_name} (صلاحيات كاملة)</p>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button type="button" onclick="showSection('apply')" class="action-btn">+ تسجيل حالة جديدة</button>
          <button type="button" onclick="exportToExcel('تقرير_مؤسسة_الحافظ_الشامل')" class="nav-btn" style="background:#15803d; color:#fff;">📊 تصدير Excel</button>
          <button type="button" onclick="exportToPDF()" class="nav-btn" style="background:#b91c1c; color:#fff;">📄 تصدير PDF</button>
          <button type="button" onclick="logoutUser()" class="nav-btn btn-dark">خروج آمن</button>
        </div>
      </div>

      <!-- الإحصائيات اللحظية -->
      <div class="grid-4" style="margin-bottom:20px; text-align:center;">
        <div style="background:#ecfdf5; padding:14px; border-radius:12px; border:1px solid #a7f3d0;">
          <p style="font-size:12px; font-weight:700; margin:0;">إجمالي الحالات</p>
          <strong style="font-size:24px; color:#065f46;">${globalFamilies.length}</strong>
        </div>
        <div style="background:#eff6ff; padding:14px; border-radius:12px; border:1px solid #bfdbfe;">
          <p style="font-size:12px; font-weight:700; margin:0;">الأعضاء النشطون</p>
          <strong style="font-size:24px; color:#1e40af;">${activeUsersCount}</strong>
        </div>
        <div style="background:#fffbeb; padding:14px; border-radius:12px; border:1px solid #fde68a;">
          <p style="font-size:12px; font-weight:700; margin:0;">طلبات انضمام معلقة</p>
          <strong style="font-size:24px; color:#92400e;">${pendingUsersCount}</strong>
        </div>
        <div style="background:#fef2f2; padding:14px; border-radius:12px; border:1px solid #fecaca;">
          <p style="font-size:12px; font-weight:700; margin:0;">التظلمات والشكاوى</p>
          <strong style="font-size:24px; color:#991b1b;">${globalGrievances.length}</strong>
        </div>
      </div>

      <!-- أزرار التنقل بين الأقسام -->
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px; border-bottom:1px solid #cbd5e1; padding-bottom:10px;">
        <button type="button" onclick="switchAdminTab('families')" class="action-btn" id="tab-btn-families">📋 إدارة الحالات والإسناد (${globalFamilies.length})</button>
        <button type="button" onclick="switchAdminTab('users')" class="nav-btn" id="tab-btn-users">👥 إدارة الأعضاء والصلاحيات (${globalUsers.length})</button>
        <button type="button" onclick="switchAdminTab('grievances')" class="nav-btn" id="tab-btn-grievances">📩 التظلمات السرية (${globalGrievances.length})</button>
        <button type="button" onclick="switchAdminTab('reports')" class="nav-btn" id="tab-btn-reports">📈 تقارير الأداء والإنجاز</button>
      </div>

      <!-- منطقة عرض المحتوى المتغير -->
      <div id="admin-tab-content"></div>
    </div>`;

  switchAdminTab('families');
}

function switchAdminTab(tabName) {
  const tabs = ['families', 'users', 'grievances', 'reports'];
  tabs.forEach(t => {
    const btn = document.getElementById('tab-btn-' + t);
    if (btn) btn.className = (t === tabName) ? 'action-btn' : 'nav-btn';
  });

  const content = document.getElementById('admin-tab-content');
  if (!content) return;

  // --- التبويب 1: الحالات والإسناد ---
  if (tabName === 'families') {
    const researchers = globalUsers.filter(u => u.account_status === 'approved');

    let rows = globalFamilies.map(f => {
      const assignedUser = globalUsers.find(u => u.id === f.assigned_to);
      return `
        <tr>
          <td><strong>${f.tracking_code}</strong><br><small style="color:#64748b;">${new Date(f.created_at).toLocaleDateString('ar-EG')}</small></td>
          <td>${f.governorate || ''} - ${f.center_city || ''}<br><strong>${f.village_hamlet || ''}</strong></td>
          <td>${f.aid_type || ''}</td>
          <td>دخل: ${f.total_income || 0}<br>مصروف: ${f.total_expenses || 0}</td>
          <td>
            <select onchange="assignCaseToUser('${f.id}', this.value)" style="font-size:11px; padding:4px; margin:0;">
              <option value="">-- إسناد لباحث/شريك --</option>
              ${researchers.map(r => `<option value="${r.id}" ${f.assigned_to === r.id ? 'selected' : ''}>${r.full_name}</option>`).join('')}
            </select>
            ${assignedUser ? `<div style="font-size:10px; color:#047857; margin-top:2px;">المسند إليه: ${assignedUser.full_name}</div>` : ''}
          </td>
          <td><span style="padding:3px 8px; border-radius:6px; font-size:11px; font-weight:700; background:${getStatusColor(f.status)};">${translateStatus(f.status)}</span></td>
          <td style="white-space:nowrap;">
            <button type="button" onclick="updateFamilyStatus('${f.id}', 'approved')" class="action-btn" style="padding:4px 8px; font-size:11px;" title="اعتماد">✅</button>
            <button type="button" onclick="updateFamilyStatus('${f.id}', 'rejected')" class="action-btn" style="padding:4px 8px; font-size:11px; background:#b91c1c;" title="رفض">❌</button>
            <button type="button" onclick="deleteFamilyRecord('${f.id}')" class="nav-btn" style="padding:4px 8px; font-size:11px; background:#334155; color:#fff;" title="حذف نهائي">🗑️</button>
          </td>
        </tr>`;
    }).join('');

    content.innerHTML = `
      <div style="overflow-x:auto;" id="printable-area">
        <table>
          <thead>
            <tr>
              <th>الكود والتاريخ</th><th>الموقع الجغرافي</th><th>نوع المساعدة</th><th>الميزانية</th><th>إسناد الحالة</th><th>الحالة</th><th>إجراءات</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="7" style="text-align:center;">لا توجد حالات مسجلة.</td></tr>'}</tbody>
        </table>
      </div>`;
  }

  // --- التبويب 2: إدارة الأعضاء الكاملة ---
  else if (tabName === 'users') {
    let rows = globalUsers.map(u => {
      const assignedCount = globalFamilies.filter(f => f.assigned_to === u.id).length;
      const isApproved = u.account_status === 'approved';
      return `
        <tr>
          <td>
            <strong>${u.full_name}</strong><br>
            <small style="color:#64748b;">${u.email || 'البريد مسجل بالنظام'}</small>
          </td>
          <td>${translateRole(u.role)}</td>
          <td>${u.phone || '-'}</td>
          <td><strong>${assignedCount}</strong> حالة مسندة</td>
          <td>
            <span style="padding:3px 8px; border-radius:12px; font-size:11px; font-weight:700; background:${isApproved ? '#d1fae5' : '#fee2e2'}; color:${isApproved ? '#065f46' : '#991b1b'};">
              ${isApproved ? '🟢 نشط' : '🔴 غير نشط / معلق'}
            </span>
          </td>
          <td style="white-space:nowrap;">
            <button type="button" onclick="toggleUserActiveStatus('${u.id}', '${isApproved ? 'suspended' : 'approved'}')" class="nav-btn" style="padding:4px 8px; font-size:11px;">
              ${isApproved ? '⏸️ إيقاف' : '▶️ تفعيل'}
            </button>
            <button type="button" onclick="editUserModal('${u.id}')" class="action-btn" style="padding:4px 8px; font-size:11px; background:#0284c7;">✏️ تعديل</button>
            <button type="button" onclick="resetUserPassword('${u.email || ''}')" class="nav-btn" style="padding:4px 8px; font-size:11px; background:#d97706; color:#fff;">🔑 الباسورد</button>
            <button type="button" onclick="deleteUserAccount('${u.id}')" class="nav-btn" style="padding:4px 8px; font-size:11px; background:#b91c1c; color:#fff;">🗑️ حذف</button>
          </td>
        </tr>`;
    }).join('');

    content.innerHTML = `
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th>الاسم والبريد</th><th>الصفة / الدور</th><th>الهاتف</th><th>العهدة والحالات</th><th>حالة الحساب</th><th>التحكم الكامل</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="6" style="text-align:center;">لا يوجد أعضاء مسجلون.</td></tr>'}</tbody>
        </table>
      </div>`;
  }

  // --- التبويب 3: التظلمات السرية ---
  else if (tabName === 'grievances') {
    let rows = globalGrievances.map(g => `
      <div style="background:#fff1f2; border:1px solid #fecdd3; padding:12px; border-radius:10px; margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; font-size:12px; color:#9f1239; font-weight:700; margin-bottom:6px;">
          <span>📌 النوع: ${g.complaint_type} | هاتف المُبلّغ: ${g.phone}</span>
          <span>${new Date(g.created_at).toLocaleDateString('ar-EG')}</span>
        </div>
        <p style="margin:0; font-size:13px; color:#1e293b;">${g.details}</p>
      </div>
    `).join('');
    content.innerHTML = rows || '<p style="text-align:center; color:#64748b;">لا توجد تظلمات أو شكاوى واردة.</p>';
  }

  // --- التبويب 4: تقارير الأداء والإنجاز ---
  else if (tabName === 'reports') {
    let userReports = globalUsers.map(u => {
      const userCases = globalFamilies.filter(f => f.assigned_to === u.id);
      const approved = userCases.filter(f => f.status === 'approved').length;
      const pending = userCases.filter(f => f.status === 'pending').length;
      return `
        <tr>
          <td><strong>${u.full_name}</strong></td>
          <td>${translateRole(u.role)}</td>
          <td>${userCases.length}</td>
          <td style="color:#047857; font-weight:700;">${approved}</td>
          <td style="color:#b45309; font-weight:700;">${pending}</td>
        </tr>`;
    }).join('');

    content.innerHTML = `
      <h4 style="color:#064e3b; margin-bottom:10px;">📊 تقرير إنتاجية الأعضاء والجمعيات الشريكة</h4>
      <table>
        <thead>
          <tr><th>العضو / الجمعية</th><th>الصفة</th><th>إجمالي المسند إليه</th><th>حالات معتمدة</th><th>قيد الفحص</th></tr>
        </thead>
        <tbody>${userReports}</tbody>
      </table>`;
  }
}

// ==========================================
// 2. دوال التحكم في الحالات والأعضاء (CRUD)
// ==========================================
async function assignCaseToUser(famId, userId) {
  await supabaseClient.from('families').update({ assigned_to: userId || null }).eq('id', famId);
  alert('✅ تم تحديث إسناد الحالة بنجاح.');
}

async function updateFamilyStatus(famId, newStatus) {
  const note = newStatus === 'rejected' ? prompt('اكتب سبب الرفض (يظهر للجمعية الشريكة):') : 'معتمد من الإدارة العليا';
  if (newStatus === 'rejected' && note === null) return;
  await supabaseClient.from('families').update({ status: newStatus, rejection_or_action_note: note }).eq('id', famId);
  alert('✅ تم تحديث حالة الطلب.');
  location.reload();
}

async function deleteFamilyRecord(famId) {
  if (!confirm('⚠️ تحذير: هل أنت متأكد من حذف ملف هذه الأسرة نهائياً من قاعدة البيانات؟')) return;
  await supabaseClient.from('families').delete().eq('id', famId);
  alert('🗑️ تم حذف السجل بنجاح.');
  location.reload();
}

async function toggleUserActiveStatus(userId, newStatus) {
  await supabaseClient.from('users_profiles').update({ account_status: newStatus }).eq('id', userId);
  alert(newStatus === 'approved' ? '✅ تم تفعيل الحساب ليصبح نشطاً.' : '⏸️ تم إيقاف الحساب.');
  location.reload();
}

async function editUserModal(userId) {
  const user = globalUsers.find(u => u.id === userId);
  if (!user) return;
  const newName = prompt('تعديل الاسم الكامل:', user.full_name);
  if (newName === null) return;
  const newPhone = prompt('تعديل رقم الهاتف:', user.phone || '');
  const newEmail = prompt('تعديل البريد الإلكتروني المسجل في الملف:', user.email || '');
  const newRole = prompt('تعديل الصفة (admin / grassroots_partner / donor_partner / researcher / volunteer):', user.role);

  await supabaseClient.from('users_profiles').update({
    full_name: newName.trim() || user.full_name,
    phone: newPhone ? newPhone.trim() : user.phone,
    email: newEmail ? newEmail.trim() : user.email,
    role: newRole ? newRole.trim() : user.role
  }).eq('id', userId);

  alert('✅ تم حفظ تعديلات بيانات العضو بنجاح.');
  location.reload();
}

async function resetUserPassword(email) {
  const targetEmail = email || prompt('أدخل البريد الإلكتروني للعضو لإرسال رابط تغيير كلمة المرور له:');
  if (!targetEmail) return;
  const { error } = await supabaseClient.auth.resetPasswordForEmail(targetEmail);
  if (error) {
    alert('❌ تعذر الإرسال: ' + error.message);
  } else {
    alert('🔑 تم إرسال رابط استعادة وتعيين كلمة مرور جديدة إلى البريد الإلكتروني: ' + targetEmail);
  }
}

async function deleteUserAccount(userId) {
  if (!confirm('⚠️ هل أنت متأكد من حذف هذا العضو من المنظومة؟')) return;
  await supabaseClient.from('users_profiles').delete().eq('id', userId);
  alert('🗑️ تم حذف العضو بنجاح.');
  location.reload();
}

// ==========================================
// 3. لوحة الشركاء والباحثين (الحالات المسندة وتقاريرهم)
// ==========================================
async function renderPartnerDashboard(container, profile) {
  const famRes = await supabaseClient.from('families').select('*').order('created_at', { ascending: false });
  const allFamilies = famRes.data || [];
  const myCases = allFamilies.filter(f => f.assigned_to === profile.id || f.created_by === profile.id);

  let rows = myCases.map(f => `
    <tr>
      <td><strong>${f.tracking_code}</strong></td>
      <td>${f.village_hamlet || ''}</td>
      <td>${f.aid_type || ''}</td>
      <td>${translateStatus(f.status)}</td>
      <td>${f.rejection_or_action_note || '-'}</td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-bottom:1px solid #e2e8f0; padding-bottom:12px; margin-bottom:16px;">
        <div>
          <h3 style="text-align:right; font-size:18px; margin:0;">بوابة الشركاء والباحثين الميدانيين</h3>
          <p style="font-size:12px; color:#047857; margin:4px 0 0;">مرحباً: <strong>${profile.full_name}</strong> (${translateRole(profile.role)}) | الحالة: 🟢 نشط</p>
        </div>
        <div style="display:flex; gap:8px;">
          <button type="button" onclick="showSection('apply')" class="action-btn">+ تسجيل حالة جديدة</button>
          <button type="button" onclick="exportToExcel('تقرير_${profile.full_name}')" class="nav-btn" style="background:#15803d; color:#fff;">📊 Excel</button>
          <button type="button" onclick="exportToPDF()" class="nav-btn" style="background:#b91c1c; color:#fff;">📄 PDF</button>
          <button type="button" onclick="logoutUser()" class="nav-btn btn-dark">خروج</button>
        </div>
      </div>
      <div class="grid-3" style="margin-bottom:16px; text-align:center;">
        <div style="background:#f8fafc; padding:10px; border-radius:10px; border:1px solid #e2e8f0;"><p style="font-size:12px; margin:0;">الحالات المسندة إليك</p><strong>${myCases.length}</strong></div>
        <div style="background:#ecfdf5; padding:10px; border-radius:10px; border:1px solid #a7f3d0;"><p style="font-size:12px; margin:0;">المعتمدة</p><strong>${myCases.filter(c => c.status === 'approved').length}</strong></div>
        <div style="background:#fffbeb; padding:10px; border-radius:10px; border:1px solid #fde68a;"><p style="font-size:12px; margin:0;">قيد الفحص</p><strong>${myCases.filter(c => c.status === 'pending').length}</strong></div>
      </div>
      <div style="overflow-x:auto;" id="printable-area">
        <table>
          <thead><tr><th>الكود</th><th>القرية</th><th>المساعدة</th><th>الحالة</th><th>ملاحظات الإدارة</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="5" style="text-align:center;">لا توجد حالات مسندة إليك حالياً.</td></tr>'}</tbody>
        </table>
      </div>
    </div>`;
}

// ==========================================
// 4. التصدير إلى Excel و PDF
// ==========================================
function exportToExcel(filename) {
  let csv = "\uFEFFكود الطلب,المحافظة,المركز,القرية,نوع المساعدة,إجمالي الدخل,إجمالي المصروفات,الحالة,ملاحظات الإدارة\n";
  globalFamilies.forEach(f => {
    csv += `"${f.tracking_code || ''}","${f.governorate || ''}","${f.center_city || ''}","${f.village_hamlet || ''}","${f.aid_type || ''}","${f.total_income || 0}","${f.total_expenses || 0}","${translateStatus(f.status)}","${f.rejection_or_action_note || ''}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename + ".csv";
  link.click();
}

function exportToPDF() {
  const printContent = document.getElementById('printable-area');
  if (!printContent) return alert('⚠️ افتح جدول الحالات أولاً لتصديره.');
  const win = window.open('', '', 'height=700,width=900');
  win.document.write('<html dir="rtl" lang="ar"><head><title>تقرير مؤسسة الحافظ للتنمية والخدمات</title>');
  win.document.write('<style>body{font-family:Tahoma,Arial,sans-serif; padding:20px;} table{width:100%; border-collapse:collapse; margin-top:15px;} th,td{border:1px solid #94a3b8; padding:8px; text-align:right; font-size:12px;} th{background:#064e3b; color:#fff;} h2{color:#064e3b; text-align:center;}</style>');
  win.document.write('</head><body>');
  win.document.write('<h2>مؤسسة الحافظ للتنمية والخدمات - كشف الحالات المعتمد</h2>');
  win.document.write('<p style="text-align:center; font-size:12px;">تاريخ التقرير: ' + new Date().toLocaleDateString('ar-EG') + '</p>');
  win.document.write(printContent.innerHTML);
  win.document.write('</body></html>');
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 500);
}

// ==========================================
// 5. دوال مساعدة (الاستعلام، التظلمات، التسجيل)
// ==========================================
function translateRole(role) {
  const roles = {
    'admin': 'إدارة عليا',
    'grassroots_partner': 'جمعية شريكة',
    'donor_partner': 'مؤسسة مانحة',
    'researcher': 'باحث ميداني',
    'volunteer': 'متطوع'
  };
  return roles[role] || role;
}

function translateStatus(status) {
  const st = {
    'pending': 'قيد المراجعة',
    'approved': 'مقبولة ومعتمدة',
    'rejected': 'مرفوضة'
  };
  return st[status] || status;
}

function getStatusColor(status) {
  if (status === 'approved') return '#d1fae5; color:#065f46';
  if (status === 'rejected') return '#fee2e2; color:#991b1b';
  return '#fef3c7; color:#92400e';
}

async function trackApplication() {
  const val = document.getElementById('track-input').value.trim();
  if (!val) return alert('⚠️ أدخل كود الطلب أو الرقم القومي.');
  if (!supabaseClient) return;
  const res = await supabaseClient.from('families').select('*').eq('tracking_code', val).maybeSingle();
  const box = document.getElementById('track-result');
  if (!box) return;
  if (res.data) {
    box.innerHTML = `<div style="padding:14px; border-radius:12px; background:#ecfdf5; border:1px solid #10b981; font-size:13px;">
      <strong>كود الطلب: ${res.data.tracking_code}</strong><br>
      نوع المساعدة: ${res.data.aid_type}<br>
      الحالة الحالية: <strong>${translateStatus(res.data.status)}</strong><br>
      ملاحظات: ${res.data.rejection_or_action_note || 'قيد المراجعة'}
    </div>`;
  } else {
    box.innerHTML = '<p style="color:#b91c1c; font-weight:700; font-size:13px;">❌ لم يتم العثور على طلب بهذا الكود.</p>';
  }
}

async function submitGrievance() {
  const phone = document.getElementById('grievance-phone').value.trim();
  const details = document.getElementById('grievance-details').value.trim();
  if (!phone || !details) return alert('⚠️ أدخل رقم الهاتف والتفاصيل.');
  if (supabaseClient) {
    await supabaseClient.from('grievances').insert([{
      complaint_type: document.getElementById('grievance-type').value,
      phone: phone,
      details: details
    }]);
  }
  alert('✅ تم إرسال رسالتك بسرية تامة لرئيس مجلس الأمناء.');
  showSection('home');
}

function openPartnerRegister() {
  const loginBox = document.getElementById('login-box');
  if (loginBox) loginBox.classList.add('hidden');
  const box = document.getElementById('partner-register-box');
  if (!box) return;
  box.classList.remove('hidden');
  box.innerHTML = `
    <h3 style="font-size:18px; margin-bottom:10px;">طلب انضمام لمنظومة مؤسسة الحافظ</h3>
    <select id="reg-role" style="margin-bottom:8px;">
      <option value="grassroots_partner">جمعية قاعدية شريكة</option>
      <option value="donor_partner">مؤسسة كبرى مانحة</option>
      <option value="researcher">باحث ميداني</option>
      <option value="volunteer">متطوع</option>
    </select>
    <input id="reg-name" placeholder="الاسم الكامل / اسم الجمعية" style="margin-bottom:8px;">
    <input id="reg-phone" placeholder="رقم الموبايل / واتساب" style="margin-bottom:8px;">
    <input id="reg-email" autocomplete="off" placeholder="البريد الإلكتروني (للدخول)" style="margin-bottom:8px;">
    <input type="password" id="reg-pass" autocomplete="new-password" placeholder="كلمة المرور (6 أحرف على الأقل)" style="margin-bottom:10px;">
    <button type="button" onclick="submitPartnerRegisterToSupabase()" class="action-btn" style="width:100%; margin-bottom:8px;">إرسال طلب الاعتماد</button>
    <button type="button" onclick="location.reload()" class="nav-btn" style="width:100%;">رجوع</button>`;
}

async function submitPartnerRegisterToSupabase() {
  const role = document.getElementById('reg-role').value;
  const name = document.getElementById('reg-name').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass = document.getElementById('reg-pass').value;

  if (!name || !phone || !email || !pass || pass.length < 6) {
    return alert('⚠️ يرجى ملء كافة البيانات وكلمة مرور من 6 أحرف على الأقل.');
  }

  try {
    const authRes = await supabaseClient.auth.signUp({ email, password: pass });
    if (authRes.error) throw new Error(authRes.error.message);

    const userId = authRes.data.user ? authRes.data.user.id : null;
    if (userId) {
      await supabaseClient.from('users_profiles').insert([{
        id: userId,
        full_name: name,
        email: email,
        role: role,
        phone: phone,
        account_status: 'pending'
      }]);
    }

    alert('✅ تم إرسال طلب الانضمام بنجاح! بانتظار اعتماد الإدارة العليا.');
    location.reload();
  } catch (err) {
    alert('❌ خطأ في التسجيل: ' + err.message);
  }
}
