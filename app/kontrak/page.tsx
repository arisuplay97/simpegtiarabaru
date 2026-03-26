"use client"

// app/kontrak/page.tsx — Ganti file placeholder yang ada

import { useState, useEffect, useCallback } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import {
  getKontrakList, getKontrakStats, createKontrak,
  perpanjangKontrak, updateStatusKontrak, getPegawaiUntukKontrak,
} from "@/lib/actions/kontrak"
import {
  FileText, Plus, Search, AlertTriangle, CheckCircle2,
  Clock, Users, MoreHorizontal, RefreshCw, CalendarDays,
  Briefcase, XCircle, RotateCcw, Eye, ChevronRight,
} from "lucide-react"

// ── Tipe & Konstanta ──────────────────────────────────────
const TIPE_LABEL: Record<string, { label: string; color: string }> = {
  PKWT:   { label: "PKWT",   color: "bg-blue-100 text-blue-700" },
  MAGANG: { label: "Magang", color: "bg-purple-100 text-purple-700" },
}

const STATUS_STYLE: Record<string, { label: string; color: string }> = {
  AKTIF:        { label: "Aktif",        color: "bg-green-100 text-green-700" },
  SELESAI:      { label: "Selesai",      color: "bg-gray-100 text-gray-600" },
  DIPERPANJANG: { label: "Diperpanjang", color: "bg-yellow-100 text-yellow-700" },
  DIBATALKAN:   { label: "Dibatalkan",   color: "bg-red-100 text-red-700" },
}

const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID")

// ── Form Kosong ───────────────────────────────────────────
const emptyForm = {
  pegawaiId: "", tipe: "PKWT", nomorKontrak: "",
  tanggalMulai: "", tanggalSelesai: "",
  posisi: "", unitKerja: "",
  gajiKontrak: "", tunjangan: "", keterangan: "",
}

// ============================================================
// KOMPONEN UTAMA
// ============================================================
export default function KontrakPage() {
  const [data, setData] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [pegawaiList, setPegawaiList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [filterTipe, setFilterTipe] = useState("all")
  const [filterStatus, setFilterStatus] = useState("AKTIF")
  const [activeTab, setActiveTab] = useState("semua")

  // Dialog state
  const [showForm, setShowForm] = useState(false)
  const [showPerpanjang, setShowPerpanjang] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [perpanjangForm, setPerpanjangForm] = useState({
    tanggalMulai: "", tanggalSelesai: "", gajiKontrak: "", tunjangan: "", keterangan: "",
  })
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const expiringSoon = activeTab === "expiring"
    const res = await getKontrakList({
      tipe: filterTipe,
      status: activeTab === "expiring" ? undefined : filterStatus,
      search,
      expiringSoon,
    }) as any
    if (res.error) { toast.error(res.error!); setLoading(false); return }
    setData(res.data)
    setLoading(false)
  }, [filterTipe, filterStatus, search, activeTab])

  const fetchStats = async () => {
    const s = await getKontrakStats()
    setStats(s)
  }

  const fetchPegawai = async () => {
    const list = await getPegawaiUntukKontrak()
    setPegawaiList(list)
  }

  useEffect(() => { fetchData(); fetchStats() }, [fetchData])
  useEffect(() => { fetchPegawai() }, [])

  // ── Hitung durasi otomatis ─────────────────────────────
  const hitungDurasi = (mulai: string, selesai: string) => {
    if (!mulai || !selesai) return null
    const diff = Math.round((new Date(selesai).getTime() - new Date(mulai).getTime()) / (1000 * 60 * 60 * 24))
    if (diff <= 0) return null
    const bulan = Math.floor(diff / 30)
    const hari = diff % 30
    return bulan > 0 ? `${bulan} bulan ${hari > 0 ? hari + " hari" : ""}` : `${diff} hari`
  }

  // ── Submit Form Buat Kontrak ───────────────────────────
  const handleCreate = async () => {
    if (!form.pegawaiId || !form.tanggalMulai || !form.tanggalSelesai || !form.posisi || !form.unitKerja) {
      toast.error("Lengkapi semua field wajib")
      return
    }
    setSaving(true)
    const res = await createKontrak({
      ...form,
      tipe: form.tipe as "PKWT" | "MAGANG",
      gajiKontrak: Number(form.gajiKontrak) || 0,
      tunjangan: Number(form.tunjangan) || 0,
    }) as any
    setSaving(false)
    if (res.error) { toast.error(res.error!); return }
    toast.success("Kontrak berhasil dibuat")
    setShowForm(false)
    setForm({ ...emptyForm })
    fetchData(); fetchStats()
  }

  // ── Submit Perpanjang ──────────────────────────────────
  const handlePerpanjang = async () => {
    if (!perpanjangForm.tanggalMulai || !perpanjangForm.tanggalSelesai) {
      toast.error("Isi tanggal perpanjangan")
      return
    }
    setSaving(true)
    const res = await perpanjangKontrak(selected.id, {
      ...perpanjangForm,
      gajiKontrak: Number(perpanjangForm.gajiKontrak) || selected.gajiKontrak,
      tunjangan: Number(perpanjangForm.tunjangan) || selected.tunjangan,
    }) as any
    setSaving(false)
    if (res.error) { toast.error(res.error!); return }
    toast.success("Kontrak berhasil diperpanjang")
    setShowPerpanjang(false)
    fetchData(); fetchStats()
  }

  // ── Update Status ──────────────────────────────────────
  const handleUpdateStatus = async (id: string, status: "SELESAI" | "DIBATALKAN") => {
    const label = status === "SELESAI" ? "selesaikan" : "batalkan"
    if (!confirm(`Yakin ingin ${label} kontrak ini?`)) return
    const res = await updateStatusKontrak(id, status) as any
    if (res.error) { toast.error(res.error!); return }
    toast.success(`Kontrak berhasil di${label}`)
    fetchData(); fetchStats()
  }

  // ── Warna progress bar ─────────────────────────────────
  const getProgressColor = (sisa: number) => {
    if (sisa <= 7) return "bg-red-500"
    if (sisa <= 14) return "bg-amber-500"
    return "bg-emerald-500"
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Kepegawaian", "Kontrak & Magang"]} />
        <main className="flex-1 p-6 space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold">Manajemen Kontrak</h1>
              <p className="text-sm text-muted-foreground">Kelola kontrak PKWT dan magang pegawai PDAM</p>
            </div>
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Buat Kontrak Baru
            </Button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { label: "Total Aktif", value: stats.totalAktif, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "PKWT Aktif", value: stats.totalPKWT, icon: Briefcase, color: "text-indigo-600", bg: "bg-indigo-50" },
                { label: "Magang Aktif", value: stats.totalMagang, icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
                { label: "Habis 14 Hari", value: stats.expiringSoon, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
                { label: "Habis Bulan Ini", value: stats.selesaibulanIni, icon: CalendarDays, color: "text-red-600", bg: "bg-red-50" },
              ].map((s) => (
                <Card key={s.label} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                        <p className={`text-2xl font-black mt-0.5 ${s.color}`}>{s.value}</p>
                      </div>
                      <div className={`p-2 rounded-lg ${s.bg}`}>
                        <s.icon className={`h-5 w-5 ${s.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Alert expiring */}
          {stats?.expiringSoon > 0 && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800">
                  {stats.expiringSoon} kontrak akan habis dalam 14 hari!
                </p>
                <p className="text-xs text-amber-700">Segera tindak lanjuti — perpanjang atau selesaikan kontrak.</p>
              </div>
              <Button size="sm" variant="outline" className="border-amber-300 text-amber-700"
                onClick={() => setActiveTab("expiring")}>
                Lihat <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          )}

          {/* Tabs + Filters */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TabsList>
                <TabsTrigger value="semua">Semua</TabsTrigger>
                <TabsTrigger value="expiring" className="relative">
                  Akan Habis
                  {stats?.expiringSoon > 0 && (
                    <span className="ml-1.5 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      {stats.expiringSoon}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
              <div className="flex gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Cari nama / NIK..." className="pl-9 w-[220px]"
                    value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Select value={filterTipe} onValueChange={setFilterTipe}>
                  <SelectTrigger className="w-[130px]"><SelectValue placeholder="Tipe" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    <SelectItem value="PKWT">PKWT</SelectItem>
                    <SelectItem value="MAGANG">Magang</SelectItem>
                  </SelectContent>
                </Select>
                {activeTab === "semua" && (
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AKTIF">Aktif</SelectItem>
                      <SelectItem value="SELESAI">Selesai</SelectItem>
                      <SelectItem value="DIPERPANJANG">Diperpanjang</SelectItem>
                      <SelectItem value="DIBATALKAN">Dibatalkan</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <Button variant="outline" size="icon" onClick={() => { fetchData(); fetchStats() }}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <TabsContent value="semua" className="mt-4">
              <KontrakTable
                data={data} loading={loading}
                onDetail={(k) => { setSelected(k); setShowDetail(true) }}
                onPerpanjang={(k) => {
                  setSelected(k)
                  setPerpanjangForm({ tanggalMulai: "", tanggalSelesai: "", gajiKontrak: String(k.gajiKontrak), tunjangan: String(k.tunjangan), keterangan: "" })
                  setShowPerpanjang(true)
                }}
                onUpdateStatus={handleUpdateStatus}
                getProgressColor={getProgressColor}
              />
            </TabsContent>
            <TabsContent value="expiring" className="mt-4">
              <KontrakTable
                data={data} loading={loading}
                onDetail={(k) => { setSelected(k); setShowDetail(true) }}
                onPerpanjang={(k) => {
                  setSelected(k)
                  setPerpanjangForm({ tanggalMulai: "", tanggalSelesai: "", gajiKontrak: String(k.gajiKontrak), tunjangan: String(k.tunjangan), keterangan: "" })
                  setShowPerpanjang(true)
                }}
                onUpdateStatus={handleUpdateStatus}
                getProgressColor={getProgressColor}
                highlightExpiring
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* ── DIALOG: BUAT KONTRAK ── */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Buat Kontrak Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 col-span-2">
                <Label>Pegawai <span className="text-red-500">*</span></Label>
                <Select value={form.pegawaiId} onValueChange={(v) => setForm({ ...form, pegawaiId: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih pegawai..." /></SelectTrigger>
                  <SelectContent>
                    {pegawaiList.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nama} — {p.nik} ({p.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Tipe Kontrak <span className="text-red-500">*</span></Label>
                <Select value={form.tipe} onValueChange={(v) => setForm({ ...form, tipe: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PKWT">PKWT (Perjanjian Kerja Waktu Tertentu)</SelectItem>
                    <SelectItem value="MAGANG">Magang / Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Nomor Kontrak</Label>
                <Input placeholder="Contoh: PKWT/001/2026"
                  value={form.nomorKontrak} onChange={(e) => setForm({ ...form, nomorKontrak: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Tanggal Mulai <span className="text-red-500">*</span></Label>
                <Input type="date" value={form.tanggalMulai}
                  onChange={(e) => setForm({ ...form, tanggalMulai: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Tanggal Selesai <span className="text-red-500">*</span></Label>
                <Input type="date" value={form.tanggalSelesai}
                  onChange={(e) => setForm({ ...form, tanggalSelesai: e.target.value })} />
              </div>
              {form.tanggalMulai && form.tanggalSelesai && (
                <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-800">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Durasi kontrak: <strong>{hitungDurasi(form.tanggalMulai, form.tanggalSelesai) || "Tanggal tidak valid"}</strong>
                </div>
              )}
              <div className="space-y-1">
                <Label>Posisi / Jabatan <span className="text-red-500">*</span></Label>
                <Input placeholder="Staf Administrasi" value={form.posisi}
                  onChange={(e) => setForm({ ...form, posisi: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Unit Kerja <span className="text-red-500">*</span></Label>
                <Input placeholder="Bidang Keuangan" value={form.unitKerja}
                  onChange={(e) => setForm({ ...form, unitKerja: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Gaji / Uang Saku</Label>
                <Input type="number" placeholder="0" value={form.gajiKontrak}
                  onChange={(e) => setForm({ ...form, gajiKontrak: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Tunjangan</Label>
                <Input type="number" placeholder="0" value={form.tunjangan}
                  onChange={(e) => setForm({ ...form, tunjangan: e.target.value })} />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Keterangan</Label>
                <Textarea rows={2} placeholder="Keterangan tambahan..."
                  value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Kontrak"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG: PERPANJANG ── */}
      <Dialog open={showPerpanjang} onOpenChange={setShowPerpanjang}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Perpanjang Kontrak — {selected?.nama}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
                <p><span className="text-muted-foreground">Kontrak sebelumnya:</span> {selected.tanggalMulai} — {selected.tanggalSelesai}</p>
                <p><span className="text-muted-foreground">Tipe:</span> {selected.tipe} | <span className="text-muted-foreground">Posisi:</span> {selected.posisi}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Tanggal Mulai Baru <span className="text-red-500">*</span></Label>
                  <Input type="date" value={perpanjangForm.tanggalMulai}
                    onChange={(e) => setPerpanjangForm({ ...perpanjangForm, tanggalMulai: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Tanggal Selesai Baru <span className="text-red-500">*</span></Label>
                  <Input type="date" value={perpanjangForm.tanggalSelesai}
                    onChange={(e) => setPerpanjangForm({ ...perpanjangForm, tanggalSelesai: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Gaji Baru (opsional)</Label>
                  <Input type="number" value={perpanjangForm.gajiKontrak}
                    onChange={(e) => setPerpanjangForm({ ...perpanjangForm, gajiKontrak: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Tunjangan Baru (opsional)</Label>
                  <Input type="number" value={perpanjangForm.tunjangan}
                    onChange={(e) => setPerpanjangForm({ ...perpanjangForm, tunjangan: e.target.value })} />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Catatan Perpanjangan</Label>
                  <Textarea rows={2} value={perpanjangForm.keterangan}
                    onChange={(e) => setPerpanjangForm({ ...perpanjangForm, keterangan: e.target.value })} />
                </div>
              </div>
              {perpanjangForm.tanggalMulai && perpanjangForm.tanggalSelesai && (
                <p className="text-xs bg-blue-50 text-blue-700 px-3 py-2 rounded-lg">
                  Durasi baru: <strong>{hitungDurasi(perpanjangForm.tanggalMulai, perpanjangForm.tanggalSelesai)}</strong>
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPerpanjang(false)}>Batal</Button>
            <Button onClick={handlePerpanjang} disabled={saving}>
              <RotateCcw className="h-4 w-4 mr-1.5" />
              {saving ? "Memproses..." : "Perpanjang Kontrak"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG: DETAIL ── */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Kontrak</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selected.foto} />
                  <AvatarFallback>{selected.nama?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold">{selected.nama}</p>
                  <p className="text-sm text-muted-foreground">{selected.nik} — {selected.unit}</p>
                </div>
                <div className="ml-auto flex gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TIPE_LABEL[selected.tipe]?.color}`}>
                    {TIPE_LABEL[selected.tipe]?.label}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[selected.status]?.color}`}>
                    {STATUS_STYLE[selected.status]?.label}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {[
                  ["Nomor Kontrak", selected.nomorKontrak || "-"],
                  ["Posisi", selected.posisi],
                  ["Unit Kerja", selected.unitKerja],
                  ["Tanggal Mulai", selected.tanggalMulai],
                  ["Tanggal Selesai", selected.tanggalSelesai],
                  ["Durasi Total", `${selected.durasiHari} hari`],
                  ["Gaji/Uang Saku", fmt(selected.gajiKontrak)],
                  ["Tunjangan", fmt(selected.tunjangan)],
                  ["Total per Bulan", fmt(selected.gajiKontrak + selected.tunjangan)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>

              {selected.status === "AKTIF" && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress Kontrak</span>
                    <span className={`font-semibold ${selected.sisaHari <= 14 ? "text-amber-600" : "text-muted-foreground"}`}>
                      {selected.sisaHari >= 0 ? `Sisa ${selected.sisaHari} hari` : "Sudah berakhir"}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getProgressColor(selected.sisaHari)}`}
                      style={{ width: `${selected.persentase}%` }}
                    />
                  </div>
                </div>
              )}

              {selected.keterangan && (
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Keterangan</p>
                  <p className="text-sm">{selected.keterangan}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================
// SUB-KOMPONEN: TABEL KONTRAK
// ============================================================
function KontrakTable({
  data, loading, onDetail, onPerpanjang, onUpdateStatus, getProgressColor, highlightExpiring = false,
}: {
  data: any[]
  loading: boolean
  onDetail: (k: any) => void
  onPerpanjang: (k: any) => void
  onUpdateStatus: (id: string, status: "SELESAI" | "DIBATALKAN") => void
  getProgressColor: (sisa: number) => string
  highlightExpiring?: boolean
}) {
  if (loading) return (
    <Card><CardContent className="py-12 text-center text-muted-foreground">Memuat data...</CardContent></Card>
  )

  if (data.length === 0) return (
    <Card><CardContent className="py-12 text-center">
      <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground opacity-40" />
      <p className="text-muted-foreground">Tidak ada kontrak ditemukan</p>
    </CardContent></Card>
  )

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Pegawai</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Posisi / Unit</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className="text-right">Gaji</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((k) => (
                <TableRow
                  key={k.id}
                  className={`hover:bg-muted/30 cursor-pointer ${highlightExpiring && k.isExpiringSoon ? "bg-amber-50/50" : ""}`}
                  onClick={() => onDetail(k)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={k.foto} />
                        <AvatarFallback className="text-xs">{k.nama?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{k.nama}</p>
                        <p className="text-xs text-muted-foreground">{k.nik}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TIPE_LABEL[k.tipe]?.color}`}>
                      {TIPE_LABEL[k.tipe]?.label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{k.posisi}</p>
                    <p className="text-xs text-muted-foreground">{k.unitKerja}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs">{k.tanggalMulai}</p>
                    <p className="text-xs font-semibold">{k.tanggalSelesai}</p>
                  </TableCell>
                  <TableCell className="min-w-[140px]">
                    {k.status === "AKTIF" ? (
                      <div className="space-y-1">
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getProgressColor(k.sisaHari)}`}
                            style={{ width: `${k.persentase}%` }}
                          />
                        </div>
                        <p className={`text-xs font-medium ${k.sisaHari <= 14 ? "text-amber-600" : "text-muted-foreground"}`}>
                          {k.sisaHari >= 0 ? `Sisa ${k.sisaHari} hari` : "Sudah berakhir"}
                          {k.isExpiringSoon && " ⚠️"}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {(k.gajiKontrak + k.tunjangan) > 0 ? "Rp " + (k.gajiKontrak + k.tunjangan).toLocaleString("id-ID") : "—"}
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[k.status]?.color}`}>
                      {STATUS_STYLE[k.status]?.label}
                    </span>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onDetail(k)}>
                          <Eye className="h-4 w-4 mr-2" /> Lihat Detail
                        </DropdownMenuItem>
                        {k.status === "AKTIF" && (
                          <>
                            <DropdownMenuItem onClick={() => onPerpanjang(k)}>
                              <RotateCcw className="h-4 w-4 mr-2" /> Perpanjang
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onUpdateStatus(k.id, "SELESAI")}>
                              <CheckCircle2 className="h-4 w-4 mr-2" /> Selesaikan
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600"
                              onClick={() => onUpdateStatus(k.id, "DIBATALKAN")}>
                              <XCircle className="h-4 w-4 mr-2" /> Batalkan
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
