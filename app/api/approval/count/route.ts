import { NextResponse } from "next/server"
import { getPendingApprovalCount } from "@/lib/actions/approval"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const count = await getPendingApprovalCount()
    return NextResponse.json(
      { count },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    )
  } catch (error: any) {
    return NextResponse.json({ count: 0, error: error?.message || "Failed" }, { status: 500 })
  }
}
