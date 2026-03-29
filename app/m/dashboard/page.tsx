"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Bell, Camera, AlertCircle, ChevronRight,
  CalendarDays, Clock, Star, BookOpen,
  Shield, Fingerprint, TrendingUp,
  Award, Timer, UserCheck,
  Building2, BadgeCheck, FileText,
  CreditCard, GraduationCap
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
      <div
        className="text-[2rem] font-black text-white tracking-tight leading-none tabular-nums"
        style={{ textShadow: "0 2px 12px rgba(0,0,0,0.25)" }}
      >
        {format(time, "HH:mm")}
        <span className="text-base opacity-50 font-medium">:{format(time, "ss")}</span>
      </div>
      <div className="text-[10px] font-medium text-white/60 mt-0.5 tracking-wide">
        {format(time, "EEE, dd MMM", { locale: idLocale })}
      </div>
    </div>
  )
}

// Menu utama — 1 fungsi 1 tombol, semua ada halaman & berguna
const menuItems = [
  {
    href: "/m/selfie",
    icon: Fingerprint,
    label: "Absen Selfie",
    desc: "Absen masuk & pulang",
  },
  {
    href: "/m/cuti",
    icon: CalendarDays,
    label: "Cuti & Izin",
    desc: "Pengajuan cuti/izin",
  },
  {
    href: "/m/absensi",
    icon: FileText,
    label: "Riwayat Absensi",
    desc: "Histori kehadiran",
  },
  {
    href: "/m/kalender",
    icon: BookOpen,
    label: "Kalender Kerja",
    desc: "Jadwal & hari libur",
  },
  {
    href: "/m/indeks",
    icon: TrendingUp,
    label: "Indeks Kinerja",
    desc: "Nilai & evaluasi kinerja",
  },
  {
    href: "/m/profil",
    icon: Shield,
    label: "Data Diri",
    desc: "Profil & informasi akun",
  },
]

// Layanan tambahan — hanya yang benar-benar ada
const layananList = [
  {
    href: "/m/absensi",
    icon: UserCheck,
    label: "Rekap Kehadiran",
    desc: "Data presensi lengkap bulanan",
  },
  {
    href: "/m/indeks",
    icon: Award,
    label: "Prestasi & Kinerja",
    desc: "Indeks dan riwayat evaluasi",
  },
  {
    href: "/m/kalender",
    icon: Timer,
    label: "Jadwal & Shift",
    desc: "Kalender kerja dan shift",
  },
  {
    href: "/m/profil",
    icon: CreditCard,
    label: "Data Bank & BPJS",
    desc: "Info rekening dan kepesertaan",
  },
  {
    href: "/m/cuti",
    icon: GraduationCap,
    label: "Pengajuan",
    desc: "Cuti, izin, dan pengajuan lain",
  },
]

export default function MobileDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [summary, setSummary] = useState<any>(null)
  const [pegawai, setPegawai] = useState<any>(null)
  const [unread, setUnread] = useState(0)
  const [greeting, setGreeting] = useState("")

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
    } catch {}
  }

  const today = new Date()
  const monthName = format(today, "MMMM", { locale: idLocale })
  const firstName = session?.user?.name?.split(" ")[0] ?? "Kawan"
  const jabatan = (session?.user as any)?.jabatan || "Staff"
  const bidang = pegawai?.bidang?.nama || ""

  const hadirCount = summary?.hadir || 0
  const sakitCount = summary?.sakit || 0
  const izinCount = summary?.izin || 0
  const cutiCount = summary?.cuti || 0
  const totalWorkdays = hadirCount + sakitCount + izinCount + cutiCount

  return (
    <div className="min-h-screen pb-28 font-sans" style={{ background: "#f0f4f8" }}>

      {/* ===== HERO HEADER — navy blue like profil ===== */}
      <div
        className="relative overflow-hidden pt-12 pb-40 px-5"
        style={{
          background: "linear-gradient(145deg, #1e3a5f 0%, #1a2e4a 50%, #0d1b2e 100%)",
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-12 -right-12 h-52 w-52 rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, #60a5fa, transparent)" }} />
        <div className="absolute bottom-0 -left-8 h-40 w-40 rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #93c5fd, transparent)" }} />
        {/* Subtle dot grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" preserveAspectRatio="none">
          <defs>
            <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        <div className="relative z-10">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-7">
            {/* Brand */}
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

            {/* Notifikasi — SATU tombol saja */}
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

          {/* Welcome */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-white/50 text-[11px] font-semibold tracking-widest uppercase mb-1">
                {greeting}
              </p>
              <h1 className="text-[1.55rem] font-black text-white leading-tight"
                style={{ textShadow: "0 2px 16px rgba(0,0,0,0.3)" }}>
                Selamat Datang<br />
                Kembali, <span className="text-blue-300">{firstName}</span> 👋
              </h1>
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <BadgeCheck className="h-3 w-3 text-blue-300" />
                <p className="text-white/80 text-[10px] font-semibold">
                  {jabatan}{bidang ? ` · ${bidang}` : ""}
                </p>
              </div>
            </div>
            <DigitalClock />
          </div>
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="relative z-20 -mt-32 px-4 space-y-4">

        {/* Masa Kontrak Warning */}
        {summary?.sisaKontrak !== undefined && summary.sisaKontrak <= 60 && (
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "#fffbeb", border: "1.5px solid #fcd34d", boxShadow: "0 4px 16px rgba(245,158,11,0.2)" }}>
            <div className="flex items-start gap-3 px-4 py-3.5">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-amber-500 shrink-0 mt-0.5">
                <AlertCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-[12px] font-black text-amber-900">Masa Kontrak Segera Berakhir</p>
                <p className="text-[10px] text-amber-700 mt-0.5 leading-relaxed">
                  Sisa <strong>{summary.sisaKontrak} hari</strong>. Segera koordinasi dengan HRD.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ===== STATUS HARI INI ===== */}
        <div className="rounded-3xl overflow-hidden"
          style={{ background: "#ffffff", boxShadow: "0 8px 30px rgba(30,58,95,0.12)", border: "1px solid #e2eaf4" }}>
          <div className="px-5 pt-5 pb-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Status Hari Ini</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">
                  {format(today, "EEEE, dd MMMM yyyy", { locale: idLocale })}
                </p>
              </div>
              <Link href="/m/selfie">
                <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-[11px] font-black shadow-md active:scale-95 transition-transform"
                  style={{ background: "linear-gradient(135deg, #1e3a5f, #2563eb)", boxShadow: "0 4px 14px rgba(37,99,235,0.35)" }}>
                  <Camera className="h-3.5 w-3.5" />
                  Absen
                </div>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-3.5 flex items-center gap-3"
                style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", border: "1px solid #bbf7d0" }}>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "#16a34a", boxShadow: "0 4px 12px rgba(22,163,74,0.3)" }}>
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-green-700 uppercase tracking-widest">Jam Masuk</p>
                  <p className="text-base font-black text-gray-800 mt-0.5 tabular-nums">
                    {summary?.waktuAbsen ? summary.waktuAbsen.split(" - ")[0] : "--:--"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl p-3.5 flex items-center gap-3"
                style={{ background: "linear-gradient(135deg, #f8fafc, #f1f5f9)", border: "1px solid #e2e8f0" }}>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "#475569", boxShadow: "0 4px 12px rgba(71,85,105,0.3)" }}>
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Jam Pulang</p>
                  <p className="text-base font-black text-gray-800 mt-0.5 tabular-nums">
                    {summary?.waktuAbsen?.includes(" - ")
                      ? summary.waktuAbsen.split(" - ")[1] || "--:--"
                      : "--:--"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== BANNER OP.PNG ===== */}
        <div className="rounded-3xl overflow-hidden"
          style={{ boxShadow: "0 6px 24px rgba(30,58,95,0.15)", border: "1.5px solid #e2eaf4" }}>
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

            {/* Progress bar */}
            {totalWorkdays > 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-[10px] font-semibold text-gray-400 mb-1.5">
                  <span>Tingkat Kehadiran</span>
                  <span className="text-blue-600 font-black">{hadirCount}/{totalWorkdays} hari</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min((hadirCount / totalWorkdays) * 100, 100)}%`,
                      background: "linear-gradient(90deg, #1e3a5f, #2563eb)",
                      transition: "width 0.7s ease",
                    }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Hadir", value: hadirCount, icon: UserCheck, bg: "#f0fdf4", border: "#bbf7d0", iconBg: "#16a34a", text: "#15803d" },
                { label: "Sakit", value: sakitCount, icon: Star, bg: "#fffbeb", border: "#fde68a", iconBg: "#d97706", text: "#92400e" },
                { label: "Izin", value: izinCount, icon: FileText, bg: "#eff6ff", border: "#bfdbfe", iconBg: "#2563eb", text: "#1e40af" },
                { label: "Cuti", value: cutiCount, icon: CalendarDays, bg: "#f0f9ff", border: "#bae6fd", iconBg: "#0284c7", text: "#075985" },
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
                      <div
                        className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm"
                        style={{
                          background: "linear-gradient(135deg, #1e3a5f, #1d4ed8)",
                          boxShadow: "0 4px 14px rgba(30,58,95,0.3)",
                        }}
                      >
                        <Icon className="h-6 w-6 text-white" strokeWidth={1.8} />
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-gray-700 leading-tight">{item.label}</p>
                        <p className="text-[9px] text-gray-400 leading-tight mt-0.5 hidden">{item.desc}</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* ===== KINERJA BANNER ===== */}
        <Link href="/m/indeks">
          <div className="rounded-3xl overflow-hidden active:scale-[0.98] transition-transform"
            style={{
              background: "linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 100%)",
              boxShadow: "0 10px 30px rgba(30,58,95,0.3)",
            }}>
            <div className="flex items-center justify-between px-5 py-5">
              <div>
                <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">Performa Kinerja</p>
                <p className="text-white font-black text-base mt-1">Lihat Indeks Kinerja Anda</p>
                <p className="text-white/60 text-[11px] mt-0.5">Pantau nilai dan evaluasi bulanan</p>
              </div>
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)" }}>
                <TrendingUp className="h-7 w-7 text-white" strokeWidth={1.8} />
              </div>
            </div>
          </div>
        </Link>

        {/* ===== LAYANAN LAINNYA ===== */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-3 px-1">Layanan Lainnya</p>
          <div className="rounded-3xl overflow-hidden"
            style={{ background: "#ffffff", boxShadow: "0 4px 16px rgba(30,58,95,0.08)", border: "1px solid #e2eaf4" }}>
            {layananList.map((item, i, arr) => {
              const Icon = item.icon
              return (
                <Link key={i} href={item.href}>
                  <div className={`flex items-center gap-4 px-5 py-4 active:bg-blue-50/50 transition-colors ${i < arr.length - 1 ? "border-b border-gray-50" : ""}`}>
                    <div className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center"
                      style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                      <Icon className="h-5 w-5 text-blue-700" strokeWidth={1.8} />
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
        <div className="text-center py-4">
          <p className="text-[10px] text-gray-400 font-medium">SIMPEG · PDAM Tirta Ardhia Rinjani · v2.0</p>
        </div>

      </div>
    </div>
  )
}
