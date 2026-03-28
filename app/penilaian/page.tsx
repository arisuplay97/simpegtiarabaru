"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ClipboardCheck, Users, Search, Filter, CheckCircle2,
  Clock, Loader2, ChevronRight, Star, AlertCircle,
  BarChart3, FileText, Eye, Plus, RefreshCcw, Building2,
  TrendingUp, Award, LayoutGrid, List
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { SidebarNav, SidebarProvider } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { getPenilaianList, getDashboardPenilaian } from "@/lib/actions/penilaian"

const BULAN_NAMES = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return (
    <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
      <Clock className="h-3 w-3" /> Belum dinilai
    </span>
  )
  if (status === 'FINAL') return (
    <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
      <CheckCircle2 className="h-3 w-3" /> Final
    </span>
  )
  if (status === 'DITINJAU_HRD') return (
    <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800">
      <Eye className="h-3 w-3" /> Ditinjau HRD
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
      <FileText className="h-3 w-3" /> Draft
    </span>
  )
}

function ScorePill({ skor, label }: { skor: number | null; label?: string }) {
  if (skor === null) return <span className="text-[11px] text-neutral-400">—</span>
  const color =
    skor >= 90 ? "bg-emerald-500" :
    skor >= 80 ? "bg-blue-500" :
    skor >= 70 ? "bg-amber-500" :
    skor >= 60 ? "bg-orange-500" : "bg-red-500"
  return (
    <div className="flex flex-col items-center gap-0.5">
      {label && <span className="text-[10px] text-neutral-400 uppercase tracking-wide">{label}</span>}
      <div className={cn("text-white text-sm font-bold px-2.5 py-0.5 rounded-full min-w-[48px] text-center", color)}>
        {skor}
      </div>
    </div>
  )
}

function PenilaianContent() {
  const router = useRouter()
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role

  const now = new Date()
  const [bulan, setBulan] = useState(now.getMonth() + 1)
  const [tahun, setTahun] = useState(now.getFullYear())
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")

  const [data, setData] = useState<any[]>([])
  const [dashboard, setDashboard] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const isAdmin = ['SUPERADMIN', 'HRD'].includes(userRole)

  const loadData = async () => {
    setLoading(true)
    try {
      const [listRes, dashRes] = await Promise.all([
        getPenilaianList(bulan, tahun),
        getDashboardPenilaian(bulan, tahun)
      ])
      if ((listRes as any).success) setData((listRes as any).data)
      else toast.error((listRes as any).error)
      if ((dashRes as any).success) setDashboard(dashRes)
    } catch {
      toast.error("Gagal memuat data penilaian")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [bulan, tahun])

  const filtered = data.filter(p => {
    const matchSearch = p.nama.toLowerCase().includes(search.toLowerCase()) ||
      p.jabatan.toLowerCase().includes(search.toLowerCase()) ||
      p.unit.toLowerCase().includes(search.toLowerCase())
    const matchStatus =
      filterStatus === "all" ? true :
      filterStatus === "belum" ? !p.statusPenilaian :
      filterStatus === "draft" ? p.statusPenilaian === 'DRAFT' :
      filterStatus === "final" ? p.statusPenilaian === 'FINAL' : true
    return matchSearch && matchStatus
  })

  const groupedData = filtered.reduce((acc, curr) => {
    const unit = curr.unit || "Lainnya"
    if (!acc[unit]) acc[unit] = []
    acc[unit].push(curr)
    return acc
  }, {} as Record<string, any[]>)
  
  const sortedUnits = Object.keys(groupedData).sort()

  const handleNilai = (pegawaiId: string) => {
    router.push(`/penilaian/form/${pegawaiId}?bulan=${bulan}&tahun=${tahun}`)
  }

  const handleDetail = (pegawaiId: string) => {
    router.push(`/penilaian/detail/${pegawaiId}?bulan=${bulan}&tahun=${tahun}`)
  }

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <SidebarNav />
      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300" style={{ marginLeft: "var(--sidebar-width, 16rem)" }}>
        <TopBar breadcrumb={["Dashboard", "Kinerja & Karier", "Penilaian Pegawai"]} />

        <main className="flex-1 p-4 md:p-6 space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-blue-500" />
                Penilaian Pegawai
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Evaluasi kinerja kualitatif oleh atasan langsung
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={String(bulan)} onValueChange={v => setBulan(Number(v))}>
                <SelectTrigger className="w-[130px] text-sm h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BULAN_NAMES.map((b, i) => (
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
              <Button size="sm" variant="outline" className="h-9 w-9 p-0" onClick={loadData} disabled={loading}>
                <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
            </div>
          </div>

          {/* Stats */}
          {dashboard && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Pegawai", value: dashboard.totalPegawai, icon: <Users className="h-4 w-4 text-blue-500" />, color: "bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/50" },
                { label: "Sudah Dinilai", value: dashboard.sudahDinilai, icon: <FileText className="h-4 w-4 text-amber-500" />, color: "bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50" },
                { label: "Final", value: dashboard.sudahFinal, icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />, color: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50" },
                { label: "Belum Dinilai", value: dashboard.belumDinilai, icon: <AlertCircle className="h-4 w-4 text-rose-500" />, color: "bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/50" },
              ].map(stat => (
                <Card key={stat.label} className={cn("border shadow-none", stat.color)}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-white dark:bg-neutral-900 flex items-center justify-center shadow-sm shrink-0">
                      {stat.icon}
                    </div>
                    <div>
                      <p className="text-2xl font-black text-neutral-800 dark:text-white leading-none">{stat.value}</p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Progress Bar */}
          {dashboard && (
            <Card className="border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                    Progress Penilaian {BULAN_NAMES[bulan - 1]} {tahun}
                  </span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {dashboard.persenSelesai}%
                  </span>
                </div>
                <Progress value={dashboard.persenSelesai} className="h-2.5 bg-neutral-100 dark:bg-neutral-800" />
                <p className="text-[11px] text-neutral-400 mt-1.5">
                  {dashboard.sudahDinilai} dari {dashboard.totalPegawai} pegawai sudah dinilai ({dashboard.sudahFinal} sudah final)
                </p>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Cari nama, jabatan, unit..."
                className="pl-9 h-9 text-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px] h-9 text-sm">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-neutral-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="belum">Belum Dinilai</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="final">Final</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden h-9">
              <button
                onClick={() => setViewMode("list")}
                className={cn("px-2.5 flex items-center", viewMode === "list" ? "bg-blue-500 text-white" : "text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800")}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={cn("px-2.5 flex items-center", viewMode === "grid" ? "bg-blue-500 text-white" : "text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800")}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Data */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-sm text-neutral-400">Memuat daftar pegawai...</p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <Card className="border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900">
              <CardContent className="flex flex-col items-center justify-center h-56 gap-3 text-neutral-400">
                <Users className="h-10 w-10 opacity-20" />
                <p className="text-sm">Tidak ada pegawai yang sesuai filter</p>
              </CardContent>
            </Card>
          ) : viewMode === "list" ? (
            /* ── LIST VIEW ── */
            <Card className="border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 overflow-hidden">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-2.5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide">Pegawai</span>
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide text-center w-16">Sistem</span>
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide text-center w-16">Atasan</span>
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide w-28 text-center">Status</span>
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide w-20 text-center">Aksi</span>
              </div>
              {sortedUnits.map(unit => (
                <div key={unit}>
                  <div className="bg-neutral-100 dark:bg-neutral-800/80 px-5 py-2 text-xs font-bold text-neutral-600 dark:text-neutral-300 flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-700">
                    <Building2 className="h-3.5 w-3.5" />
                    {unit}
                    <Badge variant="outline" className="ml-2 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-[10px] h-5 px-1.5">{groupedData[unit].length}</Badge>
                  </div>
                  {groupedData[unit].map((p: any) => (
                    <div
                      key={p.pegawaiId}
                      className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-3.5 border-b border-neutral-50 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                    >
                  {/* Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={p.fotoUrl} />
                      <AvatarFallback className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold">
                        {p.nama.split(' ').slice(0, 2).map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-800 dark:text-white truncate">{p.nama}</p>
                      <p className="text-[11px] text-neutral-400 truncate">{p.jabatan} · {p.unit}</p>
                    </div>
                  </div>
                  {/* Skor sistem */}
                  <div className="w-16 flex justify-center">
                    <ScorePill skor={p.skorSistem} />
                  </div>
                  {/* Skor atasan */}
                  <div className="w-16 flex justify-center">
                    <ScorePill skor={p.skorAtasan} />
                  </div>
                  {/* Status */}
                  <div className="w-28 flex justify-center">
                    <StatusBadge status={p.statusPenilaian} />
                  </div>
                  {/* Aksi */}
                  <div className="w-20 flex items-center justify-center gap-1">
                    <Button
                      size="sm"
                      variant={p.statusPenilaian === 'FINAL' ? "outline" : "default"}
                      className="h-7 text-xs px-2.5 gap-1"
                      onClick={() => handleNilai(p.pegawaiId)}
                      disabled={p.statusPenilaian === 'FINAL' && !isAdmin}
                      id={`btn-nilai-${p.pegawaiId}`}
                    >
                      {p.statusPenilaian ? (
                        <><FileText className="h-3 w-3" />Edit</>
                      ) : (
                        <><Plus className="h-3 w-3" />Nilai</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => handleDetail(p.pegawaiId)}
                      id={`btn-detail-${p.pegawaiId}`}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                  ))}
                </div>
              ))}
            </Card>
          ) : (
            /* ── GRID VIEW ── */
            <div className="space-y-6">
              {sortedUnits.map(unit => (
                <div key={unit} className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-neutral-200 dark:border-neutral-800">
                    <Building2 className="h-4 w-4 text-neutral-500" />
                    <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">{unit}</h2>
                    <Badge variant="secondary" className="ml-2 text-[10px] h-5 px-1.5">{groupedData[unit].length}</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {groupedData[unit].map((p: any) => (
                      <Card
                        key={p.pegawaiId}
                        className="border border-neutral-100 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 hover:shadow-md transition-shadow"
                      >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={p.fotoUrl} />
                        <AvatarFallback className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold">
                          {p.nama.split(' ').slice(0, 2).map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-neutral-800 dark:text-white truncate">{p.nama}</p>
                        <p className="text-[11px] text-neutral-400 truncate">{p.jabatan}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Building2 className="h-3 w-3 text-neutral-400" />
                          <p className="text-[11px] text-neutral-400 truncate">{p.unit}</p>
                        </div>
                      </div>
                      <StatusBadge status={p.statusPenilaian} />
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center bg-neutral-50 dark:bg-neutral-800 rounded-lg p-2">
                        <p className="text-[10px] text-neutral-400 mb-1">Sistem</p>
                        <p className={cn("text-base font-black",
                          p.skorSistem >= 90 ? "text-emerald-600" :
                          p.skorSistem >= 80 ? "text-blue-600" :
                          p.skorSistem >= 70 ? "text-amber-600" :
                          p.skorSistem ? "text-red-500" : "text-neutral-300"
                        )}>{p.skorSistem ?? "—"}</p>
                      </div>
                      <div className="text-center bg-neutral-50 dark:bg-neutral-800 rounded-lg p-2">
                        <p className="text-[10px] text-neutral-400 mb-1">Atasan</p>
                        <p className={cn("text-base font-black",
                          p.skorAtasan >= 90 ? "text-emerald-600" :
                          p.skorAtasan >= 80 ? "text-blue-600" :
                          p.skorAtasan >= 70 ? "text-amber-600" :
                          p.skorAtasan ? "text-red-500" : "text-neutral-300"
                        )}>{p.skorAtasan ?? "—"}</p>
                      </div>
                      <div className="text-center bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2">
                        <p className="text-[10px] text-blue-500 mb-1">Akhir</p>
                        <p className={cn("text-base font-black",
                          p.skorAkhirBlended >= 90 ? "text-emerald-600" :
                          p.skorAkhirBlended >= 80 ? "text-blue-600" :
                          p.skorAkhirBlended >= 70 ? "text-amber-600" :
                          p.skorAkhirBlended ? "text-red-500" : "text-neutral-300"
                        )}>{p.skorAkhirBlended ?? "—"}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={p.statusPenilaian === 'FINAL' ? "outline" : "default"}
                        className="flex-1 h-8 text-xs gap-1.5"
                        onClick={() => handleNilai(p.pegawaiId)}
                        disabled={p.statusPenilaian === 'FINAL' && !isAdmin}
                        id={`grid-btn-nilai-${p.pegawaiId}`}
                      >
                        {p.statusPenilaian ? <FileText className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                        {p.statusPenilaian === 'FINAL' ? "Lihat" : p.statusPenilaian ? "Edit Draft" : "Nilai Sekarang"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 shrink-0"
                        onClick={() => handleDetail(p.pegawaiId)}
                        id={`grid-btn-detail-${p.pegawaiId}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default function PenilaianPage() {
  return (
    <SidebarProvider>
      <PenilaianContent />
    </SidebarProvider>
  )
}
