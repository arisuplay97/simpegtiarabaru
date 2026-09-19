"use client"

import { useState } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import {
  Search,
  Plus,
  CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  FilePenLine,
  AlertCircle,
  Loader2,
  Eye,
  ArrowRight,
  RefreshCw,
  Building2,
  Check,
  X,
  FileEdit,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// ============ TIPE DATA ============
interface KoreksiAbsensi {
  id: string
  employeeName: string
  employeeInitials: string
  employeeUnit: string
  nik: string
  tanggal: string
  checkInLama: string | null
  checkOutLama: string | null
  checkInBaru: string
  checkOutBaru: string
  alasan: string
  status: "pending" | "approved" | "rejected"
  submittedDate: string
  approvedBy?: string
  alasanTolak?: string
}

// ============ DATA AWAL ============
const initialData: KoreksiAbsensi[] = [
  {
    id: "1",
    employeeName: "Ahmad Rizki Pratama",
    employeeInitials: "AR",
    employeeUnit: "IT & Sistem Informasi",
    nik: "EMP-00102",
    tanggal: "15 Mar 2026",
    checkInLama: null,
    checkOutLama: null,
    checkInBaru: "08:00",
    checkOutBaru: "17:00",
    alasan: "Lupa absen karena mesin fingerprint dan jaringan kantor sedang maintenance pagi hari",
    status: "pending",
    submittedDate: "16 Mar 2026",
  },
  {
    id: "2",
    employeeName: "Siti Nurhaliza",
    employeeInitials: "SN",
    employeeUnit: "Keuangan & Akuntansi",
    nik: "EMP-00105",
    tanggal: "14 Mar 2026",
    checkInLama: "08:00",
    checkOutLama: null,
    checkInBaru: "08:00",
    checkOutBaru: "17:00",
    alasan: "Lupa check-out sore hari karena langsung berangkat rapat dinas eksternal",
    status: "approved",
    submittedDate: "15 Mar 2026",
    approvedBy: "Manager SDM",
  },
  {
    id: "3",
    employeeName: "Budi Santoso",
    employeeInitials: "BS",
    employeeUnit: "Distribusi Air & Jaringan",
    nik: "EMP-00118",
    tanggal: "13 Mar 2026",
    checkInLama: "09:30",
    checkOutLama: "17:00",
    checkInBaru: "07:45",
    checkOutBaru: "17:00",
    alasan: "Check-in tercatat terlambat karena GPS handphone tidak mendeteksi radius lokasi kantor",
    status: "rejected",
    submittedDate: "14 Mar 2026",
    approvedBy: "Manager SDM",
    alasanTolak: "Tidak ada bukti pendukung surat tugas atau log riwayat aktivitas pada jam tersebut",
  },
]

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

export default function KoreksiAbsensiPage() {
  const [data, setData] = useState<KoreksiAbsensi[]>(initialData)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<KoreksiAbsensi | null>(null)
  const [alasanTolak, setAlasanTolak] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [formDate, setFormDate] = useState<Date>()
  const [formCheckInBaru, setFormCheckInBaru] = useState("")
  const [formCheckOutBaru, setFormCheckOutBaru] = useState("")
  const [formAlasan, setFormAlasan] = useState("")
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Filter
  const filtered = data.filter((item) => {
    const matchSearch =
      item.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nik.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.alasan.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = statusFilter === "all" || item.status === statusFilter
    return matchSearch && matchStatus
  })

  // Validasi Form
  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formDate) errors.tanggal = "Tanggal wajib dipilih"
    if (!formCheckInBaru) errors.checkInBaru = "Jam masuk wajib diisi"
    if (!formCheckOutBaru) errors.checkOutBaru = "Jam keluar wajib diisi"
    if (formCheckInBaru && formCheckOutBaru && formCheckInBaru >= formCheckOutBaru)
      errors.checkOutBaru = "Jam keluar harus setelah jam masuk"
    if (!formAlasan || formAlasan.length < 10)
      errors.alasan = "Alasan minimal 10 karakter"
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Submit Form
  const handleSubmit = async () => {
    if (!validateForm()) return
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 600))

    const newItem: KoreksiAbsensi = {
      id: String(Date.now()),
      employeeName: "Dwiky Firmansyah",
      employeeInitials: "DF",
      employeeUnit: "SDM & Umum",
      nik: "EMP-00109",
      tanggal: format(formDate!, "dd MMM yyyy", { locale: id }),
      checkInLama: null,
      checkOutLama: null,
      checkInBaru: formCheckInBaru,
      checkOutBaru: formCheckOutBaru,
      alasan: formAlasan,
      status: "pending",
      submittedDate: format(new Date(), "dd MMM yyyy", { locale: id }),
    }

    setData((prev) => [newItem, ...prev])
    setShowAddDialog(false)
    setFormDate(undefined)
    setFormCheckInBaru("")
    setFormCheckOutBaru("")
    setFormAlasan("")
    setFormErrors({})
    setIsLoading(false)
    toast.success("Pengajuan koreksi absensi berhasil dikirim")
  }

  // Approve
  const handleApprove = async (item: KoreksiAbsensi) => {
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 400))
    setData((prev) =>
      prev.map((d) =>
        d.id === item.id
          ? { ...d, status: "approved", approvedBy: "Manager SDM" }
          : d
      )
    )
    setIsLoading(false)
    toast.success(`Koreksi absensi ${item.employeeName} disetujui`)
  }

  // Reject
  const handleReject = async () => {
    if (!selectedItem) return
    if (!alasanTolak.trim()) {
      toast.error("Alasan penolakan wajib diisi")
      return
    }
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 400))
    setData((prev) =>
      prev.map((d) =>
        d.id === selectedItem.id
          ? { ...d, status: "rejected", approvedBy: "Manager SDM", alasanTolak }
          : d
      )
    )
    setShowRejectDialog(false)
    setAlasanTolak("")
    setSelectedItem(null)
    setIsLoading(false)
    toast.error(`Koreksi absensi ${selectedItem.employeeName} ditolak`)
  }

  // Stats calculation
  const totalCount = data.length
  const pendingCount = data.filter((d) => d.status === "pending").length
  const approvedCount = data.filter((d) => d.status === "approved").length
  const rejectedCount = data.filter((d) => d.status === "rejected").length

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-[#0B0C0E]">
      <SidebarNav />

      <div className="flex flex-1 flex-col sidebar-offset min-w-0">
        <TopBar breadcrumb={["Kehadiran", "Koreksi Absensi"]} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1720px] mx-auto w-full">

          {/* ── 1. CLEAN ENTERPRISE HEADER ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200/80 dark:border-zinc-800/80">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
                  Koreksi Absensi
                </h1>
                <span className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200/80 dark:border-zinc-700/80">
                  Penyesuaian Presensi
                </span>
              </div>
              <p className="text-xs sm:text-[13px] text-slate-500 dark:text-zinc-400 mt-1">
                Kelola pengajuan perbaikan catatan jam masuk dan pulang kerja pegawai secara terstruktur.
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => setShowAddDialog(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-xs font-semibold rounded-lg h-9 px-3.5 shadow-xs shrink-0 self-start sm:self-auto"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Ajukan Koreksi Presensi
            </Button>
          </div>

          {/* ── 2. CLEAN ENTERPRISE STAT CARDS ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                title: "Total Pengajuan",
                value: totalCount,
                sub: "Seluruh catatan koreksi",
                icon: FileEdit,
              },
              {
                title: "Menunggu Verifikasi",
                value: pendingCount,
                sub: "Perlu ditinjau HRD",
                icon: Clock,
              },
              {
                title: "Disetujui",
                value: approvedCount,
                sub: "Presensi disesuaikan",
                icon: CheckCircle2,
              },
              {
                title: "Ditolak",
                value: rejectedCount,
                sub: "Bukti tidak valid",
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
                  {c.value}
                </div>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5 truncate">
                  {c.sub}
                </p>
              </div>
            ))}
          </div>

          {/* ── 3. FILTER BAR ── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 p-2.5 rounded-xl shadow-2xs">
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

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, NIK, alasan..."
                className="pl-8 h-8 text-xs rounded-lg bg-slate-50 dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 font-medium"
              />
            </div>
          </div>

          {/* ── 4. MODERN TABLE WITH CLEAN VISUAL DIFF ── */}
          <div className="bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 rounded-xl shadow-2xs overflow-hidden">
            {filtered.length === 0 ? (
              <div className="p-16 text-center space-y-2">
                <FilePenLine className="h-8 w-8 text-slate-300 dark:text-zinc-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                  Tidak ada permohonan koreksi absensi
                </p>
                <p className="text-xs text-slate-400 dark:text-zinc-500">
                  Belum ada catatan yang sesuai dengan filter pencarian.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="text-xs">
                  <TableHeader>
                    <tr className="bg-slate-50/80 dark:bg-zinc-900/80 border-b border-slate-200/80 dark:border-zinc-800 text-[11px] font-semibold text-slate-600 dark:text-zinc-400">
                      <TableHead className="py-3 px-4 min-w-[200px]">Pegawai</TableHead>
                      <TableHead className="py-3 px-3">Tanggal Absen</TableHead>
                      <TableHead className="py-3 px-3 min-w-[250px]">Perubahan Jam (Sebelum ➔ Sesudah)</TableHead>
                      <TableHead className="py-3 px-3 max-w-[240px]">Alasan Permohonan</TableHead>
                      <TableHead className="py-3 px-3">Diajukan</TableHead>
                      <TableHead className="py-3 px-3 text-center">Status</TableHead>
                      <TableHead className="py-3 px-3 text-right">Aksi</TableHead>
                    </tr>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-medium">
                    {filtered.map((item) => {
                      const cfg = statusConfig[item.status]

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
                                  {item.nik} · <span className="text-slate-600 dark:text-zinc-400 font-sans">{item.employeeUnit}</span>
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Tanggal */}
                          <TableCell className="py-3 px-3 font-medium text-slate-800 dark:text-zinc-200 whitespace-nowrap">
                            {item.tanggal}
                          </TableCell>

                          {/* Clean Visual Diff */}
                          <TableCell className="py-3 px-3">
                            <div className="space-y-1 font-mono text-[11px]">
                              {/* Jam Masuk */}
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] uppercase font-sans text-slate-400 w-11 shrink-0">Masuk</span>
                                <span className={cn(
                                  item.checkInLama ? "text-slate-500 dark:text-slate-400" : "text-slate-400 italic text-[10px]"
                                )}>
                                  {item.checkInLama || "Kosong"}
                                </span>
                                <ArrowRight className="w-3 h-3 text-slate-300 dark:text-zinc-600 shrink-0" />
                                <span className="font-semibold text-slate-900 dark:text-zinc-100 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/80">
                                  {item.checkInBaru}
                                </span>
                              </div>

                              {/* Jam Pulang */}
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] uppercase font-sans text-slate-400 w-11 shrink-0">Pulang</span>
                                <span className={cn(
                                  item.checkOutLama ? "text-slate-500 dark:text-slate-400" : "text-slate-400 italic text-[10px]"
                                )}>
                                  {item.checkOutLama || "Kosong"}
                                </span>
                                <ArrowRight className="w-3 h-3 text-slate-300 dark:text-zinc-600 shrink-0" />
                                <span className="font-semibold text-slate-900 dark:text-zinc-100 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/80">
                                  {item.checkOutBaru}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          {/* Alasan */}
                          <TableCell className="py-3 px-3 max-w-[240px]">
                            <p className="text-slate-700 dark:text-zinc-300 truncate text-xs" title={item.alasan}>
                              {item.alasan}
                            </p>
                          </TableCell>

                          {/* Tanggal Diajukan */}
                          <TableCell className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                            {item.submittedDate}
                          </TableCell>

                          {/* Status */}
                          <TableCell className="py-3 px-3 text-center whitespace-nowrap">
                            <span className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium border",
                              cfg.badge
                            )}>
                              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
                              {cfg.label}
                            </span>
                          </TableCell>

                          {/* Aksi */}
                          <TableCell className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedItem(item)
                                  setShowDetailDialog(true)
                                }}
                                className="h-7 px-2 text-xs rounded-md text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                Detail
                              </Button>

                              {item.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleApprove(item)}
                                    className="h-7 px-2.5 text-xs rounded-md border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-medium"
                                  >
                                    <Check className="h-3 w-3 mr-1" />
                                    Setujui
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedItem(item)
                                      setShowRejectDialog(true)
                                    }}
                                    className="h-7 px-2 text-xs rounded-md border-slate-200 dark:border-zinc-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium"
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Tolak
                                  </Button>
                                </>
                              )}
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

          {/* ── 5. DIALOG: AJUKAN KOREKSI ── */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent className="max-w-md rounded-xl bg-white dark:bg-[#111113] border-slate-200 dark:border-zinc-800">
              <DialogHeader>
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-700/80">
                    <FilePenLine className="w-4 h-4" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
                      Ajukan Koreksi Presensi
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400">
                      Masukkan data kehadiran yang benar untuk diverifikasi atasan
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-3.5 py-2 text-xs">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Tanggal Absensi <span className="text-rose-500">*</span>
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-9 justify-start text-left font-normal rounded-lg bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs",
                          !formDate && "text-slate-400"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                        {formDate ? format(formDate, "dd MMMM yyyy", { locale: id }) : "Pilih tanggal"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                      <Calendar
                        mode="single"
                        selected={formDate}
                        onSelect={setFormDate}
                        disabled={(d) => d > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {formErrors.tanggal && (
                    <p className="text-[11px] text-rose-500">{formErrors.tanggal}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Jam Masuk (Benar) <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="time"
                      value={formCheckInBaru}
                      onChange={(e) => setFormCheckInBaru(e.target.value)}
                      className="h-9 rounded-lg bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs font-mono"
                    />
                    {formErrors.checkInBaru && (
                      <p className="text-[11px] text-rose-500">{formErrors.checkInBaru}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Jam Keluar (Benar) <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="time"
                      value={formCheckOutBaru}
                      onChange={(e) => setFormCheckOutBaru(e.target.value)}
                      className="h-9 rounded-lg bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs font-mono"
                    />
                    {formErrors.checkOutBaru && (
                      <p className="text-[11px] text-rose-500">{formErrors.checkOutBaru}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Alasan Koreksi <span className="text-rose-500">*</span>
                  </label>
                  <Textarea
                    placeholder="Jelaskan alasan pengajuan koreksi jam absensi..."
                    value={formAlasan}
                    onChange={(e) => setFormAlasan(e.target.value)}
                    rows={3}
                    className="rounded-lg bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs"
                  />
                  {formErrors.alasan && (
                    <p className="text-[11px] text-rose-500">{formErrors.alasan}</p>
                  )}
                  <p className="text-[10px] text-slate-400">
                    Minimal 10 karakter ({formAlasan.length} karakter terisi)
                  </p>
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
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg text-xs font-semibold h-9 px-4"
                >
                  {isLoading ? (
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

          {/* ── 6. DIALOG: DETAIL KOREKSI ── */}
          <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
            <DialogContent className="max-w-md rounded-xl bg-white dark:bg-[#111113] border-slate-200 dark:border-zinc-800">
              <DialogHeader>
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-700/80">
                    <FilePenLine className="w-4 h-4" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
                      Rincian Koreksi Absensi
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400">
                      Detail lengkap perubahan jam kehadiran
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {selectedItem && (
                <div className="space-y-3 py-2 text-xs">
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 space-y-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                      {selectedItem.employeeName}
                    </p>
                    <p className="text-slate-500 font-mono">
                      {selectedItem.nik} · {selectedItem.employeeUnit}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Perbandingan Jam Presensi ({selectedItem.tanggal})
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700">
                        <span className="text-[10px] font-sans text-slate-400 block">Jam Masuk</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-slate-400 line-through">{selectedItem.checkInLama || "--:--"}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="font-semibold text-slate-900 dark:text-zinc-100">{selectedItem.checkInBaru}</span>
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700">
                        <span className="text-[10px] font-sans text-slate-400 block">Jam Keluar</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-slate-400 line-through">{selectedItem.checkOutLama || "--:--"}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="font-semibold text-slate-900 dark:text-zinc-100">{selectedItem.checkOutBaru}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-zinc-400 block mb-0.5">
                      Alasan Permohonan
                    </span>
                    <p className="text-slate-700 dark:text-zinc-300">
                      {selectedItem.alasan}
                    </p>
                  </div>

                  {selectedItem.alasanTolak && (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                      <span className="text-[10px] uppercase font-semibold text-rose-600 dark:text-rose-400 block mb-0.5">
                        Alasan Penolakan
                      </span>
                      <p className="text-slate-700 dark:text-zinc-300">
                        {selectedItem.alasanTolak}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetailDialog(false)}
                  className="rounded-lg text-xs h-9"
                >
                  Tutup
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ── 7. DIALOG: TOLAK KOREKSI ── */}
          <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
            <DialogContent className="max-w-md rounded-2xl bg-white dark:bg-[#111113] border-slate-200 dark:border-zinc-800">
              <DialogHeader>
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50">
                    <XCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
                      Tolak Koreksi Absensi
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400">
                      {selectedItem?.employeeName} · {selectedItem?.tanggal}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-3 py-2 text-xs">
                <p className="text-slate-600 dark:text-zinc-400">
                  Masukkan alasan mengapa permohonan koreksi absensi ini tidak disetujui:
                </p>
                <Textarea
                  placeholder="Contoh: Bukti pendukung tidak dilampirkan atau tidak ada konfirmasi atasan langsung..."
                  rows={3}
                  value={alasanTolak}
                  onChange={(e) => setAlasanTolak(e.target.value)}
                  className="rounded-xl bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs"
                />
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRejectDialog(false)}
                  className="rounded-xl text-xs h-9"
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  onClick={handleReject}
                  disabled={isLoading}
                  className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold h-9 px-4"
                >
                  {isLoading ? "Menolak..." : "Konfirmasi Penolakan"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </main>
      </div>
    </div>
  )
}
