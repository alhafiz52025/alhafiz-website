// dashboards.js - المنظومة الإدارية الشاملة لمؤسسة الحافظ

const supabaseClient = window.supabaseClient || (window.supabase ? window.supabase.createClient('https://fwyacpvbhwdlivzeiper.supabase.co', 'sb_publishable_6xYRIb6tT-Na8wvnDoGMsQ_EeMfQzdz') : null);

let globalFamilies = [];
let globalUsers = [];
let globalGrievances = [];

window.addEventListener('DOMContentLoaded', async () => {
  const emailEl = document.getElementById('login-email');
  const passEl = document.getElementById('login-pass');
  if (emailEl) emailEl.value = '';
  if (passEl) passEl.value = '';

  // التأكد من إظهار صندوق الدخول افتراضياً
  const loginBox = document.getElementById('login-box');
  const dashboardArea = document.getElementById('dashboard-area');
  if (loginBox) loginBox.classList.remove('hidden');
  if (dashboardArea) dashboardArea.classList.add('hidden');

  // فحص هادئ للجلسة السابقة
  if (supabaseClient && supabaseClient.auth) {
    try {
      const { data } = await supabaseClient.auth.getSession();
      const session = data ? data.session : null;
      if (session && session.user) {
        const profRes = await supabaseClient
          .from('users_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profRes.data && profRes.data.account_status === 'approved') {
          if (loginBox) loginBox.classList.add('hidden');
          if (dashboardArea) {
            dashboardArea.classList.remove('hidden');
            if (profRes.data.role === 'admin') {
              await renderFullAdminDashboard(dashboardArea, profRes.data);
            } else {
              await renderPartnerDashboard(dashboardArea, profRes.data);
            }
          }
        }
      }
    } catch (e) {
      console.log('No active session, showing login box.');
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
  if (supabaseClient && supabaseClient.auth) await supabaseClient.auth.signOut();
  location.reload();
}

// ==========================================
// 1. غرفة العمليات والإدارة العليا
// ==========================================
async function renderFullAdminDashboard(container, profile) {
  const [famRes, usersRes, grievRes, achRes] = await Promise.all([
    supabaseClient.from('families').select('*').order('created_at', { ascending: false }),
    supabaseClient.from('users_profiles').select('*').order('created_at', { ascending: false }),
    supabaseClient.from('grievances').select('*').order('created_at', { ascending: false }),
    supabaseClient.from('achievements').select('*').order('created_at', { ascending: false }).maybeSingle()
  ]);

  globalFamilies = famRes.data || [];
  globalUsers = usersRes.data || [];
  globalGrievances = grievRes.data || [];

  const pendingUsersCount = globalUsers.filter(u => u.account_status === 'pending').length;
  const activeUsersCount = globalUsers.filter(u => u.account_status === 'approved').length;

  container.innerHTML = `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-bottom:2px solid #e2e8f0; padding-bottom:14px; margin-bottom:20px;">
        <div>
          <h3 style="text-align:right; font-size:20px; margin:0; color:var(--primary-dark);">🏛️ غرفة العمليات والإدارة العليا - مؤسسة الحافظ</h3>
          <p style="font-size:13px; color:var(--primary); font-weight:700; margin:4px 0 0;">مرحباً: ${profile.full_name} (صلاحيات كاملة)</p>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button type="button" onclick="showSection('apply')" class="action-btn">+ تسجيل حالة جديدة</button>
          <button type="button" onclick="exportToExcel('تقرير_مؤسسة_الحافظ')" class="nav-btn" style="background:#15803d; color:#fff;">📊 Excel</button>
          <button type="button" onclick="exportToPDF()" class="nav-btn" style="background:#b91c1c; color:#fff;">📄 PDF</button>
          <button type="button" onclick="logoutUser()" class="nav-btn btn-dark">خروج آمن</button>
        </div>
      </div>

      <div class="grid-4" style="margin-bottom:20px; text-align:center;">
        <div style="background:#ecfdf5; padding:14px; border-radius:12px; border:1px solid #a7f3d0;"><p style="font-size:12px; font-weight:700; margin:0;">إجمالي الحالات</p><strong style="font-size:24px; color:#065f46;">${globalFamilies.length}</strong></div>
        <div style="background:#eff6ff; padding:14px; border-radius:12px; border:1px solid #bfdbfe;"><p style="font-size:12px; font-weight:700; margin:0;">الأعضاء النشطون</p><strong style="font-size:24px; color:#1e40af;">${activeUsersCount}</strong></div>
        <div style="background:#fffbeb; padding:14px; border-radius:12px; border:1px solid #fde68a;"><p style="font-size:12px; font-weight:700; margin:0;">طلبات معلقة</p><strong style="font-size:24px; color:#92400e;">${pendingUsersCount}</strong></div>
        <div style="background:#fef2f2; padding:14px; border-radius:12px; border:1px solid #fecaca;"><p style="font-size:12px; font-weight:700; margin:0;">التظلمات</p><strong style="font-size:24px; color:#991b1b;">${globalGrievances.length}</strong></div>
      </div>

      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px; border-bottom:1px solid #cbd5e1; padding-bottom:10px;">
        <button type="button" onclick="switchAdminTab('families')" class="action-btn" id="tab-btn-families">📋 إدارة الحالات (${globalFamilies.length})</button>
        <button type="button" onclick="switchAdminTab('users')" class="nav-btn" id="tab-btn-users">👥 الأعضاء (${globalUsers.length})</button>
        <button type="button" onclick="switchAdminTab('achievements')" class="nav-btn" id="tab-btn-achievements">🏆 إدارة صفحة الإنجازات</button>
        <button type="button" onclick="switchAdminTab('grievances')" class="nav-btn" id="tab-btn-grievances">📩 التظلمات (${globalGrievances.length})</button>
      </div>

      <div id="admin-tab-content"></div>
    </div>`;

  switchAdminTab('families');
}

function switchAdminTab(tabName) {
  ['families', 'users', 'achievements', 'grievances'].forEach(t => {
    const btn = document.getElementById('tab-btn-' + t);
    if (btn) btn.className = (t === tabName) ? 'action-btn' : 'nav-btn';
  });

  const content = document.getElementById('admin-tab-content');
  if (!content) return;

  if (tabName === 'families') {
    const researchers = globalUsers.filter(u => u.account_status === 'approved');
    let rows = globalFamilies.map(f => {
      const assignedUser = globalUsers.find(u => u.id === f.assigned_to);
      return `
        <tr>
          <td><strong>${f.tracking_code}</strong></td>
          <td>${f.governorate || ''} - ${f.center_city || ''} (${f.village_hamlet || ''})</td>
          <td>${f.aid_type || ''}</td>
          <td>
            <select onchange="assignCaseToUser('${f.id}', this.value)" style="font-size:11px; padding:4px; margin:0;">
              <option value="">-- إسناد لباحث --</option>
              ${researchers.map(r => `<option value="${r.id}" ${f.assigned_to === r.id ? 'selected' : ''}>${r.full_name}</option>`).join('')}
            </select>
          </td>
          <td><span style="padding:3px 8px; border-radius:6px; font-size:11px; font-weight:700; background:${getStatusColor(f.status)};">${translateStatus(f.status)}</span></td>
          <td style="white-space:nowrap;">
            <button type="button" onclick="updateFamilyStatus('${f.id}', 'approved')" class="action-btn" style="padding:4px 8px; font-size:11px;">✅</button>
            <button type="button" onclick="updateFamilyStatus('${f.id}', 'rejected')" class="action-btn" style="padding:4px 8px; font-size:11px; background:#b91c1c;">❌</button>
            <button type="button" onclick="deleteFamilyRecord('${f.id}')" class="nav-btn" style="padding:4px 8px; font-size:11px; background:#334155; color:#fff;">🗑️</button>
          </td>
        </tr>`;
    }).join('');
    content.innerHTML = `<div style="overflow-x:auto;" id="printable-area"><table><thead><tr><th>الكود</th><th>الموقع</th><th>المساعدة</th><th>الإسناد</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>${rows || '<tr><td colspan="6" style="text-align:center;">لا توجد حالات.</td></tr>'}</tbody></table></div>`;
  }
  else if (tabName === 'users') {
    let rows = globalUsers.map(u => `
      <tr>
        <td><strong>${u.full_name}</strong><br><small>${u.email || ''}</small></td>
        <td>${translateRole(u.role)}</td>
        <td>${u.phone || '-'}</td>
        <td><span style="padding:3px 8px; border-radius:12px; font-size:11px; font-weight:700; background:${u.account_status === 'approved' ? '#d1fae5' : '#fee2e2'};">${u.account_status === 'approved' ? '🟢 نشط' : '🔴 معلق'}</span></td>
        <td style="white-space:nowrap;">
          <button type="button" onclick="toggleUserActiveStatus('${u.id}', '${u.account_status === 'approved' ? 'suspended' : 'approved'}')" class="nav-btn" style="padding:4px 8px; font-size:11px;">${u.account_status === 'approved' ? '⏸️ إيقاف' : '▶️ تفعيل'}</button>
          <button type="button" onclick="deleteUserAccount('${u.id}')" class="nav-btn" style="padding:4px 8px; font-size:11px; background:#b91c1c; color:#fff;">🗑️ حذف</button>
        </td>
      </tr>`).join('');
    content.innerHTML = `<div style="overflow-x:auto;"><table><thead><tr><th>الاسم</th><th>الصفة</th><th>الهاتف</th><th>الحالة</th><th>التحكم</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  else if (tabName === 'achievements') {
    content.innerHTML = `
      <div style="background:var(--bg-color); padding:16px; border-radius:12px;">
        <h4 style="margin-top:0; color:var(--primary-dark);">➕ إضافة أو تعديل إنجاز جديد يعرض في الموقع العام</h4>
        <input id="ach-title" placeholder="عنوان الإنجاز (مثلاً: القافلة السابعة لتوزيع المساعدات)" style="margin-bottom:8px;">
        <textarea id="ach-desc" rows="3" placeholder="الشرح التفصيلي للإنجاز والأثر المجتمعي..." style="margin-bottom:8px;"></textarea>
        <input id="ach-img" placeholder="رابط صورة الإنجاز (URL أو رفع صورة)" style="margin-bottom:10px;">
        <button type="button" onclick="saveAchievement()" class="action-btn">💾 نشر التحديث على الموقع العام</button>
      </div>`;
  }
  else if (tabName === 'grievances') {
    let rows = globalGrievances.map(g => `<div style="background:#fff1f2; border:1px solid #fecdd3; padding:12px; border-radius:10px; margin-bottom:10px;"><p style="margin:0; font-weight:700; color:#9f1239;">${g.complaint_type} - هاتف: ${g.phone}</p><p style="margin:4px 0 0; font-size:13px;">${g.details}</p></div>`).join('');
    content.innerHTML = rows || '<p style="text-align:center;">لا توجد تظلمات.</p>';
  }
}

async function saveAchievement() {
  const title = document.getElementById('ach-title').value.trim();
  const desc = document.getElementById('ach-desc').value.trim();
  const imgUrl = document.getElementById('ach-img').value.trim();

  if (!title || !desc) return alert('⚠️ أدخل عنوان الإنجاز والشرح.');

  const res = await supabaseClient.from('achievements').insert([{ title, description: desc, image_url: imgUrl }]);
  if (res.error) alert('❌ خطأ: ' + res.error.message);
  else {
    alert('✅ تم نشر الإنجاز بنجاح على الموقع العام!');
    loadPublicAchievements();
  }
}

async function loadPublicAchievements() {
  const container = document.getElementById('public-achievements-container');
  if (!container || !supabaseClient) return;

  const { data } = await supabaseClient.from('achievements').select('*').order('created_at', { ascending: false });
  if (!data || data.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#64748b;">جاري تحديث الإنجازات الميدانية...</p>';
    return;
  }

  container.innerHTML = data.map(a => `
    <div style="background:var(--bg-color); border-radius:12px; border:1px solid #e2e8f0; overflow:hidden;">
      ${a.image_url ? `<img src="${a.image_url}" style="width:100%; height:160px; object-fit:cover;" onerror="this.style.display='none'">` : ''}
      <div style="padding:14px;">
        <h4 style="color:var(--primary-dark); margin:0 0 6px;">${a.title}</h4>
        <p style="font-size:13px; color:var(--text-color); line-height:1.5; margin:0;">${a.description}</p>
      </div>
    </div>`).join('');
}

async function assignCaseToUser(famId, userId) {
  await supabaseClient.from('families').update({ assigned_to: userId || null }).eq('id', famId);
  alert('✅ تم إسناد الحالة.');
}
async function updateFamilyStatus(famId, newStatus) {
  const note = newStatus === 'rejected' ? prompt('سبب الرفض:') : 'معتمد';
  await supabaseClient.from('families').update({ status: newStatus, rejection_or_action_note: note }).eq('id', famId);
  location.reload();
}
async function deleteFamilyRecord(famId) {
  if (!confirm('هل أنت متأكد من الحذف؟')) return;
  await supabaseClient.from('families').delete().eq('id', famId);
  location.reload();
}
async function toggleUserActiveStatus(userId, status) {
  await supabaseClient.from('users_profiles').update({ account_status: status }).eq('id', userId);
  location.reload();
}
async function deleteUserAccount(userId) {
  if (!confirm('حذف العضو؟')) return;
  await supabaseClient.from('users_profiles').delete().eq('id', userId);
  location.reload();
}

function exportToExcel(filename) {
  let csv = "\uFEFFكود,القرية,نوع المساعدة,الدخل,المصروفات,الحالة\n";
  globalFamilies.forEach(f => {
    csv += `"${f.tracking_code}","${f.village_hamlet}","${f.aid_type}","${f.total_income}","${f.total_expenses}","${f.status}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename + ".csv";
  link.click();
}

function exportToPDF() {
  const content = document.getElementById('printable-area');
  if (!content) return alert('افتح جدول الحالات أولاً.');
  const win = window.open('', '', 'height=700,width=900');
  win.document.write('<html dir="rtl"><body><h2>تقرير مؤسسة الحافظ</h2>' + content.innerHTML + '</body></html>');
  win.document.close();
  win.print();
}

function translateRole(role) {
  return { 'admin': 'إدارة عليا', 'grassroots_partner': 'جمعية شريكة', 'researcher': 'باحث' }[role] || role;
}
function translateStatus(st) {
  return { 'pending': 'قيد المراجعة', 'approved': 'مقبولة', 'rejected': 'مرفوضة' }[st] || st;
}
function getStatusColor(st) {
  return st === 'approved' ? '#d1fae5; color:#065f46' : '#fef3c7; color:#92400e';
}

async function trackApplication() {
  const val = document.getElementById('track-input').value.trim();
  if (!val) return;
  const res = await supabaseClient.from('families').select('*').eq('tracking_code', val).maybeSingle();
  const box = document.getElementById('track-result');
  if (res.data) box.innerHTML = `<div style="padding:12px; background:#ecfdf5; border-radius:8px;">كود: ${res.data.tracking_code} | الحالة: <strong>${translateStatus(res.data.status)}</strong></div>`;
  else box.innerHTML = '<p style="color:red;">لم يتم العثور على طلب.</p>';
}

async function submitGrievance() {
  const phone = document.getElementById('grievance-phone').value.trim();
  const details = document.getElementById('grievance-details').value.trim();
  if (!phone || !details) return alert('أدخل الهاتف والتفاصيل.');
  await supabaseClient.from('grievances').insert([{ complaint_type: document.getElementById('grievance-type').value, phone, details }]);
  alert('✅ تم إرسال رسالتك بسرية.');
  showSection('home');
}

function openPartnerRegister() {
  const loginBox = document.getElementById('login-box');
  if (loginBox) loginBox.classList.add('hidden');
  const box = document.getElementById('partner-register-box');
  if (!box) return;
  box.classList.remove('hidden');
  box.innerHTML = `
    <h3 style="margin-bottom:10px;">طلب انضمام للمنظومة</h3>
    <select id="reg-role" style="margin-bottom:8px;"><option value="grassroots_partner">جمعية شريكة</option><option value="researcher">باحث ميداني</option></select>
    <input id="reg-name" placeholder="الاسم الكامل" style="margin-bottom:8px;">
    <input id="reg-phone" placeholder="الهاتف" style="margin-bottom:8px;">
    <input id="reg-email" placeholder="البريد الإلكتروني" style="margin-bottom:8px;">
    <input type="password" id="reg-pass" placeholder="كلمة المرور" style="margin-bottom:10px;">
    <button type="button" onclick="submitPartnerRegisterToSupabase()" class="action-btn" style="width:100%; margin-bottom:8px;">إرسال</button>
    <button type="button" onclick="location.reload()" class="nav-btn" style="width:100%;">رجوع</button>`;
}

async function submitPartnerRegisterToSupabase() {
  const role = document.getElementById('reg-role').value;
  const name = document.getElementById('reg-name').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass = document.getElementById('reg-pass').value;

  const authRes = await supabaseClient.auth.signUp({ email, password: pass });
  if (authRes.error) return alert(authRes.error.message);
  if (authRes.data.user) {
    await supabaseClient.from('users_profiles').insert([{ id: authRes.data.user.id, full_name: name, email, role, phone, account_status: 'pending' }]);
  }
  alert('✅ تم إرسال طلبك بانتظار الاعتماد.');
  location.reload();
}
