# PROMPT REVISI ABSENSI — 3 Fitur Baru
## Batas Checkout, Toggle Bebas Absensi, Binding Lokasi per Pegawai

Jangan ubah file `app/absensi/koreksi/page.tsx`.
Jangan ubah desain/warna yang sudah ada.

---

## LANGKAH 1 — Update `prisma/schema.prisma`

### 1a. Tambah field di model `Pengaturan`
```prisma
model Pengaturan {
  id                String   @id @default("1")
  
  // Absensi — sudah ada
  jamMasuk          String   @default("08:00")
  jamPulang         String   @default("17:00")
  batasTerlambat    Int      @default(15)
  
  // TAMBAH: Batas maksimal checkin (jam berapa cutoff tidak bisa checkin)
  batasCheckin      String   @default("16:00")  // ← TAMBAH
  // Artinya: jam 16.00 ke atas tidak bisa checkin, dilakukan besok
  
  // ... field lain tetap sama
}
```

### 1b. Tambah field di model `Pegawai`
```prisma
model Pegawai {
  // ... field yang sudah ada ...
  
  // TAMBAH: Toggle bebas absensi (hanya superadmin yang bisa set)
  bebasAbsensi      Boolean  @default(false)
  // Kalau true: pegawai bisa absen dari lokasi manapun tanpa validasi GPS
  
  // TAMBAH: Binding lokasi absensi pegawai
  lokasiAbsensiId   String?  // ← TAMBAH — relasi ke LokasiAbsensi
  lokasiAbsensi     LokasiAbsensi? @relation(fields: [lokasiAbsensiId], references: [id])
}
```

### 1c. Tambah relasi di model `LokasiAbsensi`
```prisma
model LokasiAbsensi {
  // ... field yang sudah ada ...
  
  pegawai           Pegawai[]  // ← TAMBAH relasi balik
}
```

Setelah update schema, jalankan:
```bash
npx prisma db push
npx prisma generate
```

---

## LANGKAH 2 — Update `lib/actions/absensi.ts`

Ganti fungsi `checkDeviceAndAbsen` dengan logika baru:

```ts
export async function checkDeviceAndAbsen(
  checkType: "checkin" | "checkout",
  clientDeviceId: string,
  photoDataUrl: string,
  jarakMeter: number | null
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: "Anda belum login." }

    const pegawai = await prisma.pegawai.findUnique({
      where: { userId: session.user.id },
      include: { lokasiAbsensi: true }  // ← include lokasi pegawai
    })

    if (!pegawai) return { error: "Profil Pegawai tidak ditemukan. Hubungi HRD." }

    // =============================================
    // DEVICE BINDING (tetap sama seperti sebelumnya)
    // =============================================
    let currentDeviceId = pegawai.deviceId
    if (!currentDeviceId) {
      await prisma.pegawai.update({
        where: { id: pegawai.id },
        data: { deviceId: clientDeviceId }
      })
      currentDeviceId = clientDeviceId
    }

    if (currentDeviceId !== clientDeviceId && !pegawai.bebasAbsensi) {
      return {
        error: "PERANGKAT TIDAK DIKENALI! Anda hanya bisa absen dari perangkat utama Anda."
      }
    }

    // =============================================
    // AMBIL PENGATURAN JAM
    // =============================================
    const pengaturan = await prisma.pengaturan.findUnique({ where: { id: "1" } })
    
    const jamMasukSetting  = pengaturan?.jamMasuk    || "08:00"
    const jamPulangSetting = pengaturan?.jamPulang   || "17:00"
    const batasCheckin     = pengaturan?.batasCheckin || "16:00"
    const batasTerlambat   = pengaturan?.batasTerlambat || 15

    const { startOfDay, endOfDay, now } = getTodayRange()

    // =============================================
    // FITUR 1: BATAS JAM CHECKIN
    // Jika jam sekarang > batasCheckin → tidak bisa checkin hari ini
    // =============================================
    if (checkType === "checkin") {
      const [batasJam, batasMenit] = batasCheckin.split(":").map(Number)
      const batasCheckinTime = new Date(now)
      batasCheckinTime.setHours(batasJam, batasMenit, 0, 0)

      if (now > batasCheckinTime) {
        return {
          error: `Sudah melewati batas waktu check-in (${batasCheckin}). Silakan absen besok hari kerja.`
        }
      }
    }

    // =============================================
    // CEK ABSENSI HARI INI
    // =============================================
    const absensiHariIni = await prisma.absensi.findFirst({
      where: {
        pegawaiId: pegawai.id,
        tanggal: { gte: startOfDay, lte: endOfDay }
      }
    })

    // =============================================
    // PROSES CHECKIN
    // =============================================
    if (checkType === "checkin") {
      if (absensiHariIni && absensiHariIni.jamMasuk) {
        return { error: "Anda sudah melakukan Check-in hari ini." }
      }

      // Hitung status: HADIR atau TERLAMBAT
      const [jamMasukH, jamMasukM] = jamMasukSetting.split(":").map(Number)
      const batasTerlambatTime = new Date(now)
      batasTerlambatTime.setHours(jamMasukH, jamMasukM + batasTerlambat, 0, 0)

      const statusAbsensi = now > batasTerlambatTime ? "TERLAMBAT" : "HADIR"

      await prisma.absensi.create({
        data: {
          pegawaiId: pegawai.id,
          tanggal: now,
          status: statusAbsensi,
          jamMasuk: now,
        }
      })

      const pesanTerlambat = statusAbsensi === "TERLAMBAT"
        ? ` (Terlambat ${Math.round((now.getTime() - batasTerlambatTime.getTime()) / 60000)} menit)`
        : ""

      return { success: `Check-in berhasil! Status: ${statusAbsensi}${pesanTerlambat}` }

    // =============================================
    // PROSES CHECKOUT
    // =============================================
    } else if (checkType === "checkout") {
      if (!absensiHariIni) {
        return { error: "Anda belum melakukan Check-in hari ini." }
      }
      if (absensiHariIni.jamKeluar) {
        return { error: "Anda sudah melakukan Check-out hari ini." }
      }

      await prisma.absensi.update({
        where: { id: absensiHariIni.id },
        data: { jamKeluar: now }
      })

      return { success: "Check-out berhasil disimpan!" }
    }

    return { error: "Aksi tidak valid" }

  } catch (error: any) {
    console.error("Absen error:", error)
    return { error: `Sistem gagal merekam absensi: ${error.message}` }
  }
}
```

---

## LANGKAH 3 — Update `app/settings/sistem/page.tsx`

Di tab **Absensi**, tambahkan field batas checkin setelah field jamPulang:

```tsx
{/* Jam Masuk & Jam Pulang — sudah ada */}
<div className="grid grid-cols-2 gap-4">
  <div>
    <Label htmlFor="jamMasuk">Jam Masuk</Label>
    <Input type="time" id="jamMasuk" name="jamMasuk" 
      value={formData.jamMasuk} onChange={handleChange} />
    <p className="mt-1 text-xs text-muted-foreground">
      Jam kerja mulai — dasar deteksi keterlambatan
    </p>
  </div>
  <div>
    <Label htmlFor="jamPulang">Jam Pulang</Label>
    <Input type="time" id="jamPulang" name="jamPulang"
      value={formData.jamPulang} onChange={handleChange} />
    <p className="mt-1 text-xs text-muted-foreground">
      Jam kerja selesai — batas minimal checkout
    </p>
  </div>
</div>

{/* TAMBAH: Batas Checkin */}
<div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
  <div className="flex items-start gap-3">
    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
    <div className="flex-1">
      <Label htmlFor="batasCheckin" className="text-amber-800 font-semibold">
        Batas Maksimal Check-in
      </Label>
      <p className="text-xs text-amber-700 mb-2">
        Pegawai tidak bisa check-in setelah jam ini. 
        Harus dilakukan keesokan harinya.
      </p>
      <Input 
        type="time" 
        id="batasCheckin" 
        name="batasCheckin"
        value={formData.batasCheckin || "16:00"} 
        onChange={handleChange}
        className="w-40"
      />
      <p className="mt-1 text-xs text-amber-600">
        Contoh: jika diset 16:00, pegawai yang baru datang 
        jam 16.01 tidak bisa absen hari ini.
      </p>
    </div>
  </div>
</div>

{/* Batas Terlambat — sudah ada */}
<div>
  <Label htmlFor="batasTerlambat">Toleransi Keterlambatan (Menit)</Label>
  <Input type="number" id="batasTerlambat" name="batasTerlambat"
    value={formData.batasTerlambat} onChange={handleChange} />
</div>
```

Pastikan `batasCheckin` ikut tersimpan di `handleSave`:
```ts
const handleSave = async () => {
  const res = await savePengaturan({
    jamMasuk: formData.jamMasuk,
    jamPulang: formData.jamPulang,
    batasCheckin: formData.batasCheckin || "16:00",  // ← TAMBAH
    batasTerlambat: parseInt(formData.batasTerlambat),
    // ... field lain
  })
}
```

---

## LANGKAH 4 — Update Profil Pegawai `app/pegawai/[slug]/page.tsx`

### 4a. Tambah Toggle "Bebas Absensi" — HANYA untuk Superadmin

Di bagian tab **Kepegawaian** atau section pengaturan pegawai, tambahkan:

```tsx
{/* Toggle Bebas Absensi — hanya tampil untuk Superadmin */}
{session?.user?.role === "SUPERADMIN" && (
  <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-orange-800">
          🔓 Izinkan Absensi Bebas Lokasi
        </p>
        <p className="text-xs text-orange-700 mt-1">
          Pegawai ini bisa absen dari lokasi manapun tanpa validasi GPS.
          Gunakan hanya untuk pegawai yang sering bertugas di luar area.
        </p>
        {employee.bebasAbsensi && (
          <p className="text-xs text-red-600 font-medium mt-1">
            ⚠️ Fitur ini aktif — pegawai dapat bypass validasi GPS
          </p>
        )}
      </div>
      <Switch
        checked={employee.bebasAbsensi}
        onCheckedChange={async (checked) => {
          try {
            await updateBebasAbsensi(employee.id, checked)
            setEmployee(prev => ({ ...prev, bebasAbsensi: checked }))
            toast.success(
              checked 
                ? `${employee.nama} diizinkan absen bebas lokasi`
                : `Absensi bebas lokasi ${employee.nama} dinonaktifkan`
            )
          } catch {
            toast.error("Gagal mengubah pengaturan")
          }
        }}
      />
    </div>
  </div>
)}
```

### 4b. Tambah Binding Lokasi Absensi per Pegawai

Di bawah toggle bebas absensi, tambahkan:

```tsx
{/* Binding Lokasi Absensi */}
{session?.user?.role === "SUPERADMIN" && !employee.bebasAbsensi && (
  <div className="rounded-lg border p-4">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-medium">📍 Lokasi Absensi</p>
        <p className="text-xs text-muted-foreground mt-1">
          Pegawai hanya bisa absen di lokasi yang ditentukan.
          Kosongkan untuk mengikuti aturan umum.
        </p>
      </div>
    </div>
    <Select
      value={employee.lokasiAbsensiId || "semua"}
      onValueChange={async (v) => {
        const lokasiId = v === "semua" ? null : v
        try {
          await updateLokasiPegawai(employee.id, lokasiId)
          setEmployee(prev => ({ ...prev, lokasiAbsensiId: lokasiId }))
          toast.success("Lokasi absensi berhasil diperbarui")
        } catch {
          toast.error("Gagal mengubah lokasi")
        }
      }}
    >
      <SelectTrigger className="mt-2">
        <SelectValue placeholder="Pilih lokasi..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="semua">
          🌐 Semua lokasi aktif (default)
        </SelectItem>
        {lokasiList.map(l => (
          <SelectItem key={l.id} value={l.id}>
            {l.tipe === "kantor_pusat" ? "🏢" : "🏬"} {l.nama}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    {employee.lokasiAbsensiId && (
      <div className="mt-2 rounded-lg bg-primary/5 border border-primary/20 p-2">
        <p className="text-xs text-primary font-medium">
          ✓ Pegawai ini HANYA bisa absen di:{" "}
          {lokasiList.find(l => l.id === employee.lokasiAbsensiId)?.nama}
        </p>
      </div>
    )}
  </div>
)}
```

---

## LANGKAH 5 — Tambah Server Actions Baru

Di `lib/actions/pegawai.ts`, tambahkan:

```ts
// Update toggle bebas absensi (superadmin only)
export async function updateBebasAbsensi(pegawaiId: string, bebasAbsensi: boolean) {
  const session = await auth()
  if (session?.user?.role !== "SUPERADMIN") {
    throw new Error("Hanya Superadmin yang bisa mengubah pengaturan ini")
  }
  
  await prisma.pegawai.update({
    where: { id: pegawaiId },
    data: { bebasAbsensi }
  })
  
  revalidatePath(`/pegawai/${pegawaiId}`)
}

// Update lokasi absensi pegawai (superadmin only)
export async function updateLokasiPegawai(pegawaiId: string, lokasiId: string | null) {
  const session = await auth()
  if (session?.user?.role !== "SUPERADMIN") {
    throw new Error("Hanya Superadmin yang bisa mengubah pengaturan ini")
  }
  
  await prisma.pegawai.update({
    where: { id: pegawaiId },
    data: { lokasiAbsensiId: lokasiId }
  })
  
  revalidatePath(`/pegawai/${pegawaiId}`)
}
```

---

## LANGKAH 6 — Update Validasi GPS di `lib/actions/absensi.ts`

### Logika Binding Lokasi per Pegawai

Di fungsi `checkDeviceAndAbsen`, setelah device binding, tambahkan:

```ts
// =============================================
// FITUR 3: VALIDASI LOKASI PER PEGAWAI
// =============================================

// Kalau bebasAbsensi = true → skip semua validasi lokasi
if (!pegawai.bebasAbsensi) {
  
  // Ambil semua lokasi aktif dari database
  const semuaLokasi = await prisma.lokasiAbsensi.findMany({
    where: { aktif: true }
  })
  
  // Tentukan lokasi yang boleh untuk pegawai ini
  let lokasiYangDiizinkan = semuaLokasi.filter(l => l.tipe !== "acara")
  
  // Kalau pegawai punya binding lokasi spesifik
  if (pegawai.lokasiAbsensiId) {
    // Hanya boleh absen di lokasi yang di-assign
    lokasiYangDiizinkan = semuaLokasi.filter(l => l.id === pegawai.lokasiAbsensiId)
  }
  
  // Cek acara wajib hari ini (override semua lokasi)
  const today = new Date().toISOString().split("T")[0]
  const acaraWajib = semuaLokasi.find(l =>
    l.tipe === "acara" && l.aktif && l.wajibHadir &&
    l.tanggalMulai && l.tanggalSelesai &&
    today >= l.tanggalMulai.toISOString().split("T")[0] &&
    today <= l.tanggalSelesai.toISOString().split("T")[0]
  )
  
  if (acaraWajib) {
    // Acara wajib → override semua, harus di lokasi acara
    lokasiYangDiizinkan = [acaraWajib]
  }
  
  // Validasi jarak — pastikan dalam radius salah satu lokasi
  // (Validasi GPS sudah dilakukan di frontend, tapi double check di backend)
  // jarakMeter sudah dikirim dari frontend
  if (jarakMeter === null || jarakMeter === undefined) {
    return { error: "GPS tidak terdeteksi. Aktifkan lokasi dan coba lagi." }
  }
  
  // Cek apakah dalam radius lokasi yang diizinkan
  // (nilai jarakMeter sudah dihitung di frontend berdasarkan lokasi yang sesuai)
  // Kalau jarakMeter dikirim dan tidak null = sudah valid dari frontend
  // Tambahkan flag validasi dari frontend
}
```

---

## RINGKASAN ALUR

### Fitur 1 — Batas Checkin
```
Superadmin set batasCheckin = "16:00" di /settings/sistem
        ↓
Pegawai coba checkin jam 16.05
        ↓
Sistem cek: sekarang > 16:00? → YA
        ↓
❌ "Sudah melewati batas check-in (16:00).
    Silakan absen besok hari kerja."
```

### Fitur 2 — Toggle Bebas Absensi
```
Superadmin buka profil pegawai lapangan
Toggle "Izinkan Absensi Bebas Lokasi" → ON
        ↓
Pegawai ini bisa absen dari manapun
Tidak perlu dalam radius lokasi manapun
GPS tetap tercatat tapi tidak divalidasi
```

### Fitur 3 — Binding Lokasi per Pegawai
```
Superadmin set lokasi pegawai:
"Budi → Kantor Cabang"
        ↓
Budi coba absen di Kantor Pusat
GPS valid di Kantor Pusat
        ↓
❌ Ditolak — "Anda hanya bisa absen 
   di Kantor Cabang "

Budi absen di Kantor Cabang
        ↓
✅ Berhasil
```

---

## CATATAN PENTING

- Toggle bebas absensi hanya tampil untuk role SUPERADMIN
- Pegawai dan HRD tidak bisa lihat atau ubah toggle ini
- Binding lokasi dikosongkan = ikuti aturan umum (semua lokasi aktif)
- Acara wajib tetap override binding lokasi
- Jangan ubah `app/absensi/koreksi/page.tsx`
