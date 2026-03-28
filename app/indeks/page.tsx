"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import {
  Trophy, Medal, TrendingUp, TrendingDown, Minus,
  Star, Users, AlertTriangle, BarChart3, Award,
  ChevronUp, ChevronDown, Loader2, RefreshCcw, Shield
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { getLeaderboard, getRankingUnit, getPegawaiPerluPerhatian, hitungIndeksSemuaPegawai, generateBadgesBulanan } from "@/lib/actions/indeks"
import { SidebarNav, SidebarProvider, useSidebar } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BADGE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  TOP_DISIPLIN:        { label: "Top Disiplin",       color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",         icon: "🎯" },
  KEHADIRAN_PENUH:     { label: "Kehadiran Penuh",     color: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300", icon: "✅" },
  ZERO_LATE:           { label: "Zero Late",           color: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300", icon: "⚡" },
  TOP_PERFORMER:       { label: "Top Performer",       color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",     icon: "🏆" },
  TERBAIK_UNIT:        { label: "Terbaik Unit",        color: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300", icon: "🥇" },
  PENINGKATAN_TERBAIK: { label: "Peningkatan Terbaik", color: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300",         icon: "📈" },
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="flex h-7 w-7 items-center justify-center text-lg">🥇</span>
  if (rank === 2) return <span className="flex h-7 w-7 items-center justify-center text-lg">🥈</span>
  if (rank === 3) return <span className="flex h-7 w-7 items-center justify-center text-lg">🥉</span>
  return <span className="flex h-7 w-7 items-center justify-center text-sm font-bold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 rounded-full">#{rank}</span>
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta > 0) return (
    <span className="flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
      <ChevronUp className="h-3 w-3" />+{delta}
    </span>
  )
  if (delta < 0) return (
    <span className="flex items-center gap-0.5 text-[11px] font-bold text-red-500">
      <ChevronDown className="h-3 w-3" />{delta}
    </span>
  )
  return <span className="text-[11px] text-neutral-400 flex items-center gap-0.5"><Minus className="h-3 w-3" />Stabil</span>
}

function ScorePill({ skor, predikat }: { skor: number, predikat: string }) {
  const color =
    skor >= 90 ? "bg-emerald-500"
    : skor >= 80 ? "bg-blue-500"
    : skor >= 70 ? "bg-amber-500"
    : skor >= 60 ? "bg-orange-500"
    : "bg-red-500"

  return (
    <div className="flex items-center gap-2">
      <div className={cn("text-white text-sm font-bold px-2.5 py-0.5 rounded-full min-w-[52px] text-center", color)}>
        {skor}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function IndeksContent() {
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role

  const now = new Date()
  const [bulan, setBulan] = useState(now.getMonth() + 1)
  const [tahun, setTahun] = useState(now.getFullYear())

  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [rankingUnit, setRankingUnit] = useState<any[]>([])
  const [perluPerhatian, setPerluPerhatian] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [recalcLoading, setRecalcLoading] = useState(false)

  const isAdmin = ["SUPERADMIN", "HRD", "DIREKSI"].includes(userRole)

  const bulanNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

  const loadAll = async () => {
    setLoading(true)
    try {
      const [lb, ru, pp] = await Promise.all([
        getLeaderboard(bulan, tahun),
        getRankingUnit(bulan, tahun),
        isAdmin ? getPegawaiPerluPerhatian() : []
      ])
      setLeaderboard(lb)
      setRankingUnit(ru)
      setPerluPerhatian(pp)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [bulan, tahun])

  const handleRecalc = async () => {
    if (!isAdmin) return
    setRecalcLoading(true)
    toast.info("Menghitung ulang semua indeks...")
    try {
      const r1 = await hitungIndeksSemuaPegawai(bulan, tahun)
      const r2 = await generateBadgesBulanan(bulan, tahun)
      if ((r1 as any).success) {
        toast.success(`Indeks dihitung: ${(r1 as any).processed} pegawai`)
      }
      if ((r2 as any).success) {
        toast.success(`Badge di-generate: ${(r2 as any).created} badge`)
      }
      await loadAll()
    } catch (e) {
      toast.error("Gagal menghitung ulang")
    } finally {
      setRecalcLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <SidebarNav />
      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300" style={{ marginLeft: "var(--sidebar-width, 16rem)" }}>
        <TopBar breadcrumb={["Dashboard", "Kinerja & Karier", "Indeks Pegawai"]} />

        <main className="flex-1 p-4 md:p-6 space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Indeks Pegawai
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Leaderboard & Ranking berdasarkan disiplin dan kehadiran</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={String(bulan)} onValueChange={v => setBulan(Number(v))}>
                <SelectTrigger className="w-[130px] text-sm h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {bulanNames.map((b, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(tahun)} onValueChange={v => setTahun(Number(v))}>
                <SelectTrigger className="w-[90px] text-sm h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
              {isAdmin && (
                <Button size="sm" variant="outline" className="gap-2 h-9 text-xs" onClick={handleRecalc} disabled={recalcLoading}>
                  {recalcLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCcw className="h-3 w-3" />}
                  Hitung Ulang
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-sm text-neutral-400">Memuat data indeks...</p>
              </div>
            </div>
          ) : leaderboard.length === 0 ? (
            <Card className="border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900">
              <CardContent className="flex flex-col items-center justify-center h-56 gap-3 text-neutral-400">
                <BarChart3 className="h-10 w-10 opacity-20" />
                <p className="text-sm">Belum ada data indeks untuk {bulanNames[bulan - 1]} {tahun}</p>
                {isAdmin && (
                  <Button size="sm" onClick={handleRecalc} disabled={recalcLoading}>
                    {recalcLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Hitung Sekarang
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="leaderboard">
              <TabsList className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl p-1 gap-1 h-auto">
                <TabsTrigger value="leaderboard" className="text-xs rounded-lg">🏆 Leaderboard</TabsTrigger>
                <TabsTrigger value="ranking-unit" className="text-xs rounded-lg">🏢 Ranking Unit</TabsTrigger>
                {isAdmin && <TabsTrigger value="perlu-perhatian" className="text-xs rounded-lg">⚠️ Perlu Perhatian</TabsTrigger>}
              </TabsList>

              {/* ── LEADERBOARD ─────────────────────────────────── */}
              <TabsContent value="leaderboard" className="mt-4">
                {/* Top 3 Podium */}
                {leaderboard.length >= 3 && (
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    {[leaderboard[1], leaderboard[0], leaderboard[2]].map((p, colIdx) => {
                      if (!p) return <div key={colIdx} />
                      const podiumH = colIdx === 1 ? "mt-0" : "mt-8"
                      return (
                        <Card key={p.pegawaiId} className={cn(
                          "border shadow-sm text-center overflow-hidden",
                          colIdx === 1
                            ? "border-amber-300 dark:border-amber-700 bg-gradient-to-b from-amber-50 to-white dark:from-amber-900/20 dark:to-neutral-900 shadow-amber-100 dark:shadow-none"
                            : "border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900",
                          podiumH
                        )}>
                          <CardContent className="p-4 flex flex-col items-center gap-2">
                            <RankBadge rank={p.rank} />
                            <Avatar className="h-12 w-12 ring-2 ring-white dark:ring-neutral-800 shadow">
                              <AvatarImage src={p.fotoUrl} />
                              <AvatarFallback className="text-sm font-bold bg-blue-100 text-blue-700">
                                {p.nama.split(' ').slice(0, 2).map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-xs font-bold text-neutral-800 dark:text-white leading-tight line-clamp-1">{p.nama}</p>
                              <p className="text-[10px] text-neutral-400 truncate">{p.unit}</p>
                            </div>
                            <div className={cn(
                              "text-xl font-black",
                              p.totalSkor >= 90 ? "text-emerald-600" : p.totalSkor >= 80 ? "text-blue-600" : "text-amber-600"
                            )}>{p.totalSkor}</div>
                            <div className="flex flex-wrap justify-center gap-1">
                              {(p.badges || []).slice(0, 2).map((b: string) => (
                                <span key={b} title={BADGE_CONFIG[b]?.label} className="text-base">{BADGE_CONFIG[b]?.icon}</span>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}

                {/* Full Leaderboard Table */}
                <Card className="border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900">
                  <CardHeader className="pb-2 pt-4 px-5 border-b border-neutral-100 dark:border-neutral-800">
                    <CardTitle className="text-sm font-semibold">Top {leaderboard.length} Pegawai — {bulanNames[bulan - 1]} {tahun}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {leaderboard.map((p, idx) => (
                      <div key={p.pegawaiId} className={cn(
                        "flex items-center gap-3 px-5 py-3 border-b border-neutral-50 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors",
                        idx < 3 ? "bg-amber-50/30 dark:bg-amber-900/10" : ""
                      )}>
                        <RankBadge rank={p.rank} />
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage src={p.fotoUrl} />
                          <AvatarFallback className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold">
                            {p.nama.split(' ').slice(0, 2).map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-neutral-800 dark:text-white truncate">{p.nama}</p>
                          <p className="text-[11px] text-neutral-400 truncate">{p.unit} · {p.jabatan}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {/* Badges */}
                          <div className="hidden sm:flex gap-1">
                            {(p.badges || []).map((b: string) => (
                              <span key={b} title={BADGE_CONFIG[b]?.label} className="text-sm cursor-default">{BADGE_CONFIG[b]?.icon}</span>
                            ))}
                          </div>
                          <DeltaBadge delta={p.delta} />
                          <ScorePill skor={p.totalSkor} predikat={p.predikat} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Badge Legend */}
                <Card className="border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 mt-4">
                  <CardContent className="p-4">
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Legenda Badge Bulan Ini</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(BADGE_CONFIG).map(([key, cfg]) => (
                        <div key={key} className={cn("flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full border font-medium", cfg.color)}>
                          <span>{cfg.icon}</span>
                          <span>{cfg.label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── RANKING UNIT ─────────────────────────────────── */}
              <TabsContent value="ranking-unit" className="mt-4 space-y-3">
                {rankingUnit.map(unit => (
                  <Card key={unit.id} className={cn(
                    "border shadow-sm bg-white dark:bg-neutral-900 overflow-hidden",
                    unit.rank === 1 ? "border-amber-300 dark:border-amber-700" : "border-neutral-100 dark:border-neutral-800"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <RankBadge rank={unit.rank} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-bold text-neutral-800 dark:text-white truncate">{unit.nama}</p>
                            <span className="text-[10px] text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full shrink-0">
                              {unit.jumlahPegawai} pegawai
                            </span>
                          </div>
                          <Progress
                            value={unit.avgSkor}
                            className="h-2 bg-neutral-100 dark:bg-neutral-800"
                          />
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[11px] text-neutral-400">Kehadiran {unit.persenHadir}%</span>
                            <span className={cn(
                              "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                              unit.avgSkor >= 90 ? "bg-emerald-100 text-emerald-700" :
                              unit.avgSkor >= 80 ? "bg-blue-100 text-blue-700" :
                              unit.avgSkor >= 70 ? "bg-amber-100 text-amber-700" :
                              "bg-red-100 text-red-700"
                            )}>{unit.predikatLabel}</span>
                          </div>
                        </div>
                        <div className={cn(
                          "text-2xl font-black shrink-0",
                          unit.avgSkor >= 90 ? "text-emerald-600" : unit.avgSkor >= 80 ? "text-blue-600" : unit.avgSkor >= 70 ? "text-amber-600" : "text-red-500"
                        )}>
                          {unit.avgSkor}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {rankingUnit.length === 0 && (
                  <Card className="border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900">
                    <CardContent className="flex items-center justify-center h-40 text-neutral-400 text-sm">
                      Belum ada data ranking unit
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ── PERLU PERHATIAN ────────────────────────────── */}
              {isAdmin && (
                <TabsContent value="perlu-perhatian" className="mt-4">
                  <Card className="border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900">
                    <CardHeader className="pb-2 pt-4 px-5 border-b border-neutral-100 dark:border-neutral-800">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Pegawai Perlu Perhatian
                      </CardTitle>
                      <CardDescription className="text-xs">Pegawai dengan skor rendah, alpha tinggi, atau SP aktif</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      {perluPerhatian.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-neutral-400 gap-2">
                          <Shield className="h-8 w-8 opacity-20" />
                          <p className="text-sm">Semua pegawai dalam kondisi baik 🎉</p>
                        </div>
                      ) : perluPerhatian.map((p: any) => (
                        <div key={p.pegawaiId} className="flex items-center gap-3 px-5 py-3 border-b border-neutral-50 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarImage src={p.fotoUrl} />
                            <AvatarFallback className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold">
                              {p.nama.split(' ').slice(0, 2).map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-neutral-800 dark:text-white truncate">{p.nama}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(p.flags || []).map((flag: string, i: number) => (
                                <span key={i} className="text-[10px] bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full border border-red-100 dark:border-red-800">{flag}</span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className={cn("text-lg font-black", p.totalSkor < 60 ? "text-red-600" : "text-orange-500")}>{p.totalSkor}</div>
                            <div className="text-[10px] text-neutral-400">{p.unit}</div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          )}
        </main>
      </div>
    </div>
  )
}

export default function IndeksPage() {
  return (
    <SidebarProvider>
      <IndeksContent />
    </SidebarProvider>
  )
}
