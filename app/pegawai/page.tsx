"use client"

import React, { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import Link from "next/link"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Search, Download, UserPlus, MoreHorizontal,
  Eye, Edit, Trash2, Users, UserCheck, UserX,
  Clock, Mail, Phone, ChevronLeft, ChevronRight,
  Loader2, AlertTriangle, Camera, ArrowUpDown,
  Filter, X, Briefcase, Building2, ShieldCheck,
  CreditCard, GraduationCap, MapPin, Sparkles
} from "lucide-react"
import { 
  getEmployees, 
  getEmployeeStats, 
  createEmployee, 
  updateEmployee, 
  deleteEmployee,
  getBidang,
  getPegawaiPageData
} from "@/lib/actions/pegawai"
import { 
  bidangList as fallbackBidang, 
  getJabatanOptions, 
  getAtasanOtomatis, 
  getJabatanLabel, 
  getSubBidangOptions, 
  golonganOptions, 
  tipeKepegawaianOptions, 
  type TipeJabatan 
} from "@/lib/data/bidang-store"

// ============ TIPE DATA ============
interface Employee {
  id: string
  nik: string
  nama: string
  email: string
  telepon: string | null
  fotoUrl: string | null
  bidangId: string | null
  bidang?: { nama: string }
  jabatan: string
  tipeJabatan: string
  atasanLangsung: string | null
  golongan: string
  pangkat: string
  status: string
  sp: string | null
  tanggalMasuk: string
  jenisKelamin: string | null
  tempatLahir: string | null
  tanggalLahir: string | null
  agama: string | null
  statusNikah: string | null
  alamat: string | null
  npwp: string | null
  pendidikanTerakhir: string | null
  jurusan: string | null
  institusi: string | null
  tahunLulus: string | null
  bank: string | null
  noRekening: string | null
  bpjsKesehatan: string | null
  bpjsKetenagakerjaan: string | null
  masaKerja?: string
  initials?: string
}

type EmployeeForm = Omit<Employee, "id" | "bidang" | "masaKerja" | "initials"> & {
  id?: string
  password?: string
  role?: string
  subBidangId?: string
  tipeKepegawaian?: string
}

const statusConfig: Record<string, { label: string; dot: string; badgeClass: string }> = {
  aktif: { 
    label: "Aktif", 
    dot: "bg-emerald-500", 
    badgeClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" 
  },
  cuti: { 
    label: "Cuti", 
    dot: "bg-amber-500", 
    badgeClass: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400" 
  },
  "non-aktif": { 
    label: "Non-Aktif", 
    dot: "bg-slate-400", 
    badgeClass: "border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300" 
  },
  pensiun: { 
    label: "Pensiun", 
    dot: "bg-rose-500", 
    badgeClass: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400" 
  },
}

const spConfig: Record<string, { label: string; className: string }> = {
  SP1: { label: "SP-1", className: "border-slate-300 text-slate-600 dark:text-zinc-300 dark:border-zinc-700" },
  SP2: { label: "SP-2", className: "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10" },
  SP3: { label: "SP-3", className: "border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10" },
}

const ITEMS_PER_PAGE = 10

// Form field helper — kept outside to avoid input remounting/focus loss
const F = ({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) => (
  <div className="min-w-0 space-y-1.5">
    <Label className="text-xs font-medium text-slate-600 dark:text-zinc-300">
      {label} {required && <span className="text-rose-500">*</span>}
    </Label>
    <div className="min-w-0">{children}</div>
    {error && <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">{error}</p>}
  </div>
)

export default function EmployeeListPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [unitFilter, setUnitFilter] = useState("all")
  const [golonganFilter, setGolonganFilter] = useState("all")
  const [sortBy, setSortBy] = useState("nama-asc")
  const [currentPage, setCurrentPage] = useState(1)

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [formTab, setFormTab] = useState<"identitas" | "kepegawaian" | "biodata" | "finansial">("identitas")

  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [bidangData, setBidangData] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)

  const emptyForm: EmployeeForm = {
    nik: "", nama: "", email: "", telepon: "",
    bidangId: "", tipeJabatan: "" as TipeJabatan | "",
    jabatan: "", atasanLangsung: "",
    golongan: "", pangkat: "",
    status: "AKTIF", sp: null,
    fotoUrl: null,
    tanggalMasuk: new Date().toISOString().split("T")[0],
    jenisKelamin: "", tempatLahir: "", tanggalLahir: "",
    agama: "", statusNikah: "",
    pendidikanTerakhir: "", jurusan: "", institusi: "", tahunLulus: "",
    bank: "", noRekening: "", bpjsKesehatan: "", bpjsKetenagakerjaan: "",
    alamat: "", npwp: "",
    role: "PEGAWAI", password: "123456",
    subBidangId: "",
    tipeKepegawaian: "tetap",
  }
  const [form, setForm] = useState<EmployeeForm>(emptyForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const data = await getPegawaiPageData()
      setEmployees((data.emps as any[]) || [])
      setStats(data.stats)
      setBidangData(data.bid?.length ? data.bid : fallbackBidang)
    } catch (error) {
      toast.error("Gagal mengambil data dari database")
    } finally {
      setIsLoading(false)
    }
  }

  // Reset to page 1 whenever any filter/sort change occurs
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, unitFilter, golonganFilter, sortBy])

  // Filter & Sort Logic
  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()

    let list = employees.filter(emp => {
      const nama = emp.nama?.toLowerCase() || ""
      const nik = emp.nik || ""
      const jabatan = emp.jabatan?.toLowerCase() || ""
      const status = (emp.status || "").toUpperCase()
      const golongan = emp.golongan || ""

      const matchSearch = !q || nama.includes(q) || nik.includes(q) || jabatan.includes(q)
      const matchStatus = statusFilter === "all" || status === statusFilter

      let matchUnit = false
      if (unitFilter === "all") {
        matchUnit = true
      } else if (unitFilter === "pusat") {
        matchUnit = !!emp.bidangId && !emp.bidang?.nama?.toLowerCase().includes("cabang")
      } else if (unitFilter === "cabang") {
        matchUnit = !!emp.bidang?.nama?.toLowerCase().includes("cabang")
      } else {
        matchUnit = emp.bidangId === unitFilter
      }

      const matchGolongan = golonganFilter === "all" || golongan === golonganFilter

      return matchSearch && matchStatus && matchUnit && matchGolongan
    })

    // Sorting
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "nama-asc":
          return (a.nama || "").localeCompare(b.nama || "")
        case "nama-desc":
          return (b.nama || "").localeCompare(a.nama || "")
        case "nik-asc":
          return (a.nik || "").localeCompare(b.nik || "")
        case "nik-desc":
          return (b.nik || "").localeCompare(a.nik || "")
        case "masuk-desc":
          return new Date(b.tanggalMasuk || 0).getTime() - new Date(a.tanggalMasuk || 0).getTime()
        case "masuk-asc":
          return new Date(a.tanggalMasuk || 0).getTime() - new Date(b.tanggalMasuk || 0).getTime()
        case "golongan-desc":
          return (b.golongan || "").localeCompare(a.golongan || "")
        case "golongan-asc":
          return (a.golongan || "").localeCompare(b.golongan || "")
        default:
          return 0
      }
    })

    return list
  }, [employees, searchQuery, statusFilter, unitFilter, golonganFilter, sortBy])

  const totalPages = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE)
  const paginated = filteredAndSorted.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const isFilterActive = searchQuery !== "" || statusFilter !== "all" || unitFilter !== "all" || golonganFilter !== "all" || sortBy !== "nama-asc"

  const handleResetFilter = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setUnitFilter("all")
    setGolonganFilter("all")
    setSortBy("nama-asc")
  }

  const validate = () => {
    const errors: Record<string, string> = {}
    if (!form.nama.trim()) errors.nama = "Nama lengkap wajib diisi"
    if (!form.nik || form.nik.length !== 8) errors.nik = "NIK harus 8 digit angka"
    if (!form.bidangId) errors.bidangId = "Unit kerja / Bidang wajib dipilih"
    if (!form.golongan && form.tipeKepegawaian !== "kontrak" && form.tipeKepegawaian !== "magang") {
      errors.golongan = "Golongan wajib dipilih"
    }
    if (!form.email || !form.email.includes("@")) errors.email = "Email valid wajib diisi"
    if (form.telepon && form.telepon.length < 10) errors.telepon = "Nomor telepon minimal 10 digit"
    
    const dup = employees.find(e => e.nik === form.nik && e.id !== editingEmployee?.id)
    if (dup) errors.nik = "NIK sudah digunakan oleh pegawai lain"

    const needsSubBidang = ["KASUBBID", "STAFF", "KASUBBID_CABANG", "STAFF_CABANG"].includes(
      (form.tipeJabatan as string)?.toUpperCase()
    )
    if (needsSubBidang && !editingEmployee && !form.subBidangId) {
      errors.subBidangId = "Sub bidang wajib dipilih untuk staf / kasubbid"
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreate = async () => {
    if (!validate()) {
      toast.error("Mohon lengkapi kolom yang wajib diisi dengan benar")
      return
    }

    setIsLoading(true)
    try {
      const res = (await createEmployee({ ...form }, fotoFile ?? undefined)) as any
      if (res?.error) {
        toast.error(res.error)
        setIsLoading(false)
        return
      }
      toast.success("Pegawai baru berhasil ditambahkan")
      setShowAddDialog(false)
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Gagal menambahkan pegawai")
    }
    setIsLoading(false)
  }

  const handleUpdate = async () => {
    if (!editingEmployee) return
    if (!validate()) {
      toast.error("Mohon lengkapi kolom yang wajib diisi dengan benar")
      return
    }

    setIsLoading(true)
    try {
      const res = (await updateEmployee(editingEmployee.id, { ...form }, fotoFile ?? undefined)) as any
      if (res?.error) {
        toast.error(res.error)
        setIsLoading(false)
        return
      }
      toast.success("Data pegawai berhasil diperbarui")
      setShowEditDialog(false)
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui pegawai")
    }
    setIsLoading(false)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteEmployee(id)
      toast.success("Pegawai berhasil dihapus dari sistem")
      setShowDeleteDialog(false)
      setDeletingEmployee(null)
      fetchData()
    } catch {
      toast.error("Gagal menghapus pegawai")
    }
  }

  const handleExport = () => {
    const headers = ["NIK", "Nama", "Jabatan", "Unit Kerja", "Golongan", "Status", "SP", "Email", "Telepon"]
    const rows = filteredAndSorted.map(e => [
      e.nik,
      `"${e.nama.replace(/"/g, '""')}"`,
      `"${e.jabatan.replace(/"/g, '""')}"`,
      `"${(e.bidang?.nama || "-").replace(/"/g, '""')}"`,
      e.golongan || "-",
      e.status || "-",
      e.sp ?? "-",
      e.email || "-",
      e.telepon || "-",
    ])
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `data-pegawai-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Data pegawai berhasil diekspor ke CSV")
  }

  const openAdd = () => {
    setForm(emptyForm)
    setFotoPreview(null)
    setFotoFile(null)
    setFormErrors({})
    setFormTab("identitas")
    setShowAddDialog(true)
  }

  const openEdit = (emp: Employee) => {
    setEditingEmployee(emp)
    setForm({
      nik: emp.nik,
      nama: emp.nama,
      email: emp.email,
      telepon: emp.telepon,
      fotoUrl: emp.fotoUrl,
      bidangId: emp.bidangId,
      subBidangId: (emp as any).subBidangId || "",
      tipeJabatan: emp.tipeJabatan as any,
      jabatan: emp.jabatan,
      atasanLangsung: emp.atasanLangsung,
      golongan: emp.golongan,
      pangkat: emp.pangkat,
      status: emp.status,
      sp: emp.sp,
      tanggalMasuk: (() => {
        try { return emp.tanggalMasuk ? new Date(emp.tanggalMasuk).toISOString().split("T")[0] : "" }
        catch { return "" }
      })(),
      jenisKelamin: emp.jenisKelamin,
      tempatLahir: emp.tempatLahir,
      tanggalLahir: (() => {
        try { return emp.tanggalLahir ? new Date(emp.tanggalLahir).toISOString().split("T")[0] : "" }
        catch { return "" }
      })(),
      agama: emp.agama,
      statusNikah: emp.statusNikah,
      pendidikanTerakhir: emp.pendidikanTerakhir,
      jurusan: emp.jurusan,
      institusi: emp.institusi,
      tahunLulus: emp.tahunLulus,
      bank: emp.bank,
      noRekening: emp.noRekening,
      bpjsKesehatan: emp.bpjsKesehatan,
      bpjsKetenagakerjaan: emp.bpjsKetenagakerjaan,
      alamat: emp.alamat,
      npwp: emp.npwp,
      role: "PEGAWAI",
      password: "",
      tipeKepegawaian: (emp as any).tipeKepegawaian || "tetap",
    })
    setFotoPreview(emp.fotoUrl)
    setFotoFile(null)
    setFormErrors({})
    setFormTab("identitas")
    setShowEditDialog(true)
  }

  // Modern Tabbed Form Modal Content
  const renderFormContent = () => (
    <div className="space-y-5">
      {/* Tab Selector Buttons */}
      <div className="flex border-b border-slate-200 dark:border-zinc-800 text-xs">
        <button
          type="button"
          onClick={() => setFormTab("identitas")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
            formTab === "identitas"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100"
          }`}
        >
          <Users className="h-3.5 w-3.5" strokeWidth={1.75} />
          Identitas & Akun
        </button>
        <button
          type="button"
          onClick={() => setFormTab("kepegawaian")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
            formTab === "kepegawaian"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100"
          }`}
        >
          <Briefcase className="h-3.5 w-3.5" strokeWidth={1.75} />
          Kepegawaian & Jabatan
        </button>
        <button
          type="button"
          onClick={() => setFormTab("biodata")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
            formTab === "biodata"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100"
          }`}
        >
          <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
          Biodata & Domisili
        </button>
        <button
          type="button"
          onClick={() => setFormTab("finansial")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-colors ${
            formTab === "finansial"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100"
          }`}
        >
          <CreditCard className="h-3.5 w-3.5" strokeWidth={1.75} />
          Pendidikan & Finansial
        </button>
      </div>

      {/* Tab 1: Identitas & Akun */}
      {formTab === "identitas" && (
        <div className="space-y-4 pt-1">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40">
            <div className="relative group shrink-0">
              <div className="h-20 w-20 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center justify-center shadow-xs">
                {fotoPreview ? (
                  <img src={fotoPreview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <Users className="h-8 w-8 text-slate-400 dark:text-zinc-500" strokeWidth={1.5} />
                )}
              </div>
              <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white rounded-xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-[10px] font-medium">
                <Camera className="h-4 w-4 mb-0.5" />
                Ubah
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setFotoFile(file)
                      setFotoPreview(URL.createObjectURL(file))
                    }
                  }}
                />
              </label>
            </div>
            <div className="text-center sm:text-left space-y-1">
              <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200">Foto Profil Pegawai</p>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Format PNG atau JPG dengan ukuran maksimal 2MB. Foto formal tampak depan dengan pencahayaan memadai.
              </p>
              <label className="inline-block text-xs font-medium text-primary hover:underline cursor-pointer mt-1">
                Pilih Berkas Foto
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setFotoFile(file)
                      setFotoPreview(URL.createObjectURL(file))
                    }
                  }}
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <F label="Nama Lengkap" error={formErrors.nama} required>
              <Input
                value={form.nama}
                onChange={e => setForm({ ...form, nama: e.target.value })}
                placeholder="Contoh: Muhammad Ihsan, S.T."
                className="h-9 text-xs"
              />
            </F>
            <F label="NIK (Nomor Induk Karyawan)" error={formErrors.nik} required>
              <Input
                value={form.nik}
                onChange={e => setForm({ ...form, nik: e.target.value.replace(/\D/g, "").slice(0, 8) })}
                placeholder="8 digit angka (contoh: 20240101)"
                maxLength={8}
                className="h-9 text-xs font-mono"
              />
            </F>
            <F label="Email Perusahaan" error={formErrors.email} required>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="nama@pdam-tar.co.id"
                className="h-9 text-xs"
              />
            </F>
            <F label="Nomor Telepon / WhatsApp" error={formErrors.telepon}>
              <Input
                value={form.telepon || ""}
                onChange={e => setForm({ ...form, telepon: e.target.value })}
                placeholder="081234567890"
                className="h-9 text-xs font-mono"
              />
            </F>
            {!editingEmployee && (
              <>
                <F label="Password Akun Baru">
                  <Input
                    type="password"
                    value={form.password || ""}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Default: 123456"
                    className="h-9 text-xs font-mono"
                  />
                </F>
                <F label="Role Pengguna">
                  <Select value={form.role || "PEGAWAI"} onValueChange={v => setForm({ ...form, role: v })}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Pilih Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PEGAWAI">Pegawai</SelectItem>
                      <SelectItem value="ADMIN">Admin SIMPEG</SelectItem>
                      <SelectItem value="DIREKSI">Direksi</SelectItem>
                    </SelectContent>
                  </Select>
                </F>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Kepegawaian & Jabatan */}
      {formTab === "kepegawaian" && (
        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <F label="Unit Kerja / Bidang" error={formErrors.bidangId} required>
              <Select
                value={form.bidangId || "NONE"}
                onValueChange={v => {
                  const bid = v === "NONE" ? "" : v
                  setForm({ ...form, bidangId: bid, jabatan: "", tipeJabatan: "", subBidangId: "" })
                }}
              >
                <SelectTrigger className="h-9 text-xs truncate overflow-hidden">
                  <SelectValue placeholder="Pilih Unit Kerja" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">— Pilih Unit Kerja —</SelectItem>
                  {bidangData.map(b => (
                    <SelectItem key={b.id} value={b.id} className="text-xs">
                      {b.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </F>

            <F label="Jabatan Struktural" required>
              <Select
                value={form.tipeJabatan || "NONE"}
                onValueChange={v => {
                  const tipe = v === "NONE" ? "" : v
                  const bidang = bidangData.find(b => b.id === form.bidangId)
                  const namaB = bidang?.nama || ""
                  const autoJabatan = tipe ? getJabatanLabel(tipe as TipeJabatan, namaB) : ""
                  setForm({
                    ...form,
                    tipeJabatan: tipe,
                    jabatan: autoJabatan,
                    subBidangId: tipe.includes("kepala") ? "" : form.subBidangId,
                  })
                }}
              >
                <SelectTrigger className="h-9 text-xs truncate overflow-hidden">
                  <SelectValue placeholder="Pilih Jabatan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">— Pilih Jabatan —</SelectItem>
                  {form.bidangId ? (
                    getJabatanOptions(form.bidangId, bidangData).map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="kepala_bidang" className="text-xs">Kepala Bidang</SelectItem>
                      <SelectItem value="kasubbid" className="text-xs">Kasubbid</SelectItem>
                      <SelectItem value="staff" className="text-xs">Staff</SelectItem>
                      <SelectItem value="kepala_cabang" className="text-xs">Kepala Cabang</SelectItem>
                      <SelectItem value="kasubbid_cabang" className="text-xs">Kasubbid Cabang</SelectItem>
                      <SelectItem value="staff_cabang" className="text-xs">Staff Cabang</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </F>

            {form.tipeJabatan && !form.tipeJabatan.includes("kepala") && form.bidangId && (
              <F label="Sub Bidang" error={formErrors.subBidangId} required>
                <Select
                  value={form.subBidangId || "NONE"}
                  onValueChange={v => setForm({ ...form, subBidangId: v === "NONE" ? "" : v })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Pilih Sub Bidang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">— Pilih Sub Bidang —</SelectItem>
                    {getSubBidangOptions(form.bidangId || "", bidangData).map(sb => (
                      <SelectItem key={sb.id} value={sb.id} className="text-xs">
                        {sb.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </F>
            )}

            <F label="Tipe Kepegawaian">
              <Select
                value={form.tipeKepegawaian || "tetap"}
                onValueChange={v => setForm({ ...form, tipeKepegawaian: v })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Pilih Tipe Kepegawaian" />
                </SelectTrigger>
                <SelectContent>
                  {tipeKepegawaianOptions.map(t => (
                    <SelectItem key={t.value} value={t.value} className="text-xs">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </F>

            {form.tipeKepegawaian !== "kontrak" && form.tipeKepegawaian !== "magang" && (
              <F label="Golongan" error={formErrors.golongan} required>
                <Select
                  value={form.golongan || "NONE"}
                  onValueChange={v => setForm({ ...form, golongan: v === "NONE" ? "" : v })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Pilih Golongan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">— Pilih Golongan —</SelectItem>
                    {golonganOptions.map(g => (
                      <SelectItem key={g} value={g} className="text-xs font-mono">
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </F>
            )}

            <F label="Status Kepegawaian">
              <Select value={form.status || "AKTIF"} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AKTIF" className="text-xs">Aktif</SelectItem>
                  <SelectItem value="CUTI" className="text-xs">Cuti</SelectItem>
                  <SelectItem value="NON_AKTIF" className="text-xs">Non-Aktif</SelectItem>
                  <SelectItem value="PENSIUN" className="text-xs">Pensiun</SelectItem>
                </SelectContent>
              </Select>
            </F>

            <F label="Tanggal Mulai Tugas (TMT)">
              <Input
                type="date"
                value={form.tanggalMasuk}
                onChange={e => setForm({ ...form, tanggalMasuk: e.target.value })}
                className="h-9 text-xs"
              />
            </F>

            <F label="Surat Peringatan (SP)">
              <Select
                value={form.sp ?? "NONE"}
                onValueChange={v => setForm({ ...form, sp: v === "NONE" ? null : v })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Tidak Ada SP" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE" className="text-xs">Tidak Ada SP</SelectItem>
                  <SelectItem value="SP1" className="text-xs">SP 1</SelectItem>
                  <SelectItem value="SP2" className="text-xs">SP 2</SelectItem>
                  <SelectItem value="SP3" className="text-xs">SP 3</SelectItem>
                </SelectContent>
              </Select>
            </F>
          </div>

          {(form.tipeJabatan as TipeJabatan) && form.bidangId && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300 text-xs">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>
                Atasan Langsung Otomatis:{" "}
                <strong className="font-semibold">
                  {getAtasanOtomatis(form.tipeJabatan as TipeJabatan, form.bidangId || "", bidangData)}
                </strong>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Biodata & Domisili */}
      {formTab === "biodata" && (
        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <F label="Tempat Lahir">
              <Input
                value={form.tempatLahir || ""}
                onChange={e => setForm({ ...form, tempatLahir: e.target.value })}
                placeholder="Contoh: Praya, Mataram"
                className="h-9 text-xs"
              />
            </F>
            <F label="Tanggal Lahir">
              <Input
                type="date"
                value={form.tanggalLahir || ""}
                onChange={e => setForm({ ...form, tanggalLahir: e.target.value })}
                className="h-9 text-xs"
              />
            </F>
            <F label="Jenis Kelamin">
              <Select value={form.jenisKelamin || ""} onValueChange={v => setForm({ ...form, jenisKelamin: v })}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Pilih Jenis Kelamin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L" className="text-xs">Laki-laki</SelectItem>
                  <SelectItem value="P" className="text-xs">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </F>
            <F label="Agama">
              <Select value={form.agama || ""} onValueChange={v => setForm({ ...form, agama: v })}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Pilih Agama" />
                </SelectTrigger>
                <SelectContent>
                  {["ISLAM", "KRISTEN", "KATOLIK", "HINDU", "BUDDHA", "KONGHUCU"].map(a => (
                    <SelectItem key={a} value={a} className="text-xs">
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </F>
            <F label="Status Pernikahan">
              <Select value={form.statusNikah || ""} onValueChange={v => setForm({ ...form, statusNikah: v })}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Pilih Status Nikah" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BELUM_MENIKAH" className="text-xs">Belum Menikah</SelectItem>
                  <SelectItem value="MENIKAH" className="text-xs">Menikah</SelectItem>
                  <SelectItem value="CERAI" className="text-xs">Cerai</SelectItem>
                </SelectContent>
              </Select>
            </F>
            <F label="Nomor Pokok Wajib Pajak (NPWP)">
              <Input
                value={form.npwp || ""}
                onChange={e => setForm({ ...form, npwp: e.target.value })}
                placeholder="00.000.000.0-000.000"
                className="h-9 text-xs font-mono"
              />
            </F>
          </div>

          <F label="Alamat Domisili Lengkap">
            <Textarea
              value={form.alamat || ""}
              onChange={e => setForm({ ...form, alamat: e.target.value })}
              placeholder="Alamat lengkap tempat tinggal saat ini (Jalan, RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten)"
              className="text-xs min-h-[80px]"
            />
          </F>
        </div>
      )}

      {/* Tab 4: Pendidikan & Finansial */}
      {formTab === "finansial" && (
        <div className="space-y-4 pt-1">
          <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 p-3.5 space-y-3 bg-slate-50/40 dark:bg-zinc-900/30">
            <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 text-primary" />
              Pendidikan Terakhir
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <F label="Jenjang">
                <Select
                  value={form.pendidikanTerakhir || "NONE"}
                  onValueChange={v => setForm({ ...form, pendidikanTerakhir: v === "NONE" ? "" : v })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Pilih Jenjang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE" className="text-xs">— Pilih —</SelectItem>
                    {["SD", "SMP", "SMA", "D1", "D2", "D3", "D4", "S1", "S2", "S3"].map(p => (
                      <SelectItem key={p} value={p} className="text-xs">
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </F>
              <F label="Jurusan">
                <Input
                  value={form.jurusan || ""}
                  onChange={e => setForm({ ...form, jurusan: e.target.value })}
                  placeholder="Teknik Lingkungan, Manajemen"
                  className="h-9 text-xs"
                />
              </F>
              <F label="Institusi / Universitas">
                <Input
                  value={form.institusi || ""}
                  onChange={e => setForm({ ...form, institusi: e.target.value })}
                  placeholder="Universitas / Politeknik"
                  className="h-9 text-xs"
                />
              </F>
              <F label="Tahun Kelulusan">
                <Input
                  value={form.tahunLulus || ""}
                  onChange={e => setForm({ ...form, tahunLulus: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                  placeholder="2020"
                  maxLength={4}
                  className="h-9 text-xs font-mono"
                />
              </F>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 p-3.5 space-y-3 bg-slate-50/40 dark:bg-zinc-900/30">
            <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-primary" />
              Informasi Rekening Bank & Jaminan Sosial
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <F label="Nama Bank">
                <Select
                  value={form.bank || "NONE"}
                  onValueChange={v => setForm({ ...form, bank: v === "NONE" ? "" : v })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Pilih Bank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE" className="text-xs">— Pilih Bank —</SelectItem>
                    {["BPD NTB Syariah", "BRI", "Mandiri", "BNI", "BCA", "BSI", "BTN", "Lainnya"].map(b => (
                      <SelectItem key={b} value={b} className="text-xs">
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </F>
              <F label="Nomor Rekening">
                <Input
                  value={form.noRekening || ""}
                  onChange={e => setForm({ ...form, noRekening: e.target.value })}
                  placeholder="Nomor rekening bank"
                  className="h-9 text-xs font-mono"
                />
              </F>
              <F label="BPJS Kesehatan">
                <Input
                  value={form.bpjsKesehatan || ""}
                  onChange={e => setForm({ ...form, bpjsKesehatan: e.target.value })}
                  placeholder="Nomor kartu BPJS Kesehatan"
                  className="h-9 text-xs font-mono"
                />
              </F>
              <F label="BPJS Ketenagakerjaan (KPJ)">
                <Input
                  value={form.bpjsKetenagakerjaan || ""}
                  onChange={e => setForm({ ...form, bpjsKetenagakerjaan: e.target.value })}
                  placeholder="Nomor KPJ Ketenagakerjaan"
                  className="h-9 text-xs font-mono"
                />
              </F>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex min-h-screen bg-slate-50/50 dark:bg-background text-slate-900 dark:text-zinc-100">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset min-w-0">
        <TopBar breadcrumb={["Kepegawaian", "Data Pegawai"]} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Data Pegawai
              </h1>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                Direktori seluruh sumber daya manusia PDAM Tirta Ardhia Rinjani
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="h-9 gap-1.5 text-xs font-medium border-slate-200 dark:border-zinc-800"
              >
                <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
                Ekspor CSV
              </Button>
              <Button
                size="sm"
                onClick={openAdd}
                className="h-9 gap-1.5 text-xs font-medium bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
              >
                <UserPlus className="h-3.5 w-3.5" strokeWidth={1.75} />
                Tambah Pegawai
              </Button>
            </div>
          </div>

          {/* SaaS Minimalist KPI Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[
              {
                label: "Total Pegawai",
                value: stats?.total ?? employees.length,
                subtext: "Terdaftar dalam database",
                icon: Users,
                dot: "bg-primary",
              },
              {
                label: "Pegawai Aktif",
                value: stats?.aktif ?? employees.filter(e => (e.status || "").toLowerCase() === "aktif").length,
                subtext: "Status bertugas aktif",
                icon: UserCheck,
                dot: "bg-emerald-500",
              },
              {
                label: "Sedang Cuti",
                value: stats?.cuti ?? employees.filter(e => (e.status || "").toLowerCase() === "cuti").length,
                subtext: "Izin / cuti resmi",
                icon: Clock,
                dot: "bg-amber-500",
              },
              {
                label: "Non-Aktif / Pensiun",
                value: stats?.nonAktif ?? employees.filter(e => ["non_aktif", "non-aktif", "pensiun"].includes((e.status || "").toLowerCase())).length,
                subtext: "Purnatugas / keluar",
                icon: UserX,
                dot: "bg-slate-400",
              },
            ].map(card => (
              <div
                key={card.label}
                className="rounded-xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111113] p-4 transition-all hover:border-slate-300 dark:hover:border-zinc-700 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">{card.label}</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-900/60">
                    <card.icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100">
                  {card.value}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400">
                  <span className={`h-1.5 w-1.5 rounded-full ${card.dot}`} />
                  {card.subtext}
                </div>
              </div>
            ))}
          </div>

          {/* Filter & Search Bar */}
          <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111113] p-4 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search Query */}
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.75} />
                <Input
                  placeholder="Cari nama pegawai, NIK, atau jabatan..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs border-slate-200 dark:border-zinc-800"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Unit Kerja Filter */}
              <div>
                <Select value={unitFilter} onValueChange={setUnitFilter}>
                  <SelectTrigger className="h-9 text-xs border-slate-200 dark:border-zinc-800 truncate">
                    <SelectValue placeholder="Semua Unit Kerja" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="all" className="text-xs font-medium">Semua Unit Kerja</SelectItem>
                    <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                      Kategori
                    </div>
                    <SelectItem value="pusat" className="text-xs">Kantor Pusat (Semua)</SelectItem>
                    <SelectItem value="cabang" className="text-xs">Kantor Cabang (Semua)</SelectItem>
                    <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                      Bidang & Bagian
                    </div>
                    {bidangData.map(b => (
                      <SelectItem key={b.id} value={b.id} className="text-xs truncate">
                        {b.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 text-xs border-slate-200 dark:border-zinc-800">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs font-medium">Semua Status</SelectItem>
                    <SelectItem value="AKTIF" className="text-xs">Aktif</SelectItem>
                    <SelectItem value="CUTI" className="text-xs">Cuti</SelectItem>
                    <SelectItem value="NON_AKTIF" className="text-xs">Non-Aktif</SelectItem>
                    <SelectItem value="PENSIUN" className="text-xs">Pensiun</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Dropdown */}
              <div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-9 text-xs border-slate-200 dark:border-zinc-800">
                    <div className="flex items-center gap-1.5 truncate">
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
                      <SelectValue placeholder="Urutkan" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nama-asc" className="text-xs">Nama (A - Z)</SelectItem>
                    <SelectItem value="nama-desc" className="text-xs">Nama (Z - A)</SelectItem>
                    <SelectItem value="nik-asc" className="text-xs">NIK (0 - 9)</SelectItem>
                    <SelectItem value="nik-desc" className="text-xs">NIK (9 - 0)</SelectItem>
                    <SelectItem value="masuk-desc" className="text-xs">TMT (Terbaru)</SelectItem>
                    <SelectItem value="masuk-asc" className="text-xs">TMT (Terlama)</SelectItem>
                    <SelectItem value="golongan-desc" className="text-xs">Golongan (Tertinggi)</SelectItem>
                    <SelectItem value="golongan-asc" className="text-xs">Golongan (Terendah)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters / Results Summary bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800/80 text-xs">
              <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400">
                <span>
                  Menampilkan <strong className="text-slate-900 dark:text-zinc-100 font-semibold">{filteredAndSorted.length}</strong> pegawai
                </span>
                {golonganFilter !== "all" && (
                  <Badge variant="outline" className="text-[10px] font-mono py-0 h-5">
                    Gol: {golonganFilter}
                  </Badge>
                )}
              </div>

              {isFilterActive && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilter}
                  className="h-7 px-2 text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100 gap-1"
                >
                  <X className="h-3 w-3" />
                  Reset Filter
                </Button>
              )}
            </div>
          </div>

          {/* Pegawai Data Table */}
          <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111113] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/50 hover:bg-transparent">
                    <TableHead className="w-[280px] text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 py-3">
                      Pegawai
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 py-3">
                      NIK
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 py-3">
                      Jabatan
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 py-3">
                      Unit Kerja
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 py-3">
                      Golongan
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 py-3">
                      Masa Kerja
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 py-3 text-center">
                      Status
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 py-3">
                      Kontak
                    </TableHead>
                    <TableHead className="w-[80px] text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 py-3 pr-4">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-48 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          <p className="text-xs text-slate-500 dark:text-zinc-400">Memuat data pegawai...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginated.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-48 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Search className="h-8 w-8 text-slate-300 dark:text-zinc-700" strokeWidth={1.5} />
                          <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">Tidak ada pegawai yang cocok</p>
                          <p className="text-xs text-slate-400 dark:text-zinc-500">Coba sesuaikan kata kunci pencarian atau filter yang dipilih</p>
                          {isFilterActive && (
                            <Button variant="outline" size="sm" onClick={handleResetFilter} className="mt-2 text-xs h-8">
                              Reset Filter
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map(emp => {
                      const statusKey = (emp.status || "aktif").toLowerCase()
                      const statusInfo = statusConfig[statusKey] || statusConfig.aktif

                      return (
                        <TableRow
                          key={emp.id}
                          className="border-b border-slate-100 dark:border-zinc-800/80 hover:bg-slate-50/60 dark:hover:bg-zinc-900/40 transition-colors"
                        >
                          {/* Nama & Avatar */}
                          <TableCell className="py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 rounded-lg border border-slate-200 dark:border-zinc-700 shrink-0">
                                {emp.fotoUrl ? (
                                  <AvatarImage src={emp.fotoUrl} className="object-cover" />
                                ) : null}
                                <AvatarFallback className="rounded-lg bg-slate-100 dark:bg-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                                  {(emp.nama || "P")
                                    .split(" ")
                                    .map(n => n[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <Link
                                    href={`/pegawai/${(emp.nama || "").toLowerCase().replace(/ /g, "-")}`}
                                    className="text-xs font-semibold text-slate-900 dark:text-zinc-100 hover:text-primary transition-colors truncate max-w-[170px]"
                                  >
                                    {emp.nama}
                                  </Link>
                                  {emp.sp && spConfig[emp.sp] && (
                                    <Badge
                                      variant="outline"
                                      className={`text-[9px] px-1.5 py-0 h-4 font-mono ${spConfig[emp.sp].className}`}
                                    >
                                      {spConfig[emp.sp].label}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400 dark:text-zinc-500 truncate">
                                  {emp.jenisKelamin === "L" ? "Laki-laki" : emp.jenisKelamin === "P" ? "Perempuan" : "—"}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          {/* NIK */}
                          <TableCell className="font-mono text-xs text-slate-600 dark:text-zinc-400 py-3">
                            {emp.nik}
                          </TableCell>

                          {/* Jabatan */}
                          <TableCell className="text-xs font-medium text-slate-800 dark:text-zinc-200 py-3 max-w-[180px] truncate">
                            {emp.jabatan || "—"}
                          </TableCell>

                          {/* Unit Kerja */}
                          <TableCell className="text-xs text-slate-600 dark:text-zinc-400 py-3 max-w-[180px] truncate">
                            {emp.bidang?.nama || "—"}
                          </TableCell>

                          {/* Golongan */}
                          <TableCell className="py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300">
                              {emp.golongan || "—"}
                            </span>
                          </TableCell>

                          {/* Masa Kerja */}
                          <TableCell className="text-xs text-slate-600 dark:text-zinc-400 py-3">
                            {emp.masaKerja || "—"}
                          </TableCell>

                          {/* Status */}
                          <TableCell className="text-center py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusInfo.badgeClass}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
                              {statusInfo.label}
                            </span>
                          </TableCell>

                          {/* Kontak */}
                          <TableCell className="py-3">
                            <div className="flex flex-col gap-0.5">
                              {emp.email ? (
                                <a
                                  href={`mailto:${emp.email}`}
                                  className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-zinc-400 hover:text-primary transition-colors max-w-[130px] truncate"
                                  title={emp.email}
                                >
                                  <Mail className="h-3 w-3 shrink-0" strokeWidth={1.5} />
                                  <span className="truncate">{emp.email}</span>
                                </a>
                              ) : null}
                              {emp.telepon ? (
                                <a
                                  href={`tel:${emp.telepon}`}
                                  className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-zinc-400 hover:text-primary transition-colors"
                                >
                                  <Phone className="h-3 w-3 shrink-0" strokeWidth={1.5} />
                                  <span className="font-mono">{emp.telepon}</span>
                                </a>
                              ) : null}
                            </div>
                          </TableCell>

                          {/* Aksi */}
                          <TableCell className="text-right py-3 pr-4">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100"
                                title="Lihat Profil"
                              >
                                <Link href={`/pegawai/${(emp.nama || "").toLowerCase().replace(/ /g, "-")}`}>
                                  <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
                                </Link>
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100"
                                  >
                                    <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={1.75} />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="text-xs">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/pegawai/${(emp.nama || "").toLowerCase().replace(/ /g, "-")}`} className="cursor-pointer">
                                      <Eye className="mr-2 h-3.5 w-3.5 text-slate-400" />
                                      Lihat Profil Lengkap
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openEdit(emp)} className="cursor-pointer">
                                    <Edit className="mr-2 h-3.5 w-3.5 text-slate-400" />
                                    Edit Data Pegawai
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setDeletingEmployee(emp)
                                      setShowDeleteDialog(true)
                                    }}
                                    className="text-rose-600 dark:text-rose-400 cursor-pointer"
                                  >
                                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                                    Hapus Pegawai
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-zinc-800/80 p-4 text-xs">
              <p className="text-slate-500 dark:text-zinc-400">
                Menampilkan{" "}
                <span className="font-semibold text-slate-900 dark:text-zinc-100">
                  {filteredAndSorted.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>{" "}
                –{" "}
                <span className="font-semibold text-slate-900 dark:text-zinc-100">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSorted.length)}
                </span>{" "}
                dari{" "}
                <span className="font-semibold text-slate-900 dark:text-zinc-100">
                  {filteredAndSorted.length}
                </span>{" "}
                pegawai
              </p>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="h-8 gap-1 text-xs border-slate-200 dark:border-zinc-800"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Sebelumnya
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                    <Button
                      key={p}
                      variant={currentPage === p ? "default" : "outline"}
                      size="sm"
                      className="h-8 w-8 p-0 text-xs font-mono"
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </Button>
                  ))}
                  {totalPages > 5 && <span className="text-slate-400 px-1">...</span>}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="h-8 gap-1 text-xs border-slate-200 dark:border-zinc-800"
                >
                  Selanjutnya
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Dialog Tambah Pegawai Baru */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-6 rounded-2xl border-slate-200 dark:border-zinc-800">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" strokeWidth={1.75} />
              Tambah Pegawai Baru
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400">
              Isi data identitas, kepegawaian, dan informasi pelengkap untuk mendaftarkan pegawai ke sistem SIMPEG.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-3 pr-1">{renderFormContent()}</div>

          <DialogFooter className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between sm:justify-between">
            <div className="text-[11px] text-slate-400 dark:text-zinc-500">
              <span className="text-rose-500">*</span> Kolom bertanda bintang wajib diisi
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddDialog(false)}
                className="h-9 text-xs border-slate-200 dark:border-zinc-800"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={isLoading}
                className="h-9 text-xs gap-1.5"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Daftarkan Pegawai"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Edit Data Pegawai */}
      <Dialog
        open={showEditDialog}
        onOpenChange={v => {
          setShowEditDialog(v)
          if (!v) setEditingEmployee(null)
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-6 rounded-2xl border-slate-200 dark:border-zinc-800">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" strokeWidth={1.75} />
              Perbarui Data Pegawai — {editingEmployee?.nama}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400">
              Sesuaikan data identitas, jabatan struktural, atau informasi kontak pegawai.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-3 pr-1">{renderFormContent()}</div>

          <DialogFooter className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between sm:justify-between">
            <div className="text-[11px] text-slate-400 dark:text-zinc-500">
              <span className="text-rose-500">*</span> Kolom bertanda bintang wajib diisi
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowEditDialog(false)
                  setEditingEmployee(null)
                }}
                className="h-9 text-xs border-slate-200 dark:border-zinc-800"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleUpdate}
                disabled={isLoading}
                className="h-9 text-xs gap-1.5"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Perubahan"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog Konfirmasi Hapus */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl border-slate-200 dark:border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base font-bold text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5" strokeWidth={1.75} />
              Konfirmasi Penghapusan Pegawai
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-600 dark:text-zinc-400 space-y-2">
              <p>
                Anda akan menghapus data pegawai:{" "}
                <strong className="text-slate-900 dark:text-zinc-100">{deletingEmployee?.nama}</strong> (NIK:{" "}
                <span className="font-mono font-semibold">{deletingEmployee?.nik}</span>).
              </p>
              <p className="text-rose-600/90 dark:text-rose-400/90">
                Peringatan: Seluruh data akun login, riwayat presensi, dokumen, dan relasi jabatan pegawai ini akan dihapus secara permanen dari basis data. Tindakan ini tidak dapat dibatalkan.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="h-9 text-xs border-slate-200 dark:border-zinc-800">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingEmployee && handleDelete(deletingEmployee.id)}
              className="h-9 text-xs bg-rose-600 hover:bg-rose-700 text-white"
            >
              Ya, Hapus Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
