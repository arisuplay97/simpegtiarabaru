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
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Data pegawai yang eligible untuk KGB (2 tahun sekali)
const eligibleKGB = [
  {
    id: 1,
    nik: "19850315 200801 1 001",
    nama: "Ahmad Fadillah",
    jabatan: "Kepala Seksi Produksi",
    unit: "Bagian Produksi",
    golongan: "B/III",
    gajiPokokSaatIni: 3542400,
    gajiPokokBaru: 3688900,
    kenaikan: 146500,
    persentase: 4.1,
    mkg: 16,
    mkgBaru: 17,
    tmtGajiTerakhir: "2024-04-01",
    eligibleDate: "2026-04-01",
    sisaHari: 15,
    status: "eligible",
    nilaiKinerja: 88,
    avatar: null,
  },
  {
    id: 2,
    nik: "19880722 201001 2 003",
    nama: "Siti Rahmawati",
    jabatan: "Analis Keuangan",
    unit: "Bagian Keuangan",
    golongan: "C/III",
    gajiPokokSaatIni: 3809000,
    gajiPokokBaru: 3969100,
    kenaikan: 160100,
    persentase: 4.2,
    mkg: 14,
    mkgBaru: 15,
    tmtGajiTerakhir: "2024-03-01",
    eligibleDate: "2026-03-01",
    sisaHari: 0,
    status: "eligible",
    nilaiKinerja: 92,
    avatar: null,
  },
  {
    id: 3,
    nik: "19900610 201201 1 005",
    nama: "Budi Santoso",
    jabatan: "Teknisi Jaringan",
    unit: "Bagian Distribusi",
    golongan: "D/II",
    gajiPokokSaatIni: 2903600,
    gajiPokokBaru: 3025500,
    kenaikan: 121900,
    persentase: 4.2,
    mkg: 12,
    mkgBaru: 13,
    tmtGajiTerakhir: "2024-04-01",
    eligibleDate: "2026-04-01",
    sisaHari: 15,
    status: "eligible",
    nilaiKinerja: 85,
    avatar: null,
  },
  {
    id: 4,
    nik: "19870505 200901 1 002",
    nama: "Rudi Hermawan",
    jabatan: "Kepala Bagian SDM",
    unit: "Bagian SDM",
    golongan: "D/III",
    gajiPokokSaatIni: 4089200,
    gajiPokokBaru: 4260300,
    kenaikan: 171100,
    persentase: 4.2,
    mkg: 15,
    mkgBaru: 16,
    tmtGajiTerakhir: "2024-01-01",
    eligibleDate: "2026-01-01",
    sisaHari: 0,
    status: "diajukan",
    nilaiKinerja: 90,
    avatar: null,
  },
  {
    id: 5,
    nik: "19920815 201501 2 007",
    nama: "Dewi Anggraini",
    jabatan: "Staff Pelayanan",
    unit: "Bagian Pelayanan",
    golongan: "C/II",
    gajiPokokSaatIni: 2678800,
    gajiPokokBaru: 2791200,
    kenaikan: 112400,
    persentase: 4.2,
    mkg: 9,
    mkgBaru: 10,
    tmtGajiTerakhir: "2024-06-01",
    eligibleDate: "2026-06-01",
    sisaHari: 76,
    status: "eligible",
    nilaiKinerja: 87,
    avatar: null,
  },
  {
    id: 6,
    nik: "19780120 200301 1 001",
    nama: "Ir. Bambang Sutrisno",
    jabatan: "Kepala Bagian Teknik",
    unit: "Bagian Teknik",
    golongan: "A/IV",
    gajiPokokSaatIni: 4496000,
    gajiPokokBaru: 4684500,
    kenaikan: 188500,
    persentase: 4.2,
    mkg: 21,
    mkgBaru: 22,
    tmtGajiTerakhir: "2024-02-01",
    eligibleDate: "2026-02-01",
    sisaHari: 0,
    status: "eligible",
    nilaiKinerja: 91,
    avatar: null,
  },
]

// Data pengajuan KGB
const pengajuanKGB = [
  {
    id: 1,
    nik: "19870505 200901 1 002",
    nama: "Rudi Hermawan",
    jabatan: "Kepala Bagian SDM",
    unit: "Bagian SDM",
    golongan: "D/III",
    gajiLama: 4089200,
    gajiBaru: 4260300,
    kenaikan: 171100,
    mkgLama: 15,
    mkgBaru: 16,
    tanggalPengajuan: "2026-02-15",
    tmtUsulan: "2026-04-01",
    status: "menunggu_direksi",
    approvals: [
      { level: "Verifikasi SDM", nama: "Dra. Hartini", status: "approved", tanggal: "2026-02-17", catatan: "Data sesuai" },
      { level: "Kepala Bagian Keuangan", nama: "Ir. Suwarno", status: "approved", tanggal: "2026-02-20", catatan: "Anggaran tersedia" },
      { level: "Direktur Umum", nama: "Dr. Sugiarto", status: "pending", tanggal: null, catatan: null },
      { level: "Direktur Utama", nama: "Ir. H. Ahmad Yani", status: "pending", tanggal: null, catatan: null },
    ],
    dokumen: ["SK Gaji Berkala Terakhir", "Penilaian Kinerja", "Slip Gaji Terakhir"],
    catatan: "Telah memenuhi syarat masa kerja 2 tahun sejak KGB terakhir",
    avatar: null,
  },
  {
    id: 2,
    nik: "19830420 200601 1 004",
    nama: "Eko Prasetyo",
    jabatan: "Kepala Seksi Distribusi",
    unit: "Bagian Distribusi",
    golongan: "C/III",
    gajiLama: 3809000,
    gajiBaru: 3969100,
    kenaikan: 160100,
    mkgLama: 18,
    mkgBaru: 19,
    tanggalPengajuan: "2026-01-20",
    tmtUsulan: "2026-03-01",
    status: "disetujui",
    approvals: [
      { level: "Verifikasi SDM", nama: "Dra. Hartini", status: "approved", tanggal: "2026-01-22", catatan: "Data lengkap dan valid" },
      { level: "Kepala Bagian Keuangan", nama: "Ir. Suwarno", status: "approved", tanggal: "2026-01-25", catatan: "OK" },
      { level: "Direktur Umum", nama: "Dr. Sugiarto", status: "approved", tanggal: "2026-01-28", catatan: "Disetujui" },
      { level: "Direktur Utama", nama: "Ir. H. Ahmad Yani", status: "approved", tanggal: "2026-02-01", catatan: "Acc" },
    ],
    dokumen: ["SK Gaji Berkala Terakhir", "Penilaian Kinerja", "Slip Gaji Terakhir"],
    catatan: "Disetujui sesuai ketentuan yang berlaku",
    avatar: null,
  },
  {
    id: 3,
    nik: "19910312 201301 2 006",
    nama: "Fitri Handayani",
    jabatan: "Staff Keuangan",
    unit: "Bagian Keuangan",
    golongan: "D/II",
    gajiLama: 2903600,
    gajiBaru: 3025500,
    kenaikan: 121900,
    mkgLama: 11,
    mkgBaru: 12,
    tanggalPengajuan: "2026-02-01",
    tmtUsulan: "2026-04-01",
    status: "ditolak",
    approvals: [
      { level: "Verifikasi SDM", nama: "Dra. Hartini", status: "rejected", tanggal: "2026-02-05", catatan: "Masih ada hukuman disiplin yang belum selesai" },
    ],
    dokumen: ["SK Gaji Berkala Terakhir", "Penilaian Kinerja"],
    catatan: "Ditolak: Dalam masa hukuman disiplin tingkat ringan s/d Juni 2026",
    avatar: null,
  },
]

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

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

export default function KGBPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showPengajuanDialog, setShowPengajuanDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedPegawai, setSelectedPegawai] = useState<typeof eligibleKGB[0] | null>(null)
  const [selectedPengajuan, setSelectedPengajuan] = useState<typeof pengajuanKGB[0] | null>(null)
  const [activeTab, setActiveTab] = useState("eligible")

  const filteredEligible = eligibleKGB.filter(
    (p) =>
      p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nik.includes(searchTerm)
  )

  const filteredPengajuan = pengajuanKGB.filter(
    (p) =>
      p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nik.includes(searchTerm)
  )

  const handleAjukan = (pegawai: typeof eligibleKGB[0]) => {
    setSelectedPegawai(pegawai)
    setShowPengajuanDialog(true)
  }

  const handleLihatDetail = (pengajuan: typeof pengajuanKGB[0]) => {
    setSelectedPengajuan(pengajuan)
    setShowDetailDialog(true)
  }

  // Hitung total kenaikan gaji
  const totalKenaikan = eligibleKGB.filter(p => p.sisaHari === 0).reduce((acc, p) => acc + p.kenaikan, 0)
  const totalPegawaiEligible = eligibleKGB.filter(p => p.sisaHari === 0).length

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex-1 pl-64">
        <TopBar breadcrumb={["Remunerasi", "Kenaikan Gaji Berkala"]} />
        <main className="p-6">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Kenaikan Gaji Berkala (KGB)</h1>
              <p className="text-sm text-muted-foreground">
                Kelola kenaikan gaji berkala pegawai (periode 2 tahun sekali)
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
                    <p className="text-2xl font-bold">{totalPegawaiEligible}</p>
                    <p className="text-xs text-muted-foreground">Eligible Saat Ini</p>
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
                    <p className="text-2xl font-bold">8</p>
                    <p className="text-xs text-muted-foreground">Proses Pengajuan</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                    <Wallet className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{formatCurrency(totalKenaikan)}</p>
                    <p className="text-xs text-muted-foreground">Est. Total Kenaikan/bln</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                    <ArrowUpCircle className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">156</p>
                    <p className="text-xs text-muted-foreground">Disetujui YTD</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info Card */}
          <Card className="mb-6 border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/20">
            <CardContent className="flex items-start gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">Ketentuan Kenaikan Gaji Berkala</h3>
                <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
                  Kenaikan Gaji Berkala (KGB) diberikan setiap <strong>2 tahun sekali</strong> sejak TMT gaji terakhir.
                  Syarat: Nilai kinerja minimal &quot;Cukup&quot;, tidak dalam masa hukuman disiplin, dan telah
                  mencapai MKG (Masa Kerja Golongan) yang dipersyaratkan. KGB memerlukan persetujuan sampai level Direktur Utama.
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
                  <SelectItem value="teknik">Bagian Teknik</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Golongan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Golongan</SelectItem>
                  <SelectItem value="II">Golongan II</SelectItem>
                  <SelectItem value="III">Golongan III</SelectItem>
                  <SelectItem value="IV">Golongan IV</SelectItem>
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
              <TabsTrigger value="simulasi" className="gap-2">
                <Calculator className="h-4 w-4" />
                Simulasi
              </TabsTrigger>
            </TabsList>

            {/* Tab: Eligible */}
            <TabsContent value="eligible">
              <Card>
                <CardHeader>
                  <CardTitle>Pegawai Eligible KGB</CardTitle>
                  <CardDescription>
                    Daftar pegawai yang sudah memenuhi masa kerja 2 tahun untuk kenaikan gaji berkala
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pegawai</TableHead>
                        <TableHead>Golongan</TableHead>
                        <TableHead>Gaji Pokok Saat Ini</TableHead>
                        <TableHead>Gaji Pokok Baru</TableHead>
                        <TableHead>Kenaikan</TableHead>
                        <TableHead>MKG</TableHead>
                        <TableHead>Eligible Date</TableHead>
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
                                <AvatarImage src={pegawai.avatar || undefined} />
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
                            <Badge variant="outline">{pegawai.golongan}</Badge>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{formatCurrency(pegawai.gajiPokokSaatIni)}</p>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium text-emerald-600">{formatCurrency(pegawai.gajiPokokBaru)}</p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4 text-emerald-500" />
                              <div>
                                <p className="font-medium text-emerald-600">+{formatCurrency(pegawai.kenaikan)}</p>
                                <p className="text-xs text-muted-foreground">+{pegawai.persentase}%</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span className="text-sm">{pegawai.mkg}</span>
                              <ArrowUpCircle className="h-3 w-3 text-emerald-500" />
                              <span className="text-sm font-medium text-emerald-600">{pegawai.mkgBaru}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{new Date(pegawai.eligibleDate).toLocaleDateString("id-ID")}</p>
                            {pegawai.sisaHari > 0 ? (
                              <p className="text-xs text-amber-600">{pegawai.sisaHari} hari lagi</p>
                            ) : (
                              <p className="text-xs text-emerald-600">Sudah eligible</p>
                            )}
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
                  <CardTitle>Daftar Pengajuan KGB</CardTitle>
                  <CardDescription>
                    Status pengajuan kenaikan gaji berkala yang sedang diproses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pegawai</TableHead>
                        <TableHead>Gaji Lama</TableHead>
                        <TableHead>Gaji Baru</TableHead>
                        <TableHead>Kenaikan</TableHead>
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
                            <p className="text-sm">{formatCurrency(pengajuan.gajiLama)}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-medium text-emerald-600">{formatCurrency(pengajuan.gajiBaru)}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-medium text-emerald-600">+{formatCurrency(pengajuan.kenaikan)}</p>
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
                                  Cetak SK KGB
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
                  <h3 className="text-lg font-semibold">Riwayat Kenaikan Gaji Berkala</h3>
                  <p className="text-sm text-muted-foreground">
                    Arsip seluruh KGB yang telah disetujui
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Simulasi */}
            <TabsContent value="simulasi">
              <Card>
                <CardHeader>
                  <CardTitle>Simulasi Kenaikan Gaji Berkala</CardTitle>
                  <CardDescription>
                    Hitung estimasi kenaikan gaji berdasarkan golongan dan masa kerja
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Golongan/Ruang</Label>
                        <Select defaultValue="B/III">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A/II">A/II - Pengatur Muda</SelectItem>
                            <SelectItem value="B/II">B/II - Pengatur Muda Tingkat I</SelectItem>
                            <SelectItem value="C/II">C/II - Pengatur</SelectItem>
                            <SelectItem value="D/II">D/II - Pengatur Tingkat I</SelectItem>
                            <SelectItem value="A/III">A/III - Penata Muda</SelectItem>
                            <SelectItem value="B/III">B/III - Penata Muda Tingkat I</SelectItem>
                            <SelectItem value="C/III">C/III - Penata</SelectItem>
                            <SelectItem value="D/III">D/III - Penata Tingkat I</SelectItem>
                            <SelectItem value="A/IV">A/IV - Pembina</SelectItem>
                            <SelectItem value="B/IV">B/IV - Pembina Tingkat I</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Masa Kerja Golongan (MKG) Saat Ini</Label>
                        <Input type="number" defaultValue="10" min="0" max="35" />
                      </div>
                      <div className="space-y-2">
                        <Label>Gaji Pokok Saat Ini</Label>
                        <Input type="text" defaultValue="Rp 3.542.400" readOnly className="bg-secondary" />
                      </div>
                      <Button className="w-full">
                        <Calculator className="mr-2 h-4 w-4" />
                        Hitung Simulasi
                      </Button>
                    </div>
                    <div className="rounded-lg border bg-secondary/30 p-6">
                      <h4 className="mb-4 font-semibold">Hasil Simulasi</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Gaji Pokok Saat Ini</span>
                          <span className="font-medium">Rp 3.542.400</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">MKG Saat Ini</span>
                          <span className="font-medium">10 tahun</span>
                        </div>
                        <div className="my-4 border-t" />
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Gaji Pokok Baru</span>
                          <span className="font-semibold text-emerald-600">Rp 3.688.900</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">MKG Baru</span>
                          <span className="font-medium">11 tahun</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Kenaikan</span>
                          <span className="font-semibold text-emerald-600">+Rp 146.500 (4.1%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Dialog Pengajuan KGB */}
      <Dialog open={showPengajuanDialog} onOpenChange={setShowPengajuanDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajukan Kenaikan Gaji Berkala</DialogTitle>
            <DialogDescription>
              Pastikan semua persyaratan sudah terpenuhi sebelum mengajukan
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
                  <p className="text-sm text-muted-foreground">{selectedPegawai.jabatan} - {selectedPegawai.unit}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gaji Pokok Saat Ini</Label>
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="font-medium">{formatCurrency(selectedPegawai.gajiPokokSaatIni)}</p>
                    <p className="text-sm text-muted-foreground">MKG: {selectedPegawai.mkg} tahun</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Gaji Pokok Baru</Label>
                  <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20">
                    <p className="font-medium text-emerald-700 dark:text-emerald-400">{formatCurrency(selectedPegawai.gajiPokokBaru)}</p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-500">MKG: {selectedPegawai.mkgBaru} tahun</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-emerald-700 dark:text-emerald-300">Total Kenaikan</span>
                  <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                    +{formatCurrency(selectedPegawai.kenaikan)} ({selectedPegawai.persentase}%)
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>TMT Kenaikan Gaji Berkala</Label>
                <Input type="date" defaultValue={selectedPegawai.eligibleDate} />
              </div>

              <div className="space-y-2">
                <Label>Dokumen Persyaratan</Label>
                <div className="space-y-2">
                  {["SK Gaji Berkala Terakhir", "Penilaian Kinerja 2 Tahun Terakhir", "Slip Gaji Terakhir"].map((doc) => (
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
              Ajukan KGB
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Detail Pengajuan */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Pengajuan KGB</DialogTitle>
            <DialogDescription>
              Informasi lengkap dan status approval pengajuan kenaikan gaji berkala
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

              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Gaji Lama</p>
                  <p className="font-medium">{formatCurrency(selectedPengajuan.gajiLama)}</p>
                  <p className="text-xs text-muted-foreground">MKG: {selectedPengajuan.mkgLama}</p>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
                  <p className="text-sm text-emerald-600">Gaji Baru</p>
                  <p className="font-medium text-emerald-700 dark:text-emerald-400">{formatCurrency(selectedPengajuan.gajiBaru)}</p>
                  <p className="text-xs text-emerald-600">MKG: {selectedPengajuan.mkgBaru}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Kenaikan</p>
                  <p className="font-medium text-emerald-600">+{formatCurrency(selectedPengajuan.kenaikan)}</p>
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
                        {approval.catatan && (
                          <p className="mt-1 text-xs text-muted-foreground italic">&quot;{approval.catatan}&quot;</p>
                        )}
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
                Cetak SK KGB
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
