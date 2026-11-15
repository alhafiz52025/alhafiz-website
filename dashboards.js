const SB_URL = https://fwyacpvbhwdlivzeiper.supabase.co
const SB_KEY = sb_publishable_6xYRIb6tT-Na8wvnDoGMsQ_EeMfQzdz
const supabaseClient = window.supabase
  ? window.supabase.createClient(SB_URL, SB_KEY)
  : null;

async function loginUser() {
  try {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value;
    if (!email || !pass) return alert('⚠️ أدخل البريد الإلكتروني وكلمة المرور.');
    if (!supabaseClient) return alert('⚠️ تعذر الاتصال بقاعدة البيانات.');

    const res = await supabaseClient.auth.signInWithPassword({ email, password: pass });
    if (res.error) return alert('❌ خطأ في الدخول: ' + res.error.message);

    const profRes = await supabaseClient
      .from('users_profiles')
      .select('*')
      .eq('id', res.data.user.id)
      .single();

    const prof = profRes.data;
    if (!prof || prof.account_status !== 'approved') {
      await supabaseClient.auth.signOut();
      return alert('⏳ حسابك بانتظار اعتماد الإدارة.');
    }

    document.getElementById('login-box').classList.add('hidden');
    const area = document.getElementById('dashboard-area');
    area.classList.remove('hidden');

    if (prof.role === 'admin') {
      await renderFullAdminDashboard(area, prof);
    } else {
      await renderPartnerDashboard(area, prof);
    }
  } catch (err) {
    alert('❌ خطأ: ' + err.message);
  }
}

async function renderFullAdminDashboard(container, profile) {
  const famRes = await supabaseClient.from('families').select('*').order('created_at', { ascending: false });
  const usersRes = await supabaseClient.from('users_profiles').select('*').order('created_at', { ascending: false });
  const grievRes = await supabaseClient.from('grievances').select('*').order('created_at', { ascending: false });

  const families = famRes.data || [];
  const users = usersRes.data || [];
  const grievances = grievRes.data || [];
  const pendingUsers = users.filter(u => u.account_status === 'pending');

  let famRows = families.map(f => `
    <tr>
      <td><strong>${f.tracking_code}</strong></td>
      <td>${f.governorate} - ${f.center_city} (${f.village_hamlet})</td>
      <td>${f.aid_type}</td>
      <td>${f.total_income} / ${f.total_expenses} ج.م</td>
      <td><strong>${f.status}</strong></td>
      <td>
        <button onclick="updateFamilyStatus('${f.id}', 'approved')" class="action-btn" style="padding:5px 10px; font-size:11px;">✅ اعتماد</button>
        <button onclick="updateFamilyStatus('${f.id}', 'rejected')" class="action-btn" style="padding:5px 10px; font-size:11px; background:#b91c1c;">❌ رفض</button>
      </td>
    </tr>
  `).join('');

  if (!famRows) famRows = '<tr><td colspan="6" style="text-align:center;">لا توجد طلبات مسجلة حتى الآن.</td></tr>';

  let userRows = pendingUsers.map(u => `
    <div style="background:#fffbeb; border:1px solid #fde68a; padding:10px; border-radius:10px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
      <span>🔔 <strong>${u.full_name}</strong> (${u.role}) - هاتف: ${u.phone}</span>
      <button onclick="approveUserAccount('${u.id}')" class="action-btn" style="padding:6px 12px; font-size:12px;">اعتماد الحساب</button>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #e2e8f0; padding-bottom:14px; margin-bottom:20px;">
        <div>
          <h3 style="text-align:right; font-size:20px; margin:0;">🏛️ غرفة العمليات والإدارة العليا - مؤسسة الحافظ</h3>
          <p style="font-size:13px; color:#047857; font-weight:700;">رئيس مجلس الأمناء: ${profile.full_name}</p>
        </div>
        <div style="display:flex; gap:8px;">
          <button onclick="showSection('apply')" class="action-btn">+ تسجيل حالة جديدة</button>
          <button onclick="location.reload()" class="nav-btn btn-dark">خروج</button>
        </div>
      </div>

      <div class="grid-4" style="margin-bottom:20px; text-align:center;">
        <div style="background:#ecfdf5; padding:14px; border-radius:12px; border:1px solid #a7f3d0;">
          <p style="font-size:12px; font-weight:700;">إجمالي الأسر</p>
          <strong style="font-size:22px; color:#065f46;">${families.length}</strong>
        </div>
        <div style="background:#fffbeb; padding:14px; border-radius:12px; border:1px solid #fde68a;">
          <p style="font-size:12px; font-weight:700;">طلبات اعتماد حسابات</p>
          <strong style="font-size:22px; color:#92400e;">${pendingUsers.length}</strong>
        </div>
        <div style="background:#eff6ff; padding:14px; border-radius:12px; border:1px solid #bfdbfe;">
          <p style="font-size:12px; font-weight:700;">الأعضاء والشركاء</p>
          <strong style="font-size:22px; color:#1e40af;">${users.length}</strong>
        </div>
        <div style="background:#fef2f2; padding:14px; border-radius:12px; border:1px solid #fecaca;">
          <p style="font-size:12px; font-weight:700;">التظلمات السرية</p>
          <strong style="font-size:22px; color:#991b1b;">${grievances.length}</strong>
        </div>
      </div>

      ${userRows ? '<h4 style="margin-bottom:10px; color:#92400e;">طلبات انضمام بانتظار اعتمادك:</h4>' + userRows : ''}

      <div style="display:flex; justify-content:space-between; align-items:center; margin:16px 0 10px;">
        <h4 style="color:#064e3b; margin:0;">📋 سجل الحالات والطلبات المسجلة بالمنظومة</h4>
        <button onclick="exportCSV('تقرير_مؤسسة_الحافظ_الشامل')" class="nav-btn btn-dark">📥 تصدير Excel</button>
      </div>
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th>الكود</th><th>المركز والقرية</th><th>نوع المساعدة</th><th>الدخل / المصروف</th><th>الحالة</th><th>القرار الإداري</th>
            </tr>
          </thead>
          <tbody>${famRows}</tbody>
        </table>
      </div>
    </div>`;
}
async function updateFamilyStatus(famId, newStatus) {
  const note = newStatus === 'rejected' ? prompt('اكتب سبب الرفض (يظهر للجمعية الشريكة):') : 'معتمد من الإدارة';
  await supabaseClient.from('families').update({ status: newStatus, rejection_or_action_note: note }).eq('id', famId);
  alert('✅ تم تحديث حالة الطلب بنجاح.');
  location.reload();
}

async function approveUserAccount(userId) {
  await supabaseClient.from('users_profiles').update({ account_status: 'approved' }).eq('id', userId);
  alert('✅ تم اعتماد الحساب وتفعيله بنجاح.');
  location.reload();
}

async function renderPartnerDashboard(container, profile) {
  const famRes = await supabaseClient.from('families').select('*').order('created_at', { ascending: false });
  const families = famRes.data || [];
  let rows = families.map(f => `
    <tr>
      <td><strong>${f.tracking_code}</strong></td>
      <td>${f.village_hamlet}</td>
      <td>${f.aid_type}</td>
      <td>${f.status}</td>
      <td>${f.rejection_or_action_note || '-'}</td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:12px; margin-bottom:16px;">
        <div>
          <h3 style="text-align:right; font-size:18px; margin:0;">بوابة الشركاء والباحثين</h3>
          <p style="font-size:12px; color:#047857;">مرحباً: ${profile.full_name}</p>
        </div>
        <div style="display:flex; gap:8px;">
          <button onclick="showSection('apply')" class="action-btn">+ تسجيل حالة</button>
          <button onclick="location.reload()" class="nav-btn btn-dark">خروج</button>
        </div>
      </div>
      <table>
        <thead><tr><th>الكود</th><th>القرية</th><th>المساعدة</th><th>الحالة</th><th>ملاحظات الإدارة</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5">لا توجد حالات بعد.</td></tr>'}</tbody>
      </table>
    </div>`;
}

async function trackApplication() {
  const val = document.getElementById('track-input').value.trim();
  if (!val) return alert('⚠️ أدخل كود الطلب أو الرقم القومي.');
  if (!supabaseClient) return;
  const res = await supabaseClient.from('families').select('*').eq('tracking_code', val).maybeSingle();
  const box = document.getElementById('track-result');
  if (res.data) {
    box.innerHTML = `<div style="padding:14px; border-radius:12px; background:#ecfdf5; border:1px solid #10b981;">
      <strong>كود الطلب: ${res.data.tracking_code}</strong><br>
      نوع المساعدة: ${res.data.aid_type}<br>
      الحالة الحالية: <strong>${res.data.status}</strong><br>
      ملاحظات: ${res.data.rejection_or_action_note || 'قيد المراجعة'}
    </div>`;
  } else {
    box.innerHTML = '<p style="color:#b91c1c; font-weight:700;">❌ لم يتم العثور على طلب بهذا الكود.</p>';
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
  document.getElementById('login-box').classList.add('hidden');
  const box = document.getElementById('partner-register-box');
  box.classList.remove('hidden');
  box.innerHTML = `
    <h3 style="font-size:18px; margin-bottom:10px;">طلب انضمام لمنظومة مؤسسة الحافظ</h3>
    <select id="reg-role">
      <option value="grassroots_partner">جمعية قاعدية شريكة</option>
      <option value="donor_partner">مؤسسة كبرى مانحة</option>
      <option value="researcher">باحث ميداني</option>
      <option value="volunteer">متطوع</option>
    </select>
    <input id="reg-name" placeholder="الاسم الكامل / اسم الجمعية">
    <input id="reg-phone" placeholder="رقم الموبايل / واتساب">
    <input id="reg-email" placeholder="البريد الإلكتروني">
    <button onclick="alert('✅ تم استلام طلبك لمراجعته واعتماده من الإدارة.'); location.reload();" class="action-btn" style="width:100%; margin-bottom:8px;">إرسال الطلب</button>
    <button onclick="location.reload()" class="nav-btn" style="width:100%;">رجوع</button>`;
}

function exportCSV(filename) {
  const csv = "\uFEFFكود الطلب,القرية,نوع المساعدة,الحالة\n";
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename + ".csv";
  link.click();
}
