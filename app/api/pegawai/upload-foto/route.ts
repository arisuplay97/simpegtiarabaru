import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { put, del } from "@vercel/blob"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const pegawaiId = formData.get("pegawaiId") as string
    const fotoFile = formData.get("fotoFile") as File

    if (!pegawaiId || !fotoFile || fotoFile.size === 0) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    }

    // Validasi ukuran file max 2MB
    if (fotoFile.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran file maksimal 2MB" }, { status: 400 })
    }

    // Validasi tipe file
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if (!allowedTypes.includes(fotoFile.type)) {
      return NextResponse.json({ error: "Format file harus JPG, PNG, atau WebP" }, { status: 400 })
    }

    const existing = await prisma.pegawai.findUnique({ 
      where: { id: pegawaiId }, 
      select: { fotoUrl: true, nik: true } 
    })

    if (!existing) {
      return NextResponse.json({ error: "Pegawai tidak ditemukan" }, { status: 404 })
    }

    // Hapus foto lama jika ada
    if (existing.fotoUrl) {
      try { await del(existing.fotoUrl) } catch {}
    }

    const ext = fotoFile.name.split(".").pop() || "jpg"
    const blob = await put(
      `pegawai/${existing.nik}-${Date.now()}.${ext}`,
      fotoFile,
      { access: "public" }
    )

    await prisma.pegawai.update({
      where: { id: pegawaiId },
      data: { fotoUrl: blob.url },
    })

    return NextResponse.json({ url: blob.url })
  } catch (error: any) {
    console.error("Upload foto error:", error)
    return NextResponse.json({ error: error.message || "Gagal upload foto" }, { status: 500 })
  }
}
