"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { SidebarNav } from "@/components/simpeg/sidebar-nav"
import { TopBar } from "@/components/simpeg/top-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { cn, normalizeGolonganKey } from "@/lib/utils"
import {
  Search,
  Download,
  Wallet,
  Calculator,
  FileText,
  Clock,
  MoreHorizontal,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Edit3,
  SlidersHorizontal,
  ShieldAlert,
  Building2,
  CheckCircle2,
  CalendarDays,
  Percent,
  RefreshCw,
  Printer,
  Users,
  AlertTriangle,
  FileSpreadsheet,
  ArrowUpDown,
  Plus,
  Trash2,
  Award,
  Sparkles,
} from "lucide-react"
import Image from "next/image"
import { 
  getPayrollList, 
  savePayroll, 
  processAllPayroll, 
  getPayrollSettings, 
  updatePayrollSettings,
  getStandarGajiPangkatList,
  saveStandarGajiPangkat,
  deleteStandarGajiPangkat,
  applyStandarGajiToPegawai
} from "@/lib/actions/payroll"
import { generateA5SlipGajiPdf } from "@/lib/cetak-slip"

interface PayrollEmployee {
  pegawaiId: string
  nik: string
  nama: string
  fotoUrl: string | null
  unit: string
  golongan: string
  jabatan?: string
  gajiPokok: number
  tunjangan: number
  potongan: number
  lembur: number
  gajiBersih: number
  status: string
  payrollId?: string
  countAlpa?: number
  dendaAlpa?: number
  countTerlambatDenda?: number
  dendaTerlambat?: number
  penaltiTransport?: number
  bpjsKes?: number
  bpjsTk?: number
}

const statusConfig = {
  draft: { 
    label: "Draft", 
    className: "bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 border-slate-200 dark:border-slate-700" 
  },
  approved: { 
    label: "Disetujui", 
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" 
  },
  paid: { 
    label: "Dibayar", 
    className: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800" 
  },
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Helper generate dynamic payroll periods (from current month backwards 20 months)
const generatePayrollPeriods = () => {
  const months = ["jan", "feb", "mar", "apr", "mei", "jun", "jul", "agu", "sep", "okt", "nov", "des"]
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
  
  const now = new Date()
  const list = []
  for (let i = 0; i < 20; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const mIdx = d.getMonth()
    const yr = d.getFullYear()
    list.push({
      value: `${months[mIdx]}-${yr}`,
      label: `${monthNames[mIdx]} ${yr}`
    })
  }
  return list
}

const payrollPeriods = generatePayrollPeriods()

export default function PayrollPage() {
  const [data, setData] = useState<PayrollEmployee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [unitFilter, setUnitFilter] = useState<string>("all")
  const [selectedPeriod, setSelectedPeriod] = useState(() => payrollPeriods[0]?.value || "sep-2026")
  const [activeTab, setActiveTab] = useState("daftar")

  // Settings State
  const [settings, setSettings] = useState({
    dendaAlpa: 7500,
    batasAlpaDendaTransport: 3,
    tunjanganTransport: 120000,
    dendaTerlambat: 5000,
    batasTerlambatDenda: 5,
    bpjsKesehatanPcs: 1.0,
    bpjsTkPcs: 2.0,
    tanggalGajian: 25,
  })
  const [isLoadingSettings, setIsLoadingSettings] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)

  // Dialogs State
  const [showSlipDialog, setShowSlipDialog] = useState(false)
  const [showProcessDialog, setShowProcessDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<PayrollEmployee | null>(null)

  // Edit Salary Form State
  const [editForm, setEditForm] = useState({
    gajiPokok: 0,
    tunjanganJabatan: 0,
    tunjanganTransport: 0,
    tunjanganMakan: 0,
    tunjanganLainnya: 0,
    potonganBpjsKes: 0,
    potonganBpjsTk: 0,
    potonganDenda: 0,
    potonganKasbon: 0,
    potonganLainnya: 0,
  })

  // Standar Gaji per Pangkat / Golongan State
  const [standarPangkatList, setStandarPangkatList] = useState<any[]>([])
  const [isLoadingStandar, setIsLoadingStandar] = useState(false)
  const [isSavingStandar, setIsSavingStandar] = useState(false)
  const [standarSearch, setStandarSearch] = useState("")
  const [isApplyingStandar, setIsApplyingStandar] = useState(false)
  const [showStandarDialog, setShowStandarDialog] = useState(false)
  const [standarForm, setStandarForm] = useState<{
    id?: string
    golongan: string
    pangkat: string
    gajiPokok: number
    tunjangan: number
    keterangan: string
  }>({
    id: undefined,
    golongan: "",
    pangkat: "",
    gajiPokok: 0,
    tunjangan: 0,
    keterangan: ""
  })

  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [processProgress, setProcessProgress] = useState(0)

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Load Payroll Data
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getPayrollList(selectedPeriod)
      setData(res as any)
    } catch {
      toast.error("Gagal memuat data payroll")
    } finally {
      setIsLoading(false)
    }
  }, [selectedPeriod])

  // Load Settings Data
  const fetchSettings = useCallback(async () => {
    setIsLoadingSettings(true)
    try {
      const s = await getPayrollSettings()
      setSettings(s)
    } catch {
      toast.error("Gagal memuat pengaturan payroll")
    } finally {
      setIsLoadingSettings(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // Load Standar Gaji Pangkat
  const fetchStandarPangkat = useCallback(async () => {
    setIsLoadingStandar(true)
    try {
      const list = await getStandarGajiPangkatList()
      setStandarPangkatList(list)
    } catch (err: any) {
      console.error("Gagal memuat standar gaji:", err)
      toast.error("Gagal memuat data standar gaji pangkat")
    } finally {
      setIsLoadingStandar(false)
    }
  }, [])

  useEffect(() => {
    fetchStandarPangkat()
  }, [fetchStandarPangkat])

  // Recalculate BPJS proportionally if Gaji Pokok changes in Edit Modal
  const handleGajiPokokChange = (val: number) => {
    const bpjsKesPct = (settings.bpjsKesehatanPcs || 1.0) / 100
    const bpjsTkPct = (settings.bpjsTkPcs || 2.0) / 100
    setEditForm(prev => ({
      ...prev,
      gajiPokok: val,
      potonganBpjsKes: Math.round(val * bpjsKesPct),
      potonganBpjsTk: Math.round(val * bpjsTkPct),
    }))
  }

  // Unique units for filtering
  const units = useMemo(() => {
    const set = new Set(data.map(d => d.unit).filter(Boolean))
    return Array.from(set).sort()
  }, [data])

  // Filtering
  const filteredData = useMemo(() => {
    return data.filter((emp) => {
      const matchesSearch =
        emp.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.nik.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || emp.status === statusFilter
      const matchesUnit = unitFilter === "all" || emp.unit === unitFilter
      return matchesSearch && matchesStatus && matchesUnit
    })
  }, [data, searchQuery, statusFilter, unitFilter])

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage))
  const paginatedData = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage
    return filteredData.slice(startIdx, startIdx + itemsPerPage)
  }, [filteredData, currentPage, itemsPerPage])

  const getPaginationPages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages]
    }
    if (currentPage >= totalPages - 3) {
      return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages]
  }

  // Aggregate Stats
  const stats = useMemo(() => {
    const totalGajiBersih = data.reduce((sum, emp) => sum + emp.gajiBersih, 0)
    const totalGajiPokok = data.reduce((sum, emp) => sum + emp.gajiPokok, 0)
    const totalTunjangan = data.reduce((sum, emp) => sum + emp.tunjangan, 0)
    const totalLembur = data.reduce((sum, emp) => sum + emp.lembur, 0)
    const totalPotongan = data.reduce((sum, emp) => sum + emp.potongan, 0)
    const processedCount = data.filter(e => e.status !== "draft").length
    const progressPercent = data.length > 0 ? (processedCount / data.length) * 100 : 0

    return {
      totalGajiBersih,
      totalGajiPokok,
      totalTunjangan,
      totalLembur,
      totalPotongan,
      totalPegawai: data.length,
      processedCount,
      progressPercent,
    }
  }, [data])

  // Unit Summary Breakdown
  const unitSummaries = useMemo(() => {
    const map: Record<string, {
      unit: string
      count: number
      gajiPokok: number
      tunjangan: number
      lembur: number
      potongan: number
      gajiBersih: number
    }> = {}

    for (const emp of data) {
      const u = emp.unit || "Umum"
      if (!map[u]) {
        map[u] = {
          unit: u,
          count: 0,
          gajiPokok: 0,
          tunjangan: 0,
          lembur: 0,
          potongan: 0,
          gajiBersih: 0
        }
      }
      map[u].count++
      map[u].gajiPokok += emp.gajiPokok
      map[u].tunjangan += emp.tunjangan
      map[u].lembur += emp.lembur
      map[u].potongan += emp.potongan
      map[u].gajiBersih += emp.gajiBersih
    }

    return Object.values(map).sort((a, b) => b.gajiBersih - a.gajiBersih)
  }, [data])

  // Handler: Batch Process Payroll
  const handleProcessPayroll = async () => {
    setShowProcessDialog(true)
    setIsProcessing(true)
    setProcessProgress(0)

    try {
      const interval = setInterval(() => {
        setProcessProgress(prev => Math.min(prev + 15, 90))
      }, 300)

      const result = await processAllPayroll(selectedPeriod)
      clearInterval(interval)

      if (result.error) throw new Error(result.error)

      setProcessProgress(100)
      setTimeout(() => {
        setIsProcessing(false)
        setShowProcessDialog(false)
        toast.success(`Payroll berhasil diproses untuk ${result.processedCount} pegawai periode ${selectedPeriod.toUpperCase()}`)
        fetchData()
      }, 600)
    } catch (error: any) {
      setIsProcessing(false)
      setShowProcessDialog(false)
      toast.error(error.message || "Terjadi kesalahan saat memproses payroll")
    }
  }

  // Handler: Open Edit Salary Dialog
  const handleEditSalary = (emp: PayrollEmployee) => {
    setSelectedEmployee(emp)
    const dendaTotal = (emp.dendaAlpa || 0) + (emp.dendaTerlambat || 0) + (emp.penaltiTransport || 0)
    const bpjsKesVal = emp.bpjsKes || Math.round(emp.gajiPokok * ((settings.bpjsKesehatanPcs || 1.0) / 100))
    const bpjsTkVal = emp.bpjsTk || Math.round(emp.gajiPokok * ((settings.bpjsTkPcs || 2.0) / 100))
    const kasbonVal = Math.max(0, emp.potongan - dendaTotal - bpjsKesVal - bpjsTkVal)

    setEditForm({
      gajiPokok: emp.gajiPokok,
      tunjanganJabatan: emp.tunjangan,
      tunjanganTransport: 0,
      tunjanganMakan: 0,
      tunjanganLainnya: 0,
      potonganBpjsKes: bpjsKesVal,
      potonganBpjsTk: bpjsTkVal,
      potonganDenda: dendaTotal,
      potonganKasbon: kasbonVal,
      potonganLainnya: 0,
    })
    setShowEditDialog(true)
  }

  // Handler: Save Manual Salary Edit
  const handleSaveSalary = async () => {
    if (!selectedEmployee) return
    setIsSaving(true)

    const totalTunjangan = 
      editForm.tunjanganJabatan + 
      editForm.tunjanganTransport + 
      editForm.tunjanganMakan + 
      editForm.tunjanganLainnya

    const totalPotongan = 
      editForm.potonganBpjsKes + 
      editForm.potonganBpjsTk + 
      editForm.potonganDenda + 
      editForm.potonganKasbon + 
      editForm.potonganLainnya

    try {
      const res = await savePayroll({
        pegawaiId: selectedEmployee.pegawaiId,
        periodStr: selectedPeriod,
        gajiPokok: editForm.gajiPokok,
        tunjangan: totalTunjangan,
        potongan: totalPotongan,
      })

      if (res.error) throw new Error(res.error)

      toast.success(`Gaji ${selectedEmployee.nama} berhasil diperbarui`)
      setShowEditDialog(false)
      fetchData()
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan rincian gaji")
    } finally {
      setIsSaving(false)
    }
  }

  // Handler: Save Payroll & Penalty Settings Directly
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingSettings(true)
    try {
      const res = await updatePayrollSettings(settings)
      if (res.error) throw new Error(res.error)
      toast.success("Pengaturan denda & payroll berhasil disimpan")
      fetchData() // Refresh live draft values with new settings
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui pengaturan payroll")
    } finally {
      setIsSavingSettings(false)
    }
  }

  // ============ STANDAR GAJI PANGKAT HANDLERS & MEMOS ============
  const handleOpenEditStandar = (item?: any) => {
    if (item) {
      setStandarForm({
        id: item.id,
        golongan: item.golongan,
        pangkat: item.pangkat,
        gajiPokok: item.gajiPokok,
        tunjangan: item.tunjangan,
        keterangan: item.keterangan || ""
      })
    } else {
      setStandarForm({
        id: undefined,
        golongan: "",
        pangkat: "",
        gajiPokok: 0,
        tunjangan: 0,
        keterangan: ""
      })
    }
    setShowStandarDialog(true)
  }

  const handleSaveStandar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!standarForm.golongan.trim() || !standarForm.pangkat.trim()) {
      toast.error("Golongan dan nama pangkat wajib diisi")
      return
    }

    setIsSavingStandar(true)
    try {
      const res = await saveStandarGajiPangkat({
        id: standarForm.id,
        golongan: standarForm.golongan,
        pangkat: standarForm.pangkat,
        gajiPokok: Number(standarForm.gajiPokok),
        tunjangan: Number(standarForm.tunjangan),
        keterangan: standarForm.keterangan
      })
      if (res.error) throw new Error(res.error)

      toast.success(`Standar gaji ${standarForm.golongan} (${standarForm.pangkat}) berhasil disimpan`)
      setShowStandarDialog(false)
      fetchStandarPangkat()
      fetchData() // Refresh live draft values if any employee falls back to this
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan standar gaji")
    } finally {
      setIsSavingStandar(false)
    }
  }

  const handleDeleteStandar = async (item: any) => {
    if (!confirm(`Hapus standar gaji untuk Golongan ${item.golongan} (${item.pangkat})?`)) return
    try {
      const res = await deleteStandarGajiPangkat(item.id)
      if (res.error) throw new Error(res.error)
      toast.success(`Standar gaji ${item.golongan} berhasil dihapus`)
      fetchStandarPangkat()
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus standar gaji")
    }
  }

  const handleApplyStandarToEmployees = async (mode: "zero_only" | "all", golongan?: string) => {
    const confirmMsg = mode === "zero_only"
      ? "Terapkan standar gaji ke pegawai aktif yang gajinya masih Rp 0?"
      : "PERINGATAN: Ini akan menimpa seluruh nominal gaji pokok dan tunjangan pegawai aktif sesuai standar golongannya. Lanjutkan?"
    
    if (!confirm(confirmMsg)) return

    setIsApplyingStandar(true)
    try {
      const res = await applyStandarGajiToPegawai({ mode, golongan })
      if (res.error) throw new Error(res.error)
      toast.success(`Standar gaji berhasil diterapkan ke ${res.updatedCount} pegawai`)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Gagal menerapkan standar gaji ke pegawai")
    } finally {
      setIsApplyingStandar(false)
    }
  }

  const RANK_ORDER: Record<string, number> = {
    "A/I": 1, "A/II": 2, "A/III": 3, "A/IV": 4,
    "B/I": 5, "B/II": 6, "B/III": 7, "B/IV": 8,
    "C/I": 9, "C/II": 10, "C/III": 11, "C/IV": 12,
    "D/I": 13, "D/II": 14, "D/III": 15, "D/IV": 16,
    "E/IV": 17
  }

  const filteredStandarList = useMemo(() => {
    let list = standarPangkatList
    if (standarSearch.trim()) {
      const q = standarSearch.toLowerCase().trim()
      list = standarPangkatList.filter((item: any) => 
        item.golongan?.toLowerCase().includes(q) ||
        item.pangkat?.toLowerCase().includes(q) ||
        (item.keterangan && item.keterangan.toLowerCase().includes(q))
      )
    }
    return [...list].sort((a: any, b: any) => {
      const keyA = normalizeGolonganKey(a.golongan)
      const keyB = normalizeGolonganKey(b.golongan)
      const orderA = RANK_ORDER[keyA] || RANK_ORDER[a.golongan?.toUpperCase().trim()] || 99
      const orderB = RANK_ORDER[keyB] || RANK_ORDER[b.golongan?.toUpperCase().trim()] || 99
      if (orderA !== orderB) return orderA - orderB
      return (a.golongan || "").localeCompare(b.golongan || "")
    })
  }, [standarPangkatList, standarSearch])

  const employeeCountByGolongan = useMemo(() => {
    const map: Record<string, number> = {}
    for (const emp of data) {
      if (!emp.golongan) continue
      const raw = emp.golongan.toUpperCase().trim()
      const norm = normalizeGolonganKey(emp.golongan)
      map[raw] = (map[raw] || 0) + 1
      if (norm && norm !== raw) {
        map[norm] = (map[norm] || 0) + 1
      }
    }
    return map
  }, [data])

  // Handler: Export CSV
  const handleExportExcel = () => {
    const headers = ["NIK", "Nama", "Unit", "Golongan", "Jabatan", "Gaji Pokok", "Tunjangan", "Lembur", "Potongan", "Gaji Bersih", "Status"]
    const csvData = filteredData.map(emp => [
      `"${emp.nik}"`,
      `"${emp.nama}"`,
      `"${emp.unit}"`,
      `"${emp.golongan}"`,
      `"${emp.jabatan || "-"}"`,
      emp.gajiPokok,
      emp.tunjangan,
      emp.lembur,
      emp.potongan,
      emp.gajiBersih,
      `"${emp.status}"`,
    ].join(","))

    const csvContent = "\uFEFF" + [headers.join(","), ...csvData].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `payroll_pdam_${selectedPeriod}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Data payroll berhasil diekspor ke CSV")
  }

  // Handler: Print/Download PDF Slip
  const handlePrintSlip = async (emp: PayrollEmployee) => {
    try {
      toast.info("Menyiapkan dokumen Slip Gaji PDF...")
      await generateA5SlipGajiPdf({
        pegawaiId: emp.pegawaiId,
        nik: emp.nik,
        nama: emp.nama,
        unit: emp.unit,
        golongan: emp.golongan,
        jabatan: emp.jabatan,
        bank: "Bank NTB Syariah / Mandiri",
        noRekening: "-",
        gajiPokok: emp.gajiPokok,
        tunjangan: emp.tunjangan,
        lembur: emp.lembur,
        potongan: emp.potongan,
        gajiBersih: emp.gajiBersih,
        status: emp.status,
      }, selectedPeriod.toUpperCase())
      toast.success("Slip Gaji PDF berhasil diunduh")
    } catch (err: any) {
      toast.error("Gagal membuat slip gaji: " + err.message)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav />
      <div className="flex flex-1 flex-col sidebar-offset">
        <TopBar breadcrumb={["Remunerasi", "Payroll & Penggajian"]} />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 space-y-6">
          
          {/* Header Section */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Payroll Management
                </h1>
                <Badge variant="outline" className="text-xs font-mono px-2 py-0.5 border-border/80">
                  {selectedPeriod.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Kalkulasi penggajian otomatis, potongan denda presensi (Alpha & Keterlambatan), BPJS, dan cetak slip gaji
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 border-border/80 hover:bg-muted/50" 
                onClick={handleExportExcel}
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Export CSV
              </Button>
              <Button 
                size="sm" 
                className="gap-2 bg-primary text-primary-foreground shadow-xs hover:bg-primary/90" 
                onClick={handleProcessPayroll} 
                disabled={isLoading || isProcessing}
              >
                <Calculator className="h-4 w-4" />
                {isProcessing ? "Memproses..." : "Proses Payroll Batch"}
              </Button>
            </div>
          </div>

          {/* Period Selector & Batch Status Strip */}
          <Card className="border border-border/70 rounded-xl bg-card shadow-xs">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Periode Penggajian</label>
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <SelectTrigger className="w-[180px] h-9 text-xs font-medium border-border/80">
                        <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {payrollPeriods.map(p => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="hidden sm:block h-8 w-px bg-border/80" />

                  <div>
                    <span className="text-xs font-medium text-muted-foreground block mb-1">Status Periode</span>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs font-medium px-2.5 py-1",
                        stats.processedCount === stats.totalPegawai && stats.totalPegawai > 0
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200"
                      )}
                    >
                      {stats.processedCount === stats.totalPegawai && stats.totalPegawai > 0 ? (
                        <>
                          <CheckCircle2 className="mr-1.5 h-3 w-3" />
                          Final (Selesai Diproses)
                        </>
                      ) : (
                        <>
                          <Clock className="mr-1.5 h-3 w-3" />
                          Draft / Berjalan
                        </>
                      )}
                    </Badge>
                  </div>
                </div>

                <div className="flex-1 lg:max-w-md">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Progres Approval & Slip</span>
                    <span className="font-mono font-medium text-foreground">
                      {stats.processedCount} / {stats.totalPegawai} pegawai ({stats.progressPercent.toFixed(0)}%)
                    </span>
                  </div>
                  <Progress value={stats.progressPercent} className="h-2 bg-muted" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clean Metric Cards Grid */}
          <div className="grid gap-3.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            <Card className="border border-border/70 rounded-xl bg-card shadow-xs p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Total Gaji Bersih</span>
                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Wallet className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-lg font-bold font-mono tracking-tight text-foreground truncate" title={formatCurrency(stats.totalGajiBersih)}>
                  {formatCurrency(stats.totalGajiBersih)}
                </div>
                <span className="text-[10px] text-muted-foreground">Total Take Home Pay</span>
              </div>
            </Card>

            <Card className="border border-border/70 rounded-xl bg-card shadow-xs p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Gaji Pokok</span>
                <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-lg font-bold font-mono tracking-tight text-foreground truncate" title={formatCurrency(stats.totalGajiPokok)}>
                  {formatCurrency(stats.totalGajiPokok)}
                </div>
                <span className="text-[10px] text-muted-foreground">Total Pokok Seluruh Unit</span>
              </div>
            </Card>

            <Card className="border border-border/70 rounded-xl bg-card shadow-xs p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Tunjangan</span>
                <div className="h-7 w-7 rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400 flex items-center justify-center">
                  <Percent className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-lg font-bold font-mono tracking-tight text-sky-600 dark:text-sky-400 truncate" title={formatCurrency(stats.totalTunjangan)}>
                  +{formatCurrency(stats.totalTunjangan)}
                </div>
                <span className="text-[10px] text-muted-foreground">Jabatan, Transport & Makan</span>
              </div>
            </Card>

            <Card className="border border-border/70 rounded-xl bg-card shadow-xs p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Lembur</span>
                <div className="h-7 w-7 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-lg font-bold font-mono tracking-tight text-amber-600 dark:text-amber-400 truncate" title={formatCurrency(stats.totalLembur)}>
                  +{formatCurrency(stats.totalLembur)}
                </div>
                <span className="text-[10px] text-muted-foreground">Approved Overtime Pay</span>
              </div>
            </Card>

            <Card className="border border-border/70 rounded-xl bg-card shadow-xs p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Total Potongan</span>
                <div className="h-7 w-7 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-lg font-bold font-mono tracking-tight text-rose-600 dark:text-rose-400 truncate" title={formatCurrency(stats.totalPotongan)}>
                  -{formatCurrency(stats.totalPotongan)}
                </div>
                <span className="text-[10px] text-muted-foreground">Denda Alpa, Telat & BPJS</span>
              </div>
            </Card>

            <Card className="border border-border/70 rounded-xl bg-card shadow-xs p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Pegawai</span>
                <div className="h-7 w-7 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-lg font-bold font-mono tracking-tight text-foreground">
                  {stats.totalPegawai} <span className="text-xs font-normal text-muted-foreground">Orang</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {stats.processedCount} approved, {stats.totalPegawai - stats.processedCount} draft
                </span>
              </div>
            </Card>
          </div>

          {/* Main Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="bg-muted/60 p-1 border border-border/60 rounded-lg">
              <TabsTrigger value="daftar" className="text-xs font-medium gap-1.5 px-3 py-1.5">
                <FileText className="h-3.5 w-3.5" />
                Daftar Gaji Pegawai
              </TabsTrigger>
              <TabsTrigger value="komponen" className="text-xs font-medium gap-1.5 px-3 py-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Rekap per Unit Kerja
              </TabsTrigger>
              <TabsTrigger value="potongan" className="text-xs font-medium gap-1.5 px-3 py-1.5">
                <ShieldAlert className="h-3.5 w-3.5" />
                Rincian Potongan & Denda
              </TabsTrigger>
              <TabsTrigger value="aturan" className="text-xs font-medium gap-1.5 px-3 py-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Aturan & Denda Payroll
              </TabsTrigger>
              <TabsTrigger value="standar" className="text-xs font-medium gap-1.5 px-3 py-1.5">
                <Award className="h-3.5 w-3.5" />
                Standar Besaran Gaji
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: DAFTAR GAJI PEGAWAI */}
            <TabsContent value="daftar" className="space-y-4">
              {/* Search & Filter Bar */}
              <Card className="border border-border/70 rounded-xl bg-card shadow-xs">
                <CardContent className="p-3.5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cari berdasarkan nama atau NIK pegawai..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 text-xs border-border/80"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Select value={unitFilter} onValueChange={setUnitFilter}>
                        <SelectTrigger className="w-[160px] h-9 text-xs border-border/80">
                          <Building2 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                          <SelectValue placeholder="Semua Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Unit</SelectItem>
                          {units.map(u => (
                            <SelectItem key={u} value={u}>{u}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px] h-9 text-xs border-border/80">
                          <SelectValue placeholder="Semua Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Status</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="approved">Disetujui</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-9 text-xs gap-1 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setSearchQuery("")
                          setStatusFilter("all")
                          setUnitFilter("all")
                        }}
                      >
                        Reset Filter
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payroll Table */}
              <Card className="border border-border/70 rounded-xl bg-card shadow-xs overflow-hidden">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow className="border-b border-border/70 hover:bg-transparent">
                          <TableHead className="w-[280px] text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pegawai</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unit & Golongan</TableHead>
                          <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gaji Pokok</TableHead>
                          <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tunjangan</TableHead>
                          <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lembur</TableHead>
                          <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Potongan</TableHead>
                          <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gaji Bersih</TableHead>
                          <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                          <TableHead className="w-[60px] text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={9} className="h-48 text-center text-muted-foreground">
                              <div className="flex flex-col items-center justify-center gap-2">
                                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground/60" />
                                <span className="text-xs">Memuat kalkulasi payroll...</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : paginatedData.length > 0 ? (
                          paginatedData.map((emp) => {
                            const hasPenalty = (emp.countAlpa || 0) > 0 || (emp.countTerlambatDenda || 0) > 0

                            return (
                              <TableRow key={emp.pegawaiId} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 border border-border/60">
                                      <AvatarImage src={emp.fotoUrl || undefined} alt={emp.nama} />
                                      <AvatarFallback className="text-xs font-semibold bg-muted text-muted-foreground">
                                        {emp.nama.split(" ").slice(0, 2).map(n => n[0]).join("")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <p className="text-xs font-semibold text-foreground truncate">{emp.nama}</p>
                                      <p className="text-[11px] font-mono text-muted-foreground">{emp.nik}</p>
                                      {emp.jabatan && emp.jabatan !== "-" && (
                                        <p className="text-[10px] text-muted-foreground/80 truncate">{emp.jabatan}</p>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-xs font-medium text-foreground">{emp.unit}</div>
                                  <Badge variant="outline" className="mt-1 text-[10px] font-mono px-1.5 py-0 border-border/70">
                                    {emp.golongan}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs text-foreground">
                                  {formatCurrency(emp.gajiPokok)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs text-sky-600 dark:text-sky-400">
                                  +{formatCurrency(emp.tunjangan)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs text-amber-600 dark:text-amber-400">
                                  {emp.lembur > 0 ? `+${formatCurrency(emp.lembur)}` : "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="font-mono text-xs text-rose-600 dark:text-rose-400 font-medium">
                                    {emp.potongan > 0 ? `-${formatCurrency(emp.potongan)}` : "Rp 0"}
                                  </div>
                                  {hasPenalty && (
                                    <div className="flex flex-wrap gap-1 justify-end mt-0.5">
                                      {emp.countAlpa && emp.countAlpa > 0 ? (
                                        <span className="text-[9px] px-1 py-0.2 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/50">
                                          Alpa: {emp.countAlpa}h
                                        </span>
                                      ) : null}
                                      {emp.countTerlambatDenda && emp.countTerlambatDenda > 0 ? (
                                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/50">
                                          Telat: {emp.countTerlambatDenda}x
                                        </span>
                                      ) : null}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm font-bold text-primary">
                                  {formatCurrency(emp.gajiBersih)}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge
                                    variant="outline"
                                    className={cn("text-[11px] font-medium px-2 py-0.5", (statusConfig as any)[emp.status]?.className || statusConfig.draft.className)}
                                  >
                                    {(statusConfig as any)[emp.status]?.label || "Draft"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 text-xs">
                                      <DropdownMenuItem onClick={() => handleEditSalary(emp)} className="gap-2 cursor-pointer">
                                        <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                                        Edit Gaji Manual
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => {
                                        setSelectedEmployee(emp)
                                        setShowSlipDialog(true)
                                      }} className="gap-2 cursor-pointer">
                                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                        Lihat Rincian Slip
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handlePrintSlip(emp)} className="gap-2 cursor-pointer text-primary">
                                        <Printer className="h-3.5 w-3.5" />
                                        Unduh Slip (PDF)
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            )
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={9} className="h-36 text-center text-muted-foreground text-xs">
                              Tidak ada data pegawai yang sesuai dengan pencarian atau filter.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Table Footer Summary */}
                  {filteredData.length > 0 && (
                    <div className="border-t border-border/70 bg-muted/20 px-4 py-3 flex flex-wrap items-center justify-between text-xs gap-2">
                      <div className="text-muted-foreground">
                        Total {filteredData.length} pegawai terpilih
                      </div>
                      <div className="flex items-center gap-4 font-mono font-medium">
                        <div>
                          <span className="text-muted-foreground mr-1.5">Total Bersih:</span>
                          <span className="text-primary font-bold text-sm">
                            {formatCurrency(filteredData.reduce((sum, e) => sum + e.gajiBersih, 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pagination */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>
                  Halaman {currentPage} dari {totalPages} ({filteredData.length} total pegawai)
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 border-border/80"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {getPaginationPages().map((p, idx) =>
                    typeof p === "number" ? (
                      <Button
                        key={p}
                        variant={currentPage === p ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0 text-xs border-border/80 font-mono"
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </Button>
                    ) : (
                      <span key={`ellipsis-${idx}`} className="text-slate-400 px-1 font-mono text-xs">
                        ...
                      </span>
                    )
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 border-border/80"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: REKAP PER UNIT KERJA */}
            <TabsContent value="komponen" className="space-y-4">
              <Card className="border border-border/70 rounded-xl bg-card shadow-xs overflow-hidden">
                <CardHeader className="p-4 border-b border-border/70">
                  <CardTitle className="text-sm font-semibold">Distribusi Penggajian per Unit Kerja / Bidang</CardTitle>
                  <CardDescription className="text-xs">
                    Akumulasi nilai Gaji Pokok, Tunjangan, Lembur, dan Potongan resmi periode {selectedPeriod.toUpperCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow className="border-b border-border/70">
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unit / Bidang</TableHead>
                          <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pegawai</TableHead>
                          <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Pokok</TableHead>
                          <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Tunjangan</TableHead>
                          <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Lembur</TableHead>
                          <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Potongan</TableHead>
                          <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Net Payroll</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {unitSummaries.map((u) => (
                          <TableRow key={u.unit} className="border-b border-border/50 hover:bg-muted/30">
                            <TableCell className="font-medium text-xs text-foreground">
                              {u.unit}
                            </TableCell>
                            <TableCell className="text-center text-xs font-mono">
                              <Badge variant="outline" className="px-2 py-0 border-border/60">
                                {u.count} org
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs">
                              {formatCurrency(u.gajiPokok)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-sky-600 dark:text-sky-400">
                              +{formatCurrency(u.tunjangan)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-amber-600 dark:text-amber-400">
                              +{formatCurrency(u.lembur)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-rose-600 dark:text-rose-400">
                              -{formatCurrency(u.potongan)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs font-bold text-primary">
                              {formatCurrency(u.gajiBersih)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: RINCIAN POTONGAN & DENDA */}
            <TabsContent value="potongan" className="space-y-4">
              <Card className="border border-border/70 rounded-xl bg-card shadow-xs overflow-hidden">
                <CardHeader className="p-4 border-b border-border/70">
                  <CardTitle className="text-sm font-semibold">Rincian Komponen Potongan & Penalti Presensi Pegawai</CardTitle>
                  <CardDescription className="text-xs">
                    Rincian transparansi potongan Denda Alpa, Penalti Tunjangan Transport, Keterlambatan, dan Estimasi BPJS
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow className="border-b border-border/70">
                          <TableHead className="w-[240px] text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pegawai</TableHead>
                          <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Denda Alpa</TableHead>
                          <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Penalti Transport</TableHead>
                          <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Denda Telat</TableHead>
                          <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">BPJS Kes (1%)</TableHead>
                          <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">BPJS TK (2%)</TableHead>
                          <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Potongan</TableHead>
                          <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredData.map((emp) => (
                          <TableRow key={emp.pegawaiId} className="border-b border-border/50 hover:bg-muted/30">
                            <TableCell>
                              <div className="text-xs font-semibold text-foreground">{emp.nama}</div>
                              <div className="text-[10px] text-muted-foreground font-mono">{emp.nik} &bull; {emp.unit}</div>
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs">
                              {emp.dendaAlpa && emp.dendaAlpa > 0 ? (
                                <span className="text-rose-600 dark:text-rose-400 font-medium">
                                  {formatCurrency(emp.dendaAlpa)} ({emp.countAlpa}h)
                                </span>
                              ) : (
                                <span className="text-muted-foreground/60">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs">
                              {emp.penaltiTransport && emp.penaltiTransport > 0 ? (
                                <span className="text-rose-600 dark:text-rose-400 font-medium">
                                  {formatCurrency(emp.penaltiTransport)} (Hangus)
                                </span>
                              ) : (
                                <span className="text-muted-foreground/60">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs">
                              {emp.dendaTerlambat && emp.dendaTerlambat > 0 ? (
                                <span className="text-amber-600 dark:text-amber-400 font-medium">
                                  {formatCurrency(emp.dendaTerlambat)} ({emp.countTerlambatDenda}x)
                                </span>
                              ) : (
                                <span className="text-muted-foreground/60">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-muted-foreground">
                              {formatCurrency(emp.bpjsKes || Math.round(emp.gajiPokok * 0.01))}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-muted-foreground">
                              {formatCurrency(emp.bpjsTk || Math.round(emp.gajiPokok * 0.02))}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                              -{formatCurrency(emp.potongan)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
                                onClick={() => handleEditSalary(emp)}
                              >
                                <Edit3 className="h-3 w-3" />
                                Sesuaikan
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 4: ATURAN & DENDA PAYROLL (PINDAHAN PENGATURAN) */}
            <TabsContent value="aturan" className="space-y-4">
              <form onSubmit={handleSaveSettings}>
                <div className="grid gap-4 md:grid-cols-2">
                  
                  {/* Card 1: Denda Presensi & Alpa */}
                  <Card className="border border-border/70 rounded-xl bg-card shadow-xs">
                    <CardHeader className="p-4 pb-2 border-b border-border/70">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center">
                          <ShieldAlert className="h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-semibold">Aturan Denda & Penalti Presensi</CardTitle>
                          <CardDescription className="text-xs">Parameter kalkulasi denda otomatis jika mangkir atau terlambat</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="dendaAlpa" className="text-xs font-medium">Denda Alpa Harian (Rp)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">Rp</span>
                          <Input
                            id="dendaAlpa"
                            type="number"
                            value={settings.dendaAlpa}
                            onChange={(e) => setSettings({ ...settings, dendaAlpa: Number(e.target.value) })}
                            className="pl-9 h-9 text-xs font-mono border-border/80"
                            required
                          />
                        </div>
                        <p className="text-[11px] text-muted-foreground">Denda dipotong per hari jika pegawai berstatus ALPA (tanpa keterangan sah).</p>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="tunjanganTransport" className="text-xs font-medium">Nominal Tunjangan Transport (Rp)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">Rp</span>
                          <Input
                            id="tunjanganTransport"
                            type="number"
                            value={settings.tunjanganTransport}
                            onChange={(e) => setSettings({ ...settings, tunjanganTransport: Number(e.target.value) })}
                            className="pl-9 h-9 text-xs font-mono border-border/80"
                            required
                          />
                        </div>
                        <p className="text-[11px] text-muted-foreground">Besaran tunjangan transport yang akan dihanguskan jika batas alpa tercapai.</p>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="batasAlpaDendaTransport" className="text-xs font-medium">Batas Hari Alpa Tunjangan Transport Hangus</Label>
                        <Input
                          id="batasAlpaDendaTransport"
                          type="number"
                          value={settings.batasAlpaDendaTransport}
                          onChange={(e) => setSettings({ ...settings, batasAlpaDendaTransport: Number(e.target.value) })}
                          className="h-9 text-xs font-mono border-border/80"
                          required
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Jika alpa mencapai &ge; {settings.batasAlpaDendaTransport} hari, tunjangan transport {formatCurrency(settings.tunjanganTransport)} dipotong habis.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
                        <div className="space-y-1.5">
                          <Label htmlFor="dendaTerlambat" className="text-xs font-medium">Denda Keterlambatan (Rp)</Label>
                          <Input
                            id="dendaTerlambat"
                            type="number"
                            value={settings.dendaTerlambat}
                            onChange={(e) => setSettings({ ...settings, dendaTerlambat: Number(e.target.value) })}
                            className="h-9 text-xs font-mono border-border/80"
                            required
                          />
                          <p className="text-[10px] text-muted-foreground">Per kejadian telat.</p>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="batasTerlambatDenda" className="text-xs font-medium">Toleransi Menit Mulai Denda</Label>
                          <Input
                            id="batasTerlambatDenda"
                            type="number"
                            value={settings.batasTerlambatDenda}
                            onChange={(e) => setSettings({ ...settings, batasTerlambatDenda: Number(e.target.value) })}
                            className="h-9 text-xs font-mono border-border/80"
                            required
                          />
                          <p className="text-[10px] text-muted-foreground">Menit setelah jam masuk.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card 2: BPJS & Jadwal Gajian */}
                  <Card className="border border-border/70 rounded-xl bg-card shadow-xs">
                    <CardHeader className="p-4 pb-2 border-b border-border/70">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400 flex items-center justify-center">
                          <SlidersHorizontal className="h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-semibold">Tarif Iuran BPJS & Jadwal Gajian</CardTitle>
                          <CardDescription className="text-xs">Persentase iuran pemotongan gaji pokok pegawai</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="bpjsKesehatanPcs" className="text-xs font-medium">Iuran BPJS Kesehatan Pegawai (%)</Label>
                        <Input
                          id="bpjsKesehatanPcs"
                          type="number"
                          step="0.1"
                          value={settings.bpjsKesehatanPcs}
                          onChange={(e) => setSettings({ ...settings, bpjsKesehatanPcs: Number(e.target.value) })}
                          className="h-9 text-xs font-mono border-border/80"
                          required
                        />
                        <p className="text-[11px] text-muted-foreground">Standar iuran pegawai adalah 1% dari gaji pokok (perusahaan menanggung 4%).</p>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="bpjsTkPcs" className="text-xs font-medium">Iuran BPJS Ketenagakerjaan Pegawai (%)</Label>
                        <Input
                          id="bpjsTkPcs"
                          type="number"
                          step="0.1"
                          value={settings.bpjsTkPcs}
                          onChange={(e) => setSettings({ ...settings, bpjsTkPcs: Number(e.target.value) })}
                          className="h-9 text-xs font-mono border-border/80"
                          required
                        />
                        <p className="text-[11px] text-muted-foreground">JHT (2%) ditanggung pegawai dari gaji pokok.</p>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-border/50">
                        <Label htmlFor="tanggalGajian" className="text-xs font-medium">Tanggal Cut-off / Pembayaran Gaji</Label>
                        <Input
                          id="tanggalGajian"
                          type="number"
                          min="1"
                          max="31"
                          value={settings.tanggalGajian}
                          onChange={(e) => setSettings({ ...settings, tanggalGajian: Number(e.target.value) })}
                          className="h-9 text-xs font-mono border-border/80"
                          required
                        />
                        <p className="text-[11px] text-muted-foreground">Tanggal penerbitan slip & pencairan payroll bulanan.</p>
                      </div>

                      <div className="pt-4 flex justify-end">
                        <Button 
                          type="submit" 
                          size="sm" 
                          className="gap-2 bg-primary text-primary-foreground shadow-xs" 
                          disabled={isSavingSettings || isLoadingSettings}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {isSavingSettings ? "Menyimpan Perubahan..." : "Simpan Aturan Payroll"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </form>
            </TabsContent>

            {/* TAB 5: STANDAR BESARAN GAJI POKOK & TUNJANGAN */}
            <TabsContent value="standar" className="space-y-4">
              <Card className="border border-border/70 rounded-xl bg-card shadow-xs">
                <CardHeader className="p-4 pb-3 border-b border-border/70">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center">
                        <Award className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">Standar Besaran Gaji & Tunjangan per Golongan / Pangkat</CardTitle>
                        <CardDescription className="text-xs">
                          Konfigurasi resmi patokan gaji pokok & tunjangan (Gol A/I, B/I, C/I, dst) sebagai acuan baku payroll
                        </CardDescription>
                      </div>
                    </div>

                    {/* Actions: Sync and Add */}
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1.5 border-border/80"
                            disabled={isApplyingStandar}
                          >
                            <RefreshCw className={cn("h-3.5 w-3.5", isApplyingStandar && "animate-spin text-primary")} />
                            <span>Terapkan ke Pegawai</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64">
                          <DropdownMenuItem onClick={() => handleApplyStandarToEmployees("zero_only")}>
                            <div className="flex flex-col py-0.5">
                              <span className="font-medium text-xs">Terapkan ke Pegawai Rp 0 (Aman)</span>
                              <span className="text-[10px] text-muted-foreground">Hanya isi pegawai yang nominal gajinya masih Rp 0</span>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleApplyStandarToEmployees("all")}>
                            <div className="flex flex-col py-0.5">
                              <span className="font-medium text-xs text-rose-600 dark:text-rose-400">Sinkronkan SEMUA Pegawai</span>
                              <span className="text-[10px] text-muted-foreground">Perbarui seluruh gaji aktif sesuai standar golongannya</span>
                            </div>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Button
                        size="sm"
                        className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground shadow-xs"
                        onClick={() => handleOpenEditStandar()}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Tambah Tingkatan
                      </Button>
                    </div>
                  </div>

                  {/* Search & Subtitle */}
                  <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="relative w-full sm:w-80">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Cari Golongan (A/I, Gol B, C/III) atau nama pangkat..."
                        value={standarSearch}
                        onChange={(e) => setStandarSearch(e.target.value)}
                        className="pl-8 h-8 text-xs border-border/80"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Total <strong>{filteredStandarList.length}</strong> tingkatan pangkat terdaftar</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/40 border-b border-border/70">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-[120px] text-xs font-semibold py-2.5 pl-4">Golongan</TableHead>
                          <TableHead className="text-xs font-semibold py-2.5">Nama Pangkat & Kualifikasi</TableHead>
                          <TableHead className="text-right text-xs font-semibold py-2.5">Gaji Pokok</TableHead>
                          <TableHead className="text-right text-xs font-semibold py-2.5">Tunjangan</TableHead>
                          <TableHead className="text-right text-xs font-semibold py-2.5">Total Standar</TableHead>
                          <TableHead className="text-center text-xs font-semibold py-2.5">Pegawai Aktif</TableHead>
                          <TableHead className="w-[130px] text-center text-xs font-semibold py-2.5 pr-4">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingStandar ? (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center text-xs text-muted-foreground">
                              Memuat data standar gaji pangkat...
                            </TableCell>
                          </TableRow>
                        ) : filteredStandarList.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center text-xs text-muted-foreground">
                              Tidak ada data standar pangkat yang cocok dengan pencarian.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredStandarList.map((item: any) => {
                            const rawKey = (item.golongan || "").toUpperCase().trim()
                            const normKey = normalizeGolonganKey(item.golongan)
                            const count = employeeCountByGolongan[rawKey] || employeeCountByGolongan[normKey] || 0

                            return (
                              <TableRow key={item.id} className="hover:bg-muted/30 border-b border-border/50">
                                <TableCell className="pl-4 py-2.5">
                                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium border border-border/80 bg-background/80 text-foreground shadow-2xs">
                                    <span className="text-[10px] font-semibold tracking-wider text-muted-foreground/80 uppercase">GOL</span>
                                    <span className="font-bold text-foreground tracking-tight">{item.golongan}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="py-2.5">
                                  <div className="flex flex-col">
                                    <span className="text-xs font-medium text-foreground">{item.pangkat}</span>
                                    {item.keterangan && (
                                      <span className="text-[10px] text-muted-foreground">{item.keterangan}</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs font-semibold py-2.5 text-foreground">
                                  {formatCurrency(item.gajiPokok)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs font-medium py-2.5 text-sky-600 dark:text-sky-400">
                                  +{formatCurrency(item.tunjangan)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs font-bold py-2.5 text-emerald-600 dark:text-emerald-400">
                                  {formatCurrency(item.gajiPokok + item.tunjangan)}
                                </TableCell>
                                <TableCell className="text-center py-2.5">
                                  {count > 0 ? (
                                    <Badge variant="secondary" className="text-[11px] font-medium gap-1 bg-muted px-2 py-0.5">
                                      <Users className="h-3 w-3 text-muted-foreground" />
                                      {count} orang
                                    </Badge>
                                  ) : (
                                    <span className="text-[11px] text-muted-foreground/60">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="pr-4 py-2.5 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
                                      onClick={() => handleOpenEditStandar(item)}
                                    >
                                      <Edit3 className="h-3 w-3" />
                                      Ubah
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 text-xs px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                      onClick={() => handleDeleteStandar(item)}
                                      title="Hapus tingkat ini"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Edit Salary Modal Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden rounded-xl border border-border/70">
          <DialogHeader className="p-4 border-b border-border/70 bg-muted/20">
            <DialogTitle className="text-base font-semibold">Penyesuaian Rincian Gaji Pegawai</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {selectedEmployee?.nama} &bull; {selectedEmployee?.nik} ({selectedPeriod.toUpperCase()})
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Kolom Kiri: Penghasilan */}
              <div className="space-y-3 bg-muted/20 p-3 rounded-lg border border-border/60">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block border-b border-border/50 pb-1">
                  Komponen Penghasilan
                </span>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Gaji Pokok</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Rp</span>
                    <Input
                      type="number"
                      value={editForm.gajiPokok}
                      onChange={(e) => handleGajiPokokChange(Number(e.target.value))}
                      className="pl-8 h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Tunjangan Jabatan</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Rp</span>
                    <Input
                      type="number"
                      value={editForm.tunjanganJabatan}
                      onChange={(e) => setEditForm({ ...editForm, tunjanganJabatan: Number(e.target.value) })}
                      className="pl-8 h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Tunjangan Transport</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Rp</span>
                    <Input
                      type="number"
                      value={editForm.tunjanganTransport}
                      onChange={(e) => setEditForm({ ...editForm, tunjanganTransport: Number(e.target.value) })}
                      className="pl-8 h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Tunjangan Makan</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Rp</span>
                    <Input
                      type="number"
                      value={editForm.tunjanganMakan}
                      onChange={(e) => setEditForm({ ...editForm, tunjanganMakan: Number(e.target.value) })}
                      className="pl-8 h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center text-xs font-bold text-sky-600 dark:text-sky-400 border-t border-border/50">
                  <span>Subtotal Tunjangan:</span>
                  <span className="font-mono">
                    +{formatCurrency(editForm.tunjanganJabatan + editForm.tunjanganTransport + editForm.tunjanganMakan + editForm.tunjanganLainnya)}
                  </span>
                </div>
              </div>

              {/* Kolom Kanan: Potongan */}
              <div className="space-y-3 bg-muted/20 p-3 rounded-lg border border-border/60">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block border-b border-border/50 pb-1">
                  Komponen Potongan
                </span>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-rose-600 dark:text-rose-400">Denda Presensi (Alpa/Telat)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Rp</span>
                    <Input
                      type="number"
                      value={editForm.potonganDenda}
                      onChange={(e) => setEditForm({ ...editForm, potonganDenda: Number(e.target.value) })}
                      className="pl-8 h-8 text-xs font-mono border-rose-200 dark:border-rose-900/50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">BPJS Kesehatan (1%)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Rp</span>
                    <Input
                      type="number"
                      value={editForm.potonganBpjsKes}
                      onChange={(e) => setEditForm({ ...editForm, potonganBpjsKes: Number(e.target.value) })}
                      className="pl-8 h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">BPJS Ketenagakerjaan (2%)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Rp</span>
                    <Input
                      type="number"
                      value={editForm.potonganBpjsTk}
                      onChange={(e) => setEditForm({ ...editForm, potonganBpjsTk: Number(e.target.value) })}
                      className="pl-8 h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Kasbon / Angsuran Koperasi</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Rp</span>
                    <Input
                      type="number"
                      value={editForm.potonganKasbon}
                      onChange={(e) => setEditForm({ ...editForm, potonganKasbon: Number(e.target.value) })}
                      className="pl-8 h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center text-xs font-bold text-rose-600 dark:text-rose-400 border-t border-border/50">
                  <span>Total Potongan:</span>
                  <span className="font-mono">
                    -{formatCurrency(editForm.potonganBpjsKes + editForm.potonganBpjsTk + editForm.potonganDenda + editForm.potonganKasbon + editForm.potonganLainnya)}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Net Pay Preview */}
            <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-foreground uppercase block">Estimasi Gaji Bersih</span>
                <span className="text-[11px] text-muted-foreground">(Gaji Pokok + Total Tunjangan - Total Potongan)</span>
              </div>
              <span className="font-mono text-xl font-bold text-primary">
                {formatCurrency(
                  editForm.gajiPokok + 
                  (editForm.tunjanganJabatan + editForm.tunjanganTransport + editForm.tunjanganMakan + editForm.tunjanganLainnya) - 
                  (editForm.potonganBpjsKes + editForm.potonganBpjsTk + editForm.potonganDenda + editForm.potonganKasbon + editForm.potonganLainnya)
                )}
              </span>
            </div>
          </div>

          <DialogFooter className="p-3 border-t border-border/70 bg-muted/20">
            <Button variant="outline" size="sm" onClick={() => setShowEditDialog(false)}>Batal</Button>
            <Button size="sm" onClick={handleSaveSalary} disabled={isSaving} className="gap-1.5">
              {isSaving ? "Menyimpan..." : "Simpan Perubahan Gaji"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Slip Gaji Modal Preview */}
      <Dialog open={showSlipDialog} onOpenChange={setShowSlipDialog}>
        <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden rounded-xl border border-border/70">
          <DialogHeader className="p-4 border-b border-border/70 bg-muted/20">
            <DialogTitle className="text-base font-semibold">Slip Gaji Pegawai</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Rincian resmi penggajian periode {selectedPeriod.toUpperCase()}
            </DialogDescription>
          </DialogHeader>

          {selectedEmployee && (
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-border/70 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white overflow-hidden border">
                    <Image src="/logo-tar.png" alt="Logo PDAM" width={40} height={40} className="object-contain" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">PDAM Tirta Ardhia Rinjani</h3>
                    <p className="text-[11px] text-muted-foreground">Sistem Informasi Penggajian Resmi (ASIK)</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-xs font-mono font-bold">
                    {selectedPeriod.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <p><span className="text-muted-foreground">Nama:</span> <span className="font-semibold">{selectedEmployee.nama}</span></p>
                  <p><span className="text-muted-foreground">NIK:</span> <span className="font-mono">{selectedEmployee.nik}</span></p>
                  <p><span className="text-muted-foreground">Jabatan:</span> {selectedEmployee.jabatan || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p><span className="text-muted-foreground">Unit:</span> {selectedEmployee.unit}</p>
                  <p><span className="text-muted-foreground">Golongan:</span> <span className="font-mono">{selectedEmployee.golongan}</span></p>
                  <p><span className="text-muted-foreground">Status:</span> <span className="uppercase font-semibold">{selectedEmployee.status}</span></p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-2">
                <div className="space-y-2 text-xs">
                  <span className="font-bold text-muted-foreground uppercase tracking-wider block border-b pb-1">Penerimaan</span>
                  <div className="flex justify-between">
                    <span>Gaji Pokok</span>
                    <span className="font-mono">{formatCurrency(selectedEmployee.gajiPokok)}</span>
                  </div>
                  <div className="flex justify-between text-sky-600 dark:text-sky-400">
                    <span>Tunjangan</span>
                    <span className="font-mono">+{formatCurrency(selectedEmployee.tunjangan)}</span>
                  </div>
                  {selectedEmployee.lembur > 0 && (
                    <div className="flex justify-between text-amber-600 dark:text-amber-400">
                      <span>Lembur</span>
                      <span className="font-mono">+{formatCurrency(selectedEmployee.lembur)}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <span className="font-bold text-muted-foreground uppercase tracking-wider block border-b pb-1">Potongan</span>
                  {selectedEmployee.dendaAlpa && selectedEmployee.dendaAlpa > 0 ? (
                    <div className="flex justify-between text-rose-600 dark:text-rose-400">
                      <span>Denda Alpa ({selectedEmployee.countAlpa}h)</span>
                      <span className="font-mono">-{formatCurrency(selectedEmployee.dendaAlpa)}</span>
                    </div>
                  ) : null}
                  {selectedEmployee.penaltiTransport && selectedEmployee.penaltiTransport > 0 ? (
                    <div className="flex justify-between text-rose-600 dark:text-rose-400">
                      <span>Penalti Transport</span>
                      <span className="font-mono">-{formatCurrency(selectedEmployee.penaltiTransport)}</span>
                    </div>
                  ) : null}
                  {selectedEmployee.dendaTerlambat && selectedEmployee.dendaTerlambat > 0 ? (
                    <div className="flex justify-between text-amber-600 dark:text-amber-400">
                      <span>Denda Telat ({selectedEmployee.countTerlambatDenda}x)</span>
                      <span className="font-mono">-{formatCurrency(selectedEmployee.dendaTerlambat)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-rose-600 dark:text-rose-400 font-bold border-t pt-1">
                    <span>Total Potongan</span>
                    <span className="font-mono">-{formatCurrency(selectedEmployee.potongan)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-muted/40 p-3 rounded-lg flex justify-between items-center border">
                <span className="text-xs font-bold uppercase">Gaji Bersih (Take Home Pay)</span>
                <span className="font-mono text-lg font-bold text-primary">{formatCurrency(selectedEmployee.gajiBersih)}</span>
              </div>
            </div>
          )}

          <DialogFooter className="p-3 border-t border-border/70 bg-muted/20">
            <Button variant="outline" size="sm" onClick={() => setShowSlipDialog(false)}>Tutup</Button>
            {selectedEmployee && (
              <Button size="sm" className="gap-2" onClick={() => handlePrintSlip(selectedEmployee)}>
                <Printer className="h-4 w-4" />
                Unduh PDF Slip
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress Batch Processing Modal */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Memproses Payroll Massal</DialogTitle>
            <DialogDescription className="text-xs">
              Sistem sedang mengkalkulasi keterlambatan, alpa, tunjangan, dan lembur untuk periode {selectedPeriod.toUpperCase()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-6">
            <Progress value={processProgress} className="h-2.5" />
            <p className="text-xs text-center font-mono text-muted-foreground">
              Kalkulasi batch payroll: {processProgress}%
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Tambah / Edit Standar Gaji Pangkat */}
      <Dialog open={showStandarDialog} onOpenChange={setShowStandarDialog}>
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden rounded-xl border border-border/70">
          <DialogHeader className="p-4 border-b border-border/70 bg-muted/20">
            <DialogTitle className="text-base font-semibold">
              {standarForm.id ? "Ubah Standar Gaji Pangkat" : "Tambah Tingkatan Pangkat & Golongan"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Atur patokan besaran gaji pokok dan tunjangan untuk Golongan {standarForm.golongan || "baru"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveStandar}>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="stdGolongan" className="text-xs font-medium">Golongan (cth: A/I, B/1, C/II)</Label>
                  <Input
                    id="stdGolongan"
                    placeholder="cth: A/I atau C/III"
                    value={standarForm.golongan}
                    onChange={(e) => setStandarForm({ ...standarForm, golongan: e.target.value })}
                    className="h-9 text-xs font-mono border-border/80 uppercase"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="stdPangkat" className="text-xs font-medium">Nama Pangkat</Label>
                  <Input
                    id="stdPangkat"
                    placeholder="cth: Juru Muda, Penata"
                    value={standarForm.pangkat}
                    onChange={(e) => setStandarForm({ ...standarForm, pangkat: e.target.value })}
                    className="h-9 text-xs border-border/80"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="stdGajiPokok" className="text-xs font-medium">Gaji Pokok Standar (Rp)</Label>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {formatCurrency(Number(standarForm.gajiPokok) || 0)}
                  </span>
                </div>
                <Input
                  id="stdGajiPokok"
                  type="number"
                  min="0"
                  step="50000"
                  value={standarForm.gajiPokok}
                  onChange={(e) => setStandarForm({ ...standarForm, gajiPokok: Number(e.target.value) })}
                  className="h-9 text-xs font-mono border-border/80"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="stdTunjangan" className="text-xs font-medium">Tunjangan Standar (Rp)</Label>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {formatCurrency(Number(standarForm.tunjangan) || 0)}
                  </span>
                </div>
                <Input
                  id="stdTunjangan"
                  type="number"
                  min="0"
                  step="50000"
                  value={standarForm.tunjangan}
                  onChange={(e) => setStandarForm({ ...standarForm, tunjangan: Number(e.target.value) })}
                  className="h-9 text-xs font-mono border-border/80"
                  required
                />
              </div>

              {/* Total Preview Pill */}
              <div className="p-3 bg-muted/40 rounded-lg border border-border/60 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Total Standar THP:</span>
                <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {formatCurrency((Number(standarForm.gajiPokok) || 0) + (Number(standarForm.tunjangan) || 0))}
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="stdKeterangan" className="text-xs font-medium">Keterangan / Kualifikasi (Opsional)</Label>
                <Input
                  id="stdKeterangan"
                  placeholder="cth: Pendidikan SMA, S1, atau Jenjang Eselon"
                  value={standarForm.keterangan}
                  onChange={(e) => setStandarForm({ ...standarForm, keterangan: e.target.value })}
                  className="h-9 text-xs border-border/80"
                />
              </div>
            </div>

            <DialogFooter className="p-4 border-t border-border/70 bg-muted/20 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs border-border/80"
                onClick={() => setShowStandarDialog(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8 text-xs bg-primary text-primary-foreground shadow-xs gap-1.5"
                disabled={isSavingStandar}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {isSavingStandar ? "Menyimpan..." : "Simpan Standar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
