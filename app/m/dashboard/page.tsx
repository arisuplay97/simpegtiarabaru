"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Bell, Camera, AlertCircle, LogOut } from "lucide-react"
import { getEmployeeAttendanceSummary } from "@/lib/actions/absensi"
import { getUnreadCount } from "@/lib/actions/notifikasi"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import Link from "next/link"
import { cn } from "@/lib/utils"

function DigitalClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="text-center mt-6 mb-8">
      <div className="text-[2.75rem] font-bold text-white tracking-tight leading-none drop-shadow-md">
        {format(time, "HH:mm:ss")}
      </div>
      <div className="text-xs font-medium text-emerald-100/90 mt-2 tracking-wide">
        Hari Ini : {format(time, "EEEE, dd MMMM yyyy", { locale: idLocale })}
      </div>
    </div>
  )
}

export default function MobileDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [summary, setSummary] = useState<any>(null)
  const [pegawai, setPegawai] = useState<any>(null)
  const [unread, setUnread] = useState(0)

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
    } catch {}
  }

  // Fallback loading states can just show empty UI naturally until data pops in
  const today = new Date()
  const monthName = format(today, "MMMM", { locale: idLocale })

  return (
    <div className="min-h-screen bg-[#f4f7f6] dark:bg-black font-sans pb-24">
      
      {/* HEADER - LENGKUNG HIJAU PEKAT */}
      <div className="relative bg-[#18553f] pt-12 pb-24 px-5 rounded-b-[2.5rem] shadow-lg overflow-hidden">
        {/* Ornamen / Pattern BG jika ada */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>

        <div className="relative z-10">
          {/* Top Info Bar */}
          <div className="flex items-center justify-between">
            <div className="flex gap-3 items-center">
              <Link href="/m/notifikasi" className="relative p-2 rounded-xl bg-white/10 text-white backdrop-blur-sm">
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border border-[#18553f]" />
                )}
              </Link>
            </div>
            <Link href="/m/profil" className="flex items-center justify-center">
              {/* Ini bisa tombol Logout juga seperti gambar */}
              <div className="p-2 rounded-xl bg-white/10 text-white backdrop-blur-sm">
                <LogOut className="h-5 w-5" />
              </div>
            </Link>
          </div>

          {/* User Profile Info */}
          <div className="mt-4 flex flex-col items-center">
            <div className="h-16 w-16 mb-2 rounded-full overflow-hidden border-2 border-white/20 bg-white/10 shadow-xl">
              {(session?.user as any)?.image ? (
                <img src={(session?.user as any).image} className="h-full w-full object-cover" alt="" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-bold text-white uppercase">
                  {session?.user?.name?.charAt(0) ?? "U"}
                </div>
              )}
            </div>
            <h1 className="text-lg font-bold text-white text-center flex items-center gap-1.5">
              {session?.user?.name || "Pegawai"} <span className="text-xl">👋</span>
            </h1>
            <p className="text-[11px] font-medium text-emerald-100/80 text-center tracking-wide mt-0.5">
              {(session?.user as any)?.jabatan || "Staff"} {pegawai?.bidang?.nama ? `(${pegawai.bidang.nama})` : ""}
            </p>
          </div>

          {/* Real-time Clock */}
          <DigitalClock />
        </div>
      </div>

      {/* BERBAGAI KARTU KONTEN DI ATAS HIJAU (Negative Margin) */}
      <div className="relative z-20 -mt-16 px-5 space-y-4">
        
        {/* MASA KONTRAK ALERT */}
        {summary?.sisaKontrak !== undefined && summary.sisaKontrak <= 60 && (
          <div className="w-full rounded-2xl bg-[#fffcf0] dark:bg-amber-950/40 border border-[#ffeca1] dark:border-amber-900/50 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#fcd34d] text-amber-700">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-900 dark:text-amber-500">Masa Kontrak Segera Berakhir</h3>
                <p className="mt-1 text-xs text-amber-800/80 dark:text-amber-600/80 leading-relaxed">
                  Sisa masa kontrak Anda adalah <strong>{summary.sisaKontrak} hari</strong>.<br/>
                  Mohon segera koordinasi dengan HRD.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* JAM MASUK & PULANG */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-2xl bg-white dark:bg-neutral-900 p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-neutral-100 dark:border-neutral-800">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-[#18553f] dark:text-emerald-500">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">Jam Masuk</p>
              <p className="mt-0.5 text-xs font-semibold text-neutral-400 dark:text-neutral-500">
                {summary?.waktuAbsen ? summary.waktuAbsen.split(" - ")[0] : "-- : --"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white dark:bg-neutral-900 p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-neutral-100 dark:border-neutral-800">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">Jam Pulang</p>
              <p className="mt-0.5 text-xs font-semibold text-neutral-400 dark:text-neutral-500">
                {summary?.waktuAbsen?.includes(" - ") ? summary.waktuAbsen.split(" - ")[1] || "-- : --" : "-- : --"}
              </p>
            </div>
          </div>
        </div>

        {/* REKAP PRESENSI BOX */}
        <div className="rounded-2xl bg-white dark:bg-neutral-900 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-neutral-100 dark:border-neutral-800 overflow-hidden">
          <div className="pt-4 pb-2 px-4 text-center">
            <h3 className="text-[13px] font-bold text-neutral-800 dark:text-neutral-200">Rekap Presensi Bulan {monthName}</h3>
            <p className="mt-0.5 text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-500">
              Update Terakhir: {format(new Date(), "HH:mm")} WIB
            </p>
          </div>
          
          <div className="grid grid-cols-4 divide-x divide-neutral-100 dark:divide-neutral-800 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex flex-col items-center py-4">
              <span className="text-[1.75rem] font-bold text-[#18553f] leading-none mb-1">{summary?.hadir || 0}</span>
              <span className="text-[10px] font-medium text-neutral-500">Hadir</span>
            </div>
            <div className="flex flex-col items-center py-4">
              <span className="text-[1.75rem] font-bold text-amber-500 leading-none mb-1">{summary?.sakit || 0}</span>
              <span className="text-[10px] font-medium text-neutral-500">Sakit</span>
            </div>
            <div className="flex flex-col items-center py-4">
              <span className="text-[1.75rem] font-bold text-blue-500 leading-none mb-1">{summary?.izin || 0}</span>
              <span className="text-[10px] font-medium text-neutral-500">Izin</span>
            </div>
            <div className="flex flex-col items-center py-4">
              <span className="text-[1.75rem] font-bold text-rose-500 leading-none mb-1">{summary?.cuti || 0}</span>
              <span className="text-[10px] font-medium text-neutral-500">Cuti</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
