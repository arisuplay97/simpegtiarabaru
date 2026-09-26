"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Bell, Loader2, ArrowLeft, CheckCheck, Trash2 } from "lucide-react"
import { getNotifications, markAllAsRead, clearAllNotifications, deleteNotification } from "@/lib/actions/notifikasi"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import Link from "next/link"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function MobileNotifikasi() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)

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
    toast.success("Semua notifikasi ditandai sudah dibaca")
  }

  const handleClearAll = async () => {
    if (!session?.user?.id) return
    if (!window.confirm("Apakah Anda yakin ingin membersihkan semua riwayat notifikasi?")) return
    setClearing(true)
    try {
      const res = await clearAllNotifications(session.user.id)
      if (res?.success) {
        setList([])
        toast.success("Semua notifikasi berhasil dibersihkan")
      } else {
        toast.error(res?.error || "Gagal membersihkan notifikasi")
      }
    } catch {
      toast.error("Terjadi kesalahan saat membersihkan notifikasi")
    } finally {
      setClearing(false)
    }
  }

  const handleDeleteOne = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!session?.user?.id) return
    setList(prev => prev.filter(n => n.id !== id))
    toast.success("Notifikasi dihapus")
    await deleteNotification(id, session.user.id)
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
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Notifikasi</h1>
            <p className="text-[10px] text-zinc-400">
              {list.length > 0 ? `${list.length} pesan masuk` : "Tidak ada pesan"}
            </p>
          </div>
        </div>

        {list.length > 0 && (
          <div className="flex items-center gap-1.5">
            {list.some(n => !n.isRead) && (
              <button 
                onClick={handleMarkAll} 
                className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold py-1.5 px-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 active:scale-95 transition-all"
                title="Tandai semua sudah dibaca"
              >
                <CheckCheck className="h-3.5 w-3.5" /> 
                <span className="hidden xs:inline">Tandai Dibaca</span>
              </button>
            )}

            <button 
              onClick={handleClearAll}
              disabled={clearing}
              className="flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 hover:text-rose-700 font-semibold py-1.5 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 active:scale-95 transition-all disabled:opacity-50"
              title="Bersihkan semua riwayat notifikasi"
            >
              {clearing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              <span>Bersihkan</span>
            </button>
          </div>
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
            <p className="text-xs text-zinc-400 mt-1">Kotak masuk notifikasi Anda bersih</p>
          </div>
        ) : (
          list.map(n => (
            <div
              key={n.id}
              className={cn(
                "flex items-start gap-3.5 px-4 py-3.5 transition-colors select-text cursor-default group",
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
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "text-xs font-bold leading-snug truncate",
                    !n.isRead ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400"
                  )}>
                    {n.title}
                  </p>
                  {!n.isRead && (
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed break-words">
                  {n.message}
                </p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5 tabular-nums">
                  {format(new Date(n.createdAt), "d MMM yyyy · HH:mm", { locale: idLocale })}
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => handleDeleteOne(n.id, e)}
                className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg active:scale-95 transition-all shrink-0"
                title="Hapus notifikasi ini"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
