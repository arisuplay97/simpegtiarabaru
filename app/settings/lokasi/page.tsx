"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Radio, Search, Layers, Crosshair,
  ShieldCheck, AlertTriangle
} from "lucide-react"
import { toast } from "sonner"
import {
  getLokasiList, createLokasi, updateLokasi,
  deleteLokasi, toggleLokasiAktif,
} from "@/lib/actions/lokasi"
import type { TipeLokasi } from "@/lib/data/lokasi-store"

export interface TitikFormItem {
  id: string
  nama: string
  latitude: string
  longitude: string
  radius?: string
}

const tipeBadgeConfig: Record<string, { label: string; className: string }> = {
  kantor_pusat: {
    label: "Kantor Pusat",
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/50",
  },
  kantor_cabang: {
    label: "Kantor Cabang",
    className: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-zinc-800",
  },
  acara: {
    label: "Acara / Event",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50",
  },
}

const defaultForm = {
  nama: "",
  tipe: "kantor_cabang" as TipeLokasi,
  alamat: "",
  latitude: "",
  longitude: "",
  radius: "100",
  aktif: true,
  titikTambahan: [] as TitikFormItem[],
  tanggalMulai: "",
  tanggalSelesai: "",
  wajibHadir: false,
  targetPegawai: "semua",
  keterangan: "",
}

interface LokasiItem {
  id: string
  nama: string
  tipe: string
  alamat: string
  latitude: number
  longitude: number
  radius: number
  aktif: boolean
  titikKoordinat?: any
  tanggalMulai?: string | null
  tanggalSelesai?: string | null
  wajibHadir: boolean
  targetPegawai?: string | null
  keterangan?: string | null
}

export default function LokasiAbsensiPage() {
  const [lokasi, setLokasi] = useState<LokasiItem[]>([])
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("semua")
  const [searchQuery, setSearchQuery] = useState("")

  const [showDialog, setShowDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedTitikDetail, setSelectedTitikDetail] = useState<LokasiItem | null>(null)
  const [editingItem, setEditingItem] = useState<LokasiItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<LokasiItem | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [form, setForm] = useState(defaultForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Fetch data lokasi dari database
  const fetchLokasi = useCallback(async () => {
    try {
      const data = await getLokasiList()
      setLokasi(data as LokasiItem[])
    } catch {
      toast.error("Gagal memuat data lokasi absensi")
    } finally {
      setIsPageLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLokasi()
  }, [fetchLokasi])

  // Filter lokasi
  const filtered = useMemo(() => {
    return lokasi.filter((l) => {
      // Tab filter
      if (activeTab === "kantor" && l.tipe === "acara") return false
      if (activeTab === "acara" && l.tipe !== "acara") return false

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchNama = l.nama.toLowerCase().includes(q)
        const matchAlamat = (l.alamat || "").toLowerCase().includes(q)
        return matchNama || matchAlamat
      }
      return true
    })
  }, [lokasi, activeTab, searchQuery])

  // Hitung total titik koordinat
  const totalTitikSemua = useMemo(() => {
    return lokasi.reduce((acc, curr) => {
      let extraCount = 0
      if (curr.titikKoordinat) {
        try {
          const parsed = typeof curr.titikKoordinat === "string" ? JSON.parse(curr.titikKoordinat) : curr.titikKoordinat
          if (Array.isArray(parsed)) extraCount = parsed.length
        } catch {}
      }
      return acc + 1 + extraCount
    }, 0)
  }, [lokasi])

  const stats = useMemo(() => ({
    total: lokasi.length,
    pusat: lokasi.filter((l) => l.tipe === "kantor_pusat").length,
    cabang: lokasi.filter((l) => l.tipe === "kantor_cabang").length,
    totalTitik: totalTitikSemua,
    acara: lokasi.filter((l) => l.tipe === "acara" && l.aktif).length,
  }), [lokasi, totalTitikSemua])

  // Validasi form
  const validate = () => {
    const errors: Record<string, string> = {}
    if (!form.nama.trim()) errors.nama = "Nama lokasi wajib diisi"
    if (!form.alamat.trim()) errors.alamat = "Alamat lengkap wajib diisi"
    if (!form.latitude || isNaN(Number(form.latitude))) errors.latitude = "Latitude titik utama tidak valid"
    if (!form.longitude || isNaN(Number(form.longitude))) errors.longitude = "Longitude titik utama tidak valid"
    if (!form.radius || Number(form.radius) < 10) errors.radius = "Radius minimal 10 meter"

    // Validasi titik tambahan jika ada
    form.titikTambahan.forEach((pt, idx) => {
      if (!pt.nama.trim()) errors[`pt_nama_${idx}`] = "Label titik wajib diisi"
      if (!pt.latitude || isNaN(Number(pt.latitude))) errors[`pt_lat_${idx}`] = "Latitude tidak valid"
      if (!pt.longitude || isNaN(Number(pt.longitude))) errors[`pt_lng_${idx}`] = "Longitude tidak valid"
    })

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

  const handleOpenEdit = (item: LokasiItem) => {
    setEditingItem(item)

    // Parse titik tambahan jika ada
    let parsedTambahan: TitikFormItem[] = []
    if (item.titikKoordinat) {
      try {
        const raw = typeof item.titikKoordinat === "string" ? JSON.parse(item.titikKoordinat) : item.titikKoordinat
        if (Array.isArray(raw)) {
          parsedTambahan = raw.map((pt: any, i: number) => ({
            id: pt.id || `pt_${Date.now()}_${i}`,
            nama: pt.nama || `Titik ${i + 1}`,
            latitude: String(pt.latitude || ""),
            longitude: String(pt.longitude || ""),
            radius: pt.radius ? String(pt.radius) : "",
          }))
        }
      } catch (e) {
        console.error("Gagal parse titik tambahan:", e)
      }
    }

    setForm({
      nama: item.nama,
      tipe: item.tipe as TipeLokasi,
      alamat: item.alamat,
      latitude: String(item.latitude),
      longitude: String(item.longitude),
      radius: String(item.radius),
      aktif: item.aktif,
      titikTambahan: parsedTambahan,
      tanggalMulai: item.tanggalMulai ?? "",
      tanggalSelesai: item.tanggalSelesai ?? "",
      wajibHadir: item.wajibHadir ?? false,
      targetPegawai: item.targetPegawai ?? "semua",
      keterangan: item.keterangan ?? "",
    })
    setFormErrors({})
    setShowDialog(true)
  }

  // Tambah baris titik koordinat tambahan
  const handleAddTitikBaris = () => {
    setForm((p) => ({
      ...p,
      titikTambahan: [
        ...p.titikTambahan,
        {
          id: `pt_${Date.now()}`,
          nama: "",
          latitude: "",
          longitude: "",
          radius: "",
        },
      ],
    }))
  }

  // Hapus baris titik koordinat tambahan
  const handleRemoveTitikBaris = (index: number) => {
    setForm((p) => ({
      ...p,
      titikTambahan: p.titikTambahan.filter((_, i) => i !== index),
    }))
  }

  // Update field titik tambahan
  const handleUpdateTitikField = (index: number, field: keyof TitikFormItem, val: string) => {
    setForm((p) => {
      const copy = [...p.titikTambahan]
      copy[index] = { ...copy[index], [field]: val }
      return { ...p, titikTambahan: copy }
    })
  }

  // Simpan data (Tambah / Edit)
  const handleSave = async () => {
    if (!validate()) return
    setIsLoading(true)

    try {
      // Format payload titik koordinat tambahan
      const formattedTitikTambahan = form.titikTambahan
        .filter((pt) => pt.latitude && pt.longitude)
        .map((pt) => ({
          id: pt.id,
          nama: pt.nama.trim() || "Titik Tambahan",
          latitude: Number(pt.latitude),
          longitude: Number(pt.longitude),
          radius: pt.radius && !isNaN(Number(pt.radius)) ? Number(pt.radius) : Number(form.radius),
        }))

      const payload = {
        nama: form.nama.trim(),
        tipe: form.tipe,
        alamat: form.alamat.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        radius: Number(form.radius),
        aktif: form.aktif,
        titikKoordinat: formattedTitikTambahan.length > 0 ? formattedTitikTambahan : null,
        tanggalMulai: form.tipe === "acara" ? form.tanggalMulai || null : null,
        tanggalSelesai: form.tipe === "acara" ? form.tanggalSelesai || null : null,
        wajibHadir: form.tipe === "acara" ? form.wajibHadir : false,
        targetPegawai: form.tipe === "acara" && form.wajibHadir ? form.targetPegawai || "semua" : null,
        keterangan: form.tipe === "acara" ? form.keterangan || null : null,
      }

      if (editingItem) {
        await updateLokasi(editingItem.id, payload)
        toast.success(`Lokasi ${form.nama} berhasil diperbarui`)
      } else {
        await createLokasi(payload)
        toast.success(`Lokasi ${form.nama} berhasil ditambahkan`)
      }

      await fetchLokasi()
      setShowDialog(false)
    } catch (err: any) {
      toast.error(`Gagal menyimpan: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Hapus lokasi
  const handleDelete = async () => {
    if (!deletingItem) return
    setIsLoading(true)
    try {
      await deleteLokasi(deletingItem.id)
      toast.success(`Lokasi ${deletingItem.nama} berhasil dihapus`)
      await fetchLokasi()
    } catch (err: any) {
      toast.error(`Gagal menghapus: ${err.message}`)
    } finally {
      setShowDeleteDialog(false)
      setDeletingItem(null)
      setIsLoading(false)
    }
  }

  // Toggle status aktif
  const handleToggleAktif = async (item: LokasiItem) => {
    try {
      await toggleLokasiAktif(item.id, !item.aktif)
      toast.success(`${item.nama} ${item.aktif ? "dinonaktifkan" : "diaktifkan"}`)
      await fetchLokasi()
    } catch {
      toast.error("Gagal mengubah status aktif")
    }
  }

  // Ambil koordinat GPS dari browser untuk titik utama
  const handleGetGPS = () => {
    if (!navigator.geolocation) {
      toast.error("GPS tidak didukung oleh peramban ini")
      return
    }
    const toastId = toast.loading("Mengambil koordinat GPS presisi...")
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((p) => ({
          ...p,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }))
        toast.dismiss(toastId)
        toast.success(`Koordinat GPS didapat! Akurasi: ±${Math.round(pos.coords.accuracy)} meter`)
      },
      (err) => {
        toast.dismiss(toastId)
        if (err.code === 1) toast.error("Izin GPS ditolak. Silakan izinkan akses lokasi pada browser.")
        else if (err.code === 2) toast.error("Sinyal GPS tidak terdeteksi. Pastikan sensor lokasi perangkat aktif.")
        else toast.error("Waktu tunggu GPS habis. Silakan coba kembali di area terbuka.")
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  // Ambil GPS untuk titik koordinat tambahan tertentu
  const handleGetGPSTitikTambahan = (index: number) => {
    if (!navigator.geolocation) {
      toast.error("GPS tidak didukung oleh peramban ini")
      return
    }
    const toastId = toast.loading(`Mengambil GPS untuk Titik ${index + 1}...`)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleUpdateTitikField(index, "latitude", pos.coords.latitude.toFixed(6))
        handleUpdateTitikField(index, "longitude", pos.coords.longitude.toFixed(6))
        toast.dismiss(toastId)
        toast.success(`Koordinat Titik ${index + 1} didapat! Akurasi: ±${Math.round(pos.coords.accuracy)}m`)
      },
      (err) => {
        toast.dismiss(toastId)
        toast.error(`Gagal membaca GPS: ${err.message || "Pastikan izin lokasi aktif"}`)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50/50 dark:bg-black">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Pengaturan", "Lokasi Absensi"]} />

        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Header Title & Actions */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-slate-800 dark:text-zinc-200" />
                Lokasi Absensi & Geo-fencing
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Kelola titik koordinat kantor pusat, kantor cabang, pos instalasi, dan geofencing radius absensi.
              </p>
            </div>
            <Button
              size="sm"
              className="h-9 gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-medium rounded-xl shadow-xs"
              onClick={handleOpenAdd}
            >
              <Plus className="h-4 w-4" />
              Tambah Lokasi Baru
            </Button>
          </div>

          {/* KPI Metrics Cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111113] shadow-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Total Lokasi</p>
                  <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 mt-0.5">
                    {stats.total}
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                    {lokasi.filter((l) => l.aktif).length} Lokasi Aktif
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-zinc-800/80 flex items-center justify-center text-slate-700 dark:text-zinc-300">
                  <Building2 className="h-5 w-5" strokeWidth={1.75} />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111113] shadow-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Kantor & Cabang</p>
                  <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 mt-0.5">
                    {stats.pusat + stats.cabang}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    {stats.pusat} Pusat · {stats.cabang} Cabang
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-zinc-800/80 flex items-center justify-center text-slate-700 dark:text-zinc-300">
                  <MapPin className="h-5 w-5" strokeWidth={1.75} />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111113] shadow-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Titik Koordinat</p>
                  <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 mt-0.5">
                    {stats.totalTitik}
                  </p>
                  <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                    Termasuk multi-titik gerbang
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-zinc-800/80 flex items-center justify-center text-slate-700 dark:text-zinc-300">
                  <Layers className="h-5 w-5" strokeWidth={1.75} />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111113] shadow-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Acara Khusus</p>
                  <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 mt-0.5">
                    {stats.acara}
                  </p>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                    Geofencing event aktif
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-zinc-800/80 flex items-center justify-center text-slate-700 dark:text-zinc-300">
                  <Calendar className="h-5 w-5" strokeWidth={1.75} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter, Search & Table Container */}
          <Card className="rounded-xl border border-slate-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111113] shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                <TabsList className="h-9 bg-slate-100 dark:bg-zinc-800/60 p-1 rounded-xl">
                  <TabsTrigger value="semua" className="text-xs rounded-lg px-3">
                    Semua ({lokasi.length})
                  </TabsTrigger>
                  <TabsTrigger value="kantor" className="text-xs rounded-lg px-3">
                    Kantor ({stats.pusat + stats.cabang})
                  </TabsTrigger>
                  <TabsTrigger value="acara" className="text-xs rounded-lg px-3">
                    Acara ({lokasi.filter((l) => l.tipe === "acara").length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama lokasi atau alamat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-9 text-xs rounded-xl border-slate-200 dark:border-zinc-800"
                />
              </div>
            </div>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/40">
                    <TableHead className="w-[30%]">Lokasi & Alamat</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Titik Koordinat</TableHead>
                    <TableHead>Radius</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right w-[90px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isPageLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-xs text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                        Memuat data lokasi absensi...
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <MapPin className="h-7 w-7 text-muted-foreground/40" />
                          <p className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                            Tidak ada lokasi ditemukan
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {searchQuery ? "Sesuaikan kata kunci pencarian Anda." : "Klik tombol 'Tambah Lokasi Baru' untuk mendaftarkan area geo-fencing."}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((item) => {
                      // Hitung jumlah titik koordinat tambahan
                      let titikTambahanList: any[] = []
                      if (item.titikKoordinat) {
                        try {
                          const parsed = typeof item.titikKoordinat === "string" ? JSON.parse(item.titikKoordinat) : item.titikKoordinat
                          if (Array.isArray(parsed)) titikTambahanList = parsed
                        } catch {}
                      }

                      return (
                        <TableRow key={item.id} className="border-b border-slate-100 dark:border-zinc-800/60 hover:bg-slate-50/50 dark:hover:bg-zinc-800/20">
                          <TableCell>
                            <div>
                              <p className="font-semibold text-xs text-slate-900 dark:text-zinc-100">{item.nama}</p>
                              <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{item.alamat}</p>
                              {item.tipe === "acara" && item.wajibHadir && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Badge variant="outline" className="text-[10px] bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40">
                                    Wajib Hadir: {item.targetPegawai === "pusat" ? "Pusat" : item.targetPegawai === "cabang" ? "Cabang" : "Semua Pegawai"}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] font-medium ${tipeBadgeConfig[item.tipe]?.className || ""}`}>
                              {tipeBadgeConfig[item.tipe]?.label || item.tipe}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-[11px] font-mono text-slate-700 dark:text-zinc-300">
                                <span className="font-semibold text-[10px] text-slate-500">Pusat:</span>
                                <span>{item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}</span>
                                <a
                                  href={`https://maps.google.com/?q=${item.latitude},${item.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:text-primary/80 inline-flex items-center ml-1"
                                  title="Lihat titik utama di Google Maps"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>

                              {titikTambahanList.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedTitikDetail(item)}
                                  className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 rounded-md px-1.5 py-0.5 hover:underline"
                                >
                                  <Layers className="h-2.5 w-2.5" />
                                  +{titikTambahanList.length} Titik Tambahan
                                </button>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-lg border border-slate-200/60 dark:border-zinc-700/60">
                              <Radio className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                              <span>{item.radius} m</span>
                            </div>
                          </TableCell>

                          <TableCell className="text-xs">
                            {item.tipe === "acara" && item.tanggalMulai ? (
                              <div className="text-[11px] text-slate-600 dark:text-zinc-400">
                                <p>{item.tanggalMulai}</p>
                                <p className="text-[10px] text-muted-foreground">s/d {item.tanggalSelesai}</p>
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">Permanen</span>
                            )}
                          </TableCell>

                          <TableCell className="text-center">
                            <div className="flex items-center justify-center">
                              <Switch
                                checked={item.aktif}
                                onCheckedChange={() => handleToggleAktif(item)}
                                className="scale-75 data-[state=checked]:bg-emerald-600"
                                title={item.aktif ? "Non-aktifkan lokasi" : "Aktifkan lokasi"}
                              />
                            </div>
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                                onClick={() => handleOpenEdit(item)}
                                title="Edit Lokasi"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                onClick={() => {
                                  setDeletingItem(item)
                                  setShowDeleteDialog(true)
                                }}
                                title="Hapus Lokasi"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* ===== DIALOG TAMBAH / EDIT LOKASI ===== */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 bg-background rounded-2xl">
          <DialogHeader className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40">
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              {editingItem ? `Edit Lokasi — ${editingItem.nama}` : "Tambah Lokasi Absensi Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Atur titik koordinat GPS utama dan titik koordinat tambahan untuk area presensi pegawai.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-6 text-xs">
            {/* 1. INFORMASI UMUM */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                1. Informasi Dasar Lokasi
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs mb-1 block">Nama Lokasi *</Label>
                  <Input
                    className="h-9 text-xs"
                    value={form.nama}
                    onChange={(e) => setForm((p) => ({ ...p, nama: e.target.value }))}
                    placeholder="Contoh: Kantor Cabang Praya"
                  />
                  {formErrors.nama && <p className="mt-1 text-[10px] text-destructive">{formErrors.nama}</p>}
                </div>

                <div>
                  <Label className="text-xs mb-1 block">Tipe Lokasi *</Label>
                  <Select
                    value={form.tipe}
                    onValueChange={(v) => setForm((p) => ({ ...p, tipe: v as TipeLokasi }))}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kantor_pusat">Kantor Pusat</SelectItem>
                      <SelectItem value="kantor_cabang">Kantor Cabang / Unit</SelectItem>
                      <SelectItem value="acara">Acara / Event Khusus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs mb-1 block">Alamat Lengkap *</Label>
                <Textarea
                  rows={2}
                  className="text-xs"
                  value={form.alamat}
                  onChange={(e) => setForm((p) => ({ ...p, alamat: e.target.value }))}
                  placeholder="Alamat jalan, kelurahan, dan patokan lokasi"
                />
                {formErrors.alamat && <p className="mt-1 text-[10px] text-destructive">{formErrors.alamat}</p>}
              </div>

              <div>
                <Label className="text-xs mb-1 block">Radius Default Absensi (meter) *</Label>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Input
                    type="number"
                    min="10"
                    max="2000"
                    className="w-28 h-8 text-xs font-mono"
                    value={form.radius}
                    onChange={(e) => setForm((p) => ({ ...p, radius: e.target.value }))}
                  />
                  <span className="text-xs text-muted-foreground mr-2">meter</span>
                  {[50, 100, 150, 200, 500].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, radius: String(r) }))}
                      className={`h-7 px-2.5 rounded-lg border text-[11px] font-medium transition-colors ${
                        form.radius === String(r)
                          ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-slate-900 dark:border-zinc-100"
                          : "border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {r}m
                    </button>
                  ))}
                </div>
                {formErrors.radius && <p className="mt-1 text-[10px] text-destructive">{formErrors.radius}</p>}
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Rekomendasi: 50–100m untuk gedung perkantoran, 150–500m untuk area terbuka / instalasi pengolahan air.
                </p>
              </div>
            </div>

            {/* 2. TITIK KOORDINAT UTAMA */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    2. Titik Koordinat Utama (Default)
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Titik acuan pusat kantor atau gerbang masuk utama.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px] gap-1.5"
                  onClick={handleGetGPS}
                >
                  <Navigation className="h-3 w-3 text-primary" />
                  Ambil GPS Perangkat
                </Button>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px] mb-1 block">Latitude *</Label>
                    <Input
                      className="h-8 font-mono text-xs"
                      placeholder="-8.723600"
                      value={form.latitude}
                      onChange={(e) => setForm((p) => ({ ...p, latitude: e.target.value }))}
                    />
                    {formErrors.latitude && <p className="mt-1 text-[10px] text-destructive">{formErrors.latitude}</p>}
                  </div>
                  <div>
                    <Label className="text-[11px] mb-1 block">Longitude *</Label>
                    <Input
                      className="h-8 font-mono text-xs"
                      placeholder="116.293400"
                      value={form.longitude}
                      onChange={(e) => setForm((p) => ({ ...p, longitude: e.target.value }))}
                    />
                    {formErrors.longitude && <p className="mt-1 text-[10px] text-destructive">{formErrors.longitude}</p>}
                  </div>
                </div>

                {form.latitude && form.longitude && !isNaN(Number(form.latitude)) && !isNaN(Number(form.longitude)) && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-zinc-800/60">
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" /> Koordinat valid
                    </span>
                    <a
                      href={`https://maps.google.com/?q=${form.latitude},${form.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" /> Cek di Google Maps
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* 3. TITIK KOORDINAT TAMBAHAN (MULTI-TITIK) */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" />
                    3. Titik Koordinat Tambahan (Multi-Titik)
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Gunakan jika kantor memiliki gerbang timur/barat, gedung terpisah, atau area pos satpam.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px] gap-1 border-slate-200 dark:border-zinc-700"
                  onClick={handleAddTitikBaris}
                >
                  <Plus className="h-3 w-3" />
                  Tambah Titik
                </Button>
              </div>

              {form.titikTambahan.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 p-4 text-center">
                  <p className="text-[11px] text-muted-foreground">
                    Belum ada titik tambahan. Klik <strong>+ Tambah Titik</strong> jika lokasi ini memiliki lebih dari 1 titik koordinat.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {form.titikTambahan.map((pt, idx) => (
                    <div
                      key={pt.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                          <Crosshair className="h-3 w-3 text-primary" />
                          Titik #{idx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[10px] text-primary gap-1"
                            onClick={() => handleGetGPSTitikTambahan(idx)}
                          >
                            <Navigation className="h-2.5 w-2.5" /> GPS Titik Ini
                          </Button>
                          <button
                            type="button"
                            onClick={() => handleRemoveTitikBaris(idx)}
                            className="text-muted-foreground hover:text-rose-600 p-1"
                            title="Hapus titik ini"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                        <div className="md:col-span-3">
                          <Input
                            placeholder="Nama / Label Titik (e.g. Gerbang Belakang / Gedung B)"
                            className="h-8 text-xs"
                            value={pt.nama}
                            onChange={(e) => handleUpdateTitikField(idx, "nama", e.target.value)}
                          />
                          {formErrors[`pt_nama_${idx}`] && (
                            <p className="mt-1 text-[10px] text-destructive">{formErrors[`pt_nama_${idx}`]}</p>
                          )}
                        </div>

                        <div>
                          <Label className="text-[10px] mb-1 block">Latitude</Label>
                          <Input
                            placeholder="-8.723600"
                            className="h-8 font-mono text-xs"
                            value={pt.latitude}
                            onChange={(e) => handleUpdateTitikField(idx, "latitude", e.target.value)}
                          />
                          {formErrors[`pt_lat_${idx}`] && (
                            <p className="mt-1 text-[10px] text-destructive">{formErrors[`pt_lat_${idx}`]}</p>
                          )}
                        </div>

                        <div>
                          <Label className="text-[10px] mb-1 block">Longitude</Label>
                          <Input
                            placeholder="116.293400"
                            className="h-8 font-mono text-xs"
                            value={pt.longitude}
                            onChange={(e) => handleUpdateTitikField(idx, "longitude", e.target.value)}
                          />
                          {formErrors[`pt_lng_${idx}`] && (
                            <p className="mt-1 text-[10px] text-destructive">{formErrors[`pt_lng_${idx}`]}</p>
                          )}
                        </div>

                        <div>
                          <Label className="text-[10px] mb-1 block">Radius Kustom (m)</Label>
                          <Input
                            placeholder={`Default (${form.radius}m)`}
                            className="h-8 font-mono text-xs"
                            value={pt.radius || ""}
                            onChange={(e) => handleUpdateTitikField(idx, "radius", e.target.value)}
                          />
                        </div>
                      </div>

                      {pt.latitude && pt.longitude && !isNaN(Number(pt.latitude)) && !isNaN(Number(pt.longitude)) && (
                        <div className="text-right">
                          <a
                            href={`https://maps.google.com/?q=${pt.latitude},${pt.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-primary hover:underline inline-flex items-center gap-1"
                          >
                            <ExternalLink className="h-2.5 w-2.5" /> Buka Google Maps
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. KHUSUS ACARA */}
            {form.tipe === "acara" && (
              <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-zinc-800">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  4. Pengaturan Acara / Event
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1 block">Tanggal Mulai *</Label>
                    <Input
                      type="date"
                      className="h-9 text-xs"
                      value={form.tanggalMulai}
                      onChange={(e) => setForm((p) => ({ ...p, tanggalMulai: e.target.value }))}
                    />
                    {formErrors.tanggalMulai && (
                      <p className="mt-1 text-[10px] text-destructive">{formErrors.tanggalMulai}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs mb-1 block">Tanggal Selesai *</Label>
                    <Input
                      type="date"
                      className="h-9 text-xs"
                      value={form.tanggalSelesai}
                      onChange={(e) => setForm((p) => ({ ...p, tanggalSelesai: e.target.value }))}
                    />
                    {formErrors.tanggalSelesai && (
                      <p className="mt-1 text-[10px] text-destructive">{formErrors.tanggalSelesai}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-xs mb-1 block">Keterangan / Deskripsi Acara</Label>
                  <Input
                    className="h-9 text-xs"
                    placeholder="Contoh: Apel HUT PDAM ke-45 / Rapat Kerja Tahunan"
                    value={form.keterangan}
                    onChange={(e) => setForm((p) => ({ ...p, keterangan: e.target.value }))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40">
                  <div>
                    <p className="text-xs font-semibold">Absensi Wajib di Lokasi Acara Ini</p>
                    <p className="text-[11px] text-muted-foreground">
                      Pegawai yang ditargetkan wajib melakukan absensi pada koordinat acara ini selama periode berlangsung.
                    </p>
                  </div>
                  <Switch
                    checked={form.wajibHadir}
                    onCheckedChange={(v) => setForm((p) => ({ ...p, wajibHadir: v }))}
                  />
                </div>

                {form.wajibHadir && (
                  <div>
                    <Label className="text-xs mb-1.5 block">Target Pegawai Wajib Hadir</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: "semua", label: "Semua Pegawai", desc: "Pusat & Cabang" },
                        { value: "pusat", label: "Kantor Pusat", desc: "Hanya Pusat" },
                        { value: "cabang", label: "Kantor Cabang", desc: "Hanya Cabang" },
                      ].map((tgt) => (
                        <button
                          key={tgt.value}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, targetPegawai: tgt.value }))}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            form.targetPegawai === tgt.value
                              ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-slate-900 dark:border-zinc-100"
                              : "border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                          }`}
                        >
                          <p className="text-xs font-semibold">{tgt.label}</p>
                          <p className="text-[10px] opacity-75">{tgt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5. STATUS AKTIF */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40">
              <div>
                <p className="text-xs font-semibold">Status Lokasi</p>
                <p className="text-[11px] text-muted-foreground">
                  Lokasi aktif akan otomatis divalidasi pada halaman absensi selfie / GPS pegawai.
                </p>
              </div>
              <Switch
                checked={form.aktif}
                onCheckedChange={(v) => setForm((p) => ({ ...p, aktif: v }))}
              />
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40">
            <Button variant="outline" size="sm" onClick={() => setShowDialog(false)} className="h-9 text-xs">
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isLoading}
              className="h-9 text-xs bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Menyimpan...
                </>
              ) : editingItem ? (
                "Simpan Perubahan"
              ) : (
                "Simpan Lokasi"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== MODAL DETAIL TITIK KOORDINAT ===== */}
      <Dialog open={!!selectedTitikDetail} onOpenChange={(open) => !open && setSelectedTitikDetail(null)}>
        <DialogContent className="max-w-lg p-0 bg-background rounded-2xl">
          <DialogHeader className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40">
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Daftar Titik Koordinat — {selectedTitikDetail?.nama}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Semua titik koordinat geofencing yang terdaftar untuk lokasi ini.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-3">
            {/* Titik Utama */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-blue-600" />
                  Titik Utama (Default)
                </span>
                <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                  {selectedTitikDetail?.latitude.toFixed(6)}, {selectedTitikDetail?.longitude.toFixed(6)}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">Radius: {selectedTitikDetail?.radius} meter</p>
              </div>
              <a
                href={`https://maps.google.com/?q=${selectedTitikDetail?.latitude},${selectedTitikDetail?.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" /> Maps
              </a>
            </div>

            {/* Titik Tambahan */}
            {(() => {
              let tambahan: any[] = []
              if (selectedTitikDetail?.titikKoordinat) {
                try {
                  const p = typeof selectedTitikDetail.titikKoordinat === "string"
                    ? JSON.parse(selectedTitikDetail.titikKoordinat)
                    : selectedTitikDetail.titikKoordinat
                  if (Array.isArray(p)) tambahan = p
                } catch {}
              }

              if (tambahan.length === 0) {
                return (
                  <p className="text-xs text-center text-muted-foreground py-2">
                    Tidak ada titik tambahan untuk lokasi ini.
                  </p>
                )
              }

              return tambahan.map((pt, i) => (
                <div
                  key={pt.id || i}
                  className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#111113] flex items-center justify-between shadow-xs"
                >
                  <div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <Crosshair className="h-3.5 w-3.5 text-emerald-600" />
                      {pt.nama || `Titik Tambahan #${i + 1}`}
                    </span>
                    <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                      {Number(pt.latitude).toFixed(6)}, {Number(pt.longitude).toFixed(6)}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Radius: {pt.radius || selectedTitikDetail?.radius} meter
                    </p>
                  </div>
                  <a
                    href={`https://maps.google.com/?q=${pt.latitude},${pt.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" /> Maps
                  </a>
                </div>
              ))
            })()}
          </div>

          <DialogFooter className="px-6 py-3 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40">
            <Button variant="outline" size="sm" onClick={() => setSelectedTitikDetail(null)} className="h-8 text-xs">
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DIALOG KONFIRMASI HAPUS ===== */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold">Hapus Lokasi Absensi?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Anda akan menghapus lokasi <strong>{deletingItem?.nama}</strong> beserta seluruh titik koordinatnya. Pegawai yang terikat ke lokasi ini tidak akan dapat memvalidasi presensi di lokasi ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white font-medium"
            >
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Ya, Hapus Lokasi"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
