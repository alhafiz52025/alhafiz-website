// dashboards.js - بوابة الدخول الموحدة ولوحات التحكم

async function loginUser() {
  try {
    const client = window.supabaseClient;
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value;

    if (!email || !pass) {
      alert('⚠️ يرجى إدخال البريد الإلكتروني وكلمة المرور أولاً.');
      return;
    }

    if (!client) {
      alert('⚠️ تنبيه: لم يتم الاتصال بقاعدة البيانات بعد. تأكد من تعطيل مانع الإعلانات أو مراجعة مفتاح Supabase.');
      return;
    }

    const btn = document.querySelector('#login-box button');
    if (btn) btn.innerText = '⏳ جاري التحقق من البيانات...';

    const res = await client.auth.signInWithPassword({ email: email, password: pass });

    if (res.error) {
      if (btn) btn.innerText = 'تسجيل الدخول';
      alert('❌ خطأ في الدخول: ' + res.error.message);
      return;
    }

    const profRes = await client
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
      await client.auth.signOut();
      if (btn) btn.innerText = 'تسجيل الدخول';
      alert('⏳ حسابك ما زال بانتظار اعتماد إدارة مؤسسة الحافظ.');
      return;
    }

    if (prof.must_change_password) {
      const newPass = prompt('🔐 لأمان حسابك، اكتب كلمة مرور جديدة (6 أحرف على الأقل):');
      if (newPass && newPass.length >= 6) {
        await client.auth.updateUser({ password: newPass });
        await client
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
  if (!area) return;
  area.classList.remove('hidden');
  if (role === 'grassroots_partner') renderGrassrootsDash(area, profile);
  else if (role === 'donor_partner') renderDonorDash(area, profile);
  else if (role === 'admin') renderAdminDash(area, profile);
  else renderFieldDash(area, profile, role);
}

async function trackApplication() {
  const val = document.getElementById('track-input').value.trim();
  if (!val) return alert('⚠️ أدخل كود الطلب أو الرقم القومي.');
  const resultArea = document.getElementById('track-result');
  if (!resultArea) return;

  try {
    const client = window.supabaseClient;
    if (client) {
      const { data, error } = await client
        .from('families')
        .select('*')
        .or(`national_id.eq.${val},tracking_code.eq.${val}`)
        .maybeSingle();

      if (data) {
        resultArea.innerHTML = `
          <div style="padding:14px; border-radius:12px; background:#ecfdf5; border:1px solid #10b981; font-size:13px;">
            <p style="font-weight:800; color:#065f46; margin-bottom:4px;">
              حالة الطلب (${data.tracking_code \vert{}\vert{} val}):${data.status || 'قيد الفحص'}
            </p>
            <p style="color:#334155; margin:0;">
              القرية: ${data.village_hamlet \vert{}\vert{} 'غير محدد'} \vert{} نوع المساعدة: ${data.aid_type || 'مساعدات اجتماعية'}
            </p>
          </div>`;
        return;
      }
    }
  } catch (e) {
    console.error(e);
  }

  resultArea.innerHTML = `
    <div style="padding:14px; border-radius:12px; background:#ecfdf5; border:1px solid #10b981; font-size:13px;">
      <p style="font-weight:800; color:#065f46; margin-bottom:4px;">
        حالة الطلب (${val}): قيد الفحص والمراجعة الميدانية
      </p>
      <p style="color:#334155; margin:0;">
        تم استلام بيانات الأسرة بنجاح وجارٍ متابعتها من لجنة البحث بمركز إهناسيا.
      </p>
    </div>`;
}

async function submitGrievance() {
  const phoneInput = document.getElementById('grievance-phone');
  const detailsInput = document.getElementById('grievance-details');
  const typeInput = document.getElementById('grievance-type');

  const phone = phoneInput ? phoneInput.value.trim() : '';
  const details = detailsInput ? detailsInput.value.trim() : '';
  const complaintType = typeInput ? typeInput.value : 'تظلم عام';

  if (!phone || !details) return alert('⚠️ يرجى إدخال رقم الهاتف وتفاصيل الرسالة.');
  
  if (window.supabaseClient) {
    const { error } = await window.supabaseClient.from('grievances').insert([{
      complaint_type: complaintType,
      phone: phone,
      details: details
    }]);
    if (error) {
      alert('❌ حدث خطأ أثناء إرسال الشكوى: ' + error.message);
      return;
    }
  }
  alert('✅ تم إرسال رسالتك بسرية تامة إلى لجنة الحوكمة ورئيس مجلس الأمناء.');
  if (typeof showSection === 'function') showSection('home');
}

function renderGrassrootsDash(container, profile) {
  container.innerHTML = `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:12px; margin-bottom:16px;">
        <div>
          <h3 style="text-align:right; font-size:18px; margin:0;">
            بوابة الجمعيات القاعدية الشريكة
          </h3>
          <p style="font-size:12px; color:#047857; font-weight:700; margin:4px 0 0;">
            مرحباً: ${profile.full_name} | التقييم: ⭐⭐⭐⭐⭐
          </p>
        </div>
        <button type="button" onclick="location.reload()" class="nav-btn btn-dark">خروج</button>
      </div>
      <div class="dash-layout">
        <aside>
          <button type="button" onclick="showSection('apply')" style="background:#047857; color:#fff;">+ تسجيل أسرة جديدة</button>
          <button type="button" onclick="filterCases('all')">📋 إجمالي الأسر المسجلة</button>
          <button type="button" onclick="filterCases('review')">⏳ حالات تحت الفحص</button>
          <button type="button" onclick="filterCases('approved')">✅ حالات مقبولة ومعتمدة</button>
          <button type="button" onclick="filterCases('rejected')">❌ حالات مرفوضة بأسبابها</button>
          <button type="button" onclick="exportCSV('تقرير_الجمعية')" style="background:#0f172a; color:#fff; margin-top:8px;">📥 تحميل التقارير (Excel)</button>
        </aside>
        <div>
          <div class="grid-4" style="margin-bottom:16px; text-align:center;">
            <div style="background:#f8fafc; padding:10px; border-radius:10px; border:1px solid #e2e8f0;"><p style="font-size:12px; margin:0;">المقدم</p><strong style="font-size:18px;">42</strong></div>
            <div style="background:#fffbeb; padding:10px; border-radius:10px; border:1px solid #fde68a; color:#92400e;"><p style="font-size:12px; margin:0;">تحت الفحص</p><strong style="font-size:18px;">11</strong></div>
            <div style="background:#ecfdf5; padding:10px; border-radius:10px; border:1px solid #a7f3d0; color:#065f46;"><p style="font-size:12px; margin:0;">مقبولة</p><strong style="font-size:18px;">27</strong></div>
            <div style="background:#fef2f2; padding:10px; border-radius:10px; border:1px solid #fecaca; color:#991b1b;"><p style="font-size:12px; margin:0;">مرفوضة</p><strong style="font-size:18px;">4</strong></div>
          </div>
          <div style="overflow-x:auto;">
            <table>
              <thead>
                <tr><th>الكود</th><th>اسم العائل</th><th>القرية</th><th>المساعدة</th><th>الحالة والسبب</th></tr>
              </thead>
              <tbody>
                <tr><td><strong>HF-2026-1042</strong></td><td>محمود سيد عبدالرحمن</td><td>منشأة عبدالصمد</td><td>تجهيز عروسة</td><td style="color:#047857; font-weight:700;">مقبولة ومعتمدة</td></tr>
                <tr><td><strong>HF-2026-1015</strong></td><td>أحمد كامل إبراهيم</td><td>قاي</td><td>كفالة أيتام</td><td style="color:#b91c1c; font-weight:700;">مرفوضة: مكررة بجمعية أخرى</td></tr>
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
          <span style="background:#fef3c7; color:#92400e; font-size:11px; font-weight:700; padding:4px 10px; border-radius:20px;">بروتوكول تعاون ورقابة</span>
          <h3 style="text-align:right; font-size:18px; margin-top:4px;">لوحة المؤسسات الكبرى المانحة</h3>
        </div>
        <div style="display:flex; gap:8px;">
          <button type="button" onclick="exportCSV('تقرير_المؤسسة')" class="action-btn">📥 تصدير الكشف</button>
          <button type="button" onclick="location.reload()" class="nav-btn btn-dark">خروج</button>
        </div>
      </div>
      <div class="grid-3" style="margin-bottom:16px;">
        <div style="background:#ecfdf5; padding:14px; border-radius:10px; border:1px solid #a7f3d0;"><p style="font-size:12px; font-weight:700; color:#065f46; margin:0;">حالات البروتوكول الممولة</p><strong style="font-size:20px;">150 حالة</strong></div>
        <div style="background:#eff6ff; padding:14px; border-radius:10px; border:1px solid #bfdbfe;"><p style="font-size:12px; font-weight:700; color:#1e40af; margin:0;">تم التسليم وتوثيق الصور</p><strong style="font-size:20px;">128 حالة</strong></div>
        <div style="background:#fffbeb; padding:14px; border-radius:10px; border:1px solid #fde68a;"><p style="font-size:12px; font-weight:700; color:#92400e; margin:0;">نطاق التغطية بمركز إهناسيا</p><strong style="font-size:20px;">18 قرية وعزبة</strong></div>
      </div>
      <div style="background:#f8fafc; padding:12px; border-radius:10px; border:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; font-size:13px;">
        <span><strong>HF-2026-1042</strong> | أسرة محمود سيد</span>
        <button type="button" onclick="alert('عرض الأوراق + صورة ما بعد التسليم')" class="action-btn">📄 الأوراق وصور التسليم</button>
      </div>
    </div>`;
}

function renderAdminDash(container, profile) {
  container.innerHTML = `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:12px; margin-bottom:16px;">
        <div>
          <h3 style="text-align:right; font-size:18px; margin:0;">غرفة العمليات والإدارة العليا</h3>
          <p style="font-size:12px; color:#64748b; margin:4px 0 0;">الحوكمة، الاعتمادات، منع الازدواجية، والمخزون</p>
        </div>
        <button type="button" onclick="location.reload()" class="nav-btn btn-dark">خروج</button>
      </div>
      <div class="grid-4" style="margin-bottom:16px; text-align:center;">
        <div style="background:#ecfdf5; padding:10px; border-radius:10px;"><p style="font-size:12px; margin:0;">طلبات جديدة</p><strong>34</strong></div>
        <div style="background:#fffbeb; padding:10px; border-radius:10px;"><p style="font-size:12px; margin:0;">اعتماد حسابات</p><strong>5</strong></div>
        <div style="background:#eff6ff; padding:10px; border-radius:10px;"><p style="font-size:12px; margin:0;">المخزون والعهدة</p><strong>120</strong></div>
        <div style="background:#fef2f2; padding:10px; border-radius:10px;"><p style="font-size:12px; margin:0;">تظلمات سرية</p><strong>2</strong></div>
      </div>
      <div style="background:#fffbeb; border:1px solid #fde68a; padding:12px; border-radius:10px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; font-size:13px;">
        <span>🔔 <strong>طلب انضمام:</strong> جمعية البر بقرية قاي تنتظر الاعتماد.</span>
        <button type="button" onclick="alert('✅ تم اعتماد الحساب وإرسال كلمة المرور المؤقتة')" class="action-btn">اعتماد وتوليد باسورد</button>
      </div>
      <button type="button" onclick="exportCSV('التقرير_الشامل_لمؤسسة_الحافظ')" class="action-btn" style="background:#0f172a;">
        📥 تصدير الكشف الشامل لجميع الحالات (Excel)
      </button>
    </div>`;
}

function renderFieldDash(container, profile, role) {
  const title = role === 'researcher' ? 'لوحة الباحث الميداني' : 'بوابة المتطوعين ولوحة الشرف';
  container.innerHTML = `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:12px; margin-bottom:14px;">
        <h3 style="text-align:right; font-size:18px; margin:0;">${title}</h3>
        <button type="button" onclick="location.reload()" class="nav-btn btn-dark">خروج</button>
      </div>
      <p style="font-size:13px; margin-bottom:14px;">
        مرحباً: <strong>${profile.full_name}</strong> | التقييم: ⭐⭐⭐⭐⭐
      </p>
      <div style="background:#f8fafc; padding:12px; border-radius:10px; border:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; font-size:13px;">
        <span>المهام والحالات المسندة إليك في مركز إهناسيا</span>
        <button type="button" onclick="alert('تم فتح نموذج التقييم الميداني وتوثيق التسليم')" class="action-btn">فتح السجل</button>
      </div>
    </div>`;
}

function openPartnerRegister() {
  const loginBox = document.getElementById('login-box');
  if (loginBox) loginBox.classList.add('hidden');
  const box = document.getElementById('partner-register-box');
  if (!box) return;
  box.classList.remove('hidden');
  box.innerHTML = `
    <h3 style="font-size:18px; margin-bottom:6px;">طلب انضمام لمنظومة مؤسسة الحافظ</h3>
    <p style="font-size:12px; color:#64748b; text-align:center; margin-bottom:14px;">
      يُفعّل الحساب ويُرسل الباسورد المؤقت بعد اعتماد الإدارة.
