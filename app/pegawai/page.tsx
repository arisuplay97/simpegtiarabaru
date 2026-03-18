"use client"

import React, { useState, useEffect } from "react"
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
  Users,
  UserCheck,
  UserX,
  Clock,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { getEmployees, getEmployeeStats, createEmployee } from "@/lib/actions/pegawai"
import ExcelJS from "exceljs"

export default function EmployeeListPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newEmployee, setNewEmployee] = useState({
    nama: "",
    nik: "",
    email: "",
    jabatan: "",
    unitKerja: "",
    golongan: "",
    status: "aktif",
    tanggalMasuk: new Date().toISOString().split("T")[0],
    role: "PEGAWAI",
    password: "123"
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [data, s] = await Promise.all([getEmployees(), getEmployeeStats()])
      setEmployees(data)
      setStats(s)
    } catch (error) {
      toast.error("Gagal memuat data pegawai")
    } finally {
      setLoading(false)
    }
  }

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.nip.includes(searchQuery) ||
      emp.jabatan.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || emp.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreate = async () => {
    if (!newEmployee.nama || !newEmployee.nik || !newEmployee.email) {
      toast.error("Nama, NIK, dan Email wajib diisi")
      return
    }
    try {
      await createEmployee(newEmployee)
      toast.success("Pegawai berhasil ditambahkan")
      setIsAddDialogOpen(false)
      loadData()
    } catch (error) {
      toast.error("Gagal menambahkan pegawai")
    }
  }

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Data Pegawai")

    worksheet.columns = [
      { header: "NIK", key: "nik", width: 25 },
      { header: "Nama", key: "nama", width: 30 },
      { header: "Jabatan", key: "jabatan", width: 25 },
      { header: "Unit Kerja", key: "unit", width: 20 },
      { header: "Status", key: "status", width: 15 },
      { header: "Email", key: "email", width: 30 },
    ]

    filteredEmployees.forEach(emp => {
      worksheet.addRow({
        nik: emp.nip,
        nama: emp.nama,
        jabatan: emp.jabatan,
        unit: emp.unitKerja,
        status: emp.status,
        email: emp.email,
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `data_pegawai_${new Date().toISOString().split('T')[0]}.xlsx`
    link.click()
    toast.success("Data berhasil diekspor ke Excel")
  }

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <SidebarNav />
      <div className="flex flex-1 flex-col pl-64">
        <TopBar breadcrumb={["Kepegawaian", "Data Pegawai"]} />
        <main className="flex-1 p-8 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Data Kepegawaian</h1>
              <p className="text-sm text-neutral-500">Kelola informasi seluruh SDM PDAM.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportExcel}>
                <Download className="w-4 h-4 mr-2" /> Export Excel
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <UserPlus className="w-4 h-4 mr-2" /> Tambah Pegawai
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tambah Pegawai Baru</DialogTitle>
                    <DialogDescription>Input data dasar untuk sistem.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nama Lengkap</Label>
                        <Input value={newEmployee.nama} onChange={e => setNewEmployee({...newEmployee, nama: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>NIK</Label>
                        <Input value={newEmployee.nik} onChange={e => setNewEmployee({...newEmployee, nik: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email Perusahaan</Label>
                      <Input type="email" value={newEmployee.email} onChange={e => setNewEmployee({...newEmployee, email: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Jabatan</Label>
                        <Input value={newEmployee.jabatan} onChange={e => setNewEmployee({...newEmployee, jabatan: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit Kerja</Label>
                        <Input value={newEmployee.unitKerja} onChange={e => setNewEmployee({...newEmployee, unitKerja: e.target.value})} />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Batal</Button>
                    <Button onClick={handleCreate}>Simpan</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Pegawai" value={stats?.total || 0} icon={<Users />} />
            <StatCard label="Aktif" value={stats?.aktif || 0} icon={<UserCheck />} color="emerald" />
            <StatCard label="Cuti" value={stats?.cuti || 0} icon={<Clock />} color="amber" />
            <StatCard label="Non-Aktif" value={stats?.nonAktif || 0} icon={<UserX />} color="rose" />
          </div>

          <Card>
            <CardContent className="p-4 flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input 
                  className="pl-10" 
                  placeholder="Cari nama, NIK, atau jabatan..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="cuti">Cuti</SelectItem>
                  <SelectItem value="non-aktif">Non-Aktif</SelectItem>
                  <SelectItem value="pensiun">Pensiun</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pegawai</TableHead>
                  <TableHead>NIK</TableHead>
                  <TableHead>Jabatan</TableHead>
                  <TableHead>Unit Kerja</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">Memuat data...</TableCell></TableRow>
                ) : filteredEmployees.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">Tidak ada data.</TableCell></TableRow>
                ) : filteredEmployees.map(emp => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>{emp.nama.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{emp.nama}</p>
                          <p className="text-xs text-neutral-500">{emp.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{emp.nip}</TableCell>
                    <TableCell className="text-sm">{emp.jabatan}</TableCell>
                    <TableCell className="text-sm">{emp.unitKerja}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={emp.status === 'aktif' ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-50 text-neutral-700'}>
                        {emp.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Eye className="w-4 h-4 mr-2" /> Detail</DropdownMenuItem>
                          <DropdownMenuItem><Edit className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </main>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`p-2 rounded-lg bg-${color || 'blue'}-100 text-${color || 'blue'}-600`}>
          {React.cloneElement(icon, { className: "w-5 h-5" })}
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-neutral-500 font-medium">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
