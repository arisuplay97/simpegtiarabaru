"use client"
import React, { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

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
import { ChartConfig } from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const MODERN_UNIT_COLORS = ['#3b82f6', '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6']

const unitDistribution = [
  { name: "Distribusi", value: 345, color: "#3b82f6" },
  { name: "Produksi", value: 287, color: "#6366f1" },
  { name: "Pelayanan", value: 198, color: "#06b6d4" },
  { name: "Keuangan", value: 156, color: "#10b981" },
  { name: "SDM & Umum", value: 142, color: "#f59e0b" },
  { name: "IT & Sistem", value: 119, color: "#8b5cf6" },
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
      <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 shadow-md text-xs">
        <p className="mb-1.5 font-bold text-slate-900 dark:text-zinc-100">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 py-0.5 text-xs">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-bold font-mono text-slate-900 dark:text-zinc-100">
              {typeof entry.value === 'number' && entry.value > 1000 ? `${(entry.value / 1000).toFixed(1)}rb` : entry.value}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const AttendanceTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const hadir = payload.find((p: any) => p.dataKey === 'hadir')?.value || 0
    const izin = payload.find((p: any) => p.dataKey === 'izin')?.value || 0
    const cuti = payload.find((p: any) => p.dataKey === 'cuti')?.value || 0
    const alpha = payload.find((p: any) => p.dataKey === 'alpha')?.value || 0
    const total = hadir + izin + cuti + alpha
    const rate = total > 0 ? ((hadir / total) * 100).toFixed(1) : "0"

    return (
      <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-3.5 shadow-xl text-xs min-w-[190px]">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-zinc-800">
          <span className="font-bold text-slate-900 dark:text-zinc-100">{label}</span>
          <span className="text-[11px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
            {rate}% Hadir
          </span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-blue-500" /> Hadir
            </span>
            <span className="font-bold font-mono text-slate-900 dark:text-zinc-100">{hadir.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-cyan-500" /> Izin
            </span>
            <span className="font-bold font-mono text-slate-900 dark:text-zinc-100">{izin.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Cuti
            </span>
            <span className="font-bold font-mono text-slate-900 dark:text-zinc-100">{cuti.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-rose-500" /> Alpa
            </span>
            <span className="font-bold font-mono text-slate-900 dark:text-zinc-100">{alpha.toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

const UnitTooltip = ({ active, payload, totalStaff }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    const pct = totalStaff > 0 ? ((data.value / totalStaff) * 100).toFixed(1) : "0"
    return (
      <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-3 shadow-xl text-xs min-w-[170px]">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="h-2.5 w-2.5 rounded-xs shrink-0" style={{ backgroundColor: data.color }} />
          <p className="font-bold text-slate-900 dark:text-zinc-100 truncate">{data.name}</p>
        </div>
        <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 pt-1.5 border-t border-slate-100 dark:border-zinc-800">
          <span>{data.value.toLocaleString('id-ID')} orang</span>
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{pct}%</span>
        </div>
      </div>
    )
  }
  return null
}

function MiniSparkline({ data, color = "#2563eb" }: { data: number[]; color?: string }) {
  const chartData = data.map((value, index) => ({ value, index }))
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
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

const attendanceConfig = {
  hadir: { label: "Hadir", color: "#2563eb" },
  izin: { label: "Izin", color: "#38bdf8" },
  cuti: { label: "Cuti", color: "#fbbf24" },
  alpha: { label: "Alpa", color: "#ef4444" },
  belumAbsen: { label: "Belum Absen", color: "#94a3b8" },
} satisfies ChartConfig

export function AnalyticsCharts({ data }: { data?: any }) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  // Dynamic Data Logic with fallbacks
  const displayAttendance = data?.attendanceTrend && data.attendanceTrend.length > 0 ? data.attendanceTrend : attendanceData
  const displayPayroll = data?.payrollTrend && data.payrollTrend.length > 0 ? data.payrollTrend : payrollTrend
  const rawUnitDist = data?.unitDistribution && data.unitDistribution.length > 0 ? data.unitDistribution : unitDistribution
  const displayUnitDist = rawUnitDist.map((item: any, idx: number) => ({
    ...item,
    color: item.color && !['#1e40af', '#bfdbfe', '#dbeafe'].includes(item.color)
      ? item.color
      : MODERN_UNIT_COLORS[idx % MODERN_UNIT_COLORS.length]
  }))
  const displayEmpStatus = data?.employeeStatus && data.employeeStatus.length > 0 ? data.employeeStatus : employeeStatus
  const displayTopUnits = data?.topPerformingUnits && data.topPerformingUnits.length > 0 ? data.topPerformingUnits : topPerformingUnits
  const displayTrendMetrics = data?.trendMetrics && data.trendMetrics.length > 0 ? data.trendMetrics : trendMetrics

  // Calculated metrics
  const totalHadir7Hari = displayAttendance.reduce((acc: number, d: any) => acc + (d.hadir || 0), 0)
  const totalAll7Hari = displayAttendance.reduce((acc: number, d: any) => acc + (d.hadir || 0) + (d.izin || 0) + (d.cuti || 0) + (d.alpha || 0), 0)
  const avgAttendanceRate = totalAll7Hari > 0 ? ((totalHadir7Hari / totalAll7Hari) * 100).toFixed(1) : "96.4"
  const totalStaffDist = displayUnitDist.reduce((acc: number, item: any) => acc + (item.value || 0), 0)

  if (!mounted) {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-[300px] rounded-2xl border border-slate-200/60 dark:border-zinc-800 bg-slate-100/60 dark:bg-zinc-900/60 animate-pulse" />
          <div className="h-[300px] rounded-2xl border border-slate-200/60 dark:border-zinc-800 bg-slate-100/60 dark:bg-zinc-900/60 animate-pulse" />
        </div>
        <div className="space-y-6">
          <div className="h-[200px] rounded-2xl border border-slate-200/60 dark:border-zinc-800 bg-slate-100/60 dark:bg-zinc-900/60 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left Column - 2/3 width */}
      <div className="flex flex-col gap-6 lg:col-span-2">
        {/* Attendance Chart */}
        <div className="bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs transition-colors">
          <div className="pb-3.5 border-b border-slate-100 dark:border-zinc-800/70 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                Statistik Kehadiran 7 Hari Terakhir
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Monitoring komparatif kehadiran, izin, cuti, dan alpa harian
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50 text-[11px] font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Rerata: {avgAttendanceRate}%</span>
              </div>
            </div>
          </div>
          <div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayAttendance} barGap={4} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.18)" vertical={false} />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
                    tickLine={false}
                  />
                  <Tooltip content={<AttendanceTooltip />} />
                  <Bar dataKey="hadir" name="Hadir" fill="#3b82f6" stackId="att" maxBarSize={32} />
                  <Bar dataKey="izin" name="Izin" fill="#06b6d4" stackId="att" maxBarSize={32} />
                  <Bar dataKey="cuti" name="Cuti" fill="#f59e0b" stackId="att" maxBarSize={32} />
                  <Bar dataKey="alpha" name="Alpa" fill="#f43f5e" stackId="att" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Modern Legend */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-blue-500" />
                  <span className="text-slate-600 dark:text-zinc-400 font-medium">Hadir</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-cyan-500" />
                  <span className="text-slate-600 dark:text-zinc-400 font-medium">Izin</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-amber-500" />
                  <span className="text-slate-600 dark:text-zinc-400 font-medium">Cuti</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-rose-500" />
                  <span className="text-slate-600 dark:text-zinc-400 font-medium">Alpa</span>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                Data sinkronisasi presensi harian
              </span>
            </div>
          </div>
        </div>

        {/* Payroll Trend */}
        <div className="bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs">
          <div className="pb-3 border-b border-slate-100 dark:border-zinc-800/70 mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                {data?.payrollTrend ? "Tren Anggaran Payroll (Juta Rupiah)" : "Tren Anggaran Payroll 12 Bulan"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Total realisasi gaji pokok dan tunjangan pegawai
              </p>
            </div>
            <Tabs defaultValue="total" className="w-auto">
              <TabsList className="h-7 text-xs bg-slate-100 dark:bg-zinc-800">
                <TabsTrigger value="total" className="text-xs px-2.5 py-0.5">Total</TabsTrigger>
                <TabsTrigger value="detail" className="text-xs px-2.5 py-0.5">Detail</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayPayroll}>
                  <defs>
                    <linearGradient id="payrollGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.18)" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
                    tickLine={false}
                    tickFormatter={(value) => `${(value / 1000).toFixed(1)}M`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Total Payroll"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fill="url(#payrollGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Mini Trend Cards */}
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {displayTrendMetrics.map((metric: any) => (
            <div key={metric.label} className="bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                  {metric.label}
                </span>
                <span
                  className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                    metric.isPositive
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                  }`}
                >
                  {metric.change > 0 ? "+" : ""}
                  {metric.change}%
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-zinc-50">
                {metric.value}
              </p>
              <div className="mt-2.5">
                <MiniSparkline
                  data={metric.data}
                  color={metric.isPositive ? "#10b981" : "#ef4444"}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column - 1/3 width */}
      <div className="flex flex-col gap-6">
        {/* Unit Distribution */}
        <div className="bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs transition-colors">
          <div className="pb-3 border-b border-slate-100 dark:border-zinc-800/70 mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                Sebaran Pegawai per Unit
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Komposisi divisi & unit kerja aktif
              </p>
            </div>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
              {displayUnitDist.length} Unit
            </span>
          </div>
          <div>
            <div className="relative h-[210px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={displayUnitDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={88}
                    paddingAngle={3}
                    cornerRadius={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {displayUnitDist.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<UnitTooltip totalStaff={totalStaffDist} />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Centered Total Headcount Display */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-zinc-100">
                  {totalStaffDist.toLocaleString('id-ID')}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  Total Staf
                </span>
              </div>
            </div>

            <div className="mt-3 space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {displayUnitDist.map((unit: any) => {
                const pct = totalStaffDist > 0 ? ((unit.value / totalStaffDist) * 100).toFixed(1) : "0"
                return (
                  <div
                    key={unit.name}
                    className="flex items-center justify-between p-1.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div
                        className="h-2.5 w-2.5 rounded-xs shrink-0 shadow-2xs"
                        style={{ backgroundColor: unit.color }}
                      />
                      <span className="text-slate-700 dark:text-zinc-300 font-medium truncate">
                        {unit.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                        {pct}%
                      </span>
                      <span className="font-bold font-mono text-slate-900 dark:text-zinc-100 min-w-[44px] text-right">
                        {unit.value}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Employee Status */}
        <div className="bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs">
          <div className="pb-3 border-b border-slate-100 dark:border-zinc-800/70 mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
              Status Kepegawaian
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Rasio pegawai tetap vs kontrak PKWT
            </p>
          </div>
          <div className="space-y-3.5">
            {displayEmpStatus.map((status: any) => (
              <div key={status.status}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-zinc-400 font-medium">{status.status}</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-zinc-100">{status.count} Staf</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${status.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Units */}
        <div className="bg-white dark:bg-[#111113] border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs">
          <div className="pb-3 border-b border-slate-100 dark:border-zinc-800/70 mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
              Kinerja Kedisiplinan Unit
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Tingkat kehadiran 30 hari terakhir
            </p>
          </div>
          <div className="space-y-3">
            {displayTopUnits.map((unit: any, index: number) => (
              <div key={unit.unit} className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold font-mono",
                    index === 0
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                      : index === 1
                      ? "bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300"
                      : index === 2
                      ? "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300"
                      : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
                  )}
                >
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate">{unit.unit}</span>
                    <span className="font-bold font-mono text-blue-600 dark:text-blue-400">
                      {unit.score}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-500"
                      style={{ width: `${unit.score}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
