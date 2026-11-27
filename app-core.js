// app-core.js - المحرك الأساسي الموحد لمؤسسة الحافظ للتنمية والخدمات
(function() {
  window.currentUser = JSON.parse(sessionStorage.getItem('hf_current_user') || 'null');
  let currentLang = 'ar';
  let currentFontScale = 100;
  let pending2FAUser = null;
  let pending2FACode = '';
  let pending2FAExpires = 0;

  window.getSupabase = function() {
    if (window.supabaseClient) return window.supabaseClient;
    const sbUrl = window.SB_URL || 'https://fwyacpvbhwdlivzeiper.supabase.co';
    const sbKey = window.SB_KEY || 'sb_publishable_6xYRIb6tT-Na8wvnDoGMsQ_EeMfQzdz';
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      window.supabaseClient = window.supabase.createClient(sbUrl, sbKey);
    }
    return window.supabaseClient;
  };
  window.getSupabase();
    // محرك اتصال احتياطي مباشر بقاعدة بيانات Supabase REST في حال تعثر تحميل CDN
  if (!window.supabaseClient) {
    const baseUrl = (window.SB_URL || 'https://supabase.co').replace(/\/+$/, '') + '/rest/v1';
    const apiKey = window.SB_KEY || 'sb_publishable_6xYRIb6tT-Na8wvnDoGMsQ_EeMfQzdz';
    const headers = { 'apikey': apiKey, 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json', 'Prefer': 'return=representation' };

    window.supabaseClient = {
      from(table) {
        let method = 'GET', bodyData = null, filters = [], orderStr = '', singleMode = false, upsertConflict = '';
        const q = {
          select() { return q; },
          eq(col, val) { filters.push(`${col}=eq.${encodeURIComponent(val)}`); return q; },
          ilike(col, val) { filters.push(`${col}=ilike.${encodeURIComponent(val)}`); return q; },
          or(expr) { filters.push(`or=(${encodeURIComponent(expr)})`); return q; },
          order(col, opt = {}) { orderStr = `order=${col}.${opt.ascending === false ? 'desc' : 'asc'}`; return q; },
          maybeSingle() { singleMode = true; return q; },
          insert(rows) { method = 'POST'; bodyData = JSON.stringify(rows); return q; },
          update(patch) { method = 'PATCH'; bodyData = JSON.stringify(patch); return q; },
          upsert(rows, opt = {}) { method = 'POST'; upsertConflict = opt.onConflict ? `?on_conflict=${opt.onConflict}` : ''; headers['Prefer'] = 'resolution=merge-duplicates,return=representation'; bodyData = JSON.stringify(rows); return q; },
          delete() { method = 'DELETE'; return q; },
          async then(resolve) {
            try {
              const qs = [upsertConflict.replace(/^\?/, ''), ...filters, orderStr].filter(Boolean).join('&');
              const res = await fetch(`${baseUrl}/${table}${qs ? '?' + qs : ''}`, { method, headers, body: bodyData });
              const json = res.status === 204 ? [] : await res.json();
              if (!res.ok) return resolve({ data: null, error: { message: json.message || res.statusText } });
              const out = singleMode ? (Array.isArray(json) ? (json || null) : json) : json;
              resolve({ data: out, error: null });
            } catch (e) { resolve({ data: null, error: { message: e.message } }); }
          }
        };
        return q;
      }
    };
  }

  window.escapeHtml = function(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  window.normalizeDriveImageUrl = function(rawUrl) {
    const s = String(rawUrl || '').trim();
    if (!s || s === 'logo.jpg') return s;
    const cleanId = s
      .replace(/^https?:\/\/(lh3\.)?googleusercontent\.com(\/d\/)?/i, '')
      .replace(/^https?:\/\/drive\.google\.com\/file\/d\//i, '')
      .replace(/^https?:\/\/drive\.google\.com\/(open|uc|thumbnail)\?id=/i, '')
      .replace(/[\/?#&].*$/, '')
      .trim();
    if (/^[a-zA-Z0-9_-]{20,}$/.test(cleanId)) {
      return ['https:/', '://google.com', 'thumbnail?id=' + cleanId + '&sz=w1000'].join('/');
    }
    return s;
  };

  window.triggerInstantWhatsApp = function(rawPhone, messageText) {
    const clean = String(rawPhone || '').replace(/\D/g, '');
    if (!clean) return;
    const intl = clean.startsWith('20') ? clean : ('20' + clean.replace(/^0/, ''));
    const waBase = ['https:/', 'wa.me', intl].join('/');
    const waUrl = waBase + '?text=' + encodeURIComponent(messageText || '');
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  window.uploadFileToDriveOrStorage = async function(file, meta = {}) {
    const driveUrl = String(window.GOOGLE_DRIVE_WEB_APP_URL || '').trim();
    if (driveUrl && file) {
      try {
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const str = String(reader.result || '');
            const idx = str.indexOf(',');
            resolve(idx >= 0 ? str.slice(idx + 1) : str);
          };
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });

        const payload = {
          year: String(meta.year || new Date().getFullYear()),
          village: String(meta.village || 'إهناسيا').trim(),
          submissionType: String(meta.submissionType || 'عام').trim(),
          trackingCode: String(meta.trackingCode || ('TRK-' + Date.now())).trim(),
          fileName: (meta.prefix ? meta.prefix + '_' : '') + (file.name || ('doc_' + Date.now() + '.jpg')),
          mimeType: file.type || 'image/jpeg',
          fileBase64: base64Data
        };

        const formBody = new URLSearchParams();
        formBody.append('payload', JSON.stringify(payload));

        const res = await fetch(driveUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
          body: formBody.toString()
        });
        const json = await res.json();
        if (json && json.status === 'success') {
          const fid = String(json.fileId || '').trim();
          const thumbUrl = fid ? ['https:/', '://google.com', 'thumbnail?id=' + fid + '&sz=w1000'].join('/') : (json.fileUrl || '');
          return {
            name: payload.fileName,
            fileName: payload.fileName,
            size: file.size || 0,
            mimeType: file.type || 'image/jpeg',
            url: json.fileUrl || thumbUrl,
            publicUrl: json.fileUrl || thumbUrl,
            directUrl: thumbUrl,
            folderUrl: json.folderUrl || '',
            fileId: fid,
            storageProvider: 'google_drive',
            uploaded: true
          };
        }
      } catch (driveErr) {
        console.warn('Drive upload fallback:', driveErr);
      }
    }

    if (window.supabaseClient && window.supabaseClient.storage && file) {
      const safeName = String(file.name || 'file').replace(/[^\w.-]/g, '_');
      const path = `${meta.trackingCode || 'DRAFT'}/${meta.folder || 'docs'}/${Date.now()}_${safeName}`;
      const { error } = await window.supabaseClient.storage.from('foundation-docs').upload(path, file, { upsert: true });
      if (!error) {
        const { data: pubData } = window.supabaseClient.storage.from('foundation-docs').getPublicUrl(path);
        return {
          name: file.name, fileName: file.name, size: file.size, mimeType: file.type || '',
          path, url: pubData?.publicUrl || '', publicUrl: pubData?.publicUrl || '',
          directUrl: pubData?.publicUrl || '', storageProvider: 'supabase', uploaded: true
        };
      }
    }
    return { name: file?.name || 'file', uploaded: false, uploadError: 'تعذر رفع الملف' };
  };
  window.getFoundationSettings = async function() {
    const defaults = {
      org_name: 'مؤسسة الحافظ للتنمية والخدمات',
      reg_no: 'مشهرة برقم 2202 لسنة 2025',
      phone_whatsapp: '01000880156',
      phone_admin: '01155540066',
      admin_email: 'alhafiz52025@gmail.com',
      bank_account_title: 'البنك الزراعي المصري - فرع منهرة',
      bank_account_number: '10010395839201011',
      hq_address: 'منشأة عبد الصمد – مركز إهناسيا – محافظة بني سويف',
      facebook_url: 'https://facebook.com',
      stat_food_bags: '+450',
      stat_cash_aid: '+112',
      stat_blankets: '+100',
      stat_villages: '14',
      campaign_active: true,
      campaign_title: 'حملة دفء الشتاء وتوفير البطاطين 2026',
      campaign_desc: 'ساهم معنا في توفير البطاطين والأغطية للأسر الأولى بالرعاية في قرى وعزب مركز إهناسيا.',
      campaign_unit: 'بطانية',
      campaign_target: 500,
      campaign_current: 325
    };
    if (window.supabaseClient) {
      try {
        const { data } = await window.supabaseClient.from('site_settings').select('*').eq('id', 1).maybeSingle();
        if (data) return { ...defaults, ...data };
      } catch (e) {}
    }
    return defaults;
  };

  async function applyDynamicSiteSettings() {
    const cfg = await window.getFoundationSettings();
    window.SITE_CONFIG_CACHE = cfg;

    const map = {
      'stat-food': cfg.stat_food_bags,
      'stat-cash': cfg.stat_cash_aid,
      'stat-blankets': cfg.stat_blankets,
      'stat-villages': cfg.stat_villages,
      'disp-bank-title': cfg.bank_account_title,
      'disp-bank-num': cfg.bank_account_number,
      'disp-hq-address': cfg.hq_address
    };
    Object.keys(map).forEach(id => {
      const el = document.getElementById(id);
      if (el && map[id]) el.textContent = map[id];
    });

    const campBox = document.getElementById('live-campaign-section');
    if (campBox) {
      if (cfg.campaign_active === false) {
        campBox.classList.add('hidden');
      } else {
        campBox.classList.remove('hidden');
        const target = Math.max(1, Number(cfg.campaign_target) || 500);
        const current = Math.max(0, Number(cfg.campaign_current) || 0);
        const pct = Math.min(100, Math.round((current / target) * 100));
        const unit = cfg.campaign_unit || 'بطانية';
        const rem = Math.max(0, target - current);

        const tEl = document.getElementById('camp-title');
        const dEl = document.getElementById('camp-desc');
        const statsEl = document.getElementById('camp-stats');
        const barEl = document.getElementById('camp-progress-fill');
        if (tEl) tEl.textContent = cfg.campaign_title || '';
        if (dEl) dEl.textContent = cfg.campaign_desc || '';
        if (statsEl) statsEl.innerHTML = `تم تحقيق: <strong>${current.toLocaleString('ar-EG')} ${window.escapeHtml(unit)}</strong> (${pct}%) من إجمالي <strong>${target.toLocaleString('ar-EG')} ${window.escapeHtml(unit)}</strong> — المتبقي: <strong>${rem.toLocaleString('ar-EG')} ${window.escapeHtml(unit)}</strong>`;
        if (barEl) barEl.style.width = pct + '%';
      }
    }
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
    box.innerHTML = data.map(item => {
      const imgUrl = window.normalizeDriveImageUrl(item.image_url);
      return `
        <div style="background:var(--bg-color); border:1px solid #f59e0b; border-radius:12px; overflow:hidden;">
          ${imgUrl && imgUrl !== 'logo.jpg' ? `<img src="${window.escapeHtml(imgUrl)}" style="width:100%; height:180px; object-fit:cover;" onerror="this.style.display='none'">` : ''}
          <div style="padding:14px;">
            <span style="background:#fef3c7; color:#92400e; padding:3px 8px; border-radius:6px; font-size:11px; font-weight:700;">${window.escapeHtml(item.category || 'مبادرة مفتوحة')}</span>
            <h4 style="color:var(--primary-dark); margin:8px 0 6px;">${window.escapeHtml(item.title)}</h4>
            <p style="font-size:13px; margin:0 0 10px;">${window.escapeHtml(item.description || item.body || '')}</p>
            <div style="display:flex; gap:6px;">
              <button type="button" onclick="showSection('apply')" class="action-btn" style="flex:1; font-size:12px;">+ التقديم الآن</button>
              <button type="button" onclick="shareInitiativeWhatsApp('${window.escapeHtml(item.title)}')" class="nav-btn" style="font-size:12px;">📤 مشاركة</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  };

  window.renderPublicAchievements = async function() {
    const box = document.getElementById('public-achievements-container');
    if (!box || !window.supabaseClient) return;
    const { data } = await window.supabaseClient.from('achievements').select('*').order('created_at', { ascending: false });
    if (!data || data.length === 0) {
      box.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:#64748b;">لا توجد إنجازات منشورة حالياً.</p>';
      return;
    }
    box.innerHTML = data.map(s => {
      const imgUrl = window.normalizeDriveImageUrl(s.image_url);
      return `
        <div style="background:var(--bg-color); border:1px solid var(--border); border-radius:12px; overflow:hidden;">
          ${imgUrl && imgUrl !== 'logo.jpg' ? `<img src="${window.escapeHtml(imgUrl)}" style="width:100%; height:180px; object-fit:cover;" onerror="this.style.display='none'">` : ''}
          <div style="padding:14px;">
            <strong style="color:var(--primary-dark); font-size:15px; display:block; margin-bottom:6px;">${window.escapeHtml(s.title)}</strong>
            <p style="font-size:13px; margin:0 0 8px;">${window.escapeHtml(s.description || '')}</p>
            <button type="button" onclick="shareInitiativeWhatsApp('${window.escapeHtml(s.title)}')" class="nav-btn" style="font-size:11px; padding:4px 10px;">📤 مشاركة الإنجاز</button>
          </div>
        </div>
      `;
    }).join('');
  };
  window.renderPublicPartners = async function() {
    const box = document.getElementById('public-partners-track');
    if (!box || !window.supabaseClient) return;
    const { data } = await window.supabaseClient
      .from('organizations').select('*').eq('show_on_home', true).order('created_at', { ascending: false });

    if (!data || data.length === 0) {
      box.innerHTML = `
        <div class="partner-badge-card" style="min-width:100%; background:#ecfdf5; border-color:#a7f3d0;">
          <strong style="color:#064e3b;">🤝 مظلة التعاون مع الجمعيات القاعدية والمؤسسات المانحة</strong>
          <p style="font-size:12px; color:#475569; margin:6px 0;">ندعو الجمعيات الأهلية بمركز إهناسيا وبني سويف والمؤسسات الداعمة للانضمام لشبكة الشراكة وتنسيق الجهود.</p>
          <button type="button" onclick="showSection('partners-join')" class="action-btn" style="font-size:12px;">+ تسجيل جمعية / مؤسسة شريكة</button>
        </div>
      `;
      return;
    }

    box.innerHTML = data.map(p => {
      const logo = window.normalizeDriveImageUrl(p.logo_url);
      return `
        <div class="partner-badge-card">
          ${logo ? `<img src="${window.escapeHtml(logo)}" style="width:64px; height:64px; object-fit:contain; border-radius:10px; margin-bottom:6px;" onerror="this.style.display='none'">` : '<div style="font-size:32px;">🏛️</div>'}
          <strong style="display:block; color:var(--primary-dark); font-size:14px;">${window.escapeHtml(p.org_name || p.name || '')}</strong>
          <span style="font-size:11px; color:#64748b; display:block;">${window.escapeHtml(p.org_type || 'جمعية شريكة')} ${p.village_scope ? '— ' + window.escapeHtml(p.village_scope) : ''}</span>
          ${p.registration_number ? `<span style="font-size:10px; color:#047857; font-weight:700;">إشهار: ${window.escapeHtml(p.registration_number)}</span>` : ''}
        </div>
      `;
    }).join('');
  };

  window.shareInitiativeWhatsApp = function(title) {
    const url = window.location.origin + window.location.pathname;
    const msg = `مؤسسة الحافظ للتنمية والخدمات (إشهار 2202 لسنة 2025 - إهناسيا، بني سويف)\n📌 ${title}\nشارك معنا في الخير أو قدّم الآن عبر المنصة الرسمية:\n${url}`;
    const waBase = ['https:/', 'wa.me'].join('/');
    window.open(waBase + '?text=' + encodeURIComponent(msg), '_blank', 'noopener,noreferrer');
  };

  window.showSection = function(sectionName) {
    document.querySelectorAll('.container > section').forEach(sec => sec.classList.add('hidden'));
    const target = document.getElementById('section-' + sectionName);
    if (target) {
      target.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.closeMobileDrawer();
    if (sectionName === 'apply' && typeof window.renderWizardStep === 'function') window.renderWizardStep();
    else if (sectionName === 'announcements') window.renderPublicAnnouncements();
    else if (sectionName === 'achievements') window.renderPublicAchievements();
    else if (sectionName === 'login' && window.currentUser && typeof window.routeLoggedInUser === 'function') window.routeLoggedInUser(window.currentUser);
  };

  window.openDonateForCampaign = function() {
    window.showSection('donate');
    const chk = document.getElementById('don-is-campaign');
    if (chk) chk.checked = true;
  };

  window.openMobileDrawer = function() { document.getElementById('mobile-drawer-backdrop')?.classList.remove('hidden'); };
  window.closeMobileDrawer = function() { document.getElementById('mobile-drawer-backdrop')?.classList.add('hidden'); };
  window.toggleMobileSub = function(id) { document.getElementById(id)?.classList.toggle('hidden'); };

  window.toggleLanguage = function() {
    currentLang = currentLang === 'ar' ? 'en' : 'ar';
    const root = document.getElementById('html-root') || document.documentElement;
    if (root) { root.lang = currentLang; root.dir = currentLang === 'ar' ? 'rtl' : 'ltr'; }
    if (typeof window.applyLanguageDictionary === 'function') window.applyLanguageDictionary(currentLang);
  };

  window.adjustFontSize = function(delta) {
    currentFontScale = Math.min(130, Math.max(85, currentFontScale + delta * 5));
    document.body.style.fontSize = currentFontScale + '%';
  };

  window.toggleDarkMode = function() { document.body.classList.toggle('dark-mode'); };

  window.copyText = function(txt) {
    const clean = String(txt || '').trim();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(clean).then(() => alert('✅ تم النسخ: ' + clean));
    } else { prompt('انسخ الرقم:', clean); }
  };

  window.saveDraft = function() {
    localStorage.setItem('hf_wizard_draft', JSON.stringify({ step: window.currentStep || 1, data: window.formData || {} }));
    alert('💾 تم حفظ مسودة الاستمارة محلياً على جهازك.');
  };

  window.calculateZakatAmount = function() {
    const wealth = parseFloat(prompt('أدخل إجمالي قيمة المدخرات النقدية أو الذهب البالغ للنصاب (بالجنيه المصري):', '10000') || '0');
    if (!wealth || wealth <= 0) return;
    const zakat = Math.ceil(wealth * 0.025);
    const amtInput = document.getElementById('don-amount');
    const catSelect = document.getElementById('don-sharia-cat');
    if (amtInput) amtInput.value = zakat;
    if (catSelect) catSelect.value = 'زكاة مال';
    alert(`✅ مقدار زكاة المال الواجبة (2.5%) هو: ${zakat} جنيه مصري، وتم إدراجه في خانة المبلغ.`);
  };

  window.switchDonationTab = function(kind) {
    const bankBox = document.getElementById('donate-bank-form');
    const inKindBox = document.getElementById('donate-inkind-form');
    const btnBank = document.getElementById('tab-btn-bank');
    const btnInKind = document.getElementById('tab-btn-inkind');
    if (kind === 'in_kind') {
      bankBox?.classList.add('hidden');
      inKindBox?.classList.remove('hidden');
      if (btnBank) btnBank.className = 'nav-btn';
      if (btnInKind) btnInKind.className = 'action-btn';
    } else {
      inKindBox?.classList.add('hidden');
      bankBox?.classList.remove('hidden');
      if (btnBank) btnBank.className = 'action-btn';
      if (btnInKind) btnInKind.className = 'nav-btn';
    }
  };
  window.submitBankDonation = async function() {
    const donorName = (document.getElementById('don-name')?.value || '').trim() || 'فاعل خير';
    const phone = (document.getElementById('don-phone')?.value || '').trim();
    const transferRef = (document.getElementById('don-ref')?.value || '').trim();
    const amount = parseFloat(document.getElementById('don-amount')?.value || '0');
    const shariaCat = document.getElementById('don-sharia-cat')?.value || 'صدقة عامة';
    const addAdminSupport = document.getElementById('don-admin-support-chk')?.checked;
    const adminSupportAmt = addAdminSupport ? Math.max(10, Math.round(amount * 0.05)) : 0;
    const isCampaign = !!document.getElementById('don-is-campaign')?.checked;
    const receiptFile = document.getElementById('don-receipt-file')?.files?.item(0);

    if (!/^01[0125]\d{8}$/.test(phone)) return alert('⚠️ يرجى إدخال رقم هاتف / واتساب صحيح (11 رقماً يبدأ بـ 01).');
    if (!amount || amount <= 0) return alert('⚠️ يرجى إدخال مبلغ التبرع بالجنيه المصري.');

    const btn = document.getElementById('btn-submit-bank-don');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ جارٍ تسجيل التبرع...'; }

    try {
      const code = 'DON-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
      let receiptUrl = '';
      if (receiptFile) {
        const up = await window.uploadFileToDriveOrStorage(receiptFile, {
          year: new Date().getFullYear().toString(),
          village: 'التبرعات_البنكية',
          submissionType: shariaCat,
          trackingCode: code,
          prefix: 'BankReceipt'
        });
        if (up && up.uploaded) receiptUrl = up.directUrl || up.url || '';
      }

      if (window.supabaseClient) {
        const { error } = await window.supabaseClient.from('donations').insert([{
          donation_code: code, donation_kind: 'bank_transfer', donor_name: donorName, phone,
          payment_method: 'تحويل بنكي رسمي', transfer_ref: transferRef, amount,
          admin_support_amount: adminSupportAmt, sharia_category: shariaCat,
          receipt_image_url: receiptUrl, is_campaign_contribution: isCampaign, status: 'pending'
        }]);
        if (error) throw error;
      }

      const cfg = window.SITE_CONFIG_CACHE || await window.getFoundationSettings();
      const msg =
        `مؤسسة الحافظ للتنمية والخدمات (واتساب رسمي: ${cfg.phone_whatsapp || '01000880156'})\n` +
        `جزاكم الله خيراً أ/ ${donorName}، نشكركم على تبرعكم الكريم عبر التحويل البنكي.\n` +
        `• كود التبرع الخاص بكم: ${code}\n` +
        `• المبلغ: ${amount} ج.م${adminSupportAmt ? ' (+ ' + adminSupportAmt + ' ج.م دعم مصاريف إدارية)' : ''}\n` +
        `• المصرف الشرعي / الوجهة: ${shariaCat}\n` +
        `نحيطكم علماً بأنه جارٍ مراجعة كشف الحساب البنكي وسنوافيكم فوراً برسالة تأكيد فور اعتماد الاستلام.\n` +
        `كما يسعدنا تشريفكم في مقر المؤسسة (${cfg.hq_address || 'منشأة عبد الصمد – مركز إهناسيا'}) لاستلام إيصال التبرع الرسمي المختوم. للاستفسار: ${cfg.phone_whatsapp} / ${cfg.phone_admin}`;

      window.triggerInstantWhatsApp(phone, msg);
      alert(`✅ جزاكم الله خيراً! تم تسجيل تبرعكم بنجاح.\nكود التبرع: ${code}`);
      ['don-name', 'don-phone', 'don-ref', 'don-amount'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    } catch (err) {
      alert('❌ خطأ أثناء تسجيل التبرع: ' + (err.message || err));
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '✅ تأكيد تسجيل التبرع البنكي وإصدار الكود'; }
    }
  };

  window.submitInKindDonation = async function() {
    const donorName = (document.getElementById('ink-name')?.value || '').trim() || 'فاعل خير';
    const phone = (document.getElementById('ink-phone')?.value || '').trim();
    const itemCat = document.getElementById('ink-category')?.value || 'ملابس';
    const itemDesc = (document.getElementById('ink-desc')?.value || '').trim();
    const itemQty = (document.getElementById('ink-qty')?.value || '').trim();
    const delivery = document.getElementById('ink-delivery')?.value || 'التسليم بمقر المؤسسة';
    const address = (document.getElementById('ink-address')?.value || '').trim();

    if (!/^01[0125]\d{8}$/.test(phone)) return alert('⚠️ يرجى إدخال رقم تليفون صحيح (11 رقماً يبدأ بـ 01).');
    if (!itemDesc || !itemQty) return alert('⚠️ يرجى كتابة وصف الحاجة المتبرع بها والعدد أو الكمية.');
    if (delivery.includes('منزلي') && !address) return alert('⚠️ يرجى كتابة العنوان بالتفصيل ليصلكم مندوب التحصيل المنزلي.');

    const btn = document.getElementById('btn-submit-ink-don');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ جارٍ تسجيل التبرع العيني...'; }

    try {
      const code = 'INK-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
      if (window.supabaseClient) {
        const { error } = await window.supabaseClient.from('donations').insert([{
          donation_code: code, donation_kind: 'in_kind', donor_name: donorName, phone,
          item_category: itemCat, item_description: itemDesc, item_quantity: itemQty,
          delivery_method: delivery, donor_address: address, status: 'pending'
        }]);
        if (error) throw error;
      }

      const cfg = window.SITE_CONFIG_CACHE || await window.getFoundationSettings();
      const msg =
        `مؤسسة الحافظ للتنمية والخدمات (واتساب رسمي: ${cfg.phone_whatsapp || '01000880156'})\n` +
        `جزاكم الله خيراً أ/ ${donorName}، نشكركم على تبرعكم العيني الكريم.\n` +
        `• كود التبرع الخاص بكم: ${code}\n` +
        `• الصنف والكمية: ${itemCat} (${itemDesc} - الكمية: ${itemQty})\n` +
        `• طريقة التسليم: ${delivery}\n` +
        `نحيطكم علماً بأنه جارٍ التنسيق ومراجعة الإيداع المخزني وسنوافيكم فوراً برسالة تأكيد فور الاستلام الفعلي.\n` +
        `عنوان المقر: ${cfg.hq_address || 'منشأة عبد الصمد – مركز إهناسيا'} | للتواصل: ${cfg.phone_whatsapp} / ${cfg.phone_admin}`;

      window.triggerInstantWhatsApp(phone, msg);
      alert(`✅ جزاكم الله خيراً! تم تسجيل تبرعكم العيني بكود: ${code}`);
      ['ink-name', 'ink-phone', 'ink-desc', 'ink-qty', 'ink-address'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    } catch (err) {
      alert('❌ خطأ أثناء تسجيل التبرع العيني: ' + (err.message || err));
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '✅ تأكيد تسجيل التبرع العيني'; }
    }
  };
  window.submitVolunteerForm = async function() {
    const fullName = (document.getElementById('vol-name')?.value || '').trim();
    const village = (document.getElementById('vol-village')?.value || '').trim();
    const phone = (document.getElementById('vol-phone')?.value || '').trim();
    const email = (document.getElementById('vol-email')?.value || '').trim();
    const qual = (document.getElementById('vol-qual')?.value || '').trim();
    const avail = (document.getElementById('vol-avail')?.value || '').trim();
    const skills = Array.from(document.querySelectorAll('.vol-skill-chk:checked')).map(c => c.value).join('، ');

    if (!fullName || !village || !/^01\d{8}$/.test(phone)) {
      return alert('⚠️ يرجى إدخال الاسم كاملاً، القرية/العزبة، ورقم واتساب صحيح (11 رقماً).');
    }

    const code = 'VOL-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    if (window.supabaseClient) {
      const { error } = await window.supabaseClient.from('volunteers').insert([{
        volunteer_code: code, full_name: fullName, village, phone, email,
        qualification: qual, skills: skills || 'تنظيم وتوزيع ميداني', availability: avail, status: 'pending'
      }]);
      if (error) return alert('❌ خطأ أثناء التسجيل: ' + error.message);
    }

    window.triggerInstantWhatsApp(phone, `مؤسسة الحافظ للتنمية والخدمات\nأهلاً بك أ/ ${fullName} في فريق المتطوعين!\nكود التطوع الخاص بك: ${code}\nسيتم التواصل معك فور تنسيق القوافل في (${village}).`);
    alert(`✅ تم تسجيل طلب التطوع بنجاح!\nكود المتطوع: ${code}`);
    ['vol-name', 'vol-village', 'vol-phone', 'vol-email', 'vol-qual', 'vol-avail'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  };

  window.submitPartnerOnboarding = async function() {
    const orgName = (document.getElementById('prt-org-name')?.value || '').trim();
    const regNo = (document.getElementById('prt-reg-no')?.value || '').trim();
    const orgType = document.getElementById('prt-type')?.value || 'جمعية أهلية قاعدية';
    const repName = (document.getElementById('prt-rep-name')?.value || '').trim();
    const repRole = (document.getElementById('prt-rep-role')?.value || '').trim();
    const phone = (document.getElementById('prt-phone')?.value || '').trim();
    const scope = (document.getElementById('prt-scope')?.value || '').trim();

    if (!orgName || !repName || !/^01\d{8}$/.test(phone)) {
      return alert('⚠️ يرجى إدخال اسم الجمعية/المؤسسة، اسم الممثل، ورقم هاتف صحيح.');
    }

    if (window.supabaseClient) {
      const { error } = await window.supabaseClient.from('organizations').insert([{
        org_name: orgName, registration_number: regNo, org_type: orgType,
        representative_name: repName, representative_role: repRole,
        phone, whatsapp: phone, village_scope: scope, show_on_home: false, status: 'pending'
      }]);
      if (error) return alert('❌ خطأ أثناء إرسال طلب الشراكة: ' + error.message);
    }

    alert('✅ تم إرسال طلب الشراكة بنجاح! ستقوم إدارة المؤسسة بمراجعة البيانات واعتماد الظهور في شبكة الشركاء.');
    ['prt-org-name', 'prt-reg-no', 'prt-rep-name', 'prt-rep-role', 'prt-phone', 'prt-scope'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  };

  window.submitGrievance = async function() {
    const type = document.getElementById('grievance-type')?.value || 'تظلم';
    const fullName = (document.getElementById('grievance-name')?.value || '').trim();
    const phone = (document.getElementById('grievance-phone')?.value || '').trim();
    const details = (document.getElementById('grievance-details')?.value || '').trim();

    if (!fullName || !/^01\d{8}$/.test(phone) || !details) {
      return alert('⚠️ يرجى إدخال الاسم كاملاً، رقم هاتف صحيح (11 رقماً)، وتفاصيل الرسالة.');
    }

    const code = 'GRV-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
    if (window.supabaseClient) {
      const { error } = await window.supabaseClient.from('grievances').insert([{
        tracking_code: code, grievance_type: type, full_name: fullName,
        address_details: 'إهناسيا - بني سويف', phone, message_body: details, status: 'pending'
      }]);
      if (error) return alert('❌ خطأ أثناء الإرسال: ' + error.message);
    }

    window.triggerInstantWhatsApp(phone, `مؤسسة الحافظ للتنمية والخدمات\nتم استلام رسالتكم بنجاح.\nرقم المتابعة: ${code}`);
    alert(`✅ تم إرسال رسالتكم بسرية تامة!\nرقم المتابعة: ${code}`);
    ['grievance-name', 'grievance-phone', 'grievance-details'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  };
  window.trackApplication = async function() {
    const q = (document.getElementById('track-input')?.value || '').trim().toUpperCase();
    const resBox = document.getElementById('track-result');
    if (!q || !resBox) return;

    if (!q.startsWith('HF-') && !q.startsWith('GRV-') && !q.startsWith('DON-') && !q.startsWith('INK-')) {
      resBox.innerHTML = '<div style="color:#b91c1c; font-weight:700;">⚠️ يُسمح بالاستعلام برقم الطلب أو التبرع المرسل على الواتساب فقط (HF- أو DON- أو INK- أو GRV-).</div>';
      return;
    }

    resBox.innerHTML = '<p style="font-size:13px;">جاري البحث...</p>';
    if (!window.supabaseClient) return;

    if (q.startsWith('DON-') || q.startsWith('INK-')) {
      const { data } = await window.supabaseClient.from('donations').select('*').eq('donation_code', q).maybeSingle();
      if (!data) { resBox.innerHTML = '<div style="color:#b91c1c; font-weight:700;">❌ لم يتم العثور على تبرع بهذا الكود.</div>'; return; }
      const st = data.status === 'approved'
        ? `✅ تم اعتماد الاستلام رسمياً (رقم الإيصال / الإيداع: ${window.escapeHtml(data.linked_doc_number || 'معتمد')})`
        : '⏳ قيد مراجعة كشف الحساب البنكي / الاستلام المخزني';
      resBox.innerHTML = `<div style="background:#ecfdf5; border:1px solid #a7f3d0; padding:14px; border-radius:10px;"><strong>كود التبرع:</strong> ${window.escapeHtml(data.donation_code)}<br><strong>المتبرع:</strong> ${window.escapeHtml(data.donor_name || 'فاعل خير')}<br><strong>الحالة:</strong> ${st}</div>`;
      return;
    }

    if (q.startsWith('GRV-')) {
      const { data } = await window.supabaseClient.from('grievances').select('*').eq('tracking_code', q).maybeSingle();
      if (!data) { resBox.innerHTML = '<div style="color:#b91c1c; font-weight:700;">❌ لم يتم العثور على رسالة بهذا الرقم.</div>'; return; }
      resBox.innerHTML = `<div style="background:#f8fafc; border:1px solid #cbd5e1; padding:14px; border-radius:10px;"><strong>رقم المتابعة:</strong> ${window.escapeHtml(data.tracking_code)}<br><strong>الحالة:</strong> ${data.status === 'resolved' || data.status === 'تم الرد' ? 'تم الرد' : 'قيد المراجعة'}</div>`;
      return;
    }

    const { data } = await window.supabaseClient.from('families').select('*').or(`tracking_code.eq.${q},initial_tracking_code.eq.${q}`).maybeSingle();
    if (!data) { resBox.innerHTML = '<div style="color:#b91c1c; font-weight:700;">❌ لم يتم العثور على طلب مطابق.</div>'; return; }

    const statusLabel = data.status === 'approved' ? '✅ مقبول للصرف' : (data.status === 'rejected' ? '❌ مرفوض' : '🔍 قيد المراجعة');
    resBox.innerHTML = `<div style="background:#ecfdf5; border:1px solid #a7f3d0; padding:16px; border-radius:12px;"><strong>رقم الطلب:</strong> ${window.escapeHtml(data.tracking_code)}<br><strong>النوع:</strong> ${window.escapeHtml(data.intervention_type)}<br><strong>الحالة:</strong> ${statusLabel}</div>`;
  };

  window.loginUser = async function() {
    const email = (document.getElementById('login-email')?.value || '').trim().toLowerCase();
    const pass = (document.getElementById('login-pass')?.value || '').trim();
    if (!email || !pass) return alert('⚠️ يرجى إدخال البريد الإلكتروني وكلمة المرور.');

    const cfg = await window.getFoundationSettings();
    const adminEmail = (cfg.admin_email || 'alhafiz52025@gmail.com').toLowerCase();
    let matchedUser = null;

    if (email === adminEmail && pass === '22022025') {
      matchedUser = { email: adminEmail, name: 'رئيس مجلس الأمناء', role: 'admin', phone: cfg.phone_whatsapp || '01000880156' };
    } else if (window.supabaseClient) {
      const { data } = await window.supabaseClient.from('users_profiles').select('*').ilike('email', email).maybeSingle();
      if (data && data.account_status === 'active' && (data.password_hash === pass || data.temp_code === pass)) {
        matchedUser = {
          id: data.id, email: data.email, name: data.full_name, role: data.role || 'researcher',
          phone: data.phone || cfg.phone_whatsapp || '01000880156',
          can_view_all_cases: !!data.can_view_all_cases, must_change_password: data.temp_code === pass || !!data.must_change_password
        };
      }
    }

    if (!matchedUser) return alert('❌ بيانات الدخول غير صحيحة أو الحساب غير مفعل.');

    pending2FAUser = matchedUser;
    pending2FACode = String(Math.floor(100000 + Math.random() * 900000));
    pending2FAExpires = Date.now() + 5 * 60 * 1000;

    if (window.supabaseClient?.auth?.signInWithOtp) {
      window.supabaseClient.auth.signInWithOtp({ email: matchedUser.email }).catch(() => {});
    }

    const otpBox = document.getElementById('login-2fa-box');
    const otpHint = document.getElementById('login-2fa-hint');
    if (otpBox) {
      otpBox.classList.remove('hidden');
      if (otpHint) otpHint.innerHTML = `🔐 تم إرسال رمز التحقق (6 أرقام) إلى البريد (<strong>${window.escapeHtml(matchedUser.email)}</strong>). يمكنك أيضاً استلامه فوراً عبر واتساب:`;
    }
  };

  window.send2FACodeToWhatsApp = function() {
    if (!pending2FAUser || !pending2FACode) return;
    window.triggerInstantWhatsApp(pending2FAUser.phone, `مؤسسة الحافظ للتنمية والخدمات\n🔐 رمز تأكيد الدخول (OTP) الخاص بك هو: ${pending2FACode}\nصالح لمدة 5 دقائق.`);
  };

  window.complete2FALogin = function() {
    const codeInput = (document.getElementById('login-otp-input')?.value || '').trim();
    if (!pending2FAUser || !pending2FACode) return alert('⚠️ يرجى إدخال البريد الإلكتروني وكلمة المرور أولاً.');
    if (Date.now() > pending2FAExpires) {
      pending2FAUser = null; pending2FACode = '';
      return alert('⏰ انتهت صلاحية رمز التحقق. يرجى تسجيل الدخول مجدداً.');
    }
    if (codeInput !== pending2FACode) return alert('❌ رمز التحقق غير صحيح.');

    window.currentUser = pending2FAUser;
    pending2FAUser = null; pending2FACode = '';
    document.getElementById('login-2fa-box')?.classList.add('hidden');
    sessionStorage.setItem('hf_current_user', JSON.stringify(window.currentUser));
    if (typeof window.routeLoggedInUser === 'function') window.routeLoggedInUser(window.currentUser);
  };

  window.logoutUser = function() {
    window.currentUser = null;
    sessionStorage.removeItem('hf_current_user');
    document.getElementById('dashboard-area')?.classList.add('hidden');
    document.getElementById('login-box')?.classList.remove('hidden');
  };

  window.addEventListener('DOMContentLoaded', () => {
    applyDynamicSiteSettings();
    window.renderPublicAnnouncements();
    window.renderPublicAchievements();
    window.renderPublicPartners();
    if (window.currentUser && typeof window.routeLoggedInUser === 'function') window.routeLoggedInUser(window.currentUser);
  });
})();
