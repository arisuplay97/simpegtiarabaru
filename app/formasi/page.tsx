"use client"

import { useState } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Filter,
  Download,
  Plus,
  Briefcase,
  Users,
  AlertCircle,
  CheckCircle2,
  Building2,
  Edit,
  Trash2,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"

const formasiData = [
  {
    id: 1,
    jabatan: "Direktur Utama",
    unit: "Direksi",
    kebutuhan: 1,
    terisi: 1,
    kosong: 0,
    status: "penuh",
  },
  {
    id: 2,
    jabatan: "Direktur Teknik",
    unit: "Direksi",
    kebutuhan: 1,
    terisi: 1,
    kosong: 0,
    status: "penuh",
  },
  {
    id: 3,
    jabatan: "Direktur Umum",
    unit: "Direksi",
    kebutuhan: 1,
    terisi: 1,
    kosong: 0,
    status: "penuh",
  },
  {
    id: 4,
    jabatan: "Kepala Bagian Produksi",
    unit: "Bagian Produksi",
    kebutuhan: 1,
    terisi: 1,
    kosong: 0,
    status: "penuh",
  },
  {
    id: 5,
    jabatan: "Kepala Seksi Produksi",
    unit: "Bagian Produksi",
    kebutuhan: 3,
    terisi: 2,
    kosong: 1,
    status: "kurang",
  },
  {
    id: 6,
    jabatan: "Teknisi Produksi",
    unit: "Bagian Produksi",
    kebutuhan: 15,
    terisi: 12,
    kosong: 3,
    status: "kurang",
  },
  {
    id: 7,
    jabatan: "Kepala Bagian Distribusi",
    unit: "Bagian Distribusi",
    kebutuhan: 1,
    terisi: 1,
    kosong: 0,
    status: "penuh",
  },
  {
    id: 8,
    jabatan: "Kepala Seksi Distribusi",
    unit: "Bagian Distribusi",
    kebutuhan: 4,
    terisi: 3,
    kosong: 1,
    status: "kurang",
  },
  {
    id: 9,
    jabatan: "Teknisi Jaringan",
    unit: "Bagian Distribusi",
    kebutuhan: 25,
    terisi: 22,
    kosong: 3,
    status: "kurang",
  },
  {
    id: 10,
    jabatan: "Kepala Bagian Keuangan",
    unit: "Bagian Keuangan",
    kebutuhan: 1,
    terisi: 1,
    kosong: 0,
    status: "penuh",
  },
  {
    id: 11,
    jabatan: "Analis Keuangan",
    unit: "Bagian Keuangan",
    kebutuhan: 5,
    terisi: 5,
    kosong: 0,
    status: "penuh",
  },
  {
    id: 12,
    jabatan: "Kepala Bagian SDM",
    unit: "Bagian SDM",
    kebutuhan: 1,
    terisi: 1,
    kosong: 0,
    status: "penuh",
  },
  {
    id: 13,
    jabatan: "Staff SDM",
    unit: "Bagian SDM",
    kebutuhan: 6,
    terisi: 4,
    kosong: 2,
    status: "kurang",
  },
  {
    id: 14,
    jabatan: "Kepala Bagian Pelayanan",
    unit: "Bagian Pelayanan",
    kebutuhan: 1,
    terisi: 1,
    kosong: 0,
    status: "penuh",
  },
  {
    id: 15,
    jabatan: "Customer Service",
    unit: "Bagian Pelayanan",
    kebutuhan: 10,
    terisi: 8,
    kosong: 2,
    status: "kurang",
  },
]

export default function FormasiPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredData = formasiData.filter(
    (item) =>
      item.jabatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.unit.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalKebutuhan = formasiData.reduce((acc, item) => acc + item.kebutuhan, 0)
  const totalTerisi = formasiData.reduce((acc, item) => acc + item.terisi, 0)
  const totalKosong = formasiData.reduce((acc, item) => acc + item.kosong, 0)
  const persentaseTerisi = Math.round((totalTerisi / totalKebutuhan) * 100)

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex-1 sidebar-offset">
        <TopBar breadcrumb={["Kepegawaian", "Formasi Jabatan"]} />
        <main className="p-6">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Formasi Jabatan</h1>
              <p className="text-sm text-muted-foreground">
                Kelola formasi dan kebutuhan pegawai PDAM Tirta Ardhia Rinjani
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Formasi
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                    <Briefcase className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalKebutuhan}</p>
                    <p className="text-xs text-muted-foreground">Total Formasi</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                    <Users className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalTerisi}</p>
                    <p className="text-xs text-muted-foreground">Terisi</p>
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
                    <p className="text-2xl font-bold">{totalKosong}</p>
                    <p className="text-xs text-muted-foreground">Kosong</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tingkat Terisi</span>
                    <span className="font-semibold">{persentaseTerisi}%</span>
                  </div>
                  <Progress value={persentaseTerisi} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search & Filter */}
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari jabatan atau unit..."
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
                  <SelectItem value="direksi">Direksi</SelectItem>
                  <SelectItem value="produksi">Bagian Produksi</SelectItem>
                  <SelectItem value="distribusi">Bagian Distribusi</SelectItem>
                  <SelectItem value="keuangan">Bagian Keuangan</SelectItem>
                  <SelectItem value="sdm">Bagian SDM</SelectItem>
                  <SelectItem value="pelayanan">Bagian Pelayanan</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="penuh">Penuh</SelectItem>
                  <SelectItem value="kurang">Kurang</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Formasi Jabatan</CardTitle>
              <CardDescription>
                Data kebutuhan dan ketersediaan formasi per jabatan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jabatan</TableHead>
                    <TableHead>Unit Kerja</TableHead>
                    <TableHead className="text-center">Kebutuhan</TableHead>
                    <TableHead className="text-center">Terisi</TableHead>
                    <TableHead className="text-center">Kosong</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{item.jabatan}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{item.unit}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">{item.kebutuhan}</TableCell>
                      <TableCell className="text-center text-emerald-600 font-medium">{item.terisi}</TableCell>
                      <TableCell className="text-center text-amber-600 font-medium">{item.kosong}</TableCell>
                      <TableCell>
                        <div className="w-24">
                          <Progress 
                            value={(item.terisi / item.kebutuhan) * 100} 
                            className="h-2"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.status === "penuh" ? (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Penuh
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            Kurang
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
