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
import { getTopPegawaiLeaderboard } from "@/lib/actions/poin-reward"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Users, CalendarDays, Clock, Wallet, ClipboardList,
  TrendingUp, ShieldCheck, Timer, BadgeCheck, BarChart3, Crown, ArrowRight,
  ChevronRight, ArrowUpCircle, Star, X, ArrowRightLeft,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)
  const [approvalOpen, setApprovalOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    async function loadStats() {
      if (!session) return;
      if (session.user?.role === "PEGAWAI") {
        const data = await getPegawaiDashboardStats((session.user as any).id)
        setStats(data)
      } else {
        const [data, lbData] = await Promise.all([
          getDashboardStats(),
          getTopPegawaiLeaderboard("month")
        ])
        setStats(data)
        setLeaderboard(lbData)
      }
    }
    loadStats()
  }, [session])

  if (!mounted) return null

  const isPegawai = session?.user?.role === "PEGAWAI"

  return (
    <div className="flex min-h-screen bg-[#f4f6f9] dark:bg-[#09090b] text-neutral-900 dark:text-neutral-100">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Dashboard", "Utama"]} />
        <main className="flex-1 p-4 lg:p-6 xl:p-8 space-y-5 max-w-[1400px] mx-auto w-full">

          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Selamat Datang, {session?.user?.name || 'User'} 👋
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })} · Ringkasan HRIS hari ini
              </p>
            </div>
            <Badge variant="outline" className="w-fit px-3 py-1 text-xs font-semibold border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-500 rounded-full shadow-sm">
              {session?.user?.role || 'Guest'}
            </Badge>
          </div>

          {isPegawai ? (
            // ============================
            // PEGAWAI VIEW
            // ============================
            <div className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KpiCard title="Sisa Cuti" value={`${stats?.sisaCuti ?? 0}`} unit="Hari" icon={CalendarDays} color="blue" sub="Hak cuti tahun ini" />
                <KpiCard title="Kehadiran" value={stats?.statusAbsensi || "-"} icon={BadgeCheck} color="emerald" sub={stats?.waktuAbsen ? `Masuk: ${stats.waktuAbsen}` : "Belum absen"} />
                <KpiCard title="Gaji Terakhir" value={stats?.gajiTerbaru ? `${(stats.gajiTerbaru/1e6).toFixed(1)}jt` : "0"} icon={Wallet} color="violet" sub={stats?.periodeGaji || "—"} />
                <KpiCard title="Pengajuan" value={stats?.pengajuanPending || "0"} icon={ClipboardList} color="amber" sub="Status pending" />
              </div>
            </div>
          ) : (
            // ============================
            // SUPERADMIN / HRD VIEW
            // ============================
            <div className="space-y-5">

              {/* ROW 1: KPI CARDS — 5 cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
                <KpiCard
                  title="Total Pegawai"
                  value={stats?.totalPegawai || "0"}
                  icon={Users}
                  color="blue"
                  sub="SDM aktif"
                  href="/pegawai"
                />
                <KpiCard
                  title="Kehadiran"
                  value={`${stats?.kehadiranHariIni?.persenHadir || 0}%`}
                  icon={BadgeCheck}
                  color="emerald"
                  sub={`${stats?.kehadiranHariIni?.hadir || 0} hadir hari ini`}
                  href="/absensi"
                />
                <KpiCard
                  title="Approval"
                  value={stats?.approvalPending || "0"}
                  icon={ShieldCheck}
                  color="amber"
                  sub="Perlu ditindak"
                  onClick={() => setApprovalOpen(true)}
                />
                <KpiCard
                  title="Kontrak Habis"
                  value={stats?.kontrakHampirHabis?.filter((k: any) => k.sisaHari <= 30).length || "0"}
                  icon={Timer}
                  color="rose"
                  sub="≤ 30 hari ke depan"
                  href="/kontrak"
                />
                <KpiCard
                  title="Mutasi"
                  value={stats?.detail?.mutasi || "0"}
                  icon={ArrowRightLeft}
                  color="sky"
                  sub="Pending mutasi"
                  href="/mutasi"
                />
              </div>

              {/* ROW 2: TOP 5 LEADERBOARD HORIZONTAL FULL WIDTH */}
              <Card className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm rounded-2xl">
                <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Top 5 Pegawai Terbaik Bulan Ini</span>
                  </div>
                  <Link href="/reward" className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors font-medium">
                    Lihat semua <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <CardContent className="p-4 pt-2">
                  {leaderboard.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-6 italic">Belum ada data poin bulan ini</div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      {leaderboard.slice(0, 5).map((lb: any, i: number) => (
                        <div key={lb.id} className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 hover:shadow-sm group",
                          i === 0 ? "bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30" :
                          i === 1 ? "bg-slate-50 border-slate-100 dark:bg-slate-900/20 dark:border-slate-800" :
                          i === 2 ? "bg-orange-50 border-orange-100 dark:bg-orange-900/10 dark:border-orange-900/30" :
                          "bg-neutral-50 border-neutral-100 dark:bg-neutral-800/50 dark:border-neutral-800"
                        )}>
                          <div className="relative shrink-0">
                            <Avatar className="w-9 h-9 border-2 border-white dark:border-neutral-900 shadow">
                              <AvatarImage src={lb.fotoUrl} />
                              <AvatarFallback className="text-[10px] font-bold bg-neutral-100 text-neutral-600">{lb.nama?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className={cn(
                              "absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-extrabold text-white ring-2 ring-white dark:ring-neutral-900",
                              i === 0 ? "bg-amber-500" : i === 1 ? "bg-slate-400" : i === 2 ? "bg-orange-400" : "bg-neutral-400"
                            )}>
                              {i + 1}
                            </div>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate leading-tight">{lb.nama}</p>
                            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate mt-0.5">{lb.bidang || lb.jabatan || "—"}</p>
                            <p className={cn("text-[10px] font-extrabold mt-0.5",
                              i === 0 ? "text-amber-600" : i === 1 ? "text-slate-500" : i === 2 ? "text-orange-500" : "text-neutral-500"
                            )}>{lb.points} poin</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ROW 3: MAIN GRID — LEFT(2) RIGHT(1) */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

                {/* LEFT COLUMN */}
                <div className="xl:col-span-2 space-y-5">

                  {/* KEHADIRAN + KONTRAK & PENSIUN + KGB & PANGKAT */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

                    {/* KEHADIRAN HARI INI */}
                    <Card className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm rounded-2xl flex flex-col">
                      <div className="px-5 pt-4 pb-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BadgeCheck className="w-4 h-4 text-emerald-500" />
                          <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Kehadiran Hari Ini</span>
                        </div>
                        <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900/30 px-2.5 py-1 rounded-full font-semibold">Live</span>
                      </div>
                      <CardContent className="flex-1 p-5 flex flex-col gap-4">
                        <div>
                          <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold mb-1">Tingkat Kedatangan</div>
                          <div className="flex items-end gap-2 mb-3">
                            <span className="text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight leading-none">{stats?.kehadiranHariIni?.persenHadir || 0}</span>
                            <span className="text-lg font-semibold text-neutral-400 mb-0.5">%</span>
                          </div>
                          <Progress value={stats?.kehadiranHariIni?.persenHadir || 0} className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full" />
                        </div>
                        <div className="grid grid-cols-2 gap-2.5 mt-auto">
                          {[
                            { label: "Hadir", val: (stats?.kehadiranHariIni?.hadir || 0) + (stats?.kehadiranHariIni?.terlambat || 0), cls: "text-emerald-600 dark:text-emerald-400" },
                            { label: "Terlambat", val: stats?.kehadiranHariIni?.terlambat || 0, cls: "text-amber-600 dark:text-amber-400" },
                            { label: "Izin / Cuti", val: stats?.kehadiranHariIni?.sakitCuti || 0, cls: "text-blue-600 dark:text-blue-400" },
                            { label: "Alpha", val: stats?.kehadiranHariIni?.belumAlpa || 0, cls: "text-red-500 dark:text-red-400" },
                          ].map(({ label, val, cls }) => (
                            <div key={label} className="bg-neutral-50 dark:bg-neutral-800/60 rounded-xl p-3 border border-neutral-100 dark:border-neutral-800">
                              <div className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">{label}</div>
                              <div className={cn("text-xl font-bold leading-none", cls)}>{val}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* MASA KONTRAK & PENSIUN */}
                    <Card className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm rounded-2xl flex flex-col">
                      <div className="px-5 pt-4 pb-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Timer className="w-4 h-4 text-rose-500" />
                          <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Masa Kontrak & Pensiun</span>
                        </div>
                        <Link href="/kontrak" className="text-[10px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 font-medium transition-colors flex items-center gap-0.5">Semua <ChevronRight className="w-3 h-3" /></Link>
                      </div>
                      <CardContent className="flex-1 p-0">
                        <ScrollArea className="max-h-[290px]">
                          <div className="p-4 space-y-3">
                            <div>
                              <p className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Kontrak Habis</p>
                              <div className="space-y-2">
                                {!stats?.kontrakHampirHabis?.length ? (
                                  <div className="text-xs text-neutral-400 italic text-center py-3 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">Tidak ada kontrak mendekati habis</div>
                                ) : (
                                  stats.kontrakHampirHabis.map((k: any) => (
                                    <div key={k.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <Avatar className="h-7 w-7 shrink-0">
                                          <AvatarImage src={k.pegawai?.fotoUrl} />
                                          <AvatarFallback className="text-[9px] font-bold bg-neutral-200 text-neutral-600">{k.pegawai?.nama.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                          <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">{k.pegawai?.nama}</p>
                                          <p className="text-[10px] text-neutral-400 truncate">{k.pegawai?.jabatan || "—"}</p>
                                        </div>
                                      </div>
                                      <span className={cn("text-[10px] font-bold px-2 py-1 rounded-lg shrink-0", k.sisaHari <= 14 ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" : "bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400")}>
                                        {k.sisaHari}h
                                      </span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Mendekati Pensiun</p>
                              <div className="space-y-2">
                                {!stats?.pensiunTerdekat?.length ? (
                                  <div className="text-xs text-neutral-400 italic text-center py-3 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">Belum ada data pensiun terdekat</div>
                                ) : (
                                  stats.pensiunTerdekat.map((p: any) => (
                                    <div key={p.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <Avatar className="h-7 w-7 shrink-0">
                                          <AvatarImage src={p.fotoUrl} />
                                          <AvatarFallback className="text-[9px] font-bold bg-neutral-200 text-neutral-600">{p.nama.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                          <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">{p.nama}</p>
                                          <p className="text-[10px] text-neutral-400 truncate">{p.jabatan || "—"}</p>
                                        </div>
                                      </div>
                                      <span className="text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400">
                                        {Math.ceil(p.sisaHari / 30)} bln
                                      </span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    {/* KENAIKAN GAJI BERKALA & PANGKAT */}
                    <Card className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm rounded-2xl flex flex-col">
                      <div className="px-5 pt-4 pb-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ArrowUpCircle className="w-4 h-4 text-violet-500" />
                          <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Kenaikan Gaji & Pangkat</span>
                        </div>
                        <Link href="/kgb" className="text-[10px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 font-medium transition-colors flex items-center gap-0.5">Semua <ChevronRight className="w-3 h-3" /></Link>
                      </div>
                      <CardContent className="flex-1 p-0">
                        <ScrollArea className="max-h-[290px]">
                          <div className="p-4 space-y-3">
                            <div>
                              <p className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Kenaikan Gaji Berkala (KGB)</p>
                              <div className="space-y-2">
                                {!stats?.kgbList?.length ? (
                                  <div className="text-xs text-neutral-400 italic text-center py-3 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">Tidak ada pengajuan KGB pending</div>
                                ) : (
                                  stats.kgbList.map((k: any) => (
                                    <div key={k.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-900/30 hover:bg-violet-100 dark:hover:bg-violet-900/20 transition-colors">
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <Avatar className="h-7 w-7 shrink-0">
                                          <AvatarImage src={k.pegawai?.fotoUrl} />
                                          <AvatarFallback className="text-[9px] font-bold bg-violet-200 text-violet-700">{k.pegawai?.nama?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                          <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">{k.pegawai?.nama}</p>
                                          <p className="text-[10px] text-neutral-400 truncate">{k.pegawai?.jabatan || "—"}</p>
                                        </div>
                                      </div>
                                      <span className="text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">KGB</span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Kenaikan Pangkat</p>
                              <div className="space-y-2">
                                {!stats?.pangkatList?.length ? (
                                  <div className="text-xs text-neutral-400 italic text-center py-3 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">Tidak ada pengajuan kenaikan pangkat</div>
                                ) : (
                                  stats.pangkatList.map((p: any) => (
                                    <div key={p.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-sky-50 dark:bg-sky-900/10 border border-sky-100 dark:border-sky-900/30 hover:bg-sky-100 dark:hover:bg-sky-900/20 transition-colors">
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <Avatar className="h-7 w-7 shrink-0">
                                          <AvatarImage src={p.pegawai?.fotoUrl} />
                                          <AvatarFallback className="text-[9px] font-bold bg-sky-200 text-sky-700">{p.pegawai?.nama?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                          <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">{p.pegawai?.nama}</p>
                                          <p className="text-[10px] text-neutral-400 truncate">{p.pegawai?.jabatan || "—"}</p>
                                        </div>
                                      </div>
                                      <span className="text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">Pangkat</span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>

                  </div>

                  {/* ANALITIK CHARTS */}
                  <Card className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm rounded-2xl">
                    <div className="px-5 pt-4 pb-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Analitik Kepegawaian</span>
                    </div>
                    <CardContent className="p-5">
                      <AnalyticsCharts />
                    </CardContent>
                  </Card>

                </div>

                {/* RIGHT COLUMN: KENAIKAN GAJI & PANGKAT + STATUS SDM */}
                <div className="flex flex-col gap-5">

                  {/* KENAIKAN GAJI BERKALA & PANGKAT (ringkas, scroll list) */}
                  <Card className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm rounded-2xl flex flex-col">
                    <div className="px-5 pt-4 pb-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ArrowUpCircle className="w-4 h-4 text-violet-500" />
                        <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Kenaikan Gaji & Pangkat</span>
                      </div>
                      <Link href="/kgb" className="text-[10px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 font-medium transition-colors flex items-center gap-0.5">Semua <ChevronRight className="w-3 h-3" /></Link>
                    </div>
                    <CardContent className="flex-1 p-0">
                      <ScrollArea className="max-h-[260px]">
                        <div className="p-4 space-y-3">
                          <div>
                            <p className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Kenaikan Gaji Berkala (KGB)</p>
                            <div className="space-y-2">
                              {!stats?.kgbList?.length ? (
                                <div className="text-xs text-neutral-400 italic text-center py-3 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">Tidak ada pengajuan KGB pending</div>
                              ) : (
                                stats.kgbList.slice(0, 4).map((k: any) => (
                                  <div key={k.id} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-900/30">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Avatar className="h-6 w-6 shrink-0">
                                        <AvatarImage src={k.pegawai?.fotoUrl} />
                                        <AvatarFallback className="text-[8px] font-bold bg-violet-200 text-violet-700">{k.pegawai?.nama?.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                      <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">{k.pegawai?.nama}</p>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">KGB</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Kenaikan Pangkat</p>
                            <div className="space-y-2">
                              {!stats?.pangkatList?.length ? (
                                <div className="text-xs text-neutral-400 italic text-center py-3 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">Tidak ada pengajuan kenaikan pangkat</div>
                              ) : (
                                stats.pangkatList.slice(0, 4).map((p: any) => (
                                  <div key={p.id} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-sky-50 dark:bg-sky-900/10 border border-sky-100 dark:border-sky-900/30">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Avatar className="h-6 w-6 shrink-0">
                                        <AvatarImage src={p.pegawai?.fotoUrl} />
                                        <AvatarFallback className="text-[8px] font-bold bg-sky-200 text-sky-700">{p.pegawai?.nama?.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                      <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">{p.pegawai?.nama}</p>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">Pangkat</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* RINGKASAN STATUS SDM */}
                  <Card className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm rounded-2xl">
                    <div className="px-5 pt-4 pb-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-violet-500" />
                      <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Status SDM</span>
                    </div>
                    <CardContent className="p-4 space-y-3">
                      {[
                        { label: "Pegawai Aktif", val: stats?.totalPegawai || 0, colorBar: "bg-emerald-500", pct: 100 },
                        { label: "Sedang Cuti", val: stats?.pegawaiCuti || 0, colorBar: "bg-blue-400", pct: Math.min(100, ((stats?.pegawaiCuti || 0) / (stats?.totalPegawai || 1)) * 100) },
                        { label: "SP Aktif", val: stats?.pegawaiSP || 0, colorBar: "bg-rose-400", pct: Math.min(100, ((stats?.pegawaiSP || 0) / (stats?.totalPegawai || 1)) * 100) },
                        { label: "Kontrak < 30 hari", val: stats?.kontrakHampirHabis?.filter((k: any) => k.sisaHari <= 30).length || 0, colorBar: "bg-amber-400", pct: Math.min(100, ((stats?.kontrakHampirHabis?.filter((k: any) => k.sisaHari <= 30).length || 0) / (stats?.totalPegawai || 1)) * 200) },
                      ].map(({ label, val, colorBar, pct }) => (
                        <div key={label} className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full shrink-0 bg-neutral-200 dark:bg-neutral-700 relative overflow-hidden">
                            <div className={cn("absolute inset-0 rounded-full", colorBar)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[11px] text-neutral-600 dark:text-neutral-400 font-medium">{label}</span>
                              <span className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200">{val}</span>
                            </div>
                            <div className="h-1 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                              <div className={cn("h-1 rounded-full transition-all duration-700", colorBar)} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="pt-1">
                        <Link href="/pegawai" className="text-[11px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 font-medium transition-colors flex items-center gap-1">
                          Lihat data pegawai <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>

              </div>
            </div>
          )}
        </main>

        {/* ===== APPROVAL POPUP OVERLAY ===== */}
        {approvalOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-16">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setApprovalOpen(false)}
            />
            <div className="relative z-10 w-full max-w-md h-[calc(100vh-80px)] flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-right-10 duration-300">
              <div className="px-5 pt-4 pb-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Approval Center</span>
                  {stats?.approvalPending > 0 && (
                    <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30 px-2 py-0.5 rounded-full font-bold">{stats.approvalPending} Pending</span>
                  )}
                </div>
                <button
                  onClick={() => setApprovalOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4">
                  <ApprovalPanel />
                </div>
              </ScrollArea>
              <div className="px-4 py-3 border-t border-neutral-100 dark:border-neutral-800 shrink-0">
                <Link href="/approval" onClick={() => setApprovalOpen(false)} className="flex items-center justify-center gap-2 w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 transition-colors">
                  Buka Approval Center <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// ======================================
// REUSABLE KPI CARD — CLEAN & COMPACT
// ======================================
function KpiCard({ title, value, unit, icon: Icon, color = "blue", sub, href, onClick }: {
  title: string; value: any; unit?: string; icon: any; color?: string; sub?: string; href?: string; onClick?: () => void;
}) {
  const iconColor: Record<string, string> = {
    blue:   "bg-blue-50   text-blue-600   dark:bg-blue-900/20   dark:text-blue-400",
    emerald:"bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    amber:  "bg-amber-50  text-amber-600  dark:bg-amber-900/20  dark:text-amber-400",
    rose:   "bg-rose-50   text-rose-600   dark:bg-rose-900/20   dark:text-rose-400",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400",
    sky:    "bg-sky-50    text-sky-600    dark:bg-sky-900/20    dark:text-sky-400",
  }

  const card = (
    <Card className={cn(
      "bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm rounded-2xl transition-all duration-200",
      (href || onClick) && "hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
    )}>
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className={cn("p-2 rounded-xl", iconColor[color] || iconColor.blue)}>
            <Icon className="w-4 h-4" />
          </div>
          {href && <ChevronRight className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600" />}
        </div>
        <div>
          <div className="flex items-end gap-1 leading-none mb-1">
            <span className="text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">{value}</span>
            {unit && <span className="text-sm font-semibold text-neutral-400 mb-0.5">{unit}</span>}
          </div>
          <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">{title}</p>
          {sub && <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5 truncate">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )

  if (onClick) return <button className="text-left w-full" onClick={onClick}>{card}</button>
  return href ? <Link href={href}>{card}</Link> : card
}
