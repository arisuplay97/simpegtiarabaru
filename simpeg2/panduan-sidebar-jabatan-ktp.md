# PANDUAN PASANG: Sidebar Minimize + Jabatan Dropdown + Hapus KTP

---

## 1. GANTI `components/simpeg/sidebar-nav.tsx`

Ganti SELURUH isi file dengan kode dari file `sidebar-nav-minimize.tsx` yang disediakan.

Fitur yang ada:
- Tombol `‹` di pojok kanan header → collapse sidebar jadi lebar 64px (icon only)
- Tombol `›` muncul saat collapsed → expand kembali ke 256px
- Saat collapsed: hanya icon tampil, hover menampilkan tooltip nama menu
- Animasi smooth 300ms
- Badge notif tetap muncul (kecil) saat collapsed
- Menu "Kelola Bidang" sudah ditambahkan di group Pengaturan
- CSS variable `--sidebar-width` di-update otomatis via `useEffect`

---

## 2. TAMBAH CSS di `app/globals.css`

Tambahkan di bagian `:root` (setelah variabel yang sudah ada):
```css
:root {
  --sidebar-width: 16rem; /* default expanded */
}
```

Tambahkan class baru (di luar `:root`, setelah blok variabel):
```css
/* Sidebar offset — otomatis menyesuaikan lebar sidebar */
.sidebar-offset {
  padding-left: var(--sidebar-width);
  transition: padding-left 0.3s ease;
}
```

---

## 3. GANTI `pl-64` di SEMUA halaman

Lakukan find & replace di seluruh proyek:

**Cari:**
```
flex flex-1 flex-col pl-64
```
**Ganti:**
```
flex flex-1 flex-col sidebar-offset
```

Halaman yang perlu diganti (lakukan di semua sekaligus):
- `app/dashboard/page.tsx`
- `app/pegawai/page.tsx`
- `app/pegawai/[id]/page.tsx`
- `app/pegawai/profil/page.tsx`
- `app/absensi/page.tsx`
- `app/absensi/selfie/page.tsx`
- `app/absensi/koreksi/page.tsx`
- `app/approval/page.tsx`
- `app/cuti/page.tsx`
- `app/payroll/page.tsx`
- `app/slip-gaji/page.tsx`
- `app/mutasi/page.tsx`
- `app/kpi/page.tsx`
- `app/kgb/page.tsx`
- `app/kenaikan-pangkat/page.tsx`
- `app/sp/page.tsx`
- `app/notifikasi/page.tsx`
- `app/organisasi/page.tsx`
- `app/formasi/page.tsx`
- `app/dokumen/page.tsx`
- `app/sk/page.tsx`
- `app/settings/users/page.tsx`
- `app/settings/bidang/page.tsx`
- `app/settings/lokasi/page.tsx`
- `app/settings/role/page.tsx`
- Semua halaman lain yang ada `pl-64`

---

## 4. UPDATE `app/pegawai/page.tsx` — Jabatan Dropdown + Hapus KTP

### 4a. Tambah import di bagian atas
```tsx
import { bidangList, getJabatanOptions, getAtasanOtomatis, getJabatanLabel, type TipeJabatan } from "@/lib/data/bidang-store"
```

### 4b. Update state `newEmployee`
Cari:
```tsx
const [newEmployee, setNewEmployee] = useState({
  nama: "",
  nik: "",
  email: "",
  jabatan: "",
  unitKerja: "",
  golongan: "",
  status: "aktif",
  tanggalMasuk: new Date().toISOString().split("T")[0],
  role: "PEGAWAI",
  password: "123"
})
```
Ganti dengan:
```tsx
const [newEmployee, setNewEmployee] = useState({
  nama: "",
  nik: "",
  email: "",
  jabatan: "",
  unitKerja: "",
  bidangId: "",
  tipeJabatan: "" as TipeJabatan | "",
  atasanLangsung: "",
  golongan: "",
  status: "aktif",
  tanggalMasuk: new Date().toISOString().split("T")[0],
  role: "PEGAWAI",
  password: "123"
})
```

### 4c. Di form Dialog Tambah Pegawai — ganti field Jabatan & Unit Kerja

Cari kedua input ini:
```tsx
<div className="space-y-2">
  <Label>Jabatan</Label>
  <Input value={newEmployee.jabatan} onChange={e => setNewEmployee({...newEmployee, jabatan: e.target.value})} />
</div>
<div className="space-y-2">
  <Label>Unit Kerja</Label>
  <Input value={newEmployee.unitKerja} onChange={e => setNewEmployee({...newEmployee, unitKerja: e.target.value})} />
</div>
```

Ganti dengan:
```tsx
{/* Pilih Bidang */}
<div className="space-y-2">
  <Label>Bidang / Unit Kerja *</Label>
  <Select
    value={newEmployee.bidangId}
    onValueChange={v => {
      const b = bidangList.find(x => x.id === v)
      setNewEmployee(p => ({
        ...p,
        bidangId: v,
        unitKerja: b?.nama ?? "",
        tipeJabatan: "",
        jabatan: "",
        atasanLangsung: "",
      }))
    }}
  >
    <SelectTrigger><SelectValue placeholder="Pilih bidang" /></SelectTrigger>
    <SelectContent>
      {bidangList.filter(b => b.aktif).map(b => (
        <SelectItem key={b.id} value={b.id}>{b.nama}</SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>

{/* Pilih Jabatan — muncul setelah bidang dipilih */}
{newEmployee.bidangId && (
  <div className="space-y-2">
    <Label>Jabatan *</Label>
    <Select
      value={newEmployee.tipeJabatan}
      onValueChange={v => {
        const tipe = v as TipeJabatan
        const b = bidangList.find(x => x.id === newEmployee.bidangId)
        const jabatanLabel = b ? getJabatanLabel(tipe, b.nama) : ""
        const atasan = getAtasanOtomatis(tipe, newEmployee.bidangId)
        setNewEmployee(p => ({
          ...p,
          tipeJabatan: tipe,
          jabatan: jabatanLabel,
          atasanLangsung: atasan,
        }))
      }}
    >
      <SelectTrigger><SelectValue placeholder="Pilih jabatan" /></SelectTrigger>
      <SelectContent>
        {getJabatanOptions(newEmployee.bidangId).map(opt => (
          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)}

{/* Preview atasan otomatis */}
{newEmployee.atasanLangsung && newEmployee.atasanLangsung !== "-" && (
  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
    <p className="text-xs text-emerald-700">
      ✓ Atasan langsung: <strong>{newEmployee.atasanLangsung}</strong>
    </p>
  </div>
)}
```

---

## 5. UPDATE `app/pegawai/[id]/page.tsx` — Hapus KTP + Jabatan Dropdown di Edit

### 5a. Hapus field KTP dari tampilan profil

Cari dan hapus seluruh blok ini di tab Data Pribadi:
```tsx
<div>
  <p className="text-xs text-muted-foreground">No. KTP</p>
  <p className="font-mono font-medium">{employee.noKtp}</p>
</div>
```

### 5b. Hapus field KTP dari form edit Dialog

Cari dan hapus input field `noKtp` di dalam Dialog edit:
```tsx
{/* NIK & No KTP */}
...
<Input ... value={formData.noKtp} onChange={e => handleChange("noKtp", e.target.value)} ... />
```
Hapus seluruh blok input noKtp.

### 5c. Tambah import bidang store
```tsx
import { bidangList, getJabatanOptions, getAtasanOtomatis, getJabatanLabel, type TipeJabatan } from "@/lib/data/bidang-store"
```

### 5d. Di form edit Dialog — ganti input jabatan dengan dropdown

Cari input jabatan di Dialog edit:
```tsx
<div>
  <Label>Jabatan</Label>
  <Input className="mt-1" value={formData.jabatan} onChange={e => handleChange("jabatan", e.target.value)} />
</div>
```

Ganti dengan:
```tsx
{/* Bidang */}
<div>
  <Label>Bidang / Unit Kerja</Label>
  <Select
    value={bidangList.find(b => b.nama === formData.unitKerja)?.id ?? ""}
    onValueChange={v => {
      const b = bidangList.find(x => x.id === v)
      handleChange("unitKerja", b?.nama ?? "")
      handleChange("jabatan", "")
      handleChange("atasanLangsung", "")
    }}
  >
    <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih bidang" /></SelectTrigger>
    <SelectContent>
      {bidangList.filter(b => b.aktif).map(b => (
        <SelectItem key={b.id} value={b.id}>{b.nama}</SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>

{/* Jabatan */}
{formData.unitKerja && (
  <div>
    <Label>Jabatan</Label>
    <Select
      value={formData.jabatan}
      onValueChange={v => {
        const bid = bidangList.find(b => b.nama === formData.unitKerja)
        if (!bid) return
        const tipe = v as TipeJabatan
        handleChange("jabatan", getJabatanLabel(tipe, bid.nama))
        handleChange("atasanLangsung", getAtasanOtomatis(tipe, bid.id))
      }}
    >
      <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih jabatan" /></SelectTrigger>
      <SelectContent>
        {getJabatanOptions(
          bidangList.find(b => b.nama === formData.unitKerja)?.id ?? ""
        ).map(opt => (
          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)}
```

---

## 6. UPDATE `app/pegawai/profil/page.tsx` — Hapus KTP

Cari dan hapus semua kemunculan:
```tsx
noKTP: "...",
// atau
{ label: "No. KTP", value: myProfile.noKTP },
// atau
<p>...noKTP...</p>
```

---

## CATATAN PENTING

- File `lib/data/bidang-store.ts` harus sudah ada sebelum langkah 4 dan 5
- Jangan ubah `app/absensi/koreksi/page.tsx`
- Setelah replace `pl-64` → `sidebar-offset`, cek di browser apakah layout masih benar
- Kalau ada halaman yang layoutnya geser, pastikan class `sidebar-offset` sudah masuk ke CSS
