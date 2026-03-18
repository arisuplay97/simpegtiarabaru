"use client"

import { useState } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
  FileEdit,
  AlertCircle,
  Loader2,
  Eye,
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

// ============ DATA DUMMY ============
const initialData: KoreksiAbsensi[] = [
  {
    id: "1",
    employeeName: "Ahmad Rizki Pratama",
    employeeInitials: "AR",
    employeeUnit: "IT & Sistem",
    nik: "3201150115850001",
    tanggal: "15 Mar 2026",
    checkInLama: null,
    checkOutLama: null,
    checkInBaru: "08:00",
    checkOutBaru: "17:00",
    alasan: "Lupa absen karena mesin fingerprint error pagi hari",
    status: "pending",
    submittedDate: "16 Mar 2026",
  },
  {
    id: "2",
    employeeName: "Siti Nurhaliza",
    employeeInitials: "SN",
    employeeUnit: "Keuangan",
    nik: "3201032215900001",
    tanggal: "14 Mar 2026",
    checkInLama: "08:00",
    checkOutLama: null,
    checkInBaru: "08:00",
    checkOutBaru: "17:00",
    alasan: "Lupa check-out karena terburu-buru rapat eksternal",
    status: "approved",
    submittedDate: "15 Mar 2026",
    approvedBy: "Manager SDM",
  },
  {
    id: "3",
    employeeName: "Budi Santoso",
    employeeInitials: "BS",
    employeeUnit: "Distribusi",
    nik: "3201050512870001",
    tanggal: "13 Mar 2026",
    checkInLama: "09:30",
    checkOutLama: "17:00",
    checkInBaru: "07:45",
    checkOutBaru: "17:00",
    alasan: "Check-in tercatat salah karena sinyal GPS lemah",
    status: "rejected",
    submittedDate: "14 Mar 2026",
    approvedBy: "Manager SDM",
    alasanTolak: "Tidak ada bukti pendukung yang dilampirkan",
  },
]

const statusConfig = {
  pending: {
    label: "Menunggu",
    className: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Clock,
  },
  approved: {
    label: "Disetujui",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Ditolak",
    className: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
  },
}

const statsData = [
  { label: "Total Pengajuan", value: "3", icon: FileEdit, color: "text-primary" },
  { label: "Menunggu", value: "1", icon: Clock, color: "text-amber-600" },
  { label: "Disetujui", value: "1", icon: CheckCircle2, color: "text-emerald-600" },
  { label: "Ditolak", value: "1", icon: XCircle, color: "text-red-600" },
]

// ============ KOMPONEN UTAMA ============
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

  // ---- Filter ----
  const filtered = data.filter((item) => {
    const matchSearch = item.employeeName
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    const matchStatus = statusFilter === "all" || item.status === statusFilter
    return matchSearch && matchStatus
  })

  // ---- Validasi Form ----
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

  // ---- Submit Form ----
  const handleSubmit = async () => {
    if (!validateForm()) return
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 800))

    const newItem: KoreksiAbsensi = {
      id: String(Date.now()),
      employeeName: "Dwiky Firmansyah", // user yang login
      employeeInitials: "DF",
      employeeUnit: "SDM & Umum",
      nik: "3201010101900001",
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

  // ---- Approve ----
  const handleApprove = async (item: KoreksiAbsensi) => {
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 600))
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

  // ---- Reject ----
  const handleReject = async () => {
    if (!selectedItem) return
    if (!alasanTolak.trim()) {
      toast.error("Alasan penolakan wajib diisi")
      return
    }
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 600))
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

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Kehadiran", "Koreksi Absensi"]} />
        <main className="flex-1 overflow-auto p-6">

          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Koreksi Absensi</h1>
              <p className="text-sm text-muted-foreground">
                Pengajuan koreksi data kehadiran pegawai
              </p>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Ajukan Koreksi
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Ajukan Koreksi Absensi</DialogTitle>
                  <DialogDescription>
                    Isi form berikut untuk mengajukan koreksi data kehadiran
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Tanggal */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Tanggal Absensi
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formDate
                            ? format(formDate, "dd MMMM yyyy", { locale: id })
                            : "Pilih tanggal"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formDate}
                          onSelect={setFormDate}
                          initialFocus
                          disabled={(date) => date > new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    {formErrors.tanggal && (
                      <p className="mt-1 text-xs text-destructive">{formErrors.tanggal}</p>
                    )}
                  </div>

                  {/* Jam Koreksi */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">
                        Jam Masuk (Koreksi)
                      </label>
                      <Input
                        type="time"
                        value={formCheckInBaru}
                        onChange={(e) => setFormCheckInBaru(e.target.value)}
                      />
                      {formErrors.checkInBaru && (
                        <p className="mt-1 text-xs text-destructive">{formErrors.checkInBaru}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">
                        Jam Keluar (Koreksi)
                      </label>
                      <Input
                        type="time"
                        value={formCheckOutBaru}
                        onChange={(e) => setFormCheckOutBaru(e.target.value)}
                      />
                      {formErrors.checkOutBaru && (
                        <p className="mt-1 text-xs text-destructive">{formErrors.checkOutBaru}</p>
                      )}
                    </div>
                  </div>

                  {/* Alasan */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Alasan Koreksi
                    </label>
                    <Textarea
                      placeholder="Jelaskan alasan pengajuan koreksi absensi..."
                      value={formAlasan}
                      onChange={(e) => setFormAlasan(e.target.value)}
                      rows={3}
                    />
                    {formErrors.alasan && (
                      <p className="mt-1 text-xs text-destructive">{formErrors.alasan}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formAlasan.length}/10 karakter minimum
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Batal
                  </Button>
                  <Button onClick={handleSubmit} disabled={isLoading}>
                    {isLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Mengirim...</>
                    ) : "Kirim Pengajuan"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statsData.map((stat) => (
              <Card key={stat.label} className="card-premium">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filter */}
          <Card className="card-premium mb-4">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama pegawai..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="pending">Menunggu</SelectItem>
                    <SelectItem value="approved">Disetujui</SelectItem>
                    <SelectItem value="rejected">Ditolak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tabel */}
          <Card className="card-premium">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[220px]">Pegawai</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead className="text-center">Data Lama</TableHead>
                      <TableHead className="text-center">Data Koreksi</TableHead>
                      <TableHead>Alasan</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Search className="h-8 w-8 text-muted-foreground/50" />
                            <p className="font-medium text-muted-foreground">
                              Tidak ada data ditemukan
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((item) => {
                        const StatusIcon = statusConfig[item.status].icon
                        return (
                          <TableRow key={item.id} className="hover:bg-muted/30">
                            {/* Pegawai */}
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                  <AvatarFallback className="bg-primary/10 text-xs text-primary">
                                    {item.employeeInitials}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{item.employeeName}</p>
                                  <p className="text-xs text-muted-foreground">{item.employeeUnit}</p>
                                </div>
                              </div>
                            </TableCell>

                            {/* Tanggal */}
                            <TableCell className="text-sm">{item.tanggal}</TableCell>

                            {/* Data Lama */}
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center gap-0.5 text-xs text-muted-foreground">
                                <span>Masuk: {item.checkInLama ?? <span className="text-red-500">-</span>}</span>
                                <span>Keluar: {item.checkOutLama ?? <span className="text-red-500">-</span>}</span>
                              </div>
                            </TableCell>

                            {/* Data Koreksi */}
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center gap-0.5 text-xs font-medium text-emerald-700">
                                <span>Masuk: {item.checkInBaru}</span>
                                <span>Keluar: {item.checkOutBaru}</span>
                              </div>
                            </TableCell>

                            {/* Alasan */}
                            <TableCell className="max-w-[180px]">
                              <p className="truncate text-sm text-muted-foreground">
                                {item.alasan}
                              </p>
                            </TableCell>

                            {/* Status */}
                            <TableCell className="text-center">
                              <Badge
                                variant="outline"
                                className={cn("gap-1", statusConfig[item.status].className)}
                              >
                                <StatusIcon className="h-3 w-3" />
                                {statusConfig[item.status].label}
                              </Badge>
                            </TableCell>

                            {/* Aksi */}
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                {/* Lihat Detail */}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    setSelectedItem(item)
                                    setShowDetailDialog(true)
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>

                                {/* Approve & Reject — hanya tampil jika pending */}
                                {item.status === "pending" && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                      onClick={() => handleApprove(item)}
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700"
                                      onClick={() => {
                                        setSelectedItem(item)
                                        setShowRejectDialog(true)
                                      }}
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Dialog Detail */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Koreksi Absensi</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Pegawai</p>
                  <p className="font-medium">{selectedItem.employeeName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Unit</p>
                  <p className="font-medium">{selectedItem.employeeUnit}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">NIK</p>
                  <p className="font-mono font-medium">{selectedItem.nik}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tanggal</p>
                  <p className="font-medium">{selectedItem.tanggal}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/50 p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Data Lama</p>
                  <p>Masuk: {selectedItem.checkInLama ?? "-"}</p>
                  <p>Keluar: {selectedItem.checkOutLama ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data Koreksi</p>
                  <p className="text-emerald-700 font-medium">Masuk: {selectedItem.checkInBaru}</p>
                  <p className="text-emerald-700 font-medium">Keluar: {selectedItem.checkOutBaru}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Alasan</p>
                <p>{selectedItem.alasan}</p>
              </div>
              {selectedItem.alasanTolak && (
                <div className="rounded-lg bg-red-50 p-3">
                  <p className="text-xs text-red-600 font-medium">Alasan Penolakan</p>
                  <p className="text-red-700">{selectedItem.alasanTolak}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge
                  variant="outline"
                  className={statusConfig[selectedItem.status].className}
                >
                  {statusConfig[selectedItem.status].label}
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog Tolak */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tolak Koreksi Absensi</AlertDialogTitle>
            <AlertDialogDescription>
              Masukkan alasan penolakan untuk{" "}
              <span className="font-medium">{selectedItem?.employeeName}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Alasan penolakan..."
            value={alasanTolak}
            onChange={(e) => setAlasanTolak(e.target.value)}
            rows={3}
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAlasanTolak("")}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menolak...</>
              ) : "Ya, Tolak"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
