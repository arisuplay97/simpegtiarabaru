"use client"
import { useState } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
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
import {
  MapPin, Plus, Edit, Trash2, Building2,
  Calendar, Navigation, Loader2, ExternalLink,
  Info, Radio,
} from "lucide-react"
import { toast } from "sonner"
import {
  lokasiData as initialData,
  type LokasiAbsensi,
  type TipeLokasi,
} from "@/lib/data/lokasi-store"

const tipeConfig: Record<TipeLokasi, { label: string; className: string }> = {
  kantor_pusat: { label: "Kantor Pusat", className: "bg-primary/10 text-primary" },
  kantor_cabang: { label: "Kantor Cabang", className: "bg-blue-100 text-blue-700" },
  acara:         { label: "Acara / Event", className: "bg-purple-100 text-purple-700" },
}

const defaultForm = {
  nama: "", tipe: "kantor_cabang" as TipeLokasi,
  alamat: "", latitude: "", longitude: "",
  radius: "100", aktif: true,
  tanggalMulai: "", tanggalSelesai: "",
  wajibHadir: false, keterangan: "",
}

export default function LokasiAbsensiPage() {
  const [lokasi, setLokasi] = useState<LokasiAbsensi[]>(initialData)
  const [activeTab, setActiveTab] = useState("semua")
  const [showDialog, setShowDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<LokasiAbsensi | null>(null)
  const [deletingItem, setDeletingItem] = useState<LokasiAbsensi | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const filtered = lokasi.filter(l => {
    if (activeTab === "kantor") return l.tipe !== "acara"
    if (activeTab === "acara") return l.tipe === "acara"
    return true
  })

  const stats = {
    total: lokasi.length,
    pusat: lokasi.filter(l => l.tipe === "kantor_pusat").length,
    cabang: lokasi.filter(l => l.tipe === "kantor_cabang").length,
    acara: lokasi.filter(l => l.tipe === "acara" && l.aktif).length,
  }

  const validate = () => {
    const errors: Record<string, string> = {}
    if (!form.nama.trim()) errors.nama = "Nama lokasi wajib diisi"
    if (!form.alamat.trim()) errors.alamat = "Alamat wajib diisi"
    if (!form.latitude || isNaN(Number(form.latitude))) errors.latitude = "Latitude tidak valid"
    if (!form.longitude || isNaN(Number(form.longitude))) errors.longitude = "Longitude tidak valid"
    if (!form.radius || Number(form.radius) < 10) errors.radius = "Radius minimal 10 meter"
    if (form.tipe === "acara") {
      if (!form.tanggalMulai) errors.tanggalMulai = "Tanggal mulai wajib diisi"
      if (!form.tanggalSelesai) errors.tanggalSelesai = "Tanggal selesai wajib diisi"
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleOpenAdd = () => {
    setEditingItem(null)
    setForm(defaultForm)
    setFormErrors({})
    setShowDialog(true)
  }

  const handleOpenEdit = (item: LokasiAbsensi) => {
    setEditingItem(item)
    setForm({
      nama: item.nama, tipe: item.tipe,
      alamat: item.alamat,
      latitude: String(item.latitude),
      longitude: String(item.longitude),
      radius: String(item.radius),
      aktif: item.aktif,
      tanggalMulai: item.tanggalMulai ?? "",
      tanggalSelesai: item.tanggalSelesai ?? "",
      wajibHadir: item.wajibHadir ?? false,
      keterangan: item.keterangan ?? "",
    })
    setFormErrors({})
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!validate()) return
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 600))

    const data: LokasiAbsensi = {
      id: editingItem?.id ?? String(Date.now()),
      nama: form.nama,
      tipe: form.tipe,
      alamat: form.alamat,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      radius: Number(form.radius),
      aktif: form.aktif,
      ...(form.tipe === "acara" ? {
        tanggalMulai: form.tanggalMulai,
        tanggalSelesai: form.tanggalSelesai,
        wajibHadir: form.wajibHadir,
        keterangan: form.keterangan,
      } : {}),
    }

    if (editingItem) {
      setLokasi(prev => prev.map(l => l.id === editingItem.id ? data : l))
      toast.success(`Lokasi ${form.nama} berhasil diperbarui`)
    } else {
      setLokasi(prev => [...prev, data])
      toast.success(`Lokasi ${form.nama} berhasil ditambahkan`)
    }

    setShowDialog(false)
    setIsLoading(false)
  }

  const handleDelete = async () => {
    if (!deletingItem) return
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 500))
    setLokasi(prev => prev.filter(l => l.id !== deletingItem.id))
    toast.success(`Lokasi ${deletingItem.nama} berhasil dihapus`)
    setShowDeleteDialog(false)
    setDeletingItem(null)
    setIsLoading(false)
  }

  const handleToggleAktif = (item: LokasiAbsensi) => {
    setLokasi(prev => prev.map(l => l.id === item.id ? { ...l, aktif: !l.aktif } : l))
    toast.success(`${item.nama} ${item.aktif ? "dinonaktifkan" : "diaktifkan"}`)
  }

  // Ambil koordinat GPS dari browser
  const handleGetGPS = () => {
    if (!navigator.geolocation) { toast.error("GPS tidak tersedia"); return }
    toast.loading("Mengambil koordinat GPS...")
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(p => ({
          ...p,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }))
        toast.dismiss()
        toast.success(`Koordinat didapat! Akurasi: ${Math.round(pos.coords.accuracy)}m`)
      },
      () => { toast.dismiss(); toast.error("Gagal ambil GPS. Aktifkan lokasi browser.") }
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Pengaturan", "Lokasi Absensi"]} />
        <main className="flex-1 overflow-auto p-6">

          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Lokasi Absensi</h1>
              <p className="text-sm text-muted-foreground">
                Kelola kantor pusat, cabang, dan lokasi acara untuk geo-fencing absensi
              </p>
            </div>
            <Button size="sm" className="gap-2" onClick={handleOpenAdd}>
              <Plus className="h-4 w-4" /> Tambah Lokasi
            </Button>
          </div>

          {/* Info Box */}
          <Card className="card-premium mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Cara Kerja Geo-fencing:</p>
                  <ul className="space-y-1 list-disc list-inside text-blue-700">
                    <li>Pegawai hanya bisa absen jika berada dalam radius lokasi yang aktif</li>
                    <li>Jika ada <strong>Acara Wajib</strong> hari ini, pegawai HARUS absen di lokasi acara tersebut</li>
                    <li>Acara wajib otomatis menonaktifkan validasi lokasi kantor untuk hari tersebut</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total Lokasi",    value: stats.total,  icon: MapPin,     bg: "bg-primary/10",   color: "text-primary" },
              { label: "Kantor Pusat",    value: stats.pusat,  icon: Building2,  bg: "bg-emerald-100",  color: "text-emerald-600" },
              { label: "Kantor Cabang",   value: stats.cabang, icon: Building2,  bg: "bg-blue-100",     color: "text-blue-600" },
              { label: "Acara Aktif",     value: stats.acara,  icon: Calendar,   bg: "bg-purple-100",   color: "text-purple-600" },
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

          {/* Tabs + Tabel */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="semua">Semua ({lokasi.length})</TabsTrigger>
              <TabsTrigger value="kantor">Kantor ({stats.pusat + stats.cabang})</TabsTrigger>
              <TabsTrigger value="acara">Acara ({lokasi.filter(l => l.tipe === "acara").length})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <Card className="card-premium">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Nama Lokasi</TableHead>
                        <TableHead>Tipe</TableHead>
                        <TableHead>Koordinat</TableHead>
                        <TableHead>Radius</TableHead>
                        <TableHead>Periode</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="py-12 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <MapPin className="h-8 w-8 text-muted-foreground/50" />
                              <p className="text-muted-foreground">Tidak ada lokasi</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filtered.map(item => (
                        <TableRow key={item.id} className="hover:bg-muted/30">
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{item.nama}</p>
                              <p className="text-xs text-muted-foreground">{item.alamat}</p>
                              {item.wajibHadir && (
                                <Badge variant="outline" className="mt-1 text-[10px] bg-red-50 text-red-600 border-red-200">
                                  Wajib Hadir
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={tipeConfig[item.tipe].className}>
                              {tipeConfig[item.tipe].label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs font-mono">
                              <p>{item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</p>
                              <a
                                href={`https://maps.google.com/?q=${item.latitude},${item.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary hover:underline mt-0.5"
                              >
                                <ExternalLink className="h-3 w-3" /> Buka Maps
                              </a>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Radio className="h-3 w-3 text-primary" />
                              <span className="text-sm font-medium">{item.radius}m</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {item.tipe === "acara" && item.tanggalMulai ? (
                              <div className="text-xs">
                                <p>{item.tanggalMulai}</p>
                                <p className="text-muted-foreground">s/d {item.tanggalSelesai}</p>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Permanen</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <button onClick={() => handleToggleAktif(item)}>
                              <Badge
                                variant="outline"
                                className={`cursor-pointer ${item.aktif ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}
                              >
                                {item.aktif ? "Aktif" : "Non-aktif"}
                              </Badge>
                            </button>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(item)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost" size="icon"
                                className="h-8 w-8 text-red-500 hover:bg-red-50"
                                onClick={() => { setDeletingItem(item); setShowDeleteDialog(true) }}
                              >
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
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* ===== DIALOG TAMBAH/EDIT ===== */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? `Edit — ${editingItem.nama}` : "Tambah Lokasi Absensi"}</DialogTitle>
            <DialogDescription>Isi koordinat GPS dan radius area absensi yang diizinkan</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Nama + Tipe */}
            <div>
              <Label>Nama Lokasi *</Label>
              <Input className="mt-1" value={form.nama} onChange={e => setForm(p => ({...p, nama: e.target.value}))} placeholder="Contoh: Kantor Cabang Utara" />
              {formErrors.nama && <p className="mt-1 text-xs text-destructive">{formErrors.nama}</p>}
            </div>

            <div>
              <Label>Tipe Lokasi *</Label>
              <Select value={form.tipe} onValueChange={v => setForm(p => ({...p, tipe: v as TipeLokasi}))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kantor_pusat">Kantor Pusat</SelectItem>
                  <SelectItem value="kantor_cabang">Kantor Cabang</SelectItem>
                  <SelectItem value="acara">Acara / Event</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Alamat *</Label>
              <Textarea className="mt-1" rows={2} value={form.alamat} onChange={e => setForm(p => ({...p, alamat: e.target.value}))} placeholder="Alamat lengkap lokasi" />
              {formErrors.alamat && <p className="mt-1 text-xs text-destructive">{formErrors.alamat}</p>}
            </div>

            {/* Koordinat GPS */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Koordinat GPS *</Label>
                <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={handleGetGPS}>
                  <Navigation className="h-3 w-3" /> Ambil dari GPS
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input
                    className="font-mono text-sm"
                    placeholder="Latitude (-8.7236)"
                    value={form.latitude}
                    onChange={e => setForm(p => ({...p, latitude: e.target.value}))}
                  />
                  {formErrors.latitude && <p className="mt-1 text-xs text-destructive">{formErrors.latitude}</p>}
                </div>
                <div>
                  <Input
                    className="font-mono text-sm"
                    placeholder="Longitude (116.2934)"
                    value={form.longitude}
                    onChange={e => setForm(p => ({...p, longitude: e.target.value}))}
                  />
                  {formErrors.longitude && <p className="mt-1 text-xs text-destructive">{formErrors.longitude}</p>}
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Cara dapat koordinat: buka Google Maps → tahan lokasi → copy angka yang muncul
              </p>
              {form.latitude && form.longitude && (
                <a
                  href={`https://maps.google.com/?q=${form.latitude},${form.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" /> Cek di Google Maps
                </a>
              )}
            </div>

            {/* Radius */}
            <div>
              <Label>Radius Absensi (meter) *</Label>
              <div className="flex items-center gap-3 mt-1">
                <Input
                  type="number"
                  min="10"
                  max="1000"
                  className="w-32"
                  value={form.radius}
                  onChange={e => setForm(p => ({...p, radius: e.target.value}))}
                />
                <div className="flex gap-2">
                  {[50, 100, 200, 500].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setForm(p => ({...p, radius: String(r)}))}
                      className={`rounded-lg border px-2 py-1 text-xs transition-colors ${form.radius === String(r) ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                    >
                      {r}m
                    </button>
                  ))}
                </div>
              </div>
              {formErrors.radius && <p className="mt-1 text-xs text-destructive">{formErrors.radius}</p>}
              <p className="mt-1 text-xs text-muted-foreground">Disarankan 100m untuk kantor, 200–500m untuk area luar</p>
            </div>

            {/* Khusus Acara */}
            {form.tipe === "acara" && (
              <div className="rounded-lg bg-purple-50 border border-purple-200 p-4 space-y-3">
                <p className="text-xs font-semibold text-purple-700 uppercase">Pengaturan Acara</p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Tanggal Mulai *</Label>
                    <Input
                      className="mt-1" type="date"
                      value={form.tanggalMulai}
                      onChange={e => setForm(p => ({...p, tanggalMulai: e.target.value}))}
                    />
                    {formErrors.tanggalMulai && <p className="mt-1 text-xs text-destructive">{formErrors.tanggalMulai}</p>}
                  </div>
                  <div>
                    <Label>Tanggal Selesai *</Label>
                    <Input
                      className="mt-1" type="date"
                      value={form.tanggalSelesai}
                      onChange={e => setForm(p => ({...p, tanggalSelesai: e.target.value}))}
                    />
                    {formErrors.tanggalSelesai && <p className="mt-1 text-xs text-destructive">{formErrors.tanggalSelesai}</p>}
                  </div>
                </div>

                <div>
                  <Label>Keterangan Acara</Label>
                  <Input
                    className="mt-1"
                    value={form.keterangan}
                    onChange={e => setForm(p => ({...p, keterangan: e.target.value}))}
                    placeholder="Contoh: Apel HUT PDAM ke-45"
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg bg-white border p-3">
                  <div>
                    <p className="text-sm font-medium">Absensi Wajib di Lokasi Ini</p>
                    <p className="text-xs text-muted-foreground">Pegawai HARUS absen di sini selama periode acara</p>
                  </div>
                  <Switch
                    checked={form.wajibHadir}
                    onCheckedChange={v => setForm(p => ({...p, wajibHadir: v}))}
                  />
                </div>

                {form.wajibHadir && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                    <p className="text-xs text-red-700 font-medium">
                      ⚠️ Saat aktif: lokasi kantor dinonaktifkan sementara, semua pegawai wajib absen di sini
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Status */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Status Lokasi</p>
                <p className="text-xs text-muted-foreground">Aktif = bisa digunakan untuk absensi</p>
              </div>
              <Switch checked={form.aktif} onCheckedChange={v => setForm(p => ({...p, aktif: v}))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</>
                : editingItem ? "Simpan Perubahan" : "Tambah Lokasi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DIALOG HAPUS ===== */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Lokasi</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin menghapus lokasi <strong>{deletingItem?.nama}</strong>?
              Pegawai tidak bisa absen di lokasi ini setelah dihapus.
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
