"use client"

import { useState, useEffect, useCallback, useMemo, Suspense } from "react"
import { useSession } from "next-auth/react"
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Search,
  Filter,
  Users,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Calendar,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Building2,
  MapPin,
  FileSpreadsheet,
  ArrowUpDown,
  Check,
  X,
  Eye,
  Info,
  Layers,
  HelpCircle,
  FileText,
  ChevronDown,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { toast } from "sonner"
import {
  getKalenderMatrix,
  isiOtomatisSisaHariMatrix,
  PegawaiMatrixRow,
  MatrixDayStatus,
} from "@/lib/actions/kalender-matrix"

// Bulan names
const BULAN_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

export default function KalenderPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Memuat Kalender...</div>}>
      <KalenderContent />
    </Suspense>
  )
}

function KalenderContent() {
  const { data: session } = useSession()
  const now = new Date()
  const [bulan, setBulan] = useState(now.getMonth() + 1)
  const [tahun, setTahun] = useState(now.getFullYear())

  // Loading & Data State
  const [loading, setLoading] = useState(true)
  const [matrixData, setMatrixData] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBidang, setSelectedBidang] = useState<string>("ALL")
  const [selectedCabang, setSelectedCabang] = useState<string>("ALL")
  const [sortBy, setSortBy] = useState<string>("nama_asc")

  // Auto-fill dialog
  const [showAutoFillDialog, setShowAutoFillDialog] = useState(false)
  const [isAutoFilling, setIsAutoFilling] = useState(false)

  // Cell Detail Dialog
  const [selectedCell, setSelectedCell] = useState<{
    pegawai: PegawaiMatrixRow
    dayStatus: MatrixDayStatus
  } | null>(null)

  const userRole = (session?.user as any)?.role?.toString().toUpperCase()
  const canManage = userRole === "SUPERADMIN" || userRole === "HRD" || userRole === "DIREKTUR"

  // Load Matrix Data
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getKalenderMatrix(bulan, tahun)
      if (res.success) {
        setMatrixData(res)
      } else {
        toast.error(res.error || "Gagal memuat matriks kehadiran")
      }
    } catch (err: any) {
      toast.error("Terjadi kesalahan saat memuat data kalender")
    } finally {
      setLoading(false)
    }
  }, [bulan, tahun])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Navigation handlers
  const handlePrevMonth = () => {
    if (bulan === 1) {
      setBulan(12)
      setTahun((prev) => prev - 1)
    } else {
      setBulan((prev) => prev - 1)
    }
  }

  const handleNextMonth = () => {
    if (bulan === 12) {
      setBulan(1)
      setTahun((prev) => prev + 1)
    } else {
      setBulan((prev) => prev + 1)
    }
  }

  // Auto fill handler
  const handleConfirmAutoFill = async () => {
    setIsAutoFilling(true)
    try {
      const res = await isiOtomatisSisaHariMatrix(bulan, tahun)
      if (res.success) {
        toast.success(res.message || "Berhasil mengisi otomatis sisa hari hadir")
        setShowAutoFillDialog(false)
        await loadData()
      } else {
        toast.error(res.error || "Gagal mengisi otomatis sisa hari")
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat mengisi otomatis kehadiran")
    } finally {
      setIsAutoFilling(false)
    }
  }

  // Filtered & Sorted Rows
  const filteredRows = useMemo(() => {
    if (!matrixData?.rows) return []

    let list: PegawaiMatrixRow[] = [...matrixData.rows]

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (r) =>
          r.nama.toLowerCase().includes(q) ||
          r.nik.toLowerCase().includes(q) ||
          r.departemen.toLowerCase().includes(q) ||
          r.cabang.toLowerCase().includes(q)
      )
    }

    // Bidang Filter
    if (selectedBidang !== "ALL") {
      list = list.filter((r) => r.bidangId === selectedBidang || r.departemen === selectedBidang)
    }

    // Cabang Filter
    if (selectedCabang !== "ALL") {
      list = list.filter((r) => r.cabangId === selectedCabang || r.cabang === selectedCabang)
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "nama_asc") return a.nama.localeCompare(b.nama)
      if (sortBy === "nama_desc") return b.nama.localeCompare(a.nama)
      if (sortBy === "nik_asc") return a.nik.localeCompare(b.nik)
      if (sortBy === "nik_desc") return b.nik.localeCompare(a.nik)
      if (sortBy === "dept_asc") return a.departemen.localeCompare(b.departemen)
      if (sortBy === "cabang_asc") return a.cabang.localeCompare(b.cabang)
      if (sortBy === "hadir_desc") return b.totalHadir - a.totalHadir
      if (sortBy === "hadir_asc") return a.totalHadir - b.totalHadir
      if (sortBy === "alpha_desc") return b.totalAlpha - a.totalAlpha
      return 0
    })

    return list
  }, [matrixData, searchQuery, selectedBidang, selectedCabang, sortBy])

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)

  // Reset ke halaman 1 saat filter atau periode berubah
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedBidang, selectedCabang, sortBy, bulan, tahun])

  const totalItems = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages)

  const paginatedRows = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, validCurrentPage, pageSize])

  // Export State
  const [isExporting, setIsExporting] = useState<string | null>(null)

  // Export to Excel or PDF via API Route
  const handleExport = async (formatType: "excel" | "pdf") => {
    setIsExporting(formatType)
    const label = formatType === "excel" ? "Excel (.xlsx)" : "PDF (.pdf)"
    const toastId = toast.loading(`Mempersiapkan berkas ${label}...`)

    try {
      const params = new URLSearchParams()
      params.set("bulan", String(bulan))
      params.set("tahun", String(tahun))
      params.set("format", formatType)
      if (selectedBidang !== "ALL") params.set("bidang", selectedBidang)
      if (selectedCabang !== "ALL") params.set("cabang", selectedCabang)
      if (searchQuery.trim()) params.set("search", searchQuery.trim())

      const res = await fetch(`/api/kalender/export?${params.toString()}`)
      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        throw new Error(errorData?.error || "Gagal mengunduh berkas ekspor")
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const ext = formatType === "excel" ? "xlsx" : "pdf"
      a.download = `Matriks_Kehadiran_${BULAN_NAMES[bulan - 1]}_${tahun}.${ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`Matriks kehadiran berhasil diunduh dalam format ${label}`, { id: toastId })
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Gagal mengekspor data kalender", { id: toastId })
    } finally {
      setIsExporting(null)
    }
  }

  // Export to CSV
  const handleExportCSV = () => {
    if (!matrixData || !filteredRows.length) {
      toast.error("Tidak ada data untuk diekspor")
      return
    }

    const totalDays = matrixData.totalDays
    const daysHeaders = Array.from({ length: totalDays }, (_, i) => `Tgl_${i + 1}`)
    const headers = [
      "NIK",
      "Nama Karyawan",
      "Departemen",
      "Cabang",
      "Jabatan",
      ...daysHeaders,
      "Total Hadir",
      "Total Terlambat",
      "Total Izin",
      "Total Sakit",
      "Total Cuti",
      "Total Alpha",
      "Total Libur",
    ]

    const rows = filteredRows.map((r) => {
      const dayCodes = Array.from({ length: totalDays }, (_, i) => r.days[i + 1]?.code || "-")
      return [
        `"${r.nik}"`,
        `"${r.nama}"`,
        `"${r.departemen}"`,
        `"${r.cabang}"`,
        `"${r.jabatan}"`,
        ...dayCodes,
        r.totalHadir,
        r.totalTerlambat,
        r.totalIzin,
        r.totalSakit,
        r.totalCuti,
        r.totalAlpha,
        r.totalLibur,
      ]
    })

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute(
      "download",
      `Matriks_Kehadiran_${BULAN_NAMES[bulan - 1]}_${tahun}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Matriks kehadiran berhasil diunduh dalam format CSV")
  }

  // Function to render clean modern grid cell
  const renderCellBadge = (st: MatrixDayStatus, row: PegawaiMatrixRow) => {
    const code = st.code

    let style = "text-slate-300 dark:text-zinc-600 hover:bg-slate-100 dark:hover:bg-zinc-800"

    if (code === "H") {
      // Green (Hadir)
      style = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100/80 font-semibold"
    } else if (code === "T") {
      // Amber (Terlambat)
      style = "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100/80 font-semibold"
    } else if (code === "C") {
      // Blue (Cuti)
      style = "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 hover:bg-blue-100/80 font-semibold"
    } else if (code === "I") {
      // Orange (Izin)
      style = "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 hover:bg-orange-100/80 font-semibold"
    } else if (code === "S") {
      // Purple (Sakit)
      style = "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 hover:bg-purple-100/80 font-semibold"
    } else if (code === "L") {
      // Slate (Libur)
      style = "text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800 font-medium"
    } else if (code === "A") {
      // Rose (Alpha)
      style = "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 hover:bg-rose-100/80 font-semibold"
    }

    return (
      <button
        type="button"
        onClick={() => setSelectedCell({ pegawai: row, dayStatus: st })}
        title={`${row.nama} · Tgl ${st.day}: ${st.statusLabel}${st.jamMasuk ? ` | Pagi: ${st.jamMasuk}` : ""}${st.jamSiang ? ` | Siang: ${st.jamSiang}` : ""}${st.jamKeluar ? ` | Sore: ${st.jamKeluar}` : ""} (WITA)`}
        className={cn(
          "w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-[4px] font-mono text-[11px] flex items-center justify-center transition-all cursor-pointer select-none shrink-0 hover:scale-105 active:scale-95",
          style
        )}
      >
        {code === "-" ? "·" : code}
      </button>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-[#0B0C0E]">
      <SidebarNav />

      <div className="flex flex-1 flex-col sidebar-offset min-w-0">
        <TopBar breadcrumb={["Kehadiran", "Kalender Kehadiran"]} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1720px] mx-auto w-full">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                  Kalender & Matriks Kehadiran
                </h1>
                <Badge variant="outline" className="text-xs font-semibold text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900/60 font-mono">
                  WITA (UTC+8)
                </Badge>
                <Badge variant="outline" className="text-xs font-normal text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-800">
                  {BULAN_NAMES[bulan - 1]} {tahun}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
                Matriks absensi seluruh pegawai PDAM TIARA dengan indikator presensi harian (Pagi, Siang, Pulang), filter bidang & cabang, serta ekspor resmi Excel dan PDF.
              </p>
            </div>

            {/* Month / Year Navigator & Actions */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 p-1 rounded-lg border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevMonth}
                  className="h-8 w-8 p-0 rounded-md text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  title="Bulan Sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="px-3 text-xs font-semibold text-slate-800 dark:text-zinc-200 min-w-[130px] text-center">
                  {BULAN_NAMES[bulan - 1]} {tahun}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNextMonth}
                  className="h-8 w-8 p-0 rounded-md text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  title="Bulan Berikutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={loading}
                className="h-9 text-xs rounded-lg border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-medium text-slate-700 dark:text-zinc-300 shadow-2xs"
              >
                <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
                Muat Ulang
              </Button>

              {/* Ekspor Dropdown Menu (Excel & PDF) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isExporting !== null || loading}
                    className="h-9 text-xs rounded-lg border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-medium text-slate-700 dark:text-zinc-300 shadow-2xs gap-1.5 cursor-pointer"
                  >
                    {isExporting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                    ) : (
                      <Download className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    )}
                    <span>Ekspor Kalender</span>
                    <ChevronDown className="h-3 w-3 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 rounded-xl p-1.5 bg-white dark:bg-[#111113] border-slate-200 dark:border-zinc-800 shadow-xl z-50">
                  <DropdownMenuItem
                    onClick={() => handleExport("excel")}
                    disabled={isExporting !== null}
                    className="gap-2.5 text-xs py-2.5 cursor-pointer font-medium text-emerald-700 dark:text-emerald-400 focus:bg-emerald-50 dark:focus:bg-emerald-950/40 rounded-lg transition-colors"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-slate-900 dark:text-zinc-100">Format Excel (.xlsx)</span>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400">Warna kode, rumus & rekap resmi</span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => handleExport("pdf")}
                    disabled={isExporting !== null}
                    className="gap-2.5 text-xs py-2.5 cursor-pointer font-medium text-rose-700 dark:text-rose-400 focus:bg-rose-50 dark:focus:bg-rose-950/40 rounded-lg transition-colors"
                  >
                    <FileText className="h-4 w-4 text-rose-600 shrink-0" />
                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-slate-900 dark:text-zinc-100">Format PDF (.pdf)</span>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400">Siap cetak landscape A4 ber-Kop</span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={handleExportCSV}
                    disabled={isExporting !== null}
                    className="gap-2.5 text-xs py-2 cursor-pointer font-medium text-slate-700 dark:text-zinc-300 focus:bg-slate-100 dark:focus:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Download className="h-4 w-4 text-slate-400 shrink-0" />
                    <div className="flex flex-col text-left">
                      <span>Format CSV (.csv)</span>
                      <span className="text-[10px] text-slate-400">Data teks mentah terpisah koma</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* ── 2. EXECUTIVE KPI STAT CARDS (Clean SaaS Style) ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              {
                title: "Total Pegawai",
                value: matrixData?.summary?.totalPegawai || 0,
                sub: "Pegawai aktif",
                icon: Users,
              },
              {
                title: "Hadir Tepat Waktu",
                value: matrixData?.summary?.totalHadir || 0,
                sub: "Presensi normal",
                icon: CheckCircle2,
              },
              {
                title: "Terlambat (T)",
                value: matrixData?.summary?.totalTerlambat || 0,
                sub: "Lewat toleransi",
                icon: Clock3,
              },
              {
                title: "Izin & Sakit (I/S)",
                value: matrixData?.summary?.totalIzinSakit || 0,
                sub: "Izin dinas & medis",
                icon: AlertTriangle,
              },
              {
                title: "Cuti Resmi (C)",
                value: matrixData?.summary?.totalCuti || 0,
                sub: "Pengajuan disetujui",
                icon: Calendar,
              },
              {
                title: "Alpha (A)",
                value: matrixData?.summary?.totalAlpha || 0,
                sub: "Tanpa keterangan",
                icon: AlertCircle,
              },
            ].map((c, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 p-4 shadow-xs hover:border-slate-300 dark:hover:border-zinc-700 transition-all"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    {c.title}
                  </span>
                  <c.icon className="h-4 w-4 text-slate-400 dark:text-zinc-500 shrink-0" />
                </div>
                <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                  {loading ? "..." : c.value}
                </div>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1 truncate">
                  {c.sub}
                </p>
              </div>
            ))}
          </div>

          {/* ── 3. UNIFIED ATTENDANCE MATRIX PANEL ── */}
          <div className="bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 rounded-xl shadow-xs overflow-hidden">
            
            {/* Top Toolbar: Filters & Actions */}
            <div className="p-3.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama karyawan / NIK..."
                    className="pl-9 h-9 text-xs rounded-lg bg-slate-50/80 dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 font-medium"
                  />
                </div>

                {/* Filter Departemen */}
                <div className="w-full sm:w-[190px]">
                  <Select value={selectedBidang} onValueChange={setSelectedBidang}>
                    <SelectTrigger className="h-9 text-xs rounded-lg bg-slate-50/80 dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 font-medium">
                      <Building2 className="h-3.5 w-3.5 mr-2 text-slate-400" />
                      <SelectValue placeholder="Semua Departemen" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="ALL" className="text-xs">Semua Departemen</SelectItem>
                      {matrixData?.departemenList?.map((d: any) => (
                        <SelectItem key={d.id} value={d.id} className="text-xs">
                          {d.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filter Cabang */}
                <div className="w-full sm:w-[180px]">
                  <Select value={selectedCabang} onValueChange={setSelectedCabang}>
                    <SelectTrigger className="h-9 text-xs rounded-lg bg-slate-50/80 dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 font-medium">
                      <MapPin className="h-3.5 w-3.5 mr-2 text-slate-400" />
                      <SelectValue placeholder="Semua Cabang" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="ALL" className="text-xs">Semua Cabang</SelectItem>
                      {matrixData?.cabangList?.map((c: any) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">
                          {c.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Control */}
                <div className="w-full sm:w-[170px]">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-9 text-xs rounded-lg bg-slate-50/80 dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 font-medium">
                      <ArrowUpDown className="h-3 w-3 mr-1.5 text-slate-400" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nama_asc" className="text-xs">Nama (A - Z)</SelectItem>
                      <SelectItem value="nama_desc" className="text-xs">Nama (Z - A)</SelectItem>
                      <SelectItem value="nik_asc" className="text-xs">NIK (Terkecil)</SelectItem>
                      <SelectItem value="nik_desc" className="text-xs">NIK (Terbesar)</SelectItem>
                      <SelectItem value="dept_asc" className="text-xs">Departemen</SelectItem>
                      <SelectItem value="cabang_asc" className="text-xs">Cabang</SelectItem>
                      <SelectItem value="hadir_desc" className="text-xs">Kehadiran Tertinggi</SelectItem>
                      <SelectItem value="hadir_asc" className="text-xs">Kehadiran Terendah</SelectItem>
                      <SelectItem value="alpha_desc" className="text-xs">Alpha Terbanyak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Quick Action Button: + Isi Otomatis Sisa Hari (H) */}
              {canManage && (
                <Button
                  size="sm"
                  onClick={() => setShowAutoFillDialog(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-xs font-semibold rounded-lg h-9 px-3.5 shadow-xs shrink-0 self-end lg:self-center"
                >
                  + Isi Otomatis Sisa Hari (H)
                </Button>
              )}
            </div>

            {/* Sub-toolbar: Minimalist Clean Legenda Strip */}
            <div className="px-4 py-2 bg-slate-50/70 dark:bg-zinc-900/50 border-t border-b border-slate-200/80 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500 dark:text-zinc-400">
                <span className="font-semibold text-slate-700 dark:text-zinc-300 text-xs">Legenda:</span>

                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500 shrink-0" />
                  <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">H</span>
                  <span className="text-slate-500 dark:text-zinc-400">Hadir</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-amber-500 shrink-0" />
                  <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">T</span>
                  <span className="text-slate-500 dark:text-zinc-400">Terlambat</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-blue-500 shrink-0" />
                  <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">C</span>
                  <span className="text-slate-500 dark:text-zinc-400">Cuti</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-orange-500 shrink-0" />
                  <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">I</span>
                  <span className="text-slate-500 dark:text-zinc-400">Izin</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-purple-500 shrink-0" />
                  <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">S</span>
                  <span className="text-slate-500 dark:text-zinc-400">Sakit</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-slate-300 dark:bg-zinc-600 shrink-0" />
                  <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">L</span>
                  <span className="text-slate-500 dark:text-zinc-400">Libur</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-rose-500 shrink-0" />
                  <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">A</span>
                  <span className="text-slate-500 dark:text-zinc-400">Alpha</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
                {filteredRows.length > 0 ? (validCurrentPage - 1) * pageSize + 1 : 0}-{Math.min(validCurrentPage * pageSize, filteredRows.length)} dari {filteredRows.length} Pegawai
              </div>
            </div>

            {/* Matrix Table */}
            {loading ? (
              <div className="p-16 text-center space-y-3">
                <RefreshCw className="h-6 w-6 text-slate-400 animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-600 dark:text-zinc-300">
                  Menyiapkan matriks kehadiran seluruh pegawai...
                </p>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                  Sinkronisasi tanggal 1 sampai {matrixData?.totalDays || 31} {BULAN_NAMES[bulan - 1]}
                </p>
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="p-16 text-center space-y-2">
                <Users className="h-8 w-8 text-slate-300 dark:text-zinc-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                  Tidak ada data pegawai yang sesuai
                </p>
                <p className="text-xs text-slate-400 dark:text-zinc-500">
                  Coba ubah kata kunci pencarian atau reset filter bidang & cabang.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto relative">
                <table className="w-full text-left border-collapse text-xs">
                  {/* Table Header */}
                  <thead>
                    <tr className="bg-slate-50/90 dark:bg-zinc-900/90 border-b border-slate-200/80 dark:border-zinc-800 text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
                      {/* Sticky NIK */}
                      <th className="py-2.5 px-3.5 sticky left-0 z-20 bg-slate-50 dark:bg-zinc-900 min-w-[95px] whitespace-nowrap border-r border-slate-200/60 dark:border-zinc-800/60 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)] font-semibold">
                        NIK
                      </th>

                      {/* Sticky Nama */}
                      <th className="py-2.5 px-3.5 sticky left-[95px] z-20 bg-slate-50 dark:bg-zinc-900 min-w-[180px] whitespace-nowrap border-r border-slate-200/60 dark:border-zinc-800/60 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)] font-semibold">
                        NAMA KARYAWAN
                      </th>

                      {/* Departemen */}
                      <th className="py-2.5 px-3.5 min-w-[150px] whitespace-nowrap border-r border-slate-200/60 dark:border-zinc-800/60 font-semibold">
                        DEPARTEMEN
                      </th>

                      {/* Cabang */}
                      <th className="py-2.5 px-3.5 min-w-[130px] whitespace-nowrap border-r border-slate-200/60 dark:border-zinc-800/60 font-semibold">
                        CABANG
                      </th>

                      {/* Numbered Date Columns (1 to N) */}
                      {matrixData?.daysInfo?.map((d: any) => (
                        <th
                          key={d.day}
                          className={cn(
                            "py-2 px-1 min-w-[32px] sm:min-w-[36px] text-center border-r border-slate-200/40 dark:border-zinc-800/40 font-medium",
                            d.isWeekend
                              ? "bg-slate-100/50 dark:bg-zinc-800/30 text-rose-500 dark:text-rose-400 font-semibold"
                              : "text-slate-700 dark:text-zinc-300"
                          )}
                        >
                          <div className="text-[11px] leading-none">{d.day}</div>
                          <div className="text-[9px] font-normal opacity-70 mt-0.5 uppercase">
                            {d.dayName}
                          </div>
                        </th>
                      ))}

                      {/* Summary Columns */}
                      <th className="py-2.5 px-2 text-center min-w-[42px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20 border-l border-slate-200/80 dark:border-zinc-800 font-bold">
                        H
                      </th>
                      <th className="py-2.5 px-2 text-center min-w-[42px] font-mono text-amber-700 dark:text-amber-400 bg-amber-50/40 dark:bg-amber-950/20 font-bold">
                        T
                      </th>
                      <th className="py-2.5 px-2 text-center min-w-[42px] font-mono text-blue-700 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/20 font-bold">
                        C
                      </th>
                      <th className="py-2.5 px-2 text-center min-w-[42px] font-mono text-purple-700 dark:text-purple-400 bg-purple-50/40 dark:bg-purple-950/20 font-bold">
                        I/S
                      </th>
                      <th className="py-2.5 px-2 text-center min-w-[42px] font-mono text-rose-700 dark:text-rose-400 bg-rose-50/40 dark:bg-rose-950/20 font-bold">
                        A
                      </th>
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-medium">
                    {paginatedRows.map((row, rowIdx) => (
                      <tr
                        key={row.id}
                        className={cn(
                          "transition-colors hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 group",
                          rowIdx % 2 === 1 ? "bg-slate-50/30 dark:bg-zinc-900/20" : "bg-white dark:bg-[#111113]"
                        )}
                      >
                        {/* Sticky NIK */}
                        <td className="py-2 px-3.5 sticky left-0 z-10 font-mono text-[11px] font-medium text-slate-700 dark:text-zinc-300 bg-inherit border-r border-slate-200/60 dark:border-zinc-800/60 whitespace-nowrap shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)]">
                          {row.nik}
                        </td>

                        {/* Sticky Nama */}
                        <td className="py-2 px-3.5 sticky left-[95px] z-10 font-semibold text-slate-900 dark:text-zinc-100 bg-inherit border-r border-slate-200/60 dark:border-zinc-800/60 whitespace-nowrap shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)]">
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[160px]" title={row.nama}>
                              {row.nama}
                            </span>
                          </div>
                        </td>

                        {/* Departemen */}
                        <td className="py-2 px-3.5 text-slate-600 dark:text-zinc-400 whitespace-nowrap border-r border-slate-200/60 dark:border-zinc-800/60">
                          <span className="truncate block max-w-[150px]" title={row.departemen}>
                            {row.departemen}
                          </span>
                        </td>

                        {/* Cabang */}
                        <td className="py-2 px-3.5 text-slate-500 dark:text-zinc-400 whitespace-nowrap border-r border-slate-200/60 dark:border-zinc-800/60">
                          <span className="truncate block max-w-[130px]" title={row.cabang}>
                            {row.cabang}
                          </span>
                        </td>

                        {/* Day Badges (1 to N) */}
                        {matrixData?.daysInfo?.map((d: any) => {
                          const st = row.days[d.day] || {
                            day: d.day,
                            dateStr: d.dateStr,
                            code: "-",
                            statusLabel: "Belum Tercatat",
                            isWeekend: d.isWeekend,
                          }
                          return (
                            <td
                              key={d.day}
                              className={cn(
                                "py-1.5 px-0.5 text-center border-r border-slate-200/40 dark:border-zinc-800/40 align-middle",
                                d.isWeekend && "bg-slate-50/40 dark:bg-zinc-900/30"
                              )}
                            >
                              <div className="flex items-center justify-center">
                                {renderCellBadge(st, row)}
                              </div>
                            </td>
                          )
                        })}

                        {/* Summary Badges */}
                        <td className="py-2 px-2 text-center font-mono font-semibold text-emerald-700 dark:text-emerald-400 border-l border-slate-200/60 dark:border-zinc-800/60 bg-emerald-50/20 dark:bg-emerald-950/10">
                          {row.totalHadir}
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-semibold text-amber-700 dark:text-amber-400 bg-amber-50/20 dark:bg-amber-950/10">
                          {row.totalTerlambat}
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-semibold text-blue-700 dark:text-blue-400 bg-blue-50/20 dark:bg-blue-950/10">
                          {row.totalCuti}
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-semibold text-purple-700 dark:text-purple-400 bg-purple-50/20 dark:bg-purple-950/10">
                          {row.totalIzin + row.totalSakit}
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-semibold text-rose-700 dark:text-rose-400 bg-rose-50/20 dark:bg-rose-950/10">
                          {row.totalAlpha}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Table Footer Summary & Pagination */}
            <div className="p-3 bg-slate-50/70 dark:bg-zinc-900/50 border-t border-slate-200/80 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-zinc-400">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-700 dark:text-zinc-300">
                  Menampilkan {filteredRows.length > 0 ? (validCurrentPage - 1) * pageSize + 1 : 0} - {Math.min(validCurrentPage * pageSize, filteredRows.length)} dari {filteredRows.length} pegawai
                </span>
                <span className="text-slate-300 dark:text-zinc-700">·</span>
                <span>Periode: {BULAN_NAMES[bulan - 1]} {tahun}</span>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-3 flex-wrap justify-end">
                {/* Page Size Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">Per hal:</span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(val) => {
                      setPageSize(Number(val))
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="h-7 w-[70px] text-xs bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700">
                      <SelectValue placeholder="15" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0 bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700"
                    onClick={() => setCurrentPage(1)}
                    disabled={validCurrentPage <= 1}
                    title="Halaman Pertama"
                  >
                    <ChevronsLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 flex items-center gap-1"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={validCurrentPage <= 1}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Sebelumnya</span>
                  </Button>

                  <div className="px-2 text-xs font-semibold text-slate-700 dark:text-zinc-200">
                    {validCurrentPage} / {totalPages}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 flex items-center gap-1"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={validCurrentPage >= totalPages}
                  >
                    <span className="hidden sm:inline">Selanjutnya</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0 bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={validCurrentPage >= totalPages}
                    title="Halaman Terakhir"
                  >
                    <ChevronsRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* ── 6. CELL DETAIL MODAL ── */}
          <Dialog open={!!selectedCell} onOpenChange={() => setSelectedCell(null)}>
            <DialogContent className="max-w-md rounded-xl bg-white dark:bg-[#111113] border-slate-200 dark:border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  Rincian Presensi Harian
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400">
                  Tanggal {selectedCell?.dayStatus.day} {BULAN_NAMES[bulan - 1]} {tahun}
                </DialogDescription>
              </DialogHeader>

              {selectedCell && (
                <div className="space-y-3.5 py-2">
                  {/* Pegawai Info Box */}
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                        {selectedCell.pegawai.nama}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300">
                        {selectedCell.pegawai.nik}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 flex-wrap">
                      <span>{selectedCell.pegawai.jabatan}</span>
                      <span>·</span>
                      <span className="font-medium text-slate-700 dark:text-zinc-300">
                        {selectedCell.pegawai.departemen}
                      </span>
                      <span>·</span>
                      <span>{selectedCell.pegawai.cabang}</span>
                    </div>
                  </div>

                  {/* Status Box */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Status Presensi
                      </span>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={cn(
                            "w-6 h-6 rounded-[4px] text-xs font-mono font-semibold flex items-center justify-center shrink-0",
                            selectedCell.dayStatus.code === "H" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
                            selectedCell.dayStatus.code === "T" && "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
                            selectedCell.dayStatus.code === "C" && "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
                            selectedCell.dayStatus.code === "I" && "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
                            selectedCell.dayStatus.code === "S" && "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
                            selectedCell.dayStatus.code === "L" && "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400",
                            selectedCell.dayStatus.code === "A" && "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                          )}
                        >
                          {selectedCell.dayStatus.code}
                        </span>
                        <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                          {selectedCell.dayStatus.statusLabel}
                        </span>
                      </div>
                    </div>

                  {/* Sesi Jam Presensi 3 Sesi (Pagi, Absen Siang, Sore) */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                      Catatan Jam Presensi (WITA)
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-center">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Pagi (Masuk)</span>
                        <span className="text-xs font-bold font-mono text-slate-800 dark:text-zinc-200 tabular-nums mt-0.5 block">
                          {selectedCell.dayStatus.jamMasuk ? `${selectedCell.dayStatus.jamMasuk} WITA` : "—"}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-center">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Absen Siang</span>
                        <span className="text-xs font-bold font-mono text-slate-800 dark:text-zinc-200 tabular-nums mt-0.5 block">
                          {selectedCell.dayStatus.jamSiang ? `${selectedCell.dayStatus.jamSiang} WITA` : "—"}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-center">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Sore (Pulang)</span>
                        <span className="text-xs font-bold font-mono text-slate-800 dark:text-zinc-200 tabular-nums mt-0.5 block">
                          {selectedCell.dayStatus.jamKeluar ? `${selectedCell.dayStatus.jamKeluar} WITA` : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                  </div>

                  {/* Keterangan */}
                  {selectedCell.dayStatus.keterangan && (
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
                        Keterangan / Alasan
                      </span>
                      <p className="text-xs text-slate-700 dark:text-zinc-300">
                        {selectedCell.dayStatus.keterangan}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCell(null)}
                  className="rounded-lg text-xs h-9"
                >
                  Tutup
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ── 7. AUTO-FILL CONFIRMATION MODAL ── */}
          <Dialog open={showAutoFillDialog} onOpenChange={setShowAutoFillDialog}>
            <DialogContent className="max-w-md rounded-xl bg-white dark:bg-[#111113] border-slate-200 dark:border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  Isi Otomatis Sisa Hari (Hadir)
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400">
                  {BULAN_NAMES[bulan - 1]} {tahun}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2 text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
                <p>
                  Tindakan ini akan <strong>mengisi presensi Hadir (H)</strong> secara otomatis pada semua hari kerja yang masih kosong di bulan <strong>{BULAN_NAMES[bulan - 1]} {tahun}</strong> untuk seluruh pegawai aktif.
                </p>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 space-y-1 text-[11px]">
                  <p className="font-semibold flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Catatan penting:
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-500 dark:text-zinc-400">
                    <li>Hari libur akhir pekan (Sabtu/Minggu) tidak akan diisi.</li>
                    <li>Pegawai yang sudah memiliki absensi atau cuti disetujui tidak akan ditimpa.</li>
                  </ul>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAutoFillDialog(false)}
                  disabled={isAutoFilling}
                  className="rounded-lg text-xs h-9"
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmAutoFill}
                  disabled={isAutoFilling}
                  className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg text-xs font-semibold h-9 px-4"
                >
                  {isAutoFilling ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1.5" />
                      Ya, Isi Otomatis Sekarang
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </main>
      </div>
    </div>
  )
}
