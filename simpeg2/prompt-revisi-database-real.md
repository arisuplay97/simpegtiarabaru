# PROMPT REVISI LENGKAP — DATABASE REAL, FOTO, DROPDOWN, MUTASI

Lakukan semua perubahan berikut. Data harus tersimpan ke database Neon (sudah tersambung).
Jangan ubah desain/warna. Jangan ubah file `app/absensi/koreksi/page.tsx`.

---

## LANGKAH 0 — SETUP VERCEL BLOB

### 0a. Install package
```bash
npm install @vercel/blob
```

### 0b. Tambah environment variable
Di file `.env` tambahkan:
```
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxxxx"
```
Token ini didapat dari: Vercel Dashboard → Project → Settings → Environment Variables → tambah `BLOB_READ_WRITE_TOKEN`
(Atau aktifkan Vercel Blob dari Storage tab di Vercel Dashboard)

---

## LANGKAH 1 — GANTI `prisma/schema.prisma`

Ganti SELURUH isi file dengan kode dari file `schema.prisma` yang disediakan.

Perubahan utama di schema:
- Model `Bidang` baru — master data unit kerja
- Model `Pegawai` diperluas dengan field: `fotoUrl`, `bidangId`, `tipeJabatan`, `pangkat` (enum), `sp`, `jenisKelamin`, `agama`, `statusNikah`, `pendidikanTerakhir`, `jurusan`, `institusi`, `tahunLulus`, dll
- Model `Mutasi` diperluas dengan `type`, `jabatanAsal`, `unitAsal`, `jabatanTujuan`, `unitTujuan`, `alasan`, `status`, `nomorSK`
- Semua enum baru: `TipeJabatan`, `TipePangkat`, `StatusPegawai`, `StatusSP`, `TingkatPendidikan`, `TipeMutasi`, dll

Setelah ganti schema, jalankan di terminal:
```bash
npx prisma db push
npx prisma generate
```

---

## LANGKAH 2 — GANTI `lib/actions/pegawai.ts`

Ganti SELURUH isi file dengan kode dari file `actions-pegawai.ts` yang disediakan.

Fungsi yang tersedia:
- `getEmployees()` — ambil semua pegawai dari DB
- `getEmployee(id)` — ambil satu pegawai
- `getEmployeeStats()` — statistik pegawai
- `createEmployee(data, fotoFile?)` — tambah pegawai + upload foto
- `updateEmployee(id, data, fotoFile?)` — update pegawai + ganti foto
- `deleteEmployee(id)` — hapus pegawai + foto
- `uploadFotoPegawai(id, file)` — upload/ganti foto saja
- `getMutasi()` — ambil semua mutasi
- `createMutasi(data)` — buat mutasi baru
- `updateMutasiStatus(id, status, catatan)` — approve/reject mutasi
- `getBidang()` — ambil semua bidang
- `createBidang/updateBidang/deleteBidang` — CRUD bidang

---

## LANGKAH 3 — UPDATE `app/pegawai/page.tsx`

### 3a. Import actions dan types
```tsx
import {
  getEmployees, getEmployeeStats, createEmployee,
  deleteEmployee, getBidang
} from "@/lib/actions/pegawai"
import { bidangList as fallbackBidang, getJabatanOptions, getAtasanOtomatis, getJabatanLabel, type TipeJabatan } from "@/lib/data/bidang-store"
```

### 3b. Load data dari database
```tsx
const [employees, setEmployees] = useState<any[]>([])
const [bidangData, setBidangData] = useState<any[]>([])
const [stats, setStats] = useState<any>(null)
const [loading, setLoading] = useState(true)

useEffect(() => {
  async function load() {
    const [emps, s, bid] = await Promise.all([
      getEmployees(),
      getEmployeeStats(),
      getBidang(),
    ])
    setEmployees(emps)
    setStats(s)
    setBidangData(bid.length > 0 ? bid : fallbackBidang)
  }
  load()
}, [])
```

### 3c. Form state tambah pegawai
```tsx
const [form, setForm] = useState({
  nik: "", nama: "", email: "", telepon: "",
  bidangId: "", tipeJabatan: "" as TipeJabatan | "",
  jabatan: "", atasanLangsung: "",
  golongan: "", pangkat: "",
  status: "AKTIF", sp: "",
  tanggalMasuk: new Date().toISOString().split("T")[0],
  jenisKelamin: "", tempatLahir: "", tanggalLahir: "",
  agama: "", statusNikah: "",
  pendidikanTerakhir: "", jurusan: "", institusi: "", tahunLulus: "",
  bank: "", noRekening: "", bpjsKesehatan: "", bpjsKetenagakerjaan: "",
  alamat: "", npwp: "",
  role: "PEGAWAI", password: "123456",
})
const [fotoFile, setFotoFile] = useState<File | null>(null)
const [fotoPreview, setFotoPreview] = useState<string | null>(null)
```

### 3d. Form Dialog Tambah Pegawai — lengkap

Struktur form dibagi section:

**Section 1: Foto + Nama + NIK**
```tsx
{/* Upload Foto */}
<div className="flex flex-col items-center gap-3">
  <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-dashed border-muted-foreground/30">
    {fotoPreview ? (
      <img src={fotoPreview} alt="Preview" className="h-full w-full object-cover" />
    ) : (
      <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
        <Camera className="h-8 w-8" />
      </div>
    )}
  </div>
  <label className="cursor-pointer">
    <input
      type="file"
      accept="image/*"
      className="hidden"
      onChange={e => {
        const file = e.target.files?.[0]
        if (file) {
          setFotoFile(file)
          setFotoPreview(URL.createObjectURL(file))
        }
      }}
    />
    <span className="text-xs text-primary underline">Upload Foto</span>
  </label>
</div>
```

**Section 2: Kepegawaian**
- NIK (16 digit)
- Dropdown Bidang → setelah dipilih, muncul Dropdown Jabatan
- Dropdown Pangkat: Kepala Bidang / Kepala Sub Bidang / Staff / Kontrak
- Dropdown Golongan (urutan: A/I, A/II, A/III, A/IV, B/I, B/II, B/III, B/IV, C/I, C/II, C/III, C/IV, D/I, D/II, D/III, D/IV, E/IV)
- Status, SP, Tanggal Masuk
- Preview atasan otomatis (emerald box)

**Dropdown Pangkat:**
```tsx
<Select value={form.pangkat} onValueChange={v => setForm(p => ({...p, pangkat: v}))}>
  <SelectTrigger><SelectValue placeholder="Pilih pangkat" /></SelectTrigger>
  <SelectContent>
    <SelectItem value="KEPALA_BIDANG">Kepala Bidang</SelectItem>
    <SelectItem value="KEPALA_SUB_BIDANG">Kepala Sub Bidang</SelectItem>
    <SelectItem value="STAFF">Staff</SelectItem>
    <SelectItem value="KONTRAK">Kontrak</SelectItem>
  </SelectContent>
</Select>
```

**Logika atasan berdasarkan pangkat:**
- `KEPALA_BIDANG` → atasannya = direkturAtasan dari bidang
- `KEPALA_SUB_BIDANG` → atasannya = kepalaBidang dari bidang
- `STAFF` → atasannya = Kepala Sub Bidang [nama bidang]
- `KONTRAK` → atasannya = Kepala Sub Bidang [nama bidang]

**Dropdown Golongan (urutan benar):**
```tsx
const golonganOptions = [
  "A/I","A/II","A/III","A/IV",
  "B/I","B/II","B/III","B/IV",
  "C/I","C/II","C/III","C/IV",
  "D/I","D/II","D/III","D/IV",
  "E/IV"
]
```

**Section 3: Data Pribadi**
- Tempat Lahir, Tanggal Lahir
- Jenis Kelamin, Agama, Status Nikah

**Section 4: Pendidikan** (2 kolom)
```tsx
<div className="grid grid-cols-2 gap-4">
  <div>
    <Label>Pendidikan Terakhir</Label>
    <Select value={form.pendidikanTerakhir} onValueChange={v => setForm(p => ({...p, pendidikanTerakhir: v}))}>
      <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih jenjang" /></SelectTrigger>
      <SelectContent>
        {["SD","SMP","SMA","D1","D2","D3","D4","S1","S2","S3"].map(j => (
          <SelectItem key={j} value={j}>{j}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
  <div>
    <Label>Jurusan</Label>
    <Input className="mt-1" value={form.jurusan} onChange={e => setForm(p => ({...p, jurusan: e.target.value}))} placeholder="Nama jurusan" />
  </div>
</div>
<div className="grid grid-cols-2 gap-4">
  <div>
    <Label>Institusi / Sekolah</Label>
    <Input className="mt-1" value={form.institusi} onChange={e => setForm(p => ({...p, institusi: e.target.value}))} placeholder="Nama institusi" />
  </div>
  <div>
    <Label>Tahun Lulus</Label>
    <Input className="mt-1" value={form.tahunLulus} onChange={e => setForm(p => ({...p, tahunLulus: e.target.value}))} placeholder="2020" maxLength={4} />
  </div>
</div>
```

**Section 5: Keuangan**
- Bank, No. Rekening, BPJS Kesehatan, BPJS TK, NPWP

**Section 6: Kontak**
- Email, Telepon, Alamat

### 3e. Handle submit ke database
```tsx
const handleCreate = async () => {
  if (!form.nama || !form.nik || !form.email) {
    toast.error("Nama, NIK, dan Email wajib diisi")
    return
  }
  setIsLoading(true)
  try {
    await createEmployee(form, fotoFile ?? undefined)
    toast.success("Pegawai berhasil ditambahkan")
    setShowAddDialog(false)
    loadData() // refresh dari DB
  } catch (error: any) {
    toast.error(error.message || "Gagal menambahkan pegawai")
  }
  setIsLoading(false)
}
```

### 3f. Handle hapus ke database
```tsx
const handleDelete = async (id: string) => {
  try {
    await deleteEmployee(id)
    toast.success("Pegawai berhasil dihapus")
    loadData()
  } catch {
    toast.error("Gagal menghapus pegawai")
  }
}
```

---

## LANGKAH 4 — UPDATE `app/mutasi/page.tsx`

### 4a. Load pegawai dari database untuk dropdown nama
```tsx
const [pegawaiList, setPegawaiList] = useState<any[]>([])
const [mutasiList, setMutasiList] = useState<any[]>([])

useEffect(() => {
  async function load() {
    const [pegs, muts] = await Promise.all([getEmployees(), getMutasi()])
    setPegawaiList(pegs)
    setMutasiList(muts)
  }
  load()
}, [])
```

### 4b. Di form Ajukan Mutasi — ganti input nama dengan dropdown Select

Hapus:
```tsx
<Input value={form.namaPegawai} ... />
<Input value={form.nik} ... />
```

Ganti dengan satu Select yang berisi daftar pegawai dari DB:
```tsx
<div>
  <Label>Nama Pegawai *</Label>
  <Select
    value={form.pegawaiId}
    onValueChange={v => {
      const p = pegawaiList.find(x => x.id === v)
      if (p) {
        setForm(prev => ({
          ...prev,
          pegawaiId: v,
          namaPegawai: p.nama,
          nik: p.nik,
          unitAsal: p.bidang?.nama ?? p.unitKerja ?? "",
          jabatanAsal: p.jabatan ?? "",
        }))
      }
    }}
  >
    <SelectTrigger className="mt-1">
      <SelectValue placeholder="Pilih pegawai..." />
    </SelectTrigger>
    <SelectContent>
      {pegawaiList.map(p => (
        <SelectItem key={p.id} value={p.id}>
          <div className="flex items-center gap-2">
            <span className="font-medium">{p.nama}</span>
            <span className="text-xs text-muted-foreground">— {p.jabatan}</span>
          </div>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>

{/* NIK auto-fill (readonly) */}
{form.nik && (
  <div className="rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground">
    NIK: <span className="font-mono font-medium">{form.nik}</span>
    &nbsp;|&nbsp; Unit Asal: <span className="font-medium">{form.unitAsal}</span>
    &nbsp;|&nbsp; Jabatan Asal: <span className="font-medium">{form.jabatanAsal}</span>
  </div>
)}
```

### 4c. Handle submit mutasi ke database
```tsx
const handleSubmit = async () => {
  if (!form.pegawaiId) { toast.error("Pilih pegawai terlebih dahulu"); return }
  if (!form.alasan || form.alasan.length < 10) { toast.error("Alasan minimal 10 karakter"); return }
  setIsLoading(true)
  try {
    await createMutasi({
      pegawaiId: form.pegawaiId,
      type: form.type.toUpperCase(),
      jabatanAsal: form.jabatanAsal,
      unitAsal: form.unitAsal,
      jabatanTujuan: form.jabatanTujuan,
      unitTujuan: form.unitTujuan,
      alasan: form.alasan,
      tanggalEfektif: form.tanggalEfektif,
    })
    toast.success("Pengajuan mutasi berhasil dikirim")
    setShowAddDialog(false)
    // Reload mutasi dari DB
    const updated = await getMutasi()
    setMutasiList(updated)
  } catch {
    toast.error("Gagal mengajukan mutasi")
  }
  setIsLoading(false)
}
```

### 4d. Handle approve/reject ke database
```tsx
const handleApprove = async () => {
  if (!selectedItem) return
  try {
    await updateMutasiStatus(selectedItem.id, "APPROVED", approveNote)
    toast.success("Mutasi disetujui")
    const updated = await getMutasi()
    setMutasiList(updated)
  } catch {
    toast.error("Gagal menyetujui mutasi")
  }
  setShowApproveDialog(false)
}

const handleReject = async () => {
  if (!selectedItem || !rejectNote.trim()) { toast.error("Alasan penolakan wajib diisi"); return }
  try {
    await updateMutasiStatus(selectedItem.id, "REJECTED", rejectNote)
    toast.error("Mutasi ditolak")
    const updated = await getMutasi()
    setMutasiList(updated)
  } catch {
    toast.error("Gagal menolak mutasi")
  }
  setShowRejectDialog(false)
}
```

---

## LANGKAH 5 — UPDATE `app/pegawai/[id]/page.tsx` — Upload Foto

### 5a. Tambah import
```tsx
import { getEmployee, updateEmployee, uploadFotoPegawai } from "@/lib/actions/pegawai"
import { useParams } from "next/navigation"
import { Camera } from "lucide-react"
```

### 5b. Load data dari database berdasarkan ID
```tsx
const params = useParams()
const employeeId = params.id as string

const [employee, setEmployee] = useState<any>(null)
const [loading, setLoading] = useState(true)

useEffect(() => {
  getEmployee(employeeId).then(data => {
    setEmployee(data)
    setLoading(false)
  })
}, [employeeId])
```

### 5c. Tampilkan foto dari database
```tsx
<Avatar className="h-28 w-28 shrink-0">
  {employee.fotoUrl ? (
    <AvatarImage src={employee.fotoUrl} alt={employee.nama} className="object-cover" />
  ) : null}
  <AvatarFallback className="bg-primary text-3xl text-primary-foreground">
    {employee.nama?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
  </AvatarFallback>
</Avatar>
```

### 5d. Tombol upload foto
Di bawah avatar, tambahkan:
```tsx
<label className="cursor-pointer mt-2">
  <input
    type="file"
    accept="image/*"
    className="hidden"
    onChange={async e => {
      const file = e.target.files?.[0]
      if (!file) return
      toast.loading("Mengupload foto...")
      try {
        const url = await uploadFotoPegawai(employee.id, file)
        setEmployee((prev: any) => ({ ...prev, fotoUrl: url }))
        toast.dismiss()
        toast.success("Foto berhasil diperbarui")
      } catch {
        toast.dismiss()
        toast.error("Gagal upload foto")
      }
    }}
  />
  <span className="flex items-center gap-1 text-xs text-primary hover:underline">
    <Camera className="h-3 w-3" /> Ganti Foto
  </span>
</label>
```

---

## LANGKAH 6 — UPDATE `app/settings/bidang/page.tsx`

Ganti fungsi-fungsi dummy dengan call ke database:

```tsx
import { getBidang, createBidang, updateBidang, deleteBidang } from "@/lib/actions/pegawai"

// Load dari DB
useEffect(() => {
  getBidang().then(setBidang)
}, [])

// Simpan ke DB
const handleSave = async () => {
  if (!validate()) return
  setIsLoading(true)
  try {
    if (editingItem) {
      await updateBidang(editingItem.id, form)
      toast.success(`Bidang ${form.nama} berhasil diperbarui`)
    } else {
      await createBidang(form)
      toast.success(`Bidang ${form.nama} berhasil ditambahkan`)
    }
    const updated = await getBidang()
    setBidang(updated)
    setShowDialog(false)
  } catch (e: any) {
    toast.error(e.message || "Gagal menyimpan bidang")
  }
  setIsLoading(false)
}

// Hapus dari DB
const handleDelete = async () => {
  if (!deletingItem) return
  setIsLoading(true)
  try {
    await deleteBidang(deletingItem.id)
    toast.success(`Bidang ${deletingItem.nama} berhasil dihapus`)
    const updated = await getBidang()
    setBidang(updated)
    setShowDeleteDialog(false)
  } catch {
    toast.error("Gagal menghapus bidang")
  }
  setIsLoading(false)
}
```

---

## LANGKAH 7 — SEED DATA BIDANG KE DATABASE

Buat file `prisma/seed-bidang.ts`:
```ts
import { prisma } from "@/lib/prisma"

async function main() {
  const bidangData = [
    { nama: "IT & Sistem",  kode: "IT",   kepalaBidang: "Ahmad Rizki Pratama",  direkturAtasan: "Direktur Teknik",  aktif: true },
    { nama: "Keuangan",     kode: "KEU",  kepalaBidang: "Siti Nurhaliza",       direkturAtasan: "Direktur Umum",    aktif: true },
    { nama: "Distribusi",   kode: "DIST", kepalaBidang: "Budi Santoso",         direkturAtasan: "Direktur Teknik",  aktif: true },
    { nama: "Pelayanan",    kode: "PEL",  kepalaBidang: "Dewi Lestari",         direkturAtasan: "Direktur Umum",    aktif: true },
    { nama: "Produksi",     kode: "PROD", kepalaBidang: "Ir. Gunawan Wibowo",   direkturAtasan: "Direktur Teknik",  aktif: true },
    { nama: "SDM & Umum",   kode: "SDM",  kepalaBidang: "Fitri Handayani",      direkturAtasan: "Direktur Umum",    aktif: true },
    { nama: "Direksi",      kode: "DIR",  kepalaBidang: "Ir. Joko Widagdo",     direkturAtasan: "Dewan Pengawas",   aktif: true },
  ]

  for (const b of bidangData) {
    await prisma.bidang.upsert({
      where: { kode: b.kode },
      update: b,
      create: b,
    })
  }
  console.log("Bidang seeded!")
}

main().then(() => prisma.$disconnect())
```

Jalankan:
```bash
npx tsx prisma/seed-bidang.ts
```

---

## CATATAN PENTING

- Setelah `npx prisma db push`, schema lama akan ter-migrate otomatis
- Field lama yang tidak ada di schema baru akan dipertahankan selama tidak konflik
- Jika ada error saat push, cek di Neon dashboard apakah ada constraint yang konflik
- `BLOB_READ_WRITE_TOKEN` WAJIB diisi di `.env` dan di Vercel Dashboard sebelum bisa upload foto
- Untuk development lokal, foto upload perlu token yang valid dari Vercel
