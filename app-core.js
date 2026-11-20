// app-core.js - المحرك الأساسي الموحد لمؤسسة الحافظ للتنمية والخدمات
(function() {
  window.currentUser = JSON.parse(sessionStorage.getItem('hf_current_user') || 'null');
  let currentLang = 'ar';
  let currentFontScale = 100;

  const sbUrl = window.SB_URL || window.SUPABASE_URL || 'https://supabase.co';
  const sbKey = window.SB_KEY || window.SUPABASE_ANON_KEY || 'sb_publishable_6xYRIb6tT-Na8wvnDoGMsQ_EeMfQzdz';
  if (!window.supabaseClient && window.supabase && typeof window.supabase.createClient === 'function') {
    window.supabaseClient = window.supabase.createClient(sbUrl, sbKey);
  }
  window.escapeHtml = function(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  window.getFoundationSettings = async function() {
    const defaults = {
      org_name: 'مؤسسة الحافظ للتنمية والخدمات',
      reg_no: 'مشهرة برقم 2202 لسنة 2025',
      phone_whatsapp: '01000880156',
      phone_admin: '01155540066',
      admin_email: 'alhafiz52025@gmail.com',
      stat_food_bags: '+450',
      stat_cash_aid: '+112',
      stat_blankets: '+100',
      stat_villages: '14'
    };
    if (window.supabaseClient) {
      try {
        const { data } = await window.supabaseClient.from('site_settings').select('*').eq('id', 1).maybeSingle();
        if (data) return { ...defaults, ...data };
      } catch (e) {}
    }
    return defaults;
  };

  async function applyDynamicSiteStats() {
    const cfg = await window.getFoundationSettings();
    const map = {
      'stat-food': cfg.stat_food_bags,
      'stat-cash': cfg.stat_cash_aid,
      'stat-blankets': cfg.stat_blankets,
      'stat-villages': cfg.stat_villages
    };
    Object.keys(map).forEach(id => {
      const el = document.getElementById(id);
      if (el && map[id]) el.textContent = map[id];
    });
  }

  window.renderPublicAnnouncements = async function() {
    const box = document.getElementById('public-announcements-container');
    if (!box || !window.supabaseClient) return;
    const { data } = await window.supabaseClient
      .from('announcements').select('*').eq('is_active', true).order('created_at', { ascending: false });

    if (!data || data.length === 0) {
      box.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:#64748b;">لا توجد منح أو مبادرات مفتوحة حالياً.</p>';
      return;
    }
    box.innerHTML = data.map(item => `
      <div style="background:var(--bg-color); border:1px solid #f59e0b; border-radius:12px; overflow:hidden; padding:14px;">
        <span style="background:#fef3c7; color:#92400e; padding:3px 8px; border-radius:6px; font-size:11px; font-weight:700;">${window.escapeHtml(item.category || 'مبادرة مفتوحة')}</span>
        <h4 style="color:var(--primary-dark); margin:8px 0 6px;">${window.escapeHtml(item.title)}</h4>
        <p style="font-size:13px; margin:0 0 10px;">${window.escapeHtml(item.description)}</p>
        <button type="button" onclick="showSection('apply')" class="action-btn" style="width:100%; font-size:12px;">+ التقديم الآن</button>
      </div>
    `).join('');
  };

  window.renderPublicAchievements = async function() {
    const box = document.getElementById('public-achievements-container');
    if (!box || !window.supabaseClient) return;
    const { data } = await window.supabaseClient.from('achievements').select('*').order('created_at', { ascending: false });
    if (!data || data.length === 0) {
      box.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:#64748b;">لا توجد إنجازات منشورة حالياً.</p>';
      return;
    }
    box.innerHTML = data.map(s => `
      <div style="background:var(--bg-color); border:1px solid var(--border); border-radius:12px; overflow:hidden;">
        ${s.image_url ? `<img src="${window.escapeHtml(s.image_url)}" style="width:100%; height:170px; object-fit:cover;" onerror="this.style.display='none'">` : ''}
        <div style="padding:14px;">
          <strong style="color:var(--primary-dark); font-size:15px; display:block; margin-bottom:6px;">${window.escapeHtml(s.title)}</strong>
          <p style="font-size:13px; margin:0;">${window.escapeHtml(s.description || '')}</p>
        </div>
      </div>
    `).join('');
  };
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
        <p style="margin: 0; font-size: 13px;">${window.escapeHtml(item.a)}</p>
      </div>
    `).join('');
  }

  window.saveDraft = function() {
    localStorage.setItem('hf_wizard_draft', JSON.stringify({ step: window.currentStep || 1, data: window.formData || {} }));
    alert('💾 تم حفظ مسودة الاستمارة محلياً على جهازك.');
  };

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

    const msg = `مؤسسة الحافظ للتنمية والخدمات (واتساب رسمي: 01000880156)\nتم استلام تظلمكم بنجاح.\nرقم التظلم: ${code}`;
    if (typeof window.triggerInstantWhatsApp === 'function') window.triggerInstantWhatsApp(phone, msg);

    alert(`✅ تم إرسال رسالتكم بسرية تامة!\nرقم التظلم: ${code}`);
    ['grievance-name', 'grievance-phone', 'grievance-details'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  };

  window.trackApplication = async function() {
    const q = (document.getElementById('track-input')?.value || '').trim().toUpperCase();
    const resBox = document.getElementById('track-result');
    if (!q || !resBox) return;

    if (!q.startsWith('HF-') && !q.startsWith('GRV-')) {
      resBox.innerHTML = '<div style="color:#b91c1c; font-weight:700;">⚠️ يُسمح بالاستعلام برقم الطلب المرسل على الواتساب فقط (HF- أو GRV-).</div>';
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
      resBox.innerHTML = `<div style="background:#f8fafc; border:1px solid #cbd5e1; padding:14px; border-radius:10px;"><strong>رقم التظلم:</strong> ${window.escapeHtml(data.tracking_code)}<br><strong>الحالة:</strong> ${data.status === 'resolved' ? 'تم الرد' : 'قيد المراجعة'}</div>`;
      return;
    }

    const { data } = await window.supabaseClient.from('families').select('*').eq('tracking_code', q).maybeSingle();
    if (!data) {
      resBox.innerHTML = '<div style="color:#b91c1c; font-weight:700;">❌ لم يتم العثور على طلب مطابق.</div>';
      return;
    }

    const statusLabel = data.status === 'approved' ? '✅ مقبول للصرف' : (data.status === 'rejected' ? '❌ مرفوض' : '🔍 قيد المراجعة');
    resBox.innerHTML = `<div style="background:#ecfdf5; border:1px solid #a7f3d0; padding:16px; border-radius:12px;"><strong>رقم الطلب:</strong> ${window.escapeHtml(data.tracking_code)}<br><strong>النوع:</strong> ${window.escapeHtml(data.intervention_type)}<br><strong>الحالة:</strong> ${statusLabel}</div>`;
  };

  window.loginUser = async function() {
    const email = (document.getElementById('login-email')?.value || '').trim().toLowerCase();
    const pass = (document.getElementById('login-pass')?.value || '').trim();
    if (!email || !pass) return alert('⚠️ يرجى إدخال البريد الإلكتروني وكلمة المرور.');

    const cfg = await window.getFoundationSettings();
    const adminEmail = (cfg.admin_email || 'alhafiz52025@gmail.com').toLowerCase();

    if (email === adminEmail && pass === '22022025') {
      window.currentUser = { email: adminEmail, name: 'رئيس مجلس الأمناء', role: 'admin' };
      sessionStorage.setItem('hf_current_user', JSON.stringify(window.currentUser));
      if (typeof window.routeLoggedInUser === 'function') window.routeLoggedInUser(window.currentUser);
      return;
    }

    if (window.supabaseClient) {
      const { data } = await window.supabaseClient.from('users_profiles').select('*').ilike('email', email).maybeSingle();
      if (data && data.account_status === 'active' && (data.password_hash === pass || data.temp_code === pass)) {
        window.currentUser = {
          id: data.id, email: data.email, name: data.full_name, role: data.role || 'researcher',
          can_view_all_cases: !!data.can_view_all_cases, must_change_password: data.temp_code === pass || !!data.must_change_password
        };
        sessionStorage.setItem('hf_current_user', JSON.stringify(window.currentUser));
        if (typeof window.routeLoggedInUser === 'function') window.routeLoggedInUser(window.currentUser);
        return;
      }
    }
    alert('❌ بيانات الدخول غير صحيحة أو الحساب غير مفعل.');
  };

  window.logoutUser = function() {
    window.currentUser = null;
    sessionStorage.removeItem('hf_current_user');
    document.getElementById('dashboard-area')?.classList.add('hidden');
    document.getElementById('login-box')?.classList.remove('hidden');
  };
})();
