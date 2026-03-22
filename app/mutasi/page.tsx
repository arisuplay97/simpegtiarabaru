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
      return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle2 className="w-3 h-3 mr-1" /> Disetujui</Badge>
    case "rejected":
      return <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"><XCircle className="w-3 h-3 mr-1" /> Ditolak</Badge>
    case "pending":
      return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><Clock className="w-3 h-3 mr-1" /> Diproses</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

const getTypeBadge = (type: string) => {
  switch (type) {
    case "promosi":
      return <Badge className="bg-blue-100 text-blue-700 border-none">Promosi</Badge>
    case "demosi":
      return <Badge className="bg-rose-100 text-rose-700 border-none">Demosi</Badge>
    case "rotasi":
      return <Badge className="bg-purple-100 text-purple-700 border-none">Rotasi</Badge>
    case "mutasi":
    default:
      return <Badge className="bg-slate-100 text-slate-700 border-none">Mutasi</Badge>
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
  const [jabatanOptions, setJabatanOptions] = useState<string[]>([])

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

  // Fetch Jabatan options based on selected unit
  useEffect(() => {
    if (form.unitTujuan) {
      const selectedBidang = bidangList.find(b => b.nama === form.unitTujuan)
      if (selectedBidang) {
         setJabatanOptions(getJabatanOptions(selectedBidang.kode))
      } else {
         setJabatanOptions(getJabatanOptions("UMUM"))
      }
    } else {
      setJabatanOptions([])
    }
  }, [form.unitTujuan, bidangList])


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
    <div className="flex min-h-screen bg-slate-50">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Kepegawaian", "Mutasi & Promosi"]} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mutasi & Promosi Pegawai</h1>
                <p className="text-slate-500 text-sm mt-1">
                  Kelola dan pantau pergerakan karir pegawai PDAM Tirta
                </p>
              </div>
              {canManage && (
                <Button onClick={() => setShowAjukanModal(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Ajukan Mutasi
                </Button>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-slate-200">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><ArrowRightLeft className="w-5 h-5" /></div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Mutasi</p>
                    <p className="text-2xl font-bold">{mutasiData.filter(m => m.type === "mutasi").length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp className="w-5 h-5" /></div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Promosi</p>
                    <p className="text-2xl font-bold">{mutasiData.filter(m => m.type === "promosi").length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><Clock className="w-5 h-5" /></div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Pending</p>
                    <p className="text-2xl font-bold">{mutasiData.filter(m => m.status === "pending").length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-200">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Users className="w-5 h-5" /></div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Rotasi</p>
                    <p className="text-2xl font-bold">{mutasiData.filter(m => m.type === "rotasi").length}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <div className="p-1 border-b bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                  <TabsList className="bg-transparent">
                    <TabsTrigger value="semua" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Semua</TabsTrigger>
                    <TabsTrigger value="pending" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Menunggu Approval</TabsTrigger>
                    <TabsTrigger value="approved" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Disetujui</TabsTrigger>
                    <TabsTrigger value="rejected" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Ditolak</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="relative w-full sm:w-72 px-4 pb-4 sm:p-0">
                  <Search className="absolute left-6 sm:left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Cari NIK atau Nama Pegawai..." 
                    className="pl-9 mr-4 sm:mr-0 bg-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead className="w-[250px]">Pegawai</TableHead>
                      <TableHead>Jenis</TableHead>
                      <TableHead>Dari</TableHead>
                      <TableHead>Ke (Tujuan)</TableHead>
                      <TableHead>Tanggal Efektif</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center w-[80px]">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={7} className="h-32 text-center text-slate-500">Memuat data mutasi...</TableCell></TableRow>
                    ) : filteredData.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="h-32 text-center text-slate-500">Pencarian tidak ditemukan.</TableCell></TableRow>
                    ) : (
                      filteredData.map((item) => (
                        <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 border">
                                <AvatarFallback className="bg-primary/5 text-primary text-xs font-semibold">{item.inisial}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-slate-900 leading-none mb-1">{item.namaPegawai}</p>
                                <p className="text-xs text-slate-500 font-mono">{item.nik}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getTypeBadge(item.type)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-slate-700">{item.jabatanAsal}</span>
                              <span className="text-xs text-slate-500">{item.unitAsal}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-emerald-700">{item.jabatanTujuan}</span>
                              <span className="text-xs text-emerald-600/80">{item.unitTujuan}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{item.tanggalEfektif}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 items-start">
                              {getStatusBadge(item.status)}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                setSelectedMutasi(item)
                                setShowDetailModal(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>

          </div>
        </main>
      </div>

      {/* DIALOG AJUKAN MUTASI */}
      <Dialog open={showAjukanModal} onOpenChange={setShowAjukanModal}>
        <DialogContent className="sm:max-w-[600px] overflow-visible">
          <DialogHeader>
            <DialogTitle>Form Pengajuan Mutasi / Promosi</DialogTitle>
            <DialogDescription>
              Isi data pergerakan karir pegawai baru sesuai kebijakan perusahaan.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="space-y-2">
              <Label>Pegawai</Label>
              <Select value={form.pegawaiId} onValueChange={(val) => setForm({...form, pegawaiId: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Pegawai" />
                </SelectTrigger>
                <SelectContent>
                   {pegawaiList.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nama} - {p.nik}</SelectItem>
                   ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Jenis Pergerakan</Label>
              <Select value={form.type} onValueChange={(val) => setForm({...form, type: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mutasi">Mutasi (Pindah Unit, Level Sama)</SelectItem>
                  <SelectItem value="promosi">Promosi (Naik Level Jabatan)</SelectItem>
                  <SelectItem value="rotasi">Rotasi (Pindah Jobdesk, Unit Sama)</SelectItem>
                  <SelectItem value="demosi">Demosi (Turun Level Jabatan)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unit / Bidang Tujuan</Label>
                <Select value={form.unitTujuan} onValueChange={(val) => setForm({...form, unitTujuan: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Unit" />
                  </SelectTrigger>
                  <SelectContent>
                     {bidangList.map(b => (
                        <SelectItem key={b.kode} value={b.nama}>{b.nama}</SelectItem>
                     ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Jabatan Tujuan</Label>
                <Select value={form.jabatanTujuan} onValueChange={(val) => setForm({...form, jabatanTujuan: val})} disabled={!form.unitTujuan}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Jabatan" />
                  </SelectTrigger>
                  <SelectContent>
                     {jabatanOptions.map(j => (
                        <SelectItem key={j} value={j}>{j}</SelectItem>
                     ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tanggal Efektif</Label>
              <Input 
                 type="date" 
                 value={form.tanggalEfektif} 
                 onChange={e => setForm({...form, tanggalEfektif: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Alasan Pengajuan</Label>
              <Textarea 
                placeholder="Deskripsikan alasan atau dasar pertimbangan HRD..." 
                className="resize-none"
                value={form.alasan}
                onChange={e => setForm({...form, alasan: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAjukanModal(false)}>Batal</Button>
            <Button onClick={handleAjukan} disabled={isSubmitting}>
               {isSubmitting ? "Mengirim..." : "Ajukan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG DETAIL / APPROVAL */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detail Mutasi & Promosi</DialogTitle>
            <DialogDescription>Informasi pergerakan posisi pegawai.</DialogDescription>
          </DialogHeader>
          
          {selectedMutasi && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-slate-200">
                    <AvatarFallback className="bg-primary/10 text-primary">{selectedMutasi.inisial}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-slate-900">{selectedMutasi.namaPegawai}</p>
                    <p className="text-xs text-slate-500 font-mono">{selectedMutasi.nik}</p>
                  </div>
                </div>
                {getStatusBadge(selectedMutasi.status)}
              </div>

              {/* Current vs Target */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Posisi Asal</p>
                  <div className="space-y-1">
                    <p className="font-medium text-slate-900">{selectedMutasi.jabatanAsal}</p>
                    <p className="text-sm text-slate-500">{selectedMutasi.unitAsal}</p>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-100/50 rounded-full"></div>
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-3 relative z-10">Tujuan ({selectedMutasi.type.toUpperCase()})</p>
                  <div className="space-y-1 relative z-10">
                    <p className="font-semibold text-blue-900">{selectedMutasi.jabatanTujuan}</p>
                    <p className="text-sm text-blue-700">{selectedMutasi.unitTujuan}</p>
                  </div>
                </div>
              </div>

              {/* Status & Dates */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 block text-xs">Tanggal Pengajuan</span>
                  <span className="font-medium">{selectedMutasi.tanggalPengajuan}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Tanggal Efektif Berlaku</span>
                  <span className="font-medium text-emerald-600">{selectedMutasi.tanggalEfektif}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-900">Alasan/Pertimbangan</h4>
                <div className="p-3 bg-slate-50 rounded-lg border text-sm text-slate-700">
                  {selectedMutasi.alasan}
                </div>
              </div>

              {selectedMutasi.status !== "pending" && (
                <div className="p-4 bg-slate-100 rounded-lg">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Informasi Approval</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div>
                      <span className="text-slate-500 block text-xs">Diresmikan Oleh</span>
                      <span className="font-medium">{selectedMutasi.approvedBy || "Admin"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs">Nomor SK Direksi</span>
                      <span className="font-medium text-blue-600 font-mono">{selectedMutasi.nomorSK || "-"}</span>
                    </div>
                  </div>
                  {selectedMutasi.catatanApproval && (
                    <div className="mt-3 text-sm">
                      <span className="text-slate-500 block text-xs">Catatan Direksi</span>
                      <span>{selectedMutasi.catatanApproval}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Approve form for DIREKSI or SUPERADMIN if pending */}
              {selectedMutasi.status === "pending" && canApprove && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                   <h4 className="text-sm font-semibold text-slate-900 mb-3">Tindakan Admin/Direksi</h4>
                   <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label>Nomor SK Direksi <span className="text-red-500">*</span></Label>
                            <Input 
                               placeholder="Contoh: SK/MUT/2026/001" 
                               value={approveForm.nomorSK}
                               onChange={e => setApproveForm({...approveForm, nomorSK: e.target.value})}
                            />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <Label>Catatan Pribadi/Direksi</Label>
                         <Textarea 
                            placeholder="Opsional..."
                            value={approveForm.catatan}
                            onChange={e => setApproveForm({...approveForm, catatan: e.target.value})}
                         />
                      </div>
                   </div>
                </div>
              )}

            </div>
          )}

          <DialogFooter className="flex-row sm:justify-between items-center w-full">
            <div>
              {selectedMutasi?.status === "pending" && canManage && (
                 <Button variant="ghost" className="text-red-500" onClick={() => handleDelete(selectedMutasi.id)} disabled={isSubmitting}>
                    <Trash2 className="w-4 h-4 mr-2"/> Batal/Hapus Pengajuan
                 </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>Tutup</Button>
              {selectedMutasi?.status === "pending" && canApprove && (
                <>
                  <Button variant="destructive" onClick={() => handleApproveReject(false)} disabled={isSubmitting}>Tolak</Button>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleApproveReject(true)} disabled={isSubmitting}>Setujui & Terbitkan SK</Button>
                </>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
