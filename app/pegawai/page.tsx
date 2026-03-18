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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  Loader2, AlertTriangle,
} from "lucide-react"
import { bidangList, getJabatanOptions, getAtasanOtomatis, getJabatanLabel, type TipeJabatan } from "@/lib/data/bidang-store"

// ============ TIPE DATA ============
interface Employee {
  id: string
  nik: string
  nama: string
  initials: string
  jabatan: string
  unitKerja: string
  golongan: string
  pangkat: string
  status: "aktif" | "cuti" | "non-aktif" | "pensiun"
  sp: "SP1" | "SP2" | "SP3" | null
  masaKerja: string
  email: string
  telepon: string
  jenisKelamin: "L" | "P"
  tanggalMasuk: string
  tempatLahir: string
  tanggalLahir: string
  agama: string
  statusNikah: string
  alamat: string
  noKTP: string
  npwp: string
  bank: string
  noRekening: string
  bpjsKes: string
  bpjsTK: string
  pendidikan: string
}

// ============ DATA DUMMY LENGKAP ============
const initialEmployees: Employee[] = [
  { id:"1", nik:"3201150115850001", nama:"Ahmad Rizki Pratama", initials:"AR", jabatan:"Kepala Bagian IT", unitKerja:"IT & Sistem", golongan:"C/III", pangkat:"Penata", status:"aktif", sp:null, masaKerja:"16 tahun", email:"ahmad.rizki@pdamtiara.co.id", telepon:"081234567890", jenisKelamin:"L", tanggalMasuk:"15 Jan 2010", tempatLahir:"Bandung", tanggalLahir:"15 Jan 1985", agama:"Islam", statusNikah:"Menikah", alamat:"Jl. Merdeka No. 123, Jakarta Selatan", noKTP:"3201150115850001", npwp:"12.345.678.9-012.345", bank:"Bank Mandiri", noRekening:"1234567890123", bpjsKes:"0001234567890", bpjsTK:"0001234567891", pendidikan:"S2 - Teknik Informatika" },
  { id:"2", nik:"3201032215900001", nama:"Siti Nurhaliza", initials:"SN", jabatan:"Staff Keuangan Senior", unitKerja:"Keuangan", golongan:"B/III", pangkat:"Penata Muda Tk.I", status:"aktif", sp:null, masaKerja:"11 tahun", email:"siti.nurhaliza@pdamtiara.co.id", telepon:"081234567891", jenisKelamin:"P", tanggalMasuk:"22 Jan 2015", tempatLahir:"Jakarta", tanggalLahir:"22 Mar 1990", agama:"Islam", statusNikah:"Menikah", alamat:"Jl. Sudirman No. 45, Jakarta Pusat", noKTP:"3201032215900001", npwp:"12.345.678.9-012.346", bank:"Bank BNI", noRekening:"9876543210", bpjsKes:"0001234567891", bpjsTK:"0001234567892", pendidikan:"S1 - Akuntansi" },
  { id:"3", nik:"3201050512870001", nama:"Budi Santoso", initials:"BS", jabatan:"Supervisor Distribusi", unitKerja:"Distribusi", golongan:"D/III", pangkat:"Penata Tk.I", status:"cuti", sp:"SP1", masaKerja:"18 tahun", email:"budi.santoso@pdamtiara.co.id", telepon:"081234567892", jenisKelamin:"L", tanggalMasuk:"05 Jan 2008", tempatLahir:"Surabaya", tanggalLahir:"12 Mei 1987", agama:"Islam", statusNikah:"Menikah", alamat:"Jl. Gatot Subroto No. 78, Jakarta Selatan", noKTP:"3201050512870001", npwp:"12.345.678.9-012.347", bank:"Bank BRI", noRekening:"1122334455", bpjsKes:"0001234567892", bpjsTK:"0001234567893", pendidikan:"S1 - Teknik Sipil" },
  { id:"4", nik:"3201051519920001", nama:"Dewi Lestari", initials:"DL", jabatan:"Customer Service", unitKerja:"Pelayanan", golongan:"A/III", pangkat:"Penata Muda", status:"aktif", sp:null, masaKerja:"8 tahun", email:"dewi.lestari@pdamtiara.co.id", telepon:"081234567893", jenisKelamin:"P", tanggalMasuk:"15 Jan 2018", tempatLahir:"Bandung", tanggalLahir:"15 Mei 1992", agama:"Islam", statusNikah:"Belum Menikah", alamat:"Jl. Thamrin No. 22, Jakarta Pusat", noKTP:"3201051519920001", npwp:"12.345.678.9-012.348", bank:"Bank Mandiri", noRekening:"5566778899", bpjsKes:"0001234567893", bpjsTK:"0001234567894", pendidikan:"D3 - Manajemen Pemasaran" },
  { id:"5", nik:"3201081519800001", nama:"Eko Prasetyo", initials:"EP", jabatan:"Operator IPA", unitKerja:"Produksi", golongan:"D/II", pangkat:"Pengatur Tk.I", status:"aktif", sp:null, masaKerja:"21 tahun", email:"eko.prasetyo@pdamtiara.co.id", telepon:"081234567894", jenisKelamin:"L", tanggalMasuk:"15 Jan 2005", tempatLahir:"Yogyakarta", tanggalLahir:"15 Agu 1980", agama:"Islam", statusNikah:"Menikah", alamat:"Jl. Kuningan No. 55, Jakarta Selatan", noKTP:"3201081519800001", npwp:"12.345.678.9-012.349", bank:"Bank BRI", noRekening:"9988776655", bpjsKes:"0001234567894", bpjsTK:"0001234567895", pendidikan:"SMA - IPA" },
  { id:"6", nik:"3201010101930002", nama:"Fitri Handayani", initials:"FH", jabatan:"Staff HRD", unitKerja:"SDM & Umum", golongan:"A/III", pangkat:"Penata Muda", status:"aktif", sp:null, masaKerja:"6 tahun", email:"fitri.handayani@pdamtiara.co.id", telepon:"081234567895", jenisKelamin:"P", tanggalMasuk:"20 Jan 2020", tempatLahir:"Semarang", tanggalLahir:"20 Agu 1993", agama:"Islam", statusNikah:"Belum Menikah", alamat:"Jl. Senayan No. 10, Jakarta Selatan", noKTP:"3201010101930002", npwp:"12.345.678.9-012.350", bank:"Bank BNI", noRekening:"1133557799", bpjsKes:"0001234567895", bpjsTK:"0001234567896", pendidikan:"S1 - Psikologi" },
  { id:"7", nik:"3201100619750003", nama:"Ir. Gunawan Wibowo", initials:"GW", jabatan:"Manager Produksi", unitKerja:"Produksi", golongan:"A/IV", pangkat:"Pembina", status:"aktif", sp:"SP2", masaKerja:"28 tahun", email:"gunawan.wibowo@pdamtiara.co.id", telepon:"081234567896", jenisKelamin:"L", tanggalMasuk:"10 Jun 1998", tempatLahir:"Jakarta", tanggalLahir:"10 Jun 1975", agama:"Kristen", statusNikah:"Menikah", alamat:"Jl. Kemang Raya No. 99, Jakarta Selatan", noKTP:"3201100619750003", npwp:"12.345.678.9-012.351", bank:"Bank Mandiri", noRekening:"2244668800", bpjsKes:"0001234567896", bpjsTK:"0001234567897", pendidikan:"S1 - Teknik Kimia" },
  { id:"8", nik:"3201041519890001", nama:"Hendra Kusuma", initials:"HK", jabatan:"Teknisi Distribusi", unitKerja:"Distribusi", golongan:"C/II", pangkat:"Pengatur", status:"aktif", sp:null, masaKerja:"14 tahun", email:"hendra.kusuma@pdamtiara.co.id", telepon:"081234567897", jenisKelamin:"L", tanggalMasuk:"15 Apr 2012", tempatLahir:"Bekasi", tanggalLahir:"15 Apr 1989", agama:"Islam", statusNikah:"Menikah", alamat:"Jl. Bekasi Timur No. 33, Bekasi", noKTP:"3201041519890001", npwp:"12.345.678.9-012.352", bank:"Bank BRI", noRekening:"3355779911", bpjsKes:"0001234567897", bpjsTK:"0001234567898", pendidikan:"D3 - Teknik Mesin" },
  { id:"9", nik:"3201010101650003", nama:"Ir. Joko Wibowo", initials:"JW", jabatan:"Direktur Utama", unitKerja:"Direksi", golongan:"E/IV", pangkat:"Pembina Utama", status:"aktif", sp:null, masaKerja:"36 tahun", email:"joko.wibowo@pdamtiara.co.id", telepon:"081234567898", jenisKelamin:"L", tanggalMasuk:"20 Jan 1990", tempatLahir:"Solo", tanggalLahir:"20 Jan 1965", agama:"Islam", statusNikah:"Menikah", alamat:"Jl. Menteng Raya No. 50, Jakarta Pusat", noKTP:"3201010101650003", npwp:"12.345.678.9-012.353", bank:"Bank Mandiri", noRekening:"4466880022", bpjsKes:"0001234567898", bpjsTK:"0001234567899", pendidikan:"S2 - Manajemen" },
  { id:"10", nik:"3201010101600001", nama:"Karno Sutrisno", initials:"KS", jabatan:"Staff Senior", unitKerja:"Pelayanan", golongan:"D/III", pangkat:"Penata Tk.I", status:"pensiun", sp:"SP3", masaKerja:"35 tahun", email:"karno.sutrisno@pdamtiara.co.id", telepon:"081234567899", jenisKelamin:"L", tanggalMasuk:"01 Jan 1985", tempatLahir:"Purwokerto", tanggalLahir:"01 Jan 1960", agama:"Islam", statusNikah:"Menikah", alamat:"Jl. Cempaka Putih No. 77, Jakarta Pusat", noKTP:"3201010101600001", npwp:"12.345.678.9-012.354", bank:"Bank BNI", noRekening:"5577991133", bpjsKes:"0001234567899", bpjsTK:"0001234567900", pendidikan:"S1 - Administrasi Negara" },
  { id:"11", nik:"3201011519850001", nama:"Lina Marlina", initials:"LM", jabatan:"Kepala Bagian Keuangan", unitKerja:"Keuangan", golongan:"D/III", pangkat:"Penata Tk.I", status:"aktif", sp:null, masaKerja:"17 tahun", email:"lina.marlina@pdamtiara.co.id", telepon:"081234567900", jenisKelamin:"P", tanggalMasuk:"10 Mar 2009", tempatLahir:"Cirebon", tanggalLahir:"10 Mar 1985", agama:"Islam", statusNikah:"Menikah", alamat:"Jl. Rasuna Said No. 15, Jakarta Selatan", noKTP:"3201011519850001", npwp:"12.345.678.9-012.355", bank:"Bank Mandiri", noRekening:"6688002244", bpjsKes:"0001234567900", bpjsTK:"0001234567901", pendidikan:"S1 - Akuntansi" },
  { id:"12", nik:"3201061519910001", nama:"Made Suardana", initials:"MS", jabatan:"Teknisi IPA", unitKerja:"Produksi", golongan:"B/II", pangkat:"Pengatur Muda Tk.I", status:"aktif", sp:null, masaKerja:"10 tahun", email:"made.suardana@pdamtiara.co.id", telepon:"081234567901", jenisKelamin:"L", tanggalMasuk:"15 Jun 2016", tempatLahir:"Denpasar", tanggalLahir:"15 Jun 1991", agama:"Hindu", statusNikah:"Menikah", alamat:"Jl. Kuningan Timur No. 20, Jakarta Selatan", noKTP:"3201061519910001", npwp:"12.345.678.9-012.356", bank:"Bank BNI", noRekening:"7799113355", bpjsKes:"0001234567901", bpjsTK:"0001234567902", pendidikan:"D3 - Teknik Kimia" },
]

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

const golonganOptions = ["A/I","B/I","C/I","D/I","A/II","B/II","C/II","D/II","A/III","B/III","C/III","D/III","A/IV","B/IV","C/IV","D/IV","E/IV"]
const ITEMS_PER_PAGE = 10

export default function EmployeeListPage() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [unitFilter, setUnitFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const emptyForm = { nik:"", nama:"", jabatan:"", unitKerja:"", golongan:"", pangkat:"", status:"aktif" as Employee["status"], sp:null as Employee["sp"], masaKerja:"", email:"", telepon:"", jenisKelamin:"L" as Employee["jenisKelamin"], tanggalMasuk:"", tempatLahir:"", tanggalLahir:"", agama:"Islam", statusNikah:"Belum Menikah", alamat:"", noKTP:"", npwp:"", bank:"", noRekening:"", bpjsKes:"", bpjsTK:"", pendidikan:"" }
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState<Record<string,string>>({})

  useEffect(() => { setCurrentPage(1) }, [searchQuery, statusFilter, unitFilter])

  const filtered = employees.filter(emp => {
    const matchSearch = emp.nama.toLowerCase().includes(searchQuery.toLowerCase()) || emp.nik.includes(searchQuery) || emp.jabatan.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = statusFilter === "all" || emp.status === statusFilter
    const matchUnit = unitFilter === "all" || emp.unitKerja === unitFilter
    return matchSearch && matchStatus && matchUnit
  })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((currentPage-1)*ITEMS_PER_PAGE, currentPage*ITEMS_PER_PAGE)
  const units = [...new Set(employees.map(e => e.unitKerja))].sort()

  const validate = () => {
    const errors: Record<string,string> = {}
    if (!form.nama.trim()) errors.nama = "Nama wajib diisi"
    if (!form.nik || form.nik.length !== 16) errors.nik = "NIK harus 16 digit"
    if (!form.jabatan.trim()) errors.jabatan = "Jabatan wajib diisi"
    if (!form.unitKerja) errors.unitKerja = "Unit kerja wajib dipilih"
    if (!form.golongan) errors.golongan = "Golongan wajib dipilih"
    if (!form.email.includes("@")) errors.email = "Format email tidak valid"
    if (!form.telepon || form.telepon.length < 10) errors.telepon = "Nomor telepon tidak valid"
    const dup = employees.find(e => e.nik === form.nik && e.id !== editingEmployee?.id)
    if (dup) errors.nik = "NIK sudah terdaftar"
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAdd = async () => {
    if (!validate()) return
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 700))
    const initials = form.nama.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()
    setEmployees(prev => [{ id:String(Date.now()), initials, ...form }, ...prev])
    setShowAddDialog(false)
    setIsLoading(false)
    toast.success(`Pegawai ${form.nama} berhasil ditambahkan`)
  }

  const handleEdit = async () => {
    if (!validate()) return
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 700))
    const initials = form.nama.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()
    setEmployees(prev => prev.map(e => e.id === editingEmployee!.id ? {...e, ...form, initials} : e))
    setShowEditDialog(false); setEditingEmployee(null); setIsLoading(false)
    toast.success(`Data ${form.nama} berhasil diperbarui`)
  }

  const handleDelete = async () => {
    if (!deletingEmployee) return
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 500))
    setEmployees(prev => prev.filter(e => e.id !== deletingEmployee.id))
    setShowDeleteDialog(false); setDeletingEmployee(null); setIsLoading(false)
    toast.success(`Pegawai ${deletingEmployee.nama} berhasil dihapus`)
  }

  const handleExport = () => {
    const headers = ["NIK","Nama","Jabatan","Unit Kerja","Golongan","Status","SP","Email","Telepon","Masa Kerja"]
    const rows = filtered.map(e => [e.nik,e.nama,e.jabatan,e.unitKerja,e.golongan,e.status,e.sp??"-",e.email,e.telepon,e.masaKerja])
    const csv = [headers,...rows].map(r=>r.join(",")).join("\n")
    const blob = new Blob(["\uFEFF"+csv], {type:"text/csv;charset=utf-8;"})
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href=url; a.download=`pegawai-${new Date().toISOString().split("T")[0]}.csv`; a.click()
    URL.revokeObjectURL(url)
    toast.success("Data berhasil diekspor")
  }

  const openAdd = () => { setForm(emptyForm); setFormErrors({}); setShowAddDialog(true) }
  const openEdit = (emp: Employee) => {
    setEditingEmployee(emp)
    setForm({nik:emp.nik,nama:emp.nama,jabatan:emp.jabatan,unitKerja:emp.unitKerja,golongan:emp.golongan,pangkat:emp.pangkat,status:emp.status,sp:emp.sp,masaKerja:emp.masaKerja,email:emp.email,telepon:emp.telepon,jenisKelamin:emp.jenisKelamin,tanggalMasuk:emp.tanggalMasuk,tempatLahir:emp.tempatLahir,tanggalLahir:emp.tanggalLahir,agama:emp.agama,statusNikah:emp.statusNikah,alamat:emp.alamat,noKTP:"",npwp:emp.npwp,bank:emp.bank,noRekening:emp.noRekening,bpjsKes:emp.bpjsKes,bpjsTK:emp.bpjsTK,pendidikan:emp.pendidikan})
    setFormErrors({}); setShowEditDialog(true)
  }

  const F = ({label, error, children}: {label:string; error?:string; children:React.ReactNode}) => (
    <div><Label>{label}</Label><div className="mt-1">{children}</div>{error && <p className="mt-1 text-xs text-destructive">{error}</p>}</div>
  )

  const FormBody = () => (
    <div className="space-y-6">
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Data Kepegawaian</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><F label="Nama Lengkap" error={formErrors.nama}><Input value={form.nama} onChange={e=>setForm({...form,nama:e.target.value})} placeholder="Nama lengkap"/></F></div>
          <F label="NIK (16 digit)" error={formErrors.nik}><Input value={form.nik} onChange={e=>setForm({...form,nik:e.target.value})} placeholder="16 digit NIK" maxLength={16} className="font-mono"/></F>
          <F label="Unit Kerja / Bidang" error={formErrors.unitKerja}>
            <Select 
              value={bidangList.find(b => b.nama === form.unitKerja)?.id ?? ""} 
              onValueChange={v => {
                const b = bidangList.find(x => x.id === v)
                setForm({...form, unitKerja: b?.nama ?? "", jabatan: ""})
              }}
            >
              <SelectTrigger><SelectValue placeholder="Pilih unit"/></SelectTrigger>
              <SelectContent>
                {bidangList.filter(b => b.aktif).map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.nama}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </F>
          {form.unitKerja && (
            <F label="Jabatan" error={formErrors.jabatan}>
              <Select
                value={form.jabatan}
                onValueChange={v => {
                  const bid = bidangList.find(b => b.nama === form.unitKerja)
                  if (!bid) return
                  const tipe = v as TipeJabatan
                  setForm({...form, jabatan: getJabatanLabel(tipe, bid.nama)})
                }}
              >
                <SelectTrigger><SelectValue placeholder="Pilih jabatan"/></SelectTrigger>
                <SelectContent>
                  {getJabatanOptions(
                    bidangList.find(b => b.nama === form.unitKerja)?.id ?? ""
                  ).map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </F>
          )}
          <F label="Golongan" error={formErrors.golongan}>
            <Select value={form.golongan} onValueChange={v=>setForm({...form,golongan:v})}>
              <SelectTrigger><SelectValue placeholder="Pilih golongan"/></SelectTrigger>
              <SelectContent>{golonganOptions.map(g=><SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          </F>
          <F label="Pangkat"><Input value={form.pangkat} onChange={e=>setForm({...form,pangkat:e.target.value})} placeholder="Nama pangkat"/></F>
          <F label="Status">
            <Select value={form.status} onValueChange={v=>setForm({...form,status:v as any})}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent><SelectItem value="aktif">Aktif</SelectItem><SelectItem value="cuti">Cuti</SelectItem><SelectItem value="non-aktif">Non-Aktif</SelectItem><SelectItem value="pensiun">Pensiun</SelectItem></SelectContent>
            </Select>
          </F>
          <F label="Surat Peringatan (SP)">
            <Select value={form.sp??"none"} onValueChange={v=>setForm({...form,sp:v==="none"?null:v as any})}>
              <SelectTrigger><SelectValue placeholder="Tidak Ada SP"/></SelectTrigger>
              <SelectContent><SelectItem value="none">Tidak Ada SP</SelectItem><SelectItem value="SP1">SP-1 (Peringatan Pertama)</SelectItem><SelectItem value="SP2">SP-2 (Peringatan Kedua)</SelectItem><SelectItem value="SP3">SP-3 (Peringatan Ketiga)</SelectItem></SelectContent>
            </Select>
          </F>
          <F label="Tanggal Masuk"><Input value={form.tanggalMasuk} onChange={e=>setForm({...form,tanggalMasuk:e.target.value})} placeholder="01 Jan 2020"/></F>
        </div>
      </section>
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Data Pribadi</p>
        <div className="grid grid-cols-2 gap-4">
          <F label="Tempat Lahir"><Input value={form.tempatLahir} onChange={e=>setForm({...form,tempatLahir:e.target.value})} placeholder="Kota lahir"/></F>
          <F label="Tanggal Lahir"><Input value={form.tanggalLahir} onChange={e=>setForm({...form,tanggalLahir:e.target.value})} placeholder="01 Jan 1990"/></F>
          <F label="Jenis Kelamin">
            <Select value={form.jenisKelamin} onValueChange={v=>setForm({...form,jenisKelamin:v as any})}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent><SelectItem value="L">Laki-laki</SelectItem><SelectItem value="P">Perempuan</SelectItem></SelectContent>
            </Select>
          </F>
          <F label="Agama">
            <Select value={form.agama} onValueChange={v=>setForm({...form,agama:v})}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>{["Islam","Kristen","Katolik","Hindu","Buddha","Konghucu"].map(a=><SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
            </Select>
          </F>
          <F label="Status Pernikahan">
            <Select value={form.statusNikah} onValueChange={v=>setForm({...form,statusNikah:v})}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent><SelectItem value="Belum Menikah">Belum Menikah</SelectItem><SelectItem value="Menikah">Menikah</SelectItem><SelectItem value="Cerai">Cerai</SelectItem></SelectContent>
            </Select>
          </F>
          <F label="Pendidikan Terakhir"><Input value={form.pendidikan} onChange={e=>setForm({...form,pendidikan:e.target.value})} placeholder="S1 - Teknik Informatika"/></F>
          <div className="col-span-2"><F label="Alamat Lengkap"><Textarea value={form.alamat} onChange={e=>setForm({...form,alamat:e.target.value})} placeholder="Alamat lengkap" rows={2}/></F></div>
        </div>
      </section>
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kontak & Keuangan</p>
        <div className="grid grid-cols-2 gap-4">
          <F label="Email" error={formErrors.email}><Input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="email@pdamtiara.co.id"/></F>
          <F label="Telepon" error={formErrors.telepon}><Input value={form.telepon} onChange={e=>setForm({...form,telepon:e.target.value})} placeholder="08xxxxxxxxxx"/></F>
          <F label="NPWP"><Input value={form.npwp} onChange={e=>setForm({...form,npwp:e.target.value})} placeholder="xx.xxx.xxx.x-xxx.xxx" className="font-mono"/></F>
          <F label="Bank">
            <Select value={form.bank} onValueChange={v=>setForm({...form,bank:v})}>
              <SelectTrigger><SelectValue placeholder="Pilih bank"/></SelectTrigger>
              <SelectContent>{["Bank Mandiri","Bank BNI","Bank BRI","Bank BCA","Bank BTN","Bank Syariah Indonesia"].map(b=><SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
            </Select>
          </F>
          <F label="No. Rekening"><Input value={form.noRekening} onChange={e=>setForm({...form,noRekening:e.target.value})} placeholder="No rekening" className="font-mono"/></F>
          <F label="BPJS Kesehatan"><Input value={form.bpjsKes} onChange={e=>setForm({...form,bpjsKes:e.target.value})} placeholder="No. BPJS Kes" className="font-mono"/></F>
          <F label="BPJS Ketenagakerjaan"><Input value={form.bpjsTK} onChange={e=>setForm({...form,bpjsTK:e.target.value})} placeholder="No. BPJS TK" className="font-mono"/></F>
        </div>
      </section>
    </div>
  )

  const stats = { total:employees.length, aktif:employees.filter(e=>e.status==="aktif").length, cuti:employees.filter(e=>e.status==="cuti").length, nonAktif:employees.filter(e=>e.status==="non-aktif"||e.status==="pensiun").length }

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
            {[{label:"Total Pegawai",value:stats.total,icon:Users,bg:"bg-primary/10",color:"text-primary"},{label:"Aktif",value:stats.aktif,icon:UserCheck,bg:"bg-emerald-100",color:"text-emerald-600"},{label:"Sedang Cuti",value:stats.cuti,icon:Clock,bg:"bg-amber-100",color:"text-amber-600"},{label:"Non-Aktif/Pensiun",value:stats.nonAktif,icon:UserX,bg:"bg-red-100",color:"text-red-600"}].map(s=>(
              <Card key={s.label} className="card-premium"><CardContent className="flex items-center gap-4 p-4"><div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.bg}`}><s.icon className={`h-6 w-6 ${s.color}`}/></div><div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div></CardContent></Card>
            ))}
          </div>

          <Card className="card-premium mb-4"><CardContent className="p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input placeholder="Cari nama, NIK, atau jabatan..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="pl-10"/></div>
              <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[150px]"><SelectValue placeholder="Status"/></SelectTrigger><SelectContent><SelectItem value="all">Semua Status</SelectItem><SelectItem value="aktif">Aktif</SelectItem><SelectItem value="cuti">Cuti</SelectItem><SelectItem value="non-aktif">Non-Aktif</SelectItem><SelectItem value="pensiun">Pensiun</SelectItem></SelectContent></Select>
              <Select value={unitFilter} onValueChange={setUnitFilter}><SelectTrigger className="w-[180px]"><SelectValue placeholder="Unit Kerja"/></SelectTrigger><SelectContent><SelectItem value="all">Semua Unit</SelectItem>{units.map(u=><SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select>
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
                          <Avatar className="h-10 w-10"><AvatarFallback className="bg-primary/10 text-sm text-primary">{emp.initials}</AvatarFallback></Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <Link href={`/pegawai/${emp.id}`} className="font-medium hover:text-primary hover:underline">{emp.nama}</Link>
                              {emp.sp && <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${spConfig[emp.sp].className}`}>{spConfig[emp.sp].label}</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground">{emp.jenisKelamin==="L"?"Laki-laki":"Perempuan"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{emp.nik}</TableCell>
                      <TableCell className="text-sm">{emp.jabatan}</TableCell>
                      <TableCell className="text-sm">{emp.unitKerja}</TableCell>
                      <TableCell><Badge variant="outline" className="font-mono text-xs">{emp.golongan}</Badge></TableCell>
                      <TableCell className="text-sm">{emp.masaKerja}</TableCell>
                      <TableCell className="text-center"><Badge variant="outline" className={statusConfig[emp.status].className}>{statusConfig[emp.status].label}</Badge></TableCell>
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

      {/* Dialog Tambah */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Tambah Pegawai Baru</DialogTitle><DialogDescription>Lengkapi semua data pegawai</DialogDescription></DialogHeader>
          <FormBody/>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setShowAddDialog(false)}>Batal</Button>
            <Button onClick={handleAdd} disabled={isLoading}>{isLoading?<><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Menyimpan...</>:"Tambah Pegawai"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Edit */}
      <Dialog open={showEditDialog} onOpenChange={v=>{setShowEditDialog(v);if(!v)setEditingEmployee(null)}}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Data — {editingEmployee?.nama}</DialogTitle><DialogDescription>Perbarui data pegawai</DialogDescription></DialogHeader>
          <FormBody/>
          <DialogFooter>
            <Button variant="outline" onClick={()=>{setShowEditDialog(false);setEditingEmployee(null)}}>Batal</Button>
            <Button onClick={handleEdit} disabled={isLoading}>{isLoading?<><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Menyimpan...</>:"Simpan Perubahan"}</Button>
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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{isLoading?<><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Menghapus...</>:"Ya, Hapus"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
