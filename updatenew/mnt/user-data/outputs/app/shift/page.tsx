"use client"

// app/shift/page.tsx — Ganti dengan file ini

import { useState, useEffect, useCallback } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  getShiftList, createShift, updateShift, deleteShift,
  getLemburList, ajukanLembur, approveLembur,
} from "@/lib/actions/shift-lembur"
import {
  Clock, Plus, Edit, Trash2, CheckCircle2, XCircle,
  Calendar, Users, ChevronLeft, ChevronRight,
} from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
}

const JENIS_LABEL: Record<string, string> = {
  HARI_KERJA: "Hari Kerja",
  HARI_LIBUR: "Hari Libur",
  HARI_BESAR: "Hari Besar",
}

function getBulanOptions() {
  const opts = []
  const now = new Date()
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    opts.push({ value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy", { locale: localeId }) })
  }
  return opts
}

// ======================== SHIFT TAB ========================
function ShiftTab() {
  const [shifts, setShifts] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ nama: "", kode: "", jamMasuk: "08:00", jamKeluar: "17:00", durasiJam: 8, keterangan: "" })
  const [loading, setLoading] = useState(false)

  const fetch = async () => {
    const data = await getShiftList()
    setShifts(data as any[])
  }
  useEffect(() => { fetch() }, [])

  const openForm = (s?: any) => {
    if (s) { setEditing(s); setForm({ nama: s.nama, kode: s.kode, jamMasuk: s.jamMasuk, jamKeluar: s.jamKeluar, durasiJam: s.durasiJam, keterangan: s.keterangan || "" }) }
    else { setEditing(null); setForm({ nama: "", kode: "", jamMasuk: "08:00", jamKeluar: "17:00", durasiJam: 8, keterangan: "" }) }
    setShowForm(true)
  }

  const handleSave = async () => {
    setLoading(true)
    const res = editing ? await updateShift(editing.id, form) : await createShift(form)
    setLoading(false)
    if ("error" in res) { toast.error(res.error!); return }
    toast.success(editing ? "Shift diperbarui" : "Shift dibuat")
    setShowForm(false); fetch()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus shift ini?")) return
    const res = await deleteShift(id)
    if ("error" in res) { toast.error(res.error!); return }
    toast.success("Shift dihapus"); fetch()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{shifts.length} tipe shift terdaftar</p>
        <Button size="sm" onClick={() => openForm()}>
          <Plus className="h-4 w-4 mr-1" /> Tambah Shift
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shifts.map((s) => (
          <Card key={s.id} className={!s.aktif ? "opacity-50" : ""}>
            <CardContent className="pt-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-primary">{s.kode}</span>
                    {!s.aktif && <Badge variant="secondary">Nonaktif</Badge>}
                  </div>
                  <p className="font-semibold">{s.nama}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openForm(s)}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(s.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm bg-muted rounded-lg px-3 py-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono font-semibold">{s.jamMasuk} – {s.jamKeluar}</span>
                <span className="text-muted-foreground ml-auto">{s.durasiJam} jam</span>
              </div>
              {s.keterangan && <p className="text-xs text-muted-foreground mt-2">{s.keterangan}</p>}
              <p className="text-xs text-muted-foreground mt-2">
                <Users className="h-3 w-3 inline mr-1" />{s._count.jadwal} jadwal aktif
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Shift" : "Tambah Shift Baru"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nama Shift</Label>
                <Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Shift Pagi" />
              </div>
              <div className="space-y-1">
                <Label>Kode</Label>
                <Input value={form.kode} onChange={(e) => setForm({ ...form, kode: e.target.value.toUpperCase() })} placeholder="A" maxLength={3} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Jam Masuk</Label>
                <Input type="time" value={form.jamMasuk} onChange={(e) => setForm({ ...form, jamMasuk: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Jam Keluar</Label>
                <Input type="time" value={form.jamKeluar} onChange={(e) => setForm({ ...form, jamKeluar: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Durasi (jam)</Label>
                <Input type="number" value={form.durasiJam} onChange={(e) => setForm({ ...form, durasiJam: Number(e.target.value) })} min={1} max={12} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Keterangan</Label>
              <Textarea value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={loading}>{loading ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ======================== LEMBUR TAB ========================
function LemburTab() {
  const bulanOptions = getBulanOptions()
  const [bulan, setBulan] = useState(bulanOptions[0].value)
  const [status, setStatus] = useState("all")
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [selectedApproval, setSelectedApproval] = useState<any>(null)
  const [approvalNote, setApprovalNote] = useState("")
  const [form, setForm] = useState({
    pegawaiId: "", tanggal: "", jamMulai: "", jamSelesai: "",
    durasiJam: 0, jenis: "HARI_KERJA", alasan: ""
  })

  const fetch = useCallback(async () => {
    setLoading(true)
    const res = await getLemburList({ bulan, status })
    setData(res); setLoading(false)
  }, [bulan, status])

  useEffect(() => { fetch() }, [fetch])

  const handleApprove = async (approve: boolean) => {
    const res = await approveLembur(selectedApproval.id, approve, approvalNote)
    if ("error" in res) { toast.error(res.error!); return }
    toast.success(approve ? "Lembur disetujui" : "Lembur ditolak")
    setSelectedApproval(null); setApprovalNote(""); fetch()
  }

  const totalApproved = data.filter((d) => d.status === "APPROVED").reduce((s, d) => s + d.totalBayar, 0)
  const totalPending = data.filter((d) => d.status === "PENDING").length

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Pengajuan", value: data.length, color: "text-blue-600" },
          { label: "Menunggu Approval", value: totalPending, color: "text-yellow-600" },
          { label: "Total Bayar (Approved)", value: "Rp " + totalApproved.toLocaleString("id-ID"), color: "text-green-600" },
        ].map((s) => (
          <Card key={s.label}><CardContent className="pt-3 pb-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </CardContent></Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={bulan} onValueChange={setBulan}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>{bulanOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Semua Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Disetujui</SelectItem>
            <SelectItem value="REJECTED">Ditolak</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Pegawai</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Waktu</TableHead>
              <TableHead>Durasi</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Alasan</TableHead>
              <TableHead className="text-right">Total Bayar</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Memuat...</TableCell></TableRow>
            ) : data.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Tidak ada data lembur</TableCell></TableRow>
            ) : data.map((l) => (
              <TableRow key={l.id}>
                <TableCell>
                  <p className="font-medium text-sm">{l.nama}</p>
                  <p className="text-xs text-muted-foreground">{l.unit}</p>
                </TableCell>
                <TableCell className="text-sm">{l.tanggal}</TableCell>
                <TableCell className="text-sm font-mono">{l.jamMulai} – {l.jamSelesai}</TableCell>
                <TableCell className="text-sm">{l.durasiJam} jam</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{JENIS_LABEL[l.jenis]}</Badge></TableCell>
                <TableCell className="text-sm max-w-[160px] truncate text-muted-foreground">{l.alasan}</TableCell>
                <TableCell className="text-right text-sm font-semibold">Rp {l.totalBayar.toLocaleString("id-ID")}</TableCell>
                <TableCell>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[l.status]}`}>{l.status}</span>
                </TableCell>
                <TableCell>
                  {l.status === "PENDING" && (
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setSelectedApproval(l); setApprovalNote("") }}>
                      Review
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      {/* Approval Dialog */}
      <Dialog open={!!selectedApproval} onOpenChange={() => setSelectedApproval(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Review Pengajuan Lembur</DialogTitle></DialogHeader>
          {selectedApproval && (
            <div className="space-y-3 text-sm">
              {[
                ["Pegawai", selectedApproval.nama],
                ["Tanggal", selectedApproval.tanggal],
                ["Waktu", `${selectedApproval.jamMulai} – ${selectedApproval.jamSelesai} (${selectedApproval.durasiJam} jam)`],
                ["Jenis", JENIS_LABEL[selectedApproval.jenis]],
                ["Alasan", selectedApproval.alasan],
                ["Total Bayar", "Rp " + selectedApproval.totalBayar.toLocaleString("id-ID")],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-4"><span className="text-muted-foreground w-24 shrink-0">{k}</span><span className="font-medium">{v}</span></div>
              ))}
              <div className="space-y-1 pt-2">
                <Label>Catatan (opsional)</Label>
                <Textarea value={approvalNote} onChange={(e) => setApprovalNote(e.target.value)} rows={2} placeholder="Catatan persetujuan/penolakan..." />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="destructive" onClick={() => handleApprove(false)}>
              <XCircle className="h-4 w-4 mr-1" /> Tolak
            </Button>
            <Button onClick={() => handleApprove(true)}>
              <CheckCircle2 className="h-4 w-4 mr-1" /> Setujui
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ======================== MAIN PAGE ========================
export default function ShiftLemburPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Kehadiran", "Shift & Lembur"]} />
        <main className="flex-1 p-6">
          <div className="mb-5">
            <h1 className="text-xl font-bold">Shift Kerja & Lembur</h1>
            <p className="text-sm text-muted-foreground">Kelola jadwal shift dan pengajuan lembur pegawai PDAM</p>
          </div>
          <Tabs defaultValue="shift">
            <TabsList className="mb-5">
              <TabsTrigger value="shift"><Clock className="h-4 w-4 mr-1.5" />Tipe Shift</TabsTrigger>
              <TabsTrigger value="lembur"><Calendar className="h-4 w-4 mr-1.5" />Pengajuan Lembur</TabsTrigger>
            </TabsList>
            <TabsContent value="shift"><ShiftTab /></TabsContent>
            <TabsContent value="lembur"><LemburTab /></TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
