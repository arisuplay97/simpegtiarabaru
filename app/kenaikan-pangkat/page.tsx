"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Search,
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  TrendingUp,
  Send,
  Eye,
  MoreHorizontal,
  RefreshCw,
  Award,
  Building2,
  Filter,
  ArrowRight,
  Printer,
  Sparkles,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { getPangkatData, ajukanPangkat, updateStatusPangkat } from "@/lib/actions/pangkat"
import { daftarPangkat } from "@/lib/constants/pangkat"
import { CetakSKPangkatModal } from "@/components/simpeg/cetak-sk-pangkat-modal"

export default function KenaikanPangkatPage() {
  const { data: session } = useSession()
  const userRole = session?.user?.role || ""
  const isHRD = userRole === "HRD" || userRole === "SUPERADMIN" || userRole === "DIREKSI"

  const [activeTab, setActiveTab] = useState("eligible")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterUnit, setFilterUnit] = useState("all")
  const [filterGolongan, setFilterGolongan] = useState("all")

  const [eligibleList, setEligibleList] = useState<any[]>([])
  const [riwayatList, setRiwayatList] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modal states
  const [showAjukanDialog, setShowAjukanDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showCetakModal, setShowCetakModal] = useState(false)
  const [selectedPegawai, setSelectedPegawai] = useState<any>(null)
  const [reviewCatatan, setReviewCatatan] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Ajukan Form
  const [ajukanForm, setAjukanForm] = useState({
    pangkatBaru: "",
    golonganBaru: "",
    tanggalBerlaku: "",
    keterangan: "",
  })

  // Load data
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const { eligible, riwayat } = await getPangkatData()
      setEligibleList(eligible || [])
      setRiwayatList(riwayat || [])
    } catch (e) {
      toast.error("Gagal memuat data Kenaikan Pangkat")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Extract unique units for filter
  const uniqueUnits = useMemo(() => {
    const units = new Set<string>()
    eligibleList.forEach((e) => e?.unit && units.add(e.unit))
    riwayatList.forEach((r) => r?.unit && units.add(r.unit))
    return Array.from(units)
  }, [eligibleList, riwayatList])

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const eligibleCount = eligibleList.length
    const pendingCount = riwayatList.filter((r) => r?.status === "PENDING").length
    const approvedCount = riwayatList.filter((r) => r?.status === "APPROVED").length
    const soonCount = eligibleList.filter((e) => (e?.sisaHari ?? 0) > 0 && (e?.sisaHari ?? 0) <= 90).length

    return {
      eligibleCount,
      pendingCount,
      approvedCount,
      soonCount,
    }
  }, [eligibleList, riwayatList])

  // Filtered Eligible
  const filteredEligible = useMemo(() => {
    return eligibleList.filter((item) => {
      if (!item) return false
      const nama = (item.nama || "").toLowerCase()
      const nik = item.nik || ""
      const jabatan = (item.jabatan || "").toLowerCase()
      const q = searchTerm.toLowerCase()

      const matchSearch = !q || nama.includes(q) || nik.includes(q) || jabatan.includes(q)
      const matchUnit = filterUnit === "all" || item.unit === filterUnit

      let matchGol = true
      if (filterGolongan !== "all") {
        matchGol = Boolean(item.golonganSaatIni && item.golonganSaatIni.includes(filterGolongan))
      }

      return matchSearch && matchUnit && matchGol
    })
  }, [eligibleList, searchTerm, filterUnit, filterGolongan])

  // Filtered Riwayat
  const filteredRiwayat = useMemo(() => {
    return riwayatList.filter((item) => {
      if (!item) return false
      const nama = (item.nama || "").toLowerCase()
      const nik = item.nik || ""
      const jabatan = (item.jabatan || "").toLowerCase()
      const q = searchTerm.toLowerCase()

      const matchSearch = !q || nama.includes(q) || nik.includes(q) || jabatan.includes(q)
      const matchUnit = filterUnit === "all" || item.unit === filterUnit
      return matchSearch && matchUnit
    })
  }, [riwayatList, searchTerm, filterUnit])

  const handleAjukanClick = (pegawai: any) => {
    setSelectedPegawai(pegawai)
    setAjukanForm({
      pangkatBaru: pegawai.pangkatBaru,
      golonganBaru: pegawai.golonganBaru,
      tanggalBerlaku: pegawai.eligibleDate,
      keterangan: "",
    })
    setShowAjukanDialog(true)
  }

  const handleSelectPangkatTarget = (pangkatIdStr: string) => {
    const found = daftarPangkat.find((p) => p.id.toString() === pangkatIdStr)
    if (found) {
      setAjukanForm((prev) => ({
        ...prev,
        pangkatBaru: found.nama,
        golonganBaru: found.golongan,
      }))
    }
  }

  const submitPengajuan = async () => {
    if (!selectedPegawai) return
    setIsSubmitting(true)
    try {
      const payload = {
        pegawaiId: selectedPegawai.pegawaiId,
        tanggalBerlaku: ajukanForm.tanggalBerlaku,
        pangkatLama: selectedPegawai.pangkatSaatIni,
        golonganLama: selectedPegawai.golonganSaatIni,
        pangkatBaru: ajukanForm.pangkatBaru,
        golonganBaru: ajukanForm.golonganBaru,
        keterangan: ajukanForm.keterangan || undefined,
      }

      const res = await ajukanPangkat(payload)
      if (res.error) throw new Error(res.error)

      toast.success("Pengajuan Kenaikan Pangkat berhasil disimpan untuk diproses Direksi.")
      setShowAjukanDialog(false)
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Gagal mengajukan kenaikan pangkat")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusUpdate = async (id: string, isApprove: boolean) => {
    setIsSubmitting(true)
    try {
      const res = await updateStatusPangkat(id, isApprove, reviewCatatan)
      if (res.error) throw new Error(res.error)

      toast.success(`Pengajuan pangkat berhasil ${isApprove ? "disetujui" : "ditolak"}.`)
      fetchData()
      setShowDetailDialog(false)
      setReviewCatatan("")
    } catch (e: any) {
      toast.error(e.message || "Gagal memproses pengajuan pangkat")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Export CSV
  const handleExportCSV = () => {
    try {
      const dataToExport = activeTab === "eligible" ? filteredEligible : filteredRiwayat
      if (dataToExport.length === 0) {
        toast.info("Tidak ada data untuk diekspor")
        return
      }

      let csvContent = "\uFEFF" // UTF-8 BOM

      if (activeTab === "eligible") {
        csvContent += "NIK,Nama Pegawai,Jabatan,Unit Kerja,Pangkat Saat Ini,Golongan Saat Ini,Pangkat Usulan,Golongan Usulan,TMT Pangkat Terakhir,TMT Eligible,Masa Kerja\n"
        dataToExport.forEach((item: any) => {
          csvContent += `"${item.nik}","${item.nama}","${item.jabatan}","${item.unit}","${item.pangkatSaatIni}","${item.golonganSaatIni}","${item.pangkatBaru}","${item.golonganBaru}","${item.tmtPangkat}","${item.eligibleDate}","${item.masaKerja}"\n`
        })
      } else {
        csvContent += "NIK,Nama Pegawai,Jabatan,Unit Kerja,Pangkat Lama,Golongan Lama,Pangkat Baru,Golongan Baru,Tanggal Pengajuan,TMT Baru,Status,Catatan\n"
        dataToExport.forEach((item: any) => {
          csvContent += `"${item.nik}","${item.nama}","${item.jabatan}","${item.unit}","${item.pangkatLama}","${item.golonganLama}","${item.pangkatBaru}","${item.golonganBaru}","${item.tanggalPengajuan}","${item.tmtBaru}","${item.status}","${(item.keterangan || "").replace(/"/g, '""')}"\n`
        })
      }

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `Laporan_Kenaikan_Pangkat_${activeTab}_${new Date().toISOString().split("T")[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success("Laporan Kenaikan Pangkat berhasil diunduh")
    } catch (err) {
      toast.error("Gagal mengekspor data")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 font-medium">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Disetujui
          </Badge>
        )
      case "REJECTED":
        return (
          <Badge className="bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 font-medium">
            <XCircle className="w-3 h-3 mr-1" /> Ditolak
          </Badge>
        )
      case "PENDING":
        return (
          <Badge className="bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 font-medium">
            <Clock className="w-3 h-3 mr-1" /> Menunggu Review
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <>
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <SidebarNav />
        <div className="flex flex-1 flex-col sidebar-offset">
          <TopBar breadcrumb={["Karier & Kinerja", "Kenaikan Pangkat"]} />
          <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">

              {/* Page Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Kenaikan Pangkat Reguler
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                    Pengelolaan usulan kenaikan pangkat siklus 4 tahunan, penyesuaian ijazah, dan penerbitan SK Direksi
                  </p>
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={fetchData}
                    disabled={isLoading}
                    className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                  <Button
                    onClick={handleExportCSV}
                    className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-medium shadow-sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Laporan
                  </Button>
                </div>
              </div>

              {/* 4 Strategic KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Eligible Pangkat */}
                <Card className="border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Eligible Pangkat
                      </p>
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Award className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
                        {isLoading ? "-" : summaryMetrics.eligibleCount}
                      </h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400">pegawai</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Masa kerja &ge; 4 tahun di pangkat terakhir
                    </p>
                  </CardContent>
                </Card>

                {/* Card 2: Mendekati Waktu */}
                <Card className="border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Mendekati Waktu
                      </p>
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Calendar className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
                        {isLoading ? "-" : summaryMetrics.soonCount}
                      </h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400">dalam 90 hari</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Siap pemberkasan usulan ke Direksi
                    </p>
                  </CardContent>
                </Card>

                {/* Card 3: Menunggu Persetujuan */}
                <Card className="border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Menunggu Persetujuan
                      </p>
                      <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <Clock className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
                        {isLoading ? "-" : summaryMetrics.pendingCount}
                      </h3>
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">pending</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Usulan berkas masuk ke Direksi
                    </p>
                  </CardContent>
                </Card>

                {/* Card 4: SK Diterbitkan */}
                <Card className="border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        SK Diterbitkan (YTD)
                      </p>
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono text-emerald-600 dark:text-emerald-400">
                        {isLoading ? "-" : summaryMetrics.approvedCount}
                      </h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400">disetujui</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      SK penetapan kenaikan pangkat aktif
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs & Filter Bar */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 mb-4">
                  <TabsList className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl h-auto self-start">
                    <TabsTrigger
                      value="eligible"
                      className="py-2 px-4 rounded-lg text-xs font-semibold data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-slate-100 dark:data-[state=active]:text-slate-900 transition-all"
                    >
                      <Award className="w-3.5 h-3.5 mr-1.5" />
                      Daftar Eligible ({eligibleList.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="pengajuan"
                      className="py-2 px-4 rounded-lg text-xs font-semibold data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-slate-100 dark:data-[state=active]:text-slate-900 transition-all"
                    >
                      <FileText className="w-3.5 h-3.5 mr-1.5" />
                      Pengajuan & Riwayat ({riwayatList.length})
                    </TabsTrigger>
                  </TabsList>

                  {/* Filter controls */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
                    {/* Filter Unit */}
                    <Select value={filterUnit} onValueChange={setFilterUnit}>
                      <SelectTrigger className="w-[140px] sm:w-[160px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs h-9">
                        <Building2 className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        <SelectValue placeholder="Semua Unit" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs">
                        <SelectItem value="all">Semua Unit</SelectItem>
                        {uniqueUnits.map((u) => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Filter Golongan */}
                    <Select value={filterGolongan} onValueChange={setFilterGolongan}>
                      <SelectTrigger className="w-[130px] sm:w-[140px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs h-9">
                        <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        <SelectValue placeholder="Golongan" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs">
                        <SelectItem value="all">Semua Golongan</SelectItem>
                        <SelectItem value="I">Golongan I (Juru)</SelectItem>
                        <SelectItem value="II">Golongan II (Pengatur)</SelectItem>
                        <SelectItem value="III">Golongan III (Penata)</SelectItem>
                        <SelectItem value="IV">Golongan IV (Pembina)</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        placeholder="Cari NIK, nama, jabatan..."
                        className="pl-9 h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* TAB 1: ELIGIBLE PANGKAT */}
                <TabsContent value="eligible" className="m-0 focus-visible:outline-none">
                  <Card className="border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[260px] text-xs font-semibold text-slate-600 dark:text-slate-300">Pegawai</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 dark:text-slate-300">Pangkat Saat Ini</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 dark:text-slate-300">Target Usulan Pangkat</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 dark:text-slate-300">Masa Kerja & TMT</TableHead>
                            <TableHead className="text-center text-xs font-semibold text-slate-600 dark:text-slate-300 w-[110px]">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isLoading ? (
                            <TableRow>
                              <TableCell colSpan={5} className="h-36 text-center text-slate-400 text-xs">
                                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                                Memuat data eligibilitas pangkat...
                              </TableCell>
                            </TableRow>
                          ) : filteredEligible.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="h-36 text-center text-slate-400 text-xs">
                                <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                                Tidak ada data pegawai yang memenuhi syarat kenaikan pangkat reguler saat ini (minimal 4 tahun masa kerja).
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredEligible.map((pegawai) => (
                              <TableRow key={pegawai.pegawaiId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/50">
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 border border-slate-200 dark:border-slate-700">
                                      <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold">
                                        {(pegawai.nama || "P").substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">{pegawai.nama}</p>
                                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{pegawai.nik} • {pegawai.unit}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{pegawai.pangkatSaatIni}</p>
                                    <Badge variant="outline" className="mt-0.5 text-[10px] font-mono border-slate-300 dark:border-slate-700">
                                      {pegawai.golonganSaatIni}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <ArrowRight className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{pegawai.pangkatBaru}</p>
                                      <Badge className="mt-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 text-[10px] font-mono font-semibold">
                                        {pegawai.golonganBaru}
                                      </Badge>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-0.5">
                                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                      TMT: {pegawai.eligibleDate}
                                    </p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                      Masa kerja: <span className="font-semibold text-slate-700 dark:text-slate-300">{pegawai.masaKerja}</span>
                                    </p>
                                    {pegawai.sisaHari < 0 ? (
                                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 mt-0.5">
                                        Terlewat {Math.abs(pegawai.sisaHari)} hari
                                      </Badge>
                                    ) : (
                                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                        Tersisa {pegawai.sisaHari} hari
                                      </p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Button
                                    size="sm"
                                    onClick={() => handleAjukanClick(pegawai)}
                                    disabled={!isHRD}
                                    className="h-8 px-3 text-xs bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-medium shadow-sm"
                                  >
                                    <Send className="w-3.5 h-3.5 mr-1" />
                                    Usulkan
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                </TabsContent>

                {/* TAB 2: PROSES & RIWAYAT */}
                <TabsContent value="pengajuan" className="m-0 focus-visible:outline-none">
                  <Card className="border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[240px] text-xs font-semibold text-slate-600 dark:text-slate-300">Pegawai</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 dark:text-slate-300">Pangkat Lama</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 dark:text-slate-300">Usulan Pangkat Baru</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 dark:text-slate-300">Tgl & TMT</TableHead>
                            <TableHead className="text-center text-xs font-semibold text-slate-600 dark:text-slate-300">Status</TableHead>
                            <TableHead className="w-[60px] text-center text-xs font-semibold text-slate-600 dark:text-slate-300"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isLoading ? (
                            <TableRow>
                              <TableCell colSpan={6} className="h-36 text-center text-slate-400 text-xs">
                                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                                Memuat data riwayat...
                              </TableCell>
                            </TableRow>
                          ) : filteredRiwayat.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="h-36 text-center text-slate-400 text-xs">
                                <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                                Belum ada riwayat pengajuan kenaikan pangkat.
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredRiwayat.map((p) => (
                              <TableRow key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/50">
                                <TableCell>
                                  <div className="flex items-center gap-2.5">
                                    <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-700">
                                      <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px] font-semibold">
                                        {(p.nama || "P").substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">{p.nama}</p>
                                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{p.nik} • {p.unit}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{p.pangkatLama}</p>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{p.golonganLama}</p>
                                </TableCell>
                                <TableCell>
                                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{p.pangkatBaru}</p>
                                  <p className="text-[10px] text-emerald-600/90 dark:text-emerald-400 font-mono font-semibold">{p.golonganBaru}</p>
                                </TableCell>
                                <TableCell>
                                  <p className="text-xs text-slate-800 dark:text-slate-200">TMT: {p.tmtBaru}</p>
                                  <p className="text-[10px] text-slate-400">Diajukan: {p.tanggalPengajuan}</p>
                                </TableCell>
                                <TableCell className="text-center">
                                  {getStatusBadge(p.status)}
                                </TableCell>
                                <TableCell className="text-center">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs">
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedPegawai(p)
                                          setShowDetailDialog(true)
                                        }}
                                        className="cursor-pointer"
                                      >
                                        <Eye className="w-3.5 h-3.5 mr-2" /> Detail Pengajuan
                                      </DropdownMenuItem>
                                      {p.status === "APPROVED" && (
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setSelectedPegawai(p)
                                            setShowCetakModal(true)
                                          }}
                                          className="cursor-pointer text-emerald-600 dark:text-emerald-400 font-medium"
                                        >
                                          <Printer className="w-3.5 h-3.5 mr-2" /> Cetak SK Pangkat
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>

      {/* DIALOG: USULKAN PANGKAT */}
      <Dialog open={showAjukanDialog} onOpenChange={setShowAjukanDialog}>
        <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
          <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Award className="w-4 h-4 text-emerald-600" />
              Pengusulan Kenaikan Pangkat
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Usulkan penyesuaian pangkat reguler untuk pegawai <strong className="text-slate-800 dark:text-slate-200">{selectedPegawai?.nama}</strong>
            </DialogDescription>
          </div>

          <div className="px-6 py-5 space-y-4">
            {/* Visual Progression */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pangkat Saat Ini</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedPegawai?.pangkatSaatIni}</p>
                <Badge variant="outline" className="text-[10px] font-mono mt-1 border-slate-300 dark:border-slate-700">
                  {selectedPegawai?.golonganSaatIni}
                </Badge>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-500" />
              <div className="text-right">
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Usulan Pangkat Baru</p>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">{ajukanForm.pangkatBaru}</p>
                <Badge className="text-[10px] font-mono mt-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-none">
                  {ajukanForm.golonganBaru}
                </Badge>
              </div>
            </div>

            {/* Target Pangkat Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Pilih Jenjang Pangkat / Golongan Baru
              </Label>
              <Select
                value={daftarPangkat.find((p) => p.nama === ajukanForm.pangkatBaru)?.id.toString() || "1"}
                onValueChange={handleSelectPangkatTarget}
              >
                <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <SelectValue placeholder="Pilih Pangkat & Golongan" />
                </SelectTrigger>
                <SelectContent className="max-h-60 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs">
                  {daftarPangkat.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.nama} ({p.golongan})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* TMT Baru */}
            <div className="space-y-1.5">
              <Label htmlFor="tmt-pangkat" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Terhitung Mulai Tanggal (TMT) Baru
              </Label>
              <Input
                id="tmt-pangkat"
                type="date"
                className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                value={ajukanForm.tanggalBerlaku}
                onChange={(e) => setAjukanForm({ ...ajukanForm, tanggalBerlaku: e.target.value })}
              />
            </div>

            {/* Catatan / Dasar Usulan */}
            <div className="space-y-1.5">
              <Label htmlFor="catatan-pangkat" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Catatan Pengusulan / Nomor Rekomendasi
              </Label>
              <Textarea
                id="catatan-pangkat"
                placeholder="Rekomendasi kinerja, kelulusan penyesuaian ijazah, atau catatan prestasi..."
                className="min-h-[70px] text-xs resize-none bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                value={ajukanForm.keterangan}
                onChange={(e) => setAjukanForm({ ...ajukanForm, keterangan: e.target.value })}
              />
            </div>
          </div>

          <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAjukanDialog(false)}
              className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs"
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={submitPengajuan}
              disabled={isSubmitting}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-medium"
            >
              {isSubmitting ? "Memproses..." : "Ajukan Usulan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG: DETAIL & APPROVAL */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
          <DialogHeader className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              Validasi Kenaikan Pangkat Reguler
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Tinjauan usulan kenaikan pangkat untuk keputusan pengesahan SK Direksi.
            </DialogDescription>
          </DialogHeader>

          {selectedPegawai && (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{selectedPegawai.nama}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {selectedPegawai.nik} • {selectedPegawai.unit}
                  </p>
                </div>
                {getStatusBadge(selectedPegawai.status)}
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">Pangkat & Golongan Lama</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedPegawai.pangkatLama}</p>
                  <Badge variant="outline" className="text-[10px] font-mono mt-1 border-slate-300 dark:border-slate-700">
                    {selectedPegawai.golonganLama}
                  </Badge>
                </div>
                <div>
                  <p className="text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">Usulan Pangkat Baru</p>
                  <p className="font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">{selectedPegawai.pangkatBaru}</p>
                  <Badge className="text-[10px] font-mono mt-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-none">
                    {selectedPegawai.golonganBaru}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">Tanggal Pengajuan</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{selectedPegawai.tanggalPengajuan}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">TMT Berlaku Baru</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{selectedPegawai.tmtBaru}</p>
                </div>
              </div>

              {selectedPegawai.keterangan && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Catatan Pengusulan:</p>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{selectedPegawai.keterangan}</p>
                </div>
              )}

              {/* Review input */}
              {selectedPegawai.status === "PENDING" && isHRD && (
                <div className="space-y-1.5 pt-1">
                  <Label htmlFor="review-pangkat" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Catatan Keputusan Direksi (Opsional)
                  </Label>
                  <Input
                    id="review-pangkat"
                    placeholder="Nomor SK / Dasar persetujuan atau alasan penolakan..."
                    className="h-8 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    value={reviewCatatan}
                    onChange={(e) => setReviewCatatan(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetailDialog(false)}
              className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs"
            >
              Tutup
            </Button>
            {selectedPegawai?.status === "PENDING" && isHRD && (
              <>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => handleStatusUpdate(selectedPegawai.id, false)}
                  className="text-xs font-medium"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  Tolak Usulan
                </Button>
                <Button
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => handleStatusUpdate(selectedPegawai.id, true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Setujui & Terbitkan SK
                </Button>
              </>
            )}
            {selectedPegawai?.status === "APPROVED" && (
              <Button
                size="sm"
                onClick={() => {
                  setShowDetailDialog(false)
                  setShowCetakModal(true)
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                Cetak SK Pangkat
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL CETAK SK PANGKAT */}
      <CetakSKPangkatModal
        open={showCetakModal}
        onOpenChange={setShowCetakModal}
        data={selectedPegawai}
      />
    </>
  )
}
