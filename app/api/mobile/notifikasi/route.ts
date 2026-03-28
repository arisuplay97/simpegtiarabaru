import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireMobileAuth } from "@/lib/mobile-auth"

export async function GET(req: Request) {
  const auth = await requireMobileAuth(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { userId } = auth.payload

    const notifs = await prisma.notifikasi.findMany({
      where: { userId: userId as string },
      orderBy: { createdAt: "desc" },
      take: 30,
    })

    const unread = notifs.filter(n => !n.isRead).length

    return NextResponse.json({
      data: notifs.map(n => ({
        id: n.id,
        judul: n.title,
        pesan: n.message,
        isRead: n.isRead,
        link: n.link,
        createdAt: n.createdAt,
      })),
      unread
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
