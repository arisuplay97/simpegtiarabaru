"use client"

import { useState, useEffect, useCallback, useMemo, Suspense } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isBefore,
  startOfDay,
} from "date-fns"
import { id } from "date-fns/locale"
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock3,
  Calendar,
  User,
  Users,
  Building2,
  FileText,
  Filter,
  Info,
  Layers,
  CalendarRange,
  ListFilter,
  ShieldCheck,
  Eye,
  MapPin,
  Camera,
  RefreshCw,
  ExternalLink,
  Sparkles,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { getKalenderPegawai } from "@/lib/actions/indeks"
import { getEmployees } from "@/lib/actions/pegawai"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { toast } from "sonner"

// ─── Status Visual Definitions ────────────────────────────────────────────────
type AttendanceStatus = "HADIR" | "TERLAMBAT" | "ALPA" | "CUTI" | "CUTI_PENDING" | "IZIN" | "SAKIT" | "LIBUR_AKHIR_PEKAN" | "HARI_MENDATANG"

interface StatusConfigItem {
  label: string
  badgeClass: string
  pillClass: string
  dotClass: string
  icon: React.ElementType
}

const STATUS_THEME: Record<string, StatusConfigItem> = {
  HADIR: {
    label: "Hadir",
    badgeClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/60",
    pillClass: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/20",
    dotClass: "bg-emerald-500",
    icon: CheckCircle2,
  },
  TERLAMBAT: {
    label: "Terlambat",
    badgeClass: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200/70 dark:border-amber-800/60",
    pillClass: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-500/20",
    dotClass: "bg-amber-500",
    icon: Clock3,
  },
  ALPA: {
    label: "Alpha",
    badgeClass: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200/70 dark:border-rose-800/60",
    pillClass: "bg-rose-500/15 text-rose-700 dark:bg-rose-500/25 dark:text-rose-300 border border-rose-500/30 font-semibold",
    dotClass: "bg-rose-600",
    icon: AlertCircle,
  },
  CUTI: {
    label: "Cuti",
    badgeClass: "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200/70 dark:border-purple-800/60",
    pillClass: "bg-purple-500/10 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-500/20",
    dotClass: "bg-purple-500",
    icon: Calendar,
  },
  CUTI_PENDING: {
    label: "Cuti (Menunggu)",
    badgeClass: "bg-stone-50 text-stone-600 dark:bg-stone-900/50 dark:text-stone-300 border-stone-200/70 dark:border-stone-800/60",
    pillClass: "bg-stone-500/10 text-stone-600 dark:bg-stone-500/20 dark:text-stone-300 border border-stone-500/20",
    dotClass: "bg-stone-400",
    icon: Calendar,
  },
  IZIN: {
    label: "Izin",
    badgeClass: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200/70 dark:border-blue-800/60",
    pillClass: "bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-500/20",
    dotClass: "bg-blue-500",
    icon: FileText,
  },
  SAKIT: {
    label: "Sakit",
    badgeClass: "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 border-orange-200/70 dark:border-orange-800/60",
    pillClass: "bg-orange-500/10 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300 border border-orange-500/20",
    dotClass: "bg-orange-500",
    icon: AlertTriangle,
  },
  LIBUR_AKHIR_PEKAN: {
    label: "Libur Akhir Pekan",
    badgeClass: "bg-slate-100 text-slate-500 dark:bg-zinc-800/60 dark:text-zinc-400 border-slate-200/60 dark:border-zinc-700/60",
    pillClass: "bg-slate-100 dark:bg-zinc-800/40 text-slate-400 dark:text-zinc-500 border border-transparent",
    dotClass: "bg-slate-400",
    icon: Info,
  },
  HARI_MENDATANG: {
    label: "Belum Berjalan",
    badgeClass: "bg-slate-50 text-slate-400 dark:bg-zinc-900/40 dark:text-zinc-500 border-slate-200/40 dark:border-zinc-800/40",
    pillClass: "bg-slate-50/50 dark:bg-zinc-900/20 text-slate-400 dark:text-zinc-600 border border-dashed border-slate-200 dark:border-zinc-800",
    dotClass: "bg-slate-300 dark:bg-zinc-700",
    icon: CalendarDays,
  },
}

function KalenderContent() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()

  const userRole = (session?.user as any)?.role?.toString().toUpperCase()
  const isAdmin = userRole === "SUPERADMIN" || userRole === "HRD" || userRole === "DIREKSI"

  // URL Params or defaults
  const paramPegawaiId = searchParams.get("pegawaiId")
  const paramBulan = searchParams.get("bulan")
  const paramTahun = searchParams.get("tahun")

  const initialDate = useMemo(() => {
    if (paramBulan && paramTahun) {
      return new Date(Number(paramTahun), Number(paramBulan) - 1, 1)
    }
    return new Date()
  }, [paramBulan, paramTahun])

  const [currentMonth, setCurrentMonth] = useState<Date>(initialDate)
  const [employees, setEmployees] = useState<any[]>([])
  const [selectedPegawaiId, setSelectedPegawaiId] = useState<string>(paramPegawaiId || "")
  const [dayMap, setDayMap] = useState<Record<string, any>>({})
  const [summaryData, setSummaryData] = useState<any>(null)
  const [pegawaiDetail, setPegawaiDetail] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false)
  const [selectedDayDetail, setSelectedDayDetail] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Filters & Views
  const [viewMode, setViewMode] = useState<"SPLIT" | "CALENDAR" | "LIST">("SPLIT")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  const bulan = currentMonth.getMonth() + 1
  const tahun = currentMonth.getFullYear()

  // Load employee list for admin/hrd
  useEffect(() => {
    if (isAdmin) {
      setIsLoadingEmployees(true)
      getEmployees()
        .then((data) => {
          setEmployees(data || [])
          if (!selectedPegawaiId && data && data.length > 0) {
            // Default to first employee or keep current
            setSelectedPegawaiId(data[0].id)
          }
        })
        .catch((err) => console.error("Error loading employees:", err))
        .finally(() => setIsLoadingEmployees(false))
    }
  }, [isAdmin])

  // Fetch calendar & attendance data
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const targetPegawaiId = selectedPegawaiId || null
      const res = await (getKalenderPegawai as any)(targetPegawaiId, bulan, tahun)
      if (res) {
        setDayMap(res.dayMap || {})
        setSummaryData(res.summary || null)
        setPegawaiDetail(res.pegawai || null)
      }
    } catch (error) {
      console.error("Error fetching kalender data:", error)
      toast.error("Gagal memuat data kalender")
    } finally {
      setIsLoading(false)
    }
  }, [selectedPegawaiId, bulan, tahun])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Calendar calculations
  const firstDayOfMonth = startOfMonth(currentMonth)
  const lastDayOfMonth = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth })
  const firstDayIndex = (getDay(firstDayOfMonth) + 6) % 7 // Monday = 0
  const weekDays = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
  const today = startOfDay(new Date())

  // Format all entries for the month list
  const fullMonthList = useMemo(() => {
    return daysInMonth.map((d) => {
      const dateStr = format(d, "yyyy-MM-dd")
      const dayName = format(d, "EEEE", { locale: id })
      const isWknd = d.getDay() === 0 || d.getDay() === 6
      const isPast = isBefore(startOfDay(d), today)
      const isToday = dateStr === format(today, "yyyy-MM-dd")
      const existing = dayMap[dateStr]

      let status: AttendanceStatus = "HADIR"
      let keterangan = ""
      let jamMasuk: string | null = null
      let jamKeluar: string | null = null

      if (existing) {
        status = existing.status as AttendanceStatus
        keterangan = existing.keterangan || ""
        if (existing.jamMasuk) {
          jamMasuk = format(new Date(existing.jamMasuk), "HH:mm")
        }
        if (existing.jamKeluar) {
          jamKeluar = format(new Date(existing.jamKeluar), "HH:mm")
        }
      } else if (isWknd) {
        status = "LIBUR_AKHIR_PEKAN"
        keterangan = "Libur Akhir Pekan"
      } else if (isPast) {
        status = "ALPA"
        keterangan = "Alpha (Tanpa Keterangan)"
      } else if (isToday) {
        status = "ALPA"
        keterangan = "Belum Tercatat Absensi Hari Ini"
      } else {
        status = "HARI_MENDATANG"
        keterangan = "Hari Belum Berjalan"
      }

      const cfg = STATUS_THEME[status] || STATUS_THEME.HADIR

      return {
        date: d,
        dateStr,
        dayName,
        status,
        cfg,
        isWeekend: isWknd,
        isToday,
        isPast,
        jamMasuk,
        jamKeluar,
        keterangan,
        raw: existing,
      }
    })
  }, [daysInMonth, dayMap, today])

  // Count aggregates directly from full month list (guarantees 100% mathematical consistency)
  const computedStats = useMemo(() => {
    let hadir = 0
    let terlambat = 0
    let alpha = 0
    let sakit = 0
    let izin = 0
    let cuti = 0
    let totalKerja = 0

    fullMonthList.forEach((item) => {
      if (!item.isWeekend) {
        totalKerja++
        if (item.status === "HADIR") hadir++
        else if (item.status === "TERLAMBAT") terlambat++
        else if (item.status === "ALPA") alpha++
        else if (item.status === "SAKIT") sakit++
        else if (item.status === "IZIN") izin++
        else if (item.status === "CUTI" || item.status === "CUTI_PENDING") cuti++
      }
    })

    return { hadir, terlambat, alpha, sakit, izin, cuti, totalKerja }
  }, [fullMonthList])

  // Breakdown items of non-presences (to explicitly know WHICH DAYS are Alpha, Sakit, etc.)
  const alphaDays = useMemo(() => fullMonthList.filter((i) => i.status === "ALPA" && !i.isWeekend), [fullMonthList])
  const sakitDays = useMemo(() => fullMonthList.filter((i) => i.status === "SAKIT"), [fullMonthList])
  const izinDays = useMemo(() => fullMonthList.filter((i) => i.status === "IZIN"), [fullMonthList])
  const cutiDays = useMemo(() => fullMonthList.filter((i) => i.status === "CUTI" || i.status === "CUTI_PENDING"), [fullMonthList])
  const terlambatDays = useMemo(() => fullMonthList.filter((i) => i.status === "TERLAMBAT"), [fullMonthList])

  // Filtered list based on status filter and search query
  const filteredList = useMemo(() => {
    return fullMonthList.filter((item) => {
      // Status filter
      if (statusFilter === "ALPA" && item.status !== "ALPA") return false
      if (statusFilter === "SAKIT_IZIN" && item.status !== "SAKIT" && item.status !== "IZIN") return false
      if (statusFilter === "CUTI" && item.status !== "CUTI" && item.status !== "CUTI_PENDING") return false
      if (statusFilter === "TERLAMBAT" && item.status !== "TERLAMBAT") return false
      if (statusFilter === "HADIR" && item.status !== "HADIR") return false
      if (statusFilter === "KERJA_ONLY" && item.isWeekend) return false

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const formattedDate = format(item.date, "d MMMM yyyy", { locale: id }).toLowerCase()
        const matchText = `${item.dayName} ${formattedDate} ${item.status} ${item.keterangan}`.toLowerCase()
        if (!matchText.includes(q)) return false
      }

      return true
    })
  }, [fullMonthList, statusFilter, searchQuery])

  // Export CSV handler
  const handleExportCSV = () => {
    const targetName = pegawaiDetail?.nama || session?.user?.name || "Pegawai"
    const headers = ["Tanggal", "Hari", "Status Kehadiran", "Jam Masuk", "Jam Keluar", "Keterangan"]
    const rows = fullMonthList.map((i) => [
      i.dateStr,
      i.dayName,
      i.cfg.label,
      i.jamMasuk || "-",
      i.jamKeluar || "-",
      `"${(i.keterangan || "-").replace(/"/g, '""')}"`,
    ])
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `Kalender_Rekap_${targetName.replace(/\s+/g, "_")}_${bulan}_${tahun}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Rekap kalender berhasil diunduh dalam format CSV")
  }

  // Open day detail
  const handleDayClick = (item: any) => {
    setSelectedDayDetail(item)
    setIsDetailOpen(true)
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-[#09090b]">
      <SidebarNav />

      <div className="flex flex-1 flex-col sidebar-offset min-w-0">
        <TopBar breadcrumb={["Kehadiran", "Kalender Kehadiran"]} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1520px] mx-auto w-full">

          {/* ============================================================
             1. EXECUTIVE HEADER (Clean SaaS Style like Dashboard)
             ============================================================ */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 p-5 rounded-2xl shadow-xs">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <CalendarRange className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
                    Kalender & Rekap Kehadiran
                  </h1>
                  <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/60 dark:border-blue-900/60 text-[11px] font-semibold rounded-lg px-2 py-0.5">
                    {format(currentMonth, "MMMM yyyy", { locale: id })}
                  </Badge>
                </div>
                <p className="text-xs sm:text-[13px] text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-2 flex-wrap">
                  {pegawaiDetail ? (
                    <>
                      <span className="font-semibold text-slate-800 dark:text-zinc-200">{pegawaiDetail.nama}</span>
                      <span className="text-slate-300 dark:text-zinc-700">·</span>
                      <span>{pegawaiDetail.jabatan || "Pegawai"}</span>
                      <span className="text-slate-300 dark:text-zinc-700">·</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">{pegawaiDetail.bidang?.nama || "PDAM TAR"}</span>
                    </>
                  ) : (
                    <span>Pantau visualisasi absensi harian dan rincian kehadiran, alpha, sakit, izin, serta cuti per tanggal.</span>
                  )}
                </p>
              </div>
            </div>

            {/* Header Controls & Filter Bar */}
            <div className="flex items-center flex-wrap gap-2.5">
              {/* Employee Selector for Admin/HRD */}
              {isAdmin && employees.length > 0 && (
                <div className="w-full sm:w-[220px]">
                  <Select
                    value={selectedPegawaiId}
                    onValueChange={(val) => {
                      setSelectedPegawaiId(val)
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-xl bg-slate-50/80 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 font-medium">
                      <Users className="h-3.5 w-3.5 mr-2 text-slate-500" />
                      <SelectValue placeholder="Pilih Pegawai" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id} className="text-xs">
                          {emp.nama} — <span className="text-slate-400">{emp.jabatan || "Staff"}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Month Navigation */}
              <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-zinc-900 p-1 rounded-xl border border-slate-200/80 dark:border-zinc-800">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="h-7 w-7 p-0 rounded-lg text-slate-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"
                  title="Bulan Sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="px-2 text-xs font-bold text-slate-800 dark:text-zinc-200 min-w-[110px] text-center">
                  {format(currentMonth, "MMM yyyy", { locale: id })}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="h-7 w-7 p-0 rounded-lg text-slate-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800"
                  title="Bulan Berikutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date())}
                className="h-9 px-3 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 shadow-2xs"
              >
                Hari Ini
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="h-9 px-3.5 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 shadow-2xs gap-1.5"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" />
                <span>Export CSV</span>
              </Button>
            </div>
          </div>

          {/* ============================================================
             2. METRIC SUMMARY CARDS (Like Dashboard Stat Cards)
             ============================================================ */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {[
              {
                id: "KERJA_ONLY",
                title: "TOTAL HARI KERJA",
                value: computedStats.totalKerja,
                sub: "Hari efektif bulan ini",
                icon: CalendarDays,
                color: "text-slate-600 dark:text-zinc-400",
                bgColor: "bg-slate-100 dark:bg-zinc-800",
                activeBorder: "border-slate-500",
              },
              {
                id: "HADIR",
                title: "HADIR TEPAT WAKTU",
                value: computedStats.hadir,
                sub: "Kehadiran disiplin",
                icon: CheckCircle2,
                color: "text-emerald-600 dark:text-emerald-400",
                bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
                activeBorder: "border-emerald-500 ring-2 ring-emerald-500/20",
              },
              {
                id: "TERLAMBAT",
                title: "TERLAMBAT",
                value: computedStats.terlambat,
                sub: "Masuk setelah jadwal",
                icon: Clock3,
                color: "text-amber-600 dark:text-amber-400",
                bgColor: "bg-amber-50 dark:bg-amber-950/50",
                activeBorder: "border-amber-500 ring-2 ring-amber-500/20",
              },
              {
                id: "SAKIT_IZIN",
                title: "IZIN & SAKIT",
                value: computedStats.sakit + computedStats.izin,
                sub: `${computedStats.sakit} Sakit · ${computedStats.izin} Izin`,
                icon: AlertTriangle,
                color: "text-blue-600 dark:text-blue-400",
                bgColor: "bg-blue-50 dark:bg-blue-950/50",
                activeBorder: "border-blue-500 ring-2 ring-blue-500/20",
              },
              {
                id: "CUTI",
                title: "CUTI DISETUJUI",
                value: computedStats.cuti,
                sub: "Pengajuan resmi",
                icon: Calendar,
                color: "text-purple-600 dark:text-purple-400",
                bgColor: "bg-purple-50 dark:bg-purple-950/50",
                activeBorder: "border-purple-500 ring-2 ring-purple-500/20",
              },
              {
                id: "ALPA",
                title: "ALPHA / TANPA KET.",
                value: computedStats.alpha,
                sub: computedStats.alpha > 0 ? "Perlu ditindaklanjuti" : "Nihil alpha",
                icon: AlertCircle,
                color: "text-rose-600 dark:text-rose-400",
                bgColor: "bg-rose-50 dark:bg-rose-950/50",
                activeBorder: "border-rose-500 ring-2 ring-rose-500/20",
              },
            ].map((card) => {
              const isSelected = statusFilter === card.id
              return (
                <div
                  key={card.id}
                  onClick={() => setStatusFilter(isSelected ? "ALL" : card.id)}
                  className={cn(
                    "cursor-pointer rounded-2xl bg-white dark:bg-[#111113] border p-4 transition-all duration-200 shadow-xs hover:shadow-sm group select-none",
                    isSelected
                      ? cn("bg-slate-50/80 dark:bg-zinc-800/50", card.activeBorder)
                      : "border-slate-200/80 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700"
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold tracking-wider text-slate-500 dark:text-zinc-400 uppercase">
                      {card.title}
                    </span>
                    <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0", card.bgColor)}>
                      <card.icon className={cn("h-3.5 w-3.5", card.color)} />
                    </div>
                  </div>
                  <div className={cn("text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100", card.value > 0 && card.id === "ALPA" && "text-rose-600 dark:text-rose-400")}>
                    {card.value}
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1 truncate">
                    {card.sub}
                  </p>
                </div>
              )
            })}
          </div>

          {/* ============================================================
             3. INSIGHT NOTICE BOX (Tahu Hari Apa Alpha, Sakit, dll)
             ============================================================ */}
          {(alphaDays.length > 0 || sakitDays.length > 0 || cutiDays.length > 0 || terlambatDays.length > 0) && (
            <div className="rounded-2xl bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                    Rincian Hari Ketidakhadiran & Anomali — {format(currentMonth, "MMMM yyyy", { locale: id })}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                  Klik tag tanggal untuk melihat rincian presensi hari tersebut
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                {/* Alpha Pill List */}
                <div className={cn("p-3 rounded-xl border", alphaDays.length > 0 ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/40" : "bg-slate-50 dark:bg-zinc-900 border-slate-100 dark:border-zinc-800")}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Alpha ({alphaDays.length} Hari)
                    </span>
                  </div>
                  {alphaDays.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {alphaDays.map((item) => (
                        <button
                          key={item.dateStr}
                          onClick={() => handleDayClick(item)}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900 border border-rose-300/80 dark:border-rose-800/60 font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100/70 transition-colors"
                        >
                          {item.dayName}, {format(item.date, "dd MMM")}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Tidak ada catatan alpha</span>
                  )}
                </div>

                {/* Sakit Pill List */}
                <div className={cn("p-3 rounded-xl border", sakitDays.length > 0 ? "bg-orange-50/50 dark:bg-orange-950/20 border-orange-200/80 dark:border-orange-900/40" : "bg-slate-50 dark:bg-zinc-900 border-slate-100 dark:border-zinc-800")}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-orange-700 dark:text-orange-400 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Sakit ({sakitDays.length} Hari)
                    </span>
                  </div>
                  {sakitDays.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {sakitDays.map((item) => (
                        <button
                          key={item.dateStr}
                          onClick={() => handleDayClick(item)}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900 border border-orange-300/80 dark:border-orange-800/60 font-semibold text-orange-700 dark:text-orange-300 hover:bg-orange-100/70 transition-colors"
                        >
                          {item.dayName}, {format(item.date, "dd MMM")}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Tidak ada hari sakit</span>
                  )}
                </div>

                {/* Cuti & Izin Pill List */}
                <div className={cn("p-3 rounded-xl border", (cutiDays.length + izinDays.length) > 0 ? "bg-purple-50/50 dark:bg-purple-950/20 border-purple-200/80 dark:border-purple-900/40" : "bg-slate-50 dark:bg-zinc-900 border-slate-100 dark:border-zinc-800")}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Cuti / Izin ({cutiDays.length + izinDays.length} Hari)
                    </span>
                  </div>
                  {(cutiDays.length + izinDays.length) > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {[...cutiDays, ...izinDays].map((item) => (
                        <button
                          key={item.dateStr}
                          onClick={() => handleDayClick(item)}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900 border border-purple-300/80 dark:border-purple-800/60 font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-100/70 transition-colors"
                        >
                          {item.dayName}, {format(item.date, "dd MMM")} ({item.cfg.label})
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Tidak ada cuti atau izin</span>
                  )}
                </div>

                {/* Terlambat Pill List */}
                <div className={cn("p-3 rounded-xl border", terlambatDays.length > 0 ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40" : "bg-slate-50 dark:bg-zinc-900 border-slate-100 dark:border-zinc-800")}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5" />
                      Terlambat ({terlambatDays.length} Hari)
                    </span>
                  </div>
                  {terlambatDays.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {terlambatDays.map((item) => (
                        <button
                          key={item.dateStr}
                          onClick={() => handleDayClick(item)}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900 border border-amber-300/80 dark:border-amber-800/60 font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-100/70 transition-colors"
                        >
                          {item.dayName}, {format(item.date, "dd MMM")} ({item.jamMasuk || "Telat"})
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Nihil keterlambatan</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================
             4. VIEW MODE SWITCHER & SEARCH
             ============================================================ */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* View Mode Pills */}
            <div className="inline-flex items-center p-1 bg-slate-100/80 dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 select-none">
              <button
                onClick={() => setViewMode("SPLIT")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                  viewMode === "SPLIT"
                    ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-50 shadow-xs"
                    : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                )}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Kalender & Rekap</span>
              </button>

              <button
                onClick={() => setViewMode("CALENDAR")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                  viewMode === "CALENDAR"
                    ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-50 shadow-xs"
                    : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                )}
              >
                <CalendarRange className="h-3.5 w-3.5" />
                <span>Kalender Visual</span>
              </button>

              <button
                onClick={() => setViewMode("LIST")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5",
                  viewMode === "LIST"
                    ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-50 shadow-xs"
                    : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                )}
              >
                <ListFilter className="h-3.5 w-3.5" />
                <span>Daftar Rekap Bulanan ({fullMonthList.length})</span>
              </button>
            </div>

            {/* Quick Status Filter & Search */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Cari hari, tanggal, atau status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8.5 h-9 text-xs rounded-xl bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800"
                />
              </div>

              {statusFilter !== "ALL" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatusFilter("ALL")}
                  className="h-9 px-2.5 text-xs text-slate-500 hover:text-slate-800 dark:text-zinc-400 rounded-xl"
                >
                  Reset Filter
                </Button>
              )}
            </div>
          </div>

          {/* ============================================================
             5. MAIN CONTENT LAYOUT (CALENDAR & REKAP LIST)
             ============================================================ */}
          <div className="space-y-6">

            {/* A. VISUAL CALENDAR GRID */}
            {(viewMode === "SPLIT" || viewMode === "CALENDAR") && (
              <div className="rounded-2xl bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-zinc-800/80 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-blue-600" />
                    <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
                      Grid Kalender Presensi
                    </h2>
                  </div>

                  {/* Legend Chips */}
                  <div className="flex items-center flex-wrap gap-2 text-[11px]">
                    {Object.entries(STATUS_THEME)
                      .filter(([key]) => key !== "CUTI_PENDING" && key !== "HARI_MENDATANG")
                      .map(([key, cfg]) => (
                        <div key={key} className="flex items-center gap-1.5">
                          <span className={cn("h-2 w-2 rounded-full", cfg.dotClass)} />
                          <span className="text-slate-600 dark:text-zinc-400 font-medium">{cfg.label}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center h-72">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                      <span className="text-xs">Memuat data kalender...</span>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="min-w-[700px]">
                      {/* Weekday Header */}
                      <div className="grid grid-cols-7 gap-2 mb-2">
                        {weekDays.map((d, index) => {
                          const isWeekendCol = index >= 5
                          return (
                            <div
                              key={d}
                              className={cn(
                                "text-center text-[11px] font-bold uppercase tracking-wider py-1.5 rounded-lg",
                                isWeekendCol
                                  ? "text-rose-500 dark:text-rose-400 bg-rose-50/40 dark:bg-rose-950/20"
                                  : "text-slate-500 dark:text-zinc-400 bg-slate-50/70 dark:bg-zinc-900/50"
                              )}
                            >
                              {d}
                            </div>
                          )
                        })}
                      </div>

                      {/* Day Cells Grid */}
                      <div className="grid grid-cols-7 gap-2">
                        {/* Empty cells before 1st day */}
                        {Array.from({ length: firstDayIndex }).map((_, i) => (
                          <div
                            key={`empty-${i}`}
                            className="min-h-[85px] rounded-xl bg-slate-50/30 dark:bg-zinc-900/20 border border-dashed border-slate-100 dark:border-zinc-800/40"
                          />
                        ))}

                        {/* Month Days */}
                        {fullMonthList.map((item) => {
                          const isSelected = selectedDayDetail?.dateStr === item.dateStr
                          return (
                            <div
                              key={item.dateStr}
                              onClick={() => handleDayClick(item)}
                              className={cn(
                                "group relative min-h-[88px] rounded-xl p-2 border transition-all duration-150 flex flex-col justify-between cursor-pointer text-left select-none",
                                item.isToday
                                  ? "ring-2 ring-blue-500 bg-blue-50/30 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                                  : isSelected
                                  ? "ring-2 ring-slate-700 dark:ring-zinc-400 border-transparent bg-slate-50 dark:bg-zinc-800"
                                  : item.isWeekend
                                  ? "bg-slate-50/60 dark:bg-zinc-900/40 border-slate-200/50 dark:border-zinc-800/60 hover:bg-slate-100/70"
                                  : item.status === "ALPA"
                                  ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/50 hover:bg-rose-50/70"
                                  : "bg-white dark:bg-[#111113] border-slate-200/70 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-xs"
                              )}
                            >
                              {/* Top row: Day Number & Indicator */}
                              <div className="flex items-center justify-between w-full">
                                <span
                                  className={cn(
                                    "text-[12px] font-bold flex items-center justify-center rounded-lg leading-none",
                                    item.isToday
                                      ? "h-6 w-6 bg-blue-600 text-white shadow-xs"
                                      : item.isWeekend
                                      ? "text-rose-500 dark:text-rose-400"
                                      : "text-slate-800 dark:text-zinc-200"
                                  )}
                                >
                                  {format(item.date, "d")}
                                </span>

                                {!item.isWeekend && item.status !== "HARI_MENDATANG" && (
                                  <span className={cn("h-2 w-2 rounded-full shrink-0", item.cfg.dotClass)} />
                                )}
                              </div>

                              {/* Status Badge inside Cell */}
                              <div className="mt-1">
                                {item.isWeekend ? (
                                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium block truncate">
                                    Libur
                                  </span>
                                ) : item.status === "HARI_MENDATANG" ? (
                                  <span className="text-[10px] text-slate-300 dark:text-zinc-600 block truncate">
                                    —
                                  </span>
                                ) : (
                                  <div className="space-y-0.5">
                                    <span
                                      className={cn(
                                        "inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold leading-tight w-full truncate justify-center",
                                        item.cfg.pillClass
                                      )}
                                    >
                                      {item.status === "HADIR" && item.jamMasuk
                                        ? `${item.jamMasuk}${item.jamKeluar ? ` - ${item.jamKeluar}` : ""}`
                                        : item.status === "TERLAMBAT" && item.jamMasuk
                                        ? `Telat (${item.jamMasuk})`
                                        : item.cfg.label}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* B. LIST REKAP BULANAN KALENDER (CORE FEATURE) */}
            {(viewMode === "SPLIT" || viewMode === "LIST") && (
              <div className="rounded-2xl bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <ListFilter className="h-4 w-4 text-blue-600" />
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
                        Daftar Rincian Rekap Bulanan Kalender
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        Menampilkan seluruh hari kerja & tanggal absensi lengkap dengan status, jam masuk/keluar, dan keterangan.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Status Filter Chips */}
                    {[
                      { id: "ALL", label: `Semua (${fullMonthList.length})` },
                      { id: "ALPA", label: `Alpha (${computedStats.alpha})`, count: computedStats.alpha, color: "text-rose-600" },
                      { id: "SAKIT_IZIN", label: `Sakit & Izin (${computedStats.sakit + computedStats.izin})` },
                      { id: "CUTI", label: `Cuti (${computedStats.cuti})` },
                      { id: "TERLAMBAT", label: `Terlambat (${computedStats.terlambat})` },
                      { id: "HADIR", label: `Hadir (${computedStats.hadir})` },
                    ].map((btn) => (
                      <button
                        key={btn.id}
                        onClick={() => setStatusFilter(btn.id)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border",
                          statusFilter === btn.id
                            ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800 font-bold"
                            : "bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200/70 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800"
                        )}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table Breakdown */}
                <div className="overflow-x-auto rounded-xl border border-slate-200/70 dark:border-zinc-800">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-zinc-900/80 text-slate-500 dark:text-zinc-400 border-b border-slate-200/70 dark:border-zinc-800 font-semibold uppercase tracking-wider">
                        <th className="p-3 w-12 text-center">No</th>
                        <th className="p-3 min-w-[160px]">Hari & Tanggal</th>
                        <th className="p-3 w-[150px]">Status Kehadiran</th>
                        <th className="p-3 w-[140px] text-center">Jam Masuk</th>
                        <th className="p-3 w-[140px] text-center">Jam Pulang</th>
                        <th className="p-3 min-w-[200px]">Keterangan / Alasan</th>
                        <th className="p-3 w-[100px] text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                      {filteredList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400">
                            Tidak ada data untuk filter status & pencarian yang dipilih.
                          </td>
                        </tr>
                      ) : (
                        filteredList.map((item, idx) => {
                          const isAlpha = item.status === "ALPA" && !item.isWeekend
                          return (
                            <tr
                              key={item.dateStr}
                              className={cn(
                                "transition-colors hover:bg-slate-50/60 dark:hover:bg-zinc-800/40",
                                isAlpha && "bg-rose-50/20 dark:bg-rose-950/10",
                                item.isToday && "bg-blue-50/20 dark:bg-blue-950/10 font-medium"
                              )}
                            >
                              <td className="p-3 text-center text-slate-400 font-mono">
                                {idx + 1}
                              </td>

                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      "px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase",
                                      item.isWeekend
                                        ? "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400"
                                        : item.isToday
                                        ? "bg-blue-600 text-white"
                                        : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300"
                                    )}
                                  >
                                    {item.dayName.slice(0, 3)}
                                  </span>
                                  <div>
                                    <div className="font-semibold text-slate-800 dark:text-zinc-100 text-[13px]">
                                      {format(item.date, "d MMMM yyyy", { locale: id })}
                                    </div>
                                    {item.isToday && (
                                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                                        (Hari Ini)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td className="p-3">
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border",
                                    item.cfg.badgeClass
                                  )}
                                >
                                  <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", item.cfg.dotClass)} />
                                  <span>{item.cfg.label}</span>
                                </span>
                              </td>

                              <td className="p-3 text-center font-mono font-medium text-slate-700 dark:text-zinc-300">
                                {item.jamMasuk ? (
                                  <span className={cn(item.status === "TERLAMBAT" && "text-amber-600 font-bold")}>
                                    {item.jamMasuk}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 dark:text-zinc-600">—</span>
                                )}
                              </td>

                              <td className="p-3 text-center font-mono font-medium text-slate-700 dark:text-zinc-300">
                                {item.jamKeluar || <span className="text-slate-300 dark:text-zinc-600">—</span>}
                              </td>

                              <td className="p-3 text-slate-600 dark:text-zinc-300">
                                <div className="flex items-center gap-1.5">
                                  {isAlpha && <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />}
                                  <span className={cn(isAlpha && "text-rose-700 dark:text-rose-400 font-semibold")}>
                                    {item.keterangan || "—"}
                                  </span>
                                </div>
                              </td>

                              <td className="p-3 text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDayClick(item)}
                                  className="h-7 px-2 text-xs rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-800"
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  <span>Detail</span>
                                </Button>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* ============================================================
         6. DETAIL MODAL (Clean Popover / Modal Dialog)
         ============================================================ */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white dark:bg-[#111113] border border-slate-200 dark:border-zinc-800 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <CalendarDays className="h-4.5 w-4.5 text-blue-600" />
              <span>Detail Presensi Harian</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400">
              {selectedDayDetail && format(selectedDayDetail.date, "EEEE, dd MMMM yyyy", { locale: id })}
            </DialogDescription>
          </DialogHeader>

          {selectedDayDetail && (
            <div className="space-y-4 pt-2">
              {/* Status Header Chip */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/70 dark:border-zinc-800">
                <span className="text-xs text-slate-500 font-medium">Status Kehadiran</span>
                <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border", selectedDayDetail.cfg.badgeClass)}>
                  <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", selectedDayDetail.cfg.dotClass)} />
                  <span>{selectedDayDetail.cfg.label}</span>
                </span>
              </div>

              {/* Time Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-zinc-900/50 border border-slate-200/60 dark:border-zinc-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Jam Masuk</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-zinc-200 font-mono">
                    {selectedDayDetail.jamMasuk || "—"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-zinc-900/50 border border-slate-200/60 dark:border-zinc-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Jam Pulang</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-zinc-200 font-mono">
                    {selectedDayDetail.jamKeluar || "—"}
                  </span>
                </div>
              </div>

              {/* Notes & Description */}
              <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-zinc-900/50 border border-slate-200/60 dark:border-zinc-800 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Keterangan Presensi</span>
                <p className="text-xs text-slate-700 dark:text-zinc-300 font-medium">
                  {selectedDayDetail.keterangan || "Tidak ada keterangan khusus"}
                </p>
              </div>

              {/* Photos if Selfie available */}
              {(selectedDayDetail.raw?.fotoMasukUrl || selectedDayDetail.raw?.fotoKeluarUrl) && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Dokumentasi Selfie</span>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedDayDetail.raw.fotoMasukUrl && (
                      <div className="space-y-1 text-center">
                        <img
                          src={selectedDayDetail.raw.fotoMasukUrl}
                          alt="Foto Masuk"
                          className="h-28 w-full object-cover rounded-xl border border-slate-200 dark:border-zinc-800"
                        />
                        <span className="text-[10px] text-slate-400">Masuk</span>
                      </div>
                    )}
                    {selectedDayDetail.raw.fotoKeluarUrl && (
                      <div className="space-y-1 text-center">
                        <img
                          src={selectedDayDetail.raw.fotoKeluarUrl}
                          alt="Foto Pulang"
                          className="h-28 w-full object-cover rounded-xl border border-slate-200 dark:border-zinc-800"
                        />
                        <span className="text-[10px] text-slate-400">Pulang</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Location GPS */}
              {selectedDayDetail.raw?.lokasiMasuk && (
                <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-zinc-900/50 border border-slate-200/60 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-500" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Lokasi GPS</span>
                      <span className="text-xs font-mono text-slate-700 dark:text-zinc-300">
                        {selectedDayDetail.raw.lokasiMasuk}
                      </span>
                    </div>
                  </div>
                  <a
                    href={`https://maps.google.com/?q=${selectedDayDetail.raw.lokasiMasuk}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <span>Peta</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDetailOpen(false)}
                  className="rounded-xl px-4 text-xs font-semibold"
                >
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function KalenderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-[#09090b]">
          <SidebarNav />
          <div className="flex flex-1 flex-col sidebar-offset min-w-0">
            <TopBar breadcrumb={["Kehadiran", "Kalender Kehadiran"]} />
            <main className="flex-1 p-6 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                <span className="text-xs">Memuat Kalender Kehadiran...</span>
              </div>
            </main>
          </div>
        </div>
      }
    >
      <KalenderContent />
    </Suspense>
  )
}
