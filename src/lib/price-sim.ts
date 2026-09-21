/**
 * Simulasi pergerakan harga (random walk) untuk demo tampilan.
 * Semua angka dibuat di sisi klien, bukan data pasar sungguhan.
 */

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

/** Langkah acak kecil, proporsional terhadap harga. */
export function nextPrice(price: number, volatility = 0.0006) {
  const drift = (Math.random() - 0.5) * 2 * volatility;
  return price * (1 + drift);
}

export function formatPrice(value: number, decimals: number) {
  return value.toFixed(decimals);
}

/** Bangun deret candle awal yang berakhir di harga `last`. */
export function seedCandles(last: number, count: number, volatility = 0.0015): Candle[] {
  const candles: Candle[] = [];
  let price = last * (1 - volatility * count * 0.25);
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const open = price;
    const close = nextPrice(open, volatility * 2);
    const high = Math.max(open, close) * (1 + Math.random() * volatility);
    const low = Math.min(open, close) * (1 - Math.random() * volatility);
    candles.push({ time: now - (count - i) * 60_000, open, high, low, close });
    price = close;
  }
  return candles;
}

/** Perbarui candle terakhir, atau mulai candle baru. */
export function tickCandles(candles: Candle[], newCandle: boolean, volatility = 0.0008): Candle[] {
  if (candles.length === 0) return candles;
  const next = candles.slice();
  const last = next[next.length - 1]!;
  const close = nextPrice(last.close, volatility);

  if (newCandle) {
    next.push({
      time: Date.now(),
      open: last.close,
      high: Math.max(last.close, close),
      low: Math.min(last.close, close),
      close,
    });
    return next.slice(-60);
  }

  next[next.length - 1] = {
    ...last,
    close,
    high: Math.max(last.high, close),
    low: Math.min(last.low, close),
  };
  return next;
}
