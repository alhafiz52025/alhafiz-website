// i18n.js - نظام تعريب شامل ومستمر لكامل الموقع والاستمارات والنماذج
(function() {
  const ORIGINAL_TEXT_MAP = new WeakMap();
  const ORIGINAL_ATTR_MAP = new WeakMap();
  const LANG_STORAGE_KEY = 'hf_site_lang_v1';

  window.FULL_DICTIONARY = {
    // عنوان الصفحة وشريط الوصول والهوية
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

    // أزرار التنقل العلوية
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

    // الصفحة الرئيسية والأثر الميداني وحسابات التبرع
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

    // من نحن والرؤية والرسالة والقيم والمحاور والحوكمة والنطاق والهيكل
    "مؤسسة الحافظ للتنمية والخدمات مؤسسة أهلية غير ربحية تعمل تحت إشراف وزارة التضامن الاجتماعي لخدمة الأسر الأولى بالرعاية بمركز إهناسيا وبني سويف.": "Al-Hafiz Foundation for Development & Services is a non-profit civil society foundation operating under the supervision of the Ministry of Social Solidarity to serve underprivileged families in Ihnasia and Beni Suef.",
    "مؤسسة الحافظ للتنمية والخدمات هي مؤسسة أهلية تنموية وخيرية خاضعة لأحكام قانون تنظيم ممارسة العمل الأهلي، ومشهرة رسميًا برقم (2202) لسنة 2025. تعمل المؤسسة على الارتقاء بجودة حياة الأسر الأولى بالرعاية، من خلال الجمع بين التدخل الإغاثي العاجل لتوفير مقومات الحياة الأساسية، والتنمية المستدامة لتمكين الأفراد اقتصاديًا واجتماعيًا. تنطلق المؤسسة من قلب صعيد مصر، واضعةً محافظة بني سويف (مركز إهناسيا وضواحيها) كأولوية ونقطة ارتكاز رئيسية، مع امتداد خدماتها ومبادراتها لتشمل مختلف محافظات الجمهورية.": "Al-Hafiz Foundation for Development & Services is a developmental and charitable civil foundation governed by the Civil Work Regulation Law and officially registered under No. (2202) of 2025. The foundation works to improve the quality of life for underprivileged families by combining urgent relief interventions for basic life necessities with sustainable development for economic and social empowerment. Launching from Upper Egypt, it prioritizes Beni Suef Governorate (Ihnasia District and its surroundings) as its main hub while extending services and initiatives across Egyptian governorates.",
    "👁️ الرؤية": "👁️ Vision",
    "أن تكون المؤسسة نموذجاً رائداً في العمل التنموي يجمع بين الدقة الرقمية والعدالة الاجتماعية.": "To be a leading model in developmental work combining digital precision with social justice.",
    "أن نكون نموذجًا رائدًا وموثوقًا في العمل الخيري والتنموي المتكامل، لبناء مجتمع متكافل ينعم أفراده بحياة كريمة وبيئة آمنة، ويتحول فيه المستفيدون من دائرة الاحتياج إلى دائرة الإنتاج والاكتفاء الذاتي المستدام.": "To be a leading, trusted model in integrated charitable and developmental work, building a cohesive society where citizens enjoy a dignified life and safe environment, and beneficiaries transition from dependency to sustainable production and self-sufficiency.",
    "🎯 الرسالة": "🎯 Mission",
    "تقديم خدمات تنموية وإغاثية منضبطة للأسر المستحقة وفق بحث ميداني موثق وحوكمة شفافة.": "Delivering disciplined developmental and relief services to eligible families based on documented field research and transparent governance.",
    "تقديم رعاية إنسانية وتنموية شاملة للأسر الأولى بالرعاية على مستوى الجمهورية، مع تركيز خاص على أهالينا في محافظة بني سويف ومركز إهناسيا وضواحيها؛ وذلك عبر التدخل السريع لتوفير متطلبات الحياة الأساسية (المسكن الآمن، المياه النظيفة، الإغاثة، والكفالات)، بالتوازي مع التمكين الاقتصادي، والخدمات الصحية والتعليمية؛ من خلال منظومة عمل مؤسسية تُطبّق أعلى معايير الحوكمة، والشفافية، والاستدامة.": "Providing comprehensive humanitarian and developmental care for underprivileged families nationwide, with special focus on our communities in Beni Suef Governorate and Ihnasia District; through rapid intervention for basic life requirements (safe housing, clean water, relief, and sponsorships), alongside economic empowerment, healthcare, and education within an institutional system applying the highest standards of governance, transparency, and sustainability.",
    "قيمنا الجوهرية ومبادئ العمل": "Core Values & Working Principles",
    "الكرامة الإنسانية": "Human Dignity",
    "حفظ كرامة المستفيدين وصون خصوصيتهم في كافة مراحل البحث، والدعم، والمساعدة.": "Preserving beneficiaries' dignity and privacy across all stages of research, support, and assistance.",
    "الحوكمة الرشيدة": "Good Governance",
    "إدارة موارد المؤسسة وفق أنظمة إدارية ومالية دقيقة، تخضع للرقابة الداخلية والخارجية لضمان النزاهة والكفاءة.": "Managing foundation resources through accurate administrative and financial systems subject to internal and external oversight to ensure integrity and efficiency.",
    "الشفافية والمصداقية": "Transparency & Credibility",
    "توجيه التبرعات والمساعدات لمستحقيها الفعليين بدقة ووضوح تام، مع إتاحة تقارير دورية حول أوجه الصرف والإنجازات.": "Directing donations and aid to actual eligible recipients with full accuracy and clarity, while providing periodic reports on disbursements and achievements.",
    "الاستدامة للكل": "Sustainability for All",
    "تبني حلول تنموية طويلة الأمد تضمن استمرارية الأثر الإيجابي على الفرد والأسرة والمجتمع بأسره.": "Adopting long-term developmental solutions that ensure lasting positive impact on individuals, families, and the entire community.",
    "الاستجابة السريعة": "Rapid Response",
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

    // المنح والإنجازات والأسئلة الشائعة
    "📢 المنح والمبادرات المفتوحة والإعلانات": "📢 Open Grants, Initiatives & Announcements",
    "تابع أحدث المبادرات المفتوحة للتقديم وقدّم طلبك مباشرة.": "Follow the latest open initiatives and submit your application directly.",
    "🏆 معرض الإنجازات والأنشطة الميدانية": "🏆 Field Achievements & Activities Gallery",
    "توثيق مصور لكافة قوافل ومساعدات مؤسسة الحافظ المنفذة.": "Visual documentation of Al-Hafiz Foundation's convoys and executed aid programs.",
    "❓ الأسئلة الشائعة للمستفيدين والشركاء": "❓ Frequently Asked Questions for Beneficiaries & Partners",
    "في حال وجود أي مشكلة أو استفسار خاص بطلبك، يرجى التوجه إلى مقر المؤسسة أو الدخول إلى شاشة التظلمات السرية، وسوف نرد على حضراتكم في أقرب وقت مع تحيات مؤسسة الحافظ.": "If you have any issue or inquiry regarding your request, please visit the foundation's headquarters or submit via the confidential grievances screen, and we will respond as soon as possible. Best regards, Al-Hafiz Foundation.",

    // استمارة طلب المساعدة والاستعلام والتواصل والخصوصية والدخول
    "استمارة تسجيل وبحث حالة اجتماعية": "Social Case Registration & Research Form",
    "لا يُسمح بالانتقال إلى القسم التالي إلا بعد استكمال القسم الحالي (باستثناء قسم الأبناء عند عدم وجود أبناء)": "Moving to the next section is not allowed until the current section is completed (except the children section when there are no children)",
    "💾 حفظ مسودة": "💾 Save Draft",
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
    "إبلاغ عن حالة غير مستحقة": "Report Ineligible Case (Community Oversight)",
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

    // التذييل
    "مؤسسة أهلية تنموية مشهرة برقم 2202 لسنة 2025 بوزارة التضامن الاجتماعي.": "A civil developmental foundation registered under No. 2202 of 2025 with the Ministry of Social Solidarity.",
    "© 2026 جميع الحقوق محفوظة لمؤسسة الحافظ للتنمية والخدمات": "© 2026 All Rights Reserved - Al-Hafiz Foundation for Development & Services"
  };

  window.currentSiteLang = 'ar';

  window.t = function(arText, enText) {
    if (window.currentSiteLang === 'en') {
      return enText || window.FULL_DICTIONARY[arText] || arText;
    }
    return arText;
  };

  function captureAndTranslateTextNode(node, dict, toEn) {
    if (!node || !node.nodeValue) return;
    const raw = node.nodeValue;
    const trimmed = raw.trim();
    if (!trimmed) return;

    if (!ORIGINAL_TEXT_MAP.has(node)) {
      ORIGINAL_TEXT_MAP.set(node, raw);
    }

    if (!toEn) {
      node.nodeValue = ORIGINAL_TEXT_MAP.get(node);
      return;
    }

    if (dict[trimmed]) {
      node.nodeValue = raw.replace(trimmed, dict[trimmed]);
    }
  }

  function captureAndTranslateAttributes(el, dict, toEn) {
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
      const currentVal = (originalAttrs[a] ?? el.getAttribute(a) ?? '').trim();
      if (currentVal && dict[currentVal]) {
        el.setAttribute(a, dict[currentVal]);
      }
    });
  }

  window.translateWholePage = function(lang) {
    const targetLang = lang === 'en' ? 'en' : 'ar';
    const toEn = targetLang === 'en';
    const dict = window.FULL_DICTIONARY || {};

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
      captureAndTranslateTextNode(node, dict, toEn);
    }

    document.querySelectorAll('input, textarea, select, button, a, label, span, div, h1, h2, h3, h4, p, small, strong, td, th, option, img').forEach(el => {
      captureAndTranslateAttributes(el, dict, toEn);
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
