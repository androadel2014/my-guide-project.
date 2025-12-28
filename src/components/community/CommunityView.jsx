// CommunityView.jsx (FULL FILE - copy/paste)
// ✅ Changes in this version (اللي طلبته بالظبط):
// 1) ✅ حذف كل أزرار الـ Copy (Address/Phone/Link/Website) — ملوش لازمة
// 2) ✅ إضافة Rating + Reviews Count على كارد المكان (Places)
// 3) ✅ الكارد كله clickable للـ Places ويفتح صفحة المكان: /community/place/:id (placeholder route هنحطه في App.jsx)
// 4) ✅ سيبنا Open Map + Address link + Tel + Website (كلهم يشتغلوا) + عملنا stopPropagation عشان مايفتحش صفحة التفاصيل بالغلط

import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  MapPin,
  Globe,
  Phone,
  X,
  Users,
  Building2,
  Pencil,
  Trash2,
  ExternalLink,
  RefreshCw,
  MoreVertical,
  Navigation,
  UtensilsCrossed,
  Coffee,
  Croissant,
  ShoppingBag,
  Sparkles,
  Trees,
  Ticket,
  Landmark,
  Church,
  GraduationCap,
  Stethoscope,
  Scale,
  Car,
  Wrench,
  Scissors,
  ShoppingCart,
  MessageCircle,
  LocateFixed,
  ChevronRight,
  Star,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  "http://localhost:5000";

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

// ✅ ممكن تسيبهم زي ما هما (labels للـ UI)
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

function classNames(...arr) {
  return arr.filter(Boolean).join(" ");
}

function getToken() {
  return localStorage.getItem("token") || "";
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function safeUrl(url) {
  const v = (url || "").trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
}

function mapsLink({ address, city, state }) {
  const parts = [address, city, state].filter(Boolean).join(", ");
  const q = encodeURIComponent(parts || "");
  return q ? `https://www.google.com/maps/search/?api=1&query=${q}` : "";
}

function useOutsideClick(ref, onOutside) {
  useEffect(() => {
    const handler = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) onOutside?.();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onOutside]);
}

/* =========================
   ✅ CATEGORY → UI (Banner)
========================= */

function normalizePlaceCategoryKey(raw) {
  const v = String(raw || "")
    .trim()
    .toLowerCase();
  if (!v) return "other";
  if (v.includes("restaurant")) return "restaurant";
  if (v === "cafe" || v.includes("cafe")) return "cafe";
  if (v.includes("bakery")) return "bakery";
  if (
    v.includes("grocery") ||
    v.includes("arab market") ||
    v.includes("market")
  )
    return "grocery";
  if (v.includes("things to do")) return "todo";
  if (v.includes("park") || v.includes("outdoors")) return "park";
  if (v.includes("attraction")) return "attraction";
  if (v.includes("mosque")) return "mosque";
  if (v.includes("church")) return "church";
  if (v.includes("school") || v.includes("daycare")) return "school";
  if (v.includes("clinic") || v.includes("doctor")) return "clinic";
  if (v.includes("lawyer") || v.includes("immigration")) return "lawyer";
  if (v.includes("car")) return "car";
  if (v.includes("handyman") || v.includes("home services")) return "handyman";
  if (v.includes("barber") || v.includes("beauty")) return "beauty";
  if (v.includes("shopping") || v.includes("mall")) return "shopping";
  return "other";
}

function normalizeGroupPlatformKey(raw) {
  const v = String(raw || "")
    .trim()
    .toLowerCase();
  if (!v) return "other";
  if (v.includes("facebook")) return "facebook";
  if (v.includes("whatsapp")) return "whatsapp";
  if (v.includes("telegram")) return "telegram";
  if (v.includes("discord")) return "discord";
  if (v.includes("meetup")) return "meetup";
  return "other";
}

const PLACE_BANNER = {
  restaurant: {
    label: "Restaurant",
    Icon: UtensilsCrossed,
    bg: "from-orange-50 to-orange-100 border-orange-200",
    icon: "bg-orange-600",
  },
  cafe: {
    label: "Cafe",
    Icon: Coffee,
    bg: "from-amber-50 to-amber-100 border-amber-200",
    icon: "bg-amber-600",
  },
  bakery: {
    label: "Bakery",
    Icon: Croissant,
    bg: "from-yellow-50 to-yellow-100 border-yellow-200",
    icon: "bg-yellow-600",
  },
  grocery: {
    label: "Grocery / Arab Market",
    Icon: ShoppingBag,
    bg: "from-sky-50 to-sky-100 border-sky-200",
    icon: "bg-sky-600",
  },
  todo: {
    label: "Things to do",
    Icon: Sparkles,
    bg: "from-fuchsia-50 to-fuchsia-100 border-fuchsia-200",
    icon: "bg-fuchsia-600",
  },
  park: {
    label: "Park / Outdoors",
    Icon: Trees,
    bg: "from-green-50 to-green-100 border-green-200",
    icon: "bg-green-600",
  },
  attraction: {
    label: "Attraction",
    Icon: Ticket,
    bg: "from-violet-50 to-violet-100 border-violet-200",
    icon: "bg-violet-600",
  },
  mosque: {
    label: "Mosque",
    Icon: Landmark,
    bg: "from-emerald-50 to-emerald-100 border-emerald-200",
    icon: "bg-emerald-600",
  },
  church: {
    label: "Church",
    Icon: Church,
    bg: "from-indigo-50 to-indigo-100 border-indigo-200",
    icon: "bg-indigo-600",
  },
  school: {
    label: "School / Daycare",
    Icon: GraduationCap,
    bg: "from-blue-50 to-blue-100 border-blue-200",
    icon: "bg-blue-600",
  },
  clinic: {
    label: "Clinic / Doctor",
    Icon: Stethoscope,
    bg: "from-red-50 to-red-100 border-red-200",
    icon: "bg-red-600",
  },
  lawyer: {
    label: "Lawyer / Immigration",
    Icon: Scale,
    bg: "from-slate-50 to-slate-100 border-slate-200",
    icon: "bg-slate-700",
  },
  car: {
    label: "Car Services",
    Icon: Car,
    bg: "from-gray-50 to-gray-100 border-gray-200",
    icon: "bg-gray-800",
  },
  handyman: {
    label: "Handyman / Home Services",
    Icon: Wrench,
    bg: "from-teal-50 to-teal-100 border-teal-200",
    icon: "bg-teal-700",
  },
  beauty: {
    label: "Barber / Beauty",
    Icon: Scissors,
    bg: "from-pink-50 to-pink-100 border-pink-200",
    icon: "bg-pink-600",
  },
  shopping: {
    label: "Shopping / Mall",
    Icon: ShoppingCart,
    bg: "from-zinc-50 to-zinc-100 border-zinc-200",
    icon: "bg-zinc-800",
  },
  other: {
    label: "Place",
    Icon: Building2,
    bg: "from-gray-50 to-gray-100 border-gray-200",
    icon: "bg-gray-700",
  },
};

const GROUP_BANNER = {
  facebook: {
    label: "Facebook Group",
    Icon: Users,
    bg: "from-blue-50 to-blue-100 border-blue-200",
    icon: "bg-blue-600",
  },
  whatsapp: {
    label: "WhatsApp Group",
    Icon: MessageCircle,
    bg: "from-emerald-50 to-emerald-100 border-emerald-200",
    icon: "bg-emerald-600",
  },
  telegram: {
    label: "Telegram Group",
    Icon: MessageCircle,
    bg: "from-sky-50 to-sky-100 border-sky-200",
    icon: "bg-sky-600",
  },
  discord: {
    label: "Discord",
    Icon: Users,
    bg: "from-indigo-50 to-indigo-100 border-indigo-200",
    icon: "bg-indigo-600",
  },
  meetup: {
    label: "Meetup",
    Icon: Users,
    bg: "from-orange-50 to-orange-100 border-orange-200",
    icon: "bg-orange-600",
  },
  other: {
    label: "Group",
    Icon: Users,
    bg: "from-gray-50 to-gray-100 border-gray-200",
    icon: "bg-gray-700",
  },
};

function CardBanner({ type, placeCategory, groupPlatform, subtitleRight }) {
  const isPlace = type === "place";
  let ui = isPlace ? PLACE_BANNER.other : GROUP_BANNER.other;

  if (isPlace) {
    const key = normalizePlaceCategoryKey(placeCategory);
    ui = PLACE_BANNER[key] || PLACE_BANNER.other;
  } else {
    const key = normalizeGroupPlatformKey(groupPlatform);
    ui = GROUP_BANNER[key] || GROUP_BANNER.other;
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
            {isPlace ? "Curated for newcomers" : "Join & connect with people"}
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

  return (
    <div className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
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

        <div className="px-6 py-5 max-h-[75vh] overflow-y-auto">{children}</div>
      </div>
    </div>
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
            "absolute z-50 mt-2 min-w-[240px] rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden",
            align === "right" ? "right-0" : "left-0"
          )}
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
   Page
========================= */

export default function CommunityView() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("places"); // places | groups
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  const [isLoggedIn, setIsLoggedIn] = useState(!!getToken());
  useEffect(() => {
    const onStorage = () => setIsLoggedIn(!!getToken());
    window.addEventListener("storage", onStorage);
    const t = setInterval(() => setIsLoggedIn(!!getToken()), 800);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(t);
    };
  }, []);

  // filters
  const [q, setQ] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [platform, setPlatform] = useState("");
  const [topic, setTopic] = useState("");

  // add modal + dropdown
  const [openAdd, setOpenAdd] = useState(false);
  const [addType, setAddType] = useState("place"); // place | group
  const [openAddMenu, setOpenAddMenu] = useState(false);
  const [openAddSubmenu, setOpenAddSubmenu] = useState(""); // "" | "place" | "group"

  // edit modal
  const [openEdit, setOpenEdit] = useState(false);
  const [editType, setEditType] = useState("place"); // place | group
  const [editingId, setEditingId] = useState(null);

  // place form
  const [pName, setPName] = useState("");
  const [pCategory, setPCategory] = useState("Restaurant");
  const [pState, setPState] = useState("");
  const [pCity, setPCity] = useState("");
  const [pAddress, setPAddress] = useState("");
  const [pPhone, setPPhone] = useState("");
  const [pWebsite, setPWebsite] = useState("");
  const [pNotes, setPNotes] = useState("");

  // group form
  const [gName, setGName] = useState("");
  const [gPlatform, setGPlatform] = useState("Facebook");
  const [gLink, setGLink] = useState("");
  const [gState, setGState] = useState("");
  const [gCity, setGCity] = useState("");
  const [gTopic, setGTopic] = useState("Immigration");
  const [gNotes, setGNotes] = useState("");

  const endpoint = useMemo(() => {
    if (tab === "places") return "/api/community/places";
    return "/api/community/groups";
  }, [tab]);

  function resetFilters() {
    setQ("");
    setState("");
    setCity("");
    setCategory("");
    setPlatform("");
    setTopic("");
  }

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());

      if (tab === "places") {
        if (state) params.set("state", state);
        if (city.trim()) params.set("city", city.trim());
        if (category) params.set("category", category);
      } else {
        if (state) params.set("state", state);
        if (city.trim()) params.set("city", city.trim());
        if (platform) params.set("platform", platform);
        if (topic) params.set("topic", topic);
      }

      const res = await fetch(`${API_BASE}${endpoint}?${params.toString()}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load community items");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ✅ datalist cities (autocomplete) based on current items + state filter
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

  // ✅ datalist for Add/Edit forms based on chosen form state
  const formCitySuggestions = useMemo(() => {
    const s = new Set();
    const selectedState = addType === "place" ? pState : gState;

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
  }, [items, pState, gState, addType]);

  function requireLoginOrToast() {
    const ok = !!getToken();
    if (!ok) toast.error("Login required");
    return ok;
  }

  function openAddModal(type) {
    if (!requireLoginOrToast()) return;
    setAddType(type);
    setOpenAdd(true);
  }

  function openAddModalPresetPlace(cat) {
    if (!requireLoginOrToast()) return;
    setAddType("place");
    setPCategory(cat);
    setOpenAdd(true);
  }

  function openAddModalPresetGroup(plat) {
    if (!requireLoginOrToast()) return;
    setAddType("group");
    setGPlatform(plat);
    setOpenAdd(true);
  }

  function openEditModal(item) {
    if (!requireLoginOrToast()) return;

    const type = tab === "places" ? "place" : "group";
    setEditType(type);
    setEditingId(item.id);

    if (type === "place") {
      setPName(item.name || "");
      setPCategory(item.category || "Restaurant");
      setPState(item.state || "");
      setPCity(item.city || "");
      setPAddress(item.address || "");
      setPPhone(item.phone || "");
      setPWebsite(item.website || "");
      setPNotes(item.notes || "");
    } else {
      setGName(item.name || "");
      setGPlatform(item.platform || "Facebook");
      setGLink(item.link || "");
      setGState(item.state || "");
      setGCity(item.city || "");
      setGTopic(item.topic || "Immigration");
      setGNotes(item.notes || "");
    }

    setOpenEdit(true);
  }

  function clearPlaceForm() {
    setPName("");
    setPCategory("Restaurant");
    setPState("");
    setPCity("");
    setPAddress("");
    setPPhone("");
    setPWebsite("");
    setPNotes("");
  }

  function clearGroupForm() {
    setGName("");
    setGPlatform("Facebook");
    setGLink("");
    setGState("");
    setGCity("");
    setGTopic("Immigration");
    setGNotes("");
  }

  async function submitAdd() {
    try {
      if (!requireLoginOrToast()) return;

      if (addType === "place") {
        if (!pName.trim()) return toast.error("Name is required");
        if (!pCategory) return toast.error("Category is required");

        const res = await fetch(`${API_BASE}/api/community/places`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({
            name: pName.trim(),
            category: pCategory,
            state: pState,
            city: pCity.trim(),
            address: pAddress.trim(),
            phone: pPhone.trim(),
            website: safeUrl(pWebsite),
            notes: pNotes.trim(),
          }),
        });

        if (res.status === 401) return toast.error("Login required");
        if (!res.ok) return toast.error("Failed to add place");

        toast.success("Place added");
        setOpenAdd(false);
        clearPlaceForm();

        if (tab !== "places") setTab("places");
        else load();
      } else {
        if (!gName.trim()) return toast.error("Group name is required");
        if (!gPlatform) return toast.error("Platform is required");
        if (!gLink.trim()) return toast.error("Link is required");

        const res = await fetch(`${API_BASE}/api/community/groups`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({
            name: gName.trim(),
            platform: gPlatform,
            link: safeUrl(gLink),
            state: gState,
            city: gCity.trim(),
            topic: gTopic,
            notes: gNotes.trim(),
          }),
        });

        if (res.status === 401) return toast.error("Login required");
        if (!res.ok) return toast.error("Failed to add group");

        toast.success("Group added");
        setOpenAdd(false);
        clearGroupForm();

        if (tab !== "groups") setTab("groups");
        else load();
      }
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong");
    }
  }

  // ✅ UPDATE FIX: PUT + fallback PATCH
  async function submitEdit() {
    try {
      if (!requireLoginOrToast()) return;
      if (!editingId) return toast.error("Missing item id");

      if (editType === "place") {
        if (!pName.trim()) return toast.error("Name is required");

        const payload = {
          name: pName.trim(),
          category: pCategory,
          state: pState,
          city: pCity.trim(),
          address: pAddress.trim(),
          phone: pPhone.trim(),
          website: safeUrl(pWebsite),
          notes: pNotes.trim(),
        };

        const url = `${API_BASE}/api/community/places/${editingId}`;
        let res = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          res = await fetch(url, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify(payload),
          });
        }

        if (res.status === 401) return toast.error("Login required");
        if (!res.ok) return toast.error("Update failed");

        toast.success("Updated");
        setOpenEdit(false);
        setEditingId(null);
        load();
      } else {
        if (!gName.trim()) return toast.error("Group name is required");
        if (!gLink.trim()) return toast.error("Link is required");

        const payload = {
          name: gName.trim(),
          platform: gPlatform,
          link: safeUrl(gLink),
          state: gState,
          city: gCity.trim(),
          topic: gTopic,
          notes: gNotes.trim(),
        };

        const url = `${API_BASE}/api/community/groups/${editingId}`;
        let res = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          res = await fetch(url, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify(payload),
          });
        }

        if (res.status === 401) return toast.error("Login required");
        if (!res.ok) return toast.error("Update failed");

        toast.success("Updated");
        setOpenEdit(false);
        setEditingId(null);
        load();
      }
    } catch (e) {
      console.error(e);
      toast.error("Update failed");
    }
  }

  async function removeItem(id) {
    try {
      if (!requireLoginOrToast()) return;

      const ok = window.confirm("Delete this item?");
      if (!ok) return;

      const url =
        tab === "places"
          ? `${API_BASE}/api/community/places/${id}`
          : `${API_BASE}/api/community/groups/${id}`;

      const res = await fetch(url, {
        method: "DELETE",
        headers: { ...authHeaders() },
      });

      if (res.status === 401) return toast.error("Login required");
      if (!res.ok) return toast.error("Delete failed");

      toast.success("Deleted");
      load();
    } catch (e) {
      console.error(e);
      toast.error("Delete failed");
    }
  }

  // ✅ Near me (simple)
  async function nearMe() {
    try {
      if (!navigator.geolocation)
        return toast.error("Geolocation not supported");
      toast.loading("Getting your location…", { id: "geo" });

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords || {};
          toast.success("Location detected. Choose State then Apply.", {
            id: "geo",
          });

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

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-extrabold text-gray-900">Community</h1>
          <p className="mt-1 text-gray-600">
            Places & groups that help newcomers find their way faster.
          </p>

          {/* Quick hint bar */}
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
            <Dropdown
              open={openAddMenu}
              setOpen={setOpenAddMenu}
              trigger={
                <button className="px-4 py-2 rounded-xl bg-black text-white hover:bg-black/90 inline-flex items-center gap-2">
                  <Plus size={18} />
                  Add
                </button>
              }
            >
              {/* Top level */}
              <div className="p-3">
                <SectionTitle
                  title="Quick Add"
                  desc="Choose type directly (faster)"
                />
              </div>

              <MenuItem
                icon={Building2}
                title="Add Place…"
                desc="Restaurant, mosque, church, clinics…"
                rightEl={<ChevronRight size={16} />}
                onClick={() =>
                  setOpenAddSubmenu((v) => (v === "place" ? "" : "place"))
                }
              />
              <MenuItem
                icon={Users}
                title="Add Group…"
                desc="Facebook, WhatsApp, Telegram…"
                rightEl={<ChevronRight size={16} />}
                onClick={() =>
                  setOpenAddSubmenu((v) => (v === "group" ? "" : "group"))
                }
              />

              {/* Place submenu */}
              {openAddSubmenu === "place" ? (
                <div className="border-t border-gray-100">
                  <div className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-50">
                    Places presets
                  </div>

                  {[
                    { label: "Restaurant", icon: UtensilsCrossed },
                    { label: "Mosque", icon: Landmark },
                    { label: "Church", icon: Church },
                    { label: "Clinic / Doctor", icon: Stethoscope },
                    { label: "School / Daycare", icon: GraduationCap },
                    { label: "Grocery / Arab Market", icon: ShoppingBag },
                    { label: "Things to do", icon: Ticket },
                    { label: "Park / Outdoors", icon: Trees },
                    { label: "Car Services", icon: Car },
                    { label: "Handyman / Home Services", icon: Wrench },
                  ].map((x) => (
                    <button
                      key={x.label}
                      onClick={() => {
                        setOpenAddMenu(false);
                        setOpenAddSubmenu("");
                        openAddModalPresetPlace(x.label);
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2 text-sm font-semibold"
                    >
                      <x.icon size={16} className="text-gray-700" />
                      {x.label}
                    </button>
                  ))}

                  <button
                    onClick={() => {
                      setOpenAddMenu(false);
                      setOpenAddSubmenu("");
                      openAddModal("place");
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2 text-sm font-semibold text-gray-800 border-t border-gray-100"
                  >
                    <Building2 size={16} />
                    Custom Place (all categories)
                  </button>
                </div>
              ) : null}

              {/* Group submenu */}
              {openAddSubmenu === "group" ? (
                <div className="border-t border-gray-100">
                  <div className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-50">
                    Groups presets
                  </div>

                  {[
                    { label: "Facebook", icon: Users },
                    { label: "WhatsApp", icon: MessageCircle },
                    { label: "Telegram", icon: MessageCircle },
                    { label: "Discord", icon: Users },
                    { label: "Meetup", icon: Users },
                  ].map((x) => (
                    <button
                      key={x.label}
                      onClick={() => {
                        setOpenAddMenu(false);
                        setOpenAddSubmenu("");
                        openAddModalPresetGroup(x.label);
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2 text-sm font-semibold"
                    >
                      <x.icon size={16} className="text-gray-700" />
                      {x.label}
                    </button>
                  ))}

                  <button
                    onClick={() => {
                      setOpenAddMenu(false);
                      setOpenAddSubmenu("");
                      openAddModal("group");
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2 text-sm font-semibold text-gray-800 border-t border-gray-100"
                  >
                    <Users size={16} />
                    Custom Group (all platforms)
                  </button>
                </div>
              ) : null}
            </Dropdown>
          ) : null}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-5 flex gap-2">
        <button
          onClick={() => {
            setTab("places");
            resetFilters();
          }}
          className={classNames(
            "px-4 py-2 rounded-full border text-sm font-semibold",
            tab === "places"
              ? "bg-black text-white border-black"
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
          )}
        >
          Places
        </button>
        <button
          onClick={() => {
            setTab("groups");
            resetFilters();
          }}
          className={classNames(
            "px-4 py-2 rounded-full border text-sm font-semibold",
            tab === "groups"
              ? "bg-black text-white border-black"
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
          )}
        >
          Groups
        </button>
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
                    : "e.g. arab, jobs, immigration..."
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

          {tab === "places" ? (
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
              >
                <option value="">All</option>
                {PLACE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          ) : (
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
          )}

          {tab === "groups" ? (
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Topic</label>
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
          ) : (
            <div className="md:col-span-2">
              <div className="h-[1px] md:h-auto" />
            </div>
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
            icon={tab === "places" ? Building2 : Users}
            title="No items yet"
            desc={
              tab === "places"
                ? "Add your first place to help newcomers."
                : "Add your first group to connect people."
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map((it) => (
              <CardItem
                key={it.id}
                tab={tab}
                it={it}
                isLoggedIn={isLoggedIn}
                onEdit={() => openEditModal(it)}
                onDelete={() => removeItem(it.id)}
                onOpen={() => {
                  if (tab === "places") navigate(`/community/place/${it.id}`);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        title={addType === "place" ? "Add Place" : "Add Group"}
        subtitle="Share something useful for newcomers."
      >
        {addType === "place" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                Name *
              </label>
              <input
                value={pName}
                onChange={(e) => setPName(e.target.value)}
                className="mt-1 w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
                placeholder="e.g. Kabul Kabob"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                value={pCategory}
                onChange={(e) => setPCategory(e.target.value)}
                className="mt-1 w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
              >
                {PLACE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">State</label>
              <select
                value={pState}
                onChange={(e) => setPState(e.target.value)}
                className="mt-1 w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
              >
                <option value="">Select</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">City</label>
              <input
                value={pCity}
                onChange={(e) => setPCity(e.target.value)}
                list="form-city-suggestions"
                className="mt-1 w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
                placeholder="e.g. Fairfax"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <input
                value={pPhone}
                onChange={(e) => setPPhone(e.target.value)}
                className="mt-1 w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
                placeholder="e.g. +1 703..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                value={pAddress}
                onChange={(e) => setPAddress(e.target.value)}
                className="mt-1 w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
                placeholder="Full address"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                Website
              </label>
              <input
                value={pWebsite}
                onChange={(e) => setPWebsite(e.target.value)}
                className="mt-1 w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
                placeholder="https://"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={pNotes}
                onChange={(e) => setPNotes(e.target.value)}
                className="mt-1 w-full min-h-[100px] py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
                placeholder="What’s special about this place?"
              />
            </div>

            <datalist id="form-city-suggestions">
              {formCitySuggestions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                Group Name *
              </label>
              <input
                value={gName}
                onChange={(e) => setGName(e.target.value)}
                className="mt-1 w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
                placeholder="e.g. Arabs in Virginia"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Platform
              </label>
              <select
                value={gPlatform}
                onChange={(e) => setGPlatform(e.target.value)}
                className="mt-1 w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
              >
                {GROUP_PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Topic</label>
              <select
                value={gTopic}
                onChange={(e) => setGTopic(e.target.value)}
                className="mt-1 w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
              >
                {GROUP_TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">State</label>
              <select
                value={gState}
                onChange={(e) => setGState(e.target.value)}
                className="mt-1 w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
              >
                <option value="">Select</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">City</label>
              <input
                value={gCity}
                onChange={(e) => setGCity(e.target.value)}
                list="form-city-suggestions"
                className="mt-1 w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
                placeholder="e.g. Alexandria"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                Link *
              </label>
              <input
                value={gLink}
                onChange={(e) => setGLink(e.target.value)}
                className="mt-1 w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
                placeholder="Facebook/WhatsApp invite link"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={gNotes}
                onChange={(e) => setGNotes(e.target.value)}
                className="mt-1 w-full min-h-[100px] py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
                placeholder="Rules, who it’s for, etc."
              />
            </div>

            <datalist id="form-city-suggestions">
              {formCitySuggestions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => setOpenAdd(false)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={submitAdd}
            className="px-4 py-2.5 rounded-xl bg-black text-white hover:bg-black/90 font-semibold"
          >
            Save
          </button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        title="Edit Item"
        subtitle="Update the info and save."
      >
        {editType === "place" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                Name *
              </label>
              <input
                value={pName}
                onChange={(e) => setPName(e.target.value)}
                className="mt-1 w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                value={pCategory}
                onChange={(e) => setPCategory(e.target.value)}
                className="mt-1 w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
              >
                {PLACE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">State</label>
              <select
                value={pState}
                onChange={(e) => setPState(e.target.value)}
                className="mt-1 w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
              >
                <option value="">Select</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">City</label>
              <input
                value={pCity}
                onChange={(e) => setPCity(e.target.value)}
                list="form-city-suggestions"
                className="mt-1 w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <input
                value={pPhone}
                onChange={(e) => setPPhone(e.target.value)}
                className="mt-1 w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                value={pAddress}
                onChange={(e) => setPAddress(e.target.value)}
                className="mt-1 w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                Website
              </label>
              <input
                value={pWebsite}
                onChange={(e) => setPWebsite(e.target.value)}
                className="mt-1 w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={pNotes}
                onChange={(e) => setPNotes(e.target.value)}
                className="mt-1 w-full min-h-[110px] py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>

            <datalist id="form-city-suggestions">
              {formCitySuggestions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                Group Name *
              </label>
              <input
                value={gName}
                onChange={(e) => setGName(e.target.value)}
                className="mt-1 w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Platform
              </label>
              <select
                value={gPlatform}
                onChange={(e) => setGPlatform(e.target.value)}
                className="mt-1 w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
              >
                {GROUP_PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Topic</label>
              <select
                value={gTopic}
                onChange={(e) => setGTopic(e.target.value)}
                className="mt-1 w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
              >
                {GROUP_TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">State</label>
              <select
                value={gState}
                onChange={(e) => setGState(e.target.value)}
                className="mt-1 w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
              >
                <option value="">Select</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">City</label>
              <input
                value={gCity}
                onChange={(e) => setGCity(e.target.value)}
                list="form-city-suggestions"
                className="mt-1 w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                Link *
              </label>
              <input
                value={gLink}
                onChange={(e) => setGLink(e.target.value)}
                className="mt-1 w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={gNotes}
                onChange={(e) => setGNotes(e.target.value)}
                className="mt-1 w-full min-h-[110px] py-2.5 px-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>

            <datalist id="form-city-suggestions">
              {formCitySuggestions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => setOpenEdit(false)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={submitEdit}
            className="px-4 py-2.5 rounded-xl bg-black text-white hover:bg-black/90 font-semibold"
          >
            Update
          </button>
        </div>
      </Modal>

      {/* ✅ NOTE for next step */}
      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <div className="font-extrabold">Next (after this):</div>
        <div className="mt-1">
          تفاصيل صفحة المكان + الريفيوهات (نظبطها بعد ما “الدي” يبان بروفيشنال).
        </div>
      </div>
    </div>
  );
}

/* =========================
   Card
========================= */

function CardItem({ tab, it, isLoggedIn, onEdit, onDelete, onOpen }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  useOutsideClick(menuRef, () => setOpen(false));

  const placeMapUrl =
    tab === "places"
      ? mapsLink({ address: it.address, city: it.city, state: it.state })
      : "";

  const locText =
    [it.city, it.state].filter(Boolean).join(", ") || "Location not set";
  const badgeText =
    tab === "places" ? it.category || "Other" : it.platform || "Other";

  const rightSubtitle =
    tab === "places"
      ? [it.city, it.state].filter(Boolean).join(", ") || ""
      : it.topic || "";

  const cardClickable = tab === "places" && typeof onOpen === "function";

  // ✅ Rating + Reviews Count (fallbacks)
  const ratingRaw =
    it.avg_rating ?? it.rating_avg ?? it.rating ?? it.avgRating ?? 0;

  const reviewsRaw =
    it.reviews_count ?? it.review_count ?? it.reviews ?? it.reviewCount ?? 0;

  const rating = Number(ratingRaw) || 0;
  const reviewsCount = Number(reviewsRaw) || 0;

  const ratingText = reviewsCount > 0 ? rating.toFixed(1) : "New";

  return (
    <div
      role={cardClickable ? "button" : undefined}
      tabIndex={cardClickable ? 0 : undefined}
      onClick={() => {
        if (!cardClickable) return;
        onOpen();
      }}
      onKeyDown={(e) => {
        if (!cardClickable) return;
        if (e.key === "Enter" || e.key === " ") onOpen();
      }}
      className={classNames(
        "rounded-2xl relative border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition hover:ring-2 hover:ring-black/5",
        cardClickable ? "cursor-pointer" : ""
      )}
    >
      {/* Banner */}
      <CardBanner
        type={tab === "places" ? "place" : "group"}
        placeCategory={it.category}
        groupPlatform={it.platform}
        subtitleRight={rightSubtitle}
      />

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {/* ✅ اسم المكان بقى Text عشان الكارد هو اللي يفتح التفاصيل */}
            <div className="text-base md:text-lg font-extrabold text-gray-900 truncate">
              {it.name}
            </div>

            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-gray-200 text-gray-700">
              {badgeText}
            </span>

            {/* ✅ Rating pill في نفس السطر (places فقط) */}
            {tab === "places" ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold border border-gray-200 bg-gray-50 text-gray-900">
                <Star size={14} className="text-amber-500" />
                {ratingText}
                <span className="text-xs font-semibold text-gray-600">
                  ({reviewsCount})
                </span>
              </span>
            ) : null}
          </div>

          <div className="mt-2 text-sm text-gray-700 space-y-1">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-gray-500" />
              <span className="truncate">{locText}</span>
            </div>

            {/* ✅ العنوان يفتح الماب (stopPropagation عشان مايفتحش details) */}
            {tab === "places" && it.address && placeMapUrl ? (
              <a
                href={placeMapUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-gray-600 truncate hover:underline"
                title="Open in Google Maps"
              >
                {it.address}
              </a>
            ) : null}

            {tab === "groups" ? (
              <div className="text-gray-600">{it.topic || "General"}</div>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {/* ✅ Open Map */}
            {tab === "places" && placeMapUrl ? (
              <a
                href={placeMapUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50"
                title="Open in Google Maps"
              >
                <Navigation size={16} />
                Open Map
                <ExternalLink size={14} className="text-gray-500" />
              </a>
            ) : null}

            {/* ✅ Website */}
            {tab === "places" && it.website ? (
              <a
                href={safeUrl(it.website)}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50"
              >
                <Globe size={16} />
                Website
                <ExternalLink size={14} className="text-gray-500" />
              </a>
            ) : null}

            {/* ✅ Phone */}
            {tab === "places" && it.phone ? (
              <a
                href={`tel:${String(it.phone).replace(/\s+/g, "")}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50"
              >
                <Phone size={16} />
                {it.phone}
              </a>
            ) : null}

            {/* ✅ Groups link */}
            {tab === "groups" && it.link ? (
              <a
                href={safeUrl(it.link)}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50"
              >
                <Globe size={16} />
                Open Link
                <ExternalLink size={14} className="text-gray-500" />
              </a>
            ) : null}
          </div>

          {it.notes ? (
            <div className="mt-3 text-sm text-gray-600 whitespace-pre-wrap">
              {it.notes}
            </div>
          ) : null}
        </div>

        {/* Actions */}
        {isLoggedIn ? (
          <div
            className="shrink-0 relative"
            ref={menuRef}
            onClick={(e) => e.stopPropagation()} // ✅ مهم عشان الكارد clickable
          >
            <button
              onClick={() => setOpen((v) => !v)}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50"
              title="Actions"
            >
              <MoreVertical size={18} />
            </button>

            {open ? (
              <div className="absolute mt-2 right-0 w-44 rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden z-50">
                <button
                  onClick={() => {
                    setOpen(false);
                    onEdit();
                  }}
                  className="w-full px-3 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2 text-sm font-semibold"
                >
                  <Pencil size={16} />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    onDelete();
                  }}
                  className="w-full px-3 py-2.5 text-left hover:bg-red-50 flex items-center gap-2 text-sm font-semibold text-red-600"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
