"use client"

import { useState, useEffect, use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft, Star, CheckCircle2, Clock, Calendar,
  User, TrendingUp, FileText, Loader2, Building2,
  AlertTriangle, BarChart3, Eye, ClipboardList,
  MessageSquare, Lightbulb, ChevronRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { SidebarNav, SidebarProvider } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { toast } from "sonner"
import { getPenilaianDetail, getRiwayatPenilaian } from "@/lib/actions/penilaian"

const BULAN_NAMES = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des']
const BULAN_FULL = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

const KOMPONEN_LABEL: Record<string, string> = {
  disiplinKerja: "Disiplin Kerja",
  tanggungjawab: "Tanggung Jawab",
  kualitasKerja: "Kualitas Kerja",
  sikapKerja: "Sikap Kerja",
  inisiatif: "Inisiatif",
  kepatuhan: "Kepatuhan",
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <Badge variant="outline" className="text-xs text-neutral-400">Belum dinilai</Badge>
  if (status === 'FINAL') return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs border"><CheckCircle2 className="h-3 w-3 mr-1" />Final</Badge>
  if (status === 'DITINJAU_HRD') return <Badge className="bg-violet-100 text-violet-700 border text-xs">Ditinjau HRD</Badge>
  return <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 text-xs border"><Clock className="h-3 w-3 mr-1" />Draft</Badge>
}

function ScoreGauge({ value, label, max = 100 }: { value: number | null; label: string; max?: number }) {
  const pct = value !== null ? Math.round((value / max) * 100) : 0
  const color = value === null ? "text-neutral-300" :
    value >= 90 ? "text-emerald-600" : value >= 80 ? "text-blue-600" :
    value >= 70 ? "text-amber-600" : "text-red-500"
  const barColor = value === null ? "bg-neutral-100" :
    value >= 90 ? "bg-emerald-500" : value >= 80 ? "bg-blue-500" :
    value >= 70 ? "bg-amber-500" : "bg-red-500"

  return (
    <div className="text-center">
      <div className={cn("text-3xl font-black leading-none mb-1", color)}>
        {value ?? "—"}
      </div>
      <div className="text-[10px] text-neutral-400 mb-2">{label}</div>
      <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function StarDisplay({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < value ? "fill-amber-400 text-amber-400" : "text-neutral-200 dark:text-neutral-700"
          )}
        />
      ))}
      <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300 ml-1">{value}/5</span>
    </div>
  )
}

function DetailContent({ params }: { params: { pegawaiId: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bulan = Number(searchParams.get("bulan")) || (new Date().getMonth() + 1)
  const tahun = Number(searchParams.get("tahun")) || new Date().getFullYear()

  const [detail, setDetail] = useState<any>(null)
  const [riwayat, setRiwayat] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [detailRes, riwayatRes] = await Promise.all([
        getPenilaianDetail(params.pegawaiId, bulan, tahun),
        getRiwayatPenilaian(params.pegawaiId)
      ])
      if ((detailRes as any).success) setDetail(detailRes)
      else toast.error((detailRes as any).error || "Gagal memuat data")
      setRiwayat(Array.isArray(riwayatRes) ? riwayatRes : [])
      setLoading(false)
    }
    load()
  }, [params.pegawaiId, bulan, tahun])

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm text-neutral-400">Memuat detail penilaian...</p>
      </div>
    </div>
  )

  const pegawai = detail?.pegawai
  const indeks = detail?.indeks
  const penilaian = detail?.penilaian

  const kompoList = penilaian ? Object.entries(KOMPONEN_LABEL).map(([key, label]) => ({
    label,
    value: penilaian[key] as number,
  })) : []

  const blended = indeks?.skorAkhirBlended ?? null

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <SidebarNav />
      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300" style={{ marginLeft: "var(--sidebar-width, 16rem)" }}>
        <TopBar breadcrumb={["Penilaian Pegawai", "Detail Penilaian"]} />

        <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full space-y-5">
          {/* Back */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => router.back()}>
              <ArrowLeft className="h-3.5 w-3.5" /> Kembali
            </Button>
            {penilaian && (
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs ml-auto"
                onClick={() => router.push(`/penilaian/form/${params.pegawaiId}?bulan=${bulan}&tahun=${tahun}`)}>
                <FileText className="h-3.5 w-3.5" />
                {penilaian.status === 'FINAL' ? "Lihat Form" : "Edit Draft"}
              </Button>
            )}
          </div>

          {/* Profile */}
          {pegawai && (
            <Card className="border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500" />
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 ring-2 ring-neutral-100 dark:ring-neutral-800 shadow-sm">
                    <AvatarImage src={pegawai.fotoUrl} />
                    <AvatarFallback className="text-lg font-black bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                      {pegawai.nama.split(' ').slice(0, 2).map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-white">{pegawai.nama}</h2>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-sm text-neutral-500">{pegawai.jabatan}</span>
                      {pegawai.bidang && (
                        <span className="flex items-center gap-1 text-xs text-neutral-400">
                          <Building2 className="h-3 w-3" />{pegawai.bidang.nama}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-neutral-400">
                        <Calendar className="inline h-3 w-3 mr-1" />
                        {BULAN_FULL[bulan - 1]} {tahun}
                      </span>
                      <StatusBadge status={penilaian?.status ?? null} />
                    </div>
                  </div>
                  {pegawai.suratPeringatan?.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2 text-center">
                      <AlertTriangle className="h-5 w-5 text-red-500 mx-auto" />
                      <p className="text-[10px] font-bold text-red-600 mt-0.5">SP Aktif</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Score Summary */}
          <Card className="border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900">
            <CardHeader className="pb-2 pt-5 px-5 border-b border-neutral-100 dark:border-neutral-800">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-500" /> Ringkasan Skor
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-3 gap-4">
                <ScoreGauge value={indeks?.totalSkor ?? null} label="Skor Sistem (60%)" />
                <ScoreGauge value={penilaian?.skorAtasan ?? null} label="Skor Atasan (40%)" />
                <div>
                  <div className={cn("text-3xl font-black leading-none mb-1 text-center",
                    blended === null ? "text-neutral-300" :
                    blended >= 90 ? "text-emerald-600" : blended >= 80 ? "text-blue-600" :
                    blended >= 70 ? "text-amber-600" : "text-red-500"
                  )}>
                    {blended ?? "—"}
                  </div>
                  <div className="text-[10px] text-neutral-400 text-center mb-2">Skor Akhir Blended</div>
                  <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    {blended !== null && (
                      <div
                        className={cn("h-full rounded-full", blended >= 90 ? "bg-emerald-500" : blended >= 80 ? "bg-blue-500" : blended >= 70 ? "bg-amber-500" : "bg-red-500")}
                        style={{ width: `${blended}%` }}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Sistem Detail */}
              {indeks && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  {[
                    { label: "Hari Kerja", value: indeks.hariKerja, color: "text-neutral-600" },
                    { label: "Hadir", value: indeks.hadirCount, color: "text-emerald-600" },
                    { label: "Terlambat", value: indeks.terlambatCount, color: indeks.terlambatCount > 5 ? "text-red-500" : "text-amber-600" },
                    { label: "Alpha", value: indeks.alphaCount, color: indeks.alphaCount > 3 ? "text-red-500" : "text-neutral-600" },
                  ].map(item => (
                    <div key={item.label} className="text-center bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3">
                      <p className="text-[10px] text-neutral-400 mb-1">{item.label}</p>
                      <p className={cn("text-xl font-black", item.color)}>{item.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Komponen Penilaian Detail */}
          {penilaian && (
            <Card className="border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900">
              <CardHeader className="pb-2 pt-5 px-5 border-b border-neutral-100 dark:border-neutral-800">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" /> Detail Komponen Penilaian Atasan
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {kompoList.map(k => (
                  <div key={k.label} className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200 truncate">{k.label}</p>
                      <div className="mt-1">
                        <StarDisplay value={k.value} />
                      </div>
                    </div>
                    <Progress
                      value={(k.value / 5) * 100}
                      className="w-24 h-1.5 bg-neutral-100 dark:bg-neutral-800 shrink-0"
                    />
                  </div>
                ))}

                {/* Catatan Disiplin */}
                {Array.isArray(penilaian.catatanDisiplin) && penilaian.catatanDisiplin.length > 0 && (
                  <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2 flex items-center gap-1.5">
                      <ClipboardList className="h-3.5 w-3.5" /> Catatan Disiplin Lapangan
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {penilaian.catatanDisiplin.map((c: string, i: number) => (
                        <span key={i} className="flex items-center gap-1 text-[11px] bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3" />{c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Narasi */}
          {penilaian && (penilaian.kelebihan || penilaian.halPerluDiperbaiki || penilaian.catatanAtasan) && (
            <Card className="border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900">
              <CardHeader className="pb-2 pt-5 px-5 border-b border-neutral-100 dark:border-neutral-800">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-violet-500" /> Catatan Atasan
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {penilaian.kelebihan && (
                  <div>
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 mb-1.5">
                      <Lightbulb className="h-3.5 w-3.5" /> Kelebihan
                    </p>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3 leading-relaxed">
                      {penilaian.kelebihan}
                    </p>
                  </div>
                )}
                {penilaian.halPerluDiperbaiki && (
                  <div>
                    <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-1 mb-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" /> Hal yang Perlu Diperbaiki
                    </p>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 bg-orange-50 dark:bg-orange-950/20 rounded-xl p-3 leading-relaxed">
                      {penilaian.halPerluDiperbaiki}
                    </p>
                  </div>
                )}
                {penilaian.catatanAtasan && (
                  <div>
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 mb-1.5">
                      <MessageSquare className="h-3.5 w-3.5" /> Catatan Atasan
                    </p>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 bg-blue-50 dark:bg-blue-950/20 rounded-xl p-3 leading-relaxed">
                      {penilaian.catatanAtasan}
                    </p>
                  </div>
                )}
                {penilaian.rekomendasi && (
                  <div>
                    <p className="text-xs font-semibold text-neutral-500 mb-1.5">Rekomendasi</p>
                    <span className={cn(
                      "text-sm font-semibold px-3 py-1 rounded-full border",
                      penilaian.rekomendasi === 'Pertahankan' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                      penilaian.rekomendasi === 'Tingkatkan' ? "bg-blue-100 text-blue-700 border-blue-200" :
                      penilaian.rekomendasi === 'Perlu Pembinaan' ? "bg-amber-100 text-amber-700 border-amber-200" :
                      "bg-red-100 text-red-700 border-red-200"
                    )}>
                      {penilaian.rekomendasi}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Riwayat 6 Bulan */}
          {riwayat.length > 0 && (
            <Card className="border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900">
              <CardHeader className="pb-2 pt-5 px-5 border-b border-neutral-100 dark:border-neutral-800">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-teal-500" /> Riwayat Penilaian (6 Bulan Terakhir)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {riwayat.map((r, idx) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 px-5 py-3.5 border-b border-neutral-50 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                      <Calendar className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-800 dark:text-white">{r.label}</p>
                      <p className="text-[11px] text-neutral-400">Dinilai oleh: {r.penilaiNama}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-[10px] text-neutral-400">Atasan</p>
                        <p className={cn("text-base font-black",
                          r.skorAtasan >= 80 ? "text-emerald-600" :
                          r.skorAtasan >= 60 ? "text-amber-600" : "text-red-500"
                        )}>{r.skorAtasan.toFixed(0)}</p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}

export default function DetailPenilaianPage({ params }: { params: Promise<{ pegawaiId: string }> }) {
  const resolvedParams = use(params)
  return (
    <SidebarProvider>
      <DetailContent params={resolvedParams} />
    </SidebarProvider>
  )
}
