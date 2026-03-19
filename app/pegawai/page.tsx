"use client"

import React, { useState, useEffect } from "react"
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
import { Card, CardContent } from "@/components/ui/card"
import {
  Search, Download, UserPlus, MoreHorizontal,
  Eye, Edit, Trash2, Users, UserCheck, UserX,
  Clock, Mail, Phone, ChevronLeft, ChevronRight,
  Loader2, AlertTriangle, Camera, UserCircle,
} from "lucide-react"
import { 
  getEmployees, 
  getEmployeeStats, 
  createEmployee, 
  updateEmployee, 
  deleteEmployee,
  getBidang
} from "@/lib/actions/pegawai"
import { bidangList as fallbackBidang, getJabatanOptions, getAtasanOtomatis, getJabatanLabel, getSubBidangOptions, golonganOptions, tipeKepegawaianOptions, type TipeJabatan } from "@/lib/data/bidang-store"

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



const statusConfig = {
  aktif:       { label: "Aktif",      className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  cuti:        { label: "Cuti",       className: "bg-amber-100 text-amber-700 border-amber-200" },
  "non-aktif": { label: "Non-Aktif",  className: "bg-gray-100 text-gray-700 border-gray-200" },
  pensiun:     { label: "Pensiun",    className: "bg-red-100 text-red-700 border-red-200" },
}

const spConfig = {
  SP1: { label: "SP-1", className: "bg-gray-100 text-gray-600 border-gray-300" },
  SP2: { label: "SP-2", className: "bg-amber-100 text-amber-700 border-amber-300" },
  SP3: { label: "SP-3", className: "bg-red-100 text-red-700 border-red-300" },
}

// golonganOptions imported from bidang-store
const ITEMS_PER_PAGE = 10

// Form field wrapper — MUST be outside component to prevent input remount per keystroke
const F = ({label, error, children}: {label:string; error?:string; children:React.ReactNode}) => (
  <div><Label>{label}</Label><div className="mt-1">{children}</div>{error && <p className="mt-1 text-xs text-destructive">{error}</p>}</div>
)

export default function EmployeeListPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [unitFilter, setUnitFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [bidangData, setBidangData] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [emps, s, bid] = await Promise.all([
        getEmployees(),
        getEmployeeStats(),
        getBidang(),
      ])
      setEmployees(emps as any[] || [])
      setStats(s)
      setBidangData(bid?.length ? bid : fallbackBidang)
    } catch (error) {
      toast.error("Gagal mengambil data dari database")
    } finally {
      setIsLoading(false)
    }
  }

  type EmployeeForm = Omit<Employee, "id" | "bidang" | "masaKerja" | "initials"> & {
    id?: string
    password?: string
    role?: string
    subBidangId?: string
    tipeKepegawaian?: string
  }

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
    tipeKepegawaian: "",
  } as EmployeeForm
  const [form, setForm] = useState<EmployeeForm>(emptyForm)
  const [formErrors, setFormErrors] = useState<Record<string,string>>({})

  useEffect(() => { setCurrentPage(1) }, [searchQuery, statusFilter, unitFilter])

  const filtered = employees.filter(emp => {
    const nama = emp.nama || ""
    const nik = emp.nik || ""
    const jabatan = emp.jabatan || ""
    const status = emp.status || ""
    
    const matchSearch = nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      nik.includes(searchQuery) || 
                      jabatan.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = statusFilter === "all" || status === statusFilter
    const matchUnit = unitFilter === "all" || emp.bidangId === unitFilter
    return matchSearch && matchStatus && matchUnit
  })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((currentPage-1)*ITEMS_PER_PAGE, currentPage*ITEMS_PER_PAGE)
  const units = bidangData.map(b => ({ id: b.id, nama: b.nama }))

  const validate = () => {
    const errors: Record<string,string> = {}
    if (!form.nama.trim()) errors.nama = "Nama wajib diisi"
    if (!form.nik || form.nik.length !== 16) errors.nik = "NIK harus 16 digit"
    if (!form.bidangId) errors.bidangId = "Unit kerja wajib dipilih"
    if (!form.golongan) errors.golongan = "Golongan wajib dipilih"
    if (form.email && !form.email.includes("@")) errors.email = "Format email tidak valid"
    if (form.telepon && form.telepon.length < 10) errors.telepon = "Nomor telepon tidak valid"
    const dup = employees.find(e => e.nik === form.nik && e.id !== editingEmployee?.id)
    if (dup) errors.nik = "NIK sudah terdaftar"
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handlers
  const handleCreate = async () => {
    if (!form.nama || !form.nik) {
      toast.error("Nama dan NIK wajib diisi")
      return
    }
    
    // Auto-fill form email if empty, using NIK
    const safeForm = { ...form, email: form.email || `${form.nik}@pdamtirta.com` }
    
    setIsLoading(true)
    try {
      const res = await createEmployee(safeForm, fotoFile ?? undefined) as any
      if (res?.error) {
        toast.error(res.error)
        setIsLoading(false)
        return
      }
      toast.success("Pegawai berhasil ditambahkan")
      setShowAddDialog(false)
      fetchData() // refresh dari DB
    } catch (error: any) {
      toast.error(error.message || "Gagal menambahkan pegawai")
    }
    setIsLoading(false)
  }

  const handleUpdate = async () => {
    if (!editingEmployee || !form.nama || !form.nik) {
      toast.error("Nama dan NIK wajib diisi")
      return
    }
    
    // Auto-fill form email if empty, using NIK
    const safeForm = { ...form, email: form.email || `${form.nik}@pdamtirta.com` }

    setIsLoading(true)
    try {
      const res = await updateEmployee(editingEmployee.id, safeForm, fotoFile ?? undefined) as any
      if (res?.error) {
        toast.error(res.error)
        setIsLoading(false)
        return
      }
      toast.success("Pegawai berhasil diperbarui")
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
      toast.success("Pegawai berhasil dihapus")
      fetchData()
    } catch {
      toast.error("Gagal menghapus pegawai")
    }
  }

  const handleExport = () => {
    const headers = ["NIK","Nama","Jabatan","Unit Kerja","Golongan","Status","SP","Email","Telepon"]
    const rows = filtered.map(e => [e.nik,e.nama,e.jabatan,e.bidang?.nama || "-",e.golongan,e.status,e.sp??"-",e.email,e.telepon])
    const csv = [headers,...rows].map(r=>r.join(",")).join("\n")
    const blob = new Blob(["\uFEFF"+csv], {type:"text/csv;charset=utf-8;"})
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href=url; a.download=`pegawai-${new Date().toISOString().split("T")[0]}.csv`; a.click()
    URL.revokeObjectURL(url)
    toast.success("Data berhasil diekspor")
  }

  const openAdd = () => { 
    setForm(emptyForm)
    setFotoPreview(null)
    setFotoFile(null)
    setFormErrors({})
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
    })
    setFotoPreview(emp.fotoUrl)
    setFotoFile(null)
    setFormErrors({})
    setShowEditDialog(true)
  }

  // F helper moved outside component to prevent input remount

  const formContent = (
    <div className="space-y-6">
      {/* Section 1: Foto + Nama + NIK */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-dashed border-muted-foreground/30">
            {fotoPreview ? (
              <img src={fotoPreview} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                <Camera className="h-8 w-8" />
              </div>
            )}
          </div>
          <label className="cursor-pointer">
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
            <span className="text-xs text-primary underline">Upload Foto</span>
          </label>
        </div>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          <F label="Nama Lengkap" error={formErrors.nama}>
            <Input value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} placeholder="Nama Lengkap" />
          </F>
          <F label="NIK" error={formErrors.nik}>
            <Input value={form.nik} onChange={e => setForm({...form, nik: e.target.value})} placeholder="16 Digit NIK" maxLength={16} />
          </F>
          <F label="Email" error={formErrors.email}>
            <Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@perusahaan.com" />
          </F>
          <F label="Telepon" error={formErrors.telepon}>
            <Input value={form.telepon || ""} onChange={e => setForm({...form, telepon: e.target.value})} placeholder="0812..." />
          </F>
        </div>
      </div>

      <DropdownMenuSeparator />

      {/* Section 2: Kepegawaian */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Data Kepegawaian</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <F label="Bidang / Unit Kerja">
            <Select value={form.bidangId || "NONE"} onValueChange={v => {
              const bid = v === "NONE" ? "" : v
              setForm({...form, bidangId: bid, jabatan: "", tipeJabatan: "", subBidangId: ""})
            }}>
              <SelectTrigger><SelectValue placeholder="Pilih Bidang" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">— Pilih Bidang —</SelectItem>
                {bidangData.map(b => <SelectItem key={b.id} value={b.id}>{b.nama}</SelectItem>)}
              </SelectContent>
            </Select>
          </F>
          <F label="Jabatan Struktural">
            <Select value={form.tipeJabatan || "NONE"} onValueChange={v => {
              const tipe = v === "NONE" ? "" : v
              const bidang = bidangData.find(b => b.id === form.bidangId)
              const namaB = bidang?.nama || ""
              const autoJabatan = tipe ? getJabatanLabel(tipe as TipeJabatan, namaB) : ""
              setForm({...form, tipeJabatan: tipe, jabatan: autoJabatan, subBidangId: (tipe.includes("kepala") ? "" : form.subBidangId)})
            }}>
              <SelectTrigger><SelectValue placeholder="Pilih Jabatan" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">— Pilih —</SelectItem>
                {form.bidangId && getJabatanOptions(form.bidangId, bidangData).map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </F>
          {/* Sub Bidang — hanya tampil jika bukan Kepala Bidang/Cabang */}
          {form.tipeJabatan && !form.tipeJabatan.includes("kepala") && form.bidangId && (
            <F label="Sub Bidang">
              <Select
                value={form.subBidangId || "NONE"}
                onValueChange={v => setForm({...form, subBidangId: v === "NONE" ? "" : v})}
              >
                <SelectTrigger><SelectValue placeholder="Pilih Sub Bidang" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">— Pilih Sub Bidang —</SelectItem>
                  {getSubBidangOptions(form.bidangId || "", bidangData).map(sb => (
                    <SelectItem key={sb.id} value={sb.id}>{sb.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </F>
          )}
          <F label="Tipe Kepegawaian">
            <Select value={form.tipeKepegawaian || "NONE"} onValueChange={v => setForm({...form, tipeKepegawaian: v === "NONE" ? "" : v})}>
              <SelectTrigger><SelectValue placeholder="Pilih Tipe" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">— Pilih Tipe —</SelectItem>
                {tipeKepegawaianOptions.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </F>
          <F label="Golongan">
            <Select value={form.golongan || "NONE"} onValueChange={v => setForm({...form, golongan: v === "NONE" ? "" : v})}>
              <SelectTrigger><SelectValue placeholder="Pilih Golongan" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">— Pilih —</SelectItem>
                {golonganOptions.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </F>
          <F label="Status Pegawai">
            <Select value={form.status || "AKTIF"} onValueChange={v => setForm({...form, status: v})}>
              <SelectTrigger><SelectValue placeholder="Pilih Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="AKTIF">Aktif</SelectItem>
                <SelectItem value="CUTI">Cuti</SelectItem>
                <SelectItem value="NON_AKTIF">Non-Aktif</SelectItem>
                <SelectItem value="PENSIUN">Pensiun</SelectItem>
              </SelectContent>
            </Select>
          </F>
          <F label="Tanggal Masuk">
            <Input type="date" value={form.tanggalMasuk} onChange={e => setForm({...form, tanggalMasuk: e.target.value})} />
          </F>
          <F label="SP (Jika Ada)">
            <Select 
              value={form.sp ?? "NONE"} 
              onValueChange={v => setForm({...form, sp: v === "NONE" ? null : v})}
            >
              <SelectTrigger><SelectValue placeholder="Tidak Ada SP" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Tidak Ada</SelectItem>
                <SelectItem value="SP1">SP 1</SelectItem>
                <SelectItem value="SP2">SP 2</SelectItem>
                <SelectItem value="SP3">SP 3</SelectItem>
              </SelectContent>
            </Select>
          </F>
        </div>
        {(form.tipeJabatan as TipeJabatan) && form.bidangId && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-emerald-600" />
            <span className="text-xs text-emerald-800 font-medium">
              Atasan Otomatis: {getAtasanOtomatis(form.tipeJabatan as TipeJabatan, form.bidangId || "", bidangData)}
            </span>
          </div>
        )}
      </section>

      <DropdownMenuSeparator />

      {/* Section 3: Data Pribadi */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Data Pribadi</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <F label="Tempat Lahir">
            <Input value={form.tempatLahir || ""} onChange={e => setForm({...form, tempatLahir: e.target.value})} placeholder="Kota Kelahiran" />
          </F>
          <F label="Tanggal Lahir">
            <Input type="date" value={form.tanggalLahir || ""} onChange={e => setForm({...form, tanggalLahir: e.target.value})} />
          </F>
          <F label="Jenis Kelamin">
            <Select value={form.jenisKelamin || ""} onValueChange={v => setForm({...form, jenisKelamin: v})}>
              <SelectTrigger><SelectValue placeholder="Pilih JKL" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="L">Laki-laki</SelectItem>
                <SelectItem value="P">Perempuan</SelectItem>
              </SelectContent>
            </Select>
          </F>
          <F label="Agama">
            <Select value={form.agama || ""} onValueChange={v => setForm({...form, agama: v})}>
              <SelectTrigger><SelectValue placeholder="Pilih Agama" /></SelectTrigger>
              <SelectContent>
                {["ISLAM","KRISTEN","KATOLIK","HINDU","BUDDHA","KONGHUCU"].map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </F>
          <F label="Status Nikah">
            <Select value={form.statusNikah || ""} onValueChange={v => setForm({...form, statusNikah: v})}>
              <SelectTrigger><SelectValue placeholder="Pilih Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BELUM_MENIKAH">Belum Menikah</SelectItem>
                <SelectItem value="MENIKAH">Menikah</SelectItem>
                <SelectItem value="CERAI">Cerai</SelectItem>
              </SelectContent>
            </Select>
          </F>
        </div>
        <div className="mt-4">
          <F label="Alamat Domisili">
            <Textarea value={form.alamat || ""} onChange={e => setForm({...form, alamat: e.target.value})} placeholder="Alamat lengkap tempat tinggal saat ini" />
          </F>
        </div>
      </section>

      <DropdownMenuSeparator />

      {/* Section 4: Pendidikan */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pendidikan Terakhir</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <F label="Tingkat Pendidikan">
            <Select value={form.pendidikanTerakhir || "NONE"} onValueChange={v => setForm({...form, pendidikanTerakhir: v === "NONE" ? "" : v})}>
              <SelectTrigger><SelectValue placeholder="Pilih Jenjang" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">— Pilih —</SelectItem>
                {["SD","SMP","SMA","D1","D2","D3","D4","S1","S2","S3"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </F>
          <F label="Jurusan">
            <Input value={form.jurusan || ""} onChange={e => setForm({...form, jurusan: e.target.value})} placeholder="Nama Jurusan" />
          </F>
          <F label="Institusi / Sekolah">
            <Input value={form.institusi || ""} onChange={e => setForm({...form, institusi: e.target.value})} placeholder="Nama Kampus/Sekolah" />
          </F>
          <F label="Tahun Lulus">
            <Input value={form.tahunLulus || ""} onChange={e => setForm({...form, tahunLulus: e.target.value})} placeholder="2020" maxLength={4} />
          </F>
        </div>
      </section>

      <DropdownMenuSeparator />

      {/* Section 5: Keuangan & Dokumen */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Keuangan & Dokumen</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <F label="Bank">
            <Select value={form.bank || "NONE"} onValueChange={v => setForm({...form, bank: v === "NONE" ? "" : v})}>
              <SelectTrigger><SelectValue placeholder="Pilih Bank" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">— Pilih Bank —</SelectItem>
                {["BCA", "Mandiri", "BNI", "BRI", "BSI", "BPD NTB Syariah", "CIMB Niaga", "BTN", "Lainnya"].map(b => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </F>
          <F label="No. Rekening">
            <Input value={form.noRekening || ""} onChange={e => setForm({...form, noRekening: e.target.value})} placeholder="000111222" />
          </F>
          <F label="NPWP">
            <Input value={form.npwp || ""} onChange={e => setForm({...form, npwp: e.target.value})} placeholder="00.000.000..." />
          </F>
          <F label="BPJS Kesehatan">
            <Input value={form.bpjsKesehatan || ""} onChange={e => setForm({...form, bpjsKesehatan: e.target.value})} placeholder="No Kartu BPJS" />
          </F>
          <F label="BPJS Ketenagakerjaan">
            <Input value={form.bpjsKetenagakerjaan || ""} onChange={e => setForm({...form, bpjsKetenagakerjaan: e.target.value})} placeholder="No KPJ" />
          </F>
        </div>
      </section>
    </div>
  )


  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Kepegawaian","Data Pegawai"]}/>
        <main className="flex-1 overflow-auto p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><h1 className="text-2xl font-bold">Data Pegawai</h1><p className="text-sm text-muted-foreground">Kelola seluruh data SDM PDAM Tirta Ardhia Rinjani</p></div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport} className="gap-2"><Download className="h-4 w-4"/>Export CSV</Button>
              <Button size="sm" onClick={openAdd} className="gap-2"><UserPlus className="h-4 w-4"/>Tambah Pegawai</Button>
            </div>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total Pegawai", value: stats?.total || 0, icon: Users, bg: "bg-primary/10", color: "text-primary" },
              { label: "Aktif", value: stats?.aktif || 0, icon: UserCheck, bg: "bg-emerald-100", color: "text-emerald-600" },
              { label: "Sedang Cuti", value: stats?.cuti || 0, icon: Clock, bg: "bg-amber-100", color: "text-amber-600" },
              { label: "Non-Aktif/Pensiun", value: stats?.nonAktif || 0, icon: UserX, bg: "bg-red-100", color: "text-red-600" }
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

          <Card className="card-premium mb-4"><CardContent className="p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input placeholder="Cari nama, NIK, atau jabatan..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="pl-10"/></div>
              <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[150px]"><SelectValue placeholder="Status"/></SelectTrigger><SelectContent><SelectItem value="all">Semua Status</SelectItem><SelectItem value="AKTIF">Aktif</SelectItem><SelectItem value="CUTI">Cuti</SelectItem><SelectItem value="NON_AKTIF">Non-Aktif</SelectItem><SelectItem value="PENSIUN">Pensiun</SelectItem></SelectContent></Select>
              <Select value={unitFilter} onValueChange={setUnitFilter}><SelectTrigger className="w-[180px]"><SelectValue placeholder="Unit Kerja"/></SelectTrigger><SelectContent><SelectItem value="all">Semua Unit</SelectItem>{units.map(u=><SelectItem key={u.id} value={u.id}>{u.nama}</SelectItem>)}</SelectContent></Select>
            </div>
          </CardContent></Card>

          <Card className="card-premium"><CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[260px]">Pegawai</TableHead>
                    <TableHead>NIK</TableHead>
                    <TableHead>Jabatan</TableHead>
                    <TableHead>Unit Kerja</TableHead>
                    <TableHead>Golongan</TableHead>
                    <TableHead>Masa Kerja</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Kontak</TableHead>
                    <TableHead className="w-[80px] text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {paginated.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="py-12 text-center"><div className="flex flex-col items-center gap-2"><Search className="h-8 w-8 text-muted-foreground/50"/><p className="font-medium text-muted-foreground">Tidak ada pegawai ditemukan</p></div></TableCell></TableRow>
                  ) : paginated.map(emp=>(
                    <TableRow key={emp.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            {emp.fotoUrl ? (
                              <AvatarImage src={emp.fotoUrl} className="object-cover" />
                            ) : null}
                            <AvatarFallback className="bg-primary/10 text-sm text-primary">
                              {(emp.nama || "P").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <Link href={`/pegawai/${emp.id}`} className="font-medium hover:text-primary hover:underline">{emp.nama}</Link>
                              {emp.sp && spConfig[emp.sp as keyof typeof spConfig] && (
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${spConfig[emp.sp as keyof typeof spConfig].className}`}>
                                  {spConfig[emp.sp as keyof typeof spConfig].label}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{emp.jenisKelamin==="L"?"Laki-laki":"Perempuan"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{emp.nik}</TableCell>
                      <TableCell className="text-sm">{emp.jabatan}</TableCell>
                      <TableCell className="text-sm">{emp.bidang?.nama}</TableCell>
                      <TableCell><Badge variant="outline" className="font-mono text-xs">{emp.golongan}</Badge></TableCell>
                      <TableCell className="text-sm">{emp.masaKerja || "-"}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={statusConfig[(emp.status || "aktif").toLowerCase() as keyof typeof statusConfig]?.className}>
                          {emp.status || "AKTIF"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <a href={`mailto:${emp.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"><Mail className="h-3 w-3"/><span className="max-w-[120px] truncate">{emp.email}</span></a>
                          <a href={`tel:${emp.telepon}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"><Phone className="h-3 w-3"/>{emp.telepon}</a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild><Link href={`/pegawai/${emp.id}`}><Eye className="mr-2 h-4 w-4"/>Lihat Detail</Link></DropdownMenuItem>
                            <DropdownMenuItem onClick={()=>openEdit(emp)}><Edit className="mr-2 h-4 w-4"/>Edit Data</DropdownMenuItem>
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem className="text-destructive" onClick={()=>{setDeletingEmployee(emp);setShowDeleteDialog(true)}}><Trash2 className="mr-2 h-4 w-4"/>Hapus</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between border-t p-4">
              <p className="text-sm text-muted-foreground">Menampilkan {filtered.length===0?0:(currentPage-1)*ITEMS_PER_PAGE+1}–{Math.min(currentPage*ITEMS_PER_PAGE,filtered.length)} dari {filtered.length} pegawai</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={currentPage===1} onClick={()=>setCurrentPage(p=>p-1)}><ChevronLeft className="h-4 w-4"/>Sebelumnya</Button>
                <div className="flex gap-1">{Array.from({length:Math.min(totalPages,5)},(_,i)=>i+1).map(p=><Button key={p} variant={currentPage===p?"default":"outline"} size="sm" className="h-8 w-8 p-0" onClick={()=>setCurrentPage(p)}>{p}</Button>)}</div>
                <Button variant="outline" size="sm" disabled={currentPage===totalPages||totalPages===0} onClick={()=>setCurrentPage(p=>p+1)}>Selanjutnya<ChevronRight className="h-4 w-4"/></Button>
              </div>
            </div>
          </CardContent></Card>
        </main>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Tambah Pegawai Baru</DialogTitle><DialogDescription>Lengkapi semua data pegawai</DialogDescription></DialogHeader>
          <div className="py-4">{formContent}</div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setShowAddDialog(false)}>Batal</Button>
            <Button onClick={handleCreate} disabled={isLoading}>{isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Menyimpan...</> : "Tambah Pegawai"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={v=>{setShowEditDialog(v);if(!v){setEditingEmployee(null)}}}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Data — {editingEmployee?.nama}</DialogTitle><DialogDescription>Perbarui data pegawai</DialogDescription></DialogHeader>
          <div className="py-4">{formContent}</div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>{setShowEditDialog(false);setEditingEmployee(null)}}>Batal</Button>
            <Button onClick={handleUpdate} disabled={isLoading}>{isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Menyimpan...</> : "Simpan Perubahan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Hapus */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive"/>Hapus Pegawai</AlertDialogTitle>
            <AlertDialogDescription>Yakin ingin menghapus <strong>{deletingEmployee?.nama}</strong>? Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingEmployee && handleDelete(deletingEmployee.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{isLoading?<><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Menghapus...</>:"Ya, Hapus"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
