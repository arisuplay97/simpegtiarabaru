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
              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoGenerate}
                disabled={isGenerating}
                className="gap-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 shadow-2xs font-semibold text-xs"
              >
                {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5 text-amber-500" />}
                Auto-Generate Formasi
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={(val) => {
                if (!val) resetForm()
                setIsDialogOpen(val)
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs">
                    <Plus className="h-3.5 w-3.5" /> Tambah Formasi
                  </Button>
                </DialogTrigger>
                <DialogContent className="border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                  <DialogHeader>
                    <DialogTitle className="text-slate-900 dark:text-zinc-100">{formData.id ? "Edit Formasi Jabatan" : "Tambah Formasi Baru"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Nama Jabatan</label>
                      <Input required value={formData.jabatan} onChange={e => setFormData({...formData, jabatan: e.target.value})} placeholder="Contoh: Manager Operasional" className="bg-slate-50/50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Unit Kerja / Bagian</label>
                      <Select required value={formData.bidangId} onValueChange={v => setFormData({...formData, bidangId: v})}>
                        <SelectTrigger className="bg-slate-50/50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs">
                          <SelectValue placeholder="Pilih unit kerja..." />
                        </SelectTrigger>
                        <SelectContent className="border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                          {bidangList.map(b => (
                            <SelectItem key={b.id} value={b.id}>{b.nama}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Kebutuhan (Kuota Pegawai)</label>
                      <Input type="number" min={1} required value={formData.kebutuhan} onChange={e => setFormData({...formData, kebutuhan: parseInt(e.target.value) || 1})} className="bg-slate-50/50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs font-mono" />
                    </div>
                    <DialogFooter className="pt-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                      <Button type="submit" size="sm" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null} Simpan
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Quick KPI Cards */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-4 shadow-2xs transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Total Kebutuhan Target</span>
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/50">
                  <Briefcase className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-zinc-100">{totalKebutuhan.toLocaleString('id-ID')}</p>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">Formasi jabatan di seluruh divisi</p>
            </div>

            <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-4 shadow-2xs transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Pegawai Aktif Saat Ini</span>
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/50">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-zinc-100">{totalTerisi.toLocaleString('id-ID')}</p>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">Staf telah teralokasi ke jabatan</p>
            </div>

            <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-4 shadow-2xs transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Posisi Kosong / Belum Terisi</span>
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/50">
                  <AlertCircle className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold font-mono tracking-tight text-amber-600 dark:text-amber-400">{totalKosong.toLocaleString('id-ID')}</p>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">Kebutuhan kuota yang masih terbuka</p>
            </div>

            <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-4 shadow-2xs transition-colors flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Rasio Keterpenuhan</span>
                <span className="font-bold font-mono text-sm text-blue-600 dark:text-blue-400">{persentaseTerisi}%</span>
              </div>
              <div className="space-y-1.5 mt-2">
                <Progress value={Math.min(100, persentaseTerisi)} className="h-2 bg-slate-100 dark:bg-zinc-800" />
                <p className="text-[11px] text-slate-400 dark:text-zinc-500">{totalTerisi} dari {totalKebutuhan} posisi terisi</p>
              </div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Cari jabatan atau unit kerja..."
                className="pl-9 h-9 text-xs bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 h-9 text-xs bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                  <SelectValue placeholder="Status Formasi" />
                </SelectTrigger>
                <SelectContent className="border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="penuh">Terpenuhi</SelectItem>
                  <SelectItem value="kurang">Kurang (Lowong)</SelectItem>
                  <SelectItem value="lebih">Kelebihan (Surplus)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Formasi Table */}
          <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 shadow-2xs overflow-hidden">
            <div className="p-4 sm:px-6 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Daftar Formasi Jabatan Live</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Sinkronisasi ketersediaan aktual pegawai dengan kuota formasi</p>
              </div>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                {filteredData.length} Posisi
              </span>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/60 dark:bg-zinc-900 border-slate-100 dark:border-zinc-800">
                  <TableHead className="text-xs font-semibold">Jabatan</TableHead>
                  <TableHead className="text-xs font-semibold">Unit Kerja</TableHead>
                  <TableHead className="text-xs font-semibold text-center">Target Kuota</TableHead>
                  <TableHead className="text-xs font-semibold text-center">Terisi</TableHead>
                  <TableHead className="text-xs font-semibold text-center">Selisih</TableHead>
                  <TableHead className="text-xs font-semibold">Progress</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-slate-400 dark:text-zinc-500 text-xs italic">
                      Tidak ada formasi jabatan yang cocok dengan kriteria pencarian.
                    </TableCell>
                  </TableRow>
                ) : filteredData.map((item) => {
                  const pct = item.kebutuhan > 0 ? Math.min(100, Math.round((item.terisi / item.kebutuhan) * 100)) : 0
                  return (
                    <TableRow key={item.id} className="border-slate-100 dark:border-zinc-800/80 hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                            <Briefcase className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-semibold text-xs text-slate-900 dark:text-zinc-100">{item.jabatan}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-400">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          <span>{item.bidang?.nama || "Semua Bagian"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold font-mono text-xs text-slate-900 dark:text-zinc-100">{item.kebutuhan}</TableCell>
                      <TableCell className="text-center font-bold font-mono text-xs text-emerald-600 dark:text-emerald-400">{item.terisi}</TableCell>
                      <TableCell className="text-center font-bold font-mono text-xs">
                        {item.kosong > 0 ? (
                          <span className="text-amber-600 dark:text-amber-400">-{item.kosong}</span>
                        ) : item.terisi > item.kebutuhan ? (
                          <span className="text-blue-600 dark:text-blue-400">+{item.terisi - item.kebutuhan}</span>
                        ) : (
                          <span className="text-slate-400 dark:text-zinc-500">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="w-24 space-y-1">
                          <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                            <span>{pct}%</span>
                          </div>
                          <Progress value={pct} className="h-1.5 bg-slate-100 dark:bg-zinc-800" />
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.statusEnum === "penuh" ? (
                          <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60 text-[11px] font-semibold gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Terpenuhi
                          </Badge>
                        ) : item.statusEnum === "lebih" ? (
                          <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60 text-[11px] font-semibold gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Lebih (+{item.terisi - item.kebutuhan})
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60 text-[11px] font-semibold gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Kurang {item.kosong}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100" onClick={() => handleEdit(item)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </main>
      </div>
    </div>
  )
}
