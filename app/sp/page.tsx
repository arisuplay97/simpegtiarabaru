"use client"

import React, { useEffect, useCallback } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { useSession } from "next-auth/react"
import { hasPermission } from "@/lib/auth/permissions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { getSPList, saveSP, deleteSP, getPegawaiForSP } from "@/lib/actions/sp"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Plus, Search, Trash2, Edit } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TopBar } from "@/components/simpeg/top-bar"

type SPStatus = "Tidak Ada SP" | "SP1" | "SP2" | "SP3" | string

function statusClass(status: SPStatus) {
  if (status === "SP1") return "bg-amber-100 text-amber-800"
  if (status === "SP2") return "bg-orange-100 text-orange-800"
  if (status === "SP3") return "bg-red-100 text-red-800"
  return "bg-slate-100 text-slate-700"
}

export default function SPPage() {
  const { data: session } = useSession()
  const user = session?.user
  // For safety, only HRD or SUPERADMIN can manage SP completely. 
  // Others can view their own, but since this page shows everyone, let's limit it to HRD/ADMIN or people with sp.manage
  const isHRD = user?.role === "HRD" || user?.role === "SUPERADMIN"
  const canView = isHRD || hasPermission(user?.role, "sp.view")
  const canManage = isHRD || hasPermission(user?.role, "sp.manage")

  const [rows, setRows] = React.useState<any[]>([])
  const [pegawaiList, setPegawaiList] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<any | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  
  const [form, setForm] = React.useState({
    pegawaiId: "",
    tingkat: "SP1",
    tanggalDiberikan: "",
    tanggalBerakhir: "",
    alasan: "",
  })

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const spLists = await getSPList()
      setRows(spLists)
      if (canManage) {
        const pList = await getPegawaiForSP()
        setPegawaiList(pList)
      }
    } catch (e: any) {
      toast.error(e.message || "Gagal memuat Surat Peringatan")
    } finally {
      setIsLoading(false)
    }
  }, [canManage])

  useEffect(() => {
    if (canView) {
      loadData()
    }
  }, [loadData, canView])

  if (!canView) return null

  const filteredRows = rows.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.nik.includes(searchTerm)
  )

  const resetForm = () => {
    setEditing(null)
    setForm({ 
      pegawaiId: "", 
      tingkat: "SP1", 
      tanggalDiberikan: new Date().toISOString().split('T')[0], 
      tanggalBerakhir: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +90 days default
      alasan: "" 
    })
  }

  const handleEdit = (item: any) => {
    setEditing(item)
    setForm({
      pegawaiId: item.id,
      tingkat: item.status !== "Tidak Ada SP" ? item.status : "SP1",
      tanggalDiberikan: item.issuedAt !== "-" ? item.issuedAt : new Date().toISOString().split('T')[0],
      tanggalBerakhir: item.expiredAt !== "-" ? item.expiredAt : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      alasan: item.reason !== "Tidak ada catatan pelanggaran aktif" ? item.reason : ""
    })
    setOpen(true)
  }

  const handleDelete = async (spId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus catatan SP ini?")) return
    try {
       const res = await deleteSP(spId)
       if(res.error) throw new Error(res.error)
       toast.success("Catatan SP berhasil dihapus")
       loadData()
    } catch (e: any) {
       toast.error(e.message || "Gagal menghapus")
    }
  }

  const save = async () => {
    if (!form.pegawaiId || !form.tingkat || !form.tanggalDiberikan || !form.tanggalBerakhir) {
      toast.error("Pegawai, Tingkat, dan Tanggal wajib diisi")
      return
    }
    setIsSubmitting(true)
    try {
      const payload = {
         spId: editing?.spId || undefined,
         pegawaiId: form.pegawaiId,
         tingkat: form.tingkat,
         tanggalDiberikan: form.tanggalDiberikan,
         tanggalBerakhir: form.tanggalBerakhir,
         alasan: form.alasan
      }
      
      const res = await saveSP(payload)
      if (res.error) throw new Error(res.error)
      
      toast.success(`SP berhasil ${editing?.spId ? 'diperbarui' : 'ditambahkan'}`)
      setOpen(false)
      loadData()
      resetForm()
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan SP")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Kepegawaian", "Surat Peringatan (SP)"]} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">SP / Surat Peringatan</h1>
                <p className="text-sm text-slate-500">
                  Kelola dan monitor status SP1, SP2, SP3, masa berlaku, dan catatan indisipliner.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Cari nama atau NIK..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-full sm:w-[250px] bg-white"
                  />
                </div>
                {canManage && (
                  <Button onClick={() => { resetForm(); setOpen(true) }} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Beri SP Baru
                  </Button>
                )}
              </div>
            </div>

            <Card className="border-slate-200">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Nama Pegawai</TableHead>
                      <TableHead>Jabatan & Unit</TableHead>
                      <TableHead>Status Aktif</TableHead>
                      <TableHead>Masa Berlaku</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={5} className="h-32 text-center text-slate-500">Memuat data...</TableCell></TableRow>
                    ) : filteredRows.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="h-32 text-center text-slate-500">Tidak ada data Surat Peringatan ditemukan.</TableCell></TableRow>
                    ) : (
                      filteredRows.map((item) => (
                        <TableRow key={item.id} className="hover:bg-slate-50/50">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900">{item.name}</span>
                              <span className="text-xs text-muted-foreground font-mono">{item.nik}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-medium text-slate-700">{item.jabatan}</span>
                              <span className="text-xs text-slate-500">{item.unit}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 items-start">
                              <Badge variant="outline" className={`${statusClass(item.status)} border-transparent font-medium`}>
                                {item.status}
                              </Badge>
                              {item.status !== "Tidak Ada SP" && (
                                <span className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate" title={item.reason}>
                                  {item.reason}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.status !== "Tidak Ada SP" ? (
                              <div className="flex flex-col text-sm">
                                <span className="text-slate-600">Berlaku dari: <span className="font-medium text-slate-900">{item.issuedAt}</span></span>
                                <span className="text-slate-600">S/d Tanggal: <span className="font-medium text-red-600">{item.expiredAt}</span></span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                           {canManage && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEdit(item)}>
                                    <Edit className="h-4 w-4 mr-2" /> {item.status !== "Tidak Ada SP" ? "Edit SP" : "Beri SP"}
                                  </DropdownMenuItem>
                                  {item.spId && (
                                    <DropdownMenuItem onClick={() => handleDelete(item.spId)} className="text-red-600 focus:bg-red-50 focus:text-red-700">
                                      <Trash2 className="h-4 w-4 mr-2" /> Hapus Cabut SP
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                           )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Dialog Form */}
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editing?.spId ? "Edit Surat Peringatan" : "Berikan SP Baru"}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pegawai</label>
                    <Select 
                       value={form.pegawaiId} 
                       onValueChange={(val) => setForm({...form, pegawaiId: val})}
                       disabled={!!editing?.spId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Pegawai" />
                      </SelectTrigger>
                      <SelectContent>
                        {pegawaiList.map(p => (
                           <SelectItem key={p.id} value={p.id}>{p.name} - {p.nik}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tingkat SP</label>
                    <Select value={form.tingkat} onValueChange={(val) => setForm({ ...form, tingkat: val })}>
                      <SelectTrigger><SelectValue placeholder="Tingkatan" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SP1">SP1 (Peringatan Pertama)</SelectItem>
                        <SelectItem value="SP2">SP2 (Peringatan Kedua)</SelectItem>
                        <SelectItem value="SP3">SP3 (Peringatan Ketiga)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tgl Diberikan</label>
                      <Input 
                        type="date" 
                        value={form.tanggalDiberikan} 
                        onChange={(e) => setForm({ ...form, tanggalDiberikan: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-red-600">Tgl Berakhir</label>
                      <Input 
                        type="date" 
                        value={form.tanggalBerakhir} 
                        onChange={(e) => setForm({ ...form, tanggalBerakhir: e.target.value })} 
                        className="border-red-200 focus-visible:ring-red-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Alasan / Catatan Pelanggaran</label>
                    <Textarea 
                      placeholder="Penjelasan deskriptif mengenai sanksi indisipliner..." 
                      className="resize-none"
                      rows={3}
                      value={form.alasan} 
                      onChange={(e) => setForm({ ...form, alasan: e.target.value })} 
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                  <Button onClick={save} disabled={isSubmitting} className="bg-primary">
                    {isSubmitting ? "Menyimpan..." : "Simpan Data SP"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
          </div>
        </main>
      </div>
    </div>
  )
}
