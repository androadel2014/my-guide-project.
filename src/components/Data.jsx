// --- البيانات والمحتوى الكامل ---

import {
  Home,
  Sparkles,
  Map,
  Shield,
  Briefcase,
  Building,
  GraduationCap,
  CreditCard,
  Bus,
  HeartHandshake,
} from "lucide-react";

export const DATA = {
  nav: [
    {
      id: "home",
      icon: Home,
      label: { ar: "الرئيسية", en: "Home" },
      color: "bg-blue-500",
    },
    // تمت إضافة صفحة الـ CV هنا
    {
      id: "cv_builder",
      icon: Sparkles,
      label: { ar: "مُصمم الـ CV", en: "CV Builder" },
      color: "bg-purple-600",
    },
    {
      id: "start",
      icon: Map,
      label: { ar: "خارطة الطريق", en: "Roadmap" },
      color: "bg-indigo-500",
    },
    {
      id: "essentials",
      icon: Shield,
      label: { ar: "الأساسيات", en: "Essentials" },
      color: "bg-emerald-500",
    },
    {
      id: "jobs",
      icon: Briefcase,
      label: { ar: "العمل", en: "Jobs" },
      color: "bg-sky-500",
    },
    {
      id: "housing",
      icon: Building,
      label: { ar: "السكن", en: "Housing" },
      color: "bg-rose-500",
    },
    {
      id: "education",
      icon: GraduationCap,
      label: { ar: "التعليم", en: "Education" },
      color: "bg-violet-500",
    },
    {
      id: "finance",
      icon: CreditCard,
      label: { ar: "المال", en: "Finance" },
      color: "bg-amber-500",
    },
    {
      id: "transportation",
      icon: Bus,
      label: { ar: "النقل", en: "Transport" },
      color: "bg-orange-500",
    },
    {
      id: "community",
      icon: HeartHandshake,
      label: { ar: "المجتمع", en: "Community" },
      color: "bg-teal-500",
    },
  ],
  hero: {
    title: {
      ar: "بدايتك الصحيحة في أمريكا",
      en: "Your Right Start in the USA",
    },
    subtitle: {
      ar: "دليل شامل ومبسط يساعدك على فهم النظام، الاستقرار، والنجاح من اليوم الأول.",
      en: "A comprehensive and simplified guide helping you understand the system, settle, and succeed from day one.",
    },
  },
  // محتوى الأقسام التفصيلي (نفس القديم)
  sections_content: {
    start: {
      title: {
        ar: "خارطة الطريق (أول 90 يوم)",
        en: "The Roadmap (First 90 Days)",
      },
      desc: {
        ar: "خطوات مرتبة زمنياً لضمان عدم نسيان أي إجراء مهم.",
        en: "Chronological steps to ensure nothing important is missed.",
      },
      steps: [
        {
          title: "أول 24 ساعة",
          items: [
            "ختم الجواز في المطار (CBP)",
            "شراء شريحة هاتف (SIM)",
            "الوصول للسكن المؤقت",
          ],
        },
        {
          title: "الأسبوع الأول",
          items: [
            "فتح حساب بنكي",
            "التقديم على SSN",
            "استكشاف المنطقة والمواصلات",
          ],
        },
        {
          title: "الشهر الأول",
          items: [
            "البحث عن سكن دائم",
            "إصدار هوية الولاية (State ID)",
            "تجهيز السيرة الذاتية",
          ],
        },
      ],
      tips: [
        "احتفظ بنسخ من جميع أوراقك",
        "لا تحمل مبالغ نقدية كبيرة",
        "حمل تطبيقات الخرائط والترجمة",
      ],
    },
    essentials: {
      title: { ar: "الأساسيات القانونية", en: "Legal Essentials" },
      desc: {
        ar: "الوثائق والهويات التي تحتاجها للعيش والعمل بشكل قانوني.",
        en: "Documents and IDs you need to live and work legally.",
      },
      steps: [
        {
          title: "رقم الضمان الاجتماعي (SSN)",
          items: [
            "هو مفتاح العمل والائتمان",
            "التقديم مجاني في مكتب SSA",
            "يصل بالبريد خلال أسبوعين",
          ],
        },
        {
          title: "هوية الولاية (State ID)",
          items: [
            "بديل للجواز في المعاملات اليومية",
            "تستخرج من الـ DMV",
            "تحتاج إثبات سكن (فواتير/عقد)",
          ],
        },
        {
          title: "نظام الضرائب (IRS)",
          items: [
            "يجب تقديم إقرار ضريبي سنوياً",
            "التهرب الضريبي جريمة فيدرالية",
            "احتفظ بفواتيرك المهمة",
          ],
        },
      ],
      tips: ["لا تشارك رقم SSN إلا مع الجهات الرسمية والبنوك فقط"],
    },
    jobs: {
      title: { ar: "العمل والوظائف", en: "Work & Jobs" },
      desc: {
        ar: "كيف تجد عملاً، تفهم حقوقك، وتبني مستقبلك المهني.",
        en: "How to find work, understand your rights, and build your career.",
      },
      steps: [
        {
          title: "تجهيز نفسك",
          items: [
            "سيرة ذاتية (Resume) بنمط أمريكي",
            "حساب LinkedIn محدث",
            "معرفة وضعك القانوني للعمل",
          ],
        },
        {
          title: "البحث عن عمل",
          items: [
            "مواقع Indeed و Monster",
            "مجموعات التوظيف المحلية",
            "العلاقات الشخصية (Networking)",
          ],
        },
        {
          title: "أنواع العقود",
          items: [
            "W2 (موظف دائم بخصم ضرائب)",
            "1099 (عمل حر/مستقل)",
            "Cash (غير رسمي وغالباً غير قانوني)",
          ],
        },
      ],
      tips: [
        "لا تدفع مالاً أبداً للحصول على وظيفة",
        "اعرف الحد الأدنى للأجور في ولايتك",
      ],
    },
    housing: {
      title: { ar: "السكن والإيجار", en: "Housing & Rent" },
      desc: {
        ar: "دليل استئجار شقة، فهم العقود، وتجنب الاحتيال.",
        en: "Guide to renting, understanding leases, and avoiding scams.",
      },
      steps: [
        {
          title: "المصطلحات المهمة",
          items: [
            "Lease (عقد الإيجار)",
            "Deposit (مبلغ التأمين)",
            "Utilities (المرافق: كهرباء/ماء)",
          ],
        },
        {
          title: "المستندات المطلوبة",
          items: [
            "إثبات دخل (راتب/حساب بنكي)",
            "تحقق ائتماني (Credit Check)",
            "هوية سارية",
          ],
        },
        {
          title: "تحذيرات الاحتيال",
          items: [
            "لا ترسل مالاً قبل رؤية الشقة",
            "تأكد من هوية المالك",
            "اقرأ العقد جيداً قبل التوقيع",
          ],
        },
      ],
      tips: [
        "صور الشقة فيديو قبل السكن لتوثيق حالتها",
        "تأكد من شمولية الفواتير في الإيجار",
      ],
    },
    education: {
      title: { ar: "التعليم واللغة", en: "Education & Language" },
      desc: {
        ar: "تطوير اللغة الإنجليزية، معادلة الشهادات، والمدارس.",
        en: "Improving English, degree equivalency, and schools.",
      },
      steps: [
        {
          title: "تعلم الإنجليزية",
          items: [
            "مكتبات عامة (فصول مجانية)",
            "كليات المجتمع (Community College)",
            "تطبيقات (Duolingo/Cambly)",
          ],
        },
        {
          title: "التعليم الجامعي",
          items: [
            "معادلة الشهادة (WES)",
            "المنح الدراسية (FAFSA)",
            "القروض الطلابية",
          ],
        },
        {
          title: "مدارس الأطفال",
          items: [
            "التسجيل حسب المنطقة السكنية",
            "توفير كارت التطعيمات",
            "باصات المدارس المجانية",
          ],
        },
      ],
      tips: [
        "اللغة هي مفتاح الفرص الأكبر",
        "استفد من المكتبات العامة فهي كنز مجاني",
      ],
    },
    finance: {
      title: { ar: "المال والائتمان", en: "Finance & Credit" },
      desc: {
        ar: "كيف يعمل النظام البنكي وبناء السجل الائتماني (Credit Score).",
        en: "Banking system and building Credit Score.",
      },
      steps: [
        {
          title: "الحساب البنكي",
          items: [
            "Checking (جاري للمصروفات)",
            "Savings (توفير)",
            "تطبيقات التحويل (Zelle/Venmo)",
          ],
        },
        {
          title: "بناء الكريدت",
          items: [
            "استخرج Secured Credit Card",
            "استخدم 30% فقط من الحد",
            "ادفع الفاتورة كاملة وفي وقتها",
          ],
        },
        {
          title: "الميزانية",
          items: ["قاعدة 50/30/20", "صندوق الطوارئ", "تجنب الديون الاستهلاكية"],
        },
      ],
      tips: [
        "الكريدت سكور يؤثر على إيجارك، سيارتك، وتأمينك",
        "لا تفتح حسابات بنكية كثيرة بلا داع",
      ],
    },
    transportation: {
      title: { ar: "المواصلات والقيادة", en: "Transport & Driving" },
      desc: {
        ar: "شراء السيارات، استخراج الرخصة، والمواصلات العامة.",
        en: "Buying cars, getting license, and public transit.",
      },
      steps: [
        {
          title: "رخصة القيادة",
          items: [
            "اختبار نظري (كمبيوتر)",
            "اختبار عملي (قيادة)",
            "تختلف القوانين قليلاً بين الولايات",
          ],
        },
        {
          title: "شراء سيارة",
          items: [
            "شراء من مالك (أرخص)",
            "شراء من معرض (أضمن)",
            "الفحص الميكانيكي ضروري",
          ],
        },
        {
          title: "التأمين",
          items: [
            "إجباري في معظم الولايات",
            "يتأثر بسجلك وعمرك",
            "قارن الأسعار (Geico/Progressive)",
          ],
        },
      ],
      tips: [
        "القيادة بدون تأمين مخاطرة هائلة",
        "احذر من السيارات الغارقة (Salvage Title)",
      ],
    },
    community: {
      title: { ar: "المجتمع والحياة", en: "Community & Life" },
      desc: {
        ar: "التواصل مع الجالية، الأنشطة، والاندماج في المجتمع.",
        en: "Connecting with community, activities, and integration.",
      },
      steps: [
        {
          title: "التواصل",
          items: [
            "مجموعات الفيسبوك المحلية",
            "المساجد والكنائس والمراكز",
            "التطوع في المنظمات",
          ],
        },
        {
          title: "التسوق",
          items: [
            "Walmart/Target (عام)",
            "Costco (جملة)",
            "متاجر عربية (حلال)",
          ],
        },
        {
          title: "الطوارئ",
          items: [
            "911 (شرطة/إسعاف/مطافئ)",
            "311 (خدمات بلدية)",
            "211 (خدمات اجتماعية)",
          ],
        },
      ],
      tips: [
        "كوّن صداقات متنوعة لتندمج أسرع",
        "احترم القوانين والعادات المحلية",
      ],
    },
  },
};
