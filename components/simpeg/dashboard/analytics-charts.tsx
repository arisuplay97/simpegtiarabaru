"use client"
import React, { useState, useEffect } from "react"

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const unitDistribution = [
  { name: "Distribusi", value: 345, color: "#1e40af" },
  { name: "Produksi", value: 287, color: "#3b82f6" },
  { name: "Pelayanan", value: 198, color: "#60a5fa" },
  { name: "Keuangan", value: 156, color: "#93c5fd" },
  { name: "SDM & Umum", value: 142, color: "#bfdbfe" },
  { name: "IT & Sistem", value: 119, color: "#dbeafe" },
]

const attendanceData = [
  { day: "Sen", hadir: 1145, izin: 32, cuti: 45, alpha: 5 },
  { day: "Sel", hadir: 1152, izin: 28, cuti: 42, alpha: 3 },
  { day: "Rab", hadir: 1138, izin: 35, cuti: 48, alpha: 6 },
  { day: "Kam", hadir: 1160, izin: 22, cuti: 40, alpha: 2 },
  { day: "Jum", hadir: 1148, izin: 30, cuti: 44, alpha: 4 },
  { day: "Sab", hadir: 856, izin: 12, cuti: 8, alpha: 1 },
  { day: "Min", hadir: 0, izin: 0, cuti: 0, alpha: 0 },
]

const payrollTrend = [
  { month: "Apr", total: 3850, gaji: 3200, tunjangan: 450, lembur: 200 },
  { month: "Mei", total: 3920, gaji: 3200, tunjangan: 480, lembur: 240 },
  { month: "Jun", total: 4100, gaji: 3350, tunjangan: 500, lembur: 250 },
  { month: "Jul", total: 4050, gaji: 3350, tunjangan: 480, lembur: 220 },
  { month: "Ags", total: 4180, gaji: 3400, tunjangan: 520, lembur: 260 },
  { month: "Sep", total: 4220, gaji: 3400, tunjangan: 540, lembur: 280 },
  { month: "Okt", total: 4150, gaji: 3400, tunjangan: 510, lembur: 240 },
  { month: "Nov", total: 4280, gaji: 3450, tunjangan: 550, lembur: 280 },
  { month: "Des", total: 5200, gaji: 3450, tunjangan: 550, lembur: 200 },
  { month: "Jan", total: 4120, gaji: 3500, tunjangan: 400, lembur: 220 },
  { month: "Feb", total: 4180, gaji: 3500, tunjangan: 420, lembur: 260 },
  { month: "Mar", total: 4250, gaji: 3500, tunjangan: 450, lembur: 300 },
]

const employeeStatus = [
  { status: "Tetap", count: 876, percentage: 70 },
  { status: "Kontrak", count: 248, percentage: 20 },
  { status: "PKWT", count: 87, percentage: 7 },
  { status: "Pensiun", count: 36, percentage: 3 },
]

const topPerformingUnits = [
  { unit: "IT & Sistem", score: 94 },
  { unit: "Keuangan", score: 91 },
  { unit: "Pelayanan", score: 88 },
  { unit: "SDM & Umum", score: 86 },
  { unit: "Produksi", score: 84 },
  { unit: "Distribusi", score: 82 },
]

const trendMetrics = [
  {
    label: "Keterlambatan",
    value: "3.2%",
    change: -0.5,
    isPositive: true,
    data: [4.2, 4.0, 3.8, 3.5, 3.4, 3.2, 3.2],
  },
  {
    label: "Lembur",
    value: "12.5%",
    change: 1.2,
    isPositive: false,
    data: [10.5, 11.0, 11.5, 11.8, 12.0, 12.3, 12.5],
  },
  {
    label: "Cuti",
    value: "4.8%",
    change: 0.3,
    isPositive: true,
    data: [4.2, 4.4, 4.5, 4.6, 4.5, 4.7, 4.8],
  },
  {
    label: "Turnover",
    value: "2.1%",
    change: -0.3,
    isPositive: true,
    data: [2.8, 2.6, 2.5, 2.4, 2.3, 2.2, 2.1],
  },
]

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
        <p className="mb-2 text-sm font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' && entry.value > 1000 ? `${(entry.value / 1000).toFixed(1)}rb` : entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

function MiniSparkline({ data, color = "#3b82f6" }: { data: number[]; color?: string }) {
  const chartData = data.map((value, index) => ({ value, index }))
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#gradient-${color})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function AnalyticsCharts({ data }: { data?: any }) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  // Dynamic Data Logic with fallbacks
  const displayAttendance = data?.attendanceTrend && data.attendanceTrend.length > 0 ? data.attendanceTrend : attendanceData
  const displayPayroll = data?.payrollTrend && data.payrollTrend.length > 0 ? data.payrollTrend : payrollTrend
  const displayUnitDist = data?.unitDistribution && data.unitDistribution.length > 0 ? data.unitDistribution : unitDistribution
  const displayEmpStatus = data?.employeeStatus && data.employeeStatus.length > 0 ? data.employeeStatus : employeeStatus
  const displayTopUnits = data?.topPerformingUnits && data.topPerformingUnits.length > 0 ? data.topPerformingUnits : topPerformingUnits
  const displayTrendMetrics = data?.trendMetrics && data.trendMetrics.length > 0 ? data.trendMetrics : trendMetrics

  if (!mounted) {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-[300px] rounded-xl border bg-muted animate-pulse" />
          <div className="h-[300px] rounded-xl border bg-muted animate-pulse" />
        </div>
        <div className="space-y-6">
          <div className="h-[200px] rounded-xl border bg-muted animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left Column - 2/3 width */}
      <div className="flex flex-col gap-6 lg:col-span-2">
        {/* Attendance Chart */}
        <Card className="card-premium">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Kehadiran 7 Hari Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayAttendance} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
                  />
                  <Bar dataKey="hadir" name="Hadir" fill="#1e40af" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="izin" name="Izin" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cuti" name="Cuti" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="alpha" name="Alpha" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payroll Trend */}
        <Card className="card-premium">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                {data?.payrollTrend ? "Tren Payroll 12 Bulan (Juta Rupiah)" : "Tren Payroll 12 Bulan (Mock)"}
              </CardTitle>
              <Tabs defaultValue="total" className="w-auto">
                <TabsList className="h-8">
                  <TabsTrigger value="total" className="text-xs px-3 py-1">Total</TabsTrigger>
                  <TabsTrigger value="detail" className="text-xs px-3 py-1">Detail</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayPayroll}>
                  <defs>
                    <linearGradient id="payrollGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1e40af" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#1e40af" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(1)}M`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Total Payroll"
                    stroke="#1e40af"
                    strokeWidth={2}
                    fill="url(#payrollGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Mini Trend Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {displayTrendMetrics.map((metric: any) => (
            <Card key={metric.label} className="card-premium">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {metric.label}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      metric.isPositive ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {metric.change > 0 ? "+" : ""}
                    {metric.change}%
                  </span>
                </div>
                <p className="mt-1 text-xl font-bold text-foreground">
                  {metric.value}
                </p>
                <div className="mt-2">
                  <MiniSparkline
                    data={metric.data}
                    color={metric.isPositive ? "#10b981" : "#ef4444"}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Right Column - 1/3 width */}
      <div className="flex flex-col gap-6">
        {/* Unit Distribution */}
        <Card className="card-premium">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Sebaran Pegawai per Unit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={displayUnitDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {displayUnitDist.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="rounded-lg border border-border bg-card p-2 shadow-lg">
                            <p className="text-xs font-medium">{data.name}</p>
                            <p className="text-sm font-bold">{data.value} orang</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {displayUnitDist.slice(0, 6).map((unit: any) => (
                <div key={unit.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: unit.color }}
                    />
                    <span className="text-muted-foreground">{unit.name}</span>
                  </div>
                  <span className="font-medium">{unit.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Employee Status */}
        <Card className="card-premium">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Status Kepegawaian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {displayEmpStatus.map((status: any) => (
                <div key={status.status}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{status.status}</span>
                    <span className="font-medium">{status.count}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${status.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Units */}
        <Card className="card-premium">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Kinerja Unit Tertinggi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {displayTopUnits.map((unit: any, index: number) => (
                <div key={unit.unit} className="flex items-center gap-3">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      index === 0
                        ? "bg-amber-100 text-amber-700"
                        : index === 1
                        ? "bg-gray-100 text-gray-700"
                        : index === 2
                        ? "bg-orange-100 text-orange-700"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{unit.unit}</span>
                      <span className="text-sm font-bold text-primary">
                        {unit.score}%
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                        style={{ width: `${unit.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
