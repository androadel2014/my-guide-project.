// src/components/community/CardItem.jsx
import React, { useMemo, useState } from "react";
import {
  MapPin,
  Globe,
  Phone,
  Users,
  Building2,
  Pencil,
  Trash2,
  ExternalLink,
  Navigation,
  MessageCircle,
  Star,
  Briefcase,
  Home,
  Boxes,
  Hammer,
  Wrench,
  MoreVertical,
} from "lucide-react";

/* =========================
   Helpers
========================= */

function classNames(...arr) {
  return arr.filter(Boolean).join(" ");
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

function parseDateLike(v) {
  if (!v) return null;
  const d1 = new Date(v);
  if (!Number.isNaN(d1.getTime())) return d1;

  const n = Number(v);
  if (!Number.isNaN(n) && n > 0) {
    const ms = n < 1e12 ? n * 1000 : n;
    const d2 = new Date(ms);
    if (!Number.isNaN(d2.getTime())) return d2;
  }
  return null;
}

function pickCreatedAt(it) {
  return (
    it.createdAt ??
    it.created_at ??
    it.created ??
    it.created_on ??
    it.insertedAt ??
    it.inserted_at ??
    it.time ??
    it.timestamp ??
    null
  );
}

function timeAgo(date) {
  const d = parseDateLike(date);
  if (!d) return "";

  const diffMs = Date.now() - d.getTime();
  if (diffMs < 0) return "just now";

  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "just now";

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;

  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;

  const wk = Math.floor(day / 7);
  if (wk < 5) return `${wk}w ago`;

  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;

  const yr = Math.floor(day / 365);
  return `${yr}y ago`;
}

function isNewByDate(date, hours = 48) {
  const d = parseDateLike(date);
  if (!d) return false;
  const diffMs = Date.now() - d.getTime();
  return diffMs >= 0 && diffMs <= hours * 60 * 60 * 1000;
}

/* =========================
   Banners
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
    Icon: Hammer,
    bg: "from-orange-50 to-orange-100 border-orange-200",
    icon: "bg-orange-600",
  },
  cafe: {
    label: "Cafe",
    Icon: Hammer,
    bg: "from-amber-50 to-amber-100 border-amber-200",
    icon: "bg-amber-600",
  },
  bakery: {
    label: "Bakery",
    Icon: Hammer,
    bg: "from-yellow-50 to-yellow-100 border-yellow-200",
    icon: "bg-yellow-600",
  },
  grocery: {
    label: "Grocery / Arab Market",
    Icon: Boxes,
    bg: "from-sky-50 to-sky-100 border-sky-200",
    icon: "bg-sky-600",
  },
  todo: {
    label: "Things to do",
    Icon: Star,
    bg: "from-fuchsia-50 to-fuchsia-100 border-fuchsia-200",
    icon: "bg-fuchsia-600",
  },
  park: {
    label: "Park / Outdoors",
    Icon: Star,
    bg: "from-green-50 to-green-100 border-green-200",
    icon: "bg-green-600",
  },
  attraction: {
    label: "Attraction",
    Icon: Star,
    bg: "from-violet-50 to-violet-100 border-violet-200",
    icon: "bg-violet-600",
  },
  mosque: {
    label: "Mosque",
    Icon: Building2,
    bg: "from-emerald-50 to-emerald-100 border-emerald-200",
    icon: "bg-emerald-600",
  },
  church: {
    label: "Church",
    Icon: Building2,
    bg: "from-indigo-50 to-indigo-100 border-indigo-200",
    icon: "bg-indigo-600",
  },
  school: {
    label: "School / Daycare",
    Icon: Building2,
    bg: "from-blue-50 to-blue-100 border-blue-200",
    icon: "bg-blue-600",
  },
  clinic: {
    label: "Clinic / Doctor",
    Icon: Building2,
    bg: "from-red-50 to-red-100 border-red-200",
    icon: "bg-red-600",
  },
  lawyer: {
    label: "Lawyer / Immigration",
    Icon: Building2,
    bg: "from-slate-50 to-slate-100 border-slate-200",
    icon: "bg-slate-700",
  },
  car: {
    label: "Car Services",
    Icon: Wrench,
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
    Icon: Wrench,
    bg: "from-pink-50 to-pink-100 border-pink-200",
    icon: "bg-pink-600",
  },
  shopping: {
    label: "Shopping / Mall",
    Icon: Boxes,
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

const TYPE_BANNER = {
  services: {
    label: "Service",
    Icon: Hammer,
    bg: "from-teal-50 to-teal-100 border-teal-200",
    icon: "bg-teal-700",
  },
  jobs: {
    label: "Job",
    Icon: Briefcase,
    bg: "from-slate-50 to-slate-100 border-slate-200",
    icon: "bg-slate-800",
  },
  housing: {
    label: "Housing",
    Icon: Home,
    bg: "from-amber-50 to-amber-100 border-amber-200",
    icon: "bg-amber-700",
  },
  products: {
    label: "Product",
    Icon: Boxes,
    bg: "from-zinc-50 to-zinc-100 border-zinc-200",
    icon: "bg-zinc-900",
  },
};

function CardBanner({ tab, placeCategory, groupPlatform, subtitleRight }) {
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
   ✅ CardItem
========================= */

export function CardItem({ tab, it, isLoggedIn, onEdit, onDelete, onOpen }) {
  const [open, setOpen] = useState(false);

  const cardClickable = typeof onOpen === "function";

  const t = tab === "all" ? it.type || "places" : tab;
  const isPlace = t === "places";
  const isGroup = t === "groups";

  const placeMapUrl = isPlace
    ? mapsLink({ address: it.address, city: it.city, state: it.state })
    : "";

  const locText =
    [it.city, it.state].filter(Boolean).join(", ") || "Location not set";

  const typeChip = t;

  const badgeChip = isGroup
    ? it.topic || it.platform || ""
    : it.category || it.platform || "";

  const ratingRaw =
    it.avg_rating ??
    it.rating_avg ??
    it.avgRating ??
    it.avg_rating_value ??
    it.rating ??
    it.stars ??
    it.score ??
    0;

  const reviewsRaw =
    it.reviews_count ??
    it.review_count ??
    it.reviewsCount ??
    it.reviewCount ??
    it.ratings_count ??
    it.rating_count ??
    it.count ??
    0;

  const rating = Number(ratingRaw) || 0;
  const reviewsCount = Number(reviewsRaw) || 0;

  const ratingText = rating > 0 ? rating.toFixed(1) : "New";

  const titleText = it.name || it.title || "Untitled";
  const priceValue = it.price_value;
  const createdAtVal = pickCreatedAt(it);
  const createdAgo = timeAgo(createdAtVal);
  const isNew = isNewByDate(createdAtVal, 48);

  const rightSubtitle =
    t !== "places" && t !== "groups" && (it.price || it.budget)
      ? String(it.price || it.budget)
      : t === "groups"
      ? it.platform || ""
      : it.category || "";

  return (
    <div
      role={cardClickable ? "button" : undefined}
      tabIndex={cardClickable ? 0 : undefined}
      onClick={() => cardClickable && onOpen()}
      onKeyDown={(e) => {
        if (!cardClickable) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={classNames(
        "rounded-2xl relative border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition hover:ring-2 hover:ring-black/5",
        cardClickable ? "cursor-pointer" : ""
      )}
    >
      <CardBanner
        tab={tab === "all" ? it.type || "places" : tab}
        placeCategory={it.category}
        groupPlatform={it.platform}
        subtitleRight={rightSubtitle}
      />

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-base md:text-lg font-extrabold text-gray-900 truncate">
              {titleText}
            </div>

            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-gray-200 text-gray-700">
              {typeChip}
            </span>

            {badgeChip ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-gray-200 text-gray-700">
                {badgeChip}
              </span>
            ) : null}

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold border border-gray-200 bg-gray-50 text-gray-900">
              <Star size={14} className="text-amber-500" />
              {ratingText}
              {reviewsCount > 0 ? (
                <span className="text-xs font-semibold text-gray-600">
                  ({reviewsCount})
                </span>
              ) : null}
            </span>

            {createdAgo ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 border border-gray-200 text-gray-700">
                {createdAgo}
              </span>
            ) : null}

            {priceValue ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 border border-gray-200 text-gray-700">
                {priceValue}
              </span>
            ) : null}

            {isNew ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-50 border border-emerald-200 text-emerald-700">
                NEW
              </span>
            ) : null}
          </div>

          <div className="mt-2 text-sm text-gray-700 space-y-1">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-gray-500" />
              <span className="truncate">{locText}</span>
            </div>

            {isPlace && it.address && placeMapUrl ? (
              <a
                href={placeMapUrl}
                target="_blank"
                rel="noreferrer"
                className="text-gray-600 truncate hover:underline"
              >
                {it.address}
              </a>
            ) : null}

            {isGroup ? (
              <div className="text-gray-600">{it.topic || "General"}</div>
            ) : null}

            {!isPlace && !isGroup && it.description ? (
              <div className="text-gray-600 line-clamp-2">{it.description}</div>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {isPlace && placeMapUrl ? (
              <a
                href={placeMapUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50"
              >
                <Navigation size={16} />
                Open Map
                <ExternalLink size={14} className="text-gray-500" />
              </a>
            ) : null}

            {isPlace && it.website ? (
              <a
                href={safeUrl(it.website)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50"
              >
                <Globe size={16} />
                Website
                <ExternalLink size={14} className="text-gray-500" />
              </a>
            ) : null}

            {isPlace && it.phone ? (
              <a
                href={`tel:${String(it.phone).replace(/\s+/g, "")}`}
                className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50"
              >
                <Phone size={16} />
                {it.phone}
              </a>
            ) : null}

            {isGroup && it.link ? (
              <a
                href={safeUrl(it.link)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50"
              >
                <Globe size={16} />
                Open Link
                <ExternalLink size={14} className="text-gray-500" />
              </a>
            ) : null}

            {!isPlace && !isGroup && it.link ? (
              <a
                href={safeUrl(it.link)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50"
              >
                <Globe size={16} />
                Open
                <ExternalLink size={14} className="text-gray-500" />
              </a>
            ) : null}

            {!isPlace && !isGroup && it.contact ? (
              <span className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-800">
                <Phone size={16} />
                {it.contact}
              </span>
            ) : null}
          </div>

          {it.notes ? (
            <div className="mt-3 text-sm text-gray-600 whitespace-pre-wrap">
              {it.notes}
            </div>
          ) : null}
        </div>

        {isLoggedIn ? (
          <div className="shrink-0 relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen((v) => !v); // أو سطر فتح/قفل المنيو اللي عندك
              }}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50"
              title="Actions"
            >
              <MoreVertical size={18} />
            </button>

            {open ? (
              <div className="absolute mt-2 right-0 w-44 rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden z-50">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpen(false);
                    onEdit?.();
                  }}
                  className="w-full px-3 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2 text-sm font-semibold"
                >
                  <Pencil size={16} />
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpen(false);
                    onDelete?.();
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
