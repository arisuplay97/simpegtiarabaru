"use client"

import React from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { useSession } from "next-auth/react"
import { roleLabels, hasPermission } from "@/lib/auth/permissions"
import type { PermissionKey } from "@/lib/auth/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

const initialUsers: any[] = [] // Empty for now, or could fetch from Prisma

export default function UserManagementPage() {
  const { data: session } = useSession()
  const user = session?.user
  
  const can = (permission: string) => hasPermission(user?.role, permission)
  
  const [users, setUsers] = React.useState<any[]>(initialUsers)
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<any | null>(null)
  const [form, setForm] = React.useState<any>({
    id: "",
    name: "",
    email: "",
    nik: "",
    role: "PEGAWAI",
    unit: "",
    status: "active",
    lastLogin: "Belum pernah",
  })

  if (!can("users.view")) return null

  const resetForm = () => {
    setEditing(null)
    setForm({ id: "", name: "", email: "", nik: "", role: "pegawai", unit: "", status: "active", lastLogin: "Belum pernah" })
  }

  const saveUser = () => {
    if (!form.name || !form.email || !form.nik) {
      toast.error("Nama, email, dan NIK wajib diisi")
      return
    }
    if (editing) {
      setUsers((prev) => prev.map((u) => (u.id === editing.id ? { ...form } : u)))
      toast.success("User berhasil diperbarui")
    } else {
      setUsers((prev) => [...prev, { ...form, id: `u${Date.now()}` }])
      toast.success("User berhasil ditambahkan")
    }
    setOpen(false)
    resetForm()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SidebarNav />
      <main className="ml-64 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
            <p className="text-sm text-slate-500">Kelola akun, role, status aktif, dan unit kerja pengguna sistem.</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>Tambah User</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit User" : "Tambah User"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2 md:grid-cols-2">
                <Input placeholder="Nama lengkap" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <Input placeholder="NIK 16 digit" value={form.nik} onChange={(e) => setForm({ ...form, nik: e.target.value })} />
                <Input placeholder="Unit kerja" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                <Select value={form.role} onValueChange={(value: string) => setForm({ ...form, role: value })}>
                  <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPERADMIN">Super Admin</SelectItem>
                    <SelectItem value="HRD">HRD</SelectItem>
                    <SelectItem value="DIREKSI">Direksi</SelectItem>
                    <SelectItem value="PEGAWAI">Pegawai</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={form.status} onValueChange={(value: "active" | "inactive") => setForm({ ...form, status: value })}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                <Button onClick={saveUser}>{editing ? "Simpan Perubahan" : "Tambah User"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <Card>
            <CardHeader>
              <CardTitle>Daftar User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">{user.name}</div>
                    <div className="mt-1 text-sm text-slate-500">{user.email} • {user.nik}</div>
                    <div className="mt-1 text-xs text-slate-400">{user.unit} • Last login: {user.lastLogin}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{roleLabels[user.role]}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${user.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{user.status}</span>
                    <Button variant="outline" size="sm" onClick={() => { setEditing(user); setForm(user); setOpen(true) }}>Edit</Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: u.status === "active" ? "inactive" : "active" } : u)))
                        toast.success(`Status ${user.name} diperbarui`)
                      }}
                    >
                      {user.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toast.success(`Password ${user.name} berhasil direset (dummy)`) }>Reset Password</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Role</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl border p-4">
                <div className="font-semibold text-slate-900">Super Admin</div>
                <p className="mt-1">Akses penuh seluruh modul aktif.</p>
              </div>
              <div className="rounded-2xl border p-4">
                <div className="font-semibold text-slate-900">HRD</div>
                <p className="mt-1">Kelola pegawai, approval, payroll, SP, dan user management terbatas.</p>
              </div>
              <div className="rounded-2xl border p-4">
                <div className="font-semibold text-slate-900">Direktur</div>
                <p className="mt-1">Approval strategis dan akses dashboard direksi.</p>
              </div>
              <div className="rounded-2xl border p-4">
                <div className="font-semibold text-slate-900">Pegawai</div>
                <p className="mt-1">Akses personal untuk absensi, cuti, slip gaji, dan dokumen sendiri.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
