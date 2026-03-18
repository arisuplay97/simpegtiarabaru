'use server'
// lib/actions/pegawai.ts — Server actions dengan database Neon

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { put, del } from "@vercel/blob"
import bcrypt from "bcryptjs"

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

// ============ TAMBAH PEGAWAI ============
export async function createEmployee(data: any, fotoFile?: File) {
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

      bidangId: data.bidangId || null,
      jabatan: data.jabatan,
      tipeJabatan: data.tipeJabatan || "STAFF",
      golongan: data.golongan || "",
      pangkat: data.pangkat || "STAFF",
      atasanLangsung: data.atasanLangsung || null,
      status: data.status || "AKTIF",
      sp: data.sp || null,
      tanggalMasuk: new Date(data.tanggalMasuk),

      jenisKelamin: data.jenisKelamin || null,
      tempatLahir: data.tempatLahir || null,
      tanggalLahir: data.tanggalLahir ? new Date(data.tanggalLahir) : null,
      agama: data.agama || null,
      statusNikah: data.statusNikah || null,
      alamat: data.alamat || null,
      npwp: data.npwp || null,

      pendidikanTerakhir: data.pendidikanTerakhir || null,
      jurusan: data.jurusan || null,
      institusi: data.institusi || null,
      tahunLulus: data.tahunLulus || null,

      bank: data.bank || null,
      noRekening: data.noRekening || null,
      bpjsKesehatan: data.bpjsKesehatan || null,
      bpjsKetenagakerjaan: data.bpjsKetenagakerjaan || null,

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
}

// ============ UPDATE PEGAWAI ============
export async function updateEmployee(id: string, data: any, fotoFile?: File) {
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

      bidangId: data.bidangId || null,
      jabatan: data.jabatan,
      tipeJabatan: data.tipeJabatan || "STAFF",
      golongan: data.golongan || "",
      pangkat: data.pangkat || "STAFF",
      atasanLangsung: data.atasanLangsung || null,
      status: data.status || "AKTIF",
      sp: data.sp || null,

      jenisKelamin: data.jenisKelamin || null,
      tempatLahir: data.tempatLahir || null,
      tanggalLahir: data.tanggalLahir ? new Date(data.tanggalLahir) : null,
      agama: data.agama || null,
      statusNikah: data.statusNikah || null,
      alamat: data.alamat || null,
      npwp: data.npwp || null,

      pendidikanTerakhir: data.pendidikanTerakhir || null,
      jurusan: data.jurusan || null,
      institusi: data.institusi || null,
      tahunLulus: data.tahunLulus || null,

      bank: data.bank || null,
      noRekening: data.noRekening || null,
      bpjsKesehatan: data.bpjsKesehatan || null,
      bpjsKetenagakerjaan: data.bpjsKetenagakerjaan || null,
    },
  })

  revalidatePath("/pegawai")
  revalidatePath(`/pegawai/${id}`)
  return employee
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
