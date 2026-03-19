"use client"
// app/mutasi/page.tsx

import { useState, useEffect } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search, Plus, ArrowRightLeft, CheckCircle2,
  XCircle, Clock, Eye, ChevronLeft, ChevronRight,
  Loader2, Users, Building2, TrendingUp, FileText,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { getEmployees, getBidang } from "@/lib/actions/pegawai"
import { getJabatanOptions } from "@/lib/data/bidang-store"

// ============ TIPE DATA ============
type MutasiStatus = "pending" | "approved" | "rejected"
type MutasiType = "mutasi" | "promosi" | "demosi" | "rotasi"

interface MutasiRecord {
  id: string
  nik: string
  namaPegawai: string
  inisial: string
  unitAsal: string
  jabatanAsal: string
  unitTujuan: string
  jabatanTujuan: string
  type: MutasiType
  alasan: string
  tanggalPengajuan: string
  tanggalEfektif: string
  status: MutasiStatus
  approvedBy?: string
  approvedAt?: string
  catatanApproval?: string
  nomorSK?: string
}

// ============ DATA DUMMY ============
const initialData: MutasiRecord[] = [
  {
    id: "1",
    nik: "3201150115850001",
    namaPegawai: "Ahmad Rizki Pratama",
    inisial: "AR",
    unitAsal: "IT & Sistem",
    jabatanAsal: "Staff IT Senior",
    unitTujuan: "IT & Sistem",
    jabatanTujuan: "Kepala Bagian IT",
    type: "promosi",
    alasan: "Kinerja sangat baik selama 3 tahun berturut-turut, memenuhi syarat jabatan",
    tanggalPengajuan: "01 Mar 2026",
    tanggalEfektif: "01 Apr 2026",
    status: "approved",
    approvedBy: "Direktur Utama",
    approvedAt: "05 Mar 2026",
    nomorSK: "SK/MUT/2026/001",
  },
  {
    id: "2",
    nik: "3201032215900002",
    namaPegawai: "Siti Nurhaliza",
    inisial: "SN",
    unitAsal: "Keuangan",
    jabatanAsal: "Staff Keuangan",
    unitTujuan: "SDM & Umum",
    jabatanTujuan: "Staff Administrasi",
    type: "rotasi",
    alasan: "Penyesuaian kebutuhan organisasi dan pengembangan kompetensi pegawai",
    tanggalPengajuan: "10 Mar 2026",
    tanggalEfektif: "15 Apr 2026",
    status: "pending",
  },
  {
    id: "3",
    nik: "3201050512870003",
    namaPegawai: "Budi Santoso",
    inisial: "BS",
    unitAsal: "Distribusi",
    jabatanAsal: "Supervisor Distribusi",
    unitTujuan: "Distribusi",
    jabatanTujuan: "Kepala Seksi Distribusi",
    type: "promosi",
    alasan: "Masa kerja dan kompetensi telah memenuhi syarat kenaikan jabatan",
    tanggalPengajuan: "05 Mar 2026",
    tanggalEfektif: "01 Mei 2026",
    status: "pending",
  },
  {
    id: "4",
    nik: "3201202019930006",
    namaPegawai: "Fitri Handayani",
    inisial: "FH",
    unitAsal: "Pelayanan",
    jabatanAsal: "Staff Pelayanan",
    unitTujuan: "SDM & Umum",
    jabatanTujuan: "Staff HRD",
    type: "mutasi",
    alasan: "Kebutuhan tenaga di bagian SDM, pegawai memiliki latar belakang psikologi",
    tanggalPengajuan: "08 Mar 2026",
    tanggalEfektif: "01 Apr 2026",
    status: "rejected",
    approvedBy: "HRD",
    approvedAt: "10 Mar 2026",
    catatanApproval: "Ditolak karena posisi SDM sudah terpenuhi",
  },
  {
    id: "5",
    nik: "3201100619750007",
    namaPegawai: "Ir. Gunawan Wibowo",
    inisial: "GW",
    unitAsal: "Produksi",
    jabatanAsal: "Kepala Seksi Produksi",
    unitTujuan: "Produksi",
    jabatanTujuan: "Manager Produksi",
    type: "promosi",
    alasan: "Senioritas, kinerja dan kompetensi memenuhi syarat jabatan manajerial",
    tanggalPengajuan: "01 Feb 2026",
    tanggalEfektif: "01 Mar 2026",
    status: "approved",
    approvedBy: "Direktur Utama",
    approvedAt: "10 Feb 2026",
    nomorSK: "SK/MUT/2026/002",
  },
]

// ============ CONFIG ============
const statusConfig: Record<MutasiStatus, { label: string; className: string; icon: any }> = {
  pending:  { label: "Menunggu",  className: "bg-amber-100 text-amber-700 border-amber-200",   icon: Clock },
  approved: { label: "Disetujui", className: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  rejected: { label: "Ditolak",   className: "bg-red-100 text-red-700 border-red-200",         icon: XCircle },
}

const typeConfig: Record<MutasiType, { label: string; className: string }> = {
  mutasi:  { label: "Mutasi",   className: "bg-blue-100 text-blue-700" },
  promosi: { label: "Promosi",  className: "bg-emerald-100 text-emerald-700" },
  demosi:  { label: "Demosi",   className: "bg-red-100 text-red-700" },
  rotasi:  { label: "Rotasi",   className: "bg-purple-100 text-purple-700" },
}

const unitOptions = ["IT & Sistem","Keuangan","Distribusi","Pelayanan","Produksi","SDM & Umum","Direksi"]

const ITEMS_PER_PAGE = 8

// ============ KOMPONEN UTAMA ============
export default function MutasiPage() {
  const [data, setData] = useState<MutasiRecord[]>(initialData)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState("semua")

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MutasiRecord | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [rejectNote, setRejectNote] = useState("")
  const [approveNote, setApproveNote] = useState("")

  // Employee list for dropdown
  const [employeeList, setEmployeeList] = useState<any[]>([])
  const [bidangList, setBidangList] = useState<any[]>([])
  const [empSearch, setEmpSearch] = useState("")

  useEffect(() => {
    const loadEmpAndBidang = async () => {
      try {
        const [emps, bids] = await Promise.all([getEmployees(), getBidang()])
        setEmployeeList(emps || [])
        setBidangList(bids || [])
      } catch {}
    }
    loadEmpAndBidang()
  }, [])

  // Form state
  const [form, setForm] = useState({
    pegawaiId: "", nik: "", namaPegawai: "", inisial: "",
    unitAsal: "", jabatanAsal: "",
    unitTujuan: "", jabatanTujuan: "",
    type: "mutasi" as MutasiType,
    alasan: "", tanggalEfektif: "",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // When employee is selected, auto-fill posisi asal
  const handleSelectEmployee = (empId: string) => {
    const emp = employeeList.find(e => e.id === empId)
    if (!emp) return
    const bidangNama = emp.bidang?.nama || "-"
    setForm(p => ({
      ...p,
      pegawaiId: emp.id,
      nik: emp.nik,
      namaPegawai: emp.nama,
      inisial: emp.nama.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase(),
      unitAsal: bidangNama,
      jabatanAsal: emp.jabatan || "-",
    }))
  }

  // ---- Filter ----
  const filtered = data.filter(item => {
    const byTab = activeTab === "semua" || item.status === activeTab
    const bySearch = item.namaPegawai.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nik.includes(searchQuery)
    const byStatus = statusFilter === "all" || item.status === statusFilter
    const byType = typeFilter === "all" || item.type === typeFilter
    return byTab && bySearch && byStatus && byType
  })

  useEffect(() => setCurrentPage(1), [searchQuery, statusFilter, typeFilter, activeTab])
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const stats = {
    total: data.length,
    pending: data.filter(d => d.status === "pending").length,
    approved: data.filter(d => d.status === "approved").length,
    rejected: data.filter(d => d.status === "rejected").length,
  }

  // ---- Validasi ----
  const validate = () => {
    const errors: Record<string, string> = {}
    if (!form.namaPegawai.trim()) errors.nama = "Nama pegawai wajib diisi"
    if (!form.nik || form.nik.length !== 16) errors.nik = "NIK harus 16 digit"
    if (!form.unitAsal) errors.unitAsal = "Unit asal wajib dipilih"
    if (!form.jabatanAsal.trim()) errors.jabatanAsal = "Jabatan asal wajib diisi"
    if (!form.unitTujuan) errors.unitTujuan = "Unit tujuan wajib dipilih"
    if (!form.jabatanTujuan.trim()) errors.jabatanTujuan = "Jabatan tujuan wajib diisi"
    if (!form.alasan || form.alasan.length < 10) errors.alasan = "Alasan minimal 10 karakter"
    if (!form.tanggalEfektif) errors.tanggalEfektif = "Tanggal efektif wajib diisi"
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // ---- Submit ----
  const handleSubmit = async () => {
    if (!validate()) return
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 700))
    const newItem: MutasiRecord = {
      id: String(Date.now()),
      nik: form.nik,
      namaPegawai: form.namaPegawai,
      inisial: form.namaPegawai.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
      unitAsal: form.unitAsal,
      jabatanAsal: form.jabatanAsal,
      unitTujuan: form.unitTujuan,
      jabatanTujuan: form.jabatanTujuan,
      type: form.type,
      alasan: form.alasan,
      tanggalPengajuan: format(new Date(), "dd MMM yyyy", { locale: id }),
      tanggalEfektif: form.tanggalEfektif,
      status: "pending",
    }
    setData(prev => [newItem, ...prev])
    setShowAddDialog(false)
    setForm({ pegawaiId: "", nik: "", namaPegawai: "", inisial: "", unitAsal: "", jabatanAsal: "", unitTujuan: "", jabatanTujuan: "", type: "mutasi", alasan: "", tanggalEfektif: "" })
    setEmpSearch("")
    setIsLoading(false)
    toast.success("Pengajuan mutasi berhasil dikirim")
  }

  // ---- Approve ----
  const handleApprove = async () => {
    if (!selectedItem) return
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 600))
    setData(prev => prev.map(d => d.id === selectedItem.id ? {
      ...d, status: "approved" as MutasiStatus,
      approvedBy: "Manager SDM",
      approvedAt: format(new Date(), "dd MMM yyyy", { locale: id }),
      catatanApproval: approveNote || undefined,
      nomorSK: `SK/MUT/2026/${String(data.length + 1).padStart(3, "0")}`,
    } : d))
    setShowApproveDialog(false)
    setApproveNote("")
    setSelectedItem(null)
    setIsLoading(false)
    toast.success(`Mutasi ${selectedItem.namaPegawai} disetujui`)
  }

  // ---- Reject ----
  const handleReject = async () => {
    if (!selectedItem || !rejectNote.trim()) {
      toast.error("Alasan penolakan wajib diisi")
      return
    }
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 600))
    setData(prev => prev.map(d => d.id === selectedItem.id ? {
      ...d, status: "rejected" as MutasiStatus,
      approvedBy: "Manager SDM",
      approvedAt: format(new Date(), "dd MMM yyyy", { locale: id }),
      catatanApproval: rejectNote,
    } : d))
    setShowRejectDialog(false)
    setRejectNote("")
    setSelectedItem(null)
    setIsLoading(false)
    toast.error(`Mutasi ${selectedItem.namaPegawai} ditolak`)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col pl-64">
        <TopBar breadcrumb={["Kinerja & Karier", "Mutasi & Promosi"]} />
        <main className="flex-1 overflow-auto p-6">

          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Mutasi & Promosi</h1>
              <p className="text-sm text-muted-foreground">Kelola pengajuan mutasi, promosi, dan rotasi pegawai</p>
            </div>
            <Button size="sm" className="gap-2" onClick={() => { setForm({ pegawaiId: "", nik: "", namaPegawai: "", inisial: "", unitAsal: "", jabatanAsal: "", unitTujuan: "", jabatanTujuan: "", type: "mutasi", alasan: "", tanggalEfektif: "" }); setEmpSearch(""); setFormErrors({}); setShowAddDialog(true) }}>
              <Plus className="h-4 w-4" /> Ajukan Mutasi
            </Button>
          </div>

          {/* Stats */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total Pengajuan", value: stats.total,    icon: ArrowRightLeft, bg: "bg-primary/10",    color: "text-primary" },
              { label: "Menunggu",        value: stats.pending,  icon: Clock,          bg: "bg-amber-100",    color: "text-amber-600" },
              { label: "Disetujui",       value: stats.approved, icon: CheckCircle2,   bg: "bg-emerald-100",  color: "text-emerald-600" },
              { label: "Ditolak",         value: stats.rejected, icon: XCircle,        bg: "bg-red-100",      color: "text-red-600" },
            ].map(s => (
              <Card key={s.label} className="card-premium">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.bg}`}>
                    <s.icon className={`h-6 w-6 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="semua">Semua ({data.length})</TabsTrigger>
              <TabsTrigger value="pending">Menunggu ({stats.pending})</TabsTrigger>
              <TabsTrigger value="approved">Disetujui ({stats.approved})</TabsTrigger>
              <TabsTrigger value="rejected">Ditolak ({stats.rejected})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {/* Filter */}
              <Card className="card-premium mb-4">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="Cari nama atau NIK..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
                    </div>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-[150px]"><SelectValue placeholder="Jenis" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Jenis</SelectItem>
                        <SelectItem value="mutasi">Mutasi</SelectItem>
                        <SelectItem value="promosi">Promosi</SelectItem>
                        <SelectItem value="rotasi">Rotasi</SelectItem>
                        <SelectItem value="demosi">Demosi</SelectItem>
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
                          <TableHead className="w-[200px]">Pegawai</TableHead>
                          <TableHead>Dari</TableHead>
                          <TableHead>Ke</TableHead>
                          <TableHead>Jenis</TableHead>
                          <TableHead>Tgl Efektif</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-center">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginated.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="py-12 text-center">
                              <div className="flex flex-col items-center gap-2">
                                <ArrowRightLeft className="h-8 w-8 text-muted-foreground/50" />
                                <p className="text-muted-foreground">Tidak ada data ditemukan</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : paginated.map(item => {
                          const StatusIcon = statusConfig[item.status].icon
                          return (
                            <TableRow key={item.id} className="hover:bg-muted/30">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9">
                                    <AvatarFallback className="bg-primary/10 text-xs text-primary">{item.inisial}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-sm">{item.namaPegawai}</p>
                                    <p className="font-mono text-xs text-muted-foreground">{item.nik}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <p className="text-sm font-medium">{item.jabatanAsal}</p>
                                <p className="text-xs text-muted-foreground">{item.unitAsal}</p>
                              </TableCell>
                              <TableCell>
                                <p className="text-sm font-medium">{item.jabatanTujuan}</p>
                                <p className="text-xs text-muted-foreground">{item.unitTujuan}</p>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={typeConfig[item.type].className}>
                                  {typeConfig[item.type].label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">{item.tanggalEfektif}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={`gap-1 ${statusConfig[item.status].className}`}>
                                  <StatusIcon className="h-3 w-3" />
                                  {statusConfig[item.status].label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-center gap-1">
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedItem(item); setShowDetailDialog(true) }}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {item.status === "pending" && (
                                    <>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50"
                                        onClick={() => { setSelectedItem(item); setShowApproveDialog(true) }}>
                                        <CheckCircle2 className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50"
                                        onClick={() => { setSelectedItem(item); setShowRejectDialog(true) }}>
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between border-t border-border p-4">
                    <p className="text-sm text-muted-foreground">
                      {filtered.length === 0 ? "0" : `${(currentPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}`} dari {filtered.length} data
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                        <Button key={p} variant={currentPage === p ? "default" : "outline"} size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(p)}>{p}</Button>
                      ))}
                      <Button variant="outline" size="sm" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* ===== DIALOG TAMBAH ===== */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajukan Mutasi / Promosi</DialogTitle>
            <DialogDescription>Isi form pengajuan mutasi, promosi, atau rotasi pegawai</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Employee Searchable Select */}
            <div>
              <Label>Nama Pegawai *</Label>
              <div className="mt-1 relative">
                <Input
                  value={form.pegawaiId ? form.namaPegawai : empSearch}
                  onChange={e => {
                    setEmpSearch(e.target.value)
                    if (form.pegawaiId) setForm(p => ({...p, pegawaiId: "", nik: "", namaPegawai: "", inisial: "", unitAsal: "", jabatanAsal: ""}))
                  }}
                  placeholder="Ketik nama pegawai untuk mencari..."
                />
                {empSearch && !form.pegawaiId && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {employeeList
                      .filter(e => e.nama.toLowerCase().includes(empSearch.toLowerCase()) || e.nik.includes(empSearch))
                      .slice(0, 10)
                      .map(emp => (
                        <button
                          key={emp.id}
                          type="button"
                          className="w-full px-3 py-2 text-left hover:bg-muted flex items-center justify-between text-sm"
                          onClick={() => { handleSelectEmployee(emp.id); setEmpSearch("") }}
                        >
                          <div>
                            <p className="font-medium">{emp.nama}</p>
                            <p className="text-xs text-muted-foreground">{emp.jabatan || "-"} — {emp.bidang?.nama || "-"}</p>
                          </div>
                          <span className="font-mono text-xs text-muted-foreground">{emp.nik}</span>
                        </button>
                      ))}
                    {employeeList.filter(e => e.nama.toLowerCase().includes(empSearch.toLowerCase()) || e.nik.includes(empSearch)).length === 0 && (
                      <p className="px-3 py-2 text-sm text-muted-foreground">Tidak ditemukan</p>
                    )}
                  </div>
                )}
              </div>
              {form.pegawaiId && (
                <p className="mt-1 text-xs text-emerald-600">✓ NIK: {form.nik} — {form.unitAsal} / {form.jabatanAsal}</p>
              )}
              {formErrors.nama && <p className="mt-1 text-xs text-destructive">{formErrors.nama}</p>}
            </div>

            <div>
              <Label>Jenis Pengajuan *</Label>
              <Select value={form.type} onValueChange={v => setForm(p => ({...p, type: v as MutasiType}))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mutasi">Mutasi (Pindah Unit)</SelectItem>
                  <SelectItem value="promosi">Promosi (Naik Jabatan)</SelectItem>
                  <SelectItem value="rotasi">Rotasi (Tukar Posisi)</SelectItem>
                  <SelectItem value="demosi">Demosi (Turun Jabatan)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3 rounded-lg bg-muted/50 p-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Posisi Asal</p>
                <div>
                  <Label>Unit Kerja Asal</Label>
                  <Input className="mt-1 bg-muted" value={form.unitAsal} readOnly disabled />
                </div>
                <div>
                  <Label>Jabatan Asal</Label>
                  <Input className="mt-1 bg-muted" value={form.jabatanAsal} readOnly disabled />
                </div>
              </div>

              <div className="space-y-3 rounded-lg bg-primary/5 p-3">
                <p className="text-xs font-semibold text-primary uppercase">Posisi Tujuan</p>
                <div>
                  <Label>Unit Kerja Tujuan *</Label>
                  <Select value={form.unitTujuan || "NONE"} onValueChange={v => setForm(p => ({...p, unitTujuan: v === "NONE" ? "" : v}))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih unit" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">— Pilih —</SelectItem>
                      {bidangList.map(b => <SelectItem key={b.id} value={b.nama}>{b.nama}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {formErrors.unitTujuan && <p className="mt-1 text-xs text-destructive">{formErrors.unitTujuan}</p>}
                </div>
                <div>
                  <Label>Jabatan Tujuan *</Label>
                  <Select value={form.jabatanTujuan || "NONE"} onValueChange={v => setForm(p => ({...p, jabatanTujuan: v === "NONE" ? "" : v}))} disabled={!form.unitTujuan}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih jabatan" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">— Pilih Jabatan —</SelectItem>
                      {form.unitTujuan ? getJabatanOptions(bidangList.find(b => b.nama === form.unitTujuan)?.id || "", bidangList).map(j => (
                        <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>
                      )) : null}
                    </SelectContent>
                  </Select>
                  {formErrors.jabatanTujuan && <p className="mt-1 text-xs text-destructive">{formErrors.jabatanTujuan}</p>}
                </div>
              </div>
            </div>

            <div>
              <Label>Tanggal Efektif *</Label>
              <Input className="mt-1" type="date" value={form.tanggalEfektif} onChange={e => setForm(p => ({...p, tanggalEfektif: e.target.value}))} />
              {formErrors.tanggalEfektif && <p className="mt-1 text-xs text-destructive">{formErrors.tanggalEfektif}</p>}
            </div>

            <div>
              <Label>Alasan / Dasar Pengajuan *</Label>
              <Textarea className="mt-1" rows={3} value={form.alasan} onChange={e => setForm(p => ({...p, alasan: e.target.value}))} placeholder="Jelaskan alasan pengajuan mutasi/promosi..." />
              {formErrors.alasan && <p className="mt-1 text-xs text-destructive">{formErrors.alasan}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Batal</Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Mengirim...</> : "Kirim Pengajuan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DIALOG DETAIL ===== */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Mutasi — {selectedItem?.namaPegawai}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">NIK</p><p className="font-mono font-medium">{selectedItem.nik}</p></div>
                <div><p className="text-xs text-muted-foreground">Jenis</p><Badge variant="outline" className={typeConfig[selectedItem.type].className}>{typeConfig[selectedItem.type].label}</Badge></div>
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/50 p-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">DARI</p>
                  <p className="font-medium">{selectedItem.jabatanAsal}</p>
                  <p className="text-xs text-muted-foreground">{selectedItem.unitAsal}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-primary mb-1">KE</p>
                  <p className="font-medium">{selectedItem.jabatanTujuan}</p>
                  <p className="text-xs text-muted-foreground">{selectedItem.unitTujuan}</p>
                </div>
              </div>
              <div><p className="text-xs text-muted-foreground">Tanggal Efektif</p><p className="font-medium">{selectedItem.tanggalEfektif}</p></div>
              <div><p className="text-xs text-muted-foreground">Alasan</p><p>{selectedItem.alasan}</p></div>
              {selectedItem.nomorSK && <div><p className="text-xs text-muted-foreground">Nomor SK</p><p className="font-mono font-medium">{selectedItem.nomorSK}</p></div>}
              {selectedItem.catatanApproval && (
                <div className={`rounded-lg p-3 ${selectedItem.status === "rejected" ? "bg-red-50" : "bg-emerald-50"}`}>
                  <p className="text-xs font-medium mb-1">{selectedItem.status === "rejected" ? "Alasan Penolakan" : "Catatan Approval"}</p>
                  <p className="text-sm">{selectedItem.catatanApproval}</p>
                  <p className="text-xs text-muted-foreground mt-1">oleh {selectedItem.approvedBy} — {selectedItem.approvedAt}</p>
                </div>
              )}
              <div><p className="text-xs text-muted-foreground">Status</p>
                <Badge variant="outline" className={statusConfig[selectedItem.status].className}>{statusConfig[selectedItem.status].label}</Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DIALOG APPROVE ===== */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Setujui Pengajuan</AlertDialogTitle>
            <AlertDialogDescription>
              Setujui mutasi <strong>{selectedItem?.namaPegawai}</strong> dari <strong>{selectedItem?.jabatanAsal}</strong> ke <strong>{selectedItem?.jabatanTujuan}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea placeholder="Catatan approval (opsional)..." value={approveNote} onChange={e => setApproveNote(e.target.value)} rows={2} className="mt-2" />
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} className="bg-emerald-600 hover:bg-emerald-700">
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyetujui...</> : "Ya, Setujui"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== DIALOG REJECT ===== */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tolak Pengajuan</AlertDialogTitle>
            <AlertDialogDescription>
              Tolak mutasi <strong>{selectedItem?.namaPegawai}</strong>. Isi alasan penolakan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea placeholder="Alasan penolakan (wajib)..." value={rejectNote} onChange={e => setRejectNote(e.target.value)} rows={3} className="mt-2" />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectNote("")}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menolak...</> : "Ya, Tolak"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
