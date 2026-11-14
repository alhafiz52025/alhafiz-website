async function loginUser() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value;
  if (!email || !pass) return alert('أدخل البريد الإلكتروني وكلمة المرور.');

  if (!db) {
    const choice = prompt(
      "وضع المعاينة: اختر رقم اللوحة لتجربتها:\n" +
      "1 - الإدارة العليا\n" +
      "2 - الجمعيات القاعدية الشريكة\n" +
      "3 - المؤسسات الكبرى المانحة\n" +
      "4 - الباحث الميداني\n" +
      "5 - المتطوع"
    );
    const map = {
      '1': 'admin',
      '2': 'grassroots_partner',
      '3': 'donor_partner',
      '4': 'researcher',
      '5': 'volunteer'
    };
    if (map[choice]) {
      document.getElementById('login-box').classList.add('hidden');
      renderRoleDashboard(map[choice], { full_name: 'حساب معتمد' });
    }
    return;
  }

  const res = await db.auth.signInWithPassword({ email, password: pass });
  if (res.error) return alert('خطأ في الدخول: ' + res.error.message);

  const profRes = await db
    .from('users_profiles')
    .select('*')
    .eq('id', res.data.user.id)
    .single();

  const prof = profRes.data;
  if (!prof || prof.account_status !== 'approved') {
    await db.auth.signOut();
    return alert('حسابك ما زال بانتظار اعتماد إدارة مؤسسة الحافظ.');
  }

  if (prof.must_change_password) {
    const newPass = prompt('لأمان حسابك، اكتب كلمة مرور جديدة (6 أحرف على الأقل):');
    if (newPass && newPass.length >= 6) {
      await db.auth.updateUser({ password: newPass });
      await db
        .from('users_profiles')
        .update({ must_change_password: false })
        .eq('id', prof.id);
      alert('تم تحديث كلمة المرور بنجاح.');
    } else {
      return alert('يجب تعيين كلمة مرور من 6 أحرف على الأقل.');
    }
  }

  document.getElementById('login-box').classList.add('hidden');
  renderRoleDashboard(prof.role, prof);
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
  if (!val) return alert('أدخل كود الطلب أو الرقم القومي');
  document.getElementById('track-result').innerHTML = `
    <div class="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
      <p class="font-bold text-emerald-950 text-sm mb-1">
        حالة الطلب (${val}): قيد الفحص والمراجعة الميدانية
      </p>
      <p class="text-slate-600">
        تم استلام بيانات الأسرة بنجاح وجارٍ متابعتها من لجنة البحث بمركز إهناسيا.
      </p>
    </div>`;
}

async function submitGrievance() {
  const phone = document.getElementById('grievance-phone').value;
  const details = document.getElementById('grievance-details').value;
  if (!phone || !details) return alert('أكمل رقم الهاتف والتفاصيل');
  if (db) {
    await db.from('grievances').insert([{
      complaint_type: document.getElementById('grievance-type').value,
      phone: phone,
      details: details
    }]);
  }
  alert('تم إرسال رسالتك بسرية تامة إلى لجنة الحوكمة ورئيس مجلس الإدارة.');
  showSection('home');
}
function renderGrassrootsDash(container, profile) {
  container.innerHTML = `
    <div class="bg-white rounded-2xl shadow-md border overflow-hidden">
      <div class="emerald-gradient text-white p-5 flex justify-between items-center">
        <div>
          <h2 class="font-extrabold text-lg">بوابة الجمعيات القاعدية الشريكة</h2>
          <p class="text-xs text-emerald-100">
            مرحباً: ${profile.full_name} | التقييم: ⭐⭐⭐⭐⭐
          </p>
        </div>
        <button onclick="location.reload()" 
          class="bg-white/20 px-4 py-1.5 rounded-lg text-xs font-bold">
          خروج
        </button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-4">
        <aside class="bg-slate-50 border-l p-4 space-y-2">
          <button onclick="showSection('apply')" 
            class="w-full text-right bg-emerald-700 text-white font-bold px-3 py-2.5 rounded-xl text-xs">
            + تسجيل أسرة جديدة
          </button>
          <button onclick="filterCases('all')" 
            class="w-full text-right hover:bg-emerald-50 font-bold px-3 py-2 rounded-xl text-xs">
            📋 إجمالي الأسر المسجلة
          </button>
          <button onclick="filterCases('review')" 
            class="w-full text-right hover:bg-amber-50 font-bold px-3 py-2 rounded-xl text-xs text-amber-800">
            ⏳ حالات تحت الفحص
          </button>
          <button onclick="filterCases('approved')" 
            class="w-full text-right hover:bg-green-50 font-bold px-3 py-2 rounded-xl text-xs text-green-800">
            ✅ حالات مقبولة ومعتمدة
          </button>
          <button onclick="filterCases('rejected')" 
            class="w-full text-right hover:bg-red-50 font-bold px-3 py-2 rounded-xl text-xs text-red-800">
            ❌ حالات مرفوضة بأسبابها
          </button>
          <hr class="my-2">
          <button onclick="exportCSV('تقرير_الجمعية_الشريكة')" 
            class="w-full text-right bg-slate-900 text-white font-bold px-3 py-2 rounded-xl text-xs">
            📥 تحميل التقارير (Excel)
          </button>
        </aside>
        <div class="md:col-span-3 p-5">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5 text-center text-xs">
            <div class="bg-slate-50 p-3 rounded-xl border font-bold">المقدم<br><span class="text-lg">42</span></div>
            <div class="bg-amber-50 p-3 rounded-xl border font-bold text-amber-800">تحت الفحص<br><span class="text-lg">11</span></div>
            <div class="bg-emerald-50 p-3 rounded-xl border font-bold text-emerald-800">مقبولة<br><span class="text-lg">27</span></div>
            <div class="bg-red-50 p-3 rounded-xl border font-bold text-red-800">مرفوضة<br><span class="text-lg">4</span></div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-xs text-right border">
              <thead class="bg-slate-100">
                <tr>
                  <th class="p-2">الكود</th>
                  <th class="p-2">اسم العائل</th>
                  <th class="p-2">القرية</th>
                  <th class="p-2">المساعدة</th>
                  <th class="p-2">الحالة والسبب</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr>
                  <td class="p-2 font-bold">HF-2026-1042</td>
                  <td class="p-2">محمود سيد عبدالرحمن</td>
                  <td class="p-2">منشأة عبدالصمد</td>
                  <td class="p-2">تجهيز عروسة</td>
                  <td class="p-2 text-emerald-700 font-bold">مقبولة ومعتمدة</td>
                </tr>
                <tr>
                  <td class="p-2 font-bold">HF-2026-1015</td>
                  <td class="p-2">أحمد كامل إبراهيم</td>
                  <td class="p-2">قاي</td>
                  <td class="p-2">كفالة أيتام</td>
                  <td class="p-2 text-red-700 font-bold">مرفوضة: مكررة بجمعية أخرى</td>
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
    <div class="bg-white rounded-2xl shadow-md border p-6">
      <div class="flex justify-between items-center border-b pb-4 mb-5">
        <div>
          <span class="bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
            بروتوكول تعاون ورقابة
          </span>
          <h2 class="text-lg font-extrabold text-slate-900 mt-1">
            لوحة المؤسسات الكبرى المانحة
          </h2>
        </div>
        <div class="flex gap-2">
          <button onclick="exportCSV('تقرير_المؤسسة_المانحة')" 
            class="bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold">
            📥 تصدير الكشف
          </button>
          <button onclick="location.reload()" 
            class="bg-slate-200 px-4 py-2 rounded-xl text-xs font-bold">
            خروج
          </button>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5 text-xs">
        <div class="bg-emerald-50 p-4 rounded-xl border font-bold">
          حالات البروتوكول الممولة<br><span class="text-xl text-emerald-950">150 حالة</span>
        </div>
        <div class="bg-blue-50 p-4 rounded-xl border font-bold">
          تم التسليم وتوثيق الصور<br><span class="text-xl text-blue-950">128 حالة</span>
        </div>
        <div class="bg-amber-50 p-4 rounded-xl border font-bold">
          نطاق التغطية بمركز إهناسيا<br><span class="text-xl text-amber-950">18 قرية وعزبة</span>
        </div>
      </div>
      <div class="border rounded-xl p-4 bg-slate-50 text-xs flex justify-between items-center">
        <span><strong>HF-2026-1042</strong> | أسرة محمود سيد (منشأة عبدالصمد)</span>
        <button onclick="alert('عرض صورة البطاقة + البحث الميداني + صورة ما بعد التسليم')" 
          class="bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold">
          📄 الأوراق وصور التسليم
        </button>
      </div>
    </div>`;
}
function renderAdminDash(container, profile) {
  container.innerHTML = `
    <div class="bg-white rounded-2xl shadow-md border p-6">
      <div class="flex justify-between items-center border-b pb-4 mb-5">
        <div>
          <h2 class="text-lg font-extrabold text-emerald-950">
            غرفة العمليات والإدارة العليا - مؤسسة الحافظ
          </h2>
          <p class="text-xs text-slate-500">
            الحوكمة، الاعتمادات، منع الازدواجية، المخزون، والتظلمات السرية
          </p>
        </div>
        <button onclick="location.reload()" 
          class="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold">
          خروج
        </button>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-2 mb-5 text-center text-xs">
        <div class="bg-emerald-50 p-3 rounded-xl border font-bold">طلبات جديدة<br><span class="text-lg">34</span></div>
        <div class="bg-amber-50 p-3 rounded-xl border font-bold">اعتماد حسابات<br><span class="text-lg">5</span></div>
        <div class="bg-blue-50 p-3 rounded-xl border font-bold">المخزون والعهدة<br><span class="text-lg">120</span></div>
        <div class="bg-red-50 p-3 rounded-xl border font-bold">تظلمات سرية<br><span class="text-lg">2</span></div>
        <div class="bg-slate-100 p-3 rounded-xl border font-bold">سجل الرقابة<br><span class="text-lg">نشط</span></div>
      </div>
      <div class="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-4 flex flex-wrap justify-between items-center gap-2 text-xs">
        <span>🔔 <strong>طلب انضمام:</strong> جمعية البر بقرية قاي تنتظر اعتماد الإدارة.</span>
        <button onclick="alert('تم اعتماد الحساب وإرسال كلمة المرور المؤقتة لتغييرها عند الدخول')" 
          class="bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold">
          اعتماد الحساب وتوليد باسورد
        </button>
      </div>
      <button onclick="exportCSV('التقرير_الشامل_لمؤسسة_الحافظ')" 
        class="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold">
        📥 تصدير الكشف الشامل لجميع الحالات (Excel)
      </button>
    </div>`;
}

function renderFieldDash(container, profile, role) {
  const title = role === 'researcher' ? 'لوحة الباحث الميداني' : 'بوابة المتطوعين ولوحة الشرف';
  container.innerHTML = `
    <div class="bg-white rounded-2xl shadow-md border p-6">
      <div class="flex justify-between items-center border-b pb-4 mb-4">
        <h2 class="text-lg font-extrabold text-emerald-900">${title}</h2>
        <button onclick="location.reload()" class="bg-slate-200 px-4 py-1.5 rounded-lg text-xs font-bold">خروج</button>
      </div>
      <p class="text-xs text-slate-600 mb-4">
        مرحباً: <strong>${profile.full_name}</strong> | التقييم: <strong>متميز ⭐⭐⭐⭐⭐</strong>
      </p>
      <div class="p-4 border rounded-xl bg-slate-50 text-xs flex justify-between items-center">
        <span>المهام والحالات المسندة إليك في مركز إهناسيا</span>
        <button onclick="alert('تم فتح نموذج التقييم الميداني وتوثيق ما بعد التسليم')" 
          class="bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold">
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
    <h3 class="text-lg font-extrabold text-emerald-900 mb-2">طلب انضمام لمنظومة مؤسسة الحافظ</h3>
    <p class="text-xs text-slate-500 mb-4">يُفعّل الحساب ويُرسل الباسورد المؤقت بعد مراجعة واعتماد الإدارة.</p>
    <select id="reg-role" class="w-full border p-2.5 rounded-xl text-xs font-bold mb-2">
      <option value="grassroots_partner">جمعية قاعدية شريكة (قرى وعزب)</option>
      <option value="donor_partner">مؤسسة كبرى مانحة (بروتوكول تعاون)</option>
      <option value="researcher">باحث ميداني</option>
      <option value="volunteer">متطوع</option>
    </select>
    <input id="reg-name" placeholder="الاسم الكامل / اسم الجمعية ورقم الإشهار" class="w-full border p-2.5 rounded-xl text-xs mb-2">
    <input id="reg-phone" placeholder="رقم الموبايل / واتساب" class="w-full border p-2.5 rounded-xl text-xs mb-2">
    <input id="reg-email" placeholder="البريد الإلكتروني" class="w-full border p-2.5 rounded-xl text-xs mb-4">
    <button onclick="submitPartnerReq()" class="w-full bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs mb-2">
      إرسال طلب الاعتماد للإدارة
    </button>
    <button onclick="location.reload()" class="w-full text-xs text-slate-500">رجوع</button>`;
}

function submitPartnerReq() {
  alert('تم استلام طلب الانضمام بنجاح؛ ستقوم إدارة مؤسسة الحافظ بمراجعته وإرسال كلمة المرور المؤقتة.');
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
