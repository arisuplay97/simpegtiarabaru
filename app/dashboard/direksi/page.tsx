"use client"

import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Download,
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Briefcase,
  Award,
  AlertTriangle,
  Calendar,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line,
} from "recharts"

const headcountTrend = [
  { month: "Jan", total: 1210, masuk: 8, keluar: 3 },
  { month: "Feb", total: 1225, masuk: 18, keluar: 3 },
  { month: "Mar", total: 1247, masuk: 25, keluar: 3 },
  { month: "Apr", total: 1255, masuk: 12, keluar: 4 },
  { month: "May", total: 1268, masuk: 15, keluar: 2 },
  { month: "Jun", total: 1280, masuk: 14, keluar: 2 },
]

const payrollTrend = [
  { month: "Jan", total: 8.2, tunjangan: 2.1 },
  { month: "Feb", total: 8.3, tunjangan: 2.1 },
  { month: "Mar", total: 8.5, tunjangan: 2.2 },
  { month: "Apr", total: 8.5, tunjangan: 2.2 },
  { month: "May", total: 8.6, tunjangan: 2.3 },
  { month: "Jun", total: 8.8, tunjangan: 2.3 },
]

const unitDistribution = [
  { name: "Distribusi", value: 312, color: "#1e40af" },
  { name: "Produksi", value: 245, color: "#0d9488" },
  { name: "Pelayanan", value: 198, color: "#d97706" },
  { name: "Keuangan", value: 156, color: "#7c3aed" },
  { name: "IT & Sistem", value: 124, color: "#dc2626" },
  { name: "SDM & Umum", value: 112, color: "#16a34a" },
  { name: "Lainnya", value: 100, color: "#6b7280" },
]

const kpiPerUnit = [
  { unit: "IT & Sistem", score: 91 },
  { unit: "Produksi", score: 88 },
  { unit: "Keuangan", score: 87 },
  { unit: "Pelayanan", score: 85 },
  { unit: "Distribusi", score: 84 },
  { unit: "SDM & Umum", score: 82 },
]

const executiveKPIs = [
  {
    label: "Total Pegawai",
    value: "1,247",
    change: "+3.2%",
    trend: "up",
    icon: Users,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    label: "Biaya SDM / Bulan",
    value: "Rp 8.5M",
    change: "+2.4%",
    trend: "up",
    icon: DollarSign,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
  },
  {
    label: "Rata-rata SKP",
    value: "86.5",
    change: "+1.2",
    trend: "up",
    icon: Target,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    label: "Turnover Rate",
    value: "2.1%",
    change: "-0.3%",
    trend: "down",
    icon: TrendingDown,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
  {
    label: "Tingkat Kehadiran",
    value: "96.5%",
    change: "+0.5%",
    trend: "up",
    icon: Calendar,
    color: "text-teal-600",
    bgColor: "bg-teal-100",
  },
  {
    label: "Formasi Terisi",
    value: "94.2%",
    change: "+1.8%",
    trend: "up",
    icon: Briefcase,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
]

const criticalAlerts = [
  { type: "warning", message: "45 pegawai perlu pembinaan kinerja (SKP < 70)", action: "Lihat Daftar" },
  { type: "info", message: "12 pegawai akan pensiun dalam 6 bulan ke depan", action: "Lihat Daftar" },
  { type: "warning", message: "8 posisi strategis kosong memerlukan rekrutmen", action: "Lihat Formasi" },
  { type: "error", message: "3 approval melewati batas SLA", action: "Proses Segera" },
]

export default function DashboardDireksiPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Dashboard", "Dashboard Direksi"]} />
        <main className="flex-1 overflow-auto p-6">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Executive Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Ringkasan Eksekutif Human Capital - Q1 2026
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export Report
              </Button>
              <Button size="sm" className="gap-2">
                <Calendar className="h-4 w-4" />
                Q1 2026
              </Button>
            </div>
          </div>

          {/* Executive KPIs */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {executiveKPIs.map((kpi) => (
              <Card key={kpi.label} className="card-premium">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpi.bgColor}`}>
                      <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        kpi.trend === "up"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-red-200 bg-red-50 text-red-700"
                      }
                    >
                      {kpi.trend === "up" ? (
                        <ArrowUpRight className="mr-1 h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="mr-1 h-3 w-3" />
                      )}
                      {kpi.change}
                    </Badge>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Row 1 */}
          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            {/* Headcount Trend */}
            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-primary" />
                  Trend Jumlah Pegawai
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={headcountTrend}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1e40af" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#1e40af" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} domain={[1200, 1300]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#1e40af"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorTotal)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Payroll Trend */}
            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Trend Biaya SDM (Miliar)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={payrollTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="total" name="Total Gaji" fill="#1e40af" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="tunjangan" name="Tunjangan" fill="#0d9488" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="mb-6 grid gap-6 lg:grid-cols-3">
            {/* Unit Distribution */}
            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                  Distribusi per Unit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={unitDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {unitDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {unitDistribution.slice(0, 6).map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-muted-foreground">{item.name}</span>
                      <span className="ml-auto text-xs font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* KPI per Unit */}
            <Card className="card-premium lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-primary" />
                  Rata-rata SKP per Unit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={kpiPerUnit} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" domain={[75, 95]} stroke="#6b7280" fontSize={12} />
                      <YAxis dataKey="unit" type="category" stroke="#6b7280" fontSize={12} width={100} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="score" fill="#1e40af" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Critical Alerts */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Alert Penting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {criticalAlerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between rounded-lg border p-4 ${
                      alert.type === "error"
                        ? "border-red-200 bg-red-50"
                        : alert.type === "warning"
                        ? "border-amber-200 bg-amber-50"
                        : "border-blue-200 bg-blue-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle
                        className={`h-5 w-5 ${
                          alert.type === "error"
                            ? "text-red-600"
                            : alert.type === "warning"
                            ? "text-amber-600"
                            : "text-blue-600"
                        }`}
                      />
                      <span className="text-sm">{alert.message}</span>
                    </div>
                    <Button variant="outline" size="sm">
                      {alert.action}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
