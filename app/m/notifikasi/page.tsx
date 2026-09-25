"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Bell, Loader2, ArrowLeft, CheckCheck } from "lucide-react"
import { getNotifications, markAllAsRead } from "@/lib/actions/notifikasi"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function MobileNotifikasi() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      if (typeof window !== "undefined" && !navigator.onLine) return
      router.push("/login")
    }
    if (status === "authenticated") fetchData()
  }, [status])

  const fetchData = async () => {
    if (!session?.user?.id) return
    try {
      const notifs = await getNotifications(session.user.id)
      if (notifs) setList(notifs)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAll = async () => {
    if (!session?.user?.id) return
    await markAllAsRead(session.user.id)
    setList(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] pb-24 font-sans">
      {/* Header */}
      <div 
        className="sticky top-0 z-20 bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 px-4 py-3 flex items-center justify-between shadow-2xs"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <div className="flex items-center gap-2.5">
          <Link 
            href="/m/dashboard"
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Notifikasi</h1>
        </div>

        {list.some(n => !n.isRead) && (
          <button 
            onClick={handleMarkAll} 
            className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white font-semibold py-1 px-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 transition-colors"
          >
            <CheckCheck className="h-3.5 w-3.5" /> Tandai Dibaca
          </button>
        )}
      </div>

      {/* List */}
      <div className="divide-y divide-zinc-200/60 dark:divide-zinc-800/80 max-w-md mx-auto">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-zinc-400" />
          </div>
        ) : list.length === 0 ? (
          <div className="py-20 text-center text-zinc-400 dark:text-zinc-500">
            <Bell className="mx-auto h-10 w-10 mb-2.5 opacity-25 stroke-[1.5]" />
            <p className="text-sm font-medium">Belum ada notifikasi</p>
          </div>
        ) : (
          list.map(n => (
            <Link
              key={n.id}
              href={n.link || "#"}
              className={cn(
                "flex items-start gap-3.5 px-4 py-3.5 transition-colors hover:bg-zinc-100/50 dark:hover:bg-zinc-850",
                !n.isRead ? "bg-white dark:bg-zinc-900/60" : "bg-zinc-50/50 dark:bg-transparent"
              )}
            >
              <div className={cn(
                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border",
                !n.isRead 
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent shadow-2xs" 
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200/60 dark:border-zinc-700"
              )}>
                <Bell className="h-4 w-4" />
              </div>

              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-bold leading-snug",
                  !n.isRead ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400"
                )}>
                  {n.title}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed break-words">
                  {n.message}
                </p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1.5 tabular-nums">
                  {format(new Date(n.createdAt), "d MMM yyyy · HH:mm", { locale: idLocale })}
                </p>
              </div>

              {!n.isRead && (
                <div className="mt-2 h-2 w-2 rounded-full bg-blue-600 shrink-0" />
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
