const SB_URL = https://fwyacpvbhwdlivzeiper.supabase.co
const SB_KEY = sb_publishable_6xYRIb6tT-Na8wvnDoGMsQ_EeMfQzdz
const db = (typeof db !== 'undefined' && db)
  ? db
  : (window.supabase ? window.supabase.createClient(SB_URL, SB_KEY) : null);

async function loginUser() {
  try {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value;

    if (!email || !pass) {
      alert('⚠️ يرجى إدخال البريد الإلكتروني وكلمة المرور أولاً.');
      return;
    }

    if (typeof db === 'undefined' || !db) {
      alert('⚠️ تنبيه: لم يتم الاتصال بقاعدة البيانات بعد. تأكد من تعطيل مانع الإعلانات أو مراجعة مفتاح Supabase.');
      return;
    }

    const btn = document.querySelector('#login-box button');
    if (btn) btn.innerText = '⏳ جاري التحقق من البيانات...';

    const res = await db.auth.signInWithPassword({ email: email, password: pass });

    if (res.error) {
      if (btn) btn.innerText = 'تسجيل الدخول';
      alert('❌ خطأ في الدخول: ' + res.error.message);
      return;
    }

    const profRes = await db
      .from('users_profiles')
      .select('*')
      .eq('id', res.data.user.id)
      .single();

    if (profRes.error || !profRes.data) {
      if (btn) btn.innerText = 'تسجيل الدخول';
      alert('⚠️ تم الدخول ولكن حسابك غير مسجل في جدول الصلاحيات (users_profiles).');
      return;
    }

    const prof = profRes.data;
    if (prof.account_status !== 'approved') {
      await db.auth.signOut();
      if (btn) btn.innerText = 'تسجيل الدخول';
      alert('⏳ حسابك ما زال بانتظار اعتماد إدارة مؤسسة الحافظ.');
      return;
    }

    if (prof.must_change_password) {
      const newPass = prompt('🔐 لأمان حسابك، اكتب كلمة مرور جديدة (6 أحرف على الأقل):');
      if (newPass && newPass.length >= 6) {
        await db.auth.updateUser({ password: newPass });
        await db
          .from('users_profiles')
          .update({ must_change_password: false })
          .eq('id', prof.id);
        alert('✅ تم تحديث كلمة المرور بنجاح.');
      } else {
        if (btn) btn.innerText = 'تسجيل الدخول';
        alert('⚠️ يجب تعيين كلمة مرور من 6 أحرف على الأقل.');
        return;
      }
    }

    document.getElementById('login-box').classList.add('hidden');
    renderRoleDashboard(prof.role, prof);
  } catch (err) {
    alert('❌ حدث خطأ تقني: ' + err.message);
  }
}


function renderRoleDashboard(role, profile) {
  const area = document.getElementById('dashboard-area');
  area.classList.remove('hidden');
  if (role === 'grassroots_partner') renderGrassrootsDash(area, profile);
  else if (role === 'donor_partner') renderDonorDash(area, profile);
  else if (role === 'admin') renderAdminDash(area, profile);
  else renderFieldDash(area, profile, role);
}

async function trackApplication() {
  const val = document.getElementById('track-input').value.trim();
  if (!val) return alert('⚠️ أدخل كود الطلب أو الرقم القومي.');
  document.getElementById('track-result').innerHTML = `
    <div style="padding:14px; border-radius:12px; background:#ecfdf5; border:1px solid #10b981; font-size:13px;">
      <p style="font-weight:800; color:#065f46; margin-bottom:4px;">
        حالة الطلب (${val}): قيد الفحص والمراجعة الميدانية
      </p>
      <p style="color:#334155;">
        تم استلام بيانات الأسرة بنجاح وجارٍ متابعتها من لجنة البحث بمركز إهناسيا.
      </p>
    </div>`;
}

async function submitGrievance() {
  const phone = document.getElementById('grievance-phone').value.trim();
  const details = document.getElementById('grievance-details').value.trim();
  if (!phone || !details) return alert('⚠️ يرجى إدخال رقم الهاتف وتفاصيل الرسالة.');
  if (db) {
    await db.from('grievances').insert([{
      complaint_type: document.getElementById('grievance-type').value,
      phone: phone,
      details: details
    }]);
  }
  alert('✅ تم إرسال رسالتك بسرية تامة إلى لجنة الحوكمة ورئيس مجلس الأمناء.');
  showSection('home');
}
function renderGrassrootsDash(container, profile) {
  container.innerHTML = `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:12px; margin-bottom:16px;">
        <div>
          <h3 style="text-align:right; font-size:18px; margin:0;">
            بوابة الجمعيات القاعدية الشريكة
          </h3>
          <p style="font-size:12px; color:#047857; font-weight:700;">
            مرحباً: ${profile.full_name} | التقييم: ⭐⭐⭐⭐⭐
          </p>
        </div>
        <button onclick="location.reload()" class="nav-btn btn-dark">
          خروج
        </button>
      </div>
      <div class="dash-layout">
        <aside>
          <button onclick="showSection('apply')"
            style="background:#047857; color:#fff;">
            + تسجيل أسرة جديدة
          </button>
          <button onclick="filterCases('all')">
            📋 إجمالي الأسر المسجلة
          </button>
          <button onclick="filterCases('review')">
            ⏳ حالات تحت الفحص
          </button>
          <button onclick="filterCases('approved')">
            ✅ حالات مقبولة ومعتمدة
          </button>
          <button onclick="filterCases('rejected')">
            ❌ حالات مرفوضة بأسبابها
          </button>
          <button onclick="exportCSV('تقرير_الجمعية')"
            style="background:#0f172a; color:#fff; margin-top:8px;">
            📥 تحميل التقارير (Excel)
          </button>
        </aside>
        <div>
          <div class="grid-4" style="margin-bottom:16px; text-align:center;">
            <div style="background:#f8fafc; padding:10px; border-radius:10px; border:1px solid #e2e8f0;">
              <p style="font-size:12px;">المقدم</p>
              <strong style="font-size:18px;">42</strong>
            </div>
            <div style="background:#fffbeb; padding:10px; border-radius:10px; border:1px solid #fde68a; color:#92400e;">
              <p style="font-size:12px;">تحت الفحص</p>
              <strong style="font-size:18px;">11</strong>
            </div>
            <div style="background:#ecfdf5; padding:10px; border-radius:10px; border:1px solid #a7f3d0; color:#065f46;">
              <p style="font-size:12px;">مقبولة</p>
              <strong style="font-size:18px;">27</strong>
            </div>
            <div style="background:#fef2f2; padding:10px; border-radius:10px; border:1px solid #fecaca; color:#991b1b;">
              <p style="font-size:12px;">مرفوضة</p>
              <strong style="font-size:18px;">4</strong>
            </div>
          </div>
          <div style="overflow-x:auto;">
            <table>
              <thead>
                <tr>
                  <th>الكود</th>
                  <th>اسم العائل</th>
                  <th>القرية</th>
                  <th>المساعدة</th>
                  <th>الحالة والسبب</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>HF-2026-1042</strong></td>
                  <td>محمود سيد عبدالرحمن</td>
                  <td>منشأة عبدالصمد</td>
                  <td>تجهيز عروسة</td>
                  <td style="color:#047857; font-weight:700;">
                    مقبولة ومعتمدة
                  </td>
                </tr>
                <tr>
                  <td><strong>HF-2026-1015</strong></td>
                  <td>أحمد كامل إبراهيم</td>
                  <td>قاي</td>
                  <td>كفالة أيتام</td>
                  <td style="color:#b91c1c; font-weight:700;">
                    مرفوضة: مكررة بجمعية أخرى
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>`;
}

function renderDonorDash(container, profile) {
  container.innerHTML = `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:12px; margin-bottom:16px;">
        <div>
          <span style="background:#fef3c7; color:#92400e; font-size:11px; font-weight:700; padding:4px 10px; border-radius:20px;">
            بروتوكول تعاون ورقابة
          </span>
          <h3 style="text-align:right; font-size:18px; margin-top:4px;">
            لوحة المؤسسات الكبرى المانحة
          </h3>
        </div>
        <div style="display:flex; gap:8px;">
          <button onclick="exportCSV('تقرير_المؤسسة')" class="action-btn">
            📥 تصدير الكشف
          </button>
          <button onclick="location.reload()" class="nav-btn btn-dark">
            خروج
          </button>
        </div>
      </div>
      <div class="grid-3" style="margin-bottom:16px;">
        <div style="background:#ecfdf5; padding:14px; border-radius:10px; border:1px solid #a7f3d0;">
          <p style="font-size:12px; font-weight:700; color:#065f46;">
            حالات البروتوكول الممولة
          </p>
          <strong style="font-size:20px;">150 حالة</strong>
        </div>
        <div style="background:#eff6ff; padding:14px; border-radius:10px; border:1px solid #bfdbfe;">
          <p style="font-size:12px; font-weight:700; color:#1e40af;">
            تم التسليم وتوثيق الصور
          </p>
          <strong style="font-size:20px;">128 حالة</strong>
        </div>
        <div style="background:#fffbeb; padding:14px; border-radius:10px; border:1px solid #fde68a;">
          <p style="font-size:12px; font-weight:700; color:#92400e;">
            نطاق التغطية بمركز إهناسيا
          </p>
          <strong style="font-size:20px;">18 قرية وعزبة</strong>
        </div>
      </div>
      <div style="background:#f8fafc; padding:12px; border-radius:10px; border:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; font-size:13px;">
        <span><strong>HF-2026-1042</strong> | أسرة محمود سيد</span>
        <button onclick="alert('عرض الأوراق + صورة ما بعد التسليم')"
          class="action-btn">
          📄 الأوراق وصور التسليم
        </button>
      </div>
    </div>`;
}
function renderAdminDash(container, profile) {
  container.innerHTML = `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:12px; margin-bottom:16px;">
        <div>
          <h3 style="text-align:right; font-size:18px; margin:0;">
            غرفة العمليات والإدارة العليا
          </h3>
          <p style="font-size:12px; color:#64748b;">
            الحوكمة، الاعتمادات، منع الازدواجية، والمخزون
          </p>
        </div>
        <button onclick="location.reload()" class="nav-btn btn-dark">
          خروج
        </button>
      </div>
      <div class="grid-4" style="margin-bottom:16px; text-align:center;">
        <div style="background:#ecfdf5; padding:10px; border-radius:10px;">
          <p style="font-size:12px;">طلبات جديدة</p>
          <strong>34</strong>
        </div>
        <div style="background:#fffbeb; padding:10px; border-radius:10px;">
          <p style="font-size:12px;">اعتماد حسابات</p>
          <strong>5</strong>
        </div>
        <div style="background:#eff6ff; padding:10px; border-radius:10px;">
          <p style="font-size:12px;">المخزون والعهدة</p>
          <strong>120</strong>
        </div>
        <div style="background:#fef2f2; padding:10px; border-radius:10px;">
          <p style="font-size:12px;">تظلمات سرية</p>
          <strong>2</strong>
        </div>
      </div>
      <div style="background:#fffbeb; border:1px solid #fde68a; padding:12px; border-radius:10px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; font-size:13px;">
        <span>🔔 <strong>طلب انضمام:</strong> جمعية البر بقرية قاي تنتظر الاعتماد.</span>
        <button onclick="alert('✅ تم اعتماد الحساب وإرسال كلمة المرور المؤقتة')"
          class="action-btn">
          اعتماد وتوليد باسورد
        </button>
      </div>
      <button onclick="exportCSV('التقرير_الشامل_لمؤسسة_الحافظ')"
        class="action-btn" style="background:#0f172a;">
        📥 تصدير الكشف الشامل لجميع الحالات (Excel)
      </button>
    </div>`;
}

function renderFieldDash(container, profile, role) {
  const title = role === 'researcher'
    ? 'لوحة الباحث الميداني'
    : 'بوابة المتطوعين ولوحة الشرف';
  container.innerHTML = `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:12px; margin-bottom:14px;">
        <h3 style="text-align:right; font-size:18px; margin:0;">${title}</h3>
        <button onclick="location.reload()" class="nav-btn btn-dark">
          خروج
        </button>
      </div>
      <p style="font-size:13px; margin-bottom:14px;">
        مرحباً: <strong>${profile.full_name}</strong> | التقييم: ⭐⭐⭐⭐⭐
      </p>
      <div style="background:#f8fafc; padding:12px; border-radius:10px; border:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; font-size:13px;">
        <span>المهام والحالات المسندة إليك في مركز إهناسيا</span>
        <button onclick="alert('تم فتح نموذج التقييم الميداني وتوثيق التسليم')"
          class="action-btn">
          فتح السجل
        </button>
      </div>
    </div>`;
}

function openPartnerRegister() {
  document.getElementById('login-box').classList.add('hidden');
  const box = document.getElementById('partner-register-box');
  box.classList.remove('hidden');
  box.innerHTML = `
    <h3 style="font-size:18px; margin-bottom:6px;">
      طلب انضمام لمنظومة مؤسسة الحافظ
    </h3>
    <p style="font-size:12px; color:#64748b; text-align:center; margin-bottom:14px;">
      يُفعّل الحساب ويُرسل الباسورد المؤقت بعد اعتماد الإدارة.
    </p>
    <select id="reg-role">
      <option value="grassroots_partner">جمعية قاعدية شريكة (قرى وعزب)</option>
      <option value="donor_partner">مؤسسة كبرى مانحة (بروتوكول تعاون)</option>
      <option value="researcher">باحث ميداني</option>
      <option value="volunteer">متطوع</option>
    </select>
    <input id="reg-name" placeholder="الاسم الكامل / اسم الجمعية ورقم الإشهار">
    <input id="reg-phone" placeholder="رقم الموبايل / واتساب">
    <input id="reg-email" placeholder="البريد الإلكتروني">
    <button onclick="submitPartnerReq()" class="action-btn"
      style="width:100%; margin-bottom:8px;">
      إرسال طلب الاعتماد للإدارة
    </button>
    <button onclick="location.reload()" class="nav-btn" style="width:100%;">
      رجوع
    </button>`;
}

function submitPartnerReq() {
  alert('✅ تم استلام طلب الانضمام بنجاح؛ ستقوم الإدارة بمراجعته وإرسال الباسورد.');
  location.reload();
}

function filterCases(type) {
  alert('تم تصفية الجدول لعرض: ' + type);
}

function exportCSV(filename) {
  const csv = "\uFEFF"
    + "كود الطلب,اسم العائل,القرية,نوع المساعدة,الحالة\n"
    + "HF-2026-1042,محمود سيد عبدالرحمن,منشأة عبدالصمد,تجهيز عروسة,مقبولة\n"
    + "HF-2026-1089,فاطمة حسن علي,العواونة,وصلة مياه,تحت الفحص\n";
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename + ".csv";
  link.click();
}
