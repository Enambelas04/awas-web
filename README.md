# AWAS — Web Konfigurasi WiFi

## Catatan penting: .env dan Docker

`.env` **harus ikut masuk** ke dalam proses `docker build`, karena Vite
membaca environment variable saat `npm run build` dijalankan (bukan saat
container jalan/runtime). Karena itu, `.env` **tidak** dimasukkan ke
`.dockerignore` di project ini.

Untuk mencegah `.env` ke-commit ke GitHub/Git (beda urusan dengan Docker),
sudah ada `.gitignore` terpisah yang mengabaikan `.env`. Jadi:
- `.dockerignore` → `.env` BOLEH ikut ke build context Docker
- `.gitignore` → `.env` TIDAK BOLEH ikut ke commit Git

Kalau sebelumnya sempat error `Can't determine Firebase Database URL` atau
nilai env lain kosong, kemungkinan besar karena `.env` tidak ikut masuk
build context — jalankan ulang `docker compose up --build` setelah
memastikan `.dockerignore` tidak mengandung baris `.env`.


Interface web untuk melihat status koneksi WiFi ESP32 dan mengganti
SSID/password dari jarak jauh, lewat MQTT.

## Menjalankan dengan Docker (paling mudah)

Ini akan menjalankan web interface **dan** MQTT broker (Mosquitto) lokal
sekaligus, jadi kamu langsung bisa coba tanpa setup broker terpisah:

```bash
docker compose up --build
```

Lalu buka di browser:
- **Web interface**: http://localhost:3000
- **MQTT broker**: ws://localhost:9001 (untuk browser), mqtt://localhost:1883 (untuk ESP32)

## Mode development (hot reload)

Kalau sedang aktif mengubah kode dan ingin lihat perubahan langsung tanpa
rebuild Docker image:

```bash
docker compose --profile dev up web-dev
```

Buka di http://localhost:5173

## Tanpa Docker (langsung di Mac, untuk development cepat)

```bash
npm install
npm run dev
```

Broker MQTT tetap harus jalan di tempat lain (atau pakai Mosquitto lewat
Docker saja: `docker compose up mosquitto`).

## Menyambungkan ke broker yang berbeda

Edit environment variable `VITE_MQTT_BROKER_URL` di `docker-compose.yml`,
atau buat file `.env` di root project:

```
VITE_MQTT_BROKER_URL=ws://alamat-broker-kamu:9001
```

**Penting**: broker harus punya listener WebSocket aktif (port umum: 9001,
8083, atau 8083/mqtt untuk TLS). Browser tidak bisa connect ke MQTT TCP
biasa (port 1883) — itu hanya untuk ESP32/aplikasi native.

## Menambah/mengubah device

Edit array `DEVICES` di `src/App.jsx`:

```js
const DEVICES = [
  { id: "bin-01", label: "Tempat Sampah 1" },
  { id: "bin-02", label: "Tempat Sampah 2" },
];
```

`id` harus sama dengan `device_id` yang dipakai ESP32 saat publish ke topic
`awas/{device_id}/wifi/status`.

## Pemantauan kapasitas (tab "Pemantauan Kapasitas")

Subscribe ke topic `awas/{device_id}/bin/status`, dengan payload yang
diasumsikan berbentuk:

```json
{
  "distance_cm": 12.5,
  "capacity_percent": 68,
  "gas_ppm": 340,
  "gas_level": "normal"
}
```

**Kalau struktur payload firmware ESP32/Dashboard AWAS kamu yang sudah ada
berbeda** (nama field, skala persen, dll), sesuaikan di
`src/components/BinCapacityCard.jsx` bagian `handleMessage` — cukup ubah
nama field yang dibaca dari `parsed.xxx`, tidak perlu ubah bagian lain.

Grafik tren kapasitas (`CapacityTrendChart`) hanya menyimpan history
selama halaman dibuka (di memori React, maksimal 30 titik terakhir) — kalau
mau riwayat permanen/lebih panjang, perlu backend/database tambahan untuk
menyimpan time-series, bukan disimpan di browser.


## Catatan keamanan

`mosquitto.conf` di sini pakai `allow_anonymous true` — ini hanya untuk
**development lokal**. Untuk production, tambahkan autentikasi (username/
password atau TLS certificate) sebelum di-deploy ke server publik.

## Setup Login (Firebase Realtime Database)

Login di sini bersifat **simulasi/demo** — username & password dicocokkan
langsung ke data di Firebase Realtime Database, tanpa hashing. Cocok untuk
keperluan skripsi/demo, **bukan untuk data sensitif sungguhan**.

### 1. Buat project Firebase
1. Buka https://console.firebase.google.com → buat project baru
2. Di sidebar, buka **Build > Realtime Database** → klik **Create Database**
   → pilih lokasi (mis. Singapore) → mode **Test mode** dulu untuk simulasi
   (lihat catatan Rules di bawah)
3. Buka **Project Settings** (ikon gear) → scroll ke **Your apps** → klik
   ikon **Web (`</>`)** → daftarkan app → copy konfigurasi yang muncul
4. Isi nilai-nilainya ke file `.env` (copy dari `.env.example`):
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_DATABASE_URL=...
   VITE_FIREBASE_PROJECT_ID=...
   ```

### 2. Tambah data user untuk login
Di Realtime Database, klik ikon **+** dan buat struktur data manual:
```json
{
  "users": {
    "fildza": { "password": "rahasia123" },
    "admin": { "password": "admin123" }
  }
}
```

### 3. Atur Rules (PENTING untuk simulasi yang lebih aman)
Di tab **Rules** Realtime Database, default "Test mode" membuat semua
data bisa dibaca/ditulis siapa saja yang tahu URL project-nya. Untuk
simulasi yang sedikit lebih terkontrol (read-only, tidak bisa ditulis dari
browser), ubah jadi:
```json
{
  "rules": {
    "users": {
      ".read": true,
      ".write": false
    }
  }
}
```
Ini tetap **bukan production-grade** (siapa saja yang tahu URL Firebase
project ini masih bisa baca daftar password), tapi cukup aman untuk
demo/simulasi terbatas. Untuk keamanan sungguhan, ganti ke Firebase
Authentication (`signInWithEmailAndPassword`) yang sudah handle hashing
password di server Firebase, bukan dicocokkan manual di browser.

### 4. Sesi login
Login disimpan di `sessionStorage` browser — hilang otomatis saat tab
ditutup, jadi perlu login ulang setiap buka tab baru. Ini disengaja untuk
kesederhanaan simulasi.

