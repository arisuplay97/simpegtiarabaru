"use client"

import { useState, useEffect, useCallback } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import {
  getShiftList, createShift, updateShift, deleteShift,
  getLemburList, ajukanLembur, approveLembur,
} from "@/lib/actions/shift-lembur-ultimate"
import {
  Clock, Plus, Edit, Trash2, CheckCircle2, XCircle,
  Calendar, Users, ChevronLeft, ChevronRight, Hourglass,
  RefreshCw, Search, Banknote, Sparkles, Building2, Check,
} from "lucide-react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { cn } from "@/lib/utils"

const STATUS_COLOR: Record<string, { label: string; badge: string; dot: string }> = {
  PENDING: { label: "Menunggu", badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20", dot: "bg-amber-500" },
  APPROVED: { label: "Disetujui", badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20", dot: "bg-emerald-500" },
  REJECTED: { label: "Ditolak", badge: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20", dot: "bg-rose-500" },
}

const JENIS_LABEL: Record<string, { label: string; badge: string }> = {
  HARI_KERJA: { label: "Hari Kerja", badge: "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border-slate-200/80 dark:border-zinc-700/80" },
  HARI_LIBUR: { label: "Hari Libur", badge: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20" },
  HARI_BESAR: { label: "Hari Besar Nasional", badge: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20" },
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
  const [isFetching, setIsFetching] = useState(true)

  const fetch = async () => {
    setIsFetching(true)
    const data = await getShiftList()
    setShifts(data as any[])
    setIsFetching(false)
  }
  useEffect(() => { fetch() }, [])

  const openForm = (s?: any) => {
    if (s) {
      setEditing(s)
      setForm({ nama: s.nama, kode: s.kode, jamMasuk: s.jamMasuk, jamKeluar: s.jamKeluar, durasiJam: s.durasiJam, keterangan: s.keterangan || "" })
    } else {
      setEditing(null)
      setForm({ nama: "", kode: "", jamMasuk: "08:00", jamKeluar: "17:00", durasiJam: 8, keterangan: "" })
    }
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.nama || !form.kode) {
      toast.error("Nama dan kode shift wajib diisi")
      return
    }
    setLoading(true)
    const res = editing ? await updateShift(editing.id, form) : await createShift(form)
    setLoading(false)
    if ("error" in res) { toast.error(res.error!); return }
    toast.success(editing ? "Shift berhasil diperbarui" : "Shift baru berhasil dibuat")
    setShowForm(false)
    fetch()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus tipe shift ini?")) return
    const res = await deleteShift(id)
    if ("error" in res) { toast.error(res.error!); return }
    toast.success("Shift berhasil dihapus")
    fetch()
  }

  return (
    <div className="space-y-4">
      {/* Subheader */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 p-4 rounded-xl shadow-xs">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
            Terdaftar <strong>{shifts.length}</strong> pola shift operasional
          </span>
        </div>
        <Button
          size="sm"
          onClick={() => openForm()}
          className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-xs font-semibold rounded-lg h-9 px-3.5 shadow-xs"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Tambah Shift
        </Button>
      </div>

      {/* Grid of Shift Cards */}
      {isFetching ? (
        <div className="p-16 text-center space-y-3 bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 rounded-xl">
          <RefreshCw className="h-6 w-6 text-slate-400 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600 dark:text-zinc-300">Memuat tipe shift...</p>
        </div>
      ) : shifts.length === 0 ? (
        <div className="p-16 text-center space-y-2 bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 rounded-xl">
          <Clock className="h-8 w-8 text-slate-300 dark:text-zinc-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Belum ada tipe shift</p>
          <p className="text-xs text-slate-400 dark:text-zinc-500">Buat tipe shift pertama untuk jadwal kerja bergiliran.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {shifts.map((s) => (
            <div
              key={s.id}
              className={cn(
                "rounded-xl bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 p-4 shadow-xs hover:border-slate-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between",
                !s.aktif && "opacity-60"
              )}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center font-bold text-slate-800 dark:text-zinc-200 text-xs shadow-2xs font-mono">
                      {s.kode}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100 leading-none">
                        {s.nama}
                      </h4>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                        {!s.aktif ? "Shift Nonaktif" : "Shift Operasional"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100"
                      onClick={() => openForm(s)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      onClick={() => handleDelete(s.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Jam Kerja Pill */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-mono font-medium">{s.jamMasuk} – {s.jamKeluar}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-normal rounded-md border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400">
                    {s.durasiJam} Jam
                  </Badge>
                </div>

                {s.keterangan && (
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-2.5 leading-relaxed">
                    {s.keterangan}
                  </p>
                )}
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {s._count?.jadwal || 0} jadwal ditugaskan
                </span>
                <span className="font-mono text-[10px]">ID: {s.kode}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md rounded-xl bg-white dark:bg-[#111113] border-slate-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
              {editing ? "Edit Tipe Shift" : "Tambah Tipe Shift Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400">
              Tentukan jam kerja operasional dan kode penanda shift
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Nama Shift <span className="text-rose-500">*</span></Label>
                <Input
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="Contoh: Shift Pagi"
                  className="h-9 rounded-xl bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Kode Shift <span className="text-rose-500">*</span></Label>
                <Input
                  value={form.kode}
                  onChange={(e) => setForm({ ...form, kode: e.target.value.toUpperCase() })}
                  placeholder="P"
                  maxLength={3}
                  className="h-9 rounded-xl bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs font-mono font-bold uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Jam Masuk</Label>
                <Input
                  type="time"
                  value={form.jamMasuk}
                  onChange={(e) => setForm({ ...form, jamMasuk: e.target.value })}
                  className="h-9 rounded-xl bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Jam Keluar</Label>
                <Input
                  type="time"
                  value={form.jamKeluar}
                  onChange={(e) => setForm({ ...form, jamKeluar: e.target.value })}
                  className="h-9 rounded-xl bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Durasi (Jam)</Label>
                <Input
                  type="number"
                  value={form.durasiJam}
                  onChange={(e) => setForm({ ...form, durasiJam: Number(e.target.value) })}
                  min={1}
                  max={24}
                  className="h-9 rounded-xl bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Keterangan Tambahan</Label>
              <Textarea
                value={form.keterangan}
                onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                rows={2}
                placeholder="Ketentuan giliran, deskripsi area tugas..."
                className="rounded-xl bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)} className="rounded-lg text-xs h-9">
              Batal
            </Button>
            <Button size="sm" onClick={handleSave} disabled={loading} className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg text-xs font-semibold h-9 px-4">
              {loading ? "Menyimpan..." : "Simpan Shift"}
            </Button>
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
  const [search, setSearch] = useState("")
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedApproval, setSelectedApproval] = useState<any>(null)
  const [approvalNote, setApprovalNote] = useState("")

  const fetch = useCallback(async () => {
    setLoading(true)
    const res = await (getLemburList as any)({ bulan, status })
    setData(res || [])
    setLoading(false)
  }, [bulan, status])

  useEffect(() => { fetch() }, [fetch])

  const handleApprove = async (approve: boolean) => {
    const res = await (approveLembur as any)(selectedApproval.id, approve, approvalNote)
    if ("error" in res) { toast.error(res.error!); return }
    toast.success(approve ? "Lembur disetujui" : "Lembur ditolak")
    setSelectedApproval(null)
    setApprovalNote("")
    fetch()
  }

  const filteredData = data.filter((d) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return d.nama.toLowerCase().includes(q) || d.unit.toLowerCase().includes(q) || d.alasan.toLowerCase().includes(q)
  })

  const totalApproved = data.filter((d) => d.status === "APPROVED").reduce((s, d) => s + d.totalBayar, 0)
  const totalPending = data.filter((d) => d.status === "PENDING").length

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Total Pengajuan", value: data.length, sub: "Bulan terpilih", icon: Hourglass },
          { label: "Menunggu Approval", value: totalPending, sub: "Perlu ditinjau", icon: Clock },
          { label: "Total Bayar Disetujui", value: "Rp " + totalApproved.toLocaleString("id-ID"), sub: "Kompensasi lembur disetujui", icon: Banknote },
        ].map((s, idx) => (
          <div
            key={idx}
            className="rounded-xl bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 p-4 shadow-xs hover:border-slate-300 dark:hover:border-zinc-700 transition-all"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                {s.label}
              </span>
              <s.icon className="h-4 w-4 text-slate-400 dark:text-zinc-500 shrink-0" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              {s.value}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1 truncate">
              {s.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 p-3.5 rounded-xl shadow-xs">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="w-full sm:w-[180px]">
            <Select value={bulan} onValueChange={setBulan}>
              <SelectTrigger className="h-9 text-xs rounded-lg bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {bulanOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-[150px]">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 text-xs rounded-lg bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 font-medium">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Semua Status</SelectItem>
                <SelectItem value="PENDING" className="text-xs">Pending</SelectItem>
                <SelectItem value="APPROVED" className="text-xs">Disetujui</SelectItem>
                <SelectItem value="REJECTED" className="text-xs">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau alasan..."
              className="pl-9 h-9 text-xs rounded-lg bg-slate-50/80 dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 font-medium"
            />
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetch}
          className="h-9 text-xs rounded-lg border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-medium text-slate-700 dark:text-zinc-300 shadow-2xs self-end sm:self-center"
        >
          <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Modern Table */}
      <div className="bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <RefreshCw className="h-6 w-6 text-slate-400 animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-600 dark:text-zinc-300">Memuat catatan lembur...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <Hourglass className="h-8 w-8 text-slate-300 dark:text-zinc-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Tidak ada pengajuan lembur</p>
            <p className="text-xs text-slate-400 dark:text-zinc-500">Tidak ditemukan permohonan lembur untuk periode ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="text-xs">
              <TableHeader>
                <tr className="bg-slate-50/90 dark:bg-zinc-900/90 border-b border-slate-200/80 dark:border-zinc-800 text-[11px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
                  <TableHead className="py-3 px-4 min-w-[180px]">Pegawai</TableHead>
                  <TableHead className="py-3 px-3">Tanggal</TableHead>
                  <TableHead className="py-3 px-3">Waktu Lembur</TableHead>
                  <TableHead className="py-3 px-3">Jenis Hari</TableHead>
                  <TableHead className="py-3 px-3 max-w-[200px]">Alasan Lembur</TableHead>
                  <TableHead className="py-3 px-3 text-right">Kompensasi Bayar</TableHead>
                  <TableHead className="py-3 px-3 text-center">Status</TableHead>
                  <TableHead className="py-3 px-3 text-right">Aksi</TableHead>
                </tr>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-medium">
                {filteredData.map((l) => {
                  const statusCfg = STATUS_COLOR[l.status] || STATUS_COLOR.PENDING
                  const jenisCfg = JENIS_LABEL[l.jenis] || { label: l.jenis, badge: "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300" }

                  return (
                    <tr key={l.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-zinc-800/40">
                      {/* Pegawai */}
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 rounded-lg border border-slate-200 dark:border-zinc-800">
                            <AvatarFallback className="rounded-lg text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                              {l.nama.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-zinc-100 text-xs leading-none">
                              {l.nama}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                              {l.unit}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Tanggal */}
                      <TableCell className="py-3 px-3 font-medium text-slate-800 dark:text-zinc-200 whitespace-nowrap">
                        {l.tanggal}
                      </TableCell>

                      {/* Waktu & Durasi */}
                      <TableCell className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                        <p className="text-slate-800 dark:text-zinc-200 font-medium">
                          {l.jamMulai} – {l.jamSelesai}
                        </p>
                        <p className="text-slate-400 font-sans text-[10px]">
                          Durasi: {l.durasiJam} jam
                        </p>
                      </TableCell>

                      {/* Jenis */}
                      <TableCell className="py-3 px-3">
                        <Badge variant="outline" className={cn("text-[10px] font-normal rounded-md px-2 py-0.5 border", jenisCfg.badge)}>
                          {jenisCfg.label}
                        </Badge>
                      </TableCell>

                      {/* Alasan */}
                      <TableCell className="py-3 px-3 max-w-[200px]">
                        <p className="text-slate-700 dark:text-zinc-300 truncate" title={l.alasan}>
                          {l.alasan}
                        </p>
                      </TableCell>

                      {/* Total Bayar */}
                      <TableCell className="py-3 px-3 text-right font-mono font-semibold text-slate-900 dark:text-zinc-100">
                        Rp {l.totalBayar.toLocaleString("id-ID")}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-medium border",
                          statusCfg.badge
                        )}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", statusCfg.dot)} />
                          {statusCfg.label}
                        </span>
                      </TableCell>

                      {/* Aksi */}
                      <TableCell className="py-3 px-3 text-right whitespace-nowrap">
                        {l.status === "PENDING" ? (
                          <Button
                            size="sm"
                            onClick={() => { setSelectedApproval(l); setApprovalNote("") }}
                            className="h-7 px-2.5 text-[11px] rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 font-semibold shadow-2xs"
                          >
                            Review
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSelectedApproval(l); setApprovalNote("") }}
                            className="h-7 px-2 text-[11px] rounded-lg text-slate-500"
                          >
                            Rincian
                          </Button>
                        )}
                      </TableCell>
                    </tr>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedApproval} onOpenChange={() => setSelectedApproval(null)}>
        <DialogContent className="max-w-md rounded-xl bg-white dark:bg-[#111113] border-slate-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
              Review Pengajuan Lembur
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400">
              Verifikasi durasi lembur dan kalkulasi hak kompensasi
            </DialogDescription>
          </DialogHeader>

          {selectedApproval && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 space-y-1">
                <p className="font-bold text-slate-900 dark:text-zinc-100 text-sm">
                  {selectedApproval.nama}
                </p>
                <p className="text-slate-500">{selectedApproval.unit}</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Tanggal & Waktu</span>
                  <p className="font-semibold text-slate-800 dark:text-zinc-200 mt-1">{selectedApproval.tanggal}</p>
                  <p className="text-[11px] font-mono text-slate-500">{selectedApproval.jamMulai} – {selectedApproval.jamSelesai} ({selectedApproval.durasiJam} jam)</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Total Kompensasi</span>
                  <p className="font-semibold font-mono text-slate-900 dark:text-zinc-100 text-sm mt-1">
                    Rp {selectedApproval.totalBayar.toLocaleString("id-ID")}
                  </p>
                  <p className="text-[10px] text-slate-400">Sesuai rumus PP 35/2021</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-0.5">Alasan Lembur</span>
                <p className="text-slate-700 dark:text-zinc-300">{selectedApproval.alasan}</p>
              </div>

              {selectedApproval.status === "PENDING" ? (
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Catatan Review (Opsional)</Label>
                  <Textarea
                    value={approvalNote}
                    onChange={(e) => setApprovalNote(e.target.value)}
                    rows={2}
                    placeholder="Catatan persetujuan / alasan penolakan..."
                    className="rounded-lg bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs"
                  />
                </div>
              ) : null}
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedApproval?.status === "PENDING" ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleApprove(false)}
                  className="rounded-lg text-xs h-9 border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/60 dark:hover:bg-rose-950/40"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Tolak Lembur
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleApprove(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg text-xs font-semibold h-9 px-4"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Setujui Lembur
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedApproval(null)}
                className="rounded-lg text-xs h-9"
              >
                Tutup
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ======================== MAIN PAGE ========================
export default function ShiftLemburPage() {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-[#0B0C0E]">
      <SidebarNav />

      <div className="flex flex-1 flex-col sidebar-offset min-w-0">
        <TopBar breadcrumb={["Kehadiran", "Shift & Lembur"]} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1720px] mx-auto w-full">

          {/* Clean Executive Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                  Shift & Lembur
                </h1>
                <Badge variant="outline" className="text-xs font-normal text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-800">
                  Jadwal & Kompensasi
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
                Kelola konfigurasi pola shift operasional pegawai serta proses persetujuan dan perhitungan kompensasi lembur PDAM TIARA.
              </p>
            </div>
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue="shift" className="space-y-4">
            <TabsList className="bg-slate-100/80 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 p-1 rounded-xl h-auto">
              <TabsTrigger
                value="shift"
                className="rounded-lg px-3.5 py-1.5 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-zinc-100 data-[state=active]:shadow-xs text-slate-600 dark:text-zinc-400"
              >
                <Clock className="h-3.5 w-3.5 mr-2 text-slate-400" />
                Tipe Shift Kerja
              </TabsTrigger>
              <TabsTrigger
                value="lembur"
                className="rounded-lg px-3.5 py-1.5 text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-zinc-100 data-[state=active]:shadow-xs text-slate-600 dark:text-zinc-400"
              >
                <Calendar className="h-3.5 w-3.5 mr-2 text-slate-400" />
                Pengajuan & Rekap Lembur
              </TabsTrigger>
            </TabsList>

            <TabsContent value="shift" className="mt-0">
              <ShiftTab />
            </TabsContent>

            <TabsContent value="lembur" className="mt-0">
              <LemburTab />
            </TabsContent>
          </Tabs>

        </main>
      </div>
    </div>
  )
}
