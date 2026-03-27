'use server'
// lib/actions/pegawai.ts — Server actions dengan database Neon

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { put, del } from "@vercel/blob"
import { auth } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { getAtasanOtomatis, parseTipeJabatan } from "@/lib/data/bidang-store"
import { logAudit } from "./audit-log"

// Helper: map lowercase tipeJabatan to DB enum
const mapTipeJabatan = (val: string): string => {
  const map: Record<string, string> = {
    kepala_bidang: "KEPALA_BIDANG",
    kasubbid: "KASUBBID",
    staff: "STAFF",
    kontrak: "KONTRAK",
    kepala_cabang: "KEPALA_CABANG",
    kasubbid_cabang: "KASUBBID_CABANG",
    staff_cabang: "STAFF_CABANG",
  }
  return map[val?.toLowerCase()] || val || "STAFF"
}

// Helper: map pangkat values to valid TipePangkat enum
const mapPangkat = (val: string): string | null => {
  if (!val || val === "" || val === "NONE") return null
  const map: Record<string, string> = {
    kepala_bidang: "KEPALA_BIDANG",
    kepala_sub_bidang: "KEPALA_SUB_BIDANG",
    staff: "STAFF",
    kontrak: "KONTRAK",
    // Already uppercase values pass through
    KEPALA_BIDANG: "KEPALA_BIDANG",
    KEPALA_SUB_BIDANG: "KEPALA_SUB_BIDANG",
    STAFF: "STAFF",
    KONTRAK: "KONTRAK",
  }
  return map[val] || null
}

// Helper: strip "NONE" and empty-string values → null
const clean = (v: any) => (!v || v === "NONE" || v === "") ? null : v

// Helper: Hapus keys yang valuenya undefined agar Prisma tua di memori tidak complain "Unknown arg"
const stripUndefined = (obj: any) => {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null))
}

// ============ GET SEMUA PEGAWAI ============
export async function getEmployees() {
  const session = await auth()
  if (!session?.user) return []

  const data = await prisma.pegawai.findMany({
    include: { bidang: true, user: { select: { email: true, role: true } } },
    orderBy: { nama: "asc" },
  })

  return data.map(emp => {
    let masaKerja = "-"
    if (emp.tanggalMasuk) {
      const start = new Date(emp.tanggalMasuk)
      const now = new Date()
      let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
      if (now.getDate() < start.getDate()) months-- // Adjust for incomplete month
      if (months < 0) months = 0

      const y = Math.floor(months / 12)
      const m = months % 12

      if (y > 0 && m > 0) masaKerja = `${y} Thn ${m} Bln`
      else if (y > 0) masaKerja = `${y} Thn`
      else if (m > 0) masaKerja = `${m} Bln`
      else masaKerja = "< 1 Bln"
    }
    return { ...emp, masaKerja }
  })
}

// ============ GET SATU PEGAWAI ============
export async function getEmployee(id: string) {
  const session = await auth()
  if (!session?.user) return null

  return await prisma.pegawai.findUnique({
    where: { id },
    include: { bidang: true, user: { select: { email: true, role: true } } },
  })
}

// ============ STATS PEGAWAI ============
export async function getEmployeeStats() {
  const session = await auth()
  if (!session?.user) return { total: 0, aktif: 0, cuti: 0, nonAktif: 0, sp: 0 }

  const [total, aktif, cuti, nonAktif, sp] = await Promise.all([
    prisma.pegawai.count(),
    prisma.pegawai.count({ where: { status: "AKTIF" } }),
    prisma.pegawai.count({ where: { status: "CUTI" } }),
    prisma.pegawai.count({ where: { status: { in: ["NON_AKTIF", "PENSIUN"] } } }),
    prisma.pegawai.count({ where: { sp: { not: null } } }),
  ])
  return { total, aktif, cuti, nonAktif, sp }
}

export async function getPegawaiPageData() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  
  // PROTEKSI AKSES: Pegawai biasa tidak boleh melihat master data
  if ((session.user as any).role === "PEGAWAI") {
    // Cari id pegawai untuk redirect ke profil
    const me = await prisma.pegawai.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    })
    if (me) {
      const { redirect } = await import("next/navigation")
      redirect(`/pegawai/${me.id}`)
    }
    throw new Error("Akses Ditolak")
  }

  const [emps, stats, bid] = await Promise.all([
    getEmployees(),
    getEmployeeStats(),
    getBidang()
  ])
  return { emps, stats, bid }
}

export async function createEmployee(data: any, fotoFile?: File) {
  try {
  // Upload foto jika ada
  let fotoUrl: string | null = null
  if (fotoFile && fotoFile.size > 0) {
    const blob = await put(`pegawai/${data.nik}-${Date.now()}.${fotoFile.name.split(".").pop()}`, fotoFile, {
      access: "public" as any,
    })
    fotoUrl = blob.url
  }

  // Hash password default
  const hashedPassword = await bcrypt.hash(data.password || "123456", 10)

  // Ambil pengaturan untuk saldo cuti default
  const pengaturan = await prisma.pengaturan.findUnique({ where: { id: "1" } })
  const defaultCuti = pengaturan?.jatahCutiTahunan ?? 12

  // --- BUILD PAYLOAD SECARA AMAN ---
  // Field WAJIB — selalu ada
  const payload: any = {
    nik: data.nik,
    nama: data.nama,
    email: data.email,
    jabatan: data.jabatan || "Staff",
    tipeJabatan: mapTipeJabatan(data.tipeJabatan) as any,
    golongan: clean(data.golongan) || "A/I",
    status: data.status || "AKTIF",
    saldoCuti: defaultCuti,
    tanggalMasuk: data.tanggalMasuk ? new Date(data.tanggalMasuk) : new Date(),
    user: {
      create: {
        email: data.email,
        password: hashedPassword,
        role: data.role || "PEGAWAI",
      },
    },
  }

  // Field OPSIONAL — hanya tambahkan jika ada nilai nyata (bukan empty string / NONE / null)
  const optionalStr = (key: string, val: any) => {
    const cleaned = clean(val)
    if (cleaned) payload[key] = cleaned
  }
  const optionalDate = (key: string, val: any) => {
    if (val && val !== "" && val !== "NONE") payload[key] = new Date(val)
  }

  optionalStr("telepon", data.telepon)
  if (fotoUrl) payload.fotoUrl = fotoUrl
  
  // Use 'connect' syntax for relations since we use nested 'user: { create }'
  const cleanBidang = clean(data.bidangId)
  if (cleanBidang) {
    payload.bidang = { connect: { id: cleanBidang } }
  }
  const cleanSubBidang = clean(data.subBidangId)
  if (cleanSubBidang) {
    payload.subBidang = { connect: { id: cleanSubBidang } }
  }
  
  // Map pangkat to valid enum value
  const mappedPangkat = mapPangkat(data.pangkat)
  if (mappedPangkat) payload.pangkat = mappedPangkat
  
  // LOGIKA ATASAN OTOMATIS
  let atasan = clean(data.atasanLangsung)
  const cleanBidangId = clean(data.bidangId)
  if (!atasan && cleanBidangId) {
    // getAtasanOtomatis expects lowercase TipeJabatan, data.tipeJabatan from form is likely lowercase
    atasan = getAtasanOtomatis(data.tipeJabatan as any, cleanBidangId)
  }
  if (atasan) payload.atasanLangsung = atasan

  optionalStr("sp", data.sp)

  // Data Pribadi
  optionalStr("jenisKelamin", data.jenisKelamin)
  optionalStr("tempatLahir", data.tempatLahir)
  optionalDate("tanggalLahir", data.tanggalLahir)
  optionalStr("agama", data.agama)
  optionalStr("statusNikah", data.statusNikah)
  optionalStr("alamat", data.alamat)
  optionalStr("npwp", data.npwp)

  // Pendidikan
  optionalStr("pendidikanTerakhir", data.pendidikanTerakhir)
  optionalStr("jurusan", data.jurusan)
  optionalStr("institusi", data.institusi)
  optionalStr("tahunLulus", data.tahunLulus)

  // Keuangan
  optionalStr("bank", data.bank)
  optionalStr("noRekening", data.noRekening)
  optionalStr("bpjsKesehatan", data.bpjsKesehatan)
  optionalStr("bpjsKetenagakerjaan", data.bpjsKetenagakerjaan)

  const employee = await prisma.pegawai.create({
    data: payload,
  })

  // Auto-create Kontrak jika tipe jabatan = KONTRAK (PKWT / Magang)
  if (data.tipeJabatan === 'KONTRAK') {
    const tanggalMulai = data.tanggalMasuk ? new Date(data.tanggalMasuk) : new Date()
    // Jika ada tanggalKontrakSelesai dari form, gunakan; jika tidak, default 1 tahun
    const tanggalSelesai = data.tanggalKontrakSelesai 
      ? new Date(data.tanggalKontrakSelesai) 
      : new Date(tanggalMulai.getFullYear() + 1, tanggalMulai.getMonth(), tanggalMulai.getDate())
    
    const durasiHari = Math.ceil((tanggalSelesai.getTime() - tanggalMulai.getTime()) / (1000 * 60 * 60 * 24))
    
    await prisma.kontrak.create({
      data: {
        pegawaiId: employee.id,
        tipe: data.tipeKontrak === 'MAGANG' ? 'MAGANG' : 'PKWT',
        tanggalMulai,
        tanggalSelesai,
        durasiHari,
        posisi: data.jabatan || 'Staff Kontrak',
        unitKerja: data.bidangNama || '-',
        status: 'AKTIF',
      }
    })
  }

  await logAudit({
    action: "CREATE",
    module: "pegawai",
    targetId: employee.id,
    targetName: employee.nama,
    newData: employee as any,
  })

  revalidatePath("/pegawai")
  revalidatePath("/kontrak")
  return employee
  } catch (error: any) {
    console.error("PRISMA CREATE ERROR:", error)
    if (error.code === 'P2002') {
      return { error: "NIK atau Email sudah terdaftar dalam sistem." }
    }
    return { error: `Gagal menyimpan: ${error.message}` }
  }
}

export async function updateEmployee(id: string, data: any, fotoFile?: File) {
  try {
  // Get existing data for Audit Log
  const oldData = await prisma.pegawai.findUnique({ where: { id } })

  // Upload foto baru jika ada
  let fotoUrl: string | undefined
  if (fotoFile && fotoFile.size > 0) {
    if (oldData?.fotoUrl) {
      try { await del(oldData.fotoUrl) } catch {}
    }
    const blob = await put(`pegawai/${data.nik}-${Date.now()}.${fotoFile.name.split(".").pop()}`, fotoFile, {
      access: "public" as any,
    })
    fotoUrl = blob.url
  }

  const payload = {
      nik: data.nik,
      nama: data.nama,
      email: data.email,
      telepon: data.telepon || undefined,
      ...(fotoUrl ? { fotoUrl } : {}),

      bidangId: clean(data.bidangId) || undefined,
      subBidangId: clean(data.subBidangId) || undefined,
      jabatan: data.jabatan || "",
      tipeJabatan: mapTipeJabatan(data.tipeJabatan) as any,
      golongan: clean(data.golongan) || "",
      pangkat: mapPangkat(data.pangkat) || undefined,
      atasanLangsung: clean(data.atasanLangsung) || (data.bidangId ? getAtasanOtomatis(data.tipeJabatan as any, data.bidangId as string) : undefined),
      status: data.status,
      sp: clean(data.sp) || undefined,
      tanggalMasuk: data.tanggalMasuk ? new Date(data.tanggalMasuk) : undefined,

      jenisKelamin: clean(data.jenisKelamin) || undefined,
      tempatLahir: clean(data.tempatLahir) || undefined,
      tanggalLahir: data.tanggalLahir ? new Date(data.tanggalLahir) : undefined,
      agama: clean(data.agama) || undefined,
      statusNikah: clean(data.statusNikah) || undefined,
      alamat: clean(data.alamat) || undefined,
      npwp: clean(data.npwp) || undefined,

      pendidikanTerakhir: clean(data.pendidikanTerakhir) || undefined,
      jurusan: clean(data.jurusan) || undefined,
      institusi: clean(data.institusi) || undefined,
      tahunLulus: clean(data.tahunLulus) || undefined,

      bank: clean(data.bank) || undefined,
      noRekening: clean(data.noRekening) || undefined,
      bpjsKesehatan: clean(data.bpjsKesehatan) || undefined,
      bpjsKetenagakerjaan: clean(data.bpjsKetenagakerjaan) || undefined,
  }

  const employee = await prisma.pegawai.update({
    where: { id },
    data: stripUndefined(payload) as any,
  })

  revalidatePath("/pegawai")
  revalidatePath(`/pegawai/${id}`)

  await logAudit({
    action: "UPDATE",
    module: "pegawai",
    targetId: id,
    targetName: employee.nama,
    oldData: oldData as any,
    newData: employee as any,
  })

  return employee
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: "NIK atau Email sudah terdaftar pada pengguna lain." }
    }
    return { error: `Gagal memperbarui: ${error.message}` }
  }
}

// ============ HAPUS PEGAWAI ============
export async function deleteEmployee(id: string) {
  const pegawai = await prisma.pegawai.findUnique({
    where: { id },
    include: { user: true }
  })

  if (!pegawai) return

  // Hapus foto dari Blob
  if (pegawai.fotoUrl) {
    try { await del(pegawai.fotoUrl) } catch {}
  }

  // Karena tidak ada onDelete: Cascade di schema, kita harus hapus manual relasinya
  await (prisma as any).$transaction([
    (prisma as any).absensi.deleteMany({ where: { pegawaiId: id } }),
    (prisma as any).mutasi.deleteMany({ where: { pegawaiId: id } }),
    (prisma as any).cuti.deleteMany({ where: { pegawaiId: id } }),
    (prisma as any).payroll.deleteMany({ where: { pegawaiId: id } }),
    (prisma as any).kPI.deleteMany({ where: { pegawaiId: id } }),
    (prisma as any).slipGaji.deleteMany({ where: { pegawaiId: id } }),
    (prisma as any).pegawaiKeluarga.deleteMany({ where: { pegawaiId: id } }),
    (prisma as any).pegawaiPendidikan.deleteMany({ where: { pegawaiId: id } }),
    (prisma as any).pegawaiJabatan.deleteMany({ where: { pegawaiId: id } }),
    (prisma as any).pegawaiPangkat.deleteMany({ where: { pegawaiId: id } }),
    (prisma as any).pegawaiPelatihan.deleteMany({ where: { pegawaiId: id } }),
    (prisma as any).pegawaiDokumen.deleteMany({ where: { pegawaiId: id } }),
    (prisma as any).kgb.deleteMany({ where: { pegawaiId: id } }),
    (prisma as any).kenaikanPangkat.deleteMany({ where: { pegawaiId: id } }),
    (prisma as any).suratPeringatan.deleteMany({ where: { pegawaiId: id } }),
    (prisma as any).pegawai.delete({ where: { id } }),
  ])
  
  if (pegawai.userId) {
    await prisma.user.delete({ where: { id: pegawai.userId } })
  }

  await logAudit({
    action: "DELETE",
    module: "pegawai",
    targetId: id,
    targetName: pegawai.nama,
    oldData: pegawai as any,
  })

  revalidatePath("/pegawai")
}

// ============ UPLOAD FOTO SAJA ============
export async function uploadFotoPegawai(id: string, formData: FormData) {
  const fotoFile = formData.get("fotoFile") as File
  if (!fotoFile || fotoFile.size === 0) throw new Error("File foto tidak valid")

  const existing = await prisma.pegawai.findUnique({ where: { id }, select: { fotoUrl: true, nik: true } })

  // Hapus foto lama
  if (existing?.fotoUrl) {
    try { await del(existing.fotoUrl) } catch {}
  }

  const blob = await put(
    `pegawai/${existing?.nik}-${Date.now()}.${fotoFile.name.split(".").pop()}`,
    fotoFile,
    { access: "public" }
  )

  await prisma.pegawai.update({
    where: { id },
    data: { fotoUrl: blob.url },
  })

  revalidatePath(`/pegawai/${id}`)
  return blob.url
}

// ============ GET MUTASI ============
export async function getMutasi() {
  return await prisma.mutasi.findMany({
    include: { pegawai: { select: { id: true, nama: true, nik: true } } },
    orderBy: { createdAt: "desc" },
  })
}

// ============ BUAT MUTASI ============
export async function createMutasi(data: any) {
  const mutasi = await prisma.mutasi.create({
    data: {
      pegawaiId: data.pegawaiId,
      type: data.type,
      jabatanAsal: data.jabatanAsal,
      unitAsal: data.unitAsal,
      jabatanTujuan: data.jabatanTujuan,
      unitTujuan: data.unitTujuan,
      alasan: data.alasan,
      tanggalEfektif: new Date(data.tanggalEfektif),
      status: "PENDING",
    },
  })
  revalidatePath("/mutasi")
  return mutasi
}

// ============ APPROVE / REJECT MUTASI ============
export async function updateMutasiStatus(
  id: string,
  status: "APPROVED" | "REJECTED",
  catatan?: string
) {
  const mutasi = await prisma.mutasi.update({
    where: { id },
    data: {
      status,
      catatan: catatan || null,
      nomorSK: status === "APPROVED"
        ? `SK/MUT/${new Date().getFullYear()}/${id.slice(-4).toUpperCase()}`
        : null,
    },
  })

  // Jika approved, update jabatan pegawai
  if (status === "APPROVED") {
    await prisma.pegawai.update({
      where: { id: mutasi.pegawaiId },
      data: {
        jabatan: mutasi.jabatanTujuan,
        // unitKerja akan update via bidang
      },
    })
  }

  revalidatePath("/mutasi")
  return mutasi
}

// ============ GET BIDANG ============
export async function getBidang() {
  return await prisma.bidang.findMany({
    include: { subBidang: { orderBy: { nama: "asc" } } },
    orderBy: { nama: "asc" },
  })
}

// ============ CRUD BIDANG ============
export async function createBidang(data: any) {
  try {
    const bidang = await prisma.bidang.create({ data })
    revalidatePath("/settings/bidang")
    return bidang
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new Error("Nama atau Kode bidang sudah digunakan.")
    }
    throw new Error(`Gagal menyimpan bidang: ${error.message}`)
  }
}

export async function updateBidang(id: string, data: any) {
  try {
    const bidang = await prisma.bidang.update({ where: { id }, data })
    revalidatePath("/settings/bidang")
    return bidang
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new Error("Nama atau Kode bidang sudah digunakan oleh bidang lain.")
    }
    throw new Error(`Gagal memperbarui bidang: ${error.message}`)
  }
}

export async function deleteBidang(id: string) {
  try {
    await prisma.bidang.delete({ where: { id } })
    revalidatePath("/settings/bidang")
  } catch (error: any) {
    if (error.code === 'P2003') {
      throw new Error("Tidak dapat menghapus bidang karena masih digunakan oleh data Pegawai.")
    }
    throw new Error(`Gagal menghapus bidang: ${error.message}`)
  }
}

// ============ CRUD SUB BIDANG ============
export async function createSubBidang(data: { nama: string; bidangId: string }) {
  try {
    const sub = await prisma.subBidang.create({ data })
    revalidatePath("/settings/bidang")
    return sub
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new Error("Nama Sub Bidang ini sudah ada di bidang tersebut.")
    }
    throw new Error(`Gagal menyimpan sub bidang: ${error.message}`)
  }
}

export async function updateSubBidang(id: string, data: { nama: string }) {
  try {
    const sub = await prisma.subBidang.update({ where: { id }, data })
    revalidatePath("/settings/bidang")
    return sub
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new Error("Nama Sub Bidang ini sudah ada di bidang tersebut.")
    }
    throw new Error(`Gagal memperbarui sub bidang: ${error.message}`)
  }
}

export async function deleteSubBidang(id: string) {
  try {
    await prisma.subBidang.delete({ where: { id } })
    revalidatePath("/settings/bidang")
  } catch (error: any) {
    if (error.code === 'P2003') {
      throw new Error("Tidak dapat menghapus sub bidang karena masih digunakan oleh data Pegawai.")
    }
    throw new Error(`Gagal menghapus sub bidang: ${error.message}`)
  }
}

// ============ GET PEGAWAI BERDASARKAN USER ID ============
export async function getEmployeeByUserId(userId: string) {
  if (!userId) return null
  return await prisma.pegawai.findUnique({
    where: { userId },
    include: { bidang: true, user: { select: { email: true, role: true } } },
  })
}

// ============ UPLOAD AVATAR (FORM DATA) ============
export async function uploadAvatar(formData: FormData) {
  const file = formData.get("file") as File
  if (!file) throw new Error("File tidak ditemukan")

  // Ambil session untuk tau ini user mana
  const { auth } = await import("@/lib/auth")
  const session = await auth()
  const userId = (session?.user as any)?.id

  if (!userId) throw new Error("Unauthorized")

  const employee = await prisma.pegawai.findUnique({
    where: { userId },
    select: { id: true, nik: true, fotoUrl: true }
  })

  if (!employee) throw new Error("Pegawai tidak ditemukan")

  // Hapus foto lama jika ada
  if (employee.fotoUrl) {
    try { await del(employee.fotoUrl) } catch {}
  }

  const blob = await put(
    `pegawai/${employee.nik}-${Date.now()}.${file.name.split(".").pop()}`,
    file,
    { access: "public", addRandomSuffix: true }
  )

  await prisma.pegawai.update({
    where: { id: employee.id },
    data: { fotoUrl: blob.url },
  })

  revalidatePath("/pegawai/profil")
  return blob.url
}

// ============ REVISI ABSENSI: FITUR 2 & 3 ============

// Update toggle bebas absensi (superadmin only)
export async function updateBebasAbsensi(pegawaiId: string, bebasAbsensi: boolean) {
  const session = await auth()
  if ((session?.user as any)?.role !== "SUPERADMIN") {
    throw new Error("Hanya Superadmin yang bisa mengubah pengaturan ini")
  }
  
  await prisma.pegawai.update({
    where: { id: pegawaiId },
    data: { bebasAbsensi } as any
  })
  
  revalidatePath(`/pegawai`)
}

// Update lokasi absensi pegawai (superadmin only)
export async function updateLokasiPegawai(pegawaiId: string, lokasiId: string | null) {
  const session = await auth()
  if ((session?.user as any)?.role !== "SUPERADMIN") {
    throw new Error("Hanya Superadmin yang bisa mengubah pengaturan ini")
  }
  
  await prisma.pegawai.update({
    where: { id: pegawaiId },
    data: { lokasiAbsensiId: lokasiId } as any
  })
  
  revalidatePath(`/pegawai`)
}

export async function getSearchSuggestions(query: string) {
  if (!query || query.length < 2) return []

  try {
    const suggestions = await prisma.pegawai.findMany({
      where: {
        OR: [
          { nama: { contains: query, mode: "insensitive" } },
          { nik: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        nama: true,
        nik: true,
        jabatan: true,
        fotoUrl: true,
      },
      take: 8,
    })
    return suggestions
  } catch (error) {
    console.error("Error fetching search suggestions:", error)
    return []
  }
}
