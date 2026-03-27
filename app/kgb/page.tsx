"use client"

import { useState, useEffect, useCallback } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingUp,
  Send,
  Eye,
  MoreHorizontal,
  RefreshCw,
  ArrowUpCircle,
  Wallet,
  Calculator,
  Users,
  Printer,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { getKGBData, ajukanKGB, updateStatusKGB } from "@/lib/actions/kgb"

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function KGBPage() {
  const { data: session } = useSession()
  const isHRD = session?.user?.role === "HRD" || session?.user?.role === "SUPERADMIN"
  

  const [eligibleList, setEligibleList] = useState<any[]>([])
  const [riwayatList, setRiwayatList] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [activeTab, setActiveTab] = useState("eligible")
  const [searchQuery, setSearchQuery] = useState("")
  const [showAjukanDialog, setShowAjukanDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedPegawai, setSelectedPegawai] = useState<any>(null)
  
  const [ajukanForm, setAjukanForm] = useState({
    nomorSurat: "823.3/001/PDAM/IV/2026",
    tanggalBerlaku: "", // akan diisi TMT Baru
    gajiPokokLama: 0,
    gajiPokokBaru: 0,
    catatan: ""
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const { eligible, riwayat } = await getKGBData()
      setEligibleList(eligible || [])
      setRiwayatList(riwayat || [])
    } catch (e) {
      toast.error("Gagal memuat data KGB")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredEligible = eligibleList.filter((item) =>
    item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.nik.includes(searchQuery)
  )

  const filteredRiwayat = riwayatList.filter(
    (item) =>
      item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nik.includes(searchQuery)
  )

  const handleAjukanClick = (pegawai: any) => {
    setSelectedPegawai(pegawai)
    setAjukanForm({
      nomorSurat: `823.3/${Math.floor(Math.random()*100)}/PDAM/IV/2026`,
      tanggalBerlaku: pegawai.eligibleDate,
      gajiPokokLama: pegawai.gajiPokokSaatIni,
      gajiPokokBaru: pegawai.gajiPokokBaru,
      catatan: ""
    })
    setShowAjukanDialog(true)
  }

  const submitKGB = async () => {
    setIsSubmitting(true)
    try {
      const res = await ajukanKGB({
        pegawaiId: selectedPegawai.pegawaiId,
        tanggalBerlaku: ajukanForm.tanggalBerlaku,
        gajiPokokLama: ajukanForm.gajiPokokLama,
        gajiPokokBaru: ajukanForm.gajiPokokBaru,
        catatan: ajukanForm.catatan,
      })
      if (res.error) throw new Error(res.error)
      
      toast.success("Pengajuan KGB berhasil dikirim untuk diproses.")
      setShowAjukanDialog(false)
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Gagal mengajukan KGB")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusUpdate = async (id: string, isApprove: boolean) => {
    try {
      const res = await updateStatusKGB(id, isApprove)
      if (res.error) throw new Error(res.error)
      
      toast.success(`KGB berhasil di${isApprove ? 'setujui' : 'tolak'}`)
      fetchData()
      setShowDetailDialog(false)
    } catch (e: any) {
      toast.error(e.message || "Gagal memproses KGB")
    }
  }

  // Cards summary
  const summaryStats = [
    {
      title: "Eligible Bulan Ini",
      value: eligibleList.filter(e => e.sisaHari <= 30).length.toString(),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Dalam Proses",
      value: riwayatList.filter(r => r.status === "PENDING").length.toString(),
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      title: "Disetujui Tahun Ini",
      value: riwayatList.filter(r => r.status === "APPROVED").length.toString(),
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
  ]

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

  return (
    <>
      <div className="flex min-h-screen bg-slate-50">
        <SidebarNav />
        <div className="flex flex-1 flex-col sidebar-offset">
          <TopBar breadcrumb={["Kepegawaian", "Kenaikan Gaji Berkala"]} />
          <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
              
              {/* Header section */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Kenaikan Gaji Berkala (KGB)</h1>
                  <p className="text-slate-500 text-sm mt-1">
                    Kelola pengajuan dan administrasi Kenaikan Gaji Berkala pegawai
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Download className="w-4 h-4 mr-2" />
                    Export Laporan
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
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

              {/* Main Content Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <TabsList className="bg-white border text-slate-600 rounded-lg p-1 h-auto">
                    <TabsTrigger value="eligible" className="py-2 px-4 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Eligible KGB ({eligibleList.length})
                    </TabsTrigger>
                    <TabsTrigger value="riwayat" className="py-2 px-4 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <FileText className="w-4 h-4 mr-2" />
                      Proses & Riwayat ({riwayatList.length})
                    </TabsTrigger>
                  </TabsList>

                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Cari NIK atau Nama Pegawai..." 
                      className="pl-9 bg-white border-slate-200"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* TAB 1: ELIGIBLE KGB */}
                <TabsContent value="eligible" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                  <Card className="border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-slate-50/80">
                          <TableRow>
                            <TableHead className="w-[280px]">Pegawai</TableHead>
                            <TableHead>Jabatan & Unit</TableHead>
                            <TableHead>Tgl. Berlaku KGB</TableHead>
                            <TableHead className="text-right">Gaji Pokok Lama</TableHead>
                            <TableHead className="text-right">Gaji Pokok Baru</TableHead>
                            <TableHead className="text-center">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isLoading ? (
                            <TableRow>
                              <TableCell colSpan={6} className="h-32 text-center text-slate-500">Memuat data...</TableCell>
                            </TableRow>
                          ) : filteredEligible.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                                Tidak ada pegawai yang masuk periode KGB saat ini. (Minimal terdeteksi 60 hari sebelum tanggal berlaku).
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredEligible.map((pegawai) => (
                              <TableRow key={pegawai.pegawaiId} className="hover:bg-slate-50/50">
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 border border-slate-200">
                                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
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
                                  <p className="text-sm font-medium text-slate-700">{pegawai.jabatan}</p>
                                  <p className="text-xs text-slate-500">{pegawai.unit} • Gol {pegawai.golongan}</p>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <div>
                                      <p className="text-sm font-medium text-slate-700">{pegawai.eligibleDate}</p>
                                      {pegawai.sisaHari < 0
                                        ? <p className="text-xs text-red-600 font-medium">Sudah melewati {Math.abs(pegawai.sisaHari)} hari</p>
                                        : <p className="text-xs text-amber-600 font-medium">Dalam {pegawai.sisaHari} hari</p>
                                      }
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className="text-sm text-slate-600 font-mono">{formatCurrency(pegawai.gajiPokokSaatIni)}</span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex flex-col items-end">
                                    <span className="text-sm font-semibold text-emerald-600 font-mono">{formatCurrency(pegawai.gajiPokokBaru)}</span>
                                    <span className="text-xs text-emerald-600/80 bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                                      +{pegawai.persentase}% 
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Button 
                                    size="sm" 
                                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                                    onClick={() => handleAjukanClick(pegawai)}
                                    // Hanya Admin/HRD yang bisa initiate ini
                                    disabled={!isHRD}
                                  >
                                    <Send className="w-4 h-4 mr-1.5" />
                                    Ajukan
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

                {/* TAB 2: RIWAYAT / PROSES */}
                <TabsContent value="riwayat" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                  <Card className="border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-slate-50/80">
                          <TableRow>
                            <TableHead className="w-[250px]">Pegawai</TableHead>
                            <TableHead>Pengajuan</TableHead>
                            <TableHead>TMT Baru</TableHead>
                            <TableHead className="text-right">Gaji Baru</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="w-[80px] text-center"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isLoading ? (
                            <TableRow>
                              <TableCell colSpan={6} className="h-32 text-center text-slate-500">Memuat data...</TableCell>
                            </TableRow>
                          ) : filteredRiwayat.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="h-32 text-center text-slate-500">Belum ada riwayat pengajuan KGB.</TableCell>
                            </TableRow>
                          ) : (
                            filteredRiwayat.map((riwayat) => (
                              <TableRow key={riwayat.id} className="hover:bg-slate-50/50">
                                <TableCell>
                                  <p className="font-medium text-slate-900">{riwayat.nama}</p>
                                  <p className="text-xs text-slate-500 font-mono">{riwayat.nik}</p>
                                </TableCell>
                                <TableCell>
                                  <p className="text-sm text-slate-700">{riwayat.tanggalPengajuan}</p>
                                </TableCell>
                                <TableCell>
                                  <p className="text-sm font-medium text-slate-700">{riwayat.tmtBaru}</p>
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className="text-sm font-semibold text-emerald-600 font-mono">{formatCurrency(riwayat.gajiBaru)}</span>
                                </TableCell>
                                <TableCell className="text-center">
                                  {getStatusBadge(riwayat.status)}
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
                                        setSelectedPegawai(riwayat)
                                        setShowDetailDialog(true)
                                      }}>
                                        <Eye className="w-4 h-4 mr-2" /> Detail Pengajuan
                                      </DropdownMenuItem>
                                      {riwayat.status === "APPROVED" && (
                                        <DropdownMenuItem>
                                          <Printer className="w-4 h-4 mr-2" /> Cetak SK KGB
                                        </DropdownMenuItem>
                                      )}
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

      {/* DIALOG: AJUKAN KGB */}
      <Dialog open={showAjukanDialog} onOpenChange={setShowAjukanDialog}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white">
          <div className="bg-primary/5 px-6 py-4 border-b border-primary/10">
            <DialogTitle className="text-xl flex items-center gap-2 text-primary">
              <TrendingUp className="w-5 h-5" />
              Pengajuan Kenaikan Gaji Berkala
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-slate-600">
              Verifikasi data KGB untuk <span className="font-semibold text-slate-900">{selectedPegawai?.nama}</span>
            </DialogDescription>
          </div>
          
          <div className="px-6 py-6 space-y-6">
            {/* Old vs New Comparison Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Data Lama</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-slate-500">Masa Kerja (MKG)</p>
                    <p className="text-sm font-medium text-slate-900">{selectedPegawai?.mkg} Tahun</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Gaji Pokok</p>
                    <p className="text-sm font-semibold text-slate-900 font-mono tracking-tight">{formatCurrency(selectedPegawai?.gajiPokokSaatIni || 0)}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-100 rounded-full opacity-50"></div>
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-3 relative z-10">Data Baru</p>
                <div className="space-y-2 relative z-10">
                  <div>
                    <p className="text-xs text-emerald-600/80">Masa Kerja (MKG)</p>
                    <p className="text-sm font-medium text-emerald-900">{selectedPegawai?.mkgBaru} Tahun</p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-600/80">Gaji Pokok Baru (+{selectedPegawai?.persentase}%)</p>
                    <p className="text-base font-bold text-emerald-700 font-mono tracking-tight">{formatCurrency(selectedPegawai?.gajiPokokBaru || 0)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tmt-date" className="text-sm font-medium text-slate-700">Tanggal Berlaku KGB Baru</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    id="tmt-date"
                    type="date"
                    className="pl-9 border-slate-200"
                    value={ajukanForm.tanggalBerlaku}
                    onChange={(e) => setAjukanForm({...ajukanForm, tanggalBerlaku: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="no-surat" className="text-sm font-medium text-slate-700">Nomor Pengantar (Opsional)</Label>
                <Input 
                  id="no-surat"
                  className="border-slate-200 font-mono text-sm"
                  value={ajukanForm.nomorSurat}
                  onChange={(e) => setAjukanForm({...ajukanForm, nomorSurat: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="catatan" className="text-sm font-medium text-slate-700">Catatan Pengembangan (Opsional)</Label>
              <Textarea 
                id="catatan"
                placeholder="Tambahkan catatan khusus terkait kinerja atau rekomendasi..."
                className="min-h-[80px] border-slate-200 resize-none"
                value={ajukanForm.catatan}
                onChange={(e) => setAjukanForm({...ajukanForm, catatan: e.target.value})}
              />
            </div>
          </div>
          
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAjukanDialog(false)} className="bg-white">
              Batal
            </Button>
            <Button onClick={submitKGB} disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
              {isSubmitting ? "Memproses..." : "Ajukan & Simpan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG: DETAIL / APPROVAL */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[550px] bg-white">
          <DialogHeader>
            <DialogTitle>Detail Pengajuan KGB</DialogTitle>
            <DialogDescription>
              Tinjau informasi Kenaikan Gaji Berkala untuk pengambilan keputusan.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPegawai && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h4 className="font-semibold text-lg">{selectedPegawai.nama}</h4>
                  <p className="text-sm text-muted-foreground">{selectedPegawai.nik} • {selectedPegawai.unit}</p>
                </div>
                {getStatusBadge(selectedPegawai.status)}
              </div>
              
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Tanggal Mulai Berlaku</p>
                  <p className="font-medium">{selectedPegawai.tmtBaru}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tanggal Pengajuan</p>
                  <p className="font-medium">{selectedPegawai.tanggalPengajuan}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    Gaji Pokok Lama
                  </p>
                  <p className="font-mono">{formatCurrency(selectedPegawai.gajiLama)}</p>
                </div>
                <div>
                  <p className="text-xs text-emerald-600 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Gaji Pokok Baru
                  </p>
                  <p className="font-mono font-bold text-emerald-700">{formatCurrency(selectedPegawai.gajiBaru)}</p>
                </div>
              </div>

              {selectedPegawai.keterangan && (
                <div className="bg-blue-50/50 p-3 rounded border border-blue-100">
                  <p className="text-xs font-semibold text-blue-800 mb-1">Catatan Pengajuan:</p>
                  <p className="text-sm text-slate-700">{selectedPegawai.keterangan}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Tutup
            </Button>
            {selectedPegawai?.status === "PENDING" && isHRD && (
              <>
                <Button variant="destructive" onClick={() => handleStatusUpdate(selectedPegawai.id, false)}>
                  Tolak KGB
                </Button>
                <Button onClick={() => handleStatusUpdate(selectedPegawai.id, true)} className="bg-emerald-600 hover:bg-emerald-700">
                  Setujui KGB
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
