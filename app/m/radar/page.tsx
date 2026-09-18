"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, RefreshCw, Search, Phone, MessageSquare, 
  Clock, CheckCircle2, AlertCircle, Calendar, UserX, 
  Filter, Users, Loader2 
} from "lucide-react"
import { getLiveRadarKehadiran } from "@/lib/actions/absensi"
import { getBidang } from "@/lib/actions/pegawai"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function MobileLiveRadar() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState<any>(null)
  const [bidangList, setBidangList] = useState<any[]>([])
  const [selectedBidang, setSelectedBidang] = useState("all")
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<"ALL" | "BELUM" | "HADIR" | "CUTI">("BELUM")

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (status === "authenticated") {
      loadInitial()
    }
  }, [status])

  const loadInitial = async () => {
    try {
      const bList = await getBidang()
      setBidangList(bList || [])
      await loadRadar()
    } finally {
      setLoading(false)
    }
  }

  const loadRadar = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true)
    try {
      const res = await getLiveRadarKehadiran(selectedBidang, search)
      if (res?.success) {
        setData(res)
      } else if (res?.error) {
        toast.error(res.error)
      }
    } catch {
      toast.error("Gagal memuat radar kehadiran")
    } finally {
      setRefreshing(false)
    }
  }, [selectedBidang, search])

  useEffect(() => {
    if (status === "authenticated") {
      loadRadar()
    }
  }, [selectedBidang, search, loadRadar, status])

  const filteredItems = (data?.items || []).filter((item: any) => {
    if (activeTab === "BELUM") return item.radarStatus === "BELUM_ABSEN"
    if (activeTab === "HADIR") return item.radarStatus === "TEPAT_WAKTU" || item.radarStatus === "TERLAMBAT"
    if (activeTab === "CUTI") return item.radarStatus === "CUTI_IZIN"
    return true
  })

  const getWaLink = (rawPhone: string | null, name: string) => {
    if (!rawPhone) return null
    let clean = rawPhone.replace(/\D/g, "")
    if (clean.startsWith("0")) clean = "62" + clean.slice(1)
    if (!clean.startsWith("62")) clean = "62" + clean
    const text = encodeURIComponent(`Halo Bapak/Ibu ${name}, kami mengingatkan dari Bagian Kepegawaian (HRD) untuk segera melakukan presensi hari ini. Terima kasih.`)
    return `https://wa.me/${clean}?text=${text}`
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] font-sans pb-24">
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
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none">
                Live Radar Kehadiran
              </h1>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
              Monitoring Realtime Pegawai (HRD)
            </p>
          </div>
        </div>

        <button
          onClick={() => loadRadar()}
          disabled={refreshing}
          className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 active:scale-90 transition-transform shadow-2xs"
          title="Segarkan Data"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin text-zinc-900 dark:text-white")} />
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="px-4 mt-3 max-w-md mx-auto">
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-xl p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs flex flex-col items-center">
            <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase">Total</span>
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-100 tabular-nums mt-0.5">
              {data?.summary?.totalPegawai ?? "--"}
            </span>
          </div>

          <div className="rounded-xl p-2.5 bg-emerald-500/10 border border-emerald-500/20 shadow-2xs flex flex-col items-center">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Hadir</span>
            <span className="text-base font-bold text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5">
              {data?.summary?.totalHadir ?? "--"}
            </span>
          </div>

          <div className="rounded-xl p-2.5 bg-rose-500/10 border border-rose-500/20 shadow-2xs flex flex-col items-center">
            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase">Belum</span>
            <span className="text-base font-bold text-rose-700 dark:text-rose-400 tabular-nums mt-0.5">
              {data?.summary?.countBelumAbsen ?? "--"}
            </span>
          </div>

          <div className="rounded-xl p-2.5 bg-sky-500/10 border border-sky-500/20 shadow-2xs flex flex-col items-center">
            <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400 uppercase">Cuti/Izin</span>
            <span className="text-base font-bold text-sky-700 dark:text-sky-400 tabular-nums mt-0.5">
              {data?.summary?.countCutiIzin ?? "--"}
            </span>
          </div>
        </div>

        {/* Attendance Percentage Progress Bar */}
        {data?.summary?.totalPegawai > 0 && (
          <div className="mt-3 rounded-xl p-3 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
              <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">Rasio Kehadiran Hari Ini</span>
              <span className="text-zinc-900 dark:text-zinc-100 font-bold tabular-nums">
                {data.summary.persentaseKehadiran}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div 
                className="h-full rounded-full bg-zinc-900 dark:bg-white transition-all duration-500 ease-out"
                style={{ width: `${data.summary.persentaseKehadiran}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="px-4 mt-3.5 space-y-2 max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Cari nama, NIK, atau jabatan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl pl-9.5 pr-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 shadow-2xs"
          />
        </div>

        {/* Filter Bidang Dropdown */}
        {bidangList.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <select
              value={selectedBidang}
              onChange={e => setSelectedBidang(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none shadow-2xs"
            >
              <option value="all">Semua Unit Kerja / Bidang</option>
              {bidangList.map(b => (
                <option key={b.id} value={b.id}>{b.nama}</option>
              ))}
            </select>
          </div>
        )}

        {/* Segmented Filter Tabs */}
        <div className="flex items-center bg-zinc-200/60 dark:bg-zinc-800/60 p-1 rounded-xl mt-1">
          {[
            { id: "BELUM", label: `Belum Absen (${data?.summary?.countBelumAbsen ?? 0})` },
            { id: "HADIR", label: `Hadir (${data?.summary?.totalHadir ?? 0})` },
            { id: "CUTI", label: `Cuti/Izin (${data?.summary?.countCutiIzin ?? 0})` },
            { id: "ALL", label: `Semua` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 text-[10.5px] font-semibold py-1.5 rounded-lg transition-all text-center truncate",
                activeTab === tab.id
                  ? "bg-white dark:bg-zinc-900 shadow-2xs text-zinc-900 dark:text-white"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Employee List */}
      <div className="px-4 mt-3 space-y-2.5 max-w-md mx-auto">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-zinc-400" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center text-zinc-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-6">
            <Users className="mx-auto h-9 w-9 mb-2 opacity-30" />
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Tidak ada pegawai dalam kategori ini</p>
          </div>
        ) : (
          filteredItems.map((emp: any) => {
            const waLink = getWaLink(emp.telepon, emp.nama)
            const isBelum = emp.radarStatus === "BELUM_ABSEN"
            const isTerlambat = emp.radarStatus === "TERLAMBAT"
            const isTepat = emp.radarStatus === "TEPAT_WAKTU"

            return (
              <div
                key={emp.id}
                className={cn(
                  "rounded-2xl p-3.5 bg-white dark:bg-zinc-900 border transition-all shadow-2xs",
                  isBelum 
                    ? "border-rose-200/80 dark:border-rose-950/60" 
                    : isTerlambat
                    ? "border-amber-200/80 dark:border-amber-950/60"
                    : "border-zinc-200/80 dark:border-zinc-800"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Avatar / Foto */}
                  <div className="h-10 w-10 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 shrink-0 mt-0.5">
                    {emp.fotoUrl ? (
                      <img src={emp.fotoUrl} className="h-full w-full object-cover" alt="" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-300">
                        {emp.nama?.charAt(0) || "U"}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {emp.nama}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                      {emp.jabatan}{emp.bidang ? ` · ${emp.bidang}` : ""}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-md border",
                        isTepat && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
                        isTerlambat && "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
                        isBelum && "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
                        emp.radarStatus === "CUTI_IZIN" && "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20"
                      )}>
                        {emp.statusLabel}
                      </span>

                      {emp.jamMasuk && (
                        <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 tabular-nums">
                          Jam: {emp.jamMasuk}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Direct Contact Button (WhatsApp Nudge) for HRD */}
                  {isBelum && waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs active:scale-90 transition-all shrink-0"
                      title="Nudge via WhatsApp"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Ingatkan
                    </a>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
