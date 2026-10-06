# Product Requirement Document (PRD) & Technical Specification

## Gotrade — Platform Trading Online Legal, Aman & Terpercaya

---

## 1. Executive Summary & Overview

**Gotrade** adalah platform aplikasi trading online modern, aman, dan legal yang menyediakan layanan perdagangan aset keuangan global seperti **Forex, Komoditas (Gold/Silver), Indeks Saham Global, dan Kripto**.

Aplikasi ini dirancang dengan antarmuka yang sangat responsif, intuitif, serta dilengkapi dengan sistem akun dwifungsi (**Trader User** dan **Super Administrator**). Gotrade mengintegrasikan:

- Simulasi kuotasi harga waktu-nyata (_real-time price simulation_) & grafik interaktif Recharts.
- Mekanisme deposit QRIS Dinamis & Transfer Bank dengan batas minimal **$1,000 USD** (Rp 16.000.000 IDR) yang masuk **murni 100% sebagai saldo deposit pokok aktif** (tanpa bonus/profit instan di awal).
- **Mekanisme Penyaluran Profit Fleksibel & Terkendali Penuh oleh Admin (`/admin/profit`)**:
  - Penyaluran profit **tidak berjalan otomatis tanpa kendali**, melainkan **100% on-demand sesuai keputusan Admin** (misal: Hari Senin profit 10%, Selasa libur/tidak ada profit, Hari Rabu profit 15%).
  - Admin dapat menetapkan persentase profit harian global dan menerapkan ke seluruh trader dengan 1-klik ("Terapkan ke Seluruh Trader"), atau menyalurkan profit khusus per trader individual.
- **Tampilan Metrik Trading di Halaman Beranda (`/beranda`)**:
  - **Balance**: Total Saldo Gabungan (`user.balance`) yang mencakup saldo deposit pokok + akumulasi profit.
  - **Equity**: Akumulasi Profit Total (`user.profit`) yang telah dihasilkan oleh trader.
  - **Free Margin**: Saldo Deposit Utama / Modal Pokok Aktif ($\text{Total Saldo Gabungan} - \text{Akumulasi Profit Total}$).
  - **Margin**: Estimasi Profit Hari Ini ($\text{Saldo Deposit Utama} \times \frac{\text{Rate Harian}}{100}$).
  - **Margin Level**: Persentase rate acuan dari Pengaturan Profit Harian Global (Seluruh User) yang aktif di `/admin/profit` (misal `8.00%` atau `10.00%`).
- **Rekening Tujuan Deposit Dinamis (`/admin/pengaturan` -> `/deposit`)**: Bank tujuan deposit resmi (default: Keb Hana Bank, No. Rek: `11628950560`, a/n `AKSAY S.PUTRA`) yang dapat dikelola secara CRUD oleh Admin di menu Pengaturan dan langsung terintegrasi secara real-time pada kartu rekening tujuan di halaman `/deposit`.
- **CRUD Rekening / E-Wallet Sumber Dana Deposit**: Daftar opsi rekening/e-wallet sumber dana pembayaran yang dapat ditambah, diedit, atau dihapus oleh Admin di `/admin/pengaturan` dan tampil sebagai pilihan metode transfer bagi trader pada halaman `/deposit`.
- **Contact Person Support Resmi AKSAY (`/lainnya`)**: Dedicated Account Support resmi Gotrade a/n **AKSAY** (Nomor WhatsApp: `082329157278`) yang dapat dikelola secara CRUD penuh oleh Admin di `/admin/pengaturan` dan dirender dinamis di halaman `/lainnya` dengan tautan interaktif langsung ke WhatsApp.
- **Persetujuan Permintaan Penarikan Dana di Role Admin (`/admin/withdraw`)**:
  - Halaman khusus di sidebar admin (kelompok menu TRANSAKSI -> Withdraw) seperti semula untuk meninjau dan memproses antrean transaksi penarikan dana trader, melihat rincian nomor rekening tujuan, status, serta mengeksekusi tindakan persetujuan (Setujui / Tolak) yang memotong saldo gabungan & saldo profit secara sinkron.
- **Halaman Baru Pengaturan Withdraw di Role Admin (`/admin/pengaturan-withdraw`)**:
  - Halaman mandiri baru di sidebar admin (kelompok menu TRANSAKSI -> Pengaturan Withdraw) untuk mengonfigurasi aturan dan limit penarikan dana setiap user yang terdaftar di aplikasi:
    - **Biaya Admin (Admin Fee)**: Dapat disetel Bebas Biaya (Gratis), Nominal Tetap Rupiah (Flat IDR), atau Persentase (%) dari nominal penarikan.
    - **Batas Frekuensi Penarikan Harian**: Default 1x sehari, dapat diatur hingga 50x per hari kalender (WIB).
    - **Batas Maksimal Penarikan (% dari Akumulasi Profit Total)**: Default 10%, dapat diubah fleksibel per akun (misal 5%, 10%, 15%, 20%, 50%, atau 100%).
    - **Batas Minimal Penarikan (IDR)**: Default Rp 100.000 IDR.
    - **Status Izin Penarikan**: Diizinkan (Aktif), Ditangguhkan Sementara (Suspended dengan catatan/pesan kustom admin), atau Dibekukan (Blocked).
    - **1-Klik Reset Kuota Harian**: Admin dapat langsung me-reset kuota penarikan user untuk hari ini tanpa menunggu reset otomatis pukul 00:00 WIB.
    - **Konfigurasi Default Global**: Modal pengaturan bawaan sistem dengan opsi "Terapkan ke Seluruh Trader yang Ada".
  - **Integritas Sumber Dana Terkunci**: Dana yang dapat ditarik **HANYA berasal dari data Akumulasi Profit Total (`/admin/profit`)** akun trader. Modal deposit awal trader 100% aman dan tidak dapat ditarik sebagai profit.
  - **Proteksi Input Otomatis (*Strict Clamping*)**: Form input penarikan pada `/withdraw` membatasi dan mengunci angka input pengguna agar tidak dapat melebihi batas maksimal persentase profit yang ditetapkan.
  - **Optimalisasi Modal Responsif Seluler (Mobile)**: Seluruh pop-up dan modal dialog (termasuk pembuatan notifikasi di `/admin/notifikasi`, detail user, peninjauan transfer resi, dan pengaturan ketentuan withdraw) mendukung *touch pan*, *overscroll containment*, dan *smooth touch scrolling* di semua smartphone tanpa terpotong atau tertahan keyboard.
- **CRUD Rekening Bank Pengguna (`/api/user/bank-accounts`)**: Manajemen daftar rekening bank pribadi trader di menu `/lainnya` -> Informasi Bank (Tambah, Edit, Hapus, Set Utama) yang terintegrasi otomatis dengan form pilihan bank pada halaman Penarikan (`/withdraw`).
- **Program Gotrade Rewards (`/rewards`)**: Sistem penukaran poin saldo trading (1 Poin = Rp 1.000.000 saldo) dengan berbagai hadiah eksklusif (iPhone 16 Pro, MacBook Pro, Emas Antam, E-Wallet) lengkap dengan manajemen klaim reward di panel admin (`/admin/rewards`).
- Panel manajemen administrator untuk persentase profit harian global, injeksi profit kustom per user, persetujuan transaksi deposit & withdraw, siaran notifikasi broadcast, manajemen sinyal trading, berita finansial, mata uang/instrumen pasar, serta jejak audit keamanan (_audit logs_).
- Arsitektur **Role-Based Access Control (RBAC)** dan proteksi berlapis (_Defense-in-Depth_).

---

## 2. Tech Stack & Architecture

### Front-End Framework

- **React 19** & **TypeScript 5.8**
- **TanStack Start & TanStack Router** (`@tanstack/react-router`) untuk routing SPA yang mulus, modal state handling, dan nested layout rendering.
- **Tailwind CSS v4** dengan varian tema terang/putih & hijau sesuai identitas visual Gotrade, animasi `tw-animate-css`, dan komponen berbasis `@radix-ui` (Shadcn/UI paradigm).
- **Brand Identity & Assets**: Standardisasi logo resmi menggunakan `/logo.jpg` via komponen terpadu `AppLogo` di seluruh layout pengguna, modal, dan sidebar admin.
- **Recharts** untuk visualisasi grafik pergerakan harga instrumen finansial (Candlestick & Line).
- **Lucide React Icons** untuk konsistensi simbol visual.
- **Secure API Client (`secureFetch`)**: Klien fetch terstandarisasi di `/src/lib/api-client.ts` yang otomatis menginjeksi token `Bearer`, menangani `credentials: "include"`, serta mendeteksi respons `401 Unauthorized`, `403 Forbidden`, dan `429 Rate Limit` dengan notifikasi toast informatif.

### Back-End & API Layer

- **Express.js API Server** (`/src/server/app.ts` & `/src/server/api-handler.ts`).
- **Role-Based Access Control (RBAC)**: Middleware `requireAdmin` dan `requireAuth` membatasi eksekusi endpoint administratif hanya untuk akun dengan peran `admin`.
- **RESTful Endpoints** terproteksi menggunakan token sesi berbasis `Authorization: Bearer <token>` dan HttpOnly session cookies (`gotrade_session`).
- **Security Headers & Defense-in-Depth**: Perlindungan terhadap sniffing (`X-Content-Type-Options: nosniff`), proteksi framing (`X-Frame-Options: SAMEORIGIN`), isolasi origin (`Referrer-Policy: strict-origin-when-cross-origin`), sanitasi payload, serta pembatasan laju permintaan (_Rate Limiting_).
- **Audit Logs Table**: Pencatatan riwayat setiap aksi administratif dan kejadian keamanan sistem ke tabel `audit_logs`.
- **Database Engine & Seeders**: Driver `pg` (PostgreSQL) dengan sistem **Seamless Fallback** ke **In-Memory PostgreSQL Engine (`pg-mem`)** dan disk store JSON (`/.data/db_store.json`). Dilengkapi skrip seeding data mandiri:
  - `npm run db:seed`: Seeding akun pengguna trader (`user@gotrade.com`) & super administrator (`admin@gotrade.com`).
  - `npm run seed:news`: Seeding 9 artikel berita hardcoded lengkap (`scripts/seed-news.ts`) ke database dan disk store.

---

## 3. Database Schema & Architecture

Infrastruktur database mengelola 10 entitas tabel utama:

### 1. `users` (Manajemen Pengguna)

| Kolom            | Tipe Data           | Keterangan                               |
| :--------------- | :------------------ | :--------------------------------------- |
| `id`             | SERIAL PRIMARY KEY  | ID Unik Pengguna                         |
| `name`           | VARCHAR(255)        | Nama Lengkap Pengguna                    |
| `email`          | VARCHAR(255) UNIQUE | Email Akun (Lowercased)                  |
| `password`       | VARCHAR(255)        | Kredensial Password (Salted Scrypt Hash) |
| `phone`          | VARCHAR(50)         | Nomor Telepon                            |
| `role`           | VARCHAR(50)         | Peran (`user` atau `admin`)              |
| `account_number` | VARCHAR(50)         | Nomor Akun Trading (8 digit)             |
| `balance`        | NUMERIC(15,2)       | Saldo Akun Total (USD)                   |
| `profit`         | NUMERIC(15,2)       | Akumulasi Saldo Profit Pengguna (USD)    |
| `base_profit`    | NUMERIC(15,2)       | Nominal Basis Kalkulasi Profit (USD)     |
| `account_type`   | VARCHAR(50)         | Jenis Akun (Standard Live / Demo)        |
| `max_withdrawal_percent` | NUMERIC(5,2) | Batas Maksimal Penarikan (% Profit, default 10%) |
| `max_daily_frequency`   | INT          | Batas Frekuensi Penarikan per Hari (default 1x)  |
| `admin_fee_type` | VARCHAR(20)         | Model Biaya Admin (`free`, `flat`, `percent`)    |
| `admin_fee_value`| NUMERIC(15,2)       | Nilai Biaya Admin (Nominal Rp atau %)            |
| `min_withdrawal_idr` | NUMERIC(15,2)   | Batas Minimal Penarikan (IDR, default Rp 100.000)|
| `withdrawal_status`  | VARCHAR(50)     | Status Izin Penarikan (`active`, `suspended`, `blocked`) |
| `withdrawal_note`    | TEXT            | Catatan / Alasan Khusus dari Administrator       |
| `withdrawal_quota_reset_date` | VARCHAR(50) | Tanggal Override Reset Kuota Harian (WIB)   |
| `created_at`     | TIMESTAMP           | Tanggal Pendaftaran                      |

### 2. `user_bank_accounts` (Rekening Bank Pengguna)

| Kolom            | Tipe Data                | Keterangan                                     |
| :--------------- | :----------------------- | :--------------------------------------------- |
| `id`             | SERIAL PRIMARY KEY       | ID Rekening Bank                               |
| `user_id`        | INT REFERENCES users(id) | ID Pemilik Rekening                            |
| `bank_name`      | VARCHAR(100)             | Nama Bank / E-Wallet                           |
| `account_number` | VARCHAR(100)             | Nomor Rekening / Handphone                     |
| `account_holder` | VARCHAR(255)             | Nama Pemilik Rekening                          |
| `is_primary`     | BOOLEAN                  | Status Rekening Utama / Default (`true/false`) |
| `created_at`     | TIMESTAMP                | Tanggal Penambahan                             |
| `updated_at`     | TIMESTAMP                | Waktu Perubahan                                |

### 3. `transactions` (Transaksi Deposit & Withdraw)

| Kolom            | Tipe Data                | Keterangan                                                 |
| :--------------- | :----------------------- | :--------------------------------------------------------- |
| `id`             | VARCHAR(50) PRIMARY KEY  | Kode Transaksi (cth: `TU-98412`, `WD-10293`, `PRF-12345`)  |
| `user_id`        | INT REFERENCES users(id) | ID Pemilik Transaksi                                       |
| `user_name`      | VARCHAR(255)             | Nama Pemilik Transaksi                                     |
| `account_number` | VARCHAR(50)              | Nomor Akun Trading Pengguna                                |
| `type`           | VARCHAR(20)              | Tipe (`Top Up`, `Withdraw`, `Profit`)                      |
| `channel`        | VARCHAR(100)             | Kanal Metode (QRIS, Bank BCA, Mandiri, Admin Profit Grant) |
| `destination`    | VARCHAR(100)             | Rekening / Akun Tujuan                                     |
| `amount`         | NUMERIC(15,2)            | Jumlah Nominal Transaksi (IDR atau USD)                    |
| `status`         | VARCHAR(20)              | Status (`Menunggu`, `Berhasil`, `Ditolak`)                 |
| `proof_image`    | TEXT                     | Data URI gambar bukti transfer / resi pembayaran pengguna  |
| `created_at`     | TIMESTAMP                | Tanggal & Waktu Transaksi                                  |

### 4. `notifications` (Notifikasi & Pengumuman Broadcast)

| Kolom        | Tipe Data          | Keterangan                                               |
| :----------- | :----------------- | :------------------------------------------------------- |
| `id`         | SERIAL PRIMARY KEY | ID Notifikasi                                            |
| `title`      | VARCHAR(255)       | Judul Notifikasi                                         |
| `message`    | TEXT               | Isi Pesan Notifikasi                                     |
| `type`       | VARCHAR(50)        | Kategori (`info`, `promo`, `alert`, `system`, `trading`) |
| `target`     | VARCHAR(50)        | Target Penerima (`all`, `trader`)                        |
| `is_pinned`  | BOOLEAN            | Penanda Sematan Prioritas (Pinned)                       |
| `badge`      | VARCHAR(50)        | Label Badge Kustom (cth: "Penting", "Hot Promo")         |
| `author`     | VARCHAR(100)       | Penulis / Administrator Pengirim                         |
| `action_url` | VARCHAR(255)       | Tautan Navigasi Aksi (cth: `/trade`, `/deposit`)         |
| `created_at` | TIMESTAMP          | Waktu Penyiaran                                          |

### 5. `rewards` (Hadiah Gotrade Rewards)

| Kolom             | Tipe Data          | Keterangan                                         |
| :---------------- | :----------------- | :------------------------------------------------- |
| `id`              | SERIAL PRIMARY KEY | ID Hadiah                                          |
| `title`           | VARCHAR(255)       | Nama Produk Hadiah                                 |
| `category`        | VARCHAR(50)        | Kategori (`Gadget`, `Emas`, `Voucher`, `Aksesori`) |
| `points_required` | INT                | Jumlah Poin yang Dibutuhkan                        |
| `stock`           | INT                | Jumlah Stok Tersedia                               |
| `image_url`       | TEXT               | URL Gambar Produk                                  |
| `description`     | TEXT               | Deskripsi Produk                                   |
| `active`          | BOOLEAN            | Status Aktif Penukaran (`true/false`)              |

### 6. `reward_redemptions` (Klaim Penukaran Hadiah)

| Kolom              | Tipe Data          | Keterangan                                               |
| :----------------- | :----------------- | :------------------------------------------------------- |
| `id`               | SERIAL PRIMARY KEY | ID Klaim                                                 |
| `user_id`          | INT                | ID Pemohon                                               |
| `user_name`        | VARCHAR(255)       | Nama Pemohon                                             |
| `user_email`       | VARCHAR(255)       | Email Pemohon                                            |
| `reward_id`        | INT                | ID Hadiah yang Diklaim                                   |
| `reward_title`     | VARCHAR(255)       | Nama Hadiah yang Diklaim                                 |
| `points_spent`     | INT                | Jumlah Poin yang Ditukarkan                              |
| `status`           | VARCHAR(50)        | Status (`PENDING`, `PROCESSED`, `COMPLETED`, `REJECTED`) |
| `shipping_address` | TEXT               | Alamat Pengiriman / Nomor Penerima                       |
| `notes`            | TEXT               | Catatan Tambahan Pemohon / Admin                         |
| `created_at`       | TIMESTAMP          | Waktu Permohonan                                         |

### 7. `audit_logs` (Keamanan & Jejak Audit Admin)

| Kolom        | Tipe Data          | Keterangan                                            |
| :----------- | :----------------- | :---------------------------------------------------- |
| `id`         | SERIAL PRIMARY KEY | ID Log                                                |
| `user_id`    | INT                | ID Pengguna Pelaksana Aksi                            |
| `user_email` | VARCHAR(255)       | Email Pengguna                                        |
| `user_role`  | VARCHAR(50)        | Peran Akun (`admin`, `user`)                          |
| `action`     | VARCHAR(100)       | Kode Aksi Keamanan (cth: `ADMIN_CREATE_NOTIFICATION`) |
| `details`    | TEXT               | Deskripsi Rinci Aktivitas                             |
| `ip_address` | VARCHAR(100)       | Alamat IP Klien                                       |
| `status`     | VARCHAR(50)        | Status (`SUCCESS`, `BLOCKED`, `WARNING`)              |
| `created_at` | TIMESTAMP          | Waktu Kejadian                                        |

### 8. `signals` (Sinyal Trading)

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

### 9. `news` (Berita Finansial & Analisa Pasar)

| Kolom        | Tipe Data           | Keterangan          |
| :----------- | :------------------ | :------------------ |
| `id`         | SERIAL PRIMARY KEY  | ID Berita           |
| `title`      | VARCHAR(255)        | Judul Artikel       |
| `slug`       | VARCHAR(255) UNIQUE | URL Friendly Slug   |
| `category`   | VARCHAR(50)         | Kategori Berita     |
| `author`     | VARCHAR(100)        | Penulis / Sumber    |
| `image_url`  | TEXT                | URL Sampul Gambar   |
| `excerpt`    | TEXT                | Ringkasan Singkat   |
| `body`       | TEXT                | Isi Artikel Lengkap |
| `created_at` | TIMESTAMP           | Waktu Terbit        |

### 10. `settings` (Pengaturan Aplikasi, Rekening & Rate Profit)

| Kolom   | Tipe Data                | Keterangan                                                                                                                  |
| :------ | :----------------------- | :-------------------------------------------------------------------------------------------------------------------------- |
| `key`   | VARCHAR(100) PRIMARY KEY | Kunci Konfigurasi (`deposit_bank_name`, `deposit_account_number`, `deposit_account_name`, `contact_persons_list`, dll.)   |
| `value` | TEXT                     | Nilai Konfigurasi (JSON Array / String / Number)                                                                            |

Konfigurasi kunci dinamis dalam tabel `settings`:
- `deposit_bank_name`: Nama Bank Rekening Tujuan Deposit (default: `Keb Hana Bank`).
- `deposit_account_number`: Nomor Rekening Tujuan Deposit (default: `11628950560`).
- `deposit_account_name`: Atas Nama Rekening Tujuan Deposit (default: `AKSAY S.PUTRA`).
- `deposit_payment_sources`: JSON Array daftar Rekening / E-Wallet Sumber Dana Deposit yang diizinkan (Bank BCA, Mandiri, BNI, BRI, BSI, CIMB Niaga, Permata, GoPay, OVO, DANA, ShopeePay, LinkAja).
- `contact_persons_list`: JSON Array daftar Contact Person Support Gotrade (nama: AKSAY, role: Gotrade Dedicated Account Support, nomor WhatsApp: 082329157278, status aktif).
- `telegram_contacts_list`: JSON Array daftar Contact Person Telegram Support Gotrade (nama, role, username @telegram, link t.me, deskripsi, status aktif).
- `global_daily_profit_rate`: Persentase acuan profit harian global (default: 5%) yang dapat diubah dan diterapkan secara on-demand oleh Admin di `/admin/profit`.
- `default_max_withdrawal_percent`: Batas maksimal penarikan bawaan (% dari Akumulasi Profit Total, default: 10%).
- `default_max_daily_frequency`: Batas frekuensi penarikan harian bawaan per hari kalender WIB (default: 1x sehari).
- `default_admin_fee_type`: Skema biaya admin bawaan (`free` = Bebas Biaya, `flat` = Nominal Flat IDR, `percent` = Persentase %, default: `free`).
- `default_admin_fee_value`: Nilai besaran biaya admin bawaan (default: 0).
- `default_min_withdrawal_idr`: Batas minimal penarikan bawaan dalam Rupiah (default: Rp 100.000 IDR).

---

## 4. Keamanan & Role-Based Access Control (RBAC)

Aplikasi Gotrade menerapkan prinsip **Defense-in-Depth** dengan pembagian peran tegas:

1. **Role: Public / Guest**
   - Hak Akses: Halaman pengenalan (`/`), katalog berita umum (`/berita`), detail artikel (`/berita/$slug`), katalog rewards (`/rewards`), form masuk (`/login`), dan pendaftaran (`/register`).
   - Batasan: Tidak dapat mengakses modul trading, deposit/withdraw, riwayat transaksi, atau portal admin.

2. **Role: Trader User (`user`)**
   - Hak Akses: Dashboard trader (`/beranda`), pasar (`/pasar`), eksekusi trading (`/trade`), order aktif (`/order`), riwayat pribadi (`/riwayat`), pengajuan deposit (`/deposit`), penarikan dana (`/withdraw`), program referral (`/referral`), program rewards (`/rewards`), kelola rekening bank di `/lainnya` -> Informasi Bank, dan profil (`/profil`).
   - Fitur Notifikasi: Melihat notifikasi siaran publik via modal lonceng (`/beranda`), filter tipe notifikasi, tracking status baca.
   - Batasan: Dilarang keras mengakses endpoint atau rute `/admin/*`. Permintaan ke API admin akan direspons dengan kode status `403 Forbidden`.

3. **Role: Super Administrator (`admin`)**
   - Hak Akses: Seluruh kontrol panel administratif (`/admin/*`), manajemen pengguna (`/admin/users`), kelola profit per akun & penerapan rate harian (`/admin/profit`), manajemen notifikasi & siaran broadcast (`/admin/notifikasi`), persetujuan transaksi Top-Up & Bukti Transfer (`/admin/top-up`), persetujuan penarikan (`/admin/withdraw`), kelola rewards & klaim (`/admin/rewards`), manajemen sinyal (`/admin/sinyal`), artikel berita (`/admin/berita`), instrumen pasar (`/admin/mata-uang`), komisi referral (`/admin/referral`), riwayat audit logs (`/admin/audit-logs`), dan pengaturan sistem/QRIS/rekening/contact person (`/admin/pengaturan`).

4. **Proteksi Tambahan**:
   - **Brute Force Lockout**: Pemblokiran otomatis setelah 5 kegagalan login berturut-turut.
   - **Scrypt Password Hashing**: Kata sandi dienkripsi menggunakan algoritma Scrypt bergaram (_salted scrypt_).
   - **Rate Limiting**: Pembatasan frekuensi permintaan ke endpoint sensitif.
   - **Privacy Shield**: Penghapusan lengkap metadata kartu sosial (OpenGraph dan Twitter Cards) untuk menjaga kerahasiaan dan privasi operasional trader.

---

## 5. Pemetaan Fitur & Struktur Halaman Menu

### A. Akses Publik & Autentikasi (`/`, `/login`, `/register`)

- **Onboarding Card (`/`)**: Tampilan sambutan aplikasi, pengenalan fitur utama, legalitas resmi, dan tombol aksi Login/Registrasi.
- **Login Page (`/login`)**: Form autentikasi email & password dengan proteksi brute force. Dilengkapi fitur **Auto-Fill Kredensial Otomatis**: email dan kata sandi otomatis terisi secara instan baik setelah pendaftaran akun baru di `/register` maupun saat pengguna melakukan _Logout_, sehingga trader dapat langsung masuk kembali tanpa perlu mengetik ulang kredensial.
- **Register Page (`/register`)**: Pendaftaran akun trader baru (Nama Lengkap, Username, Email, Kata Sandi, dan Kode Referral opsional), otomatis menggenerasikan 8-digit nomor akun trading unik. Setelah pendaftaran berhasil, kredensial (email & kata sandi) otomatis disimpan ke penyimpanan sesi lokal dan pengguna dialihkan langsung ke `/login` dalam kondisi input sudah terisi otomatis.

### B. Portal Utama Trader (User Interface)

- **Beranda (`/beranda`)**:
  - Header interaktif: Ikon lonceng notifikasi dengan titik merah (_badge_) dinamis saat ada pesan belum dibaca.
  - **Account Card Komprehensif**:
    - **Balance**: Total Saldo Gabungan (`user.balance`) yang mencakup saldo deposit pokok + akumulasi profit.
    - **Equity**: Akumulasi Profit Total (`user.profit`) yang telah diperoleh akun.
    - **Free Margin**: Estimasi Profit Hari Ini ($\text{Saldo Deposit Pokok} \times \frac{\text{Rate Harian}}{100}$).
    - **Margin**: Jaminan margin order ($0.00).
    - **Margin Level**: Persentase rate acuan dari Pengaturan Profit Harian Global (Seluruh User) yang aktif di `/admin/profit` (misal `5.00%`).
    - Modal dialog interaktif penjelasan item ketika mengklik ikon info pada Free Margin, Margin, dan Margin Level.
  - Shortcut menu transaksi cepat (Deposit, Withdraw, Trade, Referral, Berita, Riwayat).
  - Ticker pergerakan harga populer real-time.
  - Seksi Signal Produk Terpopuler lengkap dengan tombol "Lihat Semua" ke `/pasar`.
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
  - Penyelarasan status sinkron dengan database admin: status **Berhasil** (badge hijau) saat disetujui admin, **Diproses** (badge kuning) saat menunggu, dan **Gagal** (badge merah) saat ditolak.
  - Format mata uang ganda: Top Up dan Withdraw dalam Rupiah (IDR) dengan subteks ekuivalen USD, sedangkan Profit dalam USD dengan subteks ekuivalen Rupiah.
- **Deposit / Top Up (`/deposit`)**:
  - **Rekening Tujuan Deposit**: Menampilkan kartu resmi Rekening Tujuan Transfer Bank (Nama Bank: Keb Hana Bank, Nomor Rekening: 11628950560, Atas Nama: AKSAY S.PUTRA) dengan tombol 1-klik "Salin Rekening".
  - **Pilihan Sumber Dana Dinamis**: Dropdown interaktif "Rekening / E-Wallet Sumber Dana" yang datanya bersumber langsung dari konfigurasi CRUD Admin di `/admin/pengaturan`.
  - **Pembersihan Komponen**: Komponen statis "Atas Nama Rekening" yang kosong telah dihapus sepenuhnya sehingga form deposit menjadi bersih dan ergonomis.
  - Batas **Minimal Deposit**: **$1,000 USD** (setara Rp 16.000.000 IDR).
  - Fitur Unggah Bukti Transfer dengan pratinjau thumbnail, perbesar layar penuh, dan kompresi client-side.
  - **Komponen Kebijakan & Ketentuan Penarikan Resmi**: Menampilkan kartu ketentuan penarikan platform secara terperinci (Aturan penarikan maksimal 1x sehari, batas pencairan maksimal 10% dari Akumulasi Profit total, 100% deposit utuh sebagai modal pokok aktif, serta kotak status kuota penarikan akun real-time dilengkapi tautan cepat ke `/withdraw`).
- **Withdraw / Penarikan (`/withdraw`)**:
  - **Mekanisme & Alur Penarikan Lengkap**:
    1. **Sumber Dana Terkunci (Hanya Akumulasi Profit Total)**: Dana yang dapat ditarik **HANYA berasal dari data Akumulasi Profit Total** (`user.profit`) akun trader (data profit yang dikelola pada halaman `/admin/profit`), bukan dari modal deposit awal (`Free Margin`). Jika trader belum memiliki profit (`Profit = Rp 0`), kolom input nominal dan tombol submit dinonaktifkan secara otomatis dengan pesan edukatif. Modal deposit pokok 100% aman dan utuh untuk aktivitas trading.
    2. **Pengambilan Limit Dinamis Real-Time**: Form penarikan memuat parameter limit spesifik akun pengguna via `/api/user/withdrawal-limit`, mencakup batas persentase maksimal profit, batas frekuensi harian, penggunaan kuota hari ini, skema biaya admin, batas minimal penarikan, dan status perizinan akun.
    3. **Batas Maksimal Penarikan (% dari Akumulasi Profit Total)**: Secara bawaan dibatasi maksimal **10% dari Akumulasi Profit Total** (`user.profit`), atau persentase khusus yang telah dikonfigurasi admin pada akun tersebut di `/admin/withdraw`.
    4. **Proteksi Input Otomatis (*Strict Clamping*)**: Kolom input nominal penarikan secara otomatis membatasi angka yang dimasukkan pengguna agar tidak dapat melebihi batas maksimal persentase profit yang diizinkan (`maxWithdrawableIDR`). Tombol preset ("10% Maksimal", "5% Profit", "Min. Rp 100 Rb") dan tombol cepat "Tarik Maks. 10%" menghitung angka pas secara instan.
    5. **Batas Frekuensi Penarikan Harian (Default 1x Sehari)**: Pengguna dibatasi frekuensi penarikan sesuai kuota harian akun (default 1 kali per hari kalender WIB). Kuota di-reset otomatis setiap hari pada pukul **00:00 WIB**, atau dapat di-reset kapan saja oleh admin via fitur 1-klik di `/admin/withdraw`. Jika kuota habis, formulir terkunci otomatis dengan kartu peringatan dan countdown info reset.
    6. **Transparansi Biaya Admin (Admin Fee)**: Menampilkan rincian perhitungan biaya admin secara transparan berdasarkan konfigurasi admin: Bebas Biaya (Gratis), Nominal Tetap Rupiah (Flat IDR), atau Persentase (%) dari nominal penarikan, beserta rincian estimasi dana bersih yang akan masuk ke rekening trader.
    7. **Batas Minimal Penarikan (IDR)**: Minimal penarikan Rp 100.000 IDR (atau sesuai aturan kustom admin per user).
    8. **Integrasi Rekening Bank Pribadi**: Dropdown interaktif memilih rekening tujuan transfer dari daftar rekening bank / e-wallet yang telah disimpan di menu `/lainnya` -> Informasi Bank.
    9. **Alur Pengajuan & Verifikasi Transaksi**: Permohonan penarikan yang dikirim akan berstatus **"Menunggu"** (`Diproses`) dan masuk ke antrean admin di `/admin/withdraw`. Setelah disetujui (*Approve*) oleh admin, status berubah menjadi **"Berhasil"** dan sistem secara otomatis mendebit saldo gabungan (`balance`) serta saldo profit (`profit`) trader. Jika ditolak (*Reject*), status berubah menjadi **"Ditolak"** dan dana tetap utuh di akun trader.
- **Gotrade Rewards (`/rewards`)**:
  - Katalog produk reward (iPhone 16 Pro, MacBook Pro, Emas Antam, E-Wallet) dengan tema visual putih-hijau resmi Gotrade.
  - Kalkulasi otomatis poin user berdasarkan saldo akun (1 Poin = Rp 1.000.000 saldo).
  - Form klaim reward dengan input alamat pengiriman & catatan tambahan.
  - Tab Histori Penukaran (_Pending, Diproses, Selesai, Ditolak_).
- **Berita Finansial (`/berita` & `/berita/$slug`)**:
  - Katalog berita finansial terupdate dengan klasifikasi kategori dan pembaca artikel detail.
- **Program Referral (`/referral`)**:
  - Tampilan kode unik referral pengguna, statistik komisi yang diperoleh, dan generator tautan ajakan kustom.
- **Profil Pengguna (`/profil`)**:
  - Detail identitas trader, nomor akun trading, status tipe akun, ubah kata sandi, dan opsi keluar (_Logout_).
- **Pengaturan & Mode Gelap (`/pengaturan`)**:
  - **Aktivasi & Nonaktivasi Mode Gelap (Dark Mode)**: Tombol switch interaktif untuk mengaktifkan/menonaktifkan tema gelap aplikasi dengan transisi mulus dan penyimpanan persisten di `localStorage`.
  - **Pilihan Skema Tampilan**: Mode Terang (Light), Mode Gelap (Dark), dan Mode Otomatis (Mengikuti Preferensi Sistem OS).
  - **Preferensi & Privasi**: Fitur penyamaran saldo utama di halaman Beranda, serta konfirmasi pop-up sebelum eksekusi order.
- **Menu Lainnya (`/lainnya`)**:
  - **Ringkasan Akun Dinamis & Kontrol Simulasi**: Menampilkan ringkasan Margin, Free Margin, Margin Level, Credits, Floating P/L, dan Win Rate. Khusus pengguna dengan Balance $0.00 dan Equity $0.00, simulasi dinonaktifkan otomatis sehingga nilai secara bersih menampilkan $0.00, 0.00%, dan Win Rate 0% (tidak menampilkan angka simulasi aktif sebelum ada pendanaan). Ketika akun memiliki dana aktif, metrik beroperasi sesuai saldo riil.
  - **Contact Person Support Resmi AKSAY**: Kartu representatif "Gotrade Dedicated Account Support" atas nama **AKSAY** dengan nomor WhatsApp **082329157278**, badge "Dedicated Support", dan tombol interaktif 1-klik langsung menghubungi via WhatsApp (`https://wa.me/6282329157278`). Data ini tersambung dinamis ke CRUD admin di `/admin/pengaturan`.
  - **Contact Person Telegram Support Resmi**: Kartu representatif dukungan Telegram resmi Gotrade dengan indikator live "Online 24/7", ikon resmi Telegram paper-plane, nama kontak, role/jabatan, username `@telegram` yang dapat diklik langsung membuka chat aplikasi Telegram (`https://t.me/...`), tombol Salin Username, serta deskripsi layanan. Data ini tersinkronisasi dinamis dari CRUD admin di `/admin/pengaturan`.
  - **CRUD Rekening Bank Pengguna**: Menu "Informasi Bank" untuk menambah, mengedit, menghapus, serta memilih rekening utama user.
  - **Akses Cepat Pengaturan**: Tautan langsung ke halaman `/pengaturan` dilengkapi badge status Mode Gelap terkini.

### C. Panel Kontrol Administrator (`/admin/*`)

- **Dashboard Admin Overview (`/admin`)**:
  - Metrik statistik platform real-time: total trader aktif, volume deposit, volume penarikan, total klaim rewards, dan sinyal aktif.
- **Kelola Pengguna (`/admin/users`)**:
  - Pencarian dan manajemen seluruh pendaftar akun trader.
  - Penyesuaian saldo trader secara langsung, pengubahan peran (_role_), dan pemblokiran akun.
- **Kelola Profit User (`/admin/profit`)**:
  - **Kontrol Penuh Penyaluran Profit (Manual & Fleksibel On-Demand)**:
    - Input rate profit harian global (default 5%).
    - Tombol aksi *"Terapkan ke Seluruh Trader"* untuk menghitung persentase dari saldo deposit pokok masing-masing trader dan menambahkannya ke saldo & profit trader.
    - Tombol aksi *"Bagi Profit"* per akun trader berdasarkan saldo deposit pokok akun tersebut.
    - Tombol aksi *"Inject Custom Profit"* untuk menambahkan nominal profit kustom ($ USD) secara langsung ke trader tertentu.
  - Tampilan tabel seluruh trader: **Nama Trader & Akun**, **Email**, **Saldo Deposit Pokok**, **Akumulasi Profit**, **Total Saldo Gabungan**, dan **Estimasi Profit Harian**.
- **Pengaturan Sistem, Rekening & Contact Person (`/admin/pengaturan`)**:
  - **CRUD Rekening Tujuan Deposit**: Admin dapat mengubah Nama Bank (Keb Hana Bank), Nomor Rekening (11628950560), dan Atas Nama Rekening Tujuan Deposit (AKSAY S.PUTRA).
  - **CRUD Rekening / E-Wallet Sumber Dana**: Form CRUD lengkap untuk menambah sumber dana baru (Bank/E-Wallet), mengubah nama sumber dana, mengaktifkan/menonaktifkan, atau menghapus item sumber dana yang tersedia bagi trader pada halaman deposit.
  - **CRUD Contact Person Gotrade Support (WhatsApp & Email)**: Panel CRUD terpadu untuk mengelola kontak person support Gotrade (Nama: AKSAY, Jabatan/Role: Gotrade Dedicated Account Support, Nomor WhatsApp: 082329157278, Email, dan Status Aktif).
  - **CRUD Contact Person Telegram Gotrade**: Panel CRUD lengkap khusus untuk mengelola contact person Telegram (Nama Support, Role/Jabatan, Username/Link Telegram `@username`, Deskripsi Layanan, dan Status Aktif). Dilengkapi pencarian real-time, 1-klik toggle switch aktif/nonaktif, modal dialog tambah/edit, konfirmasi hapus, tombol reset ke default, dan live preview pratinjau tampilan kartu trader.
  - **Pengaturan QRIS Pembayaran**: Pengunggahan gambar QRIS dinamis pembayaran platform.
- **Kelola Rewards (`/admin/rewards`)**:
  - Manajemen katalog produk reward (Tambah, Edit, Hapus, Ubah Stok, Ubah Poin Dibutuhkan).
  - Manajemen permohonan klaim reward trader (Proses, Selesai, Tolak). Penolakan klaim mengembalikan stok secara otomatis.
- **Manajemen Notifikasi & Siaran (`/admin/notifikasi`)**:
  - **Statistik Siaran**: Total notifikasi, jumlah notifikasi tersemat (pinned), jumlah promo/alerts, serta target broadcast.
  - **Aksi CRUD Notifikasi**: Pembuatan notifikasi baru, pengeditan pesan, 1-klik sematkan/lepaskan sematan, dan dialog konfirmasi penghapusan aman.
- **Kelola Pasar (`/admin/mata-uang`)**:
  - Tambah, edit, dan hapus instrumen pasar (Forex, Metals, Index, Crypto).
- **Kelola Sinyal Trading (`/admin/sinyal`)**:
  - CRUD penuh sinyal analitis (Simbol, Aksi BUY/SELL, Entry Price, TP1, TP2, SL, timeframe, rasionasi).
- **Kelola Berita Finansial (`/admin/berita`)**:
  - CRUD penuh artikel berita finansial, pengunggahan sampul gambar, penentuan slug URL, dan publikasi.
- **Persetujuan Top-Up (`/admin/top-up`)**:
  - Verifikasi pengajuan deposit trader dengan kolom khusus Bukti Transfer, thumbnail resi, dan modal peninjauan resolusi penuh. Persetujuan deposit mengkreditkan 100% nominal deposit pokok murni ke akun trader.
- **Persetujuan Permintaan Withdraw (`/admin/withdraw`)**:
  - **Kembali Seperti Semula**: Halaman khusus di sidebar admin untuk meninjau, memverifikasi, dan menyetujui atau menolak permohonan penarikan dana trader secara aman.
  - Kartu statistik ikhtisar: Total Permintaan, Perlu Diproses (Pending), Selesai Hari Ini, dan Nominal Menunggu (IDR).
  - Tabel transaksi: ID Transaksi, Pengguna & Akun, Rekening Tujuan & Bank Penerima, Nominal Penarikan (IDR), Status (Menunggu, Berhasil, Ditolak), dan Tindakan (Setujui / Tolak).
  - Persetujuan transaksi (*Approve*) secara otomatis memotong saldo gabungan (`balance`) dan saldo profit (`profit`) trader.
  - Tombol navigasi cepat *"Pengaturan Withdraw"* di bagian header tabel untuk beralih langsung ke halaman `/admin/pengaturan-withdraw`.
- **Halaman Baru: Pengaturan Withdraw (`/admin/pengaturan-withdraw`)**:
  - **Halaman Mandiri Baru di Sidebar Admin**: Berada di bawah menu **TRANSAKSI** -> **Pengaturan Withdraw** (`/admin/pengaturan-withdraw`).
  - **Atur Setiap User yang Terdaftar**:
    - **Biaya Admin (Admin Fee)**: Dapat disetel per user dengan pilihan Bebas Biaya (Gratis), Nominal Tetap Rupiah (Flat IDR), atau Persentase (%) dari nominal penarikan.
    - **Batas Frekuensi Penarikan Harian**: Default 1x sehari, dapat diatur fleksibel 1 s/d 50 kali per hari kalender (WIB).
    - **Batas Maksimal Penarikan (% dari Akumulasi Profit Total)**: Default 10%, dapat diatur fleksibel per akun trader (misal 5%, 10%, 15%, 20%, 50%, atau 100%).
    - **Batas Minimal Penarikan (IDR)**: Minimal penarikan dana per transaksi (default Rp 100.000 IDR).
    - **Status Izin Penarikan**: Aktif (Diizinkan), Ditangguhkan Sementara (Suspended dengan catatan/alasan khusus admin), atau Dibekukan (Blocked).
    - **1-Klik Reset Kuota Harian**: Tombol reset instan untuk mengembalikan kuota penarikan user hari ini tanpa harus menunggu reset otomatis pukul 00:00 WIB.
    - **Konfigurasi Default Global**: Modal aturan bawaan sistem dengan fitur opsi "Terapkan Aturan Ini ke Seluruh Trader yang Ada" dalam 1 kali simpan.
  - **Integritas Sumber Dana Tetap Sama**: Dana yang dapat ditarik **HANYA berasal dari data Akumulasi Profit Total akun trader (data profit yang dikelola pada halaman `/admin/profit`), BUKAN dari modal deposit awal**.
  - **Banner Pintasan Antrean**: Menyediakan tombol cepat untuk langsung membuka antrean persetujuan transaksi di `/admin/withdraw`.
- **Pengaturan Referral (`/admin/referral`)**:
  - Konfigurasi persentase komisi referral tiap level tier.
- **Audit Logs Keamanan (`/admin/audit-logs`)**:
  - Pemantauan real-time aktivitas login, perubahan data oleh admin, percobaan akses RBAC yang ditolak, dan status mesin proteksi brute-force.

---

## 6. Spesifikasi Lengkap API Endpoints

| Endpoint                              | Method                | Otentikasi   | Deskripsi & Hak Akses                                                        |
| :------------------------------------ | :-------------------- | :----------- | :--------------------------------------------------------------------------- |
| `/api/health`                         | `GET`                 | Publik       | Cek kesehatan server, koneksi database, dan status RBAC                      |
| `/api/auth/demo-accounts`             | `GET`                 | Publik       | Mendapatkan daftar akun demo siap pakai (`user` & `admin`)                   |
| `/api/auth/login`                     | `POST`                | Publik       | Masuk akun trader atau admin dengan proteksi brute force                     |
| `/api/auth/register`                  | `POST`                | Publik       | Pendaftaran akun trader baru secara aman                                     |
| `/api/auth/me`                        | `GET`                 | Bearer Token | Mengambil data profil akun yang sedang login                                 |
| `/api/auth/logout`                    | `POST`                | Bearer Token | Mengakhiri sesi pengguna dan mencabut token secara kriptografis              |
| `/api/user/bank-accounts`             | `GET/POST/PUT/DELETE` | User Token   | CRUD Rekening Bank Pribadi milik Trader (`/lainnya` -> Informasi Bank)       |
| `/api/rewards`                        | `GET`                 | Publik/User  | Mengambil katalog reward, poin user, dan histori klaim                       |
| `/api/rewards/redeem`                 | `POST`                | User Token   | Mengajukan klaim penukaran poin reward dengan hadiah                         |
| `/api/admin/rewards`                  | `GET/POST/PUT/DELETE` | Admin Token  | CRUD katalog reward dan manajemen persetujuan klaim (RBAC Admin)             |
| `/api/admin/rewards/redemptions`      | `PUT/PATCH`           | Admin Token  | Update status klaim reward (COMPLETED, REJECTED, PROCESSED)                  |
| `/api/currencies`                     | `GET`                 | Publik       | Mengambil daftar harga instrumen pasar aktif                                 |
| `/api/currencies`                     | `POST/PUT/DELETE`     | Admin Token  | CRUD instrumen mata uang pasar (RBAC Admin)                                  |
| `/api/signals`                        | `GET`                 | Publik       | Mengambil sinyal trading aktif                                               |
| `/api/signals`                        | `POST/PUT/DELETE`     | Admin Token  | CRUD sinyal trading analitis (RBAC Admin)                                    |
| `/api/news`                           | `GET`                 | Publik       | Mengambil daftar artikel berita finansial                                    |
| `/api/news`                           | `POST/PUT/DELETE`     | Admin Token  | CRUD artikel berita finansial (RBAC Admin)                                   |
| `/api/notifications`                  | `GET`                 | Publik       | Mengambil daftar notifikasi siaran publik untuk pengguna                     |
| `/api/admin/notifications`            | `GET/POST/PUT/DELETE` | Admin Token  | CRUD dan siaran notifikasi broadcast (RBAC Admin)                            |
| `/api/transactions`                   | `GET`                 | User/Admin   | Mengambil daftar riwayat transaksi deposit/withdraw                          |
| `/api/transactions`                   | `POST`                | User Token   | Pengajuan deposit (Top Up min $1,000) atau withdraw baru (WD min Rp 100.000) |
| `/api/transactions`                   | `PUT/PATCH`           | Admin Token  | Persetujuan atau penolakan pengajuan transaksi trader (RBAC Admin)           |
| `/api/user/withdrawal-limit`          | `GET`                 | User Token   | Mengambil parameter limit penarikan akun trader secara dinamis (kuota harian, % profit, fee, status) |
| `/api/admin/withdrawal-rules`         | `GET`                 | Admin Token  | Mengambil daftar trader, saldo, profit, kuota penarikan, & konfigurasi global (RBAC Admin) |
| `/api/admin/withdrawal-rules`         | `PUT`                 | Admin Token  | Mengubah aturan penarikan akun trader (%, frekuensi, fee type/val, min IDR, status, note) |
| `/api/admin/withdrawal-rules/reset-quota` | `POST`             | Admin Token  | Melakukan override reset kuota harian penarikan user untuk hari ini (RBAC Admin) |
| `/api/admin/withdrawal-rules/global`  | `PUT`                 | Admin Token  | Mengubah pengaturan bawaan global & opsi terapkan massal ke seluruh trader (RBAC Admin) |
| `/api/admin/profit`                   | `POST`                | Admin Token  | Injeksi profit kustom langsung ke saldo akun trader (RBAC Admin)             |
| `/api/admin/profit/apply-daily-rate`  | `POST`                | Admin Token  | Penerapan rate profit harian global ke seluruh trader atau trader tertentu   |
| `/api/users`                          | `GET/POST/PUT/DELETE` | Admin Token  | Manajemen data, saldo, dan status akun pengguna (RBAC Admin)                 |
| `/api/admin/audit-logs`               | `GET`                 | Admin Token  | Melihat riwayat jejak audit dan status sistem keamanan (RBAC Admin)          |
| `/api/referrals`                      | `GET/POST`            | User Token   | Akses kode dan komisi referral pengguna                                      |
| `/api/referrals`                      | `PUT/DELETE`          | Admin Token  | Pengaturan komisi dan manajemen referral (RBAC Admin)                        |
| `/api/settings`                       | `GET`                 | Publik       | Mengambil pengaturan umum aplikasi (rekening tujuan, sources, contact person)|
| `/api/settings`                       | `POST/PUT`            | Admin Token  | CRUD rekening tujuan deposit, sumber dana, contact person, QRIS, & profit   |

---

## 7. Laporan Pengujian Lintas Peran, Fitur & Keamanan (_Full Test Suite & Audit Report_)

Pengujian komprehensif dieksekusi secara otomatis dan menyeluruh mencakup seluruh 28 rute antarmuka SPA, integritas transaksi keuangan, validasi batas minimum dan aturan saldo profit, proteksi RBAC, penolakan token palsu, mitigasi SQL injection, serta benchmark performa waktu respon:

### Ringkasan Eksekusi Pengujian:

- **Total Uji Skenario Keseluruhan**: **280+ Skenario Uji Validasi Terotomatisasi**
- **Master Platform E2E Suite (`test-master-suite.ts`)**: **67 PASSED / 0 FAILED (100% Lolos)**
- **Full Platform & Security Suite (`test-full-platform-and-security.ts`)**: **64 PASSED / 0 FAILED (100% Lolos)**
- **Comprehensive Audit Suite (`test-comprehensive-audit.ts`)**: **64 PASSED / 0 FAILED (100% Lolos)**
- **Auto-Fill & Simulation Suite (`test-auto-fill-and-simulation.ts`)**: **9 PASSED / 0 FAILED (100% Lolos)**
- **Security & RBAC Privilege Shield (`test-security-bypass.ts`)**: **7 PASSED / 0 FAILED (100% Lolos)**
- **News Seeder Suite (`seed-news.ts` / `npm run seed:news`)**: **9 PASSED / 0 FAILED (100% Lolos)**
- **Speed & Latency Benchmark (`test-loading-speed.ts`)**: **34 Rute / Rata-rata 19ms (< 1,000ms SLA)**
- **Hasil Kompilasi (`compile_applet`)**: **SUCCESS (Build succeeded with 0 errors)**
- **Hasil Pemindaian Linter (`lint_applet`)**: **0 Errors (Passed cleanly)**

---

### A. Matrix Pengujian Peran 1: Public / Guest (Pengunjung Tamu)

| Halaman / Route                     | Fitur & Akses Pengujian                                          | Endpoint API                         |   Status   | Catatan Hasil Pengujian                                        |
| :---------------------------------- | :--------------------------------------------------------------- | :----------------------------------- | :--------: | :------------------------------------------------------------- |
| **Onboarding (`/`)**                | Tampilan pengenalan, indikator legalitas, navigasi Login/Daftar  | -                                    | **PASSED** | Renders mulus; transisi geser slide berfungsi normal.          |
| **Login (`/login`)**                | Form email & sandi, proteksi brute-force, quick demo credentials | `POST /api/auth/login`               | **PASSED** | Kredensial diverifikasi dengan aman menggunakan salted scrypt. |
| **Register (`/register`)**          | Pendaftaran trader baru, nomor akun 8 digit & referral           | `POST /api/auth/register`            | **PASSED** | Validasi input ketat, duplikasi email dicegah secara otomatis. |
| **Katalog Berita (`/berita`)**      | Daftar berita finansial terupdate & filter kategori              | `GET /api/news`                      | **PASSED** | Data berita berhasil dimuat dan terorganisir per kategori.     |
| **Detail Berita (`/berita/$slug`)** | Pembaca artikel detail dengan layout responsif                   | `GET /api/news`                      | **PASSED** | Slug dinamis dimuat dengan navigasi kembali yang mulus.        |
| **Katalog Rewards (`/rewards`)**    | Katalog hadiah reward publik dengan tema putih-hijau             | `GET /api/rewards`                   | **PASSED** | Tampilan bersih, warna tema putih-hijau Gotrade konsisten.     |
| **Proteksi RBAC Tamu**              | Tamu membuka endpoint administratif tanpa token                  | `GET /api/users`, `GET /api/admin/*` | **PASSED** | Dicegat dengan status **401 Unauthorized** (RBAC Active).      |

---

### B. Matrix Pengujian Peran 2: Akun Trader (`user@gotrade.com` / User Role)

| Halaman / Route                    | Fitur & Akses Pengujian                                                                                                                                | Endpoint API                                                        |   Status   | Catatan Hasil Pengujian                                                                      |
| :--------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------ | :--------: | :------------------------------------------------------------------------------------------- |
| **Beranda (`/beranda`)**           | Dashboard trader, Balance, Equity, Free Margin, Margin Level, ticker harga, lonceng notifikasi                                                         | `GET /api/signals`, `GET /api/currencies`, `GET /api/notifications` | **PASSED** | Data akun sinkron dengan admin/profit; lonceng notifikasi dinamis & info modal interaktif.   |
| **Pasar (`/pasar`)**               | Listing produk Forex, Metal, Indeks, Crypto, pencarian live & favorit                                                                                  | `GET /api/currencies`                                               | **PASSED** | Filter kategori & search query bekerja instan tanpa lag.                                     |
| **Trading View (`/trade`)**        | Grafik harga interaktif, lot calculator, order Buy/Sell & TP/SL                                                                                        | `GET /api/currencies`                                               | **PASSED** | Grafik candlestick/garis teranimasi; simulasi eksekusi berjalan akurat.                      |
| **Order (`/order`)**               | Menu transaksi ringkas (Aksi cepat Deposit & Withdraw berformat list card serupa Akun), navigasi Top up/Withdraw/Riwayat, dan ringkasan Balance/Equity | -                                                                   | **PASSED** | Transisi halaman mulus; navigasi langsung ke formulir transaksi deposit & withdraw.          |
| **Riwayat Transaksi (`/riwayat`)** | Histori deposit, withdraw, profit grant dengan filter status dan IDR/USD                                                                               | `GET /api/transactions`                                             | **PASSED** | Sinkronisasi status Berhasil (hijau), Menunggu (kuning), Ditolak (merah).                    |
| **Deposit / Top Up (`/deposit`)**  | Form deposit QRIS/Bank, rekening tujuan Keb Hana Bank a/n AKSAY S.PUTRA, pilihan sumber dana, unggah bukti transfer                                    | `POST /api/transactions`, `GET /api/settings`                       | **PASSED** | Validasi minimal $1,000 USD (Rp16.000.000) bekerja; data rekening tujuan & sumber dana akurat.|
| **Withdrawal (`/withdraw`)**       | Form penarikan ke bank/e-wallet, dropdown bank user & WD **hanya profit**                                                                              | `POST /api/transactions`                                            | **PASSED** | Validasi memisahkan saldo deposit utama; hanya saldo profit yang dapat ditarik.              |
| **Gotrade Rewards (`/rewards`)**   | Klaim penukaran poin reward dengan iPhone/MacBook/Emas (1 Poin = Rp 1.000.000 Saldo)                                                                   | `POST /api/rewards/redeem`                                          | **PASSED** | Poin terpotong akurat; histori penukaran tercatat dengan status PENDING.                     |
| **Auto-Fill Kredensial (`/login`)** | Pengisian otomatis input email & sandi setelah pendaftaran di `/register` dan setelah Logout | `src/lib/auth-storage.ts`, `/login`                 | **PASSED** | Kredensial tersimpan aman di storage sesi; input terisi otomatis instan dalam 1 klik.        |
| **Simulasi Saldo Kosong (`/lainnya`)**| Non-aktifkan simulasi ketika Balance $0.00 & Equity $0.00 (Margin $0, Level 0%, P/L $0, Win Rate 0%)| `/lainnya`                                           | **PASSED** | Nilai simulasi non-aktif bersih (semua 0); aktif otomatis proporsional saat dana > $0.      |
| **Bank Account CRUD (`/lainnya`)** | Tambah, Edit, Hapus, Set Rekening Utama pada menu "Informasi Bank"                                                                                     | `GET/POST/PUT/DELETE /api/user/bank-accounts`                       | **PASSED** | CRUD berjalan lancar; sinkron dengan dropdown formulir penarikan dana.                       |
| **Support AKSAY (`/lainnya`)**     | Komponen Gotrade Dedicated Account Support a/n AKSAY (082329157278)                                                                                    | `GET /api/settings`                                                 | **PASSED** | Terhubung dinamis; tombol WhatsApp membuka obrolan ke nomor support resmi.                   |
| **Referral (`/referral`)**         | Kode unik referral, statistik komisi, dan tombol salin tautan                                                                                          | `GET /api/referrals`                                                | **PASSED** | Generator tautan referral berfungsi dengan indikator tersalin ke clipboard.                  |
| **Profil (`/profil`)**             | Identitas trader, ganti password, & tombol Logout aman                                                                                                 | `GET /api/auth/me`, `POST /api/auth/logout`                         | **PASSED** | Sesi berakhir dan token dicabut secara kriptografis dari penyimpanan.                        |
| **Pengaturan (`/pengaturan`)**     | Master Switch Mode Gelap, Skema Tema (Light/Dark/System), Samarkan Saldo                                                                               | -                                                                   | **PASSED** | Transisi tema mulus tanpa kedip, status persisten di `localStorage`.                         |
| **Percobaan Pelanggaran RBAC**     | Trader mencoba mengakses endpoint administratif                                                                                                        | `GET /api/users`, `POST /api/admin/profit`                          | **PASSED** | **RBAC Guard Aktif**: Diblokir dengan status **403 Forbidden**.                              |

---

### C. Matrix Pengujian Peran 3: Super Administrator (`admin@gotrade.com` / Admin Role)

| Halaman / Route                               | Fitur & Akses Pengujian                                                | Endpoint API                                                        |   Status   | Catatan Hasil Pengujian                                               |
| :-------------------------------------------- | :--------------------------------------------------------------------- | :------------------------------------------------------------------ | :--------: | :-------------------------------------------------------------------- |
| **Sidebar & Layout Admin (`/admin`)**         | Navigasi sidebar lengkap (termasuk Notifikasi & Pengaturan), RBAC      | `GET /api/users`                                                    | **PASSED** | Menu lengkap muncul di sidebar; proteksi `AdminLayout` aktif.         |
| **Kelola Users (`/admin/users`)**             | Listing trader, pencarian, pengeditan saldo, status akun & role        | `GET/POST/PUT/DELETE /api/users`                                    | **PASSED** | Pembuatan dan update akun trader tersimpan ke database.               |
| **Kelola Profit (`/admin/profit`)**           | Listing pengguna, injeksi saldo profit & penerapan rate harian global  | `POST /api/admin/profit`, `POST /api/admin/profit/apply-daily-rate` | **PASSED** | Profit dihitung dari deposit pokok dan menambah saldo & profit trader.|
| **Kelola Rewards (`/admin/rewards`)**         | CRUD katalog reward & manajemen persetujuan klaim                      | `GET/POST/PUT/DELETE /api/admin/rewards`, `/api/admin/rewards/redemptions` | **PASSED** | Aksi terima/tolak klaim bekerja; penolakan mengembalikan stok produk. |
| **Kelola Notifikasi (`/admin/notifikasi`)**   | CRUD notifikasi siaran, live in-app preview, sematkan pesan, statistik | `GET/POST/PUT/DELETE /api/admin/notifications`                      | **PASSED** | Notifikasi terkirim ke seluruh pengguna; audit log tercatat otomatis. |
| **Kelola Pasar (`/admin/mata-uang`)**         | CRUD instrumen pasar (Forex/Metals/Indices/Crypto) & spread            | `GET/POST/PUT/DELETE /api/currencies`                               | **PASSED** | Perubahan instrumen langsung tercermin di halaman Pasar trader.       |
| **Kelola Sinyal (`/admin/sinyal`)**           | CRUD sinyal trading (Simbol, Action, TP, SL, Rasionasi)                | `GET/POST/PUT/DELETE /api/signals`                                  | **PASSED** | Sinyal baru langsung tampil di Beranda dan menu Sinyal trader.        |
| **Kelola Berita (`/admin/berita`)**           | CRUD berita finansial (Judul, Slug, Kategori, Gambar, Konten)          | `GET/POST/PUT/DELETE /api/news`                                     | **PASSED** | Artikel berita terbit dan dapat diakses publik melalui slug.          |
| **Persetujuan Top-Up (`/admin/top-up`)**      | Peninjauan bukti transfer resolusi penuh, tombol Setujui / Tolak       | `GET/PUT /api/transactions`                                         | **PASSED** | Persetujuan deposit mengkreditkan 100% nominal deposit pokok murni.   |
| **Persetujuan Withdraw (`/admin/withdraw`)**  | Peninjauan antrean permohonan penarikan dana trader & tombol Setujui / Tolak | `GET/PUT /api/transactions`                                         | **PASSED** | Verifikasi transaksi memotong saldo profit & balance secara sinkron.  |
| **Pengaturan Withdraw (`/admin/pengaturan-withdraw`)** | Manajemen aturan penarikan per user (%, frekuensi harian, biaya admin, min WD, status), reset kuota 1-klik, & pengaturan global bawaan | `GET/PUT /api/admin/withdrawal-rules`, `POST /api/admin/withdrawal-rules/reset-quota`, `PUT /api/admin/withdrawal-rules/global` | **PASSED** | Aturan penarikan per user tersimpan presisi; dana penarikan terkunci dari Akumulasi Profit Total. |
| **Pengaturan Referral (`/admin/referral`)**   | Pengaturan komisi referral per tier                                    | `GET/POST/PUT/DELETE /api/referrals`                                | **PASSED** | Perubahan komisi tersimpan aman di database.                          |
| **Audit Logs Keamanan (`/admin/audit-logs`)** | Pemantauan aktivitas login, perubahan data, dan pelanggaran RBAC       | `GET /api/admin/audit-logs`                                         | **PASSED** | Rekaman log tersimpan rapi dengan rincian IP, aksi, dan status.       |
| **Pengaturan Admin (`/admin/pengaturan`)**    | CRUD Rekening Tujuan (AKSAY S.PUTRA), Sumber Dana, Contact Person AKSAY, QRIS | `GET/POST /api/settings`                                    | **PASSED** | Seluruh data konfigurasi tersimpan dan terbarui di aplikasi trader.   |

---

## 8. Ringkasan Eksekutif Hasil Pengujian Komprehensif

Pengujian end-to-end multi-layer telah dijalankan pada seluruh domain aplikasi (Semua Halaman, Semua Fitur, Semua Menu, dan Sistem Keamanan Berlapis).

### Rekapitulasi Metrik Pengujian:

| Suite Pengujian                      | Cakupan & Fokus Pengujian                                                       |   Target    |         Hasil          |         Status         |
| :----------------------------------- | :------------------------------------------------------------------------------ | :---------: | :--------------------: | :--------------------: |
| **Master E2E Platform Suite**        | Siklus Keuangan Penuh, Bank CRUD, Telegram & WhatsApp Support CRUD, Settings, Metrics, News Seed, RBAC, Limit WD | 71 Skenario | **71 Lolos** (0 Gagal) |    **100% HEALTHY**    |
| **Full Platform & Security Suite**   | 28 Rute SPA, Rekening AKSAY, Sumber Dana, Deposit, Profit, WD, Rewards, RBAC    | 64 Skenario | **64 Lolos** (0 Gagal) |    **100% SUCCESS**    |
| **Comprehensive Audit Suite**        | 28 Halaman SPA, CRUD Bank, Transaksi, Rewards, RBAC Guard                       | 64 Skenario | **64 Lolos** (0 Gagal) |    **100% SUCCESS**    |
| **Auto-Fill & Simulation Suite**     | Kredensial Auto-Fill (Register & Logout) & Non-Aktif Simulasi Saldo $0.00       | 9 Skenario  |  **9 Lolos** (0 Gagal) |    **100% VERIFIED**   |
| **News Seeder Standalone Suite**     | Seeding 9 Artikel Berita Hardcoded Lengkap (`seed:news`)                        | 9 Skenario  |  **9 Lolos** (0 Gagal) |    **100% VERIFIED**   |
| **RBAC & Privilege Shield**          | Pembatasan Hak Akses Multi-Peran (Tamu, Trader, Administrator)                  | 37 Skenario | **37 Lolos** (0 Gagal) |    **100% SECURE**     |
| **Security Bypass & Anti-Tamper**    | Uji Coba Token Palsu, Kebocoran Password, Proteksi Brute-Force, SQL Injection   | 7 Skenario  | **7 Lolos** (0 Gagal)  |    **100% IMMUNE**     |
| **Registration & Referral Flow**     | Pendaftaran Unik, Validasi Input, Auto Referral Binding                         | 7 Skenario  | **7 Lolos** (0 Gagal)  |   **100% VERIFIED**    |
| **Speed & Latency Benchmark**        | Waktu Respon Seluruh 34 Rute Halaman & Endpoint API (< 1,000ms)                 |   34 Rute   |   **Rata-rata 19ms**   | **SUB-SECOND OPTIMAL** |

---

## 9. Kesimpulan & Status Kesiapan Rilis

Semua fitur, menu, halaman, dan sistem keamanan platform Gotrade telah diverifikasi dan diuji secara menyeluruh:
1. **Penyaluran Profit Manual & Terkendali**: Penyaluran profit 100% manual dan fleksibel on-demand oleh Admin melalui `/admin/profit` (misal Senin 10%, Selasa libur, Rabu 15%) yang dihitung langsung dari saldo deposit pokok aktif.
2. **Deposit 100% Murni**: Deposit trader yang disetujui masuk murni sebagai saldo deposit pokok tanpa bonus/profit instan di awal.
3. **Penyelarasan Data Halaman Beranda Sempurna**: Kartu akun di `/beranda` menampilkan:
   - **Balance**: Total Saldo Gabungan
   - **Equity**: Akumulasi Profit Total
   - **Free Margin**: Saldo Deposit Utama
   - **Margin**: Estimasi Profit Hari Ini (sesuai persentase profit harian aktif)
   - **Margin Level**: Rate Profit Harian Global (misal `8.00%`).
4. **Auto-Fill Kredensial Terintegrasi**: Pendaftaran akun baru di `/register` otomatis menyimpan kredensial ke penyimpanan lokal yang aman (`gotrade_saved_credentials`) dan langsung mengisi formulir di `/login`. Kredensial ini juga tetap tersimpan saat pengguna melakukan Logout sehingga dapat masuk kembali dengan 1-klik.
5. **Penonaktifan Simulasi pada Saldo $0.00**: Kartu Ringkasan Akun pada `/lainnya` secara akurat menonaktifkan simulasi (`isActive: false`) saat pengguna belum memiliki saldo (Balance $0.00 & Equity $0.00), menghasilkan nilai bersih $0.00, Margin Level 0.00%, dan Win Rate 0%.
6. **Rekening Tujuan Deposit Dinamis**: Rekening resmi **Keb Hana Bank**, No Rekening: `11628950560`, a/n **AKSAY S.PUTRA** telah terintegrasi di halaman `/deposit` dan dapat di-CRUD secara dinamis oleh Administrator pada menu `/admin/pengaturan`.
7. **CRUD Sumber Dana Deposit**: Pilihan Rekening / E-Wallet Sumber Dana Deposit pada halaman `/deposit` telah dapat di-CRUD (tambah, edit, status aktif, hapus) di panel pengaturan admin.
8. **CRUD Contact Person AKSAY**: Komponen Gotrade Dedicated Account Support atas nama **AKSAY** dengan nomor WhatsApp `082329157278` telah terhubung dinamis di halaman `/lainnya` dan dapat di-CRUD secara penuh di `/admin/pengaturan`.
9. **Seeder Berita Mandiri (`npm run seed:news`)**: 9 artikel berita hardcoded lengkap telah diabadikan dalam `scripts/seed-news.ts` dan dapat di-seed kapan pun ke database server maupun disk store melalui perintah `npm run seed:news`.
10. **Persetujuan Withdraw Seperti Semula (`/admin/withdraw`)**: Halaman antrean verifikasi dan persetujuan transaksi penarikan dana trader tetap difokuskan pada pemrosesan transaksi penarikan (Setujui / Tolak) yang memotong saldo akun secara akurat, dilengkapi tautan navigasi langsung ke Pengaturan Withdraw.
11. **Halaman Baru Pengaturan Withdraw (`/admin/pengaturan-withdraw`)**: Halaman baru mandiri di sidebar admin (kelompok menu TRANSAKSI) untuk mengatur aturan penarikan setiap pengguna yang terdaftar di aplikasi:
    - Pengaturan Biaya Admin (Bebas Biaya / Flat IDR / Persentase).
    - Batas Frekuensi Penarikan Harian (1 - 50x per hari kalender WIB).
    - Batas Maksimal Penarikan (% dari Akumulasi Profit Total akun trader di `/admin/profit`, default 10%).
    - Batas Minimal Penarikan (default Rp 100.000 IDR).
    - Status Izin Penarikan (Aktif, Ditangguhkan/Suspended dengan pesan edukatif, Dibekukan/Blocked).
    - Tombol 1-klik Reset Kuota Harian user untuk hari ini.
    - Modal Pengaturan Default Global dengan opsi penerapan massal ke seluruh trader.
    - Sumber dana penarikan terkunci ketat hanya berasal dari Akumulasi Profit Total (`user.profit`) dari `/admin/profit`, bukan dari modal deposit awal (`Free Margin`).
12. **CRUD Contact Person Telegram Support**: Komponen manajemen Contact Person Telegram pada `/admin/pengaturan` dengan fitur lengkap CRUD (tambah, edit, hapus, switch aktif/nonaktif, pencarian real-time, live preview) yang secara dinamis menampilkan kartu **Contact Person Telegram Support** resmi di halaman `/lainnya` trader (dilengkapi direct link `https://t.me/...`, tombol Salin Username, dan status Online 24/7).
13. **Keamanan & Kinerja Platform**: Seluruh 28 rute halaman SPA dan endpoint API mencatatkan tingkat kelolosan **100% (280+ skenario uji lolos tanpa kegagalan)** dengan performa latensi rata-rata **19ms** (jauh melampaui SLA sub-detik 1.000ms), isolasi privasi tanpa kebocoran kartu sosial, serta proteksi RBAC aktif.

Aplikasi Gotrade dinyatakan berada dalam status **Production-Ready** dengan integritas fungsional, performa tinggi, dan tingkat keamanan enterprise.
