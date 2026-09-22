"use client"
import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Megaphone, AlertCircle, ChevronRight,
  CalendarDays, Clock, BookOpen,
  TrendingUp, Timer, UserCheck, Thermometer,
  FileText,
  Bell, CheckCircle2, XCircle, ArrowUpRight,
  CloudUpload, AlarmClockCheck, AlarmClockOff, AlarmClock, Trash2,
  RefreshCw, ArrowDown, Shield, Radio, MapPin
} from "lucide-react"
import { triggerHaptic } from "@/lib/pwa/haptics"
import { getEmployeeAttendanceSummary } from "@/lib/actions/absensi"
import { getUnreadCount, getPengumumanAktif } from "@/lib/actions/notifikasi"
import { getBannersPwa, BannerItem } from "@/lib/actions/banner"
import { BannerCarousel } from "@/components/simpeg/banner-carousel"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import Link from "next/link"
import Image from "next/image"
import { VerifiedBadge } from "@/components/simpeg/verified-badge"
import { cn } from "@/lib/utils"
import { getMobileQueue, syncMobileOfflineQueue, clearMobileQueue } from "@/lib/offline/absensi-queue"
import { 
  requestPushPermission, isReminderEnabled, 
  toggleReminder, checkAndSendSmartReminder,
  subscribeToWebPush
} from "@/lib/pwa/notification-reminder"
import { toast } from "sonner"
import { 
  IconCuti3D, IconAbsensi3D, IconKalender3D, 
  IconKinerja3D, IconLembur3D, IconSlipGaji3D,
  IconHadir3D, IconSakit3D, IconIzin3D, IconCutiRekap3D
} from "@/components/mobile/icons-3d"

// ─── Digital Clock ──────────────────────────────────────────────
function DigitalClock() {
  const [time, setTime] = useState<Date | null>(null)
  
  useEffect(() => {
    setTime(new Date())
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!time) {
    return <div className="h-7 w-16 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-lg" />
  }

  return (
    <div className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums">
      {format(time, "HH:mm")}
    </div>
  )
}

// ─── Pengumuman Ticker ──────────────────────────────────────────
function PengumumanTicker({ items }: { items: { title: string; message: string }[] }) {
  if (!items.length) return null
  const fullText = items.map(i => `${i.title}: ${i.message}`).join("   —   ")

  return (
    <div className="flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div className="shrink-0 flex items-center justify-center h-7 w-7 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
        <Megaphone className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 overflow-hidden relative h-5 flex items-center">
        <div
          className="absolute whitespace-nowrap text-xs font-medium text-zinc-700 dark:text-zinc-300"
          style={{
            animation: "marquee-scroll 22s linear infinite",
            left: 0,
          }}
        >
          {fullText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{fullText}
        </div>
      </div>
    </div>
  )
}


// ─── Menu Utama Layanan Pegawai (3D Icons) ───────────────────────
const menuItems = [
  { href: "/m/cuti",      icon: IconCuti3D,      label: "Cuti &\nIzin" },
  { href: "/m/absensi",   icon: IconAbsensi3D,   label: "Riwayat\nAbsen" },
  { href: "/m/kalender",  icon: IconKalender3D,  label: "Kalender\nKerja" },
  { href: "/m/indeks",    icon: IconKinerja3D,   label: "Indeks\nKinerja" },
  { href: "/m/lembur",    icon: IconLembur3D,    label: "Lembur\nKerja" },
  { href: "/m/slip-gaji", icon: IconSlipGaji3D,  label: "Slip\nGaji" },
]

export default function MobileDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [summary, setSummary] = useState<any>(null)
  const [pegawai, setPegawai] = useState<any>(null)
  const [unread, setUnread] = useState(0)
  const [greeting, setGreeting] = useState("")
  const [pengumuman, setPengumuman] = useState<any[]>([])
  const [banners, setBanners] = useState<BannerItem[]>([])
  const [offlineQueueCount, setOfflineQueueCount] = useState(0)
  const [isReminderActive, setIsReminderActive] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  // Pull to Refresh State
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startYRef = useRef(0)
  const isPullingRef = useRef(false)
  const hasTriggeredHapticRef = useRef(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (typeof window !== "undefined" && window.scrollY <= 0 && !isRefreshing) {
      startYRef.current = e.touches[0].clientY
      isPullingRef.current = true
      setIsPulling(true)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPullingRef.current || isRefreshing) return
    const currentY = e.touches[0].clientY
    const diff = currentY - startYRef.current

    if (diff > 0 && typeof window !== "undefined" && window.scrollY <= 0) {
      // Damped pull distance curve
      const dist = Math.min(Math.pow(diff, 0.82) * 1.6, 95)
      setPullDistance(dist)

      // Haptic threshold feedback at 68px
      if (dist >= 68 && !hasTriggeredHapticRef.current) {
        triggerHaptic("medium")
        hasTriggeredHapticRef.current = true
      } else if (dist < 68 && hasTriggeredHapticRef.current) {
        hasTriggeredHapticRef.current = false
      }
    } else {
      setPullDistance(0)
    }
  }

  const handleTouchEnd = async () => {
    if (!isPullingRef.current) return
    isPullingRef.current = false
    setIsPulling(false)

    if (pullDistance >= 68 && !isRefreshing) {
      triggerHaptic("success")
      setIsRefreshing(true)
      setPullDistance(56)

      try {
        await Promise.allSettled([
          fetchData(),
          checkOfflineQueue()
        ])
      } finally {
        setTimeout(() => {
          setPullDistance(0)
          setIsRefreshing(false)
          hasTriggeredHapticRef.current = false
        }, 400)
      }
    } else {
      setPullDistance(0)
      hasTriggeredHapticRef.current = false
    }
  }

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 11) setGreeting("Selamat Pagi")
    else if (hour < 15) setGreeting("Selamat Siang")
    else if (hour < 18) setGreeting("Selamat Sore")
    else setGreeting("Selamat Malam")
  }, [])

  const checkOfflineQueue = async () => {
    try {
      const q = await getMobileQueue()
      setOfflineQueueCount(q.length)
      if (q.length === 0) {
        setSyncError(null)
      }
    } catch {}
  }

  useEffect(() => {
    // Coba load data profil pegawai dari cache lokal terlebih dahulu jika offline
    if (typeof window !== "undefined") {
      try {
        const cachedProfile = localStorage.getItem("cached_pegawai_profile")
        if (cachedProfile) {
          setPegawai(JSON.parse(cachedProfile))
        }
      } catch {}
    }

    if (status === "unauthenticated") {
      // PERBAIKAN SAFARI OFFLINE: Jika perangkat sedang offline, jangan pernah redirect ke /login
      if (typeof window !== "undefined" && !navigator.onLine) {
        console.warn("PWA sedang offline: mempertahankan tampilan dashboard tanpa redirect ke login")
        checkOfflineQueue()
        return
      }
      router.push("/login")
    }

    if (status === "authenticated" || (typeof window !== "undefined" && !navigator.onLine)) {
      fetchData()
      checkOfflineQueue()
      const enabled = isReminderEnabled()
      setIsReminderActive(enabled)
      if (enabled) {
        subscribeToWebPush().catch(() => {})
      }
    }
  }, [status])

  useEffect(() => {
    const handleQueueUpdated = () => {
      checkOfflineQueue()
      fetchData()
    }
    const handleSyncError = (e: any) => {
      if (e.detail?.errors?.length > 0) {
        setSyncError(e.detail.errors[0])
      }
    }
    window.addEventListener("offline-queue-updated", handleQueueUpdated)
    window.addEventListener("offline-sync-error", handleSyncError)
    return () => {
      window.removeEventListener("offline-queue-updated", handleQueueUpdated)
      window.removeEventListener("offline-sync-error", handleSyncError)
    }
  }, [])

  const fetchData = async () => {
    try {
      // Fase 1: Ambil data pegawai, pengumuman, banner, dan unread secara PARALEL
      const [pegawaiRes, pgm, bList, unreadCount] = await Promise.all([
        fetch("/api/pegawai/me").then(r => r.ok ? r.json() : null).catch(() => null),
        getPengumumanAktif().catch(() => []),
        getBannersPwa(true).catch(() => []),
        session?.user?.id ? getUnreadCount(session.user.id).catch(() => 0) : Promise.resolve(0),
      ])

      // Set data yang sudah tersedia langsung (UI sudah bisa render parsial)
      if (pgm?.length) setPengumuman(pgm)
      if (bList?.length) setBanners(bList)
      setUnread(unreadCount)

      if (pegawaiRes) {
        setPegawai(pegawaiRes)
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("cached_pegawai_profile", JSON.stringify(pegawaiRes))
          } catch {}
        }

        // Fase 2: Ambil summary absensi (tergantung pegawaiId)
        const s = await getEmployeeAttendanceSummary(pegawaiRes.id).catch(() => null)
        if (s) setSummary(s)

        if (s && typeof window !== "undefined") {
          try {
            localStorage.setItem("attendance_today", JSON.stringify({
              date: format(new Date(), "yyyy-MM-dd"),
              sudahAbsenMasuk: Boolean(s.sudahAbsenMasuk),
              sudahAbsenPulang: Boolean(s.sudahAbsenPulang)
            }))
          } catch {}
        }

        // Jalankan smart reminder (non-blocking)
        checkAndSendSmartReminder({
          batasMasuk: s?.batasAbsenMasuk,
          mulaiPulang: s?.mulaiAbsenPulang,
          sudahMasuk: s?.sudahAbsenMasuk,
          sudahPulang: s?.sudahAbsenPulang,
          isShift: Boolean((s as any)?.isShift || (s as any)?.jadwalShift),
          isCabang: Boolean(s?.isCabang),
        })
      }
    } catch {}
  }


  const handleToggleReminder = async () => {
    if (!isReminderActive) {
      const granted = await requestPushPermission()
      if (granted) {
        setIsReminderActive(true)
        toast.success("Notifikasi Push HP & Pengingat berhasil diaktifkan!")
      } else {
        toast.error("Izin notifikasi tidak diizinkan di peramban.")
      }
    } else {
      await toggleReminder(false)
      setIsReminderActive(false)
      toast.info("Notifikasi push dinonaktifkan.")
    }
  }

  const handleSyncOffline = async () => {
    if (isSyncing) return
    setIsSyncing(true)
    const toastId = toast.loading("Menyinkronkan antrian offline...")
    try {
      const res = await syncMobileOfflineQueue()
      if (res.synced > 0) {
        toast.success(`${res.synced} presensi offline berhasil terkirim ke server!`, { id: toastId })
        setSyncError(null)
      } else if (res.failed > 0) {
        const errMsg = res.errors[0] || "Ditolak oleh server"
        setSyncError(errMsg)
        toast.error(`Gagal sinkronisasi: ${errMsg}`, { id: toastId, duration: 6000 })
      } else {
        toast.info("Tidak ada presensi di antrian.", { id: toastId })
        setSyncError(null)
      }
      await checkOfflineQueue()
      await fetchData()
    } catch (err: any) {
      toast.error("Gagal menyinkronkan data offline.", { id: toastId })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleClearOfflineQueue = async () => {
    if (window.confirm("Hapus antrian presensi offline ini? Presensi yang belum tersimpan ke server akan dibatalkan.")) {
      await clearMobileQueue()
      setSyncError(null)
      await checkOfflineQueue()
      toast.info("Antrian offline telah dibersihkan.")
    }
  }

  const today = new Date()
  const monthName = format(today, "MMMM", { locale: idLocale })
  const userRole = ((session?.user as any)?.role || "").toUpperCase()
  const jabatan = (session?.user as any)?.jabatan || "Staff"
  const bidang = pegawai?.bidang?.nama || ""
  const subBidang = pegawai?.subBidang?.nama || ""
  const fotoUrl = pegawai?.fotoUrl || (session?.user as any)?.image || null
  const namaInisial = session?.user?.name?.charAt(0)?.toUpperCase() ?? "U"

  const hadirCount = summary?.hadir || 0
  const sakitCount = summary?.sakit || 0
  const izinCount = summary?.izin || 0
  const cutiCount = summary?.cuti || 0
  const totalWorkdays = hadirCount + sakitCount + izinCount + cutiCount

  return (
    <div 
      className="min-h-screen pb-24 font-sans bg-zinc-50 dark:bg-[#09090b] relative overscroll-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ===== PULL TO REFRESH INDICATOR ===== */}
      <div 
        className="fixed top-4 left-0 right-0 z-50 flex justify-center pointer-events-none transition-all duration-150"
        style={{
          transform: `translateY(${Math.max(pullDistance - 50, -60)}px)`,
          opacity: pullDistance > 12 ? Math.min(pullDistance / 45, 1) : 0,
        }}
      >
        <div className={cn(
          "px-4 py-2 rounded-full shadow-xl border backdrop-blur-md flex items-center gap-2 text-xs font-semibold tracking-wide transition-all",
          pullDistance >= 68 || isRefreshing
            ? "bg-blue-600 text-white border-blue-400/50 shadow-blue-600/30 ring-2 ring-blue-500/20"
            : "bg-white/95 dark:bg-zinc-900/95 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800"
        )}>
          {isRefreshing ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-white" />
              <span>Memperbarui data...</span>
            </>
          ) : pullDistance >= 68 ? (
            <>
              <ArrowDown className="h-3.5 w-3.5 rotate-180 transition-transform duration-200" />
              <span>Lepas untuk perbarui</span>
            </>
          ) : (
            <>
              <ArrowDown className="h-3.5 w-3.5 transition-transform duration-200" />
              <span>Tarik ke bawah</span>
            </>
          )}
        </div>
      </div>

      {/* ===== HERO HEADER ===== */}
      <div 
        className="relative px-5 pb-28 bg-zinc-950 text-white overflow-hidden border-b border-zinc-800/80"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.25rem)" }}
      >
        {/* Subtle Ambient Radial Glow */}
        <div 
          className="absolute -top-24 -right-24 h-72 w-72 rounded-full pointer-events-none opacity-20"
          style={{ background: "radial-gradient(circle, #3b82f6, transparent 70%)" }} 
        />
        <div 
          className="absolute bottom-0 -left-20 h-48 w-48 rounded-full pointer-events-none opacity-10"
          style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }} 
        />

        <div className="relative z-10">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 flex items-center justify-center shrink-0">
                <img src="/putih.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="text-white font-bold text-sm tracking-tight leading-none">ASIK Mobile</p>
                <p className="text-zinc-400 text-[10px] font-medium leading-none mt-1">Perumdam Tirta Ardhia Rinjani</p>
              </div>
            </div>

            {/* Notification & Reminder Actions - Differentiated */}
            <div className="flex items-center gap-2">
              {/* Tombol Pengingat Jam Absen (Alarm Mode) */}
              <button
                onClick={handleToggleReminder}
                className={cn(
                  "flex items-center justify-center h-9 w-9 rounded-full border transition-all active:scale-95 shadow-xs",
                  isReminderActive 
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 ring-2 ring-emerald-500/20" 
                    : "bg-zinc-900/90 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                )}
                title={isReminderActive ? "Pengingat Absen Aktif (Alarm)" : "Aktifkan Pengingat Absen (Alarm)"}
              >
                {isReminderActive ? (
                  <AlarmClockCheck className="h-4.5 w-4.5 text-emerald-400" />
                ) : (
                  <AlarmClockOff className="h-4.5 w-4.5 text-zinc-400" />
                )}
              </button>

              {/* Tombol Kotak Masuk Notifikasi SIMPEG */}
              <Link 
                href="/m/notifikasi" 
                className="relative flex items-center justify-center h-9 w-9 rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-300 hover:text-white transition-all active:scale-95 shadow-xs"
                title="Kotak Masuk Notifikasi"
              >
                <Bell className="h-4.5 w-4.5" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-xs ring-2 ring-zinc-950">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* User Profile Summary */}
          <div className="flex flex-col mt-2">
            <div>
              <span className="text-zinc-400 text-[11px] font-medium tracking-wide uppercase">
                {greeting}
              </span>
            </div>

            <div className="flex items-center gap-3.5 mt-2">
              <Link href="/m/profil" className="shrink-0 relative group">
                <div className="h-14 w-14 rounded-2xl overflow-hidden bg-zinc-900 border-2 border-zinc-800 shadow-md">
                  {fotoUrl ? (
                    <img src={fotoUrl} className="h-full w-full object-cover" alt="Profil" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-bold text-zinc-200">
                      {namaInisial}
                    </div>
                  )}
                </div>
              </Link>

              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-white tracking-tight leading-snug flex items-center gap-1.5 truncate">
                  <span className="truncate">{session?.user?.name || "Karyawan"}</span>
                  {((session?.user as any)?.role?.toString().toUpperCase() === "SUPERADMIN" || 
                    (session?.user as any)?.role?.toString().toLowerCase() === "super_admin" || 
                    (session?.user?.name || "").toLowerCase().includes("super admin")) && (
                    <VerifiedBadge className="w-4 h-4 shrink-0 inline-flex" />
                  )}
                </h1>

                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                  <p className="text-xs font-semibold text-zinc-300 tracking-tight truncate">
                    {jabatan}{subBidang ? ` · ${subBidang}` : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="relative z-20 -mt-20 px-4 space-y-4 max-w-md mx-auto">

        {/* Offline Queue Sync Banner */}
        {offlineQueueCount > 0 && (
          <div className="rounded-2xl p-3.5 bg-zinc-900 text-white border border-zinc-800 shadow-sm space-y-2.5 animate-in fade-in-50">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={cn(
                  "h-8 w-8 rounded-xl flex items-center justify-center shrink-0",
                  syncError ? "bg-rose-500/20 text-rose-400" : "bg-amber-500/20 text-amber-400"
                )}>
                  {syncError ? <AlertCircle className="h-4 w-4" /> : <CloudUpload className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">Antrian Offline ({offlineQueueCount})</p>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {syncError ? "Perlu perhatian / ditolak server" : "Siap dikirim ke server"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleClearOfflineQueue}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-rose-500/20 text-zinc-300 hover:text-rose-300 transition-colors active:scale-95"
                  title="Hapus / Batalkan Antrian"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleSyncOffline}
                  disabled={isSyncing}
                  className="px-3 py-1.5 rounded-xl bg-white text-zinc-900 text-xs font-bold active:scale-95 transition-transform shadow-xs disabled:opacity-50"
                >
                  {isSyncing ? "Mengirim..." : syncError ? "Coba Lagi" : "Sync Sekarang"}
                </button>
              </div>
            </div>
            {syncError && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-2.5 py-1.5 flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-rose-300 leading-tight">
                  {syncError}
                </p>
              </div>
            )}
          </div>
        )}



        {/* Kontrak Warning (Executive Clean Modern) */}
        {summary?.sisaKontrak !== undefined && summary.sisaKontrak <= 60 && (
          <div className="rounded-2xl p-4 bg-zinc-900 border border-zinc-800 shadow-xs text-white relative overflow-hidden flex items-start gap-3.5">
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-600" />
            <div className="h-8 w-8 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0 text-amber-400 mt-0.5">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0 text-xs">
              <div className="flex items-center gap-2">
                <p className="font-bold text-zinc-100 tracking-tight">Masa Kontrak Kerja</p>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Sisa {summary.sisaKontrak} Hari
                </span>
              </div>
              <p className="text-zinc-400 mt-1 leading-relaxed text-[11px]">
                Masa kontrak Anda akan segera berakhir. Koordinasikan pembaruan status kontrak dengan bagian HRD.
              </p>
            </div>
          </div>
        )}

        {/* ===== STATUS HARI INI CARD ===== */}
        <div className="rounded-2xl p-5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Presensi Hari Ini</p>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                {format(today, "EEEE, dd MMMM yyyy", { locale: idLocale })}
              </p>
            </div>

            {/* Jam Digital Real-time */}
            <DigitalClock />
          </div>

          {/* Jam masuk, siang & pulang tiles */}
          {summary?.wajibAbsenSiang ? (
            <div className="grid grid-cols-3 gap-2">
              {/* Tile Masuk */}
              <div className="rounded-xl p-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-700/60 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Masuk</span>
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 tabular-nums">{summary?.jamMasuk || "08:00"}</span>
                </div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1 tabular-nums">
                  {summary?.waktuAbsen ? summary.waktuAbsen.split(" - ")[0] : "--:--"}
                </p>
                <p className={cn(
                  "text-[9px] font-semibold mt-0.5 truncate",
                  summary?.sudahAbsenMasuk
                    ? (summary?.statusMasukHariIni === "TERLAMBAT" ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")
                    : "text-zinc-400 dark:text-zinc-500"
                )}>
                  {summary?.sudahAbsenMasuk ? (summary?.statusMasukHariIni === "TERLAMBAT" ? "Terlambat" : "Hadir") : "Belum"}
                </p>
              </div>

              {/* Tile Siang (Pusat) */}
              <div className="rounded-xl p-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-700/60 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Siang</span>
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 tabular-nums">{summary?.jamSiang || "12:00"}</span>
                </div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1 tabular-nums">
                  {summary?.waktuAbsenSiang || "--:--"}
                </p>
                <p className={cn(
                  "text-[9px] font-semibold mt-0.5 truncate",
                  summary?.sudahAbsenSiang ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                )}>
                  {summary?.sudahAbsenSiang ? "Hadir" : "Belum"}
                </p>
              </div>

              {/* Tile Pulang */}
              <div className="rounded-xl p-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-700/60 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Pulang</span>
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 tabular-nums">{summary?.jamPulang || "17:00"}</span>
                </div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1 tabular-nums">
                  {summary?.waktuAbsen?.includes(" - ") ? summary.waktuAbsen.split(" - ")[1] || "--:--" : "--:--"}
                </p>
                <p className={cn(
                  "text-[9px] font-semibold mt-0.5 truncate",
                  summary?.sudahAbsenPulang ? "text-blue-600 dark:text-blue-400" : "text-zinc-400 dark:text-zinc-500"
                )}>
                  {summary?.sudahAbsenPulang ? "Hadir" : "Belum"}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {/* Tile Masuk */}
              <div className="rounded-xl p-3.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-700/60 flex items-center gap-3">
                <div className={cn(
                  "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border",
                  summary?.sudahAbsenMasuk
                    ? summary?.statusMasukHariIni === "TERLAMBAT"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-zinc-200/70 dark:bg-zinc-700/50 text-zinc-700 dark:text-zinc-300 border-zinc-300/40 dark:border-zinc-600/40"
                )}>
                  <Clock className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Masuk</p>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium tabular-nums">
                      {summary?.jamMasuk || "08:00"}
                    </span>
                  </div>
                  <p className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 tabular-nums">
                    {summary?.waktuAbsen ? summary.waktuAbsen.split(" - ")[0] : "--:--"}
                  </p>
                  {summary?.sudahAbsenMasuk ? (
                    <p className={cn(
                      "text-[10px] font-semibold mt-0.5 truncate tracking-tight",
                      summary?.statusMasukHariIni === "TERLAMBAT"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    )}>
                      {summary?.statusMasukHariIni === "TERLAMBAT"
                        ? (summary?.menitTerlambatHariIni > 0 ? `Terlambat +${summary.menitTerlambatHariIni}m` : "Terlambat")
                        : "Tepat Waktu"}
                    </p>
                  ) : (
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
                      Belum Absen
                    </p>
                  )}
                </div>
              </div>

              {/* Tile Pulang */}
              <div className="rounded-xl p-3.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-700/60 flex items-center gap-3">
                <div className={cn(
                  "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border",
                  summary?.sudahAbsenPulang
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                    : "bg-zinc-200/70 dark:bg-zinc-700/50 text-zinc-700 dark:text-zinc-300 border-zinc-300/40 dark:border-zinc-600/40"
                )}>
                  <Clock className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Pulang</p>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium tabular-nums">
                      {summary?.jamPulang || "17:00"}
                    </span>
                  </div>
                  <p className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 tabular-nums">
                    {summary?.waktuAbsen?.includes(" - ") ? summary.waktuAbsen.split(" - ")[1] || "--:--" : "--:--"}
                  </p>
                  <p className={cn(
                    "text-[10px] font-semibold mt-0.5 truncate tracking-tight",
                    summary?.sudahAbsenPulang
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-zinc-400 dark:text-zinc-500 font-normal"
                  )}>
                    {summary?.sudahAbsenPulang ? "Sudah Absen" : "Belum Absen"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===== PANEL KHUSUS HRD & ADMINISTRATOR ===== */}
        {(() => {
          const userRole = (pegawai?.role || (session?.user as any)?.role || "").toUpperCase()
          const isHrdOrAdmin = ["SUPERADMIN", "ADMIN", "HRD", "DIREKSI"].includes(userRole) || 
                               (session?.user?.name || "").toLowerCase().includes("admin")
          if (!isHrdOrAdmin) return null

          return (
            <div className="rounded-2xl p-4 bg-gradient-to-br from-blue-900/15 via-indigo-900/10 to-transparent border border-blue-500/20 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                    <Shield className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                    Panel Khusus HRD & Admin
                  </p>
                </div>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                  {userRole || "HRD"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/m/radar"
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-zinc-850 border border-zinc-200/80 dark:border-zinc-700/70 hover:border-blue-400 active:scale-95 transition-all shadow-2xs"
                >
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Radio className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">Radar Monitoring</p>
                    <p className="text-[10px] text-zinc-500 truncate">Pantau live pegawai</p>
                  </div>
                </Link>

                <Link
                  href="/approval"
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-zinc-850 border border-zinc-200/80 dark:border-zinc-700/70 hover:border-blue-400 active:scale-95 transition-all shadow-2xs"
                >
                  <div className="h-8 w-8 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">Approval Izin/Cuti</p>
                    <p className="text-[10px] text-zinc-500 truncate">Persetujuan berkas</p>
                  </div>
                </Link>

                <Link
                  href="/m/settings/absensi"
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-zinc-850 border border-zinc-200/80 dark:border-zinc-700/70 hover:border-blue-400 active:scale-95 transition-all shadow-2xs"
                >
                  <div className="h-8 w-8 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">Jam Absensi</p>
                    <p className="text-[10px] text-zinc-500 truncate">Pusat & Cabang</p>
                  </div>
                </Link>

                <Link
                  href="/m/settings/lokasi"
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-zinc-850 border border-zinc-200/80 dark:border-zinc-700/70 hover:border-blue-400 active:scale-95 transition-all shadow-2xs"
                >
                  <div className="h-8 w-8 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">Lokasi & Radius</p>
                    <p className="text-[10px] text-zinc-500 truncate">GPS Geofencing</p>
                  </div>
                </Link>
              </div>
            </div>
          )
        })()}

        {/* ===== PENGUMUMAN TICKER ===== */}
        {pengumuman.length > 0 && <PengumumanTicker items={pengumuman} />}

        {/* ===== BANNER CAROUSEL PWA ===== */}
        <BannerCarousel banners={banners} />

        {/* ===== REKAP PRESENSI ===== */}
        <div className="rounded-2xl p-5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Rekap Bulanan</p>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">Bulan {monthName}</p>
            </div>
            <Link 
              href="/m/absensi" 
              className="flex items-center gap-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Lihat Detail <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {totalWorkdays > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                <span>Tingkat Kehadiran</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{hadirCount}/{totalWorkdays} Hari</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-zinc-900 dark:bg-white transition-all duration-700 ease-out"
                  style={{ width: `${Math.min((hadirCount / totalWorkdays) * 100, 100)}%` }} 
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-4 gap-1.5">
            {[
              { 
                label: "Hadir", 
                desc: "Bln Ini",
                value: hadirCount, 
                icon: IconHadir3D,
              },
              { 
                label: "Sakit", 
                desc: "Bln Ini",
                value: sakitCount, 
                icon: IconSakit3D,
              },
              { 
                label: "Izin",  
                desc: "Bln Ini",
                value: izinCount,  
                icon: IconIzin3D,
              },
              { 
                label: "Sisa Cuti",  
                desc: "Jatah Thn",
                value: pegawai?.saldoCuti ?? 12, 
                icon: IconCutiRekap3D,
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div 
                  key={item.label} 
                  className="flex flex-col items-center py-2 px-1 text-center group transition-all"
                >
                  <div className="flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform duration-200">
                    <Icon className="w-10 h-10 drop-shadow-xs" size={38} />
                  </div>
                  <span className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 tabular-nums leading-tight">
                    {item.value}
                  </span>
                  <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 tracking-tight leading-none mt-1">
                    {item.label}
                  </span>
                  <span className="text-[9px] font-medium text-zinc-400 dark:text-zinc-500 leading-none mt-0.5">
                    {item.desc}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Keterangan Status Cuti */}
          <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
              <span className="truncate"><strong>Sisa Cuti:</strong> Kuota tahunan ({pegawai?.saldoCuti ?? 12} hari)</span>
            </div>
            {cutiCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 font-semibold shrink-0 ml-1">
                Pakai bln ini: {cutiCount}
              </span>
            )}
          </div>
        </div>

        {/* ===== MENU UTAMA ===== */}
        <div className="rounded-2xl p-5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Layanan Pegawai
            </p>
            <span className="text-[10px] font-medium text-zinc-400">
              Pintasan Cepat
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {menuItems.map((item, i) => {
              const Icon = item.icon
              return (
                <Link key={i} href={item.href}>
                  <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 transition-all active:scale-95 group shadow-2xs">
                    <div className="flex items-center justify-center py-1">
                      <Icon className="h-12 w-12 transition-transform duration-200 group-hover:scale-110 drop-shadow-sm" size={48} />
                    </div>
                    <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 text-center leading-tight whitespace-pre-line">
                      {item.label}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>


        {/* Footer info */}
        <div className="text-center pt-2 pb-6">
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">
            ASIK Mobile · Perumdam Tirta Ardhia Rinjani
          </p>
          <p className="text-[11px] text-zinc-950 dark:text-white font-bold mt-0.5 tracking-tight">
            Inovasi Digital - Tim IT Sekretariat
          </p>
        </div>

      </div>
    </div>
  )
}
