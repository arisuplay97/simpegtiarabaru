"use client"

import { useState, useEffect, useCallback } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import {
  getKontrakList, getKontrakStats, createKontrak,
  perpanjangKontrak, updateStatusKontrak, getPegawaiUntukKontrak,
} from "@/lib/actions/kontrak"
import {
  ScrollText, Plus, Search, AlertTriangle, CheckCircle2,
  Clock, Users, MoreHorizontal, RefreshCw, CalendarDays,
  Briefcase, XCircle, RotateCcw, Eye, ChevronRight,
  FileSpreadsheet, Sparkles, Building2, Check,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Tipe & Konstanta ──────────────────────────────────────
const TIPE_STYLE: Record<string, { label: string; badge: string }> = {
  PKWT:   { label: "PKWT",   badge: "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border-slate-200/80 dark:border-zinc-700/80" },
  MAGANG: { label: "Magang", badge: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20" },
}

const STATUS_STYLE: Record<string, { label: string; badge: string; dot: string }> = {
  AKTIF:        { label: "Aktif",        badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20", dot: "bg-emerald-500" },
  SELESAI:      { label: "Selesai",      badge: "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border-slate-200 dark:border-zinc-700", dot: "bg-slate-400" },
  DIPERPANJANG: { label: "Diperpanjang", badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20", dot: "bg-blue-500" },
  DIBATALKAN:   { label: "Dibatalkan",   badge: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20", dot: "bg-rose-500" },
}

const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID")

const emptyForm = {
  pegawaiId: "", tipe: "PKWT", nomorKontrak: "",
  tanggalMulai: "", tanggalSelesai: "",
  posisi: "", unitKerja: "",
  gajiKontrak: "", tunjangan: "", keterangan: "",
}

export default function KontrakPage() {
  const [data, setData] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [pegawaiList, setPegawaiList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [filterTipe, setFilterTipe] = useState("all")
  const [filterStatus, setFilterStatus] = useState("AKTIF")
  const [activeTab, setActiveTab] = useState("semua")

  // Dialog state
  const [showForm, setShowForm] = useState(false)
  const [showPerpanjang, setShowPerpanjang] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [perpanjangForm, setPerpanjangForm] = useState({
    tanggalMulai: "", tanggalSelesai: "", gajiKontrak: "", tunjangan: "", keterangan: "",
  })
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const expiringSoon = activeTab === "expiring"
    const res = await (getKontrakList as any)({
      tipe: filterTipe,
      status: activeTab === "expiring" ? undefined : filterStatus,
      search,
      expiringSoon,
    })
    if (res.error) {
      toast.error(res.error)
      setLoading(false)
      return
    }
    setData(res.data || [])
    setLoading(false)
  }, [filterTipe, filterStatus, search, activeTab])

  const fetchStats = async () => {
    const s = await getKontrakStats()
    setStats(s)
  }

  const fetchPegawai = async () => {
    const list = await getPegawaiUntukKontrak()
    setPegawaiList(list || [])
  }

  useEffect(() => {
    fetchData()
    fetchStats()
  }, [fetchData])

  useEffect(() => {
    fetchPegawai()
  }, [])

  const hitungDurasi = (mulai: string, selesai: string) => {
    if (!mulai || !selesai) return null
    const diff = Math.round((new Date(selesai).getTime() - new Date(mulai).getTime()) / (1000 * 60 * 60 * 24))
    if (diff <= 0) return null
    const bulan = Math.floor(diff / 30)
    const hari = diff % 30
    if (bulan === 0) return `${hari} hari`
    if (hari === 0) return `${bulan} bulan`
    return `${bulan} bulan ${hari} hari`
  }

  const handlePegawaiChange = (pegawaiId: string) => {
    const p = pegawaiList.find((x) => x.id === pegawaiId)
    setForm((prev) => ({
      ...prev,
      pegawaiId,
      posisi: p?.jabatan || prev.posisi,
      unitKerja: p?.unit || prev.unitKerja,
    }))
  }

  const handleCreate = async () => {
    if (!form.pegawaiId || !form.tanggalMulai || !form.tanggalSelesai) {
      toast.error("Lengkapi data yang wajib diisi")
      return
    }
    setSaving(true)
    const res = await (createKontrak as any)({
      ...form,
      gajiKontrak: Number(form.gajiKontrak) || 0,
      tunjangan: Number(form.tunjangan) || 0,
    })
    setSaving(false)
    if (res.error) {
      toast.error(res.error)
      return
    }
    toast.success("Kontrak berhasil dibuat")
    setShowForm(false)
    setForm({ ...emptyForm })
    fetchData()
    fetchStats()
  }

  const handlePerpanjang = async () => {
    if (!perpanjangForm.tanggalMulai || !perpanjangForm.tanggalSelesai) {
      toast.error("Lengkapi tanggal mulai dan selesai baru")
      return
    }
    setSaving(true)
    const res = await (perpanjangKontrak as any)(selected.id, {
      ...perpanjangForm,
      gajiKontrak: Number(perpanjangForm.gajiKontrak) || selected.gajiKontrak,
      tunjangan: Number(perpanjangForm.tunjangan) || selected.tunjangan,
    })
    setSaving(false)
    if (res.error) {
      toast.error(res.error)
      return
    }
    toast.success("Kontrak berhasil diperpanjang")
    setShowPerpanjang(false)
    fetchData()
    fetchStats()
  }

  const handleUpdateStatus = async (id: string, status: "SELESAI" | "DIBATALKAN") => {
    const label = status === "SELESAI" ? "selesaikan" : "batalkan"
    if (!confirm(`Yakin ingin ${label} kontrak ini?`)) return
    const res = await (updateStatusKontrak as any)(id, status)
    if (res.error) {
      toast.error(res.error)
      return
    }
    toast.success(`Kontrak berhasil di${label}`)
    fetchData()
    fetchStats()
  }

  const getProgressColor = (sisa: number) => {
    if (sisa <= 7) return "bg-rose-500"
    if (sisa <= 14) return "bg-amber-500"
    return "bg-emerald-500"
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-[#0B0C0E]">
      <SidebarNav />

      <div className="flex flex-1 flex-col sidebar-offset min-w-0">
        <TopBar breadcrumb={["Kepegawaian", "Kontrak & Magang"]} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1720px] mx-auto w-full">

          {/* ── 1. CLEAN ENTERPRISE HEADER ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200/80 dark:border-zinc-800/80">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
                  Manajemen Kontrak & Magang
                </h1>
                <span className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200/80 dark:border-zinc-700/80">
                  PKWT & Magang
                </span>
              </div>
              <p className="text-xs sm:text-[13px] text-slate-500 dark:text-zinc-400 mt-1">
                Kelola dokumen perjanjian kerja, masa berlaku, dan tindak lanjut perpanjangan kontrak pegawai.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { fetchData(); fetchStats() }}
                className="h-9 text-xs rounded-lg border-slate-200 dark:border-zinc-800 font-medium text-slate-700 dark:text-zinc-300 shadow-2xs"
              >
                <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
                Refresh
              </Button>

              <Button
                size="sm"
                onClick={() => setShowForm(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-xs font-semibold rounded-lg h-9 px-3.5 shadow-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Buat Kontrak Baru
              </Button>
            </div>
          </div>

          {/* ── 2. CLEAN ENTERPRISE STAT CARDS ── */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { label: "Total Kontrak Aktif", value: stats.totalAktif, sub: "Seluruh pegawai kontrak", icon: Users },
                { label: "PKWT Aktif", value: stats.totalPKWT, sub: "Waktu tertentu", icon: Briefcase },
                { label: "Magang Aktif", value: stats.totalMagang, sub: "Internship & pelatihan", icon: ScrollText },
                { label: "Habis ≤ 14 Hari", value: stats.expiringSoon, sub: "Segera tindak lanjuti", icon: AlertTriangle },
                { label: "Habis Bulan Ini", value: stats.selesaibulanIni, sub: "Bulan kalender berjalan", icon: CalendarDays },
              ].map((s, idx) => (
                <div
                  key={idx}
                  className="rounded-xl bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 p-4 shadow-2xs hover:border-slate-300 dark:hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                      {s.label}
                    </span>
                    <div className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-zinc-800/80 flex items-center justify-center text-slate-600 dark:text-zinc-400 shrink-0">
                      <s.icon className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 tabular-nums">
                    {s.value}
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5 truncate">
                    {s.sub}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* ── ALERT HABIS SEGERA ── */}
          {stats?.expiringSoon > 0 && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-amber-900 dark:text-amber-200">
                    {stats.expiringSoon} kontrak pegawai akan berakhir dalam 14 hari ke depan
                  </p>
                  <p className="text-[11px] text-amber-700/90 dark:text-amber-300/90 mt-0.5">
                    Koordinasikan evaluasi kinerja untuk persiapan perpanjangan atau penyelesaian kontrak.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveTab("expiring")}
                className="border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 hover:bg-amber-100/50 dark:hover:bg-amber-950/40 rounded-lg text-xs font-medium h-8 px-3 shrink-0"
              >
                Lihat Kontrak Akan Habis
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          )}

          {/* ── 3. TABS & CONTROLS ── */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 p-2.5 rounded-xl shadow-2xs">
            <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-zinc-900 rounded-lg border border-slate-200/80 dark:border-zinc-800 select-none">
              <button
                onClick={() => setActiveTab("semua")}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                  activeTab === "semua"
                    ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-50 shadow-2xs"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                )}
              >
                Semua Kontrak
              </button>
              <button
                onClick={() => setActiveTab("expiring")}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5",
                  activeTab === "expiring"
                    ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-50 shadow-2xs"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                )}
              >
                <span>Akan Habis</span>
                {stats?.expiringSoon > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {stats.expiringSoon}
                  </span>
                )}
              </button>
            </div>

            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama, NIK, nomor kontrak..."
                  className="pl-8 h-8 text-xs rounded-lg bg-slate-50 dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 font-medium"
                />
              </div>

              <div className="w-full sm:w-[130px]">
                <Select value={filterTipe} onValueChange={setFilterTipe}>
                  <SelectTrigger className="h-8 text-xs rounded-lg bg-slate-50 dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 font-medium">
                    <SelectValue placeholder="Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Semua Tipe</SelectItem>
                    <SelectItem value="PKWT" className="text-xs">PKWT</SelectItem>
                    <SelectItem value="MAGANG" className="text-xs">Magang</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {activeTab === "semua" && (
                <div className="w-full sm:w-[140px]">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-8 text-xs rounded-lg bg-slate-50 dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AKTIF" className="text-xs">Aktif</SelectItem>
                      <SelectItem value="SELESAI" className="text-xs">Selesai</SelectItem>
                      <SelectItem value="DIPERPANJANG" className="text-xs">Diperpanjang</SelectItem>
                      <SelectItem value="DIBATALKAN" className="text-xs">Dibatalkan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* ── 4. MODERN CONTRACTS TABLE ── */}
          <div className="bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 rounded-xl shadow-2xs overflow-hidden">
            {loading ? (
              <div className="p-16 text-center space-y-3">
                <RefreshCw className="h-7 w-7 text-slate-400 animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-600 dark:text-zinc-300">
                  Memuat data kontrak & magang...
                </p>
              </div>
            ) : data.length === 0 ? (
              <div className="p-16 text-center space-y-2">
                <ScrollText className="h-8 w-8 text-slate-300 dark:text-zinc-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                  Tidak ada data kontrak
                </p>
                <p className="text-xs text-slate-400 dark:text-zinc-500">
                  Belum ada kontrak yang sesuai dengan kriteria filter saat ini.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="text-xs">
                  <TableHeader>
                    <tr className="bg-slate-50/80 dark:bg-zinc-900/80 border-b border-slate-200/80 dark:border-zinc-800 text-[11px] font-semibold text-slate-600 dark:text-zinc-400">
                      <TableHead className="py-3 px-4 min-w-[200px]">Pegawai</TableHead>
                      <TableHead className="py-3 px-3">Tipe</TableHead>
                      <TableHead className="py-3 px-3">Nomor Kontrak & Posisi</TableHead>
                      <TableHead className="py-3 px-3">Periode Kontrak</TableHead>
                      <TableHead className="py-3 px-3 min-w-[140px]">Sisa Hari / Durasi</TableHead>
                      <TableHead className="py-3 px-3 text-right">Gaji / Saku</TableHead>
                      <TableHead className="py-3 px-3 text-center">Status</TableHead>
                      <TableHead className="py-3 px-3 text-right">Aksi</TableHead>
                    </tr>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-medium">
                    {data.map((k) => {
                      const tipeCfg = TIPE_STYLE[k.tipe] || TIPE_STYLE.PKWT
                      const statusCfg = STATUS_STYLE[k.status] || STATUS_STYLE.AKTIF
                      const isWarn = k.isExpiringSoon

                      return (
                        <tr
                          key={k.id}
                          className={cn(
                            "transition-colors hover:bg-slate-50/60 dark:hover:bg-zinc-800/30",
                            isWarn && "bg-amber-500/5 dark:bg-amber-500/5"
                          )}
                        >
                          {/* Pegawai */}
                          <TableCell className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 rounded-lg border border-slate-200 dark:border-zinc-800">
                                <AvatarImage src={k.foto || undefined} />
                                <AvatarFallback className="rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                                  {k.nama.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-zinc-100 text-xs leading-none">
                                  {k.nama}
                                </p>
                                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1 font-mono">
                                  {k.nik} · <span className="text-slate-600 dark:text-zinc-400 font-sans">{k.unit}</span>
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Tipe */}
                          <TableCell className="py-3 px-3">
                            <Badge className={cn("text-[10px] font-bold rounded-md px-2 py-0.5", tipeCfg.badge)}>
                              {tipeCfg.label}
                            </Badge>
                          </TableCell>

                          {/* No Kontrak & Posisi */}
                          <TableCell className="py-3 px-3">
                            <p className="font-bold text-slate-800 dark:text-zinc-200">
                              {k.posisi}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {k.nomorKontrak || "—"}
                            </p>
                          </TableCell>

                          {/* Periode */}
                          <TableCell className="py-3 px-3 text-[11px]">
                            <p className="text-slate-800 dark:text-zinc-200 font-semibold">
                              {k.tanggalMulai}
                            </p>
                            <p className="text-slate-400">
                              s/d {k.tanggalSelesai}
                            </p>
                          </TableCell>

                          {/* Sisa Hari & Progress */}
                          <TableCell className="py-3 px-3">
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className={cn(
                                  "font-bold",
                                  k.isExpired ? "text-rose-600" : k.isExpiringSoon ? "text-amber-600" : "text-emerald-600"
                                )}>
                                  {k.isExpired ? "Sudah Berakhir" : `${k.sisaHari} hari lagi`}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {k.persentase}%
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={cn("h-full rounded-full transition-all", getProgressColor(k.sisaHari))}
                                  style={{ width: `${k.persentase}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>

                          {/* Gaji */}
                          <TableCell className="py-3 px-3 text-right">
                            <p className="font-mono font-bold text-slate-800 dark:text-zinc-200">
                              {k.gajiKontrak > 0 ? fmt(k.gajiKontrak) : "—"}
                            </p>
                            {k.tunjangan > 0 && (
                              <p className="text-[10px] text-slate-400 font-mono">
                                +{fmt(k.tunjangan)}
                              </p>
                            )}
                          </TableCell>

                          {/* Status */}
                          <TableCell className="py-3 px-3 text-center">
                            <span className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium border",
                              statusCfg.badge
                            )}>
                              <span className={cn("w-1.5 h-1.5 rounded-full", statusCfg.dot)} />
                              {statusCfg.label}
                            </span>
                          </TableCell>

                          {/* Action */}
                          <TableCell className="py-3 px-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="text-xs rounded-lg shadow-sm border-slate-200 dark:border-zinc-800">
                                <DropdownMenuItem onClick={() => { setSelected(k); setShowDetail(true) }}>
                                  <Eye className="h-3.5 w-3.5 mr-2" /> Detail Kontrak
                                </DropdownMenuItem>
                                {k.status === "AKTIF" && (
                                  <>
                                    <DropdownMenuItem onClick={() => {
                                      setSelected(k)
                                      setPerpanjangForm({
                                        tanggalMulai: "",
                                        tanggalSelesai: "",
                                        gajiKontrak: String(k.gajiKontrak),
                                        tunjangan: String(k.tunjangan),
                                        keterangan: "",
                                      })
                                      setShowPerpanjang(true)
                                    }}>
                                      <RotateCcw className="h-3.5 w-3.5 mr-2" /> Perpanjang Kontrak
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleUpdateStatus(k.id, "SELESAI")}>
                                      <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-600" /> Selesaikan Kontrak
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleUpdateStatus(k.id, "DIBATALKAN")} className="text-rose-600">
                                      <XCircle className="h-3.5 w-3.5 mr-2" /> Batalkan Kontrak
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </tr>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* ── 5. DIALOG: BUAT KONTRAK BARU ── */}
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogContent className="max-w-xl rounded-xl bg-white dark:bg-[#111113] border-slate-200 dark:border-zinc-800">
              <DialogHeader>
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-700/80">
                    <ScrollText className="w-4 h-4" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
                      Buat Kontrak Baru
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400">
                      Pilih pegawai dan tentukan masa berlaku kontrak PKWT atau Magang
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-3.5 py-2 text-xs">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Pegawai <span className="text-rose-500">*</span></Label>
                  <Select value={form.pegawaiId} onValueChange={handlePegawaiChange}>
                    <SelectTrigger className="h-9 rounded-xl bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs">
                      <SelectValue placeholder="Pilih nama pegawai..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {pegawaiList.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-xs">
                          {p.nama} — {p.nik} ({p.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Tipe Kontrak <span className="text-rose-500">*</span></Label>
                    <Select value={form.tipe} onValueChange={(v) => setForm({ ...form, tipe: v })}>
                      <SelectTrigger className="h-9 rounded-xl bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PKWT" className="text-xs">PKWT (Waktu Tertentu)</SelectItem>
                        <SelectItem value="MAGANG" className="text-xs">Magang / Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Nomor Kontrak</Label>
                    <Input
                      placeholder="PKWT/001/2026"
                      value={form.nomorKontrak}
                      onChange={(e) => setForm({ ...form, nomorKontrak: e.target.value })}
                      className="h-9 rounded-xl bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Tanggal Mulai <span className="text-rose-500">*</span></Label>
                    <Input
                      type="date"
                      value={form.tanggalMulai}
                      onChange={(e) => setForm({ ...form, tanggalMulai: e.target.value })}
                      className="h-9 rounded-xl bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Tanggal Selesai <span className="text-rose-500">*</span></Label>
                    <Input
                      type="date"
                      value={form.tanggalSelesai}
                      onChange={(e) => setForm({ ...form, tanggalSelesai: e.target.value })}
                      className="h-9 rounded-xl bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs"
                    />
                  </div>
                </div>

                {form.tanggalMulai && form.tanggalSelesai && (
                  <div className="p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 text-blue-800 dark:text-blue-300 flex items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0 text-blue-600" />
                    <span>Durasi: <strong>{hitungDurasi(form.tanggalMulai, form.tanggalSelesai) || "Tanggal tidak valid"}</strong></span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Posisi / Jabatan</Label>
                    <Input
                      placeholder="Staf Administrasi"
                      value={form.posisi}
                      onChange={(e) => setForm({ ...form, posisi: e.target.value })}
                      className="h-9 rounded-xl bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Unit Kerja</Label>
                    <Input
                      placeholder="Bidang Umum"
                      value={form.unitKerja}
                      onChange={(e) => setForm({ ...form, unitKerja: e.target.value })}
                      className="h-9 rounded-xl bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Gaji / Uang Saku (Rp)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={form.gajiKontrak}
                      onChange={(e) => setForm({ ...form, gajiKontrak: e.target.value })}
                      className="h-9 rounded-xl bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Tunjangan (Rp)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={form.tunjangan}
                      onChange={(e) => setForm({ ...form, tunjangan: e.target.value })}
                      className="h-9 rounded-xl bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Keterangan Tambahan</Label>
                  <Textarea
                    rows={2}
                    placeholder="Catatan kontrak, ketentuan evaluasi..."
                    value={form.keterangan}
                    onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                    className="rounded-xl bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowForm(false)} className="rounded-xl text-xs h-9">
                  Batal
                </Button>
                <Button size="sm" onClick={handleCreate} disabled={saving} className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-xl text-xs font-semibold h-9 px-4">
                  {saving ? "Menyimpan..." : "Simpan Kontrak"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ── 6. DIALOG: PERPANJANG KONTRAK ── */}
          <Dialog open={showPerpanjang} onOpenChange={setShowPerpanjang}>
            <DialogContent className="max-w-lg rounded-xl bg-white dark:bg-[#111113] border-slate-200 dark:border-zinc-800">
              <DialogHeader>
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-700/80">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
                      Perpanjang Kontrak Kerja
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400">
                      {selected?.nama} · {selected?.posisi}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {selected && (
                <div className="space-y-3.5 py-2 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 space-y-1">
                    <p className="text-slate-500">Kontrak saat ini:</p>
                    <p className="font-semibold text-slate-800 dark:text-zinc-200">
                      {selected.tanggalMulai} s/d {selected.tanggalSelesai}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Tanggal Mulai Baru <span className="text-rose-500">*</span></Label>
                      <Input
                        type="date"
                        value={perpanjangForm.tanggalMulai}
                        onChange={(e) => setPerpanjangForm({ ...perpanjangForm, tanggalMulai: e.target.value })}
                        className="h-9 rounded-lg bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Tanggal Selesai Baru <span className="text-rose-500">*</span></Label>
                      <Input
                        type="date"
                        value={perpanjangForm.tanggalSelesai}
                        onChange={(e) => setPerpanjangForm({ ...perpanjangForm, tanggalSelesai: e.target.value })}
                        className="h-9 rounded-lg bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Gaji Baru (Rp)</Label>
                      <Input
                        type="number"
                        value={perpanjangForm.gajiKontrak}
                        onChange={(e) => setPerpanjangForm({ ...perpanjangForm, gajiKontrak: e.target.value })}
                        className="h-9 rounded-lg bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Tunjangan Baru (Rp)</Label>
                      <Input
                        type="number"
                        value={perpanjangForm.tunjangan}
                        onChange={(e) => setPerpanjangForm({ ...perpanjangForm, tunjangan: e.target.value })}
                        className="h-9 rounded-lg bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Catatan Perpanjangan</Label>
                    <Textarea
                      rows={2}
                      placeholder="Alasan atau pertimbangan perpanjangan..."
                      value={perpanjangForm.keterangan}
                      onChange={(e) => setPerpanjangForm({ ...perpanjangForm, keterangan: e.target.value })}
                      className="rounded-lg bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs"
                    />
                  </div>
                </div>
              )}

              <DialogFooter className="gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowPerpanjang(false)} className="rounded-lg text-xs h-9">
                  Batal
                </Button>
                <Button size="sm" onClick={handlePerpanjang} disabled={saving} className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg text-xs font-semibold h-9 px-4">
                  {saving ? "Memproses..." : "Konfirmasi Perpanjang"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ── 7. DIALOG: DETAIL KONTRAK ── */}
          <Dialog open={showDetail} onOpenChange={setShowDetail}>
            <DialogContent className="max-w-md rounded-xl bg-white dark:bg-[#111113] border-slate-200 dark:border-zinc-800">
              <DialogHeader>
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-700/80">
                    <ScrollText className="w-4 h-4" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
                      Rincian Kontrak Kerja
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400">
                      Informasi lengkap perjanjian kerja
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {selected && (
                <div className="space-y-3 py-2 text-xs">
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-zinc-100 text-sm">
                        {selected.nama}
                      </span>
                      <span className="font-mono text-slate-500">{selected.nik}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <span>{selected.posisi}</span>
                      <span>·</span>
                      <span className="text-slate-700 dark:text-zinc-300 font-medium">{selected.unit}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                      <span className="text-[10px] uppercase font-semibold text-slate-400">Tipe Kontrak</span>
                      <p className="font-semibold text-slate-800 dark:text-zinc-200 mt-1">{selected.tipe}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                      <span className="text-[10px] uppercase font-semibold text-slate-400">Status</span>
                      <p className="font-semibold text-slate-800 dark:text-zinc-200 mt-1">{selected.status}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Masa Perjanjian</span>
                    <p className="font-semibold text-slate-800 dark:text-zinc-200">
                      {selected.tanggalMulai} s/d {selected.tanggalSelesai}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Sisa masa aktif: <strong className="text-slate-900 dark:text-zinc-100 font-semibold">{selected.sisaHari} hari lagi</strong>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                      <span className="text-[10px] uppercase font-semibold text-slate-400">Gaji Pokok / Saku</span>
                      <p className="font-semibold font-mono text-slate-800 dark:text-zinc-200 mt-1">
                        {fmt(selected.gajiKontrak)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                      <span className="text-[10px] uppercase font-semibold text-slate-400">Tunjangan</span>
                      <p className="font-semibold font-mono text-slate-800 dark:text-zinc-200 mt-1">
                        {fmt(selected.tunjangan)}
                      </p>
                    </div>
                  </div>

                  {selected.keterangan && (
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                      <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-zinc-400 block mb-0.5">Keterangan</span>
                      <p className="text-slate-700 dark:text-zinc-300">{selected.keterangan}</p>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setShowDetail(false)} className="rounded-lg text-xs h-9">
                  Tutup
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </main>
      </div>
    </div>
  )
}
