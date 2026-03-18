"use client"

import React, { useState } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { useSession } from "next-auth/react"
import { hasPermission, roleLabels } from "@/lib/auth/permissions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Search, Plus, Edit, Trash2, Key,
  Users, Shield, UserCheck, Loader2,
  Eye, EyeOff,
} from "lucide-react"
import { toast } from "sonner"

// ============ DATA DUMMY ============
interface SystemUser {
  id: string
  name: string
  username: string
  email: string
  password: string
  nik: string
  role: string
  unitKerja: string
  jabatan: string
  status: "active" | "inactive"
  createdAt: string
}

const initialUsers: SystemUser[] = [
  { id: "1", name: "Dwiky Firmansyah",     username: "superadmin", email: "superadmin@tiara.com", password: "admin123",     nik: "3201010101900001", role: "SUPERADMIN", unitKerja: "IT & Sistem", jabatan: "Super Admin HRIS",      status: "active", createdAt: "01 Jan 2026" },
  { id: "2", name: "Fitri Handayani",      username: "hrd",        email: "hrd@tiara.com",        password: "hrd123",       nik: "3201010101930002", role: "HRD",        unitKerja: "SDM & Umum",  jabatan: "Staff HRD",              status: "active", createdAt: "01 Jan 2026" },
  { id: "3", name: "Ir. Gunawan Wibowo",   username: "direktur",   email: "direktur@tiara.com",   password: "direktur123",  nik: "3201010101750003", role: "DIREKSI",    unitKerja: "Direksi",     jabatan: "Direktur Utama",         status: "active", createdAt: "01 Jan 2026" },
  { id: "4", name: "Ahmad Rizki Pratama",  username: "pegawai",    email: "pegawai@tiara.com",    password: "pegawai123",   nik: "3201150115850001", role: "PEGAWAI",    unitKerja: "IT & Sistem", jabatan: "Kepala Bagian IT",        status: "active", createdAt: "01 Jan 2026" },
]

const roleBadgeClass: Record<string, string> = {
  SUPERADMIN: "bg-purple-100 text-purple-700 border-purple-200",
  HRD:        "bg-blue-100 text-blue-700 border-blue-200",
  DIREKSI:    "bg-amber-100 text-amber-700 border-amber-200",
  PEGAWAI:    "bg-emerald-100 text-emerald-700 border-emerald-200",
}

// ============ KOMPONEN UTAMA ============
export default function UserManagementPage() {
  const { data: session } = useSession()
  const user = session?.user as any

  const [users, setUsers] = useState<SystemUser[]>(initialUsers)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [showDialog, setShowDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<SystemUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Form state
  const [form, setForm] = useState({
    name: "", username: "", email: "", password: "",
    nik: "", role: "PEGAWAI", unitKerja: "", jabatan: "",
    status: "active" as "active" | "inactive",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  if (!hasPermission(user?.role, "users.view")) {
    return (
      <div className="flex min-h-screen bg-background">
        <SidebarNav />
        <div className="flex flex-1 flex-col pl-64">
          <TopBar breadcrumb={["Pengaturan", "Manajemen User"]} />
          <main className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground">Anda tidak memiliki akses ke halaman ini.</p>
          </main>
        </div>
      </div>
    )
  }

  // ---- Filter ----
  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchRole = roleFilter === "all" || u.role === roleFilter
    return matchSearch && matchRole
  })

  // ---- Buka dialog tambah ----
  const handleOpenAdd = () => {
    setEditingUser(null)
    setForm({ name: "", username: "", email: "", password: "", nik: "", role: "PEGAWAI", unitKerja: "", jabatan: "", status: "active" })
    setFormErrors({})
    setShowPassword(false)
    setShowDialog(true)
  }

  // ---- Buka dialog edit ----
  const handleOpenEdit = (u: SystemUser) => {
    setEditingUser(u)
    setForm({ name: u.name, username: u.username, email: u.email, password: "", nik: u.nik, role: u.role, unitKerja: u.unitKerja, jabatan: u.jabatan, status: u.status })
    setFormErrors({})
    setShowPassword(false)
    setShowDialog(true)
  }

  // ---- Validasi ----
  const validate = () => {
    const errors: Record<string, string> = {}
    if (!form.name.trim()) errors.name = "Nama wajib diisi"
    if (!form.username.trim()) errors.username = "Username wajib diisi"
    if (!form.email.includes("@")) errors.email = "Format email tidak valid"
    if (!editingUser && form.password.length < 6) errors.password = "Password minimal 6 karakter"
    if (editingUser && form.password && form.password.length < 6) errors.password = "Password minimal 6 karakter"
    if (!form.unitKerja.trim()) errors.unitKerja = "Unit kerja wajib diisi"
    if (!form.jabatan.trim()) errors.jabatan = "Jabatan wajib diisi"
    // Cek username duplikat
    const dupUsername = users.find(u => u.username === form.username && u.id !== editingUser?.id)
    if (dupUsername) errors.username = "Username sudah digunakan"
    // Cek email duplikat
    const dupEmail = users.find(u => u.email === form.email && u.id !== editingUser?.id)
    if (dupEmail) errors.email = "Email sudah digunakan"
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // ---- Simpan ----
  const handleSave = async () => {
    if (!validate()) return
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 700))

    if (editingUser) {
      setUsers(prev => prev.map(u => u.id === editingUser.id ? {
        ...u,
        name: form.name,
        username: form.username,
        email: form.email,
        password: form.password || u.password,
        nik: form.nik,
        role: form.role,
        unitKerja: form.unitKerja,
        jabatan: form.jabatan,
        status: form.status,
      } : u))
      toast.success(`Data ${form.name} berhasil diperbarui`)
    } else {
      const newUser: SystemUser = {
        id: String(Date.now()),
        name: form.name,
        username: form.username,
        email: form.email,
        password: form.password,
        nik: form.nik,
        role: form.role,
        unitKerja: form.unitKerja,
        jabatan: form.jabatan,
        status: form.status,
        createdAt: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
      }
      setUsers(prev => [newUser, ...prev])
      toast.success(`User ${form.name} berhasil ditambahkan`)
    }

    setShowDialog(false)
    setIsLoading(false)
  }

  // ---- Reset Password ----
  const handleResetPassword = (u: SystemUser) => {
    const newPass = "password123"
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, password: newPass } : x))
    toast.success(`Password ${u.name} direset → ${newPass}`)
  }

  // ---- Toggle Status ----
  const handleToggleStatus = (u: SystemUser) => {
    const newStatus = u.status === "active" ? "inactive" : "active"
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, status: newStatus } : x))
    toast.success(`${u.name} → ${newStatus === "active" ? "Aktif" : "Non-aktif"}`)
  }

  // ---- Hapus ----
  const handleDelete = async () => {
    if (!deletingUser) return
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 500))
    setUsers(prev => prev.filter(u => u.id !== deletingUser.id))
    setShowDeleteDialog(false)
    setDeletingUser(null)
    setIsLoading(false)
    toast.success(`User ${deletingUser.name} berhasil dihapus`)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col pl-64">
        <TopBar breadcrumb={["Pengaturan", "Manajemen User"]} />
        <main className="flex-1 overflow-auto p-6">

          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Manajemen User</h1>
              <p className="text-sm text-muted-foreground">Kelola akun, username, password, role, dan status user</p>
            </div>
            {hasPermission(user?.role, "users.manage") && (
              <Button size="sm" className="gap-2" onClick={handleOpenAdd}>
                <Plus className="h-4 w-4" /> Tambah User
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total User",  value: users.length,                                     icon: Users,      bg: "bg-primary/10",    color: "text-primary" },
              { label: "Super Admin", value: users.filter(u => u.role === "SUPERADMIN").length, icon: Shield,     bg: "bg-purple-100",    color: "text-purple-600" },
              { label: "HRD",         value: users.filter(u => u.role === "HRD").length,        icon: UserCheck,  bg: "bg-blue-100",      color: "text-blue-600" },
              { label: "Aktif",       value: users.filter(u => u.status === "active").length,   icon: UserCheck,  bg: "bg-emerald-100",   color: "text-emerald-600" },
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

          {/* Filter */}
          <Card className="card-premium mb-4">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Cari nama, username, atau email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="Filter Role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Role</SelectItem>
                    <SelectItem value="SUPERADMIN">Super Admin</SelectItem>
                    <SelectItem value="HRD">HRD</SelectItem>
                    <SelectItem value="DIREKSI">Direksi</SelectItem>
                    <SelectItem value="PEGAWAI">Pegawai</SelectItem>
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
                      <TableHead className="w-[220px]">User</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Unit / Jabatan</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead>Dibuat</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Users className="h-8 w-8 text-muted-foreground/50" />
                            <p className="text-muted-foreground">Tidak ada user ditemukan</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filtered.map(u => (
                      <TableRow key={u.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary/10 text-xs text-primary">
                                {u.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{u.name}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{u.username}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={roleBadgeClass[u.role]}>
                            {roleLabels[u.role] ?? u.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{u.unitKerja}</p>
                          <p className="text-xs text-muted-foreground">{u.jabatan}</p>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={u.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}
                          >
                            {u.status === "active" ? "Aktif" : "Non-aktif"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{u.createdAt}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            {hasPermission(user?.role, "users.manage") && (
                              <>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(u)} title="Edit">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:bg-amber-50" onClick={() => handleResetPassword(u)} title="Reset Password">
                                  <Key className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => handleToggleStatus(u)} title="Toggle Status">
                                  <UserCheck className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => { setDeletingUser(u); setShowDeleteDialog(true) }} title="Hapus">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* ===== DIALOG TAMBAH / EDIT ===== */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUser ? `Edit User — ${editingUser.name}` : "Tambah User Baru"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nama Lengkap</Label>
              <Input className="mt-1" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nama lengkap" />
              {formErrors.name && <p className="mt-1 text-xs text-destructive">{formErrors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Username</Label>
                <Input className="mt-1 font-mono" value={form.username} onChange={e => setForm({...form, username: e.target.value.toLowerCase()})} placeholder="username" />
                {formErrors.username && <p className="mt-1 text-xs text-destructive">{formErrors.username}</p>}
              </div>
              <div>
                <Label>
                  Password {editingUser && <span className="text-muted-foreground font-normal text-xs">(kosong = tidak ganti)</span>}
                </Label>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                    placeholder={editingUser ? "Kosongkan jika tidak ganti" : "Min. 6 karakter"}
                    className="pr-10"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formErrors.password && <p className="mt-1 text-xs text-destructive">{formErrors.password}</p>}
              </div>
            </div>

            <div>
              <Label>Email</Label>
              <Input className="mt-1" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@tiara.com" />
              {formErrors.email && <p className="mt-1 text-xs text-destructive">{formErrors.email}</p>}
            </div>

            <div>
              <Label>NIK</Label>
              <Input className="mt-1 font-mono" value={form.nik} onChange={e => setForm({...form, nik: e.target.value})} placeholder="16 digit NIK" maxLength={16} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Role</Label>
                <Select value={form.role} onValueChange={v => setForm({...form, role: v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPERADMIN">Super Admin</SelectItem>
                    <SelectItem value="HRD">HRD</SelectItem>
                    <SelectItem value="DIREKSI">Direksi</SelectItem>
                    <SelectItem value="PEGAWAI">Pegawai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({...form, status: v as any})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Non-aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Unit Kerja</Label>
                <Select value={form.unitKerja} onValueChange={v => setForm({...form, unitKerja: v})}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih unit" /></SelectTrigger>
                  <SelectContent>
                    {["IT & Sistem","Keuangan","Distribusi","Pelayanan","Produksi","SDM & Umum","Direksi"].map(u => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.unitKerja && <p className="mt-1 text-xs text-destructive">{formErrors.unitKerja}</p>}
              </div>
              <div>
                <Label>Jabatan</Label>
                <Input className="mt-1" value={form.jabatan} onChange={e => setForm({...form, jabatan: e.target.value})} placeholder="Nama jabatan" />
                {formErrors.jabatan && <p className="mt-1 text-xs text-destructive">{formErrors.jabatan}</p>}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> : editingUser ? "Simpan Perubahan" : "Tambah User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DIALOG HAPUS ===== */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus User</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin menghapus user <strong>{deletingUser?.name}</strong> ({deletingUser?.username})? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menghapus...</> : "Ya, Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
