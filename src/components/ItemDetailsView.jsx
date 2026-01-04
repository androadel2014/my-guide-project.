// src/components/ItemDetailsView.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { toastConfirm, notify } from "../lib/notify";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Star,
  ExternalLink,
  MessageSquarePlus,
  Sparkles,
  Lock,
  Pencil,
  X,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  "http://localhost:5000";

const cn = (...a) => a.filter(Boolean).join(" ");

function getToken() {
  return localStorage.getItem("token") || "";
}
function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
function isLoggedIn() {
  return !!getToken();
}

/* ============================
   ✅ JWT fallback (strong)
============================ */
function base64UrlToUtf8(b64url) {
  try {
    const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
    const str = atob(b64 + pad);
    const bytes = Uint8Array.from(str, (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return null;
  }
}
function decodeJwtPayload(token) {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = base64UrlToUtf8(part);
    if (!json) return null;
    return JSON.parse(json);
  } catch {
    return null;
  }
}
function getMeFromTokenFallback() {
  const token = getToken();
  const p = decodeJwtPayload(token);
  if (!p) return null;

  const id = p.id || p.userId || p.user_id || p.sub || p.uid;
  const username =
    p.username ||
    p.name ||
    p.full_name ||
    p.displayName ||
    p.email ||
    (p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : null) ||
    "You";

  return { id: id ?? null, username };
}

// ✅ extra fallback: try localStorage user/me/profile
function getMeFromStorageFallback() {
  try {
    const keys = [
      "user",
      "me",
      "profile",
      "currentUser",
      "current_user",
      "authUser",
      "auth_user",
      "userData",
      "user_data",
      "account",
      "sessionUser",
      "session_user",
    ];

    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;

      let obj = null;
      try {
        obj = JSON.parse(raw);
      } catch {
        obj = { username: raw };
      }

      const id =
        obj?.id ||
        obj?.userId ||
        obj?.user_id ||
        obj?._id ||
        obj?.sub ||
        obj?.uid ||
        obj?.user?.id ||
        obj?.profile?.id;

      const username =
        obj?.username ||
        obj?.name ||
        obj?.full_name ||
        obj?.displayName ||
        obj?.email ||
        obj?.user?.username ||
        obj?.user?.name ||
        obj?.profile?.username ||
        obj?.profile?.name;

      if (id || username)
        return { id: id ?? null, username: username || "You" };
    }
  } catch {}
  return null;
}

function normName(v) {
  return String(v || "")
    .trim()
    .toLowerCase();
}

function safeDateToLocaleString(v) {
  if (!v) return "";
  // sqlite: "YYYY-MM-DD HH:MM:SS" -> "YYYY-MM-DDTHH:MM:SS"
  const s = String(v).trim().replace(" ", "T");
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString();
}

/** ===== Stars (read-only) ===== */
function StarsReadOnly({ value = 0, size = 16, showValue = true }) {
  const v = Math.max(0, Math.min(5, Number(value || 0)));
  const rounded = Math.round(v);
  const cls = size >= 20 ? "h-5 w-5" : "h-4 w-4";

  return (
    <div className="inline-flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const on = i + 1 <= rounded;
        return (
          <Star
            key={i}
            className={cn(
              cls,
              "transition",
              on ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            )}
          />
        );
      })}
      {showValue ? (
        <span className="ml-1 text-sm font-semibold text-gray-900">
          {v.toFixed(1)}
        </span>
      ) : null}
    </div>
  );
}

/** ===== Stars Picker (interactive) ===== */
function StarsPicker({ value, onChange, size = 24 }) {
  const [hover, setHover] = useState(0);
  const v = Math.max(1, Math.min(5, Number(value || 5)));
  const active = hover || v;

  const cls = size >= 24 ? "h-6 w-6" : "h-5 w-5";
  const labels = {
    1: "Bad",
    2: "Okay",
    3: "Good",
    4: "Very good",
    5: "Excellent",
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="inline-flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => {
          const n = i + 1;
          const on = n <= active;
          return (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => onChange(n)}
              className="rounded-lg p-1 transition hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-200"
              aria-label={`Rate ${n} star`}
              title={`Rate ${n} star`}
            >
              <Star
                className={cn(
                  cls,
                  "transition-transform",
                  on ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                )}
              />
            </button>
          );
        })}
      </div>
      <div className="text-sm font-semibold text-gray-800">
        {labels[active] || ""}
      </div>
    </div>
  );
}

/** ===== Breakdown bars ===== */
function RatingBreakdown({ reviews = [] }) {
  const counts = useMemo(() => {
    const c = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of reviews) {
      const s = Math.max(1, Math.min(5, Number(r.stars) || 0));
      if (s) c[s] = (c[s] || 0) + 1;
    }
    return c;
  }, [reviews]);

  const total = reviews.length || 0;

  return (
    <div className="mt-3 space-y-2">
      {[5, 4, 3, 2, 1].map((n) => {
        const cnt = counts[n] || 0;
        const pct = total ? Math.round((cnt / total) * 100) : 0;
        return (
          <div key={n} className="flex items-center gap-2">
            <div className="w-10 text-xs font-semibold text-gray-700">{n}★</div>
            <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden border">
              <div
                className="h-full bg-yellow-400"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="w-10 text-right text-xs text-gray-600">{cnt}</div>
          </div>
        );
      })}
    </div>
  );
}

function pickId(obj) {
  return (
    obj?.id ??
    obj?.userId ??
    obj?.user_id ??
    obj?._id ??
    obj?.uid ??
    obj?.sub ??
    null
  );
}
function pickUsername(obj) {
  return (
    obj?.username ||
    obj?.name ||
    obj?.full_name ||
    obj?.displayName ||
    obj?.email ||
    null
  );
}

// ✅ يظبط اختلاف شكل /api/profile/me
function normalizeMe(any) {
  if (!any) return null;
  const p = any.profile || any.user || any.me || any;
  const id = pickId(p);
  const username = pickUsername(p);
  if (!id && !username) return null;
  return { id: id ?? null, username: username || "You" };
}

export default function ItemDetailsView({ lang }) {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // ✅ لازم قبل ما تستخدمه
  const placeId =
    params.id ||
    params.placeId ||
    params.groupId ||
    params.serviceId ||
    params.jobId ||
    params.housingId ||
    params.productId;

  // ✅ type comes from click (navigation state) OR sessionStorage (survives refresh)
  const navType = location.state?.type ? String(location.state.type) : "";
  const storedType =
    sessionStorage.getItem(`mp:type:${String(placeId || "").trim()}`) || "";

  useEffect(() => {
    const pid = String(placeId || "").trim();
    const t = String(navType || "").trim();
    if (!pid) return;

    if (t) {
      sessionStorage.setItem(`mp:type:${pid}`, t);
    }
  }, [placeId, navType]);

  const [loading, setLoading] = useState(true);
  const [place, setPlace] = useState(null);

  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviews, setReviews] = useState([]);

  const [meLoading, setMeLoading] = useState(false);
  const [me, setMe] = useState(null);

  const [myReview, setMyReview] = useState(null);
  const [rStars, setRStars] = useState(5);
  const [rText, setRText] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  const effectiveMe = useMemo(() => {
    return (
      normalizeMe(me) ||
      normalizeMe(getMeFromStorageFallback()) ||
      normalizeMe(getMeFromTokenFallback()) ||
      null
    );
  }, [me]);

  const avgRating = useMemo(() => {
    if (!reviews?.length) return 0;
    const sum = reviews.reduce((a, r) => a + (Number(r.stars) || 0), 0);
    return sum / reviews.length;
  }, [reviews]);

  const openMapUrl = useMemo(() => {
    if (!place) return "";
    const q = encodeURIComponent(
      [place.name, place.address, place.city, place.state, place.zip]
        .filter(Boolean)
        .join(", ")
    );
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }, [place]);

  const displayPrice = useMemo(() => {
    const p =
      place?.price ??
      place?.budget ??
      place?.avg_price ??
      place?.avgPrice ??
      "";
    return String(p || "").trim();
  }, [place]);

  const displayContact = useMemo(() => {
    const c = place?.contact ?? place?.phone ?? "";
    return String(c || "").trim();
  }, [place]);

  const displayLink = useMemo(() => {
    const w = place?.website ?? place?.link ?? place?.url ?? "";
    return String(w || "").trim();
  }, [place]);

  const displayUserName = (u) =>
    u?.username ||
    u?.name ||
    u?.full_name ||
    u?.displayName ||
    u?.email ||
    "You";

  const requireLogin = () => {
    notify.error("لازم تسجّل دخول الأول");
    navigate("/auth");
  };

  // ✅ kinds allowed by server (adjust if needed)
  const ALLOWED_KINDS = new Set([
    "places",
    "groups",
    "services",
    "jobs",
    "housing",
    "products",
  ]);

  // ✅ infer kind from route OR from id prefix like "housing_2"
  const rawKind = String(navType || storedType || "")
    .trim()
    .toLowerCase();

  const idStr = String(placeId || "").trim();
  const idPrefix = idStr.includes("_") ? idStr.split("_")[0].toLowerCase() : "";

  // ✅ final kind
  const kind = ALLOWED_KINDS.has(rawKind)
    ? rawKind
    : ALLOWED_KINDS.has(idPrefix)
    ? idPrefix
    : "places";

  // ✅ also try numeric id if server expects it (housing_2 -> 2)
  const shortId = idStr.includes("_")
    ? idStr.split("_").slice(1).join("_")
    : idStr;

  const isGroupType = kind === "groups";
  const isPlaceType = kind === "places";

  // console.log("kind:ده", kind);
  // console.log("placeId:ده", placeId);
  // console.log("shortId:ده", shortId);

  // ✅ normalize item to "place-like" shape so UI stays same design
  function normalizeToPlaceShape(raw, t) {
    if (!raw) return null;

    // ✅ unwrap common wrappers:
    // { ok:true, item:{...} } OR { data:{ item:{...} } } OR { item:{...} }
    const obj = raw?.item || raw?.data?.item || raw?.data || raw;

    if (!obj) return null;

    // marketplace listing (services/jobs/housing/products)
    if (!["places", "groups"].includes(t)) {
      return {
        ...obj,

        // ✅ prefer title (most listings)
        name:
          obj.title ||
          obj.name ||
          obj.business_name ||
          obj.company ||
          "Listing",

        category: obj.category || t,
        address: obj.address || obj.location || "",
        city: obj.city || "",
        state: obj.state || "",
        zip: obj.zip || "",

        phone: obj.phone || obj.contact || "",
        website: obj.website || obj.link || obj.url || "",

        description: obj.description || obj.notes || "",
        notes: obj.notes || obj.description || "",
        price: obj.price || obj.price_value || obj.amount || obj.budget || "",
      };
    }

    // places/groups legacy
    return {
      ...obj,
      name: obj.name || obj.title || "Item",
      city: obj.city || "",
      state: obj.state || "",
      zip: obj.zip || "",
      website: obj.website || obj.link || obj.url || "",
      notes: obj.notes || obj.description || "",
      description: obj.description || obj.notes || "",
    };
  }

  // ✅ try multiple endpoints until one works
  async function fetchFirstOk(urls, opts) {
    let lastErr = null;
    for (const u of urls) {
      try {
        const res = await fetch(u, opts);
        const data = await res.json().catch(() => ({}));
        if (res.ok) return { ok: true, url: u, data };
        lastErr = data?.error || `HTTP ${res.status}`;
      } catch (e) {
        lastErr = e?.message || "Network error";
      }
    }
    return { ok: false, error: lastErr || "Failed" };
  }

  // ✅ Details URL candidates (fallback strategy)
  const detailsCandidates = useMemo(() => {
    // places
    if (kind === "places") {
      return [
        `${API_BASE}/api/community/places/${placeId}`,
        `${API_BASE}/api/community/places/${shortId}`,
        `${API_BASE}/api/marketplace/places/${placeId}`,
        `${API_BASE}/api/marketplace/places/${shortId}`,
        `${API_BASE}/api/listings/${placeId}`,
        `${API_BASE}/api/listings/${shortId}`,
        `${API_BASE}/api/marketplace/listings/${placeId}`,
        `${API_BASE}/api/marketplace/listings/${shortId}`,
      ];
    }

    // groups
    if (kind === "groups") {
      return [
        `${API_BASE}/api/community/groups/${placeId}`,
        `${API_BASE}/api/community/groups/${shortId}`,
        `${API_BASE}/api/marketplace/groups/${placeId}`,
        `${API_BASE}/api/marketplace/groups/${shortId}`,
        `${API_BASE}/api/listings/${placeId}`,
        `${API_BASE}/api/listings/${shortId}`,
        `${API_BASE}/api/marketplace/listings/${placeId}`,
        `${API_BASE}/api/marketplace/listings/${shortId}`,
      ];
    }

    // services/jobs/housing/products
    return [
      `${API_BASE}/api/listings/${placeId}`,
      `${API_BASE}/api/listings/${shortId}`,

      `${API_BASE}/api/marketplace/listings/${placeId}`,
      `${API_BASE}/api/marketplace/listings/${shortId}`,

      `${API_BASE}/api/listings?type=${encodeURIComponent(kind)}&id=${placeId}`,
      `${API_BASE}/api/listings?type=${encodeURIComponent(kind)}&id=${shortId}`,
    ];
  }, [kind, placeId, shortId]);
  // ✅ Reviews for ALL kinds (places/groups/services/jobs/housing/products) with fallback
  const reviewsCandidates = useMemo(() => {
    const k = encodeURIComponent(kind);
    return [
      // community legacy
      `${API_BASE}/api/community/${k}/${placeId}/reviews`,
      `${API_BASE}/api/community/${k}/${shortId}/reviews`,

      // marketplace
      `${API_BASE}/api/marketplace/${k}/${placeId}/reviews`,
      `${API_BASE}/api/marketplace/${k}/${shortId}/reviews`,

      // unified listings
      `${API_BASE}/api/listings/${placeId}/reviews`,
      `${API_BASE}/api/listings/${shortId}/reviews`,
      `${API_BASE}/api/marketplace/listings/${placeId}/reviews`,
      `${API_BASE}/api/marketplace/listings/${shortId}/reviews`,
    ];
  }, [kind, placeId, shortId]);

  const reviewMeCandidates = useMemo(() => {
    const k = encodeURIComponent(kind);
    return [
      // community legacy
      `${API_BASE}/api/community/${k}/${placeId}/reviews/me`,
      `${API_BASE}/api/community/${k}/${shortId}/reviews/me`,

      // marketplace
      `${API_BASE}/api/marketplace/${k}/${placeId}/reviews/me`,
      `${API_BASE}/api/marketplace/${k}/${shortId}/reviews/me`,

      // unified listings
      `${API_BASE}/api/listings/${placeId}/reviews/me`,
      `${API_BASE}/api/listings/${shortId}/reviews/me`,
      `${API_BASE}/api/marketplace/listings/${placeId}/reviews/me`,
      `${API_BASE}/api/marketplace/listings/${shortId}/reviews/me`,
    ];
  }, [kind, placeId, shortId]);

  // ✅ we store the actual working endpoints we discovered
  const [reviewsBaseUrl, setReviewsBaseUrl] = useState("");
  const [reviewMeBaseUrl, setReviewMeBaseUrl] = useState("");
  // ✅ resolved working endpoints (from fetchReviews)
  const reviewsUrl = reviewsBaseUrl || "";
  const reviewMeUrl = reviewMeBaseUrl || "";

  const fetchPlace = async () => {
    try {
      setLoading(true);

      const out = await fetchFirstOk(detailsCandidates, {
        headers: { ...authHeaders() },
      });

      // console.group("📦 FETCH PLACE DEBUGده");
      // console.log("kind:ده", kind);
      // console.log("placeId:ده", placeId);
      // console.log("shortId:ده", shortId);
      // console.log("endpoint used:ده", out.url);
      // console.log("RAW DATA FROM API >>> ده", out.data);
      console.groupEnd();

      if (!out.ok) throw new Error(out.error || "Failed to load details");

      const normalized = normalizeToPlaceShape(out.data, kind);

      // console.group("🧩 NORMALIZED DATA ده");
      // console.log("NORMALIZED >>> ده", normalized);
      console.groupEnd();

      setPlace(normalized);
    } catch (e) {
      notify.error(e?.message || "Failed to load details");
      setPlace(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);

      const out = await fetchFirstOk(reviewsCandidates, {
        headers: { ...authHeaders() },
      });

      if (!out.ok) {
        setReviews([]);
        setReviewsBaseUrl("");
        setReviewMeBaseUrl("");
        return;
      }

      const list = Array.isArray(out.data) ? out.data : out.data?.reviews || [];
      setReviews(Array.isArray(list) ? list : []);

      setReviewsBaseUrl(out.url || "");

      // guess the /me endpoint based on the working reviews url
      const guessMe = (out.url || "").replace(/\/reviews\/?$/, "/reviews/me");
      setReviewMeBaseUrl(guessMe || "");
    } catch (e) {
      notify.error(e?.message || "Failed to load reviews");
      setReviews([]);
      setReviewsBaseUrl("");
      setReviewMeBaseUrl("");
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchMe = async () => {
    if (!isLoggedIn()) {
      setMe(null);
      return;
    }

    const boot =
      normalizeMe(getMeFromStorageFallback()) ||
      normalizeMe(getMeFromTokenFallback());
    if (!me && boot) setMe(boot);

    try {
      setMeLoading(true);
      const res = await fetch(`${API_BASE}/api/profile/me`, {
        headers: { ...authHeaders() },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (boot) setMe(boot);
        return;
      }
      setMe(normalizeMe(data) || boot);
    } catch {
      setMe(boot || null);
    } finally {
      setMeLoading(false);
    }
  };

  useEffect(() => {
    fetchPlace();
    fetchReviews();
    fetchMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeId, navType]);

  // ✅ Detect myReview by id OR name
  useEffect(() => {
    if (!effectiveMe) {
      setMyReview(null);
      setShowReviewForm(false);
      return;
    }

    const myId = effectiveMe?.id ? String(effectiveMe.id) : null;
    const myName = normName(effectiveMe?.username);

    const mineById =
      myId &&
      (reviews.find((r) => String(r.user_id) === myId) ||
        reviews.find((r) => String(r.userId) === myId) ||
        reviews.find((r) => String(r.user?.id) === myId) ||
        reviews.find((r) => String(r.user?.user_id) === myId));

    const mineByName =
      !mineById &&
      myName &&
      reviews.find((r) => {
        const rn = normName(
          r.username ||
            r.name ||
            r.user_name ||
            r.user?.username ||
            r.user?.name
        );
        return rn && rn === myName;
      });

    const mine = mineById || mineByName || null;

    setMyReview(mine);

    if (mine) {
      setRStars(Number(mine.stars) || 5);
      setRText(mine.text || "");
      setShowReviewForm(false);
    } else {
      setRStars(5);
      setRText("");
      setShowReviewForm(true);
    }
  }, [reviews, effectiveMe]);

  const submitOrUpdateReview = async () => {
    if (!isLoggedIn()) return requireLogin();

    const text = rText.trim();
    const stars = Number(rStars);

    if (!text) return notify.error("اكتب رأيك");
    if (!(stars >= 1 && stars <= 5)) return notify.error("Stars must be 1..5");

    // ✅ build prefixed id if needed: groups -> group_1, places -> place_10, services -> service_3 ...
    const pid = String(placeId || "").trim();
    const sid = String(shortId || "").trim();
    const hasPrefix = pid.includes("_");

    // map plural -> singular (groups -> group, places -> place, services -> service)
    const singular =
      kind === "groups"
        ? "group"
        : kind === "places"
        ? "place"
        : kind === "services"
        ? "service"
        : kind; // jobs/housing/products usually already plural in ids

    const prefId = hasPrefix ? pid : `${singular}_${sid || pid}`;

    // ✅ prefer unified listings endpoints first
    const kEnc = encodeURIComponent(kind);

    // ✅ for places/groups: prefer legacy numeric endpoints first (they often reject place_18 on POST)
    const postUrls =
      kind === "places" || kind === "groups"
        ? [
            // ✅ legacy (best for POST on old schema)
            `${API_BASE}/api/community/${kEnc}/${sid}/reviews`,
            `${API_BASE}/api/community/${kEnc}/${pid}/reviews`,

            // ✅ unified numeric (some servers accept only numeric)
            `${API_BASE}/api/listings/${sid}/reviews`,
            `${API_BASE}/api/marketplace/listings/${sid}/reviews`,

            // ✅ unified prefixed (last)
            `${API_BASE}/api/listings/${prefId}/reviews`,
            `${API_BASE}/api/marketplace/listings/${prefId}/reviews`,
          ]
        : [
            // ✅ for marketplace types prefer unified first
            `${API_BASE}/api/listings/${prefId}/reviews`,
            `${API_BASE}/api/listings/${pid}/reviews`,
            `${API_BASE}/api/listings/${sid}/reviews`,
            `${API_BASE}/api/marketplace/listings/${prefId}/reviews`,
            `${API_BASE}/api/marketplace/listings/${pid}/reviews`,
            `${API_BASE}/api/marketplace/listings/${sid}/reviews`,
          ];
    // ✅ some backends require PUT for update
    // const methods = myReview ? ["PUT", "POST"] : ["POST", "PUT"];
    const methods = ["POST"];

    // ✅ if server needs review id for PUT
    const reviewId =
      myReview?.id ||
      myReview?.review_id ||
      myReview?._id ||
      myReview?.rid ||
      null;

    const payload = {
      // ✅ rating fields (different servers name it differently)
      stars,
      rating: stars,
      score: stars,

      // ✅ text fields
      text,
      comment: text,
      body: text,
      message: text,

      // ✅ ids + type (helps many backends validate)
      id: sid || pid,
      itemId: sid || pid,
      placeId: sid || pid,
      listingId: sid || pid,
      targetId: sid || pid,

      prefixedId: prefId,
      listing_id: sid || pid,
      kind,
      type: kind,
      listing_type: kind,
    };
    const tryOne = async (url, m) => {
      const res = await fetch(url, {
        method: m,
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      return { res, data };
    };

    const tryOneWithId = async (url) => {
      // /reviews/:reviewId style
      const u = reviewId ? `${url}/${reviewId}` : url;
      const res = await fetch(u, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      return { res, data };
    };

    let lastErr = null;

    try {
      // 1) try normal POST/PUT
      // 1) try normal endpoints (POST/PUT)
      for (const u of postUrls) {
        for (const m of methods) {
          try {
            const { res, data } = await tryOne(u, m);
            if (res.status === 401) return requireLogin();

            if (res.ok) {
              notify.success(myReview ? "Review updated" : "Review added");
              await fetchReviews();
              setShowReviewForm(false);
              return;
            }

            console.log("[review] failed:", {
              url: u,
              method: m,
              status: res.status,
              data,
            });

            lastErr =
              data?.error ||
              data?.message ||
              data?.details ||
              (typeof data === "string" ? data : JSON.stringify(data)) ||
              `HTTP ${res.status}`;
          } catch (e) {
            lastErr = e?.message || "Network error";
          }
        }
      }

      // 2) if backend requires /reviews/:reviewId for update, try it
      if (reviewId) {
        for (const u of postUrls) {
          try {
            const res = await fetch(`${u}/${reviewId}`, {
              method: "POST",
              headers: { "Content-Type": "application/json", ...authHeaders() },
              body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));
            if (res.status === 401) return requireLogin();

            if (res.ok) {
              notify.success("Review updated");
              await fetchReviews();
              setShowReviewForm(false);
              return;
            }

            console.log("[review:/id] failed:", {
              url: `${u}/${reviewId}`,
              status: res.status,
              data,
            });

            lastErr =
              data?.error ||
              data?.message ||
              data?.details ||
              (typeof data === "string" ? data : JSON.stringify(data)) ||
              `HTTP ${res.status}`;
          } catch (e) {
            lastErr = e?.message || "Network error";
          }
        }
      }

      throw new Error(lastErr || "Failed to save review");
    } catch (e) {
      notify.error(e?.message || "Failed to save review");
    }
  };

  const startEditMyReview = () => {
    if (!myReview) return;
    setRStars(Number(myReview.stars) || 5);
    setRText(myReview.text || "");
    setShowReviewForm(true);
  };

  const cancelEdit = () => {
    if (myReview) {
      setRStars(Number(myReview.stars) || 5);
      setRText(myReview.text || "");
      setShowReviewForm(false);
    } else {
      setRStars(5);
      setRText("");
      setShowReviewForm(true);
    }
  };

  const deleteMyReview = async () => {
    if (!isLoggedIn()) return requireLogin();

    // ✅ build delete candidates (try many, because backends differ)
    const pid = String(placeId || "").trim();
    const sid = String(shortId || "").trim();
    const hasPrefix = pid.includes("_");

    const singular =
      kind === "groups"
        ? "group"
        : kind === "places"
        ? "place"
        : kind === "services"
        ? "service"
        : kind;

    const prefId = hasPrefix ? pid : `${singular}_${sid || pid}`;

    const reviewId =
      myReview?.id ||
      myReview?.review_id ||
      myReview?._id ||
      myReview?.rid ||
      null;

    const kEnc = encodeURIComponent(kind);

    const deleteUrls = [
      // ✅ explicit /me endpoints
      ...reviewMeCandidates,

      // ✅ derived from working reviews url (if found)
      ...(reviewsUrl
        ? [reviewsUrl.replace(/\/reviews\/?$/, "/reviews/me")]
        : []),

      // ✅ some servers delete by /reviews/:id
      ...(reviewId
        ? [
            `${API_BASE}/api/listings/${prefId}/reviews/${reviewId}`,
            `${API_BASE}/api/listings/${pid}/reviews/${reviewId}`,
            `${API_BASE}/api/listings/${sid}/reviews/${reviewId}`,
            `${API_BASE}/api/marketplace/listings/${prefId}/reviews/${reviewId}`,
            `${API_BASE}/api/marketplace/listings/${pid}/reviews/${reviewId}`,
            `${API_BASE}/api/marketplace/listings/${sid}/reviews/${reviewId}`,
            `${API_BASE}/api/community/${kEnc}/${sid}/reviews/${reviewId}`,
            `${API_BASE}/api/community/${kEnc}/${pid}/reviews/${reviewId}`,
            `${API_BASE}/api/marketplace/${kEnc}/${sid}/reviews/${reviewId}`,
            `${API_BASE}/api/marketplace/${kEnc}/${pid}/reviews/${reviewId}`,
          ]
        : []),
    ].filter(Boolean);

    // ✅ تأكيد إن الكليك وصل للدالة

    const ok = await toastConfirm({
      title: "تأكيد الحذف",
      message: "متأكد عايز تمسح الريفيو بتاعك؟",
      confirmText: "مسح",
      cancelText: "إلغاء",
    });

    // console.log("[deleteMyReview] confirm result:", ok);

    if (!ok) return;
    const loadingId = notify.loading("Deleting…");

    try {
      let lastErr = null;

      for (const u of deleteUrls) {
        try {
          const res = await fetch(u, {
            method: "DELETE",
            headers: { ...authHeaders() },
          });

          const data = await res.json().catch(() => ({}));

          if (res.status === 401) return requireLogin();

          if (res.ok) {
            notify.dismiss(loadingId);
            notify.success("Review deleted");

            setMyReview(null);
            setShowReviewForm(true);
            setRStars(5);
            setRText("");

            await fetchReviews();
            return;
          }

          console.log("[delete review] failed:", {
            url: u,
            status: res.status,
            data,
          });

          lastErr =
            data?.error ||
            data?.message ||
            (typeof data === "string" ? data : JSON.stringify(data)) ||
            `HTTP ${res.status}`;
        } catch (e) {
          lastErr = e?.message || "Network error";
        }
      }

      throw new Error(lastErr || "Failed to delete review");
    } catch (e) {
      notify.dismiss(loadingId);
      notify.error(e?.message || "Failed to delete review");
    }
  };

  const isReviewMine = (r) => {
    if (!effectiveMe) return false;

    const myId = effectiveMe?.id ? String(effectiveMe.id) : null;
    const myName = normName(effectiveMe?.username);

    const rid =
      r?.user_id || r?.userId || r?.user?.id || r?.user?.user_id || null;
    if (myId && rid && String(rid) === myId) return true;

    const rn = normName(
      r?.username ||
        r?.name ||
        r?.user_name ||
        r?.user?.username ||
        r?.user?.name
    );
    if (myName && rn && rn === myName) return true;

    return false;
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl p-4 md:p-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          Loading…
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="mx-auto max-w-5xl p-4 md:p-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Link
              to="/community"
              className="inline-flex items-center gap-2 text-sm text-gray-700 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </div>
          Place not found.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      {/* Top bar */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          to="/community"
          className="inline-flex items-center gap-2 text-sm text-gray-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Community
        </Link>

        <a
          href={openMapUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm text-white hover:opacity-90"
        >
          <ExternalLink className="h-4 w-4" /> Open Map
        </a>
      </div>

      {/* Place card */}
      <div className="rounded-2xl border bg-white p-5 md:p-6 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          {/* Left info */}
          <div className="min-w-0 flex-1">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-gray-50 px-3 py-1 text-xs text-gray-700">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              {place.category || "Place"}
              <span className="text-gray-300">•</span>
              {place.city || "—"}, {place.state || "—"}
            </div>

            <h1 className="text-xl md:text-2xl font-semibold text-gray-900 break-words">
              {place.name}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-700">
              <span className="inline-flex items-center gap-2 rounded-xl bg-gray-50 border px-3 py-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                {[place.address, place.city, place.state, place.zip]
                  .filter(Boolean)
                  .join(", ")}
              </span>
              {!isPlaceType && displayPrice ? (
                <span className="inline-flex items-center gap-2 rounded-xl bg-gray-50 border px-3 py-2">
                  <span className="text-xs font-semibold text-gray-600">
                    Price
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    ${displayPrice}
                  </span>
                </span>
              ) : null}

              {!isPlaceType && displayLink ? (
                <a
                  className="inline-flex items-center gap-2 rounded-xl bg-gray-50 border px-3 py-2 hover:bg-gray-100"
                  href={displayLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="h-4 w-4 text-gray-500" />
                  Open link
                </a>
              ) : null}

              {!isPlaceType && displayContact ? (
                <a
                  className="inline-flex items-center gap-2 rounded-xl bg-gray-50 border px-3 py-2 hover:bg-gray-100"
                  href={`tel:${String(displayContact).replace(/\s+/g, "")}`}
                >
                  <Phone className="h-4 w-4 text-gray-500" />
                  {displayContact}
                </a>
              ) : null}

              {place.phone ? (
                <a
                  className="inline-flex items-center gap-2 rounded-xl bg-gray-50 border px-3 py-2 hover:bg-gray-100"
                  href={`tel:${String(place.phone).replace(/\s+/g, "")}`}
                >
                  <Phone className="h-4 w-4 text-gray-500" />
                  {place.phone}
                </a>
              ) : null}
            </div>

            {place.description ? (
              <p className="mt-4 text-sm leading-6 text-gray-700">
                {place.description}
              </p>
            ) : null}
            {!place.description && place.notes ? (
              <p className="mt-4 text-sm leading-6 text-gray-700">
                {place.notes}
              </p>
            ) : null}
          </div>

          {/* Right rating card */}
          <div className="w-full md:w-[340px] shrink-0">
            <div className="rounded-2xl border bg-gradient-to-b from-gray-50 to-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    Rating
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="inline-flex items-center justify-center rounded-2xl bg-black text-white px-3 py-2">
                      <div className="text-2xl font-extrabold leading-none">
                        {avgRating ? avgRating.toFixed(1) : "0.0"}
                      </div>
                    </div>
                    <div className="mt-1">
                      <StarsReadOnly
                        value={avgRating}
                        size={20}
                        showValue={false}
                      />
                      <div className="text-xs text-gray-600 mt-1">
                        {reviews.length} review{reviews.length === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1 rounded-xl border bg-white px-3 py-2 text-xs text-gray-700">
                  <Sparkles className="h-4 w-4" />
                  Verified
                </div>
              </div>

              <RatingBreakdown reviews={reviews} />

              <div className="mt-4 grid grid-cols-2 gap-2">
                <a
                  href={openMapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-3 py-2 text-sm text-white hover:opacity-90"
                >
                  <MapPin className="h-4 w-4" /> Directions
                </a>

                {place.phone ? (
                  <a
                    href={`tel:${String(place.phone).replace(/\s+/g, "")}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    <Phone className="h-4 w-4" /> Call
                  </a>
                ) : (
                  <button
                    disabled
                    className="inline-flex items-center justify-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm opacity-50"
                  >
                    <Phone className="h-4 w-4" /> Call
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews + Add/Update */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-5">
        {/* List */}
        <div className="md:col-span-3">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Reviews</h2>
              <button
                onClick={fetchReviews}
                className="text-sm text-gray-700 hover:underline"
              >
                Refresh
              </button>
            </div>

            {reviewsLoading ? (
              <div className="mt-4 text-sm text-gray-600">Loading reviews…</div>
            ) : reviews.length === 0 ? (
              <div className="mt-4 text-sm text-gray-600">No reviews yet.</div>
            ) : (
              <div className="mt-4 space-y-3">
                {reviews.map((r) => {
                  const isMine = isReviewMine(r);

                  // console.log("USER ID >>> ده", r.user_id || r.userId);

                  const safeKey =
                    r.id ||
                    `${r.user_id || r.userId || r.user?.id || "u"}-${
                      r.created_at || "t"
                    }-${r.stars || "s"}`;

                  return (
                    <div
                      key={safeKey}
                      className={cn(
                        "rounded-2xl border p-4 transition",
                        isMine
                          ? "border-black/20 bg-gray-50"
                          : "hover:bg-gray-50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-semibold text-gray-900 text-sm break-words">
                              {r.username ||
                                r.name ||
                                r.user_name ||
                                r.user?.username ||
                                r.user?.name ||
                                "User"}
                            </div>

                            {isMine ? (
                              <span className="inline-flex items-center rounded-full bg-black text-white px-2 py-0.5 text-[11px] font-semibold">
                                Your review
                              </span>
                            ) : null}

                            <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 border px-2 py-0.5">
                              <StarsReadOnly
                                value={Number(r.stars || 0)}
                                size={14}
                                showValue={false}
                              />
                              <span className="text-xs font-semibold text-gray-700">
                                {Number(r.stars || 0)}/5
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-xs text-gray-500 whitespace-nowrap">
                            {safeDateToLocaleString(r.created_at)}
                          </div>

                          {isMine && isLoggedIn() ? (
                            <button
                              onClick={startEditMyReview}
                              className="inline-flex items-center gap-1 rounded-lg border bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                              title="Edit your review"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-gray-700">
                        {r.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ✅ If has review and clicked Edit => show form under list */}
          {isLoggedIn() && myReview && showReviewForm ? (
            <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MessageSquarePlus className="h-4 w-4 text-gray-700" />
                  <h2 className="text-base font-semibold text-gray-900">
                    Edit your review
                  </h2>
                </div>

                <button
                  onClick={cancelEdit}
                  className="inline-flex items-center gap-1 rounded-lg border bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                  title="Cancel"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border bg-gray-50 p-3">
                  <div className="text-xs font-semibold text-gray-700">
                    You are reviewing as
                  </div>
                  <div className="mt-1 text-sm font-semibold text-gray-900">
                    {meLoading ? "Loading…" : displayUserName(effectiveMe)}
                  </div>
                </div>

                <div className="rounded-2xl border bg-gray-50 p-3">
                  <div className="text-xs font-semibold text-gray-700 mb-2">
                    Your rating
                  </div>
                  <StarsPicker value={rStars} onChange={setRStars} size={24} />
                  <div className="mt-2 text-xs text-gray-600">
                    Selected: <span className="font-semibold">{rStars}</span>/5
                  </div>
                </div>

                <textarea
                  value={rText}
                  onChange={(e) => setRText(e.target.value)}
                  placeholder="Write your review…"
                  rows={5}
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                />

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={submitOrUpdateReview}
                    className="w-full rounded-xl bg-black px-4 py-2 text-sm text-white hover:opacity-90"
                  >
                    Update review
                  </button>
                  <button
                    onClick={deleteMyReview}
                    className="w-full rounded-xl border bg-white px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>

                <p className="text-xs text-gray-500">
                  Tip: قول رأيك بوضوح: جودة الخدمة، الأسعار، المكان، التعامل.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Right column: Add review OR Your review */}
        <div className="md:col-span-2">
          {!myReview ? (
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MessageSquarePlus className="h-4 w-4 text-gray-700" />
                  <h2 className="text-base font-semibold text-gray-900">
                    Add a review
                  </h2>
                </div>

                {!isLoggedIn() ? (
                  <div className="inline-flex items-center gap-1 text-xs text-gray-600">
                    <Lock className="h-4 w-4" /> Login required
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 text-xs text-gray-600">
                    <Pencil className="h-4 w-4" /> One review per user
                  </div>
                )}
              </div>

              {!isLoggedIn() ? (
                <div className="mt-4 rounded-2xl border bg-gray-50 p-4">
                  <div className="text-sm text-gray-700">
                    لازم تعمل تسجيل دخول عشان تقدر تسيب تقييم.
                  </div>
                  <button
                    onClick={() => navigate("/auth")}
                    className="mt-3 w-full rounded-xl bg-black px-4 py-2 text-sm text-white hover:opacity-90"
                  >
                    Go to Login
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <div className="text-sm font-semibold text-gray-900">
                    Write a review
                  </div>

                  <div className="rounded-2xl border bg-gray-50 p-3">
                    <div className="text-xs font-semibold text-gray-700">
                      You are reviewing as
                    </div>
                    <div className="mt-1 text-sm font-semibold text-gray-900">
                      {meLoading ? "Loading…" : displayUserName(effectiveMe)}
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-gray-50 p-3">
                    <div className="text-xs font-semibold text-gray-700 mb-2">
                      Your rating
                    </div>
                    <StarsPicker
                      value={rStars}
                      onChange={setRStars}
                      size={24}
                    />
                    <div className="mt-2 text-xs text-gray-600">
                      Selected: <span className="font-semibold">{rStars}</span>
                      /5
                    </div>
                  </div>

                  <textarea
                    value={rText}
                    onChange={(e) => setRText(e.target.value)}
                    placeholder="Write your review…"
                    rows={5}
                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                  />

                  <button
                    onClick={submitOrUpdateReview}
                    className="w-full rounded-xl bg-black px-4 py-2 text-sm text-white hover:opacity-90"
                  >
                    Submit review
                  </button>

                  <p className="text-xs text-gray-500">
                    Tip: قول رأيك بوضوح: جودة الخدمة، الأسعار، المكان، التعامل.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">
                  Your review
                </h3>
                <button
                  onClick={startEditMyReview}
                  className="inline-flex items-center gap-1 rounded-lg border bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
              </div>

              <div className="mt-3 rounded-2xl border bg-gray-50 p-3">
                <div className="text-xs text-gray-600">Rating</div>
                <div className="mt-1">
                  <StarsReadOnly
                    value={Number(myReview?.stars || 0)}
                    size={18}
                  />
                </div>
                <div className="mt-3 text-xs text-gray-600">Comment</div>
                <div className="mt-1 text-sm text-gray-800 break-words">
                  {myReview?.text || "—"}
                </div>
              </div>

              <button
                onClick={deleteMyReview}
                className="mt-4 w-full rounded-xl border bg-white px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Delete review
              </button>

              <p className="mt-3 text-xs text-gray-500">
                Tip: لو غيرت رأيك، دوس Edit وعدّل الريفيو.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
