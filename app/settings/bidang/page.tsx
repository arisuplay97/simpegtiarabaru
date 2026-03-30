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
import { Building2, Plus, Edit2, Trash2, Loader2, CheckCircle2, XCircle, Search, Layers } from "lucide-react"
import { toast } from "sonner"
import { getBidang, createBidang, updateBidang, deleteBidang, createSubBidang, updateSubBidang, deleteSubBidang } from "@/lib/actions/pegawai"

interface SubBidangItem {
  id: string
  nama: string
  bidangId: string
}

export default function BidangSettingsPage() {
  const [bidang, setBidang] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [deletingItem, setDeletingItem] = useState<any>(null)

  // Sub Bidang dialog state
  const [showSubDialog, setShowSubDialog] = useState(false)
  const [showDeleteSubDialog, setShowDeleteSubDialog] = useState(false)
  const [editingSubBidang, setEditingSubBidang] = useState<SubBidangItem | null>(null)
  const [deletingSubBidang, setDeletingSubBidang] = useState<SubBidangItem | null>(null)
  const [subBidangParentId, setSubBidangParentId] = useState("")
  const [subBidangForm, setSubBidangForm] = useState({ nama: "" })

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
      // Tambahkan subBidang array jika belum ada
      const dataWithSub = (data || []).map((b: any) => ({
        ...b,
        subBidang: b.subBidang || [],
      }))
      setBidang(dataWithSub)
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

  // ============ SUB BIDANG HANDLERS ============
  const handleOpenAddSub = (bidangId: string) => {
    setEditingSubBidang(null)
    setSubBidangParentId(bidangId)
    setSubBidangForm({ nama: "" })
    setShowSubDialog(true)
  }

  const handleOpenEditSub = (sub: SubBidangItem) => {
    setEditingSubBidang(sub)
    setSubBidangParentId(sub.bidangId)
    setSubBidangForm({ nama: sub.nama })
    setShowSubDialog(true)
  }

  const handleSaveSub = async () => {
    if (!subBidangForm.nama.trim()) {
      toast.error("Nama sub bidang wajib diisi")
      return
    }
    setIsLoading(true)
    try {
      if (editingSubBidang) {
        await updateSubBidang(editingSubBidang.id, { nama: subBidangForm.nama })
        toast.success("Sub Bidang berhasil diperbarui")
      } else {
        await createSubBidang({ nama: subBidangForm.nama, bidangId: subBidangParentId })
        toast.success("Sub Bidang berhasil ditambahkan")
      }
      await loadData()
      setShowSubDialog(false)
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan sub bidang")
    }
    setIsLoading(false)
  }

  const handleDeleteSub = async () => {
    if (!deletingSubBidang) return
    setIsLoading(true)
    try {
      await deleteSubBidang(deletingSubBidang.id)
      toast.success(`Sub Bidang ${deletingSubBidang.nama} berhasil dihapus`)
      await loadData()
      setShowDeleteSubDialog(false)
      setDeletingSubBidang(null)
    } catch (e: any) {
      toast.error(e.message || "Gagal menghapus sub bidang")
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
              <h1 className="text-2xl font-bold">Kelola Bidang & Sub Bidang</h1>
              <p className="text-sm text-muted-foreground">Atur master data unit kerja, struktural, dan sub bidang</p>
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

          {/* Bidang Cards with Accordion for Sub Bidang */}
          <div className="space-y-4">
            {isFetching ? (
              <Card className="card-premium">
                <CardContent className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
              </Card>
            ) : filtered.length === 0 ? (
              <Card className="card-premium">
                <CardContent className="flex flex-col items-center justify-center h-32 gap-2">
                  <Building2 className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-muted-foreground">Tidak ada data bidang ditemukan.</p>
                </CardContent>
              </Card>
            ) : filtered.map(item => (
              <Card key={item.id} className="card-premium">
                <CardContent className="p-0">
                  {/* Header row */}
                  <div className="flex items-center justify-between p-4 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{item.nama}</p>
                          <Badge variant="secondary" className="font-mono text-[10px]">{item.kode}</Badge>
                          <Badge variant="outline" className={item.aktif ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"}>
                            {item.aktif ? "Aktif" : "Non-Aktif"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Kepala: {item.kepalaBidang || "-"} · Direktur: {item.direkturAtasan || "-"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleOpenEdit(item)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setDeletingItem(item); setShowDeleteDialog(true) }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Sub Bidang Section */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Sub Bidang ({(item.subBidang || []).length})
                        </span>
                      </div>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => handleOpenAddSub(item.id)}>
                        <Plus className="h-3 w-3" /> Tambah Sub
                      </Button>
                    </div>
                    {(item.subBidang || []).length === 0 ? (
                      <p className="text-xs text-muted-foreground italic pl-6">Belum ada sub bidang</p>
                    ) : (
                      <div className="space-y-1.5 pl-6">
                        {(item.subBidang || []).map((sub: SubBidangItem) => (
                          <div key={sub.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-primary/60" />
                              <span className="text-sm">{sub.nama}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenEditSub(sub)}>
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setDeletingSubBidang(sub); setShowDeleteSubDialog(true) }}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>

      {/* ===== DIALOG TAMBAH / EDIT BIDANG ===== */}
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
                  <SelectItem value="Direktur Umum & Keuangan">Direktur Umum & Keuangan</SelectItem>
                  <SelectItem value="Direktur Operasional">Direktur Operasional</SelectItem>
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

      {/* ===== DIALOG TAMBAH / EDIT SUB BIDANG ===== */}
      <Dialog open={showSubDialog} onOpenChange={setShowSubDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSubBidang ? "Edit Sub Bidang" : "Tambah Sub Bidang"}</DialogTitle>
            <DialogDescription>
              {editingSubBidang ? "Ubah nama sub bidang." : "Tambahkan sub bidang baru ke bidang ini."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nama Sub Bidang *</Label>
              <Input 
                value={subBidangForm.nama} 
                onChange={e => setSubBidangForm({ nama: e.target.value })} 
                placeholder="Contoh: Pengembangan Aplikasi" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubDialog(false)}>Batal</Button>
            <Button onClick={handleSaveSub} disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</> : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DIALOG HAPUS BIDANG ===== */}
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

      {/* ===== DIALOG HAPUS SUB BIDANG ===== */}
      <AlertDialog open={showDeleteSubDialog} onOpenChange={setShowDeleteSubDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Sub Bidang?</AlertDialogTitle>
            <AlertDialogDescription>
              Sub Bidang <strong>{deletingSubBidang?.nama}</strong> akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSub} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
