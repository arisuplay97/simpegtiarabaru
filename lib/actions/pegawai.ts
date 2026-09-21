'use server'
// lib/actions/pegawai.ts — Server actions dengan database Neon

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { put, del } from "@vercel/blob"
import { auth } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { getAtasanOtomatis, parseTipeJabatan } from "@/lib/data/bidang-store"
import { logAudit } from "./audit-log"
import ExcelJS from "exceljs"
import { normalizeGolonganKey } from "@/lib/utils"
import { daftarPangkat } from "@/lib/constants/pangkat"
import { Readable } from "stream"

// Helper: map lowercase tipeJabatan to DB enum
const mapTipeJabatan = (val: string): string => {
  const map: Record<string, string> = {
    kepala_bidang: "KEPALA_BIDANG",
    kasubbid: "KASUBBID",
    staf_ahli: "STAF_AHLI",
    staff: "STAFF",
    kontrak: "KONTRAK",
    kepala_cabang: "KEPALA_CABANG",
    kasubbid_cabang: "KASUBBID_CABANG",
    staff_cabang: "STAFF_CABANG",
    // Direktur jabatan types — all stored as KEPALA_BIDANG, role handled separately
    direktur_utama: "KEPALA_BIDANG",
    direktur_operasional: "KEPALA_BIDANG",
    direktur_umum: "KEPALA_BIDANG",
    direktur: "KEPALA_BIDANG",
  }
  return map[val?.toLowerCase()] || val || "STAFF"
}

// Helper: expand abbreviations in jabatan (Pjg. → Penjaga)
function normalizeJabatanName(jabatan: string): string {
  if (!jabatan) return ""
  let s = jabatan.trim()
  // Expand "Pjg." / "Pjg" → "Penjaga"
  s = s.replace(/^Pjg\.?\s*/i, "Penjaga ")
  // Clean double spaces
  s = s.replace(/\s+/g, " ").trim()
  return s
}

// Helper: auto-detect tipeJabatan from raw Excel jabatan string
function detectTipeJabatanFromExcel(jabatan: string, bidangName: string): string {
  const lower = (jabatan || "").toLowerCase().trim()
  const isCabangOrPos = (bidangName || "").toLowerCase().match(/cabang|pos/)

  if (lower.includes("kepala bidang") || lower.includes("kepala bagian")) return "KEPALA_BIDANG"
  if (lower.includes("kepala cabang") || lower.includes("kepala pos")) return "KEPALA_CABANG"
  if (lower.startsWith("kasubbid")) return isCabangOrPos ? "KASUBBID_CABANG" : "KASUBBID"
  if (lower.includes("staf ahli") || lower.includes("staff ahli")) return isCabangOrPos ? "STAF_AHLI" : "STAF_AHLI"
  // Default staff — cabang/pos use STAFF_CABANG
  if (isCabangOrPos) return "STAFF_CABANG"
  return "STAFF"
}

// Helper: smart match bidang name from Excel to database bidang list
function smartMatchBidang(excelBidang: string, allBidang: any[]): { bidangId: string | null, subBidangId: string | null } {
  if (!excelBidang) return { bidangId: null, subBidangId: null }
  const rawBid = excelBidang.trim().toLowerCase()

  // 1. Direct match by name/kode/id
  let b = allBidang.find(x =>
    x.id === rawBid ||
    x.nama.toLowerCase() === rawBid ||
    (x.kode && x.kode.toLowerCase() === rawBid)
  )
  if (b) return { bidangId: b.id, subBidangId: null }

  // 2. Partial/fuzzy match ("Praya" → "Cabang Praya", "Bodak" → "Pos Bodak")
  b = allBidang.find(x =>
    x.nama.toLowerCase().includes(rawBid) ||
    rawBid.includes(x.nama.toLowerCase())
  )
  if (b) return { bidangId: b.id, subBidangId: null }

  // 3. Match cabang by kecamatan name ("Praya" → "Cabang Praya")
  b = allBidang.find(x => {
    const cleanName = x.nama.toLowerCase().replace(/^(cabang|pos)\s+/i, "")
    return cleanName === rawBid || rawBid === cleanName
  })
  if (b) return { bidangId: b.id, subBidangId: null }

  // 4. Fuzzy synonym match ("SDM & Umum" ↔ "Umum dan SDM", "Distribusi" ↔ "Transmisi & Distribusi")
  const synonyms: Record<string, string[]> = {
    "sdm": ["umum dan sdm", "sdm & umum", "umum & sdm"],
    "distribusi": ["transmisi & distribusi", "transmisi dan distribusi"],
    "pelayanan": ["hubungan langganan"],
    "it": ["sekretariat perusahaan", "teknologi informasi"],
  }
  for (const [key, aliases] of Object.entries(synonyms)) {
    if (rawBid.includes(key) || aliases.some(a => rawBid.includes(a))) {
      const matchName = aliases[0]
      b = allBidang.find(x => x.nama.toLowerCase() === matchName || x.nama.toLowerCase().includes(matchName))
      if (b) return { bidangId: b.id, subBidangId: null }
    }
  }

  return { bidangId: null, subBidangId: null }
}

// Helper: map tipeJabatan/jabatan to user role
const mapJabatanToRole = (tipeJabatan: string, jabatan: string): string | null => {
  const tj = (tipeJabatan || "").toLowerCase()
  const jab = (jabatan || "").toLowerCase()
  if (tj === "direktur_utama" || jab.includes("direktur utama") || jab.includes("dirut")) return "DIREKSI"
  if (tj === "kepala_cabang" || jab.includes("kepala cabang") || jab.includes("kepala pos")) return "KEPALA_CABANG"
  if (tj === "kepala_bidang" || jab.includes("kepala bidang") || jab.includes("kabid")) return "KEPALA_BIDANG"
  return null
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

// Helper: Hapus keys yang valuenya undefined saja (bukan null) — null harus tetap dikirim ke Prisma untuk bisa menghapus relasi
const stripUndefined = (obj: any) => {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined))
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
        username: data.nik,
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

  // subBidangId selalu disertakan, bisa null (untuk menghapus) atau string valid (untuk mengisi)
  const subBidangIdValue = clean(data.subBidangId) // null jika dikosongkan, string jika dipilih

  const payload = {
      nik: data.nik,
      nama: data.nama,
      email: data.email,
      telepon: data.telepon || undefined,
      ...(fotoUrl ? { fotoUrl } : {}),

      bidangId: clean(data.bidangId) || undefined,
      subBidangId: subBidangIdValue, // biarkan null agar relasi bisa dihapus
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
    include: { user: { select: { id: true, role: true } } },
  })

  // Sinkronkan user.role berdasarkan jabatan baru
  const newRole = mapJabatanToRole(data.tipeJabatan || "", data.jabatan || "")
  if (newRole && (employee as any).user?.role !== newRole) {
    await prisma.user.update({
      where: { id: (employee as any).user.id },
      data: { role: newRole as any },
    })
  }

  revalidatePath("/pegawai")
  revalidatePath(`/pegawai/${id}`)
  revalidatePath("/organisasi")

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
  try {
    const session = await auth()
    if (!session?.user || !["SUPERADMIN", "HRD"].includes((session.user as any).role)) {
      return { error: "Akses ditolak" }
    }

    const pegawai = await prisma.pegawai.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!pegawai) return { error: "Pegawai tidak ditemukan" }

    // Hapus foto dari Blob
    if (pegawai.fotoUrl) {
      try { await del(pegawai.fotoUrl) } catch {}
    }

    // Hapus semua relasi per batch (agar tidak ada FK constraint error)
    const tables = [
      'absensi', 'mutasi', 'cuti', 'payroll', 'kPI', 'slipGaji',
      'pegawaiKeluarga', 'pegawaiPendidikan', 'pegawaiJabatan', 'pegawaiPangkat',
      'pegawaiPelatihan', 'pegawaiDokumen', 'kGB', 'kenaikanPangkat',
      'suratPeringatan', 'lembur', 'jadwalShift', 'notifikasi', 'rewardPoin',
      'auditLog',
    ]

    for (const table of tables) {
      try {
        if ((prisma as any)[table]) {
          await (prisma as any)[table].deleteMany({ where: { pegawaiId: id } })
        }
      } catch (_e) {
        // skip if table not found or no relation
      }
    }

    // Hapus kontrak (field berbeda: pegawaiId)
    try { await (prisma as any).kontrak.deleteMany({ where: { pegawaiId: id } }) } catch {}

    // Hapus pegawai
    await prisma.pegawai.delete({ where: { id } })

    // Hapus user terkait
    if (pegawai.userId) {
      try { await prisma.user.delete({ where: { id: pegawai.userId } }) } catch {}
    }

    await logAudit({
      action: "DELETE",
      module: "pegawai",
      targetId: id,
      targetName: pegawai.nama,
      oldData: pegawai as any,
    })

    revalidatePath("/pegawai")
    return { success: true }
  } catch (error: any) {
    console.error("Delete pegawai error:", error)
    return { error: `Gagal menghapus pegawai: ${error.message}` }
  }
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

// ============ IMPORT EXCEL / CSV PEGAWAI ============

export interface ImportPegawaiItem {
  nik: string
  nama: string
  email?: string | null
  telepon?: string | null
  bidang?: string | null
  subBidang?: string | null
  jabatan?: string | null
  tipeJabatan?: string | null
  golongan?: string | null
  pangkat?: string | null
  tanggalMasuk?: string | Date | null
  status?: string | null
  gajiPokok?: number | string | null
  tunjangan?: number | string | null
  jenisKelamin?: string | null
  tempatLahir?: string | null
  tanggalLahir?: string | Date | null
  agama?: string | null
  statusNikah?: string | null
  alamat?: string | null
  npwp?: string | null
  pendidikanTerakhir?: string | null
  jurusan?: string | null
  institusi?: string | null
  tahunLulus?: string | null
  bank?: string | null
  noRekening?: string | null
  bpjsKesehatan?: string | null
  bpjsKetenagakerjaan?: string | null
  isExisting?: boolean
}

// Helpers untuk sanitasi & mapping enum impor
function parseExcelDate(val: any): Date | null {
  if (!val) return null
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val
  }
  if (typeof val === "number") {
    // Serial number Excel -> JS Date (Dec 30 1899 epoch)
    const date = new Date(Math.round((val - 25569) * 86400 * 1000))
    return isNaN(date.getTime()) ? null : date
  }
  if (typeof val === "string") {
    const s = val.trim()
    if (!s) return null
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) {
      const d = new Date(s)
      return isNaN(d.getTime()) ? null : d
    }
    const parts = s.split(/[\/\-\.]/)
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        const d = new Date(`${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`)
        return isNaN(d.getTime()) ? null : d
      } else if (parts[2].length === 4) {
        const d = new Date(`${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`)
        return isNaN(d.getTime()) ? null : d
      }
    }
    const d = new Date(s)
    return isNaN(d.getTime()) ? null : d
  }
  return null
}

function parseNumber(val: any): number {
  if (typeof val === "number") return val
  if (!val) return 0
  const cleanStr = String(val).replace(/[^0-9\.\-]/g, "")
  const num = parseFloat(cleanStr)
  return isNaN(num) ? 0 : num
}

function mapJenisKelamin(val: any): "L" | "P" | null {
  if (!val) return null
  const s = String(val).trim().toUpperCase()
  if (s.startsWith("P") || s.includes("WANITA") || s.includes("PEREMPUAN")) return "P"
  if (s.startsWith("L") || s.includes("PRIA") || s.includes("LAKI")) return "L"
  return null
}

function mapAgama(val: any) {
  if (!val) return null
  const s = String(val).trim().toUpperCase()
  const valid = ["ISLAM", "KRISTEN", "KATOLIK", "HINDU", "BUDDHA", "KONGHUCU"]
  return valid.includes(s) ? (s as any) : null
}

function mapStatusNikah(val: any) {
  if (!val) return null
  const s = String(val).trim().toUpperCase()
  if (s.includes("BELUM") || s.includes("LAJANG") || s.includes("SINGLE")) return "BELUM_MENIKAH"
  if (s.includes("CERAI") || s.includes("DUDA") || s.includes("JANDA")) return "CERAI"
  if (s.includes("NIKAH") || s.includes("KAWIN") || s.includes("MENIKAH")) return "MENIKAH"
  return null
}

function mapPendidikan(val: any) {
  if (!val) return null
  const s = String(val).trim().toUpperCase().replace(/[^A-Z0-9]/g, "")
  const map: Record<string, string> = {
    SD: "SD",
    SMP: "SMP",
    MTS: "SMP",
    SMA: "SMA",
    SMK: "SMA",
    MA: "SMA",
    SLTA: "SMA",
    D1: "D1",
    D2: "D2",
    D3: "D3",
    D4: "D4",
    S1: "S1",
    SARJANA: "S1",
    S2: "S2",
    MAGISTER: "S2",
    S3: "S3",
    DOKTOR: "S3",
  }
  return (map[s] as any) || null
}

function mapStatusPegawai(val: any): "AKTIF" | "CUTI" | "NON_AKTIF" | "PENSIUN" {
  if (!val) return "AKTIF"
  const s = String(val).trim().toUpperCase()
  if (s.includes("CUTI")) return "CUTI"
  if (s.includes("PENSIUN")) return "PENSIUN"
  if (s.includes("NON") || s.includes("KELUAR") || s.includes("RESIGN")) return "NON_AKTIF"
  return "AKTIF"
}

// Server Action 1: Parse Excel / CSV File dan Kembalikan Preview Terverifikasi
export async function parsePegawaiImportFile(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const file = formData.get("file") as File
  if (!file) throw new Error("Berkas tidak ditemukan")

  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = file.name.toLowerCase()

  const parsedItems: ImportPegawaiItem[] = []

  if (filename.endsWith(".csv")) {
    const text = buffer.toString("utf-8")
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== "")
    if (lines.length < 2) throw new Error("Berkas CSV kosong atau tidak memiliki data")

    // Deteksi delimiter (, atau ;)
    const firstLine = lines[0]
    const delimiter = firstLine.includes(";") && !firstLine.includes(",") ? ";" : ","
    
    // Simple CSV line splitter that handles quotes
    const splitCsvLine = (line: string) => {
      const result: string[] = []
      let cur = ""
      let inQuotes = false
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === delimiter && !inQuotes) {
          result.push(cur.trim().replace(/^"|"$/g, "").replace(/""/g, '"'))
          cur = ""
        } else {
          cur += char
        }
      }
      result.push(cur.trim().replace(/^"|"$/g, "").replace(/""/g, '"'))
      return result
    }

    const headers = splitCsvLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ""))
    
    for (let i = 1; i < lines.length; i++) {
      const cols = splitCsvLine(lines[i])
      if (cols.length === 0 || !cols.some(c => c !== "")) continue

      const rowObj: any = {}
      headers.forEach((h, idx) => {
        rowObj[h] = cols[idx] || ""
      })

      // Skip hint row
      const rawNik = (rowObj.nik || rowObj.noktp || rowObj.ktp || "").replace(/[^0-9A-Za-z]/g, "")
      if (!rawNik || rawNik.length < 4 || (rowObj.nik && rowObj.nik.includes("["))) continue

      parsedItems.push({
        nik: rawNik,
        nama: rowObj.nama || rowObj.namalengkap || rowObj.namakaryawan || "Tanpa Nama",
        email: rowObj.email || rowObj.surel || null,
        telepon: rowObj.telepon || rowObj.nohp || rowObj.hp || rowObj.wa || null,
        bidang: rowObj.bidang || rowObj.bidangcabangpos || rowObj.unitkerja || rowObj.unit || rowObj.cabang || rowObj.pos || rowObj.divisi || null,
        subBidang: rowObj.subbidang || null,
        jabatan: rowObj.jabatan || rowObj.posisi || "Staff",
        tipeJabatan: rowObj.tipejabatan || rowObj.eselon || "STAFF",
        golongan: rowObj.golongan || rowObj.golruang || rowObj.gol || "A/I",
        pangkat: rowObj.pangkat || rowObj.namapangkat || null,
        tanggalMasuk: rowObj.tanggalmasuk || rowObj.tmt || rowObj.tglmasuk || null,
        status: rowObj.status || rowObj.statuspegawai || "AKTIF",
        gajiPokok: parseNumber(rowObj.gajipokok || rowObj.gapok || rowObj.gaji),
        tunjangan: parseNumber(rowObj.tunjangan),
        jenisKelamin: rowObj.jeniskelamin || rowObj.jk || null,
        tempatLahir: rowObj.tempatlahir || rowObj.tmplahir || null,
        tanggalLahir: rowObj.tanggallahir || rowObj.tgllahir || null,
        agama: rowObj.agama || null,
        statusNikah: rowObj.statusnikah || rowObj.statuskawin || null,
        alamat: rowObj.alamat || rowObj.domisili || null,
        npwp: rowObj.npwp || null,
        pendidikanTerakhir: rowObj.pendidikanterakhir || rowObj.jenjangpendidikan || rowObj.pendidikan || rowObj.jenjang || null,
        jurusan: rowObj.jurusan || null,
        institusi: rowObj.institusi || rowObj.universitas || null,
        tahunLulus: rowObj.tahunlulus || null,
        bank: rowObj.bank || rowObj.namabank || null,
        noRekening: rowObj.norekening || rowObj.norek || null,
        bpjsKesehatan: rowObj.bpjskesehatan || null,
        bpjsKetenagakerjaan: rowObj.bpjsketenagakerjaan || rowObj.kpj || null,
      })
    }
  } else {
    // Excel file (.xlsx / .xls) menggunakan streaming reader agar efisien memori
    const stream = Readable.from(buffer)
    const workbookReader = new (ExcelJS as any).stream.xlsx.WorkbookReader(stream, {
      sharedStrings: "cache",
      worksheets: "emit",
    })

    const getCellValue = (val: any): string => {
      if (val === null || val === undefined) return ""
      if (typeof val === "object") {
        if (val instanceof Date) return val.toISOString().split("T")[0]
        if (val.text) return String(val.text).trim()
        if (val.result !== undefined) return String(val.result).trim()
        if (Array.isArray(val.richText)) return val.richText.map((t: any) => t.text || "").join("").trim()
      }
      return String(val).trim()
    }

    // Iterasi lembar kerja (worksheet)
    for await (const worksheet of workbookReader) {
      // Jika data sudah ditemukan di sheet sebelumnya, lewati sheet berikutnya
      if (parsedItems.length > 0) {
        for await (const _ of worksheet) {}
        continue
      }

      let headerRowIndex = -1
      let colMap: Record<string, number> = {}
      let emptyRowCount = 0
      let rowNum = 0

      for await (const row of worksheet) {
        rowNum++

        // Cari baris header di 15 baris pertama
        if (headerRowIndex === -1) {
          if (rowNum > 15) {
            // Bukan sheet data tabel pegawai, lewati
            break
          }
          const potentialCols: Record<string, number> = {}
          row.eachCell((cell: any, colNum: number) => {
            const text = getCellValue(cell.value).toLowerCase().replace(/[^a-z0-9]/g, "")
            if (text) potentialCols[text] = colNum
          })
          if (
            potentialCols["nik"] ||
            potentialCols["noktp"] ||
            potentialCols["nama"] ||
            potentialCols["namalengkap"] ||
            potentialCols["namapegawai"]
          ) {
            headerRowIndex = rowNum
            colMap = potentialCols
          }
          continue
        }

        const findCol = (...aliases: string[]): number | undefined => {
          for (const a of aliases) {
            const cleanA = a.toLowerCase().replace(/[^a-z0-9]/g, "")
            if (colMap[cleanA] !== undefined) return colMap[cleanA]
          }
          return undefined
        }

        const nikCol = findCol("nik", "no_ktp", "noktp", "ktp", "nomorinduk", "nomorindukkependudukan")
        const namaCol = findCol("namapegawai", "nama", "namalengkap", "namakaryawan", "name")
        const emailCol = findCol("email", "surel", "mail")
        const telpCol = findCol("telepon", "notelp", "nohp", "hp", "whatsapp", "wa", "phone", "kontak")
        const bidangCol = findCol("bidangcabangpos", "bidang", "cabang", "pos", "bidangcabang", "unitkerja", "unit", "divisi", "departemen", "bagian")
        const subBidangCol = findCol("subbidang", "subbagian", "seksi")
        const jabatanCol = findCol("jabatan", "posisi", "role", "pekerjaan")
        const tipeJabatanCol = findCol("tipejabatan", "tipe_jabatan", "eselon", "level")
        const golCol = findCol("golruang", "golongan", "gol", "ruang", "grade")
        const pangkatCol = findCol("pangkat", "namapangkat")
        const tmtCol = findCol("tanggalmasuk", "tmt", "tmtmasuk", "tmtkerja", "tglmasuk", "mulaikerja", "hiredate", "joindate")
        const statusCol = findCol("statuspegawai", "status", "statuskerja")
        const gapokCol = findCol("gajipokok", "gapok", "gaji", "basicsalary")
        const tunjanganCol = findCol("tunjangan", "allowance")
        const jkCol = findCol("jeniskelamin", "jk", "gender", "sex")
        const tmpLahirCol = findCol("tempatlahir", "tmplahir", "kotalahir", "pob")
        const tglLahirCol = findCol("tanggallahir", "tgllahir", "dob", "birthdate")
        const agamaCol = findCol("agama", "religion")
        const nikahCol = findCol("statusnikah", "statuskawin", "statuspernikahan", "maritalstatus")
        const alamatCol = findCol("alamat", "alamattinggal", "domisili", "address")
        const npwpCol = findCol("npwp", "nonpwp", "nomornpwp")
        const pendCol = findCol("jenjangpendidikan", "pendidikanterakhir", "pendidikan", "tingkatpendidikan", "jenjang")
        const jurusanCol = findCol("jurusan", "prodi", "programstudi")
        const instCol = findCol("institusi", "sekolah", "universitas", "kampus")
        const lulusCol = findCol("tahunlulus", "thnlulus")
        const bankCol = findCol("bank", "namabank")
        const norekCol = findCol("norekening", "nomorrekening", "norek")
        const bpjsKesCol = findCol("bpjskesehatan", "nobpjs", "bpjskes")
        const bpjsTkCol = findCol("bpjsketenagakerjaan", "kpj", "bpjstk")

        const rawNikCell = nikCol ? row.getCell(nikCol).value : null
        const rawNik = getCellValue(rawNikCell).replace(/[^0-9A-Za-z]/g, "")
        const rawNama = namaCol ? getCellValue(row.getCell(namaCol).value) : ""

        // Early break jika menemukan baris kosong berturut-turut
        if (!rawNik && !rawNama) {
          emptyRowCount++
          if (emptyRowCount > 20) {
            break // Selesai membaca baris data di sheet ini
          }
          continue
        }
        emptyRowCount = 0

        // Lewati baris kosong, header berulang, atau hint/petunjuk
        if (!rawNik || rawNik.length < 4 || getCellValue(rawNikCell).includes("[") || rawNama.toLowerCase() === "nama pegawai") continue
        if (!rawNama || rawNama.includes("[")) continue

        const rawTmt = tmtCol ? row.getCell(tmtCol).value : null
        const parsedTmt = parseExcelDate(rawTmt)

        const rawTglLahir = tglLahirCol ? row.getCell(tglLahirCol).value : null
        const parsedTglLahir = parseExcelDate(rawTglLahir)

        parsedItems.push({
          nik: rawNik,
          nama: rawNama,
          email: emailCol ? getCellValue(row.getCell(emailCol).value) || null : null,
          telepon: telpCol ? getCellValue(row.getCell(telpCol).value) || null : null,
          bidang: bidangCol ? getCellValue(row.getCell(bidangCol).value) || null : null,
          subBidang: subBidangCol ? getCellValue(row.getCell(subBidangCol).value) || null : null,
          jabatan: jabatanCol ? getCellValue(row.getCell(jabatanCol).value) || "Staff" : "Staff",
          tipeJabatan: tipeJabatanCol ? getCellValue(row.getCell(tipeJabatanCol).value) || "STAFF" : "STAFF",
          golongan: golCol ? getCellValue(row.getCell(golCol).value) || "A/I" : "A/I",
          pangkat: pangkatCol ? getCellValue(row.getCell(pangkatCol).value) || null : null,
          tanggalMasuk: parsedTmt ? parsedTmt.toISOString().split("T")[0] : null,
          status: statusCol ? getCellValue(row.getCell(statusCol).value) || "AKTIF" : "AKTIF",
          gajiPokok: gapokCol ? parseNumber(row.getCell(gapokCol).value) : 0,
          tunjangan: tunjanganCol ? parseNumber(row.getCell(tunjanganCol).value) : 0,
          jenisKelamin: jkCol ? getCellValue(row.getCell(jkCol).value) || null : null,
          tempatLahir: tmpLahirCol ? getCellValue(row.getCell(tmpLahirCol).value) || null : null,
          tanggalLahir: parsedTglLahir ? parsedTglLahir.toISOString().split("T")[0] : null,
          agama: agamaCol ? getCellValue(row.getCell(agamaCol).value) || null : null,
          statusNikah: nikahCol ? getCellValue(row.getCell(nikahCol).value) || null : null,
          alamat: alamatCol ? getCellValue(row.getCell(alamatCol).value) || null : null,
          npwp: npwpCol ? getCellValue(row.getCell(npwpCol).value) || null : null,
          pendidikanTerakhir: pendCol ? getCellValue(row.getCell(pendCol).value) || null : null,
          jurusan: jurusanCol ? getCellValue(row.getCell(jurusanCol).value) || null : null,
          institusi: instCol ? getCellValue(row.getCell(instCol).value) || null : null,
          tahunLulus: lulusCol ? getCellValue(row.getCell(lulusCol).value) || null : null,
          bank: bankCol ? getCellValue(row.getCell(bankCol).value) || null : null,
          noRekening: norekCol ? getCellValue(row.getCell(norekCol).value) || null : null,
          bpjsKesehatan: bpjsKesCol ? getCellValue(row.getCell(bpjsKesCol).value) || null : null,
          bpjsKetenagakerjaan: bpjsTkCol ? getCellValue(row.getCell(bpjsTkCol).value) || null : null,
        })
      }
    }
  }

  if (parsedItems.length === 0) {
    throw new Error("Tidak ada data pegawai yang valid ditemukan di dalam berkas")
  }

  // Cek NIK mana saja yang sudah terdaftar di sistem
  const existingRecords = await prisma.pegawai.findMany({
    where: {
      nik: { in: parsedItems.map(p => p.nik) }
    },
    select: { nik: true, nama: true }
  })
  const existingSet = new Set(existingRecords.map(r => r.nik))

  const enrichedItems = parsedItems.map(item => ({
    ...item,
    isExisting: existingSet.has(item.nik)
  }))

  return {
    success: true,
    total: enrichedItems.length,
    newCount: enrichedItems.filter(i => !i.isExisting).length,
    existingCount: enrichedItems.filter(i => i.isExisting).length,
    items: enrichedItems,
    preview: enrichedItems.slice(0, 10),
  }
}

// Server Action 2: Eksekusi Import Batch dengan Smart Upsert & Akun Otomatis
export async function importPegawaiBatch(items: ImportPegawaiItem[]) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const userRole = (session.user as any).role
  if (userRole === "PEGAWAI") throw new Error("Akses Ditolak: Hanya Administrator dan HRD yang berhak mengimpor data")

  if (!items || items.length === 0) {
    return { success: false, error: "Tidak ada data yang dikirim untuk diimport" }
  }

  // Ambil data referensi
  const [allBidang, allStandar, pengaturan] = await Promise.all([
    prisma.bidang.findMany({ include: { subBidang: true } }),
    prisma.standarGajiPangkat.findMany(),
    prisma.pengaturan.findUnique({ where: { id: "1" } })
  ])

  const defaultCuti = pengaturan?.jatahCutiTahunan ?? 12
  const defaultPasswordHash = await bcrypt.hash("123456", 10)

  // Map standar gaji berdasarkan golongan & pangkat
  const standarMap: Record<string, number> = {}
  allStandar.forEach(s => {
    standarMap[normalizeGolonganKey(s.golongan)] = Number(s.gajiPokok)
    standarMap[s.golongan.toUpperCase().trim()] = Number(s.gajiPokok)
    if (s.pangkat) standarMap[s.pangkat.toLowerCase().trim()] = Number(s.gajiPokok)
  })

  let createdCount = 0
  let updatedCount = 0
  const errors: { nik: string; nama: string; reason: string }[] = []

  for (const item of items) {
    const cleanNik = String(item.nik || "").replace(/[^0-9A-Za-z]/g, "").trim()
    if (!cleanNik) {
      errors.push({ nik: "-", nama: item.nama || "-", reason: "NIK kosong atau tidak valid" })
      continue
    }

    try {
      const normGol = normalizeGolonganKey(item.golongan) || "A/I"
      const defaultPangkatItem = daftarPangkat.find(p => normalizeGolonganKey(p.golongan) === normGol)
      const targetPangkat = item.pangkat?.trim() || defaultPangkatItem?.nama || "Juru Muda"

      // Resolusi gaji pokok
      let targetGajiPokok = typeof item.gajiPokok === "number" ? item.gajiPokok : parseNumber(item.gajiPokok)
      if (targetGajiPokok <= 0) {
        targetGajiPokok = standarMap[normGol] || (targetPangkat ? standarMap[targetPangkat.toLowerCase()] : 0) || 0
      }

      const targetTunjangan = typeof item.tunjangan === "number" ? item.tunjangan : parseNumber(item.tunjangan)

      // Normalize jabatan: expand "Pjg." → "Penjaga"
      const normalizedJabatan = normalizeJabatanName(item.jabatan || "Staff")

      // Resolusi Bidang & SubBidang — menggunakan smart matching
      const matchResult = smartMatchBidang(item.bidang || "", allBidang)
      let matchedBidangId = matchResult.bidangId
      let matchedSubBidangId = matchResult.subBidangId

      // Match sub bidang jika disediakan atau otomatis dari nama jabatan
      if (matchedBidangId) {
        const b = allBidang.find(x => x.id === matchedBidangId)
        if (b && Array.isArray(b.subBidang) && b.subBidang.length > 0) {
          if (item.subBidang) {
            const rawSub = item.subBidang.trim().toLowerCase()
            const sb = b.subBidang.find((s: any) => s.nama.toLowerCase().includes(rawSub) || rawSub.includes(s.nama.toLowerCase()))
            if (sb) matchedSubBidangId = sb.id
          }
          if (!matchedSubBidangId) {
            const rawJab = normalizedJabatan.toLowerCase()
            const sb = b.subBidang.find((s: any) => rawJab.includes(s.nama.toLowerCase()))
            if (sb) matchedSubBidangId = sb.id
          }
        }
      }

      // Auto-detect tipeJabatan from jabatan name if not explicitly set or is generic
      const matchedBidangName = matchedBidangId ? (allBidang.find(x => x.id === matchedBidangId)?.nama || "") : ""
      let resolvedTipeJabatan = item.tipeJabatan || ""
      if (!resolvedTipeJabatan || resolvedTipeJabatan === "STAFF") {
        resolvedTipeJabatan = detectTipeJabatanFromExcel(normalizedJabatan, matchedBidangName)
      }

      const parsedTanggalMasuk = parseExcelDate(item.tanggalMasuk) || new Date()
      const parsedTanggalLahir = parseExcelDate(item.tanggalLahir)

      // Cek apakah pegawai dengan NIK ini sudah ada
      const existing = await prisma.pegawai.findUnique({
        where: { nik: cleanNik }
      })

      if (existing) {
        // SMART UPDATE: Perbarui data tanpa menghapus riwayat atau relasi yang sudah ada
        const updatePayload: any = {
          nama: item.nama?.trim() || existing.nama,
          jabatan: normalizedJabatan || existing.jabatan,
          tipeJabatan: mapTipeJabatan(resolvedTipeJabatan || existing.tipeJabatan) as any,
          golongan: normGol,
          pangkat: targetPangkat,
        }

        if (item.telepon) updatePayload.telepon = item.telepon.trim()
        if (matchedBidangId) updatePayload.bidangId = matchedBidangId
        if (matchedSubBidangId) updatePayload.subBidangId = matchedSubBidangId
        if (targetGajiPokok > 0) updatePayload.gajiPokok = targetGajiPokok
        if (targetTunjangan > 0) updatePayload.tunjangan = targetTunjangan
        if (item.status) updatePayload.status = mapStatusPegawai(item.status)
        if (item.tanggalMasuk) updatePayload.tanggalMasuk = parsedTanggalMasuk

        // Data pribadi & keluarga (jika disediakan dalam excel)
        if (item.jenisKelamin) updatePayload.jenisKelamin = mapJenisKelamin(item.jenisKelamin)
        if (item.tempatLahir) updatePayload.tempatLahir = item.tempatLahir.trim()
        if (parsedTanggalLahir) updatePayload.tanggalLahir = parsedTanggalLahir
        if (item.agama) updatePayload.agama = mapAgama(item.agama)
        if (item.statusNikah) updatePayload.statusNikah = mapStatusNikah(item.statusNikah)
        if (item.alamat) updatePayload.alamat = item.alamat.trim()
        if (item.npwp) updatePayload.npwp = item.npwp.trim()

        // Pendidikan
        if (item.pendidikanTerakhir) updatePayload.pendidikanTerakhir = mapPendidikan(item.pendidikanTerakhir)
        if (item.jurusan) updatePayload.jurusan = item.jurusan.trim()
        if (item.institusi) updatePayload.institusi = item.institusi.trim()
        if (item.tahunLulus) updatePayload.tahunLulus = item.tahunLulus.trim()

        // Keuangan
        if (item.bank) updatePayload.bank = item.bank.trim()
        if (item.noRekening) updatePayload.noRekening = item.noRekening.trim()
        if (item.bpjsKesehatan) updatePayload.bpjsKesehatan = item.bpjsKesehatan.trim()
        if (item.bpjsKetenagakerjaan) updatePayload.bpjsKetenagakerjaan = item.bpjsKetenagakerjaan.trim()

        await prisma.pegawai.update({
          where: { id: existing.id },
          data: updatePayload,
        })

        // Pastikan ada riwayat pangkat awal jika belum ada
        const existingPangkat = await prisma.pegawaiPangkat.findFirst({
          where: { pegawaiId: existing.id }
        })
        if (!existingPangkat) {
          await prisma.pegawaiPangkat.create({
            data: {
              pegawaiId: existing.id,
              pangkat: targetPangkat,
              golongan: normGol,
              tanggalBerlaku: parsedTanggalMasuk,
              nomorSK: `SK-AWAL-${cleanNik.slice(-4)}`,
            }
          })
        }

        updatedCount++
      } else {
        // BARU: Buat User Login dan Pegawai
        let email = item.email?.trim()
        if (!email) {
          email = `${cleanNik}@tiara.id`
        }

        // Cek jika email atau username sudah digunakan user lain
        let userId: string
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email },
              { username: cleanNik },
            ]
          }
        })
        if (existingUser) {
          userId = existingUser.id
          if (!existingUser.username) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { username: cleanNik }
            })
          }
        } else {
          const role = mapJabatanToRole(resolvedTipeJabatan || "STAFF", normalizedJabatan || "Staff") || "PEGAWAI"
          const newUser = await prisma.user.create({
            data: {
              email,
              username: cleanNik,
              password: defaultPasswordHash,
              role: role as any,
            }
          })
          userId = newUser.id
        }

        const newEmp = await prisma.pegawai.create({
          data: {
            nik: cleanNik,
            nama: item.nama?.trim() || "Pegawai Baru",
            email,
            telepon: clean(item.telepon),
            jabatan: normalizedJabatan || "Staff",
            tipeJabatan: mapTipeJabatan(resolvedTipeJabatan || "STAFF") as any,
            golongan: normGol,
            pangkat: targetPangkat,
            gajiPokok: targetGajiPokok,
            tunjangan: targetTunjangan,
            status: mapStatusPegawai(item.status),
            saldoCuti: defaultCuti,
            tanggalMasuk: parsedTanggalMasuk,
            bidangId: matchedBidangId,
            subBidangId: matchedSubBidangId,
            userId,
            // Data pribadi
            jenisKelamin: mapJenisKelamin(item.jenisKelamin),
            tempatLahir: clean(item.tempatLahir),
            tanggalLahir: parsedTanggalLahir,
            agama: mapAgama(item.agama),
            statusNikah: mapStatusNikah(item.statusNikah),
            alamat: clean(item.alamat),
            npwp: clean(item.npwp),
            // Pendidikan
            pendidikanTerakhir: mapPendidikan(item.pendidikanTerakhir),
            jurusan: clean(item.jurusan),
            institusi: clean(item.institusi),
            tahunLulus: clean(item.tahunLulus),
            // Keuangan
            bank: clean(item.bank),
            noRekening: clean(item.noRekening),
            bpjsKesehatan: clean(item.bpjsKesehatan),
            bpjsKetenagakerjaan: clean(item.bpjsKetenagakerjaan),
          }
        })

        // Otomatis masukkan riwayat pangkat awal agar tracking KGB dan Kenaikan Pangkat langsung sinkron
        await prisma.pegawaiPangkat.create({
          data: {
            pegawaiId: newEmp.id,
            pangkat: targetPangkat,
            golongan: normGol,
            tanggalBerlaku: parsedTanggalMasuk,
            nomorSK: `SK-AWAL-${cleanNik.slice(-4)}`,
          }
        })

        createdCount++
      }
    } catch (err: any) {
      console.error(`Error import NIK ${cleanNik}:`, err)
      errors.push({
        nik: cleanNik,
        nama: item.nama || "-",
        reason: err.message || "Gagal memproses data"
      })
    }
  }

  await logAudit({
    action: "IMPORT",
    module: "pegawai",
    targetName: `Import Data Pegawai: ${createdCount} baru, ${updatedCount} diperbarui`,
    newData: { total: items.length, created: createdCount, updated: updatedCount, errorsCount: errors.length } as any,
  })

  revalidatePath("/pegawai")
  revalidatePath("/payroll")
  revalidatePath("/kenaikan-pangkat")
  revalidatePath("/kgb")

  return {
    success: true,
    total: items.length,
    created: createdCount,
    updated: updatedCount,
    failed: errors,
  }
}
