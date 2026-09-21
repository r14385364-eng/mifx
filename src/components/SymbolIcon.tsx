/**
 * Ikon bendera melingkar untuk tiap simbol produk.
 * Pasangan forex menampilkan dua bendera tumpang-tindih;
 * komoditi/indeks menampilkan satu ikon.
 */

import flagAu from "@/assets/flags/flag-au.png.asset.json";
import flagCa from "@/assets/flags/flag-ca.png.asset.json";
import flagCh from "@/assets/flags/flag-ch.png.asset.json";
import flagEu from "@/assets/flags/flag-eu.png.asset.json";
import flagGb from "@/assets/flags/flag-gb.png.asset.json";
import flagHk from "@/assets/flags/flag-hk.png.asset.json";
import flagJp from "@/assets/flags/flag-jp.png.asset.json";
import flagNz from "@/assets/flags/flag-nz.png.asset.json";
import flagUs from "@/assets/flags/flag-us.png.asset.json";

const flagByCountry: Record<string, string> = {
  au: flagAu.url,
  ca: flagCa.url,
  ch: flagCh.url,
  eu: flagEu.url,
  gb: flagGb.url,
  hk: flagHk.url,
  jp: flagJp.url,
  nz: flagNz.url,
  us: flagUs.url,
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
};

/** Simbol non-forex yang diwakili satu bendera negara. */
const singleFlag: Record<string, string> = {
  NASDAQ: "us",
  NIKKEI: "jp",
  HANGSENG: "hk",
};

/** Komoditi/kripto: ikon emoji di dalam lingkaran berwarna. */
const special: Record<string, { emoji?: string; img?: string; bg: string }> = {
  XAUUSD: { emoji: "🪙", bg: "bg-amber-100" },
  XAGUSD: { emoji: "🥈", bg: "bg-slate-100" },
  OIL: { emoji: "🛢️", bg: "bg-slate-200" },
  BTCUSD: { emoji: "₿", bg: "bg-orange-100" },
};

/** Nama tampilan yang dipetakan ke simbol produk. */
const aliases: Record<string, string> = {
  GOLD: "XAUUSD",
  SILVER: "XAGUSD",
  BITCOIN: "BTCUSD",
};

function FlagCircle({ country, size }: { country: string; size: number }) {
  return (
    <img
      src={flagByCountry[country]}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      className="shrink-0 rounded-full border border-white object-cover shadow-sm"
      style={{ width: size, height: size }}
    />
  );
}

export function SymbolIcon({ symbol, size = 24 }: { symbol: string; size?: number }) {
  const normalized = aliases[symbol.toUpperCase()] ?? symbol.toUpperCase();
  const specialItem = special[normalized];
  if (specialItem) {
    if (specialItem.img) {
      return (
        <img
          src={specialItem.img}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          className="shrink-0 rounded-full border border-white object-cover shadow-sm"
          style={{ width: size, height: size }}
        />
      );
    }
    return (
      <span
        className={`flex shrink-0 items-center justify-center rounded-full border shadow-sm ${specialItem.bg}`}
        style={{ width: size, height: size, fontSize: size * 0.55 }}
      >
        {specialItem.emoji}
      </span>
    );
  }

  const country = singleFlag[symbol];
  if (country) {
    return <FlagCircle country={country} size={size} />;
  }

  // Pasangan forex: dua bendera tumpang-tindih.
  const base = currencyToCountry[symbol.slice(0, 3)];
  const quote = currencyToCountry[symbol.slice(3, 6)];
  if (base && quote) {
    return (
      <span className="flex shrink-0 items-center" style={{ width: size * 1.6, height: size }}>
        <FlagCircle country={base} size={size} />
        <span style={{ marginLeft: -size * 0.35 }}>
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
