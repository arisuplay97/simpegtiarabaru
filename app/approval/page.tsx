"use client"

import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { canApprove, processApprove, processReject, Pengajuan } from "@/lib/approval-flow"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Filter,
  Check,
  X,
  Eye,
  Calendar,
  Clock,
  MessageSquare,
  FileText,
  AlertCircle,
  Briefcase,
  Plane,
  ArrowRightLeft,
  Wallet,
  Star,
  MoreVertical,
  CheckCircle2,
  XCircle,
  MapPin,
  User,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react"

type ApprovalStatus = "pending" | "approved" | "rejected"
type ApprovalType = "cuti" | "lembur" | "mutasi" | "payroll" | "dokumen" | "pangkat" | "gaji"

interface ApprovalItem {
  id: string
  employeeName: string
  employeeNik: string
  employeeAvatar?: string
  employeeInitials: string
  pengajuName?: string
  pengajuInitials?: string
  unit: string
  jabatan: string
  type: ApprovalType
  title: string
  date: string
  submittedDate: string
  status: ApprovalStatus
  priority: "normal" | "urgent" | "overdue"
  description: string
  details: Record<string, any>
  slaHours?: number
}

const approvalItems: ApprovalItem[] = [
  {
    id: "1",
    employeeName: "Ahmad Rizki Pratama",
    employeeNik: "198501152010011001",
    employeeInitials: "AR",
    unit: "IT & Sistem",
    jabatan: "Kepala Bagian IT",
    type: "cuti",
    title: "Pengajuan Cuti Tahunan",
    date: "18-22 Mar 2026",
    submittedDate: "15 Mar 2026",
    status: "pending",
    priority: "urgent",
    slaHours: 4,
    description: "Cuti untuk keperluan keluarga - menemani anak masuk sekolah",
    details: {
      "Jenis Cuti": "Cuti Tahunan",
      "Tanggal Mulai": "18 Maret 2026",
      "Tanggal Selesai": "22 Maret 2026",
      "Durasi": "5 hari kerja",
      "Sisa Cuti": "7 hari",
      "Alamat Selama Cuti": "Jl. Merdeka No. 123, Jakarta",
      "No. HP Darurat": "081234567890",
    },
  },
  {
    id: "2",
    employeeName: "Siti Nurhaliza",
    employeeNik: "199003222015012002",
    employeeInitials: "SN",
    unit: "Keuangan",
    jabatan: "Staff Keuangan Senior",
    type: "lembur",
    title: "Pengajuan Lembur",
    date: "15 Mar 2026",
    submittedDate: "14 Mar 2026",
    status: "pending",
    priority: "normal",
    slaHours: 12,
    description: "Lembur closing laporan keuangan bulanan periode Februari 2026",
    details: {
      "Tanggal Lembur": "15 Maret 2026",
      "Jam Mulai": "17:00",
      "Jam Selesai": "21:00",
      "Durasi": "4 jam",
      "Alasan": "Closing laporan keuangan bulanan",
      "Persetujuan Atasan": "Sudah",
    },
  },
  {
    id: "3",
    employeeName: "Budi Santoso",
    employeeNik: "198712052008011003",
    employeeInitials: "BS",
    unit: "Distribusi",
    jabatan: "Supervisor Distribusi",
    type: "mutasi",
    title: "Usulan Mutasi",
    date: "Efektif 1 Apr 2026",
    submittedDate: "10 Mar 2026",
    status: "pending",
    priority: "normal",
    slaHours: 48,
    description: "Mutasi ke Cabang Utara sebagai Kepala Unit Distribusi",
    details: {
      "Unit Asal": "Distribusi - Kantor Pusat",
      "Unit Tujuan": "Distribusi - Cabang Utara",
      "Jabatan Baru": "Kepala Unit Distribusi",
      "TMT": "1 April 2026",
      "Alasan Mutasi": "Pengembangan karier dan kebutuhan organisasi",
      "Status Keluarga": "Bersedia pindah bersama keluarga",
    },
  },
  {
    id: "4",
    employeeName: "Dewi Lestari",
    employeeNik: "199205152018012004",
    employeeInitials: "DL",
    unit: "Pelayanan",
    jabatan: "Customer Service",
    type: "pangkat",
    title: "Kenaikan Pangkat",
    date: "Periode Q1 2026",
    submittedDate: "01 Mar 2026",
    status: "pending",
    priority: "overdue",
    slaHours: 0,
    description: "Usulan kenaikan pangkat dari A/III ke B/III",
    details: {
      "Pangkat Lama": "Penata Muda (A/III)",
      "Pangkat Baru": "Penata Muda Tk.I (B/III)",
      "Masa Kerja Pangkat": "4 tahun",
      "Nilai SKP": "Sangat Baik (91)",
      "Pendidikan": "S1 Komunikasi",
      "Kursus/Diklat": "Pelayanan Prima, Customer Care",
    },
  },
  {
    id: "5",
    employeeName: "Eko Prasetyo",
    employeeNik: "198008152005011005",
    employeeInitials: "EP",
    unit: "Produksi",
    jabatan: "Operator IPA",
    type: "gaji",
    title: "Kenaikan Gaji Berkala",
    date: "TMT 1 Apr 2026",
    submittedDate: "05 Mar 2026",
    status: "pending",
    priority: "normal",
    slaHours: 24,
    description: "KGB masa kerja 2 tahun sesuai ketentuan",
    details: {
      "Gaji Pokok Lama": "Rp 4.250.000",
      "Gaji Pokok Baru": "Rp 4.425.000",
      "Kenaikan": "Rp 175.000 (4.1%)",
      "TMT": "1 April 2026",
      "Masa Kerja": "21 tahun",
      "Golongan": "II/d",
    },
  },
  {
    id: "6",
    employeeName: "Fitri Handayani",
    employeeNik: "199308202020012006",
    employeeInitials: "FH",
    unit: "SDM & Umum",
    jabatan: "Staff SDM",
    type: "dokumen",
    title: "Approval SK Mutasi",
    date: "17 Mar 2026",
    submittedDate: "16 Mar 2026",
    status: "pending",
    priority: "normal",
    slaHours: 8,
    description: "SK Mutasi Budi Santoso memerlukan tanda tangan Direktur",
    details: {
      "Nomor SK": "SK/2026/03/MUT-015",
      "Perihal": "Mutasi Pegawai",
      "Atas Nama": "Budi Santoso",
      "Pemohon TTE": "Ka. Bagian SDM",
      "Status": "Menunggu Tanda Tangan Direktur",
    },
  },
  {
    id: "7",
    employeeName: "Gunawan Wibowo",
    employeeNik: "197506101998011007",
    employeeInitials: "GW",
    unit: "Produksi",
    jabatan: "Manager Produksi",
    type: "cuti",
    title: "Izin Tidak Masuk",
    date: "19 Mar 2026",
    submittedDate: "17 Mar 2026",
    status: "pending",
    priority: "urgent",
    slaHours: 2,
    description: "Keperluan mendadak - mengantar keluarga ke rumah sakit",
    details: {
      "Jenis Izin": "Izin Tidak Masuk",
      "Tanggal": "19 Maret 2026",
      "Alasan": "Keperluan keluarga mendadak",
      "Pengganti": "Eko Prasetyo (Operator Senior)",
    },
  },
  {
    id: "8",
    employeeName: "Hendra Kusuma",
    employeeNik: "198904152012011008",
    employeeInitials: "HK",
    unit: "Distribusi",
    jabatan: "Teknisi Distribusi",
    type: "payroll",
    title: "Koreksi Payroll",
    date: "Periode Feb 2026",
    submittedDate: "12 Mar 2026",
    status: "pending",
    priority: "normal",
    slaHours: 16,
    description: "Koreksi tunjangan transport yang kurang pada periode Februari",
    details: {
      "Periode": "Februari 2026",
      "Jenis Koreksi": "Tunjangan Transport",
      "Nominal Seharusnya": "Rp 750.000",
      "Nominal Dibayar": "Rp 500.000",
      "Selisih": "Rp 250.000",
      "Alasan": "Tugas luar kota tidak terinput",
    },
  },
]

const approvedItems: ApprovalItem[] = [
  {
    id: "a1",
    employeeName: "Indah Permata",
    employeeNik: "199105152019012001",
    employeeInitials: "IP",
    unit: "Pelayanan",
    jabatan: "Staff Pelayanan",
    type: "cuti",
    title: "Cuti Melahirkan",
    date: "1 Mar - 30 May 2026",
    submittedDate: "20 Feb 2026",
    status: "approved",
    priority: "normal",
    description: "Cuti melahirkan selama 3 bulan",
    details: {},
  },
  {
    id: "a2",
    employeeName: "Joko Susilo",
    employeeNik: "198805152015011001",
    employeeInitials: "JS",
    unit: "IT & Sistem",
    jabatan: "System Analyst",
    type: "lembur",
    title: "Lembur Maintenance",
    date: "10 Mar 2026",
    submittedDate: "09 Mar 2026",
    status: "approved",
    priority: "normal",
    description: "Maintenance server malam",
    details: {},
  },
]

const rejectedItems: ApprovalItem[] = [
  {
    id: "r1",
    employeeName: "Kiki Amelia",
    employeeNik: "199505152021012001",
    employeeInitials: "KA",
    unit: "Keuangan",
    jabatan: "Staff Akuntansi",
    type: "cuti",
    title: "Cuti Tahunan",
    date: "5-10 Mar 2026",
    submittedDate: "01 Mar 2026",
    status: "rejected",
    priority: "normal",
    description: "Cuti ditolak karena periode closing",
    details: {},
  },
]

const typeConfig: Record<ApprovalType, { label: string; icon: React.ElementType; color: string }> = {
  cuti: { label: "Cuti/Izin", icon: Plane, color: "bg-blue-100 text-blue-700" },
  lembur: { label: "Lembur", icon: Clock, color: "bg-amber-100 text-amber-700" },
  mutasi: { label: "Mutasi", icon: ArrowRightLeft, color: "bg-purple-100 text-purple-700" },
  payroll: { label: "Payroll", icon: Wallet, color: "bg-emerald-100 text-emerald-700" },
  dokumen: { label: "Dokumen", icon: FileText, color: "bg-gray-100 text-gray-700" },
  pangkat: { label: "Pangkat", icon: Star, color: "bg-orange-100 text-orange-700" },
  gaji: { label: "Gaji", icon: TrendingUp, color: "bg-teal-100 text-teal-700" },
}

const priorityConfig = {
  normal: { label: "Normal", className: "bg-secondary text-secondary-foreground" },
  urgent: { label: "Urgent", className: "bg-orange-100 text-orange-700 border-orange-200" },
  overdue: { label: "Overdue", className: "bg-red-100 text-red-700 border-red-200" },
}

export default function ApprovalCenterPage() {
  const { data: session } = useSession()
  const user = session?.user
  const [items, setItems] = useState<ApprovalItem[]>(approvalItems as ApprovalItem[])
  const [selectedTab, setSelectedTab] = useState("pending")
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [approveNote, setApproveNote] = useState("")

  const filteredItems = items.filter((item) => {
    if (selectedTab === "pending" && item.status !== "pending") return false
    if (selectedTab === "approved" && item.status !== "approved") return false
    if (selectedTab === "rejected" && item.status !== "rejected") return false
    
    const matchesSearch =
      (item.employeeName || item.pengajuName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || item.type === typeFilter
    return matchesSearch && matchesType
  })

  const handleApprove = async () => {
    if (!selectedItem || !user) return
    // Simple mock update for compatibility with existing data
    setItems(prev => prev.map(i => i.id === selectedItem.id ? { ...i, status: "approved" as const } : i))
    setShowApproveDialog(false); setApproveNote(""); setSelectedItem(null)
    toast.success(`Pengajuan ${selectedItem.employeeName || selectedItem.pengajuName} disetujui`)
  }

  const handleReject = async () => {
    if (!selectedItem || !user) return
    setItems(prev => prev.map(i => i.id === selectedItem.id ? { ...i, status: "rejected" as const } : i))
    setShowRejectDialog(false); setRejectReason(""); setSelectedItem(null)
    toast.error(`Pengajuan ditolak`)
  }

  const openApproveDialog = (item: ApprovalItem) => {
    setSelectedItem(item)
    setShowApproveDialog(true)
  }

  const openRejectDialog = (item: ApprovalItem) => {
    setSelectedItem(item)
    setShowRejectDialog(true)
  }

  const openDetailDialog = (item: ApprovalItem) => {
    setSelectedItem(item)
    setShowDetailDialog(true)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Dashboard", "Approval Center"]} />
        <main className="flex-1 overflow-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Approval Center</h1>
            <p className="text-sm text-muted-foreground">
              Kelola seluruh pengajuan yang memerlukan persetujuan Anda
            </p>
          </div>

          {/* Stats */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="card-premium">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                  <Clock className="h-6 w-6 text-amber-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{approvalItems.length}</p>
                  <p className="text-xs text-muted-foreground">Menunggu Approval</p>
                </div>
              </CardContent>
            </Card>
            <Card className="card-premium">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                  <AlertCircle className="h-6 w-6 text-orange-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {approvalItems.filter((i) => i.priority === "urgent").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Urgent</p>
                </div>
              </CardContent>
            </Card>
            <Card className="card-premium">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                  <CheckCircle2 className="h-6 w-6 text-emerald-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{approvedItems.length}</p>
                  <p className="text-xs text-muted-foreground">Disetujui Hari Ini</p>
                </div>
              </CardContent>
            </Card>
            <Card className="card-premium">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
                  <XCircle className="h-6 w-6 text-red-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {approvalItems.filter((i) => i.priority === "overdue").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Melewati SLA</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <TabsList>
                <TabsTrigger value="pending" className="gap-2">
                  <Clock className="h-4 w-4" />
                  Pending
                  <Badge variant="secondary" className="ml-1">
                    {approvalItems.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="approved" className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Disetujui
                </TabsTrigger>
                <TabsTrigger value="rejected" className="gap-2">
                  <XCircle className="h-4 w-4" />
                  Ditolak
                </TabsTrigger>
              </TabsList>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari pengajuan..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    className="w-[250px] pl-10"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    <SelectItem value="cuti">Cuti/Izin</SelectItem>
                    <SelectItem value="lembur">Lembur</SelectItem>
                    <SelectItem value="mutasi">Mutasi</SelectItem>
                    <SelectItem value="payroll">Payroll</SelectItem>
                    <SelectItem value="dokumen">Dokumen</SelectItem>
                    <SelectItem value="pangkat">Pangkat</SelectItem>
                    <SelectItem value="gaji">Gaji</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <TabsContent value="pending" className="mt-0">
              <Card className="card-premium">
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-380px)]">
                    <div className="divide-y divide-border">
                      {filteredItems.map((item) => {
                        const TypeIcon = typeConfig[item.type].icon
                        return (
                          <div
                            key={item.id}
                            className="flex items-start gap-4 p-4 transition-colors hover:bg-muted/30"
                          >
                            <Avatar className="h-12 w-12 shrink-0">
                              <AvatarImage src={item.employeeAvatar} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {item.employeeInitials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-foreground">
                                      {item.employeeName}
                                    </h4>
                                    <Badge
                                      variant="outline"
                                      className={priorityConfig[item.priority as keyof typeof priorityConfig].className}
                                    >
                                      {priorityConfig[item.priority as keyof typeof priorityConfig].label}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {item.jabatan} - {item.unit}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground">
                                    Diajukan: {item.submittedDate}
                                  </p>
                                  {item.slaHours !== undefined && item.slaHours > 0 && (
                                    <p
                                      className={cn(
                                        "text-xs",
                                        item.slaHours <= 4
                                          ? "text-orange-600"
                                          : "text-muted-foreground"
                                      )}
                                    >
                                      SLA: {item.slaHours} jam
                                    </p>
                                  )}
                                  {item.slaHours === 0 && (
                                    <p className="flex items-center justify-end gap-1 text-xs text-red-600">
                                      <AlertCircle className="h-3 w-3" />
                                      Melewati SLA
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="mt-2 flex items-center gap-2">
                                <Badge className={cn("gap-1", typeConfig[item.type].color)}>
                                  <TypeIcon className="h-3 w-3" />
                                  {typeConfig[item.type].label}
                                </Badge>
                                <span className="font-medium text-foreground">{item.title}</span>
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {item.date}
                              </div>
                              <div className="mt-3 flex items-center gap-2">
                                {user?.role !== "PEGAWAI" && item.status === "pending" && (
                                  <>
                                    <Button
                                      size="sm"
                                      className="h-8 gap-1"
                                      onClick={() => openApproveDialog(item)}
                                    >
                                      <Check className="h-3 w-3" />
                                      Setujui
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 gap-1"
                                      onClick={() => openRejectDialog(item)}
                                    >
                                      <X className="h-3 w-3" />
                                      Tolak
                                    </Button>
                                  </>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 gap-1"
                                  onClick={() => openDetailDialog(item)}
                                >
                                  <Eye className="h-3 w-3" />
                                  Detail
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="approved" className="mt-0">
              <Card className="card-premium">
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-380px)]">
                    <div className="divide-y divide-border">
                      {filteredItems.map((item) => {
                        const TypeIcon = typeConfig[item.type].icon
                        return (
                          <div
                            key={item.id}
                            className="flex items-start gap-4 p-4 transition-colors hover:bg-muted/30"
                          >
                            <Avatar className="h-12 w-12 shrink-0">
                              <AvatarImage src={item.employeeAvatar} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {item.employeeInitials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-foreground">{item.employeeName}</h4>
                                <Badge className="gap-1 bg-emerald-100 text-emerald-700">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Disetujui
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {item.jabatan} - {item.unit}
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <Badge className={cn("gap-1", typeConfig[item.type].color)}>
                                  <TypeIcon className="h-3 w-3" />
                                  {typeConfig[item.type].label}
                                </Badge>
                                <span className="font-medium text-foreground">{item.title}</span>
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rejected" className="mt-0">
              <Card className="card-premium">
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-380px)]">
                    <div className="divide-y divide-border">
                      {filteredItems.map((item) => {
                        const TypeIcon = typeConfig[item.type].icon
                        return (
                          <div
                            key={item.id}
                            className="flex items-start gap-4 p-4 transition-colors hover:bg-muted/30"
                          >
                            <Avatar className="h-12 w-12 shrink-0">
                              <AvatarImage src={item.employeeAvatar} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {item.employeeInitials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-foreground">{item.employeeName}</h4>
                                <Badge className="gap-1 bg-red-100 text-red-700">
                                  <XCircle className="h-3 w-3" />
                                  Ditolak
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {item.jabatan} - {item.unit}
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <Badge className={cn("gap-1", typeConfig[item.type].color)}>
                                  <TypeIcon className="h-3 w-3" />
                                  {typeConfig[item.type].label}
                                </Badge>
                                <span className="font-medium text-foreground">{item.title}</span>
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Pengajuan</DialogTitle>
            <DialogDescription>
              Informasi lengkap pengajuan {selectedItem?.title}
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-lg text-primary">
                    {selectedItem.employeeInitials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedItem.employeeName}</h3>
                  <p className="text-sm text-muted-foreground">NIK: {selectedItem.employeeNik}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedItem.jabatan} - {selectedItem.unit}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-border p-4">
                <h4 className="mb-3 font-semibold">Detail Pengajuan</h4>
                <div className="grid gap-2">
                  {Object.entries(selectedItem.details as Record<string, string>).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{key}</span>
                      <span className="font-medium text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Tutup
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowDetailDialog(false)
                if (selectedItem) openRejectDialog(selectedItem)
              }}
            >
              <X className="mr-2 h-4 w-4" />
              Tolak
            </Button>
            <Button
              onClick={() => {
                setShowDetailDialog(false)
                if (selectedItem) openApproveDialog(selectedItem)
              }}
            >
              <Check className="mr-2 h-4 w-4" />
              Setujui
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Setujui Pengajuan</DialogTitle>
            <DialogDescription>
              Anda akan menyetujui pengajuan {selectedItem?.title} dari {selectedItem?.employeeName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Catatan (Opsional)</label>
              <Textarea
                placeholder="Tambahkan catatan jika diperlukan..."
                value={approveNote}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setApproveNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleApprove}>
              <Check className="mr-2 h-4 w-4" />
              Setujui
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Pengajuan</DialogTitle>
            <DialogDescription>
              Anda akan menolak pengajuan {selectedItem?.title} dari {selectedItem?.employeeName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Alasan Penolakan <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Masukkan alasan penolakan..."
                value={rejectReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectReason(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason}>
              <X className="mr-2 h-4 w-4" />
              Tolak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
