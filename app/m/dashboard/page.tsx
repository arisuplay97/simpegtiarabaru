"use client"
import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Megaphone, Camera, AlertCircle, ChevronRight,
  CalendarDays, Clock, Star, BookOpen,
  Shield, Fingerprint, TrendingUp,
  Award, Timer, UserCheck,
  Building2, BadgeCheck, FileText,
  CreditCard, GraduationCap, Trophy, Medal,
  Bell
} from "lucide-react"
import { getEmployeeAttendanceSummary } from "@/lib/actions/absensi"
import { getUnreadCount } from "@/lib/actions/notifikasi"
import { getPengumumanAktif } from "@/lib/actions/notifikasi"
import { getLeaderboard } from "@/lib/actions/indeks"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import Link from "next/link"
import Image from "next/image"

// ─── Digital Clock ──────────────────────────────────────────────
function DigitalClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  return (
    <div className="flex flex-col items-end">
      <div className="text-[1.9rem] font-black text-white tracking-tight leading-none tabular-nums"
        style={{ textShadow: "0 2px 10px rgba(0,0,0,0.25)" }}>
        {format(time, "HH:mm")}
        <span className="text-sm opacity-50 font-medium">:{format(time, "ss")}</span>
      </div>
      <div className="text-[10px] font-medium text-white/60 mt-0.5">
        {format(time, "EEE, dd MMM", { locale: idLocale })}
      </div>
    </div>
  )
}

// ─── Pengumuman Marquee Ticker ──────────────────────────────────
function PengumumanTicker({ items }: { items: { title: string; message: string }[] }) {
  const [visible, setVisible] = useState(true)
  const [idx, setIdx] = useState(0)

  // Gabungkan semua pesan jadi satu teks panjang dengan pemisah
  const fullText = items.map(i => `📢 ${i.title}: ${i.message}`).join("   ·   ")

  if (!items.length) return null

  return (
    <div
      className="flex items-center gap-2 rounded-xl px-3 py-2.5 overflow-hidden"
      style={{
        background: "rgba(30,58,95,0.06)",
        border: "1px solid rgba(30,58,95,0.10)",
      }}
    >
      {/* Icon toa/megaphone */}
      <div className="shrink-0 flex items-center justify-center h-6 w-6 rounded-full"
        style={{ background: "rgba(30,58,95,0.12)" }}>
        <Megaphone className="h-3.5 w-3.5" style={{ color: "#1e3a5f" }} />
      </div>

      {/* Marquee wrapper */}
      <div className="flex-1 overflow-hidden relative" style={{ height: "18px" }}>
        <div
          className="absolute whitespace-nowrap text-[11px] font-semibold"
          style={{
            color: "#1e3a5f",
            animation: "marquee-scroll 18s linear infinite",
            top: 0,
            left: 0,
          }}
        >
          {fullText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{fullText}
        </div>
      </div>
    </div>
  )
}

// ─── Rank Badge ─────────────────────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <div className="flex shrink-0 h-7 w-7 items-center justify-center rounded-full bg-amber-100"><Trophy className="h-3.5 w-3.5 text-amber-600" /></div>
  if (rank === 2) return <div className="flex shrink-0 h-7 w-7 items-center justify-center rounded-full bg-slate-200"><Medal className="h-3.5 w-3.5 text-slate-500" /></div>
  if (rank === 3) return <div className="flex shrink-0 h-7 w-7 items-center justify-center rounded-full bg-orange-100"><Award className="h-3.5 w-3.5 text-orange-500" /></div>
  return <div className="flex shrink-0 h-7 w-7 items-center justify-center text-[10px] font-black text-gray-500 bg-gray-100 rounded-full">#{rank}</div>
}

// ─── Menu utama (6 menu, masing-masing unik) ────────────────────
const menuItems = [
  { href: "/m/selfie",    icon: Fingerprint,  label: "Absen\nSelfie"      },
  { href: "/m/cuti",      icon: CalendarDays, label: "Cuti &\nIzin"       },
  { href: "/m/absensi",   icon: FileText,     label: "Riwayat\nAbsensi"   },
  { href: "/m/kalender",  icon: BookOpen,     label: "Kalender\nKerja"    },
  { href: "/m/indeks",    icon: TrendingUp,   label: "Indeks\nKinerja"    },
  { href: "/m/profil",    icon: Shield,       label: "Data\nDiri"         },
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

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 10) setGreeting("Selamat Pagi")
    else if (hour < 15) setGreeting("Selamat Siang")
    else if (hour < 18) setGreeting("Selamat Sore")
    else setGreeting("Selamat Malam")
  }, [])

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
      // Load pengumuman ticker & leaderboard disiplin
      const [pgm, lb] = await Promise.all([
        getPengumumanAktif(),
        getLeaderboard()
      ])
      setPengumuman(pgm)
      setDisiplinTop(lb.slice(0, 10))
    } catch {}
  }

  const today = new Date()
  const monthName = format(today, "MMMM", { locale: idLocale })
  const firstName = session?.user?.name?.split(" ")[0] ?? "Kawan"
  const jabatan = (session?.user as any)?.jabatan || "Staff"
  const bidang = pegawai?.bidang?.nama || ""
  const fotoUrl = pegawai?.fotoUrl || (session?.user as any)?.image || null
  const namaInisial = session?.user?.name?.charAt(0)?.toUpperCase() ?? "U"

  const hadirCount = summary?.hadir || 0
  const sakitCount = summary?.sakit || 0
  const izinCount = summary?.izin || 0
  const cutiCount = summary?.cuti || 0
  const totalWorkdays = hadirCount + sakitCount + izinCount + cutiCount

  return (
    <div className="min-h-screen pb-28 font-sans" style={{ background: "#f0f4f8" }}>

      {/* ===== HERO HEADER ===== */}
      <div className="relative overflow-hidden pt-12 pb-40 px-5"
        style={{ background: "linear-gradient(145deg, #1e3a5f 0%, #1a2e4a 50%, #0d1b2e 100%)" }}>
        {/* Decorative */}
        <div className="absolute -top-12 -right-12 h-52 w-52 rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, #60a5fa, transparent)" }} />
        <div className="absolute bottom-0 -left-8 h-40 w-40 rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #93c5fd, transparent)" }} />
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" preserveAspectRatio="none">
          <defs><pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="white" />
          </pattern></defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        <div className="relative z-10">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)" }}>
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-white font-black text-[13px] tracking-tight leading-none">SIMPEG</p>
                <p className="text-white/50 text-[9px] font-medium leading-none mt-0.5">PDAM Tirta Ardhia Rinjani</p>
              </div>
            </div>
            {/* Notifikasi — 1 tombol */}
            <Link href="/m/notifikasi" className="relative">
              <div className="flex items-center justify-center h-9 w-9 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)" }}>
                <Bell className="h-4.5 w-4.5 text-white" />
              </div>
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white border border-[#1a2e4a]">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          </div>

          {/* Welcome row: foto kiri, teks tengah, jam kanan */}
          <div className="flex items-start gap-3">
            {/* Foto Profil */}
            <Link href="/m/profil">
              <div className="h-14 w-14 rounded-2xl overflow-hidden border-2 border-white/30 shrink-0"
                style={{ background: "rgba(255,255,255,0.1)" }}>
                {fotoUrl ? (
                  <img src={fotoUrl} className="h-full w-full object-cover" alt="" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl font-black text-white">
                    {namaInisial}
                  </div>
                )}
              </div>
            </Link>

            {/* Teks Sambutan */}
            <div className="flex-1 min-w-0">
              <p className="text-white/50 text-[10px] font-semibold tracking-widest uppercase">{greeting}</p>
              <h1 className="text-[1.25rem] font-black text-white leading-tight mt-0.5">
                Selamat Datang Kembali,{" "}
                <span className="text-blue-300">{firstName}</span> 👋
              </h1>
              <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <BadgeCheck className="h-3 w-3 text-blue-300 shrink-0" />
                <p className="text-white/80 text-[10px] font-semibold truncate max-w-[160px]">
                  {jabatan}{bidang ? ` · ${bidang}` : ""}
                </p>
              </div>
            </div>

            {/* Jam */}
            <DigitalClock />
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="relative z-20 -mt-32 px-4 space-y-4">

        {/* Kontrak Warning */}
        {summary?.sisaKontrak !== undefined && summary.sisaKontrak <= 60 && (
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "#fffbeb", border: "1.5px solid #fcd34d", boxShadow: "0 4px 16px rgba(245,158,11,0.2)" }}>
            <div className="flex items-start gap-3 px-4 py-3">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-amber-500 shrink-0 mt-0.5">
                <AlertCircle className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-black text-amber-900">Masa Kontrak Segera Berakhir</p>
                <p className="text-[10px] text-amber-700 mt-0.5">Sisa <strong>{summary.sisaKontrak} hari</strong>. Koordinasi dengan HRD segera.</p>
              </div>
            </div>
          </div>
        )}

        {/* ===== STATUS HARI INI ===== */}
        <div className="rounded-3xl overflow-hidden"
          style={{ background: "#ffffff", boxShadow: "0 8px 30px rgba(30,58,95,0.12)", border: "1px solid #e2eaf4" }}>
          <div className="px-5 pt-5 pb-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Status Hari Ini</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">
                  {format(today, "EEEE, dd MMMM yyyy", { locale: idLocale })}
                </p>
              </div>
              <Link href="/m/selfie">
                <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-[11px] font-black active:scale-95 transition-transform"
                  style={{ background: "linear-gradient(135deg, #1e3a5f, #2563eb)", boxShadow: "0 4px 14px rgba(37,99,235,0.35)" }}>
                  <Camera className="h-3.5 w-3.5" />
                  Absen
                </div>
              </Link>
            </div>

            {/* Jam masuk / pulang */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-3.5 flex items-center gap-3"
                style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "1px solid #bbf7d0" }}>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "#16a34a", boxShadow: "0 4px 12px rgba(22,163,74,0.3)" }}>
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-green-700 uppercase tracking-widest">Masuk</p>
                  <p className="text-base font-black text-gray-800 mt-0.5 tabular-nums">
                    {summary?.waktuAbsen ? summary.waktuAbsen.split(" - ")[0] : "--:--"}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl p-3.5 flex items-center gap-3"
                style={{ background: "linear-gradient(135deg,#f8fafc,#f1f5f9)", border: "1px solid #e2e8f0" }}>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "#475569", boxShadow: "0 4px 12px rgba(71,85,105,0.3)" }}>
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Pulang</p>
                  <p className="text-base font-black text-gray-800 mt-0.5 tabular-nums">
                    {summary?.waktuAbsen?.includes(" - ") ? summary.waktuAbsen.split(" - ")[1] || "--:--" : "--:--"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== PENGUMUMAN TICKER (antara jam & banner) ===== */}
        {pengumuman.length > 0 && <PengumumanTicker items={pengumuman} />}

        {/* ===== BANNER OP.PNG ===== */}
        <div className="rounded-3xl overflow-hidden"
          style={{ boxShadow: "0 6px 24px rgba(30,58,95,0.15)", border: "1.5px solid #e2eaf4" }}>
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
        <div className="rounded-3xl overflow-hidden"
          style={{ background: "#ffffff", boxShadow: "0 8px 30px rgba(30,58,95,0.10)", border: "1px solid #e2eaf4" }}>
          <div className="px-5 pt-5 pb-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Rekap Presensi</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">Bulan {monthName}</p>
              </div>
              <Link href="/m/absensi" className="flex items-center gap-0.5 text-[11px] font-bold text-blue-600">
                Lihat Semua <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {totalWorkdays > 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-[10px] font-semibold text-gray-400 mb-1.5">
                  <span>Tingkat Kehadiran</span>
                  <span className="text-blue-600 font-black">{hadirCount}/{totalWorkdays} hari</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full"
                    style={{
                      width: `${Math.min((hadirCount / totalWorkdays) * 100, 100)}%`,
                      background: "linear-gradient(90deg, #1e3a5f, #2563eb)",
                      transition: "width 0.7s ease"
                    }} />
                </div>
              </div>
            )}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Hadir", value: hadirCount, icon: UserCheck, bg: "#f0fdf4", border: "#bbf7d0", iconBg: "#16a34a", text: "#15803d" },
                { label: "Sakit", value: sakitCount, icon: Star,     bg: "#fffbeb", border: "#fde68a", iconBg: "#d97706", text: "#92400e" },
                { label: "Izin",  value: izinCount,  icon: FileText,  bg: "#eff6ff", border: "#bfdbfe", iconBg: "#2563eb", text: "#1e40af" },
                { label: "Cuti",  value: cutiCount,  icon: CalendarDays,bg:"#f0f9ff",border:"#bae6fd",iconBg:"#0284c7",text:"#075985"},
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="rounded-2xl py-3.5 flex flex-col items-center gap-1"
                    style={{ background: item.bg, border: `1.5px solid ${item.border}` }}>
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center mb-0.5"
                      style={{ background: item.iconBg }}>
                      <Icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-xl font-black leading-none" style={{ color: item.text }}>{item.value}</span>
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">{item.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ===== MENU UTAMA ===== */}
        <div className="rounded-3xl overflow-hidden"
          style={{ background: "#ffffff", boxShadow: "0 8px 30px rgba(30,58,95,0.10)", border: "1px solid #e2eaf4" }}>
          <div className="px-5 pt-5 pb-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-4">Menu Utama</p>
            <div className="grid grid-cols-3 gap-3">
              {menuItems.map((item, i) => {
                const Icon = item.icon
                return (
                  <Link key={i} href={item.href}>
                    <div className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
                      <div className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg"
                        style={{
                          background: "linear-gradient(135deg, #1e3a5f, #1d4ed8)",
                          boxShadow: "0 4px 14px rgba(30,58,95,0.3)"
                        }}>
                        <Icon className="h-6 w-6 text-white" strokeWidth={1.8} />
                      </div>
                      <span className="text-[10px] font-bold text-gray-700 text-center leading-tight whitespace-pre-line">
                        {item.label}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* ===== PEGAWAI DISIPLIN BULAN INI — Top 10 ===== */}
        <div className="rounded-3xl overflow-hidden"
          style={{ background: "#ffffff", boxShadow: "0 8px 30px rgba(30,58,95,0.10)", border: "1px solid #e2eaf4" }}>
          <div className="px-5 pt-5 pb-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Leaderboard</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">Pegawai Disiplin Bulan Ini</p>
              </div>
              <Link href="/m/indeks" className="flex items-center gap-0.5 text-[11px] font-bold text-blue-600">
                Selengkapnya <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {disiplinTop.length === 0 ? (
            <div className="px-5 pb-5 text-center">
              <p className="text-[11px] text-gray-400 py-6">Belum ada data indeks bulan ini</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 pb-3">
              {disiplinTop.map((p, idx) => (
                <div key={p.pegawaiId} className="flex items-center gap-3 px-5 py-3"
                  style={idx < 3 ? { background: "linear-gradient(90deg,#eff6ff,#ffffff)" } : {}}>
                  <RankBadge rank={p.rank} />
                  {/* Avatar */}
                  <div className="h-9 w-9 rounded-full overflow-hidden shrink-0 border-2 border-gray-100"
                    style={{ background: "#e0e7ff" }}>
                    {p.fotoUrl ? (
                      <img src={p.fotoUrl} className="h-full w-full object-cover" alt="" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-black text-blue-700">
                        {p.nama.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-gray-800 truncate">{p.nama}</p>
                    <p className="text-[10px] text-gray-400 truncate">{p.unit || p.jabatan}</p>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className={`text-base font-black leading-none ${
                      p.totalSkor >= 90 ? "text-green-600" :
                      p.totalSkor >= 80 ? "text-blue-600" : "text-amber-500"
                    }`}>{p.totalSkor}</span>
                    <span className="text-[9px] text-gray-400">/100</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-[10px] text-gray-400 font-medium">SIMPEG · PDAM Tirta Ardhia Rinjani · v2.0</p>
        </div>

      </div>
    </div>
  )
}
