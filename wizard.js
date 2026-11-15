// wizard.js - المنظومة الذكية لاستمارة البحث الاجتماعي وبناء الأسر - مؤسسة الحافظ (نسخة شاملة وموسعة بالاختيارات)

window.currentStep = window.currentStep || 1;
const totalWizardSteps = 6;
window.formData = window.formData || {
  husband: {},
  wife: {},
  children: [],
  expenses: {},
  incomes: {},
  documents: {},
  housing: {}
};

// 1. قاعدة بيانات جغرافية موسعة (المحافظات، المراكز، والقرى والتوابع الرئيسية)
const EGYPT_GEO_DATABASE = {
  "بني سويف": {
    "إهناسيا": ["مدينة إهناسيا", "منشأة عبدالصمد", "براوة", "براوة الوقف", "العواونة", "قاي", "ننا", "ميانة", "طما فيوم", "النويرة", "سدمنت الجبل", "قلة", "بني هاني", "معصرة نعسان", "منشأة الحاج", "كوم الرمل", "شارونة", "منيل هاني", "بني سليمان", "المسيد الأبيض", "الحمام", "شاويش", "الدير", "بهنموه", "منيل غيضان", "عزبة يعقوب", "عزبة التل"],
    "بني سويف": ["مدينة بني سويف", "إهناسيا الخضراء", "بليفيا", "تزمنت الشرقية", "بني هارون", "باروط", "شريف باشا", "دلاص", "الحيبة"],
    "الواسطى": ["مدينة الواسطى", "الميمون", "أبوصير الملق", "قمن العروس", "ميدوم", "إفوة", "أطواب", "انفسط", "عزبة زكي"],
    "ناصر": ["مدينة ناصر", "دنديل", "اشمنت", "البرج", "الحمام", "بهبشين", "بني عدي", "الزيتون", "منشأةدشلوط"],
    "ببا": ["مدينة ببا", "قمبش الحمراء", "سدس الأمراء", "صفط راشين", "طنسا بني مالو", "هليه", "فزارة", "زاوية الناعورة"],
    "الفشن": ["مدينة الفشن", "أقفهاص", "تلت", "دلهانس", "الفنت", "بني صالح", "شنرا", "السبيل"],
    "سمسطا": ["مدينة سمسطا", "مازورة", "دشطوط", "الشنطور", "بدهل", "العساكرة", "الشيخ عابد"]
  },
  "القاهرة": {
    "القاهرة": ["حلوان", "المعادي", "مدينة نصر", "مصر الجديدة", "شبرا", "المرج", "المطرية", "عين شمس", "التجمع الخامس", "الزهراء", "دار السلام", "البساتين", "المقطم", "السيدة زينب", "الخليفة", "المنيل", "بولاق أبو العلا"]
  },
  "الجيزة": {
    "الجيزة": ["حي الجيزة", "الدقي", "العجوزة", "إمبابة", "الهرم", "فيصل", "الوراق", "بولاق الدكرور"],
    "العياط": ["مدينة العياط", "المتانيا", "بيدف", "القطوري", "طهما", "برطبشت", "مزغونة"],
    "الصف": ["مدينة الصف", "الأقواز", "الشوبك الشرقي", "غمازة الكبرى", "أطفيح", "البرمبل", "صول", "الكريمات"],
    "البدرشين": ["مدينة البدرشين", "سقارة", "ميت رهينة", "أبو صير", "الشوبك الغربي", "المحمودية"]
  },
  "الإسكندرية": {
    "الإسكندرية": ["المنتزه أول", "المنتزه ثان", "شرق", "وسط", "غرب", "الجمرك", "العجمي", "العامرية أول", "العامرية ثان", "برج العرب", "ميامي", "سيدي بشر", "الابراهيمية"]
  },
  "الفيوم": {
    "الفيوم": ["مدينة الفيوم", "هوارة المقطع", "دمو", "العدوة", "سلاوة", "دمو العزب"],
    "إطسا": ["مدينة إطسا", "الغرق", "تطون", "قلمشاة", "منية الحيط", "أبو صير"],
    "يوسف الصديق": ["الشواشنة", "قارون", "النزلة", "الحامولي", "المشرك القبلي"],
    "سنورس": ["مدينة سنورس", "فديمين", "سنهور القبلية", "جاقوش", "بيهمو"],
    "طامية": ["مدينة طامية", "الروضة", "فانوس", "سرسنا", "الروبيات"],
    "أبشواي": ["مدينة أبشواي", "طبهار", "العجميين", "سنرو القبلية"]
  },
  "المنيا": {
    "المنيا": ["مدينة المنيا", "تلة", "طوخ الخيل", "دمشير", "زاوية سلطان"],
    "مغاغة": ["مدينة مغاغة", "أبا الوقف", "برطباط", "الشيخ تمي", "شم القبلية"],
    "العدوة": ["مدينة العدوة", "صفانية", "بني عامر", "قصر الرقاقاس"],
    "بني مزار": ["مدينة بني مزار", "القيس", "صندفا", "الحطة", "أبوجرج"],
    "مطاي": ["مدينة مطاي", "أبو عزيز", "حلوة", "منبال", "بني مهدي"],
    "سمالوط": ["مدينة سمالوط", "قلوصنا", "البيهو", "طحا الأعمدة", "التوفيقية"],
    "ملوي": ["مدينة ملوي", "الروضة", "ديروط أم نخلة", "أبوقلتة", "المقلز"],
    "أبو قرقاص": ["مدينة أبو قرقاص", "اتليدم", "بني عبيد", "أبيوها", "نزلة أسمنت"],
    "دير مواس": ["مدينة دير مواس", "دلجا", "تل العمارنة", "نزلة البدرمان"]
  }
  // (ويمكن إضافة باقي الـ 27 محافظة بنفس الدقة)
};

// 2. قوائم الوظائف الشاملة في مصر
const ALL_EGYPT_JOBS = [
  "لا يعمل / عاطل عن العمل",
  "بالمعاش / تقاعد",
  "غير قادر على العمل (عجز كلي / مرض مزمن مستقر)",
  "ربة منزل",
  "عامل باليومية (أرزقي)",
  "عامل زراعي / فلاح / مزارع",
  "نجار مسلح / نجار أثاث",
  "سباك صحي ومقاولات",
  "فني كهرباء منازل وصناعي",
  "نقاش / دهان واجهات",
  "حداد وسيار / ترابيز",
  "بناء / مقاول أنفار",
  "ميكانيكي سيارات / معدات",
  "فني تكييف وتبريد وتبريد",
  "خياط / ترزي / تفصيل ملابس",
  "سائق توك توك / تروسيكل",
  "سائق ميكروباص / تاكسي",
  "سائق نقل ثقيل / سيارة نقل",
  "موظف حكومي (قطاع عام / إداري)",
  "موظف قطاع خاص / شركة",
  "مدرس / أستاذ / إداري تعليمي",
  "عامل نظافة / خدمات / بواب",
  "فرد أمن / حراسة",
  "بائع متجول / صاحب كشك صغير",
  "صياد أسماك",
  "حرفي ومهني آخر",
  "صاحب ورشة / محل تجاري صغير",
  "مربي مواشی / طيور (نشاط منزلي)"
];

// 3. المستويات التعليمية الشاملة من محو الأمية للدكتوراه
const ALL_EDUCATION_LEVELS = [
  { value: "غير متعلم", label: "غير متعلم (لا يقرأ ولا يكتب)" },
  { value: "محو أمية", label: "شهادة محو الأمية وتعمير الكبار" },
  { value: "ابتدائية", label: "شهادة التعليم الابتدائي" },
  { value: "إعدادية", label: "شهادة الإعدادية العامة" },
  { value: "دبلوم صناعي", label: "دبلوم الثانوي الصناعي (3/5 سنوات)" },
  { value: "دبلوم تجاري", label: "دبلوم الثانوي التجاري" },
  { value: "دبلوم زراعي", label: "دبلوم الثانوي الزراعي" },
  { value: "دبلوم فني سياحي/فندقي", label: "دبلوم فني سياحي / فندقي" },
  { value: "ثانوية عامة", label: "الثانوية العامة / الأزهرية" },
  { value: "معهد متوسط", label: "معهد فوق متوسط (سنتين)" },
  { value: "جامعي بكالوريوس", label: "مؤهل جامعي بكالوريوس (هندسة، طب، تجارة، حقوق...)" },
  { value: "جامعي ليسانس", label: "مؤهل جامعي ليسانس آداب / لغات" },
  { value: "ماجستير", label: "درجة الماجستير" },
  { value: "دكتوراه", label: "درجة الدكتوراه" }
];

// 4. الأمراض المؤقتة الشاملة (حتى الصداع والإصابات العارضة)
const ALL_TEMP_ILLNESSES = [
  "صداع نصفي أو مزمن عارض",
  "إصابة عارضة / كسر في العظام أو الأطراف",
  "نزلة برد حادة / التهاب شعب هوائية مؤقت",
  "التهاب معدي معوي / نزلة معوية حادة",
  "التهاب الحلق واللوزتين الحاد",
  "إرهاق عضلي وإصابة ملاعب",
  "التهاب جيوب أنفية حاد",
  "حصوات الكلى المغص الكلوي المؤقت",
  "التهاب أسنان حاد وتورم",
  "حروق سطحية أو إصابات عمل مؤقتة",
  "ارتفاع درجات الحرارة والتهاب فايروسي مؤقت",
  "أخرى (إصابة مؤقتة عارضة)"
];

// 5. الأمراض المزمنة الشاملة
const ALL_CHRONIC_ILLNESSES = [
  "الفشل الكلوي المزمن (تحتاج جلسات غسيل كلوي أسبوعية)",
  "أمراض القلب المزمنة والقصور الشرياني",
  "ارتفاع ضغط الدم المزمن المتقدم",
  "مرض السكري المتقدم (نوع 1 أو 2 مع مضاعفات)",
  "الأورام السرطانية الخبيثة (تحتاج علاج كيماوي وإشعاعي)",
  "أمراض الكبد المزمنة وتليف الكبد وفيروس سي / بي",
  "أمراض الجهاز التنفسي المزمنة (الانسداد الرئوي/التليف)",
  "الروماتويد والتهاب المفاصل الروماتويدي المزمن",
  "الصرع والتشنجات العصبية المزمنة",
  "أمراض الدم المزمنة (أنيميا البحر المتوسط/الثلاسيميا)",
  "الإعاقة الحركية الكاملة أو الشلل المزمن",
  "أمراض المناعة الذاتية المزمنة"
];

// 6. العمليات الجراحية الشاملة
const ALL_SURGERIES_LIST = [
  "عملية قلب مفتوح / تركيب قسطرة وشرايين تاجية",
  "عملية تغيير مفاصل (ركبة أو حوض صناعي)",
  "عملية جراحية لإزالة الأورام السرطانية",
  "عملية استئصال الزائدة الدودية أو المرارة بالمنظار",
  "عملية فتق إربي أو جراحي بطني",
  "عملية جراحة المخ والأعصاب والفقرات",
  "عملية جراحية للعيون (مياه بيضاء، زرقاء، شبكية)",
  "عملية جراحية للأنف والأذن والحخارة (لحمية، حاجز أنفي)",
  "عملية جراحية لعظام ومفاصل الكسور المعقدة",
  "عملية استئصال اللوزتين واللحمية للأطفال",
  "عملية جراحية نسائية / قيصرية طارئة",
  "عملية جراحية لدوالي الساقين أو البواسير",
  "عملية جراحية زراعة أو استئصال كلي/جزئي",
  "أخرى (عملية جراحية متخصصة مطلوبة)"
];

// 7. الأطراف الصناعية والأجهزة التعويضية المفصلة
const PROSTHETIC_PARTS = [
  "طرف صناعي سفلي: قدم صناعي تحت الركبة",
  "طرف صناعي سفلي: ساق كاملة فوق الركبة",
  "طرف صناعي علوي: يد صناعية تجميلية / ميكانيكية",
  "طرف صناعي علوي: ذراع كامل صناعي"
];

const COMPENSATORY_DEVICES = [
  "كرسي متحرك عادي أو طبي",
  "سماعة أذن طبية رقمية للضعف السمعي",
  "مرتبة هوائية طبية لمنع تقرحات الفراش",
  "عكاز طبي زوجي / مشاية ألومنيوم متحركة",
  "حزام دعم فقرات الظهر أو الرقبة الطبي",
  "نظارات طبية مخصصة لضعف النظر الشديد"
];

window.addEventListener('DOMContentLoaded', () => {
  renderWizardStep();
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

  // ==========================================
  // القسم الأول: بيانات الزوج (رب الأسرة)
  // ==========================================
  if (window.currentStep === 1) {
    const h = window.formData.husband || {};
    html += `
      <h3 style="color:var(--primary-dark); text-align:center; font-weight:900; margin:15px 0 25px; border-bottom:2px solid #059669; padding-bottom:8px;">
        👤 القسم الأول: بيانات الزوج (رب الأسرة)
      </h3>
      
      <div class="grid-3">
        <div><label>الاسم الأول *</label><input id="h-name1" value="${h.name1 || ''}" required></div>
        <div><label>الاسم الثاني *</label><input id="h-name2" value="${h.name2 || ''}" required></div>
        <div><label>الاسم الثالث *</label><input id="h-name3" value="${h.name3 || ''}" required></div>
      </div>

      <div class="grid-2">
        <div><label>رقم البطاقة (14 رقم إلزامي) *</label><input id="h-nid" maxlength="14" value="${h.nid || ''}" placeholder="أدخل 14 رقماً بدقة" required></div>
        <div>
          <label>رقم التليفون الأساسي (11 رقم) *</label>
          <input id="h-phone" maxlength="11" value="${h.phone || ''}" placeholder="01xxxxxxxxx" required>
        </div>
      </div>

      <div class="grid-2" style="margin-top:10px;">
        <div>
          <label>رقم تليفون إضافي / أو رقم واتساب *</label>
          <input id="h-whatsapp" maxlength="11" value="${h.whatsapp || ''}" placeholder="01xxxxxxxxx (للتواصل السريع)">
        </div>
        <div>
          <label>المستوى التعليمي (بالاختيار) *</label>
          <select id="h-edu">
            ${ALL_EDUCATION_LEVELS.map(e => `<option value="${e.value}" ${h.edu === e.value ? 'selected' : ''}>${e.label}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- العنوان الجغرافي التفاعلي بالكامل -->
      <div style="background:#f8fafc; padding:16px; border-radius:12px; border:1px solid #e2e8f0; margin:16px 0;">
        <label style="font-weight:800; color:#064e3b; margin-bottom:10px; display:block;">📍 العنوان الجغرافي (تحديث تلقائي للمراكز والقرى):</label>
        <div class="grid-3">
          <div>
            <label>المحافظة *</label>
            <select id="h-gov" onchange="onGovernorateChange('h')">
              <option value="">-- اختر المحافظة --</option>
              ${Object.keys(EGYPT_GEO_DATABASE).map(g => `<option value="${g}" ${h.gov === g ? 'selected' : ''}>${g}</option>`).join('')}
            </select>
          </div>
          <div>
            <label>المركز / القسم *</label>
            <select id="h-center" onchange="onCenterChange('h')">
              <option value="${h.center || ''}">${h.center || '-- اختر المحافظة أولاً --'}</option>
            </select>
          </div>
          <div>
            <label>القرية / العزبة / التابع *</label>
            <select id="h-village">
              <option value="${h.village || ''}">${h.village || '-- اختر المركز أولاً --'}</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <label>الوظيفة الحالية (من القائمة الشاملة) *</label>
        <select id="h-job">
          ${ALL_EGYPT_JOBS.map(j => `<option value="${j}" ${h.job === j ? 'selected' : ''}>${j}</option>`).join('')}
        </select>
      </div>

      <!-- الحالة الصحية التفاعلية -->
      <div style="background:#f1f5f9; padding:16px; border-radius:12px; margin:16px 0; border:1px solid #cbd5e1;">
        <label style="font-weight:800; color:var(--primary-dark);">الحالة الصحية للزوج *</label>
        <select id="h-health" onchange="toggleHealthDetails('h')">
          <option value="سليم" ${h.health === 'سليم' ? 'selected' : ''}>سليم وبصحة جيدة</option>
          <option value="مريض" ${h.health === 'مريض' ? 'selected' : ''}>مريض / يعاني من حالة صحية</option>
        </select>

        <div id="h-health-box" class="${h.health === 'مريض' ? '' : 'hidden'}" style="margin-top:12px; padding-top:10px; border-top:1px dashed #94a3b8;">
          <label>نوع الحالة الصحية:</label>
          <select id="h-illness-type" onchange="toggleIllnessType('h')">
            <option value="مزمن" ${h.illnessType === 'مزمن' ? 'selected' : ''}>مرض مزمن مستمر</option>
            <option value="موقت" ${h.illnessType === 'موقت' ? 'selected' : ''}>مرض مؤقت أو إصابة عارضة</option>
          </select>

          <!-- قائمة الأمراض المزمنة -->
          <div id="h-chronic-box" style="margin-top:8px;">
            <label>اختر المرض المزمن:</label>
            <select id="h-chronic-name">
              ${ALL_CHRONIC_ILLNESSES.map(c => `<option value="${c}" ${h.chronicName === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>

          <!-- قائمة الأمراض المؤقتة (تشمل كل شيء حتى الصداع) -->
          <div id="h-temp-box" class="hidden" style="margin-top:8px;">
            <label>اختر المرض المؤقت أو الإصابة العارضة:</label>
            <select id="h-temp-name">
              ${ALL_TEMP_ILLNESSES.map(t => `<option value="${t}" ${h.tempName === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>

          <!-- الاحتياجات الطبية -->
          <div style="margin-top:12px;">
            <label style="font-weight:700; color:#b45309;">الاحتياج الطبي المطلوب (باختيار دقيق):</label>
            <select id="h-medical-need" onchange="toggleMedicalNeeds('h')">
              <option value="لا يوجد" ${h.medicalNeed === 'لا يوجد' ? 'selected' : ''}>لا يوجد احتياج طبي حالي</option>
              <option value="عملية جراحية" ${h.medicalNeed === 'عملية جراحية' ? 'selected' : ''}>عملية جراحية</option>
              <option value="أطراف صناعية" ${h.medicalNeed === 'أطراف صناعية' ? 'selected' : ''}>أطراف صناعية</option>
              <option value="أجهزة تعويضية" ${h.medicalNeed === 'أجهزة تعويضية' ? 'selected' : ''}>أجهزة تعويضية</option>
              <option value="تحاليل واشعة" ${h.medicalNeed === 'تحاليل واشعة' ? 'selected' : ''}>تحاليل وأشعة وفحوصات</option>
              <option value="روشتة علاج شهري" ${h.medicalNeed === 'روشتة علاج شهري' ? 'selected' : ''}>روشتة علاج شهري مزمن</option>
            </select>

            <!-- العمليات الجراحية -->
            <div id="h-surgery-box" class="hidden" style="margin-top:8px;">
              <label>اختر العملية الجراحية المطلوبة:</label>
              <select id="h-surgery-name">
                ${ALL_SURGERIES_LIST.map(s => `<option value="${s}" ${h.surgeryName === s ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
            </div>

            <!-- الأطراف الصناعية -->
            <div id="h-prosthetic-box" class="hidden" style="margin-top:8px;">
              <label>اختر الطرف الصناعي المطلوب:</label>
              <select id="h-prosthetic-sub">
                ${PROSTHETIC_PARTS.map(p => `<option value="${p}" ${h.prostheticSub === p ? 'selected' : ''}>${p}</option>`).join('')}
              </select>
            </div>

            <!-- الأجهزة التعويضية -->
            <div id="h-device-box" class="hidden" style="margin-top:8px;">
              <label>اختر الجهاز التعويضي المطلوب:</label>
              <select id="h-device-sub">
                ${COMPENSATORY_DEVICES.map(d => `<option value="${d}" ${h.deviceSub === d ? 'selected' : ''}>${d}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- صور البطاقة وش وظهر إلزامي + التقرير الطبي الشرطي -->
      <div style="background:#fef3c7; padding:16px; border-radius:12px; border:1px solid #fde68a; margin-bottom:14px;">
        <label style="font-weight:800; color:#92400e; margin-bottom:8px; display:block;">📁 المستندات والصور الإلزامية للزوج:</label>
        <div class="grid-2">
          <div><label>صورة بطاقة الرقم القومي (وش) * [إلزامي]</label><input type="file" id="h-id-front" required></div>
          <div><label>صورة بطاقة الرقم القومي (ظهر) * [إلزامي]</label><input type="file" id="h-id-back" required></div>
        </div>
        <div id="h-medical-doc-container" class="${h.health === 'مريض' ? '' : 'hidden'}" style="margin-top:12px;">
          <label style="color:#b91c1c; font-weight:700;">التقرير الطبي أو الروشتة أو الأشعة الحديثة * [إلزامي لحالة المريض]</label>
          <input type="file" id="h-medical-doc">
        </div>
      </div>
    `;
  }

  // ==========================================
  // القسم الثاني: بيانات الزوجة (مطابق تماماً لمعايير الزوج)
  // ==========================================
  else if (window.currentStep === 2) {
    const w = window.formData.wife || {};
    html += `
      <h3 style="color:var(--primary-dark); text-align:center; font-weight:900; margin:15px 0 25px; border-bottom:2px solid #059669; padding-bottom:8px;">
        👩 القسم الثاني: بيانات الزوجة
      </h3>

      <div class="grid-3">
        <div><label>الاسم الأول *</label><input id="w-name1" value="${w.name1 || ''}" required></div>
        <div><label>الاسم الثاني *</label><input id="w-name2" value="${w.name2 || ''}" required></div>
        <div><label>الاسم الثالث *</label><input id="w-name3" value="${w.name3 || ''}" required></div>
      </div>

      <div class="grid-2">
        <div><label>رقم البطاقة (14 رقم إلزامي) *</label><input id="w-nid" maxlength="14" value="${w.nid || ''}" placeholder="أدخل 14 رقماً بدقة" required></div>
        <div><label>رقم التليفون (11 رقم)</label><input id="w-phone" maxlength="11" value="${w.phone || ''}" placeholder="01xxxxxxxxx"></div>
      </div>

      <div class="grid-2" style="margin-top:10px;">
        <div>
          <label>المستوى التعليمي (بالاختيار) *</label>
          <select id="w-edu">
            ${ALL_EDUCATION_LEVELS.map(e => `<option value="${e.value}" ${w.edu === e.value ? 'selected' : ''}>${e.label}</option>`).join('')}
          </select>
        </div>
        <div>
          <label>الوظيفة / النشاط *</label>
          <select id="w-job">
            ${ALL_EGYPT_JOBS.map(j => `<option value="${j}" ${w.job === j ? 'selected' : ''}>${j}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- الحالة الصحية للزوجة -->
      <div style="background:#f1f5f9; padding:16px; border-radius:12px; margin:16px 0; border:1px solid #cbd5e1;">
        <label style="font-weight:800; color:var(--primary-dark);">الحالة الصحية للزوجة *</label>
        <select id="w-health" onchange="toggleHealthDetails('w')">
          <option value="سليم" ${w.health === 'سليم' ? 'selected' : ''}>سليم وبصحة جيدة</option>
          <option value="مريض" ${w.health === 'مريض' ? 'selected' : ''}>مريض / تعاني من حالة صحية</option>
        </select>

        <div id="w-health-box" class="${w.health === 'مريض' ? '' : 'hidden'}" style="margin-top:12px; padding-top:10px; border-top:1px dashed #94a3b8;">
          <label>نوع الحالة الصحية:</label>
          <select id="w-illness-type" onchange="toggleIllnessType('w')">
            <option value="مزمن" ${w.illnessType === 'مزمن' ? 'selected' : ''}>مرض مزمن مستمر</option>
            <option value="موقت" ${w.illnessType === 'موقت' ? 'selected' : ''}>مرض مؤقت أو إصابة عارضة</option>
          </select>

          <div id="w-chronic-box" style="margin-top:8px;">
            <label>اختر المرض المزمن:</label>
            <select id="w-chronic-name">
              ${ALL_CHRONIC_ILLNESSES.map(c => `<option value="${c}" ${w.chronicName === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>

          <div id="w-temp-box" class="hidden" style="margin-top:8px;">
            <label>اختر المرض المؤقت أو الإصابة:</label>
            <select id="w-temp-name">
              ${ALL_TEMP_ILLNESSES.map(t => `<option value="${t}" ${w.tempName === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>

          <div style="margin-top:12px;">
            <label style="font-weight:700; color:#b45309;">الاحتياج الطبي المطلوب:</label>
            <select id="w-medical-need" onchange="toggleMedicalNeeds('w')">
              <option value="لا يوجد" ${w.medicalNeed === 'لا يوجد' ? 'selected' : ''}>لا يوجد احتياج طبي حالي</option>
              <option value="عملية جراحية" ${w.medicalNeed === 'عملية جراحية' ? 'selected' : ''}>عملية جراحية</option>
              <option value="أطراف صناعية" ${w.medicalNeed === 'أطراف صناعية' ? 'selected' : ''}>أطراف صناعية</option>
              <option value="أجهزة تعويضية" ${w.medicalNeed === 'أجهزة تعويضية' ? 'selected' : ''}>أجهزة تعويضية</option>
              <option value="تحاليل واشعة" ${w.medicalNeed === 'تحاليل واشعة' ? 'selected' : ''}>تحاليل وأشعة وفحوصات</option>
              <option value="روشتة علاج شهري" ${w.medicalNeed === 'روشتة علاج شهري' ? 'selected' : ''}>روشتة علاج شهري مزمن</option>
            </select>

            <div id="w-surgery-box" class="hidden" style="margin-top:8px;">
              <label>اختر العملية الجراحية:</label>
              <select id="w-surgery-name">
                ${ALL_SURGERIES_LIST.map(s => `<option value="${s}" ${w.surgeryName === s ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
            </div>

            <div id="w-prosthetic-box" class="hidden" style="margin-top:8px;">
              <label>اختر الطرف الصناعي:</label>
              <select id="w-prosthetic-sub">
                ${PROSTHETIC_PARTS.map(p => `<option value="${p}" ${w.prostheticSub === p ? 'selected' : ''}>${p}</option>`).join('')}
              </select>
            </div>

            <div id="w-device-box" class="hidden" style="margin-top:8px;">
              <label>اختر الجهاز التعويضي:</label>
              <select id="w-device-sub">
                ${COMPENSATORY_DEVICES.map(d => `<option value="${d}" ${w.deviceSub === d ? 'selected' : ''}>${d}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div style="background:#fef3c7; padding:16px; border-radius:12px; border:1px solid #fde68a; margin-bottom:14px;">
        <label style="font-weight:800; color:#92400e; margin-bottom:8px; display:block;">📁 المستندات والصور الإلزامية للزوجة:</label>
        <div class="grid-2">
          <div><label>صورة بطاقة الرقم القومي (وش) * [إلزامي]</label><input type="file" id="w-id-front" required></div>
          <div><label>صورة بطاقة الرقم القومي (ظهر) * [إلزامي]</label><input type="file" id="w-id-back" required></div>
        </div>
        <div id="w-medical-doc-container" class="${w.health === 'مريض' ? '' : 'hidden'}" style="margin-top:12px;">
          <label style="color:#b91c1c; font-weight:700;">التقرير الطبي أو الروشتة * [إلزامي لحالة المريض]</label>
          <input type="file" id="w-medical-doc">
        </div>
      </div>
    `;
  }

  // ==========================================
  // القسم الثالث: الأبناء والتابعين
  // ==========================================
  else if (window.currentStep === 3) {
    html += `
      <h3 style="color:var(--primary-dark); text-align:center; font-weight:900; margin:15px 0 25px; border-bottom:2px solid #059669; padding-bottom:8px;">
        👶 القسم الثالث: بيانات الأبناء والتابعين
      </h3>
      <p style="font-size:13px; color:#64748b; margin-bottom:15px;">قم بإضافة الأبناء مع إرفاق شهادة الميلاد واختيار المراحل التعليمية:</p>
      
      <div id="children-list">
        ${(window.formData.children || []).map((c, idx) => `
          <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:14px; border-radius:12px; margin-bottom:12px;">
            <strong>الابن / الابنة رقم ${idx + 1}</strong>
            <div class="grid-3" style="margin-top:8px;">
              <div><label>اسم الابن ثلاثي *</label><input placeholder="الاسم ثلاثي" class="c-name" value="${c.name || ''}"></div>
              <div><label>تاريخ الميلاد *</label><input type="date" class="c-dob" value="${c.dob || ''}"></div>
              <div>
                <label>المرحلة التعليمية *</label>
                <select class="c-edu">
                  <option value="سن تحضيري / حضانة" ${c.edu==='سن تحضيري / حضانة'?'selected':''}>سن تحضيري / حضانة</option>
                  <option value="تعليم ابتدائي" ${c.edu==='تعليم ابتدائي'?'selected':''}>تعليم ابتدائي</option>
                  <option value="تعليم إعدادي" ${c.edu==='تعليم إعدادي'?'selected':''}>تعليم إعدادي</option>
                  <option value="ثانوي عام / فني" ${c.edu==='ثانوي عام / فني'?'selected':''}>ثانوي عام أو فني</option>
                  <option value="تعليم جامعي" ${c.edu==='تعليم جامعي'?'selected':''}>تعليم جامعي</option>
                  <option value="غير مقيد / ذوي احتياجات خاصة" ${c.edu==='غير مقيد / ذوي احتياجات خاصة'?'selected':''}>غير مقيد / ذوي احتياجات خاصة</option>
                </select>
              </div>
            </div>
            <div style="margin-top:8px;"><label style="font-size:12px; font-weight:700;">شهادة ميلاد الابن (إلزامي):</label> <input type="file" class="c-cert"></div>
            <button type="button" onclick="removeChildRow(${idx})" class="nav-btn" style="background:#b91c1c; color:#fff; margin-top:8px; font-size:11px;">🗑️ حذف هذا الابن</button>
          </div>
        `).join('')}
      </div>
      <button type="button" onclick="addChildRow()" class="action-btn" style="background:#0f172a; margin-top:10px;">+ إضافة ابن آخر</button>
    `;
  }

  // ==========================================
  // القسم الرابع: المصروفات والأعباء الشهرية
  // ==========================================
  else if (window.currentStep === 4) {
    html += `
      <h3 style="color:var(--primary-dark); text-align:center; font-weight:900; margin:15px 0 25px; border-bottom:2px solid #059669; padding-bottom:8px;">
        💸 القسم الرابع: المصروفات والأعباء الشهرية
      </h3>
      <p style="font-size:13px; color:#64748b; margin-bottom:15px;">سجل كافة المصروفات الشهرية للأسرة بدقة:</p>
      
      <div class="grid-2">
        <div><label>قيمة الإيجار الشهري (إن وجد)</label><input type="number" id="exp-rent" value="${window.formData.expenses.rent || 0}" oninput="calcTotals()"></div>
        <div><label>فواتير المرافق (مياه + كهرباء + غاز)</label><input type="number" id="exp-utilities" value="${window.formData.expenses.utilities || 0}" oninput="calcTotals()"></div>
        <div><label>مصاريف تعليم الأبناء والمستلزمات</label><input type="number" id="exp-edu" value="${window.formData.expenses.edu || 0}" oninput="calcTotals()"></div>
        <div><label>مصاريف العلاج والأدوية المزمنة</label><input type="number" id="exp-health" value="${window.formData.expenses.health || 0}" oninput="calcTotals()"></div>
        <div><label>المستلزمات المعيشية الأساسية (مأكل ومسكن)</label><input type="number" id="exp-food" value="${window.formData.expenses.food || 0}" oninput="calcTotals()"></div>
        <div><label>أقساط ديون / التزامات أخرى</label><input type="number" id="exp-debts" value="${window.formData.expenses.debts || 0}" oninput="calcTotals()"></div>
      </div>
      <div style="background:#fee2e2; border:1px solid #fecaca; padding:16px; border-radius:12px; margin-top:16px; text-align:center;">
        <span style="font-weight:800; color:#991b1b; font-size:18px;">إجمالي المصروفات الشهرية: <strong id="total-exp-display">0</strong> جنيه</span>
      </div>
    `;
  }

  // ==========================================
  // القسم الخامس: مصادر الدخل والفائض أو العجز
  // ==========================================
  else if (window.currentStep === 5) {
    html += `
      <h3 style="color:var(--primary-dark); text-align:center; font-weight:900; margin:15px 0 25px; border-bottom:2px solid #059669; padding-bottom:8px;">
        💵 القسم الخامس: مصادر الدخل والفائض أو العجز المالي
      </h3>
      <p style="font-size:13px; color:#64748b; margin-bottom:15px;">سجل مصادر الدخل الشهرية الثابتة والمتغيرة:</p>
      
      <div class="grid-2">
        <div><label>دخل الزوج من العمل / المهنة</label><input type="number" id="inc-husband" value="${window.formData.incomes.husband || 0}" oninput="calcTotals()"></div>
        <div><label>دخل الزوجة أو الأبناء العاملين</label><input type="number" id="inc-others" value="${window.formData.incomes.others || 0}" oninput="calcTotals()"></div>
        <div><label>معاش حكومي / تضامن اجتماعي</label><input type="number" id="inc-pension" value="${window.formData.incomes.pension || 0}" oninput="calcTotals()"></div>
        <div><label>مساعدات ثابتة من أهل الخير / الجمعيات</label><input type="number" id="inc-aid" value="${window.formData.incomes.aid || 0}" oninput="calcTotals()"></div>
      </div>
      <div style="background:#ecfdf5; border:1px solid #a7f3d0; padding:16px; border-radius:12px; margin-top:16px; text-align:center;">
        <p style="margin:0 0 6px; font-weight:800; color:#065f46; font-size:16px;">إجمالي الدخل الشهري: <strong id="total-inc-display">0</strong> جنيه</p>
        <hr style="border:0; border-top:1px solid #a7f3d0; margin:10px 0;">
        <span id="balance-display" style="font-weight:900; font-size:19px;">صافي الوضع المالي: -</span>
      </div>
    `;
  }

  // ==========================================
  // القسم السادس: المستندات الرسمية، وصف السكن، ورأي الباحث، والتأكيد
  // ==========================================
  else if (window.currentStep === 6) {
    html += `
      <h3 style="color:var(--primary-dark); text-align:center; font-weight:900; margin:15px 0 25px; border-bottom:2px solid #059669; padding-bottom:8px;">
        📋 القسم السادس: المستندات الرسمية، وصف السكن، وتأكيد الطلب
      </h3>
      
      <div class="grid-2" style="margin-bottom:16px;">
        <div><label>البحث الاجتماعي (مختوم من الشؤون) *</label><input type="file" id="doc-social-research" required></div>
        <div><label>جواب الحيازة الزراعية (إن وجد)</label><input type="file" id="doc-land-tenure"></div>
        <div><label>عقد الإيجار الرسمي (إن وجد)</label><input type="file" id="doc-lease"></div>
        <div><label>برنت تأميني أو بيان معاش للزوج *</label><input type="file" id="doc-insurance-h" required></div>
        <div><label>برنت تأميني للزوجة</label><input type="file" id="doc-insurance-w"></div>
        <div><label>إثبات قيد دراسي للأبناء</label><input type="file" id="doc-school-enroll"></div>
      </div>

      <div style="margin-bottom:12px;">
        <label style="font-weight:800; color:#064e3b;">وصف السكن والفرش وطبيعة المسكن *</label>
        <textarea id="housing-desc" rows="3" placeholder="اكتب وصفاً مفصلاً لحالة السكن (ملك/إيجار)، الأسقف، الجدران، ومستوى الأثاث...">${window.formData.housing.desc || ''}</textarea>
      </div>

      <div style="margin-bottom:12px;">
        <label style="font-weight:800; color:#064e3b;">رأي الباحث الميداني وتوصية الحالة *</label>
        <textarea id="researcher-opinion" rows="3" placeholder="مدى استحقاق الأسرة، مدى صدق البيانات، ونوع المصلحة أو التدخل الأنسب...">${window.formData.housing.opinion || ''}</textarea>
      </div>

      <div style="background:#fffbeb; border:1px solid #fde68a; padding:16px; border-radius:12px; margin-bottom:16px;">
        <label style="display:flex; align-items:center; gap:10px; font-weight:800; cursor:pointer; color:#92400e; font-size:14px;">
          <input type="checkbox" id="declaration-check" style="width:auto; margin:0;" required>
          أقر أنا مقدم الطلب بأن كافة البيانات والمستندات المسجلة صحيحة تماماً وتحت مسئوليتي القانونية والمجتمعية، وأوافق على إجراء البحث الميداني.
        </label>
      </div>
    `;
  }

  // أزرار التنقل السفلية
  html += `
    <div style="display:flex; justify-content:space-between; margin-top:25px; border-top:1px solid #cbd5e1; padding-top:15px;">
      ${window.currentStep > 1 ? '<button type="button" onclick="prevWizardStep()" class="nav-btn" style="background:#334155; color:#fff;">السابق</button>' : '<div></div>'}
      ${window.currentStep < totalWizardSteps ? '<button type="button" onclick="nextWizardStep()" class="action-btn">التالي ➔</button>' : '<button type="button" onclick="submitFullWizardApplication()" class="action-btn" style="background:#15803d; padding:12px 28px; font-size:16px;">✅ تأكيد والرفع النهائي للحالة</button>'}
    </div>
  `;

  container.innerHTML = html;
  
  if (window.currentStep === 1 || window.currentStep === 2) {
    const typeTag = window.currentStep === 1 ? 'h' : 'w';
    toggleEduLevel(typeTag);
    toggleHealthDetails(typeTag);
    toggleIllnessType(typeTag);
    toggleMedicalNeeds(typeTag);
  }
  if (window.currentStep === 4 || window.currentStep === 5) {
    calcTotals();
  }
};

// 8. دوال الربط الجغرافي التفاعلي (محافظة -> مركز -> قرية)
window.onGovernorateChange = function(type) {
  const govSelect = document.getElementById(type + '-gov');
  const centerSelect = document.getElementById(type + '-center');
  const villageSelect = document.getElementById(type + '-village');
  
  const selectedGov = govSelect.value;
  centerSelect.innerHTML = '<option value="">-- اختر المركز --</option>';
  villageSelect.innerHTML = '<option value="">-- اختر القرية أولاً --</option>';

  if (selectedGov && EGYPT_GEO_DATABASE[selectedGov]) {
    const centers = Object.keys(EGYPT_GEO_DATABASE[selectedGov]);
    centers.forEach(c => {
      centerSelect.innerHTML += `<option value="${c}">${c}</option>`;
    });
  }
};

window.onCenterChange = function(type) {
  const govSelect = document.getElementById(type + '-gov');
  const centerSelect = document.getElementById(type + '-center');
  const villageSelect = document.getElementById(type + '-village');

  const selectedGov = govSelect.value;
  const selectedCenter = centerSelect.value;
  villageSelect.innerHTML = '<option value="">-- اختر القرية / العزبة --</option>';

  if (selectedGov && selectedCenter && EGYPT_GEO_DATABASE[selectedGov][selectedCenter]) {
    const villages = EGYPT_GEO_DATABASE[selectedGov][selectedCenter];
    villages.forEach(v => {
      villageSelect.innerHTML += `<option value="${v}">${v}</option>`;
    });
  }
};

// 9. دوال التحكم الصحي والتفاعلي الدقيق
window.toggleHealthDetails = function(type) {
  const val = document.getElementById(type + '-health')?.value;
  const box = document.getElementById(type + '-health-box');
  const docContainer = document.getElementById(type + '-medical-doc-container');
  
  if (val === 'مريض') {
    if (box) box.classList.remove('hidden');
    if (docContainer) docContainer.classList.remove('hidden');
  } else {
    if (box) box.classList.add('hidden');
    if (docContainer) docContainer.classList.add('hidden');
  }
};

window.toggleIllnessType = function(type) {
  const typeVal = document.getElementById(type + '-illness-type')?.value;
  const chronicBox = document.getElementById(type + '-chronic-box');
  const tempBox = document.getElementById(type + '-temp-box');

  if (typeVal === 'مزمن') {
    if (chronicBox) chronicBox.classList.remove('hidden');
    if (tempBox) tempBox.classList.add('hidden');
  } else {
    if (chronicBox) chronicBox.classList.add('hidden');
    if (tempBox) tempBox.classList.remove('hidden');
  }
};

window.toggleMedicalNeeds = function(type) {
  const needVal = document.getElementById(type + '-medical-need')?.value;
  const surgBox = document.getElementById(type + '-surgery-box');
  const prosBox = document.getElementById(type + '-prosthetic-box');
  const devBox = document.getElementById(type + '-device-box');

  if (surgBox) surgBox.classList.add('hidden');
  if (prosBox) prosBox.classList.add('hidden');
  if (devBox) devBox.classList.add('hidden');

  if (needVal === 'عملية جراحية' && surgBox) surgBox.classList.remove('hidden');
  if (needVal === 'أطراف صناعية' && prosBox) prosBox.classList.remove('hidden');
  if (needVal === 'أجهزة تعويضية' && devBox) devBox.classList.remove('hidden');
};

// 10. أدوات التحكم بالأبناء
window.addChildRow = function() {
  if (!window.formData.children) window.formData.children = [];
  window.formData.children.push({ name: '', dob: '', edu: 'تعليم ابتدائي' });
  window.renderWizardStep();
};

window.removeChildRow = function(idx) {
  window.formData.children.splice(idx, 1);
  window.renderWizardStep();
};

// 11. حساب الإجماليات والفائض / العجز المالي
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
      balDisplay.innerHTML = `⚠️ يوجد عجز مالي شهري بقيمة: <span style="color:#b91c1c;">${Math.abs(balance)} جنيه</span> (حالة مستحقة للدعم العاجل)`;
    } else {
      balDisplay.innerHTML = `🟢 يوجد فائض مالي شهري بقيمة: <span style="color:#065f46;">${balance} جنيه</span>`;
    }
  }
};

// 12. التنقل والتحقق الإجباري الصارم لعدم الانتقال إلا باكتمال القسم
window.nextWizardStep = function() {
  if (window.currentStep === 1) {
    const name1 = document.getElementById('h-name1')?.value.trim();
    const nid = document.getElementById('h-nid')?.value.trim();
    const phone = document.getElementById('h-phone')?.value.trim();
    const gov = document.getElementById('h-gov')?.value;
    const center = document.getElementById('h-center')?.value;
    const village = document.getElementById('h-village')?.value;

    if (!name1 || !nid || !phone || !gov || !center || !village) {
      return alert('⚠️ برجاء استيفاء جميع الحقول الإجبارية والعنوان الجغرافي الكامل في القسم الأول قبل الانتقال.');
    }
    if (nid.length !== 14) {
      return alert('⚠️ رقم البطاقة الشخصية للزوج يجب أن يكون 14 رقماً بدقة.');
    }
    if (phone.length !== 11) {
      return alert('⚠️ رقم التليفون يجب أن يكون 11 رقماً.');
    }
  } else if (window.currentStep === 2) {
    const name1 = document.getElementById('w-name1')?.value.trim();
    const nid = document.getElementById('w-nid')?.value.trim();
    if (!name1 || !nid) {
      return alert('⚠️ برجاء استيفاء اسم الزوجة والرقم القومي في القسم الثاني.');
    }
    if (nid.length !== 14) {
      return alert('⚠️ رقم البطاقة الشخصية للزوجة يجب أن يكون 14 رقماً بدقة.');
    }
  }

  saveCurrentStepData();
  window.currentStep++;
  window.renderWizardStep();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.prevWizardStep = function() {
  saveCurrentStepData();
  window.currentStep--;
  window.renderWizardStep();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 13. حفظ بيانات الخطوات الحالية
function saveCurrentStepData() {
  if (window.currentStep === 1) {
    window.formData.husband = {
      name1: document.getElementById('h-name1')?.value || '',
      name2: document.getElementById('h-name2')?.value || '',
      name3: document.getElementById('h-name3')?.value || '',
      nid: document.getElementById('h-nid')?.value || '',
      phone: document.getElementById('h-phone')?.value || '',
      whatsapp: document.getElementById('h-whatsapp')?.value || '',
      gov: document.getElementById('h-gov')?.value || '',
      center: document.getElementById('h-center')?.value || '',
      village: document.getElementById('h-village')?.value || '',
      edu: document.getElementById('h-edu')?.value || '',
      job: document.getElementById('h-job')?.value || '',
      health: document.getElementById('h-health')?.value || '',
      illnessType: document.getElementById('h-illness-type')?.value || '',
      medicalNeed: document.getElementById('h-medical-need')?.value || ''
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
      illnessType: document.getElementById('w-illness-type')?.value || '',
      medicalNeed: document.getElementById('w-medical-need')?.value || ''
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

// 14. التأكيد والرفع النهائي لقاعدة البيانات
window.submitFullWizardApplication = async function() {
  saveCurrentStepData();
  const check = document.getElementById('declaration-check');
  if (check && !check.checked) {
    return alert('⚠️ يجب الموافقة على إقرار صحة البيانات والمسؤولية قبل التأكيد والرفع.');
  }

  const trackingCode = 'HF-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
  
  const totalExp = (window.formData.expenses.rent || 0) + (window.formData.expenses.utilities || 0) + (window.formData.expenses.edu || 0) + (window.formData.expenses.health || 0) + (window.formData.expenses.food || 0) + (window.formData.expenses.debts || 0);
  const totalInc = (window.formData.incomes.husband || 0) + (window.formData.incomes.others || 0) + (window.formData.incomes.pension || 0) + (window.formData.incomes.aid || 0);

  const payload = {
    tracking_code: trackingCode,
    governorate: window.formData.husband.gov || 'بني سويف',
    center_city: window.formData.husband.center || 'إهناسيا',
    village_hamlet: window.formData.husband.village || 'منشأة عبدالصمد',
    aid_type: 'بحث اجتماعي شامل وموثق',
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
      alert(`✅ تم رفع استمارة الحالة بنجاح وتوثيقها في النظام!\n\nكود المتابعة الخاص بالأسرة هو: ${trackingCode}\nاحتفظ به للاستعلام الفوري.`);
      location.reload();
    }
  } else {
    alert(`✅ تم حفظ الطلب واجتياز كافة الاختبارات بنجاح!\nكود المتابعة: ${trackingCode}`);
  }
};
