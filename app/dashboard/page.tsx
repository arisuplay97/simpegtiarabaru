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
    <div className="flex min-h-screen bg-slate-50/50 dark:bg-neutral-950">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Dashboard", "Utama"]} />
        <main className="flex-1 p-4 lg:p-6 space-y-6">
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
              <Badge variant="secondary" className="px-3 py-1 font-medium shadow-sm bg-white dark:bg-neutral-800 border">
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
                  icon={<Calendar className="w-5 h-5 text-blue-600" />}
                  trend="Ajukan cuti jika perlu"
                  color="blue"
                />
                <CompactStatsCard 
                  title="Status Kehadiran" 
                  value={stats?.statusAbsensi || "-"} 
                  description={stats?.waktuAbsen ? `Jam masuk: ${stats.waktuAbsen}` : "Belum ada data hari ini"}
                  icon={<Clock className="w-5 h-5 text-emerald-600" />}
                  trend={stats?.statusAbsensi === "HADIR" ? "+ Tepat Waktu" : "Perhatikan absensi"}
                  color="emerald"
                />
                <CompactStatsCard 
                  title="Slip Gaji Terbaru" 
                  value={stats?.gajiTerbaru ? `Rp ${stats.gajiTerbaru.toLocaleString('id-ID')}` : "Rp 0"} 
                  description={`Periode: ${stats?.periodeGaji || "-"}`}
                  icon={<Wallet className="w-5 h-5 text-indigo-600" />}
                  trend="Gaji bulan terakhir"
                  color="indigo"
                />
                <CompactStatsCard 
                  title="Pengajuan Anda" 
                  value={stats?.pengajuanPending || "0"} 
                  description="Proses approval PENDING"
                  icon={<ShieldCheck className="w-5 h-5 text-amber-600" />}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-5 gap-3">
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
                  icon={<FileCheck className="w-4 h-4 text-amber-500" />}
                  trend={stats?.approvalPending > 0 ? "Perlu Tindakan" : "Semua Beres"}
                  color="amber"
                />
                <CompactStatsCard 
                  title="Kehadiran Hari Ini" 
                  value={`${stats?.kehadiranHariIni?.persenHadir || 0}%`}
                  description={`${stats?.kehadiranHariIni?.hadir || 0} Tepat, ${stats?.kehadiranHariIni?.terlambat || 0} Telat`}
                  icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  trend="Berdasarkan absensi"
                  color="emerald"
                />
                <CompactStatsCard 
                  title="Kontrak Expiring" 
                  value={stats?.kontrakHampirHabis?.filter((k: any) => k.sisaHari <= 14).length || "0"} 
                  description="Dalam 14 hari ke depan"
                  icon={<AlertTriangle className="w-4 h-4 text-rose-500" />}
                  trend="Segera perbarui"
                  color="rose"
                />

                {/* 5th Card: Ultra Compact Top 5 */}
                <Card className="shadow-lg shadow-neutral-200/30 border-neutral-200/60 dark:shadow-none hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group overflow-hidden relative bg-white dark:bg-background h-full min-h-[135px]">
                  <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-20 transition-transform group-hover:scale-150 duration-500 z-0 bg-amber-500" />
                  <CardContent className="p-3 flex flex-col h-full relative z-10 w-full overflow-hidden">
                    <div className="flex justify-between items-center mb-1.5 shrink-0">
                      <h3 className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                        <Medal className="w-3.5 h-3.5 text-amber-500" /> Top 5 Disiplin
                      </h3>
                      <Link href="/reward" className="text-[8px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 px-1.5 py-0.5 rounded transition-colors shadow-sm">Detail</Link>
                    </div>
                    <div className="space-y-1 overflow-hidden flex-1 w-full justify-center flex flex-col">
                      {leaderboard.length === 0 ? (
                        <div className="text-[9px] text-muted-foreground text-center italic">Belum ada poin</div>
                      ) : (
                        leaderboard.slice(0, 5).map((lb: any, i: number) => (
                          <div key={lb.id} className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-900/50 px-1.5 py-0.5 rounded border border-neutral-100 dark:border-neutral-800 transition-colors hover:border-amber-200">
                            <span className="text-[9px] font-medium truncate w-[75%] text-neutral-600 dark:text-neutral-300">
                              <span className="font-bold text-neutral-400 mr-1">{i+1}.</span>{lb.nama}
                            </span>
                            <span className="text-[9px] font-black text-amber-600">{lb.points}</span>
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
                    
                    {/* KEHADIRAN HARI INI (DISUSUTKAN / DIKECILKAN) */}
                    <Card className="shadow-lg shadow-neutral-200/40 border-neutral-200/60 dark:shadow-none flex flex-col group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden h-full">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110"></div>
                      <CardHeader className="p-3 border-b bg-white/50 dark:bg-background/50 backdrop-blur-sm">
                        <CardTitle className="text-xs font-semibold flex items-center gap-2">
                          <div className="p-1 bg-primary/10 rounded-md"><UserCheck className="w-3 h-3 text-primary" /></div>
                          Kehadiran Hari Ini
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col p-3 bg-gradient-to-b from-white to-slate-50/50 dark:from-background dark:to-background">
                        <div className="mb-3">
                          <div className="flex justify-between items-end mb-1">
                            <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-500 dark:from-white dark:to-neutral-400">
                              {stats?.kehadiranHariIni?.persenHadir || 0}%
                            </span>
                            <span className="text-[10px] font-medium text-muted-foreground">Hadir & Telat</span>
                          </div>
                          <Progress value={stats?.kehadiranHariIni?.persenHadir || 0} className="h-1.5 bg-neutral-100 dark:bg-neutral-800" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mt-auto">
                          <div className="bg-white dark:bg-neutral-900 p-2 rounded-lg border border-neutral-100 dark:border-neutral-800 shadow-sm hover:border-emerald-200 transition-colors">
                            <div className="text-emerald-600 dark:text-emerald-400 text-[9px] font-bold uppercase tracking-wider mb-0.5">Hadir Total</div>
                            <div className="text-lg font-black leading-none">{(stats?.kehadiranHariIni?.hadir || 0) + (stats?.kehadiranHariIni?.terlambat || 0)}</div>
                          </div>
                          <div className="bg-white dark:bg-neutral-900 p-2 rounded-lg border border-neutral-100 dark:border-neutral-800 shadow-sm hover:border-amber-200 transition-colors">
                            <div className="text-amber-600 dark:text-amber-400 text-[9px] font-bold uppercase tracking-wider mb-0.5">Terlambat</div>
                            <div className="text-lg font-black leading-none">{stats?.kehadiranHariIni?.terlambat || 0}</div>
                          </div>
                          <div className="bg-white dark:bg-neutral-900 p-2 rounded-lg border border-neutral-100 dark:border-neutral-800 shadow-sm hover:border-indigo-200 transition-colors">
                            <div className="text-neutral-500 dark:text-neutral-400 text-[9px] font-bold uppercase tracking-wider mb-0.5">Izin/Cuti</div>
                            <div className="text-lg font-black leading-none">{stats?.kehadiranHariIni?.sakitCuti || 0}</div>
                          </div>
                          <div className="bg-white dark:bg-neutral-900 p-2 rounded-lg border border-neutral-100 dark:border-neutral-800 shadow-sm hover:border-rose-200 transition-colors">
                            <div className="text-rose-600 dark:text-rose-400 text-[9px] font-bold uppercase tracking-wider mb-0.5">Alpha</div>
                            <div className="text-lg font-black leading-none">{stats?.kehadiranHariIni?.belumAlpa || 0}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* MASA KONTRAK & PENSIUN (DIPINDAHKAN KE TENGAH) */}
                    <Card className="shadow-lg shadow-neutral-200/40 border-neutral-200/60 dark:shadow-none flex flex-col group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden h-full">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110"></div>
                      <CardHeader className="p-3 border-b bg-white/50 dark:bg-background/50 backdrop-blur-sm">
                        <CardTitle className="text-xs font-semibold flex items-center gap-2">
                          <div className="p-1 bg-indigo-100 dark:bg-indigo-900/40 rounded-md"><FileClock className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /></div>
                          Masa Kontrak & Pensiun
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1 p-0 relative">
                        <ScrollArea className="h-full max-h-[170px] bg-gradient-to-b from-white to-slate-50/50 dark:from-background dark:to-background">
                          <div className="p-3 space-y-4">
                            {/* KONTRAK */}
                            <div>
                              <div className="text-[9px] font-black text-neutral-500 mb-2 flex items-center gap-1.5 uppercase tracking-widest">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)] animate-pulse" />
                                Kontrak Habis
                              </div>
                              <div className="space-y-2">
                                {!stats?.kontrakHampirHabis?.length ? (
                                  <p className="text-[9px] text-muted-foreground italic bg-neutral-50 dark:bg-neutral-900 p-2 rounded-lg text-center">Aman. Tidak ada kadaluarsa.</p>
                                ) : (
                                  stats.kontrakHampirHabis.map((k: any) => (
                                    <div key={k.id} className="flex items-center justify-between gap-1.5 bg-white dark:bg-neutral-900/50 p-1.5 rounded-lg border border-transparent hover:border-neutral-100 dark:hover:border-neutral-800 transition-colors shadow-sm">
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <div className="min-w-0 flex-1">
                                          <p className="text-[10px] font-bold text-neutral-800 dark:text-neutral-200 truncate leading-tight">{k.pegawai?.nama}</p>
                                        </div>
                                      </div>
                                      <Badge variant="outline" className={`text-[8px] font-black px-1.5 py-0 rounded shadow-sm border ${k.sisaHari <= 14 ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20' : 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/20'}`}>
                                        {k.sisaHari} Hari
                                      </Badge>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                            
                            {/* PENSIUN */}
                            <div className="border-t border-dashed border-neutral-200 dark:border-neutral-800 pt-3">
                              <div className="text-[9px] font-black text-neutral-500 mb-2 flex items-center gap-1.5 uppercase tracking-widest">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                Mendekati Pensiun
                              </div>
                              <div className="space-y-2">
                                {!stats?.pensiunTerdekat?.length ? (
                                  <p className="text-[9px] text-muted-foreground italic bg-neutral-50 dark:bg-neutral-900 p-2 rounded-lg text-center">Belum ada pegawai pensiun.</p>
                                ) : (
                                  stats.pensiunTerdekat.map((p: any) => (
                                    <div key={p.id} className="flex items-center justify-between gap-1.5 bg-white dark:bg-neutral-900/50 p-1.5 rounded-lg border border-transparent hover:border-neutral-100 dark:hover:border-neutral-800 transition-colors shadow-sm">
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <div className="min-w-0 flex-1">
                                          <p className="text-[10px] font-bold text-neutral-800 dark:text-neutral-200 truncate leading-tight">{p.nama}</p>
                                        </div>
                                      </div>
                                      <Badge variant="outline" className="text-[8px] font-black px-1.5 py-0 rounded shadow-sm bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-500/10 dark:border-purple-500/20">
                                        {Math.ceil(p.sisaHari / 30)} Bln
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

                  {/* ROW 3: CHARTS */}
                  <Card className="shadow-lg shadow-neutral-200/40 border-neutral-200/60 dark:shadow-none hover:-translate-y-1 transition-transform duration-300">
                    <CardHeader className="p-4 border-b bg-white/50 dark:bg-background/50 backdrop-blur-sm">
                      <CardTitle className="text-sm font-semibold">Analitik Kepegawaian</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 p-4 bg-white dark:bg-background">
                      <AnalyticsCharts />
                    </CardContent>
                  </Card>

                </div>

                {/* RIGHT SIDE (1 COLUMN WIDE, TALL) */}
                <Card className="shadow-lg shadow-neutral-200/40 border-neutral-200/60 dark:shadow-none flex flex-col group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden xl:min-h-[500px]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110"></div>
                  <CardHeader className="p-4 border-b bg-white/50 dark:bg-background/50 backdrop-blur-sm shadow-sm z-10">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                       <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-md"><FileCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" /></div>
                      Approval Center
                    </CardTitle>
                    <CardDescription className="text-xs">Urus permohonan tertunda</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 p-0 relative">
                    <ScrollArea className="absolute inset-0 h-[400px] xl:h-[calc(100vh-270px)] bg-gradient-to-b from-white to-slate-50/50 dark:from-background dark:to-background">
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
    <Card className="shadow-lg shadow-neutral-200/30 border-neutral-200/60 dark:shadow-none hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group overflow-hidden relative bg-white dark:bg-background h-full min-h-[135px]">
      {/* Decorative gradient blur background */}
      <div className={cn("absolute -right-6 -top-6 w-20 h-20 sm:w-24 sm:h-24 rounded-full blur-2xl opacity-20 transition-transform group-hover:scale-150 duration-500 z-0",
        color === "primary" ? "bg-primary" :
        color === "emerald" ? "bg-emerald-500" :
        color === "amber" ? "bg-amber-500" :
        color === "indigo" ? "bg-indigo-500" :
        color === "rose" ? "bg-rose-500" : "bg-blue-500"
      )} />
      
      <CardContent className="p-3 sm:p-4 flex flex-col justify-between h-full relative z-10">
        <div className="flex justify-between items-start mb-1 sm:mb-2">
          <div className={cn("p-1.5 sm:p-2 rounded-xl border border-white/50 dark:border-neutral-800 shadow-sm transition-transform duration-300 group-hover:scale-110 shrink-0", colors[color] || colors.primary)}>
            {icon}
          </div>
          <p className={cn(
            "text-[8px] sm:text-[9px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full border shadow-sm truncate max-w-[65%]",
            trend.includes('+') || trend.includes('Beres') || trend.includes('Tepat') || trend.includes('Stabil') 
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20' 
              : trend.includes('Perlu') || trend.includes('Segera') 
                ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20' 
                : 'bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400'
          )}>
            {trend}
          </p>
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-50 leading-none mb-0.5 sm:mb-1 shadow-sm">
            {value}
          </h3>
          <p className="text-[10px] sm:text-[11px] font-bold text-neutral-600 dark:text-neutral-300 tracking-tight truncate">
            {title}
          </p>
          <p className="text-[8px] sm:text-[9px] text-neutral-400 dark:text-neutral-500 mt-0.5 truncate max-w-[95%]">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
