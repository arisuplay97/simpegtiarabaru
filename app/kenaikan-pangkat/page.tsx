"use client"

import { useState } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  Star,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  User,
  Building2,
  TrendingUp,
  Send,
  Eye,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

// Daftar pangkat berurutan
const daftarPangkat = [
  { id: 1, nama: "Juru Muda", golongan: "A/I" },
  { id: 2, nama: "Juru Muda Tingkat I", golongan: "B/I" },
  { id: 3, nama: "Juru", golongan: "C/I" },
  { id: 4, nama: "Juru Tingkat I", golongan: "D/I" },
  { id: 5, nama: "Pengatur Muda", golongan: "A/II" },
  { id: 6, nama: "Pengatur Muda Tingkat I", golongan: "B/II" },
  { id: 7, nama: "Pengatur", golongan: "C/II" },
  { id: 8, nama: "Pengatur Tingkat I", golongan: "D/II" },
  { id: 9, nama: "Penata Muda", golongan: "A/III" },
  { id: 10, nama: "Penata Muda Tingkat I", golongan: "B/III" },
  { id: 11, nama: "Penata", golongan: "C/III" },
  { id: 12, nama: "Penata Tingkat I", golongan: "D/III" },
  { id: 13, nama: "Pembina", golongan: "A/IV" },
  { id: 14, nama: "Pembina Tingkat I", golongan: "B/IV" },
  { id: 15, nama: "Pembina Utama Muda", golongan: "C/IV" },
  { id: 16, nama: "Pembina Utama Madya", golongan: "D/IV" },
  { id: 17, nama: "Pembina Utama", golongan: "E/IV" },
]

// Data pangkat default list for reference if needed
// (Moved to lib/actions/pangkat.ts)

import { getEligibleKenaikanPangkat, getPengajuanKenaikanPangkat } from "@/lib/actions/pangkat"
import { useEffect } from "react"

const getStatusBadge = (status: string) => {
  switch (status) {
    case "eligible":
      return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Eligible</Badge>
    case "diajukan":
      return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Diajukan</Badge>
    case "menunggu_direksi":
      return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Menunggu Direksi</Badge>
    case "disetujui":
      return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Disetujui</Badge>
    case "ditolak":
      return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Ditolak</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function KenaikanPangkatPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showPengajuanDialog, setShowPengajuanDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  
  const [eligiblePangkat, setEligiblePangkat] = useState<any[]>([])
  const [pengajuanPangkat, setPengajuanPangkat] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [selectedPegawai, setSelectedPegawai] = useState<any | null>(null)
  const [selectedPengajuan, setSelectedPengajuan] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState("eligible")

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [eligibleData, pengajuanData] = await Promise.all([
          getEligibleKenaikanPangkat(),
          getPengajuanKenaikanPangkat()
        ])
        setEligiblePangkat(eligibleData)
        setPengajuanPangkat(pengajuanData)
      } catch (error: any) {
        console.error("Gagal memuat data", error)
        toast.error(`Gagal memuat data kenaikan pangkat: ${error.message}`)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredEligible = eligiblePangkat.filter(
    (p) =>
      p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nik.includes(searchTerm)
  )

  const filteredPengajuan = pengajuanPangkat.filter(
    (p) =>
      p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nik.includes(searchTerm)
  )

  const handleAjukan = (pegawai: typeof eligiblePangkat[0]) => {
    setSelectedPegawai(pegawai)
    setShowPengajuanDialog(true)
  }

  const handleLihatDetail = (pengajuan: typeof pengajuanPangkat[0]) => {
    setSelectedPengajuan(pengajuan)
    setShowDetailDialog(true)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex-1 sidebar-offset">
        <TopBar breadcrumb={["Kinerja & Karier", "Kenaikan Pangkat"]} />
        <main className="p-6">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Kenaikan Pangkat</h1>
              <p className="text-sm text-muted-foreground">
                Kelola kenaikan pangkat pegawai (periode 4 tahun sekali)
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">12</p>
                    <p className="text-xs text-muted-foreground">Eligible Tahun Ini</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">5</p>
                    <p className="text-xs text-muted-foreground">Proses Pengajuan</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">3</p>
                    <p className="text-xs text-muted-foreground">Menunggu Approval</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                    <Star className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">28</p>
                    <p className="text-xs text-muted-foreground">Disetujui YTD</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info Card */}
          <Card className="mb-6 border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20">
            <CardContent className="flex items-start gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                <Star className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">Ketentuan Kenaikan Pangkat</h3>
                <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                  Kenaikan pangkat dilakukan setiap <strong>4 tahun sekali</strong> sejak TMT pangkat terakhir.
                  Syarat: Nilai kinerja minimal &quot;Baik&quot;, tidak dalam masa hukuman disiplin, dan telah memenuhi
                  persyaratan pendidikan untuk golongan yang dituju.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Search & Filter */}
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari NIK atau nama pegawai..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Unit Kerja" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Unit</SelectItem>
                  <SelectItem value="produksi">Bagian Produksi</SelectItem>
                  <SelectItem value="distribusi">Bagian Distribusi</SelectItem>
                  <SelectItem value="keuangan">Bagian Keuangan</SelectItem>
                  <SelectItem value="sdm">Bagian SDM</SelectItem>
                  <SelectItem value="pelayanan">Bagian Pelayanan</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="eligible" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Eligible ({filteredEligible.length})
              </TabsTrigger>
              <TabsTrigger value="pengajuan" className="gap-2">
                <FileText className="h-4 w-4" />
                Pengajuan ({filteredPengajuan.length})
              </TabsTrigger>
              <TabsTrigger value="riwayat" className="gap-2">
                <Clock className="h-4 w-4" />
                Riwayat
              </TabsTrigger>
            </TabsList>

            {/* Tab: Eligible */}
            <TabsContent value="eligible">
              <Card>
                <CardHeader>
                  <CardTitle>Pegawai Eligible Kenaikan Pangkat</CardTitle>
                  <CardDescription>
                    Daftar pegawai yang sudah memenuhi masa kerja 4 tahun dalam pangkat saat ini
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pegawai</TableHead>
                        <TableHead>Pangkat Saat Ini</TableHead>
                        <TableHead>Pangkat Baru</TableHead>
                        <TableHead>TMT Pangkat</TableHead>
                        <TableHead>Eligible Date</TableHead>
                        <TableHead>Nilai Kinerja</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEligible.map((pegawai) => (
                        <TableRow key={pegawai.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={pegawai?.avatar || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {pegawai.nama.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{pegawai.nama}</p>
                                <p className="text-xs text-muted-foreground">{pegawai.nik}</p>
                                <p className="text-xs text-muted-foreground">{pegawai.jabatan}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{pegawai.pangkatSaatIni}</p>
                              <p className="text-xs text-muted-foreground">Gol. {pegawai.golonganSaatIni}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-emerald-500" />
                              <div>
                                <p className="font-medium text-emerald-600">{pegawai.pangkatBaru}</p>
                                <p className="text-xs text-muted-foreground">Gol. {pegawai.golonganBaru}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{new Date(pegawai.tmtPangkat).toLocaleDateString("id-ID")}</p>
                            <p className="text-xs text-muted-foreground">{pegawai.masaKerja}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{new Date(pegawai.eligibleDate).toLocaleDateString("id-ID")}</p>
                            {pegawai.sisaHari > 0 ? (
                              <p className="text-xs text-amber-600">{pegawai.sisaHari} hari lagi</p>
                            ) : (
                              <p className="text-xs text-emerald-600">Sudah eligible</p>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-16 overflow-hidden rounded-full bg-secondary">
                                <div
                                  className="h-full bg-emerald-500"
                                  style={{ width: `${pegawai.nilaiKinerja}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{pegawai.nilaiKinerja}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(pegawai.status)}</TableCell>
                          <TableCell className="text-right">
                            {pegawai.status === "eligible" && pegawai.sisaHari === 0 ? (
                              <Button size="sm" onClick={() => handleAjukan(pegawai)}>
                                <Send className="mr-2 h-4 w-4" />
                                Ajukan
                              </Button>
                            ) : pegawai.status === "diajukan" ? (
                              <Badge variant="secondary">Sudah Diajukan</Badge>
                            ) : (
                              <Button size="sm" variant="outline" disabled>
                                Belum Eligible
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Pengajuan */}
            <TabsContent value="pengajuan">
              <Card>
                <CardHeader>
                  <CardTitle>Daftar Pengajuan Kenaikan Pangkat</CardTitle>
                  <CardDescription>
                    Status pengajuan kenaikan pangkat yang sedang diproses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pegawai</TableHead>
                        <TableHead>Pangkat Lama</TableHead>
                        <TableHead>Pangkat Baru</TableHead>
                        <TableHead>Tanggal Pengajuan</TableHead>
                        <TableHead>TMT Usulan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPengajuan.map((pengajuan) => (
                        <TableRow key={pengajuan.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={pengajuan.avatar || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {pengajuan.nama.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{pengajuan.nama}</p>
                                <p className="text-xs text-muted-foreground">{pengajuan.nik}</p>
                                <p className="text-xs text-muted-foreground">{pengajuan.jabatan}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{pengajuan.pangkatLama}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-medium text-emerald-600">{pengajuan.pangkatBaru}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{new Date(pengajuan.tanggalPengajuan).toLocaleDateString("id-ID")}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{new Date(pengajuan.tmtUsulan).toLocaleDateString("id-ID")}</p>
                          </TableCell>
                          <TableCell>{getStatusBadge(pengajuan.status)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleLihatDetail(pengajuan)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Lihat Detail
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <FileText className="mr-2 h-4 w-4" />
                                  Cetak SK
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Riwayat */}
            <TabsContent value="riwayat">
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">Riwayat Kenaikan Pangkat</h3>
                  <p className="text-sm text-muted-foreground">
                    Arsip seluruh kenaikan pangkat yang telah disetujui
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Dialog Pengajuan */}
      <Dialog open={showPengajuanDialog} onOpenChange={setShowPengajuanDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajukan Kenaikan Pangkat</DialogTitle>
            <DialogDescription>
              Pastikan semua dokumen persyaratan sudah lengkap sebelum mengajukan
            </DialogDescription>
          </DialogHeader>
          {selectedPegawai && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-lg bg-secondary/50 p-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {selectedPegawai.nama.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selectedPegawai.nama}</p>
                  <p className="text-sm text-muted-foreground">{selectedPegawai.nik}</p>
                  <p className="text-sm text-muted-foreground">{selectedPegawai.jabatan}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pangkat Saat Ini</Label>
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="font-medium">{selectedPegawai.pangkatSaatIni}</p>
                    <p className="text-sm text-muted-foreground">Gol. {selectedPegawai.golonganSaatIni}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Pangkat Baru (Usulan)</Label>
                  <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20">
                    <p className="font-medium text-emerald-700 dark:text-emerald-400">{selectedPegawai.pangkatBaru}</p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-500">Gol. {selectedPegawai.golonganBaru}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>TMT Kenaikan Pangkat</Label>
                <Input type="date" defaultValue={selectedPegawai.eligibleDate} />
              </div>

              <div className="space-y-2">
                <Label>Dokumen Persyaratan</Label>
                <div className="space-y-2">
                  {["SK Pangkat Terakhir", "Penilaian Kinerja 2 Tahun Terakhir", "Ijazah Terakhir", "DP3/SKP"].map((doc) => (
                    <div key={doc} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{doc}</span>
                      </div>
                      <Button variant="outline" size="sm">Upload</Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Catatan Tambahan</Label>
                <Textarea placeholder="Masukkan catatan tambahan jika diperlukan..." />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPengajuanDialog(false)}>
              Batal
            </Button>
            <Button onClick={() => setShowPengajuanDialog(false)}>
              <Send className="mr-2 h-4 w-4" />
              Ajukan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Detail Pengajuan */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Pengajuan Kenaikan Pangkat</DialogTitle>
            <DialogDescription>
              Informasi lengkap dan status approval pengajuan
            </DialogDescription>
          </DialogHeader>
          {selectedPengajuan && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 rounded-lg bg-secondary/50 p-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {selectedPengajuan.nama.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-lg font-semibold">{selectedPengajuan.nama}</p>
                  <p className="text-sm text-muted-foreground">{selectedPengajuan.nik}</p>
                  <p className="text-sm text-muted-foreground">{selectedPengajuan.jabatan} - {selectedPengajuan.unit}</p>
                </div>
                {getStatusBadge(selectedPengajuan.status)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Pangkat Lama</p>
                  <p className="font-medium">{selectedPengajuan.pangkatLama}</p>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
                  <p className="text-sm text-emerald-600">Pangkat Baru</p>
                  <p className="font-medium text-emerald-700 dark:text-emerald-400">{selectedPengajuan.pangkatBaru}</p>
                </div>
              </div>

              <div>
                <h4 className="mb-3 font-semibold">Alur Persetujuan</h4>
                <div className="space-y-3">
                  {selectedPengajuan.approvals.map((approval, index) => (
                    <div key={index} className="flex items-center gap-4 rounded-lg border p-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        approval.status === "approved" ? "bg-emerald-100 text-emerald-600" :
                        approval.status === "rejected" ? "bg-red-100 text-red-600" :
                        "bg-secondary text-muted-foreground"
                      }`}>
                        {approval.status === "approved" ? <CheckCircle2 className="h-5 w-5" /> :
                         approval.status === "rejected" ? <XCircle className="h-5 w-5" /> :
                         <Clock className="h-5 w-5" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{approval.level}</p>
                        <p className="text-sm text-muted-foreground">{approval.nama}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          approval.status === "approved" ? "default" :
                          approval.status === "rejected" ? "destructive" :
                          "secondary"
                        }>
                          {approval.status === "approved" ? "Disetujui" :
                           approval.status === "rejected" ? "Ditolak" :
                           "Menunggu"}
                        </Badge>
                        {approval.tanggal && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {new Date(approval.tanggal).toLocaleDateString("id-ID")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-secondary/50 p-4">
                <p className="text-sm font-medium">Catatan</p>
                <p className="mt-1 text-sm text-muted-foreground">{selectedPengajuan.catatan}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Tutup
            </Button>
            {selectedPengajuan?.status === "disetujui" && (
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                Cetak SK Pangkat
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
