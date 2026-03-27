'use client'

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { format, differenceInDays } from "date-fns"
import { id } from "date-fns/locale"
import { AnalyticsCharts } from "@/components/simpeg/dashboard/analytics-charts"
import { ApprovalPanel } from "@/components/simpeg/dashboard/approval-panel"
import { getDashboardStats, getPegawaiDashboardStats } from "@/lib/actions/dashboard"
import { getTopPegawaiLeaderboard } from "@/lib/actions/poin-reward"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Users, FileCheck, ShieldCheck, 
  TrendingUp, Clock, Wallet, Calendar, AlertTriangle, UserCheck, CheckCircle2, XCircle, FileClock, Medal
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)

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
    <div className="flex min-h-screen bg-neutral-50/50 dark:bg-neutral-950">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Dashboard", "Utama"]} />
        <main className="flex-1 p-6 lg:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                Selamat Datang, {session?.user?.name || 'User'}
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Ringkasan operasional SDM hari ini — {format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })}.
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="px-3 py-1 font-medium shadow-sm">
                Sesi: {session?.user?.role || 'Guest'}
              </Badge>
            </div>
          </div>

          {isPegawai ? (
            // PEGAWAI VIEW
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <CompactStatsCard 
                  title="Sisa Cuti Tahunan" 
                  value={`${stats?.sisaCuti ?? 0} Hari`}
                  description="Hak cuti Anda tahun ini"
                  icon={<Calendar className="w-5 h-5 text-blue-600" />}
                  trend="Ajukan cuti jika perlu"
                />
                <CompactStatsCard 
                  title="Status Kehadiran" 
                  value={stats?.statusAbsensi || "-"} 
                  description={stats?.waktuAbsen ? `Jam masuk: ${stats.waktuAbsen}` : "Belum ada data hari ini"}
                  icon={<Clock className="w-5 h-5 text-emerald-600" />}
                  trend={stats?.statusAbsensi === "HADIR" ? "+ Tepat Waktu" : "Perhatikan absensi"}
                />
                <CompactStatsCard 
                  title="Slip Gaji Terbaru" 
                  value={stats?.gajiTerbaru ? `Rp ${stats.gajiTerbaru.toLocaleString('id-ID')}` : "Rp 0"} 
                  description={`Periode: ${stats?.periodeGaji || "-"}`}
                  icon={<Wallet className="w-5 h-5 text-indigo-600" />}
                  trend="Gaji bulan terakhir"
                />
                <CompactStatsCard 
                  title="Pengajuan Anda" 
                  value={stats?.pengajuanPending || "0"} 
                  description="Proses approval PENDING"
                  icon={<ShieldCheck className="w-5 h-5 text-amber-600" />}
                  trend="Menunggu HR/Atasan"
                />
              </div>
            </div>
          ) : (
            // SUPERADMIN / HRD VIEW
            <>
              {/* ROW 1: COMPACT STATS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <CompactStatsCard 
                  title="Total Pegawai" 
                  value={stats?.totalPegawai || "0"} 
                  description="Keseluruhan SDM Aktif"
                  icon={<Users className="w-4 h-4 text-primary" />}
                  trend="+ Stabil"
                />
                <CompactStatsCard 
                  title="Approval Pending" 
                  value={stats?.approvalPending || "0"} 
                  description="Menunggu verifikasi Anda"
                  icon={<FileCheck className="w-4 h-4 text-amber-500" />}
                  trend={stats?.approvalPending > 0 ? "Perlu Tindakan" : "Semua Beres"}
                />
                <CompactStatsCard 
                  title="Kehadiran Hari Ini" 
                  value={`${stats?.kehadiranHariIni?.persenHadir || 0}%`}
                  description={`${stats?.kehadiranHariIni?.hadir || 0} Tepat, ${stats?.kehadiranHariIni?.terlambat || 0} Telat`}
                  icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  trend="Berdasarkan absensi masuk"
                />
                <CompactStatsCard 
                  title="Kontrak Expiring" 
                  value={stats?.kontrakHampirHabis?.filter((k: any) => k.sisaHari <= 14).length || "0"} 
                  description="Dalam 14 hari ke depan"
                  icon={<AlertTriangle className="w-4 h-4 text-rose-500" />}
                  trend="Segera perbarui"
                />
              </div>

              {/* ROW 2: WIDGET DASHBOARD BARU */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. KEHADIRAN HARI INI */}
                <Card className="shadow-sm border-neutral-200/60 flex flex-col">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-primary" />
                      Kehadiran Hari Ini
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="mb-4">
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-3xl font-bold">{stats?.kehadiranHariIni?.persenHadir || 0}%</span>
                        <span className="text-xs text-muted-foreground mb-1">Hadir & Telat</span>
                      </div>
                      <Progress value={stats?.kehadiranHariIni?.persenHadir || 0} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mt-auto">
                      <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                        <div className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-1">Hadir Hari Ini</div>
                        <div className="text-xl font-bold">{(stats?.kehadiranHariIni?.hadir || 0) + (stats?.kehadiranHariIni?.terlambat || 0)}</div>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-100 dark:border-amber-900/50">
                        <div className="text-amber-600 dark:text-amber-400 text-xs font-semibold mb-1">Terlambat</div>
                        <div className="text-xl font-bold">{stats?.kehadiranHariIni?.terlambat || 0}</div>
                      </div>
                      <div className="bg-neutral-50 dark:bg-neutral-900 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800">
                        <div className="text-neutral-500 dark:text-neutral-400 text-xs font-semibold mb-1">Izin/Cuti</div>
                        <div className="text-xl font-bold">{stats?.kehadiranHariIni?.sakitCuti || 0}</div>
                      </div>
                      <div className="bg-rose-50 dark:bg-rose-950/30 p-3 rounded-lg border border-rose-100 dark:border-rose-900/50">
                        <div className="text-rose-600 dark:text-rose-400 text-xs font-semibold mb-1">Belum/Alpa</div>
                        <div className="text-xl font-bold">{stats?.kehadiranHariIni?.belumAlpa || 0}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. TOP 5 PEGAWAI RAJIN */}
                <Card className="shadow-sm border-neutral-200/60 flex flex-col">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Medal className="w-4 h-4 text-amber-500" />
                        Top 5 Pegawai Disiplin
                      </CardTitle>
                      <CardDescription className="text-[10px] mt-0.5">Bulan Ini (System Point)</CardDescription>
                    </div>
                    <Link href="/reward" className="text-xs text-primary hover:underline">Detail</Link>
                  </CardHeader>
                  <CardContent className="flex-1 p-0">
                    <ScrollArea className="h-[220px]">
                      <div className="px-6 pb-4 space-y-4">
                        {leaderboard.length === 0 ? (
                          <div className="text-center text-sm text-muted-foreground py-8">Belum ada data poin bulan ini.</div>
                        ) : (
                          leaderboard.map((lb: any, idx: number) => (
                            <div key={lb.id} className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-slate-200 text-slate-700' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-neutral-100 text-neutral-500'}`}>
                                {idx + 1}
                              </div>
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarImage src={lb.fotoUrl} />
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                  {lb.nama.substring(0,2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold truncate">{lb.nama}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{lb.bidang}</p>
                              </div>
                              <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                {lb.points} Pts
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* 3. MASA KONTRAK & PENSIUN */}
                <Card className="shadow-sm border-neutral-200/60 flex flex-col">
                  <CardHeader className="pb-3 border-b">
                     <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <FileClock className="w-4 h-4 text-indigo-500" />
                      Masa Kontrak & Pensiun
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 p-0">
                    <ScrollArea className="h-[220px]">
                      <div className="p-4 space-y-5">
                        {/* KONTRAK */}
                        <div>
                          <div className="text-xs font-bold text-neutral-500 mb-3 flex items-center gap-2 uppercase tracking-wide">
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                            Kontrak Segera Habis
                          </div>
                          <div className="space-y-3">
                            {!stats?.kontrakHampirHabis?.length ? (
                              <p className="text-[10px] text-muted-foreground italic">Tidak ada kontrak mendekati kadaluarsa.</p>
                            ) : (
                              stats.kontrakHampirHabis.map((k: any) => (
                                <div key={k.id} className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Avatar className="h-6 w-6 shrink-0">
                                      <AvatarImage src={k.pegawai?.fotoUrl} />
                                      <AvatarFallback className="text-[8px] bg-primary/10 text-primary">{k.pegawai?.nama.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <p className="text-[11px] font-medium truncate leading-tight">{k.pegawai?.nama}</p>
                                      <p className="text-[9px] text-muted-foreground truncate">{format(new Date(k.tanggalSelesai), 'dd MMM yyyy', {locale: id})}</p>
                                    </div>
                                  </div>
                                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0 rounded ${k.sisaHari <= 14 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                    {k.sisaHari} Hari
                                  </Badge>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                        
                        {/* PENSIUN */}
                        <div className="border-t pt-4">
                          <div className="text-xs font-bold text-neutral-500 mb-3 flex items-center gap-2 uppercase tracking-wide">
                            <div className="w-2 h-2 rounded-full bg-purple-500" />
                            Mendekati Pensiun
                          </div>
                          <div className="space-y-3">
                            {!stats?.pensiunTerdekat?.length ? (
                              <p className="text-[10px] text-muted-foreground italic">Tidak ada pegawai mendekati pensiun.</p>
                            ) : (
                              stats.pensiunTerdekat.map((p: any) => (
                                <div key={p.id} className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Avatar className="h-6 w-6 shrink-0">
                                      <AvatarImage src={p.fotoUrl} />
                                      <AvatarFallback className="text-[8px] bg-primary/10 text-primary">{p.nama.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <p className="text-[11px] font-medium truncate leading-tight">{p.nama}</p>
                                      <p className="text-[9px] text-muted-foreground truncate">Usia 56 Thn</p>
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded bg-purple-50 text-purple-600 border-purple-200">
                                    Tinggal {Math.ceil(p.sisaHari / 30)} Bln
                                  </Badge>
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

              {/* ROW 3: APPROVAL PANEL */}
              <div className="grid grid-cols-1 gap-6">
                <Card className="shadow-sm border-neutral-200/60">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      Approval Center (Tugas Anda)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ApprovalPanel />
                  </CardContent>
                </Card>
              </div>

              {/* ROW 4: CHARTS */}
              <div className="grid grid-cols-1 gap-6">
                <Card className="shadow-sm border-neutral-200/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Analitik Kepegawaian</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AnalyticsCharts />
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

function CompactStatsCard({ title, value, description, icon, trend }: any) {
  return (
    <Card className="shadow-sm border-neutral-200/60 hover:shadow-md transition-all group overflow-hidden">
      <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full bg-white dark:bg-neutral-950">
        <div className="flex justify-between items-start mb-2">
          <div className="bg-neutral-50 dark:bg-neutral-900 p-2 rounded-md group-hover:scale-110 transition-transform">
            {icon}
          </div>
          <p className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${trend.includes('+') || trend.includes('Beres') || trend.includes('Tepat') || trend.includes('Stabil') ? 'bg-emerald-50 text-emerald-600' : trend.includes('Perlu') || trend.includes('Segera') ? 'bg-rose-50 text-rose-600' : 'bg-neutral-100 text-neutral-600'}`}>
            {trend}
          </p>
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-50 leading-none mb-1">
            {value}
          </h3>
          <p className="text-[11px] font-semibold text-neutral-500 tracking-tight">
            {title}
          </p>
          <p className="text-[10px] text-neutral-400 mt-0.5 truncate">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
