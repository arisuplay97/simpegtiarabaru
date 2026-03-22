"use client"

import { useState, useEffect, useCallback } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Search,
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  User,
  Building2,
  TrendingUp,
  Send,
  Eye,
  MoreHorizontal,
  Star,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { getPangkatData, ajukanPangkat, updateStatusPangkat } from "@/lib/actions/pangkat"

const getStatusBadge = (status: string) => {
  switch (status) {
    case "APPROVED":
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Disetujui</Badge>
    case "REJECTED":
      return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200 border-none"><XCircle className="w-3 h-3 mr-1" /> Ditolak</Badge>
    case "PENDING":
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none"><Clock className="w-3 h-3 mr-1" /> Diproses</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function KenaikanPangkatPage() {
  const { data: session } = useSession()
  const isHRD = session?.user?.role === "HRD" || session?.user?.role === "SUPERADMIN"
  
  const [activeTab, setActiveTab] = useState("eligible")
  const [searchTerm, setSearchTerm] = useState("")
  
  const [eligibleList, setEligibleList] = useState<any[]>([])
  const [riwayatList, setRiwayatList] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [showAjukanDialog, setShowAjukanDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedPegawai, setSelectedPegawai] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [ajukanForm, setAjukanForm] = useState({
    tanggalBerlaku: "",
    keterangan: ""
  })

  // Load live data
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const { eligible, riwayat } = await getPangkatData()
      setEligibleList(eligible || [])
      setRiwayatList(riwayat || [])
    } catch (e) {
      toast.error("Gagal memuat data Kenaikan Pangkat")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredEligible = eligibleList.filter(item =>
    item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.nik.includes(searchTerm)
  )

  const filteredRiwayat = riwayatList.filter(item =>
    item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.nik.includes(searchTerm)
  )

  const handleAjukanClick = (pegawai: any) => {
    setSelectedPegawai(pegawai)
    setAjukanForm({
      tanggalBerlaku: pegawai.eligibleDate,
      keterangan: ""
    })
    setShowAjukanDialog(true)
  }

  const submitPengajuan = async () => {
    if(!selectedPegawai) return
    setIsSubmitting(true)
    try {
      const payload = {
        pegawaiId: selectedPegawai.pegawaiId,
        tanggalBerlaku: ajukanForm.tanggalBerlaku,
        pangkatLama: selectedPegawai.pangkatSaatIni,
        golonganLama: selectedPegawai.golonganSaatIni,
        pangkatBaru: selectedPegawai.pangkatBaru,
        golonganBaru: selectedPegawai.golonganBaru,
        keterangan: ajukanForm.keterangan || null
      }
      
      const res = await ajukanPangkat(payload)
      if (res.error) throw new Error(res.error)
      
      toast.success("Pengajuan Kenaikan Pangkat berhasil disimpan untuk diproses.")
      setShowAjukanDialog(false)
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Gagal mengajukan kenaikan pangkat")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusUpdate = async (id: string, isApprove: boolean) => {
    try {
      const res = await updateStatusPangkat(id, isApprove)
      if (res.error) throw new Error(res.error)
      
      toast.success(`Pengajuan pangkat berhasil di${isApprove ? 'setujui' : 'tolak'}.`)
      fetchData()
      setShowDetailDialog(false)
    } catch (e: any) {
      toast.error(e.message || "Gagal memproses pengajuan pangkat")
    }
  }

  const summaryStats = [
    {
      title: "Eligible Tahun Ini",
      value: eligibleList.length.toString(),
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Menunggu Approval",
      value: riwayatList.filter(r => r.status === "PENDING").length.toString(),
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      title: "Pangkat Naik (YTD)",
      value: riwayatList.filter(r => r.status === "APPROVED").length.toString(),
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
  ]

  return (
    <>
      <div className="flex min-h-screen bg-slate-50">
        <SidebarNav />
        <div className="flex flex-1 flex-col sidebar-offset">
          <TopBar breadcrumb={["Kepegawaian", "Kenaikan Pangkat"]} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Kenaikan Pangkat Reguler</h1>
                  <p className="text-slate-500 text-sm mt-1">
                    Administrasi kenaikan pangkat, penyesuaian ijazah, dan pengusulan SK
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" /> Export
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {summaryStats.map((stat, i) => (
                  <Card key={i} className="border-slate-200 shadow-sm">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
                        <h3 className="text-2xl font-bold text-slate-900">{isLoading ? "-" : stat.value}</h3>
                      </div>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bgColor}`}>
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <TabsList className="bg-white border p-1 rounded-lg">
                    <TabsTrigger value="eligible" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <Star className="w-4 h-4 mr-2" />
                      Daftar Eligible ({eligibleList.length})
                    </TabsTrigger>
                    <TabsTrigger value="pengajuan" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <FileText className="w-4 h-4 mr-2" />
                      Proses & Riwayat ({riwayatList.length})
                    </TabsTrigger>
                  </TabsList>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Cari Pegawai..." 
                      className="pl-9 bg-white"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* TAB 1: ELIGIBLE */}
                <TabsContent value="eligible" className="m-0">
                  <Card className="border-slate-200 shadow-sm">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-slate-50/80">
                          <TableRow>
                            <TableHead className="w-[280px]">Pegawai</TableHead>
                            <TableHead>Pangkat/Gol Lama</TableHead>
                            <TableHead>Pangkat/Gol Baru</TableHead>
                            <TableHead>TMT Diusulkan</TableHead>
                            <TableHead className="text-center">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isLoading ? (
                            <TableRow><TableCell colSpan={5} className="h-32 text-center text-slate-500">Memuat data...</TableCell></TableRow>
                          ) : filteredEligible.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="h-32 text-center text-slate-500">Tidak ada data pegawai eligible (minimal 4 tahun masa kerja).</TableCell></TableRow>
                          ) : (
                            filteredEligible.map((pegawai) => (
                              <TableRow key={pegawai.pegawaiId} className="hover:bg-slate-50/50">
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 border">
                                      <AvatarFallback className="bg-primary/10 text-primary">
                                        {(pegawai.nama||"P").substring(0,2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium text-slate-900">{pegawai.nama}</p>
                                      <p className="text-xs text-slate-500 font-mono">{pegawai.nik}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="text-sm font-medium text-slate-700">{pegawai.pangkatSaatIni}</p>
                                    <Badge variant="outline" className="mt-1 font-mono">{pegawai.golonganSaatIni}</Badge>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="text-sm font-medium text-emerald-700">{pegawai.pangkatBaru}</p>
                                    <Badge className="mt-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none font-mono">{pegawai.golonganBaru}</Badge>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <div>
                                      <p className="text-sm font-medium">{pegawai.eligibleDate}</p>
                                      <p className="text-xs text-amber-600 font-medium">Sisa {pegawai.sisaHari} hari</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Button size="sm" onClick={() => handleAjukanClick(pegawai)} disabled={!isHRD}>
                                    <Send className="w-4 h-4 mr-2" /> Usulkan
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                </TabsContent>

                {/* TAB 2: RIWAYAT / PENGAJUAN */}
                <TabsContent value="pengajuan" className="m-0">
                  <Card className="border-slate-200 shadow-sm">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-slate-50/80">
                          <TableRow>
                            <TableHead className="w-[250px]">Pegawai</TableHead>
                            <TableHead>Gol. Lama</TableHead>
                            <TableHead>Gol. Baru</TableHead>
                            <TableHead>Pengajuan</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="w-[80px] text-center"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isLoading ? (
                            <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-500">Memuat data...</TableCell></TableRow>
                          ) : filteredRiwayat.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-500">Belum ada riwayat pengajuan Kenaikan Pangkat.</TableCell></TableRow>
                          ) : (
                            filteredRiwayat.map((p) => (
                              <TableRow key={p.id} className="hover:bg-slate-50/50">
                                <TableCell>
                                  <p className="font-medium text-slate-900">{p.nama}</p>
                                  <p className="text-xs text-slate-500">{p.unit}</p>
                                </TableCell>
                                <TableCell>
                                  <p className="text-sm font-medium">{p.pangkatLama}</p>
                                  <p className="text-xs text-muted-foreground">{p.golonganLama}</p>
                                </TableCell>
                                <TableCell>
                                  <p className="text-sm font-medium text-emerald-700">{p.pangkatBaru}</p>
                                  <p className="text-xs text-emerald-600">{p.golonganBaru}</p>
                                </TableCell>
                                <TableCell>
                                  <p className="text-sm">{p.tanggalPengajuan}</p>
                                  <p className="text-xs text-muted-foreground">TMT: {p.tmtBaru}</p>
                                </TableCell>
                                <TableCell className="text-center">
                                  {getStatusBadge(p.status)}
                                </TableCell>
                                <TableCell className="text-center">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => {
                                        setSelectedPegawai(p)
                                        setShowDetailDialog(true)
                                      }}>
                                        <Eye className="w-4 h-4 mr-2" /> Detail
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>

      {/* DIALOG USULKAN PANGKAT */}
      <Dialog open={showAjukanDialog} onOpenChange={setShowAjukanDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Pengajuan Kenaikan Pangkat</DialogTitle>
            <DialogDescription>
              Usulkan penyesuaian pangkat reguler ke Direksi.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
             <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border">
                <div>
                   <p className="text-xs text-slate-500 uppercase">Saat Ini</p>
                   <p className="font-medium text-sm mt-1">{selectedPegawai?.pangkatSaatIni}</p>
                   <p className="text-xs text-muted-foreground">{selectedPegawai?.golonganSaatIni}</p>
                </div>
                <div>
                   <p className="text-xs text-emerald-600 uppercase">Usulan Baru</p>
                   <p className="font-bold text-sm text-emerald-700 mt-1">{selectedPegawai?.pangkatBaru}</p>
                   <p className="text-xs text-emerald-600">{selectedPegawai?.golonganBaru}</p>
                </div>
             </div>
             
             <div className="space-y-2">
                <Label>Tanggal Mulai Tugas (TMT) Baru</Label>
                <Input 
                   type="date" 
                   value={ajukanForm.tanggalBerlaku}
                   onChange={e => setAjukanForm({...ajukanForm, tanggalBerlaku: e.target.value})}
                />
             </div>
             <div className="space-y-2">
                <Label>Catatan Pengajuan</Label>
                <Textarea 
                   placeholder="Catatan prestasi, atau info tambahan lain terkait pengajuan ini..."
                   value={ajukanForm.keterangan}
                   onChange={e => setAjukanForm({...ajukanForm, keterangan: e.target.value})}
                />
             </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAjukanDialog(false)}>Batal</Button>
            <Button onClick={submitPengajuan} disabled={isSubmitting}>
              {isSubmitting ? "Memproses..." : "Ajukan Kenaikan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* DIALOG DETAIL / APPROVAL */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Validasi Kenaikan Pangkat</DialogTitle>
            <DialogDescription>Tinjuau usulan dan berikan persetujuan.</DialogDescription>
          </DialogHeader>
          {selectedPegawai && (
             <div className="py-4 space-y-4">
               <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-lg">{selectedPegawai.nama}</h4>
                    <p className="text-sm text-muted-foreground">{selectedPegawai.nik}</p>
                  </div>
                  {getStatusBadge(selectedPegawai.status)}
               </div>
               <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border">
                  <div>
                     <p className="text-xs text-muted-foreground">Golongan Lama</p>
                     <p className="font-medium">{selectedPegawai.pangkatLama} - {selectedPegawai.golonganLama}</p>
                  </div>
                  <div>
                     <p className="text-xs text-emerald-600">Usulan Golongan Baru</p>
                     <p className="font-bold text-emerald-700">{selectedPegawai.pangkatBaru} - {selectedPegawai.golonganBaru}</p>
                  </div>
               </div>
               {selectedPegawai.keterangan && (
                 <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
                   <p className="text-xs font-semibold text-blue-800">Catatan/Alasan:</p>
                   <p className="text-sm mt-1 text-slate-700">{selectedPegawai.keterangan}</p>
                 </div>
               )}
             </div>
          )}
          <DialogFooter>
             <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Tutup</Button>
             {selectedPegawai?.status === "PENDING" && isHRD && (
                <>
                  <Button variant="destructive" onClick={() => handleStatusUpdate(selectedPegawai.id, false)}>Tolak Usulan</Button>
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleStatusUpdate(selectedPegawai.id, true)}>Setujui Kenaikan</Button>
                </>
             )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
