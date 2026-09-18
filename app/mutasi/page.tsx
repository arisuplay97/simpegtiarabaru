"use client"

import { useState, useEffect, useCallback } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search, Plus, ArrowRightLeft, CheckCircle2,
  XCircle, Clock, Eye, Trash2,
  Users, TrendingUp,
} from "lucide-react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

import { getMutasiList, saveMutasi, processMutasi, deleteMutasi } from "@/lib/actions/mutasi"
import { getEmployees, getBidang } from "@/lib/actions/pegawai"
import { getJabatanOptions } from "@/lib/data/bidang-store"
import { hasPermission } from "@/lib/auth/permissions"

const getStatusBadge = (status: string) => {
  switch (status) {
    case "approved":
      return (
        <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60 font-semibold text-[11px] gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Disetujui
        </Badge>
      )
    case "rejected":
      return (
        <Badge variant="outline" className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60 font-semibold text-[11px] gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Ditolak
        </Badge>
      )
    case "pending":
      return (
        <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60 font-semibold text-[11px] gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" /> Menunggu Approval
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

const getTypeBadge = (type: string) => {
  switch (type) {
    case "promosi":
      return (
        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60 font-semibold text-[11px]">
          Promosi
        </Badge>
      )
    case "demosi":
      return (
        <Badge variant="outline" className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60 font-semibold text-[11px]">
          Demosi
        </Badge>
      )
    case "rotasi":
      return (
        <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/60 font-semibold text-[11px]">
          Rotasi
        </Badge>
      )
    case "mutasi":
    default:
      return (
        <Badge variant="outline" className="bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 font-semibold text-[11px]">
          Mutasi
        </Badge>
      )
  }
}

export default function MutasiPage() {
  const { data: session } = useSession()
  const user = session?.user
  
  const isHRD = user?.role === "HRD" || user?.role === "SUPERADMIN"
  const isDireksi = user?.role === "DIREKSI" || user?.role === "SUPERADMIN"
  
  const canView = isHRD || isDireksi || hasPermission(user?.role, "mutasi.view")
  const canManage = isHRD || hasPermission(user?.role, "mutasi.manage")
  const canApprove = isDireksi || hasPermission(user?.role, "mutasi.approve")

  const [activeTab, setActiveTab] = useState("semua")
  const [searchQuery, setSearchQuery] = useState("")

  const [mutasiData, setMutasiData] = useState<any[]>([])
  const [pegawaiList, setPegawaiList] = useState<any[]>([])
  const [bidangList, setBidangList] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [showAjukanModal, setShowAjukanModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedMutasi, setSelectedMutasi] = useState<any | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    pegawaiId: "",
    type: "mutasi",
    unitTujuan: "",
    jabatanTujuan: "",
    tanggalEfektif: "",
    alasan: ""
  })

  const [approveForm, setApproveForm] = useState({
     catatan: "",
     nomorSK: ""
  })

  // Options for form
  const [jabatanOptions, setJabatanOptions] = useState<any[]>([])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const dbMutasi = await getMutasiList()
      setMutasiData(dbMutasi)

      if (canManage) {
         const pList = await getEmployees()
         setPegawaiList(pList)
         
         const bList = await getBidang()
         setBidangList(bList)
      }
    } catch (e: any) {
      toast.error(e.message || "Gagal memuat data mutasi")
    } finally {
      setIsLoading(false)
    }
  }, [canManage])

  useEffect(() => {
    if (canView) loadData()
  }, [canView, loadData])

  if (!canView) return null

  // Fetch Jabatan options based on selected unit — generate inline, no static ID dependency
  useEffect(() => {
    if (form.unitTujuan) {
      const isCabang = form.unitTujuan.toLowerCase().includes('cabang')
      if (isCabang) {
        setJabatanOptions([
          { value: "kepala_cabang", label: "Kepala Cabang" },
          { value: "kasubbid_cabang", label: "Kasubbid Cabang" },
          { value: "staff_cabang", label: "Staff Cabang" },
        ])
      } else {
        setJabatanOptions([
          { value: "kepala_bidang", label: "Kepala Bidang" },
          { value: "kasubbid", label: "Kasubbid" },
          { value: "staff", label: "Staff" },
        ])
      }
    } else {
      setJabatanOptions([])
    }
  }, [form.unitTujuan])



  const filteredData = mutasiData.filter(item => {
    const matchesSearch = item.namaPegawai.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.nik.includes(searchQuery)
    const matchesTab = activeTab === "semua" || item.status === activeTab
    return matchesSearch && matchesTab
  })

  const handleAjukan = async () => {
    if (!form.pegawaiId || !form.unitTujuan || !form.jabatanTujuan || !form.tanggalEfektif || !form.alasan) {
      toast.error("Mohon lengkapi semua field wajib")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await saveMutasi(form)
      if (res.error) throw new Error(res.error)
      
      toast.success("Pengajuan mutasi berhasil dikirim")
      setShowAjukanModal(false)
      loadData()
      setForm({
         pegawaiId: "", type: "mutasi", unitTujuan: "", jabatanTujuan: "", tanggalEfektif: "", alasan: ""
      })
    } catch (error: any) {
      toast.error(error.message || "Gagal mengirim pengajuan")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApproveReject = async (isApprove: boolean) => {
    if(!selectedMutasi) return

    if (isApprove && !approveForm.nomorSK) {
      toast.error("Nomor SK wajib diisi untuk persetujuan")
      return
    }

    setIsSubmitting(true)
    try {
      // Pass the currently logged-in user id as approver (Assuming user ID is reachable but here we'll pass email/mock ID since we don't have full session ID in this scope natively. Let's pass user id if available or fallback safely)
      const approverId = user?.id || "" // make sure user id is in the session

      const res = await processMutasi(selectedMutasi.id, isApprove, approverId, approveForm.catatan, approveForm.nomorSK)
      if (res.error) throw new Error(res.error)

      toast.success(`Mutasi berhasil di${isApprove ? 'setujui' : 'tolak'}`)
      setShowDetailModal(false)
      loadData()
      setApproveForm({ catatan: "", nomorSK: "" })
    } catch (error: any) {
       toast.error(error.message || "Gagal memproses pengajuan mutasi")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
     if(!confirm("Hapus data mutasi ini?")) return
     try {
        const res = await deleteMutasi(id)
        if(res.error) throw new Error(res.error)
        toast.success("Mutasi dihapus")
        loadData()
        setShowDetailModal(false)
     } catch(e:any) {
        toast.error(e.message)
     }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Kepegawaian", "Mutasi & Promosi"]} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">Mutasi & Promosi Pegawai</h1>
                <p className="text-slate-500 dark:text-zinc-400 text-xs sm:text-sm mt-1">
                  Kelola dan pantau rotasi, promosi, mutasi divisi, serta demosi pegawai perusahaan
                </p>
              </div>
              {canManage && (
                <Button onClick={() => setShowAjukanModal(true)} className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs">
                  <Plus className="w-3.5 h-3.5" /> Ajukan Mutasi
                </Button>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-4 shadow-2xs transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Total Mutasi</span>
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/50">
                    <ArrowRightLeft className="w-4 h-4" />
                  </div>
                </div>
                <p className="mt-2 text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-zinc-100">
                  {mutasiData.filter(m => m.type === "mutasi").length}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">Perpindahan unit/divisi kerja</p>
              </div>

              <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-4 shadow-2xs transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Promosi Jabatan</span>
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/50">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <p className="mt-2 text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-zinc-100">
                  {mutasiData.filter(m => m.type === "promosi").length}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">Kenaikan jenjang karir pegawai</p>
              </div>

              <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-4 shadow-2xs transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Menunggu Approval</span>
                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/50">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <p className="mt-2 text-2xl font-bold font-mono tracking-tight text-amber-600 dark:text-amber-400">
                  {mutasiData.filter(m => m.status === "pending").length}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">Perlu tinjauan & persetujuan Direksi</p>
              </div>

              <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-4 shadow-2xs transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Rotasi Tugas</span>
                  <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-900/50">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <p className="mt-2 text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-zinc-100">
                  {mutasiData.filter(m => m.type === "rotasi").length}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">Penyegaran tugas dalam divisi</p>
              </div>
            </div>

            {/* Table Card */}
            <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 shadow-2xs overflow-hidden">
              <div className="p-2.5 sm:px-4 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                  <TabsList className="h-8 bg-slate-200/60 dark:bg-zinc-800/70 p-0.5 rounded-lg">
                    <TabsTrigger value="semua" className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-2xs">Semua</TabsTrigger>
                    <TabsTrigger value="pending" className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-2xs">Menunggu Approval</TabsTrigger>
                    <TabsTrigger value="approved" className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-2xs">Disetujui</TabsTrigger>
                    <TabsTrigger value="rejected" className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-2xs">Ditolak</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input 
                    placeholder="Cari NIK atau nama pegawai..." 
                    className="pl-9 h-8 text-xs bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/60 dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800">
                      <TableHead className="w-[240px] text-xs font-semibold">Pegawai</TableHead>
                      <TableHead className="text-xs font-semibold">Jenis</TableHead>
                      <TableHead className="text-xs font-semibold">Posisi Asal</TableHead>
                      <TableHead className="text-xs font-semibold">Posisi Tujuan</TableHead>
                      <TableHead className="text-xs font-semibold">Tanggal Efektif</TableHead>
                      <TableHead className="text-xs font-semibold">Status</TableHead>
                      <TableHead className="text-center w-[70px] text-xs font-semibold">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={7} className="h-32 text-center text-slate-400 dark:text-zinc-500 text-xs italic">Memuat data mutasi...</TableCell></TableRow>
                    ) : filteredData.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="h-32 text-center text-slate-400 dark:text-zinc-500 text-xs italic">Tidak ada data mutasi yang cocok.</TableCell></TableRow>
                    ) : (
                      filteredData.map((item) => (
                        <TableRow key={item.id} className="border-slate-100 dark:border-zinc-800/80 hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 border border-slate-200 dark:border-zinc-800">
                                <AvatarFallback className="bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xs font-bold font-mono">{item.inisial}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-xs text-slate-900 dark:text-zinc-100 leading-tight mb-0.5">{item.namaPegawai}</p>
                                <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">{item.nik}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getTypeBadge(item.type)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col text-xs">
                              <span className="font-medium text-slate-800 dark:text-zinc-200">{item.jabatanAsal}</span>
                              <span className="text-[11px] text-slate-500 dark:text-zinc-400">{item.unitAsal}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col text-xs">
                              <span className="font-semibold text-blue-600 dark:text-blue-400">{item.jabatanTujuan}</span>
                              <span className="text-[11px] text-slate-500 dark:text-zinc-400">{item.unitTujuan}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-mono text-slate-700 dark:text-zinc-300">{item.tanggalEfektif}</span>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(item.status)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100"
                              onClick={() => {
                                setSelectedMutasi(item)
                                setShowDetailModal(true)
                              }}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* DIALOG AJUKAN MUTASI */}
      <Dialog open={showAjukanModal} onOpenChange={setShowAjukanModal}>
        <DialogContent className="sm:max-w-[560px] border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-zinc-100 text-base font-bold">Form Pengajuan Mutasi & Promosi</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400">
              Isi data pergerakan karir pegawai baru sesuai kebijakan perusahaan.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3.5 py-2 max-h-[70vh] overflow-y-auto px-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Pegawai</Label>
              <Select value={form.pegawaiId} onValueChange={(val) => setForm({...form, pegawaiId: val})}>
                <SelectTrigger className="h-9 text-xs bg-slate-50/50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                  <SelectValue placeholder="Pilih Pegawai..." />
                </SelectTrigger>
                <SelectContent className="border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                   {pegawaiList.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nama} - {p.nik}</SelectItem>
                   ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Jenis Pergerakan</Label>
              <Select value={form.type} onValueChange={(val) => setForm({...form, type: val})}>
                <SelectTrigger className="h-9 text-xs bg-slate-50/50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                  <SelectValue placeholder="Pilih Jenis..." />
                </SelectTrigger>
                <SelectContent className="border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                  <SelectItem value="mutasi">Mutasi (Pindah Unit / Lokasi)</SelectItem>
                  <SelectItem value="promosi">Promosi (Kenaikan Jenjang Jabatan)</SelectItem>
                  <SelectItem value="rotasi">Rotasi (Penyegaran Jobdesk / Bagian)</SelectItem>
                  <SelectItem value="demosi">Demosi (Penurunan Level Jabatan)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Unit / Bidang Tujuan</Label>
                <Select value={form.unitTujuan} onValueChange={(val) => setForm({...form, unitTujuan: val})}>
                  <SelectTrigger className="h-9 text-xs bg-slate-50/50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                    <SelectValue placeholder="Pilih Unit Tujuan..." />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                     {bidangList.map(b => (
                        <SelectItem key={b.id || b.kode} value={b.nama}>{b.nama}</SelectItem>
                     ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Jabatan Baru</Label>
                <Input
                  placeholder="Contoh: Kepala Seksi Distribusi"
                  value={form.jabatanTujuan}
                  onChange={e => setForm({...form, jabatanTujuan: e.target.value})}
                  className="h-9 text-xs bg-slate-50/50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Tanggal Efektif Berlaku</Label>
              <Input 
                 type="date" 
                 value={form.tanggalEfektif} 
                 onChange={e => setForm({...form, tanggalEfektif: e.target.value})}
                 className="h-9 text-xs bg-slate-50/50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Alasan & Dasar Pertimbangan</Label>
              <Textarea 
                placeholder="Deskripsikan alasan mutasi/promosi, dasar SK, atau evaluasi kinerja..." 
                className="resize-none text-xs bg-slate-50/50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 min-h-[70px]"
                value={form.alasan}
                onChange={e => setForm({...form, alasan: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowAjukanModal(false)}>Batal</Button>
            <Button size="sm" onClick={handleAjukan} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
               {isSubmitting ? "Mengirim..." : "Kirim Pengajuan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG DETAIL / APPROVAL */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="sm:max-w-[560px] border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-zinc-100 text-base font-bold">Detail Mutasi & Promosi</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-zinc-400">Informasi lengkap pergerakan posisi pegawai.</DialogDescription>
          </DialogHeader>
          
          {selectedMutasi && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border border-slate-200 dark:border-zinc-800">
                    <AvatarFallback className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold">{selectedMutasi.inisial}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-xs text-slate-900 dark:text-zinc-100">{selectedMutasi.namaPegawai}</p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">{selectedMutasi.nik}</p>
                  </div>
                </div>
                {getStatusBadge(selectedMutasi.status)}
              </div>

              {/* Current vs Target */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-800 rounded-xl p-3.5">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Posisi Asal</p>
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-900 dark:text-zinc-100">{selectedMutasi.jabatanAsal}</p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">{selectedMutasi.unitAsal}</p>
                  </div>
                </div>
                
                <div className="bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/50 rounded-xl p-3.5">
                  <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">Posisi Tujuan ({selectedMutasi.type.toUpperCase()})</p>
                  <div className="space-y-0.5">
                    <p className="font-semibold text-blue-950 dark:text-blue-200">{selectedMutasi.jabatanTujuan}</p>
                    <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80">{selectedMutasi.unitTujuan}</p>
                  </div>
                </div>
              </div>

              {/* Status & Dates */}
              <div className="grid grid-cols-2 gap-3 text-xs p-3 rounded-lg bg-slate-50/60 dark:bg-zinc-800/30 border border-slate-100 dark:border-zinc-800">
                <div>
                  <span className="text-slate-400 dark:text-zinc-500 block text-[11px]">Tanggal Pengajuan</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-zinc-100">{selectedMutasi.tanggalPengajuan}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-zinc-500 block text-[11px]">Tanggal Efektif Berlaku</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{selectedMutasi.tanggalEfektif}</span>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Alasan & Pertimbangan</h4>
                <div className="p-3 bg-slate-50 dark:bg-zinc-800/40 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">
                  {selectedMutasi.alasan}
                </div>
              </div>

              {selectedMutasi.status !== "pending" && (
                <div className="p-3 bg-slate-100/70 dark:bg-zinc-800/60 rounded-xl border border-slate-200/80 dark:border-zinc-700/60 text-xs space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Informasi Keputusan Direksi</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 block text-[10px]">Diresmikan Oleh</span>
                      <span className="font-medium text-slate-900 dark:text-zinc-100">{selectedMutasi.approvedBy || "Direksi / HRD"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 block text-[10px]">Nomor SK Direksi</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{selectedMutasi.nomorSK || "-"}</span>
                    </div>
                  </div>
                  {selectedMutasi.catatanApproval && (
                    <div className="pt-1.5 border-t border-slate-200 dark:border-zinc-700">
                      <span className="text-slate-400 dark:text-zinc-500 block text-[10px]">Catatan Keputusan</span>
                      <span className="text-slate-700 dark:text-zinc-300">{selectedMutasi.catatanApproval}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Approve form for DIREKSI or SUPERADMIN if pending */}
              {selectedMutasi.status === "pending" && canApprove && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-zinc-800 space-y-3">
                   <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">Tindakan Otorisasi Direksi</h4>
                   <div className="space-y-2.5">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Nomor SK Direksi <span className="text-rose-500">*</span></Label>
                        <Input 
                           placeholder="Contoh: SK/DIR/MUT/2026/012" 
                           value={approveForm.nomorSK}
                           onChange={e => setApproveForm({...approveForm, nomorSK: e.target.value})}
                           className="h-9 text-xs font-mono bg-slate-50/50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Catatan Otorisasi (Opsional)</Label>
                        <Textarea 
                           placeholder="Catatan tambahan untuk pegawai atau arsip HRD..."
                           value={approveForm.catatan}
                           onChange={e => setApproveForm({...approveForm, catatan: e.target.value})}
                           className="text-xs bg-slate-50/50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 min-h-[60px]"
                        />
                      </div>
                   </div>
                </div>
              )}

            </div>
          )}

          <DialogFooter className="flex-row sm:justify-between items-center w-full pt-2">
            <div>
              {selectedMutasi?.status === "pending" && canManage && (
                 <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs" onClick={() => handleDelete(selectedMutasi.id)} disabled={isSubmitting}>
                    <Trash2 className="w-3.5 h-3.5 mr-1.5"/> Hapus Pengajuan
                 </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowDetailModal(false)}>Tutup</Button>
              {selectedMutasi?.status === "pending" && canApprove && (
                <>
                  <Button variant="outline" size="sm" className="border-rose-200 dark:border-rose-900/50 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40" onClick={() => handleApproveReject(false)} disabled={isSubmitting}>Tolak</Button>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleApproveReject(true)} disabled={isSubmitting}>Setujui & Terbitkan SK</Button>
                </>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
