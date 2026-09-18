'use client'

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { AnalyticsCharts } from "@/components/simpeg/dashboard/analytics-charts"
import { ApprovalPanel } from "@/components/simpeg/dashboard/approval-panel"
import { getDashboardStats, getPegawaiDashboardStats } from "@/lib/actions/dashboard"
import { getLeaderboard } from "@/lib/actions/indeks"
import { TiaraAiOrb } from "@/components/simpeg/tiara-ai-orb"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import {
  Users,
  CalendarDays,
  Clock,
  Wallet,
  ClipboardList,
  ShieldCheck,
  Timer,
  BadgeCheck,
  BarChart3,
  ArrowRight,
  ChevronRight,
  ArrowUpCircle,
  X,
  ArrowRightLeft,
  Cake,
  Activity,
  UserCheck,
  LogOut,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock3,
  FileCheck2,
  TrendingUp,
  Trophy,
  Medal,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)
  const [approvalOpen, setApprovalOpen] = useState(false)
  const [alertTab, setAlertTab] = useState<"kontrak" | "kgb" | "pangkat" | "pensiun">("kontrak")
  const [periodFilter, setPeriodFilter] = useState<"mingguan" | "bulanan">("mingguan")

  useEffect(() => {
    setMounted(true)
    async function loadStats() {
      if (!session) return
      if (session.user?.role === "PEGAWAI") {
        const data = await getPegawaiDashboardStats((session.user as any).id)
        setStats(data)
      } else {
        const [data, lbData] = await Promise.all([
          getDashboardStats(),
          getLeaderboard()
        ])
        setStats(data)
        setLeaderboard(lbData || [])
      }
    }
    loadStats()
  }, [session])

  if (!mounted) return null

  const isPegawai = session?.user?.role === "PEGAWAI"

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-[#09090b]">
      <SidebarNav />
      
      <div className="flex flex-1 flex-col sidebar-offset min-w-0">
        <TopBar breadcrumb={["Dashboard & Analitik"]} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1520px] mx-auto w-full">

          {/* ============================================================
             1. EXECUTIVE HEADER & ACTIONS BAR (Clean SaaS Style)
             ============================================================ */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 p-5 rounded-2xl shadow-xs">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
                  Selamat Datang, {session?.user?.name || 'Administrator'}
                </h1>
                <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/60 dark:border-blue-900/60 text-[11px] font-semibold rounded-lg px-2 py-0.5">
                  {session?.user?.role || 'User'}
                </Badge>
              </div>
              <p className="text-xs sm:text-[13px] text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-2">
                <span>{format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })}</span>
                <span className="text-slate-300 dark:text-zinc-700">·</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">PDAM Tirta Ardhia Rinjani</span>
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center flex-wrap gap-2.5">
              {!isPegawai && (
                <>
                  <button
                    onClick={() => setApprovalOpen(true)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 transition-colors shadow-2xs"
                  >
                    <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Approval Center</span>
                    {stats?.approvalPending > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold px-1.5">
                        {stats.approvalPending}
                      </span>
                    )}
                  </button>

                  <Link
                    href="/absensi"
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 transition-colors shadow-2xs"
                  >
                    <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Rekap Presensi</span>
                  </Link>
                </>
              )}

              <Link
                href="/absensi/selfie"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
              >
                <Clock className="w-4 h-4" />
                <span>Presensi Selfie</span>
              </Link>
            </div>
          </div>

          {isPegawai ? (
            /* ============================================================
               PEGAWAI PERSONAL VIEW
               ============================================================ */
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SaaSKpiCard
                  title="Sisa Cuti Tahunan"
                  value={`${stats?.sisaCuti ?? 12}`}
                  unit="Hari"
                  icon={CalendarDays}
                  badgeText="Hak Cuti Aktif"
                  badgeColor="blue"
                  sub="Berlaku hingga akhir tahun"
                  href="/cuti"
                />
                <SaaSKpiCard
                  title="Status Presensi Hari Ini"
                  value={stats?.statusAbsensi || "Belum Absen"}
                  icon={BadgeCheck}
                  badgeText={stats?.waktuAbsen ? "Tercatat" : "Menunggu"}
                  badgeColor={stats?.statusAbsensi === "HADIR" ? "emerald" : "amber"}
                  sub={stats?.waktuAbsen ? `Masuk: ${stats.waktuAbsen}` : "Segera lakukan selfie check-in"}
                  href="/absensi/selfie"
                />
                <SaaSKpiCard
                  title="Gaji Terakhir"
                  value={stats?.gajiTerbaru ? `Rp ${(stats.gajiTerbaru / 1e6).toFixed(1)}Jt` : "Rp 0"}
                  icon={Wallet}
                  badgeText={stats?.periodeGaji || "Bulan Ini"}
                  badgeColor="blue"
                  sub="Rincian slip gaji resmi"
                  href="/slip-gaji"
                />
                <SaaSKpiCard
                  title="Pengajuan Pending"
                  value={stats?.pengajuanPending || "0"}
                  unit="Berkas"
                  icon={ClipboardList}
                  badgeText="Dalam Proses"
                  badgeColor="amber"
                  sub="Cuti, lembur, dan izin"
                  href="/approval"
                />
              </div>

              {/* Quick Action Selfie Card */}
              <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/15 text-white backdrop-blur-xs">
                    <Sparkles className="w-3.5 h-3.5" /> Presensi Biometrik Wajah
                  </span>
                  <h3 className="text-xl font-bold tracking-tight">Sudahkah Anda Melakukan Presensi Hari Ini?</h3>
                  <p className="text-xs text-blue-100/90 max-w-xl">
                    Gunakan kamera perangkat Anda untuk verifikasi wajah otomatis dan geolokasi GPS yang presisi dalam radius kantor PDAM.
                  </p>
                </div>
                <Link
                  href="/absensi/selfie"
                  className="px-5 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs transition-colors shadow-xs shrink-0 flex items-center gap-2"
                >
                  <Clock className="w-4 h-4 text-blue-600" />
                  Presensi Sekarang
                </Link>
              </div>
            </div>
          ) : (
            /* ============================================================
               SUPERADMIN / HRD / DIREKSI VIEW (Full SaaS Experience)
               ============================================================ */
            <div className="space-y-6">

              {/* ROW 1: 5 SAAS METRIC CARDS (Strictly No AI-Slop) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
                <SaaSKpiCard
                  title="Total Pegawai"
                  value={stats?.totalPegawai || "0"}
                  unit="Staf"
                  icon={Users}
                  badgeText="+2.4% bln ini"
                  badgeColor="emerald"
                  sub="SDM aktif terdaftar"
                  href="/pegawai"
                />
                <SaaSKpiCard
                  title="Kehadiran Hari Ini"
                  value={`${stats?.kehadiranHariIni?.persenHadir || 0}%`}
                  icon={BadgeCheck}
                  badgeText={`${stats?.kehadiranHariIni?.hadir || 0} hadir`}
                  badgeColor="emerald"
                  sub="Presensi terverifikasi"
                  href="/absensi"
                />
                <SaaSKpiCard
                  title="Approval Pending"
                  value={stats?.approvalPending || "0"}
                  unit="Berkas"
                  icon={ShieldCheck}
                  badgeText={stats?.approvalPending > 0 ? "Perlu Tindakan" : "Selesai"}
                  badgeColor={stats?.approvalPending > 0 ? "amber" : "neutral"}
                  sub="Cuti, mutasi & KGB"
                  onClick={() => setApprovalOpen(true)}
                />
                <SaaSKpiCard
                  title="Kontrak Habis"
                  value={stats?.kontrakHampirHabis?.filter((k: any) => k.sisaHari <= 30).length || "0"}
                  unit="Orang"
                  icon={Timer}
                  badgeText="≤ 30 hari"
                  badgeColor="red"
                  sub="Perlu evaluasi / SK"
                  href="/kontrak"
                />
                <SaaSKpiCard
                  title="Eligible KGB & Pkt"
                  value={(stats?.kgbList?.length || 0) + (stats?.pangkatList?.length || 0)}
                  unit="Orang"
                  icon={ArrowUpCircle}
                  badgeText="Siap Proses"
                  badgeColor="blue"
                  sub="KGB berkala & pangkat"
                  href="/kgb"
                />
              </div>

              {/* ROW 2: WORKFORCE OPERATIONS & HERO INSIGHT ROW */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* LEFT (7 cols): REAL-TIME ATTENDANCE STATUS */}
                <Card className="lg:col-span-7 bg-white dark:bg-[#111113] border border-slate-200/90 dark:border-zinc-800/90 rounded-xl shadow-2xs p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-zinc-800/70">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                          <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                            Distribusi Kehadiran Hari Ini
                          </h2>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                          Pemantauan kehadiran seluruh staf secara live
                        </p>
                      </div>

                      <Link
                        href="/absensi"
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 transition-colors"
                      >
                        Rekap Lengkap <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    {/* Overall Arrival Rate Meter */}
                    <div className="mt-4 p-3.5 rounded-lg bg-slate-50/80 dark:bg-zinc-900/50 border border-slate-200/60 dark:border-zinc-800/60">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300">Tingkat Kedatangan Pegawai</span>
                        <span className="text-sm font-bold font-mono text-slate-900 dark:text-zinc-100">
                          {stats?.kehadiranHariIni?.persenHadir || 0}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-200/70 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${stats?.kehadiranHariIni?.persenHadir || 0}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400 dark:text-zinc-500">
                        <span>Target Operasional: 95%</span>
                        <span>Total: {stats?.totalPegawai || 0} Staf</span>
                      </div>
                    </div>

                    {/* Breakdown Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3.5">
                      <div className="p-3 rounded-lg border border-emerald-100 dark:border-emerald-950/40 bg-emerald-50/40 dark:bg-emerald-950/20">
                        <p className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Tepat Waktu</p>
                        <p className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-1">
                          {stats?.kehadiranHariIni?.hadir || 0}
                        </p>
                      </div>

                      <div className="p-3 rounded-lg border border-amber-100 dark:border-amber-950/40 bg-amber-50/40 dark:bg-amber-950/20">
                        <p className="text-[10px] font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wider">Terlambat</p>
                        <p className="text-xl font-bold font-mono text-amber-700 dark:text-amber-300 mt-1">
                          {stats?.kehadiranHariIni?.terlambat || 0}
                        </p>
                      </div>

                      <div className="p-3 rounded-lg border border-blue-100 dark:border-blue-950/40 bg-blue-50/40 dark:bg-blue-950/20">
                        <p className="text-[10px] font-semibold text-blue-800 dark:text-blue-400 uppercase tracking-wider">Izin/Cuti/Sakit</p>
                        <p className="text-xl font-bold font-mono text-blue-700 dark:text-blue-300 mt-1">
                          {stats?.kehadiranHariIni?.sakitCuti || 0}
                        </p>
                      </div>

                      <div className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/40">
                        <p className="text-[10px] font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">Belum Absen</p>
                        <p className="text-xl font-bold font-mono text-slate-700 dark:text-zinc-300 mt-1">
                          {stats?.kehadiranHariIni?.belumAbsen || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3.5 mt-3.5 border-t border-slate-100 dark:border-zinc-800/70 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                    <span>Shift: 07:30 - 16:30 WITA</span>
                    <Link href="/kalender" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                      Kalender Kerja
                    </Link>
                  </div>
                </Card>

                {/* RIGHT (5 cols): TIARA ASSISTANT AI HERO BANNER */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-900 text-white rounded-xl p-5 shadow-2xs relative overflow-hidden flex-1 flex flex-col justify-between border border-blue-400/20">
                    
                    {/* Top Content with Lottie orb on the right */}
                    <div className="flex items-start justify-between gap-4 relative z-10">
                      <div className="space-y-2.5 flex-1 min-w-0">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-white/15 text-white backdrop-blur-xs border border-white/20 shadow-2xs">
                          <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" /> TIARA ASSISTANT AI
                        </span>
                        <h3 className="text-xl font-bold tracking-tight leading-snug">
                          Butuh Bantuan? Saya Asisten Tiara Siap Membantu Anda
                        </h3>
                        <p className="text-xs text-blue-100/90 leading-relaxed pr-2">
                          Asisten cerdas SIMPEG untuk analisis kehadiran, kalkulasi hak cuti & PPh 21, ringkasan SK, regulasi PDAM Tirta Ardhia Rinjani, hingga pembuatan draf dokumen otomatis.
                        </p>
                      </div>

                      {/* Lottie Animation inside the card */}
                      <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 relative flex items-center justify-center -mt-1 -mr-1">
                        <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl animate-pulse pointer-events-none" />
                        <TiaraAiOrb className="w-full h-full" />
                      </div>
                    </div>

                    {/* Bottom action bar */}
                    <div className="mt-5 pt-4 border-t border-white/15 flex items-center justify-between relative z-10">
                      <div className="text-xs">
                        <div className="flex items-center gap-1.5 text-blue-200 text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>AI Engine Aktif</span>
                        </div>
                        <p className="font-bold text-white text-xs mt-0.5">Tiara Assistant v2.0</p>
                      </div>
                      <Link
                        href="/assistant"
                        className="px-4 py-2 rounded-xl bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 hover:gap-2 group"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>Tanya Tiara Assistant</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>

                    {/* Decorative subtle background circle */}
                    <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
                  </div>
                </div>

              </div>

              {/* ROW 3: 3 EQUAL SEJAJAR CARDS (Aktivitas Terakhir, Peringkat Indeks Kinerja, Agenda & Notifikasi HRD) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">

                {/* CARD 1: AKTIVITAS TERAKHIR PEGAWAI */}
                <Card className="bg-white dark:bg-[#111113] border border-slate-200/90 dark:border-zinc-800/90 rounded-xl shadow-2xs p-4 sm:p-5 flex flex-col h-[460px]">
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-zinc-800/70 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                        <Activity className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                          Aktivitas Terakhir Pegawai
                        </h2>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                          Log presensi live
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/absensi"
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-0.5 transition-colors"
                    >
                      Semua <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>

                  <ScrollArea className="flex-1 mt-2 -mr-2 pr-2">
                    <div className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                      {stats?.aktivitasTerakhir && stats.aktivitasTerakhir.length > 0 ? (
                        stats.aktivitasTerakhir.map((act: any) => (
                          <div key={act.id} className="py-2.5 flex items-center justify-between gap-2.5 hover:bg-slate-50/60 dark:hover:bg-zinc-900/40 px-1.5 rounded-lg transition-colors">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Avatar className="h-7 w-7 shrink-0 ring-1 ring-slate-200 dark:ring-zinc-800">
                                <AvatarImage src={act.fotoUrl} alt={act.nama} />
                                <AvatarFallback className="text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                  {act.nama.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate">
                                  {act.nama}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">
                                  {act.jabatan}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={cn(
                                "text-[10px] font-semibold px-2 py-0.5 rounded-full border font-mono",
                                act.variant === 'success' && "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60",
                                act.variant === 'warning' && "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60",
                                act.variant === 'info' && "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60",
                                act.variant === 'neutral' && "bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
                              )}>
                                {act.statusBadge}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">
                                {act.waktu}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-16 text-center text-xs text-slate-400 italic">
                          Belum ada aktivitas presensi
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </Card>

                {/* CARD 2: PERINGKAT INDEKS KINERJA PEGAWAI BULAN INI */}
                <Card className="bg-white dark:bg-[#111113] border border-slate-200/90 dark:border-zinc-800/90 rounded-xl shadow-2xs p-4 sm:p-5 flex flex-col h-[460px]">
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-zinc-800/70 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                        <Trophy className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                          Peringkat Indeks Kinerja
                        </h2>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                          Top 5 pegawai bulan ini
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/indeks"
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-0.5 transition-colors"
                    >
                      Peringkat <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>

                  <ScrollArea className="flex-1 mt-2 -mr-2 pr-2">
                    <div className="space-y-2">
                      {leaderboard.length === 0 ? (
                        <div className="py-16 text-center text-xs text-slate-400 italic">
                          Belum ada penilaian indeks bulan ini
                        </div>
                      ) : (
                        leaderboard.slice(0, 5).map((lb: any, i: number) => {
                          const rankBadges = [
                            { label: "#1", bg: "bg-amber-500 text-white border-amber-600" },
                            { label: "#2", bg: "bg-slate-400 text-white border-slate-500" },
                            { label: "#3", bg: "bg-amber-700 text-white border-amber-800" },
                            { label: "#4", bg: "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700" },
                            { label: "#5", bg: "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700" },
                          ]
                          const badge = rankBadges[i] || rankBadges[4]

                          return (
                            <div
                              key={lb.id}
                              className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800/80 bg-slate-50/40 dark:bg-zinc-900/30 hover:bg-slate-50 dark:hover:bg-zinc-900/60 transition-colors"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className={cn("flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-mono font-bold border shrink-0", badge.bg)}>
                                  {badge.label}
                                </span>
                                <Avatar className="h-7 w-7 shrink-0 ring-1 ring-slate-200 dark:ring-zinc-800">
                                  <AvatarImage src={lb.fotoUrl} alt={lb.nama} />
                                  <AvatarFallback className="bg-blue-600 text-white font-bold text-[10px]">
                                    {lb.nama?.charAt(0) || 'P'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate">
                                    {lb.nama}
                                  </p>
                                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">
                                    {lb.bidang || lb.jabatan || 'Operasional'}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                                  {lb.totalSkor}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">poin</span>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </ScrollArea>
                </Card>

                {/* CARD 3: AGENDA & NOTIFIKASI HRD */}
                <Card className="bg-white dark:bg-[#111113] border border-slate-200/90 dark:border-zinc-800/90 rounded-xl shadow-2xs p-4 sm:p-5 flex flex-col h-[460px]">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-zinc-800/70 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                        <CalendarDays className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                          Agenda & Notifikasi HRD
                        </h2>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                          Jadwal berkala
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tab Selector Pills */}
                  <div className="flex items-center gap-1 p-1 bg-slate-100/80 dark:bg-zinc-900/80 rounded-lg my-2.5 text-[11px] font-semibold shrink-0">
                    <button
                      onClick={() => setAlertTab("kontrak")}
                      className={cn(
                        "flex-1 py-1 rounded-md transition-all text-center",
                        alertTab === "kontrak"
                          ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-2xs font-bold"
                          : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                      )}
                    >
                      Kontrak ({stats?.kontrakHampirHabis?.length || 0})
                    </button>
                    <button
                      onClick={() => setAlertTab("kgb")}
                      className={cn(
                        "flex-1 py-1 rounded-md transition-all text-center",
                        alertTab === "kgb"
                          ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-2xs font-bold"
                          : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                      )}
                    >
                      KGB ({stats?.kgbList?.length || 0})
                    </button>
                    <button
                      onClick={() => setAlertTab("pangkat")}
                      className={cn(
                        "flex-1 py-1 rounded-md transition-all text-center",
                        alertTab === "pangkat"
                          ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-2xs font-bold"
                          : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                      )}
                    >
                      Pkt ({stats?.pangkatList?.length || 0})
                    </button>
                    <button
                      onClick={() => setAlertTab("pensiun")}
                      className={cn(
                        "flex-1 py-1 rounded-md transition-all text-center",
                        alertTab === "pensiun"
                          ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-2xs font-bold"
                          : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                      )}
                    >
                      Pensiun ({stats?.pensiunTerdekat?.length || 0})
                    </button>
                  </div>

                  {/* Tab Contents */}
                  <ScrollArea className="flex-1 -mr-2 pr-2">
                    <div className="space-y-2">
                      {alertTab === "kontrak" && (
                        !stats?.kontrakHampirHabis?.length ? (
                          <div className="text-xs text-slate-400 italic text-center py-12">
                            Tidak ada kontrak mendekati batas
                          </div>
                        ) : (
                          stats.kontrakHampirHabis.map((k: any) => (
                            <div key={k.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800/80 bg-slate-50/40 dark:bg-zinc-900/30">
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate">{k.pegawai?.nama}</p>
                                <p className="text-[10px] text-slate-500 dark:text-zinc-400">{k.pegawai?.jabatan || 'Staf'}</p>
                              </div>
                              <span className={cn(
                                "text-[10px] font-bold font-mono px-2 py-0.5 rounded border",
                                k.sisaHari <= 14
                                  ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400"
                                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400"
                              )}>
                                {k.sisaHari} Hari
                              </span>
                            </div>
                          ))
                        )
                      )}

                      {alertTab === "kgb" && (
                        !stats?.kgbList?.length ? (
                          <div className="text-xs text-slate-400 italic text-center py-12">
                            Semua KGB telah terproses
                          </div>
                        ) : (
                          stats.kgbList.map((kgb: any) => (
                            <div key={kgb.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800/80 bg-slate-50/40 dark:bg-zinc-900/30">
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate">{kgb.pegawai?.nama}</p>
                                <p className="text-[10px] text-slate-500 dark:text-zinc-400">{kgb.pegawai?.jabatan || 'Staf'}</p>
                              </div>
                              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300">
                                {kgb.sisaHari <= 0 ? "Waktunya" : `H-${kgb.sisaHari}`}
                              </span>
                            </div>
                          ))
                        )
                      )}

                      {alertTab === "pangkat" && (
                        !stats?.pangkatList?.length ? (
                          <div className="text-xs text-slate-400 italic text-center py-12">
                            Tidak ada jadwal kenaikan pangkat
                          </div>
                        ) : (
                          stats.pangkatList.map((pkt: any) => (
                            <div key={pkt.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800/80 bg-slate-50/40 dark:bg-zinc-900/30">
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate">{pkt.pegawai?.nama}</p>
                                <p className="text-[10px] text-slate-500 dark:text-zinc-400">{pkt.pegawai?.jabatan || 'Staf'}</p>
                              </div>
                              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded border bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300">
                                {pkt.sisaHari <= 0 ? "Waktunya" : `H-${pkt.sisaHari}`}
                              </span>
                            </div>
                          ))
                        )
                      )}

                      {alertTab === "pensiun" && (
                        !stats?.pensiunTerdekat?.length ? (
                          <div className="text-xs text-slate-400 italic text-center py-12">
                            Tidak ada pegawai pensiun tahun ini
                          </div>
                        ) : (
                          stats.pensiunTerdekat.map((p: any) => (
                            <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800/80 bg-slate-50/40 dark:bg-zinc-900/30">
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate">{p.nama}</p>
                                <p className="text-[10px] text-slate-500 dark:text-zinc-400">{p.jabatan || 'Staf'}</p>
                              </div>
                              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded border bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300">
                                {Math.ceil(p.sisaHari / 30)} Bln Lagi
                              </span>
                            </div>
                          ))
                        )
                      )}
                    </div>
                  </ScrollArea>
                </Card>

              </div>

              {/* ROW 5: ANALYTICS CHARTS SECTION */}
              <Card className="bg-white dark:bg-[#111113] border border-slate-200/90 dark:border-zinc-800/90 rounded-xl shadow-2xs p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800/70">
                  <div>
                    <h2 className="text-[15px] font-bold text-slate-900 dark:text-zinc-100">
                      Analitik & Tren SDM Perusahaan
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Statistik kehadiran 7 hari kerja, beban payroll, dan distribusi unit kerja
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-zinc-900 rounded-xl text-xs font-semibold">
                    <button
                      onClick={() => setPeriodFilter("mingguan")}
                      className={cn(
                        "px-3 py-1 rounded-lg transition-all",
                        periodFilter === "mingguan" ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-2xs" : "text-slate-500 hover:text-slate-900 dark:text-zinc-400"
                      )}
                    >
                      Mingguan
                    </button>
                    <button
                      onClick={() => setPeriodFilter("bulanan")}
                      className={cn(
                        "px-3 py-1 rounded-lg transition-all",
                        periodFilter === "bulanan" ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-2xs" : "text-slate-500 hover:text-slate-900 dark:text-zinc-400"
                      )}
                    >
                      Bulanan
                    </button>
                  </div>
                </div>

                <div className="mt-5">
                  <AnalyticsCharts data={stats?.analytics} />
                </div>
              </Card>

              {/* ROW 6: DEMOGRAFI & ULANG TAHUN BULAN INI */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ULANG TAHUN BULAN INI */}
                <Card className="bg-white dark:bg-[#111113] border border-slate-200/90 dark:border-zinc-800/90 rounded-xl shadow-2xs p-5 sm:p-6">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/70">
                    <div className="flex items-center gap-2">
                      <Cake className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                        Ulang Tahun Bulan Ini
                      </h3>
                    </div>
                    <span className="text-xs font-medium text-slate-400">
                      {format(new Date(), "MMMM yyyy", { locale: id })}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-zinc-800/60 mt-2">
                    {!stats?.ulangTahunBulanIni?.length ? (
                      <div className="text-xs text-slate-400 italic text-center py-8">
                        Tidak ada pegawai yang berulang tahun bulan ini
                      </div>
                    ) : (
                      stats.ulangTahunBulanIni.map((person: any) => (
                        <div key={person.id} className="py-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold shrink-0">
                              {person.initials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate">{person.nama}</p>
                              <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">{person.jabatan}</p>
                            </div>
                          </div>
                          <span className="text-xs font-mono font-medium text-slate-600 dark:text-zinc-300 shrink-0">
                            {person.tanggal}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </Card>

                {/* STATUS SUMBER DAYA MANUSIA */}
                <Card className="bg-white dark:bg-[#111113] border border-slate-200/90 dark:border-zinc-800/90 rounded-xl shadow-2xs p-5 sm:p-6">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/70">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                        Ringkasan Komposisi SDM
                      </h3>
                    </div>
                    <Link href="/pegawai" className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
                      Kelola Pegawai
                    </Link>
                  </div>

                  <div className="space-y-3.5 mt-4">
                    {[
                      { label: "Pegawai Aktif", val: stats?.totalPegawai || 0, color: "bg-emerald-500", pct: 100 },
                      { label: "Sedang Cuti", val: stats?.pegawaiCuti || 0, color: "bg-blue-500", pct: Math.min(100, ((stats?.pegawaiCuti || 0) / (stats?.totalPegawai || 1)) * 100) },
                      { label: "Dalam Masa SP", val: stats?.pegawaiSP || 0, color: "bg-red-500", pct: Math.min(100, ((stats?.pegawaiSP || 0) / (stats?.totalPegawai || 1)) * 100) },
                      { label: "Kontrak Mendekati Akhir", val: stats?.kontrakHampirHabis?.filter((k: any) => k.sisaHari <= 30).length || 0, color: "bg-amber-500", pct: Math.min(100, ((stats?.kontrakHampirHabis?.filter((k: any) => k.sisaHari <= 30).length || 0) / (stats?.totalPegawai || 1)) * 200) },
                    ].map(({ label, val, color, pct }) => (
                      <div key={label}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-600 dark:text-zinc-300 font-medium">{label}</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">{val}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

              </div>

            </div>
          )}

        </main>

        {/* APPROVAL CENTER SLIDE-OVER DRAWER */}
        {approvalOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-16">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
              onClick={() => setApprovalOpen(false)}
            />
            <div className="relative z-10 w-full max-w-md h-[calc(100vh-80px)] flex flex-col bg-white dark:bg-[#111113] border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-right-10 duration-200">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-zinc-900/50">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">Approval Center</span>
                  {stats?.approvalPending > 0 && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">
                      {stats.approvalPending} Pending
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setApprovalOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4">
                  <ApprovalPanel />
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-slate-100 dark:border-zinc-800 shrink-0 bg-white dark:bg-[#111113]">
                <Link
                  href="/approval"
                  onClick={() => setApprovalOpen(false)}
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 transition-colors shadow-xs"
                >
                  Buka Modul Approval Penuh <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// ============================================================
// CLEAN SAAS KPI CARD COMPONENT (Inspired by Stripe & Linear)
// ============================================================
function SaaSKpiCard({
  title,
  value,
  unit,
  icon: Icon,
  badgeText,
  badgeColor = "emerald",
  sub,
  href,
  onClick,
}: {
  title: string
  value: any
  unit?: string
  icon: any
  badgeText?: string
  badgeColor?: "emerald" | "blue" | "amber" | "red" | "neutral"
  sub?: string
  href?: string
  onClick?: () => void
}) {
  const dotColor = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    red: "bg-rose-500",
    neutral: "bg-slate-400",
  }

  const textColor = {
    emerald: "text-emerald-700 dark:text-emerald-400",
    blue: "text-blue-700 dark:text-blue-400",
    amber: "text-amber-700 dark:text-amber-400",
    red: "text-rose-700 dark:text-rose-400",
    neutral: "text-slate-600 dark:text-zinc-400",
  }

  const content = (
    <div
      className={cn(
        "group relative bg-white dark:bg-[#111113] border border-slate-200/90 dark:border-zinc-800/90 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-150 shadow-2xs h-full",
        (href || onClick) && "hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-xs cursor-pointer"
      )}
    >
      {/* Top row: Clean title on left, subtle icon on right */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-medium text-slate-500 dark:text-zinc-400 truncate">
          {title}
        </span>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 dark:bg-zinc-800/60 text-slate-400 dark:text-zinc-400 group-hover:text-slate-600 dark:group-hover:text-zinc-200 transition-colors shrink-0">
          <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
        </div>
      </div>

      {/* Middle row: Crisp tabular figure */}
      <div className="mt-2.5">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl sm:text-[26px] font-bold font-mono tracking-tight text-slate-900 dark:text-zinc-100 leading-none">
            {value}
          </span>
          {unit && (
            <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">
              {unit}
            </span>
          )}
        </div>
      </div>

      {/* Bottom row: Clean minimal status/trend indicator */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between gap-1 text-[11px] min-h-[20px]">
        {badgeText ? (
          <span className={cn("inline-flex items-center gap-1.5 font-medium truncate text-[11px]", textColor[badgeColor])}>
            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotColor[badgeColor])} />
            {badgeText}
          </span>
        ) : (
          <span className="text-slate-400 dark:text-zinc-500 truncate text-[11px]">{sub || "—"}</span>
        )}
        {badgeText && sub && (
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 truncate hidden sm:inline text-right">
            {sub}
          </span>
        )}
      </div>
    </div>
  )

  if (onClick) {
    return (
      <button className="text-left w-full h-full focus:outline-none" onClick={onClick}>
        {content}
      </button>
    )
  }

  return href ? (
    <Link href={href} className="block h-full focus:outline-none">
      {content}
    </Link>
  ) : (
    content
  )
}
