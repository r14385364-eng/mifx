# Product Requirement Document (PRD) & Technical Specification

## Gotrade — Aplikasi Trading Online Legal & Aman

---

## 1. Executive Summary & Overview

**Gotrade** adalah platform aplikasi trading online modern, aman, dan legal yang menyediakan layanan perdagangan aset keuangan global seperti **Forex, Komoditas (Gold/Silver), Indeks Saham Global, dan Kripto**.

Aplikasi ini dirancang dengan antarmuka yang sangat responsif, intuitif, serta dilengkapi dengan sistem akun dwifungsi (**Trader User** dan **Super Administrator**). Gotrade mengintegrasikan:

- Sistem perdagangan simulasi kuotasi harga waktu-nyata (_real-time price simulation_).
- Manajemen sinyal trading analitis & berita pasar finansial terkini.
- Modul transaksi deposit (QRIS Dinamis & Transfer Bank dengan pratinjau bukti transfer) dan penarikan dana (_withdrawal_).
- Program loyalitas **Gotrade Rewards** berbasis saldo aktif akun.
- Program referral multi-tier dengan pelacakan komisi dan kode unik.
- Pusat notifikasi siaran pesan (_broadcast notifications_) dengan sinkronisasi waktu-nyata dan penanda unread badge universal.
- Proteksi keamanan menyeluruh berstandar **Role-Based Access Control (RBAC)**, hashing password salted scrypt, proteksi brute-force, penghapusan tag Open Graph/Twitter Card untuk privasi tautan sharing, dan jejak audit (_audit logs_).

---

## 2. Tech Stack & Architecture

### Front-End Framework

- **React 19** & **TypeScript 5.8**
- **TanStack Start & TanStack Router** (`@tanstack/react-router`) untuk routing SPA yang mulus, modal state handling, dan nested layout rendering.
- **Tailwind CSS v4** dengan varian tema otomatis, animasi `tw-animate-css`, dan komponen berbasis `@radix-ui` (Shadcn/UI paradigm).
- **Brand Identity & Assets**: Standardisasi logo resmi menggunakan `/logo.jpg` via komponen terpadu `AppLogo` di seluruh layout pengguna, modal dialog, dan sidebar admin.
- **Recharts** untuk visualisasi grafik pergerakan harga instrumen finansial real-time.
- **Lucide React Icons** untuk konsistensi simbol visual.
- **Secure API Client (`secureFetch`)**: Klien fetch terstandarisasi di `/src/lib/api-client.ts` yang otomatis menginjeksi token `Bearer`, menangani `credentials: "include"`, serta mendeteksi respons `401 Unauthorized`, `403 Forbidden`, dan `429 Rate Limit` dengan notifikasi toast informatif.

### Back-End & API Layer

- **Express.js API Server** (`/src/server/app.ts` & `/src/server/api-handler.ts`).
- **Role-Based Access Control (RBAC)**: Middleware `requireAdmin` dan `requireAuth` membatasi eksekusi endpoint administratif hanya untuk akun dengan peran `admin`.
- **RESTful Endpoints** terproteksi menggunakan token sesi berbasis `Authorization: Bearer <token>` dan HttpOnly session cookies.
- **Security Headers & Defense-in-Depth**: Perlindungan terhadap sniffing (`X-Content-Type-Options: nosniff`), proteksi framing (`X-Frame-Options: SAMEORIGIN`), isolasi origin (`Referrer-Policy: strict-origin-when-cross-origin`), sanitasi payload, serta pembatasan laju permintaan (_Rate Limiting_).
- **Audit Logs Table**: Pencatatan riwayat setiap aksi administratif dan kejadian keamanan sistem ke tabel `audit_logs`.
- **Database Engine**: Driver `pg` (PostgreSQL) dengan sistem **Seamless Fallback** ke **In-Memory PostgreSQL Engine (`pg-mem`)** dan disk snapshot store (`/.data/db_store.json`) untuk menjamin ketersediaan server 100% tanpa hambatan konektivitas.

---

## 3. Database Schema & Architecture

Infrastruktur database mengelola 10 entitas tabel utama:

### 1. `users` (Manajemen Pengguna)

| Kolom            | Tipe Data           | Keterangan                               |
| :--------------- | :------------------ | :--------------------------------------- |
| `id`             | SERIAL PRIMARY KEY  | ID Unik Pengguna                         |
| `name`           | VARCHAR(255)        | Nama Lengkap Pengguna                    |
| `username`       | VARCHAR(100) UNIQUE | Username Unik Pengguna                   |
| `email`          | VARCHAR(255) UNIQUE | Email Akun (Lowercased)                  |
| `password`       | VARCHAR(255)        | Kredensial Password (Salted Scrypt Hash) |
| `phone`          | VARCHAR(50)         | Nomor Telepon                            |
| `role`           | VARCHAR(50)         | Peran (`user` atau `admin`)              |
| `account_number` | VARCHAR(50)         | Nomor Akun Trading (8 digit)             |
| `balance`        | NUMERIC(15,2)       | Saldo Akun Utama (USD)                   |
| `profit`         | NUMERIC(15,2)       | Akumulasi Saldo Profit Pengguna (USD)    |
| `account_type`   | VARCHAR(50)         | Jenis Akun (Standard Live / Demo)        |
| `referred_by`    | VARCHAR(100)        | Kode Referral Pengajak (Opsional)        |
| `created_at`     | TIMESTAMP           | Tanggal Pendaftaran                      |

### 2. `notifications` (Notifikasi & Pengumuman Broadcast)

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
| `updated_at` | TIMESTAMP          | Waktu Terakhir Diperbarui                                |

### 3. `audit_logs` (Keamanan & Jejak Audit Admin)

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

### 4. `signals` (Sinyal Trading)

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

### 5. `news` (Berita Finansial & Analisa Pasar)

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

### 6. `currencies` (Mata Uang & Instrumen Pasar)

| Kolom        | Tipe Data          | Keterangan                                             |
| :----------- | :----------------- | :----------------------------------------------------- |
| `id`         | SERIAL PRIMARY KEY | ID Instrumen                                           |
| `symbol`     | VARCHAR(20)        | Simbol Pasar (cth: `EURUSD`, `XAUUSD`)                 |
| `name`       | VARCHAR(100)       | Nama Lengkap Produk                                    |
| `category`   | VARCHAR(50)        | Jenis Pasar (`Forex`, `Komoditas`, `Indeks`, `Crypto`) |
| `price`      | NUMERIC(15,5)      | Harga Pasar Terkini                                    |
| `decimals`   | INT                | Jumlah Digit Desimal                                   |
| `spread`     | NUMERIC(10,2)      | Biaya Spread                                           |
| `direction`  | VARCHAR(20)        | Arah Tren (`Naik`, `Turun`, `Acak`)                    |
| `volatility` | NUMERIC(10,2)      | Tingkat Volatilitas Harga                              |
| `active`     | BOOLEAN            | Status Trading (`true` / `false`)                      |

### 7. `transactions` (Transaksi Deposit, Withdraw & Profit)

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

### 8. `rewards` (Katalog Hadiah Gotrade Rewards)

| Kolom             | Tipe Data          | Keterangan                                                |
| :---------------- | :----------------- | :-------------------------------------------------------- |
| `id`              | SERIAL PRIMARY KEY | ID Hadiah                                                 |
| `title`           | VARCHAR(255)       | Nama Produk / Hadiah                                      |
| `category`        | VARCHAR(50)        | Kategori (`E-Wallet`, `Gadget`, `Merchandise`, `Voucher`) |
| `points_required` | INT                | Poin yang Dibutuhkan                                      |
| `stock`           | INT                | Sisa Stok Hadiah                                          |
| `image_url`       | TEXT               | Foto Produk Hadiah                                        |
| `description`     | TEXT               | Deskripsi & Spesifikasi Produk                            |
| `is_featured`     | BOOLEAN            | Penanda Hadiah Unggulan                                   |
| `active`          | BOOLEAN            | Status Ketersediaan Hadiah                                |

### 9. `reward_redemptions` (Riwayat Penukaran Hadiah)

| Kolom              | Tipe Data                  | Keterangan                                                |
| :----------------- | :------------------------- | :-------------------------------------------------------- |
| `id`               | SERIAL PRIMARY KEY         | ID Klaim                                                  |
| `user_id`          | INT REFERENCES users(id)   | ID Pengguna yang Mengklaim                                |
| `user_name`        | VARCHAR(255)               | Nama Pengguna                                             |
| `user_email`       | VARCHAR(255)               | Email Pengguna                                            |
| `reward_id`        | INT REFERENCES rewards(id) | ID Hadiah yang Diklaim                                    |
| `reward_title`     | VARCHAR(255)               | Nama Hadiah                                               |
| `points_spent`     | INT                        | Jumlah Poin yang Dibelanjakan                             |
| `shipping_address` | TEXT                       | Alamat Kirim / No. E-Wallet Pengguna                      |
| `status`           | VARCHAR(50)                | Status (`PENDING`, `PROCESSING`, `COMPLETED`, `REJECTED`) |
| `notes`            | TEXT                       | Catatan Admin / Nomor Resi Pengiriman                     |
| `created_at`       | TIMESTAMP                  | Waktu Klaim                                               |

### 10. `referrals` (Manajemen Referral & Komisi)

| Kolom            | Tipe Data          | Keterangan                   |
| :--------------- | :----------------- | :--------------------------- |
| `id`             | SERIAL PRIMARY KEY | ID Referral                  |
| `user_id`        | INT                | ID Pengguna                  |
| `user_name`      | VARCHAR(255)       | Nama Pengguna                |
| `email`          | VARCHAR(255)       | Email Pengguna               |
| `code`           | VARCHAR(50)        | Kode Referral Unik           |
| `referred_by`    | VARCHAR(50)        | Kode Pengajak                |
| `commission`     | NUMERIC(15,2)      | Akumulasi Komisi Referral    |
| `invitees_count` | INT                | Jumlah Pendaftar yang Diajak |

---

## 4. Keamanan & Role-Based Access Control (RBAC)

Aplikasi Gotrade menerapkan prinsip **Defense-in-Depth** dengan pembagian peran tegas:

1. **Role: Public / Guest**
   - Hak Akses: Halaman pengenalan (`/`), katalog berita umum (`/berita`), detail artikel (`/berita/$slug`), form masuk (`/login`), dan pendaftaran (`/register`).
   - Batasan: Dilarang keras mengakses endpoint atau rute transaksi, trading, dan admin.

2. **Role: Trader User (`user`)**
   - Hak Akses: Dashboard trader (`/beranda`), pasar (`/pasar`), eksekusi trading (`/trade`), order aktif (`/order`), riwayat pribadi (`/riwayat`), pengajuan deposit (`/deposit`), penarikan dana (`/withdraw`), program referral (`/referral`), Gotrade Rewards (`/rewards`), dan profil (`/profil`).
   - Fitur Notifikasi: Melihat notifikasi siaran publik via modal lonceng (`/beranda`), filter tipe notifikasi, tracking baca/belum dibaca via client storage.
   - Batasan: Dilarang mengakses endpoint atau rute `/admin/*` (HTTP 403 Forbidden).

3. **Role: Super Administrator (`admin`)**
   - Hak Akses: Seluruh kontrol panel administratif (`/admin/*`), manajemen pengguna (`/admin/users`), kelola profit per akun (`/admin/profit`), manajemen notifikasi siaran (`/admin/notifikasi`), persetujuan Top-Up dengan viewer bukti transfer (`/admin/top-up`), persetujuan penarikan (`/admin/withdraw`), manajemen katalog & klaim Rewards (`/admin/rewards`), manajemen sinyal (`/admin/sinyal`), artikel berita (`/admin/berita`), instrumen pasar (`/admin/mata-uang`), komisi referral (`/admin/referral`), riwayat audit logs (`/admin/audit-logs`), dan pengaturan sistem/QRIS (`/admin/pengaturan`).

4. **Kebijakan Privasi Sharing Tautan (No Open Graph / No Twitter Cards)**
   - Seluruh tag `property="og:*"` dan `name="twitter:*"` telah dihapus secara menyeluruh dari seluruh rute.
   - Membagikan tautan website di WhatsApp, Telegram, iMessage, atau media sosial lainnya akan tampil sebagai tautan teks murni tanpa thumbnail gambar atau preview kartu.

---

## 5. Pemetaan Fitur & Struktur Halaman Menu

### A. Akses Publik & Autentikasi

- **Landing / Onboarding (`/`)**: Sambutan aplikasi, pengenalan fitur utama, legalitas, dan tombol aksi Login/Registrasi.
- **Login (`/login`)**: Form autentikasi email & password dengan proteksi lockout brute-force (maksimal 5 kegagalan berturut-turut).
- **Register (`/register`)**: Pendaftaran trader baru dengan username unik, email, password terenkripsi, penautan referral otomatis, dan pembuatan nomor akun trading 8-digit.
- **Berita Finansial (`/berita` & `/berita/$slug`)**: Katalog berita finansial terupdate dengan klasifikasi kategori dan pembaca artikel responsif.

### B. Portal Utama Trader (User Interface)

- **Beranda (`/beranda`)**: Ringkasan saldo balance, ticker harga real-time, sinyal terpopuler, shortcut transaksi cepat, dan lonceng notifikasi interaktif.
- **Pasar (`/pasar`)**: Listing produk Forex, Komoditi, Indeks, Crypto, pencarian langsung (_live search_), spread real-time, dan filter favorit.
- **Trade (`/trade`)**: Grafik candlestick Recharts, kalkulator ukuran lot, panel eksekusi `BUY` / `SELL`, Take Profit (TP), dan Stop Loss (SL).
- **Order (`/order`)**: Menu transaksi cepat Top Up & Withdraw serta riwayat order berjalan.
- **Riwayat Transaksi (`/riwayat`)**: Histori transaksi (Deposit, Withdraw, Profit Grant) dengan penanda status visual (Berhasil/Hijau, Menunggu/Kuning, Ditolak/Merah) serta format mata uang ganda (IDR & USD).
- **Deposit / Top Up (`/deposit`)**: Pembayaran via QRIS Dinamis & Transfer Bank. Batas minimal deposit adalah **$1,000 USD** (setara Rp16.000.000 IDR). Fitur unggah bukti transfer dilengkapi kompresi client-side dan preview thumbnail.
- **Withdraw / Penarikan (`/withdraw`)**: Penarikan dana ke rekening bank / e-wallet. Batas minimal adalah **Rp100.000 IDR** (setara $6.25 USD) dengan validasi kecukupan saldo sebelum pengajuan.
- **Gotrade Rewards (`/rewards`)**: Program penukaran hadiah dengan rasio **1 Poin per Saldo Rp 1.000.000 IDR**. Menyediakan katalog hadiah mulai dari saldo e-wallet (GoPay, OVO, DANA), smartwatch, iPhone, hingga logam mulia Antam. Formulir klaim menyertakan alamat pengiriman dan pelacak status penukaran.
- **Program Referral (`/referral`)**: Kode referral unik pengguna, ringkasan statistik komisi, dan tombol salin tautan ajakan.
- **Profil Pengguna (`/profil`)**: Detail identitas trader, nomor akun trading, ubah kata sandi, dan tombol keluar (_Logout_) aman.
- **Menu Lainnya (`/lainnya`)**: Akses cepat Gotrade Rewards, Pusat Notifikasi, bantuan CS, dan pengaturan saldo demo.

### C. Panel Kontrol Administrator (`/admin/*`)

- **Manajemen User (`/admin/users`)**: Daftar lengkap pengguna, pencarian, pengeditan saldo, pengubahan role, dan status akun.
- **Kelola Profit User (`/admin/profit`)**: Injeksi saldo profit trading langsung ke akun pengguna terdaftar dengan nominal kustom ($ USD).
- **Manajemen Rewards (`/admin/rewards`)**: Kelola katalog hadiah Gotrade Rewards (Tambah, Edit, Hapus, Atur Stok, Poin Dibutuhkan) serta verifikasi proses klaim (_PENDING_ -> _PROCESSING_ -> _COMPLETED_ / _REJECTED_) lengkap dengan nomor resi kirim.
- **Manajemen Notifikasi & Siaran (`/admin/notifikasi`)**: CRUD notifikasi siaran, live in-app preview, statistik broadcast, dan pin pengumuman penting.
- **Persetujuan Top-Up (`/admin/top-up`)**: Verifikasi resi bukti transfer dengan modal layar penuh, tombol persetujuan yang otomatis mengkreditkan saldo pengguna.
- **Persetujuan Withdraw (`/admin/withdraw`)**: Verifikasi permohonan penarikan dana trader dan pemotongan saldo akun.
- **Kelola Mata Uang (`/admin/mata-uang`)**: Tambah, edit, dan atur spread instrumen pasar.
- **Kelola Sinyal (`/admin/sinyal`)**: CRUD sinyal trading analitis.
- **Kelola Berita (`/admin/berita`)**: CRUD artikel berita finansial dan publikasi konten.
- **Pengaturan Referral (`/admin/referral`)**: Pengaturan persentase komisi referral per tier.
- **Pengaturan Sistem (`/admin/pengaturan`)**: Unggah gambar QRIS resmi deposit dan konfigurasi sistem.
- **Audit Logs Keamanan (`/admin/audit-logs`)**: Pemantauan real-time aktivitas login, aksi admin, percobaan akses RBAC yang ditolak, dan status brute-force.

---

## 6. Spesifikasi Lengkap API Endpoints

| Endpoint                         | Method                | Otentikasi   | Deskripsi & Hak Akses                                                        |
| :------------------------------- | :-------------------- | :----------- | :--------------------------------------------------------------------------- |
| `/api/health`                    | `GET`                 | Publik       | Cek kesehatan server, koneksi database, dan status RBAC                      |
| `/api/auth/demo-accounts`        | `GET`                 | Publik       | Mendapatkan daftar akun demo siap pakai (tanpa kebocoran kata sandi)         |
| `/api/auth/login`                | `POST`                | Publik       | Masuk akun trader atau admin dengan proteksi brute force                     |
| `/api/auth/register`             | `POST`                | Publik       | Pendaftaran akun trader baru secara aman                                     |
| `/api/auth/me`                   | `GET`                 | Bearer Token | Mengambil data profil akun yang sedang login                                 |
| `/api/auth/logout`               | `POST`                | Bearer Token | Mengakhiri sesi pengguna dan mencabut token secara kriptografis              |
| `/api/currencies`                | `GET`                 | Publik       | Mengambil daftar harga instrumen pasar aktif                                 |
| `/api/currencies`                | `POST/PUT/DELETE`     | Admin Token  | CRUD instrumen mata uang pasar (RBAC Admin)                                  |
| `/api/signals`                   | `GET`                 | Publik       | Mengambil sinyal trading aktif                                               |
| `/api/signals`                   | `POST/PUT/DELETE`     | Admin Token  | CRUD sinyal trading analitis (RBAC Admin)                                    |
| `/api/news`                      | `GET`                 | Publik       | Mengambil daftar artikel berita finansial                                    |
| `/api/news`                      | `POST/PUT/DELETE`     | Admin Token  | CRUD artikel berita finansial (RBAC Admin)                                   |
| `/api/notifications`             | `GET`                 | Publik       | Mengambil daftar notifikasi siaran publik untuk pengguna                     |
| `/api/admin/notifications`       | `GET`                 | Admin Token  | Mengambil seluruh notifikasi beserta ringkasan statistik siaran (RBAC Admin) |
| `/api/admin/notifications`       | `POST`                | Admin Token  | Menyiarkan notifikasi baru ke seluruh pengguna (RBAC Admin)                  |
| `/api/admin/notifications`       | `PUT/PATCH`           | Admin Token  | Memperbarui isi, status pin, atau badge notifikasi (RBAC Admin)              |
| `/api/admin/notifications`       | `DELETE`              | Admin Token  | Menghapus notifikasi siaran dari database (RBAC Admin)                       |
| `/api/rewards`                   | `GET`                 | User Token   | Mengambil katalog hadiah dan kalkulasi poin saldo pengguna                   |
| `/api/rewards/redeem`            | `POST`                | User Token   | Mengajukan penukaran hadiah dengan pemotongan poin                           |
| `/api/admin/rewards`             | `GET/POST/PUT/DELETE` | Admin Token  | CRUD katalog hadiah Gotrade Rewards (RBAC Admin)                             |
| `/api/admin/rewards/redemptions` | `GET/PUT`             | Admin Token  | Mengambil dan memperbarui status klaim hadiah pengguna (RBAC Admin)          |
| `/api/transactions`              | `GET`                 | Admin Token  | Mengambil daftar riwayat transaksi deposit/withdraw (RBAC Admin)             |
| `/api/transactions`              | `POST`                | User Token   | Pengajuan deposit (Top Up min $1,000) atau withdraw baru                     |
| `/api/transactions`              | `PUT/PATCH`           | Admin Token  | Persetujuan atau penolakan pengajuan transaksi trader (RBAC Admin)           |
| `/api/admin/profit`              | `POST`                | Admin Token  | Injeksi profit langsung ke saldo akun trader (RBAC Admin)                    |
| `/api/users`                     | `GET/POST/PUT/DELETE` | Admin Token  | Manajemen data, saldo, dan status akun pengguna (RBAC Admin)                 |
| `/api/admin/audit-logs`          | `GET`                 | Admin Token  | Melihat riwayat jejak audit dan status sistem keamanan (RBAC Admin)          |
| `/api/referrals`                 | `GET/POST`            | User Token   | Akses kode dan komisi referral pengguna                                      |
| `/api/referrals`                 | `PUT/DELETE`          | Admin Token  | Pengaturan komisi dan manajemen referral (RBAC Admin)                        |
| `/api/settings`                  | `GET`                 | Publik       | Mengambil pengaturan umum aplikasi                                           |
| `/api/settings`                  | `POST/PUT`            | Admin Token  | Memperbarui konfigurasi sistem dan QRIS (RBAC Admin)                         |

---

## 7. Master Quality Assurance & Security Test Report

Pengujian komprehensif dieksekusi secara otomatis melalui _Master End-to-End Suite_ (`scripts/test-master-suite.ts`):

### Ringkasan Eksekusi Pengujian:

- **Total Uji Kasus**: **59 Skenario Uji**
- **Status Akhir**: **59 PASSED / 0 FAILED (100% Success)**
- **Hasil Kompilasi (`compile_applet`)**: **SUCCESS**
- **Hasil Pemindaian Linter (`lint_applet`)**: **0 Errors**

---

### Rincian Hasil Pengujian Matrix:

| Kategori Pengujian                | Cakupan Fitur / Endpoint                                                                                                                                                                                 |   Status   | Keterangan Hasil                                                                           |
| :-------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------: | :----------------------------------------------------------------------------------------- |
| **Akses Seluruh Rute SPA**        | 27 Rute (`/`, `/login`, `/register`, `/berita`, `/beranda`, `/pasar`, `/trade`, `/order`, `/riwayat`, `/deposit`, `/withdraw`, `/rewards`, `/referral`, `/profil`, `/lainnya`, serta 12 rute `/admin/*`) | **PASSED** | 100% rute merespons 200 OK dengan HTML valid tanpa error.                                  |
| **Privasi Sharing Tautan**        | Inspeksi tag Open Graph & Twitter Cards                                                                                                                                                                  | **PASSED** | Tidak ada tag `og:*` atau `twitter:*` yang ditemukan; tautan dibagikan sebagai teks murni. |
| **Autentikasi & Akun**            | Login admin, registrasi trader, pencegahan email ganda, salted scrypt                                                                                                                                    | **PASSED** | Autentikasi aman; token JWT HMAC-SHA256 dikeluarkan dengan benar.                          |
| **Proteksi RBAC Tamu & User**     | `/api/users`, `/api/admin/profit`, `/api/admin/notifications`, `/api/admin/audit-logs`                                                                                                                   | **PASSED** | Tamu ditolak 401 Unauthorized; User biasa ditolak 403 Forbidden.                           |
| **Pipeline Deposit ($1,000 min)** | Validasi limit < Rp16.000.000, pengajuan deposit $2,000, persetujuan admin, kredit saldo otomatis                                                                                                        | **PASSED** | Saldo trader terkreditasi presisi menjadi $2,000 USD.                                      |
| **Injeksi Profit Admin**          | POST `/api/admin/profit` sebesar $500 USD                                                                                                                                                                | **PASSED** | Saldo balance naik menjadi $2,500 dan saldo profit $500.                                   |
| **Gotrade Rewards Engine**        | Kalkulasi 40 Poin dari saldo Rp 40.000.000, klaim reward 8 poin, update ledger poin sisa (32 Poin), update status admin COMPLETED                                                                        | **PASSED** | Ledger poin berkurang akurat dan status klaim tersimpan rapi.                              |
| **Pipeline Penarikan (WD)**       | Validasi limit < Rp100.000, pengajuan withdraw Rp 8.000.000 ($500 USD), persetujuan admin, debit saldo                                                                                                   | **PASSED** | Saldo terpotong presisi dari $2,500 menjadi $2,000 USD.                                    |
| **Admin CRUD & Audit Logs**       | CRUD notifikasi siaran & pencatatan audit log keamanan                                                                                                                                                   | **PASSED** | Seluruh aksi terekam dalam tabel `audit_logs` dengan IP dan status.                        |

---

## 8. Sub-Second Speed & Performance Optimization Report

Gotrade dirancang dan dioptimalkan secara komprehensif untuk mencapai waktu muat di bawah 1 detik (**< 1.000ms / Sub-Second Response Rate**) pada seluruh halaman dan endpoint API.

### Arsitektur Optimasi Performa:

1. **Server-Side Compression (Gzip / Brotli)**:
   - Integrasi middleware kompresi `compression` pada backend Express (`level: 6, threshold: 1024`), memperkecil ukuran transmisi payload HTML, JS, CSS, dan JSON hingga 70–80%.
2. **TanStack Router Intent Preloading**:
   - Konfigurasi `defaultPreload: "intent"` dengan ambang tunda interaksi mikro `30ms` dan `defaultPreloadStaleTime: 60.000ms`. Rute diunduh secara instan begitu pengguna mengarahkan kursor/sentuhan ke tautan navigasi sebelum klik terjadi.
3. **In-Memory SWR Client Micro-Cache**:
   - Klien `secureFetch` dilengkapi cache memori ultra-cepat untuk permintaan `GET` (TTL 5 detik). Pergantian tab antar-halaman (_Beranda, Pasar, Trade, Order, Profil, Riwayat, Rewards_) merespons dalam waktu **< 30ms** tanpa waterfall latency jaringan.
   - Cache otomatis dibersihkan secara cerdas saat terjadi mutasi data (_POST, PUT, DELETE, PATCH_).
4. **Non-Blocking Asynchronous DB Persistence**:
   - Penulisan snapshot disk PostgreSQL disederhanakan melalui debouncing non-blocking `500ms`, menjaga eksekusi query tetap instan (< 1ms).
5. **HTTP Cache-Control & Asset Immutability**:
   - Seluruh aset statis (_gambar logo, ikon, font_) diberi header `Cache-Control: public, max-age=31536000, immutable`.

### Hasil Benchmark Kecepatan Akses (scripts/test-loading-speed.ts):

- **Total Rute & Endpoint Diuji**: **33 Rute** (27 Halaman SPA + 6 API Endpoints)
- **Status Lolos (< 1.000ms)**: **33 / 33 (100%)**
- **Rata-Rata Waktu Muat (Average Latency)**: **~23ms**
- **Waktu Muat Tercepat (Min Latency)**: **4ms**
- **Waktu Muat Terlama (Max Latency)**: **77ms**

---

## 9. Status Kesiapan Rilis

Seluruh halaman, fitur, alur transaksi finansial, sistem rewards loyalitas, proteksi privasi URL sharing, arsitektur keamanan RBAC, serta target performa sub-detik (**Average Latency 23ms**) telah terverifikasi secara penuh. Aplikasi Gotrade berada dalam status **Production-Ready (Siap Rilis)** dengan keandalan dan kecepatan tinggi.
