"use client"

import { useState, useMemo } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Search, Filter, Download, Plus, Briefcase, Users, AlertCircle, CheckCircle2, Building2, Edit, Trash2, Loader2, Zap
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { upsertFormasi, deleteFormasi, autoGenerateFormasi } from "@/lib/actions/formasi"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function FormasiClient({ initialData, bidangList }: { initialData: any[]; bidangList: any[] }) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  
  // Modal state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    id: "",
    jabatan: "",
    bidangId: "",
    kebutuhan: 1,
  })

  const resetForm = () => setFormData({ id: "", jabatan: "", bidangId: "", kebutuhan: 1 })

  const handleEdit = (item: any) => {
    setFormData({
      id: item.id,
      jabatan: item.jabatan,
      bidangId: item.bidangId || "",
      kebutuhan: item.kebutuhan,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus formasi ini?")) return
    const res = await deleteFormasi(id)
    if (res.success) {
      toast.success("Berhasil menghapus formasi")
      router.refresh()
    } else {
      toast.error(res.error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const res = await upsertFormasi(formData)
    setIsSubmitting(false)
    if (res.success) {
      toast.success("Berhasil menyimpan formasi")
      setIsDialogOpen(false)
      resetForm()
      router.refresh()
    } else {
      toast.error(res.error)
    }
  }

  const handleAutoGenerate = async () => {
    if (!confirm("Fitur ini akan menscan seluruh Pegawai aktif dan membuatkan Formasi secara otomatis berdasarkan master data yang ada. Lanjutkan?")) return
    setIsGenerating(true)
    const res = await autoGenerateFormasi()
    setIsGenerating(false)
    if (res.success) {
      if ((res as any).count === 0) toast.info("Semua jabatan sudah ada di tabel formasi.")
      else toast.success(`Berhasil membuat ${(res as any).count} formasi baru berdasarkan data pegawai!`)
      router.refresh()
    } else {
      toast.error(res.error)
    }
  }

  const filteredData = useMemo(() => {
    return initialData.filter((item) => {
      const matchSearch = item.jabatan.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.bidang?.nama || "").toLowerCase().includes(searchTerm.toLowerCase())
      const matchStatus = statusFilter === "all" || item.statusEnum === statusFilter
      return matchSearch && matchStatus
    })
  }, [initialData, searchTerm, statusFilter])

  const totalKebutuhan = initialData.reduce((acc, item) => acc + item.kebutuhan, 0)
  const totalTerisi = initialData.reduce((acc, item) => acc + item.terisi, 0)
  const totalKosong = initialData.reduce((acc, item) => acc + item.kosong, 0)
  const persentaseTerisi = totalKebutuhan ? Math.round((totalTerisi / totalKebutuhan) * 100) : 0

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex-1 sidebar-offset">
        <TopBar breadcrumb={["Kepegawaian", "Formasi Jabatan"]} />
        <main className="p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Formasi Jabatan</h1>
              <p className="text-sm text-muted-foreground">
                Kelola formasi dan kebutuhan pegawai secara aktual
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleAutoGenerate} disabled={isGenerating} className="gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-900">
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                Auto-Generate
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={(val) => {
                if (!val) resetForm()
                setIsDialogOpen(val)
              }}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Tambah Formasi
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{formData.id ? "Edit Formasi" : "Tambah Formasi Baru"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nama Jabatan</label>
                      <Input required value={formData.jabatan} onChange={e => setFormData({...formData, jabatan: e.target.value})} placeholder="Contoh: Manager Operasional" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Unit Kerja / Bidang</label>
                      <Select required value={formData.bidangId} onValueChange={v => setFormData({...formData, bidangId: v})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih unit kerja" />
                        </SelectTrigger>
                        <SelectContent>
                          {bidangList.map(b => (
                            <SelectItem key={b.id} value={b.id}>{b.nama}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Kebutuhan (Kuota)</label>
                      <Input type="number" min={1} required value={formData.kebutuhan} onChange={e => setFormData({...formData, kebutuhan: parseInt(e.target.value) || 1})} />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Simpan
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                    <Briefcase className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalKebutuhan}</p>
                    <p className="text-xs text-muted-foreground">Total Formasi Target</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                    <Users className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalTerisi}</p>
                    <p className="text-xs text-muted-foreground">Pegawai Saat Ini</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalKosong}</p>
                    <p className="text-xs text-muted-foreground">Posisi Kosong</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tingkat Terpenuhi</span>
                    <span className="font-semibold">{Math.min(100, persentaseTerisi)}%</span>
                  </div>
                  <Progress value={Math.min(100, persentaseTerisi)} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Cari jabatan atau unit..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="penuh">Penuh</SelectItem>
                  <SelectItem value="kurang">Kurang</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daftar Formasi Jabatan Live</CardTitle>
              <CardDescription>
                Pencocokan ketersediaan pegawai dengan target formasi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jabatan</TableHead>
                    <TableHead>Unit Kerja</TableHead>
                    <TableHead className="text-center">Kebutuhan</TableHead>
                    <TableHead className="text-center">Saat Ini (Terisi) </TableHead>
                    <TableHead className="text-center">Kurang</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 justify-center text-center text-muted-foreground italic">
                        Belum ada data formasi jabatan terecord.
                      </TableCell>
                    </TableRow>
                  ) : filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{item.jabatan}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{item.bidang?.nama || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">{item.kebutuhan}</TableCell>
                      <TableCell className="text-center text-emerald-600 font-bold">{item.terisi}</TableCell>
                      <TableCell className="text-center text-amber-600 font-bold">{item.kosong}</TableCell>
                      <TableCell>
                        <div className="w-24">
                          <Progress value={Math.min(100, (item.terisi / item.kebutuhan) * 100)} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.statusEnum === "penuh" ? (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Penuh
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            <AlertCircle className="mr-1 h-3 w-3" /> Kurang
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
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
    </div>
  )
}
