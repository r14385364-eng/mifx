/**
 * Ikon bendera melingkar untuk tiap simbol produk.
 * Pasangan forex menampilkan dua bendera tumpang-tindih;
 * komoditi/indeks menampilkan satu ikon.
 */

import React from "react";

function FlagAU() {
  return (
    <svg viewBox="0 0 32 32" className="h-full w-full">
      <rect width="32" height="32" fill="#00247D" />
      <rect x="0" y="0" width="16" height="16" fill="#012169" />
      <path d="M0 0 L16 16 M16 0 L0 16" stroke="#FFFFFF" strokeWidth="2.8" />
      <path d="M0 0 L16 16 M16 0 L0 16" stroke="#C8102E" strokeWidth="1.4" />
      <path d="M8 0 V16 M0 8 H16" stroke="#FFFFFF" strokeWidth="4.2" />
      <path d="M8 0 V16 M0 8 H16" stroke="#C8102E" strokeWidth="2.2" />
      <circle cx="8" cy="24" r="2.8" fill="#FFFFFF" />
      <circle cx="24" cy="7" r="1.3" fill="#FFFFFF" />
      <circle cx="28" cy="13" r="1.3" fill="#FFFFFF" />
      <circle cx="20" cy="15" r="1.3" fill="#FFFFFF" />
      <circle cx="25.5" cy="21.5" r="1.1" fill="#FFFFFF" />
      <circle cx="24" cy="26" r="1.5" fill="#FFFFFF" />
    </svg>
  );
}

function FlagCA() {
  return (
    <svg viewBox="0 0 32 32" className="h-full w-full">
      <rect width="32" height="32" fill="#FFFFFF" />
      <rect x="0" y="0" width="8" height="32" fill="#FF0000" />
      <rect x="24" y="0" width="8" height="32" fill="#FF0000" />
      <path
        d="M16 8l1.3 3.2 2.7-1-1 3.2 3.2 1-2.2 2.2 1.6 3-3.2-1-0.4 4h-2l-0.4-4-3.2 1 1.6-3-2.2-2.2 3.2-1-1-3.2 2.7 1z"
        fill="#FF0000"
      />
    </svg>
  );
}

function FlagCH() {
  return (
    <svg viewBox="0 0 32 32" className="h-full w-full">
      <rect width="32" height="32" fill="#D52B1E" />
      <rect x="13" y="7" width="6" height="18" fill="#FFFFFF" rx="0.5" />
      <rect x="7" y="13" width="18" height="6" fill="#FFFFFF" rx="0.5" />
    </svg>
  );
}

function FlagEU() {
  const stars = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return {
      cx: 16 + 9 * Math.sin(rad),
      cy: 16 - 9 * Math.cos(rad),
    };
  });

  return (
    <svg viewBox="0 0 32 32" className="h-full w-full">
      <rect width="32" height="32" fill="#003399" />
      {stars.map((s, idx) => (
        <circle key={idx} cx={s.cx} cy={s.cy} r="1.3" fill="#FFCC00" />
      ))}
    </svg>
  );
}

function FlagGB() {
  return (
    <svg viewBox="0 0 32 32" className="h-full w-full">
      <rect width="32" height="32" fill="#012169" />
      <path d="M0 0 L32 32 M32 0 L0 32" stroke="#FFFFFF" strokeWidth="5.5" />
      <path d="M0 0 L32 32 M32 0 L0 32" stroke="#C8102E" strokeWidth="2.5" />
      <path d="M16 0 V32 M0 16 H32" stroke="#FFFFFF" strokeWidth="8" />
      <path d="M16 0 V32 M0 16 H32" stroke="#C8102E" strokeWidth="4.8" />
    </svg>
  );
}

function FlagHK() {
  return (
    <svg viewBox="0 0 32 32" className="h-full w-full">
      <rect width="32" height="32" fill="#DE2910" />
      <circle cx="16" cy="16" r="3" fill="#FFFFFF" />
      <circle cx="16" cy="10.5" r="2.8" fill="#FFFFFF" />
      <circle cx="21.2" cy="14.3" r="2.8" fill="#FFFFFF" />
      <circle cx="19.2" cy="20.5" r="2.8" fill="#FFFFFF" />
      <circle cx="12.8" cy="20.5" r="2.8" fill="#FFFFFF" />
      <circle cx="10.8" cy="14.3" r="2.8" fill="#FFFFFF" />
      <circle cx="16" cy="16" r="2" fill="#DE2910" />
    </svg>
  );
}

function FlagJP() {
  return (
    <svg viewBox="0 0 32 32" className="h-full w-full">
      <rect width="32" height="32" fill="#FFFFFF" />
      <circle cx="16" cy="16" r="8.5" fill="#BC002D" />
    </svg>
  );
}

function FlagNZ() {
  return (
    <svg viewBox="0 0 32 32" className="h-full w-full">
      <rect width="32" height="32" fill="#00247D" />
      <rect x="0" y="0" width="16" height="16" fill="#012169" />
      <path d="M0 0 L16 16 M16 0 L0 16" stroke="#FFFFFF" strokeWidth="2.8" />
      <path d="M0 0 L16 16 M16 0 L0 16" stroke="#C8102E" strokeWidth="1.4" />
      <path d="M8 0 V16 M0 8 H16" stroke="#FFFFFF" strokeWidth="4.2" />
      <path d="M8 0 V16 M0 8 H16" stroke="#C8102E" strokeWidth="2.2" />
      <circle cx="24" cy="7" r="1.6" fill="#C8102E" stroke="#FFFFFF" strokeWidth="0.8" />
      <circle cx="28" cy="14" r="1.4" fill="#C8102E" stroke="#FFFFFF" strokeWidth="0.8" />
      <circle cx="20" cy="16" r="1.4" fill="#C8102E" stroke="#FFFFFF" strokeWidth="0.8" />
      <circle cx="24" cy="25" r="1.8" fill="#C8102E" stroke="#FFFFFF" strokeWidth="0.8" />
    </svg>
  );
}

function FlagUS() {
  return (
    <svg viewBox="0 0 32 32" className="h-full w-full">
      <rect width="32" height="32" fill="#B22234" />
      <rect y="2.46" width="32" height="2.46" fill="#FFFFFF" />
      <rect y="7.38" width="32" height="2.46" fill="#FFFFFF" />
      <rect y="12.31" width="32" height="2.46" fill="#FFFFFF" />
      <rect y="17.23" width="32" height="2.46" fill="#FFFFFF" />
      <rect y="22.15" width="32" height="2.46" fill="#FFFFFF" />
      <rect y="27.08" width="32" height="2.46" fill="#FFFFFF" />
      <rect width="14" height="15" fill="#3C3B6E" />
      <circle cx="3" cy="3" r="0.8" fill="#FFFFFF" />
      <circle cx="7" cy="3" r="0.8" fill="#FFFFFF" />
      <circle cx="11" cy="3" r="0.8" fill="#FFFFFF" />
      <circle cx="5" cy="5.5" r="0.8" fill="#FFFFFF" />
      <circle cx="9" cy="5.5" r="0.8" fill="#FFFFFF" />
      <circle cx="3" cy="8" r="0.8" fill="#FFFFFF" />
      <circle cx="7" cy="8" r="0.8" fill="#FFFFFF" />
      <circle cx="11" cy="8" r="0.8" fill="#FFFFFF" />
      <circle cx="5" cy="10.5" r="0.8" fill="#FFFFFF" />
      <circle cx="9" cy="10.5" r="0.8" fill="#FFFFFF" />
      <circle cx="3" cy="13" r="0.8" fill="#FFFFFF" />
      <circle cx="7" cy="13" r="0.8" fill="#FFFFFF" />
      <circle cx="11" cy="13" r="0.8" fill="#FFFFFF" />
    </svg>
  );
}

function FlagSG() {
  return (
    <svg viewBox="0 0 32 32" className="h-full w-full">
      <rect y="0" width="32" height="16" fill="#ED2939" />
      <rect y="16" width="32" height="16" fill="#FFFFFF" />
      <circle cx="9" cy="8" r="4.5" fill="#FFFFFF" />
      <circle cx="10.8" cy="8" r="4.2" fill="#ED2939" />
    </svg>
  );
}

function FlagCN() {
  return (
    <svg viewBox="0 0 32 32" className="h-full w-full">
      <rect width="32" height="32" fill="#EE1C25" />
      <circle cx="8" cy="8" r="3.2" fill="#FFDE00" />
      <circle cx="14" cy="4" r="1" fill="#FFDE00" />
      <circle cx="16" cy="7" r="1" fill="#FFDE00" />
      <circle cx="16" cy="11" r="1" fill="#FFDE00" />
      <circle cx="14" cy="14" r="1" fill="#FFDE00" />
    </svg>
  );
}

const flagSvgMap: Record<string, () => React.JSX.Element> = {
  au: FlagAU,
  ca: FlagCA,
  ch: FlagCH,
  eu: FlagEU,
  gb: FlagGB,
  hk: FlagHK,
  jp: FlagJP,
  nz: FlagNZ,
  us: FlagUS,
  sg: FlagSG,
  cn: FlagCN,
};

const currencyToCountry: Record<string, string> = {
  AUD: "au",
  CAD: "ca",
  CHF: "ch",
  EUR: "eu",
  GBP: "gb",
  JPY: "jp",
  NZD: "nz",
  USD: "us",
  SGD: "sg",
  CNY: "cn",
  CNH: "cn",
  HKD: "hk",
};

/** Simbol non-forex yang diwakili satu bendera negara. */
const singleFlag: Record<string, string> = {
  NASDAQ: "us",
  NIKKEI: "jp",
  HANGSENG: "hk",
  SP500: "us",
  DOWJONES: "us",
  DAX: "eu",
  FTSE100: "gb",
  CAC40: "eu",
  ASX200: "au",
};

/** Komoditi/kripto: ikon emoji di dalam lingkaran berwarna. */
const special: Record<string, { emoji: string; bg: string }> = {
  XAUUSD: { emoji: "🪙", bg: "bg-amber-100 border-amber-300 text-amber-800" },
  XAGUSD: { emoji: "🥈", bg: "bg-slate-100 border-slate-300 text-slate-800" },
  OIL: { emoji: "🛢️", bg: "bg-zinc-100 border-zinc-300 text-zinc-800" },
  BRENT: { emoji: "🛢️", bg: "bg-amber-950/10 border-amber-900/30 text-amber-900" },
  NGAS: { emoji: "🔥", bg: "bg-blue-100 border-blue-300 text-blue-800" },
  COPPER: { emoji: "🧱", bg: "bg-orange-100 border-orange-300 text-orange-800" },
  PLATINUM: { emoji: "⚪", bg: "bg-cyan-100 border-cyan-300 text-cyan-800" },
  PALLADIUM: { emoji: "🪙", bg: "bg-purple-100 border-purple-300 text-purple-800" },
  BTCUSD: { emoji: "₿", bg: "bg-amber-500 border-amber-600 text-white font-bold" },
};

/** Nama tampilan yang dipetakan ke simbol produk. */
const aliases: Record<string, string> = {
  GOLD: "XAUUSD",
  SILVER: "XAGUSD",
  BITCOIN: "BTCUSD",
};

function FlagCircle({ country, size }: { country: string; size: number }) {
  const SvgComponent = flagSvgMap[country.toLowerCase()];
  if (!SvgComponent) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-full border border-white/80 bg-muted font-bold uppercase text-muted-foreground shadow-xs"
        style={{ width: size, height: size, fontSize: size * 0.38 }}
      >
        {country.slice(0, 2)}
      </span>
    );
  }

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/90 shadow-xs ring-1 ring-black/5"
      style={{ width: size, height: size }}
    >
      <SvgComponent />
    </span>
  );
}

export function SymbolIcon({ symbol, size = 24 }: { symbol: string; size?: number }) {
  const normalized = aliases[symbol.toUpperCase()] ?? symbol.toUpperCase();
  const specialItem = special[normalized];
  if (specialItem) {
    return (
      <span
        className={`flex shrink-0 items-center justify-center rounded-full border shadow-xs ${specialItem.bg}`}
        style={{ width: size, height: size, fontSize: size * 0.55 }}
      >
        {specialItem.emoji}
      </span>
    );
  }

  const country = singleFlag[symbol.toUpperCase()];
  if (country) {
    return <FlagCircle country={country} size={size} />;
  }

  // Pasangan forex: dua bendera tumpang-tindih.
  const base = currencyToCountry[normalized.slice(0, 3)];
  const quote = currencyToCountry[normalized.slice(3, 6)];
  if (base && quote) {
    return (
      <span
        className="relative isolate inline-flex shrink-0 items-center"
        style={{ width: size * 1.6, height: size }}
      >
        <span className="relative z-[1]">
          <FlagCircle country={base} size={size} />
        </span>
        <span className="relative z-0" style={{ marginLeft: -size * 0.4 }}>
          <FlagCircle country={quote} size={size} />
        </span>
      </span>
    );
  }

  // Cadangan: lingkaran abu-abu.
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground"
      style={{ width: size, height: size }}
    >
      {symbol.slice(0, 2)}
    </span>
  );
}
