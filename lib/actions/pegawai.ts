'use server'
// lib/actions/pegawai.ts — Server actions dengan database Neon

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { put, del } from "@vercel/blob"
import bcrypt from "bcryptjs"

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

// Helper: strip "NONE" and empty-string values → null
const clean = (v: any) => (!v || v === "NONE" || v === "") ? null : v

// ============ GET SEMUA PEGAWAI ============
export async function getEmployees() {
  return await prisma.pegawai.findMany({
    include: { bidang: true, user: { select: { email: true, role: true } } },
    orderBy: { nama: "asc" },
  })
}

// ============ GET SATU PEGAWAI ============
export async function getEmployee(id: string) {
  return await prisma.pegawai.findUnique({
    where: { id },
    include: { bidang: true, user: { select: { email: true, role: true } } },
  })
}

// ============ STATS PEGAWAI ============
export async function getEmployeeStats() {
  const [total, aktif, cuti, nonAktif, sp] = await Promise.all([
    prisma.pegawai.count(),
    prisma.pegawai.count({ where: { status: "AKTIF" } }),
    prisma.pegawai.count({ where: { status: "CUTI" } }),
    prisma.pegawai.count({ where: { status: { in: ["NON_AKTIF", "PENSIUN"] } } }),
    prisma.pegawai.count({ where: { sp: { not: null } } }),
  ])
  return { total, aktif, cuti, nonAktif, sp }
}

export async function createEmployee(data: any, fotoFile?: File) {
  try {
  // Upload foto jika ada
  let fotoUrl: string | undefined
  if (fotoFile && fotoFile.size > 0) {
    const blob = await put(`pegawai/${data.nik}-${Date.now()}.${fotoFile.name.split(".").pop()}`, fotoFile, {
      access: "public",
    })
    fotoUrl = blob.url
  }

  // Hash password default
  const hashedPassword = await bcrypt.hash(data.password || "123456", 10)

  const employee = await prisma.pegawai.create({
    data: {
      nik: data.nik,
      nama: data.nama,
      email: data.email,
      telepon: data.telepon || null,
      fotoUrl: fotoUrl || null,

      bidangId: clean(data.bidangId) || undefined,
      subBidangId: clean(data.subBidangId) || undefined,
      jabatan: data.jabatan || "",
      tipeJabatan: mapTipeJabatan(data.tipeJabatan) as any,
      golongan: clean(data.golongan) || "",
      pangkat: clean(data.pangkat) || undefined,
      atasanLangsung: clean(data.atasanLangsung) || undefined,
      status: data.status || "AKTIF",
      sp: clean(data.sp) || undefined,
      tanggalMasuk: new Date(data.tanggalMasuk),

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

      user: {
        create: {
          email: data.email,
          password: hashedPassword,
          role: data.role || "PEGAWAI",
        },
      },
    },
  })

  revalidatePath("/pegawai")
  return employee
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: "NIK atau Email sudah terdaftar dalam sistem." }
    }
    return { error: `Gagal menyimpan: ${error.message}` }
  }
}

export async function updateEmployee(id: string, data: any, fotoFile?: File) {
  try {
  // Upload foto baru jika ada
  let fotoUrl: string | undefined
  if (fotoFile && fotoFile.size > 0) {
    // Hapus foto lama jika ada
    const existing = await prisma.pegawai.findUnique({ where: { id }, select: { fotoUrl: true } })
    if (existing?.fotoUrl) {
      try { await del(existing.fotoUrl) } catch {}
    }
    const blob = await put(`pegawai/${data.nik}-${Date.now()}.${fotoFile.name.split(".").pop()}`, fotoFile, {
      access: "public",
    })
    fotoUrl = blob.url
  }

  const employee = await prisma.pegawai.update({
    where: { id },
    data: {
      nama: data.nama,
      telepon: data.telepon || null,
      ...(fotoUrl ? { fotoUrl } : {}),

      bidangId: clean(data.bidangId) || undefined,
      subBidangId: clean(data.subBidangId) || undefined,
      jabatan: data.jabatan || "",
      tipeJabatan: mapTipeJabatan(data.tipeJabatan) as any,
      golongan: clean(data.golongan) || "",
      pangkat: clean(data.pangkat) || undefined,
      atasanLangsung: clean(data.atasanLangsung) || undefined,
      status: data.status,
      sp: clean(data.sp) || undefined,

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
    },
  })

  revalidatePath("/pegawai")
  revalidatePath(`/pegawai/${id}`)
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
    select: { fotoUrl: true, userId: true },
  })

  // Hapus foto dari Blob
  if (pegawai?.fotoUrl) {
    try { await del(pegawai.fotoUrl) } catch {}
  }

  // Hapus pegawai (cascade ke user)
  await prisma.pegawai.delete({ where: { id } })
  await prisma.user.delete({ where: { id: pegawai!.userId } })

  revalidatePath("/pegawai")
}

// ============ UPLOAD FOTO SAJA ============
export async function uploadFotoPegawai(id: string, fotoFile: File) {
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
  const bidang = await prisma.bidang.create({ data })
  revalidatePath("/settings/bidang")
  return bidang
}

export async function updateBidang(id: string, data: any) {
  const bidang = await prisma.bidang.update({ where: { id }, data })
  revalidatePath("/settings/bidang")
  return bidang
}

export async function deleteBidang(id: string) {
  await prisma.bidang.delete({ where: { id } })
  revalidatePath("/settings/bidang")
}

// ============ CRUD SUB BIDANG ============
export async function createSubBidang(data: { nama: string; bidangId: string }) {
  const sub = await prisma.subBidang.create({ data })
  revalidatePath("/settings/bidang")
  return sub
}

export async function updateSubBidang(id: string, data: { nama: string }) {
  const sub = await prisma.subBidang.update({ where: { id }, data })
  revalidatePath("/settings/bidang")
  return sub
}

export async function deleteSubBidang(id: string) {
  await prisma.subBidang.delete({ where: { id } })
  revalidatePath("/settings/bidang")
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
    { access: "public" }
  )

  await prisma.pegawai.update({
    where: { id: employee.id },
    data: { fotoUrl: blob.url },
  })

  revalidatePath("/pegawai/profil")
  return blob.url
}
