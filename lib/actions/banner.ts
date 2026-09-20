"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { put, del } from "@vercel/blob"
import fs from "fs"
import path from "path"

export interface BannerItem {
  id: string
  judul: string | null
  imageUrl: string
  tampilkanSampai: string | null
  aktif: boolean
  urutan: number
  createdAt: string
  updatedAt: string
}

/**
 * Mengambil daftar banner PWA.
 * Jika tabel masih kosong, otomatis mendaftarkan banner default (/op.png).
 * Jika onlyActive = true: hanya yang aktif & belum kedaluwarsa.
 */
export async function getBannersPwa(onlyActive: boolean = false): Promise<BannerItem[]> {
  try {
    // Cek apakah sudah ada banner sama sekali di database
    const count = await prisma.bannerPwa.count()
    if (count === 0) {
      // Seed banner default /op.png sesuai permintaan user agar banner sekarang tetap muncul
      try {
        await prisma.bannerPwa.create({
          data: {
            judul: "Pengingat Absensi Masuk & Pulang",
            imageUrl: "/op.png",
            tampilkanSampai: null,
            aktif: true,
            urutan: 0,
          },
        })
      } catch (seedErr) {
        console.error("Gagal melakukan seed default banner:", seedErr)
      }
    }

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)

    const whereClause: any = {}
    if (onlyActive) {
      whereClause.aktif = true
      whereClause.OR = [
        { tampilkanSampai: null },
        { tampilkanSampai: { gte: startOfToday } },
      ]
    }

    const rows = await prisma.bannerPwa.findMany({
      where: whereClause,
      orderBy: [
        { urutan: "asc" },
        { createdAt: "desc" },
      ],
    })

    return rows.map((r) => ({
      id: r.id,
      judul: r.judul,
      imageUrl: r.imageUrl,
      tampilkanSampai: r.tampilkanSampai ? r.tampilkanSampai.toISOString() : null,
      aktif: r.aktif,
      urutan: r.urutan,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }))
  } catch (error) {
    console.error("Gagal mengambil banner PWA:", error)
    return []
  }
}

/**
 * Upload dan buat banner baru.
 * File sudah dikompresi di sisi browser (WebP), jadi validasi lebih longgar.
 */
export async function createBannerPwa(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user) return { error: "Tidak terautentikasi" }
    const role = (session.user as any).role
    if (!["SUPERADMIN", "HRD", "DIREKSI"].includes(role)) {
      return { error: "Akses ditolak. Hanya Admin, HRD, atau Direksi yang dapat mengunggah banner." }
    }

    const file = formData.get("file") as File | null
    const judul = (formData.get("judul") as string || "").trim()
    const tampilkanSampaiStr = (formData.get("tampilkanSampai") as string || "").trim()

    if (!file || file.size === 0) {
      return { error: "File gambar banner wajib dipilih" }
    }

    // Batas 15MB (sebelum kompresi client, file aslinya bisa besar)
    if (file.size > 15 * 1024 * 1024) {
      return { error: "Ukuran file maksimal 15MB" }
    }

    // Validasi tipe file - terima semua format gambar umum termasuk WebP hasil kompresi
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]
    if (!file.type.startsWith("image/") && !allowedTypes.includes(file.type)) {
      return { error: "Format gambar harus JPG, PNG, WebP, atau GIF" }
    }

    // Parsing tanggal batas tampil
    let tampilkanSampai: Date | null = null
    if (tampilkanSampaiStr) {
      const dateParts = tampilkanSampaiStr.split("-")
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0], 10)
        const month = parseInt(dateParts[1], 10) - 1
        const day = parseInt(dateParts[2], 10)
        tampilkanSampai = new Date(year, month, day, 23, 59, 59, 999)
      } else {
        tampilkanSampai = new Date(tampilkanSampaiStr)
      }
    }

    // Proses upload gambar
    let imageUrl = ""
    const ext = file.name.split(".").pop() || "webp"
    const timestamp = Date.now()

    // Coba upload ke Vercel Blob jika token ada
    const hasBlobToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN)
    if (hasBlobToken) {
      try {
        const blob = await put(`banners/banner-${timestamp}.${ext}`, file, {
          access: "public",
          addRandomSuffix: true,
        })
        imageUrl = blob.url
      } catch (blobErr: any) {
        console.warn("Upload ke Vercel Blob gagal:", blobErr?.message || blobErr)
      }
    }

    // Fallback penyimpanan lokal jika Blob tidak tersedia / gagal
    if (!imageUrl) {
      try {
        const uploadDir = path.join(process.cwd(), "public", "uploads", "banners")
        await fs.promises.mkdir(uploadDir, { recursive: true })
        const localFileName = `banner-${timestamp}.${ext}`
        const localFilePath = path.join(uploadDir, localFileName)
        const arrayBuffer = await file.arrayBuffer()
        await fs.promises.writeFile(localFilePath, Buffer.from(arrayBuffer))
        imageUrl = `/uploads/banners/${localFileName}`
      } catch (localErr: any) {
        console.error("Gagal menyimpan file secara lokal:", localErr?.message || localErr)
        return { error: `Gagal mengunggah gambar banner: ${localErr?.message || "Unknown error"}` }
      }
    }

    const banner = await prisma.bannerPwa.create({
      data: {
        judul: judul || null,
        imageUrl,
        tampilkanSampai,
        aktif: true,
        urutan: 0,
      },
    })

    return { success: true, data: banner }
  } catch (error: any) {
    console.error("Error createBannerPwa:", error)
    return { error: error.message || "Gagal membuat banner" }
  }
}

/**
 * Hapus banner PWA berdasarkan ID.
 */
export async function deleteBannerPwa(id: string) {
  try {
    const session = await auth()
    if (!session?.user) return { error: "Tidak terautentikasi" }
    const role = (session.user as any).role
    if (!["SUPERADMIN", "HRD", "DIREKSI"].includes(role)) {
      return { error: "Akses ditolak" }
    }

    const existing = await prisma.bannerPwa.findUnique({ where: { id } })
    if (!existing) {
      return { error: "Banner tidak ditemukan" }
    }

    // Jika gambar di Vercel Blob, coba hapus
    if (existing.imageUrl.includes("blob.vercel-storage.com")) {
      try {
        await del(existing.imageUrl)
      } catch (delErr) {
        console.warn("Gagal menghapus blob banner:", delErr)
      }
    } else if (existing.imageUrl.startsWith("/uploads/banners/")) {
      try {
        const localPath = path.join(process.cwd(), "public", existing.imageUrl.replace(/^\//, ""))
        await fs.promises.unlink(localPath)
      } catch {}
    }

    await prisma.bannerPwa.delete({ where: { id } })

    return { success: true }
  } catch (error: any) {
    console.error("Error deleteBannerPwa:", error)
    return { error: error.message || "Gagal menghapus banner" }
  }
}

/**
 * Mengubah status aktif/nonaktif banner.
 */
export async function toggleBannerPwa(id: string, aktif: boolean) {
  try {
    const session = await auth()
    if (!session?.user) return { error: "Tidak terautentikasi" }
    const role = (session.user as any).role
    if (!["SUPERADMIN", "HRD", "DIREKSI"].includes(role)) {
      return { error: "Akses ditolak" }
    }

    await prisma.bannerPwa.update({
      where: { id },
      data: { aktif },
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error toggleBannerPwa:", error)
    return { error: error.message || "Gagal mengubah status banner" }
  }
}
