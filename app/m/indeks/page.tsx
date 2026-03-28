"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Trophy, Medal, Award, Loader2, ArrowLeft, RefreshCcw, Building2, AlertTriangle, ChevronDown, ChevronUp, Minus, Target, CheckCircle2, Zap, ArrowUpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getLeaderboard, getRankingUnit, getPegawaiPerluPerhatian, hitungIndeksSemuaPegawai, generateBadgesBulanan } from "@/lib/actions/indeks"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const BADGE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; desc: string }> = {
  TOP_DISIPLIN:        { label: "Top Disiplin",       color: "bg-blue-100 text-blue-700",           icon: <Target className="h-3 w-3" />,        desc: "Disiplin kehadiran tertinggi di unit" },
  KEHADIRAN_PENUH:     { label: "Kehadiran Penuh",     color: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="h-3 w-3" />,   desc: "Hadir di semua hari kerja bulan ini" },
  ZERO_LATE:           { label: "Zero Late",           color: "bg-violet-100 text-violet-700",     icon: <Zap className="h-3 w-3" />,           desc: "Tidak ada keterlambatan sama sekali" },
  TOP_PERFORMER:       { label: "Top Performer",       color: "bg-amber-100 text-amber-700",         icon: <Trophy className="h-3 w-3" />,        desc: "Skor indeks tertinggi bulan ini" },
  TERBAIK_UNIT:        { label: "Terbaik Unit",        color: "bg-orange-100 text-orange-700",     icon: <Building2 className="h-3 w-3" />,     desc: "Pegawai terbaik dalam unitnya" },
  PENINGKATAN_TERBAIK: { label: "Peningkatan Terbaik", color: "bg-teal-100 text-teal-700",             icon: <ArrowUpCircle className="h-3 w-3" />, desc: "Kenaikan skor terbesar dari bulan lalu" },
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <div className="flex shrink-0 h-6 w-6 items-center justify-center rounded-full bg-amber-100"><Trophy className="h-3.5 w-3.5 text-amber-600" /></div>
  if (rank === 2) return <div className="flex shrink-0 h-6 w-6 items-center justify-center rounded-full bg-slate-200"><Medal className="h-3.5 w-3.5 text-slate-500" /></div>
  if (rank === 3) return <div className="flex shrink-0 h-6 w-6 items-center justify-center rounded-full bg-orange-100"><Award className="h-3.5 w-3.5 text-orange-500" /></div>
  return <div className="flex shrink-0 h-6 w-6 items-center justify-center text-[10px] font-bold text-neutral-500 bg-neutral-200 rounded-full">#{rank}</div>
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta > 0) return <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600"><ChevronUp className="h-3 w-3" />+{delta}</span>
  if (delta < 0) return <span className="flex items-center gap-0.5 text-[10px] font-bold text-rose-500"><ChevronDown className="h-3 w-3" />{delta}</span>
  return <span className="flex items-center gap-0.5 text-[10px] text-neutral-400"><Minus className="h-3 w-3" />Stabil</span>
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
      setPerhatian(pp)
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [bulan, tahun])

  const handleRecalc = async () => {
    if (!isAdmin) return
    setRecalcLoading(true)
    toast.info("Menghitung ulang...")
    try {
      await hitungIndeksSemuaPegawai(bulan, tahun)
      await generateBadgesBulanan(bulan, tahun)
      toast.success("Indeks berhasil dihitung")
      await loadAll()
    } catch {
      toast.error("Gagal menghitung")
    } finally {
      setRecalcLoading(false)
    }
  }

  const bulanNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

  return (
    <div className="min-h-screen bg-[#f4f7f6] dark:bg-black font-sans pb-24 flex flex-col">
      {/* Header */}
      <div className="bg-[#18553f] pt-12 pb-6 px-5 rounded-b-3xl shadow-sm text-white sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/m/dashboard" className="p-2 rounded-xl bg-white/10 text-white active:scale-95 transition-transform">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold tracking-wide flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              Indeks Pegawai
            </h1>
          </div>
          {isAdmin && (
            <button
              onClick={handleRecalc}
              disabled={recalcLoading}
              className="p-2 rounded-xl bg-white/10 active:scale-95"
            >
              <RefreshCcw className={cn("h-5 w-5", recalcLoading && "animate-spin")} />
            </button>
          )}
        </div>

        {/* Filter Bulan & Tahun */}
        <div className="flex gap-2 mt-4">
          <Select value={String(bulan)} onValueChange={v => setBulan(Number(v))}>
            <SelectTrigger className="flex-1 bg-white/10 border-0 h-10 text-white rounded-xl focus:ring-0"><SelectValue /></SelectTrigger>
            <SelectContent>
              {bulanNames.map((b, i) => <SelectItem key={i + 1} value={String(i + 1)}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={String(tahun)} onValueChange={v => setTahun(Number(v))}>
            <SelectTrigger className="w-24 bg-white/10 border-0 h-10 text-white rounded-xl focus:ring-0"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mt-4">
        <div className="flex items-center bg-neutral-200/50 dark:bg-neutral-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={cn("flex-1 text-xs font-bold py-2 rounded-lg transition-colors text-center", activeTab === "leaderboard" ? "bg-white dark:bg-neutral-700 shadow-sm text-neutral-800 dark:text-white" : "text-neutral-500")}
          >
            Leaderboard
          </button>
          <button
            onClick={() => setActiveTab("ranking-unit")}
            className={cn("flex-1 text-xs font-bold py-2 rounded-lg transition-colors text-center", activeTab === "ranking-unit" ? "bg-white dark:bg-neutral-700 shadow-sm text-neutral-800 dark:text-white" : "text-neutral-500")}
          >
            Ranking Unit
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab("perhatian")}
              className={cn("flex-1 text-xs font-bold py-2 rounded-lg transition-colors text-center", activeTab === "perhatian" ? "bg-white dark:bg-neutral-700 shadow-sm text-neutral-800 dark:text-white" : "text-neutral-500")}
            >
              Perhatian
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 mt-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center p-12"><Loader2 className="animate-spin text-[#18553f] h-8 w-8" /></div>
        ) : (
          <>
            {/* LEADERBOARD TAB */}
            {activeTab === "leaderboard" && (
              <>
                {leaderboard.length === 0 ? (
                  <div className="text-center p-8 text-neutral-400 bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-neutral-100 dark:border-neutral-800 text-sm">Belum ada data</div>
                ) : (
                  leaderboard.map((p, idx) => (
                    <div key={p.pegawaiId} className={cn(
                      "bg-white dark:bg-neutral-900 rounded-2xl p-3 flex items-center gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border transition-all",
                      idx < 3 ? "border-amber-100 dark:border-amber-900 bg-gradient-to-r from-amber-50/50 to-white dark:from-amber-900/10 dark:to-neutral-900" : "border-neutral-100 dark:border-neutral-800"
                    )}>
                      <RankBadge rank={p.rank} />
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={p.fotoUrl} />
                        <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700 font-bold">{p.nama.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 truncate">{p.nama}</p>
                        <p className="text-[10px] text-neutral-400 truncate">{p.unit}</p>
                        {p.badges?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {p.badges.slice(0, 3).map((b: string) => (
                              <span key={b} className={cn("flex items-center gap-0.5 text-[8px] px-1.5 py-0.5 rounded-full font-bold", BADGE_CONFIG[b]?.color)}>
                                {BADGE_CONFIG[b]?.icon} {BADGE_CONFIG[b]?.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className={cn(
                          "text-lg font-black leading-none",
                          p.totalSkor >= 90 ? "text-emerald-500" : p.totalSkor >= 80 ? "text-blue-500" : "text-amber-500"
                        )}>{p.totalSkor}</span>
                        <DeltaBadge delta={p.delta} />
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
                  <div className="text-center p-8 text-neutral-400 bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-neutral-100 text-sm">Belum ada data</div>
                ) : (
                  rankingUnit.map((u, i) => (
                    <div key={u.id} className="bg-white dark:bg-neutral-900 rounded-2xl p-4 shadow-sm border border-neutral-100 dark:border-neutral-800">
                      <div className="flex items-center gap-3 mb-2">
                        <RankBadge rank={u.rank} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 truncate">{u.nama}</p>
                        </div>
                        <div className={cn("text-xl font-black shrink-0", u.avgSkor >= 90 ? "text-emerald-500" : "text-amber-500")}>
                          {u.avgSkor}
                        </div>
                      </div>
                      <Progress value={u.avgSkor} className="h-1.5 bg-neutral-100 dark:bg-neutral-800 mb-1.5" />
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-neutral-400">{u.jumlahPegawai} pegawai</span>
                        <span className={cn("text-[8px] font-bold px-2 py-0.5 rounded-full", u.avgSkor >= 90 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>{u.predikatLabel}</span>
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
                  <div className="text-center p-8 text-neutral-400 bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-neutral-100 text-sm flex flex-col items-center">
                    <CheckCircle2 className="h-8 w-8 text-emerald-400 opacity-60 mb-2" />
                    Semua pegawai dalam kondisi baik
                  </div>
                ) : (
                  perhatian.map(p => (
                    <div key={p.pegawaiId} className="bg-white dark:bg-neutral-900 rounded-2xl p-3 flex items-center gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-rose-100 dark:border-rose-900/30">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={p.fotoUrl} />
                        <AvatarFallback className="text-xs bg-rose-100 text-rose-700 font-bold">{p.nama.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 truncate">{p.nama}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(p.flags || []).map((f: string, i: number) => (
                            <span key={i} className="text-[8px] px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded-full font-bold">{f}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-xl font-black text-rose-500">{p.totalSkor}</div>
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
