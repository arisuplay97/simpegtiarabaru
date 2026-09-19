"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Megaphone, AlertCircle, ChevronRight,
  CalendarDays, Clock, BookOpen,
  TrendingUp, Award, Timer, UserCheck, Thermometer,
  FileText, Trophy, Medal,
  Bell, CheckCircle2, XCircle, Pointer, ArrowUpRight,
  Radio, CloudUpload, BellRing, BellOff
} from "lucide-react"
import { getEmployeeAttendanceSummary } from "@/lib/actions/absensi"
import { getUnreadCount, getPengumumanAktif } from "@/lib/actions/notifikasi"
import { getLeaderboard } from "@/lib/actions/indeks"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import Link from "next/link"
import Image from "next/image"
import { VerifiedBadge } from "@/components/simpeg/verified-badge"
import { cn } from "@/lib/utils"
import { getMobileQueue, syncMobileOfflineQueue } from "@/lib/offline/absensi-queue"
import { 
  requestPushPermission, isReminderEnabled, 
  toggleReminder, checkAndSendSmartReminder 
} from "@/lib/pwa/notification-reminder"
import { toast } from "sonner"

// ─── Digital Clock ──────────────────────────────────────────────
function DigitalClock() {
  const [time, setTime] = useState<Date | null>(null)
  
  useEffect(() => {
    setTime(new Date())
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!time) {
    return <div className="h-9 w-20 bg-white/10 animate-pulse rounded-lg" />
  }

  return (
    <div className="flex flex-col items-end">
      <div className="text-2xl font-bold tracking-tight text-white tabular-nums flex items-baseline">
        <span>{format(time, "HH:mm")}</span>
        <span className="text-xs text-zinc-400 font-medium ml-0.5">:{format(time, "ss")}</span>
      </div>
      <div className="text-[11px] font-medium text-zinc-400 mt-0.5">
        {format(time, "EEE, dd MMM", { locale: idLocale })}
      </div>
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

// ─── Rank Badge ─────────────────────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex shrink-0 h-6 w-6 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-xs">
        <Trophy className="h-3 w-3" />
      </div>
    )
  }
  if (rank === 2) {
    return (
      <div className="flex shrink-0 h-6 w-6 items-center justify-center rounded-full bg-zinc-400/10 text-zinc-400 border border-zinc-400/20">
        <Medal className="h-3 w-3" />
      </div>
    )
  }
  if (rank === 3) {
    return (
      <div className="flex shrink-0 h-6 w-6 items-center justify-center rounded-full bg-amber-700/10 text-amber-700 border border-amber-700/20">
        <Award className="h-3 w-3" />
      </div>
    )
  }
  return (
    <div className="flex shrink-0 h-6 w-6 items-center justify-center text-[10px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded-full">
      #{rank}
    </div>
  )
}

// ─── Menu Utama ─────────────────────────────────────────────────
const menuItems = [
  { href: "/m/cuti",      icon: CalendarDays, label: "Cuti &\nIzin" },
  { href: "/m/absensi",   icon: FileText,     label: "Riwayat\nAbsen" },
  { href: "/m/kalender",  icon: BookOpen,     label: "Kalender\nKerja" },
  { href: "/m/indeks",    icon: TrendingUp,   label: "Indeks\nKinerja" },
  { href: "/m/lembur",    icon: Timer,        label: "Lembur\nKerja" },
]

export default function MobileDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [summary, setSummary] = useState<any>(null)
  const [pegawai, setPegawai] = useState<any>(null)
  const [unread, setUnread] = useState(0)
  const [greeting, setGreeting] = useState("")
  const [pengumuman, setPengumuman] = useState<any[]>([])
  const [disiplinTop, setDisiplinTop] = useState<any[]>([])
  const [showAllLeaderboard, setShowAllLeaderboard] = useState(false)
  const [offlineQueueCount, setOfflineQueueCount] = useState(0)
  const [isReminderActive, setIsReminderActive] = useState(false)

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
    } catch {}
  }

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (status === "authenticated") {
      fetchData()
      checkOfflineQueue()
      setIsReminderActive(isReminderEnabled())
    }
  }, [status])

  useEffect(() => {
    window.addEventListener("offline-queue-updated", checkOfflineQueue)
    return () => window.removeEventListener("offline-queue-updated", checkOfflineQueue)
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch("/api/pegawai/me")
      if (res.ok) {
        const p = await res.json()
        setPegawai(p)
        
        if (typeof window !== "undefined" && p) {
          localStorage.setItem("offlineFaceStatus", JSON.stringify({
            faceRegistered: p.faceRegistered,
            faceDescriptor: p.faceDescriptor,
            id: p.id
          }))
        }

        const s = await getEmployeeAttendanceSummary(p.id)
        setSummary(s)

        // Run smart attendance reminder check (hanya hari kerja, kecuali shift)
        checkAndSendSmartReminder({
          batasMasuk: s?.batasAbsenMasuk,
          mulaiPulang: s?.mulaiAbsenPulang,
          sudahMasuk: s?.sudahAbsenMasuk,
          sudahPulang: s?.sudahAbsenPulang,
          isShift: Boolean((s as any)?.isShift || (s as any)?.jadwalShift)
        })
      }
      if (session?.user?.id) {
        const u = await getUnreadCount(session.user.id)
        setUnread(u)
      }
      const [pgm, lb] = await Promise.all([
        getPengumumanAktif(),
        getLeaderboard()
      ])
      setPengumuman(pgm)
      setDisiplinTop(lb.slice(0, 10))
    } catch {}
  }

  const handleToggleReminder = async () => {
    if (!isReminderActive) {
      const granted = await requestPushPermission()
      if (granted) {
        setIsReminderActive(true)
        toast.success("Pengingat presensi (Web Push) berhasil diaktifkan!")
      } else {
        toast.error("Izin notifikasi tidak diizinkan di peramban.")
      }
    } else {
      toggleReminder(false)
      setIsReminderActive(false)
      toast.info("Pengingat presensi dinonaktifkan.")
    }
  }

  const handleSyncOffline = async () => {
    const toastId = toast.loading("Menyinkronkan antrian offline...")
    try {
      const { synced } = await syncMobileOfflineQueue()
      if (synced > 0) {
        toast.success(`${synced} presensi offline berhasil terkirim ke server!`, { id: toastId })
      } else {
        toast.info("Tidak ada presensi yang perlu disinkronkan.", { id: toastId })
      }
      await checkOfflineQueue()
      await fetchData()
    } catch {
      toast.error("Gagal menyinkronkan data offline.", { id: toastId })
    }
  }

  const today = new Date()
  const monthName = format(today, "MMMM", { locale: idLocale })
  const userRole = ((session?.user as any)?.role || "").toUpperCase()
  const isHrdOrAdmin = ["SUPERADMIN", "ADMIN", "HRD", "DIREKSI"].includes(userRole) || 
                       (session?.user?.name || "").toLowerCase().includes("admin")
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
    <div className="min-h-screen pb-24 font-sans bg-zinc-50 dark:bg-[#09090b]">

      {/* ===== HERO HEADER ===== */}
      <div 
        className="relative px-5 pb-28 pt-4 bg-zinc-950 text-white overflow-hidden border-b border-zinc-800/80"
        style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top))" }}
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

            {/* Notification & Reminder Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleReminder}
                className={cn(
                  "flex items-center justify-center h-9 w-9 rounded-full border transition-colors",
                  isReminderActive 
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                    : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
                )}
                title={isReminderActive ? "Pengingat Absen Aktif" : "Aktifkan Pengingat Absen"}
              >
                {isReminderActive ? <BellRing className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              </button>

              <Link 
                href="/m/notifikasi" 
                className="relative flex items-center justify-center h-9 w-9 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
              >
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white ring-2 ring-zinc-950">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* User Profile Summary */}
          <div className="flex flex-col mt-2">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-[11px] font-medium tracking-wide uppercase">
                {greeting}
              </span>
              <DigitalClock />
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

                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 text-[11px] font-medium truncate max-w-[200px]">
                    {jabatan}{subBidang ? ` · ${subBidang}` : ""}
                  </span>
                  {bidang && (
                    <span className="text-zinc-400 text-[11px] font-normal truncate max-w-[150px]">
                      {bidang}
                    </span>
                  )}
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
          <div className="rounded-2xl p-3.5 bg-zinc-900 text-white border border-zinc-800 shadow-sm flex items-center justify-between gap-3 animate-in fade-in-50">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <CloudUpload className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">Antrian Offline ({offlineQueueCount})</p>
                <p className="text-[11px] text-zinc-400 truncate">Siap dikirim ke server</p>
              </div>
            </div>
            <button
              onClick={handleSyncOffline}
              className="px-3 py-1.5 rounded-xl bg-white text-zinc-900 text-xs font-bold active:scale-95 transition-transform shadow-xs shrink-0"
            >
              Sync Sekarang
            </button>
          </div>
        )}

        {/* ===== FITUR KHUSUS HRD: LIVE RADAR KEHADIRAN ===== */}
        {isHrdOrAdmin && (
          <Link href="/m/radar" className="block active:scale-98 transition-all">
            <div className="rounded-2xl p-4 bg-zinc-900 text-white border border-zinc-800 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center relative">
                    <Radio className="h-4.5 w-4.5" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold tracking-tight">Live Radar Kehadiran</p>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-white/10 text-zinc-300 font-bold uppercase">HRD</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Monitoring realtime & nudge WhatsApp</p>
                  </div>
                </div>
                <div className="h-7 w-7 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
                  <ChevronRight className="h-4 w-4 text-zinc-300" />
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Kontrak Warning */}
        {summary?.sisaKontrak !== undefined && summary.sisaKontrak <= 60 && (
          <div className="rounded-2xl p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <p className="font-semibold">Masa Kontrak Segera Berakhir</p>
              <p className="text-amber-700 dark:text-amber-300 mt-0.5">Sisa <strong>{summary.sisaKontrak} hari</strong>. Koordinasikan pembaruan dengan HRD.</p>
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

            {(() => {
              if (!summary) return null
              const currentHour = new Date().getHours()
              const batasMasukH = parseInt(summary.batasAbsenMasuk?.split(":")[0]) || 14
              const mulaiPulangH = parseInt(summary.mulaiAbsenPulang?.split(":")[0]) || 15
              const batasPulangH = parseInt(summary.batasAbsenPulang?.split(":")[0]) || 18

              if (summary.sudahAbsenPulang) {
                return (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Selesai
                  </div>
                )
              }

              if (!summary.sudahAbsenMasuk) {
                if (currentHour >= batasMasukH) {
                  return (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 text-xs font-medium">
                      <XCircle className="h-3.5 w-3.5" /> Sesi Tutup
                    </div>
                  )
                }
                return (
                  <Link href="/m/fingerprint">
                    <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold shadow-xs active:scale-95 transition-all">
                      <Pointer className="h-3.5 w-3.5" />
                      Check-In
                    </button>
                  </Link>
                )
              } else {
                if (currentHour < mulaiPulangH) {
                  return (
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-full text-zinc-500 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-medium">
                      <Clock className="h-3.5 w-3.5" /> Belum Pulang
                    </div>
                  )
                }
                if (currentHour >= batasPulangH) {
                  return (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 text-xs font-medium">
                      <XCircle className="h-3.5 w-3.5" /> Berakhir
                    </div>
                  )
                }
                return (
                  <Link href="/m/fingerprint">
                    <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold shadow-xs active:scale-95 transition-all">
                      <Pointer className="h-3.5 w-3.5" />
                      Check-Out
                    </button>
                  </Link>
                )
              }
            })()}
          </div>

          {/* Jam masuk & pulang tiles */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-700/60 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-500/20">
                <Clock className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Jam Masuk</p>
                <p className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 tabular-nums">
                  {summary?.waktuAbsen ? summary.waktuAbsen.split(" - ")[0] : "--:--"}
                </p>
              </div>
            </div>

            <div className="rounded-xl p-3.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-700/60 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-zinc-200/70 dark:bg-zinc-700/50 text-zinc-700 dark:text-zinc-300 shrink-0 border border-zinc-300/40 dark:border-zinc-600/40">
                <Clock className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Jam Pulang</p>
                <p className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 tabular-nums">
                  {summary?.waktuAbsen?.includes(" - ") ? summary.waktuAbsen.split(" - ")[1] || "--:--" : "--:--"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ===== PENGUMUMAN TICKER ===== */}
        {pengumuman.length > 0 && <PengumumanTicker items={pengumuman} />}

        {/* ===== BANNER OP.PNG (DIPERTAHANKAN SESUAI PERINTAH USER) ===== */}
        <div className="rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 shadow-xs bg-white dark:bg-zinc-900">
          <Image
            src={`/op.png?v=${Date.now()}`}
            alt="Jangan lupa absen masuk dan pulang!"
            width={800}
            height={300}
            className="w-full object-cover"
            priority
            unoptimized
          />
        </div>

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

          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Hadir", value: hadirCount, icon: UserCheck, color: "text-emerald-600 dark:text-emerald-400" },
              { label: "Sakit", value: sakitCount, icon: Thermometer, color: "text-amber-600 dark:text-amber-400" },
              { label: "Izin",  value: izinCount,  icon: FileText,    color: "text-sky-600 dark:text-sky-400" },
              { label: "Cuti",  value: pegawai?.saldoCuti ?? 0, icon: CalendarDays, color: "text-indigo-600 dark:text-indigo-400" },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div 
                  key={item.label} 
                  className="rounded-xl p-3 flex flex-col items-center gap-1 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800"
                >
                  <div className={cn("p-1.5 rounded-lg bg-white dark:bg-zinc-800 shadow-2xs", item.color)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tabular-nums leading-tight mt-0.5">
                    {item.value}
                  </span>
                  <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-tight">
                    {item.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ===== MENU UTAMA ===== */}
        <div className="rounded-2xl p-5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3.5">
            Layanan Pegawai
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {menuItems.map((item, i) => {
              const Icon = item.icon
              return (
                <Link key={i} href={item.href}>
                  <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-95 group">
                    <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-2xs border border-zinc-200/70 dark:border-zinc-700/60 group-hover:text-zinc-950 dark:group-hover:text-white">
                      <Icon className="h-5 w-5 stroke-[1.8]" />
                    </div>
                    <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 text-center leading-tight whitespace-pre-line">
                      {item.label}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* ===== LEADERBOARD DISIPLIN ===== */}
        <div className="rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <div className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Peringkat Disiplin</p>
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">Top Performa Hari Ini</p>
              </div>
              <span className="text-[11px] font-medium text-zinc-400">
                {format(today, "dd MMM yyyy", { locale: idLocale })}
              </span>
            </div>
          </div>

          {disiplinTop.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-400">
              Belum ada kalkulasi indeks disiplin untuk hari ini
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {(showAllLeaderboard ? disiplinTop : disiplinTop.slice(0, 5)).map((p, idx) => (
                <div 
                  key={p.pegawaiId} 
                  className={cn(
                    "flex items-center gap-3 px-5 py-3 transition-colors",
                    idx === 0 ? "bg-zinc-50/70 dark:bg-zinc-800/30" : ""
                  )}
                >
                  <RankBadge rank={p.rank} />

                  <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700">
                    {p.fotoUrl ? (
                      <img src={p.fotoUrl} className="h-full w-full object-cover" alt="" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                        {p.nama?.charAt(0) || "U"}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {p.nama}
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                      {p.unit || p.jabatan || "-"}
                    </p>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                      {p.totalSkor}
                    </span>
                    <span className="text-[9px] text-zinc-400">/100</span>
                  </div>
                </div>
              ))}

              {disiplinTop.length > 5 && (
                <button
                  onClick={() => setShowAllLeaderboard(v => !v)}
                  className="w-full py-3 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center gap-1.5 transition-colors bg-zinc-50/50 dark:bg-zinc-800/20"
                >
                  {showAllLeaderboard ? (
                    <>Tampilkan Lebih Sedikit</>
                  ) : (
                    <>Lihat Top 10 Selengkapnya <ChevronRight className="h-3.5 w-3.5" /></>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center pt-2 pb-6">
          <p className="text-[11px] text-zinc-400 font-medium">
            ASIK Mobile · Perumdam Tirta Ardhia Rinjani
          </p>
        </div>

      </div>
    </div>
  )
}
