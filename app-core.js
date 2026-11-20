    <!-- 8. اتصل بنا والتظلمات السرية -->
    <section id="section-contact" class="hidden">
      <div class="card">
        <h3 style="color: var(--primary-dark); margin-top: 0;" data-i18n="contactTitle">اتصل بنا والدعم الفني والتظلمات</h3>
        <div class="grid-2">
          <div>
            <h4>📍 بيانات المقرات والتواصل المباشر</h4>
            <p style="font-size: 13px;"><strong>المقر الرئيسي:</strong> منشأة عبد الصمد – مركز إهناسيا – بني سويف</p>
            <p style="font-size: 13px;"><strong>واتساب الرسمي:</strong> 01000880156 | <strong>البريد:</strong> alhafiz52025@gmail.com</p>
          </div>
          <div>
            <h4 data-i18n="grievanceTitle">⚖️ نموذج التظلمات السرية</h4>
            <select id="grievance-type">
              <option value="تظلم من رفض طلب مساعدة">تظلم من رفض طلب مساعدة</option>
              <option value="إبلاغ عن حالة غير مستحقة">إبلاغ عن حالة غير مستحقة (رقابة مجتمعية)</option>
              <option value="طلب دعم فني للمنصة">طلب دعم فني للمنصة</option>
            </select>
            <input id="grievance-name" data-i18n="grievanceNamePlaceholder" placeholder="الاسم كاملاً *">
            <input id="grievance-phone" maxlength="11" data-i18n="grievancePhonePlaceholder" placeholder="رقم الهاتف (11 رقم) *">
            <textarea id="grievance-details" rows="3" data-i18n="grievanceDetailsPlaceholder" placeholder="تفاصيل الرسالة أو التظلم بسرية تامة *"></textarea>
            <button type="button" onclick="submitGrievance()" class="action-btn" style="width: 100%;" data-i18n="grievanceSendBtn">إرسال الرسالة بسرية تامة</button>
          </div>
        </div>
      </div>
    </section>

    <!-- 9. سياسة الخصوصية و 10. بوابة الدخول -->
    <section id="section-privacy" class="hidden">
      <div class="card">
        <h3 style="color: var(--primary-dark); margin-top: 0;" data-i18n="privacyTitle">🔒 سياسة الخصوصية وحماية البيانات الشخصية</h3>
        <p style="font-size: 13px;">تُجمع البيانات لإجراء البحوث الاجتماعية ومنع ازدواجية الصرف، مع التعهد بعدم بيع أو إفشاء بيانات المستفيدين.</p>
      </div>
    </section>

    <section id="section-login" class="hidden">
      <div id="login-box" class="card" style="max-width: 440px; margin: 20px auto; text-align: center;">
        <h3 style="color: var(--primary-dark); margin-top: 0;" data-i18n="loginTitle">🔐 بوابة الدخول الموحدة</h3>
        <form autocomplete="off" onsubmit="event.preventDefault(); loginUser();">
          <input type="email" id="login-email" autocomplete="off" placeholder="البريد الإلكتروني المسجل">
          <input type="password" id="login-pass" autocomplete="new-password" placeholder="كلمة المرور أو الرمز المؤقت">
          <button type="submit" class="action-btn" style="width: 100%; margin-bottom: 10px;" data-i18n="loginBtn">تسجيل الدخول</button>
        </form>
        <button type="button" onclick="openPartnerRegister()" class="nav-btn" style="width: 100%;" data-i18n="partnerReqBtn">+ طلب انضمام جديد</button>
      </div>
    </section>
  </div>

  <footer>
    <div style="max-width: 1100px; margin: auto;" class="grid-3">
      <div>
        <h4 style="color: #fde68a; margin-top: 0;">مؤسسة الحافظ للتنمية والخدمات</h4>
        <p>مؤسسة أهلية تنموية مشهرة برقم 2202 لسنة 2025 بوزارة التضامن الاجتماعي.</p>
      </div>
    </div>
    <p style="text-align: center; border-top: 1px solid var(--primary); padding-top: 14px; margin-top: 16px;">
      © 2026 جميع الحقوق محفوظة لمؤسسة الحافظ للتنمية والخدمات
    </p>
  </footer>

  <script src="https://jsdelivr.net"></script>
  <script src="config.js"></script>
  <script src="egypt-data.js"></script>
  <script src="i18n.js"></script>
  <script src="app-core.js"></script>
  <script src="wizard.js"></script>
  <script src="dashboards.js"></script>
</body>
</html>
  window.addEventListener('DOMContentLoaded', () => {
    applyDynamicSiteStats();
    renderFaqList();
    window.renderPublicAnnouncements();
    window.renderPublicAchievements();
    if (window.currentUser && typeof window.routeLoggedInUser === 'function') {
      window.routeLoggedInUser(window.currentUser);
    }
  });

  window.showSection = function(sectionName) {
    document.querySelectorAll('.container > section').forEach(sec => sec.classList.add('hidden'));
    const target = document.getElementById('section-' + sectionName);
    if (target) {
      target.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (sectionName === 'apply' && typeof window.renderWizardStep === 'function') {
      window.renderWizardStep();
    } else if (sectionName === 'announcements') {
      window.renderPublicAnnouncements();
    } else if (sectionName === 'achievements') {
      window.renderPublicAchievements();
    } else if (sectionName === 'login' && window.currentUser && typeof window.routeLoggedInUser === 'function') {
      window.routeLoggedInUser(window.currentUser);
    }
    if (currentLang === 'en' && typeof window.translateDynamicContainer === 'function') {
      window.translateDynamicContainer(document.body, 'en');
    }
  };

  window.toggleLanguage = function() {
    currentLang = currentLang === 'ar' ? 'en' : 'ar';
    const root = document.getElementById('html-root') || document.documentElement;
    if (root) {
      root.lang = currentLang;
      root.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    }
    if (typeof window.applyLanguageDictionary === 'function') {
      window.applyLanguageDictionary(currentLang);
    }
  };

  window.adjustFontSize = function(delta) {
    currentFontScale = Math.min(130, Math.max(85, currentFontScale + delta * 5));
    document.body.style.fontSize = currentFontScale + '%';
  };

  window.toggleDarkMode = function() {
    document.body.classList.toggle('dark-mode');
  };

  window.copyText = function(txt) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(() => alert('✅ تم النسخ: ' + txt));
    } else {
      prompt('انسخ الرقم:', txt);
    }
  };

  function renderFaqList() {
    const box = document.getElementById('faq-dynamic-list');
    if (!box) return;
    const items = window.FAQ_ITEMS || [];
    box.innerHTML = items.map((item, idx) => `
      <div style="background: var(--bg-color); padding: 14px; border-radius: 10px; border: 1px solid var(--border);">
        <h4 style="color: var(--primary); margin: 0 0 6px;">${idx + 1}. ${window.escapeHtml(item.q)}</h4>
        <p style="margin: 0; font-size: 13px; line-height: 1.6;">${window.escapeHtml(item.a)}</p>
      </div>
    `).join('');
  }

  window.saveDraft = function() {
    localStorage.setItem('hf_wizard_draft', JSON.stringify({ step: window.currentStep || 1, data: window.formData || {} }));
    alert('💾 تم حفظ مسودة الاستمارة محلياً على جهازك.');
  };

  // --- التظلمات السرية ---
  window.submitGrievance = async function() {
    const type = document.getElementById('grievance-type')?.value || 'تظلم';
    const fullName = (document.getElementById('grievance-name')?.value || '').trim();
    const phone = (document.getElementById('grievance-phone')?.value || '').trim();
    const details = (document.getElementById('grievance-details')?.value || '').trim();

    if (!fullName || !/^01[0125]\d{8}$/.test(phone) || !details) {
      alert('⚠️ يرجى إدخال الاسم كاملاً، رقم هاتف صحيح (11 رقماً)، وتفاصيل الرسالة.');
      return;
    }

    const code = 'GRV-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
    if (window.supabaseClient) {
      const { error } = await window.supabaseClient.from('grievances').insert([{
        tracking_code: code, grievance_type: type, full_name: fullName,
        address_details: 'إهناسيا - بني سويف', phone, message_body: details, status: 'pending'
      }]);
      if (error) return alert('❌ خطأ أثناء الإرسال: ' + error.message);
    }

    const msg = `مؤسسة الحافظ للتنمية والخدمات (واتساب رسمي: 01000880156)\nتم استلام تظلمكم / رسالتكم بنجاح.\nرقم التظلم: ${code}\nسيتم الفحص والرد في أقرب وقت.`;
    if (typeof window.triggerInstantWhatsApp === 'function') window.triggerInstantWhatsApp(phone, msg);

    alert(`✅ تم إرسال رسالتكم بسرية تامة!\nرقم التظلم: ${code}`);
    ['grievance-name', 'grievance-phone', 'grievance-details'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  };

  // --- الاستعلام برقم الطلب المرسل على الواتساب فقط (البند 6) ---
  window.trackApplication = async function() {
    const q = (document.getElementById('track-input')?.value || '').trim().toUpperCase();
    const resBox = document.getElementById('track-result');
    if (!q || !resBox) return;

    if (!q.startsWith('HF-') && !q.startsWith('GRV-')) {
      resBox.innerHTML = '<div style="color:#b91c1c; font-weight:700;">⚠️ لحماية سرية الأسر، يُسمح بالاستعلام برقم الطلب المرسل على الواتساب فقط (يبدأ بـ HF- أو GRV-).</div>';
      return;
    }

    resBox.innerHTML = '<p style="font-size:13px;">جاري البحث...</p>';
    if (!window.supabaseClient) return;

    if (q.startsWith('GRV-')) {
      const { data } = await window.supabaseClient.from('grievances').select('*').eq('tracking_code', q).maybeSingle();
      if (!data) {
        resBox.innerHTML = '<div style="color:#b91c1c; font-weight:700;">❌ لم يتم العثور على تظلم بهذا الرقم.</div>';
        return;
      }
      resBox.innerHTML = `
        <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:14px; border-radius:10px;">
          <strong>رقم التظلم:</strong> ${window.escapeHtml(data.tracking_code)}<br>
          <strong>النوع:</strong> ${window.escapeHtml(data.grievance_type)}<br>
          <strong>الحالة:</strong> ${data.status === 'resolved' ? 'تم الرد / المعالجة' : 'قيد المراجعة السرية'}
          ${data.admin_reply ? `<br><strong>رد الإدارة:</strong> ${window.escapeHtml(data.admin_reply)}` : ''}
        </div>`;
      return;
    }

    const { data } = await window.supabaseClient.from('families').select('*').eq('tracking_code', q).maybeSingle();
    if (!data) {
      resBox.innerHTML = '<div style="color:#b91c1c; font-weight:700;">❌ لم يتم العثور على طلب مطابق لرقم المتابعة المدخل.</div>';
      return;
    }

    const statusLabel = data.status === 'approved' ? '✅ مقبول ومعتمد للصرف' : (data.status === 'rejected' ? '❌ مرفوض لعدم الاستحقاق' : '🔍 قيد المراجعة والبحث الميداني');
    resBox.innerHTML = `
      <div style="background:#ecfdf5; border:1px solid #a7f3d0; padding:16px; border-radius:12px; color:#0f172a;">
        <strong>رقم الطلب:</strong> ${window.escapeHtml(data.tracking_code)}<br>
        <strong>نوع المساعدة:</strong> ${window.escapeHtml(data.intervention_type)}<br>
        <strong>حالة الطلب:</strong> ${statusLabel}<br>
        <strong>الباحث المسؤول:</strong> ${window.escapeHtml(data.assigned_to_name || 'قيد الإسناد')}
      </div>`;
  };

  // --- تسجيل الدخول الموحد ---
  window.loginUser = async function() {
    const email = (document.getElementById('login-email')?.value || '').trim().toLowerCase();
    const pass = (document.getElementById('login-pass')?.value || '').trim();
    if (!email || !pass) return alert('⚠️ يرجى إدخال البريد الإلكتروني وكلمة المرور.');

    const cfg = await window.getFoundationSettings();
    const savedCreds = JSON.parse(localStorage.getItem('hf_admin_creds') || 'null');
    const adminEmail = (savedCreds?.email || cfg.admin_email || 'alhafiz52025@gmail.com').toLowerCase();
    const adminPass = savedCreds?.pass || '22022025';

    if (email === adminEmail && pass === adminPass) {
      window.currentUser = { email: adminEmail, name: 'رئيس مجلس الأمناء', role: 'admin' };
      sessionStorage.setItem('hf_current_user', JSON.stringify(window.currentUser));
      if (typeof window.routeLoggedInUser === 'function') window.routeLoggedInUser(window.currentUser);
      return;
    }

    if (window.supabaseClient) {
      const { data } = await window.supabaseClient
        .from('users_profiles').select('*').ilike('email', email).maybeSingle();

      if (data) {
        if (data.account_status !== 'active') {
          return alert('⏳ حسابك قيد المراجعة أو موقوف من قبل الإدارة.');
        }
        const isValidMain = data.password_hash === pass;
        const isValidTemp = data.temp_code && data.temp_code === pass;

        if (isValidMain || isValidTemp) {
          window.currentUser = {
            id: data.id,
            email: data.email,
            name: data.full_name,
            role: data.role || 'researcher',
            member_code: data.member_code,
            can_view_all_cases: !!data.can_view_all_cases,
            must_change_password: isValidTemp || !!data.must_change_password
          };
          sessionStorage.setItem('hf_current_user', JSON.stringify(window.currentUser));
          if (typeof window.routeLoggedInUser === 'function') window.routeLoggedInUser(window.currentUser);
          return;
        }
      }
    }
    alert('❌ البريد الإلكتروني أو كلمة المرور / الرمز المؤقت غير صحيح.');
  };

  window.logoutUser = function() {
    window.currentUser = null;
    sessionStorage.removeItem('hf_current_user');
    document.getElementById('dashboard-area')?.classList.add('hidden');
    document.getElementById('login-box')?.classList.remove('hidden');
  };
})();
