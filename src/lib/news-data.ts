import imgFedGold from "@/assets/news/the-fed-suku-bunga-gold.jpg";
import imgNasdaq from "@/assets/news/nasdaq-buyer-dominan-30030.jpg";
import imgUsdjpy from "@/assets/news/usdjpy-resistance-158455.jpg";
import imgGbpusd from "@/assets/news/gbpusd-masih-bearish.jpg";
import imgOil from "@/assets/news/oil-merosot-stok-as.jpg";
import imgEuro from "@/assets/news/euro-tertekan-data-pmi.jpg";
import imgPerak from "@/assets/news/perak-ikut-menguat.jpg";
import imgNikkei from "@/assets/news/nikkei-rekor-baru.jpg";

export type NewsArticle = {
  slug: string;
  tag: string;
  category: "Special Article" | "Technical Overview" | "Market News";
  title: string;
  excerpt: string;
  image: string;
  time: string;
  date: string;
  readMinutes: number;
  tickers: { label: string; change: string; up: boolean }[];
  body: string[];
};

export const newsArticles: NewsArticle[] = [
  {
    slug: "the-fed-suku-bunga-gold",
    image: imgFedGold,
    tag: "Special Article",
    category: "Special Article",
    title: "The Fed Umumkan Suku Bunga, Gold akan Terbang atau Tenggelam?",
    excerpt:
      "Pasar menanti keputusan suku bunga The Fed malam ini. Begini skenario pergerakan Gold untuk kedua hasilnya.",
    time: "3 hari lalu",
    date: "16 September 2026",
    readMinutes: 4,
    tickers: [
      { label: "Gold", change: "+0.83%", up: true },
      { label: "Oil", change: "-1.54%", up: false },
    ],
    body: [
      "Pasar global malam ini memusatkan perhatian pada pengumuman kebijakan suku bunga The Federal Reserve. Konsensus ekonom memperkirakan The Fed menahan suku bunga di kisaran saat ini, namun yang paling ditunggu adalah nada dari pernyataan dan konferensi pers setelahnya.",
      "Secara historis, emas bergerak berlawanan arah dengan ekspektasi suku bunga riil. Jika The Fed memberi sinyal pemangkasan lebih cepat dari perkiraan, dolar AS berpotensi melemah dan membuka ruang bagi Gold untuk menguji resistance terdekat di area 4418.",
      "Sebaliknya, bila The Fed menegaskan sikap hawkish karena inflasi yang masih membandel, imbal hasil obligasi AS berisiko naik dan menekan harga emas kembali ke zona support 4342. Level ini menjadi pertahanan penting buyer dalam dua pekan terakhir.",
      "Bagi trader, volatilitas biasanya melonjak tajam sesaat setelah pengumuman. Pertimbangkan untuk memperkecil ukuran posisi, memperlebar toleransi stop loss, atau menunggu 15–30 menit pertama hingga arah pasar lebih jelas sebelum masuk.",
    ],
  },
  {
    slug: "nasdaq-buyer-dominan-30030",
    image: imgNasdaq,
    tag: "Technical Overview",
    category: "Technical Overview",
    title: "Buyer Masih Dominan, Nasdaq Berpeluang Uji 30.030",
    excerpt:
      "Momentum bullish Nasdaq bertahan di atas moving average utama. Level 30.030 menjadi target berikutnya.",
    time: "1 hari lalu",
    date: "18 September 2026",
    readMinutes: 3,
    tickers: [{ label: "Nasdaq", change: "+0.79%", up: true }],
    body: [
      "Indeks Nasdaq melanjutkan penguatannya dan ditutup di dekat level tertinggi sesi kemarin. Struktur higher high dan higher low pada time frame harian menunjukkan buyer masih memegang kendali penuh atas arah pasar.",
      "Dari sisi teknikal, harga bergerak konsisten di atas EMA 20 dan EMA 50, dengan RSI bertahan di zona 60-an — cukup kuat namun belum memasuki area jenuh beli. Ini memberi ruang bagi indeks untuk menguji resistance psikologis 30.030.",
      "Skenario bullish ini akan batal jika harga menembus ke bawah support 29.720 dengan penutupan harian. Dalam kondisi tersebut, potensi koreksi menuju 29.500 perlu diwaspadai.",
      "Selalu gunakan manajemen risiko. Tentukan batas kerugian maksimal per posisi sebelum masuk pasar.",
    ],
  },
  {
    slug: "usdjpy-resistance-158455",
    image: imgUsdjpy,
    tag: "Technical Overview",
    category: "Technical Overview",
    title: "USDJPY Terus Naik, Buyer Berpeluang Bidik Resistance 158,455",
    excerpt: "Pelemahan yen berlanjut. USDJPY kini mengincar resistance kunci di 158,455.",
    time: "1 hari lalu",
    date: "18 September 2026",
    readMinutes: 3,
    tickers: [{ label: "USDJPY", change: "+0.59%", up: true }],
    body: [
      "USDJPY memperpanjang reli kenaikannya didorong perbedaan arah kebijakan moneter antara The Fed dan Bank of Japan. Yen kembali melemah setelah BoJ menegaskan belum terburu-buru menaikkan suku bunga.",
      "Secara teknikal, pasangan ini menembus resistance 158.000 dengan volume beli yang meningkat. Target berikutnya berada di 158,455 — level tertinggi beberapa bulan terakhir yang juga menjadi zona supply penting.",
      "Trader perlu mewaspadai risiko intervensi dari otoritas Jepang bila pelemahan yen dinilai terlalu cepat. Pernyataan pejabat Kementerian Keuangan Jepang kerap memicu koreksi tajam dalam hitungan menit.",
      "Support terdekat berada di 157.900. Selama harga bertahan di atas level tersebut, bias bullish masih valid.",
    ],
  },
  {
    slug: "gbpusd-masih-bearish",
    image: imgGbpusd,
    tag: "Technical Overview",
    category: "Technical Overview",
    title: "GBPUSD Masih Bearish, Seller Pertahankan Dominasi",
    excerpt:
      "Tekanan jual pada GBPUSD belum mereda. Seller masih mendominasi di bawah resistance kunci.",
    time: "1 hari lalu",
    date: "18 September 2026",
    readMinutes: 3,
    tickers: [{ label: "GBPUSD", change: "+0.26%", up: true }],
    body: [
      "GBPUSD masih bergerak dalam tren turun jangka menengah meski sempat rebound tipis di sesi Asia. Rebound tersebut sejauh ini terlihat sebagai koreksi teknikal, bukan pembalikan arah.",
      "Struktur pasar menunjukkan lower high yang beruntun sejak awal bulan. Resistance terdekat di 1.3450 menjadi penghalang kuat — selama harga tidak mampu menembus level ini, peluang sell saat pullback tetap menjadi skenario utama.",
      "Target penurunan berikutnya berada di support 1.3320, disusul 1.3280 jika tekanan jual berlanjut. Data inflasi Inggris pekan depan berpotensi menjadi katalis penggerak berikutnya.",
      "Perhatikan risk management: pasang stop loss di atas resistance terdekat untuk mengantisipasi false breakout.",
    ],
  },
  {
    slug: "oil-merosot-stok-as",
    image: imgOil,
    tag: "Market News",
    category: "Market News",
    title: "Harga Minyak Merosot Setelah Stok AS Naik di Atas Perkiraan",
    excerpt:
      "Cadangan minyak mentah AS naik mengejutkan. Harga Oil turun lebih dari 1,5% dalam sehari.",
    time: "2 hari lalu",
    date: "17 September 2026",
    readMinutes: 3,
    tickers: [{ label: "Oil", change: "-1.54%", up: false }],
    body: [
      "Harga minyak mentah dunia merosot setelah laporan mingguan menunjukkan stok minyak AS naik jauh di atas perkiraan analis. Kenaikan cadangan ini menandakan permintaan yang lebih lemah dari harapan pasar.",
      "Oil ditutup turun 1,54% di level 99.51, menembus di bawah level psikologis 100 untuk pertama kalinya pekan ini. Tekanan jual meningkat di sesi New York setelah data dirilis.",
      "Ke depan, pasar akan mencermati hasil pertemuan OPEC+ bulan depan. Sinyal pemangkasan produksi tambahan dapat menjadi penopang harga, sementara keputusan mempertahankan kuota berisiko memperpanjang tren turun.",
      "Support kunci berikutnya berada di area 97.80, dengan resistance di 101.20.",
    ],
  },
  {
    slug: "euro-tertekan-data-pmi",
    image: imgEuro,
    tag: "Market News",
    category: "Market News",
    title: "Euro Tertekan Data PMI Zona Euro yang Mengecewakan",
    excerpt: "PMI sektor jasa zona euro di bawah ekspektasi. EURUSD melemah ke bawah 1.1500.",
    time: "2 hari lalu",
    date: "17 September 2026",
    readMinutes: 3,
    tickers: [{ label: "EURUSD", change: "-0.09%", up: false }],
    body: [
      "Euro melemah terhadap dolar AS setelah rilis data PMI sektor jasa zona euro yang lebih rendah dari ekspektasi pasar. Angka tersebut memicu kekhawatiran perlambatan ekonomi di kawasan Eropa.",
      "EURUSD turun ke bawah level 1.1500 dan bergerak sideways di kisaran 1.14832. Para analis menilai data ini memperkecil kemungkinan ECB memperketat kebijakan dalam waktu dekat.",
      "Perhatian pasar berikutnya tertuju pada data inflasi Jerman dan pidato Presiden ECB akhir pekan ini. Nada dovish berpotensi menekan euro lebih dalam menuju support 1.1420.",
      "Resistance terdekat berada di 1.1510. Penembusan di atas level ini dapat memicu rebound jangka pendek.",
    ],
  },
  {
    slug: "perak-ikut-menguat",
    image: imgPerak,
    tag: "Market News",
    category: "Market News",
    title: "Perak Ikut Menguat, Mengikuti Jejak Reli Emas",
    excerpt: "XAGUSD naik mengikuti penguatan emas. Rasio emas-perak mulai menyempit.",
    time: "3 hari lalu",
    date: "16 September 2026",
    readMinutes: 3,
    tickers: [{ label: "Perak", change: "+1.12%", up: true }],
    body: [
      "Harga perak ikut menguat mengikuti reli emas yang berlangsung sepekan terakhir. XAGUSD naik lebih dari 1% dan kini diperdagangkan di kisaran 48.312.",
      "Analis mencatat rasio emas terhadap perak mulai menyempit — sinyal historis bahwa logam industri ini mulai mengejar ketertinggalannya dari emas. Permintaan sektor panel surya dan elektronik turut menjadi penopang.",
      "Secara teknikal, penembusan di atas resistance 48.80 membuka peluang uji level 50.00. Namun bila dolar AS menguat tajam pasca pengumuman The Fed, koreksi ke 47.50 tetap mungkin terjadi.",
      "Trader disarankan memantau korelasi pergerakan perak dengan emas dan indeks dolar AS.",
    ],
  },
  {
    slug: "nikkei-rekor-baru",
    image: imgNikkei,
    tag: "Special Article",
    category: "Special Article",
    title: "Nikkei Cetak Rekor Baru, Didorong Sektor Teknologi",
    excerpt:
      "Indeks Nikkei menembus 64.943, level tertinggi sepanjang masa, dipimpin saham semikonduktor.",
    time: "4 hari lalu",
    date: "15 September 2026",
    readMinutes: 4,
    tickers: [{ label: "Nikkei", change: "+0.29%", up: true }],
    body: [
      "Indeks Nikkei 225 mencetak rekor tertinggi baru di 64.943, melanjutkan tren penguatan yang didorong lonjakan saham-saham teknologi dan semikonduktor Jepang.",
      "Pelemahan yen menjadi katalis utama — eksportir Jepang diuntungkan karena pendapatan luar negeri mereka terkonversi lebih besar. Sentimen global terhadap sektor kecerdasan buatan juga mengangkat saham pembuat chip lokal.",
      "Meski demikian, valuasi indeks kini berada di atas rata-rata historisnya. Beberapa analis mengingatkan potensi profit-taking jika yen tiba-tiba menguat karena intervensi atau perubahan sikap BoJ.",
      "Level support terdekat berada di 64.200, sementara target kenaikan berikutnya di kisaran 65.500.",
    ],
  },
];

export function getArticleBySlug(slug: string) {
  return newsArticles.find((a) => a.slug === slug);
}
