"use client"

import React, { useState } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  Download,
  CalendarIcon,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Timer,
  Users,
  UserCheck,
  UserX,
  Plane,
  TrendingUp,
  TrendingDown,
  Camera,
  Fingerprint,
  Smartphone,
  Edit,
  Loader2,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface AttendanceRecord {
  id: string
  employeeName: string
  employeeInitials: string
  employeeUnit: string
  date: string
  checkIn: string | null
  checkOut: string | null
  status: "hadir" | "izin" | "sakit" | "cuti" | "alpha" | "dinas"
  lateMinutes: number
  earlyMinutes: number
  method: "selfie" | "fingerprint" | "gps" | "manual"
  location: string
  workHours: string
}

const attendanceData: AttendanceRecord[] = [
  {
    id: "1",
    employeeName: "Ahmad Rizki Pratama",
    employeeInitials: "AR",
    employeeUnit: "IT & Sistem",
    date: "17 Mar 2026",
    checkIn: "07:55",
    checkOut: "17:05",
    status: "hadir",
    lateMinutes: 0,
    earlyMinutes: 0,
    method: "selfie",
    location: "Kantor Pusat",
    workHours: "9j 10m",
  },
  {
    id: "2",
    employeeName: "Siti Nurhaliza",
    employeeInitials: "SN",
    employeeUnit: "Keuangan",
    date: "17 Mar 2026",
    checkIn: "08:12",
    checkOut: "17:00",
    status: "hadir",
    lateMinutes: 12,
    earlyMinutes: 0,
    method: "fingerprint",
    location: "Kantor Pusat",
    workHours: "8j 48m",
  },
  {
    id: "3",
    employeeName: "Budi Santoso",
    employeeInitials: "BS",
    employeeUnit: "Distribusi",
    date: "17 Mar 2026",
    checkIn: null,
    checkOut: null,
    status: "cuti",
    lateMinutes: 0,
    earlyMinutes: 0,
    method: "manual",
    location: "-",
    workHours: "-",
  },
  {
    id: "4",
    employeeName: "Dewi Lestari",
    employeeInitials: "DL",
    employeeUnit: "Pelayanan",
    date: "17 Mar 2026",
    checkIn: "07:45",
    checkOut: "17:15",
    status: "hadir",
    lateMinutes: 0,
    earlyMinutes: 0,
    method: "selfie",
    location: "Kantor Pusat",
    workHours: "9j 30m",
  },
  {
    id: "5",
    employeeName: "Eko Prasetyo",
    employeeInitials: "EP",
    employeeUnit: "Produksi",
    date: "17 Mar 2026",
    checkIn: "06:00",
    checkOut: "14:05",
    status: "hadir",
    lateMinutes: 0,
    earlyMinutes: 0,
    method: "fingerprint",
    location: "IPA Cilandak",
    workHours: "8j 5m",
  },
  {
    id: "6",
    employeeName: "Fitri Handayani",
    employeeInitials: "FH",
    employeeUnit: "SDM & Umum",
    date: "17 Mar 2026",
    checkIn: "08:00",
    checkOut: null,
    status: "hadir",
    lateMinutes: 0,
    earlyMinutes: 0,
    method: "gps",
    location: "Kantor Pusat",
    workHours: "-",
  },
  {
    id: "7",
    employeeName: "Gunawan Wibowo",
    employeeInitials: "GW",
    employeeUnit: "Produksi",
    date: "17 Mar 2026",
    checkIn: null,
    checkOut: null,
    status: "sakit",
    lateMinutes: 0,
    earlyMinutes: 0,
    method: "manual",
    location: "-",
    workHours: "-",
  },
  {
    id: "8",
    employeeName: "Hendra Kusuma",
    employeeInitials: "HK",
    employeeUnit: "Distribusi",
    date: "17 Mar 2026",
    checkIn: "07:00",
    checkOut: null,
    status: "dinas",
    lateMinutes: 0,
    earlyMinutes: 0,
    method: "gps",
    location: "Cabang Utara",
    workHours: "-",
  },
]

const statsCards = [
  {
    title: "Total Pegawai",
    value: "1,247",
    icon: Users,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Hadir",
    value: "1,156",
    percentage: "92.7%",
    icon: UserCheck,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    trend: "+2.3%",
    trendUp: true,
  },
  {
    title: "Terlambat",
    value: "34",
    percentage: "2.7%",
    icon: Timer,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    trend: "-0.5%",
    trendUp: true,
  },
  {
    title: "Izin/Sakit",
    value: "28",
    percentage: "2.2%",
    icon: AlertCircle,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    title: "Cuti",
    value: "24",
    percentage: "1.9%",
    icon: Plane,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    title: "Alpha",
    value: "5",
    percentage: "0.4%",
    icon: UserX,
    color: "text-red-600",
    bgColor: "bg-red-100",
    trend: "-1.2%",
    trendUp: true,
  },
]

const statusConfig = {
  hadir: { label: "Hadir", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  izin: { label: "Izin", className: "bg-blue-100 text-blue-700 border-blue-200" },
  sakit: { label: "Sakit", className: "bg-amber-100 text-amber-700 border-amber-200" },
  cuti: { label: "Cuti", className: "bg-purple-100 text-purple-700 border-purple-200" },
  alpha: { label: "Alpha", className: "bg-red-100 text-red-700 border-red-200" },
  dinas: { label: "Dinas Luar", className: "bg-cyan-100 text-cyan-700 border-cyan-200" },
}

const methodConfig = {
  selfie: { label: "Selfie", icon: Camera },
  fingerprint: { label: "Fingerprint", icon: Fingerprint },
  gps: { label: "GPS", icon: MapPin },
  manual: { label: "Manual", icon: Smartphone },
}

export default function AttendancePage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Admin Edit States
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null)
  const [editCheckIn, setEditCheckIn] = useState("")
  const [editCheckOut, setEditCheckOut] = useState("")
  const [editStatus, setEditStatus] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [records, setRecords] = useState(attendanceData)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const handleOpenEdit = (record: AttendanceRecord) => {
    setSelectedRecord(record)
    setEditCheckIn(record.checkIn ?? "")
    setEditCheckOut(record.checkOut ?? "")
    setEditStatus(record.status)
    setShowEditDialog(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedRecord) return
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 600))

    setRecords((prev: AttendanceRecord[]) =>
      prev.map((r: AttendanceRecord) =>
        r.id === selectedRecord.id
          ? {
              ...r,
              checkIn: editCheckIn || null,
              checkOut: editCheckOut || null,
              status: editStatus as AttendanceRecord["status"],
            }
          : r
      )
    )

    setShowEditDialog(false)
    setIsLoading(false)
    toast.success(`Data absensi ${selectedRecord.employeeName} berhasil diubah`)
  }

  const handleBulkUpdate = (newStatus: AttendanceRecord["status"]) => {
    if (selectedIds.length === 0) {
      toast.error("Pilih minimal satu data")
      return
    }

    setRecords((prev: AttendanceRecord[]) => prev.map((r: AttendanceRecord) => 
      selectedIds.includes(r.id) ? { ...r, status: newStatus } : r
    ))
    setSelectedIds([])
    toast.success(`${selectedIds.length} data absensi berhasil diperbarui ke ${newStatus}`)
  }

  const handleExportCSV = () => {
    const headers = ["Nama", "Unit", "Check In", "Check Out", "Status", "Lokasi"]
    const csvData = filteredData.map((r: AttendanceRecord) => 
      [r.employeeName, r.employeeUnit, r.checkIn || "-", r.checkOut || "-", r.status, r.location].join(",")
    )
    const csvContent = [headers.join(","), ...csvData].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `rekap_absensi_${format(new Date(), "yyyy-MM-dd")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Rekap absensi berhasil diekspor")
  }

  const filteredData = records.filter((record: AttendanceRecord) => {
    const matchesSearch = record.employeeName
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    const matchesStatus =
      statusFilter === "all" || record.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )


  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Kehadiran", "Absensi"]} />
        <main className="flex-1 overflow-auto p-6">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Absensi Pegawai</h1>
              <p className="text-sm text-muted-foreground">
                Monitoring kehadiran pegawai real-time - {format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCSV}>
                <Download className="h-4 w-4" />
                Export Rekap
              </Button>
              <Button size="sm" className="gap-2">
                <Camera className="h-4 w-4" />
                Absensi Selfie
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {statsCards.map((stat) => (
              <Card key={stat.title} className="card-premium">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        {stat.title}
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-foreground">
                          {stat.value}
                        </span>
                        {stat.percentage && (
                          <span className="text-xs text-muted-foreground">
                            ({stat.percentage})
                          </span>
                        )}
                      </div>
                      {stat.trend && (
                        <div className="flex items-center gap-1">
                          {stat.trendUp ? (
                            <TrendingUp className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-600" />
                          )}
                          <span
                            className={`text-xs ${
                              stat.trendUp ? "text-emerald-600" : "text-red-600"
                            }`}
                          >
                            {stat.trend}
                          </span>
                        </div>
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
          <Tabs defaultValue="harian" className="space-y-4">
            <TabsList>
              <TabsTrigger value="harian">Harian</TabsTrigger>
              <TabsTrigger value="bulanan">Rekap Bulanan</TabsTrigger>
              <TabsTrigger value="anomali">Anomali</TabsTrigger>
              <TabsTrigger value="shift">Jadwal Shift</TabsTrigger>
            </TabsList>

            <TabsContent value="harian">
              {/* Bulk Actions */}
              {selectedIds.length > 0 && (
                <div className="mb-4 flex items-center justify-between rounded-lg bg-primary/5 p-3 border border-primary/20 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{selectedIds.length} data dipilih</span>
                    <Separator orientation="vertical" className="h-4" />
                    <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>Batal</Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8" onClick={() => handleBulkUpdate("hadir")}>
                      <Check className="mr-1 h-3 w-3" /> Set Hadir
                    </Button>
                    <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 h-8" onClick={() => handleBulkUpdate("izin")}>
                      Set Izin
                    </Button>
                    <Button size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 h-8" onClick={() => handleBulkUpdate("alpha")}>
                      Set Alpha
                    </Button>
                  </div>
                </div>
              )}

              {/* Filters */}
              <Card className="card-premium mb-4">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Cari nama pegawai..."
                        value={searchQuery}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-[200px] justify-start gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            {date ? format(date, "dd MMMM yyyy", { locale: id }) : "Pilih tanggal"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Status</SelectItem>
                          <SelectItem value="hadir">Hadir</SelectItem>
                          <SelectItem value="izin">Izin</SelectItem>
                          <SelectItem value="sakit">Sakit</SelectItem>
                          <SelectItem value="cuti">Cuti</SelectItem>
                          <SelectItem value="alpha">Alpha</SelectItem>
                          <SelectItem value="dinas">Dinas Luar</SelectItem>
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
                          <SelectItem value="sdm">SDM & Umum</SelectItem>
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
                          <TableHead className="w-[40px]">
                            <Checkbox 
                              checked={selectedIds.length === paginatedData.length && paginatedData.length > 0}
                              onCheckedChange={(checked: boolean) => {
                                if (checked) {
                                  setSelectedIds(paginatedData.map((r: AttendanceRecord) => r.id))
                                } else {
                                  setSelectedIds([])
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead className="w-[250px]">Pegawai</TableHead>
                          <TableHead>Unit Kerja</TableHead>
                          <TableHead className="text-center">Check In</TableHead>
                          <TableHead className="text-center">Check Out</TableHead>
                          <TableHead className="text-center">Jam Kerja</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-center">Keterlambatan</TableHead>
                          <TableHead>Metode</TableHead>
                          <TableHead>Lokasi</TableHead>
                          <TableHead className="text-center">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedData.length > 0 ? (
                          paginatedData.map((record: AttendanceRecord) => {
                            const MethodIcon = (methodConfig as any)[record.method].icon
                            const isSelected = selectedIds.includes(record.id)
                            return (
                              <TableRow key={record.id} className={cn("hover:bg-muted/30", isSelected && "bg-primary/5")}>
                                <TableCell>
                                  <Checkbox 
                                    checked={isSelected}
                                    onCheckedChange={(checked: boolean) => {
                                      if (checked) {
                                        setSelectedIds([...selectedIds, record.id])
                                      } else {
                                        setSelectedIds(selectedIds.filter((id: string) => id !== record.id))
                                      }
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9">
                                    <AvatarFallback className="bg-primary/10 text-xs text-primary">
                                      {record.employeeInitials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">{record.employeeName}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {record.employeeUnit}
                              </TableCell>
                              <TableCell className="text-center">
                                {record.checkIn ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    <span className="font-mono font-medium">{record.checkIn}</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {record.checkOut ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    <span className="font-mono font-medium">{record.checkOut}</span>
                                  </div>
                                ) : record.checkIn ? (
                                  <Badge variant="outline" className="bg-amber-50 text-amber-700">
                                    Belum
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center font-mono">
                                {record.workHours}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant="outline"
                                  className={(statusConfig as any)[record.status].className}
                                >
                                  {(statusConfig as any)[record.status].label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                {record.lateMinutes > 0 ? (
                                  <Badge variant="outline" className="bg-red-50 text-red-700">
                                    {record.lateMinutes} menit
                                  </Badge>
                                ) : (
                                  <span className="text-emerald-600">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <MethodIcon className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-xs">{(methodConfig as any)[record.method].label}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {record.location}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleOpenEdit(record)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={10} className="h-24 text-center">
                              Tidak ada data absensi yang ditemukan.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between border-t border-border p-4 bg-card rounded-lg border shadow-sm">
                <p className="text-sm text-muted-foreground">
                  Menampilkan {paginatedData.length} dari {filteredData.length} data
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

            <TabsContent value="bulanan">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle>Rekap Bulanan - Maret 2026</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Nama Pegawai</TableHead>
                          <TableHead className="text-center">Hadir</TableHead>
                          <TableHead className="text-center">Izin</TableHead>
                          <TableHead className="text-center">Sakit</TableHead>
                          <TableHead className="text-center">Cuti</TableHead>
                          <TableHead className="text-center">Alpha</TableHead>
                          <TableHead className="text-center">Terlambat (m)</TableHead>
                          <TableHead className="text-center">Persentase</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {records.slice(0, 5).map((r: AttendanceRecord) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{r.employeeName}</TableCell>
                            <TableCell className="text-center">20</TableCell>
                            <TableCell className="text-center">1</TableCell>
                            <TableCell className="text-center">0</TableCell>
                            <TableCell className="text-center">0</TableCell>
                            <TableCell className="text-center text-red-600">0</TableCell>
                            <TableCell className="text-center">15</TableCell>
                            <TableCell className="text-center font-bold text-emerald-600">98%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="anomali">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle>Deteksi Anomali Absensi</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Pegawai</TableHead>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Jenis Anomali</TableHead>
                          <TableHead>Keterangan</TableHead>
                          <TableHead className="text-center">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Siti Nurhaliza</TableCell>
                          <TableCell>17 Mar 2026</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-amber-100 text-amber-700">Terlambat</Badge>
                          </TableCell>
                          <TableCell className="text-sm">Terlambat 12 menit tanpa keterangan</TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="sm">Follow Up</Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Gunawan Wibowo</TableCell>
                          <TableCell>17 Mar 2026</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-red-100 text-red-700">Mangkir</Badge>
                          </TableCell>
                          <TableCell className="text-sm">Tidak ada record check-in/out</TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="sm" className="text-red-600">Tegur</Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="shift">
              <Card className="card-premium">
                <CardHeader>
                  <CardTitle>Jadwal Shift Kerja</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Pegawai</TableHead>
                          <TableHead>Senin</TableHead>
                          <TableHead>Selasa</TableHead>
                          <TableHead>Rabu</TableHead>
                          <TableHead>Kamis</TableHead>
                          <TableHead>Jumat</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {records.slice(4, 8).map((r: AttendanceRecord) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{r.employeeName}</TableCell>
                            <TableCell><Badge variant="secondary">Pagi</Badge></TableCell>
                            <TableCell><Badge variant="secondary">Pagi</Badge></TableCell>
                            <TableCell><Badge variant="secondary">Sore</Badge></TableCell>
                            <TableCell><Badge variant="secondary">Sore</Badge></TableCell>
                            <TableCell><Badge>Libur</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Absensi — {selectedRecord?.employeeName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Jam Masuk */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Jam Masuk</label>
              <Input
                type="time"
                value={editCheckIn}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditCheckIn(e.target.value)}
              />
            </div>

            {/* Jam Keluar */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Jam Keluar</label>
              <Input
                type="time"
                value={editCheckOut}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditCheckOut(e.target.value)}
              />
            </div>

            {/* Status */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Status</label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hadir">Hadir</SelectItem>
                  <SelectItem value="izin">Izin</SelectItem>
                  <SelectItem value="sakit">Sakit</SelectItem>
                  <SelectItem value="cuti">Cuti</SelectItem>
                  <SelectItem value="alpha">Alpha</SelectItem>
                  <SelectItem value="dinas">Dinas Luar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveEdit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
