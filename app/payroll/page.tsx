"use client"

import { useState, useEffect, useCallback } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  Download,
  Upload,
  Wallet,
  Calculator,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreHorizontal,
  Eye,
  Send,
  Printer,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  CreditCard,
  Building2,
  ChevronLeft,
  ChevronRight,
  Edit,
} from "lucide-react"
import Image from "next/image"
import { getPayrollList, savePayroll, processAllPayroll } from "@/lib/actions/payroll"

interface PayrollEmployee {
  pegawaiId: string
  nik: string
  nama: string
  unit: string
  golongan: string
  gajiPokok: number
  tunjangan: number
  potongan: number
  lembur: number
  gajiBersih: number
  status: string
  payrollId?: string
}

const statusConfig = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-700 border-gray-200" },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  posted: { label: "Posted", className: "bg-blue-100 text-blue-700 border-blue-200" },
  paid: { label: "Dibayar", className: "bg-primary/10 text-primary border-primary/20" },
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function PayrollPage() {
  const [data, setData] = useState<PayrollEmployee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedPeriod, setSelectedPeriod] = useState("mar-2026")
  
  const [showSlipDialog, setShowSlipDialog] = useState(false)
  const [showProcessDialog, setShowProcessDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  
  const [selectedEmployee, setSelectedEmployee] = useState<PayrollEmployee | null>(null)
  const [editForm, setEditForm] = useState({ 
    gajiPokok: 0, 
    tunjanganJabatan: 0, 
    tunjanganTransport: 0, 
    tunjanganMakan: 0, 
    tunjanganLainnya: 0,
    potonganBpjsKes: 0,
    potonganBpjsTk: 0,
    potonganKasbon: 0,
    potonganLainnya: 0
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [processProgress, setProcessProgress] = useState(0)
  
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getPayrollList(selectedPeriod)
      setData(res)
    } catch (e) {
      toast.error("Gagal memuat data payroll")
    } finally {
      setIsLoading(false)
    }
  }, [selectedPeriod])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-calculate BPJS when gajiPokok changes
  useEffect(() => {
    if (showEditDialog) {
      setEditForm(prev => ({
        ...prev,
        potonganBpjsKes: Math.round(prev.gajiPokok * 0.01),
        potonganBpjsTk: Math.round(prev.gajiPokok * 0.02)
      }))
    }
  }, [editForm.gajiPokok, showEditDialog])

  const filteredData = data.filter((emp) => {
    const matchesSearch =
      emp.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.nik.includes(searchQuery)
    const matchesStatus = statusFilter === "all" || emp.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleProcessPayroll = async () => {
    setShowProcessDialog(true)
    setIsProcessing(true)
    setProcessProgress(0)

    try {
      // Simulate progress bar visually while waiting for the server
      const interval = setInterval(() => {
        setProcessProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const result = await processAllPayroll(selectedPeriod)
      clearInterval(interval)
      
      if (result.error) throw new Error(result.error)
      
      setProcessProgress(100)
      setTimeout(() => {
        setIsProcessing(false)
        setShowProcessDialog(false)
        toast.success(`Payroll berhasil diproses untuk ${result.processedCount} pegawai periode ${selectedPeriod}`)
        fetchData()
      }, 1000)
    } catch (error: any) {
      setIsProcessing(false)
      setShowProcessDialog(false)
      toast.error(error.message || "Terjadi kesalahan saat memproses payroll")
    }
  }

  const handleViewSlip = (emp: PayrollEmployee) => {
    setSelectedEmployee(emp)
    setShowSlipDialog(true)
  }

  const handleEditSalary = (emp: PayrollEmployee) => {
    setSelectedEmployee(emp)
    setEditForm({
      gajiPokok: emp.gajiPokok,
      tunjanganJabatan: emp.tunjangan, // Default total into Jabatan field
      tunjanganTransport: 0,
      tunjanganMakan: 0,
      tunjanganLainnya: 0,
      potonganBpjsKes: Math.round(emp.gajiPokok * 0.01),
      potonganBpjsTk: Math.round(emp.gajiPokok * 0.02),
      potonganKasbon: emp.potongan, // Default total into Kasbon field
      potonganLainnya: 0
    })
    setShowEditDialog(true)
  }

  const handleSaveSalary = async () => {
    if (!selectedEmployee) return
    setIsSaving(true)
    
    const totalTunjangan = editForm.tunjanganJabatan + editForm.tunjanganTransport + editForm.tunjanganMakan + editForm.tunjanganLainnya
    const totalPotongan = editForm.potonganBpjsKes + editForm.potonganBpjsTk + editForm.potonganKasbon + editForm.potonganLainnya

    try {
      const res = await savePayroll({
        pegawaiId: selectedEmployee.pegawaiId,
        periodStr: selectedPeriod,
        gajiPokok: editForm.gajiPokok,
        tunjangan: totalTunjangan,
        potongan: totalPotongan,
      })
      
      if (res.error) throw new Error(res.error)
      
      toast.success("Gaji berhasil diupdate dan disimpan")
      setShowEditDialog(false)
      fetchData()
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan")
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportExcel = () => {
    const headers = ["NIK", "Nama", "Unit", "Gol", "Gaji Pokok", "Tunjangan", "Potongan", "Gaji Bersih"]
    const csvData = filteredData.map(emp => 
      [emp.nik, emp.nama, emp.unit, emp.golongan, emp.gajiPokok, emp.tunjangan, emp.potongan, emp.gajiBersih].join(",")
    )
    const csvContent = "\uFEFF" + [headers.join(","), ...csvData].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `payroll_${selectedPeriod}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Payroll berhasil diekspor ke Excel (CSV)")
  }

  const totalGajiBersih = filteredData.reduce((sum, emp) => sum + emp.gajiBersih, 0)
  
  // Stats calculations
  const totalPayrollVal = data.reduce((sum, emp) => sum + emp.gajiBersih, 0)
  const totalGajiPokokVal = data.reduce((sum, emp) => sum + emp.gajiPokok, 0)
  const totalTunjanganVal = data.reduce((sum, emp) => sum + emp.tunjangan, 0)
  const totalPotonganVal = data.reduce((sum, emp) => sum + emp.potongan, 0)

  // Avoid divide by 0
  const processedCount = data.filter(e => e.status !== "draft").length
  const progressPercent = data.length > 0 ? (processedCount / data.length) * 100 : 0

  const summaryStats = [
    {
      title: "Total Payroll",
      value: formatCurrency(totalPayrollVal),
      icon: Wallet,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Gaji Pokok",
      value: formatCurrency(totalGajiPokokVal),
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "Total Tunjangan",
      value: formatCurrency(totalTunjanganVal),
      icon: CreditCard,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Potongan",
      value: formatCurrency(totalPotonganVal),
      icon: Calculator,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      title: "Pegawai Diproses",
      value: processedCount.toString(),
      subtitle: `dari ${data.length}`,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Proses Pembayaran",
      value: "0",
      subtitle: "0%",
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
  ]

  return (
    <>
      <div className="flex min-h-screen bg-background">
        <SidebarNav />
        <div className="flex flex-1 flex-col sidebar-offset">
          <TopBar breadcrumb={["Remunerasi", "Payroll"]} />
          <main className="flex-1 overflow-auto p-6">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Payroll Management</h1>
                <p className="text-sm text-muted-foreground">
                  Kelola penggajian pegawai PDAM Tirta Ardhia Rinjani secara dinamis
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Import Data
                </Button>
                <Button variant="outline" size="sm" className="gap-2" onClick={handleExportExcel}>
                  <Download className="h-4 w-4" />
                  Export Excel
                </Button>
                <Button size="sm" className="gap-2" onClick={handleProcessPayroll} disabled={isLoading || isProcessing}>
                  <Calculator className="h-4 w-4" />
                  Proses Payroll
                </Button>
              </div>
            </div>

            {/* Period Selector & Progress */}
            <Card className="card-premium mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Periode Payroll</p>
                      <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                        <SelectTrigger className="mt-1 w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="apr-2026">April 2026</SelectItem>
                          <SelectItem value="mar-2026">Maret 2026</SelectItem>
                          <SelectItem value="feb-2026">Februari 2026</SelectItem>
                          <SelectItem value="jan-2026">Januari 2026</SelectItem>
                          <SelectItem value="des-2025">Desember 2025</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="h-12 w-px bg-border" />
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge className="mt-1 bg-amber-100 text-amber-700 border-amber-200">
                        <Clock className="mr-1 h-3 w-3" />
                        Dalam Proses
                      </Badge>
                    </div>
                  </div>
                  <div className="flex-1 lg:max-w-md">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress Proses Slip</span>
                      <span className="font-medium">{processedCount} / {data.length} ({progressPercent.toFixed(1)}%)</span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {summaryStats.map((stat) => (
                <Card key={stat.title} className="card-premium">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          {stat.title}
                        </span>
                        <span className="text-sm md:text-md lg:text-lg font-bold text-foreground truncate max-w-[120px]" title={stat.value}>{stat.value}</span>
                        {stat.subtitle && (
                          <span className="text-xs text-muted-foreground">{stat.subtitle}</span>
                        )}
                      </div>
                      <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="daftar" className="space-y-4">
              <TabsList>
                <TabsTrigger value="daftar">Daftar Gaji</TabsTrigger>
                <TabsTrigger value="komponen">Komponen Gaji</TabsTrigger>
                <TabsTrigger value="potongan">Potongan</TabsTrigger>
              </TabsList>

              <TabsContent value="daftar">
                <Card className="card-premium mb-4">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Cari nama atau NIK pegawai..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Semua Status</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Table */}
                <Card className="card-premium">
                  <CardContent className="p-0 relative min-h-[300px]">
                    {isLoading && (
                      <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 backdrop-blur-sm">
                        <p className="animate-pulse font-medium">Memuat Data...</p>
                      </div>
                    )}
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="w-[200px]">Pegawai</TableHead>
                            <TableHead>Unit / Gol</TableHead>
                            <TableHead className="text-right">Gaji Pokok</TableHead>
                            <TableHead className="text-right">Tunjangan</TableHead>
                            <TableHead className="text-right">Potongan</TableHead>
                            <TableHead className="text-right text-primary">Total Bersih</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedData.length > 0 ? (
                            paginatedData.map((emp) => (
                            <TableRow key={emp.pegawaiId} className="hover:bg-muted/30">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9">
                                    <AvatarFallback className="bg-primary/10 text-xs text-primary">
                                      {(emp.nama || "P").substring(0,2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-sm truncate max-w-[150px]" title={emp.nama}>{emp.nama}</p>
                                    <p className="font-mono text-xs text-muted-foreground">
                                      {emp.nik}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-xs">{emp.unit}</div>
                                <Badge variant="outline" className="mt-1 text-[10px]">{emp.golongan}</Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs">
                                {formatCurrency(emp.gajiPokok)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs text-emerald-600">
                                +{formatCurrency(emp.tunjangan)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs text-red-600">
                                -{formatCurrency(emp.potongan)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm font-bold text-primary">
                                {formatCurrency(emp.gajiBersih)}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant="outline"
                                  className={(statusConfig as any)[emp.status]?.className || statusConfig.draft.className}
                                >
                                  {(statusConfig as any)[emp.status]?.label || "Draft"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditSalary(emp)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit Gaji Manual
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleViewSlip(emp)} disabled={emp.status === "draft"}>
                                      <FileText className="mr-2 h-4 w-4" />
                                      Cetak Slip
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={8} className="h-48 text-center text-muted-foreground">
                                {!isLoading && "Tidak ada data payroll yang ditemukan."}
                              </TableCell>
                            </TableRow>
                          )}
                          {!isLoading && filteredData.length > 0 && (
                            <TableRow className="bg-muted/50 font-bold">
                              <TableCell colSpan={5} className="text-right pr-4">
                                Total Pembayaran ({filteredData.length} pegawai)
                              </TableCell>
                              <TableCell className="text-right font-mono text-primary text-base">
                                {formatCurrency(totalGajiBersih)}
                              </TableCell>
                              <TableCell colSpan={2}></TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Pagination */}
                <div className="mt-4 flex items-center justify-between border-t border-border p-4 bg-card rounded-lg shadow-sm border">
                  <p className="text-sm text-muted-foreground">
                    Menampilkan {paginatedData.length} dari {filteredData.length} pegawai
                  </p>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev: number) => Math.max(1, prev - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((prev: number) => Math.min(totalPages, prev + 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="komponen">
                <Card className="card-premium">
                  <CardContent className="p-8 text-center min-h-[300px] flex flex-col justify-center items-center">
                      <PieChartIcon className="h-16 w-16 text-muted-foreground/30 mb-4" />
                      <h3 className="font-semibold text-xl mb-2">Statistik Komponen Menggunakan Data Live</h3>
                      <p className="text-muted-foreground max-w-lg mb-6">Grafik ini akan terhubung langsung ke dashboard PowerBI atau rekap data agregat Gaji Pokok, Tunjangan, dan Lembur berdasarkan data bulan ini.</p>
                      <Button variant="outline">Lihat Report Detail</Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="potongan">
                <Card className="card-premium">
                  <CardContent className="p-8 text-center min-h-[300px] flex flex-col justify-center items-center">
                      <AlertCircle className="h-16 w-16 text-muted-foreground/30 mb-4" />
                      <h3 className="font-semibold text-xl mb-2">Rincian Potongan BPJS & PPh21</h3>
                      <p className="text-muted-foreground max-w-lg">Sistem PDAM Tirta Ardhia Rinjani akan mengkalkulasi tarif PPh21 (TER) dan premi BPJS Kesehatan secara otomatis pada saat tombol Proses ditekan.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>

      {/* Edit Salary Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Gaji Pegawai</DialogTitle>
            <DialogDescription>
              Ubah rincian gaji untuk {selectedEmployee?.nama} bulan {selectedPeriod.toUpperCase()}. Mengubah angka ini akan sekaligus mengupdate profile {selectedEmployee?.nama}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 py-4">
             {/* Kiri: Penghasilan */}
             <div className="space-y-4">
               <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground border-b pb-1">Penghasilan</h4>
               <div className="grid gap-2">
                  <label className="text-sm font-medium">Gaji Pokok</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rp</span>
                    <Input 
                      type="number"
                      className="pl-10" 
                      value={editForm.gajiPokok} 
                      onChange={e => setEditForm({...editForm, gajiPokok: Number(e.target.value)})} 
                    />
                  </div>
               </div>
               <div className="grid gap-2">
                  <label className="text-sm font-medium">Tunjangan Jabatan</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rp</span>
                    <Input 
                      type="number"
                      className="pl-10" 
                      value={editForm.tunjanganJabatan} 
                      onChange={e => setEditForm({...editForm, tunjanganJabatan: Number(e.target.value)})} 
                    />
                  </div>
               </div>
               <div className="grid gap-2">
                  <label className="text-sm font-medium">Tunjangan Transport</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rp</span>
                    <Input 
                      type="number"
                      className="pl-10" 
                      value={editForm.tunjanganTransport} 
                      onChange={e => setEditForm({...editForm, tunjanganTransport: Number(e.target.value)})} 
                    />
                  </div>
               </div>
               <div className="grid gap-2">
                  <label className="text-sm font-medium">Tunjangan Makan</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rp</span>
                    <Input 
                      type="number"
                      className="pl-10" 
                      value={editForm.tunjanganMakan} 
                      onChange={e => setEditForm({...editForm, tunjanganMakan: Number(e.target.value)})} 
                    />
                  </div>
               </div>
               <div className="grid gap-2">
                  <label className="text-sm font-medium">Tunjangan Lainnya</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rp</span>
                    <Input 
                      type="number"
                      className="pl-10" 
                      value={editForm.tunjanganLainnya} 
                      onChange={e => setEditForm({...editForm, tunjanganLainnya: Number(e.target.value)})} 
                    />
                  </div>
               </div>
               <div className="pt-2 flex justify-between items-center font-bold text-emerald-600">
                  <span className="text-xs uppercase">Total Tunjangan:</span>
                  <span>{formatCurrency(editForm.tunjanganJabatan + editForm.tunjanganTransport + editForm.tunjanganMakan + editForm.tunjanganLainnya)}</span>
               </div>
             </div>

             {/* Kanan: Potongan */}
             <div className="space-y-4">
               <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground border-b pb-1">Potongan</h4>
               <div className="grid gap-2">
                  <label className="text-sm font-medium text-red-600">BPJS Kesehatan (1%)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400">Rp</span>
                    <Input 
                      type="number"
                      className="pl-10 border-red-100" 
                      value={editForm.potonganBpjsKes} 
                      onChange={e => setEditForm({...editForm, potonganBpjsKes: Number(e.target.value)})} 
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">*Auto-kalkulasi dari Gaji Pokok</p>
               </div>
               <div className="grid gap-2">
                  <label className="text-sm font-medium text-red-600">BPJS TK (2%)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400">Rp</span>
                    <Input 
                      type="number"
                      className="pl-10 border-red-100" 
                      value={editForm.potonganBpjsTk} 
                      onChange={e => setEditForm({...editForm, potonganBpjsTk: Number(e.target.value)})} 
                    />
                  </div>
               </div>
               <div className="grid gap-2">
                  <label className="text-sm font-medium text-red-600">Potongan Kasbon</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400">Rp</span>
                    <Input 
                      type="number"
                      className="pl-10 border-red-100" 
                      value={editForm.potonganKasbon} 
                      onChange={e => setEditForm({...editForm, potonganKasbon: Number(e.target.value)})} 
                    />
                  </div>
               </div>
               <div className="grid gap-2">
                  <label className="text-sm font-medium text-red-600">Potongan Lainnya</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400">Rp</span>
                    <Input 
                      type="number"
                      className="pl-10 border-red-100" 
                      value={editForm.potonganLainnya} 
                      onChange={e => setEditForm({...editForm, potonganLainnya: Number(e.target.value)})} 
                    />
                  </div>
               </div>
               <div className="pt-2 flex justify-between items-center font-bold text-red-600">
                  <span className="text-xs uppercase">Total Potongan:</span>
                  <span>{formatCurrency(editForm.potonganBpjsKes + editForm.potonganBpjsTk + editForm.potonganKasbon + editForm.potonganLainnya)}</span>
               </div>
             </div>
          </div>

          <div className="mt-4 pt-4 border-t-2 border-dashed flex justify-between items-center bg-primary/5 p-4 rounded-lg">
             <div className="flex flex-col">
               <span className="text-xs text-muted-foreground uppercase font-semibold">Estimasi Gaji Bersih</span>
               <span className="text-xs text-muted-foreground tracking-tight">(Pokok + Tunjangan - Potongan)</span>
             </div>
             <span className="font-bold text-primary text-2xl">
               {formatCurrency(
                 editForm.gajiPokok + 
                 (editForm.tunjanganJabatan + editForm.tunjanganTransport + editForm.tunjanganMakan + editForm.tunjanganLainnya) - 
                 (editForm.potonganBpjsKes + editForm.potonganBpjsTk + editForm.potonganKasbon + editForm.potonganLainnya)
               )}
             </span>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Batal</Button>
            <Button onClick={handleSaveSalary} disabled={isSaving}>
              {isSaving ? "Menyimpan..." : "Simpan Gaji"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Slip Gaji Dialog */}
      <Dialog open={showSlipDialog} onOpenChange={setShowSlipDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Slip Gaji Pegawai</DialogTitle>
            <DialogDescription>
              Rincian penghasilan untuk periode {selectedPeriod.toUpperCase()}
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-6 pt-4">
              <div className="flex justify-between items-start border-b pb-4 gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white overflow-hidden border">
                    <Image src="/logo-tar.png" alt="Logo TAR" width={56} height={56} className="object-contain" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">PDAM Tirta Ardhia Rinjani</h3>
                    <p className="text-sm text-muted-foreground">Jl. Raya No. 123, Indonesia</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">SLIP GAJI</p>
                  <p className="text-xs text-muted-foreground">{selectedPeriod.toUpperCase()}/{selectedEmployee.pegawaiId.slice(-6)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p><span className="text-muted-foreground">Nama:</span> {selectedEmployee.nama}</p>
                  <p><span className="text-muted-foreground">NIK:</span> {selectedEmployee.nik}</p>
                </div>
                <div className="space-y-1">
                  <p><span className="text-muted-foreground">Unit:</span> {selectedEmployee.unit}</p>
                  <p><span className="text-muted-foreground">Golongan:</span> {selectedEmployee.golongan}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <p className="font-bold text-xs uppercase text-muted-foreground tracking-wider">Penghasilan</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Gaji Pokok</span>
                      <span>{formatCurrency(selectedEmployee.gajiPokok)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span>Tunjangan</span>
                      <span>+{formatCurrency(selectedEmployee.tunjangan)}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="font-bold text-xs uppercase text-muted-foreground tracking-wider">Potongan</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-red-600 border-b pb-2">
                      <span>Total Potongan</span>
                      <span>-{formatCurrency(selectedEmployee.potongan)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <span className="font-bold">Total Pembayaran (Take Home Pay)</span>
                <span className="font-bold text-xl text-primary">{formatCurrency(selectedEmployee.gajiBersih)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
                toast.info("Mencetak PDF...")
                setTimeout(() => window.print(), 500)
            }}>
              <Printer className="mr-2 h-4 w-4" />
              Cetak PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Dialog */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Memproses Payroll</DialogTitle>
            <DialogDescription>
              Mohon tunggu, sistem sedang membuat draf kalkulasi penggajian massal dari database.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-8">
            <Progress value={processProgress} className="h-3" />
            <p className="text-sm text-center text-muted-foreground">
              Membuat payroll record: {processProgress}%
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function PieChartIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  )
}
