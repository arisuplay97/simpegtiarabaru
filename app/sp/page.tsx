"use client"

import React from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { useSession } from "next-auth/react"
import { hasPermission } from "@/lib/auth/permissions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

type SPStatus = "Tidak Ada SP" | "SP1" | "SP2" | "SP3"

interface SPItem {
  id: string
  name: string
  nik: string
  jabatan: string
  unit: string
  status: SPStatus
  issuedAt: string
  expiredAt: string
  reason: string
}

const initialData: SPItem[] = [
  {
    id: "sp-1",
    name: "Rizki Hidayat",
    nik: "5271011209900101",
    jabatan: "Staf Operasional",
    unit: "Cabang Praya",
    status: "SP1",
    issuedAt: "2026-03-10",
    expiredAt: "2026-06-10",
    reason: "Pelanggaran disiplin keterlambatan berulang",
  },
  {
    id: "sp-2",
    name: "Maya Putri",
    nik: "5271011209900102",
    jabatan: "Admin Pelayanan",
    unit: "Unit Pelayanan Barat",
    status: "SP2",
    issuedAt: "2026-02-18",
    expiredAt: "2026-05-18",
    reason: "Ketidakhadiran tanpa keterangan",
  },
  {
    id: "sp-3",
    name: "Andi Saputra",
    nik: "5271011209900103",
    jabatan: "Teknisi Jaringan",
    unit: "Distribusi",
    status: "Tidak Ada SP",
    issuedAt: "-",
    expiredAt: "-",
    reason: "Tidak ada catatan pelanggaran aktif",
  },
]

function statusClass(status: SPStatus) {
  if (status === "SP1") return "bg-amber-50 text-amber-700"
  if (status === "SP2") return "bg-orange-50 text-orange-700"
  if (status === "SP3") return "bg-red-50 text-red-700"
  return "bg-slate-100 text-slate-700"
}

export default function SPPage() {
  const { data: session } = useSession()
  const user = session?.user
  const can = (permission: string) => hasPermission(user?.role, permission)
  const [rows, setRows] = React.useState<SPItem[]>(initialData)
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<SPItem | null>(null)
  const [form, setForm] = React.useState<SPItem>({
    id: "",
    name: "",
    nik: "",
    jabatan: "",
    unit: "",
    status: "SP1",
    issuedAt: "",
    expiredAt: "",
    reason: "",
  })

  if (!can("sp.view")) return null

  const resetForm = () => {
    setEditing(null)
    setForm({ id: "", name: "", nik: "", jabatan: "", unit: "", status: "SP1", issuedAt: "", expiredAt: "", reason: "" })
  }

  const save = () => {
    if (!form.name || !form.nik || !form.status) {
      toast.error("Nama, NIK, dan status SP wajib diisi")
      return
    }
    if (editing) {
      setRows((prev) => prev.map((item) => (item.id === editing.id ? { ...form } : item)))
      toast.success("Status SP berhasil diperbarui")
    } else {
      setRows((prev) => [...prev, { ...form, id: `sp-${Date.now()}` }])
      toast.success("SP berhasil ditambahkan")
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
            <h1 className="text-2xl font-bold text-slate-900">SP / Surat Peringatan</h1>
            <p className="text-sm text-slate-500">Kelola status SP1, SP2, SP3, masa berlaku, dan catatan HRD.</p>
          </div>
          {can("sp.manage") && (
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>Tambah SP</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>{editing ? "Edit SP" : "Tambah SP"}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input placeholder="Nama pegawai" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <Input placeholder="NIK 16 digit" value={form.nik} onChange={(e) => setForm({ ...form, nik: e.target.value })} />
                  <Input placeholder="Jabatan" value={form.jabatan} onChange={(e) => setForm({ ...form, jabatan: e.target.value })} />
                  <Input placeholder="Unit kerja" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                  <Select value={form.status} onValueChange={(value: SPStatus) => setForm({ ...form, status: value })}>
                    <SelectTrigger><SelectValue placeholder="Status SP" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tidak Ada SP">Tidak Ada SP</SelectItem>
                      <SelectItem value="SP1">SP1</SelectItem>
                      <SelectItem value="SP2">SP2</SelectItem>
                      <SelectItem value="SP3">SP3</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="date" value={form.issuedAt} onChange={(e) => setForm({ ...form, issuedAt: e.target.value })} />
                  <Input type="date" value={form.expiredAt} onChange={(e) => setForm({ ...form, expiredAt: e.target.value })} />
                  <div className="md:col-span-2">
                    <Input placeholder="Alasan / keterangan" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                  <Button onClick={save}>{editing ? "Simpan Perubahan" : "Tambah SP"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Surat Peringatan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rows.map((row) => (
              <div key={row.id} className="flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{row.name}</div>
                  <div className="mt-1 text-sm text-slate-500">{row.nik} • {row.jabatan} • {row.unit}</div>
                  <div className="mt-1 text-xs text-slate-400">Terbit: {row.issuedAt} • Berlaku sampai: {row.expiredAt}</div>
                  <div className="mt-2 text-sm text-slate-600">{row.reason}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(row.status)}`}>{row.status}</span>
                  <Button variant="outline" size="sm" onClick={() => toast.success(`Detail ${row.name} dibuka (dummy)`) }>Detail</Button>
                  {can("sp.manage") && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => { setEditing(row); setForm(row); setOpen(true) }}>Edit</Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRows((prev) => prev.map((item) => item.id === row.id ? { ...item, status: "Tidak Ada SP", reason: "SP dicabut oleh HRD", issuedAt: "-", expiredAt: "-" } : item))
                          toast.success(`SP ${row.name} berhasil dicabut`)
                        }}
                      >
                        Cabut SP
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
