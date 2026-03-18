# PROMPT PERBAIKAN: Dashboard, CSS Print, Nama PDAM, Mutasi

Lakukan 4 perbaikan berikut. Jangan ubah desain/warna.

---

## 1. HALAMAN MUTASI — Ganti seluruh isi `app/mutasi/page.tsx`

Ganti placeholder "Sedang Dikembangkan" dengan halaman mutasi lengkap berisi:
- Tabel pengajuan mutasi dengan kolom: Pegawai, Dari, Ke, Jenis, Tgl Efektif, Status, Aksi
- 5 data dummy (2 approved, 2 pending, 1 rejected)
- Tabs: Semua / Menunggu / Disetujui / Ditolak
- Tombol "Ajukan Mutasi" → Dialog form lengkap dengan:
  - Nama pegawai, NIK
  - Jenis: Mutasi / Promosi / Rotasi / Demosi
  - Posisi Asal (unit + jabatan) & Posisi Tujuan (unit + jabatan) — tampilkan side by side
  - Tanggal efektif, Alasan (min 10 karakter)
  - Validasi semua field wajib
  - Loading state di tombol simpan
- Tombol Lihat Detail → Dialog detail lengkap termasuk nomor SK (jika approved)
- Tombol ✓ Setujui (hijau) → AlertDialog konfirmasi + input catatan opsional → status jadi approved + generate nomor SK
- Tombol ✗ Tolak (merah) → AlertDialog input alasan wajib → status jadi rejected
- Badge warna per jenis: Mutasi (biru), Promosi (hijau), Rotasi (ungu), Demosi (merah)
- Badge status: Menunggu (amber), Disetujui (hijau), Ditolak (merah)
- Stats cards: Total, Menunggu, Disetujui, Ditolak
- Pagination 8 per halaman
- Empty state jika tidak ada data
- Toast notifikasi setiap aksi

(Gunakan kode dari file mutasi-page.tsx yang disediakan)

---

## 2. DASHBOARD — Tanggal Otomatis di `app/dashboard/page.tsx`

Cari teks hardcoded tanggal seperti "Senin, 17 Maret 2026" atau string tanggal statis apapun.

Ganti dengan tanggal dinamis menggunakan date-fns:

```tsx
// Tambah import di bagian atas:
import { format } from "date-fns"
import { id } from "date-fns/locale"

// Ganti teks tanggal hardcoded dengan:
{format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })}
```

Jika ada subtitle di header dashboard seperti:
```tsx
<p>Ringkasan SDM hari ini - Senin, 17 Maret 2026</p>
```
Ganti menjadi:
```tsx
<p>Ringkasan SDM hari ini — {format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })}</p>
```

Lakukan hal yang sama di semua komponen dashboard:
- `app/dashboard/page.tsx`
- `components/simpeg/dashboard/kpi-cards.tsx`
- `components/simpeg/dashboard/approval-panel.tsx`
- `app/page.tsx` (jika ada tanggal hardcoded)

---

## 3. CSS PRINT — Ganti seluruh blok `@media print` di `app/globals.css`

Cari blok `@media print { ... }` yang sudah ada, **hapus semua isinya** dan ganti dengan:

```css
@media print {
  /* Sembunyikan elemen navigasi */
  aside,
  header,
  nav,
  .no-print,
  [data-sonner-toaster] {
    display: none !important;
    visibility: hidden !important;
  }

  /* Hapus padding kiri karena sidebar hidden */
  .pl-64 {
    padding-left: 0 !important;
  }

  /* Sembunyikan semua tombol */
  button {
    display: none !important;
  }

  /* Sembunyikan header halaman (judul + dropdown pilih pegawai/periode) */
  main > div:first-child {
    display: none !important;
  }

  /* Background putih */
  body, html {
    background: white !important;
    color: black !important;
    font-size: 10pt !important;
  }

  /* Slip gaji tampil penuh tanpa card shadow */
  .card-premium,
  .shadow-xl,
  .shadow-md,
  .shadow-sm {
    box-shadow: none !important;
    border: 1px solid #e5e7eb !important;
  }

  /* Max width penuh */
  .max-w-4xl,
  .max-w-3xl,
  .max-w-2xl {
    max-width: 100% !important;
    width: 100% !important;
  }

  /* Ukuran teks proporsional */
  .text-3xl { font-size: 18pt !important; }
  .text-2xl { font-size: 14pt !important; }
  .text-xl  { font-size: 12pt !important; }
  .text-lg  { font-size: 11pt !important; }
  .text-sm  { font-size: 9pt !important; }
  .text-xs  { font-size: 8pt !important; }

  /* Padding lebih kecil */
  .p-6 { padding: 0.6rem !important; }
  .p-4 { padding: 0.4rem !important; }
  .mb-6 { margin-bottom: 0.5rem !important; }
  .mt-6 { margin-top: 0.5rem !important; }
  .gap-6 { gap: 0.5rem !important; }

  /* Gradient background jadi solid untuk print */
  .bg-gradient-to-r,
  .bg-gradient-to-br {
    background: oklch(0.35 0.12 250) !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* QR code area tetap tampil */
  .border-dashed {
    border: 2px dashed #9ca3af !important;
  }

  @page {
    margin: 1cm;
    size: A4 portrait;
  }
}
```

---

## 4. NAMA PDAM — Konsistenkan di Seluruh Proyek

Ganti semua variasi nama PDAM menjadi **"PDAM Tirta Ardhia Rinjani"** di file-file berikut:

### `app/payroll/page.tsx`
Cari: `"PDAM Tirta Selaras Jaya"`
Ganti: `"PDAM Tirta Ardhia Rinjani"`

### `app/slip-gaji/page.tsx`
Cari semua kemunculan:
- `"PDAM Tirta Selaras Jaya"` → `"PDAM Tirta Ardhia Rinjani"`
- `"pdamtirtaselaras.co.id"` → `"pdamtiara.co.id"`
- `"info@pdamtirtaselaras.co.id"` → `"info@pdamtiara.co.id"`

### `app/pegawai/profil/page.tsx`
Cari: `"pdamtirtaselaras.co.id"`
Ganti: `"pdamtiara.co.id"`

### `app/pegawai/[id]/page.tsx`
Cari: `"pdamtirtaselaras.co.id"`
Ganti: `"pdamtiara.co.id"`

### `components/simpeg/sidebar-nav.tsx`
Cari semua variasi nama PDAM di brand subtitle:
```tsx
<span className="text-[10px] text-sidebar-muted">PDAM Tirta ...</span>
```
Ganti value menjadi: `"PDAM Tirta Ardhia Rinjani"`

### `app/layout.tsx`
Cari di metadata:
```tsx
title: 'SIMPEG PDAM ...'
description: '... PDAM ...'
```
Ganti menjadi:
```tsx
title: 'SIMPEG PDAM Tirta Ardhia Rinjani',
description: 'Sistem Informasi Manajemen Kepegawaian PDAM Tirta Ardhia Rinjani',
```

### Pencarian global (jika v0 bisa)
Lakukan find & replace di seluruh proyek:
- `"PDAM Tirta Selaras Jaya"` → `"PDAM Tirta Ardhia Rinjani"`
- `"PDAM Tirta Selaras"` (tanpa "Jaya") → `"PDAM Tirta Ardhia Rinjani"`
- `"pdamtirtaselaras"` → `"pdamtiara"`

---

## CATATAN

- Jangan ubah file `app/absensi/koreksi/page.tsx`
- Jangan ubah sistem auth (NextAuth)
- Semua data tetap dummy/mock
- Untuk halaman mutasi, gunakan kode lengkap dari file `mutasi-page.tsx` yang disediakan
