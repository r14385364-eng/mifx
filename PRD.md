# Product Requirement Document (PRD) & Technical Specification

## Gotrade — Aplikasi Trading Online Legal & Aman

---

## 1. Executive Summary & Overview

**Gotrade** adalah platform aplikasi trading online modern, aman, dan legal yang menyediakan layanan perdagangan aset keuangan global seperti **Forex, Komoditas (Gold/Silver), Indeks Saham Global, dan Kripto**.

Aplikasi ini dirancang dengan antarmuka yang sangat responsif, intuitif, serta dilengkapi dengan sistem akun dwifungsi (yaitu **Trader User** dan **Super Administrator**). Gotrade mengintegrasikan sistem perdagangan simulasi kuotasi harga waktu-nyata (_real-time price simulation_), manajemen sinyal trading analitis, berita finansial terkini, infrastruktur transaksi deposit (QRIS & Transfer Bank) serta penarikan dana (_withdrawal_), yang diproteksi secara menyeluruh oleh arsitektur **Role-Based Access Control (RBAC)** dan standar keamanan berlapis.

---

## 2. Tech Stack & Architecture

### Front-End Framework

- **React 19** & **TypeScript 5.8**
- **TanStack Start & TanStack Router** (`@tanstack/react-router`) untuk routing SPA yang mulus, modal state handling, dan nested layout rendering.
- **Tailwind CSS v4** dengan varian tema dark/light otomatis, animasi `tw-animate-css`, dan komponen berbasis `@radix-ui` (Shadcn/UI paradigm).
- **Brand Identity & Assets**: Standardisasi logo resmi menggunakan `/logo.jpg` via komponen terpadu `AppLogo` di seluruh layout pengguna, modal, dan sidebar admin.
- **Recharts** untuk visualisasi grafik pergerakan harga instrumen finansial.
- **Lucide React Icons** untuk konsistensi simbol visual.
- **Secure API Client (`secureFetch`)**: Klien fetch terstandarisasi di `/src/lib/api-client.ts` yang otomatis menginjeksi token `Bearer`, menangani `credentials: "include"`, serta mendeteksi respons `401 Unauthorized`, `403 Forbidden`, dan `429 Rate Limit` dengan notifikasi toast informatif.

### Back-End & API Layer

- **Express.js API Server** (`/src/server/app.ts` & `/src/server/api-handler.ts`).
- **Role-Based Access Control (RBAC)**: Middleware `requireAdmin` dan `requireAuth` membatasi eksekusi endpoint administratif hanya untuk akun dengan peran `admin`.
- **RESTful Endpoints** terproteksi menggunakan token sesi berbasis `Authorization: Bearer <token>` dan HttpOnly session cookies.
- **Security Headers & Defense-in-Depth**: Perlindungan terhadap sniffing (`X-Content-Type-Options: nosniff`), proteksi framing (`X-Frame-Options: SAMEORIGIN`), isolasi origin (`Referrer-Policy: strict-origin-when-cross-origin`), sanitasi payload, serta pembatasan laju permintaan (*Rate Limiting*).
- **Database Engine**: Driver `pg` (PostgreSQL) dengan sistem **Seamless Fallback** ke **In-Memory PostgreSQL Engine (`pg-mem`)** dan disk store JSON (`/.data/db_store.json`) untuk menjamin ketersediaan server 100% tanpa hambatan konektivitas lokal/remote.

---

## 3. Database Schema & Architecture

Infrastruktur database mengelola 6 entitas tabel utama:

### 1. `users` (Manajemen Pengguna)

| Kolom            | Tipe Data           | Keterangan                        |
| :--------------- | :------------------ | :-------------------------------- |
| `id`             | SERIAL PRIMARY KEY  | ID Unik Pengguna                  |
| `name`           | VARCHAR(255)        | Nama Lengkap Pengguna             |
| `email`          | VARCHAR(255) UNIQUE | Email Akun (Lowercased)           |
| `password`       | VARCHAR(255)        | Kredensial Password               |
| `phone`          | VARCHAR(50)         | Nomor Telepon                     |
| `role`           | VARCHAR(50)         | Peran (`user` atau `admin`)       |
| `account_number` | VARCHAR(50)         | Nomor Akun Trading (8 digit)      |
| `balance`        | NUMERIC(15,2)       | Saldo Akun (USD / IDR)            |
| `profit`         | NUMERIC(15,2)       | Akumulasi Saldo Profit Pengguna   |
| `account_type`   | VARCHAR(50)         | Jenis Akun (Standard Live / Demo) |
| `created_at`     | TIMESTAMP           | Tanggal Pendaftaran               |

### 2. `signals` (Sinyal Trading)

| Kolom              | Tipe Data               | Keterangan                               |
| :----------------- | :---------------------- | :--------------------------------------- |
| `id`               | VARCHAR(50) PRIMARY KEY | Kode Sinyal (cth: `SIG-001`)             |
| `symbol`           | VARCHAR(50)             | Simbol Produk (cth: `XAUUSD`)            |
| `category`         | VARCHAR(50)             | Kategori (`Komoditi`, `Forex`, `Indeks`) |
| `action`           | VARCHAR(20)             | Tindakan (`BUY` atau `SELL`)             |
| `entry_price`      | NUMERIC(15,5)           | Harga Masuk                              |
| `tp1`, `tp2`, `sl` | NUMERIC(15,5)           | Take Profit 1, 2, dan Stop Loss          |
| `rationale`        | TEXT                    | Analisa Rasionasi Sinyal                 |
| `timeframe`        | VARCHAR(20)             | Kerangka Waktu (`15m`, `30m`, `1h`)      |
| `status`           | VARCHAR(20)             | Status (`Aktif`, `Selesai`, `Batal`)     |

### 3. `news` (Berita Finansial & Analisa Pasar)

| Kolom        | Tipe Data           | Keterangan          |
| :----------- | :------------------ | :------------------ |
| `id`         | SERIAL PRIMARY KEY  | ID Berita           |
| `title`      | VARCHAR(255)        | Judul Artikel       |
| `slug`       | VARCHAR(255) UNIQUE | URL Friendly Slug   |
| `category`   | VARCHAR(50)         | Kategori Berita     |
| `author`     | VARCHAR(100)        | Penulis / Sumber    |
| `image_url`  | TEXT                | URL Sampul Gambar   |
| `excerpt`    | TEXT                | Ringkasan Singkat   |
| `content`    | TEXT                | Isi Artikel Lengkap |
| `created_at` | TIMESTAMP           | Waktu Terbit        |

### 4. `currencies` (Mata Uang & Instrumen Pasar)

| Kolom        | Tipe Data          | Keterangan                                             |
| :----------- | :----------------- | :----------------------------------------------------- |
| `id`         | SERIAL PRIMARY KEY | ID Instrumen                                           |
| `symbol`     | VARCHAR(20)        | Simbol Pasar (cth: `EURUSD`, `XAUUSD`)                 |
| `name`       | VARCHAR(100)       | Nama Lengkap Produk                                    |
| `category`   | VARCHAR(50)        | Jenis Pasar (`Forex`, `Komoditas`, `Indeks`, `Crypto`) |
| `bid`, `ask` | NUMERIC(15,5)      | Harga Jual & Harga Beli                                |
| `spread`     | NUMERIC(10,2)      | Biaya Spread                                           |
| `status`     | VARCHAR(20)        | Status Trading (`Aktif` / `Nonaktif`)                  |

### 5. `transactions` (Transaksi Deposit & Withdraw)

| Kolom            | Tipe Data                | Keterangan                                                 |
| :--------------- | :----------------------- | :--------------------------------------------------------- |
| `id`             | VARCHAR(50) PRIMARY KEY  | Kode Transaksi (cth: `TU-98412`, `WD-10293`, `PRF-12345`)  |
| `user_id`        | INT REFERENCES users(id) | ID Pemilik Transaksi                                       |
| `user_name`      | VARCHAR(255)             | Nama Pemilik Transaksi                                     |
| `account_number` | VARCHAR(50)              | Nomor Akun Trading Pengguna                                |
| `type`           | VARCHAR(20)              | Tipe (`Top Up`, `Withdraw`, `Profit`)                      |
| `channel`        | VARCHAR(100)             | Kanal Metode (QRIS, Bank BCA, Mandiri, Admin Profit Grant) |
| `destination`    | VARCHAR(100)             | Rekening / Akun Tujuan                                     |
| `amount`         | NUMERIC(15,2)            | Jumlah Nominal Transaksi                                   |
| `status`         | VARCHAR(20)              | Status (`Menunggu`, `Berhasil`, `Ditolak`)                 |
| `proof_image`    | TEXT                     | Data URI gambar bukti transfer / resi pembayaran pengguna  |
| `created_at`     | TIMESTAMP                | Tanggal & Waktu Transaksi                                  |

### 6. `settings` (Pengaturan Aplikasi)

| Kolom   | Tipe Data                | Keterangan                      |
| :------ | :----------------------- | :------------------------------ |
| `key`   | VARCHAR(100) PRIMARY KEY | Kunci Konfigurasi               |
| `value` | TEXT                     | Nilai Konfigurasi (JSON / Text) |

---

## 4. Keamanan & Role-Based Access Control (RBAC)

Aplikasi Gotrade menerapkan prinsip **Defense-in-Depth** dengan pembagian peran tegas:

1. **Role: Public / Guest**
   - Hak Akses: Halaman pengenalan (`/`), katalog berita umum (`/berita`), detail artikel (`/berita/$slug`), form masuk (`/login`), dan pendaftaran (`/register`).
   - Batasan: Tidak dapat mengakses modul trading, deposit/withdraw, riwayat transaksi, atau portal admin.

2. **Role: Trader User (`user`)**
   - Hak Akses: Dashboard trader (`/beranda`), pasar (`/pasar`), eksekusi trading (`/trade`), order aktif (`/order`), riwayat pribadi (`/riwayat`), pengajuan deposit (`/deposit`), penarikan dana (`/withdraw`), program referral (`/referral`), dan profil (`/profil`).
   - Batasan: Dilarang keras mengakses endpoint atau rute `/admin/*`. Permintaan ke API admin akan direspons dengan kode status `403 Forbidden`.

3. **Role: Super Administrator (`admin`)**
   - Hak Akses: Seluruh kontrol panel administratif (`/admin/*`), manajemen seluruh pengguna (`/admin/users`), kelola profit per akun (`/admin/profit`), persetujuan transaksi Top-Up & Bukti Transfer (`/admin/top-up`), persetujuan penarikan (`/admin/withdraw`), manajemen sinyal (`/admin/sinyal`), artikel berita (`/admin/berita`), instrumen pasar (`/admin/mata-uang`), komisi referral (`/admin/referral`), dan pengaturan sistem/QRIS (`/admin/pengaturan`).

4. **Komponen Proteksi RBAC Sisi Klien (`AdminLayout`)**
   - Jika pengguna belum terautentikasi atau bukan bertipe `role === "admin"`, komponen `AdminLayout` mencegat render dan menampilkan status **Akses Ditolak (RBAC 403)** dengan opsi login akun administrator atau kembali ke Beranda.

---

## 5. Pemetaan Fitur & Struktur Halaman Menu

### A. Akses Publik & Autentikasi (`/`, `/login`, `/register`)

- **Onboarding Card (`/`)**: Tampilan sambutan aplikasi, pengenalan fitur utama, legalitas resmi, dan tombol aksi Login/Registrasi.
- **Login Page (`/login`)**: Form autentikasi email & password dengan pemicu sekali-klik _Quick Demo Account_ (Akun Trader `user@gotrade.com` & Akun Administrator `admin@gotrade.com`).
- **Register Page (`/register`)**: Pendaftaran akun trader baru yang disederhanakan tanpa input nomor HP (hanya Nama Lengkap, Email, Kata Sandi, dan Konfirmasi Sandi) untuk alur registrasi yang cepat dan nyaman, otomatis menggenerasikan 8-digit nomor akun trading unik.

### B. Portal Utama Trader (User Interface)

- **Beranda (`/beranda`)**:
  - Ringkasan total balance akun trader.
  - Shortcut menu transaksi cepat (Deposit, Withdraw, Trade, Referral).
  - Ticker pergerakan harga populer real-time.
  - Seksi **Signal Produk Terpopuler** lengkap dengan tombol **"Lihat Semua"** yang langsung mengarahkan pengguna ke halaman Pasar (`/pasar`).
  - Carousel berita finansial terbaru.
- **Pasar (`/pasar`)**:
  - Tab kategori instrumen (_Semua, Forex, Komoditi, Indeks, Crypto_).
  - Pencarian instrumen secara instan (_live search_).
  - Daftar harga Bid/Ask real-time, grafik indikator mini, dan toggle favorit.
- **Trade (`/trade`)**:
  - Grafik pergerakan harga interaktif berbasis Recharts.
  - Panel eksekusi order: Pilihan `BUY` / `SELL`, pengaturan ukuran lot, input Take Profit (TP), dan Stop Loss (SL).
  - Kalkulasi kalkulator estimasi profit/loss otomatis.
- **Order (`/order`)**:
  - Ringkasan posisi trading yang sedang terbuka (_Open Positions_).
  - Detail P/L berjalan dan fungsi penutupan posisi (_Close Order_).
- **Riwayat Transaksi (`/riwayat`)**:
  - Riwayat lengkap deposit, penarikan dana, profit grant dari admin, serta histori transaksi.
  - Penyelarasan status sinkron dengan database admin: status **Selesai** (badge hijau) saat disetujui admin, **Diproses** (badge kuning) saat menunggu, dan **Gagal** (badge merah) saat ditolak.
  - Format cerdas mata uang ganda: Top Up dan Withdraw ditampilkan dalam Rupiah (IDR) dengan subteks ekuivalen USD, sedangkan Profit ditampilkan dalam USD dengan subteks ekuivalen Rupiah.
- **Deposit / Top Up (`/deposit`)**:
  - Opsi pembayaran lengkap via **QRIS Dinamis** (dengan generator kode QR) dan Transfer Bank / E-Wallet.
  - Batas **Minimal Deposit**: **$1,000 USD** (setara Rp16.000.000 IDR).
  - Pilihan nominal cepat (Rp16.000.000 s/d Rp100.000.000) atau kustomisasi nominal.
  - **Fitur Unggah Bukti Transfer**:
    - Area upload interaktif dengan dukungan _drag-and-drop_ dan klik pilih berkas dari galeri perangkat (JPG, PNG, WEBP, JPEG hingga 10MB).
    - Kompresi gambar otomatis sisi klien via HTML5 Canvas untuk performa optimal tanpa mengurangi ketajaman teks resi.
    - Pratinjau thumbnail, info nama dan ukuran berkas, modal perbesar resolusi penuh, tombol ganti gambar, dan tombol hapus.
    - Tampilan status bukti transfer terlampir pada layar konfirmasi pengajuan berhasil.
- **Withdraw / Penarikan (`/withdraw`)**:
  - Formulir penarikan dana ke rekening bank / e-wallet terdaftar.
  - Batas **Minimal Penarikan (WD)**: **Rp100.000 IDR** (setara $6.25 USD).
  - Validasi kecukupan saldo secara langsung sebelum pengajuan.
- **Berita Finansial (`/berita` & `/berita/$slug`)**:
  - Katalog berita finansial terupdate dengan klasifikasi kategori.
  - Halaman pembaca berita detail dengan layout artikel yang rapi dan nyaman dibaca.
- **Program Referral (`/referral`)**:
  - Tampilan kode unik referral pengguna, statistik komisi yang diperoleh, dan generator tautan ajakan kustom.
- **Profil Pengguna (`/profil`)**:
  - Detail identitas trader, nomor akun trading, status tipe akun, ubah kata sandi, dan opsi keluar (_Logout_).
- **Menu Lainnya (`/lainnya`)**:
  - Tampilan header bersih berfokus pada nilai saldo trader (tanpa elemen redundan).
  - Pengaturan saldo akun demo simulasi, bantuan pelanggan, syarat & ketentuan legal.

### C. Panel Kontrol Administrator (`/admin/*`)

- **Dashboard Admin Users (`/admin/users`)**:
  - Pencarian dan manajemen seluruh pendaftar akun trader.
  - Fitur penyesuaian saldo trader secara langsung, pengubahan peran (_role_), dan pemblokiran akun.
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
  - Verifikasi pengajuan deposit dari trader dengan kolom khusus **Bukti Transfer**.
  - Miniatur kartu thumbnail resi _"Lihat Resi"_ atau keterangan _"Tanpa resi"_.
  - Dialog modal peninjauan resi resolusi penuh dengan rincian lengkap (ID transaksi, nama & nomor akun pengguna, nominal IDR/USD, metode pembayaran, waktu pengajuan) serta tautan buka di tab baru.
  - Tombol tindakan langsung dari modal maupun tabel: **Setujui Deposit** (auto-kredit ke saldo akun pengguna) atau **Tolak Transaksi**.
- **Persetujuan Withdraw (`/admin/withdraw`)**:
  - Verifikasi permohonan penarikan dana trader.
  - Tombol persetujuan penarikan yang memotong saldo akun trader secara akurat.
- **Pengaturan Referral (`/admin/referral`)**:
  - Konfigurasi persentase komisi referral tiap level tier.
- **Pengaturan Sistem (`/admin/pengaturan`)**:
  - Unggah dan kelola gambar QRIS resmi untuk pembayaran deposit trader, pratinjau live tampilan mobile trader, dan pengaturan nama merchant rekening penerima.

---

## 6. Spesifikasi Lengkap API Endpoints

| Endpoint                  | Method                      | Otentikasi    | Deskripsi & Payload                                                                                                  |
| :------------------------ | :-------------------------- | :------------ | :------------------------------------------------------------------------------------------------------------------- |
| `/api/health`             | `GET`                       | Publik        | Cek kesehatan server & koneksi database                                                                              |
| `/api/auth/demo-accounts` | `GET`                       | Publik        | Mendapatkan daftar akun demo siap pakai (`user` & `admin`)                                                           |
| `/api/auth/login`         | `POST`                      | Publik        | Masuk akun. Req: `{ email, password }`                                                                               |
| `/api/auth/register`      | `POST`                      | Publik        | Daftar akun baru (tanpa input no HP). Req: `{ name, email, password }`                                               |
| `/api/auth/me`            | `GET`                       | Bearer Token  | Mengambil data profil pengguna aktif                                                                                 |
| `/api/auth/logout`        | `POST`                      | Bearer Token  | Mengakhiri sesi pengguna                                                                                             |
| `/api/currencies`         | `GET`                       | Publik        | Mengambil daftar harga instrumen pasar aktif                                                                         |
| `/api/signals`            | `GET`                       | Publik        | Mengambil sinyal trading aktif                                                                                       |
| `/api/news`               | `GET`                       | Publik        | Mengambil daftar artikel berita finansial                                                                            |
| `/api/transactions`       | `GET`                       | Publik / Auth | Mengambil daftar riwayat transaksi lengkap dengan `proof_image`                                                      |
| `/api/transactions`       | `POST`                      | User Token    | Pengajuan deposit/withdraw baru. Req: `{ userName, accountNumber, type, channel, destination, amount, proofImage? }` |
| `/api/admin/users`        | `GET / POST / PUT / DELETE` | Admin Token   | Manajemen data, pendaftaran, & saldo pengguna (Dilindungi RBAC)                                                      |
| `/api/admin/profit`       | `POST`                      | Admin Token   | Injeksi/Pemberian profit langsung ke saldo trader (Dilindungi RBAC). Req: `{ userId, amount, note }`                 |
| `/api/admin/signals`      | `GET / POST / PUT / DELETE` | Admin Token   | CRUD lengkap sinyal trading (Dilindungi RBAC)                                                                        |
| `/api/admin/news`         | `GET / POST / PUT / DELETE` | Admin Token   | CRUD lengkap berita finansial (Dilindungi RBAC)                                                                      |
| `/api/admin/currencies`   | `GET / POST / PUT / DELETE` | Admin Token   | CRUD lengkap mata uang/produk pasar (Dilindungi RBAC)                                                                |
| `/api/admin/transactions` | `GET / PATCH / PUT`         | Admin Token   | Listing, peninjauan bukti transfer, & persetujuan status deposit/withdraw (Dilindungi RBAC)                          |
| `/api/admin/settings`     | `GET / POST / PUT`          | Admin Token   | Ambil dan perbarui pengaturan sistem (Dilindungi RBAC)                                                               |

---

## 7. Laporan Pengujian Lintas Peran & Keamanan (_Comprehensive Multi-Role & RBAC Testing Suite_)

Pengujian komprehensif dilakukan mencakup seluruh **Role/Peran Pengguna** (Public/Guest, Trader User, dan Super Admin) serta seluruh **Halaman dan Sub-Halaman** aplikasi:

---

### A. Matrix Pengujian Peran 1: Public / Guest (Pengunjung Tamu)

| Halaman / Route                     | Fitur & Akses Pengujian                                                                        | API Terkait                                           |   Status   | Output & Hasil Pengujian                                                                                         |
| :---------------------------------- | :--------------------------------------------------------------------------------------------- | :---------------------------------------------------- | :--------: | :--------------------------------------------------------------------------------------------------------------- |
| **Onboarding Card (`/`)**           | Tampilan pengenalan, indikator legalitas, dan tombol navigasi Login/Daftar                     | -                                                     | **PASSED** | Renders dengan sempurna; navigasi cepat ke `/login` & `/register`                                                |
| **Login Page (`/login`)**           | Form login email & password + tombol instan _Quick Demo Account_                               | `POST /api/auth/login`, `GET /api/auth/demo-accounts` | **PASSED** | Berhasil memvalidasi akun & pengisian sekali-klik untuk user/admin                                               |
| **Register Page (`/register`)**     | Formulir pendaftaran akun baru tanpa nomor telepon (Nama Lengkap, Email, Password, Konfirmasi) | `POST /api/auth/register`                             | **PASSED** | Input nomor HP berhasil dihilangkan; berhasil membuat akun baru, generasi 8-digit nomor akun & cegah email ganda |
| **Katalog Berita (`/berita`)**      | Daftar berita finansial terupdate & filter kategori                                            | `GET /api/news`                                       | **PASSED** | Artikel berita tampil lengkap sesuai kategori                                                                    |
| **Detail Berita (`/berita/$slug`)** | Halaman artikel detail dengan layout pembaca                                                   | `GET /api/news`                                       | **PASSED** | Artikel berita dapat dibaca dengan slug URL yang dinamis                                                         |

---

### B. Matrix Pengujian Peran 2: Akun Trader (`user@gotrade.com` / User Role)

| Halaman / Route                    | Fitur & Akses Pengujian                                                                                      | API Terkait                                 |   Status   | Output & Hasil Pengujian                                                                                                                             |
| :--------------------------------- | :----------------------------------------------------------------------------------------------------------- | :------------------------------------------ | :--------: | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Beranda (`/beranda`)**           | Dashboard trader, saldo akun, ticker harga, sinyal, dan link **"Lihat Semua"**                               | `GET /api/signals`, `GET /api/currencies`   | **PASSED** | Tampilan ringkas, tombol "Lihat Semua" mengarah tepat ke `/pasar`                                                                                    |
| **Pasar (`/pasar`)**               | Listing produk Forex, Metal, Indeks, Crypto, pencarian live & favorit                                        | `GET /api/currencies`                       | **PASSED** | Filter tab kategori & live search responsif                                                                                                          |
| **Trading View (`/trade`)**        | Grafik harga interaktif, kalkulator lot, eksekusi order Buy/Sell & TP/SL                                     | `GET /api/currencies`                       | **PASSED** | Grafik harga beranimasi & simulasi estimasi P/L berjalan lancar                                                                                      |
| **Order Aktif (`/order`)**         | Daftar posisi terbuka (_Open Positions_), detail P/L, & penutupan posisi                                     | -                                           | **PASSED** | Menampilkan daftar order aktif & kalkulasi nilai P/L                                                                                                 |
| **Riwayat Transaksi (`/riwayat`)** | Histori deposit, withdraw, profit grant, filter status, sinkronisasi status dengan admin, dan format IDR/USD | `GET /api/transactions`                     | **PASSED** | Status tersinkronisasi ("Selesai" warna hijau saat disetujui, "Diproses" kuning saat menunggu, "Gagal" merah saat ditolak); format mata uang presisi |
| **Deposit / Top Up (`/deposit`)**  | Form deposit QRIS/Bank, unggah bukti transfer interaktif, kompresi client-side, modal pratinjau              | `POST /api/transactions`                    | **PASSED** | Area upload drag-and-drop & file picker berfungsi; kompresi canvas bekerja; bukti transfer terkirim bersama transaksi                                |
| **Withdrawal (`/withdraw`)**       | Form penarikan dana ke rekening bank/e-wallet & validasi saldo                                               | `POST /api/transactions`                    | **PASSED** | Validasi saldo mencukupi & submit penarikan terkirim ke admin                                                                                        |
| **Referral (`/referral`)**         | Kode unik referral, statistik komisi, dan tombol salin tautan                                                | `GET /api/referrals`                        | **PASSED** | Kode referral unik tergenerasi & fitur salin tautan berjalan                                                                                         |
| **Profil (`/profil`)**             | Detail identitas trader, jenis akun, ganti password, & tombol Logout                                         | `GET /api/auth/me`, `POST /api/auth/logout` | **PASSED** | Pengubahan profil & sesi logout berfungsi dengan aman                                                                                                |
| **Lainnya (`/lainnya`)**           | Pengaturan saldo demo simulasi & bantuan pelanggan                                                           | -                                           | **PASSED** | Simulasi penyesuaian saldo demo berfungsi presisi                                                                                                    |
| **Percobaan Akses `/admin/*`**     | Trader mencoba membuka URL `/admin` atau sub-halamannya                                                      | `GET /api/admin/*`                          | **PASSED** | **RBAC Guard Aktif**: Diblokir dengan tampilan 403 Forbidden dan response API 403                                                                    |

---

### C. Matrix Pengujian Peran 3: Super Administrator (`admin@gotrade.com` / Admin Role)

| Halaman / Route                              | Fitur & Akses Pengujian                                                                                                 | API Terkait                                      |   Status   | Output & Hasil Pengujian                                                                                                                            |
| :------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------- | :--------: | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Layout Admin (`/admin`)**                  | Ringkasan statistik sistem, sidebar navigasi admin, & otorisasi peran                                                   | `GET /api/users`                                 | **PASSED** | Verifikasi peran berhasil & memuat dashboard admin                                                                                                  |
| **Kelola Users (`/admin/users`)**            | Listing trader, pencarian, pengeditan saldo pengguna, status akun & role via `secureFetch`                              | `GET/POST/PUT/DELETE /api/users`                 | **PASSED** | Penyesuaian saldo trader & blokir/aktifkan akun sukses dengan token otentikasi                                                                      |
| **Kelola Profit (`/admin/profit`)**          | Listing trader (Username, Email, Saldo Deposit, Saldo Profit) & injeksi profit via `secureFetch`                        | `GET /api/users`, `POST /api/admin/profit`       | **PASSED** | Injeksi profit langsung menambah saldo profit & balance trader secara real-time                                                                     |
| **Kelola Pasar (`/admin/mata-uang`)**        | CRUD instrumen pasar (Forex/Metals/Indices/Crypto), spread, & status                                                    | `GET/POST/PUT/DELETE /api/currencies`            | **PASSED** | Penambahan & pengubahan spread instrumen pasar berfungsi                                                                                            |
| **Kelola Sinyal (`/admin/sinyal`)**          | CRUD sinyal trading (Symbol, Action BUY/SELL, TP/SL, Rasionasi) via `secureFetch`                                       | `GET/POST/PUT/DELETE /api/signals`               | **PASSED** | Pembuatan & pembaruan sinyal terpublikasi instan ke user                                                                                            |
| **Kelola Berita (`/admin/berita`)**          | CRUD berita finansial (Judul, Slug, Kategori, Gambar, Excerpt, Konten) via `secureFetch`                                | `GET/POST/PUT/DELETE /api/news`                  | **PASSED** | Publikasi & pengeditan artikel berita berjalan lancar                                                                                               |
| **Persetujuan Top-Up (`/admin/top-up`)**     | Verifikasi deposit trader, kolom Bukti Transfer, modal dialog resi resolusi penuh, tombol Setujui (Auto Credit) / Tolak | `GET/PATCH /api/transactions`                    | **PASSED** | Thumbnail resi muncul di tabel; modal dialog resi menampilkan foto bukti & rincian transaksi; persetujuan deposit mengkreditkan saldo secara instan |
| **Persetujuan Withdraw (`/admin/withdraw`)** | Verifikasi withdraw trader -> Tombol Setujui (Auto Debit) / Tolak via `secureFetch`                                     | `GET/PATCH /api/transactions`                    | **PASSED** | Persetujuan penarikan secara akurat memotong saldo trader                                                                                           |
| **Pengaturan Referral (`/admin/referral`)**  | Pengaturan persentase komisi referral per tier level via `secureFetch`                                                  | `GET/POST/PUT/DELETE /api/referrals`             | **PASSED** | Konfigurasi tarif komisi tersimpan ke database                                                                                                      |
| **Pengaturan Sistem (`/admin/pengaturan`)**  | Pengaturan QRIS payload, mode maintenance, & profil perusahaan via `secureFetch`                                        | `GET/POST /api/settings`                         | **PASSED** | Pembaruan QRIS payload & info sistem tersimpan permanen                                                                                             |

---

### D. Hasil Kompilasi & Pemindaian Linter

- **`compile_applet`**: **SUCCESS** — Seluruh aplikasi dikompilasi tanpa kesalahan sintaksis atau kegagalan modul.
- **`lint_applet`**: **PASSED (0 Errors)** — Pemindaian linter ESLint dan TypeScript lulus 100% tanpa error.
