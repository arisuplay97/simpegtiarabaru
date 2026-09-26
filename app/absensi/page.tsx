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
  CalendarDays,
  ExternalLink,
  Sparkles,
  Bell,
  RefreshCw,
  AlertOctagon,
  RotateCcw,
  Filter,
  Clock3,
  MessageSquare,
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
  markAllUnrecordedAsAlpha,
  sendAttendanceReminderToUnrecorded,
  getSystemSettings,
  getRekapBulanan,
  updateAbsensi,
  createAbsensiManual,
  getAbsensiSaya,
  getAbsensiSayaAndSummary
} from "@/lib/actions/absensi"
import { getEmployees } from "@/lib/actions/pegawai"
import { isCabangOnDate } from "@/lib/utils/pegawai-cabang"

interface AttendanceRecord {
  id: string
  pegawaiId?: string
  employeeName: string
  employeeInitials: string
  employeeNik?: string
  employeeUnit: string
  date: string
  rawDate?: Date
  checkIn: string | null
  checkSiang?: string | null
  checkOut: string | null
  status: "hadir" | "izin" | "sakit" | "cuti" | "alpha" | "dinas"
  lateMinutes: number
  earlyMinutes: number
  method: "selfie" | "fingerprint" | "gps" | "manual"
  location: string
  workHours: string
  photoIn: string | null
  photoSiang?: string | null
  photoOut: string | null
  statusPulang?: string
  isCabang?: boolean
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



function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return "-"
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (hours > 0 && remainingMinutes > 0) {
    return `${hours} jam ${remainingMinutes} menit`
  } else if (hours > 0) {
    return `${hours} jam`
  } else {
    return `${remainingMinutes} menit`
  }
}

const statusConfig = {
  hadir: { label: "Hadir", className: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50 font-semibold shadow-2xs" },
  izin: { label: "Izin", className: "bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/50 font-semibold shadow-2xs" },
  sakit: { label: "Sakit", className: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50 font-semibold shadow-2xs" },
  cuti: { label: "Cuti", className: "bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50 font-semibold shadow-2xs" },
  alpha: { label: "Alpha", className: "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50 font-semibold shadow-2xs" },
  dinas: { label: "Dinas Luar", className: "bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/50 font-semibold shadow-2xs" },
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

  const [unitFilter, setUnitFilter] = useState<string>("all")
  const [penempatanFilter, setPenempatanFilter] = useState<string>("all")
  const [anomaliCategory, setAnomaliCategory] = useState<string>("all")

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
  const [searchAddPegawai, setSearchAddPegawai] = useState("")

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
        CUTI: "cuti", ALPHA: "alpha", ALPA: "alpha", DINAS: "dinas",
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
      const isCab = Boolean(d.pegawai && isCabangOnDate(d.pegawai, new Date(d.tanggal)))

      return {
        id: d.id,
        pegawaiId: d.pegawaiId || d.pegawai?.id,
        employeeName: name,
        employeeInitials: name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase(),
        employeeNik: d.pegawai?.nik || "-",
        employeeUnit: d.pegawai?.bidang?.nama || "Umum",
        date: new Date(d.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        rawDate: new Date(d.tanggal),
        checkIn: formatTime(d.jamMasuk),
        checkSiang: formatTime(d.jamSiang),
        checkOut: formatTime(d.jamKeluar),
        isCabang: isCab,
        status: (statusMap[d.status] || "alpha") as AttendanceRecord["status"],
        lateMinutes: (() => {
          if (!d.jamMasuk || !currentSettings) return 0
          const [h, m] = (currentSettings.jamMasuk || "08:00").split(":").map(Number)
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
          
          if (diffMins > 0) return `Pulang cepat ${formatDuration(diffMins)}`
          return "Tepat Waktu"
        })()
      }
    })
  }

  const loadData = React.useCallback(async () => {
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
  }, [date, isAdmin, selectedMonth, selectedYear, settings])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  // Daftar pegawai aktif yang belum melakukan presensi pada tanggal terpilih
  const unrecordedEmployees = React.useMemo(() => {
    if (!isAdmin || !employees || employees.length === 0) return []
    const recordedIds = new Set(records.map(r => r.pegawaiId || "").filter(Boolean))
    return employees.filter(emp => !recordedIds.has(emp.id))
  }, [isAdmin, employees, records])

  // Deteksi anomali kehadiran real-time
  const anomalies = React.useMemo(() => {
    if (!isAdmin || !records || records.length === 0) return []
    const now = new Date()
    const nowWita = new Date(now.getTime() + 8 * 60 * 60 * 1000)
    const currentHourWita = nowWita.getUTCHours()
    const currentMinWita = nowWita.getUTCMinutes()
    const curTimeMinutes = currentHourWita * 60 + currentMinWita

    const todayDateStr = format(now, "yyyy-MM-dd")
    const selectedDateStr = date ? format(date, "yyyy-MM-dd") : todayDateStr
    const isSelectedToday = selectedDateStr === todayDateStr

    const [pjH = 17, pjM = 0] = (settings?.jamPulang || "17:00").split(":").map(Number)
    const jamPulangMinutes = pjH * 60 + pjM

    const list: Array<{
      id: string
      record: AttendanceRecord
      type: "no_checkout" | "no_siang" | "late_high" | "early_checkout"
      title: string
      desc: string
      badgeClass: string
    }> = []

    records.forEach(r => {
      // 1. Belum Checkout padahal jam pulang sudah lewat
      if (r.checkIn && !r.checkOut && (r.status === "hadir" || (r.status as string) === "terlambat")) {
        if (!isSelectedToday || curTimeMinutes > jamPulangMinutes + 15) {
          list.push({
            id: `nc_${r.id}`,
            record: r,
            type: "no_checkout",
            title: "Belum Check-out",
            desc: `Check-in ${r.checkIn} WITA, belum check-out melewati jam pulang kantor (${settings?.jamPulang || "17:00"} WITA)`,
            badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
          })
        }
      }

      // 2. Lupa Absen Siang (Khusus Kantor Pusat)
      if (!r.isCabang && r.checkIn && !r.checkSiang && r.status === "hadir") {
        if (!isSelectedToday || curTimeMinutes > 14 * 60) {
          list.push({
            id: `ns_${r.id}`,
            record: r,
            type: "no_siang",
            title: "Tanpa Absen Siang",
            desc: `Pegawai Kantor Pusat tidak melakukan presensi siang (11:30 - 14:00 WITA)`,
            badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
          })
        }
      }

      // 3. Terlambat Berat (> 30 menit)
      if (r.lateMinutes > 30) {
        list.push({
          id: `lh_${r.id}`,
          record: r,
          type: "late_high",
          title: "Terlambat Berat",
          desc: `Terlambat ${formatDuration(r.lateMinutes)} (Check-in ${r.checkIn} WITA)`,
          badgeClass: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300"
        })
      }

      // 4. Pulang Cepat
      if (r.statusPulang && r.statusPulang.includes("Pulang cepat")) {
        list.push({
          id: `ec_${r.id}`,
          record: r,
          type: "early_checkout",
          title: "Pulang Cepat",
          desc: `Check-out pukul ${r.checkOut} WITA (${r.statusPulang})`,
          badgeClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300"
        })
      }
    })

    return list
  }, [isAdmin, records, date, settings])

  // Opsi Unit Kerja unik dari data pegawai
  const unitOptions = React.useMemo(() => {
    if (!employees || employees.length === 0) return []
    const names = new Set<string>()
    employees.forEach(e => {
      const u = e.bidang?.nama
      if (u) names.add(u.trim())
    })
    return Array.from(names).sort()
  }, [employees])

  // Filter anomali per kategori
  const filteredAnomalies = React.useMemo(() => {
    if (anomaliCategory === "all") return anomalies
    return anomalies.filter(a => a.type === anomaliCategory)
  }, [anomalies, anomaliCategory])

  // Filter unrecorded employees
  const filteredUnrecorded = React.useMemo(() => {
    return unrecordedEmployees.filter((emp) => {
      const matchSearch =
        emp.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.nik && emp.nik.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (emp.bidang?.nama && emp.bidang.nama.toLowerCase().includes(searchQuery.toLowerCase()))
      if (!matchSearch) return false

      if (unitFilter !== "all" && emp.bidang?.nama?.toLowerCase() !== unitFilter.toLowerCase()) {
        return false
      }

      const isCab = isCabangOnDate(emp, date || new Date())
      if (penempatanFilter === "pusat" && isCab) return false
      if (penempatanFilter === "cabang" && !isCab) return false

      return true
    })
  }, [unrecordedEmployees, searchQuery, unitFilter, penempatanFilter, date])

  // Data terfilter untuk tabel harian
  const filteredData = React.useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.employeeNik && r.employeeNik.toLowerCase().includes(searchQuery.toLowerCase())) ||
        r.employeeUnit.toLowerCase().includes(searchQuery.toLowerCase())
      if (!matchSearch) return false

      if (unitFilter !== "all" && r.employeeUnit.toLowerCase() !== unitFilter.toLowerCase()) {
        return false
      }

      if (penempatanFilter === "pusat" && r.isCabang) return false
      if (penempatanFilter === "cabang" && !r.isCabang) return false

      if (statusFilter === "all") return true
      if (statusFilter === "terlambat") return r.lateMinutes > 0
      if (statusFilter === "hadir") return r.status === "hadir" && r.lateMinutes === 0
      if (statusFilter === "izin_sakit") return r.status === "izin" || r.status === "sakit"
      return r.status === statusFilter
    })
  }, [records, searchQuery, unitFilter, penempatanFilter, statusFilter])

  // Stats Card Calculations
  const totalEmployeesCount = isAdmin ? employees.length : (mySummary?.hariKerjaAktif || 0)
  const hHadirCount = records.filter(r => r.status === "hadir").length
  const hLateCount = records.filter(r => r.lateMinutes > 0).length
  const hIzinCount = records.filter(r => r.status === "izin" || r.status === "sakit").length
  const hCutiCount = records.filter(r => r.status === "cuti").length
  const hAlphaCount = records.filter(r => r.status === "alpha").length
  const belumAbsenCount = unrecordedEmployees.length
  const persenHadir = isAdmin 
    ? (totalEmployeesCount > 0 ? Math.round((hHadirCount / totalEmployeesCount) * 100) : 0)
    : (mySummary?.hariKerjaAktif ? Math.round((mySummary.hadir / mySummary.hariKerjaAktif) * 100) : 0)

  const statsCards = isAdmin ? [
    {
      title: "Total Pegawai",
      value: totalEmployeesCount.toString(),
      subtext: "Pegawai Aktif",
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10 border border-blue-500/20",
    },
    {
      title: "Sudah Hadir",
      value: hHadirCount.toString(),
      subtext: `${persenHadir}% Terpenuhi`,
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10 border border-emerald-500/20",
    },
    {
      title: "Belum Absen",
      value: belumAbsenCount.toString(),
      subtext: belumAbsenCount > 0 ? "Perlu Diingatkan" : "Semua Masuk",
      icon: AlertCircle,
      color: belumAbsenCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400",
      bgColor: belumAbsenCount > 0 ? "bg-rose-500/10 border border-rose-500/20" : "bg-emerald-500/10 border border-emerald-500/20",
    },
    {
      title: "Terlambat",
      value: hLateCount.toString(),
      subtext: "Melewati batas toleransi",
      icon: Timer,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10 border border-amber-500/20",
    },
    {
      title: "Izin / Cuti",
      value: (hIzinCount + hCutiCount).toString(),
      subtext: `${hIzinCount} Izin/Sakit · ${hCutiCount} Cuti`,
      icon: Plane,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-500/10 border border-purple-500/20",
    },
    {
      title: "Tingkat Kehadiran",
      value: `${persenHadir}%`,
      subtext: "Skor Harian",
      icon: TrendingUp,
      color: "text-teal-600 dark:text-teal-400",
      bgColor: "bg-teal-500/10 border border-teal-500/20",
    },
  ] : [
    {
      title: "Hari Kerja",
      value: mySummary?.hariKerjaAktif?.toString() || "0",
      subtext: "Bulan Berjalan",
      icon: Calendar,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10 border border-blue-500/20",
    },
    {
      title: "Hadir",
      value: mySummary?.hadir?.toString() || "0",
      subtext: `${persenHadir}% Kehadiran`,
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10 border border-emerald-500/20",
    },
    {
      title: "Terlambat",
      value: mySummary?.terlambat?.toString() || "0",
      subtext: "Kali Keterlambatan",
      icon: Timer,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10 border border-amber-500/20",
    },
    {
      title: "Izin / Sakit",
      value: ((mySummary?.izin || 0) + (mySummary?.sakit || 0)).toString(),
      subtext: "Pengajuan Resmi",
      icon: AlertCircle,
      color: "text-sky-600 dark:text-sky-400",
      bgColor: "bg-sky-500/10 border border-sky-500/20",
    },
    {
      title: "Cuti",
      value: mySummary?.cuti?.toString() || "0",
      subtext: "Hari Cuti",
      icon: Plane,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-500/10 border border-purple-500/20",
    },
    {
      title: "Alpha",
      value: mySummary?.alpha?.toString() || "0",
      subtext: "Tanpa Keterangan",
      icon: UserX,
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-500/10 border border-rose-500/20",
    },
  ]
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState<number>(15)

  // Pagination untuk Tab Belum Absen
  const [unrecordedPage, setUnrecordedPage] = useState(1)
  const [unrecordedPerPage, setUnrecordedPerPage] = useState<number>(15)

  const paginatedUnrecorded = React.useMemo(() => {
    return filteredUnrecorded.slice(
      (unrecordedPage - 1) * unrecordedPerPage,
      unrecordedPage * unrecordedPerPage
    )
  }, [filteredUnrecorded, unrecordedPage, unrecordedPerPage])

  const totalUnrecordedPages = Math.ceil(filteredUnrecorded.length / unrecordedPerPage)

  React.useEffect(() => {
    setUnrecordedPage(1)
  }, [searchQuery, unitFilter, penempatanFilter, date])

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
        await loadData()
      }
    } else {
      toast.error(res.error || "Gagal mencatat kehadiran massal")
    }
    setIsLoading(false)
  }

  const handleMarkAllAlpha = async () => {
    if (!date) return toast.error("Silakan pilih tanggal terlebih dahulu di filter")
    const dateStr = format(date, "yyyy-MM-dd")
    const displayDate = format(date, "dd MMMM yyyy", { locale: id })

    if (unrecordedEmployees.length === 0) {
      return toast.info("Tidak ada pegawai yang belum absen pada tanggal ini")
    }

    if (!confirm(`Tandai ALPHA untuk ${unrecordedEmployees.length} pegawai yang belum absen pada ${displayDate}?`)) return

    setIsLoading(true)
    const res = await markAllUnrecordedAsAlpha(dateStr)
    if (res.success) {
      toast.success(`${res.count} pegawai berhasil ditandai Alpha pada ${displayDate}`)
      await loadData()
    } else {
      toast.error(res.error || "Gagal menandai Alpha massal")
    }
    setIsLoading(false)
  }

  const handleSendReminder = async () => {
    if (!date) return toast.error("Silakan pilih tanggal terlebih dahulu di filter")
    const dateStr = format(date, "yyyy-MM-dd")

    if (unrecordedEmployees.length === 0) {
      return toast.info("Seluruh pegawai sudah melakukan presensi hari ini!")
    }

    setIsLoading(true)
    const res = await sendAttendanceReminderToUnrecorded(dateStr)
    if (res.success) {
      toast.success(res.message || `Notifikasi pengingat presensi dikirim ke ${res.count} pegawai`)
    } else {
      toast.error(res.error || "Gagal mengirim notifikasi")
    }
    setIsLoading(false)
  }

  const handleQuickMarkHadir = async (pegawaiId: string, nama: string) => {
    if (!date) return
    const dateStr = format(date, "yyyy-MM-dd")
    setIsLoading(true)
    const res = await createAbsensiManual({
      pegawaiId,
      tanggal: dateStr,
      status: "hadir",
      jamMasuk: settings?.jamMasuk || "08:00",
      jamKeluar: settings?.jamPulang || "17:00",
    })
    if (res.success) {
      toast.success(`Berhasil menandai Hadir untuk ${nama}`)
      await loadData()
    } else {
      toast.error(res.error || "Gagal mencatat presensi")
    }
    setIsLoading(false)
  }

  const handleQuickMarkAlpha = async (pegawaiId: string, nama: string) => {
    if (!date) return
    const dateStr = format(date, "yyyy-MM-dd")
    setIsLoading(true)
    const res = await createAbsensiManual({
      pegawaiId,
      tanggal: dateStr,
      status: "alpha",
    })
    if (res.success) {
      toast.success(`Berhasil menandai Alpha untuk ${nama}`)
      await loadData()
    } else {
      toast.error(res.error || "Gagal mencatat presensi")
    }
    setIsLoading(false)
  }

  const handleOpenAddForEmployee = (pegawaiId: string) => {
    setAddPegawaiId(pegawaiId)
    if (date) setAddTanggal(format(date, "yyyy-MM-dd"))
    setAddStatus("hadir")
    setAddCheckIn(settings?.jamMasuk || "08:00")
    setAddCheckOut(settings?.jamPulang || "17:00")
    setShowAddDialog(true)
  }

  const handleResetFilters = () => {
    setDate(new Date())
    setSearchQuery("")
    setStatusFilter("all")
    setUnitFilter("all")
    setPenempatanFilter("all")
    toast.info("Filter telah direset ke default")
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
    const headers = ["Nama", "Unit", "Check In", "Check Siang", "Check Out", "Status", "Lokasi"]
    const csvData = filteredData.map((r: AttendanceRecord) =>
      [r.employeeName, r.employeeUnit, r.checkIn || "-", r.checkSiang || "-", r.checkOut || "-", r.status, r.location].join(",")
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

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)

  const renderTable = () => (
    <Card className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md shadow-xs overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 dark:bg-zinc-800/50 border-b border-slate-200/80 dark:border-zinc-800">
                {isAdmin && (
                  <TableHead className="w-[40px] pl-4">
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
                <TableHead className="w-[190px] text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-300 py-3.5">
                  {isAdmin ? "Pegawai" : "Tanggal"}
                </TableHead>
                {isAdmin && (
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-300 py-3.5">
                    Unit Kerja
                  </TableHead>
                )}                <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-300 py-3.5">
                  Check In
                </TableHead>
                <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-300 py-3.5">
                  Absen Siang
                </TableHead>
                <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-300 py-3.5">
                  Check Out
                </TableHead>
                <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-300 py-3.5">
                  Jam Kerja
                </TableHead>
                <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-300 py-3.5">
                  Status
                </TableHead>
                <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-300 py-3.5">
                  Keterlambatan
                </TableHead>
                <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-300 py-3.5">
                  Status Pulang
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-300 py-3.5">
                  Metode
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-300 py-3.5">
                  Lokasi
                </TableHead>
                {isAdmin && (
                  <TableHead className="w-[100px] text-center text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-300 py-3.5 pr-4">
                    Aksi
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((record: AttendanceRecord) => {
                  const methodInfo = (methodConfig as any)[record.method] || methodConfig.selfie
                  const MethodIcon = methodInfo.icon
                  const isSelected = selectedIds.includes(record.id)
                  return (
                    <TableRow 
                      key={record.id} 
                      className={cn(
                        "hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors border-b border-slate-100 dark:border-zinc-800/60",
                        isSelected && "bg-primary/5 dark:bg-primary/10"
                      )}
                    >
                      {isAdmin && (
                        <TableCell className="pl-4 py-3">
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
                      <TableCell className="py-3">
                        {isAdmin ? (
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8 rounded-xl border border-primary/20">
                              <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-bold">
                                {record.employeeInitials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-xs text-slate-900 dark:text-zinc-100 truncate max-w-[170px]" title={record.employeeName}>
                              {record.employeeName}
                            </span>
                          </div>
                        ) : (
                          <span className="font-medium text-xs">{record.date}</span>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-xs text-muted-foreground py-3 max-w-[160px] truncate" title={record.employeeUnit}>
                          {record.employeeUnit}
                        </TableCell>
                      )}
                      <TableCell className="text-center font-mono text-xs tabular-nums font-semibold py-3 text-slate-800 dark:text-zinc-200">
                        {record.checkIn
                          ? record.checkIn
                          : record.status === "cuti"
                          ? <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-md border border-purple-200/60 dark:border-purple-800/50">Cuti</span>
                          : "-"}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs tabular-nums font-semibold py-3 text-slate-800 dark:text-zinc-200">
                        {record.isCabang ? (
                          <span className="text-[10px] text-muted-foreground font-normal bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">Cabang</span>
                        ) : record.checkSiang ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{record.checkSiang}</span>
                        ) : record.status === "cuti" || record.status === "alpha" || record.status === "izin" || record.status === "sakit" ? (
                          <span className="text-muted-foreground">-</span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 text-[10px] font-medium bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200/50">Belum</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs tabular-nums font-semibold py-3 text-slate-800 dark:text-zinc-200">
                        {record.checkOut
                          ? record.checkOut
                          : record.status === "cuti"
                          ? <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-md border border-purple-200/60 dark:border-purple-800/50">Cuti</span>
                          : "-"}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs font-semibold py-3 text-slate-700 dark:text-zinc-300">
                        {record.workHours}
                      </TableCell>
                      <TableCell className="text-center py-3">
                        <Badge
                          variant="outline"
                          className={cn("text-[11px] px-2.5 py-0.5 rounded-lg whitespace-nowrap", (statusConfig as any)[record.status]?.className)}
                        >
                          {(statusConfig as any)[record.status]?.label || record.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center py-3">
                        {record.lateMinutes > 0 ? (
                          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50 font-medium text-xs px-2.5 py-0.5 rounded-lg whitespace-nowrap shadow-2xs">
                            {formatDuration(record.lateMinutes)}
                          </Badge>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium text-xs">Tepat Waktu</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center py-3">
                         {record.statusPulang === "-" ? (
                            <span className="text-muted-foreground font-mono text-xs">-</span>
                         ) : record.statusPulang === "Tepat Waktu" ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50 font-medium text-xs px-2.5 py-0.5 rounded-lg whitespace-nowrap shadow-2xs">
                              Tepat Waktu
                            </Badge>
                         ) : (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50 font-medium text-xs px-2.5 py-0.5 rounded-lg whitespace-nowrap shadow-2xs">
                              {record.statusPulang}
                            </Badge>
                         )}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1.5">
                          <MethodIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-[11px] uppercase font-medium">{methodInfo.label}</span>
                          {record.method === "selfie" && (record.photoIn || record.photoOut) && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 ml-0.5 text-primary hover:text-primary/80 hover:bg-primary/10 rounded-lg"
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
                      <TableCell className="text-xs text-muted-foreground truncate max-w-[140px] py-3" title={record.location}>
                        {record.location}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="py-3 pr-4">
                          <div className="flex items-center justify-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg"
                              onClick={() => handleOpenEdit(record)}
                              title="Edit Absensi"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                              onClick={() => handleDelete(record.id)}
                              title="Hapus Absensi"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 13 : 10} className="h-24 text-center text-muted-foreground italic text-xs">
                    Belum ada data absensi untuk periode ini.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      
      {/* Pagination Container inside Card */}
      <div className="border-t border-slate-200/80 dark:border-zinc-800 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/40 dark:bg-zinc-900/40">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>
            Menampilkan{" "}
            <strong className="text-foreground">
              {filteredData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
            </strong>
            {" "}-{" "}
            <strong className="text-foreground">
              {Math.min(currentPage * itemsPerPage, filteredData.length)}
            </strong>
            {" "}dari{" "}
            <strong className="text-foreground">{filteredData.length}</strong> data
          </span>
          <span className="text-slate-300 dark:text-zinc-700">|</span>
          <div className="flex items-center gap-1.5">
            <span>Baris per halaman:</span>
            <Select
              value={String(itemsPerPage)}
              onValueChange={(val) => {
                setItemsPerPage(Number(val))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="h-7 w-[70px] text-xs rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-2 font-medium">
            Hal {currentPage} dari {totalPages || 1}
          </span>
          <Button 
            variant="outline" size="icon" className="h-7 w-7 rounded-lg" 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(1)}
            title="Halaman Pertama"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="outline" size="icon" className="h-7 w-7 rounded-lg" 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev: number) => prev - 1)}
            title="Halaman Sebelumnya"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="outline" size="icon" className="h-7 w-7 rounded-lg" 
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage((prev: number) => prev + 1)}
            title="Halaman Berikutnya"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="outline" size="icon" className="h-7 w-7 rounded-lg" 
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(totalPages)}
            title="Halaman Terakhir"
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
                  <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-2xs">
                    <Camera className="h-4 w-4" />
                    Absensi Selfie Sekarang
                  </Button>
                </Link>
              )}
              {isAdmin && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadData} 
                    disabled={isLoading}
                    className="gap-1.5 h-9 rounded-xl border-slate-200 dark:border-zinc-800 shadow-2xs bg-white dark:bg-zinc-900"
                    title="Segarkan data presensi"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5 text-slate-600 dark:text-zinc-400", isLoading && "animate-spin")} />
                    <span className="hidden sm:inline text-xs font-semibold">Segarkan</span>
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSendReminder} 
                    disabled={isLoading || unrecordedEmployees.length === 0}
                    className="gap-1.5 h-9 rounded-xl border-amber-200/80 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 shadow-2xs"
                    title={`Kirim notifikasi pengingat presensi ke ${unrecordedEmployees.length} pegawai yang belum absen`}
                  >
                    <Bell className="h-3.5 w-3.5 text-amber-600" />
                    <span className="hidden md:inline text-xs font-semibold">Kirim Pengingat</span>
                    {unrecordedEmployees.length > 0 && (
                      <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold">
                        {unrecordedEmployees.length}
                      </span>
                    )}
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="default" size="sm" className="gap-2 h-9 rounded-xl shadow-xs font-semibold text-xs">
                        Aksi Admin
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg">
                      <DropdownMenuLabel className="text-xs">Aksi & Otomasi Presensi</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setShowAddDialog(true)} className="gap-2 cursor-pointer text-xs">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        Tambah Manual
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleMarkAllPresent} className="gap-2 cursor-pointer text-xs">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Hadirkan Semua Belum Absen
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleMarkAllAlpha} className="gap-2 cursor-pointer text-xs text-rose-600 focus:text-rose-600">
                        <UserX className="h-4 w-4 text-rose-600" />
                        Tandai Semua Alpha
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleSendReminder} className="gap-2 cursor-pointer text-xs text-amber-600 focus:text-amber-600">
                        <Bell className="h-4 w-4 text-amber-600" />
                        Kirim Pengingat Presensi
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleExportCSV} className="gap-2 cursor-pointer text-xs">
                        <Download className="h-4 w-4 text-slate-600" />
                        Export Rekap CSV
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleDeleteAllMonth} className="gap-2 cursor-pointer text-xs text-red-600 focus:text-red-600 focus:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                        Hapus Absensi Bulan Ini
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button variant="outline" size="sm" className="gap-2 h-9 rounded-xl border-slate-200 dark:border-zinc-800 shadow-2xs font-semibold text-xs bg-white dark:bg-zinc-900" onClick={handleExportCSV}>
                    <Download className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Export Rekap</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mb-6 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
            {statsCards.map((card) => (
              <Card key={card.title} className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/70 dark:bg-[#111113]/80 backdrop-blur-md shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200">
                <CardContent className="flex items-center gap-3.5 p-4">
                  <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl shrink-0", card.bgColor)}>
                    <card.icon className={cn("h-5 w-5", card.color)} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">{card.value}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold truncate mt-0.5">{card.title}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters & Actions */}
          <Card className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/70 dark:bg-[#111113]/80 backdrop-blur-md shadow-xs mb-6">
            <CardContent className="p-4 space-y-3">
              {/* Row 1: Date & Search */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
                {/* Date Picker + Quick Chips */}
                <div className="lg:col-span-4 flex items-center gap-2">
                  {isAdmin ? (
                    <>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            size="sm"
                            className={cn(
                              "flex-1 justify-start text-left font-normal h-9 rounded-xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs",
                              !date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                            <span className="font-semibold text-xs truncate">
                              {date ? format(date, "EEEE, dd MMM yyyy", { locale: id }) : "Pilih Tanggal"}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(d) => d && setDate(d)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn("h-9 px-2.5 text-xs rounded-xl border-slate-200 dark:border-zinc-800 shrink-0", 
                          date && format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") && "bg-primary/10 text-primary border-primary/30 font-bold"
                        )}
                        onClick={() => setDate(new Date())}
                      >
                        Hari Ini
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 px-2.5 text-xs rounded-xl border-slate-200 dark:border-zinc-800 text-muted-foreground shrink-0"
                        onClick={() => setDate(new Date(Date.now() - 86400000))}
                      >
                        Kemarin
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 w-full">
                      <Select 
                        value={String(selectedMonth)} 
                        onValueChange={(v) => setSelectedMonth(Number(v))}
                      >
                        <SelectTrigger className="flex-1 h-9 rounded-xl">
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
                        <SelectTrigger className="w-[90px] h-9 rounded-xl">
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
                </div>

                {/* Search Input */}
                <div className="lg:col-span-8 relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={isAdmin ? "Cari nama pegawai, NIK/NIP, atau unit kerja..." : "Cari di histori..."}
                    className="pl-9 pr-8 h-9 rounded-xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs shadow-2xs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button 
                      type="button" 
                      onClick={() => setSearchQuery("")} 
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Row 2: Secondary Dropdowns (Unit, Penempatan, Status, and Reset) */}
              {isAdmin && (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-12 gap-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800/60">
                  {/* Unit Kerja */}
                  <div className="lg:col-span-4">
                    <Select value={unitFilter} onValueChange={setUnitFilter}>
                      <SelectTrigger className="h-8 text-xs rounded-xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                        <SelectValue placeholder="Semua Unit Kerja" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Unit Kerja ({unitOptions.length})</SelectItem>
                        {unitOptions.map((unit) => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Penempatan (Pusat / Cabang) */}
                  <div className="lg:col-span-3">
                    <Select value={penempatanFilter} onValueChange={setPenempatanFilter}>
                      <SelectTrigger className="h-8 text-xs rounded-xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                        <SelectValue placeholder="Semua Penempatan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Penempatan</SelectItem>
                        <SelectItem value="pusat">Kantor Pusat (3x Presensi)</SelectItem>
                        <SelectItem value="cabang">Kantor Cabang (2x Presensi)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Presensi */}
                  <div className="lg:col-span-3">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-8 text-xs rounded-xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                        <SelectValue placeholder="Status Presensi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Status Presensi</SelectItem>
                        <SelectItem value="hadir">Hadir Tepat Waktu</SelectItem>
                        <SelectItem value="terlambat">Terlambat</SelectItem>
                        <SelectItem value="izin_sakit">Izin / Sakit</SelectItem>
                        <SelectItem value="cuti">Cuti</SelectItem>
                        <SelectItem value="alpha">Alpha</SelectItem>
                        <SelectItem value="dinas">Dinas Luar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Reset Filter Button */}
                  <div className="lg:col-span-2 flex items-center justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleResetFilters}
                      className="h-8 w-full gap-1.5 text-xs text-muted-foreground hover:text-foreground rounded-xl"
                      title="Reset semua filter ke kondisi awal"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset Filter
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {isAdmin ? (
            <Tabs defaultValue="harian" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <TabsList className="h-10 bg-slate-100/90 dark:bg-zinc-800/80 p-1 rounded-xl w-full sm:w-auto overflow-x-auto justify-start">
                  <TabsTrigger value="harian" className="rounded-lg gap-2 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 shadow-2xs">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Presensi Harian</span>
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold rounded-md ml-1">
                      {filteredData.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="belum_absen" className="rounded-lg gap-2 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 shadow-2xs">
                    <UserX className="h-3.5 w-3.5" />
                    <span>Belum Absen</span>
                    {unrecordedEmployees.length > 0 ? (
                      <Badge className="h-5 px-1.5 text-[10px] font-bold rounded-md ml-1 bg-rose-500 hover:bg-rose-500 text-white">
                        {unrecordedEmployees.length}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold rounded-md ml-1">
                        0
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="anomali" className="rounded-lg gap-2 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 shadow-2xs">
                    <AlertOctagon className="h-3.5 w-3.5" />
                    <span>Anomali Presensi</span>
                    {anomalies.length > 0 ? (
                      <Badge className="h-5 px-1.5 text-[10px] font-bold rounded-md ml-1 bg-amber-500 hover:bg-amber-500 text-white">
                        {anomalies.length}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold rounded-md ml-1">
                        0
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="bulanan" className="rounded-lg gap-2 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 shadow-2xs">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>Rekap Bulanan</span>
                  </TabsTrigger>
                </TabsList>
              </div>
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
                <Card className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/70 dark:bg-[#111113]/80 backdrop-blur-md shadow-xs mb-4">
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
                  <Card className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/70 dark:bg-[#111113]/80 backdrop-blur-md shadow-xs">
                    <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-3">
                      <TrendingUp className="h-10 w-10 opacity-20" />
                      <p className="text-sm">Pilih bulan & tahun, lalu klik <strong>Tampilkan Rekap</strong></p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/70 dark:bg-[#111113]/80 backdrop-blur-md shadow-xs overflow-hidden">
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
                              <TableHead className="text-center w-[100px]">Aksi</TableHead>
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
                                      <Link
                                        href={`/kalender?pegawaiId=${r.id}&bulan=${rekapBulan}&tahun=${rekapTahun}`}
                                        className="group block"
                                        title="Buka Kalender Pegawai"
                                      >
                                        <p className="font-semibold text-sm text-slate-900 dark:text-zinc-100 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                                          <span>{r.nama}</span>
                                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600" />
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">{r.jabatan}</p>
                                      </Link>
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
                                    <TableCell className="text-center">
                                      <Link
                                        href={`/kalender?pegawaiId=${r.id}&bulan=${rekapBulan}&tahun=${rekapTahun}`}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors shadow-2xs"
                                        title="Buka Kalender Pegawai"
                                      >
                                        <CalendarDays className="h-3.5 w-3.5" />
                                        <span>Kalender</span>
                                      </Link>
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

              {/* TAB CONTENT: BELUM ABSEN */}
              <TabsContent value="belum_absen" className="space-y-4">
                {/* Mass action banner */}
                <div className="rounded-2xl border border-rose-200/80 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 shrink-0 mt-0.5">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-rose-950 dark:text-rose-200">
                        {unrecordedEmployees.length} Pegawai Belum Presensi
                      </h4>
                      <p className="text-xs text-rose-700/80 dark:text-rose-300/80 mt-0.5">
                        Daftar seluruh pegawai aktif yang belum memiliki rekaman presensi pada tanggal {date ? format(date, "dd MMMM yyyy", { locale: id }) : ""}.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-9 gap-1.5 text-xs bg-white dark:bg-zinc-900 border-amber-300 text-amber-700 dark:text-amber-300 hover:bg-amber-50 shadow-2xs font-semibold"
                      onClick={handleSendReminder}
                      disabled={unrecordedEmployees.length === 0}
                    >
                      <Bell className="h-3.5 w-3.5 text-amber-600" />
                      Kirim Pengingat
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-9 gap-1.5 text-xs bg-white dark:bg-zinc-900 border-rose-300 text-rose-600 hover:bg-rose-50 shadow-2xs font-semibold"
                      onClick={handleMarkAllAlpha}
                      disabled={unrecordedEmployees.length === 0}
                    >
                      <UserX className="h-3.5 w-3.5" />
                      Tandai Semua Alpha
                    </Button>
                    <Button 
                      size="sm" 
                      className="h-9 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs font-semibold"
                      onClick={handleMarkAllPresent}
                      disabled={unrecordedEmployees.length === 0}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Hadirkan Semua
                    </Button>
                  </div>
                </div>

                {/* Table of Unrecorded */}
                {filteredUnrecorded.length === 0 ? (
                  <Card className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/10 p-8 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                        {unrecordedEmployees.length === 0 
                          ? "Semua Pegawai Sudah Presensi!" 
                          : "Tidak Ada Pegawai Sesuai Filter"}
                      </h3>
                      <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 max-w-md">
                        {unrecordedEmployees.length === 0 
                          ? `Seluruh pegawai aktif telah memiliki catatan presensi pada tanggal ${date ? format(date, "dd MMMM yyyy", { locale: id }) : ""}.`
                          : "Tidak ada pegawai belum absen yang cocok dengan kriteria pencarian / filter terpilih."}
                      </p>
                    </div>
                  </Card>
                ) : (
                  <Card className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md shadow-xs overflow-hidden">
                    <CardHeader className="py-3.5 px-5 border-b border-slate-200/80 dark:border-zinc-800 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <span>Daftar Pegawai Belum Absen</span>
                        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                          {filteredUnrecorded.length} Orang
                        </Badge>
                      </CardTitle>
                      <span className="text-xs text-muted-foreground">
                        Tanggal: {date ? format(date, "dd MMMM yyyy", { locale: id }) : ""}
                      </span>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50/80 dark:bg-zinc-800/50 border-b border-slate-200/80 dark:border-zinc-800 text-xs">
                              <TableHead className="w-[220px] py-3 pl-4">Pegawai</TableHead>
                              <TableHead className="py-3">Unit Kerja & Jabatan</TableHead>
                              <TableHead className="py-3 text-center">Penempatan</TableHead>
                              <TableHead className="py-3 text-center">Status</TableHead>
                              <TableHead className="py-3 text-center w-[230px] pr-4">Aksi Cepat</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedUnrecorded.map((emp) => {
                              const isCab = isCabangOnDate(emp, date || new Date())
                              const initials = (emp.nama || "")
                                .split(" ")
                                .map((n: string) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()
                              return (
                                <TableRow key={emp.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 border-b border-slate-100 dark:border-zinc-800/60">
                                  <TableCell className="py-3 pl-4">
                                    <div className="flex items-center gap-2.5">
                                      <Avatar className="h-8 w-8 rounded-xl border border-rose-200 dark:border-rose-900/40">
                                        <AvatarFallback className="bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 text-[11px] font-bold">
                                          {initials}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="min-w-0">
                                        <p className="font-semibold text-xs text-slate-900 dark:text-zinc-100 truncate">{emp.nama}</p>
                                        <p className="text-[10px] text-muted-foreground font-mono">{emp.nik || "-"}</p>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-3 text-xs">
                                    <p className="font-medium text-slate-800 dark:text-zinc-200">{emp.bidang?.nama || "-"}</p>
                                    <p className="text-[11px] text-muted-foreground">{emp.jabatan?.nama || "-"}</p>
                                  </TableCell>
                                  <TableCell className="py-3 text-center">
                                    <Badge variant="outline" className={cn(
                                      "text-[10px] font-semibold px-2 py-0.5 rounded-md",
                                      isCab 
                                        ? "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300"
                                        : "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300"
                                    )}>
                                      {isCab ? "Kantor Cabang" : "Kantor Pusat"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-3 text-center">
                                    <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 text-[11px] font-semibold px-2.5 py-0.5 rounded-lg shadow-2xs">
                                      Belum Absen
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-3 pr-4 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 px-2 text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg"
                                        onClick={() => handleQuickMarkHadir(emp.id, emp.nama)}
                                        title="Tandai Hadir Langsung"
                                      >
                                        <Check className="h-3 w-3 mr-1" />
                                        Hadir
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 px-2 text-[11px] font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 rounded-lg"
                                        onClick={() => handleQuickMarkAlpha(emp.id, emp.nama)}
                                        title="Tandai Alpha Langsung"
                                      >
                                        <UserX className="h-3 w-3 mr-1" />
                                        Alpha
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 px-2 text-[11px] text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg font-medium"
                                        onClick={() => handleOpenAddForEmployee(emp.id)}
                                        title="Input Detail Presensi"
                                      >
                                        Input Detail
                                      </Button>
                                      {emp.telepon && (
                                        <a
                                          href={`https://wa.me/${emp.telepon.replace(/^0/, '62').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Halo ${emp.nama}, Anda tercatat belum melakukan absensi kehadiran hari ini di SIMPEG TIARA. Mohon segera melakukan presensi.`)}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center justify-center gap-1 h-7 px-2 text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg font-semibold border border-emerald-200/80 shadow-2xs transition-colors"
                                          title={`Chat WhatsApp: ${emp.telepon}`}
                                        >
                                          <MessageSquare className="h-3 w-3" />
                                          <span>WA</span>
                                        </a>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>

                    {/* Pagination Container for Belum Absen */}
                    <div className="border-t border-slate-200/80 dark:border-zinc-800 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/40 dark:bg-zinc-900/40">
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          Menampilkan{" "}
                          <strong className="text-foreground">
                            {filteredUnrecorded.length > 0 ? (unrecordedPage - 1) * unrecordedPerPage + 1 : 0}
                          </strong>
                          {" "}-{" "}
                          <strong className="text-foreground">
                            {Math.min(unrecordedPage * unrecordedPerPage, filteredUnrecorded.length)}
                          </strong>
                          {" "}dari{" "}
                          <strong className="text-foreground">{filteredUnrecorded.length}</strong> pegawai belum absen
                        </span>
                        <span className="text-slate-300 dark:text-zinc-700">|</span>
                        <div className="flex items-center gap-1.5">
                          <span>Baris per halaman:</span>
                          <Select
                            value={String(unrecordedPerPage)}
                            onValueChange={(val) => {
                              setUnrecordedPerPage(Number(val))
                              setUnrecordedPage(1)
                            }}
                          >
                            <SelectTrigger className="h-7 w-[70px] text-xs rounded-lg">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent side="top">
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="15">15</SelectItem>
                              <SelectItem value="20">20</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                              <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground mr-2 font-medium">
                          Hal {unrecordedPage} dari {totalUnrecordedPages || 1}
                        </span>
                        <Button 
                          variant="outline" size="icon" className="h-7 w-7 rounded-lg" 
                          disabled={unrecordedPage === 1}
                          onClick={() => setUnrecordedPage(1)}
                          title="Halaman Pertama"
                        >
                          <ChevronsLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="outline" size="icon" className="h-7 w-7 rounded-lg" 
                          disabled={unrecordedPage === 1}
                          onClick={() => setUnrecordedPage((prev: number) => prev - 1)}
                          title="Halaman Sebelumnya"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="outline" size="icon" className="h-7 w-7 rounded-lg" 
                          disabled={unrecordedPage === totalUnrecordedPages || totalUnrecordedPages === 0}
                          onClick={() => setUnrecordedPage((prev: number) => prev + 1)}
                          title="Halaman Berikutnya"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="outline" size="icon" className="h-7 w-7 rounded-lg" 
                          disabled={unrecordedPage === totalUnrecordedPages || totalUnrecordedPages === 0}
                          onClick={() => setUnrecordedPage(totalUnrecordedPages)}
                          title="Halaman Terakhir"
                        >
                          <ChevronsRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}
              </TabsContent>

              {/* TAB CONTENT: ANOMALI */}
              <TabsContent value="anomali" className="space-y-4">
                {/* Filter Pills for Anomaly Categories */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                      "h-8 text-xs rounded-xl border-slate-200 dark:border-zinc-800",
                      anomaliCategory === "all" && "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                    )}
                    onClick={() => setAnomaliCategory("all")}
                  >
                    Semua Anomali ({anomalies.length})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                      "h-8 text-xs rounded-xl border-slate-200 dark:border-zinc-800",
                      anomaliCategory === "no_checkout" && "bg-rose-600 text-white border-rose-600 font-bold shadow-xs"
                    )}
                    onClick={() => setAnomaliCategory("no_checkout")}
                  >
                    Belum Check-out ({anomalies.filter(a => a.type === "no_checkout").length})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                      "h-8 text-xs rounded-xl border-slate-200 dark:border-zinc-800",
                      anomaliCategory === "no_siang" && "bg-amber-600 text-white border-amber-600 font-bold shadow-xs"
                    )}
                    onClick={() => setAnomaliCategory("no_siang")}
                  >
                    Tanpa Absen Siang (Pusat) ({anomalies.filter(a => a.type === "no_siang").length})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                      "h-8 text-xs rounded-xl border-slate-200 dark:border-zinc-800",
                      anomaliCategory === "late_high" && "bg-orange-600 text-white border-orange-600 font-bold shadow-xs"
                    )}
                    onClick={() => setAnomaliCategory("late_high")}
                  >
                    Terlambat Berat &gt;30m ({anomalies.filter(a => a.type === "late_high").length})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                      "h-8 text-xs rounded-xl border-slate-200 dark:border-zinc-800",
                      anomaliCategory === "early_checkout" && "bg-purple-600 text-white border-purple-600 font-bold shadow-xs"
                    )}
                    onClick={() => setAnomaliCategory("early_checkout")}
                  >
                    Pulang Cepat ({anomalies.filter(a => a.type === "early_checkout").length})
                  </Button>
                </div>

                {filteredAnomalies.length === 0 ? (
                  <Card className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/10 p-8 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                        Tidak Ada Anomali Kehadiran
                      </h3>
                      <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 max-w-md">
                        {anomalies.length === 0
                          ? `Seluruh presensi pada tanggal ${date ? format(date, "dd MMMM yyyy", { locale: id }) : ""} tercatat tertib dan sesuai jam kerja (tidak ada lupa check-out, tanpa absen siang, terlambat berat, atau pulang cepat).`
                          : "Tidak ada anomali yang sesuai dengan kategori filter terpilih."}
                      </p>
                    </div>
                  </Card>
                ) : (
                  <Card className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md shadow-xs overflow-hidden">
                    <CardHeader className="py-3.5 px-5 border-b border-slate-200/80 dark:border-zinc-800 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <span>Anomali Terdeteksi</span>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          {filteredAnomalies.length} Data
                        </Badge>
                      </CardTitle>
                      <span className="text-xs text-muted-foreground">
                        Sistem mendeteksi deviasi aturan kerja secara otomatis
                      </span>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50/80 dark:bg-zinc-800/50 border-b border-slate-200/80 dark:border-zinc-800 text-xs">
                              <TableHead className="w-[200px] py-3 pl-4">Pegawai</TableHead>
                              <TableHead className="w-[140px] py-3 text-center">Jenis Anomali</TableHead>
                              <TableHead className="py-3">Indikasi Masalah</TableHead>
                              <TableHead className="py-3 text-center">Catatan Jam (WITA)</TableHead>
                              <TableHead className="py-3 text-center w-[120px] pr-4">Aksi</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredAnomalies.map((anom) => (
                              <TableRow key={anom.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 border-b border-slate-100 dark:border-zinc-800/60">
                                <TableCell className="py-3 pl-4">
                                  <div className="flex items-center gap-2.5">
                                    <Avatar className="h-8 w-8 rounded-xl border border-amber-200 dark:border-amber-900/40">
                                      <AvatarFallback className="bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 text-[11px] font-bold">
                                        {anom.record.employeeInitials}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-xs text-slate-900 dark:text-zinc-100 truncate">{anom.record.employeeName}</p>
                                      <p className="text-[10px] text-muted-foreground">{anom.record.employeeUnit}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="py-3 text-center">
                                  <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md", anom.badgeClass)}>
                                    {anom.title}
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-3 text-xs text-slate-700 dark:text-zinc-300">
                                  {anom.desc}
                                </TableCell>
                                <TableCell className="py-3 text-center text-xs font-mono">
                                  <div className="flex items-center justify-center gap-2 text-[11px]">
                                    <span title="Masuk">📥 {anom.record.checkIn || "-"}</span>
                                    <span title="Siang">☀️ {anom.record.checkSiang || "-"}</span>
                                    <span title="Pulang">📤 {anom.record.checkOut || "-"}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="py-3 pr-4 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2 text-[11px] font-semibold text-blue-600 border-blue-200 hover:bg-blue-50 rounded-lg"
                                      onClick={() => handleOpenEdit(anom.record)}
                                      title="Koreksi data absensi"
                                    >
                                      <Edit className="h-3 w-3 mr-1" />
                                      Koreksi
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 text-rose-600 hover:bg-rose-50 rounded-lg"
                                      onClick={() => handleDelete(anom.record.id)}
                                      title="Hapus rekaman ini"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}
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
                  <SelectContent className="max-h-[300px]">
                    <div className="sticky top-0 z-10 bg-background p-2 mb-1 border-b">
                      <Input
                        placeholder="Ketik untuk mencari nama..."
                        value={searchAddPegawai}
                        onChange={(e) => setSearchAddPegawai(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                    {employees
                      .filter(e => e.nama.toLowerCase().includes(searchAddPegawai.toLowerCase()) || e.nik.includes(searchAddPegawai))
                      .map(e => (
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
