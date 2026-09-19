import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { saveSubscription, deleteSubscription } from "@/lib/pwa/web-push-server"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    if (!userId) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 })
    }

    const body = await req.json()
    const { subscription } = body

    if (!subscription || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription payload" }, { status: 400 })
    }

    const userAgent = req.headers.get("user-agent") || undefined
    await saveSubscription(userId, subscription, userAgent)

    return NextResponse.json({ success: true, message: "Push subscription registered successfully" })
  } catch (err: any) {
    console.error("Error saving push subscription:", err)
    return NextResponse.json({ error: err.message || "Failed to save subscription" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { endpoint } = body

    if (endpoint) {
      await deleteSubscription(endpoint)
    }

    return NextResponse.json({ success: true, message: "Push subscription removed" })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
