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
                <Card className="lg:col-span-7 bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xs p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800/70">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                          <h2 className="text-[15px] font-bold text-slate-900 dark:text-zinc-100">
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
                    <div className="mt-5 p-4 rounded-xl bg-slate-50/80 dark:bg-zinc-900/50 border border-slate-200/60 dark:border-zinc-800/60">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300">Tingkat Kedatangan Pegawai</span>
                        <span className="text-sm font-bold font-mono text-slate-900 dark:text-zinc-100">
                          {stats?.kehadiranHariIni?.persenHadir || 0}%
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-200/70 dark:bg-zinc-800 rounded-full overflow-hidden flex">
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
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                      <div className="p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-950/40 bg-emerald-50/40 dark:bg-emerald-950/20">
                        <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Hadir Tepat Waktu</p>
                        <p className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-1">
                          {stats?.kehadiranHariIni?.hadir || 0}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl border border-amber-100 dark:border-amber-950/40 bg-amber-50/40 dark:bg-amber-950/20">
                        <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wider">Terlambat</p>
                        <p className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-300 mt-1">
                          {stats?.kehadiranHariIni?.terlambat || 0}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl border border-blue-100 dark:border-blue-950/40 bg-blue-50/40 dark:bg-blue-950/20">
                        <p className="text-[11px] font-semibold text-blue-800 dark:text-blue-400 uppercase tracking-wider">Izin / Cuti / Sakit</p>
                        <p className="text-2xl font-bold font-mono text-blue-700 dark:text-blue-300 mt-1">
                          {stats?.kehadiranHariIni?.sakitCuti || 0}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/40">
                        <p className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">Belum Absen</p>
                        <p className="text-2xl font-bold font-mono text-slate-700 dark:text-zinc-300 mt-1">
                          {stats?.kehadiranHariIni?.belumAbsen || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-zinc-800/70 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                    <span>Shift Kantor: 07:30 - 16:30 WITA</span>
                    <Link href="/kalender" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                      Lihat Kalender Kerja
                    </Link>
                  </div>
                </Card>

                {/* RIGHT (5 cols): HERO INSIGHT BANNER (Matching reference style) */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white rounded-2xl p-6 shadow-xs relative overflow-hidden flex-1 flex flex-col justify-between">
                    <div className="space-y-3 relative z-10">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/15 text-white backdrop-blur-xs">
                        <Sparkles className="w-3 h-3" /> ANALITIK & PENGGAJIAN TERPADU
                      </span>
                      <h3 className="text-xl font-bold tracking-tight leading-snug">
                        Otomasi Kepegawaian & Kepatuhan PDAM Tirta Ardhia Rinjani
                      </h3>
                      <p className="text-xs text-blue-100/90 leading-relaxed">
                        Perhitungan PPh 21 TER, integrasi presensi selfie biometrik, pemantauan masa kontrak kerja, dan pengajuan berkas berjenjang dalam satu kendali terpusat.
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-white/15 flex items-center justify-between relative z-10">
                      <div className="text-xs">
                        <p className="text-blue-200">Sistem Berjalan</p>
                        <p className="font-bold text-white">Versi SIMPEG 2.0</p>
                      </div>
                      <Link
                        href="/payroll"
                        className="px-4 py-2 rounded-xl bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                      >
                        Buka Modul Payroll <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    {/* Decorative subtle background circle */}
                    <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
                  </div>
                </div>

              </div>

              {/* ROW 3: RECENT ACTIVITIES (AKTIVITAS TERAKHIR) & PRIORITY ALERTS TABS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* AKTIVITAS TERAKHIR (User explicit request: contoh aktivitas pegawai yang baru absen, out, dll) */}
                <Card className="lg:col-span-7 bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xs p-6 flex flex-col">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800/70">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-[15px] font-bold text-slate-900 dark:text-zinc-100">
                          Aktivitas Terakhir Pegawai
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                          Log masuk, pulang, dan presensi terverifikasi secara langsung
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/absensi"
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 transition-colors"
                    >
                      Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-zinc-800/60 flex-1">
                    {stats?.aktivitasTerakhir && stats.aktivitasTerakhir.length > 0 ? (
                      stats.aktivitasTerakhir.map((act: any) => (
                        <div key={act.id} className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 px-2 rounded-xl transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar className="h-9 w-9 shrink-0 ring-1 ring-slate-200 dark:ring-zinc-800">
                              <AvatarImage src={act.fotoUrl} alt={act.nama} />
                              <AvatarFallback className="text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                {act.nama.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-slate-900 dark:text-zinc-100 truncate">
                                {act.nama}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                                {act.jabatan} · <span className="text-slate-400 dark:text-zinc-500">{act.bidang}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className={cn(
                              "text-[11px] font-semibold px-2.5 py-1 rounded-full border",
                              act.variant === 'success' && "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60",
                              act.variant === 'warning' && "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60",
                              act.variant === 'info' && "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60",
                              act.variant === 'neutral' && "bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
                            )}>
                              {act.statusBadge}
                            </span>

                            <span className="text-xs font-mono font-medium text-slate-500 dark:text-zinc-400">
                              {act.waktu}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center text-xs text-slate-400 italic">
                        Belum ada aktivitas presensi tercatat hari ini
                      </div>
                    )}
                  </div>
                </Card>

                {/* PRIORITY AGENDA & ALERTS TABS (Kontrak, KGB, Pangkat, Pensiun) */}
                <Card className="lg:col-span-5 bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xs p-6 flex flex-col">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/70">
                    <div>
                      <h2 className="text-[15px] font-bold text-slate-900 dark:text-zinc-100">
                        Agenda & Notifikasi HRD
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        Jadwal berkala yang membutuhkan tindak lanjut
                      </p>
                    </div>
                  </div>

                  {/* Tab Selector Pills */}
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-zinc-900/80 rounded-xl my-3 text-xs font-semibold">
                    <button
                      onClick={() => setAlertTab("kontrak")}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg transition-all",
                        alertTab === "kontrak"
                          ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-2xs"
                          : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                      )}
                    >
                      Kontrak ({stats?.kontrakHampirHabis?.length || 0})
                    </button>
                    <button
                      onClick={() => setAlertTab("kgb")}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg transition-all",
                        alertTab === "kgb"
                          ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-2xs"
                          : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                      )}
                    >
                      KGB ({stats?.kgbList?.length || 0})
                    </button>
                    <button
                      onClick={() => setAlertTab("pangkat")}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg transition-all",
                        alertTab === "pangkat"
                          ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-2xs"
                          : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                      )}
                    >
                      Pangkat ({stats?.pangkatList?.length || 0})
                    </button>
                    <button
                      onClick={() => setAlertTab("pensiun")}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg transition-all",
                        alertTab === "pensiun"
                          ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-2xs"
                          : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                      )}
                    >
                      Pensiun ({stats?.pensiunTerdekat?.length || 0})
                    </button>
                  </div>

                  {/* Tab Contents */}
                  <ScrollArea className="flex-1 max-h-[320px] pr-2">
                    <div className="space-y-2">
                      {alertTab === "kontrak" && (
                        !stats?.kontrakHampirHabis?.length ? (
                          <div className="text-xs text-slate-400 italic text-center py-10">
                            Tidak ada kontrak pegawai yang mendekati batas habis
                          </div>
                        ) : (
                          stats.kontrakHampirHabis.map((k: any) => (
                            <div key={k.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200/70 dark:border-zinc-800/70 bg-slate-50/50 dark:bg-zinc-900/40">
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate">{k.pegawai?.nama}</p>
                                <p className="text-[11px] text-slate-500 dark:text-zinc-400">{k.pegawai?.jabatan || 'Staf'}</p>
                              </div>
                              <span className={cn(
                                "text-[10px] font-bold font-mono px-2 py-1 rounded-md border",
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
                          <div className="text-xs text-slate-400 italic text-center py-10">
                            Semua Kenaikan Gaji Berkala (KGB) telah terproses
                          </div>
                        ) : (
                          stats.kgbList.map((kgb: any) => (
                            <div key={kgb.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200/70 dark:border-zinc-800/70 bg-slate-50/50 dark:bg-zinc-900/40">
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate">{kgb.pegawai?.nama}</p>
                                <p className="text-[11px] text-slate-500 dark:text-zinc-400">{kgb.pegawai?.jabatan || 'Staf'}</p>
                              </div>
                              <span className="text-[10px] font-bold font-mono px-2 py-1 rounded-md border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300">
                                {kgb.sisaHari <= 0 ? "WAKTUNYA" : `H-${kgb.sisaHari}`}
                              </span>
                            </div>
                          ))
                        )
                      )}

                      {alertTab === "pangkat" && (
                        !stats?.pangkatList?.length ? (
                          <div className="text-xs text-slate-400 italic text-center py-10">
                            Tidak ada jadwal kenaikan pangkat terdekat
                          </div>
                        ) : (
                          stats.pangkatList.map((pkt: any) => (
                            <div key={pkt.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200/70 dark:border-zinc-800/70 bg-slate-50/50 dark:bg-zinc-900/40">
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate">{pkt.pegawai?.nama}</p>
                                <p className="text-[11px] text-slate-500 dark:text-zinc-400">{pkt.pegawai?.jabatan || 'Staf'}</p>
                              </div>
                              <span className="text-[10px] font-bold font-mono px-2 py-1 rounded-md border bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300">
                                {pkt.sisaHari <= 0 ? "WAKTUNYA" : `H-${pkt.sisaHari}`}
                              </span>
                            </div>
                          ))
                        )
                      )}

                      {alertTab === "pensiun" && (
                        !stats?.pensiunTerdekat?.length ? (
                          <div className="text-xs text-slate-400 italic text-center py-10">
                            Tidak ada pegawai mendekati masa pensiun tahun ini
                          </div>
                        ) : (
                          stats.pensiunTerdekat.map((p: any) => (
                            <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200/70 dark:border-zinc-800/70 bg-slate-50/50 dark:bg-zinc-900/40">
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate">{p.nama}</p>
                                <p className="text-[11px] text-slate-500 dark:text-zinc-400">{p.jabatan || 'Staf'}</p>
                              </div>
                              <span className="text-[10px] font-bold font-mono px-2 py-1 rounded-md border bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300">
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

              {/* ROW 4: TOP 5 INDEKS PEGAWAI (No AI-slop, Elegant Medallions) */}
              <Card className="bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xs p-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800/70">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 font-bold text-xs">
                      #
                    </span>
                    <div>
                      <h2 className="text-[15px] font-bold text-slate-900 dark:text-zinc-100">
                        Peringkat Indeks Kinerja Pegawai Bulan Ini
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        Berdasarkan akumulasi kedisiplinan, absensi, KPI tugas, dan penilaian perilaku
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/indeks"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 transition-colors"
                  >
                    Lihat Peringkat Selengkapnya <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-5">
                  {leaderboard.length === 0 ? (
                    <div className="col-span-full text-xs text-slate-400 italic text-center py-8">
                      Belum ada penilaian indeks terinput untuk periode bulan ini
                    </div>
                  ) : (
                    leaderboard.slice(0, 5).map((lb: any, i: number) => {
                      const rankStyles = [
                        { border: "border-amber-200 dark:border-amber-900/50", bg: "bg-amber-50/30 dark:bg-amber-950/10", badge: "bg-amber-500 text-white", label: "#01" },
                        { border: "border-slate-200 dark:border-zinc-700", bg: "bg-slate-50/50 dark:bg-zinc-900/30", badge: "bg-slate-400 text-white", label: "#02" },
                        { border: "border-orange-200 dark:border-orange-900/50", bg: "bg-orange-50/30 dark:bg-orange-950/10", badge: "bg-orange-400 text-white", label: "#03" },
                        { border: "border-slate-200 dark:border-zinc-800", bg: "bg-white dark:bg-zinc-900/20", badge: "bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300", label: "#04" },
                        { border: "border-slate-200 dark:border-zinc-800", bg: "bg-white dark:bg-zinc-900/20", badge: "bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300", label: "#05" },
                      ]
                      const style = rankStyles[i] || rankStyles[4]

                      return (
                        <div
                          key={lb.id}
                          className={cn(
                            "relative flex flex-col items-center text-center p-4 rounded-xl border transition-all duration-150",
                            style.border,
                            style.bg
                          )}
                        >
                          <span className={cn(
                            "absolute -top-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono shadow-2xs",
                            style.badge
                          )}>
                            {style.label}
                          </span>

                          <Avatar className="w-12 h-12 mt-1 ring-2 ring-white dark:ring-zinc-800 shadow-xs">
                            <AvatarImage src={lb.fotoUrl} alt={lb.nama} />
                            <AvatarFallback className="bg-blue-600 text-white font-bold text-xs">
                              {lb.nama?.charAt(0) || 'P'}
                            </AvatarFallback>
                          </Avatar>

                          <div className="mt-2.5 w-full min-w-0">
                            <p className="text-[13px] font-bold text-slate-900 dark:text-zinc-100 truncate">{lb.nama}</p>
                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">{lb.bidang || lb.jabatan || 'Operasional'}</p>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-zinc-800/60 w-full flex items-center justify-between text-xs">
                            <span className="text-slate-400 dark:text-zinc-500">Skor Total:</span>
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{lb.totalSkor}</span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </Card>

              {/* ROW 5: ANALYTICS CHARTS SECTION */}
              <Card className="bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xs p-6">
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
                <Card className="bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xs p-6">
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
                <Card className="bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xs p-6">
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
  const badgeStyles = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60",
    blue: "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60",
    amber: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60",
    red: "bg-red-50 text-red-700 border-red-200/80 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60",
    neutral: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
  }

  const content = (
    <Card className={cn(
      "bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xs p-4 sm:p-5 flex flex-col justify-between transition-all duration-150 h-full",
      (href || onClick) && "hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-sm cursor-pointer"
    )}>
      {/* Card Header: Icon & Micro Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100/90 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-200 border border-slate-200/60 dark:border-zinc-700/60">
          <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        {badgeText && (
          <span className={cn("text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border", badgeStyles[badgeColor])}>
            {badgeText}
          </span>
        )}
      </div>

      {/* Metric Value */}
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-slate-900 dark:text-zinc-50">
            {value}
          </span>
          {unit && (
            <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500">
              {unit}
            </span>
          )}
        </div>
        <p className="text-xs font-semibold text-slate-600 dark:text-zinc-300 mt-1">
          {title}
        </p>
        {sub && (
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5 truncate">
            {sub}
          </p>
        )}
      </div>
    </Card>
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
