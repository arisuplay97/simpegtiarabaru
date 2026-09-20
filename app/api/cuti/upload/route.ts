import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { put } from "@vercel/blob"
import fs from "fs"
import path from "path"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "File dokumen / foto surat wajib dipilih." }, { status: 400 })
    }

    // Batasi ukuran maksimal 10MB
    const MAX_SIZE_MB = 10
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ error: `Ukuran file maksimal adalah ${MAX_SIZE_MB}MB.` }, { status: 400 })
    }

    const mimeType = file.type || "image/jpeg"
    const isImage = mimeType.startsWith("image/")
    const isPdf = mimeType === "application/pdf"

    if (!isImage && !isPdf) {
      return NextResponse.json({ error: "Format file harus berupa gambar (JPG, PNG, WebP) atau dokumen PDF." }, { status: 400 })
    }

    const timestamp = Date.now()
    const rawExt = file.name.split(".").pop() || (isPdf ? "pdf" : "jpg")
    const ext = rawExt.toLowerCase()

    let fileUrl = ""

    // 1. Coba Vercel Blob Storage jika token tersedia di environment
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blob = await put(`cuti/surat-${timestamp}.${ext}`, file, {
          access: "public",
          addRandomSuffix: true,
        })
        fileUrl = blob.url
      } catch (blobErr: any) {
        console.warn("Upload ke Vercel Blob gagal, mencoba penyimpanan alternatif:", blobErr?.message || blobErr)
      }
    }

    // 2. Coba penyimpanan lokal di server (public/uploads/cuti)
    if (!fileUrl) {
      try {
        const uploadDir = path.join(process.cwd(), "public", "uploads", "cuti")
        await fs.promises.mkdir(uploadDir, { recursive: true })
        const localFileName = `surat-${timestamp}-${Math.random().toString(36).slice(2, 8)}.${ext}`
        const localFilePath = path.join(uploadDir, localFileName)
        const arrayBuffer = await file.arrayBuffer()
        await fs.promises.writeFile(localFilePath, Buffer.from(arrayBuffer))
        fileUrl = `/uploads/cuti/${localFileName}`
      } catch (localErr: any) {
        console.warn("Penyimpanan lokal tidak tersedia (serverless mode):", localErr?.message || localErr)
      }
    }

    // 3. Fallback pasti sukses: Base64 Data URL
    if (!fileUrl) {
      const arrayBuffer = await file.arrayBuffer()
      const base64Str = Buffer.from(arrayBuffer).toString("base64")
      fileUrl = `data:${mimeType};base64,${base64Str}`
    }

    return NextResponse.json({
      success: true,
      url: fileUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType,
    })
  } catch (err: any) {
    console.error("Error uploading cuti document:", err)
    return NextResponse.json({ error: err.message || "Gagal mengunggah dokumen surat." }, { status: 500 })
  }
}
