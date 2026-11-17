// dashboards.js - لوحة التحكم الإدارية الشاملة لمؤسسة الحافظ

window.renderAdminDashboard = async function(userRole, userEmail) {
  const dashArea = document.getElementById('dashboard-area');
  if (!dashArea) return;

  dashArea.innerHTML = `
    <div class="card" style="border-top: 4px solid var(--primary);">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:20px; border-bottom:1px solid #e2e8f0; padding-bottom:12px;">
        <div>
          <h3 style="color: var(--primary-dark); margin: 0;">🛡️ غرفة العمليات ولوحة التحكم الإدارية</h3>
          <p style="font-size:13px; color:#64748b; margin:4px 0 0;">مرحباً بك (${userEmail}) - الصلاحية: <strong>${userRole}</strong></p>
        </div>
        <button type="button" onclick="location.reload()" class="action-btn" style="background:#ef4444; font-size:12px; padding:6px 12px;">تسجيل الخروج</button>
      </div>

      <!-- تبويبات التحكم -->
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:20px;">
        <button type="button" onclick="switchAdminTab('cases')" class="nav-btn btn-primary" id="tab-btn-cases">📂 إدارة الحالات والبحوث</button>
        <button type="button" onclick="switchAdminTab('users')" class="nav-btn" id="tab-btn-users">👥 الأعضاء والباحثون والشركاء</button>
        <button type="button" onclick="switchAdminTab('achievements')" class="nav-btn" id="tab-btn-achievements">🏆 إدارة الإنجازات والمعرض</button>
        <button type="button" onclick="switchAdminTab('grievances')" class="nav-btn" id="tab-btn-grievances">⚖️ التظلمات والرقابة</button>
      </div>

      <!-- محتوى التبويبات -->
      <div id="admin-tab-content">
        <div style="text-align:center; padding:30px; color:#64748b;">جارٍ تحميل بيانات المنظومة...</div>
      </div>
    </div>
  `;

  // تحميل القسم الافتراضي (الحالات)
  window.switchAdminTab('cases');
};

window.switchAdminTab = async function(tabName) {
  // تحديث شكل الأزرار
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
          <td><span style="background:#e2e8f0; padding:2px 6px; border-radius:4px; font-size:11px;">${f.source_type || 'مواطن'}</span></td>
          <td>
            <select onchange="assignCase('${f.id}', this.value)" style="padding:4px; font-size:12px;">
              <option value="غير مسند" ${f.assigned_to === 'غير مسند' ? 'selected' : ''}>-- غير مسند --</option>
              <option value="أ. نجم الدين حسين" ${f.assigned_to === 'أ. نجم الدين حسين' ? 'selected' : ''}>أ. نجم الدين حسين</option>
              <option value="باحث ميداني 1" ${f.assigned_to === 'باحث ميداني 1' ? 'selected' : ''}>باحث ميداني 1</option>
              <option value="باحث ميداني 2" ${f.assigned_to === 'باحث ميداني 2' ? 'selected' : ''}>باحث ميداني 2</option>
            </select>
          </td>
          <td>
            <select onchange="updateCaseDecision('${f.id}', this.value)" style="padding:4px; font-size:12px; font-weight:700;">
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
      const { data, error } = await window.supabaseClient.from('users').select('*').order('created_at', { ascending: false });
      if (!error) users = data || [];
    }

    let html = `
      <h4 style="color:var(--primary-dark);">إدارة المستخدمين، الباحثين، والمتطوعين والجهات الشريكة</h4>
      <p style="font-size:13px; color:#64748b;">الموافقة على طلبات التسجيل الجديدة وتحديد الصلاحيات والمسميات.</p>
    `;

    if (users.length === 0) {
      html += `<div style="padding:20px; text-align:center; background:#f8fafc; border-radius:8px; margin-top:10px;">لا توجد طلبات انضمام أو أعضاء مسجلين حالياً في جدول المستخدمين.</div>`;
    } else {
      html += `<table><thead><tr><th>الاسم الكامل</th><th>البريد الإلكتروني</th><th>الدور / الصلاحية</th><th>الحالة</th><th>الإجراءات</th></tr></thead><tbody>`;
      users.forEach(u => {
        html += `
          <tr>
            <td><strong>${u.full_name}</strong><br><span style="font-size:11px;">هاتف: ${u.phone || 'غير متوفر'}</span></td>
            <td>${u.email}</td>
            <td>
              <select onchange="updateUserRole('${u.id}', this.value)" style="padding:4px; font-size:12px;">
                <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>مدير النظام (Admin)</option>
                <option value="researcher" ${u.role === 'researcher' ? 'selected' : ''}>باحث ميداني</option>
                <option value="volunteer" ${u.role === 'volunteer' ? 'selected' : ''}>متطوع</option>
                <option value="partner" ${u.role === 'partner' ? 'selected' : ''}>جهة شريكة / مانحة</option>
              </select>
            </td>
            <td>
              <select onchange="updateUserStatus('${u.id}', this.value)" style="padding:4px; font-size:12px; font-weight:700;">
                <option value="pending" ${u.status === 'pending' ? 'selected' : ''}>⏳ معلق (انتظار الموافقة)</option>
                <option value="active" ${u.status === 'active' ? 'selected' : ''}>✅ مقبول ومفعل</option>
                <option value="suspended" ${u.status === 'suspended' ? 'selected' : ''}>🚫 موقوف</option>
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
    contentArea.innerHTML = `
      <h4 style="color:var(--primary-dark);">سجل التظلمات والشكاوى والرقابة المجتمعية</h4>
      <div style="background:#fffbeb; border:1px solid #fde68a; padding:16px; border-radius:10px;">
        <p style="margin:0; font-size:14px; color:#92400e;">لا توجد تظلمات جديدة مسجلة حالياً. كافة الشكاوى ورسائل الدعم الفني تُراجع بسرية تامة وتُربط برئيس مجلس الأمناء.</p>
      </div>
    `;
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
    await window.supabaseClient.from('users').update({ role: role }).eq('id', id);
  }
};

window.updateUserStatus = async function(id, status) {
  if (window.supabaseClient) {
    await window.supabaseClient.from('users').update({ status: status }).eq('id', id);
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
      <div style="background:#fff; border:1px solid #cbd5e1; padding:12px; border-radius:8px;">
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

// ربط تسجيل الدخول الفعلي بجدول المستخدمين
window.loginUser = async function() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value.trim();

  if (!email || !pass) {
    alert('برجاء إدخال البريد الإلكتروني وكلمة المرور');
    return;
  }

  // حساب المدير الرئيسي الافتراضي للمؤسسة
  if (email === 'alhafiz52025@gmail.com' && pass === '22022025') {
    document.getElementById('login-box').classList.add('hidden');
    document.getElementById('dashboard-area').classList.remove('hidden');
    window.renderAdminDashboard('admin (رئيس مجلس الأمناء)', email);
    return;
  }

  // التحقق من جدول المستخدمين في Supabase
  if (window.supabaseClient) {
    const { data, error } = await window.supabaseClient.from('users').select('*').eq('email', email).single();
    if (error || !data) {
      alert('❌ البريد الإلكتروني غير مسجل أو بيانات الدخول غير صحيحة.');
      return;
    }

    if (data.status !== 'active') {
      alert('⏳ حسابك قيد المراجعة أو تم إيقافه مؤقتاً من قبل الإدارة.');
      return;
    }

    document.getElementById('login-box').classList.add('hidden');
    document.getElementById('dashboard-area').classList.remove('hidden');
    window.renderAdminDashboard(data.role, data.email);
  } else {
    alert('✅ تم الدخول بنجاح');
  }
};
// --- دوال الخدمات العامة المرتبطة بـ Supabase ---

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
      <div style="padding:14px; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:10px; margin-top:10px;">
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

  if (!roleSelect || !nameInput || !phoneInput || !emailInput) {
    alert('⚠️ حدث خطأ في تحميل حقول النموذج.');
    return;
  }

  const role = roleSelect.value;
  const full_name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const email = emailInput.value.trim();

  if (!full_name || !email || !phone) {
    alert('⚠️ يرجى يرجى استيفاء جميع الحقول الأساسية (الاسم، البريد، والهاتف).');
    return;
  }

  if (!window.supabaseClient) {
    alert('⚠️ تعذر الاتصال بقاعدة البيانات.');
    return;
  }

  // إرسال الطلب مباشرة إلى جدول users
  const { data, error } = await window.supabaseClient.from('users').insert([{
    full_name: full_name,
    email: email,
    phone: phone,
    role: role,
    status: 'pending' // معلق بانتظار موافقة الإدارة
  }]);

  if (error) {
    alert('❌ خطأ أثناء إرسال الطلب: ' + error.message);
  } else {
    alert('✅ تم إرسال طلب انضمامك بنجاح!\nحسابك الآن (قيد المراجعة) وسيتم تفعيله من قبل إدارة المؤسسة قريباً.');
    location.reload();
  }
};
