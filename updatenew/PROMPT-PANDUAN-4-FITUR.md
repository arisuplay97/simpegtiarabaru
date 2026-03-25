# PROMPT PANDUAN — 4 FITUR BARU SIMPEG PDAM
## Proyek: simpegtiarabaru | Next.js 15 + Prisma + PostgreSQL + shadcn/ui

---

## ═══════════════════════════════════════════
## 1. AUDIT LOG
## ═══════════════════════════════════════════

### PROMPT untuk AI:
```
Saya punya proyek HRIS Next.js 15 dengan Prisma + PostgreSQL + shadcn/ui.
Tambahkan fitur AUDIT LOG yang mencatat seluruh aktivitas pengguna.

Kebutuhan:
- Setiap operasi CREATE/UPDATE/DELETE/LOGIN/EXPORT/IMPORT/APPROVE/REJECT dicatat otomatis
- Simpan: userId, email, role, action, module, targetId, targetName, oldData (JSON), newData (JSON), IP, userAgent
- Halaman admin untuk melihat log dengan filter: modul, aksi, tanggal, search email
- Pagination 50 baris per halaman
- Detail popup menampilkan diff oldData vs newData dengan highlight
- Export CSV untuk kebutuhan compliance/audit eksternal
- Hanya SUPERADMIN dan HRD yang bisa akses
- Gunakan helper function logAudit() yang bisa dipanggil dari server action manapun

Stack: Next.js 15 App Router, Prisma, PostgreSQL, TypeScript, shadcn/ui, Tailwind, sonner toast.
Gunakan 'use server' untuk server actions. Auth dari next-auth session.
```

### File yang perlu dibuat:
- `prisma/schema.prisma` → tambahkan model AuditLog
- `lib/actions/audit-log.ts` → logAudit(), getAuditLogs(), exportAuditLogCSV()
- `app/audit-log/page.tsx` → halaman UI lengkap

### Cara integrasi di server action yang sudah ada:
```typescript
// Contoh di lib/actions/pegawai.ts
import { logAudit } from "./audit-log"

export async function updatePegawai(id: string, data: any) {
  const old = await prisma.pegawai.findUnique({ where: { id } })
  const result = await prisma.pegawai.update({ where: { id }, data })
  
  // Tambahkan ini setelah setiap operasi penting:
  await logAudit({
    action: "UPDATE",
    module: "pegawai",
    targetId: id,
    targetName: result.nama,
    oldData: old,
    newData: result,
  })
  return result
}
```

### Tambahkan ke sidebar-nav.tsx:
```typescript
{ href: "/audit-log", icon: Shield, label: "Audit Log", roles: ["SUPERADMIN"] }
```

---

## ═══════════════════════════════════════════
## 2. PPh 21 & KEPATUHAN PAJAK
## ═══════════════════════════════════════════

### PROMPT untuk AI:
```
Tambahkan modul PPh 21 ke HRIS PDAM. Kebutuhan:

PERHITUNGAN:
- Tarif progresif UU HPP 2021: 5% (0-60 jt), 15% (60-250 jt), 25% (250-500 jt), 30% (500 jt-5 M), 35% (>5 M)
- PTKP 2024: TK/0=54jt, K/0=58.5jt, K/1=63jt, K/2=67.5jt, K/3=72jt, HB/0=112.5jt
- Biaya jabatan: 5% max Rp 6.000.000/tahun
- Support 3 metode: GROSS (potong gaji), GROSS_UP (ditanggung perusahaan), NET
- Hitung otomatis dari data payroll + lembur bulan berjalan

FITUR:
- Proses batch seluruh pegawai aktif per periode (1 klik)
- Tabel daftar dengan kolom: Bruto, Biaya Jabatan, Netto, PKP, PPh21/bulan
- Detail popup per pegawai dengan rincian lengkap perhitungan
- Export e-SPT CSV (format siap upload ke DJP Online)
- Summary kartu: total pegawai, total bruto, total PPh21, rata-rata PPh21
- Info banner tarif progresif yang aktif

Stack: Next.js 15 App Router, Prisma, TypeScript, shadcn/ui.
Model database: PPh21 dengan unique constraint [pegawaiId, periode].
```

### File yang perlu dibuat:
- `prisma/schema.prisma` → tambahkan model PPh21, enum MetodePPh21
- `lib/actions/pph21.ts` → hitungPPh21Pegawai(), prosesPPh21Batch(), getPPh21List(), exportESPT()
- `app/pph21/page.tsx` → halaman UI lengkap (ganti placeholder)

### Cara integrasi dengan Payroll:
```typescript
// Di lib/actions/payroll.ts, setelah processAllPayroll():
// Panggil prosesPPh21Batch(periodStr) otomatis
// Sehingga setiap proses payroll, PPh 21 langsung terhitung
```

### Catatan regulasi:
- Gunakan tarif UU HPP No. 7 Tahun 2021 (berlaku mulai Januari 2022)
- PTKP sesuai PMK-168/PMK.010/2023 (berlaku 2024)
- Format e-SPT: sesuai panduan DJP untuk SPT Masa PPh 21

---

## ═══════════════════════════════════════════
## 3. LEMBUR + SHIFT KERJA
## ═══════════════════════════════════════════

### PROMPT untuk AI:
```
Tambahkan modul Shift Kerja dan Lembur ke HRIS PDAM.

SHIFT KERJA:
- CRUD tipe shift (nama, kode, jam masuk, jam keluar, durasi, keterangan)
- Assign jadwal shift ke pegawai per tanggal (upsert)
- View jadwal mingguan per pegawai
- Tampilan card per tipe shift dengan info jumlah pegawai terjadwal

LEMBUR:
- Pengajuan lembur: pegawai mengisi tanggal, jam mulai-selesai, jenis (hari kerja/libur/besar), alasan
- Perhitungan tarif otomatis sesuai Kepmenaker 102/2004:
  * Upah sejam = (gaji pokok + tunjangan tetap) / 173
  * Hari kerja: jam-1 = 1.5x, jam-2+ = 2x
  * Hari libur: jam 1-7 = 2x, jam-8 = 3x, jam-9+ = 4x
- Approval flow: PENDING → APPROVED/REJECTED oleh HRD/Direksi
- Filter by bulan, status
- Summary: total pengajuan, pending, total bayar approved

Stack: Next.js 15, Prisma, shadcn/ui. 
Model: Shift, JadwalShift, Lembur dengan enum JenisLembur dan StatusLembur.
```

### File yang perlu dibuat:
- `prisma/schema.prisma` → model Shift, JadwalShift, Lembur + enum
- `lib/actions/shift-lembur.ts` → semua server actions
- `app/shift/page.tsx` → halaman dengan 2 tab: Tipe Shift + Pengajuan Lembur

### Tambahkan relasi ke model Pegawai:
```prisma
jadwalShift  JadwalShift[]
lembur       Lembur[]
```

### Integrasi dengan Payroll:
```typescript
// Di getPayrollList(), tambahkan lembur yang APPROVED:
const lemburApproved = await prisma.lembur.findMany({
  where: { pegawaiId: emp.id, status: "APPROVED", tanggal: { gte: start, lte: end } }
})
const lemburBayar = lemburApproved.reduce((s, l) => s + Number(l.totalBayar), 0)
// Tambahkan lemburBayar ke total gaji
```

---

## ═══════════════════════════════════════════
## 4. IMPORT MESIN FINGERPRINT
## ═══════════════════════════════════════════

### PROMPT untuk AI:
```
Tambahkan fitur import data dari mesin fingerprint ke HRIS PDAM.

FORMAT YANG DIDUKUNG:
1. CSV: NIK,Nama(opsional),Tanggal,Jam Masuk,Jam Keluar
2. TXT/DAT: Format attendance log ZKTeco (NIK datetime terminal event)

PROSES IMPORT:
- Upload file lewat drag & drop atau klik
- Parse file sesuai format yang terdeteksi otomatis
- Match NIK ke database pegawai
- Hitung status: HADIR/TERLAMBAT berdasarkan pengaturan batas terlambat
- Upsert absensi (update jika sudah ada, create jika belum)
- Tampilkan hasil: total record, berhasil, gagal + error log detail
- Progress bar keberhasilan
- Simpan riwayat setiap import ke tabel ImportFingerprint

RIWAYAT:
- Tabel riwayat 20 import terakhir: nama file, total, berhasil, gagal, status, waktu

Stack: Next.js 15 App Router, Prisma, shadcn/ui.
Model: ImportFingerprint dengan errorLog (Json).
Path halaman: /absensi/import-fingerprint
```

### File yang perlu dibuat:
- `prisma/schema.prisma` → model ImportFingerprint, enum StatusImport
- `lib/actions/fingerprint-import.ts` → parseCSV(), parseTXT(), importFingerprint(), getRiwayatImport()
- `app/absensi/import-fingerprint/page.tsx` → halaman UI lengkap

### Tambahkan ke sidebar menu Kehadiran:
```typescript
{ href: "/absensi/import-fingerprint", icon: Upload, label: "Import Fingerprint", roles: ["SUPERADMIN", "HRD"] }
```

### Template CSV untuk download (bantu user):
```csv
NIK,Tanggal,Jam Masuk,Jam Keluar
100001,2026-03-01,07:55,17:10
100002,2026-03-01,08:02,17:05
100003,2026-03-01,08:20,17:00
```

---

## ═══════════════════════════════════════════
## LANGKAH INSTALASI LENGKAP
## ═══════════════════════════════════════════

### 1. Update Prisma Schema
Tambahkan semua model baru dari file `schema-additions.prisma` ke `prisma/schema.prisma`.
Tambahkan relasi ke model Pegawai:
```prisma
jadwalShift  JadwalShift[]
lembur       Lembur[]
pph21        PPh21[]
```

### 2. Jalankan migrasi
```bash
npx prisma db push
# atau
npx prisma migrate dev --name add-audit-shift-lembur-pph21-fingerprint
npx prisma generate
```

### 3. Copy file ke proyek
```
lib/actions/audit-log.ts        ← helper logAudit (panggil dari mana saja)
lib/actions/pph21.ts            ← perhitungan PPh 21
lib/actions/shift-lembur.ts     ← shift & lembur
lib/actions/fingerprint-import.ts ← import fingerprint
app/audit-log/page.tsx          ← halaman audit log
app/pph21/page.tsx              ← ganti file yang sudah ada
app/shift/page.tsx              ← ganti file yang sudah ada
app/absensi/import-fingerprint/page.tsx ← halaman baru
```

### 4. Tambahkan ke sidebar-nav.tsx
Cari file `components/simpeg/sidebar-nav.tsx` dan tambahkan menu:
```typescript
// Di section "Kehadiran":
{ href: "/absensi/import-fingerprint", icon: Upload, label: "Import Fingerprint" }
{ href: "/shift", icon: Clock, label: "Shift & Lembur" }

// Di section "Remunerasi":
{ href: "/pph21", icon: Receipt, label: "PPh 21" }

// Di section "Sistem" (hanya SUPERADMIN):
{ href: "/audit-log", icon: Shield, label: "Audit Log" }
```

### 5. Import icon baru di sidebar
```typescript
import { Upload, Clock, Receipt, Shield } from "lucide-react"
```

### 6. Integrasi logAudit di action yang sudah ada
Tambahkan `await logAudit({...})` di setiap server action yang sudah ada:
- `lib/actions/pegawai.ts` → setiap update/delete
- `lib/actions/payroll.ts` → proses payroll
- `lib/actions/cuti.ts` → approve/reject
- `lib/actions/mutasi.ts` → approve/reject

---

## CATATAN PENTING

### Performa
- AuditLog akan tumbuh cepat → tambahkan index di `createdAt`, `module`, `action`
- Pertimbangkan archiving log > 1 tahun ke storage terpisah
- ImportFingerprint errorLog disimpan sebagai Json, hindari file > 10.000 baris

### Keamanan
- logAudit() fail-safe: error dicatch agar tidak interrupt proses utama
- Import fingerprint: validasi NIK dari database, bukan dari file
- PPh 21: tarif dikode di server, tidak bisa dimanipulasi dari frontend

### Regulasi PPh 21
- Tarif berdasarkan UU HPP No. 7/2021
- PTKP berdasarkan PMK-168/2023
- Untuk laporan e-SPT, gunakan aplikasi e-SPT resmi DJP atau integrasi API Coretax
