"use client"

import React, { useState } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"
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
import Link from "next/link"
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
import { getAbsensiList, getAbsensiSaya } from "@/lib/actions/absensi"

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
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "HRD" || session?.user?.role === "ADMIN" || session?.user?.role === "DIREKSI"

  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Admin Edit States
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null)
  const [editCheckIn, setEditCheckIn] = useState("")
  const [editCheckOut, setEditCheckOut] = useState("")
  const [editStatus, setEditStatus] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [records, setRecords] = useState<AttendanceRecord[]>([])

  React.useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        let data: any[] = []
        
        if (isAdmin) {
          data = await getAbsensiList(date, date)
        } else {
          data = await getAbsensiSaya(selectedMonth, selectedYear)
        }

        const mappedData: AttendanceRecord[] = data.map((d: any) => {
          const statusMap: Record<string, string> = {
            HADIR: "hadir", IZIN: "izin", SAKIT: "sakit", 
            CUTI: "cuti", ALPHA: "alpha", DINAS: "dinas",
            TERLAMBAT: "hadir"
          }
          
          const formatTime = (dateStr: any) => {
            if (!dateStr) return null
            const dt = new Date(dateStr)
            return dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
          }
          
          const calculateHours = (inTime: any, outTime: any) => {
            if (!inTime || !outTime) return "-"
            const diffMs = new Date(outTime).getTime() - new Date(inTime).getTime()
            const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
            const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
            return `${diffHrs}j ${diffMins}m`
          }

          return {
            id: d.id,
            employeeName: d.pegawai?.nama || session?.user?.name || "Nama Pegawai",
            employeeInitials: (d.pegawai?.nama || session?.user?.name || "U").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase(),
            employeeUnit: d.pegawai?.bidang?.nama || "Umum",
            date: new Date(d.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
            checkIn: formatTime(d.jamMasuk),
            checkOut: formatTime(d.jamKeluar),
            status: (statusMap[d.status] || "alpha") as AttendanceRecord["status"],
            lateMinutes: d.status === "TERLAMBAT" ? 15 : 0,
            earlyMinutes: 0,
            method: "selfie",
            location: d.location || "Gedung Utama",
            workHours: calculateHours(d.jamMasuk, d.jamKeluar)
          }
        })
        setRecords(mappedData)
      } catch (error: any) {
        toast.error(`Gagal memuat absensi: ${error.message}`)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [date, isAdmin, selectedMonth, selectedYear, session])

  const statsCards = [
    {
      title: isAdmin ? "Total Pegawai" : "Hari Kerja",
      value: records.length.toString(),
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Hadir",
      value: records.filter(r => r.status === "hadir").length.toString(),
      icon: UserCheck,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "Terlambat",
      value: records.filter(r => r.lateMinutes > 0).length.toString(),
      icon: Timer,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      title: "Izin/Sakit",
      value: records.filter(r => r.status === "izin" || r.status === "sakit").length.toString(),
      icon: AlertCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Cuti",
      value: records.filter(r => r.status === "cuti").length.toString(),
      icon: Plane,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Alpha",
      value: records.filter(r => r.status === "alpha").length.toString(),
      icon: UserX,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ]
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

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)

  const renderTable = () => (
    <Card className="card-premium">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {isAdmin && (
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
                )}
                <TableHead className="w-[180px]">{isAdmin ? "Pegawai" : "Tanggal"}</TableHead>
                {isAdmin && <TableHead>Unit Kerja</TableHead>}
                <TableHead className="text-center">Check In</TableHead>
                <TableHead className="text-center">Check Out</TableHead>
                <TableHead className="text-center">Jam Kerja</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Keterlambatan</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead>Lokasi</TableHead>
                {isAdmin && <TableHead className="text-center">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((record: AttendanceRecord) => {
                  const MethodIcon = (methodConfig as any)[record.method].icon
                  const isSelected = selectedIds.includes(record.id)
                  return (
                    <TableRow key={record.id} className={cn("hover:bg-muted/30", isSelected && "bg-primary/5")}>
                      {isAdmin && (
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
                      )}
                      <TableCell>
                        {isAdmin ? (
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary/10 text-xs text-primary">
                                {record.employeeInitials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{record.employeeName}</span>
                          </div>
                        ) : (
                          <span className="font-medium">{record.date}</span>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-sm text-muted-foreground">
                          {record.employeeUnit}
                        </TableCell>
                      )}
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
                      <TableCell className="text-center font-mono text-sm">
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
                            {record.lateMinutes}m
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
                      <TableCell className="text-sm text-muted-foreground truncate max-w-[120px]">
                        {record.location}
                      </TableCell>
                      {isAdmin && (
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
                      )}
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 11 : 8} className="h-24 text-center text-muted-foreground">
                    Tidak ada data absensi untuk periode ini.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      
      {/* Pagination Container inside Card */}
      <div className="border-t p-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Hal {currentPage} dari {totalPages || 1}
        </p>
        <div className="flex items-center gap-1">
          <Button 
            variant="outline" size="icon" className="h-7 w-7" 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(1)}
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="outline" size="icon" className="h-7 w-7" 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="outline" size="icon" className="h-7 w-7" 
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="outline" size="icon" className="h-7 w-7" 
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(totalPages)}
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
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
              <h1 className="text-2xl font-bold text-foreground">
                {isAdmin ? "Monitoring Absensi" : "Histori Absensi Saya"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isAdmin 
                  ? "Pantau kehadiran seluruh pegawai secara real-time" 
                  : `Rekap absensi Anda bulan ${format(new Date(selectedYear, selectedMonth - 1, 1), "MMMM yyyy", { locale: id })}`
                }
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!isAdmin && (
                <Link href="/absensi/selfie">
                  <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                    <Camera className="h-4 w-4" />
                    Absensi Selfie Sekarang
                  </Button>
                </Link>
              )}
              {isAdmin && (
                <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCSV}>
                  <Download className="h-4 w-4" />
                  Export Rekap
                </Button>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {statsCards.map((card) => (
              <Card key={card.title} className="card-premium">
                <CardContent className="flex items-center gap-4 p-4 text-center sm:text-left">
                  <div className={cn("hidden sm:flex h-10 w-10 items-center justify-center rounded-xl", card.bgColor)}>
                    <card.icon className={cn("h-5 w-5", card.color)} />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{card.value}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{card.title}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters & Actions */}
          <Card className="card-premium mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 flex-wrap items-center gap-3">
                  {isAdmin ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[240px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP", { locale: id }) : <span>Pilih Tanggal</span>}
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
                  ) : (
                    <div className="flex items-center gap-2">
                       <Select 
                        value={String(selectedMonth)} 
                        onValueChange={(v) => setSelectedMonth(Number(v))}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Pilih Bulan" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i + 1} value={String(i + 1)}>
                              {format(new Date(2026, i, 1), "MMMM", { locale: id })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select 
                        value={String(selectedYear)} 
                        onValueChange={(v) => setSelectedYear(Number(v))}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue placeholder="Tahun" />
                        </SelectTrigger>
                        <SelectContent>
                          {[2025, 2026, 2027].map(y => (
                            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={isAdmin ? "Cari nama pegawai..." : "Cari di histori..."}
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                   <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="hadir">Hadir</SelectItem>
                      <SelectItem value="izin">Izin/Sakit</SelectItem>
                      <SelectItem value="cuti">Cuti</SelectItem>
                      <SelectItem value="alpha">Alpha</SelectItem>
                    </SelectContent>
                  </Select>
                  {isAdmin && (
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Unit</SelectItem>
                        {/* Unit items mapping can be added here */}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {isAdmin ? (
            <Tabs defaultValue="harian" className="space-y-4">
              <TabsList>
                <TabsTrigger value="harian">Harian</TabsTrigger>
                <TabsTrigger value="bulanan">Rekap Bulanan</TabsTrigger>
                <TabsTrigger value="anomali">Anomali</TabsTrigger>
                <TabsTrigger value="shift">Jadwal Shift</TabsTrigger>
              </TabsList>
              <TabsContent value="harian" className="space-y-4">
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
                {renderTable()}
              </TabsContent>
              <TabsContent value="bulanan">
                <Card className="card-premium h-40 flex items-center justify-center text-muted-foreground">
                   Modul Rekap Bulanan sedang dalam pengembangan
                </Card>
              </TabsContent>
              <TabsContent value="anomali">
               <Card className="card-premium h-40 flex items-center justify-center text-muted-foreground">
                   Analisis anomali sedang dalam pemrosesan data
                </Card>
              </TabsContent>
              <TabsContent value="shift">
                 <Card className="card-premium h-40 flex items-center justify-center text-muted-foreground">
                   Manajemen shift akan tersedia pada pembaruan berikutnya
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            renderTable()
          )}
        </main>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Absensi — {selectedRecord?.employeeName}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Jam Masuk</label>
                <Input
                  type="time"
                  value={editCheckIn}
                  onChange={(e) => setEditCheckIn(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Jam Keluar</label>
                <Input
                  type="time"
                  value={editCheckOut}
                  onChange={(e) => setEditCheckOut(e.target.value)}
                />
              </div>

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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Simpan Perubahan"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
