# Product Requirement Document (PRD) & Technical Specification
## Gotrade — Aplikasi Trading Online Legal & Aman

---

## 1. Executive Summary & Overview
**Gotrade** adalah platform aplikasi trading online modern, aman, dan legal yang menyediakan layanan perdagangan aset keuangan global seperti **Forex, Komoditas (Gold/Silver), Indeks Saham Global, dan Kripto**. 

Aplikasi ini dirancang dengan antarmuka yang sangat responsif, intuitif, serta dilengkapi dengan sistem akun dwifungsi (yaitu **Trader User** dan **Super Administrator**). Gotrade mengintegrasikan sistem perdagangan simulasi kuotasi harga waktu-nyata (*real-time price simulation*), manajemen sinyal trading analitis, berita finansial terkini, serta infrastruktur transaksi deposit (QRIS & Transfer Bank) dan penarikan dana (*withdrawal*).

---

## 2. Tech Stack & Architecture

### Front-End Framework
- **React 19** & **TypeScript 5.8**
- **TanStack Start & TanStack Router** (`@tanstack/react-router`) untuk routing SPA yang mulus, modal state handling, dan nested layout rendering.
- **Tailwind CSS v4** dengan varian tema dark/light otomatis, animasi `tw-animate-css`, dan komponen berbasis `@radix-ui` (Shadcn/UI paradigm).
- **Brand Identity & Assets**: Standardisasi logo resmi menggunakan `/logo.jpg` via komponen terpadu `AppLogo` di seluruh layout pengguna, modal, dan sidebar admin.
- **Recharts** untuk visualisasi grafik pergerakan harga instrumen finansial.
- **Lucide React Icons** untuk konsistensi simbol visual.

### Back-End & API Layer
- **Express.js API Server** (`/src/server/app.ts` & `/src/server/api-handler.ts`).
- **RESTful Endpoints** terproteksi menggunakan token sesi berbasis `Authorization: Bearer <token>` dan HttpOnly session cookies.
- **Database Engine**: Driver `pg` (PostgreSQL) dengan sistem **Seamless Fallback** ke **In-Memory PostgreSQL Engine (`pg-mem`)** dan disk store JSON (`/.data/db_store.json`) untuk menjamin ketersediaan server 100% tanpa hambatan konektivitas lokal/remote.

---

## 3. Database Schema & Architecture

Infrastruktur database mengelola 6 entitas tabel utama:

### 1. `users` (Manajemen Pengguna)
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | SERIAL PRIMARY KEY | ID Unik Pengguna |
| `name` | VARCHAR(255) | Nama Lengkap Pengguna |
| `email` | VARCHAR(255) UNIQUE | Email Akun (Lowercased) |
| `password` | VARCHAR(255) | Kredensial Password |
| `phone` | VARCHAR(50) | Nomor Telepon |
| `role` | VARCHAR(50) | Peran (`user` atau `admin`) |
| `account_number` | VARCHAR(50) | Nomor Akun Trading (8 digit) |
| `balance` | NUMERIC(15,2) | Saldo Akun (USD / IDR) |
| `profit` | NUMERIC(15,2) | Akumulasi Saldo Profit Pengguna |
| `account_type` | VARCHAR(50) | Jenis Akun (Standard Live / Demo) |
| `created_at` | TIMESTAMP | Tanggal Pendaftaran |

### 2. `signals` (Sinyal Trading)
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | VARCHAR(50) PRIMARY KEY | Kode Sinyal (cth: `SIG-001`) |
| `symbol` | VARCHAR(50) | Simbol Produk (cth: `XAUUSD`) |
| `category` | VARCHAR(50) | Kategori (`Komoditi`, `Forex`, `Indeks`) |
| `action` | VARCHAR(20) | Tindakan (`BUY` atau `SELL`) |
| `entry_price` | NUMERIC(15,5) | Harga Masuk |
| `tp1`, `tp2`, `sl` | NUMERIC(15,5) | Take Profit 1, 2, dan Stop Loss |
| `rationale` | TEXT | Analisa Rasionasi Sinyal |
| `timeframe` | VARCHAR(20) | Kerangka Waktu (`15m`, `30m`, `1h`) |
| `status` | VARCHAR(20) | Status (`Aktif`, `Selesai`, `Batal`) |

### 3. `news` (Berita Finansial & Analisa Pasar)
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | SERIAL PRIMARY KEY | ID Berita |
| `title` | VARCHAR(255) | Judul Artikel |
| `slug` | VARCHAR(255) UNIQUE | URL Friendly Slug |
| `category` | VARCHAR(50) | Kategori Berita |
| `author` | VARCHAR(100) | Penulis / Sumber |
| `image_url` | TEXT | URL Sampul Gambar |
| `excerpt` | TEXT | Ringkasan Singkat |
| `content` | TEXT | Isi Artikel Lengkap |
| `created_at` | TIMESTAMP | Waktu Terbit |

### 4. `currencies` (Mata Uang & Instrumen Pasar)
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | SERIAL PRIMARY KEY | ID Instrumen |
| `symbol` | VARCHAR(20) | Simbol Pasar (cth: `EURUSD`, `XAUUSD`) |
| `name` | VARCHAR(100) | Nama Lengkap Produk |
| `category` | VARCHAR(50) | Jenis Pasar (`Forex`, `Komoditas`, `Indeks`, `Crypto`) |
| `bid`, `ask` | NUMERIC(15,5) | Harga Jual & Harga Beli |
| `spread` | NUMERIC(10,2) | Biaya Spread |
| `status` | VARCHAR(20) | Status Trading (`Aktif` / `Nonaktif`) |

### 5. `transactions` (Transaksi Deposit & Withdraw)
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | VARCHAR(50) PRIMARY KEY | Kode Transaksi (cth: `TU-98412`, `WD-10293`) |
| `user_id` | INT REFERENCES users(id) | ID Pemilik Transaksi |
| `user_name` | VARCHAR(255) | Nama Pemilik Transaksi |
| `type` | VARCHAR(20) | Tipe (`Top Up` / `Withdraw`) |
| `channel` | VARCHAR(100) | Kanal Metode (QRIS, Bank BCA, Mandiri) |
| `amount` | NUMERIC(15,2) | Jumlah Nominal Transaksi |
| `status` | VARCHAR(20) | Status (`Menunggu`, `Berhasil`, `Ditolak`) |
| `created_at` | TIMESTAMP | Tanggal Transaksi |

### 6. `settings` (Pengaturan Aplikasi)
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `key` | VARCHAR(100) PRIMARY KEY | Kunci Konfigurasi |
| `value` | TEXT | Nilai Konfigurasi (JSON / Text) |

---

## 4. Pemetaan Fitur & Struktur Halaman Menu

### A. Akses Publik & Autentikasi (`/`, `/login`, `/register`)
- **Onboarding Card (`/`)**: Tampilan sambutan aplikasi, pengenalan fitur utama, legalitas resmi, dan tombol aksi Login/Registrasi.
- **Login Page (`/login`)**: Form autentikasi email & password dengan pemicu sekali-klik *Quick Demo Account* (Akun Trader `user@gotrade.com` & Akun Administrator `admin@gotrade.com`).
- **Register Page (`/register`)**: Pendaftaran akun trader baru yang secara otomatis menggenerasikan 8-digit nomor akun trading dan memberikan saldo awal simulasi.

### B. Portal Utama Trader (User Interface)
- **Beranda (`/beranda`)**: 
  - Ringkasan total balance akun trader.
  - Shortcut menu transaksi cepat (Deposit, Withdraw, Trade, Referral).
  - Ticker pergerakan harga populer real-time.
  - Seksi **Signal Produk Terpopuler** lengkap dengan tombol **"Lihat Semua"** yang langsung mengarahkan pengguna ke halaman Pasar (`/pasar`).
  - Carousel berita finansial terbaru.
- **Pasar (`/pasar`)**:
  - Tab kategori instrumen (*Semua, Forex, Komoditi, Indeks, Crypto*).
  - Pencarian instrumen secara instan (*live search*).
  - Daftar harga Bid/Ask real-time, grafik indikator mini, dan toggle favorit.
- **Trade (`/trade`)**:
  - Grafik pergerakan harga interaktif berbasis Recharts.
  - Panel eksekusi order: Pilihan `BUY` / `SELL`, pengaturan ukuran lot, input Take Profit (TP), dan Stop Loss (SL).
  - Kalkulasi kalkulator estimasi profit/loss otomatis.
- **Order (`/order`)**:
  - Ringkasan posisi trading yang sedang terbuka (*Open Positions*).
  - Detail P/L berjalan dan fungsi penutupan posisi (*Close Order*).
- **Riwayat Transaksi (`/riwayat`)**:
  - Riwayat lengkap deposit, penarikan dana, serta histori order trading.
  - Filter rentang status transaksi (Selesai, Diproses, Dibatalkan).
- **Deposit / Top Up (`/deposit`)**:
  - Opsi pembayaran lengkap via **QRIS Dinamis** (dengan generator kode QR) dan Transfer Bank / E-Wallet.
  - Batas **Minimal Deposit**: **$1,000 USD** (setara Rp16.000.000 IDR).
  - Pilihan nominal cepat (Rp16.000.000 s/d Rp100.000.000) atau kustomisasi nominal.
- **Withdraw / Penarikan (`/withdraw`)**:
  - Formulir penarikan dana ke rekening bank / e-wallet terdaftar.
  - Batas **Minimal Penarikan (WD)**: **Rp100.000 IDR** (setara $6.25 USD).
  - Validasi kecukupan saldo secara langsung sebelum pengajuan.
- **BeritaFinansial (`/berita` & `/berita/$slug`)**:
  - Katalog berita finansial terupdate dengan klasifikasi kategori.
  - Halaman pembaca berita detail dengan layout artikel yang rapi dan nyaman dibaca.
- **Program Referral (`/referral`)**:
  - Tampilan kode unik referral pengguna, statistik komisi yang diperoleh, dan generator tautan ajakan kustom.
- **Profil Pengguna (`/profil`)**:
  - Detail identitas trader, nomor akun trading, status tipe akun, ubah kata sandi, dan opsi keluar (*Logout*).
- **Menu Lainnya (`/lainnya`)**:
  - Tampilan header bersih berfokus pada nilai saldo trader (tanpa elemen redundan seperti badge demo, nomor akun pemilih, atau badge counter notifikasi).
  - Pengaturan saldo akun demo simulasi, bantuan pelanggan, syarat & ketentuan legal.

### C. Panel Kontrol Administrator (`/admin/*`)
- **Dashboard Admin Users (`/admin/users`)**: 
  - Pencarian dan manajemen seluruh pendaftar akun trader.
  - Fitur penyesuaian saldo trader secara langsung, pengubahan peran (*role*), dan pemblokiran akun.
- **Kelola Profit User (`/admin/profit`)**:
  - Tampilan daftar seluruh pengguna terdaftar dengan rincian: **Username**, **Email**, **Saldo Deposit**, dan **Saldo Profit**.
  - Injeksi profit langsung ke akun trader pilihan dengan nominal kustom ($ USD) yang secara otomatis menambah saldo profit dan total saldo pengguna secara real-time.
- **Kelola Mata Uang & Pasar (`/admin/mata-uang`)**:
  - Tambah, edit, dan hapus instrumen pasar (Forex, Metals, Index, Crypto).
  - Penyesuaian spread dan status aktif/nonaktif trading.
- **Kelola Sinyal Trading (`/admin/sinyal`)**:
  - CRUD penuh sinyal analitis (Simbol, Aksi BUY/SELL, Entry Price, TP1, TP2, SL, timeframe, rasionasi).
- **Kelola Berita Finansial (`/admin/berita`)**:
  - CRUD penuh artikel berita finansial, pengunggahan sampul gambar, penentuan slug URL, dan publikasi.
- **Persetujuan Top-Up (`/admin/top-up`)**:
  - Verifikasi pengajuan deposit dari trader.
  - Tombol **Setujui / Approve** yang secara otomatis menambahkan saldo ke rekening trader terkait, atau **Tolak / Reject**.
- **Persetujuan Withdraw (`/admin/withdraw`)**:
  - Verifikasi permohonan penarikan dana trader.
  - Tombol persetujuan penarikan yang memotong saldo akun trader secara akurat.
- **Pengaturan Referral (`/admin/referral`)**:
  - Konfigurasi persentase komisi referral tiap level tier.
- **Pengaturan Sistem (`/admin/pengaturan`)**:
  - Pengaturan payload QRIS utama, mode pemeliharaan sistem (*maintenance mode*), dan konfigurasi informasi perusahaan.

---

## 5. Spesifikasi Lengkap API Endpoints

| Endpoint | Method | Otentikasi | Deskripsi & Payload |
| :--- | :--- | :--- | :--- |
| `/api/health` | `GET` | Publik | Cek kesehatan server & koneksi database |
| `/api/auth/demo-accounts` | `GET` | Publik | Mendapatkan daftar akun demo siap pakai (`user` & `admin`) |
| `/api/auth/login` | `POST` | Publik | Masuk akun. Req: `{ email, password }` |
| `/api/auth/register` | `POST` | Publik | Dafar akun baru. Req: `{ name, email, password, phone }` |
| `/api/auth/me` | `GET` | Bearer Token | Mengambil data profil pengguna aktif |
| `/api/auth/logout` | `POST` | Bearer Token | Mengakhiri sesi pengguna |
| `/api/currencies` | `GET` | Publik | Mengambil daftar harga instrumen pasar aktif |
| `/api/signals` | `GET` | Publik | Mengambil sinyal trading aktif |
| `/api/news` | `GET` | Publik | Mengambil daftar artikel berita finansial |
| `/api/transactions/topup` | `POST` | User Token | Pengajuan deposit baru. Req: `{ channel, amount }` |
| `/api/transactions/withdraw` | `POST` | User Token | Pengajuan penarikan baru. Req: `{ channel, amount }` |
| `/api/admin/users` | `GET / PUT` | Admin Token | Manajemen data & saldo pengguna |
| `/api/admin/profit` | `POST` | Admin Token | Injeksi/Pemberian profit langsung ke saldo trader. Req: `{ userId, amount, note }` |
| `/api/admin/signals` | `GET / POST / PUT / DELETE` | Admin Token | CRUD lengkap sinyal trading |
| `/api/admin/news` | `GET / POST / PUT / DELETE` | Admin Token | CRUD lengkap berita finansial |
| `/api/admin/currencies` | `GET / POST / PUT / DELETE` | Admin Token | CRUD lengkap mata uang/produk pasar |
| `/api/admin/transactions` | `GET / PUT` | Admin Token | Listing & persetujuan status transaksi deposit/withdraw |
| `/api/admin/settings` | `GET / PUT` | Admin Token | Ambil dan perbarui pengaturan sistem |

---

## 6. Laporan Pengujian Lintas Peran & Halaman (*Comprehensive Multi-Role Testing Suite*)

Pengujian komprehensif dilakukan mencakup seluruh **Role/Peran Pengguna** (Public/Guest, Trader User, dan Super Admin) serta seluruh **Halaman dan Sub-Halaman** aplikasi:

---

### A. Matrix Pengujian Peran 1: Public / Guest (Pengunjung Tamu)

| Halaman / Route | Fitur & Akses Pengujian | API Terkait | Status | Output & Hasil Pengujian |
| :--- | :--- | :--- | :---: | :--- |
| **Onboarding Card (`/`)** | Tampilan pengenalan, indikator legalitas, dan tombol navigasi Login/Daftar | - | **PASSED** | Renders dengan sempurna; navigasi cepat ke `/login` & `/register` |
| **Login Page (`/login`)** | Form login email & password + tombol instan *Quick Demo Account* | `POST /api/auth/login`, `GET /api/auth/demo-accounts` | **PASSED** | Berhasil memvalidasi akun & pengisian sekali-klik untuk user/admin |
| **Register Page (`/register`)** | Formulir pendaftaran akun baru, validasi password & syarat ketentuan | `POST /api/auth/register` | **PASSED** | Berhasil membuat akun baru, generasi 8-digit nomor akun & cegah email ganda |
| **Katalog Berita (`/berita`)** | Daftar berita finansial terupdate & filter kategori | `GET /api/news` | **PASSED** | Artikel berita tampil lengkap sesuai kategori |
| **Detail Berita (`/berita/$slug`)** | Halaman artikel detail dengan layout pembaca | `GET /api/news` | **PASSED** | Artikel berita dapat dibaca dengan slug URL yang dinamis |

---

### B. Matrix Pengujian Peran 2: Akun Trader (`user@gotrade.com` / User Role)

| Halaman / Route | Fitur & Akses Pengujian | API Terkait | Status | Output & Hasil Pengujian |
| :--- | :--- | :--- | :---: | :--- |
| **Beranda (`/beranda`)** | Dashboard trader, saldo akun, ticker harga, sinyal, dan link **"Lihat Semua"** | `GET /api/signals`, `GET /api/currencies` | **PASSED** | Tampilan ringkas, tombol "Lihat Semua" mengarah tepat ke `/pasar` |
| **Pasar (`/pasar`)** | Listing produk Forex, Metal, Indeks, Crypto, pencarian live & favorit | `GET /api/currencies` | **PASSED** | Filter tab kategori & live search responsif |
| **Trading View (`/trade`)** | Grafik harga interaktif, kalkulator lot, eksekusi order Buy/Sell & TP/SL | `GET /api/currencies` | **PASSED** | Grafik harga beranimasi & simulasi estimasi P/L berjalan lancar |
| **Order Aktif (`/order`)** | Daftar posisi terbuka (*Open Positions*), detail P/L, & penutupan posisi | - | **PASSED** | Menampilkan daftar order aktif & kalkulasi nilai P/L |
| **Riwayat Transaksi (`/riwayat`)** | Histori deposit, withdraw, dan transaksi trading | `GET /api/transactions` | **PASSED** | Filter status transaksi & detail riwayat tampil rapi |
| **Deposit / Top Up (`/deposit`)** | Form deposit via QRIS Dinamis & Transfer Bank, opsi nominal cepat | `POST /api/transactions/topup` | **PASSED** | Generator QRIS berfungsi & submit pengajuan deposit terkirim ke admin |
| **Withdrawal (`/withdraw`)** | Form penarikan dana ke rekening bank/e-wallet & validasi saldo | `POST /api/transactions/withdraw` | **PASSED** | Validasi saldo mencukupi & submit penarikan terkirim ke admin |
| **Referral (`/referral`)** | Kode unik referral, statistik komisi, dan tombol salin tautan | `GET /api/referral` | **PASSED** | Kode referral unik tergenerasi & fitur salin tautan berjalan |
| **Profil (`/profil`)** | Detail identitas trader, jenis akun, ganti password, & tombol Logout | `GET /api/auth/me`, `POST /api/auth/logout` | **PASSED** | Pengubahan profil & sesi logout berfungsi dengan aman |
| **Lainnya (`/lainnya`)** | Pengaturan saldo demo simulasi & bantuan pelanggan | - | **PASSED** | Simulasi penyesuaian saldo demo berfungsi presisi |

---

### C. Matrix Pengujian Peran 3: Super Administrator (`admin@gotrade.com` / Admin Role)

| Halaman / Route | Fitur & Akses Pengujian | API Terkait | Status | Output & Hasil Pengujian |
| :--- | :--- | :--- | :---: | :--- |
| **Layout Admin (`/admin`)** | Ringkasan statistik sistem, sidebar navigasi admin, & otorisasi peran | `GET /api/admin/users` | **PASSED** | Menolak pengguna non-admin & memuat dashboard admin |
| **Kelola Users (`/admin/users`)** | Listing trader, pencarian, pengeditan saldo pengguna, status akun & role | `GET/PUT/DELETE /api/admin/users` | **PASSED** | Penyesuaian saldo trader & blokir/aktifkan akun sukses |
| **Kelola Profit (`/admin/profit`)** | Listing trader (Username, Email, Saldo Deposit, Saldo Profit) & injeksi profit | `GET /api/admin/users`, `POST /api/admin/profit` | **PASSED** | Injeksi profit langsung menambah saldo profit & balance trader secara real-time |
| **Kelola Pasar (`/admin/mata-uang`)** | CRUD instrumen pasar (Forex/Metals/Indices/Crypto), spread, & status | `GET/POST/PUT/DELETE /api/admin/currencies` | **PASSED** | Penambahan & pengubahan spread instrumen pasar berfungsi |
| **Kelola Sinyal (`/admin/sinyal`)** | CRUD sinyal trading (Symbol, Action BUY/SELL, TP/SL, Rasionasi) | `GET/POST/PUT/DELETE /api/admin/signals` | **PASSED** | Pembuatan & pembaruan sinyal terpublikasi instan ke user |
| **Kelola Berita (`/admin/berita`)** | CRUD berita finansial (Judul, Slug, Kategori, Gambar, Excerpt, Konten) | `GET/POST/PUT/DELETE /api/admin/news` | **PASSED** | Publikasi & pengeditan artikel berita berjalan lancar |
| **Persetujuan Top-Up (`/admin/top-up`)** | Verifikasi deposit trader -> Tombol Setujui (Auto Credit) / Tolak | `GET/PUT /api/admin/transactions` | **PASSED** | Persetujuan deposit otomatis mengkreditkan saldo akun trader |
| **Persetujuan Withdraw (`/admin/withdraw`)** | Verifikasi withdraw trader -> Tombol Setujui (Auto Debit) / Tolak | `GET/PUT /api/admin/transactions` | **PASSED** | Persetujuan penarikan secara akurat memotong saldo trader |
| **Pengaturan Referral (`/admin/referral`)** | Pengaturan persentase komisi referral per tier level | `GET/PUT /api/admin/referrals` | **PASSED** | Konfigurasi tarif komisi tersimpan ke database |
| **Pengaturan Sistem (`/admin/pengaturan`)** | Pengaturan QRIS payload, mode maintenance, & profil perusahaan | `GET/PUT /api/admin/settings` | **PASSED** | Pembaruan QRIS payload & info sistem tersimpan permanen |

---

### D. Hasil Kompilasi & Pemindaian Linter
- **`compile_applet`**: **SUCCESS** — Seluruh aplikasi dikompilasi tanpa kesalahan sintaksis atau kegagalan modul.
- **`lint_applet`**: **PASSED (0 Errors)** — Pemindaian linter ESLint dan Prettier tidak menemukan error pemutus eksekusi.

