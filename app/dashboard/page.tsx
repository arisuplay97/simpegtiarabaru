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
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Users, CalendarDays, Clock, Wallet, ClipboardList,
  TrendingUp, ShieldCheck, Timer, BadgeCheck, BarChart3, Crown, ArrowRight,
  ChevronRight, ArrowUpCircle, Star, X, ArrowRightLeft, Cake,
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
          getLeaderboard()
        ])
        setStats(data)
        setLeaderboard(lbData)
      }
    }
    loadStats()
  }, [session])

  if (!mounted) return null

  const isPegawai = session?.user?.role === "PEGAWAI"

  // Birthday data fetched from stats.ulangTahunBulanIni

  return (
    <div className="flex min-h-screen bg-[#F5F6FA]">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Dashboard", "Utama"]} />
        <main className="flex-1 p-4 lg:p-6 xl:p-8 space-y-5 max-w-[1440px] mx-auto w-full">

          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#1E293B]">
                Selamat Datang, {session?.user?.name || 'User'}
              </h1>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                {format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })} · Ringkasan HRIS hari ini
              </p>
            </div>
            <Badge className="w-fit px-3 py-1 text-xs font-semibold border border-[#E8EAF0] bg-white text-[#64748B] rounded-full shadow-none">
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
                  color="indigo"
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
                  color="orange"
                  sub="Perlu ditindak"
                  onClick={() => setApprovalOpen(true)}
                />
                <KpiCard
                  title="Kontrak Habis"
                  value={stats?.kontrakHampirHabis?.filter((k: any) => k.sisaHari <= 30).length || "0"}
                  icon={Timer}
                  color="red"
                  sub="≤ 30 hari ke depan"
                  href="/kontrak"
                />
                <KpiCard
                  title="Mutasi"
                  value={stats?.detail?.mutasi || "0"}
                  icon={ArrowRightLeft}
                  color="blue"
                  sub="Pending mutasi"
                  href="/mutasi"
                />
              </div>

              {/* ROW 2: TOP 5 LEADERBOARD */}
              <Card className="bg-white border border-[#E8EAF0] shadow-none rounded-[14px] card-premium">
                <div className="px-5 pt-4 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    </div>
                    <span className="text-[14px] font-semibold text-[#1E293B]">Top 5 Indeks Pegawai Bulan Ini</span>
                  </div>
                  <Link href="/indeks" className="flex items-center gap-1 text-xs text-[#4F46E5] hover:text-[#4338CA] transition-colors font-medium">
                    Lihat semua <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <CardContent className="p-4 pt-2">
                  {leaderboard.length === 0 ? (
                    <div className="text-xs text-[#9CA3AF] text-center py-6 italic">Belum ada data poin bulan ini</div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      {leaderboard.slice(0, 5).map((lb: any, i: number) => {
                        const rankColors = [
                          { bg: "bg-amber-50 border-amber-100", badge: "bg-amber-500", text: "text-amber-600", icon: "👑" },
                          { bg: "bg-slate-50 border-slate-100", badge: "bg-slate-400", text: "text-slate-500", icon: "🥈" },
                          { bg: "bg-orange-50 border-orange-100", badge: "bg-orange-400", text: "text-orange-500", icon: "🥉" },
                          { bg: "bg-gray-50 border-gray-100", badge: "bg-gray-400", text: "text-gray-500", icon: "" },
                          { bg: "bg-gray-50 border-gray-100", badge: "bg-gray-400", text: "text-gray-500", icon: "" },
                        ]
                        const rank = rankColors[i] || rankColors[4]
                        const avatarColors = ["bg-indigo-100 text-indigo-600", "bg-emerald-100 text-emerald-600", "bg-orange-100 text-orange-600", "bg-pink-100 text-pink-600", "bg-sky-100 text-sky-600"]
                        
                        return (
                          <div key={lb.id} className={cn(
                            "relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 hover:shadow-sm",
                            rank.bg
                          )}>
                            {/* Rank badge */}
                            <div className="absolute -top-2 -right-2">
                              {i < 3 ? (
                                <span className="text-lg">{rank.icon}</span>
                              ) : (
                                <span className={cn("flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white", rank.badge)}>
                                  {i + 1}
                                </span>
                              )}
                            </div>
                            
                            {/* Avatar */}
                            <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                              <AvatarImage src={lb.fotoUrl} />
                              <AvatarFallback className={cn("text-[13px] font-bold", avatarColors[i] || avatarColors[0])}>
                                {lb.nama?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="text-center min-w-0 w-full">
                              <p className="text-[12px] font-semibold text-[#1E293B] truncate leading-tight">{lb.nama}</p>
                              <p className="text-[10px] text-[#9CA3AF] truncate mt-0.5">{lb.bidang || lb.jabatan || "—"}</p>
                              <p className={cn("text-[12px] font-bold mt-1", rank.text)}>Skor: {lb.totalSkor}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ROW 3: THREE COLUMNS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* COL 1: KEHADIRAN HARI INI */}
                <Card className="bg-white border border-[#E8EAF0] shadow-none rounded-[14px] card-premium flex flex-col">
                  <div className="px-5 pt-4 pb-3 border-b border-[#E8EAF0] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50">
                        <BadgeCheck className="w-4 h-4 text-emerald-500" />
                      </div>
                      <span className="text-[14px] font-semibold text-[#1E293B]">Kehadiran Hari Ini</span>
                    </div>
                    <span className="flex items-center gap-1.5 text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-full font-semibold">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-live-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Live
                    </span>
                  </div>
                  <CardContent className="flex-1 p-5 flex flex-col gap-4">
                    <div>
                      <div className="text-[10px] text-[#9CA3AF] uppercase tracking-wider font-semibold mb-1">Tingkat Kedatangan</div>
                      <div className="flex items-end gap-2 mb-3">
                        <span className="text-4xl font-extrabold text-[#1E293B] tracking-tight leading-none">{stats?.kehadiranHariIni?.persenHadir || 0}</span>
                        <span className="text-lg font-semibold text-[#9CA3AF] mb-0.5">%</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#F0F0F5] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#4F46E5] rounded-full transition-all duration-700"
                          style={{ width: `${stats?.kehadiranHariIni?.persenHadir || 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 mt-auto">
                      {[
                        { label: "Hadir", val: (stats?.kehadiranHariIni?.hadir || 0) + (stats?.kehadiranHariIni?.terlambat || 0), color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
                        { label: "Terlambat", val: stats?.kehadiranHariIni?.terlambat || 0, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
                        { label: "Izin / Cuti", val: stats?.kehadiranHariIni?.sakitCuti || 0, color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
                        { label: "Belum Absen", val: stats?.kehadiranHariIni?.belumAbsen || 0, color: "text-red-600", bg: "bg-red-50 border-red-100" },
                      ].map(({ label, val, color, bg }) => (
                        <div key={label} className={cn("rounded-xl p-3 border", bg)}>
                          <div className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1">{label}</div>
                          <div className={cn("text-xl font-bold leading-none", color)}>{val}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* COL 2: MASA KONTRAK & PENSIUN */}
                <Card className="bg-white border border-[#E8EAF0] shadow-none rounded-[14px] card-premium flex flex-col">
                  <div className="px-5 pt-4 pb-3 border-b border-[#E8EAF0] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50">
                        <Timer className="w-4 h-4 text-orange-500" />
                      </div>
                      <span className="text-[14px] font-semibold text-[#1E293B]">Masa Kontrak & Pensiun</span>
                    </div>
                    <Link href="/kontrak" className="text-xs text-[#4F46E5] hover:text-[#4338CA] font-medium transition-colors flex items-center gap-0.5">Semua <ChevronRight className="w-3 h-3" /></Link>
                  </div>
                  <CardContent className="flex-1 p-0">
                    <ScrollArea className="max-h-[340px]">
                      <div className="p-4 space-y-4">
                        <div>
                          <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">Kontrak Habis</p>
                          <div className="space-y-2">
                            {!stats?.kontrakHampirHabis?.length ? (
                              <div className="text-xs text-[#9CA3AF] italic text-center py-3 rounded-xl border border-dashed border-[#E8EAF0]">Tidak ada kontrak mendekati habis</div>
                            ) : (
                              stats.kontrakHampirHabis.map((k: any) => (
                                <div key={k.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#FAFAFA] border border-[#E8EAF0] hover:bg-[#F3F4F6] transition-colors">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <Avatar className="h-7 w-7 shrink-0">
                                      <AvatarImage src={k.pegawai?.fotoUrl} />
                                      <AvatarFallback className="text-[9px] font-bold bg-[#EEF2FF] text-[#4F46E5]">{k.pegawai?.nama.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <p className="text-xs font-semibold text-[#1E293B] truncate">{k.pegawai?.nama}</p>
                                      <p className="text-[10px] text-[#9CA3AF] truncate">{k.pegawai?.jabatan || "—"}</p>
                                    </div>
                                  </div>
                                  <span className={cn("text-[10px] font-bold px-2 py-1 rounded-lg shrink-0",
                                    k.sisaHari <= 14 ? "bg-red-50 text-red-600 border border-red-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                                  )}>
                                    {k.sisaHari}h
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">Mendekati Pensiun</p>
                          <div className="space-y-2">
                            {!stats?.pensiunTerdekat?.length ? (
                              <div className="text-xs text-[#9CA3AF] italic text-center py-3 rounded-xl border border-dashed border-[#E8EAF0]">Belum ada data pensiun terdekat</div>
                            ) : (
                              stats.pensiunTerdekat.map((p: any) => (
                                <div key={p.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#FAFAFA] border border-[#E8EAF0] hover:bg-[#F3F4F6] transition-colors">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <Avatar className="h-7 w-7 shrink-0">
                                      <AvatarImage src={p.fotoUrl} />
                                      <AvatarFallback className="text-[9px] font-bold bg-[#EEF2FF] text-[#4F46E5]">{p.nama.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <p className="text-xs font-semibold text-[#1E293B] truncate">{p.nama}</p>
                                      <p className="text-[10px] text-[#9CA3AF] truncate">{p.jabatan || "—"}</p>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 bg-orange-50 text-orange-600 border border-orange-100">
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

                {/* COL 3: KENAIKAN GAJI & PANGKAT */}
                <Card className="bg-white border border-[#E8EAF0] shadow-none rounded-[14px] card-premium flex flex-col">
                  <div className="px-5 pt-4 pb-3 border-b border-[#E8EAF0] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">
                        <ArrowUpCircle className="w-4 h-4 text-violet-500" />
                      </div>
                      <span className="text-[14px] font-semibold text-[#1E293B]">Kenaikan Gaji & Pangkat</span>
                    </div>
                    <Link href="/kgb" className="text-xs text-[#4F46E5] hover:text-[#4338CA] font-medium transition-colors flex items-center gap-0.5">Semua <ChevronRight className="w-3 h-3" /></Link>
                  </div>
                  <CardContent className="flex-1 p-0">
                    <ScrollArea className="max-h-[340px]">
                      <div className="p-4 space-y-4">
                        <div>
                          <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">Kenaikan Gaji Berkala (KGB)</p>
                          <div className="space-y-2">
                            {!stats?.kgbList?.length ? (
                              <div className="flex flex-col items-center py-5 text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F6FA] mb-2">
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </div>
                                <p className="text-xs text-[#9CA3AF]">Belum ada pegawai eligible KGB bulan ini</p>
                              </div>
                            ) : (
                              stats.kgbList.map((k: any) => (
                                <div key={k.id} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-violet-50 border border-violet-100">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Avatar className="h-6 w-6 shrink-0">
                                      <AvatarImage src={k.pegawai?.fotoUrl} />
                                      <AvatarFallback className="text-[8px] font-bold bg-violet-200 text-violet-700">{k.pegawai?.nama?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <p className="text-xs font-semibold text-[#1E293B] truncate">{k.pegawai?.nama}</p>
                                  </div>
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg shrink-0 bg-violet-100 text-violet-700">
                                    {k.sisaHari <= 0 ? "WAKTUNYA!" : `H-${k.sisaHari}`}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">Kenaikan Pangkat</p>
                          <div className="space-y-2">
                            {!stats?.pangkatList?.length ? (
                              <div className="flex flex-col items-center py-5 text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F6FA] mb-2">
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 15L8.5359 16.8541L9.2918 12.927L6.5836 10.1459L10.518 9.57295L12 6L13.482 9.57295L17.4164 10.1459L14.7082 12.927L15.4641 16.8541L12 15Z" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </div>
                                <p className="text-xs text-[#9CA3AF]">Belum ada pegawai eligible naik pangkat</p>
                              </div>
                            ) : (
                              stats.pangkatList.map((p: any) => (
                                <div key={p.id} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-sky-50 border border-sky-100">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Avatar className="h-6 w-6 shrink-0">
                                      <AvatarImage src={p.pegawai?.fotoUrl} />
                                      <AvatarFallback className="text-[8px] font-bold bg-sky-200 text-sky-700">{p.pegawai?.nama?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <p className="text-xs font-semibold text-[#1E293B] truncate">{p.pegawai?.nama}</p>
                                  </div>
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg shrink-0 bg-sky-100 text-sky-700">
                                    {p.sisaHari <= 0 ? "WAKTUNYA!" : `H-${p.sisaHari}`}
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
              </div>

              {/* ROW 4: TWO COLUMNS — Birthday + Status SDM */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* ULANG TAHUN BULAN INI */}
                <Card className="bg-white border border-[#E8EAF0] shadow-none rounded-[14px] card-premium">
                  <div className="px-5 pt-4 pb-3 border-b border-[#E8EAF0] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-50">
                        <Cake className="w-4 h-4 text-pink-500" />
                      </div>
                      <span className="text-[14px] font-semibold text-[#1E293B]">Ulang Tahun Bulan Ini</span>
                    </div>
                    <button className="flex items-center gap-1 text-xs text-[#64748B] bg-[#F5F6FA] hover:bg-[#E8EAF0] px-2.5 py-1 rounded-lg font-medium transition-colors">
                      Bulan ini
                      <ChevronRight className="w-3 h-3 rotate-90" />
                    </button>
                  </div>
                  <CardContent className="p-0">
                    <div className="divide-y divide-[#E8EAF0]">
                      {!stats?.ulangTahunBulanIni?.length ? (
                        <div className="text-xs text-[#9CA3AF] italic text-center py-8">Belum ada data ulang tahun bulan ini</div>
                      ) : stats.ulangTahunBulanIni.map((person: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 px-5 py-3 hover:bg-[#FAFAFA] transition-colors">
                          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white", person.color)}>
                            {person.initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-[#1E293B] truncate">{person.nama}</p>
                            <p className="text-[11px] text-[#9CA3AF] truncate">{person.jabatan}</p>
                          </div>
                          <span className="text-[12px] text-[#64748B] font-medium shrink-0">{person.tanggal}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* STATUS SDM */}
                <Card className="bg-white border border-[#E8EAF0] shadow-none rounded-[14px] card-premium">
                  <div className="px-5 pt-4 pb-3 border-b border-[#E8EAF0] flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">
                      <TrendingUp className="w-4 h-4 text-violet-500" />
                    </div>
                    <span className="text-[14px] font-semibold text-[#1E293B]">Status SDM</span>
                  </div>
                  <CardContent className="p-5 space-y-4">
                    {[
                      { label: "Pegawai Aktif", val: stats?.totalPegawai || 0, colorBar: "bg-emerald-500", pct: 100 },
                      { label: "Sedang Cuti", val: stats?.pegawaiCuti || 0, colorBar: "bg-blue-400", pct: Math.min(100, ((stats?.pegawaiCuti || 0) / (stats?.totalPegawai || 1)) * 100) },
                      { label: "SP Aktif", val: stats?.pegawaiSP || 0, colorBar: "bg-red-400", pct: Math.min(100, ((stats?.pegawaiSP || 0) / (stats?.totalPegawai || 1)) * 100) },
                      { label: "Kontrak < 30 hari", val: stats?.kontrakHampirHabis?.filter((k: any) => k.sisaHari <= 30).length || 0, colorBar: "bg-amber-400", pct: Math.min(100, ((stats?.kontrakHampirHabis?.filter((k: any) => k.sisaHari <= 30).length || 0) / (stats?.totalPegawai || 1)) * 200) },
                    ].map(({ label, val, colorBar, pct }) => (
                      <div key={label} className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0 relative overflow-hidden">
                          <div className={cn("absolute inset-0 rounded-full", colorBar)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[12px] text-[#64748B] font-medium">{label}</span>
                            <span className="text-[12px] font-bold text-[#1E293B]">{val}</span>
                          </div>
                          <div className="h-1.5 w-full bg-[#F0F0F5] rounded-full overflow-hidden">
                            <div className={cn("h-1.5 rounded-full transition-all duration-700", colorBar)} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2">
                      <Link href="/pegawai" className="text-xs text-[#4F46E5] hover:text-[#4338CA] font-medium transition-colors flex items-center gap-1">
                        Lihat data pegawai <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ROW 5: ANALYTICS */}
              <Card className="bg-white border border-[#E8EAF0] shadow-none rounded-[14px] card-premium">
                <div className="px-5 pt-4 pb-3 border-b border-[#E8EAF0] flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50">
                    <BarChart3 className="w-4 h-4 text-[#4F46E5]" />
                  </div>
                  <span className="text-[14px] font-semibold text-[#1E293B]">Analitik Kepegawaian</span>
                </div>
                <CardContent className="p-5">
                  <AnalyticsCharts data={stats?.analytics} />
                </CardContent>
              </Card>

            </div>
          )}
        </main>

        {/* ===== APPROVAL POPUP OVERLAY ===== */}
        {approvalOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-16">
            <div
              className="fixed inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setApprovalOpen(false)}
            />
            <div className="relative z-10 w-full max-w-md h-[calc(100vh-80px)] flex flex-col bg-white border border-[#E8EAF0] rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-right-10 duration-300">
              <div className="px-5 pt-4 pb-3 border-b border-[#E8EAF0] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50">
                    <ShieldCheck className="w-4 h-4 text-[#4F46E5]" />
                  </div>
                  <span className="text-sm font-semibold text-[#1E293B]">Approval Center</span>
                  {stats?.approvalPending > 0 && (
                    <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full font-bold">{stats.approvalPending} Pending</span>
                  )}
                </div>
                <button
                  onClick={() => setApprovalOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9CA3AF] hover:text-[#64748B] hover:bg-[#F3F4F6] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4">
                  <ApprovalPanel />
                </div>
              </ScrollArea>
              <div className="px-4 py-3 border-t border-[#E8EAF0] shrink-0">
                <Link href="/approval" onClick={() => setApprovalOpen(false)} className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-semibold py-2.5 transition-colors">
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
// REUSABLE KPI CARD — FLOOPYINN STYLE
// ======================================
function KpiCard({ title, value, unit, icon: Icon, color = "indigo", sub, href, onClick }: {
  title: string; value: any; unit?: string; icon: any; color?: string; sub?: string; href?: string; onClick?: () => void;
}) {
  const colorMap: Record<string, { iconBg: string; iconColor: string }> = {
    indigo:  { iconBg: "bg-indigo-50",  iconColor: "text-[#4F46E5]" },
    blue:    { iconBg: "bg-blue-50",    iconColor: "text-[#3B82F6]" },
    emerald: { iconBg: "bg-emerald-50", iconColor: "text-[#10B981]" },
    amber:   { iconBg: "bg-amber-50",   iconColor: "text-[#F59E0B]" },
    orange:  { iconBg: "bg-orange-50",  iconColor: "text-[#F97316]" },
    red:     { iconBg: "bg-red-50",     iconColor: "text-[#EF4444]" },
    rose:    { iconBg: "bg-rose-50",    iconColor: "text-rose-500" },
    violet:  { iconBg: "bg-violet-50",  iconColor: "text-violet-500" },
    sky:     { iconBg: "bg-sky-50",     iconColor: "text-sky-500" },
  }

  const colors = colorMap[color] || colorMap.indigo

  const card = (
    <Card className={cn(
      "bg-white border border-[#E8EAF0] shadow-none rounded-[14px] card-premium transition-all duration-200",
      (href || onClick) && "hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
    )}>
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", colors.iconBg)}>
            <Icon className={cn("w-5 h-5", colors.iconColor)} />
          </div>
          {href && (
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#F5F6FA]">
              <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF]" />
            </div>
          )}
        </div>
        <div>
          <div className="flex items-end gap-1 leading-none mb-1">
            <span className="text-2xl font-extrabold text-[#1E293B] tracking-tight">{value}</span>
            {unit && <span className="text-sm font-semibold text-[#9CA3AF] mb-0.5">{unit}</span>}
          </div>
          <p className="text-[12px] font-semibold text-[#64748B]">{title}</p>
          {sub && <p className="text-[11px] text-[#9CA3AF] mt-0.5 truncate">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )

  if (onClick) return <button className="text-left w-full animate-card-enter" onClick={onClick}>{card}</button>
  return href ? <Link href={href} className="animate-card-enter">{card}</Link> : <div className="animate-card-enter">{card}</div>
}
