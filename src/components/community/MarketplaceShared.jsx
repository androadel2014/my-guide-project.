import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

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

export function Modal({ open, onClose, title, subtitle, children }) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const KEY = "__modalScrollLock__";
    if (!window[KEY]) {
      window[KEY] = {
        count: 0,
        prevHtmlOverflow: "",
        prevBodyOverflow: "",
        prevBodyPaddingRight: "",
      };
    }

    if (!open) return;

    if (window[KEY].count === 0) {
      window[KEY].prevHtmlOverflow = html.style.overflow || "";
      window[KEY].prevBodyOverflow = body.style.overflow || "";
      window[KEY].prevBodyPaddingRight = body.style.paddingRight || "";

      const scrollBarWidth =
        window.innerWidth - document.documentElement.clientWidth;

      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
      if (scrollBarWidth > 0) body.style.paddingRight = `${scrollBarWidth}px`;
    }

    window[KEY].count += 1;

    return () => {
      window[KEY].count = Math.max(0, window[KEY].count - 1);
      if (window[KEY].count === 0) {
        html.style.overflow = window[KEY].prevHtmlOverflow || "";
        body.style.overflow = window[KEY].prevBodyOverflow || "";
        body.style.paddingRight = window[KEY].prevBodyPaddingRight || "";
      }
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overscroll-contain">
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
            type="button"
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

export function ListingFormBody({
  formType,
  values,
  setField,
  getSchema,
  formCitySuggestions,
  onCancel,
  onSubmit,
  submitLabel,
}) {
  return (
    <>
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
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 font-semibold"
          type="button"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          className="px-4 py-2.5 rounded-xl bg-black text-white hover:bg-black/90 font-semibold"
          type="button"
        >
          {submitLabel}
        </button>
      </div>
    </>
  );
}

// =========================
// Shared form helpers (USED BY CommunityView + ItemDetailsView)
// =========================

export const EMPTY_VALUES = {
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

export function normalizeId(raw, typeKey) {
  const v = String(raw || "").trim();
  if (!v) return v;

  // ✅ لو جاي بصيغة: product_7 / housing_10 / services_3 ... → خليه "7"
  if (v.includes("_")) {
    const last = v.split("_").pop();
    if (last && /^\d+$/.test(last)) return last;
    return last || v;
  }

  // ✅ لو رقم أصلاً
  if (/^\d+$/.test(v)) return v;

  // ✅ لو فيه رقم جوّه أي سترنج: "id:10" → "10"
  const m = v.match(/(\d+)/);
  return m ? m[1] : v;
}

export function getCategoryOptionsForTab(t) {
  if (t === "places") return PLACE_CATEGORIES;
  if (t === "services") return SERVICE_CATEGORIES;
  if (t === "jobs") return JOB_CATEGORIES;
  if (t === "housing") return HOUSING_CATEGORIES;
  if (t === "products") return PRODUCT_CATEGORIES;
  return [];
}

export function getSchema(t) {
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
    { k: "title", label: "Title *", type: "text", ph: "Title...", span2: true },
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
    { k: "state", label: "State", type: "select", options: ["", ...US_STATES] },
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
// =========================
// ✅ Shared helpers for Edit forms (single source of truth)
// =========================
export function buildEditValues(kind, s) {
  return {
    // keep both name/title for compatibility across schemas
    name: s.title,
    title: s.title,

    category: s.category,
    city: s.city,
    state: s.state,
    phone: s.phone,
    address: s.address,
    zip: s.zip,
    website: s.website,

    // keep both notes/description
    notes: s.desc,
    description: s.desc,

    // price only used when schema includes it
    price: s.price,
  };
}

export function applyEditField(setters, k, v) {
  const {
    setTitle,
    setCategory,
    setAddress,
    setCity,
    setState,
    setZip,
    setPhone,
    setWebsite,
    setDesc,
    setPrice,
  } = setters;

  if (k === "title" || k === "name") return setTitle(v);
  if (k === "category") return setCategory(v);
  if (k === "address") return setAddress(v);
  if (k === "city") return setCity(v);
  if (k === "state") return setState(v);
  if (k === "zip") return setZip(v);
  if (k === "phone" || k === "contact") return setPhone(v);
  if (k === "website" || k === "link" || k === "url") return setWebsite(v);
  if (k === "description" || k === "notes") return setDesc(v);
  if (k === "price" || k === "price_value" || k === "amount")
    return setPrice(v);
}

export {
  US_STATES,
  PLACE_CATEGORIES,
  GROUP_PLATFORMS,
  GROUP_TOPICS,
  SERVICE_CATEGORIES,
  JOB_CATEGORIES,
  HOUSING_CATEGORIES,
  PRODUCT_CATEGORIES,
};
