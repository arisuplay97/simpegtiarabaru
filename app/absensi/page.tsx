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
  Trash2,
  CheckCircle,
  Eye,
  ChevronDown,
} from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getAbsensiList, checkDeviceAndAbsen,
  deleteAbsensi,
  deleteAllAbsensiByMonth,
  markAllPresentByDate,
  getSystemSettings,
  getRekapBulanan,
  updateAbsensi,
  createAbsensiManual,
  getAbsensiSaya,
  getAbsensiSayaAndSummary
} from "@/lib/actions/absensi"
import { getEmployees } from "@/lib/actions/pegawai"

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
  photoIn: string | null
  photoOut: string | null
  statusPulang?: string
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
    photoIn: null,
    photoOut: null,
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
    photoIn: null,
    photoOut: null,
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
    photoIn: null,
    photoOut: null,
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
    photoIn: null,
    photoOut: null,
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
    photoIn: null,
    photoOut: null,
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
    photoIn: null,
    photoOut: null,
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
    photoIn: null,
    photoOut: null,
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
    photoIn: null,
    photoOut: null,
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
  fingerprint: { label: "Tap Layar", icon: Fingerprint },
  gps: { label: "GPS", icon: MapPin },
  manual: { label: "Manual", icon: Smartphone },
}

export default function AttendancePage() {
  const { data: session } = useSession()
  const isAdmin = ["SUPERADMIN", "HRD", "ADMIN", "DIREKSI"].includes(session?.user?.role || "")

  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Admin Edit States
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null)
  
  // Add Form States
  const [addPegawaiId, setAddPegawaiId] = useState("")
  const [addTanggal, setAddTanggal] = useState(format(new Date(), "yyyy-MM-dd"))
  const [addCheckIn, setAddCheckIn] = useState("08:00")
  const [addCheckOut, setAddCheckOut] = useState("17:00")
  const [addStatus, setAddStatus] = useState("hadir")
  const [employees, setEmployees] = useState<any[]>([])

  const [editCheckIn, setEditCheckIn] = useState("")
  const [editCheckOut, setEditCheckOut] = useState("")
  const [editStatus, setEditStatus] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [settings, setSettings] = useState<{ jamMasuk: string; jamPulang: string; batasTerlambat: number } | null>(null)

  // Viewer State
  const [showPhotoViewer, setShowPhotoViewer] = useState(false)
  const [viewerPhotoUrl, setViewerPhotoUrl] = useState<string | null>(null)
  const [viewerPhotoType, setViewerPhotoType] = useState<"Masuk" | "Pulang">("Masuk")
  const [mySummary, setMySummary] = useState<any>(null)

  // Rekap Bulanan State
  const [rekapBulanan, setRekapBulanan] = useState<any[]>([])
  const [isLoadingRekap, setIsLoadingRekap] = useState(false)
  const [rekapBulan, setRekapBulan] = useState(new Date().getMonth() + 1)
  const [rekapTahun, setRekapTahun] = useState(new Date().getFullYear())
  const [searchRekap, setSearchRekap] = useState("")

  const mapAbsensi = (data: any[], currentSettings: any): AttendanceRecord[] => {
    return data.map((d: any) => {
      const statusMap: Record<string, string> = {
        HADIR: "hadir", IZIN: "izin", SAKIT: "sakit",
        CUTI: "cuti", ALPHA: "alpha", DINAS: "dinas",
        TERLAMBAT: "hadir"
      }

      const formatTime = (dateStr: any) => {
        if (!dateStr) return null
        const dt = new Date(dateStr)
        return dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' })
      }

      const calculateHours = (inTime: any, outTime: any) => {
        if (!inTime || !outTime) return "-"
        const diffMs = new Date(outTime).getTime() - new Date(inTime).getTime()
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
        return `${diffHrs}j ${diffMins}m`
      }

      const methodMap: Record<string, string> = {
        SELFIE: "selfie", FINGERPRINT: "fingerprint",
        GPS: "gps", MANUAL: "manual"
      }

      const name = d.pegawai?.nama || "Tanpa Nama"
      return {
        id: d.id,
        employeeName: name,
        employeeInitials: name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase(),
        employeeUnit: d.pegawai?.bidang?.nama || "Umum",
        date: new Date(d.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        checkIn: formatTime(d.jamMasuk),
        checkOut: formatTime(d.jamKeluar),
        status: (statusMap[d.status] || "alpha") as AttendanceRecord["status"],
        lateMinutes: (() => {
          // Hitung keterlambatan berdasarkan waktu nyata, bukan status DB
          if (!d.jamMasuk || !currentSettings) return 0
          const [h, m] = currentSettings.jamMasuk.split(":").map(Number)
          const checkInTime = new Date(d.jamMasuk)
          const scheduledTime = new Date(checkInTime)
          scheduledTime.setHours(h, m, 0, 0)
          const diffMs = checkInTime.getTime() - scheduledTime.getTime()
          return diffMs > 0 ? Math.floor(diffMs / 60000) : 0
        })(),
        earlyMinutes: 0,
        method: (methodMap[d.metode] || "selfie") as AttendanceRecord["method"],
        location: d.location || "Gedung Utama",
        workHours: calculateHours(d.jamMasuk, d.jamKeluar),
        photoIn: d.fotoMasukUrl || d.foto || null,
        photoOut: d.fotoKeluarUrl || d.fotoKeluar || null,
        statusPulang: (() => {
          if (!d.jamKeluar || !currentSettings) return "-"
          const checkOutDt = new Date(d.jamKeluar)
          const h = checkOutDt.getHours()
          const m = checkOutDt.getMinutes()
          
          const jamPulangSetting = currentSettings.jamPulang || "17:00"
          const [pjh, pjm] = jamPulangSetting.split(":").map(Number)
          
          if (h > pjh || (h === pjh && m >= pjm)) return "Tepat Waktu"
          
          const scheduledOut = new Date(checkOutDt)
          scheduledOut.setHours(pjh, pjm, 0, 0)
          
          const diffMs = scheduledOut.getTime() - checkOutDt.getTime()
          const diffMins = Math.floor(diffMs / 60000)
          
          if (diffMins > 0) return `Pulang cepat ${diffMins}m`
          return "Tepat Waktu"
        })()
      }
    })
  }

  React.useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        let data: any[] = []
        let currentSettings = settings

        if (!currentSettings) {
          const s = await getSystemSettings()
          setSettings(s)
          currentSettings = s
        }

        if (isAdmin) {
          const [d, emps] = await Promise.all([
             getAbsensiList(date, date),
             getEmployees()
          ])
          setEmployees(emps)
          data = d
          setRecords(mapAbsensi(data, currentSettings))
        } else {
          const res = await getAbsensiSayaAndSummary(selectedMonth, selectedYear)
          data = res.records
          setRecords(mapAbsensi(data, currentSettings))
          setMySummary(res.summary)
        }

      } catch (error: any) {
        toast.error(`Gagal memuat absensi: ${error.message}`)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [date, isAdmin, selectedMonth, selectedYear, session])

  // Jika pegawai, gunakan the real accurate summary, jika admin fallback ke count records
  const hKerja = isAdmin ? records.length.toString() : (mySummary?.hariKerjaAktif?.toString() || "0")
  const hHadir = isAdmin ? records.filter(r => r.status === "hadir").length.toString() : (mySummary?.hadir?.toString() || "0")
  const hLate = isAdmin ? records.filter(r => r.lateMinutes > 0).length.toString() : (mySummary?.terlambat?.toString() || "0")
  const hIzin = isAdmin ? records.filter(r => r.status === "izin" || r.status === "sakit").length.toString() : ((mySummary?.izin || 0) + (mySummary?.sakit || 0)).toString()
  const hCuti = isAdmin ? records.filter(r => r.status === "cuti").length.toString() : (mySummary?.cuti?.toString() || "0")
  const hAlpha = isAdmin ? records.filter(r => r.status === "alpha").length.toString() : (mySummary?.alpha?.toString() || "0")

  const statsCards = [
    {
      title: isAdmin ? "Total Pegawai" : "Hari Kerja",
      value: hKerja,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Hadir",
      value: hHadir,
      icon: UserCheck,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "Terlambat",
      value: hLate,
      icon: Timer,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      title: "Izin/Sakit",
      value: hIzin,
      icon: AlertCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Cuti",
      value: hCuti,
      icon: Plane,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Alpha",
      value: hAlpha,
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

    const res = await updateAbsensi(selectedRecord.id, {
      status: editStatus,
      jamMasuk: editCheckIn || null,
      jamKeluar: editCheckOut || null,
    })

    if (res.success) {
      toast.success(`Absensi ${selectedRecord.employeeName} berhasil diperbarui`)
      setShowEditDialog(false)
      // Refresh data dari server
      const d = await getAbsensiList(date, date)
      setRecords(mapAbsensi(d, settings))
    } else {
      toast.error(res.error || "Gagal menyimpan perubahan")
    }

    setIsLoading(false)
  }

  const handleSaveAdd = async () => {
    if (!addPegawaiId || !addTanggal || !addStatus) {
      toast.error("Data tidak lengkap")
      return
    }
    setIsLoading(true)

    const res = await createAbsensiManual({
      pegawaiId: addPegawaiId,
      tanggal: addTanggal,
      status: addStatus,
      jamMasuk: addCheckIn || undefined,
      jamKeluar: addCheckOut || undefined
    })

    if (res.success) {
      toast.success(`Absensi manual berhasil ditambahkan`)
      setShowAddDialog(false)
      // Refresh
      const d = await getAbsensiList(date, date)
      setRecords(mapAbsensi(d, settings))
    } else {
      toast.error(res.error || "Gagal menyimpan absensi manual")
    }

    setIsLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data absensi ini?")) return

    setIsLoading(true)
    const res = await deleteAbsensi(id)
    if (res.success) {
      toast.success("Data absensi berhasil dihapus")
      // Refresh data
      if (isAdmin) {
        const d = await getAbsensiList(date, date)
        setRecords(mapAbsensi(d, settings))
      } else {
        const d = await getAbsensiSaya(selectedMonth, selectedYear)
        setRecords(mapAbsensi(d, settings))
      }
    } else {
      toast.error(res.error || "Gagal menghapus data")
    }
    setIsLoading(false)
  }

  const handleMarkAllPresent = async () => {
    if (!date) return toast.error("Silakan pilih tanggal terlebih dahulu di filter")

    const dateStr = format(date, "yyyy-MM-dd")
    const displayDate = format(date, "dd MMMM yyyy", { locale: id })

    if (!confirm(`Apakah Anda yakin ingin memarkir status "HADIR" untuk SEMUA PEGAWAI AKTIF yang belum absen pada tanggal ${displayDate}?`)) return

    setIsLoading(true)
    const res = await markAllPresentByDate(dateStr)
    if (res.success) {
      if (res.count === 0) {
        toast.info(res.message || "Semua pegawai aktif sudah memiliki data absensi")
      } else {
        toast.success(`${res.count} pegawai berhasil ditandai hadir pada ${displayDate}`)
        const d = await getAbsensiList(date, date)
        setRecords(mapAbsensi(d, settings))
      }
    } else {
      toast.error(res.error || "Gagal mencatat kehadiran massal")
    }
    setIsLoading(false)
  }

  const handleDeleteAllMonth = async () => {
    const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`
    if (!confirm(`DANGER ZONE [KHUSUS TESTING]: Anda yakin ingin menghapus SELURUH data absensi pegawai untuk bulan ${format(new Date(selectedYear, selectedMonth - 1, 1), "MMMM yyyy", { locale: id })}?\n\nTindakan ini menghapus permanen seluruh absensi di bulan ini!`)) return

    setIsLoading(true)
    const res = await deleteAllAbsensiByMonth(monthStr)
    if (res.success) {
      toast.success(`${res.count} data absensi bulan ini berhasil dihapus permanen`)
      // Refresh list for the current viewed date
      if (isAdmin) {
        const d = await getAbsensiList(date, date)
        setRecords(mapAbsensi(d, settings))
      } else {
        const d = await getAbsensiSaya(selectedMonth, selectedYear)
        setRecords(mapAbsensi(d, settings))
      }
    } else {
      toast.error(res.error || "Gagal menghapus absensi")
    }
    setIsLoading(false)
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
                <TableHead className="text-center">Status Pulang</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead>Lokasi</TableHead>
                {isAdmin && <TableHead className="w-[100px] text-center">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((record: AttendanceRecord) => {
                  const methodInfo = (methodConfig as any)[record.method] || methodConfig.selfie
                  const MethodIcon = methodInfo.icon
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
                      <TableCell className="text-center font-mono">
                        {record.checkIn
                          ? record.checkIn
                          : record.status === "cuti"
                          ? <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">Cuti</span>
                          : "-"}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {record.checkOut
                          ? record.checkOut
                          : record.status === "cuti"
                          ? <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">Cuti</span>
                          : "-"}
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
                          <Badge variant="outline" className="bg-red-50 text-red-700 font-mono">
                            {record.lateMinutes}m
                          </Badge>
                        ) : (
                          <span className="text-emerald-600 font-mono">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                         {record.statusPulang === "-" ? (
                           <span className="text-muted-foreground font-mono">-</span>
                         ) : record.statusPulang === "Tepat Waktu" ? (
                           <Badge variant="outline" className="bg-emerald-50 text-emerald-700 font-mono">
                             Tepat Waktu
                           </Badge>
                         ) : (
                           <Badge variant="outline" className="bg-amber-50 text-amber-700 font-mono">
                             {record.statusPulang}
                           </Badge>
                         )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <MethodIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs uppercase font-medium">{methodInfo.label}</span>
                          {record.method === "selfie" && (record.photoIn || record.photoOut) && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 ml-1 text-primary hover:text-primary/80 hover:bg-primary/10"
                              onClick={(e) => {
                                e.stopPropagation()
                                setViewerPhotoUrl(record.photoIn || record.photoOut)
                                setViewerPhotoType(record.photoIn ? "Masuk" : "Pulang")
                                setShowPhotoViewer(true)
                              }}
                              title="Lihat Foto Absensi"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground truncate max-w-[150px]">
                        {record.location}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => handleOpenEdit(record)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(record.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 11 : 8} className="h-24 text-center text-muted-foreground italic">
                    Belum ada data absensi untuk periode ini.
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
            onClick={() => setCurrentPage((prev: number) => prev - 1)}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="outline" size="icon" className="h-7 w-7" 
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage((prev: number) => prev + 1)}
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
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="default" size="sm" className="gap-2">
                        Aksi Admin
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuLabel>Pilih Aksi</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setShowAddDialog(true)} className="gap-2 cursor-pointer">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        Tambah Manual
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleMarkAllPresent} className="gap-2 cursor-pointer">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        Hadirkan Semua
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleDeleteAllMonth} className="gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                        Hapus Absensi Bulan Ini
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCSV}>
                    <Download className="h-4 w-4" />
                    Export Rekap
                  </Button>
                </>
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
                {/* Filter Rekap Bulanan */}
                <Card className="card-premium mb-4">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <Select value={String(rekapBulan)} onValueChange={(v) => setRekapBulan(Number(v))}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Bulan" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i + 1} value={String(i + 1)}>
                              {format(new Date(2026, i, 1), "MMMM", { locale: id })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={String(rekapTahun)} onValueChange={(v) => setRekapTahun(Number(v))}>
                        <SelectTrigger className="w-[100px]">
                          <SelectValue placeholder="Tahun" />
                        </SelectTrigger>
                        <SelectContent>
                          {[2024, 2025, 2026, 2027].map(y => (
                            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={async () => {
                          setIsLoadingRekap(true)
                          const data = await getRekapBulanan(rekapBulan, rekapTahun)
                          setRekapBulanan(data)
                          setIsLoadingRekap(false)
                        }}
                        disabled={isLoadingRekap}
                        className="gap-2"
                      >
                        {isLoadingRekap ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
                        Tampilkan Rekap
                      </Button>
                      <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Cari nama pegawai..."
                          className="pl-9"
                          value={searchRekap}
                          onChange={(e) => setSearchRekap(e.target.value)}
                        />
                      </div>
                      {rekapBulanan.length > 0 && (
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => {
                          const headers = ["Nama","Unit","Jabatan","Hari Efektif","Total Hari Kerja","Hadir","Alpha","Izin","Sakit","Cuti","Dinas","Terlambat","% Hadir"]
                          const rows = rekapBulanan.map((r: any) => [
                            r.nama, r.bidang, r.jabatan, r.hariKerjaAktif, r.hariKerja, r.hadir, r.alpha, r.izin, r.sakit, r.cuti, r.dinas, r.terlambat,
                            `${Math.round((r.hadir / (r.hariKerjaAktif || 1)) * 100)}%`
                          ].join(","))
                          const csv = [headers.join(","), ...rows].join("\n")
                          const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
                          const link = document.createElement("a")
                          link.href = URL.createObjectURL(blob)
                          link.download = `rekap_${rekapBulan}_${rekapTahun}.csv`
                          link.click()
                          toast.success("File CSV berhasil diunduh")
                        }}>
                          <Download className="h-4 w-4" /> Export CSV
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {rekapBulanan.length === 0 ? (
                  <Card className="card-premium">
                    <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-3">
                      <TrendingUp className="h-10 w-10 opacity-20" />
                      <p className="text-sm">Pilih bulan & tahun, lalu klik <strong>Tampilkan Rekap</strong></p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="card-premium">
                    <CardHeader className="pb-2 pt-4 px-5">
                      <CardTitle className="text-base">
                        Rekap Kehadiran — {format(new Date(rekapTahun, rekapBulan - 1, 1), "MMMM yyyy", { locale: id })}
                        <span className="ml-2 text-sm font-normal text-muted-foreground">({rekapBulanan.length} pegawai)</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50 text-xs">
                              <TableHead className="w-[180px]">Pegawai</TableHead>
                              <TableHead>Unit</TableHead>
                              <TableHead className="text-center text-xs text-muted-foreground w-[100px]">Efektif /<br/>Kerja</TableHead>
                              <TableHead className="text-center text-emerald-700">Hadir</TableHead>
                              <TableHead className="text-center text-red-600">Alpha</TableHead>
                              <TableHead className="text-center text-blue-600">Izin</TableHead>
                              <TableHead className="text-center text-amber-600">Sakit</TableHead>
                              <TableHead className="text-center text-purple-600">Cuti</TableHead>
                              <TableHead className="text-center text-cyan-600">Dinas</TableHead>
                              <TableHead className="text-center text-orange-600">Terlambat</TableHead>
                              <TableHead className="text-center">% Hadir</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rekapBulanan
                              .filter((r: any) => r.nama.toLowerCase().includes(searchRekap.toLowerCase()))
                              .map((r: any) => {
                                const persen = Math.round((r.hadir / (r.hariKerjaAktif || 1)) * 100)
                                const persenColor = persen >= 90
                                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                  : persen >= 75
                                  ? "bg-amber-100 text-amber-700 border-amber-200"
                                  : "bg-red-100 text-red-700 border-red-200"
                                return (
                                  <TableRow key={r.id} className="hover:bg-muted/30">
                                    <TableCell>
                                      <div>
                                        <p className="font-medium text-sm">{r.nama}</p>
                                        <p className="text-[11px] text-muted-foreground">{r.jabatan}</p>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{r.bidang}</TableCell>
                                    <TableCell className="text-center font-mono text-sm text-muted-foreground">{r.hariKerjaAktif} / {r.hariKerja}</TableCell>
                                    <TableCell className="text-center font-bold text-emerald-600">{r.hadir}</TableCell>
                                    <TableCell className="text-center font-bold text-red-500">{r.alpha || "-"}</TableCell>
                                    <TableCell className="text-center font-semibold text-blue-500">{r.izin || "-"}</TableCell>
                                    <TableCell className="text-center font-semibold text-amber-500">{r.sakit || "-"}</TableCell>
                                    <TableCell className="text-center font-semibold text-purple-500">{r.cuti || "-"}</TableCell>
                                    <TableCell className="text-center font-semibold text-cyan-500">{r.dinas || "-"}</TableCell>
                                    <TableCell className="text-center">
                                      {r.terlambat > 0 ? (
                                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 font-mono">
                                          {r.terlambat}x
                                        </Badge>
                                      ) : <span className="text-muted-foreground">-</span>}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <Badge variant="outline" className={persenColor}>{persen}%</Badge>
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}
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

        {/* Add Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Tambah Absensi Manual</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Pegawai</label>
                <Select value={addPegawaiId} onValueChange={setAddPegawaiId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Pegawai" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[250px]">
                    {employees.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.nama} — {e.nik}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

               <div>
                <label className="mb-1.5 block text-sm font-medium">Tanggal</label>
                <Input
                  type="date"
                  value={addTanggal}
                  onChange={(e) => setAddTanggal(e.target.value)}
                />
              </div>

               <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Jam Masuk</label>
                  <Input
                    type="time"
                    value={addCheckIn}
                    onChange={(e) => setAddCheckIn(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Jam Keluar</label>
                  <Input
                    type="time"
                    value={addCheckOut}
                    onChange={(e) => setAddCheckOut(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Status</label>
                <Select value={addStatus} onValueChange={setAddStatus}>
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
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Batal
              </Button>
              <Button onClick={handleSaveAdd} disabled={isLoading || !addPegawaiId}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Simpan Absensi"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Photo Viewer Dialog */}
        <Dialog open={showPhotoViewer} onOpenChange={setShowPhotoViewer}>
          <DialogContent className="max-w-md p-0 overflow-hidden bg-background">
            <DialogHeader className="px-4 py-3 border-b bg-muted/30">
              <DialogTitle className="text-base font-semibold">Bukti Absensi {viewerPhotoType}</DialogTitle>
            </DialogHeader>
            <div className="p-4 flex flex-col items-center justify-center min-h-[300px] bg-black/5">
              {viewerPhotoUrl ? (
                <img 
                  src={viewerPhotoUrl} 
                  alt={`Foto ${viewerPhotoType}`} 
                  className="max-w-full max-h-[60vh] object-contain rounded-md shadow-sm border border-border"
                />
              ) : (
                <div className="flex flex-col items-center text-muted-foreground gap-2">
                  <Camera className="h-10 w-10 opacity-20" />
                  <p className="text-sm">Foto tidak tersedia</p>
                </div>
              )}
            </div>
            <DialogFooter className="px-4 py-3 border-t bg-muted/30">
              <Button variant="outline" onClick={() => setShowPhotoViewer(false)}>Tutup Viewer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
