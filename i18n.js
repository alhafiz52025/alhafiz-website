// i18n.js - نظام تعريب وترجمة شامل لكامل الموقع والاستمارات والنماذج
(function() {
  const ORIGINAL_TEXT_MAP = new WeakMap();
  const ORIGINAL_ATTR_MAP = new WeakMap();
  const LANG_STORAGE_KEY = 'hf_site_lang_v1';

  // ترتيب المفاتيح من الأطول للأقصر لتجنب استبدال جزء من نص قبل الجملة الكاملة
  let SORTED_ENTRIES = [];

  function rebuildSortedEntries() {
    const dict = window.FULL_DICTIONARY || {};
    SORTED_ENTRIES = Object.entries(dict)
      .filter(([k]) => typeof k === 'string' && k.trim().length > 0)
      .sort((a, b) => b[0].length - a[0].length);
  }

  window.FULL_DICTIONARY = {
    // 1. الهوية، شريط الوصول، والتنقل العلوي
    "مؤسسة الحافظ للتنمية والخدمات | إشهار 2202 لسنة 2025": "Al-Hafiz Foundation for Development & Services | Reg. 2202/2025",
    "اللغة:": "Language:",
    "حجم الخط:": "Font Size:",
    "المظهر:": "Theme:",
    "الوضع الليلي": "Dark Mode",
    "الوضع النهاري": "Light Mode",
    "🏛️ مؤسسة الحافظ للتنمية والخدمات - إشهار رقم 2202 لسنة 2025 (بني سويف)": "🏛️ Al-Hafiz Foundation - Reg. No. 2202 of 2025 (Beni Suef)",
    "💬 واتساب: 01000880156": "💬 WhatsApp: 01000880156",
    "📘 فيسبوك": "📘 Facebook",
    "مؤسسة الحافظ": "Al-Hafiz Foundation",
    "للتنمية والخدمات - مركز إهناسيا": "Development & Services - Ihnasia District",
    "شعار مؤسسة الحافظ": "Al-Hafiz Foundation Logo",
    "الرئيسية": "Home",
    "من نحن": "About Us",
    "📢 المنح والمبادرات": "📢 Grants & Initiatives",
    "🏆 الإنجازات": "🏆 Achievements",
    "❓ الأسئلة الشائعة": "❓ FAQ",
    "+ طلب مساعدة": "+ Request Aid",
    "🔍 استعلام": "🔍 Track Request",
    "📞 اتصل بنا": "📞 Contact Us",
    "🔒 الخصوصية": "🔒 Privacy",
    "🔐 دخول": "🔐 Login",

    // 2. الصفحة الرئيسية، الأثر الميداني، وحسابات التبرع
    "منظومة حوكمة وشفافية رقمية لخدمة مركز إهناسيا وجميع المحافظات": "Digital Governance & Transparency System Serving Ihnasia & All Governorates",
    "معاً.. نصنع أثراً يمتد ويبقى": "Together.. We Create Lasting Impact",
    "نعمل كمظلة تنموية تربط كبرى المؤسسات المانحة بالجمعيات القاعدية، بنظام إلكتروني دقيق يمنع الازدواجية ويضمن وصول الدعم لمستحقيه.": "We serve as a developmental umbrella linking major donor institutions with grassroots associations through a precise electronic system that prevents duplication and ensures support reaches eligible families.",
    "+ تسجيل حالة مستحقة": "+ Register Eligible Case",
    "📢 المنح والمبادرات المفتوحة": "📢 Open Grants & Initiatives",
    "حسابات التبرع الرسمية": "Official Donation Accounts",
    "📊 أثرنا الميداني وإنجازاتنا الموثقة": "📊 Our Field Impact & Documented Achievements",
    "حقيبة مساعدات غذائية": "Food Aid Bags",
    "دعم نقدي وتمكين": "Cash Support & Empowerment",
    "بطانية شتاء وأغطية": "Winter Blankets & Covers",
    "قرية وعزبة مستفيدة": "Beneficiary Villages & Hamlets",
    "حسابات التبرع الرسمية المعتمدة": "Approved Official Donation Accounts",
    "تحت إشراف وزارة التضامن الاجتماعي - إشهار رقم 2202 لسنة 2025": "Under the Supervision of the Ministry of Social Solidarity - Reg. No. 2202 of 2025",
    "البنك الزراعي المصري - فرع منهرة": "Agricultural Bank of Egypt - Manhara Branch",
    "محفظة فودافون كاش المعتمدة": "Approved Vodafone Cash Wallet",
    "📋 نسخ رقم الحساب": "📋 Copy Account Number",
    "📋 نسخ رقم المحفظة": "📋 Copy Wallet Number",

    // 3. من نحن، الرؤية، الرسالة، القيم، المحاور، الحوكمة، النطاق، والهيكل
    "مؤسسة الحافظ للتنمية والخدمات هي مؤسسة أهلية تنموية وخيرية خاضعة لأحكام قانون تنظيم ممارسة العمل الأهلي، ومشهرة رسميًا برقم (2202) لسنة 2025. تعمل المؤسسة على الارتقاء بجودة حياة الأسر الأولى بالرعاية، من خلال الجمع بين التدخل الإغاثي العاجل لتوفير مقومات الحياة الأساسية، والتنمية المستدامة لتمكين الأفراد اقتصاديًا واجتماعيًا. تنطلق المؤسسة من قلب صعيد مصر، واضعةً محافظة بني سويف (مركز إهناسيا وضواحيها) كأولوية ونقطة ارتكاز رئيسية، مع امتداد خدماتها ومبادراتها لتشمل مختلف محافظات الجمهورية.": "Al-Hafiz Foundation for Development & Services is a developmental and charitable civil foundation governed by the Civil Work Regulation Law and officially registered under No. (2202) of 2025. The foundation works to improve the quality of life for underprivileged families by combining urgent relief interventions for basic life necessities with sustainable development for economic and social empowerment. Launching from Upper Egypt, it prioritizes Beni Suef Governorate (Ihnasia District and its surroundings) as its main hub while extending services and initiatives across Egyptian governorates.",
    "👁️ الرؤية": "👁️ Vision",
    "أن نكون نموذجًا رائدًا وموثوقًا في العمل الخيري والتنموي المتكامل، لبناء مجتمع متكافل ينعم أفراده بحياة كريمة وبيئة آمنة، ويتحول فيه المستفيدون من دائرة الاحتياج إلى دائرة الإنتاج والاكتفاء الذاتي المستدام.": "To be a leading, trusted model in integrated charitable and developmental work, building a cohesive society where citizens enjoy a dignified life and safe environment, and beneficiaries transition from dependency to sustainable production and self-sufficiency.",
    "🎯 الرسالة": "🎯 Mission",
    "تقديم رعاية إنسانية وتنموية شاملة للأسر الأولى بالرعاية على مستوى الجمهورية، مع تركيز خاص على أهالينا في محافظة بني سويف ومركز إهناسيا وضواحيها؛ وذلك عبر التدخل السريع لتوفير متطلبات الحياة الأساسية (المسكن الآمن، المياه النظيفة، الإغاثة، والكفالات)، بالتوازي مع التمكين الاقتصادي، والخدمات الصحية والتعليمية؛ من خلال منظومة عمل مؤسسية تُطبّق أعلى معايير الحوكمة، والشفافية، والاستدامة.": "Providing comprehensive humanitarian and developmental care for underprivileged families nationwide, with special focus on our communities in Beni Suef Governorate and Ihnasia District; through rapid intervention for basic life requirements (safe housing, clean water, relief, and sponsorships), alongside economic empowerment, healthcare, and education within an institutional system applying the highest standards of governance, transparency, and sustainability.",
    "قيمنا الجوهرية ومبادئ العمل": "Core Values & Working Principles",
    "الكرامة الإنسانية:": "Human Dignity:",
    "حفظ كرامة المستفيدين وصون خصوصيتهم في كافة مراحل البحث، والدعم، والمساعدة.": "Preserving beneficiaries' dignity and privacy across all stages of research, support, and assistance.",
    "الحوكمة الرشيدة:": "Good Governance:",
    "إدارة موارد المؤسسة وفق أنظمة إدارية ومالية دقيقة، تخضع للرقابة الداخلية والخارجية لضمان النزاهة والكفاءة.": "Managing foundation resources through accurate administrative and financial systems subject to internal and external oversight to ensure integrity and efficiency.",
    "الشفافية والمصداقية:": "Transparency & Credibility:",
    "توجيه التبرعات والمساعدات لمستحقيها الفعليين بدقة ووضوح تام، مع إتاحة تقارير دورية حول أوجه الصرف والإنجازات.": "Directing donations and aid to actual eligible recipients with full accuracy and clarity, while providing periodic reports on disbursements and achievements.",
    "الاستدامة للكل:": "Sustainability for All:",
    "تبني حلول تنموية طويلة الأمد تضمن استمرارية الأثر الإيجابي على الفرد والأسرة والمجتمع بأسره.": "Adopting long-term developmental solutions that ensure lasting positive impact on individuals, families, and the entire community.",
    "الاستجابة السريعة:": "Rapid Response:",
    "الجاهزية الدائمة والمرونة الميدانية للتدخل الفوري في حالات الطوارئ، والأزمات، والإغاثة العاجلة.": "Constant readiness and field flexibility for immediate intervention in emergencies, crises, and urgent relief.",
    "مجالات العمل والمحاور الاستراتيجية": "Areas of Work & Strategic Pillars",
    "1. محور الإغاثة والمساعدات الإنسانية": "1. Humanitarian Relief & Aid Pillar",
    "تقديم المساعدات العينية والمالية الفورية للأسر المتضررة والأكثر احتياجًا.": "Providing immediate in-kind and financial assistance to affected and most vulnerable families.",
    "التدخل السريع في حالات الطوارئ والأزمات الموسمية (الشتاء، شهر رمضان، الأعياد).": "Rapid intervention in emergencies and seasonal crises (Winter, Ramadan, Eid seasons).",
    "2. محور الكفالات والرعاية الاجتماعية": "2. Sponsorships & Social Care Pillar",
    "كفالة الأيتام، والأرامل، والمسنين، وذوي الهمم، لضمان حياة مستقرة وكريمة.": "Sponsoring orphans, widows, the elderly, and persons with disabilities to ensure a stable and dignified life.",
    "تقديم الدعم النفسي والاجتماعي المصاحب للكفالات المادية.": "Providing psychosocial support accompanying financial sponsorships.",
    "3. محور تحسين البيئة والبنية التحتية (سكن كريم ومياه نظيفة)": "3. Environment & Infrastructure Pillar (Decent Housing & Clean Water)",
    "توصيل المياه: مد وصلات المياه النظيفة للأسر المحرومة في القرى والنجوع.": "Water Connections: Extending clean water connections to deprived families in villages and hamlets.",
    "تسقيف المنازل: تركيب الأسقف ورفع كفاءة المنازل المتهالكة لحماية الأسر من تقلبات الطقس.": "Roofing Houses: Installing roofs and upgrading dilapidated homes to protect families from weather extremes.",
    "4. محور التمكين الاقتصادي وتنمية المشروعات": "4. Economic Empowerment & Enterprise Development Pillar",
    "تمويل وتأسيس المشروعات الصغيرة ومتناهية الصغر للأسر المعيلة والشباب.": "Financing and establishing micro and small enterprises for breadwinning families and youth.",
    "التدريب المهني والحرفي لتحويل الأسر المستفيدة إلى أسر منتجة ومستقلة ماديًا.": "Vocational and craft training to transform beneficiary families into productive, financially independent households.",
    "5. محور الرعاية الصحية": "5. Healthcare Pillar",
    "تنظيم القوافل الطبية المجانية في القرى والمناطق الأكثر احتياجًا (وخاصة في قرى إهناسيا وضواحيها).": "Organizing free medical convoys in villages and high-need areas (especially in Ihnasia villages and surroundings).",
    "المساهمة في تكاليف العلاج، والعمليات الجراحية، وتوفير الأدوية والأجهزة التعويضية.": "Contributing to treatment costs, surgeries, medications, and assistive medical devices.",
    "6. محور التعليم وبناء الإنسان": "6. Education & Human Development Pillar",
    "دعم الطلاب غير القادرين بالمستلزمات الدراسية وسداد المصروفات لمنع التسرب من التعليم.": "Supporting underprivileged students with school supplies and tuition fees to prevent school dropouts.",
    "إطلاق برامج محو الأمية، والتوعية المجتمعية، وتنمية مهارات النشء والشباب.": "Launching literacy programs, community awareness, and youth/child skill development.",
    "إطار الحوكمة المؤسسية وتطبيقها": "Institutional Governance Framework & Implementation",
    "تلتزم مؤسسة الحافظ للتنمية والخدمات بتطبيق مبادئ الحوكمة الرشيدة كركيزة أساسية لضمان استدامة العمل الخيري وبناء الثقة مع المجتمع والجهات الرقابية، وذلك من خلال:": "Al-Hafiz Foundation for Development & Services is committed to applying good governance principles as a core pillar to ensure sustainable charitable work and build trust with the community and regulatory bodies through:",
    "1. الفصل الواضح بين السلطات: تحديد دقيق للصلاحيات والمسؤوليات بين مجلس الأمناء والإدارة التنفيذية واللجان الميدانية.": "1. Clear Separation of Powers: Precise definition of authorities and responsibilities among the Board of Trustees, executive management, and field committees.",
    "2. الرقابة المالية والإدارية: اعتماد نظم محاسبية دقيقة، ومراجعة مالية دورية من قِبل مراقب حسابات قانوني معتمد، والالتزام التام بقوانين ولوائح وزارة التضامن الاجتماعي.": "2. Financial & Administrative Oversight: Adopting accurate accounting systems, periodic audits by a licensed statutory auditor, and full compliance with Ministry of Social Solidarity laws and regulations.",
    "3. معايير الاستحقاق والبحث الميداني: تطبيق قواعد صارمة وموثقة لبحث الحالات اجتماعيًا وميدانيًا لضمان وصول الدعم لمستحقيه دون أي تمييز.": "3. Eligibility Criteria & Field Research: Applying strict, documented social and field research rules to ensure aid reaches rightful recipients without discrimination.",
    "4. المساءلة وتقييم الأثر: قياس نتائج المشروعات والمساعدات بشكل دوري للتأكد من تحقيق الأهداف التنموية المرجوة وتطوير الأداء باستمرار.": "4. Accountability & Impact Assessment: Periodically measuring project and aid outcomes to verify developmental goals and continuously improve performance.",
    "النطاق الجغرافي": "Geographic Scope",
    "نطاق التركيز الرئيسي: محافظة بني سويف، وتحديدًا مركز إهناسيا والقرى والنجوع والضواحي التابعة له، نظرًا للاحتياج التنموي والخدمي الكبير في تلك المناطق.": "Primary Focus Scope: Beni Suef Governorate, specifically Ihnasia District and its affiliated villages, hamlets, and surroundings, due to substantial developmental and service needs.",
    "النطاق العام: تمتد مظلة خدمات ومبادرات المؤسسة لتشمل كافة محافظات جمهورية مصر العربية وفقًا لخطط التوسع وحالات الإغاثة العاجلة.": "General Scope: The foundation's services and initiatives extend across all governorates of the Arab Republic of Egypt according to expansion plans and urgent relief cases.",
    "🏗️ الهيكل التنظيمي": "🏗️ Organizational Structure",
    "1. مجلس الأمناء": "1. Board of Trustees",
    "رسم السياسات العامة واعتماد الخطط والموازنات والرقابة العليا.": "Setting general policies, approving plans and budgets, and exercising supreme oversight.",
    "2. الإدارة التنفيذية ولجان البحث": "2. Executive Management & Research Committees",
    "إدارة الحالات ومراجعة المستندات وتحديد الاستحقاق الميداني.": "Managing cases, reviewing documents, and determining field eligibility.",
    "3. الباحثون والمتطوعون والمانحون": "3. Researchers, Volunteers & Donors",
    "تنفيذ النزول الميداني والبحوث ودعم القوافل والتعاون مع الشركاء.": "Conducting field visits and research, supporting convoys, and collaborating with partners.",
    "مجلس الأمناء والهيكل الإداري": "Board of Trustees & Administrative Structure",
    "رئيس مجلس الإدارة / الأمناء: أ. نجم حسين إبراهيم": "Chairman of the Board of Trustees: Mr. Nagm Hussein Ibrahim",
    "السكرتير (الأمين العام): امال ابراهيم ذكى": "Secretary (Secretary-General): Amal Ibrahim Zaki",
    "أمين الصندوق: فاتن سيد عبد العليم": "Treasurer: Faten Sayed Abdel-Alim",
    "المدير التنفيذي: طارق على عباس": "Executive Director: Tarek Ali Abbas",
    "أعضاء مجلس الأمناء: اسماء احمد احمد": "Board of Trustees Members: Asmaa Ahmed Ahmed",
    "فريق المتطوعين والباحثين الميدانيين": "Volunteers & Field Researchers Team",
    "بيانات التواصل الرسمية": "Official Contact Details",
    "رقم الإشهار: 2202 لسنة 2025": "Registration No.: 2202 of 2025",
    "المقر الرئيسي: مركز إهناسيا – محافظة بني سويف": "Main Headquarters: Ihnasia District – Beni Suef Governorate",
    "أرقام التواصل والواتساب: 01155540066 / 01000880156": "Contact & WhatsApp Numbers: 01155540066 / 01000880156",

    // 4. المنح، الإنجازات، الأسئلة الشائعة، الاستعلام، التواصل، التظلمات، الخصوصية، والدخول
    "📢 المنح والمبادرات المفتوحة والإعلانات": "📢 Open Grants, Initiatives & Announcements",
    "تابع أحدث المبادرات المفتوحة للتقديم وقدّم طلبك مباشرة.": "Follow the latest open initiatives and submit your application directly.",
    "🏆 معرض الإنجازات والأنشطة الميدانية": "🏆 Field Achievements & Activities Gallery",
    "توثيق مصور لكافة قوافل ومساعدات مؤسسة الحافظ المنفذة.": "Visual documentation of Al-Hafiz Foundation's convoys and executed aid programs.",
    "❓ الأسئلة الشائعة للمستفيدين والشركاء": "❓ Frequently Asked Questions for Beneficiaries & Partners",
    "في حال وجود أي مشكلة أو استفسار خاص بطلبك، يرجى التوجه إلى مقر المؤسسة أو الدخول إلى شاشة التظلمات السرية، وسوف نرد على حضراتكم في أقرب وقت مع تحيات مؤسسة الحافظ.": "If you have any issue or inquiry regarding your request, please visit the foundation's headquarters or submit via the confidential grievances screen, and we will respond as soon as possible. Best regards, Al-Hafiz Foundation.",
    "🔍 الاستعلام الفوري عن طلب": "🔍 Instant Request Tracking",
    "لحماية سرية وخصوصية الأسر، يرجى إدخال رقم الطلب المرسل إليك عبر الواتساب فقط (مثل: HF-2026-10001)": "To protect family privacy and confidentiality, please enter only the tracking code sent to you via WhatsApp (e.g., HF-2026-10001)",
    "أدخل رقم الطلب المرسل على الواتساب فقط (HF-...)": "Enter the tracking code sent via WhatsApp only (HF-...)",
    "بحث": "Search",
    "اتصل بنا والدعم الفني والتظلمات": "Contact Us, Technical Support & Grievances",
    "📍 بيانات المقرات والتواصل المباشر": "📍 Headquarters & Direct Contact",
    "المقر الرئيسي:": "Main Headquarters:",
    "منشأة عبد الصمد – مركز إهناسيا – بني سويف": "Manshaat Abdel-Samad – Ihnasia District – Beni Suef",
    "واتساب الرسمي:": "Official WhatsApp:",
    "البريد:": "Email:",
    "⚖️ نموذج التظلمات السرية": "⚖️ Confidential Grievances Form",
    "تظلم من رفض طلب مساعدة": "Appeal Against Rejected Aid Request",
    "إبلاغ عن حالة غير مستحقة": "Report Ineligible Case",
    "إبلاغ عن حالة غير مستحقة (رقابة مجتمعية)": "Report Ineligible Case (Community Oversight)",
    "طلب دعم فني للمنصة": "Platform Technical Support Request",
    "الاسم كاملاً *": "Full Name *",
    "رقم الهاتف (11 رقم) *": "Phone Number (11 digits) *",
    "تفاصيل الرسالة أو التظلم بسرية تامة *": "Message or grievance details in strict confidentiality *",
    "إرسال الرسالة بسرية تامة": "Send Message in Strict Confidentiality",
    "🔒 سياسة الخصوصية وحماية البيانات الشخصية": "🔒 Privacy Policy & Personal Data Protection",
    "تُجمع البيانات لإجراء البحوث الاجتماعية ومنع ازدواجية الصرف، مع التعهد بعدم بيع أو إفشاء بيانات المستفيدين.": "Data is collected to conduct social research and prevent aid duplication, with a strict pledge never to sell or disclose beneficiary data.",
    "🔐 بوابة الدخول الموحدة": "🔐 Unified Login Portal",
    "البريد الإلكتروني المسجل": "Registered Email Address",
    "كلمة المرور أو الرمز المؤقت": "Password or Temporary Code",
    "تسجيل الدخول": "Sign In",
    "+ طلب انضمام جديد": "+ New Membership Request",
    "مؤسسة أهلية تنموية مشهرة برقم 2202 لسنة 2025 بوزارة التضامن الاجتماعي.": "A civil developmental foundation registered under No. 2202 of 2025 with the Ministry of Social Solidarity.",
    "© 2026 جميع الحقوق محفوظة لمؤسسة الحافظ للتنمية والخدمات": "© 2026 All Rights Reserved - Al-Hafiz Foundation for Development & Services",

    // 5. معالج استمارة البحث الاجتماعي (wizard.js) - الخطوات، الحقول، والخيارات
    "استمارة تسجيل وبحث حالة اجتماعية": "Social Case Registration & Research Form",
    "لا يُسمح بالانتقال إلى القسم التالي إلا بعد استكمال القسم الحالي (باستثناء قسم الأبناء عند عدم وجود أبناء)": "Moving to the next section is not allowed until the current section is completed (except the children section when there are no children)",
    "💾 حفظ مسودة": "💾 Save Draft",
    "الخطوة": "Step",
    "من": "of",
    "🎯 الخطوة الأولى: تحديد نوع التدخل والمساعدات الخاصة": "🎯 Step 1: Select Type of Intervention & Special Assistance",
    "نوع المساعدة الأساسية المطلوبة للأسرة *": "Primary Assistance Type Required for the Family *",
    "يرجى استكمال كل قسم بالكامل قبل الانتقال إلى القسم التالي.": "Please complete each section in full before moving to the next section.",
    "كفالة أيتام شهرية": "Monthly Orphan Sponsorship",
    "تجهيز عروسة (أجهزة كهربائية / مفروشات)": "Bride Trousseau (Appliances / Furnishings)",

    // الخطوة 2: بيانات الزوج
    "👤 القسم الأول: بيانات الزوج (رب الأسرة)": "👤 Section 1: Husband Data (Head of Household)",
    "الاسم الأول *": "First Name *",
    "الاسم الثاني *": "Second Name *",
    "الاسم الثالث والعائلة *": "Third Name & Family Name *",
    "الحالة الاجتماعية *": "Marital Status *",
    "الرقم القومي (14 رقم حصراً) *": "National ID (14 digits only) *",
    "النوع (تلقائي من الرقم القومي)": "Gender (Auto from National ID)",
    "ذكر": "Male",
    "أنثى": "Female",
    "تاريخ الميلاد (تلقائي من الرقم القومي)": "Birth Date (Auto from National ID)",
    "المستوى التعليمي *": "Educational Level *",
    "غير متعلم": "Illiterate",
    "غير متعلم (لا يقرأ ولا يكتب)": "Illiterate (Cannot Read or Write)",
    "متعلم": "Educated",
    "العنوان الإداري (التسلسل الجغرافي المعتمد) *": "Administrative Address (Approved Geographic Hierarchy) *",
    "1. المحافظة:": "1. Governorate:",
    "2. المركز / القسم:": "2. District / City:",
    "3. القرية أو التابع:": "3. Village or Sub-village:",
    "-- اختر المحافظة أولاً --": "-- Select Governorate First --",
    "-- اختر المركز / القسم --": "-- Select District / City --",
    "-- اختر المركز أولاً --": "-- Select District First --",
    "-- اختر القرية أو التابع --": "-- Select Village or Sub-village --",
    "+ إضافة قرية / عزبة / تابع جديد غير مدرج": "+ Add New Unlisted Village / Hamlet / Sub-village",
    "اكتب اسم القرية / العزبة / التابع الجديد بدقة ليُحفظ في النظام *": "Enter the exact name of the new village / hamlet / sub-village to save in the system *",
    "شارع / رقم الحارة / التفاصيل كما مدون بالبطاقة *": "Street / Alley Number / Details as Written on National ID *",
    "رقم التليفون الأساسي (11 رقم) *": "Primary Phone Number (11 digits) *",
    "رقم الواتساب (11 رقم)": "WhatsApp Number (11 digits)",
    "الوظيفة الحالية *": "Current Occupation *",
    "صورة بطاقة الزوج (وش) *": "Husband National ID Photo (Front) *",
    "صورة بطاقة الزوج (ظهر) *": "Husband National ID Photo (Back) *",
    "الزوج": "Husband",

    // الخطوة 3: بيانات الزوجة
    "👩 القسم الثاني: بيانات الزوجة": "👩 Section 2: Wife Data",
    "الحالة الاجتماعية للزوجة *": "Wife Marital Status *",
    "رقم التليفون الأساسي (11 رقم)": "Primary Phone Number (11 digits)",
    "الوظيفة / النشاط *": "Occupation / Activity *",
    "غير متعلمة": "Illiterate",
    "ابتدائية": "Primary",
    "إعدادية": "Preparatory",
    "ثانوي / دبلوم": "Secondary / Diploma",
    "ثانوي أو دبلوم فني": "Secondary or Technical Diploma",
    "جامعي": "University",
    "صورة بطاقة الزوجة (وش) *": "Wife National ID Photo (Front) *",
    "صورة بطاقة الزوجة (ظهر) *": "Wife National ID Photo (Back) *",
    "الزوجة": "Wife",

    // الخطوة 4: الأبناء
    "👶 القسم الثالث: بيانات الأبناء والتابعين": "👶 Section 3: Children & Dependents Data",
    "ملاحظة: إذا لم يكن للأسرة أبناء، يمكنك الانتقال مباشرة إلى الخطوة التالية دون إضافة أبناء.": "Note: If the family has no children, you may proceed directly to the next step without adding children.",
    "الابن / الابنة رقم": "Child No.",
    "اسم الابن ثلاثي *": "Child Triple Name *",
    "الرقم القومي (14 رقم) *": "National ID (14 digits) *",
    "النوع (تلقائي):": "Gender (Auto):",
    "تاريخ الميلاد (تلقائي):": "Birth Date (Auto):",
    "المرحلة التعليمية:": "Educational Stage:",
    "حضانة": "Nursery / Kindergarten",
    "ابتدائي": "Primary",
    "إعدادي": "Preparatory",
    "ثانوي / فني": "Secondary / Technical",
    "ثانوي أو فني": "Secondary or Technical",
    "تعليم جامعي": "University Education",
    "شهادة الميلاد / المستند:": "Birth Certificate / Document:",
    "الحالة الصحية:": "Health Status:",
    "سليم": "Healthy",
    "مريض": "Ill",
    "مريض بمرض مزمن أو إعاقة": "Chronic Illness or Disability",
    "حذف هذا الابن": "Remove This Child",
    "+ إضافة ابن آخر": "+ Add Another Child",

    // الخطوة 5: الزواج وتجهيز العروسة
    "💍 القسم الإضافي: بيانات العروسة وتجهيز الزواج": "💍 Additional Section: Bride Data & Marriage Preparation",
    "اسم العروسة الأول *": "Bride First Name *",
    "اسم العروسة الثاني *": "Bride Second Name *",
    "اسم العروسة الثالث والعائلة *": "Bride Third Name & Family Name *",
    "الرقم القومي للعروسة (14 رقم) *": "Bride National ID (14 digits) *",
    "رقم تليفون العروسة أو وليها *": "Bride or Guardian Phone Number *",
    "موعد الزفاف المقترح *": "Proposed Wedding Date *",
    "المتوفرات لدى العروسة *": "Items Already Available with Bride *",
    "صورة قسيمة الزواج / الخطوبة *": "Marriage / Engagement Certificate Photo *",
    "الشهادة الصحية للعروسين (وش وظهر) *": "Pre-Marriage Medical Certificates (Front & Back) *",

    // الخطوة 6: المصروفات
    "💸 القسم الرابع: المصروفات والأعباء الشهرية": "💸 Section 4: Monthly Expenses & Obligations",
    "قيمة الإيجار الشهري *": "Monthly Rent Amount *",
    "فواتير مياه *": "Water Bills *",
    "فواتير كهرباء *": "Electricity Bills *",
    "فواتير غاز أو أنبوبة *": "Gas or Cylinder Bills *",
    "مصاريف تعليم الأبناء *": "Children Education Expenses *",
    "مصاريف العلاج والأدوية المزمنة *": "Treatment & Chronic Medication Expenses *",
    "المستلزمات المعيشية الأساسية (مأكل ومسكن) *": "Basic Living Essentials (Food & Shelter) *",
    "أقساط ديون والتزامات أخرى *": "Debt Installments & Other Obligations *",
    "إجمالي المصروفات الشهرية:": "Total Monthly Expenses:",
    "جنيه": "EGP",

    // الخطوة 7: الدخل والفائض أو العجز
    "💵 القسم الخامس: مصادر الدخل والفائض أو العجز": "💵 Section 5: Income Sources & Surplus or Deficit",
    "دخل الزوج من العمل / المهنة *": "Husband Income from Work / Profession *",
    "دخل الزوجة أو الأبناء العاملين *": "Income of Wife or Working Children *",
    "معاش حكومي / تكافل وكرامة *": "Government Pension / Takaful & Karama *",
    "مساعدات ثابتة من أهل الخير *": "Regular Support from Benefactors *",
    "إجمالي الدخل الشهري:": "Total Monthly Income:",
    "صافي الوضع المالي:": "Net Financial Status:",
    "يوجد عجز مالي شهري بقيمة:": "Monthly financial deficit of:",
    "يوجد فائض مالي شهري بقيمة:": "Monthly financial surplus of:",

    // الخطوة 8: السكن، الفرش، المستندات، ورأي الباحث
    "📋 القسم السادس: وصف السكن، المستندات الرسمية، ورأي الباحث": "📋 Section 6: Housing Description, Official Documents & Researcher Opinion",
    "حالة السكن أولاً *": "Housing Tenure First *",
    "ملك": "Owned",
    "إيجار": "Rented",
    "نوع السكن ثانياً *": "Housing Type Second *",
    "ريفي / بيت ريفي": "Rural / Rural House",
    "شقة سكنية": "Apartment",
    "بيت عائلي": "Family House",
    "انتفاع": "Usufruct",
    "هبة": "Granted / Gift",
    "وصف السقف *": "Roof Description *",
    "خشب": "Wood",
    "مسلح": "Reinforced Concrete",
    "جريد": "Palm Fronds",
    "بوص": "Reeds",
    "عفش": "Thatch / Debris",
    "وصف الحوائط *": "Walls Description *",
    "طوب لبن": "Mud Brick",
    "طوب أحمر غير محارة": "Unplastered Red Brick",
    "محارة وتشطيب عادي": "Plastered & Standard Finish",
    "لوكس / سوبر لوكس": "Deluxe / Super Deluxe",
    "وصف الأرضية *": "Floor Description *",
    "ترابية": "Dirt / Earthen",
    "بلاط عادي": "Standard Tiles",
    "سيراميك": "Ceramic",
    "رخام / جرانيت": "Marble / Granite",
    "وصف الفرش والأثاث *": "Furniture & Furnishings Description *",
    "تحديد النواقص في الفرش والأثاث *": "Specify Furniture & Furnishings Deficiencies *",
    "البحث الاجتماعي (مختوم) *": "Social Research Report (Stamped) *",
    "برنت تأميني للزوج": "Husband Social Insurance Printout",
    "برنت تأميني للزوجة": "Wife Social Insurance Printout",
    "عقد الإيجار الرسمي *": "Official Lease Contract *",
    "إثبات قيد دراسي للأبناء": "Proof of Children School Enrollment",
    "رأي وتوصية الباحث الميداني *": "Field Researcher Opinion & Recommendation *",
    "حالة شديدة الاستحقاق وعاجلة": "Severely Eligible & Urgent Case",
    "حالة مستحقة للدعم العادي": "Eligible for Regular Support",
    "حالة متوسطة الاستحقاق": "Moderately Eligible Case",
    "غير مستحق بعد المراجعة": "Not Eligible After Review",
    "أقر أنا مقدم الطلب بأن كافة البيانات والمستندات المسجلة صحيحة تماماً وتحت مسئوليتي القانونية والمجتمعية، وأوافق على إجراء البحث الميداني.": "I, the applicant, declare that all registered data and documents are completely accurate under my legal and social responsibility, and I agree to conduct field research.",

    // الحالة الصحية والإجراءات الطبية
    "الحالة الصحية": "Health Status",
    "سليم وبصحة جيدة": "Healthy & In Good Health",
    "نوع المرض *": "Illness Type *",
    "مؤقت": "Temporary",
    "مزمن": "Chronic",
    "تشخيص الحالة المرضية *": "Medical Diagnosis *",
    "الإجراء الطبي المطلوب (بالتفصيل الكامل) *": "Required Medical Procedure (Full Details) *",
    "رفع التقرير الطبي (مختوم) *": "Upload Medical Report (Stamped) *",
    "رفع البحث الاجتماعي (مختوم) *": "Upload Social Research Report (Stamped) *",
    "إجراء عملية جراحية": "Surgical Operation",
    "دواء وعلاج شهري مزمن": "Monthly Chronic Medication & Treatment",
    "جلسات غسيل كلوي أو علاج كيماوي": "Kidney Dialysis or Chemotherapy Sessions",
    "أشعة وتحاليل طبية وفحوصات": "X-Rays, Lab Tests & Medical Checkups",
    "تركيب طرف صناعي": "Prosthetic Limb Fitting",
    "أجهزة تعويضية": "Assistive Devices",
    "جلسات علاج طبيعي أو تخاطب": "Physical or Speech Therapy Sessions",
    "اختر نوع العملية الجراحية المطلوبة *": "Select Required Surgical Operation Type *",
    "التكلفة الشهرية التقديرية (جنيه) *": "Estimated Monthly Cost (EGP) *",
    "أدخل التكلفة الشهرية بالجنيه": "Enter monthly cost in EGP",
    "اختر نوع الطرف الصناعي المطلوب *": "Select Required Prosthetic Limb Type *",
    "اختر نوع الجهاز التعويضي المطلوب *": "Select Required Assistive Device Type *",

    // أزرار المعالج ورسائل التحقق
    "السابق": "Previous",
    "التالي ➔": "Next ➔",
    "✅ تأكيد والرفع النهائي للحالة": "✅ Confirm & Submit Case",
    "يرجى اختيار نوع المساعدة الأساسية المطلوبة.": "Please select the required primary assistance type.",
    "يرجى استكمال الاسم الثلاثي والعائلة للزوج.": "Please complete the husband's triple name and family name.",
    "الرقم القومي للزوج غير صحيح (يجب أن يتكون من 14 رقماً صحيحاً).": "Husband's National ID is invalid (must be 14 valid digits).",
    "يرجى إدخال تفاصيل العنوان (الشارع / الحارة / رقم المنزل).": "Please enter address details (street / alley / house number).",
    "رقم التليفون الأساسي للزوج يجب أن يتكون من 11 رقماً يبدأ بـ 01.": "Husband's primary phone number must be 11 digits starting with 01.",
    "رقم الواتساب للزوج يجب أن يتكون من 11 رقماً صحيحاً.": "Husband's WhatsApp number must be 11 valid digits.",
    "يرجى تحديد الإجراء الطبي المطلوب للزوج.": "Please specify the required medical procedure for the husband.",
    "يرجى إدخال التكلفة الشهرية التقديرية للإجراء الطبي للزوج.": "Please enter the estimated monthly cost of the husband's medical procedure.",
    "يرجى رفع التقرير الطبي المختوم للزوج.": "Please upload the husband's stamped medical report.",
    "يرجى رفع البحث الاجتماعي المختوم لحالة الزوج.": "Please upload the stamped social research report for the husband's case.",
    "يرجى رفع صورة بطاقة الزوج (وجه وظهر).": "Please upload photos of the husband's National ID (front and back).",
    "يرجى استكمال الاسم الثلاثي والعائلة للزوجة.": "Please complete the wife's triple name and family name.",
    "الرقم القومي للزوجة غير صحيح (يجب أن يتكون من 14 رقماً صحيحاً).": "Wife's National ID is invalid (must be 14 valid digits).",
    "رقم هاتف الزوجة يجب أن يتكون من 11 رقماً صحيحاً.": "Wife's phone number must be 11 valid digits.",
    "يرجى تحديد الإجراء الطبي المطلوب للزوجة.": "Please specify the required medical procedure for the wife.",
    "يرجى إدخال التكلفة الشهرية التقديرية للإجراء الطبي للزوجة.": "Please enter the estimated monthly cost of the wife's medical procedure.",
    "يرجى رفع التقرير الطبي المختوم للزوجة.": "Please upload the wife's stamped medical report.",
    "يرجى رفع البحث الاجتماعي المختوم للزوجة.": "Please upload the stamped social research report for the wife's case.",
    "يرجى رفع صورة بطاقة الزوجة (وجه وظهر).": "Please upload photos of the wife's National ID (front and back).",
    "يرجى استكمال الاسم الثلاثي والعائلة للعروسة.": "Please complete the bride's triple name and family name.",
    "الرقم القومي للعروسة غير صحيح (14 رقماً).": "Bride's National ID is invalid (14 digits).",
    "رقم هاتف العروسة أو وليها يجب أن يتكون من 11 رقماً.": "Bride or guardian phone number must be 11 digits.",
    "يرجى تحديد موعد الزفاف المقترح.": "Please specify the proposed wedding date.",
    "يرجى إدخال المتوفرات لدى العروسة.": "Please enter items available with the bride.",
    "يرجى رفع قسيمة الزواج/الخطوبة والشهادة الصحية للعروسين.": "Please upload the marriage/engagement certificate and pre-marriage medical certificates.",
    "يرجى إدخال قيمة رقمية صحيحة (0 أو أكثر) لجميع بنود المصروفات الشهرية.": "Please enter a valid numeric value (0 or more) for all monthly expense items.",
    "يرجى إدخال قيمة رقمية صحيحة (0 أو أكثر) لجميع مصادر الدخل.": "Please enter a valid numeric value (0 or more) for all income sources.",
    "يرجى اختيار بند واحد على الأقل من نواقص الفرش والأثاث.": "Please select at least one item from furniture and furnishings deficiencies.",
    "يرجى رفع البحث الاجتماعي المختوم ضمن المستندات الرسمية.": "Please upload the stamped social research report among official documents.",
    "يرجى رفع عقد الإيجار الرسمي لأن حالة السكن إيجار.": "Please upload the official lease contract because housing tenure is rented.",
    "يجب الموافقة على إقرار صحة البيانات والمسؤولية القانونية قبل الرفع النهائي.": "You must agree to the declaration of data accuracy and legal responsibility before final submission.",
    "يرجى كتابة اسم القرية أو التابع الجديد.": "Please enter the name of the new village or sub-village.",
    "تعذر الاتصال بقاعدة البيانات حالياً، يرجى تحديث الصفحة والمحاولة مرة أخرى.": "Unable to connect to the database right now, please refresh the page and try again."
    "1. من نحن": "1. About Us",
    "2. الرؤية": "2. Vision",
    "3. الرسالة": "3. Mission",
    "4. قيمنا الجوهرية ومبادئ العمل": "4. Core Values & Working Principles",
    "5. مجالات العمل والمحاور الاستراتيجية": "5. Areas of Work & Strategic Pillars",
    "1. محور الإغاثة والمساعدات الإنسانية:": "1. Humanitarian Relief & Aid Pillar:",
    "تقديم المساعدات العينية والمالية الفورية للأسر المتضررة والأكثر احتياجًا، والتدخل السريع في الأزمات والمواسم (الشتاء، رمضان، الأعياد).": "Providing immediate in-kind and financial assistance to affected and most vulnerable families, and rapid intervention in crises and seasons (Winter, Ramadan, Eid).",
    "2. محور الكفالات والرعاية الاجتماعية:": "2. Sponsorships & Social Care Pillar:",
    "كفالة الأيتام، والأرامل، والمسنين، وذوي الهمم، وتقديم الدعم النفسي والاجتماعي المصاحب للكفالات المادية.": "Sponsoring orphans, widows, the elderly, and persons with disabilities, and providing psychosocial support accompanying financial sponsorships.",
    "3. محور تحسين البيئة والبنية التحتية (سكن كريم ومياه نظيفة):": "3. Environment & Infrastructure Pillar (Decent Housing & Clean Water):",
    "مد وصلات المياه النظيفة للأسر المحرومة، وتركيب الأسقف ورفع كفاءة المنازل المتهالكة لحماية الأسر من تقلبات الطقس.": "Extending clean water connections to deprived families, installing roofs, and upgrading dilapidated homes to protect families from weather extremes.",
    "4. محور التمكين الاقتصادي وتنمية المشروعات:": "4. Economic Empowerment & Enterprise Development Pillar:",
    "تمويل وتأسيس المشروعات الصغيرة ومتناهية الصغر للأسر المعيلة والشباب، وتقديم التدريب المهني لتحويلهم إلى أسر منتجة.": "Financing and establishing micro and small enterprises for breadwinning families and youth, and providing vocational training to turn them into productive families.",
    "5. محور الرعاية الصحية:": "5. Healthcare Pillar:",
    "تنظيم القوافل الطبية المجانية في القرى والنجوع، والمساهمة في تكاليف العلاج، والعمليات الجراحية، والأجهزة التعويضية.": "Organizing free medical convoys in villages and hamlets, and contributing to treatment costs, surgeries, and assistive devices.",
    "6. محور التعليم وبناء الإنسان:": "6. Education & Human Development Pillar:",
    "دعم الطلاب غير القادرين بالمستلزمات الدراسية وسداد المصروفات لمنع التسرب من التعليم، وإطلاق برامج محو الأمية والتوعية المجتمعية.": "Supporting underprivileged students with school supplies and tuition fees to prevent school dropouts, and launching literacy and community awareness programs.",
    "6. النطاق الجغرافي": "6. Geographic Scope",
    "نطاق التركيز الرئيسي:": "Primary Focus Scope:",
    "محافظة بني سويف، وتحديدًا مركز إهناسيا والقرى والنجوع والضواحي التابعة له.": "Beni Suef Governorate, specifically Ihnasia District and its affiliated villages, hamlets, and surroundings.",
    "النطاق العام:": "General Scope:",
    "تمتد مظلة خدمات ومبادرات المؤسسة لتشمل كافة محافظات جمهورية مصر العربية.": "The foundation's services and initiatives extend across all governorates of the Arab Republic of Egypt.",
    "7. مجلس الأمناء والهيكل الإداري": "7. Board of Trustees & Administrative Structure",
    "رئيس مجلس الإدارة / الأمناء:": "Chairman of the Board / Trustees:",
    "السكرتير (الأمين العام):": "Secretary (Secretary-General):",
    "أمين الصندوق:": "Treasurer:",
    "المدير التنفيذي:": "Executive Director:",
    "أعضاء مجلس الأمناء:": "Board of Trustees Members:",
    "فريق العمل:": "Work Team:",
    "باقي المتطوعين والباحثين": "Remaining volunteers and researchers",
    "1. الفصل الواضح بين السلطات:": "1. Clear Separation of Powers:",
    "تحديد دقيق للصلاحيات والمسؤوليات بين مجلس الأمناء (الجهة التشريعية والرقابية) والإدارة التنفيذية واللجان الميدانية (جهة التنفيذ).": "Precise definition of authorities and responsibilities between the Board of Trustees (legislative and oversight body) and executive management and field committees (execution body).",
    "2. الرقابة المالية والإدارية:": "2. Financial & Administrative Oversight:",
    "اعتماد نظم محاسبية دقيقة، ومراجعة مالية دورية من قِبل مراقب حسابات قانوني معتمد، والالتزام التام بقوانين ولوائح وزارة التضامن الاجتماعي.": "Adopting accurate accounting systems, periodic financial audits by a licensed statutory auditor, and full compliance with Ministry of Social Solidarity laws and regulations.",
    "3. معايير الاستحقاق والبحث الميداني:": "3. Eligibility Criteria & Field Research:",
    "تطبيق قواعد صارمة وموثقة لبحث الحالات اجتماعيًا وميدانيًا لضمان وصول الدعم لمستحقيه دون أي تمييز.": "Applying strict, documented social and field research rules to ensure aid reaches rightful recipients without discrimination.",
    "4. المساءلة وتقييم الأثر:": "4. Accountability & Impact Assessment:",
    "قياس نتائج المشروعات والمساعدات بشكل دوري للتأكد من تحقيق الأهداف التنموية المرجوة وتطوير الأداء باستمرار.": "Periodically measuring project and aid outcomes to ensure developmental goals are met and performance continuously improved.",
    "🔒 سياسة الخصوصية وحماية البيانات": "🔒 Privacy Policy & Data Protection",
    "تلتزم المؤسسة بأعلى معايير الخصوصية والسرية في جمع ومعالجة وحماية البيانات الشخصية لكافة المتعاملين معها (متبرعين، مستفيدين، متطوعين، وشركاء)، وفقًا لأحكام القانون المصري رقم 151 لسنة 2020:": "The foundation is committed to the highest standards of privacy and confidentiality in collecting, processing, and protecting personal data of all stakeholders (donors, beneficiaries, volunteers, and partners), in accordance with Egyptian Law No. 151 of 2020:",
    "1. البيانات التي نجمعها وأغراضها:": "1. Data We Collect & Its Purposes:",
    "تُجمع البيانات الشخصية والاجتماعية والمالية بالقدر اللازم فقط لدراسة استحقاق الأسر، وتنفيذ المشروعات، وتوثيق التبرعات وإصدار الإيصالات الرسمية، والامتثال لمتطلبات وزارة التضامن الاجتماعي.": "Personal, social, and financial data is collected only as necessary to assess family eligibility, execute projects, document donations and issue official receipts, and comply with Ministry of Social Solidarity requirements.",
    "2. حماية كرامة المستفيدين وضوابط التصوير:": "2. Protecting Beneficiaries' Dignity & Photography Controls:",
    "يُحظر تمامًا نشر أي بيانات شخصية أو مستندات رسمية للمستفيدين. ولا يتم التقاط أو نشر أي صور للمستفيدين إلا بموافقتهم الصريحة المسبقة وبما يصون كرامتهم الإنسانية.": "Publishing any personal data or official documents of beneficiaries is strictly prohibited. Photos of beneficiaries are taken or published only with their prior explicit consent and in a manner preserving human dignity.",
    "3. سرية البيانات وعدم مشاركتها:": "3. Data Confidentiality & Non-Sharing:",
    "تتعهد المؤسسة بعدم بيع أو مشاركة البيانات مع أي طرف ثالث لأغراض تجارية. وتنحصر المشاركة في الجهات الرقابية الرسمية، والبنوك المعتمدة لإتمام المعاملات، والجمعيات الشريكة في المشروعات المشتركة تحت التزام كامل بالسرية.": "The foundation pledges never to sell or share data with any third party for commercial purposes. Sharing is limited to official regulatory bodies, approved banks to complete transactions, and partner associations in joint projects under full confidentiality.",
    "4. أمن المعلومات وحقوق أصحاب البيانات:": "4. Information Security & Data Subjects' Rights:",
    "تُحفظ السجلات الورقية والإلكترونية في بيئة آمنة يقتصر الاطلاع عليها على المخولين فقط، ويحق لأي متعامل طلب تحديث بياناته أو إيقاف الرسائل الإخبارية في أي وقت.": "Paper and electronic records are stored in a secure environment restricted to authorized personnel, and any stakeholder may request updating their data or stopping newsletters at any time.",
    "سياسة قبول التبرعات والشفافية المالية": "Donation Acceptance & Financial Transparency Policy",
    "1. مشروعية مصادر التمويل:": "1. Legitimacy of Funding Sources:",
    "تقبل المؤسسة التبرعات النقدية والعينية والزكوات والصدقات من الأفراد والمؤسسات والجهات المانحة داخل جمهورية مصر العربية (ومن الخارج بعد الحصول على الموافقات الرسمية من وزارة التضامن الاجتماعي)، بشرط أن تكون من مصادر مشروعة وقانونية.": "The foundation accepts cash and in-kind donations, zakat, and sadaqah from individuals, institutions, and donors within Egypt (and from abroad after obtaining official approvals from the Ministry of Social Solidarity), provided they come from legitimate and legal sources.",
    "2. رفض التبرعات المشروطة بما يخالف الأهداف:": "2. Refusal of Conditional Donations Violating Objectives:",
    "ترفض المؤسسة أي تبرع يمس استقلاليتها، أو يتعارض مع قيمها وأهدافها التنموية، أو يفرض شروطًا تمييزية بين المستفيدين.": "The foundation refuses any donation that compromises its independence, conflicts with its values and developmental objectives, or imposes discriminatory conditions among beneficiaries.",
    "3. التوثيق وإيصالات الاستلام:": "3. Documentation & Receipt Vouchers:",
    "تُصدر المؤسسة إيصالات رسمية مختومة ومعتمدة لكافة التبرعات النقدية والعينية، وتُودع كافة الأموال في الحسابات البنكية الرسمية للمؤسسة.": "The foundation issues officially stamped and approved receipts for all cash and in-kind donations, and deposits all funds into the foundation's official bank accounts.",
    "4. توجيه التبرعات المخصصة:": "4. Earmarked Donations Allocation:",
    "تلتزم المؤسسة بتوجيه التبرعات المخصصة لبند معين (مثل: وصلات المياه، الأسقف، الكفالات، أو الزكاة) إلى مصرفها المحدد بدقة وأمانة تامة.": "The foundation is committed to directing donations earmarked for a specific item (such as water connections, roofs, sponsorships, or zakat) to their designated purpose with complete accuracy and honesty.",
    "سياسة منع تضارب المصالح": "Conflict of Interest Prevention Policy",
    "1. النزاهة والحياد:": "1. Integrity & Impartiality:",
    "يلتزم أعضاء مجلس الأمناء، والعاملون، والمتطوعون بتغليب مصلحة المؤسسة والمستفيدين على أي مصلحة شخصية، أو عائلية، أو تجارية.": "Board members, staff, and volunteers are committed to prioritizing the interest of the foundation and beneficiaries over any personal, family, or commercial interest.",
    "2. الإفصاح المسبق:": "2. Prior Disclosure:",
    "يجب على أي عضو أو موظف الإفصاح الكتابي الفوري لمجلس الأمناء عن أي صلة قرابة أو مصلحة مالية مباشرة أو غير مباشرة قد تنشأ عند التعاقد مع موردين أو عند بحث حالات مستفيدين، والامتناع عن التصويت أو المشاركة في اتخاذ القرار بشأنها.": "Any member or employee must immediately submit a written disclosure to the Board of Trustees of any family relationship or direct/indirect financial interest arising when contracting suppliers or reviewing beneficiary cases, and abstain from voting or participating in related decisions.",
    "3. حظر استغلال المنصب:": "3. Prohibition of Abuse of Position:",
    "يُحظر استغلال الصفة الوظيفية أو التطوعية في المؤسسة لتحقيق أي مكاسب مادية أو معنوية شخصية.": "Exploiting an administrative or volunteer position in the foundation for personal material or moral gain is prohibited.",
    "اسم المؤسسة:": "Foundation Name:",
    "مؤسسة الحافظ للتنمية والخدمات": "Al-Hafiz Foundation for Development & Services",
    "رقم الإشهار: 2202 لسنة 2025 (وزارة التضامن الاجتماعي)": "Registration No.: 2202 of 2025 (Ministry of Social Solidarity)",
    "المقر الرئيسي: مركز إهناسيا – محافظة بني سويف": "Main Headquarters: Ihnasia District – Beni Suef Governorate",
    "أرقام التواصل والواتساب: 01155540066 / 01000880156": "Contact & WhatsApp Numbers: 01155540066 / 01000880156",
    "مؤسسة أهلية تنموية وخيرية مشهرة بوزارة التضامن الاجتماعي برقم (2202) لسنة 2025.": "A developmental and charitable civil foundation registered with the Ministry of Social Solidarity under No. (2202) of 2025."
  };

  rebuildSortedEntries();

  window.currentSiteLang = 'ar';

  window.t = function(arText, enText) {
    if (window.currentSiteLang === 'en') {
      return enText || window.FULL_DICTIONARY[arText] || arText;
    }
    return arText;
  };

  function translateStringToEn(text) {
    if (!text) return text;
    const dict = window.FULL_DICTIONARY || {};
    const trimmed = text.trim();
    if (dict[trimmed]) {
      return text.replace(trimmed, dict[trimmed]);
    }
    let result = text;
    for (let i = 0; i < SORTED_ENTRIES.length; i++) {
      const [arKey, enVal] = SORTED_ENTRIES[i];
      if (result.includes(arKey)) {
        result = result.split(arKey).join(enVal);
      }
    }
    return result;
  }

  function captureAndTranslateTextNode(node, toEn) {
    if (!node || !node.nodeValue) return;
    const raw = node.nodeValue;
    if (!raw.trim()) return;

    if (!ORIGINAL_TEXT_MAP.has(node)) {
      ORIGINAL_TEXT_MAP.set(node, raw);
    }

    if (!toEn) {
      node.nodeValue = ORIGINAL_TEXT_MAP.get(node);
      return;
    }

    const baseRaw = ORIGINAL_TEXT_MAP.get(node);
    node.nodeValue = translateStringToEn(baseRaw);
  }

  function captureAndTranslateAttributes(el, toEn) {
    if (!el || !el.getAttribute) return;
    const attrs = ['placeholder', 'title', 'aria-label', 'alt', 'label'];
    if (!ORIGINAL_ATTR_MAP.has(el)) {
      const saved = {};
      attrs.forEach(a => {
        if (el.hasAttribute(a)) saved[a] = el.getAttribute(a);
      });
      ORIGINAL_ATTR_MAP.set(el, saved);
    }

    const originalAttrs = ORIGINAL_ATTR_MAP.get(el) || {};
    attrs.forEach(a => {
      if (!el.hasAttribute(a) && !(a in originalAttrs)) return;
      if (!toEn) {
        if (a in originalAttrs) el.setAttribute(a, originalAttrs[a]);
        return;
      }
      const baseVal = originalAttrs[a] ?? el.getAttribute(a) ?? '';
      if (baseVal.trim()) {
        el.setAttribute(a, translateStringToEn(baseVal));
      }
    });
  }

  window.translateWholePage = function(lang) {
    rebuildSortedEntries();
    const targetLang = lang === 'en' ? 'en' : 'ar';
    const toEn = targetLang === 'en';

    document.documentElement.lang = targetLang;
    document.documentElement.dir = toEn ? 'ltr' : 'rtl';
    if (document.body) {
      document.body.dir = toEn ? 'ltr' : 'rtl';
      document.body.classList.toggle('lang-en', toEn);
      document.body.classList.toggle('lang-ar', !toEn);
    }

    if (!document.body) return;

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
      const parentTag = node.parentElement ? node.parentElement.tagName : '';
      if (parentTag === 'SCRIPT' || parentTag === 'STYLE') continue;
      captureAndTranslateTextNode(node, toEn);
    }

    document.querySelectorAll('input, textarea, select, button, a, label, span, div, h1, h2, h3, h4, p, small, strong, td, th, option, img').forEach(el => {
      captureAndTranslateAttributes(el, toEn);
    });
  };

  window.refreshSiteLanguage = function() {
    window.translateWholePage(window.currentSiteLang);
  };

  window.applyLanguageDictionary = function(lang) {
    window.currentSiteLang = lang === 'en' ? 'en' : 'ar';
    try {
      localStorage.setItem(LANG_STORAGE_KEY, window.currentSiteLang);
      sessionStorage.setItem('hf_site_lang', window.currentSiteLang);
    } catch (_) {}

    const btn = document.getElementById('lang-toggle-btn');
    if (btn) btn.textContent = window.currentSiteLang === 'en' ? 'العربية' : 'English';
    window.translateWholePage(window.currentSiteLang);
  };

  window.toggleLanguage = function() {
    window.applyLanguageDictionary(window.currentSiteLang === 'en' ? 'ar' : 'en');
  };

  let observerTimer = null;
  const observer = new MutationObserver(() => {
    if (window.currentSiteLang !== 'en') return;
    clearTimeout(observerTimer);
    observerTimer = setTimeout(() => {
      window.translateWholePage('en');
    }, 50);
  });

  document.addEventListener('DOMContentLoaded', () => {
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
    let savedLang = 'ar';
    try {
      savedLang = localStorage.getItem(LANG_STORAGE_KEY) || sessionStorage.getItem('hf_site_lang') || 'ar';
    } catch (_) {}
    if (savedLang === 'en') {
      window.applyLanguageDictionary('en');
    }
  });
})();
