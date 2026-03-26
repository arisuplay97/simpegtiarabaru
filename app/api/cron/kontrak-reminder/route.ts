// app/api/cron/kontrak-reminder/route.ts
// Panggil endpoint ini via cron job (Vercel Cron / external scheduler)
// setiap hari jam 08.00 pagi
//
// Setup di vercel.json:
// {
//   "crons": [
//     {
//       "path": "/api/cron/kontrak-reminder",
//       "schedule": "0 1 * * *"  ← jam 08.00 WIB (UTC+7 = 01.00 UTC)
//     }
//   ]
// }

import { NextResponse } from "next/server"
import { cekReminderKontrak } from "@/lib/actions/kontrak"

// Secret key untuk keamanan endpoint cron
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: Request) {
  // Validasi secret key jika ada
  if (CRON_SECRET) {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const result = await cekReminderKontrak()
    return NextResponse.json({
      success: true,
      message: `Reminder kontrak diproses: ${result.processed} kontrak`,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (e: any) {
    console.error("[Cron Kontrak Reminder]", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
