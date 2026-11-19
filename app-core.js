// app-core.js - المحرك الأساسي الموحد لمؤسسة الحافظ للتنمية والخدمات
(function() {
  const DEFAULT_ADMIN = {
    email: 'alhafiz52025@gmail.com',
    pass: '22022025',
    name: 'رئيس مجلس الأمناء',
    role: 'admin'
  };

  window.currentUser = JSON.parse(sessionStorage.getItem('hf_current_user') || 'null');
  let currentLang = 'ar';
  let currentFontScale = 100;
  let editingAchievementId = null;
  let uploadedAchievementImageData = '';

  if (!window.supabaseClient && window.SUPABASE_URL && window.SUPABASE_ANON_KEY && window.supabase) {
    window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  }

  // --- الإعدادات المؤسسية وأرقام الهواتف وبيانات الدخول ---
  window.getFoundationSettings = function() {
    const saved = JSON.parse(localStorage.getItem('hf_foundation_settings') || 'null');
    const creds = JSON.parse(localStorage.getItem('hf_admin_creds') || 'null');
    return {
      orgName: (saved && saved.orgName) || 'مؤسسة الحافظ للتنمية والخدمات',
      regNo: (saved && saved.regNo) || 'مشهرة برقم 2202 لسنة 2025',
      phone1: (saved && saved.phone1) || '01000880156',
      phone2: (saved && saved.phone2) || '01155540066',
      adminEmail: (creds && creds.email) || DEFAULT_ADMIN.email,
      adminPass: (creds && creds.pass) || DEFAULT_ADMIN.pass
    };
  };

  window.saveFoundationAndAdminSettings = function() {
    const adminEmail = (document.getElementById('cfg-admin-email')?.value || '').trim();
    const adminPass = (document.getElementById('cfg-admin-pass')?.value || '').trim();
    const phone1 = (document.getElementById('cfg-phone-1')?.value || '').trim();
    const phone2 = (document.getElementById('cfg-phone-2')?.value || '').trim();
    const orgName = (document.getElementById('cfg-org-name')?.value || '').trim();
    const regNo = (document.getElementById('cfg-reg-no')?.value || '').trim();

    if (!adminEmail || !adminPass) {
      alert('⚠️ يرجى إدخال البريد الإلكتروني وكلمة السر للإدارة.');
      return;
    }

    localStorage.setItem('hf_admin_creds', JSON.stringify({
      email: adminEmail,
      pass: adminPass,
      name: 'رئيس مجلس الأمناء',
      role: 'admin'
    }));

    localStorage.setItem('hf_foundation_settings', JSON.stringify({
      orgName: orgName || 'مؤسسة الحافظ للتنمية والخدمات',
      regNo: regNo || 'مشهرة برقم 2202 لسنة 2025',
      phone1: phone1 || '01000880156',
      phone2: phone2 || '01155540066'
    }));

    if (window.currentUser && window.currentUser.role === 'admin') {
      window.currentUser.email = adminEmail;
      sessionStorage.setItem('hf_current_user', JSON.stringify(window.currentUser));
    }

    alert('✅ تم حفظ بيانات الدخول وأرقام الهواتف والبيانات المؤسسية بنجاح.');
    renderDashboard();
  };

  // --- إدارة الأعضاء والباحثين والمتطوعين والشركاء والمانحين ---
  window.getManagedMembers = function() {
    return JSON.parse(localStorage.getItem('hf_members_directory') || '[]');
  };

  window.saveManagedMembers = function(list) {
    localStorage.setItem('hf_members_directory', JSON.stringify(list));
  };

  window.syncMembershipToDirectory = function(memberObj) {
    const list = window.getManagedMembers();
    const idx = list.findIndex(
      m => (memberObj.code && m.code === memberObj.code) ||
           (memberObj.email && m.email && m.email.toLowerCase() === memberObj.email.toLowerCase()) ||
           (memberObj.phone && m.phone && m.phone === memberObj.phone)
    );
    const record = {
      code: memberObj.code || ('MBR-' + Math.floor(1000 + Math.random() * 9000)),
      full_name: memberObj.full_name || '',
      role: memberObj.role || 'researcher',
      phone: memberObj.phone || '',
      email: (memberObj.email || '').trim(),
      password: memberObj.password || '22022025',
      status: memberObj.status || 'active',
      updated_at: new Date().toISOString()
    };
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...record };
    } else {
      list.unshift(record);
    }
    window.saveManagedMembers(list);
    return record;
  };

  window.addOrUpdateMemberAccount = async function() {
    const name = (document.getElementById('mgr-mem-name')?.value || '').trim();
    const role = document.getElementById('mgr-mem-role')?.value || 'researcher';
    const phone = (document.getElementById('mgr-mem-phone')?.value || '').trim();
    const email = (document.getElementById('mgr-mem-email')?.value || '').trim();
    const password = (document.getElementById('mgr-mem-pass')?.value || '').trim();
    const status = document.getElementById('mgr-mem-status')?.value || 'active';
    const editTarget = (document.getElementById('mgr-mem-editing-code')?.value || '').trim();

    if (!name || !phone || !email || !password) {
      alert('⚠️ يرجى إدخال الاسم، رقم الهاتف، البريد الإلكتروني، وكلمة السر.');
      return;
    }

    const list = window.getManagedMembers();
    if (editTarget) {
      const idx = list.findIndex(m => m.code === editTarget);
      if (idx >= 0) {
        const oldEmail = list[idx].email;
        list[idx] = {
          ...list[idx],
          full_name: name,
          role,
          phone,
          email,
          password,
          status,
          updated_at: new Date().toISOString()
        };
        window.saveManagedMembers(list);

        if (window.supabaseClient) {
          await window.supabaseClient.from('users_profiles').update({
            full_name: name,
            role,
            phone,
            email,
            account_status: status
          }).eq('email', oldEmail || email);
        }

        alert('✅ تم تعديل بيانات العضو والبريد الإلكتروني والرقم السري بنجاح.');
      }
    } else {
      const newCode = 'MBR-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
      window.syncMembershipToDirectory({
        code: newCode,
        full_name: name,
        role,
        phone,
        email,
        password,
        status
      });

      if (window.supabaseClient) {
        await window.supabaseClient.from('users_profiles').insert([{
          full_name: name,
          role,
          phone,
          email,
          account_status: status
        }]);
      }

      alert('✅ تم إضافة حساب العضو الجديد بنجاح.');
    }

    window.resetMemberForm();
    window.refreshMembersTableOnly();
  };

  window.editMemberAccount = function(code) {
    const item = window.getManagedMembers().find(m => m.code === code);
    if (!item) return;
    document.getElementById('mgr-mem-editing-code').value = item.code;
    document.getElementById('mgr-mem-name').value = item.full_name || '';
    document.getElementById('mgr-mem-role').value = item.role || 'researcher';
    document.getElementById('mgr-mem-phone').value = item.phone || '';
    document.getElementById('mgr-mem-email').value = item.email || '';
    document.getElementById('mgr-mem-pass').value = item.password || '';
    document.getElementById('mgr-mem-status').value = item.status || 'active';
    const btn = document.getElementById('mgr-mem-save-btn');
    if (btn) btn.textContent = '💾 حفظ التعديلات على العضو';
  };

  window.resetMemberForm = function() {
    ['mgr-mem-editing-code', 'mgr-mem-name', 'mgr-mem-phone', 'mgr-mem-email', 'mgr-mem-pass'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const roleEl = document.getElementById('mgr-mem-role');
    if (roleEl) roleEl.value = 'researcher';
    const stEl = document.getElementById('mgr-mem-status');
    if (stEl) stEl.value = 'active';
    const btn = document.getElementById('mgr-mem-save-btn');
    if (btn) btn.textContent = '+ إضافة / حفظ حساب العضو';
  };

  window.deleteMemberAccount = async function(code) {
    if (!confirm('هل أنت متأكد من حذف هذا الحساب نهائياً؟')) return;
    const list = window.getManagedMembers();
    const target = list.find(m => m.code === code);
    const filtered = list.filter(m => m.code !== code);
    window.saveManagedMembers(filtered);

    if (window.supabaseClient && target && target.email) {
      await window.supabaseClient.from('users_profiles').delete().eq('email', target.email);
    }

    alert('🗑️ تم حذف الحساب بنجاح.');
    window.refreshMembersTableOnly();
  };

  window.refreshMembersTableOnly = function() {
    const tbody = document.getElementById('managed-members-tbody');
    if (!tbody) return;
    const search = (document.getElementById('mgr-mem-search')?.value || '').trim().toLowerCase();
    const roleLabels = {
      researcher: 'باحث ميداني',
      volunteer: 'متطوع',
      partner: 'جهة شريكة',
      donor: 'جهة مانحة'
    };

    const list = window.getManagedMembers().filter(m => {
      if (!search) return true;
      return [m.code, m.full_name, m.phone, m.email, m.role].some(
        v => String(v || '').toLowerCase().includes(search)
      );
    });

    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">لا توجد حسابات أعضاء مسجلة أو مطابقة للبحث.</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(m => `
      <tr>
        <td><strong>${m.code}</strong></td>
        <td>${m.full_name}<br><small>هاتف: ${m.phone || '-'}</small></td>
        <td>${roleLabels[m.role] || m.role}</td>
        <td><strong>البريد:</strong> ${m.email || '-'}<br><strong>السر:</strong> ${m.password || '-'}</td>
        <td>${m.status === 'active' ? '✅ نشط' : '⛔ موقوف'}</td>
        <td class="no-print">
          <button type="button" onclick="editMemberAccount('${m.code}')" class="nav-btn btn-gold" style="padding:4px 8px; font-size:11px;">✏️ تعديل</button>
          <button type="button" onclick="deleteMemberAccount('${m.code}')" class="nav-btn" style="background:#dc2626; color:#fff; padding:4px 8px; font-size:11px;">🗑️ حذف</button>
        </td>
      </tr>
    `).join('');
  };

  // --- استعادة البريد أو الرقم السري عند النسيان ---
  window.openForgotCredentialsBox = function() {
    const loginBox = document.getElementById('login-box');
    if (!loginBox) return;
    let recoveryBox = document.getElementById('hf-recovery-panel');
    if (!recoveryBox) {
      recoveryBox = document.createElement('div');
      recoveryBox.id = 'hf-recovery-panel';
      recoveryBox.style.cssText = 'margin-top:14px; padding:14px; border-radius:10px; background:#f8fafc; border:1px solid #cbd5e1; text-align:right; color:#0f172a;';
      loginBox.appendChild(recoveryBox);
    }
    recoveryBox.classList.remove('hidden');
    recoveryBox.innerHTML = `
      <h4 style="margin:0 0 8px; color:var(--primary-dark);">🔑 استعادة البريد أو إعادة تعيين الرقم السري</h4>
      <p style="font-size:12px; margin:0 0 8px;">أدخل رقم الهاتف المسجل أو كود العضوية لعرض بيانات الحساب أو تعيين رقم سري جديد:</p>
      <input id="rec-lookup-input" placeholder="رقم الهاتف (11 رقم) أو كود العضوية" style="margin-bottom:8px;">
      <input id="rec-new-pass" type="text" placeholder="الرقم السري الجديد المطلوب (اختياري)" style="margin-bottom:8px;">
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button type="button" onclick="lookupOrRequestPasswordReset()" class="action-btn" style="padding:7px 14px; font-size:12px;">بحث / تحديث الرقم السري</button>
        <button type="button" onclick="document.getElementById('hf-recovery-panel').classList.add('hidden')" class="nav-btn" style="padding:7px 12px; font-size:12px;">إغلاق</button>
      </div>
      <div id="rec-result-msg" style="margin-top:8px; font-size:12px;"></div>
    `;
  };

  window.lookupOrRequestPasswordReset = function() {
    const q = (document.getElementById('rec-lookup-input')?.value || '').trim().toLowerCase();
    const desiredPass = (document.getElementById('rec-new-pass')?.value || '').trim();
    const out = document.getElementById('rec-result-msg');
    if (!q || !out) return;

    const members = window.getManagedMembers();
    const found = members.find(m =>
      String(m.phone || '').toLowerCase() === q ||
      String(m.code || '').toLowerCase() === q ||
      String(m.email || '').toLowerCase() === q
    );

    if (found) {
      if (desiredPass) {
        found.password = desiredPass;
        found.updated_at = new Date().toISOString();
        window.saveManagedMembers(members);
        out.innerHTML = `<div style="color:#065f46; font-weight:700;">✅ تم تحديث الرقم السري لحساب (${found.full_name}) وبريده المسجل هو: <strong>${found.email}</strong>. يمكنك تسجيل الدخول الآن.</div>`;
      } else {
        out.innerHTML = `<div style="color:#065f46; font-weight:700;">✅ الحساب موجود: <strong>${found.full_name}</strong><br>البريد المسجل: <strong>${found.email}</strong><br>الرقم السري الحالي: <strong>${found.password}</strong></div>`;
      }
      return;
    }

    out.innerHTML = `<div style="color:#92400e; font-weight:700;">⚠️ لم يتم العثور على مطابقة؛ يمكنك التواصل مع إدارة المؤسسة (01155540066 / واتساب 01000880156) لتأكيد بياناتك وتحديث البريد أو الرقم السري.</div>`;
  };

  // --- التعريب الكامل للعناوين والتوضيحات ---
  function setElementTranslatedText(el, text) {
    if (text === undefined || text === null) return;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = text;
      return;
    }
    const hasDirectText = Array.from(el.childNodes).some(
      n => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0
    );
    if (hasDirectText || el.children.length === 0) {
      el.textContent = text;
    } else {
      const target = el.querySelector('p, span, strong, small, label, li') || el;
      target.textContent = text;
    }
  }

  window.applyFullTranslation = function(lang) {
    const targetLang = (lang === 'en') ? 'en' : 'ar';
    const root = document.getElementById('html-root') || document.documentElement;
    if (root) {
      root.lang = targetLang;
      root.dir = targetLang === 'ar' ? 'rtl' : 'ltr';
    }

    if (typeof window.applyLanguageDictionary === 'function') {
      window.applyLanguageDictionary(targetLang);
    }

    const dict = (window.HF_TRANSLATIONS && window.HF_TRANSLATIONS[targetLang]) || {};
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key && dict[key] !== undefined) {
        setElementTranslatedText(el, dict[key]);
      }
    });

    document.querySelectorAll('[data-ar][data-en]').forEach(el => {
      const val = targetLang === 'en' ? el.getAttribute('data-en') : el.getAttribute('data-ar');
      setElementTranslatedText(el, val);
    });

    const toggleBtn = document.getElementById('lang-toggle-btn');
    if (toggleBtn) {
      toggleBtn.textContent = targetLang === 'en' ? 'العربية' : 'English';
    }
    if (dict.siteTitle) {
      document.title = dict.siteTitle;
    }
  };

  window.addEventListener('DOMContentLoaded', () => {
    renderFaqList();
    renderPublicAchievements();
    if (window.currentUser) {
      renderDashboard();
    }
  });

  window.showSection = function(sectionName) {
    const sections = document.querySelectorAll('.container > section');
    sections.forEach(sec => sec.classList.add('hidden'));
    const target = document.getElementById('section-' + sectionName);
    if (target) {
      target.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (sectionName === 'apply' && typeof window.renderWizardStep === 'function') {
      window.renderWizardStep();
    } else if (sectionName === 'achievements') {
      renderPublicAchievements();
    } else if (sectionName === 'login' && window.currentUser) {
      renderDashboard();
    }
  };

  window.toggleLanguage = function() {
    currentLang = currentLang === 'ar' ? 'en' : 'ar';
    window.applyFullTranslation(currentLang);
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
      navigator.clipboard.writeText(txt).then(() => alert('تم النسخ: ' + txt)).catch(() => prompt('انسخ الرقم:', txt));
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
        <h4 style="color: var(--primary); margin: 0 0 6px;">${idx + 1}. ${item.q}</h4>
        <p style="margin: 0; font-size: 14px; line-height: 1.6;">${item.a}</p>
      </div>
    `).join('');
  }

  // --- إدارة الإنجازات الكاملة ---
  window.handleAchievementFileSelect = function(inputEl) {
    const file = inputEl && inputEl.files && inputEl.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      uploadedAchievementImageData = e.target.result || '';
      const preview = document.getElementById('ach-img-preview');
      if (preview) {
        preview.src = uploadedAchievementImageData;
        preview.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);
  };

  window.getAllAchievements = async function() {
    const localList = JSON.parse(localStorage.getItem('hf_achievements_list') || '[]');
    if (window.supabaseClient) {
      try {
        const { data, error } = await window.supabaseClient
          .from('achievements')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && Array.isArray(data) && data.length > 0) {
          const map = new Map();
          [...localList, ...data].forEach(item => {
            const key = String(item.id || item.title);
            if (!map.has(key)) map.set(key, item);
          });
          return Array.from(map.values());
        }
      } catch (e) {
        console.warn('Achievements fetch fallback:', e);
      }
    }
    return localList;
  };

  window.saveAchievementItem = async function() {
    const titleEl = document.getElementById('ach-title');
    const descEl = document.getElementById('ach-desc');
    const imgUrlEl = document.getElementById('ach-img');

    const title = (titleEl ? titleEl.value : '').trim();
    const description = (descEl ? descEl.value : '').trim();
    const manualUrl = (imgUrlEl ? imgUrlEl.value : '').trim();
    const finalImage = uploadedAchievementImageData || manualUrl || 'logo.jpg';

    if (!title) {
      alert('⚠️ يرجى كتابة العنوان الرئيسي للإنجاز.');
      return;
    }

    const localList = JSON.parse(localStorage.getItem('hf_achievements_list') || '[]');

    if (editingAchievementId !== null) {
      const idx = localList.findIndex(x => String(x.id) === String(editingAchievementId));
      const updated = {
        ...(idx >= 0 ? localList[idx] : {}),
        id: editingAchievementId,
        title,
        description,
        image_url: finalImage,
        updated_at: new Date().toISOString()
      };
      if (idx >= 0) localList[idx] = updated;
      else localList.unshift(updated);

      if (window.supabaseClient) {
        await window.supabaseClient
          .from('achievements')
          .update({ title, description, image_url: finalImage })
          .eq('id', editingAchievementId);
      }

      localStorage.setItem('hf_achievements_list', JSON.stringify(localList));
      editingAchievementId = null;
      uploadedAchievementImageData = '';
      alert('✅ تم تعديل الإنجاز بنجاح.');
    } else {
      const newItem = {
        id: 'ACH-' + Date.now(),
        title,
        description,
        image_url: finalImage,
        category: 'إنجازات المؤسسة',
        created_at: new Date().toISOString()
      };

      localList.unshift(newItem);
      localStorage.setItem('hf_achievements_list', JSON.stringify(localList));

      if (window.supabaseClient) {
        await window.supabaseClient.from('achievements').insert([{
          title,
          description,
          image_url: finalImage,
          category: 'إنجازات المؤسسة'
        }]);
      }

      uploadedAchievementImageData = '';
      alert('✅ تم نشر الإنجاز الجديد بنجاح.');
    }

    if (titleEl) titleEl.value = '';
    if (descEl) descEl.value = '';
    if (imgUrlEl) imgUrlEl.value = '';
    const fileEl = document.getElementById('ach-file');
    if (fileEl) fileEl.value = '';
    const preview = document.getElementById('ach-img-preview');
    if (preview) {
      preview.src = '';
      preview.style.display = 'none';
    }
    const submitBtn = document.getElementById('ach-submit-btn');
    if (submitBtn) submitBtn.textContent = '+ نشر الإنجاز على الصفحة';

    await window.renderAdminAchievementsManager();
    await renderPublicAchievements();
  };

  window.startEditAchievement = async function(id) {
    const list = await window.getAllAchievements();
    const item = list.find(x => String(x.id) === String(id));
    if (!item) return;

    editingAchievementId = item.id;
    uploadedAchievementImageData = (item.image_url && item.image_url.startsWith('data:image')) ? item.image_url : '';

    const titleEl = document.getElementById('ach-title');
    const descEl = document.getElementById('ach-desc');
    const imgUrlEl = document.getElementById('ach-img');
    const preview = document.getElementById('ach-img-preview');
    const submitBtn = document.getElementById('ach-submit-btn');

    if (titleEl) titleEl.value = item.title || '';
    if (descEl) descEl.value = item.description || '';
    if (imgUrlEl) imgUrlEl.value = (item.image_url && !item.image_url.startsWith('data:image')) ? item.image_url : '';
    if (preview && item.image_url) {
      preview.src = item.image_url;
      preview.style.display = 'block';
    }
    if (submitBtn) submitBtn.textContent = '💾 حفظ التعديلات على الإنجاز';
  };

  window.deleteAchievementItem = async function(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الإنجاز؟')) return;
    const localList = JSON.parse(localStorage.getItem('hf_achievements_list') || '[]')
      .filter(x => String(x.id) !== String(id));
    localStorage.setItem('hf_achievements_list', JSON.stringify(localList));

    if (window.supabaseClient) {
      await window.supabaseClient.from('achievements').delete().eq('id', id);
    }

    await window.renderAdminAchievementsManager();
    await renderPublicAchievements();
  };

  window.renderAdminAchievementsManager = async function() {
    const box = document.getElementById('admin-tab-achievements');
    if (!box) return;
    const list = await window.getAllAchievements();

    box.innerHTML = `
      <div style="background:#f8fafc; padding:16px; border-radius:12px; border:1px solid #cbd5e1; margin-bottom:20px; color:#0f172a;">
        <h4 style="margin-top:0; color:var(--primary-dark);">🏆 إضافة / تعديل إنجاز في صفحة الإنجازات</h4>
        <label style="font-size:12px; font-weight:700;">العنوان الرئيسي للإنجاز:</label>
        <input id="ach-title" placeholder="اكتب العنوان الرئيسي للإنجاز...">

        <label style="font-size:12px; font-weight:700;">التوضيح والتفاصيل:</label>
        <textarea id="ach-desc" rows="3" placeholder="اكتب التوضيح الكامل للإنجاز والتفاصيل..."></textarea>

        <label style="font-size:12px; font-weight:700;">رفع صورة من الجهاز (أو إدخال رابط صورة):</label>
        <input id="ach-file" type="file" accept="image/*" onchange="handleAchievementFileSelect(this)" style="margin-bottom:8px;">
        <input id="ach-img" placeholder="رابط الصورة (اختياري إذا تم رفع صورة من الجهاز)">
        <img id="ach-img-preview" src="" alt="معاينة الصورة" style="display:none; max-height:140px; border-radius:8px; margin:8px 0; border:1px solid #cbd5e1;">

        <div style="margin-top:8px;">
          <button id="ach-submit-btn" type="button" onclick="saveAchievementItem()" class="action-btn">+ نشر الإنجاز على الصفحة</button>
        </div>
      </div>

      <h4 style="color:var(--primary-dark);">قائمة الإنجازات المنشورة (${list.length})</h4>
      ${list.length === 0
        ? '<p style="color:#64748b;">لا توجد إنجازات منشورة حالياً. يمكنك إضافة إنجازات جديدة من النموذج أعلاه.</p>'
        : `<div class="grid-2">
            ${list.map(item => `
              <div style="background:#fff; border:1px solid #cbd5e1; border-radius:10px; overflow:hidden; color:#0f172a;">
                ${item.image_url ? `<img src="${item.image_url}" alt="${item.title}" style="width:100%; height:160px; object-fit:cover;" onerror="this.style.display='none'">` : ''}
                <div style="padding:12px;">
                  <h5 style="margin:0 0 6px; color:var(--primary-dark);">${item.title}</h5>
                  <p style="margin:0 0 12px; font-size:13px; line-height:1.6; white-space:pre-line;">${item.description || ''}</p>
                  <div style="display:flex; gap:8px;">
                    <button type="button" onclick="startEditAchievement('${item.id}')" class="nav-btn btn-gold" style="font-size:12px; padding:5px 10px;">✏️ تعديل</button>
                    <button type="button" onclick="deleteAchievementItem('${item.id}')" class="nav-btn" style="background:#dc2626; color:#fff; font-size:12px; padding:5px 10px;">🗑️ حذف</button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>`
      }
    `;
  };

  async function renderPublicAchievements() {
    const container = document.getElementById('public-achievements-container');
    if (!container) return;
    const list = await window.getAllAchievements();
    if (!list || list.length === 0) {
      container.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#64748b;">لا توجد إنجازات منشورة حالياً.</p>';
      return;
    }
    container.innerHTML = list.map(s => `
      <div style="background: var(--bg-color); border: 1px solid var(--border); border-radius: 12px; overflow: hidden;">
        ${s.image_url ? `<img src="${s.image_url}" alt="${s.title}" style="width:100%; height:180px; object-fit:cover;" onerror="this.style.display='none'">` : ''}
        <div style="padding: 14px;">
          <strong style="color: var(--primary-dark); font-size: 15px; display:block; margin-bottom:6px;">${s.title}</strong>
          <p style="font-size: 13px; margin: 0; line-height:1.7; white-space:pre-line;">${s.description || ''}</p>
        </div>
      </div>
    `).join('');
  }

  window.saveDraft = function() {
    if (typeof window.saveCurrentStepData === 'function') {
      try { window.saveCurrentStepData(); } catch (e) {}
    }
    localStorage.setItem('hf_wizard_draft', JSON.stringify({
      step: window.currentStep || 1,
      data: window.formData || {}
    }));
    alert('💾 تم حفظ مسودة الاستمارة محلياً على جهازك.');
  };

  // --- التظلمات السرية والاستعلام ---
  window.submitGrievance = async function() {
    const feedback = document.getElementById('grievance-feedback');
    const type = document.getElementById('grievance-type')?.value || 'تظلم من رفض طلب مساعدة';
    const fullName = (document.getElementById('grievance-name')?.value || '').trim();
    const email = (document.getElementById('grievance-email')?.value || '').trim();
    const address = (document.getElementById('grievance-address')?.value || '').trim();
    const phone = (document.getElementById('grievance-phone')?.value || '').trim();
    const details = (document.getElementById('grievance-details')?.value || '').trim();

    if (!fullName || !address || !phone || !details) {
      if (feedback) feedback.innerHTML = '<div style="color:#b91c1c; font-weight:700;">⚠️ يرجى استكمال الاسم كاملاً، العنوان بالتفصيل، رقم الهاتف، وتفاصيل التظلم.</div>';
      return;
    }
    if (!/^01[0125]\d{8}$/.test(phone)) {
      if (feedback) feedback.innerHTML = '<div style="color:#b91c1c; font-weight:700;">⚠️ رقم الهاتف يجب أن يتكون من 11 رقماً يبدأ بـ 01.</div>';
      return;
    }

    const code = 'GRV-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
    const row = {
      tracking_code: code,
      grievance_type: type,
      full_name: fullName,
      email: email || null,
      address_details: address,
      phone,
      message_body: details,
      status: 'pending'
    };

    const localList = JSON.parse(localStorage.getItem('hf_local_grievances') || '[]');
    localList.unshift({ ...row, created_at: new Date().toISOString() });
    localStorage.setItem('hf_local_grievances', JSON.stringify(localList));

    if (window.supabaseClient) {
      await window.supabaseClient.from('grievances').insert([row]);
    }

    const waMsg = `مؤسسة الحافظ للتنمية والخدمات\nتم استلام رسالتكم / تظلمكم بنجاح.\nرقم الطلب: ${code}\nالاسم: ${fullName}\nسيتم الفحص والرد في أقرب وقت.`;
    if (typeof window.triggerInstantWhatsApp === 'function') {
      window.triggerInstantWhatsApp(phone, waMsg);
    }

    if (feedback) {
      feedback.innerHTML = `<div style="background:#ecfdf5; border:1px solid #a7f3d0; color:#065f46; padding:12px; border-radius:8px; font-weight:700;">
        ✅ تم إرسال رسالتكم بسرية تامة بنجاح!<br>رقم الطلب الخاص بكم: <strong>${code}</strong><br>
        <span style="font-size:12px; font-weight:600;">في حال وجود أي مشكلة، يرجى التوجه إلى مقر المؤسسة أو شاشة التظلمات، وسوف نرد على حضراتكم في أقرب وقت مع تحيات مؤسسة الحافظ.</span>
      </div>`;
    }

    ['grievance-name', 'grievance-email', 'grievance-address', 'grievance-phone', 'grievance-details'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
  };

  window.trackApplication = async function() {
    const q = (document.getElementById('track-input')?.value || '').trim();
    const resBox = document.getElementById('track-result');
    if (!q || !resBox) return;
    resBox.innerHTML = '<p style="font-size:13px;">جاري البحث...</p>';

    let found = null;
    if (window.supabaseClient) {
      const { data } = await window.supabaseClient
        .from('families')
        .select('*')
        .or(`tracking_code.eq.${q},husband_data->>nid.eq.${q}`)
        .limit(1);
      if (data && data.length > 0) found = data[0];
    }

    if (!found) {
      const localGrv = JSON.parse(localStorage.getItem('hf_local_grievances') || '[]');
      const g = localGrv.find(item => item.tracking_code === q || item.phone === q);
      if (g) {
        resBox.innerHTML = `<div style="background:#f8fafc; border:1px solid #cbd5e1; padding:14px; border-radius:10px;">
          <strong>رقم التظلم:</strong> ${g.tracking_code}<br>
          <strong>النوع:</strong> ${g.grievance_type}<br>
          <strong>مقدم الطلب:</strong> ${g.full_name}<br>
          <strong>الحالة:</strong> قيد المراجعة
        </div>`;
        return;
      }
      resBox.innerHTML = '<div style="color:#b91c1c; font-weight:700;">لم يتم العثور على طلب مطابق لبيانات البحث المدخلة.</div>';
      return;
    }

    const h = found.husband_data || {};
    const fullName = [h.name1, h.name2, h.name3].filter(Boolean).join(' ') || 'غير محدد';
    resBox.innerHTML = `
      <div style="background:#ecfdf5; border:1px solid #a7f3d0; padding:16px; border-radius:12px;">
        <strong>رقم الطلب:</strong> ${found.tracking_code}<br>
        <strong>اسم رب الأسرة:</strong> ${fullName}<br>
        <strong>نوع التدخل:</strong> ${found.intervention_type}<br>
        <strong>العنوان:</strong> ${found.governorate} - ${found.center_city} - ${found.village_hamlet}<br>
        <strong>حالة الطلب:</strong> ${found.status === 'approved' ? 'مقبول / مستحق' : (found.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة')}<br>
        <strong>تقييم الاستحقاق:</strong> ${found.eligibility_verdict || 'قيد المراجعة'}
      </div>
    `;
  };

  // --- تسجيل الدخول وطلب الانضمام ---
  window.loginUser = function() {
    const email = (document.getElementById('login-email')?.value || '').trim().toLowerCase();
    const pass = (document.getElementById('login-pass')?.value || '').trim();
    const creds = JSON.parse(localStorage.getItem('hf_admin_creds') || 'null') || DEFAULT_ADMIN;

    if (email === creds.email.toLowerCase() && pass === creds.pass) {
      window.currentUser = { email: creds.email, name: creds.name, role: creds.role };
      sessionStorage.setItem('hf_current_user', JSON.stringify(window.currentUser));
      renderDashboard();
      return;
    }

    const managedMember = window.getManagedMembers().find(
      m => (m.email || '').trim().toLowerCase() === email && String(m.password || '') === pass
    );

    if (managedMember) {
      if (managedMember.status !== 'active') {
        alert('⏳ حسابك موقوف مؤقتاً من قبل الإدارة.');
        return;
      }
      window.currentUser = {
        email: managedMember.email,
        name: managedMember.full_name,
        role: managedMember.role || 'member',
        code: managedMember.code
      };
      sessionStorage.setItem('hf_current_user', JSON.stringify(window.currentUser));
      renderDashboard();
      return;
    }

    alert('⚠️ البريد الإلكتروني أو كلمة المرور غير صحيحة.');
  };

  window.logoutUser = function() {
    window.currentUser = null;
    sessionStorage.removeItem('hf_current_user');
    document.getElementById('dashboard-area')?.classList.add('hidden');
    document.getElementById('login-box')?.classList.remove('hidden');
  };

  window.openPartnerRegister = function() {
    document.getElementById('login-box')?.classList.add('hidden');
    const box = document.getElementById('partner-register-box');
    if (!box) return;
    box.classList.remove('hidden');
    box.innerHTML = `
      <h4 style="color:var(--primary-dark); margin-top:0;">+ طلب انضمام جديد (باحث / متطوع / جهة شريكة / مانح)</h4>
      <input id="req-name" placeholder="الاسم الكامل أو اسم الجهة *">
      <input id="req-nid" maxlength="14" placeholder="الرقم القومي (14 رقم) إن وجد">
      <input id="req-phone" maxlength="11" placeholder="رقم الهاتف (11 رقم) *">
      <input id="req-email" type="email" placeholder="البريد الإلكتروني *">
      <select id="req-role">
        <option value="researcher">باحث ميداني</option>
        <option value="volunteer">متطوع</option>
        <option value="partner">جهة شريكة / جمعية</option>
        <option value="donor">جهة مانحة</option>
      </select>
      <textarea id="req-notes" rows="3" placeholder="الخبرات أو نطاق العمل أو ملاحظات الانضمام"></textarea>
      <div style="display:flex; gap:10px; margin-top:8px;">
        <button type="button" onclick="submitMembershipRequest()" class="action-btn">إرسال طلب الانضمام</button>
        <button type="button" onclick="closePartnerRegister()" class="nav-btn">رجوع للدخول</button>
      </div>
      <div id="req-feedback" style="margin-top:10px;"></div>
    `;
  };

  window.closePartnerRegister = function() {
    document.getElementById('partner-register-box')?.classList.add('hidden');
    document.getElementById('login-box')?.classList.remove('hidden');
  };

  window.submitMembershipRequest = async function() {
    const name = (document.getElementById('req-name')?.value || '').trim();
    const nid = (document.getElementById('req-nid')?.value || '').trim();
    const phone = (document.getElementById('req-phone')?.value || '').trim();
    const email = (document.getElementById('req-email')?.value || '').trim();
    const role = document.getElementById('req-role')?.value || 'researcher';
    const notes = (document.getElementById('req-notes')?.value || '').trim();
    const fb = document.getElementById('req-feedback');

    if (!name || !phone || !email) {
      if (fb) fb.innerHTML = '<div style="color:#b91c1c; font-weight:700;">⚠️ يرجى إدخال الاسم، رقم الهاتف، والبريد الإلكتروني.</div>';
      return;
    }

    const reqCode = 'MEM-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const payload = {
      request_code: reqCode,
      full_name: name,
      national_id: nid || null,
      phone,
      email,
      requested_role: role,
      notes,
      status: 'pending'
    };

    const localMem = JSON.parse(localStorage.getItem('hf_local_memberships') || '[]');
    localMem.unshift({ ...payload, created_at: new Date().toISOString() });
    localStorage.setItem('hf_local_memberships', JSON.stringify(localMem));

    if (window.supabaseClient) {
      await window.supabaseClient.from('membership_requests').insert([payload]);
    }

    if (typeof window.triggerInstantWhatsApp === 'function') {
      window.triggerInstantWhatsApp(phone, `مؤسسة الحافظ للتنمية والخدمات\nتم استلام طلب الانضمام الخاص بكم.\nرقم الطلب: ${reqCode}\nالحالة: قيد المراجعة.`);
    }

    if (fb) {
      fb.innerHTML = `<div style="background:#ecfdf5; border:1px solid #a7f3d0; color:#065f46; padding:10px; border-radius:8px; font-weight:700;">
        ✅ تم تسجيل طلب الانضمام بنجاح برقم: <strong>${reqCode}</strong> (قيد المراجعة).
      </div>`;
    }
  };

  window.updateMembershipDecision = async function(code, statusVal, roleVal) {
    const localMem = JSON.parse(localStorage.getItem('hf_local_memberships') || '[]');
    const idx = localMem.findIndex(m => (m.request_code || m.id) === code);
    let targetItem = null;

    if (idx >= 0) {
      if (statusVal) localMem[idx].status = statusVal;
      if (roleVal) localMem[idx].requested_role = roleVal;
      localMem[idx].reviewed_at = new Date().toISOString();
      targetItem = localMem[idx];
      localStorage.setItem('hf_local_memberships', JSON.stringify(localMem));
    }

    if (statusVal === 'approved' && targetItem) {
      window.syncMembershipToDirectory({
        code: targetItem.request_code || code,
        full_name: targetItem.full_name || '',
        role: targetItem.requested_role || roleVal || 'researcher',
        phone: targetItem.phone || '',
        email: targetItem.email || '',
        password: targetItem.password || '22022025',
        status: 'active'
      });
    }

    if (window.supabaseClient && code) {
      const upd = {};
      if (statusVal) upd.status = statusVal;
      if (roleVal) upd.requested_role = roleVal;
      await window.supabaseClient.from('membership_requests').update(upd).eq('request_code', code);
      if (targetItem && targetItem.email) {
        await window.supabaseClient.from('users_profiles').update({
          ...(roleVal ? { role: roleVal } : {}),
          ...(statusVal ? { account_status: statusVal === 'approved' ? 'active' : statusVal } : {})
        }).eq('email', targetItem.email);
      }
    }

    if (statusVal === 'approved' && targetItem && targetItem.phone && typeof window.triggerInstantWhatsApp === 'function') {
      window.triggerInstantWhatsApp(
        targetItem.phone,
        `مؤسسة الحافظ للتنمية والخدمات\nتم اعتماد طلب انضمامكم (${code}) بصفة: ${targetItem.requested_role || 'عضو'}.`
      );
    }

    alert('✅ تم تحديث حالة طلب الانضمام والصلاحية بنجاح.');
    renderDashboard();
  };

  // --- لوحة الإدارة الاحترافية ---
  window.renderDashboard = async function() {
    document.getElementById('login-box')?.classList.add('hidden');
    document.getElementById('partner-register-box')?.classList.add('hidden');
    const area = document.getElementById('dashboard-area');
    if (!area) return;
    area.classList.remove('hidden');

    const cfg = window.getFoundationSettings();
    let families = [];
    let grievances = JSON.parse(localStorage.getItem('hf_local_grievances') || '[]');
    let memberships = JSON.parse(localStorage.getItem('hf_local_memberships') || '[]');

    if (window.supabaseClient) {
      const fRes = await window.supabaseClient.from('families').select('*').order('created_at', { ascending: false });
      if (!fRes.error && fRes.data) families = fRes.data;

      const gRes = await window.supabaseClient.from('grievances').select('*').order('created_at', { ascending: false });
      if (!gRes.error && gRes.data && gRes.data.length > 0) grievances = gRes.data;

      const mRes = await window.supabaseClient.from('membership_requests').select('*').order('created_at', { ascending: false });
      if (!mRes.error && mRes.data && mRes.data.length > 0) memberships = mRes.data;
    }

    const approvedCount = families.filter(f => f.status === 'approved').length;
    const rejectedCount = families.filter(f => f.status === 'rejected').length;

    area.innerHTML = `
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-bottom:1px solid var(--border); padding-bottom:12px;">
          <div>
            <h3 style="margin:0; color:var(--primary-dark);">🛡️ غرفة العمليات ولوحة التحكم الإدارية</h3>
            <small>المستخدم: <strong>${window.currentUser?.name || 'رئيس مجلس الأمناء'}</strong> (${window.currentUser?.email || cfg.adminEmail}) — هواتف المؤسسة: ${cfg.phone1} / ${cfg.phone2}</small>
          </div>
          <div class="no-print" style="display:flex; gap:8px; flex-wrap:wrap;">
            <button type="button" onclick="exportCasesCsv()" class="nav-btn btn-gold">📥 تصدير CSV / Excel</button>
            <button type="button" onclick="window.print()" class="nav-btn">🖨️ طباعة اللوحة</button>
            <button type="button" onclick="logoutUser()" class="nav-btn" style="background:#dc2626; color:#fff;">تسجيل الخروج</button>
          </div>
        </div>

        <div class="grid-4" style="margin-top:16px; text-align:center;">
          <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:12px; border-radius:10px; color:#0f172a;">
            <strong>إجمالي الحالات</strong><div style="font-size:22px; font-weight:800;">${families.length}</div>
          </div>
          <div style="background:#ecfdf5; border:1px solid #a7f3d0; padding:12px; border-radius:10px; color:#065f46;">
            <strong>موافق عليها / مستحقة</strong><div style="font-size:22px; font-weight:800;">${approvedCount}</div>
          </div>
          <div style="background:#fef2f2; border:1px solid #fecaca; padding:12px; border-radius:10px; color:#991b1b;">
            <strong>مرفوضة</strong><div style="font-size:22px; font-weight:800;">${rejectedCount}</div>
          </div>
          <div style="background:#fffbeb; border:1px solid #fde68a; padding:12px; border-radius:10px; color:#92400e;">
            <strong>التظلمات وطلبات الانضمام</strong><div style="font-size:22px; font-weight:800;">${grievances.length + memberships.length}</div>
          </div>
        </div>

        <div class="no-print" style="display:flex; gap:8px; flex-wrap:wrap; margin-top:18px; border-bottom:1px solid var(--border); padding-bottom:12px;">
          <button type="button" onclick="switchAdminTab('cases')" class="nav-btn btn-primary">📁 الحالات والتقييم والتوزيع</button>
          <button type="button" onclick="switchAdminTab('grievances')" class="nav-btn">⚖️ التظلمات وطلبات الانضمام والأعضاء</button>
          <button type="button" onclick="switchAdminTab('achievements')" class="nav-btn">🏆 إدارة الإنجازات</button>
          <button type="button" onclick="switchAdminTab('roles')" class="nav-btn">👥 الصلاحيات والحسابات والهواتف</button>
          <button type="button" onclick="switchAdminTab('official')" class="nav-btn btn-gold">📜 محاضر مجلس الأمناء والتفويضات والأوراق</button>
        </div>

        <div id="admin-tab-cases" style="margin-top:16px;">
          <table>
            <thead>
              <tr>
                <th>كود الطلب</th>
                <th>الاسم والعنوان</th>
                <th>نوع التدخل</th>
                <th>الدخل / المصروف / العجز</th>
                <th>الحالة والتقييم</th>
                <th>المُقيّم / الباحث</th>
                <th class="no-print">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              ${families.length === 0 ? '<tr><td colspan="7" style="text-align:center;">لا توجد حالات مسجلة في قاعدة البيانات بعد.</td></tr>' : families.map(f => {
                const h = f.husband_data || {};
                const name = [h.name1, h.name2, h.name3].filter(Boolean).join(' ') || 'بدون اسم';
                const inc = Number(f.total_income || 0);
                const exp = Number(f.total_expenses || 0);
                const diff = inc - exp;
                return `
                  <tr>
                    <td><strong>${f.tracking_code}</strong></td>
                    <td>${name}<br><small>${f.governorate || ''} - ${f.center_city || ''} - ${f.village_hamlet || ''}</small></td>
                    <td>${f.intervention_type || ''}</td>
                    <td>دخل: ${inc} | مصروف: ${exp}<br><small>${diff < 0 ? 'عجز: ' + Math.abs(diff) : 'فائض: ' + diff}</small></td>
                    <td>
                      <select onchange="updateCaseDecision('${f.id}', this.value, null)" style="margin:0; padding:4px;">
                        <option value="pending" ${f.status==='pending'?'selected':''}>قيد المراجعة</option>
                        <option value="approved" ${f.status==='approved'?'selected':''}>مقبول / مستحق</option>
                        <option value="rejected" ${f.status==='rejected'?'selected':''}>مرفوض</option>
                      </select>
                    </td>
                    <td>
                      <input value="${f.evaluated_by || ''}" placeholder="من قيّم الحالة؟" onchange="updateCaseDecision('${f.id}', null, this.value)" style="margin:0; padding:4px; font-size:12px;">
                    </td>
                    <td class="no-print">
                      <button type="button" onclick="alert('الملاحظات: ' + (${JSON.stringify(f.researcher_notes || 'لا توجد ملاحظات')}))" class="nav-btn" style="padding:4px 8px; font-size:11px;">تفاصيل</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div id="admin-tab-grievances" class="hidden" style="margin-top:16px;">
          <h4>⚖️ التظلمات السرية الواردة</h4>
          <table>
            <thead><tr><th>الكود</th><th>الاسم والهاتف</th><th>العنوان والنوع</th><th>التفاصيل</th></tr></thead>
            <tbody>
              ${grievances.length === 0 ? '<tr><td colspan="4" style="text-align:center;">لا توجد تظلمات مسجلة.</td></tr>' : grievances.map(g => `
                <tr>
                  <td><strong>${g.tracking_code}</strong></td>
                  <td>${g.full_name}<br><small>${g.phone}</small></td>
                  <td>${g.grievance_type}<br><small>${g.address_details}</small></td>
                  <td>${g.message_body}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h4 style="margin-top:20px;">👥 طلبات الانضمام (باحثون / متطوعون / شركاء / مانحون)</h4>
          <table>
            <thead><tr><th>الكود</th><th>الاسم والهاتف والبريد</th><th>الصفة والملاحظات</th><th>الحالة والاعتماد</th></tr></thead>
            <tbody>
              ${memberships.length === 0 ? '<tr><td colspan="4" style="text-align:center;">لا توجد طلبات انضمام.</td></tr>' : memberships.map((m, idx) => {
                const codeVal = m.request_code || m.id || idx;
                const roleSelId = 'mem-role-' + idx;
                const statusSelId = 'mem-status-' + idx;
                return `
                  <tr>
                    <td><strong>${m.request_code || '-'}</strong></td>
                    <td>${m.full_name || ''}<br><small>${m.phone || ''} | ${m.email || ''}</small></td>
                    <td>
                      <select id="${roleSelId}" style="margin:0 0 4px; padding:4px; font-size:12px;">
                        <option value="researcher" ${m.requested_role==='researcher'?'selected':''}>باحث ميداني</option>
                        <option value="volunteer" ${m.requested_role==='volunteer'?'selected':''}>متطوع</option>
                        <option value="partner" ${m.requested_role==='partner'?'selected':''}>جهة شريكة / جمعية</option>
                        <option value="donor" ${m.requested_role==='donor'?'selected':''}>جهة مانحة</option>
                      </select>
                      <br><small>${m.notes || ''}</small>
                    </td>
                    <td>
                      <select id="${statusSelId}" style="margin:0 0 4px; padding:4px; font-size:12px;">
                        <option value="pending" ${(m.status||'pending')==='pending'?'selected':''}>⏳ قيد المراجعة</option>
                        <option value="approved" ${m.status==='approved'?'selected':''}>✅ مقبول ومفعل</option>
                        <option value="rejected" ${m.status==='rejected'?'selected':''}>❌ مرفوض</option>
                      </select>
                      <br>
                      <button type="button" onclick="updateMembershipDecision('${codeVal}', document.getElementById('${statusSelId}').value, document.getElementById('${roleSelId}').value)" class="nav-btn btn-primary" style="padding:4px 8px; font-size:11px;">حفظ القرار</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div id="admin-tab-achievements" class="hidden" style="margin-top:16px;"></div>

        <div id="admin-tab-roles" class="hidden" style="margin-top:16px;">
          <div class="grid-2">
            <div style="background:var(--bg-color); padding:14px; border-radius:10px; border:1px solid var(--border);">
              <h4 style="margin-top:0;">🔑 تغيير البريد الإلكتروني وكلمة السر وأرقام الهواتف والبيانات المؤسسية</h4>
              <label style="font-size:12px; font-weight:700;">البريد الإلكتروني للإدارة:</label>
              <input id="cfg-admin-email" type="email" value="${cfg.adminEmail}" placeholder="البريد الإلكتروني الجديد">

              <label style="font-size:12px; font-weight:700;">كلمة السر للإدارة:</label>
              <input id="cfg-admin-pass" type="text" value="${cfg.adminPass}" placeholder="كلمة السر الجديدة">

              <label style="font-size:12px; font-weight:700;">رقم الهاتف الأول للمؤسسة:</label>
              <input id="cfg-phone-1" value="${cfg.phone1}" placeholder="01000880156">

              <label style="font-size:12px; font-weight:700;">رقم الهاتف الثاني للمؤسسة:</label>
              <input id="cfg-phone-2" value="${cfg.phone2}" placeholder="01155540066">

              <label style="font-size:12px; font-weight:700;">اسم المؤسسة:</label>
              <input id="cfg-org-name" value="${cfg.orgName}" placeholder="مؤسسة الحافظ للتنمية والخدمات">

              <label style="font-size:12px; font-weight:700;">رقم الإشهار:</label>
              <input id="cfg-reg-no" value="${cfg.regNo}" placeholder="مشهرة برقم 2202 لسنة 2025">

              <button type="button" onclick="saveFoundationAndAdminSettings()" class="action-btn" style="margin-top:6px;">حفظ الإعدادات بالكامل</button>
            </div>

            <div style="background:var(--bg-color); padding:14px; border-radius:10px; border:1px solid var(--border);">
              <h4 style="margin-top:0;">🛡️ مصفوفة الصلاحيات حسب الدور</h4>
              <ul style="font-size:13px; padding-right:18px; margin:0; line-height:1.9;">
                <li><strong>رئيس مجلس الأمناء / الإدارة:</strong> إدارة كاملة للحالات، التوزيع، الاعتماد، قبول/رفض طلبات الانضمام، تعديل وحذف حسابات الأعضاء، تعديل بيانات الدخول والهواتف، التقارير، والمحاضر والتفويضات.</li>
                <li><strong>الباحث الميداني:</strong> تسجيل البحوث، إدخال التوصيات، ومتابعة الحالات المسندة إليه.</li>
                <li><strong>المتطوع:</strong> المشاركة في الأنشطة والقوافل الميدانية المسندة.</li>
                <li><strong>الجهة الشريكة / المانحة:</strong> متابعة التقارير والإحصاءات وحالات التنفيذ المتفق عليها ضمن نطاق الشراكة.</li>
              </ul>
            </div>
          </div>

          <div style="margin-top:24px; background:var(--bg-color); padding:16px; border-radius:12px; border:1px solid var(--border);">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
              <h4 style="margin:0; color:var(--primary-dark);">👤 إدارة حسابات الأعضاء (باحثون / متطوعون / شركاء / مانحون) — تعديل / تغيير بريد ورقم سري / حذف</h4>
              <input id="mgr-mem-search" oninput="refreshMembersTableOnly()" placeholder="ابحث بالاسم أو الهاتف أو البريد أو الكود..." style="max-width:300px; margin:0; padding:6px 10px; font-size:12px;">
            </div>

            <input type="hidden" id="mgr-mem-editing-code">
            <div class="grid-3" style="margin-bottom:10px;">
              <input id="mgr-mem-name" placeholder="الاسم الكامل أو اسم الجهة *" style="margin:0;">
              <select id="mgr-mem-role" style="margin:0;">
                <option value="researcher">باحث ميداني</option>
                <option value="volunteer">متطوع</option>
                <option value="partner">جهة شريكة / جمعية</option>
                <option value="donor">جهة مانحة</option>
              </select>
              <select id="mgr-mem-status" style="margin:0;">
                <option value="active">✅ نشط (مسموح بالدخول)</option>
                <option value="suspended">⛔ موقوف مؤقتاً</option>
              </select>
              <input id="mgr-mem-phone" placeholder="رقم الهاتف (11 رقم) *" style="margin:0;">
              <input id="mgr-mem-email" type="email" placeholder="البريد الإلكتروني *" style="margin:0;">
              <input id="mgr-mem-pass" type="text" placeholder="كلمة السر / الرقم السري *" style="margin:0;">
            </div>

            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px;">
              <button id="mgr-mem-save-btn" type="button" onclick="addOrUpdateMemberAccount()" class="action-btn">+ إضافة / حفظ حساب العضو</button>
              <button type="button" onclick="resetMemberForm()" class="nav-btn">تفريغ الحقول</button>
            </div>

            <table>
              <thead>
                <tr>
                  <th>الكود</th>
                  <th>الاسم والهاتف</th>
                  <th>الصفة / الدور</th>
                  <th>البريد والرقم السري</th>
                  <th>الحالة</th>
                  <th class="no-print">إجراءات</th>
                </tr>
              </thead>
              <tbody id="managed-members-tbody"></tbody>
            </table>
          </div>
        </div>

        <div id="admin-tab-official" class="hidden" style="margin-top:16px;">
          <div class="no-print" style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px;">
            <button type="button" onclick="renderOfficialForm('board_minutes')" class="action-btn">📋 نموذج محضر مجلس الأمناء</button>
            <button type="button" onclick="renderOfficialForm('delegation')" class="action-btn" style="background:#b45309;">📄 نموذج التفويض الرسمي</button>
            <button type="button" onclick="renderOfficialForm('official_letter')" class="nav-btn">✉️ مستند / خطاب رسمي بنفس الصيغة</button>
          </div>
          <div id="official-doc-editor"></div>
        </div>
      </div>
    `;

    window.refreshMembersTableOnly();
    renderOfficialForm('board_minutes');
  };

  window.switchAdminTab = function(tab) {
    ['cases', 'grievances', 'achievements', 'roles', 'official'].forEach(t => {
      document.getElementById('admin-tab-' + t)?.classList.toggle('hidden', t !== tab);
    });
    if (tab === 'achievements' && typeof window.renderAdminAchievementsManager === 'function') {
      window.renderAdminAchievementsManager();
    } else if (tab === 'roles') {
      window.refreshMembersTableOnly();
    }
  };

  window.updateCaseDecision = async function(id, statusVal, evaluatorVal) {
    if (!window.supabaseClient) return;
    const updateObj = {};
    if (statusVal) updateObj.status = statusVal;
    if (evaluatorVal !== null) {
      updateObj.evaluated_by = evaluatorVal;
      updateObj.evaluated_at = new Date().toISOString();
    }
    const { error } = await window.supabaseClient.from('families').update(updateObj).eq('id', id);
    if (error) alert('خطأ في التحديث: ' + error.message);
    else renderDashboard();
  };

  window.exportCasesCsv = async function() {
    let rows = [];
    if (window.supabaseClient) {
      const { data } = await window.supabaseClient.from('families').select('*');
      if (data) rows = data;
    }
    const headers = ['tracking_code', 'intervention_type', 'governorate', 'center_city', 'village_hamlet', 'total_income', 'total_expenses', 'status', 'eligibility_verdict', 'evaluated_by'];
    const csvLines = [
      headers.join(','),
      ...rows.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))
    ];
    const blob = new Blob(['\uFEFF' + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alhafiz-cases-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- محرر محاضر مجلس الأمناء والتفويضات والمستندات الرسمية ---
  window.addDynamicLine = function(containerId, placeholderText, numbered = true) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const count = container.querySelectorAll('.dyn-line-row').length;
    const nextNum = numbered ? (count + 2) : (count + 1);
    const row = document.createElement('div');
    row.className = 'dyn-line-row';
    row.style.cssText = 'display:flex; align-items:center; gap:6px; margin:4px 0;';
    row.innerHTML = `
      ${numbered ? `<span class="line-num" style="font-weight:700; min-width:22px;">${nextNum}-</span>` : ''}
      <input type="text" class="doc-line-input" placeholder="${placeholderText || '........................................................................'}" style="flex:1; margin:0; padding:5px 8px;">
      <button type="button" onclick="removeDynamicLine(this, '${containerId}', ${numbered})" class="no-print" style="background:#fee2e2; color:#991b1b; border:1px solid #fecaca; border-radius:6px; padding:4px 8px; cursor:pointer; font-size:12px;">✕</button>
    `;
    container.appendChild(row);
  };

  window.removeDynamicLine = function(btn, containerId, numbered = true) {
    const row = btn.closest('.dyn-line-row');
    if (row) row.remove();
    if (!numbered) return;
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('.dyn-line-row').forEach((r, idx) => {
      const numSpan = r.querySelector('.line-num');
      if (numSpan) numSpan.innerText = (idx + 2) + '-';
    });
  };

  window.printOfficialDocumentOnly = function() {
    const sheet = document.getElementById('printable-official-sheet');
    if (!sheet) return;

    const clone = sheet.cloneNode(true);
    clone.querySelectorAll('.no-print').forEach(el => el.remove());

    clone.querySelectorAll('input, textarea').forEach(el => {
      const val = (el.value || '').trim();
      const span = document.createElement(el.tagName === 'TEXTAREA' ? 'div' : 'span');
      span.style.cssText = 'font-weight:700; color:#0f172a; padding:0 4px; border-bottom:1px dotted #64748b; display:inline-block; min-width:60px;';
      if (el.tagName === 'TEXTAREA') {
        span.style.cssText = 'font-weight:600; color:#0f172a; white-space:pre-wrap; line-height:1.9; margin:6px 0;';
      }
      span.textContent = val || (el.placeholder || '....................');
      el.replaceWith(span);
    });

    const printWin = window.open('', '_blank', 'width=900,height=1000');
    if (!printWin) return alert('يرجى السماح بفتح النوافذ المنبثقة للطباعة.');

    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>طباعة مستند رسمي - مؤسسة الحافظ</title>
        <style>
          @page { size: A4; margin: 16mm; }
          body {
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #0f172a;
            background: #fff;
            direction: rtl;
          }
          .sheet-wrap {
            border: 1px solid #cbd5e1;
            padding: 22px 26px;
            min-height: 255mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-sizing: border-box;
          }
        </style>
      </head>
      <body>
        <div class="sheet-wrap">${clone.innerHTML}</div>
        <script>
          window.onload = function() {
            window.focus();
            window.print();
          };
        <\/script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  window.renderOfficialForm = function(type) {
    const box = document.getElementById('official-doc-editor');
    if (!box) return;
    const cfg = window.getFoundationSettings();

    const headerHtml = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #064e3b; padding-bottom:10px; margin-bottom:16px; font-size:12px;">
        <div style="line-height:1.7;">
          <strong>مديرية التضامن الاجتماعي ببني سويف</strong><br>
          إدارة إهناسيا الاجتماعية<br>
          <strong>${cfg.orgName}</strong><br>
          ${cfg.regNo}
        </div>
        <div style="text-align:left;">
          <img src="logo.jpg" alt="شعار المؤسسة" style="height:56px; width:56px; border-radius:50%; border:1px solid #b45309; object-fit:cover;" onerror="this.style.display='none'">
        </div>
      </div>
    `;

    const footerHtml = `
      <div style="border-top:1px solid #94a3b8; margin-top:24px; padding-top:8px; display:flex; justify-content:space-between; font-size:11px; color:#475569;">
        <span>${cfg.phone1} - ${cfg.phone2}</span>
        <span>${cfg.adminEmail} | https://alhafiz-eg.azurewebsites.net</span>
      </div>
    `;

    if (type === 'board_minutes') {
      box.innerHTML = `
        <div id="printable-official-sheet" class="card" style="background:#fff; color:#0f172a;">
          <div>
            ${headerHtml}
            <h4 style="text-align:center; text-decoration:underline; margin:6px 0 16px; font-size:17px;">
              محضر مجلس الأمناء رقم ( <input id="bm-num" placeholder="...." style="width:80px; display:inline; padding:4px; margin:0; text-align:center;"> )
            </h4>

            <div style="margin-bottom:14px;">
              <strong style="text-decoration:underline; font-size:14px;">جدول الأعمال</strong>
              <div style="margin-top:6px; font-size:13px;">
                <div style="margin-bottom:4px;">1- النظر في الجلسة السابقة والتصديق عليها</div>
                <div id="bm-agenda-lines"></div>
                <button type="button" onclick="addDynamicLine('bm-agenda-lines', '................................................', true)" class="nav-btn no-print" style="margin-top:6px; font-size:12px; padding:4px 10px;">+ إضافة سطر</button>
              </div>
            </div>

            <div style="margin-bottom:12px;">
              <div style="text-align:center; font-weight:700; text-decoration:underline; margin-bottom:8px; font-size:15px;">محضر الجلسة</div>
              <p style="font-size:13px; line-height:2.1; margin:0;">
                إنه في يوم <input id="bm-day" placeholder="الأربعاء" style="width:110px; display:inline; padding:4px; margin:0;">
                الموافق <input id="bm-date" placeholder="يوم/شهر/سنة" style="width:130px; display:inline; padding:4px; margin:0;">
                وفي تمام الساعة <input id="bm-time" placeholder=".... ص" style="width:90px; display:inline; padding:4px; margin:0;">
                بمقر المؤسسة اجتمع أعضاء مجلس الأمناء برئاسة السيد /
                <input id="bm-chairman" placeholder="..............." style="width:180px; display:inline; padding:4px; margin:0;"> رئيس مجلس الأمناء
                و السيد <input id="bm-acting-name" placeholder="......................" style="width:180px; display:inline; padding:4px; margin:0;">
                بصفته <input id="bm-acting-role" placeholder="............." style="width:130px; display:inline; padding:4px; margin:0;">
                قائم بأعمال <input id="bm-acting-duty" placeholder="....................." style="width:160px; display:inline; padding:4px; margin:0;">
              </p>
            </div>

            <div style="margin-bottom:12px; font-size:13px;">
              <strong>بحضور كلا من:-</strong>
              <div id="bm-attendees-lines" style="margin-top:4px;"></div>
              <button type="button" onclick="addDynamicLine('bm-attendees-lines', '........................................', false)" class="nav-btn no-print" style="margin-top:6px; font-size:12px; padding:4px 10px;">+ إضافة سطر</button>
            </div>

            <p style="font-size:13px; line-height:2; margin:10px 0;">
              ونظراً لاكتمال النصاب القانوني لاجتماع مجلس الأمناء بحضور (
              <input id="bm-quorum" placeholder="... الأعضاء" style="width:110px; display:inline; padding:4px; margin:0; text-align:center;">
              ) تم بدء النظر في جدول الأعمال واتخاذ القرارات الآتية:
            </p>

            <div style="font-size:13px; margin-bottom:14px;">
              <div style="margin-bottom:4px;">1- تُلي محضر مجلس الجلسة السابقة والتصديق عليه</div>
              <div id="bm-decisions-lines"></div>
              <button type="button" onclick="addDynamicLine('bm-decisions-lines', '................................................', true)" class="nav-btn no-print" style="margin-top:6px; font-size:12px; padding:4px 10px;">+ إضافة سطر</button>
            </div>

            <p style="font-size:13px; margin-top:14px;">
              الانتهاء من النظر في جدول الأعمال ورُفعت الجلسة في تمام الساعة
              <input id="bm-end" placeholder=".........." style="width:100px; display:inline; padding:4px; margin:0; text-align:center;"> صباحاً
            </p>

            <div style="display:flex; justify-content:space-between; margin-top:28px; padding:0 24px; font-weight:700; font-size:14px;">
              <span>سكرتير المؤسسة</span>
              <span>رئيس مجلس الأمناء</span>
            </div>
          </div>
          ${footerHtml}
        </div>
        <div class="no-print" style="margin-top:12px; display:flex; gap:10px;">
          <button type="button" onclick="saveOfficialDoc('board_minutes')" class="action-btn">💾 حفظ المحضر</button>
          <button type="button" onclick="printOfficialDocumentOnly()" class="nav-btn btn-gold">🖨️ طباعة المحضر فقط</button>
        </div>
      `;
      window.addDynamicLine('bm-agenda-lines', '................................................', true);
      window.addDynamicLine('bm-attendees-lines', '........................................', false);
      window.addDynamicLine('bm-decisions-lines', '................................................', true);
    } else if (type === 'delegation') {
      box.innerHTML = `
        <div id="printable-official-sheet" class="card" style="background:#fff; color:#0f172a;">
          <div>
            ${headerHtml}
            <p style="font-weight:700; font-size:14px;">السادة الأفاضل / <input id="del-to" placeholder="............................................." style="width:65%; display:inline; padding:4px; margin:0;"></p>
            <p style="text-align:center; font-weight:700; font-size:15px;">تحية طيبة وبعد،،،</p>
            <p style="font-size:13px; line-height:2;">
              تتشرف مؤسسة الحافظ، المشهرة برقم (2202) لسنة 2025 ونطاق عملها جمهورية مصر العربية، بأن تتقدم لسيادتكم بوافر التقدير على دوركم الرائد في العمل الأهلي.<br>
              وفي إطار سعي المؤسسة لتوسيع دائرة التعاون مع مؤسستكم الموقرة لخدمة الفئات الأولى بالرعاية، فقد تقرر:<br>
              <strong>تفويض السيد/ه</strong> <input id="del-name" placeholder="............................................." style="width:60%; display:inline; padding:4px; margin:2px 0;"><br>
              <strong>بطاقة رقم قومي</strong> <input id="del-nid" maxlength="14" placeholder="............................................." style="width:60%; display:inline; padding:4px; margin:2px 0;"><br>
              <strong>بصفته /</strong> <input id="del-role" placeholder="............................................." style="width:65%; display:inline; padding:4px; margin:2px 0;"><br>
              وذلك للتمثيل والتنسيق والتعامل في كافة الأنشطة والخدمات والتي تشمل: مشروعات البنية التحتية، المساعدات الموسمية، الجانب الطبي، التمكين الاقتصادي، والجانب الاجتماعي، وللمفوض الحق في تقديم طلبات التعاون وتوقيع محاضر التنسيق الميداني واستلام وتسليم الكشوف والبحوث الاجتماعية الخاصة بالمستفيدين وتمثيل المؤسسة في الاجتماعات التنسيقية والمتابعة الميدانية.<br>
              هذا التفويض سارٍ من تاريخه وحتى إلغاؤه رسمياً.
            </p>
            <p style="text-align:center; font-weight:700; margin-top:12px;">وتفضلوا بقبول فائق الاحترام والتقدير،،،</p>
            <div style="margin-top:20px; font-weight:700; font-size:13px; line-height:2;">
              اعتماد رئيس مجلس الأمناء<br>
              الاسم: <input id="del-sign" placeholder="............................" style="width:220px; display:inline; padding:4px; margin:0;"><br>
              الختم:
            </div>
          </div>
          ${footerHtml}
        </div>
        <div class="no-print" style="margin-top:12px; display:flex; gap:10px;">
          <button type="button" onclick="saveOfficialDoc('delegation')" class="action-btn">💾 حفظ التفويض</button>
          <button type="button" onclick="printOfficialDocumentOnly()" class="nav-btn btn-gold">🖨️ طباعة التفويض فقط</button>
        </div>
      `;
    } else {
      box.innerHTML = `
        <div id="printable-official-sheet" class="card" style="background:#fff; color:#0f172a;">
          <div>
            ${headerHtml}
            <div style="font-size:15px; font-weight:800; margin-top:10px;">
              السيد / <input id="let-to" placeholder="................................................" style="width:72%; display:inline; padding:4px; margin:0;">
            </div>
            <p style="text-align:center; font-weight:700; font-size:15px; margin:14px 0;">تحية طيبة وبعد،</p>
            <div style="font-size:14px; font-weight:700; margin-bottom:10px;">
              الموضوع: <input id="let-subj" placeholder="................................................" style="width:75%; display:inline; padding:4px; margin:0;">
            </div>
            <div id="let-body-lines" style="margin-top:8px;"></div>
            <button type="button" onclick="addDynamicLine('let-body-lines', '........................................................................', false)" class="nav-btn no-print" style="margin-top:6px; font-size:12px; padding:4px 10px;">+ إضافة سطر</button>

            <p style="text-align:center; font-weight:700; font-size:15px; margin-top:28px;">وتفضلوا بقبول وافر التحية والتقدير،</p>
            <div style="text-align:left; font-weight:700; font-size:14px; margin-top:24px; padding-left:24px;">
              رئيس مجلس الأمناء
            </div>
          </div>
          ${footerHtml}
        </div>
        <div class="no-print" style="margin-top:12px; display:flex; gap:10px;">
          <button type="button" onclick="saveOfficialDoc('official_letter')" class="action-btn">💾 حفظ المستند</button>
          <button type="button" onclick="printOfficialDocumentOnly()" class="nav-btn btn-gold">🖨️ طباعة المستند فقط</button>
        </div>
      `;
      window.addDynamicLine('let-body-lines', '........................................................................', false);
    }
  };

  window.saveOfficialDoc = async function(docType) {
    const code = 'DOC-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const inputs = {};
    document.querySelectorAll('#official-doc-editor input, #official-doc-editor textarea').forEach(el => {
      if (el.id) inputs[el.id] = el.value;
    });
    const dynamicLines = [];
    document.querySelectorAll('#official-doc-editor .doc-line-input').forEach(inp => {
      dynamicLines.push(inp.value);
    });
    inputs.dynamicLines = dynamicLines;

    const record = {
      doc_code: code,
      doc_type: docType,
      doc_title: docType === 'board_minutes' ? 'محضر مجلس الأمناء' : (docType === 'delegation' ? 'تفويض رسمي' : 'مستند / خطاب رسمي'),
      doc_date: new Date().toISOString().slice(0, 10),
      payload: inputs,
      created_by: window.currentUser?.email || DEFAULT_ADMIN.email
    };

    const list = JSON.parse(localStorage.getItem('hf_official_docs') || '[]');
    list.unshift(record);
    localStorage.setItem('hf_official_docs', JSON.stringify(list));

    if (window.supabaseClient) {
      await window.supabaseClient.from('official_documents').insert([record]);
    }
    alert('✅ تم حفظ النموذج الرسمي بنجاح برقم: ' + code);
  };
})();
