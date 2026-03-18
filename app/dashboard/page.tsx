'use client'

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { KPICards } from "@/components/simpeg/dashboard/kpi-cards"
import { AnalyticsCharts } from "@/components/simpeg/dashboard/analytics-charts"
import { ApprovalPanel } from "@/components/simpeg/dashboard/approval-panel"
import { getDashboardStats } from "@/lib/actions/dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, FileCheck, AlertCircle, TrendingUp } from "lucide-react"

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    async function loadStats() {
      const data = await getDashboardStats()
      setStats(data)
    }
    loadStats()
  }, [])

  if (!mounted) return null

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Dashboard", "Utama"]} />
        <main className="flex-1 p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                Selamat Datang, {session?.user?.name || 'User'}
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                Berikut adalah ringkasan operasional SDM hari ini — {format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })}.
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="px-3 py-1 text-sm font-medium">
                Sesi: {session?.user?.role || 'Guest'}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard 
              title="Total Pegawai" 
              value={stats?.totalPegawai || "0"} 
              description="Keseluruhan SDM Aktif"
              icon={<Users className="w-5 h-5 text-blue-600" />}
              trend="+2% dari bulan lalu"
            />
            <StatsCard 
              title="Approval Pending" 
              value={stats?.approvalPending || "0"} 
              description="Menunggu verifikasi Anda"
              icon={<FileCheck className="w-5 h-5 text-amber-600" />}
              trend="Segera proses"
            />
            <StatsCard 
              title="Koreksi Absensi" 
              value="12" 
              description="Permohonan hari ini"
              icon={<AlertCircle className="w-5 h-5 text-rose-600" />}
              trend="Butuh penanganan"
            />
            <StatsCard 
              title="Efisiensi Kerja" 
              value="94%" 
              description="Berdasarkan KPI rata-rata"
              icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
              trend="↑ 1.5% peningkatan"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <Card className="xl:col-span-2 shadow-sm border-neutral-200 dark:border-neutral-800">
              <CardHeader>
                <CardTitle>Analitik Kepegawaian</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsCharts />
              </CardContent>
            </Card>
            <div className="space-y-8">
              <Card className="shadow-sm border-neutral-200 dark:border-neutral-800">
                <CardHeader>
                  <CardTitle>Approval Center</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ApprovalPanel />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function StatsCard({ title, value, description, icon, trend }: any) {
  return (
    <Card className="shadow-sm border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{title}</p>
          <div className="p-2 bg-neutral-100 dark:bg-neutral-900 rounded-lg">
            {icon}
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">{value}</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{description}</p>
        </div>
        <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-900">
          <p className={`text-xs font-medium ${trend.includes('↑') || trend.includes('+') ? 'text-emerald-600' : 'text-amber-600'}`}>
            {trend}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
