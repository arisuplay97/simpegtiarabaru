"use client"

import React from "react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import Link from "next/link"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Search,
  Filter,
  Download,
  UserPlus,
  MoreHorizontal,
  Eye,
  Edit,
  FileText,
  History,
  Users,
  UserCheck,
  UserX,
  Clock,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

interface Employee {
  id: string
  nik: string
  name: string
  avatar?: string
  initials: string
  jabatan: string
  unitKerja: string
  status: "aktif" | "cuti" | "non-aktif" | "pensiun"
  golongan: string
  masaKerja: string
  email: string
  telepon: string
  jenisKelamin: "L" | "P"
  tanggalMasuk: string
  tempatLahir?: string
  tanggalLahir?: string
  alamat?: string
  agama?: string
  statusPernikahan?: string
  noBPJSKes?: string
  noBPJSTK?: string
  sp?: "sp1" | "sp2" | "sp3" | null
}

const statusConfig = {
  aktif: { label: "Aktif", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  cuti: { label: "Cuti", className: "bg-blue-100 text-blue-700 border-blue-200" },
  "non-aktif": { label: "Non-Aktif", className: "bg-gray-100 text-gray-700 border-gray-200" },
  pensiun: { label: "Pensiun", className: "bg-orange-100 text-orange-700 border-orange-200" },
}

const employees: Employee[] = [
  {
    id: "1",
    nik: "198501152010011001",
    name: "Ahmad Rizki Pratama",
    initials: "AR",
    jabatan: "Kepala Bagian IT",
    unitKerja: "IT & Sistem",
    status: "aktif",
    golongan: "C/III",
    masaKerja: "16 tahun",
    email: "ahmad.rizki@pdamtirtaselaras.co.id",
    telepon: "081234567890",
    jenisKelamin: "L",
    tanggalMasuk: "2010-01-15",
    tempatLahir: "Jakarta",
    tanggalLahir: "1985-01-15",
    alamat: "Jl. Merdeka No. 123",
    agama: "Islam",
    statusPernikahan: "Menikah",
    sp: null,
  },
  {
    id: "2",
    nik: "199003222015012002",
    name: "Siti Nurhaliza",
    initials: "SN",
    jabatan: "Staff Keuangan Senior",
    unitKerja: "Keuangan",
    status: "aktif",
    golongan: "B/III",
    masaKerja: "11 tahun",
    email: "siti.nurhaliza@pdamtirtaselaras.co.id",
    telepon: "081234567891",
    jenisKelamin: "P",
    tanggalMasuk: "2015-01-22",
    sp: "sp1",
  },
  {
    id: "3",
    nik: "198712052008011003",
    name: "Budi Santoso",
    initials: "BS",
    jabatan: "Supervisor Distribusi",
    unitKerja: "Distribusi",
    status: "cuti",
    golongan: "D/III",
    masaKerja: "18 tahun",
    email: "budi.santoso@pdamtirtaselaras.co.id",
    telepon: "081234567892",
    jenisKelamin: "L",
    tanggalMasuk: "2008-01-05",
    sp: "sp2",
  },
  {
    id: "4",
    nik: "197506101998011007",
    name: "Gunawan Wibowo",
    initials: "GW",
    jabatan: "Manager Produksi",
    unitKerja: "Produksi",
    status: "aktif",
    golongan: "D/IV",
    masaKerja: "28 tahun",
    email: "gunawan@pdamtirta.co.id",
    telepon: "081234567893",
    jenisKelamin: "L",
    tanggalMasuk: "1998-06-10",
    sp: "sp3",
  },
]



const spConfig = {
  sp1: { label: "SP-1", className: "bg-gray-100 text-gray-600 border-gray-300" },
  sp2: { label: "SP-2", className: "bg-amber-100 text-amber-700 border-amber-300" },
  sp3: { label: "SP-3", className: "bg-red-100 text-red-700 border-red-300" },
}

const kpiStats = [
  { label: "Total Pegawai", value: "1,247", icon: Users, color: "text-primary" },
  { label: "Pegawai Aktif", value: "1,198", icon: UserCheck, color: "text-emerald-600" },
  { label: "Sedang Cuti", value: "42", icon: Clock, color: "text-amber-600" },
  { label: "Non-Aktif/Pensiun", value: "7", icon: UserX, color: "text-red-600" },
]

export default function EmployeeListPage() {
  const [employeeList, setEmployeeList] = useState<Employee[]>(employees)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [unitFilter, setUnitFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    name: "",
    nik: "",
    jabatan: "",
    unitKerja: "",
    golongan: "",
    status: "aktif",
    jenisKelamin: "L",
    email: "",
    telepon: "",
    tempatLahir: "",
    tanggalLahir: "",
    alamat: "",
    agama: "",
    statusPernikahan: "",
    tanggalMasuk: new Date().toISOString().split("T")[0]
  })

  const itemsPerPage = 5

  const filteredEmployees = employeeList.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.nik.includes(searchQuery) ||
      emp.jabatan.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || emp.status === statusFilter
    const matchesUnit = unitFilter === "all" || emp.unitKerja === unitFilter
    return matchesSearch && matchesStatus && matchesUnit
  })

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage)
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleAddEmployee = () => {
    // Role-based validation
    const isStaff = newEmployee.jabatan?.toLowerCase().includes("staff")
    const isKepalaBidang = newEmployee.jabatan?.toLowerCase().includes("kepala")

    if (!newEmployee.name || !newEmployee.nik || !newEmployee.jabatan) {
      toast.error("Harap isi bidang utama (Nama, NIK, Jabatan)")
      return
    }

    if (isStaff) {
      // Staff must fill everything
      if (!newEmployee.alamat || !newEmployee.tempatLahir || !newEmployee.tanggalLahir || !newEmployee.agama) {
        toast.error("Untuk Staff, semua data diri wajib diisi lengkaap")
        return
      }
    }

    const initials = newEmployee.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)
    const id = (employeeList.length + 1).toString()
    
    const employeeToAdd: Employee = {
      ...newEmployee as Employee,
      id,
      initials,
      masaKerja: "Baru bergabung"
    }

    setEmployeeList([employeeToAdd, ...employeeList])
    setIsAddDialogOpen(false)
    setNewEmployee({
      name: "",
      nik: "",
      jabatan: "",
      unitKerja: "",
      golongan: "",
      status: "aktif",
      jenisKelamin: "L",
      email: "",
      telepon: "",
      tempatLahir: "",
      tanggalLahir: "",
      alamat: "",
      agama: "",
      statusPernikahan: "",
      tanggalMasuk: new Date().toISOString().split("T")[0]
    })
    toast.success("Pegawai berhasil ditambahkan")
  }

  const handleExportCSV = () => {
    const headers = ["NIK", "Nama", "Jabatan", "Unit Kerja", "Golongan", "Status", "Alamat", "No.HP"]
    const csvData = filteredEmployees.map(emp => 
      [emp.nik, emp.name, emp.jabatan, emp.unitKerja, emp.golongan, emp.status, (emp.alamat || "-"), emp.telepon].join(",")
    )
    const csvContent = "\uFEFF" + [headers.join(","), ...csvData].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `data_pegawai_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Data berhasil diekspor ke Excel (CSV)")
  }

  const handleExportPDF = () => {
    toast.info("Menyiapkan dokumen PDF...")
    setTimeout(() => {
        window.print() // Simple way to suggest PDF print
        toast.success("Halaman Cetak Terbuka (Simpan sebagai PDF)")
    }, 1000)
  }


  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col pl-64">
        <TopBar breadcrumb={["Kepegawaian", "Data Pegawai"]} />
        <main className="flex-1 overflow-auto p-6">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Data Pegawai</h1>
              <p className="text-sm text-muted-foreground">
                Kelola data seluruh pegawai PDAM Tirta Ardhia Rinjani
              </p>
            </div>
            <div className="flex wrap items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCSV}>
                <Download className="h-4 w-4" />
                Export Excel (CSV)
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleExportPDF}>
                <FileText className="h-4 w-4" />
                Download PDF
              </Button>
              
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Tambah Pegawai
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] h-[90vh] flex flex-col p-0">
                  <DialogHeader className="p-6 pb-0">
                    <DialogTitle>Tambah Pegawai Baru</DialogTitle>
                    <DialogDescription>
                      Isi data lengkap di bawah ini. {newEmployee.jabatan?.toLowerCase().includes("staff") && <span className="text-destructive font-semibold">(Staff: Wajib Isi Semua)</span>}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nama Lengkap</Label>
                        <Input
                          id="name"
                          value={newEmployee.name}
                          onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                          placeholder="Masukkan nama lengkap"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nik">NIK (16 Digit)</Label>
                        <Input
                          id="nik"
                          value={newEmployee.nik}
                          onChange={(e) => setNewEmployee({...newEmployee, nik: e.target.value})}
                          placeholder="NIK KTP"
                          maxLength={16}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="jabatan">Jabatan</Label>
                        <Input
                          id="jabatan"
                          value={newEmployee.jabatan}
                          onChange={(e) => setNewEmployee({...newEmployee, jabatan: e.target.value})}
                          placeholder="Contoh: Staff Keuangan / Kepala Bidang"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unit">Unit Kerja</Label>
                        <Select 
                          value={newEmployee.unitKerja} 
                          onValueChange={(val: string) => setNewEmployee({...newEmployee, unitKerja: val})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="IT & Sistem">IT & Sistem</SelectItem>
                            <SelectItem value="Keuangan">Keuangan</SelectItem>
                            <SelectItem value="Distribusi">Distribusi</SelectItem>
                            <SelectItem value="Pelayanan">Pelayanan</SelectItem>
                            <SelectItem value="Produksi">Produksi</SelectItem>
                            <SelectItem value="SDM & Umum">SDM & Umum</SelectItem>
                            <SelectItem value="Direksi">Direksi</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="gol">Golongan</Label>
                        <Select 
                          value={newEmployee.golongan} 
                          onValueChange={(val: string) => setNewEmployee({...newEmployee, golongan: val})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Golongan" />
                          </SelectTrigger>
                          <SelectContent>
                            {["A/I", "B/I", "C/I", "D/I", "A/II", "B/II", "C/II", "D/II", "A/III", "B/III", "C/III", "D/III", "A/IV", "B/IV", "C/IV", "D/IV", "E/IV"].map(g => (
                                <SelectItem key={g} value={g}>{g}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="jk">Jenis Kelamin</Label>
                        <Select 
                          value={newEmployee.jenisKelamin} 
                          onValueChange={(val: "L" | "P") => setNewEmployee({...newEmployee, jenisKelamin: val})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih JK" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="L">Laki-laki</SelectItem>
                            <SelectItem value="P">Perempuan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tempatLahir">Tempat Lahir</Label>
                        <Input
                          id="tempatLahir"
                          value={newEmployee.tempatLahir}
                          onChange={(e) => setNewEmployee({...newEmployee, tempatLahir: e.target.value})}
                          placeholder="Contoh: Jakarta"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tanggalLahir">Tanggal Lahir</Label>
                        <Input
                          id="tanggalLahir"
                          type="date"
                          value={newEmployee.tanggalLahir}
                          onChange={(e) => setNewEmployee({...newEmployee, tanggalLahir: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="alamat">Alamat Lengkap</Label>
                      <Input
                        id="alamat"
                        value={newEmployee.alamat}
                        onChange={(e) => setNewEmployee({...newEmployee, alamat: e.target.value})}
                        placeholder="Contoh: Jl. Sudirman No 45, Jakarta"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="agama">Agama</Label>
                        <Select 
                          value={newEmployee.agama} 
                          onValueChange={(val: string) => setNewEmployee({...newEmployee, agama: val})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Agama" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Islam">Islam</SelectItem>
                            <SelectItem value="Kristen">Kristen</SelectItem>
                            <SelectItem value="Katolik">Katolik</SelectItem>
                            <SelectItem value="Hindu">Hindu</SelectItem>
                            <SelectItem value="Budha">Budha</SelectItem>
                            <SelectItem value="Konghucu">Konghucu</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="kawin">Status Perkawinan</Label>
                        <Select 
                          value={newEmployee.statusPernikahan} 
                          onValueChange={(val: string) => setNewEmployee({...newEmployee, statusPernikahan: val})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Belum Menikah">Belum Menikah</SelectItem>
                            <SelectItem value="Menikah">Menikah</SelectItem>
                            <SelectItem value="Cerai Hidup">Cerai Hidup</SelectItem>
                            <SelectItem value="Cerai Mati">Cerai Mati</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bpjskes">No. BPJS Kesehatan</Label>
                        <Input
                          id="bpjskes"
                          value={newEmployee.noBPJSKes}
                          onChange={(e) => setNewEmployee({...newEmployee, noBPJSKes: e.target.value})}
                          placeholder="Opsional (Kecuali Staff)"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bpjstk">No. BPJS TK</Label>
                        <Input
                          id="bpjstk"
                          value={newEmployee.noBPJSTK}
                          onChange={(e) => setNewEmployee({...newEmployee, noBPJSTK: e.target.value})}
                          placeholder="Opsional (Kecuali Staff)"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="p-6 pt-2 border-t mt-auto">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Batal</Button>
                    <Button onClick={handleAddEmployee}>Simpan Pegawai</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpiStats.map((stat) => (
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
                    placeholder="Cari nama, NIK, atau jabatan..."
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
                      <SelectItem value="aktif">Aktif</SelectItem>
                      <SelectItem value="cuti">Cuti</SelectItem>
                      <SelectItem value="non-aktif">Non-Aktif</SelectItem>
                      <SelectItem value="pensiun">Pensiun</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={unitFilter} onValueChange={setUnitFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Unit Kerja" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Unit</SelectItem>
                      <SelectItem value="IT & Sistem">IT & Sistem</SelectItem>
                      <SelectItem value="Keuangan">Keuangan</SelectItem>
                      <SelectItem value="Distribusi">Distribusi</SelectItem>
                      <SelectItem value="Pelayanan">Pelayanan</SelectItem>
                      <SelectItem value="Produksi">Produksi</SelectItem>
                      <SelectItem value="SDM & Umum">SDM & Umum</SelectItem>
                      <SelectItem value="Direksi">Direksi</SelectItem>
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
                      <TableHead className="w-[300px]">Pegawai</TableHead>
                      <TableHead>NIK</TableHead>
                      <TableHead>Jabatan</TableHead>
                      <TableHead>Unit Kerja</TableHead>
                      <TableHead>Golongan</TableHead>
                      <TableHead>Masa Kerja</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Kontak</TableHead>
                      <TableHead className="w-[80px] text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedEmployees.length > 0 ? (
                      paginatedEmployees.map((employee) => (
                        <TableRow key={employee.id} className="group hover:bg-muted/30">
                          {/* ... existing table row content ... */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={employee.avatar} />
                                <AvatarFallback className="bg-primary/10 text-sm text-primary">
                                  {employee.initials}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/pegawai/${employee.id}`}
                                    className="font-medium text-foreground hover:text-primary hover:underline"
                                  >
                                    {employee.name}
                                  </Link>
                                  {employee.sp && (
                                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${spConfig[employee.sp].className}`}>
                                      {spConfig[employee.sp].label}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {employee.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {employee.nik}
                          </TableCell>
                          <TableCell className="text-sm">{employee.jabatan}</TableCell>
                          <TableCell className="text-sm">{employee.unitKerja}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              {employee.golongan}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{employee.masaKerja}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={statusConfig[employee.status].className}
                            >
                              {statusConfig[employee.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <a
                                href={`mailto:${employee.email}`}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                              >
                                <Mail className="h-3 w-3" />
                                <span className="max-w-[120px] truncate">{employee.email}</span>
                              </a>
                              <a
                                href={`tel:${employee.telepon}`}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                              >
                                <Phone className="h-3 w-3" />
                                {employee.telepon}
                              </a>
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/pegawai/${employee.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Lihat Detail
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Data
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <FileText className="mr-2 h-4 w-4" />
                                  Dokumen
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <History className="mr-2 h-4 w-4" />
                                  Riwayat
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center">
                          Tidak ada data pegawai yang ditemukan.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-border p-4">
                <p className="text-sm text-muted-foreground">
                  Menampilkan {paginatedEmployees.length} dari {filteredEmployees.length} pegawai
                </p>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Sebelumnya
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
                    Selanjutnya
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
