"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Bell, Camera, CalendarDays, ChevronRight, Clock, FileText, Loader2, TrendingUp } from "lucide-react"
import { getEmployeeAttendanceSummary } from "@/lib/actions/absensi"
import { getUnreadCount } from "@/lib/actions/notifikasi"

export default function MobileDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [summary, setSummary] = useState<any>(null)
  const [pegawai, setPegawai] = useState<any>(null)
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (status === "authenticated") fetchData()
  }, [status])

  const fetchData = async () => {
    try {
      const res = await fetch("/api/pegawai/me")
      if (res.ok) {
        const p = await res.json()
        setPegawai(p)
        const s = await getEmployeeAttendanceSummary(p.id)
        setSummary(s)
      }
      if (session?.user?.id) {
        const u = await getUnreadCount(session.user.id)
        setUnread(u)
      }
    } finally {
      setLoading(false)
    }
  }

  const now = new Date()
  const greeting = now.getHours() < 12 ? "Selamat pagi" : now.getHours() < 17 ? "Selamat siang" : "Selamat malam"

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1e3a5f] to-[#0d0d12] px-5 pb-8 pt-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-200">{greeting},</p>
            <h1 className="text-xl font-bold text-white">{session?.user?.name || "Pegawai"}</h1>
            <p className="text-xs text-blue-300 mt-0.5">{(session?.user as any)?.jabatan || ""}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/m/notifikasi" className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <Bell className="h-5 w-5 text-white" />
              </div>
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
            <div className="h-10 w-10 overflow-hidden rounded-full bg-white/20 ring-2 ring-white/30">
              {(session?.user as any)?.image ? (
                <img src={(session?.user as any).image} className="h-full w-full object-cover" alt="" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                  {session?.user?.name?.charAt(0) ?? "U"}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rekap Cards */}
        {summary && (
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: "Hadir", value: summary.hadir, color: "bg-emerald-500" },
              { label: "Alpha", value: summary.alpha, color: "bg-red-500" },
              { label: "Terlambat", value: summary.terlambat, color: "bg-amber-500" },
            ].map(s => (
              <div key={s.label} className="rounded-2xl bg-white/10 p-3 text-center">
                <div className={`mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full ${s.color}`}>
                  <span className="text-sm font-bold text-white">{s.value}</span>
                </div>
                <p className="text-[11px] text-blue-200">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-5 -mt-4">
        <div className="rounded-2xl bg-card shadow-lg border border-border p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Aksi Cepat</p>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/m/selfie" className="flex items-center gap-3 rounded-xl bg-primary/10 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                <Camera className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold">Selfie Masuk</p>
                <p className="text-[10px] text-muted-foreground">Absensi hari ini</p>
              </div>
            </Link>
            <Link href="/m/cuti" className="flex items-center gap-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500">
                <CalendarDays className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold">Ajukan Cuti</p>
                <p className="text-[10px] text-muted-foreground">Izin & cuti</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Menu List */}
      <div className="px-5 mt-4 space-y-3 pb-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Menu</p>
        {[
          { href: "/m/absensi", icon: Clock, label: "Riwayat Absensi", desc: "Lihat kehadiran bulan ini", color: "bg-blue-500" },
          { href: "/kalender", icon: CalendarDays, label: "Kalender Kehadiran", desc: "Kalender bulanan", color: "bg-teal-500" },
          { href: "/slip-gaji", icon: FileText, label: "Slip Gaji", desc: "Riwayat penggajian", color: "bg-green-500" },
          { href: "/indeks", icon: TrendingUp, label: "Indeks Kinerja", desc: "Penilaian & ranking", color: "bg-amber-500" },
        ].map(item => (
          <Link key={item.href} href={item.href} className="flex items-center gap-4 rounded-2xl bg-card border border-border p-4 shadow-sm">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.color}`}>
              <item.icon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{item.label}</p>
              <p className="text-[11px] text-muted-foreground">{item.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  )
}
