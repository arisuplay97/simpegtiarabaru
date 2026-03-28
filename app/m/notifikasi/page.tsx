"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Bell, Loader2 } from "lucide-react"
import { getNotifications, markAllAsRead } from "@/lib/actions/notifikasi"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import Link from "next/link"

export default function MobileNotifikasi() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (status === "authenticated") fetchData()
  }, [status])

  const fetchData = async () => {
    if (!session?.user?.id) return
    const notifs = await getNotifications(session.user.id)
    if (notifs) setList(notifs)
    setLoading(false)
  }

  const handleMarkAll = async () => {
    if (!session?.user?.id) return
    await markAllAsRead(session.user.id)
    setList(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-4 flex items-center">
        <h1 className="text-lg font-bold">Notifikasi</h1>
        {list.some(n => !n.isRead) && (
          <button onClick={handleMarkAll} className="ml-auto text-xs text-primary font-semibold">
            Tandai semua dibaca
          </button>
        )}
      </div>

      <div className="divide-y divide-border">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : list.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Bell className="mx-auto h-10 w-10 mb-3 opacity-30" />
            <p>Belum ada notifikasi</p>
          </div>
        ) : (
          list.map(n => (
            <Link
              key={n.id}
              href={n.link || "#"}
              className={`flex items-start gap-3 px-4 py-4 transition-colors hover:bg-muted ${!n.isRead ? "bg-primary/5" : ""}`}
            >
              <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${n.isRead ? "bg-muted" : "bg-primary/15"}`}>
                <Bell className={`h-4 w-4 ${n.isRead ? "text-muted-foreground" : "text-primary"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium leading-tight ${!n.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                  {n.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>

                <p className="text-[10px] text-muted-foreground mt-1">
                  {format(new Date(n.createdAt), "d MMM yyyy · HH:mm", { locale: idLocale })}
                </p>
              </div>
              {!n.isRead && <div className="mt-2 h-2 w-2 rounded-full bg-primary shrink-0" />}
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
