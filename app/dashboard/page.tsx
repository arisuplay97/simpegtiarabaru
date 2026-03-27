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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Users, FileCheck, ShieldCheck, 
  Clock, Wallet, Calendar, AlertTriangle, UserCheck, CheckCircle2, FileClock, Medal
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

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
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Dashboard", "Utama"]} />
        <main className="flex-1 p-4 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Selamat Datang, {session?.user?.name || 'User'}
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
                Ringkasan operasional SDM hari ini — {format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })}.
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="px-3 py-1 font-semibold text-xs border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm text-neutral-600 dark:text-neutral-300">
                Sesi: {session?.user?.role || 'Guest'}
              </Badge>
            </div>
          </div>

          {isPegawai ? (
            // ==========================================
            // PEGAWAI VIEW
            // ==========================================
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <CompactStatsCard 
                  title="Sisa Cuti Tahunan" 
                  value={`${stats?.sisaCuti ?? 0} Hari`}
                  description="Hak cuti Anda tahun ini"
                  icon={<Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                  trend="Ajukan cuti jika perlu"
                  color="blue"
                />
                <CompactStatsCard 
                  title="Status Kehadiran" 
                  value={stats?.statusAbsensi || "-"} 
                  description={stats?.waktuAbsen ? `Jam masuk: ${stats.waktuAbsen}` : "Belum ada data absensi"}
                  icon={<Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                  trend={stats?.statusAbsensi === "HADIR" ? "+ Tepat Waktu" : "Perhatikan absensi"}
                  color="emerald"
                />
                <CompactStatsCard 
                  title="Slip Gaji Terbaru" 
                  value={stats?.gajiTerbaru ? `Rp ${stats.gajiTerbaru.toLocaleString('id-ID')}` : "Rp 0"} 
                  description={`Periode: ${stats?.periodeGaji || "-"}`}
                  icon={<Wallet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                  trend="Gaji bulan terakhir"
                  color="indigo"
                />
                <CompactStatsCard 
                  title="Pengajuan Anda" 
                  value={stats?.pengajuanPending || "0"} 
                  description="Proses approval PENDING"
                  icon={<ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                  trend="Menunggu HR/Atasan"
                  color="amber"
                />
              </div>
            </div>
          ) : (

            // ==========================================
            // SUPERADMIN / HRD VIEW
            // ==========================================
            <div className="space-y-6">
              {/* ROW 1: 5 COMPACT CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-5 gap-3 lg:gap-4">
                <CompactStatsCard 
                  title="Total Pegawai" 
                  value={stats?.totalPegawai || "0"} 
                  description="Keseluruhan SDM Aktif"
                  icon={<Users className="w-4 h-4 text-primary" />}
                  trend="+ Stabil"
                  color="primary"
                />
                <CompactStatsCard 
                  title="Approval Pending" 
                  value={stats?.approvalPending || "0"} 
                  description="Menunggu verifikasi Anda"
                  icon={<FileCheck className="w-4 h-4 text-amber-600" />}
                  trend={stats?.approvalPending > 0 ? "Perlu Tindakan" : "Semua Beres"}
                  color="amber"
                />
                <CompactStatsCard 
                  title="Kehadiran Hari Ini" 
                  value={`${stats?.kehadiranHariIni?.persenHadir || 0}%`}
                  description={`${stats?.kehadiranHariIni?.hadir || 0} Tepat, ${stats?.kehadiranHariIni?.terlambat || 0} Telat`}
                  icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  trend="Berdasarkan absensi"
                  color="emerald"
                />
                <CompactStatsCard 
                  title="Kontrak Expiring" 
                  value={stats?.kontrakHampirHabis?.filter((k: any) => k.sisaHari <= 14).length || "0"} 
                  description="Dalam 14 hari ke depan"
                  icon={<AlertTriangle className="w-4 h-4 text-rose-600" />}
                  trend="Segera perbarui"
                  color="rose"
                />

                {/* 5th Card: Minimalist Top 5 */}
                <Card className="shadow-sm border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow duration-200 bg-white dark:bg-neutral-900 h-full min-h-[125px] flex flex-col">
                  <div className="p-3 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50">
                    <h3 className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 uppercase tracking-wide">
                      <Medal className="w-3.5 h-3.5 text-amber-500" /> Top 5 Disiplin
                    </h3>
                    <Link href="/reward" className="text-[9px] font-semibold text-primary hover:underline transition-colors">Lihat</Link>
                  </div>
                  <CardContent className="p-0 flex-1 flex flex-col">
                    <div className="overflow-hidden flex-1 w-full bg-white dark:bg-neutral-900 divide-y divide-neutral-100 dark:divide-neutral-800">
                      {leaderboard.length === 0 ? (
                        <div className="text-[10px] text-muted-foreground text-center py-4 italic">Belum ada poin</div>
                      ) : (
                        leaderboard.slice(0, 4).map((lb: any, i: number) => (
                          <div key={lb.id} className="flex justify-between items-center px-3 py-1.5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50 group">
                            <span className="text-[10px] font-medium truncate w-[75%] text-neutral-600 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                              <span className="font-semibold text-neutral-400 dark:text-neutral-500 mr-1.5">{i+1}.</span>{lb.nama}
                            </span>
                            <span className="text-[10px] font-bold text-amber-600">{lb.points}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* MAIN BODY: 3 COLUMNS. LEFT(2) AND RIGHT(1) */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* LEFT SIDE (2 COLUMNS WIDTH) */}
                <div className="xl:col-span-2 space-y-6">
                  
                  {/* DYNAMIC METRICS: KEHADIRAN & KONTRAK */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* KEHADIRAN HARI INI */}
                    <Card className="shadow-sm border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col h-full hover:shadow-md transition-shadow">
                      <div className="p-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex">
                        <h3 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                          Kehadiran Hari Ini
                        </h3>
                      </div>
                      <CardContent className="flex-1 flex flex-col p-4">
                        <div className="mb-4">
                          <div className="flex justify-between items-end mb-1">
                            <span className="text-3xl font-bold tracking-tighter text-neutral-900 dark:text-white">
                              {stats?.kehadiranHariIni?.persenHadir || 0}%
                            </span>
                            <span className="text-xs font-medium text-neutral-400">Total Kedatangan</span>
                          </div>
                          <Progress value={stats?.kehadiranHariIni?.persenHadir || 0} className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full indicator-emerald" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2.5 mt-auto">
                          <div className="bg-neutral-50 dark:bg-neutral-900 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800">
                            <div className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-1">Hadir Total</div>
                            <div className="text-xl font-bold text-neutral-800 dark:text-neutral-100 leading-none">{(stats?.kehadiranHariIni?.hadir || 0) + (stats?.kehadiranHariIni?.terlambat || 0)}</div>
                          </div>
                          <div className="bg-neutral-50 dark:bg-neutral-900 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800">
                            <div className="text-amber-600 dark:text-amber-500 text-[10px] font-bold uppercase tracking-wider mb-1">Terlambat</div>
                            <div className="text-xl font-bold text-neutral-800 dark:text-neutral-100 leading-none">{stats?.kehadiranHariIni?.terlambat || 0}</div>
                          </div>
                          <div className="bg-neutral-50 dark:bg-neutral-900 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800">
                            <div className="text-indigo-500 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider mb-1">Izin/Cuti</div>
                            <div className="text-xl font-bold text-neutral-800 dark:text-neutral-100 leading-none">{stats?.kehadiranHariIni?.sakitCuti || 0}</div>
                          </div>
                          <div className="bg-neutral-50 dark:bg-neutral-900 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800">
                            <div className="text-rose-500 dark:text-rose-400 text-[10px] font-bold uppercase tracking-wider mb-1">Alpha</div>
                            <div className="text-xl font-bold text-neutral-800 dark:text-neutral-100 leading-none">{stats?.kehadiranHariIni?.belumAlpa || 0}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* MASA KONTRAK & PENSIUN (CLEAN DESIGN) */}
                    <Card className="shadow-sm border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col h-full hover:shadow-md transition-shadow">
                      <div className="p-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex">
                        <h3 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                          <FileClock className="w-4 h-4 text-indigo-600 dark:text-indigo-500" />
                          Masa Kontrak & Pensiun
                        </h3>
                      </div>
                      <CardContent className="flex-1 p-0">
                        <ScrollArea className="h-full max-h-[190px]">
                          <div className="p-0">
                            
                            {/* KONTRAK BLOK */}
                            <div>
                               <div className="bg-orange-50/50 dark:bg-orange-950/20 px-4 py-1.5 flex items-center gap-2 border-y border-orange-100 dark:border-orange-900/30">
                                 <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                 <span className="text-[10px] font-bold text-orange-700 dark:text-orange-400 uppercase tracking-widest">Kontrak Habis</span>
                               </div>
                               <ul className="divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
                                 {!stats?.kontrakHampirHabis?.length ? (
                                    <li className="px-4 py-3 text-[11px] text-neutral-400 italic">Tidak ada kontrak mendekati kadaluarsa.</li>
                                 ) : (
                                    stats.kontrakHampirHabis.map((k: any) => (
                                      <li key={k.id} className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                          <Avatar className="h-6 w-6 shrink-0 ring-1 ring-neutral-200 dark:ring-neutral-700">
                                            <AvatarImage src={k.pegawai?.fotoUrl} />
                                            <AvatarFallback className="text-[8px] bg-neutral-100 text-neutral-600">{k.pegawai?.nama.charAt(0)}</AvatarFallback>
                                          </Avatar>
                                          <div className="min-w-0">
                                            <p className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 truncate">{k.pegawai?.nama}</p>
                                          </div>
                                        </div>
                                        <div className="shrink-0 text-right">
                                          <span className={cn(
                                            "text-[10px] font-bold", 
                                            k.sisaHari <= 14 ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-500"
                                          )}>
                                            {k.sisaHari} Hari
                                          </span>
                                        </div>
                                      </li>
                                    ))
                                 )}
                               </ul>
                            </div>

                            {/* PENSIUN BLOK */}
                            <div>
                               <div className="bg-purple-50/50 dark:bg-purple-950/20 px-4 py-1.5 flex items-center gap-2 border-y border-purple-100 dark:border-purple-900/30">
                                 <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                 <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-widest">Mendekati Pensiun</span>
                               </div>
                               <ul className="divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
                                 {!stats?.pensiunTerdekat?.length ? (
                                    <li className="px-4 py-3 text-[11px] text-neutral-400 italic">Belum ada data pensiun terdekat.</li>
                                 ) : (
                                    stats.pensiunTerdekat.map((p: any) => (
                                      <li key={p.id} className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                          <Avatar className="h-6 w-6 shrink-0 ring-1 ring-neutral-200 dark:ring-neutral-700">
                                            <AvatarImage src={p.fotoUrl} />
                                            <AvatarFallback className="text-[8px] bg-neutral-100 text-neutral-600">{p.nama.charAt(0)}</AvatarFallback>
                                          </Avatar>
                                          <div className="min-w-0">
                                            <p className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 truncate">{p.nama}</p>
                                          </div>
                                        </div>
                                        <div className="shrink-0 text-right">
                                          <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                                            {Math.ceil(p.sisaHari / 30)} Bln
                                          </span>
                                        </div>
                                      </li>
                                    ))
                                 )}
                               </ul>
                            </div>

                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>

                  </div>

                  {/* ROW 3: CHARTS */}
                  <Card className="shadow-sm border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:shadow-md transition-shadow">
                    <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                      <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Analitik Kepegawaian</h3>
                    </div>
                    <CardContent className="p-4">
                      <AnalyticsCharts />
                    </CardContent>
                  </Card>

                </div>

                {/* RIGHT SIDE: APPROVAL */}
                <Card className="shadow-sm border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col hover:shadow-md transition-shadow xl:min-h-[500px]">
                  <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex flex-col gap-1">
                    <h3 className="text-sm font-semibold flex items-center gap-2 text-neutral-800 dark:text-neutral-200">
                      <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                      Approval Center
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Urus permohonan tertunda</p>
                  </div>
                  <CardContent className="flex-1 p-0 relative">
                    <ScrollArea className="absolute inset-0 h-[400px] xl:h-[calc(100vh-270px)]">
                      <ApprovalPanel />
                    </ScrollArea>
                  </CardContent>
                </Card>

              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function CompactStatsCard({ title, value, description, icon, trend, color = "primary" }: any) {
  const colors: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-500",
    indigo: "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400",
    blue: "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400",
    rose: "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400",
  }

  return (
    <Card className="shadow-sm border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow duration-200 bg-white dark:bg-neutral-900 h-full min-h-[125px] flex flex-col">
      <CardContent className="p-4 flex flex-col justify-between h-full flex-1">
        <div className="flex justify-between items-start mb-2">
          <div className={cn("p-2 rounded-lg shrink-0", colors[color] || colors.primary)}>
            {icon}
          </div>
          <p className={cn(
            "text-[9px] font-bold px-2 py-0.5 rounded-full border truncate max-w-[65%]",
            trend.includes('+') || trend.includes('Beres') || trend.includes('Tepat') || trend.includes('Stabil') 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
              : trend.includes('Perlu') || trend.includes('Segera') || trend.includes('Perhatikan')
                ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' 
                : 'bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700'
          )}>
            {trend}
          </p>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight leading-none mb-1">
            {value}
          </h3>
          <p className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 truncate">
            {title}
          </p>
          <p className="text-[9px] text-neutral-400 dark:text-neutral-500 mt-0.5 truncate w-full hidden sm:block">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
