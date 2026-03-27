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
  ShieldCheck, Calendar, Clock, Wallet,
  Activity, Zap, Fingerprint, Crown, Sparkles, Orbit, Flame, FileClock, UserCheck, Medal, CheckCircle2, AlertTriangle, Users
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
    <div className="flex min-h-screen bg-[#f8fafc] dark:bg-[#09090b] text-neutral-900 dark:text-neutral-100 relative overflow-hidden z-0">
      {/* Dekorasi Background Premium Soft UI / Glassmorphism */}
      <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-gradient-to-bl from-indigo-100/60 via-purple-50/40 to-transparent dark:from-indigo-900/20 dark:via-purple-900/10 dark:to-transparent rounded-full blur-[100px] transform translate-x-1/4 -translate-y-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 -z-10 w-[500px] h-[500px] bg-gradient-to-tr from-emerald-50/60 via-teal-50/20 to-transparent dark:from-emerald-900/10 dark:via-teal-900/5 dark:to-transparent rounded-full blur-[100px] transform -translate-x-1/3 translate-y-1/3 pointer-events-none" />
      
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Dashboard", "Utama"]} />
        <main className="flex-1 p-4 lg:p-8 space-y-8 max-w-[1400px] mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Selamat Datang, {session?.user?.name || 'User'}
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
                Ringkasan operasional SDM hari ini — {format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })}.
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <Badge variant="outline" className="px-4 py-1.5 font-bold text-xs border-neutral-200/60 dark:border-neutral-800/60 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md text-neutral-700 dark:text-neutral-300 rounded-full shadow-sm">
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
                  icon={<Orbit className="w-5 h-5 text-white" />}
                  trend="+ Stabil"
                  color="primary"
                />
                <CompactStatsCard 
                  title="Approval Pending" 
                  value={stats?.approvalPending || "0"} 
                  description="Menunggu verifikasi Anda"
                  icon={<Fingerprint className="w-5 h-5 text-white" />}
                  trend={stats?.approvalPending > 0 ? "Perlu Tindakan" : "Semua Beres"}
                  color="amber"
                />
                <CompactStatsCard 
                  title="Kehadiran Hari Ini" 
                  value={`${stats?.kehadiranHariIni?.persenHadir || 0}%`}
                  description={`${stats?.kehadiranHariIni?.hadir || 0} Tepat, ${stats?.kehadiranHariIni?.terlambat || 0} Telat`}
                  icon={<Sparkles className="w-5 h-5 text-white" />}
                  trend="Berdasarkan absensi"
                  color="emerald"
                />
                <CompactStatsCard 
                  title="Kontrak Expiring" 
                  value={stats?.kontrakHampirHabis?.filter((k: any) => k.sisaHari <= 14).length || "0"} 
                  description="Dalam 14 hari ke depan"
                  icon={<Flame className="w-5 h-5 text-white" />}
                  trend="Segera perbarui"
                  color="rose"
                />

                {/* 5th Card: Horizontal Top 5 */}
                <Card className="rounded-[24px] border border-white/40 dark:border-neutral-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl transition-all duration-300 h-full min-h-[140px] flex flex-col relative overflow-hidden group sm:col-span-2 xl:col-span-1">
                  <div className="p-4 flex justify-between items-center bg-transparent z-10 relative">
                    <h3 className="text-[11px] font-extrabold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 uppercase tracking-wider">
                      <Crown className="w-4 h-4 text-amber-500" /> Bintang Bulan Ini
                    </h3>
                    <Link href="/reward" className="text-[10px] bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-full font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">Lihat</Link>
                  </div>
                  <CardContent className="p-4 pt-1 flex-1 flex flex-col justify-center relative z-10">
                    <div className="flex justify-between items-end gap-1 px-1">
                      {leaderboard.length === 0 ? (
                        <div className="text-xs text-muted-foreground w-full text-center py-4 italic">Belum ada data</div>
                      ) : (
                        leaderboard.slice(0, 5).map((lb: any, i: number) => (
                          <div key={lb.id} className="flex flex-col items-center gap-1.5 group/ava cursor-pointer">
                            <div className="relative">
                              <Avatar className={cn(
                                "w-10 h-10 border-2 shadow-sm transition-transform duration-300 group-hover/ava:scale-110 group-hover/ava:-translate-y-1 ring-2 ring-offset-1 ring-offset-white dark:ring-offset-neutral-900",
                                i === 0 ? "border-amber-400 ring-amber-50 dark:ring-amber-900/30" : 
                                i === 1 ? "border-slate-300 ring-slate-50 dark:ring-slate-800/50" :
                                i === 2 ? "border-orange-300 ring-orange-50 dark:ring-orange-900/30" :
                                "border-white dark:border-neutral-700 ring-transparent"
                              )}>
                                <AvatarImage src={lb.fotoUrl} />
                                <AvatarFallback className="text-[10px] font-bold bg-neutral-100 text-neutral-600">{lb.nama.charAt(0)}</AvatarFallback>
                              </Avatar>
                              {i < 3 && (
                                <div className={cn(
                                  "absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-extrabold text-white shadow-sm ring-2 ring-white dark:ring-neutral-900",
                                  i === 0 ? "bg-amber-500" : i === 1 ? "bg-slate-400" : "bg-orange-400"
                                )}>
                                  {i + 1}
                                </div>
                              )}
                            </div>
                            <span className="text-[9px] font-bold max-w-[48px] text-center truncate text-neutral-500 dark:text-neutral-400 group-hover/ava:text-primary transition-colors">
                              {lb.nama.split(' ')[0]}
                            </span>
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
                    <Card className="rounded-[24px] border border-white/40 dark:border-neutral-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl flex flex-col h-full hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all duration-300">
                      <div className="p-4 border-b border-neutral-100/50 dark:border-neutral-800/50 bg-transparent flex items-center justify-between">
                        <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2 tracking-wide">
                          <Activity className="w-4 h-4 text-emerald-500" /> Kehadiran Hari Ini
                        </h3>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 text-[9px] font-bold px-2 py-0.5 rounded-full">
                          Live Data
                        </Badge>
                      </div>
                      <CardContent className="flex-1 flex flex-col p-5">
                        <div className="mb-5 flex items-end justify-between">
                          <div>
                            <div className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">Tingkat Kedatangan</div>
                            <span className="text-5xl font-extrabold tracking-tighter text-neutral-900 dark:text-white drop-shadow-sm leading-none">
                              {stats?.kehadiranHariIni?.persenHadir || 0}<span className="text-2xl text-neutral-400">%</span>
                            </span>
                          </div>
                        </div>
                        <Progress value={stats?.kehadiranHariIni?.persenHadir || 0} className="h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full indicator-emerald shadow-inner mb-6" />
                        
                        <div className="grid grid-cols-2 gap-3 mt-auto">
                          <div className="bg-white dark:bg-neutral-800/50 p-3 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm transition-transform hover:-translate-y-0.5 duration-200">
                            <div className="flex items-center gap-1.5 mb-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"/><div className="text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider">Hadir</div></div>
                            <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 leading-none pl-3.5">{(stats?.kehadiranHariIni?.hadir || 0) + (stats?.kehadiranHariIni?.terlambat || 0)}</div>
                          </div>
                          <div className="bg-white dark:bg-neutral-800/50 p-3 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm transition-transform hover:-translate-y-0.5 duration-200">
                            <div className="flex items-center gap-1.5 mb-1.5"><div className="w-2 h-2 rounded-full bg-amber-500 shrink-0"/><div className="text-amber-600 dark:text-amber-500 text-[10px] font-extrabold uppercase tracking-wider">Terlambat</div></div>
                            <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 leading-none pl-3.5">{stats?.kehadiranHariIni?.terlambat || 0}</div>
                          </div>
                          <div className="bg-white dark:bg-neutral-800/50 p-3 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm transition-transform hover:-translate-y-0.5 duration-200">
                            <div className="flex items-center gap-1.5 mb-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"/><div className="text-indigo-500 dark:text-indigo-400 text-[10px] font-extrabold uppercase tracking-wider">Izin/Cuti</div></div>
                            <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 leading-none pl-3.5">{stats?.kehadiranHariIni?.sakitCuti || 0}</div>
                          </div>
                          <div className="bg-white dark:bg-neutral-800/50 p-3 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm transition-transform hover:-translate-y-0.5 duration-200">
                            <div className="flex items-center gap-1.5 mb-1.5"><div className="w-2 h-2 rounded-full bg-rose-500 shrink-0"/><div className="text-rose-500 dark:text-rose-400 text-[10px] font-extrabold uppercase tracking-wider">Alpha</div></div>
                            <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 leading-none pl-3.5">{stats?.kehadiranHariIni?.belumAlpa || 0}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* MASA KONTRAK & PENSIUN (CLEAN DESIGN) */}
                    <Card className="rounded-[24px] border border-white/40 dark:border-neutral-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl flex flex-col h-full hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all duration-300">
                      <div className="p-4 border-b border-neutral-100/50 dark:border-neutral-800/50 bg-transparent flex items-center justify-between">
                        <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2 tracking-wide">
                          <FileClock className="w-4 h-4 text-indigo-500" />
                          Masa Kontrak & Pensiun
                        </h3>
                      </div>
                      <CardContent className="flex-1 p-0">
                        <ScrollArea className="h-full max-h-[190px]">
                          <div className="p-3 space-y-4">
                            
                            {/* KONTRAK BLOK */}
                            <div>
                               <div className="flex items-center gap-2 mb-2.5 px-1">
                                 <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                 <span className="text-[10px] font-extrabold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">Kontrak Habis</span>
                               </div>
                               <div className="space-y-2">
                                 {!stats?.kontrakHampirHabis?.length ? (
                                    <div className="px-3 py-3 text-[11px] text-neutral-400 italic bg-white/50 dark:bg-neutral-800/30 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 text-center">Aman, tidak ada kontrak segera habis.</div>
                                 ) : (
                                    stats.kontrakHampirHabis.map((k: any) => (
                                      <div key={k.id} className="bg-white dark:bg-neutral-800/60 p-2.5 rounded-[18px] border border-neutral-100 dark:border-neutral-800 shadow-sm flex items-center justify-between gap-3 hover:border-orange-200 dark:hover:border-orange-900/50 transition-colors group">
                                        <div className="flex items-center gap-3 min-w-0 pr-2">
                                          <Avatar className="h-8 w-8 shrink-0 ring-2 ring-white dark:ring-neutral-900 shadow-sm">
                                            <AvatarImage src={k.pegawai?.fotoUrl} />
                                            <AvatarFallback className="text-[10px] font-bold bg-neutral-100 text-neutral-600">{k.pegawai?.nama.charAt(0)}</AvatarFallback>
                                          </Avatar>
                                          <div className="min-w-0">
                                            <p className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 truncate group-hover:text-orange-600 transition-colors">{k.pegawai?.nama}</p>
                                          </div>
                                        </div>
                                        <div className="shrink-0 text-right pr-1">
                                          <span className={cn(
                                            "text-[10px] font-black px-2.5 py-1.5 rounded-xl", 
                                            k.sisaHari <= 14 ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400" : "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
                                          )}>
                                            {k.sisaHari} Hari
                                          </span>
                                        </div>
                                      </div>
                                    ))
                                 )}
                               </div>
                            </div>

                            {/* PENSIUN BLOK */}
                            <div>
                               <div className="flex items-center gap-2 mb-2.5 px-1">
                                 <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                 <span className="text-[10px] font-extrabold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">Mendekati Pensiun</span>
                               </div>
                               <div className="space-y-2">
                                 {!stats?.pensiunTerdekat?.length ? (
                                    <div className="px-3 py-3 text-[11px] text-neutral-400 italic bg-white/50 dark:bg-neutral-800/30 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 text-center">Belum ada data pensiun terdekat.</div>
                                 ) : (
                                    stats.pensiunTerdekat.map((p: any) => (
                                      <div key={p.id} className="bg-white dark:bg-neutral-800/60 p-2.5 rounded-[18px] border border-neutral-100 dark:border-neutral-800 shadow-sm flex items-center justify-between gap-3 hover:border-purple-200 dark:hover:border-purple-900/50 transition-colors group">
                                        <div className="flex items-center gap-3 min-w-0 pr-2">
                                          <Avatar className="h-8 w-8 shrink-0 ring-2 ring-white dark:ring-neutral-900 shadow-sm">
                                            <AvatarImage src={p.fotoUrl} />
                                            <AvatarFallback className="text-[10px] font-bold bg-neutral-100 text-neutral-600">{p.nama.charAt(0)}</AvatarFallback>
                                          </Avatar>
                                          <div className="min-w-0">
                                            <p className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 truncate group-hover:text-purple-600 transition-colors">{p.nama}</p>
                                          </div>
                                        </div>
                                        <div className="shrink-0 text-right pr-1">
                                          <span className="text-[10px] font-black bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 px-2.5 py-1.5 rounded-xl">
                                            {Math.ceil(p.sisaHari / 30)} Bln
                                          </span>
                                        </div>
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
                  <Card className="rounded-[24px] border border-white/40 dark:border-neutral-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all duration-300 relative overflow-hidden">
                    <div className="p-4 border-b border-neutral-100/50 dark:border-neutral-800/50 bg-transparent relative z-10">
                      <h3 className="text-sm font-bold tracking-wide text-neutral-800 dark:text-neutral-200 uppercase">Analitik Kepegawaian</h3>
                    </div>
                    <CardContent className="p-4 relative z-10">
                      <AnalyticsCharts />
                    </CardContent>
                  </Card>

                </div>

                {/* RIGHT SIDE: APPROVAL */}
                <Card className="rounded-[24px] border border-white/40 dark:border-neutral-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl flex flex-col hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all duration-300 relative overflow-hidden xl:min-h-[500px]">
                  <div className="p-5 border-b border-neutral-100/50 dark:border-neutral-800/50 bg-transparent flex flex-col gap-1 relative z-10">
                    <h3 className="text-[13px] uppercase tracking-wider font-extrabold flex items-center gap-2 text-neutral-800 dark:text-neutral-200">
                      <ShieldCheck className="w-5 h-5 text-indigo-500" />
                      Approval Center
                    </h3>
                    <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Verifikasi pengajuan tindakan personel</p>
                  </div>
                  <CardContent className="flex-1 p-0 relative z-10">
                    <ScrollArea className="absolute inset-0 h-[400px] xl:h-[calc(100vh-270px)]">
                      <div className="p-2">
                        <ApprovalPanel />
                      </div>
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
  const gradients: Record<string, string> = {
    primary: "bg-gradient-to-br from-indigo-500 to-blue-600 shadow-blue-500/20",
    emerald: "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-500/20",
    amber: "bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/20",
    indigo: "bg-gradient-to-br from-violet-500 to-purple-600 shadow-purple-500/20",
    blue: "bg-gradient-to-br from-sky-400 to-blue-500 shadow-blue-500/20",
    rose: "bg-gradient-to-br from-rose-400 to-red-500 shadow-rose-500/20",
  }

  const badgeStyle = trend.includes('+') || trend.includes('Beres') || trend.includes('Tepat') || trend.includes('Stabil') 
    ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
    : trend.includes('Perlu') || trend.includes('Segera') || trend.includes('Perhatikan')
      ? 'bg-rose-50/80 text-rose-700 border-rose-200/50 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' 
      : 'bg-neutral-50/80 text-neutral-600 border-neutral-200/50 dark:bg-neutral-800/80 dark:text-neutral-400 dark:border-neutral-700/50'

  return (
    <Card className="rounded-[24px] border border-white/40 dark:border-neutral-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all duration-300 h-full min-h-[140px] flex flex-col relative overflow-hidden group">
      {/* Soft Glow decorative */}
      <div className={cn("absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none transition-opacity group-hover:opacity-40", gradients[color] || gradients.primary)} />
      
      <CardContent className="p-5 flex flex-col justify-between h-full flex-1 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={cn("p-2.5 rounded-[14px] shrink-0 shadow-lg transition-transform group-hover:-translate-y-1 duration-300", gradients[color] || gradients.primary)}>
            {icon}
          </div>
          <p className={cn("text-[9px] font-bold px-2.5 py-1 rounded-full border truncate max-w-[65%] backdrop-blur-md", badgeStyle)}>
            {trend}
          </p>
        </div>
        <div>
          <h3 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight leading-none mb-1.5 drop-shadow-sm">
            {value}
          </h3>
          <p className="text-[12px] font-semibold text-neutral-500 dark:text-neutral-400 truncate">
            {title}
          </p>
          <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1 truncate w-full hidden sm:block">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
