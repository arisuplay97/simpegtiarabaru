"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  Filter,
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingUp,
  Send,
  Eye,
  MoreHorizontal,
  RefreshCw,
  ArrowUpRight,
  Wallet,
  Users,
  Printer,
  Building2,
  ChevronRight,
  Calculator,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { getKGBData, ajukanKGB, updateStatusKGB } from "@/lib/actions/kgb"
import { CetakSKKGBModal } from "@/components/simpeg/cetak-sk-kgb-modal"

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function KGBPage() {
  const { data: session } = useSession()
  const userRole = session?.user?.role || ""
  const isHRD = userRole === "HRD" || userRole === "SUPERADMIN" || userRole === "DIREKSI"

  const [eligibleList, setEligibleList] = useState<any[]>([])
  const [riwayatList, setRiwayatList] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [activeTab, setActiveTab] = useState("eligible")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterUnit, setFilterUnit] = useState("all")
  const [filterUrgensi, setFilterUrgensi] = useState("all")

  // Modal states
  const [showAjukanDialog, setShowAjukanDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showCetakModal, setShowCetakModal] = useState(false)
  const [selectedPegawai, setSelectedPegawai] = useState<any>(null)
  const [reviewCatatan, setReviewCatatan] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Ajukan Form
  const [ajukanForm, setAjukanForm] = useState({
    nomorSurat: "",
    tanggalBerlaku: "",
    gajiPokokLama: 0,
    gajiPokokBaru: 0,
    persentaseCustom: 4.5,
    catatan: "",
  })

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const { eligible, riwayat } = await getKGBData()
      setEligibleList(eligible || [])
      setRiwayatList(riwayat || [])
    } catch (e) {
      toast.error("Gagal memuat data Kenaikan Gaji Berkala")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Extract unique units for filter dropdown
  const uniqueUnits = useMemo(() => {
    const units = new Set<string>()
    eligibleList.forEach((e) => e.unit && units.add(e.unit))
    riwayatList.forEach((r) => r.unit && units.add(r.unit))
    return Array.from(units)
  }, [eligibleList, riwayatList])

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const siapDiproses = eligibleList.length
    const segeraEligible = eligibleList.filter((e) => e.sisaHari > 0 && e.sisaHari <= 60).length
    const pendingApproval = riwayatList.filter((r) => r.status === "PENDING").length
    const totalEstimasiBeban = eligibleList.reduce((acc, curr) => acc + (curr.kenaikan || 0), 0)

    return {
      siapDiproses,
      segeraEligible,
      pendingApproval,
      totalEstimasiBeban,
    }
  }, [eligibleList, riwayatList])

  // Filtered Eligible
  const filteredEligible = useMemo(() => {
    return eligibleList.filter((item) => {
      const matchSearch =
        item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nik.includes(searchQuery) ||
        (item.jabatan && item.jabatan.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchUnit = filterUnit === "all" || item.unit === filterUnit

      let matchUrgensi = true
      if (filterUrgensi === "overdue") {
        matchUrgensi = item.sisaHari < 0
      } else if (filterUrgensi === "soon") {
        matchUrgensi = item.sisaHari >= 0 && item.sisaHari <= 30
      }

      return matchSearch && matchUnit && matchUrgensi
    })
  }, [eligibleList, searchQuery, filterUnit, filterUrgensi])

  // Filtered Riwayat
  const filteredRiwayat = useMemo(() => {
    return riwayatList.filter((item) => {
      const matchSearch =
        item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nik.includes(searchQuery) ||
        (item.jabatan && item.jabatan.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchUnit = filterUnit === "all" || item.unit === filterUnit
      return matchSearch && matchUnit
    })
  }, [riwayatList, searchQuery, filterUnit])

  const handleAjukanClick = (pegawai: any) => {
    setSelectedPegawai(pegawai)
    const nomorAuto = `823.3/KGB-${pegawai.nik.slice(-4)}/PDAM/${new Date().getFullYear()}`
    setAjukanForm({
      nomorSurat: nomorAuto,
      tanggalBerlaku: pegawai.eligibleDate,
      gajiPokokLama: pegawai.gajiPokokSaatIni,
      gajiPokokBaru: pegawai.gajiPokokBaru,
      persentaseCustom: pegawai.persentase || 4.5,
      catatan: "",
    })
    setShowAjukanDialog(true)
  }

  const handlePersentaseChange = (pct: number) => {
    const baru = Math.round(ajukanForm.gajiPokokLama * (1 + pct / 100))
    setAjukanForm((prev) => ({
      ...prev,
      persentaseCustom: pct,
      gajiPokokBaru: baru,
    }))
  }

  const handleGajiBaruManual = (nominal: number) => {
    const pct = ajukanForm.gajiPokokLama > 0
      ? Number((((nominal - ajukanForm.gajiPokokLama) / ajukanForm.gajiPokokLama) * 100).toFixed(2))
      : 0
    setAjukanForm((prev) => ({
      ...prev,
      gajiPokokBaru: nominal,
      persentaseCustom: pct,
    }))
  }

  const submitKGB = async () => {
    if (!selectedPegawai) return
    setIsSubmitting(true)
    try {
      const res = await ajukanKGB({
        pegawaiId: selectedPegawai.pegawaiId,
        tanggalBerlaku: ajukanForm.tanggalBerlaku,
        gajiPokokLama: ajukanForm.gajiPokokLama,
        gajiPokokBaru: ajukanForm.gajiPokokBaru,
        catatan: ajukanForm.catatan,
        nomorSurat: ajukanForm.nomorSurat,
      })
      if (res.error) throw new Error(res.error)

      toast.success("Pengajuan KGB berhasil dikirim dan menunggu persetujuan.")
      setShowAjukanDialog(false)
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Gagal mengajukan KGB")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusUpdate = async (id: string, isApprove: boolean) => {
    setIsSubmitting(true)
    try {
      const res = await updateStatusKGB(id, isApprove, reviewCatatan)
      if (res.error) throw new Error(res.error)

      toast.success(`Pengajuan KGB berhasil ${isApprove ? "disetujui" : "ditolak"}`)
      fetchData()
      setShowDetailDialog(false)
      setReviewCatatan("")
    } catch (e: any) {
      toast.error(e.message || "Gagal memproses KGB")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Export to clean CSV with UTF-8 BOM
  const handleExportCSV = () => {
    try {
      const dataToExport = activeTab === "eligible" ? filteredEligible : filteredRiwayat
      if (dataToExport.length === 0) {
        toast.info("Tidak ada data untuk diekspor")
        return
      }

      let csvContent = "\uFEFF" // UTF-8 BOM

      if (activeTab === "eligible") {
        csvContent += "NIK,Nama Pegawai,Jabatan,Unit Kerja,Golongan,TMT Gaji Terakhir,TMT Eligible KGB,Masa Kerja,Gaji Pokok Lama,Gaji Pokok Baru,Kenaikan,Sisa Hari\n"
        dataToExport.forEach((item: any) => {
          csvContent += `"${item.nik}","${item.nama}","${item.jabatan}","${item.unit}","${item.golongan}","${item.tmtGajiTerakhir}","${item.eligibleDate}","${item.mkg} Thn",${item.gajiPokokSaatIni},${item.gajiPokokBaru},${item.kenaikan},${item.sisaHari}\n`
        })
      } else {
        csvContent += "NIK,Nama Pegawai,Jabatan,Unit Kerja,Golongan,Tanggal Pengajuan,TMT Baru,Gaji Pokok Lama,Gaji Pokok Baru,Selisih,Status,Catatan\n"
        dataToExport.forEach((item: any) => {
          csvContent += `"${item.nik}","${item.nama}","${item.jabatan}","${item.unit}","${item.golongan}","${item.tanggalPengajuan}","${item.tmtBaru}",${item.gajiLama},${item.gajiBaru},${item.selisih},"${item.status}","${(item.keterangan || "").replace(/"/g, '""')}"\n`
        })
      }

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `Laporan_KGB_${activeTab}_${new Date().toISOString().split("T")[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success("Laporan KGB berhasil diunduh")
    } catch (err) {
      toast.error("Gagal mengekspor laporan")
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
          <TopBar breadcrumb={["Remunerasi", "Kenaikan Gaji Berkala"]} />
          <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">

              {/* Page Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Kenaikan Gaji Berkala (KGB)
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                    Monitoring siklus 2 tahunan remunerasi berkala, pengusulan SK, dan analisis beban anggaran
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

              {/* 4 KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Eligible Siap Proses */}
                <Card className="border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Eligible Siap Proses
                      </p>
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Users className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
                        {isLoading ? "-" : summaryMetrics.siapDiproses}
                      </h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400">pegawai</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Memenuhi syarat siklus 2 tahunan
                    </p>
                  </CardContent>
                </Card>

                {/* Card 2: Segera Eligible */}
                <Card className="border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Segera Eligible
                      </p>
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Calendar className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
                        {isLoading ? "-" : summaryMetrics.segeraEligible}
                      </h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400">dalam 60 hari</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Dapat mulai disiapkan administrasinya
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
                        {isLoading ? "-" : summaryMetrics.pendingApproval}
                      </h3>
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">pending</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Menunggu verifikasi Direksi / HRD
                    </p>
                  </CardContent>
                </Card>

                {/* Card 4: Estimasi Beban Anggaran */}
                <Card className="border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Est. Delta Anggaran
                      </p>
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <Wallet className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <h3 className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
                        {isLoading ? "-" : formatCurrency(summaryMetrics.totalEstimasiBeban)}
                      </h3>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">/bulan</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Total kenaikan gaji pokok eligible
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content Tabs & Filters */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 mb-4">
                  <TabsList className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl h-auto self-start">
                    <TabsTrigger
                      value="eligible"
                      className="py-2 px-4 rounded-lg text-xs font-semibold data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-slate-100 dark:data-[state=active]:text-slate-900 transition-all"
                    >
                      <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                      Eligible KGB ({eligibleList.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="riwayat"
                      className="py-2 px-4 rounded-lg text-xs font-semibold data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:data-[state=active]:bg-slate-100 dark:data-[state=active]:text-slate-900 transition-all"
                    >
                      <FileText className="w-3.5 h-3.5 mr-1.5" />
                      Pengajuan & Riwayat ({riwayatList.length})
                    </TabsTrigger>
                  </TabsList>

                  {/* Filter Controls */}
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

                    {/* Urgensi Filter (Only on Eligible tab) */}
                    {activeTab === "eligible" && (
                      <Select value={filterUrgensi} onValueChange={setFilterUrgensi}>
                        <SelectTrigger className="w-[140px] sm:w-[160px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs h-9">
                          <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                          <SelectValue placeholder="Urgensi" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs">
                          <SelectItem value="all">Semua Jadwal</SelectItem>
                          <SelectItem value="overdue">Sudah Lewat (Overdue)</SelectItem>
                          <SelectItem value="soon">Segera (&lt; 30 Hari)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}

                    {/* Search Input */}
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        placeholder="Cari NIK, nama, jabatan..."
                        className="pl-9 h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* TAB 1: ELIGIBLE KGB */}
                <TabsContent value="eligible" className="m-0 focus-visible:outline-none">
                  <Card className="border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[260px] text-xs font-semibold text-slate-600 dark:text-slate-300">Pegawai</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 dark:text-slate-300">Jabatan & Unit</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 dark:text-slate-300">TMT & Jadwal KGB</TableHead>
                            <TableHead className="text-right text-xs font-semibold text-slate-600 dark:text-slate-300">Gaji Pokok Lama</TableHead>
                            <TableHead className="text-right text-xs font-semibold text-slate-600 dark:text-slate-300">Usulan Gaji Baru</TableHead>
                            <TableHead className="text-center text-xs font-semibold text-slate-600 dark:text-slate-300 w-[110px]">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isLoading ? (
                            <TableRow>
                              <TableCell colSpan={6} className="h-36 text-center text-slate-400 text-xs">
                                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                                Memuat data eligibilitas KGB...
                              </TableCell>
                            </TableRow>
                          ) : filteredEligible.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="h-36 text-center text-slate-400 text-xs">
                                <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                                Tidak ada data pegawai yang memenuhi kriteria filter KGB saat ini.
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
                                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{pegawai.nik}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{pegawai.jabatan}</p>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{pegawai.unit} • Gol {pegawai.golongan}</p>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{pegawai.eligibleDate}</p>
                                      {pegawai.sisaHari < 0 ? (
                                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 mt-0.5">
                                          Terlewat {Math.abs(pegawai.sisaHari)} hari
                                        </Badge>
                                      ) : (
                                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                          Dalam {pegawai.sisaHari} hari
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                                    {formatCurrency(pegawai.gajiPokokSaatIni)}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex flex-col items-end">
                                    <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                                      {formatCurrency(pegawai.gajiPokokBaru)}
                                    </span>
                                    <span className="text-[10px] text-emerald-600/90 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded mt-0.5 font-medium">
                                      +{formatCurrency(pegawai.kenaikan)} (+{pegawai.persentase}%)
                                    </span>
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
                                    Ajukan
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
                <TabsContent value="riwayat" className="m-0 focus-visible:outline-none">
                  <Card className="border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[240px] text-xs font-semibold text-slate-600 dark:text-slate-300">Pegawai</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 dark:text-slate-300">Tgl Pengajuan</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 dark:text-slate-300">TMT Baru</TableHead>
                            <TableHead className="text-right text-xs font-semibold text-slate-600 dark:text-slate-300">Gaji Pokok Baru</TableHead>
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
                                Belum ada riwayat pengajuan KGB.
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredRiwayat.map((riwayat) => (
                              <TableRow key={riwayat.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/50">
                                <TableCell>
                                  <div className="flex items-center gap-2.5">
                                    <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-700">
                                      <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px] font-semibold">
                                        {(riwayat.nama || "P").substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">{riwayat.nama}</p>
                                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{riwayat.nik} • {riwayat.unit}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <p className="text-xs text-slate-700 dark:text-slate-300">{riwayat.tanggalPengajuan}</p>
                                </TableCell>
                                <TableCell>
                                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{riwayat.tmtBaru}</p>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex flex-col items-end">
                                    <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                                      {formatCurrency(riwayat.gajiBaru)}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      +{formatCurrency(riwayat.selisih)}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  {getStatusBadge(riwayat.status)}
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
                                          setSelectedPegawai(riwayat)
                                          setShowDetailDialog(true)
                                        }}
                                        className="cursor-pointer"
                                      >
                                        <Eye className="w-3.5 h-3.5 mr-2" /> Detail Pengajuan
                                      </DropdownMenuItem>
                                      {riwayat.status === "APPROVED" && (
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setSelectedPegawai(riwayat)
                                            setShowCetakModal(true)
                                          }}
                                          className="cursor-pointer text-emerald-600 dark:text-emerald-400 font-medium"
                                        >
                                          <Printer className="w-3.5 h-3.5 mr-2" /> Cetak SK KGB
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

      {/* DIALOG: AJUKAN KGB */}
      <Dialog open={showAjukanDialog} onOpenChange={setShowAjukanDialog}>
        <DialogContent className="sm:max-w-[580px] p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
          <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Usulkan Kenaikan Gaji Berkala
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Formulir verifikasi penyesuaian gaji berkala untuk <strong className="text-slate-800 dark:text-slate-200">{selectedPegawai?.nama}</strong> ({selectedPegawai?.nik})
            </DialogDescription>
          </div>

          <div className="px-6 py-5 space-y-5">
            {/* Side by side comparison */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Kondisi Saat Ini</p>
                <div className="space-y-1.5">
                  <div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Masa Kerja (MKG)</p>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{selectedPegawai?.mkg} Tahun</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Gaji Pokok</p>
                    <p className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">{formatCurrency(selectedPegawai?.gajiPokokSaatIni || 0)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl p-3.5">
                <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">Usulan KGB Baru</p>
                <div className="space-y-1.5">
                  <div>
                    <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">Masa Kerja Baru</p>
                    <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">{selectedPegawai?.mkgBaru} Tahun</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">Gaji Pokok Baru</p>
                    <p className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400">{formatCurrency(ajukanForm.gajiPokokBaru)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Calculator Slider / Presets */}
            <div className="space-y-2 bg-slate-50/80 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-slate-400" />
                  Penyesuaian Nominal Baru
                </Label>
                <div className="flex items-center gap-1.5">
                  {[3.5, 4.5, 5.0, 6.0].map((pct) => (
                    <Button
                      key={pct}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handlePersentaseChange(pct)}
                      className={`h-6 px-2 text-[10px] font-mono ${
                        ajukanForm.persentaseCustom === pct
                          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                          : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      +{pct}%
                    </Button>
                  ))}
                </div>
              </div>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 font-mono">Rp</span>
                <Input
                  type="number"
                  className="pl-9 h-9 text-xs font-mono font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  value={ajukanForm.gajiPokokBaru}
                  onChange={(e) => handleGajiBaruManual(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Dates & Reference */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="tmt-date" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  TMT Berlaku KGB Baru
                </Label>
                <Input
                  id="tmt-date"
                  type="date"
                  className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  value={ajukanForm.tanggalBerlaku}
                  onChange={(e) => setAjukanForm({ ...ajukanForm, tanggalBerlaku: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="no-surat" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Nomor Surat Pengantar
                </Label>
                <Input
                  id="no-surat"
                  className="h-9 text-xs font-mono bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  value={ajukanForm.nomorSurat}
                  onChange={(e) => setAjukanForm({ ...ajukanForm, nomorSurat: e.target.value })}
                />
              </div>
            </div>

            {/* Catatan */}
            <div className="space-y-1.5">
              <Label htmlFor="catatan" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Catatan Rekomendasi (Opsional)
              </Label>
              <Textarea
                id="catatan"
                placeholder="Catatan prestasi kerja, rekomendasi pimpinan unit..."
                className="min-h-[70px] text-xs resize-none bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                value={ajukanForm.catatan}
                onChange={(e) => setAjukanForm({ ...ajukanForm, catatan: e.target.value })}
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
              onClick={submitKGB}
              disabled={isSubmitting}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-medium"
            >
              {isSubmitting ? "Memproses..." : "Ajukan & Simpan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG: DETAIL & APPROVAL */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
          <DialogHeader className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              Detail Pengajuan KGB
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Tinjauan usulan kenaikan gaji berkala pegawai untuk persetujuan pimpinan.
            </DialogDescription>
          </DialogHeader>

          {selectedPegawai && (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{selectedPegawai.nama}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {selectedPegawai.nik} • {selectedPegawai.unit} • Gol {selectedPegawai.golongan}
                  </p>
                </div>
                {getStatusBadge(selectedPegawai.status)}
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">Tanggal Pengajuan</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedPegawai.tanggalPengajuan}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">TMT Mulai Berlaku</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedPegawai.tmtBaru}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">Gaji Pokok Lama</p>
                  <p className="font-mono text-slate-700 dark:text-slate-300 mt-0.5">{formatCurrency(selectedPegawai.gajiLama)}</p>
                </div>
                <div>
                  <p className="text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">Gaji Pokok Baru</p>
                  <p className="font-mono font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">{formatCurrency(selectedPegawai.gajiBaru)}</p>
                </div>
              </div>

              {selectedPegawai.keterangan && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mb-0.5">Catatan / Referensi:</p>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{selectedPegawai.keterangan}</p>
                </div>
              )}

              {/* Review input for pending state */}
              {selectedPegawai.status === "PENDING" && isHRD && (
                <div className="space-y-1.5 pt-1">
                  <Label htmlFor="review-note" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Catatan Review Direksi (Opsional)
                  </Label>
                  <Input
                    id="review-note"
                    placeholder="Alasan persetujuan atau penolakan..."
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
                  Tolak KGB
                </Button>
                <Button
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => handleStatusUpdate(selectedPegawai.id, true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Setujui KGB
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
                Cetak SK KGB
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL CETAK SK KGB */}
      <CetakSKKGBModal
        open={showCetakModal}
        onOpenChange={setShowCetakModal}
        data={selectedPegawai}
      />
    </>
  )
}
