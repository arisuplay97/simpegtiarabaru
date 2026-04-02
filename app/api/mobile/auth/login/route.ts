import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { signMobileToken } from "@/lib/mobile-auth"

/**
 * POST /api/mobile/auth/login
 * Body: { username: string, password: string }
 * Response: { token, user }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ error: "Username dan password wajib diisi" }, { status: 400 })
    }

    const raw = (username as string).toLowerCase().trim()

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: raw, mode: "insensitive" } },
          { email: { equals: `${raw}@tiara.com`, mode: "insensitive" } },
          { email: { startsWith: `${raw}@`, mode: "insensitive" } },
          { pegawai: { nik: raw } }
        ]
      },
      include: { pegawai: { include: { bidang: true } } }
    })

    if (!user || !user.password || !bcrypt.compareSync(password, user.password)) {
      return NextResponse.json({ error: "Username atau password salah" }, { status: 401 })
    }

    const token = await signMobileToken({
      userId: user.id,
      role: user.role,
      pegawaiId: user.pegawai?.id ?? null,
    })

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        nama: user.pegawai?.nama || user.email,
        nik: user.pegawai?.nik,
        jabatan: user.pegawai?.jabatan,
        bidang: user.pegawai?.bidang?.nama,
        fotoUrl: user.pegawai?.fotoUrl,
        role: user.role,
        email: user.email,
      }
    })
  } catch (err: any) {
    console.error("Mobile login error:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
