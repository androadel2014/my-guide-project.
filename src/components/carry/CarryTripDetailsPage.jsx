// src/components/carry/CarryTripDetailsPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  Heart,
  Plane,
  MessageCircle,
  Send,
  Pencil,
  Trash2,
  Lock,
  Calendar,
  MapPin,
  Weight,
  X,
} from "lucide-react";
import { tryFetchJSON, authHeaders } from "../../lib/apiHelpers";
import { toastConfirm } from "../../lib/notify";

// Put it here: src/data/airports.json (OBJECT keyed by ICAO)
import AIRPORTS_RAW from "../../../backend/src/data/airports.json";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  "http://localhost:5000";

const cn = (...a) => a.filter(Boolean).join(" ");

/* =========================
   Airports helpers (OBJECT keyed by ICAO) ✅ NO HOOKS HERE
========================= */
function normalizeAirportFromObj(key, raw) {
  const a = raw || {};
  const icao = String(a.icao || key || "").toUpperCase();
  const iata = String(a.iata || "").toUpperCase();
  const code = iata || icao; // prefer IATA, fallback ICAO
  const name = String(a.name || "").trim();
  const country = String(a.country || "").toUpperCase();
  const state = String(a.state || "").trim();
  const city = String(a.city || "").trim();
  return { icao, iata, code, name, country, state, city };
}

const AIRPORTS_LIST = (() => {
  const src = AIRPORTS_RAW || {};
  if (Array.isArray(src)) {
    return src
      .map((x) => normalizeAirportFromObj(x?.icao || x?.iata || "", x))
      .filter((x) => x.code && x.name);
  }
  if (src && typeof src === "object") {
    return Object.entries(src)
      .map(([k, v]) => normalizeAirportFromObj(k, v))
      .filter((x) => x.code && x.name);
  }
  return [];
})();

function airportLabel(a) {
  if (!a) return "";
  const code = a.code || "";
  const name = a.name || "";
  const country = a.country || "";
  const state = a.state ? `, ${a.state}` : "";
  return `${code} — ${name}${country ? ` • ${country}${state}` : ""}`;
}
function findAirportByCode(code) {
  const c = String(code || "")
    .toUpperCase()
    .trim();
  if (!c) return null;
  return AIRPORTS_LIST.find((a) => a.code === c) || null;
}

function AirportPicker({ label, valueCode, onPick }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrapRef = useRef(null);

  const picked = useMemo(() => findAirportByCode(valueCode), [valueCode]);

  const results = useMemo(() => {
    const term = String(q || "")
      .trim()
      .toLowerCase();
    if (!term) return AIRPORTS_LIST.slice(0, 15);

    const tokens = term.split(/\s+/).filter(Boolean);

    const scored = AIRPORTS_LIST.map((a) => {
      const hay =
        `${a.code} ${a.iata} ${a.icao} ${a.name} ${a.city} ${a.state} ${a.country}`.toLowerCase();
      let score = 0;

      for (const t of tokens) {
        if (!t) continue;
        if (a.code?.toLowerCase() === t) score += 140;
        if (a.iata?.toLowerCase() === t) score += 140;
        if (a.icao?.toLowerCase() === t) score += 130;

        if (a.code?.toLowerCase().startsWith(t)) score += 80;
        if (a.name?.toLowerCase().startsWith(t)) score += 35;
        if (a.city?.toLowerCase().startsWith(t)) score += 35;

        if (hay.includes(t)) score += 12;
      }
      return { a, score };
    })
      .filter((x) => x.score > 0)
      .sort((x, y) => y.score - x.score)
      .slice(0, 15)
      .map((x) => x.a);

    return scored.length ? scored : AIRPORTS_LIST.slice(0, 15);
  }, [q]);

  useEffect(() => {
    function onDoc(e) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <div className="text-xs font-extrabold text-slate-600">{label}</div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "mt-2 w-full px-4 py-3 rounded-2xl border bg-white text-left font-extrabold",
          "border-slate-200 hover:bg-slate-50"
        )}
      >
        {picked ? airportLabel(picked) : "Search airport…"}
      </button>

      {open ? (
        <div className="absolute z-[95] mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by IATA/ICAO or airport name…"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 text-sm font-bold"
              autoFocus
            />
          </div>

          <div className="max-h-80 overflow-y-auto">
            {results.map((a) => (
              <button
                key={`${a.code}_${a.icao}_${a.iata}`}
                type="button"
                onClick={() => {
                  onPick(a);
                  setOpen(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100"
              >
                <div className="text-sm font-extrabold text-slate-900">
                  {a.code} — {a.name}
                </div>
                <div className="text-xs text-slate-500 font-bold truncate">
                  {a.country}
                  {a.state ? ` • ${a.state}` : ""}
                  {a.city ? ` • ${a.city}` : ""}
                  {a.icao ? ` • ICAO ${a.icao}` : ""}
                </div>
              </button>
            ))}
          </div>

          <div className="p-2">
            <button
              type="button"
              onClick={() => {
                onPick(null);
                setOpen(false);
              }}
              className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-xs font-extrabold"
            >
              Clear
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* =========================
   helpers (safe)
========================= */
function safeJson(v) {
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}
function decodeJwtPayload(token) {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}
function getCurrentUserId() {
  const u1 = safeJson(localStorage.getItem("user"));
  const u2 = safeJson(localStorage.getItem("me"));
  const u3 = safeJson(localStorage.getItem("profile"));
  const fromObj = u1?.id ?? u2?.id ?? u3?.id ?? null;
  if (fromObj) return Number(fromObj) || null;

  const token = localStorage.getItem("token") || "";
  const p = decodeJwtPayload(token);
  const id = p?.id ?? p?.userId ?? p?.uid ?? p?.sub;
  return id ? Number(id) || null : null;
}
function isAuthed() {
  try {
    const t =
      localStorage.getItem("token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("auth_token") ||
      localStorage.getItem("jwt") ||
      "";
    return !!String(t || "").trim();
  } catch {
    return false;
  }
}
function fmtDT(v) {
  if (!v) return "—";
  return String(v).replace("T", " ").replace("Z", "");
}
function fmtShortTime(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString();
}

function isEmpty(v) {
  return v === null || v === undefined || String(v).trim() === "";
}
function pickFirstNonEmpty(obj, key, fallback = "") {
  const cands = [
    obj?.[key],
    obj?.data?.[key],
    obj?.payload?.[key],
    obj?.meta?.[key],
    obj?.item?.[key],
    obj?.item?.data?.[key],
  ];
  for (const v of cands) {
    if (!isEmpty(v)) return v;
  }
  return fallback;
}
function pickStr(obj, key, fallback = "") {
  const v = pickFirstNonEmpty(obj, key, fallback);
  return isEmpty(v) ? "" : String(v).trim();
}
function pickUpper(obj, key, fallback = "") {
  const v = pickStr(obj, key, fallback);
  return v ? v.toUpperCase() : "";
}

function normalizeTrip(raw) {
  const it = raw || {};

  const ownerId =
    pickFirstNonEmpty(it, "owner_id", null) ??
    pickFirstNonEmpty(it, "user_id", null) ??
    pickFirstNonEmpty(it, "created_by", null) ??
    pickFirstNonEmpty(it, "createdBy", null) ??
    null;

  const airline =
    pickStr(it, "airline") ||
    pickStr(it, "traveler_airline") ||
    pickStr(it, "airline_name") ||
    pickStr(it, "airlineName") ||
    "";

  const flight =
    pickStr(it, "flight_number") ||
    pickStr(it, "flightNumber") ||
    pickStr(it, "traveler_flight_number") ||
    pickStr(it, "flight_no") ||
    pickStr(it, "flightNo") ||
    "";

  const fromCode =
    pickUpper(it, "from_airport_code") ||
    pickUpper(it, "from_airport") ||
    pickUpper(it, "from_iata") ||
    pickUpper(it, "from_code") ||
    "";

  const toCode =
    pickUpper(it, "to_airport_code") ||
    pickUpper(it, "to_airport") ||
    pickUpper(it, "to_iata") ||
    pickUpper(it, "to_code") ||
    "";

  const travelDate = pickStr(it, "travel_date") || pickStr(it, "date") || "";
  const arrivalDate = pickStr(it, "arrival_date") || "";

  const availableWeightRaw =
    pickFirstNonEmpty(it, "available_weight", null) ??
    pickFirstNonEmpty(it, "availableKg", null) ??
    pickFirstNonEmpty(it, "kg", null) ??
    null;

  const availableWeight = isEmpty(availableWeightRaw)
    ? null
    : Number(availableWeightRaw);

  return {
    ...it,
    _ownerId: ownerId ? Number(ownerId) || ownerId : ownerId,

    from_airport_code: fromCode,
    to_airport_code: toCode,

    travel_date: travelDate,
    arrival_date: arrivalDate,

    available_weight: Number.isFinite(availableWeight) ? availableWeight : null,

    airline,
    flight_number: flight,

    max_item_size: pickStr(it, "max_item_size") || "medium",
    meet_pref: pickStr(it, "meet_pref") || "airport",
    meet_place: pickStr(it, "meet_place") || pickStr(it, "meet_location") || "",
    item_type: pickStr(it, "item_type") || "",
    description: pickStr(it, "description") || "",
    status: pickStr(it, "status") || "open",
  };
}

function normalizeMessages(arr) {
  const list = Array.isArray(arr) ? arr.slice() : [];
  list.sort((a, b) => {
    const ta = Date.parse(a?.created_at || a?.createdAt || "");
    const tb = Date.parse(b?.created_at || b?.createdAt || "");
    if (Number.isFinite(ta) && Number.isFinite(tb)) return ta - tb;
    return Number(a?.id || 0) - Number(b?.id || 0);
  });
  return list;
}

// local saved set (same key)
const LS_SAVED_KEY = "carry_saved_v1";
function loadSavedSet() {
  try {
    const raw = safeJson(localStorage.getItem(LS_SAVED_KEY));
    const arr = Array.isArray(raw) ? raw : [];
    return new Set(arr.map(String));
  } catch {
    return new Set();
  }
}
function persistSavedSet(setObj) {
  try {
    localStorage.setItem(
      LS_SAVED_KEY,
      JSON.stringify(Array.from(setObj || new Set()).map(String))
    );
  } catch {}
}

/* =========================
   API
========================= */
async function fetchTripDetails(id) {
  return tryFetchJSON(`${API_BASE}/api/carry/listings/${id}`, {
    headers: { ...authHeaders() },
  });
}
async function deleteTripApi(id) {
  return tryFetchJSON(`${API_BASE}/api/carry/listings/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
}
async function updateTripApi(id, payload) {
  return tryFetchJSON(`${API_BASE}/api/carry/listings/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload || {}),
  });
}
async function sendMessage(tripId, message) {
  return tryFetchJSON(`${API_BASE}/api/carry/listings/${tripId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ message }),
  });
}

/* =========================
   UI bits
========================= */
function Field({ label, hint, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-xs font-extrabold text-slate-600">{label}</div>
        {hint ? (
          <div className="text-[11px] text-slate-400 font-bold">{hint}</div>
        ) : null}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Modal({ open, title, children, onClose, wide }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 p-4 flex items-center justify-center">
        <div
          className={cn(
            "relative w-full rounded-3xl border bg-white shadow-xl overflow-hidden",
            "max-h-[85vh] flex flex-col",
            wide ? "max-w-3xl" : "max-w-lg"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-5 py-4 border-b flex items-center justify-between shrink-0">
            <div className="font-black text-slate-900">{title}</div>
            <button
              className="p-2 rounded-2xl hover:bg-slate-100"
              onClick={onClose}
              aria-label="Close"
              type="button"
            >
              <X size={18} />
            </button>
          </div>
          <div className="p-5 overflow-y-auto overscroll-contain">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 flex items-center gap-2">
      <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
        <Icon size={16} className="text-slate-700" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-extrabold text-slate-500 uppercase">
          {label}
        </div>
        <div className="text-sm font-extrabold text-slate-900 truncate">
          {value}
        </div>
      </div>
    </div>
  );
}

function codeLabel(code) {
  const c = String(code || "")
    .trim()
    .toUpperCase();
  return c || "—";
}

export default function CarryTripDetailsPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const { id } = useParams();

  const tripId = Number(id);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(null);

  const [messages, setMessages] = useState([]);
  const [msgDraft, setMsgDraft] = useState("");

  const listRef = useRef(null);
  const endRef = useRef(null);

  const [currentUserId, setCurrentUserId] = useState(getCurrentUserId());
  useEffect(() => {
    const sync = () => setCurrentUserId(getCurrentUserId());
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const authed = useMemo(() => isAuthed(), [currentUserId]);

  const savedSetRef = useRef(loadSavedSet());
  const [savedOn, setSavedOn] = useState(() =>
    savedSetRef.current.has(String(tripId))
  );

  function goLogin(nextPath) {
    nav("/auth", { state: { next: nextPath || loc.pathname } });
  }
  function requireAuth(nextPath) {
    if (isAuthed()) return true;
    toast.error("Please login first.");
    goLogin(nextPath);
    return false;
  }

  async function load() {
    if (!tripId) return;
    setLoading(true);
    try {
      const r = await fetchTripDetails(tripId);
      if (!r?.ok) throw new Error(r?.error || "Failed");
      const d = r?.data ?? r;

    //   console.log("RAW_ITEM", d?.item);
    //   console.log("RAW_ITEM_DATA", d?.item?.data);

      if (d?.item) d.item = normalizeTrip(d.item);
      setDetails(d);

      const msgs = normalizeMessages(d?.messages);
      setMessages(msgs);
    } catch (e) {
      toast.error(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  const trip = useMemo(() => normalizeTrip(details?.item || {}), [details]);

  const owner =
    !!currentUserId &&
    !!trip?._ownerId &&
    String(trip._ownerId) === String(currentUserId);

  const canChatRaw =
    details?.can_chat ??
    details?.canChat ??
    details?.data?.can_chat ??
    details?.data?.canChat ??
    false;
  const canChat = !!canChatRaw;

  useEffect(() => {
    if (!endRef.current) return;
    endRef.current.scrollIntoView({ behavior: "auto", block: "end" });
  }, [messages?.length]);

  function toggleSave() {
    if (!requireAuth(`/carry/trips/${tripId}`)) return;
    const s = new Set(savedSetRef.current);
    const key = String(tripId);
    if (s.has(key)) s.delete(key);
    else s.add(key);
    savedSetRef.current = s;
    persistSavedSet(s);
    setSavedOn(s.has(key));
  }

  async function onDelete() {
    if (!requireAuth(`/carry/trips/${tripId}`)) return;
    const ok = await toastConfirm("Delete this trip?");
    if (!ok) return;

    setLoading(true);
    try {
      const r = await deleteTripApi(tripId);
      if (!r?.ok) throw new Error(r?.error || "Failed");
      toast.success("Deleted ✅");
      nav("/carry");
    } catch (e) {
      toast.error(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  // EDIT MODAL
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);

  function openEdit() {
    if (!requireAuth(`/carry/trips/${tripId}`)) return;
    const t = normalizeTrip(trip);

    setEditForm({
      from_airport_code: t.from_airport_code || "",
      to_airport_code: t.to_airport_code || "",
      travel_date: t.travel_date || "",
      arrival_date: t.arrival_date || "",
      available_weight:
        t.available_weight === null || t.available_weight === undefined
          ? ""
          : String(t.available_weight),
      airline: t.airline || "",
      flight_number: t.flight_number || "",
      max_item_size: t.max_item_size || "medium",
      meet_pref: t.meet_pref || "airport",
      meet_place: t.meet_place || "",
      item_type: t.item_type || "",
      description: t.description || "",
      role: "traveler",
    });
    setEditOpen(true);
  }

  async function submitEdit() {
    if (!requireAuth(`/carry/trips/${tripId}`)) return;
    if (!editForm) return;

    const fromV = String(editForm.from_airport_code || "")
      .trim()
      .toUpperCase();
    const toV = String(editForm.to_airport_code || "")
      .trim()
      .toUpperCase();
    if (!fromV) return toast.error("From airport code is required.");
    if (!toV) return toast.error("To airport code is required.");

    const airlineV = String(editForm.airline || "").trim();
    const flightV = String(editForm.flight_number || "").trim();
    if (!airlineV) return toast.error("Airline is required.");
    if (!flightV) return toast.error("Flight number is required.");

    const w =
      editForm.available_weight === ""
        ? null
        : Number(editForm.available_weight);
    if (w !== null && (!Number.isFinite(w) || w <= 0))
      return toast.error("Enter a valid weight.");

    const payload = {
      ...editForm,

      from_airport_code: fromV,
      to_airport_code: toV,

      airline: airlineV,
      flight_number: flightV,

      // compatibility
      traveler_airline: airlineV,
      traveler_flight_number: flightV,
      flight_no: flightV,

      available_weight: w,

      meet_pref: editForm.meet_pref || "airport",
      meet_place:
        editForm.meet_pref === "nearby"
          ? String(editForm.meet_place || "")
          : "",

      role: "traveler",
    };

    setLoading(true);
    try {
      const r = await updateTripApi(tripId, payload);
      if (!r?.ok) throw new Error(r?.error || "Failed");
      toast.success("Updated ✅");

      const savedRaw = r?.data?.item || r?.data || r?.item || payload;
      const saved = normalizeTrip(savedRaw);

      setDetails((prev) => {
        const base = prev || {};
        const prevItem = normalizeTrip(base.item || {});
        return { ...base, item: { ...prevItem, ...saved } };
      });

      setEditOpen(false);
      setEditForm(null);

      await load();
    } catch (e) {
      toast.error(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function onSend() {
    if (!requireAuth(`/carry/trips/${tripId}`)) return;
    if (!canChat) return toast.error("Chat is locked until accepted.");

    const text = String(msgDraft || "").trim();
    if (!text) return;

    setLoading(true);
    try {
      const r = await sendMessage(tripId, text);
      if (!r?.ok) throw new Error(r?.error || "Failed");
      setMsgDraft("");

      const fresh = await tryFetchJSON(
        `${API_BASE}/api/carry/listings/${tripId}/messages`,
        { headers: { ...authHeaders() } }
      );
      if (fresh?.ok) setMessages(normalizeMessages(fresh?.data?.messages));
    } catch (e) {
      toast.error(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  const fromCode = codeLabel(trip?.from_airport_code);
  const toCode = codeLabel(trip?.to_airport_code);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        {/* TOP */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => nav(-1)}
              className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 font-extrabold inline-flex items-center gap-2"
              type="button"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={load}
                disabled={loading}
                className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 font-extrabold inline-flex items-center gap-2 disabled:opacity-60"
                type="button"
              >
                <RefreshCw size={16} />
                Refresh
              </button>

              <button
                onClick={toggleSave}
                className={cn(
                  "px-4 py-2 rounded-2xl border font-extrabold inline-flex items-center gap-2",
                  savedOn
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-white/15 bg-white/10 hover:bg-white/15 text-white"
                )}
                type="button"
              >
                <Heart size={16} className={savedOn ? "fill-current" : ""} />
                {savedOn ? "Saved" : "Save"}
              </button>
            </div>
          </div>

          <div className="mt-5">
            <div className="text-xs font-extrabold text-white/70 flex items-center gap-2">
              <Plane size={14} /> Trip #{tripId || "—"}
            </div>

            <div className="mt-1 text-2xl sm:text-3xl font-black tracking-tight">
              {fromCode} → {toCode}
            </div>

            <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <div className="rounded-2xl bg-white/10 border border-white/15 px-3 py-2">
                <div className="text-[11px] text-white/70 font-bold">
                  Travel
                </div>
                <div className="text-sm font-black">
                  {fmtDT(trip.travel_date)}
                </div>
              </div>

              <div className="rounded-2xl bg-white/10 border border-white/15 px-3 py-2">
                <div className="text-[11px] text-white/70 font-bold">
                  Arrival
                </div>
                <div className="text-sm font-black">
                  {fmtDT(trip.arrival_date)}
                </div>
              </div>

              <div className="rounded-2xl bg-white/10 border border-white/15 px-3 py-2">
                <div className="text-[11px] text-white/70 font-bold">
                  Available
                </div>
                <div className="text-sm font-black">
                  {trip.available_weight ?? "—"} kg
                </div>
              </div>

              <div className="rounded-2xl bg-white/10 border border-white/15 px-3 py-2">
                <div className="text-[11px] text-white/70 font-bold">
                  Status
                </div>
                <div className="text-sm font-black">
                  {trip.status || "open"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="p-4 sm:p-6">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-4 items-start">
            {/* LEFT */}
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col min-h-0">
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">
                      Trip details
                    </div>
                  </div>

                  {!authed ? (
                    <button
                      onClick={() => goLogin(`/carry/trips/${tripId}`)}
                      className="px-4 py-2 rounded-2xl bg-slate-900 text-white font-extrabold inline-flex items-center gap-2 shrink-0"
                      type="button"
                    >
                      <Lock size={16} />
                      Login
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[11px] font-extrabold text-slate-500 uppercase">
                        Travel date
                      </div>
                      <div className="w-9 h-9 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center">
                        <Calendar size={16} className="text-slate-700" />
                      </div>
                    </div>
                    <div className="mt-2 text-sm font-black text-slate-900">
                      {fmtDT(trip.travel_date)}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[11px] font-extrabold text-slate-500 uppercase">
                        Arrival date
                      </div>
                      <div className="w-9 h-9 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center">
                        <Calendar size={16} className="text-slate-700" />
                      </div>
                    </div>
                    <div className="mt-2 text-sm font-black text-slate-900">
                      {fmtDT(trip.arrival_date)}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[11px] font-extrabold text-slate-500 uppercase">
                        Airline
                      </div>
                      <div className="w-9 h-9 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center">
                        <Plane size={16} className="text-slate-700" />
                      </div>
                    </div>
                    <div className="mt-2 text-sm font-black text-slate-900 break-words">
                      {trip.airline || "—"}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[11px] font-extrabold text-slate-500 uppercase">
                        Flight number
                      </div>
                      <div className="w-9 h-9 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center">
                        <Plane size={16} className="text-slate-700" />
                      </div>
                    </div>
                    <div className="mt-2 text-sm font-black text-slate-900 break-words">
                      {trip.flight_number || "—"}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[11px] font-extrabold text-slate-500 uppercase">
                        Available weight
                      </div>
                      <div className="w-9 h-9 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center">
                        <Weight size={16} className="text-slate-700" />
                      </div>
                    </div>
                    <div className="mt-2 text-sm font-black text-slate-900">
                      {trip.available_weight ?? "—"} kg
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[11px] font-extrabold text-slate-500 uppercase">
                        Meet preference
                      </div>
                      <div className="w-9 h-9 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center">
                        <MapPin size={16} className="text-slate-700" />
                      </div>
                    </div>
                    <div className="mt-2 text-sm font-black text-slate-900 break-words">
                      {trip.meet_pref || "—"}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">
                        Package & Notes
                      </div>
                      <div className="mt-2 text-base font-black text-slate-900 break-words">
                        {trip.item_type ? trip.item_type : "Not specified"}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <span className="px-3 py-1.5 rounded-full text-xs font-extrabold border bg-white text-slate-700 border-slate-200">
                        Max size: {trip.max_item_size || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="text-[11px] font-extrabold text-slate-500 uppercase">
                      Notes
                    </div>
                    <div className="mt-2 text-sm text-slate-800 font-semibold whitespace-pre-wrap break-words">
                      {trip.description ? trip.description : "—"}
                    </div>

                    {trip.description &&
                    String(trip.description).replace(/\D/g, "").length >= 7 ? (
                      <div className="mt-3 text-xs font-extrabold text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl px-3 py-2">
                        ⚠️ Note may contain a phone number (not allowed).
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-3 grid sm:grid-cols-2 gap-3">
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="text-[11px] font-extrabold text-slate-500 uppercase">
                        Meet preference
                      </div>
                      <div className="mt-2 text-sm font-black text-slate-900 break-words">
                        {trip.meet_pref || "—"}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="text-[11px] font-extrabold text-slate-500 uppercase">
                        Meeting place
                      </div>
                      <div className="mt-2 text-sm font-black text-slate-900 break-words">
                        {trip.meet_pref === "airport"
                          ? "At airport"
                          : trip.meet_place
                          ? trip.meet_place
                          : "—"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  {owner ? (
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={openEdit}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 font-extrabold inline-flex items-center justify-center gap-2"
                        type="button"
                      >
                        <Pencil size={16} />
                        Edit
                      </button>

                      <button
                        onClick={onDelete}
                        className="w-full px-4 py-3 rounded-2xl border border-red-200 bg-white hover:bg-red-50 text-red-700 font-extrabold inline-flex items-center justify-center gap-2"
                        type="button"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        nav("/carry", { state: { requestTripId: tripId } })
                      }
                      className="w-full px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold inline-flex items-center justify-center gap-2"
                      type="button"
                    >
                      <Send size={16} />
                      Send Request
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: Chat */}
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-[calc(100vh-260px)] min-h-[700px] min-h-0">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="font-black text-slate-900 inline-flex items-center gap-2">
                  <MessageCircle size={16} />
                  Chat
                </div>
                <div className="text-xs font-bold text-slate-500">
                  {canChat ? `Messages: ${messages.length}` : "Locked"}
                </div>
              </div>

              {!canChat ? (
                <div className="p-5 flex-1 min-h-0">
                  <div className="h-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    Chat is locked until request is accepted.
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-4 flex-1 min-h-0">
                    <div
                      ref={listRef}
                      className="h-full overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3"
                    >
                      {messages?.length ? (
                        <div className="space-y-2">
                          {messages.map((m) => {
                            const mine =
                              !!currentUserId &&
                              String(m?.sender_id || "") ===
                                String(currentUserId);

                            return (
                              <div
                                key={m.id}
                                className={cn(
                                  "flex",
                                  mine ? "justify-end" : "justify-start"
                                )}
                              >
                                <div
                                  className={cn(
                                    "max-w-[85%] rounded-2xl px-3 py-2 border shadow-sm",
                                    mine
                                      ? "bg-indigo-600 text-white border-indigo-600"
                                      : "bg-white text-slate-900 border-slate-200"
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "text-[11px] font-bold mb-1",
                                      mine ? "text-white/80" : "text-slate-500"
                                    )}
                                  >
                                    {mine
                                      ? "You"
                                      : m.sender_name ||
                                        `User #${m.sender_id}`}{" "}
                                    •{" "}
                                    {fmtShortTime(m.created_at || m.createdAt)}
                                  </div>
                                  <div className="text-sm whitespace-pre-wrap">
                                    {m.message}
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          <div ref={endRef} />
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500">
                          No messages yet.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 border-t border-slate-100">
                    <div className="flex gap-2">
                      <input
                        value={msgDraft}
                        onChange={(e) => setMsgDraft(e.target.value)}
                        placeholder="Write message…"
                        className="flex-1 px-3 py-3 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-indigo-200"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            onSend();
                          }
                        }}
                      />
                      <button
                        disabled={loading || !String(msgDraft || "").trim()}
                        onClick={onSend}
                        className="px-4 py-3 rounded-2xl bg-slate-900 text-white font-extrabold hover:bg-slate-800 disabled:opacity-50 inline-flex items-center gap-2"
                        type="button"
                      >
                        <Send size={16} />
                        Send
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      <Modal
        open={editOpen}
        wide
        title={`Edit Trip #${tripId}`}
        onClose={() => setEditOpen(false)}
      >
        {!editForm ? null : (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* LEFT */}
            <div className="space-y-4">
              <div className="text-sm font-black text-slate-900">
                Route (Airports)
              </div>

              <div className="grid grid-cols-1 gap-4">
                <AirportPicker
                  label="From airport"
                  valueCode={editForm.from_airport_code}
                  onPick={(a) =>
                    setEditForm((s) => ({
                      ...s,
                      from_airport_code: a?.code || "",
                    }))
                  }
                />
                <AirportPicker
                  label="To airport"
                  valueCode={editForm.to_airport_code}
                  onPick={(a) =>
                    setEditForm((s) => ({
                      ...s,
                      to_airport_code: a?.code || "",
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Field label="Travel date (departure)">
                  <input
                    type="datetime-local"
                    value={editForm.travel_date}
                    onChange={(e) =>
                      setEditForm((s) => ({
                        ...s,
                        travel_date: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white"
                  />
                </Field>

                <Field label="Arrival date (required)">
                  <input
                    type="datetime-local"
                    value={editForm.arrival_date}
                    onChange={(e) =>
                      setEditForm((s) => ({
                        ...s,
                        arrival_date: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white"
                  />
                </Field>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                <div className="text-sm font-black text-slate-900">
                  Traveler
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Field label="Airline" hint="required">
                    <input
                      value={editForm.airline}
                      onChange={(e) =>
                        setEditForm((s) => ({ ...s, airline: e.target.value }))
                      }
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white"
                    />
                  </Field>

                  <Field label="Flight number" hint="required">
                    <input
                      value={editForm.flight_number}
                      onChange={(e) =>
                        setEditForm((s) => ({
                          ...s,
                          flight_number: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white"
                    />
                  </Field>
                </div>

                <Field label="Meet preference">
                  <select
                    value={editForm.meet_pref || "airport"}
                    onChange={(e) =>
                      setEditForm((s) => ({
                        ...s,
                        meet_pref: e.target.value,
                        meet_place:
                          e.target.value === "nearby" ? s.meet_place : "",
                      }))
                    }
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-bold"
                  >
                    <option value="airport">At airport</option>
                    <option value="nearby">Nearby</option>
                    <option value="city">In city</option>
                  </select>
                </Field>

                {editForm.meet_pref === "nearby" ? (
                  <Field label="Meeting place" hint="required">
                    <input
                      value={editForm.meet_place}
                      onChange={(e) =>
                        setEditForm((s) => ({
                          ...s,
                          meet_place: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white"
                      placeholder="e.g. Tysons Corner..."
                    />
                  </Field>
                ) : null}

                <Field label="Max item size">
                  <select
                    value={editForm.max_item_size || "medium"}
                    onChange={(e) =>
                      setEditForm((s) => ({
                        ...s,
                        max_item_size: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-bold"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </Field>
              </div>
            </div>

            {/* RIGHT */}
            <div className="space-y-4">
              <div className="text-sm font-black text-slate-900">Capacity</div>

              <Field label="Available weight (kg)" hint="required">
                <input
                  type="number"
                  value={editForm.available_weight}
                  onChange={(e) =>
                    setEditForm((s) => ({
                      ...s,
                      available_weight: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white"
                />
              </Field>

              <Field label="Item type">
                <input
                  value={editForm.item_type}
                  onChange={(e) =>
                    setEditForm((s) => ({ ...s, item_type: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white"
                />
              </Field>

              <Field label="Description">
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((s) => ({ ...s, description: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white min-h-[260px]"
                />
              </Field>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditOpen(false)}
                  className="flex-1 px-5 py-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 font-extrabold"
                  type="button"
                >
                  Cancel
                </button>

                <button
                  disabled={loading}
                  onClick={submitEdit}
                  className="flex-1 px-5 py-4 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 font-extrabold disabled:opacity-60"
                  type="button"
                >
                  Save changes
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
