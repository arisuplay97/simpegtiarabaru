# Spesifikasi Fitur: Employee Experience — HRIS/SIMPEG

Fitur Employee Experience yang terintegrasi dengan sistem absensi yang sudah ada. Tujuan fitur ini adalah membuat proses absensi terasa lebih human dan menyenangkan, sekaligus memberikan HRD dashboard sederhana untuk melihat kondisi dan pola mood pegawai secara agregat.

> **PENTING:** JANGAN mengubah mekanisme inti absensi yang sudah berjalan. Periksa struktur project, database, dan komponen UI terlebih dahulu sebelum melakukan perubahan.

---

## 1. Absen Masuk Pagi

Setelah pegawai berhasil melakukan absen masuk, sistem menentukan status berdasarkan aturan jam kerja yang sudah digunakan aplikasi. Minimal 3 kondisi:

### A. Tepat Waktu
Jika pegawai melakukan absensi sebelum atau pada batas waktu masuk:

- **Pesan:** 🥳 "Yeay! Kamu datang tepat waktu!"
- **Subteks:** "Awal yang baik untuk memulai hari. Semangat ya! 💪"

### B. Terlambat
Jika pegawai melewati jam masuk tetapi masih dalam kategori keterlambatan normal:

- **Pesan:** 😅 "Hehe… hari ini agak telat."
- **Subteks:** "Besok kita coba lebih pagi lagi ya! 💪"
- Tampilkan juga: jam masuk, status "Terlambat", durasi keterlambatan

**Contoh:**
```
Jam masuk: 08:17
Status: Terlambat 17 menit
```

### C. Terlambat Parah
Jika keterlambatan melewati threshold yang ditentukan sistem (misalnya 30/60 menit).

> Jangan hardcode angka jika sistem sudah memiliki aturan keterlambatan. Gunakan konfigurasi jam kerja/aturan absensi yang sudah ada.

- **Pesan:** 😭 "Aduh… kamu terlambat cukup lama hari ini 🥺"
- **Subteks:** "Semoga besok perjalananmu lebih lancar dan bisa datang tepat waktu."
- Tetap tampilkan waktu dan status keterlambatan.
- Pesan tidak boleh bernada menghukum atau mempermalukan pegawai.

---

## 2. Absen Pulang

Setelah pegawai berhasil melakukan absen pulang, tampilkan popup:

> "Gimana perasaanmu hari ini?"

Berikan 5 pilihan (gunakan tombol/card besar yang nyaman disentuh di mobile):

- 😊 Senang
- 😐 Biasa saja
- 😔 Sedih
- 😫 Capek
- 😡 Kesal

---

## 3. Respons Mood

Setelah pegawai memilih mood, tampilkan respons sesuai pilihannya:

| Mood | Pesan | Subteks |
|---|---|---|
| 😊 Senang | "Yeay! Kamu pulang dengan perasaan senang! 🥳" | "Aku ikut happy 😆 Sampai jumpa besok!" |
| 😐 Biasa saja | "Hari ini biasa saja ya? 😌" | "Semoga besok ada lebih banyak hal yang bikin kamu tersenyum!" |
| 😔 Sedih | "Hari ini terasa berat ya? 🥺" | "Istirahat yang cukup. Semoga besok jadi hari yang lebih baik." |
| 😫 Capek | "Capek ya hari ini? 🥹" | "Kamu sudah melakukan yang terbaik. Sekarang waktunya istirahat." |
| 😡 Kesal | "Hari ini cukup melelahkan ya? 😮‍💨" | "Tinggalkan dulu urusan kantor, waktunya pulang dan istirahat." |

Setelah respons muncul, berikan tombol **"Selesai"**. Popup kemudian ditutup dan pegawai kembali ke dashboard.

---

## 4. Mood Bersifat Opsional

Pegawai tidak boleh dipaksa mengisi mood. Jika pegawai:

- menutup popup
- menekan tombol close
- berpindah halaman
- atau melewati popup

Maka **absensi pulang tetap berhasil**. Jangan membuat mood menjadi syarat untuk menyelesaikan absensi.

---

## 5. Penyimpanan Data

Simpan data mood hanya jika pegawai memilih salah satu mood.

**Struktur minimal — `EmployeeMood`:**
- `id`
- `employeeId`
- `date`
- `mood`
- `createdAt`

**Enum mood:**
```
HAPPY
NEUTRAL
SAD
TIRED
ANGRY
```

Catatan:
- Gunakan UUID v7 sesuai standar database aplikasi yang sudah ada.
- Buat constraint agar satu pegawai hanya mempunyai satu respons mood untuk satu hari/shift, kecuali sistem absensi memang mendukung beberapa shift.
- Jangan membuat tabel atau field duplikat jika project sudah mempunyai struktur yang dapat digunakan.

---

## 6. Data Absensi dan Mood

Hubungkan mood dengan data absensi hari tersebut.

**Contoh:**
```
Pegawai: Andi
Tanggal: 25 September 2026
Absen masuk: 07:54
Status: Tepat waktu
Absen pulang: 17:03
Mood: HAPPY
```

Dengan demikian HRD dapat melihat hubungan sederhana antara kehadiran dan mood tanpa mengubah data absensi utama.

---

## 7. Dashboard Pegawai

Tambahkan card kecil pada dashboard pegawai: **"Hari Ini"**

**Contoh:**
```
☀️ Kehadiran
07:54 — Tepat waktu

🌇 Pulang
17:03

😊 Perasaan hari ini
Senang
```

Jangan menampilkan data terlalu banyak. Gunakan desain yang ringan dan konsisten dengan UI HRIS yang sudah ada.

---

## 8. Dashboard HRD / Admin

Tambahkan menu **"Employee Experience"** atau, jika struktur aplikasi sudah mempunyai dashboard HRD, gunakan **"Mood & Kehadiran"**.

Dashboard harus menampilkan hasil respons pegawai secara agregat.

**Statistik hari ini (contoh):**
- 😊 Senang — 62%
- 😐 Biasa — 24%
- 😫 Capek — 8%
- 😔 Sedih — 4%
- 😡 Kesal — 2%

Tampilkan dalam chart sederhana. Jangan menggunakan chart yang berat.

---

## 9. Filter Dashboard HRD

Sediakan filter (jika data memungkinkan):

- Hari ini
- 7 hari
- 30 hari
- Custom tanggal
- Unit kerja
- Cabang/bagian

Jangan mengambil seluruh data sekaligus. Gunakan query agregasi dan pagination jika diperlukan.

---

## 10. Trend Mood

Tampilkan trend sederhana, contoh: **"Trend Mood 7 Hari"** — perubahan proporsi mood dari hari ke hari, untuk melihat perubahan suasana kerja secara umum.

Jangan membuat sistem memberikan kesimpulan otomatis seperti:
- ❌ "Pegawai sedang tidak bahagia."

Lebih baik:
- ✅ "Pada tanggal tertentu, proporsi respons 😔 meningkat."

Interpretasi tetap dilakukan oleh HRD.

---

## 11. Analisis Sederhana

Tambahkan statistik tambahan:

```
Total respon hari ini: 287
Tingkat respons: 82%
Mood terbanyak: 😊 Senang
Pegawai tepat waktu: 271
Pegawai terlambat: 16
```

Jika ingin menghubungkan absensi dengan mood, tampilkan data secara agregat.

**Contoh — Pegawai tepat waktu:**
```
😊 68%   😐 22%   😫 7%   😔 2%   😡 1%
```

**Contoh — Pegawai terlambat:**
```
😊 48%   😐 27%   😫 15%   😔 7%   😡 3%
```

Jangan menyimpulkan bahwa keterlambatan menyebabkan mood tertentu. Tampilkan hanya sebagai statistik.

---

## 12. Privasi

Data mood merupakan data personal yang perlu diperlakukan dengan hati-hati.

Untuk dashboard umum:
- Gunakan agregasi
- Jangan menampilkan nama pegawai pada grafik mood
- Jangan membuat ranking mood pegawai
- Jangan menjadikan mood sebagai KPI
- Jangan otomatis menghubungkan mood dengan penilaian kinerja
- Akses data individual hanya untuk role yang memang berwenang

Jika diperlukan, HRD dapat memiliki akses laporan individual sesuai hak akses yang sudah berlaku.

---

## 13. PWA Performance

Fitur ini harus dibuat seringan mungkin. Wajib diperhatikan:

- Jangan menambah library besar hanya untuk popup
- Gunakan komponen UI yang sudah ada
- Jangan melakukan request tambahan yang tidak diperlukan
- Mood hanya dikirim ke API setelah pegawai memilih
- Jangan polling
- Jangan menjalankan background process
- Jangan menyimpan mood ke cache PWA jika tidak diperlukan
- Jangan mengambil statistik HRD pada dashboard pegawai
- Dashboard HRD menggunakan API agregasi
- Gunakan lazy loading untuk chart jika diperlukan
- Popup harus cepat muncul setelah absensi berhasil
- Animasi sederhana saja
- Pastikan tetap lancar pada HP kelas menengah/bawah

---

## 14. Alur Lengkap

### Pagi
```
Pegawai membuka aplikasi
  → Klik Absen Masuk
  → Absensi berhasil
  → Sistem menentukan: Tepat waktu / Terlambat / Terlambat parah
  → Popup ucapan muncul
  → Pegawai menutup popup
  → Dashboard
```

### Sore
```
Pegawai klik Absen Pulang
  → Absensi berhasil
  → Popup: "Gimana perasaanmu hari ini?"
  → 😊 😐 😔 😫 😡
  → Pegawai memilih mood
  → Respons personal muncul
  → Pegawai klik Selesai
  → Dashboard
```

### HRD
```
HRD membuka Employee Experience
  → Melihat Kehadiran + Mood
  → Melihat statistik agregat: 😊 😐 😔 😫 😡
  → Filter: Tanggal / Unit / Cabang
  → Melihat trend
```

---

## 15. Aturan UX

Desain harus:
- Modern
- Sederhana
- Ramah
- Profesional
- Tidak terlalu kekanak-kanakan
- Tidak terlalu banyak animasi
- Tidak mengganggu proses absensi
- Nyaman digunakan dengan satu tangan di HP

Gunakan identitas visual HRIS yang sudah ada. Jangan membuat desain baru yang bertentangan dengan design system aplikasi.

---

## 16. Implementasi

### Sebelum coding
1. Audit struktur database.
2. Cari model absensi yang sudah ada.
3. Cari mekanisme penentuan status terlambat.
4. Cari komponen modal/dialog yang sudah tersedia.
5. Cari dashboard HRD yang sudah ada.
6. Cari sistem role dan permission.
7. Gunakan komponen dan pola yang sudah ada jika memungkinkan.

> Jangan membuat sistem baru jika functionality yang sama sudah tersedia.

### Setelah implementasi
- [ ] Jalankan migration/validation database
- [ ] Test absensi tepat waktu
- [ ] Test terlambat
- [ ] Test terlambat parah
- [ ] Test absen pulang
- [ ] Test setiap pilihan mood
- [ ] Test close tanpa memilih mood
- [ ] Test refresh
- [ ] Test login ulang
- [ ] Test mobile
- [ ] Test PWA
- [ ] Test dashboard HRD
- [ ] Test filter
- [ ] Test akses berdasarkan role
- [ ] Test tidak terjadi duplicate mood
- [ ] Test API tidak dipanggil berulang

Pastikan fitur baru tidak mengganggu mekanisme absensi, payroll, laporan, atau modul HRIS lainnya.
