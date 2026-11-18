// wizard.js - المعالج الشامل والمحدث للاستمارة
(function() {
  window.currentStep = window.currentStep || 1;
  window.totalWizardSteps = 8;

  if (typeof window.formData === 'undefined') {
    window.formData = {
      interventionType: 'مساعدة اجتماعية شاملة',
      husband: {},
      wife: {},
      children: [],
      expenses: {},
      incomes: {},
      debts: { hasDebt: 'لا' },
      marriage: {},
      housing: {},
      documents: {}
    };
  }

  window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('wizard-container')) {
      window.renderWizardStep();
    }
  });

  window.renderWizardStep = function() {
    const container = document.getElementById('wizard-container');
    if (!container) return;

    let html = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #cbd5e1; padding-bottom:10px;">
        <span style="font-weight:800; color:var(--primary-dark);">الخطوة ${window.currentStep} من ${window.totalWizardSteps}</span>
        <div style="display:flex; gap:4px;">
          ${Array.from({length: window.totalWizardSteps}, (_, i) => `<span style="width:24px; height:6px; border-radius:3px; background:${i + 1 === window.currentStep ? 'var(--primary)' : '#cbd5e1'}"></span>`).join('')}
        </div>
      </div>
    `;

    // --- الخطوة 1: نوع التدخل الأساسي ---
    if (window.currentStep === 1) {
      const aidOptions = (window.AID_TYPES || []).map(a => `<option value="${a}" ${window.formData.interventionType===a?'selected':''}>${a}</option>`).join('');
      html += `
        <h4 style="color:var(--primary-dark); margin-top:0;">🎯 الخطوة الأولى: تحديد نوع التدخل والمساعدات الخاصة</h4>
        <div style="margin-bottom:14px;">
          <label style="font-weight:700;">نوع المساعدة الأساسية المطلوبة للأسرة *</label>
          <select id="intervention-type" onchange="window.formData.interventionType = this.value">
            ${aidOptions}
          </select>
        </div>
        <p style="font-size:13px; color:#64748b;">اضغط على زر (التالي ➔) للانتقال لبيانات الزوج ورب الأسرة.</p>
      `;
    }
    // --- الخطوة 2: بيانات الزوج مع الفلترة الجغرافية (محافظة -> مركز -> قرية) ---
    else if (window.currentStep === 2) {
      const locs = window.EGYPT_LOCATIONS || {};
      const selectedGov = window.formData.husband?.gov || 'بني سويف';
      const govOptions = Object.keys(locs).map(g => `<option value="${g}" ${g===selectedGov?'selected':''}>${g}</option>`).join('');
      
      const centers = locs[selectedGov] ? Object.keys(locs[selectedGov]) : [];
      const selectedCenter = window.formData.husband?.center || centers[0] || '';
      const centerOptions = centers.map(c => `<option value="${c}" ${c===selectedCenter?'selected':''}>${c}</option>`).join('');

      const villages = (locs[selectedGov] && locs[selectedGov][selectedCenter]) ? locs[selectedGov][selectedCenter] : [];
      const selectedVillage = window.formData.husband?.village || villages[0] || '';
      const villageOptions = villages.map(v => `<option value="${v}" ${v===selectedVillage?'selected':''}>${v}</option>`).join('');

      const jobOptions = (window.EGYPT_JOBS || []).map(j => `<option value="${j}">${j}</option>`).join('');

      html += `
        <h4 style="color:var(--primary-dark); margin-top:0;">👤 القسم الأول: بيانات الزوج (رب الأسرة)</h4>
        <div class="grid-3">
          <div><label>الاسم الأول *</label><input id="h-name1" value="${window.formData.husband.name1 || ''}"></div>
          <div><label>الاسم الثاني *</label><input id="h-name2" value="${window.formData.husband.name2 || ''}"></div>
          <div><label>الاسم الثالث والعائلة *</label><input id="h-name3" value="${window.formData.husband.name3 || ''}"></div>
        </div>
        <div class="grid-2">
          <div>
            <label>الحالة الاجتماعية *</label>
            <select id="h-status">
              <option value="متوفى">متوفى</option>
              <option value="أرمل">أرمل</option>
              <option value="مسجون">مسجون</option>
              <option value="مطلق">مطلق</option>
              <option value="هجر">هجر (مهجورة / هارب)</option>
              <option value="مقيم مع الأسرة" selected>مقيم مع الأسرة</option>
            </select>
          </div>
          <div><label>الرقم القومي (14 رقم حصراً) *</label><input id="h-nid" maxlength="14" value="${window.formData.husband.nid || ''}"></div>
        </div>

        <div style="background:#f8fafc; padding:12px; border-radius:8px; margin-bottom:10px; border:1px solid #cbd5e1;">
          <label style="font-weight:700; color:var(--primary-dark);">العنوان الإداري (التسلسل الجغرافي) *</label>
          <div class="grid-3" style="margin-top:6px;">
            <div>
              <label style="font-size:11px;">المحافظة:</label>
              <select id="h-gov" onchange="updateGeoCenters()">${govOptions}</select>
            </div>
            <div>
              <label style="font-size:11px;">المركز / القسم:</label>
              <select id="h-center" onchange="updateGeoVillages()">${centerOptions}</select>
            </div>
            <div>
              <label style="font-size:11px;">القرية أو التابع:</label>
              <select id="h-village">${villageOptions}</select>
            </div>
          </div>
          <div style="margin-top:8px;"><input id="h-street" placeholder="شارع / رقم الحارة / التفاصيل كما مدون بالبطاقة" value="${window.formData.husband.street || ''}"></div>
        </div>

        <div class="grid-2">
          <div><label>رقم التليفون الأساسي (11 رقم) *</label><input id="h-phone" maxlength="11" value="${window.formData.husband.phone || ''}"></div>
          <div><label>رقم الواتساب (11 رقم)</label><input id="h-whatsapp" maxlength="11" value="${window.formData.husband.whatsapp || ''}"></div>
        </div>
        <div class="grid-2">
          <div>
            <label>المستوى التعليمي *</label>
            <select id="h-edu-level">
              <option value="غير متعلم">غير متعلم (لا يقرأ ولا يكتب)</option>
              <option value="متعلم" selected>متعلم</option>
            </select>
          </div>
          <div>
            <label>الوظيفة الحالية *</label>
            <select id="h-job">${jobOptions}</select>
          </div>
        </div>
        <div style="background:#f1f5f9; padding:12px; border-radius:8px; margin-bottom:10px;">
          <label>الحالة الصحية *</label>
          <select id="h-health" onchange="toggleHealth('h')">
            <option value="سليم">سليم وبصحة جيدة</option>
            <option value="مريض">مريض</option>
          </select>
          <div id="h-health-box" class="hidden" style="margin-top:8px;">
            <div class="grid-2">
              <div>
                <label>نوع المرض:</label>
                <select id="h-illness-type">
                  <option value="مؤقت">مرض مؤقت (إصابة، كسر، جراحة طارئة)</option>
                  <option value="مزمن">مرض مزمن (سكر، ضغط، كبد، كلوي، قلب)</option>
                </select>
              </div>
              <div>
                <label>الإجراء الطبي المطلوب:</label>
                <select id="h-surgery-type">
                  <option value="عملية جراحية">عملية جراحية</option>
                  <option value="أجهزة تعويضية">أجهزة تعويضية</option>
                  <option value="أطراف صناعية">أطراف صناعية</option>
                  <option value="علاج شهري ثابت">علاج شهري ثابت</option>
                </select>
              </div>
            </div>
            <div class="grid-2" style="margin-top:8px;">
              <div><label>رفع التقرير الطبي (مختوم):</label><input type="file" id="h-medical-doc"></div>
              <div><label>رفع البحث الاجتماعي (مختوم):</label><input type="file" id="h-social-doc"></div>
            </div>
          </div>
        </div>
        <div class="grid-2">
          <div><label>صورة بطاقة الزوج (وش) *</label><input type="file" id="h-id-front"></div>
          <div><label>صورة بطاقة الزوج (ظهر) *</label><input type="file" id="h-id-back"></div>
        </div>
      `;
    }
    // --- الخطوة 3: بيانات الزوجة ---
    else if (window.currentStep === 3) {
      const jobOptions = (window.EGYPT_JOBS || []).map(j => `<option value="${j}">${j}</option>`).join('');
      html += `
        <h4 style="color:var(--primary-dark); margin-top:0;">👩 القسم الثاني: بيانات الزوجة</h4>
        <div class="grid-3">
          <div><label>الاسم الأول *</label><input id="w-name1" value="${window.formData.wife.name1 || ''}"></div>
          <div><label>الاسم الثاني *</label><input id="w-name2" value="${window.formData.wife.name2 || ''}"></div>
          <div><label>الاسم الثالث والعائلة *</label><input id="w-name3" value="${window.formData.wife.name3 || ''}"></div>
        </div>
        <div class="grid-2">
          <div><label>الرقم القومي (14 رقم حصراً) *</label><input id="w-nid" maxlength="14" value="${window.formData.wife.nid || ''}"></div>
          <div><label>رقم التليفون الأساسي (11 رقم)</label><input id="w-phone" maxlength="11" value="${window.formData.wife.phone || ''}"></div>
        </div>
        <div class="grid-2">
          <div>
            <label>المستوى التعليمي *</label>
            <select id="w-edu">
              <option value="غير متعلمة">غير متعلمة</option>
              <option value="ابتدائية">ابتدائية</option>
              <option value="إعدادية">إعدادية</option>
              <option value="ثانوي / دبلوم">ثانوي أو دبلوم فني</option>
              <option value="جامعي">جامعي</option>
            </select>
          </div>
          <div>
            <label>الوظيفة / النشاط *</label>
            <select id="w-job">${jobOptions}</select>
          </div>
        </div>
        <div style="background:#f1f5f9; padding:10px; border-radius:8px; margin-bottom:10px;">
          <label>الحالة الصحية:</label>
          <select id="w-health" onchange="toggleHealth('w')">
            <option value="سليم">سليمة وبصحة جيدة</option>
            <option value="مريض">مريضة</option>
          </select>
          <div id="w-health-box" class="hidden" style="margin-top:8px;">
            <select id="w-illness-type">
              <option value="مؤقت">مرض مؤقت</option>
              <option value="مزمن">مرض مزمن</option>
            </select>
            <div class="grid-2" style="margin-top:6px;">
              <div><label>التقرير الطبي (مختوم):</label><input type="file" id="w-medical-doc"></div>
              <div><label>البحث الاجتماعي (مختوم):</label><input type="file" id="w-social-doc"></div>
            </div>
          </div>
        </div>
        <div class="grid-2">
          <div><label>صورة بطاقة الزوجة (وش)</label><input type="file" id="w-id-front"></div>
          <div><label>صورة بطاقة الزوجة (ظهر)</label><input type="file" id="w-id-back"></div>
        </div>
      `;
    }
    // --- الخطوة 4: الأبناء ---
    else if (window.currentStep === 4) {
      html += `
        <h4 style="color:var(--primary-dark); margin-top:0;">👶 القسم الثالث: بيانات الأبناء والتابعين</h4>
        <div id="children-list">
          ${(window.formData.children || []).map((c, idx) => `
            <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:12px; border-radius:10px; margin-bottom:10px;">
              <strong>الابن / الابنة رقم ${idx + 1}</strong>
              <div class="grid-3" style="margin-top:6px;">
                <input placeholder="اسم الابن ثلاثي" class="c-name" value="${c.name || ''}">
                <input placeholder="الرقم القومي (14 رقم)" maxlength="14" class="c-nid" value="${c.nid || ''}">
                <select class="c-edu">
                  <option value="حضانة">حضانة</option>
                  <option value="ابتدائي">ابتدائي</option>
                  <option value="إعدادي">إعدادي</option>
                  <option value="ثانوي / فني">ثانوي أو فني</option>
                  <option value="جامعي">تعليم جامعي</option>
                </select>
              </div>
              <div class="grid-2" style="margin-top:6px;">
                <div><label style="font-size:11px;">شهادة الميلاد:</label> <input type="file" class="c-cert"></div>
                <div>
                  <label style="font-size:11px;">الحالة الصحية:</label>
                  <select class="c-health">
                    <option value="سليم">سليم</option>
                    <option value="مريض">مريض بمرض مزمن أو إعاقة</option>
                  </select>
                </div>
              </div>
              <button type="button" onclick="removeChildRow(${idx})" class="nav-btn" style="background:#b91c1c; color:#fff; margin-top:6px; font-size:11px;">حذف هذا الابن</button>
            </div>
          `).join('')}
        </div>
        <button type="button" onclick="addChildRow()" class="action-btn" style="background:#0f172a; margin-top:10px;">+ إضافة ابن آخر</button>
      `;
    }
    // --- الخطوة 5: قسم الزواج (إذا تم اختياره) ---
    else if (window.currentStep === 5) {
      if (window.formData.interventionType !== 'تجهيز عروسة (أجهزة كهربائية / مفروشات)') {
        window.currentStep = 6;
        return window.renderWizardStep();
      }
      html += `
        <h4 style="color:#be185d; margin-top:0;">💍 القسم الإضافي: بيانات العروسة وتجهيز الزواج</h4>
        <div style="background:#fdf2f8; border:1px solid #fbcfe8; padding:14px; border-radius:10px;">
          <div class="grid-3">
            <div><label>اسم العروسة الأول</label><input id="m-name1" value="${window.formData.marriage.name1 || ''}"></div>
            <div><label>اسم العروسة الثاني</label><input id="m-name2" value="${window.formData.marriage.name2 || ''}"></div>
            <div><label>اسم العروسة الثالث والعائلة</label><input id="m-name3" value="${window.formData.marriage.name3 || ''}"></div>
          </div>
          <div class="grid-2" style="margin-top:8px;">
            <div><label>الرقم القومي للعروسة (14 رقم)</label><input id="m-nid" maxlength="14" value="${window.formData.marriage.nid || ''}"></div>
            <div><label>رقم تليفون العروسة أو وليها</label><input id="m-phone" maxlength="11" value="${window.formData.marriage.phone || ''}"></div>
          </div>
          <div class="grid-2" style="margin-top:8px;">
            <div><label>موعد الزفاف المقترح</label><input type="date" id="m-date" value="${window.formData.marriage.date || ''}"></div>
            <div><label>المتفرّرات لدى العروسة</label><input id="m-available" value="${window.formData.marriage.available || ''}"></div>
          </div>
          <div class="grid-2" style="margin-top:8px;">
            <div><label>صورة قسيمة الزواج / الخطوبة</label><input type="file" id="m-cert-doc"></div>
            <div><label>الشهادة الصحية للعروسين (وش وظهر)</label><input type="file" id="m-health-doc"></div>
          </div>
        </div>
      `;
    }
    // --- الخطوة 6: المصروفات ---
    else if (window.currentStep === 6) {
      html += `
        <h4 style="color:var(--primary-dark); margin-top:0;">💸 القسم الرابع: المصروفات والأعباء الشهرية</h4>
        <div class="grid-2">
          <div><label>قيمة الإيجار الشهري</label><input type="number" id="exp-rent" value="${window.formData.expenses.rent || 0}" oninput="calcTotals()"></div>
          <div><label>فواتير مياه</label><input type="number" id="exp-water" value="${window.formData.expenses.water || 0}" oninput="calcTotals()"></div>
          <div><label>فواتير كهرباء</label><input type="number" id="exp-electric" value="${window.formData.expenses.electric || 0}" oninput="calcTotals()"></div>
          <div><label>فواتير غاز أو أنبوبة</label><input type="number" id="exp-gas" value="${window.formData.expenses.gas || 0}" oninput="calcTotals()"></div>
          <div><label>مصاريف تعليم الأبناء</label><input type="number" id="exp-edu" value="${window.formData.expenses.edu || 0}" oninput="calcTotals()"></div>
          <div><label>مصاريف العلاج والأدوية المزمنة</label><input type="number" id="exp-health" value="${window.formData.expenses.health || 0}" oninput="calcTotals()"></div>
          <div><label>المستلزمات المعيشية الأساسية (مأكل ومسكن)</label><input type="number" id="exp-food" value="${window.formData.expenses.food || 0}" oninput="calcTotals()"></div>
          <div><label>أقساط ديون والتزامات أخرى</label><input type="number" id="exp-debts" value="${window.formData.expenses.debts || 0}" oninput="calcTotals()"></div>
        </div>
        <div style="background:#fee2e2; border:1px solid #fecaca; padding:12px; border-radius:8px; margin-top:12px; text-align:center;">
          <span style="font-weight:700; color:#991b1b; font-size:15px;">إجمالي المصروفات الشهرية: <strong id="total-exp-display">0</strong> جنيه</span>
        </div>
      `;
    }
    // --- الخطوة 7: الدخل ---
    else if (window.currentStep === 7) {
      html += `
        <h4 style="color:var(--primary-dark); margin-top:0;">💵 القسم الخامس: مصادر الدخل والفائض أو العجز</h4>
        <div class="grid-2">
          <div><label>دخل الزوج من العمل / المهنة</label><input type="number" id="inc-husband" value="${window.formData.incomes.husband || 0}" oninput="calcTotals()"></div>
          <div><label>دخل الزوجة أو الأبناء العاملين</label><input type="number" id="inc-others" value="${window.formData.incomes.others || 0}" oninput="calcTotals()"></div>
          <div><label>معاش حكومي / تكافل وكرامة</label><input type="number" id="inc-pension" value="${window.formData.incomes.pension || 0}" oninput="calcTotals()"></div>
          <div><label>مساعدات ثابتة من أهل الخير</label><input type="number" id="inc-aid" value="${window.formData.incomes.aid || 0}" oninput="calcTotals()"></div>
        </div>
        <div style="background:#ecfdf5; border:1px solid #a7f3d0; padding:12px; border-radius:8px; margin-top:12px; text-align:center;">
          <p style="margin:0 0 4px; font-weight:700; color:#065f46;">إجمالي الدخل الشهري: <strong id="total-inc-display">0</strong> جنيه</p>
          <hr style="border:0; border-top:1px solid #a7f3d0; margin:6px 0;">
          <span id="balance-display" style="font-weight:800; font-size:16px;">صافي الوضع المالي: -</span>
        </div>
      `;
    }
    // --- الخطوة 8: السكن والمستندات ---
    else if (window.currentStep === 8) {
      html += `
        <h4 style="color:var(--primary-dark); margin-top:0;">📋 القسم السادس: وصف السكن، المستندات الرسمية، ورأي الباحث</h4>
        <div class="grid-2" style="margin-bottom:10px;">
          <div>
            <label>نوع السكن:</label>
            <select id="h-type">
              <option value="ريفي / بيت ريفي">ريفي / بيت ريفي</option>
              <option value="شقة سكنية">شقة سكنية</option>
              <option value="بيت عائلي">بيت عائلي</option>
              <option value="انتفاع">انتفاع</option>
              <option value="هبة">هبة</option>
            </select>
          </div>
          <div>
            <label>حالة السكن:</label>
            <select id="h-status-case" onchange="toggleLease()">
              <option value="ملك">ملك</option>
              <option value="إيجار">إيجار</option>
            </select>
          </div>
        </div>
        <div class="grid-3" style="margin-bottom:10px;">
          <div>
            <label>وصف السقف:</label>
            <select id="h-roof">
              <option value="خشب">خشب</option>
              <option value="مسلح">مسلح</option>
              <option value="جريد">جريد</option>
              <option value="بوص">بوص</option>
              <option value="عفش">عفش</option>
            </select>
          </div>
          <div>
            <label>وصف الحوائط:</label>
            <select id="h-walls">
              <option value="طوب لبن">طوب لبن</option>
              <option value="طوب أحمر غير محارة">طوب أحمر غير محارة</option>
              <option value="محارة وتشطيب عادي">محارة وتشطيب عادي</option>
              <option value="لوكس / سوبر لوكس">لوكس / سوبر لوكس</option>
            </select>
          </div>
          <div>
            <label>وصف الأرضية:</label>
            <select id="h-floor">
              <option value="ترابية">ترابية</option>
              <option value="بلاط عادي">بلاط عادي</option>
              <option value="سيراميك">سيراميك</option>
              <option value="رخام / جرانيت">رخام / جرانيت</option>
            </select>
          </div>
        </div>
        <div style="margin-bottom:10px;">
          <label>وصف الفرش والأثاث:</label>
          <select id="h-furniture">
            <option value="رديء / معدوم">رديء / معدوم</option>
            <option value="متوسط">متوسط</option>
            <option value="جيد">جيد</option>
            <option value="جيد جداً">جيد جداً</option>
            <option value="ممتاز">ممتاز</option>
          </select>
        </div>
        
        <div class="grid-2" style="margin-bottom:10px;">
          <div><label>البحث الاجتماعي (مختوم) *</label><input type="file" id="doc-social-research"></div>
          <div><label>برنت تأميني للزوج</label><input type="file" id="doc-insurance-h"></div>
          <div><label>برنت تأميني للزوجة</label><input type="file" id="doc-insurance-w"></div>
          <div id="lease-doc-box" class="hidden"><label>عقد الإيجار الرسمي *</label><input type="file" id="doc-lease"></div>
          <div><label>إثبات قيد دراسي للأبناء</label><input type="file" id="doc-school-enroll"></div>
        </div>

        <div style="margin-bottom:10px;">
          <label style="font-weight:700;">رأي وتوصية الباحث الميداني *</label>
          <select id="researcher-opinion">
            <option value="حالة شديدة الاستحقاق وعاجلة">حالة شديدة الاستحقاق وعاجلة</option>
            <option value="حالة مستحقة للدعم العادي">حالة مستحقة للدعم العادي</option>
            <option value="حالة متوسطة الاستحقاق">حالة متوسطة الاستحقاق</option>
            <option value="غير مستحق بعد المراجعة">غير مستحق بعد المراجعة</option>
          </select>
        </div>

        <div style="background:#fffbeb; border:1px solid #fde68a; padding:12px; border-radius:8px; margin-bottom:12px;">
          <label style="display:flex; align-items:center; gap:8px; font-weight:700; cursor:pointer; color:#92400e; font-size:13px;">
            <input type="checkbox" id="declaration-check" style="width:auto; margin:0;"> أقر أنا مقدم الطلب بأن كافة البيانات والمستندات المسجلة صحيحة تماماً وتحت مسئوليتي القانونية والمجتمعية، وأوافق على إجراء البحث الميداني.
          </label>
        </div>
      `;
    }

    html += `
      <div style="display:flex; justify-content:space-between; margin-top:20px;">
        ${window.currentStep > 1 ? '<button type="button" onclick="prevWizardStep()" class="nav-btn" style="background:#334155; color:#fff;">السابق</button>' : '<div></div>'}
        ${window.currentStep < window.totalWizardSteps ? '<button type="button" onclick="nextWizardStep()" class="action-btn">التالي ➔</button>' : '<button type="button" onclick="submitFullWizardApplication()" class="action-btn" style="background:#15803d;">✅ تأكيد والرفع النهائي للحالة</button>'}
      </div>
    `;

    container.innerHTML = html;
    if (window.currentStep === 6 || window.currentStep === 7) window.calcTotals();
  };

  // الفلترة الجغرافية التفاعلية (تعمل بنظام القوائم المترابطة مثل البنوك)
  window.updateGeoCenters = function() {
    const gov = document.getElementById('h-gov')?.value;
    const centerSelect = document.getElementById('h-center');
    const villageSelect = document.getElementById('h-village');
    const locs = window.EGYPT_LOCATIONS || {};
    if (centerSelect && locs[gov]) {
      const centers = Object.keys(locs[gov]);
      centerSelect.innerHTML = centers.map(c => `<option value="${c}">${c}</option>`).join('');
      window.updateGeoVillages();
    }
  };

  window.updateGeoVillages = function() {
    const gov = document.getElementById('h-gov')?.value;
    const center = document.getElementById('h-center')?.value;
    const villageSelect = document.getElementById('h-village');
    const locs = window.EGYPT_LOCATIONS || {};
    if (villageSelect && locs[gov] && locs[gov][center]) {
      const vills = locs[gov][center];
      villageSelect.innerHTML = vills.map(v => `<option value="${v}">${v}</option>`).join('');
    }
  };

  window.nextWizardStep = function() { saveCurrentStepData(); window.currentStep++; window.renderWizardStep(); };
  window.prevWizardStep = function() { saveCurrentStepData(); window.currentStep--; window.renderWizardStep(); };

  window.toggleHealth = function(type) {
    const val = document.getElementById(type + '-health')?.value;
    const box = document.getElementById(type + '-health-box');
    if (box) {
      if (val === 'مريض') box.classList.remove('hidden');
      else box.classList.add('hidden');
    }
  };

  window.toggleLease = function() {
    const val = document.getElementById('h-status-case')?.value;
    const box = document.getElementById('lease-doc-box');
    if (box) {
      if (val === 'إيجار') box.classList.remove('hidden');
      else box.classList.add('hidden');
    }
  };

  window.addChildRow = function() {
    if (!window.formData.children) window.formData.children = [];
    window.formData.children.push({ name: '', nid: '', edu: 'ابتدائي' });
    window.renderWizardStep();
  };

  window.removeChildRow = function(idx) {
    window.formData.children.splice(idx, 1);
    window.renderWizardStep();
  };

  window.calcTotals = function() {
    const rent = parseFloat(document.getElementById('exp-rent')?.value) || 0;
    const water = parseFloat(document.getElementById('exp-water')?.value) || 0;
    const electric = parseFloat(document.getElementById('exp-electric')?.value) || 0;
    const gas = parseFloat(document.getElementById('exp-gas')?.value) || 0;
    const edu = parseFloat(document.getElementById('exp-edu')?.value) || 0;
    const health = parseFloat(document.getElementById('exp-health')?.value) || 0;
    const food = parseFloat(document.getElementById('exp-food')?.value) || 0;
    const debts = parseFloat(document.getElementById('exp-debts')?.value) || 0;

    const totalExp = rent + water + electric + gas + edu + health + food + debts;
    const expDisplay = document.getElementById('total-exp-display');
    if (expDisplay) expDisplay.innerText = totalExp;

    const incH = parseFloat(document.getElementById('inc-husband')?.value) || 0;
    const incO = parseFloat(document.getElementById('inc-others')?.value) || 0;
    const incP = parseFloat(document.getElementById('inc-pension')?.value) || 0;
    const incA = parseFloat(document.getElementById('inc-aid')?.value) || 0;

    const totalInc = incH + incO + incP + incA;
    const incDisplay = document.getElementById('total-inc-display');
    if (incDisplay) incDisplay.innerText = totalInc;

    const balance = totalInc - totalExp;
    const balDisplay = document.getElementById('balance-display');
    if (balDisplay) {
      if (balance < 0) {
        balDisplay.innerHTML = `⚠️ يوجد عجز مالي شهري بقيمة: <span style="color:#b91c1c;">${Math.abs(balance)} جنيه</span> (حالة مستحقة)`;
      } else {
        balDisplay.innerHTML = `🟢 يوجد فائض مالي شهري بقيمة: <span style="color:#065f46;">${balance} جنيه</span>`;
      }
    }
  };

  function saveCurrentStepData() {
    if (window.currentStep === 1) {
      window.formData.interventionType = document.getElementById('intervention-type')?.value || 'مساعدة اجتماعية شاملة';
    } else if (window.currentStep === 2) {
      window.formData.husband = {
        name1: document.getElementById('h-name1')?.value || '',
        name2: document.getElementById('h-name2')?.value || '',
        name3: document.getElementById('h-name3')?.value || '',
        status: document.getElementById('h-status')?.value || '',
        nid: document.getElementById('h-nid')?.value || '',
        gov: document.getElementById('h-gov')?.value || '',
        center: document.getElementById('h-center')?.value || '',
        village: document.getElementById('h-village')?.value || '',
        street: document.getElementById('h-street')?.value || '',
        phone: document.getElementById('h-phone')?.value || '',
        whatsapp: document.getElementById('h-whatsapp')?.value || '',
        health: document.getElementById('h-health')?.value || '',
        illnessType: document.getElementById('h-illness-type')?.value || '',
        surgeryType: document.getElementById('h-surgery-type')?.value || ''
      };
    } else if (window.currentStep === 3) {
      window.formData.wife = {
        name1: document.getElementById('w-name1')?.value || '',
        name2: document.getElementById('w-name2')?.value || '',
        name3: document.getElementById('w-name3')?.value || '',
        nid: document.getElementById('w-nid')?.value || '',
        phone: document.getElementById('w-phone')?.value || '',
        health: document.getElementById('w-health')?.value || ''
      };
    } else if (window.currentStep === 4) {
      const rows = document.querySelectorAll('#children-list > div');
      window.formData.children = [];
      rows.forEach(r => {
        window.formData.children.push({
          name: r.querySelector('.c-name')?.value || '',
          nid: r.querySelector('.c-nid')?.value || '',
          edu: r.querySelector('.c-edu')?.value || '',
          health: r.querySelector('.c-health')?.value || ''
        });
      });
    } else if (window.currentStep === 6) {
      window.formData.expenses = {
        rent: parseFloat(document.getElementById('exp-rent')?.value) || 0,
        water: parseFloat(document.getElementById('exp-water')?.value) || 0,
        electric: parseFloat(document.getElementById('exp-electric')?.value) || 0,
        gas: parseFloat(document.getElementById('exp-gas')?.value) || 0,
        edu: parseFloat(document.getElementById('exp-edu')?.value) || 0,
        health: parseFloat(document.getElementById('exp-health')?.value) || 0,
        food: parseFloat(document.getElementById('exp-food')?.value) || 0,
        debts: parseFloat(document.getElementById('exp-debts')?.value) || 0
      };
    } else if (window.currentStep === 7) {
      window.formData.incomes = {
        husband: parseFloat(document.getElementById('inc-husband')?.value) || 0,
        others: parseFloat(document.getElementById('inc-others')?.value) || 0,
        pension: parseFloat(document.getElementById('inc-pension')?.value) || 0,
        aid: parseFloat(document.getElementById('inc-aid')?.value) || 0
      };
    } else if (window.currentStep === 8) {
      window.formData.housing = {
        type: document.getElementById('h-type')?.value || '',
        case: document.getElementById('h-status-case')?.value || '',
        roof: document.getElementById('h-roof')?.value || '',
        walls: document.getElementById('h-walls')?.value || '',
        floor: document.getElementById('h-floor')?.value || '',
        furniture: document.getElementById('h-furniture')?.value || '',
        opinion: document.getElementById('researcher-opinion')?.value || ''
      };
    }
  }

  window.submitFullWizardApplication = async function() {
    saveCurrentStepData();
    const check = document.getElementById('declaration-check');
    if (check && !check.checked) {
      return alert('⚠️ يجب الموافقة على إقرار صحة البيانات والمسؤولية القانونية قبل الرفع النهائي.');
    }

    const trackingCode = 'HF-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const totalExp = Object.values(window.formData.expenses).reduce((a, b) => a + b, 0);
    const totalInc = Object.values(window.formData.incomes).reduce((a, b) => a + b, 0);

    const payload = {
      tracking_code: trackingCode,
      governorate: window.formData.husband.gov || 'بني سويف',
      center_city: window.formData.husband.center || 'إهناسيا',
      village_hamlet: window.formData.husband.village || '',
      aid_type: window.formData.interventionType,
      total_income: totalInc,
      total_expenses: totalExp,
      status: 'pending',
      husband_data: window.formData.husband,
      wife_data: window.formData.wife,
      children_data: window.formData.children,
      marriage_data: window.formData.marriage,
      housing_data: window.formData.housing
    };

    if (window.supabaseClient) {
      const res = await window.supabaseClient.from('families').insert([payload]);
      if (res.error) {
        alert('❌ خطأ أثناء الرفع لقاعدة البيانات: ' + res.error.message);
      } else {
        alert(`✅ تم رفع استمارة الحالة بنجاح!\n\nكود المتابعة الخاص بالأسرة هو: ${trackingCode}\nاحتفظ به للاستعلام عن حالة الطلب.`);
        location.reload();
      }
    } else {
      alert(`✅ تم إنجاز الطلب محلياً بنجاح!\nكود المتابعة: ${trackingCode}`);
    }
  };

})();
