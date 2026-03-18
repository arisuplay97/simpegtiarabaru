"use client"

import { useState } from "react"
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
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import Image from "next/image"

interface PayrollEmployee {
  id: string
  name: string
  initials: string
  nik: string
  unit: string
  golongan: string
  gajiPokok: number
  tunjangan: number
  lembur: number
  potongan: number
  gajiBersih: number
  status: "draft" | "approved" | "posted" | "paid"
}

const payrollData: PayrollEmployee[] = [
  {
    id: "1",
    name: "Ahmad Rizki Pratama",
    initials: "AR",
    nik: "198501152010011001",
    unit: "IT & Sistem",
    golongan: "C/III",
    gajiPokok: 5850000,
    tunjangan: 3200000,
    lembur: 450000,
    potongan: 1245000,
    gajiBersih: 8255000,
    status: "approved",
  },
  {
    id: "2",
    name: "Siti Nurhaliza",
    initials: "SN",
    nik: "199003222015012002",
    unit: "Keuangan",
    golongan: "B/III",
    gajiPokok: 5200000,
    tunjangan: 2800000,
    lembur: 0,
    potongan: 1120000,
    gajiBersih: 6880000,
    status: "approved",
  },
  {
    id: "3",
    name: "Budi Santoso",
    initials: "BS",
    nik: "198712052008011003",
    unit: "Distribusi",
    golongan: "D/III",
    gajiPokok: 6100000,
    tunjangan: 3500000,
    lembur: 780000,
    potongan: 1380000,
    gajiBersih: 9000000,
    status: "draft",
  },
  {
    id: "4",
    name: "Dewi Lestari",
    initials: "DL",
    nik: "199205152018012004",
    unit: "Pelayanan",
    golongan: "A/III",
    gajiPokok: 4800000,
    tunjangan: 2400000,
    lembur: 320000,
    potongan: 985000,
    gajiBersih: 6535000,
    status: "approved",
  },
  {
    id: "5",
    name: "Eko Prasetyo",
    initials: "EP",
    nik: "198008152005011005",
    unit: "Produksi",
    golongan: "D/II",
    gajiPokok: 4200000,
    tunjangan: 2100000,
    lembur: 650000,
    potongan: 890000,
    gajiBersih: 6060000,
    status: "posted",
  },
  {
    id: "6",
    name: "Gunawan Wibowo",
    initials: "GW",
    nik: "197506101998011007",
    unit: "Produksi",
    golongan: "A/IV",
    gajiPokok: 7500000,
    tunjangan: 4200000,
    lembur: 0,
    potongan: 1650000,
    gajiBersih: 10050000,
    status: "paid",
  },
]

const statusConfig = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-700 border-gray-200" },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  posted: { label: "Posted", className: "bg-blue-100 text-blue-700 border-blue-200" },
  paid: { label: "Dibayar", className: "bg-primary/10 text-primary border-primary/20" },
}

const summaryStats = [
  {
    title: "Total Payroll",
    value: "Rp 4.28M",
    change: "+3.2%",
    changeType: "up" as const,
    icon: Wallet,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Gaji Pokok",
    value: "Rp 2.85M",
    change: "+1.5%",
    changeType: "up" as const,
    icon: DollarSign,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
  },
  {
    title: "Total Tunjangan",
    value: "Rp 1.12M",
    change: "+2.8%",
    changeType: "up" as const,
    icon: CreditCard,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    title: "Total Potongan",
    value: "Rp 456jt",
    change: "-0.5%",
    changeType: "down" as const,
    icon: Calculator,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
  {
    title: "Pegawai Diproses",
    value: "1,198",
    subtitle: "dari 1,247",
    icon: Users,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    title: "Sudah Transfer",
    value: "892",
    subtitle: "74.5%",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
  },
]

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function PayrollPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedPeriod, setSelectedPeriod] = useState("mar-2026")
  const [showSlipDialog, setShowSlipDialog] = useState(false)
  const [showProcessDialog, setShowProcessDialog] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<PayrollEmployee | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processProgress, setProcessProgress] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const filteredData = payrollData.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

    const interval = setInterval(() => {
      setProcessProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsProcessing(false)
          toast.success("Payroll berhasil diproses untuk periode " + selectedPeriod)
          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  const handleViewSlip = (emp: PayrollEmployee) => {
    setSelectedEmployee(emp)
    setShowSlipDialog(true)
  }

  const handleExportExcel = () => {
    const headers = ["NIK", "Nama", "Unit", "Gol", "Gaji Pokok", "Tunjangan", "Lembur", "Potongan", "Gaji Bersih"]
    const csvData = filteredData.map(emp => 
      [emp.nik, emp.name, emp.unit, emp.golongan, emp.gajiPokok, emp.tunjangan, emp.lembur, emp.potongan, emp.gajiBersih].join(",")
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

  const handlePrint = () => {
    toast.info("Membuka jendela cetak...")
    setTimeout(() => {
        window.print()
    }, 500)
  }
  const totalGajiBersih = filteredData.reduce((sum, emp) => sum + emp.gajiBersih, 0)

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
                  Kelola penggajian pegawai PDAM Tirta Ardhia Rinjani
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
                <Button size="sm" className="gap-2" onClick={handleProcessPayroll}>
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
                    <div>
                      <p className="text-xs text-muted-foreground">Deadline</p>
                      <p className="mt-1 text-sm font-medium">25 Maret 2026</p>
                    </div>
                  </div>
                  <div className="flex-1 lg:max-w-md">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress Pembayaran</span>
                      <span className="font-medium">892 / 1,198 (74.5%)</span>
                    </div>
                    <Progress value={74.5} className="h-2" />
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
                        <span className="text-xl font-bold text-foreground">{stat.value}</span>
                        {stat.change && (
                          <div className="flex items-center gap-1">
                            {stat.changeType === "up" ? (
                              <TrendingUp className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-600" />
                            )}
                            <span
                              className={`text-xs ${
                                stat.changeType === "up"
                                  ? "text-emerald-600"
                                  : "text-red-600"
                              }`}
                            >
                              {stat.change}
                            </span>
                          </div>
                        )}
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
                <TabsTrigger value="bank">Transfer Bank</TabsTrigger>
              </TabsList>

              <TabsContent value="daftar">
                {/* Filters */}
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
                            <SelectItem value="posted">Posted</SelectItem>
                            <SelectItem value="paid">Dibayar</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select defaultValue="all">
                          <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Unit Kerja" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Semua Unit</SelectItem>
                            <SelectItem value="it">IT & Sistem</SelectItem>
                            <SelectItem value="keuangan">Keuangan</SelectItem>
                            <SelectItem value="distribusi">Distribusi</SelectItem>
                            <SelectItem value="pelayanan">Pelayanan</SelectItem>
                            <SelectItem value="produksi">Produksi</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Table */}
                <Card className="card-premium">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="w-[250px]">Pegawai</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Golongan</TableHead>
                            <TableHead className="text-right">Gaji Pokok</TableHead>
                            <TableHead className="text-right">Tunjangan</TableHead>
                            <TableHead className="text-right">Lembur</TableHead>
                            <TableHead className="text-right">Potongan</TableHead>
                            <TableHead className="text-right">Gaji Bersih</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedData.length > 0 ? (
                            paginatedData.map((emp) => (
                            <TableRow key={emp.id} className="hover:bg-muted/30">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9">
                                    <AvatarFallback className="bg-primary/10 text-xs text-primary">
                                      {emp.initials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{emp.name}</p>
                                    <p className="font-mono text-xs text-muted-foreground">
                                      {emp.nik}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">{emp.unit}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{emp.golongan}</Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {formatCurrency(emp.gajiPokok)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm text-emerald-600">
                                +{formatCurrency(emp.tunjangan)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm text-blue-600">
                                {emp.lembur > 0 ? `+${formatCurrency(emp.lembur)}` : "-"}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm text-red-600">
                                -{formatCurrency(emp.potongan)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm font-bold">
                                {formatCurrency(emp.gajiBersih)}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant="outline"
                                  className={(statusConfig as any)[emp.status].className}
                                >
                                  {(statusConfig as any)[emp.status].label}
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
                                    <DropdownMenuItem onClick={() => handleViewSlip(emp)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      Lihat Detail
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleViewSlip(emp)}>
                                      <FileText className="mr-2 h-4 w-4" />
                                      Slip Gaji
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Printer className="mr-2 h-4 w-4" />
                                      Print
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Send className="mr-2 h-4 w-4" />
                                      Kirim Email
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={10} className="h-24 text-center">
                                Tidak ada data payroll yang ditemukan.
                              </TableCell>
                            </TableRow>
                          )}
                          {/* Total Row */}
                          <TableRow className="bg-muted/50 font-bold">
                            <TableCell colSpan={7} className="text-right">
                              Total Gaji Bersih ({filteredData.length} pegawai)
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(totalGajiBersih)}
                            </TableCell>
                            <TableCell colSpan={2}></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Pagination */}
                <div className="mt-4 flex items-center justify-between border-t border-border p-4 bg-card rounded-lg border shadow-sm">
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
                  <CardHeader>
                    <CardTitle>Komponen Gaji</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {[
                        { name: "Gaji Pokok", amount: "Rp 2.85M", percentage: 66.5 },
                        { name: "Tunjangan Jabatan", amount: "Rp 650jt", percentage: 15.2 },
                        { name: "Tunjangan Keluarga", amount: "Rp 280jt", percentage: 6.5 },
                        { name: "Tunjangan Transport", amount: "Rp 190jt", percentage: 4.4 },
                        { name: "Tunjangan Makan", amount: "Rp 185jt", percentage: 4.3 },
                        { name: "Lembur", amount: "Rp 132jt", percentage: 3.1 },
                      ].map((item) => (
                        <Card key={item.name} className="border">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">{item.name}</span>
                              <span className="text-lg font-bold">{item.amount}</span>
                            </div>
                            <Progress value={item.percentage} className="h-2" />
                            <p className="mt-1 text-xs text-muted-foreground text-right">
                              {item.percentage}% dari total
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="potongan">
                <Card className="card-premium">
                  <CardHeader>
                    <CardTitle>Rincian Potongan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {[
                        { name: "BPJS Kesehatan", amount: "Rp 145jt", icon: "health" },
                        { name: "BPJS Ketenagakerjaan", amount: "Rp 98jt", icon: "work" },
                        { name: "PPh 21", amount: "Rp 156jt", icon: "tax" },
                        { name: "Pinjaman Koperasi", amount: "Rp 57jt", icon: "loan" },
                      ].map((item) => (
                        <Card key={item.name} className="border">
                          <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">{item.name}</p>
                            <p className="mt-1 text-xl font-bold text-red-600">{item.amount}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bank">
                <Card className="card-premium">
                  <CardHeader>
                    <CardTitle>Transfer Bank</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      {[
                        { bank: "Bank Mandiri", accounts: 456, amount: "Rp 1.82M" },
                        { bank: "Bank BNI", accounts: 312, amount: "Rp 1.24M" },
                        { bank: "Bank BRI", accounts: 234, amount: "Rp 876jt" },
                      ].map((item) => (
                        <Card key={item.bank} className="border">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                <Building2 className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{item.bank}</p>
                                <p className="text-sm text-muted-foreground">
                                  {item.accounts} rekening
                                </p>
                                <p className="text-lg font-bold text-primary">{item.amount}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>

      {/* Slip Gaji Dialog */}
      <Dialog open={showSlipDialog} onOpenChange={setShowSlipDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Slip Gaji Pegawai</DialogTitle>
            <DialogDescription>
              Rincian penghasilan untuk periode {selectedPeriod}
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
                  <p className="text-xs text-muted-foreground">MAR-2026/00{selectedEmployee.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p><span className="text-muted-foreground">Nama:</span> {selectedEmployee.name}</p>
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
                    <div className="flex justify-between text-blue-600">
                      <span>Lembur</span>
                      <span>+{formatCurrency(selectedEmployee.lembur)}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="font-bold text-xs uppercase text-muted-foreground tracking-wider">Potongan</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-red-600">
                      <span>Total Potongan</span>
                      <span>-{formatCurrency(selectedEmployee.potongan)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center bg-muted/50 p-3 rounded-lg">
                <span className="font-bold">TOTAL GAJI BERSIH</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(selectedEmployee.gajiBersih)}</span>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" className="gap-2" onClick={handlePrint}>
                  <Printer className="h-4 w-4" /> Print
                </Button>
                <Button className="gap-2" onClick={handlePrint}>
                  <Download className="h-4 w-4" /> Download PDF
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Process Dialog */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Memproses Payroll</DialogTitle>
            <DialogDescription>
              Harap tunggu sementara sistem menghitung payroll untuk periode {selectedPeriod}
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="flex justify-between text-sm">
              <span>{isProcessing ? "Menghitung gaji..." : "Selesai"}</span>
              <span>{processProgress}%</span>
            </div>
            <Progress value={processProgress} className="h-2" />
          </div>
          <DialogFooter>
            <Button disabled={isProcessing} onClick={() => setShowProcessDialog(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}


