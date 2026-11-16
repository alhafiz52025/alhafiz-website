// wizard.js - المنظومة الذكية لاستمارة البحث الاجتماعي وبناء الأسر - مؤسسة الحافظ (نسخة نهائية شاملة)

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

// 1. قاعدة بيانات جغرافية شاملة لمحافظات مصر ومراكزها وتوابعها
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
  },
  "أسيوط": { "أسيوط": ["أسيوط", "ديروط", "منفلوط", "ابيج", "ابوتيج", "صدفا", "الغنايم", "ساحل سليم", "البداري", "فتح"] },
  "سوهاج": { "سوهاج": ["سوهاج", "أخميم", "المنشأة", "جهينة", "ساقلعة", "جرجا", "البلينا", "دار السلام", "الطهطاوي"] },
  "قنا": { "قنا": ["قنا", "ابوتشت", "نجع حمادي", "دشنا", "قفط", "قوص", "الوقف", "فرشوط"] },
  "الأقصر": { "الأقصر": ["الأقصر", "إسنا", "أرمنت", "القرنة", "بياضية"] },
  "أسوان": { "أسوان": ["أسوان", "إدفو", "كوم امبو", "دراو", "نصر النوبة"] },
  "البحر الأحمر": { "الغردقة": ["الغردقة", "سفاجا", "القصير", "مرسى علم", "شلاتين", "حلايب"] },
  "الوادي الجديد": { "الخارجة": ["الخارجة", "الداخلة", "باريس", "الفرافرة", "بلاط"] },
  "مطروح": { "مرسى مطروح": ["مرسى مطروح", "الحمام", "العميد", "الضبعة", "سيدي براني", "السلوم", "سيوة"] },
  "شمال سيناء": { "العريش": ["العريش", "بئر العبد", "الشيخ زويد", "رفح", "نخل", "حسن"] },
  "جنوب سيناء": { "الطور": ["الطور", "شرم الشيخ", "دهب", "نويبع", "طابا", "رأس سدر", "أبو رديس"] },
  "الإسماعيلية": { "الإسماعيلية": ["الإسماعيلية", "التل الكبير", "فردان", "القنطرة شرق", "القنطرة غرب", "فايد", "القصاصين"] },
  "السويس": { "السويس": ["حي السويس", "حي الأربعين", "حي عتاقة", "حي الجناين", "حي بور توفيق"] },
  "بورسعيد": { "بورسعيد": ["حي الشرق", "حي العرب", "حي الضواحي", "حي المناصرة", "حي الزهور", "حي بورفؤاد"] },
  "دمياط": { "دمياط": ["دمياط", "فارسكور", "الزرقا", "كفر البطيخ", "السرو", "رأس البر", "كفر سعد"] },
  "الدقهلية": { "المنصورة": ["المنصورة", "ميت غمر", "دكرنس", "بلقاس", "سنبلاوين", "أجا", "طلخا", "المطرية", "منية النصر", "شربين"] },
  "الشرقية": { "زقازيق": ["العاشر من رمضان", "بلبيس", "مشتول السوق", "أبو حماد", "الإبراهيمية", "ديرب نجم", "منيا القمح", "فاقوس", "الحسينية"] },
  "القليوبية": { "بنها": ["بنها", "قليوب", "شبرا الخيمة", "القناطر الخيرية", "الخانكة", "توخ", "شبين القناطر", "كفر شكر"] },
  "الغربية": { "طنطا": ["طنطا", "المحلة الكبرى", "الزفتى", "كفر الزيات", "بسيون", "سمنود", "قطور", "صفت تراب"] },
  "المنوفية": { "شبين الكوم": ["شبين الكوم", "منوف", "السادات", "قويسنا", "بركة السبع", "أشمون", "الشهداء", "تلا"] },
  "بحيرة": { "دمنهور": ["دمنهور", "كفر الدوار", "رشيد", "إدكو", "أبو حمص", "المحمودية", "كوم حمادة", "حوش عيسى", "الدلنجات"] },
  "كفر الشيخ": { "كفر الشيخ": ["دسوق", "فوة", "مطوبس", "بيلا", "الحامول", "بلطيم", "سيدي سالم", "الرياض"] }
};

// 2. الوظائف الشاملة
const ALL_EGYPT_JOBS = [
  "لا يعمل / عاطل عن العمل", "بالمعاش / تقاعد", "غير قادر على العمل (عجز كلي / مرض مزمن)", "ربة منزل",
  "عامل باليومية (أرزقي)", "عامل زراعي / فلاح", "نجار مسلح / أثاث", "سباك صحي ومقاولات", "فني كهرباء",
  "نقاش / دهان", "حداد وتربيز", "بناء / مقاول أنفار", "ميكانيكي سيارات / معدات", "فني تكييف وتبريد",
  "خياط / ترزي", "سائق توك توك / تروسيكل", "سائق ميكروباص / تاكسي", "سائق نقل ثقيل",
  "موظف حكومي / قطاع عام", "موظف قطاع خاص", "مدرس / إداري تعليمي", "عامل نظافة / خدمات",
  "فرد أمن / حراسة", "بائع متجول / كشك صغير", "صياد أسماك", "صاحب ورشة / محل تجاري", "أعمال حرة أخرى"
];

// 3. المستويات التعليمية
const ALL_EDUCATION_LEVELS = [
  { value: "غير متعلم", label: "غير متعلم (لا يقرأ ولا يكتب)" },
  { value: "محو أمية", label: "شهادة محو الأمية وتعمير الكبار" },
  { value: "ابتدائية", label: "شهادة التعليم الابتدائي" },
  { value: "إعدادية", label: "شهادة الإعدادية العامة" },
  { value: "دبلوم فني", label: "دبلوم الثانوي (صناعي / تجاري / زراعي)" },
  { value: "ثانوية عامة", label: "الثانوية العامة / الأزهرية" },
  { value: "معهد متوسط", label: "معهد فوق متوسط (سنتين)" },
  { value: "جامعي", label: "مؤهل جامعي (بكالوريوس / ليسانس)" },
  { value: "ماجستير", label: "درجة الماجستير" },
  { value: "دكتوراه", label: "درجة الدكتوراه" }
];

// 4. الأمراض المؤقتة الشاملة
const ALL_TEMP_ILLNESSES = [
  "صداع نصفي أو مزمن عارض", "إصابة عارضة / كسر في العظام", "نزلة برد حادة / التهاب شعب",
  "نزلة معوية حادة", "التهاب الحلق واللوزتين", "إرهاق عضلي وإصابة ملاعب", "التهاب جيوب أنفية",
  "مغص كلوي وحصوات مؤقتة", "التهاب أسنان حاد وتورم", "حروق سطحية وعارضة", "ارتفاع حرارة وفيروس عارض", "أخرى"
];

// 5. الأمراض المزمنة الشاملة
const ALL_CHRONIC_ILLNESSES = [
  "الفشل الكلوي المزمن (غسيل كلوي أسبوعي)", "أمراض القلب المزمنة والجلطات", "ارتفاع ضغط الدم المزمن المتقدم",
  "مرض السكري المتقدم بمضاعفات", "الأورام السرطانية وعلاج كيماوي", "أمراض الكبد المزمنة والتليف",
  "أمراض الجهاز التنفسي والانسداد الرئوي", "الروماتويد والتهاب المفاصل المزمن", "الصرع والتشنجات العصبية",
  "أنيميا البحر المتوسط (ثلاسيميا)", "الإعاقة الحركية الكاملة / الشلل", "أمراض المناعة المزمنة"
];

// 6. العمليات الجراحية الشاملة
const ALL_SURGERIES_LIST = [
  "عملية قلب مفتوح / شرايين تاجية", "تغيير مفاصل (ركبة أو حوض)", "استئصال أورام سرطانية",
  "استئصال الزائدة أو المرارة بالمنظار", "فتق إربي أو بطني", "جراحة المخ والأعصاب والفقرات",
  "جراحة العيون (مياه بيضاء / شبكية)", "جراحة الأنف والأذن والحنجرة", "جسور وكسور العظام المعقدة",
  "استئصال اللوزتين للأطفال", "جراحة نسائية / قيصرية طارئة", "دوالي الساقين والبواسير", "أخرى"
];

const PROSTHETIC_PARTS = [
  "طرف صناعي سفلي: قدم صناعي تحت الركبة", "طرف صناعي سفلي: ساق كاملة فوق الركبة",
  "طرف صناعي علوي: يد صناعية تجميلية / ميكانيكية", "طرف صناعي علوي: ذراع كامل صناعي"
];

const COMPENSATORY_DEVICES = [
  "كرسي متحرك عادي أو طبي", "سماعة أذن طبية رقمية", "مرتبة هوائية طبية",
  "عكاز طبي / مشاية ألومنيوم", "حزام دعم فقرات الظهر الرقبة", "نظارات طبية متقدمة"
];

// 7. اختيارات وصف السكن
const HOUSING_TYPES = ["ملك", "إيجار قانوني", "عشة / صفيح / خيام", "حق انتفاع", "إقامة عائلية مشتركة (مضيفة)"];
const ROOF_TYPES = ["خرسانة مسلحة", "خشب وجريد وعروق", "صاج أو أطيان", "عريشة خوص / بلاستيك"];
const WALL_TYPES = ["طوب أحمر ومحارة تشطيب", "طوب لبن وأدون قديمة", "أخشاب وصفيح وبوص", "بدون تشطيب نهائي"];
const DOOR_TYPES = ["باب خشب متين ومحكم", "باب حديد", "ستارة قماش أو بدون باب خارجي"];
const FLOOR_FLOORS_COUNT = ["دور أرضي واحد", "دورين", "ثلاثة أدوار فأكثر", "منزل عشوائي مؤقت"];

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
        <div><label>رقم التليفون الأساسي (11 رقم) *</label><input id="h-phone" maxlength="11" value="${h.phone || ''}" placeholder="01xxxxxxxxx" required></div>
      </div>

      <div class="grid-2" style="margin-top:10px;">
        <div><label>رقم واتساب / تليفون إضافي</label><input id="h-whatsapp" maxlength="11" value="${h.whatsapp || ''}" placeholder="01xxxxxxxxx"></div>
        <div>
          <label>المستوى التعليمي *</label>
          <select id="h-edu">
            ${ALL_EDUCATION_LEVELS.map(e => `<option value="${e.value}" ${h.edu === e.value ? 'selected' : ''}>${e.label}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- العنوان الجغرافي الشامل للجمهورية -->
      <div style="background:#f8fafc; padding:16px; border-radius:12px; border:1px solid #e2e8f0; margin:16px 0;">
        <label style="font-weight:800; color:#064e3b; margin-bottom:10px; display:block;">📍 العنوان الجغرافي:</label>
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
        <label>الوظيفة الحالية *</label>
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

          <div id="h-chronic-box" style="margin-top:8px;">
            <label>اختر المرض المزمن:</label>
            <select id="h-chronic-name">
              ${ALL_CHRONIC_ILLNESSES.map(c => `<option value="${c}" ${h.chronicName === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>

          <div id="h-temp-box" class="hidden" style="margin-top:8px;">
            <label>اختر المرض المؤقت:</label>
            <select id="h-temp-name">
              ${ALL_TEMP_ILLNESSES.map(t => `<option value="${t}" ${h.tempName === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>

          <div style="margin-top:12px;">
            <label style="font-weight:700; color:#b45309;">الاحتياج الطبي المطلوب:</label>
            <select id="h-medical-need" onchange="toggleMedicalNeeds('h')">
              <option value="لا يوجد" ${h.medicalNeed === 'لا يوجد' ? 'selected' : ''}>لا يوجد احتياج طبي حالي</option>
              <option value="عملية جراحية" ${h.medicalNeed === 'عملية جراحية' ? 'selected' : ''}>عملية جراحية</option>
              <option value="أطراف صناعية" ${h.medicalNeed === 'أطراف صناعية' ? 'selected' : ''}>أطراف صناعية</option>
              <option value="أجهزة تعويضية" ${h.medicalNeed === 'أجهزة تعويضية' ? 'selected' : ''}>أجهزة تعويضية</option>
              <option value="تحاليل واشعة" ${h.medicalNeed === 'تحاليل واشعة' ? 'selected' : ''}>تحاليل وأشعة وفحوصات</option>
              <option value="روشتة علاج شهري" ${h.medicalNeed === 'روشتة علاج شهري' ? 'selected' : ''}>روشتة علاج شهري مزمن</option>
            </select>

            <div id="h-surgery-box" class="hidden" style="margin-top:8px;">
              <label>اختر العملية الجراحية المطلوبة:</label>
              <select id="h-surgery-name">
                ${ALL_SURGERIES_LIST.map(s => `<option value="${s}" ${h.surgeryName === s ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
            </div>

            <div id="h-prosthetic-box" class="hidden" style="margin-top:8px;">
              <label>اختر الطرف الصناعي المطلوب:</label>
              <select id="h-prosthetic-sub">
                ${PROSTHETIC_PARTS.map(p => `<option value="${p}" ${h.prostheticSub === p ? 'selected' : ''}>${p}</option>`).join('')}
              </select>
            </div>

            <div id="h-device-box" class="hidden" style="margin-top:8px;">
              <label>اختر الجهاز التعويضي المطلوب:</label>
              <select id="h-device-sub">
                ${COMPENSATORY_DEVICES.map(d => `<option value="${d}" ${h.deviceSub === d ? 'selected' : ''}>${d}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- صور البطاقة إلزامي -->
      <div style="background:#fef3c7; padding:16px; border-radius:12px; border:1px solid #fde68a; margin-bottom:14px;">
        <label style="font-weight:800; color:#92400e; margin-bottom:8px; display:block;">📁 المستندات والصور الإلزامية للزوج:</label>
        <div class="grid-2">
          <div><label>صورة بطاقة الرقم القومي (وش) * [إلزامي]</label><input type="file" id="h-id-front" required></div>
          <div><label>صورة بطاقة الرقم القومي (ظهر) * [إلزامي]</label><input type="file" id="h-id-back" required></div>
        </div>
        <div id="h-medical-doc-container" class="${h.health === 'مريض' ? '' : 'hidden'}" style="margin-top:12px;">
          <label style="color:#b91c1c; font-weight:700;">التقرير الطبي أو الروشتة * [إلزامي لحالة المريض]</label>
          <input type="file" id="h-medical-doc">
        </div>
      </div>
    `;
  }

  // ==========================================
  // القسم الثاني: بيانات الزوجة
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
          <label>المستوى التعليمي *</label>
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
            <label>اختر المرض المؤقت:</label>
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
  // القسم السادس: المستندات ووصف السكن والتأكيد
  // ==========================================
  else if (window.currentStep === 6) {
    const hs = window.formData.housing || {};
    html += `
      <h3 style="color:var(--primary-dark); text-align:center; font-weight:900; margin:15px 0 25px; border-bottom:2px solid #059669; padding-bottom:8px;">
        📋 القسم السادس: المستندات الرسمية، وصف السكن التفصيلي، وتأكيد الطلب
      </h3>
      
      <div style="background:#f8fafc; padding:16px; border-radius:12px; border:1px solid #cbd5e1; margin-bottom:16px;">
        <label style="font-weight:900; color:#064e3b; margin-bottom:12px; display:block; font-size:15px;">🏠 وصف السكن وطبيعة المسكن:</label>
        
        <div class="grid-2">
          <div>
            <label>نوع السكن *</label>
            <select id="house-type">
              ${HOUSING_TYPES.map(t => `<option value="${t}" ${hs.houseType === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>
          <div>
            <label>وصف السقف *</label>
            <select id="roof-type">
              ${ROOF_TYPES.map(r => `<option value="${r}" ${hs.roofType === r ? 'selected' : ''}>${r}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="grid-2" style="margin-top:10px;">
          <div>
            <label>حالة الجدران والتشطيب *</label>
            <select id="wall-type">
              ${WALL_TYPES.map(w => `<option value="${w}" ${hs.wallType === w ? 'selected' : ''}>${w}</option>`).join('')}
            </select>
          </div>
          <div>
            <label>حالة الأبواب *</label>
            <select id="door-type">
              ${DOOR_TYPES.map(d => `<option value="${d}" ${hs.doorType === d ? 'selected' : ''}>${d}</option>`).join('')}
            </select>
          </div>
        </div>

        <div style="margin-top:10px;">
          <label>عدد أدوار ومستوى المبنى *</label>
          <select id="floors-count">
            ${FLOOR_FLOORS_COUNT.map(f => `<option value="${f}" ${hs.floorsCount === f ? 'selected' : ''}>${f}</option>`).join('')}
          </select>
        </div>
      </div>

      <div style="background:#fef3c7; padding:16px; border-radius:12px; border:1px solid #fde68a; margin-bottom:16px;">
        <label style="font-weight:800; color:#92400e; margin-bottom:8px; display:block;">📷 صور معاينة السكن:</label>
        <div class="grid-2">
          <div><label>صورة واجهة السكن * [إلزامي]</label><input type="file" id="house-img-front" required></div>
          <div><label>صورة سقف السكن * [إلزامي]</label><input type="file" id="house-img-roof" required></div>
        </div>
      </div>

      <div style="background:#ecfdf5; padding:16px; border-radius:12px; border:1px solid #a7f3d0; margin-bottom:20px;">
        <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-weight:700; color:#065f46;">
          <input type="checkbox" id="declaration-check" required style="width:20px; height:20px;">
          أقر أنا المتقدم بأن كافة البيانات والمستندات المدخلة صحيحة تماماً على مسئوليتي القانونية.
        </label>
      </div>
    `;
  }

  // أزرار التنقل السفلية
  html += `
    <style>
      .nav-btn { padding: 10px 24px; border-radius: 8px; border: none; cursor: pointer; font-family: 'Cairo', sans-serif; font-size: 14px; transition: background 0.2s; }
      .grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 12px; }
      .grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 12px; }
      .hidden { display: none !important; }
      label { display: block; font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
      input, select { width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-family: 'Cairo', sans-serif; font-size: 14px; outline: none; background: #fff; }
      input:focus, select:focus { border-color: #059669; box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.1); }
    </style>
    <div style="display:flex; justify-content:space-between; margin-top:25px; border-top:1px solid #cbd5e1; padding-top:15px;">
      ${window.currentStep > 1 ? `<button type="button" onclick="prevWizardStep()" class="nav-btn" style="background:#64748b; color:#fff;">السابق</button>` : '<div></div>'}
      ${window.currentStep < totalWizardSteps ? `<button type="button" onclick="nextWizardStep()" class="nav-btn" style="background:#059669; color:#fff;">التالي</button>` : `<button type="button" onclick="submitFullWizardApplication()" class="nav-btn" style="background:#10b981; color:#fff; font-weight:900;">إرسال الاستمارة نهائياً</button>`}
    </div>
  `;

  container.innerHTML = html;
  
  if (window.currentStep === 4 || window.currentStep === 5) {
    calcTotals();
  }
};

// وظائف التحكم الجغرافي والصحي
window.onGovernorateChange = function(prefix) {
  const govSelect = document.getElementById(prefix + '-gov');
  const centerSelect = document.getElementById(prefix + '-center');
  const villageSelect = document.getElementById(prefix + '-village');
  
  const selectedGov = govSelect.value;
  centerSelect.innerHTML = '<option value="">-- اختر المركز --</option>';
  villageSelect.innerHTML = '<option value="">-- اختر القرية --</option>';

  if (selectedGov && EGYPT_GEO_DATABASE[selectedGov]) {
    Object.keys(EGYPT_GEO_DATABASE[selectedGov]).forEach(c => {
      centerSelect.innerHTML += `<option value="${c}">${c}</option>`;
    });
  }
};

window.onCenterChange = function(prefix) {
  const govSelect = document.getElementById(prefix + '-gov');
  const centerSelect = document.getElementById(prefix + '-center');
  const villageSelect = document.getElementById(prefix + '-village');
  
  const selectedGov = govSelect.value;
  const selectedCenter = centerSelect.value;
  villageSelect.innerHTML = '<option value="">-- اختر القرية --</option>';

  if (selectedGov && selectedCenter && EGYPT_GEO_DATABASE[selectedGov][selectedCenter]) {
    EGYPT_GEO_DATABASE[selectedGov][selectedCenter].forEach(v => {
      villageSelect.innerHTML += `<option value="${v}">${v}</option>`;
    });
  }
};

window.toggleHealthDetails = function(prefix) {
  const healthVal = document.getElementById(prefix + '-health').value;
  const box = document.getElementById(prefix + '-health-box');
  const docContainer = document.getElementById(prefix + '-medical-doc-container');
  
  if (healthVal === 'مريض') {
    box.classList.remove('hidden');
    docContainer.classList.remove('hidden');
  } else {
    box.classList.add('hidden');
    docContainer.classList.add('hidden');
  }
};

window.toggleIllnessType = function(prefix) {
  const typeVal = document.getElementById(prefix + '-illness-type').value;
  const chronicBox = document.getElementById(prefix + '-chronic-box');
  const tempBox = document.getElementById(prefix + '-temp-box');

  if (typeVal === 'مزمن') {
    chronicBox.classList.remove('hidden');
    tempBox.classList.add('hidden');
  } else {
    chronicBox.classList.add('hidden');
    tempBox.classList.remove('hidden');
  }
};

window.toggleMedicalNeeds = function(prefix) {
  const needVal = document.getElementById(prefix + '-medical-need').value;
  const surgeryBox = document.getElementById(prefix + '-surgery-box');
  const prostheticBox = document.getElementById(prefix + '-prosthetic-box');
  const deviceBox = document.getElementById(prefix + '-device-box');

  surgeryBox.classList.add('hidden');
  prostheticBox.classList.add('hidden');
  deviceBox.classList.add('hidden');

  if (needVal === 'عملية جراحية') surgeryBox.classList.remove('hidden');
  if (needVal === 'أطراف صناعية') prostheticBox.classList.remove('hidden');
  if (needVal === 'أجهزة تعويضية') deviceBox.classList.remove('hidden');
};

window.addChildRow = function() {
  if (!window.formData.children) window.formData.children = [];
  window.formData.children.push({ name: '', dob: '', edu: 'تعليم ابتدائي' });
  renderWizardStep();
};

window.removeChildRow = function(idx) {
  window.formData.children.splice(idx, 1);
  renderWizardStep();
};

window.calcTotals = function() {
  const r = parseFloat(document.getElementById('exp-rent')?.value || 0);
  const u = parseFloat(document.getElementById('exp-utilities')?.value || 0);
  const e = parseFloat(document.getElementById('exp-edu')?.value || 0);
  const h = parseFloat(document.getElementById('exp-health')?.value || 0);
  const f = parseFloat(document.getElementById('exp-food')?.value || 0);
  const d = parseFloat(document.getElementById('exp-debts')?.value || 0);
  const totalExp = r + u + e + h + f + d;

  const ih = parseFloat(document.getElementById('inc-husband')?.value || 0);
  const io = parseFloat(document.getElementById('inc-others')?.value || 0);
  const ip = parseFloat(document.getElementById('inc-pension')?.value || 0);
  const ia = parseFloat(document.getElementById('inc-aid')?.value || 0);
  const totalInc = ih + io + ip + ia;

  const balance = totalInc - totalExp;

  const expEl = document.getElementById('total-exp-display');
  const incEl = document.getElementById('total-inc-display');
  const balEl = document.getElementById('balance-display');

  if (expEl) expEl.innerText = totalExp;
  if (incEl) incEl.innerText = totalInc;
  if (balEl) {
    balEl.innerText = (balance >= 0 ? 'فائض مالي: +' : 'عجز مالي: ') + balance + ' جنيه';
    balEl.style.color = balance >= 0 ? '#059669' : '#dc2626';
  }
};

window.nextWizardStep = function() {
  if (window.currentStep === 1) {
    const nid = document.getElementById('h-nid').value;
    if (nid.length !== 14 || isNaN(nid)) {
      alert('⚠️ برجاء إدخال رقم قومي صحيح للزوج يتكون من 14 رقماً بدقة.');
      return;
    }
    window.formData.husband = {
      name1: document.getElementById('h-name1').value,
      name2: document.getElementById('h-name2').value,
      name3: document.getElementById('h-name3').value,
      nid: nid,
      phone: document.getElementById('h-phone').value,
      whatsapp: document.getElementById('h-whatsapp').value,
      edu: document.getElementById('h-edu').value,
      gov: document.getElementById('h-gov').value,
      center: document.getElementById('h-center').value,
      village: document.getElementById('h-village').value,
      job: document.getElementById('h-job').value,
      health: document.getElementById('h-health').value,
      illnessType: document.getElementById('h-illness-type')?.value,
      chronicName: document.getElementById('h-chronic-name')?.value,
      tempName: document.getElementById('h-temp-name')?.value,
      medicalNeed: document.getElementById('h-medical-need')?.value,
      surgeryName: document.getElementById('h-surgery-name')?.value,
      prostheticSub: document.getElementById('h-prosthetic-sub')?.value,
      deviceSub: document.getElementById('h-device-sub')?.value
    };
  } else if (window.currentStep === 2) {
    const nid = document.getElementById('w-nid').value;
    if (nid.length !== 14 || isNaN(nid)) {
      alert('⚠️ برجاء إدخال رقم قومي صحيح للزوجة يتكون من 14 رقماً بدقة.');
      return;
    }
    window.formData.wife = {
      name1: document.getElementById('w-name1').value,
      name2: document.getElementById('w-name2').value,
      name3: document.getElementById('w-name3').value,
      nid: nid,
      phone: document.getElementById('w-phone').value,
      edu: document.getElementById('w-edu').value,
      job: document.getElementById('w-job').value,
      health: document.getElementById('w-health').value,
      illnessType: document.getElementById('w-illness-type')?.value,
      chronicName: document.getElementById('w-chronic-name')?.value,
      tempName: document.getElementById('w-temp-name')?.value,
      medicalNeed: document.getElementById('w-medical-need')?.value
    };
  } else if (window.currentStep === 3) {
    const rows = document.querySelectorAll('#children-list > div');
    window.formData.children = [];
    rows.forEach(r => {
      window.formData.children.push({
        name: r.querySelector('.c-name').value,
        dob: r.querySelector('.c-dob').value,
        edu: r.querySelector('.c-edu').value
      });
    });
  } else if (window.currentStep === 4) {
    window.formData.expenses = {
      rent: parseFloat(document.getElementById('exp-rent').value || 0),
      utilities: parseFloat(document.getElementById('exp-utilities').value || 0),
      edu: parseFloat(document.getElementById('exp-edu').value || 0),
      health: parseFloat(document.getElementById('exp-health').value || 0),
      food: parseFloat(document.getElementById('exp-food').value || 0),
      debts: parseFloat(document.getElementById('exp-debts').value || 0)
    };
  } else if (window.currentStep === 5) {
    window.formData.incomes = {
      husband: parseFloat(document.getElementById('inc-husband').value || 0),
      others: parseFloat(document.getElementById('inc-others').value || 0),
      pension: parseFloat(document.getElementById('inc-pension').value || 0),
      aid: parseFloat(document.getElementById('inc-aid').value || 0)
    };
  }

  if (window.currentStep < totalWizardSteps) {
    window.currentStep++;
    renderWizardStep();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

window.prevWizardStep = function() {
  if (window.currentStep > 1) {
    window.currentStep--;
    renderWizardStep();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

// دالة الإرسال النهائية والمربوطة بقاعدة البيانات عبر window.appDb
window.submitFullWizardApplication = async function() {
  const decl = document.getElementById('declaration-check');
  if (!decl || !decl.checked) {
    alert('⚠️ يجب الموافقة على إقرار صحة البيانات قبل إرسال الطلب.');
    return;
  }

  window.formData.housing = {
    houseType: document.getElementById('house-type').value,
    roofType: document.getElementById('roof-type').value,
    wallType: document.getElementById('wall-type').value,
    doorType: document.getElementById('door-type').value,
    floorsCount: document.getElementById('floors-count').value
  };

  const h = window.formData.husband || {};
  const payload = {
    head_name: (h.name1 || '') + ' ' + (h.name2 || '') + ' ' + (h.name3 || ''),
    national_id: h.nid || '',
    phone: h.phone || '',
    form_data: window.formData,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  alert('⏳ جاري إرسال البيانات وحفظها في قاعدة البيانات...');

  if (window.appDb) {
    try {
      const { data, error } = await window.appDb.from('families').insert([payload]);
      if (error) {
        console.error('Supabase Error:', error);
        alert('❌ حدث خطأ أثناء الحفظ في قاعدة البيانات: ' + error.message);
      } else {
        alert('✅ تم حفظ الاستمارة بنجاح في قاعدة البيانات وتاريخ المراجعة قيد التفعيل.');
        window.currentStep = 1;
        window.formData = { husband: {}, wife: {}, children: [], expenses: {}, incomes: {}, documents: {}, housing: {} };
        renderWizardStep();
      }
    } catch (err) {
      console.error('Exception:', err);
      alert('❌ حدث استثناء أثناء الاتصال بقاعدة البيانات.');
    }
  } else {
    alert('⚠️ تنبيه: لم يتم العثور على اتصال قاعدة البيانات window.appDb، تم استيفاء الاستمارة محلياً.');
  }
};
