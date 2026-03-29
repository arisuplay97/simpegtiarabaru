"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Bell, Camera, AlertCircle, ChevronRight,
  CalendarDays, Clock, Star, BookOpen,
  Shield, FileText, Fingerprint, TrendingUp,
  Briefcase, Award, ClipboardCheck, Settings,
  Wallet, Download, MessageCircle, HeartPulse,
  CreditCard, GraduationCap, UserCheck, Timer,
  ArrowUpRight, Zap, Building2, BadgeCheck
} from "lucide-react"
import { getEmployeeAttendanceSummary } from "@/lib/actions/absensi"
import { getUnreadCount } from "@/lib/actions/notifikasi"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import Link from "next/link"
import Image from "next/image"

function DigitalClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex flex-col items-end">
      <div className="text-[2rem] font-black text-white tracking-tight leading-none tabular-nums" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>
        {format(time, "HH:mm")}
        <span className="text-base opacity-60 font-medium">:{format(time, "ss")}</span>
      </div>
      <div className="text-[10px] font-medium text-white/60 mt-0.5 tracking-wide">
        {format(time, "EEE, dd MMM", { locale: idLocale })}
      </div>
    </div>
  )
}

// Feature grid items - colorful, rich set
const fiturUtama = [
  {
    href: "/m/selfie",
    icon: "🤳",
    label: "Absen\nSelfie",
    grad: "linear-gradient(135deg,#7c3aed,#6d28d9)",
    glow: "rgba(124,58,237,0.35)",
  },
  {
    href: "/m/cuti",
    icon: "🏖️",
    label: "Cuti &\nIzin",
    grad: "linear-gradient(135deg,#0ea5e9,#0284c7)",
    glow: "rgba(14,165,233,0.35)",
  },
  {
    href: "/m/absensi",
    icon: "📋",
    label: "Riwayat\nAbsensi",
    grad: "linear-gradient(135deg,#10b981,#059669)",
    glow: "rgba(16,185,129,0.35)",
  },
  {
    href: "/m/kalender",
    icon: "📅",
    label: "Kalender\nKerja",
    grad: "linear-gradient(135deg,#f59e0b,#d97706)",
    glow: "rgba(245,158,11,0.35)",
  },
  {
    href: "/m/indeks",
    icon: "⭐",
    label: "Indeks\nKinerja",
    grad: "linear-gradient(135deg,#ef4444,#dc2626)",
    glow: "rgba(239,68,68,0.35)",
  },
  {
    href: "/m/notifikasi",
    icon: "🔔",
    label: "Notifi-\nkasi",
    grad: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
    glow: "rgba(139,92,246,0.35)",
  },
  {
    href: "/m/profil",
    icon: "👤",
    label: "Profil\nSaya",
    grad: "linear-gradient(135deg,#64748b,#475569)",
    glow: "rgba(100,116,139,0.30)",
  },
  {
    href: "#",
    icon: "📊",
    label: "Laporan\nBulanan",
    grad: "linear-gradient(135deg,#ec4899,#db2777)",
    glow: "rgba(236,72,153,0.35)",
  },
]

// Extended features
const fiturTambahan = [
  {
    href: "/m/cuti",
    icon: CalendarDays,
    label: "Pengajuan Cuti",
    desc: "Buat & pantau status cuti",
    color: "#0ea5e9",
    bg: "#f0f9ff",
    iconBg: "#bae6fd",
  },
  {
    href: "#",
    icon: CreditCard,
    label: "Slip Gaji",
    desc: "Lihat slip gaji bulanan",
    color: "#10b981",
    bg: "#f0fdf4",
    iconBg: "#bbf7d0",
  },
  {
    href: "#",
    icon: GraduationCap,
    label: "Pelatihan & Diklat",
    desc: "Jadwal & sertifikasi pelatihan",
    color: "#f59e0b",
    bg: "#fffbeb",
    iconBg: "#fde68a",
  },
  {
    href: "#",
    icon: Briefcase,
    label: "Tugas Luar",
    desc: "Ajukan perjalanan dinas",
    color: "#8b5cf6",
    bg: "#faf5ff",
    iconBg: "#ddd6fe",
  },
  {
    href: "#",
    icon: Timer,
    label: "Lembur",
    desc: "Ajukan & pantau lembur",
    color: "#ef4444",
    bg: "#fff5f5",
    iconBg: "#fecaca",
  },
  {
    href: "#",
    icon: HeartPulse,
    label: "BPJS Kesehatan",
    desc: "Info & kartu BPJS",
    color: "#ec4899",
    bg: "#fdf2f8",
    iconBg: "#fbcfe8",
  },
  {
    href: "#",
    icon: Award,
    label: "Prestasi & SP",
    desc: "Riwayat penghargaan & SP",
    color: "#f97316",
    bg: "#fff7ed",
    iconBg: "#fed7aa",
  },
  {
    href: "#",
    icon: UserCheck,
    label: "Data Kehadiran",
    desc: "Resume kehadiran lengkap",
    color: "#14b8a6",
    bg: "#f0fdfa",
    iconBg: "#99f6e4",
  },
]

export default function MobileDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [summary, setSummary] = useState<any>(null)
  const [pegawai, setPegawai] = useState<any>(null)
  const [unread, setUnread] = useState(0)
  const [greeting, setGreeting] = useState("")
  const [greetEmoji, setGreetEmoji] = useState("☀️")

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 10) { setGreeting("Selamat Pagi"); setGreetEmoji("🌅") }
    else if (hour < 15) { setGreeting("Selamat Siang"); setGreetEmoji("☀️") }
    else if (hour < 18) { setGreeting("Selamat Sore"); setGreetEmoji("🌇") }
    else { setGreeting("Selamat Malam"); setGreetEmoji("🌙") }
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
    } catch {}
  }

  const today = new Date()
  const monthName = format(today, "MMMM", { locale: idLocale })
  const firstName = session?.user?.name?.split(" ")[0] ?? "Kawan"
  const fullName = session?.user?.name ?? "Pegawai"
  const jabatan = (session?.user as any)?.jabatan || "Staff"
  const bidang = pegawai?.bidang?.nama || ""

  const hadirCount = summary?.hadir || 0
  const sakitCount = summary?.sakit || 0
  const izinCount = summary?.izin || 0
  const cutiCount = summary?.cuti || 0
  const totalWorkdays = hadirCount + sakitCount + izinCount + cutiCount

  return (
    <div className="min-h-screen pb-28 font-sans" style={{ background: "linear-gradient(160deg,#f5f3ff 0%,#eff6ff 40%,#f0fdf4 100%)" }}>

      {/* ===== HERO HEADER ===== */}
      <div
        className="relative overflow-hidden pt-14 pb-36 px-5"
        style={{
          background: "linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#a855f7 100%)",
        }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full opacity-20" style={{ background: "radial-gradient(circle,#fff,transparent)" }} />
        <div className="absolute top-24 -left-10 h-40 w-40 rounded-full opacity-10" style={{ background: "radial-gradient(circle,#fff,transparent)" }} />
        <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full opacity-10" style={{ background: "radial-gradient(circle,#fff,transparent)" }} />
        {/* Mesh lines */}
        <svg className="absolute inset-0 w-full h-full opacity-5" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <div className="relative z-10">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-6">
            {/* Brand */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-white font-black text-sm tracking-tight leading-none">SIMPEG</p>
                <p className="text-white/60 text-[9px] font-medium leading-none mt-0.5">PDAM Tirta Ardhia Rinjani</p>
              </div>
            </div>

            {/* Right icons */}
            <div className="flex items-center gap-2">
              <Link href="/m/notifikasi" className="relative">
                <div className="flex items-center justify-center h-9 w-9 rounded-2xl" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)" }}>
                  <Bell className="h-4 w-4 text-white" />
                </div>
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white border border-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              <Link href="/m/profil">
                <div className="h-9 w-9 rounded-full overflow-hidden border-2 border-white/40" style={{ background: "rgba(255,255,255,0.15)" }}>
                  {(session?.user as any)?.image ? (
                    <img src={(session?.user as any).image} className="h-full w-full object-cover" alt="" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-black text-white uppercase">
                      {session?.user?.name?.charAt(0) ?? "U"}
                    </div>
                  )}
                </div>
              </Link>
            </div>
          </div>

          {/* Welcome + Clock */}
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-base">{greetEmoji}</span>
                <p className="text-white/70 text-[11px] font-semibold tracking-wider uppercase">{greeting}</p>
              </div>
              <h1 className="text-[1.6rem] font-black text-white leading-tight" style={{ textShadow: "0 2px 16px rgba(0,0,0,0.2)" }}>
                Selamat Datang<br />
                Kembali, <span className="text-yellow-300">{firstName}</span> 👋
              </h1>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
                <BadgeCheck className="h-3 w-3 text-emerald-300" />
                <p className="text-white/90 text-[10px] font-semibold">{jabatan}{bidang ? ` · ${bidang}` : ""}</p>
              </div>
            </div>
            <DigitalClock />
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="relative z-20 -mt-28 px-4 space-y-5">

        {/* Masa Kontrak Warning */}
        {summary?.sisaKontrak !== undefined && summary.sisaKontrak <= 60 && (
          <div className="rounded-2xl overflow-hidden shadow-lg" style={{ background: "linear-gradient(135deg,#fef3c7,#fde68a)", border: "1px solid #fcd34d" }}>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-amber-500 shrink-0">
                <AlertCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-[12px] font-black text-amber-900">⚠ Masa Kontrak Segera Berakhir</p>
                <p className="text-[10px] text-amber-700 mt-0.5">Sisa <strong>{summary.sisaKontrak} hari</strong> – segera koordinasi dengan HRD.</p>
              </div>
            </div>
          </div>
        )}

        {/* ===== STATUS HARI INI CARD ===== */}
        <div className="rounded-3xl overflow-hidden shadow-xl" style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.8)" }}>
          {/* Card header */}
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-violet-500">Status Hari Ini</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">{format(today, "EEEE, dd MMMM yyyy", { locale: idLocale })}</p>
              </div>
              <Link href="/m/selfie">
                <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-[11px] font-black shadow-lg active:scale-95 transition-transform"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 6px 16px rgba(124,58,237,0.4)" }}>
                  <Camera className="h-3.5 w-3.5" />
                  Absen Sekarang
                </div>
              </Link>
            </div>

            {/* Jam masuk & pulang */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-3.5 flex items-center gap-3" style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "1px solid #bbf7d0" }}>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-md" style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", boxShadow: "0 4px 12px rgba(34,197,94,0.4)" }}>
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Masuk</p>
                  <p className="text-base font-black text-gray-800 mt-0.5 tabular-nums">
                    {summary?.waktuAbsen ? summary.waktuAbsen.split(" - ")[0] : "--:--"}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl p-3.5 flex items-center gap-3" style={{ background: "linear-gradient(135deg,#f8fafc,#f1f5f9)", border: "1px solid #e2e8f0" }}>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-md" style={{ background: "linear-gradient(135deg,#64748b,#475569)", boxShadow: "0 4px 12px rgba(100,116,139,0.35)" }}>
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

        {/* ===== QUICK ACTION CHIPS ===== */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x">
          {[
            { href: "/m/selfie", icon: Fingerprint, label: "Absen Selfie", color: "#7c3aed", bg: "#faf5ff", border: "#ddd6fe" },
            { href: "/m/cuti", icon: CalendarDays, label: "Ajukan Cuti", color: "#0ea5e9", bg: "#f0f9ff", border: "#bae6fd" },
            { href: "#", icon: Briefcase, label: "Tugas Luar", color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
            { href: "#", icon: Timer, label: "Lembur", color: "#ef4444", bg: "#fff1f2", border: "#fecaca" },
            { href: "/m/notifikasi", icon: Bell, label: "Notifikasi", color: "#8b5cf6", bg: "#faf5ff", border: "#ddd6fe" },
          ].map((q, i) => {
            const Icon = q.icon
            return (
              <Link key={i} href={q.href} className="snap-start shrink-0">
                <div className="flex items-center gap-2 rounded-full px-3.5 py-2.5 active:scale-95 transition-transform"
                  style={{ background: q.bg, border: `1.5px solid ${q.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <Icon className="h-4 w-4 shrink-0" style={{ color: q.color }} />
                  <span className="text-[11px] font-black whitespace-nowrap" style={{ color: q.color }}>{q.label}</span>
                </div>
              </Link>
            )
          })}
        </div>

        {/* ===== BANNER OP.PNG (di atas rekap absensi) ===== */}
        <div className="rounded-3xl overflow-hidden shadow-xl" style={{ border: "2px solid rgba(255,255,255,0.9)" }}>
          <Image
            src="/op.png"
            alt="Jangan lupa absen masuk dan pulang!"
            width={800}
            height={300}
            className="w-full object-cover"
            priority
          />
        </div>

        {/* ===== REKAP PRESENSI ===== */}
        <div className="rounded-3xl overflow-hidden shadow-xl" style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.8)" }}>
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-violet-500">Rekap Presensi</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">Bulan {monthName}</p>
              </div>
              <Link href="/m/absensi" className="flex items-center gap-0.5 text-[11px] font-black text-violet-600">
                Lihat Semua <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Progress bar total kehadiran */}
            {totalWorkdays > 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-[10px] font-semibold text-gray-500 mb-1.5">
                  <span>Kehadiran Bulan Ini</span>
                  <span className="text-violet-600 font-black">{hadirCount} / {totalWorkdays} hari</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min((hadirCount / totalWorkdays) * 100, 100)}%`,
                      background: "linear-gradient(90deg,#7c3aed,#06b6d4)",
                    }}
                  />
                </div>
              </div>
            )}

            {/* 4 stats */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Hadir", value: hadirCount, icon: "✅", grad: "linear-gradient(135deg,#d1fae5,#a7f3d0)", text: "#065f46", numColor: "#059669", border: "#6ee7b7" },
                { label: "Sakit", value: sakitCount, icon: "🤒", grad: "linear-gradient(135deg,#fef3c7,#fde68a)", text: "#92400e", numColor: "#d97706", border: "#fcd34d" },
                { label: "Izin", value: izinCount, icon: "📝", grad: "linear-gradient(135deg,#dbeafe,#bfdbfe)", text: "#1e3a8a", numColor: "#2563eb", border: "#93c5fd" },
                { label: "Cuti", value: cutiCount, icon: "🏖️", grad: "linear-gradient(135deg,#ede9fe,#ddd6fe)", text: "#4c1d95", numColor: "#7c3aed", border: "#a78bfa" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl py-3.5 flex flex-col items-center gap-0.5 shadow-sm" style={{ background: item.grad, border: `1.5px solid ${item.border}` }}>
                  <span className="text-sm mb-0.5">{item.icon}</span>
                  <span className="text-xl font-black leading-none" style={{ color: item.numColor }}>{item.value}</span>
                  <span className="text-[9px] font-black uppercase tracking-wide" style={{ color: item.text }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== MENU UTAMA - Grid ICON (OVO style) ===== */}
        <div className="rounded-3xl overflow-hidden shadow-xl px-4 py-5" style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.8)" }}>
          <p className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-4">Menu Utama</p>
          <div className="grid grid-cols-4 gap-3">
            {fiturUtama.map((item, i) => (
              <Link key={i} href={item.href}>
                <div className="flex flex-col items-center gap-2 active:scale-90 transition-transform">
                  <div
                    className="h-14 w-14 rounded-[18px] flex items-center justify-center text-2xl shadow-lg"
                    style={{
                      background: item.grad,
                      boxShadow: `0 6px 18px ${item.glow}`,
                    }}
                  >
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-bold text-gray-600 text-center leading-tight whitespace-pre-line">
                    {item.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ===== KINERJA BANNER ===== */}
        <Link href="/m/indeks">
          <div className="rounded-3xl overflow-hidden shadow-xl active:scale-[0.98] transition-transform"
            style={{ background: "linear-gradient(135deg,#10b981 0%,#0ea5e9 100%)", boxShadow: "0 12px 32px rgba(16,185,129,0.3)" }}>
            <div className="flex items-center justify-between px-5 py-5">
              <div>
                <p className="text-white/70 text-[10px] font-black uppercase tracking-widest">Performa Kinerja</p>
                <p className="text-white font-black text-base mt-1">Lihat Indeks Kinerja Anda</p>
                <p className="text-white/70 text-[11px] mt-0.5">Pantau nilai dan evaluasi bulanan</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
                <div className="flex items-center gap-0.5 text-white/80 text-[10px] font-bold">
                  Lihat <ArrowUpRight className="h-3 w-3" />
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* ===== INFO SCROLL CARDS ===== */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-3 px-1">Informasi</p>
          <div className="flex gap-3 overflow-x-auto pb-1 snap-x scrollbar-hide -mx-0">
            {[
              {
                icon: "📢",
                title: "Masa Kontrak",
                desc: summary?.sisaKontrak !== undefined ? `${summary.sisaKontrak} hari tersisa` : "Tidak ada info",
                grad: "linear-gradient(135deg,#f59e0b,#ef4444)",
                shadow: "rgba(245,158,11,0.35)",
              },
              {
                icon: "🏆",
                title: "Total Hadir",
                desc: `${hadirCount} hari bulan ini`,
                grad: "linear-gradient(135deg,#10b981,#06b6d4)",
                shadow: "rgba(16,185,129,0.35)",
              },
              {
                icon: "📆",
                title: "Bulan Ini",
                desc: format(today, "MMMM yyyy", { locale: idLocale }),
                grad: "linear-gradient(135deg,#4f46e5,#8b5cf6)",
                shadow: "rgba(79,70,229,0.35)",
              },
              {
                icon: "⚡",
                title: "Quick Absen",
                desc: "Tap untuk absen cepat",
                grad: "linear-gradient(135deg,#ec4899,#8b5cf6)",
                shadow: "rgba(236,72,153,0.35)",
                href: "/m/selfie",
              },
            ].map((card, i) => (
              <Link key={i} href={(card as any).href || "#"} className="snap-start shrink-0">
                <div
                  className="w-40 rounded-2xl p-4 shadow-lg active:scale-95 transition-transform"
                  style={{ background: card.grad, boxShadow: `0 8px 24px ${card.shadow}` }}
                >
                  <div className="text-2xl mb-2">{card.icon}</div>
                  <p className="text-white font-black text-sm leading-tight">{card.title}</p>
                  <p className="text-white/75 text-[11px] mt-1">{card.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ===== FITUR TAMBAHAN - 2-column LIST ===== */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-3 px-1">Fitur & Layanan</p>
          <div className="grid grid-cols-2 gap-3">
            {fiturTambahan.map((f, i) => {
              const Icon = f.icon
              return (
                <Link key={i} href={f.href}>
                  <div className="rounded-2xl p-3.5 flex items-center gap-3 active:scale-95 transition-transform shadow-sm"
                    style={{ background: f.bg, border: `1.5px solid ${f.iconBg}` }}>
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: f.iconBg }}>
                      <Icon className="h-5 w-5" style={{ color: f.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-gray-800 leading-tight">{f.label}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-tight truncate">{f.desc}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* ===== LAYANAN LAINNYA - full list ===== */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-3 px-1">Pengaturan & Akun</p>
          <div className="rounded-3xl overflow-hidden shadow-lg" style={{ background: "rgba(255,255,255,0.95)", border: "1px solid rgba(255,255,255,0.8)" }}>
            {[
              { href: "/m/profil", icon: Shield, label: "Data Diri & Akun", desc: "Ubah profil dan kata sandi", color: "#7c3aed" },
              { href: "/m/kalender", icon: BookOpen, label: "Kalender Kerja", desc: "Hari libur dan jadwal kerja", color: "#0ea5e9" },
              { href: "/m/indeks", icon: Star, label: "Indeks Kinerja", desc: "Nilai kinerja dan evaluasi", color: "#f59e0b" },
              { href: "/m/notifikasi", icon: Bell, label: "Notifikasi", desc: "Pengumuman dan info terbaru", color: "#ec4899" },
              { href: "#", icon: Download, label: "Unduh Dokumen", desc: "SK, sertifikat, dan laporan", color: "#10b981" },
            ].map((item, i, arr) => {
              const Icon = item.icon
              return (
                <Link key={i} href={item.href}>
                  <div className={`flex items-center gap-4 px-5 py-4 active:bg-gray-50 transition-colors ${i < arr.length - 1 ? "border-b border-gray-50" : ""}`}>
                    <div className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center" style={{ background: `${item.color}18` }}>
                      <Icon className="h-4.5 w-4.5" style={{ color: item.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-gray-800">{item.label}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-5">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm shadow-sm">
            <Zap className="h-3 w-3 text-violet-400" />
            <p className="text-[10px] font-bold text-gray-500">SIMPEG · PDAM Tirta Ardhia Rinjani · v2.0</p>
          </div>
        </div>

      </div>
    </div>
  )
}
