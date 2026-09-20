"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { cn } from "@/lib/utils"
import {
  Search,
  Plus,
  Download,
  Filter,
  Calendar as CalendarIcon,
  Plane,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  X,
  Trash2,
  CalendarOff,
  RefreshCw,
  Sparkles,
  Building2,
  AlertCircle,
  Paperclip,
} from "lucide-react"
import {
  getCutiList,
  createCuti,
  updateCutiStatus,
  getPegawaiSaldoCuti,
  deleteCuti,
} from "@/lib/actions/cuti"

interface LeaveRequest {
  id: string
  employeeName: string
  employeeNik: string
  employeeInitials: string
  unit: string
  type: string
  startDate: string
  endDate: string
  duration: number
  reason: string
  dokumenUrl?: string | null
  status: "pending" | "approved" | "rejected"
  submittedDate: string
}

const statusConfig = {
  pending: {
    label: "Menunggu",
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    dot: "bg-amber-500",
    icon: Clock,
  },
  approved: {
    label: "Disetujui",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Ditolak",
    badge: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
    dot: "bg-rose-500",
    icon: XCircle,
  },
}

const LEAVE_TYPE_COLORS: Record<string, string> = {
  "Cuti Tahunan": "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border-slate-200/80 dark:border-zinc-700/80",
  "Cuti Sakit": "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  "Cuti Melahirkan": "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
  "Cuti Besar": "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  "Izin Tidak Masuk": "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 border-slate-200/80 dark:border-zinc-700/80",
}

export default function CutiPage() {
  const { data: session } = useSession()
  const userRole = session?.user?.role || "PEGAWAI"
  const isHRD = userRole === "HRD" || userRole === "SUPERADMIN" || userRole === "DIREKTUR"

  const [leaveList, setLeaveList] = useState<LeaveRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [saldoCuti, setSaldoCuti] = useState(0)

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [reason, setReason] = useState("")
  const [leaveType, setLeaveType] = useState("Cuti Tahunan")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [viewingDoc, setViewingDoc] = useState<{ url: string; title: string } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    const [listRes, saldoRes] = await Promise.all([
      getCutiList(),
      getPegawaiSaldoCuti(),
    ])

    if (listRes.data) {
      const mapped = listRes.data.map((c: any) => {
        const start = new Date(c.tanggalMulai)
        const end = new Date(c.tanggalSelesai)
        const dur =
          Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

        let normalizedStatus: "pending" | "approved" | "rejected" = "pending"
        if (c.status === "APPROVED") normalizedStatus = "approved"
        if (c.status === "REJECTED") normalizedStatus = "rejected"

        const names = (c.pegawai?.nama || "Unknown").split(" ")
        const initials =
          names.length > 1
            ? `${names[0][0]}${names[1][0]}`
            : names[0].slice(0, 2).toUpperCase()

        return {
          id: c.id,
          employeeName: c.pegawai?.nama || "Unknown",
          employeeNik: c.pegawai?.nik || "-",
          employeeInitials: initials,
          unit: c.pegawai?.bidang?.nama || "PDAM TIARA",
          type: c.jenisCuti,
          startDate: format(start, "dd MMM yyyy", { locale: id }),
          endDate: format(end, "dd MMM yyyy", { locale: id }),
          duration: dur,
          reason: c.alasan,
          dokumenUrl: c.dokumenUrl || null,
          status: normalizedStatus,
          submittedDate: format(new Date(c.createdAt), "dd MMM yyyy", {
            locale: id,
          }),
        }
      })
      setLeaveList(mapped)
    }

    if (saldoRes && typeof saldoRes.data === "number") {
      setSaldoCuti(saldoRes.data)
    }

    setIsLoading(false)
  }

  const handleCreateCuti = async () => {
    if (!startDate || !endDate) {
      toast.error("Pilih tanggal mulai dan selesai")
      return
    }
    if (!reason.trim()) {
      toast.error("Alasan cuti wajib diisi")
      return
    }

    setIsSubmitting(true)
    const payload = {
      tanggalMulai: startDate,
      tanggalSelesai: endDate,
      jenisCuti: leaveType,
      alasan: reason,
    }

    const res = await createCuti(payload)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("Pengajuan cuti berhasil dikirim")
      setShowAddDialog(false)
      setStartDate(undefined)
      setEndDate(undefined)
      setReason("")
      fetchData()
    }
    setIsSubmitting(false)
  }

  const handleDeleteCuti = async (id: string) => {
    if (
      !confirm(
        "Apakah Anda yakin ingin menghapus data cuti ini? Saldo cuti akan dikembalikan jika cuti ini statusnya disetujui."
      )
    )
      return
    const res = await deleteCuti(id)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("Data cuti berhasil dihapus")
      fetchData()
    }
  }

  const handleAction = async (id: string, action: "APPROVED" | "REJECTED") => {
    const res = await updateCutiStatus(id, action)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(
        `Cuti berhasil ${action === "APPROVED" ? "disetujui" : "ditolak"}`
      )
      fetchData()
    }
  }

  // Filtered List
  const filteredLeave = leaveList.filter((item) => {
    const matchSearch =
      item.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.employeeNik.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus =
      statusFilter === "all" || item.status === statusFilter
    const matchType = typeFilter === "all" || item.type === typeFilter
    return matchSearch && matchStatus && matchType
  })

  // Stats calculate
  const totalCount = leaveList.length
  const pendingCount = leaveList.filter((l) => l.status === "pending").length
  const approvedCount = leaveList.filter((l) => l.status === "approved").length
  const rejectedCount = leaveList.filter((l) => l.status === "rejected").length

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-[#0B0C0E]">
      <SidebarNav />

      <div className="flex flex-1 flex-col sidebar-offset min-w-0">
        <TopBar breadcrumb={["Kehadiran", "Cuti & Izin"]} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1720px] mx-auto w-full">

          {/* ── 1. CLEAN ENTERPRISE HEADER ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200/80 dark:border-zinc-800/80">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
                  Manajemen Cuti & Izin
                </h1>
                <span className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200/80 dark:border-zinc-700/80">
                  {isHRD ? "Pusat Approval SDM" : "Portal Pegawai"}
                </span>
              </div>
              <p className="text-xs sm:text-[13px] text-slate-500 dark:text-zinc-400 mt-1">
                Kelola permohonan cuti tahunan, sakit, izin dinas, serta status persetujuan pegawai PDAM TIARA.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {!isHRD && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-xs font-medium text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-700/80">
                  <span className="text-slate-500 dark:text-zinc-400">Sisa Kuota Cuti:</span>
                  <span className="font-semibold text-slate-900 dark:text-zinc-100">{saldoCuti} Hari</span>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                className="h-9 text-xs rounded-lg border-slate-200 dark:border-zinc-800 font-medium text-slate-700 dark:text-zinc-300 shadow-2xs"
              >
                <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isLoading && "animate-spin")} />
                Refresh
              </Button>

              <Button
                size="sm"
                onClick={() => setShowAddDialog(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-xs font-semibold rounded-lg h-9 px-3.5 shadow-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Ajukan Cuti & Izin
              </Button>
            </div>
          </div>

          {/* ── 2. CLEAN ENTERPRISE STAT CARDS ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                title: "Total Pengajuan",
                value: totalCount,
                sub: "Seluruh catatan cuti",
                icon: Plane,
              },
              {
                title: "Menunggu Persetujuan",
                value: pendingCount,
                sub: "Perlu ditindaklanjuti",
                icon: Clock,
              },
              {
                title: "Disetujui",
                value: approvedCount,
                sub: "Permohonan sah",
                icon: CheckCircle2,
              },
              {
                title: "Ditolak",
                value: rejectedCount,
                sub: "Tidak memenuhi syarat",
                icon: XCircle,
              },
            ].map((c, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 p-4 shadow-2xs hover:border-slate-300 dark:hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                    {c.title}
                  </span>
                  <div className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-zinc-800/80 flex items-center justify-center text-slate-600 dark:text-zinc-400 shrink-0">
                    <c.icon className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 tabular-nums">
                  {isLoading ? "..." : c.value}
                </div>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5 truncate">
                  {c.sub}
                </p>
              </div>
            ))}
          </div>

          {/* ── 3. FILTER BAR ── */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 p-2.5 rounded-xl shadow-2xs">
            <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-zinc-900 rounded-lg border border-slate-200/80 dark:border-zinc-800 select-none">
              {[
                { id: "all", label: "Semua" },
                { id: "pending", label: "Menunggu" },
                { id: "approved", label: "Disetujui" },
                { id: "rejected", label: "Ditolak" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                    statusFilter === tab.id
                      ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-50 shadow-2xs"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5 max-w-lg">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, NIK, atau alasan..."
                  className="pl-8 h-8 text-xs rounded-lg bg-slate-50 dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 font-medium"
                />
              </div>

              <div className="w-full sm:w-[160px]">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-8 text-xs rounded-lg bg-slate-50 dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 font-medium">
                    <SelectValue placeholder="Jenis Cuti" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Semua Jenis</SelectItem>
                    <SelectItem value="Cuti Tahunan" className="text-xs">Cuti Tahunan</SelectItem>
                    <SelectItem value="Cuti Sakit" className="text-xs">Cuti Sakit</SelectItem>
                    <SelectItem value="Cuti Melahirkan" className="text-xs">Cuti Melahirkan</SelectItem>
                    <SelectItem value="Cuti Besar" className="text-xs">Cuti Besar</SelectItem>
                    <SelectItem value="Izin Tidak Masuk" className="text-xs">Izin Tidak Masuk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ── 4. MODERN TABLE ── */}
          <div className="bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 rounded-xl shadow-2xs overflow-hidden">
            {isLoading ? (
              <div className="p-16 text-center space-y-3">
                <RefreshCw className="h-7 w-7 text-slate-400 animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-600 dark:text-zinc-300">
                  Memuat data cuti & izin...
                </p>
              </div>
            ) : filteredLeave.length === 0 ? (
              <div className="p-16 text-center space-y-2">
                <CalendarOff className="h-8 w-8 text-slate-300 dark:text-zinc-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                  Tidak ada data pengajuan cuti
                </p>
                <p className="text-xs text-slate-400 dark:text-zinc-500">
                  Belum ada permohonan yang sesuai dengan filter yang dipilih.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="text-xs">
                  <TableHeader>
                    <tr className="bg-slate-50/80 dark:bg-zinc-900/80 border-b border-slate-200/80 dark:border-zinc-800 text-[11px] font-semibold text-slate-600 dark:text-zinc-400">
                      <TableHead className="py-3 px-4 min-w-[200px]">Pegawai</TableHead>
                      <TableHead className="py-3 px-3">Jenis Cuti</TableHead>
                      <TableHead className="py-3 px-3">Periode & Durasi</TableHead>
                      <TableHead className="py-3 px-3 max-w-[240px]">Alasan Permohonan</TableHead>
                      <TableHead className="py-3 px-3">Diajukan</TableHead>
                      <TableHead className="py-3 px-3 text-center">Status</TableHead>
                      <TableHead className="py-3 px-3 text-right">Aksi</TableHead>
                    </tr>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-medium">
                    {filteredLeave.map((item) => {
                      const cfg = statusConfig[item.status]
                      const typeBadgeClass =
                        LEAVE_TYPE_COLORS[item.type] ||
                        "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300"

                      return (
                        <tr
                          key={item.id}
                          className="transition-colors hover:bg-slate-50/60 dark:hover:bg-zinc-800/30"
                        >
                          {/* Pegawai */}
                          <TableCell className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 rounded-lg border border-slate-200 dark:border-zinc-800">
                                <AvatarFallback className="rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                                  {item.employeeInitials}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-zinc-100 text-xs leading-none">
                                  {item.employeeName}
                                </p>
                                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1 font-mono">
                                  {item.employeeNik} · <span className="text-slate-600 dark:text-zinc-400 font-sans">{item.unit}</span>
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Jenis Cuti */}
                          <TableCell className="py-3 px-3">
                            <Badge className={cn("text-[10px] font-medium rounded-md px-2 py-0.5 border", typeBadgeClass)}>
                              {item.type}
                            </Badge>
                          </TableCell>

                          {/* Periode & Durasi */}
                          <TableCell className="py-3 px-3 text-[11px]">
                            <p className="text-slate-800 dark:text-zinc-200 font-medium">
                              {item.startDate} – {item.endDate}
                            </p>
                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-zinc-400 font-medium mt-0.5">
                              <Clock className="w-3 h-3" />
                              {item.duration} Hari Kerja
                            </span>
                          </TableCell>

                          {/* Alasan & Bukti Lampiran */}
                          <TableCell className="py-3 px-3 max-w-[240px]">
                            <p className="text-slate-700 dark:text-zinc-300 truncate text-xs" title={item.reason}>
                              {item.reason}
                            </p>
                            {item.dokumenUrl && (
                              <button
                                type="button"
                                onClick={() => setViewingDoc({ url: item.dokumenUrl!, title: `Surat Bukti ${item.type} — ${item.employeeName}` })}
                                className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-2 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-800/60 transition-colors"
                              >
                                <Paperclip className="h-3 w-3 shrink-0" />
                                <span>Lihat Surat Bukti</span>
                              </button>
                            )}
                          </TableCell>

                          {/* Tanggal Diajukan */}
                          <TableCell className="py-3 px-3 text-slate-400 text-[11px]">
                            {item.submittedDate}
                          </TableCell>

                          {/* Status */}
                          <TableCell className="py-3 px-3 text-center">
                            <span className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium border",
                              cfg.badge
                            )}>
                              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
                              {cfg.label}
                            </span>
                          </TableCell>

                          {/* Aksi */}
                          <TableCell className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {isHRD && item.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAction(item.id, "APPROVED")}
                                    className="h-7 px-2.5 text-xs rounded-md border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-medium"
                                    title="Setujui Cuti"
                                  >
                                    <Check className="h-3 w-3 mr-1" />
                                    Setujui
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAction(item.id, "REJECTED")}
                                    className="h-7 px-2 text-xs rounded-md border-slate-200 dark:border-zinc-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium"
                                    title="Tolak Cuti"
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Tolak
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteCuti(item.id)}
                                className="h-7 w-7 p-0 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                title="Hapus Data Cuti"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </tr>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* ── 5. DIALOG: AJUKAN CUTI & IZIN ── */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent className="max-w-md rounded-xl bg-white dark:bg-[#111113] border-slate-200 dark:border-zinc-800">
              <DialogHeader>
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-700/80">
                    <CalendarOff className="w-4 h-4" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
                      Ajukan Cuti & Izin
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400">
                      Sisa saldo cuti tahunan Anda: <strong className="text-slate-900 dark:text-zinc-100 font-semibold">{saldoCuti} hari</strong>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-3.5 py-2 text-xs">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Jenis Cuti</label>
                  <Select value={leaveType} onValueChange={setLeaveType}>
                    <SelectTrigger className="h-9 rounded-lg bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs">
                      <SelectValue placeholder="Pilih jenis cuti" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cuti Tahunan" className="text-xs">Cuti Tahunan</SelectItem>
                      <SelectItem value="Cuti Sakit" className="text-xs">Cuti Sakit</SelectItem>
                      <SelectItem value="Cuti Melahirkan" className="text-xs">Cuti Melahirkan</SelectItem>
                      <SelectItem value="Cuti Besar" className="text-xs">Cuti Besar</SelectItem>
                      <SelectItem value="Izin Tidak Masuk" className="text-xs">Izin Tidak Masuk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Tanggal Mulai</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-9 justify-start text-left font-normal rounded-lg bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs",
                            !startDate && "text-slate-400"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                          {startDate ? format(startDate, "dd MMM yyyy", { locale: id }) : "Pilih tanggal"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Tanggal Selesai</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-9 justify-start text-left font-normal rounded-lg bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs",
                            !endDate && "text-slate-400"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                          {endDate ? format(endDate, "dd MMM yyyy", { locale: id }) : "Pilih tanggal"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          disabled={(date) => startDate ? date < startDate : false}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {startDate && endDate && (
                  <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-[11px] flex items-center justify-between border border-slate-200/80 dark:border-zinc-700/80">
                    <span className="text-slate-500 dark:text-zinc-400">Perkiraan durasi cuti:</span>
                    <strong className="font-semibold text-slate-900 dark:text-zinc-100">
                      {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} Hari
                    </strong>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Alasan Permohonan</label>
                  <Textarea
                    placeholder="Jelaskan alasan pengajuan cuti secara singkat..."
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="rounded-lg bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddDialog(false)}
                  className="rounded-lg text-xs h-9"
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateCuti}
                  disabled={isSubmitting}
                  className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg text-xs font-semibold h-9 px-4"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    "Kirim Pengajuan"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ── DIALOG PREVIEW SURAT DOKTER / BUKTI LAMPIRAN ── */}
          {viewingDoc && (
            <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
              <DialogContent className="max-w-2xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                <DialogHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <DialogTitle className="text-sm font-bold flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-blue-500" />
                    <span>{viewingDoc.title}</span>
                  </DialogTitle>
                </DialogHeader>

                <div className="max-h-[70vh] flex items-center justify-center overflow-auto rounded-xl bg-zinc-950 p-2 border border-zinc-800 my-2">
                  {viewingDoc.url.toLowerCase().endsWith(".pdf") || viewingDoc.url.includes("application/pdf") ? (
                    <iframe 
                      src={viewingDoc.url} 
                      title={viewingDoc.title}
                      className="w-full h-[60vh] border-none rounded-lg" 
                    />
                  ) : (
                    <img 
                      src={viewingDoc.url} 
                      alt="Surat Bukti" 
                      className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-xl" 
                    />
                  )}
                </div>

                <DialogFooter className="flex items-center justify-between sm:justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3">
                  <a
                    href={viewingDoc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Buka / Unduh Dokumen Asli
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingDoc(null)}
                    className="text-xs rounded-lg"
                  >
                    Tutup
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

        </main>
      </div>
    </div>
  )
}
