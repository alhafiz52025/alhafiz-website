// wizard.js - المنظومة الذكية لاستمارة البحث الاجتماعي وبناء الأسر - مؤسسة الحافظ (نسخة آمنة ومحدثة)

(function() {
  // حماية المتغيرات العامة من التكرار
  if (typeof window.currentStep === 'undefined') {
    window.currentStep = 1;
  }
  const totalWizardSteps = 6;
  
  if (typeof window.formData === 'undefined') {
    window.formData = {
      husband: {},
      wife: {},
      children: [],
      expenses: {},
      incomes: {},
      documents: {},
      housing: {}
    };
  }

  // تهيئة الاستمارة عند تحميل الصفحة
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
        <span style="font-weight:800; color:var(--primary-dark);">الخطوة ${window.currentStep} من ${totalWizardSteps}</span>
        <div style="display:flex; gap:6px;">
          ${Array.from({length: totalWizardSteps}, (_, i) => `<span style="width:28px; height:8px; border-radius:4px; background:${i + 1 === window.currentStep ? 'var(--primary)' : '#cbd5e1'}"></span>`).join('')}
        </div>
      </div>
    `;

    if (window.currentStep === 1) {
      html += `
        <h4 style="color:var(--primary-dark); margin-top:0;">👤 القسم الأول: بيانات الزوج (رب الأسرة)</h4>
        <div class="grid-3">
          <div><label>الاسم الأول *</label><input id="h-name1" value="${window.formData.husband.name1 || ''}"></div>
          <div><label>الاسم الثاني *</label><input id="h-name2" value="${window.formData.husband.name2 || ''}"></div>
          <div><label>الاسم الثالث *</label><input id="h-name3" value="${window.formData.husband.name3 || ''}"></div>
        </div>
        <div class="grid-2">
          <div><label>رقم البطاقة (14 رقم) *</label><input id="h-nid" maxlength="14" value="${window.formData.husband.nid || ''}"></div>
          <div><label>رقم التليفون *</label><input id="h-phone" value="${window.formData.husband.phone || ''}"></div>
        </div>
        <div class="grid-2">
          <div>
            <label>المستوى التعليمي *</label>
            <select id="h-edu">
              <option value="غير متعلم" ${window.formData.husband.edu==='غير متعلم'?'selected':''}>غير متعلم (لا يقرا ولا يكتب)</option>
              <option value="ابتدائية" ${window.formData.husband.edu==='ابتدائية'?'selected':''}>ابتدائية</option>
              <option value="إعدادية" ${window.formData.husband.edu==='إعدادية'?'selected':''}>إعدادية</option>
              <option value="ثانوية" ${window.formData.husband.edu==='ثانوية'?'selected':''}>ثانوية</option>
              <option value="جامعي" ${window.formData.husband.edu==='جامعي'?'selected':''}>جامعي</option>
              <option value="دكتوراه" ${window.formData.husband.edu==='دكتوراه'?'selected':''}>دكتوراه</option>
            </select>
          </div>
          <div><label>الوظيفة الحالية *</label><input id="h-job" value="${window.formData.husband.job || ''}" placeholder="مثال: عامل باليومية - مهني..."></div>
        </div>
        <div style="background:#f1f5f9; padding:14px; border-radius:10px; margin-bottom:12px;">
          <label style="font-weight:700;">الحالة الصحية:</label>
          <select id="h-health" onchange="toggleHealthDetails('h')">
            <option value="سليم" ${window.formData.husband.health === 'سليم' ? 'selected' : ''}>سليم وبصحة جيدة</option>
            <option value="مريض" ${window.formData.husband.health === 'مريض' ? 'selected' : ''}>مريض (يعاني من حالة مرضية)</option>
          </select>
          <div id="h-health-box" class="${window.formData.husband.health === 'مريض' ? '' : 'hidden'}" style="margin-top:10px;">
            <input id="h-illness" placeholder="اسم الحالة المرضية / التشخيص" style="margin-bottom:6px;" value="${window.formData.husband.illness || ''}">
            <input id="h-surgery" placeholder="نوع التدخل الجراحي أو العمليات المطلوبة إن وجد" style="margin-bottom:6px;" value="${window.formData.husband.surgery || ''}">
            <input id="h-devices" placeholder="الأجهزة التعويضية أو المستلزمات الطبية المطلوبة إن وجد" value="${window.formData.husband.devices || ''}">
          </div>
        </div>
        <div class="grid-2">
          <div><label>صورة البطاقة (وش)</label><input type="file" id="h-id-front"></div>
          <div><label>صورة البطاقة (ظهر)</label><input type="file" id="h-id-back"></div>
        </div>
        <div><label>التقرير الطبي أو الأشعة أو التحاليل (في حالة مريض)</label><input type="file" id="h-medical-doc"></div>
      `;
    } 
    else if (window.currentStep === 2) {
      html += `
        <h4 style="color:var(--primary-dark); margin-top:0;">👩 القسم الثاني: بيانات الزوجة</h4>
        <div class="grid-3">
          <div><label>الاسم الأول *</label><input id="w-name1" value="${window.formData.wife.name1 || ''}"></div>
          <div><label>الاسم الثاني *</label><input id="w-name2" value="${window.formData.wife.name2 || ''}"></div>
          <div><label>الاسم الثالث *</label><input id="w-name3" value="${window.formData.wife.name3 || ''}"></div>
        </div>
        <div class="grid-2">
          <div><label>رقم البطاقة (14 رقم) *</label><input id="w-nid" maxlength="14" value="${window.formData.wife.nid || ''}"></div>
          <div><label>رقم التليفون</label><input id="w-phone" value="${window.formData.wife.phone || ''}"></div>
        </div>
        <div class="grid-2">
          <div>
            <label>المستوى التعليمي *</label>
            <select id="w-edu">
              <option value="غير متعلم" ${window.formData.wife.edu==='غير متعلم'?'selected':''}>غير متعلم (لا يقرا ولا يكتب)</option>
              <option value="ابتدائية" ${window.formData.wife.edu==='ابتدائية'?'selected':''}>ابتدائية</option>
              <option value="إعدادية" ${window.formData.wife.edu==='إعدادية'?'selected':''}>إعدادية</option>
              <option value="ثانوية" ${window.formData.wife.edu==='ثانوية'?'selected':''}>ثانوية</option>
              <option value="جامعي" ${window.formData.wife.edu==='جامعي'?'selected':''}>جامعي</option>
            </select>
          </div>
          <div><label>الوظيفة / النشاط *</label><input id="w-job" value="${window.formData.wife.job || ''}" placeholder="ربة منزل / عمل حر..."></div>
        </div>
        <div style="background:#f1f5f9; padding:14px; border-radius:10px; margin-bottom:12px;">
          <label style="font-weight:700;">الحالة الصحية:</label>
          <select id="w-health" onchange="toggleHealthDetails('w')">
            <option value="سليم" ${window.formData.wife.health === 'سليم' ? 'selected' : ''}>سليم وبصحة جيدة</option>
            <option value="مريض" ${window.formData.wife.health === 'مريض' ? 'selected' : ''}>مريض (تَعاني من حالة مرضية)</option>
          </select>
          <div id="w-health-box" class="${window.formData.wife.health === 'مريض' ? '' : 'hidden'}" style="margin-top:10px;">
            <input id="w-illness" placeholder="اسم الحالة المرضية / التشخيص" style="margin-bottom:6px;" value="${window.formData.wife.illness || ''}">
            <input id="w-surgery" placeholder="نوع التدخل الجراحي أو العمليات المطلوبة" style="margin-bottom:6px;" value="${window.formData.wife.surgery || ''}">
            <input id="w-devices" placeholder="الأجهزة التعويضية المطلوبة" value="${window.formData.wife.devices || ''}">
          </div>
        </div>
        <div class="grid-2">
          <div><label>صورة البطاقة (وش)</label><input type="file" id="w-id-front"></div>
          <div><label>صورة البطاقة (ظهر)</label><input type="file" id="w-id-back"></div>
        </div>
        <div><label>التقرير الطبي أو الروشتة (في حالة مرض الزوجة)</label><input type="file" id="w-medical-doc"></div>
      `;
    }
    else if (window.currentStep === 3) {
      html += `
        <h4 style="color:var(--primary-dark); margin-top:0;">👶 القسم الثالث: بيانات الأبناء والتابعين</h4>
        <p style="font-size:13px; color:#64748b;">قم بإضافة الأبناء إن وجدوا، مع إرفاق شهادة الميلاد لكل ابن.</p>
        <div id="children-list">
          ${(window.formData.children || []).map((c, idx) => `
            <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:12px; border-radius:10px; margin-bottom:10px;">
              <strong>الابن رقم ${idx + 1}</strong>
              <div class="grid-3" style="margin-top:8px;">
                <input placeholder="اسم الابن ثلاثي" class="c-name" value="${c.name || ''}">
                <input type="date" class="c-dob" value="${c.dob || ''}">
                <select class="c-edu">
                  <option value="سن تحضيري / حضانة" ${c.edu==='سن تحضيري / حضانة'?'selected':''}>سن تحضيري / حضانة</option>
                  <option value="ابتدائي" ${c.edu==='ابتدائي'?'selected':''}>تعليم ابتدائي</option>
                  <option value="إعدادي" ${c.edu==='إعدادي'?'selected':''}>تعليم إعدادي</option>
                  <option value="ثانوي / فني" ${c.edu==='ثانوي / فني'?'selected':''}>ثانوي أو فني</option>
                  <option value="جامعي" ${c.edu==='جامعي'?'selected':''}>جامعي</option>
                  <option value="غير مقيد" ${c.edu==='غير مقيد'?'selected':''}>غير مقيد بالتعليم</option>
                </select>
              </div>
              <div style="margin-top:6px;"><label style="font-size:11px;">شهادة الميلاد:</label> <input type="file" class="c-cert"></div>
              <button type="button" onclick="removeChildRow(${idx})" class="nav-btn" style="background:#b91c1c; color:#fff; margin-top:6px; font-size:11px;">حذف هذا الابن</button>
            </div>
          `).join('')}
        </div>
        <button type="button" onclick="addChildRow()" class="action-btn" style="background:#0f172a; margin-top:10px;">+ إضافة ابن آخر</button>
      `;
    }
    else if (window.currentStep === 4) {
      html += `
        <h4 style="color:var(--primary-dark); margin-top:0;">💸 القسم الرابع: المصروفات والأعباء الشهرية</h4>
        <p style="font-size:13px; color:#64748b;">سجل كافة المصروفات الشهرية لتحديد العجز المالي بدقة:</p>
        <div class="grid-2">
          <div><label>قيمة الإيجار الشهري (إن وجد)</label><input type="number" id="exp-rent" value="${window.formData.expenses.rent || 0}" oninput="calcTotals()"></div>
          <div><label>فواتير المرافق (مياه + كهرباء + غاز)</label><input type="number" id="exp-utilities" value="${window.formData.expenses.utilities || 0}" oninput="calcTotals()"></div>
          <div><label>مصاريف تعليم الأبناء والمستلزمات</label><input type="number" id="exp-edu" value="${window.formData.expenses.edu || 0}" oninput="calcTotals()"></div>
          <div><label>مصاريف العلاج والأدوية المزمنة</label><input type="number" id="exp-health" value="${window.formData.expenses.health || 0}" oninput="calcTotals()"></div>
          <div><label>المستلزمات المعيشية الأساسية (مأكل ومسكن)</label><input type="number" id="exp-food" value="${window.formData.expenses.food || 0}" oninput="calcTotals()"></div>
          <div><label>أقساط ديون / التزامات أخرى</label><input type="number" id="exp-debts" value="${window.formData.expenses.debts || 0}" oninput="calcTotals()"></div>
        </div>
        <div style="background:#fee2e2; border:1px solid #fecaca; padding:14px; border-radius:10px; margin-top:14px; text-align:center;">
          <span style="font-weight:700; color:#991b1b; font-size:16px;">إجمالي المصروفات الشهرية: <strong id="total-exp-display">0</strong> جنيه</span>
        </div>
      `;
    }
    else if (window.currentStep === 5) {
      html += `
        <h4 style="color:var(--primary-dark); margin-top:0;">💵 القسم الخامس: مصادر الدخل والفائض أو العجز</h4>
        <p style="font-size:13px; color:#64748b;">سجل كافة مصادر الدخل الشهرية الثابتة والمتغيرة للأسرة:</p>
        <div class="grid-2">
          <div><label>دخل الزوج من العمل / المهنة</label><input type="number" id="inc-husband" value="${window.formData.incomes.husband || 0}" oninput="calcTotals()"></div>
          <div><label>دخل الزوجة أو الأبناء العاملين</label><input type="number" id="inc-others" value="${window.formData.incomes.others || 0}" oninput="calcTotals()"></div>
          <div><label>معاش حكومي / تضامن اجتماعي</label><input type="number" id="inc-pension" value="${window.formData.incomes.pension || 0}" oninput="calcTotals()"></div>
          <div><label>مساعدات ثابتة من أهل الخير / الجمعيات</label><input type="number" id="inc-aid" value="${window.formData.incomes.aid || 0}" oninput="calcTotals()"></div>
        </div>
        <div style="background:#ecfdf5; border:1px solid #a7f3d0; padding:14px; border-radius:10px; margin-top:14px; text-align:center;">
          <p style="margin:0 0 6px; font-weight:700; color:#065f46;">إجمالي الدخل الشهري: <strong id="total-inc-display">0</strong> جنيه</p>
          <hr style="border:0; border-top:1px solid #a7f3d0; margin:8px 0;">
          <span id="balance-display" style="font-weight:800; font-size:18px;">صافي الوضع المالي: -</span>
        </div>
      `;
    }
    else if (window.currentStep === 6) {
      html += `
        <h4 style="color:var(--primary-dark); margin-top:0;">📋 القسم السادس: المستندات الرسمية، وصف السكن، ورأي الباحث</h4>
        <div class="grid-2" style="margin-bottom:12px;">
          <div><label>البحث الاجتماعي (مختوم)</label><input type="file" id="doc-social-research"></div>
          <div><label>جواب الحيازة الزراعية (إن وجد)</label><input type="file" id="doc-land-tenure"></div>
          <div><label>عقد الإيجار (إن وجد)</label><input type="file" id="doc-lease"></div>
          <div><label>برنت تأميني أو بيان معاش للزوج</label><input type="file" id="doc-insurance-h"></div>
          <div><label>برنت تأميني للزوجة</label><input type="file" id="doc-insurance-w"></div>
          <div><label>إثبات قيد بأسماء الأبناء (مدرسي)</label><input type="file" id="doc-school-enroll"></div>
        </div>
        <div style="margin-bottom:10px;">
          <label style="font-weight:700;">وصف السكن والفرش وطبيعة المسكن *</label>
          <textarea id="housing-desc" rows="3" placeholder="اكتب وصفاً مفصلاً لحالة السكن (ملك/إيجار/مضيف)، نوع الأسقف والجدران، ومستوى الأثاث والفرش والأجهزة المتوفرة...">${window.formData.housing.desc || ''}</textarea>
        </div>
        <div style="margin-bottom:10px;">
          <label style="font-weight:700;">رأي الباحث الميداني وتوصية الحالة *</label>
          <textarea id="researcher-opinion" rows="3" placeholder="مدى استحقاق الأسرة، مدى صدق البيانات، ونوع المصلحة أو التدخل الأنسب...">${window.formData.housing.opinion || ''}</textarea>
        </div>
        <div style="background:#fffbeb; border:1px solid #fde68a; padding:14px; border-radius:10px; margin-bottom:14px;">
          <label style="display:flex; align-items:center; gap:8px; font-weight:700; cursor:pointer; color:#92400e;">
            <input type="checkbox" id="declaration-check" style="width:auto; margin:0;"> أقر أنا مقدم الطلب بأن كافة البيانات والمستندات المسجلة صحيحة تماماً وتحت مسئوليتي القانونية والمجتمعية، وأوافق على إجراء البحث الميداني.
          </label>
        </div>
      `;
    }

    html += `
      <div style="display:flex; justify-content:space-between; margin-top:20px;">
        ${window.currentStep > 1 ? '<button type="button" onclick="prevWizardStep()" class="nav-btn" style="background:#334155; color:#fff;">السابق</button>' : '<div></div>'}
        ${window.currentStep < totalWizardSteps ? '<button type="button" onclick="nextWizardStep()" class="action-btn">التالي ➔</button>' : '<button type="button" onclick="submitFullWizardApplication()" class="action-btn" style="background:#15803d;">✅ تأكيد والرفع النهائي للحالة</button>'}
      </div>
    `;

    container.innerHTML = html;
    if (window.currentStep === 4 || window.currentStep === 5) window.calcTotals();
  };

  window.nextWizardStep = function() {
    saveCurrentStepData();
    window.currentStep++;
    window.renderWizardStep();
  };

  window.prevWizardStep = function() {
    saveCurrentStepData();
    window.currentStep--;
    window.renderWizardStep();
  };

  function saveCurrentStepData() {
    if (window.currentStep === 1) {
      window.formData.husband = {
        name1: document.getElementById('h-name1')?.value || '',
        name2: document.getElementById('h-name2')?.value || '',
        name3: document.getElementById('h-name3')?.value || '',
        nid: document.getElementById('h-nid')?.value || '',
        phone: document.getElementById('h-phone')?.value || '',
        edu: document.getElementById('h-edu')?.value || '',
        job: document.getElementById('h-job')?.value || '',
        health: document.getElementById('h-health')?.value || '',
        illness: document.getElementById('h-illness')?.value || '',
        surgery: document.getElementById('h-surgery')?.value || '',
        devices: document.getElementById('h-devices')?.value || ''
      };
    } else if (window.currentStep === 2) {
      window.formData.wife = {
        name1: document.getElementById('w-name1')?.value || '',
        name2: document.getElementById('w-name2')?.value || '',
        name3: document.getElementById('w-name3')?.value || '',
        nid: document.getElementById('w-nid')?.value || '',
        phone: document.getElementById('w-phone')?.value || '',
        edu: document.getElementById('w-edu')?.value || '',
        job: document.getElementById('w-job')?.value || '',
        health: document.getElementById('w-health')?.value || '',
        illness: document.getElementById('w-illness')?.value || '',
        surgery: document.getElementById('w-surgery')?.value || '',
        devices: document.getElementById('w-devices')?.value || ''
      };
    } else if (window.currentStep === 3) {
      const rows = document.querySelectorAll('#children-list > div');
      window.formData.children = [];
      rows.forEach(r => {
        window.formData.children.push({
          name: r.querySelector('.c-name')?.value || '',
          dob: r.querySelector('.c-dob')?.value || '',
          edu: r.querySelector('.c-edu')?.value || ''
        });
      });
    } else if (window.currentStep === 4) {
      window.formData.expenses = {
        rent: parseFloat(document.getElementById('exp-rent')?.value) || 0,
        utilities: parseFloat(document.getElementById('exp-utilities')?.value) || 0,
        edu: parseFloat(document.getElementById('exp-edu')?.value) || 0,
        health: parseFloat(document.getElementById('exp-health')?.value) || 0,
        food: parseFloat(document.getElementById('exp-food')?.value) || 0,
        debts: parseFloat(document.getElementById('exp-debts')?.value) || 0
      };
    } else if (window.currentStep === 5) {
      window.formData.incomes = {
        husband: parseFloat(document.getElementById('inc-husband')?.value) || 0,
        others: parseFloat(document.getElementById('inc-others')?.value) || 0,
        pension: parseFloat(document.getElementById('inc-pension')?.value) || 0,
        aid: parseFloat(document.getElementById('inc-aid')?.value) || 0
      };
    } else if (window.currentStep === 6) {
      window.formData.housing = {
        desc: document.getElementById('housing-desc')?.value || '',
        opinion: document.getElementById('researcher-opinion')?.value || ''
      };
    }
  }

  window.addChildRow = function() {
    if (!window.formData.children) window.formData.children = [];
    window.formData.children.push({ name: '', dob: '', edu: 'ابتدائي' });
    window.renderWizardStep();
  };

  window.removeChildRow = function(idx) {
    window.formData.children.splice(idx, 1);
    window.renderWizardStep();
  };

  window.toggleHealthDetails = function(type) {
    const el = document.getElementById(type + '-health');
    const box = document.getElementById(type + '-health-box');
    if (el && box) {
      if (el.value === 'مريض') box.classList.remove('hidden');
      else box.classList.add('hidden');
    }
  };

  window.calcTotals = function() {
    const expRent = parseFloat(document.getElementById('exp-rent')?.value) || 0;
    const expUtil = parseFloat(document.getElementById('exp-utilities')?.value) || 0;
    const expEdu = parseFloat(document.getElementById('exp-edu')?.value) || 0;
    const expHealth = parseFloat(document.getElementById('exp-health')?.value) || 0;
    const expFood = parseFloat(document.getElementById('exp-food')?.value) || 0;
    const expDebts = parseFloat(document.getElementById('exp-debts')?.value) || 0;

    const totalExp = expRent + expUtil + expEdu + expHealth + expFood + expDebts;
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
        balDisplay.innerHTML = `⚠️ يوجد عجز مالي شهري بقيمة: <span style="color:#b91c1c;">${Math.abs(balance)} جنيه</span> (حالة مستحقة للدعم)`;
      } else {
        balDisplay.innerHTML = `🟢 يوجد فائض مالي شهري بقيمة: <span style="color:#065f46;">${balance} جنيه</span>`;
      }
    }
  };

  window.submitFullWizardApplication = async function() {
    saveCurrentStepData();
    const check = document.getElementById('declaration-check');
    if (check && !check.checked) {
      return alert('⚠️ يجب الموافقة على إقرار صحة البيانات قبل التأكيد والرفع.');
    }

    const trackingCode = 'HF-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    
    const totalExp = (window.formData.expenses.rent || 0) + (window.formData.expenses.utilities || 0) + (window.formData.expenses.edu || 0) + (window.formData.expenses.health || 0) + (window.formData.expenses.food || 0) + (window.formData.expenses.debts || 0);
    const totalInc = (window.formData.incomes.husband || 0) + (window.formData.incomes.others || 0) + (window.formData.incomes.pension || 0) + (window.formData.incomes.aid || 0);

    const payload = {
      tracking_code: trackingCode,
      governorate: 'بني سويف',
      center_city: 'إهناسيا',
      village_hamlet: 'منشأة عبدالصمد',
      aid_type: 'مساعدة اجتماعية شاملة',
      total_income: totalInc,
      total_expenses: totalExp,
      status: 'pending',
      husband_data: window.formData.husband,
      wife_data: window.formData.wife,
      children_data: window.formData.children,
      housing_data: window.formData.housing
    };

    if (window.supabaseClient) {
      const res = await window.supabaseClient.from('families').insert([payload]);
      if (res.error) {
        alert('❌ خطأ أثناء الرفع: ' + res.error.message);
      } else {
        alert(`✅ تم رفع استمارة الحالة بنجاح!\n\nكود المتابعة الخاص بالأسرة هو: ${trackingCode}\nاحتفظ به للاستعلام عن حالة الطلب.`);
        location.reload();
      }
    } else {
      alert(`✅ تم إنجاز الطلب محلياً بنجاح!\nكود المتابعة: ${trackingCode}`);
    }
  };

})();
