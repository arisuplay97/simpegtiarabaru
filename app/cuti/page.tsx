"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

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
  status: "pending" | "approved" | "rejected"
  submittedDate: string
  approvedBy?: string
  approvedDate?: string
}

const leaveRequests: LeaveRequest[] = [
  {
    id: "1",
    employeeName: "Ahmad Rizki Pratama",
    employeeNik: "198501152010011001",
    employeeInitials: "AR",
    unit: "IT & Sistem",
    type: "Cuti Tahunan",
    startDate: "18 Mar 2026",
    endDate: "22 Mar 2026",
    duration: 5,
    reason: "Keperluan keluarga",
    status: "pending",
    submittedDate: "15 Mar 2026",
  },
  {
    id: "2",
    employeeName: "Siti Nurhaliza",
    employeeNik: "199003222015012002",
    employeeInitials: "SN",
    unit: "Keuangan",
    type: "Cuti Sakit",
    startDate: "10 Mar 2026",
    endDate: "12 Mar 2026",
    duration: 3,
    reason: "Sakit demam",
    status: "approved",
    submittedDate: "09 Mar 2026",
    approvedBy: "Manager Keuangan",
    approvedDate: "09 Mar 2026",
  },
  {
    id: "3",
    employeeName: "Budi Santoso",
    employeeNik: "198712052008011003",
    employeeInitials: "BS",
    unit: "Distribusi",
    type: "Cuti Tahunan",
    startDate: "25 Mar 2026",
    endDate: "28 Mar 2026",
    duration: 4,
    reason: "Liburan keluarga",
    status: "pending",
    submittedDate: "14 Mar 2026",
  },
  {
    id: "4",
    employeeName: "Dewi Lestari",
    employeeNik: "199205152018012004",
    employeeInitials: "DL",
    unit: "Pelayanan",
    type: "Izin Tidak Masuk",
    startDate: "17 Mar 2026",
    endDate: "17 Mar 2026",
    duration: 1,
    reason: "Keperluan mendadak",
    status: "rejected",
    submittedDate: "16 Mar 2026",
  },
  {
    id: "5",
    employeeName: "Indah Permata",
    employeeNik: "199105152019012001",
    employeeInitials: "IP",
    unit: "Pelayanan",
    type: "Cuti Melahirkan",
    startDate: "01 Mar 2026",
    endDate: "30 May 2026",
    duration: 90,
    reason: "Cuti melahirkan",
    status: "approved",
    submittedDate: "20 Feb 2026",
    approvedBy: "Direktur SDM",
    approvedDate: "21 Feb 2026",
  },
]

const statusConfig = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
  approved: { label: "Disetujui", className: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  rejected: { label: "Ditolak", className: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
}

const leaveStats = [
  { label: "Total Pengajuan", value: "156", icon: Plane, color: "text-primary" },
  { label: "Pending", value: "24", icon: Clock, color: "text-amber-600" },
  { label: "Disetujui", value: "125", icon: CheckCircle2, color: "text-emerald-600" },
  { label: "Ditolak", value: "7", icon: XCircle, color: "text-red-600" },
]

export default function CutiPage() {
  const [leaveList, setLeaveList] = useState<LeaveRequest[]>(leaveRequests)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [reason, setReason] = useState("")
  const [leaveType, setLeaveType] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const itemsPerPage = 5

  const filteredRequests = leaveList.filter((req) => {
    const matchesSearch =
      req.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.employeeNik.includes(searchQuery)
    const matchesStatus = statusFilter === "all" || req.status === statusFilter
    const matchesType = typeFilter === "all" || req.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleApplyLeave = () => {
    if (!startDate || !endDate || !leaveType || !reason) {
      toast.error("Harap isi semua bidang wajib")
      return
    }

    if (startDate > endDate) {
      toast.error("Tanggal mulai tidak boleh setelah tanggal selesai")
      return
    }

    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    const newRequest: LeaveRequest = {
      id: (leaveList.length + 1).toString(),
      employeeName: "User Profile", // Mock current user
      employeeNik: "199001012020011001",
      employeeInitials: "UP",
      unit: "SDM & Umum",
      type: leaveType,
      startDate: format(startDate, "dd MMM yyyy"),
      endDate: format(endDate, "dd MMM yyyy"),
      duration,
      reason,
      status: "pending",
      submittedDate: format(new Date(), "dd MMM yyyy"),
    }

    setLeaveList([newRequest, ...leaveList])
    setShowAddDialog(false)
    setStartDate(undefined)
    setEndDate(undefined)
    setReason("")
    setLeaveType("")
    toast.success("Pengajuan cuti berhasil dikirim")
  }


  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col pl-64">
        <TopBar breadcrumb={["Kehadiran", "Cuti & Izin"]} />
        <main className="flex-1 overflow-auto p-6">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Cuti & Izin</h1>
              <p className="text-sm text-muted-foreground">
                Kelola pengajuan cuti dan izin pegawai
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Ajukan Cuti
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Ajukan Cuti / Izin</DialogTitle>
                    <DialogDescription>
                      Isi form berikut untuk mengajukan cuti atau izin
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium">Jenis Cuti</label>
                      <Select value={leaveType} onValueChange={setLeaveType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis cuti" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cuti Tahunan">Cuti Tahunan</SelectItem>
                          <SelectItem value="Cuti Sakit">Cuti Sakit</SelectItem>
                          <SelectItem value="Cuti Melahirkan">Cuti Melahirkan</SelectItem>
                          <SelectItem value="Cuti Besar">Cuti Besar</SelectItem>
                          <SelectItem value="Izin Tidak Masuk">Izin Tidak Masuk</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium">Tanggal Mulai</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !startDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {startDate ? format(startDate, "dd MMM yyyy", { locale: id }) : "Pilih tanggal"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={startDate}
                              onSelect={setStartDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium">Tanggal Selesai</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !endDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {endDate ? format(endDate, "dd MMM yyyy", { locale: id }) : "Pilih tanggal"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={endDate}
                              onSelect={setEndDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">Alasan</label>
                      <Textarea 
                        placeholder="Masukkan alasan pengajuan cuti..." 
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">Alamat Selama Cuti</label>
                      <Input placeholder="Alamat yang bisa dihubungi" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">No. HP Darurat</label>
                      <Input placeholder="Nomor yang bisa dihubungi" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Batal
                    </Button>
                    <Button onClick={handleApplyLeave}>
                      Ajukan
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {leaveStats.map((stat) => (
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

          {/* Filters */}
          <Card className="card-premium mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama atau NIK..."
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
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Disetujui</SelectItem>
                      <SelectItem value="rejected">Ditolak</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Jenis Cuti" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Jenis</SelectItem>
                      <SelectItem value="Cuti Tahunan">Cuti Tahunan</SelectItem>
                      <SelectItem value="Cuti Sakit">Cuti Sakit</SelectItem>
                      <SelectItem value="Cuti Melahirkan">Cuti Melahirkan</SelectItem>
                      <SelectItem value="Izin Tidak Masuk">Izin Tidak Masuk</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
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
                      <TableHead>Jenis</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Durasi</TableHead>
                      <TableHead>Alasan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px] text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRequests.length > 0 ? (
                      paginatedRequests.map((request) => {
                      const StatusIcon = statusConfig[request.status].icon
                      return (
                        <TableRow key={request.id} className="hover:bg-muted/30">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary/10 text-sm text-primary">
                                  {request.employeeInitials}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-foreground">{request.employeeName}</p>
                                <p className="text-xs text-muted-foreground">{request.unit}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{request.type}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {request.startDate === request.endDate
                              ? request.startDate
                              : `${request.startDate} - ${request.endDate}`}
                          </TableCell>
                          <TableCell className="text-sm">
                            {request.duration} hari
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                            {request.reason}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn("gap-1", statusConfig[request.status].className)}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {statusConfig[request.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          Tidak ada data pengajuan yang ditemukan.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-border p-4">
                <p className="text-sm text-muted-foreground">
                  Menampilkan {paginatedRequests.length} dari {filteredRequests.length} pengajuan
                </p>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
