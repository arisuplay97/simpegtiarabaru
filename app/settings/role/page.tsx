"use client"

import { useState, useEffect } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Switch } from "@/components/ui/switch"
import { Shield, Plus, Edit2, Trash2, Loader2, Users, Settings, Eye, FileText, Search } from "lucide-react"
import { toast } from "sonner"

// ============ TIPE & DATA ============
interface Permission {
  id: string
  label: string
  description: string
}

interface RoleConfig {
  id: string
  name: string
  label: string
  color: string
  description: string
  permissions: string[]
  userCount: number
}

const allPermissions: Permission[] = [
  { id: "dashboard.view", label: "Lihat Dashboard", description: "Akses halaman dashboard dan statistik" },
  { id: "pegawai.view", label: "Lihat Data Pegawai", description: "Melihat daftar dan detail pegawai" },
  { id: "pegawai.create", label: "Tambah Pegawai", description: "Menambahkan data pegawai baru" },
  { id: "pegawai.edit", label: "Edit Pegawai", description: "Mengubah data pegawai" },
  { id: "pegawai.delete", label: "Hapus Pegawai", description: "Menghapus data pegawai" },
  { id: "mutasi.view", label: "Lihat Mutasi", description: "Melihat daftar pengajuan mutasi" },
  { id: "mutasi.create", label: "Ajukan Mutasi", description: "Membuat pengajuan mutasi/promosi" },
  { id: "mutasi.approve", label: "Approve Mutasi", description: "Menyetujui atau menolak mutasi" },
  { id: "absensi.view", label: "Lihat Absensi", description: "Melihat data absensi" },
  { id: "absensi.manage", label: "Kelola Absensi", description: "Mengelola data absensi" },
  { id: "cuti.view", label: "Lihat Cuti", description: "Melihat pengajuan cuti" },
  { id: "cuti.approve", label: "Approve Cuti", description: "Menyetujui atau menolak cuti" },
  { id: "payroll.view", label: "Lihat Payroll", description: "Melihat data gaji" },
  { id: "payroll.manage", label: "Kelola Payroll", description: "Mengelola slip gaji dan payroll" },
  { id: "settings.view", label: "Lihat Pengaturan", description: "Akses menu pengaturan" },
  { id: "settings.manage", label: "Kelola Pengaturan", description: "Mengubah pengaturan sistem" },
  { id: "users.manage", label: "Kelola Users", description: "Mengelola akun pengguna" },
  { id: "reports.view", label: "Lihat Laporan", description: "Akses laporan dan statistik" },
  { id: "reports.export", label: "Export Laporan", description: "Mengunduh laporan dalam format file" },
  { id: "kalender.view", label: "Kalender Kehadiran", description: "Melihat visualisasi kalender kehadiran" },
  { id: "indeks.view", label: "Indeks Pegawai", description: "Melihat leaderboard dan skor indeks" },
  { id: "indeks.manage", label: "Kelola Indeks", description: "Menghitung ulang skor dan melihat peringatan" },
  { id: "approval.manage", label: "Approval Center", description: "Pusat persetujuan cuti dan mutasi" },
]

const initialRoles: RoleConfig[] = [
  {
    id: "superadmin", name: "SUPERADMIN", label: "Super Admin",
    color: "bg-red-100 text-red-700 border-red-200",
    description: "Akses penuh ke semua fitur sistem",
    permissions: allPermissions.map(p => p.id),
    userCount: 1,
  },
  {
    id: "hrd", name: "HRD", label: "HRD",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    description: "Mengelola data kepegawaian, absensi, cuti, dan payroll",
    permissions: ["dashboard.view", "pegawai.view", "pegawai.create", "pegawai.edit", "pegawai.delete", "mutasi.view", "mutasi.create", "mutasi.approve", "absensi.view", "absensi.manage", "cuti.view", "cuti.approve", "payroll.view", "payroll.manage", "reports.view", "reports.export", "settings.view", "kalender.view", "indeks.view", "indeks.manage", "approval.manage"],
    userCount: 2,
  },
  {
    id: "direksi", name: "DIREKSI", label: "Direksi",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    description: "Melihat laporan, menyetujui mutasi dan cuti",
    permissions: ["dashboard.view", "pegawai.view", "mutasi.view", "mutasi.approve", "cuti.view", "cuti.approve", "payroll.view", "reports.view", "reports.export", "kalender.view", "indeks.view", "approval.manage"],
    userCount: 3,
  },
  {
    id: "pegawai", name: "PEGAWAI", label: "Pegawai",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    description: "Akses terbatas untuk melihat data pribadi",
    permissions: ["dashboard.view", "absensi.view", "cuti.view", "payroll.view", "kalender.view", "indeks.view"],
    userCount: 45,
  },
]

// ============ KOMPONEN ============
export default function RolePermissionPage() {
  const [roles, setRoles] = useState<RoleConfig[]>(initialRoles)
  const [selectedRole, setSelectedRole] = useState<RoleConfig | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editPermissions, setEditPermissions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleOpenEdit = (role: RoleConfig) => {
    setSelectedRole(role)
    setEditPermissions([...role.permissions])
    setShowEditDialog(true)
  }

  const togglePermission = (permId: string) => {
    setEditPermissions(prev =>
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    )
  }

  const handleSave = async () => {
    if (!selectedRole) return
    setIsLoading(true)
    // Simulate save
    await new Promise(r => setTimeout(r, 500))
    setRoles(prev => prev.map(r =>
      r.id === selectedRole.id ? { ...r, permissions: editPermissions } : r
    ))
    setShowEditDialog(false)
    setIsLoading(false)
    toast.success(`Permission untuk ${selectedRole.label} berhasil diperbarui`)
  }

  // Group permissions by module
  const permissionGroups = [
    { label: "Dashboard", icon: Settings, perms: allPermissions.filter(p => p.id.startsWith("dashboard") || p.id.startsWith("approval")) },
    { label: "Pegawai & Kinerja", icon: Users, perms: allPermissions.filter(p => p.id.startsWith("pegawai") || p.id.startsWith("indeks")) },
    { label: "Mutasi", icon: FileText, perms: allPermissions.filter(p => p.id.startsWith("mutasi")) },
    { label: "Absensi", icon: Eye, perms: allPermissions.filter(p => p.id.startsWith("absensi") || p.id.startsWith("kalender")) },
    { label: "Cuti", icon: FileText, perms: allPermissions.filter(p => p.id.startsWith("cuti")) },
    { label: "Payroll", icon: FileText, perms: allPermissions.filter(p => p.id.startsWith("payroll")) },
    { label: "Pengaturan", icon: Settings, perms: allPermissions.filter(p => p.id.startsWith("settings") || p.id.startsWith("users")) },
    { label: "Laporan", icon: FileText, perms: allPermissions.filter(p => p.id.startsWith("reports")) },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Pengaturan", "Role & Permission"]} />
        <main className="flex-1 overflow-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Role & Permission</h1>
            <p className="text-sm text-muted-foreground">Kelola hak akses untuk setiap role pengguna</p>
          </div>

          {/* Role Cards */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
            {roles.map(role => (
              <Card key={role.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleOpenEdit(role)}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={role.color}>{role.label}</Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">{role.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" /> {role.userCount} user
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Shield className="h-3.5 w-3.5" /> {role.permissions.length} permission
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Permission Matrix */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Matriks Permission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="min-w-[200px]">Permission</TableHead>
                      {roles.map(role => (
                        <TableHead key={role.id} className="text-center min-w-[100px]">
                          <Badge variant="outline" className={`${role.color} text-xs`}>{role.label}</Badge>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allPermissions.map(perm => (
                      <TableRow key={perm.id}>
                        <TableCell>
                          <p className="text-sm font-medium">{perm.label}</p>
                          <p className="text-xs text-muted-foreground">{perm.description}</p>
                        </TableCell>
                        {roles.map(role => (
                          <TableCell key={role.id} className="text-center">
                            {role.permissions.includes(perm.id) ? (
                              <span className="inline-block h-5 w-5 rounded-full bg-emerald-100 text-emerald-600 text-xs leading-5">✓</span>
                            ) : (
                              <span className="inline-block h-5 w-5 rounded-full bg-gray-100 text-gray-400 text-xs leading-5">—</span>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Edit Permission Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Edit Permission — {selectedRole?.label}
            </DialogTitle>
            <DialogDescription>{selectedRole?.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {permissionGroups.map(group => (
              <div key={group.label}>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                  <group.icon className="h-4 w-4" /> {group.label}
                </h4>
                <div className="space-y-2">
                  {group.perms.map(perm => (
                    <div key={perm.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{perm.label}</p>
                        <p className="text-xs text-muted-foreground">{perm.description}</p>
                      </div>
                      <Switch
                        checked={editPermissions.includes(perm.id)}
                        onCheckedChange={() => togglePermission(perm.id)}
                        disabled={selectedRole?.id === "superadmin"}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={isLoading || selectedRole?.id === "superadmin"}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedRole?.id === "superadmin" ? "Super Admin (Tidak Dapat Diubah)" : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
