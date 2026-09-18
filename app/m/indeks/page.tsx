"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import { Trophy, Medal, Award, Loader2, ArrowLeft, RefreshCcw, Building2, ChevronDown, ChevronUp, Minus, Target, CheckCircle2, Zap, ArrowUpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getLeaderboard, getRankingUnit, getPegawaiPerluPerhatian, hitungIndeksSemuaPegawai, generateBadgesBulanan } from "@/lib/actions/indeks"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const BADGE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  TOP_DISIPLIN:        { label: "Top Disiplin",       color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",     icon: <Target className="h-3 w-3" /> },
  KEHADIRAN_PENUH:     { label: "Kehadiran Penuh",     color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20", icon: <CheckCircle2 className="h-3 w-3" /> },
  ZERO_LATE:           { label: "Zero Late",           color: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20", icon: <Zap className="h-3 w-3" /> },
  TOP_PERFORMER:       { label: "Top Performer",       color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",   icon: <Trophy className="h-3 w-3" /> },
  TERBAIK_UNIT:        { label: "Terbaik Unit",        color: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20", icon: <Building2 className="h-3 w-3" /> },
  PENINGKATAN_TERBAIK: { label: "Peningkatan Terbaik", color: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20",       icon: <ArrowUpCircle className="h-3 w-3" /> },
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <div className="flex shrink-0 h-6 w-6 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20"><Trophy className="h-3 w-3" /></div>
  if (rank === 2) return <div className="flex shrink-0 h-6 w-6 items-center justify-center rounded-full bg-zinc-400/10 text-zinc-400 border border-zinc-400/20"><Medal className="h-3 w-3" /></div>
  if (rank === 3) return <div className="flex shrink-0 h-6 w-6 items-center justify-center rounded-full bg-amber-700/10 text-amber-700 border border-amber-700/20"><Award className="h-3 w-3" /></div>
  return <div className="flex shrink-0 h-6 w-6 items-center justify-center text-[10px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded-full">#{rank}</div>
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta > 0) return <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400"><ChevronUp className="h-3 w-3" />+{delta}</span>
  if (delta < 0) return <span className="flex items-center gap-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400"><ChevronDown className="h-3 w-3" />{delta}</span>
  return <span className="flex items-center gap-0.5 text-[10px] text-zinc-400"><Minus className="h-3 w-3" />0</span>
}

export default function MobileIndeks() {
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role
  const isAdmin = ["SUPERADMIN", "HRD", "DIREKSI"].includes(userRole)

  const [bulan, setBulan] = useState(new Date().getMonth() + 1)
  const [tahun, setTahun] = useState(new Date().getFullYear())
  const [activeTab, setActiveTab] = useState("leaderboard")

  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [rankingUnit, setRankingUnit] = useState<any[]>([])
  const [perhatian, setPerhatian] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [recalcLoading, setRecalcLoading] = useState(false)
  const [availableMonths, setAvailableMonths] = useState<number[]>([])

  useEffect(() => {
    const now = new Date()
    const m = now.getMonth() + 1
    setAvailableMonths([m, m === 1 ? 12 : m - 1])
  }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [lb, ru, pp] = await Promise.all([
        getLeaderboard(bulan, tahun),
        getRankingUnit(bulan, tahun),
        isAdmin ? getPegawaiPerluPerhatian() : []
      ])
      setLeaderboard(lb || [])
      setRankingUnit(ru || [])
      setPerhatian(pp || [])
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [bulan, tahun])

  const handleRecalc = async () => {
    if (!isAdmin) return
    setRecalcLoading(true)
    toast.info("Menghitung ulang indeks...")
    try {
      await hitungIndeksSemuaPegawai(bulan, tahun)
      await generateBadgesBulanan(bulan, tahun)
      toast.success("Indeks berhasil dihitung ulang")
      await loadAll()
    } catch {
      toast.error("Gagal menghitung")
    } finally {
      setRecalcLoading(false)
    }
  }

  const bulanNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] font-sans pb-24 flex flex-col">
      {/* Header */}
      <div 
        className="sticky top-0 z-20 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800 px-4 py-3 shadow-2xs"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link 
              href="/m/dashboard"
              className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Indeks Kinerja</h1>
          </div>
          {isAdmin && (
            <button
              onClick={handleRecalc}
              disabled={recalcLoading}
              className="p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 active:scale-90 transition-transform"
              title="Hitung Ulang Indeks"
            >
              <RefreshCcw className={cn("h-4 w-4", recalcLoading && "animate-spin text-zinc-900 dark:text-white")} />
            </button>
          )}
        </div>

        {/* Filter Bulan & Tahun */}
        <div className="flex gap-2 mt-3">
          <Select value={String(bulan)} onValueChange={v => setBulan(Number(v))}>
            <SelectTrigger className="flex-1 bg-zinc-100 dark:bg-zinc-800/80 border-zinc-200/80 dark:border-zinc-700 h-9 text-xs rounded-xl focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map((m) => <SelectItem key={m} value={String(m)} className="text-xs">{bulanNames[m - 1]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={String(tahun)} onValueChange={v => setTahun(Number(v))}>
            <SelectTrigger className="w-24 bg-zinc-100 dark:bg-zinc-800/80 border-zinc-200/80 dark:border-zinc-700 h-9 text-xs rounded-xl focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={String(y)} className="text-xs">{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Segmented Tabs */}
      <div className="px-4 mt-3 max-w-md mx-auto w-full">
        <div className="flex items-center bg-zinc-200/60 dark:bg-zinc-800/60 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={cn(
              "flex-1 text-xs font-semibold py-1.5 rounded-lg transition-all text-center",
              activeTab === "leaderboard" 
                ? "bg-white dark:bg-zinc-900 shadow-2xs text-zinc-900 dark:text-white" 
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
            )}
          >
            Leaderboard
          </button>
          <button
            onClick={() => setActiveTab("ranking-unit")}
            className={cn(
              "flex-1 text-xs font-semibold py-1.5 rounded-lg transition-all text-center",
              activeTab === "ranking-unit" 
                ? "bg-white dark:bg-zinc-900 shadow-2xs text-zinc-900 dark:text-white" 
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
            )}
          >
            Ranking Unit
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab("perhatian")}
              className={cn(
                "flex-1 text-xs font-semibold py-1.5 rounded-lg transition-all text-center",
                activeTab === "perhatian" 
                  ? "bg-white dark:bg-zinc-900 shadow-2xs text-zinc-900 dark:text-white" 
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
              )}
            >
              Perhatian
            </button>
          )}
        </div>
      </div>

      {/* Content List */}
      <div className="flex-1 px-4 mt-3.5 space-y-2.5 max-w-md mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-zinc-400 h-7 w-7" />
          </div>
        ) : (
          <>
            {/* LEADERBOARD TAB */}
            {activeTab === "leaderboard" && (
              <>
                {leaderboard.length === 0 ? (
                  <div className="text-center p-8 text-zinc-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 text-xs font-medium">
                    Belum ada data peringkat untuk periode ini
                  </div>
                ) : (
                  leaderboard.map((p, idx) => (
                    <div 
                      key={p.pegawaiId} 
                      className={cn(
                        "bg-white dark:bg-zinc-900 rounded-2xl p-3.5 flex items-center gap-3 border transition-colors shadow-2xs",
                        idx < 3 
                          ? "border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30" 
                          : "border-zinc-200/80 dark:border-zinc-800"
                      )}
                    >
                      <RankBadge rank={p.rank} />
                      <Avatar className="h-9 w-9 shrink-0 border border-zinc-200/70 dark:border-zinc-700">
                        <AvatarImage src={p.fotoUrl} />
                        <AvatarFallback className="text-xs bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 font-bold">
                          {p.nama?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{p.nama}</p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{p.unit || "-"}</p>
                        {p.badges?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {p.badges.slice(0, 2).map((b: string) => (
                              <span key={b} className={cn("flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md font-semibold border", BADGE_CONFIG[b]?.color)}>
                                {BADGE_CONFIG[b]?.icon} {BADGE_CONFIG[b]?.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-none tabular-nums">
                          {p.totalSkor}
                        </span>
                        <div className="mt-1">
                          <DeltaBadge delta={p.delta} />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* RANKING UNIT TAB */}
            {activeTab === "ranking-unit" && (
              <>
                {rankingUnit.length === 0 ? (
                  <div className="text-center p-8 text-zinc-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 text-xs font-medium">
                    Belum ada data ranking unit
                  </div>
                ) : (
                  rankingUnit.map((u) => (
                    <div key={u.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-2xs border border-zinc-200/80 dark:border-zinc-800">
                      <div className="flex items-center gap-3 mb-2">
                        <RankBadge rank={u.rank} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{u.nama}</p>
                        </div>
                        <div className="text-base font-bold text-zinc-900 dark:text-zinc-100 shrink-0 tabular-nums">
                          {u.avgSkor}
                        </div>
                      </div>
                      <Progress value={u.avgSkor} className="h-1.5 bg-zinc-100 dark:bg-zinc-800 mb-2" />
                      <div className="flex items-center justify-between text-[10px] text-zinc-500">
                        <span>{u.jumlahPegawai} Pegawai</span>
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">{u.predikatLabel}</span>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* PERHATIAN TAB */}
            {activeTab === "perhatian" && isAdmin && (
              <>
                {perhatian.length === 0 ? (
                  <div className="text-center p-8 text-zinc-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 text-xs flex flex-col items-center">
                    <CheckCircle2 className="h-7 w-7 text-emerald-500 opacity-60 mb-2" />
                    Semua pegawai dalam performa disiplin yang baik
                  </div>
                ) : (
                  perhatian.map(p => (
                    <div key={p.pegawaiId} className="bg-white dark:bg-zinc-900 rounded-2xl p-3.5 flex items-center gap-3 border border-rose-200/80 dark:border-rose-950/60 shadow-2xs">
                      <Avatar className="h-9 w-9 shrink-0 border border-rose-200 dark:border-rose-900">
                        <AvatarImage src={p.fotoUrl} />
                        <AvatarFallback className="text-xs bg-rose-500/10 text-rose-600 font-bold">
                          {p.nama?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{p.nama}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(p.flags || []).map((f: string, i: number) => (
                            <span key={i} className="text-[9px] px-1.5 py-0.5 bg-rose-500/10 text-rose-700 dark:text-rose-400 rounded-md font-semibold border border-rose-500/20">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums">{p.totalSkor}</div>
                    </div>
                  ))
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
