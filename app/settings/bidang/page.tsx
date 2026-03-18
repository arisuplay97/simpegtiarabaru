"use client"

import { useState, useEffect } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
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
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Building2, Plus, Edit2, Trash2, Loader2, CheckCircle2, XCircle, Search } from "lucide-react"
import { toast } from "sonner"
import { getBidang, createBidang, updateBidang, deleteBidang } from "@/lib/actions/pegawai"

export default function BidangSettingsPage() {
  const [bidang, setBidang] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [deletingItem, setDeletingItem] = useState<any>(null)

  const [form, setForm] = useState({
    nama: "",
    kode: "",
    kepalaBidang: "",
    direkturAtasan: "",
    aktif: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsFetching(true)
    try {
      const data = await getBidang()
      setBidang(data)
    } catch (error) {
      toast.error("Gagal mengambil data bidang")
    } finally {
      setIsFetching(false)
    }
  }

  const handleOpenAdd = () => {
    setEditingItem(null)
    setForm({ nama: "", kode: "", kepalaBidang: "", direkturAtasan: "", aktif: true })
    setShowDialog(true)
  }

  const handleOpenEdit = (item: any) => {
    setEditingItem(item)
    setForm({
      nama: item.nama,
      kode: item.kode,
      kepalaBidang: item.kepalaBidang || "",
      direkturAtasan: item.direkturAtasan || "",
      aktif: item.aktif
    })
    setShowDialog(true)
  }

  const validate = () => {
    if (!form.nama || !form.kode) {
      toast.error("Nama dan Kode wajib diisi")
      return false
    }
    return true
  }

  const handleSave = async () => {
    if (!validate()) return
    setIsLoading(true)
    try {
      if (editingItem) {
        await updateBidang(editingItem.id, form)
        toast.success(`Bidang ${form.nama} berhasil diperbarui`)
      } else {
        await createBidang(form)
        toast.success(`Bidang ${form.nama} berhasil ditambahkan`)
      }
      await loadData()
      setShowDialog(false)
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan bidang")
    }
    setIsLoading(false)
  }

  const handleDelete = async () => {
    if (!deletingItem) return
    setIsLoading(true)
    try {
      await deleteBidang(deletingItem.id)
      toast.success(`Bidang ${deletingItem.nama} berhasil dihapus`)
      await loadData()
      setShowDeleteDialog(false)
      setDeletingItem(null)
    } catch (e: any) {
      toast.error(e.message || "Gagal menghapus bidang")
    }
    setIsLoading(false)
  }

  const filtered = bidang.filter(b => 
    b.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.kode.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Pengaturan", "Kelola Bidang"]} />
        <main className="flex-1 overflow-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Kelola Bidang</h1>
              <p className="text-sm text-muted-foreground">Atur master data unit kerja dan struktural</p>
            </div>
            <Button className="gap-2" onClick={handleOpenAdd}>
              <Plus className="h-4 w-4" /> Tambah Bidang
            </Button>
          </div>

          <div className="mb-6 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Cari nama atau kode bidang..." 
                className="pl-10"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Card className="card-premium">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Bidang</TableHead>
                    <TableHead>Kode</TableHead>
                    <TableHead>Kepala Bidang</TableHead>
                    <TableHead>Direktur Atasan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isFetching ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        Tidak ada data bidang.
                      </TableCell>
                    </TableRow>
                  ) : filtered.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-sm">{item.nama}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-[10px]">{item.kode}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{item.kepalaBidang || "-"}</TableCell>
                      <TableCell className="text-sm">{item.direkturAtasan || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={item.aktif ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"}>
                          {item.aktif ? "Aktif" : "Non-Aktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleOpenEdit(item)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setDeletingItem(item); setShowDeleteDialog(true) }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Bidang" : "Tambah Bidang Baru"}</DialogTitle>
            <DialogDescription>Lengkapi data bidang di bawah ini.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nama Bidang *</Label>
              <Input value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} placeholder="Contoh: IT & Sistem" />
            </div>
            <div className="space-y-2">
              <Label>Kode Bidang *</Label>
              <Input value={form.kode} onChange={e => setForm({...form, kode: e.target.value})} placeholder="Contoh: IT" />
            </div>
            <div className="space-y-2">
              <Label>Kepala Bidang</Label>
              <Input value={form.kepalaBidang} onChange={e => setForm({...form, kepalaBidang: e.target.value})} placeholder="Nama Pejabat" />
            </div>
            <div className="space-y-2">
              <Label>Direktur Atasan</Label>
              <Select value={form.direkturAtasan} onValueChange={v => setForm({...form, direkturAtasan: v})}>
                <SelectTrigger><SelectValue placeholder="Pilih Direktur" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Direktur Utama">Direktur Utama</SelectItem>
                  <SelectItem value="Direktur Pengembangan & Usaha">Direktur Pengembangan & Usaha</SelectItem>
                  <SelectItem value="Direktur Umum">Direktur Umum</SelectItem>
                  <SelectItem value="Direktur Teknik">Direktur Teknik</SelectItem>
                  <SelectItem value="Dewan Pengawas">Dewan Pengawas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input 
                type="checkbox" 
                id="aktif" 
                checked={form.aktif} 
                onChange={e => setForm({...form, aktif: e.target.checked})}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="aktif">Bidang Aktif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Bidang?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Bidang <strong>{deletingItem?.nama}</strong> akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : "Ya, Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
