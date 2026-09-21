"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Fingerprint, ChevronRight, Calendar, Clock, MapPin } from "lucide-react"
import { getAbsensiSaya } from "@/lib/actions/absensi"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { cn } from "@/lib/utils"

const statusBadgeConfig: Record<string, { label: string; class: string }> = {
  HADIR:     { label: "Tepat Waktu", class: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  TERLAMBAT: { label: "Terlambat",   class: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  IZIN:      { label: "Izin",        class: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20" },
  SAKIT:     { label: "Sakit",       class: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20" },
  CUTI:      { label: "Cuti",        class: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20" },
  ALPA:      { label: "Alpa",        class: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20" },
  ALPHA:     { label: "Alpa",        class: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20" },
}

export default function MobileAbsensi() {
  const { status } = useSession()
  const router = useRouter()
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const now = new Date()
  const [bulan] = useState(now.getMonth() + 1)
  const [tahun] = useState(now.getFullYear())

  useEffect(() => {
    if (status === "unauthenticated") {
      if (typeof window !== "undefined" && !navigator.onLine) return
      router.push("/login")
    }
    if (status === "authenticated") loadData()
  }, [status])

  const loadData = async () => {
    try {
      const data = await getAbsensiSaya(bulan, tahun)
      setRecords(data || [])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] pb-24 font-sans">
      {/* Header */}
      <div 
        className="sticky top-0 z-20 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 px-4 py-3 flex items-center justify-between shadow-2xs"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <div className="flex items-center gap-2.5">
          <Link 
            href="/m/dashboard"
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Riwayat Presensi</h1>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60">
          {format(new Date(tahun, bulan - 1, 1), "MMMM yyyy", { locale: idLocale })}
        </span>
      </div>

      {/* Quick Action Check-In Banner */}
      <div className="px-4 pt-4">
        <Link 
          href="/m/fingerprint" 
          className="flex items-center justify-between rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-5 py-3.5 shadow-xs active:scale-98 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 dark:bg-zinc-900/10 flex items-center justify-center">
              <Fingerprint className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-xs tracking-wide uppercase">Presensi Sekarang</p>
              <p className="text-[11px] text-zinc-300 dark:text-zinc-600">Tap layar untuk check-in</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* List */}
      <div className="px-4 mt-4 space-y-2.5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-18 rounded-2xl bg-zinc-200/50 dark:bg-zinc-800/40 animate-pulse border border-zinc-200/50 dark:border-zinc-800/50" />
          ))
        ) : records.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 dark:text-zinc-500">
            <Calendar className="mx-auto h-10 w-10 mb-2.5 opacity-30 stroke-[1.5]" />
            <p className="text-sm font-medium">Belum ada riwayat absensi bulan ini</p>
          </div>
        ) : (
          records.map(r => {
            const tgl = new Date(r.tanggal)
            const st = (r.status as string)?.toUpperCase()
            const badge = statusBadgeConfig[st] || { label: st, class: "bg-zinc-100 text-zinc-700 border-zinc-200" }

            return (
              <div 
                key={r.id} 
                className="flex items-center gap-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-4 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                {/* Tanggal Box */}
                <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
                  <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase leading-none">
                    {format(tgl, "EEE", { locale: idLocale })}
                  </span>
                  <span className="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-tight tabular-nums mt-0.5">
                    {format(tgl, "dd")}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold border", badge.class)}>
                      {badge.label}
                    </span>
                    {r.metode && (
                      <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                        · {r.metode}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400 mt-1.5 tabular-nums">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-zinc-400" />
                      Masuk: {r.jamMasuk ? new Date(r.jamMasuk).toTimeString().slice(0, 5) : "--:--"}
                    </span>
                    <span>·</span>
                    <span>
                      Pulang: {r.jamKeluar ? new Date(r.jamKeluar).toTimeString().slice(0, 5) : "--:--"}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
