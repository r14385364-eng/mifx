import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { newDb } from "pg-mem";

export type SeedNewsItem = {
  slug: string;
  title: string;
  category: "Special Article" | "Technical Overview" | "Market News" | string;
  excerpt: string;
  body: string;
  date: string;
  read_minutes: number;
  status: "Terbit" | "Draf";
  image_url: string;
};

export const defaultSeedNewsArticles: SeedNewsItem[] = [
  {
    slug: "the-fed-suku-bunga-gold",
    title: "The Fed Umumkan Suku Bunga, Gold akan Terbang atau Tenggelam?",
    category: "Special Article",
    excerpt:
      "Pasar menanti keputusan suku bunga The Fed malam ini. Begini skenario pergerakan Gold untuk kedua hasilnya.",
    body: "Pasar global malam ini memusatkan perhatian pada pengumuman kebijakan suku bunga The Federal Reserve. Konsensus ekonom memperkirakan The Fed menahan suku bunga di kisaran saat ini, namun yang paling ditunggu adalah nada dari pernyataan dan konferensi pers setelahnya.\n\nSecara historis, emas bergerak berlawanan arah dengan ekspektasi suku bunga riil. Jika The Fed memberi sinyal pemangkasan lebih cepat dari perkiraan, dolar AS berpotensi melemah dan membuka ruang bagi Gold untuk menguji resistance terdekat di area 4418.\n\nSebaliknya, bila The Fed menegaskan sikap hawkish karena inflasi yang masih membandel, imbal hasil obligasi AS berisiko naik dan menekan harga emas kembali ke zona support 4342. Level ini menjadi pertahanan penting buyer dalam dua pekan terakhir.\n\nBagi trader, volatilitas biasanya melonjak tajam sesaat setelah pengumuman. Pertimbangkan untuk memperkecil ukuran posisi, memperlebar toleransi stop loss, atau menunggu 15–30 menit pertama hingga arah pasar lebih jelas sebelum masuk.",
    date: "16 September 2026",
    read_minutes: 4,
    status: "Terbit",
    image_url:
      "https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=800&q=80",
  },
  {
    slug: "nasdaq-buyer-dominan-30030",
    title: "Buyer Masih Dominan, Nasdaq Berpeluang Uji 30.030",
    category: "Technical Overview",
    excerpt:
      "Momentum bullish Nasdaq bertahan di atas moving average utama. Level 30.030 menjadi target berikutnya.",
    body: "Indeks Nasdaq melanjutkan penguatannya dan ditutup di dekat level tertinggi sesi kemarin. Struktur higher high dan higher low pada time frame harian menunjukkan buyer masih memegang kendali penuh atas arah pasar.\n\nDari sisi teknikal, harga bergerak konsisten di atas EMA 20 dan EMA 50, dengan RSI bertahan di zona 60-an — cukup kuat namun belum memasuki area jenuh beli. Ini memberi ruang bagi indeks untuk menguji resistance psikologis 30.030.\n\nSkenario bullish ini akan batal jika harga menembus ke bawah support 29.720 dengan penutupan harian. Dalam kondisi tersebut, potensi koreksi menuju 29.500 perlu diwaspadai.\n\nSelalu gunakan manajemen risiko. Tentukan batas kerugian maksimal per posisi sebelum masuk pasar.",
    date: "18 September 2026",
    read_minutes: 3,
    status: "Terbit",
    image_url:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80",
  },
  {
    slug: "usdjpy-resistance-158455",
    title: "USDJPY Terus Naik, Buyer Berpeluang Bidik Resistance 158,455",
    category: "Technical Overview",
    excerpt: "Pelemahan yen berlanjut. USDJPY kini mengincar resistance kunci di 158,455.",
    body: "USDJPY memperpanjang reli kenaikannya didorong perbedaan arah kebijakan moneter antara The Fed dan Bank of Japan. Yen kembali melemah setelah BoJ menegaskan belum terburu-buru menaikkan suku bunga.\n\nSecara teknikal, pasangan ini menembus resistance 158.000 dengan volume beli yang meningkat. Target berikutnya berada di 158,455 — level tertinggi beberapa bulan terakhir yang juga menjadi zona supply penting.\n\nTrader perlu mewaspadai risiko intervensi dari otoritas Jepang bila pelemahan yen dinilai terlalu cepat. Pernyataan pejabat Kementerian Keuangan Jepang kerap memicu koreksi tajam dalam hitungan menit.\n\nSupport terdekat berada di 157.900. Selama harga bertahan di atas level tersebut, bias bullish masih valid.",
    date: "18 September 2026",
    read_minutes: 3,
    status: "Terbit",
    image_url:
      "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80",
  },
  {
    slug: "gbpusd-masih-bearish",
    title: "GBPUSD Masih Bearish, Seller Pertahankan Dominasi",
    category: "Technical Overview",
    excerpt:
      "Tekanan jual pada GBPUSD belum mereda. Seller masih mendominasi di bawah resistance kunci.",
    body: "GBPUSD masih bergerak dalam tren turun jangka menengah meski sempat rebound tipis di sesi Asia. Rebound tersebut sejauh ini terlihat sebagai koreksi teknikal, bukan pembalikan arah.\n\nStruktur pasar menunjukkan lower high yang beruntun sejak awal bulan. Resistance terdekat di 1.3450 menjadi penghalang kuat — selama harga tidak mampu menembus level ini, peluang sell saat pullback tetap menjadi skenario utama.\n\nTarget penurunan berikutnya berada di support 1.3320, disusul 1.3280 jika tekanan jual berlanjut. Data inflasi Inggris pekan depan berpotensi menjadi katalis penggerak berikutnya.\n\nPerhatikan risk management: pasang stop loss di atas resistance terdekat untuk mengantisipasi false breakout.",
    date: "18 September 2026",
    read_minutes: 3,
    status: "Terbit",
    image_url:
      "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80",
  },
  {
    slug: "oil-merosot-stok-as",
    title: "Harga Minyak Merosot Setelah Stok AS Naik di Atas Perkiraan",
    category: "Market News",
    excerpt:
      "Cadangan minyak mentah AS naik mengejutkan. Harga Oil turun lebih dari 1,5% dalam sehari.",
    body: "Harga minyak mentah dunia merosot setelah laporan mingguan menunjukkan stok minyak AS naik jauh di atas perkiraan analis. Kenaikan cadangan ini menandakan permintaan yang lebih lemah dari harapan pasar.\n\nOil ditutup turun 1,54% di level 99.51, menembus di bawah level psikologis 100 untuk pertama kalinya pekan ini. Tekanan jual meningkat di sesi New York setelah data dirilis.\n\nKe depan, pasar akan mencermati hasil pertemuan OPEC+ bulan depan. Sinyal pemangkasan produksi tambahan dapat menjadi penopang harga, sementara keputusan mempertahankan kuota berisiko memperpanjang tren turun.\n\nSupport kunci berikutnya berada di area 97.80, dengan resistance di 101.20.",
    date: "17 September 2026",
    read_minutes: 3,
    status: "Terbit",
    image_url:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
  },
  {
    slug: "euro-tertekan-data-pmi",
    title: "Euro Tertekan Data PMI Zona Euro yang Mengecewakan",
    category: "Market News",
    excerpt: "PMI sektor jasa zona euro di bawah ekspektasi. EURUSD melemah ke bawah 1.1500.",
    body: "Euro melemah terhadap dolar AS setelah rilis data PMI sektor jasa zona euro yang lebih rendah dari ekspektasi pasar. Angka tersebut memicu kekhawatiran perlambatan ekonomi di kawasan Eropa.\n\nEURUSD turun ke bawah level 1.1500 dan bergerak sideways di kisaran 1.14832. Para analis menilai data ini memperkecil kemungkinan ECB memperketat kebijakan dalam waktu dekat.\n\nPerhatian pasar berikutnya tertuju pada data inflasi Jerman dan pidato Presiden ECB akhir pekan ini. Nada dovish berpotensi menekan euro lebih dalam menuju support 1.1420.\n\nResistance terdekat berada di 1.1510. Penembusan di atas level ini dapat memicu rebound jangka pendek.",
    date: "17 September 2026",
    read_minutes: 3,
    status: "Terbit",
    image_url:
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80",
  },
  {
    slug: "perak-ikut-menguat",
    title: "Perak Ikut Menguat, Mengikuti Jejak Reli Emas",
    category: "Market News",
    excerpt: "XAGUSD naik mengikuti penguatan emas. Rasio emas-perak mulai menyempit.",
    body: "Harga perak ikut menguat mengikuti reli emas yang berlangsung sepekan terakhir. XAGUSD naik lebih dari 1% dan kini diperdagangkan di kisaran 48.312.\n\nAnalis mencatat rasio emas terhadap perak mulai menyempit — sinyal historis bahwa logam industri ini mulai mengejar ketertinggalannya dari emas. Permintaan sektor panel surya dan elektronik turut menjadi penopang.\n\nSecara teknikal, penembusan di atas resistance 48.80 membuka peluang uji level 50.00. Namun bila dolar AS menguat tajam pasca pengumuman The Fed, koreksi ke 47.50 tetap mungkin terjadi.\n\nTrader disarankan memantau korelasi pergerakan perak dengan emas dan indeks dolar AS.",
    date: "16 September 2026",
    read_minutes: 3,
    status: "Terbit",
    image_url:
      "https://images.unsplash.com/photo-1610375461369-d613b564f4c4?auto=format&fit=crop&w=800&q=80",
  },
  {
    slug: "nikkei-rekor-baru",
    title: "Nikkei Cetak Rekor Baru, Didorong Sektor Teknologi",
    category: "Special Article",
    excerpt:
      "Indeks Nikkei menembus 64.943, level tertinggi sepanjang masa, dipimpin saham semikonduktor.",
    body: "Indeks Nikkei 225 mencetak rekor tertinggi baru di 64.943, melanjutkan tren penguatan yang didorong lonjakan saham-saham teknologi dan semikonduktor Jepang.\n\nPelemahan yen menjadi katalis utama — eksportir Jepang diuntungkan karena pendapatan luar negeri mereka terkonversi lebih besar. Sentimen global terhadap sektor kecerdasan buatan juga mengangkat saham pembuat chip lokal.\n\nMeski demikian, valuasi indeks kini berada di atas rata-rata historisnya. Beberapa analis mengingatkan potensi profit-taking jika yen tiba-tiba menguat karena intervensi atau perubahan sikap BoJ.\n\nLevel support terdekat berada di 64.200, sementara target kenaikan berikutnya di kisaran 65.500.",
    date: "15 September 2026",
    read_minutes: 4,
    status: "Terbit",
    image_url:
      "https://images.unsplash.com/photo-1535320903710-d993d3d77d29?auto=format&fit=crop&w=800&q=80",
  },
  {
    slug: "apa-itu-gotrade-kelebihannya",
    title: "Apa Itu Gotrade ? Simak Kelebihannya Dibanding yang lain!",
    category: "Market News",
    excerpt: "Pengaruh global Gotrade di pasar saham dan keunggulan eksekusi trading modern.",
    body: "Gotrade adalah platform trading online modern yang memudahkan pengguna berinvestasi dan trading di instrumen global dengan spread terendah dan keamanan tingkat tinggi.\n\nDengan sistem akun terintegrasi, pengguna dapat menikmati kemudahan deposit instan, eksekusi pasar tanpa requote, serta reward eksklusif setiap aktivitas trading.",
    date: "24 September 2026",
    read_minutes: 3,
    status: "Terbit",
    image_url:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80",
  },
];

export async function runNewsSeeder() {
  console.log("=========================================");
  console.log("   Gotrade News Seeder (Hardcoded Data)  ");
  console.log("=========================================\n");

  const rawUrl = process.env.DATABASE_URL;
  const databaseUrl = rawUrl ? rawUrl.replace(/^["']|["']$/g, "").trim() : "";
  let pool: pg.Pool;

  if (databaseUrl && databaseUrl.length > 0) {
    const isLocal = databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1");
    pool = new pg.Pool({
      connectionString: databaseUrl,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 3000,
    });
  } else {
    const memDb = newDb({ autoCreateForeignKeyIndices: true });
    const client = memDb.adapters.createPg();
    pool = new client.Pool();
  }

  let dbConnected = false;
  try {
    await pool.query("SELECT 1");
    dbConnected = true;
  } catch {
    // fallback
    try {
      await pool.end();
    } catch {
      /* ignore */
    }
    const memDb = newDb({ autoCreateForeignKeyIndices: true });
    const client = memDb.adapters.createPg();
    pool = new client.Pool();
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS news (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        excerpt TEXT NOT NULL,
        body TEXT NOT NULL,
        date VARCHAR(100) NOT NULL,
        read_minutes INT NOT NULL DEFAULT 3,
        status VARCHAR(50) NOT NULL DEFAULT 'Terbit',
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log(
      `[Seeding] Seeding ${defaultSeedNewsArticles.length} news articles into database...`,
    );

    for (const article of defaultSeedNewsArticles) {
      await pool.query(
        `INSERT INTO news (slug, title, category, excerpt, body, date, read_minutes, status, image_url, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
         ON CONFLICT (slug) DO UPDATE SET
           title = EXCLUDED.title,
           category = EXCLUDED.category,
           excerpt = EXCLUDED.excerpt,
           body = EXCLUDED.body,
           date = EXCLUDED.date,
           read_minutes = EXCLUDED.read_minutes,
           status = EXCLUDED.status,
           image_url = EXCLUDED.image_url`,
        [
          article.slug,
          article.title,
          article.category,
          article.excerpt,
          article.body,
          article.date,
          article.read_minutes,
          article.status,
          article.image_url,
        ],
      );
      console.log(`  [OK] ${article.title.slice(0, 45)}...`);
    }

    // Also update disk store snapshot if available
    const storePath = path.resolve(process.cwd(), ".data/db_store.json");
    try {
      if (fs.existsSync(storePath)) {
        const raw = fs.readFileSync(storePath, "utf-8");
        const parsed = JSON.parse(raw);
        if (typeof parsed === "object" && parsed !== null) {
          const existingNews: Array<{ slug: string }> = Array.isArray(parsed.news)
            ? parsed.news
            : [];
          const slugMap = new Map(existingNews.map((n) => [n.slug, n]));

          for (const a of defaultSeedNewsArticles) {
            slugMap.set(a.slug, {
              ...a,
              id:
                (slugMap.get(a.slug) as { id?: number })?.id ||
                Math.floor(Math.random() * 100000) + 1,
              created_at: new Date().toISOString(),
            });
          }
          parsed.news = Array.from(slugMap.values());
          fs.writeFileSync(storePath, JSON.stringify(parsed, null, 2), "utf-8");
          console.log("[Disk Store] Updated .data/db_store.json with news seed.");
        }
      }
    } catch (fsErr) {
      console.warn("[Warning] Could not update disk snapshot:", fsErr);
    }

    // Attempt HTTP API sync if local dev server is active
    try {
      const loginRes = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@gotrade.com", password: "password123" }),
      });
      if (loginRes.ok) {
        const loginData = await loginRes.json();
        const token = loginData.token;
        const currentNewsRes = await fetch("http://localhost:3000/api/news");
        const currentNewsData = await currentNewsRes.json();
        const existingSlugs = new Set(
          Array.isArray(currentNewsData.news)
            ? currentNewsData.news.map((n: { slug: string }) => n.slug)
            : [],
        );

        for (const item of defaultSeedNewsArticles) {
          if (!existingSlugs.has(item.slug)) {
            await fetch("http://localhost:3000/api/news", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                title: item.title,
                category: item.category,
                excerpt: item.excerpt,
                body: item.body,
                status: item.status,
                imageUrl: item.image_url,
              }),
            });
          }
        }
        console.log("[HTTP API] Synced missing news items to active dev server.");
      }
    } catch {
      // Dev server may not be active
    }

    console.log(`\n[Success] Successfully seeded ${defaultSeedNewsArticles.length} news articles!`);
  } catch (err) {
    console.error("[Error] Failed seeding news:", err);
    if (dbConnected) {
      process.exit(1);
    }
  } finally {
    try {
      await pool.end();
    } catch {
      /* ignore */
    }
  }
}

if (process.argv[1]?.includes("seed-news")) {
  void runNewsSeeder();
}
