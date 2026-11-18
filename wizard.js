// wizard.js - النسخة الشاملة والمحدثة بالكامل (خانات اختيار وتوثيق دقيق)
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
      debts: { hasDebt: 'لا', items: [] },
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

    // --- القسم الأول: بيانات الزوج ---
    if (window.currentStep === 1) {
      html += `
        <h4 style="color:var(--primary-dark); margin-top:0;">👤 القسم الأول: بيانات الزوج (رب الأسرة)</h4>
        <div class="grid-3">
          <div><label>الاسم الأول *</label><input id="h-name1" value="${window.formData.husband.name1 || ''}"></div>
          <div><label>الاسم الثاني *</label><input id="h-name2" value="${window.formData.husband.name2 || ''}"></div>
          <div><label>الاسم الثالث *</label><input id="h-name3" value="${window.formData.husband.name3 || ''}"></div>
        </div>
        <div class="grid-2">
          <div>
            <label>حالة الزوج *</label>
            <select id="h-status" onchange="toggleHusbandStatus()">
              <option value="سليم" ${window.formData.husband.status==='سليم'?'selected':''}>سليم وبصحة جيدة</option>
              <option value="متوفى" ${window.formData.husband.status==='متوفى'?'selected':''}>متوفى</option>
              <option value="أرمل" ${window.formData.husband.status==='أرمل'?'selected':''}>أرمل</option>
              <option value="مسجون" ${window.formData.husband.status==='مسجون'?'selected':''}>مسجون</option>
              <option value="مطلق" ${window.formData.husband.status==='مطلق'?'selected':''}>مطلق</option>
              <option value="هجر" ${window.formData.husband.status==='هجر'?'selected':''}>هجر (مهجورة / هارب)</option>
            </select>
          </div>
          <div><label>الرقم القومي (14 رقم) *</label><input id="h-nid" maxlength="14" placeholder="14 رقم حصراً" value="${window.formData.husband.nid || ''}"></div>
        </div>
        <div class="grid-2">
          <div><label>رقم التليفون الأساسي (11 رقم) *</label><input id="h-phone" maxlength="11" value="${window.formData.husband.phone || ''}"></div>
          <div><label>رقم الواتساب أو تليفون بديل (11 رقم)</label><input id="h-whatsapp" maxlength="11" value="${window.formData.husband.whatsapp || ''}"></div>
        </div>
        <div class="grid-2">
          <div>
            <label>المستوى التعليمي *</label>
            <select id="h-edu-level" onchange="toggleHEdu()">
              <option value="غير متعلم" ${window.formData.husband.eduLevel==='غير متعلم'?'selected':''}>غير متعلم (لا يقرأ ولا يكتب)</option>
              <option value="متعلم" ${window.formData.husband.eduLevel==='متعلم'?'selected':''}>متعلم</option>
            </select>
          </div>
          <div id="h-edu-detail-box" class="${window.formData.husband.eduLevel === 'متعلم' ? '' : 'hidden'}">
            <label>حدد المؤهل:</label>
            <select id="h-edu">
              <option value="ابتدائية" ${window.formData.husband.edu==='ابتدائية'?'selected':''}>ابتدائية</option>
              <option value="إعدادية" ${window.formData.husband.edu==='إعدادية'?'selected':''}>إعدادية</option>
              <option value="ثانوي" ${window.formData.husband.edu==='ثانوي'?'selected':''}>ثانوي</option>
              <option value="دبلوم" ${window.formData.husband.edu==='دبلوم'?'selected':''}>دبلوم فني</option>
              <option value="جامعي" ${window.formData.husband.edu==='جامعي'?'selected':''}>جامعي</option>
              <option value="ماجستير" ${window.formData.husband.edu==='ماجستير'?'selected':''}>ماجستير</option>
              <option value="دكتوراه" ${window.formData.husband.edu==='دكتوراه'?'selected':''}>دكتوراه</option>
            </select>
          </div>
        </div>
        <div class="grid-2">
          <div>
            <label>الوظيفة الحالية (اختر من القائمة)</label>
            <select id="h-job">
              <option value="عامل باليومية" ${window.formData.husband.job==='عامل باليومية'?'selected':''}>عامل باليومية</option>
              <option value="حرفي / مهني" ${window.formData.husband.job==='حرفي / مهني'?'selected':''}>حرفي / مهني</option>
              <option value="مزارع / فلاح" ${window.formData.husband.job==='مزارع / فلاح'?'selected':''}>مزارع / فلاح</option>
              <option value="موظف حكومي أو بالقطاع الخاص" ${window.formData.husband.job==='موظف حكومي أو بالقطاع الخاص'?'selected':''}>موظف حكومي أو بالقطاع الخاص</option>
              <option value="بدون عمل / عاطل" ${window.formData.husband.job==='بدون عمل / عاطل'?'selected':''}>بدون عمل / عاطل</option>
              <option value="أصحاب أمراض / غير قادر" ${window.formData.husband.job==='أصحاب أمراض / غير قادر'?'selected':''}>أصحاب أمراض / غير قادر</option>
            </select>
          </div>
          <div>
            <label>الحالة الصحية *</label>
            <select id="h-health" onchange="toggleHealth('h')">
              <option value="سليم" ${window.formData.husband.health==='سليم'?'selected':''}>سليم وبصحة جيدة</option>
              <option value="مريض" ${window.formData.husband.health==='مريض'?'selected':''}>مريض</option>
            </select>
          </div>
        </div>
        <div id="h-health-box" class="${window.formData.husband.health === 'مريض' ? '' : 'hidden'}" style="background:#f1f5f9; padding:12px; border-radius:8px; margin-bottom:10px;">
          <div class="grid-2">
            <div>
              <label>نوع المرض:</label>
              <select id="h-illness-type" onchange="toggleIllnessType('h')">
                <option value="مزمن" ${window.formData.husband.illnessType==='مزمن'?'selected':''}>مرض مزمن (سكر، ضغط، كبد، كلوي...)</option>
                <option value="مؤقت" ${window.formData.husband.illnessType==='مؤقت'?'selected':''}>إصابة أو مرض مؤقت / علاج طارئ</option>
              </select>
            </div>
            <div>
              <label>نوع الإجراء الطبي المطلوب:</label>
              <select id="h-surgery-type">
                <option value="عملية جراحية" ${window.formData.husband.surgeryType==='عملية جراحية'?'selected':''}>عملية جراحية</option>
                <option value="أجهزة تعويضية أو صناعية" ${window.formData.husband.surgeryType==='أجهزة تعويضية أو صناعية'?'selected':''}>أجهزة تعويضية أو صناعية</option>
                <option value="علاج شهري ثابت" ${window.formData.husband.surgeryType==='علاج شهري ثابت'?'selected':''}>علاج شهري ثابت</option>
                <option value="اشعة وتحاليل باهظة" ${window.formData.husband.surgeryType==='اشعة وتحاليل باهظة'?'selected':''}>أشعة وتحاليل باهظة</option>
              </select>
            </div>
          </div>
          <div style="margin-top:8px;"><label>رفع التقرير الطبي والبحث الاجتماعي:</label><input type="file" id="h-medical-doc"></div>
        </div>
        <div class="grid-2">
          <div><label>صورة بطاقة الزوج (وش) *</label><input type="file" id="h-id-front"></div>
          <div><label>صورة بطاقة الزوج (ظهر) *</label><input type="file" id="h-id-back"></div>
        </div>
      `;
    }
    // --- القسم الثاني: بيانات الزوجة ---
    else if (window.currentStep === 2) {
      html += `
        <h4 style="color:var(--primary-dark); margin-top:0;">👩 القسم الثاني: بيانات الزوجة</h4>
        <div class="grid-3">
          <div><label>الاسم الأول *</label><input id="w-name1" value="${window.formData.wife.name1 || ''}"></div>
          <div><label>الاسم الثاني *</label><input id="w-name2" value="${window.formData.wife.name2 || ''}"></div>
          <div><label>الاسم الثالث *</label><input id="w-name3" value="${window.formData.wife.name3 || ''}"></div>
        </div>
        <div class="grid-2">
          <div><label>الرقم القومي (14 رقم) *</label><input id="w-nid" maxlength="14" value="${window.formData.wife.nid || ''}"></div>
          <div><label>رقم التليفون (11 رقم)</label><input id="w-phone" maxlength="11" value="${window.formData.wife.phone || ''}"></div>
        </div>
        <div class="grid-2">
          <div>
            <label>المستوى التعليمي *</label>
            <select id="w-edu">
              <option value="غير متعلمة" ${window.formData.wife.edu==='غير متعلمة'?'selected':''}>غير متعلمة (لا تقرأ ولا تكتب)</option>
              <option value="ابتدائية" ${window.formData.wife.edu==='ابتدائية'?'selected':''}>ابتدائية</option>
              <option value="إعدادية" ${window.formData.wife.edu==='إعدادية'?'selected':''}>إعدادية</option>
              <option value="ثانوي / دبلوم" ${window.formData.wife.edu==='ثانوي / دبلوم'?'selected':''}>ثانوي أو دبلوم فني</option>
              <option value="جامعي" ${window.formData.wife.edu==='جامعي'?'selected':''}>جامعي</option>
            </select>
          </div>
          <div>
            <label>الوظيفة / النشاط *</label>
            <select id="w-job">
              <option value="ربة منزل" ${window.formData.wife.job==='ربة منزل'?'selected':''}>ربة منزل</option>
              <option value="تشتغل باليومية / زراعة" ${window.formData.wife.job==='تشتغل باليومية / زراعة'?'selected':''}>تشتغل باليومية / زراعة</option>
              <option value="حرفية / أعمال منزلية" ${window.formData.wife.job==='حرفية / أعمال منزلية'?'selected':''}>حرفية / أعمال منزلية</option>
              <option value="موظفة" ${window.formData.wife.job==='موظفة'?'selected':''}>موظفة</option>
            </select>
          </div>
        </div>
        <div style="background:#f1f5f9; padding:10px; border-radius:8px; margin-bottom:10px;">
          <label>الحالة الصحية:</label>
          <select id="w-health" onchange="toggleHealth('w')">
            <option value="سليم" ${window.formData.wife.health==='سليم'?'selected':''}>سليمة وبصحة جيدة</option>
            <option value="مريض" ${window.formData.wife.health==='مريض'?'selected':''}>مريضة</option>
          </select>
          <div id="w-health-box" class="${window.formData.wife.health === 'مريض' ? '' : 'hidden'}" style="margin-top:8px;">
            <select id="w-illness-type">
              <option value="مزمن">مرض مزمن</option>
              <option value="مؤقت">مرض أو علاج طارئ</option>
            </select>
            <input type="file" id="w-medical-doc" style="margin-top:6px;">
          </div>
        </div>
        <div class="grid-2">
          <div><label>صورة بطاقة الزوجة (وش)</label><input type="file" id="w-id-front"></div>
          <div><label>صورة بطاقة الزوجة (ظهر)</label><input type="file" id="w-id-back"></div>
        </div>
      `;
    }
    // --- القسم الثالث: بيانات الأبناء ---
    else if (window.currentStep === 3) {
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
                  <option value="دون السن / حضانة" ${c.edu==='دون السن / حضانة'?'selected':''}>دون السن / حضانة</option>
                  <option value="ابتدائي - أول" ${c.edu==='ابتدائي - أول'?'selected':''}>ابتدائي - الصف الأول</option>
                  <option value="ابتدائي - ثان" ${c.edu==='ابتدائي - ثان'?'selected':''}>ابتدائي - الصف الثاني</option>
                  <option value="ابتدائي - ثالث" ${c.edu==='ابتدائي - ثالث'?'selected':''}>ابتدائي - الصف الثالث</option>
                  <option value="ابتدائي - رابع" ${c.edu==='ابتدائي - رابع'?'selected':''}>ابتدائي - الصف الرابع</option>
                  <option value="ابتدائي - خامس" ${c.edu==='ابتدائي - خامس'?'selected':''}>ابتدائي - الصف الخامس</option>
                  <option value="ابتدائي - سادس" ${c.edu==='ابتدائي - سادس'?'selected':''}>ابتدائي - الصف السادس</option>
                  <option value="إعدادي - أول" ${c.edu==='إعدادي - أول'?'selected':''}>إعدادي - الصف الأول</option>
                  <option value="إعدادي - ثان" ${c.edu==='إعدادي - ثان'?'selected':''}>إعدادي - الصف الثاني</option>
                  <option value="إعدادي - ثالث" ${c.edu==='إعدادي - ثالث'?'selected':''}>إعدادي - الصف الثالث</option>
                  <option value="ثانوي عام / فني" ${c.edu==='ثانوي عام / فني'?'selected':''}>ثانوي عام أو فني</option>
                  <option value="تعليم جامعي" ${c.edu==='تعليم جامعي'?'selected':''}>تعليم جامعي</option>
                </select>
              </div>
              <div class="grid-2" style="margin-top:6px;">
                <div><label style="font-size:11px;">شهادة الميلاد:</label> <input type="file" class="c-cert"></div>
                <div>
                  <label style="font-size:11px;">الحالة الصحية للابن:</label>
                  <select class="c-health">
                    <option value="سليم">سليم</option>
                    <option value="مريض بمرض مزمن أو إعاقة">مريض بمرض مزمن أو إعاقة</option>
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
    // --- القسم الرابع: المصروفات ---
    else if (window.currentStep === 4) {
      html += `
        <h4 style="color:var(--primary-dark); margin-top:0;">💸 القسم الرابع: المصروفات والأعباء الشهرية</h4>
        <div class="grid-2">
          <div><label>قيمة الإيجار الشهري</label><input type="number" id="exp-rent" value="${window.formData.expenses.rent || 0}" oninput="calcTotals()"></div>
          <div><label>فواتير مياه</label><input type="number" id="exp-water" value="${window.formData.expenses.water || 0}" oninput="calcTotals()"></div>
          <div><label>فواتير كهرباء</label><input type="number" id="exp-electric" value="${window.formData.expenses.electric || 0}" oninput="calcTotals()"></div>
          <div><label>فواتير غاز أو أنبوبة</label><input type="number" id="exp-gas" value="${window.formData.expenses.gas || 0}" oninput="calcTotals()"></div>
          <div><label>مصاريف تعليم الأبناء</label><input type="number" id="exp-edu" value="${window.formData.expenses.edu || 0}" oninput="calcTotals()"></div>
          <div><label>مصاريف العلاج والأدوية المزمنة</label><input type="number" id="exp-health" value="${window.formData.expenses.health || 0}" oninput="calcTotals()"></div>
          <div><label>المستلزمات المعيشية (مأكل ومسكن)</label><input type="number" id="exp-food" value="${window.formData.expenses.food || 0}" oninput="calcTotals()"></div>
          <div><label>أقساط ديون والتزامات أخرى</label><input type="number" id="exp-debts" value="${window.formData.expenses.debts || 0}" oninput="calcTotals()"></div>
        </div>
        <div style="background:#fee2e2; border:1px solid #fecaca; padding:12px; border-radius:8px; margin-top:12px; text-align:center;">
          <span style="font-weight:700; color:#991b1b; font-size:15px;">إجمالي المصروفات الشهرية: <strong id="total-exp-display">0</strong> جنيه</span>
        </div>
      `;
    }
    // --- القسم الخامس: مصادر الدخل ---
    else if (window.currentStep === 5) {
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
    // --- القسم السادس: الديون، القضايا، وحالات الغارمين ---
    else if (window.currentStep === 6) {
      html += `
        <h4 style="color:var(--primary-dark); margin-top:0;">⚖️ القسم السادس: الديون، القضايا، ومساعدات الغارمين</h4>
        <div style="background:#f8fafc; padding:12px; border-radius:8px; margin-bottom:12px;">
          <label style="font-weight:700;">هل توجد ديون مترتبة على الأسرة أو حالات غارمين؟</label>
          <select id="has-debt-select" onchange="toggleDebtSection()">
            <option value="لا" ${window.formData.debts.hasDebt==='لا'?'selected':''}>لا توجد ديون</option>
            <option value="نعم" ${window.formData.debts.hasDebt==='نعم'?'selected':''}>نعم، توجد ديون ومطالبات قانونية</option>
          </select>
        </div>
        <div id="debt-details-box" class="${window.formData.debts.hasDebt === 'نعم' ? '' : 'hidden'}">
          <div class="grid-2" style="margin-bottom:10px;">
            <div>
              <label>نوع التوثيق القانوني:</label>
              <select id="debt-type">
                <option value="إيصالات أمانة">إيصالات أمانة</option>
                <option value="شيكات بنكية">شيكات بنكية</option>
                <option value="أحكام قضائية / قضايا متداولة">أحكام قضائية / قضايا متداولة</option>
              </select>
            </div>
            <div><label>قيمة الدين الإجمالية (جنيه)</label><input type="number" id="debt-amount" value="${window.formData.debts.amount || ''}"></div>
          </div>
          <div class="grid-2" style="margin-bottom:10px;">
            <div><label>اسم الدائن (صاحب الحق)</label><input id="debt-creditor" placeholder="اسم الشخص أو التاجر" value="${window.formData.debts.creditor || ''}"></div>
            <div><label>رقم تليفون الدائن</label><input id="debt-phone" maxlength="11" placeholder="للاستعلام الميداني" value="${window.formData.debts.phone || ''}"></div>
          </div>
          <div style="margin-bottom:10px;">
            <label>سبب الدين (اختر من القائمة):</label>
            <select id="debt-reason">
              <option value="علاج طارئ وعمليات">علاج طارئ وعمليات</option>
              <option value="زواج بنات وتجهيز عرائس">زواج بنات وتجهيز عرائس</option>
              <option value="تعثر مشروع / ضائقة تجارية">تعثر مشروع / ضائقة تجارية</option>
              <option value="مصاريف معيشة واستهلاك أساسي">مصاريف معيشة واستهلاك أساسي</option>
            </select>
          </div>
          <div><label>رفع صورة المستند (إيصال الأمانة / الشيك / شهادة الجدول المحكمة / الحكم):</label><input type="file" id="debt-doc"></div>
        </div>
      `;
    }
    // --- القسم السابع: نوع التدخل والمساعدات الخاصة (مياه - ستر ودفا - زواج) ---
    else if (window.currentStep === 7) {
      html += `
        <h4 style="color:var(--primary-dark); margin-top:0;">🎯 القسم السابع: تحديد نوع التدخل والمساعدات الخاصة</h4>
        <div style="margin-bottom:12px;">
          <label style="font-weight:700;">نوع المساعدة الأساسية المطلوبة للأسرة *</label>
          <select id="intervention-type" onchange="toggleMarriageSection()">
            <option value="مساعدة اجتماعية شاملة">مساعدة اجتماعية نقدية أو شهرية شاملة</option>
            <option value="وصلات مياه شرب">تركيب وصلة مياه شرب نقية</option>
            <option value="ستر ودفا">حملات ستر ودفا (بطاطين ومساعدات شتوية)</option>
            <option value="مساعدة طبية وعلاجية">مساعدة طبية وعلاجية / عمليات جراحية</option>
            <option value="مساعدة زواج أيتام وفتيات">مساعدة زواج أيتام وفتيات (تجهيز عرائس)</option>
            <option value="مساعدة غارمين">سداد ديون الغارمين وفك كرب</option>
          </select>
        </div>
        
        <div id="marriage-section-box" class="hidden" style="background:#fdf2f8; border:1px solid #fbcfe8; padding:12px; border-radius:8px; margin-top:10px;">
          <h5 style="color:#be185d; margin-top:0;">💍 بيانات العروسة وتجهيز الزواج</h5>
          <div class="grid-3">
            <div><label>اسم العروسة الأول</label><input id="m-name1"></div>
            <div><label>اسم العروسة الثاني</label><input id="m-name2"></div>
            <div><label>اسم العروسة الثالث</label><input id="m-name3"></div>
          </div>
          <div class="grid-2" style="margin-top:8px;">
            <div><label>الرقم القومي للعروسة (14 رقم)</label><input id="m-nid" maxlength="14"></div>
            <div><label>رقم تليفون العروسة أو وليها</label><input id="m-phone" maxlength="11"></div>
          </div>
          <div class="grid-2" style="margin-top:8px;">
            <div><label>موعد الزفاف المقترح</label><input type="date" id="m-date"></div>
            <div><label>المتفرّرات لدى العروسة</label><input id="m-available" placeholder="الأجهزة أو المنقولات المتوفرة"></div>
          </div>
          <div class="grid-2" style="margin-top:8px;">
            <div><label>صورة قسيمة الزواج أو إشهار الخطوبة</label><input type="file" id="m-cert-doc"></div>
            <div><label>الشهادة الصحية للعروسين (وش وظهر)</label><input type="file" id="m-health-doc"></div>
          </div>
        </div>
      `;
    }
    // --- القسم الثامن: السكن، المستندات الرسمية، ورأي الباحث ---
    else if (window.currentStep === 8) {
      html += `
        <h4 style="color:var(--primary-dark); margin-top:0;">📋 القسم الثامن: وصف السكن، المستندات الرسمية، ورأي الباحث</h4>
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
              <option value="مسلح">مسلح (خرسانة)</option>
              <option value="جريد">جريد</option>
              <option value="بوص">بوص</option>
              <option value="عفش / عشش">عفش / عشش</option>
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
            <option value="رذيء / معدوم">رديء / معدوم</option>
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
    if (window.currentStep === 4 || window.currentStep === 5) window.calcTotals();
  };

  // --- دوال المساعدة التفاعلية ---
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

  window.toggleHEdu = function() {
    const val = document.getElementById('h-edu-level')?.value;
    const box = document.getElementById('h-edu-detail-box');
    if (box) {
      if (val === 'متعلم') box.classList.remove('hidden');
      else box.classList.add('hidden');
    }
  };

  window.toggleHealth = function(type) {
    const val = document.getElementById(type + '-health')?.value;
    const box = document.getElementById(type + '-health-box');
    if (box) {
      if (val === 'مريض') box.classList.remove('hidden');
      else box.classList.add('hidden');
    }
  };

  window.toggleDebtSection = function() {
    const val = document.getElementById('has-debt-select')?.value;
    const box = document.getElementById('debt-details-box');
    if (box) {
      if (val === 'نعم') box.classList.remove('hidden');
      else box.classList.add('hidden');
    }
  };

  window.toggleMarriageSection = function() {
    const val = document.getElementById('intervention-type')?.value;
    const box = document.getElementById('marriage-section-box');
    if (box) {
      if (val === 'مساعدة زواج أيتام وفتيات') box.classList.remove('hidden');
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
    window.formData.children.push({ name: '', nid: '', edu: 'ابتدائي - أول' });
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
      window.formData.husband = {
        name1: document.getElementById('h-name1')?.value || '',
        name2: document.getElementById('h-name2')?.value || '',
        name3: document.getElementById('h-name3')?.value || '',
        status: document.getElementById('h-status')?.value || '',
        nid: document.getElementById('h-nid')?.value || '',
        phone: document.getElementById('h-phone')?.value || '',
        whatsapp: document.getElementById('h-whatsapp')?.value || '',
        eduLevel: document.getElementById('h-edu-level')?.value || '',
        edu: document.getElementById('h-edu')?.value || '',
        job: document.getElementById('h-job')?.value || '',
        health: document.getElementById('h-health')?.value || '',
        illnessType: document.getElementById('h-illness-type')?.value || '',
        surgeryType: document.getElementById('h-surgery-type')?.value || ''
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
        health: document.getElementById('w-health')?.value || ''
      };
    } else if (window.currentStep === 3) {
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
    } else if (window.currentStep === 4) {
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
    } else if (window.currentStep === 5) {
      window.formData.incomes = {
        husband: parseFloat(document.getElementById('inc-husband')?.value) || 0,
        others: parseFloat(document.getElementById('inc-others')?.value) || 0,
        pension: parseFloat(document.getElementById('inc-pension')?.value) || 0,
        aid: parseFloat(document.getElementById('inc-aid')?.value) || 0
      };
    } else if (window.currentStep === 6) {
      window.formData.debts = {
        hasDebt: document.getElementById('has-debt-select')?.value || 'لا',
        type: document.getElementById('debt-type')?.value || '',
        amount: parseFloat(document.getElementById('debt-amount')?.value) || 0,
        creditor: document.getElementById('debt-creditor')?.value || '',
        phone: document.getElementById('debt-phone')?.value || '',
        reason: document.getElementById('debt-reason')?.value || ''
      };
    } else if (window.currentStep === 7) {
      window.formData.interventionType = document.getElementById('intervention-type')?.value || 'مساعدة اجتماعية شاملة';
      if (window.formData.interventionType === 'مساعدة زواج أيتام وفتيات') {
        window.formData.marriage = {
          name1: document.getElementById('m-name1')?.value || '',
          name2: document.getElementById('m-name2')?.value || '',
          name3: document.getElementById('m-name3')?.value || '',
          nid: document.getElementById('m-nid')?.value || '',
          phone: document.getElementById('m-phone')?.value || '',
          date: document.getElementById('m-date')?.value || '',
          available: document.getElementById('m-available')?.value || ''
        };
      }
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
      governorate: 'بني سويف',
      center_city: 'إهناسيا',
      aid_type: window.formData.interventionType,
      total_income: totalInc,
      total_expenses: totalExp,
      status: 'pending',
      husband_data: window.formData.husband,
      wife_data: window.formData.wife,
      children_data: window.formData.children,
      debts_data: window.formData.debts,
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
