import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { put } from "@vercel/blob"
import { revalidatePath } from "next/cache"
import fs from "fs"
import path from "path"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 })
    }
    const role = (session.user as any).role
    if (!["SUPERADMIN", "HRD", "DIREKSI"].includes(role)) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const judul = (formData.get("judul") as string || "").trim()
    const tampilkanSampaiStr = (formData.get("tampilkanSampai") as string || "").trim()

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "File gambar banner wajib dipilih" }, { status: 400 })
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

    let imageUrl = ""
    const ext = file.name.split(".").pop() || "webp"
    const timestamp = Date.now()

    // 1. Coba Vercel Blob jika token ada
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blob = await put(`banners/banner-${timestamp}.${ext}`, file, {
          access: "public",
          addRandomSuffix: true,
        })
        imageUrl = blob.url
      } catch (blobErr: any) {
        console.warn("Upload ke Vercel Blob gagal, mencoba penyimpanan alternatif:", blobErr?.message || blobErr)
      }
    }

    // 2. Coba penyimpanan lokal
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
        console.warn("Penyimpanan lokal tidak tersedia:", localErr?.message || localErr)
      }
    }

    // 3. Fallback pasti sukses: Base64 data URL
    if (!imageUrl) {
      const arrayBuffer = await file.arrayBuffer()
      const base64Str = Buffer.from(arrayBuffer).toString("base64")
      const mimeType = file.type || "image/webp"
      imageUrl = `data:${mimeType};base64,${base64Str}`
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

    revalidatePath("/pengumuman")
    revalidatePath("/m/dashboard")

    return NextResponse.json({ success: true, data: banner })
  } catch (error: any) {
    console.error("API banner upload error:", error)
    return NextResponse.json({ error: error?.message || "Gagal mengunggah banner" }, { status: 500 })
  }
}
