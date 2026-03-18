"use client"

import { useState } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Search,
  Download,
  Filter,
  Target,
  TrendingUp,
  Award,
  Users,
  Star,
  Eye,
  Edit,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

interface EmployeeKPI {
  id: string
  name: string
  initials: string
  unit: string
  jabatan: string
  score: number
  category: string
  targetAchieved: number
  totalTarget: number
  period: string
}

const employeeKPIs: EmployeeKPI[] = [
  {
    id: "1",
    name: "Ahmad Rizki Pratama",
    initials: "AR",
    unit: "IT & Sistem",
    jabatan: "Kepala Bagian IT",
    score: 91,
    category: "Sangat Baik",
    targetAchieved: 8,
    totalTarget: 10,
    period: "Q1 2026",
  },
  {
    id: "2",
    name: "Siti Nurhaliza",
    initials: "SN",
    unit: "Keuangan",
    jabatan: "Staff Keuangan Senior",
    score: 88,
    category: "Baik",
    targetAchieved: 7,
    totalTarget: 10,
    period: "Q1 2026",
  },
  {
    id: "3",
    name: "Budi Santoso",
    initials: "BS",
    unit: "Distribusi",
    jabatan: "Supervisor Distribusi",
    score: 85,
    category: "Baik",
    targetAchieved: 7,
    totalTarget: 10,
    period: "Q1 2026",
  },
  {
    id: "4",
    name: "Dewi Lestari",
    initials: "DL",
    unit: "Pelayanan",
    jabatan: "Customer Service",
    score: 92,
    category: "Sangat Baik",
    targetAchieved: 9,
    totalTarget: 10,
    period: "Q1 2026",
  },
  {
    id: "5",
    name: "Eko Prasetyo",
    initials: "EP",
    unit: "Produksi",
    jabatan: "Operator IPA",
    score: 78,
    category: "Cukup",
    targetAchieved: 6,
    totalTarget: 10,
    period: "Q1 2026",
  },
  {
    id: "6",
    name: "Gunawan Wibowo",
    initials: "GW",
    unit: "Produksi",
    jabatan: "Manager Produksi",
    score: 95,
    category: "Sangat Baik",
    targetAchieved: 10,
    totalTarget: 10,
    period: "Q1 2026",
  },
]

const categoryConfig: Record<string, { className: string }> = {
  "Sangat Baik": { className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  "Baik": { className: "bg-blue-100 text-blue-700 border-blue-200" },
  "Cukup": { className: "bg-amber-100 text-amber-700 border-amber-200" },
  "Kurang": { className: "bg-red-100 text-red-700 border-red-200" },
}

const stats = [
  { label: "Rata-rata SKP", value: "86.5", icon: Target, color: "text-primary" },
  { label: "Sangat Baik", value: "425", icon: Star, color: "text-emerald-600" },
  { label: "Baik", value: "612", icon: TrendingUp, color: "text-blue-600" },
  { label: "Perlu Pembinaan", value: "45", icon: Award, color: "text-amber-600" },
]

export default function KPIPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [unitFilter, setUnitFilter] = useState<string>("all")

  const filteredKPIs = employeeKPIs.filter((kpi) => {
    const matchesSearch =
      kpi.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kpi.unit.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || kpi.category === categoryFilter
    const matchesUnit = unitFilter === "all" || kpi.unit === unitFilter
    return matchesSearch && matchesCategory && matchesUnit
  })

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600"
    if (score >= 80) return "text-blue-600"
    if (score >= 70) return "text-amber-600"
    return "text-red-600"
  }

  const getProgressColor = (score: number) => {
    if (score >= 90) return "bg-emerald-500"
    if (score >= 80) return "bg-blue-500"
    if (score >= 70) return "bg-amber-500"
    return "bg-red-500"
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Kinerja & Karier", "KPI & Penilaian"]} />
        <main className="flex-1 overflow-auto p-6">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">KPI & Penilaian Kinerja</h1>
              <p className="text-sm text-muted-foreground">
                Kelola penilaian kinerja dan SKP pegawai - Periode Q1 2026
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export Laporan
              </Button>
              <Button size="sm" className="gap-2">
                <Target className="h-4 w-4" />
                Set Target Baru
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="card-premium">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <Card className="card-premium mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari pegawai atau unit kerja..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kategori</SelectItem>
                      <SelectItem value="Sangat Baik">Sangat Baik</SelectItem>
                      <SelectItem value="Baik">Baik</SelectItem>
                      <SelectItem value="Cukup">Cukup</SelectItem>
                      <SelectItem value="Kurang">Kurang</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={unitFilter} onValueChange={setUnitFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Unit Kerja" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Unit</SelectItem>
                      <SelectItem value="IT & Sistem">IT & Sistem</SelectItem>
                      <SelectItem value="Keuangan">Keuangan</SelectItem>
                      <SelectItem value="Distribusi">Distribusi</SelectItem>
                      <SelectItem value="Pelayanan">Pelayanan</SelectItem>
                      <SelectItem value="Produksi">Produksi</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="card-premium">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[250px]">Pegawai</TableHead>
                      <TableHead>Unit Kerja</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead>Target Tercapai</TableHead>
                      <TableHead>Nilai SKP</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead className="w-[100px] text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredKPIs.map((kpi) => (
                      <TableRow key={kpi.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10 text-sm text-primary">
                                {kpi.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-foreground">{kpi.name}</p>
                              <p className="text-xs text-muted-foreground">{kpi.jabatan}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{kpi.unit}</TableCell>
                        <TableCell className="text-sm">{kpi.period}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 rounded-full bg-secondary">
                              <div
                                className={`h-2 rounded-full ${getProgressColor(kpi.score)}`}
                                style={{ width: `${(kpi.targetAchieved / kpi.totalTarget) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {kpi.targetAchieved}/{kpi.totalTarget}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`text-2xl font-bold ${getScoreColor(kpi.score)}`}>
                            {kpi.score}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={categoryConfig[kpi.category]?.className}
                          >
                            {kpi.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-border p-4">
                <p className="text-sm text-muted-foreground">
                  Menampilkan {filteredKPIs.length} dari 1,247 pegawai
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="default" size="sm" className="h-8 w-8 p-0">
                    1
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                    2
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                    3
                  </Button>
                  <Button variant="outline" size="sm">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
