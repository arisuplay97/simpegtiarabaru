import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { put } from "@vercel/blob"
import fs from "fs"
import path from "path"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 })
    }

    const contentType = req.headers.get("content-type") || ""
    let imageUrl = ""

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData()
      const file = formData.get("file") as File | null

      if (!file || file.size === 0) {
        return NextResponse.json({ error: "Foto lampiran wajib diambil" }, { status: 400 })
      }

      // Validasi tipe file - gambar atau dokumen PDF
      const mimeType = file.type || ""
      const isImage = mimeType.startsWith("image/")
      const isPdf = mimeType === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
      if (!isImage && !isPdf) {
        return NextResponse.json({ error: "Lampiran harus berupa foto atau dokumen PDF" }, { status: 400 })
      }

      const ext = file.name.split(".").pop() || "jpg"
      const timestamp = Date.now()

      // 1. Coba Vercel Blob jika token ada
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
          const blob = await put(`koreksi/koreksi-${timestamp}.${ext}`, file, {
            access: "public",
            addRandomSuffix: true,
          })
          imageUrl = blob.url
        } catch (blobErr: any) {
          console.warn("Upload Vercel Blob gagal, mencoba penyimpanan lokal:", blobErr?.message)
        }
      }

      // 2. Coba penyimpanan lokal
      if (!imageUrl) {
        try {
          const uploadDir = path.join(process.cwd(), "public", "uploads", "koreksi")
          await fs.promises.mkdir(uploadDir, { recursive: true })
          const localFileName = `koreksi-${timestamp}.${ext}`
          const localFilePath = path.join(uploadDir, localFileName)
          const arrayBuffer = await file.arrayBuffer()
          await fs.promises.writeFile(localFilePath, Buffer.from(arrayBuffer))
          imageUrl = `/uploads/koreksi/${localFileName}`
        } catch (localErr: any) {
          console.warn("Penyimpanan lokal tidak tersedia:", localErr?.message)
        }
      }

      // 3. Fallback Base64
      if (!imageUrl) {
        const arrayBuffer = await file.arrayBuffer()
        const base64Str = Buffer.from(arrayBuffer).toString("base64")
        const mimeType = file.type || "image/jpeg"
        imageUrl = `data:${mimeType};base64,${base64Str}`
      }

    } else if (contentType.includes("application/json")) {
      // Base64 langsung dikirim dari kamera client
      const body = await req.json()
      const { imageBase64 } = body

      if (!imageBase64 || typeof imageBase64 !== "string") {
        return NextResponse.json({ error: "Data foto tidak valid" }, { status: 400 })
      }

      const timestamp = Date.now()
      const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)

      if (matches && matches.length === 3) {
        const mimeType = matches[1]
        const base64Data = matches[2]
        const buffer = Buffer.from(base64Data, "base64")
        const ext = mimeType.split("/")[1] || "jpg"

        // 1. Coba Vercel Blob
        if (process.env.BLOB_READ_WRITE_TOKEN) {
          try {
            const blob = await put(`koreksi/koreksi-${timestamp}.${ext}`, buffer, {
              access: "public",
              contentType: mimeType,
              addRandomSuffix: true,
            })
            imageUrl = blob.url
          } catch (blobErr: any) {
            console.warn("Upload Vercel Blob gagal:", blobErr?.message)
          }
        }

        // 2. Coba penyimpanan lokal
        if (!imageUrl) {
          try {
            const uploadDir = path.join(process.cwd(), "public", "uploads", "koreksi")
            await fs.promises.mkdir(uploadDir, { recursive: true })
            const localFileName = `koreksi-${timestamp}.${ext}`
            const localFilePath = path.join(uploadDir, localFileName)
            await fs.promises.writeFile(localFilePath, buffer)
            imageUrl = `/uploads/koreksi/${localFileName}`
          } catch (localErr: any) {
            console.warn("Penyimpanan lokal gagal:", localErr?.message)
          }
        }

        // 3. Fallback: simpan base64 string
        if (!imageUrl) {
          imageUrl = imageBase64
        }
      } else {
        imageUrl = imageBase64
      }
    } else {
      return NextResponse.json({ error: "Format request tidak didukung" }, { status: 400 })
    }

    return NextResponse.json({ success: true, url: imageUrl })
  } catch (error: any) {
    console.error("API koreksi upload error:", error)
    return NextResponse.json({ error: error?.message || "Gagal mengunggah foto" }, { status: 500 })
  }
}
