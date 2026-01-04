// CommunityView.jsx (FULL FILE - copy/paste)
// ✅ Marketplace / Explore unified view
// ✅ No window.confirm (uses toastConfirm)
// ✅ Backward compatible with legacy community endpoints (places/groups)
// ✅ Forward compatible with new listing types (services/jobs/housing/products)
// ✅ Unified filters + unified "Add Listing" menu

import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { toastConfirm } from "../../lib/notify";
import { createPortal } from "react-dom"; // ✅ add this import at top with other imports
import {
  classNames,
  getToken,
  authHeaders,
  tryFetchJSON,
} from "../../lib/apiHelpers";
import { CardItem } from "../community/CardItem";

import {
  Plus,
  Search,
  Globe,
  X,
  Users,
  Building2,
  RefreshCw,
  LocateFixed,
  Wrench,
  Briefcase,
  Home,
  ShoppingCart,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  "http://localhost:5000";

/* =========================
   Constants
========================= */
const PAGE_SIZE = 12; // ✅ غيّرها براحتك

const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
  "DC",
];

// legacy place categories
const PLACE_CATEGORIES = [
  "Restaurant",
  "Cafe",
  "Bakery",
  "Grocery / Arab Market",
  "Things to do",
  "Park / Outdoors",
  "Attraction",
  "Mosque",
  "Church",
  "School / Daycare",
  "Clinic / Doctor",
  "Lawyer / Immigration",
  "Car Services",
  "Handyman / Home Services",
  "Barber / Beauty",
  "Shopping / Mall",
  "Other",
];

// groups
const GROUP_PLATFORMS = [
  "Facebook",
  "WhatsApp",
  "Telegram",
  "Discord",
  "Meetup",
  "Other",
];
const GROUP_TOPICS = [
  "Immigration",
  "Jobs",
  "Housing",
  "Education",
  "Health",
  "Friends",
  "Business",
  "Other",
];

function safeTrim(v) {
  return String(v ?? "").trim();
}

function safeUrl(v) {
  const s = safeTrim(v);
  return s || "";
}

function useOutsideClick(ref, handler) {
  useEffect(() => {
    function onDown(e) {
      if (!ref?.current) return;
      if (ref.current.contains(e.target)) return;
      handler?.(e);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [ref, handler]);
}

// Marketplace extra categories (simple starter sets)
const SERVICE_CATEGORIES = [
  "Cleaning",
  "Moving",
  "Handyman",
  "Plumbing",
  "Electrical",
  "HVAC",
  "TV Mounting",
  "Car Repair",
  "Beauty",
  "Tutoring",
  "Legal",
  "Other",
];

const JOB_CATEGORIES = [
  "Restaurant",
  "Delivery",
  "Warehouse",
  "Construction",
  "Office",
  "Tech",
  "Healthcare",
  "Driver",
  "Other",
];

const HOUSING_CATEGORIES = [
  "Rent",
  "Room",
  "Sublease",
  "For Sale",
  "Looking For",
  "Other",
];

const PRODUCT_CATEGORIES = [
  "Electronics",
  "Furniture",
  "Appliances",
  "Clothing",
  "Cars/Parts",
  "Baby",
  "Kitchen",
  "Other",
];

/* =========================
   Helpers
========================= */
function parseDateLike(v) {
  if (!v) return null;
  const s = String(v).trim();
  if (!s) return null;

  // unix seconds / ms
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    if (!Number.isFinite(n)) return null;
    return new Date(n < 1e12 ? n * 1000 : n);
  }

  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function pickCreatedAt(x) {
  // try common fields (new + legacy)
  const candidates = [
    x?.createdAt,
    x?.created_at,
    x?.created,
    x?.createdDate,
    x?.created_date,
    x?.timestamp,
    x?.time,
    x?.date,
  ];

  for (const c of candidates) {
    const d = parseDateLike(c);
    if (d) return d.toISOString();
  }

  return null;
}

function isNewByDate(date, hours = 48) {
  const d = parseDateLike(date);
  if (!d) return false;
  const diffMs = Date.now() - d.getTime();
  return diffMs >= 0 && diffMs <= hours * 60 * 60 * 1000;
}

/* =========================
   Listing Types (Unified)
========================= */

const LISTING_TYPES = [
  {
    key: "all",
    label: "All",
    Icon: Globe,
    hint: "View everything",
    hideFromAdd: true,
  },
  {
    key: "places",
    label: "Places",
    Icon: Building2,
    hint: "Restaurants...",
    legacy: true,
  },
  {
    key: "groups",
    label: "Groups",
    Icon: Users,
    hint: "Social groups...",
    legacy: true,
  },
  { key: "services", label: "Services", Icon: Wrench, hint: "Handyman..." },
  { key: "jobs", label: "Jobs", Icon: Briefcase, hint: "Work opportunities" },
  { key: "housing", label: "Housing", Icon: Home, hint: "Rooms, rent..." },
  {
    key: "products",
    label: "Products",
    Icon: ShoppingCart,
    hint: "Buy & sell",
  },
];

function CardBanner({ tab, placeCategory, groupPlatform, subtitleRight }) {
  // tab is listing type key (places/groups/services/...)
  let ui = {
    label: "Listing",
    Icon: Building2,
    bg: "from-gray-50 to-gray-100 border-gray-200",
    icon: "bg-gray-700",
  };

  if (tab === "places") {
    const key = normalizePlaceCategoryKey(placeCategory);
    ui = PLACE_BANNER[key] || PLACE_BANNER.other;
  } else if (tab === "groups") {
    const key = normalizeGroupPlatformKey(groupPlatform);
    ui = GROUP_BANNER[key] || GROUP_BANNER.other;
  } else {
    ui = TYPE_BANNER[tab] || ui;
  }

  const Icon = ui.Icon;

  return (
    <div
      className={classNames(
        "w-full rounded-2xl border bg-gradient-to-r px-4 py-3 flex items-center justify-between",
        ui.bg
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={classNames(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
            ui.icon
          )}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <div className="font-extrabold text-gray-900 leading-5 truncate">
            {ui.label}
          </div>
          <div className="text-xs text-gray-600 mt-0.5 truncate">
            {tab === "places"
              ? "Curated for newcomers"
              : tab === "groups"
              ? "Join & connect with people"
              : "Marketplace for newcomers"}
          </div>
        </div>
      </div>

      {subtitleRight ? (
        <div className="hidden sm:inline-flex text-xs font-semibold text-gray-700 rounded-full bg-white/70 border border-gray-200 px-2.5 py-1">
          {subtitleRight}
        </div>
      ) : null}
    </div>
  );
}

/* =========================
   UI Components
========================= */

function Modal({ open, onClose, title, subtitle, children }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-6 py-5 border-b border-gray-100">
          <div>
            <div className="text-xl font-extrabold text-gray-900">{title}</div>
            {subtitle ? (
              <div className="mt-1 text-sm text-gray-500">{subtitle}</div>
            ) : null}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div
          className="px-6 py-5 max-h-[75vh] overflow-y-auto overscroll-contain"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

function EmptyState({ icon, title, desc }) {
  const Icon = icon;
  return (
    <div className="text-center py-14">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-700">
        <Icon size={24} />
      </div>
      <div className="mt-4 text-lg font-semibold text-gray-900">{title}</div>
      <div className="mt-1 text-gray-500">{desc}</div>
    </div>
  );
}

function Dropdown({ align = "right", trigger, children, open, setOpen }) {
  const ref = useRef(null);
  useOutsideClick(ref, () => setOpen(false));

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open ? (
        <div
          className={classNames(
            // ✅ خليها تسكّرول جوّه المنيو
            "absolute z-50 mt-2 min-w-[260px] rounded-2xl border border-gray-200 bg-white shadow-xl",
            "max-h-[70vh] overflow-y-auto overscroll-contain",
            // ✅ مهم: منيو ما تكبرش زيادة
            "scrollbar-thin",
            align === "right" ? "left-0" : "right-0"
          )}
          onWheel={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({ icon: Icon, title, desc, onClick, danger, rightEl }) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        "w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start justify-between gap-3",
        danger ? "text-red-600" : "text-gray-800"
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div
          className={classNames(
            "mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center border shrink-0",
            danger ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"
          )}
        >
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <div className="font-semibold leading-5">{title}</div>
          {desc ? (
            <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
          ) : null}
        </div>
      </div>
      {rightEl ? (
        <div className="shrink-0 text-gray-400 mt-1">{rightEl}</div>
      ) : null}
    </button>
  );
}

function SectionTitle({ title, desc }) {
  return (
    <div className="mb-2">
      <div className="text-sm font-extrabold text-gray-900">{title}</div>
      {desc ? <div className="text-xs text-gray-500 mt-0.5">{desc}</div> : null}
    </div>
  );
}

/* =========================
   Page (Unified Marketplace)
========================= */

export default function CommunityView() {
  const navigate = useNavigate();

  // active listing type (tab)
  const [tab, setTab] = useState("all"); // places | groups | services | jobs | housing | products

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  // ✅ Pagination
  const [page, setPage] = useState(1);

  const [isLoggedIn, setIsLoggedIn] = useState(!!getToken());
  useEffect(() => {
    const onStorage = () => setIsLoggedIn(!!getToken());
    window.addEventListener("storage", onStorage);
    const t = setInterval(() => setIsLoggedIn(!!getToken()), 900);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(t);
    };
  }, []);

  // unified filters
  const [q, setQ] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");

  // legacy / specialized filters
  const [category, setCategory] = useState(""); // places/services/jobs/housing/products category
  const [platform, setPlatform] = useState(""); // groups
  const [topic, setTopic] = useState(""); // groups

  // ✅ Add Listing Center (Modal)
  const [addPickerOpen, setAddPickerOpen] = useState(false);
  const [addPickerType, setAddPickerType] = useState("places"); // places|groups|services|jobs|housing|products

  const endpoints = useMemo(() => {
    // ✅ ALL = load from multiple sources and merge
    if (tab === "all") {
      return {
        // ✅ legacy only
        places: [`${API_BASE}/api/community/places`],
        groups: [`${API_BASE}/api/community/groups`],

        // ✅ unified marketplace endpoint ONLY (no /api/marketplace/services, /jobs, etc)
        services: [`${API_BASE}/api/marketplace/listings?type=services`],
        jobs: [`${API_BASE}/api/marketplace/listings?type=jobs`],
        housing: [`${API_BASE}/api/marketplace/listings?type=housing`],
        products: [`${API_BASE}/api/marketplace/listings?type=products`],
      };
    }

    // ✅ single tab
    if (tab === "places") return [`${API_BASE}/api/community/places`];
    if (tab === "groups") return [`${API_BASE}/api/community/groups`];

    // ✅ unified marketplace endpoint ONLY
    return [`${API_BASE}/api/marketplace/listings?type=${tab}`];
  }, [tab]);

  /* =========================
     ✅ Unified Form (ONE add/edit modal)
  ========================= */

  const EMPTY_VALUES = {
    // shared
    title: "",
    category: "",
    state: "",
    city: "",
    notes: "",
    // places
    address: "",
    phone: "",
    website: "",
    // groups
    platform: "Facebook",
    topic: "Immigration",
    link: "",
    // marketplace
    price: "",
    contact: "",
    description: "",
  };

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("add"); // "add" | "edit"
  const [formType, setFormType] = useState("places"); // places|groups|services|jobs|housing|products
  const [formId, setFormId] = useState(null);
  const [values, setValues] = useState({ ...EMPTY_VALUES });

  function setField(k, v) {
    setValues((p) => ({ ...p, [k]: v }));
  }

  function getSchema(t) {
    // fields to show per type
    if (t === "places") {
      return [
        { k: "title", label: "Name *", type: "text", ph: "e.g. Kabul Kabob" },
        {
          k: "category",
          label: "Category",
          type: "select",
          options: PLACE_CATEGORIES,
        },
        {
          k: "state",
          label: "State",
          type: "select",
          options: ["", ...US_STATES],
        },
        {
          k: "city",
          label: "City",
          type: "text",
          ph: "e.g. Fairfax",
          list: "form-city-suggestions",
        },
        { k: "phone", label: "Phone", type: "text", ph: "+1 703..." },
        {
          k: "address",
          label: "Address",
          type: "text",
          ph: "Full address",
          span2: true,
        },
        {
          k: "website",
          label: "Website",
          type: "text",
          ph: "https://",
          span2: true,
        },
        {
          k: "notes",
          label: "Notes",
          type: "textarea",
          ph: "What’s special about this place?",
          span2: true,
        },
      ];
    }

    if (t === "groups") {
      return [
        {
          k: "title",
          label: "Group Name *",
          type: "text",
          ph: "e.g. Arabs in Virginia",
          span2: true,
        },
        {
          k: "platform",
          label: "Platform",
          type: "select",
          options: GROUP_PLATFORMS,
        },
        { k: "topic", label: "Topic", type: "select", options: GROUP_TOPICS },
        {
          k: "state",
          label: "State",
          type: "select",
          options: ["", ...US_STATES],
        },
        {
          k: "city",
          label: "City",
          type: "text",
          ph: "e.g. Alexandria",
          list: "form-city-suggestions",
        },
        {
          k: "link",
          label: "Link *",
          type: "text",
          ph: "Facebook/WhatsApp invite link",
          span2: true,
        },
        {
          k: "notes",
          label: "Notes",
          type: "textarea",
          ph: "Rules, who it’s for, etc.",
          span2: true,
        },
      ];
    }

    // services/jobs/housing/products
    return [
      {
        k: "title",
        label: "Title *",
        type: "text",
        ph: "Title...",
        span2: true,
      },
      {
        k: "category",
        label: "Category",
        type: "select",
        options: getCategoryOptionsForTab(t),
      },
      {
        k: "price",
        label: "Price / Budget",
        type: "text",
        ph: t === "jobs" ? "$18/hr" : "$500",
      },
      {
        k: "state",
        label: "State",
        type: "select",
        options: ["", ...US_STATES],
      },
      {
        k: "city",
        label: "City",
        type: "text",
        ph: "e.g. Arlington",
        list: "form-city-suggestions",
      },
      {
        k: "link",
        label: "Link",
        type: "text",
        ph: "Optional: website / post / form",
        span2: true,
      },
      {
        k: "contact",
        label: "Contact",
        type: "text",
        ph: "Optional: phone / email",
        span2: true,
      },
      {
        k: "description",
        label: "Description",
        type: "textarea",
        ph: "Explain details for newcomers…",
        span2: true,
      },
    ];
  }

  function openFormAdd(typeKey, preset) {
    if (!requireLoginOrToast()) return;
    setFormMode("add");
    setFormType(typeKey);
    setFormId(null);

    const next = { ...EMPTY_VALUES };

    // defaults/presets
    if (typeKey === "places") next.category = preset || "Restaurant";
    if (typeKey === "groups") next.platform = preset || "Facebook";
    if (["services", "jobs", "housing", "products"].includes(typeKey))
      next.category = preset || "";

    setValues(next);
    setFormOpen(true);
  }
  function openFormEdit(item, typeKey) {
    if (!requireLoginOrToast()) return;

    const t = typeKey || tab;
    const idNum = normalizeId(item.id, t);
    const prefix =
      t === "places"
        ? "place"
        : t === "groups"
        ? "group"
        : t === "services"
        ? "service"
        : t === "products"
        ? "product"
        : t === "jobs"
        ? "jobs"
        : t === "housing"
        ? "housing"
        : "";

    const idPrefixed = prefix ? `${prefix}_${idNum}` : idNum;

    setFormMode("edit");
    setFormType(t);
    setFormId(idPrefixed);

    const next = { ...EMPTY_VALUES };

    if (t === "places") {
      next.title = item.name || "";
      next.category = item.category || "Restaurant";
      next.state = item.state || "";
      next.city = item.city || "";
      next.address = item.address || "";
      next.phone = item.phone || "";
      next.website = item.website || "";
      next.notes = item.notes || "";
    } else if (t === "groups") {
      next.title = item.name || "";
      next.platform = item.platform || "Facebook";
      next.topic = item.topic || "Immigration";
      next.state = item.state || "";
      next.city = item.city || "";
      next.link = item.link || "";
      next.notes = item.notes || "";
    } else {
      next.title = item.title || item.name || "";
      next.category = item.category || "";
      next.state = item.state || "";
      next.city = item.city || "";

      // ✅ price mapping (supports old + new DB fields)
      const pv =
        item?.price_value ??
        item?.priceValue ??
        item?.price ??
        item?.budget ??
        item?.amount ??
        "";
      next.price = pv === null || pv === undefined ? "" : String(pv);

      next.link = item.link || item.url || item.website || "";
      next.contact = item.contact || item.phone || "";
      next.description = item.description || item.notes || "";
    }

    setValues(next);
    setFormOpen(true);
  }

  function normalizeId(raw, typeKey) {
    const v = String(raw || "").trim();
    if (!v) return v;

    // ✅ لو جاي بصيغة: product_7 / housing_10 / services_3 ... → خليه "7"
    if (v.includes("_")) {
      const last = v.split("_").pop();
      if (last && /^\d+$/.test(last)) return last;
      // fallback: لو آخر جزء مش رقم، رجّع آخر جزء برضو
      return last || v;
    }

    // ✅ لو رقم أصلاً
    if (/^\d+$/.test(v)) return v;

    // ✅ لو فيه رقم جوّه أي سترنج: "id:10" → "10"
    const m = v.match(/(\d+)/);
    return m ? m[1] : v;
  }

  async function submitForm() {
    try {
      if (!requireLoginOrToast()) return;

      // validate
      if (!values.title.trim()) return toast.error("Title is required");
      const type = formType;

      if (type === "groups" && !String(values.link || "").trim())
        return toast.error("Link is required");

      const isEdit = formMode === "edit" && !!formId;

      // =========================
      // ✅ Payload per type (SMALL + COMPATIBLE)
      // =========================

      const title = safeTrim(values.title);
      const cityV = safeTrim(values.city);
      const stateV = safeTrim(values.state);

      let url = "";
      let method = isEdit ? "PATCH" : "POST";
      let body = null;

      if (type === "places") {
        const placeId = isEdit ? normalizeId(formId, type) : null;

        url = isEdit
          ? `${API_BASE}/api/community/places/${placeId}`
          : `${API_BASE}/api/community/places`;

        body = {
          name: title,
          category: safeTrim(values.category) || "Restaurant",
          state: stateV,
          city: cityV,
          address: safeTrim(values.address),
          phone: safeTrim(values.phone),
          website: safeUrl(values.website),
          notes: safeTrim(values.notes),
        };
      } else if (type === "groups") {
        const groupId = isEdit ? normalizeId(formId, type) : null;

        url = isEdit
          ? `${API_BASE}/api/community/groups/${groupId}`
          : `${API_BASE}/api/community/groups`;

        body = {
          name: title,
          platform: safeTrim(values.platform) || "Facebook",
          topic: safeTrim(values.topic) || "Immigration",
          state: stateV,
          city: cityV,
          link: safeUrl(values.link),
          notes: safeTrim(values.notes),
        };
      } else {
        // marketplace: services/jobs/housing/products
        url = isEdit
          ? `${API_BASE}/api/listings/${formId}` // ✅ prefixed id
          : `${API_BASE}/api/listings`; // ✅ unified create

        body = {
          type,
          title,
          category: safeTrim(values.category),
          state: stateV,
          city: cityV,

          // ✅ send both (new + backward compatible)
          price_value: safeTrim(values.price),
          price: safeTrim(values.price),

          contact: safeTrim(values.contact),
          website: safeUrl(values.link),
          notes: safeTrim(values.description) || safeTrim(values.notes),
        };
      }

      const out = await tryFetchJSON(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body),
      });

      if (!out.ok) return toast.error(isEdit ? "Update failed" : "Add failed");

      toast.success(isEdit ? "Updated" : "Added");
      setFormOpen(false);

      if (tab !== type) setTab(type);
      setTimeout(load, 150);
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong");
    }
  }

  function resetFilters() {
    setQ("");
    setState("");
    setCity("");
    setCategory("");
    setPlatform("");
    setTopic("");
  }

  function requireLoginOrToast() {
    const ok = !!getToken();
    if (!ok) toast.error("Login required");
    return ok;
  }

  function getCategoryOptionsForTab(t) {
    if (t === "places") return PLACE_CATEGORIES;
    if (t === "services") return SERVICE_CATEGORIES;
    if (t === "jobs") return JOB_CATEGORIES;
    if (t === "housing") return HOUSING_CATEGORIES;
    if (t === "products") return PRODUCT_CATEGORIES;
    return [];
  }

  /* =========================
     Endpoints strategy (fallbacks)
     - places/groups use legacy endpoints first
     - others try a few common patterns (you can wire backend later)
  ========================= */

  async function load() {
    setPage(1);

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (state && state !== "any" && state !== "Any")
        params.set("state", state);
      if (city.trim()) params.set("city", city.trim());

      if (tab === "groups") {
        if (platform && platform !== "all" && platform !== "All")
          params.set("platform", platform);
        if (topic && topic !== "all" && topic !== "All")
          params.set("topic", topic);
      } else {
        // ✅ في All هنفلتر بعد الدمج (مش نبعته للباك لكل التايبس)
        if (tab !== "all") {
          if (category && category !== "all" && category !== "All")
            params.set("category", category);
        }
      }

      // ✅ ALL: fetch multiple types and merge
      if (tab === "all") {
        const bundles = endpoints; // object
        const types = Object.keys(bundles);
        const results = await Promise.all(
          types.map(async (typeKey) => {
            const bases = bundles[typeKey] || [];
            const qs = params.toString();
            const urls = bases.map((base) => {
              if (!qs) return base;
              const joiner = base.includes("?") ? "&" : "?";
              return `${base}${joiner}${qs}`;
            });

            const out = await tryFetchJSON(urls, {
              method: "GET",
              headers: { ...authHeaders() },
            });

            const arr = out.ok ? extractArray(out.data) : [];

            const legacyPrefix =
              typeKey === "places"
                ? "place"
                : typeKey === "groups"
                ? "group"
                : typeKey;

            return arr.map((x) => {
              const createdAt = pickCreatedAt(x);

              const rawId =
                x?.id ??
                x?.place_id ??
                x?.group_id ??
                x?.listing_id ??
                x?.item_id;

              const baseId = normalizeId(rawId, typeKey);

              const mergedId =
                typeKey === "places" || typeKey === "groups"
                  ? `${legacyPrefix}_${baseId}`
                  : String(x?.id || "").includes("_")
                  ? x.id
                  : `${typeKey}_${baseId}`;

              return {
                ...x,
                id: mergedId,
                type: typeKey,
                createdAt: x.createdAt ?? createdAt,
                created_at: x.created_at ?? createdAt,
              };
            });
          })
        );

        const merged = results.flat();

        // ✅ All: فلتر Category locally (عشان كل type كاتيجوريز مختلفة)
        const filtered =
          category && category !== "all" && category !== "All"
            ? merged.filter((x) => {
                const c = String(x?.category || "").trim();
                return c && c.toLowerCase() === String(category).toLowerCase();
              })
            : merged;

        setItems(filtered);
        // DEBUG: detect id collisions across types
        const map = new Map();
        for (const x of filtered) {
          const key = String(x.id);
          const t = x.type || "unknown";
          if (!map.has(key)) map.set(key, new Set());
          map.get(key).add(t);
        }
        const collisions = [];
        for (const [id, types] of map.entries()) {
          if (types.size > 1)
            collisions.push({ id, types: Array.from(types).join(", ") });
        }
        if (collisions.length) {
          //   console.warn("ID collisions across types:", collisions);
        } else {
          //   console.log("No ID collisions across types ✅");
        }

        return;
      }

      // ✅ Single tab
      const qs = params.toString();
      const urls = endpoints.map((base) => {
        if (!qs) return base;
        const joiner = base.includes("?") ? "&" : "?";
        return `${base}${joiner}${qs}`;
      });

      const out = await tryFetchJSON(urls, {
        method: "GET",
        headers: { ...authHeaders() },
      });
      if (!out.ok) throw out.error;

      const arr = extractArray(out.data);
      setItems(
        arr.map((x) => {
          const createdAt = pickCreatedAt(x);
          return {
            ...x,
            createdAt: x.createdAt ?? createdAt,
            created_at: x.created_at ?? createdAt,
          };
        })
      );
    } catch (e) {
    //   console.log(e);
      console.error(e);
      toast.error("Failed to load listings");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setItems([]);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ✅ لو الفلاتر اتغيرت وإنت على All → اعمل load تلقائي
  useEffect(() => {
    if (tab !== "all") return;
    const t = setTimeout(() => load(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, q, state, city, category, platform, topic]);

  // city suggestions (from items)
  const citySuggestions = useMemo(() => {
    const s = new Set();
    for (const it of items) {
      if (!it) continue;
      const st = String(it.state || "")
        .trim()
        .toUpperCase();
      const c = String(it.city || "").trim();
      if (!c) continue;

      const selectedState = state || "";
      if (selectedState) {
        if (st === String(selectedState).toUpperCase()) s.add(c);
      } else {
        s.add(c);
      }
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [items, state]);

  // datalist for forms
  const formCitySuggestions = useMemo(() => {
    const s = new Set();
    const selectedState = values.state || "";

    for (const it of items) {
      if (!it) continue;
      const st = String(it.state || "")
        .trim()
        .toUpperCase();
      const c = String(it.city || "").trim();
      if (!c) continue;

      if (!selectedState) s.add(c);
      else if (st === String(selectedState).toUpperCase()) s.add(c);
    }

    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [items, values.state]);

  function extractCreatedItem(data) {
    if (!data) return null;
    return (
      data.item || data.listing || data.place || data.group || data.data || null
    );
  }
  function extractArray(data) {
    if (Array.isArray(data)) return data;

    // common wrappers
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.rows)) return data.rows;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.data)) return data.data;

    return [];
  }

  async function removeItem(id, typeKey) {
    try {
      if (!requireLoginOrToast()) return;

      const ok = await toastConfirm(
        "Delete this listing?",
        "This action cannot be undone."
      );
      if (!ok) return;

      const t = typeKey || tab;
      let url = "";

      if (t === "places") {
        url = `${API_BASE}/api/community/places/${id}`;
      } else if (t === "groups") {
        url = `${API_BASE}/api/community/groups/${id}`;
      } else {
        // لو id جاي رقم (في All) حوّله لــ prefixed قبل الحذف
        const prefixed = String(id).includes("_")
          ? id
          : `${t}_${normalizeId(id, t)}`;

        url = `${API_BASE}/api/listings/${prefixed}`;
      }

      const out = await tryFetchJSON(url, {
        method: "DELETE",
        headers: { ...authHeaders() },
      });

      if (!out.ok) return toast.error("Delete failed");

      toast.success("Deleted");
      load();
    } catch (e) {
      console.error(e);
      toast.error("Delete failed");
    }
  }

  // near me (simple)
  async function nearMe() {
    try {
      if (!navigator.geolocation)
        return toast.error("Geolocation not supported");
      toast.loading("Getting your location…", { id: "geo" });

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords || {};
          toast.success(
            "Location detected. (Tip: pick your State, then Apply)",
            { id: "geo" }
          );
          setQ((prev) => prev || "nearby");
          setCity(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        },
        (err) => {
          console.error(err);
          toast.error("Location permission denied", { id: "geo" });
        },
        { enableHighAccuracy: false, timeout: 9000 }
      );
    } catch (e) {
      console.error(e);
      toast.error("Failed to get location", { id: "geo" });
    }
  }
  // ✅ Pagination derived
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pageSafe = Math.min(Math.max(1, page), totalPages);

  const pagedItems = useMemo(() => {
    const start = (pageSafe - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, pageSafe]);

  useEffect(() => {
    if (page !== pageSafe) setPage(pageSafe);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSafe]);

  const activeTypeMeta =
    LISTING_TYPES.find((t) => t.key === tab) || LISTING_TYPES[0];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-100 -mx-4 px-4 py-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-extrabold text-gray-900">Explore</h1>
          <p className="mt-1 text-gray-600">
            Marketplace for newcomers: places, groups, services, jobs, housing,
            products.
          </p>

          <div className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
            <span className="text-xs font-semibold text-gray-600">Tip:</span>
            <span className="text-xs text-gray-600">
              Use <span className="font-semibold">State</span> +{" "}
              <span className="font-semibold">City</span> for fast search.
            </span>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={load}
            className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-800 inline-flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            onClick={nearMe}
            className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-800 inline-flex items-center gap-2"
            title="Near me (fills city with coordinates)"
          >
            <LocateFixed size={16} />
            Near me
          </button>
          {isLoggedIn ? (
            <>
              <button
                onClick={() => {
                  setAddPickerType("places");
                  setAddPickerOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-black text-white hover:bg-black/90 inline-flex items-center gap-2"
              >
                <Plus size={18} />
                Add Listing
              </button>

              {/* ✅ Add Listing Center Modal */}
              <Modal
                open={addPickerOpen}
                onClose={() => setAddPickerOpen(false)}
                title="Add Listing"
                subtitle="Choose a type, then pick a preset (optional)."
              >
                {/* Types */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {LISTING_TYPES.filter((t) => !t.hideFromAdd).map((t) => {
                    const Active = addPickerType === t.key;
                    const Icon = t.Icon;
                    return (
                      <button
                        key={t.key}
                        onClick={() => setAddPickerType(t.key)}
                        className={classNames(
                          "rounded-2xl border p-4 text-left hover:bg-gray-50 transition",
                          Active
                            ? "border-black ring-2 ring-black/10"
                            : "border-gray-200"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={classNames(
                              "w-10 h-10 rounded-xl flex items-center justify-center border",
                              Active
                                ? "bg-black text-white border-black"
                                : "bg-gray-50 text-gray-800 border-gray-200"
                            )}
                          >
                            <Icon size={18} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-gray-900">
                              {t.label}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {t.hint}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Presets */}
                <div className="mt-5 rounded-2xl border border-gray-200 bg-white">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="text-sm font-extrabold text-gray-900">
                      Presets
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Pick one, or choose “Custom”.
                    </div>
                  </div>

                  <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {addPickerType === "places" ? (
                      <>
                        {[
                          "Restaurant",
                          "Mosque",
                          "Church",
                          "Clinic / Doctor",
                          "School / Daycare",
                          "Grocery / Arab Market",
                          "Things to do",
                          "Park / Outdoors",
                          "Car Services",
                          "Handyman / Home Services",
                        ].map((preset) => (
                          <button
                            key={preset}
                            onClick={() => {
                              setAddPickerOpen(false);
                              openFormAdd("places", preset);
                            }}
                            className="px-3 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-left font-semibold"
                          >
                            {preset}
                          </button>
                        ))}
                      </>
                    ) : addPickerType === "groups" ? (
                      <>
                        {[
                          "Facebook",
                          "WhatsApp",
                          "Telegram",
                          "Discord",
                          "Meetup",
                        ].map((preset) => (
                          <button
                            key={preset}
                            onClick={() => {
                              setAddPickerOpen(false);
                              openFormAdd("groups", preset);
                            }}
                            className="px-3 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-left font-semibold"
                          >
                            {preset}
                          </button>
                        ))}
                      </>
                    ) : (
                      <>
                        {getCategoryOptionsForTab(addPickerType)
                          .slice(0, 10)
                          .map((preset) => (
                            <button
                              key={preset}
                              onClick={() => {
                                setAddPickerOpen(false);
                                openFormAdd(addPickerType, preset);
                              }}
                              className="px-3 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-left font-semibold"
                            >
                              {preset}
                            </button>
                          ))}
                      </>
                    )}
                  </div>

                  <div className="px-3 pb-3">
                    <button
                      onClick={() => {
                        setAddPickerOpen(false);
                        openFormAdd(addPickerType);
                      }}
                      className="w-full px-4 py-3 rounded-xl bg-black text-white hover:bg-black/90 font-extrabold"
                    >
                      Custom{" "}
                      {addPickerType.slice(0, 1).toUpperCase() +
                        addPickerType.slice(1)}
                    </button>
                  </div>
                </div>
              </Modal>
            </>
          ) : null}
        </div>
      </div>

      {/* Listing Type pills */}
      <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-sm font-extrabold text-gray-900">
            Listing Type
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {activeTypeMeta.hint}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* ✅ هنا لا نستخدم فلتر، نريد عرض كل التابات بما فيها All */}
          {LISTING_TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                resetFilters();
                setPage(1);
              }}
              className={classNames(
                "px-4 py-2 rounded-full border text-sm font-semibold",
                tab === t.key
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-4">
            <label className="text-sm font-medium text-gray-700">Search</label>
            <div className="mt-1 relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={
                  tab === "places"
                    ? "e.g. kebab, mosque, church..."
                    : tab === "groups"
                    ? "e.g. arab, jobs, immigration..."
                    : "e.g. handyman, room, iPhone..."
                }
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700">State</label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="mt-1 w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
            >
              <option value="">Any</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700">City</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Fairfax"
              list="city-suggestions"
              className="mt-1 w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
            />
            <datalist id="city-suggestions">
              {citySuggestions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          {/* Category/Platform */}
          {tab === "groups" ? (
            <>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  Platform
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="mt-1 w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
                >
                  <option value="">All</option>
                  {GROUP_PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  Topic
                </label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="mt-1 w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
                >
                  <option value="">All</option>
                  {GROUP_TOPICS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="md:col-span-4">
                <label className="text-sm font-medium text-gray-700">
                  Category
                </label>

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
                >
                  <option value="">All</option>

                  {/* ✅ All: اعرض كل الكاتيجوريز (Places + Services + Jobs + Housing + Products) */}
                  {tab === "all"
                    ? Array.from(
                        new Set([
                          ...PLACE_CATEGORIES,
                          ...SERVICE_CATEGORIES,
                          ...JOB_CATEGORIES,
                          ...HOUSING_CATEGORIES,
                          ...PRODUCT_CATEGORIES,
                        ])
                      ).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))
                    : getCategoryOptionsForTab(tab).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                </select>

                {tab === "all" ? (
                  <div className="mt-1 text-xs text-gray-500">
                    Tip: In All, Category is a broad filter across all types.
                  </div>
                ) : null}
              </div>
            </>
          )}

          <div className="md:col-span-2 flex gap-2">
            <button
              onClick={load}
              className="w-full px-4 py-2.5 rounded-xl bg-black text-white font-semibold hover:bg-black/90"
            >
              Apply
            </button>
            <button
              onClick={() => {
                resetFilters();
                setTimeout(load, 0);
              }}
              className="px-3 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-800"
              title="Reset"
              aria-label="Reset"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="mt-4">
        {loading ? (
          <div className="py-10 text-center text-gray-500">Loading…</div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={activeTypeMeta.Icon}
            title="No items yet"
            desc="Be the first to add a helpful listing."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {pagedItems.map((it) => (
              <CardItem
                key={`${it.type || tab}-${it.id}`}
                tab={tab}
                it={it}
                isLoggedIn={isLoggedIn}
                onEdit={() => {
                  const t = tab === "all" ? it.type || "places" : tab;
                  openFormEdit({ ...it, id: normalizeId(it.id, t) }, t);
                }}
                onDelete={() => {
                  const t = tab === "all" ? it.type || "places" : tab;
                  removeItem(normalizeId(it.id, t), t);
                }}
                onOpen={() => {
                  const t = tab === "all" ? it.type || "places" : tab;
                  const id = normalizeId(it.id, t);

                  // ✅ survive refresh
                  sessionStorage.setItem(`mp:type:${t}:${id}`, t);
                  return navigate(`/marketplace/item/${id}`, {
                    state: { type: t },
                  });
                }}
              />
            ))}
          </div>
        )}
      </div>
      {/* Pagination */}
      {items.length > 0 ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-gray-600">
            Page <span className="font-semibold">{pageSafe}</span> of{" "}
            <span className="font-semibold">{totalPages}</span> —{" "}
            <span className="font-semibold">{items.length}</span> items
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(1)}
              disabled={pageSafe === 1}
              className={classNames(
                "px-3 py-2 rounded-xl border text-sm font-semibold",
                pageSafe === 1
                  ? "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
                  : "border-gray-200 text-gray-800 hover:bg-gray-50"
              )}
            >
              First
            </button>

            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pageSafe === 1}
              className={classNames(
                "px-3 py-2 rounded-xl border text-sm font-semibold",
                pageSafe === 1
                  ? "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
                  : "border-gray-200 text-gray-800 hover:bg-gray-50"
              )}
            >
              Prev
            </button>
            {/* Page numbers */}
            {(() => {
              const MAX = 5; // ✅ عدد أزرار الصفحات اللي هتظهر
              const half = Math.floor(MAX / 2);

              let start = Math.max(1, pageSafe - half);
              let end = Math.min(totalPages, start + MAX - 1);
              start = Math.max(1, end - MAX + 1);

              const pages = [];
              for (let i = start; i <= end; i++) pages.push(i);

              return (
                <div className="flex items-center gap-1">
                  {start > 1 ? (
                    <>
                      <button
                        onClick={() => setPage(1)}
                        className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-semibold text-gray-800"
                      >
                        1
                      </button>
                      {start > 2 ? (
                        <span className="px-2 text-gray-500 select-none">
                          …
                        </span>
                      ) : null}
                    </>
                  ) : null}

                  {pages.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={classNames(
                        "px-3 py-2 rounded-xl border text-sm font-semibold",
                        p === pageSafe
                          ? "bg-black text-white border-black"
                          : "border-gray-200 text-gray-800 hover:bg-gray-50"
                      )}
                    >
                      {p}
                    </button>
                  ))}

                  {end < totalPages ? (
                    <>
                      {end < totalPages - 1 ? (
                        <span className="px-2 text-gray-500 select-none">
                          …
                        </span>
                      ) : null}
                      <button
                        onClick={() => setPage(totalPages)}
                        className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-semibold text-gray-800"
                      >
                        {totalPages}
                      </button>
                    </>
                  ) : null}
                </div>
              );
            })()}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={pageSafe === totalPages}
              className={classNames(
                "px-3 py-2 rounded-xl border text-sm font-semibold",
                pageSafe === totalPages
                  ? "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
                  : "border-gray-200 text-gray-800 hover:bg-gray-50"
              )}
            >
              Next
            </button>

            <button
              onClick={() => setPage(totalPages)}
              disabled={pageSafe === totalPages}
              className={classNames(
                "px-3 py-2 rounded-xl border text-sm font-semibold",
                pageSafe === totalPages
                  ? "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
                  : "border-gray-200 text-gray-800 hover:bg-gray-50"
              )}
            >
              Last
            </button>
          </div>
        </div>
      ) : null}

      {/* ✅ Unified Add/Edit Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={
          formMode === "edit"
            ? "Edit Listing"
            : `Add ${
                LISTING_TYPES.find((t) => t.key === formType)?.label ||
                "Listing"
              }`
        }
        subtitle="Fill the fields and save."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {getSchema(formType).map((f) => (
            <div key={f.k} className={f.span2 ? "md:col-span-2" : ""}>
              <label className="text-sm font-medium text-gray-700">
                {f.label}
              </label>

              {f.type === "select" ? (
                <select
                  value={values[f.k] || ""}
                  onChange={(e) => setField(f.k, e.target.value)}
                  className="mt-1 w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
                >
                  {(f.options || []).map((op) => (
                    <option key={op || "empty"} value={op}>
                      {op || "Select"}
                    </option>
                  ))}
                </select>
              ) : f.type === "textarea" ? (
                <textarea
                  value={values[f.k] || ""}
                  onChange={(e) => setField(f.k, e.target.value)}
                  className="mt-1 w-full min-h-[110px] py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
                  placeholder={f.ph || ""}
                />
              ) : (
                <input
                  value={values[f.k] || ""}
                  onChange={(e) => setField(f.k, e.target.value)}
                  list={f.list || undefined}
                  className="mt-1 w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
                  placeholder={f.ph || ""}
                />
              )}
            </div>
          ))}

          <datalist id="form-city-suggestions">
            {formCitySuggestions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => setFormOpen(false)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={submitForm}
            className="px-4 py-2.5 rounded-xl bg-black text-white hover:bg-black/90 font-semibold"
          >
            {formMode === "edit" ? "Update" : "Save"}
          </button>
        </div>
      </Modal>

      {/* Note */}
      {/* <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <div className="font-extrabold">Next (after this):</div>
        <div className="mt-1">
          Unified Details page for any listing + Reviews (add/edit/delete) +
          lock contact for guests.
        </div>
      </div> */}
    </div>
  );
}

/* =========================
   Card
========================= */
