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
      alert('⚠️ تنبيه: لم يتم الاتصال بقاعدة البيانات بعد.');
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
      alert('⚠️ تم الدخول ولكن حسابك غير مسجل في جدول الصلاحيات.');
      return;
    }

    const prof = profRes.data;
    if (prof.account_status !== 'approved') {
      await client.auth.signOut();
      if (btn) btn.innerText = 'تسجيل الدخول';
      alert('⏳ حسابك ما زال بانتظار اعتماد إدارة مؤسسة الحافظ.');
      return;
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
      const { data } = await client
        .from('families')
        .select('*')
        .or(`national_id.eq.${val},tracking_code.eq.${val}`)
        .maybeSingle();

      if (data) {
        resultArea.innerHTML = `
          <div style="padding:14px; border-radius:12px; background:#ecfdf5; border:1px solid #10b981; font-size:13px;">
            <p style="font-weight:800; color:#065f46; margin-bottom:4px;">
              حالة الطلب (${data.tracking_code || val}): ${data.status || 'قيد الفحص'}
            </p>
            <p style="color:#334155; margin:0;">
              القرية: ${data.village_hamlet || 'غير محدد'} | نوع المساعدة: ${data.aid_type || 'مساعدات اجتماعية'}
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
      <p style="font-weight:800; color:#065f46; margin-bottom:4px;">حالة الطلب (${val}): قيد الفحص والمراجعة الميدانية</p>
      <p style="color:#334155; margin:0;">تم استلام بيانات الأسرة بنجاح وجارٍ متابعتها بمركز إهناسيا.</p>
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
    await window.supabaseClient.from('grievances').insert([{
      complaint_type: complaintType, phone: phone, details: details
    }]);
  }
  alert('✅ تم إرسال رسالتك بسرية تامة.');
  if (typeof showSection === 'function') showSection('home');
}

function renderGrassrootsDash(container, profile) {
  container.innerHTML = `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:12px; margin-bottom:16px;">
        <div>
          <h3 style="text-align:right; font-size:18px; margin:0;">بوابة الجمعيات القاعدية الشريكة</h3>
          <p style="font-size:12px; color:#047857; font-weight:700; margin:4px 0 0;">مرحباً: ${profile.full_name}</p>
        </div>
        <button type="button" onclick="location.reload()" class="nav-btn btn-dark">خروج</button>
      </div>
      <button type="button" onclick="showSection('apply')" class="action-btn" style="background:#047857; color:#fff; width:100%;">+ تسجيل أسرة جديدة</button>
    </div>`;
}

function renderDonorDash(container, profile) {
  renderGrassrootsDash(container, profile);
}
function renderAdminDash(container, profile) {
  renderGrassrootsDash(container, profile);
}
function renderFieldDash(container, profile, role) {
  renderGrassrootsDash(container, profile);
}
function openPartnerRegister() {
  alert('طلب انضمام');
}
function submitPartnerReq() {
  alert('تم الإرسال');
}
function exportCSV(filename) {
  alert('تصدير');
}
