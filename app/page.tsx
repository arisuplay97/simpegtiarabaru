"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { KPICards } from "@/components/simpeg/dashboard/kpi-cards"
import { AnalyticsCharts } from "@/components/simpeg/dashboard/analytics-charts"
import { ApprovalPanel } from "@/components/simpeg/dashboard/approval-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Badge } from "@/components/ui/badge"
import { downloadCsvFile, downloadTextFile } from "@/lib/demo-files"
import { Download, FileText, UserPlus, CreditCard } from "lucide-react"

export default function DashboardPage() {
  const [reportOpen, setReportOpen] = useState(false)
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false)
  const [payrollOpen, setPayrollOpen] = useState(false)
  const [reportType, setReportType] = useState("ringkasan-sdm")
  const [reportPeriod, setReportPeriod] = useState("maret-2026")
  const [reportFormat, setReportFormat] = useState("csv")
  const [newEmployee, setNewEmployee] = useState({
    nama: "",
    nik: "",
    jabatan: "",
    unit: "",
  })
  const [recentEmployees, setRecentEmployees] = useState<Array<{ nama: string; nik: string }>>([])
  const [payrollStatus, setPayrollStatus] = useState<"Belum Diproses" | "Sedang Diproses" | "Selesai Diproses">("Belum Diproses")

  const dashboardRows = useMemo(
    () => [
      ["Metrik", "Nilai"],
      ["Total Pegawai", 1247],
      ["Pegawai Aktif", 1198],
      ["Approval Pending", 47],
      ["Kehadiran Hari Ini", "96.8%"],
      ["Payroll Bulan Ini", "Rp 4.200.000.000"],
      ["Pegawai Mendekati Pensiun", 23],
      ["Kontrak Akan Habis", 8],
      ["Training Aktif", 12],
      ["Status Payroll", payrollStatus],
    ],
    [payrollStatus]
  )

  const handleExportDashboard = () => {
    downloadCsvFile("dashboard-human-capital.csv", dashboardRows)
    toast.success("Ringkasan dashboard berhasil diunduh")
  }

  const handleGenerateReport = () => {
    const content = [
      "SIMPEG PDAM - Generated Report",
      `Jenis Laporan: ${reportType}`,
      `Periode: ${reportPeriod}`,
      `Format: ${reportFormat}`,
      `Tanggal Generate: ${new Date().toLocaleString("id-ID")}`,
      "",
      "Ringkasan:",
      "- Total Pegawai: 1.247",
      "- Approval Pending: 47",
      "- Kehadiran Hari Ini: 96.8%",
      `- Status Payroll: ${payrollStatus}`,
    ].join("\n")

    if (reportFormat === "txt") {
      downloadTextFile(`laporan-${reportType}-${reportPeriod}.txt`, content)
    } else {
      downloadCsvFile(`laporan-${reportType}-${reportPeriod}.csv`, [
        ["Parameter", "Nilai"],
        ["Jenis Laporan", reportType],
        ["Periode", reportPeriod],
        ["Status Payroll", payrollStatus],
        ["Generated At", new Date().toLocaleString("id-ID")],
      ])
    }

    toast.success("Laporan berhasil digenerate")
    setReportOpen(false)
  }

  const handleAddEmployee = () => {
    if (!newEmployee.nama || !newEmployee.nik || !newEmployee.jabatan || !newEmployee.unit) {
      toast.error("Lengkapi nama, NIK, jabatan, dan unit kerja")
      return
    }

    setRecentEmployees((prev) => [
      { nama: newEmployee.nama, nik: newEmployee.nik },
      ...prev,
    ].slice(0, 3))

    toast.success(`Pegawai ${newEmployee.nama} berhasil ditambahkan`) 
    setNewEmployee({ nama: "", nik: "", jabatan: "", unit: "" })
    setAddEmployeeOpen(false)
  }

  const handleProcessPayroll = () => {
    setPayrollStatus("Sedang Diproses")
    toast.success("Payroll sedang diproses")
    window.setTimeout(() => {
      setPayrollStatus("Selesai Diproses")
      toast.success("Payroll periode Maret 2026 berhasil diproses")
    }, 1200)
    setPayrollOpen(false)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col pl-64">
        <TopBar breadcrumb={["Dashboard", "Dashboard Utama"]} />
        <div className="flex flex-1">
          <main className="flex-1 overflow-auto p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Dashboard Human Capital</h1>
                <p className="text-sm text-muted-foreground">
                  Ringkasan SDM, absensi, payroll, dan approval hari ini
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline">Status Payroll: {payrollStatus}</Badge>
                  {recentEmployees.length > 0 && (
                    <Badge variant="secondary">Pegawai baru sesi ini: {recentEmployees.length}</Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={handleExportDashboard}>
                  <Download className="h-4 w-4" />
                  Export Dashboard
                </Button>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setReportOpen(true)}>
                  <FileText className="h-4 w-4" />
                  Generate Report
                </Button>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setAddEmployeeOpen(true)}>
                  <UserPlus className="h-4 w-4" />
                  Tambah Pegawai
                </Button>
                <Button size="sm" className="gap-2" onClick={() => setPayrollOpen(true)}>
                  <CreditCard className="h-4 w-4" />
                  Proses Payroll
                </Button>
              </div>
            </div>

            {recentEmployees.length > 0 && (
              <div className="mb-6 rounded-xl border bg-card p-4">
                <h2 className="mb-3 text-sm font-semibold">Pegawai baru yang ditambahkan</h2>
                <div className="space-y-2">
                  {recentEmployees.map((employee) => (
                    <div key={employee.nik} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                      <span className="font-medium">{employee.nama}</span>
                      <span className="font-mono text-muted-foreground">{employee.nik}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <KPICards />
            </div>
            <AnalyticsCharts />
          </main>

          <aside className="hidden w-96 shrink-0 border-l border-border bg-muted/30 xl:block">
            <ApprovalPanel />
          </aside>
        </div>
      </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Report</DialogTitle>
            <DialogDescription>Pilih jenis laporan, periode, dan format export.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Jenis laporan</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ringkasan-sdm">Ringkasan SDM</SelectItem>
                  <SelectItem value="approval">Approval Center</SelectItem>
                  <SelectItem value="payroll">Payroll</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Periode</Label>
              <Select value={reportPeriod} onValueChange={setReportPeriod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="maret-2026">Maret 2026</SelectItem>
                  <SelectItem value="q1-2026">Q1 2026</SelectItem>
                  <SelectItem value="tahun-2026">Tahun 2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={reportFormat} onValueChange={setReportFormat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="txt">TXT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>Batal</Button>
            <Button onClick={handleGenerateReport}>Generate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addEmployeeOpen} onOpenChange={setAddEmployeeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Pegawai</DialogTitle>
            <DialogDescription>Input data pegawai dasar untuk demo.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="nama">Nama Pegawai</Label>
              <Input id="nama" value={newEmployee.nama} onChange={(e) => setNewEmployee((prev) => ({ ...prev, nama: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nik">NIK</Label>
              <Input id="nik" value={newEmployee.nik} onChange={(e) => setNewEmployee((prev) => ({ ...prev, nik: e.target.value }))} maxLength={16} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jabatan">Jabatan</Label>
              <Input id="jabatan" value={newEmployee.jabatan} onChange={(e) => setNewEmployee((prev) => ({ ...prev, jabatan: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit Kerja</Label>
              <Input id="unit" value={newEmployee.unit} onChange={(e) => setNewEmployee((prev) => ({ ...prev, unit: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddEmployeeOpen(false)}>Batal</Button>
            <Button onClick={handleAddEmployee}>Simpan Pegawai</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={payrollOpen} onOpenChange={setPayrollOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proses Payroll</DialogTitle>
            <DialogDescription>Payroll periode Maret 2026 akan diproses untuk seluruh pegawai aktif.</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
            Pastikan approval koreksi payroll sudah final sebelum melanjutkan proses ini.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayrollOpen(false)}>Batal</Button>
            <Button onClick={handleProcessPayroll}>Ya, Proses Sekarang</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
