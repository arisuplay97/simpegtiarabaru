"use client"

import { useState, useEffect, useTransition } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Smile, Frown, Meh, AlertCircle, HeartHandshake, ShieldCheck,
  Calendar, Building2, Filter, RefreshCw, TrendingUp, Users,
  CheckCircle2, Clock, Sparkles
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getEmployeeExperienceStats, MoodFilterOptions } from "@/lib/actions/mood"
import { cn } from "@/lib/utils"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"

const MOOD_METADATA: Record<string, { label: string; emoji: string; color: string; bg: string; border: string }> = {
  HAPPY: {
    label: "Senang",
    emoji: "😊",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800"
  },
  NEUTRAL: {
    label: "Biasa Saja",
    emoji: "😐",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800"
  },
  TIRED: {
    label: "Capek",
    emoji: "😫",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800"
  },
  SAD: {
    label: "Sedih",
    emoji: "😔",
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-500/10 dark:bg-indigo-950/40",
    border: "border-indigo-200 dark:border-indigo-800"
  },
  ANGRY: {
    label: "Kesal",
    emoji: "😡",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10 dark:bg-rose-950/40",
    border: "border-rose-200 dark:border-rose-800"
  }
}

export default function EmployeeExperiencePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Filters state
  const [period, setPeriod] = useState<"today" | "7d" | "30d" | "custom">("today")
  const [bidangId, setBidangId] = useState<string>("ALL")
  const [tipeLokasi, setTipeLokasi] = useState<"ALL" | "PUSAT" | "CABANG">("ALL")
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadData = (filters?: MoodFilterOptions) => {
    setLoading(true)
    startTransition(async () => {
      const activeFilters: MoodFilterOptions = filters || {
        period,
        bidangId: bidangId === "ALL" ? undefined : bidangId,
        tipeLokasi,
      }
      const res = await getEmployeeExperienceStats(activeFilters)
      if (res.success) {
        setStats(res.data)
      }
      setLoading(false)
    })
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      loadData()
    }
  }, [status])

  const handlePeriodChange = (newPeriod: "today" | "7d" | "30d") => {
    setPeriod(newPeriod)
    loadData({
      period: newPeriod,
      bidangId: bidangId === "ALL" ? undefined : bidangId,
      tipeLokasi,
    })
  }

  const handleBidangChange = (newBidang: string) => {
    setBidangId(newBidang)
    loadData({
      period,
      bidangId: newBidang === "ALL" ? undefined : newBidang,
      tipeLokasi,
    })
  }

  const handleLokasiChange = (newLokasi: "ALL" | "PUSAT" | "CABANG") => {
    setTipeLokasi(newLokasi)
    loadData({
      period,
      bidangId: bidangId === "ALL" ? undefined : bidangId,
      tipeLokasi: newLokasi,
    })
  }

  const dominantMeta = stats?.dominantMood ? MOOD_METADATA[stats.dominantMood] : null

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-[#0B0C0E]">
      <SidebarNav />

      <div className="flex flex-1 flex-col sidebar-offset min-w-0">
        <TopBar breadcrumb={["Kehadiran", "Employee Experience"]} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1720px] mx-auto w-full">
          {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <Smile className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Employee Experience & Suasana Kerja
              </h1>
              <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                Pantau kondisi psikologis & dinamika perasaan tim secara agregat dan aman
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => loadData()}
          disabled={loading || isPending}
          className="gap-2 self-start md:self-auto rounded-xl border-zinc-200 dark:border-zinc-800"
        >
          <RefreshCw className={cn("h-4 w-4", (loading || isPending) && "animate-spin")} />
          Segarkan Data
        </Button>
      </div>

      {/* Privasi & Etika Banner (Section 12) */}
      <div className="rounded-2xl border border-blue-200/80 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-950/20 p-4 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-0.5 text-blue-900 dark:text-blue-200">
          <p className="font-semibold">Prinsip Privasi & Kerahasiaan Respon Pegawai</p>
          <p className="text-blue-700/80 dark:text-blue-300/80 leading-relaxed">
            Data perasaan merupakan informasi personal. Seluruh data di halaman ini disajikan dalam bentuk agregat statistik.
            Tidak ada penamaan individu, tidak ada ranking pegawai, dan hasil mood tidak diperbolehkan menjadi tolok ukur sanksi maupun penilaian kinerja.
          </p>
        </div>
      </div>

      {/* Filter Controls (Section 9) */}
      <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800 shadow-xs">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mr-1">
              <Filter className="h-3.5 w-3.5" /> Filter:
            </span>

            {/* Tombol Periode */}
            <div className="inline-flex rounded-xl p-1 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 text-xs">
              <button
                onClick={() => handlePeriodChange("today")}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-medium transition-all",
                  period === "today"
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                )}
              >
                Hari Ini
              </button>
              <button
                onClick={() => handlePeriodChange("7d")}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-medium transition-all",
                  period === "7d"
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                )}
              >
                7 Hari Terakhir
              </button>
              <button
                onClick={() => handlePeriodChange("30d")}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-medium transition-all",
                  period === "30d"
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                )}
              >
                30 Hari Terakhir
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Unit Kerja */}
            <Select value={bidangId} onValueChange={handleBidangChange}>
              <SelectTrigger className="w-[180px] h-9 text-xs rounded-xl border-zinc-200 dark:border-zinc-800">
                <Building2 className="h-3.5 w-3.5 mr-1 text-zinc-400" />
                <SelectValue placeholder="Semua Unit Kerja" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Unit Kerja</SelectItem>
                {stats?.bidangList?.map((b: any) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filter Pusat vs Cabang */}
            <Select value={tipeLokasi} onValueChange={(v) => handleLokasiChange(v as any)}>
              <SelectTrigger className="w-[150px] h-9 text-xs rounded-xl border-zinc-200 dark:border-zinc-800">
                <SelectValue placeholder="Semua Lokasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Lokasi</SelectItem>
                <SelectItem value="PUSAT">Kantor Pusat</SelectItem>
                <SelectItem value="CABANG">Kantor Cabang</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary KPI Cards (Section 11) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Respons */}
        <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Respons</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-2 tracking-tight">
              {stats?.totalResponses ?? 0}
            </p>
            <p className="text-[11px] text-zinc-400 mt-1">
              Dari {stats?.checkedOutCount ?? 0} pegawai checkout
            </p>
          </CardContent>
        </Card>

        {/* Tingkat Respons */}
        <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Tingkat Respons</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-2 tracking-tight">
              {stats?.responseRate ?? 0}%
            </p>
            <p className="text-[11px] text-zinc-400 mt-1">
              Partisipasi pengisian sukarela
            </p>
          </CardContent>
        </Card>

        {/* Mood Terbanyak / Dominan */}
        <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Mood Terbanyak</span>
              <span className="text-2xl">{dominantMeta?.emoji || "😊"}</span>
            </div>
            <p className="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-2 tracking-tight">
              {dominantMeta?.label || "Senang"}
            </p>
            <p className="text-[11px] text-zinc-400 mt-1">
              {stats?.percentages?.[stats?.dominantMood] ?? 0}% dari seluruh respon
            </p>
          </CardContent>
        </Card>

        {/* Presensi Masuk Tepat Waktu */}
        <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Ketepatan Presensi</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-2 tracking-tight">
              {stats?.tepatWaktuCount ?? 0}
            </p>
            <p className="text-[11px] text-zinc-400 mt-1">
              {stats?.terlambatCount ?? 0} pegawai tercatat terlambat
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribusi Mood (Section 8) */}
      <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800 shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Distribusi Perasaan Pegawai
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Proporsi 5 kategori perasaan pada periode terpilih
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1 rounded-lg">
              {stats?.totalResponses ?? 0} Respon Tercatat
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Horizontal Stacked Bar Visual */}
          {stats?.totalResponses > 0 ? (
            <div className="w-full">
              <div className="h-6 w-full rounded-xl overflow-hidden flex bg-zinc-100 dark:bg-zinc-800 shadow-inner">
                {stats?.percentages?.HAPPY > 0 && (
                  <div
                    style={{ width: `${stats.percentages.HAPPY}%` }}
                    className="bg-emerald-500 hover:opacity-90 transition-all flex items-center justify-center text-[10px] font-bold text-white"
                    title={`Senang: ${stats.percentages.HAPPY}%`}
                  >
                    {stats.percentages.HAPPY >= 8 && `${stats.percentages.HAPPY}%`}
                  </div>
                )}
                {stats?.percentages?.NEUTRAL > 0 && (
                  <div
                    style={{ width: `${stats.percentages.NEUTRAL}%` }}
                    className="bg-blue-500 hover:opacity-90 transition-all flex items-center justify-center text-[10px] font-bold text-white"
                    title={`Biasa saja: ${stats.percentages.NEUTRAL}%`}
                  >
                    {stats.percentages.NEUTRAL >= 8 && `${stats.percentages.NEUTRAL}%`}
                  </div>
                )}
                {stats?.percentages?.TIRED > 0 && (
                  <div
                    style={{ width: `${stats.percentages.TIRED}%` }}
                    className="bg-amber-500 hover:opacity-90 transition-all flex items-center justify-center text-[10px] font-bold text-white"
                    title={`Capek: ${stats.percentages.TIRED}%`}
                  >
                    {stats.percentages.TIRED >= 8 && `${stats.percentages.TIRED}%`}
                  </div>
                )}
                {stats?.percentages?.SAD > 0 && (
                  <div
                    style={{ width: `${stats.percentages.SAD}%` }}
                    className="bg-indigo-500 hover:opacity-90 transition-all flex items-center justify-center text-[10px] font-bold text-white"
                    title={`Sedih: ${stats.percentages.SAD}%`}
                  >
                    {stats.percentages.SAD >= 8 && `${stats.percentages.SAD}%`}
                  </div>
                )}
                {stats?.percentages?.ANGRY > 0 && (
                  <div
                    style={{ width: `${stats.percentages.ANGRY}%` }}
                    className="bg-rose-500 hover:opacity-90 transition-all flex items-center justify-center text-[10px] font-bold text-white"
                    title={`Kesal: ${stats.percentages.ANGRY}%`}
                  >
                    {stats.percentages.ANGRY >= 8 && `${stats.percentages.ANGRY}%`}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-zinc-400">
              Belum ada respon perasaan yang masuk pada periode ini.
            </div>
          )}

          {/* 5 Mood Breakdown Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {Object.entries(MOOD_METADATA).map(([key, meta]) => {
              const count = stats?.counts?.[key] ?? 0
              const pct = stats?.percentages?.[key] ?? 0
              return (
                <div
                  key={key}
                  className={cn(
                    "p-3.5 rounded-2xl border flex flex-col justify-between transition-all",
                    meta.bg,
                    meta.border
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{meta.emoji}</span>
                    <span className={cn("text-xs font-bold", meta.color)}>{pct}%</span>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{meta.label}</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{count} respons</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Trend 7 Hari & Analisis Korelasi (Section 10 & 11) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Suasana Kerja Harian */}
        <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
            <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Tren Suasana Kerja Harian
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Perubahan dinamika respon mood dari hari ke hari
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {stats?.trend && stats.trend.length > 0 ? (
              stats.trend.slice(-7).map((item: any) => {
                const total = item.total || 0
                return (
                  <div key={item.date} className="flex items-center gap-3 text-xs py-1">
                    <span className="w-16 font-semibold text-zinc-600 dark:text-zinc-300 shrink-0 tabular-nums">
                      {item.date.slice(5)}
                    </span>
                    <div className="flex-1 h-5 rounded-lg overflow-hidden flex bg-zinc-100 dark:bg-zinc-800">
                      {total > 0 ? (
                        <>
                          {item.HAPPY > 0 && (
                            <div
                              style={{ width: `${(item.HAPPY / total) * 100}%` }}
                              className="bg-emerald-500 h-full"
                              title={`Senang: ${item.HAPPY}`}
                            />
                          )}
                          {item.NEUTRAL > 0 && (
                            <div
                              style={{ width: `${(item.NEUTRAL / total) * 100}%` }}
                              className="bg-blue-500 h-full"
                              title={`Biasa: ${item.NEUTRAL}`}
                            />
                          )}
                          {item.TIRED > 0 && (
                            <div
                              style={{ width: `${(item.TIRED / total) * 100}%` }}
                              className="bg-amber-500 h-full"
                              title={`Capek: ${item.TIRED}`}
                            />
                          )}
                          {item.SAD > 0 && (
                            <div
                              style={{ width: `${(item.SAD / total) * 100}%` }}
                              className="bg-indigo-500 h-full"
                              title={`Sedih: ${item.SAD}`}
                            />
                          )}
                          {item.ANGRY > 0 && (
                            <div
                              style={{ width: `${(item.ANGRY / total) * 100}%` }}
                              className="bg-rose-500 h-full"
                              title={`Kesal: ${item.ANGRY}`}
                            />
                          )}
                        </>
                      ) : (
                        <div className="w-full text-[10px] text-zinc-400 flex items-center px-2">
                          Tidak ada data
                        </div>
                      )}
                    </div>
                    <span className="w-12 text-right font-medium text-zinc-400 text-[11px]">
                      {total} resp
                    </span>
                  </div>
                )
              })
            ) : (
              <p className="text-xs text-zinc-400 py-6 text-center">Belum ada data riwayat tren</p>
            )}

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <span>
                Catatan: Data tren bertujuan memberikan gambaran iklim kerja secara umum tanpa menarik asumsi otomatis.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Korelasi Agregat: Tepat Waktu vs Terlambat */}
        <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
            <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Korelasi Agregat: Ketepatan & Perasaan
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Komparasi agregat suasana kerja berdasarkan status presensi pagi
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-5">
            {/* Kelompok Tepat Waktu */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Pegawai Tepat Waktu ({stats?.tepatWaktuCount ?? 0})
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
                {Object.entries(MOOD_METADATA).map(([key, meta]) => {
                  const val = stats?.korelasi?.tepatWaktu?.[key] || 0
                  return (
                    <div key={key} className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/50">
                      <span className="text-lg">{meta.emoji}</span>
                      <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{val}</p>
                      <p className="text-[10px] text-zinc-400">{meta.label}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Kelompok Terlambat */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Pegawai Terlambat ({stats?.terlambatCount ?? 0})
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
                {Object.entries(MOOD_METADATA).map(([key, meta]) => {
                  const val = stats?.korelasi?.terlambat?.[key] || 0
                  return (
                    <div key={key} className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/50">
                      <span className="text-lg">{meta.emoji}</span>
                      <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{val}</p>
                      <p className="text-[10px] text-zinc-400">{meta.label}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 italic">
              *Hanya menampilkan proporsi statistik agregat, tidak mengasumsikan hubungan kausalitas langsung.
            </p>
          </CardContent>
        </Card>
      </div>
        </main>
      </div>
    </div>
  )
}
