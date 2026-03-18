# PROMPT PERBAIKAN DATA PEGAWAI & PROFIL
## Lengkap dengan kode siap paste

---

## LANGKAH 1 — Buat file `lib/data/pegawai-store.ts`

File ini berisi 12 data dummy pegawai lengkap + tipe data. 
**Tidak bergantung database** — langsung pakai sebagai state lokal.

Buat folder `lib/data/` lalu buat file `pegawai-store.ts` dengan isi:
(lihat file pegawai-store.ts yang sudah disediakan)

Field yang ada per pegawai:
- id, nik, nama, inisial, jabatan, unitKerja, golongan, pangkat
- status (aktif/cuti/non-aktif/pensiun), sp (SP1/SP2/SP3/null)
- email, telepon, jenisKelamin, tempatLahir, tanggalLahir
- agama, statusNikah, alamat, noKTP, npwp
- bank, noRekening, bpjsKesehatan, bpjsKetenagakerjaan
- tanggalMasuk, masaKerja, pendidikanTerakhir, atasanLangsung

Data dummy sudah include:
- 3 pegawai aktif tanpa SP
- 1 pegawai dengan SP1 (Budi Santoso - status cuti)
- 1 pegawai dengan SP2 (Hendra Kusuma)
- 1 pegawai dengan SP3 (Muhammad Faisal)
- 1 pegawai pensiun (Karno Sutrisno)
- 1 pegawai cuti melahirkan (Indah Permatasari)

---

## LANGKAH 2 — Ganti `app/pegawai/page.tsx`

Ganti SELURUH isi file dengan kode dari file `pegawai-page.tsx` yang disediakan.

Fitur yang ada:
- ✅ **12 data pegawai dummy** lengkap (tidak dari database)
- ✅ **Tambah Pegawai** — form Dialog 12 field dengan validasi lengkap
- ✅ **Edit Data** — pre-filled semua field, tombol di dropdown aksi
- ✅ **Hapus** — AlertDialog konfirmasi
- ✅ **Export CSV** — download file .csv dengan BOM
- ✅ **Filter** — by status, unit kerja, dan pencarian nama/NIK/jabatan
- ✅ **Pagination** — 10 per halaman, reset saat filter berubah
- ✅ **Empty state** — saat tidak ada data ditemukan
- ✅ **Badge SP** — SP1 (abu), SP2 (kuning), SP3 (merah) di sebelah nama
- ✅ **Stats card** — Total, Aktif, Cuti, Non-Aktif, Terkena SP
- ✅ **Loading state** — spinner di tombol simpan
- ✅ **Error message** — di bawah field yang tidak valid

---

## LANGKAH 3 — Update `app/pegawai/[id]/page.tsx`

### 3a. Ganti data hardcode dengan import dari store

Tambah import di bagian atas:
```tsx
import { pegawaiData, type Pegawai } from "@/lib/data/pegawai-store"
```

Tambah import `useParams`:
```tsx
import { useParams } from "next/navigation"
```

### 3b. Di dalam komponen, ganti data hardcode dengan dynamic lookup

Cari bagian:
```tsx
export default function EmployeeDetailPage() {
  const [activeTab, setActiveTab] = useState("profil")
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Data pegawai sebagai state agar bisa diedit
  const [employee, setEmployee] = useState({
    id: "1",
    nik: "198501152010011001",
    ...hardcode...
  })
```

Ganti dengan:
```tsx
export default function EmployeeDetailPage() {
  const params = useParams()
  const employeeId = params.id as string

  const [activeTab, setActiveTab] = useState("profil")
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Cari dari store berdasarkan ID
  const found = pegawaiData.find(e => e.id === employeeId)

  const [employee, setEmployee] = useState<Pegawai>(found ?? pegawaiData[0])
  const [formData, setFormData] = useState({ ...employee })
```

### 3c. Tambah field yang mungkin kurang di tampilan profil

Di bagian **Data Pribadi**, pastikan menampilkan field-field ini:
```tsx
// Tambahkan yang belum ada:
<div>
  <p className="text-xs text-muted-foreground">No. KTP</p>
  <p className="font-mono font-medium">{employee.noKTP}</p>
</div>
<div>
  <p className="text-xs text-muted-foreground">Golongan Darah</p>
  <p className="font-medium">{employee.golonganDarah ?? "-"}</p>
</div>
```

### 3d. Update form edit — tambah field SP dan semua field lengkap

Di dalam Dialog edit, pastikan ada Select untuk SP:
```tsx
{/* SP */}
<div>
  <Label>Surat Peringatan (SP)</Label>
  <Select
    value={formData.sp ?? "none"}
    onValueChange={v => handleChange("sp", v === "none" ? null : v)}
  >
    <SelectTrigger className="mt-1"><SelectValue placeholder="Tidak ada SP" /></SelectTrigger>
    <SelectContent>
      <SelectItem value="none">Tidak Ada SP</SelectItem>
      <SelectItem value="SP1">SP-1 (Peringatan Pertama)</SelectItem>
      <SelectItem value="SP2">SP-2 (Peringatan Kedua)</SelectItem>
      <SelectItem value="SP3">SP-3 (Peringatan Ketiga)</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### 3e. Update header profil — tampilkan badge SP

Cari bagian badge status di header:
```tsx
<Badge variant="outline" className={statusConfig[employee.status].className}>
  {statusConfig[employee.status].label}
</Badge>
```

Tambahkan badge SP setelahnya:
```tsx
{employee.sp === "SP1" && <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300">SP-1</Badge>}
{employee.sp === "SP2" && <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">SP-2</Badge>}
{employee.sp === "SP3" && <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">SP-3</Badge>}
```

---

## LANGKAH 4 — Update `app/pegawai/profil/page.tsx`

Halaman ini untuk pegawai melihat profil sendiri. Hubungkan dengan session user.

### 4a. Tambah import useSession
```tsx
import { useSession } from "next-auth/react"
```

### 4b. Di dalam komponen, ganti data hardcode dengan data dari session
```tsx
const { data: session } = useSession()

// Cari data pegawai berdasarkan email session
const sessionUser = session?.user as any
const myData = pegawaiData.find(e => 
  e.email.includes(sessionUser?.name?.split(" ")[0]?.toLowerCase() ?? "")
) ?? pegawaiData[0]

const [profile, setProfile] = useState(myData)
```

### 4c. Pastikan header menampilkan nama dari session
```tsx
<h1 className="text-2xl font-bold">{session?.user?.name ?? profile.nama}</h1>
<p className="text-muted-foreground">{profile.jabatan}</p>
<Badge>{profile.unitKerja}</Badge>
```

### 4d. Pastikan tab Profil menampilkan semua data lengkap
Di tab "Data Pribadi", tampilkan minimal field berikut:
- NIK, Tempat/Tanggal Lahir, Jenis Kelamin, Agama, Status Pernikahan
- Alamat, No. KTP, NPWP
- Golongan, Pangkat, Masa Kerja, Tanggal Masuk
- Bank, No. Rekening, BPJS Kesehatan, BPJS TK
- Email, Telepon

---

## LANGKAH 5 — Update `lib/actions/pegawai.ts`

Tambahkan fallback yang lebih baik agar tidak error ketika database tidak tersambung:

```ts
'use server'

import { pegawaiData } from "@/lib/data/pegawai-store"

export async function getEmployees() {
  // Coba database dulu
  try {
    const { prisma } = await import("@/lib/prisma")
    const data = await prisma.pegawai.findMany({
      include: { user: true },
      orderBy: { nama: 'asc' }
    })
    if (data.length > 0) return data
  } catch (error) {
    console.warn("Database tidak tersambung, menggunakan data lokal")
  }
  // Fallback ke data lokal
  return pegawaiData
}

export async function getEmployeeStats() {
  try {
    const { prisma } = await import("@/lib/prisma")
    const total = await prisma.pegawai.count()
    const aktif = await prisma.pegawai.count({ where: { status: 'aktif' } })
    const cuti = await prisma.pegawai.count({ where: { status: 'cuti' } })
    const nonAktif = await prisma.pegawai.count({ where: { status: { in: ['non-aktif', 'pensiun'] } } })
    return { total, aktif, cuti, nonAktif }
  } catch {
    const { getStats } = await import("@/lib/data/pegawai-store")
    return getStats(pegawaiData)
  }
}

export async function createEmployee(data: any) {
  try {
    const { prisma } = await import("@/lib/prisma")
    const { revalidatePath } = await import("next/cache")
    const employee = await prisma.pegawai.create({
      data: {
        nama: data.nama,
        nip: data.nik,
        email: data.email,
        jabatan: data.jabatan,
        golongan: data.golongan || '-',
        pangkat: data.pangkat || '-',
        unitKerja: data.unitKerja,
        status: data.status,
        tanggalMasuk: new Date(data.tanggalMasuk || Date.now()),
        user: {
          create: {
            email: data.email,
            password: data.password || '123456',
            role: data.role || 'PEGAWAI'
          }
        }
      }
    })
    revalidatePath('/pegawai')
    return employee
  } catch (error) {
    // Kalau DB gagal, return data dummy agar tidak error
    console.warn("Gagal simpan ke DB, data hanya di state lokal")
    return { id: String(Date.now()), ...data }
  }
}
```

---

## CATATAN

- `app/pegawai/page.tsx` sekarang **tidak bergantung database** — semua pakai data lokal dari `lib/data/pegawai-store.ts`
- Data yang ditambah/edit/hapus hanya ada di state (hilang saat refresh) — ini normal untuk tahap dummy
- Saat database sudah tersambung nanti, tinggal ganti `useState(pegawaiData)` dengan `useEffect` yang fetch dari API
- Jangan ubah file `app/absensi/koreksi/page.tsx`
